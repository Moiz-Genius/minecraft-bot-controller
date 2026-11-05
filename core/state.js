class BotState {
    constructor() {
        this.states = new Map();
    }

    init(bot) {
        this.states.set(bot.username, {
            isGuarding: false,
            isPvP: false,
            isMining: false,
            isEating: false,
            isAFK: false,
            guardRange: 10,
            target: null
        });
    }

    get(bot) {
        if (!this.states.has(bot.username)) {
            this.init(bot);
        }
        return this.states.get(bot.username);
    }

    update(bot, key, value) {
        const state = this.get(bot);
        state[key] = value;
        this.states.set(bot.username, state);
    }
}

module.exports = new BotState();
