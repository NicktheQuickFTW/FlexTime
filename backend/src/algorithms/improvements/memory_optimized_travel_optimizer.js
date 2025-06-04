/**
 * Memory-Optimized Travel Optimization Pipeline for FlexTime
 * 
 * This improved version uses:
 * - Memory-efficient data structures
 * - Lazy cloning
 * - Index-based operations
 * - Reduced object creation
 */

const Schedule = require('../../../models/schedule');
const Game = require('../../../models/game');

class MemoryOptimizedTravelOptimizer {
  /**
   * Create a new Memory-Optimized Travel Optimizer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 100;
    this.maxRoadTripLength = options.maxRoadTripLength || 5;
    this.minimumRoadTripLength = options.minimumRoadTripLength || 2;
    this.maxDaysBetweenRoadTripGames = options.maxDaysBetweenRoadTripGames || 4;
    this.debugEnabled = options.debug || false;
  }

  /**
   * Optimize a schedule for travel efficiency
   * @param {Schedule} schedule - Schedule to optimize
   * @returns {Schedule} Optimized schedule
   */
  optimize(schedule) {
    // Debug output if enabled
    if (this.debugEnabled) {
      console.log(`Starting travel optimization for schedule ${schedule.id}`);
      console.log(`Original travel distance: ${this._calculateTotalTravelDistance(schedule)}`);
    }
    
    // Create optimization context with references to original objects where possible
    const context = {
      scheduleId: schedule.id,
      sport: schedule.sport,
      season: schedule.season,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      teams: schedule.teams, // Reference original teams (not modified)
      constraints: schedule.constraints, // Reference original constraints (not modified)
      venues: new Map(),
      teamHomeVenues: new Map()
    };
    
    // Create venue lookup maps to avoid repeated searches
    for (const team of schedule.teams) {
      // Store team's primary venue
      context.teamHomeVenues.set(team.id, team.primaryVenue);
      
      // Store all venues
      for (const venue of team.venues || [team.primaryVenue]) {
        if (venue) {
          context.venues.set(venue.id, venue);
        }
      }
    }
    
    // Clone games array once, but keep references to original objects
    const games = schedule.games.map(game => ({
      id: game.id,
      homeTeamId: game.homeTeam.id,
      awayTeamId: game.awayTeam.id,
      venueId: game.venue.id,
      date: new Date(game.date),
      sport: game.sport,
      specialDesignation: game.specialDesignation,
      tvNetwork: game.tvNetwork
    }));
    
    // Index games by team for faster access
    const gamesByTeam = this._indexGamesByTeam(games, schedule.teams);
    
    // Identify and optimize road trips
    const optimizedGames = this._optimizeRoadTrips(gamesByTeam, games, context);
    
    // Create new Schedule object with optimized games
    const optimizedSchedule = this._createOptimizedSchedule(schedule, optimizedGames, context);
    
    // Debug output if enabled
    if (this.debugEnabled) {
      console.log(`Optimized travel distance: ${this._calculateTotalTravelDistance(optimizedSchedule)}`);
      console.log(`Improvement: ${
        this._calculateTotalTravelDistance(schedule) - this._calculateTotalTravelDistance(optimizedSchedule)
      } miles`);
    }
    
    return optimizedSchedule;
  }
  
  /**
   * Create an index of games by team
   * @param {Array} games - Array of game objects
   * @param {Array} teams - Array of team objects
   * @returns {Map} Map of team ID to array of game indices
   * @private
   */
  _indexGamesByTeam(games, teams) {
    const gamesByTeam = new Map();
    
    // Initialize with empty arrays
    for (const team of teams) {
      gamesByTeam.set(team.id, []);
    }
    
    // Add games to team arrays
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      gamesByTeam.get(game.homeTeamId).push(i);
      gamesByTeam.get(game.awayTeamId).push(i);
    }
    
