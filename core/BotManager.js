const Logger = require('../utils/logger');

class BotManager {
    constructor() {
        this.bots = [];
    }

    add(bot) {
        this.bots.push(bot);
        // Remove circular reference hack if it existed
        // bot.bots = this.bots; 
        Logger.debug(`[BotManager] Bot added. Total: ${this.bots.length}`);
    }

    remove(username) {
        const index = this.bots.findIndex(b => b.username === username);
        if (index !== -1) {
            const bot = this.bots[index];
            try {
                bot.end();
            } catch (e) { }
            this.bots.splice(index, 1);
            Logger.debug(`[BotManager] Bot ${username} removed. Total: ${this.bots.length}`);
            return true;
        }
        return false;
    }

    get(username) {
        return this.bots.find(b => b.username === username);
    }

    getAll() {
        return this.bots;
    }

    getLeader() {
        return this.bots.length > 0 ? this.bots[0] : null;
    }

    has(username) {
        return this.bots.some(b => b.username === username);
    }
}

// Singleton instance
module.exports = new BotManager();
