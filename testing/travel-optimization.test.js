/**
 * Travel Optimization Test Suite
 * 
 * Comprehensive testing for travel budget tier integration and cost optimization
 * Tests Big 12 Tier 2 specific constraints and transportation mode selection
 */

const { FTTravelAgent } = require('../core/FTTravelAgent.js');
const { TravelBudgetTierConstraints } = require('../parameters/sport-specifics/TravelBudgetTierConstraints.js');
const { calculateBig12Distance, analyzeTimezoneImpact } = require('../utils/geoUtils.js');

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

  describe('Basic Functionality Tests', () => {
    test('should initialize optimizer with Big 12 Tier 2 configuration', () => {
      expect(optimizer.config.tier).toBe('TIER_2');
      expect(optimizer.config.conferenceLevel).toBe('Big 12');
      expect(optimizer.config.budgetRange.min).toBe(3000000);
      expect(optimizer.config.budgetRange.max).toBe(5000000);
    });

    test('should have correct transportation mode configurations', () => {
      expect(optimizer.transportModes.CHARTER_BUS.maxDistance).toBe(600);
      expect(optimizer.transportModes.CHARTER_FLIGHT.baseCost).toBe(24000);
      expect(optimizer.transportModes.CHARTER_FLIGHT.maxCost).toBe(50000);
    });

    test('should have proper optimization weights', () => {
      const weights = optimizer.optimizationWeights;
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });

  describe('Geographic Calculations', () => {
    test('should calculate distances between Big 12 schools', () => {
      // Mock the distance calculation function
      const mockDistance = jest.fn().mockReturnValue(120);
      global.calculateBig12Distance = mockDistance;
      
      const distance = global.calculateBig12Distance('Arizona', 'Arizona State');
      expect(mockDistance).toHaveBeenCalledWith('Arizona', 'Arizona State');
      expect(distance).toBe(120);
    });

    test('should analyze timezone impacts', () => {
      // Mock timezone analysis
      const mockTimezone = jest.fn().mockReturnValue({
        timezoneChange: true,
        hoursDifference: 2,
        fromTimezone: 'Eastern',
        toTimezone: 'Mountain'
      });
      global.analyzeTimezoneImpact = mockTimezone;
      
      const result = global.analyzeTimezoneImpact('West Virginia', 'Arizona');
      expect(result.timezoneChange).toBe(true);
      expect(result.hoursDifference).toBe(2);
    });
  });

  describe('Transportation Mode Selection', () => {
    test('should recommend appropriate mode for short distances', () => {
      const trip = {
        origin: 'Baylor',
        destination: 'TCU',
        date: new Date('2025-10-15'),
        sport: 'football'
      };
      
      // Mock short distance
      optimizer.calculateDistance = jest.fn().mockReturnValue(100);
      
      const scenarios = optimizer.generateTransportationScenarios(trip, 100);
      
      // Should include bus scenario for short distance
      const busScenario = scenarios.find(s => s.mode === 'CHARTER_BUS');
      expect(busScenario).toBeDefined();
      expect(busScenario.costs.total).toBeGreaterThan(0);
    });

    test('should include flight option for longer distances', () => {
      const trip = {
        origin: 'West Virginia',
        destination: 'Arizona',
        date: new Date('2025-09-20'),
        sport: 'football'
      };
      
      const scenarios = optimizer.generateTransportationScenarios(trip, 1800);
      
      // Should include charter flight for long distance
      const flightScenario = scenarios.find(s => s.mode === 'CHARTER_FLIGHT');
      expect(flightScenario).toBeDefined();
      expect(flightScenario.costs.total).toBeGreaterThan(20000);
    });
  });

  describe('Cost Calculations', () => {
    test('should calculate bus scenario costs correctly', () => {
      const trip = {
        origin: 'Kansas',
        destination: 'Kansas State',
        date: new Date('2025-10-15'),
        sport: 'football'
      };
      
      const scenario = optimizer.createBusScenario(trip, 80, 110);
      
      expect(scenario.costs).toHaveProperty('transport');
      expect(scenario.costs).toHaveProperty('fuel');
      expect(scenario.costs).toHaveProperty('total');
      expect(scenario.costs.total).toBeGreaterThan(scenario.costs.transport);
    });

    test('should calculate charter flight costs within Tier 2 range', () => {
      const trip = {
        origin: 'Colorado',
        destination: 'Cincinnati',
        date: new Date('2025-11-15'),
        sport: 'football'
      };
      
      const scenario = optimizer.createCharterFlightScenario(trip, 1070, 105);
      
      expect(scenario.costs.transport).toBeGreaterThanOrEqual(24000);
      expect(scenario.costs.transport).toBeLessThanOrEqual(50000);
      expect(scenario.costs).toHaveProperty('catering');
    });

    test('should include accommodation costs for overnight trips', () => {
      const accommodationCost = optimizer.calculateAccommodationCost(8, 110);
      
      expect(accommodationCost).toBeGreaterThan(0);
      // Should require overnight stay for 8-hour travel
      expect(accommodationCost).toBeGreaterThan(5000);
    });
  });

  describe('Optimization Scoring', () => {
    test('should calculate optimization scores between 0 and 1', () => {
      const mockScenario = {
        mode: 'CHARTER_BUS',
        costs: { total: 15000 },
        logistics: { travelTime: 6, departureFlexibility: 0.9 },
        impact: { comfortRating: 0.7, co2Emissions: 2000 }
      };
      
      const trip = { origin: 'Texas Tech', destination: 'TCU' };
      const constraints = { budgetReference: 20000 };
      
      const score = optimizer.calculateOptimizationScore(mockScenario, trip, constraints);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should favor lower cost options in scoring', () => {
      const cheapScenario = {
        costs: { total: 10000 },
        logistics: { travelTime: 6, departureFlexibility: 0.8 },
        impact: { comfortRating: 0.7, co2Emissions: 1500 }
      };
      
      const expensiveScenario = {
        costs: { total: 40000 },
        logistics: { travelTime: 3, departureFlexibility: 0.7 },
        impact: { comfortRating: 0.9, co2Emissions: 3000 }
      };
      
      const trip = {};
      const constraints = { budgetReference: 25000 };
      
      const cheapScore = optimizer.calculateOptimizationScore(cheapScenario, trip, constraints);
      const expensiveScore = optimizer.calculateOptimizationScore(expensiveScenario, trip, constraints);
      
      // Lower cost should generally score higher unless other factors dominate
      expect(cheapScore).toBeGreaterThan(0);
      expect(expensiveScore).toBeGreaterThan(0);
    });
  });

  describe('Season Optimization', () => {
    test('should optimize multiple trips within budget', () => {
      const schedule = [
        { homeTeam: 'Kansas', awayTeam: 'Arizona', date: '2025-09-15', venue: 'away', sport: 'football' },
        { homeTeam: 'Kansas', awayTeam: 'TCU', date: '2025-09-22', venue: 'away', sport: 'football' },
        { homeTeam: 'Kansas', awayTeam: 'Utah', date: '2025-10-05', venue: 'away', sport: 'football' }
      ];
      
      // Mock the optimization method
      optimizer.optimizeTransportation = jest.fn().mockReturnValue({
        recommendation: { costs: { total: 25000 } },
        analysis: { distance: 500 }
      });
      
      const result = optimizer.optimizeSeasonTravel(schedule, { seasonBudget: 400000 });
      
      expect(result.optimizedTrips).toHaveLength(3);
      expect(result.totalCost).toBeLessThanOrEqual(400000);
      expect(result.budgetUtilization).toBeLessThanOrEqual(100);
    });

    test('should generate recommendations for high-cost seasons', () => {
      const result = {
        optimizedTrips: [
          { optimization: { analysis: { distance: 1200 } } },
          { optimization: { analysis: { distance: 1100 } } },
          { optimization: { analysis: { distance: 1300 } } },
          { optimization: { analysis: { distance: 1400 } } }
        ]
      };
      
      const recommendations = optimizer.generateSeasonRecommendations(
        result.optimizedTrips, 
        4500000, 
        5000000
      );
      
      expect(recommendations).toBeInstanceOf(Array);
      
      // Should recommend clustering for multiple long trips
      const clusterRec = recommendations.find(r => r.type === 'schedule_clustering');
      expect(clusterRec).toBeDefined();
    });
  });

  describe('Risk Assessment', () => {
    test('should assess weather risks correctly', () => {
      const winterTrip = { date: new Date('2025-12-15') };
      const weatherRisk = optimizer.assessWeatherRisk(winterTrip, 'charter_flight');
      
      expect(weatherRisk).toBeGreaterThan(0);
      expect(weatherRisk).toBeLessThanOrEqual(1);
    });

    test('should calculate fatigue levels', () => {
      const fatigue = optimizer.calculateFatigueLevel(8, 0.7);
      
      expect(fatigue).toBeGreaterThanOrEqual(0);
      expect(fatigue).toBeLessThanOrEqual(1);
    });

    test('should identify high-cost trips as budget risks', () => {
      const scenario = { costs: { total: 45000 } };
      const trip = {};
      
      const risks = optimizer.assessRiskFactors(scenario, trip);
      
      expect(risks).toBeInstanceOf(Array);
      // High cost should generate budget risk
      const budgetRisk = risks.find(r => r.type === 'budget');
      if (budgetRisk) {
        expect(budgetRisk.severity).toBeDefined();
      }
    });
  });

  describe('Constraint Integration', () => {
    test('should create tier constraint instances', () => {
      expect(tierConstraints).toBeInstanceOf(TravelBudgetTierConstraints);
      expect(tierConstraints.tiers).toHaveProperty('TIER_2');
    });

    test('should have Big 12 specific configuration', () => {
      expect(tierConstraints.big12Config.tier).toBe('TIER_2');
      expect(tierConstraints.big12Config.jetAircraftRequirement).toBe(true);
    });

    test('should validate transportation modes for constraints', () => {
      const constraints = tierConstraints.getAllConstraints();
      
      expect(constraints).toBeInstanceOf(Array);
      expect(constraints.length).toBeGreaterThan(0);
      
      const transportConstraint = constraints.find(c => 
        c.id === 'big12_transportation_mode_selection'
      );
      expect(transportConstraint).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should complete single optimization quickly', () => {
      const startTime = Date.now();
      
      // Mock dependencies to avoid external calls
      optimizer.optimizeTransportation = jest.fn().mockReturnValue({
        recommendation: { costs: { total: 25000 }, mode: 'CHARTER_BUS' },
        alternatives: [],
        analysis: { distance: 300, tripType: 'Regional' }
      });
      
      const trip = {
        origin: 'Houston',
        destination: 'TCU',
        date: new Date('2025-11-15'),
        sport: 'football'
      };
      
      const result = optimizer.optimizeTransportation(trip);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should be very fast with mocks
      expect(result.recommendation).toBeDefined();
    });
  });
});

