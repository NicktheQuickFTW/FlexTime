/**
 * FlexTime Agent System Core
 * 
 * This module provides the core functionality for the FlexTime agent system,
 * implementing the main agent initialization, coordination, and lifecycle management.
 */

const logger = require('../utils/logger');
const IntelligenceEngineClient = require('../intelligence_engine_client');
const intelligenceEngineConfig = require('../../config/intelligence_engine_config');

/**
 * Core Agent System for FlexTime
 * Manages agent lifecycle and coordination
 */
class AgentSystem {
  /**
   * Initialize a new Agent System
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      logLevel: process.env.LOG_LEVEL || 'info',
      enableMCP: process.env.ENABLE_MCP === 'true',
      mcpEndpoint: process.env.MCP_ENDPOINT,
      ...config
    };
    
    // Configure logger
    logger.setLogLevel(this.config.logLevel);
    
    // Initialize Intelligence Engine integration
    this.intelligenceEngine = new IntelligenceEngineClient({
      ...intelligenceEngineConfig,
      ...config
    });
    
    // Track registered agents
    this.agents = new Map();
    this.initialized = false;
    
    logger.info('Agent System core initialized');
  }
  
  /**
   * Register an agent with the system
   * 
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} agent - Agent instance
   * @returns {boolean} - Whether registration was successful
   */
  registerAgent(agentId, agent) {
    if (this.agents.has(agentId)) {
      logger.warn(`Agent with ID ${agentId} is already registered`);
      return false;
    }
    
    this.agents.set(agentId, agent);
    logger.info(`Agent ${agentId} registered with the system`);
    return true;
  }
  
  /**
   * Get a registered agent by ID
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Object|null} - Agent instance or null if not found
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }
  
  /**
   * Initialize the agent system and all registered agents
   * 
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.initialized) {
        logger.warn('Agent System is already initialized');
        return true;
      }
      
      logger.info('Initializing Agent System');
      
      // Initialize Intelligence Engine client
      const intelligenceEngineInitialized = await this.intelligenceEngine.initialize();
      if (intelligenceEngineInitialized) {
        logger.info('Intelligence Engine client initialized successfully');
      } else {
        logger.warn('Intelligence Engine client initialization failed, using local components only');
      }
      
      // Initialize all registered agents
      for (const [agentId, agent] of this.agents.entries()) {
        try {
          if (typeof agent.initialize === 'function') {
            logger.info(`Initializing agent: ${agentId}`);
            await agent.initialize();
            logger.info(`Agent ${agentId} initialized successfully`);
          }
        } catch (error) {
          logger.error(`Failed to initialize agent ${agentId}: ${error.message}`);
        }
      }
      
      this.initialized = true;
      logger.info('Agent System initialization complete');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Agent System: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store an experience for learning and improvement
   * 
   * @param {string} agentId - ID of the agent storing the experience
   * @param {Object} experience - Experience data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - Whether storage was successful
   */
  async storeExperience(agentId, experience, metadata = {}) {
    try {
      if (!this.intelligenceEngine || !this.intelligenceEngine.enabled) {
        logger.debug(`Intelligence Engine not available, skipping experience storage for ${agentId}`);
        return false;
      }
      
      const experienceData = {
        agentId,
        timestamp: new Date().toISOString(),
        content: experience,
        metadata
      };
      
      await this.intelligenceEngine.storeExperience(experienceData);
      logger.debug(`Experience stored for agent ${agentId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to store experience for agent ${agentId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Shutdown the agent system and all registered agents
   * 
   * @returns {Promise<boolean>} - Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down Agent System');
      
      // Shutdown all registered agents in reverse registration order
      const agentEntries = [...this.agents.entries()].reverse();
      
      for (const [agentId, agent] of agentEntries) {
        try {
          if (typeof agent.shutdown === 'function') {
            logger.info(`Shutting down agent: ${agentId}`);
            await agent.shutdown();
            logger.info(`Agent ${agentId} shutdown successfully`);
          }
        } catch (error) {
          logger.error(`Failed to shutdown agent ${agentId}: ${error.message}`);
        }
      }
      
      // Shutdown Intelligence Engine client
      if (this.intelligenceEngine) {
        await this.intelligenceEngine.shutdown();
        logger.info('Intelligence Engine client shut down successfully');
      }
      
      this.initialized = false;
      logger.info('Agent System shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Agent System: ${error.message}`);
      return false;
    }
  }
}

module.exports = AgentSystem;
