const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { fancyChat } = require('../core/fancy_chat.js');
const { goTo } = require('../core/movement.js');

module.exports = {
    name: 'gotowaypoint',
    description: 'Go to the saved waypoint.',
    execute: async (bot, username, args) => {
        if (bot.globals.waypoint) {
            const goal = new GoalBlock(bot.globals.waypoint.x, bot.globals.waypoint.y, bot.globals.waypoint.z);
            fancyChat(bot, 'Going to waypoint.');
            await goTo(bot, goal);
        } else {
            fancyChat(bot, 'No waypoint set. Use !setwaypoint first.');
        }
    }
};
