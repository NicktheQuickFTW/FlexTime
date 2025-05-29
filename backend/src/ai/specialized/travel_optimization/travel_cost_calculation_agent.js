/**
 * Travel Cost Calculation Agent
 * 
 * Comprehensive agent for accurate travel cost calculations incorporating all factors
 * from the FlexTime travel cost formula framework including transportation, 
 * accommodation, meals, equipment, and variable adjustments.
 */

const { Agent } = require('../../core/agent');

class TravelCostCalculationAgent extends Agent {
  constructor(options = {}) {
    super({
      name: 'TravelCostCalculationAgent',
      role: 'cost_calculation',
      capabilities: [
        'total_cost_calculation',
        'component_cost_breakdown',
        'adjustment_factor_application',
        'accommodation_optimization',
        'meal_cost_estimation'
      ],
      ...options
    });

    // Embedded cost calculation knowledge
    this.costStructure = {
      base_formula: 'Total = Transportation + Accommodation + Meals + Equipment + Adjustments',
      components: ['transportation', 'accommodation', 'meals', 'equipment', 'adjustments']
    };

    this.accommodationRates = {
      tier_1: { min: 200, max: 350, average: 275, cities: ['New York', 'Los Angeles', 'Chicago'] },
      tier_2: { min: 120, max: 200, average: 160, cities: ['Denver', 'Dallas', 'Phoenix'] },
      tier_3: { min: 80, max: 150, average: 115, cities: ['College towns'] }
    };

    this.big12MarketTiers = {
      arizona: 'tier_2', arizona_state: 'tier_2', baylor: 'tier_3', byu: 'tier_2',
      cincinnati: 'tier_2', colorado: 'tier_2', houston: 'tier_2', iowa_state: 'tier_3',
      kansas: 'tier_3', kansas_state: 'tier_3', oklahoma_state: 'tier_3', tcu: 'tier_2',
      texas_tech: 'tier_3', ucf: 'tier_2', utah: 'tier_2', west_virginia: 'tier_3'
    };

    this.mealRates = {
      day_trip: { total: 55, breakfast: 18, lunch: 22, dinner: 30 },
      overnight: { per_day: 85, special_dietary: 15, team_dinner: 42, airport_meals: 30 }
    };

    this.equipmentMultipliers = {
      football: 1.4, baseball: 1.2, softball: 1.2, mens_basketball: 1.1,
      womens_basketball: 1.1, soccer: 1.15, volleyball: 1.1, tennis: 1.0,
      golf: 1.3, track_field: 1.25, swimming_diving: 1.2, wrestling: 1.15, gymnastics: 1.2
    };

    this.seasonalMultipliers = {
      peak: { months: [3, 4, 5, 6], multiplier: 1.3 },
      regular: { months: [9, 10, 11, 12, 1, 2], multiplier: 1.0 },
      off: { months: [7, 8], multiplier: 0.85 }
    };

    this.timingPremiums = {
      weekend: 0.20, holiday: 0.375, conference_tournament: 0.25, last_minute: 0.325
    };

    this.regionalAdjustments = {
      west_coast: 1.15, northeast_corridor: 1.20, major_metropolitan: 1.175, rural_small_markets: 0.90
    };
  }

