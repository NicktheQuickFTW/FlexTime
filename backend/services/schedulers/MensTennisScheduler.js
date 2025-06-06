/**
 * Men's Tennis-Specific Scheduler
 * 
 * Implements scheduling logic specific to Big 12 Men's Tennis
 * Based on hybrid travel partner model with 9 teams
 */

const logger = require('../../lib/logger');
const campusConflicts = require('../../config/campus-conflicts-2025-26');

class MensTennisScheduler {
  constructor() {
    this.sportId = 17; // Men's Tennis sport ID
    this.sportName = 'Men\'s Tennis';
    
    // Men's Tennis-specific configuration
    this.config = {
      totalTeams: 9, // Only 9 teams sponsor men's tennis
      seasonLength: 7, // 7 weeks of conference play
      totalMatches: 8, // Each team plays 8 matches (all other teams once)
      matchesPerWeek: 'variable', // Teams can play multiple matches per week
      maxMatchesPerWeekend: 2, // Maximum 2 matches Thu-Sun
      roundRobinCoverage: 1.0, // 100% full round-robin with 9 teams
      homeAwayBalance: {
        // With 8 matches (even number), teams have perfect 4H/4A balance
        standard: { home: 4, away: 4 }
      },
      maxConsecutiveAway: 3,
      maxConsecutiveHome: 3,
      matchDays: ['Thu', 'Fri', 'Sat', 'Sun'], // Matches typically Thu-Sun
      defaultMatchDays: ['Fri', 'Sun'], // Current default (may change to Thu/Sat in 2026)
      byuUtahMatchDays: ['Thu', 'Sat'], // BYU/Utah preference
      splitWeekendDays: ['Thu', 'Sun'], // For split weekends (H&A same weekend)
      conferenceStartMonth: 2, // Late February
      conferenceEndMonth: 4, // Early April
      avoidDates: ['Easter Sunday'], // No matches on Easter
      
      // Team-specific constraints
      week1Conflicts: {
        2025: ['baylor', 'arizona-state'],
        2026: ['baylor', 'arizona-state'],
        2027: [] // Normal scheduling resumes
      },
      
      // Hybrid travel partner model
      travelPartners: {
        'arizona': 'arizona-state',
        'arizona-state': 'arizona',
        'byu': 'utah',
        'utah': 'byu',
        'baylor': 'tcu',
        'tcu': 'baylor',
        'oklahoma-state': 'texas-tech',
        'texas-tech': 'oklahoma-state',
        'ucf': null // UCF is a floater - no fixed partner
      },
      
      // Teams that participate in men's tennis
      participatingTeams: [
        'arizona', 'arizona-state', 'byu', 'utah', 
        'baylor', 'tcu', 'oklahoma-state', 'texas-tech', 'ucf'
      ]
    };
  }

  /**
   * Generate matchups for men's tennis season
   * @param {Array} teams - Array of team objects
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of matchups
   */
  async generateMatchups(teams, options = {}) {
    const { season = new Date().getFullYear() } = options;
    
    // Filter to only men's tennis teams
    const tennisTeams = teams.filter(team => 
      this.config.participatingTeams.includes(team.team_id)
    );
    
    logger.info(`Generating men's tennis matchups for ${tennisTeams.length} teams`);
    
    // Validate we have the right number of teams
    if (tennisTeams.length !== 9) {
      logger.warn(`Expected 9 teams for men's tennis, got ${tennisTeams.length}`);
    }
    
    // Full round-robin for 9 teams = 36 matches total
    const matchups = this.generateFullRoundRobin(tennisTeams, season);
    
    logger.info(`Generated ${matchups.length} men's tennis matches`);
    
    return matchups;
  }

  /**
   * Get travel partner for a team
   * @private
   */
  getTravelPartner(teamId) {
    return this.config.travelPartners[teamId];
  }

  /**
   * Check if team has a travel partner
   * @private
   */
  hasTravelPartner(teamId) {
    return this.config.travelPartners[teamId] !== null;
  }

