/**
 * Comprehensive test for Soccer Scheduler with constraint validation
 * Tests all Big 12 Soccer scheduling requirements including:
 * - 11 matches over 7 weeks
 * - 1-2-2-1-2-2-1 pattern
 * - BYU Monday games
 * - Geographic optimization
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SoccerScheduler = require('../services/schedulers/sports/SoccerScheduler');
const logger = require('../lib/logger');

// Test data - Big 12 Soccer teams
const mockTeams = [
  { team_id: 1, team_name: 'Arizona Wildcats', team_code: 'ARIZ', school_name: 'Arizona', state: 'AZ' },
  { team_id: 2, team_name: 'Arizona State Sun Devils', team_code: 'ASU', school_name: 'Arizona State', state: 'AZ' },
  { team_id: 3, team_name: 'Baylor Bears', team_code: 'BAY', school_name: 'Baylor', state: 'TX' },
  { team_id: 4, team_name: 'BYU Cougars', team_code: 'BYU', school_name: 'BYU', state: 'UT' },
  { team_id: 5, team_name: 'Cincinnati Bearcats', team_code: 'CIN', school_name: 'Cincinnati', state: 'OH' },
  { team_id: 6, team_name: 'Colorado Buffaloes', team_code: 'COL', school_name: 'Colorado', state: 'CO' },
  { team_id: 7, team_name: 'Houston Cougars', team_code: 'HOU', school_name: 'Houston', state: 'TX' },
  { team_id: 8, team_name: 'Iowa State Cyclones', team_code: 'ISU', school_name: 'Iowa State', state: 'IA' },
  { team_id: 9, team_name: 'Kansas Jayhawks', team_code: 'KU', school_name: 'Kansas', state: 'KS' },
  { team_id: 10, team_name: 'Kansas State Wildcats', team_code: 'KSU', school_name: 'Kansas State', state: 'KS' },
  { team_id: 11, team_name: 'Oklahoma State Cowboys', team_code: 'OKST', school_name: 'Oklahoma State', state: 'OK' },
  { team_id: 12, team_name: 'TCU Horned Frogs', team_code: 'TCU', school_name: 'TCU', state: 'TX' },
  { team_id: 13, team_name: 'Texas Tech Red Raiders', team_code: 'TTU', school_name: 'Texas Tech', state: 'TX' },
  { team_id: 14, team_name: 'UCF Knights', team_code: 'UCF', school_name: 'UCF', state: 'FL' },
  { team_id: 15, team_name: 'Utah Utes', team_code: 'UTAH', school_name: 'Utah', state: 'UT' },
  { team_id: 16, team_name: 'West Virginia Mountaineers', team_code: 'WVU', school_name: 'West Virginia', state: 'WV' }
];

async function runComprehensiveTest() {
  logger.info('=== Comprehensive Soccer Scheduler Test ===');
  
  const scheduler = new SoccerScheduler();
  
  // Test 1: Basic schedule generation
  logger.info('\n1. Testing basic schedule generation...');
  const matchups = await scheduler.generateMatchups(mockTeams, {
    matchesPerTeam: 11,
    seasonStart: '2024-09-12',
    seasonEnd: '2024-10-28'
  });
  
  logger.info(`✅ Generated ${matchups.length} matches`);
  
  // Test 2: Validate match count per team
  logger.info('\n2. Validating match counts...');
  const teamMatchCounts = validateMatchCounts(matchups);
  
  // Test 3: Validate weekly pattern
  logger.info('\n3. Validating 1-2-2-1-2-2-1 pattern...');
  validateWeeklyPattern(matchups);
  
  // Test 4: Validate BYU scheduling
  logger.info('\n4. Validating BYU Monday games...');
  validateBYUScheduling(matchups);
  
  // Test 5: Validate date ranges
  logger.info('\n5. Validating season dates...');
  validateSeasonDates(matchups);
  
  // Test 6: Check geographic optimization
  logger.info('\n6. Checking geographic optimization...');
  checkGeographicOptimization(matchups);
  
  // Test 7: Overall schedule validation
  logger.info('\n7. Running scheduler validation...');
  const validation = scheduler.validateSchedule(matchups);
  
  if (validation.valid) {
    logger.info('✅ Schedule validation PASSED!');
  } else {
    logger.error('❌ Schedule validation FAILED:');
    validation.violations.forEach(v => {
      logger.error(`  - ${v.type}: ${v.message}`);
    });
  }
  
  // Display summary
  displayScheduleSummary(matchups);
  
  // Show sample week
  displaySampleWeek(matchups, 3); // Show week 3 as example
}

function validateMatchCounts(matchups) {
  const counts = {};
  mockTeams.forEach(team => {
    counts[team.team_id] = { total: 0, home: 0, away: 0 };
  });
  
  matchups.forEach(match => {
    counts[match.home_team_id].total++;
    counts[match.home_team_id].home++;
    counts[match.away_team_id].total++;
    counts[match.away_team_id].away++;
  });
  
  let allCorrect = true;
  Object.entries(counts).forEach(([teamId, count]) => {
    const team = mockTeams.find(t => t.team_id === parseInt(teamId));
    if (count.total !== 11) {
      logger.error(`❌ ${team.school_name} has ${count.total} matches (expected 11)`);
      allCorrect = false;
    } else {
      logger.info(`✅ ${team.school_name}: ${count.total} matches (${count.home}H/${count.away}A)`);
    }
  });
  
  return counts;
}

function validateWeeklyPattern(matchups) {
  const expectedPattern = [1, 2, 2, 1, 2, 2, 1];
  const weekCounts = Array(7).fill(0).map(() => new Set());
  
  matchups.forEach(match => {
    const week = match.week - 1; // 0-indexed
    if (week >= 0 && week < 7) {
      weekCounts[week].add(match.home_team_id);
      weekCounts[week].add(match.away_team_id);
    }
  });
  
  let patternCorrect = true;
  for (let week = 0; week < 7; week++) {
    const teamsPlaying = weekCounts[week].size;
    const matchesThisWeek = matchups.filter(m => m.week === week + 1).length;
    const expectedMatches = expectedPattern[week];
    
    // Each team should play the expected number of matches
    const expectedTeamsPlaying = expectedMatches * 2; // Since some teams play twice
    
    if (matchesThisWeek < expectedMatches * 8 - 2 || matchesThisWeek > expectedMatches * 8 + 2) {
      logger.error(`❌ Week ${week + 1}: ${matchesThisWeek} matches (expected ~${expectedMatches * 8})`);
      patternCorrect = false;
    } else {
      logger.info(`✅ Week ${week + 1}: ${matchesThisWeek} matches (pattern: ${expectedMatches} per team)`);
    }
  }
  
  return patternCorrect;
}

function validateBYUScheduling(matchups) {
  const byuTeam = mockTeams.find(t => t.team_code === 'BYU');
  const byuMatches = matchups.filter(m => 
    m.home_team_id === byuTeam.team_id || m.away_team_id === byuTeam.team_id
  );
  
  let allCorrect = true;
  byuMatches.forEach(match => {
    const dayName = getDayName(match.day_of_week);
    
    if (match.day_of_week === 0) { // Sunday
      logger.error(`❌ BYU scheduled on Sunday: ${match.date}`);
      allCorrect = false;
    } else if (match.week && [2, 3, 5, 6].includes(match.week)) {
      // Two-match weeks should have Monday games for BYU
      const weekMatches = byuMatches.filter(m => m.week === match.week);
      const hasMonday = weekMatches.some(m => m.day_of_week === 1);
      
      if (weekMatches.length > 1 && !hasMonday) {
        logger.warn(`⚠️  BYU week ${match.week} has no Monday game`);
      }
    }
  });
  
  if (allCorrect) {
    logger.info('✅ BYU scheduling constraints satisfied (no Sunday games)');
  }
  
  // Display BYU schedule
  logger.info('\nBYU Schedule:');
  byuMatches.forEach(match => {
    const opponent = match.home_team_id === byuTeam.team_id ? 
      mockTeams.find(t => t.team_id === match.away_team_id) :
      mockTeams.find(t => t.team_id === match.home_team_id);
    const location = match.home_team_id === byuTeam.team_id ? 'vs' : 'at';
    logger.info(`  Week ${match.week}: ${location} ${opponent.school_name} - ${getDayName(match.day_of_week)} ${match.date}`);
  });
}

function validateSeasonDates(matchups) {
  const startDate = new Date('2024-09-12');
  const endDate = new Date('2024-10-28');
  
  let datesValid = true;
  matchups.forEach(match => {
    const matchDate = new Date(match.date);
    if (matchDate < startDate || matchDate > endDate) {
      logger.error(`❌ Match on ${match.date} is outside season dates`);
      datesValid = false;
    }
  });
  
  if (datesValid) {
    logger.info('✅ All matches within season dates (Sep 12 - Oct 28)');
  }
  
  // Find actual first and last dates
  const sortedDates = matchups.map(m => new Date(m.date)).sort((a, b) => a - b);
  logger.info(`  First match: ${sortedDates[0].toISOString().split('T')[0]}`);
  logger.info(`  Last match: ${sortedDates[sortedDates.length - 1].toISOString().split('T')[0]}`);
}

function checkGeographicOptimization(matchups) {
  const regionalMatches = matchups.filter(m => m.is_regional);
  const percentage = (regionalMatches.length / matchups.length * 100).toFixed(1);
  
  logger.info(`✅ Regional matches: ${regionalMatches.length} of ${matchups.length} (${percentage}%)`);
  
  // Show some regional matchups
  logger.info('\nSample regional matchups:');
  regionalMatches.slice(0, 5).forEach(match => {
    const home = mockTeams.find(t => t.team_id === match.home_team_id);
    const away = mockTeams.find(t => t.team_id === match.away_team_id);
    logger.info(`  ${away.school_name} (${away.state}) at ${home.school_name} (${home.state})`);
  });
}

function displayScheduleSummary(matchups) {
  logger.info('\n=== Schedule Summary ===');
  
  // Day distribution
  const dayDist = {};
  matchups.forEach(m => {
    const day = getDayName(m.day_of_week);
    dayDist[day] = (dayDist[day] || 0) + 1;
  });
  
  logger.info('\nMatches by day:');
  Object.entries(dayDist).forEach(([day, count]) => {
    logger.info(`  ${day}: ${count} matches`);
  });
  
  // Time distribution
  const timeDist = {};
  matchups.forEach(m => {
    timeDist[m.time] = (timeDist[m.time] || 0) + 1;
  });
  
  logger.info('\nMatches by time:');
  Object.entries(timeDist).forEach(([time, count]) => {
    logger.info(`  ${time}: ${count} matches`);
  });
}

function displaySampleWeek(matchups, weekNum) {
  logger.info(`\n=== Week ${weekNum} Schedule ===`);
  
  const weekMatches = matchups.filter(m => m.week === weekNum)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  weekMatches.forEach(match => {
    const home = mockTeams.find(t => t.team_id === match.home_team_id);
    const away = mockTeams.find(t => t.team_id === match.away_team_id);
    const day = getDayName(match.day_of_week);
    
    logger.info(`${day} ${match.date} @ ${match.time}: ${away.school_name} at ${home.school_name}`);
  });
}

function getDayName(dayNum) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum] || 'Unknown';
}

// Run the test
runComprehensiveTest().catch(error => {
  logger.error('Test failed:', error);
  process.exit(1);
});