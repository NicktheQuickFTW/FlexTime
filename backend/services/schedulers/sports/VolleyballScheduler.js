/**
 * Volleyball Scheduler
 * 
 * Handles Big 12 Volleyball scheduling with specific requirements:
 * - 18 conference matches over 9 weeks
 * - 16 teams total (updated for 2025)
 * - Play 4 teams twice, 10 teams once (14 total opponents)
 * - No series matches (all single matches)
 * - 4 non-conference weekends
 * - Must avoid conflicts with home football games
 * - Scheduled after football schedule is completed
 * - Conference season ends on Saturday, November 22 (2025)
 */

const SportScheduler = require('../base/SportScheduler');
const logger = require('../../../src/lib/logger');
const { v4: uuidv4 } = require('uuid');

class VolleyballScheduler extends SportScheduler {
  constructor(config) {
    super({
      ...config,
      sportId: 19, // Volleyball sport ID
      sportName: 'Volleyball',
      sportConfig: {
        pattern: 'mixed', // Some teams play twice, others once
        matchesPerTeam: 18,
        weeksInSeason: 9,
        windowsPerWeek: 2,
        seasonStart: '2025-09-20', // Approximate start for 9-week season ending Nov 22
        seasonEnd: '2025-11-22',   // Saturday, November 22, 2025
        daysOfWeek: [2, 3, 5, 6], // Tuesday, Wednesday, Friday, Saturday
        preferredTimes: ['19:00', '14:00'], // 7pm for weekdays, 2pm for weekends
        description: 'Big 12 Volleyball - 18 matches over 9 weeks'
      }
    });
    
    this.totalTeams = 16; // Updated for 2025
    this.matchesPerTeam = 18;
    this.teamsToPlayTwice = 4;
    this.teamsToPlayOnce = 10; // Out of 14 possible opponents (miss 1)
    this.windowsPerWeek = 2;
    
    // Days to prefer based on avoiding football conflicts
    this.preferredMatchDays = {
      weekday: [2, 3, 4], // Tuesday, Wednesday, Thursday
      weekend: [5, 6]     // Friday, Saturday (but check football conflicts)
    };
  }

  /**
   * Generate volleyball matchups with mixed frequency
   * Each team plays 4 opponents twice and 10 opponents once
   */
  async generateMatchups(teams, parameters) {
    logger.info(`Generating volleyball matchups for ${teams.length} teams`);
    
    if (teams.length !== 16) {
      logger.warn(`Expected 16 teams but found ${teams.length}`);
    }
    
    const matchups = [];
    const teamPairings = this.generateTeamPairings(teams);
    
    // Create all matchups based on pairings
    teams.forEach(team => {
      const pairings = teamPairings[team.team_id];
      
      // Generate matches for teams to play twice
      pairings.playTwice.forEach(opponentId => {
        const opponent = teams.find(t => t.team_id === opponentId);
        
        // First match
        matchups.push({
          game_id: uuidv4(),
          home_team_id: team.team_id,
          away_team_id: opponent.team_id,
          home_team: team,
          away_team: opponent,
          is_conference: true,
          is_rematch: false,
          round: 1,
          week: null
        });
        
        // Return match
        matchups.push({
          game_id: uuidv4(),
          home_team_id: opponent.team_id,
          away_team_id: team.team_id,
          home_team: opponent,
          away_team: team,
          is_conference: true,
          is_rematch: true,
          round: 2,
          week: null
        });
      });
      
      // Generate matches for teams to play once
      pairings.playOnce.forEach(opponentId => {
        const opponent = teams.find(t => t.team_id === opponentId);
        
        // Only create one match per pair (avoid duplicates)
        if (team.team_id < opponent.team_id) {
          const homeTeam = this.determineHomeTeam(team, opponent);
          const awayTeam = homeTeam.team_id === team.team_id ? opponent : team;
          
          matchups.push({
            game_id: uuidv4(),
            home_team_id: homeTeam.team_id,
            away_team_id: awayTeam.team_id,
            home_team: homeTeam,
            away_team: awayTeam,
            is_conference: true,
            is_rematch: false,
            round: 1,
            week: null
          });
        }
      });
    });
    
    // Remove duplicate matches
    const uniqueMatchups = this.removeDuplicateMatches(matchups);
    
    // Distribute matches across weeks (2 per week)
    const weeklyMatchups = this.distributeMatchesAcrossWeeks(uniqueMatchups, teams);
    
    // Assign specific dates and times
    const scheduledMatchups = await this.assignDatesAndTimes(weeklyMatchups, parameters);
    
    logger.info(`Generated ${scheduledMatchups.length} volleyball matches`);
    return scheduledMatchups;
  }

