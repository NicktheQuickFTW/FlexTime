/**
 * HELiiX FlexTime Integration Test Runner
 * 
 * This script runs integration tests for the HELiiX FlexTime scheduling system,
 * including tests that verify integration with the Intelligence Engine.
 * 
 * Usage:
 *   node scripts/run-integration-tests.js [--test=<test-name>] [--ie-url=<intelligence-engine-url>]
 */

const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const logger = require('../utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  test: null,
  ieUrl: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001'
};

args.forEach(arg => {
  if (arg.startsWith('--test=')) {
    options.test = arg.split('=')[1];
  } else if (arg.startsWith('--ie-url=')) {
    options.ieUrl = arg.split('=')[1];
  }
});

/**
 * Run a specific integration test
 * @param {string} testPath - Path to the test file
 * @returns {Promise<boolean>} Whether the test succeeded
 */
async function runTest(testPath) {
  return new Promise((resolve) => {
    logger.info(`Running test: ${testPath}`);
    
    const env = {
      ...process.env,
      INTELLIGENCE_ENGINE_URL: options.ieUrl,
      NODE_ENV: 'test'
    };
    
    const testProcess = spawn('node', [testPath], { 
      env,
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      const success = code === 0;
      logger.info(`Test ${testPath} ${success ? 'succeeded' : 'failed'} with exit code ${code}`);
      resolve(success);
    });
  });
}

/**
 * Check if Intelligence Engine is available
 * @returns {Promise<boolean>} Whether the Intelligence Engine is available
 */
async function checkIntelligenceEngine() {
  try {
    logger.info(`Checking Intelligence Engine at ${options.ieUrl}`);
    const response = await axios.get(`${options.ieUrl}/api/status`, { 
      timeout: 5000 
    });
    
    if (response.status === 200) {
      logger.info('Intelligence Engine is available', {
        version: response.data.version,
        status: response.data.status
      });
      return true;
    } else {
      logger.warn(`Intelligence Engine health check failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.warn(`Intelligence Engine not available at ${options.ieUrl}: ${error.message}`);
    return false;
  }
}

/**
 * Run all integration tests or a specific test
 */
async function runIntegrationTests() {
  try {
    logger.info('Starting HELiiX FlexTime integration tests');
    logger.info(`Intelligence Engine URL: ${options.ieUrl}`);
    
    // Check if Intelligence Engine is available
    const ieAvailable = await checkIntelligenceEngine();
    if (!ieAvailable) {
      logger.warn('Intelligence Engine is not available. Tests will use local fallbacks where possible.');
      process.env.ENABLE_INTELLIGENCE_ENGINE = 'false';
    }
    
    let testPaths = [];
    
    if (options.test) {
      // Run a specific test
      const testPath = path.resolve(__dirname, '../test/integration-tests', `${options.test}.test.js`);
      testPaths.push(testPath);
    } else {
      // Run all integration tests
      testPaths = [
        path.resolve(__dirname, '../test/integration-tests/agent-system-integration.test.js'),
        path.resolve(__dirname, '../test/integration-tests/intelligence-engine-integration.test.js'),
        path.resolve(__dirname, '../test/integration-tests/mcp-big12-integration.test.js')
      ];
    }
    
    let allTestsSucceeded = true;
    
    for (const testPath of testPaths) {
      try {
        const success = await runTest(testPath);
        if (!success) {
          allTestsSucceeded = false;
        }
      } catch (error) {
        logger.error(`Error running test ${testPath}: ${error.message}`);
        allTestsSucceeded = false;
      }
    }
    
    if (allTestsSucceeded) {
      logger.info('All integration tests completed successfully');
      process.exit(0);
    } else {
      logger.error('One or more integration tests failed');
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Error running integration tests: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests();
