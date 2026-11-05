module.exports = {
    name: 'exit',
    description: 'Disconnect the bot.',
    execute: async (bot, username, args) => {
        bot.chat('Disconnecting...');
        bot.quit();
    }
};
