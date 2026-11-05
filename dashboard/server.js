const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const Logger = require('../utils/logger');
const config = require('../config');
const { handleCommand } = require('../core/commandhandler');
const { startBotSystem, spawnSingleBot, removeSingleBot } = require('../core/bot');
const { startDDoS } = require('../core/ddos');
const { showServerInfo } = require('../misc/serverInfo');
const { startServerChat } = require('../misc/serverChat');
const AIHandler = require('../utils/aiHandler');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');
const fs = require('fs');
const proxyManager = require('../core/proxyManager');

let viewerPortBase = 4000;
const PROFILES_PATH = path.join(__dirname, '../profiles.json');

class Dashboard {
    constructor(port = 3000) {
        this.bots = {}; // Map username -> bot
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);

        this.ddosController = null;
        this.relayController = null;

        this.botCounter = 0;

        this.setupExpress();
        this.setupSocket();
        this.patchLogger();
        this.loadProfiles();
    }

    patchLogger() {
        // Broadcast all logs to dashboard
        const originalInfo = Logger.info;
        const originalWarn = Logger.warn;
        const originalError = Logger.error;
        const originalChat = Logger.chat;

        Logger.info = (msg) => {
            originalInfo(msg);
            this.io.emit('log', { type: 'info', message: msg });
        };
        Logger.warn = (msg) => {
            originalWarn(msg);
            this.io.emit('log', { type: 'warn', message: msg });
        };
        Logger.error = (msg, err) => {
            originalError(msg, err);
            this.io.emit('log', { type: 'error', message: `${msg} ${err ? err.message : ''}` });
        };
        Logger.chat = (user, msg) => {
            originalChat(user, msg);
            this.io.emit('log', { type: 'chat', message: `[CHAT] <${user}> ${msg}` });
        };
    }

    loadProfiles() {
        this.profiles = [];
        try {
            if (fs.existsSync(PROFILES_PATH)) {
                this.profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
                // Logger.info(`[DASHBOARD] Loaded ${this.profiles.length} profiles.`);
            } else {
                // Logger.info('[DASHBOARD] No profiles.json found (creating new on save).');
            }
        } catch (e) { Logger.error("Failed to load profiles.json", e); }
    }

    saveProfiles() {
        try {
            fs.writeFileSync(PROFILES_PATH, JSON.stringify(this.profiles, null, 2));
            Logger.info(`[DASHBOARD] Profiles saved to ${PROFILES_PATH}.`);
        } catch (e) {
            Logger.error("Failed to save profiles.json", e);
        }
    }

    addBot(bot) {
        this.bots[bot.username] = bot;

        // Auto-start Viewer
        if (!bot.viewerPort) {
            bot.viewerPort = viewerPortBase++;
            try {
                // Determine version if possible, or leave it to auto-detect (though manual is better for assets)
                // Determine version if possible, or leave it to auto-detect (though manual is better for assets)
                const options = { port: bot.viewerPort, firstPerson: false, viewDistance: 6 };
                if (bot.version) options.version = bot.version;

                mineflayerViewer(bot, options);
                Logger.info(`[MAP] Background viewer for ${bot.username} started on port ${bot.viewerPort}`);
            } catch (e) {
                Logger.error(`[MAP] Failed to start viewer for ${bot.username}: ${e.message}`);
            }
        }

        this.broadcastBotList();
    }

    removeBot(bot) {
        if (this.bots[bot.username]) {
            // Cleanup Viewer logic if needed (prismarine-viewer handles binding to bot 'end')
            delete this.bots[bot.username];
            this.broadcastBotList();
        }
    }

    setupExpress() {
        this.app.use((req, res, next) => {
            if (!req.url.includes('.css') && !req.url.includes('.js')) {
                Logger.info(`[WEB] Incoming Request: ${req.method} ${req.url}`);
            }
            next();
        });

        const publicPath = path.join(__dirname, 'public');
        this.app.use(express.static(publicPath));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(publicPath, 'index.html'));
        });
    }

    setupSocket() {
        this.io.on('connection', (socket) => {
            this.broadcastBotList(socket);
            this.broadcastPlayerList(socket);
            socket.emit('profilesList', this.profiles);

            socket.on('saveProfile', (profile) => {
                const idx = this.profiles.findIndex(p => p.name === profile.name);
                if (idx >= 0) this.profiles[idx] = profile;
                else this.profiles.push(profile);
                this.saveProfiles();
                this.io.emit('profilesList', this.profiles);
            });

            socket.on('deleteProfile', (name) => {
                this.profiles = this.profiles.filter(p => p.name !== name);
                this.saveProfiles();
                this.io.emit('profilesList', this.profiles);
            });

            socket.on('requestMap', (data) => {
                const bot = this.bots[data.username];
                if (bot && bot.viewerPort) {
                    socket.emit('mapReady', { url: `http://localhost:${bot.viewerPort}`, username: bot.username });
                } else if (bot) {
                    // Fallback
                    bot.viewerPort = viewerPortBase++;
                    const options = { port: bot.viewerPort };
                    if (bot.version) options.version = bot.version;

                    try {
                        mineflayerViewer(bot, options);
                        socket.emit('mapReady', { url: `http://localhost:${bot.viewerPort}`, username: bot.username });
                    } catch (e) {
                        Logger.error(`[MAP] Failed to start viewer fallback: ${e.message}`);
                    }
                }
            });

            // Proxy Events
            socket.on('proxyAction', async (data) => {
                proxyManager.load();

                if (data.action === 'refresh') {
                    // Logger.info(`[DASHBOARD] Sending Proxy List: ${proxyManager.proxies.size} proxies.`);
                    socket.emit('proxyUpdate', { count: proxyManager.proxies.size, status: 'IDLE', list: Array.from(proxyManager.proxies) });
                }
                else if (data.action === 'verify') {
                    socket.emit('proxyUpdate', { count: proxyManager.proxies.size, status: 'VERIFYING...', list: [] });
                    const working = await proxyManager.verifyAll();
                    socket.emit('proxyUpdate', { count: working, status: 'IDLE', list: Array.from(proxyManager.proxies) });
                }
                else if (data.action === 'enrich') {
                    socket.emit('proxyUpdate', { count: proxyManager.proxies.size, status: 'ENRICHING...', list: [] });
                    await proxyManager.downloadProxies(data.target);
                    const working = await proxyManager.verifyAll();
                    socket.emit('proxyUpdate', { count: working, status: 'IDLE', list: Array.from(proxyManager.proxies) });
                }
                else if (data.action === 'upload') {
                    const lines = data.list.split('\n');
                    lines.forEach(l => {
                        if (l.trim()) proxyManager.proxies.add(l.trim());
                    });
                    proxyManager.save();
                    socket.emit('proxyUpdate', { count: proxyManager.proxies.size, status: 'QUEUED', list: Array.from(proxyManager.proxies) });
                }
            });

            // Initial status
            proxyManager.load();
            socket.emit('proxyUpdate', { count: proxyManager.proxies.size, status: 'IDLE', list: Array.from(proxyManager.proxies) });


            socket.on('command', (data) => {
                this.handleCommand(data);
            });

            socket.on('chat', (message) => {
                const botNames = Object.keys(this.bots);
                if (botNames.length > 0) {
                    this.bots[botNames[0]].chat(message);
                }
            });

            socket.on('requestDDoS', async (params) => {
                if (params.action === 'start') {
                    if (this.ddosController) this.ddosController.stop();
                    this.ddosController = await startDDoS(params, this);
                } else if (params.action === 'stop') {
                    if (this.ddosController) {
                        this.ddosController.stop();
                        this.ddosController = null;
                    }
                }
            });

            socket.on('requestIntel', (params) => {
                showServerInfo(params, this);
            });

            socket.on('requestRelay', async (params) => {
                if (params.action === 'start') {
                    if (this.relayController) this.relayController.stop();
                    this.relayController = await startServerChat(params, this);
                } else if (params.action === 'stop') {
                    if (this.relayController) {
                        this.relayController.stop();
                        this.relayController = null;
                    }
                }
            });

            const { scanPlugins } = require('../misc/pluginScanner');

            // ... inside socket connection ...

            socket.on('requestPluginScan', (data) => {
                scanPlugins(data, this);
            });

            socket.on('requestAddBot', (data) => {
                const count = parseInt(data.count) || 1;
                const prefix = data.namePrefix || 'Bot';

                for (let i = 0; i < count; i++) {
                    let index = 0;
                    while (true) {
                        const candidate = `${prefix}_${index}`;
                        if (!this.bots[candidate]) {
                            break;
                        }
                        index++;
                    }

                    const uniqueUser = `${prefix}_${index}`;
                    this.bots[uniqueUser] = {
                        username: uniqueUser,
                        health: 20,
                        food: 20,
                        inventory: [],
                        host: data.ip,
                        port: data.port
                    };

                    spawnSingleBot({
                        ip: data.ip,
                        port: data.port,
                        username: uniqueUser,
                        version: data.version
                    }, this);
                }
            });

            socket.on('requestRemoveBot', (data) => {
                removeSingleBot(data.username);
            });

            socket.on('requestBlockList', () => {
                socket.emit('blockList', []);
            });

            socket.on('dropItem', async (data) => {
                const { username, itemName } = data;
                const bot = this.bots[username];
                if (!bot) return;

                const item = bot.inventory.items().find(i => i.name === itemName);
                if (item) {
                    try {
                        await bot.tossStack(item);
                        Logger.info(`[DASHBOARD] ${username} dropped ${itemName}`);
                    } catch (err) {
                        Logger.error(`[DASHBOARD] Failed to drop item: ${err.message}`);
                    }
                }
            });

            socket.on('equipItem', async (data) => {
                const { username, itemName } = data;
                const bot = this.bots[username];
                if (!bot) return;

                const item = bot.inventory.items().find(i => i.name === itemName);
                if (item) {
                    try {
                        await bot.equip(item, 'hand');
                        Logger.info(`[DASHBOARD] ${username} equipped ${itemName}`);
                    } catch (err) {
                        Logger.error(`[DASHBOARD] Failed to equip item: ${err.message}`);
                    }
                }
            });
        });
    }

    broadcastBotList(socket = this.io) {
        // Safe check for inventory
        const botList = Object.values(this.bots).map(bot => {
            // Helper to get item in slot
            const getItem = (slot) => (bot.inventory && bot.inventory.slots && bot.inventory.slots[slot])
                ? { name: bot.inventory.slots[slot].name, count: bot.inventory.slots[slot].count }
                : null;

            return {
                username: bot.username,
                health: bot.health,
                food: bot.food,
                host: bot.host || '?',
                port: bot.port || '?',
                inventory: (bot.inventory && typeof bot.inventory.items === 'function')
                    ? bot.inventory.items().map(i => ({ name: i.name, count: i.count }))
                    : [],
                equipment: {
                    head: getItem(5),
                    chest: getItem(6),
                    legs: getItem(7),
                    feet: getItem(8),
                    offhand: getItem(45),
                    mainhand: bot.heldItem ? { name: bot.heldItem.name, count: bot.heldItem.count } : null
                }
            };
        });
        socket.emit('botListUpdate', botList);
    }

    broadcastPlayerList(socket = null) {
        const botNames = Object.keys(this.bots);
        if (botNames.length === 0) return;

        // Use the first bot as the source of truth for the player list
        const bot = this.bots[botNames[0]];
        if (!bot || !bot.players) return;

        const players = Object.values(bot.players).map(p => ({
            username: p.username,
            ping: p.ping,
            entity: p.entity ? { position: p.entity.position } : null,
            // Simple bot detection logic
            isBot: this.bots[p.username] !== undefined
        }));

        if (socket) {
            socket.emit('playerList', players);
        } else {
            this.io.emit('playerList', players);
        }
    }

    sendUpdate() {
        this.broadcastBotList();
        this.broadcastPlayerList();
    }

    handleCommand(data) {
        const targets = data.targets || [];
        const action = data.action;
        const args = data.args || {};

        if (action === 'move' || action === 'jump' || action === 'follow' || action === 'goto') {
            Object.values(this.bots).forEach(bot => {
                if (targets.includes(bot.username) || targets.includes('all')) {
                    this.executeCommand(bot, action, args);
                }
            });
            return;
        }

        const targetedBots = Object.values(this.bots).filter(bot =>
            targets.includes(bot.username) || targets.includes('all')
        );

        if (targetedBots.length === 0) return;

        // Smart AI Logic: Only one bot should reply to AI requests to prevent spam
        if ((action === '!ai' || action === '!aichat' || action === 'ai' || action === 'aichat') && targetedBots.length > 1) {
            const chosenOne = targetedBots[0];
            Logger.info(`[DASHBOARD] Multiplayer AI Request: Delegating to ${chosenOne.username} (muting others).`);

            // Execute only on the first bot
            this.executeCommand(chosenOne, action, args);

            // Special case for AI command, we need to construct the message properly for the single bot
            // Re-using the logic below but just for one bot
            let commandString = action.startsWith('!') ? action.substring(1) : action;
            if (args.fullCommand) commandString = args.fullCommand.replace(/^!/, '');
            else if (args.input) commandString += ` ${args.input}`;
            else if (args.message) commandString += ` ${args.message}`;

            const message = `@${chosenOne.username} ${commandString}`;
            if (message) {
                chosenOne.chat(message);
            }
            return;
        }

        // Custom Chat Action
        if (action === 'say') {
            targetedBots.forEach(bot => {
                if (args.message) bot.chat(args.message);
            });
            return;
        }

        let commandString = action.startsWith('!') ? action.substring(1) : action;

        // Construct command string based on args
        if (args.fullCommand) {
            commandString = args.fullCommand.replace(/^!/, '');
        } else {
            // Append arguments
            if (args.input) commandString += ` ${args.input}`;
            else if (args.username) commandString += ` ${args.username}`;
            else if (args.message) commandString += ` ${args.message}`;

            // Specific overrides for multi-arg commands
            if (action === 'mine' && args.count) commandString += ` ${args.count}`;
            if (action === 'drop' && args.count) commandString += ` ${args.count}`;
        }

        const botsArray = targetedBots;
        const message = `@all ${commandString}`;

        Logger.info(`[DASHBOARD] Executing: ${message}`);
        handleCommand(botsArray, "Dashboard", message);
    }

    executeCommand(bot, action, args) {
        let message = '';

        // Ensure proper syntax: !username command args
        const target = `!${bot.username.toLowerCase()}`;

        if (action === 'goto') {
            message = `${target} goto ${args.x} ${args.y} ${args.z}`;
        }
        else if (action === 'follow') {
            message = `${target} follow ${args.input}`;
        }
        else if (action === 'mine') {
            message = `${target} mine ${args.input} ${args.count || 1}`;
        }
        else if (action === 'stop') {
            message = `${target} stop`;
        }
        else if (action === 'drop') {
            message = `${target} drop ${args.itemName}`;
        }
        else if (action === 'soak') {
            message = `${target} soak`;
        }
        // Fallback for generic commands
        else {
            // For any other action not explicitly handled above, assume it maps directly
            // e.g. pvp, guard, etc.
            let commandString = action.startsWith('!') ? action.substring(1) : action;
            if (args.input) commandString += ` ${args.input}`;

            message = `${target} ${commandString}`;
        }

        if (message) {
            bot.chat(message);
        }

        if (action === 'move' && args.dir) {
            bot.setControlState(args.dir, true);
            setTimeout(() => bot.setControlState(args.dir, false), 300);
        } else if (action === 'jump') {
            bot.setControlState('jump', true);
            bot.setControlState('jump', false);
        }
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.on('error', (e) => {
                if (e.code === 'EADDRINUSE') {
                    Logger.error(`Dashboard failed to start: Port ${this.port} is already in use.`);
                    Logger.warn('Please close any other instances of the bot or clear port 3000.');
                    resolve();
                } else {
                    Logger.error(`Dashboard server error: ${e.message}`);
                    reject(e);
                }
            });

            this.server.listen(this.port, '0.0.0.0', () => {
                const { getLocalIP } = require('../utils/network');
                const localIP = getLocalIP();
                Logger.info(`Dashboard online.`);
                console.log(`    > Local:   http://localhost:${this.port}`);
                console.log(`    > Network: http://${localIP}:${this.port}`);
                resolve();
            });
        });
    }
}

module.exports = Dashboard;
