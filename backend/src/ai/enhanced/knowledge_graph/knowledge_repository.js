/**
 * Knowledge Repository for FlexTime
 * 
 * This module provides higher-level access to the knowledge graph,
 * implementing domain-specific queries and operations for scheduling entities.
 */

const logger = require("../../lib/logger");;

/**
 * Knowledge Repository
 * Provides domain-specific access to the knowledge graph
 */
class KnowledgeRepository {
  /**
   * Create a new Knowledge Repository
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.graphModel = config.graphModel;
    
    if (!this.graphModel) {
      throw new Error('GraphModel is required for KnowledgeRepository');
    }
    
    logger.info('Knowledge Repository initialized');
  }
  
  /**
   * Initialize the repository
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      logger.info('Initializing Knowledge Repository');
      
      // Set up any initial data structures or indices
      
      logger.info('Knowledge Repository initialization complete');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Knowledge Repository: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Add an entity to the knowledge graph
   * 
   * @param {string} entityType - Type of entity
   * @param {Object} entityData - Entity data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Added entity
   */
  async addEntity(entityType, entityData, options = {}) {
    try {
      logger.debug(`Adding ${entityType} entity to repository`);
      
      // Add to graph model
      const entity = this.graphModel.addNode(entityType, entityData);
      
      return entity;
    } catch (error) {
      logger.error(`Failed to add entity: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add a relationship between entities
   * 
   * @param {string} sourceId - Source entity ID
   * @param {string} relationshipType - Type of relationship
   * @param {string} targetId - Target entity ID
   * @param {Object} properties - Additional properties
   * @returns {Promise<Object>} Added relationship
   */
  async addRelationship(sourceId, relationshipType, targetId, properties = {}) {
    try {
      logger.debug(`Adding relationship ${sourceId} -[${relationshipType}]-> ${targetId}`);
      
      // Add to graph model
      const relationship = this.graphModel.addRelationship(
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
   * Query the repository
   * 
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async query(query, options = {}) {
    try {
      const { entityType, filters = {}, relationships = [] } = query;
      
      // Find entities matching filters
      const entities = this.graphModel.findNodes(entityType, filters);
      
      // If no relationships specified, return entities
      if (relationships.length === 0) {
        return entities;
      }
      
      // Filter entities by relationships
      const results = [];
      
      for (const entity of entities) {
        let match = true;
        
        // Check each relationship constraint
        for (const rel of relationships) {
          const { type, direction = 'outgoing', target = {} } = rel;
          
          // Find connected relationships
          const connected = this.graphModel.findConnectedRelationships(entity.id, {
            direction,
            types: [type]
          });
          
          // Get relevant relationships based on direction
          const relevantRels = direction === 'outgoing' ? connected.outgoing
            : direction === 'incoming' ? connected.incoming
            : [...connected.outgoing, ...connected.incoming];
          
          // Get connected node IDs
          const connectedIds = relevantRels.map(r => 
            direction === 'outgoing' ? r.targetId
            : direction === 'incoming' ? r.sourceId
            : r.sourceId === entity.id ? r.targetId : r.sourceId
          );
          
          // Check connected nodes match target filters
          const connectedNodes = connectedIds.map(id => this.graphModel.getNode(id))
            .filter(Boolean);
          
          // Check if any connected node matches target filters
          const hasMatchingTarget = connectedNodes.some(node => {
            if (target.type && node.type !== target.type) {
              return false;
            }
            
            // Check properties
            for (const [key, value] of Object.entries(target.properties || {})) {
              if (node.properties[key] !== value) {
                return false;
              }
            }
            
            return true;
          });
          
          if (!hasMatchingTarget) {
            match = false;
            break;
          }
        }
        
        if (match) {
          results.push(entity);
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Failed to query repository: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find conflicts in a schedule
   * 
   * @param {string} scheduleId - Schedule ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} Detected conflicts
   */
  async findConflicts(scheduleId, options = {}) {
    try {
      // Get schedule node
      const scheduleNode = this.graphModel.getNode(scheduleId);
      
      if (!scheduleNode) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }
      
      // Get games in schedule
      const scheduleGames = [];
      const { relationships } = this.graphModel.traverseFrom(scheduleId, {
        maxDepth: 1,
        direction: 'outgoing',
        relationshipTypes: ['CONTAINS']
      });
      
      // Get game nodes
      for (const rel of relationships) {
        const gameNode = this.graphModel.getNode(rel.targetId);
        if (gameNode && gameNode.type === 'game') {
          scheduleGames.push(gameNode);
        }
      }
      
      // Detect conflicts
      const conflicts = [];
      
      // Check for venue conflicts (same venue, overlapping times)
      const gamesByVenue = {};
      
      for (const game of scheduleGames) {
        // Get venue for game
        const venueRels = this.graphModel.findConnectedRelationships(game.id, {
          direction: 'outgoing',
          types: ['PLAYED_AT']
        }).outgoing;
        
        if (venueRels.length === 0) {
          continue;
        }
        
        const venueId = venueRels[0].targetId;
        
        if (!gamesByVenue[venueId]) {
          gamesByVenue[venueId] = [];
        }
        
        gamesByVenue[venueId].push(game);
      }
      
      // Check each venue for conflicts
      for (const [venueId, games] of Object.entries(gamesByVenue)) {
        // Sort games by date and time
        games.sort((a, b) => {
          const dateA = new Date(`${a.properties.date}T${a.properties.startTime || '00:00:00'}`);
          const dateB = new Date(`${b.properties.date}T${b.properties.startTime || '00:00:00'}`);
          return dateA - dateB;
        });
        
        // Check for overlaps
        for (let i = 0; i < games.length - 1; i++) {
          const gameA = games[i];
          const gameB = games[i + 1];
          
          const startA = new Date(`${gameA.properties.date}T${gameA.properties.startTime || '00:00:00'}`);
          const endA = new Date(`${gameA.properties.date}T${gameA.properties.endTime || '23:59:59'}`);
          const startB = new Date(`${gameB.properties.date}T${gameB.properties.startTime || '00:00:00'}`);
          
          if (startB < endA) {
            // Overlap detected
            const venueNode = this.graphModel.getNode(venueId);
            
            conflicts.push({
              type: 'VENUE_CONFLICT',
              description: `Venue conflict at ${venueNode.properties.name || venueId}`,
              entities: [gameA.id, gameB.id, venueId],
              details: {
                venue: venueNode.properties,
                games: [gameA.properties, gameB.properties]
              }
            });
          }
        }
      }
      
      // Check for team conflicts (same team playing in different games at overlapping times)
      const gamesByTeam = {};
      
      for (const game of scheduleGames) {
        // Get teams for game
        const homeTeamRels = this.graphModel.findConnectedRelationships(game.id, {
          direction: 'outgoing',
          types: ['HOME_TEAM']
        }).outgoing;
        
        const awayTeamRels = this.graphModel.findConnectedRelationships(game.id, {
          direction: 'outgoing',
          types: ['AWAY_TEAM']
        }).outgoing;
        
        // Add home team games
        if (homeTeamRels.length > 0) {
          const teamId = homeTeamRels[0].targetId;
          
          if (!gamesByTeam[teamId]) {
            gamesByTeam[teamId] = [];
          }
          
          gamesByTeam[teamId].push(game);
        }
        
        // Add away team games
        if (awayTeamRels.length > 0) {
          const teamId = awayTeamRels[0].targetId;
          
          if (!gamesByTeam[teamId]) {
            gamesByTeam[teamId] = [];
          }
          
          gamesByTeam[teamId].push(game);
        }
      }
      
      // Check each team for conflicts
      for (const [teamId, games] of Object.entries(gamesByTeam)) {
        // Sort games by date and time
        games.sort((a, b) => {
          const dateA = new Date(`${a.properties.date}T${a.properties.startTime || '00:00:00'}`);
          const dateB = new Date(`${b.properties.date}T${b.properties.startTime || '00:00:00'}`);
          return dateA - dateB;
        });
        
        // Check for overlaps
        for (let i = 0; i < games.length - 1; i++) {
          const gameA = games[i];
          const gameB = games[i + 1];
          
          const startA = new Date(`${gameA.properties.date}T${gameA.properties.startTime || '00:00:00'}`);
          const endA = new Date(`${gameA.properties.date}T${gameA.properties.endTime || '23:59:59'}`);
          const startB = new Date(`${gameB.properties.date}T${gameB.properties.startTime || '00:00:00'}`);
          
          if (startB < endA) {
            // Overlap detected
            const teamNode = this.graphModel.getNode(teamId);
            
            conflicts.push({
              type: 'TEAM_CONFLICT',
              description: `Team conflict for ${teamNode.properties.name || teamId}`,
              entities: [gameA.id, gameB.id, teamId],
              details: {
                team: teamNode.properties,
                games: [gameA.properties, gameB.properties]
              }
            });
          }
        }
      }
      
      return conflicts;
    } catch (error) {
      logger.error(`Failed to find conflicts: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate insights about a schedule
   * 
   * @param {string} scheduleId - Schedule ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Schedule insights
   */
  async generateInsights(scheduleId, options = {}) {
    try {
      // Get schedule node
      const scheduleNode = this.graphModel.getNode(scheduleId);
      
      if (!scheduleNode) {
        throw new Error(`Schedule ${scheduleId} not found`);
      }
      
      // Extract schedule subgraph
      const subgraph = this.graphModel.exportSubgraph(['schedule', 'game', 'team', 'venue'], scheduleId);
      
      // Basic analytics
      const insights = {
        scheduleId,
        scheduleName: scheduleNode.properties.name,
        sportType: scheduleNode.properties.sportType,
        gameCount: 0,
        teamCount: 0,
        venueCount: 0,
        gamesPerDay: {},
        gamesPerVenue: {},
        gamesPerTeam: {},
        homeAwayBalance: {},
        conflicts: []
      };
      
      // Count games, teams, venues
      const teamIds = new Set();
      const venueIds = new Set();
      const gameNodes = subgraph.nodes.filter(node => node.type === 'game');
      
      insights.gameCount = gameNodes.length;
      
      // Analyze games
      for (const game of gameNodes) {
        // Track by date
        const date = game.properties.date;
        if (!insights.gamesPerDay[date]) {
          insights.gamesPerDay[date] = 0;
        }
        insights.gamesPerDay[date]++;
        
        // Track by venue
        const venueId = game.properties.venueId;
        if (venueId) {
          venueIds.add(venueId);
          if (!insights.gamesPerVenue[venueId]) {
            insights.gamesPerVenue[venueId] = 0;
          }
          insights.gamesPerVenue[venueId]++;
        }
        
        // Track by team
        const homeTeamId = game.properties.homeTeamId;
        const awayTeamId = game.properties.awayTeamId;
        
        if (homeTeamId) {
          teamIds.add(homeTeamId);
          if (!insights.gamesPerTeam[homeTeamId]) {
            insights.gamesPerTeam[homeTeamId] = 0;
            insights.homeAwayBalance[homeTeamId] = { home: 0, away: 0 };
          }
          insights.gamesPerTeam[homeTeamId]++;
          insights.homeAwayBalance[homeTeamId].home++;
        }
        
        if (awayTeamId) {
          teamIds.add(awayTeamId);
          if (!insights.gamesPerTeam[awayTeamId]) {
            insights.gamesPerTeam[awayTeamId] = 0;
            insights.homeAwayBalance[awayTeamId] = { home: 0, away: 0 };
          }
          insights.gamesPerTeam[awayTeamId]++;
          insights.homeAwayBalance[awayTeamId].away++;
        }
      }
      
      insights.teamCount = teamIds.size;
      insights.venueCount = venueIds.size;
      
      // Find conflicts
      insights.conflicts = await this.findConflicts(scheduleId, options);
      
      return insights;
    } catch (error) {
      logger.error(`Failed to generate insights: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze entity relationships
   * 
   * @param {Object} parameters - Analysis parameters
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeRelationships(parameters) {
    try {
      const {
        entityType,
        entityId,
        relationshipTypes,
        maxDepth = 2
      } = parameters;
      
      // Traverse graph from entity
      const traversal = this.graphModel.traverseFrom(entityId, {
        maxDepth,
        direction: 'both',
        relationshipTypes,
        nodeTypes: null,
        uniqueNodes: true
      });
      
      return {
        entityId,
        entityType,
        connectedEntities: traversal.nodes.length - 1, // Exclude starting node
        relationships: traversal.relationships.length,
        relationshipsByType: this._countByProperty(traversal.relationships, 'type'),
        nodesByType: this._countByProperty(traversal.nodes, 'type'),
        maxPathLength: Math.max(...traversal.paths.map(p => p.length), 0)
      };
    } catch (error) {
      logger.error(`Failed to analyze relationships: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Count objects by a property value
   * 
   * @private
   * @param {Array} objects - Objects to count
   * @param {string} property - Property to count by
   * @returns {Object} Counts by property value
   */
  _countByProperty(objects, property) {
    const counts = {};
    
    for (const obj of objects) {
      const value = obj[property];
      
      if (!counts[value]) {
        counts[value] = 0;
      }
      
      counts[value]++;
    }
    
    return counts;
  }
  
  /**
   * Shutdown the repository
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down Knowledge Repository');
      
      // No specific shutdown tasks needed
      
      logger.info('Knowledge Repository shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Knowledge Repository: ${error.message}`);
      return false;
    }
  }
}

module.exports = { KnowledgeRepository };
