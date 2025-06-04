/**
 * Enhanced Memory Manager for FlexTime
 * 
 * Advanced memory management with vector embeddings, semantic search,
 * and short-term/long-term memory separation.
 */

const logger = require("../utils/logger");
const { Pool } = require('pg');
const Redis = require('ioredis');
const crypto = require('crypto');

/**
 * Enhanced Memory Manager for semantic storage and retrieval
 */
class EnhancedMemoryManager {
  /**
   * Initialize the enhanced memory manager
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      neon: {
        enabled: process.env.ENABLE_NEON_MEMORY !== 'false',
        connectionString: process.env.NEON_DB_CONNECTION_STRING,
        tableName: 'agent_memories'
      },
      redis: {
        enabled: process.env.ENABLE_REDIS_MEMORY === 'true',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || '',
        ttl: parseInt(process.env.REDIS_MEMORY_TTL || '3600')
      },
      shortTermExpiryDays: 7,  // Short-term memories expire after 7 days
      longTermThreshold: 3,    // Items accessed 3+ times become long-term
      ...config
    };
    
    // Initialize clients
    this.neonClient = null;
    this.redisClient = null;
    this.isConnected = false;
    this.embeddingProvider = null;
    
    logger.info('Enhanced memory manager initialized');
  }

  /**
   * Connect to memory storage systems
   * 
   * @returns {Promise<boolean>} Whether connection was successful
   */
  async connect() {
    try {
      // Connect to Neon DB for long-term storage
      if (this.config.neon.enabled) {
        this.neonClient = new Pool({
          connectionString: this.config.neon.connectionString,
          ssl: {
            rejectUnauthorized: false
          }
        });
        
        // Test connection
        await this.neonClient.query('SELECT NOW()');
        logger.info('Connected to Neon DB for long-term memory storage');
        
        // Ensure tables exist
        await this._ensureTablesExist();
      }
      
      // Connect to Redis for short-term memory
      if (this.config.redis.enabled) {
        this.redisClient = new Redis({
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password || undefined
        });
        
        // Test connection
        await this.redisClient.ping();
        logger.info('Connected to Redis for short-term memory storage');
      }
      
      this.isConnected = true;
      return true;
    } catch (error) {
      logger.error(`Failed to connect to memory storage: ${error.message}`);
      return false;
    }
  }

  /**
   * Set the embedding provider for semantic search
   * 
   * @param {Object} provider - Embedding provider instance
   */
  setEmbeddingProvider(provider) {
    this.embeddingProvider = provider;
    logger.info('Embedding provider set for semantic memory search');
  }

  /**
   * Store a memory (experience, fact, or learning)
   * 
   * @param {Object} memory - Memory to store
   * @param {string} memory.agentId - ID of the agent this memory belongs to
   * @param {string} memory.type - Type of memory (experience, fact, learning)
   * @param {Object} memory.content - Content of the memory
   * @param {Array<string>} [memory.tags] - Tags for categorization
   * @param {boolean} [memory.longTerm=false] - Force as long-term memory
   * @returns {Promise<string>} ID of the stored memory
   */
  async storeMemory(memory) {
    if (!this.isConnected) {
      throw new Error('Memory manager is not connected');
    }
    
    // Generate memory ID if not provided
    const memoryId = memory.id || this._generateId();
    
    // Add metadata
    const enhancedMemory = {
      ...memory,
      id: memoryId,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null,
      embedding: null,
      relevanceScore: 0
    };
    
    // Generate embedding if provider is available
    if (this.embeddingProvider && typeof memory.content === 'object') {
      try {
        const textToEmbed = this._prepareTextForEmbedding(memory.content);
        const embeddingResult = await this.embeddingProvider.generateEmbedding({ text: textToEmbed });
        
        if (embeddingResult.success && embeddingResult.embedding) {
          enhancedMemory.embedding = embeddingResult.embedding;
        }
      } catch (error) {
        logger.warn(`Failed to generate embedding for memory: ${error.message}`);
      }
    }
    
    // Store in appropriate storage systems
    if (memory.longTerm || memory.type === 'learning') {
      // Long-term memories go directly to Neon DB
      await this._storeInNeon(enhancedMemory);
    } else {
      // Short-term memories go to Redis first
      await this._storeInRedis(enhancedMemory);
    }
    
    return memoryId;
  }

