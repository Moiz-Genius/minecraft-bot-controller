const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'parkour',
    description: 'Toggle parkour mode.',
    execute: async (bot, username, args) => {
        if (args.length < 1) {
            fancyChat(bot, 'Usage: !parkour <on|off>');
            return;
        }

        const parkourEnabled = args[0] === 'on';
        if (bot.pathfinder && bot.pathfinder.movements) {
            bot.pathfinder.movements.allowParkour = parkourEnabled;
            fancyChat(bot, `Parkour is now ${parkourEnabled ? 'enabled' : 'disabled'}.`);
        } else {
            fancyChat(bot, 'Pathfinder not initialized.');
        }
    }
};
