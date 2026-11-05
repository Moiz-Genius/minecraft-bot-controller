const { GoalFollow } = require('mineflayer-pathfinder').goals;
const { findHostileMob } = require('./combat.js');

function initGuard(bot) {
  bot.guard = {
    isGuarding: false,
    guardTarget: null,
    guardInterval: null,
    attackInterval: null,
    hostileMobs: [
      'zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'witch',
      'cave_spider', 'blaze', 'ghast', 'magma_cube', 'silverfish', 'slime',
      'stray', 'husk', 'drowned', 'phantom', 'piglin', 'zombified_piglin',
      'wither_skeleton', 'guardian', 'elder_guardian', 'shulker', 'vex',
      'evoker', 'vindicator', 'ravager', 'hoglin', 'zoglin'
    ],

    start: (target) => {
      if (bot.guard.isGuarding) {
        return;
      }
      bot.guard.isGuarding = true;
      bot.guard.guardTarget = target;

      bot.guard.playerAttackedListener = (entity) => {
        if (bot.guard.isGuarding && bot.guard.guardTarget && entity.id === bot.guard.guardTarget.id) {
          const attacker = bot.nearestEntity((e) => e.type === 'mob' || e.type === 'player' && e.uuid !== bot.guard.guardTarget.uuid && e.position.distanceTo(entity.position) < 10);
          if (attacker) {
            bot.pvp.start(attacker);
            bot.chat(`Defending ${bot.guard.guardTarget.username || bot.guard.guardTarget.name} from ${attacker.username || attacker.name}!`);
          }
        }
      };
      bot.on('entityHurt', bot.guard.playerAttackedListener);

      bot.guard.guardInterval = setInterval(() => {
        if (!bot.guard.isGuarding) return;

        const hostiles = findHostileMob(bot);
        if (hostiles.length > 0) {
          const closestHostile = hostiles[0];
          const distanceToGuardTarget = bot.entity.position.distanceTo(bot.guard.guardTarget.position);

          if (distanceToGuardTarget > 8) {
            if (!bot.pathfinder.goal || bot.pathfinder.goal.entity !== bot.guard.guardTarget) {
              const goal = new GoalFollow(bot.guard.guardTarget, 5);
              bot.pathfinder.setGoal(goal, true);
            }
          } else {
            if (!bot.pathfinder.goal || bot.pathfinder.goal.entity !== closestHostile) {
              const goal = new GoalFollow(closestHostile, 2.5);
              bot.pathfinder.setGoal(goal, true);
            }
          }

          for (let i = 0; i < Math.min(hostiles.length, 20); i++) {
            const hostile = hostiles[i];
            const distanceToHostile = bot.entity.position.distanceTo(hostile.position);

            if (distanceToHostile < 3) {
              bot.setControlState('jump', true);
              setTimeout(() => {
                bot.setControlState('jump', false);
                bot.attack(hostile);
              }, 200);
            } else if (distanceToHostile < 4) {
              bot.attack(hostile);
            }
          }
        } else if (bot.guard.guardTarget) {
          const distanceToTarget = bot.entity.position.distanceTo(bot.guard.guardTarget.position);
          if (distanceToTarget > 2) {
            const goal = new GoalFollow(bot.guard.guardTarget, 2);
            bot.pathfinder.setGoal(goal);
          } else {
            bot.pathfinder.stop();
            bot.lookAt(bot.guard.guardTarget.position.offset(0, bot.guard.guardTarget.height, 0));
          }
        } else {
          bot.pathfinder.stop();
        }
      }, 250);
    },

    stop: () => {
      if (!bot.guard.isGuarding) {
        return;
      }
      bot.guard.isGuarding = false;
      bot.guard.guardTarget = null;
      clearInterval(bot.guard.guardInterval);
      if (bot.guard.playerAttackedListener) {
        bot.removeListener('entityHurt', bot.guard.playerAttackedListener);
        bot.guard.playerAttackedListener = null;
      }
      bot.pathfinder.stop();
      bot.pvp.stop();
    }
  };
}

module.exports = {
  initGuard
};
