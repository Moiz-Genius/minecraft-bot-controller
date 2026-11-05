const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'guardrange',
    description: 'Set the chase range for guarding.',
    execute: async (bot, username, args) => {
        if (args.length < 1) {
            fancyChat(bot, `Current guard range is ${bot.globals.guardRange} blocks.`);
            fancyChat(bot, 'Usage: !guardrange <distance>');
            return;
        }
        const range = parseInt(args[0]);
        if (!isNaN(range) && range > 0) {
            bot.globals.guardRange = range;
            fancyChat(bot, `Guard range set to ${range} blocks.`);
        } else {
            fancyChat(bot, 'Invalid distance.');
        }
    }
};
