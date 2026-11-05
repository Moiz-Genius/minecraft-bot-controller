const { scanPlugins } = require('./misc/pluginScanner');

const mockDashboard = {
    io: {
        emit: (event, data) => {
            console.log(`[EMIT] ${event}:`, JSON.stringify(data, null, 2));
            if (event === 'pluginResult') {
                console.log('Test Passed: Received result.');
                process.exit(0);
            }
        }
    }
};

console.log('--- Connecting to Localhost... ---');
scanPlugins({ ip: 'localhost', port: 25565 }, mockDashboard);

// 20s timeout
setTimeout(() => {
    console.log('Timeout waiting for response.');
    process.exit(1);
}, 20000);
