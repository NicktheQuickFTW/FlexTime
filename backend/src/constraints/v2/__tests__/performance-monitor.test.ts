import { PerformanceMonitor } from '../engines/PerformanceMonitor';
import { UnifiedConstraint, ScheduleSlot, ConstraintResult } from '../types';

jest.useFakeTimers();

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockConstraint: UnifiedConstraint;
  let mockSlot: ScheduleSlot;
  let mockResult: ConstraintResult;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor();
    
    mockConstraint = {
      id: 'test-constraint',
      type: 'venue',
      sport: 'football',
      name: 'Test Constraint',
      version: '1.0.0',
      priority: 'required',
      evaluate: jest.fn(),
      metadata: {
        author: 'system',
        tags: ['test'],
        description: 'Test constraint',
        created: new Date(),
        updated: new Date()
      }
    };

    mockSlot = {
      id: 'slot-1',
      date: new Date('2025-01-15'),
      time: '14:00',
      duration: 180,
      venue: 'Stadium A',
      sport: 'football',
      gameId: 'game-1',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      conference: 'Big 12',
      tvInfo: {
        network: 'ESPN',
        startTime: '14:00',
        duration: 180
      },
      requiredResources: ['Field', 'Lights'],
      constraints: []
    };

    mockResult = {
      valid: true,
      score: 0.95,
      violations: [],
      suggestions: ['Consider alternate time']
    };
  });

  describe('Evaluation Tracking', () => {
    test('should track single evaluation', () => {
      const startTime = Date.now();
      monitor.startEvaluation(mockConstraint.id);
      
      jest.advanceTimersByTime(50);
      
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      const stats = monitor.getConstraintStats(mockConstraint.id);
      expect(stats).toMatchObject({
        constraintId: 'test-constraint',
        evaluationCount: 1,
        averageTime: 50,
        minTime: 50,
        maxTime: 50,
        successRate: 1.0,
        averageScore: 0.95
      });
    });

    test('should track multiple evaluations', () => {
      // First evaluation - success
      monitor.startEvaluation(mockConstraint.id);
      jest.advanceTimersByTime(30);
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      // Second evaluation - failure
      monitor.startEvaluation(mockConstraint.id);
      jest.advanceTimersByTime(70);
      monitor.endEvaluation(mockConstraint.id, {
        ...mockResult,
        valid: false,
        score: 0.3,
        violations: ['Time conflict']
      });
      
      // Third evaluation - success
      monitor.startEvaluation(mockConstraint.id);
      jest.advanceTimersByTime(50);
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      const stats = monitor.getConstraintStats(mockConstraint.id);
      expect(stats).toMatchObject({
        evaluationCount: 3,
        averageTime: 50, // (30 + 70 + 50) / 3
        minTime: 30,
        maxTime: 70,
        successRate: 2/3,
        averageScore: (0.95 + 0.3 + 0.95) / 3
      });
    });

    test('should handle concurrent evaluations', () => {
      const constraint1 = { ...mockConstraint, id: 'c1' };
      const constraint2 = { ...mockConstraint, id: 'c2' };
      
      monitor.startEvaluation(constraint1.id);
      jest.advanceTimersByTime(20);
      
      monitor.startEvaluation(constraint2.id);
      jest.advanceTimersByTime(30);
      
      monitor.endEvaluation(constraint1.id, mockResult); // 50ms total
      jest.advanceTimersByTime(20);
      
      monitor.endEvaluation(constraint2.id, mockResult); // 50ms total
      
      expect(monitor.getConstraintStats(constraint1.id).averageTime).toBe(50);
      expect(monitor.getConstraintStats(constraint2.id).averageTime).toBe(50);
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate overall performance metrics', () => {
      // Multiple constraints with different performance
      const constraints = [
        { ...mockConstraint, id: 'fast-constraint' },
        { ...mockConstraint, id: 'slow-constraint' },
        { ...mockConstraint, id: 'medium-constraint' }
      ];
      
      // Fast constraint
      monitor.startEvaluation(constraints[0].id);
      jest.advanceTimersByTime(10);
      monitor.endEvaluation(constraints[0].id, mockResult);
      
      // Slow constraint
      monitor.startEvaluation(constraints[1].id);
      jest.advanceTimersByTime(100);
      monitor.endEvaluation(constraints[1].id, { ...mockResult, valid: false });
      
      // Medium constraint
      monitor.startEvaluation(constraints[2].id);
      jest.advanceTimersByTime(50);
      monitor.endEvaluation(constraints[2].id, mockResult);
      
      const overall = monitor.getOverallMetrics();
      expect(overall).toMatchObject({
        totalEvaluations: 3,
        averageEvaluationTime: (10 + 100 + 50) / 3,
        totalSuccessRate: 2/3,
        constraintCount: 3
      });
    });

    test('should identify slow constraints', () => {
      const constraints = [
        { ...mockConstraint, id: 'fast-1' },
        { ...mockConstraint, id: 'slow-1' },
        { ...mockConstraint, id: 'slow-2' },
        { ...mockConstraint, id: 'fast-2' }
      ];
      
      // Fast constraints
      monitor.startEvaluation(constraints[0].id);
      jest.advanceTimersByTime(20);
      monitor.endEvaluation(constraints[0].id, mockResult);
      
      monitor.startEvaluation(constraints[3].id);
      jest.advanceTimersByTime(30);
      monitor.endEvaluation(constraints[3].id, mockResult);
      
      // Slow constraints
      monitor.startEvaluation(constraints[1].id);
      jest.advanceTimersByTime(200);
      monitor.endEvaluation(constraints[1].id, mockResult);
      
      monitor.startEvaluation(constraints[2].id);
      jest.advanceTimersByTime(150);
      monitor.endEvaluation(constraints[2].id, mockResult);
      
      const slowConstraints = monitor.getSlowConstraints(100);
      expect(slowConstraints).toHaveLength(2);
      expect(slowConstraints.map(s => s.constraintId)).toContain('slow-1');
      expect(slowConstraints.map(s => s.constraintId)).toContain('slow-2');
    });
  });

  describe('Memory Tracking', () => {
    test('should track memory usage', () => {
      const initialMemory = monitor.getMemoryUsage();
      
      // Simulate evaluations that increase memory
      for (let i = 0; i < 100; i++) {
        monitor.startEvaluation(`constraint-${i}`);
        jest.advanceTimersByTime(10);
        monitor.endEvaluation(`constraint-${i}`, mockResult);
      }
      
      const finalMemory = monitor.getMemoryUsage();
      expect(finalMemory.heapUsed).toBeGreaterThan(0);
      expect(finalMemory.heapTotal).toBeGreaterThan(0);
    });

    test('should detect memory leaks', () => {
      // Baseline
      monitor.startMemoryMonitoring();
      
      // Normal operation
      for (let i = 0; i < 10; i++) {
        monitor.startEvaluation('constraint-1');
        jest.advanceTimersByTime(10);
        monitor.endEvaluation('constraint-1', mockResult);
      }
      
      const analysis1 = monitor.analyzeMemoryTrend();
      expect(analysis1.isLeaking).toBe(false);
      
      // Simulate leak by not ending evaluations
      for (let i = 0; i < 100; i++) {
        monitor.startEvaluation(`leak-${i}`);
        jest.advanceTimersByTime(10);
        // Don't end evaluation - simulates leak
      }
      
      const analysis2 = monitor.analyzeMemoryTrend();
      expect(analysis2.suspectedLeaks).toHaveLength(100);
    });
  });

  describe('Bottleneck Detection', () => {
    test('should identify performance bottlenecks', () => {
      // Create evaluation pattern
      const evaluations = [
        { id: 'c1', time: 50, dependencies: [] },
        { id: 'c2', time: 200, dependencies: ['c1'] }, // Bottleneck
        { id: 'c3', time: 30, dependencies: ['c2'] },
        { id: 'c4', time: 40, dependencies: ['c2'] },
        { id: 'c5', time: 25, dependencies: ['c3', 'c4'] }
      ];
      
      evaluations.forEach(eval => {
        monitor.startEvaluation(eval.id);
        jest.advanceTimersByTime(eval.time);
        monitor.endEvaluation(eval.id, mockResult);
        monitor.recordDependencies(eval.id, eval.dependencies);
      });
      
      const bottlenecks = monitor.identifyBottlenecks();
      expect(bottlenecks).toHaveLength(1);
      expect(bottlenecks[0]).toMatchObject({
        constraintId: 'c2',
        impact: 'high',
        averageTime: 200,
        dependentCount: 3 // c3, c4, and c5 depend on it
      });
    });

    test('should calculate critical path', () => {
      const evaluations = [
        { id: 'c1', time: 50, dependencies: [] },
        { id: 'c2', time: 30, dependencies: [] },
        { id: 'c3', time: 100, dependencies: ['c1'] },
        { id: 'c4', time: 40, dependencies: ['c2'] },
        { id: 'c5', time: 60, dependencies: ['c3', 'c4'] }
      ];
      
      evaluations.forEach(eval => {
        monitor.startEvaluation(eval.id);
        jest.advanceTimersByTime(eval.time);
        monitor.endEvaluation(eval.id, mockResult);
        monitor.recordDependencies(eval.id, eval.dependencies);
      });
      
      const criticalPath = monitor.getCriticalPath();
      expect(criticalPath.path).toEqual(['c1', 'c3', 'c5']);
      expect(criticalPath.totalTime).toBe(210); // 50 + 100 + 60
    });
  });

  describe('Real-time Monitoring', () => {
    test('should provide real-time stats', () => {
      monitor.startEvaluation(mockConstraint.id);
      
      const liveStats = monitor.getLiveStats();
      expect(liveStats.activeEvaluations).toBe(1);
      expect(liveStats.evaluationsInProgress).toContain('test-constraint');
      
      jest.advanceTimersByTime(50);
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      const updatedStats = monitor.getLiveStats();
      expect(updatedStats.activeEvaluations).toBe(0);
      expect(updatedStats.evaluationsInProgress).toHaveLength(0);
    });

    test('should track evaluation rate', () => {
      const startTime = Date.now();
      
      // Perform evaluations over time
      for (let i = 0; i < 60; i++) {
        monitor.startEvaluation(`constraint-${i}`);
        jest.advanceTimersByTime(1000); // 1 second
        monitor.endEvaluation(`constraint-${i}`, mockResult);
      }
      
      const rate = monitor.getEvaluationRate();
      expect(rate.evaluationsPerSecond).toBeCloseTo(1, 1);
      expect(rate.evaluationsPerMinute).toBe(60);
    });
  });

  describe('Reporting', () => {
    test('should generate performance report', () => {
      // Generate diverse performance data
      const constraints = [
        { id: 'fast', times: [10, 15, 12] },
        { id: 'medium', times: [50, 55, 45] },
        { id: 'slow', times: [100, 120, 110] },
        { id: 'unreliable', times: [20, 200, 30] }
      ];
      
      constraints.forEach(c => {
        c.times.forEach((time, index) => {
          monitor.startEvaluation(c.id);
          jest.advanceTimersByTime(time);
          monitor.endEvaluation(c.id, {
            ...mockResult,
            valid: c.id !== 'unreliable' || index !== 1
          });
        });
      });
      
      const report = monitor.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('constraintDetails');
      expect(report).toHaveProperty('recommendations');
      expect(report.constraintDetails).toHaveLength(4);
      expect(report.recommendations).toContain(
        expect.stringContaining('slow')
      );
    });

    test('should export metrics', () => {
      monitor.startEvaluation(mockConstraint.id);
      jest.advanceTimersByTime(50);
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      const exported = monitor.exportMetrics();
      
      expect(exported).toHaveProperty('timestamp');
      expect(exported).toHaveProperty('constraints');
      expect(exported).toHaveProperty('overall');
      expect(exported).toHaveProperty('version');
    });
  });

  describe('Alerting', () => {
    test('should trigger alerts for slow constraints', () => {
      const alertCallback = jest.fn();
      monitor.onAlert(alertCallback);
      
      monitor.setThreshold('evaluationTime', 100);
      
      monitor.startEvaluation(mockConstraint.id);
      jest.advanceTimersByTime(150);
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'slow-constraint',
          constraintId: 'test-constraint',
          threshold: 100,
          actual: 150
        })
      );
    });

    test('should trigger alerts for low success rate', () => {
      const alertCallback = jest.fn();
      monitor.onAlert(alertCallback);
      
      monitor.setThreshold('successRate', 0.8);
      
      // 3 failures, 1 success = 25% success rate
      for (let i = 0; i < 4; i++) {
        monitor.startEvaluation(mockConstraint.id);
        jest.advanceTimersByTime(30);
        monitor.endEvaluation(mockConstraint.id, {
          ...mockResult,
          valid: i === 3
        });
      }
      
      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'low-success-rate',
          constraintId: 'test-constraint',
          threshold: 0.8,
          actual: 0.25
        })
      );
    });
  });

  describe('Cleanup', () => {
    test('should clean up old data', () => {
      // Add old evaluations
      for (let i = 0; i < 100; i++) {
        monitor.startEvaluation(`old-${i}`);
        jest.advanceTimersByTime(10);
        monitor.endEvaluation(`old-${i}`, mockResult);
      }
      
      const beforeCleanup = monitor.getOverallMetrics();
      expect(beforeCleanup.totalEvaluations).toBe(100);
      
      // Advance time significantly
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
      
      monitor.cleanup(24 * 60 * 60 * 1000); // Clean up data older than 24 hours
      
      const afterCleanup = monitor.getOverallMetrics();
      expect(afterCleanup.totalEvaluations).toBe(0);
    });

    test('should reset all metrics', () => {
      // Add some data
      monitor.startEvaluation(mockConstraint.id);
      jest.advanceTimersByTime(50);
      monitor.endEvaluation(mockConstraint.id, mockResult);
      
      monitor.reset();
      
      const metrics = monitor.getOverallMetrics();
      expect(metrics.totalEvaluations).toBe(0);
      expect(metrics.constraintCount).toBe(0);
    });
  });
});