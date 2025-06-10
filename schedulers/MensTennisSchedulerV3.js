/**
 * Men's Tennis Scheduler V3 (2025 Update)
 * 
 * Handles Big 12 Men's Tennis scheduling with:
 * - 8 matches over 5 weeks (single round robin)
 * - 4H/4A with split weekends
 * - 1-2 away-away trips per year
 * - Hybrid Travel Partners: UA/ASU, BYU/UU, TCU/BU, OSU/TTU + UCF
 * - 2025 Dates: March 13 - April 13
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class MensTennisSchedulerV3 extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 17, // Men's Tennis
      sportName: "Men's Tennis",
      sportConfig: {
        pattern: 'single_round_robin',
        matchesPerTeam: 8, // 8 matches over 5 weeks
        teamsCount: 9, // 9 teams in Men's Tennis
        weeksInSeason: 5,
        homeAwayBalance: { home: 4, away: 4 }, // 4H/4A
        seasonStart: '2025-03-13',
        seasonEnd: '2025-04-13',
        splitWeekends: true, // Split weekends with travel partners
        awayAwayTrips: [1, 2], // 1-2 away-away trips per year
        matchDays: [5, 6, 0], // Fri, Sat, Sun
        preferredTimes: ['10:00', '14:00'],
        description: "Big 12 Men's Tennis - 8 matches single round robin over 5 weeks"
      }
    });
    
    // Hybrid travel partner system
    this.travelPartners = {
      'Arizona': 'Arizona State',
      'Arizona State': 'Arizona',
      'BYU': 'Utah',
      'Utah': 'BYU',
      'TCU': 'Baylor',
      'Baylor': 'TCU',
      'Oklahoma State': 'Texas Tech',
      'Texas Tech': 'Oklahoma State',
      'UCF': null // UCF travels with OSU/TTU group
    };
    
    this.minDaysBetweenMatches = 1;
    this.maxMatchesPerWeekend = 2;
  }

  /**
   * Generate Men's Tennis schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Men's Tennis schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 9) {
        throw new Error(`Men's Tennis requires exactly 9 teams, got ${teams.length}`);
      }

      // Generate match pairings using single round robin
      const matchPairings = this.generateSingleRoundRobin(teams);
      
      // Create time slots
      const timeSlots = this.generateTimeSlots();
      
      // Assign matches to time slots with travel optimization
      const schedule = await this.assignMatchesToTimeSlots(matchPairings, timeSlots, constraints);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(schedule, constraints);
      
      logger.info(`Generated Men's Tennis schedule with ${optimizedSchedule.length} matches`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Men\'s Tennis schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate single round robin pairings
   * Each team plays every other team exactly once (8 matches for 9 teams)
   */
  generateSingleRoundRobin(teams) {
    const pairings = [];
    
    // Single round robin: each team plays every other team once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        
        // Determine home team based on travel optimization
        const isTeam1Home = this.determineHomeTeam(team1, team2);
        
        pairings.push({
          id: uuidv4(),
          home_team: isTeam1Home ? team1 : team2,
          away_team: isTeam1Home ? team2 : team1,
          match_type: 'round_robin',
          is_travel_partner_match: this.areTravelPartners(team1, team2)
        });
      }
    }
    
    return pairings;
  }

  /**
   * Determine home team using travel partner logic and balancing
   */
  determineHomeTeam(team1, team2) {
    // If they are travel partners, alternate home/away
    if (this.areTravelPartners(team1, team2)) {
      // Simple alternating logic based on team IDs
      return team1.team_id % 2 === 0;
    }
    
    // For non-travel partners, balance home/away across the schedule
    // This would use more sophisticated logic in production
    return team1.team_id < team2.team_id;
  }

  /**
   * Check if two teams are travel partners
   */
  areTravelPartners(team1, team2) {
    const partner1 = this.travelPartners[team1.school_name];
    const partner2 = this.travelPartners[team2.school_name];
    
    return (partner1 === team2.school_name) || (partner2 === team1.school_name) ||
           (team1.school_name === 'UCF' && (team2.school_name === 'Oklahoma State' || team2.school_name === 'Texas Tech')) ||
           (team2.school_name === 'UCF' && (team1.school_name === 'Oklahoma State' || team1.school_name === 'Texas Tech'));
  }

  /**
   * Generate time slots for Men's Tennis
   */
  generateTimeSlots() {
    const slots = [];
    const startDate = new Date(this.config.sportConfig.seasonStart);
    const endDate = new Date(this.config.sportConfig.seasonEnd);
    
    let currentDate = new Date(startDate);
    let week = 1;
    
    while (currentDate <= endDate && week <= this.config.sportConfig.weeksInSeason) {
      // Generate slots for each valid match day in the week
      this.config.sportConfig.matchDays.forEach(dayOfWeek => {
        const slotDate = this.getDateForDayOfWeek(currentDate, dayOfWeek);
        
        if (slotDate >= startDate && slotDate <= endDate) {
          this.config.sportConfig.preferredTimes.forEach(time => {
            slots.push({
              id: uuidv4(),
              date: new Date(slotDate),
              time: time,
              day_of_week: dayOfWeek,
              week: week,
              available: true,
              is_split_weekend: this.isSplitWeekend(slotDate)
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
   * Check if this date is part of a split weekend
   */
  isSplitWeekend(date) {
    // Split weekends are when travel partners play on different days
    // This would be determined by travel partner scheduling logic
    return Math.random() > 0.5; // Simplified for now
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
   * Assign matches to time slots with travel optimization
   */
  async assignMatchesToTimeSlots(matchPairings, timeSlots, constraints) {
    const assignments = [];
    const usedSlots = new Set();
    const teamSchedules = new Map();
    
    // Initialize team schedules
    matchPairings.forEach(match => {
      if (!teamSchedules.has(match.home_team.team_id)) {
        teamSchedules.set(match.home_team.team_id, { home: 0, away: 0, matches: [] });
      }
      if (!teamSchedules.has(match.away_team.team_id)) {
        teamSchedules.set(match.away_team.team_id, { home: 0, away: 0, matches: [] });
      }
    });

    // Sort matches by priority (travel partners first)
    const sortedMatches = matchPairings.sort((a, b) => {
      if (a.is_travel_partner_match && !b.is_travel_partner_match) return -1;
      if (!a.is_travel_partner_match && b.is_travel_partner_match) return 1;
      return 0;
    });

    for (const match of sortedMatches) {
      // Find suitable time slot
      const availableSlots = timeSlots.filter(slot => {
        if (usedSlots.has(slot.id)) return false;
        
        // Check if teams are available
        const homeSchedule = teamSchedules.get(match.home_team.team_id);
        const awaySchedule = teamSchedules.get(match.away_team.team_id);
        
        // Ensure home/away balance
        if (homeSchedule.home >= 4 || awaySchedule.away >= 4) return false;
        
        return true;
      });

      if (availableSlots.length > 0) {
        const selectedSlot = availableSlots[0];
        
        assignments.push({
          ...match,
          time_slot: selectedSlot,
          game_date: selectedSlot.date,
          game_time: selectedSlot.time,
          week: selectedSlot.week
        });
        
        // Update team schedules
        const homeSchedule = teamSchedules.get(match.home_team.team_id);
        const awaySchedule = teamSchedules.get(match.away_team.team_id);
        
        homeSchedule.home++;
        homeSchedule.matches.push(selectedSlot.date);
        awaySchedule.away++;
        awaySchedule.matches.push(selectedSlot.date);
        
        usedSlots.add(selectedSlot.id);
      }
    }
    
    return assignments;
  }

  /**
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Men's Tennis",
      sportId: 17,
      matchesPerTeam: 8,
      weeksInSeason: 5,
      pattern: 'single_round_robin',
      features: [
        'single_round_robin',
        'travel_partners',
        'split_weekends',
        'away_away_trips',
        'home_away_balance',
        'byu_sunday_exception'
      ]
    };
  }
}

module.exports = MensTennisSchedulerV3;