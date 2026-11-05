const { GoalBlock, GoalFollow, GoalNear } = require('mineflayer-pathfinder').goals;
const { fancyChat } = require('../core/fancy_chat.js');
const Logger = require('../utils/logger.js');

async function goTo(bot, goal) {
    bot.globals.isPathfinding = true;

    if (bot.pvp && bot.pvp.stop) bot.pvp.stop();
    if (bot.autoEat && typeof bot.autoEat.disable === 'function') bot.autoEat.disable();

    const movements = bot.pathfinder.movements;
    movements.canDig = true;
    movements.allow1by1towers = true;
    movements.allowParkour = true; // Baritone is agile

    const scaffoldingItems = ['dirt', 'cobblestone', 'stone', 'netherrack', 'oak_planks', 'white_wool'];
    const mcData = require('minecraft-data')(bot.version);
    movements.scafoldingBlocks = scaffoldingItems
        .map(name => mcData.itemsByName[name])
        .filter(item => item)
        .map(item => item.id);

    bot.pathfinder.setMovements(movements);

    try {
        if (bot.player.gamemode === 1) {
            if (goal instanceof GoalBlock || goal instanceof GoalNear) {
                await bot.creative.flyTo(goal.x, goal.y, goal.z);
            } else if (goal instanceof GoalFollow) {
                await bot.creative.flyTo(goal.entity.position.x, goal.entity.position.y, goal.entity.position.z);
            } else {
                await bot.pathfinder.goto(goal);
            }
        } else {
            if (goal instanceof GoalFollow) {
                Logger.debug('Engaging Dynamic Follow Mode');
                bot.pathfinder.setGoal(goal, true);
                return;
            } else {
                await bot.pathfinder.goto(goal);
            }
        }
        fancyChat(bot, 'Goal reached!');
    } catch (err) {
        if (err.message.includes('Path was stopped') || err.message.includes('GoalChanged')) {
            Logger.debug(`Pathfinding interrupted: ${err.message}`);
        } else {
            Logger.error(`Pathfinding error: ${err.message}`);
            fancyChat(bot, "I can't get there. Something is in my way.");
        }
    } finally {
        if (!(goal instanceof GoalFollow)) {
            bot.globals.isPathfinding = false;
            if (bot.autoEat && typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
        }
    }
}

function handleParkourCommand(bot, args) {
    if (args.length < 2) {
        fancyChat(bot, 'Usage: !parkour <on|off>');
        return;
    }

    const parkourEnabled = args[1] === 'on';
    bot.pathfinder.movements.allowParkour = parkourEnabled;
    fancyChat(bot, `Parkour is now ${parkourEnabled ? 'enabled' : 'disabled'}.`);
}

async function handlePathfindCommand(bot, args) {
    if (args.length < 4) {
        fancyChat(bot, 'Usage: !pathfind <x> <y> <z>');
        return;
    }

    const x = parseInt(args[1]);
    const y = parseInt(args[2]);
    const z = parseInt(args[3]);

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        const goal = new GoalBlock(x, y, z);
        fancyChat(bot, `Pathfinding to ${x}, ${y}, ${z}.`);
        await goTo(bot, goal);
    } else {
        fancyChat(bot, 'Invalid coordinates.');
    }
}

function handleComeCommand(bot, username, args) {
    const targetName = args.length > 1 ? args[1] : username;
    const player = bot.players[targetName];

    if (!player || !player.entity) {
        fancyChat(bot, `I can't see ${targetName}.`);
        return;
    }
    const goal = new GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1);
    fancyChat(bot, `Coming to ${targetName}!`);
    goTo(bot, goal);
}

function handleGotoCommand(bot, args) {
    if (args.length === 4) {
        const x = parseInt(args[1]);
        const y = parseInt(args[2]);
        const z = parseInt(args[3]);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            const goal = new GoalBlock(x, y, z);
            fancyChat(bot, 'Heading to coordinates.');
            goTo(bot, goal);
        } else {
            fancyChat(bot, 'Invalid coordinates.');
        }
    } else {
        fancyChat(bot, 'Usage: !goto <x> <y> <z>');
    }
}

function handleFollowCommand(bot, username, args) {
    const targetPlayer = args.length > 1 ? bot.players[args[1]] : bot.players[username];
    if (!targetPlayer || !targetPlayer.entity) {
        fancyChat(bot, "I can't see that player.");
        return;
    }
    const goal = new GoalFollow(targetPlayer.entity, 1);
    fancyChat(bot, `Following ${targetPlayer.username}.`);
    goTo(bot, goal);
}

function handleGuardCommand(bot, username, args) {
    let targetToGuard = null;

    if (args.length > 1) {
        const targetName = args[1];
        const player = bot.players[targetName];

        if (player && player.entity) {
            targetToGuard = player.entity;
        } else {
            if (bot.bots) {
                const targetBot = bot.bots.find(b => b.username === targetName);
                if (targetBot) {
                    targetToGuard = targetBot.entity;
                }
            }
        }

        if (!targetToGuard) {
            fancyChat(bot, `I can't find ${targetName}.`);
            return;
        }
    }

    bot.guard.start(targetToGuard);
}

function handleStopCommand(bot) {
    bot.pathfinder.stop();
    bot.guard.stop();
    bot.pvp.stop();
    bot.globals.isMining = false;
    bot.globals.followTarget = null;
    bot.globals.isAutoBridging = false;
    bot.globals.isAFK = false;
    bot.clearControlStates();
    fancyChat(bot, 'Standing down.');
}

