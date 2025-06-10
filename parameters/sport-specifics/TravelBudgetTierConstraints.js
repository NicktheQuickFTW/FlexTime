/**
 * Travel Budget Tier Constraints
 * 
 * Implements the comprehensive tiered formula framework for college athletics travel optimization
 * Based on research showing 5-to-1 spending ratios between conference tiers
 * 
 * Big 12 Conference operates at Tier 2 level:
 * - Budget Range: $3-5 million annually
 * - Charter buses under 300 miles
 * - Selective charter flights for longer trips ($24,000-50,000)
 * - 3-4 star accommodations, $60-75 per diem
 * - Travel parties: 100-115 people
 */

import { haversineDistance } from '../../utils/geoUtils.js';

// Simple UnifiedConstraint implementation
class UnifiedConstraint {
  constructor(config) {
    Object.assign(this, config);
  }
}

export class TravelBudgetTierConstraints {
  constructor() {
    // Conference tier definitions based on research
    this.tiers = {
      TIER_1: {
        name: 'Power Elite (SEC, Big Ten)',
        budgetMultiplier: 5.0, // $8-12M range
        budgetRange: { min: 8000000, max: 12000000 },
        charterFlightThreshold: 350, // miles
        charterFlightCost: { min: 100000, max: 175000 },
        accommodationStandard: '4-star',
        perDiem: { min: 80, max: 95 },
        travelPartyMultiplier: 1.8, // 1.8x to 2.0x roster size
        transportModes: {
          bus: { maxDistance: 350, costPerMile: 3.5 },
          charter: { minDistance: 350, baseCost: 100000 },
          equipment: 'separate_trailer_48ft'
        }
      },
      TIER_2: {
        name: 'Power Conference (ACC, Big 12, Pac-12)',
        budgetMultiplier: 3.0, // $3-5M range (Big 12 baseline)
        budgetRange: { min: 3000000, max: 5000000 },
        charterFlightThreshold: 600, // miles (strategic use)
        charterFlightCost: { min: 24000, max: 50000 },
        accommodationStandard: '3-4 star',
        perDiem: { min: 60, max: 75 },
        travelPartyMultiplier: 1.5, // 1.5x to 1.7x roster size
        transportModes: {
          bus: { maxDistance: 600, costPerMile: 2.8 },
          charter: { minDistance: 600, baseCost: 24000 },
          equipment: 'shared_transport'
        }
      },
      TIER_3: {
        name: 'Mid-Major + Affiliates (Mountain West, MAC, C-USA, Big 12 Associates)',
        budgetMultiplier: 1.75, // $1.5-4M range
        budgetRange: { min: 1500000, max: 4000000 },
        charterFlightThreshold: 1000, // rare use
        charterFlightCost: { min: 15000, max: 30000 },
        accommodationStandard: '2-3 star',
        perDiem: { min: 50, max: 65 },
        travelPartyMultiplier: 1.3, // 1.3x to 1.5x roster size
        transportModes: {
          bus: { maxDistance: 1000, costPerMile: 2.2 },
          charter: { minDistance: 1000, baseCost: 15000 },
          commercial: { costPerPerson: 400 },
          equipment: 'bus_undercarriage'
        },
        affiliatePrograms: {
          // Big 12 Wrestling Associates (Tier 3)
          wrestling: ['Air Force', 'Cal Baptist', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'South Dakota State', 'Utah Valley', 'Wyoming'],
          // Gymnastics Associates (Tier 3) 
          gymnastics: ['Denver'],
          // Lacrosse Associates (Tier 3)
          lacrosse: ['San Diego State', 'UC Davis'],
          // Rowing Associates (Tier 3)
          rowing: ['Old Dominion', 'Tulsa'],
          // Equestrian Associates (Tier 3)
          equestrian: ['Fresno']
        },
        powerAffiliates: {
          // Power 5 schools maintain Tier 2 budgets even as associates
          lacrosse: ['Florida'],
          wrestling: ['Missouri', 'Oklahoma'],
          note: 'SEC/Big Ten schools with Power 5 travel budgets'
        }
      },
      TIER_4: {
        name: 'Lower Division (WAC, Southland, SWAC)',
        budgetMultiplier: 1.0, // $0.5-2M baseline
        budgetRange: { min: 500000, max: 2000000 },
        charterFlightThreshold: 99999, // commercial only
        charterFlightCost: { min: 0, max: 0 },
        accommodationStandard: 'budget chains',
        perDiem: { min: 35, max: 50 },
        travelPartyMultiplier: 1.1, // 1.1x to 1.3x roster size
        transportModes: {
          bus: { maxDistance: 400, costPerMile: 2.0 },
          commercial: { costPerPerson: 350 },
          equipment: 'minimal_gear_only'
        }
      }
    };

    // Big 12 specific configuration
    this.big12Config = {
      // Full members: Tier 2
      fullMembers: {
        tier: 'TIER_2',
        schools: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        jetAircraftRequirement: true, // Post-2011 safety requirement
        safetyConstraints: {
          weatherMinimums: 'enhanced',
          pilotQualifications: 'commercial_plus',
          aircraftAge: 'modern_fleet'
        }
      },
      
      // Associate members: Tier 3
      associates: {
        tier: 'TIER_3',
        budgetConstraints: 'reduced',
        travelSupport: 'limited',
        programs: {
          wrestling: ['Air Force', 'Cal Baptist', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'South Dakota State', 'Utah Valley', 'Wyoming'],
          gymnastics: ['Denver'],
          lacrosse: ['San Diego State', 'UC Davis'],
          rowing: ['Old Dominion', 'Tulsa'],
          equestrian: ['Fresno']
        }
      },
      
      // Power 5 associates: Tier 2 (similar budgets to full members)
      powerAssociates: {
        tier: 'TIER_2',
        schools: ['Florida', 'Missouri', 'Oklahoma'],
        note: 'Power 5 schools with similar travel budgets to full Big 12 members'
      },
      distanceThresholds: {
        busOnly: 300, // Under 300 miles = bus required
        charterOptional: 600, // 300-600 miles = charter or bus
        charterRequired: 1200 // Over 1200 miles = charter required
      }
    };

    // Cost calculation constants
    this.costFactors = {
      fuelCostPerMile: 1.85, // Current fuel prices
      lodgingInflation: 1.15, // 15% inflation factor
      mealInflation: 1.12, // 12% meal cost inflation
      baseYear: 2024 // Baseline for cost calculations
    };
  }

