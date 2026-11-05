const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const autoeat = require('mineflayer-auto-eat');
const config = require('../config');
const Logger = require('../utils/logger');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');
const { setupPathfinding } = require('./movement');
const { handleCommand } = require('./commandhandler');
const { fancyChat } = require('./fancy_chat');
const { initPvp } = require('../combat/pvp');
const { initGuard } = require('../combat/guard');
const { initAntiKnockback } = require('../combat/antiKnockback');
const { initXray } = require('../utils/xray');
const { equipBestArmor, equipTotem } = require('../item/armor');
const { getBestWeapon } = require('../utils/autoTools');
const { eatGappleAndRun } = require('../combat/combat');
const { ask } = require('../utils/ui');
const BotManager = require('./BotManager');

async function spawnSingleBot(params, dashboard) {
    const { ip, port, username, version } = params;

    const botVersion = (version === 'auto' || !version) ? false : version;

    let bot;
    try {
        bot = mineflayer.createBot({
            host: ip,
            port: parseInt(port),
            username: username,
            version: botVersion,
            hideErrors: true
        });
        bot.setMaxListeners(20);
    } catch (err) {
        Logger.error(`Error creating bot ${username}: ${err.message}`);
        return null;
    }

    BotManager.add(bot);

    try {
        bot.crafting = require('../item/crafting.js')(bot);
    } catch (e) {
        Logger.warn(`Could not load crafting module: ${e.message}`);
    }

    bot.removeAllListeners('chat');
    bot.on('chat', (sender, message) => {
        const leader = BotManager.getLeader();
        if (!leader || bot.username !== leader.username) return;

        Logger.chat(sender, message);
        if (dashboard) dashboard.io.emit('chatMessage', { username: sender, message });

        if (BotManager.has(sender) && !['!', '@', '#'].some(prefix => message.startsWith(prefix))) return;
        if (message.startsWith('Killed')) return;

        (async () => {
            try {
                await handleCommand(BotManager.getAll(), sender, message);
            } catch (error) {
                Logger.error(`Unhandled error in handleCommand:`, error);
                fancyChat(bot, "An internal error occurred.");
            }
        })();
    });

    bot.globals = {
        guardRange: config.globals.guardRange,
        isEatingGapple: false,
        isAutoBridging: false,
        isAutoBridgingActive: false,
        isTowering: false,
        isPathfinding: false,
        isAFK: false
    };

    try {
        bot.loadPlugin(pathfinder);
        bot.loadPlugin(autoeat.loader);
        bot.loadPlugin(require('mineflayer-tool').plugin);
        bot.loadPlugin(require('mineflayer-pvp').plugin);
        initGuard(bot);
        initAntiKnockback(bot);
        initXray(bot);
    } catch (error) {
        Logger.error(`Error loading plugins for ${bot.username}:`, error);
    }

    bot.once('spawn', () => {
        Logger.success(`${bot.username} deployed to ${ip}:${port}.`);

        setupPathfinding(bot);
        initPvp(bot);

        if (bot.player.gamemode === 1) bot.creative.startFlying();
        if (bot.autoEat) {
            bot.autoEat.options = config.autoEat;
        } else {
            Logger.warn('AutoEat plugin not loaded correctly.');
        }

        if (dashboard) {
            dashboard.addBot(bot);
            bot.on('health', () => dashboard.sendUpdate());
            bot.on('food', () => dashboard.sendUpdate());
            bot.on('spawn', () => {
                dashboard.addBot(bot);
                dashboard.sendUpdate();
            });
            bot.inventory.on('updateSlot', () => dashboard.sendUpdate());
        }

        setInterval(async () => {
            if (bot.globals.isTowering || bot.globals.isPathfinding || bot.globals.isEatingGapple) return;

            if (bot.health < 10) {
                await eatGappleAndRun(bot);
                return;
            }

            await equipBestArmor(bot);
            await equipTotem(bot);

            if (bot.pvp.isFighting && !bot.globals.isTowering) {
                const bestWeapon = getBestWeapon(bot);
                if (bestWeapon && (!bot.heldItem || bot.heldItem.name !== bestWeapon.name)) {
                    try { await bot.equip(bestWeapon, 'hand'); } catch (err) { }
                }
            }
        }, 500);

        setInterval(() => {
            if (bot.globals.isAFK && !bot.movement.isMoving()) {
                const actions = ['jump', 'left', 'right', 'forward', 'back'];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                bot.setControlState(randomAction, true);
                setTimeout(() => bot.setControlState(randomAction, false), 50);
            }
        }, 5000);
    });

    bot.on('playerLeft', (player) => {
        if (bot.pvp.target && bot.pvp.target.username === player.username) {
            bot.pvp.stop();
            fancyChat(bot, `Stopped PvP with ${player.username} because they left.`);
        }
    });

    bot.on('death', () => bot.respawn());
    bot.on('error', (err) => Logger.error(`${bot.username} error: ${err.message}`));

    bot.on('end', () => {
        if (dashboard) dashboard.removeBot(bot);
        Logger.warn(`${bot.username} disconnected.`);
        BotManager.remove(bot.username);
    });

    return bot;
}

function removeSingleBot(username) {
    const success = BotManager.remove(username);
    if (success) {
        Logger.info(`Ordered shutdown for ${username}.`);
        return true;
    }
    return false;
}

async function startBotSystem(mainMenuCallback, dashboard) {
    const promptColors = ['#00ffff', '#ffffff'];
    const ip = await ask('Target IP', promptColors, config.bot.defaultIp);
    const port = await ask('Target Port', promptColors, config.bot.defaultPort);
    const numBots = parseInt(await ask('Fleet Size', promptColors, '1'));
    console.log('');

    for (let i = 0; i < numBots; i++) {
        spawnSingleBot({
            ip,
            port,
            username: `Bot_${i}_CLI`
        }, dashboard);
    }
}

module.exports = { startBotSystem, spawnSingleBot, removeSingleBot };
