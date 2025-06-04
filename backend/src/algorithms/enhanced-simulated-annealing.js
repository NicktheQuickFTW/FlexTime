/**
 * FlexTime Scheduling System - Enhanced Simulated Annealing Optimizer
 * 
 * Advanced optimizer using simulated annealing with adaptive cooling and parallel processing.
 * Inspired by the EnhancedSimulatedAnnealingOptimizer from FlexTime v2.1.
 */

const Schedule = require('../../../models/schedule');
const TravelDistanceCalculator = require('./travel-distance-calculator');
const { ConstraintType } = require('../../../models/constraint');

/**
 * Enhanced simulated annealing optimizer with adaptive cooling and parallel processing
 */
class EnhancedSimulatedAnnealingOptimizer {
  /**
   * Create a new EnhancedSimulatedAnnealingOptimizer
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Optimization options
   */
  constructor(schedule, options = {}) {
    this.schedule = schedule;
    
    // Default options
    this.options = {
      maxIterations: 10000,
      initialTemperature: 100.0,
      coolingRate: 0.95,
      numParallelChains: 4,
      useMultiprocessing: false, // JavaScript doesn't have true multiprocessing like Python
      ...options
    };
    
    // Set default constraint weights if not provided
    this.constraintWeights = options.constraintWeights || {
      [ConstraintType.TEAM_REST]: 10.0,
      [ConstraintType.VENUE_AVAILABILITY]: 8.0,
      [ConstraintType.TRAVEL_DISTANCE]: 5.0,
      [ConstraintType.HOME_AWAY_BALANCE]: 3.0,
      [ConstraintType.CONSECUTIVE_HOME_GAMES]: 2.0,
      [ConstraintType.CONSECUTIVE_AWAY_GAMES]: 2.0,
      [ConstraintType.TV_BROADCAST]: 1.5,
      [ConstraintType.RIVALRY_GAME]: 1.0
    };
    
    // Initialize distance calculator if we have teams
    if (schedule.teams && schedule.teams.length > 0) {
      this.distanceCalculator = new TravelDistanceCalculator(schedule.teams);
    }
    
    // Performance tracking
    this.startTime = null;
    this.endTime = null;
    this.iterationsPerformed = 0;
    this.temperatureStages = 0;
    this.improvements = 0;
    
    // Best solution tracking
    this.bestSchedule = null;
    this.bestScore = Infinity;
  }
  