  /**
   * Retrieve memories based on query parameters
   * 
   * @param {Object} query - Query parameters
   * @param {string} [query.agentId] - Filter by agent ID
   * @param {string} [query.type] - Filter by memory type
   * @param {Array<string>} [query.tags] - Filter by tags
   * @param {Object} [query.semanticQuery] - Semantic search query
   * @param {number} [query.limit=10] - Maximum number of memories to retrieve
   * @param {boolean} [query.includeLongTerm=true] - Whether to include long-term memories
   * @param {boolean} [query.includeShortTerm=true] - Whether to include short-term memories
   * @returns {Promise<Array<Object>>} Retrieved memories
   */
  async retrieveMemories(query) {
    if (!this.isConnected) {
      throw new Error('Memory manager is not connected');
    }
    
    const results = [];
    
    // Retrieve from Redis (short-term memory)
    if (query.includeShortTerm !== false && this.redisClient) {
      const shortTermMemories = await this._retrieveFromRedis(query);
      results.push(...shortTermMemories);
    }
    
    // Retrieve from Neon DB (long-term memory)
    if (query.includeLongTerm !== false && this.neonClient) {
      const longTermMemories = await this._retrieveFromNeon(query);
      results.push(...longTermMemories);
    }
    
    // Sort results by relevance and recency
    const sortedResults = this._sortMemoriesByRelevance(results, query);
    
    // Apply limit
    const limit = query.limit || 10;
    return sortedResults.slice(0, limit);
  }

  /**
   * Search for memories semantically using embeddings
   * 
   * @param {string} text - Text to search for
   * @param {Object} options - Search options
   * @param {string} [options.agentId] - Filter by agent ID
   * @param {string} [options.type] - Filter by memory type
   * @param {Array<string>} [options.tags] - Filter by tags
   * @param {number} [options.limit=5] - Maximum number of memories to retrieve
   * @param {number} [options.threshold=0.7] - Similarity threshold (0-1)
   * @returns {Promise<Array<Object>>} Retrieved memories
   */
  async semanticSearch(text, options = {}) {
    if (!this.isConnected) {
      throw new Error('Memory manager is not connected');
    }
    
    if (!this.embeddingProvider) {
      throw new Error('No embedding provider available for semantic search');
    }
    
    // Generate embedding for the query text
    const embeddingResult = await this.embeddingProvider.generateEmbedding({ text });
    
    if (!embeddingResult.success || !embeddingResult.embedding) {
      throw new Error('Failed to generate embedding for semantic search');
    }
    
    const queryEmbedding = embeddingResult.embedding;
    
    // Search using the embedding
    return this.retrieveMemories({
      ...options,
      semanticQuery: {
        embedding: queryEmbedding,
        threshold: options.threshold || 0.7
      }
    });
  }

  /**
   * Access a memory by ID and update access statistics
   * 
   * @param {string} memoryId - ID of the memory to access
   * @returns {Promise<Object>} Retrieved memory
   */
  async accessMemory(memoryId) {
    if (!this.isConnected) {
      throw new Error('Memory manager is not connected');
    }
    
    // Try Redis first
    let memory = null;
    
    if (this.redisClient) {
      const redisKey = `memory:${memoryId}`;
      const data = await this.redisClient.get(redisKey);
      
      if (data) {
        memory = JSON.parse(data);
      }
    }
    
    // If not in Redis, check Neon DB
    if (!memory && this.neonClient) {
      const result = await this.neonClient.query(
        `SELECT * FROM ${this.config.neon.tableName} WHERE id = $1`,
        [memoryId]
      );
      
      if (result.rows.length > 0) {
        memory = result.rows[0];
      }
    }
    
    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }
    
    // Update access statistics
    memory.accessCount = (memory.accessCount || 0) + 1;
    memory.lastAccessed = new Date().toISOString();
    
    // Check if memory should be promoted to long-term
    if (memory.accessCount >= this.config.longTermThreshold && !memory.longTerm) {
      memory.longTerm = true;
      logger.info(`Memory ${memoryId} promoted to long-term storage`);
      
      // Store in Neon DB if not already there
      if (this.neonClient) {
        await this._storeInNeon(memory);
      }
    }
    
