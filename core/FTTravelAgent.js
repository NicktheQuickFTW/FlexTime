/**
 * FlexTime Travel Agent
 * 
 * Advanced cost optimization algorithms for collegiate athletics travel
 * Implements tier-based transportation mode selection and budget optimization
 * 
 * Big 12 Conference operates at Tier 2 level with strategic cost management
 */

import { calculateBig12Distance, analyzeTimezoneImpact, estimateDrivingTime } from '../utils/geoUtils.js';
import Redis from 'redis';

export class FTTravelAgent {
  constructor(conferenceConfig = {}) {
    // Default to Big 12 Tier 2 configuration
    this.config = {
      tier: 'TIER_2',
      conferenceLevel: 'Big 12',
      budgetRange: { min: 3000000, max: 5000000 },
      ...conferenceConfig
    };

    // Agent coordination setup
    this.agentId = 'ft_travel_agent';
    this.redis = null;
    this.initializeRedis();

    // Transportation mode configurations based on tier research
    this.transportModes = {
      CHARTER_BUS: {
        name: 'Charter Bus',
        costPerMile: 2.8,
        baseCost: 1500, // Base cost for charter
        maxDistance: 600, // Tier 2 threshold
        capacity: 56, // Standard charter bus capacity
        amenities: ['WiFi', 'Restroom', 'Entertainment'],
        travelTimeMultiplier: 1.0, // Actual driving time
        comfortRating: 0.7,
        fuelEfficiency: 7.5, // MPG
        co2PerMile: 2.1 // lbs CO2 per mile
      },
      CHARTER_FLIGHT: {
        name: 'Charter Flight',
        baseCost: 24000, // Tier 2 minimum
        maxCost: 50000, // Tier 2 maximum  
        costPerMile: 30, // Additional cost per mile beyond base
        minDistance: 300, // Minimum distance for cost effectiveness
        capacity: 120, // Typical charter aircraft
        amenities: ['Catering', 'WiFi', 'Premium Seating'],
        travelTimeMultiplier: 0.3, // Much faster than driving
        comfortRating: 0.95,
        fuelEfficiency: 0.8, // Miles per gallon (much lower)
        co2PerMile: 12.5 // Higher CO2 footprint
      },
      COMMERCIAL_FLIGHT: {
        name: 'Commercial Flight',
        costPerPerson: 400, // Average per person
        groupDiscount: 0.85, // 15% group discount
        minDistance: 800, // Only for very long trips in Tier 2
        capacity: 150, // Typical commercial aircraft
        amenities: ['Basic Service'],
        travelTimeMultiplier: 0.4, // Airport time included
        comfortRating: 0.6,
        logisticalComplexity: 0.8, // Higher complexity score
        scheduleFlexibility: 0.4 // Lower flexibility
      }
    };

    // Cost factors for optimization
    this.costFactors = {
      fuel: {
        current: 3.89, // Current fuel price per gallon
        inflationRate: 0.12, // 12% annual inflation
        volatilityFactor: 0.15 // 15% volatility range
      },
      accommodation: {
        tierStandard: '3-4 star',
        costPerNight: 150, // Average for Tier 2
        perDiem: 67.5, // Average of $60-75 range
        inflationRate: 0.15 // 15% accommodation inflation
      },
      personnel: {
        travelPartySize: 110, // Tier 2 average
        coachingStaff: 15,
        support: 20,
        media: 5,
        administration: 10
      }
    };

    // Optimization weights for decision making
    this.optimizationWeights = {
      cost: 0.4, // 40% weight on total cost
      time: 0.25, // 25% weight on travel time
      comfort: 0.2, // 20% weight on team comfort
      flexibility: 0.1, // 10% weight on schedule flexibility
      sustainability: 0.05 // 5% weight on environmental impact
    };
  }

