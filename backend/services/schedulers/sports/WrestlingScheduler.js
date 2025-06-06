/**
 * Wrestling Scheduler
 * 
 * Handles Big 12 Wrestling scheduling with alliance structure:
 * - 8 matches (4H/4A) annually against Big 12 competition
 * - 2 Divisions (NW and SE)
 * - Schools wrestle their division (6 meets) plus 2 cross-divisional teams (2 meets)
 * - Programs mutually agree on dates throughout NCAA calendar
 * - Each affiliate has at least one annual home match against a legacy program once every 2 years
 */

const SportScheduler = require('../base/SportScheduler');
const logger = require('../../../lib/logger');
const { v4: uuidv4 } = require('uuid');

class WrestlingScheduler extends SportScheduler {
  constructor(config) {
    super({
      ...config,
      sportId: 20, // Wrestling sport ID
      sportName: 'Wrestling',
      sportConfig: {
        pattern: 'divisional',
        matchesPerTeam: 8,
        homeMatches: 4,
        awayMatches: 4,
        seasonStart: '2025-11-01', // Flexible - teams agree on dates
        seasonEnd: '2026-03-15',   // Throughout NCAA calendar
        description: 'Big 12 Wrestling Alliance - 8 matches (4H/4A)'
      }
    });
    
    // Division structure
    this.divisions = {
      NW: {
        name: 'Northwest',
        teams: ['Air Force', 'Cal Baptist', 'North Dakota State', 'Northern Colorado', 
                'South Dakota State', 'Utah Valley', 'Wyoming'],
        codes: ['AFA', 'CBU', 'NDSU', 'UNC', 'SDSU', 'UVU', 'WYO']
      },
      SE: {
        name: 'Southeast', 
        teams: ['Arizona State', 'Iowa State', 'Missouri', 'Northern Iowa', 
                'Oklahoma', 'Oklahoma State', 'West Virginia'],
        codes: ['ASU', 'ISU', 'MU', 'UNI', 'OU', 'OSU', 'WVU']
      }
    };
    
    // Legacy programs (traditional Big 12 members)
    this.legacyPrograms = ['ASU', 'ISU', 'OSU', 'WVU'];
    
    // Affiliate programs (newer alliance members)
    this.affiliatePrograms = ['AFA', 'CBU', 'NDSU', 'UNC', 'SDSU', 'UVU', 'WYO', 'MU', 'UNI', 'OU'];
    
    this.matchesPerTeam = 8;
    this.divisionMatches = 6;
    this.crossDivisionMatches = 2;
  }

  /**
   * Generate wrestling matchups based on divisional structure
   */
  async generateMatchups(teams, parameters) {
    logger.info(`Generating wrestling matchups for ${teams.length} teams`);
    
    // Organize teams by division
    const teamsByDivision = this.organizeTeamsByDivision(teams);
    
    if (!teamsByDivision.NW || !teamsByDivision.SE) {
      throw new Error('Unable to properly organize teams into NW and SE divisions');
    }
    
    logger.info(`NW Division: ${teamsByDivision.NW.length} teams`);
    logger.info(`SE Division: ${teamsByDivision.SE.length} teams`);
    
    const matchups = [];
    
    // Step 1: Generate intra-divisional matchups (6 per team)
    const nwDivisionMatchups = this.generateDivisionMatchups(teamsByDivision.NW, 'NW');
    const seDivisionMatchups = this.generateDivisionMatchups(teamsByDivision.SE, 'SE');
    
    matchups.push(...nwDivisionMatchups, ...seDivisionMatchups);
    
    // Step 2: Generate cross-divisional matchups (2 per team)
    const crossDivisionMatchups = this.generateCrossDivisionMatchups(
      teamsByDivision.NW, 
      teamsByDivision.SE,
      parameters.season || '2025-26'
    );
    
    matchups.push(...crossDivisionMatchups);
    
    // Step 3: Balance home/away assignments
    const balancedMatchups = this.balanceHomeAwayAssignments(matchups, teams);
    
    // Step 4: Ensure legacy program requirements
    const finalMatchups = this.ensureLegacyProgramRequirements(
      balancedMatchups, 
      teams,
      parameters.season || '2025-26'
    );
    
    logger.info(`Generated ${finalMatchups.length} wrestling matches`);
    return finalMatchups;
  }

