/**
 * Test script for FlexTime scheduling improvements
 * 
 * This script tests the various scheduling improvements by:
 * 1. Creating a sample schedule
 * 2. Optimizing it using different optimizers
 * 3. Analyzing and visualizing the results
 * 4. Comparing performance
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const util = require('util');

// Import improved scheduling components
const AdaptiveSimulatedAnnealingOptimizer = require('../algorithms/improvements/adaptive_simulated_annealing');
const MemoryOptimizedTravelOptimizer = require('../algorithms/improvements/memory_optimized_travel_optimizer');
const IncrementalScheduleOptimizer = require('../algorithms/improvements/incremental_schedule_optimizer');
const ConstraintEvaluator = require('../algorithms/improvements/constraint_evaluator');
const BasketballScheduleOptimizer = require('../agents/sport_specific/basketball_schedule_optimizer');
const ScheduleVisualizationGenerator = require('../scripts/visualization/schedule_visualization');

// Import regular models
const Schedule = require('../models/schedule');
const Team = require('../models/team');
const Location = require('../models/location');
const Venue = require('../models/venue');
const Game = require('../models/game');
const { RestDaysConstraint, MaxConsecutiveAwayConstraint } = require('../models/constraint');

// Create test data

/**
 * Create a test team
 * @param {number} id - Team ID
 * @param {string} name - Team name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Team} Team object
 */
function createTeam(id, name, lat, lng) {
  const location = new Location(name, lat, lng);
  const venue = new Venue(
    `venue_${id}`,
    `${name} Arena`,
    location,
    20000
  );
  
  return new Team(
    `team_${id}`,
    name,
    location,
    [venue]
  );
}

/**
 * Create sample teams
 * @returns {Array<Team>} Array of teams
 */
function createSampleTeams() {
  return [
    createTeam(1, 'North University', 41.8781, -87.6298),   // Chicago
    createTeam(2, 'East College', 40.7128, -74.0060),       // New York
    createTeam(3, 'South University', 29.7604, -95.3698),   // Houston
    createTeam(4, 'West College', 34.0522, -118.2437),      // Los Angeles
    createTeam(5, 'Central State', 39.9612, -82.9988),      // Columbus
    createTeam(6, 'Mountain Tech', 39.7392, -104.9903),     // Denver
    createTeam(7, 'Coastal University', 32.7765, -79.9311), // Charleston
    createTeam(8, 'Lake College', 41.4993, -81.6944),       // Cleveland
    createTeam(9, 'Valley State', 36.1627, -86.7816),       // Nashville
    createTeam(10, 'Capital University', 38.9072, -77.0369) // Washington DC
  ];
}

/**
 * Create a basic schedule
 * @param {Array<Team>} teams - Teams to include
 * @returns {Schedule} Basic schedule
 */
function createBasicSchedule(teams) {
  // Create schedule
  const schedule = new Schedule(
    uuidv4(),
    'Basketball',
    '2025-2026',
    teams,
    [],
    [
      new RestDaysConstraint(uuidv4(), 1),
      new MaxConsecutiveAwayConstraint(uuidv4(), 3)
    ],
    new Date('2025-11-01'),
    new Date('2026-03-15')
  );
  
  // Generate simple round-robin games
  const games = [];
  
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      // Each team plays every other team once at home and once away
      const homeGame = new Game(
        uuidv4(),
        teams[i],
        teams[j],
        teams[i].primaryVenue || teams[i].venues[0],
        new Date(`2025-${11 + Math.floor((games.length / 5) % 5)}-${1 + (games.length % 28)}`),
        'Basketball'
      );
      
      const awayGame = new Game(
        uuidv4(),
        teams[j],
        teams[i],
        teams[j].primaryVenue || teams[j].venues[0],
        new Date(`2026-${1 + Math.floor((games.length / 5) % 3)}-${1 + (games.length % 28)}`),
        'Basketball'
      );
      
      games.push(homeGame);
      games.push(awayGame);
    }
  }
  
  // Add games to schedule
  for (const game of games) {
    schedule.addGame(game);
  }
  
  return schedule;
}

// Helper functions

/**
 * Calculate travel distance for a schedule
 * @param {Schedule} schedule - Schedule to evaluate
 * @returns {number} Total travel distance
 */
