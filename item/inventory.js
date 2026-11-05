const chalk = new (require('chalk')).Chalk();

async function handleSortInventoryCommand(bot) {
  const inventory = bot.inventory.items();
  const sortedItems = {};

  for (const item of inventory) {
    if (!sortedItems[item.name]) {
      sortedItems[item.name] = [];
    }
    sortedItems[item.name].push(item);
  }

  let currentSlot = 9;
  for (const itemType in sortedItems) {
    for (const item of sortedItems[itemType]) {
      if (item.slot !== currentSlot) {
        try {
          await bot.moveItem(item.slot, currentSlot);
        } catch (err) {
          console.log(chalk.red(`Inventory sort error: ${err.message}`));
          return;
        }
      }
      currentSlot++;
    }
  }
  bot.chat('Inventory sorted!');
}

module.exports = {
  handleSortInventoryCommand
};
