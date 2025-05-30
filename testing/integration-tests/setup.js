/**
 * Integration Tests Setup
 */

const logger = require('../utilities/logger');
const config = require('../config/test.config');

// Setup test environment
beforeAll(async () => {
  logger.info('Setting up integration test environment');
  
  // Set Jest timeout
  jest.setTimeout(config.integration.eventTimeout * 3); // Allow extra time for integration tests
  
  // Global test utilities
  global.testConfig = config;
  global.testLogger = logger.child({ testType: 'integration' });
  
  logger.info('Integration test environment ready');
});

// Cleanup after tests
afterAll(async () => {
  logger.info('Cleaning up integration test environment');
});