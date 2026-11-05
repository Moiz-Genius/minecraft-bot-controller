module.exports = {
    name: 'help',
    description: 'Show help message with available commands.',
    aliases: ['h', 'cmds'],
    execute: async (bot, username, args, outputMode = 'chat') => {
        const helpMessages = [
            '--- Bot Commands ---',
            'Usage: !bot_0 <command> or @all <command>',
            '!help, !come, !goto <x> <y> <z>, !follow [user]',
            '!guard, !pvp <user>, !craft <item> [count]',
            '!equip <item>, !toss <item>, !list',
            '!pathfind <x> <y> <z>, !stop-pathfind',
            '!autobridge <on|off>, !afk <on|off>',
            '!version, !exit, !stop',
            '--------------------'
        ];

        let i = 0;
        function sendHelpMessage() {
            if (i < helpMessages.length) {
                bot.whisper(username, helpMessages[i]);
                i++;
                setTimeout(sendHelpMessage, 1500);
            }
        }
        sendHelpMessage();
    }
};
