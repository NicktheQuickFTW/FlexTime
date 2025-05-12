/**
 * FlexTime Agent Memory Manager
 * 
 * This module provides persistent memory storage for agents, enabling them to store
 * and retrieve experiences across scheduling sessions, creating a foundation for
 * learning from past experiences.
 */

const mongoose = require('mongoose');
const Redis = require('redis');
const logger = require('../utils/logger');

// MongoDB Schema for Agent Memories
const AgentMemorySchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  memoryType: { 
    type: String, 
    required: true, 
    enum: ['episodic', 'semantic', 'procedural'],
    index: true 
  },
  key: { type: String, required: true, index: true },
  content: mongoose.Schema.Types.Mixed,
  importance: { type: Number, default: 0.5, min: 0, max: 1 },
  context: {
    sportType: String,
    conferenceId: String,
    seasonYear: Number,
    tags: [String]
  },
  accessCount: { type: Number, default: 0 },
  lastAccessed: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create a compound index for efficient retrieval
AgentMemorySchema.index({ agentId: 1, memoryType: 1, 'context.sportType': 1 });

// Create the model if it doesn't exist
let AgentMemory;
try {
  AgentMemory = mongoose.model('AgentMemory');
} catch (error) {
  AgentMemory = mongoose.model('AgentMemory', AgentMemorySchema);
}

/**
 * Agent Memory Manager for persistent memory storage
 */
