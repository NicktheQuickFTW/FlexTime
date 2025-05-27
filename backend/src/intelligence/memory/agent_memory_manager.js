/**
 * Agent Memory Manager for the FlexTime multi-agent system.
 * 
 * This module implements the memory system for agents to store and retrieve
 * experiences, knowledge, and learning outcomes.
 * 
 * Note: Migrated from MongoDB to Neon PostgreSQL for better reliability and integration.
 */

const { Pool } = require('pg');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Mock memory storage for when database is disabled
let mockMemories = [];

/**
 * Memory manager for agent memories and experiences.
 */
class AgentMemoryManager {
  /**
   * Initialize a new Agent Memory Manager.
   * 
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      neonDB: {
        connectionString: process.env.NEON_DB_CONNECTION_STRING || '',
        ...config.neonDB
      },
      ...config
    };
    
    this.connected = false;
    this.pool = null;
    this.useMockDatabase = process.env.DISABLE_DATABASE === 'true';
    
    if (this.useMockDatabase) {
      logger.info('Agent Memory Manager initialized with mock database (DB disabled)');
      // Initialize with mock connected state when database is disabled
      this.connected = true;
    } else {
      logger.info('Agent Memory Manager initialized with Neon DB support');
    }
  }
  
  /**
   * Connect to Neon PostgreSQL database.
   * 
   * @returns {Promise<boolean>} Whether connection was successful
   */
  async connect() {
    if (this.connected) {
      return true;
    }
    
    // If database is disabled, use mock implementation
    if (this.useMockDatabase) {
      this.connected = true;
      logger.info('Using mock database implementation (DB disabled)');
      return true;
    }
    
    try {
      // Connect to Neon PostgreSQL
      this.pool = new Pool({
        connectionString: this.config.neonDB.connectionString || process.env.NEON_DB_CONNECTION_STRING,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      // Test connection
      await this.pool.query('SELECT NOW()');
      
      // Ensure tables exist
      await this._ensureTablesExist();
      
      this.connected = true;
      logger.info('Successfully connected to Neon PostgreSQL database');
      return true;
    } catch (error) {
      // If connection fails but database is disabled flag is true, use mock implementation
      if (process.env.DISABLE_DATABASE === 'true') {
        this.useMockDatabase = true;
        this.connected = true;
        logger.info('Connection failed but using mock database (DB disabled)');
        return true;
      }
      
      logger.error(`Failed to connect to Neon PostgreSQL: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Ensure required database tables exist.
   * 
   * @private
   */
  async _ensureTablesExist() {
    // Create agent_memories table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS agent_memories (
        id UUID PRIMARY KEY,
        agent_id TEXT,
        type TEXT NOT NULL,
        content JSONB NOT NULL,
        metadata JSONB,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_id ON agent_memories(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON agent_memories(type);
      CREATE INDEX IF NOT EXISTS idx_agent_memories_tags ON agent_memories USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_agent_memories_metadata ON agent_memories USING GIN(metadata);
    `);
    
    logger.info('Agent memory tables verified');
  }
  
  /**
   * Store a memory in the database.
   * 
   * @param {object} memory - Memory to store
   * @param {string} memory.type - Type of memory (e.g., 'experience', 'knowledge', 'feedback')
   * @param {object} memory.content - Memory content
   * @param {object} memory.metadata - Additional metadata
   * @param {Array<string>} memory.tags - Tags for categorization
   * @returns {Promise<string>} ID of the stored memory
   */
  async storeMemory(memory) {
    if (!this.connected) {
      await this.connect();
    }
    
    try {
      const id = memory.id || uuidv4();
      const agentId = memory.agentId || memory.metadata?.agentId || null;
      const tags = memory.tags || [];
      
      // Use mock implementation if database is disabled
      if (this.useMockDatabase) {
        const now = new Date();
        mockMemories.push({
          id,
          agent_id: agentId,
          type: memory.type,
          content: memory.content,
          metadata: memory.metadata || {},
          tags,
          created_at: now,
          updated_at: now
        });
        
        logger.info(`[Mock DB] Stored memory of type ${memory.type} with ID ${id}`);
        return id;
      }
      
      // Insert the memory into real database
      await this.pool.query(
        `INSERT INTO agent_memories(
          id, agent_id, type, content, metadata, tags, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          id,
          agentId,
          memory.type,
          JSON.stringify(memory.content),
          JSON.stringify(memory.metadata || {}),
          tags
        ]
      );
      
      logger.info(`Stored memory of type ${memory.type} with ID ${id}`);
      return id;
    } catch (error) {
      logger.error(`Failed to store memory: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Retrieve memories from the database.
   * 
   * @param {object} query - Query parameters
   * @param {string} query.type - Type of memory to retrieve
   * @param {object} query.metadata - Metadata filters
   * @param {Array<string>} query.tags - Tags to filter by
   * @param {object} query.sort - Sort options
   * @param {number} query.limit - Maximum number of memories to retrieve
   * @returns {Promise<Array<object>>} Retrieved memories
   */
  async retrieveMemories(query = {}) {
    if (!this.connected) {
      await this.connect();
    }
    
    try {
      // Use mock implementation if database is disabled
      if (this.useMockDatabase) {
        let filteredMemories = [...mockMemories];
        
        // Apply filters
        if (query.type) {
          filteredMemories = filteredMemories.filter(m => m.type === query.type);
        }
        
        if (query.agentId) {
          filteredMemories = filteredMemories.filter(m => m.agent_id === query.agentId);
        }
        
        // Apply metadata filters
        if (query.metadata && Object.keys(query.metadata).length > 0) {
          filteredMemories = filteredMemories.filter(m => {
            return Object.entries(query.metadata).every(([key, value]) => 
              m.metadata[key] === value
            );
          });
        }
        
        // Apply tags filter
        if (query.tags && query.tags.length > 0) {
          filteredMemories = filteredMemories.filter(m => {
            return query.tags.every(tag => m.tags.includes(tag));
          });
        }
        
        // Apply sorting
        if (query.sort) {
          const sortEntries = Object.entries(query.sort);
          filteredMemories.sort((a, b) => {
            for (const [field, direction] of sortEntries) {
              let valueA, valueB;
              
              // Map field names to match PostgreSQL equivalents
              if (field === 'timestamp') {
                valueA = a.created_at;
                valueB = b.created_at;
              } else if (field === 'updatedAt') {
                valueA = a.updated_at;
                valueB = b.updated_at;
              } else if (field === 'score') {
                valueA = a.metadata.score;
                valueB = b.metadata.score;
              } else {
                valueA = a.metadata[field];
                valueB = b.metadata[field];
              }
              
              if (valueA !== valueB) {
                return direction === -1 ? 
                  (valueB > valueA ? 1 : -1) : 
                  (valueA > valueB ? 1 : -1);
              }
            }
            return 0;
          });
        } else {
          // Default sort by created_at DESC
          filteredMemories.sort((a, b) => b.created_at - a.created_at);
        }
        
        // Apply limit
        if (query.limit) {
          filteredMemories = filteredMemories.slice(0, query.limit);
        }
        
        // Format the memories to match database output format
        const memories = filteredMemories.map(m => ({
          id: m.id,
          agentId: m.agent_id,
          type: m.type,
          content: m.content,
          metadata: m.metadata,
          tags: m.tags,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        }));
        
        logger.info(`[Mock DB] Retrieved ${memories.length} memories for query`);
        return memories;
      }
      
      // Real database implementation
      // Build query conditions
      const conditions = [];
      const params = [];
      
      if (query.type) {
        conditions.push(`type = $${params.length + 1}`);
        params.push(query.type);
      }
      
      if (query.agentId) {
        conditions.push(`agent_id = $${params.length + 1}`);
        params.push(query.agentId);
      }
      
      // Handle metadata filters
      if (query.metadata && Object.keys(query.metadata).length > 0) {
        for (const [key, value] of Object.entries(query.metadata)) {
          conditions.push(`metadata->>'${key}' = $${params.length + 1}`);
          params.push(value);
        }
      }
      
      // Handle tags filter
      if (query.tags && query.tags.length > 0) {
        conditions.push(`tags @> $${params.length + 1}`);
        params.push(query.tags);
      }
      
      // Build WHERE clause
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';
      
      // Build ORDER BY clause
      let orderByClause = 'ORDER BY created_at DESC';
      if (query.sort) {
        const sortFields = [];
        for (const [field, direction] of Object.entries(query.sort)) {
          // Map a common set of sort fields to their PostgreSQL equivalents
          const mappedField = 
            field === 'timestamp' ? 'created_at' :
            field === 'updatedAt' ? 'updated_at' :
            field === 'score' ? "metadata->>'score'" : 
            `metadata->>'${field}'`;
          
          sortFields.push(`${mappedField} ${direction === -1 ? 'DESC' : 'ASC'}`);
        }
        
        if (sortFields.length > 0) {
          orderByClause = `ORDER BY ${sortFields.join(', ')}`;
        }
      }
      
      // Build LIMIT clause
      const limitClause = query.limit ? `LIMIT ${query.limit}` : '';
      
      // Execute query
      const sql = `
        SELECT id, agent_id as "agentId", type, content, metadata, tags, 
               created_at as "createdAt", updated_at as "updatedAt"
        FROM agent_memories
        ${whereClause}
        ${orderByClause}
        ${limitClause}
      `;
      
      const result = await this.pool.query(sql, params);
      const memories = result.rows.map(row => ({
        id: row.id,
        agentId: row.agentId,
        type: row.type,
        content: row.content,
        metadata: row.metadata,
        tags: row.tags,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
      
      logger.info(`Retrieved ${memories.length} memories for query`);
      return memories;
    } catch (error) {
      logger.error(`Failed to retrieve memories: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Update a memory in the database.
   * 
   * @param {string} id - ID of the memory to update
   * @param {object} updates - Properties to update
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  async updateMemory(id, updates) {
    if (!this.connected) {
      await this.connect();
    }
    
    try {
      // Use mock implementation if database is disabled
      if (this.useMockDatabase) {
        const memoryIndex = mockMemories.findIndex(m => m.id === id);
        
        if (memoryIndex === -1) {
          logger.warn(`[Mock DB] Memory with ID ${id} not found for update`);
          return false;
        }
        
        // Update memory fields
        if (updates.content) {
          mockMemories[memoryIndex].content = updates.content;
        }
        
        if (updates.metadata) {
          mockMemories[memoryIndex].metadata = updates.metadata;
        }
        
        if (updates.tags) {
          mockMemories[memoryIndex].tags = updates.tags;
        }
        
        // Always update updated_at
        mockMemories[memoryIndex].updated_at = new Date();
        
        logger.info(`[Mock DB] Updated memory with ID ${id}`);
        return true;
      }
      
      // Real database implementation
      const setFields = [];
      const params = [id];
      let paramCount = 1;
      
      // Build SET clause for updatable fields
      if (updates.content) {
        setFields.push(`content = $${++paramCount}`);
        params.push(JSON.stringify(updates.content));
      }
      
      if (updates.metadata) {
        setFields.push(`metadata = $${++paramCount}`);
        params.push(JSON.stringify(updates.metadata));
      }
      
      if (updates.tags) {
        setFields.push(`tags = $${++paramCount}`);
        params.push(updates.tags);
      }
      
      // Always update the updated_at timestamp
      setFields.push(`updated_at = NOW()`);
      
      if (setFields.length === 0) {
        logger.warn('No fields to update');
        return false;
      }
      
      // Execute update
      const sql = `
        UPDATE agent_memories
        SET ${setFields.join(', ')}
        WHERE id = $1
      `;
      
      const result = await this.pool.query(sql, params);
      
      if (result.rowCount === 0) {
        logger.warn(`Memory with ID ${id} not found for update`);
        return false;
      }
      
      logger.info(`Updated memory with ID ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Delete a memory from the database.
   * 
   * @param {string} id - ID of the memory to delete
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  async deleteMemory(id) {
    if (!this.connected) {
      await this.connect();
    }
    
    try {
      // Use mock implementation if database is disabled
      if (this.useMockDatabase) {
        const initialLength = mockMemories.length;
        mockMemories = mockMemories.filter(m => m.id !== id);
        
        if (mockMemories.length === initialLength) {
          logger.warn(`[Mock DB] Memory with ID ${id} not found for deletion`);
          return false;
        }
        
        logger.info(`[Mock DB] Deleted memory with ID ${id}`);
        return true;
      }
      
      // Real database implementation
      const result = await this.pool.query(
        'DELETE FROM agent_memories WHERE id = $1',
        [id]
      );
      
      if (result.rowCount === 0) {
        logger.warn(`Memory with ID ${id} not found for deletion`);
        return false;
      }
      
      logger.info(`Deleted memory with ID ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Helper method to store knowledge with standard format.
   * 
   * @param {object} knowledge - Knowledge to store
   * @param {string} knowledge.domain - Knowledge domain
   * @param {string} knowledge.key - Unique key for this knowledge
   * @param {object} knowledge.content - Knowledge content
   * @param {Array<string>} knowledge.tags - Tags for categorization
   * @returns {Promise<string>} ID of the stored knowledge
   */
  async storeKnowledge(knowledge) {
    return this.storeMemory({
      type: 'knowledge',
      content: knowledge.content,
      metadata: {
        domain: knowledge.domain,
        key: knowledge.key
      },
      tags: knowledge.tags || []
    });
  }
  
  /**
   * Helper method to store feedback in standard format.
   * 
   * @param {object} feedback - Feedback to store
   * @param {string} feedback.agentId - ID of the agent
   * @param {string} feedback.taskId - ID of the task
   * @param {number} feedback.rating - Numeric rating (1-5)
   * @param {string} feedback.comment - Feedback comment
   * @returns {Promise<string>} ID of the stored feedback
   */
  async storeFeedback(feedback) {
    return this.storeMemory({
      type: 'feedback',
      agentId: feedback.agentId,
      content: {
        taskId: feedback.taskId,
        rating: feedback.rating,
        comment: feedback.comment,
        metrics: feedback.metrics || {}
      },
      metadata: {
        rating: feedback.rating,
        taskId: feedback.taskId
      },
      tags: ['feedback']
    });
  }
  
  /**
   * Close the database connection.
   * 
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.useMockDatabase) {
      this.connected = false;
      logger.info('[Mock DB] Disconnected from mock database');
      return;
    }
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
      logger.info('Disconnected from Neon PostgreSQL database');
    }
  }
}

module.exports = AgentMemoryManager;
