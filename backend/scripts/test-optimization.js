/**
 * Script to test the optimization capabilities of the HELiiX Intelligence Engine
 * 
 * This script demonstrates how to use the HELiiX Intelligence Connector to optimize
 * schedules using different algorithms.
 * 
 * Usage:
 *   node scripts/test-optimization.js
 * 
 * Prerequisites:
 *   - Python Intelligence Engine must be running on localhost:4001
 *   - Environment variables must be set (see below)
 */

require('dotenv').config();
const { heliixConnector } = require('../agents');
const axios = require('axios');

// Set environment variables if not already set
process.env.ENABLE_INTELLIGENCE_ENGINE = process.env.ENABLE_INTELLIGENCE_ENGINE || 'true';
process.env.INTELLIGENCE_ENGINE_URL = process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api';
process.env.INTELLIGENCE_ENGINE_API_KEY = process.env.INTELLIGENCE_ENGINE_API_KEY || 'development-key';

/**
 * Get available optimization algorithms
 */
async function getOptimizationAlgorithms() {
  console.log('Retrieving available optimization algorithms...');
  
  try {
    const response = await axios.get(`${process.env.INTELLIGENCE_ENGINE_URL}/optimization/algorithms`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving optimization algorithms:', error.message);
    return [];
  }
}

/**
 * Generate a sample basketball schedule for testing
 */
function createSampleSchedule() {
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
  
  const teamIds = teams.map(team => team.teamId);
  const gameDays = [];
  
  // Create a simple round-robin schedule for testing
  const startDate = new Date('2025-11-01');
  for (let week = 0; week < 9; week++) {
    const gameDate = new Date(startDate);
    gameDate.setDate(gameDate.getDate() + week * 7);
    
    const dateStr = gameDate.toISOString().split('T')[0];
    
    // Shuffle teams for pairing
    const shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5);
    
    const games = [];
    // Create 6 games (12 teams / 2)
    for (let i = 0; i < 12; i += 2) {
      games.push({
        homeTeam: shuffledTeams[i],
        awayTeam: shuffledTeams[i + 1],
        date: dateStr
      });
    }
    
    gameDays.push({
      date: dateStr,
      games
    });
  }
  
  return {
    type: 'schedule',
    sportType: 'basketball',
    season: '2025-2026',
    teams: teamIds,
    gameDays,
    gameCount: 6 * 9,  // 6 games per day, 9 days
    startDate: '2025-11-01',
    endDate: '2026-01-01',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Test schedule optimization using the Intelligence Engine
 */
async function testScheduleOptimization() {
  console.log('Testing schedule optimization...');
  
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
  
  // Create a sample schedule
  const schedule = createSampleSchedule();
  console.log(`Generated sample schedule with ${schedule.gameCount} games for ${schedule.teams.length} teams`);
  
  // Get available optimization algorithms
  const algorithms = await getOptimizationAlgorithms();
  console.log(`Available optimization algorithms: ${algorithms.map(alg => alg.type).join(', ')}`);
  
  // Test each algorithm
  for (const algorithm of algorithms) {
    console.log(`\nTesting ${algorithm.type} optimizer...`);
    
    // Delegate a task to the Intelligence Engine
    const delegateTask = intelligenceConnector.createTask(
      'delegate',
      `Optimize schedule using ${algorithm.type}`,
      {
        task: {
          taskType: 'optimize_schedule',
          parameters: {
            schedule,
            algorithmType: algorithm.type,
            config: {
              // Algorithm-specific configuration
              ...(algorithm.type === 'simulated_annealing' && {
                initial_temperature: 100.0,
                cooling_rate: 0.95,
                max_iterations: 1000  // Limit iterations for testing
              }),
              ...(algorithm.type === 'genetic_algorithm' && {
                population_size: 20,
                max_generations: 10  // Limit generations for testing
              })
            }
          }
        },
        options: {
          wait: true,
          responseFormat: 'json',
          timeout: 60000
        }
      }
    );
    
    // Submit the task
    console.log(`Submitting optimization task using ${algorithm.type}...`);
    const result = await intelligenceConnector.submitTask(delegateTask);
    
    if (result.success) {
      console.log(`Optimization successful using ${algorithm.type}!`);
      console.log(`Initial score: ${result.result.optimization.initialScore.toFixed(4)}`);
      console.log(`Final score: ${result.result.optimization.finalScore.toFixed(4)}`);
      console.log(`Improvement: ${result.result.optimization.improvement.toFixed(4)}`);
      
      // Show optimization statistics
      const stats = result.result.optimization.statistics;
      if (algorithm.type === 'simulated_annealing') {
        console.log(`Iterations: ${stats.iterations}`);
        console.log(`Accepted moves: ${stats.accepted_moves}`);
        console.log(`Rejected moves: ${stats.rejected_moves}`);
        console.log(`Time elapsed: ${stats.time_elapsed.toFixed(2)} seconds`);
      } else if (algorithm.type === 'genetic_algorithm') {
        console.log(`Generations: ${stats.generations}`);
        console.log(`Evaluations: ${stats.evaluations}`);
        console.log(`Time elapsed: ${stats.time_elapsed.toFixed(2)} seconds`);
      }
    } else {
      console.error(`Optimization failed using ${algorithm.type}:`, result.error);
    }
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
    console.log('  HELiiX Intelligence Engine Optimization Test');
    console.log('======================================================');
    console.log(`Intelligence Engine URL: ${process.env.INTELLIGENCE_ENGINE_URL}`);
    console.log('');
    
    // Run test
    await testScheduleOptimization();
    
    console.log('\nOptimization test completed.');
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the main function
main().catch(console.error);