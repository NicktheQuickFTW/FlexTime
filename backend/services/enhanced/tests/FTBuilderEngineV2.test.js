/**
 * Comprehensive Test Suite for FT Builder Engine v2.0
 * 
 * Tests cover:
 * - Performance benchmarks (<100ms response times)
 * - Memory usage validation (<500MB)
 * - Multi-threading functionality
 * - Caching effectiveness
 * - ML integration
 * - Collaboration features
 * - Error handling and recovery
 */

const FTBuilderEngineV2 = require('../FT_Builder_Engine_v2');
const { performance } = require('perf_hooks');

describe('FT Builder Engine v2.0', () => {
  let engine;
  const testConfig = {
    maxWorkerThreads: 4,
    cacheSize: 1000,
    cacheTTL: 60000,
    memoryLimit: 100 * 1024 * 1024, // 100MB for testing
    useMultiThreading: true,
    useAdvancedCaching: true,
    useMLWeighting: true,
    useRealTimeMonitoring: true,
    useAutoScaling: false // Disabled for tests
  };

  beforeAll(async () => {
    engine = new FTBuilderEngineV2(testConfig);
    await engine.initialize();
  });

  afterAll(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully with all components', () => {
      expect(engine.isInitialized).toBe(true);
      expect(engine.workerPool).toBeDefined();
      expect(engine.cache).toBeDefined();
      expect(engine.memoryManager).toBeDefined();
    });

    test('should emit initialized event', (done) => {
      const testEngine = new FTBuilderEngineV2(testConfig);
      testEngine.on('initialized', () => {
        testEngine.shutdown();
        done();
      });
      testEngine.initialize();
    });
  });

  describe('Performance Requirements', () => {
    test('should handle constraint evaluation under 100ms', async () => {
      const testSchedule = createTestSchedule(100); // 100 games
      const testConstraints = createTestConstraints();
      const gameMove = {
        gameId: 'game_1',
        newDate: '2024-09-15',
        newVenue: 'venue_alt'
      };

      const startTime = performance.now();
      const result = await engine.evaluateConstraints(gameMove, testSchedule, testConstraints);
      const responseTime = performance.now() - startTime;

      expect(responseTime).toBeLessThan(100); // <100ms requirement
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('responseTime');
      expect(result.responseTime).toBeLessThan(100);
    });

    test('should handle large schedules (10,000+ games)', async () => {
      const largeSchedule = createTestSchedule(10000);
      const constraints = createTestConstraints();

      const startTime = performance.now();
      const result = await engine.optimizeSchedule(largeSchedule, constraints, {
        maxIterations: 100 // Reduced for testing
      });
      const responseTime = performance.now() - startTime;

      expect(result).toHaveProperty('optimizedSchedule');
      expect(result.optimizedSchedule.games).toHaveLength(10000);
      expect(responseTime).toBeLessThan(30000); // 30 seconds max for large optimization
    });

    test('should maintain memory usage under limit', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple schedules to test memory management
      for (let i = 0; i < 10; i++) {
        const schedule = createTestSchedule(1000);
        const constraints = createTestConstraints();
        await engine.evaluateConstraints(
          { gameId: `game_${i}`, newDate: '2024-09-15' },
          schedule,
          constraints
        );
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(testConfig.memoryLimit * 0.5); // Should not use more than 50% of limit
    });
  });

  describe('Multi-threading', () => {
    test('should utilize worker pool for optimization', async () => {
      const schedule = createTestSchedule(500);
      const constraints = createTestConstraints();

      const result = await engine.optimizeSchedule(schedule, constraints);
      
      expect(result).toHaveProperty('optimizedSchedule');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('iterations');
      
      // Verify worker pool was used
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.workerPool).toBeDefined();
      expect(metrics.workerPool.totalProcessed).toBeGreaterThan(0);
    });

    test('should handle worker pool failures gracefully', async () => {
      // Simulate worker failure by shutting down worker pool
      if (engine.workerPool) {
        await engine.workerPool.shutdown();
        engine.workerPool = null;
      }

      const schedule = createTestSchedule(50);
      const constraints = createTestConstraints();

      // Should fallback to local execution
      const result = await engine.optimizeSchedule(schedule, constraints);
      expect(result).toHaveProperty('optimizedSchedule');
    });
  });

  describe('Caching System', () => {
    test('should cache optimization results', async () => {
      const schedule = createTestSchedule(100);
      const constraints = createTestConstraints();

      // First call - should cache the result
      const startTime1 = performance.now();
      const result1 = await engine.optimizeSchedule(schedule, constraints);
      const time1 = performance.now() - startTime1;

      // Second call - should use cache
      const startTime2 = performance.now();
      const result2 = await engine.optimizeSchedule(schedule, constraints);
      const time2 = performance.now() - startTime2;

      expect(time2).toBeLessThan(time1); // Cache should be faster
      expect(result1.score).toBe(result2.score);
    });

    test('should provide cache statistics', () => {
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.cacheStats).toBeDefined();
      expect(metrics.cacheStats).toHaveProperty('hits');
      expect(metrics.cacheStats).toHaveProperty('misses');
      expect(metrics.cacheStats).toHaveProperty('hitRate');
    });
  });

  describe('Constraint Evaluation', () => {
    test('should evaluate date conflicts correctly', async () => {
      const schedule = createTestSchedule(50);
      const gameMove = {
        gameId: 'game_1',
        newDate: '2024-09-01' // Same date as another game
      };
      const constraints = [
        { type: 'DateConflict', weight: 1.0 }
      ];

      const result = await engine.evaluateConstraints(gameMove, schedule, constraints);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('violations');
      expect(result.violations).toBeInstanceOf(Array);
    });

    test('should handle ML-enhanced constraint weighting', async () => {
      const schedule = createTestSchedule(100);
      const constraints = [
        { type: 'TravelDistance', weight: 0.8 },
        { type: 'RestDays', weight: 0.9 },
        { type: 'VenueConflict', weight: 1.0 }
      ];
      const gameMove = {
        gameId: 'game_1',
        newDate: '2024-09-15'
      };

      const result = await engine.evaluateConstraints(gameMove, schedule, constraints);
      
      expect(result).toHaveProperty('score');
      expect(typeof result.score).toBe('number');
    });
  });

  describe('Conflict Resolution', () => {
    test('should resolve date conflicts', async () => {
      const schedule = createTestSchedule(100);
      const conflicts = [
        {
          type: 'date_conflict',
          severity: 'high',
          gameId: 'game_1',
          conflictingDates: ['2024-09-01', '2024-09-02']
        }
      ];

      const result = await engine.resolveConflicts(conflicts, schedule);
      
      expect(result).toHaveProperty('resolvedConflicts');
      expect(result).toHaveProperty('totalConflicts');
      expect(result.totalConflicts).toBe(1);
    });

    test('should prioritize conflicts by severity', async () => {
      const schedule = createTestSchedule(100);
      const conflicts = [
        { type: 'date_conflict', severity: 'low', gameId: 'game_1' },
        { type: 'venue_conflict', severity: 'critical', gameId: 'game_2' },
        { type: 'travel_conflict', severity: 'medium', gameId: 'game_3' }
      ];

      const result = await engine.resolveConflicts(conflicts, schedule);
      
      expect(result.resolutions).toHaveLength(3);
      // Critical conflict should be resolved first
      expect(result.resolutions[0].conflict.severity).toBe('critical');
    });
  });

  describe('Performance Monitoring', () => {
    test('should provide real-time metrics', () => {
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('activeTasks');
      expect(metrics.memory).toHaveProperty('percentage');
    });

    test('should emit performance warnings', (done) => {
      engine.once('memoryWarning', (memoryInfo) => {
        expect(memoryInfo).toHaveProperty('percentage');
        done();
      });

      // Simulate high memory usage
      engine.performanceMetrics.memory = {
        percentage: 90 // Above threshold
      };
      engine._startPerformanceMonitoring();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid schedule data gracefully', async () => {
      const invalidSchedule = { games: null };
      const constraints = createTestConstraints();

      await expect(engine.optimizeSchedule(invalidSchedule, constraints))
        .rejects.toThrow();
    });

    test('should handle constraint evaluation errors', async () => {
      const schedule = createTestSchedule(50);
      const invalidGameMove = {
        gameId: 'nonexistent_game',
        newDate: 'invalid_date'
      };
      const constraints = createTestConstraints();

      const result = await engine.evaluateConstraints(invalidGameMove, schedule, constraints);
      
      expect(result).toHaveProperty('isValid');
      expect(result.isValid).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('Collaboration Features', () => {
    test('should handle collaborative edits', async () => {
      if (!engine.config.enableCollaboration) {
        engine.config.enableCollaboration = true;
        await engine._initializeCollaboration();
      }

      const schedule = createTestSchedule(50);
      const edit = {
        type: 'game_move',
        gameId: 'game_1',
        newDate: '2024-09-15'
      };
      const userId = 'test_user_1';

      // This should work or throw a specific error
      try {
        const result = await engine.handleCollaborativeEdit(edit, userId, schedule);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('Collaboration');
      }
    });
  });

  describe('Memory Management', () => {
    test('should use object pooling effectively', async () => {
      const schedule = createTestSchedule(100);
      const constraints = createTestConstraints();
      const gameMove = { gameId: 'game_1', newDate: '2024-09-15' };

      // Make multiple calls to test object pooling
      for (let i = 0; i < 10; i++) {
        await engine.evaluateConstraints(gameMove, schedule, constraints);
      }

      // Check that object pools have items
      const evaluationPool = engine.objectPools.evaluationResults;
      expect(evaluationPool).toBeInstanceOf(Array);
    });
  });

  describe('Stress Testing', () => {
    test('should handle concurrent operations', async () => {
      const schedule = createTestSchedule(200);
      const constraints = createTestConstraints();

      const concurrentOperations = [];
      for (let i = 0; i < 20; i++) {
        const gameMove = {
          gameId: `game_${i % 50}`,
          newDate: `2024-09-${15 + (i % 15)}`
        };
        concurrentOperations.push(
          engine.evaluateConstraints(gameMove, schedule, constraints)
        );
      }

      const results = await Promise.allSettled(concurrentOperations);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThanOrEqual(15); // At least 75% success rate
    });

    test('should maintain responsiveness under load', async () => {
      const schedule = createTestSchedule(1000);
      const constraints = createTestConstraints();
      const responseTimes = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const gameMove = {
          gameId: `game_${i}`,
          newDate: '2024-09-15'
        };
        
        await engine.evaluateConstraints(gameMove, schedule, constraints);
        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(averageResponseTime).toBeLessThan(100); // Average should be under 100ms
    });
  });
});

// Helper Functions

function createTestSchedule(gameCount) {
  const teams = [
    'arizona', 'arizona-state', 'baylor', 'byu', 'cincinnati', 'colorado',
    'houston', 'iowa-state', 'kansas', 'kansas-state', 'oklahoma-state',
    'tcu', 'texas-tech', 'ucf', 'utah', 'west-virginia'
  ];

  const games = [];
  const startDate = new Date('2024-09-01');

  for (let i = 0; i < gameCount; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i / 8)); // ~8 games per day

    const homeTeam = teams[i % teams.length];
    const awayTeam = teams[(i + 1) % teams.length];

    games.push({
      id: `game_${i}`,
      homeTeam,
      awayTeam,
      date: date.toISOString().split('T')[0],
      venue: `venue_${homeTeam}`,
      sport: 'football',
      season: '2024'
    });
  }

  return {
    id: 'test_schedule',
    sportType: 'football',
    season: '2024',
    conferenceId: 'big12',
    games,
    teams: teams.map(id => ({ id, name: id }))
  };
}

function createTestConstraints() {
  return [
    {
      type: 'DateConflict',
      weight: 1.0,
      parameters: {}
    },
    {
      type: 'VenueConflict',
      weight: 0.9,
      parameters: {}
    },
    {
      type: 'TravelDistance',
      weight: 0.8,
      parameters: { maxDistance: 1000 }
    },
    {
      type: 'RestDays',
      weight: 0.8,
      parameters: { minDays: 1 }
    },
    {
      type: 'HomeAwayBalance',
      weight: 0.7,
      parameters: {}
    }
  ];
}