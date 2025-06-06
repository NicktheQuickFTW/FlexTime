/**
 * Test script for FlexTime Advanced Metrics System
 * 
 * This script demonstrates the advanced metrics system by:
 * 1. Creating a sample schedule
 * 2. Analyzing it with the advanced metrics system
 * 3. Displaying the results including composite scores and recommendations
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const AdvancedMetricsSystem = require('../utils/advanced_metrics_system');

// Reuse test models from schedule export test
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
}

class Schedule {
  constructor(id, name, sport, season, teams, games = [], constraints = [], startDate = null, endDate = null) {
    this.id = id;
    this.name = name;
    this.sport = sport;
    this.season = season;
    this.teams = teams;
    this.games = games;
    this.constraints = constraints;
    this.startDate = startDate;
    this.endDate = endDate;
    this.metrics = {
      totalDistance: 0,
      gameCount: games.length,
      homeAwayBalance: 1.0,
      constraintSatisfaction: 1.0
    };
  }
  
  addGame(game) {
    this.games.push(game);
    this.metrics.gameCount = this.games.length;
  }
}

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
  ];
}

/**
 * Create a sample schedule with realistic data
 * @returns {Schedule} Sample schedule
 */
function createSampleSchedule() {
  const teams = createSampleTeams();
  
  // Create schedule
  const schedule = new Schedule(
    uuidv4(),
    'Big Tournament 2025',
    'Basketball',
    '2025-2026',
    teams,
    [],
    [],
    new Date('2025-11-01'),
    new Date('2026-03-15')
  );
  
  // TV networks
  const tvNetworks = ['ESPN', 'ESPN2', 'FS1', 'CBS', 'NBC', 'ABC', null];
  
  // Special designations
  const specialDesignations = ['Championship', 'Season Opener', 'Rivalry Week', null];
  
  // Generate games
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue; // Teams don't play themselves
      
      // Generate random game date between start and end dates
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2026-03-15');
      const randomDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );
      
      // Set a specific time (between 12:00 and 21:00)
      randomDate.setHours(12 + Math.floor(Math.random() * 9));
      randomDate.setMinutes(Math.random() < 0.5 ? 0 : 30);
      
      // Generate random TV network and special designation
      const tvNetwork = tvNetworks[Math.floor(Math.random() * tvNetworks.length)];
      const specialDesignation = specialDesignations[Math.floor(Math.random() * specialDesignations.length)];
      
      // Create game
      const game = new Game(
        uuidv4(),
        teams[i],
        teams[j],
        teams[i].primaryVenue,
        randomDate,
        'Basketball',
        specialDesignation,
        tvNetwork
      );
      
      schedule.addGame(game);
    }
  }
  
  return schedule;
}

/**
 * Create output directory
 * @returns {string} Output directory path
 */
function createOutputDirectory() {
  const outputDir = path.join(__dirname, '../outputs');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return outputDir;
}

/**
 * Save data to JSON file
 * @param {string} filePath - Path to save file
 * @param {object} data - Data to save
 */
async function saveToFile(filePath, data) {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Data saved to: ${filePath}`);
  } catch (error) {
    console.error(`Error saving file: ${error.message}`);
  }
}

/**
 * Format scores for display
 * @param {object} scores - Score object with scores and categories
 * @returns {string} Formatted scores string
 */
function formatScores(scores) {
  const formatted = [];
  
  for (const [key, value] of Object.entries(scores)) {
    if (typeof value === 'object' && value.score && value.category) {
      formatted.push(`${key}: ${value.score}/100 (${value.category})`);
    }
  }
  
  return formatted.join('\n');
}

/**
 * Format recommendations for display
 * @param {Array} recommendations - List of recommendations
 * @returns {string} Formatted recommendations string
 */
function formatRecommendations(recommendations) {
  return recommendations.map(rec => 
    `[${rec.impact.toUpperCase()}] ${rec.recommendation}\n  └─ ${rec.details}`
  ).join('\n\n');
}

/**
 * Format predictive outcomes for display
 * @param {object} outcomes - Predictive outcomes
 * @returns {string} Formatted outcomes string
 */
function formatPredictiveOutcomes(outcomes) {
  const formatted = [];
  
  for (const [key, value] of Object.entries(outcomes)) {
    const keyFactors = value.keyFactors.map(f => `• ${f}`).join('\n  ');
    formatted.push(`${key.toUpperCase()}:\n  ${JSON.stringify(value).replace(/[{}"]/g, '').replace(/,/g, ', ')}\n  Key Factors:\n  ${keyFactors}`);
  }
  
  return formatted.join('\n\n');
}

/**
 * Test advanced metrics system
 */
async function testAdvancedMetrics() {
  console.log('=== FlexTime Advanced Metrics System Test ===\n');
  
  // Create sample schedule
  const schedule = createSampleSchedule();
  console.log(`Created sample schedule "${schedule.name}" with ${schedule.games.length} games`);
  
  // Create advanced metrics system
  const metricsSystem = new AdvancedMetricsSystem({
    enablePredictiveModels: true,
    enableRevenueOptimization: true,
    enablePlayerWellbeingMetrics: true,
    enableFanEngagementMetrics: true
  });
  
  console.log('\nAnalyzing schedule with advanced metrics...');
  const metrics = metricsSystem.analyzeSchedule(schedule);
  
  // Create output directory
  const outputDir = createOutputDirectory();
  
  // Save full metrics to file
  const metricsPath = path.join(outputDir, `advanced_metrics_${schedule.id.substring(0, 8)}.json`);
  await saveToFile(metricsPath, metrics);
  
  // Display composite scores
  console.log('\n=== COMPOSITE SCORES ===');
  console.log(formatScores(metrics.compositeScores));
  
  // Display recommendations
  console.log('\n=== RECOMMENDATIONS ===');
  console.log(formatRecommendations(metrics.recommendations));
  
  // Display predictive outcomes
  console.log('\n=== PREDICTIVE OUTCOMES ===');
  console.log(formatPredictiveOutcomes(metrics.predictiveOutcomes));
  
  console.log('\nAdvanced metrics test completed successfully!');
  console.log(`Full metrics saved to: ${metricsPath}`);
}

// Run the test
testAdvancedMetrics().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});