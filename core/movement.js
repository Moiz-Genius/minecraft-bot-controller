const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalBlock, GoalNear, GoalFollow } = goals;
const config = require('../config');
const Logger = require('../utils/logger');

/**
 * reliable-movement.js
 * Centralized navigation logic for the bot.
 */

function setupPathfinding(bot) {
    // Load plugin if not already loaded (handled by bot.js usually, but good to be safe)
    if (!bot.pathfinder) {
        bot.loadPlugin(pathfinder);
    }

    const mcData = require('minecraft-data')(bot.version);

    // Create and Configure Movements
    const defaultMovements = new Movements(bot, mcData);

    // --- SMART AI SETTINGS ---
    // --- SMART AI SETTINGS ---
    defaultMovements.canDig = true;           // Allowed to break blocks
    defaultMovements.digCost = 10;            // Discourage breaking unless necessary
    defaultMovements.placeCost = 2;           // Low cost to encourage building, but not 0 (which causes glitches)
    defaultMovements.liquidCost = 50;         // Avoid water/lava
    defaultMovements.dontCreateFlow = true;   // Don't break blocks that spill liquids

    defaultMovements.allow1by1towers = true;  // Allowed to pillar up
    defaultMovements.allowParkour = true;     // Fast movement
    defaultMovements.allowSprinting = true;   // GOTTA GO FAST

    // Scaffolding Blocks (Auto-detect from inventory would be cooler, but this is a solid list)
    // We explicitly check the registry and inventory to ensure valid IDs
    const scaffoldingItems = ['dirt', 'cobblestone', 'stone', 'netherrack', 'oak_planks', 'white_wool', 'granite', 'diorite', 'andesite'];
    const blocks = scaffoldingItems
        .map(name => mcData.itemsByName[name])
        .filter(item => item)
        .map(item => item.id);

    defaultMovements.scafoldingBlocks = blocks;
    defaultMovements.scaffoldingBlocks = blocks; // redundancy

    // Tweak Physics for faster placement perception
    bot.physics.enabled = true;

    // Apply movements
    bot.pathfinder.setMovements(defaultMovements);

    // --- EXTEND BOT API ---
    // We attach these helpers to the bot object for easy access from commands
    bot.movement = {

        /**
         * Go to a specific coordinate
         */
        goTo: (x, y, z, range = 1) => {
            return new Promise((resolve, reject) => {
                const goal = new GoalNear(x, y, z, range);
                bot.pathfinder.setGoal(goal);

                Logger.info(`[MOVE] Heading to ${x}, ${y}, ${z}`);

                const finishListener = () => {
                    cleanup();
                    resolve();
                };

                const stuckListener = () => {
                    // Optional: Retry logic could go here
                };

                const cleanup = () => {
                    bot.off('goal_reached', finishListener);
                    // bot.off('path_stuck', stuckListener); 
                };

                bot.once('goal_reached', finishListener);
            });
        },

        /**
         * Follow a target entity
         */
        follow: (entity, range = 2) => {
            if (!entity) return;
            const goal = new GoalFollow(entity, range);
            bot.pathfinder.setGoal(goal, true); // true = dynamic goal
            Logger.info(`[MOVE] Following ${entity.username || entity.name}`);
        },

        /**
         * Stop moving
         */
        stop: () => {
            bot.pathfinder.setGoal(null);
            bot.clearControlStates();
            Logger.info(`[MOVE] Stopped.`);
        },

        /**
         * Check if moving
         */
        isMoving: () => {
            return bot.pathfinder.isMoving();
        }
    };

    // --- STUCK DETECTION & LOGGING ---
    bot.on('path_update', (r) => {
        if (r.status === 'noPath') {
            Logger.warn(`[MOVE] No path to target!`);
        }
    });

    bot.on('path_stuck', (goalProgress) => {
        Logger.warn(`[MOVE] Stuck! Repathing...`);
        // The pathfinder plugin usually handles repathing, but we can add custom jumps/digs here if needed
    });

    Logger.success(`[SYSTEM] Smart Pathfinding AI Initialized for ${bot.username}`);
}

async function goTo(bot, goal) {
    bot.globals.isPathfinding = true;

    if (bot.pvp && bot.pvp.stop) bot.pvp.stop();
    if (bot.autoEat && typeof bot.autoEat.disable === 'function') bot.autoEat.disable();

    // Ensure pathfinder is loaded
    if (!bot.pathfinder) setupPathfinding(bot);

    const movements = bot.pathfinder.movements;
    movements.canDig = true;
    movements.allow1by1towers = true;
    movements.allowParkour = true;

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
        // fancyChat(bot, 'Goal reached!'); // Optional spam reduction
    } catch (err) {
        if (err.message.includes('Path was stopped') || err.message.includes('GoalChanged')) {
            Logger.debug(`Pathfinding interrupted: ${err.message}`);
        } else {
            Logger.error(`Pathfinding error: ${err.message}`);
            // fancyChat(bot, "I can't get there. Something is in my way.");
        }
    } finally {
        if (!(goal instanceof GoalFollow)) {
            bot.globals.isPathfinding = false;
            if (bot.autoEat && typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
        }
    }
}

module.exports = { setupPathfinding, goTo };
