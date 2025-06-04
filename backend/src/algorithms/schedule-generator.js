/**
 * FlexTime Scheduling System - Schedule Generator
 * 
 * Base class for schedule generation algorithms.
 */

const { v4: uuidv4 } = require('uuid');
const Schedule = require('../../../models/schedule');
const Team = require('../../../models/team');
const Game = require('../../../models/game');
const { Constraint } = require('../../../models/constraint');

class ScheduleGenerator {
  /**
   * Create a new ScheduleGenerator
   * @param {Array<Team>} teams - Teams to schedule
   * @param {Array<Constraint>} constraints - Scheduling constraints
   * @param {string} sport - Sport type
   * @param {string} season - Season identifier
   */
  constructor(teams, constraints, sport, season) {
    this.teams = teams;
    this.constraints = constraints;
    this.sport = sport;
    this.season = season;
    this.scheduleId = `${sport}_${season}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  }

  /**
   * Generate a schedule
   * @returns {Schedule} Generated schedule
   */
  generate() {
    // Base class doesn't implement generation logic
    // Subclasses should override this method
    throw new Error('Schedule generation not implemented');
  }
}

/**
 * Generator for round-robin schedules where each team plays every other team.
 */
class RoundRobinGenerator extends ScheduleGenerator {
  /**
   * Create a new RoundRobinGenerator
   * @param {Array<Team>} teams - Teams to schedule
   * @param {Array<Constraint>} constraints - Scheduling constraints
   * @param {string} sport - Sport type
   * @param {string} season - Season identifier
   * @param {boolean} homeAndAway - Whether each team plays once at home and once away
   */
  constructor(teams, constraints, sport, season, homeAndAway = true) {
    super(teams, constraints, sport, season);
    this.homeAndAway = homeAndAway;
  }

  /**
   * Generate a round-robin schedule
   * @returns {Schedule} Generated schedule
   */
  generate() {
    const schedule = new Schedule(
      this.scheduleId,
      this.sport,
      this.season,
      this.teams,
      [],
      this.constraints
    );
    
    // Create a list of all possible matchups
    const matchups = [];
    
    for (let i = 0; i < this.teams.length; i++) {
      for (let j = i + 1; j < this.teams.length; j++) {
        const team1 = this.teams[i];
        const team2 = this.teams[j];
        
        if (this.homeAndAway) {
          // Each team plays once at home and once away
          matchups.push([team1, team2]);
          matchups.push([team2, team1]);
        } else {
          // Teams play only once, randomly assign home/away
          if (Math.random() < 0.5) {
            matchups.push([team1, team2]);
          } else {
            matchups.push([team2, team1]);
          }
        }
      }
    }
    
    // Shuffle matchups for initial randomization
    this._shuffleArray(matchups);
    
    // Create games from matchups (without dates for now)
    const games = [];
    
    for (let i = 0; i < matchups.length; i++) {
      const [homeTeam, awayTeam] = matchups[i];
      const venue = homeTeam.primaryVenue;
      
      const game = new Game(
        `${this.scheduleId}_game_${i + 1}`,
        homeTeam,
        awayTeam,
        venue,
        new Date(), // Placeholder, will be assigned later
        this.sport
      );
      
      games.push(game);
    }
    
    // Add games to schedule
    for (const game of games) {
      schedule.addGame(game);
    }
    
    return schedule;
  }

  /**
   * Shuffle an array in-place using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @private
   */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

/**
 * Generator for partial round-robin schedules where teams play only a subset of opponents.
 */
class PartialRoundRobinGenerator extends ScheduleGenerator {
  /**
   * Create a new PartialRoundRobinGenerator
   * @param {Array<Team>} teams - Teams to schedule
   * @param {Array<Constraint>} constraints - Scheduling constraints
   * @param {string} sport - Sport type
   * @param {string} season - Season identifier
   * @param {number} gamesPerTeam - Number of games each team should play
   * @param {number} teamsPlayedTwice - Number of teams each team plays twice
   */
  constructor(teams, constraints, sport, season, gamesPerTeam, teamsPlayedTwice = 0) {
    super(teams, constraints, sport, season);
    this.gamesPerTeam = gamesPerTeam;
    this.teamsPlayedTwice = teamsPlayedTwice;
    
    // Validate parameters
    const totalGames = teams.length * gamesPerTeam;
    if (totalGames % 2 !== 0) {
      throw new Error("Total number of games must be even");
    }
    
    const maxPossibleGames = teams.length * (teams.length - 1);
    if (this.homeAndAway) {
      if (gamesPerTeam > 2 * (teams.length - 1)) {
        throw new Error("Games per team exceeds maximum possible in home-and-away format");
      }
    } else {
      if (gamesPerTeam > teams.length - 1) {
        throw new Error("Games per team exceeds maximum possible in single-game format");
      }
    }
  }

  /**
   * Determine if schedule uses home-and-away format based on games_per_team
   * @returns {boolean} True if home-and-away format
   */
  get homeAndAway() {
    // If each team plays more than (n-1) games, must be home-and-away format
    return this.gamesPerTeam > this.teams.length - 1;
  }

  /**
   * Generate a partial round-robin schedule
   * @returns {Schedule} Generated schedule
   */
  generate() {
    const schedule = new Schedule(
      this.scheduleId,
      this.sport,
      this.season,
      this.teams,
      [],
      this.constraints
    );
    
    // For each team, determine which opponents they will play
    const teamOpponents = new Map();
    
    for (const team of this.teams) {
      // Get all possible opponents
      const possibleOpponents = this.teams.filter(t => t.id !== team.id);
      
      // Shuffle to randomize
      this._shuffleArray(possibleOpponents);
      
      // Determine how many unique opponents
      let uniqueOpponents;
      if (this.homeAndAway) {
        // In home-and-away, each opponent counts for 2 games
        uniqueOpponents = Math.ceil(this.gamesPerTeam / 2);
      } else {
        uniqueOpponents = this.gamesPerTeam;
      }
      
      // Select opponents
      const selectedOpponents = possibleOpponents.slice(0, uniqueOpponents);
      
      // Store in map
      teamOpponents.set(team.id, selectedOpponents);
    }
    
    // Create games from the opponent selections
    const games = [];
    let gameId = 1;
    
    for (const homeTeam of this.teams) {
      const opponents = teamOpponents.get(homeTeam.id);
      
      for (const awayTeam of opponents) {
        // Create a home game
        const homeGame = new Game(
          `${this.scheduleId}_game_${gameId++}`,
          homeTeam,
          awayTeam,
          homeTeam.primaryVenue,
          new Date(), // Placeholder
          this.sport
        );
        
        games.push(homeGame);
        
        // If home-and-away, create away game too
        if (this.homeAndAway) {
          const awayGame = new Game(
            `${this.scheduleId}_game_${gameId++}`,
            awayTeam,
            homeTeam,
            awayTeam.primaryVenue,
            new Date(), // Placeholder
            this.sport
          );
          
          games.push(awayGame);
        }
      }
    }
    
    // Add games to schedule
    for (const game of games) {
      schedule.addGame(game);
    }
    
    return schedule;
  }

  /**
   * Shuffle an array in-place using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @private
   */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

module.exports = {
  ScheduleGenerator,
  RoundRobinGenerator,
  PartialRoundRobinGenerator
};
