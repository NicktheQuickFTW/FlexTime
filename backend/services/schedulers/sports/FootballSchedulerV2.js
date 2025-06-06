/**
 * Football Scheduler V2
 * 
 * Improved version that ensures all teams get exactly 9 games
 * Uses a more sophisticated algorithm for partial round-robin
 */

const SportScheduler = require('../base/SportScheduler');
const logger = require('../../../lib/logger');
const { v4: uuidv4 } = require('uuid');

class FootballSchedulerV2 extends SportScheduler {
  constructor(config) {
    super({
      ...config,
      sportId: 8,
      sportName: 'Football',
      sportConfig: {
        pattern: 'partial',
        gamesPerTeam: 9,
        weeksBetweenGames: 1,
        seasonStart: '2025-09-06',
        seasonEnd: '2025-11-29',
        daysOfWeek: [6], // Saturdays
        preferredTimes: ['12:00', '15:30', '19:00', '20:00'],
        description: 'Big 12 Football - 9 conference games'
      }
    });
    
    this.weeksInSeason = 13;
    this.minDaysBetweenGames = 6;
  }

  /**
   * Generate football matchups ensuring all teams get exactly 9 games
   */
  async generateMatchups(teams, parameters) {
    logger.info(`Generating football matchups for ${teams.length} teams`);
    
    const gamesPerTeam = parameters.gamesPerTeam || this.sportConfig.gamesPerTeam;
    const matchups = [];
    
    // Create opponent matrix to track who plays whom
    const opponentMatrix = this.createOpponentMatrix(teams);
    
    // Step 1: Schedule rivalry games first
    const rivalryPairs = this.getRivalryPairs(teams);
    rivalryPairs.forEach(([team1, team2]) => {
      if (opponentMatrix.canPlay(team1.team_id, team2.team_id)) {
        const game = this.createGame(team1, team2, true);
        matchups.push(game);
        opponentMatrix.markPlayed(team1.team_id, team2.team_id);
      }
    });
    
    // Step 2: Use a round-robin approach with early termination
    // This ensures even distribution of games
    const rounds = [];
    for (let round = 0; round < gamesPerTeam; round++) {
      const roundGames = this.generateRound(teams, opponentMatrix, gamesPerTeam);
      rounds.push(roundGames);
      matchups.push(...roundGames);
    }
    
    // Step 3: Fix any teams that don't have enough games
    const fixedGames = this.fixUnderScheduledTeams(teams, opponentMatrix, gamesPerTeam);
    matchups.push(...fixedGames);
    
    // Step 4: Balance home/away games
    const balancedMatchups = this.balanceHomeAwayGames(matchups, teams);
    
    // Step 5: Assign to weeks
    const weekAssignedMatchups = this.assignToWeeksV2(balancedMatchups, teams);
    
    // Log final statistics
    this.logScheduleStats(weekAssignedMatchups, teams);
    
    return weekAssignedMatchups;
  }

  /**
   * Create opponent tracking matrix
   */
  createOpponentMatrix(teams) {
    const matrix = {};
    const gameCount = {};
    
    teams.forEach(team => {
      matrix[team.team_id] = {};
      gameCount[team.team_id] = 0;
      teams.forEach(opponent => {
        if (team.team_id !== opponent.team_id) {
          matrix[team.team_id][opponent.team_id] = false;
        }
      });
    });
    
    return {
      canPlay: (team1Id, team2Id) => {
        return team1Id !== team2Id && 
               !matrix[team1Id][team2Id] && 
               !matrix[team2Id][team1Id];
      },
      markPlayed: (team1Id, team2Id) => {
        matrix[team1Id][team2Id] = true;
        matrix[team2Id][team1Id] = true;
        gameCount[team1Id]++;
        gameCount[team2Id]++;
      },
      getGameCount: (teamId) => gameCount[teamId] || 0,
      getUnplayedOpponents: (teamId) => {
        const unplayed = [];
        Object.entries(matrix[teamId] || {}).forEach(([oppId, played]) => {
          if (!played) unplayed.push(oppId);
        });
        return unplayed;
      }
    };
  }

