/**
 * Testing Framework Logger
 * 
 * Provides structured logging for the migration testing framework
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class TestLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.logDir = options.logDir || path.join(__dirname, '../logs');
    this.logFile = options.logFile || 'test-framework.log';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    
    // Ensure log directory exists
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.colors = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.blue,
      debug: chalk.green,
      trace: chalk.gray
    };
  }

  /**
   * Log a message at the specified level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.logLevel]) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };
    
    // Console logging
    if (this.enableConsole) {
      const colorFn = this.colors[level] || chalk.white;
      const consoleMessage = `${chalk.gray(timestamp)} ${colorFn(`[${level.toUpperCase()}]`)} ${message}`;
      console.log(consoleMessage);
      
      if (meta && Object.keys(meta).length > 0) {
        console.log(chalk.gray(JSON.stringify(meta, null, 2)));
      }
    }
    
    // File logging
    if (this.enableFile) {
      const logPath = path.join(this.logDir, this.logFile);
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logPath, logLine);
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log trace message
   * @param {string} message - Trace message
   * @param {Object} meta - Additional metadata
   */
  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  /**
   * Create a child logger with additional context
   * @param {Object} context - Additional context to include in all logs
   * @returns {TestLogger} Child logger instance
   */
  child(context = {}) {
    const childLogger = new TestLogger({
      logLevel: this.logLevel,
      logDir: this.logDir,
      logFile: this.logFile,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile
    });
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, meta = {}) => {
      originalLog(level, message, { ...context, ...meta });
    };
    
    return childLogger;
  }

  /**
   * Start a timer for measuring test performance
   * @param {string} label - Timer label
   * @returns {Function} Function to end the timer
   */
  startTimer(label) {
    const startTime = process.hrtime.bigint();
    this.debug(`Timer started: ${label}`);
    
    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      this.info(`Timer completed: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    };
  }

  /**
   * Log test start
   * @param {string} testName - Name of the test
   * @param {Object} testParams - Test parameters
   */
  testStart(testName, testParams = {}) {
    this.info(`🧪 Test started: ${testName}`, { 
      testName,
      testParams,
      type: 'TEST_START'
    });
  }

  /**
   * Log test completion
   * @param {string} testName - Name of the test
   * @param {boolean} success - Whether test passed
   * @param {Object} results - Test results
   */
  testComplete(testName, success, results = {}) {
    const level = success ? 'info' : 'error';
    const icon = success ? '✅' : '❌';
    
    this.log(level, `${icon} Test completed: ${testName}`, {
      testName,
      success,
      results,
      type: 'TEST_COMPLETE'
    });
  }

  /**
   * Log comparison result
   * @param {string} testId - Test identifier
   * @param {boolean} equivalent - Whether results are equivalent
   * @param {Object} summary - Comparison summary
   */
  comparisonResult(testId, equivalent, summary = {}) {
    const level = equivalent ? 'info' : 'warn';
    const icon = equivalent ? '✅' : '⚠️';
    
    this.log(level, `${icon} Comparison result: ${testId}`, {
      testId,
      equivalent,
      summary,
      type: 'COMPARISON_RESULT'
    });
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {Object} metrics - Performance metrics
   */
  performance(operation, metrics = {}) {
    this.info(`📊 Performance: ${operation}`, {
      operation,
      metrics,
      type: 'PERFORMANCE'
    });
  }

  /**
   * Log API call details
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} statusCode - Response status code
   * @param {number} duration - Request duration in ms
   */
  apiCall(method, url, statusCode, duration) {
    const level = statusCode >= 400 ? 'warn' : 'debug';
    const icon = statusCode >= 400 ? '🚨' : '🌐';
    
    this.log(level, `${icon} API Call: ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      type: 'API_CALL'
    });
  }
}

// Create default logger instance
const logger = new TestLogger();

module.exports = logger;