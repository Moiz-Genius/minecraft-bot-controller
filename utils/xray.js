const chalk = new (require('chalk')).Chalk();

function initXray(bot) {
  bot.xray = {
    findBlockXray: (blockName, radius) => {
      const blockType = bot.registry.blocksByName[blockName];
      if (!blockType) {
        bot.chat(`Unknown block: ${blockName}`);
        return null;
      }

      const blocks = bot.findBlocks({
        matching: [blockType.id],
        maxDistance: radius,
        count: 1000
      });

      return blocks;
    }
  };
}

module.exports = {
  initXray
};
