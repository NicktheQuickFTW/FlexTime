import { OptimizedConstraintEngine, EngineConfiguration, EvaluationContext, createOptimizedEngine } from '../engines/OptimizedConstraintEngine';
import { UnifiedConstraint, ConstraintResult, ConstraintHardness, ConstraintStatus, ConstraintType } from '../types';
import { Schedule, Game } from '../types/schedule-types';
import { ConstraintCache } from '../engines/ConstraintCache';
import { ConstraintPipeline } from '../engines/ConstraintPipeline';
import { ParallelEvaluator } from '../engines/ParallelEvaluator';
import { DependencyAnalyzer } from '../engines/DependencyAnalyzer';
import { PerformanceMonitor } from '../engines/PerformanceMonitor';

// Mock dependencies
jest.mock('../engines/ConstraintCache');
jest.mock('../engines/ConstraintPipeline');
jest.mock('../engines/ParallelEvaluator');
jest.mock('../engines/DependencyAnalyzer');
jest.mock('../engines/PerformanceMonitor');

describe('OptimizedConstraintEngine', () => {
  let engine: OptimizedConstraintEngine;
  let mockCache: jest.Mocked<ConstraintCache>;
  let mockPipeline: jest.Mocked<ConstraintPipeline>;
  let mockParallelEvaluator: jest.Mocked<ParallelEvaluator>;
  let mockDependencyAnalyzer: jest.Mocked<DependencyAnalyzer>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;

  // Test fixtures
  const mockSchedule: Schedule = {
    id: 'test-schedule',
    games: [
      {
        id: 'game1',
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        date: new Date('2025-01-15'),
        time: '19:00',
        venueId: 'venue1',
        sport: 'basketball'
      },
      {
        id: 'game2',
        homeTeamId: 'team3',
        awayTeamId: 'team4',
        date: new Date('2025-01-16'),
        time: '19:00',
        venueId: 'venue2',
        sport: 'basketball'
      }
    ] as Game[],
    teams: [],
    venues: [],
    constraints: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0'
    }
  };

  const mockConstraints: UnifiedConstraint[] = [
    {
      id: 'constraint1',
      name: 'No Back-to-Back Games',
      type: ConstraintType.TEMPORAL,
      hardness: ConstraintHardness.HARD,
      weight: 100,
      scope: { teams: ['team1', 'team2'] },
      parameters: { minDaysBetween: 1 },
      evaluation: jest.fn().mockResolvedValue({
        constraintId: 'constraint1',
        status: ConstraintStatus.SATISFIED,
        score: 1.0,
        violations: [],
        suggestions: []
      })
    },
    {
      id: 'constraint2',
      name: 'Venue Availability',
      type: ConstraintType.SPATIAL,
      hardness: ConstraintHardness.SOFT,
      weight: 80,
      scope: { venues: ['venue1'] },
      parameters: {},
      evaluation: jest.fn().mockResolvedValue({
        constraintId: 'constraint2',
        status: ConstraintStatus.SATISFIED,
        score: 0.9,
        violations: [],
        suggestions: []
      })
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockCache = new ConstraintCache({}) as jest.Mocked<ConstraintCache>;
    mockCache.has = jest.fn().mockReturnValue(false);
    mockCache.get = jest.fn();
    mockCache.set = jest.fn();
    mockCache.getHitRate = jest.fn().mockReturnValue(0.75);
    mockCache.getStats = jest.fn().mockReturnValue({
      hits: 75,
      misses: 25,
      size: 100,
      hitRate: 0.75
    });

    mockPipeline = new ConstraintPipeline() as jest.Mocked<ConstraintPipeline>;
    mockPipeline.execute = jest.fn().mockResolvedValue({
      results: new Map([
        ['constraint1', {
          constraintId: 'constraint1',
          status: ConstraintStatus.SATISFIED,
          score: 1.0,
          violations: [],
          suggestions: []
        }],
        ['constraint2', {
          constraintId: 'constraint2',
          status: ConstraintStatus.SATISFIED,
          score: 0.9,
          violations: [],
          suggestions: []
        }]
      ])
    });

    mockParallelEvaluator = new ParallelEvaluator({}) as jest.Mocked<ParallelEvaluator>;
    mockParallelEvaluator.shutdown = jest.fn().mockResolvedValue(undefined);

    mockDependencyAnalyzer = new DependencyAnalyzer() as jest.Mocked<DependencyAnalyzer>;
    mockDependencyAnalyzer.analyze = jest.fn().mockReturnValue(new Map());

    mockPerformanceMonitor = new PerformanceMonitor() as jest.Mocked<PerformanceMonitor>;
    mockPerformanceMonitor.startEvaluation = jest.fn();
    mockPerformanceMonitor.endEvaluation = jest.fn();
    mockPerformanceMonitor.recordError = jest.fn();
    mockPerformanceMonitor.getStats = jest.fn().mockReturnValue({
      totalEvaluations: 10,
      averageTime: 150,
      errorRate: 0.05
    });
    mockPerformanceMonitor.reset = jest.fn();

    // Create engine with default config
    engine = new OptimizedConstraintEngine();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Engine Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new OptimizedConstraintEngine();
      expect(defaultEngine).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<EngineConfiguration> = {
        enableCaching: false,
        enableParallelization: false,
        maxWorkers: 8,
        groupingStrategy: 'dependency'
      };
      const customEngine = new OptimizedConstraintEngine(customConfig);
      expect(customEngine).toBeDefined();
    });

    it('should create engine with performance profile', () => {
      const perfEngine = createOptimizedEngine('performance');
      expect(perfEngine).toBeDefined();
    });

    it('should create engine with balanced profile', () => {
      const balancedEngine = createOptimizedEngine('balanced');
      expect(balancedEngine).toBeDefined();
    });

    it('should create engine with accuracy profile', () => {
      const accuracyEngine = createOptimizedEngine('accuracy');
      expect(accuracyEngine).toBeDefined();
    });
  });

  describe('Constraint Evaluation', () => {
    it('should evaluate constraints successfully', async () => {
      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints
      };

      const result = await engine.evaluate(context);

      expect(result).toBeDefined();
      expect(result.scheduleId).toBe(mockSchedule.id);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.hardConstraintsSatisfied).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should handle empty constraints', async () => {
      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: []
      };

      mockPipeline.execute = jest.fn().mockResolvedValue({
        results: new Map()
      });

      const result = await engine.evaluate(context);

      expect(result).toBeDefined();
      expect(result.results).toHaveLength(0);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should handle constraint violations', async () => {
      const violatedConstraint: UnifiedConstraint = {
        ...mockConstraints[0],
        id: 'violated-constraint',
        evaluation: jest.fn().mockResolvedValue({
          constraintId: 'violated-constraint',
          status: ConstraintStatus.VIOLATED,
          score: 0,
          violations: [{
            gameIds: ['game1'],
            message: 'Back-to-back games detected',
            severity: 'critical'
          }],
          suggestions: []
        })
      };

      mockPipeline.execute = jest.fn().mockResolvedValue({
        results: new Map([
          ['violated-constraint', {
            constraintId: 'violated-constraint',
            status: ConstraintStatus.VIOLATED,
            score: 0,
            violations: [{
              gameIds: ['game1'],
              message: 'Back-to-back games detected',
              severity: 'critical'
            }],
            suggestions: []
          }]
        ])
      });

      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: [violatedConstraint]
      };

      const result = await engine.evaluate(context);

      expect(result.hardConstraintsSatisfied).toBe(false);
      expect(result.overallScore).toBe(0);
    });

    it('should handle evaluation errors', async () => {
      mockPipeline.execute = jest.fn().mockRejectedValue(new Error('Evaluation failed'));

      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints
      };

      await expect(engine.evaluate(context)).rejects.toThrow('Evaluation failed');
      expect(mockPerformanceMonitor.recordError).toHaveBeenCalled();
    });
  });

  describe('Incremental Evaluation', () => {
    it('should perform incremental evaluation when entities are modified', async () => {
      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints,
        modifiedEntities: new Set(['team1', 'venue1'])
      };

      const result = await engine.evaluate(context);

      expect(result).toBeDefined();
      // Should evaluate constraints related to modified entities
      expect(mockPipeline.execute).toHaveBeenCalled();
    });

    it('should evaluate all constraints when no specific entities are modified', async () => {
      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints,
        modifiedEntities: new Set()
      };

      const result = await engine.evaluate(context);

      expect(result).toBeDefined();
      expect(mockPipeline.execute).toHaveBeenCalled();
    });
  });

  describe('Constraint Grouping', () => {
    it('should group constraints by type', () => {
      const engine = new OptimizedConstraintEngine({
        groupingStrategy: 'type'
      });

      // Test implementation would require exposing private methods
      // or testing through the evaluate method
    });

    it('should group constraints by hardness', () => {
      const engine = new OptimizedConstraintEngine({
        groupingStrategy: 'hardness'
      });

      // Test implementation
    });

    it('should group constraints by dependency', () => {
      const engine = new OptimizedConstraintEngine({
        groupingStrategy: 'dependency'
      });

      // Test implementation
    });

    it('should use smart grouping strategy', () => {
      const engine = new OptimizedConstraintEngine({
        groupingStrategy: 'smart'
      });

      // Test implementation
    });
  });

  describe('Cache Management', () => {
    it('should warm cache when requested', async () => {
      await engine.warmCache(mockSchedule, mockConstraints);

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should skip cache warming when caching is disabled', async () => {
      const noCacheEngine = new OptimizedConstraintEngine({
        enableCaching: false
      });

      await noCacheEngine.warmCache(mockSchedule, mockConstraints);

      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle cache warming errors gracefully', async () => {
      const errorConstraint: UnifiedConstraint = {
        ...mockConstraints[0],
        evaluation: jest.fn().mockRejectedValue(new Error('Evaluation error'))
      };

      // Should not throw
      await expect(
        engine.warmCache(mockSchedule, [errorConstraint])
      ).resolves.not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance when enabled', async () => {
      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints
      };

      await engine.evaluate(context);

      expect(mockPerformanceMonitor.startEvaluation).toHaveBeenCalled();
      expect(mockPerformanceMonitor.endEvaluation).toHaveBeenCalled();
    });

    it('should get performance statistics', () => {
      const stats = engine.getPerformanceStats();
      expect(stats).toBeDefined();
      expect(stats.totalEvaluations).toBe(10);
    });

    it('should get cache statistics', () => {
      const stats = engine.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.hitRate).toBe(0.75);
    });
  });

  describe('Engine Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      await engine.shutdown();

      expect(mockParallelEvaluator.shutdown).toHaveBeenCalled();
      expect(mockCache.clear).toHaveBeenCalled();
      expect(mockPerformanceMonitor.reset).toHaveBeenCalled();
    });
  });

  describe('Score Calculation', () => {
    it('should calculate correct scores for all satisfied constraints', async () => {
      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints
      };

      const result = await engine.evaluate(context);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.hardConstraintsSatisfied).toBe(true);
      expect(result.softConstraintsScore).toBeGreaterThan(0);
    });

    it('should return zero score when hard constraints are violated', async () => {
      mockPipeline.execute = jest.fn().mockResolvedValue({
        results: new Map([
          ['constraint1', {
            constraintId: 'constraint1',
            status: ConstraintStatus.VIOLATED,
            score: 0,
            violations: [{
              gameIds: ['game1'],
              message: 'Violation',
              severity: 'critical'
            }],
            suggestions: []
          }]
        ])
      });

      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: [mockConstraints[0]] // Hard constraint
      };

      const result = await engine.evaluate(context);

      expect(result.overallScore).toBe(0);
      expect(result.hardConstraintsSatisfied).toBe(false);
    });
  });

  describe('Suggestion Generation', () => {
    it('should generate and deduplicate suggestions', async () => {
      mockPipeline.execute = jest.fn().mockResolvedValue({
        results: new Map([
          ['constraint1', {
            constraintId: 'constraint1',
            status: ConstraintStatus.SATISFIED,
            score: 1.0,
            violations: [],
            suggestions: [{
              type: 'time_shift',
              priority: 'high',
              description: 'Consider moving game to avoid conflict',
              targetGameIds: ['game1']
            }]
          }],
          ['constraint2', {
            constraintId: 'constraint2',
            status: ConstraintStatus.SATISFIED,
            score: 0.9,
            violations: [],
            suggestions: [{
              type: 'time_shift',
              priority: 'high',
              description: 'Consider moving game to avoid conflict',
              targetGameIds: ['game1']
            }]
          }]
        ])
      });

      const context: EvaluationContext = {
        schedule: mockSchedule,
        constraints: mockConstraints
      };

      const result = await engine.evaluate(context);

      // Should deduplicate identical suggestions
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].priority).toBe('high');
    });
  });
});