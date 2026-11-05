const { goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;
const Logger = require('../utils/logger');

async function dumpInventory(bot, chestBlock) {
    if (!chestBlock) {
        Logger.error('No chest block provided for dumping.');
        return;
    }

    try {
        await bot.pathfinder.goto(new GoalBlock(chestBlock.position.x, chestBlock.position.y, chestBlock.position.z));
        const chest = await bot.openContainer(chestBlock);

        for (const item of bot.inventory.items()) {
            if (item.slot >= 36) continue; // Skip hotbar/armor/offhand if needed, or adjust logic

            if (item.slot >= 36) continue; // Keep armor/offhand (slots vary by version but typically high numbers)

            try {
                await chest.deposit(item.type, null, item.count);
            } catch (err) {
            }
        }

        await chest.close();
        Logger.success('Inventory dumped.');
    } catch (err) {
        Logger.error(`Failed to dump inventory: ${err.message}`);
    }
}

async function sortInventory(bot) {
    Logger.info('Sorting inventory (Not fully implemented).');

    const items = bot.inventory.items();
}

module.exports = { dumpInventory, sortInventory };
