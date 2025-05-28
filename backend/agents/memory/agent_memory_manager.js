/**
 * Agent Memory Manager for the FlexTime multi-agent system.
 * 
 * This module implements the memory system for agents to store and retrieve
 * experiences, knowledge, and learning outcomes.
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const neonConfig = require('../../config/neon_db_config');

/**
 * Memory manager for agent memories and experiences.
 */
class AgentMemoryManager {
  /**
   * Initialize a new Agent Memory Manager.
   * 
   * @param {object} config - Configuration options (overrides defaults from mcp_config.js)
   */
  constructor(config = {}) {
    this.config = { ...mcpConfig.memory, ...config };
    this.mongoEnabled = this.config.mongodb.enabled;
    this.redisEnabled = this.config.redis.enabled;
    
    // Initialize connections
    this.mongoClient = null;
    this.mongoDb = null;
    this.redisClient = null;
    
    // Initialize memory collections
    this.collections = {
      experiences: null,
      knowledge: null,
      feedback: null,
      learning: null
    };
    
    logger.info('Agent Memory Manager initialized');
    logger.info(`MongoDB memory enabled: ${this.mongoEnabled}`);
    logger.info(`Redis memory enabled: ${this.redisEnabled}`);
  }
  
  /**
   * Connect to memory storage systems.
   * 
   * @returns {Promise<boolean>} Whether connections were successful
   */
  async connect() {
    let success = true;
    
    // Connect to MongoDB if enabled
    if (this.mongoEnabled) {
      try {
        logger.info(`Connecting to MongoDB at ${this.config.mongodb.uri}`);
        this.mongoClient = new MongoClient(this.config.mongodb.uri);
        await this.mongoClient.connect();
        this.mongoDb = this.mongoClient.db();
        
        // Initialize collections
        this.collections.experiences = this.mongoDb.collection(`${this.config.mongodb.collection}_experiences`);
        this.collections.knowledge = this.mongoDb.collection(`${this.config.mongodb.collection}_knowledge`);
        this.collections.feedback = this.mongoDb.collection(`${this.config.mongodb.collection}_feedback`);
        this.collections.learning = this.mongoDb.collection(`${this.config.mongodb.collection}_learning`);
        
        // Create indexes
        await this.createIndexes();
        
        logger.info('Successfully connected to MongoDB');
      } catch (error) {
        logger.error(`Failed to connect to MongoDB: ${error.message}`);
        success = false;
      }
    }
    
    // Connect to Redis if enabled
    if (this.redisEnabled) {
      try {
        const redisConfig = {
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          retryStrategy: (times) => {
            return Math.min(times * 100, 3000);
          }
        };
        
        logger.info(`Connecting to Redis at ${redisConfig.host}:${redisConfig.port}`);
        this.redisClient = new Redis(redisConfig);
        
        // Test connection
        await this.redisClient.ping();
        logger.info('Successfully connected to Redis');
      } catch (error) {
        logger.error(`Failed to connect to Redis: ${error.message}`);
        success = false;
      }
    }
    
    return success;
  }
  
  /**
   * Create indexes for MongoDB collections.
   * 
   * @private
   */
  async createIndexes() {
    // Experiences collection indexes
    await this.collections.experiences.createIndex({ agentId: 1 });
    await this.collections.experiences.createIndex({ timestamp: 1 });
    await this.collections.experiences.createIndex({ tags: 1 });
    
    // Knowledge collection indexes
    await this.collections.knowledge.createIndex({ domain: 1 });
    await this.collections.knowledge.createIndex({ key: 1 }, { unique: true });
    
    // Feedback collection indexes
    await this.collections.feedback.createIndex({ agentId: 1 });
    await this.collections.feedback.createIndex({ taskId: 1 });
    
    // Learning collection indexes
    await this.collections.learning.createIndex({ agentId: 1 });
    await this.collections.learning.createIndex({ domain: 1 });
    await this.collections.learning.createIndex({ key: 1 });
  }
  
