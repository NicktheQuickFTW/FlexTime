/**
 * FlexTime Scheduling System - Venue Model
 * 
 * Represents a sports venue with location and capacity information.
 */

const Location = require('./location');

class Venue {
  /**
   * Create a new Venue
   * @param {string} id - Unique identifier
   * @param {string} name - Venue name
   * @param {Location} location - Geographic location
   * @param {number} capacity - Seating capacity
   * @param {Array<string>} facilities - Available facilities
   * @param {Array<Date>} unavailableDates - Dates when venue is unavailable
   */
  constructor(id, name, location, capacity, facilities = [], unavailableDates = []) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.capacity = capacity;
    this.facilities = facilities;
    this.unavailableDates = unavailableDates;
  }

  /**
   * Check if venue is available on a specific date
   * @param {Date} date - Date to check
   * @returns {boolean} True if available
   */
  isAvailable(date) {
    // Convert date to midnight for comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check if the date is in the unavailable dates list
    return !this.unavailableDates.some(unavailableDate => {
      const compareDate = new Date(unavailableDate);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() === checkDate.getTime();
    });
  }

  /**
   * Create a Venue from a database record
   * @param {Object} record - Database record
   * @returns {Venue} Venue instance
   */
  static fromDatabase(record) {
    const location = record.location instanceof Location 
      ? record.location 
      : Location.fromDatabase(record.location);
    
    return new Venue(
      record.id,
      record.name,
      location,
      record.capacity,
      record.facilities || [],
      record.unavailable_dates ? record.unavailable_dates.map(d => new Date(d)) : []
    );
  }

  /**
   * Convert to a database-friendly object
   * @returns {Object} Database-friendly object
   */
  toDatabase() {
    return {
      id: this.id,
      name: this.name,
      location: this.location.toDatabase(),
      capacity: this.capacity,
      facilities: this.facilities,
      unavailable_dates: this.unavailableDates.map(d => d.toISOString())
    };
  }
}

module.exports = Venue;
