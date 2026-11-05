const { Vec3 } = require('vec3');

function initAntiKnockback(bot) {
  let lastVelocity = new Vec3(0, 0, 0);
  let antiKbActive = false;

  bot.on('physicsTick', () => {
    if (!bot.pvp.isFighting) return;

    const currentVelocity = bot.entity.velocity;
    const velocityChange = currentVelocity.minus(lastVelocity);

    if (Math.abs(velocityChange.y) > 0.1 || Math.sqrt(velocityChange.x * velocityChange.x + velocityChange.z * velocityChange.z) > 0.2) {
      if (!antiKbActive) {
        antiKbActive = true;
        const oppositeDir = velocityChange.scaled(-1).normalize();

        if (oppositeDir.x > 0.5) bot.setControlState('right', true);
        else if (oppositeDir.x < -0.5) bot.setControlState('left', true);

        if (oppositeDir.z > 0.5) bot.setControlState('back', true);
        else if (oppositeDir.z < -0.5) bot.setControlState('forward', true);

        setTimeout(() => {
          bot.clearControlStates();
          antiKbActive = false;
        }, 100);
      }
    }
    lastVelocity = currentVelocity;
  });
}

module.exports = {
  initAntiKnockback
};
