const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "King's Domain",
    renderTitle: (figletText) => {
        const colors = ['#FFD700', '#800080']; // Gold -> Purple
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#FFD700', '#DAA520'];
        return gradientText('    ROYAL CMD SYSTEM // SUPREME AUTHORITY', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#FFD700')('    ' + '✦'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('ROYAL DECREES:', ['#FFD700', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#DAA520', '#800080'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#FFD700', '#ffffff']);
    }
};
