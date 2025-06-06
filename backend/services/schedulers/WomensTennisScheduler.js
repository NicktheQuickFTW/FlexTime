/**
 * Women's Tennis-Specific Scheduler
 * 
 * Implements scheduling logic specific to Big 12 Women's Tennis
 * Based on analysis of 2026 schedule
 */

const logger = require('../../lib/logger');
const { womensTennisPartners, womensTennisPods, elevationTeams } = require('../../src/ai/specialized/tennis_constraints');

class WomensTennisScheduler {
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
      conferenceStartMonth: 2, // Late February
      conferenceEndMonth: 4, // Early April
      maxMatchesPerWeekend: 2, // Max 2 matches per weekend (Thu-Sun) especially for BYU & Utah
      preferredMatchDays: ['Fri', 'Sat'] // Preferred days for standard matches
    };
    
    // Travel partners from tennis_constraints.js
    this.travelPartners = womensTennisPartners;
    
    // Travel pods from tennis_constraints.js
    this.travelPods = womensTennisPods;
    
    // Elevation teams (special consideration)
    this.elevationTeams = elevationTeams;
    
    // Altitude pairs that require special consideration
    this.altitudePairs = [
      ['BYU', 'Utah'],
      ['Colorado', 'Texas Tech']
    ];
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
    
    // Determine home/away patterns for teams
    const teamPatterns = this.assignHomeAwayPatterns(teams, season);
    
    // Generate near round-robin matchups (86.7% coverage)
    const matchups = this.generateNearRoundRobin(teams, teamPatterns);
    
    logger.info(`Generated ${matchups.length} women's tennis matches`);
    
    return matchups;
  }

  /**
   * Assign home/away patterns based on year
   * @private
   */
  assignHomeAwayPatterns(teams, season) {
    const patterns = {};
    const isEvenYear = season % 2 === 0;
    
    teams.forEach((team, index) => {
      // Alternate patterns to ensure balanced schedule
      // Half teams get 7H/6A, half get 6H/7A
      const useHomeHeavy = isEvenYear ? (index % 2 === 0) : (index % 2 === 1);
      patterns[team.team_id] = useHomeHeavy ? 
        this.config.homeAwayBalance.homeHeavy : 
        this.config.homeAwayBalance.awayHeavy;
      
      logger.debug(`${team.name}: ${patterns[team.team_id].home}H/${patterns[team.team_id].away}A`);
    });
    
    return patterns;
  }

  /**
   * Generate near round-robin schedule
   * @private
   */
  generateNearRoundRobin(teams, teamPatterns) {
    const matchups = [];
    const teamMatchCounts = {};
    const teamOpponents = {};
    const homeGames = {};
    const awayGames = {};
    const podMatchCounts = {};
    
    // Initialize counters
    teams.forEach(team => {
      teamMatchCounts[team.team_id] = 0;
      teamOpponents[team.team_id] = new Set();
      homeGames[team.team_id] = 0;
      awayGames[team.team_id] = 0;
      podMatchCounts[team.team_id] = 0;
    });
    
    // Generate matchups aiming for 13 per team
    // Strategy: Create matchups ensuring each team plays 13 matches
    // with proper home/away balance and pod/travel partner considerations
    
    // First, ensure pod matches (teams must play all teams in their pod)
    const podMatchups = this.generatePodMatchups(teams, teamPatterns);
    
    // Add pod matchups first
    for (const matchup of podMatchups) {
      matchups.push(matchup);
      
      // Update counters
      teamMatchCounts[matchup.home_team.team_id]++;
      teamMatchCounts[matchup.away_team.team_id]++;
      teamOpponents[matchup.home_team.team_id].add(matchup.away_team.team_id);
      teamOpponents[matchup.away_team.team_id].add(matchup.home_team.team_id);
      homeGames[matchup.home_team.team_id]++;
      awayGames[matchup.away_team.team_id]++;
      podMatchCounts[matchup.home_team.team_id]++;
      podMatchCounts[matchup.away_team.team_id]++;
    }
    
    logger.info(`Added ${podMatchups.length} pod matchups`);
    
    // Generate remaining matchups
    const allPossibleMatchups = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        // Skip if already played (pod match)
        if (teamOpponents[teams[i].team_id].has(teams[j].team_id)) {
          continue;
        }
        
        allPossibleMatchups.push({
          team1: teams[i],
          team2: teams[j]
        });
      }
    }
    
    // Prioritize travel partner matches
    const travelPartnerMatchups = [];
    const otherMatchups = [];
    
    for (const potential of allPossibleMatchups) {
      const team1Name = potential.team1.name;
      const team2Name = potential.team2.name;
      
      if (this.getTravelPartner(team1Name) === team2Name) {
        travelPartnerMatchups.push(potential);
      } else {
        otherMatchups.push(potential);
      }
    }
    
    // Shuffle both arrays
    this.shuffleArray(travelPartnerMatchups);
    this.shuffleArray(otherMatchups);
    
    // Combine with travel partners first
    const prioritizedMatchups = [...travelPartnerMatchups, ...otherMatchups];
    
    // Select matchups ensuring each team gets exactly 13 matches
    for (const potential of prioritizedMatchups) {
      const team1 = potential.team1;
      const team2 = potential.team2;
      
      // Check if both teams need more matches
      if (teamMatchCounts[team1.team_id] >= 13 || teamMatchCounts[team2.team_id] >= 13) {
        continue;
      }
      
      // Check if teams have already played
      if (teamOpponents[team1.team_id].has(team2.team_id)) {
        continue;
      }
      
      // Apply altitude constraint - avoid teams playing both altitude pairs
      if (this.shouldAvoidAltitudeMatch(team1.name, team2.name, teamOpponents, teams)) {
        continue;
      }
      
      // Determine home/away based on needs and travel partner considerations
      let homeTeam, awayTeam;
      
      const team1NeedsHome = homeGames[team1.team_id] < teamPatterns[team1.team_id].home;
      const team2NeedsHome = homeGames[team2.team_id] < teamPatterns[team2.team_id].home;
      const team1NeedsAway = awayGames[team1.team_id] < teamPatterns[team1.team_id].away;
      const team2NeedsAway = awayGames[team2.team_id] < teamPatterns[team2.team_id].away;
      
      // If teams are travel partners, consider home/away rotation pattern
      if (this.getTravelPartner(team1.name) === team2.name) {
        // Travel partners should rotate home/away by year
        const useTeam1Home = this.shouldTeam1BeHome(team1.name, team2.name, new Date().getFullYear());
        if (useTeam1Home && team1NeedsHome) {
          homeTeam = team1;
          awayTeam = team2;
        } else if (!useTeam1Home && team2NeedsHome) {
          homeTeam = team2;
          awayTeam = team1;
        } else {
          // Fallback to needs-based assignment
          if (team1NeedsHome && team2NeedsAway) {
            homeTeam = team1;
            awayTeam = team2;
          } else if (team2NeedsHome && team1NeedsAway) {
            homeTeam = team2;
            awayTeam = team1;
          } else {
            continue; // Skip if can't satisfy needs
          }
        }
      } else {
        // Standard home/away assignment
        if (team1NeedsHome && team2NeedsAway) {
          homeTeam = team1;
          awayTeam = team2;
        } else if (team2NeedsHome && team1NeedsAway) {
          homeTeam = team2;
          awayTeam = team1;
        } else {
          // Default assignment
          if (homeGames[team1.team_id] <= homeGames[team2.team_id]) {
            homeTeam = team1;
            awayTeam = team2;
          } else {
            homeTeam = team2;
            awayTeam = team1;
          }
        }
      }
      
      // Add matchup
      matchups.push({
        home_team: homeTeam,
        away_team: awayTeam,
        sport_id: this.sportId,
        type: 'regular',
        isTravelPartnerMatch: this.getTravelPartner(homeTeam.name) === awayTeam.name,
        isPodMatch: this.areInSamePod(homeTeam.name, awayTeam.name)
      });
      
      // Update counters
      teamMatchCounts[homeTeam.team_id]++;
      teamMatchCounts[awayTeam.team_id]++;
      teamOpponents[homeTeam.team_id].add(awayTeam.team_id);
      teamOpponents[awayTeam.team_id].add(homeTeam.team_id);
      homeGames[homeTeam.team_id]++;
      awayGames[awayTeam.team_id]++;
      
      // Stop if we've reached the target number of matches
      if (matchups.length >= 104) { // 86.7% of 120 = 104
        break;
      }
    }
    
    // Log final statistics
    logger.info(`Created near round-robin with ${matchups.length} matchups (target: 104)`);
    Object.entries(teamMatchCounts).forEach(([teamId, count]) => {
      if (count !== 13) {
        logger.warn(`Team ${teamId} has ${count} matches instead of 13`);
      }
    });
    
    return matchups;
  }

  /**
   * Generate pod matchups ensuring all teams play within their pod
   * @private
   */
  generatePodMatchups(teams, teamPatterns) {
    const podMatchups = [];
    
    for (const [podName, podTeams] of Object.entries(this.travelPods)) {
      // Get team objects for this pod
      const podTeamObjects = teams.filter(team => podTeams.includes(team.name));
      
      // Generate all matchups within the pod
      for (let i = 0; i < podTeamObjects.length; i++) {
        for (let j = i + 1; j < podTeamObjects.length; j++) {
          const team1 = podTeamObjects[i];
          const team2 = podTeamObjects[j];
          
          // Determine home/away based on pattern needs
          let homeTeam, awayTeam;
          
          // Special handling for travel partners
          if (this.getTravelPartner(team1.name) === team2.name) {
            const useTeam1Home = this.shouldTeam1BeHome(team1.name, team2.name, new Date().getFullYear());
            homeTeam = useTeam1Home ? team1 : team2;
            awayTeam = useTeam1Home ? team2 : team1;
          } else {
            // Random assignment for pod matches
            if (Math.random() < 0.5) {
              homeTeam = team1;
              awayTeam = team2;
            } else {
              homeTeam = team2;
              awayTeam = team1;
            }
          }
          
          podMatchups.push({
            home_team: homeTeam,
            away_team: awayTeam,
            sport_id: this.sportId,
            type: 'regular',
            isPodMatch: true,
            podName: podName
          });
        }
      }
    }
    
    return podMatchups;
  }

  /**
   * Determine if team1 should be home against team2 based on year rotation
   * @private
   */
  shouldTeam1BeHome(team1Name, team2Name, year) {
    // Sort names to ensure consistent ordering
    const sorted = [team1Name, team2Name].sort();
    const isEvenYear = year % 2 === 0;
    
    // If team1 is first alphabetically, they're home in even years
    return (sorted[0] === team1Name) === isEvenYear;
  }

  /**
   * Check if a team should avoid playing an altitude team
   * @private
   */
  shouldAvoidAltitudeMatch(team1Name, team2Name, teamOpponents, teams) {
    // Check if this is an altitude match
    const isAltitudeMatch = this.isAltitudeTeam(team2Name);
    if (!isAltitudeMatch) return false;
    
    // Check if team1 has already played an altitude pair partner
    for (const pair of this.altitudePairs) {
      if (pair.includes(team2Name)) {
        const partner = pair.find(t => t !== team2Name);
        const partnerId = teams.find(t => t.name === partner)?.team_id;
        if (partnerId && teamOpponents[team1Name]?.has(partnerId)) {
          return true; // Already played the altitude pair partner
        }
      }
    }
    
    return false;
  }

  /**
   * Shuffle array in place
   * @private
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get team's travel partner
   * @private
   */
  getTravelPartner(teamName) {
    return this.travelPartners[teamName] || null;
  }

  /**
   * Get team's pod
   * @private
   */
  getTeamPod(teamName) {
    for (const [podName, teams] of Object.entries(this.travelPods)) {
      if (teams.includes(teamName)) {
        return { name: podName, teams };
      }
    }
    return null;
  }

  /**
   * Check if two teams are in the same pod
   * @private
   */
  areInSamePod(team1Name, team2Name) {
    const pod1 = this.getTeamPod(team1Name);
    return pod1 && pod1.teams.includes(team2Name);
  }

  /**
   * Check if team is an altitude team
   * @private
   */
  isAltitudeTeam(teamName) {
    return this.elevationTeams.includes(teamName);
  }

  /**
   * Check if two teams form an altitude pair
   * @private
   */
  areAltitudePair(team1Name, team2Name) {
    return this.altitudePairs.some(pair => 
      (pair[0] === team1Name && pair[1] === team2Name) ||
      (pair[1] === team1Name && pair[0] === team2Name)
    );
  }

  /**
   * Validate weekend match limit (max 2 matches Thu-Sun)
   * @private
   */
  validateWeekendMatchLimit(teamSchedule, proposedMatch) {
    // Get the week of the proposed match
    const proposedWeek = this.getWeekNumber(proposedMatch.date);
    
    // Count matches in the same weekend (Thu-Sun)
    const weekendMatches = teamSchedule.filter(match => {
      const matchWeek = this.getWeekNumber(match.date);
      return matchWeek === proposedWeek;
    });
    
    return weekendMatches.length < this.config.maxMatchesPerWeekend;
  }

  /**
   * Get week number for a date
   * @private
   */
  getWeekNumber(date) {
    const d = new Date(date);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((d - onejan) / 86400000);
    return Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  }

  /**
   * Get date preferences for women's tennis
   * @returns {Object} Date preferences
   */
  getDatePreferences() {
    return {
      seasonStart: 'late February',
      seasonEnd: 'early April',
      conferenceWeeks: 7,
      matchDays: this.config.matchDays,
      multipleMatchesPerWeek: true,
      preferredMatchTimes: ['14:00:00', '16:00:00', '18:00:00'], // Afternoon matches
      avoidDates: [], // Could add spring break, etc.
    };
  }

  /**
   * Get women's tennis-specific constraints
   * @returns {Array} Constraints
   */
  getConstraints() {
    return [
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
          patterns: ['7H/6A', '6H/7A'],
          travelPartnerRotation: true
        }
      },
      {
        type: 'max_consecutive_away',
        weight: 0.9,
        parameters: {
          maxConsecutive: 4,
          preferredMax: 3
        }
      },
      {
        type: 'max_consecutive_home',
        weight: 0.9,
        parameters: {
          maxConsecutive: 4,
          preferredMax: 3
        }
      },
      {
        type: 'max_matches_per_weekend',
        weight: 1.0,
        parameters: {
          maxMatches: 2,
          weekendDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          enforcement: 'strict',
          criticalTeams: ['byu', 'utah'] // Especially important for these teams
        }
      },
      {
        type: 'near_round_robin',
        weight: 0.8,
        parameters: {
          targetCoverage: 0.867,
          minMatchups: 100,
          maxMatchups: 108
        }
      },
      {
        type: 'conference_season_length',
        weight: 1.0,
        parameters: {
          weeks: 7,
          startMonth: 2,
          endMonth: 4
        }
      },
      {
        type: 'match_days',
        weight: 0.8,
        parameters: {
          allowedDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          preferredDays: ['Fri', 'Sat']
        }
      },
      {
        type: 'avoid_gender_doubleheaders',
        weight: 0.7,
        parameters: {
          conflictSport: 'Men\'s Tennis',
          conflictSportId: 17,
          description: 'Minimize men\'s and women\'s tennis home matches on same weekend',
          scope: 'weekend' // Thu-Sun
        }
      },
      {
        type: 'max_matches_per_weekend',
        weight: 0.95,
        parameters: {
          maxMatches: 2,
          weekendDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          criticalTeams: ['BYU', 'Utah'] // Especially important for these teams
        }
      },
      {
        type: 'travel_partner_system',
        weight: 0.9,
        parameters: {
          enforced: true,
          partners: this.travelPartners,
          yearlyRotation: true
        }
      },
      {
        type: 'pod_scheduling',
        weight: 0.95,
        parameters: {
          enforced: true,
          pods: this.travelPods,
          allPodMatchesRequired: true
        }
      },
      {
        type: 'altitude_avoidance',
        weight: 0.7,
        parameters: {
          altitudeTeams: this.elevationTeams,
          altitudePairs: this.altitudePairs,
          avoidBothPairsInSeason: true
        }
      },
      {
        type: 'byu_no_sunday',
        weight: 1.0,
        parameters: {
          team: 'BYU',
          blockedDay: 'Sun',
          enforcement: 'strict'
        }
      }
    ];
  }

  /**
   * Validate women's tennis schedule
   * @param {Array} matches - Generated matches
   * @returns {Object} Validation result
   */
  validateSchedule(matches) {
    const issues = [];
    const teamStats = {};
    
    // Initialize and count matches per team
    matches.forEach(match => {
      if (!teamStats[match.home_team.team_id]) {
        teamStats[match.home_team.team_id] = { 
          home: 0, 
          away: 0, 
          total: 0,
          opponents: new Set()
        };
      }
      if (!teamStats[match.away_team.team_id]) {
        teamStats[match.away_team.team_id] = { 
          home: 0, 
          away: 0, 
          total: 0,
          opponents: new Set()
        };
      }
      
      teamStats[match.home_team.team_id].home++;
      teamStats[match.home_team.team_id].total++;
      teamStats[match.home_team.team_id].opponents.add(match.away_team.team_id);
      
      teamStats[match.away_team.team_id].away++;
      teamStats[match.away_team.team_id].total++;
      teamStats[match.away_team.team_id].opponents.add(match.home_team.team_id);
    });
    
    // Check each team
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      // Check total matches (should be 13)
      if (stats.total !== 13) {
        issues.push({
          type: 'match_count',
          team: teamId,
          message: `Team has ${stats.total} matches, expected 13`
        });
      }
      
      // Check home/away balance (should be 7/6 or 6/7)
      const validBalances = [
        stats.home === 7 && stats.away === 6,
        stats.home === 6 && stats.away === 7
      ];
      
      if (!validBalances.some(valid => valid)) {
        issues.push({
          type: 'home_away_imbalance',
          team: teamId,
          message: `Team has ${stats.home}H/${stats.away}A, expected 7H/6A or 6H/7A`
        });
      }
    });
    
    // Check coverage
    const uniqueMatchups = matches.length;
    const expectedMatchups = 104; // 86.7% of 120
    const coveragePercent = (uniqueMatchups / 120) * 100;
    
    if (Math.abs(uniqueMatchups - expectedMatchups) > 4) {
      issues.push({
        type: 'coverage',
        message: `Schedule has ${uniqueMatchups} matchups (${coveragePercent.toFixed(1)}%), expected ~104 (86.7%)`
      });
    }
    
    // Check consecutive home/away
    this.validateConsecutiveGames(matches, issues);
    
    return {
      valid: issues.length === 0,
      issues: issues,
      stats: teamStats,
      coverage: coveragePercent
    };
  }

  /**
   * Validate consecutive home/away games
   * @private
   */
  validateConsecutiveGames(matches, issues) {
    // Group matches by team and check consecutive patterns
    const teamMatches = {};
    
    matches.forEach(match => {
      if (!teamMatches[match.home_team.team_id]) {
        teamMatches[match.home_team.team_id] = [];
      }
      if (!teamMatches[match.away_team.team_id]) {
        teamMatches[match.away_team.team_id] = [];
      }
      
      teamMatches[match.home_team.team_id].push({
        ...match,
        isHome: true
      });
      
      teamMatches[match.away_team.team_id].push({
        ...match,
        isHome: false
      });
    });
    
    // Check each team for consecutive patterns
    Object.entries(teamMatches).forEach(([teamId, matches]) => {
      // Sort matches by date/week if available
      matches.sort((a, b) => {
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        if (a.week && b.week) return a.week - b.week;
        return 0;
      });
      
      let consecutiveHome = 0;
      let consecutiveAway = 0;
      let maxConsecutiveHome = 0;
      let maxConsecutiveAway = 0;
      
      matches.forEach(match => {
        if (match.isHome) {
          consecutiveHome++;
          consecutiveAway = 0;
          maxConsecutiveHome = Math.max(maxConsecutiveHome, consecutiveHome);
        } else {
          consecutiveAway++;
          consecutiveHome = 0;
          maxConsecutiveAway = Math.max(maxConsecutiveAway, consecutiveAway);
        }
      });
      
      if (maxConsecutiveAway > 4) {
        issues.push({
          type: 'consecutive_away_violation',
          team: teamId,
          message: `Team has ${maxConsecutiveAway} consecutive away matches (max allowed: 4)`
        });
      }
      
      if (maxConsecutiveHome > 4) {
        issues.push({
          type: 'consecutive_home_violation',
          team: teamId,
          message: `Team has ${maxConsecutiveHome} consecutive home matches (max allowed: 4)`
        });
      }
    });
  }
}

module.exports = WomensTennisScheduler;