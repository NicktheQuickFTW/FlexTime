/**
 * FlexTime Scheduling System - Game Model
 * 
 * Represents an individual game/match in a schedule.
 */

const Team = require('./team');
const Venue = require('./venue');
const { SportType } = require('./types');

class Game {
  /**
   * Create a new Game
   * @param {string} id - Unique identifier
   * @param {Team} homeTeam - Home team
   * @param {Team} awayTeam - Away team
   * @param {Venue} venue - Game venue
   * @param {Date} date - Game date and time
   * @param {string} sport - Sport type
   * @param {string} specialDesignation - Special game designation (e.g., "Championship", "Rivalry Week")
   * @param {string} tvNetwork - Broadcasting network
   */
  constructor(id, homeTeam, awayTeam, venue, date, sport, specialDesignation = "", tvNetwork = "") {
    this.id = id;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.venue = venue;
    this.date = date;
    this.sport = sport;
    this.specialDesignation = specialDesignation;
    this.tvNetwork = tvNetwork;
  }

  /**
   * Calculate one-way travel distance for away team
   * @returns {number} Distance in miles
   */
  get travelDistance() {
    return this.awayTeam.location.distanceTo(this.venue.location);
  }

  /**
   * Create a Game from a database record
   * @param {Object} record - Database record
   * @param {Map<string, Team>} teamMap - Map of team IDs to Team objects
   * @param {Map<string, Venue>} venueMap - Map of venue IDs to Venue objects
   * @returns {Game} Game instance
   */
  static fromDatabase(record, teamMap, venueMap) {
    const homeTeam = teamMap.get(record.home_team_id);
    const awayTeam = teamMap.get(record.away_team_id);
    const venue = venueMap.get(record.venue_id);
    
    if (!homeTeam || !awayTeam || !venue) {
      throw new Error(`Missing reference for game ${record.id}`);
    }
    
    return new Game(
      record.id,
      homeTeam,
      awayTeam,
      venue,
      new Date(record.date),
      record.sport,
      record.special_designation || "",
      record.tv_network || ""
    );
  }

  /**
   * Convert to a database-friendly object
   * @returns {Object} Database-friendly object
   */
  toDatabase() {
    return {
      id: this.id,
      home_team_id: this.homeTeam.id,
      away_team_id: this.awayTeam.id,
      venue_id: this.venue.id,
      date: this.date.toISOString(),
      sport: this.sport,
      special_designation: this.specialDesignation,
      tv_network: this.tvNetwork
    };
  }

  /**
   * Create a deep clone of this game
   * @returns {Game} Cloned game
   */
  clone() {
    return new Game(
      this.id,
      this.homeTeam,
      this.awayTeam,
      this.venue,
      new Date(this.date),
      this.sport,
      this.specialDesignation,
      this.tvNetwork
    );
  }
}

module.exports = Game;
