/**
 * FlexTime Enhanced Constraint Manager Test Suite
 * 
 * Comprehensive test coverage for the dynamic constraint management system
 * including sport-specific constraints, conference rules, validation engine,
 * and optimization algorithms.
 * 
 * [Playbook: Testing Framework - Comprehensive test coverage]
 * 
 * @author FlexTime AI Engine
 * @version 2.0
 */

const ConstraintManager = require('../../ConstraintManager');
const { performance } = require('perf_hooks');

describe('ConstraintManager', () => {
  let constraintManager;
  
  beforeEach(() => {
    constraintManager = new ConstraintManager({
      logLevel: 'error', // Reduce noise in tests
      cacheEnabled: true,
      hotSwapEnabled: true
    });
  });
  
  afterEach(async () => {
    await constraintManager.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize with default sport constraints', () => {
      const stats = constraintManager.getStats();
      
      expect(stats.constraints.sport).toBeGreaterThan(0);
      expect(constraintManager.sportConstraints.has('football')).toBe(true);
      expect(constraintManager.sportConstraints.has('mens_basketball')).toBe(true);
      expect(constraintManager.sportConstraints.has('womens_basketball')).toBe(true);
      expect(constraintManager.sportConstraints.has('baseball')).toBe(true);
      expect(constraintManager.sportConstraints.has('softball')).toBe(true);
      expect(constraintManager.sportConstraints.has('tennis')).toBe(true);
      expect(constraintManager.sportConstraints.has('venue_sharing')).toBe(true);
    });

    test('should initialize with Big 12 conference rules', () => {
      expect(constraintManager.conferenceRules.has('big12_global')).toBe(true);
      expect(constraintManager.conferenceRules.has('big12_football')).toBe(true);
      expect(constraintManager.conferenceRules.has('big12_basketball')).toBe(true);
      expect(constraintManager.conferenceRules.has('big12_baseball')).toBe(true);
      
      const globalRules = constraintManager.conferenceRules.get('big12_global');
      expect(globalRules.memberSchools).toHaveLength(16);
      expect(globalRules.memberSchools).toContain('BYU');
      expect(globalRules.memberSchools).toContain('Kansas');
    });

    test('should initialize with constraint templates', () => {
      expect(constraintManager.constraintTemplates.has('travel_optimization')).toBe(true);
      expect(constraintManager.constraintTemplates.has('academic_compliance')).toBe(true);
      expect(constraintManager.constraintTemplates.has('weather_optimization')).toBe(true);
      expect(constraintManager.constraintTemplates.has('media_rights')).toBe(true);
    });
  });

  describe('Sport-Specific Constraints', () => {
    test('should have comprehensive football constraints', () => {
      const footballConstraints = constraintManager.sportConstraints.get('football');
      
      expect(footballConstraints.complexityLevel).toBe('HIGH');
      expect(footballConstraints.big12Compliance).toBe('complete');
      expect(footballConstraints.hardConstraints).toHaveLength(7);
      expect(footballConstraints.softConstraints).toHaveLength(10);
      expect(footballConstraints.inheritFrom).toContain('global_constraints');
    });

    test('should have basketball constraints for both men and women', () => {
      const mensBasketball = constraintManager.sportConstraints.get('mens_basketball');
      const womensBasketball = constraintManager.sportConstraints.get('womens_basketball');
      
      expect(mensBasketball.complexityLevel).toBe('MEDIUM-HIGH');
      expect(womensBasketball.complexityLevel).toBe('MEDIUM-HIGH');
      expect(mensBasketball.hardConstraints).toHaveLength(8);
      expect(womensBasketball.hardConstraints).toHaveLength(8);
      expect(womensBasketball.hardConstraints).toContain('title_ix_compliance');
    });

    test('should have series-based constraints for baseball and softball', () => {
      const baseball = constraintManager.sportConstraints.get('baseball');
      const softball = constraintManager.sportConstraints.get('softball');
      
      expect(baseball.hardConstraints).toContain('series_integrity');
      expect(softball.hardConstraints).toContain('series_integrity');
      expect(baseball.inheritFrom).toContain('weather_constraints');
      expect(softball.inheritFrom).toContain('weather_constraints');
    });
  });

  describe('Dynamic Constraint Loading', () => {
    test('should load constraint successfully', async () => {
      const constraintDefinition = {
        id: 'test_constraint',
        name: 'Test Constraint',
        type: 'soft',
        weight: 0.7,
        implementation: () => ({ satisfied: true }),
        dependencies: []
      };

      const constraint = await constraintManager.loadConstraint(constraintDefinition);
      
      expect(constraint.id).toBe('test_constraint');
      expect(constraint.weight).toBe(0.7);
      expect(constraintManager.constraintRegistry.has('test_constraint')).toBe(true);
    });

    test('should handle constraint with dependencies', async () => {
      // First load a dependency
      const dependencyDefinition = {
        id: 'dependency_constraint',
        name: 'Dependency Constraint',
        type: 'hard',
        implementation: () => ({ satisfied: true })
      };
      
      await constraintManager.loadConstraint(dependencyDefinition);

      // Then load constraint that depends on it
      const constraintDefinition = {
        id: 'dependent_constraint',
        name: 'Dependent Constraint',
        type: 'soft',
        implementation: () => ({ satisfied: true }),
        dependencies: ['dependency_constraint']
      };

      const constraint = await constraintManager.loadConstraint(constraintDefinition);
      expect(constraint.id).toBe('dependent_constraint');
    });

    test('should reject invalid constraint definitions', async () => {
      const invalidConstraint = {
        id: 'invalid_constraint',
        // Missing implementation
        type: 'soft'
      };

      await expect(constraintManager.loadConstraint(invalidConstraint))
        .rejects.toThrow('Constraint must have a valid implementation function');
    });
  });

  describe('Hot-Swapping', () => {
    test('should hot-swap constraint implementation', async () => {
      // Load initial constraint
      const initialDefinition = {
        id: 'swappable_constraint',
        name: 'Swappable Constraint',
        type: 'soft',
        implementation: () => ({ satisfied: true, version: 1 })
      };

      await constraintManager.loadConstraint(initialDefinition);

      // Hot-swap implementation
      const newImplementation = () => ({ satisfied: true, version: 2 });
      const swapped = await constraintManager.hotSwapConstraint(
        'swappable_constraint', 
        newImplementation
      );

      expect(swapped.version).toBe(2);
      expect(swapped.implementation).toBe(newImplementation);
    });

    test('should fail hot-swap when disabled', async () => {
      const disabledManager = new ConstraintManager({
        hotSwapEnabled: false,
        logLevel: 'error'
      });

      await expect(disabledManager.hotSwapConstraint('any_id', () => {}))
        .rejects.toThrow('Hot-swapping is disabled');
      
      await disabledManager.cleanup();
    });
  });

  describe('Pre-Validation', () => {
    test('should validate schedule change request', async () => {
      const changeRequest = {
        type: 'move_game',
        gameId: 'game_123',
        newDate: '2025-03-15',
        newTime: '7:00 PM'
      };

      const context = {
        sport: 'basketball',
        teams: ['Kansas', 'Baylor'],
        venue: 'Allen Fieldhouse'
      };

      const result = await constraintManager.preValidateScheduleChange(changeRequest, context);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('performance');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Incremental Validation', () => {
    test('should perform incremental validation during editing', async () => {
      const partialSchedule = {
        games: [
          {
            id: 'game_1',
            teams: ['Kansas', 'Baylor'],
            date: '2025-03-10',
            sport: 'basketball'
          }
        ]
      };

      const changes = [
        {
          type: 'add_game',
          game: {
            id: 'game_2',
            teams: ['Texas Tech', 'TCU'],
            date: '2025-03-11',
            sport: 'basketball'
          }
        }
      ];

      const result = await constraintManager.incrementalValidation(partialSchedule, changes);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('incrementalViolations');
      expect(result).toHaveProperty('affectedConstraints');
      expect(result).toHaveProperty('optimizationSuggestions');
      expect(Array.isArray(result.affectedConstraints)).toBe(true);
    });
  });

  describe('Batch Validation', () => {
    test('should process large batch of changes efficiently', async () => {
      const scheduleChanges = Array.from({ length: 500 }, (_, i) => ({
        type: 'schedule_game',
        gameId: `game_${i}`,
        date: `2025-03-${10 + (i % 20)}`,
        teams: ['Kansas', 'Baylor']
      }));

      const options = {
        batchSize: 50,
        parallelEvaluations: 5
      };

      const startTime = performance.now();
      const result = await constraintManager.batchValidation(scheduleChanges, options);
      const endTime = performance.now();

      expect(result.totalChanges).toBe(500);
      expect(result.processedChanges).toBe(500);
      expect(result).toHaveProperty('performance');
      expect(Array.isArray(result.violations)).toBe(true);
      
      // Performance should be reasonable
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds
    });
  });

  describe('Constraint Optimization', () => {
    test('should optimize constraints using simulated annealing', async () => {
      const schedule = {
        games: [
          {
            id: 'game_1',
            teams: ['Kansas', 'Baylor'],
            date: '2025-03-10',
            venue: 'Allen Fieldhouse'
          },
          {
            id: 'game_2',
            teams: ['Texas Tech', 'TCU'],
            date: '2025-03-11',
            venue: 'United Supermarkets Arena'
          }
        ]
      };

      const objectives = {
        minimizeTravelCosts: 0.4,
        maximizeAttendance: 0.3,
        optimizeTvScheduling: 0.3
      };

      const options = {
        maxIterations: 1000,
        temperature: 50,
        coolingRate: 0.9
      };

      const result = await constraintManager.optimizeConstraints(schedule, objectives, options);
      
      expect(result).toHaveProperty('originalSchedule');
      expect(result).toHaveProperty('optimizedSchedule');
      expect(result).toHaveProperty('originalScore');
      expect(result).toHaveProperty('optimizedScore');
      expect(result).toHaveProperty('improvement');
      expect(result).toHaveProperty('iterations');
      expect(result).toHaveProperty('optimizationTime');
      expect(result.algorithm).toBe('simulated_annealing');
    });
  });

  describe('Custom Constraint Definition', () => {
    test('should define custom constraint successfully', () => {
      const definition = {
        id: 'custom_rivalry_constraint',
        name: 'Rivalry Game Constraint',
        type: 'soft',
        weight: 0.8,
        description: 'Ensures rivalry games are scheduled at optimal times',
        implementation: (context) => {
          const { game } = context;
          const rivalryPairs = [['Kansas', 'Kansas State'], ['Texas Tech', 'TCU']];
          const isRivalry = rivalryPairs.some(pair => 
            pair.every(team => game.teams.includes(team))
          );
          return {
            satisfied: !isRivalry || game.isPrimeTime,
            message: isRivalry ? 'Rivalry game should be in prime time' : 'Not a rivalry game'
          };
        },
        parameters: {
          primeTimeStart: '7:00 PM',
          primeTimeEnd: '9:00 PM'
        },
        tags: ['rivalry', 'scheduling', 'fan_experience']
      };

      const constraint = constraintManager.defineCustomConstraint(definition);
      
      expect(constraint.id).toBe('custom_rivalry_constraint');
      expect(constraint.weight).toBe(0.8);
      expect(constraintManager.customConstraints.has('custom_rivalry_constraint')).toBe(true);
      expect(constraintManager.constraintRegistry.has('custom_rivalry_constraint')).toBe(true);
      expect(constraint.metadata.tags).toContain('rivalry');
    });

    test('should handle constraint inheritance', () => {
      // Define parent constraint
      const parentDefinition = {
        id: 'parent_constraint',
        name: 'Parent Constraint',
        implementation: () => ({ satisfied: true })
      };
      
      constraintManager.defineCustomConstraint(parentDefinition);

      // Define child constraint with inheritance
      const childDefinition = {
        id: 'child_constraint',
        name: 'Child Constraint',
        implementation: () => ({ satisfied: true }),
        inheritFrom: ['parent_constraint']
      };

      const childConstraint = constraintManager.defineCustomConstraint(childDefinition);
      
      expect(childConstraint.inheritFrom).toContain('parent_constraint');
      expect(constraintManager.inheritanceChains.has('child_constraint')).toBe(true);
    });
  });

  describe('Conference Rules Implementation', () => {
    test('should enforce BYU Sunday restriction', () => {
      const context = {
        game: {
          teams: ['BYU', 'Kansas'],
          date: '2025-03-16' // Sunday
        }
      };

      const result = constraintManager.byuSundayRestriction(context);
      
      expect(result.satisfied).toBe(false);
      expect(result.message).toContain('BYU cannot compete on Sundays');
      expect(result.violationType).toBe('hard_constraint');
      expect(result.suggestedResolutions).toContain('Move game to Saturday');
    });

    test('should allow BYU games on non-Sunday', () => {
      const context = {
        game: {
          teams: ['BYU', 'Kansas'],
          date: '2025-03-15' // Saturday
        }
      };

      const result = constraintManager.byuSundayRestriction(context);
      expect(result.satisfied).toBe(true);
    });

    test('should validate conference balance requirements', () => {
      const context = {
        team: 'Kansas',
        schedule: [
          { teams: ['Kansas', 'Baylor'], isConferenceGame: true },
          { teams: ['Kansas', 'TCU'], isConferenceGame: true },
          { teams: ['Kansas', 'Duke'], isConferenceGame: false } // Non-conference
        ],
        sport: 'mens_basketball'
      };

      const result = constraintManager.conferenceBalanceRule(context);
      
      expect(result).toHaveProperty('satisfied');
      expect(result).toHaveProperty('currentCount');
      expect(result).toHaveProperty('requiredCount');
      expect(result.message).toContain('conference games');
    });
  });

  describe('Performance and Caching', () => {
    test('should cache constraint evaluations', async () => {
      const constraint = {
        id: 'cacheable_constraint',
        implementation: jest.fn(() => ({ satisfied: true }))
      };

      constraintManager.constraintRegistry.set('cacheable_constraint', constraint);

      const context = { game: { teams: ['Kansas', 'Baylor'] } };
      
      // First evaluation
      await constraintManager.preValidateScheduleChange({ type: 'test' }, context);
      
      // Second evaluation with same context should use cache
      await constraintManager.preValidateScheduleChange({ type: 'test' }, context);
      
      const stats = constraintManager.cacheManager.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    test('should track performance metrics', () => {
      const stats = constraintManager.getStats();
      
      expect(stats).toHaveProperty('constraints');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('cache');
      expect(stats).toHaveProperty('memory');
      
      expect(stats.constraints.total).toBeGreaterThan(0);
      expect(stats.constraints).toHaveProperty('sport');
      expect(stats.constraints).toHaveProperty('conference');
      expect(stats.constraints).toHaveProperty('custom');
      expect(stats.constraints).toHaveProperty('templates');
    });
  });

  describe('Event Emission', () => {
    test('should emit events for constraint operations', async () => {
      const events = [];
      
      constraintManager.on('constraintLoaded', (event) => {
        events.push({ type: 'loaded', data: event });
      });
      
      constraintManager.on('customConstraintDefined', (event) => {
        events.push({ type: 'defined', data: event });
      });

      // Load a constraint
      await constraintManager.loadConstraint({
        id: 'event_test_constraint',
        implementation: () => ({ satisfied: true })
      });

      // Define a custom constraint
      constraintManager.defineCustomConstraint({
        id: 'custom_event_test',
        implementation: () => ({ satisfied: true })
      });

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('loaded');
      expect(events[1].type).toBe('defined');
    });
  });

  describe('Error Handling', () => {
    test('should handle constraint loading failures gracefully', async () => {
      const invalidConstraint = {
        id: 'failing_constraint',
        implementation: () => {
          throw new Error('Constraint implementation error');
        }
      };

      await expect(constraintManager.loadConstraint(invalidConstraint))
        .rejects.toThrow('Constraint loading failed');
    });

    test('should handle hot-swap failures', async () => {
      await expect(constraintManager.hotSwapConstraint('nonexistent_constraint', () => {}))
        .rejects.toThrow('Constraint nonexistent_constraint not found for hot-swap');
    });

    test('should validate constraint types', () => {
      expect(() => {
        constraintManager.defineCustomConstraint({
          id: 'invalid_type_constraint',
          type: 'invalid_type',
          implementation: () => ({ satisfied: true })
        });
      }).toThrow('Constraint type must be hard, soft, or preference');
    });

    test('should validate constraint weights', () => {
      expect(() => {
        constraintManager.defineCustomConstraint({
          id: 'invalid_weight_constraint',
          weight: 1.5, // Invalid weight > 1
          implementation: () => ({ satisfied: true })
        });
      }).toThrow('Constraint weight must be between 0 and 1');
    });
  });

  describe('Template System', () => {
    test('should use travel optimization template', () => {
      const template = constraintManager.constraintTemplates.get('travel_optimization');
      
      expect(template).toBeDefined();
      expect(template.parameters.maxTravelDistance.default).toBe(1000);
      expect(template.parameters.maxConsecutiveAwayGames.default).toBe(3);
      expect(template.parameters.travelCostWeight.default).toBe(0.7);
    });

    test('should use academic compliance template', () => {
      const template = constraintManager.constraintTemplates.get('academic_compliance');
      
      expect(template).toBeDefined();
      expect(template.parameters.examPeriodBuffer.default).toBe(7);
      expect(template.parameters.gpaThreshold.default).toBe(2.0);
    });

    test('should use weather optimization template', () => {
      const template = constraintManager.constraintTemplates.get('weather_optimization');
      
      expect(template).toBeDefined();
      expect(template.parameters.weatherRiskThreshold.default).toBe(0.3);
      expect(template.parameters.rainoutRiskWeight.default).toBe(0.6);
    });
  });

  describe('Integration with Big 12 Sports', () => {
    test('should handle all Big 12 sports correctly', () => {
      const big12Sports = [
        'football', 'mens_basketball', 'womens_basketball', 
        'baseball', 'softball', 'tennis'
      ];

      big12Sports.forEach(sport => {
        const constraints = constraintManager.sportConstraints.get(sport);
        expect(constraints).toBeDefined();
        expect(constraints.big12Compliance).toBe('complete');
        expect(constraints.hardConstraints.length).toBeGreaterThan(0);
        expect(constraints.softConstraints.length).toBeGreaterThan(0);
      });
    });

    test('should handle venue sharing constraints', () => {
      const venueSharing = constraintManager.sportConstraints.get('venue_sharing');
      
      expect(venueSharing.complexityLevel).toBe('HIGH');
      expect(venueSharing.hardConstraints).toContain('no_venue_conflicts');
      expect(venueSharing.hardConstraints).toContain('setup_teardown_time');
      expect(venueSharing.softConstraints).toContain('minimize_setup_costs');
    });
  });
});

module.exports = {
  ConstraintManager
};