/**
 * FT Builder Engine - Advanced Scheduling Service
 * 
 * Core computational engine that powers the FT Builder Interface,
 * providing enhanced scheduling capabilities directly integrated into
 * the FlexTime backend, combining features previously dependent on
 * the external Intelligence Engine.
 */

const logger = require('../lib/logger');
const AgentMemoryManager = require('../src/ai/agent-memory-adapter');
const neonDB = require('../src/config/neon-database');
const SimpleSchedulingService = require('./simpleSchedulingService');
const SimpleConstraintEvaluator = require('./simpleConstraintEvaluator');
const Big12DataService = require('./big12DataService');
const LacrosseConstraintSolver = require('./LacrosseConstraintSolver');
const SportSchedulerRegistry = require('./schedulers/SportSchedulerRegistry');
const { v4: uuidv4 } = require('uuid');

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
    
    // Don't create instance-level constraint solvers to avoid state conflicts
    // Each request will create its own solver instance
    
    // Sport-specific schedulers can be registered here in the future
    // Example:
    // this.sportSchedulers = {
    //   13: LacrosseScheduler,
    //   8: FootballScheduler,
    //   1: BaseballScheduler,
    //   default: StandardScheduler
    // };
    
    logger.info('FT Builder Engine initialized', {
      useHistoricalData: this.config.useHistoricalData,
      useAdaptiveOptimization: this.config.useAdaptiveOptimization,
      hybridArchitecture: true
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
   * Generate a schedule using the simplified scheduling service
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Generated schedule
   */
  async generateSchedule(parameters) {
    // Add request ID for tracking and isolation
    const requestId = parameters.requestId || uuidv4();
    
    try {
      logger.info(`[${requestId}] FT Builder generating schedule with parameters:`, parameters);
      
      // Validate required parameters
      if (!parameters.sportId) {
        throw new Error('sportId is required');
      }
      
      if (!parameters.teamIds || parameters.teamIds.length < 2) {
        throw new Error('At least 2 teams are required');
      }
      
      // Get sport data
      const sport = Big12DataService.getSportById(parameters.sportId);
      if (!sport) {
        throw new Error(`Invalid sport ID: ${parameters.sportId}`);
      }
      
      // Get recommended constraints if not provided
      let constraints = parameters.constraints || [];
      if (constraints.length === 0) {
        constraints = SimpleConstraintEvaluator.getRecommendedConstraints(parameters.sportId);
        logger.info(`[${requestId}] Using ${constraints.length} recommended constraints for ${sport.name}`);
      }
      
      // Check if we have a sport-specific scheduler
      let schedule;
      const sportScheduler = SportSchedulerRegistry.getScheduler(parameters.sportId);
      
      if (sportScheduler) {
        // Use sport-specific scheduler
        logger.info(`[${requestId}] Using ${sportScheduler.constructor.name} for ${sport.name}`);
        
        // Get teams data
        const teams = Big12DataService.getTeams({ sport_id: parameters.sportId })
          .filter(t => parameters.teamIds.includes(t.team_id));
        
        // Generate matchups using sport-specific logic
        const matchups = await sportScheduler.generateMatchups(teams, {
          gamesPerTeam: parameters.gamesPerTeam,
          season: parameters.season || new Date().getFullYear()
        });
        
        // Assign dates to matchups
        const datedGames = await this.assignDatesToMatchups(
          matchups, 
          parameters.startDate, 
          parameters.endDate,
          sportScheduler.getDatePreferences(),
          constraints
        );
        
        // Assign venues based on home team
        const scheduledGames = await this.assignVenuesToGames(datedGames);
        
        // Convert to standard schedule format
        schedule = {
          schedule_id: uuidv4(),
          sport_id: parameters.sportId,
          games: scheduledGames,
          metadata: {
            scheduler: sportScheduler.constructor.name,
            total_games: scheduledGames.length,
            teams_count: teams.length,
            start_date: parameters.startDate,
            end_date: parameters.endDate
          }
        };
        
      } else if (sport.name === 'Lacrosse' || parameters.sportId === 13) {
        // Use constraint solver for lacrosse
        logger.info(`[${requestId}] Using constraint solver for lacrosse scheduling`);
        schedule = await this.generateLacrosseSchedule({ ...parameters, requestId });
      } else {
        // Fall back to standard approach
        logger.info(`[${requestId}] Using SimpleSchedulingService for ${sport.name}`);
        schedule = await SimpleSchedulingService.generateSchedule({
          sport_id: parameters.sportId,
          team_ids: parameters.teamIds,
          start_date: parameters.startDate,
          end_date: parameters.endDate,
          games_per_team: parameters.gamesPerTeam,
          constraints: constraints,
          schedule_type: parameters.scheduleType || 'round_robin',
          home_away_balance: parameters.homeAwayBalance !== false
        });
      }
      
      // Evaluate the schedule against constraints
      const evaluation = SimpleConstraintEvaluator.evaluateSchedule(
        schedule.games,
        constraints
      );
      
      // Store the schedule if configured
      if (this.config.useHistoricalData) {
        try {
          await this.storeScheduleData({
            ...schedule,
            sportType: sport.code,
            season: parameters.season || 'custom',
            metadata: {
              optimization: {
                score: evaluation.score,
                constraints: constraints.length
              },
              generation: {
                parameters: parameters,
                algorithms: {
                  scheduling: 'SimpleSchedulingService',
                  evaluation: 'SimpleConstraintEvaluator'
                }
              }
            }
          });
        } catch (storeError) {
          logger.warn('Failed to store schedule data:', storeError);
        }
      }
      
      // Save to database if requested
      let savedSchedule = null;
      if (parameters.saveToDatabase !== false) {
        try {
          savedSchedule = await this.saveSchedule(schedule, parameters.userId);
        } catch (saveError) {
          logger.error('Failed to save schedule to database:', saveError);
        }
      }
      
      return {
        success: true,
        schedule_id: savedSchedule?.id || schedule.schedule_id,
        sport: sport,
        schedule: schedule,
        evaluation: evaluation,
        metadata: {
          generated_at: new Date().toISOString(),
          engine_version: '2.0',
          constraints_applied: constraints.length,
          violations: evaluation.violations.length,
          score: evaluation.score
        }
      };
      
    } catch (error) {
      logger.error(`[${requestId}] FT Builder schedule generation failed:`, error);
      return {
        success: false,
        error: error.message,
        details: error.stack,
        requestId: requestId
      };
    }
  }

  /**
   * Generate lacrosse schedule using constraint solver
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Generated schedule
   */
  async generateLacrosseSchedule(parameters) {
    const requestId = parameters.requestId || uuidv4();
    
    try {
      logger.info(`[${requestId}] Generating lacrosse schedule with constraint solver`);
      
      // Create new solver instance for this request (stateless)
      const lacrosseConstraintSolver = new LacrosseConstraintSolver();
      
      // Get previous year data if available
      let previousYear = null;
      if (this.config.useHistoricalData && parameters.previousYear) {
        try {
          previousYear = await this.memoryManager.retrieveScheduleData(
            'lacrosse',
            parameters.previousYear
          );
        } catch (error) {
          logger.warn(`[${requestId}] Could not retrieve previous year data:`, error);
        }
      }
      
      // Determine target distribution based on previous year
      const targetDistribution = this.calculateTargetDistribution(
        previousYear,
        parameters.targetYear || 2027
      );
      
      // Generate schedule using constraint solver (stateless)
      const constraintSchedule = lacrosseConstraintSolver.generateSchedule(
        previousYear,
        targetDistribution
      );
      
      // Convert to standard schedule format
      const games = [];
      let gameId = 1;
      
      Object.values(constraintSchedule).forEach(week => {
        week.games.forEach(game => {
          games.push({
            game_id: gameId++,
            week: week.week,
            date: week.date,
            home_team: game.home,
            away_team: game.away,
            sport_id: 13, // Lacrosse
            venue: this.getLacrosseVenue(game.home)
          });
        });
      });
      
      // Analyze schedule quality
      const analysis = this.analyzeLacrosseSchedule(games);
      
      const schedule = {
        schedule_id: `lax_${Date.now()}`,
        sport_id: 13,
        sport_name: 'Lacrosse',
        games: games,
        total_games: games.length,
        weeks: 5,
        analysis: analysis,
        metadata: {
          constraint_solver: true,
          algorithm: 'CSP with backtracking',
          constraints_satisfied: analysis.constraintsSatisfied
        }
      };
      
      logger.info(`[${requestId}] Lacrosse schedule generated successfully`, {
        games: schedule.total_games,
        analysis: analysis
      });
      
      return schedule;
      
    } catch (error) {
      logger.error(`[${requestId}] Lacrosse schedule generation failed:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate target home/away distribution for next year
   * @private
   */
  calculateTargetDistribution(previousYear, targetYear) {
    const targets = {};
    
    if (previousYear && previousYear.analysis) {
      // Flip from previous year
      Object.entries(previousYear.analysis.homeAwayDistribution).forEach(([team, dist]) => {
        targets[team] = {
          home: dist.home === 3 ? 2 : 3,
          away: dist.away === 3 ? 2 : 3
        };
      });
    } else {
      // Use default alternating pattern
      const year = parseInt(targetYear);
      const isEvenYear = year % 2 === 0;
      
      targets.CIN = isEvenYear ? { home: 3, away: 2 } : { home: 2, away: 3 };
      targets.UF = isEvenYear ? { home: 2, away: 3 } : { home: 3, away: 2 };
      targets.ASU = isEvenYear ? { home: 2, away: 3 } : { home: 3, away: 2 };
      targets.COL = isEvenYear ? { home: 2, away: 3 } : { home: 3, away: 2 };
      targets.UCD = isEvenYear ? { home: 3, away: 2 } : { home: 2, away: 3 };
      targets.SDSU = isEvenYear ? { home: 3, away: 2 } : { home: 2, away: 3 };
    }
    
    return targets;
  }
  
  /**
   * Get lacrosse venue for team
   * @private
   */
  getLacrosseVenue(team) {
    const venues = {
      'CIN': 'Gettler Stadium',
      'UF': 'Donald R. Dizney Stadium',
      'ASU': 'Sun Devil Soccer Stadium',
      'COL': 'Prentup Field',
      'UCD': 'Aggie Stadium',
      'SDSU': 'SDSU Lacrosse Field'
    };
    
    return venues[team] || 'TBD';
  }
  
  /**
   * Analyze lacrosse schedule quality
   * @private
   */
  analyzeLacrosseSchedule(games) {
    const teams = ['CIN', 'UF', 'ASU', 'COL', 'UCD', 'SDSU'];
    const analysis = {
      homeAwayDistribution: {},
      consecutiveGames: {},
      gamesPerWeek: {},
      byeWeeks: {},
      constraintsSatisfied: true
    };
    
    // Initialize counters
    teams.forEach(team => {
      analysis.homeAwayDistribution[team] = { home: 0, away: 0 };
      analysis.consecutiveGames[team] = { maxConsecHome: 0, maxConsecAway: 0 };
      analysis.byeWeeks[team] = 0;
    });
    
    // Count games per week
    for (let week = 1; week <= 5; week++) {
      const weekGames = games.filter(g => g.week === week);
      analysis.gamesPerWeek[`week${week}`] = weekGames.length;
    }
    
    // Analyze each team
    teams.forEach(team => {
      const teamGames = games.filter(g => g.home_team === team || g.away_team === team);
      
      // Count home/away
      teamGames.forEach(game => {
        if (game.home_team === team) {
          analysis.homeAwayDistribution[team].home++;
        } else {
          analysis.homeAwayDistribution[team].away++;
        }
      });
      
      // Check consecutive games
      let consecHome = 0;
      let consecAway = 0;
      let maxConsecHome = 0;
      let maxConsecAway = 0;
      
      // Sort by week
      teamGames.sort((a, b) => a.week - b.week);
      
      teamGames.forEach(game => {
        if (game.home_team === team) {
          consecHome++;
          consecAway = 0;
          maxConsecHome = Math.max(maxConsecHome, consecHome);
        } else {
          consecAway++;
          consecHome = 0;
          maxConsecAway = Math.max(maxConsecAway, consecAway);
        }
      });
      
      analysis.consecutiveGames[team].maxConsecHome = maxConsecHome;
      analysis.consecutiveGames[team].maxConsecAway = maxConsecAway;
      
      // Check if constraints violated
      if (maxConsecAway > 2) {
        analysis.constraintsSatisfied = false;
      }
      
      // Count bye weeks (lacrosse has no bye weeks in 5-week format)
      analysis.byeWeeks[team] = 0;
    });
    
    // Calculate totals
    analysis.totalGames = games.length;
    analysis.gamesPerTeam = games.length * 2 / teams.length;
    analysis.weeksPlayed = 5;
    
    return analysis;
  }
  
  /**
   * Save schedule to database
   * @private
   */
  async saveSchedule(schedule, userId) {
    try {
      // Implementation would depend on your database schema
      // This is a placeholder for the actual save logic
      logger.info('Saving schedule to database');
      
      // For now, just return the schedule with a mock ID
      return {
        id: schedule.schedule_id,
        ...schedule,
        created_by: userId,
        created_at: new Date()
      };
    } catch (error) {
      logger.error('Error saving schedule:', error);
      throw error;
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
   * Get schools from the database
   * 
   * @param {string} conference - Conference filter
   * @returns {Promise<Array>} Schools data
   */
  async getSchools(conference = 'big12') {
    try {
      logger.info(`Getting schools for conference: ${conference}`);
      
      // Use the Neon database to get schools
      const neonDB = require('../src/config/neon-database');
      
      if (!neonDB.isConnected) {
        logger.warn('Database not connected, returning default schools');
        return this._getDefaultSchools(conference);
      }
      
      try {
        const schools = await neonDB.getSchools();
        
        if (schools && schools.length > 0) {
          logger.info(`Found ${schools.length} schools in database`);
          
          // Filter by conference if needed
          let filteredSchools = schools;
          if (conference && conference !== 'all') {
            filteredSchools = schools.filter(school => 
              school.conference === conference || 
              school.conference === conference.toLowerCase() ||
              school.conference === conference.toUpperCase()
            );
          }
          
          return filteredSchools;
        }
      } catch (dbError) {
        logger.warn(`Database query failed: ${dbError.message}, using defaults`);
      }
      
      // Fallback to default schools
      return this._getDefaultSchools(conference);
    } catch (error) {
      logger.error(`Error getting schools: ${error.message}`);
      return this._getDefaultSchools(conference);
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
      'wrestling': ['arizona-state', 'iowa-state', 'oklahoma-state', 'west-virginia', 'air-force', 'cal-baptist', 'missouri', 'north-dakota-state', 'northern-colorado', 'northern-iowa', 'oklahoma', 'south-dakota-state', 'utah-valley', 'wyoming'], // 4 Big 12 teams + 10 affiliates
      'gymnastics': ['arizona', 'arizona-state', 'byu', 'iowa-state', 'utah', 'west-virginia', 'denver'], // 6 Big 12 teams + 1 affiliate
      'lacrosse': ['arizona-state', 'cincinnati', 'colorado', 'florida', 'san-diego-state', 'uc-davis'], // 3 Big 12 teams + 3 affiliates
      'equestrian': ['baylor', 'oklahoma-state', 'tcu', 'fresno'], // 3 Big 12 teams + 1 affiliate
      'beach-volleyball': ['arizona', 'arizona-state', 'tcu'], // 3 Big 12 teams
      'rowing': ['kansas', 'kansas-state', 'ucf', 'west-virginia', 'old-dominion', 'tulsa'], // 4 Big 12 teams + 2 affiliates
      'tennis': ['arizona', 'arizona-state', 'byu', 'baylor', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah'],
      'mens-tennis': ['arizona', 'arizona-state', 'byu', 'baylor', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah'],
      'womens-tennis': ['arizona', 'arizona-state', 'byu', 'baylor', 'cincinnati', 'colorado', 'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state', 'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia']
    };

    const sportKey = sport.toLowerCase().replace(/\s+/g, '-');
    const participatingTeamIds = sportParticipation[sportKey] || sportParticipation['football']; // default to football teams
    
    return teams.filter(team => participatingTeamIds.includes(team.id));
  }

  /**
   * Get default schools for a conference
   * 
   * @param {string} conference - Conference name
   * @returns {Array} Default schools
   * @private
   */
  _getDefaultSchools(conference = 'big12') {
    // Big 12 Conference schools with necessary data for frontend display
    const big12Schools = [
      {
        school_id: 1,
        school: 'Arizona',
        short_display: 'Arizona',
        primary_color: '#AB0520',
        secondary_color: '#0C234B',
        mascot: 'Wildcats',
        location: 'Tucson, AZ',
        website: 'https://arizonawildcats.com',
        founded_year: 1885,
        enrollment: 47000,
        conference: 'big12',
        division: 'FBS',
        city: 'Tucson',
        state: 'Arizona'
      },
      {
        school_id: 2,
        school: 'Arizona State',
        short_display: 'Arizona State',
        primary_color: '#8C1D40',
        secondary_color: '#FFC627',
        mascot: 'Sun Devils',
        location: 'Tempe, AZ',
        website: 'https://thesundevils.com',
        founded_year: 1885,
        enrollment: 80000,
        conference: 'big12',
        division: 'FBS',
        city: 'Tempe',
        state: 'Arizona'
      },
      {
        school_id: 3,
        school: 'Baylor',
        short_display: 'Baylor',
        primary_color: '#003015',
        secondary_color: '#FFB81C',
        mascot: 'Bears',
        location: 'Waco, TX',
        website: 'https://baylorbears.com',
        founded_year: 1845,
        enrollment: 20000,
        conference: 'big12',
        division: 'FBS',
        city: 'Waco',
        state: 'Texas'
      },
      {
        school_id: 4,
        school: 'BYU',
        short_display: 'BYU',
        primary_color: '#002E5D',
        secondary_color: '#FFFFFF',
        mascot: 'Cougars',
        location: 'Provo, UT',
        website: 'https://byucougars.com',
        founded_year: 1875,
        enrollment: 33000,
        conference: 'big12',
        division: 'FBS',
        city: 'Provo',
        state: 'Utah'
      },
      {
        school_id: 5,
        school: 'UCF',
        short_display: 'UCF',
        primary_color: '#000000',
        secondary_color: '#FFC904',
        mascot: 'Knights',
        location: 'Orlando, FL',
        website: 'https://ucfknights.com',
        founded_year: 1963,
        enrollment: 68000,
        conference: 'big12',
        division: 'FBS',
        city: 'Orlando',
        state: 'Florida'
      },
      {
        school_id: 6,
        school: 'Cincinnati',
        short_display: 'Cincinnati',
        primary_color: '#E00122',
        secondary_color: '#000000',
        mascot: 'Bearcats',
        location: 'Cincinnati, OH',
        website: 'https://gobearcats.com',
        founded_year: 1819,
        enrollment: 46000,
        conference: 'big12',
        division: 'FBS',
        city: 'Cincinnati',
        state: 'Ohio'
      },
      {
        school_id: 7,
        school: 'Colorado',
        short_display: 'Colorado',
        primary_color: '#000000',
        secondary_color: '#CFB87C',
        mascot: 'Buffaloes',
        location: 'Boulder, CO',
        website: 'https://cubuffs.com',
        founded_year: 1876,
        enrollment: 35000,
        conference: 'big12',
        division: 'FBS',
        city: 'Boulder',
        state: 'Colorado'
      },
      {
        school_id: 8,
        school: 'Houston',
        short_display: 'Houston',
        primary_color: '#C8102E',
        secondary_color: '#FFFFFF',
        mascot: 'Cougars',
        location: 'Houston, TX',
        website: 'https://uhcougars.com',
        founded_year: 1927,
        enrollment: 47000,
        conference: 'big12',
        division: 'FBS',
        city: 'Houston',
        state: 'Texas'
      },
      {
        school_id: 9,
        school: 'Iowa State',
        short_display: 'Iowa State',
        primary_color: '#C8102E',
        secondary_color: '#F1BE48',
        mascot: 'Cyclones',
        location: 'Ames, IA',
        website: 'https://cyclones.com',
        founded_year: 1858,
        enrollment: 31000,
        conference: 'big12',
        division: 'FBS',
        city: 'Ames',
        state: 'Iowa'
      },
      {
        school_id: 10,
        school: 'Kansas',
        short_display: 'Kansas',
        primary_color: '#0051BA',
        secondary_color: '#E8000D',
        mascot: 'Jayhawks',
        location: 'Lawrence, KS',
        website: 'https://kuathletics.com',
        founded_year: 1865,
        enrollment: 28000,
        conference: 'big12',
        division: 'FBS',
        city: 'Lawrence',
        state: 'Kansas'
      },
      {
        school_id: 11,
        school: 'Kansas State',
        short_display: 'Kansas State',
        primary_color: '#512888',
        secondary_color: '#FFFFFF',
        mascot: 'Wildcats',
        location: 'Manhattan, KS',
        website: 'https://kstatesports.com',
        founded_year: 1863,
        enrollment: 24000,
        conference: 'big12',
        division: 'FBS',
        city: 'Manhattan',
        state: 'Kansas'
      },
      {
        school_id: 12,
        school: 'Oklahoma State',
        short_display: 'Oklahoma State',
        primary_color: '#FF7300',
        secondary_color: '#000000',
        mascot: 'Cowboys',
        location: 'Stillwater, OK',
        website: 'https://okstate.com',
        founded_year: 1890,
        enrollment: 25000,
        conference: 'big12',
        division: 'FBS',
        city: 'Stillwater',
        state: 'Oklahoma'
      },
      {
        school_id: 13,
        school: 'TCU',
        short_display: 'TCU',
        primary_color: '#4D1979',
        secondary_color: '#A7A8AA',
        mascot: 'Horned Frogs',
        location: 'Fort Worth, TX',
        website: 'https://gofrogs.com',
        founded_year: 1873,
        enrollment: 11000,
        conference: 'big12',
        division: 'FBS',
        city: 'Fort Worth',
        state: 'Texas'
      },
      {
        school_id: 14,
        school: 'Texas Tech',
        short_display: 'Texas Tech',
        primary_color: '#CC0000',
        secondary_color: '#000000',
        mascot: 'Red Raiders',
        location: 'Lubbock, TX',
        website: 'https://texastech.com',
        founded_year: 1923,
        enrollment: 40000,
        conference: 'big12',
        division: 'FBS',
        city: 'Lubbock',
        state: 'Texas'
      },
      {
        school_id: 15,
        school: 'Utah',
        short_display: 'Utah',
        primary_color: '#CC0000',
        secondary_color: '#FFFFFF',
        mascot: 'Utes',
        location: 'Salt Lake City, UT',
        website: 'https://utahutes.com',
        founded_year: 1850,
        enrollment: 33000,
        conference: 'big12',
        division: 'FBS',
        city: 'Salt Lake City',
        state: 'Utah'
      },
      {
        school_id: 16,
        school: 'West Virginia',
        short_display: 'West Virginia',
        primary_color: '#002855',
        secondary_color: '#EAAA00',
        mascot: 'Mountaineers',
        location: 'Morgantown, WV',
        website: 'https://wvusports.com',
        founded_year: 1867,
        enrollment: 29000,
        conference: 'big12',
        division: 'FBS',
        city: 'Morgantown',
        state: 'West Virginia'
      }
    ];

    // Filter by conference if not Big 12
    let schools = conference.toLowerCase() === 'big12' ? big12Schools : [];
    
    return schools;
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
  
  /**
   * Assign dates to matchups based on sport preferences
   * @private
   */
  async assignDatesToMatchups(matchups, startDate, endDate, datePreferences, constraints) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const { daysOfWeek, preferredStartTimes, avoidDates } = datePreferences;
    
    // Get available dates
    const availableDates = [];
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      // Check if day is allowed and not in avoid list
      if (daysOfWeek.includes(dayOfWeek) && 
          (!avoidDates || !avoidDates.includes(dateStr))) {
        availableDates.push(new Date(current));
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Group games by travel groups if they exist (for basketball travel partners)
    const travelGroups = {};
    const regularGames = [];
    
    matchups.forEach(matchup => {
      if (matchup.travel_group) {
        if (!travelGroups[matchup.travel_group]) {
          travelGroups[matchup.travel_group] = [];
        }
        travelGroups[matchup.travel_group].push(matchup);
      } else {
        regularGames.push(matchup);
      }
    });
    
    // Assign dates to games
    const datedGames = [];
    let dateIndex = 0;
    let gamesOnCurrentDate = 0;
    const gamesPerDate = Math.ceil(matchups.length / availableDates.length);
    
    // First, schedule travel groups together on consecutive days
    Object.values(travelGroups).forEach(groupGames => {
      if (groupGames.length === 2) {
        // Find two consecutive available dates
        for (let i = 0; i < availableDates.length - 1; i++) {
          const date1 = availableDates[i];
          const date2 = availableDates[i + 1];
          const daysBetween = (date2 - date1) / (1000 * 60 * 60 * 24);
          
          // Check if dates are consecutive (considering weekends)
          if (daysBetween <= 3) { // Allow up to 3 days for weekend gaps
            // Assign first game
            const timeIndex1 = gamesOnCurrentDate % preferredStartTimes.length;
            datedGames.push({
              ...groupGames[0],
              date: date1.toISOString().split('T')[0],
              time: preferredStartTimes[timeIndex1],
              datetime: new Date(`${date1.toISOString().split('T')[0]}T${preferredStartTimes[timeIndex1]}`).toISOString()
            });
            
            // Assign second game
            const timeIndex2 = 0; // Reset for new date
            datedGames.push({
              ...groupGames[1],
              date: date2.toISOString().split('T')[0],
              time: preferredStartTimes[timeIndex2],
              datetime: new Date(`${date2.toISOString().split('T')[0]}T${preferredStartTimes[timeIndex2]}`).toISOString()
            });
            
            // Mark these dates as used (simplified - in production would track better)
            availableDates[i] = null;
            availableDates[i + 1] = null;
            break;
          }
        }
      }
    });
    
    // Filter out used dates
    const remainingDates = availableDates.filter(date => date !== null);
    
    // Schedule remaining regular games
    dateIndex = 0;
    gamesOnCurrentDate = 0;
    const remainingGamesPerDate = Math.ceil(regularGames.length / remainingDates.length);
    
    regularGames.forEach(matchup => {
      if (gamesOnCurrentDate >= remainingGamesPerDate && dateIndex < remainingDates.length - 1) {
        dateIndex++;
        gamesOnCurrentDate = 0;
      }
      
      const gameDate = remainingDates[dateIndex];
      const timeIndex = gamesOnCurrentDate % preferredStartTimes.length;
      const gameTime = preferredStartTimes[timeIndex];
      
      gamesOnCurrentDate++;
      
      datedGames.push({
        ...matchup,
        date: gameDate.toISOString().split('T')[0],
        time: gameTime,
        datetime: new Date(`${gameDate.toISOString().split('T')[0]}T${gameTime}`).toISOString()
      });
    });
    
    // Sort by date
    return datedGames.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }
  
  /**
   * Assign venues to games based on home team
   * @private
   */
  async assignVenuesToGames(games) {
    return games.map(game => {
      // Get venue for home team
      const venues = Big12DataService.getVenues({
        school_id: game.home_team.school_id,
        sport_id: game.sport_id
      });
      
      const venue = venues[0]; // Take first compatible venue
      
      return {
        ...game,
        venue_id: venue?.venue_id || null,
        venue: venue || { name: 'TBD', city: 'TBD', state: 'TBD' },
        location: venue ? `${venue.city}, ${venue.state}` : 'TBD'
      };
    });
  }
}

module.exports = FTBuilderEngine;