  /**
   * Generate team pairings determining who plays whom and how many times
   */
  generateTeamPairings(teams) {
    const pairings = {};
    
    // Initialize pairings for each team
    teams.forEach(team => {
      pairings[team.team_id] = {
        playTwice: [],
        playOnce: []
      };
    });
    
    // For each team, select opponents
    teams.forEach((team, index) => {
      const otherTeams = teams.filter(t => t.team_id !== team.team_id);
      
      // Select teams to play twice (could be based on geography, rivalry, or rotation)
      const twiceOpponents = this.selectTeamsToPlayTwice(team, otherTeams, pairings);
      pairings[team.team_id].playTwice = twiceOpponents;
      
      // Mark reciprocal relationships
      twiceOpponents.forEach(opponentId => {
        if (!pairings[opponentId].playTwice.includes(team.team_id)) {
          pairings[opponentId].playTwice.push(team.team_id);
        }
      });
      
      // Remaining teams play once
      const onceOpponents = otherTeams
        .filter(t => !twiceOpponents.includes(t.team_id))
        .map(t => t.team_id);
      pairings[team.team_id].playOnce = onceOpponents;
    });
    
    // Validate pairings
    this.validatePairings(pairings, teams);
    
    return pairings;
  }

  /**
   * Select which teams to play twice
   * This could be based on various factors like geography, historical rivalry, or rotation
   */
  selectTeamsToPlayTwice(team, otherTeams, existingPairings) {
    const selected = [];
    
    // Strategy 1: Geographic proximity (simplified)
    // In a real implementation, this would use actual geographic data
    const geographicGroups = {
      texas: ['Baylor', 'Houston', 'TCU', 'Texas Tech'],
      midwest: ['Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State'],
      mountain: ['BYU', 'Colorado', 'Utah'],
      east: ['Cincinnati', 'West Virginia', 'UCF'],
      west: ['Arizona', 'Arizona State']
    };
    
    // Find team's region
    let teamRegion = null;
    Object.entries(geographicGroups).forEach(([region, schools]) => {
      if (schools.some(school => team.school_name?.includes(school))) {
        teamRegion = region;
      }
    });
    
    // Prioritize teams from same region
    const regionalOpponents = otherTeams.filter(opponent => {
      return Object.entries(geographicGroups).some(([region, schools]) => {
        return region === teamRegion && 
               schools.some(school => opponent.school_name?.includes(school));
      });
    });
    
    // Select up to 4 teams, starting with regional opponents
    regionalOpponents.forEach(opponent => {
      if (selected.length < this.teamsToPlayTwice && 
          !selected.includes(opponent.team_id)) {
        // Check if this pairing doesn't exceed the opponent's limit
        const opponentPairings = existingPairings[opponent.team_id];
        if (!opponentPairings || opponentPairings.playTwice.length < this.teamsToPlayTwice) {
          selected.push(opponent.team_id);
        }
      }
    });
    
    // Fill remaining slots with other teams
    if (selected.length < this.teamsToPlayTwice) {
      const remaining = otherTeams
        .filter(t => !selected.includes(t.team_id))
        .sort(() => Math.random() - 0.5); // Random selection for now
      
      remaining.forEach(opponent => {
        if (selected.length < this.teamsToPlayTwice) {
          const opponentPairings = existingPairings[opponent.team_id];
          if (!opponentPairings || opponentPairings.playTwice.length < this.teamsToPlayTwice) {
            selected.push(opponent.team_id);
          }
        }
      });
    }
    
    return selected.slice(0, this.teamsToPlayTwice);
  }

