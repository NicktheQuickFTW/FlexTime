/**
 * FlexTime Scheduling System - Schedule Optimizer
 * 
 * Algorithms for optimizing existing schedules.
 */

const Schedule = require('../models/schedule');
const Game = require('../models/game');

/**
 * Base class for schedule optimization algorithms
 */
class ScheduleOptimizer {
  /**
   * Create a new ScheduleOptimizer
   * @param {Schedule} schedule - Schedule to optimize
   * @param {number} maxIterations - Maximum number of iterations
   */
  constructor(schedule, maxIterations = 1000) {
    this.schedule = schedule;
    this.maxIterations = maxIterations;
  }

  /**
   * Optimize a schedule
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    // Base class doesn't implement optimization logic
    // Subclasses should override this method
    throw new Error('Schedule optimization not implemented');
  }
}

/**
 * Schedule optimizer using simulated annealing algorithm.
 * Gradually improves schedule quality through random perturbations.
 */
class SimulatedAnnealingOptimizer extends ScheduleOptimizer {
  /**
   * Create a new SimulatedAnnealingOptimizer
   * @param {Schedule} schedule - Schedule to optimize
   * @param {number} maxIterations - Maximum number of iterations
   * @param {number} initialTemperature - Initial temperature
   * @param {number} coolingRate - Cooling rate
   */
  constructor(schedule, maxIterations = 1000, initialTemperature = 100.0, coolingRate = 0.95) {
    super(schedule, maxIterations);
    this.initialTemperature = initialTemperature;
    this.coolingRate = coolingRate;
  }

  /**
   * Optimize schedule using simulated annealing
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    // Create a deep copy of the schedule to work with
    let currentSchedule = this.schedule.clone();
    let bestSchedule = currentSchedule.clone();
    
    // Evaluate initial schedule
    let currentScore = this._evaluateSchedule(currentSchedule);
    let bestScore = currentScore;
    
    // Initialize temperature
    let temperature = this.initialTemperature;
    
    // Main simulated annealing loop
    for (let i = 0; i < this.maxIterations; i++) {
      // Create a neighboring schedule by making a random change
      const neighborSchedule = this._createNeighbor(currentSchedule);
      
      // Evaluate the neighbor
      const neighborScore = this._evaluateSchedule(neighborSchedule);
      
      // Decide whether to accept the neighbor
      if (this._acceptNeighbor(currentScore, neighborScore, temperature)) {
        currentSchedule = neighborSchedule;
        currentScore = neighborScore;
        
        // Update best schedule if this is better
        if (neighborScore < bestScore) {
          bestSchedule = neighborSchedule.clone();
          bestScore = neighborScore;
        }
      }
      
      // Cool down the temperature
      temperature *= this.coolingRate;
    }
    
    return bestSchedule;
  }

  /**
   * Create a deep copy of a schedule
   * @param {Schedule} schedule - Schedule to clone
   * @returns {Schedule} Cloned schedule
   * @private
   */
  _cloneSchedule(schedule) {
    return schedule.clone();
  }

  /**
   * Evaluate schedule quality. Lower score is better.
   * Combines travel distance and constraint penalties.
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Quality score (lower is better)
   * @private
   */
  _evaluateSchedule(schedule) {
    // Calculate travel distance component
    const travelScore = schedule.totalTravelDistance / 1000; // Scale down
    
    // Calculate constraint violations
    const penaltyScore = schedule.penaltyScore;
    
    // Check if any hard constraints are violated
    if (!schedule.isValid) {
      return Number.MAX_SAFE_INTEGER; // Extremely high score for invalid schedules
    }
    
    // Combine scores (can adjust weights as needed)
    return travelScore + penaltyScore;
  }

  /**
   * Create a neighboring schedule by making a random change
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Neighboring schedule
   * @private
   */
  _createNeighbor(schedule) {
    // Choose a random modification strategy
    const strategy = Math.floor(Math.random() * 3);
    
    switch (strategy) {
      case 0:
        return this._swapHomeAway(schedule);
      case 1:
        return this._swapGameDates(schedule);
      case 2:
        return this._changeVenue(schedule);
      default:
        return this._swapHomeAway(schedule);
    }
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
    if (homeTeam.secondaryVenues.length === 0) {
      return newSchedule; // No alternative venues
    }
    
    // Select a random secondary venue
    const venueIndex = Math.floor(Math.random() * homeTeam.secondaryVenues.length);
    const newVenue = homeTeam.secondaryVenues[venueIndex];
    
    // Update the game with the new venue
    newSchedule.games[gameIndex].venue = newVenue;
    
    // Invalidate caches
    newSchedule._totalDistance = null;
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }

  /**
   * Decide whether to accept a neighbor solution.
   * Always accept if better, sometimes accept if worse based on temperature.
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
}

/**
 * Optimizer specifically focused on minimizing travel distances.
 */
class TravelOptimizationPipeline {
  /**
   * Create a new TravelOptimizationPipeline
   * @param {Schedule} schedule - Schedule to optimize
   */
  constructor(schedule) {
    this.schedule = schedule;
  }