function calculateTravelDistance(schedule) {
  let totalDistance = 0;
  
  // Group games by team
  const teamGames = {};
  
  for (const team of schedule.teams) {
    teamGames[team.id] = [];
  }
  
  for (const game of schedule.games) {
    teamGames[game.homeTeam.id].push({
      date: new Date(game.date),
      venue: game.venue,
      isHome: true
    });
    
    teamGames[game.awayTeam.id].push({
      date: new Date(game.date),
      venue: game.venue,
      isHome: false
    });
  }
  
  // Calculate distance for each team
  for (const [teamId, games] of Object.entries(teamGames)) {
    // Sort games by date
    games.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const team = schedule.teams.find(t => t.id === teamId);
    if (!team || !team.location) continue;
    
    let currentLocation = team.location;
    
    // Travel to each game
    for (const game of games) {
      if (!game.venue || !game.venue.location) continue;
      
      // Calculate distance
      const distance = calculateDistance(
        currentLocation,
        game.venue.location
      );
      
      totalDistance += distance;
      
      // Update current location
      currentLocation = game.venue.location;
    }
    
    // Return home after last game
    if (games.length > 0 && games[games.length - 1].venue && 
        games[games.length - 1].venue.location) {
      totalDistance += calculateDistance(
        games[games.length - 1].venue.location,
        team.location
      );
    }
  }
  
  return totalDistance;
}

/**
 * Calculate distance between two locations
 * @param {Location} loc1 - First location
 * @param {Location} loc2 - Second location
 * @returns {number} Distance in miles
 */
function calculateDistance(loc1, loc2) {
  // Implementation of haversine formula
  const R = 3958.8; // Earth radius in miles
  
  const lat1 = loc1.latitude * Math.PI / 180;
  const lat2 = loc2.latitude * Math.PI / 180;
  const deltaLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const deltaLng = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

/**
 * Print schedule summary
 * @param {Schedule} schedule - Schedule to summarize
 * @param {string} label - Summary label
 */
function printScheduleSummary(schedule, label) {
  const totalDistance = calculateTravelDistance(schedule);
  
  console.log(`\n=== ${label} ===`);
  console.log(`Total games: ${schedule.games.length}`);
  console.log(`Total travel distance: ${Math.round(totalDistance)} miles`);
  console.log(`Average distance per team: ${Math.round(totalDistance / schedule.teams.length)} miles`);
}

/**
 * Run a test with a specific optimizer
 * @param {Schedule} schedule - Schedule to optimize
 * @param {string} name - Optimizer name
 * @param {Function} optimizerFunc - Optimizer function
 */
async function runTest(schedule, name, optimizerFunc) {
  console.log(`\nTesting ${name}...`);
  const startTime = process.hrtime();
  
  try {
    const optimizedSchedule = await optimizerFunc(schedule);
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] + endTime[1] / 1e9;
    
    printScheduleSummary(optimizedSchedule, `${name} Results`);
    console.log(`Optimization time: ${duration.toFixed(2)} seconds`);
    
    return {
      name,
      schedule: optimizedSchedule,
      duration,
      travelDistance: calculateTravelDistance(optimizedSchedule)
    };
  } catch (error) {
    console.error(`Error testing ${name}:`, error);
    return {
      name,
      error: error.message
    };
  }
}

/**
 * Format a comparison table from results
 * @param {Array} results - Test results
 * @returns {string} Formatted comparison table
 */
function formatComparisonTable(results) {
  const validResults = results.filter(r => !r.error);
  
  if (validResults.length === 0) {
    return 'No valid results to compare';
  }
  
  // Get baseline for improvement calculation
  const baseline = validResults[0].travelDistance;
  
  // Create table header
  let table = '\n=== Comparison Results ===\n';
  table += 'Optimizer'.padEnd(40) + 'Time (s)'.padEnd(12) + 'Distance (mi)'.padEnd(16) + 'Improvement\n';
  table += ''.padEnd(80, '-') + '\n';
  
  // Add rows
  for (const result of validResults) {
    const improvement = ((baseline - result.travelDistance) / baseline * 100).toFixed(2);
    
    table += result.name.padEnd(40);
    table += result.duration.toFixed(2).padEnd(12);
    table += Math.round(result.travelDistance).toString().padEnd(16);
    table += `${improvement}%\n`;
  }
  
  return table;
}

/**
 * Test constraint evaluator
 * @param {Schedule} schedule - Schedule to evaluate
 */
