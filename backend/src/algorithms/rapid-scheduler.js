/**
 * FlexTime Rapid Scheduler
 * 
 * Inspired by Fastbreak AI's approach, this module provides high-performance
 * schedule generation capabilities to reduce scheduling time from weeks to hours.
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
      maxCandidates: 5,
      ...config
    };
    
    // Initialize generators
    this.generators = {
      roundRobin: require('./generators/round-robin-generator'),
      partialRoundRobin: require('./generators/partial-round-robin-generator'),
      divisionBased: require('./generators/division-based-generator')
    };
    
    // Initialize optimizers
    this.optimizers = {
      travelOptimizer: require('./travel-optimizer'),
      multiVariable: require('./multi-variable-optimizer')
    };
    
    // Initialize Scheduling Service client
    this.schedulingService = new SchedulingServiceClient(config.schedulingService || {});
    
    logger.info('Rapid Scheduler created', { 
      parallelGenerators: this.config.parallelGenerators,
      useHistoricalData: this.config.useHistoricalData
    });
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
   * Generate a schedule rapidly
   * @param {Object} parameters - Schedule parameters
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated schedule
   */
  async generateSchedule(parameters, constraints = [], options = {}) {
    const startTime = Date.now();
    logger.info('Starting rapid schedule generation', { 
      sportType: parameters.sportType,
      conferenceId: parameters.conferenceId,
      teamCount: parameters.teams?.length,
      constraintCount: constraints.length
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
      
      // Step 2: Select the best generator for this sport type
      const generator = this._selectGenerator(parameters.sportType, parameters, options);
      
      // Step 3: Generate initial schedule
      logger.info(`Generating initial schedule using ${generator.name}`);
      const initialSchedule = await generator.generate(parameters, options);
      
      // Step 4: Generate multiple candidates if enabled
      let candidates = [initialSchedule];
      
      if (this.config.maxCandidates > 1) {
        // Generate additional candidates
        const additionalCandidates = await this._generateCandidates(
          parameters, 
          generator, 
          this.config.maxCandidates - 1,
          options
        );
        
        candidates = [...candidates, ...additionalCandidates];
        logger.info(`Generated ${candidates.length} schedule candidates`);
      }
      
      // Step 5: Optimize each candidate
      let optimizedCandidates;
      
      if (this.config.parallelGenerators) {
        // Optimize candidates in parallel
        optimizedCandidates = await Promise.all(
          candidates.map(candidate => 
            this._optimizeSchedule(candidate, constraints, options)
          )
        );
      } else {
        // Optimize candidates sequentially
        optimizedCandidates = [];
        for (const candidate of candidates) {
          optimizedCandidates.push(
            await this._optimizeSchedule(candidate, constraints, options)
          );
        }
      }
      
      // Step 6: Select the best candidate
      const bestSchedule = this._selectBestCandidate(optimizedCandidates);
      
      // Step 7: Final incremental optimization if enabled
      let finalSchedule = bestSchedule;
      if (this.config.useIncrementalOptimization) {
        finalSchedule = await this._incrementalOptimization(bestSchedule, constraints, options);
      }
      
      // Add generation metadata
      const elapsedTime = (Date.now() - startTime) / 1000;
      finalSchedule.metadata = {
        ...finalSchedule.metadata,
        generation: {
          timestamp: new Date().toISOString(),
          elapsedTime,
          generator: generator.name,
          candidateCount: candidates.length,
          usedHistoricalData: !!historicalRecommendations?.success,
          usedIncrementalOptimization: this.config.useIncrementalOptimization
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
}

module.exports = RapidScheduler;
