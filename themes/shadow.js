const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Shadow Ops",
    renderTitle: (figletText) => {
        const colors = ['#2C3E50', '#95A5A6']; // Dark Blue -> Grey
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#7F8C8D', '#BDC3C7'];
        return gradientText('    COVERT OPS // SILENT STRIKE', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#95A5A6')('    ' + '-'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('MISSION PROFILE:', ['#95A5A6', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#7F8C8D', '#ECF0F1'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#95A5A6', '#ffffff']);
    }
};
