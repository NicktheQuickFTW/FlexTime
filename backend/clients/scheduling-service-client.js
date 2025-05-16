/**
 * FlexTime Scheduling Service Client
 * 
 * A client for connecting to the advanced scheduling service.
 * This replaces the former Intelligence Engine client.
 */

const logger = require('../utils/logger');
const AdvancedSchedulingService = require('../services/advanced_scheduling_service');

/**
 * Client for connecting to the Advanced Scheduling Service
 */
class SchedulingServiceClient {
  /**
   * Create a new Scheduling Service Client
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Create an instance of the service
    this.service = new AdvancedSchedulingService(config);
    
    logger.info('Scheduling Service Client created');
  }
  
  /**
   * Initialize the client
   * 
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      await this.service.initialize();
      logger.info('Scheduling Service Client initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Scheduling Service Client: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get historical recommendations
   * 
   * @param {Object} parameters - Schedule parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getHistoricalRecommendations(parameters) {
    try {
      return await this.service.getSchedulingRecommendations(parameters);
    } catch (error) {
      logger.error(`Failed to get historical recommendations: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Store a generated schedule
   * 
   * @param {Object} schedule - The generated schedule
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} ID of the stored schedule
   */
  async storeHistoricalSchedule(schedule, metadata = {}) {
    try {
      return await this.service.storeScheduleData(schedule, metadata);
    } catch (error) {
      logger.error(`Failed to store historical schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get sport-specific templates
   * 
   * @param {string} sportType - Type of sport
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sport templates
   */
  async getSportTemplates(sportType, options = {}) {
    try {
      return await this.service.getSportTemplates(sportType, options);
    } catch (error) {
      logger.error(`Failed to get sport templates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get learning insights
   * 
   * @param {Object} parameters - Query parameters
   * @returns {Promise<Object>} Learning insights
   */
  async getLearningInsights(parameters = {}) {
    try {
      return await this.service.getLearningInsights(parameters);
    } catch (error) {
      logger.error(`Failed to get learning insights: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Optimize an existing schedule
   * 
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   */
  async optimizeSchedule(schedule, constraints = [], options = {}) {
    try {
      return await this.service.optimizeSchedule(schedule, constraints, options);
    } catch (error) {
      logger.error(`Failed to optimize schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Store user feedback
   * 
   * @param {Object} feedback - User feedback
   * @returns {Promise<string>} ID of the stored feedback
   */
  async storeFeedback(feedback) {
    try {
      return await this.service.storeFeedback(feedback);
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Shutdown the client
   * 
   * @returns {Promise<boolean>} Success status
   */
  async shutdown() {
    try {
      await this.service.shutdown();
      logger.info('Scheduling Service Client shut down successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Scheduling Service Client: ${error.message}`);
      return false;
    }
  }
}

module.exports = SchedulingServiceClient;