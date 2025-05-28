/**
 * Intelligence Engine Integration Test for the HELiiX FlexTime scheduling system.
 * 
 * This module tests the integration between the FlexTime scheduling service
 * and the HELiiX Intelligence Engine, focusing on:
 * - Agent memory operations
 * - Historical data storage and retrieval
 * - Recommendations based on historical data
 * - Fallback mechanisms when Intelligence Engine is unavailable
 */

const IntelligenceEngineClient = require('../../clients/intelligence-engine-client');
const AgentMemoryAdapter = require('../../learning/agent-memory-adapter');
const HistoricalDataAdapter = require('../../learning/historical-data-adapter');
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
    
    // Initialize adapters
    const memoryAdapter = new AgentMemoryAdapter({
      intelligenceEngineClient: ieClient
    });
    
    const historicalAdapter = new HistoricalDataAdapter({
      intelligenceEngineClient: ieClient
    });
    
    // Test memory operations
    logger.info('Testing agent memory operations...');
    
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
    const storeResult = await memoryAdapter.storeMemory(
      testMemory.agentId,
      testMemory.memoryType,
      testMemory.key,
      testMemory.content,
      {
        importance: testMemory.importance,
        sportType: testMemory.context.sportType,
        conferenceId: testMemory.context.conferenceId,
        seasonYear: testMemory.context.seasonYear
      }
    );
    logger.info(`Memory storage result: ${JSON.stringify(storeResult)}`);
    
    // Retrieve memory
    const retrieveResult = await memoryAdapter.retrieveMemory(
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
        { id: 'ucf', name: 'UCF', mascot: 'Knights' },
        { id: 'u_of_a', name: 'U of A', mascot: 'Wildcats' },
        { id: 'asu', name: 'ASU', mascot: 'Sun Devils' }
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
        },
        {
          id: 'game3',
          homeTeamId: 'u_of_a',
          awayTeamId: 'asu',
          date: new Date('2025-09-19')
        }
      ]
    };
    
    // Store historical data
    const storeHistoricalResult = await historicalAdapter.storeSchedule(testSchedule);
    logger.info(`Historical data storage result: ${JSON.stringify(storeHistoricalResult)}`);
    
    // Get recommendations
    const recommendationsParams = {
      sportType: 'football',
      conferenceId: 'big12',
      seasonYear: 2025
    };
    
    const recommendationsResult = await historicalAdapter.getRecommendations(recommendationsParams);
    logger.info(`Recommendations result: ${JSON.stringify(recommendationsResult)}`);
    
    // Test feedback submission
    logger.info('Testing feedback submission...');
    
    const feedbackData = {
      scheduleId: 'test-schedule-123',
      rating: 4,
      comments: 'Good schedule with balanced travel',
      metrics: {
        travelDistance: 4,
        homeAwayBalance: 5,
        competitiveBalance: 3
      }
    };
    
    const feedbackResult = await historicalAdapter.storeFeedback(
      'test-schedule-123',
      feedbackData
    );
    logger.info(`Feedback submission result: ${JSON.stringify(feedbackResult)}`);
    
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

/**
 * Run the tests and handle the result
 */
async function runTests() {
  try {
    const success = await runIntegrationTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logger.error(`Unhandled error in tests: ${error.message}`);
    process.exit(1);
  }
}

// Export for use in test runners
module.exports = {
  runIntegrationTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
