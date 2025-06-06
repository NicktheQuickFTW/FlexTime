/**
 * Incremental Schedule Optimizer for FlexTime
 * 
 * This module implements a multi-phase incremental optimization approach
 * that progressively improves schedules through specialized optimization stages.
 */

const Schedule = require('../../../models/schedule');
const Game = require('../../../models/game');
const logger = require("../../lib/logger");;

class IncrementalScheduleOptimizer {
  /**
   * Create a new IncrementalScheduleOptimizer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Configuration parameters
    this.phases = options.phases || [
      'divisionStructure',
      'homeAwayBalance',
      'dateOptimization',
      'roadTripOptimization',
      'constraintSatisfaction',
      'venueOptimization',
      'fineAdjustments'
    ];
    
    // Performance settings
    this.iterationsPerPhase = options.iterationsPerPhase || 1000;
    this.timeLimit = options.timeLimit || 60000; // 60 seconds default
    this.debugEnabled = options.debug || false;
    
    // Sport-specific optimizers (loaded on demand)
    this.sportOptimizers = {};
    
    // Specialized optimizers may be provided
    this.divisionOptimizer = options.divisionOptimizer;
    this.homeAwayBalancer = options.homeAwayBalancer;
    this.dateOptimizer = options.dateOptimizer;
    this.roadTripOptimizer = options.roadTripOptimizer;
    this.constraintSolver = options.constraintSolver;
    this.venueOptimizer = options.venueOptimizer;
    this.fineAdjuster = options.fineAdjuster;
    
    logger.info('Incremental Schedule Optimizer initialized');
  }
  
  /**
   * Optimize a schedule using incremental phases
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} constraints - Scheduling constraints
   * @param {Object} options - Additional options
   * @returns {Promise<Schedule>} Optimized schedule
   */
  async optimize(schedule, constraints = [], options = {}) {
    const startTime = Date.now();
    let currentSchedule = schedule.clone();
    
    // Determine which phases to run
    const phases = options.phases || this.phases;
    const phaseResults = {};
    
    // Prepare optimization context
    const context = {
      sport: schedule.sport,
      teams: schedule.teams,
      constraints,
      options,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      metrics: {}
    };
    
    // Get sport-specific optimizer if available
    const sportOptimizer = await this._getSportOptimizer(schedule.sport);
    
    // Log start of optimization
    logger.info(`Starting incremental optimization for ${schedule.sport} schedule with ${schedule.games.length} games`);
    if (this.debugEnabled) {
      logger.info(`Initial schedule metrics: ${JSON.stringify(this._calculateMetrics(currentSchedule))}`);
    }
    
    // Run each optimization phase
    for (const phase of phases) {
      // Check if we've exceeded the time limit
      if (Date.now() - startTime > this.timeLimit) {
        logger.warn(`Time limit exceeded after phase ${phase}, stopping optimization`);
        break;
      }
      
      // Get optimizer for this phase
      const phaseOptimizer = this._getPhaseOptimizer(phase, sportOptimizer);
      
      if (!phaseOptimizer) {
        logger.warn(`No optimizer available for phase ${phase}, skipping`);
        continue;
      }
      
      try {
        // Run the phase optimizer
        const phaseStartTime = Date.now();
        logger.info(`Running ${phase} optimization phase`);
        
        const result = await phaseOptimizer(currentSchedule, context);
        
        // Update schedule and track results
        if (result && result.schedule) {
          currentSchedule = result.schedule;
          
          // Calculate metrics after this phase
          const metrics = this._calculateMetrics(currentSchedule);
          
          phaseResults[phase] = {
            duration: Date.now() - phaseStartTime,
            metrics,
            changes: result.changes || 0,
            improvement: result.improvement || 0
          };
          
          if (this.debugEnabled) {
            logger.info(`After ${phase}: ${JSON.stringify(metrics)}`);
          }
        } else {
          logger.warn(`Phase ${phase} did not return a valid result`);
        }
      } catch (error) {
        logger.error(`Error in ${phase} phase: ${error.message}`);
        // Continue with next phase despite error
      }
    }
    
    // Log optimization completion
    const totalDuration = Date.now() - startTime;
    logger.info(`Completed incremental optimization in ${totalDuration}ms`);
    
    // Return optimized schedule with metadata
    currentSchedule.optimizationMetadata = {
      method: 'incremental',
      duration: totalDuration,
      phases: phaseResults,
      finalMetrics: this._calculateMetrics(currentSchedule)
    };
    
    return currentSchedule;
  }
  
