import { ConstraintEngine } from '../core/ConstraintEngine';
import { OptimizedConstraintEngine } from '../engines/OptimizedConstraintEngine';
import { SmartConflictResolver } from '../resolvers/SmartConflictResolver';
import { MLConstraintOptimizer } from '../ml/MLConstraintOptimizer';
import { RealTimeConstraintMonitor } from '../monitoring/RealTimeConstraintMonitor';
import { ConstraintTemplateSystem } from '../templates/ConstraintTemplateSystem';
import { StandardTemplates } from '../templates/StandardTemplates';
import { EnhancedFootballConstraints } from '../sports/EnhancedFootballConstraints';
import { EnhancedBasketballConstraints } from '../sports/EnhancedBasketballConstraints';
import { ScheduleSlot, UnifiedConstraint } from '../types';

describe('End-to-End Constraint System Tests', () => {
  let engine: ConstraintEngine;
  let optimizedEngine: OptimizedConstraintEngine;
  let conflictResolver: SmartConflictResolver;
  let mlOptimizer: MLConstraintOptimizer;
  let monitor: RealTimeConstraintMonitor;
  let templateSystem: ConstraintTemplateSystem;

  beforeEach(async () => {
    // Initialize all components
    engine = new ConstraintEngine();
    optimizedEngine = new OptimizedConstraintEngine();
    conflictResolver = new SmartConflictResolver();
    mlOptimizer = new MLConstraintOptimizer();
    monitor = new RealTimeConstraintMonitor();
    templateSystem = new ConstraintTemplateSystem();

    // Initialize engines
    await optimizedEngine.initialize();
    await mlOptimizer.initialize();
    monitor.start();

    // Load standard templates
    Object.entries(StandardTemplates).forEach(([id, template]) => {
      templateSystem.registerTemplate(id, template);
    });

    // Load sport-specific constraints
    const footballConstraints = new EnhancedFootballConstraints();
    const basketballConstraints = new EnhancedBasketballConstraints();

    footballConstraints.getAllConstraints().forEach(c => engine.addConstraint(c));
    basketballConstraints.getAllConstraints().forEach(c => engine.addConstraint(c));
  });

  afterEach(async () => {
    await optimizedEngine.shutdown();
    monitor.stop();
  });

  describe('Complete Schedule Evaluation Workflow', () => {
    test('should evaluate a complex football schedule', async () => {
      const schedule: ScheduleSlot[] = [
        {
          id: 'game-1',
          date: new Date('2025-09-06'), // Saturday
          time: '14:00',
          duration: 210,
          venue: 'Memorial Stadium',
          sport: 'football',
          gameId: 'fb-001',
          homeTeam: 'Kansas',
          awayTeam: 'K-State',
          conference: 'Big 12',
          tvInfo: {
            network: 'ESPN',
            startTime: '14:00',
            duration: 210
          },
          requiredResources: ['Field', 'Lights', 'TV Equipment'],
          constraints: []
        },
        {
          id: 'game-2',
          date: new Date('2025-09-06'), // Same day
          time: '19:00',
          duration: 210,
          venue: 'Memorial Stadium', // Same venue
          sport: 'football',
          gameId: 'fb-002',
          homeTeam: 'Kansas',
          awayTeam: 'Iowa State',
          conference: 'Big 12',
          tvInfo: {
            network: 'Fox',
            startTime: '19:00',
            duration: 210
          },
          requiredResources: ['Field', 'Lights', 'TV Equipment'],
          constraints: []
        },
        {
          id: 'game-3',
          date: new Date('2025-09-13'), // Next Saturday
          time: '11:00',
          duration: 210,
          venue: 'Memorial Stadium',
          sport: 'football',
          gameId: 'fb-003',
          homeTeam: 'Kansas',
          awayTeam: 'Texas Tech',
          conference: 'Big 12',
          tvInfo: {
            network: 'ABC',
            startTime: '11:00',
            duration: 210
          },
          requiredResources: ['Field', 'TV Equipment'],
          constraints: []
        }
      ];

      // Evaluate each slot
      const results = await Promise.all(
        schedule.map(slot => engine.evaluateSlot(slot))
      );

      // Check for conflicts
      expect(results[0].overallValid).toBe(true); // First game should be fine
      expect(results[1].overallValid).toBe(false); // Venue conflict
      expect(results[2].overallValid).toBe(true); // Different week

      // Find specific violations
      const game2Violations = results[1].results
        .filter(r => !r.result.valid)
        .map(r => r.result.violations)
        .flat();

      expect(game2Violations).toContain(
        expect.stringContaining('venue conflict')
      );
      expect(game2Violations).toContain(
        expect.stringContaining('Kansas')
      );
    });

    test('should handle basketball double-header constraints', async () => {
      const doubleHeader: ScheduleSlot[] = [
        {
          id: 'bb-game-1',
          date: new Date('2025-01-15'),
          time: '17:00',
          duration: 120,
          venue: 'Allen Fieldhouse',
          sport: 'basketball',
          gameId: 'bb-001',
          homeTeam: 'Kansas',
          awayTeam: 'Baylor',
          conference: 'Big 12',
          gender: 'women',
          tvInfo: {
            network: 'ESPN+',
            startTime: '17:00',
            duration: 120
          },
          requiredResources: ['Court', 'Scoreboard'],
          constraints: []
        },
        {
          id: 'bb-game-2',
          date: new Date('2025-01-15'),
          time: '19:30',
          duration: 120,
          venue: 'Allen Fieldhouse',
          sport: 'basketball',
          gameId: 'bb-002',
          homeTeam: 'Kansas',
          awayTeam: 'Baylor',
          conference: 'Big 12',
          gender: 'men',
          tvInfo: {
            network: 'ESPN',
            startTime: '19:30',
            duration: 120
          },
          requiredResources: ['Court', 'Scoreboard'],
          constraints: []
        }
      ];

      const results = await Promise.all(
        doubleHeader.map(slot => engine.evaluateSlot(slot))
      );

      // Both games should be valid (proper double-header spacing)
      expect(results[0].overallValid).toBe(true);
      expect(results[1].overallValid).toBe(true);

      // Check for double-header optimization suggestions
      const suggestions = results[1].results
        .map(r => r.result.suggestions)
        .flat();

      expect(suggestions).toContain(
        expect.stringContaining('double-header')
      );
    });
  });

  describe('Conflict Resolution Workflow', () => {
    test('should resolve venue conflicts automatically', async () => {
      const conflictingSlots: ScheduleSlot[] = [
        {
          id: 'conflict-1',
          date: new Date('2025-10-15'),
          time: '14:00',
          duration: 180,
          venue: 'Stadium A',
          sport: 'football',
          gameId: 'game-1',
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          conference: 'Big 12',
          constraints: []
        },
        {
          id: 'conflict-2',
          date: new Date('2025-10-15'),
          time: '15:00', // Overlaps with first game
          duration: 180,
          venue: 'Stadium A',
          sport: 'football',
          gameId: 'game-2',
          homeTeam: 'Team C',
          awayTeam: 'Team D',
          conference: 'Big 12',
          constraints: []
        }
      ];

      // Detect conflicts
      const conflicts = await conflictResolver.detectConflicts(conflictingSlots);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('venue_overlap');

      // Resolve conflicts
      const resolutions = await conflictResolver.resolveConflicts(
        conflicts,
        conflictingSlots
      );

      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].resolution.type).toBe('reschedule');

      // Apply resolution
      const updatedSchedule = conflictResolver.applyResolutions(
        conflictingSlots,
        resolutions
      );

      // Re-evaluate to ensure conflicts are resolved
      const results = await Promise.all(
        updatedSchedule.map(slot => engine.evaluateSlot(slot))
      );

      expect(results.every(r => r.overallValid)).toBe(true);
    });

    test('should handle complex multi-constraint conflicts', async () => {
      const complexSchedule: ScheduleSlot[] = [
        {
          id: 'complex-1',
          date: new Date('2025-11-01'),
          time: '14:00',
          duration: 210,
          venue: 'Stadium A',
          sport: 'football',
          gameId: 'game-1',
          homeTeam: 'Kansas',
          awayTeam: 'K-State',
          conference: 'Big 12',
          tvInfo: {
            network: 'ESPN',
            startTime: '14:00',
            duration: 210
          },
          constraints: []
        },
        {
          id: 'complex-2',
          date: new Date('2025-11-02'), // Next day
          time: '14:00',
          duration: 210,
          venue: 'Stadium B',
          sport: 'football',
          gameId: 'game-2',
          homeTeam: 'K-State', // Same team, back-to-back days
          awayTeam: 'Iowa State',
          conference: 'Big 12',
          constraints: []
        },
        {
          id: 'complex-3',
          date: new Date('2025-11-01'),
          time: '14:00',
          duration: 180,
          venue: 'Stadium C',
          sport: 'football',
          gameId: 'game-3',
          homeTeam: 'Texas Tech',
          awayTeam: 'Baylor',
          conference: 'Big 12',
          tvInfo: {
            network: 'ESPN', // Same network as game-1
            startTime: '14:00',
            duration: 180
          },
          constraints: []
        }
      ];

      const conflicts = await conflictResolver.detectConflicts(complexSchedule);
      
      // Should detect multiple conflict types
      const conflictTypes = [...new Set(conflicts.map(c => c.type))];
      expect(conflictTypes).toContain('team_rest');
      expect(conflictTypes).toContain('tv_conflict');

      // Resolve all conflicts
      const resolutions = await conflictResolver.resolveConflicts(
        conflicts,
        complexSchedule
      );

      // Should provide resolutions for each conflict
      expect(resolutions.length).toBeGreaterThan(0);
      resolutions.forEach(r => {
        expect(r.resolution).toBeDefined();
        expect(r.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('ML Optimization Workflow', () => {
    test('should optimize constraint weights based on feedback', async () => {
      // Simulate historical feedback
      const feedback = [
        {
          constraintId: 'venue-availability',
          slotId: 'slot-1',
          originalScore: 0.8,
          actualOutcome: 'successful',
          userRating: 5
        },
        {
          constraintId: 'team-rest-days',
          slotId: 'slot-2',
          originalScore: 0.6,
          actualOutcome: 'problematic',
          userRating: 2
        },
        {
          constraintId: 'tv-windows',
          slotId: 'slot-3',
          originalScore: 0.9,
          actualOutcome: 'successful',
          userRating: 4
        }
      ];

      // Train optimizer with feedback
      await mlOptimizer.trainOnFeedback(feedback);

      // Get optimized weights
      const weights = await mlOptimizer.getOptimizedWeights();

      expect(weights['venue-availability']).toBeGreaterThan(0.8);
      expect(weights['team-rest-days']).toBeLessThan(0.7);
      expect(weights['tv-windows']).toBeGreaterThan(0.85);
    });

    test('should predict constraint violations', async () => {
      const testSlot: ScheduleSlot = {
        id: 'predict-1',
        date: new Date('2025-12-01'),
        time: '19:00',
        duration: 180,
        venue: 'Stadium A',
        sport: 'football',
        gameId: 'game-1',
        homeTeam: 'Kansas',
        awayTeam: 'Oklahoma State',
        conference: 'Big 12',
        tvInfo: {
          network: 'ESPN',
          startTime: '19:00',
          duration: 180
        },
        constraints: []
      };

      const predictions = await mlOptimizer.predictViolations(testSlot);

      expect(predictions).toBeDefined();
      expect(predictions).toHaveProperty('likelyViolations');
      expect(predictions).toHaveProperty('confidence');
      expect(predictions).toHaveProperty('riskFactors');
    });
  });

  describe('Performance and Monitoring', () => {
    test('should monitor constraint evaluation performance', async () => {
      const testSlots: ScheduleSlot[] = Array(10).fill(null).map((_, i) => ({
        id: `perf-${i}`,
        date: new Date('2025-09-01'),
        time: `${10 + i}:00`,
        duration: 180,
        venue: `Stadium ${i % 3}`,
        sport: 'football',
        gameId: `game-${i}`,
        homeTeam: `Team ${i}`,
        awayTeam: `Team ${i + 1}`,
        conference: 'Big 12',
        constraints: []
      }));

      // Monitor evaluations
      const evaluationPromises = testSlots.map(async (slot) => {
        monitor.startTracking(slot.id);
        const result = await optimizedEngine.evaluateSlot(slot);
        monitor.endTracking(slot.id, result);
        return result;
      });

      await Promise.all(evaluationPromises);

      // Get performance metrics
      const metrics = monitor.getMetrics();

      expect(metrics.totalEvaluations).toBe(10);
      expect(metrics.averageEvaluationTime).toBeGreaterThan(0);
      expect(metrics.constraintMetrics).toBeDefined();

      // Check for slow constraints
      const slowConstraints = monitor.getSlowConstraints(100);
      expect(Array.isArray(slowConstraints)).toBe(true);
    });

    test('should alert on performance degradation', async () => {
      const alertHandler = jest.fn();
      monitor.onAlert(alertHandler);

      // Configure thresholds
      monitor.setThreshold('evaluationTime', 500);
      monitor.setThreshold('errorRate', 0.1);

      // Simulate slow evaluation
      const slowSlot: ScheduleSlot = {
        id: 'slow-slot',
        date: new Date(),
        time: '14:00',
        duration: 180,
        venue: 'Stadium',
        sport: 'football',
        gameId: 'slow-game',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        conference: 'Big 12',
        constraints: []
      };

      // Add artificial delay to constraint
      const slowConstraint: UnifiedConstraint = {
        id: 'slow-constraint',
        type: 'custom',
        sport: 'football',
        name: 'Slow Constraint',
        version: '1.0.0',
        priority: 'medium',
        evaluate: async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
          return {
            valid: true,
            score: 1,
            violations: [],
            suggestions: []
          };
        },
        metadata: {
          author: 'test',
          tags: ['slow'],
          description: 'Intentionally slow constraint',
          created: new Date(),
          updated: new Date()
        }
      };

      engine.addConstraint(slowConstraint);

      monitor.startTracking(slowSlot.id);
      const result = await engine.evaluateSlot(slowSlot);
      monitor.endTracking(slowSlot.id, result);

      // Should trigger performance alert
      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          severity: 'warning'
        })
      );
    });
  });

  describe('Template System Integration', () => {
    test('should create and use custom constraint templates', async () => {
      // Register custom template
      templateSystem.registerTemplate('custom_venue_check', {
        name: 'Custom Venue Check',
        description: 'Custom venue validation logic',
        parameters: [
          {
            name: 'allowedVenues',
            type: 'array',
            required: true,
            description: 'List of allowed venues'
          },
          {
            name: 'blackoutDates',
            type: 'array',
            required: false,
            description: 'Dates when venues are unavailable'
          }
        ],
        generator: (params) => ({
          id: `custom-venue-${Date.now()}`,
          type: 'venue',
          sport: 'all',
          name: 'Custom Venue Check',
          version: '1.0.0',
          priority: 'high',
          evaluate: async (slot) => {
            const isAllowed = params.allowedVenues.includes(slot.venue);
            const isBlackout = params.blackoutDates?.some(
              date => date.toDateString() === slot.date.toDateString()
            );

            return {
              valid: isAllowed && !isBlackout,
              score: isAllowed ? (isBlackout ? 0 : 1) : 0,
              violations: [
                !isAllowed && `Venue ${slot.venue} not in allowed list`,
                isBlackout && 'Game scheduled on blackout date'
              ].filter(Boolean),
              suggestions: [
                !isAllowed && `Use one of: ${params.allowedVenues.join(', ')}`,
                isBlackout && 'Choose a different date'
              ].filter(Boolean)
            };
          },
          metadata: {
            author: 'custom',
            tags: ['venue', 'custom'],
            description: 'Custom venue validation',
            created: new Date(),
            updated: new Date()
          }
        })
      });

      // Create constraint from template
      const constraint = templateSystem.createFromTemplate('custom_venue_check', {
        allowedVenues: ['Stadium A', 'Stadium B'],
        blackoutDates: [new Date('2025-07-04')]
      });

      engine.addConstraint(constraint);

      // Test with valid venue
      const validSlot: ScheduleSlot = {
        id: 'template-test-1',
        date: new Date('2025-07-03'),
        time: '14:00',
        duration: 180,
        venue: 'Stadium A',
        sport: 'football',
        gameId: 'game-1',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        conference: 'Big 12',
        constraints: []
      };

      const validResult = await engine.evaluateSlot(validSlot);
      const customResult = validResult.results.find(
        r => r.constraintId.startsWith('custom-venue')
      );

      expect(customResult?.result.valid).toBe(true);

      // Test with blackout date
      const blackoutSlot: ScheduleSlot = {
        ...validSlot,
        id: 'template-test-2',
        date: new Date('2025-07-04')
      };

      const blackoutResult = await engine.evaluateSlot(blackoutSlot);
      const blackoutCustomResult = blackoutResult.results.find(
        r => r.constraintId.startsWith('custom-venue')
      );

      expect(blackoutCustomResult?.result.valid).toBe(false);
      expect(blackoutCustomResult?.result.violations).toContain(
        'Game scheduled on blackout date'
      );
    });
  });

  describe('Full System Stress Test', () => {
    test('should handle large-scale schedule evaluation', async () => {
      // Generate large schedule
      const largeSchedule: ScheduleSlot[] = [];
      const venues = ['Stadium A', 'Stadium B', 'Stadium C', 'Arena A', 'Arena B'];
      const teams = Array(16).fill(null).map((_, i) => `Team ${i + 1}`);
      const sports = ['football', 'basketball'];
      const startDate = new Date('2025-09-01');

      for (let week = 0; week < 15; week++) {
        for (let day = 0; day < 7; day++) {
          for (let slot = 0; slot < 4; slot++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + (week * 7) + day);

            const sport = sports[Math.floor(Math.random() * sports.length)];
            const venue = venues[Math.floor(Math.random() * venues.length)];
            const homeTeam = teams[Math.floor(Math.random() * teams.length)];
            let awayTeam = teams[Math.floor(Math.random() * teams.length)];
            while (awayTeam === homeTeam) {
              awayTeam = teams[Math.floor(Math.random() * teams.length)];
            }

            largeSchedule.push({
              id: `game-${week}-${day}-${slot}`,
              date,
              time: `${10 + (slot * 3)}:00`,
              duration: sport === 'football' ? 210 : 120,
              venue,
              sport,
              gameId: `${sport}-${week}-${day}-${slot}`,
              homeTeam,
              awayTeam,
              conference: 'Big 12',
              constraints: []
            });
          }
        }
      }

      console.log(`Evaluating ${largeSchedule.length} games...`);

      const startTime = Date.now();
      
      // Use optimized engine with parallel processing
      const results = await optimizedEngine.evaluateBatch(
        largeSchedule,
        { parallel: true, batchSize: 50 }
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`Evaluation completed in ${totalTime}ms`);
      console.log(`Average time per game: ${totalTime / largeSchedule.length}ms`);

      // Verify results
      expect(results).toHaveLength(largeSchedule.length);
      
      // Count violations
      const violationCounts = results.reduce((acc, result) => {
        result.results.forEach(r => {
          if (!r.result.valid) {
            r.result.violations.forEach(v => {
              const key = v.split(' ')[0]; // Simple categorization
              acc[key] = (acc[key] || 0) + 1;
            });
          }
        });
        return acc;
      }, {} as Record<string, number>);

      console.log('Violation summary:', violationCounts);

      // Performance assertions
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds
      expect(totalTime / largeSchedule.length).toBeLessThan(150); // < 150ms per game
    }, 120000); // 2 minute timeout for stress test
  });
});