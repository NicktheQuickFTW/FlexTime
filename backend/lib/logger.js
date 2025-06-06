/**
 * Simple logger mock for testing
 */

const logger = {
  info: (...args) => console.log(new Date().toISOString(), '[32minfo[39m:', ...args),
  warn: (...args) => console.log(new Date().toISOString(), '[33mwarn[39m:', ...args),
  error: (...args) => console.error(new Date().toISOString(), '[31merror[39m:', ...args),
  debug: (...args) => console.log(new Date().toISOString(), '[34mdebug[39m:', ...args)
};

module.exports = logger;