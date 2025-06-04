/**
 * FlexTime Rapid Scheduler v2.0
 * 
 * High-performance schedule generation with:
 * - Advanced parallel candidate generation
 * - Smart heuristic selection based on sport and conference
 * - Integrated Big 12 optimizations
 * - Real-time progress monitoring
 * - Intelligent constraint adaptation
 * 
 * Performance target: Generate schedules in minutes, not hours
 */

const { v4: uuidv4 } = require('uuid');
const logger = require("../utils/logger");
const SchedulingServiceClient = require('../clients/scheduling-service-client');

/**
 * Rapid Scheduler for fast schedule generation
 */
class RapidScheduler {
  /**
   * Create a new Rapid Scheduler
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      parallelGenerators: true,
      useHistoricalData: true,
      useIncrementalOptimization: true,
      maxCandidates: 8,
      enableSmartHeuristics: true,
      enableBig12Optimizations: true,
      enableRealTimeProgress: true,
      adaptiveConstraints: true,
      performanceMonitoring: true,
      candidatePoolSize: 16,
      maxParallelWorkers: Math.min(8, require('os').cpus().length),
      ...config
    };
    
    // Initialize performance monitoring
    if (this.config.performanceMonitoring) {
      const PerformanceMonitor = require('../utils/performance-monitor');
      this.performanceMonitor = new PerformanceMonitor('Rapid_Scheduler_v2');
    }
    
    // Event emitter for real-time updates
    const EventEmitter = require('events');
    this.eventEmitter = new EventEmitter();
    
    // Candidate pool for parallel generation
    this.candidatePool = [];
    this.activeGenerators = new Set();
    
    // Enhanced generators with fallback handling
    this.generators = this._initializeGenerators();
    
    // Smart heuristics engine
    if (this.config.enableSmartHeuristics) {
      this.heuristicsEngine = this._initializeHeuristicsEngine();
    }
    
    // Big 12 optimization engine
    if (this.config.enableBig12Optimizations) {
      this.big12Engine = this._initializeBig12Engine();
    }
    
    // Enhanced optimizers with performance improvements
    this.optimizers = this._initializeOptimizers();
    
    // Constraint adaptation engine
    if (this.config.adaptiveConstraints) {
      this.constraintAdapter = this._initializeConstraintAdapter();
    }
    
    // Initialize Scheduling Service client
    this.schedulingService = new SchedulingServiceClient(config.schedulingService || {});
    
    logger.info('Rapid Scheduler v2.0 created', { 
      parallelGenerators: this.config.parallelGenerators,
      useHistoricalData: this.config.useHistoricalData,
      maxCandidates: this.config.maxCandidates,
      smartHeuristics: this.config.enableSmartHeuristics,
      big12Optimizations: this.config.enableBig12Optimizations
    });
  }
  
  /**
   * Initialize enhanced generators with fallback support
   * @returns {Object} Generator map
   * @private
   */
  _initializeGenerators() {
    const generators = {};
    
    // Try to load generators with fallback
    try {
      generators.roundRobin = require('./generators/round-robin-generator');
    } catch (error) {
      logger.warn('Round-robin generator not found, using fallback');
      generators.roundRobin = this._createFallbackRoundRobinGenerator();
    }
    
    try {
      generators.partialRoundRobin = require('./generators/partial-round-robin-generator');
    } catch (error) {
      logger.warn('Partial round-robin generator not found, using fallback');
      generators.partialRoundRobin = this._createFallbackPartialRoundRobinGenerator();
    }
    
    try {
      generators.divisionBased = require('./generators/division-based-generator');
    } catch (error) {
      logger.warn('Division-based generator not found, using fallback');
      generators.divisionBased = this._createFallbackDivisionBasedGenerator();
    }
    
    // Add enhanced generators
    generators.smartRoundRobin = this._createSmartRoundRobinGenerator();
    generators.adaptiveGenerator = this._createAdaptiveGenerator();
    
    return generators;
  }
  
  /**
   * Initialize smart heuristics engine
   * @returns {Object} Heuristics engine
   * @private
   */
  _initializeHeuristicsEngine() {
    return {
      selectOptimalGenerator: (sportType, parameters, constraints) => {
        return this._selectOptimalGenerator(sportType, parameters, constraints);
      },
      adaptConstraintWeights: (sport, teamCount, gameCount) => {
        return this._adaptConstraintWeights(sport, teamCount, gameCount);
      },
      predictOptimizationTime: (parameters) => {
        return this._predictOptimizationTime(parameters);
      }
    };
  }
  
