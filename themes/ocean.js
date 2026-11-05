const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Oceanic Drift",
    renderTitle: (figletText) => {
        const colors = ['#00008B', '#00BFFF']; // DarkBlue -> DeepSkyBlue
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#00BFFF', '#E0FFFF'];
        return gradientText('    DEEP DIVE // LIQUID COOLING', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#00BFFF')('    ' + '~'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('SONAR READINGS:', ['#00BFFF', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#1E90FF', '#00FFFF'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#00BFFF', '#ffffff']);
    }
};
