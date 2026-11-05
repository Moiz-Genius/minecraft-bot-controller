async function handleEquipCommand(bot, username, args) {
    if (args.length < 2) {
        bot.chat('Usage: !equip <itemName> [destination]');
        return;
    }

    const itemName = args[1];
    const destination = args.length > 2 ? args[2] : 'hand';

    const item = bot.inventory.items().find(item => item.name.includes(itemName));

    if (item) {
        try {
            await bot.equip(item, destination);
            bot.chat(`Equipped ${itemName}.`);
        } catch (err) {
            bot.chat(`Failed to equip ${itemName}: ${err.message}`);
        }
    } else {
        bot.chat(`I don't have a ${itemName}.`);
    }
}

module.exports = {
    handleEquipCommand
};
