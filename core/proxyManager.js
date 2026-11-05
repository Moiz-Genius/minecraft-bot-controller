const fs = require('fs');
const axios = require('axios');
const chalk = new (require('chalk')).Chalk();
const net = require('net');
const config = require('../config');
const Logger = require('../utils/logger');
const { gradientText, ask } = require('../utils/ui');

// Sources for auto-enrichment (Using public APIs)
const PROXY_SOURCES = [
    'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt',
    'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
    'https://raw.githubusercontent.com/rdavydov/proxy-list/main/proxies/socks5.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt',
    'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/socks5.txt'
];

const PROXY_FILE = 'proxies.txt';

class ProxyManager {
    constructor() {
        this.proxies = new Set();
    }

    // Load from disk
    load() {
        this.proxies.clear();
        if (fs.existsSync(PROXY_FILE)) {
            const lines = fs.readFileSync(PROXY_FILE, 'utf-8').split('\n');
            lines.forEach(line => {
                const clean = line.trim();
                if (clean) this.proxies.add(clean);
            });
        }
    }

    save() {
        fs.writeFileSync(PROXY_FILE, Array.from(this.proxies).join('\n'));
    }

    // New method: Fetch raw candidates WITHOUT adding to verified pool
    async fetchRawCandidates() {
        Logger.info(`Fetching fresh proxy lists...`);
        const candidates = new Set();

        for (const source of PROXY_SOURCES) {
            try {
                const res = await axios.get(source, { timeout: 5000 });
                const list = res.data.split(/\r?\n/);
                list.forEach(p => {
                    const clean = p.trim();
                    if (clean && clean.includes(':')) candidates.add(clean);
                });
                Logger.info(`Fetched source, candidates: ${candidates.size}`);
            } catch (e) {
                Logger.warn(`Source failed: ${source.substring(0, 30)}...`);
            }
        }
        return Array.from(candidates);
    }

    // New method: Smart Enrichment
    async enrich(targetTotal) {
        this.load();
        if (this.proxies.size >= targetTotal) {
            Logger.info(`Pool already has ${this.proxies.size} proxies (Target: ${targetTotal}). Skipping enrichment.`);
            return;
        }

        const candidates = await this.fetchRawCandidates();

        // Remove ones we already have
        const newCandidates = candidates.filter(p => !this.proxies.has(p));

        // Shuffle candidates to avoid bias
        for (let i = newCandidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newCandidates[i], newCandidates[j]] = [newCandidates[j], newCandidates[i]];
        }

        Logger.info(`Testing ${newCandidates.length} new candidates to find ${targetTotal - this.proxies.size} more...`);

        const concurrency = 100;
        let tested = 0;
        let added = 0;

        // Loop until target met or out of candidates
        for (let i = 0; i < newCandidates.length; i += concurrency) {
            if (this.proxies.size >= targetTotal) break;

            const batch = newCandidates.slice(i, i + concurrency);
            const promises = batch.map(p => this.checkProxy(p));
            const results = await Promise.all(promises);

            results.forEach(p => {
                if (p && !this.proxies.has(p)) {
                    this.proxies.add(p);
                    added++;
                }
            });

            tested += batch.length;
            this.save(); // Save progress

            // Console update
            process.stdout.write(`\r[ENRICH] Tested: ${tested}/${newCandidates.length} | Added: ${added} | Pool: ${this.proxies.size}/${targetTotal}`);

            if (this.proxies.size >= targetTotal) {
                console.log(chalk.green('\n[ENRICH] Target Verified Count Reached!'));
                break;
            }
        }
        console.log('\n');
    }

    // Legacy download method (kept for compatibility but redirects to enrich)
    async downloadProxies(targetCount) {
        return this.enrich(targetCount);
    }

    async verifyAll(maxConcurrency = 50) {
        this.load(); // Refresh from disk
        const allProxies = Array.from(this.proxies);
        this.proxies.clear(); // Will add back only working ones

        let verifiedCount = 0;
        let processed = 0;
        const total = allProxies.length;

        console.log(chalk.hex('#00ffff')(`\n[PROXY] Re-verifying ${total} known proxies...`));

        for (let i = 0; i < total; i += maxConcurrency) {
            const batch = allProxies.slice(i, i + maxConcurrency);
            const promises = batch.map(proxy => this.checkProxy(proxy, 2000)); // Shorter timeout for re-check

            const results = await Promise.all(promises);
            results.forEach(p => {
                if (p) {
                    this.proxies.add(p);
                    verifiedCount++;
                }
            });

            processed += batch.length;
            process.stdout.write(`\r[PROXY] Progress: ${Math.round((processed / total) * 100)}% | Working: ${verifiedCount}`);
        }

        console.log('\n');
        this.save();
        return verifiedCount;
    }

    checkProxy(proxy, timeout = 3000) {
        return new Promise((resolve) => {
            const parts = proxy.split(':');
            if (parts.length < 2) return resolve(null);

            const [host, port] = parts;
            const socket = new net.Socket();

            socket.setTimeout(timeout);

            socket.connect(parseInt(port), host, () => {
                socket.destroy();
                resolve(proxy);
            });

            socket.on('error', () => {
                socket.destroy();
                resolve(null);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(null);
            });
        });
    }

    async interactiveManager(mainMenuCallback) {
        console.clear();
        console.log(gradientText('--- PROXY NEXUS ---', ['#00ffff', '#ff00ff']));

        this.load();
        console.log(`Current Pool Size: ${this.proxies.size}`);

        const mode = await ask('Directive [VERIFY/ENRICH/BACK]', ['#00ffff', '#fff'], 'VERIFY');

        if (mode.toUpperCase() === 'BACK') {
            mainMenuCallback();
            return;
        }

        if (mode.toUpperCase() === 'ENRICH') {
            const targetStr = await ask('Target Working Count', ['#00f3ff', '#fff'], '50');
            const target = parseInt(targetStr);
            console.log(chalk.cyan(`Optimization: Will fetching candidates and stop once ${target} working proxies are found.`));
            await this.enrich(target);
        } else {
            // Verify existing
            await this.verifyAll();
            console.log(chalk.green(`Verification Complete. Working Proxies: ${this.proxies.size}`));
        }

        setTimeout(() => this.interactiveManager(mainMenuCallback), 2000);
    }
}

module.exports = new ProxyManager();
