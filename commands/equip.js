module.exports = {
    name: 'equip',
    description: 'Equip an item.',
    execute: async (bot, username, args) => {
        if (args.length < 1) {
            bot.chat('Usage: !equip <itemName> [destination]');
            return;
        }

        const itemName = args[0];
        const destination = args.length > 1 ? args[1] : 'hand';
        // Basic match
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
};