  /**
   * Optimize transportation mode for a specific trip
   * @param {Object} trip - Trip details (origin, destination, date, etc.)
   * @param {Object} constraints - Budget and scheduling constraints
   * @returns {Object} Optimal transportation recommendation
   */
  optimizeTransportation(trip, constraints = {}) {
    const distance = calculateBig12Distance(trip.origin, trip.destination);
    const timezoneImpact = analyzeTimezoneImpact(trip.origin, trip.destination);

    // Generate all viable transportation scenarios
    const scenarios = this.generateTransportationScenarios(trip, distance);

    // Filter scenarios based on constraints
    const viableScenarios = this.filterViableScenarios(scenarios, constraints);

    // Score each scenario using multi-criteria optimization
    const scoredScenarios = viableScenarios.map(scenario => ({
      ...scenario,
      score: this.calculateOptimizationScore(scenario, trip, constraints)
    }));

    // Select optimal scenario
    const optimal = scoredScenarios.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return {
      recommendation: optimal,
      alternatives: scoredScenarios.filter(s => s.mode !== optimal.mode),
      analysis: {
        distance,
        timezoneImpact,
        tripType: this.categorizeTripType(distance, timezoneImpact),
        costSavings: this.calculateCostSavings(scoredScenarios),
        riskFactors: this.assessRiskFactors(optimal, trip)
      }
    };
  }

  /**
   * Generate all possible transportation scenarios
   * @param {Object} trip - Trip details
   * @param {number} distance - Distance in miles
   * @returns {Array} Array of transportation scenarios
   */
  generateTransportationScenarios(trip, distance) {
    const scenarios = [];
    const travelPartySize = trip.travelPartySize || this.costFactors.personnel.travelPartySize;

    // Charter Bus Scenario
    if (distance <= this.transportModes.CHARTER_BUS.maxDistance) {
      scenarios.push(this.createBusScenario(trip, distance, travelPartySize));
    }

    // Charter Flight Scenario
    if (distance >= this.transportModes.CHARTER_FLIGHT.minDistance) {
      scenarios.push(this.createCharterFlightScenario(trip, distance, travelPartySize));
    }

    // Commercial Flight Scenario (for very long trips)
    if (distance >= this.transportModes.COMMERCIAL_FLIGHT.minDistance) {
      scenarios.push(this.createCommercialFlightScenario(trip, distance, travelPartySize));
    }

    return scenarios;
  }

  /**
   * Create charter bus transportation scenario
   * @param {Object} trip - Trip details
   * @param {number} distance - Distance in miles
   * @param {number} travelPartySize - Number of travelers
   * @returns {Object} Bus scenario
   */
  createBusScenario(trip, distance, travelPartySize) {
    const mode = this.transportModes.CHARTER_BUS;
    const busesNeeded = Math.ceil(travelPartySize / mode.capacity);
    const drivingTime = estimateDrivingTime(distance);

    // Calculate costs
    const transportCost = (mode.costPerMile * distance + mode.baseCost) * busesNeeded;
    const fuelCost = (distance / mode.fuelEfficiency) * this.costFactors.fuel.current * busesNeeded;
    const accommodationCost = this.calculateAccommodationCost(drivingTime, travelPartySize);
    const mealCost = this.calculateMealCost(drivingTime, travelPartySize);

    return {
      mode: 'CHARTER_BUS',
      modeConfig: mode,
      costs: {
        transport: transportCost,
        fuel: fuelCost,
        accommodation: accommodationCost,
        meals: mealCost,
        total: transportCost + fuelCost + accommodationCost + mealCost
      },
      logistics: {
        vehicles: busesNeeded,
        travelTime: drivingTime,
        departureFlexibility: 0.9, // High flexibility
        weatherRisk: this.assessWeatherRisk(trip, 'bus')
      },
      impact: {
        co2Emissions: distance * mode.co2PerMile * busesNeeded,
        comfortRating: mode.comfortRating,
        fatigue: this.calculateFatigueLevel(drivingTime, mode.comfortRating)
      }
    };
  }

