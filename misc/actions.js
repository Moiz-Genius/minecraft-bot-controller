function stopActions(bot) {
    bot.globals.isGuarding = false;
    bot.globals.followTarget = null;
    bot.pvp.stop();
}

module.exports = {
    stopActions
};
