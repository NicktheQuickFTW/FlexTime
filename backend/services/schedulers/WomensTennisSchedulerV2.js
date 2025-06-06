/**
 * Women's Tennis-Specific Scheduler V2
 * 
 * Implements advanced travel partner weekend patterns for Big 12 Women's Tennis
 * Including 2 Home-Home, 2 Away-Away, and 1 Single Play weekend structure
 */

const logger = require('../../lib/logger');

class WomensTennisSchedulerV2 {
  constructor() {
    this.sportId = 18; // Women's Tennis sport ID
    this.sportName = 'Women\'s Tennis';
    
    // Women's Tennis-specific configuration
    this.config = {
      seasonLength: 7, // 7 weeks of conference play (late Feb to early April)
      totalMatches: 13, // Each team plays 13 matches
      matchesPerWeek: 'variable', // Teams can play multiple matches per week
      maxMatchesPerWeekend: 2, // Maximum 2 matches Thu-Sun (especially BYU & Utah)
      roundRobinCoverage: 0.867, // 86.7% of full round-robin (104 of 120 matchups)
      homeAwayBalance: {
        // With 13 matches (odd number), teams have either 7H/6A or 6H/7A
        homeHeavy: { home: 7, away: 6 },
        awayHeavy: { home: 6, away: 7 }
      },
      maxConsecutiveAway: 4,
      maxConsecutiveHome: 4,
      matchDays: ['Thu', 'Fri', 'Sat', 'Sun'], // Matches typically Thu-Sun
      defaultMatchDays: ['Fri', 'Sun'], // Current default (may change to Thu/Sat in 2026)
      byuUtahMatchDays: ['Thu', 'Sat'], // BYU/Utah preference
      conferenceStartMonth: 2, // Late February
      conferenceEndMonth: 4, // Early April
      avoidDates: ['Easter Sunday'], // No matches on Easter
      
      // Travel partner weekend structure
      travelPartnerWeekends: {
        homeHome: 2,        // 2 weekends where partners host together
        awayAway: 2,        // 2 weekends where partners travel together
        singlePlay: 1       // 1 weekend where partners play each other (Saturday only)
      }
    };
    
    // Travel partners from CSV column groupings
    this.travelPartners = {
      'arizona': 'arizona-state',
      'arizona-state': 'arizona',
      'byu': 'utah',
      'utah': 'byu',
      'colorado': 'texas-tech',
      'texas-tech': 'colorado',
      'baylor': 'tcu',
      'tcu': 'baylor',
      'ucf': 'houston',
      'houston': 'ucf',
      'cincinnati': 'west-virginia',
      'west-virginia': 'cincinnati',
      'iowa-state': 'kansas',
      'kansas': 'iowa-state',
      'kansas-state': 'oklahoma-state',
      'oklahoma-state': 'kansas-state'
    };
    
    // Travel pods (groups of 4 teams)
    this.travelPods = {
      pod1: ['arizona', 'arizona-state', 'byu', 'utah'],
      pod2: ['colorado', 'texas-tech', 'baylor', 'tcu'],
      pod3: ['ucf', 'houston', 'cincinnati', 'west-virginia'],
      pod4: ['iowa-state', 'kansas', 'kansas-state', 'oklahoma-state']
    };
    
    // Altitude teams and pairs
    this.altitudeTeams = ['byu', 'utah', 'colorado'];
    this.altitudePairs = [
      ['byu', 'utah'],
      ['colorado', 'texas-tech']
    ];
    
    // Altitude travel rotation (6-year cycle for non-altitude pairs)
    this.altitudeRotation = {
      2025: ['iowa-state', 'kansas'],
      2026: ['oklahoma-state', 'kansas-state'],
      2027: ['arizona', 'arizona-state'],
      2028: ['baylor', 'tcu'],
      2029: ['ucf', 'houston'],
      2030: ['cincinnati', 'west-virginia']
    };
  }

  /**
   * Generate matchups for women's tennis season
   * @param {Array} teams - Array of team objects
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of matchups
   */
  async generateMatchups(teams, options = {}) {
    const { season = new Date().getFullYear() } = options;
    
    logger.info(`Generating women's tennis matchups for ${teams.length} teams`);
    
    // Validate we have all 16 Big 12 teams
    if (teams.length !== 16) {
      logger.warn(`Expected 16 teams for women's tennis, got ${teams.length}`);
    }
    
    // Create team lookup map
    const teamMap = new Map(teams.map(t => [t.team_id, t]));
    
    // Generate all matchups with travel partner weekend structure
    const matchups = [];
    
    // 1. Generate travel partner single play weekends (1 per pair = 8 matches)
    const travelPartnerMatches = this.generateTravelPartnerMatches(teams, season);
    matchups.push(...travelPartnerMatches);
    
    // 2. Generate pod matches (ensuring all pod teams play each other)
    const podMatches = this.generatePodMatches(teams, season);
    matchups.push(...podMatches);
    
    // 3. Generate remaining matches to reach near round-robin
    const remainingMatches = this.generateRemainingMatches(teams, matchups, season);
    matchups.push(...remainingMatches);
    
    // 4. Assign weekend types to matches
    this.assignWeekendTypes(matchups, season);
    
    logger.info(`Generated ${matchups.length} women's tennis matches`);
    
    return matchups;
  }