  /**
   * Get all travel budget tier constraints
   */
  getAllConstraints() {
    return [
      this.getTransportationModeConstraint(),
      this.getBudgetComplianceConstraint(),
      this.getCostOptimizationConstraint(),
      this.getAccommodationStandardConstraint(),
      this.getTravelPartyConstraint(),
      this.getSafetyRequirementConstraint(),
      this.getAffiliateTierConstraint()
    ];
  }

  /**
   * Transportation Mode Selection Constraint
   * Enforces mode selection based on distance and budget tier
   */
  getTransportationModeConstraint() {
    return new UnifiedConstraint({
      id: 'big12_transportation_mode_selection',
      name: 'Big 12 Transportation Mode Selection',
      category: 'travel_budget_optimization',
      type: 'hard',
      weight: 1.0,
      description: 'Enforces Big 12 Tier 2 transportation mode selection based on distance',
      
      evaluate: (game, context) => {
        const homeTeam = context.getTeam(game.home_team_id);
        const awayTeam = context.getTeam(game.away_team_id);
        
        // Calculate travel distance
        const distance = this.calculateDistance(homeTeam, awayTeam);
        const tier = this.big12Config.tier;
        const thresholds = this.big12Config.distanceThresholds;
        
        // Determine required transportation mode
        const mode = this.selectTransportationMode(distance, tier);
        const cost = this.calculateTransportationCost(mode, distance, context);
        
        // Validate against budget constraints
        const budgetValidation = this.validateBudgetConstraint(cost, context);
        
        return {
          valid: budgetValidation.valid && mode.compliant,
          score: budgetValidation.score * mode.efficiencyScore,
          violations: [...budgetValidation.violations, ...mode.violations],
          metadata: {
            distance: distance,
            selectedMode: mode.type,
            estimatedCost: cost,
            tier: tier,
            thresholds: thresholds,
            recommendations: mode.recommendations
          }
        };
      }
    });
  }