  /**
   * Get optimizer for a specific phase
   * @param {string} phase - Optimization phase
   * @param {Object} sportOptimizer - Sport-specific optimizer
   * @returns {Function} Phase optimizer function
   * @private
   */
  _getPhaseOptimizer(phase, sportOptimizer) {
    // First check if sport optimizer has this phase
    if (sportOptimizer && typeof sportOptimizer[`optimize${this._capitalize(phase)}`] === 'function') {
      return sportOptimizer[`optimize${this._capitalize(phase)}`].bind(sportOptimizer);
    }
    
    // Then check for specific phase optimizer property
    const optimizerProp = `${phase}Optimizer`;
    if (this[optimizerProp]) {
      return this[optimizerProp].optimize.bind(this[optimizerProp]);
    }
    
    // Finally fall back to internal method
    const methodName = `_optimize${this._capitalize(phase)}`;
    if (typeof this[methodName] === 'function') {
      return this[methodName].bind(this);
    }
    
    return null;
  }
  
  /**
   * Get sport-specific optimizer
   * @param {string} sport - Sport type
   * @returns {Promise<Object>} Sport-specific optimizer
   * @private
   */
  async _getSportOptimizer(sport) {
    // Convert sport name to lowercase for consistency
    const sportLower = sport.toLowerCase();
    
    // Return from cache if already loaded
    if (this.sportOptimizers[sportLower]) {
      return this.sportOptimizers[sportLower];
    }
    
    try {
      // Try to dynamically load sport-specific optimizer
      let SportOptimizerClass;
      
      switch (sportLower) {
        case 'basketball':
          const BasketballScheduleOptimizer = require('../../agents/sport_specific/basketball_schedule_optimizer');
          SportOptimizerClass = BasketballScheduleOptimizer;
          break;
        case 'football':
          // Assume this would be implemented
          // const FootballScheduleOptimizer = require('../../agents/sport_specific/football_schedule_optimizer');
          // SportOptimizerClass = FootballScheduleOptimizer;
          return null;
        case 'baseball':
          // Assume this would be implemented
          // const BaseballScheduleOptimizer = require('../../agents/sport_specific/baseball_schedule_optimizer');
          // SportOptimizerClass = BaseballScheduleOptimizer;
          return null;
        default:
          return null;
      }
      
      // Create instance and cache it
      if (SportOptimizerClass) {
        const optimizer = new SportOptimizerClass();
        this.sportOptimizers[sportLower] = optimizer;
        return optimizer;
      }
    } catch (error) {
      logger.warn(`Failed to load ${sport} optimizer: ${error.message}`);
    }
    
    return null;
  }
  
  /**
   * Capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   * @private
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Calculate schedule metrics
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {Object} Schedule metrics
   * @private
   */
  _calculateMetrics(schedule) {
    // This would be a more comprehensive implementation
    // using the ScheduleMetrics class in a real system
    return {
      totalGames: schedule.games.length,
      totalTravelDistance: this._calculateTotalTravelDistance(schedule),
      homeAwayBalance: this._calculateHomeAwayBalance(schedule),
      backToBackGames: this._countBackToBackGames(schedule)
    };
  }
  
