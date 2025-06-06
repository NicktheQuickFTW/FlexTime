/**
 * Soccer Scheduler
 * 
 * Handles Big 12 Soccer scheduling with specific requirements:
 * - 11 conference matches over 7 weeks
 * - Pattern: 1-2-2-1-2-2-1 (matches per week)
 * - 73% of membership (11 of 15 opponents)
 * - Thursday & Sunday standard (Thursday & Monday for BYU)
 * - Geographic considerations for single plays
 * - RPI optimization for team and conference rankings
 */

const SportScheduler = require('../base/SportScheduler');
const logger = require('../../../src/lib/logger');
const { v4: uuidv4 } = require('uuid');

class SoccerScheduler extends SportScheduler {
  constructor(config) {
    super({
      ...config,
      sportId: 14, // Soccer sport ID
      sportName: 'Soccer',
      sportConfig: {
        pattern: 'partial',
        matchesPerTeam: 11,
        weeksInSeason: 7,
        seasonStart: '2024-09-12', // Thursday, September 12, 2024
        seasonEnd: '2024-10-28',   // Monday, October 28, 2024
        daysOfWeek: [0, 1, 4], // Sunday, Monday, Thursday
        preferredTimes: ['19:00', '13:00'], // 7pm for weekday, 1pm for weekend
        description: 'Big 12 Soccer - 11 matches over 7 weeks'
      }
    });
    
    // Week distribution pattern
    this.weekPattern = [1, 2, 2, 1, 2, 2, 1]; // 1-2-2-1-2-2-1
    this.matchesPerTeam = 11;
    this.totalTeams = 16;
    this.opponentsToPlay = 11; // 73% of 15 opponents
    
    // BYU special scheduling
    this.byuTeamId = null; // Will be set when we find BYU
    
    // Geographic regions for single play optimization
    this.regions = {
      east: ['Cincinnati', 'West Virginia', 'UCF'],
      central: ['Houston', 'Baylor', 'TCU', 'Oklahoma State'],
      mountain: ['BYU', 'Utah', 'Colorado'],
      west: ['Arizona', 'Arizona State'],
      midwest: ['Iowa State', 'Kansas', 'Kansas State']
    };
  }

  /**
   * Generate soccer matchups with partial round-robin
   * Each team plays 11 of 15 possible opponents
   */
  async generateMatchups(teams, parameters) {
    logger.info(`Generating soccer matchups for ${teams.length} teams`);
    
    // Find BYU team ID
    const byuTeam = teams.find(t => 
      t.school_name?.includes('BYU') || 
      t.team_code === 'BYU' || 
      t.school_name?.includes('Brigham Young')
    );
    if (byuTeam) {
      this.byuTeamId = byuTeam.team_id;
      logger.info(`Found BYU team with ID: ${this.byuTeamId}`);
    }
    
    const matchesPerTeam = parameters.matchesPerTeam || this.matchesPerTeam;
    const matchups = [];
    const teamMatchCounts = {};
    const teamOpponents = {};
    const teamRegions = this.assignTeamRegions(teams);
    
    // Initialize tracking
    teams.forEach(team => {
      teamMatchCounts[team.team_id] = 0;
      teamOpponents[team.team_id] = new Set();
    });
    
    // Step 1: Create geographic-based single plays
    const geographicMatchups = this.createGeographicMatchups(teams, teamRegions);
    geographicMatchups.forEach(match => {
      matchups.push(match);
      teamMatchCounts[match.home_team_id]++;
      teamMatchCounts[match.away_team_id]++;
      teamOpponents[match.home_team_id].add(match.away_team_id);
      teamOpponents[match.away_team_id].add(match.home_team_id);
    });
    
    // Step 2: Fill remaining matches with optimal pairings
    const remainingMatchups = this.fillRemainingMatchups(
      teams, 
      teamMatchCounts, 
      teamOpponents, 
      matchesPerTeam,
      teamRegions
    );
    matchups.push(...remainingMatchups);
    
    // Step 3: Distribute matches across weeks following the pattern
    const weeklyMatchups = this.distributeMatchesAcrossWeeks(matchups);
    
    // Step 4: Assign specific dates and times
    const scheduledMatchups = this.assignDatesAndTimes(weeklyMatchups);
    
    logger.info(`Generated ${scheduledMatchups.length} soccer matches`);
    return scheduledMatchups;
  }

