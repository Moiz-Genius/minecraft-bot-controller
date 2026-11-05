const chalk = new (require('chalk')).Chalk();
const figlet = require('figlet');
const { ask } = require('../utils/ui');
const { startBotSystem } = require('./bot');
const { startDDoS } = require('./ddos');
const { showServerInfo } = require('../misc/serverInfo');
const { startServerChat } = require('../misc/serverChat');
const { scanPlugins } = require('../misc/pluginScanner');
const proxyManager = require('./proxyManager');
const { getLocalIP } = require('../utils/network');
const { menuItems } = require('./menuItems');
const themeManager = require('./themeManager');

function displayBanner() {
    console.clear();
    const bannerText = figlet.textSync('MOIZ', { font: 'ANSI Shadow' });

    // Delegate rendering to current theme
    themeManager.renderMenu(bannerText, menuItems);
}

function startDashboardMode() {
    const localIP = getLocalIP();
    console.log(chalk.hex('#4169e1')('\n[SYSTEM] Dashboard Mode Active.'));
    console.log(chalk.hex('#ffd700')(`Access control panel:`));
    console.log(chalk.cyan(`    Local:   http://localhost:3000`));
    console.log(chalk.magenta(`    Network: http://${localIP}:3000`));
    console.log(chalk.gray('Navigate via the browser to control all modules.'));

    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(chalk.white('\nPress Enter to return to Main Menu...'), () => {
        rl.close();
        mainMenu();
    });
}

async function mainMenu(dashboard) {
    displayBanner();

    // Prompts also need to be themed, but for now we'll stick to a standard prompt or theme it
    const currentTheme = themeManager.getCurrentTheme();

    // We can't really "theme" the readline prompt easily deeper in 'ask' without refactoring 'ui.js' slightly,
    // but we can pass colors. For now, let's just use the ask function with theme-agnostic or theme-specific defaults?
    // Let's stick to standard behavior or ask the theme manager for prompt colors.

    const choice = await ask('Directive', ['#00ffff', '#ffffff'], '1');

    if (['1', '2', '3', '4', '6'].includes(choice)) {
        const mode = await ask('Control Mode [CMD/WEB]', ['#87CEEB', '#ffffff'], 'CMD');
        if (mode.toUpperCase() === 'WEB') {
            startDashboardMode();
            return;
        }
    }

    // Pass dashboard instances if needed by sub-functions
    switch (choice) {
        case '1':
            await startBotSystem(() => mainMenu(dashboard), dashboard);
            break;
        case '2':
            await startDDoS(null, dashboard);
            mainMenu(dashboard);
            break;
        case '3':
            await showServerInfo(null, dashboard);
            mainMenu(dashboard);
            break;
        case '4':
            await startServerChat(null, dashboard);
            mainMenu(dashboard);
            break;
        case '5':
            startDashboardMode();
            break;
        case '6':
            await scanPlugins(() => mainMenu(dashboard), dashboard);
            break;
        case '7':
            console.log(chalk.hex('#ffd700')('System Shutdown. Goodbye, Operator.'));
            process.exit(0);
            break;
        case '8':
            await proxyManager.interactiveManager(() => mainMenu(dashboard));
            break;
        case '9': // Theme Selector
            await themeManager.selectTheme();
            mainMenu(dashboard);
            break;
        default:
            console.log(chalk.red('Invalid Directive. Retrying...'));
            setTimeout(() => mainMenu(dashboard), 1000);
            break;
    }
}

module.exports = { mainMenu };
