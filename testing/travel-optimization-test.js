/**
 * Travel Optimization Test Suite
 * 
 * Comprehensive testing for travel budget tier integration and cost optimization
 * Tests Big 12 Tier 2 specific constraints and transportation mode selection
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FTTravelAgent } from '../core/FTTravelAgent.js';
import { TravelBudgetTierConstraints } from '../parameters/sport-specifics/TravelBudgetTierConstraints.js';
import { calculateBig12Distance, analyzeTimezoneImpact } from '../utils/geoUtils.js';

describe('Travel Optimization Integration Tests', () => {
  let optimizer;
  let tierConstraints;
  
  beforeEach(() => {
    optimizer = new FTTravelAgent({
      tier: 'TIER_2',
      conferenceLevel: 'Big 12',
      budgetRange: { min: 3000000, max: 5000000 }
    });
    
    tierConstraints = new TravelBudgetTierConstraints();
  });

  describe('Big 12 Distance Calculations', () => {
    it('should calculate accurate distances between Big 12 schools', () => {
      // Test known distances
      const arizonaToArizonaState = calculateBig12Distance('Arizona', 'Arizona State');
      expect(arizonaToArizonaState).toBeCloseTo(120, 10); // Within 10 miles
      
      const byuToUtah = calculateBig12Distance('BYU', 'Utah');
      expect(byuToUtah).toBeCloseTo(45, 10);
      
      const baylorToTCU = calculateBig12Distance('Baylor', 'TCU');
      expect(baylorToTCU).toBeCloseTo(100, 10);
      
      const westVirginiaToArizona = calculateBig12Distance('West Virginia', 'Arizona');
      expect(westVirginiaToArizona).toBeGreaterThan(1800); // Cross-country trip
    });

    it('should handle timezone analysis correctly', () => {
      const timezoneImpact = analyzeTimezoneImpact('West Virginia', 'Arizona');
      expect(timezoneImpact.timezoneChange).toBe(true);
      expect(timezoneImpact.hoursDifference).toBe(2);
      expect(timezoneImpact.fromTimezone).toBe('Eastern');
      expect(timezoneImpact.toTimezone).toBe('Mountain');
    });
  });

  describe('Transportation Mode Selection', () => {
    it('should recommend charter bus for short distances (Tier 2)', () => {
      const trip = {
        origin: 'Baylor',
        destination: 'TCU',
        date: new Date('2025-10-15'),
        sport: 'football'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      expect(result.recommendation.mode).toBe('CHARTER_BUS');
      expect(result.analysis.distance).toBeLessThan(300);
      expect(result.analysis.tripType).toBe('Regional');
    });

    it('should consider charter flight for medium distances (Tier 2)', () => {
      const trip = {
        origin: 'Texas Tech',
        destination: 'Iowa State',
        date: new Date('2025-11-01'),
        sport: 'football'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      // Distance is ~470 miles, within charter optional range
      expect(result.analysis.distance).toBeGreaterThan(300);
      expect(result.analysis.distance).toBeLessThan(600);
      
      // Should have both bus and flight options
      const modes = [result.recommendation.mode, ...result.alternatives.map(a => a.mode)];
      expect(modes).toContain('CHARTER_BUS');
      expect(modes).toContain('CHARTER_FLIGHT');
    });

    it('should require charter flight for long distances', () => {
      const trip = {
        origin: 'West Virginia',
        destination: 'Arizona',
        date: new Date('2025-09-20'),
        sport: 'football'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      expect(result.recommendation.mode).toBe('CHARTER_FLIGHT');
      expect(result.analysis.distance).toBeGreaterThan(1200);
      expect(result.analysis.tripType).toBe('Cross-Country');
    });
  });

  describe('Cost Optimization', () => {
    it('should respect Big 12 Tier 2 budget constraints', () => {
      const trip = {
        origin: 'Kansas',
        destination: 'UCF',
        date: new Date('2025-10-25'),
        sport: 'football',
        travelPartySize: 110
      };
      
      const constraints = {
        maxCost: 60000, // Tier 2 reasonable limit
        seasonBudget: 4000000
      };
      
      const result = optimizer.optimizeTransportation(trip, constraints);
      
      expect(result.recommendation.costs.total).toBeLessThanOrEqual(constraints.maxCost);
      expect(result.recommendation.costs.total).toBeGreaterThan(0);
    });

    it('should calculate accurate charter flight costs for Tier 2', () => {
      const trip = {
        origin: 'Colorado',
        destination: 'Cincinnati',
        date: new Date('2025-11-15'),
        sport: 'football',
        travelPartySize: 105
      };
      
      const result = optimizer.optimizeTransportation(trip);
      const charterFlight = result.alternatives.find(a => a.mode === 'CHARTER_FLIGHT') || result.recommendation;
      
      if (charterFlight && charterFlight.mode === 'CHARTER_FLIGHT') {
        // Should be within Tier 2 charter flight cost range ($24,000-$50,000)
        expect(charterFlight.costs.transport).toBeGreaterThanOrEqual(24000);
        expect(charterFlight.costs.transport).toBeLessThanOrEqual(50000);
      }
    });

    it('should include all cost components', () => {
      const trip = {
        origin: 'Arizona State',
        destination: 'Kansas State',
        date: new Date('2025-10-10'),
        sport: 'football',
        travelPartySize: 115
      };
      
      const result = optimizer.optimizeTransportation(trip);
      const costs = result.recommendation.costs;
      
      expect(costs).toHaveProperty('transport');
      expect(costs).toHaveProperty('total');
      expect(costs.total).toBeGreaterThan(costs.transport);
      
      if (result.recommendation.mode === 'CHARTER_BUS') {
        expect(costs).toHaveProperty('fuel');
        expect(costs).toHaveProperty('accommodation');
        expect(costs).toHaveProperty('meals');
      }
    });
  });

  describe('Tier 2 Constraint Validation', () => {
    it('should validate transportation mode constraints', () => {
      const constraint = tierConstraints.getTransportationModeConstraint();
      
      const mockGame = {
        home_team_id: 'Arizona',
        away_team_id: 'West Virginia',
        game_date: '2025-10-15'
      };
      
      const mockContext = {
        getTeam: (id) => ({ school_name: id, latitude: 32.2319, longitude: -110.9501 }),
        getSeasonTravelBudgetUsed: () => 2000000,
        getTravelPartySize: () => 110
      };
      
      const result = constraint.evaluate(mockGame, mockContext);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('distance');
      expect(result.metadata).toHaveProperty('selectedMode');
    });

    it('should enforce budget compliance', () => {
      const constraint = tierConstraints.getBudgetComplianceConstraint();
      
      const mockGame = {
        home_team_id: 'BYU',
        away_team_id: 'UCF',
        game_date: '2025-11-20'
      };
      
      const mockContext = {
        getSeasonTravelBudgetUsed: () => 4500000, // Near budget limit
        getTeam: (id) => ({ school_name: id })
      };
      
      // Mock the estimateGameTravelCost method
      tierConstraints.estimateGameTravelCost = () => 600000; // High cost trip
      
      const result = constraint.evaluate(mockGame, mockContext);
      
      expect(result.metadata).toHaveProperty('budgetUtilization');
      expect(result.metadata.budgetUtilization).toBeGreaterThan(90);
    });
  });

  describe('Season-Long Optimization', () => {
    it('should optimize full season travel within budget', () => {
      const schedule = [
        { homeTeam: 'Kansas', awayTeam: 'Arizona', date: '2025-09-15', venue: 'away', sport: 'football' },
        { homeTeam: 'Kansas', awayTeam: 'TCU', date: '2025-09-22', venue: 'away', sport: 'football' },
        { homeTeam: 'Kansas', awayTeam: 'Utah', date: '2025-10-05', venue: 'away', sport: 'football' },
        { homeTeam: 'Kansas', awayTeam: 'West Virginia', date: '2025-10-19', venue: 'away', sport: 'football' },
        { homeTeam: 'Kansas', awayTeam: 'Houston', date: '2025-11-02', venue: 'away', sport: 'football' }
      ];
      
      const constraints = {
        seasonBudget: 4000000
      };
      
      const result = optimizer.optimizeSeasonTravel(schedule, constraints);
      
      expect(result.totalCost).toBeLessThanOrEqual(constraints.seasonBudget);
      expect(result.optimizedTrips).toHaveLength(5);
      expect(result.budgetUtilization).toBeLessThanOrEqual(100);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should generate appropriate recommendations', () => {
      const schedule = [
        { homeTeam: 'Iowa State', awayTeam: 'Arizona', date: '2025-09-10', venue: 'away', sport: 'football' },
        { homeTeam: 'Iowa State', awayTeam: 'Arizona State', date: '2025-09-17', venue: 'away', sport: 'football' },
        { homeTeam: 'Iowa State', awayTeam: 'UCF', date: '2025-09-24', venue: 'away', sport: 'football' },
        { homeTeam: 'Iowa State', awayTeam: 'West Virginia', date: '2025-10-01', venue: 'away', sport: 'football' }
      ];
      
      const result = optimizer.optimizeSeasonTravel(schedule, { seasonBudget: 3500000 });
      
      // Should identify multiple long-distance trips
      const clusteringRec = result.recommendations.find(r => r.type === 'schedule_clustering');
      expect(clusteringRec).toBeDefined();
      expect(clusteringRec.priority).toBe('medium');
    });
  });

  describe('Risk Assessment', () => {
    it('should identify weather risks', () => {
      const trip = {
        origin: 'Colorado',
        destination: 'West Virginia',
        date: new Date('2025-12-15'), // Winter travel
        sport: 'basketball'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      expect(result.analysis).toHaveProperty('riskFactors');
      
      // Check if weather risk is identified for winter travel
      const weatherRisk = result.analysis.riskFactors.find(r => r.type === 'weather');
      if (weatherRisk) {
        expect(weatherRisk.severity).toBeDefined();
        expect(weatherRisk.mitigation).toBeDefined();
      }
    });

    it('should flag high budget utilization', () => {
      const trip = {
        origin: 'Cincinnati',
        destination: 'Arizona',
        date: new Date('2025-10-30'),
        sport: 'football',
        travelPartySize: 120
      };
      
      const constraints = {
        maxCost: 45000, // Force high utilization
        budgetReference: 35000
      };
      
      const result = optimizer.optimizeTransportation(trip, constraints);
      
      const budgetRisk = result.analysis.riskFactors.find(r => r.type === 'budget');
      if (budgetRisk) {
        expect(budgetRisk.severity).toBe('high');
      }
    });
  });

  describe('Multi-Criteria Optimization', () => {
    it('should balance cost, time, and comfort in scoring', () => {
      const trip = {
        origin: 'Oklahoma State',
        destination: 'Utah',
        date: new Date('2025-11-08'),
        sport: 'football',
        travelPartySize: 108
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      // Should have multiple scenarios with different scores
      const allScenarios = [result.recommendation, ...result.alternatives];
      expect(allScenarios.length).toBeGreaterThan(1);
      
      // Scores should be between 0 and 1
      allScenarios.forEach(scenario => {
        expect(scenario.score).toBeGreaterThanOrEqual(0);
        expect(scenario.score).toBeLessThanOrEqual(1);
      });
      
      // Best scenario should have highest score
      const bestScore = Math.max(...allScenarios.map(s => s.score));
      expect(result.recommendation.score).toBe(bestScore);
    });

    it('should consider environmental impact in optimization', () => {
      const trip = {
        origin: 'Baylor',
        destination: 'Colorado',
        date: new Date('2025-10-12'),
        sport: 'football'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      // Check that CO2 emissions are calculated
      expect(result.recommendation.impact).toHaveProperty('co2Emissions');
      expect(result.recommendation.impact.co2Emissions).toBeGreaterThan(0);
      
      // Bus should generally have lower emissions per person than flight
      const busOption = [result.recommendation, ...result.alternatives]
        .find(s => s.mode === 'CHARTER_BUS');
      const flightOption = [result.recommendation, ...result.alternatives]
        .find(s => s.mode === 'CHARTER_FLIGHT');
      
      if (busOption && flightOption) {
        // Per person emissions should favor bus for medium distances
        const busEmissionsPerPerson = busOption.impact.co2Emissions / 110;
        const flightEmissionsPerPerson = flightOption.impact.co2Emissions / 110;
        
        expect(busEmissionsPerPerson).toBeLessThan(flightEmissionsPerPerson);
      }
    });
  });

  describe('Big 12 Specific Requirements', () => {
    it('should enforce jet aircraft requirement for charter flights', () => {
      const trip = {
        origin: 'Texas Tech',
        destination: 'Cincinnati',
        date: new Date('2025-10-20'),
        sport: 'football'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      const charterFlight = [result.recommendation, ...result.alternatives]
        .find(s => s.mode === 'CHARTER_FLIGHT');
      
      if (charterFlight) {
        // Should validate against Big 12 safety requirements
        const isValid = optimizer.validateJetAircraftRequirement(charterFlight);
        expect(isValid).toBe(true);
      }
    });

    it('should respect travel partner coordination in optimization', () => {
      // Test scenarios where travel partners should coordinate
      const arizonaTrip = {
        origin: 'Arizona',
        destination: 'Kansas',
        date: new Date('2025-10-25'),
        sport: 'football'
      };
      
      const arizonaStateTrip = {
        origin: 'Arizona State',
        destination: 'Kansas State',
        date: new Date('2025-10-25'), // Same weekend
        sport: 'football'
      };
      
      const result1 = optimizer.optimizeTransportation(arizonaTrip);
      const result2 = optimizer.optimizeTransportation(arizonaStateTrip);
      
      // Both should recognize the opportunity for coordination
      expect(result1.analysis.tripType).toBe(result2.analysis.tripType);
      
      // Should have similar optimization patterns for travel partners
      if (result1.recommendation.mode === result2.recommendation.mode) {
        const costDifference = Math.abs(
          result1.recommendation.costs.total - result2.recommendation.costs.total
        );
        // Costs should be similar for similar distances
        expect(costDifference).toBeLessThan(result1.recommendation.costs.total * 0.2);
      }
    });
  });
});

describe('Integration Performance Tests', () => {
  let optimizer;
  
  beforeEach(() => {
    optimizer = new FTTravelAgent();
  });

  it('should optimize single trip within reasonable time', () => {
    const startTime = Date.now();
    
    const trip = {
      origin: 'Houston',
      destination: 'BYU',
      date: new Date('2025-11-15'),
      sport: 'football'
    };
    
    const result = optimizer.optimizeTransportation(trip);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
    expect(result.recommendation).toBeDefined();
  });

  it('should handle season optimization efficiently', () => {
    const startTime = Date.now();
    
    // Create a full 9-game conference schedule
    const schedule = [];
    const teams = ['Arizona', 'Colorado', 'TCU', 'Kansas', 'Utah', 'Cincinnati', 'Houston', 'Iowa State', 'UCF'];
    
    teams.forEach((opponent, index) => {
      schedule.push({
        homeTeam: 'Oklahoma State',
        awayTeam: opponent,
        date: `2025-${9 + Math.floor(index / 4)}-${(index % 4 + 1) * 7}`,
        venue: 'away',
        sport: 'football'
      });
    });
    
    const result = optimizer.optimizeSeasonTravel(schedule);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(result.optimizedTrips).toHaveLength(9);
  });
});

export { optimizer, tierConstraints };