const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'pvp',
    description: 'Attack a player.',
    execute: async (bot, username, args) => {
        if (args.length < 1) {
            fancyChat(bot, 'Usage: !pvp <username>');
            return;
        }
        const targetPlayerName = args[0];
        const targetPlayer = bot.players[targetPlayerName];

        if (!targetPlayer || !targetPlayer.entity) {
            fancyChat(bot, `I can't see ${targetPlayerName}.`);
            return;
        }

        if (bot.pvp) {
            bot.pvp.start(targetPlayer.entity);
            fancyChat(bot, `Engaging PvP with ${targetPlayerName}!`);
        } else {
            fancyChat(bot, 'PvP module not initialized.');
        }
    }
};
