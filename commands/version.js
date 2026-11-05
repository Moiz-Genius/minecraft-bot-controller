module.exports = {
    name: 'version',
    description: 'Show bot version.',
    execute: async (bot, username, args) => {
        bot.chat(`I am running on Mineflayer v${bot.version}.`);
    }
};
