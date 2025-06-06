/**
 * Enhanced Memory Persistence Agent for FlexTime
 * 
 * This agent improves FlexTime's memory capabilities through:
 * - Vector embedding storage for semantic search
 * - Memory lifecycle management
 * - Improved retrieval accuracy
 * - Contextual relevance scoring
 */

const axios = require('axios');
const logger = require('../scripts/logger");
const MCPConnector = require('../mcp_connector');
// MCP config removed, using default config instead
const mcpConfig = {}; // Empty object as fallback

/**
 * Enhanced Memory Agent with vector embedding capabilities
 */
class EnhancedMemoryAgent {
  /**
   * Initialize a new Enhanced Memory Agent
   * 
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...mcpConfig, ...config };
    this.enabled = this.config.enabled;
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-large';
    this.mcpConnector = new MCPConnector(this.config);
    
    // Vector database connection (using in-memory store for now)
    this.vectorDb = new Map();
    
    // Memory lifecycle configuration
    this.memoryRetentionDays = config.memoryRetentionDays || 365;
    this.importantMemoryBonus = config.importantMemoryBonus || 180; // Additional days for important memories
    this.maxMemoriesPerCategory = config.maxMemoriesPerCategory || 100;
    
    logger.info('Enhanced Memory Agent initialized');
  }

  /**
   * Generate embeddings for text using the configured model
   * 
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Vector embedding
   */
  async generateEmbedding(text) {
    try {
      const response = await this.mcpConnector.getEmbedding(text, this.embeddingModel);
      
      if (response.status === 'success' && response.embedding) {
        return response.embedding;
      } else {
        throw new Error(`Failed to generate embedding: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error(`Embedding generation failed: ${error.message}`);
      
      // Fallback to simple tokenization if embedding fails
      return this.generateFallbackEmbedding(text);
    }
  }
  
  /**
   * Generate a fallback embedding using simple tokenization
   * (Used when the embedding service is unavailable)
   * 
   * @param {string} text - Text to embed
   * @returns {number[]} Basic fallback embedding
   * @private
   */
  generateFallbackEmbedding(text) {
    logger.warn('Using fallback embedding generation');
    
    // Simple fallback tokenization - not for production use
    const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
    const uniqueTokens = [...new Set(tokens)];
    
    // Create a sparse vector representation
    const vector = new Array(1024).fill(0);
    
    uniqueTokens.forEach((token, i) => {
      // Simple hash function to distribute tokens
      const hash = Array.from(token).reduce((h, c) => 
        (h * 31 + c.charCodeAt(0)) % 1024, 0);
      
      vector[hash] = 1;
    });
    
    return vector;
  }
  
  /**
   * Store a memory with vector embedding for later retrieval
   * 
   * @param {object} memory - Memory to store
   * @param {string} memory.content - Main content of the memory
   * @param {string} memory.agentId - ID of the agent creating the memory
   * @param {string[]} memory.tags - Tags for categorizing memory
   * @param {string} memory.importance - Importance level ('low', 'medium', 'high')
   * @returns {Promise<string>} ID of the stored memory
   */
  async storeMemory(memory) {
    if (!this.enabled) {
      logger.warn('Enhanced Memory Agent is disabled');
      return null;
    }
    
    try {
      // Generate a unique ID
      const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate embedding for content
      const embedding = await this.generateEmbedding(memory.content);
      
      // Process importance level
      const importanceScores = { low: 1, medium: 2, high: 3 };
      const importanceScore = importanceScores[memory.importance] || 1;
      
      // Calculate expiration date
      const now = new Date();
      const expirationDays = this.memoryRetentionDays + 
        (importanceScore > 1 ? this.importantMemoryBonus : 0);
      
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + expirationDays);
      
      // Prepare memory object
      const memoryObject = {
        id: memoryId,
        content: memory.content,
        embedding,
        agentId: memory.agentId,
        tags: memory.tags || [],
        importance: memory.importance || 'medium',
        importanceScore,
        createdAt: now.toISOString(),
        expiresAt: expirationDate.toISOString(),
        accessCount: 0,
        lastAccessedAt: now.toISOString()
      };
      
      // Store in vector DB
      this.vectorDb.set(memoryId, memoryObject);
      
      logger.info(`Memory stored with ID: ${memoryId}`);
      
      // Handle memory lifecycle - prune old memories if needed
      await this.pruneMemoriesIfNeeded(memory.tags);
      
      return memoryId;
    } catch (error) {
      logger.error(`Failed to store memory: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Prune old memories if we exceed the maximum per category
   * 
   * @param {string[]} tags - Tags of the newly added memory
   * @private
   */
  async pruneMemoriesIfNeeded(tags = []) {
    if (!tags || tags.length === 0) return;
    
    try {
      // For each tag, check if we need to prune
      for (const tag of tags) {
        // Find all memories with this tag
        const memoriesWithTag = Array.from(this.vectorDb.values())
          .filter(mem => mem.tags.includes(tag));
        
        if (memoriesWithTag.length > this.maxMemoriesPerCategory) {
          logger.info(`Pruning memories for tag: ${tag}, current count: ${memoriesWithTag.length}`);
          
          // Sort by importance (desc) and then by creation date (asc)
          const sortedMemories = memoriesWithTag.sort((a, b) => {
            if (b.importanceScore !== a.importanceScore) {
              return b.importanceScore - a.importanceScore;
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
          });
          
          // Remove excess memories (least important, oldest)
          const memoriesToRemove = sortedMemories.slice(this.maxMemoriesPerCategory);
          
          for (const memory of memoriesToRemove) {
            logger.info(`Pruning memory: ${memory.id}`);
            this.vectorDb.delete(memory.id);
          }
        }
      }
    } catch (error) {
      logger.error(`Error during memory pruning: ${error.message}`);
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * 
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} Similarity score (0-1)
   * @private
   */
  cosineSimilarity(vecA, vecB) {
    try {
      // Calculate dot product
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      
      if (normA === 0 || normB === 0) return 0;
      
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    } catch (error) {
      logger.error(`Error calculating similarity: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Find memories relevant to a query using semantic search
   * 
   * @param {object} options - Search options
   * @param {string} options.query - Text query
   * @param {string[]} options.tags - Tags to filter by
   * @param {string} options.agentId - Agent ID to filter by
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.threshold - Minimum similarity threshold (0-1)
   * @returns {Promise<Array<object>>} Relevant memories
   */
  async findRelevantMemories(options = {}) {
    if (!this.enabled) {
      logger.warn('Enhanced Memory Agent is disabled');
      return [];
    }
    
    const {
      query,
      tags = [],
      agentId,
      limit = 5,
      threshold = 0.7
    } = options;
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Get all memories
      const memories = Array.from(this.vectorDb.values());
      
      // Filter by tags and agentId if specified
      let filteredMemories = memories;
      
      if (tags.length > 0) {
        filteredMemories = filteredMemories.filter(
          mem => tags.some(tag => mem.tags.includes(tag))
        );
      }
      
      if (agentId) {
        filteredMemories = filteredMemories.filter(
          mem => mem.agentId === agentId
        );
      }
      
      // Check for expiration
      const now = new Date();
      filteredMemories = filteredMemories.filter(
        mem => new Date(mem.expiresAt) > now
      );
      
      // Calculate similarity scores
      const scoredMemories = filteredMemories.map(memory => ({
        ...memory,
        similarityScore: this.cosineSimilarity(queryEmbedding, memory.embedding)
      }));
      
      // Filter by threshold and sort by similarity
      const relevantMemories = scoredMemories
        .filter(mem => mem.similarityScore >= threshold)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
      
      // Update access information for retrieved memories
      relevantMemories.forEach(memory => {
        const storedMemory = this.vectorDb.get(memory.id);
        if (storedMemory) {
          storedMemory.accessCount += 1;
          storedMemory.lastAccessedAt = new Date().toISOString();
          this.vectorDb.set(memory.id, storedMemory);
        }
      });
      
      // Return clean memory objects (no embeddings)
      return relevantMemories.map(memory => ({
        id: memory.id,
        content: memory.content,
        agentId: memory.agentId,
        tags: memory.tags,
        importance: memory.importance,
        createdAt: memory.createdAt,
        relevanceScore: memory.similarityScore
      }));
    } catch (error) {
      logger.error(`Failed to find relevant memories: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Update an existing memory
   * 
   * @param {string} memoryId - ID of memory to update
   * @param {object} updates - Updates to apply
   * @returns {Promise<boolean>} Whether update was successful
   */
  async updateMemory(memoryId, updates) {
    if (!this.enabled) {
      logger.warn('Enhanced Memory Agent is disabled');
      return false;
    }
    
    try {
      // Check if memory exists
      if (!this.vectorDb.has(memoryId)) {
        logger.warn(`Memory not found: ${memoryId}`);
        return false;
      }
      
      const memory = this.vectorDb.get(memoryId);
      
      // Apply updates
      const updatedMemory = { ...memory };
      
      if (updates.content) {
        updatedMemory.content = updates.content;
        updatedMemory.embedding = await this.generateEmbedding(updates.content);
      }
      
      if (updates.tags) {
        updatedMemory.tags = updates.tags;
      }
      
      if (updates.importance) {
        const importanceScores = { low: 1, medium: 2, high: 3 };
        updatedMemory.importance = updates.importance;
        updatedMemory.importanceScore = importanceScores[updates.importance] || 1;
        
        // Update expiration date based on new importance
        const now = new Date();
        const expirationDays = this.memoryRetentionDays + 
          (updatedMemory.importanceScore > 1 ? this.importantMemoryBonus : 0);
        
        const expirationDate = new Date(now);
        expirationDate.setDate(now.getDate() + expirationDays);
        updatedMemory.expiresAt = expirationDate.toISOString();
      }
      
      // Store updated memory
      this.vectorDb.set(memoryId, updatedMemory);
      
      logger.info(`Memory updated: ${memoryId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Delete a memory
   * 
   * @param {string} memoryId - ID of memory to delete
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteMemory(memoryId) {
    if (!this.enabled) {
      logger.warn('Enhanced Memory Agent is disabled');
      return false;
    }
    
    try {
      if (!this.vectorDb.has(memoryId)) {
        logger.warn(`Memory not found: ${memoryId}`);
        return false;
      }
      
      this.vectorDb.delete(memoryId);
      
      logger.info(`Memory deleted: ${memoryId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete memory: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Run memory lifecycle maintenance
   * Cleans up expired memories and updates retention based on usage
   * 
   * @returns {Promise<object>} Maintenance results
   */
  async runMaintenanceCycle() {
    if (!this.enabled) {
      logger.warn('Enhanced Memory Agent is disabled');
      return { success: false, reason: 'Agent is disabled' };
    }
    
    try {
      logger.info('Starting memory maintenance cycle');
      
      const now = new Date();
      let expiredCount = 0;
      let retainedCount = 0;
      
      // Process all memories
      for (const [memoryId, memory] of this.vectorDb.entries()) {
        // Check for expiration
        if (new Date(memory.expiresAt) <= now) {
          this.vectorDb.delete(memoryId);
          expiredCount++;
          continue;
        }
        
        // Boost retention for frequently accessed memories
        if (memory.accessCount > 5) {
          const additionalDays = Math.min(memory.accessCount * 2, 90); // Max 90 days bonus
          
          const expirationDate = new Date(memory.expiresAt);
          expirationDate.setDate(expirationDate.getDate() + additionalDays);
          
          memory.expiresAt = expirationDate.toISOString();
          this.vectorDb.set(memoryId, memory);
          retainedCount++;
        }
      }
      
      const result = {
        success: true,
        expiredMemoriesRemoved: expiredCount,
        memoriesRetentionBoosted: retainedCount,
        remainingMemories: this.vectorDb.size,
        timestamp: now.toISOString()
      };
      
      logger.info(`Memory maintenance complete: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Memory maintenance failed: ${error.message}`);
      return { 
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = EnhancedMemoryAgent;
