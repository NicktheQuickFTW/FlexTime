/**
 * Parallel Scheduling Agent System for FlexTime
 * 
 * Enhanced scheduling agent system that leverages parallel processing
 * for improved performance.
 */

const { SchedulingAgentSystem } = require('../core/scheduling_agent_system');
const logger = require('../../utils/logger');

/**
 * Scheduling Agent System with parallel processing capabilities
 */
class ParallelSchedulingAgentSystem extends SchedulingAgentSystem {
  /**
   * Initialize a new Parallel Scheduling Agent System
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super(config);
    
    // Parallel processing configuration
    this.config = {
      ...this.config,
      maxParallelOperations: config.maxParallelOperations || 4,
      enableParallelOptimization: config.enableParallelOptimization !== false,
      enableParallelConstraintEvaluation: config.enableParallelConstraintEvaluation !== false,
      ...config
    };
    
    logger.info('Parallel Scheduling Agent System initialized');
  }
  
  /**
   * Generate a schedule using parallel processing for sub-tasks
   * 
   * @param {string} sportType - Type of sport (basketball, football, etc.)
   * @param {Array<Team>} teams - Teams to include in the schedule
   * @param {Array<Constraint>} constraints - Constraints to apply to the schedule
   * @param {Object} options - Additional options
   * @returns {Promise<Schedule>} Generated schedule
   */
  async generateSchedule(sportType, teams, constraints = [], options = {}) {
    try {
      if (!this.initialized) {
        logger.warn('Parallel Scheduling Agent System not initialized, initializing now');
        await this.initialize();
      }
      
      logger.info(`Generating schedule for ${sportType} with ${teams.length} teams using parallel processing`);
      
      // Run preparation tasks in parallel
      const [
        algorithmSelection,
        historicalInsights,
        sportSpecificConstraints
      ] = await Promise.all([
        this._selectAlgorithm(sportType, teams.length, options),
        this._getHistoricalInsights(sportType, teams.length),
        this._getSportSpecificConstraints(sportType, constraints)
      ]);
      
      // Combine constraints
      const allConstraints = [...constraints, ...sportSpecificConstraints];
      
      // Prepare schedule generation parameters
      const schedulingParameters = {
        sportType,
        teams,
        constraints: allConstraints,
        algorithm: algorithmSelection,
        options: {
          season: options.season || '2025-2026',
          balanceHomeAway: options.balanceHomeAway !== false,
          optimizeTravel: options.optimizeTravel !== false,
          seedSchedule: options.seedSchedule || null,
          historicalInsights,
          ...options
        }
      };
      
      // Get scheduling director agent
      const schedulingDirector = this.getAgent('scheduling_director');
      if (!schedulingDirector) {
        throw new Error('Scheduling director agent not registered');
      }
      
      // Generate schedule using the scheduling director agent
      const schedule = await schedulingDirector.generateSchedule(schedulingParameters);
      
      // Run post-processing optimizations in parallel
      if (this.config.enableParallelOptimization && teams.length >= 8) {
        await this._runParallelOptimizations(schedule, options);
      } else {
        // Apply standard optimizations sequentially
        await this._applyStandardOptimizations(schedule, options);
      }
      
      // Calculate schedule metrics
      const metrics = await this._calculateMetrics(schedule);
      schedule.metrics = metrics;
      
      // Store experience for learning
      this.storeExperience('scheduling_director', schedule, {
        sportType,
        teamCount: teams.length,
        constraintCount: allConstraints.length,
        options,
        algorithm: algorithmSelection
      });
      
      logger.info(`Schedule generated with ${schedule.games.length} games`);
      return schedule;
    } catch (error) {
      logger.error(`Failed to generate schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Select the appropriate algorithm for the schedule
   * 
   * @param {string} sportType - Type of sport
   * @param {number} teamCount - Number of teams
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Selected algorithm
   * @private
   */
  async _selectAlgorithm(sportType, teamCount, options) {
    // If algorithm is specified in options, use that
    if (options.algorithm) {
      return options.algorithm;
    }
    
    // Get algorithm selection agent
    const algorithmAgent = this.getAgent('scheduling.algorithm');
    
    if (algorithmAgent) {
      // Delegate to specialized agent
      const task = this.createTask(
        'select_algorithm',
        `Select algorithm for ${sportType} with ${teamCount} teams`,
        { sportType, teamCount, options }
      );
      
      // Send task to agent and wait for result
      return await this.delegateTask(algorithmAgent.agentId, task);
    } else {
      // Fallback to simple selection logic
      if (teamCount > 20) {
        return 'partial_round_robin';
      } else if (teamCount > 10) {
        return 'simulated_annealing';
      } else {
        return 'round_robin';
      }
    }
  }
  
  /**
   * Get historical insights for scheduling
   * 
   * @param {string} sportType - Type of sport
   * @param {number} teamCount - Number of teams
   * @returns {Promise<Object>} Historical insights
   * @private
   */
  async _getHistoricalInsights(sportType, teamCount) {
    if (!this.config.enableHistoricalLearning) {
      return null;
    }
    
    try {
      return await this.historicalData.getSchedulingInsights(sportType, teamCount);
    } catch (error) {
      logger.warn(`Failed to get historical insights: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get sport-specific constraints
   * 
   * @param {string} sportType - Type of sport
   * @param {Array} baseConstraints - Base constraints
   * @returns {Promise<Array>} Sport-specific constraints
   * @private
   */
  async _getSportSpecificConstraints(sportType, baseConstraints) {
    // Get constraint management agent
    const constraintAgent = this.getAgent('scheduling.constraint');
    
    if (constraintAgent) {
      // Delegate to specialized agent
      const task = this.createTask(
        'analyze_constraints',
        `Get sport-specific constraints for ${sportType}`,
        { sportType, baseConstraints }
      );
      
      // Send task to agent and wait for result
      return await this.delegateTask(constraintAgent.agentId, task);
    } else {
      // Fallback to empty constraints
      return [];
    }
  }
  
  /**
   * Run optimizations in parallel for a schedule
   * 
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Optimization options
   * @returns {Promise<void>}
   * @private
   */
  async _runParallelOptimizations(schedule, options) {
    logger.info('Running parallel optimizations');
    
    // Create optimization tasks
    const optimizationTasks = [
      // Travel distance optimization
      this._createOptimizationTask('travel', schedule, {
        ...options,
        maxIterations: options.travelOptimizationIterations || 100
      }),
      
      // Home/away balance optimization
      this._createOptimizationTask('home_away_balance', schedule, {
        ...options,
        maxIterations: options.balanceOptimizationIterations || 50
      }),
      
      // Rest days optimization
      this._createOptimizationTask('rest_days', schedule, {
        ...options,
        maxIterations: options.restOptimizationIterations || 50
      })
    ];
    
    // Add sport-specific optimizations
    if (schedule.sport === 'basketball' || schedule.sport === 'Basketball') {
      optimizationTasks.push(
        this._createOptimizationTask('basketball_specific', schedule, options)
      );
    } else if (schedule.sport === 'football' || schedule.sport === 'Football') {
      optimizationTasks.push(
        this._createOptimizationTask('football_specific', schedule, options)
      );
    }
    
    // Run optimizations in parallel
    const optimizationAgent = this.getAgent('scheduling.optimization');
    
    if (optimizationAgent) {
      // Use batch processing to limit concurrency
      const batchSize = this.config.maxParallelOperations;
      const results = [];
      
      for (let i = 0; i < optimizationTasks.length; i += batchSize) {
        const batch = optimizationTasks.slice(i, i + batchSize);
        
        // Run batch in parallel
        const batchResults = await Promise.all(
          batch.map(task => this.delegateTask(optimizationAgent.agentId, task))
        );
        
        results.push(...batchResults);
      }
      
      // Apply results to schedule
      for (const result of results) {
        if (result && result.success) {
          this._applyOptimizationResult(schedule, result);
        }
      }
    } else {
      // Fall back to standard sequential optimization
      await this._applyStandardOptimizations(schedule, options);
    }
  }
  
  /**
   * Create an optimization task
   * 
   * @param {string} optimizationType - Type of optimization
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Optimization options
   * @returns {Object} Task object
   * @private
   */
  _createOptimizationTask(optimizationType, schedule, options) {
    return this.createTask(
      'optimize_schedule',
      `Optimize schedule for ${optimizationType}`,
      {
        scheduleId: schedule.id,
        optimizationType,
        existingSchedule: schedule,
        options
      }
    );
  }
  
  /**
   * Apply optimization result to schedule
   * 
   * @param {Schedule} schedule - Schedule to update
   * @param {Object} result - Optimization result
   * @private
   */
  _applyOptimizationResult(schedule, result) {
    if (result.games) {
      // Replace games
      schedule.games = result.games;
    }
    
    if (result.metrics) {
      // Update metrics
      schedule.metrics = {
        ...schedule.metrics,
        ...result.metrics
      };
    }
  }
  
  /**
   * Apply standard optimizations sequentially
   * 
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Optimization options
   * @returns {Promise<void>}
   * @private
   */
  async _applyStandardOptimizations(schedule, options) {
    // Apply travel optimization if requested
    if (options.optimizeTravel !== false && schedule.teams.length >= 8) {
      logger.info('Applying travel optimization to schedule');
      await this.travelOptimizer.optimize(schedule, {
        maxIterations: options.travelOptimizationIterations || 100,
        teams: schedule.teams
      });
    }
    
    // Apply home/away balance optimization if requested
    if (options.balanceHomeAway !== false) {
      logger.info('Applying home/away balance optimization');
      // Implementation depends on specific balancer class
    }
  }
  
  /**
   * Calculate metrics for a schedule in parallel
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @returns {Promise<Object>} Schedule metrics
   * @private
   */
  async _calculateMetrics(schedule) {
    // Calculate different metrics in parallel
    const [
      distanceMetrics,
      balanceMetrics,
      constraintMetrics
    ] = await Promise.all([
      this._calculateDistanceMetrics(schedule),
      this._calculateBalanceMetrics(schedule),
      this._calculateConstraintMetrics(schedule)
    ]);
    
    // Combine metrics
    return {
      ...distanceMetrics,
      ...balanceMetrics,
      ...constraintMetrics,
      calculatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Calculate distance metrics for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @returns {Promise<Object>} Distance metrics
   * @private
   */
  async _calculateDistanceMetrics(schedule) {
    return this.scheduleMetrics.calculateDistanceMetrics(schedule);
  }
  
  /**
   * Calculate balance metrics for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @returns {Promise<Object>} Balance metrics
   * @private
   */
  async _calculateBalanceMetrics(schedule) {
    return this.scheduleMetrics.calculateBalanceMetrics(schedule);
  }
  
  /**
   * Calculate constraint satisfaction metrics for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @returns {Promise<Object>} Constraint metrics
   * @private
   */
  async _calculateConstraintMetrics(schedule) {
    return this.scheduleMetrics.calculateConstraintMetrics(schedule);
  }
  
  /**
   * Analyze a schedule using parallel processing
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeSchedule(schedule, options = {}) {
    try {
      logger.info(`Analyzing schedule ${schedule.id} using parallel processing`);
      
      // Run different analyses in parallel
      const [
        basicMetrics,
        constraintAnalysis,
        teamAnalysis,
        venueAnalysis
      ] = await Promise.all([
        this._calculateMetrics(schedule),
        this._analyzeConstraints(schedule, options),
        this._analyzeTeams(schedule, options),
        this._analyzeVenues(schedule, options)
      ]);
      
      // Combine all analyses
      const combinedAnalysis = {
        scheduleId: schedule.id,
        sport: schedule.sport,
        season: schedule.season,
        teamCount: schedule.teams.length,
        gameCount: schedule.games.length,
        metrics: basicMetrics,
        constraints: constraintAnalysis,
        teams: teamAnalysis,
        venues: venueAnalysis,
        analysisTime: new Date().toISOString()
      };
      
      // If AI analysis is requested and available, add it
      if (options.aiAnalysis && this.mcpConnector) {
        combinedAnalysis.aiInsights = await this._getAIAnalysis(schedule, combinedAnalysis);
      }
      
      return combinedAnalysis;
    } catch (error) {
      logger.error(`Failed to analyze schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze constraints for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Constraint analysis
   * @private
   */
  async _analyzeConstraints(schedule, options) {
    // Get constraint agent
    const constraintAgent = this.getAgent('scheduling.constraint');
    
    if (constraintAgent && this.config.enableParallelConstraintEvaluation) {
      // Delegate to specialized agent
      const task = this.createTask(
        'analyze_constraints',
        `Analyze constraints for schedule ${schedule.id}`,
        { schedule, options }
      );
      
      // Send task to agent and wait for result
      return await this.delegateTask(constraintAgent.agentId, task);
    } else {
      // Fallback to standard evaluation
      return this.scheduleMetrics.evaluateConstraints(schedule, options);
    }
  }
  
  /**
   * Analyze teams for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Team analysis
   * @private
   */
  async _analyzeTeams(schedule, options) {
    return this.scheduleMetrics.analyzeTeams(schedule, options);
  }
  
  /**
   * Analyze venues for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Venue analysis
   * @private
   */
  async _analyzeVenues(schedule, options) {
    return this.scheduleMetrics.analyzeVenues(schedule, options);
  }
  
  /**
   * Get AI analysis for a schedule
   * 
   * @param {Schedule} schedule - Schedule to analyze
   * @param {Object} baseAnalysis - Base analysis data
   * @returns {Promise<Object>} AI insights
   * @private
   */
  async _getAIAnalysis(schedule, baseAnalysis) {
    try {
      // Prepare context for AI analysis
      const context = {
        schedule: {
          id: schedule.id,
          sport: schedule.sport,
          season: schedule.season,
          teamCount: schedule.teams.length,
          gameCount: schedule.games.length,
          startDate: schedule.startDate,
          endDate: schedule.endDate
        },
        metrics: baseAnalysis.metrics,
        constraintViolations: baseAnalysis.constraints.violations || []
      };
      
      // Prepare prompt for AI analysis
      const prompt = `
        As an expert in sports scheduling, analyze this ${schedule.sport} schedule:
        
        - ${schedule.teams.length} teams
        - ${schedule.games.length} games
        - Season: ${schedule.season}
        - Metrics provided in context
        
        Please provide insights on:
        1. Overall schedule quality
        2. Key strengths of this schedule
        3. Areas that could be improved
        4. Recommendations for future scheduling
        
        Focus on the most significant patterns and issues, not minor details.
        Limit your response to the most important insights.
      `;
      
      // Send to MCP for analysis
      const response = await this.mcpConnector.sendRequest(
        'gpt-4',
        prompt,
        context,
        `schedule_analysis_${schedule.id}`
      );
      
      return {
        summary: response.content,
        analysisModel: 'gpt-4',
        confident: response.confidence > 0.8
      };
    } catch (error) {
      logger.warn(`Failed to get AI analysis: ${error.message}`);
      return {
        summary: 'AI analysis unavailable',
        error: error.message
      };
    }
  }
}

module.exports = ParallelSchedulingAgentSystem;