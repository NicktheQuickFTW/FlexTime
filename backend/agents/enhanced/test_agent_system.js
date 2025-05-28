/**
 * Test Script for FlexTime Enhanced Agent System
 * 
 * This script tests the functionality of the enhanced agent system,
 * verifying that all components work correctly with Context7.
 */

require('dotenv').config();
const AgentSystemManager = require('./agent_system_manager');
const logger = require('../utils/logger');

// Test scenarios for different agent components
const TEST_SCENARIOS = {
  memory: {
    content: 'Important scheduling pattern for football: Teams should not play more than two consecutive away games.',
    tags: ['football', 'scheduling', 'patterns'],
    importance: 'high'
  },
  prediction: {
    sportType: 'football',
    season: '2024-2025',
    institutions: [
      'University of Texas',
      'Texas Tech University',
      'Baylor University',
      'Texas Christian University'
    ],
    startDate: '2024-09-01',
    endDate: '2024-11-30'
  },
  conflict: {
    sportType: 'football',
    schedule: [
      {
        id: 'game1',
        date: '2024-09-14',
        startTime: '14:00',
        homeTeam: 'University of Texas',
        awayTeam: 'Oklahoma University',
        venue: 'DKR Texas Memorial Stadium',
        durationHours: 3
      },
      {
        id: 'game2',
        date: '2024-09-14',
        startTime: '19:00',
        homeTeam: 'University of Texas', // Team conflict - same team, same day
        awayTeam: 'Texas Tech University',
        venue: 'Jones AT&T Stadium',
        durationHours: 3
      },
      {
        id: 'game3',
        date: '2024-09-14',
        startTime: '15:00',
        homeTeam: 'Baylor University',
        awayTeam: 'TCU',
        venue: 'DKR Texas Memorial Stadium', // Venue conflict - overlapping time
        durationHours: 3
      },
      {
        id: 'game4',
        date: '2024-09-15',
        startTime: '12:00',
        homeTeam: 'Oklahoma University',
        awayTeam: 'University of Texas', // Rest period conflict - not enough rest
        venue: 'Oklahoma Memorial Stadium',
        durationHours: 3
      }
    ]
  }
};

/**
 * Run all tests for the enhanced agent system
 */
async function runTests() {
  try {
    console.log('\n\n======= FLEXTIME ENHANCED AGENT SYSTEM TEST =======\n');
    console.log('Initializing agent system...');
    
    // Create and initialize agent system
    const agentSystem = new AgentSystemManager();
    const initialized = await agentSystem.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to initialize agent system');
      process.exit(1);
    }
    
    console.log('✅ Agent system initialized successfully\n');
    
    // Run individual component tests
    await runComponentTests(agentSystem);
    
    // Run integration test
    await runIntegrationTest(agentSystem);
    
    // Clean up
    await agentSystem.shutdown();
    
    console.log('\n======= ALL TESTS COMPLETED =======\n');
  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run individual component tests
 * 
 * @param {AgentSystemManager} agentSystem - Agent system instance
 */
async function runComponentTests(agentSystem) {
  console.log('\n----- COMPONENT TESTS -----\n');
  
  // Test memory agent
  console.log('Testing Enhanced Memory Agent...');
  const memoryResult = await agentSystem.runTest('memory', TEST_SCENARIOS.memory);
  
  if (memoryResult.success) {
    console.log('✅ Memory agent test passed');
  } else {
    console.error(`❌ Memory agent test failed: ${memoryResult.error || 'Unknown error'}`);
  }
  
  // Test predictive scheduling agent
  console.log('\nTesting Predictive Scheduling Agent...');
  const predictionResult = await agentSystem.runTest('prediction', TEST_SCENARIOS.prediction);
  
  if (predictionResult.success) {
    console.log('✅ Predictive scheduling agent test passed');
    console.log(`   Generated ${predictionResult.predictionResult.predictions[0].schedule.length} games with confidence ${predictionResult.predictionResult.confidence.toFixed(2)}`);
  } else {
    console.error(`❌ Predictive scheduling agent test failed: ${predictionResult.error || 'Unknown error'}`);
  }
  
  // Test conflict resolution agent
  console.log('\nTesting Conflict Resolution Agent...');
  const conflictResult = await agentSystem.runTest('conflict', TEST_SCENARIOS.conflict);
  
  if (conflictResult.success) {
    console.log('✅ Conflict resolution agent test passed');
    console.log(`   Detected ${conflictResult.detectionResult.conflicts.length} conflicts`);
    
    if (conflictResult.resolutionResult) {
      console.log(`   Applied ${conflictResult.resolutionResult.resolutions.length} resolutions`);
    }
    
    if (conflictResult.explanationResult && conflictResult.explanationResult.explanation) {
      console.log(`   Explanation: "${conflictResult.explanationResult.explanation.substring(0, 100)}..."`);
    }
  } else {
    console.error(`❌ Conflict resolution agent test failed: ${conflictResult.error || 'Unknown error'}`);
  }
}

/**
 * Run integration test of all agents working together
 * 
 * @param {AgentSystemManager} agentSystem - Agent system instance
 */
async function runIntegrationTest(agentSystem) {
  console.log('\n----- INTEGRATION TEST -----\n');
  console.log('Testing complete agent system workflow...');
  
  // Run the integration test
  const integrationResult = await agentSystem.runTest('integration', TEST_SCENARIOS.prediction);
  
  if (integrationResult.success) {
    console.log('✅ Integration test passed');
    console.log(`   Final schedule contains ${integrationResult.finalScheduleSize} games`);
    
    // Show progress through each step
    for (const [key, success] of Object.entries(integrationResult.results)) {
      console.log(`   ${success ? '✅' : '❌'} ${key.charAt(0).toUpperCase() + key.slice(1)}`);
    }
  } else {
    console.error(`❌ Integration test failed: ${integrationResult.error || 'Unknown error'}`);
    
    // Show which steps succeeded before failure
    for (const [key, success] of Object.entries(integrationResult.results)) {
      console.log(`   ${success ? '✅' : '❌'} ${key.charAt(0).toUpperCase() + key.slice(1)}`);
    }
  }
}

// Run all tests
runTests().catch(error => {
  console.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});
