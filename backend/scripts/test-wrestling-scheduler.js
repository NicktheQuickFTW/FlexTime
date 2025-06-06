/**
 * Test script for Wrestling Scheduler
 * Verifies the implementation of Big 12 Wrestling Alliance scheduling requirements
 */

const WrestlingScheduler = require('../services/schedulers/sports/WrestlingScheduler');
const logger = require('../lib/logger');

// Test data - Big 12 Wrestling Alliance teams
const mockTeams = {
  // Northwest Division (7 teams)
  NW: [
    { team_id: 1, team_name: 'Air Force Falcons', team_code: 'AFA', school_name: 'Air Force', state: 'CO' },
    { team_id: 2, team_name: 'Cal Baptist Lancers', team_code: 'CBU', school_name: 'Cal Baptist', state: 'CA' },
    { team_id: 3, team_name: 'North Dakota State Bison', team_code: 'NDSU', school_name: 'North Dakota State', state: 'ND' },
    { team_id: 4, team_name: 'Northern Colorado Bears', team_code: 'UNC', school_name: 'Northern Colorado', state: 'CO' },
    { team_id: 5, team_name: 'South Dakota State Jackrabbits', team_code: 'SDSU', school_name: 'South Dakota State', state: 'SD' },
    { team_id: 6, team_name: 'Utah Valley Wolverines', team_code: 'UVU', school_name: 'Utah Valley', state: 'UT' },
    { team_id: 7, team_name: 'Wyoming Cowboys', team_code: 'WYO', school_name: 'Wyoming', state: 'WY' }
  ],
  // Southeast Division (7 teams)
  SE: [
    { team_id: 8, team_name: 'Arizona State Sun Devils', team_code: 'ASU', school_name: 'Arizona State', state: 'AZ' },
    { team_id: 9, team_name: 'Iowa State Cyclones', team_code: 'ISU', school_name: 'Iowa State', state: 'IA' },
    { team_id: 10, team_name: 'Missouri Tigers', team_code: 'MU', school_name: 'Missouri', state: 'MO' },
    { team_id: 11, team_name: 'Northern Iowa Panthers', team_code: 'UNI', school_name: 'Northern Iowa', state: 'IA' },
    { team_id: 12, team_name: 'Oklahoma Sooners', team_code: 'OU', school_name: 'Oklahoma', state: 'OK' },
    { team_id: 13, team_name: 'Oklahoma State Cowboys', team_code: 'OSU', school_name: 'Oklahoma State', state: 'OK' },
    { team_id: 14, team_name: 'West Virginia Mountaineers', team_code: 'WVU', school_name: 'West Virginia', state: 'WV' }
  ]
};

// Combine all teams
const allTeams = [...mockTeams.NW, ...mockTeams.SE];