function testConstraintEvaluator(schedule) {
  console.log('\n=== Testing Constraint Evaluator ===');
  
  const evaluator = new ConstraintEvaluator(schedule.constraints);
  const evaluation = evaluator.evaluateSchedule(schedule);
  
  console.log(`Constraint evaluation score: ${evaluation.score}`);
  console.log(`Valid schedule: ${evaluation.valid}`);
  console.log(`Hard constraint violations: ${evaluation.hardConstraintViolations}`);
  console.log(`Total violations: ${evaluation.violations.length}`);
  
  if (evaluation.violations.length > 0) {
    console.log('\nTop violation categories:');
    
    // Group violations by type
    const violationsByType = {};
    
    for (const violation of evaluation.violations) {
      const type = violation.constraintType || 'unknown';
      violationsByType[type] = (violationsByType[type] || 0) + 1;
    }
    
    // Sort and display top violations
    const sortedViolations = Object.entries(violationsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    for (const [type, count] of sortedViolations) {
      console.log(`  ${type}: ${count} violations`);
    }
  }
}

/**
 * Test visualizations
 * @param {Schedule} schedule - Schedule to visualize
 */
function testVisualizations(schedule) {
  console.log('\n=== Testing Visualization Generator ===');
  
  const visualizationGenerator = new ScheduleVisualizationGenerator({
    debug: true,
    includeRawData: false
  });
  
  // Generate visualizations
  const visualizations = visualizationGenerator.generateVisualizations(
    schedule, 
    ['teamBalance', 'travelDistance']
  );
  
  console.log('Generated visualization types:');
  for (const [type, data] of Object.entries(visualizations.visualizations)) {
    console.log(`  ${type}: ${data.title}`);
    
    if (data.statistics) {
      console.log('  Statistics:', util.inspect(data.statistics, { depth: 1, colors: true }));
    }
  }
}

/**
 * Test basketball-specific optimizer
 * @param {Schedule} schedule - Schedule to optimize
 */
async function testBasketballOptimizer(schedule) {
  console.log('\n=== Testing Basketball-Specific Optimizer ===');
  
  const optimizer = new BasketballScheduleOptimizer(schedule, {
    maxIterations: 500,
    conferenceWeight: 2.0,
    rivalryWeight: 1.5,
    // Mock conference structure
    conferences: {
      'East': ['team_1', 'team_2', 'team_5', 'team_8', 'team_10'],
      'West': ['team_3', 'team_4', 'team_6', 'team_7', 'team_9']
    }
  });
  
  // Run optimization
  const startTime = process.hrtime();
  const optimizedSchedule = optimizer.optimize();
  const endTime = process.hrtime(startTime);
  const duration = endTime[0] + endTime[1] / 1e9;
  
  console.log('Basketball-specific optimization completed');
  console.log(`Optimization time: ${duration.toFixed(2)} seconds`);
  
  // Check conference balance
  const eastTeams = ['team_1', 'team_2', 'team_5', 'team_8', 'team_10'];
  const westTeams = ['team_3', 'team_4', 'team_6', 'team_7', 'team_9'];
  
  let eastIntraConferenceGames = 0;
  let westIntraConferenceGames = 0;
  let interConferenceGames = 0;
  
  for (const game of optimizedSchedule.games) {
    const homeId = game.homeTeam.id;
    const awayId = game.awayTeam.id;
    
    const homeIsEast = eastTeams.includes(homeId);
    const awayIsEast = eastTeams.includes(awayId);
    
    if (homeIsEast && awayIsEast) {
      eastIntraConferenceGames++;
    } else if (!homeIsEast && !awayIsEast) {
      westIntraConferenceGames++;
    } else {
      interConferenceGames++;
    }
  }
  
  console.log('\nConference game distribution:');
  console.log(`  East intra-conference games: ${eastIntraConferenceGames}`);
  console.log(`  West intra-conference games: ${westIntraConferenceGames}`);
  console.log(`  Inter-conference games: ${interConferenceGames}`);
  
  return optimizedSchedule;
}

/**
 * Main test function
 */
async function main() {
  console.log('=== FlexTime Scheduling Improvements Test ===\n');
  
  // Create sample data
  const teams = createSampleTeams();
  console.log(`Created ${teams.length} sample teams`);
  
  const schedule = createBasicSchedule(teams);
  console.log(`Created basic schedule with ${schedule.games.length} games`);
  
  printScheduleSummary(schedule, 'Initial Schedule');
  
  // Test constraint evaluator
  testConstraintEvaluator(schedule);
  
  // Run comparative tests
  const testResults = [];
  
  // Standard simulated annealing
  testResults.push(await runTest(
    schedule, 
    'Adaptive Simulated Annealing',
    async (schedule) => {
      const optimizer = new AdaptiveSimulatedAnnealingOptimizer(schedule, {
        maxIterations: 1000
      });
      return optimizer.optimize();
    }
  ));
  
  // Travel optimizer
  testResults.push(await runTest(
    schedule,
    'Memory-Optimized Travel Optimizer',
    async (schedule) => {
      const optimizer = new MemoryOptimizedTravelOptimizer();
      return optimizer.optimize(schedule);
    }
  ));
  
  // Incremental optimizer
  testResults.push(await runTest(
    schedule,
    'Incremental Schedule Optimizer',
    async (schedule) => {
      const optimizer = new IncrementalScheduleOptimizer();
      return optimizer.optimize(schedule, schedule.constraints);
    }
  ));
  
  // Test basketball-specific optimizer
  const basketballSchedule = await testBasketballOptimizer(schedule);
  
  // Test visualizations
  testVisualizations(basketballSchedule);
  
  // Print comparison
  console.log(formatComparisonTable(testResults));
  
  console.log('\nTest complete!');
}

// Run the main function
main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});