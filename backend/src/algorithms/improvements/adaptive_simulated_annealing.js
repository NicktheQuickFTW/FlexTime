/**
 * Adaptive Simulated Annealing Optimizer for FlexTime
 * 
 * This improved version of the Simulated Annealing algorithm includes:
 * - Adaptive cooling rate based on solution quality
 * - Early stopping mechanism to improve performance
 * - More sophisticated neighbor generation strategies
 */

const { ScheduleOptimizer } = require('../schedule-optimizer');
const Schedule = require('../../models/schedule');
const Game = require('../../models/game');

class AdaptiveSimulatedAnnealingOptimizer extends ScheduleOptimizer {
  /**
   * Create a new AdaptiveSimulatedAnnealingOptimizer
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Optimization options
   */
  constructor(schedule, options = {}) {
    super(schedule, options.maxIterations || 5000);
    
    // Configuration parameters
    this.initialTemperature = options.initialTemperature || 100.0;
    this.minTemperature = options.minTemperature || 0.01;
    this.coolingRate = options.coolingRate || 0.95;
    this.adaptiveCoolingFactor = options.adaptiveCoolingFactor || 0.98;
    
    // Early stopping parameters
    this.earlyStoppingThreshold = options.earlyStoppingThreshold || 
      Math.floor(this.maxIterations / 10);
    this.improvementThreshold = options.improvementThreshold || 0.001;
    
    // Strategy parameters
    this.strategies = options.strategies || [
      { name: 'swapHomeAway', weight: 0.3 },
      { name: 'swapGameDates', weight: 0.3 },
      { name: 'changeVenue', weight: 0.2 },
      { name: 'swapGamePairs', weight: 0.15 },
      { name: 'adjustGameTime', weight: 0.05 }
    ];
    
    // Normalize strategy weights
    const totalWeight = this.strategies.reduce((sum, s) => sum + s.weight, 0);
    this.strategies.forEach(s => s.weight = s.weight / totalWeight);
    
    // Track optimization statistics
    this.stats = {
      iterations: 0,
      acceptedMoves: 0,
      improvements: 0,
      strategyCounts: {},
      initialScore: 0,
      finalScore: 0,
      earlyStop: false
    };
    
    // Initialize strategy counts
    this.strategies.forEach(s => this.stats.strategyCounts[s.name] = 0);
  }

  /**
   * Optimize schedule using adaptive simulated annealing
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    console.log('Starting adaptive simulated annealing optimization...');
    
    // Create a deep copy of the schedule to work with
    let currentSchedule = this.schedule.clone();
    let bestSchedule = currentSchedule.clone();
    
    // Evaluate initial schedule
    let currentScore = this._evaluateSchedule(currentSchedule);
    let bestScore = currentScore;
    
    // Save initial score
    this.stats.initialScore = currentScore;
    
    // Initialize temperature and tracking variables
    let temperature = this.initialTemperature;
    let noImprovementCount = 0;
    let previousBestScore = bestScore;
    
    // Main simulated annealing loop
    for (let i = 0; i < this.maxIterations; i++) {
      this.stats.iterations++;
      
      // Select a strategy based on weights
      const strategy = this._selectStrategy();
      this.stats.strategyCounts[strategy]++;
      
      // Create a neighboring schedule using the selected strategy
      const neighborSchedule = this._createNeighbor(currentSchedule, strategy);
      
      // Evaluate the neighbor
      const neighborScore = this._evaluateSchedule(neighborSchedule);
      
      // Decide whether to accept the neighbor
      if (this._acceptNeighbor(currentScore, neighborScore, temperature)) {
        currentSchedule = neighborSchedule;
        currentScore = neighborScore;
        this.stats.acceptedMoves++;
        
        // Update best schedule if this is better
        if (neighborScore < bestScore) {
          bestSchedule = neighborSchedule.clone();
          bestScore = neighborScore;
          this.stats.improvements++;
          noImprovementCount = 0;
        }
      }
      
      // Check for early stopping
      if (i % 100 === 0) {
        if (bestScore < previousBestScore) {
          const improvement = (previousBestScore - bestScore) / previousBestScore;
          if (improvement < this.improvementThreshold) {
            noImprovementCount++;
          } else {
            noImprovementCount = 0;
          }
          previousBestScore = bestScore;
        } else {
          noImprovementCount++;
        }
        
        if (noImprovementCount >= this.earlyStoppingThreshold) {
          console.log(`Early stopping at iteration ${i} due to lack of improvement`);
          this.stats.earlyStop = true;
          break;
        }
      }
      
      // Adaptive cooling rate - cool slower when improving
      const coolingFactor = (neighborScore < currentScore) ? 
        this.coolingRate * this.adaptiveCoolingFactor : this.coolingRate;
      temperature *= coolingFactor;
      
      // Stop if temperature is too low
      if (temperature < this.minTemperature) {
        console.log(`Stopping at iteration ${i} due to minimum temperature reached`);
        break;
      }
    }
    
    // Save final score
    this.stats.finalScore = bestScore;
    
    // Log optimization statistics
    console.log('Optimization completed:');
    console.log(`  Iterations: ${this.stats.iterations}`);
    console.log(`  Accepted moves: ${this.stats.acceptedMoves}`);
    console.log(`  Improvements: ${this.stats.improvements}`);
    console.log(`  Initial score: ${this.stats.initialScore}`);
    console.log(`  Final score: ${this.stats.finalScore}`);
    console.log(`  Improvement: ${(this.stats.initialScore - this.stats.finalScore) / this.stats.initialScore * 100}%`);
    
    return bestSchedule;
  }

  /**
   * Select a strategy based on weights
   * @returns {string} Strategy name
   * @private
   */
  _selectStrategy() {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const strategy of this.strategies) {
      cumulativeWeight += strategy.weight;
      if (random < cumulativeWeight) {
        return strategy.name;
      }
    }
    
