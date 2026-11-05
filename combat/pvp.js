const { getBestWeapon } = require('../utils/autoTools.js');
const { GoalFollow } = require('mineflayer-pathfinder').goals;
const Logger = require('../utils/logger');

function initPvp(bot) {
  if (!bot.pvp) {
    Logger.error('PvP plugin not loaded. bot.pvp is undefined.');
    return;
  }

  bot.pvp.target = null;

  bot.pvp.start = (target) => {
    if (!target) return;
    bot.pvp.target = target;

    const bestWeapon = getBestWeapon(bot);
    if (bestWeapon) {
      bot.equip(bestWeapon, 'hand').catch(() => { });
    }

    bot.pvp.attack(target);
    Logger.chat('PvP', `Engaging ${target.username || 'target'} `);
  };

  const originalStop = bot.pvp.stop;
  bot.pvp.stop = () => {
    if (originalStop) originalStop.call(bot.pvp); // Call the plugin's stop with correct context
    bot.pvp.target = null;
    bot.pathfinder.stop();
    bot.setControlState('sprint', false);
    Logger.chat('PvP', 'Stopped fighting.');
  };

  bot.on('startedAttacking', () => {
  });

  bot.on('stoppedAttacking', () => {
  });

  bot.on('physicsTick', () => {
    if (!bot.pvp.target || !bot.pvp.target.position) return;
    if (bot.globals && bot.globals.isEatingGapple) return;

    const target = bot.pvp.target;
    const dist = bot.entity.position.distanceTo(target.position);

    if (dist > 3.5) {
      if (!bot.pathfinder.isMoving()) {
        bot.pathfinder.setGoal(new GoalFollow(target, 2), true);
      }
    } else {
      bot.lookAt(target.position.offset(0, target.height * 0.85, 0));
      bot.setControlState('sprint', true);

      if (bot.entity.onGround) {
        bot.setControlState('jump', true);
      } else {
        bot.setControlState('jump', false);
      }

      if (bot.entity.velocity.y < -0.1) {
        let cooldown = 1250; // Default for swords

        if (!bot.pvp.lastAttack || Date.now() - bot.pvp.lastAttack > cooldown) {
          bot.attack(target);
          bot.pvp.lastAttack = Date.now();
        }
      }
    }
  });
}

module.exports = { initPvp };
