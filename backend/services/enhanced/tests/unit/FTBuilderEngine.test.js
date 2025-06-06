/**
 * Unit Tests for FT Builder Engine
 * 
 * Comprehensive test suite covering all engine components
 * including performance benchmarks and memory leak detection.
 */

const FTBuilderEngine = require('../../FT_Builder_Engine');
const PerformanceMonitor = require('../scripts/PerformanceMonitor');
const MemoryLeakDetector = require('../scripts/MemoryLeakDetector');
const MockDataGenerator = require('../scripts/MockDataGenerator');

describe('FTBuilderEngine Unit Tests', () => {
  let engine;
  let performanceMonitor;
  let memoryDetector;
  let mockData;

  beforeAll(async () => {
    performanceMonitor = new PerformanceMonitor();
    memoryDetector = new MemoryLeakDetector();
    mockData = new MockDataGenerator();
    
    // Initialize engine with test configuration
    engine = new FTBuilderEngine({
      useHistoricalData: true,
      useLocalRecommendations: true,
      useAdaptiveOptimization: true,
      memory: {
        maxMemoryMB: 128,
        cleanupInterval: 30000
      }
    });
    
    await engine.initialize();
  });

  afterAll(async () => {
    await engine.cleanup();
    await memoryDetector.generateReport();
  });

  describe('Engine Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(engine.config.useHistoricalData).toBe(true);
      expect(engine.config.useLocalRecommendations).toBe(true);
      expect(engine.config.useAdaptiveOptimization).toBe(true);
    });

    test('should initialize memory manager', () => {
      expect(engine.memoryManager).toBeDefined();
    });

    test('should set up logging correctly', () => {
      expect(engine.logger).toBeDefined();
    });
  });

  describe('Schedule Generation', () => {
    beforeEach(() => {
      performanceMonitor.start('schedule_generation');
    });

    afterEach(() => {
      const metrics = performanceMonitor.stop('schedule_generation');
      expect(metrics.duration).toBeLessThan(5000); // 5 seconds max
    });

    test('should generate schedule for single sport', async () => {
      const constraints = mockData.generateConstraints('basketball', 16);
      const teams = mockData.generateTeams('basketball', 16);
      
      const result = await engine.generateSchedule({
        sport: 'basketball',
        teams,
        constraints,
        season: '2025-26'
      });

      expect(result).toBeDefined();
      expect(result.schedule).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.schedule.length).toBeGreaterThan(0);
    });

    test('should handle multi-sport scheduling', async () => {
      const sports = ['basketball', 'baseball', 'softball'];
      const scheduleRequests = sports.map(sport => ({
        sport,
        teams: mockData.generateTeams(sport, 14),
        constraints: mockData.generateConstraints(sport, 14),
        season: '2025-26'
      }));

      const results = await engine.generateMultiSportSchedule(scheduleRequests);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.schedule).toBeDefined();
        expect(result.conflicts.length).toBeLessThan(10); // Low conflict count
      });
    });

    test('should optimize existing schedule', async () => {
      const initialSchedule = mockData.generateSchedule('football', 16);
      const constraints = mockData.generateConstraints('football', 16);
      
      const optimizedResult = await engine.optimizeSchedule({
        schedule: initialSchedule,
        constraints,
        optimizationLevel: 'aggressive'
      });

      expect(optimizedResult.improved).toBe(true);
      expect(optimizedResult.metrics.conflictReduction).toBeGreaterThan(0);
    });
  });

  describe('Constraint Validation', () => {
    test('should validate venue availability constraints', async () => {
      const constraints = {
        venue: {
          unavailableDates: ['2025-12-25', '2026-01-01'],
          maintenanceWindows: [{
            start: '2025-06-01',
            end: '2025-06-15',
            venues: ['stadium1', 'arena2']
          }]
        }
      };
      
      const schedule = mockData.generateScheduleWithVenues('basketball', 16);
      const validation = await engine.validateConstraints(schedule, constraints);
      
      expect(validation.isValid).toBeDefined();
      expect(validation.violations).toBeDefined();
      expect(validation.score).toBeGreaterThanOrEqual(0);
    });

    test('should validate travel constraints', async () => {
      const constraints = {
        travel: {
          maxConsecutiveAway: 3,
          minDaysBetweenGames: 1,
          maxTravelDistance: 1000
        }
      };
      
      const teams = mockData.generateTeamsWithLocations('football', 16);
      const schedule = mockData.generateScheduleWithTravel('football', teams);
      
      const validation = await engine.validateConstraints(schedule, constraints);
      
      expect(validation.travelViolations).toBeDefined();
      expect(validation.distanceMetrics).toBeDefined();
    });

    test('should validate championship constraints', async () => {
      const constraints = {
        championship: {
          date: '2026-03-15',
          minimumRestDays: 3,
          qualificationCriteria: {
            minGames: 18,
            conferenceGamesRequired: 16
          }
        }
      };
      
      const schedule = mockData.generateSeasonSchedule('basketball', 16);
      const validation = await engine.validateConstraints(schedule, constraints);
      
      expect(validation.championshipReady).toBeDefined();
      expect(validation.qualifiedTeams).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance targets for large schedules', async () => {
      const startTime = Date.now();
      const teams = mockData.generateTeams('football', 16);
      const constraints = mockData.generateComplexConstraints('football', 16);
      
      const result = await engine.generateSchedule({
        sport: 'football',
        teams,
        constraints,
        season: '2025-26'
      });
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10000); // 10 seconds max
      expect(result.metrics.evaluationTime).toBeLessThan(5000);
      expect(result.metrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB
    });

    test('should handle concurrent schedule generation', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill().map((_, i) => 
        engine.generateSchedule({
          sport: 'basketball',
          teams: mockData.generateTeams('basketball', 16),
          constraints: mockData.generateConstraints('basketball', 16),
          season: `2025-26-${i}`
        })
      );
      
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(concurrentRequests);
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 5 concurrent
      
      results.forEach(result => {
        expect(result.schedule).toBeDefined();
        expect(result.conflicts.length).toBeLessThan(20);
      });
    });

    test('should maintain memory efficiency', async () => {
      const initialMemory = process.memoryUsage();
      
      // Generate multiple schedules to test memory management
      for (let i = 0; i < 10; i++) {
        await engine.generateSchedule({
          sport: 'baseball',
          teams: mockData.generateTeams('baseball', 14),
          constraints: mockData.generateConstraints('baseball', 14),
          season: `test-${i}`
        });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB increase max
    });
  });

  describe('Historical Data Integration', () => {
    test('should learn from historical schedules', async () => {
      const historicalData = mockData.generateHistoricalSchedules('basketball', 5);
      
      await engine.learnFromHistory(historicalData);
      
      const recommendations = await engine.getHistoricalRecommendations({
        sport: 'basketball',
        teams: mockData.generateTeams('basketball', 16)
      });
      
      expect(recommendations).toBeDefined();
      expect(recommendations.patterns).toBeDefined();
      expect(recommendations.suggestions).toBeDefined();
    });

    test('should apply learned patterns to new schedules', async () => {
      const baseSchedule = await engine.generateSchedule({
        sport: 'basketball',
        teams: mockData.generateTeams('basketball', 16),
        constraints: mockData.generateConstraints('basketball', 16),
        useHistoricalLearning: false
      });
      
      const enhancedSchedule = await engine.generateSchedule({
        sport: 'basketball',
        teams: mockData.generateTeams('basketball', 16),
        constraints: mockData.generateConstraints('basketball', 16),
        useHistoricalLearning: true
      });
      
      expect(enhancedSchedule.metrics.learningScore).toBeGreaterThan(0);
      expect(enhancedSchedule.metrics.patternMatches).toBeGreaterThan(0);
    });
  });

  describe('Memory Leak Detection', () => {
    test('should not leak memory during normal operations', async () => {
      memoryDetector.startMonitoring();
      
      // Perform multiple operations
      for (let i = 0; i < 20; i++) {
        await engine.generateSchedule({
          sport: 'softball',
          teams: mockData.generateTeams('softball', 11),
          constraints: mockData.generateConstraints('softball', 11)
        });
        
        if (i % 5 === 0) {
          global.gc && global.gc(); // Force garbage collection if available
        }
      }
      
      const leakReport = memoryDetector.stopMonitoring();
      
      expect(leakReport.leaksDetected).toBe(false);
      expect(leakReport.memoryGrowthRate).toBeLessThan(0.1); // 10% growth max
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const invalidInputs = [
        { teams: null, constraints: {} },
        { teams: [], constraints: null },
        { teams: 'invalid', constraints: 'invalid' },
        { sport: 'nonexistent', teams: [], constraints: {} }
      ];
      
      for (const input of invalidInputs) {
        await expect(engine.generateSchedule(input)).rejects.toThrow();
      }
    });

    test('should recover from constraint conflicts', async () => {
      const conflictingConstraints = mockData.generateConflictingConstraints('basketball', 16);
      const teams = mockData.generateTeams('basketball', 16);
      
      const result = await engine.generateSchedule({
        sport: 'basketball',
        teams,
        constraints: conflictingConstraints,
        allowPartialSolutions: true
      });
      
      expect(result.partialSolution).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.resolutionSuggestions).toBeDefined();
    });
  });

  describe('Integration Points', () => {
    test('should integrate with external APIs', async () => {
      const mockExternalData = {
        weatherData: mockData.generateWeatherConstraints(),
        venueAvailability: mockData.generateVenueAvailability(),
        travelCosts: mockData.generateTravelCosts()
      };
      
      const result = await engine.generateScheduleWithExternalData({
        sport: 'football',
        teams: mockData.generateTeams('football', 16),
        constraints: mockData.generateConstraints('football', 16),
        externalData: mockExternalData
      });
      
      expect(result.externalDataIntegrated).toBe(true);
      expect(result.weatherOptimized).toBe(true);
      expect(result.costOptimized).toBe(true);
    });
  });
});

