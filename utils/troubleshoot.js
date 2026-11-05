const { exec } = require('child_process');

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${command}`);
                console.error(stderr);
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

async function troubleshoot() {
    console.log('--- Troubleshooting Information ---');

    try {
        const nodeVersion = await runCommand('node -v');
        console.log(`Node.js Version: ${nodeVersion}`);
    } catch (error) {
        console.log('Node.js is not installed or not in PATH.');
    }

    try {
        const npmVersion = await runCommand('npm -v');
        console.log(`NPM Version: ${npmVersion}`);
    } catch (error) {
        console.log('NPM is not installed or not in PATH.');
    }

    console.log('\n--- Installed Dependencies ---');
    try {
        const npmList = await runCommand('npm list --depth=0');
        console.log(npmList);
    } catch (error) {
        console.log('Could not list installed dependencies.');
    }

    console.log('\n--- Checking mineflayer-pvp ---');
    try {
        const pvpPackageInfo = await runCommand('npm view mineflayer-pvp version');
        console.log(`Latest mineflayer-pvp version: ${pvpPackageInfo}`);
    } catch (error) {
        console.log('Could not get mineflayer-pvp package information.');
    }

    console.log('\n--- Instructions ---');
    console.log('Please provide the full output of this script to the support team.');
    console.log('If you are still having issues, please also provide the full output of the `npm install` command.');
}

troubleshoot();
