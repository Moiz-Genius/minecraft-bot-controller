const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { fancyChat } = require('../core/fancy_chat.js');

module.exports = {
    name: 'mine',
    description: 'Mine a block.',
    execute: async (bot, username, args) => {
        if (args.length < 2) {
            fancyChat(bot, 'Usage: !mine <blockname> <numberofblocks>');
            return;
        }

        const blockName = args[0];
        const numBlocksToMine = parseInt(args[1]);

        if (isNaN(numBlocksToMine) || numBlocksToMine <= 0) {
            fancyChat(bot, 'Invalid number of blocks.');
            return;
        }

        const blockType = bot.registry.blocksByName[blockName];
        if (!blockType) {
            const commonOres = ['coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore', 'emerald_ore', 'redstone_ore', 'lapis_ore', 'nether_quartz_ore', 'ancient_debris'];
            fancyChat(bot, `Unknown block: ${blockName}. Please use a valid block name. Common ores include: ${commonOres.join(', ')}.`);
            return;
        }

        fancyChat(bot, `Mining ${numBlocksToMine} of ${blockName}...`);
        bot.globals.isMining = true;
        let minedBlocks = 0;
        let consecutivePathfindingFailures = 0;
        const MAX_PATHFINDING_FAILURES = 5;

        while (minedBlocks < numBlocksToMine && bot.globals.isMining) {
            // Basic XRay check (if plugin loaded)
            if (!bot.xray || typeof bot.xray.findBlockXray !== 'function') {
                fancyChat(bot, "XRay module not loaded.");
                break;
            }

            const blocks = bot.xray.findBlockXray(blockName, 128);

            if (blocks.length === 0) {
                fancyChat(bot, `No more ${blockName} found within range.`);
                break;
            }

            blocks.sort((a, b) => bot.entity.position.distanceTo(a) - bot.entity.position.distanceTo(b));

            const targetBlockPos = blocks[0];
            const targetBlock = bot.blockAt(targetBlockPos);

            if (!targetBlock || targetBlock.type === 0) {
                consecutivePathfindingFailures = 0;
                await new Promise(r => setTimeout(r, 500));
                continue;
            }

            try {
                await bot.pathfinder.goto(new GoalBlock(targetBlockPos.x, targetBlockPos.y, targetBlockPos.z));
                // mineflayer-tool might not be loaded, check it
                if (bot.tool) await bot.tool.equipForBlock(targetBlock);
                await bot.dig(targetBlock);
                minedBlocks++;
                consecutivePathfindingFailures = 0;
            } catch (err) {
                // fancyChat(bot, `Failed to reach/mine ${blockName} at ${targetBlockPos}.`);
                consecutivePathfindingFailures++;
                if (consecutivePathfindingFailures >= MAX_PATHFINDING_FAILURES) {
                    fancyChat(bot, `Too many failures. Stopping.`);
                    break;
                }
            }
        }

        bot.globals.isMining = false;
        fancyChat(bot, `Finished mining. Total mined: ${minedBlocks} ${blockName}.`);
    }
};
