/**
 * Test script for Soccer Scheduler
 * Verifies the implementation of Big 12 Soccer scheduling requirements
 */

const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SoccerScheduler = require('../services/schedulers/sports/SoccerScheduler');
const logger = require('../lib/logger');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function loadSoccerTeams() {
  try {
    const query = `
      SELECT DISTINCT
        t.team_id,
        t.team_name,
        t.team_code,
        s.school_id,
        s.name as school_name,
        s.location,
        s.state
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      WHERE t.sport_id = 14  -- Soccer
      AND s.conference = 'Big 12'
      ORDER BY s.name
    `;
    
    const result = await pool.query(query);
    logger.info(`Loaded ${result.rows.length} soccer teams`);
    return result.rows;
  } catch (error) {
    logger.error('Error loading soccer teams:', error);
    throw error;
  }
}

async function testSoccerScheduler() {
  logger.info('=== Testing Soccer Scheduler ===');
  
  try {
    // Load soccer teams
    const teams = await loadSoccerTeams();
    
    if (teams.length !== 16) {
      logger.warn(`Expected 16 teams but found ${teams.length}`);
    }
    
    // Log team names for verification
    logger.info('\nSoccer Teams:');
    teams.forEach(team => {
      logger.info(`  - ${team.school_name} (${team.team_code})`);
    });
    
    // Create scheduler instance
    const scheduler = new SoccerScheduler();
    
    // Test metadata
    const metadata = scheduler.getMetadata();
    logger.info('\nScheduler Metadata:', JSON.stringify(metadata, null, 2));
    
    // Generate matchups
    logger.info('\nGenerating soccer schedule...');
    const matchups = await scheduler.generateMatchups(teams, {
      matchesPerTeam: 11,
      seasonStart: '2024-09-12',
      seasonEnd: '2024-10-28'
    });
    
    logger.info(`Generated ${matchups.length} total matches`);
    
    // Analyze the schedule
    analyzeSchedule(matchups, teams);
    
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
    
    if (validation.warnings.length > 0) {
      logger.warn('⚠️  Warnings:');
      validation.warnings.forEach(w => {
        logger.warn(`  - ${w.type}: ${w.message}`);
      });
    }
    
    // Display sample schedule
    displaySampleSchedule(matchups, teams);
    
  } catch (error) {
    logger.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

function analyzeSchedule(matchups, teams) {
  logger.info('\n=== Schedule Analysis ===');
  
  // 1. Matches per team
  const teamMatchCounts = {};
  teams.forEach(team => {
    teamMatchCounts[team.team_id] = { 
      total: 0, 
      home: 0, 
      away: 0,
      name: team.school_name 
    };
  });
  
  matchups.forEach(match => {
    teamMatchCounts[match.home_team_id].total++;
    teamMatchCounts[match.home_team_id].home++;
    teamMatchCounts[match.away_team_id].total++;
    teamMatchCounts[match.away_team_id].away++;
  });
  
  logger.info('\nMatches per team:');
  Object.values(teamMatchCounts).forEach(stats => {
    logger.info(`  ${stats.name}: ${stats.total} total (${stats.home}H/${stats.away}A)`);
  });
  
  // 2. Matches per week
  const weekCounts = {};
  matchups.forEach(match => {
    const week = match.week || 'Unassigned';
    weekCounts[week] = (weekCounts[week] || 0) + 1;
  });
  
  logger.info('\nMatches per week:');
  for (let week = 1; week <= 7; week++) {
    logger.info(`  Week ${week}: ${weekCounts[week] || 0} matches`);
  }
  
  // 3. Day of week distribution
  const dayDistribution = {};
  matchups.forEach(match => {
    const day = getDayName(match.day_of_week);
    dayDistribution[day] = (dayDistribution[day] || 0) + 1;
  });
  
  logger.info('\nDay of week distribution:');
  Object.entries(dayDistribution).forEach(([day, count]) => {
    logger.info(`  ${day}: ${count} matches`);
  });
  
  // 4. BYU games check
  const byuTeam = teams.find(t => t.school_name?.includes('BYU') || t.team_code === 'BYU');
  if (byuTeam) {
    const byuMatches = matchups.filter(m => 
      m.home_team_id === byuTeam.team_id || m.away_team_id === byuTeam.team_id
    );
    
    logger.info('\nBYU matches:');
    byuMatches.forEach(match => {
      const opponent = match.home_team_id === byuTeam.team_id ? 
        match.away_team : match.home_team;
      const location = match.home_team_id === byuTeam.team_id ? 'Home' : 'Away';
      const day = getDayName(match.day_of_week);
      logger.info(`  Week ${match.week}: vs ${opponent.school_name} (${location}) - ${day} ${match.date}`);
    });
  }
  
  // 5. Geographic distribution
  const regionalMatches = matchups.filter(m => m.is_regional);
  logger.info(`\nRegional matches: ${regionalMatches.length} of ${matchups.length} (${Math.round(regionalMatches.length / matchups.length * 100)}%)`);
}

function displaySampleSchedule(matchups, teams) {
  logger.info('\n=== Sample Schedule (First 2 Weeks) ===');
  
  const weeks = [1, 2];
  weeks.forEach(week => {
    const weekMatches = matchups.filter(m => m.week === week);
    logger.info(`\nWeek ${week}:`);
    
    weekMatches.forEach(match => {
      const homeTeam = teams.find(t => t.team_id === match.home_team_id);
      const awayTeam = teams.find(t => t.team_id === match.away_team_id);
      const day = getDayName(match.day_of_week);
      
      logger.info(`  ${day} ${match.date} @ ${match.time}: ${awayTeam.school_name} at ${homeTeam.school_name}`);
    });
  });
}

function getDayName(dayNum) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum] || 'Unknown';
}

// Run the test
testSoccerScheduler().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});