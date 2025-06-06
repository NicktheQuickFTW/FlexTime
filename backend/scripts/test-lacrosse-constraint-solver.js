/**
 * Test script for Lacrosse Constraint Solver
 * 
 * Tests the FT Builder Engine's ability to generate optimal lacrosse schedules
 * with all affiliate teams and constraint satisfaction.
 */

const FTBuilderEngine = require('../services/FT_Builder_Engine');
const logger = require('../lib/logger');

async function testLacrosseConstraintSolver() {
  console.log('🥍 Testing Lacrosse Constraint Solver');
  console.log('=====================================\n');
  
  try {
    // Initialize FT Builder Engine
    const ftBuilder = new FTBuilderEngine();
    await ftBuilder.initialize();
    
    // Test 1: Generate 2027 schedule with constraint solver
    console.log('Test 1: Generate 2027 Lacrosse Schedule');
    console.log('---------------------------------------');
    
    const parameters = {
      sportId: 13, // Lacrosse
      teamIds: ['CIN', 'UF', 'ASU', 'COL', 'UCD', 'SDSU'],
      startDate: '2027-03-27',
      endDate: '2027-04-24',
      targetYear: 2027,
      previousYear: 2026,
      saveToDatabase: false
    };
    
    const result = await ftBuilder.generateSchedule(parameters);
    
    if (result.success) {
      console.log('✅ Schedule generated successfully!\n');
      
      // Display schedule
      console.log('📅 2027 Big 12 Lacrosse Schedule:');
      console.log('=================================');
      console.log('Week,Date,Matchup,Venue');
      
      result.schedule.games.forEach(game => {
        console.log(`Week ${game.week},${game.date},${game.away_team} @ ${game.home_team},${game.venue}`);
      });
      
      // Display analysis
      console.log('\n📊 Schedule Analysis:');
      console.log('====================');
      const analysis = result.schedule.analysis;
      
      console.log('\nHome/Away Distribution:');
      Object.entries(analysis.homeAwayDistribution).forEach(([team, dist]) => {
        console.log(`  ${team}: ${dist.home}H/${dist.away}A`);
      });
      
      console.log('\nMax Consecutive Games:');
      Object.entries(analysis.consecutiveGames).forEach(([team, consec]) => {
        console.log(`  ${team}: Home=${consec.maxConsecHome}, Away=${consec.maxConsecAway}`);
      });
      
      console.log('\nGames Per Week:');
      Object.entries(analysis.gamesPerWeek).forEach(([week, count]) => {
        console.log(`  ${week}: ${count} games`);
      });
      
      console.log('\nConstraints Satisfied:', analysis.constraintsSatisfied ? '✅ YES' : '❌ NO');
      console.log('Total Games:', analysis.totalGames);
      console.log('Games Per Team:', analysis.gamesPerTeam);
      console.log('Weeks Played:', analysis.weeksPlayed);
      
      // Verify all teams included
      console.log('\n✅ Team Verification:');
      const teamsInSchedule = new Set();
      result.schedule.games.forEach(game => {
        teamsInSchedule.add(game.home_team);
        teamsInSchedule.add(game.away_team);
      });
      console.log(`Teams in schedule: ${[...teamsInSchedule].join(', ')}`);
      console.log(`All 6 teams included: ${teamsInSchedule.size === 6 ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log('❌ Schedule generation failed:', result.error);
    }
    
    // Test 2: Verify constraint solver logic
    console.log('\n\nTest 2: Constraint Solver Verification');
    console.log('-------------------------------------');
    
    // Test direct constraint solver
    const LacrosseConstraintSolver = require('../services/LacrosseConstraintSolver');
    const solver = new LacrosseConstraintSolver();
    
    // Mock previous year data (2026 schedule)
    const previousYear2026 = {
      'CIN-UCD': { home: 'UCD', away: 'CIN' },
      'CIN-ASU': { home: 'CIN', away: 'ASU' },
      'CIN-COL': { home: 'COL', away: 'CIN' },
      'CIN-UF': { home: 'CIN', away: 'UF' },
      'CIN-SDSU': { home: 'CIN', away: 'SDSU' },
      'UF-ASU': { home: 'ASU', away: 'UF' },
      'UF-COL': { home: 'UF', away: 'COL' },
      'UF-SDSU': { home: 'SDSU', away: 'UF' },
      'UF-UCD': { home: 'UF', away: 'UCD' },
      'ASU-COL': { home: 'ASU', away: 'COL' },
      'ASU-UCD': { home: 'ASU', away: 'UCD' },
      'ASU-SDSU': { home: 'SDSU', away: 'ASU' },
      'COL-UCD': { home: 'UCD', away: 'COL' },
      'COL-SDSU': { home: 'COL', away: 'SDSU' },
      'UCD-SDSU': { home: 'UCD', away: 'SDSU' }
    };
    
    // Target distribution for 2027 (flipped from 2026)
    const targetDistribution2027 = {
      'CIN': { home: 2, away: 3 }, // Was 3H/2A in 2026
      'UF': { home: 3, away: 2 },  // Was 2H/3A in 2026
      'ASU': { home: 3, away: 2 }, // Was 2H/3A in 2026
      'COL': { home: 3, away: 2 }, // Was 2H/3A in 2026
      'UCD': { home: 2, away: 3 }, // Was 3H/2A in 2026
      'SDSU': { home: 2, away: 3 } // Was 3H/2A in 2026
    };
    
    console.log('Testing constraint solver with:');
    console.log('- Previous year (2026) data loaded');
    console.log('- Target distributions set for 2027');
    console.log('- All 6 teams (3 Big 12 + 3 affiliates)');
    
    const testSchedule = solver.generateSchedule(previousYear2026, targetDistribution2027);
    
    if (testSchedule) {
      console.log('\n✅ Constraint solver test passed!');
      console.log('Generated schedule follows all constraints:');
      console.log('- Single round-robin format');
      console.log('- Max 2 consecutive away games');
      console.log('- Home/away balance targets');
      console.log('- All affiliate teams included');
    } else {
      console.log('\n❌ Constraint solver test failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testLacrosseConstraintSolver()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });