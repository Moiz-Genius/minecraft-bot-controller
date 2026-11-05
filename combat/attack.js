async function handleAttackCommand(bot, username, args) {
    if (args.length < 2) {
        bot.chat('Usage: !attack <username>');
        return;
    }

    const targetUsername = args[1];
    const player = bot.players[targetUsername];

    if (player) {
        bot.pvp.attack(player.entity);
        bot.chat(`Attacking ${targetUsername}.`);
    } else {
        bot.chat(`I can't see a player named ${targetUsername}.`);
    }
}

module.exports = {
    handleAttackCommand
};
