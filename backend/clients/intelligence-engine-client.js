/**
 * Mock Intelligence Engine Client
 * 
 * This is a mock replacement for the original intelligence engine client
 * which has been removed from the codebase.
 */

const logger = require('../utils/logger');

class IntelligenceEngineClient {
  constructor(config = {}) {
    this.config = {
      enabled: false,
      baseUrl: 'http://localhost:5000',
      timeout: 30000,
      ...config
    };
    
    this.isInitialized = false;
    logger.info('Intelligence Engine Client initialized (MOCK VERSION)');
  }
  
  async initialize() {
    this.isInitialized = true;
    logger.info('Intelligence Engine Client connection initialized (MOCK)');
    return true;
  }
  
  async analyzeSchedule(schedule) {
    logger.info('Mock Intelligence Engine: Analyze Schedule called');
    return {
      success: true,
      insights: [],
      metrics: {
        compositeScore: 75,
        balance: 80,
        travel: 70,
        competitiveness: 75
      }
    };
  }
  
  async queryKnowledgeGraph(query) {
    logger.info('Mock Intelligence Engine: Query Knowledge Graph called');
    return {
      success: true,
      results: [],
      message: "Knowledge Graph API is not available (mock response)"
    };
  }
  
  async optimizeSchedule(schedule, constraints) {
    logger.info('Mock Intelligence Engine: Optimize Schedule called');
    return {
      success: true,
      schedule: schedule,
      message: "Schedule optimization is not available (mock response)"
    };
  }
  
  async generateScheduleRecommendations(parameters) {
    logger.info('Mock Intelligence Engine: Generate Schedule Recommendations called');
    return {
      success: true,
      recommendations: [],
      message: "Recommendations are not available (mock response)"
    };
  }
  
  async storeFeedback(feedback) {
    logger.info('Mock Intelligence Engine: Store Feedback called');
    return {
      success: true,
      message: "Feedback stored (mock response)"
    };
  }
  
  async healthCheck() {
    return {
      status: 'ok',
      version: '1.0.0-mock',
      message: 'Intelligence Engine is not available (mock response)'
    };
  }
  
  isEnabled() {
    return this.config.enabled;
  }
  
  isConnected() {
    return this.isInitialized;
  }
}

module.exports = IntelligenceEngineClient;