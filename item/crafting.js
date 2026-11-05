const mineflayer = require('mineflayer');

module.exports = (bot) => {
    async function craftItem(itemName, count = 1) {
        const item = bot.registry.itemsByName[itemName];

        if (!item) {
            bot.chat(`I don't know about an item called "${itemName}".`);
            return;
        }

        const recipes = bot.recipes.find({
            itemType: item.id,
            matching: true,
            count: count
        });

        if (recipes.length === 0) {
            bot.chat(`I don't know any recipe for "${itemName}".`);
            return;
        }

        const recipe = recipes[0];

        bot.chat(`Attempting to craft ${count} ${itemName}...`);

        try {
            await bot.craft(recipe, count);
            bot.chat(`Successfully crafted ${count} ${itemName}.`);
        } catch (err) {
            bot.chat(`Failed to craft ${itemName}: ${err.message}`);
        }
    }

    return {
        craftItem
    };
};
