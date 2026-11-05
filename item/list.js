async function handleListCommand(bot, username, args) {
    const items = bot.inventory.items();

    if (items.length === 0) {
        bot.chat('My inventory is empty.');
        return;
    }

    const itemNames = items.map(item => `${item.name} x${item.count}`).join(', ');
    bot.chat(`Items: ${itemNames}`);
}

module.exports = {
    handleListCommand
};
