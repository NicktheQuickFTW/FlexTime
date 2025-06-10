/**
 * Baseball Scheduler
 * 
 * Handles Big 12 Baseball scheduling with:
 * - 10 series (3-game) over 10 weeks
 * - 14 teams (no byes needed)
 * - Miss 3 opponents, see everyone over 2 years
 * - Friday-Sunday series (Thursday-Saturday for BYU and final weekend)
 * - 2025 Dates: March 14 - May 17
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BaseballScheduler extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 1, // Baseball
      sportName: "Baseball",
      sportConfig: {
        pattern: 'series_based',
        seriesPerTeam: 10, // 10 three-game series
        gamesPerSeries: 3,
        totalGames: 30, // 10 series × 3 games
        weeksInSeason: 10,
        teamsCount: 14, // 14 teams (even number = no byes)
        opponentsMissed: 3, // Miss 3 opponents per year
        seasonStart: '2025-03-14',
        seasonEnd: '2025-05-17',
        seriesFormat: 'Friday-Sunday', // Default format
        byuSeriesFormat: 'Thursday-Saturday', // BYU exception
        finalWeekendFormat: 'Thursday-Saturday', // Final weekend exception
        description: "Big 12 Baseball - 10 three-game series over 10 weeks"
      }
    });
    
    this.minDaysBetweenSeries = 1; // At least 1 day between series
    this.maxConsecutiveAway = 2; // Max 2 consecutive away series
    this.preferredSeriesDays = {
      standard: [5, 6, 0], // Friday, Saturday, Sunday
      byu: [4, 5, 6], // Thursday, Friday, Saturday (BYU no Sunday)
      final: [4, 5, 6] // Thursday, Friday, Saturday (final weekend)
    };
  }

  /**
   * Generate Baseball schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Baseball schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 14) {
        throw new Error(`Baseball requires exactly 14 teams, got ${teams.length}`);
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
      
      logger.info(`Generated Baseball schedule with ${optimizedSchedule.length} games in ${seriesPairings.length} series`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Baseball schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate series pairings for Baseball
   * Each team plays 10 series, missing 3 opponents
   */
  generateSeriesPairings(teams) {
    const pairings = [];
    const teamSeriesCount = new Map();
    
    // Initialize series count for each team
    teams.forEach(team => {
      teamSeriesCount.set(team.team_id, 0);
    });

    // Generate series using round-robin with opponent rotation
    const opponents = this.generateOpponentRotation(teams);
    
    for (let week = 0; week < this.config.sportConfig.weeksInSeason; week++) {
      const weekPairings = this.generateWeekPairings(teams, opponents, week);
      
      weekPairings.forEach(pairing => {
        // Ensure both teams haven't exceeded series limit
        if (teamSeriesCount.get(pairing.home_team.team_id) < this.config.sportConfig.seriesPerTeam &&
            teamSeriesCount.get(pairing.away_team.team_id) < this.config.sportConfig.seriesPerTeam) {
          
          pairings.push({
            id: uuidv4(),
            series_id: `series_${week + 1}_${pairing.home_team.team_id}_${pairing.away_team.team_id}`,
            home_team: pairing.home_team,
            away_team: pairing.away_team,
            week: week + 1,
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
    }
    
    return pairings;
  }

  /**
   * Generate opponent rotation to ensure fair distribution
   */
  generateOpponentRotation(teams) {
    const rotation = [];
    const teamCount = teams.length;
    
    // Create a rotation matrix where each team plays others over 2 years
    for (let round = 0; round < teamCount - 1; round++) {
      const roundPairings = [];
      
      for (let i = 0; i < teamCount / 2; i++) {
        const home = (round + i) % teamCount;
        const away = (teamCount - 1 - i + round) % teamCount;
        
        if (home !== away) {
          roundPairings.push({
            home: teams[home],
            away: teams[away]
          });
        }
      }
      
      rotation.push(roundPairings);
    }
    
    return rotation;
  }

  /**
   * Generate week pairings from rotation
   */
  generateWeekPairings(teams, opponents, week) {
    const pairings = [];
    const roundIndex = week % opponents.length;
    const weekPairings = opponents[roundIndex];
    
    weekPairings.forEach(pairing => {
      // Alternate home/away each year
      const isHomeYear = week % 2 === 0;
      
      pairings.push({
        home_team: isHomeYear ? pairing.home : pairing.away,
        away_team: isHomeYear ? pairing.away : pairing.home
      });
    });
    
    return pairings;
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
        series_format: this.getSeriesFormat(week),
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
   * Get series format for specific week
   */
  getSeriesFormat(week) {
    // Final weekend uses Thursday-Saturday
    if (week === this.config.sportConfig.weeksInSeason) {
      return 'final';
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
        
        // Check for BYU exception
        const seriesFormat = this.needsByuFormat(series) ? 'byu' : selectedSlot.series_format;
        
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
        gameDate.setDate(gameDate.getDate() + (gameNum - 1));
        
        // Ensure game falls on correct day
        while (!seriesDays.includes(gameDate.getDay())) {
          gameDate.setDate(gameDate.getDate() + 1);
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
      5: ['19:00', '19:00', '19:00'], // Friday  
      6: ['14:00', '19:00', '14:00'], // Saturday
      0: ['13:00', '13:00', '13:00']  // Sunday
    };
    
    return timings[dayOfWeek] ? timings[dayOfWeek][gameNumber - 1] : '19:00';
  }

  /**
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Baseball",
      sportId: 1,
      seriesPerTeam: 10,
      gamesPerSeries: 3,
      totalGames: 30,
      weeksInSeason: 10,
      pattern: 'series_based',
      features: [
        'three_game_series',
        'byu_sunday_exception',
        'opponent_rotation',
        'travel_optimization',
        'weekend_series'
      ]
    };
  }
}

module.exports = BaseballScheduler;