  /**
   * Optimize the schedule for travel efficiency
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    // Create a deep copy of the schedule to work with
    const newSchedule = this.schedule.clone();
    
    // Group games by team
    const teamGames = new Map();
    
    for (const team of newSchedule.teams) {
      teamGames.set(team.id, []);
    }
    
    for (const game of newSchedule.games) {
      teamGames.get(game.homeTeam.id).push(game);
      teamGames.get(game.awayTeam.id).push(game);
    }
    
    // Sort games by date for each team
    for (const [teamId, games] of teamGames.entries()) {
      teamGames.set(teamId, games.sort((a, b) => a.date.getTime() - b.date.getTime()));
    }
    
    // Identify and optimize road trips
    const optimizedGames = this._optimizeRoadTrips(teamGames);
    
    // Create a new schedule with the optimized games
    const optimizedSchedule = new Schedule(
      newSchedule.id,
      newSchedule.sport,
      newSchedule.season,
      newSchedule.teams,
      optimizedGames,
      newSchedule.constraints
    );
    
    return optimizedSchedule;
  }

  /**
   * Identify and optimize road trips
   * @param {Map<string, Array<Game>>} teamGames - Games grouped by team
   * @returns {Array<Game>} Optimized games
   * @private
   */
  _optimizeRoadTrips(teamGames) {
    // Create a copy of all games
    const allGames = new Map();
    
    for (const game of this.schedule.games) {
      allGames.set(game.id, game.clone());
    }
    
    // For each team, identify potential road trips
    for (const [teamId, games] of teamGames.entries()) {
      const team = this.schedule.teams.find(t => t.id === teamId);
      const awayGames = games.filter(g => g.awayTeam.id === teamId);
      
      // Sort away games by date
      awayGames.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Identify potential road trips (away games close in time)
      const roadTrips = [];
      let currentTrip = [];
      
      for (const game of awayGames) {
        if (currentTrip.length === 0) {
          currentTrip.push(game);
        } else {
          // Check if this game is consecutive with the last one
          const lastGame = currentTrip[currentTrip.length - 1];
          const daysBetween = (game.date.getTime() - lastGame.date.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysBetween <= 4) { // Max 4 days between games in a trip
            currentTrip.push(game);
          } else {
            if (currentTrip.length > 1) {
              roadTrips.push([...currentTrip]);
            }
            currentTrip = [game];
          }
        }
      }
      
      if (currentTrip.length > 1) {
        roadTrips.push([...currentTrip]);
      }
      
      // Optimize each road trip
      for (const trip of roadTrips) {
        this._optimizeTripSequence(trip, allGames);
      }
    }
    
    return Array.from(allGames.values());
  }

  /**
   * Optimize the sequence of games in a road trip to minimize travel distance
   * @param {Array<Game>} trip - Games in the road trip
   * @param {Map<string, Game>} allGames - All games in the schedule
   * @private
   */
  _optimizeTripSequence(trip, allGames) {
    if (trip.length <= 2) {
      return; // No optimization needed for 1 or 2 games
    }
    
    const team = trip[0].awayTeam;
    
    // Calculate distances between all venues in the trip
    const venues = trip.map(game => game.venue);
    const distances = new Map();
    
    for (let i = 0; i < venues.length; i++) {
      for (let j = 0; j < venues.length; j++) {
        if (i !== j) {
          const key = `${venues[i].id}-${venues[j].id}`;
          distances.set(key, venues[i].location.distanceTo(venues[j].location));
        }
      }
    }
    
    // Find optimal sequence of venues using a greedy approach
    // Start from team's home location
    let currentLocation = team.location;
    const remainingGames = [...trip];
    const sequence = [];
    
    while (remainingGames.length > 0) {
      // Find closest venue
      let closestGame = remainingGames[0];
      let closestDistance = currentLocation.distanceTo(closestGame.venue.location);
      
      for (let i = 1; i < remainingGames.length; i++) {
        const distance = currentLocation.distanceTo(remainingGames[i].venue.location);
        if (distance < closestDistance) {
          closestGame = remainingGames[i];
          closestDistance = distance;
        }
      }
      
      sequence.push(closestGame);
      currentLocation = closestGame.venue.location;
      remainingGames.splice(remainingGames.indexOf(closestGame), 1);
    }
    
    // Reassign dates to follow the optimal sequence
    // Keep the same span of dates, just reorder
    const dates = trip.map(game => new Date(game.date)).sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 0; i < sequence.length; i++) {
      // Update the game in allGames
      allGames.get(sequence[i].id).date = dates[i];
    }
  }
}

module.exports = {
  ScheduleOptimizer,
  SimulatedAnnealingOptimizer,
  TravelOptimizationPipeline
};