  /**
   * Generate travel partner single play matches
   * @private
   */
  generateTravelPartnerMatches(teams, season) {
    const matches = [];
    const processedPairs = new Set();
    
    teams.forEach(team => {
      const partnerId = this.travelPartners[team.team_id];
      if (partnerId && !processedPairs.has(`${team.team_id}-${partnerId}`)) {
        const partner = teams.find(t => t.team_id === partnerId);
        if (partner) {
          // Determine home/away based on year
          const useTeam1Home = season % 2 === 0;
          
          matches.push({
            home_team: useTeam1Home ? team : partner,
            away_team: useTeam1Home ? partner : team,
            sport_id: this.sportId,
            type: 'travel_partner_single_play',
            weekendType: 'single_play',
            preferredDay: 'Sat' // Single play weekends are on Saturday
          });
          
          processedPairs.add(`${team.team_id}-${partnerId}`);
          processedPairs.add(`${partnerId}-${team.team_id}`);
        }
      }
    });
    
    return matches;
  }

  /**
   * Generate pod matches ensuring all teams in a pod play each other
   * @private
   */
  generatePodMatches(teams, season) {
    const matches = [];
    const existingMatchups = new Set();
    
    Object.values(this.travelPods).forEach(pod => {
      // Generate all combinations within the pod
      for (let i = 0; i < pod.length; i++) {
        for (let j = i + 1; j < pod.length; j++) {
          const team1Id = pod[i];
          const team2Id = pod[j];
          
          // Skip if this is a travel partner match (already generated)
          if (this.travelPartners[team1Id] === team2Id) {
            continue;
          }
          
          const team1 = teams.find(t => t.team_id === team1Id);
          const team2 = teams.find(t => t.team_id === team2Id);
          
          if (team1 && team2) {
            // Determine home/away based on various factors
            const homeTeam = this.determineHomeTeam(team1, team2, season);
            const awayTeam = homeTeam === team1 ? team2 : team1;
            
            matches.push({
              home_team: homeTeam,
              away_team: awayTeam,
              sport_id: this.sportId,
              type: 'pod_match',
              pod: pod
            });
            
            existingMatchups.add(`${team1Id}-${team2Id}`);
          }
        }
      }
    });
    
    return matches;
  }

  /**
   * Generate remaining matches to reach near round-robin coverage
   * @private
   */
  generateRemainingMatches(teams, existingMatches, season) {
    const matches = [];
    const teamMatchCounts = new Map();
    const existingPairs = new Set();
    
    // Count existing matches and pairs
    existingMatches.forEach(match => {
      const homeId = match.home_team.team_id;
      const awayId = match.away_team.team_id;
      
      teamMatchCounts.set(homeId, (teamMatchCounts.get(homeId) || 0) + 1);
      teamMatchCounts.set(awayId, (teamMatchCounts.get(awayId) || 0) + 1);
      
      existingPairs.add(`${homeId}-${awayId}`);
      existingPairs.add(`${awayId}-${homeId}`);
    });
    
    // Generate additional matches to reach 13 per team
    const potentialMatches = [];
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];
        const pairKey = `${team1.team_id}-${team2.team_id}`;
        
