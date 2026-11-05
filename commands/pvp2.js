const { Goals } = require('mineflayer-pathfinder');

module.exports = {
    name: 'pvp2',
    description: 'Advanced PvP module with strafing and jitter aim.',
    aliases: ['fight2'],
    execute: async (bot, username, args, outputMode = 'chat') => {
        if (args.length < 1) {
            bot.chat('Usage: !pvp2 <target_username> or !pvp2 stop');
            return;
        }

        const targetName = args[0];

        if (targetName.toLowerCase() === 'stop') {
            stopPvP(bot);
            return;
        }

        const target = bot.players[targetName] ? bot.players[targetName].entity : null;
        if (!target) {
            bot.chat('Target not found or out of range.');
            return;
        }

        bot.chat(`Engaging ${targetName} with Advanced Combat Protocols.`);
        startPvP(bot, target);
    }
};

function stopPvP(bot) {
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
    if (bot.globals && bot.globals.pvp2Interval) {
        clearInterval(bot.globals.pvp2Interval);
        bot.globals.pvp2Interval = null;
    }
    bot.chat('PvP v2 Disengaged.');
}

function startPvP(bot, targetEntry) {
    // Basic setup
    if (!bot.pvp) return bot.chat('PvP plugin not loaded.');

    // We use a custom interval for "Strafing" and "Jitter"
    // Instead of relying solely on mineflayer-pvp, we augment it.

    // 1. Equip Best Weapon
    equipBestWeapon(bot);

    // 2. Start Attacking via standard PVP to handle hitting
    bot.pvp.attack(targetEntry);

    // 3. Custom Movement Logic (Strafing/Jitter)
    // We override the pvp movement or run alongside it? 
    // mineflayer-pvp handles movement to get in range.
    // To strafe, we might need to take control occasionally.

    if (bot.globals.pvp2Interval) clearInterval(bot.globals.pvp2Interval);

    let tick = 0;
    bot.globals.pvp2Interval = setInterval(() => {
        const target = bot.players[targetEntry.username]?.entity;
        if (!target) {
            stopPvP(bot);
            bot.chat('Target lost.');
            return;
        }

        // Auto-heal logic check periodically
        if (tick % 10 === 0) checkHealthAndConsumables(bot);

        // Jitter Look: Slight random offset to pitch/yaw every few ticks
        if (tick % 5 === 0) {
            const jitterYaw = (Math.random() - 0.5) * 0.2; // Small variation
            const jitterPitch = (Math.random() - 0.5) * 0.1;
            bot.look(bot.entity.yaw + jitterYaw, bot.entity.pitch + jitterPitch, true);
        }

        // Strafing Logic
        // If close enough to hit, try to move sideways relative to target
        const dist = bot.entity.position.distanceTo(target.position);
        if (dist < 3.5) {
            // We are in combat range.
            // Randomly strafe left or right
            bot.setControlState('left', Math.random() < 0.5);
            bot.setControlState('right', Math.random() < 0.5);
            bot.setControlState('jump', Math.random() < 0.3); // Occasional jump crit/dodge
        } else {
            // Let standard pathfinder/pvp handle closing the gap, but ensure sprint
            bot.setControlState('sprint', true);
            bot.setControlState('left', false);
            bot.setControlState('right', false);
        }

        tick++;
    }, 100);
}

async function equipBestWeapon(bot) {
    const bandWidth = 0; // Not used here
    // Simple check for swords/axes
    const items = bot.inventory.items();
    const weapon = items.find(item => item.name.includes('sword')) || items.find(item => item.name.includes('axe'));
    if (weapon) {
        try {
            await bot.equip(weapon, 'hand');
        } catch (e) { }
    }
}

async function checkHealthAndConsumables(bot) {
    // 1. Potions
    // Look for splash/drinkable potions of strength/speed if not active?
    // This is complex to check active effects, simplified for now:
    // Just drink healing if low.

    // 2. Totem
    const offhand = bot.inventory.slots[45];
    if (!offhand || offhand.name !== 'totem_of_undying') {
        const totem = bot.inventory.items().find(i => i.name === 'totem_of_undying');
        if (totem) {
            try {
                await bot.equip(totem, 'off-hand');
            } catch (e) { }
        }
    }
}
