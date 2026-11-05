const { fancyChat } = require('../core/fancy_chat');

module.exports = {
    name: 'hello',
    description: 'Greet the bot.',
    aliases: ['hi', 'hey'],
    execute: async (bot, username, args) => {
        fancyChat(bot, `Hello, ${username}!`);
    }
};
