/**
 * Football Scheduler
 * 
 * Handles Big 12 Football scheduling with specific requirements:
 * - 9 conference games over 13 weeks
 * - Primarily Saturday games
 * - Minimum 6 days between games
 * - Bye week management
 * - Rivalry game protection
 */

const SportScheduler = require('../base/SportScheduler');
const logger = require('../../../lib/logger');
const { v4: uuidv4 } = require('uuid');

class FootballScheduler extends SportScheduler {
  constructor(config) {
    super({
      ...config,
      sportId: 8,
      sportName: 'Football',
      sportConfig: {
        pattern: 'partial',
        gamesPerTeam: 9,
        weeksBetweenGames: 1,
        seasonStart: '2025-09-06', // First Saturday of September
        seasonEnd: '2025-11-29',   // Saturday after Thanksgiving
        daysOfWeek: [6], // Saturdays
        preferredTimes: ['12:00', '15:30', '19:00', '20:00'], // Noon, 3:30pm, 7pm, 8pm
        description: 'Big 12 Football - 9 conference games'
      }
    });
    
    this.weeksInSeason = 13;
    this.byeWeeks = 4; // Each team gets bye weeks
    this.minDaysBetweenGames = 6;
  }

  /**
   * Generate football matchups with partial round-robin
   * Each team plays 9 of 15 possible opponents
   */
  async generateMatchups(teams, parameters) {
    logger.info(`Generating football matchups for ${teams.length} teams`);
    
    const gamesPerTeam = parameters.gamesPerTeam || this.sportConfig.gamesPerTeam;
    const matchups = [];
    const teamGameCounts = {};
    const teamOpponents = {};
    
    // Initialize tracking
    teams.forEach(team => {
      teamGameCounts[team.team_id] = 0;
      teamOpponents[team.team_id] = new Set();
    });
    
    // First, ensure rivalry games (if defined)
    const rivalryGames = this.getRivalryGames(teams);
    rivalryGames.forEach(game => {
      matchups.push(game);
      teamGameCounts[game.home_team_id]++;
      teamGameCounts[game.away_team_id]++;
      teamOpponents[game.home_team_id].add(game.away_team_id);
      teamOpponents[game.away_team_id].add(game.home_team_id);
    });
    
    // Generate remaining games using partial round-robin
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Skip if already scheduled (rivalry game)
        if (teamOpponents[team1.team_id].has(team2.team_id)) {
          continue;
        }
        
        // Check if both teams need more games
        if (teamGameCounts[team1.team_id] < gamesPerTeam && 
            teamGameCounts[team2.team_id] < gamesPerTeam) {
          
          // Determine home/away based on previous year or random
          const homeTeam = this.determineHomeTeam(team1, team2);
          const awayTeam = homeTeam.team_id === team1.team_id ? team2 : team1;
          
          matchups.push({
            game_id: uuidv4(),
            home_team_id: homeTeam.team_id,
            away_team_id: awayTeam.team_id,
            home_team: homeTeam,
            away_team: awayTeam,
            is_conference: true,
            week: null // Will be assigned later
          });
          
          teamGameCounts[team1.team_id]++;
          teamGameCounts[team2.team_id]++;
          teamOpponents[team1.team_id].add(team2.team_id);
          teamOpponents[team2.team_id].add(team1.team_id);
        }
      }
    }
    
    // Verify all teams have correct number of games
    const underScheduled = [];
    Object.entries(teamGameCounts).forEach(([teamId, count]) => {
      if (count < gamesPerTeam) {
        underScheduled.push({ teamId, count, needed: gamesPerTeam - count });
      }
    });
    
    if (underScheduled.length > 0) {
      logger.warn('Some teams are under-scheduled:', underScheduled);
      // Could implement additional logic to fix this
    }
    
    // Assign to weeks with bye week consideration
    return this.assignToWeeks(matchups, teams);
  }

  /**
   * Assign games to specific weeks with bye week management
   */
  assignToWeeks(matchups, teams) {
    const weeklySchedule = [];
    const teamWeekAssignments = {};
    
    // Initialize team week tracking
    teams.forEach(team => {
      teamWeekAssignments[team.team_id] = new Array(this.weeksInSeason).fill(false);
    });
    
    // Shuffle matchups for variety
    const shuffledMatchups = this.shuffleArray(matchups);
    
    // Try to distribute games evenly across weeks
    for (let week = 1; week <= this.weeksInSeason; week++) {
      const weekGames = [];
      const teamsPlayingThisWeek = new Set();
      
      // Try to schedule games for this week
      for (const matchup of shuffledMatchups) {
        // Skip if game already assigned
        if (matchup.week !== null) continue;
        
        // Check if both teams are available this week
        const homeAvailable = !teamWeekAssignments[matchup.home_team_id][week - 1];
        const awayAvailable = !teamWeekAssignments[matchup.away_team_id][week - 1];
        const neitherPlayingThisWeek = !teamsPlayingThisWeek.has(matchup.home_team_id) && 
                                       !teamsPlayingThisWeek.has(matchup.away_team_id);
        
        if (homeAvailable && awayAvailable && neitherPlayingThisWeek) {
          // Assign game to this week
          matchup.week = week;
          weekGames.push(matchup);
          
          // Mark teams as playing this week
          teamWeekAssignments[matchup.home_team_id][week - 1] = true;
          teamWeekAssignments[matchup.away_team_id][week - 1] = true;
          teamsPlayingThisWeek.add(matchup.home_team_id);
          teamsPlayingThisWeek.add(matchup.away_team_id);
          
          // Stop if we have enough games for this week (typically 8 games for 16 teams)
          if (weekGames.length >= Math.floor(teams.length / 2)) {
            break;
          }
        }
      }
      
      weeklySchedule.push({
        week,
        games: weekGames,
        byeTeams: teams.filter(t => !teamsPlayingThisWeek.has(t.team_id))
      });
    }
    
    // Log bye week distribution
    this.logByeWeekDistribution(teamWeekAssignments, teams);
    
    return matchups.filter(m => m.week !== null);
  }

  /**
   * Get rivalry games that must be scheduled
   */
  getRivalryGames(teams) {
    const rivalries = [
      // Traditional Big 12 rivalries
      { team1: 'Kansas', team2: 'Kansas State' },      // Sunflower Showdown
      { team1: 'Iowa State', team2: 'Kansas State' },  // Farmageddon
      { team1: 'Texas Tech', team2: 'TCU' },          // West Texas Championship
      { team1: 'Oklahoma State', team2: 'Texas Tech' }, // Border rivalry
      { team1: 'BYU', team2: 'Utah' }                 // Holy War
    ];
    
    const games = [];
    const teamMap = {};
    teams.forEach(t => {
      teamMap[t.name] = t;
    });
    
    rivalries.forEach(rivalry => {
      const team1 = teamMap[rivalry.team1];
      const team2 = teamMap[rivalry.team2];
      
      if (team1 && team2) {
        // Alternate home/away each year
        const homeTeam = Math.random() < 0.5 ? team1 : team2;
        const awayTeam = homeTeam === team1 ? team2 : team1;
        
        games.push({
          game_id: uuidv4(),
          home_team_id: homeTeam.team_id,
          away_team_id: awayTeam.team_id,
          home_team: homeTeam,
          away_team: awayTeam,
          is_rivalry: true,
          is_conference: true,
          week: null
        });
      }
    });
    
    return games;
  }

  /**
   * Determine home team based on previous matchups or random
   */
  determineHomeTeam(team1, team2) {
    // In a real implementation, this would check previous year's data
    // For now, use a deterministic but fair approach
    const hash = team1.team_id + team2.team_id;
    return hash % 2 === 0 ? team1 : team2;
  }

  /**
   * Log bye week distribution for analysis
   */
  logByeWeekDistribution(assignments, teams) {
    const byeWeekCounts = {};
    
    Object.entries(assignments).forEach(([teamId, weeks]) => {
      const byeWeeks = weeks.map((played, idx) => !played ? idx + 1 : null)
                            .filter(w => w !== null);
      byeWeekCounts[teamId] = byeWeeks;
    });
    
    logger.info('Bye week distribution:', byeWeekCounts);
  }

  /**
   * Get date preferences specific to football
   */
  getDatePreferences() {
    return {
      daysOfWeek: [6], // Saturdays only
      preferredStartTimes: ['12:00', '15:30', '19:00', '20:00'],
      avoidDates: [
        '2025-11-27', // Thanksgiving
        '2025-11-28'  // Black Friday (save for special games)
      ],
      preferWeekends: true,
      specialDates: {
        '2025-11-28': 'Black Friday Games',
        '2025-09-06': 'Season Opener'
      }
    };
  }

  /**
   * Get football-specific constraints
   */
  getDefaultConstraints() {
    return [
      {
        type: 'MIN_REST_DAYS',
        value: 6,
        weight: 1.0,
        description: 'Minimum 6 days between football games'
      },
      {
        type: 'HOME_AWAY_BALANCE',
        weight: 0.9,
        target: { home: 5, away: 4 } // Or 4-5 split
      },
      {
        type: 'NO_CONSECUTIVE_AWAY',
        maxConsecutive: 2,
        weight: 0.8
      },
      {
        type: 'BYE_WEEK_DISTRIBUTION',
        earliestByeWeek: 4,
        latestByeWeek: 11,
        weight: 0.7
      },
      {
        type: 'RIVALRY_PROTECTION',
        weight: 1.0,
        description: 'Ensure rivalry games are scheduled'
      }
    ];
  }

  /**
   * Validate football-specific requirements
   */
  validateSchedule(games) {
    const validation = super.validateSchedule(games);
    
    // Check games per team
    const teamGameCounts = {};
    games.forEach(game => {
      teamGameCounts[game.home_team_id] = (teamGameCounts[game.home_team_id] || 0) + 1;
      teamGameCounts[game.away_team_id] = (teamGameCounts[game.away_team_id] || 0) + 1;
    });
    
    Object.entries(teamGameCounts).forEach(([teamId, count]) => {
      if (count !== 9) {
        validation.violations.push({
          type: 'INCORRECT_GAME_COUNT',
          teamId,
          count,
          expected: 9,
          message: `Team ${teamId} has ${count} games instead of 9`
        });
      }
    });
    
    // Check for Saturday games
    const nonSaturdayGames = games.filter(game => {
      const dayOfWeek = new Date(game.date).getDay();
      return dayOfWeek !== 6;
    });
    
    if (nonSaturdayGames.length > 0) {
      validation.warnings.push({
        type: 'NON_SATURDAY_GAMES',
        count: nonSaturdayGames.length,
        message: `${nonSaturdayGames.length} games not scheduled on Saturday`
      });
    }
    
    return validation;
  }
}

module.exports = FootballScheduler;