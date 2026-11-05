const Dashboard = require('./dashboard/server');
const { mainMenu } = require('./core/menu');
const themeManager = require('./core/themeManager');

// Swallow specific warnings if needed
const originalWarn = console.warn;
console.warn = function (...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('physicTick')) return;
  originalWarn.apply(console, args);
};

const dashboard = new Dashboard(3000);

(async () => {
  try {
    themeManager.loadTheme();
    await dashboard.start();
    // Give a brief moment for startup logs
    await new Promise(r => setTimeout(r, 100));
    mainMenu(dashboard);
  } catch (err) {
    console.error('Failed to start system:', err);
  }
})();
