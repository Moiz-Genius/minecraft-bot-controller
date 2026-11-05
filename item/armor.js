const chalk = new (require('chalk')).Chalk();

function getArmorTypeForSlot(slot) {
  switch (slot) {
    case 'head': return 'helmet';
    case 'torso': return 'chestplate';
    case 'legs': return 'leggings';
    case 'feet': return 'boots';
    default: return '';
  }
}

function getSlotId(slot) {
  switch (slot) {
    case 'head': return 5;
    case 'torso': return 6;
    case 'legs': return 7;
    case 'feet': return 8;
    default: return -1;
  }
}



// CRITICAL FIX: Must be async to prevent race conditions with Totem equipping
async function equipBestArmor(bot) {
  const armorOrder = {
    'leather': 1, 'golden': 2, 'chainmail': 3, 'iron': 4, 'diamond': 5, 'netherite': 6
  };
  const enchantmentScores = {
    'protection': 5, 'fire_protection': 3, 'feather_falling': 2, 'blast_protection': 3, 'projectile_protection': 3,
    'respiration': 1, 'aqua_affinity': 1, 'thorns': 2, 'depth_strider': 1, 'frost_walker': 1,
    'unbreaking': 2, 'mending': 5
  };
  const armorSlots = ['head', 'torso', 'legs', 'feet'];

  for (const slot of armorSlots) {
    let bestArmor = null;
    let bestArmorScore = 0;

    for (const item of bot.inventory.items()) {
      if (item.name.includes(getArmorTypeForSlot(slot))) {
        const armorMaterial = item.name.split('_')[0];
        let currentArmorScore = armorOrder[armorMaterial] || 0;

        if (item.nbt && item.nbt.value.Enchantments) {
          for (const enchantment of item.nbt.value.Enchantments.value.value) {
            const enchName = enchantment.id.value.split(':')[1];
            const enchLevel = enchantment.lvl.value;
            currentArmorScore += (enchantmentScores[enchName] || 0) * enchLevel;
          }
        }

        if (currentArmorScore > bestArmorScore) {
          bestArmor = item;
          bestArmorScore = currentArmorScore;
        }
      }
    }

    const equippedItem = bot.inventory.slots[getSlotId(slot)];
    let equippedArmorScore = 0;
    if (equippedItem) {
      const equippedArmorMaterial = equippedItem.name.split('_')[0];
      equippedArmorScore = armorOrder[equippedArmorMaterial] || 0;

      if (equippedItem.nbt && equippedItem.nbt.value.Enchantments) {
        for (const enchantment of equippedItem.nbt.value.Enchantments.value.value) {
          const enchName = enchantment.id.value.split(':')[1];
          const enchLevel = enchantment.lvl.value;
          equippedArmorScore += (enchantmentScores[enchName] || 0) * enchLevel;
        }
      }
    }

    if (bestArmor && bestArmorScore > equippedArmorScore) {
      try {
        await bot.equip(bestArmor, slot);
      } catch (err) {
      }
    }
  }
}

async function equipTotem(bot) {
  const totem = bot.inventory.findInventoryItem('totem_of_undying');
  const offhandItem = bot.inventory.slots[45];

  if (totem && (!offhandItem || offhandItem.type !== totem.type || offhandItem.metadata !== totem.metadata)) {
    try {
      await bot.equip(totem, 'off-hand');
      console.log(chalk.magenta(`${bot.username} equipped Totem of Undying.`));
    } catch (err) {
      console.log(chalk.red(`${bot.username} totem equip error: ${err.message}`));
    }
  }
}

module.exports = {
  equipBestArmor,
  equipTotem
};
