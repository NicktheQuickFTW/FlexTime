import { ParallelEvaluator } from '../engines/ParallelEvaluator';
import { UnifiedConstraint, ScheduleSlot, ConstraintResult } from '../types';
import { Worker } from 'worker_threads';

jest.mock('worker_threads');

describe('ParallelEvaluator', () => {
  let evaluator: ParallelEvaluator;
  let mockConstraints: UnifiedConstraint[];
  let mockSlot: ScheduleSlot;
  let mockWorkers: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkers = [];
    
    // Mock Worker class
    (Worker as jest.MockedClass<typeof Worker>).mockImplementation((filename: any) => {
      const worker: any = {
        postMessage: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        terminate: jest.fn(),
        removeAllListeners: jest.fn()
      };
      mockWorkers.push(worker);
      return worker;
    });

    evaluator = new ParallelEvaluator({ maxWorkers: 2 });

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

    mockConstraints = [
      {
        id: 'c1',
        type: 'venue',
        sport: 'football',
        name: 'Constraint 1',
        version: '1.0.0',
        priority: 'required',
        evaluate: jest.fn().mockResolvedValue({
          valid: true,
          score: 1.0,
          violations: [],
          suggestions: []
        }),
        metadata: {
          author: 'system',
          tags: ['test'],
          description: 'Test constraint 1',
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'c2',
        type: 'team',
        sport: 'football',
        name: 'Constraint 2',
        version: '1.0.0',
        priority: 'high',
        evaluate: jest.fn().mockResolvedValue({
          valid: false,
          score: 0.5,
          violations: ['Team conflict'],
          suggestions: ['Reschedule']
        }),
        metadata: {
          author: 'system',
          tags: ['test'],
          description: 'Test constraint 2',
          created: new Date(),
          updated: new Date()
        }
      }
    ];
  });

  afterEach(async () => {
    await evaluator.shutdown();
  });

  describe('Worker Pool Management', () => {
    test('should initialize worker pool', async () => {
      await evaluator.initialize();
      expect(Worker).toHaveBeenCalledTimes(2); // maxWorkers = 2
    });

    test('should reuse workers for multiple evaluations', async () => {
      await evaluator.initialize();
      
      // Simulate worker responses
      mockWorkers.forEach((worker, index) => {
        const onMessage = worker.on.mock.calls.find((call: any) => call[0] === 'message');
        if (onMessage) {
          const handler = onMessage[1];
          setTimeout(() => {
            handler({
              id: `task-${index}`,
              result: {
                valid: true,
                score: 1.0,
                violations: [],
                suggestions: []
              }
            });
          }, 10);
        }
      });

      await evaluator.evaluateConstraints(mockConstraints.slice(0, 1), mockSlot);
      await evaluator.evaluateConstraints(mockConstraints.slice(1, 2), mockSlot);
      
      expect(Worker).toHaveBeenCalledTimes(2); // Should not create new workers
    });

    test('should handle worker errors', async () => {
      await evaluator.initialize();
      
      // Simulate worker error
      const worker = mockWorkers[0];
      const onError = worker.on.mock.calls.find((call: any) => call[0] === 'error');
      if (onError) {
        const handler = onError[1];
        handler(new Error('Worker crashed'));
      }

      // Worker should be replaced
      expect(Worker).toHaveBeenCalledTimes(3); // 2 initial + 1 replacement
    });

    test('should terminate all workers on shutdown', async () => {
      await evaluator.initialize();
      await evaluator.shutdown();
      
      mockWorkers.forEach(worker => {
        expect(worker.terminate).toHaveBeenCalled();
      });
    });
  });

  describe('Constraint Evaluation', () => {
    test('should evaluate constraints in parallel', async () => {
      await evaluator.initialize();
      
      let messageCount = 0;
      mockWorkers.forEach((worker) => {
        worker.postMessage.mockImplementation((message: any) => {
          messageCount++;
          // Simulate async response
          setTimeout(() => {
            const onMessage = worker.on.mock.calls.find((call: any) => call[0] === 'message');
            if (onMessage) {
              onMessage[1]({
                id: message.id,
                result: {
                  valid: messageCount === 1,
                  score: messageCount === 1 ? 1.0 : 0.5,
                  violations: messageCount === 1 ? [] : ['Violation'],
                  suggestions: []
                }
              });
            }
          }, 10);
        });
      });

      const results = await evaluator.evaluateConstraints(mockConstraints, mockSlot);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        constraintId: 'c1',
        result: { valid: true, score: 1.0 }
      });
      expect(results[1]).toMatchObject({
        constraintId: 'c2',
        result: { valid: false, score: 0.5 }
      });
    });

    test('should handle constraint evaluation errors', async () => {
      await evaluator.initialize();
      
      mockWorkers[0].postMessage.mockImplementation((message: any) => {
        setTimeout(() => {
          const onMessage = mockWorkers[0].on.mock.calls.find(
            (call: any) => call[0] === 'message'
          );
          if (onMessage) {
            onMessage[1]({
              id: message.id,
              error: 'Constraint evaluation failed'
            });
          }
        }, 10);
      });

      const results = await evaluator.evaluateConstraints([mockConstraints[0]], mockSlot);
      
      expect(results[0]).toMatchObject({
        constraintId: 'c1',
        result: {
          valid: false,
          score: 0,
          violations: ['Evaluation error: Constraint evaluation failed']
        },
        error: 'Constraint evaluation failed'
      });
    });

    test('should timeout long-running evaluations', async () => {
      const slowEvaluator = new ParallelEvaluator({ 
        maxWorkers: 1, 
        taskTimeout: 100 
      });
      
      await slowEvaluator.initialize();
      
      // Don't send response to simulate timeout
      mockWorkers[mockWorkers.length - 1].postMessage.mockImplementation(() => {
        // Do nothing - let it timeout
      });

      const results = await slowEvaluator.evaluateConstraints(
        [mockConstraints[0]], 
        mockSlot
      );
      
      expect(results[0]).toMatchObject({
        constraintId: 'c1',
        result: {
          valid: false,
          score: 0,
          violations: expect.arrayContaining([expect.stringContaining('timeout')])
        },
        error: expect.stringContaining('timeout')
      });
      
      await slowEvaluator.shutdown();
    });
  });

  describe('Load Balancing', () => {
    test('should distribute tasks evenly across workers', async () => {
      await evaluator.initialize();
      
      const taskAssignments: { [workerId: number]: number } = {};
      
      mockWorkers.forEach((worker, index) => {
        taskAssignments[index] = 0;
        worker.postMessage.mockImplementation(() => {
          taskAssignments[index]++;
          // Immediate response to keep worker available
          const onMessage = worker.on.mock.calls.find(
            (call: any) => call[0] === 'message'
          );
          if (onMessage) {
            onMessage[1]({
              id: `task-${index}`,
              result: { valid: true, score: 1.0, violations: [], suggestions: [] }
            });
          }
        });
      });

      // Evaluate 4 constraints with 2 workers
      const manyConstraints = [
        ...mockConstraints,
        { ...mockConstraints[0], id: 'c3' },
        { ...mockConstraints[1], id: 'c4' }
      ];
      
      await evaluator.evaluateConstraints(manyConstraints, mockSlot);
      
      // Each worker should get 2 tasks
      expect(taskAssignments[0]).toBe(2);
      expect(taskAssignments[1]).toBe(2);
    });

    test('should queue tasks when all workers are busy', async () => {
      await evaluator.initialize();
      
      let pendingTasks = 0;
      const workerBusy = [true, true];
      
      mockWorkers.forEach((worker, index) => {
        worker.postMessage.mockImplementation((message: any) => {
          if (workerBusy[index]) {
            pendingTasks++;
            // Delay response to simulate busy worker
            setTimeout(() => {
              workerBusy[index] = false;
              const onMessage = worker.on.mock.calls.find(
                (call: any) => call[0] === 'message'
              );
              if (onMessage) {
                onMessage[1]({
                  id: message.id,
                  result: { valid: true, score: 1.0, violations: [], suggestions: [] }
                });
              }
            }, 50);
          } else {
            // Immediate response
            const onMessage = worker.on.mock.calls.find(
              (call: any) => call[0] === 'message'
            );
            if (onMessage) {
              onMessage[1]({
                id: message.id,
                result: { valid: true, score: 1.0, violations: [], suggestions: [] }
              });
            }
          }
        });
      });

      // Submit 3 constraints with 2 workers
      const threeConstraints = [
        ...mockConstraints,
        { ...mockConstraints[0], id: 'c3' }
      ];
      
      const results = await evaluator.evaluateConstraints(threeConstraints, mockSlot);
      
      expect(results).toHaveLength(3);
      expect(pendingTasks).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    test('should track evaluation metrics', async () => {
      await evaluator.initialize();
      
      // Setup mock responses
      mockWorkers.forEach((worker) => {
        worker.postMessage.mockImplementation((message: any) => {
          setTimeout(() => {
            const onMessage = worker.on.mock.calls.find(
              (call: any) => call[0] === 'message'
            );
            if (onMessage) {
              onMessage[1]({
                id: message.id,
                result: { valid: true, score: 1.0, violations: [], suggestions: [] },
                metrics: {
                  evaluationTime: 25,
                  memoryUsed: 1024 * 1024
                }
              });
            }
          }, 30);
        });
      });

      await evaluator.evaluateConstraints(mockConstraints, mockSlot);
      
      const metrics = evaluator.getMetrics();
      
      expect(metrics).toHaveProperty('totalEvaluations', 2);
      expect(metrics).toHaveProperty('averageEvaluationTime');
      expect(metrics).toHaveProperty('workerUtilization');
      expect(metrics.averageEvaluationTime).toBeGreaterThan(0);
    });

    test('should reset metrics', async () => {
      await evaluator.initialize();
      
      // Perform some evaluations
      mockWorkers.forEach((worker) => {
        worker.postMessage.mockImplementation((message: any) => {
          const onMessage = worker.on.mock.calls.find(
            (call: any) => call[0] === 'message'
          );
          if (onMessage) {
            onMessage[1]({
              id: message.id,
              result: { valid: true, score: 1.0, violations: [], suggestions: [] }
            });
          }
        });
      });

      await evaluator.evaluateConstraints(mockConstraints, mockSlot);
      evaluator.resetMetrics();
      
      const metrics = evaluator.getMetrics();
      expect(metrics.totalEvaluations).toBe(0);
      expect(metrics.averageEvaluationTime).toBe(0);
    });
  });

  describe('Batch Processing', () => {
    test('should process constraints in optimal batches', async () => {
      await evaluator.initialize();
      
      const batchSizes: number[] = [];
      
      mockWorkers.forEach((worker) => {
        worker.postMessage.mockImplementation((message: any) => {
          if (message.type === 'batch') {
            batchSizes.push(message.constraints.length);
          }
          const onMessage = worker.on.mock.calls.find(
            (call: any) => call[0] === 'message'
          );
          if (onMessage) {
            onMessage[1]({
              id: message.id,
              results: message.constraints.map((c: any) => ({
                constraintId: c.id,
                result: { valid: true, score: 1.0, violations: [], suggestions: [] }
              }))
            });
          }
        });
      });

      // Many constraints to trigger batching
      const manyConstraints = Array(10).fill(null).map((_, i) => ({
        ...mockConstraints[0],
        id: `c${i}`
      }));
      
      await evaluator.evaluateBatch(manyConstraints, mockSlot);
      
      // Should create reasonable batch sizes
      expect(batchSizes.length).toBeGreaterThan(0);
      expect(Math.max(...batchSizes)).toBeLessThanOrEqual(5); // Reasonable batch size
    });
  });

  describe('Worker Communication', () => {
    test('should serialize and deserialize constraint data', async () => {
      await evaluator.initialize();
      
      let sentMessage: any;
      mockWorkers[0].postMessage.mockImplementation((message: any) => {
        sentMessage = message;
        const onMessage = mockWorkers[0].on.mock.calls.find(
          (call: any) => call[0] === 'message'
        );
        if (onMessage) {
          onMessage[1]({
            id: message.id,
            result: { valid: true, score: 1.0, violations: [], suggestions: [] }
          });
        }
      });

      await evaluator.evaluateConstraints([mockConstraints[0]], mockSlot);
      
      expect(sentMessage).toMatchObject({
        type: 'evaluate',
        id: expect.any(String),
        constraint: expect.objectContaining({
          id: 'c1',
          type: 'venue',
          name: 'Constraint 1'
        }),
        slot: expect.objectContaining({
          id: 'slot-1',
          venue: 'Stadium A'
        })
      });
    });

    test('should handle worker restart gracefully', async () => {
      await evaluator.initialize();
      
      // Kill a worker
      const worker = mockWorkers[0];
      const onExit = worker.on.mock.calls.find((call: any) => call[0] === 'exit');
      if (onExit) {
        onExit[1](1); // Exit code 1
      }

      // Should create a replacement worker
      expect(Worker).toHaveBeenCalledTimes(3); // 2 initial + 1 replacement
      
      // New worker should be functional
      const newWorker = mockWorkers[mockWorkers.length - 1];
      newWorker.postMessage.mockImplementation((message: any) => {
        const onMessage = newWorker.on.mock.calls.find(
          (call: any) => call[0] === 'message'
        );
        if (onMessage) {
          onMessage[1]({
            id: message.id,
            result: { valid: true, score: 1.0, violations: [], suggestions: [] }
          });
        }
      });

      const results = await evaluator.evaluateConstraints([mockConstraints[0]], mockSlot);
      expect(results).toHaveLength(1);
    });
  });
});