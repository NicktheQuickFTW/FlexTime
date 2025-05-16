/**
 * FlexTime Agent System Integration
 * 
 * This module integrates the FlexTime v2.1 multi-agent system with the HELiiX platform's
 * scheduling service, providing enhanced scheduling capabilities through an intelligent
 * agent-based architecture with learning capabilities.
 * 
 * IMPORTANT: This file has been refactored to use the modular agent system.
 * New code should use the components in the core/ directory directly.
 */

// Import core components
const { SchedulingAgentSystem, AgentFactory } = require('./core');
const logger = require('./utils/logger');

// Import models for type definitions
const Schedule = require('../models/schedule');
const Team = require('../models/team');
const Venue = require('../models/venue');
const Game = require('../models/game');
const Constraint = require('../models/constraint');
const types = require('../models/types');
const { SportType, ConstraintType, ConstraintCategory } = types;

/**
 * FlexTime Agent System for scheduling operations
 * This class maintains backward compatibility while using the new modular architecture
 */
class FlexTimeAgentSystem {
  /**
   * Initialize a new FlexTime Agent System
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Create the core scheduling system
    this._schedulingSystem = new SchedulingAgentSystem(config);
    
    // Create the agent factory
    this._factory = new AgentFactory(config);
    
    // Store config
    this.config = this._schedulingSystem.config;
    
    // For backward compatibility
    this.intelligenceEngine = this._schedulingSystem.intelligenceEngine;
    this.historicalData = this._schedulingSystem.historicalData;
    
    logger.info('FlexTime Agent System initialized');
  }
  
  /**
   * Initialize the agent system
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      logger.info('Initializing FlexTime Agent System');
      
      // Initialize factory support systems
      await this._factory.initializeSupportSystems();
      
      // Create core agents
      this.masterDirector = this._factory.createAgent('master_director');
      this.schedulingDirector = this._factory.createAgent('scheduling_director');
      this.operationsDirector = this._factory.createAgent('operations_director');
      this.analysisDirector = this._factory.createAgent('analysis_director');
      
      // Register agents with scheduling system
      this._schedulingSystem.registerAgent('master_director', this.masterDirector);
      this._schedulingSystem.registerAgent('scheduling_director', this.schedulingDirector);
      this._schedulingSystem.registerAgent('operations_director', this.operationsDirector);
      this._schedulingSystem.registerAgent('analysis_director', this.analysisDirector);
      
      // Store references to support systems for backward compatibility
      this.communicationManager = this._factory.communicationManager;
      this.mcpIntegration = this._factory.mcpIntegration;
      this.learningSystem = this._factory.learningSystem;
      this.memoryManager = this._factory.memoryManager;
      
      // Initialize the core scheduling system
      const result = await this._schedulingSystem.initialize();
      
      logger.info('FlexTime Agent System initialization complete');
      return result;
    } catch (error) {
      logger.error(`Failed to initialize FlexTime Agent System: ${error.message}`);
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
    // Delegate to the core scheduling system
    return this._schedulingSystem.generateSchedule(sportType, teams, constraints, options);
  }
  
  /**
   * Submit feedback for a schedule
   * 
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Submission result
   */
  async submitFeedback(feedbackData) {
    // Delegate to the core scheduling system
    return this._schedulingSystem.submitFeedback(feedbackData);
  }
  
  /**
   * Shutdown the agent system
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down FlexTime Agent System');
      
      // Shutdown the factory
      await this._factory.shutdown();
      
      // Shutdown the core scheduling system
      await this._schedulingSystem.shutdown();
      
      logger.info('FlexTime Agent System shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown FlexTime Agent System: ${error.message}`);
      return false;
    }
  }
}

// Export main FlexTime agent system
module.exports = {
  FlexTimeAgentSystem,

  // Re-export core components for direct use
  core: require('./core'),

  // Export agent types by category
  agents: {
    // Core agent components
    Agent: require('./agent'),
    CommunicationManager: require('./communication_manager'),
    MCPConnector: require('./mcp_connector_v2'),

    // Director agents
    directors: {
      MasterDirectorAgent: require('./master_director_agent')
      // Commented out to avoid loading potentially missing modules
      // ...require('./director')
    },

    // Specialized agents
    // specialized: require('./specialized'),
    specialized: {},

    // Sport-specific agents
    sportSpecific: {
      // BasketballScheduleOptimizer: require('./sport_specific/basketball_schedule_optimizer'),
      // rag: require('./sport_specific/rag')
    },

    // Memory management
    memory: require('./memory/index'),

    // RAG agents - DISABLED
    rag: { },

    // DISABLED AGENTS for development
    /*
    // Big12 agents
    big12: require('./big12'),

    // Enhanced agents
    enhanced: require('./enhanced'),

    // Monitoring agents
    monitoring: require('./monitoring'),

    // Transfer portal agents
    transferPortal: require('./transfer_portal'),

    // Recruiting agents
    recruiting: require('./recruiting'),

    // Evolution agents
    evolution: require('./evolution'),

    // HELiiX Connector agents
    heliixConnector: require('./heliix_connector')
    */
  }
};