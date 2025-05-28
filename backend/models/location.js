/**
 * FlexTime Scheduling System - Location Model
 * 
 * Represents a geographic location with latitude and longitude.
 * Used for calculating travel distances between venues.
 */

class Location {
  /**
   * Create a new Location
   * @param {string} name - Name of the location
   * @param {string} city - City name
   * @param {string} state - State abbreviation
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   */
  constructor(name, city, state, latitude, longitude) {
    this.name = name;
    this.city = city;
    this.state = state;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  /**
   * Calculate distance in miles to another location using Haversine formula
   * @param {Location} other - The other location
   * @returns {number} Distance in miles
   */
  distanceTo(other) {
    // Earth radius in miles
    const R = 3958.8;
    
    // Convert latitude and longitude from degrees to radians
    const lat1 = this.latitude * Math.PI / 180;
    const lon1 = this.longitude * Math.PI / 180;
    const lat2 = other.latitude * Math.PI / 180;
    const lon2 = other.longitude * Math.PI / 180;
    
    // Haversine formula
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon/2)**2;
    const c = 2 * Math.asin(Math.sqrt(a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Create a Location from a database record
   * @param {Object} record - Database record
   * @returns {Location} Location instance
   */
  static fromDatabase(record) {
    return new Location(
      record.name,
      record.city,
      record.state,
      record.latitude,
      record.longitude
    );
  }

  /**
   * Convert to a database-friendly object
   * @returns {Object} Database-friendly object
   */
  toDatabase() {
    return {
      name: this.name,
      city: this.city,
      state: this.state,
      latitude: this.latitude,
      longitude: this.longitude
    };
  }
}

module.exports = Location;
