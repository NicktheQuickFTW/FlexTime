/**
 * Simple Scheduling Service
 * 
 * Creates schedules with sport-specific patterns:
 * - Round Robin: Volleyball, Tennis
 * - Extended Round Robin (1.5x): Men's/Women's Basketball 
 * - Partial Schedule: Football, Soccer, Wrestling
 * - Full Round Robin: Baseball, Softball
 * 
 * Incorporates 2025-26 season dates for each sport
 */

const Big12DataService = require('./big12DataService');
const logger = require('../lib/logger');
const { v4: uuidv4 } = require('uuid');

class SimpleSchedulingService {
  /**
   * Sport-specific scheduling configurations with 2025-26 season dates
   */
  static SPORT_CONFIGS = {
    // Football - 9 conference games (partial schedule)
    8: { 
      pattern: 'partial',
      gamesPerTeam: 9,
      homeAwayBalance: true,
      weeksBetweenGames: 1,
      seasonStart: '2025-09-06', // Early September (first Saturday)
      seasonEnd: '2025-11-29',   // Saturday after Thanksgiving
      daysOfWeek: [6], // Saturdays primarily
      description: 'Big 12 Football - 9 conference games'
    },
    // Men's Basketball - ~18 conference games (round robin + partial second round)
    2: {
      pattern: 'extended_round_robin',
      gamesPerTeam: 18,
      homeAwayBalance: true,
      gamesPerWeek: 2,
      rivalryGames: true,
      seasonStart: '2025-12-31', // New Year's Eve start for conference play
      seasonEnd: '2026-03-08',   // Early March (before tournament)
      daysOfWeek: [1, 2, 4, 6], // Monday, Tuesday, Thursday, Saturday
      description: 'Big 12 Men\'s Basketball - 18 conference games'
    },
    // Women's Basketball - ~18 conference games
    3: {
      pattern: 'extended_round_robin', 
      gamesPerTeam: 18,
      homeAwayBalance: true,
      gamesPerWeek: 2,
      rivalryGames: true,
      seasonStart: '2025-12-31', // New Year's Eve start for conference play
      seasonEnd: '2026-03-08',   // Early March
      daysOfWeek: [3, 6, 0], // Wednesday, Saturday, Sunday
      description: 'Big 12 Women\'s Basketball - 18 conference games'
    },
    // Baseball - Full round robin weekend series
    1: {
      pattern: 'round_robin',
      seriesLength: 3, // 3-game weekend series
      gamesPerWeek: 3,
      weekendSeries: true,
      seasonStart: '2026-03-13', // Mid-March (Spring season)
      seasonEnd: '2026-05-16',   // Mid-May (before tournament)
      daysOfWeek: [5, 6, 0], // Friday-Sunday series
      description: 'Big 12 Baseball - Weekend series format'
    },
    // Softball - Full round robin weekend series
    15: {
      pattern: 'round_robin',
      seriesLength: 3,
      gamesPerWeek: 3,
      weekendSeries: true,
      seasonStart: '2026-03-13', // Mid-March (Spring season)
      seasonEnd: '2026-05-09',   // Early May (before tournament)
      daysOfWeek: [5, 6, 0], // Friday-Sunday series
      description: 'Big 12 Softball - Weekend series format'
    },
    // Soccer - Partial schedule (10 games)
    14: {
      pattern: 'partial',
      gamesPerTeam: 10,
      homeAwayBalance: true,
      daysBetweenGames: 3,
      seasonStart: '2025-09-18', // Mid-September
      seasonEnd: '2025-11-02',   // Early November (before tournament)
      daysOfWeek: [4, 0], // Thursday, Sunday
      description: 'Big 12 Soccer - 10 conference matches'
    },
    // Wrestling - Dual meets (partial)
    25: {
      pattern: 'partial',
      meetsPerTeam: 6,
      homeAwayBalance: true,
      daysBetweenMeets: 7,
      seasonStart: '2026-01-09', // Early January
      seasonEnd: '2026-02-22',   // Late February (before championship)
      daysOfWeek: [5, 0], // Friday, Sunday
      description: 'Big 12 Wrestling - 6 conference duals'
    },
    // Volleyball - Full round robin (based on actual schedule)
    24: {
      pattern: 'round_robin',
      matchesPerWeek: 2,
      homeAwayBalance: true,
      travelPartners: true, // Minimize travel
      seasonStart: '2025-09-24', // September 24 (actual start date)
      seasonEnd: '2025-11-29',   // November 29 (actual end date)
      daysOfWeek: [3, 4, 5, 6, 0], // Wed, Thu, Fri, Sat, Sun (as per schedule)
      description: 'Big 12 Volleyball - Full round robin'
    },
    // Men's Tennis - Round robin
    18: {
      pattern: 'round_robin',
      matchesPerWeek: 2,
      homeAwayBalance: true,
      seasonStart: '2026-03-06', // Early March
      seasonEnd: '2026-04-25',   // Late April (before championship)
      daysOfWeek: [5, 0], // Friday, Sunday
      description: 'Big 12 Men\'s Tennis - Round robin'
    },
    // Women's Tennis - Round robin
    19: {
      pattern: 'round_robin',
      matchesPerWeek: 2,
      homeAwayBalance: true,
      seasonStart: '2026-03-06', // Early March
      seasonEnd: '2026-04-25',   // Late April (before championship)
      daysOfWeek: [5, 0], // Friday, Sunday
      description: 'Big 12 Women\'s Tennis - Round robin'
    },
    // Gymnastics - Partial meets
    12: {
      pattern: 'partial',
      meetsPerTeam: 8,
      multiTeamMeets: true,
      seasonStart: '2026-01-09', // Early January
      seasonEnd: '2026-03-13',   // Mid-March (before championship)
      daysOfWeek: [5], // Fridays primarily
      description: 'Big 12 Gymnastics - 8 conference meets'
    },
    // Lacrosse - Partial schedule
    13: {
      pattern: 'partial',
      gamesPerTeam: 8,
      homeAwayBalance: true,
      seasonStart: '2026-02-27', // Late February
      seasonEnd: '2026-04-24',   // Late April (before tournament)
      daysOfWeek: [5, 0], // Friday, Sunday
      description: 'Big 12 Lacrosse - 8 conference games'
    }
  };
  /**
   * Generate a complete schedule for a sport
   * @param {Object} params - Scheduling parameters
   * @returns {Object} Generated schedule with games and metadata
   */
  static async generateSchedule(params) {
    try {
      const {
        sport_id,
        team_ids,
        start_date,
        end_date,
        use_default_dates = true, // Use sport's default season dates
        constraints = []
      } = params;
      
      // Get sport configuration
      const sportConfig = this.SPORT_CONFIGS[sport_id];
      if (!sportConfig) {
        throw new Error(`No configuration found for sport ID ${sport_id}`);
      }
      
      // Use sport-specific dates if requested
      const scheduleStartDate = use_default_dates ? sportConfig.seasonStart : start_date;
      const scheduleEndDate = use_default_dates ? sportConfig.seasonEnd : end_date;
      
      if (!scheduleStartDate || !scheduleEndDate) {
        throw new Error('Start and end dates are required');
      }
      
      logger.info(`Generating ${sportConfig.pattern} schedule for sport ${sport_id} (${sportConfig.description}) with ${team_ids.length} teams`);
      logger.info(`Season dates: ${scheduleStartDate} to ${scheduleEndDate}`);
      
      // Validate inputs
      const validation = this.validateInputs({ ...params, start_date: scheduleStartDate, end_date: scheduleEndDate });
      if (!validation.valid) {
        throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
      }
      
      // Get team data with validation
      const teams = this.getValidatedTeams(team_ids);
      
      // Generate matchups based on sport pattern
      let matchups;
      switch (sportConfig.pattern) {
        case 'partial':
          matchups = this.generatePartialSchedule(teams, sportConfig);
          break;
        case 'extended_round_robin':
          // Extended round robin = 1.5x games (18 for basketball)
          matchups = this.generateRoundRobin(teams);
          // Take subset to get approximately 18 games per team
          const targetGames = sportConfig.gamesPerTeam || 18;
          const gamesPerTeam = (matchups.length * 2) / teams.length;
          if (gamesPerTeam > targetGames) {
            // Trim some games to reach target
            const keepRatio = targetGames / gamesPerTeam;
            const keepCount = Math.floor(matchups.length * keepRatio);
            matchups = this.shuffleArray(matchups).slice(0, keepCount);
          }
          break;
        case 'round_robin':
        default:
          matchups = this.generateRoundRobin(teams, sportConfig.homeAwayBalance);
          break;
      }
      
      // Balance home/away if requested
      if (home_away_balance) {
        matchups = this.balanceHomeAway(matchups, teams);
      }
      
      // Assign dates with constraint checking
      const datedGames = await this.assignDates(matchups, start_date, end_date, constraints);
      
      // Assign venues based on home team
      const scheduledGames = this.assignVenues(datedGames);
      
      // Calculate metadata and statistics
      const metadata = this.calculateMetadata(scheduledGames, teams, start_date, end_date);
      
      return {
        schedule_id: uuidv4(),
        sport_id,
        games: scheduledGames,
        metadata,
        constraints_applied: constraints.length,
        generated_at: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error generating schedule:', error);
      throw error;
    }
  }
  
  /**
   * Validate input parameters
   * @private
   */
  static validateInputs(params) {
    const errors = [];
    
    if (!params.sport_id) {
      errors.push('sport_id is required');
    }
    
    if (!params.team_ids || params.team_ids.length < 2) {
      errors.push('At least 2 teams are required');
    }
    
    if (!params.start_date || !params.end_date) {
      errors.push('start_date and end_date are required');
    }
    
    const start = new Date(params.start_date);
    const end = new Date(params.end_date);
    
    if (start >= end) {
      errors.push('end_date must be after start_date');
    }
    
    // Validate all team IDs exist
    if (params.team_ids) {
      const { invalid } = Big12DataService.validateTeamIds(params.team_ids);
      if (invalid.length > 0) {
        errors.push(`Invalid team IDs: ${invalid.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get validated team data
   * @private
   */
  static getValidatedTeams(teamIds) {
    return teamIds.map(id => {
      const team = Big12DataService.getTeamById(id);
      if (!team) {
        throw new Error(`Team not found: ${id}`);
      }
      return team;
    });
  }
  
  /**
   * Generate full round-robin matchups
   * @private
   */
  static generateRoundRobin(teams) {
    const matchups = [];
    const n = teams.length;
    
    // Generate all possible matchups
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // Home game
        matchups.push({
          game_id: uuidv4(),
          home_team_id: teams[i].team_id,
          away_team_id: teams[j].team_id,
          home_team: teams[i],
          away_team: teams[j]
        });
        
        // Away game (return match)
        matchups.push({
          game_id: uuidv4(),
          home_team_id: teams[j].team_id,
          away_team_id: teams[i].team_id,
          home_team: teams[j],
          away_team: teams[i]
        });
      }
    }
    
    // Shuffle to avoid predictable patterns
    return this.shuffleArray(matchups);
  }
  
  /**
   * Generate partial round-robin with specified games per team
   * @private
   */
  static generatePartialRoundRobin(teams, gamesPerTeam) {
    const matchups = [];
    const teamGameCounts = {};
    
    // Initialize game counts
    teams.forEach(team => {
      teamGameCounts[team.team_id] = 0;
    });
    
    // Generate matchups ensuring each team plays approximately gamesPerTeam games
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Check if both teams need more games
        if (teamGameCounts[team1.team_id] < gamesPerTeam && 
            teamGameCounts[team2.team_id] < gamesPerTeam) {
          
          // Determine home/away
          const homeTeam = Math.random() < 0.5 ? team1 : team2;
          const awayTeam = homeTeam === team1 ? team2 : team1;
          
          matchups.push({
            game_id: uuidv4(),
            home_team_id: homeTeam.team_id,
            away_team_id: awayTeam.team_id,
            home_team: homeTeam,
            away_team: awayTeam
          });
          
          teamGameCounts[team1.team_id]++;
          teamGameCounts[team2.team_id]++;
        }
      }
    }
    
    return matchups;
  }
  
  /**
   * Balance home and away games for each team
   * @private
   */
  static balanceHomeAway(matchups, teams) {
    const teamStats = {};
    
    // Initialize stats
    teams.forEach(team => {
      teamStats[team.team_id] = { home: 0, away: 0 };
    });
    
    // Count current distribution
    matchups.forEach(game => {
      teamStats[game.home_team_id].home++;
      teamStats[game.away_team_id].away++;
    });
    
    // Identify imbalances and swap if needed
    const balanced = [...matchups];
    
    for (const [teamId, stats] of Object.entries(teamStats)) {
      const diff = Math.abs(stats.home - stats.away);
      if (diff > 1) {
        // Try to balance by swapping some games
        logger.info(`Team ${teamId} has imbalance: ${stats.home} home, ${stats.away} away`);
        // Implementation for swapping would go here
      }
    }
    
    return balanced;
  }
  
  /**
   * Assign dates to matchups with constraint checking
   * @private
   */
  static async assignDates(matchups, startDate, endDate, constraints) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const scheduledGames = [];
    
    // Group constraints by type for efficient checking
    const constraintsByType = this.groupConstraintsByType(constraints);
    
    // Calculate available dates
    const availableDates = this.getAvailableDates(start, end, constraintsByType);
    
    if (availableDates.length === 0) {
      throw new Error('No available dates for scheduling');
    }
    
    // Simple distribution: spread games evenly across available dates
    const gamesPerDate = Math.ceil(matchups.length / availableDates.length);
    let dateIndex = 0;
    let gamesOnCurrentDate = 0;
    
    for (const matchup of matchups) {
      if (gamesOnCurrentDate >= gamesPerDate && dateIndex < availableDates.length - 1) {
        dateIndex++;
        gamesOnCurrentDate = 0;
      }
      
      const gameDate = availableDates[dateIndex];
      const gameTime = this.getGameTime(gamesOnCurrentDate);
      
      scheduledGames.push({
        ...matchup,
        date: gameDate.toISOString().split('T')[0],
        time: gameTime,
        datetime: new Date(`${gameDate.toISOString().split('T')[0]}T${gameTime}`).toISOString()
      });
      
      gamesOnCurrentDate++;
    }
    
    return scheduledGames;
  }
  
  /**
   * Get available dates considering constraints
   * @private
   */
  static getAvailableDates(startDate, endDate, constraintsByType) {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      let isAvailable = true;
      
      // Check blackout dates
      if (constraintsByType.BLACKOUT_DATES) {
        for (const constraint of constraintsByType.BLACKOUT_DATES) {
          const blackoutStart = new Date(constraint.start_date);
          const blackoutEnd = new Date(constraint.end_date);
          
          if (current >= blackoutStart && current <= blackoutEnd) {
            isAvailable = false;
            break;
          }
        }
      }
      
      // Check day of week constraints
      if (constraintsByType.DAY_OF_WEEK && isAvailable) {
        const dayOfWeek = current.getDay();
        for (const constraint of constraintsByType.DAY_OF_WEEK) {
          if (constraint.excluded_days && constraint.excluded_days.includes(dayOfWeek)) {
            isAvailable = false;
            break;
          }
        }
      }
      
      if (isAvailable) {
        dates.push(new Date(current));
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
  
  /**
   * Assign venues to games based on home team
   * @private
   */
  static assignVenues(games) {
    return games.map(game => {
      // Get the appropriate venue for the home team and sport
      const homeTeam = game.home_team;
      const venues = Big12DataService.getVenues({
        school_id: homeTeam.school_id,
        sport_id: homeTeam.sport_id
      });
      
      // Select the first compatible venue (or enhance with venue selection logic)
      const venue = venues[0];
      
      return {
        ...game,
        venue_id: venue?.venue_id || null,
        venue: venue || null,
        location: venue ? `${venue.city}, ${venue.state}` : null
      };
    });
  }
  
  /**
   * Calculate metadata for the schedule
   * @private
   */
  static calculateMetadata(games, teams, startDate, endDate) {
    const teamStats = {};
    
    // Initialize team statistics
    teams.forEach(team => {
      teamStats[team.team_id] = {
        total_games: 0,
        home_games: 0,
        away_games: 0,
        opponents: new Set()
      };
    });
    
    // Calculate statistics
    games.forEach(game => {
      teamStats[game.home_team_id].total_games++;
      teamStats[game.home_team_id].home_games++;
      teamStats[game.home_team_id].opponents.add(game.away_team_id);
      
      teamStats[game.away_team_id].total_games++;
      teamStats[game.away_team_id].away_games++;
      teamStats[game.away_team_id].opponents.add(game.home_team_id);
    });
    
    // Convert Sets to counts
    Object.values(teamStats).forEach(stats => {
      stats.unique_opponents = stats.opponents.size;
      delete stats.opponents;
    });
    
    return {
      total_games: games.length,
      teams_count: teams.length,
      start_date: startDate,
      end_date: endDate,
      duration_days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
      team_statistics: teamStats,
      games_per_team_avg: games.length * 2 / teams.length
    };
  }
  
  /**
   * Helper: Get game time based on slot number
   * @private
   */
  static getGameTime(slotNumber) {
    const baseTimes = [
      '18:00:00', // 6 PM
      '19:00:00', // 7 PM
      '20:00:00', // 8 PM
      '14:00:00', // 2 PM (weekend)
      '16:00:00'  // 4 PM (weekend)
    ];
    
    return baseTimes[slotNumber % baseTimes.length];
  }
  
  /**
   * Helper: Group constraints by type
   * @private
   */
  static groupConstraintsByType(constraints) {
    const grouped = {};
    
    constraints.forEach(constraint => {
      if (!grouped[constraint.type]) {
        grouped[constraint.type] = [];
      }
      grouped[constraint.type].push(constraint);
    });
    
    return grouped;
  }
  
  /**
   * Helper: Shuffle array
   * @private
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Optimize existing schedule (for future enhancement)
   * @param {Object} schedule - Existing schedule to optimize
   * @param {Object} optimizationParams - Optimization parameters
   * @returns {Object} Optimized schedule
   */
  static async optimizeSchedule(schedule, optimizationParams = {}) {
    logger.info('Schedule optimization requested (not yet implemented)');
    // Placeholder for future optimization logic
    return schedule;
  }
}

module.exports = SimpleSchedulingService;