/**
 * SportScheduler Base Class
 * 
 * Abstract base class for all sport-specific schedulers.
 * Provides common interface and shared functionality.
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger.js');

class SportScheduler {
  constructor(config = {}) {
    this.sportId = config.sportId;
    this.sportName = config.sportName;
    this.sportConfig = config.sportConfig || {};
    this.constraints = config.constraints || [];
    
    // Common configuration
    this.config = {
      homeAwayBalance: true,
      respectBlackoutDates: true,
      minimumRestDays: 1,
      ...config
    };
    
    logger.info(`Initialized ${this.constructor.name} for sport ${this.sportId}`);
  }

  /**
   * Generate matchups for the season
   * Must be implemented by subclasses
   * 
   * @param {Array} teams - Array of team objects
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Array>} Array of matchup objects
   */
  async generateMatchups(teams, parameters) {
    throw new Error(`${this.constructor.name} must implement generateMatchups()`);
  }

  /**
   * Get date preferences for this sport
   * Can be overridden by subclasses
   * 
   * @returns {Object} Date preferences configuration
   */
  getDatePreferences() {
    return {
      daysOfWeek: this.sportConfig.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      preferredStartTimes: this.sportConfig.preferredTimes || ['19:00'],
      avoidDates: [],
      preferWeekends: false
    };
  }

  /**
   * Get default constraints for this sport
   * Should be overridden by subclasses
   * 
   * @returns {Array} Array of constraint objects
   */
  getDefaultConstraints() {
    return [
      {
        type: 'MIN_REST_DAYS',
        value: this.config.minimumRestDays,
        weight: 1.0
      },
      {
        type: 'HOME_AWAY_BALANCE',
        weight: 0.8
      }
    ];
  }

  /**
   * Validate generated schedule
   * Can be extended by subclasses
   * 
   * @param {Array} games - Array of scheduled games
   * @returns {Object} Validation result
   */
  validateSchedule(games) {
    const violations = [];
    const warnings = [];
    
    // Basic validation that all subclasses should pass
    if (!games || games.length === 0) {
      violations.push({
        type: 'NO_GAMES',
        message: 'Schedule contains no games'
      });
    }
    
    // Check for duplicate games
    const gameKeys = new Set();
    games.forEach(game => {
      const key = `${game.home_team_id}-${game.away_team_id}-${game.date}`;
      if (gameKeys.has(key)) {
        violations.push({
          type: 'DUPLICATE_GAME',
          message: `Duplicate game found: ${key}`
        });
      }
      gameKeys.add(key);
    });
    
    return {
      valid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Helper: Generate round-robin matchups
   * Available to all subclasses
   * 
   * @protected
   * @param {Array} teams - Array of teams
   * @param {boolean} doubleRoundRobin - If true, generate home and away for each pair
   * @returns {Array} Array of matchups
   */
  generateRoundRobinMatchups(teams, doubleRoundRobin = true) {
    const matchups = [];
    const n = teams.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // First game
        matchups.push({
          game_id: uuidv4(),
          home_team: teams[i],
          away_team: teams[j],
          home_team_id: teams[i].team_id,
          away_team_id: teams[j].team_id,
          round: 1
        });
        
        // Return game if double round-robin
        if (doubleRoundRobin) {
          matchups.push({
            game_id: uuidv4(),
            home_team: teams[j],
            away_team: teams[i],
            home_team_id: teams[j].team_id,
            away_team_id: teams[i].team_id,
            round: 2
          });
        }
      }
    }
    
    return matchups;
  }

  /**
   * Helper: Balance home and away games
   * Available to all subclasses
   * 
   * @protected
   * @param {Array} matchups - Array of matchups
   * @param {Array} teams - Array of teams
   * @returns {Array} Balanced matchups
   */
  balanceHomeAway(matchups, teams) {
    const teamStats = {};
    
    // Initialize counters
    teams.forEach(team => {
      teamStats[team.team_id] = { home: 0, away: 0, total: 0 };
    });
    
    // Count current distribution
    matchups.forEach(game => {
      teamStats[game.home_team_id].home++;
      teamStats[game.home_team_id].total++;
      teamStats[game.away_team_id].away++;
      teamStats[game.away_team_id].total++;
    });
    
    // Log imbalances
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      const diff = Math.abs(stats.home - stats.away);
      if (diff > 1) {
        logger.info(`Team ${teamId} has home/away imbalance: ${stats.home}H/${stats.away}A`);
      }
    });
    
    return matchups;
  }

  /**
   * Helper: Shuffle array
   * Fisher-Yates shuffle algorithm
   * 
   * @protected
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get scheduling metadata
   * 
   * @returns {Object} Metadata about the scheduler
   */
  getMetadata() {
    return {
      scheduler: this.constructor.name,
      sportId: this.sportId,
      sportName: this.sportName,
      version: '1.0',
      capabilities: {
        roundRobin: true,
        partialSchedule: true,
        seriesScheduling: false,
        neutralSiteGames: false
      }
    };
  }
}

module.exports = SportScheduler;