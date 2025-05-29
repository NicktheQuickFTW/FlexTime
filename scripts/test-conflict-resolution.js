/**
 * Test Script for Conflict Resolution Components
 * 
 * This script tests the Conflict Resolution API endpoints
 * by sending sample requests and verifying the responses.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Base URL for the API
const API_BASE_URL = 'http://localhost:4001';

// Generate a sample schedule with conflicts
function generateSampleSchedule() {
  const teams = Array.from({ length: 10 }, (_, i) => `Team_${i + 1}`);
  
  // Create a schedule with built-in conflicts
  const schedule = {
    id: `schedule_${Math.floor(Math.random() * 9000) + 1000}`,
    name: 'Sample Basketball Schedule',
    sportType: 'basketball',
    teams: teams,
    gameCount: 45,
    gameDays: [],
    metrics: {
      travelDistance: Math.floor(Math.random() * 10000) + 5000,
      restDays: {
        average: Math.random() * 1.5 + 1.5,
        minimum: 1
      },
      homeAwayImbalance: Math.random() * 2.0,
      maxConsecutiveHome: Math.floor(Math.random() * 4) + 1,
      maxConsecutiveAway: Math.floor(Math.random() * 4) + 1,
      quality: Math.random() * 0.35 + 0.6
    },
    config: {
      maxConsecutiveHome: 3,
      maxConsecutiveAway: 3,
      minRestDays: 1
    }
  };
  
  // Generate game days with some conflicts included
  const startDate = new Date(2023, 0, 7); // 2023-01-07
  
  // Create normal game days
  for (let week = 0; week < 9; week++) {
    const gameDate = new Date(startDate);
    gameDate.setDate(startDate.getDate() + week * 7);
    const dateStr = gameDate.toISOString().split('T')[0];
    
    const games = [];
    
    // Create 5 games per day (all 10 teams play)
    for (let i = 0; i < 10; i += 2) {
      const homeTeam = teams[i];
      const awayTeam = teams[i + 1];
      
      games.push({
        id: `game_${Math.floor(Math.random() * 90000) + 10000}`,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        homeTeamRestDays: Math.floor(Math.random() * 5) + 1,
        awayTeamRestDays: Math.floor(Math.random() * 5) + 1,
        isRivalry: Math.random() > 0.8,
        outcome: Math.random() > 0.4 ? 'home_win' : 'away_win'
      });
    }
    
    schedule.gameDays.push({
      date: dateStr,
      games: games
    });
  }
  
  // Add a rest day conflict (next day after first game)
  const restConflictDate = new Date(startDate);
  restConflictDate.setDate(startDate.getDate() + 1);
  const restConflictDateStr = restConflictDate.toISOString().split('T')[0];
  
  schedule.gameDays.push({
    date: restConflictDateStr,
    games: [{
      id: 'conflict_game_1',
      homeTeam: teams[0], // Team that already played on the first day
      awayTeam: teams[2],
      homeTeamRestDays: 0,
      awayTeamRestDays: 1,
      isRivalry: false,
      outcome: 'unknown'
    }]
  });
  
  // Add a venue conflict (two games at the same venue on the same day)
  const venueConflictDate = new Date(startDate);
  venueConflictDate.setDate(startDate.getDate() + 14); // Third week
  const venueConflictDateStr = venueConflictDate.toISOString().split('T')[0];
  
  // Find the game day for this date
  const venueConflictDay = schedule.gameDays.find(day => day.date === venueConflictDateStr);
  
  if (venueConflictDay) {
    // Add another game with the same home team (venue)
    venueConflictDay.games.push({
      id: 'conflict_game_2',
      homeTeam: venueConflictDay.games[0].homeTeam, // Same home team (venue)
      awayTeam: teams[8],
      homeTeamRestDays: 3,
      awayTeamRestDays: 2,
      isRivalry: false,
      outcome: 'unknown'
    });
  }
  
  // Sort game days by date
  schedule.gameDays.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return schedule;
}

/**
 * Test the Conflict Resolution API endpoints
 */
