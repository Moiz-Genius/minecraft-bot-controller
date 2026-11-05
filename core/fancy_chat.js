const chalk = new (require('chalk')).Chalk();

function fancyChat(bot, message) {
    const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const prefix = chalk.bold[randomColor](`[🤖 ${bot.username}]`);
    const formattedMessageForConsole = `${prefix} ${message}`;
    console.log(formattedMessageForConsole);
    bot.chat(message);
}

module.exports = {
    fancyChat
};
