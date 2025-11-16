/**
 * Professional Logger System
 *
 * Remplace tous les console.log par un système professionnel
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    this.currentLevel = process.env.LOG_LEVEL || 'info';
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.currentLevel];
  }

  write(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, meta);

    // Console output (avec couleurs)
    const colors = {
      debug: '\x1b[36m',   // Cyan
      info: '\x1b[32m',    // Green
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m'    // Red
    };
    console.log(`${colors[level]}${formatted.trim()}\x1b[0m`);

    // File output
    const logFile = path.join(this.logDir, `${level}.log`);
    fs.appendFileSync(logFile, formatted, 'utf8');

    // All logs
    const allFile = path.join(this.logDir, 'all.log');
    fs.appendFileSync(allFile, formatted, 'utf8');
  }

  debug(message, meta) {
    this.write('debug', message, meta);
  }

  info(message, meta) {
    this.write('info', message, meta);
  }

  warn(message, meta) {
    this.write('warn', message, meta);
  }

  error(message, error) {
    const meta = error ? {
      message: error.message,
      stack: error.stack,
      ...error
    } : {};
    this.write('error', message, meta);
  }
}

module.exports = new Logger();
