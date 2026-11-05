const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Neon Genesis",
    renderTitle: (figletText) => {
        const colors = ['#00ffff', '#ff00ff']; // Cyan -> Magenta
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#00ffff', '#ff00ff'];
        return gradientText('    MOIZ CONTROL SYSTEMS // OPERATIONAL DOMINANCE', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#00ffff')('    ' + '═'.repeat(45));
    },
    renderMenuHeader: () => {
        return gradientText('COMMAND TERMINAL:', ['#00ffff', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#ff00ff', '#00ffff'];
        return gradientText(` [${key}] ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#00ffff', '#ffffff']);
    }
};
