async function handleVersionCommand(bot, username, args) {
    bot.chat(`I am running on Mineflayer v${bot.version}.`);
}

module.exports = {
    handleVersionCommand
};
