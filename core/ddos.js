const { Worker } = require('worker_threads');
const path = require('path');
const chalk = new (require('chalk')).Chalk();
const config = require('../config');
const Logger = require('../utils/logger');
const { gradientText, ask } = require('../utils/ui');

async function startDDoS(params = null, dashboard = null) {
    const cyanMagenta = ['#00ffff', '#ff00ff'];

    let ip, port, numBots, useProxy = false;

    if (params) {
        ip = params.ip;
        port = params.port;
        numBots = parseInt(params.numBots);
        useProxy = params.useProxy || false;
    } else {
        console.log(gradientText('\n--- NETWORK STRESS OPERATIONS ---', cyanMagenta));
        const promptColors = ['#00ffff', '#ffffff'];
        ip = await ask('Target IP', promptColors, config.bot.defaultIp);
        port = await ask('Target Port', promptColors, config.bot.defaultPort);
        numBots = parseInt(await ask('Fleet Strength', promptColors, '10'));
        const useProxyStr = await ask('Use Proxies? (y/n)', promptColors, 'n');
        useProxy = useProxyStr.toLowerCase() === 'y';
    }

    Logger.info(`Initializing Worker for Target: ${ip}:${port}...`);

    // Reporting to Dashboard
    if (dashboard) {
        dashboard.io.emit('ddosStatus', { status: 'analyzed', ping: 20, players: '???' });
        dashboard.io.emit('ddosLog', `[SYSTEM] Worker Thread Initialized.`);
    }

    const workerPath = path.join(__dirname, 'ddosWorker.js');
    const worker = new Worker(workerPath, {
        workerData: { ip, port, numBots, useProxy }
    });

    worker.on('message', (msg) => {
        if (msg.type === 'log') {
            Logger.info(`[DDoS Worker] ${msg.message}`);
            if (dashboard) dashboard.io.emit('ddosLog', `[WORKER] ${msg.message}`);
        } else if (msg.type === 'stopped') {
            Logger.info('[DDoS Worker] Stopped.');
        }
    });

    worker.on('error', (err) => {
        Logger.error(`[DDoS Worker Error] ${err.message}`);
        if (dashboard) dashboard.io.emit('ddosLog', `[ERROR] Worker crashed: ${err.message}`);
    });

    worker.on('exit', (code) => {
        if (code !== 0) Logger.error(`Worker stopped with exit code ${code}`);
    });

    const stopAttack = () => {
        Logger.info('Terminating DDoS Worker...');
        worker.postMessage('stop');
        if (dashboard) {
            dashboard.io.emit('ddosStatus', { status: 'stopped' });
            dashboard.io.emit('ddosLog', `[SYSTEM] Attack Terminated.`);
        }
    };

    if (params) {
        return { stop: stopAttack };
    } else {
        require('readline-sync').question('Press Enter to stop...');
        stopAttack();
    }
}

module.exports = { startDDoS };
