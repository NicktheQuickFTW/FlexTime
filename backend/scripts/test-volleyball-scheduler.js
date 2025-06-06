/**
 * Test script for Volleyball Scheduler
 * Verifies the implementation of Big 12 Volleyball scheduling requirements
 */

const VolleyballScheduler = require('../services/schedulers/sports/VolleyballScheduler');
const logger = require('../lib/logger');

// Test data - Big 12 Volleyball teams (15 teams)
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
  { team_id: 11, team_name: 'TCU Horned Frogs', team_code: 'TCU', school_name: 'TCU', state: 'TX' },
  { team_id: 12, team_name: 'Texas Tech Red Raiders', team_code: 'TTU', school_name: 'Texas Tech', state: 'TX' },
  { team_id: 13, team_name: 'UCF Knights', team_code: 'UCF', school_name: 'UCF', state: 'FL' },
  { team_id: 14, team_name: 'Utah Utes', team_code: 'UTAH', school_name: 'Utah', state: 'UT' },
  { team_id: 15, team_name: 'West Virginia Mountaineers', team_code: 'WVU', school_name: 'West Virginia', state: 'WV' }
];

// Mock football schedule for conflict testing
const mockFootballSchedule = [
  { date: '2024-09-28', home_team_id: 1, is_home: true },  // Arizona home game
  { date: '2024-10-05', home_team_id: 3, is_home: true },  // Baylor home game
  { date: '2024-10-12', home_team_id: 4, is_home: true },  // BYU home game
  { date: '2024-10-19', home_team_id: 7, is_home: true },  // Houston home game
  { date: '2024-10-26', home_team_id: 9, is_home: true },  // Kansas home game
  { date: '2024-11-02', home_team_id: 10, is_home: true }, // Kansas State home game
  { date: '2024-11-09', home_team_id: 11, is_home: true }, // TCU home game
  { date: '2024-11-16', home_team_id: 13, is_home: true }, // UCF home game
  { date: '2024-11-23', home_team_id: 14, is_home: true }, // Utah home game
  { date: '2024-11-30', home_team_id: 15, is_home: true }  // West Virginia home game
];

