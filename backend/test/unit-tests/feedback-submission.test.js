/**
 * Feedback Submission Tests
 * 
 * Tests the feedback submission functionality in the FlexTime scheduling system
 */

const { FlexTimeAgentSystem } = require('../../agents');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Redis = require('ioredis-mock');

// Mock Redis client for testing
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock Intelligence Engine Client
jest.mock('../../agents/intelligence_engine_client', () => {
  return jest.fn().mockImplementation(() => {
    return {
      enabled: true,
      initialize: jest.fn().mockResolvedValue(true),
      shutdown: jest.fn().mockResolvedValue(true),
      storeExperience: jest.fn().mockResolvedValue('test-experience-id'),
      retrieveExperiences: jest.fn().mockResolvedValue([])
    };
  });
});

// Mock Historical Data Adapter
jest.mock('../../learning/historical-data-adapter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      initialize: jest.fn().mockResolvedValue(true),
      shutdown: jest.fn().mockResolvedValue(true),
      storeFeedback: jest.fn().mockResolvedValue(true),
      getSchedulingInsights: jest.fn().mockResolvedValue({
        recommendedAlgorithm: 'round_robin',
        constraintWeights: {
          travel_distance: 0.4,
          rest_period: 0.3,
          venue_availability: 0.3
        }
      })
    };
  });
});

describe('Feedback Submission System', () => {
  let mongoServer;
  let agentSystem;
  
  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    // Initialize agent system with historical learning enabled
    agentSystem = new FlexTimeAgentSystem({
      enableMCP: true,
      enableHistoricalLearning: true,
      mongoUri,
      redisClient: new Redis()
    });
    
    await agentSystem.initialize();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(async () => {
    // Shutdown agent system
    await agentSystem.shutdown();
    
    // Close MongoDB connection
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  test('Should successfully submit feedback for a schedule', async () => {
    // Create test feedback data
    const feedbackData = {
      scheduleId: 'test-schedule-id',
      sportType: 'basketball',
      rating: 4.5,
      comments: 'Great schedule, minimal travel distances!'
    };
    
    // Submit feedback
    const result = await agentSystem.submitFeedback(feedbackData);
    
    // Check result
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // Verify historical data adapter was called
    expect(agentSystem.historicalData.storeFeedback).toHaveBeenCalledWith(
      'test-schedule-id',
      {
        userRating: 4.5,
        comments: 'Great schedule, minimal travel distances!'
      }
    );
    
    // Verify intelligence engine was called
    expect(agentSystem.intelligenceEngine.storeExperience).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'user_feedback',
        type: 'schedule_feedback',
        content: expect.objectContaining({
          scheduleId: 'test-schedule-id',
          sportType: 'basketball',
          rating: 4.5
        }),
        tags: ['feedback', 'basketball']
      })
    );
  });
  
  test('Should handle feedback with minimal data', async () => {
    // Create minimal feedback data
    const minimalFeedback = {
      scheduleId: 'minimal-test-id',
      sportType: 'football',
      rating: 3.0
    };
    
    // Submit feedback
    const result = await agentSystem.submitFeedback(minimalFeedback);
    
    // Check result
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // Verify historical data adapter was called with correct data
    expect(agentSystem.historicalData.storeFeedback).toHaveBeenCalledWith(
      'minimal-test-id',
      {
        userRating: 3.0,
        comments: undefined
      }
    );
  });
  
  test('Should handle errors during feedback submission', async () => {
    // Mock error in historical data adapter
    agentSystem.historicalData.storeFeedback.mockRejectedValueOnce(
      new Error('Database connection error')
    );
    
    // Create test feedback data
    const feedbackData = {
      scheduleId: 'error-test-id',
      sportType: 'soccer',
      rating: 2.0,
      comments: 'Too many away games in a row'
    };
    
    // Submit feedback (should not throw but return error in result)
    const result = await agentSystem.submitFeedback(feedbackData);
    
    // Check error handling
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Database connection error');
  });
  
  test('Should submit feedback when intelligence engine is disabled', async () => {
    // Temporarily disable intelligence engine
    const originalEnabled = agentSystem.intelligenceEngine.enabled;
    agentSystem.intelligenceEngine.enabled = false;
    
    // Create test feedback data
    const feedbackData = {
      scheduleId: 'disabled-ie-test',
      sportType: 'volleyball',
      rating: 5.0,
      comments: 'Perfect schedule!'
    };
    
    // Submit feedback
    const result = await agentSystem.submitFeedback(feedbackData);
    
    // Check result
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // Verify historical data adapter was still called
    expect(agentSystem.historicalData.storeFeedback).toHaveBeenCalledWith(
      'disabled-ie-test',
      {
        userRating: 5.0,
        comments: 'Perfect schedule!'
      }
    );
    
    // Verify intelligence engine was NOT called for this test
    expect(agentSystem.intelligenceEngine.storeExperience).not.toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          scheduleId: 'disabled-ie-test'
        })
      })
    );
    
    // Restore intelligence engine state
    agentSystem.intelligenceEngine.enabled = originalEnabled;
  });
});