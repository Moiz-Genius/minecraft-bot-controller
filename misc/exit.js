async function handleExitCommand(bot, username, args) {
    bot.chat('Disconnecting...');
    bot.quit();
}

module.exports = {
    handleExitCommand
};