async function testVolleyballScheduler() {
  logger.info('=== Testing Volleyball Scheduler ===');
  
  try {
    const scheduler = new VolleyballScheduler();
    
    // Test metadata
    const metadata = scheduler.getMetadata();
    logger.info('\nScheduler Metadata:', JSON.stringify(metadata, null, 2));
    
    // Generate matchups
    logger.info('\nGenerating volleyball schedule...');
    const matchups = await scheduler.generateMatchups(mockTeams, {
      matchesPerTeam: 18,
      seasonStart: '2024-09-25',
      seasonEnd: '2024-11-30',
      footballSchedule: mockFootballSchedule
    });
    
    logger.info(`Generated ${matchups.length} total matches`);
    
    // Analyze the schedule
    analyzeSchedule(matchups, mockTeams);
    
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
    
    if (validation.warnings && validation.warnings.length > 0) {
      logger.warn('⚠️  Warnings:');
      validation.warnings.forEach(w => {
        logger.warn(`  - ${w.type}: ${w.message}`);
      });
    }
    
    // Check football conflicts
    checkFootballConflicts(matchups, mockFootballSchedule);
    
    // Display sample schedule
    displaySampleSchedule(matchups, mockTeams);
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

function analyzeSchedule(matchups, teams) {
  logger.info('\n=== Schedule Analysis ===');
  
  // 1. Matches per team
  const teamStats = {};
  teams.forEach(team => {
    teamStats[team.team_id] = { 
      total: 0, 
      home: 0, 
      away: 0,
      opponents: {},
      name: team.school_name 
    };
  });
  
  matchups.forEach(match => {
    teamStats[match.home_team_id].total++;
    teamStats[match.home_team_id].home++;
    teamStats[match.away_team_id].total++;
    teamStats[match.away_team_id].away++;
    
    // Track opponent frequencies
    teamStats[match.home_team_id].opponents[match.away_team_id] = 
      (teamStats[match.home_team_id].opponents[match.away_team_id] || 0) + 1;
    teamStats[match.away_team_id].opponents[match.home_team_id] = 
      (teamStats[match.away_team_id].opponents[match.home_team_id] || 0) + 1;
  });
  
  logger.info('\nMatches per team:');
  Object.values(teamStats).forEach(stats => {
    const twiceOpponents = Object.values(stats.opponents).filter(count => count === 2).length;
    const onceOpponents = Object.values(stats.opponents).filter(count => count === 1).length;
    
    logger.info(`  ${stats.name}: ${stats.total} total (${stats.home}H/${stats.away}A) - ` +
                `${twiceOpponents} opponents 2x, ${onceOpponents} opponents 1x`);
  });
  
  // 2. Validate opponent distribution
  logger.info('\nOpponent frequency validation:');
  let allCorrect = true;
  Object.values(teamStats).forEach(stats => {
    const frequencies = Object.values(stats.opponents);
    const twiceCount = frequencies.filter(f => f === 2).length;
    const onceCount = frequencies.filter(f => f === 1).length;
    
    if (twiceCount !== 4 || onceCount !== 10) {
      logger.error(`❌ ${stats.name}: ${twiceCount} opponents 2x (expected 4), ${onceCount} opponents 1x (expected 10)`);
      allCorrect = false;
    }
  });
  
  if (allCorrect) {
    logger.info('✅ All teams have correct opponent distribution (4 teams 2x, 10 teams 1x)');
  }
  
  // 3. Matches per week
  const weekCounts = {};
  const teamWeekLoads = {};
  
  matchups.forEach(match => {
    const week = match.week || 'Unassigned';
    weekCounts[week] = (weekCounts[week] || 0) + 1;
    
    // Track team loads per week
    [match.home_team_id, match.away_team_id].forEach(teamId => {
      if (!teamWeekLoads[teamId]) teamWeekLoads[teamId] = {};
      teamWeekLoads[teamId][week] = (teamWeekLoads[teamId][week] || 0) + 1;
    });
  });
  
  logger.info('\nMatches per week:');
  for (let week = 1; week <= 10; week++) {
    logger.info(`  Week ${week}: ${weekCounts[week] || 0} matches`);
  }
  
  // 4. Check windows per week constraint
  logger.info('\nWindows per week validation:');
  let windowsValid = true;
  Object.entries(teamWeekLoads).forEach(([teamId, weeks]) => {
    Object.entries(weeks).forEach(([week, count]) => {
      if (count > 2) {
        const team = teams.find(t => t.team_id === parseInt(teamId));
        logger.error(`❌ ${team.school_name} has ${count} matches in week ${week} (max 2)`);
        windowsValid = false;
      }
    });
  });
  
  if (windowsValid) {
    logger.info('✅ All teams respect 2 matches per week limit');
  }
  
  // 5. Day of week distribution
  const dayDistribution = {};
  matchups.forEach(match => {
    const day = getDayName(match.day_of_week);
    dayDistribution[day] = (dayDistribution[day] || 0) + 1;
  });
  
  logger.info('\nDay of week distribution:');
  Object.entries(dayDistribution).forEach(([day, count]) => {
    logger.info(`  ${day}: ${count} matches`);
  });
}

function checkFootballConflicts(matchups, footballSchedule) {
  logger.info('\n=== Football Conflict Check ===');
  
  const conflicts = [];
  
  matchups.forEach(match => {
    const matchDate = match.date;
    
    // Check if this date has a home football game for either team
    const homeFootballConflict = footballSchedule.find(game => 
      game.date === matchDate && game.home_team_id === match.home_team_id && game.is_home
    );
    
    if (homeFootballConflict) {
      conflicts.push({
        match,
        footballGame: homeFootballConflict,
        type: 'HOME_VENUE_CONFLICT'
      });
    }
  });
  
  if (conflicts.length === 0) {
    logger.info('✅ No football conflicts detected');
  } else {
    logger.warn(`⚠️  Found ${conflicts.length} potential conflicts:`);
    conflicts.forEach(conflict => {
      const homeTeam = mockTeams.find(t => t.team_id === conflict.match.home_team_id);
      logger.warn(`  - ${conflict.match.date}: ${homeTeam.school_name} volleyball and football both at home`);
    });
  }
}

function displaySampleSchedule(matchups, teams) {
  logger.info('\n=== Sample Schedule (Weeks 1-3) ===');
  
  for (let week = 1; week <= 3; week++) {
    const weekMatches = matchups.filter(m => m.week === week)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    logger.info(`\nWeek ${week}:`);
    
    weekMatches.forEach(match => {
      const homeTeam = teams.find(t => t.team_id === match.home_team_id);
      const awayTeam = teams.find(t => t.team_id === match.away_team_id);
      const day = getDayName(match.day_of_week);
      const rematch = match.is_rematch ? ' (rematch)' : '';
      
      logger.info(`  ${day} ${match.date} @ ${match.time}: ${awayTeam.school_name} at ${homeTeam.school_name}${rematch}`);
    });
  }
  
  // Show rematch distribution
  logger.info('\n=== Rematch Analysis ===');
  const rematches = matchups.filter(m => m.is_rematch);
  logger.info(`Total rematches: ${rematches.length}`);
  
  const rematchWeeks = {};
  rematches.forEach(match => {
    const week = match.week || 'Unassigned';
    rematchWeeks[week] = (rematchWeeks[week] || 0) + 1;
  });
  
  logger.info('Rematches by week:');
  Object.entries(rematchWeeks).forEach(([week, count]) => {
    logger.info(`  Week ${week}: ${count} rematches`);
  });
}

function getDayName(dayNum) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum] || 'Unknown';
}

// Run the test
testVolleyballScheduler().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});