    return gamesByTeam;
  }
  
  /**
   * Identify and optimize road trips
   * @param {Map} gamesByTeam - Map of team ID to array of game indices
   * @param {Array} games - Array of game objects
   * @param {Object} context - Optimization context
   * @returns {Array} Optimized array of game objects
   * @private
   */
  _optimizeRoadTrips(gamesByTeam, games, context) {
    // Clone games array to avoid modifying the original
    const optimizedGames = games.map(g => ({ ...g, date: new Date(g.date) }));
    
    // Process each team
    for (const [teamId, gameIndices] of gamesByTeam.entries()) {
      // Get team's home location
      const team = context.teams.find(t => t.id === teamId);
      
      // Only proceed if we have the team location
      if (!team || !team.location) continue;
      
      // Get away games for this team
      const awayGameIndices = gameIndices.filter(i => optimizedGames[i].awayTeamId === teamId);
      
      // Sort away games by date
      awayGameIndices.sort((a, b) => optimizedGames[a].date - optimizedGames[b].date);
      
      // Skip teams with too few away games
      if (awayGameIndices.length < this.minimumRoadTripLength) continue;
      
      // Identify potential road trips (away games close in time)
      const roadTrips = this._identifyRoadTrips(awayGameIndices, optimizedGames);
      
      // Optimize each road trip
      for (const trip of roadTrips) {
        this._optimizeTripSequence(trip, optimizedGames, team.location, context);
      }
    }
    
    return optimizedGames;
  }
  
  /**
   * Identify potential road trips
   * @param {Array} awayGameIndices - Indices of away games for a team
   * @param {Array} games - Array of game objects
   * @returns {Array} Array of road trip arrays (each containing game indices)
   * @private
   */
  _identifyRoadTrips(awayGameIndices, games) {
    const roadTrips = [];
    let currentTrip = [];
    
    for (let i = 0; i < awayGameIndices.length; i++) {
      const gameIndex = awayGameIndices[i];
      
      if (currentTrip.length === 0) {
        currentTrip.push(gameIndex);
      } else {
        // Check if this game is consecutive with the last one
        const lastGameIndex = currentTrip[currentTrip.length - 1];
        const daysBetween = (games[gameIndex].date - games[lastGameIndex].date) / (1000 * 60 * 60 * 24);
        
        if (daysBetween <= this.maxDaysBetweenRoadTripGames) {
          // Add to current trip if within maximum days
          currentTrip.push(gameIndex);
          
          // If we've reached maximum trip length, end the trip
          if (currentTrip.length >= this.maxRoadTripLength) {
            roadTrips.push([...currentTrip]);
            currentTrip = [];
          }
        } else {
          // End current trip if game is too far apart
          if (currentTrip.length >= this.minimumRoadTripLength) {
            roadTrips.push([...currentTrip]);
          }
          currentTrip = [gameIndex];
        }
      }
    }
    
    // Add final trip if it meets minimum length
    if (currentTrip.length >= this.minimumRoadTripLength) {
      roadTrips.push([...currentTrip]);
    }
    
    return roadTrips;
  }
  
  /**
   * Optimize the sequence of games in a road trip
   * @param {Array} tripIndices - Array of game indices in the trip
   * @param {Array} games - Array of game objects
   * @param {Object} teamLocation - Team's home location
   * @param {Object} context - Optimization context
   * @private
   */
  _optimizeTripSequence(tripIndices, games, teamLocation, context) {
    if (tripIndices.length <= 2) {
      return; // No optimization needed for 1 or 2 games
    }
    
    // Create array of venues for this trip
    const venues = tripIndices.map(i => {
      const venueId = games[i].venueId;
      return context.venues.get(venueId);
    });
    
    // Calculate distances between all venues in the trip
    const distances = new Map();
    
    // Also include distance from team's home location to each venue
    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      if (!venue || !venue.location) continue;
      
      // Distance from home to venue
      const homeToVenueKey = `home-${venue.id}`;
      distances.set(homeToVenueKey, teamLocation.distanceTo(venue.location));
      
      // Distance between venues
      for (let j = 0; j < venues.length; j++) {
        if (i !== j) {
          const otherVenue = venues[j];
          if (!otherVenue || !otherVenue.location) continue;
          
          const key = `${venue.id}-${otherVenue.id}`;
          distances.set(key, venue.location.distanceTo(otherVenue.location));
        }
      }
    }
    
    // Find optimal sequence of venues using a greedy approach
    const optimalSequence = this._findOptimalSequence(tripIndices, venues, distances, teamLocation);
    
    // Get the original dates, sorted chronologically
    const originalDates = tripIndices.map(i => new Date(games[i].date)).sort((a, b) => a - b);
    
    // Assign dates to follow the optimal sequence
    for (let i = 0; i < optimalSequence.length; i++) {
      const gameIndex = optimalSequence[i];
      games[gameIndex].date = new Date(originalDates[i]);
    }
  }
  
  /**
   * Find optimal sequence of venues to minimize travel distance
   * @param {Array} tripIndices - Array of game indices in the trip
   * @param {Array} venues - Array of venue objects
   * @param {Map} distances - Map of pre-calculated distances
   * @param {Object} homeLocation - Team's home location
   * @returns {Array} Array of game indices in optimal sequence
   * @private
   */
  _findOptimalSequence(tripIndices, venues, distances, homeLocation) {
    // Start with greedy approach from home location
    const result = [];
    const remaining = new Set(tripIndices);
    let currentLocation = 'home';
    
    while (remaining.size > 0) {
      let bestGameIndex = null;
      let shortestDistance = Infinity;
      
      // Find closest venue from current location
      for (const gameIndex of remaining) {
        const venue = venues[tripIndices.indexOf(gameIndex)];
        if (!venue) continue;
        
        const distanceKey = `${currentLocation === 'home' ? 'home' : currentLocation}-${venue.id}`;
        const distance = distances.get(distanceKey) || Infinity;
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestGameIndex = gameIndex;
        }
      }
      
      if (bestGameIndex !== null) {
        result.push(bestGameIndex);
        remaining.delete(bestGameIndex);
        const venue = venues[tripIndices.indexOf(bestGameIndex)];
        currentLocation = venue.id;
      } else {
        // Just in case we can't find a valid next venue
        const nextIndex = remaining.values().next().value;
        result.push(nextIndex);
        remaining.delete(nextIndex);
      }
    }
    
    return result;
  }
  
  /**
   * Create optimized schedule object from optimized games
   * @param {Schedule} originalSchedule - Original schedule
   * @param {Array} optimizedGames - Optimized array of game objects
   * @param {Object} context - Optimization context
   * @returns {Schedule} New schedule with optimized games
   * @private
   */
  _createOptimizedSchedule(originalSchedule, optimizedGames, context) {
    // Convert simplified game objects back to Game instances
    const gameInstances = optimizedGames.map(g => {
      const homeTeam = originalSchedule.teams.find(t => t.id === g.homeTeamId);
      const awayTeam = originalSchedule.teams.find(t => t.id === g.awayTeamId);
      const venue = context.venues.get(g.venueId);
      
      return new Game(
        g.id,
        homeTeam,
        awayTeam,
        venue,
        g.date,
        g.sport,
        g.specialDesignation,
        g.tvNetwork
      );
    });
    
    // Create new schedule with optimized games
    return new Schedule(
      originalSchedule.id,
      originalSchedule.sport,
      originalSchedule.season,
      originalSchedule.teams,
      gameInstances,
      originalSchedule.constraints,
      originalSchedule.startDate,
      originalSchedule.endDate
    );
  }
  
  /**
   * Calculate total travel distance for a schedule
   * @param {Schedule} schedule - Schedule to calculate distance for
   * @returns {number} Total travel distance in miles
   * @private
   */
  _calculateTotalTravelDistance(schedule) {
    // Calculate total travel distance for all teams
    let totalDistance = 0;
    
    for (const team of schedule.teams) {
      // Group games by team
      const teamGames = schedule.games.filter(
        g => g.homeTeam.id === team.id || g.awayTeam.id === team.id
      );
      
      // Sort games by date
      teamGames.sort((a, b) => a.date - b.date);
      
      // Calculate distance for this team
      let currentLocation = team.location;
      let teamDistance = 0;
      
      for (const game of teamGames) {
        const gameLocation = game.venue.location;
        teamDistance += currentLocation.distanceTo(gameLocation);
        currentLocation = gameLocation;
      }
      
      // Add distance back home after last game
      if (teamGames.length > 0) {
        const lastGameLocation = teamGames[teamGames.length - 1].venue.location;
        teamDistance += lastGameLocation.distanceTo(team.location);
      }
      
      totalDistance += teamDistance;
    }
    
    return totalDistance;
  }
}

module.exports = MemoryOptimizedTravelOptimizer;