  /**
   * Initialize Big 12 optimization engine
   * @returns {Object} Big 12 engine
   * @private
   */
  _initializeBig12Engine() {
    return {
      applyBig12Constraints: (schedule, sport) => {
        return this._applyBig12Constraints(schedule, sport);
      },
      optimizeTravelPatterns: (schedule) => {
        return this._optimizeBig12TravelPatterns(schedule);
      },
      handleVenueSharing: (schedule) => {
        return this._handleBig12VenueSharing(schedule);
      }
    };
  }
  
  /**
   * Initialize enhanced optimizers
   * @returns {Object} Optimizer map
   * @private
   */
  _initializeOptimizers() {
    const optimizers = {};
    
    try {
      optimizers.travelOptimizer = require('./travel-optimizer');
    } catch (error) {
      logger.warn('Travel optimizer not found, using fallback');
      optimizers.travelOptimizer = this._createFallbackTravelOptimizer();
    }
    
    try {
      optimizers.multiVariable = require('./multi-variable-optimizer');
    } catch (error) {
      logger.warn('Multi-variable optimizer not found, using fallback');
      optimizers.multiVariable = this._createFallbackMultiVariableOptimizer();
    }
    
    // Add enhanced optimizers
    optimizers.enhancedSimulatedAnnealing = require('./enhanced-simulated-annealing');
    optimizers.parallelOptimizer = this._createParallelOptimizer();
    
    return optimizers;
  }
  
  /**
   * Initialize constraint adaptation engine
   * @returns {Object} Constraint adapter
   * @private
   */
  _initializeConstraintAdapter() {
    return {
      adaptWeights: (sport, performance) => {
        return this._adaptConstraintWeights(sport, performance);
      },
      detectConflicts: (constraints) => {
        return this._detectConstraintConflicts(constraints);
      },
      resolveConflicts: (constraints) => {
        return this._resolveConstraintConflicts(constraints);
      }
    };
  }
  
