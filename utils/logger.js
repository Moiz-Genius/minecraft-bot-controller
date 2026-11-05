const chalk = new (require('chalk')).Chalk();

class Logger {
    static info(message) {
        console.log(chalk.hex('#4169e1')(`[INFO] `) + chalk.white(message));
    }

    static success(message) {
        console.log(chalk.bold.hex('#ffd700')(`[MOIZ] `) + chalk.white(message));
    }

    static warn(message) {
        console.log(chalk.hex('#ffa500')(`[WARN] `) + chalk.yellow(message));
    }

    static error(message, error = null) {
        console.log(chalk.bold.red(`[ERROR] `) + chalk.white(message));
        if (error) {
            console.error(chalk.red(error.stack || error));
        }
    }

    static chat(username, message) {
        console.log(chalk.hex('#4169e1')(`[RELAY] <${username}> `) + chalk.white(message));
    }

    static debug(message) {
    }
}

module.exports = Logger;