  /**
   * Validate that pairings are correct
   */
  validatePairings(pairings, teams) {
    let valid = true;
    
    Object.entries(pairings).forEach(([teamId, pairing]) => {
      const totalGames = pairing.playTwice.length * 2 + pairing.playOnce.length;
      if (totalGames !== this.matchesPerTeam) {
        logger.error(`Team ${teamId} has ${totalGames} games, expected ${this.matchesPerTeam}`);
        valid = false;
      }
    });
    
    return valid;
  }

  /**
   * Remove duplicate matches from the matchup list
   */
  removeDuplicateMatches(matchups) {
    const seen = new Set();
    const unique = [];
    
    matchups.forEach(match => {
      const key1 = `${match.home_team_id}-${match.away_team_id}`;
      const key2 = `${match.away_team_id}-${match.home_team_id}`;
      
      if (!seen.has(key1) && !seen.has(key2)) {
        unique.push(match);
        seen.add(key1);
      } else if (match.is_rematch) {
        // Keep rematches but ensure they're marked correctly
        unique.push(match);
      }
    });
    
    return unique;
  }

  /**
   * Distribute matches across 9 weeks with 2 matches per week
   */
  distributeMatchesAcrossWeeks(matchups, teams) {
    const weeklyMatches = Array(9).fill(null).map(() => []);
    const teamWeekLoads = {};
    
    // Initialize team tracking
    teams.forEach(team => {
      teamWeekLoads[team.team_id] = Array(9).fill(0);
    });
    
    // Sort matchups to prioritize distribution
    // Prioritize rematches to be in different halves of the season
    const firstHalfMatches = matchups.filter(m => !m.is_rematch);
    const secondHalfMatches = matchups.filter(m => m.is_rematch);
    
    // Distribute first half matches
    this.distributeMatchesHelper(firstHalfMatches, weeklyMatches, teamWeekLoads, 0, 3);
    
    // Distribute second half matches
    this.distributeMatchesHelper(secondHalfMatches, weeklyMatches, teamWeekLoads, 4, 8);
    
    // Distribute any remaining matches
    const assigned = weeklyMatches.flat();
    const unassigned = matchups.filter(m => !assigned.includes(m));
    this.distributeMatchesHelper(unassigned, weeklyMatches, teamWeekLoads, 0, 8);
    
    return weeklyMatches;
  }

  /**
   * Helper to distribute matches across specified week range
   */
  distributeMatchesHelper(matches, weeklyMatches, teamWeekLoads, startWeek, endWeek) {
    matches.forEach(match => {
      let bestWeek = -1;
      let bestScore = -Infinity;
      
      for (let week = startWeek; week <= endWeek; week++) {
        // Check if both teams can play this week (max 2 matches per week)
        const homeLoad = teamWeekLoads[match.home_team_id][week];
        const awayLoad = teamWeekLoads[match.away_team_id][week];
        
        if (homeLoad < this.windowsPerWeek && awayLoad < this.windowsPerWeek) {
          // Score this week assignment
          let score = 0;
          
          // Prefer weeks with fewer matches
          score -= weeklyMatches[week].length * 2;
          
          // Balance team schedules
          const homeTotal = teamWeekLoads[match.home_team_id].reduce((a, b) => a + b, 0);
          const awayTotal = teamWeekLoads[match.away_team_id].reduce((a, b) => a + b, 0);
          score -= Math.abs(homeTotal - awayTotal);
          
          // Spread matches evenly
          score -= Math.abs(week - 4) * 0.5; // Slight preference for middle weeks
          
          if (score > bestScore) {
            bestScore = score;
            bestWeek = week;
          }
        }
      }
      
      if (bestWeek >= 0) {
        match.week = bestWeek + 1; // 1-indexed
        weeklyMatches[bestWeek].push(match);
        teamWeekLoads[match.home_team_id][bestWeek]++;
        teamWeekLoads[match.away_team_id][bestWeek]++;
      } else {
        logger.warn(`Could not assign week for match ${match.game_id}`);
      }
    });
  }

