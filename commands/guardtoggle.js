const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'guardtoggle',
    description: 'Toggle Guard mode.',
    execute: async (bot, username, args) => {
        if (args.length > 0 && args[0] === 'on') {
            bot.guard.start(null); // Default guard
            fancyChat(bot, 'Guard mode enabled.');
        } else if (args.length > 0 && args[0] === 'off') {
            if (bot.guard) bot.guard.stop();
            fancyChat(bot, 'Guard mode disabled.');
        } else {
            fancyChat(bot, 'Usage: !guardtoggle <on|off>');
        }
    }
};
