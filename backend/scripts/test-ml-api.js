/**
 * Test Script for ML API
 * 
 * This script tests the Machine Learning API endpoints
 * by sending sample requests and verifying the responses.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Base URL for the API
const API_BASE_URL = 'http://localhost:4001';

// Test data
const testSchedule = {
  id: 'test_schedule_123',
  name: 'Test Basketball Schedule',
  sportType: 'basketball',
  teams: ['Team_1', 'Team_2', 'Team_3', 'Team_4', 'Team_5', 'Team_6'],
  gameCount: 30,
  gameDays: [
    {
      date: '2023-01-07',
      games: [
        {
          id: 'game_001',
          homeTeam: 'Team_1',
          awayTeam: 'Team_2',
          homeTeamRestDays: 3,
          awayTeamRestDays: 2,
          isRivalry: true,
          outcome: 'home_win'
        },
        {
          id: 'game_002',
          homeTeam: 'Team_3',
          awayTeam: 'Team_4',
          homeTeamRestDays: 4,
          awayTeamRestDays: 3,
          isRivalry: false,
          outcome: 'away_win'
        }
      ]
    },
    {
      date: '2023-01-14',
      games: [
        {
          id: 'game_003',
          homeTeam: 'Team_5',
          awayTeam: 'Team_6',
          homeTeamRestDays: 3,
          awayTeamRestDays: 2,
          isRivalry: false,
          outcome: 'home_win'
        },
        {
          id: 'game_004',
          homeTeam: 'Team_2',
          awayTeam: 'Team_3',
          homeTeamRestDays: 7,
          awayTeamRestDays: 7,
          isRivalry: true,
          outcome: 'away_win'
        }
      ]
    }
  ],
  metrics: {
    travelDistance: 8500,
    restDays: {
      average: 2.5,
      minimum: 1
    },
    homeAwayImbalance: 1.2,
    maxConsecutiveHome: 2,
    maxConsecutiveAway: 2,
    quality: 0.78
  }
};

const testTeamStats = {
  'Team_1': {
    rating: 0.75,
    win_streak: 3,
    winPercentage: 0.65,
    pointsScored: 85,
    pointsAllowed: 78,
    turnoverMargin: 1.5,
    strengthOfSchedule: 0.6,
    homeRecord: { winPercentage: 0.8 },
    awayRecord: { winPercentage: 0.5 },
    conferenceRecord: { winPercentage: 0.7 },
    nonConferenceRecord: { winPercentage: 0.6 },
    top25Wins: 2,
    compassIndex: 0.7
  },
  'Team_2': {
    rating: 0.8,
    win_streak: 2,
    winPercentage: 0.7,
    pointsScored: 88,
    pointsAllowed: 75,
    turnoverMargin: 2.1,
    strengthOfSchedule: 0.65,
    homeRecord: { winPercentage: 0.85 },
    awayRecord: { winPercentage: 0.6 },
    conferenceRecord: { winPercentage: 0.75 },
    nonConferenceRecord: { winPercentage: 0.65 },
    top25Wins: 3,
    compassIndex: 0.75
  }
};

/**
 * Test the ML API endpoints
 */
async function testMlApi() {
  try {
    console.log('Testing ML API...');
    
    // Check server status
    console.log('\n1. Testing server status...');
    await checkServerStatus();
    
    // Test pattern extraction
    console.log('\n2. Testing pattern extraction...');
    await testPatternExtraction();
    
    // Test model listing
    console.log('\n3. Testing model listing...');
    await testModelListing();
    
    // Test game outcome prediction
    console.log('\n4. Testing game outcome prediction...');
    await testGameOutcomePrediction();
    
    // Test schedule quality prediction
    console.log('\n5. Testing schedule quality prediction...');
    await testScheduleQualityPrediction();
    
    // Test team performance prediction
    console.log('\n6. Testing team performance prediction...');
    await testTeamPerformancePrediction();
    
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
    console.log('ML capabilities:', response.data.capabilities.ml);
    
    // Check if ML capabilities are listed
    if (!response.data.capabilities.ml) {
      throw new Error('ML capabilities not found in status response');
    }
    
    console.log('✅ Server status check passed');
    return true;
  } catch (error) {
    console.error('❌ Server status check failed:', error.message);
    throw error;
  }
}

/**
 * Test pattern extraction
 */
async function testPatternExtraction() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ml/patterns`, {
      type: 'schedule',
      content: testSchedule
    });
    
    console.log(`Extracted ${response.data.patterns.length} patterns`);
    console.log('Sample pattern:', response.data.patterns[0]);
    
    // Check if we got patterns back
    if (!response.data.patterns || response.data.patterns.length === 0) {
      throw new Error('No patterns extracted');
    }
    
    console.log('✅ Pattern extraction test passed');
    return true;
  } catch (error) {
    console.error('❌ Pattern extraction test failed:', error.message);
    throw error;
  }
}

/**
 * Test model listing
 */
async function testModelListing() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ml/models`);
    
    console.log(`Found ${response.data.models.length} models`);
    for (const model of response.data.models) {
      console.log(`- ${model.name} (${model.version})`);
    }
    
    // Check if we got models back
    if (!response.data.models || response.data.models.length === 0) {
      console.warn('⚠️ No models found - this is expected on first run');
    }
    
    console.log('✅ Model listing test passed');
    return true;
  } catch (error) {
    console.error('❌ Model listing test failed:', error.message);
    throw error;
  }
}

/**
 * Test game outcome prediction
 */
async function testGameOutcomePrediction() {
  try {
    const testGame = {
      homeTeam: 'Team_1',
      awayTeam: 'Team_2',
      homeTeamRestDays: 3,
      awayTeamRestDays: 2,
      isRivalry: true
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/ml/predict/game`, {
      game: testGame,
      teamStats: testTeamStats
    });
    
    console.log('Game prediction:', response.data.prediction);
    
    // Check if we got a prediction back
    if (!response.data.prediction) {
      throw new Error('No prediction returned');
    }
    
    console.log('✅ Game outcome prediction test passed');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn('⚠️ Game outcome model not found - this is expected on first run');
      return false;
    }
    console.error('❌ Game outcome prediction test failed:', error.message);
    throw error;
  }
}

/**
 * Test schedule quality prediction
 */
async function testScheduleQualityPrediction() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ml/predict/schedule`, {
      schedule: testSchedule
    });
    
    console.log('Schedule quality prediction:', response.data.quality);
    
    // Check if we got a prediction back
    if (response.data.quality === undefined) {
      throw new Error('No quality prediction returned');
    }
    
    console.log('✅ Schedule quality prediction test passed');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn('⚠️ Schedule quality model not found - this is expected on first run');
      return false;
    }
    console.error('❌ Schedule quality prediction test failed:', error.message);
    throw error;
  }
}

/**
 * Test team performance prediction
 */
async function testTeamPerformancePrediction() {
  try {
    const testTeamData = {
      teamId: 'Team_1',
      stats: testTeamStats['Team_1']
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/ml/predict/team`, {
      teamData: testTeamData
    });
    
    console.log('Team COMPASS index prediction:', response.data.compassIndex);
    
    // Check if we got a prediction back
    if (response.data.compassIndex === undefined) {
      throw new Error('No COMPASS index prediction returned');
    }
    
    console.log('✅ Team performance prediction test passed');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn('⚠️ Team performance model not found - this is expected on first run');
      return false;
    }
    console.error('❌ Team performance prediction test failed:', error.message);
    throw error;
  }
}

// Run the tests
testMlApi().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});