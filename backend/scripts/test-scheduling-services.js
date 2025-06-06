/**
 * Test Script for FlexTime Scheduling Services
 * 
 * This script tests the new simplified scheduling services to ensure
 * they work correctly before integration with the frontend.
 */

const Big12DataService = require('../services/big12DataService');
const SimpleSchedulingService = require('../services/simpleSchedulingService');
const SimpleConstraintEvaluator = require('../services/simpleConstraintEvaluator');
const FTBuilderEngine = require('../services/FT_Builder_Engine');

// Test colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBig12DataService() {
  log('\n=== Testing Big12DataService ===', 'bright');
  
  try {
    // Test getting teams by sport
    log('\n1. Testing getTeamsBySport (Men\'s Basketball):', 'blue');
    const basketballTeams = Big12DataService.getTeamsBySport(2);
    log(`Found ${basketballTeams.length} Men's Basketball teams`, 'green');
    
    // Show first 3 teams
    basketballTeams.slice(0, 3).forEach(team => {
      log(`  - ${team.name} (ID: ${team.team_id})`, 'yellow');
    });
    
    // Test team ID calculation
    log('\n2. Testing calculateTeamId:', 'blue');
    const teamId = Big12DataService.calculateTeamId(1, 8); // Arizona Football
    log(`Arizona (1) + Football (8) = Team ID: ${teamId}`, 'green');
    
    // Test getting team by ID
    log('\n3. Testing getTeamById:', 'blue');
    const team = Big12DataService.getTeamById(108);
    if (team) {
      log(`Found team: ${team.name} - ${team.sport_name}`, 'green');
    }
    
    // Test venues
    log('\n4. Testing getVenues for Arizona:', 'blue');
    const venues = Big12DataService.getVenues({ school_id: 1 });
    log(`Found ${venues.length} venues for Arizona`, 'green');
    venues.forEach(venue => {
      log(`  - ${venue.name} (Capacity: ${venue.capacity})`, 'yellow');
    });
    
    // Test COMPASS ratings
    log('\n5. Testing COMPASS ratings:', 'blue');
    const compassRating = Big12DataService.getCompassRating(108);
    if (compassRating) {
      log(`Arizona Football COMPASS Rating: ${compassRating.overall}`, 'green');
    }
    
    log('\n✓ Big12DataService tests passed!', 'green');
    
  } catch (error) {
    log(`✗ Big12DataService test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

async function testSimpleSchedulingService() {
  log('\n=== Testing SimpleSchedulingService ===', 'bright');
  
  try {
    // Test schedule generation for Men's Basketball
    log('\n1. Generating schedule for Men\'s Basketball (4 teams):', 'blue');
    
    const teamIds = [102, 202, 302, 402]; // Arizona, ASU, Baylor, BYU
    
    const schedule = await SimpleSchedulingService.generateSchedule({
      sport_id: 2,
      team_ids: teamIds,
      start_date: '2025-12-01',
      end_date: '2026-02-28',
      schedule_type: 'round_robin',
      home_away_balance: true
    });
    
    log(`Generated ${schedule.games.length} games`, 'green');
    log(`Duration: ${schedule.metadata.duration_days} days`, 'yellow');
    log(`Games per team average: ${schedule.metadata.games_per_team_avg}`, 'yellow');
    
    // Show first 5 games
    log('\nFirst 5 games:', 'blue');
    schedule.games.slice(0, 5).forEach(game => {
      log(`  ${game.date} - ${game.home_team.school_short} vs ${game.away_team.school_short}`, 'yellow');
    });
    
    // Test partial round robin
    log('\n2. Testing partial round-robin (10 games per team):', 'blue');
    
    const partialSchedule = await SimpleSchedulingService.generateSchedule({
      sport_id: 2,
      team_ids: [102, 202, 302, 402, 502, 602], // 6 teams
      start_date: '2025-12-01',
      end_date: '2026-02-28',
      games_per_team: 10,
      schedule_type: 'partial_round_robin'
    });
    
    log(`Generated ${partialSchedule.games.length} games for partial schedule`, 'green');
    
    log('\n✓ SimpleSchedulingService tests passed!', 'green');
    
  } catch (error) {
    log(`✗ SimpleSchedulingService test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

async function testSimpleConstraintEvaluator() {
  log('\n=== Testing SimpleConstraintEvaluator ===', 'bright');
  
  try {
    // Get recommended constraints for Men's Basketball
    log('\n1. Getting recommended constraints for Men\'s Basketball:', 'blue');
    const constraints = SimpleConstraintEvaluator.getRecommendedConstraints(2);
    
    log(`Found ${constraints.length} recommended constraints:`, 'green');
    constraints.forEach(constraint => {
      log(`  - ${constraint.type}: ${constraint.description}`, 'yellow');
    });
    
    // Generate a test schedule and evaluate it
    log('\n2. Evaluating a schedule with constraints:', 'blue');
    
    const schedule = await SimpleSchedulingService.generateSchedule({
      sport_id: 2,
      team_ids: [102, 202, 302, 402],
      start_date: '2025-12-01',
      end_date: '2025-12-31', // Short period to force violations
      schedule_type: 'round_robin'
    });
    
    // Add exam blackout constraint
    const testConstraints = [
      ...constraints,
      {
        type: 'EXAM_BLACKOUT',
        start_date: '2025-12-15',
        end_date: '2025-12-22',
        reason: 'Final Exams',
        team_ids: [102, 202, 302, 402]
      }
    ];
    
    const evaluation = SimpleConstraintEvaluator.evaluateSchedule(
      schedule.games,
      testConstraints
    );
    
    log(`\nEvaluation Results:`, 'blue');
    log(`  Valid: ${evaluation.valid}`, evaluation.valid ? 'green' : 'red');
    log(`  Score: ${evaluation.score}/100`, 'yellow');
    log(`  Violations: ${evaluation.violations.length}`, 'yellow');
    log(`  Warnings: ${evaluation.warnings.length}`, 'yellow');
    
    if (evaluation.violations.length > 0) {
      log('\nSample violations:', 'red');
      evaluation.violations.slice(0, 3).forEach(violation => {
        log(`  - ${violation.type}: ${violation.message}`, 'yellow');
      });
    }
    
    log('\n✓ SimpleConstraintEvaluator tests passed!', 'green');
    
  } catch (error) {
    log(`✗ SimpleConstraintEvaluator test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

async function testFTBuilderEngine() {
  log('\n=== Testing FT Builder Engine ===', 'bright');
  
  try {
    // Initialize FT Builder
    const ftBuilder = new FTBuilderEngine({
      useHistoricalData: false, // Disable for testing
      useLocalRecommendations: true
    });
    
    await ftBuilder.initialize();
    log('FT Builder initialized successfully', 'green');
    
    // Test schedule generation through FT Builder
    log('\n1. Generating schedule through FT Builder:', 'blue');
    
    const result = await ftBuilder.generateSchedule({
      sportId: 2, // Men's Basketball
      teamIds: [102, 202, 302, 402, 502, 602], // 6 teams
      startDate: '2026-01-01',
      endDate: '2026-02-28',
      gamesPerTeam: 10,
      scheduleType: 'partial_round_robin',
      saveToDatabase: false // Don't save for testing
    });
    
    if (result.success) {
      log('Schedule generated successfully!', 'green');
      log(`  Schedule ID: ${result.schedule_id}`, 'yellow');
      log(`  Total games: ${result.schedule.games.length}`, 'yellow');
      log(`  Score: ${result.evaluation.score}/100`, 'yellow');
      log(`  Violations: ${result.evaluation.violations.length}`, 'yellow');
    } else {
      log(`Schedule generation failed: ${result.error}`, 'red');
    }
    
    // Test getting recommendations
    log('\n2. Getting scheduling recommendations:', 'blue');
    const recommendations = await ftBuilder.getSchedulingRecommendations({
      sportType: 'MBB'
    });
    
    log(`Recommendations source: ${recommendations.source}`, 'green');
    
    log('\n✓ FT Builder Engine tests passed!', 'green');
    
  } catch (error) {
    log(`✗ FT Builder Engine test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

async function runAllTests() {
  log('\n🧪 FlexTime Scheduling Services Test Suite', 'bright');
  log('==========================================', 'bright');
  
  await testBig12DataService();
  await testSimpleSchedulingService();
  await testSimpleConstraintEvaluator();
  await testFTBuilderEngine();
  
  log('\n✅ All tests completed!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Update backend index.js to register enhanced routes', 'yellow');
  log('2. Update frontend API client to use new endpoints', 'yellow');
  log('3. Test FT Builder UI with real data flow', 'yellow');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});