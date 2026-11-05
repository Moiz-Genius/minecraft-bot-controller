require('dotenv').config();

module.exports = {
    bot: {
        defaultIp: process.env.BOT_DEFAULT_IP || 'localhost',
        defaultPort: process.env.BOT_DEFAULT_PORT || '25565',
        defaultVersion: process.env.BOT_DEFAULT_VERSION || '1.20.1',
        defaultNumBots: 1,
        reconnectDelay: 5000,
        colors: ['#8e44ad', '#2ecc71'] // Main theme colors
    },
    dashboard: {
        port: process.env.DASHBOARD_PORT || 3000,
        username: process.env.DASHBOARD_USER || 'admin',
        password: process.env.DASHBOARD_PASSWORD || 'password123',
        theme: 'cyberpunk'
    },
    ddos: {
        colors: ['#FF6347', '#FF4500', '#DC143C'],
        defaultDelay: 6000
    },
    serverInfo: {
        colors: ['#ADD8E6', '#87CEEB', '#4682B4']
    },
    chat: {
        colors: ['#AEC6CF', '#77B5D9', '#4682B4']
    },
    autoEat: {
        priority: 'foodPoints',
        startAt: 14,
        bannedFood: []
    },
    globals: {
        guardRange: 10
    }
};
