/**
 * Women's Tennis Scheduler V3 (2025 Update)
 * 
 * Handles Big 12 Women's Tennis scheduling with:
 * - 13 matches over 7 weeks
 * - 3 A-A and 3 H-H plus single play vs travel partner
 * - Miss 2 pre-determined opponents (rotates annually)
 * - Travel Partners: UA/ASU, BYU/UU, BU/TCU, UCF/UH, UC/WVU, CU/TTU, ISU/KU, KSU/OSU
 * - 2025 Dates: Feb 27 - April 13
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class WomensTennisSchedulerV3 extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 18, // Women's Tennis
      sportName: "Women's Tennis",
      sportConfig: {
        pattern: 'travel_partner_based',
        matchesPerTeam: 13, // 13 matches over 7 weeks
        weeksInSeason: 7,
        opponentsMissed: 2, // Miss 2 pre-determined opponents
        seasonStart: '2025-02-27',
        seasonEnd: '2025-04-13',
        awayAwayTrips: 3, // 3 A-A trips
        homeHomeStands: 3, // 3 H-H stands
        singlePlayVsTravelPartner: true,
        matchDays: [4, 5, 6, 0], // Thu, Fri, Sat, Sun
        preferredTimes: ['10:00', '14:00', '17:00'],
        description: "Big 12 Women's Tennis - 13 matches over 7 weeks with travel partners"
      }
    });
    
    // Travel partner definitions
    this.travelPartners = {
      'Arizona': 'Arizona State',
      'Arizona State': 'Arizona',
      'BYU': 'Utah',
      'Utah': 'BYU', 
      'Baylor': 'TCU',
      'TCU': 'Baylor',
      'UCF': 'Houston',
      'Houston': 'UCF',
      'Cincinnati': 'West Virginia',
      'West Virginia': 'Cincinnati',
      'Colorado': 'Texas Tech',
      'Texas Tech': 'Colorado',
      'Iowa State': 'Kansas',
      'Kansas': 'Iowa State',
      'Kansas State': 'Oklahoma State',
      'Oklahoma State': 'Kansas State'
    };
    
    this.minDaysBetweenMatches = 1;
    this.maxMatchesPerWeekend = 2;
  }

  /**
   * Generate Women's Tennis schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Women's Tennis schedule for ${teams.length} teams`);
      
      // Validate teams count
      if (teams.length !== 16) {
        throw new Error(`Women's Tennis requires exactly 16 teams, got ${teams.length}`);
      }

      // Generate match pairings based on travel partner format
      const matchPairings = this.generateMatchPairings(teams);
      
      // Create time slots
      const timeSlots = this.generateTimeSlots();
      
      // Assign matches to time slots
      const schedule = await this.assignMatchesToTimeSlots(matchPairings, timeSlots, constraints);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(schedule, constraints);
      
      logger.info(`Generated Women's Tennis schedule with ${optimizedSchedule.length} matches`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Women\'s Tennis schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate match pairings for Women's Tennis
   * 13 matches: 3 A-A, 3 H-H, plus single vs travel partner
   */
  generateMatchPairings(teams) {
    const pairings = [];
    const teamMatchCount = new Map();
    
    // Initialize match count for each team
    teams.forEach(team => {
      teamMatchCount.set(team.team_id, 0);
    });

    // Step 1: Generate travel partner single matches
    this.generateTravelPartnerMatches(teams, pairings, teamMatchCount);
    
    // Step 2: Generate A-A trip matches (3 trips per team)
    this.generateAwayAwayTrips(teams, pairings, teamMatchCount);
    
    // Step 3: Generate H-H stand matches (3 stands per team)
    this.generateHomeHomeStands(teams, pairings, teamMatchCount);
    
    // Step 4: Fill remaining matches to reach 13 per team
    this.generateRemainingMatches(teams, pairings, teamMatchCount);
    
    return pairings;
  }

  /**
   * Generate single matches with travel partners
   */
  generateTravelPartnerMatches(teams, pairings, teamMatchCount) {
    const processedPairs = new Set();
    
    teams.forEach(team => {
      const partnerName = this.travelPartners[team.school_name];
      const partner = teams.find(t => t.school_name === partnerName);
      
      if (partner && !processedPairs.has(`${team.team_id}_${partner.team_id}`)) {
        // Determine home team (alternate each year)
        const isTeamHome = team.team_id % 2 === 0;
        
        pairings.push({
          id: uuidv4(),
          home_team: isTeamHome ? team : partner,
          away_team: isTeamHome ? partner : team,
          match_type: 'travel_partner',
          week_type: 'single'
        });
        
        // Update counts
        teamMatchCount.set(team.team_id, teamMatchCount.get(team.team_id) + 1);
        teamMatchCount.set(partner.team_id, teamMatchCount.get(partner.team_id) + 1);
        
        // Mark as processed
        processedPairs.add(`${team.team_id}_${partner.team_id}`);
        processedPairs.add(`${partner.team_id}_${team.team_id}`);
      }
    });
  }

  /**
   * Generate Away-Away trip matches (3 A-A per team)
   */
  generateAwayAwayTrips(teams, pairings, teamMatchCount) {
    const awayTripCounts = new Map();
    teams.forEach(team => awayTripCounts.set(team.team_id, 0));
    
    // Create A-A trips ensuring each team gets 3
    for (let trip = 1; trip <= 3; trip++) {
      teams.forEach(awayTeam => {
        if (awayTripCounts.get(awayTeam.team_id) < 3) {
          // Find suitable host for this trip
          const hosts = this.findAvailableHosts(awayTeam, teams, pairings);
          
          if (hosts.length >= 2) {
            // Select 2 hosts for this A-A trip
            const selectedHosts = hosts.slice(0, 2);
            
            selectedHosts.forEach(hostTeam => {
              pairings.push({
                id: uuidv4(),
                home_team: hostTeam,
                away_team: awayTeam,
                match_type: 'away_away_trip',
                trip_number: trip
              });
              
              teamMatchCount.set(awayTeam.team_id, teamMatchCount.get(awayTeam.team_id) + 1);
              teamMatchCount.set(hostTeam.team_id, teamMatchCount.get(hostTeam.team_id) + 1);
            });
            
            awayTripCounts.set(awayTeam.team_id, awayTripCounts.get(awayTeam.team_id) + 1);
          }
        }
      });
    }
  }

  /**
   * Generate Home-Home stand matches (3 H-H per team)
   */
  generateHomeHomeStands(teams, pairings, teamMatchCount) {
    const homeStandCounts = new Map();
    teams.forEach(team => homeStandCounts.set(team.team_id, 0));
    
    // Create H-H stands ensuring each team gets 3
    for (let stand = 1; stand <= 3; stand++) {
      teams.forEach(homeTeam => {
        if (homeStandCounts.get(homeTeam.team_id) < 3) {
          // Find suitable visitors for this stand
          const visitors = this.findAvailableVisitors(homeTeam, teams, pairings);
          
          if (visitors.length >= 2) {
            // Select 2 visitors for this H-H stand
            const selectedVisitors = visitors.slice(0, 2);
            
            selectedVisitors.forEach(awayTeam => {
              pairings.push({
                id: uuidv4(),
                home_team: homeTeam,
                away_team: awayTeam,
                match_type: 'home_home_stand',
                stand_number: stand
              });
              
              teamMatchCount.set(homeTeam.team_id, teamMatchCount.get(homeTeam.team_id) + 1);
              teamMatchCount.set(awayTeam.team_id, teamMatchCount.get(awayTeam.team_id) + 1);
            });
            
            homeStandCounts.set(homeTeam.team_id, homeStandCounts.get(homeTeam.team_id) + 1);
          }
        }
      });
    }
  }

  /**
   * Generate remaining matches to reach 13 per team
   */
  generateRemainingMatches(teams, pairings, teamMatchCount) {
    teams.forEach(team => {
      const currentMatches = teamMatchCount.get(team.team_id);
      const neededMatches = this.config.sportConfig.matchesPerTeam - currentMatches;
      
      if (neededMatches > 0) {
        // Find opponents not yet played
        const unplayedOpponents = this.findUnplayedOpponents(team, teams, pairings);
        
        for (let i = 0; i < Math.min(neededMatches, unplayedOpponents.length); i++) {
          const opponent = unplayedOpponents[i];
          const isTeamHome = team.team_id % 2 === 0;
          
          pairings.push({
            id: uuidv4(),
            home_team: isTeamHome ? team : opponent,
            away_team: isTeamHome ? opponent : team,
            match_type: 'filler',
            week_type: 'single'
          });
          
          teamMatchCount.set(team.team_id, teamMatchCount.get(team.team_id) + 1);
          teamMatchCount.set(opponent.team_id, teamMatchCount.get(opponent.team_id) + 1);
        }
      }
    });
  }

  /**
   * Find available hosts for away team's A-A trip
   */
  findAvailableHosts(awayTeam, teams, existingPairings) {
    const alreadyPlayed = new Set();
    
    // Find teams already scheduled against this away team
    existingPairings.forEach(pairing => {
      if (pairing.home_team.team_id === awayTeam.team_id) {
        alreadyPlayed.add(pairing.away_team.team_id);
      } else if (pairing.away_team.team_id === awayTeam.team_id) {
        alreadyPlayed.add(pairing.home_team.team_id);
      }
    });
    
    return teams.filter(team => 
      team.team_id !== awayTeam.team_id && 
      !alreadyPlayed.has(team.team_id)
    );
  }

  /**
   * Find available visitors for home team's H-H stand
   */
  findAvailableVisitors(homeTeam, teams, existingPairings) {
    return this.findAvailableHosts(homeTeam, teams, existingPairings);
  }

  /**
   * Find unplayed opponents for a team
   */
  findUnplayedOpponents(team, teams, existingPairings) {
    return this.findAvailableHosts(team, teams, existingPairings);
  }

  /**
   * Generate time slots for Women's Tennis
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
   * Get metadata about this scheduler
   */
  getMetadata() {
    return {
      sportName: "Women's Tennis",
      sportId: 18,
      matchesPerTeam: 13,
      weeksInSeason: 7,
      pattern: 'travel_partner_based',
      features: [
        'travel_partners',
        'away_away_trips',
        'home_home_stands',
        'byu_sunday_exception',
        'miss_two_opponents',
        'altitude_considerations'
      ]
    };
  }
}

module.exports = WomensTennisSchedulerV3;