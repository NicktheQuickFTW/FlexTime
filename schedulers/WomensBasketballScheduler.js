/**
 * Women's Basketball Scheduler
 * 
 * Handles Big 12 Women's Basketball scheduling with:
 * - 18 conference games (play 3 teams 2x, 12 teams 1x)  
 * - 19 windows with 1 bye
 * - 2 games per week typically
 * - Travel partner considerations
 * - Back-to-back prevention
 * - First window Dec 21-23, next window Jan 1
 * - End date March 1, Tournament begins March 5
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class WomensBasketballScheduler extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 3, // Women's Basketball
      sportName: "Women's Basketball",
      sportConfig: {
        pattern: 'extended_round_robin',
        gamesPerTeam: 18, // 18 conference games
        gamesPerWeek: 2,
        gameWindows: 19, // 19 windows (1 bye)
        teamsToPlayTwice: 3, // 3 teams play twice
        teamsToPlayOnce: 12, // 12 teams play once
        rivalryGames: true,
        seasonStart: '2024-12-21', // First window Dec 21-23
        seasonEnd: '2025-03-01',   // End date March 1
        tournamentStart: '2025-03-05', // Tournament March 5
        daysOfWeek: [3, 6, 0], // Wed/Sat/Sun
        preferredTimes: ['14:00', '17:00', '19:00'],
        description: "Big 12 Women's Basketball - 18 conference games"
      }
    });
    
    this.minDaysBetweenGames = 1;
    this.maxConsecutiveAway = 2; // Big 12 rule: max 2 consecutive away
    this.maxGamesPerWeek = 2;
  }

  /**
   * Generate Women's Basketball schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Women's Basketball schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 16) {
        throw new Error(`Women's Basketball requires exactly 16 teams, got ${teams.length}`);
      }

      // Generate game pairings
      const gamePairings = this.generateGamePairings(teams);
      
      // Create time slots
      const timeSlots = this.generateTimeSlots();
      
      // Assign games to time slots
      const schedule = await this.assignGamesToTimeSlots(gamePairings, timeSlots, constraints);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(schedule, constraints);
      
      logger.info(`Generated Women's Basketball schedule with ${optimizedSchedule.length} games`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Women\'s Basketball schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate game pairings for Women's Basketball
   * 3 teams play twice, 12 teams play once
   */
  generateGamePairings(teams) {
    const pairings = [];
    
    // Determine which teams play twice (typically strongest programs)
    const rivalryPairs = this.getRivalryPairs(teams);
    const teamsPlayingTwice = new Set();
    
    rivalryPairs.forEach(pair => {
      teamsPlayingTwice.add(pair[0]);
      teamsPlayingTwice.add(pair[1]);
    });
    
    // Generate twice games for top teams
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Check if these teams should play twice
        if (this.shouldPlayTwice(team1, team2, rivalryPairs)) {
          // Home and away games
          pairings.push({
            id: uuidv4(),
            home_team: team1,
            away_team: team2,
            game_type: 'conference',
            is_rivalry: true
          });
          
          pairings.push({
            id: uuidv4(),
            home_team: team2,
            away_team: team1,
            game_type: 'conference', 
            is_rivalry: true
          });
        } else if (this.shouldPlayOnce(team1, team2, teamsPlayingTwice)) {
          // Single game (alternating home/away each year)
          const isTeam1Home = this.determineHomeTeam(team1, team2);
          
          pairings.push({
            id: uuidv4(),
            home_team: isTeam1Home ? team1 : team2,
            away_team: isTeam1Home ? team2 : team1,
            game_type: 'conference',
            is_rivalry: false
          });
        }
      }
    }
    
    return pairings;
  }

  /**
   * Generate time slots for Women's Basketball
   */
  generateTimeSlots() {
    const slots = [];
    const startDate = new Date(this.config.sportConfig.seasonStart);
    const endDate = new Date(this.config.sportConfig.seasonEnd);
    
    let currentDate = new Date(startDate);
    let windowCount = 0;
    
    while (currentDate <= endDate && windowCount < this.config.sportConfig.gameWindows) {
      // Check if this day is a valid game day
      const dayOfWeek = currentDate.getDay();
      
      if (this.config.sportConfig.daysOfWeek.includes(dayOfWeek)) {
        this.config.sportConfig.preferredTimes.forEach(time => {
          slots.push({
            id: uuidv4(),
            date: new Date(currentDate),
            time: time,
            day_of_week: dayOfWeek,
            window: Math.floor(windowCount / 2) + 1,
            available: true
          });
        });
        
        // Include bye week logic
        if (windowCount === 9) { // Mid-season bye
          currentDate.setDate(currentDate.getDate() + 7); // Skip a week
        }
        
        windowCount++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return slots;
  }

  /**
   * Get rivalry pairs for Women's Basketball
   */
  getRivalryPairs(teams) {
    // Define traditional Big 12 women's basketball rivalries/top programs
    const rivalries = [
      ['Baylor', 'Texas Tech'], // Regional rivalry
      ['Kansas', 'Kansas State'], // Sunflower Showdown
      ['Iowa State', 'Oklahoma State'] // Traditional matchup
    ];
    
    return rivalries.filter(rivalry => {
      const team1 = teams.find(t => t.school_name === rivalry[0]);
      const team2 = teams.find(t => t.school_name === rivalry[1]);
      return team1 && team2;
    }).map(rivalry => [
      teams.find(t => t.school_name === rivalry[0]),
      teams.find(t => t.school_name === rivalry[1])
    ]);
  }

  /**
   * Check if two teams should play twice
   */
  shouldPlayTwice(team1, team2, rivalryPairs) {
    return rivalryPairs.some(pair => 
      (pair[0].team_id === team1.team_id && pair[1].team_id === team2.team_id) ||
      (pair[0].team_id === team2.team_id && pair[1].team_id === team1.team_id)
    );
  }

  /**
   * Check if two teams should play once
   */
  shouldPlayOnce(team1, team2, teamsPlayingTwice) {
    // Play once if neither team is in the "play twice" group
    return !teamsPlayingTwice.has(team1.team_id) || !teamsPlayingTwice.has(team2.team_id);
  }

  /**
   * Determine home team for single games
   */
  determineHomeTeam(team1, team2) {
    // Simple alternating logic (in production, use historical data)
    return team1.team_id % 2 === 1; // Different from men's for balance
  }

  /**
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Women's Basketball",
      sportId: 3,
      gamesPerTeam: 18,
      gameWindows: 19,
      pattern: 'extended_round_robin',
      features: [
        'rivalry_games',
        'bye_weeks',
        'travel_optimization', 
        'tv_windows',
        'back_to_back_prevention'
      ]
    };
  }
}

module.exports = WomensBasketballScheduler;