/**
 * FlexTime Historical Data Adapter
 * 
 * This module adapts the FlexTime historical data capabilities to work with
 * the centralized HELiiX Intelligence Engine, providing enhanced learning from
 * historical scheduling data.
 */

const logger = require('../scripts/logger");
const IntelligenceEngineClient = require('../clients/intelligence-engine-client');

/**
 * Adapter for integrating historical data with Intelligence Engine
 */
class HistoricalDataAdapter {
  /**
   * Create a new Historical Data Adapter
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enabled: true,
      ...config
    };
    
    this.intelligenceEngine = new IntelligenceEngineClient(config.intelligenceEngine);
    this.initialized = false;
  }
  
  /**
   * Initialize the adapter
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (!this.initialized) {
        logger.info('Initializing Historical Data Adapter');
        
        // Initialize the intelligence engine client
        await this.intelligenceEngine.initialize();
        
        this.initialized = true;
        logger.info('Historical Data Adapter initialized successfully');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Historical Data Adapter: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store a schedule in historical data
   * @param {Schedule} schedule - Schedule to store
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeSchedule(schedule, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Store in historical data through Intelligence Engine
      const result = await this.intelligenceEngine.storeHistoricalSchedule(schedule, options);
      
      if (result.success) {
        logger.info(`Stored schedule in historical data: ${result.id}`);
      } else {
        logger.warn(`Failed to store schedule in historical data: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to store schedule in historical data: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get recommendations for scheduling based on historical data
   * @param {Object} parameters - Parameters for the new schedule
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(parameters) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get recommendations from Intelligence Engine
      const recommendations = await this.intelligenceEngine.getHistoricalRecommendations(parameters);
      
      if (recommendations.success) {
        logger.info('Received recommendations from historical data');
      } else {
        logger.warn(`Failed to get recommendations: ${recommendations.error}`);
      }
      
      return recommendations;
    } catch (error) {
      logger.error(`Failed to get recommendations: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Store feedback for a schedule
   * @param {string} scheduleId - ID of the schedule
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Result of the feedback storage
   */
  async storeFeedback(scheduleId, feedback) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Store feedback through Intelligence Engine
      const result = await this.intelligenceEngine.storeScheduleFeedback(scheduleId, feedback);
      
      if (result.success) {
        logger.info(`Stored feedback for schedule: ${scheduleId}`);
      } else {
        logger.warn(`Failed to store feedback: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get historical schedules based on criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching historical schedules
   */
  async getHistoricalSchedules(criteria = {}, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const result = await this.intelligenceEngine.retrieveHistoricalSchedules(criteria, options);
      
      if (result.success) {
        return result.schedules || [];
      } else {
        logger.warn(`Failed to retrieve historical schedules: ${result.error}`);
        return [];
      }
    } catch (error) {
      logger.error(`Failed to retrieve historical schedules: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Extract features from a schedule
   * @param {Schedule} schedule - Schedule to extract features from
   * @returns {Object} Extracted features
   */
  async extractFeatures(schedule) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const result = await this.intelligenceEngine.extractScheduleFeatures(schedule);
      
      if (result.success) {
        return result.features || {};
      } else {
        logger.warn(`Failed to extract features: ${result.error}`);
        return {};
      }
    } catch (error) {
      logger.error(`Failed to extract features: ${error.message}`);
      return {};
    }
  }
  
  /**
   * Shutdown the adapter
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      this.initialized = false;
      logger.info('Historical Data Adapter shut down successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Historical Data Adapter: ${error.message}`);
      return false;
    }
  }
}

module.exports = HistoricalDataAdapter;
