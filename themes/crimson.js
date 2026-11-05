const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Crimson Fury",
    renderTitle: (figletText) => {
        const colors = ['#FF0000', '#FF4500']; // Red -> Orange
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#FF4500', '#8B0000'];
        return gradientText('    WAR PROTOCOL // ENGAGED', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#FF0000')('    ' + 'X'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('ATTACK VECTORS:', ['#FF0000', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#FF4500', '#FF6347'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#FF0000', '#ffffff']);
    }
};
