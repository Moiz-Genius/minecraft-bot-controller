module.exports = {
    name: 'toss',
    description: 'Throw an item.',
    execute: async (bot, username, args) => {
        if (args.length < 1) {
            bot.chat('Usage: !toss <itemName> [count]');
            return;
        }

        const itemName = args[0];
        const count = args.length > 1 ? parseInt(args[1]) : 1;
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
};