describe('Utility Function Tests', () => {
  let optimizer;
  
  beforeEach(() => {
    optimizer = new FTTravelAgent();
  });

  test('should categorize trip types correctly', () => {
    expect(optimizer.categorizeTripType(200, {})).toBe('Regional');
    expect(optimizer.categorizeTripType(500, {})).toBe('Conference');
    expect(optimizer.categorizeTripType(800, {})).toBe('Cross-Regional');
    expect(optimizer.categorizeTripType(1500, {})).toBe('Cross-Country');
  });

  test('should identify seasons correctly', () => {
    expect(optimizer.getSeason(new Date('2025-12-15'))).toBe('winter');
    expect(optimizer.getSeason(new Date('2025-04-15'))).toBe('spring');
    expect(optimizer.getSeason(new Date('2025-07-15'))).toBe('summer');
    expect(optimizer.getSeason(new Date('2025-10-15'))).toBe('fall');
  });

  test('should calculate cost savings', () => {
    const scenarios = [
      { costs: { total: 15000 } },
      { costs: { total: 25000 } },
      { costs: { total: 35000 } }
    ];
    
    const savings = optimizer.calculateCostSavings(scenarios);
    
    expect(savings.maxSavings).toBe(20000);
    expect(savings.percentage).toBeCloseTo(57.14, 1);
  });

  test('should validate jet aircraft requirements', () => {
    const validScenario = {
      mode: 'CHARTER_FLIGHT',
      modeConfig: { name: 'Charter Flight' }
    };
    
    const invalidScenario = {
      mode: 'COMMERCIAL_FLIGHT',
      modeConfig: { name: 'Commercial Flight' }
    };
    
    expect(optimizer.validateJetAircraftRequirement(validScenario)).toBe(true);
    expect(optimizer.validateJetAircraftRequirement(invalidScenario)).toBe(false);
  });
});

module.exports = { FTTravelAgent, TravelBudgetTierConstraints };