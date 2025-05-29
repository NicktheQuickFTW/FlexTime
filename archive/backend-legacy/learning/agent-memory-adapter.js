/**
 * FlexTime Agent Memory Adapter
 * 
 * This module adapts the FlexTime agent memory capabilities to work with
 * the centralized HELiiX Intelligence Engine, providing persistent memory
 * storage for agents across the platform.
 */

const logger = require('../utils/logger');
const IntelligenceEngineClient = require('../clients/intelligence-engine-client');

/**
 * Adapter for integrating agent memory with Intelligence Engine
 */
class AgentMemoryAdapter {
  /**
   * Create a new Agent Memory Adapter
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
        logger.info('Initializing Agent Memory Adapter');
        
        // Initialize the intelligence engine client
        await this.intelligenceEngine.initialize();
        
        this.initialized = true;
        logger.info('Agent Memory Adapter initialized successfully');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Agent Memory Adapter: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store a memory
   * @param {string} agentId - ID of the agent
   * @param {string} memoryType - Type of memory (episodic, semantic, procedural)
   * @param {string} key - Key for the memory
   * @param {Object} content - Content of the memory
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeMemory(agentId, memoryType, key, content, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Format memory for Intelligence Engine
      const memory = {
        agentId,
        type: memoryType,
        key,
        content,
        importance: options.importance || 0.5,
        metadata: {
          sportType: options.sportType,
          conferenceId: options.conferenceId,
          seasonYear: options.seasonYear,
          tags: options.tags || []
        }
      };
      
      // Store through Intelligence Engine
      const result = await this.intelligenceEngine.storeMemory(memory);
      
      if (result.success) {
        logger.info(`Stored ${memoryType} memory for agent ${agentId}: ${key}`);
      } else {
        logger.warn(`Failed to store memory: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to store memory: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Retrieve a memory
   * @param {string} agentId - ID of the agent
   * @param {string} memoryType - Type of memory
   * @param {string} key - Key for the memory
   * @returns {Promise<Object>} Retrieved memory
   */
  async retrieveMemory(agentId, memoryType, key) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Retrieve through Intelligence Engine
      const result = await this.intelligenceEngine.retrieveMemory(agentId, memoryType, key);
      
      if (result.success) {
        logger.info(`Retrieved ${memoryType} memory for agent ${agentId}: ${key}`);
        return result.memory.content;
      } else {
        logger.warn(`Failed to retrieve memory: ${result.error}`);
        return null;
      }
    } catch (error) {
      logger.error(`Failed to retrieve memory: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Query memories
   * @param {string} agentId - ID of the agent
   * @param {Object} query - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching memories
   */
  async queryMemories(agentId, query = {}, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Format query for Intelligence Engine
      const ieQuery = {
        agentId,
        ...query
      };
      
      // Query through Intelligence Engine
      const result = await this.intelligenceEngine.queryMemories(ieQuery, options);
      
      if (result.success) {
        logger.info(`Retrieved ${result.count} memories for agent ${agentId}`);
        return result.memories.map(memory => ({
          id: memory._id,
          agentId: memory.agentId,
          memoryType: memory.memoryType,
          key: memory.key,
          content: memory.content,
          importance: memory.importance,
          context: memory.context,
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt
        }));
      } else {
        logger.warn(`Failed to query memories: ${result.error}`);
        return [];
      }
    } catch (error) {
      logger.error(`Failed to query memories: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Delete a memory
   * @param {string} agentId - ID of the agent
   * @param {string} memoryType - Type of memory
   * @param {string} key - Key for the memory
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteMemory(agentId, memoryType, key) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Delete through Intelligence Engine
      const result = await this.intelligenceEngine.client.delete(
        `/memory/agent-memory/${agentId}/${memoryType}/${key}`
      );
      
      if (result.status === 200 && result.data.success) {
        logger.info(`Deleted ${memoryType} memory for agent ${agentId}: ${key}`);
        return true;
      } else {
        logger.warn(`Failed to delete memory: ${result.data.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to delete memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store an episodic memory (specific experience)
   * @param {string} agentId - ID of the agent
   * @param {string} key - Key for the memory
   * @param {Object} experience - Experience to store
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeEpisodicMemory(agentId, key, experience, options = {}) {
    return this.storeMemory(agentId, 'episodic', key, experience, options);
  }
  
  /**
   * Store a semantic memory (general knowledge)
   * @param {string} agentId - ID of the agent
   * @param {string} key - Key for the memory
   * @param {Object} knowledge - Knowledge to store
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeSemanticMemory(agentId, key, knowledge, options = {}) {
    return this.storeMemory(agentId, 'semantic', key, knowledge, options);
  }
  
  /**
   * Store a procedural memory (action sequence)
   * @param {string} agentId - ID of the agent
   * @param {string} key - Key for the memory
   * @param {Object} procedure - Procedure to store
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeProceduralMemory(agentId, key, procedure, options = {}) {
    return this.storeMemory(agentId, 'procedural', key, procedure, options);
  }
  
  /**
   * Retrieve an episodic memory
   * @param {string} agentId - ID of the agent
   * @param {string} key - Key for the memory
   * @returns {Promise<Object>} Retrieved experience
   */
  async retrieveEpisodicMemory(agentId, key) {
    return this.retrieveMemory(agentId, 'episodic', key);
  }
  
  /**
   * Retrieve a semantic memory
   * @param {string} agentId - ID of the agent
   * @param {string} key - Key for the memory
   * @returns {Promise<Object>} Retrieved knowledge
   */
  async retrieveSemanticMemory(agentId, key) {
    return this.retrieveMemory(agentId, 'semantic', key);
  }
  
  /**
   * Retrieve a procedural memory
   * @param {string} agentId - ID of the agent
   * @param {string} key - Key for the memory
   * @returns {Promise<Object>} Retrieved procedure
   */
  async retrieveProceduralMemory(agentId, key) {
    return this.retrieveMemory(agentId, 'procedural', key);
  }
  
  /**
   * Query episodic memories
   * @param {string} agentId - ID of the agent
   * @param {Object} query - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching episodic memories
   */
  async queryEpisodicMemories(agentId, query = {}, options = {}) {
    return this.queryMemories(agentId, { ...query, type: 'episodic' }, options);
  }
  
  /**
   * Query semantic memories
   * @param {string} agentId - ID of the agent
   * @param {Object} query - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching semantic memories
   */
  async querySemanticMemories(agentId, query = {}, options = {}) {
    return this.queryMemories(agentId, { ...query, type: 'semantic' }, options);
  }
  
  /**
   * Query procedural memories
   * @param {string} agentId - ID of the agent
   * @param {Object} query - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching procedural memories
   */
  async queryProceduralMemories(agentId, query = {}, options = {}) {
    return this.queryMemories(agentId, { ...query, type: 'procedural' }, options);
  }
  
  /**
   * Shutdown the adapter
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      this.initialized = false;
      logger.info('Agent Memory Adapter shut down successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Agent Memory Adapter: ${error.message}`);
      return false;
    }
  }
}

module.exports = AgentMemoryAdapter;
