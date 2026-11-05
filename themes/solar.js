const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Solar Flare",
    renderTitle: (figletText) => {
        const colors = ['#FFFF00', '#FFA500', '#FF4500']; // Yellow -> Orange -> Red-Orange
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#FFA500', '#FFFF00'];
        return gradientText('    SOLAR CORE // FUSION IMMINENT', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#FFA500')('    ' + '☼'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('SYSTEM HEAT:', ['#FFA500', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#FFFF00', '#FF8C00'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#FFA500', '#ffffff']);
    }
};
