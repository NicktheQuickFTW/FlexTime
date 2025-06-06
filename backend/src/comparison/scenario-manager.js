/**
 * FlexTime Scenario Manager
 * 
 * Inspired by Fastbreak AI's approach, this module provides tools for generating
 * and comparing multiple schedule scenarios to support decision-making.
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../scripts/logger");
const MultiVariableOptimizer = require('../algorithms/multi-variable-optimizer');

/**
 * Scenario Manager for generating and comparing schedule scenarios
 */
class ScenarioManager {
  /**
   * Create a new Scenario Manager
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      maxScenarios: 10,
      parallelGeneration: true,
      storageEnabled: true,
      ...config
    };
    
    this.optimizer = new MultiVariableOptimizer(config.optimizer);
    this.scenarios = new Map();
    
    // Connect to Intelligence Engine for historical data if available
    this.intelligenceEngine = config.intelligenceEngine;
    
    logger.info('Scenario Manager created');
  }
  
  /**
   * Generate multiple schedule scenarios
   * @param {Object} baseSchedule - Base schedule to generate scenarios from
   * @param {Array} scenarioDefinitions - Definitions for each scenario
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Generated scenarios
   */
  async generateScenarios(baseSchedule, scenarioDefinitions = [], options = {}) {
    logger.info('Generating schedule scenarios', { 
      count: scenarioDefinitions.length,
      sportType: baseSchedule.sportType,
      options
    });
    
    // Limit number of scenarios
    const limitedDefinitions = scenarioDefinitions.slice(0, this.config.maxScenarios);
    
    // Generate scenarios in parallel or sequentially
    let scenarios;
    if (this.config.parallelGeneration) {
      scenarios = await Promise.all(
        limitedDefinitions.map(definition => 
          this._generateScenario(baseSchedule, definition, options)
        )
      );
    } else {
      scenarios = [];
      for (const definition of limitedDefinitions) {
        scenarios.push(await this._generateScenario(baseSchedule, definition, options));
      }
    }
    
    // Store scenarios
    scenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
    
    logger.info(`Generated ${scenarios.length} scenarios`);
    return scenarios;
  }
  
  /**
   * Generate a single scenario
   * @param {Object} baseSchedule - Base schedule to generate scenario from
   * @param {Object} definition - Scenario definition
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated scenario
   * @private
   */
  async _generateScenario(baseSchedule, definition, options = {}) {
    const scenarioId = definition.id || uuidv4();
    
    logger.debug(`Generating scenario ${scenarioId}: ${definition.name}`);
    
    try {
      // Create a copy of the base schedule
      const scenarioSchedule = this._cloneSchedule(baseSchedule);
      
      // Set scenario metadata
      scenarioSchedule.id = scenarioId;
      scenarioSchedule.metadata = {
        ...scenarioSchedule.metadata,
        scenario: {
          name: definition.name || `Scenario ${scenarioId.substring(0, 8)}`,
          description: definition.description || '',
          createdAt: new Date().toISOString(),
          baseScheduleId: baseSchedule.id
        }
      };
      
      // Apply constraint modifications
      const constraints = this._applyConstraintModifications(
        scenarioSchedule.constraints || [],
        definition.constraintModifications || []
      );
      
      // Optimize the scenario
      const optimizedSchedule = await this.optimizer.optimize(
        scenarioSchedule,
        constraints,
        {
          ...options,
          ...definition.optimizationOptions
        }
      );
      
      // Calculate scenario metrics
      const metrics = await this._calculateMetrics(optimizedSchedule, constraints);
      
      // Add metrics to scenario
      optimizedSchedule.metadata.metrics = metrics;
      
      logger.debug(`Generated scenario ${scenarioId} successfully`);
      return optimizedSchedule;
    } catch (error) {
      logger.error(`Failed to generate scenario ${scenarioId}: ${error.message}`);
      
      // Return a minimal error scenario
      return {
        id: scenarioId,
        error: error.message,
        metadata: {
          scenario: {
            name: definition.name || `Scenario ${scenarioId.substring(0, 8)}`,
            description: definition.description || '',
            createdAt: new Date().toISOString(),
            baseScheduleId: baseSchedule.id,
            status: 'error'
          }
        }
      };
    }
  }
  