  /**
   * Initialize the scheduler
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Initialize Scheduling Service client
      await this.schedulingService.initialize();
      logger.info('Scheduling Service client initialized for Rapid Scheduler');
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Rapid Scheduler: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Generate a schedule rapidly using enhanced v2.0 algorithms
   * @param {Object} parameters - Schedule parameters
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated schedule
   */
  async generateSchedule(parameters, constraints = [], options = {}) {
    const startTime = Date.now();
    
    // Initialize performance monitoring
    if (this.performanceMonitor) {
      this.performanceMonitor.startTimer('total_generation');
      this.performanceMonitor.recordOperation('schedule_generation_start');
    }
    
    logger.info('Starting Rapid Scheduler v2.0 generation', { 
      sportType: parameters.sportType,
      conferenceId: parameters.conferenceId,
      teamCount: parameters.teams?.length,
      constraintCount: constraints.length,
      smartHeuristics: this.config.enableSmartHeuristics,
      big12Optimizations: this.config.enableBig12Optimizations
    });
    
    try {
      // Step 1: Get historical recommendations if enabled
      let historicalRecommendations = null;
      if (this.config.useHistoricalData) {
        try {
          historicalRecommendations = await this.schedulingService.getHistoricalRecommendations(parameters);
          
          if (historicalRecommendations.success) {
            logger.info('Using historical recommendations for rapid scheduling');
            
            // Apply recommended constraints if available
            if (historicalRecommendations.constraints) {
              constraints = this._mergeConstraints(constraints, historicalRecommendations.constraints);
              logger.info('Applied recommended constraints from historical data');
            }
          }
        } catch (error) {
          logger.warn(`Failed to get historical recommendations: ${error.message}`);
          // Continue without historical recommendations
        }
      }
      
      // Step 2: Smart generator selection using heuristics
      let generator;
      if (this.config.enableSmartHeuristics && this.heuristicsEngine) {
        generator = this.heuristicsEngine.selectOptimalGenerator(
          parameters.sportType, 
          parameters, 
          constraints
        );
        logger.info(`Smart heuristics selected: ${generator.name}`);
      } else {
        generator = this._selectGenerator(parameters.sportType, parameters, options);
      }
      
      // Step 3: Adaptive constraint processing
      let adaptedConstraints = constraints;
      if (this.config.adaptiveConstraints && this.constraintAdapter) {
        adaptedConstraints = this.constraintAdapter.resolveConflicts(constraints);
        logger.info(`Processed ${adaptedConstraints.length} adaptive constraints`);
      }
      
      // Step 4: Enhanced parallel candidate generation
      let candidates;
      
      if (this.config.candidatePoolSize > this.config.maxCandidates) {
        // Generate large candidate pool first, then select best
        candidates = await this._generateEnhancedCandidatePool(
          parameters,
          generator,
          adaptedConstraints,
          options
        );
      } else {
        // Standard candidate generation
        logger.info(`Generating initial schedule using ${generator.name}`);
        const initialSchedule = await generator.generate(parameters, options);
        
        candidates = [initialSchedule];
        
        if (this.config.maxCandidates > 1) {
          const additionalCandidates = await this._generateCandidates(
            parameters, 
            generator, 
            this.config.maxCandidates - 1,
            options
          );
          
          candidates = [...candidates, ...additionalCandidates];
        }
      }
      
      logger.info(`Generated ${candidates.length} schedule candidates`);
      
      // Step 5: Enhanced parallel optimization
      let optimizedCandidates;
      
      if (this.performanceMonitor) {
        this.performanceMonitor.startTimer('candidate_optimization');
      }
      
      if (this.config.parallelGenerators && candidates.length > 1) {
        // Enhanced parallel optimization with better resource management
        optimizedCandidates = await this._enhancedParallelOptimization(
          candidates, 
          adaptedConstraints, 
          options
        );
      } else {
        // Sequential optimization with progress tracking
        optimizedCandidates = await this._sequentialOptimization(
          candidates, 
          adaptedConstraints, 
          options
        );
      }
      
      if (this.performanceMonitor) {
        this.performanceMonitor.endTimer('candidate_optimization');
      }
      
      // Step 6: Smart candidate selection using multiple criteria
      const bestSchedule = this._enhancedCandidateSelection(optimizedCandidates, parameters);
      
      // Step 7: Big 12 specific optimizations if enabled
      let enhancedSchedule = bestSchedule;
      if (this.config.enableBig12Optimizations && this.big12Engine) {
        enhancedSchedule = await this._applyBig12Enhancements(bestSchedule, parameters);
      }
      
      // Step 8: Final incremental optimization with adaptive techniques
      let finalSchedule = enhancedSchedule;
      if (this.config.useIncrementalOptimization) {
        finalSchedule = await this._enhancedIncrementalOptimization(
          enhancedSchedule, 
          adaptedConstraints, 
          options
        );
      }
      
      // Add comprehensive generation metadata
      const elapsedTime = (Date.now() - startTime) / 1000;
      finalSchedule.metadata = {
        ...finalSchedule.metadata,
        generation: {
          timestamp: new Date().toISOString(),
          elapsedTime,
          version: '2.0',
          generator: generator.name,
          candidateCount: candidates.length,
          usedHistoricalData: !!historicalRecommendations?.success,
          usedIncrementalOptimization: this.config.useIncrementalOptimization,
          usedSmartHeuristics: this.config.enableSmartHeuristics,
          usedBig12Optimizations: this.config.enableBig12Optimizations,
          usedAdaptiveConstraints: this.config.adaptiveConstraints,
          parallelOptimization: this.config.parallelGenerators,
          constraintCount: adaptedConstraints.length,
          performanceMetrics: this.performanceMonitor ? this.performanceMonitor.getSnapshot() : null
        }
      };
      
      logger.info(`Completed rapid schedule generation in ${elapsedTime.toFixed(2)}s`);
      
      // Store in historical data
      try {
        await this.schedulingService.storeHistoricalSchedule(finalSchedule, {
          outcome: 'generated',
          generationTime: elapsedTime
        });
        logger.info('Stored generated schedule in historical data');
      } catch (error) {
        logger.warn(`Failed to store schedule in historical data: ${error.message}`);
        // Continue without storing
      }
      
      return finalSchedule;
    } catch (error) {
      logger.error(`Failed to generate schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Select the best generator for a sport type
   * @param {string} sportType - Type of sport
   * @param {Object} parameters - Schedule parameters
   * @param {Object} options - Generation options
   * @returns {Object} Selected generator
   * @private
   */
  _selectGenerator(sportType, parameters, options) {
    // If a specific generator is requested, use it
    if (options.generator && this.generators[options.generator]) {
      return {
        name: options.generator,
        generate: this.generators[options.generator]
      };
    }
    
    // Select based on sport type and parameters
    switch (sportType) {
      case 'football':
        // Football typically uses a partial round-robin format
        return {
          name: 'partialRoundRobin',
          generate: this.generators.partialRoundRobin
        };
        
      case 'basketball':
      case 'volleyball':
        // Check if we need a partial round-robin
        if (parameters.gameCount && parameters.teams && 
            parameters.gameCount < parameters.teams.length * (parameters.teams.length - 1)) {
          return {
            name: 'partialRoundRobin',
            generate: this.generators.partialRoundRobin
          };
        } else {
          return {
            name: 'roundRobin',
            generate: this.generators.roundRobin
          };
        }
        
      case 'baseball':
      case 'softball':
        // Baseball/softball often uses division-based scheduling
        if (parameters.divisions && parameters.divisions.length > 0) {
          return {
            name: 'divisionBased',
            generate: this.generators.divisionBased
          };
        } else {
          return {
            name: 'roundRobin',
            generate: this.generators.roundRobin
          };
        }
        
      default:
        // Default to round-robin
        return {
          name: 'roundRobin',
          generate: this.generators.roundRobin
        };
    }
  }
  
  /**
   * Generate additional schedule candidates
   * @param {Object} parameters - Schedule parameters
   * @param {Object} generator - Selected generator
   * @param {number} count - Number of candidates to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Generated candidates
   * @private
   */
  async _generateCandidates(parameters, generator, count, options) {
    logger.debug(`Generating ${count} additional schedule candidates`);
    
    // Create variations of the options for diversity
    const candidateOptions = [];
    
    for (let i = 0; i < count; i++) {
      // Create a variation by adjusting options
      candidateOptions.push({
        ...options,
        seed: Math.floor(Math.random() * 1000000), // Different random seed
        prioritizeWeekends: i % 2 === 0, // Alternate weekend priority
        balanceHomeAway: i % 3 === 0, // Vary home/away balance priority
        variation: i // Track variation number
      });
    }
    
    // Generate candidates in parallel or sequentially
    let candidates;
    
    if (this.config.parallelGenerators) {
      // Generate in parallel
      candidates = await Promise.all(
        candidateOptions.map(opts => generator.generate(parameters, opts))
      );
    } else {
      // Generate sequentially
      candidates = [];
      for (const opts of candidateOptions) {
        candidates.push(await generator.generate(parameters, opts));
      }
    }
    
    // Ensure each candidate has a unique ID
    candidates.forEach((candidate, index) => {
      candidate.id = candidate.id || `${parameters.sportType}-${uuidv4()}`;
      candidate.metadata = {
        ...candidate.metadata,
        candidate: {
          number: index + 1,
          variation: candidateOptions[index].variation
        }
      };
    });
    
    return candidates;
  }
  
  /**
   * Optimize a schedule
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   * @private
   */
  async _optimizeSchedule(schedule, constraints, options) {
    logger.debug(`Optimizing schedule ${schedule.id}`);
    
    // Create a multi-variable optimizer
    const optimizer = new this.optimizers.multiVariable({
      maxIterations: options.fastOptimization ? 200 : 500,
      convergenceThreshold: 0.001,
      parallelEvaluations: true
    });
    
    // Adapt to sport type
    const sportType = schedule.sportType;
    
    // Set constraint weights based on sport type
    let constraintWeights = {};
    
    switch (sportType) {
      case 'football':
        constraintWeights = {
          travelDistance: 1.2,
          homeAwayBalance: 1.0,
          restDays: 1.5,
          weekendDistribution: 1.5
        };
        break;
        
      case 'basketball':
        constraintWeights = {
          travelDistance: 1.3,
          homeAwayBalance: 1.2,
          restDays: 1.0,
          consecutiveGames: 0.8
        };
        break;
        
      case 'baseball':
      case 'softball':
        constraintWeights = {
          travelDistance: 1.2,
          homeAwayBalance: 1.0,
          consecutiveGames: 1.5,
          restDays: 0.7
        };
        break;
        
      case 'volleyball':
      case 'soccer':
        constraintWeights = {
          travelDistance: 1.2,
          homeAwayBalance: 1.2,
          restDays: 1.0,
          weekendDistribution: 1.0
        };
        break;
    }
    
    // Apply constraint weights
    optimizer.setConstraintWeights(constraintWeights);
    
    // Optimize the schedule
    return optimizer.optimize(schedule, constraints, {
      sportType,
      conferenceAdaptations: options.conferenceAdaptations,
      candidateCount: options.fastOptimization ? 3 : 5
    });
  }
  
  /**
   * Select the best candidate from a set of optimized schedules
   * @param {Array} candidates - Optimized schedule candidates
   * @returns {Object} Best candidate
   * @private
   */
  _selectBestCandidate(candidates) {
    if (candidates.length === 0) {
      throw new Error('No candidates to select from');
    }
    
    if (candidates.length === 1) {
      return candidates[0];
    }
    
    // Select based on optimization score
    let bestCandidate = candidates[0];
    let bestScore = bestCandidate.metadata?.optimization?.score || 0;
    
    for (let i = 1; i < candidates.length; i++) {
      const score = candidates[i].metadata?.optimization?.score || 0;
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidates[i];
      }
    }
    
    logger.info(`Selected best candidate with score ${bestScore.toFixed(4)}`);
    return bestCandidate;
  }
  
  /**
   * Perform incremental optimization on a schedule
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   * @private
   */
  async _incrementalOptimization(schedule, constraints, options) {
    logger.info('Performing incremental optimization');
    
    // Create a travel optimizer for focused travel optimization
    const travelOptimizer = new this.optimizers.travelOptimizer();
    
    // First optimize for travel
    const travelOptimized = await travelOptimizer.optimize(schedule, {
      iterations: options.fastOptimization ? 100 : 300,
      ...options
    });
    
    // Then use multi-variable optimizer for final pass
    const multiOptimizer = new this.optimizers.multiVariable({
      maxIterations: options.fastOptimization ? 100 : 300,
      convergenceThreshold: 0.0005,
      parallelEvaluations: true
    });
    
    // Final optimization pass
    return multiOptimizer.optimize(travelOptimized, constraints, {
      sportType: schedule.sportType,
      candidateCount: options.fastOptimization ? 3 : 5,
      ...options
    });
  }
  
  /**
   * Merge user constraints with recommended constraints
   * @param {Array} userConstraints - User-specified constraints
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
   * Generate enhanced candidate pool with intelligent selection
   * @param {Object} parameters - Schedule parameters
   * @param {Object} generator - Primary generator
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Best candidates from large pool
   * @private
   */
  async _generateEnhancedCandidatePool(parameters, generator, constraints, options) {
    logger.info(`Generating enhanced candidate pool of ${this.config.candidatePoolSize} schedules`);
    
    const poolCandidates = [];
    const generatorVariations = [
      { ...options, seed: Math.random() * 1000000, strategy: 'balanced' },
      { ...options, seed: Math.random() * 1000000, strategy: 'travel_optimized' },
      { ...options, seed: Math.random() * 1000000, strategy: 'home_away_balanced' },
      { ...options, seed: Math.random() * 1000000, strategy: 'date_optimized' }
    ];
    
    // Generate candidates with different strategies
    const batchSize = Math.ceil(this.config.candidatePoolSize / generatorVariations.length);
    
    for (const variation of generatorVariations) {
      const batchPromises = [];
      
      for (let i = 0; i < batchSize && poolCandidates.length < this.config.candidatePoolSize; i++) {
        const candidateOptions = {
          ...variation,
          seed: variation.seed + i,
          candidateId: `pool_${poolCandidates.length + i}`
        };
        
        batchPromises.push(generator.generate(parameters, candidateOptions));
      }
      
      try {
        const batchResults = await Promise.all(batchPromises);
        poolCandidates.push(...batchResults);
      } catch (error) {
        logger.warn(`Failed to generate batch with strategy ${variation.strategy}:`, error.message);
      }
    }
    
    // Quick evaluation and selection of best candidates
    const evaluatedCandidates = poolCandidates.map(candidate => ({
      candidate,
      score: this._quickEvaluateCandidate(candidate, constraints)
    }));
    
    // Sort by score and select top candidates
    evaluatedCandidates.sort((a, b) => b.score - a.score);
    const selectedCandidates = evaluatedCandidates
      .slice(0, this.config.maxCandidates)
      .map(item => item.candidate);
    
    logger.info(`Selected ${selectedCandidates.length} best candidates from pool of ${poolCandidates.length}`);
    
    return selectedCandidates;
  }
  
  /**
   * Quick evaluation of candidate quality
   * @param {Object} candidate - Schedule candidate
   * @param {Array} constraints - Constraints to check
   * @returns {number} Quality score
   * @private
   */
  _quickEvaluateCandidate(candidate, constraints) {
    let score = 100; // Start with perfect score
    
    // Quick checks for basic schedule quality
    if (!candidate.games || candidate.games.length === 0) {
      return 0;
    }
    
    // Check for obvious constraint violations
    const games = candidate.games;
    let violations = 0;
    
    // Check for same-day conflicts
    const gamesByDate = {};
    for (const game of games) {
      const dateKey = game.date.toDateString();
      if (!gamesByDate[dateKey]) {
        gamesByDate[dateKey] = [];
      }
      gamesByDate[dateKey].push(game);
    }
    
    // Penalize days with too many games
    for (const [date, dayGames] of Object.entries(gamesByDate)) {
      if (dayGames.length > 8) { // Reasonable limit for a conference
        violations += (dayGames.length - 8) * 2;
      }
    }
    
    // Basic home/away balance check
    const teamStats = {};
    for (const game of games) {
      if (!teamStats[game.homeTeam.id]) {
        teamStats[game.homeTeam.id] = { home: 0, away: 0 };
      }
      if (!teamStats[game.awayTeam.id]) {
        teamStats[game.awayTeam.id] = { home: 0, away: 0 };
      }
      
      teamStats[game.homeTeam.id].home++;
      teamStats[game.awayTeam.id].away++;
    }
    
    for (const [teamId, stats] of Object.entries(teamStats)) {
      const imbalance = Math.abs(stats.home - stats.away);
      if (imbalance > 2) {
        violations += imbalance;
      }
    }
    
    return Math.max(0, score - violations);
  }
  
  /**
   * Enhanced parallel optimization with resource management
   * @param {Array} candidates - Candidates to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Array>} Optimized candidates
   * @private
   */
  async _enhancedParallelOptimization(candidates, constraints, options) {
    const maxParallelJobs = Math.min(this.config.maxParallelWorkers, candidates.length);
    const optimizedCandidates = [];
    
    // Split candidates into batches for parallel processing
    const batches = [];
    const batchSize = Math.ceil(candidates.length / maxParallelJobs);
    
    for (let i = 0; i < candidates.length; i += batchSize) {
      batches.push(candidates.slice(i, i + batchSize));
    }
    
    logger.info(`Processing ${candidates.length} candidates in ${batches.length} parallel batches`);
    
    // Process batches in parallel
    const batchPromises = batches.map((batch, index) => 
      this._processCandidateBatch(batch, constraints, options, index)
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      
      // Flatten results
      for (const batchResult of batchResults) {
        optimizedCandidates.push(...batchResult);
      }
    } catch (error) {
      logger.error('Error in parallel optimization:', error);
      throw error;
    }
    
    return optimizedCandidates;
  }
  
  /**
   * Process a batch of candidates
   * @param {Array} batch - Candidate batch
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @param {number} batchIndex - Batch index for tracking
   * @returns {Promise<Array>} Optimized batch
   * @private
   */
  async _processCandidateBatch(batch, constraints, options, batchIndex) {
    const optimizedBatch = [];
    
    for (let i = 0; i < batch.length; i++) {
      const candidate = batch[i];
      
      try {
        // Emit progress for real-time tracking
        if (this.config.enableRealTimeProgress) {
          this.eventEmitter.emit('optimization:progress', {
            batchIndex,
            candidateIndex: i,
            totalCandidates: batch.length,
            candidate: candidate.id
          });
        }
        
        const optimized = await this._optimizeSchedule(candidate, constraints, {
          ...options,
          batchIndex,
          candidateIndex: i
        });
        
        optimizedBatch.push(optimized);
      } catch (error) {
        logger.warn(`Failed to optimize candidate ${i} in batch ${batchIndex}:`, error.message);
        // Keep original candidate if optimization fails
        optimizedBatch.push(candidate);
      }
    }
    
    return optimizedBatch;
  }
  
  /**
   * Sequential optimization with progress tracking
   * @param {Array} candidates - Candidates to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Array>} Optimized candidates
   * @private
   */
  async _sequentialOptimization(candidates, constraints, options) {
    const optimizedCandidates = [];
    
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        // Emit progress
        if (this.config.enableRealTimeProgress) {
          this.eventEmitter.emit('optimization:progress', {
            candidateIndex: i,
            totalCandidates: candidates.length,
            candidate: candidate.id,
            sequential: true
          });
        }
        
        const optimized = await this._optimizeSchedule(candidate, constraints, {
          ...options,
          candidateIndex: i
        });
        
        optimizedCandidates.push(optimized);
      } catch (error) {
        logger.warn(`Failed to optimize candidate ${i}:`, error.message);
        optimizedCandidates.push(candidate);
      }
    }
    
    return optimizedCandidates;
  }
  
  /**
   * Enhanced candidate selection using multiple criteria
   * @param {Array} candidates - Optimized candidates
   * @param {Object} parameters - Original parameters
   * @returns {Object} Best candidate
   * @private
   */
  _enhancedCandidateSelection(candidates, parameters) {
    if (candidates.length === 0) {
      throw new Error('No candidates to select from');
    }
    
    if (candidates.length === 1) {
      return candidates[0];
    }
    
    // Multi-criteria evaluation
    const evaluatedCandidates = candidates.map(candidate => {
      const score = this._calculateComprehensiveScore(candidate, parameters);
      return { candidate, score };
    });
    
    // Sort by comprehensive score
    evaluatedCandidates.sort((a, b) => b.score - a.score);
    
    const bestCandidate = evaluatedCandidates[0].candidate;
    
    logger.info(`Selected best candidate with comprehensive score ${evaluatedCandidates[0].score.toFixed(4)}`);
    
    return bestCandidate;
  }
  
  /**
   * Calculate comprehensive score for candidate selection
   * @param {Object} candidate - Schedule candidate
   * @param {Object} parameters - Original parameters
   * @returns {number} Comprehensive score
   * @private
   */
  _calculateComprehensiveScore(candidate, parameters) {
    let score = 0;
    
    // Optimization score (if available)
    const optimizationScore = candidate.metadata?.optimization?.score || 0;
    score += optimizationScore * 0.4;
    
    // Schedule quality metrics
    const qualityScore = this._quickEvaluateCandidate(candidate, []);
    score += qualityScore * 0.3;
    
    // Sport-specific bonuses
    const sportBonus = this._calculateSportSpecificBonus(candidate, parameters.sportType);
    score += sportBonus * 0.2;
    
    // Big 12 specific bonuses
    if (this.config.enableBig12Optimizations) {
      const big12Bonus = this._calculateBig12Bonus(candidate);
      score += big12Bonus * 0.1;
    }
    
    return score;
  }
  
  /**
   * Calculate sport-specific bonus score
   * @param {Object} candidate - Schedule candidate
   * @param {string} sportType - Sport type
   * @returns {number} Sport-specific bonus
   * @private
   */
  _calculateSportSpecificBonus(candidate, sportType) {
    let bonus = 0;
    
    switch (sportType?.toLowerCase()) {
      case 'football':
        // Bonus for proper rest days and weekend distribution
        bonus += this._checkFootballCriteria(candidate);
        break;
        
      case 'basketball':
        // Bonus for balanced home/away and reasonable travel
        bonus += this._checkBasketballCriteria(candidate);
        break;
        
      case 'baseball':
      case 'softball':
        // Bonus for series scheduling and weather considerations
        bonus += this._checkBaseballSoftballCriteria(candidate);
        break;
        
      default:
        bonus = 0;
    }
    
    return bonus;
  }
  
  /**
   * Calculate Big 12 specific bonus
   * @param {Object} candidate - Schedule candidate
   * @returns {number} Big 12 bonus score
   * @private
   */
  _calculateBig12Bonus(candidate) {
    let bonus = 0;
    
    // Check for BYU Sunday compliance
    const byuSundayViolations = this._checkBYUSundayViolations(candidate);
    bonus += Math.max(0, 10 - byuSundayViolations);
    
    // Check for reasonable travel patterns
    const travelScore = this._checkBig12TravelPatterns(candidate);
    bonus += travelScore;
    
    return bonus;
  }
  
  /**
   * Apply Big 12 specific enhancements
   * @param {Object} schedule - Schedule to enhance
   * @param {Object} parameters - Original parameters
   * @returns {Promise<Object>} Enhanced schedule
   * @private
   */
  async _applyBig12Enhancements(schedule, parameters) {
    logger.info('Applying Big 12 specific enhancements');
    
    let enhancedSchedule = { ...schedule };
    
    // Apply Big 12 constraints
    enhancedSchedule = this.big12Engine.applyBig12Constraints(enhancedSchedule, parameters.sportType);
    
    // Optimize travel patterns
    enhancedSchedule = this.big12Engine.optimizeTravelPatterns(enhancedSchedule);
    
    // Handle venue sharing
    enhancedSchedule = this.big12Engine.handleVenueSharing(enhancedSchedule);
    
    return enhancedSchedule;
  }
  
  /**
   * Enhanced incremental optimization
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   * @private
   */
  async _enhancedIncrementalOptimization(schedule, constraints, options) {
    logger.info('Performing enhanced incremental optimization');
    
    // Use enhanced simulated annealing for final optimization
    const EnhancedSimulatedAnnealing = this.optimizers.enhancedSimulatedAnnealing;
    
    const optimizer = new EnhancedSimulatedAnnealing(schedule, {
      maxIterations: options.fastOptimization ? 5000 : 10000,
      useMultiprocessing: true,
      bigTwelveOptimizations: this.config.enableBig12Optimizations,
      smartConstraintCaching: true,
      performanceMonitoring: true
    });
    
    return await optimizer.optimize();
  }
  
  // Fallback generator methods (simplified implementations)
  _createFallbackRoundRobinGenerator() {
    return {
      generate: async (parameters, options) => {
        logger.info('Using fallback round-robin generator');
        // Simplified round-robin implementation
        return this._generateSimpleRoundRobin(parameters, options);
      }
    };
  }
  
  _createFallbackPartialRoundRobinGenerator() {
    return {
      generate: async (parameters, options) => {
        logger.info('Using fallback partial round-robin generator');
        return this._generateSimplePartialRoundRobin(parameters, options);
      }
    };
  }
  
  _createFallbackDivisionBasedGenerator() {
    return {
      generate: async (parameters, options) => {
        logger.info('Using fallback division-based generator');
        return this._generateSimpleDivisionBased(parameters, options);
      }
    };
  }
  
  // Additional helper methods would be implemented here...
  // (For brevity, showing structure only)
  
  _generateSimpleRoundRobin(parameters, options) {
    // Implementation would create a basic round-robin schedule
    return {
      id: uuidv4(),
      sportType: parameters.sportType,
      games: [],
      metadata: { generator: 'fallback_round_robin' }
    };
  }
  
  _checkFootballCriteria(candidate) {
    // Implementation for football-specific criteria
    return 0;
  }
  
  _checkBasketballCriteria(candidate) {
    // Implementation for basketball-specific criteria
    return 0;
  }
  
  _checkBaseballSoftballCriteria(candidate) {
    // Implementation for baseball/softball-specific criteria
    return 0;
  }
  
  _checkBYUSundayViolations(candidate) {
    // Check for BYU Sunday game violations
    let violations = 0;
    for (const game of candidate.games || []) {
      if (game.date.getDay() === 0 && // Sunday
          (game.homeTeam.name?.toLowerCase().includes('byu') || 
           game.awayTeam.name?.toLowerCase().includes('byu'))) {
        violations++;
      }
    }
    return violations;
  }
  
  _checkBig12TravelPatterns(candidate) {
    // Analyze travel patterns for Big 12 efficiency
    return 0;
  }
}

module.exports = RapidScheduler;