class AgentMemoryManager {
  /**
   * Create a new Agent Memory Manager
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/heliix',
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      memoryCacheTTL: 3600, // 1 hour in seconds
      maxMemoriesPerAgent: 1000,
      consolidationThreshold: 0.85, // Similarity threshold for memory consolidation
      pruningInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      ...config
    };
    
    this.mongoConnected = false;
    this.redisConnected = false;
    this.redisClient = null;
    this.lastPruningTime = Date.now();
  }
  
  /**
   * Connect to MongoDB
   * @returns {Promise<boolean>} Whether connection was successful
   */
  async connectMongo() {
    try {
      if (!this.mongoConnected) {
        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(this.config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
        }
        
        this.mongoConnected = true;
        logger.info('Agent Memory Manager connected to MongoDB');
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to connect to MongoDB: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Connect to Redis
   * @returns {Promise<boolean>} Whether connection was successful
   */
  async connectRedis() {
    try {
      if (!this.redisConnected) {
        // Create Redis client
        this.redisClient = Redis.createClient({
          url: this.config.redisUrl
        });
        
        // Set up event handlers
        this.redisClient.on('error', (error) => {
          logger.error(`Redis error: ${error.message}`);
          this.redisConnected = false;
        });
        
        this.redisClient.on('connect', () => {
          logger.info('Agent Memory Manager connected to Redis');
          this.redisConnected = true;
        });
        
        // Connect to Redis
        await this.redisClient.connect();
      }
      
      return this.redisConnected;
    } catch (error) {
      logger.error(`Failed to connect to Redis: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store a memory for an agent
   * @param {string} agentId - ID of the agent
   * @param {string} memoryType - Type of memory (episodic, semantic, procedural)
   * @param {string} key - Key for the memory
   * @param {Object} content - Content of the memory
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the storage operation
   */
  async storeMemory(agentId, memoryType, key, content, options = {}) {
    try {
      // Ensure MongoDB connection
      if (!this.mongoConnected) {
        await this.connectMongo();
      }
      
      // Check if a similar memory already exists
      const existingMemory = await this._findSimilarMemory(agentId, memoryType, key, content, options.context);
      
      if (existingMemory) {
        // Update existing memory
        existingMemory.content = this._consolidateMemories(existingMemory.content, content);
        existingMemory.importance = Math.max(existingMemory.importance, options.importance || 0.5);
        existingMemory.accessCount += 1;
        existingMemory.lastAccessed = new Date();
        existingMemory.updatedAt = new Date();
        
        if (options.context) {
          // Update context if provided
          existingMemory.context = {
            ...existingMemory.context,
            ...options.context
          };
          
          // Add new tags if provided
          if (options.context.tags && Array.isArray(options.context.tags)) {
            const existingTags = existingMemory.context.tags || [];
            existingMemory.context.tags = [...new Set([...existingTags, ...options.context.tags])];
          }
        }
        
        await existingMemory.save();
        
        // Update cache if Redis is connected
        if (this.redisConnected) {
          const cacheKey = `memory:${agentId}:${memoryType}:${key}`;
          await this.redisClient.set(cacheKey, JSON.stringify(existingMemory), {
            EX: this.config.memoryCacheTTL
          });
        }
        
        return { success: true, id: existingMemory._id, updated: true };
      } else {
        // Create new memory
        const newMemory = new AgentMemory({
          agentId,
          memoryType,
          key,
          content,
          importance: options.importance || 0.5,
          context: options.context || {},
          accessCount: 1,
          lastAccessed: new Date()
        });
        
        await newMemory.save();
        
        // Update cache if Redis is connected
        if (this.redisConnected) {
          const cacheKey = `memory:${agentId}:${memoryType}:${key}`;
          await this.redisClient.set(cacheKey, JSON.stringify(newMemory), {
            EX: this.config.memoryCacheTTL
          });
        }
        
        // Prune old memories if necessary
        await this._pruneOldMemories(agentId);
        
        return { success: true, id: newMemory._id, updated: false };
      }
    } catch (error) {
      logger.error(`Failed to store memory: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Retrieve a memory for an agent
   * @param {string} agentId - ID of the agent
   * @param {string} memoryType - Type of memory
   * @param {string} key - Key for the memory
   * @returns {Promise<Object>} Retrieved memory
   */
  async retrieveMemory(agentId, memoryType, key) {
    try {
      // Check cache first if Redis is connected
      if (this.redisConnected) {
        const cacheKey = `memory:${agentId}:${memoryType}:${key}`;
        const cachedMemory = await this.redisClient.get(cacheKey);
        
        if (cachedMemory) {
          return JSON.parse(cachedMemory);
        }
      }
      
      // Ensure MongoDB connection
      if (!this.mongoConnected) {
        await this.connectMongo();
      }
      
      // Find memory in MongoDB
      const memory = await AgentMemory.findOne({
        agentId,
        memoryType,
        key
      });
      
      if (memory) {
        // Update access statistics
        memory.accessCount += 1;
        memory.lastAccessed = new Date();
        await memory.save();
        
        // Update cache if Redis is connected
        if (this.redisConnected) {
          const cacheKey = `memory:${agentId}:${memoryType}:${key}`;
          await this.redisClient.set(cacheKey, JSON.stringify(memory), {
            EX: this.config.memoryCacheTTL
          });
        }
        
        return memory;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to retrieve memory: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Query memories for an agent
   * @param {string} agentId - ID of the agent
   * @param {Object} query - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Matching memories
   */
  async queryMemories(agentId, query = {}, options = {}) {
    try {
      // Ensure MongoDB connection
      if (!this.mongoConnected) {
        await this.connectMongo();
      }
      
      // Build MongoDB query
      const mongoQuery = { agentId };
      
      if (query.memoryType) {
        mongoQuery.memoryType = query.memoryType;
      }
      
      if (query.keyPattern) {
        mongoQuery.key = { $regex: query.keyPattern, $options: 'i' };
      }
      
      if (query.minImportance) {
        mongoQuery.importance = { $gte: query.minImportance };
      }
      
      if (query.context) {
        if (query.context.sportType) {
          mongoQuery['context.sportType'] = query.context.sportType;
        }
        
        if (query.context.conferenceId) {
          mongoQuery['context.conferenceId'] = query.context.conferenceId;
        }
        
        if (query.context.seasonYear) {
          mongoQuery['context.seasonYear'] = query.context.seasonYear;
        }
        
        if (query.context.tags && query.context.tags.length > 0) {
          mongoQuery['context.tags'] = { $in: query.context.tags };
        }
      }
      
      // Apply options
      const limit = options.limit || 100;
      const skip = options.skip || 0;
      const sort = options.sort || { importance: -1, lastAccessed: -1 };
      
      // Execute query
      const memories = await AgentMemory.find(mongoQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      // Update access statistics for retrieved memories
      for (const memory of memories) {
        memory.accessCount += 1;
        memory.lastAccessed = new Date();
        await memory.save();
      }
      
      return memories;
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
      // Ensure MongoDB connection
      if (!this.mongoConnected) {
        await this.connectMongo();
      }
      
      // Delete from MongoDB
      const result = await AgentMemory.deleteOne({
        agentId,
        memoryType,
        key
      });
      
      // Delete from cache if Redis is connected
      if (this.redisConnected) {
        const cacheKey = `memory:${agentId}:${memoryType}:${key}`;
        await this.redisClient.del(cacheKey);
      }
      
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Failed to delete memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Find a similar memory
   * @param {string} agentId - ID of the agent
   * @param {string} memoryType - Type of memory
   * @param {string} key - Key for the memory
   * @param {Object} content - Content of the memory
   * @param {Object} context - Context of the memory
   * @returns {Promise<Object>} Similar memory if found
   * @private
   */
  async _findSimilarMemory(agentId, memoryType, key, content, context) {
    // First, try to find an exact match by key
    const exactMatch = await AgentMemory.findOne({
      agentId,
      memoryType,
      key
    });
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // If no exact match, try to find a similar memory based on context
    if (context && (context.sportType || context.conferenceId)) {
      const contextQuery = { agentId, memoryType };
      
      if (context.sportType) {
        contextQuery['context.sportType'] = context.sportType;
      }
      
      if (context.conferenceId) {
        contextQuery['context.conferenceId'] = context.conferenceId;
      }
      
      const potentialMatches = await AgentMemory.find(contextQuery).limit(10);
      
      // Check for content similarity
      for (const match of potentialMatches) {
        const similarity = this._calculateSimilarity(match.content, content);
        
        if (similarity >= this.config.consolidationThreshold) {
          return match;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Calculate similarity between two memory contents
   * @param {Object} content1 - First content
   * @param {Object} content2 - Second content
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _calculateSimilarity(content1, content2) {
    // Simple implementation for object similarity
    // In a real system, this would use more sophisticated methods
    
    // Convert objects to strings for comparison
    const str1 = JSON.stringify(content1);
    const str2 = JSON.stringify(content2);
    
    // If either string is empty, return 0
    if (!str1 || !str2) {
      return 0;
    }
    
    // Calculate Jaccard similarity
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Consolidate two memory contents
   * @param {Object} existingContent - Existing memory content
   * @param {Object} newContent - New memory content
   * @returns {Object} Consolidated content
   * @private
   */
  _consolidateMemories(existingContent, newContent) {
    // Simple implementation for object consolidation
    // In a real system, this would use more sophisticated methods
    
    // If objects are arrays, merge them
    if (Array.isArray(existingContent) && Array.isArray(newContent)) {
      return [...new Set([...existingContent, ...newContent])];
    }
    
    // If objects are simple values, use the newer one
    if (typeof existingContent !== 'object' || existingContent === null ||
        typeof newContent !== 'object' || newContent === null) {
      return newContent;
    }
    
    // Merge objects recursively
    const result = { ...existingContent };
    
    for (const [key, value] of Object.entries(newContent)) {
      if (key in result && typeof result[key] === 'object' && typeof value === 'object') {
        result[key] = this._consolidateMemories(result[key], value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Prune old memories for an agent
   * @param {string} agentId - ID of the agent
   * @private
   */
  async _pruneOldMemories(agentId) {
    try {
      // Check if pruning is needed
      const count = await AgentMemory.countDocuments({ agentId });
      
      if (count > this.config.maxMemoriesPerAgent) {
        // Find memories to prune
        const memoriesToPrune = await AgentMemory.find({ agentId })
          .sort({ importance: 1, lastAccessed: 1, accessCount: 1 })
          .limit(count - this.config.maxMemoriesPerAgent);
        
        const ids = memoriesToPrune.map(m => m._id);
        
        // Delete memories
        await AgentMemory.deleteMany({ _id: { $in: ids } });
        
        logger.info(`Pruned ${ids.length} old memories for agent ${agentId}`);
      }
      
      // Check if it's time for periodic pruning
      const now = Date.now();
      if (now - this.lastPruningTime > this.config.pruningInterval) {
        // Prune very old memories that haven't been accessed in a long time
        const cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000); // 90 days ago
        
        const result = await AgentMemory.deleteMany({
          lastAccessed: { $lt: cutoffDate },
          importance: { $lt: 0.7 } // Keep important memories
        });
        
        if (result.deletedCount > 0) {
          logger.info(`Periodic pruning removed ${result.deletedCount} old memories`);
        }
        
        this.lastPruningTime = now;
      }
    } catch (error) {
      logger.error(`Failed to prune old memories: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from databases
   * @returns {Promise<boolean>} Whether disconnection was successful
   */
  async disconnect() {
    try {
      // Disconnect from Redis
      if (this.redisConnected && this.redisClient) {
        await this.redisClient.quit();
        this.redisConnected = false;
        logger.info('Disconnected from Redis');
      }
      
      // MongoDB disconnection is handled at the application level
      this.mongoConnected = false;
      
      return true;
    } catch (error) {
      logger.error(`Failed to disconnect: ${error.message}`);
      return false;
    }
  }
}

module.exports = AgentMemoryManager;
