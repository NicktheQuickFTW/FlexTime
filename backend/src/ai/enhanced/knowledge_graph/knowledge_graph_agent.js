/**
 * Knowledge Graph Agent for FlexTime
 * 
 * This agent provides structured knowledge representation and reasoning capabilities
 * for FlexTime scheduling entities (teams, venues, constraints) and their relationships.
 * It uses graph-based data models to enable complex queries and inferences.
 */

// FlexTime AI client
// const { createFlexTimeClient } = require('../../../utils/flextime_ai_client');
// MCP config removed, using default config instead
const mcpConfig = { agents: { knowledge_graph: {} } }; // Empty config with structure
const logger = require('../scripts/logger");
const { GraphModel } = require('./graph_model');
const { KnowledgeRepository } = require('./knowledge_repository');
const { SemanticEnricher } = require('./semantic_enricher');

/**
 * Knowledge Graph Agent
 * 
 * Manages structured knowledge representation for FlexTime scheduling
 */
class KnowledgeGraphAgent {
  /**
   * Create a new Knowledge Graph Agent
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enabled: true,
      persistGraph: process.env.PERSIST_KNOWLEDGE_GRAPH !== 'false',
      persistPath: process.env.KNOWLEDGE_GRAPH_PATH || './data/knowledge_graph',
      enableContextEnrichment: process.env.ENABLE_KNOWLEDGE_ENRICHMENT !== 'false',
      ...mcpConfig.agents.knowledge_graph,
      ...config
    };
    
    this.graphModel = new GraphModel({
      persist: this.config.persistGraph,
      persistPath: this.config.persistPath
    });
    
    this.repository = new KnowledgeRepository({
      graphModel: this.graphModel
    });
    
    this.semanticEnricher = new SemanticEnricher({
      enabled: this.config.enableContextEnrichment
    });
    
    // FlexTime AI client
    this.flexTimeClient = null;
    
    logger.info(`Knowledge Graph Agent initialized (enabled: ${this.config.enabled})`);
  }
  
  /**
   * Initialize the Knowledge Graph Agent
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (!this.config.enabled) {
        logger.info('Knowledge Graph Agent is disabled, skipping initialization');
        return false;
      }
      
      logger.info('Initializing Knowledge Graph Agent');
      
      // Initialize graph model
      await this.graphModel.initialize();
      
      // Initialize repository
      await this.repository.initialize();
      
      // Initialize semantic enricher
      if (this.config.enableContextEnrichment) {
        await this.semanticEnricher.initialize(this.flexTimeClient);
      }
      
      logger.info('Knowledge Graph Agent initialization complete');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Knowledge Graph Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Add an entity (team, venue, etc.) to the knowledge graph
   * 
   * @param {string} entityType - Type of entity (team, venue, constraint, etc.)
   * @param {Object} entityData - Entity data to add
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Added entity with generated ID
   */
  async addEntity(entityType, entityData, options = {}) {
    try {
      logger.debug(`Adding ${entityType} entity to knowledge graph`);
      
      // Enrich entity data with semantic information if enabled
      let enrichedData = entityData;
      if (this.config.enableContextEnrichment) {
        enrichedData = await this.semanticEnricher.enrichEntity(entityType, entityData);
      }
      
      // Add entity to repository
      const entity = await this.repository.addEntity(entityType, enrichedData, options);
      
      return entity;
    } catch (error) {
      logger.error(`Failed to add ${entityType} entity: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add a relationship between entities in the knowledge graph
   * 
   * @param {string} sourceId - Source entity ID
   * @param {string} relationshipType - Type of relationship
   * @param {string} targetId - Target entity ID
   * @param {Object} properties - Additional relationship properties
   * @returns {Promise<Object>} Added relationship
   */
  async addRelationship(sourceId, relationshipType, targetId, properties = {}) {
    try {
      logger.debug(`Adding relationship ${sourceId} -[${relationshipType}]-> ${targetId}`);
      
      // Add relationship to repository
      const relationship = await this.repository.addRelationship(
        sourceId,
        relationshipType,
        targetId,
        properties
      );
      
      return relationship;
    } catch (error) {
      logger.error(`Failed to add relationship: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Query the knowledge graph
   * 
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async query(query, options = {}) {
    try {
      logger.debug(`Querying knowledge graph: ${JSON.stringify(query)}`);
      
      // Execute query against repository
      const results = await this.repository.query(query, options);
      
      return results;
    } catch (error) {
      logger.error(`Failed to query knowledge graph: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze relationships between scheduling entities
   * 
   * @param {Object} parameters - Analysis parameters
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeRelationships(parameters) {
    try {
      logger.info('Analyzing entity relationships in knowledge graph');
      
      // Use FlexTime AI for enhanced analysis if available
      if (this.flexTimeClient && this.flexTimeClient.enabled) {
        const analysisResults = await this.flexTimeClient.processGraph({
          task: 'analyze_entity_relationships',
          graph: await this.graphModel.export(),
          parameters
        });
        
        if (analysisResults && analysisResults.success) {
          return analysisResults.results;
        }
      }
      
      // Fallback to local analysis
      return this.repository.analyzeRelationships(parameters);
    } catch (error) {
      logger.error(`Failed to analyze relationships: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find scheduling conflicts using knowledge graph analysis
   * 
   * @param {Object} schedule - Schedule to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} Detected conflicts
   */
  async findConflicts(schedule, options = {}) {
    try {
      logger.info(`Finding conflicts in schedule ${schedule.id}`);
      
      // Import schedule into knowledge graph
      await this.importSchedule(schedule);
      
      // Query for conflicts
      const conflicts = await this.repository.findConflicts(schedule.id, options);
      
      return conflicts;
    } catch (error) {
      logger.error(`Failed to find conflicts: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Import a schedule into the knowledge graph
   * 
   * @param {Object} schedule - Schedule to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importSchedule(schedule, options = {}) {
    try {
      logger.info(`Importing schedule ${schedule.id} into knowledge graph`);
      
      // Add schedule entity
      const scheduleEntity = await this.repository.addEntity('schedule', {
        id: schedule.id,
        sportType: schedule.sportType,
        season: schedule.season,
        name: schedule.name,
        createdAt: schedule.createdAt || new Date().toISOString()
      });
      
      // Add games
      for (const game of schedule.games) {
        // Add game entity
        const gameEntity = await this.repository.addEntity('game', {
          id: game.id,
          date: game.date,
          startTime: game.startTime,
          endTime: game.endTime,
          homeTeamId: game.homeTeam,
          awayTeamId: game.awayTeam,
          venueId: game.venue
        });
        
        // Connect game to schedule
        await this.repository.addRelationship(
          scheduleEntity.id,
          'CONTAINS',
          gameEntity.id,
          { position: game.position || 0 }
        );
        
        // Connect teams to game
        if (game.homeTeam) {
          await this.repository.addRelationship(
            gameEntity.id,
            'HOME_TEAM',
            game.homeTeam,
            { role: 'home' }
          );
        }
        
        if (game.awayTeam) {
          await this.repository.addRelationship(
            gameEntity.id,
            'AWAY_TEAM',
            game.awayTeam,
            { role: 'away' }
          );
        }
        
        // Connect venue to game
        if (game.venue) {
          await this.repository.addRelationship(
            gameEntity.id,
            'PLAYED_AT',
            game.venue,
            { status: 'confirmed' }
          );
        }
      }
      
      return {
        success: true,
        scheduleId: schedule.id,
        gamesImported: schedule.games.length
      };
    } catch (error) {
      logger.error(`Failed to import schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate insights about a schedule using the knowledge graph
   * 
   * @param {string} scheduleId - ID of the schedule
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Schedule insights
   */
  async generateScheduleInsights(scheduleId, options = {}) {
    try {
      logger.info(`Generating insights for schedule ${scheduleId}`);
      
      // Use FlexTime AI for enhanced insights if available
      if (this.flexTimeClient && this.flexTimeClient.enabled) {
        const insightsResults = await this.flexTimeClient.processTask({
          task: 'knowledge_graph_insights',
          parameters: {
            scheduleId,
            graphData: await this.graphModel.exportSubgraph(['schedule', 'game'], scheduleId),
            options
          }
        });
        
        if (insightsResults && insightsResults.success) {
          return insightsResults.insights;
        }
      }
      
      // Fallback to local insights generation
      return this.repository.generateInsights(scheduleId, options);
    } catch (error) {
      logger.error(`Failed to generate schedule insights: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Shutdown the Knowledge Graph Agent
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down Knowledge Graph Agent');
      
      // Shutdown semantic enricher
      if (this.semanticEnricher) {
        await this.semanticEnricher.shutdown();
      }
      
      // Shutdown repository
      if (this.repository) {
        await this.repository.shutdown();
      }
      
      // Shutdown graph model
      if (this.graphModel) {
        await this.graphModel.shutdown();
      }
      
      logger.info('Knowledge Graph Agent shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Knowledge Graph Agent: ${error.message}`);
      return false;
    }
  }
}

module.exports = KnowledgeGraphAgent;
