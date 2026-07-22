const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_DIR = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFileName() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return `billing-${dateStr}.log`;
}

function getLogFilePath() {
  return path.join(LOG_DIR, getLogFileName());
}

function formatLog(level, message, meta = {}) {
  const now = new Date();
  const timestamp = now.toISOString();
  const hostname = os.hostname();
  const pid = process.pid;
  let metaStr = '';
  if (meta && Object.keys(meta).length > 0) {
    metaStr = ' ' + JSON.stringify(meta);
  }
  return `[${timestamp}] [${hostname}:${pid}] [${level.toUpperCase()}] ${message}${metaStr}${os.EOL}`;
}

function rotateLogFile() {
  const logPath = getLogFilePath();
  // Keep max 30 log files
  if (!fs.existsSync(LOG_DIR)) return;
  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('billing-') && f.endsWith('.log'))
    .sort()
    .reverse();
  if (files.length > 30) {
    for (let i = 30; i < files.length; i++) {
      try {
        fs.unlinkSync(path.join(LOG_DIR, files[i]));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

class Logger {
  constructor(name = 'billing') {
    this.name = name;
  }

  _log(level, message, meta = {}) {
    const logLine = formatLog(level, `[${this.name}] ${message}`, meta);
    // Write to console
    console.log(logLine.trim());
    // Write to file
    try {
      fs.appendFileSync(getLogFilePath(), logLine);
    } catch (e) {
      console.error(`Failed to write log to file: ${e.message}`);
    }
  }

  info(message, meta = {}) {
    this._log('info', message, meta);
  }

  success(message, meta = {}) {
    this._log('success', message, meta);
  }

  warn(message, meta = {}) {
    this._log('warn', message, meta);
  }

  error(message, error, meta = {}) {
    const errorMeta = {
      ...meta,
      errorMessage: error?.message,
      errorStack: error?.stack,
    };
    this._log('error', message, errorMeta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this._log('debug', message, meta);
    }
  }
}

// Initialize and rotate logs on startup
rotateLogFile();

module.exports = { Logger };
