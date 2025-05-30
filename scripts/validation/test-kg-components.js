/**
 * Test Script for Knowledge Graph Components
 * 
 * This script tests the Knowledge Graph API endpoints
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

const testFeedback = [
  {
    id: 'feedback_001',
    scheduleId: 'test_schedule_123',
    userId: 'user_123',
    rating: 4,
    comments: 'Good balance of home and away games',
    metrics: {
      balance: 0.8,
      travel: 0.7,
      rest: 0.9
    },
    timestamp: new Date().toISOString()
  },
  {
    id: 'feedback_002',
    scheduleId: 'test_schedule_123',
    userId: 'user_456',
    rating: 5,
    comments: 'Perfect spacing between games',
    metrics: {
      balance: 0.9,
      travel: 0.8,
      rest: 0.95
    },
    timestamp: new Date().toISOString()
  }
];

const testExperiences = [
  {
    id: 'exp_001',
    type: 'schedule_generation',
    timestamp: new Date().toISOString(),
    content: {
      parameters: {
        optimizationIterations: 500,
        maxConsecutiveHome: 3,
        maxConsecutiveAway: 3
      },
      algorithms: {
        generator: 'adaptive'
      },
      metrics: {
        quality: 0.85,
        generationTime: 2.3
      }
    }
  },
  {
    id: 'exp_002',
    type: 'optimization',
    timestamp: new Date().toISOString(),
    content: {
      parameters: {
        coolingRate: 0.95,
        initialTemperature: 500,
        iterations: 5000
      },
      metrics: {
        improvement: 0.15,
        timeElapsed: 5.7
      }
    }
  }
];

/**
 * Test the Knowledge Graph API endpoints
 */
async function testKnowledgeGraphApi() {
  try {
    console.log('Testing Knowledge Graph API...');
    
    // Check server status
    console.log('\n1. Testing server status...');
    await checkServerStatus();
    
    // Test Knowledge Graph status
    console.log('\n2. Testing Knowledge Graph status...');
    await testKnowledgeGraphStatus();
    
    // Test entity creation
    console.log('\n3. Testing entity creation...');
    await testEntityCreation();
    
    // Test relationship creation
    console.log('\n4. Testing relationship creation...');
    await testRelationshipCreation();
    
    // Test enhancing from schedule
    console.log('\n5. Testing enhancing from schedule...');
    await testEnhanceFromSchedule();
    
    // Test enhancing from feedback
    console.log('\n6. Testing enhancing from feedback...');
    await testEnhanceFromFeedback();
    
    // Test enhancing from experiences
    console.log('\n7. Testing enhancing from experiences...');
    await testEnhanceFromExperiences();
    
    // Test querying insights
    console.log('\n8. Testing querying insights...');
    await testQueryInsights();
    
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
    console.log('Knowledge Graph capabilities:', response.data.capabilities.knowledge_graph);
    
    // Check if Knowledge Graph capabilities are listed
    if (!response.data.capabilities.knowledge_graph) {
      throw new Error('Knowledge Graph capabilities not found in status response');
    }
    
    console.log('✅ Server status check passed');
    return true;
  } catch (error) {
    console.error('❌ Server status check failed:', error.message);
    throw error;
  }
}

/**
 * Test Knowledge Graph status
 */
