/**
 * End-to-End Scheduling Workflows Integration Tests
 * Tests complete scheduling workflows from start to finish
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../../../index');
const FTBuilderEngine = require('../../FT_Builder_Engine_v2');
const ConstraintEvaluator = require('../../ConstraintEvaluator');
const PerformanceMonitor = require('../../PerformanceMonitor');

describe('End-to-End Scheduling Workflows', () => {
    let engine;
    let constraintEvaluator;
    let performanceMonitor;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        engine = new FTBuilderEngine();
        constraintEvaluator = new ConstraintEvaluator();
        performanceMonitor = new PerformanceMonitor();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Complete Schedule Generation Workflow', () => {
        it('should generate a full Big 12 basketball schedule', async function() {
            this.timeout(30000); // 30 second timeout for complex operations

            const scheduleRequest = {
                sport: 'basketball',
                conference: 'big12',
                season: '2025-26',
                teams: [
                    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati',
                    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State',
                    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
                ],
                constraints: {
                    maxConsecutiveAway: 2,
                    minRestDays: 1,
                    rivalryGames: [
                        { teams: ['Kansas', 'Kansas State'], count: 2 },
                        { teams: ['Baylor', 'TCU'], count: 2 }
                    ],
                    venueAvailability: {
                        'Kansas': ['2025-01-15', '2025-02-20'], // unavailable dates
                        'Baylor': ['2025-03-01', '2025-03-05']
                    }
                },
                preferences: {
                    travelOptimization: true,
                    championshipPreparation: true,
                    broadcastWindows: ['Saturday', 'Tuesday']
                }
            };

            // Start performance monitoring
            const workflowId = 'e2e-basketball-schedule-' + Date.now();
            performanceMonitor.startWorkflow(workflowId);

            try {
                // Step 1: Initialize schedule generation
                const initResult = await engine.initializeSchedule(scheduleRequest);
                expect(initResult.success).to.be.true;
                expect(initResult.scheduleId).to.exist;

                // Step 2: Generate preliminary schedule
                const prelimResult = await engine.generatePreliminarySchedule(initResult.scheduleId);
                expect(prelimResult.success).to.be.true;
                expect(prelimResult.games).to.have.length.at.least(240); // 16 teams * 15 opponents

                // Step 3: Apply constraints
                const constraintResult = await constraintEvaluator.evaluateSchedule(
                    prelimResult.games,
                    scheduleRequest.constraints
                );
                expect(constraintResult.isValid).to.be.true;
                expect(constraintResult.violations).to.have.length(0);

                // Step 4: Optimize schedule
                const optimizedResult = await engine.optimizeSchedule(
                    prelimResult.games,
                    scheduleRequest.preferences
                );
                expect(optimizedResult.success).to.be.true;
                expect(optimizedResult.optimizationScore).to.be.at.least(0.8);

                // Step 5: Generate final schedule
                const finalResult = await engine.finalizeSchedule(
                    optimizedResult.schedule,
                    initResult.scheduleId
                );
                expect(finalResult.success).to.be.true;
                expect(finalResult.schedule.games).to.have.length.at.least(240);

                // Verify schedule integrity
                const integrity = await engine.verifyScheduleIntegrity(finalResult.schedule);
                expect(integrity.isValid).to.be.true;
                expect(integrity.completeness).to.equal(1.0);

                // Stop performance monitoring and verify metrics
                const metrics = performanceMonitor.endWorkflow(workflowId);
                expect(metrics.totalTime).to.be.below(25000); // Should complete in under 25 seconds
                expect(metrics.memoryUsage.peak).to.be.below(500 * 1024 * 1024); // Under 500MB

            } catch (error) {
                performanceMonitor.endWorkflow(workflowId);
                throw error;
            }
        });

        it('should handle schedule modification workflow', async function() {
            this.timeout(15000);

            // Create initial schedule
            const initialSchedule = await engine.generateBasicSchedule({
                sport: 'football',
                teams: ['Kansas', 'Kansas State', 'Baylor', 'TCU'],
                season: '2025'
            });

            expect(initialSchedule.success).to.be.true;
            const scheduleId = initialSchedule.scheduleId;

            // Modify schedule - add constraint
            const modificationResult = await engine.modifySchedule(scheduleId, {
                action: 'addConstraint',
                constraint: {
                    type: 'venue_unavailability',
                    team: 'Kansas',
                    dates: ['2025-10-15']
                }
            });

            expect(modificationResult.success).to.be.true;
            expect(modificationResult.affectedGames).to.exist;

            // Verify constraint application
            const updatedSchedule = await engine.getSchedule(scheduleId);
            const conflictingGames = updatedSchedule.games.filter(game => 
                game.homeTeam === 'Kansas' && game.date === '2025-10-15'
            );
            expect(conflictingGames).to.have.length(0);
        });

        it('should handle emergency rescheduling workflow', async function() {
            this.timeout(10000);

            // Create schedule with specific game
            const schedule = await engine.generateBasicSchedule({
                sport: 'basketball',
                teams: ['Arizona', 'Arizona State', 'Utah', 'Colorado']
            });

            const scheduleId = schedule.scheduleId;
            const originalGames = schedule.games;
            const gameToReschedule = originalGames[0];

            // Emergency reschedule due to weather/facility issue
            const rescheduleResult = await engine.emergencyReschedule(scheduleId, {
                gameId: gameToReschedule.id,
                reason: 'facility_unavailable',
                urgency: 'high',
                constraints: {
                    mustScheduleBy: '2025-03-01',
                    availableVenues: ['neutral_site_1', 'neutral_site_2']
                }
            });

            expect(rescheduleResult.success).to.be.true;
            expect(rescheduleResult.newDate).to.exist;
            expect(rescheduleResult.cascadeEffects).to.exist;

            // Verify no conflicts created
            const finalSchedule = await engine.getSchedule(scheduleId);
            const conflicts = await constraintEvaluator.findConflicts(finalSchedule.games);
            expect(conflicts).to.have.length(0);
        });
    });

    describe('Multi-Sport Integration Workflow', () => {
        it('should coordinate schedules across multiple sports', async function() {
            this.timeout(20000);

            const sportsSchedules = [
                {
                    sport: 'basketball',
                    teams: ['Kansas', 'Kansas State', 'Baylor', 'TCU'],
                    priority: 'high'
                },
                {
                    sport: 'baseball',
                    teams: ['Kansas', 'Kansas State', 'Baylor', 'TCU'],
                    priority: 'medium'
                }
            ];

            const coordinationResult = await engine.coordinateMultiSportSchedules(sportsSchedules, {
                sharedVenues: {
                    'Kansas': ['Allen Fieldhouse', 'Hoglund Ballpark'],
                    'Baylor': ['Ferrell Center', 'Baylor Ballpark']
                },
                conflictResolution: 'priority_based'
            });

            expect(coordinationResult.success).to.be.true;
            expect(coordinationResult.schedules).to.have.length(2);

            // Verify no venue conflicts
            const allGames = coordinationResult.schedules.reduce((acc, schedule) => 
                acc.concat(schedule.games), []
            );

            const venueConflicts = await constraintEvaluator.findVenueConflicts(allGames);
            expect(venueConflicts).to.have.length(0);
        });
    });

    describe('Real-time Updates Workflow', () => {
        it('should handle real-time constraint updates', async function() {
            this.timeout(8000);

            const scheduleId = 'test-schedule-' + Date.now();
            
            // Create initial schedule
            await engine.initializeSchedule({
                sport: 'basketball',
                teams: ['Arizona', 'Utah'],
                scheduleId
            });

            // Simulate real-time constraint update
            const updateResult = await engine.handleRealTimeUpdate(scheduleId, {
                type: 'constraint_change',
                constraint: {
                    type: 'venue_unavailability',
                    team: 'Arizona',
                    date: '2025-02-15',
                    reason: 'facility_maintenance'
                },
                timestamp: new Date().toISOString()
            });

            expect(updateResult.success).to.be.true;
            expect(updateResult.propagationTime).to.be.below(1000); // Under 1 second
            expect(updateResult.affectedComponents).to.include('schedule_engine');
        });
    });

    describe('Error Recovery Workflow', () => {
        it('should recover from scheduling failures gracefully', async function() {
            this.timeout(10000);

            // Create scenario that will initially fail
            const impossibleRequest = {
                sport: 'basketball',
                teams: ['Team1', 'Team2'],
                constraints: {
                    maxGames: 1, // Impossible - need at least 2 games for round-robin
                    minGames: 10
                }
            };

            const result = await engine.generateScheduleWithRecovery(impossibleRequest);

            expect(result.success).to.be.false;
            expect(result.recoveryAttempted).to.be.true;
            expect(result.fallbackSolution).to.exist;
            expect(result.fallbackSolution.games.length).to.be.at.least(1);
        });

        it('should handle partial system failures', async function() {
            this.timeout(8000);

            // Mock constraint evaluator failure
            sandbox.stub(constraintEvaluator, 'evaluateSchedule')
                .onFirstCall().rejects(new Error('Service temporarily unavailable'))
                .onSecondCall().resolves({ isValid: true, violations: [] });

            const scheduleRequest = {
                sport: 'football',
                teams: ['Kansas', 'Kansas State']
            };

            const result = await engine.generateScheduleWithRetry(scheduleRequest, {
                maxRetries: 3,
                retryDelay: 100
            });

            expect(result.success).to.be.true;
            expect(result.retriesUsed).to.equal(1);
        });
    });

    describe('Data Consistency Workflow', () => {
        it('should maintain data consistency across operations', async function() {
            this.timeout(12000);

            const scheduleId = 'consistency-test-' + Date.now();
            
            // Create schedule
            const schedule = await engine.initializeSchedule({
                sport: 'basketball',
                teams: ['Arizona', 'Arizona State', 'Utah', 'Colorado'],
                scheduleId
            });

            // Perform multiple concurrent operations
            const operations = [
                engine.addGame(scheduleId, { homeTeam: 'Arizona', awayTeam: 'Utah' }),
                engine.addConstraint(scheduleId, { type: 'rest_days', value: 2 }),
                engine.updateTeamPreferences(scheduleId, 'Arizona', { preferredDays: ['Saturday'] })
            ];

            const results = await Promise.all(operations);
            results.forEach(result => expect(result.success).to.be.true);

            // Verify data consistency
            const finalSchedule = await engine.getSchedule(scheduleId);
            const consistencyCheck = await engine.verifyDataConsistency(finalSchedule);
            
            expect(consistencyCheck.isConsistent).to.be.true;
            expect(consistencyCheck.issues).to.have.length(0);
        });
    });
});