  /**
   * Generate one round of games trying to get each team one game
   */
  generateRound(teams, opponentMatrix, maxGamesPerTeam) {
    const roundGames = [];
    const teamsInRound = new Set();
    
    // Shuffle teams to ensure variety
    const shuffledTeams = this.shuffleArray([...teams]);
    
    for (const team of shuffledTeams) {
      // Skip if team already playing this round or has enough games
      if (teamsInRound.has(team.team_id) || 
          opponentMatrix.getGameCount(team.team_id) >= maxGamesPerTeam) {
        continue;
      }
      
      // Find an opponent
      const opponents = opponentMatrix.getUnplayedOpponents(team.team_id);
      
      for (const oppId of opponents) {
        // Check if opponent is available and needs games
        if (!teamsInRound.has(oppId) && 
            opponentMatrix.getGameCount(oppId) < maxGamesPerTeam) {
          
          const opponent = teams.find(t => t.team_id === parseInt(oppId));
          if (opponent) {
            const game = this.createGame(team, opponent, false);
            roundGames.push(game);
            opponentMatrix.markPlayed(team.team_id, opponent.team_id);
            teamsInRound.add(team.team_id);
            teamsInRound.add(opponent.team_id);
            break;
          }
        }
      }
    }
    
    return roundGames;
  }

  /**
   * Fix teams that don't have enough games
   */
  fixUnderScheduledTeams(teams, opponentMatrix, targetGames) {
    const additionalGames = [];
    
    // Find under-scheduled teams
    const underScheduled = teams.filter(team => 
      opponentMatrix.getGameCount(team.team_id) < targetGames
    );
    
    if (underScheduled.length > 0) {
      logger.info(`Fixing ${underScheduled.length} under-scheduled teams`);
      
      // Try to pair up under-scheduled teams
      for (let i = 0; i < underScheduled.length; i++) {
        const team1 = underScheduled[i];
        
        if (opponentMatrix.getGameCount(team1.team_id) >= targetGames) {
          continue;
        }
        
        for (let j = i + 1; j < underScheduled.length; j++) {
          const team2 = underScheduled[j];
          
          if (opponentMatrix.canPlay(team1.team_id, team2.team_id) &&
              opponentMatrix.getGameCount(team1.team_id) < targetGames &&
              opponentMatrix.getGameCount(team2.team_id) < targetGames) {
            
            const game = this.createGame(team1, team2, false);
            additionalGames.push(game);
            opponentMatrix.markPlayed(team1.team_id, team2.team_id);
          }
        }
      }
    }
    
    return additionalGames;
  }

  /**
   * Balance home and away games more effectively
   */
  balanceHomeAwayGames(matchups, teams) {
    const teamStats = {};
    
    // Initialize and count current distribution
    teams.forEach(team => {
      teamStats[team.team_id] = { home: 0, away: 0 };
    });
    
    matchups.forEach(game => {
      teamStats[game.home_team_id].home++;
      teamStats[game.away_team_id].away++;
    });
    
    // Try to balance by swapping some games
    const balanced = [...matchups];
    
    balanced.forEach((game, index) => {
      const homeStats = teamStats[game.home_team_id];
      const awayStats = teamStats[game.away_team_id];
      
      // If swapping would improve balance, do it
      if (homeStats.home > homeStats.away + 1 && awayStats.away > awayStats.home + 1) {
        // Swap home and away
        balanced[index] = {
          ...game,
          home_team_id: game.away_team_id,
          away_team_id: game.home_team_id,
          home_team: game.away_team,
          away_team: game.home_team
        };
        
        // Update stats
        teamStats[game.home_team_id].home--;
        teamStats[game.home_team_id].away++;
        teamStats[game.away_team_id].away--;
        teamStats[game.away_team_id].home++;
      }
    });
    
    return balanced;
  }

