/**
 * Script to test the director agent capabilities of the HELiiX Intelligence Engine
 * 
 * This script demonstrates how to interact with the director agents for task delegation.
 * 
 * Usage:
 *   node scripts/test-director-agents.js
 * 
 * Prerequisites:
 *   - Python Intelligence Engine must be running on localhost:4001
 *   - Environment variables must be set (see below)
 */

require('dotenv').config();
const axios = require('axios');

// Set environment variables if not already set
process.env.ENABLE_INTELLIGENCE_ENGINE = process.env.ENABLE_INTELLIGENCE_ENGINE || 'true';
process.env.INTELLIGENCE_ENGINE_URL = process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api';
process.env.INTELLIGENCE_ENGINE_API_KEY = process.env.INTELLIGENCE_ENGINE_API_KEY || 'development-key';

/**
 * Get information about available agents
 */
async function getAgents() {
  console.log('Retrieving agent information...');
  
  try {
    const response = await axios.get(`${process.env.INTELLIGENCE_ENGINE_URL}/agents`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving agent information:', error.message);
    return { count: 0, agents: [] };
  }
}

/**
 * Get information about director agents
 */
async function getDirectors() {
  console.log('Retrieving director information...');
  
  try {
    const response = await axios.get(`${process.env.INTELLIGENCE_ENGINE_URL}/agents/directors`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving director information:', error.message);
    return { count: 0, directors: [] };
  }
}

/**
 * Create a task for the scheduling director
 */
async function createSchedulingTask() {
  console.log('Creating task for scheduling director...');
  
  // Sample teams for testing
  const teams = [
    { teamId: 'team1', name: 'Arizona Wildcats' },
    { teamId: 'team2', name: 'Arizona State Sun Devils' },
    { teamId: 'team3', name: 'BYU Cougars' },
    { teamId: 'team4', name: 'Cincinnati Bearcats' },
    { teamId: 'team5', name: 'Colorado Buffaloes' },
    { teamId: 'team6', name: 'Houston Cougars' }
  ];
  
  // Task data
  const taskData = {
    taskType: 'generate_schedule',
    description: 'Generate a basketball schedule for testing',
    parameters: {
      sportType: 'basketball',
      teams: teams,
      constraints: [
        {
          type: 'rest_days',
          parameters: {
            minDays: 2,
            priority: 'high'
          }
        }
      ],
      options: {
        season: '2025-2026',
        startDate: '2025-11-01',
        endDate: '2026-03-15'
      }
    }
  };
  
  try {
    const response = await axios.post(`${process.env.INTELLIGENCE_ENGINE_URL}/agents/directors/scheduling/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating scheduling task:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Create a task for the analysis director
 */
async function createAnalysisTask() {
  console.log('Creating task for analysis director...');
  
  // Create a sample schedule
  const gameDay1 = {
    date: '2025-11-01',
    games: [
      { homeTeam: 'team1', awayTeam: 'team2', date: '2025-11-01' },
      { homeTeam: 'team3', awayTeam: 'team4', date: '2025-11-01' },
      { homeTeam: 'team5', awayTeam: 'team6', date: '2025-11-01' }
    ]
  };
  
  const gameDay2 = {
    date: '2025-11-08',
    games: [
      { homeTeam: 'team2', awayTeam: 'team3', date: '2025-11-08' },
      { homeTeam: 'team4', awayTeam: 'team5', date: '2025-11-08' },
      { homeTeam: 'team6', awayTeam: 'team1', date: '2025-11-08' }
    ]
  };
  
  const schedule = {
    type: 'schedule',
    sportType: 'basketball',
    season: '2025-2026',
    teams: ['team1', 'team2', 'team3', 'team4', 'team5', 'team6'],
    gameDays: [gameDay1, gameDay2],
    gameCount: 6,
    startDate: '2025-11-01',
    endDate: '2026-03-15',
    generatedAt: new Date().toISOString()
  };
  
  // Task data
  const taskData = {
    taskType: 'analyze_schedule',
    description: 'Analyze a basketball schedule for testing',
    parameters: {
      schedule: schedule,
      analysisType: 'generic'
    }
  };
  
  try {
    const response = await axios.post(`${process.env.INTELLIGENCE_ENGINE_URL}/agents/directors/analysis/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating analysis task:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Create a task for the operations director
 */
async function createOperationsTask() {
  console.log('Creating task for operations director...');
  
  // Task data
  const taskData = {
    taskType: 'manage_venues',
    description: 'Manage venue availability for testing',
    parameters: {
      venues: [
        {
          venueId: 'venue1',
          name: 'Arizona Arena',
          capacity: 15000,
          availability: {
            startDate: '2025-11-01',
            endDate: '2026-03-15',
            blackoutDates: ['2025-12-24', '2025-12-25', '2025-12-31', '2026-01-01']
          }
        },
        {
          venueId: 'venue2',
          name: 'BYU Stadium',
          capacity: 12000,
          availability: {
            startDate: '2025-11-01',
            endDate: '2026-03-15',
            blackoutDates: ['2025-12-24', '2025-12-25', '2025-12-31', '2026-01-01']
          }
        }
      ]
    }
  };
  
  try {
    const response = await axios.post(`${process.env.INTELLIGENCE_ENGINE_URL}/agents/directors/operations/tasks`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating operations task:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('======================================================');
    console.log('  HELiiX Intelligence Engine Director Agents Test');
    console.log('======================================================');
    console.log(`Intelligence Engine URL: ${process.env.INTELLIGENCE_ENGINE_URL}`);
    console.log('');
    
    // Get agent information
    const agentInfo = await getAgents();
    console.log(`Found ${agentInfo.count} agents in the system`);
    
    // Get director information
    const directorInfo = await getDirectors();
    console.log(`Found ${directorInfo.count} directors in the system`);
    
    if (directorInfo.directors) {
      console.log('\nDirector information:');
      directorInfo.directors.forEach(director => {
        console.log(`- ${director.director_type} (${director.agent_id}): ${director.specialized_agents.length} specialized agents, ${director.capabilities.join(', ')}`);
      });
    }
    
    // Test scheduling director
    console.log('\nTesting Scheduling Director:');
    const schedulingResult = await createSchedulingTask();
    if (schedulingResult.success) {
      console.log(`Task ${schedulingResult.task_id} created successfully`);
      console.log(`Status: ${schedulingResult.status}`);
      if (schedulingResult.agent_id) {
        console.log(`Delegated to agent: ${schedulingResult.agent_id}`);
      }
    } else {
      console.error('Failed to create scheduling task:', schedulingResult.error);
    }
    
    // Test analysis director
    console.log('\nTesting Analysis Director:');
    const analysisResult = await createAnalysisTask();
    if (analysisResult.success) {
      console.log(`Task ${analysisResult.task_id} created successfully`);
      console.log(`Status: ${analysisResult.status}`);
      if (analysisResult.agent_id) {
        console.log(`Delegated to agent: ${analysisResult.agent_id}`);
      }
    } else {
      console.error('Failed to create analysis task:', analysisResult.error);
    }
    
    // Test operations director
    console.log('\nTesting Operations Director:');
    const operationsResult = await createOperationsTask();
    if (operationsResult.success) {
      console.log(`Task ${operationsResult.task_id} created successfully`);
      console.log(`Status: ${operationsResult.status}`);
      if (operationsResult.agent_id) {
        console.log(`Delegated to agent: ${operationsResult.agent_id}`);
      }
    } else {
      console.error('Failed to create operations task:', operationsResult.error);
    }
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the main function
main().catch(console.error);