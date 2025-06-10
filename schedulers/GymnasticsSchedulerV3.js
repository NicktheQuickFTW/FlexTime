/**
 * Gymnastics Scheduler V3 (2025 Update)
 * 
 * Handles Big 12 Gymnastics scheduling with:
 * - Full round robin format (each team meets every other team)
 * - 7 teams total (6 Big 12 + 1 affiliate Denver)
 * - Meet-based format with multiple teams per meet
 * - Weekend meets primarily
 * - Travel optimization for efficiency
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class GymnasticsSchedulerV3 extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 11, // Gymnastics
      sportName: "Gymnastics",
      sportConfig: {
        pattern: 'round_robin_meets',
        teamsCount: 7, // Arizona, Arizona State, BYU, Iowa State, Utah, West Virginia, Denver
        meetsPerTeam: 6, // Each team attends 6 meets to face all others
        totalMeets: 12, // Total meets in the season
        seasonStart: '2025-01-10',
        seasonEnd: '2025-03-20',
        meetDays: [5, 6], // Friday and Saturday primarily
        preferredTimes: ['19:00', '14:00'],
        teamsPerMeet: [2, 3, 4], // Meets can have 2, 3, or 4 teams
        description: "Big 12 Gymnastics - Round robin meets with 7 teams"
      }
    });
    
    // Team list for Gymnastics
    this.gymnasticsTeams = [
      'Arizona', 'Arizona State', 'BYU', 'Iowa State', 
      'Utah', 'West Virginia', 'Denver'
    ];
    
    // Regional groupings for travel optimization
    this.regionalGroups = {
      'Mountain': ['BYU', 'Utah', 'Denver'],
      'Desert': ['Arizona', 'Arizona State'],
      'Central': ['Iowa State'],
      'East': ['West Virginia']
    };
  }

  /**
   * Generate Gymnastics schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Gymnastics schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 7) {
        throw new Error(`Gymnastics requires exactly 7 teams, got ${teams.length}`);
      }

      // Generate meet combinations using round robin logic
      const meets = this.generateRoundRobinMeets(teams);
      
      // Create time slots
      const timeSlots = this.generateTimeSlots();
      
      // Assign meets to time slots
      const schedule = await this.assignMeetsToTimeSlots(meets, timeSlots, constraints);
      
      // Expand meets into individual matchups
      const expandedSchedule = this.expandMeetsToMatchups(schedule);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(expandedSchedule, constraints);
      
      logger.info(`Generated Gymnastics schedule with ${optimizedSchedule.length} matchups in ${meets.length} meets`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Gymnastics schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate round robin meets
   * Ensure each team faces every other team exactly once
   */
  generateRoundRobinMeets(teams) {
    const meets = [];
    const teamPairings = this.generateAllPairings(teams);
    const teamMeetCounts = new Map();
    
    // Initialize meet counts
    teams.forEach(team => {
      teamMeetCounts.set(team.team_id, 0);
    });

    // Create meets with 2-4 teams each, ensuring round robin coverage
    let meetNumber = 1;
    const usedPairings = new Set();
    
    while (usedPairings.size < teamPairings.length) {
      const meet = this.createOptimalMeet(teams, teamPairings, usedPairings, teamMeetCounts);
      
      if (meet.participants.length >= 2) {
        meet.meet_id = `gymnastics_meet_${meetNumber}`;
        meet.meet_number = meetNumber;
        meets.push(meet);
        
        // Update meet counts
        meet.participants.forEach(team => {
          teamMeetCounts.set(team.team_id, teamMeetCounts.get(team.team_id) + 1);
        });
        
        // Mark pairings as used
        this.markPairingsAsUsed(meet.participants, usedPairings);
        meetNumber++;
      } else {
        break; // Safety break if no valid meet can be created
      }
    }
    
    return meets;
  }

  /**
   * Generate all possible team pairings
   */
  generateAllPairings(teams) {
    const pairings = [];
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairings.push({
          team1: teams[i],
          team2: teams[j],
          pairingId: `${teams[i].team_id}_${teams[j].team_id}`
        });
      }
    }
    
    return pairings;
  }

  /**
   * Create optimal meet with 2-4 teams
   */
  createOptimalMeet(teams, allPairings, usedPairings, teamMeetCounts) {
    const availableTeams = teams.filter(team => 
      teamMeetCounts.get(team.team_id) < this.config.sportConfig.meetsPerTeam
    );
    
    if (availableTeams.length < 2) {
      return { participants: [] };
    }

    // Try to create meets with regional groupings first for travel efficiency
    const regionalMeet = this.tryRegionalMeet(availableTeams, usedPairings);
    if (regionalMeet.participants.length >= 2) {
      return regionalMeet;
    }
    
    // Otherwise, create meet with available teams that haven't faced each other
    const meetParticipants = [];
    
    // Start with first available team
    meetParticipants.push(availableTeams[0]);
    
    // Add teams that haven't faced the first team yet
    for (let i = 1; i < availableTeams.length && meetParticipants.length < 4; i++) {
      const candidateTeam = availableTeams[i];
      
      // Check if this team can be added (hasn't faced all current participants)
      const canAdd = meetParticipants.every(existingTeam => {
        const pairingId1 = `${existingTeam.team_id}_${candidateTeam.team_id}`;
        const pairingId2 = `${candidateTeam.team_id}_${existingTeam.team_id}`;
        return !usedPairings.has(pairingId1) && !usedPairings.has(pairingId2);
      });
      
      if (canAdd) {
        meetParticipants.push(candidateTeam);
      }
    }
    
    return {
      participants: meetParticipants,
      meet_type: 'round_robin',
      region: this.determineMeetRegion(meetParticipants)
    };
  }

  /**
   * Try to create a regional meet for travel efficiency
   */
  tryRegionalMeet(availableTeams, usedPairings) {
    for (const [region, regionTeams] of Object.entries(this.regionalGroups)) {
      const regionAvailableTeams = availableTeams.filter(team => 
        regionTeams.includes(team.school_name)
      );
      
      if (regionAvailableTeams.length >= 2) {
        // Check if these teams can meet (haven't faced each other)
        const canMeet = this.canTeamsMeet(regionAvailableTeams, usedPairings);
        
        if (canMeet) {
          return {
            participants: regionAvailableTeams.slice(0, Math.min(4, regionAvailableTeams.length)),
            meet_type: 'regional',
            region: region
          };
        }
      }
    }
    
    return { participants: [] };
  }

  /**
   * Check if teams can meet (haven't all faced each other)
   */
  canTeamsMeet(teams, usedPairings) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const pairingId1 = `${teams[i].team_id}_${teams[j].team_id}`;
        const pairingId2 = `${teams[j].team_id}_${teams[i].team_id}`;
        
        if (!usedPairings.has(pairingId1) && !usedPairings.has(pairingId2)) {
          return true; // At least one new pairing exists
        }
      }
    }
    return false;
  }

  /**
   * Mark pairings as used
   */
  markPairingsAsUsed(participants, usedPairings) {
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const pairingId1 = `${participants[i].team_id}_${participants[j].team_id}`;
        const pairingId2 = `${participants[j].team_id}_${participants[i].team_id}`;
        usedPairings.add(pairingId1);
        usedPairings.add(pairingId2);
      }
    }
  }

  /**
   * Determine meet region based on participants
   */
  determineMeetRegion(participants) {
    const regions = participants.map(team => {
      for (const [region, regionTeams] of Object.entries(this.regionalGroups)) {
        if (regionTeams.includes(team.school_name)) {
          return region;
        }
      }
      return 'Unknown';
    });
    
    // Return most common region or 'Mixed' if diverse
    const regionCounts = regions.reduce((acc, region) => {
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});
    
    const topRegion = Object.keys(regionCounts).reduce((a, b) => 
      regionCounts[a] > regionCounts[b] ? a : b
    );
    
    return regionCounts[topRegion] === participants.length ? topRegion : 'Mixed';
  }

  /**
   * Generate time slots for Gymnastics
   */
  generateTimeSlots() {
    const slots = [];
    const startDate = new Date(this.config.sportConfig.seasonStart);
    const endDate = new Date(this.config.sportConfig.seasonEnd);
    
    let currentDate = new Date(startDate);
    let week = 1;
    
    while (currentDate <= endDate) {
      this.config.sportConfig.meetDays.forEach(dayOfWeek => {
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
   * Expand meets into individual matchups
   */
  expandMeetsToMatchups(meetSchedule) {
    const matchups = [];
    
    meetSchedule.forEach(meet => {
      // In gymnastics, each meet creates matchups between all participating teams
      for (let i = 0; i < meet.participants.length; i++) {
        for (let j = i + 1; j < meet.participants.length; j++) {
          matchups.push({
            id: uuidv4(),
            meet_id: meet.meet_id,
            team1: meet.participants[i],
            team2: meet.participants[j],
            host_team: meet.host_team || meet.participants[0], // First team hosts by default
            meet_date: meet.meet_date,
            meet_time: meet.meet_time,
            meet_type: meet.meet_type,
            region: meet.region,
            game_type: 'meet'
          });
        }
      }
    });
    
    return matchups;
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
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Gymnastics",
      sportId: 11,
      teamsCount: 7,
      meetsPerTeam: 6,
      totalMeets: 12,
      pattern: 'round_robin_meets',
      features: [
        'round_robin_format',
        'multi_team_meets',
        'regional_optimization',
        'travel_efficiency',
        'weekend_meets'
      ]
    };
  }
}

module.exports = GymnasticsSchedulerV3;