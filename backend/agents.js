/**
 * FlexTime Agents Export Module
 * 
 * This module exports the main agent systems for the FlexTime platform.
 * Following [Playbook: Backend System] architecture patterns.
 * 
 * Gracefully handles missing dependencies during refactoring phase.
 */

const logger = require('./utils/logger');

// Try to load AgentSystem, with fallback for missing dependencies
let AgentSystem;
try {
  AgentSystem = require('./src/ai/agent_system');
} catch (error) {
  logger.warn(`Agent system dependencies not fully available: ${error.message}`);
  
  // Create minimal agent system for refactoring phase
  class MinimalAgentSystem {
    constructor(config = {}) {
      this.config = config;
      this.name = 'MinimalAgentSystem';
      this.version = '2.1.0-scaled-20workers';
      this.maxWorkersPerTask = config.maxWorkersPerTask || 20;
      this.initialized = false;
    }
    
    async initialize() {
      logger.info(`🤖 Initializing ${this.name} v${this.version} with ${this.maxWorkersPerTask} workers per task support`);
      this.initialized = true;
      return true;
    }
    
    async shutdown() {
      this.initialized = false;
      logger.info(`${this.name} shutdown completed`);
      return true;
    }
    
    registerAgent(id, agent) {
      logger.info(`Agent ${id} registered (minimal system)`);
      return true;
    }
    
    getAgent(id) {
      return null;
    }
  }
  
  AgentSystem = MinimalAgentSystem;
}

// Create FlexTimeAgentSystem as an alias to AgentSystem for compatibility
class FlexTimeAgentSystem extends AgentSystem {
  constructor(config) {
    super(config);
    this.name = 'FlexTimeAgentSystem';
    this.version = '2.1.0-scaled-20workers';
  }
  
  /**
   * Enhanced initialization with 20 workers per task support
   */
  async initialize() {
    logger.info(`🤖 Initializing ${this.name} v${this.version} with 20 workers per task support`);
    return super.initialize();
  }
}

module.exports = {
  FlexTimeAgentSystem,
  AgentSystem
};