  /**
   * Generate full round-robin schedule
   * @private
   */
  generateFullRoundRobin(teams, season) {
    const matchups = [];
    const homeGames = {};
    const awayGames = {};
    
    // Initialize counters
    teams.forEach(team => {
      homeGames[team.team_id] = 0;
      awayGames[team.team_id] = 0;
    });
    
    // Generate all matchups (full round-robin)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Determine home/away
        let homeTeam, awayTeam;
        
        // Special handling for travel partners
        const arePartners = this.getTravelPartner(team1.team_id) === team2.team_id;
        
        if (arePartners) {
          // Travel partners alternate home/away by year
          const useTeam1Home = season % 2 === 0;
          if (useTeam1Home) {
            homeTeam = team1;
            awayTeam = team2;
          } else {
            homeTeam = team2;
            awayTeam = team1;
          }
        } else {
          // For non-partners, balance home/away games
          const team1NeedsHome = homeGames[team1.team_id] < 4;
          const team2NeedsHome = homeGames[team2.team_id] < 4;
          const team1NeedsAway = awayGames[team1.team_id] < 4;
          const team2NeedsAway = awayGames[team2.team_id] < 4;
          
          if (team1NeedsHome && team2NeedsAway) {
            homeTeam = team1;
            awayTeam = team2;
          } else if (team2NeedsHome && team1NeedsAway) {
            homeTeam = team2;
            awayTeam = team1;
          } else {
            // Default assignment
            if (homeGames[team1.team_id] <= homeGames[team2.team_id]) {
              homeTeam = team1;
              awayTeam = team2;
            } else {
              homeTeam = team2;
              awayTeam = team1;
            }
          }
        }
        
        // Update counters
        homeGames[homeTeam.team_id]++;
        awayGames[awayTeam.team_id]++;
        
        matchups.push({
          home_team: homeTeam,
          away_team: awayTeam,
          sport_id: this.sportId,
          type: 'regular',
          isTravelPartnerMatch: arePartners
        });
      }
    }
    
    // Log final statistics
    logger.info(`Created full round-robin with ${matchups.length} matchups`);
    teams.forEach(team => {
      const h = homeGames[team.team_id];
      const a = awayGames[team.team_id];
      if (h !== 4 || a !== 4) {
        logger.warn(`${team.name}: ${h}H/${a}A (expected 4H/4A)`);
      }
    });
    
    return matchups;
  }

  /**
   * Get date preferences for men's tennis
   * @returns {Object} Date preferences
   */
  getDatePreferences() {
    return {
      seasonStart: 'late February',
      seasonEnd: 'early April',
      conferenceWeeks: 7,
      matchDays: this.config.matchDays,
      defaultMatchDays: this.config.defaultMatchDays,
      multipleMatchesPerWeek: true,
      maxMatchesPerWeekend: this.config.maxMatchesPerWeekend,
      preferredMatchTimes: ['14:00:00', '16:00:00', '18:00:00'], // Afternoon matches
      avoidDates: this.config.avoidDates,
      specialConsiderations: {
        'byu': { 
          avoidDays: ['Sun'], 
          preferredDays: ['Thu', 'Sat'] 
        },
        'utah': { 
          preferWeekendTravel: true,
          preferredDays: ['Thu', 'Sat']
        }
      },
      splitWeekendHandling: {
        preferredDays: this.config.splitWeekendDays,
        reason: 'Maximize recovery time between matches'
      }
    };
  }

  /**
   * Assign match days based on weekend type
   * @private
   */
  assignMatchDays(match, weekendType, season) {
    const isBYUUtah = [match.home_team.team_id, match.away_team.team_id].some(
      id => id === 'byu' || id === 'utah'
    );
    
    if (weekendType === 'split') {
      // Split weekend: use Thu/Sun
      match.preferredDays = this.config.splitWeekendDays;
    } else if (isBYUUtah) {
      // BYU/Utah: use Thu/Sat
      match.preferredDays = this.config.byuUtahMatchDays;
    } else if (season >= 2026 && this.config.defaultMatchDays[0] === 'Thu') {
      // If coaches push through Thu/Sat for everyone in 2026
      match.preferredDays = ['Thu', 'Sat'];
    } else {
      // Default: Fri/Sun
      match.preferredDays = this.config.defaultMatchDays;
    }
  }

  /**
   * Check if team has week 1 conflict
   * @private
   */
  hasWeek1Conflict(teamId, season) {
    const conflictTeams = this.config.week1Conflicts[season] || [];
    return conflictTeams.includes(teamId);
  }

  /**
   * Get men's tennis-specific constraints
   * @returns {Array} Constraints
   */
  getConstraints() {
    return [
      {
        type: 'total_matches',
        weight: 1.0,
        parameters: {
          matchesPerTeam: 8,
          enforcement: 'strict'
        }
      },
      {
        type: 'home_away_balance',
        weight: 1.0,
        parameters: {
          homeGames: 4,
          awayGames: 4,
          reason: 'Even number of games (8 total)'
        }
      },
      {
        type: 'max_matches_per_weekend',
        weight: 1.0,
        parameters: {
          maxMatches: 2,
          weekendDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          enforcement: 'strict'
        }
      },
      {
        type: 'travel_partners',
        weight: 0.9,
        parameters: {
          partners: this.config.travelPartners,
          hybridModel: true,
          floaterTeam: 'ucf'
        }
      },
      {
        type: 'max_consecutive_away',
        weight: 0.9,
        parameters: {
          maxConsecutive: 3,
          preferredMax: 2
        }
      },
      {
        type: 'max_consecutive_home',
        weight: 0.9,
        parameters: {
          maxConsecutive: 3,
          preferredMax: 2
        }
      },
      {
        type: 'full_round_robin',
        weight: 1.0,
        parameters: {
          teams: 9,
          totalMatchups: 36
        }
      },
      {
        type: 'byu_sunday_restriction',
        weight: 1.0,
        parameters: {
          team: 'byu',
          avoidDay: 'Sunday'
        }
      },
      {
        type: 'avoid_split_weekends',
        weight: 0.8,
        parameters: {
          description: 'Prefer HH or AA weekends for travel efficiency',
          unavoidableWith: '8 matches in 5 weeks',
          splitWeekendDays: ['Thu', 'Sun']
        }
      },
      {
        type: 'week1_conflicts',
        weight: 1.0,
        parameters: {
          conflictTeams: {
            2025: ['baylor', 'arizona-state'],
            2026: ['baylor', 'arizona-state'],
            2027: [] // Normal scheduling
          }
        }
      },
      {
        type: 'easter_sunday_avoidance',
        weight: 1.0,
        parameters: {
          avoidDate: 'Easter Sunday',
          enforcement: 'strict'
        }
      },
      {
        type: 'match_day_preferences',
        weight: 0.7,
        parameters: {
          default: ['Fri', 'Sun'],
          byuUtah: ['Thu', 'Sat'],
          potential2026Change: ['Thu', 'Sat'] // All teams if approved
        }
      },
      {
        type: 'avoid_gender_doubleheaders',
        weight: 0.7,
        parameters: {
          conflictSport: 'Women\'s Tennis',
          conflictSportId: 18,
          description: 'Minimize men\'s and women\'s tennis home matches on same weekend',
          scope: 'weekend' // Thu-Sun
        }
      }
    ];
  }

  /**
   * Validate men's tennis schedule
   * @param {Array} matches - Generated matches
   * @returns {Object} Validation result
   */
  validateSchedule(matches) {
    const issues = [];
    const teamStats = {};
    
    // Initialize and count matches per team
    matches.forEach(match => {
      if (!teamStats[match.home_team.team_id]) {
        teamStats[match.home_team.team_id] = { 
          home: 0, 
          away: 0, 
          total: 0,
          opponents: new Set()
        };
      }
      if (!teamStats[match.away_team.team_id]) {
        teamStats[match.away_team.team_id] = { 
          home: 0, 
          away: 0, 
          total: 0,
          opponents: new Set()
        };
      }
      
      teamStats[match.home_team.team_id].home++;
      teamStats[match.home_team.team_id].total++;
      teamStats[match.home_team.team_id].opponents.add(match.away_team.team_id);
      
      teamStats[match.away_team.team_id].away++;
      teamStats[match.away_team.team_id].total++;
      teamStats[match.away_team.team_id].opponents.add(match.home_team.team_id);
    });
    
    // Check each team
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      // Check total matches (should be 8)
      if (stats.total !== 8) {
        issues.push({
          type: 'match_count',
          team: teamId,
          message: `Team has ${stats.total} matches, expected 8`
        });
      }
      
      // Check home/away balance (should be 4/4)
      if (stats.home !== 4 || stats.away !== 4) {
        issues.push({
          type: 'home_away_imbalance',
          team: teamId,
          message: `Team has ${stats.home}H/${stats.away}A, expected 4H/4A`
        });
      }
      
      // Check if played all other teams (should be 8 opponents)
      if (stats.opponents.size !== 8) {
        issues.push({
          type: 'incomplete_round_robin',
          team: teamId,
          message: `Team played ${stats.opponents.size} opponents, expected 8`
        });
      }
    });
    
    // Check total number of matches
    if (matches.length !== 36) {
      issues.push({
        type: 'total_matches',
        message: `Schedule has ${matches.length} matches, expected 36 for full round-robin`
      });
    }
    
    // Validate weekend match limits
    this.validateWeekendMatchLimit(matches, issues);
    
    // Validate travel partner arrangements
    this.validateTravelPartners(matches, issues);
    
    return {
      valid: issues.length === 0,
      issues: issues,
      stats: teamStats
    };
  }

  /**
   * Validate weekend match limit (max 2 per weekend)
   * @private
   */
  validateWeekendMatchLimit(matches, issues) {
    // Group matches by team and week
    const teamWeekMatches = {};
    
    matches.forEach(match => {
      if (match.date) {
        const week = this.getWeekNumber(match.date);
        
        [match.home_team.team_id, match.away_team.team_id].forEach(teamId => {
          const key = `${teamId}-${week}`;
          if (!teamWeekMatches[key]) {
            teamWeekMatches[key] = 0;
          }
          teamWeekMatches[key]++;
        });
      }
    });
    
    // Check for violations
    Object.entries(teamWeekMatches).forEach(([key, count]) => {
      if (count > 2) {
        const [teamId, week] = key.split('-');
        issues.push({
          type: 'weekend_match_limit',
          team: teamId,
          message: `Team has ${count} matches in week ${week} (max allowed: 2)`
        });
      }
    });
  }

  /**
   * Validate travel partner arrangements
   * @private
   */
  validateTravelPartners(matches, issues) {
    // Check that travel partners play each other
    const partnerMatches = {};
    
    matches.forEach(match => {
      const team1 = match.home_team.team_id;
      const team2 = match.away_team.team_id;
      
      if (this.getTravelPartner(team1) === team2) {
        partnerMatches[`${team1}-${team2}`] = true;
      }
    });
    
    // Verify all partner pairs played
    const expectedPairs = [
      'arizona-arizona-state',
      'byu-utah',
      'baylor-tcu',
      'oklahoma-state-texas-tech'
    ];
    
    expectedPairs.forEach(pair => {
      const [team1, team2] = pair.split('-');
      const found = partnerMatches[`${team1}-${team2}`] || partnerMatches[`${team2}-${team1}`];
      if (!found) {
        issues.push({
          type: 'missing_partner_match',
          message: `Travel partners ${team1} and ${team2} did not play each other`
        });
      }
    });
  }

  /**
   * Get week number from date
   * @private
   */
  getWeekNumber(date) {
    const d = new Date(date);
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  }
}

module.exports = MensTennisScheduler;