        if (!existingPairs.has(pairKey)) {
          potentialMatches.push({ team1, team2 });
        }
      }
    }
    
    // Sort potential matches by priority (altitude considerations, etc.)
    potentialMatches.sort((a, b) => {
      const priorityA = this.getMatchPriority(a.team1, a.team2, season);
      const priorityB = this.getMatchPriority(b.team1, b.team2, season);
      return priorityB - priorityA;
    });
    
    // Add matches until each team has 13
    for (const potential of potentialMatches) {
      const team1Count = teamMatchCounts.get(potential.team1.team_id) || 0;
      const team2Count = teamMatchCounts.get(potential.team2.team_id) || 0;
      
      if (team1Count < 13 && team2Count < 13) {
        const homeTeam = this.determineHomeTeam(potential.team1, potential.team2, season);
        const awayTeam = homeTeam === potential.team1 ? potential.team2 : potential.team1;
        
        matches.push({
          home_team: homeTeam,
          away_team: awayTeam,
          sport_id: this.sportId,
          type: 'regular'
        });
        
        teamMatchCounts.set(potential.team1.team_id, team1Count + 1);
        teamMatchCounts.set(potential.team2.team_id, team2Count + 1);
      }
      
      // Check if we've reached the target number of matches
      if (matches.length + existingMatches.length >= 104) {
        break;
      }
    }
    
    return matches;
  }

  /**
   * Assign weekend types (Home-Home, Away-Away) to matches
   * @private
   */
  assignWeekendTypes(matches, season) {
    // Group matches by travel partner pairs
    const partnerPairMatches = new Map();
    
    matches.forEach(match => {
      if (match.weekendType === 'single_play') return; // Skip single play matches
      
      const homePartnerId = this.travelPartners[match.home_team.team_id];
      const awayPartnerId = this.travelPartners[match.away_team.team_id];
      
      // Check if this involves travel partners traveling together
      if (homePartnerId && awayPartnerId) {
        const homePair = [match.home_team.team_id, homePartnerId].sort().join('-');
        const awayPair = [match.away_team.team_id, awayPartnerId].sort().join('-');
        
        if (!partnerPairMatches.has(homePair)) {
          partnerPairMatches.set(homePair, { homeHome: [], awayAway: [] });
        }
        if (!partnerPairMatches.has(awayPair)) {
          partnerPairMatches.set(awayPair, { homeHome: [], awayAway: [] });
        }
        
        // Classify as home-home or away-away weekend
        if (this.arePartners(match.home_team.team_id, homePartnerId)) {
          partnerPairMatches.get(homePair).homeHome.push(match);
        }
        if (this.arePartners(match.away_team.team_id, awayPartnerId)) {
          partnerPairMatches.get(awayPair).awayAway.push(match);
        }
      }
    });
    
    // Mark weekend types
    partnerPairMatches.forEach((weekends, pairKey) => {
      // Mark first 2 home weekends
      weekends.homeHome.slice(0, 2).forEach(match => {
        match.weekendType = 'home_home';
      });
      
      // Mark first 2 away weekends
      weekends.awayAway.slice(0, 2).forEach(match => {
        match.weekendType = 'away_away';
      });
    });
  }

  /**
   * Determine which team should be home based on various factors
   * @private
   */
  determineHomeTeam(team1, team2, season) {
    // Check altitude rotation for this year
    const altitudeTeams = this.altitudeRotation[season] || [];
    const team1MustTravelAltitude = altitudeTeams.includes(team1.team_id);
    const team2MustTravelAltitude = altitudeTeams.includes(team2.team_id);
    
    // If one team must travel to altitude this year, they should be away
    if (team1MustTravelAltitude && this.isAltitudeTeam(team2.team_id)) {
      return team2;
    }
    if (team2MustTravelAltitude && this.isAltitudeTeam(team1.team_id)) {
      return team1;
    }
    
    // Default: alternate by year
    return season % 2 === 0 ? team1 : team2;
  }

  /**
   * Get match priority for scheduling
   * @private
   */
  getMatchPriority(team1, team2, season) {
    let priority = 0;
    
    // Lower priority for altitude matches if team already played one altitude pair
    if (this.isAltitudePair(team1.team_id, team2.team_id)) {
      priority -= 10;
    }
    
    // Higher priority for teams scheduled to travel to altitude this year
    const altitudeTeams = this.altitudeRotation[season] || [];
    if (altitudeTeams.includes(team1.team_id) || altitudeTeams.includes(team2.team_id)) {
      if (this.isAltitudeTeam(team1.team_id) || this.isAltitudeTeam(team2.team_id)) {
        priority += 5;
      }
    }
    
    return priority;
  }

  /**
   * Check if two teams are travel partners
   * @private
   */
  arePartners(team1Id, team2Id) {
    return this.travelPartners[team1Id] === team2Id;
  }

  /**
   * Check if team is at altitude
   * @private
   */
  isAltitudeTeam(teamId) {
    return this.altitudeTeams.includes(teamId);
  }

  /**
   * Check if two teams form an altitude pair
   * @private
   */
  isAltitudePair(team1Id, team2Id) {
    return this.altitudePairs.some(pair => 
      (pair[0] === team1Id && pair[1] === team2Id) ||
      (pair[1] === team1Id && pair[0] === team2Id)
    );
  }

  /**
   * Get women's tennis-specific constraints
   * @returns {Array} Constraints
   */
  getConstraints() {
    return [
      {
        type: 'travel_partner_weekends',
        weight: 1.0,
        parameters: {
          homeHomeWeekends: 2,
          awayAwayWeekends: 2,
          singlePlayWeekend: 1,
          singlePlayDay: 'Saturday'
        }
      },
      {
        type: 'altitude_rotation',
        weight: 0.9,
        parameters: {
          sixYearCycle: this.altitudeRotation,
          avoidBothAltitudePairs: true,
          nonAltitudeTeamsMustTravel: 'once_every_4_years'
        }
      },
      {
        type: 'total_matches',
        weight: 1.0,
        parameters: {
          matchesPerTeam: 13,
          enforcement: 'strict'
        }
      },
      {
        type: 'home_away_balance',
        weight: 1.0,
        parameters: {
          oddGameBalance: true,
          patterns: ['7H/6A', '6H/7A']
        }
      },
      {
        type: 'max_matches_per_weekend',
        weight: 1.0,
        parameters: {
          maxMatches: 2,
          weekendDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          enforcement: 'strict',
          criticalTeams: ['byu', 'utah']
        }
      },
      {
        type: 'pod_matches',
        weight: 0.95,
        parameters: {
          allPodMatchesRequired: true,
          pods: this.travelPods
        }
      },
      {
        type: 'avoid_gender_doubleheaders',
        weight: 0.7,
        parameters: {
          conflictSport: 'Men\'s Tennis',
          conflictSportId: 17,
          scope: 'weekend'
        }
      }
    ];
  }

  /**
   * Validate schedule including travel partner weekend structure
   * @param {Array} matches - Generated matches
   * @returns {Object} Validation result
   */
  validateSchedule(matches) {
    const issues = [];
    const teamStats = {};
    
    // Initialize stats
    matches.forEach(match => {
      if (!teamStats[match.home_team.team_id]) {
        teamStats[match.home_team.team_id] = { 
          home: 0, away: 0, total: 0, 
          homeHomeWeekends: 0, awayAwayWeekends: 0, singlePlayWeekends: 0 
        };
      }
      if (!teamStats[match.away_team.team_id]) {
        teamStats[match.away_team.team_id] = { 
          home: 0, away: 0, total: 0,
          homeHomeWeekends: 0, awayAwayWeekends: 0, singlePlayWeekends: 0 
        };
      }
      
      // Count matches
      teamStats[match.home_team.team_id].home++;
      teamStats[match.home_team.team_id].total++;
      teamStats[match.away_team.team_id].away++;
      teamStats[match.away_team.team_id].total++;
      
      // Count weekend types
      if (match.weekendType === 'single_play') {
        teamStats[match.home_team.team_id].singlePlayWeekends++;
        teamStats[match.away_team.team_id].singlePlayWeekends++;
      } else if (match.weekendType === 'home_home') {
        teamStats[match.home_team.team_id].homeHomeWeekends++;
      } else if (match.weekendType === 'away_away') {
        teamStats[match.away_team.team_id].awayAwayWeekends++;
      }
    });
    
    // Validate each team
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      // Check total matches
      if (stats.total !== 13) {
        issues.push({
          type: 'match_count',
          team: teamId,
          message: `Team has ${stats.total} matches, expected 13`
        });
      }
      
      // Check weekend structure
      if (stats.singlePlayWeekends !== 1) {
        issues.push({
          type: 'single_play_weekend',
          team: teamId,
          message: `Team has ${stats.singlePlayWeekends} single play weekends, expected 1`
        });
      }
    });
    
    // Validate altitude rotation
    this.validateAltitudeRotation(matches, issues);
    
    return {
      valid: issues.length === 0,
      issues: issues,
      stats: teamStats
    };
  }

  /**
   * Validate altitude rotation compliance
   * @private
   */
  validateAltitudeRotation(matches, issues) {
    const year = new Date().getFullYear();
    const requiredAltitudeTravelers = this.altitudeRotation[year] || [];
    
    const altitudeTravels = new Map();
    
    matches.forEach(match => {
      if (this.isAltitudeTeam(match.home_team.team_id)) {
        const awayId = match.away_team.team_id;
        if (!altitudeTravels.has(awayId)) {
          altitudeTravels.set(awayId, []);
        }
        altitudeTravels.get(awayId).push(match.home_team.team_id);
      }
    });
    
    // Check required travelers
    requiredAltitudeTravelers.forEach(teamId => {
      const travels = altitudeTravels.get(teamId) || [];
      if (travels.length === 0) {
        issues.push({
          type: 'altitude_rotation_violation',
          team: teamId,
          message: `Team scheduled to travel to altitude in ${year} but has no altitude away games`
        });
      }
    });
  }
}

module.exports = WomensTennisSchedulerV2;