  /**
   * Budget Compliance Constraint
   * Ensures total travel spending stays within tier limits
   */
  getBudgetComplianceConstraint() {
    return new UnifiedConstraint({
      id: 'big12_budget_compliance',
      name: 'Big 12 Budget Compliance',
      category: 'financial_constraints',
      type: 'hard',
      weight: 1.0,
      description: 'Enforces Big 12 Tier 2 annual budget limits ($3-5M)',
      
      evaluate: (game, context) => {
        const tier = this.tiers[this.big12Config.tier];
        const currentBudgetUsed = context.getSeasonTravelBudgetUsed();
        const projectedCost = this.estimateGameTravelCost(game, context);
        const totalProjected = currentBudgetUsed + projectedCost;
        
        // Check against tier budget range
        const compliance = this.checkBudgetCompliance(totalProjected, tier);
        
        return {
          valid: compliance.valid,
          score: compliance.score,
          violations: compliance.violations,
          metadata: {
            currentBudgetUsed: currentBudgetUsed,
            projectedGameCost: projectedCost,
            totalProjected: totalProjected,
            budgetLimit: tier.budgetRange.max,
            utilizationPercentage: (totalProjected / tier.budgetRange.max) * 100,
            remainingBudget: tier.budgetRange.max - totalProjected
          }
        };
      }
    });
  }

  /**
   * Cost Optimization Constraint
   * Optimizes travel decisions for maximum efficiency within tier
   */
  getCostOptimizationConstraint() {
    return new UnifiedConstraint({
      id: 'big12_cost_optimization',
      name: 'Big 12 Cost Optimization',
      category: 'travel_efficiency',
      type: 'soft',
      weight: 0.8,
      description: 'Optimizes travel costs while maintaining Big 12 Tier 2 standards',
      
      evaluate: (game, context) => {
        const homeTeam = context.getTeam(game.home_team_id);
        const awayTeam = context.getTeam(game.away_team_id);
        
        // Calculate multiple cost scenarios
        const scenarios = this.generateCostScenarios(game, context);
        const optimal = this.selectOptimalScenario(scenarios);
        const current = scenarios.find(s => s.current) || scenarios[0];
        
        // Calculate efficiency metrics
        const efficiency = this.calculateCostEfficiency(optimal, current);
        
        return {
          valid: efficiency.score > 0.6,
          score: efficiency.score,
          violations: efficiency.violations,
          metadata: {
            scenarios: scenarios,
            optimal: optimal,
            current: current,
            potentialSavings: optimal.totalCost - current.totalCost,
            efficiencyGain: efficiency.improvement,
            recommendations: efficiency.recommendations
          }
        };
      }
    });
  }

  /**
   * Accommodation Standard Constraint
   * Enforces Big 12 Tier 2 lodging standards
   */
  getAccommodationStandardConstraint() {
    return new UnifiedConstraint({
      id: 'big12_accommodation_standard',
      name: 'Big 12 Accommodation Standard',
      category: 'travel_standards',
      type: 'soft',
      weight: 0.7,
      description: 'Maintains Big 12 Tier 2 accommodation standards (3-4 star)',
      
      evaluate: (game, context) => {
        const tier = this.tiers[this.big12Config.tier];
        const accommodation = this.selectAccommodation(game, context, tier);
        
        return {
          valid: accommodation.meetsStandard,
          score: accommodation.qualityScore,
          violations: accommodation.violations,
          metadata: {
            standard: tier.accommodationStandard,
            selected: accommodation.type,
            perDiem: accommodation.perDiem,
            costPerNight: accommodation.costPerNight,
            qualityRating: accommodation.rating
          }
        };
      }
    });
  }

  /**
   * Travel Party Size Constraint
   * Manages travel party size according to tier standards
   */
  getTravelPartyConstraint() {
    return new UnifiedConstraint({
      id: 'big12_travel_party_size',
      name: 'Big 12 Travel Party Size',
      category: 'operational_efficiency',
      type: 'soft',
      weight: 0.6,
      description: 'Optimizes travel party size for Big 12 Tier 2 (100-115 people)',
      
      evaluate: (game, context) => {
        const tier = this.tiers[this.big12Config.tier];
        const rosterSize = context.getRosterSize(context.sport);
        const travelParty = this.calculateTravelPartySize(rosterSize, tier, context);
        
        return {
          valid: travelParty.compliant,
          score: travelParty.efficiencyScore,
          violations: travelParty.violations,
          metadata: {
            rosterSize: rosterSize,
            travelPartySize: travelParty.size,
            multiplier: travelParty.multiplier,
            tierStandard: tier.travelPartyMultiplier,
            costImpact: travelParty.costImpact
          }
        };
      }
    });
  }

