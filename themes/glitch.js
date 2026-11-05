const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Spectral Glitch",
    renderTitle: (figletText) => {
        const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF'];
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#FFFFFF', '#000000'];
        return gradientText('    SYSTEM ERROR // REALITY BREACH', colors);
    },
    renderSeparator: () => {
        return chalk.white('    ' + '#?!'.repeat(15));
    },
    renderMenuHeader: () => {
        return gradientText('CORRUPTED DATA:', ['#FFFFFF', '#A9A9A9']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#FFFFFF', '#808080'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#FFFFFF', '#000000']);
    }
};