async function testConflictResolutionApi() {
  try {
    console.log('Testing Conflict Resolution API...');
    
    // Check server status
    console.log('\n1. Testing server status...');
    await checkServerStatus();
    
    // Generate a test schedule with conflicts
    const schedule = generateSampleSchedule();
    console.log(`\nGenerated test schedule: ${schedule.id} with ${schedule.gameDays.length} game days`);
    
    // Test conflict analysis
    console.log('\n2. Testing conflict analysis...');
    const analysis = await testConflictAnalysis(schedule);
    
    // Test resolution plan generation
    console.log('\n3. Testing resolution plan generation...');
    const plan = await testResolutionPlan(analysis);
    
    // Test automatic conflict resolution
    console.log('\n4. Testing automatic conflict resolution...');
    const autoResult = await testAutoResolution(schedule, analysis);
    
    // Test conflict visualization
    console.log('\n5. Testing conflict visualization...');
    const visualizations = await testConflictVisualization(analysis);
    
    // Test resolution plan visualization
    console.log('\n6. Testing resolution plan visualization...');
    const planVisualizations = await testPlanVisualization(plan);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

/**
 * Check server status
 */
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/status`);
    console.log('Server status:', response.data.status);
    console.log('Conflict Resolution capabilities:', response.data.capabilities.conflict_resolution);
    
    // Check if Conflict Resolution capabilities are listed
    if (!response.data.capabilities.conflict_resolution) {
      throw new Error('Conflict Resolution capabilities not found in status response');
    }
    
    console.log('✅ Server status check passed');
    return true;
  } catch (error) {
    console.error('❌ Server status check failed:', error.message);
    throw error;
  }
}

/**
 * Test conflict analysis
 */
async function testConflictAnalysis(schedule) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/conflict/analyze`, {
      schedule: schedule
    });
    
    const analysis = response.data.analysis;
    
    console.log(`Found ${analysis.statistics.total} conflicts:`);
    
    // Log conflicts by severity
    for (const [severity, count] of Object.entries(analysis.statistics.by_severity)) {
      console.log(`  ${severity}: ${count}`);
    }
    
    // Log conflicts by type
    for (const [type, count] of Object.entries(analysis.statistics.by_type)) {
      console.log(`  ${type}: ${count}`);
    }
    
    console.log('✅ Conflict analysis test passed');
    return analysis;
  } catch (error) {
    console.error('❌ Conflict analysis test failed:', error.message);
    throw error;
  }
}

/**
 * Test resolution plan generation
 */
async function testResolutionPlan(analysis) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/conflict/resolve`, {
      analysis: analysis
    });
    
    const plan = response.data.plan;
    
    console.log(`Generated resolution plan with ${plan.total_steps} steps`);
    
    if (plan.steps && plan.steps.length > 0) {
      console.log('Sample step:', plan.steps[0].action, '-', plan.steps[0].description);
    }
    
    console.log('✅ Resolution plan test passed');
    return plan;
  } catch (error) {
    console.error('❌ Resolution plan test failed:', error.message);
    throw error;
  }
}

/**
 * Test automatic conflict resolution
 */
async function testAutoResolution(schedule, analysis) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/conflict/resolve/auto`, {
      schedule: schedule,
      analysis: analysis
    });
    
    const result = response.data.result;
    
    console.log(`Auto-resolved ${result.conflicts_resolved} conflicts with ${result.changes_made} changes`);
    console.log('Result message:', result.message);
    
    console.log('✅ Automatic resolution test passed');
    return result;
  } catch (error) {
    console.error('❌ Automatic resolution test failed:', error.message);
    throw error;
  }
}

/**
 * Test conflict visualization
 */
async function testConflictVisualization(analysis) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/conflict/visualize`, {
      analysis: analysis
    });
    
    const visualizations = response.data.visualizations;
    
    console.log(`Generated ${visualizations.count} visualizations`);
    
    if (visualizations.visualizations && visualizations.visualizations.length > 0) {
      console.log('Visualization types:');
      const types = new Set(visualizations.visualizations.map(v => v.visualization_type));
      types.forEach(type => console.log(`  - ${type}`));
    }
    
    console.log('✅ Conflict visualization test passed');
    return visualizations;
  } catch (error) {
    console.error('❌ Conflict visualization test failed:', error.message);
    throw error;
  }
}

/**
 * Test resolution plan visualization
 */
async function testPlanVisualization(plan) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/conflict/visualize/plan`, {
      plan: plan
    });
    
    const visualizations = response.data.visualizations;
    
    console.log(`Generated ${visualizations.count} step visualizations`);
    
    console.log('✅ Plan visualization test passed');
    return visualizations;
  } catch (error) {
    console.error('❌ Plan visualization test failed:', error.message);
    throw error;
  }
}

// Run the tests
testConflictResolutionApi().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});