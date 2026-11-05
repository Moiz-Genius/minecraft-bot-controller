const { fancyChat } = require('../core/fancy_chat.js');
const Vec3 = require('vec3');

module.exports = {
    name: 'tower',
    description: 'Build a tower straight up.',
    execute: async (bot, username, args) => {
        const height = args.length > 0 ? parseInt(args[0]) : 5; // Default 5 blocks
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
            // Restore autoeat
            if (bot.autoEat) {
                if (typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
                else if (typeof bot.autoEat.enableAutoEat === 'function') bot.autoEat.enableAutoEat();
            }
            return;
        }

        await bot.equip(blockItem, 'hand');
        bot.setControlState('jump', true);

        while (bot.entity.position.y < targetY) {
            if (!bot.globals.isTowering) break;

            const currentBlock = bot.inventory.items().find(item => bot.registry.blocks[item.type] && bot.registry.blocks[item.type].boundingBox === 'block');
            if (!currentBlock) {
                fancyChat(bot, 'Ran out of blocks!');
                bot.globals.isTowering = false;
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
                } catch (err) { }
            }

            bot.setControlState('jump', true);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        bot.setControlState('jump', false);
        bot.globals.isTowering = false;
        if (bot.autoEat) {
            if (typeof bot.autoEat.enable === 'function') bot.autoEat.enable();
            else if (typeof bot.autoEat.enableAutoEat === 'function') bot.autoEat.enableAutoEat();
        }
        fancyChat(bot, 'Tower complete.');
    }
};
