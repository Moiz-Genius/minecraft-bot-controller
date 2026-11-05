const { Vec3 } = require('vec3');

function initEnderpearl(bot) {
  bot.enderpearl = {
    throwPearl: async (target) => {
      const pearl = bot.inventory.findInventoryItem('ender_pearl');
      if (!pearl) {
        return;
      }

      const originalHeldItem = bot.heldItem;
      try {
        await bot.equip(pearl, 'hand');

        const targetPos = target.position.offset(0, target.height * 0.8, 0);
        const botPos = bot.entity.position.offset(0, bot.entity.height, 0);
        const diff = targetPos.minus(botPos);

        const yaw = Math.atan2(-diff.x, -diff.z);
        const pitch = Math.atan2(diff.y, Math.sqrt(diff.x * diff.x + diff.z * diff.z));

        await bot.look(yaw, pitch, true);
        bot.activateItem();
      } catch (err) {
        console.error(`Ender pearl throw error: ${err.message}`);
      } finally {
        if (originalHeldItem) {
          await bot.equip(originalHeldItem, 'hand');
        }
      }
    }
  };
}

module.exports = {
  initEnderpearl
};
