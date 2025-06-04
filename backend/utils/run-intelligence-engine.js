/**
 * Script to test the integration between HELiiX Intelligence Connector and Python backend
 * 
 * This script demonstrates how to use the HELiiX Intelligence Connector to delegate tasks
 * to the Python Intelligence Engine.
 * 
 * Usage:
 *   node scripts/run-intelligence-engine.js
 * 
 * Prerequisites:
 *   - Python Intelligence Engine must be running on localhost:4001
 *   - Environment variables must be set (see below)
 */

require('dotenv').config();
const { heliixConnector } = require('../agents');

// Set environment variables if not already set
process.env.ENABLE_INTELLIGENCE_ENGINE = process.env.ENABLE_INTELLIGENCE_ENGINE || 'true';
process.env.INTELLIGENCE_ENGINE_URL = process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api';
process.env.INTELLIGENCE_ENGINE_API_KEY = process.env.INTELLIGENCE_ENGINE_API_KEY || 'development-key';

/**
 * Test basketball schedule generation
 */
async function testBasketballScheduleGeneration() {
  console.log('Testing basketball schedule generation...');

  // Create the connector agent
  const intelligenceConnector = heliixConnector.createIntelligenceConnectorAgent({
    intelligence: {
      serviceUrl: process.env.INTELLIGENCE_ENGINE_URL,
      apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
      enabled: true
    }
  });

  // Initialize the agent
  await intelligenceConnector.initialize();

  // Sample teams for testing
  const teams = [
    { teamId: 'team1', name: 'Arizona Wildcats' },
    { teamId: 'team2', name: 'Arizona State Sun Devils' },
    { teamId: 'team3', name: 'BYU Cougars' },
    { teamId: 'team4', name: 'Cincinnati Bearcats' },
    { teamId: 'team5', name: 'Colorado Buffaloes' },
    { teamId: 'team6', name: 'Houston Cougars' },
    { teamId: 'team7', name: 'Iowa State Cyclones' },
    { teamId: 'team8', name: 'Kansas Jayhawks' },
    { teamId: 'team9', name: 'Kansas State Wildcats' },
    { teamId: 'team10', name: 'UCF Knights' },
    { teamId: 'team11', name: 'TCU Horned Frogs' },
    { teamId: 'team12', name: 'West Virginia Mountaineers' }
  ];

  // Sample constraints for testing
  const constraints = [
    {
      type: 'rest_days',
      parameters: {
        minDays: 2,
        priority: 'high'
      }
    },
    {
      type: 'home_away_balance',
      parameters: {
        maxConsecutiveHome: 3,
        maxConsecutiveAway: 3,
        priority: 'medium'
      }
    },
    {
      type: 'travel_distance',
      parameters: {
        maxWeeklyMiles: 1500,
        priority: 'high'
      }
    }
  ];

  // Delegate a task to the Intelligence Engine
  const delegateTask = intelligenceConnector.createTask(
    'delegate',
    'Generate optimized basketball schedule',
    {
      task: {
        taskType: 'generate_schedule',
        parameters: {
          sportType: 'basketball',
          teams: teams,
          constraints: constraints,
          options: {
            season: '2025-2026',
            startDate: '2025-11-01',
            endDate: '2026-03-15',
            optimizationLevel: 'high'
          }
        }
      },
      options: {
        wait: true,
        responseFormat: 'json',
        timeout: 120000
      }
    }
  );

  // Submit the task
  console.log('Submitting task to Intelligence Engine...');
  const result = await intelligenceConnector.submitTask(delegateTask);
  
  if (result.success) {
    console.log('Schedule generation successful!');
    console.log(`Generated ${result.result.gameCount} games for ${result.result.teams.length} teams`);
    console.log('First few game days:');
    result.result.gameDays.slice(0, 3).forEach(gameDay => {
      console.log(`\nDate: ${gameDay.date}`);
      gameDay.games.forEach(game => {
        console.log(`  ${game.homeTeam} vs ${game.awayTeam}`);
      });
    });
    
    console.log('\nSchedule metrics:');
    console.log(JSON.stringify(result.result.metrics, null, 2));
  } else {
    console.error('Schedule generation failed:', result.error);
  }

  // Stop the agent
  await intelligenceConnector.stop();
}

/**
 * Test getting scheduling recommendations
 */
async function testSchedulingRecommendations() {
  console.log('\nTesting scheduling recommendations...');

  // Create the connector agent
  const intelligenceConnector = heliixConnector.createIntelligenceConnectorAgent({
    intelligence: {
      serviceUrl: process.env.INTELLIGENCE_ENGINE_URL,
      apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
      enabled: true
    }
  });

  // Initialize the agent
  await intelligenceConnector.initialize();

  // Get scheduling recommendations
  const recommendationsTask = intelligenceConnector.createTask(
    'get_scheduling_recommendations',
    'Get basketball scheduling recommendations',
    {
      sportType: 'basketball',
      teamCount: 12,
      constraintTypes: [
        'venue_availability',
        'travel_distance',
        'rest_days',
        'home_away_balance'
      ],
      optimizationGoals: [
        'minimal_travel',
        'balanced_schedule',
        'championship_alignment'
      ]
    }
  );

  // Submit the task
  console.log('Getting scheduling recommendations...');
  const result = await intelligenceConnector.submitTask(recommendationsTask);
  
  if (result.success) {
    console.log('Recommendations retrieved successfully!');
    console.log('\nRecommended parameters:');
    console.log(JSON.stringify(result.parameters, null, 2));
    
    console.log('\nRecommended constraints:');
    console.log(JSON.stringify(result.constraints, null, 2));
    
    console.log('\nInsights:');
    result.insights.forEach(insight => console.log(`- ${insight}`));
  } else {
    console.error('Getting recommendations failed:', result.error);
  }

  // Stop the agent
  await intelligenceConnector.stop();
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('======================================================');
    console.log('  HELiiX Intelligence Connector and Engine Test');
    console.log('======================================================');
    console.log(`Intelligence Engine URL: ${process.env.INTELLIGENCE_ENGINE_URL}`);
    console.log('');
    
    // Run tests
    await testBasketballScheduleGeneration();
    await testSchedulingRecommendations();
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the main function
main().catch(console.error);