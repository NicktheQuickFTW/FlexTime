/**
 * FlexTime Scheduling System - Travel Distance Calculator
 * 
 * Efficient utility for calculating and caching travel distances between locations.
 * Inspired by the TravelDistanceCalculator from FlexTime v2.1.
 */

/**
 * Calculates and caches travel distances between locations
 */
class TravelDistanceCalculator {
  /**
   * Create a new TravelDistanceCalculator
   * @param {Array} teams - Teams to calculate distances for
   */
  constructor(teams) {
    this.teams = teams;
    this.locations = this._extractLocations();
    this.distanceMatrix = this._buildDistanceMatrix();
  }
  
  /**
   * Extract all unique locations from teams and venues
   * @returns {Object} Map of location IDs to location objects
   * @private
   */
  _extractLocations() {
    const locations = {};
    
    // Add team locations
    for (const team of this.teams) {
      if (team.location) {
        const locationKey = `${team.location.latitude}_${team.location.longitude}`;
        locations[locationKey] = team.location;
      }
      
      // Add venue locations
      if (team.primaryVenue && team.primaryVenue.location) {
        const locationKey = `${team.primaryVenue.location.latitude}_${team.primaryVenue.location.longitude}`;
        locations[locationKey] = team.primaryVenue.location;
      }
      
      // Add secondary venue locations
      if (team.secondaryVenues) {
        for (const venue of team.secondaryVenues) {
          if (venue.location) {
            const locationKey = `${venue.location.latitude}_${venue.location.longitude}`;
            locations[locationKey] = venue.location;
          }
        }
      }
    }
    
    return locations;
  }
  
  /**
   * Build a matrix of distances between all locations
   * @returns {Object} Map of location pairs to distances
   * @private
   */
  _buildDistanceMatrix() {
    const distanceMatrix = {};
    const locationKeys = Object.keys(this.locations);
    
    // Calculate distances between all pairs of locations
    for (let i = 0; i < locationKeys.length; i++) {
      const key1 = locationKeys[i];
      for (let j = 0; j < locationKeys.length; j++) {
        const key2 = locationKeys[j];
        
        if (i !== j) {
          const loc1 = this.locations[key1];
          const loc2 = this.locations[key2];
          const distance = this._calculateDistance(
            loc1.latitude, 
            loc1.longitude, 
            loc2.latitude, 
            loc2.longitude
          );
          
          distanceMatrix[`${key1}|${key2}`] = distance;
        }
      }
    }
    
    return distanceMatrix;
  }
  
  /**
   * Get the distance between two locations
   * @param {Object} loc1 - First location with latitude and longitude
   * @param {Object} loc2 - Second location with latitude and longitude
   * @returns {number} Distance in miles
   */
  getDistance(loc1, loc2) {
    if (!loc1 || !loc2 || 
        typeof loc1.latitude !== 'number' || 
        typeof loc1.longitude !== 'number' ||
        typeof loc2.latitude !== 'number' || 
        typeof loc2.longitude !== 'number') {
      return 0;
    }
    
    const key1 = `${loc1.latitude}_${loc1.longitude}`;
    const key2 = `${loc2.latitude}_${loc2.longitude}`;
    
    if (key1 === key2) {
      return 0;
    }
    
    // Check if distance is in the matrix
    const matrixKey = `${key1}|${key2}`;
    const reverseMatrixKey = `${key2}|${key1}`;
    
    if (this.distanceMatrix[matrixKey] !== undefined) {
      return this.distanceMatrix[matrixKey];
    } else if (this.distanceMatrix[reverseMatrixKey] !== undefined) {
      return this.distanceMatrix[reverseMatrixKey];
    } else {
      // Calculate distance if not in matrix
      const distance = this._calculateDistance(
        loc1.latitude, 
        loc1.longitude, 
        loc2.latitude, 
        loc2.longitude
      );
      
      // Store in matrix for future use
      this.distanceMatrix[matrixKey] = distance;
      
      return distance;
    }
  }
  
  /**
   * Get the distance between two teams' locations
   * @param {Object} team1 - First team
   * @param {Object} team2 - Second team
   * @returns {number} Distance in miles
   */
  getTeamDistance(team1, team2) {
    if (!team1 || !team2 || !team1.location || !team2.location) {
      return 0;
    }
    
    return this.getDistance(team1.location, team2.location);
  }
  
  /**
   * Get the distance between two venues
   * @param {Object} venue1 - First venue
   * @param {Object} venue2 - Second venue
   * @returns {number} Distance in miles
   */
  getVenueDistance(venue1, venue2) {
    if (!venue1 || !venue2 || !venue1.location || !venue2.location) {
      return 0;
    }
    
    return this.getDistance(venue1.location, venue2.location);
  }
  
  /**
   * Get the distance from a team's location to a venue
   * @param {Object} team - Team
   * @param {Object} venue - Venue
   * @returns {number} Distance in miles
   */
  getTeamToVenueDistance(team, venue) {
    if (!team || !venue || !team.location || !venue.location) {
      return 0;
    }
    
    return this.getDistance(team.location, venue.location);
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

module.exports = TravelDistanceCalculator;
