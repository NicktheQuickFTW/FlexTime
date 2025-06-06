/**
 * Semantic Enricher for Knowledge Graph
 * 
 * This module provides semantic enrichment capabilities for knowledge graph entities,
 * using FlexTime AI to add contextual information and relationships.
 */

const logger = require('../scripts/logger");

/**
 * Semantic Enricher class
 * Enhances knowledge graph entities with semantic information
 */
class SemanticEnricher {
  /**
   * Create a new Semantic Enricher
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enabled: process.env.ENABLE_KNOWLEDGE_ENRICHMENT !== 'false',
      embeddingModel: process.env.ENRICHMENT_EMBEDDING_MODEL || 'default',
      ...config
    };
    
    this.flexTimeClient = null;
    this.entityEmbeddings = new Map();
    
    logger.info(`Semantic Enricher initialized (enabled: ${this.config.enabled})`);
  }
  
  /**
   * Initialize the semantic enricher
   * 
   * @param {Object} flexTimeClient - FlexTime AI client instance
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(flexTimeClient) {
    try {
      if (!this.config.enabled) {
        logger.info('Semantic Enricher is disabled, skipping initialization');
        return false;
      }
      
      logger.info('Initializing Semantic Enricher');
      
      // Store FlexTime AI client
      this.flexTimeClient = flexTimeClient;
      
      // Check if FlexTime AI client is available
      if (!this.flexTimeClient || !this.flexTimeClient.enabled) {
        logger.warn('FlexTime AI client is not available, semantic enrichment will be limited');
        this.config.enabled = false;
        return false;
      }
      
      logger.info('Semantic Enricher initialization complete');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Semantic Enricher: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Enrich an entity with semantic information
   * 
   * @param {string} entityType - Type of entity
   * @param {Object} entityData - Entity data to enrich
   * @returns {Promise<Object>} Enriched entity data
   */
  async enrichEntity(entityType, entityData) {
    try {
      if (!this.config.enabled || !this.flexTimeClient || !this.flexTimeClient.enabled) {
        return entityData;
      }
      
      logger.debug(`Enriching ${entityType} entity: ${entityData.id || entityData.name}`);
      
      // Create a copy of the entity data for enrichment
      const enrichedData = { ...entityData };
      
      // Apply entity-type-specific enrichment
      switch (entityType) {
        case 'team':
          await this._enrichTeam(enrichedData);
          break;
        case 'venue':
          await this._enrichVenue(enrichedData);
          break;
        case 'constraint':
          await this._enrichConstraint(enrichedData);
          break;
        case 'schedule':
          await this._enrichSchedule(enrichedData);
          break;
        default:
          // No specific enrichment for this entity type
          break;
      }
      
      // Generate embedding for the entity if not already present
      if (!enrichedData.embedding) {
        const embedding = await this._generateEmbedding(entityType, enrichedData);
        
        if (embedding) {
          // Store embedding separately to avoid bloating the graph
          this.entityEmbeddings.set(enrichedData.id, embedding);
          
          // Add embedding flag to entity
          enrichedData.hasEmbedding = true;
        }
      }
      
      return enrichedData;
    } catch (error) {
      logger.error(`Failed to enrich entity: ${error.message}`);
      
      // Return original data on error
      return entityData;
    }
  }
  
  /**
   * Enrich a team entity
   * 
   * @private
   * @param {Object} teamData - Team data to enrich
   * @returns {Promise<void>}
   */
  async _enrichTeam(teamData) {
    try {
      // Skip if name is missing
      if (!teamData.name) {
        return;
      }
      
      // Use FlexTime AI to get additional team information
      const teamInfo = await this.flexTimeClient.processTask({
        task: 'enrich_team_data',
        parameters: {
          teamName: teamData.name,
          sportType: teamData.sportType || 'general'
        }
      });
      
      if (teamInfo && teamInfo.success) {
        // Add additional properties
        if (teamInfo.location && !teamData.location) {
          teamData.location = teamInfo.location;
        }
        
        if (teamInfo.conference && !teamData.conference) {
          teamData.conference = teamInfo.conference;
        }
        
        if (teamInfo.division && !teamData.division) {
          teamData.division = teamInfo.division;
        }
        
        if (teamInfo.mascot && !teamData.mascot) {
          teamData.mascot = teamInfo.mascot;
        }
        
        if (teamInfo.primaryColor && !teamData.primaryColor) {
          teamData.primaryColor = teamInfo.primaryColor;
        }
        
        if (teamInfo.secondaryColor && !teamData.secondaryColor) {
          teamData.secondaryColor = teamInfo.secondaryColor;
        }
        
        // Add metadata about enrichment
        teamData.enriched = true;
        teamData.enrichedAt = new Date().toISOString();
        teamData.enrichmentSource = 'flextime_ai';
      }
    } catch (error) {
      logger.error(`Failed to enrich team: ${error.message}`);
    }
  }
  
  /**
   * Enrich a venue entity
   * 
   * @private
   * @param {Object} venueData - Venue data to enrich
   * @returns {Promise<void>}
   */
  async _enrichVenue(venueData) {
    try {
      // Skip if name is missing
      if (!venueData.name) {
        return;
      }
      
      // Use FlexTime AI to get additional venue information
      const venueInfo = await this.flexTimeClient.processTask({
        task: 'enrich_venue_data',
        parameters: {
          venueName: venueData.name,
          venueLocation: venueData.location || null
        }
      });
      
      if (venueInfo && venueInfo.success) {
        // Add additional properties
        if (venueInfo.capacity && !venueData.capacity) {
          venueData.capacity = venueInfo.capacity;
        }
        
        if (venueInfo.coordinates && !venueData.coordinates) {
          venueData.coordinates = venueInfo.coordinates;
        }
        
        if (venueInfo.openingYear && !venueData.openingYear) {
          venueData.openingYear = venueInfo.openingYear;
        }
        
        if (venueInfo.surfaceType && !venueData.surfaceType) {
          venueData.surfaceType = venueInfo.surfaceType;
        }
        
        // Add metadata about enrichment
        venueData.enriched = true;
        venueData.enrichedAt = new Date().toISOString();
        venueData.enrichmentSource = 'flextime_ai';
      }
    } catch (error) {
      logger.error(`Failed to enrich venue: ${error.message}`);
    }
  }
  
  /**
   * Enrich a constraint entity
   * 
   * @private
   * @param {Object} constraintData - Constraint data to enrich
   * @returns {Promise<void>}
   */
  async _enrichConstraint(constraintData) {
    try {
      // Skip if type is missing
      if (!constraintData.type) {
        return;
      }
      
      // Use FlexTime AI to enhance constraint information
      const constraintInfo = await this.flexTimeClient.processTask({
        task: 'analyze_constraint',
        parameters: {
          constraintType: constraintData.type,
          constraintData: constraintData
        }
      });
      
      if (constraintInfo && constraintInfo.success) {
        // Add impact assessment
        if (constraintInfo.impact) {
          constraintData.impact = constraintInfo.impact;
        }
        
        // Add difficulty rating
        if (constraintInfo.difficulty) {
          constraintData.difficulty = constraintInfo.difficulty;
        }
        
        // Add related constraints
        if (constraintInfo.relatedConstraints) {
          constraintData.relatedConstraints = constraintInfo.relatedConstraints;
        }
        
        // Add metadata about enrichment
        constraintData.enriched = true;
        constraintData.enrichedAt = new Date().toISOString();
        constraintData.enrichmentSource = 'flextime_ai';
      }
    } catch (error) {
      logger.error(`Failed to enrich constraint: ${error.message}`);
    }
  }
  
  /**
   * Enrich a schedule entity
   * 
   * @private
   * @param {Object} scheduleData - Schedule data to enrich
   * @returns {Promise<void>}
   */
  async _enrichSchedule(scheduleData) {
    try {
      // Skip if sportType is missing
      if (!scheduleData.sportType) {
        return;
      }
      
      // Use FlexTime AI to get sport-specific schedule guidelines
      const scheduleInfo = await this.flexTimeClient.processTask({
        task: 'get_sport_schedule_guidelines',
        parameters: {
          sportType: scheduleData.sportType,
          season: scheduleData.season || null
        }
      });
      
      if (scheduleInfo && scheduleInfo.success) {
        // Add additional metadata
        if (scheduleInfo.guidelines) {
          scheduleData.guidelines = scheduleInfo.guidelines;
        }
        
        if (scheduleInfo.bestPractices) {
          scheduleData.bestPractices = scheduleInfo.bestPractices;
        }
        
        if (scheduleInfo.typicalDuration) {
          scheduleData.typicalGameDuration = scheduleInfo.typicalDuration;
        }
        
        // Add metadata about enrichment
        scheduleData.enriched = true;
        scheduleData.enrichedAt = new Date().toISOString();
        scheduleData.enrichmentSource = 'flextime_ai';
      }
    } catch (error) {
      logger.error(`Failed to enrich schedule: ${error.message}`);
    }
  }
  
  /**
   * Generate an embedding for an entity
   * 
   * @private
   * @param {string} entityType - Type of entity
   * @param {Object} entityData - Entity data
   * @returns {Promise<Array<number>|null>} Embedding vector or null if failed
   */
  async _generateEmbedding(entityType, entityData) {
    try {
      if (!this.flexTimeClient || !this.flexTimeClient.enabled) {
        return null;
      }
      
      // Create text representation of entity
      let text = '';
      
      switch (entityType) {
        case 'team':
          text = `Team: ${entityData.name || 'Unknown'} Sport: ${entityData.sportType || 'Unknown'} `;
          if (entityData.location) text += `Location: ${entityData.location} `;
          if (entityData.conference) text += `Conference: ${entityData.conference} `;
          if (entityData.division) text += `Division: ${entityData.division}`;
          break;
          
        case 'venue':
          text = `Venue: ${entityData.name || 'Unknown'} `;
          if (entityData.location) text += `Location: ${entityData.location} `;
          if (entityData.capacity) text += `Capacity: ${entityData.capacity} `;
          if (entityData.surfaceType) text += `Surface: ${entityData.surfaceType}`;
          break;
          
        case 'constraint':
          text = `Constraint: ${entityData.type || 'Unknown'} `;
          if (entityData.description) text += `Description: ${entityData.description} `;
          if (entityData.priority) text += `Priority: ${entityData.priority}`;
          break;
          
        case 'schedule':
          text = `Schedule: ${entityData.name || 'Unknown'} Sport: ${entityData.sportType || 'Unknown'} `;
          if (entityData.season) text += `Season: ${entityData.season} `;
          if (entityData.guidelines) text += `Guidelines: ${JSON.stringify(entityData.guidelines)}`;
          break;
          
        case 'game':
          text = `Game: ${entityData.id || 'Unknown'} `;
          if (entityData.homeTeamId) text += `Home Team: ${entityData.homeTeamId} `;
          if (entityData.awayTeamId) text += `Away Team: ${entityData.awayTeamId} `;
          if (entityData.date) text += `Date: ${entityData.date} `;
          if (entityData.venueId) text += `Venue: ${entityData.venueId}`;
          break;
          
        default:
          text = `${entityType}: ${JSON.stringify(entityData)}`;
      }
      
      // Generate embedding
      const embeddingResult = await this.flexTimeClient.generateEmbedding({
        text,
        model: this.config.embeddingModel
      });
      
      if (embeddingResult && embeddingResult.success) {
        return embeddingResult.embedding;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to generate embedding: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get an entity embedding
   * 
   * @param {string} entityId - Entity ID
   * @returns {Array<number>|null} Embedding vector or null if not found
   */
  getEntityEmbedding(entityId) {
    return this.entityEmbeddings.get(entityId) || null;
  }
  
  /**
   * Find semantically similar entities
   * 
   * @param {string} entityId - Reference entity ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Similar entities
   */
  async findSimilarEntities(entityId, options = {}) {
    try {
      const {
        entityType = null,
        threshold = 0.7,
        limit = 10
      } = options;
      
      // Get reference embedding
      const refEmbedding = this.entityEmbeddings.get(entityId);
      
      if (!refEmbedding) {
        return [];
      }
      
      // Calculate similarity for all entities with embeddings
      const similarities = [];
      
      for (const [id, embedding] of this.entityEmbeddings.entries()) {
        // Skip self
        if (id === entityId) {
          continue;
        }
        
        // Skip entities of different type if specified
        if (entityType) {
          const entityData = options.entities[id];
          if (!entityData || entityData.type !== entityType) {
            continue;
          }
        }
        
        // Calculate cosine similarity
        const similarity = this._cosineSimilarity(refEmbedding, embedding);
        
        if (similarity >= threshold) {
          similarities.push({ id, similarity });
        }
      }
      
      // Sort by similarity and limit results
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, limit);
    } catch (error) {
      logger.error(`Failed to find similar entities: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * 
   * @private
   * @param {Array<number>} a - First vector
   * @param {Array<number>} b - Second vector
   * @returns {number} Cosine similarity
   */
  _cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }
  
  /**
   * Shutdown the semantic enricher
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down Semantic Enricher');
      
      // Clear embeddings cache
      this.entityEmbeddings.clear();
      
      logger.info('Semantic Enricher shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Semantic Enricher: ${error.message}`);
      return false;
    }
  }
}

module.exports = { SemanticEnricher };