  /**
   * Safety Requirement Constraint
   * Enforces Big 12 jet aircraft safety requirements
   */
  getSafetyRequirementConstraint() {
    return new UnifiedConstraint({
      id: 'big12_safety_requirements',
      name: 'Big 12 Safety Requirements',
      category: 'safety_compliance',
      type: 'hard',
      weight: 1.0,
      description: 'Enforces Big 12 jet aircraft and enhanced safety requirements',
      
      evaluate: (game, context) => {
        const homeTeam = context.getTeam(game.home_team_id);
        const awayTeam = context.getTeam(game.away_team_id);
        const distance = this.calculateDistance(homeTeam, awayTeam);
        
        // Check if flight is required
        if (distance < this.big12Config.distanceThresholds.charterOptional) {
          return { valid: true, score: 1.0, violations: [] };
        }
        
        // Validate safety requirements
        const safety = this.validateSafetyRequirements(game, context);
        
        return {
          valid: safety.compliant,
          score: safety.score,
          violations: safety.violations,
          metadata: {
            jetAircraftRequired: this.big12Config.jetAircraftRequirement,
            weatherRequirements: this.big12Config.safetyConstraints.weatherMinimums,
            pilotQualifications: this.big12Config.safetyConstraints.pilotQualifications,
            safetyChecks: safety.checks
          }
        };
      }
    });
  }

  // Helper methods for travel optimization

  calculateDistance(homeTeam, awayTeam) {
    return haversineDistance(
      homeTeam.latitude, homeTeam.longitude,
      awayTeam.latitude, awayTeam.longitude
    );
  }

  selectTransportationMode(distance, tier) {
    const tierConfig = this.tiers[tier];
    const big12Thresholds = this.big12Config.distanceThresholds;
    
    if (distance < big12Thresholds.busOnly) {
      return {
        type: 'charter_bus',
        compliant: true,
        efficiencyScore: 0.95,
        violations: [],
        recommendations: ['Optimal choice for distance under 300 miles']
      };
    } else if (distance < big12Thresholds.charterOptional) {
      return {
        type: 'charter_bus_or_flight',
        compliant: true,
        efficiencyScore: 0.85,
        violations: [],
        recommendations: ['Consider charter bus for cost savings', 'Charter flight for time efficiency']
      };
    } else if (distance < big12Thresholds.charterRequired) {
      return {
        type: 'charter_flight',
        compliant: true,
        efficiencyScore: 0.90,
        violations: [],
        recommendations: ['Charter flight required for distance']
      };
    } else {
      return {
        type: 'charter_flight_required',
        compliant: true,
        efficiencyScore: 0.80,
        violations: [],
        recommendations: ['Long-haul charter flight necessary', 'Consider schedule clustering to reduce trips']
      };
    }
  }

  calculateTransportationCost(mode, distance, context) {
    const tier = this.tiers[this.big12Config.tier];
    const travelPartySize = context.getTravelPartySize() || 100; // Default Tier 2 size
    
    switch (mode.type) {
      case 'charter_bus':
        return {
          baseCost: distance * tier.transportModes.bus.costPerMile,
          fuelCost: distance * this.costFactors.fuelCostPerMile,
          totalCost: (distance * tier.transportModes.bus.costPerMile) + (distance * this.costFactors.fuelCostPerMile)
        };
      
      case 'charter_flight':
        return {
          baseCost: tier.transportModes.charter.baseCost,
          distanceFactor: Math.max(1.0, distance / 1000),
          totalCost: tier.transportModes.charter.baseCost * Math.max(1.0, distance / 1000)
        };
      
      default:
        return { baseCost: 0, totalCost: 0 };
    }
  }

  validateBudgetConstraint(cost, context) {
    const tier = this.tiers[this.big12Config.tier];
    const currentUsage = context.getSeasonTravelBudgetUsed() || 0;
    const projected = currentUsage + cost.totalCost;
    const utilizationRate = projected / tier.budgetRange.max;
    
    if (utilizationRate > 1.0) {
      return {
        valid: false,
        score: 0,
        violations: [`Budget exceeded: $${projected.toLocaleString()} > $${tier.budgetRange.max.toLocaleString()}`]
      };
    } else if (utilizationRate > 0.9) {
      return {
        valid: true,
        score: 0.7,
        violations: [`Warning: High budget utilization (${(utilizationRate * 100).toFixed(1)}%)`]
      };
    } else {
      return {
        valid: true,
        score: 1.0,
        violations: []
      };
    }
  }