    // Default strategy
    return 'swapHomeAway';
  }

  /**
   * Create a neighboring schedule by making a change
   * @param {Schedule} schedule - Current schedule
   * @param {string} strategyName - Name of the strategy to use
   * @returns {Schedule} Neighboring schedule
   * @private
   */
  _createNeighbor(schedule, strategyName) {
    // Map strategy names to methods
    const strategyMap = {
      'swapHomeAway': this._swapHomeAway.bind(this),
      'swapGameDates': this._swapGameDates.bind(this),
      'changeVenue': this._changeVenue.bind(this),
      'swapGamePairs': this._swapGamePairs.bind(this),
      'adjustGameTime': this._adjustGameTime.bind(this)
    };
    
    // Use the selected strategy
    const strategy = strategyMap[strategyName];
    if (!strategy) {
      console.warn(`Strategy ${strategyName} not found, falling back to swapHomeAway`);
      return this._swapHomeAway(schedule);
    }
    
    return strategy(schedule);
  }

  /**
   * Swap home and away teams for a random game
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _swapHomeAway(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 1) {
      return newSchedule;
    }
    
    // Select a random game
    const gameIndex = Math.floor(Math.random() * newSchedule.games.length);
    const game = newSchedule.games[gameIndex];
    
    // Swap home and away teams
    const newGame = new Game(
      game.id,
      game.awayTeam, // Now home team
      game.homeTeam, // Now away team
      game.awayTeam.getVenueForDate(game.date) || game.awayTeam.primaryVenue, // Use away team's venue
      game.date,
      game.sport,
      game.specialDesignation,
      game.tvNetwork
    );
    
    // Replace the game in the schedule
    newSchedule.games[gameIndex] = newGame;
    
    // Invalidate caches
    newSchedule._totalDistance = null;
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }

  /**
   * Swap dates between two random games
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _swapGameDates(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 2) {
      return newSchedule;
    }
    
    // Select two random games
    const gameIndex1 = Math.floor(Math.random() * newSchedule.games.length);
    let gameIndex2 = Math.floor(Math.random() * newSchedule.games.length);
    
    // Ensure we pick two different games
    while (gameIndex2 === gameIndex1) {
      gameIndex2 = Math.floor(Math.random() * newSchedule.games.length);
    }
    
    // Swap dates
    const date1 = new Date(newSchedule.games[gameIndex1].date);
    const date2 = new Date(newSchedule.games[gameIndex2].date);
    
    newSchedule.games[gameIndex1].date = date2;
    newSchedule.games[gameIndex2].date = date1;
    
    // Invalidate caches
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }

  /**
   * Change venue for a random game
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _changeVenue(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 1) {
      return newSchedule;
    }
    
    // Select a random game
    const gameIndex = Math.floor(Math.random() * newSchedule.games.length);
    const game = newSchedule.games[gameIndex];
    
    // Get home team's alternative venues
    const homeTeam = game.homeTeam;
    if (!homeTeam.venues || homeTeam.venues.length <= 1) {
      return newSchedule; // No alternative venues
    }
    
    // Select a random venue that's different from the current one
    const currentVenueId = game.venue.id;
    const alternativeVenues = homeTeam.venues.filter(v => v.id !== currentVenueId);
    
    if (alternativeVenues.length === 0) {
      return newSchedule;
    }
    
    const venueIndex = Math.floor(Math.random() * alternativeVenues.length);
    const newVenue = alternativeVenues[venueIndex];
    
    // Update the game with the new venue
    newSchedule.games[gameIndex].venue = newVenue;
    
    // Invalidate caches
    newSchedule._totalDistance = null;
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }

  /**
   * Swap pairs of games between two teams (home-away pair)
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _swapGamePairs(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 4) {
      return newSchedule;
    }
    
    // Group games by team pairs
    const teamPairs = this._getTeamPairs(newSchedule.games);
    const pairKeys = Object.keys(teamPairs);
    
    if (pairKeys.length < 2) {
      return newSchedule;
    }
    
    // Select two random team pairs
    const pairIndex1 = Math.floor(Math.random() * pairKeys.length);
    let pairIndex2 = Math.floor(Math.random() * pairKeys.length);
    
    // Ensure we pick two different pairs
    while (pairIndex2 === pairIndex1) {
      pairIndex2 = Math.floor(Math.random() * pairKeys.length);
    }
    
    const pair1 = teamPairs[pairKeys[pairIndex1]];
    const pair2 = teamPairs[pairKeys[pairIndex2]];
    
    // Only proceed if both pairs have at least one game
    if (pair1.length === 0 || pair2.length === 0) {
      return newSchedule;
    }
    
    // Select one game from each pair
    const gameIndex1 = Math.floor(Math.random() * pair1.length);
    const gameIndex2 = Math.floor(Math.random() * pair2.length);
    
    const game1 = newSchedule.games.findIndex(g => g.id === pair1[gameIndex1].id);
    const game2 = newSchedule.games.findIndex(g => g.id === pair2[gameIndex2].id);
    
    if (game1 === -1 || game2 === -1) {
      return newSchedule;
    }
    
    // Swap dates
    const date1 = new Date(newSchedule.games[game1].date);
    const date2 = new Date(newSchedule.games[game2].date);
    
    newSchedule.games[game1].date = date2;
    newSchedule.games[game2].date = date1;
    
    // Invalidate caches
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }

  /**
   * Adjust the time of a random game within the same day
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _adjustGameTime(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 1) {
      return newSchedule;
    }
    
    // Select a random game
    const gameIndex = Math.floor(Math.random() * newSchedule.games.length);
    const game = newSchedule.games[gameIndex];
    
    // Get current date and time
    const currentDate = new Date(game.date);
    
    // Generate a new time (hours only)
    const timeSlots = [10, 13, 16, 19];
    const currentHour = currentDate.getHours();
    let newHour;
    
    do {
      const randomIndex = Math.floor(Math.random() * timeSlots.length);
      newHour = timeSlots[randomIndex];
    } while (newHour === currentHour);
    
    // Create new date with updated time
    const newDate = new Date(currentDate);
    newDate.setHours(newHour);
    
    // Update the game with the new time
    newSchedule.games[gameIndex].date = newDate;
    
    // Invalidate caches
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }

  /**
   * Group games by team pairs
   * @param {Array<Game>} games - List of games
   * @returns {Object} Games grouped by team pairs
   * @private
   */
  _getTeamPairs(games) {
    const pairs = {};
    
    for (const game of games) {
      const team1 = game.homeTeam.id;
      const team2 = game.awayTeam.id;
      
      // Create a unique key for the team pair
      const pairKey = [team1, team2].sort().join('_');
      
      if (!pairs[pairKey]) {
        pairs[pairKey] = [];
      }
      
      pairs[pairKey].push(game);
    }
    
    return pairs;
  }

  /**
   * Decide whether to accept a neighbor solution
   * @param {number} currentScore - Current solution score
   * @param {number} neighborScore - Neighbor solution score
   * @param {number} temperature - Current temperature
   * @returns {boolean} Whether to accept the neighbor
   * @private
   */
  _acceptNeighbor(currentScore, neighborScore, temperature) {
    // Always accept better solutions
    if (neighborScore < currentScore) {
      return true;
    }
    
    // Sometimes accept worse solutions based on temperature and score difference
    if (temperature > 0) {
      const delta = neighborScore - currentScore;
      const acceptanceProbability = Math.exp(-delta / temperature);
      
      return Math.random() < acceptanceProbability;
    }
    
    return false;
  }

  /**
   * Get optimization statistics
   * @returns {Object} Optimization statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = AdaptiveSimulatedAnnealingOptimizer;