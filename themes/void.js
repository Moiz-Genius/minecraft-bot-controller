const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Void Walker",
    renderTitle: (figletText) => {
        const colors = ['#4B0082', '#000000', '#800080']; // Indigo -> Black -> Purple
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#8A2BE2', '#4B0082'];
        return gradientText('    NULL POINTER // ABYSS GAZING', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#9400D3')('    ' + '∅'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('DARK MATTER:', ['#9370DB', '#D8BFD8']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#BA55D3', '#E6E6FA'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#9370DB', '#ffffff']);
    }
};
