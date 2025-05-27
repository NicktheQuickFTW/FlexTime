/**
 * FlexTime Scheduling System - Schedule Model
 * 
 * Represents a complete schedule for a sport and season.
 * Contains games, teams, and constraints.
 */

const Team = require('./team');
const Game = require('./game');
const { Constraint } = require('./constraint');
const { SportType } = require('./types');

class Schedule {
  /**
   * Create a new Schedule
   * @param {string} id - Unique identifier
   * @param {string} sport - Sport type
   * @param {string} season - Season identifier (e.g., "2024-2025")
   * @param {Array<Team>} teams - Teams in the schedule
   * @param {Array<Game>} games - Games in the schedule
   * @param {Array<Constraint>} constraints - Scheduling constraints
   */
  constructor(id, sport, season, teams, games = [], constraints = []) {
    this.id = id;
    this.sport = sport;
    this.season = season;
    this.teams = teams;
    this.games = games;
    this.constraints = constraints;
    
    // Cache for performance
    this._totalDistance = null;
    this._constraintViolations = null;
  }

  /**
   * Add a game to the schedule and invalidate cached metrics
   * @param {Game} game - Game to add
   */
  addGame(game) {
    this.games.push(game);
    // Invalidate caches
    this._totalDistance = null;
    this._constraintViolations = null;
  }

  /**
   * Remove a game from the schedule and invalidate cached metrics
   * @param {string} gameId - ID of game to remove
   */
  removeGame(gameId) {
    this.games = this.games.filter(g => g.id !== gameId);
    // Invalidate caches
    this._totalDistance = null;
    this._constraintViolations = null;
  }

  /**
   * Get all games for a specific team
   * @param {Team} team - The team
   * @returns {Array<Game>} Games for the team
   */
  getTeamGames(team) {
    return this.games.filter(g => g.homeTeam.id === team.id || g.awayTeam.id === team.id);
  }

  /**
   * Get home games for a specific team
   * @param {Team} team - The team
   * @returns {Array<Game>} Home games for the team
   */
  getTeamHomeGames(team) {
    return this.games.filter(g => g.homeTeam.id === team.id);
  }

  /**
   * Get away games for a specific team
   * @param {Team} team - The team
   * @returns {Array<Game>} Away games for the team
   */
  getTeamAwayGames(team) {
    return this.games.filter(g => g.awayTeam.id === team.id);
  }

  /**
   * Get all games scheduled for a specific date
   * @param {Date} date - The date
   * @returns {Array<Game>} Games on the date
   */
  getGamesOnDate(date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return this.games.filter(g => {
      const gameDate = new Date(g.date);
      gameDate.setHours(0, 0, 0, 0);
      return gameDate.getTime() === targetDate.getTime();
    });
  }

  /**
   * Get all games at a specific venue
   * @param {Venue} venue - The venue
   * @returns {Array<Game>} Games at the venue
   */
  getVenueGames(venue) {
    return this.games.filter(g => g.venue.id === venue.id);
  }

  /**
   * Calculate total travel distance for all teams
   * @returns {number} Total travel distance in miles
   */
  get totalTravelDistance() {
    if (this._totalDistance === null) {
      this._totalDistance = this.games.reduce((sum, game) => sum + game.travelDistance, 0);
    }
    return this._totalDistance;
  }

  /**
   * Evaluate all constraints against the schedule
   * @returns {Object} Map of constraint_id -> [satisfied, penalty] tuples
   */
  evaluateConstraints() {
    if (this._constraintViolations === null) {
      this._constraintViolations = {};
      
      for (const constraint of this.constraints) {
        try {
          const [satisfied, penalty] = constraint.evaluate(this);
          this._constraintViolations[constraint.id] = [satisfied, penalty];
        } catch (error) {
          console.warn(`Failed to evaluate constraint ${constraint.id}: ${error.message}`);
        }
      }
    }
    
    return this._constraintViolations;
  }

  /**
   * Check if schedule satisfies all hard constraints
   * @returns {boolean} True if all hard constraints are satisfied
   */
  get isValid() {
    const violations = this.evaluateConstraints();
    
    for (const constraintId in violations) {
      const constraint = this.constraints.find(c => c.id === constraintId);
      if (constraint && constraint.type === 'Hard' && !violations[constraintId][0]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate total penalty score for soft constraint violations
   * @returns {number} Total penalty score
   */
  get penaltyScore() {
    const violations = this.evaluateConstraints();
    let totalPenalty = 0;
    
    for (const constraintId in violations) {
      const constraint = this.constraints.find(c => c.id === constraintId);
      if (constraint && constraint.type === 'Soft') {
        const [_, penalty] = violations[constraintId];
        totalPenalty += penalty * constraint.weight;
      }
    }
    
    return totalPenalty;
  }

  /**
   * Calculate total travel distance for a specific team
   * @param {Team} team - The team
   * @returns {number} Travel distance in miles
   */
  getTeamTravelDistance(team) {
    return this.games
      .filter(game => game.awayTeam.id === team.id)
      .reduce((sum, game) => sum + game.travelDistance, 0);
  }

  /**
   * Get sequences of consecutive away games for a team
   * @param {Team} team - The team
   * @returns {Array<Array<Game>>} Sequences of consecutive away games
   */
  getConsecutiveAwayGames(team) {
    const awayGames = this.getTeamAwayGames(team);
    
    // Sort games by date
    awayGames.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const result = [];
    let currentSequence = [];
    
    for (const game of awayGames) {
      if (currentSequence.length === 0) {
        currentSequence.push(game);
      } else {
        // Check if this game is consecutive with the last one
        // (allowing for reasonable travel time)
        const lastGame = currentSequence[currentSequence.length - 1];
        const daysBetween = (game.date.getTime() - lastGame.date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysBetween <= 3) { // Adjust threshold as needed
          currentSequence.push(game);
        } else {
          if (currentSequence.length > 1) {
            result.push([...currentSequence]);
          }
          currentSequence = [game];
        }
      }
    }
    
    if (currentSequence.length > 1) {
      result.push([...currentSequence]);
    }
    
    return result;
  }

  /**
   * Create a Schedule from a database record
   * @param {Object} record - Database record
   * @param {Array<Team>} teams - Teams
   * @param {Array<Game>} games - Games
   * @param {Array<Constraint>} constraints - Constraints
   * @returns {Schedule} Schedule instance
   */
  static fromDatabase(record, teams, games, constraints) {
    return new Schedule(
      record.id,
      record.sport,
      record.season,
      teams,
      games,
      constraints
    );
  }

  /**
   * Convert to a database-friendly object
   * @returns {Object} Database-friendly object
   */
  toDatabase() {
    return {
      id: this.id,
      sport: this.sport,
      season: this.season,
      team_ids: this.teams.map(t => t.id),
      game_ids: this.games.map(g => g.id),
      constraint_ids: this.constraints.map(c => c.id)
    };
  }

  /**
   * Create a deep clone of this schedule
   * @returns {Schedule} Cloned schedule
   */
  clone() {
    const clonedGames = this.games.map(game => game.clone());
    
    return new Schedule(
      this.id,
      this.sport,
      this.season,
      [...this.teams],
      clonedGames,
      [...this.constraints]
    );
  }
}

module.exports = Schedule;
