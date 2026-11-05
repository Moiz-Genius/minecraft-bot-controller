const chalk = new (require('chalk')).Chalk();
const readline = require('readline');
const _chalkAnimation = require('chalk-animation');
const chalkAnimation = _chalkAnimation.default || _chalkAnimation;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function gradientText(text, colors) {
    let coloredText = '';
    const length = text.length;
    for (let i = 0; i < length; i++) {
        const colorIndex = Math.floor((i / length) * colors.length);
        const color = colors[colorIndex];
        coloredText += chalk.bold.hex(color)(text[i]);
    }
    return coloredText;
}

function gradientBlock(text, colors) {
    const lines = text.split('\n');
    const output = [];
    for (const line of lines) {
        const length = line.length;
        let coloredLine = '';
        for (let i = 0; i < length; i++) {
            const colorIndex = Math.floor((i / length) * colors.length);
            const color = colors[colorIndex];
            coloredLine += chalk.bold.hex(color)(line[i]);
        }
        output.push(coloredLine);
    }
    return output.join('\n');
}

async function animateTitle(text) {
    const animation = chalkAnimation.rainbow(text);
    await sleep(2000);
    animation.stop();
}

let rlInstance = null;

function getExample() {
    if (!rlInstance) {
        rlInstance = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    return rlInstance;
}

async function ask(question, colors = ['#8e44ad', '#2ecc71'], defaultValue = '') {
    const rl = getExample();

    return new Promise((resolve) => {
        const promptText = gradientText(question, colors);
        const defaultText = defaultValue ? chalk.gray(` (default: ${defaultValue})`) : '';

        rl.question(`${promptText}${defaultText}: `, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

module.exports = {
    gradientText,
    gradientBlock,
    animateTitle,
    ask
};
