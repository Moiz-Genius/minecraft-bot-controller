const fs = require('fs');
const path = require('path');
const { ask } = require('../utils/ui');
const chalk = new (require('chalk')).Chalk();

const THEMES = {
    '1': require('../themes/neon'),
    '2': require('../themes/king'),
    '3': require('../themes/shadow'),
    '4': require('../themes/matrix'),
    '5': require('../themes/crimson'),
    '6': require('../themes/ocean'),
    '7': require('../themes/retro'),
    '8': require('../themes/glitch'),
    '9': require('../themes/solar'),
    '10': require('../themes/void')
};

const CONFIG_FILE = path.join(__dirname, '../theme_config.json');

let currentTheme = THEMES['1'];

function loadTheme() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(data);
            if (config.themeId && THEMES[config.themeId]) {
                currentTheme = THEMES[config.themeId];
            }
        }
    } catch (err) {
        // Ignore error, default to Neon
    }
}

function saveTheme(themeId) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ themeId }, null, 2));
    } catch (err) {
        console.error("Failed to save theme config:", err);
    }
}

function getCurrentTheme() {
    return currentTheme;
}

// Renders the full menu using the current theme
function renderMenu(figletText, menuItems) {
    console.log(currentTheme.renderTitle(figletText)); // Already clears console in displayBanner? No, moved to menu.js
    console.log(currentTheme.renderSubtitle());
    console.log(currentTheme.renderSeparator());
    console.log('');
    console.log(currentTheme.renderMenuHeader());

    menuItems.forEach(item => {
        console.log(currentTheme.renderOption(item.key, item.label));
    });
    console.log('');
}

async function selectTheme() {
    console.clear();
    console.log(chalk.bold.white("SELECT THEME SYSTEM:"));
    console.log("");
    Object.keys(THEMES).forEach(key => {
        const theme = THEMES[key];
        console.log(chalk.cyan(` [${key}] ${theme.name}`));
    });
    console.log("");

    const choice = await ask("Choose Theme", ['#ffffff', '#000000'], '1');
    if (THEMES[choice]) {
        currentTheme = THEMES[choice];
        saveTheme(choice);
        console.log(chalk.green(`\nTheme switched to: ${currentTheme.name}`));
    } else {
        console.log(chalk.red("Invalid theme selection."));
    }
    await new Promise(r => setTimeout(r, 1000));
}

module.exports = {
    loadTheme,
    getCurrentTheme,
    renderMenu,
    selectTheme
};
