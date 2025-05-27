/**
 * Transport Mode Optimization Agent
 * 
 * Specialized agent for making optimal transportation mode decisions (bus vs flight)
 * based on distance, cost, time constraints, and team requirements.
 * 
 * Embedded Knowledge:
 * - Charter bus vs charter flight decision matrices
 * - Distance thresholds and cost breakpoints
 * - Team size and equipment factors
 * - Real-time cost optimization
 */

const { Agent } = require('../../core/agent');

class TransportModeOptimizationAgent extends Agent {
  constructor(options = {}) {
    super({
      name: 'TransportModeOptimizationAgent',
      role: 'travel_optimization',
      capabilities: [
        'transport_mode_selection',
        'cost_benefit_analysis',
        'time_constraint_evaluation',
        'equipment_factor_calculation'
      ],
      ...options
    });

    // Embedded travel cost knowledge from framework
    this.transportModes = {
      charter_bus: {
        distanceThreshold: { min: 0, max: 800, optimal: 500 },
        costPerMile: { min: 3.50, max: 5.50, average: 4.50 },
        timeEfficiency: 0.4, // 40% time efficiency vs flight
        equipmentCapacity: 'high',
        weatherResilience: 'medium'
      },
      charter_flight: {
        distanceThreshold: { min: 200, max: Infinity, optimal: 1000 },
        costPerMile: { min: 15, max: 45, average: 25 },
        timeEfficiency: 1.0, // 100% time efficiency baseline
        equipmentCapacity: 'limited',
        weatherResilience: 'low'
      }
    };

    this.equipmentMultipliers = {
      football: 1.4,
      baseball: 1.2,
      softball: 1.2,
      mens_basketball: 1.1,
      womens_basketball: 1.1,
      soccer: 1.15,
      volleyball: 1.1,
      tennis: 1.0,
      golf: 1.3,
      track_field: 1.25,
      swimming_diving: 1.2,
      wrestling: 1.15,
      gymnastics: 1.2
    };

    this.decisionMatrix = {
      distance_primary: {
        bus_preferred: 200,    // miles - bus always preferred
        mixed_zone: 600,       // miles - analyze both options
        flight_required: 800   // miles - flight typically required
      },
      time_constraints: {
        urgent: 8,      // hours - must arrive within 8 hours
        standard: 16,   // hours - standard travel window
        flexible: 24    // hours - flexible arrival time
      },
      cost_sensitivity: {
        high: 0.15,     // 15% cost difference threshold
        medium: 0.25,   // 25% cost difference threshold
        low: 0.40       // 40% cost difference threshold
      }
    };
  }