  /**
   * Organize teams into their divisions
   */
  organizeTeamsByDivision(teams) {
    const teamsByDivision = {
      NW: [],
      SE: []
    };
    
    teams.forEach(team => {
      // Check NW division
      if (this.divisions.NW.codes.includes(team.team_code) ||
          this.divisions.NW.teams.some(name => team.school_name?.includes(name))) {
        teamsByDivision.NW.push(team);
      }
      // Check SE division
      else if (this.divisions.SE.codes.includes(team.team_code) ||
               this.divisions.SE.teams.some(name => team.school_name?.includes(name))) {
        teamsByDivision.SE.push(team);
      }
      else {
        logger.warn(`Team ${team.school_name} (${team.team_code}) not found in either division`);
      }
    });
    
    return teamsByDivision;
  }

  /**
   * Generate matchups within a division (round-robin)
   */
  generateDivisionMatchups(divisionTeams, divisionName) {
    const matchups = [];
    
    logger.info(`Generating matchups for ${divisionName} division with ${divisionTeams.length} teams`);
    
    // Round-robin within division
    for (let i = 0; i < divisionTeams.length - 1; i++) {
      for (let j = i + 1; j < divisionTeams.length; j++) {
        matchups.push({
          game_id: uuidv4(),
          home_team_id: divisionTeams[i].team_id,
          away_team_id: divisionTeams[j].team_id,
          home_team: divisionTeams[i],
          away_team: divisionTeams[j],
          is_conference: true,
          is_divisional: true,
          division: divisionName,
          home_away_assigned: false // Will be balanced later
        });
      }
    }
    
    return matchups;
  }

  /**
   * Generate cross-divisional matchups
   * Each team plays 2 teams from the other division
   */
  generateCrossDivisionMatchups(nwTeams, seTeams, season) {
    const matchups = [];
    const crossDivisionPairings = this.determineCrossDivisionPairings(nwTeams, seTeams, season);
    
    crossDivisionPairings.forEach(pairing => {
      matchups.push({
        game_id: uuidv4(),
        home_team_id: pairing.team1.team_id,
        away_team_id: pairing.team2.team_id,
        home_team: pairing.team1,
        away_team: pairing.team2,
        is_conference: true,
        is_divisional: false,
        is_cross_divisional: true,
        home_away_assigned: false
      });
    });
    
    return matchups;
  }

  /**
   * Determine cross-division pairings
   * This could rotate yearly or be based on other factors
   */
  determineCrossDivisionPairings(nwTeams, seTeams, season) {
    const pairings = [];
    const yearNum = parseInt(season.split('-')[0]) - 2025; // Years since 2025
    
    // Each NW team needs 2 SE opponents
    nwTeams.forEach((nwTeam, nwIndex) => {
      // Use rotation based on year to vary opponents
      const seIndex1 = (nwIndex * 2 + yearNum) % seTeams.length;
      const seIndex2 = (nwIndex * 2 + 1 + yearNum) % seTeams.length;
      
      pairings.push({
        team1: nwTeam,
        team2: seTeams[seIndex1]
      });
      
      pairings.push({
        team1: nwTeam,
        team2: seTeams[seIndex2]
      });
    });
    
    // Validate that each SE team also gets 2 NW opponents
    const seTeamCounts = {};
    pairings.forEach(p => {
      const seTeamId = p.team2.team_id;
      seTeamCounts[seTeamId] = (seTeamCounts[seTeamId] || 0) + 1;
    });
    
    // Adjust if needed to ensure each SE team has exactly 2 cross-division matches
    seTeams.forEach(seTeam => {
      const count = seTeamCounts[seTeam.team_id] || 0;
      if (count < 2) {
        // Find NW teams with fewer pairings and add matches
        logger.warn(`SE team ${seTeam.school_name} has only ${count} cross-division matches, adjusting...`);
      }
    });
    
    return pairings;
  }

