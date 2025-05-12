/**
 * Test Neon DB API Endpoints
 * 
 * This script tests the API endpoints that interact with the Neon DB.
 */

require('dotenv').config();
const axios = require('axios');
const logger = require('../utils/logger');

// Base URL for the API
const BASE_URL = 'http://localhost:3000/api';

// Test endpoints
async function testApiEndpoints() {
  logger.info('Starting API endpoint tests...');
  
  try {
    // Test 1: Get all sports
    logger.info('Test 1: Getting all sports...');
    const sportsResponse = await axios.get(`${BASE_URL}/sports`);
    logger.info(`Sports API Response: ${JSON.stringify(sportsResponse.data, null, 2)}`);
    
    // Test 2: Get all championships
    logger.info('Test 2: Getting all championships...');
    const championshipsResponse = await axios.get(`${BASE_URL}/championships`);
    logger.info(`Championships API Response: ${JSON.stringify(championshipsResponse.data, null, 2)}`);
    
    // Test 3: Get all teams
    logger.info('Test 3: Getting all teams...');
    const teamsResponse = await axios.get(`${BASE_URL}/teams`);
    logger.info(`Teams API Response: ${JSON.stringify(teamsResponse.data, null, 2)}`);
    
    // Test 4: Get all venues
    logger.info('Test 4: Getting all venues...');
    const venuesResponse = await axios.get(`${BASE_URL}/venues`);
    logger.info(`Venues API Response: ${JSON.stringify(venuesResponse.data, null, 2)}`);
    
    // Test 5: Get team stats
    logger.info('Test 5: Getting team stats...');
    const teamStatsResponse = await axios.get(`${BASE_URL}/team-stats`);
    logger.info(`Team Stats API Response: ${JSON.stringify(teamStatsResponse.data, null, 2)}`);
    
    // Test 6: Create a new schedule
    logger.info('Test 6: Creating a new schedule...');
    const newSchedule = {
      name: 'Big 12 Basketball 2025-2026',
      description: 'Regular season schedule for Big 12 Basketball',
      sport_id: 2, // Basketball
      championship_id: 1, // Big 12
      start_date: '2025-11-01',
      end_date: '2026-03-15'
    };
    
    const createScheduleResponse = await axios.post(`${BASE_URL}/schedules`, newSchedule);
    logger.info(`Create Schedule API Response: ${JSON.stringify(createScheduleResponse.data, null, 2)}`);
    
    // Test 7: Get all schedules
    logger.info('Test 7: Getting all schedules...');
    const schedulesResponse = await axios.get(`${BASE_URL}/schedules`);
    logger.info(`Schedules API Response: ${JSON.stringify(schedulesResponse.data, null, 2)}`);
    
    logger.info('All API endpoint tests completed successfully!');
    return true;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error(`No response received: ${error.request}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error(`Error setting up request: ${error.message}`);
    }
    
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  // First start the server in a separate process
  logger.info('Make sure the scheduling service is running on port 3000');
  
  testApiEndpoints()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  testApiEndpoints
};
