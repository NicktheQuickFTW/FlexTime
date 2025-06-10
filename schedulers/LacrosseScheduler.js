/**
 * Lacrosse Scheduler (2025)
 * 
 * Handles Big 12 Lacrosse scheduling with:
 * - 6 teams total (3 Big 12 + 3 affiliates)
 * - Round robin format - each team plays every other team once
 * - 5 games per team (since 6 teams = 5 opponents each)
 * - 1 game per week - straightforward scheduling
 * - Teams: Cincinnati, Colorado, Arizona State, Florida, San Diego State, UC Davis
 * - Mix of full members and affiliate members
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class LacrosseScheduler extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 13, // Lacrosse
      sportName: "Lacrosse",
      sportConfig: {
        pattern: 'simple_round_robin',
        gamesPerTeam: 5, // Each team plays 5 games (5 opponents)
        teamsCount: 6, // 6 teams total
        totalGames: 15, // 6 teams × 5 games / 2 = 15 total games
        weeksInSeason: 9, // Spread over 9 weeks (Feb-Apr)
        gamesPerWeek: 1, // 1 game per week per team maximum
        seasonStart: '2025-02-07',
        seasonEnd: '2025-04-04',
        gameDays: [5, 6, 0], // Fri, Sat, Sun
        preferredTimes: ['14:00', '19:00'],
        description: "Big 12 Lacrosse - 6 teams round robin, 5 games each"
      }
    });
    
    // Lacrosse teams (3 Big 12 + 3 affiliates)
    this.lacrosseTeams = [
      'Cincinnati',     // Big 12 full member
      'Colorado',       // Big 12 full member  
      'Arizona State',  // Big 12 full member
      'Florida',        // Affiliate
      'San Diego State', // Affiliate (note: "San Diego State" not "SDSU" per data)
      'UC Davis'        // Affiliate
    ];
    
    // Conference status for reference
    this.teamStatus = {
      'Cincinnati': 'full_member',
      'Colorado': 'full_member',
      'Arizona State': 'full_member',
      'Florida': 'affiliate',
      'San Diego State': 'affiliate', 
      'UC Davis': 'affiliate'
    };
    
    this.minDaysBetweenGames = 6; // At least 6 days between games (roughly weekly)
    this.maxConsecutiveAway = 2; // Max 2 consecutive away games
  }

  /**
   * Generate Lacrosse schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Lacrosse schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 6) {
        throw new Error(`Lacrosse requires exactly 6 teams, got ${teams.length}`);
      }

      // Generate round robin pairings
      const gamePairings = this.generateRoundRobinPairings(teams);
      
      // Create time slots
      const timeSlots = this.generateTimeSlots();
      
      // Assign games to time slots
      const schedule = await this.assignGamesToTimeSlots(gamePairings, timeSlots, constraints);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(schedule, constraints);
      
      logger.info(`Generated Lacrosse schedule with ${optimizedSchedule.length} games`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Lacrosse schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate round robin pairings
   * Each team plays every other team exactly once
   */
  generateRoundRobinPairings(teams) {
    const pairings = [];
    
    // Simple round robin: each team plays every other team once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Determine home team using alternating logic and member priority
        const isTeam1Home = this.determineHomeTeam(team1, team2);
        
        pairings.push({
          id: uuidv4(),
          home_team: isTeam1Home ? team1 : team2,
          away_team: isTeam1Home ? team2 : team1,
          game_type: 'conference',
          pairing_key: `${Math.min(team1.team_id, team2.team_id)}_${Math.max(team1.team_id, team2.team_id)}`
        });
      }
    }
    
    return pairings;
  }

  /**
   * Determine home team using conference status and balance
   */
  determineHomeTeam(team1, team2) {
    const team1Status = this.getTeamStatus(team1.school_name);
    const team2Status = this.getTeamStatus(team2.school_name);
    
    // If one is full member and other is affiliate, full member hosts
    if (team1Status === 'full_member' && team2Status === 'affiliate') {
      return true; // team1 hosts
    }
    if (team2Status === 'full_member' && team1Status === 'affiliate') {
      return false; // team2 hosts
    }
    
    // If both same status, use simple alternating logic
    return team1.team_id % 2 === 0;
  }

  /**
   * Get team conference status
   */
  getTeamStatus(schoolName) {
    return this.teamStatus[schoolName] || 'affiliate';
  }

  /**
   * Generate time slots for Lacrosse
   */
  generateTimeSlots() {
    const slots = [];
    const startDate = new Date(this.config.sportConfig.seasonStart);
    const endDate = new Date(this.config.sportConfig.seasonEnd);
    
    let currentDate = new Date(startDate);
    let week = 1;
    
    while (currentDate <= endDate && week <= this.config.sportConfig.weeksInSeason) {
      // Generate slots for each valid game day in the week
      this.config.sportConfig.gameDays.forEach(dayOfWeek => {
        const slotDate = this.getDateForDayOfWeek(currentDate, dayOfWeek);
        
        if (slotDate >= startDate && slotDate <= endDate) {
          this.config.sportConfig.preferredTimes.forEach(time => {
            slots.push({
              id: uuidv4(),
              date: new Date(slotDate),
              time: time,
              day_of_week: dayOfWeek,
              week: week,
              available: true
            });
          });
        }
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
      week++;
    }
    
    return slots;
  }

  /**
   * Get date for specific day of week in current week
   */
  getDateForDayOfWeek(baseDate, targetDayOfWeek) {
    const date = new Date(baseDate);
    const currentDayOfWeek = date.getDay();
    const daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  /**
   * Assign games to time slots with constraints
   */
  async assignGamesToTimeSlots(gamePairings, timeSlots, constraints) {
    const assignments = [];
    const usedSlots = new Set();
    const teamSchedules = new Map();
    
    // Initialize team schedules tracking
    gamePairings.forEach(game => {
      if (!teamSchedules.has(game.home_team.team_id)) {
        teamSchedules.set(game.home_team.team_id, { 
          games: [], 
          home: 0, 
          away: 0, 
          lastGameDate: null 
        });
      }
      if (!teamSchedules.has(game.away_team.team_id)) {
        teamSchedules.set(game.away_team.team_id, { 
          games: [], 
          home: 0, 
          away: 0, 
          lastGameDate: null 
        });
      }
    });

    // Sort games to prioritize affiliate matchups (travel efficiency)
    const sortedGames = this.prioritizeGames(gamePairings);

    for (const game of sortedGames) {
      // Find suitable time slot
      const availableSlots = timeSlots.filter(slot => {
        if (usedSlots.has(slot.id)) return false;
        
        // Check minimum days between games for both teams
        const homeSchedule = teamSchedules.get(game.home_team.team_id);
        const awaySchedule = teamSchedules.get(game.away_team.team_id);
        
        if (homeSchedule.lastGameDate) {
          const daysDiff = Math.abs(slot.date - homeSchedule.lastGameDate) / (1000 * 60 * 60 * 24);
          if (daysDiff < this.minDaysBetweenGames) return false;
        }
        
        if (awaySchedule.lastGameDate) {
          const daysDiff = Math.abs(slot.date - awaySchedule.lastGameDate) / (1000 * 60 * 60 * 24);
          if (daysDiff < this.minDaysBetweenGames) return false;
        }
        
        return true;
      });

      if (availableSlots.length > 0) {
        // Select earliest available slot
        const selectedSlot = availableSlots.sort((a, b) => a.date - b.date)[0];
        
        assignments.push({
          ...game,
          time_slot: selectedSlot,
          game_date: selectedSlot.date,
          game_time: selectedSlot.time,
          week: selectedSlot.week
        });
        
        // Update team schedules
        const homeSchedule = teamSchedules.get(game.home_team.team_id);
        const awaySchedule = teamSchedules.get(game.away_team.team_id);
        
        homeSchedule.home++;
        homeSchedule.games.push(selectedSlot.date);
        homeSchedule.lastGameDate = selectedSlot.date;
        
        awaySchedule.away++;
        awaySchedule.games.push(selectedSlot.date);
        awaySchedule.lastGameDate = selectedSlot.date;
        
        usedSlots.add(selectedSlot.id);
      }
    }
    
    return assignments;
  }

  /**
   * Prioritize games for optimal scheduling
   * Prioritize affiliate vs affiliate matchups for travel efficiency
   */
  prioritizeGames(gamePairings) {
    return gamePairings.sort((a, b) => {
      const aHomeStatus = this.getTeamStatus(a.home_team.school_name);
      const aAwayStatus = this.getTeamStatus(a.away_team.school_name);
      const bHomeStatus = this.getTeamStatus(b.home_team.school_name);
      const bAwayStatus = this.getTeamStatus(b.away_team.school_name);
      
      // Prioritize affiliate vs affiliate games
      const aIsAffiliateMatchup = (aHomeStatus === 'affiliate' && aAwayStatus === 'affiliate');
      const bIsAffiliateMatchup = (bHomeStatus === 'affiliate' && bAwayStatus === 'affiliate');
      
      if (aIsAffiliateMatchup && !bIsAffiliateMatchup) return -1;
      if (!aIsAffiliateMatchup && bIsAffiliateMatchup) return 1;
      
      // Then prioritize full member vs full member
      const aIsFullMemberMatchup = (aHomeStatus === 'full_member' && aAwayStatus === 'full_member');
      const bIsFullMemberMatchup = (bHomeStatus === 'full_member' && bAwayStatus === 'full_member');
      
      if (aIsFullMemberMatchup && !bIsFullMemberMatchup) return -1;
      if (!aIsFullMemberMatchup && bIsFullMemberMatchup) return 1;
      
      return 0; // Equal priority
    });
  }

  /**
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Lacrosse",
      sportId: 13,
      teamsCount: 6,
      gamesPerTeam: 5,
      totalGames: 15,
      weeksInSeason: 9,
      pattern: 'simple_round_robin',
      features: [
        'round_robin_format',
        'mixed_membership', // Full members + affiliates
        'weekly_games',
        'travel_optimization',
        'constraint_aware'
      ]
    };
  }
}

module.exports = LacrosseScheduler;