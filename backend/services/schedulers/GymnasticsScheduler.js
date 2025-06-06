/**
 * Gymnastics-Specific Scheduler
 * 
 * Implements scheduling logic specific to Big 12 Gymnastics
 * Based on analysis of 2025-2026 schedules
 */

const logger = require('../../lib/logger');

class GymnasticsScheduler {
  constructor() {
    this.sportId = 11;
    this.sportName = 'Gymnastics';
    
    // Gymnastics-specific configuration (updated for 2026+ format)
    this.config = {
      seasonLength: 7, // Fixed at 7 weeks (changed from 8 in 2025)
      gamesPerTeamPerWeek: 1, // Each team plays max 1 game per week
      byeWeeksPerTeam: 1, // Standardized to exactly 1 (changed from 2 in 2025)
      preferredDay: 5, // Friday (0=Sunday, 5=Friday)
      allowedDays: [5, 6, 0], // Friday, Saturday, Sunday
      homeAwayBalance: {
        // With 6 games per team (even number), balance is always 3/3
        standard: { home: 3, away: 3 }
      },
      formatHistory: {
        2025: { weeks: 8, byesPerTeam: 2 },
        2026: { weeks: 7, byesPerTeam: 1 } // Current format
      }
    };
  }

  /**
   * Generate matchups for gymnastics season
   * @param {Array} teams - Array of team objects
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of matchups
   */
  async generateMatchups(teams, options = {}) {
    const { season = new Date().getFullYear() } = options;
    
    // Adjust configuration for historical seasons if needed
    this.adjustConfigForSeason(season);
    
    logger.info(`Generating gymnastics matchups for ${teams.length} teams`);
    
    // Determine if this is an even or odd year for home/away patterns
    const isEvenYear = season % 2 === 0;
    
    // Assign home/away patterns to teams
    const teamPatterns = this.assignHomeAwayPatterns(teams, isEvenYear);
    
    // Generate full round-robin matchups (all 21 possible for 7 teams)
    const matchups = this.generateFullRoundRobin(teams, teamPatterns);
    
    // Add bye weeks
    const finalSchedule = this.addByeWeeks(matchups, teams.length);
    
    logger.info(`Generated ${matchups.length} gymnastics meets`);
    
    return matchups;
  }

  /**
   * Adjust configuration for different seasons
   * @private
   */
  adjustConfigForSeason(season) {
    if (season <= 2025) {
      // Use old format for 2025 and earlier
      this.config.seasonLength = 8;
      this.config.byeWeeksPerTeam = 2;
      logger.info(`Using 2025 format: 8 weeks, 2 byes per team`);
    } else {
      // Use new format for 2026 and later
      this.config.seasonLength = 7;
      this.config.byeWeeksPerTeam = 1;
      logger.info(`Using 2026+ format: 7 weeks, 1 bye per team`);
    }
  }

  /**
   * Assign home/away patterns based on year
   * @private
   */
  assignHomeAwayPatterns(teams, isEvenYear) {
    const patterns = {};
    
    teams.forEach((team) => {
      // With 6 games per team (even number), balance is always 3H/3A
      patterns[team.team_id] = this.config.homeAwayBalance.standard;
      logger.debug(`${team.name}: 3H/3A (even game count)`);
    });
    
    return patterns;
  }

