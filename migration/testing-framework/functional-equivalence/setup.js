/**
 * Functional Equivalence Tests Setup
 */

const logger = require('../utilities/logger');
const config = require('../config/test.config');

// Setup test environment
beforeAll(async () => {
  logger.info('Setting up functional equivalence test environment');
  
  // Set Jest timeout
  jest.setTimeout(config.timeout);
  
  // Global test utilities
  global.testConfig = config;
  global.testLogger = logger.child({ testType: 'functional-equivalence' });
  
  logger.info('Functional equivalence test environment ready');
});

// Cleanup after tests
afterAll(async () => {
  logger.info('Cleaning up functional equivalence test environment');
});