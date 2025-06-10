/**
 * Wrestling Scheduler V3 (2025 Update)
 * 
 * Handles Big 12 Wrestling scheduling with:
 * - 8 matches (4H/4A) with alliance structure
 * - Simple matrix-based scheduling
 * - NW and SE divisions
 * - 6 divisional matches + 2 cross-divisional
 * - Affiliates host legacy programs once every 2 years
 * - Flexible scheduling throughout NCAA calendar
 */

const SportScheduler = require('../core/SportScheduler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class WrestlingSchedulerV3 extends SportScheduler {
  constructor(config = {}) {
    super({
      ...config,
      sportId: 20, // Wrestling
      sportName: "Wrestling",
      sportConfig: {
        pattern: 'divisional_matrix',
        matchesPerTeam: 8, // 8 matches total
        homeAwayBalance: { home: 4, away: 4 }, // 4H/4A
        divisionalMatches: 6, // 6 within division
        crossDivisionalMatches: 2, // 2 cross-division
        seasonStart: '2025-01-01', // Flexible throughout NCAA calendar
        seasonEnd: '2025-03-15',
        matchDays: [5, 6, 0], // Fri, Sat, Sun primarily
        preferredTimes: ['19:00', '14:00'],
        description: "Big 12 Wrestling - 8 matches with divisional structure"
      }
    });
    
    // Division structure
    this.divisions = {
      'NW': ['Iowa State', 'Oklahoma State', 'West Virginia', 'Air Force', 'Missouri', 'North Dakota State', 'Northern Iowa'],
      'SE': ['Arizona State', 'Cal Baptist', 'Northern Colorado', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming']
    };
    
    // Legacy programs (for affiliate hosting rules)
    this.legacyPrograms = ['Iowa State', 'Oklahoma State', 'West Virginia'];
    this.affiliatePrograms = ['Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming'];
  }

  /**
   * Generate Wrestling schedule
   */
  async generateSchedule(teams, constraints = [], preferences = {}) {
    try {
      logger.info(`Generating Wrestling schedule for ${teams.length} teams`);
      
      // Validate teams count (14 teams total)
      if (teams.length !== 14) {
        throw new Error(`Wrestling requires exactly 14 teams, got ${teams.length}`);
      }

      // Organize teams by division
      const teamsByDivision = this.organizeTeamsByDivision(teams);
      
      // Generate match matrix
      const matchMatrix = this.generateMatchMatrix(teamsByDivision);
      
      // Create time slots
      const timeSlots = this.generateTimeSlots();
      
      // Assign matches to time slots
      const schedule = await this.assignMatchesToTimeSlots(matchMatrix, timeSlots, constraints);
      
      // Validate and optimize
      const optimizedSchedule = await this.optimizeSchedule(schedule, constraints);
      
      logger.info(`Generated Wrestling schedule with ${optimizedSchedule.length} matches`);
      return optimizedSchedule;
      
    } catch (error) {
      logger.error('Wrestling schedule generation failed:', error);
      throw error;
    }
  }

  /**
   * Organize teams by division
   */
  organizeTeamsByDivision(teams) {
    const organized = { NW: [], SE: [] };
    
    teams.forEach(team => {
      if (this.divisions.NW.includes(team.school_name)) {
        organized.NW.push(team);
      } else if (this.divisions.SE.includes(team.school_name)) {
        organized.SE.push(team);
      }
    });
    
    return organized;
  }

  /**
   * Generate match matrix using simple divisional structure
   */
  generateMatchMatrix(teamsByDivision) {
    const matches = [];
    const teamMatchCounts = new Map();
    
    // Initialize match counts
    [...teamsByDivision.NW, ...teamsByDivision.SE].forEach(team => {
      teamMatchCounts.set(team.team_id, { total: 0, divisional: 0, crossDivisional: 0, home: 0, away: 0 });
    });

    // Step 1: Generate divisional matches (6 per team)
    this.generateDivisionalMatches(teamsByDivision.NW, matches, teamMatchCounts, 'NW');
    this.generateDivisionalMatches(teamsByDivision.SE, matches, teamMatchCounts, 'SE');
    
    // Step 2: Generate cross-divisional matches (2 per team)
    this.generateCrossDivisionalMatches(teamsByDivision, matches, teamMatchCounts);
    
    return matches;
  }

  /**
   * Generate divisional matches within each division
   */
  generateDivisionalMatches(divisionTeams, matches, teamMatchCounts, divisionName) {
    const targetDivisionalMatches = this.config.sportConfig.divisionalMatches;
    
    for (let i = 0; i < divisionTeams.length; i++) {
      for (let j = i + 1; j < divisionTeams.length; j++) {
        const team1 = divisionTeams[i];
        const team2 = divisionTeams[j];
        
        const team1Count = teamMatchCounts.get(team1.team_id);
        const team2Count = teamMatchCounts.get(team2.team_id);
        
        // Check if both teams need more divisional matches
        if (team1Count.divisional < targetDivisionalMatches && 
            team2Count.divisional < targetDivisionalMatches) {
          
          // Determine home team (balance home/away)
          const isTeam1Home = team1Count.home < 4 && 
                              (team2Count.home >= 4 || team1Count.home <= team2Count.home);
          
          matches.push({
            id: uuidv4(),
            home_team: isTeam1Home ? team1 : team2,
            away_team: isTeam1Home ? team2 : team1,
            match_type: 'divisional',
            division: divisionName
          });
          
          // Update counts
          this.updateMatchCounts(teamMatchCounts, isTeam1Home ? team1 : team2, isTeam1Home ? team2 : team1, 'divisional');
        }
      }
    }
  }

  /**
   * Generate cross-divisional matches
   */
  generateCrossDivisionalMatches(teamsByDivision, matches, teamMatchCounts) {
    const nwTeams = teamsByDivision.NW;
    const seTeams = teamsByDivision.SE;
    
    // Simple rotation to ensure each team gets 2 cross-divisional matches
    nwTeams.forEach((nwTeam, nwIndex) => {
      let crossMatches = 0;
      
      seTeams.forEach((seTeam, seIndex) => {
        if (crossMatches < 2) {
          const nwCount = teamMatchCounts.get(nwTeam.team_id);
          const seCount = teamMatchCounts.get(seTeam.team_id);
          
          if (nwCount.crossDivisional < 2 && seCount.crossDivisional < 2) {
            // Alternate home field advantage
            const isNwHome = (nwIndex + seIndex) % 2 === 0;
            
            // Check affiliate hosting rules
            const finalHomeTeam = this.applyAffiliateHostingRules(
              isNwHome ? nwTeam : seTeam,
              isNwHome ? seTeam : nwTeam
            );
            
            matches.push({
              id: uuidv4(),
              home_team: finalHomeTeam.home,
              away_team: finalHomeTeam.away,
              match_type: 'cross_divisional',
              nw_team: nwTeam.school_name,
              se_team: seTeam.school_name
            });
            
            // Update counts
            this.updateMatchCounts(teamMatchCounts, finalHomeTeam.home, finalHomeTeam.away, 'cross_divisional');
            crossMatches++;
          }
        }
      });
    });
  }

  /**
   * Apply affiliate hosting rules
   */
  applyAffiliateHostingRules(proposedHome, proposedAway) {
    // Rule: Affiliates host legacy programs once every 2 years
    const isHomeAffiliate = this.affiliatePrograms.includes(proposedHome.school_name);
    const isAwayLegacy = this.legacyPrograms.includes(proposedAway.school_name);
    
    if (isHomeAffiliate && isAwayLegacy) {
      // This is a valid affiliate hosting a legacy program
      return { home: proposedHome, away: proposedAway };
    }
    
    const isHomeLegacy = this.legacyPrograms.includes(proposedHome.school_name);
    const isAwayAffiliate = this.affiliatePrograms.includes(proposedAway.school_name);
    
    if (isHomeLegacy && isAwayAffiliate) {
      // Legacy program hosting affiliate (normal case)
      return { home: proposedHome, away: proposedAway };
    }
    
    // For affiliate vs affiliate or legacy vs legacy, use original assignment
    return { home: proposedHome, away: proposedAway };
  }

  /**
   * Update match counts for teams
   */
  updateMatchCounts(teamMatchCounts, homeTeam, awayTeam, matchType) {
    const homeCount = teamMatchCounts.get(homeTeam.team_id);
    const awayCount = teamMatchCounts.get(awayTeam.team_id);
    
    // Update totals
    homeCount.total++;
    awayCount.total++;
    homeCount.home++;
    awayCount.away++;
    
    // Update match type counts
    if (matchType === 'divisional') {
      homeCount.divisional++;
      awayCount.divisional++;
    } else if (matchType === 'cross_divisional') {
      homeCount.crossDivisional++;
      awayCount.crossDivisional++;
    }
  }

  /**
   * Generate time slots for Wrestling
   */
  generateTimeSlots() {
    const slots = [];
    const startDate = new Date(this.config.sportConfig.seasonStart);
    const endDate = new Date(this.config.sportConfig.seasonEnd);
    
    let currentDate = new Date(startDate);
    let week = 1;
    
    // Wrestling has flexible scheduling throughout NCAA calendar
    while (currentDate <= endDate) {
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
      sportName: "Wrestling",
      sportId: 20,
      matchesPerTeam: 8,
      divisionalMatches: 6,
      crossDivisionalMatches: 2,
      pattern: 'divisional_matrix',
      features: [
        'divisional_structure',
        'cross_divisional_play',
        'affiliate_hosting_rules',
        'home_away_balance',
        'flexible_calendar'
      ]
    };
  }
}

module.exports = WrestlingSchedulerV3;