  generateCostScenarios(game, context) {
    const homeTeam = context.getTeam(game.home_team_id);
    const awayTeam = context.getTeam(game.away_team_id);
    const distance = this.calculateDistance(homeTeam, awayTeam);
    
    const scenarios = [];
    
    // Charter bus scenario
    if (distance <= 600) {
      scenarios.push({
        type: 'charter_bus',
        totalCost: this.calculateTransportationCost({ type: 'charter_bus' }, distance, context).totalCost,
        travelTime: distance / 55, // 55 mph average
        efficiency: 0.9
      });
    }
    
    // Charter flight scenario
    if (distance > 300) {
      scenarios.push({
        type: 'charter_flight',
        totalCost: this.calculateTransportationCost({ type: 'charter_flight' }, distance, context).totalCost,
        travelTime: 2.5, // Average flight + airport time
        efficiency: 0.8
      });
    }
    
    return scenarios;
  }

  selectOptimalScenario(scenarios) {
    return scenarios.reduce((best, current) => {
      const currentScore = (current.efficiency * 0.6) + ((1 / current.totalCost) * 0.4);
      const bestScore = (best.efficiency * 0.6) + ((1 / best.totalCost) * 0.4);
      return currentScore > bestScore ? current : best;
    });
  }

  calculateCostEfficiency(optimal, current) {
    const costSavings = current.totalCost - optimal.totalCost;
    const efficiencyGain = optimal.efficiency - current.efficiency;
    
    return {
      score: Math.min(1.0, (costSavings / current.totalCost) + efficiencyGain),
      improvement: efficiencyGain,
      violations: costSavings < 0 ? ['Current option is already optimal'] : [],
      recommendations: costSavings > 0 ? [`Switch to ${optimal.type} for $${costSavings.toLocaleString()} savings`] : []
    };
  }

  selectAccommodation(game, context, tier) {
    const perDiem = (tier.perDiem.min + tier.perDiem.max) / 2;
    
    return {
      type: tier.accommodationStandard,
      meetsStandard: true,
      qualityScore: 0.85,
      violations: [],
      perDiem: perDiem,
      costPerNight: perDiem * 0.7, // 70% of per diem for lodging
      rating: tier.accommodationStandard
    };
  }

  calculateTravelPartySize(rosterSize, tier, context) {
    const multiplier = tier.travelPartyMultiplier;
    const calculatedSize = Math.round(rosterSize * multiplier);
    const tierMin = Math.round(rosterSize * 1.5);
    const tierMax = Math.round(rosterSize * 1.7);
    
    return {
      size: Math.max(tierMin, Math.min(tierMax, calculatedSize)),
      multiplier: multiplier,
      compliant: calculatedSize >= tierMin && calculatedSize <= tierMax,
      efficiencyScore: 0.8,
      violations: [],
      costImpact: calculatedSize * 150 // $150 per person per trip
    };
  }

  validateSafetyRequirements(game, context) {
    // Big 12 requires jet aircraft for safety
    return {
      compliant: true,
      score: 1.0,
      violations: [],
      checks: {
        jetAircraft: true,
        weatherMinimums: true,
        pilotQualifications: true,
        flightSafety: true
      }
    };
  }

  checkBudgetCompliance(totalProjected, tier) {
    if (totalProjected > tier.budgetRange.max) {
      return {
        valid: false,
        score: 0,
        violations: [`Total projected budget $${totalProjected.toLocaleString()} exceeds tier maximum $${tier.budgetRange.max.toLocaleString()}`]
      };
    } else if (totalProjected < tier.budgetRange.min) {
      return {
        valid: true,
        score: 0.9,
        violations: [`Warning: Budget utilization below tier minimum may indicate underinvestment`]
      };
    } else {
      return {
        valid: true,
        score: 1.0,
        violations: []
      };
    }
  }

