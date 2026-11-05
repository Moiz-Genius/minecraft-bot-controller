const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { equipTotem } = require('../item/armor.js');
const { fancyChat } = require('../core/fancy_chat.js');
const Logger = require('../utils/logger.js');

function findHostileMob(bot) {
    const hostileMobs = [
        'zombie', 'drowned', 'husk', 'skeleton', 'stray', 'spider', 'cave_spider', 'creeper', 'enderman', 'witch',
        'slime', 'phantom', 'pillager', 'vindicator', 'evoker', 'ravager', 'illusioner', 'vex', 'silverfish',
        'warden', 'blaze', 'ghast', 'magma_cube', 'wither_skeleton', 'zombified_piglin', 'piglin', 'hoglin',
        'piglin_brute', 'wither', 'endermite', 'shulker', 'guardian', 'elder_guardian', 'evoker_fangs'
    ];
    return Object.values(bot.entities).filter(entity =>
        hostileMobs.includes(entity.name) &&
        entity.position.distanceTo(bot.entity.position) < bot.globals.guardRange &&
        entity.displayName !== 'Armor Stand'
    ).sort((a, b) => a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position));
}

function runAwayFrom(bot, target, distance) {
    const botPos = bot.entity.position;
    const targetPos = target.position;
    const oppositeDir = botPos.minus(targetPos).normalize();
    const goalPos = botPos.plus(oppositeDir.scaled(distance));
    bot.pathfinder.setGoal(new GoalBlock(goalPos.x, goalPos.y, goalPos.z));
}

async function eatGappleAndRun(bot) {
    if (bot.globals.isEatingGapple) return;
    bot.globals.isEatingGapple = true;

    let wasGuarding = false;
    let originalGuardTarget = null;
    if (bot.guard.isGuarding) {
        wasGuarding = true;
        originalGuardTarget = bot.guard.guardTarget;
        bot.guard.stop();
    }

    let wasPvping = false;
    let originalPvPTarget = null;
    if (bot.pvp.isFighting) {
        wasPvping = true;
        originalPvPTarget = bot.pvp.target;
        bot.pvp.isEating = true;
        bot.pvp.stop();
    }

    bot.pathfinder.stop();

    if (originalPvPTarget) {
        runAwayFrom(bot, originalPvPTarget, 10);
    }

    const gapple = bot.inventory.findInventoryItem('golden_apple') || bot.inventory.findInventoryItem('enchanted_golden_apple');
    if (!gapple) {
        bot.globals.isEatingGapple = false;
        if (wasPvping) {
            bot.pvp.isEating = false;
        }
        if (wasPvping) {
            bot.pvp.start(originalPvPTarget);
        } else if (wasGuarding) {
            bot.guard.start(originalGuardTarget);
        }
        return;
    }

    const originalHeldItem = bot.heldItem;
    try {
        await bot.equip(gapple, 'hand');
        await equipTotem(bot);
        await bot.consume();
    } catch (err) {
        Logger.error(`${bot.username} gapple eat error: ${err.message}`);
    } finally {
        if (originalHeldItem) {
            await bot.equip(originalHeldItem, 'hand');
        }
    }

    if (wasPvping) {
        bot.pvp.isEating = false;
        bot.pvp.start(originalPvPTarget);
    } else if (wasGuarding) {
        bot.guard.start(originalGuardTarget);
    }
    bot.globals.isEatingGapple = false;
}

function handlePvpCommand(bot, username, args) {
    if (args.length < 2) {
        fancyChat(bot, 'Usage: !pvp <username>');
        return;
    }
    const targetPlayerName = args[1];
    const targetPlayer = bot.players[targetPlayerName];

    if (!targetPlayer || !targetPlayer.entity) {
        fancyChat(bot, `I can't see ${targetPlayerName}.`);
        return;
    }

    bot.pvp.start(targetPlayer.entity);
}

module.exports = {
    findHostileMob,
    eatGappleAndRun,
    handlePvpCommand
};
