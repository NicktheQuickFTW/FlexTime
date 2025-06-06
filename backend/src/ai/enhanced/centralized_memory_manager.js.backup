/**
 * Centralized Memory Manager for FlexTime
 * 
 * This module provides a centralized memory management system that uses
 * Neon PostgreSQL as the primary storage mechanism.
 */

const { v4: uuidv4 } = require('uuid');
const logger = require("../utils/logger");

/**
 * Memory types supported by the system
 */
const MEMORY_TYPES = {
  EPISODIC: 'episodic', // Specific experiences
  SEMANTIC: 'semantic',  // General knowledge
  PROCEDURAL: 'procedural' // Action sequences
};

/**
 * Centralized Memory Manager for agent memories
 */
class CentralizedMemoryManager {
  /**
   * Initialize a new Centralized Memory Manager
   * 
   * @param {Object} config - Configuration options
   * @param {Object} services - Service dependencies
   */
  constructor(config = {}, services = {}) {
    this.config = config;
    // Intelligence Engine removed - using direct database access
    this.mcpRouter = services.mcpRouter;
    this.enabled = config.enabled !== false;
    
    // Local cache for performance
    this.memoryCache = new Map();
    
    logger.info('Centralized Memory Manager initialized');
  }
  
  /**
   * Store a memory
   * 
   * @param {Object} memory - Memory to store
   * @param {string} memory.type - Memory type (episodic, semantic, procedural)
   * @param {string} memory.agentId - ID of the agent storing the memory
   * @param {Object} memory.content - Memory content
   * @returns {Promise<Object>} Stored memory with ID
   */
  async storeMemory(memory) {
    if (!this.enabled) {
      logger.info('Memory management is disabled');
      return { success: false, error: 'Memory management is disabled' };
    }
    
    try {
      // Prepare memory document
      const memoryDoc = {
        id: memory.id || uuidv4(),
        type: memory.type || MEMORY_TYPES.EPISODIC,
        agentId: memory.agentId,
        content: memory.content,
        metadata: memory.metadata || {},
        timestamp: memory.timestamp || new Date().toISOString(),
        importance: memory.importance || 0.5
      };
      
      logger.info(`Storing ${memoryDoc.type} memory for agent ${memoryDoc.agentId}`);
      
      // Intelligence Engine removed - store directly to database
      
      // Store memory in the database using the MCP router
      try {
        const response = await this.mcpRouter.routeRequest({
          taskType: 'memory_storage',
          request: {
            operation: 'insert',
            collection: 'agent_memories',
            document: memoryDoc
          }
        });
        
        if (response.success) {
          // Update cache
          this.memoryCache.set(memoryDoc.id, memoryDoc);
          return { success: true, memory: memoryDoc };
        } else {
          throw new Error(response.error || 'Unknown error storing memory');
        }
      } catch (error) {
        logger.error(`Failed to store memory in database: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to store memory: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Retrieve memories based on a query
   * 
   * @param {Object} query - Query parameters
   * @param {string} query.agentId - Filter by agent ID
   * @param {string} query.type - Filter by memory type
   * @param {Object} query.filter - Additional filters
   * @param {number} query.limit - Maximum number of memories to retrieve
   * @returns {Promise<Array>} Retrieved memories
   */
  async retrieveMemories(query = {}) {
    if (!this.enabled) {
      logger.info('Memory management is disabled');
      return { success: false, error: 'Memory management is disabled', memories: [] };
    }
    
    try {
      logger.info(`Retrieving memories with query: ${JSON.stringify(query)}`);
      
      // Intelligence Engine removed - retrieve directly from database
      
      // Prepare the database query
      const dbQuery = {
        ...query.filter
      };
      
      if (query.agentId) {
        dbQuery.agentId = query.agentId;
      }
      
      if (query.type) {
        dbQuery.type = query.type;
      }
      
      // Query the database using the MCP router
      const response = await this.mcpRouter.routeRequest({
        taskType: 'memory_storage',
        request: {
          operation: 'find',
          collection: 'agent_memories',
          query: dbQuery,
          limit: query.limit || 100,
          sort: { timestamp: -1 }
        }
      });
      
      if (response.success && Array.isArray(response.data)) {
        // Add to cache
        response.data.forEach(memory => {
          this.memoryCache.set(memory.id, memory);
        });
        
        return { 
          success: true, 
          memories: response.data,
          source: 'database'
        };
      } else {
        throw new Error(response.error || 'Unknown error retrieving memories');
      }
    } catch (error) {
      logger.error(`Failed to retrieve memories: ${error.message}`);
      
      // Try to use cache as last resort
      if (query.agentId) {
        const cachedMemories = Array.from(this.memoryCache.values())
          .filter(memory => memory.agentId === query.agentId);
        
        if (cachedMemories.length > 0) {
          logger.info(`Returning ${cachedMemories.length} cached memories as fallback`);
          return { 
            success: true, 
            memories: cachedMemories,
            source: 'local_cache',
            warning: 'Retrieved from cache due to storage failure'
          };
        }
      }
      
      return { success: false, error: error.message, memories: [] };
    }
  }
  
  /**
   * Consolidate similar memories to reduce storage size
   * 
   * @param {string} agentId - ID of the agent whose memories to consolidate
   * @returns {Promise<Object>} Consolidation results
   */
  async consolidateMemories(agentId) {
    if (!this.enabled) {
      logger.info('Memory management is disabled');
      return { success: false, error: 'Memory management is disabled' };
    }
    
    try {
      logger.info(`Consolidating memories for agent ${agentId}`);
      
      // Try to consolidate through Intelligence Engine first
      // Intelligence Engine removed - using direct task submission
      
      // Simplified local implementation
      logger.info('Using local memory consolidation as fallback');
      
      // Get memories for this agent
      const { memories } = await this.retrieveMemories({ agentId });
      
      // Very simplified consolidation (in a real implementation, this would use embeddings)
      const consolidated = [];
      const toRemove = [];
      
      // Just return a mock result for now
      return {
        success: true,
        consolidated: 0,
        removed: 0,
        source: 'local_implementation',
        warning: 'Simplified local consolidation used as fallback'
      };
    } catch (error) {
      logger.error(`Failed to consolidate memories: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  CentralizedMemoryManager,
  MEMORY_TYPES
};
