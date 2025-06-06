/**
 * Simple test script for FlexTime scheduling improvements
 * 
 * This script tests the working components of the scheduling improvements
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const util = require('util');

// Import improved scheduling components
const MemoryOptimizedTravelOptimizer = require('../algorithms/improvements/memory_optimized_travel_optimizer');
const IncrementalScheduleOptimizer = require('../algorithms/improvements/incremental_schedule_optimizer');
const ConstraintEvaluator = require('../algorithms/improvements/constraint_evaluator');
const ScheduleVisualizationGenerator = require('../scripts/visualization/schedule_visualization');

// Import or create simple model classes for testing

class Location {
  constructor(name, latitude, longitude) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
  }
  
  distanceTo(otherLocation) {
    // Implementation of haversine formula
    const R = 3958.8; // Earth radius in miles
    
    const lat1 = this.latitude * Math.PI / 180;
    const lat2 = otherLocation.latitude * Math.PI / 180;
    const deltaLat = (otherLocation.latitude - this.latitude) * Math.PI / 180;
    const deltaLng = (otherLocation.longitude - this.longitude) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
}

class Venue {
  constructor(id, name, location, capacity) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.capacity = capacity;
  }
}

class Team {
  constructor(id, name, location, venues = []) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.venues = venues;
    this.primaryVenue = venues[0] || null;
  }
}

class Game {
  constructor(id, homeTeam, awayTeam, venue, date, sport, specialDesignation = null, tvNetwork = null) {
    this.id = id;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.venue = venue;
    this.date = date;
    this.sport = sport;
    this.specialDesignation = specialDesignation;
    this.tvNetwork = tvNetwork;
  }
  
  clone() {
    return new Game(
      this.id,
      this.homeTeam,
      this.awayTeam,
      this.venue,
      new Date(this.date),
      this.sport,
      this.specialDesignation,
      this.tvNetwork
    );
  }
}

class Schedule {
  constructor(id, sport, season, teams, games = [], constraints = [], startDate = null, endDate = null) {
    this.id = id;
    this.sport = sport;
    this.season = season;
    this.teams = teams;
    this.games = games;
    this.constraints = constraints;
    this.startDate = startDate;
    this.endDate = endDate;
  }
  
  addGame(game) {
    this.games.push(game);
  }
  
  clone() {
    const clonedGames = this.games.map(game => game.clone());
    return new Schedule(
      this.id,
      this.sport,
      this.season,
      this.teams,
      clonedGames,
      this.constraints,
      this.startDate ? new Date(this.startDate) : null,
      this.endDate ? new Date(this.endDate) : null
    );
  }
}

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
    [],
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
      const distance = currentLocation.distanceTo(game.venue.location);
      totalDistance += distance;
      
      // Update current location
      currentLocation = game.venue.location;
    }
    
    // Return home after last game
    if (games.length > 0 && games[games.length - 1].venue && 
        games[games.length - 1].venue.location) {
      totalDistance += games[games.length - 1].venue.location.distanceTo(team.location);
    }
  }
  
  return totalDistance;
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
}

/**
 * Test memory-optimized travel optimizer
 * @param {Schedule} schedule - Schedule to optimize
 */
async function testMemoryOptimizedTravelOptimizer(schedule) {
  console.log('\n=== Testing Memory-Optimized Travel Optimizer ===');
  
  const startTime = process.hrtime();
  
  // Create optimizer
  const optimizer = new MemoryOptimizedTravelOptimizer();
  
  // Run optimization
  const optimizedSchedule = optimizer.optimize(schedule);
  
  const endTime = process.hrtime(startTime);
  const duration = endTime[0] + endTime[1] / 1e9;
  
  printScheduleSummary(optimizedSchedule, 'Optimized Schedule');
  console.log(`Optimization time: ${duration.toFixed(2)} seconds`);
  
  return optimizedSchedule;
}

/**
 * Test incremental schedule optimizer
 * @param {Schedule} schedule - Schedule to optimize
 */
async function testIncrementalScheduleOptimizer(schedule) {
  console.log('\n=== Testing Incremental Schedule Optimizer ===');
  
  const startTime = process.hrtime();
  
  // Create optimizer
  const optimizer = new IncrementalScheduleOptimizer();
  
  // Run optimization
  const optimizedSchedule = await optimizer.optimize(schedule, schedule.constraints);
  
  const endTime = process.hrtime(startTime);
  const duration = endTime[0] + endTime[1] / 1e9;
  
  printScheduleSummary(optimizedSchedule, 'Optimized Schedule');
  console.log(`Optimization time: ${duration.toFixed(2)} seconds`);
  
  return optimizedSchedule;
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
  
  // Test memory-optimized travel optimizer
  const travelOptimizedSchedule = await testMemoryOptimizedTravelOptimizer(schedule);
  
  // Test incremental schedule optimizer
  const incrementalOptimizedSchedule = await testIncrementalScheduleOptimizer(schedule);
  
  // Test visualizations
  testVisualizations(travelOptimizedSchedule);
  
  console.log('\nTest complete!');
}

// Run the main function
main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});