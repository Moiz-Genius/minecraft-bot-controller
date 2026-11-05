const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Retro Synth",
    renderTitle: (figletText) => {
        const colors = ['#FFD700', '#FF00FF']; // Gold -> Magenta
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#FF00FF', '#00FFFF'];
        return gradientText('    SUNSET STRIP // 1984', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#FF00FF')('    ' + '★'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('CASSETTE DECK:', ['#FFD700', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#FF69B4', '#DAA520'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#FF00FF', '#ffffff']);
    }
};