  /**
   * Assign specific dates and times, avoiding football conflicts
   */
  async assignDatesAndTimes(weeklyMatches, parameters) {
    const scheduledMatches = [];
    const startDate = new Date(this.sportConfig.seasonStart);
    
    // Load football schedule if available
    const footballConflicts = parameters.footballSchedule || [];
    
    weeklyMatches.forEach((weekMatches, weekIndex) => {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (weekIndex * 7));
      
      // Determine available days for this week
      const availableDays = this.getAvailableDays(weekStartDate, footballConflicts);
      
      // Schedule matches across available days
      const matchesPerDay = Math.ceil(weekMatches.length / availableDays.length);
      let dayIndex = 0;
      
      weekMatches.forEach((match, matchIndex) => {
        if (matchIndex > 0 && matchIndex % matchesPerDay === 0) {
          dayIndex++;
        }
        
        if (dayIndex < availableDays.length) {
          const matchDate = availableDays[dayIndex].date;
          const isWeekend = [5, 6].includes(matchDate.getDay());
          const matchTime = isWeekend ? '14:00' : '19:00';
          
          scheduledMatches.push({
            ...match,
            date: matchDate.toISOString().split('T')[0],
            time: matchTime,
            day_of_week: matchDate.getDay()
          });
        }
      });
    });
    
