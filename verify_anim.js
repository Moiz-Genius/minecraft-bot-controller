const { ask } = require('./utils/ui');

(async () => {
    console.log('Testing animation...');
    const name = await ask('What is your name?');
    console.log(`Hello, ${name}!`);
    process.exit(0);
})();
