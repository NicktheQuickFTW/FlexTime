/**
 * Test Script for HELiiX Intelligence Connector
 * 
 * This script demonstrates how to use the HELiiX Intelligence Connector
 * to delegate tasks to the Python backend.
 */

const { heliixConnector } = require('../agents').agents;
const logger = require('../scripts/logger');

// Create and initialize the Intelligence Connector agent
async function main() {
  try {
    logger.info('Initializing HELiiX Intelligence Connector test');
    
    // Create the connector agent
    const intelligenceConnector = heliixConnector.createIntelligenceConnectorAgent({
      intelligence: {
        serviceUrl: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api',
        apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
        enabled: true
      }
    });
    
    // Initialize the agent
    await intelligenceConnector.initialize();
    logger.info('Intelligence Connector initialized');
    
    // Get the status of the Intelligence Engine
    const status = await intelligenceConnector.engineClient.getStatus();
    logger.info('Intelligence Engine status:', status);
    
    // Test task delegation
    if (status.success) {
      // Create a task to generate a basic basketball schedule
      const delegateTask = intelligenceConnector.createTask(
        'delegate',
        'Generate basic basketball schedule',
        {
          task: {
            taskType: 'generate_schedule',
            parameters: {
              sportType: 'basketball',
              teamCount: 10,
              options: {
                homeAwayBalance: true,
                optimizationLevel: 'medium'
              }
            }
          },
          options: {
            wait: true,
            responseFormat: 'summarized',
            timeout: 30000
          }
        }
      );
      
      // Submit the task
      logger.info('Submitting schedule generation task');
      const result = await intelligenceConnector.submitTask(delegateTask);
      
      if (result.success) {
        logger.info('Schedule generation task completed successfully');
        logger.info('Result:', JSON.stringify(result.result, null, 2));
      } else {
        logger.error('Schedule generation task failed:', result.error);
      }
    } else {
      logger.warn('Intelligence Engine is not available, skipping task delegation test');
      
      // Test scheduling recommendations (local fallback)
      const recommendationsTask = intelligenceConnector.createTask(
        'get_scheduling_recommendations',
        'Get scheduling recommendations for basketball',
        {
          sportType: 'basketball',
          teamCount: 10
        }
      );
      
      // Submit the task
      logger.info('Getting scheduling recommendations (local fallback)');
      const recommendationsResult = await intelligenceConnector.submitTask(recommendationsTask);
      
      logger.info('Recommendations:', JSON.stringify(recommendationsResult, null, 2));
    }
    
    // Test feedback storage
    const feedbackTask = intelligenceConnector.createTask(
      'store_feedback',
      'Store test feedback',
      {
        feedback: {
          scheduleId: 'test_schedule_123',
          rating: 4,
          comments: 'Good balance of home and away games',
          metrics: {
            homeGames: 15,
            awayGames: 15,
            constraintsSatisfied: 45,
            constraintsViolated: 2
          },
          user: 'test@example.com',
          timestamp: new Date().toISOString()
        }
      }
    );
    
    // Submit the task
    logger.info('Storing test feedback');
    const feedbackResult = await intelligenceConnector.submitTask(feedbackTask);
    
    if (feedbackResult.success) {
      logger.info('Feedback stored successfully:', feedbackResult.id);
    } else {
      logger.error('Feedback storage failed:', feedbackResult.error);
    }
    
    // Stop the agent
    await intelligenceConnector.stop();
    logger.info('Intelligence Connector stopped');
    
  } catch (error) {
    logger.error('Error in HELiiX Intelligence Connector test:', error);
  }
}

// Run the test
main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});