/**
 * Performance Test Suite
 */
describe('FTBuilderEngine Performance Tests', () => {
  let engine;
  let performanceReporter;
  
  beforeAll(async () => {
    engine = new FTBuilderEngine({
      performanceMode: true,
      cacheSize: 1000,
      parallelProcessing: true
    });
    
    performanceReporter = new PerformanceReporter();
    await engine.initialize();
  });
  
  test('should handle stress testing', async () => {
    const stressTestConfig = {
      concurrentUsers: 10,
      requestsPerUser: 20,
      duration: 60000 // 1 minute
    };
    
    const stressResults = await performanceReporter.runStressTest(
      engine,
      stressTestConfig
    );
    
    expect(stressResults.averageResponseTime).toBeLessThan(2000);
    expect(stressResults.errorRate).toBeLessThan(0.01); // Less than 1% errors
    expect(stressResults.throughput).toBeGreaterThan(5); // 5 requests/second min
  });
  
  test('should handle load testing', async () => {
    const loadTestConfig = {
      users: 50,
      rampUpTime: 30000, // 30 seconds
      sustainedLoad: 120000 // 2 minutes
    };
    
    const loadResults = await performanceReporter.runLoadTest(
      engine,
      loadTestConfig
    );
    
    expect(loadResults.averageResponseTime).toBeLessThan(3000);
    expect(loadResults.p95ResponseTime).toBeLessThan(5000);
    expect(loadResults.resourceUtilization.cpu).toBeLessThan(80);
    expect(loadResults.resourceUtilization.memory).toBeLessThan(512 * 1024 * 1024);
  });
});
