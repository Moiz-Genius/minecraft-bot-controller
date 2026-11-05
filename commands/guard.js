const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'guard',
    description: 'Guard a player or location.',
    execute: async (bot, username, args) => {
        let targetToGuard = null;

        if (args.length > 0) {
            const targetName = args[0];
            const player = bot.players[targetName];

            if (player && player.entity) {
                targetToGuard = player.entity;
            } else {
                if (bot.bots) {
                    const targetBot = bot.bots.find(b => b.username === targetName);
                    if (targetBot) {
                        targetToGuard = targetBot.entity;
                    }
                }
            }

            if (!targetToGuard) {
                fancyChat(bot, `I can't find ${targetName}.`);
                return;
            }
        }

        bot.guard.start(targetToGuard);
    }
};
