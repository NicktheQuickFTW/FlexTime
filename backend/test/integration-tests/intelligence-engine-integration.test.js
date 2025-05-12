/**
 * Intelligence Engine Integration Test for the HELiiX FlexTime scheduling system.
 * 
 * This module tests the integration between the FlexTime scheduling service
 * and the HELiiX Intelligence Engine, focusing on memory and learning capabilities.
 */

const IntelligenceEngineClient = require('../../agents/intelligence_engine_client');
const logger = require('../../utils/logger');
const ieConfig = require('../../config/intelligence_engine_config');

/**
 * Run integration tests for the Intelligence Engine.
 */
async function runIntegrationTests() {
  logger.info('Starting HELiiX Intelligence Engine Integration Tests');
  
  try {
    // Initialize Intelligence Engine client
    const ieClient = new IntelligenceEngineClient({
      baseUrl: process.env.INTELLIGENCE_ENGINE_URL || ieConfig.baseUrl || 'http://localhost:4001',
      timeout: 5000,
      fallbackToLocal: true // Enable local fallback for testing
    });
    
    // Test Intelligence Engine connection
    let ieStatus;
    try {
      ieStatus = await ieClient.getStatus();
      logger.info(`Intelligence Engine status: ${ieStatus.available ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      logger.warn(`Intelligence Engine not available: ${error.message}. Tests will use local fallbacks.`);
      ieStatus = { available: false };
    }
    
    // Test memory operations with fallback if Intelligence Engine is unavailable
    logger.info('Testing memory operations...');
    
    // Define a test memory
    const testMemory = {
      agentId: 'test_agent',
      memoryType: 'episodic',
      key: 'test_memory',
      content: {
        test: 'This is a test memory',
        timestamp: Date.now()
      },
      importance: 0.7,
      context: {
        sportType: 'football',
        conferenceId: 'big12',
        seasonYear: 2025
      }
    };
    
    // Store memory (will use local fallback if Intelligence Engine is unavailable)
    const storeResult = await ieClient.storeMemory(testMemory);
    logger.info(`Memory storage result: ${JSON.stringify(storeResult)}`);
    
    // Retrieve memory
    const retrieveResult = await ieClient.retrieveMemory(
      testMemory.agentId,
      testMemory.memoryType,
      testMemory.key
    );
    logger.info(`Memory retrieval result: ${JSON.stringify(retrieveResult)}`);
    
    // Test historical data operations
    logger.info('Testing historical data operations...');
    
    // Define a test schedule
    const testSchedule = {
      sportType: 'football',
      conferenceId: 'big12',
      seasonYear: 2025,
      teams: [
        { id: 'byu', name: 'BYU', mascot: 'Cougars' },
        { id: 'tcu', name: 'TCU', mascot: 'Horned Frogs' },
        { id: 'ucf', name: 'UCF', mascot: 'Knights' }
      ],
      games: [
        {
          id: 'game1',
          homeTeamId: 'byu',
          awayTeamId: 'tcu',
          date: new Date('2025-09-05')
        },
        {
          id: 'game2',
          homeTeamId: 'ucf',
          awayTeamId: 'byu',
          date: new Date('2025-09-12')
        }
      ]
    };
    
    // Store historical data
    const storeHistoricalResult = await ieClient.storeHistoricalData(testSchedule);
    logger.info(`Historical data storage result: ${JSON.stringify(storeHistoricalResult)}`);
    
    // Get recommendations
    const recommendationsParams = {
      sportType: 'football',
      conferenceId: 'big12',
      seasonYear: 2025
    };
    
    const recommendationsResult = await ieClient.getRecommendations(recommendationsParams);
    logger.info(`Recommendations result: ${JSON.stringify(recommendationsResult)}`);
    
    // Clean up
    if (ieStatus.available) {
      await ieClient.disconnect();
    }
    
    logger.info('HELiiX Intelligence Engine Integration Tests completed successfully');
    return true;
  } catch (error) {
    logger.error(`Integration test failed: ${error.message}`);
    return false;
  }
}

// Export for use in test runners
module.exports = {
  runIntegrationTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unhandled error in tests: ${error.message}`);
      process.exit(1);
    });
}
