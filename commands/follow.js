const { GoalFollow } = require('mineflayer-pathfinder').goals;
const { fancyChat } = require('../core/fancy_chat.js');
const { goTo } = require('../core/movement.js');

module.exports = {
    name: 'follow',
    description: 'Follow a player.',
    execute: async (bot, username, args) => {
        const targetName = args.length > 0 ? args[0] : username;
        const targetPlayer = bot.players[targetName];

        if (!targetPlayer || !targetPlayer.entity) {
            fancyChat(bot, "I can't see that player.");
            return;
        }
        const goal = new GoalFollow(targetPlayer.entity, 1);
        fancyChat(bot, `Following ${targetPlayer.username}.`);
        await goTo(bot, goal);
    }
};
