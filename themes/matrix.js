const chalk = new (require('chalk')).Chalk();
const { gradientText } = require('../utils/ui');

module.exports = {
    name: "Matrix Core",
    renderTitle: (figletText) => {
        const colors = ['#00FF00', '#003300']; // Bright Green -> Dark Green
        return gradientText(figletText, colors);
    },
    renderSubtitle: () => {
        const colors = ['#00FF00', '#008000'];
        return gradientText('    SYSTEM ROOT // ACCESS GRANTED', colors);
    },
    renderSeparator: () => {
        return chalk.hex('#00FF00')('    ' + '01'.repeat(22));
    },
    renderMenuHeader: () => {
        return gradientText('MAINFRAME I/O:', ['#00FF00', '#ffffff']);
    },
    renderOption: (key, label) => {
        const optionColors = ['#00FF00', '#32CD32'];
        return gradientText(` <${key}> ${label}`, optionColors);
    },
    renderPrompt: (text) => {
        return gradientText(text, ['#00FF00', '#ffffff']);
    }
};
