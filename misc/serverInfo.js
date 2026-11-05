const util = require('minecraft-server-util');
const chalk = new (require('chalk')).Chalk();
const config = require('../config');
const Logger = require('../utils/logger');
const { gradientText, ask } = require('../utils/ui');

const mc = require('minecraft-protocol');
const { SocksProxyAgent } = require('socks-proxy-agent');

async function showServerInfo(params = null, dashboard = null) {
    let ip, port, proxy;

    if (params) {
        ip = params.ip;
        port = parseInt(params.port) || 25565;
        proxy = params.proxy;
    } else {
        const cyanMagenta = ['#00ffff', '#ff00ff'];
        console.log(gradientText('\n--- SERVER INTELLIGENCE ---', cyanMagenta));
        const promptColors = ['#00ffff', '#ffffff'];
        ip = await ask('Target IP', promptColors, config.bot.defaultIp);
        port = await ask('Target Port', promptColors, config.bot.defaultPort);
    }

    if (!params) Logger.info(`Gathering Intel on ${ip}:${port}${proxy ? ` via ${proxy}` : ''}...`);

    try {
        let intelData = {};

        if (proxy) {
            // Proxy Logic using minecraft-protocol
            const agent = new SocksProxyAgent(`socks5://${proxy}`);
            const result = await mc.ping({ host: ip, port: parseInt(port), agent, version: false }); // Auto-detect version

            // Normalize data
            let motd = "Unknown";
            if (typeof result.description === 'string') motd = result.description;
            else if (result.description && result.description.text) motd = result.description.text; // extra.clean text logic is complex, keeping simple for now

            intelData = {
                ip, port,
                motd: motd.replace(/§[0-9a-fk-or]/g, '').trim(), // Basic strip codes
                version: result.version?.name || "Unknown",
                online: result.players?.online || 0,
                max: result.players?.max || 0,
                latency: result.latency,
                players: result.players?.sample || []
            };

        } else {
            // Standard Logic using minecraft-server-util
            const result = await util.status(ip, parseInt(port));

            intelData = {
                ip, port,
                motd: result.motd.clean,
                version: result.version.name,
                online: result.players.online,
                max: result.players.max,
                latency: result.roundTripLatency,
                players: result.players.sample || []
            };
        }

        if (dashboard) {
            dashboard.io.emit('intelResult', intelData);
        }

        if (!params) {
            console.log(chalk.hex('#00ffff')('\n--- INTELLIGENCE SUMMARY ---'));
            console.log(chalk.white(`MOTD:    `) + chalk.hex('#ff00ff')(intelData.motd));
            console.log(chalk.white(`Version: `) + chalk.hex('#ff00ff')(intelData.version));
            console.log(chalk.white(`Players: `) + chalk.hex('#ff00ff')(`${intelData.online}/${intelData.max}`));
            console.log(chalk.white(`Latency: `) + chalk.hex('#ff00ff')(`${intelData.latency}ms`));

            if (intelData.players.length > 0) {
                console.log(chalk.hex('#00ffff')('\nIdentified Entities:'));
                intelData.players.forEach(p => console.log(chalk.gray(`- ${p.name} (ID: ${p.id})`)));
            }
            console.log(chalk.hex('#00ffff')('----------------------------\n'));
            require('readline-sync').question('Press Enter to continue...');
        }

    } catch (error) {
        const msg = `Intel gathering failed: ${error.message}`;
        if (dashboard) dashboard.io.emit('intelError', { message: error.message });

        if (!params) {
            Logger.error(msg);
            require('readline-sync').question('Press Enter to continue...');
        }
    }
}

module.exports = { showServerInfo };
