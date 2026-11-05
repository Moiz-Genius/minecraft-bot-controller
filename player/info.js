function handleTimeCommand(bot) {
  const time = bot.time.timeOfDay;
  bot.chat(`Current in-game time: ${time}`);
}

function handleWeatherCommand(bot) {
  const weather = bot.weather.fromString(bot.weather);
  bot.chat(`Current weather: ${weather}`);
}

module.exports = {
  handleTimeCommand,
  handleWeatherCommand
};