  /**
   * Store an agent experience in memory.
   * 
   * @param {object} experience - Experience to store
   * @param {string} experience.agentId - ID of the agent
   * @param {string} experience.type - Type of experience
   * @param {object} experience.content - Experience content
   * @param {Array<string>} experience.tags - Tags for categorization
   * @returns {Promise<string>} ID of the stored experience
   */
  async storeExperience(experience) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot store experience.');
      return null;
    }
    
    try {
      // Add timestamp
      const experienceDoc = {
        ...experience,
        timestamp: new Date(),
        version: '2.1'
      };
      
      // Store in MongoDB
      const result = await this.collections.experiences.insertOne(experienceDoc);
      
      // Also cache in Redis if enabled
      if (this.redisEnabled) {
        const key = `experience:${experience.agentId}:${result.insertedId}`;
        await this.redisClient.set(
          key,
          JSON.stringify(experienceDoc),
          'EX',
          this.config.redis.ttl
        );
      }
      
      logger.info(`Stored experience for agent ${experience.agentId}`);
      return result.insertedId.toString();
    } catch (error) {
      logger.error(`Failed to store experience: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Retrieve experiences for an agent.
   * 
   * @param {object} query - Query parameters
   * @param {string} query.agentId - ID of the agent
   * @param {string} query.type - Type of experience to retrieve
   * @param {Array<string>} query.tags - Tags to filter by
   * @param {number} query.limit - Maximum number of experiences to retrieve
   * @returns {Promise<Array<object>>} Retrieved experiences
   */
  async retrieveExperiences(query) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot retrieve experiences.');
      return [];
    }
    
    try {
      // Build MongoDB query
      const mongoQuery = {};
      
      if (query.agentId) {
        mongoQuery.agentId = query.agentId;
      }
      
      if (query.type) {
        mongoQuery.type = query.type;
      }
      
      if (query.tags && query.tags.length > 0) {
        mongoQuery.tags = { $in: query.tags };
      }
      
      // Execute query
      const cursor = this.collections.experiences
        .find(mongoQuery)
        .sort({ timestamp: -1 })
        .limit(query.limit || 10);
      
      const experiences = await cursor.toArray();
      logger.info(`Retrieved ${experiences.length} experiences for query`);
      
      return experiences;
    } catch (error) {
      logger.error(`Failed to retrieve experiences: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Store knowledge in the knowledge base.
   * 
   * @param {object} knowledge - Knowledge to store
   * @param {string} knowledge.domain - Knowledge domain
   * @param {string} knowledge.key - Unique key for this knowledge
   * @param {object} knowledge.content - Knowledge content
   * @param {Array<string>} knowledge.tags - Tags for categorization
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  async storeKnowledge(knowledge) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot store knowledge.');
      return false;
    }
    
    try {
      // Add timestamp and version
      const knowledgeDoc = {
        ...knowledge,
        timestamp: new Date(),
        version: '2.1',
        lastUpdated: new Date()
      };
      
      // Upsert to MongoDB (update if exists, insert if not)
      const result = await this.collections.knowledge.updateOne(
        { domain: knowledge.domain, key: knowledge.key },
        { $set: knowledgeDoc },
        { upsert: true }
      );
      
      // Also cache in Redis if enabled
      if (this.redisEnabled) {
        const key = `knowledge:${knowledge.domain}:${knowledge.key}`;
        await this.redisClient.set(
          key,
          JSON.stringify(knowledgeDoc),
          'EX',
          this.config.redis.ttl
        );
      }
      
      logger.info(`Stored knowledge for domain ${knowledge.domain} with key ${knowledge.key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to store knowledge: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Retrieve knowledge from the knowledge base.
   * 
   * @param {object} query - Query parameters
   * @param {string} query.domain - Knowledge domain
   * @param {string} query.key - Specific knowledge key
   * @param {Array<string>} query.tags - Tags to filter by
   * @returns {Promise<object|Array<object>>} Retrieved knowledge
   */
  async retrieveKnowledge(query) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot retrieve knowledge.');
      return null;
    }
    
    try {
      // Check Redis cache first if enabled and querying by key
      if (this.redisEnabled && query.domain && query.key) {
        const cacheKey = `knowledge:${query.domain}:${query.key}`;
        const cachedValue = await this.redisClient.get(cacheKey);
        
        if (cachedValue) {
          logger.info(`Retrieved knowledge from Redis cache: ${query.domain}/${query.key}`);
          return JSON.parse(cachedValue);
        }
      }
      
      // Build MongoDB query
      const mongoQuery = {};
      
      if (query.domain) {
        mongoQuery.domain = query.domain;
      }
      
      if (query.key) {
        mongoQuery.key = query.key;
      }
      
      if (query.tags && query.tags.length > 0) {
        mongoQuery.tags = { $in: query.tags };
      }
      
      // If querying by specific key, return single document
      if (query.key) {
        const knowledge = await this.collections.knowledge.findOne(mongoQuery);
        
        // Cache in Redis if found and Redis is enabled
        if (knowledge && this.redisEnabled) {
          const cacheKey = `knowledge:${query.domain}:${query.key}`;
          await this.redisClient.set(
            cacheKey,
            JSON.stringify(knowledge),
            'EX',
            this.config.redis.ttl
          );
        }
        
        return knowledge;
      }
      
      // Otherwise return array of matching documents
      const cursor = this.collections.knowledge.find(mongoQuery);
      const knowledgeItems = await cursor.toArray();
      
      logger.info(`Retrieved ${knowledgeItems.length} knowledge items for query`);
      return knowledgeItems;
    } catch (error) {
      logger.error(`Failed to retrieve knowledge: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Store feedback for an agent's actions.
   * 
   * @param {object} feedback - Feedback to store
   * @param {string} feedback.agentId - ID of the agent
   * @param {string} feedback.taskId - ID of the task
   * @param {number} feedback.rating - Numeric rating (1-5)
   * @param {string} feedback.comment - Feedback comment
   * @param {object} feedback.metrics - Performance metrics
   * @returns {Promise<string>} ID of the stored feedback
   */
  async storeFeedback(feedback) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot store feedback.');
      return null;
    }
    
    try {
      // Add timestamp
      const feedbackDoc = {
        ...feedback,
        timestamp: new Date(),
        version: '2.1'
      };
      
      // Store in MongoDB
      const result = await this.collections.feedback.insertOne(feedbackDoc);
      
      logger.info(`Stored feedback for agent ${feedback.agentId} on task ${feedback.taskId}`);
      return result.insertedId.toString();
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Store learning outcome from agent's experiences.
   * 
   * @param {object} learning - Learning to store
   * @param {string} learning.agentId - ID of the agent
   * @param {string} learning.domain - Learning domain
   * @param {string} learning.key - Learning key
   * @param {object} learning.content - Learning content
   * @param {Array<string>} learning.relatedExperiences - IDs of related experiences
   * @returns {Promise<string>} ID of the stored learning
   */
  async storeLearning(learning) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot store learning.');
      return null;
    }
    
    try {
      // Add timestamp and version
      const learningDoc = {
        ...learning,
        timestamp: new Date(),
        version: '2.1',
        lastUpdated: new Date()
      };
      
      // Upsert to MongoDB (update if exists, insert if not)
      const result = await this.collections.learning.updateOne(
        { agentId: learning.agentId, domain: learning.domain, key: learning.key },
        { $set: learningDoc },
        { upsert: true }
      );
      
      // Also cache in Redis if enabled
      if (this.redisEnabled) {
        const key = `learning:${learning.agentId}:${learning.domain}:${learning.key}`;
        await this.redisClient.set(
          key,
          JSON.stringify(learningDoc),
          'EX',
          this.config.redis.ttl
        );
      }
      
      logger.info(`Stored learning for agent ${learning.agentId} in domain ${learning.domain}`);
      return true;
    } catch (error) {
      logger.error(`Failed to store learning: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Retrieve learning outcomes for an agent.
   * 
   * @param {object} query - Query parameters
   * @param {string} query.agentId - ID of the agent
   * @param {string} query.domain - Learning domain
   * @param {string} query.key - Specific learning key
   * @returns {Promise<object|Array<object>>} Retrieved learning outcomes
   */
  async retrieveLearning(query) {
    if (!this.mongoEnabled) {
      logger.warn('MongoDB memory is disabled. Cannot retrieve learning.');
      return null;
    }
    
    try {
      // Check Redis cache first if enabled and querying by key
      if (this.redisEnabled && query.agentId && query.domain && query.key) {
        const cacheKey = `learning:${query.agentId}:${query.domain}:${query.key}`;
        const cachedValue = await this.redisClient.get(cacheKey);
        
        if (cachedValue) {
          logger.info(`Retrieved learning from Redis cache: ${query.agentId}/${query.domain}/${query.key}`);
          return JSON.parse(cachedValue);
        }
      }
      
      // Build MongoDB query
      const mongoQuery = {};
      
      if (query.agentId) {
        mongoQuery.agentId = query.agentId;
      }
      
      if (query.domain) {
        mongoQuery.domain = query.domain;
      }
      
      if (query.key) {
        mongoQuery.key = query.key;
      }
      
      // If querying by specific key, return single document
      if (query.key) {
        const learning = await this.collections.learning.findOne(mongoQuery);
        
        // Cache in Redis if found and Redis is enabled
        if (learning && this.redisEnabled) {
          const cacheKey = `learning:${query.agentId}:${query.domain}:${query.key}`;
          await this.redisClient.set(
            cacheKey,
            JSON.stringify(learning),
            'EX',
            this.config.redis.ttl
          );
        }
        
        return learning;
      }
      
      // Otherwise return array of matching documents
      const cursor = this.collections.learning.find(mongoQuery);
      const learningItems = await cursor.toArray();
      
      logger.info(`Retrieved ${learningItems.length} learning items for query`);
      return learningItems;
    } catch (error) {
      logger.error(`Failed to retrieve learning: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Close connections to memory storage systems.
   */
  async close() {
    if (this.mongoClient) {
      await this.mongoClient.close();
      logger.info('Closed MongoDB connection');
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
      logger.info('Closed Redis connection');
    }
  }
}

module.exports = AgentMemoryManager;
