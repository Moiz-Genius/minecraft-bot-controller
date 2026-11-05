const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger.js');
const { fancyChat } = require('../core/fancy_chat.js');

const commands = new Map();
const aliases = new Map();

// Load commands dynamically
const commandsPath = path.join(__dirname, '../commands');

function loadCommands() {
    commands.clear();
    aliases.clear();

    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath);
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            if (command.name) {
                commands.set(command.name, command);
                // Logger.info(`Loaded command: ${command.name}`);

                if (command.aliases && Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        aliases.set(alias, command.name);
                    }
                }
            }
        } catch (error) {
            Logger.error(`Error loading command ${file}: ${error.message}`);
        }
    }
}

// Initial load
loadCommands();

async function handleCommand(bots, username, message) {
    const args = message.trim().split(/\s+/);
    const selectors = args.filter(arg => arg.startsWith('!') || arg.startsWith('@'));
    const commandArgs = args.filter(arg => !arg.startsWith('!') && !arg.startsWith('@'));
    const commandTrigger = commandArgs[0]?.toLowerCase();

    if (!commandTrigger) return;

    // Resolve command from alias
    let commandName = commandTrigger;
    if (aliases.has(commandTrigger)) {
        commandName = aliases.get(commandTrigger);
    }

    if (!commands.has(commandName)) return;
    const command = commands.get(commandName);

    // Determine targeted bots
    let targetedBots = bots;
    if (selectors.length > 0) {
        // If any broadcast selector is present, target all
        const isBroadcast = selectors.some(s => ['!all', '!*', '@a'].includes(s.toLowerCase()));
        if (!isBroadcast) {
            // Filter specific bots
            targetedBots = bots.filter(bot =>
                selectors.some(s => s.toLowerCase().replace('!', '') === bot.username.toLowerCase())
            );
        }
    }

    if (targetedBots.length === 0) return;

    for (const bot of targetedBots) {
        try {
            // Logging Middleware (Dashboard logging will be added here later)
            // console.log(`[CMD] ${username} -> ${bot.username}: ${message}`);

            await command.execute(bot, username, commandArgs.slice(1));

        } catch (error) {
            Logger.error(`Error in command handler for message "${message}" on bot ${bot.username}:`, error);
            fancyChat(bot, "Sorry, I encountered an error while processing your command.");
        }
    }
}

module.exports = {
    handleCommand,
    loadCommands
};
