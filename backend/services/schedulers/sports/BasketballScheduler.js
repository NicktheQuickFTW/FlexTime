/**
 * Basketball Scheduler
 * 
 * Handles Big 12 Basketball scheduling (Men's and Women's) with:
 * - Men's: 20 conference games (play 5 teams 2x, 10 teams 1x)
 * - Women's: 18 conference games (play 3 teams 2x, 12 teams 1x)
 * - Women's: 19 windows with 1 bye
 * - 2 games per week typically
 * - Travel partner considerations
 * - Back-to-back prevention
 * - TV scheduling windows
 * - Women's: First window Dec 21-23, next window Jan 1
 * - Women's: End date March 1, Tournament begins March 5
 */

const SportScheduler = require('../base/SportScheduler');
const logger = require('../../../src/lib/logger');
const { v4: uuidv4 } = require('uuid');

class BasketballScheduler extends SportScheduler {
  constructor(config = {}) {
    const isMens = config.sportId === 2;
    
    super({
      ...config,
      sportId: config.sportId, // 2 for men's, 3 for women's
      sportName: isMens ? "Men's Basketball" : "Women's Basketball",
      sportConfig: {
        pattern: 'extended_round_robin',
        gamesPerTeam: isMens ? 20 : 18, // Men: 20 games, Women: 18 games
        gamesPerWeek: 2,
        gameWindows: isMens ? 20 : 19, // Men: 20 windows, Women: 19 windows (1 bye)
        teamsToPlayTwice: isMens ? 5 : 3, // Men: 5 teams 2x, Women: 3 teams 2x
        teamsToPlayOnce: isMens ? 10 : 12, // Men: 10 teams 1x, Women: 12 teams 1x
        rivalryGames: true,
        seasonStart: isMens ? '2025-12-31' : '2024-12-21', // Women's starts Dec 21-23
        seasonEnd: isMens ? '2026-03-08' : '2025-03-01',   // Women's ends March 1
        tournamentStart: isMens ? '2026-03-11' : '2025-03-05', // Women's tournament March 5
        daysOfWeek: isMens ? [1, 2, 4, 6] : [3, 6, 0], // Men: Mon/Tue/Thu/Sat, Women: Wed/Sat/Sun
        preferredTimes: isMens ? ['19:00', '21:00'] : ['14:00', '17:00', '19:00'],
        description: `Big 12 ${isMens ? "Men's" : "Women's"} Basketball - ${isMens ? 20 : 18} conference games`
      }
    });
    
    this.isMens = isMens; // Store for easy access
    this.minDaysBetweenGames = 1;
    this.maxConsecutiveAway = 2; // Big 12 rule: max 2 consecutive away
    this.maxGamesPerWeek = 2;
  }

  /**
   * Generate basketball matchups with extended round-robin
   * Men's: 20 games (play 10 teams once, 5 teams twice)
   * Women's: 18 games (play 12 teams once, 3 teams twice)
   */
  async generateMatchups(teams, parameters) {
    const gamesPerTeam = parameters.gamesPerTeam || this.sportConfig.gamesPerTeam;
    
    logger.info(`Generating ${this.isMens ? "men's" : "women's"} basketball matchups for ${teams.length} teams`);
    logger.info(`Target: ${gamesPerTeam} games per team`);
    
    let matchups = [];
    
    if (this.isMens) {
      // Men's Basketball: 20 games (play 10 teams once, 5 teams twice)
      matchups = this.generateMensBasketballMatchups(teams, gamesPerTeam);
    } else {
      // Women's Basketball: 18 games (play 12 teams once, 3 teams twice)  
      matchups = this.generateWomensBasketballMatchups(teams, gamesPerTeam);
    }
    
    // Add rivalry protection
    matchups = this.protectRivalryGames(matchups, teams);
    
    // Balance home/away
    matchups = this.balanceHomeAway(matchups, teams);
    
    // Group games for travel partner optimization
    matchups = this.optimizeTravelPartnerScheduling(matchups, teams);
    
    // Add metadata for scheduling
    matchups = matchups.map(game => ({
      ...game,
      sport_id: this.sportId,
      is_conference: true,
      requires_travel_day: this.calculateTravelRequirement(game)
    }));
    
    logger.info(`Generated ${matchups.length} basketball games`);
    return matchups;
  }