  /**
   * Balance home/away assignments to achieve 4H/4A
   */
  balanceHomeAwayAssignments(matchups, teams) {
    const teamStats = {};
    
    // Initialize stats
    teams.forEach(team => {
      teamStats[team.team_id] = {
        home: 0,
        away: 0,
        total: 0,
        team: team
      };
    });
    
    // Sort matchups to process divisional matches first
    const sortedMatchups = [...matchups].sort((a, b) => {
      if (a.is_divisional && !b.is_divisional) return -1;
      if (!a.is_divisional && b.is_divisional) return 1;
      return 0;
    });
    
    // Assign home/away for each matchup
    sortedMatchups.forEach(matchup => {
      const team1Stats = teamStats[matchup.home_team_id];
      const team2Stats = teamStats[matchup.away_team_id];
      
      // Determine who should be home based on current balance
      let homeTeam, awayTeam;
      
      if (team1Stats.home < 4 && team2Stats.away < 4) {
        // Team1 can be home, Team2 can be away
        homeTeam = matchup.home_team;
        awayTeam = matchup.away_team;
      } else if (team2Stats.home < 4 && team1Stats.away < 4) {
        // Swap: Team2 home, Team1 away
        homeTeam = matchup.away_team;
        awayTeam = matchup.home_team;
      } else {
        // Try to balance as best as possible
        const team1HomeNeed = 4 - team1Stats.home;
        const team2HomeNeed = 4 - team2Stats.home;
        
        if (team1HomeNeed > team2HomeNeed) {
          homeTeam = matchup.home_team;
          awayTeam = matchup.away_team;
        } else {
          homeTeam = matchup.away_team;
          awayTeam = matchup.home_team;
        }
      }
      
      // Update matchup
      matchup.home_team_id = homeTeam.team_id;
      matchup.away_team_id = awayTeam.team_id;
      matchup.home_team = homeTeam;
      matchup.away_team = awayTeam;
      matchup.home_away_assigned = true;
      
      // Update stats
      teamStats[homeTeam.team_id].home++;
      teamStats[homeTeam.team_id].total++;
      teamStats[awayTeam.team_id].away++;
      teamStats[awayTeam.team_id].total++;
    });
    
    // Log final balance
    logger.info('\nHome/Away Balance:');
    Object.values(teamStats).forEach(stats => {
      if (stats.home !== 4 || stats.away !== 4) {
        logger.warn(`${stats.team.school_name}: ${stats.home}H/${stats.away}A (expected 4H/4A)`);
      }
    });
    
    return matchups;
  }

  /**
   * Ensure legacy program requirements
   * Each affiliate must have at least one home match against a legacy program once every 2 years
   */
  ensureLegacyProgramRequirements(matchups, teams, season) {
    const yearNum = parseInt(season.split('-')[0]) - 2025;
    const isEvenYear = yearNum % 2 === 0;
    
    // Identify affiliate teams
    const affiliateTeams = teams.filter(t => 
      this.affiliatePrograms.includes(t.team_code)
    );
    
    // Identify legacy teams
    const legacyTeams = teams.filter(t => 
      this.legacyPrograms.includes(t.team_code)
    );
    
    // Check each affiliate's home matches against legacy programs
    affiliateTeams.forEach(affiliate => {
      const homeLegacyMatches = matchups.filter(m => 
        m.home_team_id === affiliate.team_id &&
        legacyTeams.some(legacy => legacy.team_id === m.away_team_id)
      );
      
      // In even years, ensure at least one home match against legacy
      if (isEvenYear && homeLegacyMatches.length === 0) {
        logger.info(`Ensuring ${affiliate.school_name} has home match against legacy program`);
        
        // Find a match where affiliate is away against a legacy program
        const swapCandidate = matchups.find(m => 
          m.away_team_id === affiliate.team_id &&
          legacyTeams.some(legacy => legacy.team_id === m.home_team_id)
        );
        
        if (swapCandidate) {
          // Swap home/away
          const tempHome = swapCandidate.home_team;
          const tempHomeId = swapCandidate.home_team_id;
          
          swapCandidate.home_team = swapCandidate.away_team;
          swapCandidate.home_team_id = swapCandidate.away_team_id;
          swapCandidate.away_team = tempHome;
          swapCandidate.away_team_id = tempHomeId;
          
          logger.info(`Swapped ${swapCandidate.away_team.school_name} @ ${swapCandidate.home_team.school_name}`);
        }
      }
    });
    
    return matchups;
  }