  /**
   * Assign teams to geographic regions
   */
  assignTeamRegions(teams) {
    const teamRegions = {};
    
    teams.forEach(team => {
      let region = 'central'; // default
      
      Object.entries(this.regions).forEach(([regionName, schools]) => {
        if (schools.some(school => 
          team.school_name?.includes(school) || 
          team.team_code === school
        )) {
          region = regionName;
        }
      });
      
      teamRegions[team.team_id] = region;
    });
    
    return teamRegions;
  }

  /**
   * Create geographically optimized single play matchups
   */
  createGeographicMatchups(teams, teamRegions) {
    const matchups = [];
    const regionalGroups = {};
    
    // Group teams by region
    teams.forEach(team => {
      const region = teamRegions[team.team_id];
      if (!regionalGroups[region]) {
        regionalGroups[region] = [];
      }
      regionalGroups[region].push(team);
    });
    
    // Create intra-regional matchups first
    Object.entries(regionalGroups).forEach(([region, regionTeams]) => {
      if (regionTeams.length >= 2) {
        for (let i = 0; i < regionTeams.length - 1; i++) {
          for (let j = i + 1; j < regionTeams.length; j++) {
            const homeTeam = this.determineHomeTeam(regionTeams[i], regionTeams[j]);
            const awayTeam = homeTeam.team_id === regionTeams[i].team_id ? 
              regionTeams[j] : regionTeams[i];
            
            matchups.push({
              game_id: uuidv4(),
              home_team_id: homeTeam.team_id,
              away_team_id: awayTeam.team_id,
              home_team: homeTeam,
              away_team: awayTeam,
              is_conference: true,
              is_regional: true,
              week: null
            });
          }
        }
      }
    });
    
    return matchups;
  }

  /**
   * Fill remaining matchups to reach 11 games per team
   */
  fillRemainingMatchups(teams, teamMatchCounts, teamOpponents, targetMatches, teamRegions) {
    const matchups = [];
    const teamList = [...teams];
    
    // Sort teams by number of games needed (descending)
    teamList.sort((a, b) => 
      (targetMatches - teamMatchCounts[b.team_id]) - 
      (targetMatches - teamMatchCounts[a.team_id])
    );
    
    for (const team of teamList) {
      while (teamMatchCounts[team.team_id] < targetMatches) {
        // Find best opponent
        const opponent = this.findBestOpponent(
          team, 
          teamList, 
          teamMatchCounts, 
          teamOpponents, 
          targetMatches,
          teamRegions
        );
        
        if (!opponent) {
          logger.warn(`Could not find opponent for team ${team.team_id}`);
          break;
        }
        
        const homeTeam = this.determineHomeTeam(team, opponent);
        const awayTeam = homeTeam.team_id === team.team_id ? opponent : team;
        
        matchups.push({
          game_id: uuidv4(),
          home_team_id: homeTeam.team_id,
          away_team_id: awayTeam.team_id,
          home_team: homeTeam,
          away_team: awayTeam,
          is_conference: true,
          is_regional: false,
          week: null
        });
        
        teamMatchCounts[team.team_id]++;
        teamMatchCounts[opponent.team_id]++;
        teamOpponents[team.team_id].add(opponent.team_id);
        teamOpponents[opponent.team_id].add(team.team_id);
      }
    }
    
    return matchups;
  }

