/**
 * Simple Agent Memory Adapter
 * 
 * Provides basic memory storage for agents without external dependencies
 */

const logger = require("../utils/logger");

/**
 * Simple memory adapter for agent storage
 */
class AgentMemoryAdapter {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      ...config
    };
    
    this.memoryStore = new Map();
    this.initialized = false;
  }
  
  async initialize() {
    try {
      if (!this.initialized) {
        logger.info('Initializing Agent Memory Adapter');
        this.memoryStore.clear();
        this.initialized = true;
        logger.info('Agent Memory Adapter initialized successfully');
      }
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Agent Memory Adapter: ${error.message}`);
      return false;
    }
  }
  
  async connect() {
    return this.initialize();
  }
  
  async storeMemory(agentId, memoryType, key, content, options = {}) {
    try {
      const memoryKey = `${agentId}:${memoryType}:${key}`;
      const memory = {
        agentId,
        type: memoryType,
        key,
        content,
        importance: options.importance || 0.5,
        timestamp: new Date(),
        metadata: options.metadata || {}
      };
      
      this.memoryStore.set(memoryKey, memory);
      logger.debug(`Stored ${memoryType} memory for agent ${agentId}: ${key}`);
      
      return { success: true, memory };
    } catch (error) {
      logger.error(`Failed to store memory: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  async retrieveMemory(agentId, memoryType, key) {
    try {
      const memoryKey = `${agentId}:${memoryType}:${key}`;
      const memory = this.memoryStore.get(memoryKey);
      
      if (memory) {
        logger.debug(`Retrieved ${memoryType} memory for agent ${agentId}: ${key}`);
        return memory.content;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to retrieve memory: ${error.message}`);
      return null;
    }
  }
  
  async queryMemories(agentId, query = {}, options = {}) {
    try {
      const results = [];
      
      for (const [memoryKey, memory] of this.memoryStore.entries()) {
        if (memory.agentId === agentId) {
          // Simple matching logic
          if (!query.type || memory.type === query.type) {
            results.push(memory);
          }
        }
      }
      
      logger.debug(`Retrieved ${results.length} memories for agent ${agentId}`);
      return results;
    } catch (error) {
      logger.error(`Failed to query memories: ${error.message}`);
      return [];
    }
  }
  
  async deleteMemory(agentId, memoryType, key) {
    try {
      const memoryKey = `${agentId}:${memoryType}:${key}`;
      const deleted = this.memoryStore.delete(memoryKey);
      
      if (deleted) {
        logger.debug(`Deleted ${memoryType} memory for agent ${agentId}: ${key}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete memory: ${error.message}`);
      return false;
    }
  }
  
  // Helper methods for specific memory types
  async storeEpisodicMemory(agentId, key, experience, options = {}) {
    return this.storeMemory(agentId, 'episodic', key, experience, options);
  }
  
  async storeSemanticMemory(agentId, key, knowledge, options = {}) {
    return this.storeMemory(agentId, 'semantic', key, knowledge, options);
  }
  
  async storeProceduralMemory(agentId, key, procedure, options = {}) {
    return this.storeMemory(agentId, 'procedural', key, procedure, options);
  }
  
  async retrieveEpisodicMemory(agentId, key) {
    return this.retrieveMemory(agentId, 'episodic', key);
  }
  
  async retrieveSemanticMemory(agentId, key) {
    return this.retrieveMemory(agentId, 'semantic', key);
  }
  
  async retrieveProceduralMemory(agentId, key) {
    return this.retrieveMemory(agentId, 'procedural', key);
  }
  
  async retrieveMemories(query = {}) {
    try {
      const results = [];
      
      for (const [memoryKey, memory] of this.memoryStore.entries()) {
        let matches = true;
        
        // Apply filters based on query
        if (query.type && memory.type !== query.type) {
          matches = false;
        }
        
        if (query.metadata) {
          for (const [key, value] of Object.entries(query.metadata)) {
            if (memory.metadata[key] !== value) {
              matches = false;
              break;
            }
          }
        }
        
        if (matches) {
          results.push({
            id: memoryKey,
            content: memory.content,
            metadata: memory.metadata,
            type: memory.type,
            timestamp: memory.timestamp
          });
        }
      }
      
      // Apply sorting if specified
      if (query.sort) {
        const sortKey = Object.keys(query.sort)[0];
        const sortOrder = query.sort[sortKey];
        
        results.sort((a, b) => {
          let aVal = a[sortKey] || a.metadata[sortKey];
          let bVal = b[sortKey] || b.metadata[sortKey];
          
          if (sortOrder === -1) {
            return bVal > aVal ? 1 : -1;
          } else {
            return aVal > bVal ? 1 : -1;
          }
        });
      }
      
      // Apply limit if specified
      if (query.limit) {
        results.splice(query.limit);
      }
      
      logger.debug(`Retrieved ${results.length} memories matching query`);
      return results;
    } catch (error) {
      logger.error(`Failed to retrieve memories: ${error.message}`);
      return [];
    }
  }

  async disconnect() {
    return this.shutdown();
  }

  async shutdown() {
    try {
      this.memoryStore.clear();
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