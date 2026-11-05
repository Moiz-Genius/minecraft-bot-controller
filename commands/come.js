const { GoalBlock, GoalFollow, GoalNear } = require('mineflayer-pathfinder').goals;
const { fancyChat } = require('../core/fancy_chat.js');
const { goTo } = require('../core/movement.js'); // Updated import

module.exports = {
    name: 'come',
    description: 'Make the bot come to your location.',
    execute: async (bot, username, args) => {
        const targetName = args.length > 0 ? args[0] : username;
        const player = bot.players[targetName];

        if (!player || !player.entity) {
            fancyChat(bot, `I can't see ${targetName}.`);
            return;
        }
        const goal = new GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1);
        fancyChat(bot, `Coming to ${targetName}!`);
        await goTo(bot, goal);
    }
};
