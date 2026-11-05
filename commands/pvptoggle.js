const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'pvptoggle',
    description: 'Toggle PvP mode globally.',
    execute: async (bot, username, args) => {
        if (args.length > 0 && args[0] === 'on') {
            fancyChat(bot, 'PvP mode enabled. Use !pvp <playername> to start a fight.');
        } else if (args.length > 0 && args[0] === 'off') {
            if (bot.pvp) bot.pvp.stop();
            fancyChat(bot, 'PvP mode disabled.');
        } else {
            fancyChat(bot, 'Usage: !pvptoggle <on|off>');
        }
    }
};
