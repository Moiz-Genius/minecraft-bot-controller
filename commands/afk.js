const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'afk',
    description: 'Toggle AFK mode.',
    execute: async (bot, username, args) => {
        if (args.length > 0 && args[0] === 'on') {
            bot.globals.isAFK = true;
            fancyChat(bot, 'AFK mode enabled.');
        } else if (args.length > 0 && args[0] === 'off') {
            bot.globals.isAFK = false;
            bot.clearControlStates();
            fancyChat(bot, 'AFK mode disabled.');
        } else {
            fancyChat(bot, 'Usage: !afk <on|off>');
        }
    }
};