  /**
   * Calculate comprehensive travel cost
   */
  async calculateTotalTravelCost(travelRequest) {
    try {
      this.log('info', `Calculating total travel cost for ${travelRequest.origin} to ${travelRequest.destination}`);

      const breakdown = {
        transportation: 0,
        accommodation: 0,
        meals: 0,
        equipment: 0,
        adjustments: 0,
        subtotal: 0,
        total: 0
      };

      // 1. Transportation Cost
      breakdown.transportation = await this.calculateTransportationCost(travelRequest);

      // 2. Accommodation Cost
      breakdown.accommodation = await this.calculateAccommodationCost(travelRequest);

      // 3. Meal Cost
      breakdown.meals = await this.calculateMealCost(travelRequest);

      // 4. Equipment Cost (included in transportation multiplier)
      breakdown.equipment = 0; // Embedded in transportation calculation

      // 5. Calculate subtotal
      breakdown.subtotal = breakdown.transportation + breakdown.accommodation + breakdown.meals;

      // 6. Apply variable adjustments
      breakdown.adjustments = await this.calculateVariableAdjustments(breakdown.subtotal, travelRequest);

      // 7. Calculate final total
      breakdown.total = breakdown.subtotal + breakdown.adjustments;

      // Add detailed analysis
      const analysis = await this.generateCostAnalysis(breakdown, travelRequest);

      return {
        total: Math.round(breakdown.total),
        breakdown: breakdown,
        analysis: analysis,
        perPerson: Math.round(breakdown.total / travelRequest.teamSize),
        confidence: this.calculateCostConfidence(travelRequest),
        recommendations: this.generateCostRecommendations(breakdown, travelRequest)
      };

    } catch (error) {
      this.log('error', `Travel cost calculation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate transportation cost with equipment multipliers
   */
  async calculateTransportationCost(travelRequest) {
    const distance = await this.calculateDistance(travelRequest.origin, travelRequest.destination);
    const sport = travelRequest.sport || 'basketball';
    const teamSize = travelRequest.teamSize || 35;
    const transportMode = travelRequest.transportMode || this.selectTransportMode(distance, teamSize);

    let baseCost = 0;

    if (transportMode === 'charter_bus') {
      baseCost = await this.calculateBusCost(distance, teamSize, travelRequest);
    } else {
      baseCost = await this.calculateFlightCost(distance, teamSize, travelRequest);
    }

    // Apply equipment multiplier
    const equipmentMultiplier = this.equipmentMultipliers[sport] || 1.0;
    return baseCost * equipmentMultiplier;
  }

  /**
   * Calculate accommodation costs
   */
  async calculateAccommodationCost(travelRequest) {
    const tripDuration = this.calculateTripDuration(travelRequest);
    
    if (!this.requiresOvernight(tripDuration)) {
      return 0;
    }

    const destination = travelRequest.destination.toLowerCase().replace(/\s+/g, '_');
    const marketTier = this.big12MarketTiers[destination] || 'tier_2';
    const nightly_rate = this.accommodationRates[marketTier].average;
    
    const teamSize = travelRequest.teamSize || 35;
    const rooms = this.calculateRoomsRequired(teamSize);
    const nights = this.calculateNightsRequired(tripDuration);
    
    const baseCost = rooms * nightly_rate * nights;
    const taxes = baseCost * 0.15; // Average 15% tax rate
    const incidentals = rooms * 25 * nights; // $25 per room per night
    
    return baseCost + taxes + incidentals;
  }

  /**
   * Calculate meal costs
   */
  async calculateMealCost(travelRequest) {
    const tripDuration = this.calculateTripDuration(travelRequest);
    const teamSize = travelRequest.teamSize || 35;
    const isOvernight = this.requiresOvernight(tripDuration);
    
    if (isOvernight) {
      const days = Math.ceil(tripDuration / 24);
      const baseMealCost = this.mealRates.overnight.per_day * teamSize * days;
      
      // Add team dinner for away games
      const teamDinner = travelRequest.includeTeamDinner !== false ? 
        this.mealRates.overnight.team_dinner * teamSize : 0;
      
      // Add special dietary requirements (10% of team estimated)
      const specialDietary = Math.ceil(teamSize * 0.1) * this.mealRates.overnight.special_dietary * days;
      
      return baseMealCost + teamDinner + specialDietary;
    } else {
      // Day trip meals
      return this.mealRates.day_trip.total * teamSize;
    }
  }

  /**
   * Calculate variable adjustments (seasonal, timing, regional)
   */
  async calculateVariableAdjustments(subtotal, travelRequest) {
    let adjustmentFactor = 1.0;
    
    // 1. Seasonal adjustments
    const gameDate = new Date(travelRequest.date);
    const month = gameDate.getMonth() + 1;
    const seasonal = this.getSeasonalMultiplier(month);
    adjustmentFactor *= seasonal;
    
    // 2. Timing premiums
    const isWeekend = gameDate.getDay() === 0 || gameDate.getDay() === 6;
    if (isWeekend) adjustmentFactor *= (1 + this.timingPremiums.weekend);
    
    if (travelRequest.isHoliday) adjustmentFactor *= (1 + this.timingPremiums.holiday);
    if (travelRequest.isConferenceTournament) adjustmentFactor *= (1 + this.timingPremiums.conference_tournament);
    
    // Check booking notice
    const bookingNotice = (gameDate - new Date()) / (1000 * 60 * 60 * 24);
    if (bookingNotice < 14) adjustmentFactor *= (1 + this.timingPremiums.last_minute);
    
    // 3. Regional adjustments
    const destination = travelRequest.destination.toLowerCase().replace(/\s+/g, '_');
    const regional = this.getRegionalAdjustment(destination);
    adjustmentFactor *= regional;
    
    // 4. Weather/Emergency contingency (8% buffer)
    const contingencyFactor = 1.08;
    adjustmentFactor *= contingencyFactor;
    
    const adjustment = subtotal * (adjustmentFactor - 1);
    return adjustment;
  }

  /**
   * Generate detailed cost analysis
   */
  async generateCostAnalysis(breakdown, travelRequest) {
    const analysis = {
      costDrivers: [],
      efficiencyMetrics: {},
      comparisons: {},
      riskFactors: []
    };

    // Identify primary cost drivers
    const components = [
      { name: 'Transportation', amount: breakdown.transportation },
      { name: 'Accommodation', amount: breakdown.accommodation },
      { name: 'Meals', amount: breakdown.meals },
      { name: 'Adjustments', amount: breakdown.adjustments }
    ];
    
    const totalNonAdjustment = breakdown.subtotal;
    components.forEach(comp => {
      if (comp.amount > 0) {
        const percentage = (comp.amount / totalNonAdjustment) * 100;
        analysis.costDrivers.push({
          component: comp.name,
          amount: comp.amount,
          percentage: percentage.toFixed(1)
        });
      }
    });

    // Calculate efficiency metrics
    const distance = await this.calculateDistance(travelRequest.origin, travelRequest.destination);
    analysis.efficiencyMetrics = {
      costPerMile: (breakdown.total / distance).toFixed(2),
      costPerPerson: (breakdown.total / travelRequest.teamSize).toFixed(2),
      transportationEfficiency: (breakdown.transportation / breakdown.total * 100).toFixed(1)
    };

    // Risk factors
    if (breakdown.adjustments > breakdown.subtotal * 0.3) {
      analysis.riskFactors.push('High adjustment factors - consider flexible scheduling');
    }
    if (breakdown.accommodation > breakdown.transportation) {
      analysis.riskFactors.push('Accommodation costs exceed transportation - evaluate trip duration');
    }

    return analysis;
  }

  /**
   * Generate cost reduction recommendations
   */
  generateCostRecommendations(breakdown, travelRequest) {
    const recommendations = [];
    
    // Transportation recommendations
    if (breakdown.transportation > breakdown.total * 0.7) {
      recommendations.push({
        category: 'Transportation',
        suggestion: 'Consider alternative transport modes or shared charters',
        potential_savings: breakdown.transportation * 0.15
      });
    }
    
    // Accommodation recommendations
    if (breakdown.accommodation > 0 && this.calculateTripDuration(travelRequest) < 20) {
      recommendations.push({
        category: 'Accommodation',
        suggestion: 'Evaluate if overnight stay is necessary - consider day trip',
        potential_savings: breakdown.accommodation
      });
    }
    
    // Timing recommendations
    if (breakdown.adjustments > breakdown.subtotal * 0.2) {
      recommendations.push({
        category: 'Timing',
        suggestion: 'Schedule during off-peak periods or with more advance notice',
        potential_savings: breakdown.adjustments * 0.4
      });
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  async calculateDistance(origin, destination) {
    // Reuse distance calculation from transport mode agent
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

    const R = 3959;
    const dLat = this.toRadians(destCoords.lat - originCoords.lat);
    const dLon = this.toRadians(destCoords.lon - originCoords.lon);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(originCoords.lat)) * Math.cos(this.toRadians(destCoords.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  selectTransportMode(distance, teamSize) {
    if (distance <= 200) return 'charter_bus';
    if (distance > 800) return 'charter_flight';
    return teamSize > 50 ? 'charter_flight' : 'charter_bus';
  }

  async calculateBusCost(distance, teamSize, travelRequest) {
    const roadDistance = distance * this.getRoadFactor(distance);
    const hourlyRate = this.getBusHourlyRate(teamSize);
    const perMileRate = distance > 200 ? 3.00 : 0;
    const travelHours = roadDistance / 55;
    const driverExpenses = travelHours > 10 ? 225 : 0;
    
    return (hourlyRate * Math.max(travelHours, 5)) + (perMileRate * roadDistance) + driverExpenses;
  }

  async calculateFlightCost(distance, teamSize, travelRequest) {
    const aircraftType = this.selectAircraft(teamSize);
    const flightHours = (distance / 450) + 1;
    const hourlyRate = this.getAircraftHourlyRate(aircraftType);
    const repositioningCost = hourlyRate * 0.5;
    const airportFees = 1500;
    const crewExpenses = flightHours > 8 ? 400 : 0;
    
    return (hourlyRate * flightHours) + repositioningCost + airportFees + crewExpenses;
  }

  calculateTripDuration(travelRequest) {
    if (travelRequest.duration) return travelRequest.duration;
    
    // Default durations based on game type
    const gameType = travelRequest.gameType || 'regular';
    if (gameType === 'tournament') return 72; // 3 days
    if (travelRequest.doubleHeader) return 48; // 2 days
    return 24; // 1 day
  }

  requiresOvernight(duration) {
    return duration >= 18; // 18+ hours requires overnight
  }

  calculateRoomsRequired(teamSize) {
    // Standard: 2 per room for players, 1 per room for coaches/staff
    const players = Math.ceil(teamSize * 0.8); // 80% players
    const staff = teamSize - players;
    return Math.ceil(players / 2) + staff;
  }

  calculateNightsRequired(duration) {
    return Math.ceil(duration / 24);
  }

  getSeasonalMultiplier(month) {
    if (this.seasonalMultipliers.peak.months.includes(month)) return this.seasonalMultipliers.peak.multiplier;
    if (this.seasonalMultipliers.off.months.includes(month)) return this.seasonalMultipliers.off.multiplier;
    return this.seasonalMultipliers.regular.multiplier;
  }

  getRegionalAdjustment(destination) {
    // Simplified regional mapping
    const westCoast = ['arizona', 'arizona_state', 'utah'];
    const northeast = ['west_virginia'];
    const major_metro = ['houston', 'cincinnati', 'colorado'];
    
    if (westCoast.includes(destination)) return this.regionalAdjustments.west_coast;
    if (northeast.includes(destination)) return this.regionalAdjustments.northeast_corridor;
    if (major_metro.includes(destination)) return this.regionalAdjustments.major_metropolitan;
    return this.regionalAdjustments.rural_small_markets;
  }

  calculateCostConfidence(travelRequest) {
    let confidence = 0.85; // Base confidence
    
    // Reduce confidence for very long distances
    const distance = this.calculateDistance(travelRequest.origin, travelRequest.destination);
    if (distance > 1200) confidence -= 0.1;
    
    // Reduce confidence for unusual team sizes
    const teamSize = travelRequest.teamSize || 35;
    if (teamSize > 100 || teamSize < 15) confidence -= 0.05;
    
    // Reduce confidence for last-minute bookings
    const gameDate = new Date(travelRequest.date);
    const bookingNotice = (gameDate - new Date()) / (1000 * 60 * 60 * 24);
    if (bookingNotice < 7) confidence -= 0.15;
    
    return Math.max(confidence, 0.6);
  }

  // Utility helper methods
  toRadians(degrees) { return degrees * (Math.PI / 180); }
  getRoadFactor(distance) {
    if (distance < 100) return 1.35;
    if (distance < 300) return 1.25;
    if (distance < 500) return 1.20;
    return 1.15;
  }
  getBusHourlyRate(teamSize) {
    if (teamSize <= 20) return 95;
    if (teamSize <= 45) return 135;
    return 175;
  }
  selectAircraft(teamSize) {
    if (teamSize <= 50) return 'embraer_145';
    if (teamSize <= 150) return 'boeing_737';
    return 'boeing_757';
  }
  getAircraftHourlyRate(aircraftType) {
    const rates = { embraer_145: 7000, boeing_737: 10000, boeing_757: 15000, boeing_767: 18000 };
    return rates[aircraftType] || 10000;
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Travel Cost Calculation Agent initialized');
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Travel Cost Calculation Agent shutting down');
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

module.exports = TravelCostCalculationAgent;