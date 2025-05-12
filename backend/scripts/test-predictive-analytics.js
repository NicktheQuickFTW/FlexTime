/**
 * Test script for COMPASS Predictive Analytics Component
 * 
 * This script demonstrates the neural network-based predictive analytics component
 * by generating team ratings, predicting game outcomes, and analyzing strength of schedule.
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const PredictiveAnalyticsComponent = require('../compass/components/predictive_analytics');

// Mock database object for testing
const mockDb = {
  Team: {
    findAll: async () => {
      // Generate synthetic teams
      return Array(20).fill(0).map((_, i) => ({
        id: `team_${i}`,
        name: `Team ${i}`,
        sport: { name: i % 3 === 0 ? 'Basketball' : (i % 3 === 1 ? 'Football' : 'Baseball') }
      }));
    },
    findByPk: async (id) => {
      // Return a synthetic team
      const idNumber = parseInt(id.replace('team_', '')) || 0;
      return {
        id,
        name: `Team ${idNumber}`,
        sport: { name: idNumber % 3 === 0 ? 'Basketball' : (idNumber % 3 === 1 ? 'Football' : 'Baseball') }
      };
    }
  }
};

/**
 * Create a sample schedule with synthetic data
 * @param {Array} teams - Array of team IDs
 * @returns {Object} Sample schedule
 */
function createSampleSchedule(teams) {
  const games = [];
  
  // Each team plays against every other team
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue; // Skip self-games
      
      // Create a game between teams[i] and teams[j]
      games.push({
        id: uuidv4(),
        homeTeam: { id: teams[i] },
        awayTeam: { id: teams[j] },
        date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      });
    }
  }
  
  return {
    id: uuidv4(),
    name: 'Test Schedule',
    sport: 'Basketball',
    season: '2025-2026',
    teams: teams.map(id => ({ id })),
    games
  };
}

/**
 * Test the predictive analytics component
 */
async function testPredictiveAnalytics() {
  console.log('=== COMPASS Predictive Analytics Component Test ===\n');
  
  // Create component
  const predictiveAnalytics = new PredictiveAnalyticsComponent(mockDb, {
    // Test options
    modelUpdateFrequency: 1000, // Update frequently for testing
    rosterChangeImpactFactor: 0.2
  });
  
  // Initialize component
  console.log('Initializing predictive analytics component...');
  await predictiveAnalytics.initialize();
  
  // Test team IDs
  const teamIds = ['team_1', 'team_2', 'team_3', 'team_5', 'team_8'];
  
  // Get team ratings
  console.log('\n--- Team Ratings ---');
  const ratings = {};
  
  for (const teamId of teamIds) {
    try {
      const rating = await predictiveAnalytics.getTeamRating(teamId);
      ratings[teamId] = rating;
      console.log(`${rating.name} (${rating.sport}): ${rating.rating.toFixed(1)} (${rating.ratingDistribution.tier})`);
      console.log(`  Normalized Rating: ${(rating.normalizedRating * 100).toFixed(1)}%`);
      console.log(`  Components: NET=${(rating.components.netRanking * 100).toFixed(1)}%, KenPom=${(rating.components.kenpom * 100).toFixed(1)}%\n`);
    } catch (error) {
      console.error(`Error getting rating for ${teamId}: ${error.message}`);
    }
  }
  
  // Test roster changes
  console.log('\n--- Roster Changes Impact ---');
  const teamWithChanges = 'team_1';
  
  console.log(`Adding roster changes for ${teamWithChanges}:`);
  
  // Add a top recruit
  await predictiveAnalytics.registerRosterChange(teamWithChanges, {
    playerName: 'John Smith',
    type: 'add',
    playerRating: 0.9 // Top recruit
  });
  console.log('- Added top recruit John Smith (rating: 0.9)');
  
  // Lose a player to injury
  await predictiveAnalytics.registerRosterChange(teamWithChanges, {
    playerName: 'Mike Johnson',
    type: 'injury',
    playerRating: 0.7 // Good player
  });
  console.log('- Lost Mike Johnson to injury (rating: 0.7)');
  
  // Get updated rating
  const updatedRating = await predictiveAnalytics.getTeamRating(teamWithChanges);
  console.log(`\nUpdated rating for ${updatedRating.name}: ${updatedRating.rating.toFixed(1)} (${updatedRating.ratingDistribution.tier})`);
  console.log(`Roster adjustment impact: ${(updatedRating.rosterAdjustment * 100).toFixed(2)}%`);
  
  // Test game prediction
  console.log('\n--- Game Predictions ---');
  
  // Select some teams to predict games
  const matchups = [
    { team1: 'team_1', team2: 'team_5', sport: 'Basketball' },
    { team1: 'team_2', team2: 'team_3', sport: 'Football' },
    { team1: 'team_8', team2: 'team_1', sport: 'Basketball', neutralSite: true }
  ];
  
  for (const { team1, team2, sport, neutralSite } of matchups) {
    try {
      const prediction = await predictiveAnalytics.predictGameOutcome(team1, team2, sport, neutralSite);
      
      console.log(`\n${prediction.team1.name} vs ${prediction.team2.name} (${sport}${neutralSite ? ', neutral site' : ''})`);
      console.log(`Win probability: ${prediction.team1.name}: ${(prediction.team1.winProbability * 100).toFixed(1)}%, ${prediction.team2.name}: ${(prediction.team2.winProbability * 100).toFixed(1)}%`);
      console.log(`Expected margin: ${Math.abs(prediction.expectedMargin).toFixed(1)} points in favor of ${prediction.expectedMargin > 0 ? prediction.team1.name : prediction.team2.name}`);
      console.log(`Confidence: ${prediction.confidence}`);
      
      if (prediction.factors.length > 0) {
        console.log('Key factors:');
        for (const factor of prediction.factors) {
          console.log(`- ${factor.factor}: Advantage to ${factor.advantage} (${factor.impact} impact)`);
        }
      }
    } catch (error) {
      console.error(`Error predicting game between ${team1} and ${team2}: ${error.message}`);
    }
  }
  
  // Test strength of schedule
  console.log('\n--- Strength of Schedule Analysis ---');
  
  // Create a sample schedule
  const sampleSchedule = createSampleSchedule(teamIds);
  
  for (const teamId of teamIds) {
    try {
      const sos = await predictiveAnalytics.calculateStrengthOfSchedule(sampleSchedule.games, teamId);
      
      console.log(`\nStrength of Schedule for team ${teamId}:`);
      console.log(`Overall SoS: ${(sos.overallSoS * 100).toFixed(1)}% (${sos.difficulty})`);
      console.log(`Home SoS: ${(sos.homeSoS * 100).toFixed(1)}%, Away SoS: ${(sos.awaySoS * 100).toFixed(1)}%`);
      console.log(`Future SoS: ${(sos.futureSoS * 100).toFixed(1)}%`);
      console.log(`Top Tier Opponents: ${sos.topTierOpponents} of ${sos.opponentCount}`);
    } catch (error) {
      console.error(`Error calculating SoS for ${teamId}: ${error.message}`);
    }
  }
  
  console.log('\n=== Test completed successfully ===');
}

// Run the test
testPredictiveAnalytics().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});