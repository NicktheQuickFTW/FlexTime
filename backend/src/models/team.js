/**
 * FlexTime Scheduling System - Team Model
 * 
 * Represents a sports team with home venue and location.
 */

const Location = require('./location');
const Venue = require('./venue');

class Team {
  /**
   * Create a new Team
   * @param {string} id - Unique identifier
   * @param {string} name - Team name (institution name)
   * @param {string} nickname - Team nickname/mascot
   * @param {Venue} primaryVenue - Primary home venue
   * @param {Array<Venue>} secondaryVenues - Alternative venues
   * @param {Location} location - Team's geographic location
   * @param {string} division - Division name
   * @param {string} conference - Conference name
   * @param {Object} travelConstraints - Travel-related constraints
   */
  constructor(id, name, nickname, primaryVenue, secondaryVenues = [], location = null, 
              division = "", conference = "Big 12", travelConstraints = {}) {
    this.id = id;
    this.name = name;
    this.nickname = nickname;
    this.primaryVenue = primaryVenue;
    this.secondaryVenues = secondaryVenues;
    
    // If location not provided, use primary venue location
    this.location = location || primaryVenue.location;
    
    this.division = division;
    this.conference = conference;
    this.travelConstraints = travelConstraints;
  }

  /**
   * Calculate distance to another team's location
   * @param {Team} other - The other team
   * @returns {number} Distance in miles
   */
  distanceTo(other) {
    return this.location.distanceTo(other.location);
  }

  /**
   * Get available venue for a specific date, prioritizing primary venue
   * @param {Date} date - Date to check
   * @returns {Venue|null} Available venue or null if none available
   */
  getVenueForDate(date) {
    if (this.primaryVenue.isAvailable(date)) {
      return this.primaryVenue;
    }
    
    for (const venue of this.secondaryVenues) {
      if (venue.isAvailable(date)) {
        return venue;
      }
    }
    
    return null;
  }

  /**
   * Create a Team from a database record
   * @param {Object} record - Database record
   * @returns {Team} Team instance
   */
  static fromDatabase(record) {
    const primaryVenue = record.primary_venue instanceof Venue 
      ? record.primary_venue 
      : Venue.fromDatabase(record.primary_venue);
    
    const secondaryVenues = record.secondary_venues 
      ? record.secondary_venues.map(v => v instanceof Venue ? v : Venue.fromDatabase(v))
      : [];
    
    const location = record.location 
      ? (record.location instanceof Location ? record.location : Location.fromDatabase(record.location))
      : null;
    
    return new Team(
      record.id,
      record.name,
      record.nickname,
      primaryVenue,
      secondaryVenues,
      location,
      record.division || "",
      record.conference || "Big 12",
      record.travel_constraints || {}
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
      nickname: this.nickname,
      primary_venue: this.primaryVenue.toDatabase(),
      secondary_venues: this.secondaryVenues.map(v => v.toDatabase()),
      location: this.location ? this.location.toDatabase() : null,
      division: this.division,
      conference: this.conference,
      travel_constraints: this.travelConstraints
    };
  }
}

module.exports = Team;