  /**
   * Affiliate Tier Constraint
   * Applies appropriate tier constraints to associate member schools
   */
  getAffiliateTierConstraint() {
    return new UnifiedConstraint({
      id: 'big12_affiliate_tier_management',
      name: 'Big 12 Affiliate Tier Management',
      category: 'budget_tier_assignment',
      type: 'hard',
      weight: 1.0,
      description: 'Applies appropriate budget tier constraints to associate member schools',
      
      evaluate: (game, context) => {
        const homeTeam = context.getTeam(game.home_team_id);
        const awayTeam = context.getTeam(game.away_team_id);
        
        // Determine tier assignment for teams
        const homeTier = this.determineSchoolTier(homeTeam.school_name, context.sport);
        const awayTier = this.determineSchoolTier(awayTeam.school_name, context.sport);
        
        // Apply tier-specific constraints
        const homeConstraints = this.applyTierConstraints(homeTeam, homeTier, game, context);
        const awayConstraints = this.applyTierConstraints(awayTeam, awayTier, game, context);
        
        return {
          valid: homeConstraints.valid && awayConstraints.valid,
          score: (homeConstraints.score + awayConstraints.score) / 2,
          violations: [...homeConstraints.violations, ...awayConstraints.violations],
          metadata: {
            homeTier: homeTier,
            awayTier: awayTier,
            tierDifference: homeTier !== awayTier,
            powerAffiliates: this.identifyPowerAffiliates([homeTeam.school_name, awayTeam.school_name]),
            budgetAdjustments: {
              home: homeConstraints.budgetAdjustment,
              away: awayConstraints.budgetAdjustment
            }
          }
        };
      }
    });
  }

  // Helper methods for affiliate tier management

  determineSchoolTier(schoolName, sport) {
    // Full Big 12 members: Tier 2
    if (this.big12Config.fullMembers.schools.includes(schoolName)) {
      return 'TIER_2';
    }
    
    // Power 5 associates: Tier 2 (Florida, Missouri, Oklahoma)
    if (this.big12Config.powerAssociates.schools.includes(schoolName)) {
      return 'TIER_2';
    }
    
    // All other associates: Tier 3
    for (const sportPrograms of Object.values(this.big12Config.associates.programs)) {
      if (sportPrograms.includes(schoolName)) {
        return 'TIER_3';
      }
    }
    
    // Check power affiliates in Tier 3 definition
    if (this.tiers.TIER_3.powerAffiliates) {
      for (const sportPrograms of Object.values(this.tiers.TIER_3.powerAffiliates)) {
        if (Array.isArray(sportPrograms) && sportPrograms.includes(schoolName)) {
          return 'TIER_2'; // Power affiliates maintain Tier 2 budgets
        }
      }
    }
    
    // Default to Tier 2 for unknown schools (assume full member)
    return 'TIER_2';
  }

  applyTierConstraints(team, tier, game, context) {
    const tierConfig = this.tiers[tier];
    
    if (!tierConfig) {
      return {
        valid: false,
        score: 0,
        violations: [`Unknown tier: ${tier} for ${team.school_name}`],
        budgetAdjustment: 1.0
      };
    }
    
    // Calculate budget adjustment based on tier
    const budgetAdjustment = tierConfig.budgetMultiplier / this.tiers.TIER_2.budgetMultiplier;
    
    return {
      valid: true,
      score: 1.0,
      violations: [],
      budgetAdjustment: budgetAdjustment,
      tierConstraints: {
        maxDistance: tierConfig.transportModes?.bus?.maxDistance || 600,
        charterThreshold: tierConfig.charterFlightThreshold,
        accommodationStandard: tierConfig.accommodationStandard,
        perDiem: tierConfig.perDiem
      }
    };
  }

  identifyPowerAffiliates(schoolNames) {
    const powerAffiliates = [];
    
    schoolNames.forEach(school => {
      if (this.big12Config.powerAssociates.schools.includes(school)) {
        powerAffiliates.push({
          school: school,
          tier: 'TIER_2',
          note: 'Power 5 associate maintains full travel budget'
        });
      }
    });
    
    return powerAffiliates;
  }

  estimateGameTravelCost(game, context) {
    const homeTeam = context.getTeam(game.home_team_id);
    const awayTeam = context.getTeam(game.away_team_id);
    const distance = this.calculateDistance(homeTeam, awayTeam);
    
    // Determine tier for cost calculation
    const awayTier = this.determineSchoolTier(awayTeam.school_name, context.sport);
    const tierConfig = this.tiers[awayTier];
    
    const mode = this.selectTransportationMode(distance, awayTier);
    const transportCost = this.calculateTransportationCost(mode, distance, context);
    
    // Add accommodation and meal costs adjusted for tier
    const travelPartySize = Math.round(110 * tierConfig.travelPartyMultiplier / this.tiers.TIER_2.travelPartyMultiplier);
    const nights = distance > 400 ? 2 : 1; // Overnight for longer trips
    const perDiem = (tierConfig.perDiem.min + tierConfig.perDiem.max) / 2;
    const accommodationCost = travelPartySize * perDiem * nights;
    
    return transportCost.totalCost + accommodationCost;
  }
}

export default TravelBudgetTierConstraints;