/**
 * MLWorkflowManager.js
 * 
 * Manages the machine learning workflow for the FlexTime scheduling platform.
 * Coordinates overnight learning processes for sport-specific scheduling agents.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const LearningSystem = require('./LearningSystem');
const IntelligenceEngineClient = require('../src/api/intelligence-engine-client');
const { ChampionshipDateManager } = require('./ChampionshipDateManager');

class MLWorkflowManager {
  constructor(config) {
    this.config = config;
    this.dbPool = new Pool(config.database);
    this.agents = {};
    this.learningPhases = ['data_collection', 'pattern_extraction', 'knowledge_building', 'validation'];
    this.currentPhase = 'idle';
    
    // Initialize Intelligence Engine client for Supabase MCP communication
    this.intelligenceEngine = new IntelligenceEngineClient({
      baseUrl: config.claude?.baseUrl || process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001',
      apiKey: config.claude?.apiKey || process.env.INTELLIGENCE_ENGINE_API_KEY,
      fallbackEnabled: true
    });
    
    // Initialize Championship Date Manager
    this.championshipDateManager = new ChampionshipDateManager(config);
    
    console.log('ML Workflow Manager initialized');
  }
  
  /**
   * Initialize the ML workflow manager and connect to necessary services
   */
  async initialize() {
    try {
      console.log('Initializing ML Workflow Manager...');

      // Initialize IntelligenceEngine
      this.intelligenceEngine = new IntelligenceEngine(this.config.intelligence);
      await this.intelligenceEngine.initialize();
      console.log('Intelligence Engine initialized');

      // Connect to Neon database
      console.log('Connecting to Neon database...');
      if (!this.config.database.connectionString) {
        console.warn('Neon DB connection string not provided, using environment variable');
        this.config.database.connectionString = process.env.NEON_DB_CONNECTION_STRING;
      }

      this.dbPool = new Pool({
        connectionString: this.config.database.connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      });

      // Test connection
      const result = await this.dbPool.query('SELECT NOW()');
      console.log(`Connected to Neon DB, server time: ${result.rows[0].now}`);

      // Initialize Championship Date Manager
      this.championshipDateManager = new ChampionshipDateManager(this.config);
      await this.championshipDateManager.initialize();

      // Preload championship formulas and NCAA dates for better performance
      await this.championshipDateManager.loadChampionshipFormulas();
      console.log('Championship Date Manager initialized');

      console.log('ML Workflow Manager initialization complete');
    } catch (error) {
      console.error('Error initializing ML Workflow Manager:', error);
      throw error;
    }
  }
  
  /**
   * Register all available sport-specific agents
   */
  registerAgents() {
    // Dynamic agent registration based on available modules
    const sportsDir = path.join(__dirname, '../src/sports');
    const sports = fs.readdirSync(sportsDir).filter(
      file => fs.statSync(path.join(sportsDir, file)).isDirectory()
    );
    
    sports.forEach(sport => {
      try {
        const agentDir = path.join(sportsDir, sport, 'agents');
        if (fs.existsSync(agentDir)) {
          const agents = fs.readdirSync(agentDir).filter(file => file.endsWith('Agent.js'));
          
          agents.forEach(agentFile => {
            const agentName = agentFile.replace('.js', '');
            const agentPath = path.join(agentDir, agentFile);
            
            // Register the agent
            this.agents[`${sport}:${agentName}`] = {
              sport,
              name: agentName,
              path: agentPath,
              status: 'registered'
            };
          });
        }
      } catch (error) {
        console.error(`Error registering agents for ${sport}:`, error);
      }
    });
    
    console.log(`Registered ${Object.keys(this.agents).length} sport-specific agents`);
  }
  
  /**
   * Get championship date constraints for a specific sport and season
   * This includes championship dates, regular season windows, and blackout dates
   * 
   * @param {number} sportId - Sport ID
   * @param {string} season - Season string (e.g., "2025-26")
   * @returns {Object|null} Championship constraints or null if not available
   */
  async getChampionshipConstraints(sportId, season) {
    if (!this.championshipDateManager) {
      console.log('Championship Date Manager not initialized');
      return null;
    }
    
    try {
      // Get constraints from Championship Date Manager
      const constraints = await this.championshipDateManager.getChampionshipConstraints(sportId, season);
      
      if (!constraints) {
        console.warn(`No championship constraints available for sport ${sportId}, season ${season}`);
        return null;
      }
      
      // Log the constraints we're using for this schedule
      console.log(`Using championship constraints for ${sportId} (${season}):`);
      console.log(` - Championship Date: ${constraints.championshipDate}`);
      console.log(` - Regular Season: ${constraints.schedulingWindows.regularSeason.startDate} to ${constraints.schedulingWindows.regularSeason.endDate}`);
      console.log(` - Blackout Dates: ${constraints.blackoutDates.length} dates`);
      
      // NCAA dates if available
      if (constraints.ncaaDates) {
        console.log(` - NCAA First Contest: ${constraints.ncaaDates.firstContest}`);
        console.log(` - NCAA Regular Season End: ${constraints.ncaaDates.regularSeasonEnd}`);
      }
      
      return constraints;
    } catch (error) {
      console.error(`Error getting championship constraints for sport ${sportId}, season ${season}:`, error);
      return null;
    }
  }
  
  /**
   * Start overnight learning process
   */
  async startOvernightLearning() {
    try {
      console.log('Starting overnight learning process');
      this.currentPhase = 'data_collection';
      
      // Phase 1: Data Collection
      await this.runDataCollectionPhase();
      
      // Phase 2: Pattern Extraction
      this.currentPhase = 'pattern_extraction';
      await this.runPatternExtractionPhase();
      
      // Phase 3: Knowledge Building
      this.currentPhase = 'knowledge_building';
      await this.runKnowledgeBuildingPhase();
      
      // Phase 4: Validation
      this.currentPhase = 'validation';
      await this.runValidationPhase();
      
      // Complete
      this.currentPhase = 'complete';
      console.log('Overnight learning process complete');
      
      return await this.getLearningStats();
    } catch (error) {
      console.error('Error in overnight learning process:', error);
      this.currentPhase = 'error';
      throw error;
    }
  }
  
  /**
   * Run a specific agent phase with appropriate constraints
   * @param {string} phase - The learning phase to run
   * @param {Object} sport - Sport information
   * @param {string} season - Season identifier (e.g., "2025-26")
   * @param {Object} constraints - Initial constraints for the phase
   */
  async runAgentPhase(phase, sport, season, constraints) {
    try {
      console.log(`Starting ${phase} phase for ${sport.name} (${season})`);
      
      // Always get championship constraints for scheduling phases
      if (phase === 'schedule_generation' || phase === 'schedule_optimization') {
        const championshipConstraints = await this.getChampionshipConstraints(sport.sport_id, season);
        if (championshipConstraints) {
          constraints.championshipConstraints = championshipConstraints;
          
          // Add championship date as a hard constraint for scheduling
          if (!constraints.blackoutDates) {
            constraints.blackoutDates = [];
          }
          
          // Add all championship blackout dates to the main blackout dates
          if (championshipConstraints.blackoutDates && championshipConstraints.blackoutDates.length > 0) {
            constraints.blackoutDates = [...new Set([...constraints.blackoutDates, ...championshipConstraints.blackoutDates])];
          }
          
          // Set scheduling window constraints
          if (championshipConstraints.schedulingWindows && championshipConstraints.schedulingWindows.regularSeason) {
            constraints.seasonStart = championshipConstraints.schedulingWindows.regularSeason.startDate;
            constraints.seasonEnd = championshipConstraints.schedulingWindows.regularSeason.endDate;
          }
        }
      }
      
      // Run the agent phase
      // ... (rest of the method remains the same)
    } catch (error) {
      console.error(`Error running ${phase} phase for ${sport.name} (${season}):`, error);
      throw error;
    }
  }
  
  /**
   * Run data collection phase - gather historical schedule data
   */
  async runDataCollectionPhase() {
    console.log('Running data collection phase');
    
    // For each sport agent, collect and process historical data
    for (const agentKey of Object.keys(this.agents)) {
      const agent = this.agents[agentKey];
      console.log(`Collecting data for ${agent.sport}`);
      
      try {
        // Query historical schedules
        const historicalData = await this.dbPool.query(
          'SELECT * FROM historical_schedules WHERE sport_type = $1 ORDER BY season DESC LIMIT 20',
          [agent.sport]
        );
        
        console.log(`Found ${historicalData.rows.length} historical schedules for ${agent.sport}`);
        
        // Extract features from historical schedules
        await this.extractFeaturesFromHistoricalData(agent.sport, historicalData.rows);
        
        agent.status = 'data_collected';
      } catch (error) {
        console.error(`Error collecting data for ${agent.sport}:`, error);
        agent.status = 'collection_error';
      }
    }
  }
  
  /**
   * Extract features from historical schedule data
   */
  async extractFeaturesFromHistoricalData(sportType, historicalData) {
    console.log(`Extracting features for ${sportType} from ${historicalData.length} schedules`);
    
    for (const schedule of historicalData) {
      // Get metrics for this schedule
      const metricsResult = await this.dbPool.query(
        'SELECT * FROM schedule_metrics WHERE schedule_id = $1',
        [schedule.id]
      );
      
      if (metricsResult.rows.length === 0) {
        continue;
      }
      
      const metrics = metricsResult.rows[0];
      
      // Feature extraction
      const features = {
        schedule_id: schedule.id,
        sport_type: sportType,
        season: schedule.season,
        algorithm: schedule.algorithm,
        quality_score: metrics.quality_score,
        travel_efficiency: metrics.travel_efficiency,
        home_away_balance: metrics.home_away_balance,
        rivalry_satisfaction: metrics.rivalry_satisfaction,
        constraint_compliance: metrics.constraint_compliance,
        features: this.extractScheduleFeatures(schedule.schedule_data, sportType),
        timestamp: new Date().toISOString()
      };
      
      // Store extracted features
      await this.dbPool.query(
        'INSERT INTO schedule_features(schedule_id, feature_data) VALUES($1, $2) ' +
        'ON CONFLICT (schedule_id) DO UPDATE SET feature_data = $2',
        [schedule.id, features]
      );
    }
  }
  
  /**
   * Extract sport-specific features from a schedule
   */
  extractScheduleFeatures(scheduleData, sportType) {
    // Extract different features based on sport type
    const features = {
      game_count: 0,
      avg_rest_days: 0,
      travel_patterns: [],
      rival_game_distribution: []
    };
    
    if (!scheduleData || !scheduleData.games || !Array.isArray(scheduleData.games)) {
      return features;
    }
    
    // Basic counting features
    features.game_count = scheduleData.games.length;
    
    // Rest days calculation
    const gamesByTeam = {};
    
    scheduleData.games.forEach(game => {
      if (!game.home_team || !game.away_team || !game.date) return;
      
      // Track games by team to calculate rest days
      if (!gamesByTeam[game.home_team]) gamesByTeam[game.home_team] = [];
      if (!gamesByTeam[game.away_team]) gamesByTeam[game.away_team] = [];
      
      gamesByTeam[game.home_team].push({ date: new Date(game.date), isHome: true });
      gamesByTeam[game.away_team].push({ date: new Date(game.date), isHome: false });
    });
    
    // Calculate average rest days between games
    let totalRestDays = 0;
    let restDaysCount = 0;
    
    Object.keys(gamesByTeam).forEach(team => {
      const teamGames = gamesByTeam[team].sort((a, b) => a.date - b.date);
      
      for (let i = 1; i < teamGames.length; i++) {
        const daysBetween = Math.floor(
          (teamGames[i].date - teamGames[i-1].date) / (1000 * 60 * 60 * 24)
        );
        
        totalRestDays += daysBetween;
        restDaysCount++;
      }
    });
    
    features.avg_rest_days = restDaysCount > 0 ? totalRestDays / restDaysCount : 0;
    
    // Add more sport-specific features as needed
    
    return features;
  }
  
  /**
   * Run pattern extraction phase - identify patterns in historical data
   */
  async runPatternExtractionPhase() {
    console.log('Running pattern extraction phase');
    
    for (const agentKey of Object.keys(this.agents)) {
      const agent = this.agents[agentKey];
      
      if (agent.status !== 'data_collected') {
        console.log(`Skipping pattern extraction for ${agent.sport} due to status: ${agent.status}`);
        continue;
      }
      
      console.log(`Extracting patterns for ${agent.sport}`);
      
      try {
        // Get features for analysis
        const featuresResult = await this.dbPool.query(
          'SELECT sf.*, hs.sport_type, hs.season, hs.algorithm, sm.quality_score ' +
          'FROM schedule_features sf ' +
          'JOIN historical_schedules hs ON sf.schedule_id = hs.id ' +
          'JOIN schedule_metrics sm ON sf.schedule_id = sm.schedule_id ' +
          'WHERE hs.sport_type = $1 ' +
          'ORDER BY sm.quality_score DESC LIMIT 20',
          [agent.sport]
        );
        
        if (featuresResult.rows.length === 0) {
          console.log(`No feature data found for ${agent.sport}, skipping pattern extraction`);
          agent.status = 'no_patterns';
          continue;
        }
        
        // Find patterns in high-quality schedules
        const patterns = this.findPatternsInFeatures(featuresResult.rows, agent.sport);
        
        // Store discovered patterns
        for (const pattern of patterns) {
          await this.dbPool.query(
            'INSERT INTO learned_patterns(sport_type, pattern_type, pattern_data, confidence) ' +
            'VALUES($1, $2, $3, $4)',
            [agent.sport, pattern.type, pattern.data, pattern.confidence]
          );
        }
        
        console.log(`Stored ${patterns.length} patterns for ${agent.sport}`);
        agent.status = 'patterns_extracted';
      } catch (error) {
        console.error(`Error extracting patterns for ${agent.sport}:`, error);
        agent.status = 'pattern_error';
      }
    }
  }
  
  /**
   * Find patterns in schedule features
   */
  findPatternsInFeatures(features, sportType) {
    // Implement pattern discovery algorithms
    // This would use statistical analysis to find significant patterns
    
    const patterns = [];
    
    // Example pattern: optimal rest days
    const qualityFeatures = features.filter(f => f.quality_score >= 0.8);
    
    if (qualityFeatures.length > 0) {
      // Calculate average rest days in high-quality schedules
      const totalRestDays = qualityFeatures.reduce((sum, f) => 
        sum + (f.feature_data.avg_rest_days || 0), 0);
      const avgRestDays = totalRestDays / qualityFeatures.length;
      
      patterns.push({
        type: 'optimal_rest_period',
        data: {
          avg_rest_days: avgRestDays,
          sport_type: sportType,
          description: `Optimal rest period between games is approximately ${avgRestDays.toFixed(1)} days`
        },
        confidence: qualityFeatures.length / features.length
      });
    }
    
    // Add more pattern discovery logic as needed
    
    return patterns;
  }
  
  /**
   * Run knowledge building phase - convert patterns to agent knowledge
   */
  async runKnowledgeBuildingPhase() {
    console.log('Running knowledge building phase');
    
    for (const agentKey of Object.keys(this.agents)) {
      const agent = this.agents[agentKey];
      
      if (agent.status !== 'patterns_extracted') {
        console.log(`Skipping knowledge building for ${agent.sport} due to status: ${agent.status}`);
        continue;
      }
      
      console.log(`Building knowledge for ${agent.sport}`);
      
      try {
        // Get patterns for this agent
        const patternsResult = await this.dbPool.query(
          'SELECT * FROM learned_patterns WHERE sport_type = $1 ORDER BY confidence DESC',
          [agent.sport]
        );
        
        if (patternsResult.rows.length === 0) {
          console.log(`No patterns found for ${agent.sport}, skipping knowledge building`);
          agent.status = 'knowledge_building_skipped';
          continue;
        }
        
        let knowledge;
        
        // Try to use the Intelligence Engine for enhanced pattern recognition if available
        if (this.intelligenceEngine && this.intelligenceEngine.connected) {
          try {
            console.log(`Using Intelligence Engine (Supabase MCP) for ${agent.sport} knowledge building`);
            
            // Use the MCP server for enhanced pattern to knowledge conversion
            const insights = await this.intelligenceEngine.getInsights({
              sportType: agent.sport,
              patterns: patternsResult.rows,
              analysisType: 'pattern_to_knowledge'
            });
            
            if (insights && insights.insights && insights.insights.length > 0) {
              // Map insights to knowledge format
              knowledge = insights.insights.map(insight => ({
                content: insight.data || {},
                metadata: {
                  source: 'intelligence_engine',
                  sport: agent.sport,
                  confidence: insight.confidence || 0.6,
                  description: insight.description
                },
                relevance_score: insight.confidence || 0.6
              }));
              
              console.log(`Got ${knowledge.length} knowledge items from Intelligence Engine`);
            } else {
              console.log('No insights received from Intelligence Engine, falling back to local conversion');
              knowledge = await this.convertPatternsToKnowledge(patternsResult.rows, agent.sport);
            }
          } catch (error) {
            console.error('Error using Intelligence Engine for knowledge building:', error);
            // Fall back to local conversion
            knowledge = await this.convertPatternsToKnowledge(patternsResult.rows, agent.sport);
          }
        } else {
          console.log('Intelligence Engine not available, using local pattern conversion');
          // Convert patterns to knowledge locally
          knowledge = await this.convertPatternsToKnowledge(patternsResult.rows, agent.sport);
        }
        
        // Store knowledge in agent_memories table
        for (const item of knowledge) {
          await this.dbPool.query(
            `INSERT INTO agent_memories(
              agent_id, memory_type, content, metadata, relevance_score
            ) VALUES($1, $2, $3, $4, $5)`,
            [
              `${agent.sport}:${agent.name}`,
              'constraint_parameter',
              JSON.stringify(item.content),
              JSON.stringify(item.metadata),
              item.relevance_score
            ]
          );
        }
        
        console.log(`Built ${knowledge.length} knowledge items for ${agent.sport}`);
        agent.status = 'knowledge_built';
      } catch (error) {
        console.error(`Error building knowledge for ${agent.sport}:`, error);
        agent.status = 'knowledge_building_error';
      }
    }
  }
  
  /**
   * Convert patterns to agent knowledge
   */
  convertPatternsToKnowledge(patterns, sportType) {
    const knowledge = [];
    
    // Process each pattern type
    patterns.forEach(pattern => {
      switch (pattern.pattern_type) {
        case 'optimal_rest_period':
          knowledge.push({
            type: 'constraint_parameter',
            content: {
              parameter: 'rest_days',
              optimal_value: pattern.pattern_data.avg_rest_days,
              description: pattern.pattern_data.description,
              application: 'Use this optimal rest period when generating schedules'
            },
            relevance: pattern.confidence
          });
          break;
          
        // Handle other pattern types
        default:
          // Generic knowledge extraction
          knowledge.push({
            type: 'general_insight',
            content: {
              insight_type: pattern.pattern_type,
              data: pattern.pattern_data,
              description: `Pattern discovered in ${sportType} schedules`
            },
            relevance: pattern.confidence * 0.8 // Slightly lower relevance for generic insights
          });
      }
    });
    
    return knowledge;
  }
  
  /**
   * Run validation phase - test learned knowledge
   */
  async runValidationPhase() {
    console.log('Running validation phase');
    
    for (const agentKey of Object.keys(this.agents)) {
      const agent = this.agents[agentKey];
      
      if (agent.status !== 'knowledge_built') {
        console.log(`Skipping validation for ${agent.sport} due to status: ${agent.status}`);
        continue;
      }
      
      console.log(`Validating knowledge for ${agent.sport}`);
      
      try {
        // Get knowledge for this agent
        const knowledgeResult = await this.dbPool.query(
          'SELECT * FROM agent_memories WHERE agent_id = $1 AND memory_type = $2 ORDER BY relevance_score DESC',
          [`${agent.sport}:${agent.name}`, 'constraint_parameter']
        );
        
        if (knowledgeResult.rows.length === 0) {
          console.log(`No knowledge found for ${agent.sport}, skipping validation`);
          agent.status = 'validation_skipped';
          continue;
        }
        
        // Validate knowledge by generating a test schedule
        const validationResult = await this.validateKnowledge(knowledgeResult.rows, agent);
        
        // Update knowledge relevance based on validation
        for (const result of validationResult.results) {
          await this.dbPool.query(
            'UPDATE agent_memories SET relevance_score = $1 WHERE id = $2',
            [result.new_relevance, result.memory_id]
          );
        }
        
        console.log(`Validated ${validationResult.results.length} knowledge items for ${agent.sport}`);
        agent.status = 'validated';
      } catch (error) {
        console.error(`Error validating knowledge for ${agent.sport}:`, error);
        agent.status = 'validation_error';
      }
    }
  }
  
  /**
   * Validate knowledge by testing it on schedule generation
   */
  async validateKnowledge(knowledge, agent) {
    // In a real implementation, this would:
    // 1. Load the actual agent
    // 2. Generate a test schedule with the learned parameters
    // 3. Evaluate the quality of the generated schedule
    // 4. Adjust knowledge relevance based on performance
    
    console.log(`Simulating validation for ${agent.sport} with ${knowledge.length} knowledge items`);
    
    // Placeholder for validation results
    const results = knowledge.map(item => ({
      memory_id: item.id,
      validated: true,
      performance_score: 0.85 + (Math.random() * 0.1), // Simulated score
      new_relevance: item.relevance_score * (0.9 + (Math.random() * 0.2)) // Adjust relevance
    }));
    
    return {
      agent: agent.name,
      sport: agent.sport,
      results,
      overall_score: 0.85
    };
  }
  
  /**
   * Get learning statistics
   */
  async getLearningStats() {
    const stats = {
      agents: Object.keys(this.agents).length,
      phases_completed: 0,
      patterns_discovered: 0,
      knowledge_items: 0,
      agent_statuses: {}
    };
    
    // Count agent statuses
    Object.keys(this.agents).forEach(key => {
      const status = this.agents[key].status;
      if (!stats.agent_statuses[status]) {
        stats.agent_statuses[status] = 0;
      }
      stats.agent_statuses[status]++;
    });
    
    // Count patterns
    const patternsResult = await this.dbPool.query(
      'SELECT COUNT(*) as count FROM learned_patterns'
    );
    stats.patterns_discovered = parseInt(patternsResult.rows[0].count, 10);
    
    // Count knowledge items
    const knowledgeResult = await this.dbPool.query(
      'SELECT COUNT(*) as count FROM agent_memories'
    );
    stats.knowledge_items = parseInt(knowledgeResult.rows[0].count, 10);
    
    // Calculate phases completed
    if (stats.agent_statuses['validated']) {
      stats.phases_completed = 4;
    } else if (stats.agent_statuses['knowledge_built']) {
      stats.phases_completed = 3;
    } else if (stats.agent_statuses['patterns_extracted']) {
      stats.phases_completed = 2;
    } else if (stats.agent_statuses['data_collected']) {
      stats.phases_completed = 1;
    }
    
    return stats;
  }
}

module.exports = MLWorkflowManager;
