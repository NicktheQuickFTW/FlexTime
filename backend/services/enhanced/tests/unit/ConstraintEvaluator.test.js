/**
 * Constraint Evaluator Unit Tests
 * Comprehensive testing for the FT Engine Constraint Evaluator
 */

const ConstraintEvaluator = require('../../ConstraintEvaluator');

describe('ConstraintEvaluator', () => {
    let evaluator;

    beforeEach(() => {
        evaluator = new ConstraintEvaluator({
            enableParallelProcessing: true,
            cacheEnabled: true,
            maxCacheSize: 1000
        });
    });

    afterEach(() => {
        if (evaluator) {
            evaluator.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            const defaultEvaluator = new ConstraintEvaluator();
            expect(defaultEvaluator.config.enableParallelProcessing).toBe(true);
            expect(defaultEvaluator.config.cacheEnabled).toBe(true);
            expect(defaultEvaluator.constraints.size).toBe(0);
            defaultEvaluator.destroy();
        });

        test('should initialize with custom configuration', () => {
            expect(evaluator.config.enableParallelProcessing).toBe(true);
            expect(evaluator.config.cacheEnabled).toBe(true);
            expect(evaluator.config.maxCacheSize).toBe(1000);
        });

        test('should load built-in constraints', () => {
            expect(evaluator.constraints.size).toBeGreaterThan(0);
            expect(evaluator.hasConstraint('DATE_CONSTRAINT')).toBe(true);
            expect(evaluator.hasConstraint('VENUE_AVAILABILITY')).toBe(true);
            expect(evaluator.hasConstraint('TRAVEL_CONSTRAINT')).toBe(true);
        });
    });

    describe('Constraint Registration', () => {
        test('should register new constraints', () => {
            const customConstraint = {
                name: 'CUSTOM_TEST_CONSTRAINT',
                priority: 5,
                evaluate: (game, schedule, context) => {
                    return { valid: true, score: 10, violations: [] };
                }
            };

            evaluator.registerConstraint(customConstraint);
            expect(evaluator.hasConstraint('CUSTOM_TEST_CONSTRAINT')).toBe(true);
        });

        test('should validate constraint structure on registration', () => {
            const invalidConstraint = {
                name: 'INVALID_CONSTRAINT'
                // Missing required fields
            };

            expect(() => evaluator.registerConstraint(invalidConstraint))
                .toThrow('Invalid constraint structure');
        });

        test('should update existing constraints', () => {
            const constraint1 = {
                name: 'TEST_CONSTRAINT',
                priority: 5,
                evaluate: () => ({ valid: true, score: 5 })
            };

            const constraint2 = {
                name: 'TEST_CONSTRAINT',
                priority: 8,
                evaluate: () => ({ valid: true, score: 8 })
            };

            evaluator.registerConstraint(constraint1);
            expect(evaluator.getConstraint('TEST_CONSTRAINT').priority).toBe(5);

            evaluator.registerConstraint(constraint2);
            expect(evaluator.getConstraint('TEST_CONSTRAINT').priority).toBe(8);
        });

        test('should unregister constraints', () => {
            const constraint = {
                name: 'TEMP_CONSTRAINT',
                priority: 1,
                evaluate: () => ({ valid: true, score: 1 })
            };

            evaluator.registerConstraint(constraint);
            expect(evaluator.hasConstraint('TEMP_CONSTRAINT')).toBe(true);

            evaluator.unregisterConstraint('TEMP_CONSTRAINT');
            expect(evaluator.hasConstraint('TEMP_CONSTRAINT')).toBe(false);
        });
    });

    describe('Basic Evaluation', () => {
        test('should evaluate a single game against constraints', () => {
            const game = global.testData.createGame({
                homeTeamId: 'team1',
                awayTeamId: 'team2',
                date: new Date('2025-09-01T12:00:00Z'),
                venue: 'Stadium A'
            });

            const result = evaluator.evaluateGame(game);

            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('violations');
            expect(result).toHaveProperty('constraintResults');
            expect(Array.isArray(result.violations)).toBe(true);
            expect(Array.isArray(result.constraintResults)).toBe(true);
        });

        test('should evaluate a complete schedule', () => {
            const schedule = global.testData.createSchedule(5);

            const result = evaluator.evaluateSchedule(schedule);

            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('totalScore');
            expect(result).toHaveProperty('gameResults');
            expect(result).toHaveProperty('globalViolations');
            expect(Array.isArray(result.gameResults)).toBe(true);
            expect(result.gameResults).toHaveLength(5);
        });

        test('should respect constraint priorities', () => {
            const highPriorityConstraint = {
                name: 'HIGH_PRIORITY',
                priority: 10,
                evaluate: () => ({ valid: false, score: 0, violations: ['High priority violation'] })
            };

            const lowPriorityConstraint = {
                name: 'LOW_PRIORITY',
                priority: 1,
                evaluate: () => ({ valid: false, score: 0, violations: ['Low priority violation'] })
            };

            evaluator.registerConstraint(highPriorityConstraint);
            evaluator.registerConstraint(lowPriorityConstraint);

            const game = global.testData.createGame();
            const result = evaluator.evaluateGame(game);

            // High priority violations should appear first
            expect(result.violations[0]).toContain('High priority');
        });
    });

    describe('Performance and Caching', () => {
        test('should cache evaluation results', () => {
            const game = global.testData.createGame();
            
            // First evaluation
            const start1 = process.hrtime.bigint();
            const result1 = evaluator.evaluateGame(game);
            const time1 = Number(process.hrtime.bigint() - start1) / 1000000;

            // Second evaluation (should be cached)
            const start2 = process.hrtime.bigint();
            const result2 = evaluator.evaluateGame(game);
            const time2 = Number(process.hrtime.bigint() - start2) / 1000000;

            expect(result1).toEqual(result2);
            expect(time2).toBeLessThan(time1 * 0.1); // Cached should be much faster
        });

        test('should invalidate cache when constraints change', () => {
            const game = global.testData.createGame();
            
            // Initial evaluation
            evaluator.evaluateGame(game);
            expect(evaluator.cache.size).toBeGreaterThan(0);

            // Add new constraint
            evaluator.registerConstraint({
                name: 'NEW_CONSTRAINT',
                priority: 5,
                evaluate: () => ({ valid: true, score: 5 })
            });

            // Cache should be invalidated
            expect(evaluator.cache.size).toBe(0);
        });

        test('should handle parallel evaluation efficiently', async () => {
            const games = Array.from({ length: 100 }, () => global.testData.createGame());

            const sequentialStart = process.hrtime.bigint();
            for (const game of games) {
                evaluator.evaluateGame(game);
            }
            const sequentialTime = Number(process.hrtime.bigint() - sequentialStart) / 1000000;

            // Clear cache for fair comparison
            evaluator.clearCache();

            const parallelStart = process.hrtime.bigint();
            await evaluator.evaluateGamesParallel(games);
            const parallelTime = Number(process.hrtime.bigint() - parallelStart) / 1000000;

            // Parallel should be faster (though cache might affect this)
            expect(parallelTime).toBeLessThan(sequentialTime * 1.5);
        });
    });

    describe('Constraint-Specific Evaluations', () => {
        test('should evaluate date constraints properly', () => {
            const conflictingGames = [
                global.testData.createGame({
                    homeTeamId: 'team1',
                    date: new Date('2025-09-01T12:00:00Z')
                }),
                global.testData.createGame({
                    homeTeamId: 'team1',
                    date: new Date('2025-09-01T15:00:00Z') // Same day
                })
            ];

            const schedule = {
                ...global.testData.createSchedule(0),
                games: conflictingGames
            };

            const result = evaluator.evaluateSchedule(schedule);
            expect(result.valid).toBe(false);
            expect(result.globalViolations.some(v => v.includes('date'))).toBe(true);
        });

        test('should evaluate venue availability constraints', () => {
            const venueConflictGames = [
                global.testData.createGame({
                    venue: 'Stadium A',
                    date: new Date('2025-09-01T12:00:00Z')
                }),
                global.testData.createGame({
                    venue: 'Stadium A',
                    date: new Date('2025-09-01T12:00:00Z') // Same venue, same time
                })
            ];

            const schedule = {
                ...global.testData.createSchedule(0),
                games: venueConflictGames
            };

            const result = evaluator.evaluateSchedule(schedule);
            expect(result.valid).toBe(false);
            expect(result.globalViolations.some(v => v.includes('venue'))).toBe(true);
        });

        test('should evaluate travel constraints', () => {
            const travelConstraintGame = global.testData.createGame({
                homeTeamId: 'team1',
                awayTeamId: 'team2',
                date: new Date('2025-09-01T12:00:00Z')
            });

            // Add context with previous game for travel constraint
            const context = {
                previousGames: {
                    team2: {
                        venue: 'Far Away Stadium',
                        date: new Date('2025-08-31T20:00:00Z') // Day before
                    }
                }
            };

            const result = evaluator.evaluateGame(travelConstraintGame, null, context);
            
            // Should have travel-related evaluation
            expect(result.constraintResults.some(cr => 
                cr.constraintName.includes('TRAVEL')
            )).toBe(true);
        });

        test('should evaluate rest day constraints', () => {
            const quickTurnaroundGames = [
                global.testData.createGame({
                    homeTeamId: 'team1',
                    date: new Date('2025-09-01T20:00:00Z')
                }),
                global.testData.createGame({
                    awayTeamId: 'team1',
                    date: new Date('2025-09-02T12:00:00Z') // Less than 24 hours
                })
            ];

            const schedule = {
                ...global.testData.createSchedule(0),
                games: quickTurnaroundGames
            };

            const result = evaluator.evaluateSchedule(schedule);
            expect(result.globalViolations.some(v => 
                v.includes('rest') || v.includes('turnaround')
            )).toBe(true);
        });
    });

    describe('Sport-Specific Constraints', () => {
        test('should apply football-specific constraints', () => {
            evaluator.setSport('football');

            const footballGame = global.testData.createGame({
                sport: 'Football',
                date: new Date('2025-09-06T12:00:00Z') // Saturday
            });

            const result = evaluator.evaluateGame(footballGame);
            
            // Football games should prefer weekends
            expect(result.score).toBeGreaterThan(0);
        });

        test('should apply basketball-specific constraints', () => {
            evaluator.setSport('basketball');

            const basketballGame = global.testData.createGame({
                sport: 'Basketball',
                date: new Date('2025-01-15T19:00:00Z') // Weekday evening
            });

            const result = evaluator.evaluateGame(basketballGame);
            expect(result.constraintResults.length).toBeGreaterThan(0);
        });

        test('should handle sport transitions', () => {
            evaluator.setSport('football');
            expect(evaluator.currentSport).toBe('football');

            evaluator.setSport('basketball');
            expect(evaluator.currentSport).toBe('basketball');

            // Cache should be cleared on sport change
            expect(evaluator.cache.size).toBe(0);
        });
    });

    describe('Advanced Features', () => {
        test('should support weighted constraint evaluation', () => {
            const weightedConstraint = {
                name: 'WEIGHTED_CONSTRAINT',
                priority: 5,
                weight: 2.0,
                evaluate: () => ({ valid: true, score: 10 })
            };

            evaluator.registerConstraint(weightedConstraint);

            const game = global.testData.createGame();
            const result = evaluator.evaluateGame(game);

            // Find the weighted constraint result
            const weightedResult = result.constraintResults.find(cr => 
                cr.constraintName === 'WEIGHTED_CONSTRAINT'
            );

            expect(weightedResult.weightedScore).toBe(20); // 10 * 2.0
        });

        test('should provide detailed violation explanations', () => {
            const explanatoryConstraint = {
                name: 'EXPLANATORY_CONSTRAINT',
                priority: 5,
                evaluate: (game) => ({
                    valid: false,
                    score: 0,
                    violations: [`Game ${game.id} violates time slot preference`],
                    explanation: 'This game is scheduled outside preferred time slots'
                })
            };

            evaluator.registerConstraint(explanatoryConstraint);

            const game = global.testData.createGame();
            const result = evaluator.evaluateGame(game);

            const explanatoryResult = result.constraintResults.find(cr => 
                cr.constraintName === 'EXPLANATORY_CONSTRAINT'
            );

            expect(explanatoryResult.explanation).toContain('time slots');
        });

        test('should support conditional constraints', () => {
            const conditionalConstraint = {
                name: 'CONDITIONAL_CONSTRAINT',
                priority: 5,
                condition: (game, schedule, context) => game.sport === 'Football',
                evaluate: () => ({ valid: true, score: 10 })
            };

            evaluator.registerConstraint(conditionalConstraint);

            const footballGame = global.testData.createGame({ sport: 'Football' });
            const basketballGame = global.testData.createGame({ sport: 'Basketball' });

            const footballResult = evaluator.evaluateGame(footballGame);
            const basketballResult = evaluator.evaluateGame(basketballGame);

            const footballConditional = footballResult.constraintResults.find(cr => 
                cr.constraintName === 'CONDITIONAL_CONSTRAINT'
            );
            const basketballConditional = basketballResult.constraintResults.find(cr => 
                cr.constraintName === 'CONDITIONAL_CONSTRAINT'
            );

            expect(footballConditional).toBeDefined();
            expect(basketballConditional).toBeUndefined();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle invalid game data gracefully', () => {
            const invalidGame = {
                id: null,
                homeTeamId: undefined,
                date: 'invalid-date'
            };

            expect(() => evaluator.evaluateGame(invalidGame)).not.toThrow();
            
            const result = evaluator.evaluateGame(invalidGame);
            expect(result.valid).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
        });

        test('should handle empty schedules', () => {
            const emptySchedule = {
                ...global.testData.createSchedule(0),
                games: []
            };

            const result = evaluator.evaluateSchedule(emptySchedule);
            expect(result.valid).toBe(true);
            expect(result.gameResults).toEqual([]);
            expect(result.totalScore).toBe(0);
        });

        test('should handle constraint evaluation errors', () => {
            const errorConstraint = {
                name: 'ERROR_CONSTRAINT',
                priority: 5,
                evaluate: () => {
                    throw new Error('Constraint evaluation error');
                }
            };

            evaluator.registerConstraint(errorConstraint);

            const game = global.testData.createGame();
            const result = evaluator.evaluateGame(game);

            // Should not crash, but should report the error
            expect(result.violations.some(v => v.includes('error'))).toBe(true);
        });

        test('should handle circular schedule references', () => {
            const schedule = global.testData.createSchedule(2);
            schedule.parent = schedule; // Circular reference

            expect(() => evaluator.evaluateSchedule(schedule)).not.toThrow();
        });
    });

    describe('Memory and Performance', () => {
        test('should manage memory efficiently with large schedules', () => {
            const largeSchedule = global.testData.createSchedule(1000);
            const initialMemory = global.testUtils.getMemoryUsage();

            const result = evaluator.evaluateSchedule(largeSchedule);

            const finalMemory = global.testUtils.getMemoryUsage();
            const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;

            expect(result).toBeDefined();
            expect(memoryDelta).toBeLessThan(100); // Less than 100MB increase
        });

        test('should maintain performance under concurrent evaluation', async () => {
            const games = Array.from({ length: 50 }, () => global.testData.createGame());

            const concurrentPromises = games.map(game => 
                Promise.resolve(evaluator.evaluateGame(game))
            );

            const start = process.hrtime.bigint();
            const results = await Promise.all(concurrentPromises);
            const duration = Number(process.hrtime.bigint() - start) / 1000000;

            expect(results).toHaveLength(50);
            expect(duration).toBeLessThan(1000); // Under 1 second
        });

        test('should clean up resources properly', () => {
            const initialMemory = global.testUtils.getMemoryUsage();

            // Create lots of cached evaluations
            for (let i = 0; i < 100; i++) {
                const game = global.testData.createGame();
                evaluator.evaluateGame(game);
            }

            evaluator.destroy();

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = global.testUtils.getMemoryUsage();
            const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;

            expect(memoryDelta).toBeLessThan(50); // Memory should be released
        });
    });
});

module.exports = {
    createTestEvaluator: (config = {}) => new ConstraintEvaluator({
        enableParallelProcessing: false,
        cacheEnabled: true,
        maxCacheSize: 100,
        ...config
    })
};