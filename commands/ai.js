const AIHandler = require('../utils/aiHandler');
const { fancyChat } = require('../core/fancy_chat');

module.exports = {
    name: 'ai',
    description: 'Interact with the bot using AI, with ability to execute simple actions.',
    aliases: ['ask'],
    execute: async (bot, username, args) => {
        if (args.length === 0) {
            fancyChat(bot, 'Usage: !ai <instruction/question>');
            return;
        }

        const userPrompt = args.join(' ');
        // fancyChat(bot, 'Thinking...'); // Removed per user request

        // 1. Gather Context
        const inventory = bot.inventory.items().map(item => ({
            name: item.name,
            count: item.count
        }));

        const context = {
            username: bot.username,
            health: bot.health,
            food: bot.food,
            position: bot.entity.position,
            heldItem: bot.heldItem ? bot.heldItem.name : 'none',
            inventory: inventory,
            nearbyEntities: Object.values(bot.entities)
                .filter(e => e.type === 'player' || e.type === 'hostile')
                .filter(e => e.position.distanceTo(bot.entity.position) < 10)
                .map(e => ({ type: e.type, username: e.username, dist: Math.floor(e.position.distanceTo(bot.entity.position)) }))
        };

        const contextString = JSON.stringify(context, null, 2);

        // 2. Build System Prompt
        const systemPrompt = `
You are a Minecraft Bot Controller. Your name is ${bot.username}.
You are currently in a server.
Here is your current internal state:
${contextString}

The user "${username}" has given you an instruction: "${userPrompt}".

If the user is asking you to perform an action, you must output a valid JSON object describing the function to call.
Supported Actions:
- toss: { "action": "toss", "item": "item_name", "count": number }
- equip: { "action": "equip", "item": "item_name", "destination": "hand"|"off-hand"|"head"|"torso"|"legs"|"feet" }
- chat: { "action": "chat", "message": "text" }
- look: { "action": "look", "yaw": number, "pitch": number } (yaw/pitch in radians) or { "action": "lookAt", "target": "username" }

If the user just wants to chat or asks a question, reply with a JSON object:
{ "action": "chat", "message": "Your answer here" }

IMPORTANT: RETURN ONLY THE JSON OBJECT. NO MARKDOWN. NO CODE BLOCKS.
`;

        try {
            const responseText = await AIHandler.askOpenRouter(userPrompt, systemPrompt);
            // console.log(`[AI RAW] ${responseText}`); // Removed debug log

            // Cleanup response if it contains markdown code blocks
            // Use Regex to find the JSON object even if there is surrounding text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            let command;
            try {
                command = JSON.parse(cleanJson);
            } catch (e) {
                // If parse fails, treat as chat
                fancyChat(bot, `AI: ${responseText}`);
                return;
            }

            // console.log(`[AI CMD]`, command); // Removed debug log

            // 3. Execute Action
            if (command.action === 'chat') {
                fancyChat(bot, `AI: ${command.message}`);
            } else if (command.action === 'toss') {
                const item = bot.inventory.items().find(i => i.name.includes(command.item));
                if (item) {
                    const count = command.count || item.count;
                    await bot.toss(item.type, null, count);
                    fancyChat(bot, `Dropped ${count} ${item.name}.`);
                } else {
                    fancyChat(bot, `I don't have ${command.item}.`);
                }
            } else if (command.action === 'equip') {
                const item = bot.inventory.items().find(i => i.name.includes(command.item));
                if (item) {
                    await bot.equip(item, command.destination || 'hand');
                    fancyChat(bot, `Equipped ${item.name}.`);
                } else {
                    fancyChat(bot, `I don't have ${command.item}.`);
                }
            } else if (command.action === 'lookAt') {
                const target = Object.values(bot.players).find(p => p.username === command.target);
                const entity = target ? target.entity : null;
                if (entity) {
                    await bot.lookAt(entity.position.offset(0, entity.height, 0));
                    fancyChat(bot, `Looking at ${command.target}.`);
                } else {
                    fancyChat(bot, `Can't see ${command.target}.`);
                }
            } else {
                fancyChat(bot, `AI Suggested generic action: ${JSON.stringify(command)}`);
            }

        } catch (err) {
            fancyChat(bot, `AI Error: ${err.message}`);
        }
    }
};
