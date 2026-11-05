const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'stop',
    description: 'Stop all bot actions.',
    execute: async (bot) => {
        bot.pathfinder.stop();
        if (bot.guard) bot.guard.stop(); // Check existence
        if (bot.pvp) bot.pvp.stop(); // Check existence
        bot.globals.isMining = false;
        bot.globals.followTarget = null;
        bot.globals.isAutoBridging = false;
        bot.globals.isAFK = false;
        bot.clearControlStates();
        fancyChat(bot, 'Standing down.');
    }
};
