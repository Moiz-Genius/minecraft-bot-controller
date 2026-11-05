const mineflayer = require('mineflayer');
const Logger = require('../utils/logger');

function scanPlugins(params, dashboard) {
    let ip, port;

    if (params && params.ip) {
        ip = params.ip;
        port = params.port;
    } else {
        const cyanMagenta = ['#00ffff', '#ff00ff'];
        console.log(require('../utils/ui').gradientText('\n--- PLUGIN INTERCEPTOR ---', cyanMagenta));
        // Note: pluginScanner.js seems to be called with params from index.js usually, 
        // but adding CLI prompts for consistency if called directly or modified.
    }

    const username = `ScanBot_${Math.floor(Math.random() * 1000)}`;
    const targetPort = parseInt(port) || 25565;

    Logger.info(`[PLUGIN INTERCEPT] Deploying probe ${username} to ${ip}:${targetPort}`);

    const bot = mineflayer.createBot({
        host: ip,
        port: targetPort,
        username: username,
        hideErrors: true
    });

    let active = true;
    let timeout = null;

    const cleanup = () => {
        if (!active) return;
        active = false;
        if (timeout) clearTimeout(timeout);
        try { bot.end(); } catch (e) { }
    };

    // Timeout Safety (20 seconds)
    timeout = setTimeout(() => {
        if (active) {
            Logger.warn(`[PLUGIN SCAN] Timeout waiting for plugin list.`);
            dashboard.io.emit('pluginResult', { error: 'Timeout: Server did not respond with plugin list.' });
            cleanup();
        }
    }, 20000);

    bot.on('spawn', () => {
        Logger.info(`[PLUGIN SCAN] Probe spawned. Sending query...`);
        // Wait a bit longer to ensure server is ready to receive commands
        setTimeout(() => {
            if (active) bot.chat('/plugins');
        }, 2000);
    });

    bot.on('message', (jsonMsg) => {
        if (!active) return;
        const msg = jsonMsg.toString();
        const cleanMsg = msg.replace(/§[0-9a-fk-or]/g, '');

        // Heuristic detection of plugin response
        // Common formats: 
        // 1. "Plugins (3): One, Two, Three"
        // 2. "Server Plugins: One, Two"
        // 3. "Plugins: \n One, Two" (Rare but possible)

        if (cleanMsg.includes('Plugins') || cleanMsg.includes('plugins')) {
            Logger.info(`[PLUGIN SCAN] Potential match: ${cleanMsg}`);

            let list = [];
            const parts = cleanMsg.split(':');

            if (parts.length > 1) {
                const afterColon = parts.slice(1).join(':').trim();
                if (afterColon.length > 0) {
                    list = afterColon.split(',').map(s => s.trim()).filter(s => s.length > 0);
                } else {
                    // It ended with a colon, maybe the list is next? 
                    // For now, let's wait for the next message or just report what we have.
                    // But usually, servers put it on the same line. 
                    // If it's empty, we might have caught a header "Plugins (5):"
                    return; // Wait for next message if this was just a header? 
                    // Actually, let's treat it as a trigger to look closely at the NEXT message?
                    // For simplicity, if we get a header but no content, we assume list is coming or empty.
                }
            } else {
                // No colon found, maybe just a list? Unlikely to start with "Plugins" without colon.
            }

            if (list.length > 0) {
                Logger.success(`[PLUGIN SCAN] Parsed ${list.length} plugins.`);
                dashboard.io.emit('pluginResult', { plugins: list });
                cleanup();
            } else if (cleanMsg.includes('Plugins (0)')) {
                dashboard.io.emit('pluginResult', { plugins: ["No plugins installed"] });
                cleanup();
            }
        }
        // Fallback: If we see a message with many commas shortly after /plugins, it might be the list
        else if (cleanMsg.split(',').length > 3) {
            const list = cleanMsg.split(',').map(s => s.trim());
            dashboard.io.emit('pluginResult', { plugins: list });
            cleanup();
        }
    });

    bot.on('kicked', (reason) => {
        if (active) {
            dashboard.io.emit('pluginResult', { error: `Kicked: ${reason}` });
            cleanup();
        }
    });

    bot.on('error', (err) => {
        if (active) {
            // Suppress connection reset errors if we already decided to disconnect
            if (err.code === 'ECONNRESET' && !active) return;
            dashboard.io.emit('pluginResult', { error: `Connection Error: ${err.message}` });
            cleanup();
        }
    });
}

module.exports = { scanPlugins };
