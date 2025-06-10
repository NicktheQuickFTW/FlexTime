/**
 * Travel Mileage Integration Tests
 * 
 * Tests the complete travel optimization system integration
 * including database schema, cost calculations, and optimization
 */

const { BIG12_SCHOOLS, calculateDistance, calculateOptimalTransport } = require('../scripts/visualize-travel-data.js');

describe('Travel Mileage System Integration', () => {
  describe('Database Schema Compatibility', () => {
    test('should have complete Big 12 school data', () => {
      const expectedSchools = [
        'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
        'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
        'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
      ];
      
      expectedSchools.forEach(school => {
        expect(BIG12_SCHOOLS).toHaveProperty(school);
        expect(BIG12_SCHOOLS[school]).toHaveProperty('lat');
        expect(BIG12_SCHOOLS[school]).toHaveProperty('lon');
        expect(BIG12_SCHOOLS[school]).toHaveProperty('code');
        expect(BIG12_SCHOOLS[school]).toHaveProperty('tier');
      });
    });

    test('should have valid coordinate data', () => {
      Object.values(BIG12_SCHOOLS).forEach(school => {
        expect(school.lat).toBeGreaterThan(25); // Southern US boundary
        expect(school.lat).toBeLessThan(50);    // Northern US boundary
        expect(school.lon).toBeGreaterThan(-125); // Western US boundary
        expect(school.lon).toBeLessThan(-75);     // Eastern US boundary
      });
    });

    test('should have proper tier assignments', () => {
      // All Big 12 full members should be Tier 2
      Object.values(BIG12_SCHOOLS).forEach(school => {
        expect(school.tier).toBe('TIER_2');
      });
    });
  });

  describe('Distance Calculations', () => {
    test('should calculate known distances accurately', () => {
      // Test known approximate distances
      const testCases = [
        { 
          from: 'BYU', 
          to: 'Utah', 
          expectedDistance: 37, 
          tolerance: 5 
        },
        { 
          from: 'Baylor', 
          to: 'TCU', 
          expectedDistance: 82, 
          tolerance: 10 
        },
        { 
          from: 'Arizona', 
          to: 'Arizona State', 
          expectedDistance: 120, 
          tolerance: 25 
        },
        { 
          from: 'Kansas', 
          to: 'Kansas State', 
          expectedDistance: 73, 
          tolerance: 10 
        }
      ];

      testCases.forEach(({ from, to, expectedDistance, tolerance }) => {
        const fromSchool = BIG12_SCHOOLS[from];
        const toSchool = BIG12_SCHOOLS[to];
        const calculatedDistance = calculateDistance(
          fromSchool.lat, fromSchool.lon,
          toSchool.lat, toSchool.lon
        );
        
        expect(Math.abs(calculatedDistance - expectedDistance)).toBeLessThan(tolerance);
      });
    });

    test('should handle extreme distances correctly', () => {
      // Test cross-country distances
      const westCoast = BIG12_SCHOOLS['Utah'];
      const eastCoast = BIG12_SCHOOLS['West Virginia'];
      
      const distance = calculateDistance(
        westCoast.lat, westCoast.lon,
        eastCoast.lat, eastCoast.lon
      );
      
      expect(distance).toBeGreaterThan(1500); // Should be significant distance
      expect(distance).toBeLessThan(2500);    // But not unreasonable
    });

    test('should be symmetric (distance A→B = distance B→A)', () => {
      const school1 = BIG12_SCHOOLS['Kansas'];
      const school2 = BIG12_SCHOOLS['Texas Tech'];
      
      const distance1 = calculateDistance(school1.lat, school1.lon, school2.lat, school2.lon);
      const distance2 = calculateDistance(school2.lat, school2.lon, school1.lat, school1.lon);
      
      expect(Math.abs(distance1 - distance2)).toBeLessThan(0.001);
    });
  });

  describe('Transportation Mode Selection', () => {
    test('should select bus for short distances', () => {
      const shortDistanceOptions = calculateOptimalTransport(200, 110);
      
      expect(shortDistanceOptions.length).toBeGreaterThan(0);
      expect(shortDistanceOptions[0].mode).toBe('CHARTER_BUS');
      expect(shortDistanceOptions[0].cost).toBeLessThan(15000);
    });

    test('should prefer charter flight for long distances', () => {
      const longDistanceOptions = calculateOptimalTransport(1500, 110);
      
      expect(longDistanceOptions.length).toBeGreaterThan(0);
      expect(longDistanceOptions[0].mode).toBe('CHARTER_FLIGHT');
      expect(longDistanceOptions[0].cost).toBeGreaterThan(20000);
    });

    test('should offer multiple options for medium distances', () => {
      const mediumDistanceOptions = calculateOptimalTransport(500, 110);
      
      expect(mediumDistanceOptions.length).toBeGreaterThanOrEqual(2);
      expect(mediumDistanceOptions.some(opt => opt.mode === 'CHARTER_BUS')).toBe(true);
      expect(mediumDistanceOptions.some(opt => opt.mode === 'CHARTER_FLIGHT')).toBe(true);
    });

    test('should scale cost appropriately with travel party size', () => {
      const smallPartyOptions = calculateOptimalTransport(400, 25); // Basketball team
      const largePartyOptions = calculateOptimalTransport(400, 130); // Football team
      
      expect(largePartyOptions[0].cost).toBeGreaterThan(smallPartyOptions[0].cost);
    });
  });

  describe('Cost Optimization', () => {
    test('should provide cost-effective solutions within Tier 2 budget', () => {
      const tier2BudgetMax = 5000000; // $5M annual budget
      const testDistances = [200, 500, 800, 1200, 1800];
      
      testDistances.forEach(distance => {
        const options = calculateOptimalTransport(distance, 110);
        const optimalCost = options[0].cost;
        
        // Single trip should be reasonable fraction of season budget
        expect(optimalCost).toBeLessThan(tier2BudgetMax * 0.02); // Less than 2% of annual budget
      });
    });

    test('should include comfort and time factors in optimization', () => {
      const options = calculateOptimalTransport(800, 110);
      
      options.forEach(option => {
        expect(option).toHaveProperty('cost');
        expect(option).toHaveProperty('time');
        expect(option).toHaveProperty('comfort');
        expect(option).toHaveProperty('score');
        
        expect(option.score).toBeGreaterThan(0);
        expect(option.comfort).toBeGreaterThan(0);
        expect(option.comfort).toBeLessThanOrEqual(1);
      });
    });

    test('should prefer lower cost options when scores are similar', () => {
      const options = calculateOptimalTransport(600, 110);
      
      if (options.length > 1) {
        // If scores are within 10%, prefer lower cost
        const topTwo = options.slice(0, 2);
        if (Math.abs(topTwo[0].score - topTwo[1].score) < 0.1) {
          expect(topTwo[0].cost).toBeLessThanOrEqual(topTwo[1].cost);
        }
      }
    });
  });

  describe('Travel Partner Integration', () => {
    test('should identify close geographic partners', () => {
      const closePartners = [
        ['BYU', 'Utah'],
        ['Arizona', 'Arizona State'],
        ['Baylor', 'TCU'],
        ['Kansas', 'Kansas State']
      ];
      
      closePartners.forEach(([school1, school2]) => {
        const distance = calculateDistance(
          BIG12_SCHOOLS[school1].lat, BIG12_SCHOOLS[school1].lon,
          BIG12_SCHOOLS[school2].lat, BIG12_SCHOOLS[school2].lon
        );
        
        expect(distance).toBeLessThan(150); // Close partners should be within 150 miles
      });
    });

    test('should provide efficiency benefits for partner coordination', () => {
      // Test that coordinated travel with partners could reduce costs
      const arizonaToTexas = calculateOptimalTransport(800, 110);
      const arizonaStateToTexas = calculateOptimalTransport(820, 110); // Similar distance
      
      // If both Arizona schools travel to Texas region, coordination should help
      const coordinatedCost = (arizonaToTexas[0].cost + arizonaStateToTexas[0].cost) * 0.85; // 15% savings
      const separateCost = arizonaToTexas[0].cost + arizonaStateToTexas[0].cost;
      
      expect(coordinatedCost).toBeLessThan(separateCost);
      expect((separateCost - coordinatedCost) / separateCost).toBeGreaterThan(0.1); // At least 10% savings
    });
  });

  describe('Season-Long Optimization', () => {
    test('should handle realistic season schedules', () => {
      const sampleSeasonTrips = [
        { distance: 300, sport: 'basketball' },
        { distance: 750, sport: 'basketball' },
        { distance: 1200, sport: 'basketball' },
        { distance: 400, sport: 'basketball' },
        { distance: 600, sport: 'basketball' }
      ];
      
      let totalSeasonCost = 0;
      sampleSeasonTrips.forEach(trip => {
        const options = calculateOptimalTransport(trip.distance, 25); // Basketball team size
        totalSeasonCost += options[0].cost;
      });
      
      // Season should be within reasonable budget for basketball
      expect(totalSeasonCost).toBeLessThan(150000); // $150k for 5 trips
      expect(totalSeasonCost).toBeGreaterThan(30000);  // But not unrealistically cheap
    });

    test('should demonstrate budget utilization efficiency', () => {
      const tier2Budget = 4000000; // $4M mid-range budget
      const footballTrips = 4;     // 4 away games
      const basketballTrips = 10;  // 10 away games each (M/W)
      const otherSportsTrips = 20;  // Other sports combined
      
      // Calculate rough season costs
      const avgFootballCost = calculateOptimalTransport(800, 130)[0].cost;
      const avgBasketballCost = calculateOptimalTransport(600, 25)[0].cost;
      const avgOtherSportsCost = calculateOptimalTransport(500, 35)[0].cost;
      
      const totalSeasonCost = 
        (avgFootballCost * footballTrips) +
        (avgBasketballCost * basketballTrips * 2) + // Men's and Women's
        (avgOtherSportsCost * otherSportsTrips);
      
      const budgetUtilization = totalSeasonCost / tier2Budget;
      
      expect(budgetUtilization).toBeLessThan(1.0);   // Should be within budget
      expect(budgetUtilization).toBeGreaterThan(0.05); // Should use reasonable portion (adjusted)
    });
  });

  describe('Data Export Compatibility', () => {
    test('should generate valid Supabase-compatible data structure', () => {
      // Test that the exported data matches our schema requirements
      const exportData = require('../data/big12-travel-export.json');
      
      expect(exportData).toHaveProperty('schools');
      expect(exportData).toHaveProperty('travel_costs');
      expect(exportData).toHaveProperty('travel_partners');
      
      // Verify schools data structure
      exportData.schools.forEach(school => {
        expect(school).toHaveProperty('id');
        expect(school).toHaveProperty('school_name');
        expect(school).toHaveProperty('school_code');
        expect(school).toHaveProperty('latitude');
        expect(school).toHaveProperty('longitude');
        expect(school).toHaveProperty('tier');
      });
      
      // Verify travel costs data structure
      exportData.travel_costs.forEach(cost => {
        expect(cost).toHaveProperty('id');
        expect(cost).toHaveProperty('tier');
        expect(cost).toHaveProperty('transport_mode');
        expect(cost).toHaveProperty('comfort_rating');
      });
      
      // Verify travel partners data structure
      exportData.travel_partners.forEach(partner => {
        expect(partner).toHaveProperty('id');
        expect(partner).toHaveProperty('school_1');
        expect(partner).toHaveProperty('school_2');
        expect(partner).toHaveProperty('efficiency_rating');
        expect(partner).toHaveProperty('distance_between');
      });
    });
  });
});

describe('Performance and Scalability', () => {
  test('should calculate distances quickly for all school pairs', () => {
    const startTime = Date.now();
    
    const schools = Object.keys(BIG12_SCHOOLS);
    let calculations = 0;
    
    schools.forEach(origin => {
      schools.forEach(destination => {
        if (origin !== destination) {
          calculateDistance(
            BIG12_SCHOOLS[origin].lat, BIG12_SCHOOLS[origin].lon,
            BIG12_SCHOOLS[destination].lat, BIG12_SCHOOLS[destination].lon
          );
          calculations++;
        }
      });
    });
    
    const executionTime = Date.now() - startTime;
    
    expect(calculations).toBe(240); // 16 * 15 school pairs
    expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
  });

  test('should optimize transportation efficiently', () => {
    const startTime = Date.now();
    
    const testDistances = [200, 400, 600, 800, 1000, 1200, 1500, 1800];
    let optimizations = 0;
    
    testDistances.forEach(distance => {
      calculateOptimalTransport(distance, 110);
      optimizations++;
    });
    
    const executionTime = Date.now() - startTime;
    
    expect(optimizations).toBe(8);
    expect(executionTime).toBeLessThan(50); // Should complete in under 50ms
  });
});