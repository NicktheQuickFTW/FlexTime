/**
 * FlexTime Scheduling Agent System
 * 
 * This module provides specialized scheduling functionality for the FlexTime agent system,
 * extending the core agent system with schedule generation capabilities.
 */

const AgentSystem = require('./agent_system');
const HistoricalDataAdapter = require('../../ml/historical-data-adapter');
const logger = require("../utils/logger");

// Import models for integration - using direct imports for consistency
const Schedule = require('../../models/schedule');
const Team = require('../../models/team');
const Venue = require('../../models/venue');
const Game = require('../../models/game');
const Constraint = require('../../models/constraint');
const types = require('../../models/types');
const { SportType, ConstraintType, ConstraintCategory } = types;

// Import enhanced algorithms
const DateAssigner = require('../../algorithms/date-assigner');
const TravelOptimizer = require('../../algorithms/travel-optimizer');
const ScheduleMetrics = require('../../algorithms/schedule-metrics');

/**
 * Scheduling Agent System for FlexTime
 * Extends the core agent system with scheduling capabilities
 */
class SchedulingAgentSystem extends AgentSystem {
  /**
   * Initialize a new Scheduling Agent System
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super(config);
    
    this.config = {
      ...this.config,
      enableHistoricalLearning: process.env.ENABLE_HISTORICAL_LEARNING !== 'false',
      ...config
    };
    
    // Initialize historical data adapter
    this.historicalData = new HistoricalDataAdapter(
      {
        enabled: this.config.enableHistoricalLearning,
        mongoUri: this.config.mongoUri
      },
      this.intelligenceEngine
    );
    
    // Initialize algorithm components
    this.dateAssigner = new DateAssigner();
    this.travelOptimizer = new TravelOptimizer();
    this.scheduleMetrics = new ScheduleMetrics();
    
    logger.info('Scheduling Agent System initialized');
  }
  
  /**
   * Initialize the scheduling agent system
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Initialize base agent system
      const baseInitialized = await super.initialize();
      if (!baseInitialized) {
        logger.warn('Base agent system initialization failed');
        return false;
      }
      
      // Initialize historical data adapter
      if (this.config.enableHistoricalLearning) {
        const historicalDataInitialized = await this.historicalData.initialize();
        if (historicalDataInitialized) {
          logger.info('Historical data adapter initialized successfully');
        } else {
          logger.warn('Historical data adapter initialization failed');
        }
      }
      
      logger.info('Scheduling Agent System initialization complete');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Scheduling Agent System: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Generate a schedule using the agent system
   * 
   * @param {string} sportType - Type of sport (basketball, football, etc.)
   * @param {Array<Team>} teams - Teams to include in the schedule
   * @param {Array<Constraint>} constraints - Constraints to apply to the schedule
   * @param {Object} options - Additional options
   * @returns {Promise<Schedule>} Generated schedule
   */
  async generateSchedule(sportType, teams, constraints = [], options = {}) {
    try {
      if (!this.initialized) {
        logger.warn('Scheduling Agent System not initialized, initializing now');
        await this.initialize();
      }
      
      logger.info(`Generating schedule for ${sportType} with ${teams.length} teams and ${constraints.length} constraints`);
      
      // Get scheduling director agent
      const schedulingDirector = this.getAgent('scheduling_director');
      if (!schedulingDirector) {
        throw new Error('Scheduling director agent not registered');
      }
      
      // Prepare schedule generation parameters
      const schedulingParameters = {
        sportType,
        teams,
        constraints,
        options: {
          season: options.season || '2025-2026',
          balanceHomeAway: options.balanceHomeAway !== false,
          optimizeTravel: options.optimizeTravel !== false,
          seedSchedule: options.seedSchedule || null,
          ...options
        }
      };
      
      // Check historical data for similar schedules if enabled
      let historicalInsights = null;
      if (this.config.enableHistoricalLearning) {
        historicalInsights = await this.historicalData.getSchedulingInsights(sportType, teams.length);
        if (historicalInsights) {
          logger.info(`Using historical insights for ${sportType} scheduling`);
          schedulingParameters.options.historicalInsights = historicalInsights;
        }
      }
      
      // Generate schedule using the scheduling director agent
      const schedule = await schedulingDirector.generateSchedule(schedulingParameters);
      
      // Calculate schedule metrics
      const metrics = this.scheduleMetrics.calculateMetrics(schedule);
      schedule.metrics = metrics;
      
      // Apply travel optimization if requested
      if (options.optimizeTravel !== false && teams.length >= 8) {
        logger.info('Applying travel optimization to schedule');
        await this.travelOptimizer.optimize(schedule, {
          maxIterations: options.travelOptimizationIterations || 100,
          teams
        });
        
        // Update metrics after optimization
        const updatedMetrics = this.scheduleMetrics.calculateMetrics(schedule);
        schedule.metrics = updatedMetrics;
      }
      
      // Store experience for learning
      this.storeExperience('scheduling_director', schedule, {
        sportType,
        teamCount: teams.length,
        constraintCount: constraints.length,
        options
      });
      
      logger.info(`Schedule generated with ${schedule.games.length} games`);
      return schedule;
    } catch (error) {
      logger.error(`Failed to generate schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Submit feedback for a schedule
   * 
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Submission result
   */
  async submitFeedback(feedbackData) {
    try {
      logger.info(`Submitting feedback for schedule ${feedbackData.scheduleId}`);
      
      // Store feedback in historical data if enabled
      if (this.config.enableHistoricalLearning) {
        await this.historicalData.storeFeedback(feedbackData.scheduleId, {
          userRating: feedbackData.rating,
          comments: feedbackData.comments
        });
      }
      
      // Send feedback to Intelligence Engine
      if (this.intelligenceEngine && this.intelligenceEngine.enabled) {
        const experience = {
          agentId: 'user_feedback',
          type: 'schedule_feedback',
          content: {
            scheduleId: feedbackData.scheduleId,
            sportType: feedbackData.sportType,
            rating: feedbackData.rating,
            comments: feedbackData.comments
          },
          tags: ['feedback', feedbackData.sportType]
        };
        
        await this.intelligenceEngine.storeExperience(experience);
      }
      
      return { success: true };
    } catch (error) {
      logger.error(`Failed to submit feedback: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Shutdown the scheduling agent system
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      // Shutdown historical data adapter
      if (this.historicalData) {
        await this.historicalData.shutdown();
        logger.info('Historical data adapter shut down successfully');
      }
      
      // Shutdown base agent system components
      const baseShutdown = await super.shutdown();
      if (!baseShutdown) {
        logger.warn('Base agent system shutdown unsuccessful');
      }
      
      logger.info('Scheduling Agent System shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Scheduling Agent System: ${error.message}`);
      return false;
    }
  }
}

module.exports = SchedulingAgentSystem;