function handleStopPathfindCommand(bot) {
    bot.pathfinder.stop();
    bot.globals.isPathfinding = false;
    if (bot.autoEat && typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
    fancyChat(bot, 'Pathfinding stopped.');
}

async function handleTowerCommand(bot, username, args) {
    const height = args.length > 1 ? parseInt(args[1]) : 5; // Default 5 blocks
    if (isNaN(height)) {
        fancyChat(bot, 'Usage: !tower <height>');
        return;
    }

    fancyChat(bot, `Towering up ${height} blocks...`);

    bot.globals.isTowering = true;
    if (bot.pvp && bot.pvp.stop) bot.pvp.stop();
    if (bot.pathfinder) bot.pathfinder.stop();
    if (bot.autoEat) {
        if (typeof bot.autoEat.disable === 'function') bot.autoEat.disable();
        else if (typeof bot.autoEat.disableAutoEat === 'function') bot.autoEat.disableAutoEat();
    }
    bot.clearControlStates();

    const startY = bot.entity.position.y;
    const targetY = startY + height;

    const blockItem = bot.inventory.items().find(item => bot.registry.blocks[item.type] && bot.registry.blocks[item.type].boundingBox === 'block');
    if (!blockItem) {
        fancyChat(bot, 'I need blocks to tower up!');
        bot.globals.isTowering = false;
        if (bot.autoEat) {
            if (typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
            else if (typeof bot.autoEat.enableAutoEat === 'function') bot.autoEat.enableAutoEat();
        }
        return;
    }

    await bot.equip(blockItem, 'hand');

    bot.setControlState('jump', true);

    const Vec3 = require('vec3');

    while (bot.entity.position.y < targetY) {
        if (!bot.globals.isTowering) break;

        const currentBlock = bot.inventory.items().find(item => bot.registry.blocks[item.type] && bot.registry.blocks[item.type].boundingBox === 'block');
        if (!currentBlock) {
            fancyChat(bot, 'Ran out of blocks!');
            bot.globals.isTowering = false;
            if (bot.autoEat) {
                if (typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
                else if (typeof bot.autoEat.enableAutoEat === 'function') bot.autoEat.enableAutoEat();
            }
            break;
        }

        if (!bot.heldItem || bot.heldItem.type !== currentBlock.type) {
            try { await bot.equip(currentBlock, 'hand'); } catch (e) { }
        }

        await bot.lookAt(bot.entity.position.offset(0, -1, 0), true);

        const refBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        if (refBlock && refBlock.boundingBox === 'block') {
            try {
                await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
            } catch (err) {
            }
        }

        bot.setControlState('jump', true);

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    bot.setControlState('jump', false);
    bot.globals.isTowering = false;
    if (bot.autoEat) bot.autoEat.enable();
    fancyChat(bot, 'Tower complete.');
}

function handleAFKCommand(bot, username, args) {
    if (args.length > 1 && args[1] === 'on') {
        bot.globals.isAFK = true;
        fancyChat(bot, 'AFK mode enabled.');
    } else if (args.length > 1 && args[1] === 'off') {
        bot.globals.isAFK = false;
        bot.clearControlStates();
        fancyChat(bot, 'AFK mode disabled.');
    } else {
        fancyChat(bot, 'Usage: !afk <on|off>');
    }
}

function handleSetWaypointCommand(bot) {
    bot.globals.waypoint = bot.entity.position.clone();
    fancyChat(bot, `Waypoint set to ${bot.globals.waypoint.x.toFixed(0)}, ${bot.globals.waypoint.y.toFixed(0)}, ${bot.globals.waypoint.z.toFixed(0)}`);
}

function handleGotoWaypointCommand(bot) {
    if (bot.globals.waypoint) {
        const goal = new GoalBlock(bot.globals.waypoint.x, bot.globals.waypoint.y, bot.globals.waypoint.z);
        fancyChat(bot, 'Going to waypoint.');
        goTo(bot, goal);
    } else {
        fancyChat(bot, 'No waypoint set. Use !setwaypoint first.');
    }
}

function handlePvpToggleCommand(bot, username, args) {
    if (args.length > 1 && args[1] === 'on') {
        fancyChat(bot, 'PvP mode enabled. Use !pvp <playername> to start a fight.');
    } else if (args.length > 1 && args[1] === 'off') {
        bot.pvp.stop();
        fancyChat(bot, 'PvP mode disabled.');
    } else {
        fancyChat(bot, 'Usage: !pvptoggle <on|off>');
    }
}

function handleGuardToggleCommand(bot, username, args) {
    if (args.length > 1 && args[1] === 'on') {
        bot.guard.start(null);
        fancyChat(bot, 'Guard mode enabled.');
    } else if (args.length > 1 && args[1] === 'off') {
        bot.guard.stop();
        fancyChat(bot, 'Guard mode disabled.');
    } else {
        fancyChat(bot, 'Usage: !guardtoggle <on|off>');
    }
}

module.exports = {
    handleParkourCommand,
    handlePathfindCommand,
    handleComeCommand,
    handleGotoCommand,
    handleFollowCommand,
    handleGuardCommand,
    handleStopCommand,
    handleStopPathfindCommand,
    handleTowerCommand,
    handleAFKCommand,
    handleSetWaypointCommand,
    handleGotoWaypointCommand,
    handleGuardToggleCommand
};
