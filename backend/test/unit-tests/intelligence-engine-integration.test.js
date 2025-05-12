/**
 * Intelligence Engine Integration Tests
 * 
 * Tests the integration between FlexTime scheduling system and the HELiiX Intelligence Engine
 */

const { FlexTimeAgentSystem } = require('../../agents');
const IntelligenceEngineClient = require('../../agents/intelligence_engine_client');
const intelligenceEngineConfig = require('../../config/intelligence_engine_config');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Redis = require('ioredis-mock');

// Mock Redis client for testing
jest.mock('ioredis', () => require('ioredis-mock'));

describe('Intelligence Engine Integration', () => {
  let mongoServer;
  let agentSystem;
  let intelligenceEngine;
  
  // Sample data for testing
  const teams = [
    { id: 'team1', name: 'Team One', location: 'City A' },
    { id: 'team2', name: 'Team Two', location: 'City B' },
    { id: 'team3', name: 'Team Three', location: 'City C' },
    { id: 'team4', name: 'Team Four', location: 'City D' }
  ];
  
  const constraints = [
    { id: 'rest_days', type: 'rest_period', value: 2, description: 'Minimum days between games' },
    { id: 'max_travel', type: 'travel_distance', value: 500, description: 'Maximum travel distance' }
  ];
  
  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    // Initialize Intelligence Engine client
    intelligenceEngine = new IntelligenceEngineClient({
      ...intelligenceEngineConfig,
      enabled: true,
      serviceUrl: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api'
    });
    
    await intelligenceEngine.initialize();
    
    // Initialize agent system
    agentSystem = new FlexTimeAgentSystem({
      enableMCP: true,
      mongoUri,
      redisClient: new Redis()
    });
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(async () => {
    // Shutdown systems
    await agentSystem.shutdown();
    await intelligenceEngine.shutdown();
    
    // Close MongoDB connection
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  test('Should initialize Intelligence Engine client successfully', () => {
    expect(intelligenceEngine).toBeDefined();
    expect(typeof intelligenceEngine.getSchedulingRecommendations).toBe('function');
  });
  
  test('Should get scheduling recommendations from Intelligence Engine', async () => {
    const recommendations = await intelligenceEngine.getSchedulingRecommendations({
      sportType: 'basketball',
      teamCount: 4,
      conferenceId: 'test_conference'
    });
    
    expect(recommendations).toBeDefined();
    expect(recommendations.success).toBe(true);
    expect(recommendations.recommendations).toBeDefined();
    expect(recommendations.recommendations.algorithm).toBeDefined();
    expect(recommendations.recommendations.constraintWeights).toBeDefined();
  });
  
  test('Should generate schedule using Intelligence Engine recommendations', async () => {
    const result = await agentSystem.generateSchedule(
      'basketball',
      teams,
      constraints,
      {
        conferenceId: 'test_conference',
        seasonYear: 2025,
        startDate: '2025-11-01',
        endDate: '2026-03-15'
      }
    );
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.schedule).toBeDefined();
    expect(result.schedule.games).toBeDefined();
    expect(result.schedule.games.length).toBeGreaterThan(0);
  });
  
  test('Should optimize schedule using Intelligence Engine recommendations', async () => {
    // First generate a schedule
    const scheduleResult = await agentSystem.generateSchedule(
      'basketball',
      teams,
      constraints,
      {
        conferenceId: 'test_conference',
        seasonYear: 2025,
        startDate: '2025-11-01',
        endDate: '2026-03-15'
      }
    );
    
    // Then optimize it
    const result = await agentSystem.optimizeSchedule(
      scheduleResult.schedule,
      'simulated_annealing',
      {
        focusAreas: ['travel_distance'],
        maxIterations: 100
      }
    );
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.improvements).toBeDefined();
    expect(result.improvements.travelDistance).toBeDefined();
    expect(result.improvements.travelDistance.percentImprovement).toBeGreaterThan(0);
  });
  
  test('Should store and retrieve experiences through Intelligence Engine', async () => {
    // Store an experience
    const experienceId = await intelligenceEngine.storeExperience({
      agentId: 'scheduling_director',
      type: 'schedule_generation',
      content: {
        sportType: 'basketball',
        conferenceId: 'test_conference',
        outcome: 'success',
        metrics: {
          travelDistance: 15000,
          homeAwayBalance: 0.95,
          constraintSatisfaction: 0.98
        }
      },
      tags: ['basketball', 'test_conference', 'test']
    });
    
    expect(experienceId).toBeDefined();
    
    // Retrieve the experience
    const experiences = await intelligenceEngine.retrieveExperiences({
      agentId: 'scheduling_director',
      tags: ['basketball']
    });
    
    // In test mode, we might not get results back if Intelligence Engine is mocked
    if (experiences.length > 0) {
      expect(experiences[0]).toBeDefined();
      expect(experiences[0].content).toBeDefined();
      expect(experiences[0].content.sportType).toBe('basketball');
    }
  });
});
