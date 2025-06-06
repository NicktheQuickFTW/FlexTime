/**
 * Test Football Scheduler
 * 
 * Quick test to verify the FootballScheduler implementation
 */

const FootballScheduler = require('../services/schedulers/sports/FootballScheduler');
const Big12DataService = require('../services/big12DataService');

async function testFootballScheduler() {
  console.log('\n=== Testing Football Scheduler ===\n');
  
  try {
    // Initialize scheduler
    const scheduler = new FootballScheduler();
    console.log('✅ FootballScheduler initialized');
    console.log('   Metadata:', scheduler.getMetadata());
    
    // Get football teams
    const teams = Big12DataService.getTeams({ sport_id: 8 });
    console.log(`\n✅ Found ${teams.length} football teams`);
    
    // Test matchup generation
    console.log('\n📅 Generating football matchups...');
    const matchups = await scheduler.generateMatchups(teams.slice(0, 16), {
      gamesPerTeam: 9,
      season: '2025'
    });
    
    console.log(`✅ Generated ${matchups.length} matchups`);
    
    // Analyze results
    const teamStats = {};
    matchups.forEach(game => {
      if (!teamStats[game.home_team_id]) {
        teamStats[game.home_team_id] = { games: 0, home: 0, away: 0, weeks: new Set() };
      }
      if (!teamStats[game.away_team_id]) {
        teamStats[game.away_team_id] = { games: 0, home: 0, away: 0, weeks: new Set() };
      }
      
      teamStats[game.home_team_id].games++;
      teamStats[game.home_team_id].home++;
      teamStats[game.home_team_id].weeks.add(game.week);
      
      teamStats[game.away_team_id].games++;
      teamStats[game.away_team_id].away++;
      teamStats[game.away_team_id].weeks.add(game.week);
    });
    
    // Show team statistics
    console.log('\n📊 Team Statistics:');
    Object.entries(teamStats).slice(0, 5).forEach(([teamId, stats]) => {
      console.log(`   Team ${teamId}: ${stats.games} games (${stats.home}H/${stats.away}A), ${stats.weeks.size} weeks played`);
    });
    
    // Check constraints
    console.log('\n📋 Default Constraints:');
    const constraints = scheduler.getDefaultConstraints();
    constraints.forEach(c => {
      console.log(`   - ${c.type}: ${c.description || 'No description'}`);
    });
    
    // Validate schedule
    console.log('\n✓ Validating schedule...');
    const validation = scheduler.validateSchedule(matchups);
    console.log(`   Valid: ${validation.valid}`);
    console.log(`   Violations: ${validation.violations.length}`);
    console.log(`   Warnings: ${validation.warnings.length}`);
    
    if (validation.violations.length > 0) {
      console.log('\n❌ Violations:');
      validation.violations.forEach(v => {
        console.log(`   - ${v.type}: ${v.message}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testFootballScheduler().catch(console.error);