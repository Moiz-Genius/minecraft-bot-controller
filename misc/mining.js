const { GoalBlock } = require('mineflayer-pathfinder').goals;

async function handleMineCommand(bot, username, args) {
    if (args.length < 3) {
        bot.chat('Usage: !mine <blockname> <numberofblocks>');
        return;
    }

    const blockName = args[1];
    const numBlocksToMine = parseInt(args[2]);

    if (isNaN(numBlocksToMine) || numBlocksToMine <= 0) {
        bot.chat('Invalid number of blocks.');
        return;
    }

    const blockType = bot.registry.blocksByName[blockName];
    if (!blockType) {
        const commonOres = ['coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore', 'emerald_ore', 'redstone_ore', 'lapis_ore', 'nether_quartz_ore', 'ancient_debris'];
        bot.chat(`Unknown block: ${blockName}. Please use a valid block name. Common ores include: ${commonOres.join(', ')}.`);
        return;
    }

    bot.chat(`Mining ${numBlocksToMine} of ${blockName}...`);
    bot.globals.isMining = true;
    let minedBlocks = 0;
    let consecutivePathfindingFailures = 0;
    const MAX_PATHFINDING_FAILURES = 5;

    while (minedBlocks < numBlocksToMine && bot.globals.isMining) {
        const blocks = bot.xray.findBlockXray(blockName, 128);

        if (blocks.length === 0) {
            bot.chat(`No more ${blockName} found within range.`);
            break;
        }

        blocks.sort((a, b) => bot.entity.position.distanceTo(a) - bot.entity.position.distanceTo(b));

        const targetBlockPos = blocks[0];
        const targetBlock = bot.blockAt(targetBlockPos);

        if (!targetBlock || targetBlock.type === 0) {
            consecutivePathfindingFailures = 0;
            continue;
        }

        try {
            await bot.pathfinder.goto(new GoalBlock(targetBlockPos.x, targetBlockPos.y, targetBlockPos.z));
            await bot.tool.equipForBlock(targetBlock);
            await bot.dig(targetBlock);
            minedBlocks++;
            consecutivePathfindingFailures = 0;
        } catch (err) {
            bot.chat(`Failed to reach/mine ${blockName} at ${targetBlockPos}. Error: ${err.message}`);
            consecutivePathfindingFailures++;
            if (consecutivePathfindingFailures >= MAX_PATHFINDING_FAILURES) {
                bot.chat(`Too many failures. Stopping.`);
                break;
            }
        }
    }

    bot.globals.isMining = false;
    bot.chat(`Finished mining. Total mined: ${minedBlocks} ${blockName}.`);
}

module.exports = {
    handleMineCommand
};
