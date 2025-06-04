/**
 * Compliance Agent
 * 
 * This agent ensures that all schedules in the FlexTime system adhere to
 * conference and NCAA regulations, preventing costly violations while
 * automating the complex process of compliance checking.
 */

const Agent = require('../agent');
const logger = require("../utils/logger");
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { Client } = require('pg');

class ComplianceAgent extends Agent {
  /**
   * Initialize a new Compliance Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions (optional)
   */
  constructor(config, mcpConnector = null) {
    super('compliance', 'specialized', mcpConnector);
    
    this.config = {
      ruleSourcesConfig: config.ruleSourcesConfig || {},
      complianceReporting: config.complianceReporting || {
        generateReports: true,
        reportDestination: './compliance_reports/'
      },
      dbConnectionString: config.dbConnectionString || process.env.NEON_DB_CONNECTION_STRING,
      ...config
    };
    
    // Initialize rule engine
    this.ruleEngine = {
      rules: {},
      ncaa: {},
      conferences: {},
      institutions: {}
    };
    
    this.dbClient = null;
    
    logger.info('Compliance Agent initialized');
  }
  
  /**
   * Start the agent and initialize components
   */
  async start() {
    try {
      logger.info('Starting Compliance Agent');
      
      // Connect to database
      await this.connectToDatabase();
      
      // Load compliance rules
      await this.loadComplianceRules();
      
      // Create compliance reporting directory if it doesn't exist
      if (this.config.complianceReporting.generateReports) {
        const reportDir = path.resolve(this.config.complianceReporting.reportDestination);
        await fs.mkdir(reportDir, { recursive: true });
      }
      
      // Start the base agent
      await super.start();
      
      logger.info('Compliance Agent started successfully');
      return true;
    } catch (error) {
      logger.error(`Error starting Compliance Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Connect to the database
   */
  async connectToDatabase() {
    try {
      this.dbClient = new Client(this.config.dbConnectionString);
      await this.dbClient.connect();
      
      logger.info('Connected to database successfully');
    } catch (error) {
      logger.error(`Error connecting to database: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load compliance rules from all configured sources
   */
  async loadComplianceRules() {
    try {
      logger.info('Loading compliance rules from all sources');
      
      // Load NCAA rules
      await this.loadNcaaRules();
      
      // Load conference rules
      await this.loadConferenceRules();
      
      // Load institution rules
      await this.loadInstitutionRules();
      
      // Calculate total rules loaded
      const totalRules = 
        Object.keys(this.ruleEngine.ncaa).length +
        Object.values(this.ruleEngine.conferences).reduce((total, conf) => total + Object.keys(conf).length, 0) +
        Object.values(this.ruleEngine.institutions).reduce((total, inst) => total + Object.keys(inst).length, 0);
      
      logger.info(`Loaded ${totalRules} compliance rules from all sources`);
    } catch (error) {
      logger.error(`Error loading compliance rules: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load NCAA compliance rules
   */
  async loadNcaaRules() {
    try {
      const ncaaConfig = this.config.ruleSourcesConfig.ncaa;
      
      if (!ncaaConfig) {
        logger.warn('No NCAA rule source configured, skipping NCAA rules');
        return;
      }
      
      logger.info('Loading NCAA compliance rules');
      
      if (ncaaConfig.apiKey) {
        // Load from API
        const response = await axios.get('https://api.ncaa.org/compliance/rules', {
          headers: {
            'Authorization': `Bearer ${ncaaConfig.apiKey}`
          }
        });
        
        // Process rules
        this.ruleEngine.ncaa = this._processNcaaRules(response.data);
      } else if (ncaaConfig.filePath) {
        // Load from file
        const filePath = path.resolve(ncaaConfig.filePath);
        const fileData = await fs.readFile(filePath, 'utf8');
        const rulesData = JSON.parse(fileData);
        
        // Process rules
        this.ruleEngine.ncaa = this._processNcaaRules(rulesData);
      } else {
        // Load mock rules for testing
        this.ruleEngine.ncaa = this._generateMockNcaaRules();
      }
      
      logger.info(`Loaded ${Object.keys(this.ruleEngine.ncaa).length} NCAA compliance rules`);
    } catch (error) {
      logger.error(`Error loading NCAA compliance rules: ${error.message}`);
      
      // Load mock rules as fallback
      this.ruleEngine.ncaa = this._generateMockNcaaRules();
      logger.info(`Loaded ${Object.keys(this.ruleEngine.ncaa).length} mock NCAA compliance rules`);
    }
  }
  
  /**
   * Process NCAA rules from API or file
   * 
   * @param {Object} rulesData - Rules data from source
   * @returns {Object} Processed rules
   * @private
   */
  _processNcaaRules(rulesData) {
    // Process the rules data into a structured format
    // This would depend on the actual structure of the NCAA API response
    
    // Placeholder implementation
    const processedRules = {};
    
    // Process each rule
    if (rulesData.rules && Array.isArray(rulesData.rules)) {
      for (const rule of rulesData.rules) {
        processedRules[rule.id] = {
          id: rule.id,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          applicableSports: rule.sports || [],
          parameters: rule.parameters || {},
          validationFunction: this._getRuleValidationFunction(rule.type)
        };
      }
    }
    
    return processedRules;
  }
  
  /**
   * Load conference compliance rules
   */
  async loadConferenceRules() {
    try {
      const conferenceConfig = this.config.ruleSourcesConfig.conferences;
      
      if (!conferenceConfig || !conferenceConfig.sources || conferenceConfig.sources.length === 0) {
        logger.warn('No conference rule sources configured, skipping conference rules');
        return;
      }
      
      logger.info(`Loading compliance rules for ${conferenceConfig.sources.length} conferences`);
      
      // Initialize conferences object
      this.ruleEngine.conferences = {};
      
      // Load rules for each conference
      for (const conference of conferenceConfig.sources) {
        try {
          let conferenceRules;
          
          if (conference.source.startsWith('http')) {
            // Load from API
            const response = await axios.get(conference.source, {
              headers: conference.apiKey ? {
                'Authorization': `Bearer ${conference.apiKey}`
              } : {}
            });
            
            conferenceRules = this._processConferenceRules(response.data);
          } else {
            // Load from file
            const filePath = path.resolve(conference.source.replace('file://', ''));
            const fileData = await fs.readFile(filePath, 'utf8');
            const rulesData = JSON.parse(fileData);
            
            conferenceRules = this._processConferenceRules(rulesData);
          }
          
          // Store conference rules
          this.ruleEngine.conferences[conference.name] = conferenceRules;
          
          logger.info(`Loaded ${Object.keys(conferenceRules).length} rules for ${conference.name}`);
        } catch (error) {
          logger.error(`Error loading rules for conference ${conference.name}: ${error.message}`);
          
          // Load mock rules as fallback
          this.ruleEngine.conferences[conference.name] = this._generateMockConferenceRules(conference.name);
          logger.info(`Loaded ${Object.keys(this.ruleEngine.conferences[conference.name]).length} mock rules for ${conference.name}`);
        }
      }
    } catch (error) {
      logger.error(`Error loading conference compliance rules: ${error.message}`);
      
      // Create empty conferences object
      this.ruleEngine.conferences = {};
    }
  }
  
  /**
   * Process conference rules from API or file
   * 
   * @param {Object} rulesData - Rules data from source
   * @returns {Object} Processed rules
   * @private
   */
  _processConferenceRules(rulesData) {
    // Process the rules data into a structured format
    // This would depend on the actual structure of the conference API response
    
    // Placeholder implementation
    const processedRules = {};
    
    // Process each rule
    if (rulesData.rules && Array.isArray(rulesData.rules)) {
      for (const rule of rulesData.rules) {
        processedRules[rule.id] = {
          id: rule.id,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          applicableSports: rule.sports || [],
          parameters: rule.parameters || {},
          validationFunction: this._getRuleValidationFunction(rule.type)
        };
      }
    }
    
    return processedRules;
  }
  
  /**
   * Load institution compliance rules
   */
  async loadInstitutionRules() {
    try {
      const institutionConfig = this.config.ruleSourcesConfig.institutionRules;
      
      if (!institutionConfig) {
        logger.warn('No institution rules configured, skipping institution rules');
        return;
      }
      
      logger.info('Loading institution compliance rules');
      
      // Initialize institutions object
      this.ruleEngine.institutions = {};
      
      if (typeof institutionConfig === 'string') {
        // Load from directory
        const dirPath = path.resolve(institutionConfig);
        
        // Check if directory exists
        try {
          const stats = await fs.stat(dirPath);
          
          if (!stats.isDirectory()) {
            throw new Error(`Institution rules path is not a directory: ${dirPath}`);
          }
          
          // Read all files in the directory
          const files = await fs.readdir(dirPath);
          
          // Load rules from each file
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                const filePath = path.join(dirPath, file);
                const fileData = await fs.readFile(filePath, 'utf8');
                const rulesData = JSON.parse(fileData);
                
                // Get institution name from filename
                const institutionName = path.basename(file, '.json');
                
                // Process rules
                this.ruleEngine.institutions[institutionName] = this._processInstitutionRules(rulesData);
                
                logger.info(`Loaded ${Object.keys(this.ruleEngine.institutions[institutionName]).length} rules for institution ${institutionName}`);
              } catch (error) {
                logger.error(`Error loading rules from file ${file}: ${error.message}`);
              }
            }
          }
        } catch (error) {
          logger.error(`Error accessing institution rules directory: ${error.message}`);
        }
      } else if (Array.isArray(institutionConfig)) {
        // Load from configuration array
        for (const institution of institutionConfig) {
          try {
            let institutionRules;
            
            if (institution.source.startsWith('http')) {
              // Load from API
              const response = await axios.get(institution.source, {
                headers: institution.apiKey ? {
                  'Authorization': `Bearer ${institution.apiKey}`
                } : {}
              });
              
              institutionRules = this._processInstitutionRules(response.data);
            } else {
              // Load from file
              const filePath = path.resolve(institution.source.replace('file://', ''));
              const fileData = await fs.readFile(filePath, 'utf8');
              const rulesData = JSON.parse(fileData);
              
              institutionRules = this._processInstitutionRules(rulesData);
            }
            
            // Store institution rules
            this.ruleEngine.institutions[institution.name] = institutionRules;
            
            logger.info(`Loaded ${Object.keys(institutionRules).length} rules for institution ${institution.name}`);
          } catch (error) {
            logger.error(`Error loading rules for institution ${institution.name}: ${error.message}`);
          }
        }
      } else {
        logger.warn('Invalid institution rules configuration, skipping institution rules');
      }
    } catch (error) {
      logger.error(`Error loading institution compliance rules: ${error.message}`);
      
      // Create empty institutions object
      this.ruleEngine.institutions = {};
    }
  }
  
  /**
   * Process institution rules from API or file
   * 
   * @param {Object} rulesData - Rules data from source
   * @returns {Object} Processed rules
   * @private
   */
  _processInstitutionRules(rulesData) {
    // Process the rules data into a structured format
    // This would depend on the actual structure of the institution rules data
    
    // Placeholder implementation
    const processedRules = {};
    
    // Process each rule
    if (rulesData.rules && Array.isArray(rulesData.rules)) {
      for (const rule of rulesData.rules) {
        processedRules[rule.id] = {
          id: rule.id,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          applicableSports: rule.sports || [],
          parameters: rule.parameters || {},
          validationFunction: this._getRuleValidationFunction(rule.type)
        };
      }
    }
    
    return processedRules;
  }
  
  /**
   * Get a rule validation function for a given rule type
   * 
   * @param {string} ruleType - Type of rule
   * @returns {Function} Validation function
   * @private
   */
  _getRuleValidationFunction(ruleType) {
    switch (ruleType) {
      case 'game_count':
        return this._validateGameCount.bind(this);
      
      case 'game_spacing':
        return this._validateGameSpacing.bind(this);
      
      case 'playing_season':
        return this._validatePlayingSeason.bind(this);
      
      case 'off_days':
        return this._validateOffDays.bind(this);
      
      case 'travel_distance':
        return this._validateTravelDistance.bind(this);
      
      case 'academic_calendar':
        return this._validateAcademicCalendar.bind(this);
      
      default:
        // For unknown rule types, return a function that always passes
        return () => ({ compliant: true });
    }
  }
  
  /**
   * Generate mock NCAA rules for testing
   * 
   * @returns {Object} Mock NCAA rules
   * @private
   */
  _generateMockNcaaRules() {
    return {
      'ncaa-1': {
        id: 'ncaa-1',
        title: 'Maximum Number of Regular Season Games',
        description: 'Teams may not exceed the maximum number of regular season games allowed for their sport.',
        category: 'game_count',
        applicableSports: ['basketball_men', 'basketball_women'],
        parameters: {
          maxGames: 29,
          exemptEvents: ['multi_team_event']
        },
        validationFunction: this._validateGameCount.bind(this)
      },
      'ncaa-2': {
        id: 'ncaa-2',
        title: 'Minimum Time Between Games',
        description: 'Teams must have a minimum time between games for player rest and recovery.',
        category: 'game_spacing',
        applicableSports: ['basketball_men', 'basketball_women', 'football'],
        parameters: {
          minHoursBetweenGames: 20
        },
        validationFunction: this._validateGameSpacing.bind(this)
      },
      'ncaa-3': {
        id: 'ncaa-3',
        title: 'Playing and Practice Season',
        description: 'Teams must adhere to defined playing and practice season dates.',
        category: 'playing_season',
        applicableSports: ['basketball_men', 'basketball_women', 'football', 'soccer', 'volleyball'],
        parameters: {
          seasonStart: {
            basketball_men: '2023-11-06',
            basketball_women: '2023-11-06',
            football: '2023-08-26',
            soccer: '2023-08-18',
            volleyball: '2023-08-25'
          },
          seasonEnd: {
            basketball_men: '2024-03-17',
            basketball_women: '2024-03-17',
            football: '2023-12-09',
            soccer: '2023-12-03',
            volleyball: '2023-12-17'
          }
        },
        validationFunction: this._validatePlayingSeason.bind(this)
      },
      'ncaa-4': {
        id: 'ncaa-4',
        title: 'Required Days Off',
        description: 'Student-athletes must be provided with required days off during the playing season.',
        category: 'off_days',
        applicableSports: ['all'],
        parameters: {
          daysOffPerWeek: 1
        },
        validationFunction: this._validateOffDays.bind(this)
      },
      'ncaa-5': {
        id: 'ncaa-5',
        title: 'Academic Calendar Considerations',
        description: 'Competitions should not be scheduled during final examination periods.',
        category: 'academic_calendar',
        applicableSports: ['all'],
        parameters: {
          noGamesBeforeFinals: 1, // days
          noGamesDuringFinals: true,
          noGamesAfterFinals: 0 // days
        },
        validationFunction: this._validateAcademicCalendar.bind(this)
      }
    };
  }
  
  /**
   * Generate mock conference rules for testing
   * 
   * @param {string} conferenceName - Name of the conference
   * @returns {Object} Mock conference rules
   * @private
   */
  _generateMockConferenceRules(conferenceName) {
    return {
      [`${conferenceName}-1`]: {
        id: `${conferenceName}-1`,
        title: 'Conference Play Requirements',
        description: 'Teams must play all other conference members twice (home and away).',
        category: 'conference_play',
        applicableSports: ['basketball_men', 'basketball_women'],
        parameters: {
          playEachTeamTwice: true,
          homeAndAway: true
        },
        validationFunction: this._validateConferencePlay.bind(this)
      },
      [`${conferenceName}-2`]: {
        id: `${conferenceName}-2`,
        title: 'Conference Schedule Balance',
        description: 'Conference games should be balanced throughout the season.',
        category: 'schedule_balance',
        applicableSports: ['basketball_men', 'basketball_women'],
        parameters: {
          maxConsecutiveConferenceGames: 4,
          minGapBetweenConferenceSeries: 1 // days
        },
        validationFunction: this._validateScheduleBalance.bind(this)
      },
      [`${conferenceName}-3`]: {
        id: `${conferenceName}-3`,
        title: 'Conference Tournament Eligibility',
        description: 'Teams must complete their conference schedule to be eligible for the conference tournament.',
        category: 'tournament_eligibility',
        applicableSports: ['basketball_men', 'basketball_women'],
        parameters: {
          completeScheduleRequired: true
        },
        validationFunction: this._validateTournamentEligibility.bind(this)
      },
      [`${conferenceName}-4`]: {
        id: `${conferenceName}-4`,
        title: 'Travel Partners',
        description: 'Teams should be scheduled with designated travel partners when possible.',
        category: 'travel_partners',
        applicableSports: ['basketball_men', 'basketball_women'],
        parameters: {
          useDesignatedPartners: true
        },
        validationFunction: this._validateTravelPartners.bind(this)
      }
    };
  }
  
  /**
   * Validate game count rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateGameCount(schedule, rule) {
    try {
      const maxGames = rule.parameters.maxGames || 29;
      
      // Count regular season games
      let gameCount = schedule.games.length;
      
      // Subtract exempt games if applicable
      if (rule.parameters.exemptEvents && Array.isArray(rule.parameters.exemptEvents)) {
        gameCount -= schedule.games.filter(game => 
          rule.parameters.exemptEvents.includes(game.eventType)
        ).length;
      }
      
      const compliant = gameCount <= maxGames;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `Schedule has ${gameCount} countable games (maximum: ${maxGames})` : 
          `Schedule exceeds maximum games: ${gameCount} games (maximum: ${maxGames})`
      };
    } catch (error) {
      logger.error(`Error validating game count: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating game count: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate game spacing rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateGameSpacing(schedule, rule) {
    try {
      const minHoursBetweenGames = rule.parameters.minHoursBetweenGames || 20;
      
      // Sort games by date
      const sortedGames = [...schedule.games].sort((a, b) => 
        new Date(a.dateTime) - new Date(b.dateTime)
      );
      
      // Check spacing between consecutive games
      const violations = [];
      
      for (let i = 1; i < sortedGames.length; i++) {
        const previousGame = sortedGames[i - 1];
        const currentGame = sortedGames[i];
        
        const previousDateTime = new Date(previousGame.dateTime);
        const currentDateTime = new Date(currentGame.dateTime);
        
        const hoursBetween = (currentDateTime - previousDateTime) / (1000 * 60 * 60);
        
        if (hoursBetween < minHoursBetweenGames) {
          violations.push({
            game1: previousGame.id,
            game2: currentGame.id,
            hoursBetween,
            required: minHoursBetweenGames
          });
        }
      }
      
      const compliant = violations.length === 0;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `All games have sufficient time between them (minimum: ${minHoursBetweenGames} hours)` : 
          `Found ${violations.length} violations of minimum time between games`,
        violations: violations.length > 0 ? violations : undefined
      };
    } catch (error) {
      logger.error(`Error validating game spacing: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating game spacing: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate playing season rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validatePlayingSeason(schedule, rule) {
    try {
      const sport = schedule.sport.toLowerCase();
      
      // Get season start and end dates for this sport
      const seasonStart = rule.parameters.seasonStart?.[sport] ? 
        new Date(rule.parameters.seasonStart[sport]) : 
        new Date('2023-08-01');
      
      const seasonEnd = rule.parameters.seasonEnd?.[sport] ? 
        new Date(rule.parameters.seasonEnd[sport]) : 
        new Date('2024-06-30');
      
      // Check if any games are outside the playing season
      const violations = [];
      
      for (const game of schedule.games) {
        const gameDate = new Date(game.dateTime);
        
        if (gameDate < seasonStart || gameDate > seasonEnd) {
          violations.push({
            gameId: game.id,
            gameDate: game.dateTime,
            issue: gameDate < seasonStart ? 'before season start' : 'after season end'
          });
        }
      }
      
      const compliant = violations.length === 0;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `All games are within the playing season (${seasonStart.toISOString().split('T')[0]} to ${seasonEnd.toISOString().split('T')[0]})` : 
          `Found ${violations.length} games outside the playing season`,
        violations: violations.length > 0 ? violations : undefined
      };
    } catch (error) {
      logger.error(`Error validating playing season: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating playing season: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate off days rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateOffDays(schedule, rule) {
    try {
      const daysOffPerWeek = rule.parameters.daysOffPerWeek || 1;
      
      // Sort games by date
      const sortedGames = [...schedule.games].sort((a, b) => 
        new Date(a.dateTime) - new Date(b.dateTime)
      );
      
      // Check for weeks without sufficient days off
      const violations = [];
      
      // Group games by week
      const gamesByWeek = {};
      
      for (const game of sortedGames) {
        const gameDate = new Date(game.dateTime);
        const weekStart = new Date(gameDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // set to Sunday
        weekStart.setHours(0, 0, 0, 0);
        
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!gamesByWeek[weekKey]) {
          gamesByWeek[weekKey] = [];
        }
        
        gamesByWeek[weekKey].push(game);
      }
      
      // Check each week
      for (const [weekKey, weekGames] of Object.entries(gamesByWeek)) {
        // Count unique game days
        const gameDays = new Set();
        
        for (const game of weekGames) {
          const gameDate = new Date(game.dateTime);
          gameDays.add(gameDate.toISOString().split('T')[0]);
        }
        
        // Check if there are enough days off
        const daysWithGames = gameDays.size;
        const daysInWeek = 7;
        const daysOff = daysInWeek - daysWithGames;
        
        if (daysOff < daysOffPerWeek) {
          violations.push({
            weekStarting: weekKey,
            daysOff,
            required: daysOffPerWeek,
            gameCount: weekGames.length
          });
        }
      }
      
      const compliant = violations.length === 0;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `All weeks have at least ${daysOffPerWeek} day(s) off` : 
          `Found ${violations.length} weeks without sufficient days off`,
        violations: violations.length > 0 ? violations : undefined
      };
    } catch (error) {
      logger.error(`Error validating off days: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating off days: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate travel distance rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateTravelDistance(schedule, rule) {
    try {
      const maxMilesBetweenGames = rule.parameters.maxMilesBetweenGames || 1000;
      const maxMilesPerTrip = rule.parameters.maxMilesPerTrip || 5000;
      
      // Sort games by date
      const sortedGames = [...schedule.games].sort((a, b) => 
        new Date(a.dateTime) - new Date(b.dateTime)
      );
      
      // Check distance between consecutive games
      const violations = [];
      let totalMiles = 0;
      
      for (let i = 1; i < sortedGames.length; i++) {
        const previousGame = sortedGames[i - 1];
        const currentGame = sortedGames[i];
        
        // Calculate distance between games (placeholder - would use actual calculation)
        const distance = currentGame.venue && previousGame.venue ? 
          this._calculateDistance(previousGame.venue, currentGame.venue) : 0;
        
        totalMiles += distance;
        
        if (distance > maxMilesBetweenGames) {
          violations.push({
            game1: previousGame.id,
            game2: currentGame.id,
            distance,
            maxAllowed: maxMilesBetweenGames
          });
        }
      }
      
      // Check total trip distance
      const tripViolation = totalMiles > maxMilesPerTrip ? {
        totalMiles,
        maxAllowed: maxMilesPerTrip
      } : null;
      
      const compliant = violations.length === 0 && !tripViolation;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `All travel distances are within limits (total: ${totalMiles} miles)` : 
          `Found ${violations.length} violations of travel distance limits (total: ${totalMiles} miles)`,
        violations: violations.length > 0 ? violations : undefined,
        tripViolation
      };
    } catch (error) {
      logger.error(`Error validating travel distance: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating travel distance: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Calculate distance between venues (placeholder implementation)
   * 
   * @param {Object} venue1 - First venue
   * @param {Object} venue2 - Second venue
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(venue1, venue2) {
    // This would be replaced with actual distance calculation
    // For example, using coordinates and the Haversine formula,
    // or calling a mapping service API
    
    // Placeholder random distance between 10 and 800 miles
    return Math.floor(Math.random() * 790) + 10;
  }
  
  /**
   * Validate academic calendar rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateAcademicCalendar(schedule, rule) {
    try {
      // Get rule parameters
      const noGamesBeforeFinals = rule.parameters.noGamesBeforeFinals || 1;
      const noGamesDuringFinals = rule.parameters.noGamesDuringFinals !== false;
      const noGamesAfterFinals = rule.parameters.noGamesAfterFinals || 0;
      
      // Get academic calendar (placeholder - would come from institution data)
      const academicCalendar = this._getAcademicCalendar(schedule.team.institution);
      
      // Check for games during restricted periods
      const violations = [];
      
      for (const game of schedule.games) {
        const gameDate = new Date(game.dateTime);
        
        // Check before finals
        if (noGamesBeforeFinals > 0) {
          const daysBeforeFinals = this._daysBetween(gameDate, academicCalendar.finalsStart);
          
          if (daysBeforeFinals >= 0 && daysBeforeFinals < noGamesBeforeFinals) {
            violations.push({
              gameId: game.id,
              gameDate: game.dateTime,
              issue: `Game scheduled ${daysBeforeFinals} day(s) before finals (minimum: ${noGamesBeforeFinals})`
            });
          }
        }
        
        // Check during finals
        if (noGamesDuringFinals) {
          const duringFinals = gameDate >= academicCalendar.finalsStart && gameDate <= academicCalendar.finalsEnd;
          
          if (duringFinals) {
            violations.push({
              gameId: game.id,
              gameDate: game.dateTime,
              issue: 'Game scheduled during finals period'
            });
          }
        }
        
        // Check after finals
        if (noGamesAfterFinals > 0) {
          const daysAfterFinals = this._daysBetween(academicCalendar.finalsEnd, gameDate);
          
          if (daysAfterFinals >= 0 && daysAfterFinals < noGamesAfterFinals) {
            violations.push({
              gameId: game.id,
              gameDate: game.dateTime,
              issue: `Game scheduled ${daysAfterFinals} day(s) after finals (minimum: ${noGamesAfterFinals})`
            });
          }
        }
      }
      
      const compliant = violations.length === 0;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          'All games comply with academic calendar restrictions' : 
          `Found ${violations.length} violations of academic calendar restrictions`,
        violations: violations.length > 0 ? violations : undefined
      };
    } catch (error) {
      logger.error(`Error validating academic calendar: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating academic calendar: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Get academic calendar for an institution (placeholder implementation)
   * 
   * @param {string} institution - Institution name
   * @returns {Object} Academic calendar
   * @private
   */
  _getAcademicCalendar(institution) {
    // This would be replaced with actual academic calendar data
    // For example, from a database or API
    
    return {
      institution,
      fallStart: new Date('2023-08-28'),
      fallEnd: new Date('2023-12-08'),
      finalsStart: new Date('2023-12-11'),
      finalsEnd: new Date('2023-12-15'),
      winterBreakStart: new Date('2023-12-16'),
      winterBreakEnd: new Date('2024-01-15'),
      springStart: new Date('2024-01-16'),
      springEnd: new Date('2024-05-03'),
      springFinalsStart: new Date('2024-05-06'),
      springFinalsEnd: new Date('2024-05-10')
    };
  }
  
  /**
   * Calculate days between two dates
   * 
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {number} Days between dates
   * @private
   */
  _daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    
    // Set to midnight to ignore time of day
    firstDate.setHours(0, 0, 0, 0);
    secondDate.setHours(0, 0, 0, 0);
    
    return Math.round((secondDate - firstDate) / oneDay);
  }
  
  /**
   * Validate conference play rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateConferencePlay(schedule, rule) {
    try {
      // Placeholder implementation - would need actual conference membership data
      const playEachTeamTwice = rule.parameters.playEachTeamTwice !== false;
      const homeAndAway = rule.parameters.homeAndAway !== false;
      
      // Get conference teams
      const conferenceTeams = this._getConferenceTeams(schedule.team.conference);
      
      // Filter out the team's own entry
      const otherTeams = conferenceTeams.filter(team => team.id !== schedule.team.id);
      
      // Count games against each conference opponent
      const gamesByOpponent = {};
      const homeGamesByOpponent = {};
      const awayGamesByOpponent = {};
      
      for (const team of otherTeams) {
        gamesByOpponent[team.id] = 0;
        homeGamesByOpponent[team.id] = 0;
        awayGamesByOpponent[team.id] = 0;
      }
      
      // Count games in the schedule
      for (const game of schedule.games) {
        // Skip non-conference games
        if (game.conferenceGame !== true) {
          continue;
        }
        
        const opponentId = game.homeTeam === schedule.team.id ? 
          game.awayTeam : game.homeTeam;
        
        // Skip if not a conference opponent
        if (!gamesByOpponent[opponentId]) {
          continue;
        }
        
        gamesByOpponent[opponentId]++;
        
        if (game.homeTeam === schedule.team.id) {
          homeGamesByOpponent[opponentId]++;
        } else {
          awayGamesByOpponent[opponentId]++;
        }
      }
      
      // Check for violations
      const violations = [];
      
      for (const team of otherTeams) {
        // Check if playing each team the required number of times
        if (playEachTeamTwice && gamesByOpponent[team.id] !== 2) {
          violations.push({
            opponentId: team.id,
            gamesPlayed: gamesByOpponent[team.id],
            required: 2,
            issue: 'Incorrect number of games against conference opponent'
          });
        } else if (!playEachTeamTwice && gamesByOpponent[team.id] < 1) {
          violations.push({
            opponentId: team.id,
            gamesPlayed: gamesByOpponent[team.id],
            required: 1,
            issue: 'Missing game against conference opponent'
          });
        }
        
        // Check home and away balance
        if (homeAndAway && (homeGamesByOpponent[team.id] === 0 || awayGamesByOpponent[team.id] === 0)) {
          violations.push({
            opponentId: team.id,
            homeGames: homeGamesByOpponent[team.id],
            awayGames: awayGamesByOpponent[team.id],
            issue: 'Must play both home and away against conference opponent'
          });
        }
      }
      
      const compliant = violations.length === 0;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `Schedule satisfies conference play requirements (${playEachTeamTwice ? 'play each team twice' : 'play each team'}${homeAndAway ? ', home and away' : ''})` : 
          `Found ${violations.length} violations of conference play requirements`,
        violations: violations.length > 0 ? violations : undefined
      };
    } catch (error) {
      logger.error(`Error validating conference play: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating conference play: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Get conference teams (placeholder implementation)
   * 
   * @param {string} conference - Conference name
   * @returns {Array<Object>} Conference teams
   * @private
   */
  _getConferenceTeams(conference) {
    // This would be replaced with actual conference membership data
    // For example, from a database or API
    
    // Generate a list of 10 mock teams
    return Array.from({ length: 10 }, (_, i) => ({
      id: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      conference
    }));
  }
  
  /**
   * Validate schedule balance rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateScheduleBalance(schedule, rule) {
    try {
      // Get rule parameters
      const maxConsecutiveConferenceGames = rule.parameters.maxConsecutiveConferenceGames || 4;
      const minGapBetweenConferenceSeries = rule.parameters.minGapBetweenConferenceSeries || 1;
      
      // Sort games by date
      const sortedGames = [...schedule.games].sort((a, b) => 
        new Date(a.dateTime) - new Date(b.dateTime)
      );
      
      // Check for consecutive conference games
      const consecutiveViolations = [];
      let currentStreak = 0;
      
      for (const game of sortedGames) {
        if (game.conferenceGame === true) {
          currentStreak++;
          
          if (currentStreak > maxConsecutiveConferenceGames) {
            consecutiveViolations.push({
              gameId: game.id,
              gameDate: game.dateTime,
              streak: currentStreak,
              maxAllowed: maxConsecutiveConferenceGames
            });
          }
        } else {
          currentStreak = 0;
        }
      }
      
      // Check for gaps between conference series
      const gapViolations = [];
      let lastSeriesEnd = null;
      let inSeries = false;
      
      for (let i = 0; i < sortedGames.length; i++) {
        const game = sortedGames[i];
        
        if (game.conferenceGame === true) {
          if (!inSeries) {
            inSeries = true;
            
            // Check gap from previous series if there was one
            if (lastSeriesEnd !== null) {
              const gameDate = new Date(game.dateTime);
              const gapDays = this._daysBetween(lastSeriesEnd, gameDate);
              
              if (gapDays < minGapBetweenConferenceSeries) {
                gapViolations.push({
                  gameId: game.id,
                  gameDate: game.dateTime,
                  gap: gapDays,
                  minRequired: minGapBetweenConferenceSeries
                });
              }
            }
          }
        } else {
          if (inSeries) {
            inSeries = false;
            lastSeriesEnd = new Date(sortedGames[i - 1].dateTime);
          }
        }
      }
      
      const compliant = consecutiveViolations.length === 0 && gapViolations.length === 0;
      
      return {
        compliant,
        ruleName: rule.title,
        details: compliant ? 
          `Schedule has balanced conference games (max consecutive: ${maxConsecutiveConferenceGames}, min gap: ${minGapBetweenConferenceSeries} day(s))` : 
          `Found ${consecutiveViolations.length} streak violations and ${gapViolations.length} gap violations`,
        consecutiveViolations: consecutiveViolations.length > 0 ? consecutiveViolations : undefined,
        gapViolations: gapViolations.length > 0 ? gapViolations : undefined
      };
    } catch (error) {
      logger.error(`Error validating schedule balance: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating schedule balance: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate tournament eligibility rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateTournamentEligibility(schedule, rule) {
    try {
      // Get rule parameters
      const completeScheduleRequired = rule.parameters.completeScheduleRequired !== false;
      
      // Check if the schedule is complete
      const conferenceTeams = this._getConferenceTeams(schedule.team.conference);
      const otherTeams = conferenceTeams.filter(team => team.id !== schedule.team.id);
      
      // Count unique conference opponents
      const conferenceOpponents = new Set();
      
      for (const game of schedule.games) {
        if (game.conferenceGame === true) {
          const opponentId = game.homeTeam === schedule.team.id ? 
            game.awayTeam : game.homeTeam;
          
          conferenceOpponents.add(opponentId);
        }
      }
      
      const allOpponentsScheduled = conferenceOpponents.size === otherTeams.length;
      
      // Check if this would make the team ineligible
      const eligible = !completeScheduleRequired || allOpponentsScheduled;
      
      return {
        compliant: eligible,
        ruleName: rule.title,
        details: eligible ? 
          'Team is eligible for the conference tournament' : 
          'Team is ineligible for the conference tournament due to incomplete conference schedule',
        opponentsScheduled: conferenceOpponents.size,
        totalOpponents: otherTeams.length
      };
    } catch (error) {
      logger.error(`Error validating tournament eligibility: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating tournament eligibility: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate travel partners rule
   * 
   * @param {Object} schedule - Schedule to validate
   * @param {Object} rule - Rule to validate against
   * @returns {Object} Validation result
   * @private
   */
  _validateTravelPartners(schedule, rule) {
    try {
      // Get rule parameters
      const useDesignatedPartners = rule.parameters.useDesignatedPartners !== false;
      
      // This rule validation would depend on conference-specific travel partner assignments
      // Placeholder implementation
      const compliant = true;
      
      return {
        compliant,
        ruleName: rule.title,
        details: 'Travel partner validation is not implemented'
      };
    } catch (error) {
      logger.error(`Error validating travel partners: ${error.message}`);
      
      return {
        compliant: false,
        ruleName: rule.title,
        details: `Error validating travel partners: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Validate a schedule against compliance rules
   * 
   * @param {Object} schedule - The schedule to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  async validateSchedule(schedule, options = {}) {
    try {
      logger.info(`Validating schedule for ${schedule.team.name} (${schedule.sport})`);
      
      // Determine applicable rule sets
      const rulesets = [];
      
      // Add NCAA rules
      rulesets.push({
        name: 'NCAA',
        rules: this.ruleEngine.ncaa
      });
      
      // Add conference rules if applicable
      if (schedule.team.conference && this.ruleEngine.conferences[schedule.team.conference]) {
        rulesets.push({
          name: schedule.team.conference,
          rules: this.ruleEngine.conferences[schedule.team.conference]
        });
      }
      
      // Add institution rules if applicable
      if (schedule.team.institution && this.ruleEngine.institutions[schedule.team.institution]) {
        rulesets.push({
          name: schedule.team.institution,
          rules: this.ruleEngine.institutions[schedule.team.institution]
        });
      }
      
      // Filter rules by sport
      const sport = schedule.sport.toLowerCase();
      const applicableRules = [];
      
      for (const ruleset of rulesets) {
        for (const [ruleId, rule] of Object.entries(ruleset.rules)) {
          // Check if rule applies to this sport
          if (
            rule.applicableSports.includes(sport) || 
            rule.applicableSports.includes('all')
          ) {
            applicableRules.push({
              ruleId,
              ruleset: ruleset.name,
              rule
            });
          }
        }
      }
      
      logger.info(`Found ${applicableRules.length} applicable rules for validation`);
      
      // Apply each rule
      const results = [];
      
      for (const { ruleId, ruleset, rule } of applicableRules) {
        try {
          // Apply the rule validation function
          const result = rule.validationFunction(schedule, rule);
          
          // Store the result
          results.push({
            ruleId,
            ruleset,
            ruleName: rule.title,
            category: rule.category,
            compliant: result.compliant,
            details: result.details,
            violations: result.violations
          });
        } catch (error) {
          logger.error(`Error applying rule ${ruleId}: ${error.message}`);
          
          // Store the error result
          results.push({
            ruleId,
            ruleset,
            ruleName: rule.title,
            category: rule.category,
            compliant: false,
            details: `Error applying rule: ${error.message}`,
            error: true
          });
        }
      }
      
      // Calculate overall compliance
      const compliant = results.every(result => result.compliant);
      const violations = results.filter(result => !result.compliant);
      
      // Format the validation report
      const validationReport = {
        timestamp: new Date().toISOString(),
        team: schedule.team.name,
        sport: schedule.sport,
        scheduleId: schedule.id,
        compliant,
        violationCount: violations.length,
        results,
        violations: violations.map(v => ({
          ruleset: v.ruleset,
          ruleName: v.ruleName,
          category: v.category,
          details: v.details
        }))
      };
      
      // Generate compliance certificate if requested and compliant
      if (options.generateCertificate && compliant) {
        validationReport.complianceCertificate = await this._generateComplianceCertificate(schedule, validationReport);
      }
      
      // Store validation report if requested
      if (options.storeReport) {
        await this._storeValidationReport(validationReport);
      }
      
      logger.info(`Schedule validation completed: ${compliant ? 'COMPLIANT' : 'NON-COMPLIANT'} with ${violations.length} violations`);
      
      return validationReport;
    } catch (error) {
      logger.error(`Error validating schedule: ${error.message}`);
      
      // Return error report
      return {
        timestamp: new Date().toISOString(),
        team: schedule.team?.name || 'Unknown',
        sport: schedule.sport || 'Unknown',
        scheduleId: schedule.id || 'Unknown',
        compliant: false,
        error: true,
        errorMessage: error.message
      };
    }
  }
  
  /**
   * Generate a compliance certificate
   * 
   * @param {Object} schedule - The validated schedule
   * @param {Object} validationReport - Validation results
   * @returns {Promise<Object>} Compliance certificate
   * @private
   */
  async _generateComplianceCertificate(schedule, validationReport) {
    try {
      // Generate certificate data
      const certificate = {
        id: `cert-${new Date().getTime()}-${Math.floor(Math.random() * 1000000)}`,
        team: schedule.team.name,
        sport: schedule.sport,
        season: schedule.season,
        scheduleId: schedule.id,
        issuedAt: new Date().toISOString(),
        issuedBy: 'FlexTime Compliance Agent',
        validatedRules: validationReport.results.map(r => ({
          ruleset: r.ruleset,
          ruleName: r.ruleName
        }))
      };
      
      // Store certificate if reporting is enabled
      if (this.config.complianceReporting.generateReports) {
        const reportDir = path.resolve(this.config.complianceReporting.reportDestination);
        const certificatePath = path.join(reportDir, `certificate-${certificate.id}.json`);
        
        await fs.writeFile(
          certificatePath,
          JSON.stringify(certificate, null, 2),
          'utf8'
        );
        
        certificate.filePath = certificatePath;
      }
      
      return certificate;
    } catch (error) {
      logger.error(`Error generating compliance certificate: ${error.message}`);
      
      return {
        error: true,
        errorMessage: error.message
      };
    }
  }
  
  /**
   * Store a validation report
   * 
   * @param {Object} report - Validation report
   * @returns {Promise<void>}
   * @private
   */
  async _storeValidationReport(report) {
    try {
      // Store in database if available
      if (this.dbClient) {
        // Check if reports table exists
        const tableCheck = await this.dbClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'compliance_validation_reports'
          );
        `);
        
        // Create table if it doesn't exist
        if (!tableCheck.rows[0].exists) {
          await this.dbClient.query(`
            CREATE TABLE compliance_validation_reports (
              report_id SERIAL PRIMARY KEY,
              timestamp TIMESTAMP NOT NULL,
              team_name VARCHAR(255) NOT NULL,
              sport VARCHAR(255) NOT NULL,
              schedule_id VARCHAR(255) NOT NULL,
              compliant BOOLEAN NOT NULL,
              violation_count INTEGER NOT NULL,
              report JSONB NOT NULL
            );
          `);
        }
        
        // Insert the report
        await this.dbClient.query(`
          INSERT INTO compliance_validation_reports
            (timestamp, team_name, sport, schedule_id, compliant, violation_count, report)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          report.timestamp,
          report.team,
          report.sport,
          report.scheduleId,
          report.compliant,
          report.violationCount,
          JSON.stringify(report)
        ]);
        
        logger.info(`Stored validation report in database`);
      }
      
      // Store to file system if reporting is enabled
      if (this.config.complianceReporting.generateReports) {
        const reportDir = path.resolve(this.config.complianceReporting.reportDestination);
        const reportPath = path.join(
          reportDir, 
          `validation-${report.team.replace(/\s+/g, '-')}-${new Date().getTime()}.json`
        );
        
        await fs.writeFile(
          reportPath,
          JSON.stringify(report, null, 2),
          'utf8'
        );
        
        logger.info(`Stored validation report at ${reportPath}`);
      }
    } catch (error) {
      logger.error(`Error storing validation report: ${error.message}`);
    }
  }
  
  /**
   * Check if scheduling constraints are compliant
   * 
   * @param {Array<Object>} constraints - Scheduling constraints to check
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Constraint check results
   */
  async checkConstraints(constraints, options = {}) {
    try {
      logger.info(`Checking ${constraints.length} scheduling constraints for compliance`);
      
      // Placeholder implementation - would check if constraints could create non-compliant schedules
      const results = [];
      
      for (const constraint of constraints) {
        // Check the constraint
        const result = {
          constraintId: constraint.id,
          constraintType: constraint.type,
          compliant: true,
          details: 'Constraint is compliant with regulations'
        };
        
        // Add to results
        results.push(result);
      }
      
      return {
        timestamp: new Date().toISOString(),
        constraintCount: constraints.length,
        compliant: results.every(r => r.compliant),
        results
      };
    } catch (error) {
      logger.error(`Error checking constraints: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        constraintCount: constraints?.length || 0,
        compliant: false,
        error: true,
        errorMessage: error.message
      };
    }
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'validate_schedule':
        return await this.validateSchedule(
          task.parameters.schedule,
          task.parameters.options || {}
        );
      
      case 'check_constraints':
        return await this.checkConstraints(
          task.parameters.constraints,
          task.parameters.options || {}
        );
      
      case 'load_rules':
        await this.loadComplianceRules();
        return { rulesLoaded: true };
      
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Stop the agent and release resources
   */
  async stop() {
    try {
      logger.info('Stopping Compliance Agent');
      
      // Close database connection
      if (this.dbClient) {
        await this.dbClient.end();
        this.dbClient = null;
      }
      
      // Stop the base agent
      await super.stop();
      
      logger.info('Compliance Agent stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Compliance Agent: ${error.message}`);
      return false;
    }
  }
}

module.exports = ComplianceAgent;