/**
 * Affiliate Tier Management Tests
 * 
 * Tests for Big 12 associate member tier assignments and constraints
 */

describe('Big 12 Affiliate Tier Management', () => {
  describe('Tier Assignment Logic', () => {
    test('should assign full Big 12 members to Tier 2', () => {
      const fullMembers = ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'];
      
      function determineSchoolTier(schoolName) {
        if (fullMembers.includes(schoolName)) {
          return 'TIER_2';
        }
        return 'TIER_3';
      }
      
      // Test full members
      expect(determineSchoolTier('Arizona')).toBe('TIER_2');
      expect(determineSchoolTier('Kansas')).toBe('TIER_2');
      expect(determineSchoolTier('West Virginia')).toBe('TIER_2');
      
      // Test associate
      expect(determineSchoolTier('Air Force')).toBe('TIER_3');
    });

    test('should assign Power 5 associates to Tier 2', () => {
      const fullMembers = ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'];
      const powerAssociates = ['Florida', 'Missouri', 'Oklahoma'];
      
      function determineSchoolTier(schoolName) {
        if (fullMembers.includes(schoolName)) {
          return 'TIER_2';
        }
        if (powerAssociates.includes(schoolName)) {
          return 'TIER_2'; // Power 5 schools maintain Tier 2 budgets
        }
        return 'TIER_3';
      }
      
      // Test Power 5 associates maintain Tier 2
      expect(determineSchoolTier('Florida')).toBe('TIER_2');
      expect(determineSchoolTier('Missouri')).toBe('TIER_2');
      expect(determineSchoolTier('Oklahoma')).toBe('TIER_2');
    });

    test('should assign other associates to Tier 3', () => {
      const tier3Associates = {
        wrestling: ['Air Force', 'Cal Baptist', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'South Dakota State', 'Utah Valley', 'Wyoming'],
        gymnastics: ['Denver'],
        lacrosse: ['San Diego State', 'UC Davis'],
        rowing: ['Old Dominion', 'Tulsa'],
        equestrian: ['Fresno']
      };
      
      function determineSchoolTier(schoolName) {
        // Check if school is in any Tier 3 associate program
        for (const programs of Object.values(tier3Associates)) {
          if (programs.includes(schoolName)) {
            return 'TIER_3';
          }
        }
        return 'TIER_2'; // Default for full members
      }
      
      // Test Tier 3 associates
      expect(determineSchoolTier('Air Force')).toBe('TIER_3');
      expect(determineSchoolTier('Denver')).toBe('TIER_3');
      expect(determineSchoolTier('San Diego State')).toBe('TIER_3');
      expect(determineSchoolTier('Old Dominion')).toBe('TIER_3');
      expect(determineSchoolTier('Fresno')).toBe('TIER_3');
    });
  });

  describe('Budget Adjustments by Tier', () => {
    test('should calculate correct budget multipliers', () => {
      const tiers = {
        TIER_2: { budgetMultiplier: 3.0, budgetRange: { min: 3000000, max: 5000000 } },
        TIER_3: { budgetMultiplier: 1.75, budgetRange: { min: 1500000, max: 4000000 } }
      };
      
      function calculateBudgetAdjustment(schoolTier) {
        const tierConfig = tiers[schoolTier];
        const tier2Config = tiers.TIER_2;
        return tierConfig.budgetMultiplier / tier2Config.budgetMultiplier;
      }
      
      // Tier 2 schools (full members + Power 5 associates)
      expect(calculateBudgetAdjustment('TIER_2')).toBe(1.0);
      
      // Tier 3 associates
      expect(calculateBudgetAdjustment('TIER_3')).toBeCloseTo(0.583, 2);
    });

    test('should apply appropriate cost constraints by tier', () => {
      const tierConstraints = {
        TIER_2: {
          charterFlightThreshold: 600,
          charterFlightCost: { min: 24000, max: 50000 },
          perDiem: { min: 60, max: 75 },
          accommodationStandard: '3-4 star'
        },
        TIER_3: {
          charterFlightThreshold: 1000,
          charterFlightCost: { min: 15000, max: 30000 },
          perDiem: { min: 50, max: 65 },
          accommodationStandard: '2-3 star'
        }
      };
      
      function getSchoolConstraints(schoolName) {
        // Simplified tier determination
        const powerSchools = ['Florida', 'Missouri', 'Oklahoma', 'Kansas', 'Arizona'];
        const tier3Schools = ['Air Force', 'Denver', 'San Diego State'];
        
        if (powerSchools.includes(schoolName)) {
          return tierConstraints.TIER_2;
        } else if (tier3Schools.includes(schoolName)) {
          return tierConstraints.TIER_3;
        } else {
          return tierConstraints.TIER_2; // Default
        }
      }
      
      // Test Tier 2 constraints
      const kansasConstraints = getSchoolConstraints('Kansas');
      expect(kansasConstraints.charterFlightThreshold).toBe(600);
      expect(kansasConstraints.charterFlightCost.max).toBe(50000);
      
      // Test Tier 3 constraints
      const airForceConstraints = getSchoolConstraints('Air Force');
      expect(airForceConstraints.charterFlightThreshold).toBe(1000);
      expect(airForceConstraints.charterFlightCost.max).toBe(30000);
      
      // Test Power 5 associate maintains Tier 2
      const floridaConstraints = getSchoolConstraints('Florida');
      expect(floridaConstraints.charterFlightThreshold).toBe(600);
      expect(floridaConstraints.perDiem.min).toBe(60);
    });
  });

  describe('Sport-Specific Tier Application', () => {
    test('should handle wrestling associates correctly', () => {
      const wrestlingAssociates = {
        tier2: ['Missouri', 'Oklahoma'], // Power 5 schools
        tier3: ['Air Force', 'Cal Baptist', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'South Dakota State', 'Utah Valley', 'Wyoming']
      };
      
      function getWrestlingTier(school) {
        if (wrestlingAssociates.tier2.includes(school)) {
          return 'TIER_2';
        } else if (wrestlingAssociates.tier3.includes(school)) {
          return 'TIER_3';
        } else {
          return 'TIER_2'; // Full Big 12 members
        }
      }
      
      // Power 5 wrestling associates
      expect(getWrestlingTier('Missouri')).toBe('TIER_2');
      expect(getWrestlingTier('Oklahoma')).toBe('TIER_2');
      
      // Other wrestling associates
      expect(getWrestlingTier('Air Force')).toBe('TIER_3');
      expect(getWrestlingTier('Wyoming')).toBe('TIER_3');
      
      // Full Big 12 members
      expect(getWrestlingTier('Iowa State')).toBe('TIER_2');
      expect(getWrestlingTier('Oklahoma State')).toBe('TIER_2');
    });

    test('should handle lacrosse associates correctly', () => {
      const lacrosseAssociates = {
        tier2: ['Florida'], // Power 5 school
        tier3: ['San Diego State', 'UC Davis']
      };
      
      function getLacrosseTier(school) {
        if (lacrosseAssociates.tier2.includes(school)) {
          return 'TIER_2';
        } else if (lacrosseAssociates.tier3.includes(school)) {
          return 'TIER_3';
        } else {
          return 'TIER_2'; // Full Big 12 members
        }
      }
      
      // Power 5 lacrosse associate
      expect(getLacrosseTier('Florida')).toBe('TIER_2');
      
      // Other lacrosse associates
      expect(getLacrosseTier('San Diego State')).toBe('TIER_3');
      expect(getLacrosseTier('UC Davis')).toBe('TIER_3');
      
      // Full Big 12 members
      expect(getLacrosseTier('Colorado')).toBe('TIER_2');
    });
  });

  describe('Cost Impact Analysis', () => {
    test('should calculate different travel costs by tier', () => {
      function calculateTravelCost(distance, schoolTier, travelPartySize = 110) {
        const tiers = {
          TIER_2: {
            busThreshold: 600,
            charterCost: 35000, // Average
            busCostPerMile: 2.8,
            perDiem: 67.5,
            travelPartyMultiplier: 1.5
          },
          TIER_3: {
            busThreshold: 1000,
            charterCost: 22500, // Average
            busCostPerMile: 2.2,
            perDiem: 57.5,
            travelPartyMultiplier: 1.3
          }
        };
        
        const tier = tiers[schoolTier];
        const adjustedPartySize = Math.round(travelPartySize * tier.travelPartyMultiplier);
        
        let transportCost = 0;
        if (distance < tier.busThreshold) {
          const busesNeeded = Math.ceil(adjustedPartySize / 56);
          transportCost = distance * tier.busCostPerMile * busesNeeded;
        } else {
          transportCost = tier.charterCost;
        }
        
        const accommodationCost = adjustedPartySize * tier.perDiem;
        return transportCost + accommodationCost;
      }
      
      // Compare costs for same distance
      const distance = 800; // Cross-regional trip
      
      const tier2Cost = calculateTravelCost(distance, 'TIER_2');
      const tier3Cost = calculateTravelCost(distance, 'TIER_3');
      
      // Tier 2 should be more expensive due to higher standards
      expect(tier2Cost).toBeGreaterThan(tier3Cost);
      
      // Verify the cost difference is reasonable
      const costRatio = tier2Cost / tier3Cost;
      expect(costRatio).toBeGreaterThan(1.0);
      expect(costRatio).toBeLessThan(4.0); // Adjusted for tier differences
    });

    test('should account for different transportation thresholds', () => {
      function getTransportationMode(distance, tier) {
        const thresholds = {
          TIER_2: { bus: 600, charter: 1200 },
          TIER_3: { bus: 1000, charter: 1500 } // Higher threshold but still uses charter for very long trips
        };
        
        const tierThresholds = thresholds[tier];
        
        if (distance < tierThresholds.bus) {
          return 'BUS';
        } else if (distance < tierThresholds.charter) {
          return tier === 'TIER_2' ? 'CHARTER_FLIGHT' : 'BUS'; // Tier 3 extends bus use
        } else {
          return 'CHARTER_FLIGHT';
        }
      }
      
      // Test 800-mile trip
      expect(getTransportationMode(800, 'TIER_2')).toBe('CHARTER_FLIGHT');
      expect(getTransportationMode(800, 'TIER_3')).toBe('BUS'); // Extends bus usage
      
      // Test 1200-mile trip
      expect(getTransportationMode(1200, 'TIER_2')).toBe('CHARTER_FLIGHT');
      expect(getTransportationMode(1200, 'TIER_3')).toBe('BUS'); // Tier 3 extends bus usage to 1000 miles
      
      // Test 1600-mile trip - even Tier 3 needs charter eventually
      expect(getTransportationMode(1600, 'TIER_3')).toBe('CHARTER_FLIGHT');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle mixed-tier matchups', () => {
      function analyzeMixedTierGame(homeSchool, awaySchool) {
        // Simplified tier determination
        const tier2Schools = ['Kansas', 'Iowa State', 'Florida', 'Missouri', 'Oklahoma'];
        const tier3Schools = ['Air Force', 'Denver', 'San Diego State'];
        
        function getTier(school) {
          if (tier2Schools.includes(school)) return 'TIER_2';
          if (tier3Schools.includes(school)) return 'TIER_3';
          return 'TIER_2'; // Default
        }
        
        const homeTier = getTier(homeSchool);
        const awayTier = getTier(awaySchool);
        
        return {
          homeTier,
          awayTier,
          tierMismatch: homeTier !== awayTier,
          budgetComplexity: homeTier !== awayTier ? 'high' : 'normal'
        };
      }
      
      // Tier 2 vs Tier 2 (normal)
      const result1 = analyzeMixedTierGame('Kansas', 'Missouri');
      expect(result1.tierMismatch).toBe(false);
      expect(result1.budgetComplexity).toBe('normal');
      
      // Tier 2 vs Tier 3 (complex)
      const result2 = analyzeMixedTierGame('Iowa State', 'Air Force');
      expect(result2.tierMismatch).toBe(true);
      expect(result2.budgetComplexity).toBe('high');
    });

    test('should validate tier assignments are consistent', () => {
      const configuration = {
        fullMembers: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        powerAssociates: ['Florida', 'Missouri', 'Oklahoma'],
        tier3Associates: ['Air Force', 'Cal Baptist', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'South Dakota State', 'Utah Valley', 'Wyoming', 'Denver', 'San Diego State', 'UC Davis', 'Old Dominion', 'Tulsa', 'Fresno']
      };
      
      // Verify no school appears in multiple categories
      const allSchools = [
        ...configuration.fullMembers,
        ...configuration.powerAssociates,
        ...configuration.tier3Associates
      ];
      
      const uniqueSchools = [...new Set(allSchools)];
      expect(allSchools.length).toBe(uniqueSchools.length);
      
      // Verify Power 5 schools are not in Tier 3 list
      configuration.powerAssociates.forEach(school => {
        expect(configuration.tier3Associates).not.toContain(school);
      });
      
      // Verify full members are not in associate lists
      configuration.fullMembers.forEach(school => {
        expect(configuration.powerAssociates).not.toContain(school);
        expect(configuration.tier3Associates).not.toContain(school);
      });
    });
  });
});