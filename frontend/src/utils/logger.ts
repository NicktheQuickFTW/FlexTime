import * as log from 'loglevel';

// Initialize logger with proper configuration
log.setLevel(process.env.NODE_ENV === 'production' ? log.levels.WARN : log.levels.DEBUG);

/**
 * FlexTime Logger - Centralized logging utility
 * 
 * Provides consistent, themed logging across the frontend codebase
 * with proper formatting and level-based filtering.
 */
export const logger = {
  /**
   * Log informational message
   * @param message Main message to log
   * @param args Additional arguments to log
   */
  info: (message: string, ...args: any[]) => {
    log.info(`%c[FlexTime]%c ${message}`, 'color: #00D9FF; font-weight: bold', 'color: inherit', ...args);
  },

  /**
   * Log warning message
   * @param message Warning message 
   * @param args Additional arguments to log
   */
  warn: (message: string, ...args: any[]) => {
    log.warn(`%c[FlexTime]%c ${message}`, 'color: #FFC107; font-weight: bold', 'color: inherit', ...args);
  },

  /**
   * Log error message
   * @param message Error message
   * @param args Additional arguments to log
   */
  error: (message: string, ...args: any[]) => {
    log.error(`%c[FlexTime]%c ${message}`, 'color: #FF3B6B; font-weight: bold', 'color: inherit', ...args);
  },

  /**
   * Log debug message (only shown in development)
   * @param message Debug message
   * @param args Additional arguments to log
   */
  debug: (message: string, ...args: any[]) => {
    log.debug(`%c[FlexTime]%c ${message}`, 'color: #9D00FF; font-weight: bold', 'color: inherit', ...args);
  },

  /**
   * Log success message
   * @param message Success message
   * @param args Additional arguments to log
   */
  success: (message: string, ...args: any[]) => {
    log.info(`%c[FlexTime]%c ${message}`, 'color: #00FF9D; font-weight: bold', 'color: inherit', ...args);
  },
  
  /**
   * Set the current logging level
   * @param level The log level to set
   */
  setLevel: (level: log.LogLevelDesc) => {
    log.setLevel(level);
  },
  
  /**
   * Get the current logging level
   * @returns The current log level
   */
  getLevel: () => log.getLevel(),
  
  /**
   * The available log levels
   */
  levels: log.levels
};

// Export the logger as default
export default logger;
