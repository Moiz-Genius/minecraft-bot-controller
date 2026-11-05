const mineflayer = require('mineflayer');
const chalk = new (require('chalk')).Chalk();
const config = require('../config');
const Logger = require('../utils/logger');
const { gradientText, ask } = require('../utils/ui');

async function startServerChat(params = null, dashboard = null) {
    let ip, port;

    if (params) {
        ip = params.ip;
        port = params.port;
    } else {
        const cyanMagenta = ['#00ffff', '#ff00ff'];
        console.log(gradientText('\n--- RELAY INTERCEPT ---', cyanMagenta));

        const promptColors = ['#00ffff', '#ffffff'];
        ip = await ask('Target IP', promptColors, config.bot.defaultIp);
        port = await ask('Target Port', promptColors, config.bot.defaultPort);

        Logger.info(`Tapping into comms @ ${ip}:${port}...`);
        console.log(chalk.hex('#00ffff')('Press Ctrl+C to disconnect wiretap.'));
    }

    return new Promise((resolve) => {
        let chatBot;
        try {
            chatBot = mineflayer.createBot({
                host: ip,
                port: parseInt(port),
                username: 'Wiretap_' + Math.floor(Math.random() * 1000),
                hideErrors: true
            });
        } catch (err) {
            const msg = `Tap installation failed: ${err.message}`;
            if (dashboard) dashboard.io.emit('relayLog', { type: 'error', message: msg });
            else Logger.error(msg);
            resolve();
            return;
        }

        chatBot.on('chat', (username, message) => {
            const timestamp = new Date().toLocaleTimeString();
            if (dashboard) {
                dashboard.io.emit('relayLog', { type: 'chat', username, message, timestamp });
            }

            if (!params) {
                console.log(chalk.hex('#00ffff')(`[${timestamp}] `) + chalk.hex('#ff00ff')(`<${username}> `) + chalk.white(message));
            }
        });

        chatBot.on('error', (err) => {
            if (dashboard) dashboard.io.emit('relayLog', { type: 'error', message: err.message });
            else Logger.error(`Wiretap error: ${err.message}`);
            chatBot.end();
        });

        chatBot.on('end', (reason) => {
            if (dashboard) dashboard.io.emit('relayLog', { type: 'system', message: `Signal lost: ${reason}` });
            else {
                Logger.warn(`Signal lost. Reason: ${reason}`);
                console.log(chalk.hex('#ffd700')('Returning to base...'));
            }
            resolve();
        });

        if (params && dashboard) {
            resolve({
                stop: () => {
                    chatBot.end();
                    if (dashboard) dashboard.io.emit('relayLog', { type: 'system', message: 'Wiretap disconnected by operator.' });
                }
            });
            return;
        }

        chatBot.once('spawn', () => {
            Logger.success(`Successfully connected to ${ip}:${port}. Live chat stream started.`);
        });
    });
}

module.exports = { startServerChat };