  /**
   * Generate men's basketball matchups: play 10 teams once, 5 teams twice
   * Total = 10 + (5*2) = 20 games per team
   */
  generateMensBasketballMatchups(teams, gamesPerTeam) {
    const matchups = [];
    
    // For 16 teams: each team plays 15 opponents
    // Men's: play 10 teams once and 5 teams twice = 10 + 10 = 20 games
    const numOpponents = teams.length - 1;
    const teamsToPlayTwice = this.sportConfig.teamsToPlayTwice || 5;
    const teamsToPlayOnce = this.sportConfig.teamsToPlayOnce || 10;
    
    logger.info(`Men's Basketball: ${teamsToPlayOnce} single-play + ${teamsToPlayTwice} double-play = ${teamsToPlayOnce + (teamsToPlayTwice * 2)} games per team`);
    
    // Get protected matchups (rivalries get double-play priority)
    const doublePlayTeams = this.getDoublePlayTeams(teams, teamsToPlayTwice);
    
    // Generate all matchups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        const isDoublePlay = doublePlayTeams[team1.team_id]?.includes(team2.team_id) || false;
        const gameCount = isDoublePlay ? 2 : 1;
        
        for (let game = 0; game < gameCount; game++) {
          const homeTeam = game === 0 ? team1 : team2; // Alternate home/away for double-plays
          const awayTeam = game === 0 ? team2 : team1;
          
          matchups.push({
            game_id: uuidv4(),
            home_team_id: homeTeam.team_id,
            away_team_id: awayTeam.team_id,
            home_team: homeTeam,
            away_team: awayTeam,
            is_double_play: isDoublePlay,
            series_game: game + 1
          });
        }
      }
    }
    
    return matchups;
  }

  /**
   * Generate women's basketball matchups: play 12 teams once, 3 teams twice
   * Total = 12 + (3*2) = 18 games per team
   * Double-plays can be regional (one), additional rivalry/time zone (one), and like vs like for NET (one)
   * 18 games in 19 windows (1 bye)
   */
  generateWomensBasketballMatchups(teams, gamesPerTeam) {
    const matchups = [];
    
    // For 16 teams: each team plays 15 opponents
    // Women's: play 12 teams once and 3 teams twice = 12 + 6 = 18 games
    const numOpponents = teams.length - 1;
    const teamsToPlayTwice = this.sportConfig.teamsToPlayTwice || 3;
    const teamsToPlayOnce = this.sportConfig.teamsToPlayOnce || 12;
    
    logger.info(`Women's Basketball: ${teamsToPlayOnce} single-play + ${teamsToPlayTwice} double-play = ${teamsToPlayOnce + (teamsToPlayTwice * 2)} games per team`);
    
    // Get protected matchups (rivalries get double-play priority)
    const doublePlayTeams = this.getDoublePlayTeams(teams, teamsToPlayTwice);
    
    // Generate all matchups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        const isDoublePlay = doublePlayTeams[team1.team_id]?.includes(team2.team_id) || false;
        const gameCount = isDoublePlay ? 2 : 1;
        
        for (let game = 0; game < gameCount; game++) {
          const homeTeam = game === 0 ? team1 : team2; // Alternate home/away for double-plays
          const awayTeam = game === 0 ? team2 : team1;
          
          matchups.push({
            game_id: uuidv4(),
            home_team_id: homeTeam.team_id,
            away_team_id: awayTeam.team_id,
            home_team: homeTeam,
            away_team: awayTeam,
            is_double_play: isDoublePlay,
            series_game: game + 1
          });
        }
      }
    }
    
    return matchups;
  }

  /**
   * Determine which teams play each other twice
   * Women's Basketball: 3 double-plays per team (regional, rivalry/time zone, NET-based)
   * Men's Basketball: 5 double-plays per team
   */
  getDoublePlayTeams(teams, doublePlayCount) {
    const doublePlayTeams = {};
    const rivalryPairs = this.getRivalryPairs();
    
    // Initialize each team's double play list
    teams.forEach(team => {
      doublePlayTeams[team.team_id] = [];
    });
    
    // Regional groupings for geographic double-plays
    const regions = {
      east: ['Cincinnati', 'West Virginia', 'UCF'],
      central: ['Houston', 'Baylor', 'TCU', 'Oklahoma State'],
      mountain: ['BYU', 'Utah', 'Colorado'],
      west: ['Arizona', 'Arizona State'],
      midwest: ['Iowa State', 'Kansas', 'Kansas State']
    };
    
    // For Women's Basketball with 3 double-plays:
    // 1. Regional opponent
    // 2. Additional rivalry or time zone friendly
    // 3. "Like vs like" for NET purposes
    
    if (!this.isMens && doublePlayCount === 3) {
      teams.forEach(team => {
        // 1. Find regional opponent
        let teamRegion = null;
        Object.entries(regions).forEach(([region, schools]) => {
          if (schools.some(school => team.school_name?.includes(school))) {
            teamRegion = region;
          }
        });
        
        if (teamRegion) {
          const regionalOpponents = teams.filter(t => 
            t.team_id !== team.team_id &&
            regions[teamRegion].some(school => t.school_name?.includes(school))
          );
          
          if (regionalOpponents.length > 0 && doublePlayTeams[team.team_id].length < 1) {
            const regionalOpponent = regionalOpponents[0];
            if (!doublePlayTeams[team.team_id].includes(regionalOpponent.team_id)) {
              doublePlayTeams[team.team_id].push(regionalOpponent.team_id);
              doublePlayTeams[regionalOpponent.team_id].push(team.team_id);
            }
          }
        }
      });
    }
    
    // Add traditional rivalry games
    rivalryPairs.forEach(([team1Name, team2Name]) => {
      const team1 = teams.find(t => t.school_name?.includes(team1Name));
      const team2 = teams.find(t => t.school_name?.includes(team2Name));
      
      if (team1 && team2) {
        doublePlayTeams[team1.team_id].push(team2.team_id);
        doublePlayTeams[team2.team_id].push(team1.team_id);
      }
    });
    
    // Fill remaining slots with geographic/competitive balance
    teams.forEach(team => {
      const needed = doublePlayCount - doublePlayTeams[team.team_id].length;
      if (needed > 0) {
        const candidates = teams
          .filter(t => t.team_id !== team.team_id)
          .filter(t => !doublePlayTeams[team.team_id].includes(t.team_id))
          .sort((a, b) => {
            // Prefer geographic partners
            const aClose = this.areTeamsClose(team, a);
            const bClose = this.areTeamsClose(team, b);
            if (aClose && !bClose) return -1;
            if (!aClose && bClose) return 1;
            return 0;
          });
        
        for (let i = 0; i < Math.min(needed, candidates.length); i++) {
          const candidate = candidates[i];
          doublePlayTeams[team.team_id].push(candidate.team_id);
          doublePlayTeams[candidate.team_id].push(team.team_id);
        }
      }
    });
    
    return doublePlayTeams;
  }

  /**
   * Trim games to reach target while maintaining balance
   */
  trimToTargetGames(matchups, teams, targetGamesPerTeam) {
    const totalGamesNeeded = (targetGamesPerTeam * teams.length) / 2;
    const gamesToRemove = matchups.length - totalGamesNeeded;
    
    if (gamesToRemove <= 0) return matchups;
    
    logger.info(`Trimming ${gamesToRemove} games to reach ${targetGamesPerTeam} games per team`);
    
    // Group games by whether they're between distant teams
    const gamesByDistance = this.categorizeGamesByDistance(matchups, teams);
    
    // Remove distant non-rivalry games first
    let removed = 0;
    const kept = [];
    
    // Keep all rivalry games
    kept.push(...gamesByDistance.rivalry);
    
    // Keep close games
    kept.push(...gamesByDistance.close);
    
    // Add distant games until we reach target
    const distantNeeded = totalGamesNeeded - kept.length;
    kept.push(...gamesByDistance.distant.slice(0, distantNeeded));
    
    return this.shuffleArray(kept);
  }

  /**
   * Categorize games by travel distance
   */
  categorizeGamesByDistance(matchups, teams) {
    const rivalry = [];
    const close = [];
    const distant = [];
    
    const rivalryPairs = this.getRivalryPairs();
    
    matchups.forEach(game => {
      const isRivalry = rivalryPairs.some(([t1, t2]) => 
        (game.home_team.name === t1 && game.away_team.name === t2) ||
        (game.home_team.name === t2 && game.away_team.name === t1)
      );
      
      if (isRivalry) {
        rivalry.push(game);
      } else if (this.areTeamsClose(game.home_team, game.away_team)) {
        close.push(game);
      } else {
        distant.push(game);
      }
    });
    
    return { rivalry, close, distant };
  }

  /**
   * Check if teams are geographically close (travel partners)
   */
  areTeamsClose(team1, team2) {
    const travelPartners = [
      ['Kansas', 'Kansas State'],           // 91 miles apart
      ['Arizona', 'Arizona State'],         // 115 miles apart
      ['Texas Tech', 'TCU'],               // 266 miles apart
      ['Oklahoma State', 'Baylor'],        // 181 miles apart
      ['Iowa State', 'Kansas'],            // 235 miles (secondary partners)
      ['West Virginia', 'Cincinnati']       // 257 miles (eastern partners)
    ];
    
    return travelPartners.some(([t1, t2]) =>
      (team1.name === t1 && team2.name === t2) ||
      (team1.name === t2 && team2.name === t1)
    );
  }
  
  /**
   * Get travel partner for a team (if exists)
   */
  getTravelPartner(team, allTeams) {
    const partners = {
      'Kansas': 'Kansas State',
      'Kansas State': 'Kansas',
      'Arizona': 'Arizona State',
      'Arizona State': 'Arizona',
      'Texas Tech': 'TCU',
      'TCU': 'Texas Tech',
      'Oklahoma State': 'Baylor',
      'Baylor': 'Oklahoma State'
    };
    
    const partnerName = partners[team.name];
    return partnerName ? allTeams.find(t => t.name === partnerName) : null;
  }

  /**
   * Get rivalry pairs for basketball
   */
  getRivalryPairs() {
    return [
      ['Kansas', 'Kansas State'],      // Sunflower Showdown
      ['Iowa State', 'Kansas State'],  // Farmageddon
      ['Texas Tech', 'TCU'],          // Texas rivalry
      ['BYU', 'Utah'],                // Holy War
      ['Arizona', 'Arizona State']     // Territorial Cup
    ];
  }

  /**
   * Protect rivalry games from being removed
   */
  protectRivalryGames(matchups, teams) {
    const rivalryPairs = this.getRivalryPairs();
    const teamMap = {};
    teams.forEach(t => teamMap[t.name] = t);
    
    // Ensure each rivalry has both home and away games
    rivalryPairs.forEach(([team1Name, team2Name]) => {
      const team1 = teamMap[team1Name];
      const team2 = teamMap[team2Name];
      
      if (team1 && team2) {
        // Check if rivalry games exist
        const hasHome = matchups.some(g => 
          g.home_team_id === team1.team_id && g.away_team_id === team2.team_id
        );
        const hasAway = matchups.some(g => 
          g.home_team_id === team2.team_id && g.away_team_id === team1.team_id
        );
        
        // Add missing games
        if (!hasHome) {
          matchups.push({
            game_id: uuidv4(),
            home_team_id: team1.team_id,
            away_team_id: team2.team_id,
            home_team: team1,
            away_team: team2,
            is_rivalry: true
          });
        }
        if (!hasAway) {
          matchups.push({
            game_id: uuidv4(),
            home_team_id: team2.team_id,
            away_team_id: team1.team_id,
            home_team: team2,
            away_team: team1,
            is_rivalry: true
          });
        }
      }
    });
    
    return matchups;
  }

  /**
   * Optimize scheduling for travel partners
   * Groups away games at travel partner venues together
   */
  optimizeTravelPartnerScheduling(matchups, teams) {
    // Create a map to track games by away team and venue location
    const awayGamesByTeam = {};
    
    matchups.forEach((game, index) => {
      if (!awayGamesByTeam[game.away_team_id]) {
        awayGamesByTeam[game.away_team_id] = [];
      }
      awayGamesByTeam[game.away_team_id].push({ game, index });
    });
    
    // For each team, check if they have away games at travel partner venues
    const travelGroups = [];
    
    Object.entries(awayGamesByTeam).forEach(([teamId, awayGames]) => {
      const team = teams.find(t => t.team_id === parseInt(teamId));
      if (!team) return;
      
      // Group games by travel partner locations
      awayGames.forEach(({ game: game1, index: idx1 }) => {
        awayGames.forEach(({ game: game2, index: idx2 }) => {
          if (idx1 >= idx2) return; // Avoid duplicates
          
          const host1 = game1.home_team;
          const host2 = game2.home_team;
          
          if (this.areTeamsClose(host1, host2)) {
            travelGroups.push({
              team: team,
              games: [game1, game2],
              indices: [idx1, idx2],
              hosts: [host1, host2]
            });
          }
        });
      });
    });
    
    // Mark games that should be scheduled consecutively
    travelGroups.forEach(group => {
      group.games.forEach(game => {
        game.travel_group = `${group.team.name}_at_${group.hosts.map(h => h.name).join('_')}`;
      });
    });
    
    logger.info(`Identified ${travelGroups.length} travel partner groupings`);
    return matchups;
  }
  
  /**
   * Calculate if game requires travel day
   */
  calculateTravelRequirement(game) {
    // If part of a travel group, no travel day needed between games
    if (game.travel_group) {
      return false;
    }
    // Otherwise, travel day needed unless teams are close
    return !this.areTeamsClose(game.home_team, game.away_team);
  }

  /**
   * Get date preferences for basketball
   */
  getDatePreferences() {
    const isMens = this.sportId === 2;
    
    return {
      daysOfWeek: isMens ? [1, 2, 4, 6] : [3, 6, 0], // Different TV windows
      preferredStartTimes: isMens ? ['19:00', '21:00'] : ['14:00', '17:00', '19:00'],
      avoidDates: [
        '2025-12-25', // Christmas
        '2026-01-01', // New Year's Day
      ],
      preferWeekends: false,
      specialDates: {
        '2026-02-14': "Valentine's Day Games",
        '2026-03-07': 'Regular Season Finale'
      },
      tvWindows: {
        'Saturday': ['12:00', '14:00', '16:00', '18:00', '20:00'],
        'Weekday': ['19:00', '21:00']
      }
    };
  }

  /**
   * Get basketball-specific constraints based on Big 12 scheduling parameters
   */
  getDefaultConstraints() {
    const isMens = this.sportId === 2;
    const gamesPerTeam = isMens ? 18 : 20;
    const homeGames = Math.floor(gamesPerTeam / 2);
    const awayGames = gamesPerTeam - homeGames;
    
    return [
      {
        type: 'MIN_REST_DAYS',
        value: 1,
        weight: 1.0,
        description: 'Minimum 1 day between games'
      },
      {
        type: 'FIRST_FOUR_GAMES_BALANCE',
        weight: 1.0,
        description: 'Among first four games, at least two home and two away',
        parameters: { minHome: 2, minAway: 2 }
      },
      {
        type: 'LAST_FOUR_GAMES_BALANCE', 
        weight: 1.0,
        description: 'Among last four games, at least two home and two away',
        parameters: { minHome: 2, minAway: 2 }
      },
      {
        type: 'MAX_CONSECUTIVE_AWAY',
        value: 2,
        weight: 1.0,
        description: 'No more than two consecutive conference road games'
      },
      {
        type: 'BIG_MONDAY_PRECEDED_BY_HOME',
        weight: 0.9,
        description: 'Road Big Monday game preceded by home Saturday (except nearby opponents)',
        parameters: { dayPattern: 'Saturday-Monday', awayMondayNeedsHomeSaturday: true }
      },
      {
        type: 'NO_SATURDAY_MONDAY_WEDNESDAY',
        weight: 1.0,
        description: 'No team scheduled for Saturday-Monday-Wednesday pattern'
      },
      {
        type: 'MINIMUM_WEEKEND_HOME_GAMES',
        value: 4,
        weight: 0.9,
        description: 'Each team has minimum of four weekend home games'
      },
      {
        type: 'MIDWEEK_BYE_PREFERENCE',
        weight: 0.7,
        description: 'Bye dates generally scheduled mid-week when available'
      },
      {
        type: 'REMATCH_SEPARATION',
        weight: 0.8,
        description: 'At least 3 games and/or 10 days between rematches (prefer 4 games/15 days)',
        parameters: { minGames: 3, minDays: 10, preferredGames: 4, preferredDays: 15 }
      },
      {
        type: 'TRAVEL_PARTNER_GROUPING',
        weight: 0.8,
        description: 'Consecutive road games minimized except for Away-Away travel efficiency trips'
      },
      {
        type: 'HOME_AWAY_BALANCE',
        weight: 0.9,
        target: { home: homeGames, away: awayGames }
      },
      {
        type: 'TV_WINDOW_PREFERENCE',
        weight: 0.6,
        description: 'Optimize for TV broadcast windows (Big Monday, etc.)'
      },
      
      // SOFT PRINCIPLES (lower weights - avoided when possible)
      {
        type: 'AVOID_FOUR_OF_FIVE_ROAD',
        weight: 0.5,
        description: 'Soft: Avoid four of five games on the road anywhere in schedule'
      },
      {
        type: 'AVOID_FOUR_OF_FIRST_SIX_ROAD',
        weight: 0.5,
        description: 'Soft: Avoid four of first six games on the road'
      },
      {
        type: 'AVOID_FOUR_OF_LAST_SIX_ROAD',
        weight: 0.5,
        description: 'Soft: Avoid four of last six games on the road'
      },
      {
        type: 'AVOID_OPENING_ROAD_ROAD',
        weight: 0.4,
        description: 'Soft: Avoid opening with back-to-back road games'
      },
      {
        type: 'AVOID_CLOSING_ROAD_ROAD',
        weight: 0.4,
        description: 'Soft: Avoid closing with back-to-back road games'
      },
      {
        type: 'BALANCE_PLAYS_AFTER_BYES',
        weight: 0.3,
        description: 'Soft: Balance teams playing opponents coming off bye dates (PAB)'
      },
      {
        type: 'BIG_MONDAY_HOME_PRECEDED_BY_ROAD',
        weight: 0.4,
        description: 'Soft: Big Monday home game preceded by road game'
      },
      {
        type: 'MINIMIZE_SAME_DAY_MENS_WOMENS',
        weight: 0.3,
        description: 'Soft: Minimize same-day men\'s/women\'s games at same venue'
      }
    ];
  }

  /**
   * Validate basketball-specific requirements
   */
  validateSchedule(games) {
    const validation = super.validateSchedule(games);
    
    // Check games per team (should be 18)
    const teamGameCounts = {};
    games.forEach(game => {
      teamGameCounts[game.home_team_id] = (teamGameCounts[game.home_team_id] || 0) + 1;
      teamGameCounts[game.away_team_id] = (teamGameCounts[game.away_team_id] || 0) + 1;
    });
    
    Object.entries(teamGameCounts).forEach(([teamId, count]) => {
      if (count !== 18) {
        validation.warnings.push({
          type: 'GAME_COUNT_MISMATCH',
          teamId,
          count,
          expected: 18,
          message: `Team ${teamId} has ${count} games instead of 18`
        });
      }
    });
    
    // Check for back-to-back games
    const gamesByTeam = {};
    games.forEach(game => {
      if (!gamesByTeam[game.home_team_id]) gamesByTeam[game.home_team_id] = [];
      if (!gamesByTeam[game.away_team_id]) gamesByTeam[game.away_team_id] = [];
      gamesByTeam[game.home_team_id].push(game);
      gamesByTeam[game.away_team_id].push(game);
    });
    
    // More validation could be added here
    
    return validation;
  }
}

module.exports = BasketballScheduler;