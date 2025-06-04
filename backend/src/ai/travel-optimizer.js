/**
 * FlexTime Scheduling System - Travel Optimizer
 * 
 * Advanced utility for optimizing travel distances in a schedule.
 * Implements algorithms to minimize total travel distance and create efficient road trips.
 */

const Schedule = require('../../models/schedule');
const Game = require('../../models/game');

class TravelOptimizer {
  /**
   * Create a new TravelOptimizer
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Additional options
   */
  constructor(schedule, options = {}) {
    this.schedule = schedule;
    
    // Default options
    this.options = {
      maxConsecutiveAwayGames: 4,
      maxDaysBetweenRoadGames: 3,
      preferRoadTrips: true,
      preserveConferenceGames: true,
      ...options
    };
  }

  /**
   * Optimize travel in the schedule
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    // Create a deep copy of the schedule to work with
    const newSchedule = this.schedule.clone();
    
    // Group games by teams
    const teamGames = new Map();
    
    for (const team of newSchedule.teams) {
      teamGames.set(team.id, []);
    }
    
    // Populate team games
    for (const game of newSchedule.games) {
      if (game.homeTeam && game.homeTeam.id) {
        teamGames.get(game.homeTeam.id).push(game);
      }
      if (game.awayTeam && game.awayTeam.id) {
        teamGames.get(game.awayTeam.id).push(game);
      }
    }
    
    // First pass: Identify and optimize road trips
    if (this.options.preferRoadTrips) {
      this._optimizeRoadTrips(newSchedule, teamGames);
    }
    
    // Second pass: Minimize total travel distance
    this._minimizeTotalTravelDistance(newSchedule, teamGames);
    
    return newSchedule;
  }
  
  /**
   * Optimize road trips to minimize travel
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Map<string, Array<Game>>} teamGames - Games grouped by team
   * @private
   */
  _optimizeRoadTrips(schedule, teamGames) {
    // For each team, identify potential road trips
    for (const [teamId, games] of teamGames.entries()) {
      const team = schedule.teams.find(t => t.id === teamId);
      if (!team) continue;
      
      // Get away games sorted by date
      const awayGames = games
        .filter(game => game.awayTeam && game.awayTeam.id === teamId && game.date)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Identify potential road trips (consecutive away games)
      const roadTrips = [];
      let currentTrip = [];
      
      for (let i = 0; i < awayGames.length; i++) {
        const game = awayGames[i];
        
        if (currentTrip.length === 0) {
          currentTrip.push(game);
        } else {
          const lastGame = currentTrip[currentTrip.length - 1];
          const daysBetween = (game.date.getTime() - lastGame.date.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysBetween <= this.options.maxDaysBetweenRoadGames) {
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
        this._optimizeTripSequence(trip, team);
      }
    }
  }
  
  /**
   * Optimize the sequence of games in a road trip
   * @param {Array<Game>} trip - Games in the road trip
   * @param {Object} team - Team object
   * @private
   */
  _optimizeTripSequence(trip, team) {
    if (trip.length <= 2) return; // No optimization needed for 1 or 2 games
    
    // Check if any games are conference games that shouldn't be moved
    if (this.options.preserveConferenceGames) {
      const hasConferenceGames = trip.some(game => game.metadata && game.metadata.isConferenceGame);
      if (hasConferenceGames) {
        // Don't reorder if there are conference games
        return;
      }
    }
    
    // Calculate distances between all venues
    const distanceMatrix = new Map();
    
    for (let i = 0; i < trip.length; i++) {
      for (let j = 0; j < trip.length; j++) {
        if (i !== j) {
          const venue1 = trip[i].venue;
          const venue2 = trip[j].venue;
          
          if (!venue1 || !venue2 || !venue1.location || !venue2.location) continue;
          
          const key = `${venue1.id}-${venue2.id}`;
          
          const distance = this._calculateDistance(
            venue1.location.latitude,
            venue1.location.longitude,
            venue2.location.latitude,
            venue2.location.longitude
          );
          
          distanceMatrix.set(key, distance);
        }
      }
    }
    
    // Use a greedy algorithm to find a better sequence
    // Start from team's home location
    const homeLocation = team.location;
    if (!homeLocation) return;
    
    const remainingGames = [...trip];
    const optimizedSequence = [];
    
    let currentLocation = homeLocation;
    
    while (remainingGames.length > 0) {
      // Find closest venue
      let closestGame = null;
      let closestDistance = Infinity;
      
      for (const game of remainingGames) {
        const venue = game.venue;
        
        if (!venue || !venue.location) continue;
        
        const distance = this._calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          venue.location.latitude,
          venue.location.longitude
        );
        
        if (distance < closestDistance) {
          closestGame = game;
          closestDistance = distance;
        }
      }
      
      if (closestGame) {
        optimizedSequence.push(closestGame);
        currentLocation = closestGame.venue.location;
        remainingGames.splice(remainingGames.indexOf(closestGame), 1);
      } else {
        break;
      }
    }
    
    // Reorder the trip dates to match the optimized sequence
    const dates = trip.map(game => new Date(game.date)).sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 0; i < optimizedSequence.length; i++) {
      optimizedSequence[i].date = dates[i];
    }
  }
  
  /**
   * Minimize total travel distance for all teams
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Map<string, Array<Game>>} teamGames - Games grouped by team
   * @private
   */
  _minimizeTotalTravelDistance(schedule, teamGames) {
    // For each team, calculate and try to minimize total travel distance
    for (const [teamId, games] of teamGames.entries()) {
      const team = schedule.teams.find(t => t.id === teamId);
      if (!team || !team.location) continue;
      
      // Sort games by date
      const sortedGames = games
        .filter(game => game.date)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Calculate total travel distance
      let totalDistance = 0;
      let currentLocation = team.location;
      
      for (const game of sortedGames) {
        const venue = game.venue;
        if (!venue || !venue.location) continue;
        
        // Calculate distance from current location to venue
        const distance = this._calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          venue.location.latitude,
          venue.location.longitude
        );
        
        totalDistance += distance;
        
        // Update current location
        currentLocation = venue.location;
      }
      
      // Final trip back home
      if (sortedGames.length > 0) {
        const lastVenue = sortedGames[sortedGames.length - 1].venue;
        if (lastVenue && lastVenue.location) {
          const distance = this._calculateDistance(
            lastVenue.location.latitude,
            lastVenue.location.longitude,
            team.location.latitude,
            team.location.longitude
          );
          
          totalDistance += distance;
        }
      }
      
      // Store total travel distance in team metadata
      if (!team.metadata) team.metadata = {};
      team.metadata.totalTravelDistance = Math.round(totalDistance);
      team.metadata.totalTravelMiles = Math.round(totalDistance);
    }
  }
  
  /**
   * Calculate the distance between two points using the Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
        typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      return 0;
    }
    
    const R = 3958.8; // Earth's radius in miles
    const dLat = this._toRadians(lat2 - lat1);
    const dLon = this._toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   * @private
   */
  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = TravelOptimizer;
