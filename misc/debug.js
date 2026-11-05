const { handleFollowCommand, handleComeCommand, handleGotoCommand, handleGuardCommand, handleStopCommand } = require('../player/movement.js');
const { handlePvpCommand } = require('../combat/combat.js');

async function startDebugSequence(bot, username) {
    const nearestPlayer = bot.nearestEntity(entity => entity.type === 'player' && entity.username !== bot.username);

    if (!nearestPlayer) {
        bot.chat("No players nearby to start the debug sequence.");
        return;
    }

    bot.chat(`Starting debug sequence with ${nearestPlayer.username}.`);

    bot.chat("Debug: Testing !follow");
    handleFollowCommand(bot, username, ['!follow', nearestPlayer.username]);
    await new Promise(resolve => setTimeout(resolve, 3000));

    bot.chat("Debug: Testing !come");
    handleComeCommand(bot, username);
    await new Promise(resolve => setTimeout(resolve, 3000));

    bot.chat("Debug: Testing !goto");
    const gotoPos = nearestPlayer.position.offset(5, 0, 5);
    handleGotoCommand(bot, ['!goto', gotoPos.x, gotoPos.y, gotoPos.z]);
    await new Promise(resolve => setTimeout(resolve, 3000));

    bot.chat("Debug: Testing !pvp");
    handlePvpCommand(bot, username, ['!pvp', nearestPlayer.username]);
    await new Promise(resolve => setTimeout(resolve, 3000));

    bot.chat("Debug: Testing !guard");
    handleGuardCommand(bot, username, ['!guard']);
    await new Promise(resolve => setTimeout(resolve, 3000));

    bot.chat("Debug: Testing !stop");
    handleStopCommand(bot);
    bot.chat("Debug sequence finished.");
}

module.exports = {
    startDebugSequence
};
