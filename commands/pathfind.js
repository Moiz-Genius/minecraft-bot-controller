const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { fancyChat } = require('../core/fancy_chat.js');
const { goTo } = require('../core/movement.js');

module.exports = {
    name: 'pathfind',
    description: 'Pathfind to absolute coordinates.',
    execute: async (bot, username, args) => {
        if (args.length < 3) {
            fancyChat(bot, 'Usage: !pathfind <x> <y> <z>');
            return;
        }

        const x = parseInt(args[0]);
        const y = parseInt(args[1]);
        const z = parseInt(args[2]);

        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            const goal = new GoalBlock(x, y, z);
            fancyChat(bot, `Pathfinding to ${x}, ${y}, ${z}.`);
            await goTo(bot, goal);
        } else {
            fancyChat(bot, 'Invalid coordinates.');
        }
    }
};
