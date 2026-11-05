async function handleTossCommand(bot, username, args) {
    if (args.length < 2) {
        bot.chat('Usage: !toss <itemName> [count]');
        return;
    }

    const itemName = args[1];
    const count = args.length > 2 ? parseInt(args[2]) : 1;

    const item = bot.inventory.items().find(item => item.name.includes(itemName));

    if (item) {
        try {
            await bot.toss(item.type, null, count);
            bot.chat(`Tossed ${count} ${itemName}.`);
        } catch (err) {
            bot.chat(`Failed to toss ${itemName}: ${err.message}`);
        }
    } else {
        bot.chat(`I don't have any ${itemName}.`);
    }
}

module.exports = {
    handleTossCommand
};