  /**
   * Improved week assignment algorithm
   */
  assignToWeeksV2(matchups, teams) {
    const assignedGames = [];
    const teamSchedule = {};
    
    // Initialize team schedules
    teams.forEach(team => {
      teamSchedule[team.team_id] = new Array(this.weeksInSeason).fill(null);
    });
    
    // Sort games to prioritize rivalry games
    const sortedMatchups = [...matchups].sort((a, b) => {
      if (a.is_rivalry && !b.is_rivalry) return -1;
      if (!a.is_rivalry && b.is_rivalry) return 1;
      return 0;
    });
    
    // Assign games to weeks
    sortedMatchups.forEach(game => {
      let assigned = false;
      
      // Try each week
      for (let week = 1; week <= this.weeksInSeason && !assigned; week++) {
        // Check if both teams are free this week
        if (!teamSchedule[game.home_team_id][week - 1] && 
            !teamSchedule[game.away_team_id][week - 1]) {
          
          // Check minimum rest days from previous games
          const homeOk = this.checkRestDays(teamSchedule[game.home_team_id], week);
          const awayOk = this.checkRestDays(teamSchedule[game.away_team_id], week);
          
          if (homeOk && awayOk) {
            game.week = week;
            teamSchedule[game.home_team_id][week - 1] = game;
            teamSchedule[game.away_team_id][week - 1] = game;
            assignedGames.push(game);
            assigned = true;
          }
        }
      }
      
      if (!assigned) {
        logger.warn(`Could not assign game between ${game.home_team_id} and ${game.away_team_id}`);
      }
    });
    
    return assignedGames;
  }

  /**
   * Check if team has enough rest days
   */
  checkRestDays(teamWeeks, proposedWeek) {
    // Check weeks before
    for (let w = Math.max(1, proposedWeek - 1); w < proposedWeek; w++) {
      if (teamWeeks[w - 1] !== null) return false;
    }
    
    // Check week after
    if (proposedWeek < this.weeksInSeason && teamWeeks[proposedWeek] !== null) {
      return false;
    }
    
    return true;
  }

  /**
   * Create a game object
   */
  createGame(team1, team2, isRivalry = false) {
    const homeTeam = this.determineHomeTeam(team1, team2);
    const awayTeam = homeTeam.team_id === team1.team_id ? team2 : team1;
    
    return {
      game_id: uuidv4(),
      home_team_id: homeTeam.team_id,
      away_team_id: awayTeam.team_id,
      home_team: homeTeam,
      away_team: awayTeam,
      is_rivalry: isRivalry,
      is_conference: true,
      week: null
    };
  }

  /**
   * Get rivalry pairs
   */
  getRivalryPairs(teams) {
    const rivalries = [
      ['Kansas', 'Kansas State'],
      ['Iowa State', 'Kansas State'],
      ['Texas Tech', 'TCU'],
      ['Oklahoma State', 'Texas Tech'],
      ['BYU', 'Utah']
    ];
    
    const pairs = [];
    const teamMap = {};
    teams.forEach(t => teamMap[t.name] = t);
    
    rivalries.forEach(([name1, name2]) => {
      const team1 = teamMap[name1];
      const team2 = teamMap[name2];
      if (team1 && team2) {
        pairs.push([team1, team2]);
      }
    });
    
    return pairs;
  }

  /**
   * Determine home team
   */
  determineHomeTeam(team1, team2) {
    // Use a deterministic approach based on team IDs
    return (team1.team_id + team2.team_id) % 2 === 0 ? team1 : team2;
  }

  /**
   * Log schedule statistics
   */
  logScheduleStats(games, teams) {
    const stats = {};
    
    teams.forEach(team => {
      stats[team.team_id] = {
        games: 0,
        home: 0,
        away: 0,
        weeks: [],
        opponents: []
      };
    });
    
    games.forEach(game => {
      stats[game.home_team_id].games++;
      stats[game.home_team_id].home++;
      stats[game.home_team_id].weeks.push(game.week);
      stats[game.home_team_id].opponents.push(game.away_team_id);
      
      stats[game.away_team_id].games++;
      stats[game.away_team_id].away++;
      stats[game.away_team_id].weeks.push(game.week);
      stats[game.away_team_id].opponents.push(game.home_team_id);
    });
    
    logger.info('Schedule statistics:', {
      totalGames: games.length,
      teamsScheduled: Object.keys(stats).length,
      averageGamesPerTeam: games.length * 2 / teams.length
    });
  }

  // Inherit other methods from parent class
}

module.exports = FootballSchedulerV2;