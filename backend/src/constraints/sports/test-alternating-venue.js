/**
 * Test script for Universal Alternating Venue Constraint
 * 
 * This test validates that the constraint correctly identifies violations
 * and ensures single-game trips alternate venues between seasons.
 */

const UniversalAlternatingVenueConstraint = require('./UniversalAlternatingVenueConstraint');

// Create test instance
const constraint = new UniversalAlternatingVenueConstraint();

/**
 * Test Case 1: No previous season data (should pass)
 */
function testNoPreviousSeasonData() {
  console.log('\n=== Test Case 1: No Previous Season Data ===');
  
  const currentSchedule = [
    { homeTeam: 'Kansas', awayTeam: 'Texas Tech', isConference: true, date: '2025-09-01' },
    { homeTeam: 'Oklahoma State', awayTeam: 'Kansas', isConference: true, date: '2025-09-08' }
  ];
  
  const result = constraint.evaluateAlternatingVenue(currentSchedule, null, { sport: 'football' });
  
  console.log('Result:', result);
  console.log('Expected: satisfied = true (no previous data)');
  console.log('Actual: satisfied =', result.satisfied);
  console.log('✅ Test passed:', result.satisfied === true);
}

/**
 * Test Case 2: Perfect alternation (should pass)
 */
function testPerfectAlternation() {
  console.log('\n=== Test Case 2: Perfect Alternation ===');
  
  const previousSchedule = [
    // Kansas played at Texas Tech (single game)
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2024-09-01' },
    // Iowa State hosted West Virginia (single game)
    { homeTeam: 'Iowa State', awayTeam: 'West Virginia', isConference: true, date: '2024-09-08' }
  ];
  
  const currentSchedule = [
    // Now Kansas hosts Texas Tech (correctly alternated)
    { homeTeam: 'Kansas', awayTeam: 'Texas Tech', isConference: true, date: '2025-09-01' },
    // Now West Virginia hosts Iowa State (correctly alternated)
    { homeTeam: 'West Virginia', awayTeam: 'Iowa State', isConference: true, date: '2025-09-08' }
  ];
  
  const result = constraint.evaluateAlternatingVenue(currentSchedule, previousSchedule, { sport: 'football' });
  
  console.log('Result:', result);
  console.log('Expected: satisfied = true (perfect alternation)');
  console.log('Actual: satisfied =', result.satisfied);
  console.log('✅ Test passed:', result.satisfied === true);
}

/**
 * Test Case 3: Venue repetition violation (should fail)
 */
function testVenueRepetitionViolation() {
  console.log('\n=== Test Case 3: Venue Repetition Violation ===');
  
  const previousSchedule = [
    // Kansas played at Texas Tech (single game)
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2024-09-01' },
    // Oklahoma State played at Baylor (single game)  
    { homeTeam: 'Baylor', awayTeam: 'Oklahoma State', isConference: true, date: '2024-09-08' }
  ];
  
  const currentSchedule = [
    // Kansas AGAIN plays at Texas Tech (VIOLATION - should be at home)
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2025-09-01' },
    // Oklahoma State AGAIN plays at Baylor (VIOLATION - should be at home)
    { homeTeam: 'Baylor', awayTeam: 'Oklahoma State', isConference: true, date: '2025-09-08' }
  ];
  
  const result = constraint.evaluateAlternatingVenue(currentSchedule, previousSchedule, { sport: 'football' });
  
  console.log('Result:', result);
  console.log('Expected: satisfied = false (2 violations)');
  console.log('Actual: satisfied =', result.satisfied);
  console.log('Violations:', result.details.violations);
  console.log('Violation details:', result.details.violationDetails);
  console.log('✅ Test passed:', result.satisfied === false && result.details.violations === 2);
}

/**
 * Test Case 4: Mixed single and multiple games (should handle correctly)
 */
function testMixedSingleAndMultipleGames() {
  console.log('\n=== Test Case 4: Mixed Single and Multiple Games ===');
  
  const previousSchedule = [
    // Kansas vs Texas Tech - multiple games (should be ignored)
    { homeTeam: 'Kansas', awayTeam: 'Texas Tech', isConference: true, date: '2024-09-01' },
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2024-09-15' },
    // Oklahoma State vs Baylor - single game
    { homeTeam: 'Baylor', awayTeam: 'Oklahoma State', isConference: true, date: '2024-09-08' }
  ];
  
  const currentSchedule = [
    // Kansas vs Texas Tech - again multiple games (should be ignored)
    { homeTeam: 'Kansas', awayTeam: 'Texas Tech', isConference: true, date: '2025-09-01' },
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2025-09-15' },
    // Oklahoma State vs Baylor - correctly alternated (should pass)
    { homeTeam: 'Oklahoma State', awayTeam: 'Baylor', isConference: true, date: '2025-09-08' }
  ];
  
  const result = constraint.evaluateAlternatingVenue(currentSchedule, previousSchedule, { sport: 'football' });
  
  console.log('Result:', result);
  console.log('Expected: satisfied = true (only single games matter)');
  console.log('Actual: satisfied =', result.satisfied);
  console.log('✅ Test passed:', result.satisfied === true);
}

/**
 * Test Case 5: Basketball-specific test with gender
 */
function testBasketballWithGender() {
  console.log('\n=== Test Case 5: Basketball with Gender ===');
  
  const previousSchedule = [
    { homeTeam: 'Kansas', awayTeam: 'Iowa State', isConference: true, date: '2024-02-01' }
  ];
  
  const currentSchedule = [
    // Correctly alternated
    { homeTeam: 'Iowa State', awayTeam: 'Kansas', isConference: true, date: '2025-02-01' }
  ];
  
  const result = constraint.evaluateAlternatingVenue(currentSchedule, previousSchedule, { 
    sport: 'basketball', 
    gender: 'mens' 
  });
  
  console.log('Result:', result);
  console.log('Expected: satisfied = true (basketball alternation works)');
  console.log('Actual: satisfied =', result.satisfied);
  console.log('✅ Test passed:', result.satisfied === true);
}

/**
 * Test recommendations generation
 */
function testRecommendations() {
  console.log('\n=== Test Case 6: Recommendations Generation ===');
  
  const previousSchedule = [
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2024-09-01' }
  ];
  
  const currentSchedule = [
    // Violation - Kansas should be home this time
    { homeTeam: 'Texas Tech', awayTeam: 'Kansas', isConference: true, date: '2025-09-01' }
  ];
  
  const result = constraint.evaluateAlternatingVenue(currentSchedule, previousSchedule, { sport: 'football' });
  const recommendations = constraint.generateRecommendations(result);
  
  console.log('Recommendations:', recommendations);
  console.log('Expected: recommendation to swap venue');
  console.log('✅ Test passed:', recommendations.length > 0 && recommendations[0].recommendedVenue === 'home');
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running Universal Alternating Venue Constraint Tests\n');
  
  testNoPreviousSeasonData();
  testPerfectAlternation();
  testVenueRepetitionViolation();
  testMixedSingleAndMultipleGames();
  testBasketballWithGender();
  testRecommendations();
  
  console.log('\n🎉 All tests completed!');
}

// Export for use in other test files
module.exports = {
  runAllTests,
  testNoPreviousSeasonData,
  testPerfectAlternation,
  testVenueRepetitionViolation,
  testMixedSingleAndMultipleGames,
  testBasketballWithGender,
  testRecommendations
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}