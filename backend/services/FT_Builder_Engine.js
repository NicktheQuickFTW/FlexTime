/**
 * FT Builder Engine - Advanced Scheduling Service
 * 
 * Core computational engine that powers the FT Builder Interface,
 * providing enhanced scheduling capabilities directly integrated into
 * the FlexTime backend, combining features previously dependent on
 * the external Intelligence Engine.
 */

const logger = require("../src/utils/logger")
const AgentMemoryManager = require('../src/ai/agent-memory-adapter');
const neonDB = require('../src/config/neon-database');

/**
 * FT Builder Engine that integrates historical learning,
 * optimization, and schedule generation capabilities for the FT Builder Interface.
 */
class FTBuilderEngine {
  /**
   * Create a new FT Builder instance
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      // Default configuration
      useHistoricalData: true,
      useLocalRecommendations: true,
      useAdaptiveOptimization: true,
      ...config
    };
    
    // Memory management for storing historical schedules
    this.memoryManager = new AgentMemoryManager({
      neonDB: neonDB,
      ...config.memory
    });
    
    logger.info('FT Builder Engine initialized', {
      useHistoricalData: this.config.useHistoricalData,
      useAdaptiveOptimization: this.config.useAdaptiveOptimization
    });
  }
  
  /**
   * Initialize the service
   * 
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Connect to memory manager
      await this.memoryManager.connect();
      logger.info('Advanced Scheduling Service initialized successfully');
      
      // Pre-load common recommendations
      await this._preloadRecommendations();
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Advanced Scheduling Service: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get scheduling recommendations based on sport type and parameters
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getSchedulingRecommendations(parameters) {
    try {
      const sportType = parameters.sportType || 'unknown';
      logger.info(`Getting scheduling recommendations for ${sportType}`);
      
      // Check if we have historical data to use
      if (this.config.useHistoricalData) {
        try {
          const historicalRecommendations = await this._getHistoricalRecommendations(parameters);
          if (historicalRecommendations) {
            logger.info(`Using historical recommendations for ${sportType}`);
            return {
              success: true,
              sportType,
              ...historicalRecommendations,
              source: 'historical_data'
            };
          }
        } catch (error) {
          logger.warn(`Failed to get historical recommendations: ${error.message}`);
          // Continue with defaults
        }
      }
      
      // Fall back to best practice recommendations
      return this._getDefaultRecommendations(sportType);
    } catch (error) {
      logger.error(`Error getting scheduling recommendations: ${error.message}`);
      
      // Return safe default recommendations
      return this._getDefaultRecommendations(parameters.sportType || 'unknown');
    }
  }
  
  /**
   * Get sport-specific scheduling templates
   * 
   * @param {string} sportType - Type of sport
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sport-specific templates
   */
  async getSportTemplates(sportType, options = {}) {
    try {
      logger.info(`Getting templates for ${sportType}`);
      
      // Check for custom templates in memory
      if (this.config.useHistoricalData) {
        try {
          const customTemplates = await this.memoryManager.retrieveMemories({
            type: 'template',
            metadata: {
              sportType,
              isCustomTemplate: true
            },
            sort: { timestamp: -1 },
            limit: 5
          });
          
          if (customTemplates && customTemplates.length > 0) {
            logger.info(`Found ${customTemplates.length} custom templates for ${sportType}`);
            
            // Map to template format
            const templates = customTemplates.map(template => ({
              name: template.metadata.name,
              description: template.metadata.description,
              parameters: template.content
            }));
            
            return {
              success: true,
              sportType,
              templates,
              source: 'custom'
            };
          }
        } catch (error) {
          logger.warn(`Failed to get custom templates: ${error.message}`);
          // Continue with defaults
        }
      }
      
      // Return default templates
      return this._getDefaultSportTemplates(sportType);
    } catch (error) {
      logger.error(`Error getting sport templates: ${error.message}`);
      return this._getDefaultSportTemplates(sportType);
    }
  }
  
  /**
   * Store schedule data for future reference
   * 
   * @param {Object} schedule - Schedule to store
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} ID of the stored schedule
   */
  async storeScheduleData(schedule, metadata = {}) {
    try {
      if (!this.config.useHistoricalData) {
        logger.info('Historical data storage is disabled');
        return null;
      }
      
      logger.info(`Storing schedule data for ${schedule.sportType}`);
      
      // Extract key metrics for metadata
      const metrics = {
        gameCount: schedule.games?.length || 0,
        teamCount: schedule.teams?.length || 0,
        score: schedule.metadata?.optimization?.score || 0,
        generationTime: schedule.metadata?.generation?.elapsedTime || 0,
        ...metadata
      };
      
      // Store in memory manager
      const memoryId = await this.memoryManager.storeMemory({
        type: 'schedule',
        content: {
          id: schedule.id,
          sportType: schedule.sportType,
          season: schedule.season,
          algorithms: schedule.metadata?.generation?.algorithms || {},
          constraints: schedule.metadata?.optimization?.constraints || [],
          parameters: schedule.metadata?.generation?.parameters || {},
          metrics
        },
        metadata: {
          sportType: schedule.sportType,
          season: schedule.season,
          conferenceId: schedule.conferenceId,
          score: metrics.score,
          timestamp: new Date().toISOString()
        }
      });
      
      logger.info(`Schedule data stored with ID: ${memoryId}`);
      return memoryId;
    } catch (error) {
      logger.error(`Failed to store schedule data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Store user feedback for learning and improvement
   * 
   * @param {Object} feedback - User feedback
   * @returns {Promise<string>} ID of the stored feedback
   */
  async storeFeedback(feedback) {
    try {
      if (!this.config.useHistoricalData) {
        logger.info('Historical data storage is disabled');
        return null;
      }
      
      logger.info(`Storing user feedback for schedule ${feedback.scheduleId}`);
      
      // Store in memory manager
      const memoryId = await this.memoryManager.storeMemory({
        type: 'feedback',
        content: feedback,
        metadata: {
          scheduleId: feedback.scheduleId,
          rating: feedback.rating,
          sportType: feedback.sportType,
          timestamp: new Date().toISOString()
        }
      });
      
      logger.info(`Feedback stored with ID: ${memoryId}`);
      return memoryId;
    } catch (error) {
      logger.error(`Failed to store feedback: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get learning insights from historical data
   * 
   * @param {Object} parameters - Query parameters
   * @returns {Promise<Object>} Learning insights
   */
  async getLearningInsights(parameters = {}) {
    try {
      if (!this.config.useHistoricalData) {
        return {
          success: false,
          error: 'Historical data is disabled'
        };
      }
      
      const sportType = parameters.sportType;
      logger.info(`Getting learning insights for ${sportType || 'all sports'}`);
      
      // Prepare query
      const query = {
        type: 'schedule',
        metadata: {}
      };
      
      if (sportType) {
        query.metadata.sportType = sportType;
      }
      
      // Get historical schedules
      const schedules = await this.memoryManager.retrieveMemories(query);
      
      if (!schedules || schedules.length === 0) {
        return {
          success: true,
          insights: [],
          message: 'No historical data available'
        };
      }
      
      // Analyze historical data
      const insights = this._analyzeHistoricalData(schedules, parameters);
      
      return {
        success: true,
        insights,
        count: schedules.length,
        sportTypes: [...new Set(schedules.map(s => s.metadata.sportType))]
      };
    } catch (error) {
      logger.error(`Error getting learning insights: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Optimize an existing schedule using best practices
   * 
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   */
  async optimizeSchedule(schedule, constraints = [], options = {}) {
    try {
      logger.info(`Optimizing schedule for ${schedule.sportType}`);
      
      // Load the appropriate optimizer based on sport type
      const { SimulatedAnnealingOptimizer } = require('../algorithms/schedule-optimizer');
      
      // Create optimizer instance
      const optimizer = new SimulatedAnnealingOptimizer({
        iterations: options.iterations || 1000,
        coolingRate: options.coolingRate || 0.95,
        initialTemperature: options.initialTemperature || 100
      });
      
      // Apply sport-specific optimizations
      const sportType = schedule.sportType || 'unknown';
      const sportSpecificOptions = this._getSportSpecificOptimizations(sportType);
      
      // Merge constraints
      const mergedConstraints = this._mergeConstraints(
        constraints,
        sportSpecificOptions.constraints || []
      );
      
      // Optimize the schedule
      const optimizedSchedule = await optimizer.optimize(
        schedule,
        mergedConstraints,
        {
          ...sportSpecificOptions,
          ...options
        }
      );
      
      // Store optimization for learning if historical data is enabled
      if (this.config.useHistoricalData) {
        this.storeScheduleData(optimizedSchedule, {
          optimizationType: 'post_generation',
          originalId: schedule.id
        });
      }
      
      return optimizedSchedule;
    } catch (error) {
      logger.error(`Failed to optimize schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get constraints for a specific sport
   * 
   * @param {string} sport - Sport type (optional)
   * @returns {Promise<Array>} Available constraints
   */
  async getConstraints(sport = null) {
    try {
      logger.info(`Getting constraints${sport ? ` for ${sport}` : ''}`);
      
      // Check if we have sport-specific constraints in memory
      if (this.config.useHistoricalData && sport) {
        try {
          const customConstraints = await this.memoryManager.retrieveMemories({
            type: 'constraint',
            metadata: {
              sportType: sport
            },
            sort: { timestamp: -1 },
            limit: 20
          });
          
          if (customConstraints && customConstraints.length > 0) {
            logger.info(`Found ${customConstraints.length} custom constraints for ${sport}`);
            
            // Map to constraint format
            const constraints = customConstraints.map(constraint => ({
              id: constraint.id,
              type: constraint.content.type,
              name: constraint.content.name,
              description: constraint.content.description,
              weight: constraint.content.weight || 1.0,
              parameters: constraint.content.parameters || {},
              sportType: constraint.metadata.sportType,
              isActive: constraint.content.isActive !== false
            }));
            
            return constraints;
          }
        } catch (error) {
          logger.warn(`Failed to get custom constraints: ${error.message}`);
          // Continue with defaults
        }
      }
      
      // Return default constraints
      return this._getDefaultConstraints(sport);
    } catch (error) {
      logger.error(`Error getting constraints: ${error.message}`);
      return this._getDefaultConstraints(sport);
    }
  }

  /**
   * Get teams for a specific conference and sport
   * 
   * @param {string} conference - Conference name (default: 'big12')
   * @param {string} sport - Sport type (optional, for sport-specific filtering)
   * @returns {Promise<Array>} Available teams
   */
  async getTeams(conference = 'big12', sport = null) {
    try {
      logger.info(`Getting teams for conference: ${conference}${sport ? `, sport: ${sport}` : ''}`);
      
      // Use the Neon database to get teams
      const neonDB = require('../src/config/neon-database');
      
      if (!neonDB.isConnected) {
        logger.warn('Database not connected, returning default teams');
        return this._getDefaultTeams(conference, sport);
      }
      
      try {
        const teams = await neonDB.getTeams();
        
        if (teams && teams.length > 0) {
          logger.info(`Found ${teams.length} teams in database`);
          
          // Filter by sport if needed (some sports don't have all teams)
          let filteredTeams = teams;
          
          if (sport) {
            filteredTeams = this._filterTeamsBySport(teams, sport);
            logger.info(`Filtered to ${filteredTeams.length} teams for ${sport}`);
          }
          
          return filteredTeams;
        }
      } catch (dbError) {
        logger.warn(`Database query failed: ${dbError.message}, using defaults`);
      }
      
      // Fallback to default teams
      return this._getDefaultTeams(conference, sport);
    } catch (error) {
      logger.error(`Error getting teams: ${error.message}`);
      return this._getDefaultTeams(conference, sport);
    }
  }

  /**
   * Shutdown the service
   * 
   * @returns {Promise<boolean>} Success status
   */
  async shutdown() {
    try {
      logger.info('Shutting down Advanced Scheduling Service');
      await this.memoryManager.disconnect();
      return true;
    } catch (error) {
      logger.error(`Error shutting down Advanced Scheduling Service: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Preload common recommendations
   * 
   * @private
   */
  async _preloadRecommendations() {
    // This method preloads common recommendations for faster access
    this.recommendations = {
      football: this._getDefaultRecommendations('football'),
      basketball: this._getDefaultRecommendations('basketball'),
      baseball: this._getDefaultRecommendations('baseball'),
      volleyball: this._getDefaultRecommendations('volleyball')
    };
    
    logger.debug('Preloaded common recommendations');
  }
  
  /**
   * Get historical recommendations from memory
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Historical recommendations
   * @private
   */
  async _getHistoricalRecommendations(parameters) {
    const sportType = parameters.sportType || 'unknown';
    
    // Retrieve past schedule data for this sport
    const schedules = await this.memoryManager.retrieveMemories({
      type: 'schedule',
      metadata: {
        sportType
      },
      sort: { 'metadata.score': -1 }, // Sort by score descending
      limit: 5
    });
    
    if (!schedules || schedules.length === 0) {
      return null;
    }
    
    // Use the best performing schedule as a model
    const bestSchedule = schedules[0];
    
    return {
      algorithms: bestSchedule.content.algorithms,
      constraints: bestSchedule.content.constraints,
      parameters: bestSchedule.content.parameters
    };
  }
  
  /**
   * Get default recommendations for a sport type
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Default recommendations
   * @private
   */
  _getDefaultRecommendations(sportType) {
    // Default recommendations
    const defaultRecommendations = {
      success: true,
      sportType,
      algorithms: {
        generator: 'RoundRobinGenerator',
        optimizer: 'SimulatedAnnealingOptimizer'
      },
      constraints: [
        {
          type: 'HomeAwayBalance',
          weight: 1.0,
          parameters: {}
        },
        {
          type: 'MinimumRestDays',
          weight: 0.8,
          parameters: { minDays: 1 }
        }
      ],
      parameters: {
        optimizationIterations: 1000,
        coolingRate: 0.95,
        initialTemperature: 100
      },
      source: 'defaults'
    };
    
    // Sport-specific recommendations
    switch (sportType) {
      case 'football':
        defaultRecommendations.constraints.push({
          type: 'WeekendGamesPreference',
          weight: 0.9,
          parameters: {}
        });
        defaultRecommendations.algorithms.generator = 'PartialRoundRobinGenerator';
        break;
        
      case 'basketball':
        defaultRecommendations.constraints.push({
          type: 'AvoidBackToBack',
          weight: 0.7,
          parameters: {}
        });
        break;
        
      case 'baseball':
      case 'softball':
        defaultRecommendations.constraints.push({
          type: 'SeriesPreference',
          weight: 0.8,
          parameters: { seriesLength: 3 }
        });
        break;
        
      case 'volleyball':
      case 'soccer':
        defaultRecommendations.constraints.push({
          type: 'TravelDistanceMinimization',
          weight: 0.8,
          parameters: {}
        });
        break;
    }
    
    return defaultRecommendations;
  }
  
  /**
   * Get default sport templates
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Default templates
   * @private
   */
  _getDefaultSportTemplates(sportType) {
    // Default templates
    return {
      success: true,
      sportType,
      templates: [
        {
          name: 'Standard Season',
          description: `Standard ${sportType} season template`,
          parameters: {
            gameCount: sportType === 'football' ? 12 : 30,
            homeAwayBalance: true,
            weekendPreference: sportType === 'football'
          }
        },
        {
          name: 'Conference Play',
          description: `${sportType} conference play template`,
          parameters: {
            gameCount: sportType === 'football' ? 9 : 18,
            homeAwayBalance: true,
            divisionalPlay: true
          }
        },
        {
          name: 'Tournament Format',
          description: `${sportType} tournament template`,
          parameters: {
            gameCount: sportType === 'football' ? 4 : 10,
            singleElimination: true,
            neutralSites: true
          }
        }
      ],
      source: 'defaults'
    };
  }
  
  /**
   * Get sport-specific optimizations
   * 
   * @param {string} sportType - Type of sport
   * @returns {Object} Optimization options
   * @private
   */
  _getSportSpecificOptimizations(sportType) {
    // Provide sport-specific optimization settings
    switch (sportType) {
      case 'football':
        return {
          constraints: [
            {
              type: 'WeekendGamesPreference',
              weight: 0.9,
              parameters: {}
            },
            {
              type: 'MinimumRestDays',
              weight: 1.2,
              parameters: { minDays: 5 }
            }
          ],
          parameters: {
            coolingRate: 0.96,
            initialTemperature: 120
          }
        };
        
      case 'basketball':
        return {
          constraints: [
            {
              type: 'AvoidBackToBack',
              weight: 0.9,
              parameters: {}
            },
            {
              type: 'TravelDistanceMinimization',
              weight: 0.8,
              parameters: {}
            }
          ],
          parameters: {
            coolingRate: 0.94,
            initialTemperature: 100
          }
        };
        
      case 'baseball':
      case 'softball':
        return {
          constraints: [
            {
              type: 'SeriesPreference',
              weight: 1.0,
              parameters: { seriesLength: 3 }
            },
            {
              type: 'TravelDistanceMinimization',
              weight: 0.9,
              parameters: {}
            }
          ],
          parameters: {
            coolingRate: 0.95,
            initialTemperature: 90
          }
        };
        
      default:
        return {
          constraints: [
            {
              type: 'HomeAwayBalance',
              weight: 1.0,
              parameters: {}
            }
          ],
          parameters: {
            coolingRate: 0.95,
            initialTemperature: 100
          }
        };
    }
  }
  
  /**
   * Merge constraints from different sources
   * 
   * @param {Array} userConstraints - User-defined constraints
   * @param {Array} recommendedConstraints - Recommended constraints
   * @returns {Array} Merged constraints
   * @private
   */
  _mergeConstraints(userConstraints, recommendedConstraints) {
    // Start with user constraints
    const mergedConstraints = [...userConstraints];
    
    // Add recommended constraints that don't conflict
    recommendedConstraints.forEach(recommended => {
      const existingIndex = mergedConstraints.findIndex(c => c.type === recommended.type);
      
      if (existingIndex >= 0) {
        // User constraint takes precedence, but we can merge parameters
        mergedConstraints[existingIndex].parameters = {
          ...recommended.parameters,
          ...mergedConstraints[existingIndex].parameters
        };
      } else {
        // Add the recommended constraint
        mergedConstraints.push(recommended);
      }
    });
    
    return mergedConstraints;
  }
  
  /**
   * Get default constraints for a sport type
   * 
   * @param {string} sport - Sport type (optional)
   * @returns {Array} Default constraints
   * @private
   */
  _getDefaultConstraints(sport = null) {
    // Define all available constraint types
    const allConstraints = [
      {
        id: 'home-away-balance',
        type: 'HomeAwayBalance',
        name: 'Home/Away Balance',
        description: 'Ensures teams have balanced home and away games',
        weight: 1.0,
        parameters: {
          tolerance: 1,
          strict: false
        },
        sportType: 'general',
        isActive: true
      },
      {
        id: 'minimum-rest-days',
        type: 'MinimumRestDays',
        name: 'Minimum Rest Days',
        description: 'Enforces minimum rest days between games',
        weight: 0.8,
        parameters: {
          minDays: 1,
          byeWeeks: false
        },
        sportType: 'general',
        isActive: true
      },
      {
        id: 'travel-distance',
        type: 'TravelDistanceMinimization',
        name: 'Travel Distance Minimization',
        description: 'Minimizes total travel distance for teams',
        weight: 0.7,
        parameters: {
          maxDistance: 1000,
          considerBackToBack: true
        },
        sportType: 'general',
        isActive: true
      },
      {
        id: 'weekend-preference',
        type: 'WeekendGamesPreference',
        name: 'Weekend Games Preference',
        description: 'Prefers scheduling games on weekends',
        weight: 0.9,
        parameters: {
          preferredDays: ['Saturday', 'Sunday'],
          strict: false
        },
        sportType: 'football',
        isActive: true
      },
      {
        id: 'avoid-back-to-back',
        type: 'AvoidBackToBack',
        name: 'Avoid Back-to-Back Games',
        description: 'Prevents teams from playing consecutive days',
        weight: 0.9,
        parameters: {
          allowHomeStand: true,
          exceptions: []
        },
        sportType: 'basketball',
        isActive: true
      },
      {
        id: 'series-preference',
        type: 'SeriesPreference',
        name: 'Series Preference',
        description: 'Groups games into series (baseball/softball)',
        weight: 1.0,
        parameters: {
          seriesLength: 3,
          consecutiveDays: true,
          sameVenue: true
        },
        sportType: 'baseball',
        isActive: true
      },
      {
        id: 'championship-dates',
        type: 'ChampionshipDates',
        name: 'Championship Date Constraints',
        description: 'Reserves specific dates for championship games',
        weight: 1.2,
        parameters: {
          reservedDates: [],
          bufferDays: 3
        },
        sportType: 'general',
        isActive: true
      },
      {
        id: 'venue-availability',
        type: 'VenueAvailability',
        name: 'Venue Availability',
        description: 'Ensures venues are available for scheduled games',
        weight: 1.1,
        parameters: {
          checkConflicts: true,
          allowOverbook: false
        },
        sportType: 'general',
        isActive: true
      },
      {
        id: 'tv-network-preference',
        type: 'TVNetworkPreference',
        name: 'TV Network Preference',
        description: 'Optimizes scheduling for TV broadcast requirements',
        weight: 0.6,
        parameters: {
          preferredTimeSlots: ['12:00', '15:30', '19:00'],
          networkPriority: ['ESPN', 'FOX', 'ABC']
        },
        sportType: 'general',
        isActive: true
      },
      {
        id: 'rivalry-games',
        type: 'RivalryGames',
        name: 'Rivalry Game Scheduling',
        description: 'Special scheduling for rivalry matchups',
        weight: 0.8,
        parameters: {
          enhanceVisibility: true,
          avoidHolidays: false,
          preferWeekends: true
        },
        sportType: 'general',
        isActive: true
      }
    ];

    // Filter constraints based on sport
    let constraints = allConstraints;
    
    if (sport) {
      // Include general constraints and sport-specific constraints
      constraints = allConstraints.filter(constraint => 
        constraint.sportType === 'general' || 
        constraint.sportType === sport.toLowerCase() ||
        (sport.toLowerCase() === 'softball' && constraint.sportType === 'baseball') // softball uses baseball constraints
      );
    }

    // Add sport-specific weights and parameters
    constraints = constraints.map(constraint => {
      const enhanced = { ...constraint };
      
      // Adjust weights based on sport
      switch (sport?.toLowerCase()) {
        case 'football':
          if (constraint.type === 'MinimumRestDays') {
            enhanced.weight = 1.2;
            enhanced.parameters.minDays = 5; // More rest for football
          }
          break;
          
        case 'basketball':
          if (constraint.type === 'TravelDistanceMinimization') {
            enhanced.weight = 0.9; // Higher priority for basketball
          }
          break;
          
        case 'baseball':
        case 'softball':
          if (constraint.type === 'SeriesPreference') {
            enhanced.weight = 1.1; // Critical for baseball/softball
          }
          break;
      }
      
      return enhanced;
    });

    return constraints;
  }

  /**
   * Get default teams for a conference and sport
   * 
   * @param {string} conference - Conference name
   * @param {string} sport - Sport type (optional)
   * @returns {Array} Default teams
   * @private
   */
  _getDefaultTeams(conference = 'big12', sport = null) {
    // Big 12 Conference teams with all necessary data
    const big12Teams = [
      {
        id: 'arizona',
        name: 'Arizona',
        abbreviation: 'ARIZ',
        location: { lat: 32.2319, lng: -110.9501, city: 'Tucson, AZ' },
        colors: { primary: '#AB0520', secondary: '#0C234B' },
        venue_info: { name: 'Arizona Stadium', capacity: 50782 },
        conference: 'big12'
      },
      {
        id: 'arizona-state',
        name: 'Arizona State',
        abbreviation: 'ASU',
        location: { lat: 33.4242, lng: -111.9281, city: 'Tempe, AZ' },
        colors: { primary: '#8C1D40', secondary: '#FFC627' },
        venue_info: { name: 'Sun Devil Stadium', capacity: 53599 },
        conference: 'big12'
      },
      {
        id: 'baylor',
        name: 'Baylor',
        abbreviation: 'BAY',
        location: { lat: 31.5488, lng: -97.1131, city: 'Waco, TX' },
        colors: { primary: '#003015', secondary: '#FFB81C' },
        venue_info: { name: 'McLane Stadium', capacity: 45140 },
        conference: 'big12'
      },
      {
        id: 'byu',
        name: 'BYU',
        abbreviation: 'BYU',
        location: { lat: 40.2518, lng: -111.6493, city: 'Provo, UT' },
        colors: { primary: '#002E5D', secondary: '#FFFFFF' },
        venue_info: { name: 'LaVell Edwards Stadium', capacity: 63470 },
        conference: 'big12'
      },
      {
        id: 'cincinnati',
        name: 'Cincinnati',
        abbreviation: 'CIN',
        location: { lat: 39.1612, lng: -84.4569, city: 'Cincinnati, OH' },
        colors: { primary: '#E00122', secondary: '#000000' },
        venue_info: { name: 'Nippert Stadium', capacity: 40000 },
        conference: 'big12'
      },
      {
        id: 'colorado',
        name: 'Colorado',
        abbreviation: 'COL',
        location: { lat: 40.0150, lng: -105.2705, city: 'Boulder, CO' },
        colors: { primary: '#000000', secondary: '#CFB87C' },
        venue_info: { name: 'Folsom Field', capacity: 50183 },
        conference: 'big12'
      },
      {
        id: 'houston',
        name: 'Houston',
        abbreviation: 'HOU',
        location: { lat: 29.7604, lng: -95.3698, city: 'Houston, TX' },
        colors: { primary: '#C8102E', secondary: '#FFFFFF' },
        venue_info: { name: 'TDECU Stadium', capacity: 40000 },
        conference: 'big12'
      },
      {
        id: 'iowa-state',
        name: 'Iowa State',
        abbreviation: 'ISU',
        location: { lat: 42.0308, lng: -93.6319, city: 'Ames, IA' },
        colors: { primary: '#C8102E', secondary: '#F1BE48' },
        venue_info: { name: 'Jack Trice Stadium', capacity: 61500 },
        conference: 'big12'
      },
      {
        id: 'kansas',
        name: 'Kansas',
        abbreviation: 'KU',
        location: { lat: 38.9717, lng: -95.2353, city: 'Lawrence, KS' },
        colors: { primary: '#0051BA', secondary: '#E8000D' },
        venue_info: { name: 'Memorial Stadium', capacity: 47233 },
        conference: 'big12'
      },
      {
        id: 'kansas-state',
        name: 'Kansas State',
        abbreviation: 'KSU',
        location: { lat: 39.1836, lng: -96.5717, city: 'Manhattan, KS' },
        colors: { primary: '#512888', secondary: '#FFFFFF' },
        venue_info: { name: 'Bill Snyder Family Stadium', capacity: 50000 },
        conference: 'big12'
      },
      {
        id: 'oklahoma-state',
        name: 'Oklahoma State',
        abbreviation: 'OKST',
        location: { lat: 36.1156, lng: -97.0669, city: 'Stillwater, OK' },
        colors: { primary: '#FF7300', secondary: '#000000' },
        venue_info: { name: 'Boone Pickens Stadium', capacity: 60218 },
        conference: 'big12'
      },
      {
        id: 'tcu',
        name: 'TCU',
        abbreviation: 'TCU',
        location: { lat: 32.7573, lng: -97.2925, city: 'Fort Worth, TX' },
        colors: { primary: '#4D1979', secondary: '#A7A8AA' },
        venue_info: { name: 'Amon G. Carter Stadium', capacity: 47331 },
        conference: 'big12'
      },
      {
        id: 'texas-tech',
        name: 'Texas Tech',
        abbreviation: 'TTU',
        location: { lat: 33.5779, lng: -101.8552, city: 'Lubbock, TX' },
        colors: { primary: '#CC0000', secondary: '#000000' },
        venue_info: { name: 'Jones AT&T Stadium', capacity: 60454 },
        conference: 'big12'
      },
      {
        id: 'ucf',
        name: 'UCF',
        abbreviation: 'UCF',
        location: { lat: 28.6024, lng: -81.2001, city: 'Orlando, FL' },
        colors: { primary: '#000000', secondary: '#FFC904' },
        venue_info: { name: 'FBC Mortgage Stadium', capacity: 44206 },
        conference: 'big12'
      },
      {
        id: 'utah',
        name: 'Utah',
        abbreviation: 'UTAH',
        location: { lat: 40.7649, lng: -111.8421, city: 'Salt Lake City, UT' },
        colors: { primary: '#CC0000', secondary: '#FFFFFF' },
        venue_info: { name: 'Rice-Eccles Stadium', capacity: 51444 },
        conference: 'big12'
      },
      {
        id: 'west-virginia',
        name: 'West Virginia',
        abbreviation: 'WVU',
        location: { lat: 39.6295, lng: -79.9559, city: 'Morgantown, WV' },
        colors: { primary: '#002855', secondary: '#EAAA00' },
        venue_info: { name: 'Milan Puskar Stadium', capacity: 60000 },
        conference: 'big12'
      }
    ];

    // Filter by conference if not Big 12
    let teams = conference.toLowerCase() === 'big12' ? big12Teams : [];
    
    // Apply sport-specific filtering if needed
    if (sport) {
      teams = this._filterTeamsBySport(teams, sport);
    }
    
    return teams;
  }

  /**
   * Filter teams based on sport participation
   * 
   * @param {Array} teams - All teams
   * @param {string} sport - Sport type
   * @returns {Array} Filtered teams
   * @private
   */
  _filterTeamsBySport(teams, sport) {
    // If teams are from database, they have team_id where sport is encoded
    // Team ID format: school_id * 100 + sport_id
    // Football = sport_id 8, Basketball = sport_id 2, etc.
    if (teams.length > 0 && teams[0].team_id) {
      // Map sport names to sport IDs (from neon-database.js)
      const sportIdMapping = {
        'baseball': 1,
        'men\'s basketball': 2,
        'mens basketball': 2,
        'basketball': 2, // default to men's basketball
        'women\'s basketball': 3,
        'womens basketball': 3,
        'football': 8,
        'gymnastics': 11,
        'lacrosse': 12,
        'soccer': 14,
        'softball': 15,
        'men\'s tennis': 18,
        'mens tennis': 18,
        'tennis': 18, // default to men's tennis
        'women\'s tennis': 19,
        'womens tennis': 19,
        'volleyball': 24,
        'wrestling': 25
      };
      
      const normalizedSport = sport.toLowerCase().replace(/[^a-z\s']/g, '');
      const sportId = sportIdMapping[normalizedSport];
      
      logger.info(`Filtering teams: sport="${sport}", normalized="${normalizedSport}", sportId=${sportId}`);
      
      if (sportId) {
        const filtered = teams.filter(team => {
          // Use the actual sport_id field from the database instead of extracting from team_id
          const teamSportId = team.sport_id;
          const matches = teamSportId === sportId;
          if (teams.length <= 5) { // Debug for small sets
            logger.info(`Team ${team.name}: team_id=${team.team_id}, sport_id=${teamSportId}, matches=${matches}`);
          }
          return matches;
        });
        logger.info(`Filtered ${filtered.length} teams with sportId ${sportId}`);
        return filtered;
      }
      
      // Fallback: filter by sport field if sport ID not found
      if (teams[0].sport) {
        const normalizedSportCompare = normalizedSport.replace(/[^a-z]/g, '');
        return teams.filter(team => {
          const teamSport = team.sport.toLowerCase().replace(/[^a-z]/g, '');
          return teamSport === normalizedSportCompare;
        });
      }
    }
    
    // Fallback to hardcoded mapping for default teams (legacy support)
    const sportParticipation = {
      'football': ['arizona', 'arizona-state', 'baylor', 'byu', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'basketball': ['arizona', 'arizona-state', 'baylor', 'byu', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'mens-basketball': ['arizona', 'arizona-state', 'baylor', 'byu', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'womens-basketball': ['arizona', 'arizona-state', 'baylor', 'byu', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'baseball': ['arizona', 'arizona-state', 'byu', 'baylor', 'cincinnati', 'houston', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'softball': ['arizona', 'arizona-state', 'byu', 'baylor', 'houston', 'iowa-state', 'kansas', 'oklahoma-state', 'texas-tech', 'ucf', 'utah'],
      'volleyball': ['arizona', 'arizona-state', 'byu', 'baylor', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'soccer': ['arizona', 'arizona-state', 'byu', 'baylor', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'],
      'wrestling': ['arizona-state', 'iowa-state', 'oklahoma-state', 'west-virginia'], // Note: 4 teams + 10 affiliates (Air Force, Cal Baptist, Missouri, North Dakota State, Northern Colorado, Northern Iowa, Oklahoma, South Dakota State, Utah Valley, Wyoming)
      'gymnastics': ['arizona', 'arizona-state', 'byu', 'iowa-state', 'utah', 'west-virginia'], // Note: 6 teams + 1 affiliate (Denver)
      'lacrosse': ['arizona-state', 'cincinnati', 'colorado'], // Note: includes affiliate members
      'tennis': ['arizona', 'arizona-state', 'byu', 'baylor', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah'],
      'mens-tennis': ['arizona', 'arizona-state', 'byu', 'baylor', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah'],
      'womens-tennis': ['arizona', 'arizona-state', 'byu', 'baylor', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia']
    };

    const sportKey = sport.toLowerCase().replace(/\s+/g, '-');
    const participatingTeamIds = sportParticipation[sportKey] || sportParticipation['football']; // default to football teams
    
    return teams.filter(team => participatingTeamIds.includes(team.id));
  }

  /**
   * Analyze historical scheduling data
   * 
   * @param {Array} schedules - Historical schedules
   * @param {Object} parameters - Analysis parameters
   * @returns {Array} Insights derived from analysis
   * @private
   */
  _analyzeHistoricalData(schedules, parameters) {
    // Group schedules by sport type
    const sportGroups = schedules.reduce((groups, schedule) => {
      const sportType = schedule.metadata.sportType;
      if (!groups[sportType]) {
        groups[sportType] = [];
      }
      groups[sportType].push(schedule);
      return groups;
    }, {});
    
    // Generate insights for each sport
    const insights = [];
    
    for (const [sportType, sportSchedules] of Object.entries(sportGroups)) {
      // Skip if we're filtering by a different sport type
      if (parameters.sportType && parameters.sportType !== sportType) {
        continue;
      }
      
      // Sort by score
      sportSchedules.sort((a, b) => 
        (b.metadata.score || 0) - (a.metadata.score || 0)
      );
      
      // Find the best performing schedule
      const bestSchedule = sportSchedules[0];
      
      // Find what makes the best schedule successful
      const bestAlgorithms = bestSchedule.content.algorithms || {};
      const bestConstraints = bestSchedule.content.constraints || [];
      
      // Look for patterns in constraints used by successful schedules
      const topSchedules = sportSchedules.slice(0, Math.min(5, sportSchedules.length));
      const constraintCounts = {};
      
      // Count constraint usage in top schedules
      topSchedules.forEach(schedule => {
        (schedule.content.constraints || []).forEach(constraint => {
          if (!constraintCounts[constraint.type]) {
            constraintCounts[constraint.type] = 0;
          }
          constraintCounts[constraint.type]++;
        });
      });
      
      // Find most common constraints
      const commonConstraints = Object.entries(constraintCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Add insight for this sport
      insights.push({
        sportType,
        scheduleCount: sportSchedules.length,
        bestAlgorithms,
        bestScore: bestSchedule.metadata.score || 0,
        commonConstraints: commonConstraints.map(c => c.type),
        recommendedApproach: {
          generator: bestAlgorithms.generator || 'RoundRobinGenerator',
          optimizer: bestAlgorithms.optimizer || 'SimulatedAnnealingOptimizer',
          keyConstraints: bestConstraints.map(c => c.type)
        }
      });
    }
    
    return insights;
  }
}

module.exports = FTBuilderEngine;