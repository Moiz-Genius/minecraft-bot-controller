const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'setwaypoint',
    description: 'Set a waypoint at current location.',
    execute: async (bot, username, args) => {
        bot.globals.waypoint = bot.entity.position.clone();
        fancyChat(bot, `Waypoint set to ${bot.globals.waypoint.x.toFixed(0)}, ${bot.globals.waypoint.y.toFixed(0)}, ${bot.globals.waypoint.z.toFixed(0)}`);
    }
};