  /**
   * Optimize the schedule using enhanced simulated annealing
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    this.startTime = Date.now();
    
    // Run parallel temperature chains
    const results = [];
    
    for (let i = 0; i < this.options.numParallelChains; i++) {
      // Vary initial temperature slightly for each chain
      const initialTemperature = this.options.initialTemperature * (0.9 + 0.2 * Math.random());
      
      // Run temperature chain
      const result = this._runTemperatureChain(
        initialTemperature,
        Math.floor(this.options.maxIterations / this.options.numParallelChains),
        this.options.coolingRate
      );
      
      results.push(result);
    }
    
    // Find best result from all chains
    let bestChainResult = results[0];
    
    for (let i = 1; i < results.length; i++) {
      if (results[i].score < bestChainResult.score) {
        bestChainResult = results[i];
      }
    }
    
    // Apply final refinements
    const finalSchedule = this._applyFinalRefinements(bestChainResult.schedule);
    
    // Record end time
    this.endTime = Date.now();
    
    // Add optimization metadata
    finalSchedule.metadata = {
      ...finalSchedule.metadata,
      optimization: {
        algorithm: 'EnhancedSimulatedAnnealing',
        iterations: this.iterationsPerformed,
        temperatureStages: this.temperatureStages,
        improvements: this.improvements,
        elapsedTime: (this.endTime - this.startTime) / 1000,
        score: bestChainResult.score
      }
    };
    
    return finalSchedule;
  }
  
  /**
   * Run a single temperature chain of simulated annealing
   * @param {number} initialTemperature - Initial temperature for this chain
   * @param {number} maxIterations - Maximum iterations for this chain
   * @param {number} coolingRate - Cooling rate for this chain
   * @returns {Object} Object with best schedule and score
   * @private
   */
  _runTemperatureChain(initialTemperature, maxIterations, coolingRate) {
    // Clone the schedule to work with
    let currentSchedule = this._cloneSchedule(this.schedule);
    let currentScore = this._calculateScore(currentSchedule);
    
    let bestSchedule = currentSchedule;
    let bestScore = currentScore;
    
    let temperature = initialTemperature;
    let iteration = 0;
    
    // Main simulated annealing loop
    while (temperature > 0.1 && iteration < maxIterations) {
      // Generate a neighboring schedule
      const neighborSchedule = this._generateNeighbor(currentSchedule);
      const neighborScore = this._calculateScore(neighborSchedule);
      
      // Decide whether to accept the neighbor
      if (this._acceptNeighbor(currentScore, neighborScore, temperature)) {
        currentSchedule = neighborSchedule;
        currentScore = neighborScore;
        
        // Update best schedule if this is better
        if (currentScore < bestScore) {
          bestSchedule = this._cloneSchedule(currentSchedule);
          bestScore = currentScore;
          this.improvements++;
        }
      }
      
      // Cool down
      if (iteration % 100 === 0) {
        temperature *= coolingRate;
        this.temperatureStages++;
      }
      
      iteration++;
      this.iterationsPerformed++;
    }
    
    return {
      schedule: bestSchedule,
      score: bestScore
    };
  }
  
  /**
   * Generate a neighboring schedule by making a small change
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} New schedule with a small change
   * @private
   */
  _generateNeighbor(schedule) {
    // Clone the schedule
    const neighbor = this._cloneSchedule(schedule);
    
    // Choose a random modification strategy
    const strategy = Math.floor(Math.random() * 4);
    
    switch (strategy) {
      case 0:
        this._swapGameDates(neighbor);
        break;
      case 1:
        this._swapHomeAway(neighbor);
        break;
      case 2:
        this._moveGameToNewDate(neighbor);
        break;
      case 3:
        this._swapGameVenues(neighbor);
        break;
    }
    
    return neighbor;
  }
  