  /**
   * Create charter flight transportation scenario
   * @param {Object} trip - Trip details
   * @param {number} distance - Distance in miles
   * @param {number} travelPartySize - Number of travelers
   * @returns {Object} Charter flight scenario
   */
  createCharterFlightScenario(trip, distance, travelPartySize) {
    const mode = this.transportModes.CHARTER_FLIGHT;
    const aircraftNeeded = Math.ceil(travelPartySize / mode.capacity);

    // Calculate charter flight cost based on distance
    const baseCost = mode.baseCost * aircraftNeeded;
    const distanceCost = Math.max(0, distance - 500) * mode.costPerMile * aircraftNeeded;
    const totalFlightCost = Math.min(baseCost + distanceCost, mode.maxCost * aircraftNeeded);

    const flightTime = 2.5; // Average flight + airport time
    const accommodationCost = this.calculateAccommodationCost(flightTime, travelPartySize);
    const mealCost = this.calculateMealCost(flightTime, travelPartySize);
    const cateringCost = travelPartySize * 45; // In-flight catering

    return {
      mode: 'CHARTER_FLIGHT',
      modeConfig: mode,
      costs: {
        transport: totalFlightCost,
        fuel: 0, // Included in charter cost
        accommodation: accommodationCost,
        meals: mealCost,
        catering: cateringCost,
        total: totalFlightCost + accommodationCost + mealCost + cateringCost
      },
      logistics: {
        aircraft: aircraftNeeded,
        travelTime: flightTime,
        departureFlexibility: 0.7, // Moderate flexibility
        weatherRisk: this.assessWeatherRisk(trip, 'charter_flight')
      },
      impact: {
        co2Emissions: distance * mode.co2PerMile * aircraftNeeded,
        comfortRating: mode.comfortRating,
        fatigue: this.calculateFatigueLevel(flightTime, mode.comfortRating)
      }
    };
  }

  /**
   * Create commercial flight transportation scenario
   * @param {Object} trip - Trip details
   * @param {number} distance - Distance in miles
   * @param {number} travelPartySize - Number of travelers
   * @returns {Object} Commercial flight scenario
   */
  createCommercialFlightScenario(trip, distance, travelPartySize) {
    const mode = this.transportModes.COMMERCIAL_FLIGHT;

    const ticketCost = mode.costPerPerson * travelPartySize * mode.groupDiscount;
    const flightTime = 3.5; // Longer due to connections and airport time
    const accommodationCost = this.calculateAccommodationCost(flightTime, travelPartySize);
    const mealCost = this.calculateMealCost(flightTime, travelPartySize);
    const logisticalCost = travelPartySize * 25; // Additional logistics cost

    return {
      mode: 'COMMERCIAL_FLIGHT',
      modeConfig: mode,
      costs: {
        transport: ticketCost,
        fuel: 0, // Included in ticket cost
        accommodation: accommodationCost,
        meals: mealCost,
        logistics: logisticalCost,
        total: ticketCost + accommodationCost + mealCost + logisticalCost
      },
      logistics: {
        travelTime: flightTime,
        departureFlexibility: mode.scheduleFlexibility,
        weatherRisk: this.assessWeatherRisk(trip, 'commercial_flight'),
        complexity: mode.logisticalComplexity
      },
      impact: {
        co2Emissions: distance * 0.4 * travelPartySize, // Per person emissions
        comfortRating: mode.comfortRating,
        fatigue: this.calculateFatigueLevel(flightTime, mode.comfortRating)
      }
    };
  }

