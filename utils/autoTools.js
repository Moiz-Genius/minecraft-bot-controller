const mineflayer = require('mineflayer');

/**
 * Calculates the damage of an item using Minecraft data.
 * @param {object} item - The item to check.
 * @param {object} bot - The bot instance.
 * @returns {number} - The calculated damage.
 */
function getAttackDamage(item, bot) {
    if (!item) return 1; // Fist damage

    const mcData = require('minecraft-data')(bot.version);
    const itemData = mcData.itemsByName[item.name];

    if (!itemData) return 1;

    let damage = 1;

    // HEURISTIC ADJUSTMENT:
    // While Axes have higher single-hit damage in vanilla MC, Swords have higher DPS.
    // We arbitrarily boost Sword damage here to ensure the bot prioritizes them for PvP.
    const SWORD_PRIORITY_BONUS = 100;

    if (item.name.includes('sword')) {
        if (item.name.includes('wooden')) damage = 4 + SWORD_PRIORITY_BONUS;
        else if (item.name.includes('golden')) damage = 4 + SWORD_PRIORITY_BONUS;
        else if (item.name.includes('stone')) damage = 5 + SWORD_PRIORITY_BONUS;
        else if (item.name.includes('iron')) damage = 6 + SWORD_PRIORITY_BONUS;
        else if (item.name.includes('diamond')) damage = 7 + SWORD_PRIORITY_BONUS;
        else if (item.name.includes('netherite')) damage = 8 + SWORD_PRIORITY_BONUS;
    } else if (item.name.includes('axe')) {
        if (item.name.includes('wooden')) damage = 7;
        else if (item.name.includes('golden')) damage = 7;
        else if (item.name.includes('stone')) damage = 9;
        else if (item.name.includes('iron')) damage = 9;
        else if (item.name.includes('diamond')) damage = 9;
        else if (item.name.includes('netherite')) damage = 10;
    } else if (item.name.includes('trident')) {
        damage = 9;
    }

    if (item.nbt && item.nbt.value.Enchantments) {
        const enchantments = item.nbt.value.Enchantments.value.value;
        for (const ench of enchantments) {
            const enchId = ench.id.value.replace('minecraft:', '');
            const lvl = ench.lvl.value;

            if (enchId === 'sharpness') damage += 0.5 * lvl + 0.5;
            if (enchId === 'smite') damage += 2.5 * lvl; // Only undead, but treating as generic bonus for heuristic
            if (enchId === 'bane_of_arthropods') damage += 2.5 * lvl; // Only spiders
        }
    }

    return damage;
}

/**
 * Finds the best weapon in the bot's inventory.
 * @param {object} bot - The bot instance.
 * @returns {object|null} - The best weapon item or null.
 */
function getBestWeapon(bot) {
    const inventory = bot.inventory.items();
    let bestItem = null;
    let bestDamage = -1;

    for (const item of inventory) {
        const damage = getAttackDamage(item, bot);
        if (damage > bestDamage) {
            bestDamage = damage;
            bestItem = item;
        }
    }

    return bestItem;
}

/**
 * Automatically equips the best tool for the block we are looking at or interacting with.
 * This is effectively what mineflayer-tool does, but we can expose a manual helper if needed.
 * @param {object} bot 
 * @param {object} block 
 */
async function autoTool(bot, block) {
    if (!block) return;
    try {
        await bot.tool.equipForBlock(block);
    } catch (err) {
    }
}

module.exports = {
    getBestWeapon,
    autoTool
};