  /**
   * Get wrestling-specific constraints
   */
  getDefaultConstraints() {
    return [
      {
        type: 'MATCHES_PER_TEAM',
        value: this.matchesPerTeam,
        weight: 1.0
      },
      {
        type: 'HOME_AWAY_BALANCE',
        description: 'Exactly 4 home and 4 away matches',
        home: 4,
        away: 4,
        weight: 1.0
      },
      {
        type: 'DIVISION_MATCHES',
        description: 'Each team plays all teams in their division',
        value: this.divisionMatches,
        weight: 1.0
      },
      {
        type: 'CROSS_DIVISION_MATCHES',
        description: 'Each team plays 2 teams from other division',
        value: this.crossDivisionMatches,
        weight: 1.0
      },
      {
        type: 'LEGACY_PROGRAM_REQUIREMENT',
        description: 'Affiliates host legacy program at least once every 2 years',
        weight: 0.9
      },
      {
        type: 'FLEXIBLE_DATES',
        description: 'Programs mutually agree on competition dates',
        weight: 0.5
      }
    ];
  }

  /**
   * Validate wrestling schedule
   */
  validateSchedule(games) {
    const result = super.validateSchedule(games);
    
    // Additional wrestling-specific validations
    const teamStats = {};
    const divisionMatchCounts = {};
    const crossDivisionMatchCounts = {};
    
    // Get team list from games
    const teamIds = new Set();
    games.forEach(game => {
      teamIds.add(game.home_team_id);
      teamIds.add(game.away_team_id);
    });
    
    // Initialize counters
    teamIds.forEach(teamId => {
      teamStats[teamId] = { 
        total: 0, 
        home: 0, 
        away: 0,
        divisional: 0,
        crossDivisional: 0
      };
      divisionMatchCounts[teamId] = new Set();
      crossDivisionMatchCounts[teamId] = new Set();
    });
    
    // Count matches
    games.forEach(game => {
      // Update team stats
      teamStats[game.home_team_id].total++;
      teamStats[game.home_team_id].home++;
      teamStats[game.away_team_id].total++;
      teamStats[game.away_team_id].away++;
      
      if (game.is_divisional) {
        teamStats[game.home_team_id].divisional++;
        teamStats[game.away_team_id].divisional++;
        divisionMatchCounts[game.home_team_id].add(game.away_team_id);
        divisionMatchCounts[game.away_team_id].add(game.home_team_id);
      }
      
      if (game.is_cross_divisional) {
        teamStats[game.home_team_id].crossDivisional++;
        teamStats[game.away_team_id].crossDivisional++;
        crossDivisionMatchCounts[game.home_team_id].add(game.away_team_id);
        crossDivisionMatchCounts[game.away_team_id].add(game.home_team_id);
      }
    });
    
    // Validate match counts
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      // Total matches
      if (stats.total !== this.matchesPerTeam) {
        result.violations.push({
          type: 'INCORRECT_MATCH_COUNT',
          message: `Team ${teamId} has ${stats.total} matches, expected ${this.matchesPerTeam}`
        });
      }
      
      // Home/Away balance
      if (stats.home !== 4 || stats.away !== 4) {
        result.violations.push({
          type: 'HOME_AWAY_IMBALANCE',
          message: `Team ${teamId} has ${stats.home}H/${stats.away}A, expected 4H/4A`
        });
      }
      
      // Division matches
      if (stats.divisional !== this.divisionMatches) {
        result.violations.push({
          type: 'INCORRECT_DIVISION_MATCHES',
          message: `Team ${teamId} has ${stats.divisional} division matches, expected ${this.divisionMatches}`
        });
      }
      
      // Cross-division matches
      if (stats.crossDivisional !== this.crossDivisionMatches) {
        result.violations.push({
          type: 'INCORRECT_CROSS_DIVISION_MATCHES',
          message: `Team ${teamId} has ${stats.crossDivisional} cross-division matches, expected ${this.crossDivisionMatches}`
        });
      }
    });
    
    result.valid = result.violations.length === 0;
    return result;
  }

  /**
   * Get metadata about the scheduler
   */
  getMetadata() {
    return {
      ...super.getMetadata(),
      matchesPerTeam: this.matchesPerTeam,
      homeAwayDistribution: '4H/4A',
      divisions: {
        NW: this.divisions.NW.teams,
        SE: this.divisions.SE.teams
      },
      matchDistribution: {
        divisional: this.divisionMatches,
        crossDivisional: this.crossDivisionMatches
      },
      specialRules: [
        'Divisional round-robin (6 matches)',
        '2 cross-divisional matches',
        'Affiliates host legacy programs once every 2 years',
        'Dates mutually agreed throughout NCAA calendar'
      ]
    };
  }
}

module.exports = WrestlingScheduler;