    return scheduledMatches;
  }

  /**
   * Get available days for volleyball matches, avoiding football conflicts
   */
  getAvailableDays(weekStart, footballConflicts) {
    const availableDays = [];
    const preferredDays = [2, 3, 5, 6]; // Tuesday, Wednesday, Friday, Saturday
    
    preferredDays.forEach(dayOffset => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayOffset);
      
      // Check for football conflicts
      const hasFootballConflict = footballConflicts.some(game => {
        const gameDate = new Date(game.date);
        return gameDate.toDateString() === date.toDateString() && game.is_home;
      });
      
      if (!hasFootballConflict) {
        availableDays.push({ date, dayOfWeek: dayOffset });
      }
    });
    
    // If not enough days due to conflicts, add Thursday
    if (availableDays.length < 2) {
      const thursday = new Date(weekStart);
      thursday.setDate(weekStart.getDate() + 4);
      availableDays.push({ date: thursday, dayOfWeek: 4 });
    }
    
    return availableDays;
  }

  /**
   * Determine home team based on various factors
   */
  determineHomeTeam(team1, team2) {
    // In production, consider:
    // - Previous matchups
    // - Home/away balance
    // - Travel considerations
    // - Venue availability
    return Math.random() < 0.5 ? team1 : team2;
  }

  /**
   * Get volleyball-specific constraints
   */
  getDefaultConstraints() {
    return [
      {
        type: 'MATCHES_PER_TEAM',
        value: this.matchesPerTeam,
        weight: 1.0
      },
      {
        type: 'WINDOWS_PER_WEEK',
        value: this.windowsPerWeek,
        weight: 1.0
      },
      {
        type: 'OPPONENT_FREQUENCY',
        description: '4 teams play twice, 10 teams play once',
        weight: 1.0
      },
      {
        type: 'NO_SERIES_MATCHES',
        description: 'All matches are single games, no series',
        weight: 1.0
      },
      {
        type: 'AVOID_FOOTBALL_CONFLICTS',
        description: 'Avoid scheduling on home football game days',
        weight: 0.9
      },
      {
        type: 'HOME_AWAY_BALANCE',
        weight: 0.8
      },
      {
        type: 'TRAVEL_OPTIMIZATION',
        weight: 0.7
      }
    ];
  }

  /**
   * Validate volleyball schedule
   */
  validateSchedule(games) {
    const result = super.validateSchedule(games);
    
    // Additional volleyball-specific validations
    const teamMatchCounts = {};
    const teamOpponentCounts = {};
    const teamWeekCounts = {};
    
    // Initialize counters
    games.forEach(game => {
      [game.home_team_id, game.away_team_id].forEach(teamId => {
        if (!teamMatchCounts[teamId]) {
          teamMatchCounts[teamId] = 0;
          teamOpponentCounts[teamId] = {};
          teamWeekCounts[teamId] = {};
        }
      });
    });
    
    // Count matches and opponents
    games.forEach(game => {
      teamMatchCounts[game.home_team_id]++;
      teamMatchCounts[game.away_team_id]++;
      
      // Track opponent frequency
      teamOpponentCounts[game.home_team_id][game.away_team_id] = 
        (teamOpponentCounts[game.home_team_id][game.away_team_id] || 0) + 1;
      teamOpponentCounts[game.away_team_id][game.home_team_id] = 
        (teamOpponentCounts[game.away_team_id][game.home_team_id] || 0) + 1;
      
      // Track weekly load
      const week = game.week || 1;
      teamWeekCounts[game.home_team_id][week] = 
        (teamWeekCounts[game.home_team_id][week] || 0) + 1;
      teamWeekCounts[game.away_team_id][week] = 
        (teamWeekCounts[game.away_team_id][week] || 0) + 1;
    });
    
    // Validate match counts
    Object.entries(teamMatchCounts).forEach(([teamId, count]) => {
      if (count !== this.matchesPerTeam) {
        result.violations.push({
          type: 'INCORRECT_MATCH_COUNT',
          message: `Team ${teamId} has ${count} matches, expected ${this.matchesPerTeam}`
        });
      }
    });
    
    // Validate opponent frequencies
    Object.entries(teamOpponentCounts).forEach(([teamId, opponents]) => {
      let twiceCount = 0;
      let onceCount = 0;
      
      Object.values(opponents).forEach(frequency => {
        if (frequency === 2) twiceCount++;
        else if (frequency === 1) onceCount++;
        else {
          result.violations.push({
            type: 'INVALID_OPPONENT_FREQUENCY',
            message: `Team ${teamId} plays an opponent ${frequency} times (only 1 or 2 allowed)`
          });
        }
      });
      
      if (twiceCount !== this.teamsToPlayTwice) {
        result.violations.push({
          type: 'INCORRECT_TWICE_OPPONENTS',
          message: `Team ${teamId} plays ${twiceCount} teams twice, expected ${this.teamsToPlayTwice}`
        });
      }
      
      if (onceCount !== this.teamsToPlayOnce) {
        result.violations.push({
          type: 'INCORRECT_ONCE_OPPONENTS',
          message: `Team ${teamId} plays ${onceCount} teams once, expected ${this.teamsToPlayOnce}`
        });
      }
    });
    
    // Validate weekly windows
    Object.entries(teamWeekCounts).forEach(([teamId, weeks]) => {
      Object.entries(weeks).forEach(([week, count]) => {
        if (count > this.windowsPerWeek) {
          result.violations.push({
            type: 'WEEKLY_WINDOW_VIOLATION',
            message: `Team ${teamId} has ${count} matches in week ${week}, max allowed is ${this.windowsPerWeek}`
          });
        }
      });
    });
    
    result.valid = result.violations.length === 0;
    return result;
  }

  /**
   * Get metadata about the scheduler
   */
  getMetadata() {
    return {
      ...super.getMetadata(),
      matchesPerTeam: this.matchesPerTeam,
      opponentDistribution: `${this.teamsToPlayTwice} teams twice, ${this.teamsToPlayOnce} teams once`,
      windowsPerWeek: this.windowsPerWeek,
      totalTeams: this.totalTeams,
      specialRules: [
        'No series matches',
        '4 non-conference weekends',
        'Avoid conflicts with home football games', 
        'Scheduled after football schedule completion',
        'Conference season ends November 22'
      ]
    };
  }
}

module.exports = VolleyballScheduler;