async function testKnowledgeGraphStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/kg/status`);
    
    console.log('Knowledge Graph status:', response.data.status);
    console.log('Entity count:', response.data.entityCount);
    console.log('Entity types:', response.data.entityTypes);
    
    console.log('✅ Knowledge Graph status check passed');
    return true;
  } catch (error) {
    console.error('❌ Knowledge Graph status check failed:', error.message);
    throw error;
  }
}

/**
 * Test entity creation
 */
async function testEntityCreation() {
  try {
    const testEntity = {
      entityId: 'test_team_123',
      entityType: 'team',
      properties: {
        name: 'Test Team',
        sportType: 'basketball',
        rating: 0.85
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/kg/entity`, testEntity);
    
    console.log('Entity created:', response.data.entityId);
    
    // Verify the entity was created by getting it
    const getResponse = await axios.get(`${API_BASE_URL}/api/kg/entity/${testEntity.entityId}`);
    
    if (getResponse.data.entity.entityId !== testEntity.entityId) {
      throw new Error('Entity retrieval failed: entity ID mismatch');
    }
    
    console.log('Entity verified:', getResponse.data.entity.entityId);
    console.log('✅ Entity creation test passed');
    return true;
  } catch (error) {
    console.error('❌ Entity creation test failed:', error.message);
    throw error;
  }
}

/**
 * Test relationship creation
 */
async function testRelationshipCreation() {
  try {
    // Create a venue entity
    const venueEntity = {
      entityId: 'test_venue_123',
      entityType: 'venue',
      properties: {
        name: 'Test Arena',
        capacity: 20000
      }
    };
    
    await axios.post(`${API_BASE_URL}/api/kg/entity`, venueEntity);
    
    // Create a relationship
    const relationship = {
      sourceId: 'test_team_123',
      relationshipType: 'home_venue',
      targetId: 'test_venue_123',
      properties: {
        since: '2020-01-01'
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/kg/relationship`, relationship);
    
    console.log('Relationship created:', 
      `${response.data.sourceId} -> ${response.data.relationshipType} -> ${response.data.targetId}`);
    
    // Verify by querying the entity
    const getResponse = await axios.get(`${API_BASE_URL}/api/kg/entity/${relationship.sourceId}`);
    
    const relationships = getResponse.data.entity.relationships;
    if (!relationships || 
        !relationships[relationship.relationshipType] || 
        !relationships[relationship.relationshipType][relationship.targetId]) {
      throw new Error('Relationship verification failed: relationship not found');
    }
    
    console.log('Relationship verified');
    console.log('✅ Relationship creation test passed');
    return true;
  } catch (error) {
    console.error('❌ Relationship creation test failed:', error.message);
    throw error;
  }
}

/**
 * Test enhancing from schedule
 */
async function testEnhanceFromSchedule() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/kg/enhance/schedule`, {
      schedule: testSchedule
    });
    
    console.log('Enhancement result:', response.data.result);
    
    // Check if teams were added
    if (response.data.result.teams_added === 0 && 
        response.data.result.patterns_extracted === 0) {
      console.warn('⚠️ No teams or patterns were added - this may indicate an issue');
    }
    
    console.log('✅ Enhance from schedule test passed');
    return true;
  } catch (error) {
    console.error('❌ Enhance from schedule test failed:', error.message);
    throw error;
  }
}

/**
 * Test enhancing from feedback
 */
async function testEnhanceFromFeedback() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/kg/enhance/feedback`, {
      feedback: testFeedback
    });
    
    console.log('Enhancement result:', response.data.result);
    
    console.log('✅ Enhance from feedback test passed');
    return true;
  } catch (error) {
    console.error('❌ Enhance from feedback test failed:', error.message);
    throw error;
  }
}

/**
 * Test enhancing from experiences
 */
async function testEnhanceFromExperiences() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/kg/enhance/experiences`, {
      experiences: testExperiences
    });
    
    console.log('Enhancement result:', response.data.result);
    
    console.log('✅ Enhance from experiences test passed');
    return true;
  } catch (error) {
    console.error('❌ Enhance from experiences test failed:', error.message);
    throw error;
  }
}

/**
 * Test querying insights
 */
async function testQueryInsights() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/kg/insights?sportType=basketball&teamId=Team_1`);
    
    console.log('Insights:', JSON.stringify(response.data.insights, null, 2));
    
    console.log('✅ Query insights test passed');
    return true;
  } catch (error) {
    console.error('❌ Query insights test failed:', error.message);
    throw error;
  }
}

// Run the tests
testKnowledgeGraphApi().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});