  /**
   * Compare multiple scenarios
   * @param {Array} scenarioIds - IDs of scenarios to compare
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>} Comparison results
   */
  async compareScenarios(scenarioIds, options = {}) {
    logger.info('Comparing scenarios', { scenarioIds, options });
    
    // Get scenarios
    const scenarios = scenarioIds
      .map(id => this.scenarios.get(id))
      .filter(scenario => scenario && !scenario.error);
    
    if (scenarios.length < 2) {
      logger.warn('Not enough valid scenarios to compare');
      return {
        success: false,
        error: 'Not enough valid scenarios to compare'
      };
    }
    
    // Calculate comparison metrics
    const comparison = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      scenarioIds: scenarioIds,
      scenarios: scenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.metadata?.scenario?.name || scenario.id,
        description: scenario.metadata?.scenario?.description || '',
        metrics: scenario.metadata?.metrics || {}
      })),
      metrics: {},
      recommendations: []
    };
    
    // Calculate overall metrics
    comparison.metrics = this._calculateComparisonMetrics(scenarios);
    
    // Generate recommendations
    comparison.recommendations = this._generateRecommendations(scenarios, comparison.metrics);
    
    logger.info(`Completed comparison of ${scenarios.length} scenarios`);
    return {
      success: true,
      comparison
    };
  }
  
  /**
   * Get a scenario by ID
   * @param {string} scenarioId - ID of the scenario
   * @returns {Object} Scenario
   */
  getScenario(scenarioId) {
    return this.scenarios.get(scenarioId);
  }
  
  /**
   * Get all scenarios
   * @returns {Array} All scenarios
   */
  getAllScenarios() {
    return Array.from(this.scenarios.values());
  }
  
  /**
   * Delete a scenario
   * @param {string} scenarioId - ID of the scenario to delete
   * @returns {boolean} Whether deletion was successful
   */
  deleteScenario(scenarioId) {
    return this.scenarios.delete(scenarioId);
  }
  
  /**
   * Clear all scenarios
   */
  clearScenarios() {
    this.scenarios.clear();
    logger.info('Cleared all scenarios');
  }
  
  /**
   * Clone a schedule
   * @param {Object} schedule - Schedule to clone
   * @returns {Object} Cloned schedule
   * @private
   */
  _cloneSchedule(schedule) {
    return {
      id: schedule.id,
      sportType: schedule.sportType,
      conferenceId: schedule.conferenceId,
      seasonYear: schedule.seasonYear,
      teams: [...schedule.teams],
      games: schedule.games.map(game => ({
        id: game.id,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        venueId: game.venueId,
        date: new Date(game.date),
        metadata: { ...game.metadata }
      })),
      constraints: [...(schedule.constraints || [])],
      metadata: { ...(schedule.metadata || {}) }
    };
  }
  
  /**
   * Apply constraint modifications
   * @param {Array} baseConstraints - Base constraints
   * @param {Array} modifications - Constraint modifications
   * @returns {Array} Modified constraints
   * @private
   */
  _applyConstraintModifications(baseConstraints, modifications) {
    // Create a copy of the base constraints
    const constraints = [...baseConstraints];
    
    // Apply each modification
    modifications.forEach(mod => {
      if (mod.action === 'add') {
        // Add a new constraint
        constraints.push({
          type: mod.type,
          weight: mod.weight,
          parameters: mod.parameters || {}
        });
      } else if (mod.action === 'remove') {
        // Remove a constraint
        const index = constraints.findIndex(c => c.type === mod.type);
        if (index >= 0) {
          constraints.splice(index, 1);
        }
      } else if (mod.action === 'modify') {
        // Modify an existing constraint
        const constraint = constraints.find(c => c.type === mod.type);
        if (constraint) {
          constraint.weight = mod.weight !== undefined ? mod.weight : constraint.weight;
          constraint.parameters = {
            ...constraint.parameters,
            ...(mod.parameters || {})
          };
        }
      }
    });
    
    return constraints;
  }
  
  /**
   * Calculate metrics for a schedule
   * @param {Object} schedule - Schedule to calculate metrics for
   * @param {Array} constraints - Constraints used
   * @returns {Promise<Object>} Calculated metrics
   * @private
   */
  async _calculateMetrics(schedule, constraints) {
    // Basic metrics
    const metrics = {
      gameCount: schedule.games.length,
      teamCount: schedule.teams.length,
      constraintCount: constraints.length,
      
      // Travel metrics
      travel: {
        totalDistance: 0,
        averageDistance: 0,
        maxTeamDistance: 0,
        minTeamDistance: 0
      },
      
      // Balance metrics
      balance: {
        homeAwayImbalance: 0,
        weekdayWeekendRatio: 0,
        consecutiveGamesMax: 0
      },
      
      // Optimization metrics
      optimization: schedule.metadata?.optimization || {}
    };
    
    // Calculate weekend ratio
    let weekendGames = 0;
    schedule.games.forEach(game => {
      const date = new Date(game.date);
      const day = date.getDay();
      
      // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) {
        weekendGames++;
      }
    });
    
    metrics.balance.weekdayWeekendRatio = schedule.games.length > 0 
      ? weekendGames / schedule.games.length 
      : 0;
    
    // Calculate home/away balance
    const teamGames = {};
    
    schedule.teams.forEach(team => {
      teamGames[team.id] = { home: 0, away: 0 };
    });
    
    schedule.games.forEach(game => {
      if (teamGames[game.homeTeamId]) {
        teamGames[game.homeTeamId].home++;
      }
      
      if (teamGames[game.awayTeamId]) {
        teamGames[game.awayTeamId].away++;
      }
    });
    
    // Calculate average imbalance
    let totalImbalance = 0;
    let teamCount = 0;
    
    Object.values(teamGames).forEach(games => {
      const total = games.home + games.away;
      if (total > 0) {
        const expected = total / 2;
        const imbalance = Math.abs(games.home - expected) / total;
        totalImbalance += imbalance;
        teamCount++;
      }
    });
    
    metrics.balance.homeAwayImbalance = teamCount > 0 ? totalImbalance / teamCount : 0;
    
    // If we have the Intelligence Engine, use it to calculate more detailed metrics
    if (this.intelligenceEngine && this.intelligenceEngine.enabled) {
      try {
        const advancedMetrics = await this.intelligenceEngine.calculateScheduleMetrics(schedule);
        
        if (advancedMetrics.success) {
          // Merge advanced metrics
          metrics.travel = {
            ...metrics.travel,
            ...advancedMetrics.travel
          };
          
          metrics.balance = {
            ...metrics.balance,
            ...advancedMetrics.balance
          };
          
          // Add any additional metrics
          metrics.advanced = advancedMetrics.advanced || {};
        }
      } catch (error) {
        logger.warn(`Failed to get advanced metrics from Intelligence Engine: ${error.message}`);
        // Continue with basic metrics
      }
    }
    
    return metrics;
  }
  
  /**
   * Calculate comparison metrics
   * @param {Array} scenarios - Scenarios to compare
   * @returns {Object} Comparison metrics
   * @private
   */
  _calculateComparisonMetrics(scenarios) {
    const comparisonMetrics = {
      travel: {
        bestScenarioId: null,
        worstScenarioId: null,
        percentageDifference: 0
      },
      balance: {
        bestScenarioId: null,
        worstScenarioId: null,
        percentageDifference: 0
      },
      overall: {
        bestScenarioId: null,
        worstScenarioId: null,
        rankings: []
      }
    };
    
    // Find best and worst for travel
    let bestTravel = Infinity;
    let worstTravel = -Infinity;
    
    scenarios.forEach(scenario => {
      const travelMetric = scenario.metadata?.metrics?.travel?.totalDistance || 0;
      
      if (travelMetric > 0 && travelMetric < bestTravel) {
        bestTravel = travelMetric;
        comparisonMetrics.travel.bestScenarioId = scenario.id;
      }
      
      if (travelMetric > worstTravel) {
        worstTravel = travelMetric;
        comparisonMetrics.travel.worstScenarioId = scenario.id;
      }
    });
    
    comparisonMetrics.travel.percentageDifference = 
      bestTravel > 0 ? ((worstTravel - bestTravel) / bestTravel) * 100 : 0;
    
    // Find best and worst for balance
    let bestBalance = Infinity;
    let worstBalance = -Infinity;
    
    scenarios.forEach(scenario => {
      const balanceMetric = scenario.metadata?.metrics?.balance?.homeAwayImbalance || 0;
      
      if (balanceMetric < bestBalance) {
        bestBalance = balanceMetric;
        comparisonMetrics.balance.bestScenarioId = scenario.id;
      }
      
      if (balanceMetric > worstBalance) {
        worstBalance = balanceMetric;
        comparisonMetrics.balance.worstScenarioId = scenario.id;
      }
    });
    
    comparisonMetrics.balance.percentageDifference = 
      bestBalance > 0 ? ((worstBalance - bestBalance) / bestBalance) * 100 : 0;
    
    // Calculate overall rankings
    const rankings = scenarios.map(scenario => {
      // Calculate a simple overall score based on optimization score
      const score = scenario.metadata?.optimization?.score || 0.5;
      
      return {
        scenarioId: scenario.id,
        score,
        name: scenario.metadata?.scenario?.name || scenario.id
      };
    });
    
    // Sort rankings by score (descending)
    rankings.sort((a, b) => b.score - a.score);
    
    comparisonMetrics.overall.rankings = rankings;
    
    if (rankings.length > 0) {
      comparisonMetrics.overall.bestScenarioId = rankings[0].scenarioId;
      comparisonMetrics.overall.worstScenarioId = rankings[rankings.length - 1].scenarioId;
    }
    
    return comparisonMetrics;
  }
  
  /**
   * Generate recommendations based on scenario comparison
   * @param {Array} scenarios - Scenarios being compared
   * @param {Object} metrics - Comparison metrics
   * @returns {Array} Recommendations
   * @private
   */
  _generateRecommendations(scenarios, metrics) {
    const recommendations = [];
    
    // Recommend the best overall scenario
    if (metrics.overall.bestScenarioId) {
      const bestScenario = scenarios.find(s => s.id === metrics.overall.bestScenarioId);
      
      if (bestScenario) {
        recommendations.push({
          type: 'best_overall',
          scenarioId: bestScenario.id,
          scenarioName: bestScenario.metadata?.scenario?.name || bestScenario.id,
          reason: 'Highest overall optimization score',
          confidence: 0.8
        });
      }
    }
    
    // Recommend the best travel scenario if significantly better
    if (metrics.travel.bestScenarioId && 
        metrics.travel.percentageDifference > 10 &&
        metrics.travel.bestScenarioId !== metrics.overall.bestScenarioId) {
      
      const bestTravelScenario = scenarios.find(s => s.id === metrics.travel.bestScenarioId);
      
      if (bestTravelScenario) {
        recommendations.push({
          type: 'best_travel',
          scenarioId: bestTravelScenario.id,
          scenarioName: bestTravelScenario.metadata?.scenario?.name || bestTravelScenario.id,
          reason: `Lowest travel distance (${metrics.travel.percentageDifference.toFixed(1)}% better than worst)`,
          confidence: 0.7
        });
      }
    }
    
    // Recommend the best balance scenario if significantly better
    if (metrics.balance.bestScenarioId && 
        metrics.balance.percentageDifference > 10 &&
        metrics.balance.bestScenarioId !== metrics.overall.bestScenarioId) {
      
      const bestBalanceScenario = scenarios.find(s => s.id === metrics.balance.bestScenarioId);
      
      if (bestBalanceScenario) {
        recommendations.push({
          type: 'best_balance',
          scenarioId: bestBalanceScenario.id,
          scenarioName: bestBalanceScenario.metadata?.scenario?.name || bestBalanceScenario.id,
          reason: 'Best home/away balance for teams',
          confidence: 0.7
        });
      }
    }
    
    // Add a compromise recommendation if we have multiple strong options
    if (recommendations.length > 1) {
      // Find a scenario that's not the best but scores well in multiple areas
      const rankings = metrics.overall.rankings;
      
      if (rankings.length > 2) {
        const compromiseScenario = scenarios.find(s => s.id === rankings[1].scenarioId);
        
        if (compromiseScenario) {
          recommendations.push({
            type: 'compromise',
            scenarioId: compromiseScenario.id,
            scenarioName: compromiseScenario.metadata?.scenario?.name || compromiseScenario.id,
            reason: 'Good balance of all factors',
            confidence: 0.6
          });
        }
      }
    }
    
    return recommendations;
  }
}

module.exports = ScenarioManager;