    // Update the memory in its current storage
    if (memory.longTerm && this.neonClient) {
      await this._updateInNeon(memory);
    } else if (this.redisClient) {
      await this._storeInRedis(memory);
    }
    
    return memory;
  }

  /**
   * Prepare text for embedding by extracting key information
   * 
   * @param {Object} content - Memory content
   * @returns {string} Prepared text
   * @private
   */
  _prepareTextForEmbedding(content) {
    // For object content, convert to string representation
    if (typeof content === 'object') {
      // Extract key fields for different content types
      let textParts = [];
      
      // Extract title or name if available
      if (content.title) textParts.push(`Title: ${content.title}`);
      if (content.name) textParts.push(`Name: ${content.name}`);
      
      // Extract description if available
      if (content.description) textParts.push(`Description: ${content.description}`);
      
      // Extract scheduleId for schedule-related memories
      if (content.scheduleId) textParts.push(`Schedule ID: ${content.scheduleId}`);
      
      // Extract sport type if available
      if (content.sportType) textParts.push(`Sport: ${content.sportType}`);
      
      // Extract key messages or outcomes
      if (content.outcome) textParts.push(`Outcome: ${content.outcome}`);
      if (content.message) textParts.push(`Message: ${content.message}`);
      if (content.summary) textParts.push(`Summary: ${content.summary}`);
      
      // Add any metrics
      if (content.metrics && typeof content.metrics === 'object') {
        textParts.push(`Metrics: ${JSON.stringify(content.metrics)}`);
      }
      
      return textParts.join('\n');
    }
    
    // For string content, return as is
    return String(content);
  }

  /**
   * Generate a unique ID for a memory
   * 
   * @returns {string} Generated ID
   * @private
   */
  _generateId() {
    return crypto.randomUUID();
  }

  /**
   * Store a memory in Redis (short-term memory)
   * 
   * @param {Object} memory - Memory to store
   * @returns {Promise<void>}
   * @private
   */
  async _storeInRedis(memory) {
    if (!this.redisClient) {
      return;
    }
    
    const redisKey = `memory:${memory.id}`;
    const expirySeconds = this.config.redis.ttl;
    
    // Store the memory
    await this.redisClient.set(redisKey, JSON.stringify(memory), 'EX', expirySeconds);
    
    // Store indices for faster retrieval
    await this._updateRedisIndices(memory);
  }

  /**
   * Update Redis indices for faster retrieval
   * 
   * @param {Object} memory - Memory to index
   * @returns {Promise<void>}
   * @private
   */
  async _updateRedisIndices(memory) {
    if (!this.redisClient) {
      return;
    }
    
    // Add to agent index
    if (memory.agentId) {
      await this.redisClient.sadd(`agent:${memory.agentId}`, memory.id);
    }
    
    // Add to type index
    if (memory.type) {
      await this.redisClient.sadd(`type:${memory.type}`, memory.id);
    }
    
    // Add to tag indices
    if (Array.isArray(memory.tags)) {
      for (const tag of memory.tags) {
        await this.redisClient.sadd(`tag:${tag}`, memory.id);
      }
    }
  }

  /**
   * Retrieve memories from Redis based on query
   * 
   * @param {Object} query - Query parameters
   * @returns {Promise<Array<Object>>} Retrieved memories
   * @private
   */
  async _retrieveFromRedis(query) {
    if (!this.redisClient) {
      return [];
    }
    
    // Build candidate set keys based on query
    const candidateSets = [];
    
    if (query.agentId) {
      candidateSets.push(`agent:${query.agentId}`);
    }
    
    if (query.type) {
      candidateSets.push(`type:${query.type}`);
    }
    
    if (Array.isArray(query.tags) && query.tags.length > 0) {
      for (const tag of query.tags) {
        candidateSets.push(`tag:${tag}`);
      }
    }
    
    // If no specific filters, return empty (don't retrieve all memories)
    if (candidateSets.length === 0) {
      return [];
    }
    
    // Intersect the candidate sets to get matching memory IDs
    let memoryIds;
    if (candidateSets.length === 1) {
      memoryIds = await this.redisClient.smembers(candidateSets[0]);
    } else {
      const tempSetKey = `temp:${crypto.randomUUID()}`;
      await this.redisClient.sinterstore(tempSetKey, ...candidateSets);
      memoryIds = await this.redisClient.smembers(tempSetKey);
      await this.redisClient.del(tempSetKey);
    }
    
    // Retrieve the actual memories
    const memories = [];
    for (const memoryId of memoryIds) {
      const data = await this.redisClient.get(`memory:${memoryId}`);
      if (data) {
        memories.push(JSON.parse(data));
      }
    }
    
    return memories;
  }

  /**
   * Ensure required tables exist in Neon DB
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _ensureTablesExist() {
    if (!this.neonClient) {
      return;
    }
    
    // Create memories table if it doesn't exist
    await this.neonClient.query(`
      CREATE TABLE IF NOT EXISTS ${this.config.neon.tableName} (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content JSONB NOT NULL,
        tags TEXT[] DEFAULT '{}',
        embedding FLOAT[] DEFAULT NULL,
        access_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        long_term BOOLEAN DEFAULT FALSE,
        relevance_score FLOAT DEFAULT 0
      )
    `);
    
    // Create indices for faster retrieval
    await this.neonClient.query(`
      CREATE INDEX IF NOT EXISTS idx_${this.config.neon.tableName}_agent_id 
      ON ${this.config.neon.tableName}(agent_id)
    `);
    
    await this.neonClient.query(`
      CREATE INDEX IF NOT EXISTS idx_${this.config.neon.tableName}_type 
      ON ${this.config.neon.tableName}(type)
    `);
    
    await this.neonClient.query(`
      CREATE INDEX IF NOT EXISTS idx_${this.config.neon.tableName}_tags 
      ON ${this.config.neon.tableName} USING GIN(tags)
    `);
    
    // Create vector index if extension is available
    try {
      await this.neonClient.query(`CREATE EXTENSION IF NOT EXISTS vector`);
      
      // Add vector column if not exists
      const result = await this.neonClient.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${this.config.neon.tableName}' 
        AND column_name = 'embedding_vector'
      `);
      
      if (result.rows.length === 0) {
        await this.neonClient.query(`
          ALTER TABLE ${this.config.neon.tableName} 
          ADD COLUMN IF NOT EXISTS embedding_vector vector(1536)
        `);
        
        await this.neonClient.query(`
          CREATE INDEX IF NOT EXISTS idx_${this.config.neon.tableName}_embedding 
          ON ${this.config.neon.tableName} USING ivfflat (embedding_vector vector_cosine_ops)
        `);
      }
      
      logger.info('Vector search enabled for semantic memory retrieval');
    } catch (error) {
      logger.warn(`Vector search not available: ${error.message}`);
    }
  }

  /**
   * Store a memory in Neon DB (long-term memory)
   * 
   * @param {Object} memory - Memory to store
   * @returns {Promise<void>}
   * @private
   */
  async _storeInNeon(memory) {
    if (!this.neonClient) {
      return;
    }
    
    // Format the memory for Neon DB
    const dbMemory = {
      id: memory.id,
      agent_id: memory.agentId,
      type: memory.type,
      content: JSON.stringify(memory.content),
      tags: Array.isArray(memory.tags) ? memory.tags : [],
      embedding: memory.embedding,
      access_count: memory.accessCount || 0,
      created_at: memory.createdAt || new Date().toISOString(),
      last_accessed: memory.lastAccessed,
      long_term: true,
      relevance_score: memory.relevanceScore || 0
    };
    
    // Check if memory already exists
    const existing = await this.neonClient.query(
      `SELECT id FROM ${this.config.neon.tableName} WHERE id = $1`,
      [memory.id]
    );
    
    if (existing.rows.length > 0) {
      // Update existing memory
      await this._updateInNeon(memory);
    } else {
      // Insert new memory
      await this.neonClient.query(`
        INSERT INTO ${this.config.neon.tableName} (
          id, agent_id, type, content, tags, embedding, 
          access_count, created_at, last_accessed, long_term, relevance_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        dbMemory.id,
        dbMemory.agent_id,
        dbMemory.type,
        dbMemory.content,
        dbMemory.tags,
        dbMemory.embedding,
        dbMemory.access_count,
        dbMemory.created_at,
        dbMemory.last_accessed,
        dbMemory.long_term,
        dbMemory.relevance_score
      ]);
      
      // Update vector embedding if available
      if (dbMemory.embedding) {
        try {
          await this.neonClient.query(`
            UPDATE ${this.config.neon.tableName}
            SET embedding_vector = $1
            WHERE id = $2
          `, [dbMemory.embedding, dbMemory.id]);
        } catch (error) {
          logger.warn(`Failed to update vector embedding: ${error.message}`);
        }
      }
    }
  }

  /**
   * Update a memory in Neon DB
   * 
   * @param {Object} memory - Memory to update
   * @returns {Promise<void>}
   * @private
   */
  async _updateInNeon(memory) {
    if (!this.neonClient) {
      return;
    }
    
    await this.neonClient.query(`
      UPDATE ${this.config.neon.tableName}
      SET 
        content = $1,
        tags = $2,
        access_count = $3,
        last_accessed = $4,
        long_term = $5,
        relevance_score = $6
      WHERE id = $7
    `, [
      JSON.stringify(memory.content),
      Array.isArray(memory.tags) ? memory.tags : [],
      memory.accessCount || 0,
      memory.lastAccessed || null,
      true,
      memory.relevanceScore || 0,
      memory.id
    ]);
    
    // Update vector embedding if available
    if (memory.embedding) {
      try {
        await this.neonClient.query(`
          UPDATE ${this.config.neon.tableName}
          SET embedding_vector = $1
          WHERE id = $2
        `, [memory.embedding, memory.id]);
      } catch (error) {
        logger.warn(`Failed to update vector embedding: ${error.message}`);
      }
    }
  }

  /**
   * Retrieve memories from Neon DB based on query
   * 
   * @param {Object} query - Query parameters
   * @returns {Promise<Array<Object>>} Retrieved memories
   * @private
   */
  async _retrieveFromNeon(query) {
    if (!this.neonClient) {
      return [];
    }
    
    // Build query conditions
    const conditions = ['long_term = true'];
    const params = [];
    let paramIndex = 1;
    
    if (query.agentId) {
      conditions.push(`agent_id = $${paramIndex}`);
      params.push(query.agentId);
      paramIndex++;
    }
    
    if (query.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(query.type);
      paramIndex++;
    }
    
    if (Array.isArray(query.tags) && query.tags.length > 0) {
      conditions.push(`tags && $${paramIndex}`);
      params.push(query.tags);
      paramIndex++;
    }
    
    // Build the SQL query
    let sql = `
      SELECT * FROM ${this.config.neon.tableName}
      WHERE ${conditions.join(' AND ')}
    `;
    
    // Add semantic search if provided
    if (query.semanticQuery && query.semanticQuery.embedding) {
      try {
        // Add vector similarity search
        sql = `
          SELECT *, 
            1 - (embedding_vector <=> $${paramIndex}) as similarity
          FROM ${this.config.neon.tableName}
          WHERE ${conditions.join(' AND ')}
          AND embedding_vector IS NOT NULL
          AND 1 - (embedding_vector <=> $${paramIndex}) > $${paramIndex + 1}
          ORDER BY similarity DESC
        `;
        
        params.push(query.semanticQuery.embedding);
        params.push(query.semanticQuery.threshold || 0.7);
        
      } catch (error) {
        logger.warn(`Vector search failed, falling back to regular search: ${error.message}`);
      }
    } else {
      // Order by recency and access count if not doing semantic search
      sql += ` ORDER BY last_accessed DESC NULLS LAST, access_count DESC`;
    }
    
    // Add limit
    const limit = query.limit || 10;
    sql += ` LIMIT ${limit}`;
    
    // Execute the query
    const result = await this.neonClient.query(sql, params);
    
    // Format the results
    return result.rows.map(row => ({
      id: row.id,
      agentId: row.agent_id,
      type: row.type,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      tags: row.tags || [],
      embedding: row.embedding,
      accessCount: row.access_count,
      createdAt: row.created_at,
      lastAccessed: row.last_accessed,
      longTerm: row.long_term,
      relevanceScore: row.relevance_score,
      similarity: row.similarity
    }));
  }

  /**
   * Sort memories by relevance and recency
   * 
   * @param {Array<Object>} memories - Memories to sort
   * @param {Object} query - Query parameters
   * @returns {Array<Object>} Sorted memories
   * @private
   */
  _sortMemoriesByRelevance(memories, query) {
    // If doing semantic search, items already have similarity scores
    if (query.semanticQuery) {
      return memories.sort((a, b) => {
        // First priority: similarity score if available
        if (a.similarity !== undefined && b.similarity !== undefined) {
          return b.similarity - a.similarity;
        }
        
        // Next priority: relevance score
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Next priority: access count (popular memories)
        if (a.accessCount !== b.accessCount) {
          return b.accessCount - a.accessCount;
        }
        
        // Final priority: recency
        const aDate = a.lastAccessed || a.createdAt;
        const bDate = b.lastAccessed || b.createdAt;
        return new Date(bDate) - new Date(aDate);
      });
    }
    
    // Default sorting by prioritized tags, then recency and access count
    return memories.sort((a, b) => {
      // First priority: prioritized tags match
      const aPriorityScore = this._calculateTagPriorityScore(a, query.prioritizeTags || []);
      const bPriorityScore = this._calculateTagPriorityScore(b, query.prioritizeTags || []);
      
      if (aPriorityScore !== bPriorityScore) {
        return bPriorityScore - aPriorityScore;
      }
      
      // Second priority: relevance score
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Third priority: access count (popular memories)
      if (a.accessCount !== b.accessCount) {
        return b.accessCount - a.accessCount;
      }
      
      // Final priority: recency
      const aDate = a.lastAccessed || a.createdAt;
      const bDate = b.lastAccessed || b.createdAt;
      return new Date(bDate) - new Date(aDate);
    });
  }

  /**
   * Calculate tag priority score for a memory
   * 
   * @param {Object} memory - Memory to calculate score for
   * @param {Array<string>} priorityTags - Tags to prioritize
   * @returns {number} Priority score
   * @private
   */
  _calculateTagPriorityScore(memory, priorityTags) {
    if (!Array.isArray(memory.tags) || !Array.isArray(priorityTags)) {
      return 0;
    }
    
    let score = 0;
    for (const tag of memory.tags) {
      const priorityIndex = priorityTags.indexOf(tag);
      if (priorityIndex !== -1) {
        // Higher priority tags (earlier in the list) get higher scores
        score += priorityTags.length - priorityIndex;
      }
    }
    
    return score;
  }

  /**
   * Close connections to memory storage systems
   * 
   * @returns {Promise<void>}
   */
  async close() {
    if (this.neonClient) {
      await this.neonClient.end();
      this.neonClient = null;
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
    
    this.isConnected = false;
    logger.info('Memory manager connections closed');
  }
  
  /**
   * Perform memory maintenance tasks (cleanup, consolidation)
   * 
   * @returns {Promise<Object>} Maintenance results
   */
  async performMaintenance() {
    logger.info('Starting memory maintenance');
    
    const results = {
      shortTermPromoted: 0,
      shortTermExpired: 0,
      longTermConsolidated: 0
    };
    
    // Process short-term memories
    if (this.redisClient) {
      // Get all memory IDs in Redis
      const keys = await this.redisClient.keys('memory:*');
      
      for (const key of keys) {
        const memoryId = key.replace('memory:', '');
        const data = await this.redisClient.get(key);
        
        if (data) {
          const memory = JSON.parse(data);
          
          // Check if memory should be promoted to long-term
          if (memory.accessCount >= this.config.longTermThreshold && !memory.longTerm) {
            memory.longTerm = true;
            
            // Store in Neon DB
            if (this.neonClient) {
              await this._storeInNeon(memory);
              results.shortTermPromoted++;
              
              // Delete from Redis (optional - keep for faster access)
              // await this.redisClient.del(key);
            }
          }
        }
      }
    }
    
    // Consolidate similar long-term memories
    if (this.neonClient && this.embeddingProvider) {
      // Not implemented in this version - requires clustering algorithm
      // This would find similar memories and consolidate them
    }
    
    logger.info(`Memory maintenance completed: ${JSON.stringify(results)}`);
    return results;
  }
}

module.exports = EnhancedMemoryManager;