  /**
   * Generate full round-robin schedule
   * @private
   */
  generateFullRoundRobin(teams, teamPatterns) {
    const matchups = [];
    const homeGames = {};
    const awayGames = {};
    const consecutiveAway = {}; // Track consecutive away games
    
    // Initialize counters
    teams.forEach(team => {
      homeGames[team.team_id] = 0;
      awayGames[team.team_id] = 0;
      consecutiveAway[team.team_id] = 0;
    });
    
    // Generate all possible matchups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Determine home/away based on patterns and current counts
        let homeTeam, awayTeam;
        
        const team1NeedsHome = homeGames[team1.team_id] < teamPatterns[team1.team_id].home;
        const team2NeedsHome = homeGames[team2.team_id] < teamPatterns[team2.team_id].home;
        const team1NeedsAway = awayGames[team1.team_id] < teamPatterns[team1.team_id].away;
        const team2NeedsAway = awayGames[team2.team_id] < teamPatterns[team2.team_id].away;
        
        // Consider consecutive away games constraint (max 2)
        const team1CanGoAway = consecutiveAway[team1.team_id] < 2;
        const team2CanGoAway = consecutiveAway[team2.team_id] < 2;
        
        if (team1NeedsHome && team2NeedsAway && team2CanGoAway) {
          homeTeam = team1;
          awayTeam = team2;
        } else if (team2NeedsHome && team1NeedsAway && team1CanGoAway) {
          homeTeam = team2;
          awayTeam = team1;
        } else if (team1CanGoAway && !team2CanGoAway) {
          // team2 needs a home game to break consecutive away streak
          homeTeam = team2;
          awayTeam = team1;
        } else if (team2CanGoAway && !team1CanGoAway) {
          // team1 needs a home game to break consecutive away streak
          homeTeam = team1;
          awayTeam = team2;
        } else {
          // Default assignment considering home game needs
          if (homeGames[team1.team_id] <= homeGames[team2.team_id]) {
            homeTeam = team1;
            awayTeam = team2;
          } else {
            homeTeam = team2;
            awayTeam = team1;
          }
        }
        
        // Update counters
        homeGames[homeTeam.team_id]++;
        awayGames[awayTeam.team_id]++;
        
        matchups.push({
          home_team: homeTeam,
          away_team: awayTeam,
          sport_id: this.sportId,
          type: 'regular'
        });
      }
    }
    
    // Full round-robin - keep all matchups
    logger.info(`Created full round-robin with ${matchups.length} matchups`);
    
    return matchups;
  }

  /**
   * Add bye weeks to schedule
   * @private
   */
  addByeWeeks(matchups, teamCount) {
    // Gymnastics bye weeks are handled during date assignment
    // Each team plays max 1 game per week
    // Math: 7 teams × 6 games each = 42 team-meets = 21 unique matchups
    // Over 7 weeks: Each team plays 6 weeks, has 1 bye week
    // Teams are distributed across weeks to ensure no team plays twice in one week
    return matchups;
  }

  /**
   * Get date preferences for gymnastics
   * @returns {Object} Date preferences
   */
  getDatePreferences() {
    return {
      daysOfWeek: this.config.allowedDays,
      preferredStartTimes: ['19:00:00', '18:00:00', '17:00:00'], // Evening meets
      avoidDates: [], // Could add holidays, championships, etc.
      weeklySchedule: true, // Schedule one week at a time
      byeWeekDistribution: 'spread' // Spread bye weeks throughout season
    };
  }

  /**
   * Get gymnastics-specific constraints
   * @returns {Array} Constraints
   */
  getConstraints() {
    return [
      {
        type: 'home_away_balance',
        weight: 1.0,
        parameters: {
          homeGames: 3,
          awayGames: 3,
          reason: 'Even number of games (6 total)'
        }
      },
      {
        type: 'bye_weeks',
        weight: 0.9,
        parameters: {
          exactCount: this.config.byeWeeksPerTeam,
          distribution: 'one_per_week'
        }
      },
      {
        type: 'max_games_per_team_per_week',
        weight: 1.0,
        parameters: {
          maxGames: this.config.gamesPerTeamPerWeek,
          enforcement: 'strict'
        }
      },
      {
        type: 'max_consecutive_away',
        weight: 1.0,
        parameters: {
          maxConsecutive: 2,
          enforcement: 'strict'
        }
      },
      {
        type: 'weekly_schedule',
        weight: 0.8,
        parameters: {
          preferredDay: 'Friday',
          seasonLength: this.config.seasonLength
        }
      },
      {
        type: 'affiliate_integration',
        weight: 1.0,
        parameters: {
          affiliateTeams: ['Denver'],
          treatAsFullMember: true
        }
      }
    ];
  }

  /**
   * Validate gymnastics schedule
   * @param {Array} games - Generated games
   * @returns {Object} Validation result
   */
  validateSchedule(games) {
    const issues = [];
    const teamStats = {};
    
    // Count games per team
    games.forEach(game => {
      if (!teamStats[game.home_team.team_id]) {
        teamStats[game.home_team.team_id] = { home: 0, away: 0, total: 0 };
      }
      if (!teamStats[game.away_team.team_id]) {
        teamStats[game.away_team.team_id] = { home: 0, away: 0, total: 0 };
      }
      
      teamStats[game.home_team.team_id].home++;
      teamStats[game.home_team.team_id].total++;
      teamStats[game.away_team.team_id].away++;
      teamStats[game.away_team.team_id].total++;
    });
    
    // Check each team
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      // Check total meets (should be 6)
      if (stats.total !== 6) {
        issues.push({
          type: 'meets_count',
          team: teamId,
          message: `Team has ${stats.total} meets, expected 6`
        });
      }
      
      // Check home/away balance (should be 3/3)
      if (stats.home !== 3 || stats.away !== 3) {
        issues.push({
          type: 'home_away_imbalance',
          team: teamId,
          message: `Team has ${stats.home}H/${stats.away}A, expected 3H/3A`
        });
      }
    });
    
    // Check consecutive away games constraint
    this.validateConsecutiveAwayGames(games, issues);
    
    return {
      valid: issues.length === 0,
      issues: issues,
      stats: teamStats
    };
  }

  /**
   * Validate consecutive away games constraint
   * @private
   */
  validateConsecutiveAwayGames(games, issues) {
    // Group games by team and sort by date/week
    const teamGames = {};
    
    games.forEach(game => {
      if (!teamGames[game.home_team.team_id]) {
        teamGames[game.home_team.team_id] = [];
      }
      if (!teamGames[game.away_team.team_id]) {
        teamGames[game.away_team.team_id] = [];
      }
      
      teamGames[game.home_team.team_id].push({
        ...game,
        isHome: true,
        opponent: game.away_team.team_id
      });
      
      teamGames[game.away_team.team_id].push({
        ...game,
        isHome: false,
        opponent: game.home_team.team_id
      });
    });
    
    // Check each team for consecutive away games
    Object.entries(teamGames).forEach(([teamId, games]) => {
      // Sort by date/week (assuming games have date or week property)
      games.sort((a, b) => {
        if (a.date && b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        if (a.week && b.week) {
          return a.week - b.week;
        }
        return 0;
      });
      
      let consecutiveAway = 0;
      let maxConsecutiveAway = 0;
      
      games.forEach(game => {
        if (!game.isHome) {
          consecutiveAway++;
          maxConsecutiveAway = Math.max(maxConsecutiveAway, consecutiveAway);
        } else {
          consecutiveAway = 0;
        }
      });
      
      if (maxConsecutiveAway > 2) {
        issues.push({
          type: 'consecutive_away_violation',
          team: teamId,
          message: `Team has ${maxConsecutiveAway} consecutive away games (max allowed: 2)`
        });
      }
    });
  }
}

module.exports = GymnasticsScheduler;