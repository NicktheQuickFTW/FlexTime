/**
 * Schedule Equivalence Tests
 * 
 * Validates that new microservices produce functionally equivalent
 * schedules compared to the legacy monolithic system.
 */

const ResultComparisonEngine = require('../utilities/result-comparison-engine');
const TestScenarioGenerator = require('../test-data/generate-test-scenarios');
const LegacySystemClient = require('./clients/legacy-system-client');
const MicroserviceClient = require('./clients/microservice-client');
const logger = require('../utilities/logger');
const config = require('../config/test.config');

describe('Schedule Functional Equivalence', () => {
  let legacyClient;
  let microserviceClient;
  let comparisonEngine;
  let scenarioGenerator;

  beforeAll(async () => {
    logger.info('Setting up functional equivalence test suite');
    
    // Initialize clients
    legacyClient = new LegacySystemClient(config.legacy);
    microserviceClient = new MicroserviceClient(config.microservices);
    comparisonEngine = new ResultComparisonEngine();
    scenarioGenerator = new TestScenarioGenerator();
    
    // Verify both systems are available
    await expect(legacyClient.healthCheck()).resolves.toBeTruthy();
    await expect(microserviceClient.healthCheck()).resolves.toBeTruthy();
    
    logger.info('Functional equivalence test suite setup completed');
  });

  afterAll(async () => {
    // Generate comparison report
    const summary = comparisonEngine.getSummary();
    logger.info('Functional equivalence test summary', summary);
    
    // Cleanup
    await legacyClient.disconnect();
    await microserviceClient.disconnect();
  });

  describe('Basic Schedule Generation', () => {
    test('Football schedule generation should be equivalent', async () => {
      const timer = logger.startTimer('football-schedule-equivalence');
      
      // Generate test scenario
      const scenario = await scenarioGenerator.generateBasicFootballScenario();
      logger.testStart('Football Schedule Equivalence', { scenarioId: scenario.id });
      
      try {
        // Generate schedule with legacy system
        const legacyResult = await legacyClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        // Generate schedule with microservices
        const microserviceResult = await microserviceClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        // Compare results
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `football-equivalence-${Date.now()}`
        );
        
        // Assertions
        expect(comparison.equivalent).toBeTruthy();
        expect(comparison.differences.filter(d => d.severity === 'CRITICAL')).toHaveLength(0);
        
        logger.testComplete('Football Schedule Equivalence', true, comparison.summary);
        
      } catch (error) {
        logger.testComplete('Football Schedule Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Basketball schedule generation should be equivalent', async () => {
      const timer = logger.startTimer('basketball-schedule-equivalence');
      
      const scenario = await scenarioGenerator.generateBasicBasketballScenario();
      logger.testStart('Basketball Schedule Equivalence', { scenarioId: scenario.id });
      
      try {
        const legacyResult = await legacyClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        const microserviceResult = await microserviceClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `basketball-equivalence-${Date.now()}`
        );
        
        expect(comparison.equivalent).toBeTruthy();
        expect(comparison.differences.filter(d => d.severity === 'CRITICAL')).toHaveLength(0);
        
        logger.testComplete('Basketball Schedule Equivalence', true, comparison.summary);
        
      } catch (error) {
        logger.testComplete('Basketball Schedule Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Small team set schedule should be equivalent', async () => {
      const timer = logger.startTimer('small-team-schedule-equivalence');
      
      const scenario = await scenarioGenerator.generateSmallTeamScenario();
      logger.testStart('Small Team Schedule Equivalence', { scenarioId: scenario.id });
      
      try {
        const legacyResult = await legacyClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        const microserviceResult = await microserviceClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `small-team-equivalence-${Date.now()}`
        );
        
        expect(comparison.equivalent).toBeTruthy();
        expect(comparison.differences.filter(d => d.severity === 'CRITICAL')).toHaveLength(0);
        
        logger.testComplete('Small Team Schedule Equivalence', true, comparison.summary);
        
      } catch (error) {
        logger.testComplete('Small Team Schedule Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Constraint Processing Equivalence', () => {
    test('Travel optimization should produce equivalent results', async () => {
      const timer = logger.startTimer('travel-optimization-equivalence');
      
      logger.testStart('Travel Optimization Equivalence');
      
      try {
        // Create scenario with travel constraints
        const teams = scenarioGenerator.teams.slice(0, 8);
        const constraints = [
          {
            id: 'minimize_travel',
            type: 'travel',
            description: 'Minimize total travel distance',
            rule: 'minimize_total_travel_distance'
          }
        ];
        
        const legacyResult = await legacyClient.optimizeTravel({
          teams: teams,
          constraints: constraints
        });
        
        const microserviceResult = await microserviceClient.optimizeTravel({
          teams: teams,
          constraints: constraints
        });
        
        // Compare travel optimization results
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `travel-optimization-${Date.now()}`
        );
        
        // Travel optimization may have different valid solutions
        // Allow for some variance in total distance while ensuring logical consistency
        const travelDistanceDiff = Math.abs(
          legacyResult.totalTravelDistance - microserviceResult.totalTravelDistance
        );
        const maxAllowedVariance = legacyResult.totalTravelDistance * 0.1; // 10% variance
        
        expect(travelDistanceDiff).toBeLessThanOrEqual(maxAllowedVariance);
        expect(comparison.differences.filter(d => d.severity === 'CRITICAL')).toHaveLength(0);
        
        logger.testComplete('Travel Optimization Equivalence', true, {
          legacyDistance: legacyResult.totalTravelDistance,
          microserviceDistance: microserviceResult.totalTravelDistance,
          variance: travelDistanceDiff
        });
        
      } catch (error) {
        logger.testComplete('Travel Optimization Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Venue assignment should be equivalent', async () => {
      const timer = logger.startTimer('venue-assignment-equivalence');
      
      logger.testStart('Venue Assignment Equivalence');
      
      try {
        const teams = scenarioGenerator.teams.slice(0, 6);
        const venues = scenarioGenerator.getVenuesForTeams(teams);
        
        const legacyResult = await legacyClient.assignVenues({
          teams: teams,
          venues: venues,
          sport: 'football'
        });
        
        const microserviceResult = await microserviceClient.assignVenues({
          teams: teams,
          venues: venues,
          sport: 'football'
        });
        
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `venue-assignment-${Date.now()}`
        );
        
        expect(comparison.equivalent).toBeTruthy();
        expect(comparison.differences.filter(d => d.severity === 'CRITICAL')).toHaveLength(0);
        
        logger.testComplete('Venue Assignment Equivalence', true, comparison.summary);
        
      } catch (error) {
        logger.testComplete('Venue Assignment Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Championship date constraints should be handled equivalently', async () => {
      const timer = logger.startTimer('championship-constraint-equivalence');
      
      logger.testStart('Championship Constraint Equivalence');
      
      try {
        const championshipConstraints = [
          {
            id: 'championship_week_blackout',
            type: 'temporal',
            description: 'No regular season games during championship week',
            rule: 'no_games_during_championship_week',
            dates: ['2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12']
          }
        ];
        
        const scenario = await scenarioGenerator.generateBasicBasketballScenario();
        scenario.constraints.push(...championshipConstraints);
        
        const legacyResult = await legacyClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        const microserviceResult = await microserviceClient.generateSchedule({
          sport: scenario.sport.id,
          teams: scenario.teams,
          constraints: scenario.constraints,
          parameters: scenario.parameters
        });
        
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `championship-constraint-${Date.now()}`
        );
        
        // Verify no games are scheduled during championship week
        const championshipDates = new Set(championshipConstraints[0].dates);
        
        legacyResult.games.forEach(game => {
          const gameDate = new Date(game.date).toISOString().split('T')[0];
          expect(championshipDates.has(gameDate)).toBeFalsy();
        });
        
        microserviceResult.games.forEach(game => {
          const gameDate = new Date(game.date).toISOString().split('T')[0];
          expect(championshipDates.has(gameDate)).toBeFalsy();
        });
        
        expect(comparison.equivalent).toBeTruthy();
        
        logger.testComplete('Championship Constraint Equivalence', true, comparison.summary);
        
      } catch (error) {
        logger.testComplete('Championship Constraint Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Data Integrity Equivalence', () => {
    test('Team data should be consistent across systems', async () => {
      const timer = logger.startTimer('team-data-equivalence');
      
      logger.testStart('Team Data Equivalence');
      
      try {
        const legacyTeams = await legacyClient.getTeams();
        const microserviceTeams = await microserviceClient.getTeams();
        
        // Compare team data
        expect(legacyTeams.length).toBe(microserviceTeams.length);
        
        const legacyTeamMap = new Map(legacyTeams.map(t => [t.id, t]));
        const microserviceTeamMap = new Map(microserviceTeams.map(t => [t.id, t]));
        
        for (const [teamId, legacyTeam] of legacyTeamMap) {
          const microserviceTeam = microserviceTeamMap.get(teamId);
          expect(microserviceTeam).toBeDefined();
          expect(microserviceTeam.name).toBe(legacyTeam.name);
          expect(microserviceTeam.mascot).toBe(legacyTeam.mascot);
        }
        
        logger.testComplete('Team Data Equivalence', true, {
          legacyTeamCount: legacyTeams.length,
          microserviceTeamCount: microserviceTeams.length
        });
        
      } catch (error) {
        logger.testComplete('Team Data Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });

    test('Venue data should be consistent across systems', async () => {
      const timer = logger.startTimer('venue-data-equivalence');
      
      logger.testStart('Venue Data Equivalence');
      
      try {
        const legacyVenues = await legacyClient.getVenues();
        const microserviceVenues = await microserviceClient.getVenues();
        
        expect(legacyVenues.length).toBe(microserviceVenues.length);
        
        const legacyVenueMap = new Map(legacyVenues.map(v => [v.id, v]));
        const microserviceVenueMap = new Map(microserviceVenues.map(v => [v.id, v]));
        
        for (const [venueId, legacyVenue] of legacyVenueMap) {
          const microserviceVenue = microserviceVenueMap.get(venueId);
          expect(microserviceVenue).toBeDefined();
          expect(microserviceVenue.name).toBe(legacyVenue.name);
          expect(microserviceVenue.capacity).toBe(legacyVenue.capacity);
        }
        
        logger.testComplete('Venue Data Equivalence', true, {
          legacyVenueCount: legacyVenues.length,
          microserviceVenueCount: microserviceVenues.length
        });
        
      } catch (error) {
        logger.testComplete('Venue Data Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });

  describe('Algorithm Equivalence', () => {
    test('Round robin algorithm should produce equivalent schedules', async () => {
      const timer = logger.startTimer('round-robin-equivalence');
      
      logger.testStart('Round Robin Algorithm Equivalence');
      
      try {
        const teams = scenarioGenerator.teams.slice(0, 6);
        const parameters = {
          algorithm: 'round_robin',
          homeAndAway: true
        };
        
        const legacyResult = await legacyClient.generateSchedule({
          sport: 'football',
          teams: teams,
          constraints: [],
          parameters: parameters
        });
        
        const microserviceResult = await microserviceClient.generateSchedule({
          sport: 'football',
          teams: teams,
          constraints: [],
          parameters: parameters
        });
        
        // Verify round robin properties
        const expectedGames = teams.length * (teams.length - 1); // Home and away
        
        expect(legacyResult.games.length).toBe(expectedGames);
        expect(microserviceResult.games.length).toBe(expectedGames);
        
        // Verify each team plays every other team twice (home and away)
        const legacyMatchups = new Set();
        const microserviceMatchups = new Set();
        
        legacyResult.games.forEach(game => {
          legacyMatchups.add(`${game.homeTeam}-${game.awayTeam}`);
        });
        
        microserviceResult.games.forEach(game => {
          microserviceMatchups.add(`${game.homeTeam}-${game.awayTeam}`);
        });
        
        expect(legacyMatchups.size).toBe(expectedGames);
        expect(microserviceMatchups.size).toBe(expectedGames);
        
        const comparison = await comparisonEngine.compareSchedules(
          legacyResult,
          microserviceResult,
          `round-robin-equivalence-${Date.now()}`
        );
        
        expect(comparison.equivalent).toBeTruthy();
        
        logger.testComplete('Round Robin Algorithm Equivalence', true, comparison.summary);
        
      } catch (error) {
        logger.testComplete('Round Robin Algorithm Equivalence', false, { error: error.message });
        throw error;
      } finally {
        timer();
      }
    });
  });
});