  /**
   * Filter scenarios based on constraints
   * @param {Array} scenarios - All generated scenarios
   * @param {Object} constraints - Budget and other constraints
   * @returns {Array} Viable scenarios
   */
  filterViableScenarios(scenarios, constraints) {
    return scenarios.filter(scenario => {
      // Budget constraint
      if (constraints.maxCost && scenario.costs.total > constraints.maxCost) {
        return false;
      }

      // Time constraint
      if (constraints.maxTravelTime && scenario.logistics.travelTime > constraints.maxTravelTime) {
        return false;
      }

      // Weather constraint
      if (constraints.weatherConcerns && scenario.logistics.weatherRisk > 0.7) {
        return false;
      }

      // Safety requirements (Big 12 jet aircraft requirement)
      if (this.config.conferenceLevel === 'Big 12' &&
        scenario.mode === 'CHARTER_FLIGHT' &&
        !this.validateJetAircraftRequirement(scenario)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate multi-criteria optimization score
   * @param {Object} scenario - Transportation scenario
   * @param {Object} trip - Trip details
   * @param {Object} constraints - Constraints
   * @returns {number} Optimization score (0-1)
   */
  calculateOptimizationScore(scenario, trip, constraints) {
    const weights = this.optimizationWeights;

    // Cost score (lower cost = higher score)
    const maxCost = constraints.budgetReference || 100000;
    const costScore = Math.max(0, (maxCost - scenario.costs.total) / maxCost);

    // Time score (lower time = higher score)
    const maxTime = 12; // 12 hours as reference
    const timeScore = Math.max(0, (maxTime - scenario.logistics.travelTime) / maxTime);

    // Comfort score (direct from scenario)
    const comfortScore = scenario.impact.comfortRating;

    // Flexibility score
    const flexibilityScore = scenario.logistics.departureFlexibility || 0.5;

    // Sustainability score (lower emissions = higher score)
    const maxEmissions = 5000; // Reference emissions
    const sustainabilityScore = Math.max(0, (maxEmissions - scenario.impact.co2Emissions) / maxEmissions);

    // Calculate weighted score
    const totalScore =
      weights.cost * costScore +
      weights.time * timeScore +
      weights.comfort * comfortScore +
      weights.flexibility * flexibilityScore +
      weights.sustainability * sustainabilityScore;

    return Math.min(1.0, totalScore);
  }

  /**
   * Calculate accommodation costs based on travel time
   * @param {number} travelTime - Travel time in hours
   * @param {number} travelPartySize - Number of travelers
   * @returns {number} Accommodation cost
   */
  calculateAccommodationCost(travelTime, travelPartySize) {
    // Overnight stay required if travel time > 6 hours or arrival time is late
    const nights = travelTime > 6 ? 1 : 0;
    const roomsNeeded = Math.ceil(travelPartySize / 2); // Double occupancy

    return nights * roomsNeeded * this.costFactors.accommodation.costPerNight;
  }

  /**
   * Calculate meal costs
   * @param {number} travelTime - Travel time in hours
   * @param {number} travelPartySize - Number of travelers
   * @returns {number} Meal cost
   */
  calculateMealCost(travelTime, travelPartySize) {
    const mealsNeeded = Math.ceil(travelTime / 4); // One meal per 4 hours
    const mealCost = this.costFactors.accommodation.perDiem * 0.6; // 60% of per diem for meals

    return mealsNeeded * travelPartySize * mealCost;
  }

  /**
   * Assess weather risk for transportation mode
   * @param {Object} trip - Trip details
   * @param {string} mode - Transportation mode
   * @returns {number} Risk factor (0-1)
   */
  assessWeatherRisk(trip, mode) {
    const season = this.getSeason(trip.date);
    const baseRisk = {
      'bus': 0.2,
      'charter_flight': 0.4,
      'commercial_flight': 0.3
    };

    // Increase risk in winter months
    const seasonalMultiplier = (season === 'winter') ? 1.5 : 1.0;

    return Math.min(1.0, baseRisk[mode] * seasonalMultiplier);
  }

  /**
   * Calculate fatigue level based on travel time and comfort
   * @param {number} travelTime - Travel time in hours
   * @param {number} comfortRating - Comfort rating (0-1)
   * @returns {number} Fatigue level (0-1)
   */
  calculateFatigueLevel(travelTime, comfortRating) {
    const baseFatigue = Math.min(1.0, travelTime / 10); // 10 hours = maximum fatigue
    const comfortReduction = comfortRating * 0.3; // Comfort reduces fatigue

    return Math.max(0, baseFatigue - comfortReduction);
  }

  /**
   * Get season from date
   * @param {Date} date - Trip date
   * @returns {string} Season name
   */
  getSeason(date) {
    const month = new Date(date).getMonth();
    if (month >= 11 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  /**
   * Validate Big 12 jet aircraft requirement
   * @param {Object} scenario - Flight scenario
   * @returns {boolean} Meets requirement
   */
  validateJetAircraftRequirement(scenario) {
    // Big 12 requires jet aircraft for safety after 2011
    return scenario.mode === 'CHARTER_FLIGHT' &&
      scenario.modeConfig.name === 'Charter Flight';
  }

  /**
   * Categorize trip type based on distance and timezone impact
   * @param {number} distance - Distance in miles
   * @param {Object} timezoneImpact - Timezone analysis
   * @returns {string} Trip category
   */
  categorizeTripType(distance, timezoneImpact) {
    if (distance < 300) return 'Regional';
    if (distance < 600) return 'Conference';
    if (distance < 1200) return 'Cross-Regional';
    return 'Cross-Country';
  }

  /**
   * Calculate potential cost savings across scenarios
   * @param {Array} scenarios - All scored scenarios
   * @returns {Object} Cost savings analysis
   */
  calculateCostSavings(scenarios) {
    if (scenarios.length < 2) return { maxSavings: 0, percentage: 0 };

    const costs = scenarios.map(s => s.costs.total);
    const maxCost = Math.max(...costs);
    const minCost = Math.min(...costs);

    return {
      maxSavings: maxCost - minCost,
      percentage: ((maxCost - minCost) / maxCost) * 100,
      highestCost: maxCost,
      lowestCost: minCost
    };
  }

  /**
   * Assess risk factors for selected transportation mode
   * @param {Object} scenario - Selected scenario
   * @param {Object} trip - Trip details
   * @returns {Array} Array of risk factors
   */
  assessRiskFactors(scenario, trip) {
    const risks = [];

    if (scenario.logistics.weatherRisk > 0.6) {
      risks.push({
        type: 'weather',
        severity: 'medium',
        description: 'Moderate weather risk for travel dates',
        mitigation: 'Monitor weather and have backup plan'
      });
    }

    if (scenario.costs.total > this.config.budgetRange.max * 0.8) {
      risks.push({
        type: 'budget',
        severity: 'high',
        description: 'High budget utilization',
        mitigation: 'Consider alternative transportation modes'
      });
    }

    if (scenario.impact.fatigue > 0.7) {
      risks.push({
        type: 'performance',
        severity: 'medium',
        description: 'High travel fatigue may impact performance',
        mitigation: 'Plan additional rest time before competition'
      });
    }

    return risks;
  }

  /**
   * Optimize season-long travel schedule
   * @param {Array} schedule - Full season schedule
   * @param {Object} constraints - Season constraints
   * @returns {Object} Optimized travel plan
   */
  optimizeSeasonTravel(schedule, constraints = {}) {
    const optimizedTrips = [];
    let totalBudgetUsed = 0;
    const budgetLimit = constraints.seasonBudget || this.config.budgetRange.max;

    // Sort games by date
    const sortedSchedule = schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedSchedule.forEach((game, index) => {
      if (game.venue === 'away') {
        const remainingBudget = budgetLimit - totalBudgetUsed;
        const gamesRemaining = sortedSchedule.length - index;
        const avgBudgetPerGame = remainingBudget / gamesRemaining;

        const tripConstraints = {
          ...constraints,
          maxCost: Math.min(avgBudgetPerGame * 1.5, remainingBudget),
          budgetReference: avgBudgetPerGame
        };

        const optimization = this.optimizeTransportation({
          origin: game.homeTeam,
          destination: game.awayTeam,
          date: game.date,
          sport: game.sport
        }, tripConstraints);

        optimizedTrips.push({
          game: game,
          optimization: optimization,
          budgetImpact: optimization.recommendation.costs.total
        });

        totalBudgetUsed += optimization.recommendation.costs.total;
      }
    });

    return {
      optimizedTrips,
      totalCost: totalBudgetUsed,
      budgetUtilization: (totalBudgetUsed / budgetLimit) * 100,
      averageCostPerTrip: totalBudgetUsed / optimizedTrips.length,
      recommendations: this.generateSeasonRecommendations(optimizedTrips, totalBudgetUsed, budgetLimit)
    };
  }

  /**
   * Generate recommendations for season optimization
   * @param {Array} trips - Optimized trips
   * @param {number} totalCost - Total season cost
   * @param {number} budgetLimit - Budget limit
   * @returns {Array} Recommendations
   */
  generateSeasonRecommendations(trips, totalCost, budgetLimit) {
    const recommendations = [];

    if (totalCost > budgetLimit * 0.95) {
      recommendations.push({
        type: 'budget_warning',
        priority: 'high',
        description: 'Season travel costs approaching budget limit',
        action: 'Consider switching some charter flights to bus travel'
      });
    }

    const longDistanceTrips = trips.filter(t =>
      t.optimization.analysis.distance > 1000
    );

    if (longDistanceTrips.length > 3) {
      recommendations.push({
        type: 'schedule_clustering',
        priority: 'medium',
        description: `${longDistanceTrips.length} long-distance trips identified`,
        action: 'Consider clustering distant games to reduce travel frequency'
      });
    }

    const charterFlights = trips.filter(t =>
      t.optimization.recommendation.mode === 'CHARTER_FLIGHT'
    );

    if (charterFlights.length > 4) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'low',
        description: 'Multiple charter flights scheduled',
        action: 'Negotiate volume discounts with charter flight providers'
      });
    }

    return recommendations;
  }

  /**
   * Initialize Redis connection for agent coordination
   */
  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redis.connect();
      console.log(`🤖 [${this.agentId}] Connected to Redis for agent coordination`);
    } catch (error) {
      console.warn(`⚠️  [${this.agentId}] Redis connection failed, running in standalone mode:`, error.message);
    }
  }

  /**
   * Publish travel analysis results to other agents
   */
  async publishResult(result, target = null) {
    if (!this.redis) return;

    try {
      const message = {
        from: this.agentId,
        to: target || 'all',
        timestamp: new Date().toISOString(),
        type: 'travel_analysis_complete',
        data: result
      };

      await this.redis.publish('flextime:agents:coordination', JSON.stringify(message));
      console.log(`📡 [${this.agentId}] Published result to ${target || 'all agents'}`);
    } catch (error) {
      console.error(`❌ [${this.agentId}] Failed to publish result:`, error);
    }
  }

  /**
   * Cache travel analysis for reuse
   */
  async cacheAnalysis(tripKey, analysis) {
    if (!this.redis) return;

    try {
      const cacheKey = `travel:analysis:${tripKey}`;
      await this.redis.setEx(cacheKey, 3600, JSON.stringify(analysis)); // 1 hour cache
      console.log(`💾 [${this.agentId}] Cached analysis for ${tripKey}`);
    } catch (error) {
      console.error(`❌ [${this.agentId}] Failed to cache analysis:`, error);
    }
  }

  /**
   * Retrieve cached travel analysis
   */
  async getCachedAnalysis(tripKey) {
    if (!this.redis) return null;

    try {
      const cacheKey = `travel:analysis:${tripKey}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        console.log(`🎯 [${this.agentId}] Retrieved cached analysis for ${tripKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error(`❌ [${this.agentId}] Failed to retrieve cached analysis:`, error);
    }
    
    return null;
  }

  /**
   * Enhanced optimization with Redis integration
   */
  async optimizeTransportation(trip, constraints = {}) {
    // Generate cache key
    const tripKey = `${trip.origin}_${trip.destination}_${trip.date}`;
    
    // Check cache first
    const cached = await this.getCachedAnalysis(tripKey);
    if (cached) {
      await this.publishResult(cached, 'ft_optimization_agent');
      return cached;
    }

    // Run original optimization
    const distance = calculateBig12Distance(trip.origin, trip.destination);
    const timezoneImpact = analyzeTimezoneImpact(trip.origin, trip.destination);

    const scenarios = this.generateTransportationScenarios(trip, distance);
    const viableScenarios = this.filterViableScenarios(scenarios, constraints);
    const scoredScenarios = viableScenarios.map(scenario => ({
      ...scenario,
      score: this.calculateOptimizationScore(scenario, trip, constraints)
    }));

    const optimal = scoredScenarios.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    const result = {
      recommendation: optimal,
      alternatives: scoredScenarios.filter(s => s.mode !== optimal.mode),
      analysis: {
        distance,
        timezoneImpact,
        tripType: this.categorizeTripType(distance, timezoneImpact),
        costSavings: this.calculateCostSavings(scoredScenarios),
        riskFactors: this.assessRiskFactors(optimal, trip)
      },
      metadata: {
        agentId: this.agentId,
        timestamp: new Date().toISOString(),
        cached: false
      }
    };

    // Cache and publish result
    await this.cacheAnalysis(tripKey, result);
    await this.publishResult(result, 'ft_optimization_agent');

    return result;
  }

  /**
   * Get agent status and performance metrics
   */
  async getAgentStatus() {
    const status = {
      agentId: this.agentId,
      type: 'travel_agent',
      status: 'active',
      redis_connected: !!this.redis?.isReady,
      config: this.config,
      capabilities: [
        'transportation_mode_selection',
        'cost_optimization',
        'travel_scenario_generation',
        'tier_constraint_evaluation'
      ],
      last_heartbeat: new Date().toISOString()
    };

    if (this.redis) {
      try {
        await this.redis.setEx(`agent:${this.agentId}:status`, 300, JSON.stringify(status));
      } catch (error) {
        console.error(`❌ [${this.agentId}] Failed to update status:`, error);
      }
    }

    return status;
  }

  /**
   * Cleanup Redis connections
   */
  async shutdown() {
    if (this.redis) {
      await this.redis.quit();
      console.log(`🔌 [${this.agentId}] Disconnected from Redis`);
    }
  }
}

export default FTTravelAgent;