  /**
   * Find best available opponent for a team
   */
  findBestOpponent(team, allTeams, matchCounts, opponents, targetMatches, regions) {
    const candidates = allTeams.filter(t => 
      t.team_id !== team.team_id &&
      !opponents[team.team_id].has(t.team_id) &&
      matchCounts[t.team_id] < targetMatches
    );
    
    if (candidates.length === 0) return null;
    
    // Score candidates (prefer teams needing games, then by region proximity)
    const scored = candidates.map(candidate => {
      let score = 0;
      
      // Prioritize teams that need more games
      score += (targetMatches - matchCounts[candidate.team_id]) * 10;
      
      // Add small bonus for regional diversity (to ensure variety)
      if (regions[team.team_id] !== regions[candidate.team_id]) {
        score += 2;
      }
      
      return { team: candidate, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].team;
  }

  /**
   * Distribute matches across weeks following 1-2-2-1-2-2-1 pattern
   */
  distributeMatchesAcrossWeeks(matchups) {
    const weeklyMatches = Array(7).fill(null).map(() => []);
    const teamWeekCounts = {};
    
    // Initialize team week tracking
    matchups.forEach(match => {
      if (!teamWeekCounts[match.home_team_id]) {
        teamWeekCounts[match.home_team_id] = Array(7).fill(0);
      }
      if (!teamWeekCounts[match.away_team_id]) {
        teamWeekCounts[match.away_team_id] = Array(7).fill(0);
      }
    });
    
    // Sort matches to prioritize regional matches in single-match weeks
    const sortedMatches = [...matchups].sort((a, b) => {
      if (a.is_regional && !b.is_regional) return -1;
      if (!a.is_regional && b.is_regional) return 1;
      return 0;
    });
    
    // Assign matches to weeks
    for (const match of sortedMatches) {
      let bestWeek = -1;
      let bestScore = -Infinity;
      
      for (let week = 0; week < 7; week++) {
        // Check if week has capacity
        const weekCapacity = this.weekPattern[week];
        const homeTeamGamesThisWeek = teamWeekCounts[match.home_team_id][week];
        const awayTeamGamesThisWeek = teamWeekCounts[match.away_team_id][week];
        
        if (homeTeamGamesThisWeek < weekCapacity && 
            awayTeamGamesThisWeek < weekCapacity) {
          
          // Score this week assignment
          let score = 0;
          
          // Prefer weeks with fewer matches scheduled
          score -= weeklyMatches[week].length;
          
          // Prefer single-match weeks for regional games
          if (match.is_regional && weekCapacity === 1) {
            score += 5;
          }
          
          // Balance team schedules
          const homeTotal = teamWeekCounts[match.home_team_id].reduce((a, b) => a + b, 0);
          const awayTotal = teamWeekCounts[match.away_team_id].reduce((a, b) => a + b, 0);
          score -= Math.abs(homeTotal - awayTotal);
          
          if (score > bestScore) {
            bestScore = score;
            bestWeek = week;
          }
        }
      }
      
      if (bestWeek >= 0) {
        match.week = bestWeek + 1; // 1-indexed
        weeklyMatches[bestWeek].push(match);
        teamWeekCounts[match.home_team_id][bestWeek]++;
        teamWeekCounts[match.away_team_id][bestWeek]++;
      } else {
        logger.warn(`Could not assign week for match ${match.game_id}`);
      }
    }
    
    return weeklyMatches;
  }

  /**
   * Assign specific dates and times to matches
   */
  assignDatesAndTimes(weeklyMatches) {
    const scheduledMatches = [];
    const startDate = new Date(this.sportConfig.seasonStart);
    
    weeklyMatches.forEach((weekMatches, weekIndex) => {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (weekIndex * 7));
      
      // For each match in the week
      weekMatches.forEach((match, matchIndex) => {
        const isBYUMatch = match.home_team_id === this.byuTeamId || 
                          match.away_team_id === this.byuTeamId;
        
        let matchDate, matchTime;
        
        if (this.weekPattern[weekIndex] === 1) {
          // Single match week - use Thursday
          matchDate = this.getNextWeekday(weekStartDate, 4); // Thursday
          matchTime = '19:00';
        } else {
          // Two match week
          if (matchIndex === 0) {
            // First match on Thursday
            matchDate = this.getNextWeekday(weekStartDate, 4); // Thursday
            matchTime = '19:00';
          } else {
            // Second match on Sunday (or Monday for BYU)
            if (isBYUMatch) {
              matchDate = this.getNextWeekday(weekStartDate, 1); // Monday
            } else {
              matchDate = this.getNextWeekday(weekStartDate, 0); // Sunday
            }
            matchTime = '13:00'; // 1pm for weekend/Monday games
          }
        }
        
        scheduledMatches.push({
          ...match,
          date: matchDate.toISOString().split('T')[0],
          time: matchTime,
          day_of_week: matchDate.getDay()
        });
      });
    });
    
    return scheduledMatches;
  }

  /**
   * Get next occurrence of a specific weekday
   */
  getNextWeekday(startDate, targetDay) {
    const date = new Date(startDate);
    const currentDay = date.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  /**
   * Determine home team based on various factors
   */
  determineHomeTeam(team1, team2) {
    // For now, use simple alternation or random
    // In production, this would consider previous year's matchup,
    // travel equity, and other factors
    return Math.random() < 0.5 ? team1 : team2;
  }

  /**
   * Get soccer-specific constraints
   */
  getDefaultConstraints() {
    return [
      {
        type: 'MATCHES_PER_WEEK',
        pattern: this.weekPattern,
        weight: 1.0
      },
      {
        type: 'BYU_MONDAY_GAMES',
        description: 'BYU plays Monday instead of Sunday',
        weight: 1.0
      },
      {
        type: 'GEOGRAPHIC_OPTIMIZATION',
        description: 'Single plays should be geographically optimized',
        weight: 0.8
      },
      {
        type: 'RPI_OPTIMIZATION',
        description: 'Schedule should optimize team and conference RPI',
        weight: 0.6
      },
      {
        type: 'HOME_AWAY_BALANCE',
        weight: 0.9
      }
    ];
  }

  /**
   * Validate soccer schedule
   */
  validateSchedule(games) {
    const result = super.validateSchedule(games);
    
    // Additional soccer-specific validations
    const teamMatchCounts = {};
    const teamWeekCounts = {};
    
    games.forEach(game => {
      // Count matches per team
      teamMatchCounts[game.home_team_id] = (teamMatchCounts[game.home_team_id] || 0) + 1;
      teamMatchCounts[game.away_team_id] = (teamMatchCounts[game.away_team_id] || 0) + 1;
      
      // Track matches per week per team
      if (!teamWeekCounts[game.home_team_id]) {
        teamWeekCounts[game.home_team_id] = {};
      }
      if (!teamWeekCounts[game.away_team_id]) {
        teamWeekCounts[game.away_team_id] = {};
      }
      
      const week = game.week || 1;
      teamWeekCounts[game.home_team_id][week] = (teamWeekCounts[game.home_team_id][week] || 0) + 1;
      teamWeekCounts[game.away_team_id][week] = (teamWeekCounts[game.away_team_id][week] || 0) + 1;
    });
    
    // Check match counts
    Object.entries(teamMatchCounts).forEach(([teamId, count]) => {
      if (count !== this.matchesPerTeam) {
        result.violations.push({
          type: 'INCORRECT_MATCH_COUNT',
          message: `Team ${teamId} has ${count} matches, expected ${this.matchesPerTeam}`
        });
      }
    });
    
    // Check weekly patterns
    Object.entries(teamWeekCounts).forEach(([teamId, weeks]) => {
      Object.entries(weeks).forEach(([week, count]) => {
        const expectedMax = this.weekPattern[parseInt(week) - 1];
        if (count > expectedMax) {
          result.violations.push({
            type: 'WEEKLY_PATTERN_VIOLATION',
            message: `Team ${teamId} has ${count} matches in week ${week}, max allowed is ${expectedMax}`
          });
        }
      });
    });
    
    // Check BYU Monday games
    const byuGames = games.filter(g => 
      g.home_team_id === this.byuTeamId || g.away_team_id === this.byuTeamId
    );
    
    byuGames.forEach(game => {
      if (game.day_of_week === 0) { // Sunday
        result.violations.push({
          type: 'BYU_SUNDAY_GAME',
          message: `BYU game scheduled on Sunday (should be Monday): ${game.game_id}`
        });
      }
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
      pattern: '1-2-2-1-2-2-1',
      matchesPerTeam: this.matchesPerTeam,
      percentageOfOpponents: '73%',
      specialRules: [
        'BYU plays Monday instead of Sunday',
        'Geographic optimization for single plays',
        'RPI optimization for rankings'
      ]
    };
  }
}

module.exports = SoccerScheduler;