  /**
   * Calculate total travel distance for a schedule
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Total travel distance
   * @private
   */
  _calculateTotalTravelDistance(schedule) {
    // Simplified implementation
    let totalDistance = 0;
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        date: new Date(game.date),
        venue: game.venue,
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        date: new Date(game.date),
        venue: game.venue,
        isHome: false
      });
    }
    
    // Calculate travel distance for each team
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const team = schedule.teams.find(t => t.id === teamId);
      if (!team || !team.location) continue;
      
      let currentLocation = team.location;
      
      // Travel to each game
      for (const game of games) {
        if (!game.venue || !game.venue.location) continue;
        
        // Calculate distance
        const distance = currentLocation.distanceTo(game.venue.location);
        totalDistance += distance;
        
        // Update current location
        currentLocation = game.venue.location;
      }
      
      // Return home after last game
      if (games.length > 0 && games[games.length - 1].venue && 
          games[games.length - 1].venue.location) {
        totalDistance += games[games.length - 1].venue.location.distanceTo(team.location);
      }
    }
    
    return totalDistance;
  }
  
  /**
   * Calculate home/away balance for a schedule
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Home/away balance score (lower is better)
   * @private
   */
  _calculateHomeAwayBalance(schedule) {
    // Count home and away games for each team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = { home: 0, away: 0 };
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].home++;
      teamGames[game.awayTeam.id].away++;
    }
    
    // Calculate imbalance score
    let totalImbalance = 0;
    
    for (const [teamId, counts] of Object.entries(teamGames)) {
      const totalGames = counts.home + counts.away;
      if (totalGames === 0) continue;
      
      const homeRatio = counts.home / totalGames;
      const targetRatio = 0.5; // Ideal is 50% home, 50% away
      
      // Add squared deviation to total
      totalImbalance += Math.pow(homeRatio - targetRatio, 2);
    }
    
    // Normalize by number of teams
    return totalImbalance / schedule.teams.length;
  }
  
  /**
   * Count back-to-back games in a schedule
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Number of back-to-back games
   * @private
   */
  _countBackToBackGames(schedule) {
    let backToBackCount = 0;
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        date: new Date(game.date),
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        date: new Date(game.date),
        isHome: false
      });
    }
    
    // Count back-to-back games for each team
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Count consecutive days with games
      for (let i = 1; i < games.length; i++) {
        const prevDate = games[i - 1].date;
        const currDate = games[i].date;
        
        // Calculate days between games
        const daysBetween = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween <= 1) {
          backToBackCount++;
        }
      }
    }
    
    return backToBackCount;
  }
  
  // Phase-specific optimization methods
  
  /**
   * Optimize division structure
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeDivisionStructure(schedule, context) {
    logger.info('Optimizing division structure');
    
    // Create deep copy of the schedule
    const newSchedule = schedule.clone();
    let changes = 0;
    
    // Get division information from context
    const divisions = context.options.divisions || {};
    
    // Skip if no division information
    if (Object.keys(divisions).length === 0) {
      return { schedule: newSchedule, changes, improvement: 0 };
    }
    
    // Create division matchup matrix
    const divisionMatchups = {};
    const gamesPerDivisionPair = {};
    
    // Initialize division matchup counts
    for (const divName of Object.keys(divisions)) {
      divisionMatchups[divName] = {};
      
      for (const otherDivName of Object.keys(divisions)) {
        divisionMatchups[divName][otherDivName] = 0;
      }
    }
    
    // Count division matchups in current schedule
    for (const game of newSchedule.games) {
      const homeTeamDiv = this._getTeamDivision(game.homeTeam.id, divisions);
      const awayTeamDiv = this._getTeamDivision(game.awayTeam.id, divisions);
      
      if (homeTeamDiv && awayTeamDiv) {
        divisionMatchups[homeTeamDiv][awayTeamDiv]++;
        
        // Track unique division pair
        const divPair = [homeTeamDiv, awayTeamDiv].sort().join('-');
        gamesPerDivisionPair[divPair] = (gamesPerDivisionPair[divPair] || 0) + 1;
      }
    }
    
    // Determine target game counts between divisions
    const targetDivisionGames = context.options.divisionGames || {};
    const defaultIntraDivisionGames = context.options.defaultIntraDivisionGames || 4;
    const defaultInterDivisionGames = context.options.defaultInterDivisionGames || 2;
    
    // Loop through games and make adjustments
    for (let i = 0; i < this.iterationsPerPhase; i++) {
      // Find division pair with biggest deviation from target
      let maxDeviation = -1;
      let maxDeviationPair = null;
      
      for (const divPair of Object.keys(gamesPerDivisionPair)) {
        const [div1, div2] = divPair.split('-');
        const actual = gamesPerDivisionPair[divPair];
        
        // Determine target
        let target;
        if (div1 === div2) {
          // Intra-division
          target = targetDivisionGames[div1] || defaultIntraDivisionGames;
        } else {
          // Inter-division
          const pairKey = `${div1}-${div2}`;
          target = targetDivisionGames[pairKey] || defaultInterDivisionGames;
        }
        
        const deviation = Math.abs(actual - target);
        if (deviation > maxDeviation) {
          maxDeviation = deviation;
          maxDeviationPair = divPair;
        }
      }
      
      if (maxDeviation <= 0 || !maxDeviationPair) {
        // No more deviations to fix
        break;
      }
      
      // Try to fix the imbalance
      const [div1, div2] = maxDeviationPair.split('-');
      const actual = gamesPerDivisionPair[maxDeviationPair];
      let target;
      
      if (div1 === div2) {
        // Intra-division
        target = targetDivisionGames[div1] || defaultIntraDivisionGames;
      } else {
        // Inter-division
        const pairKey = `${div1}-${div2}`;
        target = targetDivisionGames[pairKey] || defaultInterDivisionGames;
      }
      
      // Determine if we need to add or remove games
      if (actual < target) {
        // Need to add games - find a game to convert
        const success = this._convertGameToDivision(newSchedule, div1, div2, divisions);
        if (success) changes++;
      } else {
        // Need to remove games - find a game to convert away
        const success = this._convertGameFromDivision(newSchedule, div1, div2, divisions);
        if (success) changes++;
      }
    }
    
    // Calculate improvement
    const originalMetrics = this._calculateMetrics(schedule);
    const newMetrics = this._calculateMetrics(newSchedule);
    
    const improvement = 
      (originalMetrics.totalTravelDistance - newMetrics.totalTravelDistance) / 
      originalMetrics.totalTravelDistance;
    
    return { schedule: newSchedule, changes, improvement };
  }
  
  /**
   * Get the division for a team
   * @param {string} teamId - Team ID
   * @param {Object} divisions - Division mapping
   * @returns {string|null} Division name
   * @private
   */
  _getTeamDivision(teamId, divisions) {
    for (const [division, teams] of Object.entries(divisions)) {
      if (teams.includes(teamId)) {
        return division;
      }
    }
    
    return null;
  }
  
  /**
   * Convert a game to be between specified divisions
   * @param {Schedule} schedule - Schedule to modify
   * @param {string} div1 - First division
   * @param {string} div2 - Second division
   * @param {Object} divisions - Division mapping
   * @returns {boolean} Success flag
   * @private
   */
  _convertGameToDivision(schedule, div1, div2, divisions) {
    // Implementation would swap teams in a game to match desired division matchup
    return false;
  }
  
  /**
   * Convert a game away from specified divisions
   * @param {Schedule} schedule - Schedule to modify
   * @param {string} div1 - First division
   * @param {string} div2 - Second division
   * @param {Object} divisions - Division mapping
   * @returns {boolean} Success flag
   * @private
   */
  _convertGameFromDivision(schedule, div1, div2, divisions) {
    // Implementation would swap teams in a game to avoid specified division matchup
    return false;
  }
  
  /**
   * Optimize home/away balance
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeHomeAwayBalance(schedule, context) {
    logger.info('Optimizing home/away balance');
    
    // Create deep copy of the schedule
    const newSchedule = schedule.clone();
    let changes = 0;
    
    // Count home and away games for each team
    const teamGames = {};
    
    for (const team of newSchedule.teams) {
      teamGames[team.id] = { home: 0, away: 0, total: 0 };
    }
    
    for (const game of newSchedule.games) {
      teamGames[game.homeTeam.id].home++;
      teamGames[game.homeTeam.id].total++;
      
      teamGames[game.awayTeam.id].away++;
      teamGames[game.awayTeam.id].total++;
    }
    
    // Identify teams with biggest imbalance
    const teamImbalances = [];
    
    for (const [teamId, counts] of Object.entries(teamGames)) {
      if (counts.total === 0) continue;
      
      const homeRatio = counts.home / counts.total;
      const targetRatio = 0.5; // Ideal is 50% home, 50% away
      
      teamImbalances.push({
        teamId,
        homeRatio,
        imbalance: homeRatio - targetRatio,
        counts
      });
    }
    
    // Sort by absolute imbalance (descending)
    teamImbalances.sort((a, b) => Math.abs(b.imbalance) - Math.abs(a.imbalance));
    
    // Try to fix imbalances
    for (let i = 0; i < this.iterationsPerPhase; i++) {
      // Skip if no significant imbalances
      if (teamImbalances.length === 0 || Math.abs(teamImbalances[0].imbalance) < 0.1) {
        break;
      }
      
      // Get most imbalanced team
      const team = teamImbalances[0];
      
      // Find a suitable opponent to swap home/away with
      const oppositeImbalance = team.imbalance < 0 ? 
        teamImbalances.find(t => t.imbalance > 0) : 
        teamImbalances.find(t => t.imbalance < 0);
      
      if (!oppositeImbalance) {
        // No suitable opponent found
        break;
      }
      
      // Find a game between these teams
      const gameIndex = newSchedule.games.findIndex(game => 
        (game.homeTeam.id === team.teamId && game.awayTeam.id === oppositeImbalance.teamId) || 
        (game.homeTeam.id === oppositeImbalance.teamId && game.awayTeam.id === team.teamId)
      );
      
      if (gameIndex === -1) {
        // No game between these teams, remove them from consideration
        teamImbalances.shift();
        teamImbalances.splice(teamImbalances.indexOf(oppositeImbalance), 1);
        continue;
      }
      
      // Swap home and away teams
      const game = newSchedule.games[gameIndex];
      const newGame = new Game(
        game.id,
        game.awayTeam,
        game.homeTeam,
        game.awayTeam.primaryVenue,
        game.date,
        game.sport,
        game.specialDesignation,
        game.tvNetwork
      );
      
      newSchedule.games[gameIndex] = newGame;
      changes++;
      
      // Update team balances
      const otherTeamIndex = teamImbalances.indexOf(oppositeImbalance);
      
      // Update first team's counts
      teamImbalances[0].counts.home = team.imbalance > 0 ? 
        teamImbalances[0].counts.home - 1 : teamImbalances[0].counts.home + 1;
        
      teamImbalances[0].counts.away = team.imbalance > 0 ? 
        teamImbalances[0].counts.away + 1 : teamImbalances[0].counts.away - 1;
        
      teamImbalances[0].homeRatio = teamImbalances[0].counts.home / teamImbalances[0].counts.total;
      teamImbalances[0].imbalance = teamImbalances[0].homeRatio - 0.5;
      
      // Update second team's counts
      teamImbalances[otherTeamIndex].counts.home = oppositeImbalance.imbalance > 0 ? 
        teamImbalances[otherTeamIndex].counts.home - 1 : teamImbalances[otherTeamIndex].counts.home + 1;
        
      teamImbalances[otherTeamIndex].counts.away = oppositeImbalance.imbalance > 0 ? 
        teamImbalances[otherTeamIndex].counts.away + 1 : teamImbalances[otherTeamIndex].counts.away - 1;
        
      teamImbalances[otherTeamIndex].homeRatio = 
        teamImbalances[otherTeamIndex].counts.home / teamImbalances[otherTeamIndex].counts.total;
        
      teamImbalances[otherTeamIndex].imbalance = 
        teamImbalances[otherTeamIndex].homeRatio - 0.5;
      
      // Resort array
      teamImbalances.sort((a, b) => Math.abs(b.imbalance) - Math.abs(a.imbalance));
    }
    
    // Calculate improvement
    const originalBalance = this._calculateHomeAwayBalance(schedule);
    const newBalance = this._calculateHomeAwayBalance(newSchedule);
    const improvement = (originalBalance - newBalance) / originalBalance;
    
    return { schedule: newSchedule, changes, improvement };
  }
  
  /**
   * Optimize dates
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeDateOptimization(schedule, context) {
    logger.info('Optimizing game dates');
    
    // Implementation would adjust game dates to improve rest days,
    // avoid back-to-back games, etc.
    
    // This is a placeholder implementation
    return { 
      schedule: schedule.clone(), 
      changes: 0, 
      improvement: 0
    };
  }
  
  /**
   * Optimize road trips
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeRoadTripOptimization(schedule, context) {
    logger.info('Optimizing road trips');
    
    // Implementation would identify and optimize road trips
    // to minimize travel distance
    
    // This is a placeholder implementation
    return { 
      schedule: schedule.clone(), 
      changes: 0, 
      improvement: 0
    };
  }
  
  /**
   * Satisfy remaining constraints
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeConstraintSatisfaction(schedule, context) {
    logger.info('Satisfying remaining constraints');
    
    // Implementation would focus on fixing constraint violations
    
    // This is a placeholder implementation
    return { 
      schedule: schedule.clone(), 
      changes: 0, 
      improvement: 0
    };
  }
  
  /**
   * Optimize venue selection
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeVenueOptimization(schedule, context) {
    logger.info('Optimizing venue selection');
    
    // Implementation would select appropriate venues for games
    // based on availability, capacity, etc.
    
    // This is a placeholder implementation
    return { 
      schedule: schedule.clone(), 
      changes: 0, 
      improvement: 0
    };
  }
  
  /**
   * Make final adjustments
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} context - Optimization context
   * @returns {Promise<Object>} Optimization result
   * @private
   */
  async _optimizeFineAdjustments(schedule, context) {
    logger.info('Making fine adjustments');
    
    // Implementation would make small tweaks to improve
    // schedule quality
    
    // This is a placeholder implementation
    return { 
      schedule: schedule.clone(), 
      changes: 0, 
      improvement: 0
    };
  }
}

module.exports = IncrementalScheduleOptimizer;