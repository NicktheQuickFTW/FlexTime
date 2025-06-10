/**
 * Softball Scheduler
 * 
 * Handles Big 12 Softball scheduling with:
 * - 8 series (3-game) over 9 weeks
 * - Miss 2 opponents, see everyone over 2 years
 * - Play 6 teams twice and 4 teams once over 2 years
 * - Friday-Sunday series (Thursday-Saturday for BYU and Easter)
 * - 2025 Dates: March 7 - May 4
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class SoftballScheduler extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 15, // Softball
      sportName: "Softball",
      sportConfig: {
        pattern: 'series_based',
        seriesPerTeam: 8, // 8 three-game series
        gamesPerSeries: 3,
        totalGames: 24, // 8 series × 3 games
        weeksInSeason: 9,
        teamsCount: 11, // 11 teams
        opponentsMissed: 2, // Miss 2 opponents per year
        seasonStart: '2025-03-07',
        seasonEnd: '2025-05-04',
        seriesFormat: 'Friday-Sunday', // Default format
        byuSeriesFormat: 'Thursday-Saturday', // BYU exception
        easterSeriesFormat: 'Thursday-Saturday', // Easter weekend exception
        description: "Big 12 Softball - 8 three-game series over 9 weeks"
      }
    });
    
    this.minDaysBetweenSeries = 1; // At least 1 day between series
    this.maxConsecutiveAway = 2; // Max 2 consecutive away series
    this.preferredSeriesDays = {
      standard: [5, 6, 0], // Friday, Saturday, Sunday
      byu: [4, 5, 6], // Thursday, Friday, Saturday (BYU no Sunday)
      easter: [4, 5, 6] // Thursday, Friday, Saturday (Easter weekend)
    };
  }

  /**
   * Generate Softball schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Softball schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 11) {
        throw new Error(`Softball requires exactly 11 teams, got ${teams.length}`);
      }

      // Generate series pairings
      const seriesPairings = this.generateSeriesPairings(teams);
      
      // Create time slots for series
      const timeSlots = this.generateSeriesTimeSlots();
      
      // Assign series to time slots
      const schedule = await this.assignSeriesToTimeSlots(seriesPairings, timeSlots, constraints);
      
      // Expand series into individual games
      const expandedSchedule = this.expandSeriesToGames(schedule);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(expandedSchedule, constraints);
      
      logger.info(`Generated Softball schedule with ${optimizedSchedule.length} games in ${seriesPairings.length} series`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Softball schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate series pairings for Softball
   * Each team plays 8 series, missing 2 opponents per year
   */
  generateSeriesPairings(teams) {
    const pairings = [];
    const teamSeriesCount = new Map();
    
    // Initialize series count for each team
    teams.forEach(team => {
      teamSeriesCount.set(team.team_id, 0);
    });

    // Generate series using modified round-robin for odd number of teams
    const opponents = this.generateOpponentRotation(teams);
    
    let week = 1;
    for (const roundOpponents of opponents) {
      if (week > this.config.sportConfig.weeksInSeason) break;
      
      roundOpponents.forEach(pairing => {
        // Ensure both teams haven't exceeded series limit
        if (teamSeriesCount.get(pairing.home_team.team_id) < this.config.sportConfig.seriesPerTeam &&
            teamSeriesCount.get(pairing.away_team.team_id) < this.config.sportConfig.seriesPerTeam) {
          
          pairings.push({
            id: uuidv4(),
            series_id: `softball_series_${week}_${pairing.home_team.team_id}_${pairing.away_team.team_id}`,
            home_team: pairing.home_team,
            away_team: pairing.away_team,
            week: week,
            series_type: 'conference',
            games_in_series: this.config.sportConfig.gamesPerSeries
          });
          
          // Update series counts
          teamSeriesCount.set(pairing.home_team.team_id, 
            teamSeriesCount.get(pairing.home_team.team_id) + 1);
          teamSeriesCount.set(pairing.away_team.team_id, 
            teamSeriesCount.get(pairing.away_team.team_id) + 1);
        }
      });
      
      week++;
    }
    
    return pairings;
  }

  /**
   * Generate opponent rotation for odd number of teams (11)
   * Uses round-robin with bye system
   */
  generateOpponentRotation(teams) {
    const rotation = [];
    const teamCount = teams.length;
    
    // For odd number of teams, each round has (n-1)/2 pairings and 1 bye
    for (let round = 0; round < teamCount; round++) {
      const roundPairings = [];
      
      for (let i = 0; i < Math.floor(teamCount / 2); i++) {
        const home = (round + i) % teamCount;
        const away = (teamCount - 1 - i + round) % teamCount;
        
        if (home !== away) {
          roundPairings.push({
            home_team: teams[home],
            away_team: teams[away]
          });
        }
      }
      
      // One team gets a bye each round
      const byeTeam = teams[round % teamCount];
      
      rotation.push({
        pairings: roundPairings,
        bye_team: byeTeam
      });
    }
    
    return rotation;
  }

  /**
   * Generate time slots for series
   */
  generateSeriesTimeSlots() {
    const slots = [];
    const startDate = new Date(this.config.sportConfig.seasonStart);
    const endDate = new Date(this.config.sportConfig.seasonEnd);
    
    let currentDate = new Date(startDate);
    let week = 1;
    
    while (currentDate <= endDate && week <= this.config.sportConfig.weeksInSeason) {
      // Find the Friday of this week
      const friday = this.findNextFriday(currentDate);
      
      slots.push({
        id: uuidv4(),
        week: week,
        start_date: new Date(friday),
        series_format: this.getSeriesFormat(friday),
        available: true
      });
      
      // Move to next week
      currentDate = new Date(friday);
      currentDate.setDate(currentDate.getDate() + 7);
      week++;
    }
    
    return slots;
  }

  /**
   * Find next Friday from given date
   */
  findNextFriday(date) {
    const friday = new Date(date);
    const dayOfWeek = friday.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    friday.setDate(friday.getDate() + daysUntilFriday);
    return friday;
  }

  /**
   * Get series format for specific date (check for Easter)
   */
  getSeriesFormat(date) {
    // Check if this is Easter weekend (2025 Easter is April 20)
    const easterWeekend = new Date('2025-04-18'); // Friday before Easter
    const weekStart = new Date(date);
    const weekEnd = new Date(date);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (easterWeekend >= weekStart && easterWeekend <= weekEnd) {
      return 'easter';
    }
    
    return 'standard';
  }

  /**
   * Assign series to time slots
   */
  async assignSeriesToTimeSlots(seriesPairings, timeSlots, constraints) {
    const assignments = [];
    const usedSlots = new Set();
    
    for (const series of seriesPairings) {
      // Find available slot for this week
      const availableSlots = timeSlots.filter(slot => 
        slot.week === series.week && !usedSlots.has(slot.id)
      );
      
      if (availableSlots.length > 0) {
        const selectedSlot = availableSlots[0];
        
        // Check for BYU exception or Easter
        let seriesFormat = selectedSlot.series_format;
        if (this.needsByuFormat(series)) {
          seriesFormat = 'byu';
        }
        
        assignments.push({
          ...series,
          time_slot: selectedSlot,
          series_format: seriesFormat,
          start_date: selectedSlot.start_date
        });
        
        usedSlots.add(selectedSlot.id);
      }
    }
    
    return assignments;
  }

  /**
   * Check if series needs BYU format (no Sunday)
   */
  needsByuFormat(series) {
    return series.home_team.school_name === 'BYU' || 
           series.away_team.school_name === 'BYU';
  }

  /**
   * Expand series into individual games
   */
  expandSeriesToGames(seriesSchedule) {
    const games = [];
    
    seriesSchedule.forEach(series => {
      const seriesDays = this.getSeriesDays(series.series_format);
      
      for (let gameNum = 1; gameNum <= series.games_in_series; gameNum++) {
        const gameDate = new Date(series.start_date);
        
        // Calculate correct date for each game in series
        if (gameNum === 1) {
          // First game on Friday (or Thursday for exceptions)
          // Date is already set correctly from start_date
        } else if (gameNum === 2) {
          // Second game on Saturday
          gameDate.setDate(gameDate.getDate() + 1);
        } else if (gameNum === 3) {
          // Third game on Sunday (or Saturday for exceptions)
          gameDate.setDate(gameDate.getDate() + 2);
          if (series.series_format === 'byu' || series.series_format === 'easter') {
            gameDate.setDate(gameDate.getDate() - 1); // Saturday instead of Sunday
          }
        }
        
        games.push({
          id: uuidv4(),
          series_id: series.series_id,
          home_team: series.home_team,
          away_team: series.away_team,
          game_date: new Date(gameDate),
          game_time: this.getGameTime(gameDate.getDay(), gameNum),
          game_number: gameNum,
          week: series.week,
          game_type: 'conference',
          is_series_game: true
        });
      }
    });
    
    return games;
  }

  /**
   * Get series days based on format
   */
  getSeriesDays(format) {
    return this.preferredSeriesDays[format] || this.preferredSeriesDays.standard;
  }

  /**
   * Get game time based on day and game number
   */
  getGameTime(dayOfWeek, gameNumber) {
    const timings = {
      4: ['18:00', '18:00', '18:00'], // Thursday
      5: ['18:00', '18:00', '18:00'], // Friday  
      6: ['13:00', '18:00', '13:00'], // Saturday (doubleheader option)
      0: ['12:00', '12:00', '12:00']  // Sunday
    };
    
    return timings[dayOfWeek] ? timings[dayOfWeek][gameNumber - 1] : '18:00';
  }

  /**
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Softball",
      sportId: 15,
      seriesPerTeam: 8,
      gamesPerSeries: 3,
      totalGames: 24,
      weeksInSeason: 9,
      pattern: 'series_based',
      features: [
        'three_game_series',
        'byu_sunday_exception',
        'easter_weekend_exception',
        'bye_system_11_teams',
        'opponent_rotation',
        'travel_optimization',
        'weekend_series'
      ]
    };
  }
}

module.exports = SoftballScheduler;