  /**
   * Swap the dates of two randomly selected games
   * @param {Schedule} schedule - Schedule to modify
   * @private
   */
  _swapGameDates(schedule) {
    if (schedule.games.length < 2) return;
    
    const index1 = Math.floor(Math.random() * schedule.games.length);
    let index2 = Math.floor(Math.random() * schedule.games.length);
    
    // Ensure we select different games
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * schedule.games.length);
    }
    
    // Swap dates
    const tempDate = new Date(schedule.games[index1].date);
    schedule.games[index1].date = new Date(schedule.games[index2].date);
    schedule.games[index2].date = tempDate;
  }
  
  /**
   * Swap home and away teams for a randomly selected game
   * @param {Schedule} schedule - Schedule to modify
   * @private
   */
  _swapHomeAway(schedule) {
    if (schedule.games.length === 0) return;
    
    const index = Math.floor(Math.random() * schedule.games.length);
    const game = schedule.games[index];
    
    // Swap home and away teams
    const tempTeam = game.homeTeam;
    game.homeTeam = game.awayTeam;
    game.awayTeam = tempTeam;
    
    // Update venue to match new home team
    if (game.homeTeam && game.homeTeam.primaryVenue) {
      game.venue = game.homeTeam.primaryVenue;
    }
  }
  
  /**
   * Move a randomly selected game to a new date
   * @param {Schedule} schedule - Schedule to modify
   * @private
   */
  _moveGameToNewDate(schedule) {
    if (schedule.games.length === 0) return;
    
    const index = Math.floor(Math.random() * schedule.games.length);
    const game = schedule.games[index];
    
    // Get the date range from the schedule
    const dates = schedule.games.map(g => new Date(g.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Generate a new random date within the range
    const range = maxDate.getTime() - minDate.getTime();
    const newDate = new Date(minDate.getTime() + Math.random() * range);
    
    // Update the game date
    game.date = newDate;
  }
  
  /**
   * Swap the venues of two randomly selected games
   * @param {Schedule} schedule - Schedule to modify
   * @private
   */
  _swapGameVenues(schedule) {
    if (schedule.games.length < 2) return;
    
    const index1 = Math.floor(Math.random() * schedule.games.length);
    let index2 = Math.floor(Math.random() * schedule.games.length);
    
    // Ensure we select different games
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * schedule.games.length);
    }
    
    // Swap venues
    const tempVenue = schedule.games[index1].venue;
    schedule.games[index1].venue = schedule.games[index2].venue;
    schedule.games[index2].venue = tempVenue;
  }
  
  /**
   * Calculate a score for the schedule (lower is better)
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Score value where lower is better
   * @private
   */
  _calculateScore(schedule) {
    let totalScore = 0;
    
    // Travel distance component
    if (this.distanceCalculator) {
      totalScore += this._calculateTravelScore(schedule) * 
                   this.constraintWeights[ConstraintType.TRAVEL_DISTANCE];
    }
    
    // Home/away balance component
    totalScore += this._calculateHomeAwayBalanceScore(schedule) * 
                 this.constraintWeights[ConstraintType.HOME_AWAY_BALANCE];
    
    // Team rest component
    totalScore += this._calculateTeamRestScore(schedule) * 
                 this.constraintWeights[ConstraintType.TEAM_REST];
    
    // Consecutive games component
    totalScore += this._calculateConsecutiveGamesScore(schedule) * 
                 (this.constraintWeights[ConstraintType.CONSECUTIVE_HOME_GAMES] + 
                  this.constraintWeights[ConstraintType.CONSECUTIVE_AWAY_GAMES]) / 2;
    
    return totalScore;
  }
  
  /**
   * Calculate travel distance score
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Score component
   * @private
   */
  _calculateTravelScore(schedule) {
    let totalDistance = 0;
    
    // Calculate total travel distance for each team
    for (const team of schedule.teams) {
      let currentLocation = team.location;
      let teamDistance = 0;
      
      // Get games for this team sorted by date
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      for (const game of teamGames) {
        const gameLocation = game.venue.location;
        
        // Add distance to game venue
        if (currentLocation && gameLocation) {
          teamDistance += this.distanceCalculator.getDistance(currentLocation, gameLocation);
        }
        
        // Update current location
        currentLocation = gameLocation;
      }
      
      // Add distance back home
      if (currentLocation && team.location) {
        teamDistance += this.distanceCalculator.getDistance(currentLocation, team.location);
      }
      
      totalDistance += teamDistance;
    }
    
    // Normalize by number of teams
    return totalDistance / (schedule.teams.length || 1);
  }
  
  /**
   * Calculate home/away balance score
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Score component
   * @private
   */
  _calculateHomeAwayBalanceScore(schedule) {
    let totalImbalance = 0;
    
    // Calculate home/away imbalance for each team
    for (const team of schedule.teams) {
      let homeGames = 0;
      let awayGames = 0;
      
      for (const game of schedule.games) {
        if (game.homeTeam.id === team.id) {
          homeGames++;
        } else if (game.awayTeam.id === team.id) {
          awayGames++;
        }
      }
      
      const totalGames = homeGames + awayGames;
      if (totalGames > 0) {
        // Calculate imbalance as deviation from 50/50 split
        const expectedHome = totalGames / 2;
        const imbalance = Math.abs(homeGames - expectedHome) / totalGames;
        totalImbalance += imbalance;
      }
    }
    
    // Normalize by number of teams
    return totalImbalance / (schedule.teams.length || 1) * 100;
  }
  
  /**
   * Calculate team rest score
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Score component
   * @private
   */
  _calculateTeamRestScore(schedule) {
    let totalRestViolations = 0;
    
    // Calculate rest violations for each team
    for (const team of schedule.teams) {
      // Get games for this team sorted by date
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check rest days between consecutive games
      for (let i = 1; i < teamGames.length; i++) {
        const prevGame = teamGames[i - 1];
        const currGame = teamGames[i];
        
        const restDays = (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24);
        
        // Penalize insufficient rest (less than 1 day)
        if (restDays < 1) {
          totalRestViolations += (1 - restDays) * 10; // Higher penalty for negative rest
        }
      }
    }
    
    return totalRestViolations;
  }
  
  /**
   * Calculate consecutive games score
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Score component
   * @private
   */
  _calculateConsecutiveGamesScore(schedule) {
    let totalViolations = 0;
    
    // Calculate consecutive game violations for each team
    for (const team of schedule.teams) {
      // Get games for this team sorted by date
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let consecutiveHome = 0;
      let consecutiveAway = 0;
      
      for (const game of teamGames) {
        if (game.homeTeam.id === team.id) {
          // Home game
          consecutiveHome++;
          consecutiveAway = 0;
          
          // Penalize excessive consecutive home games
          if (consecutiveHome > 3) {
            totalViolations += consecutiveHome - 3;
          }
        } else {
          // Away game
          consecutiveAway++;
          consecutiveHome = 0;
          
          // Penalize excessive consecutive away games
          if (consecutiveAway > 3) {
            totalViolations += consecutiveAway - 3;
          }
        }
      }
    }
    
    return totalViolations;
  }
  
  /**
   * Decide whether to accept a neighboring solution
   * @param {number} currentScore - Score of the current solution
   * @param {number} neighborScore - Score of the neighboring solution
   * @param {number} temperature - Current temperature
   * @returns {boolean} True if the neighbor should be accepted
   * @private
   */
  _acceptNeighbor(currentScore, neighborScore, temperature) {
    // Always accept if better (lower score is better)
    if (neighborScore < currentScore) {
      return true;
    }
    
    // Sometimes accept if worse, based on temperature
    const delta = neighborScore - currentScore;
    const acceptanceProbability = Math.exp(-delta / temperature);
    
    return Math.random() < acceptanceProbability;
  }
  
  /**
   * Apply final refinements to the best solution found
   * @param {Schedule} schedule - Best schedule found by simulated annealing
   * @returns {Schedule} Refined schedule
   * @private
   */
  _applyFinalRefinements(schedule) {
    // Clone the schedule
    const refinedSchedule = this._cloneSchedule(schedule);
    
    // Apply specific refinements
    this._balanceHomeAwayGames(refinedSchedule);
    this._fixConstraintViolations(refinedSchedule);
    
    return refinedSchedule;
  }
  
  /**
   * Balance home and away games for each team
   * @param {Schedule} schedule - Schedule to balance
   * @private
   */
  _balanceHomeAwayGames(schedule) {
    // Calculate home/away counts for each team
    const teamCounts = {};
    
    for (const team of schedule.teams) {
      teamCounts[team.id] = { home: 0, away: 0 };
    }
    
    for (const game of schedule.games) {
      teamCounts[game.homeTeam.id].home++;
      teamCounts[game.awayTeam.id].away++;
    }
    
    // Identify teams with imbalances
    const imbalancedTeams = [];
    
    for (const teamId in teamCounts) {
      const counts = teamCounts[teamId];
      const total = counts.home + counts.away;
      const expected = Math.floor(total / 2);
      
      if (Math.abs(counts.home - expected) >= 2) {
        imbalancedTeams.push({
          id: teamId,
          imbalance: counts.home - expected
        });
      }
    }
    
    // Sort by imbalance (most negative to most positive)
    imbalancedTeams.sort((a, b) => a.imbalance - b.imbalance);
    
    // Try to fix imbalances by swapping home/away for some games
    for (let i = 0; i < imbalancedTeams.length / 2; i++) {
      const needsHomeTeam = imbalancedTeams[i]; // Negative imbalance (needs more home games)
      const needsAwayTeam = imbalancedTeams[imbalancedTeams.length - 1 - i]; // Positive imbalance (needs more away games)
      
      if (needsHomeTeam.imbalance >= 0 || needsAwayTeam.imbalance <= 0) {
        continue; // Skip if imbalances don't match
      }
      
      // Find games between these teams
      const games = schedule.games.filter(game => 
        (game.homeTeam.id === needsAwayTeam.id && game.awayTeam.id === needsHomeTeam.id)
      );
      
      // Swap home/away for one game
      if (games.length > 0) {
        const game = games[0];
        const tempTeam = game.homeTeam;
        game.homeTeam = game.awayTeam;
        game.awayTeam = tempTeam;
        
        // Update venue
        if (game.homeTeam.primaryVenue) {
          game.venue = game.homeTeam.primaryVenue;
        }
      }
    }
  }
  
  /**
   * Fix any remaining constraint violations
   * @param {Schedule} schedule - Schedule to fix
   * @private
   */
  _fixConstraintViolations(schedule) {
    // Fix team rest violations
    const restViolations = this._findTeamRestViolations(schedule);
    if (restViolations.length > 0) {
      this._fixTeamRestViolations(schedule, restViolations);
    }
  }
  
  /**
   * Find team rest violations
   * @param {Schedule} schedule - Schedule to check
   * @returns {Array} List of violations
   * @private
   */
  _findTeamRestViolations(schedule) {
    const violations = [];
    
    // Check each team
    for (const team of schedule.teams) {
      // Get games for this team sorted by date
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check rest days between consecutive games
      for (let i = 1; i < teamGames.length; i++) {
        const prevGame = teamGames[i - 1];
        const currGame = teamGames[i];
        
        const restDays = (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (restDays < 1) {
          violations.push({
            teamId: team.id,
            prevGameId: prevGame.id,
            currGameId: currGame.id,
            restDays: restDays
          });
        }
      }
    }
    
    return violations;
  }
  
  /**
   * Fix team rest violations by moving games
   * @param {Schedule} schedule - Schedule to fix
   * @param {Array} violations - List of violations
   * @private
   */
  _fixTeamRestViolations(schedule, violations) {
    for (const violation of violations) {
      // Find the games
      const prevGame = schedule.games.find(game => game.id === violation.prevGameId);
      const currGame = schedule.games.find(game => game.id === violation.currGameId);
      
      if (!prevGame || !currGame) continue;
      
      // Move the current game forward by 1-2 days
      const newDate = new Date(prevGame.date);
      newDate.setDate(newDate.getDate() + 1 + Math.floor(Math.random() * 2));
      currGame.date = newDate;
    }
  }
  
  /**
   * Clone a schedule
   * @param {Schedule} schedule - Schedule to clone
   * @returns {Schedule} Cloned schedule
   * @private
   */
  _cloneSchedule(schedule) {
    const clone = new Schedule(
      schedule.id,
      schedule.sport,
      schedule.season,
      schedule.teams,
      [],
      schedule.constraints
    );
    
    // Clone games
    for (const game of schedule.games) {
      const clonedGame = {
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        venue: game.venue,
        date: new Date(game.date),
        sport: game.sport,
        metadata: { ...(game.metadata || {}) }
      };
      
      clone.addGame(clonedGame);
    }
    
    // Clone metadata
    clone.metadata = { ...(schedule.metadata || {}) };
    
    return clone;
  }
}

module.exports = EnhancedSimulatedAnnealingOptimizer;
