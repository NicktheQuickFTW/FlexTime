/**
 * Test Integrated Sport Scheduler System
 * 
 * Verifies that the FT Builder Engine properly uses sport-specific schedulers
 */

const FTBuilderEngine = require('../services/FT_Builder_Engine');
const Big12DataService = require('../services/big12DataService');
const SportSchedulerRegistry = require('../services/schedulers/SportSchedulerRegistry');

async function testIntegratedSystem() {
  console.log('\n=== Testing Integrated Sport Scheduler System ===\n');
  
  try {
    // Show registered schedulers
    console.log('📋 Registered Sport Schedulers:');
    const registeredSports = SportSchedulerRegistry.getRegisteredSports();
    console.log('   Sports with custom schedulers:', registeredSports);
    
    // Initialize FT Builder Engine
    const engine = new FTBuilderEngine({
      useHistoricalData: false // Disable for testing
    });
    
    // Test 1: Football (has custom scheduler)
    console.log('\n🏈 Test 1: Football Scheduling (Sport ID: 8)');
    const footballTeams = Big12DataService.getTeams({ sport_id: 8 });
    const footballResult = await engine.generateSchedule({
      sportId: 8,
      teamIds: footballTeams.slice(0, 16).map(t => t.team_id),
      gamesPerTeam: 9,
      startDate: '2025-09-06',
      endDate: '2025-11-29',
      season: '2025'
    });
    
    console.log(`   Success: ${footballResult.success}`);
    console.log(`   Scheduler Used: ${footballResult.metadata?.scheduler || 'Unknown'}`);
    console.log(`   Games Generated: ${footballResult.schedule?.games?.length || 0}`);
    console.log(`   Score: ${footballResult.metadata?.score}`);
    
    // Test 2: Basketball (no custom scheduler yet)
    console.log('\n🏀 Test 2: Basketball Scheduling (Sport ID: 2)');
    const basketballTeams = Big12DataService.getTeams({ sport_id: 2 });
    const basketballResult = await engine.generateSchedule({
      sportId: 2,
      teamIds: basketballTeams.slice(0, 8).map(t => t.team_id),
      gamesPerTeam: 10,
      startDate: '2025-12-01',
      endDate: '2026-02-28',
      season: '2025-26'
    });
    
    console.log(`   Success: ${basketballResult.success}`);
    console.log(`   Scheduler Used: ${basketballResult.metadata?.engine_version ? 'SimpleSchedulingService' : 'Unknown'}`);
    console.log(`   Games Generated: ${basketballResult.schedule?.games?.length || 0}`);
    console.log(`   Score: ${basketballResult.metadata?.score}`);
    
    // Test 3: Lacrosse (uses constraint solver)
    console.log('\n🥍 Test 3: Lacrosse Scheduling (Sport ID: 13)');
    const lacrosseResult = await engine.generateSchedule({
      sportId: 13,
      teamIds: [1313, 613, 213, 713], // Dummy team IDs for lacrosse
      gamesPerTeam: 5,
      startDate: '2026-02-01',
      endDate: '2026-04-01',
      season: '2026'
    });
    
    console.log(`   Success: ${lacrosseResult.success}`);
    console.log(`   Scheduler Used: ${lacrosseResult.metadata?.constraint_solver ? 'LacrosseConstraintSolver' : 'Unknown'}`);
    console.log(`   Games Generated: ${lacrosseResult.schedule?.games?.length || 0}`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   ✅ Sport-specific schedulers are ${registeredSports.length > 0 ? 'OPERATIONAL' : 'NOT OPERATIONAL'}`);
    console.log(`   ✅ Fallback to SimpleSchedulingService is ${basketballResult.success ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   ✅ Lacrosse constraint solver is ${lacrosseResult.success ? 'WORKING' : 'NOT WORKING'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testIntegratedSystem().catch(console.error);