async function testWrestlingScheduler() {
  logger.info('=== Testing Wrestling Scheduler ===');
  
  try {
    const scheduler = new WrestlingScheduler();
    
    // Test metadata
    const metadata = scheduler.getMetadata();
    logger.info('\nScheduler Metadata:', JSON.stringify(metadata, null, 2));
    
    // Test for both even and odd years
    const seasons = ['2025-26', '2026-27'];
    
    for (const season of seasons) {
      logger.info(`\n\n========== Testing Season ${season} ==========`);
      
      // Generate matchups
      logger.info('\nGenerating wrestling schedule...');
      const matchups = await scheduler.generateMatchups(allTeams, {
        season: season
      });
      
      logger.info(`Generated ${matchups.length} total matches`);
      
      // Analyze the schedule
      analyzeSchedule(matchups, allTeams, season);
      
      // Validate the schedule
      logger.info('\nValidating schedule...');
      const validation = scheduler.validateSchedule(matchups);
      
      if (validation.valid) {
        logger.info('✅ Schedule validation passed!');
      } else {
        logger.error('❌ Schedule validation failed:');
        validation.violations.forEach(v => {
          logger.error(`  - ${v.type}: ${v.message}`);
        });
      }
      
      // Check legacy program requirements
      checkLegacyProgramRequirements(matchups, season);
      
      // Display sample matchups
      displaySampleMatchups(matchups, allTeams);
    }
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

function analyzeSchedule(matchups, teams, season) {
  logger.info(`\n=== Schedule Analysis for ${season} ===`);
  
  // 1. Team statistics
  const teamStats = {};
  teams.forEach(team => {
    teamStats[team.team_id] = { 
      total: 0, 
      home: 0, 
      away: 0,
      divisional: 0,
      crossDivisional: 0,
      opponents: new Set(),
      name: team.school_name,
      division: mockTeams.NW.includes(team) ? 'NW' : 'SE'
    };
  });
  
  matchups.forEach(match => {
    teamStats[match.home_team_id].total++;
    teamStats[match.home_team_id].home++;
    teamStats[match.away_team_id].total++;
    teamStats[match.away_team_id].away++;
    
    teamStats[match.home_team_id].opponents.add(match.away_team_id);
    teamStats[match.away_team_id].opponents.add(match.home_team_id);
    
    if (match.is_divisional) {
      teamStats[match.home_team_id].divisional++;
      teamStats[match.away_team_id].divisional++;
    }
    
    if (match.is_cross_divisional) {
      teamStats[match.home_team_id].crossDivisional++;
      teamStats[match.away_team_id].crossDivisional++;
    }
  });
  
  // 2. Display division summaries
  logger.info('\nNorthwest Division:');
  mockTeams.NW.forEach(team => {
    const stats = teamStats[team.team_id];
    logger.info(`  ${stats.name}: ${stats.total} total (${stats.home}H/${stats.away}A) - ` +
                `${stats.divisional} div, ${stats.crossDivisional} cross-div`);
  });
  
  logger.info('\nSoutheast Division:');
  mockTeams.SE.forEach(team => {
    const stats = teamStats[team.team_id];
    logger.info(`  ${stats.name}: ${stats.total} total (${stats.home}H/${stats.away}A) - ` +
                `${stats.divisional} div, ${stats.crossDivisional} cross-div`);
  });
  
  // 3. Validate match distribution
  logger.info('\nMatch Distribution Validation:');
  let allCorrect = true;
  
  Object.values(teamStats).forEach(stats => {
    const errors = [];
    
    if (stats.total !== 8) errors.push(`total=${stats.total} (expected 8)`);
    if (stats.home !== 4) errors.push(`home=${stats.home} (expected 4)`);
    if (stats.away !== 4) errors.push(`away=${stats.away} (expected 4)`);
    if (stats.divisional !== 6) errors.push(`divisional=${stats.divisional} (expected 6)`);
    if (stats.crossDivisional !== 2) errors.push(`cross-div=${stats.crossDivisional} (expected 2)`);
    
    if (errors.length > 0) {
      logger.error(`❌ ${stats.name}: ${errors.join(', ')}`);
      allCorrect = false;
    }
  });
  
  if (allCorrect) {
    logger.info('✅ All teams have correct match distribution');
  }
  
  // 4. Cross-divisional pairings
  logger.info('\nCross-Divisional Matchups:');
  const crossDivMatches = matchups.filter(m => m.is_cross_divisional);
  
  // Group by division
  const nwCrossDivOpponents = {};
  const seCrossDivOpponents = {};
  
  crossDivMatches.forEach(match => {
    const homeStats = teamStats[match.home_team_id];
    const awayStats = teamStats[match.away_team_id];
    
    if (homeStats.division === 'NW') {
      if (!nwCrossDivOpponents[match.home_team_id]) {
        nwCrossDivOpponents[match.home_team_id] = [];
      }
      nwCrossDivOpponents[match.home_team_id].push(awayStats.name);
    } else {
      if (!seCrossDivOpponents[match.home_team_id]) {
        seCrossDivOpponents[match.home_team_id] = [];
      }
      seCrossDivOpponents[match.home_team_id].push(awayStats.name);
    }
    
    if (awayStats.division === 'NW') {
      if (!nwCrossDivOpponents[match.away_team_id]) {
        nwCrossDivOpponents[match.away_team_id] = [];
      }
      nwCrossDivOpponents[match.away_team_id].push(homeStats.name);
    } else {
      if (!seCrossDivOpponents[match.away_team_id]) {
        seCrossDivOpponents[match.away_team_id] = [];
      }
      seCrossDivOpponents[match.away_team_id].push(homeStats.name);
    }
  });
  
  logger.info('  NW teams\' SE opponents:');
  Object.entries(nwCrossDivOpponents).forEach(([teamId, opponents]) => {
    const team = teams.find(t => t.team_id === parseInt(teamId));
    logger.info(`    ${team.school_name}: ${[...new Set(opponents)].join(', ')}`);
  });
}

function checkLegacyProgramRequirements(matchups, season) {
  logger.info('\n=== Legacy Program Requirements Check ===');
  
  const yearNum = parseInt(season.split('-')[0]) - 2025;
  const isEvenYear = yearNum % 2 === 0;
  
  const legacyPrograms = ['ASU', 'ISU', 'OSU', 'WVU'];
  const affiliatePrograms = ['AFA', 'CBU', 'NDSU', 'UNC', 'SDSU', 'UVU', 'WYO', 'MU', 'UNI', 'OU'];
  
  logger.info(`Season ${season} is ${isEvenYear ? 'EVEN' : 'ODD'} year`);
  logger.info(`Legacy programs: ${legacyPrograms.join(', ')}`);
  logger.info(`Affiliate programs: ${affiliatePrograms.join(', ')}`);
  
  if (isEvenYear) {
    logger.info('\nChecking affiliate home matches against legacy programs (required in even years):');
    
    allTeams.filter(t => affiliatePrograms.includes(t.team_code)).forEach(affiliate => {
      const homeLegacyMatches = matchups.filter(m => 
        m.home_team_id === affiliate.team_id &&
        allTeams.some(t => t.team_id === m.away_team_id && legacyPrograms.includes(t.team_code))
      );
      
      if (homeLegacyMatches.length === 0) {
        logger.error(`❌ ${affiliate.school_name} has NO home matches against legacy programs`);
      } else {
        const legacyOpponents = homeLegacyMatches.map(m => {
          const opponent = allTeams.find(t => t.team_id === m.away_team_id);
          return opponent.school_name;
        });
        logger.info(`✅ ${affiliate.school_name} hosts: ${legacyOpponents.join(', ')}`);
      }
    });
  } else {
    logger.info('\nOdd year - legacy home match requirement not enforced');
  }
}

function displaySampleMatchups(matchups, teams) {
  logger.info('\n=== Sample Matchups ===');
  
  // Show divisional matchups
  logger.info('\nDivisional Matchups (first 10):');
  const divisionalMatches = matchups.filter(m => m.is_divisional).slice(0, 10);
  
  divisionalMatches.forEach(match => {
    const home = teams.find(t => t.team_id === match.home_team_id);
    const away = teams.find(t => t.team_id === match.away_team_id);
    logger.info(`  ${away.school_name} at ${home.school_name} (${match.division} division)`);
  });
  
  // Show cross-divisional matchups
  logger.info('\nCross-Divisional Matchups (all):');
  const crossDivMatches = matchups.filter(m => m.is_cross_divisional);
  
  crossDivMatches.forEach(match => {
    const home = teams.find(t => t.team_id === match.home_team_id);
    const away = teams.find(t => t.team_id === match.away_team_id);
    const homeDivision = mockTeams.NW.includes(home) ? 'NW' : 'SE';
    const awayDivision = mockTeams.NW.includes(away) ? 'NW' : 'SE';
    logger.info(`  ${away.school_name} (${awayDivision}) at ${home.school_name} (${homeDivision})`);
  });
  
  // Show specific team schedule
  const sampleTeam = teams.find(t => t.team_code === 'ISU'); // Iowa State as example
  if (sampleTeam) {
    logger.info(`\n${sampleTeam.school_name} Complete Schedule:`);
    
    const teamMatches = matchups.filter(m => 
      m.home_team_id === sampleTeam.team_id || m.away_team_id === sampleTeam.team_id
    );
    
    teamMatches.forEach(match => {
      const isHome = match.home_team_id === sampleTeam.team_id;
      const opponent = teams.find(t => t.team_id === (isHome ? match.away_team_id : match.home_team_id));
      const location = isHome ? 'vs' : 'at';
      const type = match.is_divisional ? 'DIV' : 'CROSS';
      
      logger.info(`  ${location} ${opponent.school_name} (${type})`);
    });
  }
}

// Run the test
testWrestlingScheduler().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});