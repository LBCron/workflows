/**
 * Simple Logger for AI Agent Swarm
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

function log(level, message, ...args) {
  if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, message, ...args);
  }
}

module.exports = {
  debug: (message, ...args) => log('debug', message, ...args),
  info: (message, ...args) => log('info', message, ...args),
  warn: (message, ...args) => log('warn', message, ...args),
  error: (message, ...args) => log('error', message, ...args)
};