  /**
   * Main transport mode optimization method
   */
  async optimizeTransportMode(travelRequest) {
    try {
      this.log('info', `Optimizing transport mode for ${travelRequest.origin} to ${travelRequest.destination}`);

      // Calculate base parameters
      const distance = await this.calculateDistance(travelRequest.origin, travelRequest.destination);
      const timeConstraint = this.evaluateTimeConstraints(travelRequest.constraints);
      const teamRequirements = this.analyzeTeamRequirements(travelRequest);

      // Generate transport options
      const busOption = await this.generateBusOption(distance, teamRequirements, travelRequest);
      const flightOption = await this.generateFlightOption(distance, teamRequirements, travelRequest);

      // Evaluate and recommend
      const recommendation = this.evaluateOptions(busOption, flightOption, timeConstraint, travelRequest.preferences);

      return {
        recommendation: recommendation,
        analysis: {
          distance: distance,
          busOption: busOption,
          flightOption: flightOption,
          factors: this.getDecisionFactors(recommendation, busOption, flightOption)
        },
        confidence: this.calculateConfidence(recommendation, distance, timeConstraint)
      };

    } catch (error) {
      this.log('error', `Transport mode optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate distance between venues
   */
  async calculateDistance(origin, destination) {
    // Using Haversine formula for great circle distance
    const venues = {
      arizona: { lat: 32.2319, lon: -110.9501 },
      arizona_state: { lat: 33.4255, lon: -111.9400 },
      baylor: { lat: 31.5804, lon: -97.1139 },
      byu: { lat: 40.2518, lon: -111.6493 },
      cincinnati: { lat: 39.1329, lon: -84.5150 },
      colorado: { lat: 40.0076, lon: -105.2659 },
      houston: { lat: 29.7174, lon: -95.4018 },
      iowa_state: { lat: 42.0308, lon: -93.6319 },
      kansas: { lat: 38.9543, lon: -95.2558 },
      kansas_state: { lat: 39.1955, lon: -96.5847 },
      oklahoma_state: { lat: 36.1156, lon: -97.0683 },
      tcu: { lat: 32.7096, lon: -97.3677 },
      texas_tech: { lat: 33.5906, lon: -101.8227 },
      ucf: { lat: 28.6024, lon: -81.2001 },
      utah: { lat: 40.7649, lon: -111.8421 },
      west_virginia: { lat: 39.6295, lon: -79.9559 }
    };

    const originCoords = venues[origin.toLowerCase().replace(/\s+/g, '_')];
    const destCoords = venues[destination.toLowerCase().replace(/\s+/g, '_')];

    if (!originCoords || !destCoords) {
      throw new Error(`Unknown venue: ${!originCoords ? origin : destination}`);
    }

    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(destCoords.lat - originCoords.lat);
    const dLon = this.toRadians(destCoords.lon - originCoords.lon);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(originCoords.lat)) * Math.cos(this.toRadians(destCoords.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Generate charter bus option
   */
  async generateBusOption(distance, teamRequirements, travelRequest) {
    const roadDistance = distance * this.getRoadFactor(distance);
    const equipmentMultiplier = this.equipmentMultipliers[teamRequirements.sport] || 1.0;
    
    // Base cost calculation
    const hourlyRate = this.getBusHourlyRate(teamRequirements.teamSize);
    const perMileRate = this.getBusPerMileRate(distance);
    const travelHours = roadDistance / 55; // Average bus speed
    
    const baseCost = (hourlyRate * Math.max(travelHours, 5)) + (perMileRate * roadDistance);
    const adjustedCost = baseCost * equipmentMultiplier;

    // Add driver expenses for overnight trips
    const driverExpenses = travelHours > 10 ? 225 : 0; // $150 lodging + $75 meals

    return {
      mode: 'charter_bus',
      distance: roadDistance,
      cost: adjustedCost + driverExpenses,
      travelTime: travelHours,
      equipmentCapacity: 'unlimited',
      flexibility: 'high',
      weatherRisk: 'medium',
      viable: distance <= 800,
      details: {
        hourlyRate: hourlyRate,
        perMileRate: perMileRate,
        equipmentMultiplier: equipmentMultiplier,
        driverExpenses: driverExpenses
      }
    };
  }

  /**
   * Generate charter flight option
   */
  async generateFlightOption(distance, teamRequirements, travelRequest) {
    const aircraftType = this.selectAircraft(teamRequirements.teamSize);
    const flightHours = (distance / 450) + 1; // 450 mph + 1 hour for takeoff/landing
    const equipmentMultiplier = this.equipmentMultipliers[teamRequirements.sport] || 1.0;
    
    // Base cost calculation
    const hourlyRate = this.getAircraftHourlyRate(aircraftType);
    const repositioningCost = hourlyRate * 0.5; // 50% for repositioning
    const airportFees = 1500; // Average airport fees
    const crewExpenses = flightHours > 8 ? 400 : 0; // $200/night per crew member
    
    const baseCost = (hourlyRate * flightHours) + repositioningCost + airportFees + crewExpenses;
    const adjustedCost = baseCost * equipmentMultiplier;

    return {
      mode: 'charter_flight',
      distance: distance,
      cost: adjustedCost,
      travelTime: flightHours + 2, // Add 2 hours for ground transport
      equipmentCapacity: 'limited',
      flexibility: 'low',
      weatherRisk: 'high',
      viable: distance >= 200,
      aircraft: aircraftType,
      details: {
        hourlyRate: hourlyRate,
        flightHours: flightHours,
        repositioningCost: repositioningCost,
        airportFees: airportFees,
        crewExpenses: crewExpenses,
        equipmentMultiplier: equipmentMultiplier
      }
    };
  }

  /**
   * Evaluate options and make recommendation
   */
  evaluateOptions(busOption, flightOption, timeConstraint, preferences = {}) {
    const costSensitivity = preferences.costSensitivity || 'medium';
    const timeImportance = preferences.timeImportance || 'medium';
    
    // Cost comparison
    const costDifference = Math.abs(busOption.cost - flightOption.cost) / Math.min(busOption.cost, flightOption.cost);
    const costThreshold = this.decisionMatrix.cost_sensitivity[costSensitivity];
    
    // Time comparison
    const timeDifference = Math.abs(busOption.travelTime - flightOption.travelTime);
    const timeThreshold = this.decisionMatrix.time_constraints[timeConstraint];
    
    // Viability check
    if (!busOption.viable && flightOption.viable) {
      return this.createRecommendation('charter_flight', flightOption, 'Distance exceeds bus viability threshold');
    }
    
    if (!flightOption.viable && busOption.viable) {
      return this.createRecommendation('charter_bus', busOption, 'Distance below flight efficiency threshold');
    }
    
    // Both viable - analyze based on priorities
    let score = { bus: 0, flight: 0 };
    
    // Cost scoring
    if (busOption.cost < flightOption.cost) {
      score.bus += costDifference > costThreshold ? 2 : 1;
    } else {
      score.flight += costDifference > costThreshold ? 2 : 1;
    }
    
    // Time scoring (if time is important)
    if (timeImportance === 'high' && timeDifference > 4) {
      if (flightOption.travelTime < busOption.travelTime) {
        score.flight += 2;
      }
    }
    
    // Weather and flexibility scoring
    if (timeConstraint === 'urgent') {
      score.bus += 1; // Bus more reliable in weather
    }
    
    // Equipment scoring
    if (busOption.details.equipmentMultiplier > 1.2) {
      score.bus += 1; // Bus better for heavy equipment
    }
    
    // Make recommendation based on highest score
    if (score.bus > score.flight) {
      return this.createRecommendation('charter_bus', busOption, 'Optimal cost-efficiency and flexibility');
    } else if (score.flight > score.bus) {
      return this.createRecommendation('charter_flight', flightOption, 'Optimal time efficiency');
    } else {
      // Tie - default to cost
      const cheaperOption = busOption.cost < flightOption.cost ? busOption : flightOption;
      const mode = busOption.cost < flightOption.cost ? 'charter_bus' : 'charter_flight';
      return this.createRecommendation(mode, cheaperOption, 'Cost optimization (tie-breaker)');
    }
  }

  /**
   * Helper methods
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  getRoadFactor(distance) {
    if (distance < 100) return 1.35;
    if (distance < 300) return 1.25;
    if (distance < 500) return 1.20;
    if (distance < 1000) return 1.15;
    return 1.10;
  }

  getBusHourlyRate(teamSize) {
    if (teamSize <= 20) return 95;  // Minibus
    if (teamSize <= 45) return 135; // Standard coach
    return 175; // Large coach
  }

  getBusPerMileRate(distance) {
    return distance > 200 ? 3.00 : 0; // Only applies to long distances
  }

  selectAircraft(teamSize) {
    if (teamSize <= 50) return 'embraer_145';
    if (teamSize <= 150) return 'boeing_737';
    if (teamSize <= 180) return 'boeing_757';
    return 'boeing_767';
  }

  getAircraftHourlyRate(aircraftType) {
    const rates = {
      embraer_145: 7000,
      boeing_737: 10000,
      boeing_757: 15000,
      boeing_767: 18000
    };
    return rates[aircraftType] || 10000;
  }

  evaluateTimeConstraints(constraints) {
    if (constraints.arrivalDeadline) {
      const hoursUntilDeadline = (new Date(constraints.arrivalDeadline) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 12) return 'urgent';
      if (hoursUntilDeadline < 24) return 'standard';
    }
    return 'flexible';
  }

  analyzeTeamRequirements(travelRequest) {
    return {
      teamSize: travelRequest.teamSize || 35,
      sport: travelRequest.sport || 'basketball',
      equipmentLevel: travelRequest.equipmentLevel || 'standard'
    };
  }

  createRecommendation(mode, option, reasoning) {
    return {
      mode: mode,
      cost: option.cost,
      travelTime: option.travelTime,
      reasoning: reasoning,
      option: option
    };
  }

  getDecisionFactors(recommendation, busOption, flightOption) {
    return {
      costComparison: {
        bus: busOption.cost,
        flight: flightOption.cost,
        savings: Math.abs(busOption.cost - flightOption.cost),
        percentDifference: Math.abs(busOption.cost - flightOption.cost) / Math.min(busOption.cost, flightOption.cost) * 100
      },
      timeComparison: {
        bus: busOption.travelTime,
        flight: flightOption.travelTime,
        timeDifference: Math.abs(busOption.travelTime - flightOption.travelTime)
      },
      viabilityFactors: {
        busViable: busOption.viable,
        flightViable: flightOption.viable
      }
    };
  }

  calculateConfidence(recommendation, distance, timeConstraint) {
    let confidence = 0.8; // Base confidence
    
    // Distance-based confidence
    if (distance < 200 && recommendation.mode === 'charter_bus') confidence += 0.15;
    if (distance > 800 && recommendation.mode === 'charter_flight') confidence += 0.15;
    if (distance > 200 && distance < 600) confidence -= 0.1; // Mixed zone uncertainty
    
    // Time constraint confidence
    if (timeConstraint === 'urgent' && recommendation.mode === 'charter_flight') confidence += 0.1;
    if (timeConstraint === 'flexible') confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Transport Mode Optimization Agent initialized');
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Transport Mode Optimization Agent shutting down');
    this.status = 'inactive';
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      capabilities: this.capabilities,
      lastActivity: this.lastActivity
    };
  }
}

module.exports = TransportModeOptimizationAgent;