/**
 * Shared Charter Agent
 * 
 * Specialized agent for identifying and coordinating multi-team charter opportunities
 * to maximize cost savings through shared transportation resources.
 * 
 * Embedded Knowledge:
 * - Multi-team coordination algorithms
 * - Charter sharing feasibility analysis
 * - Cost allocation strategies
 * - Schedule synchronization methods
 */

const { Agent } = require('../../core/agent');

class SharedCharterAgent extends Agent {
  constructor(options = {}) {
    super({
      name: 'SharedCharterAgent',
      role: 'multi_team_coordination',
      capabilities: [
        'shared_charter_identification',
        'multi_team_coordination',
        'cost_allocation_optimization',
        'schedule_synchronization',
        'charter_capacity_optimization'
      ],
      ...options
    });

    // Embedded charter sharing knowledge
    this.charterCapacities = {
      embraer_145: { max_passengers: 50, equipment_space: 'limited', cost_per_hour: 7000 },
      boeing_737: { max_passengers: 150, equipment_space: 'moderate', cost_per_hour: 10000 },
      boeing_757: { max_passengers: 180, equipment_space: 'good', cost_per_hour: 15000 },
      boeing_767: { max_passengers: 200, equipment_space: 'excellent', cost_per_hour: 18000 }
    };

    this.sharingCriteria = {
      distance_tolerance: 50,        // Miles - destinations within 50 miles
      time_tolerance: 24,            // Hours - departure times within 24 hours
      min_savings_threshold: 0.25,   // 25% minimum savings to justify coordination
      max_coordination_complexity: 3, // Maximum teams in single charter
      equipment_compatibility: {
        high: ['basketball', 'volleyball', 'tennis', 'soccer'],
        medium: ['baseball', 'softball', 'track_field', 'swimming'],
        low: ['football', 'gymnastics', 'wrestling']
      }
    };

    this.costAllocationMethods = {
      proportional: {
        description: 'Cost split based on team size',
        formula: 'team_size / total_passengers',
        fairness: 'high',
        complexity: 'low'
      },
      distance_weighted: {
        description: 'Cost split based on distance traveled',
        formula: 'team_distance / total_distance',
        fairness: 'high',
        complexity: 'medium'
      },
      equal_split: {
        description: 'Equal cost split among teams',
        formula: '1 / number_of_teams',
        fairness: 'medium',
        complexity: 'low'
      },
      hybrid: {
        description: 'Combination of size and distance factors',
        formula: '0.6 * proportional + 0.4 * distance_weighted',
        fairness: 'very_high',
        complexity: 'medium'
      }
    };

    this.coordinationStrategies = {
      hub_and_spoke: {
        description: 'Central pickup with multiple destinations',
        efficiency: 'high',
        complexity: 'medium',
        use_case: 'Teams from same region to different destinations'
      },
      circuit_sharing: {
        description: 'Multiple teams following same circuit',
        efficiency: 'very_high',
        complexity: 'high',
        use_case: 'Teams with overlapping travel circuits'
      },
      partial_sharing: {
        description: 'Shared legs of multi-destination trips',
        efficiency: 'medium',
        complexity: 'low',
        use_case: 'Teams with some common destinations'
      }
    };
  }

  /**
   * Main shared charter optimization method
   */
  async identifySharedCharterOpportunities(schedules) {
    try {
      this.log('info', `Analyzing shared charter opportunities across ${schedules.length} team schedules`);

      const opportunities = [];
      const allGames = this.extractAllGames(schedules);
      
      // Group games by potential sharing criteria
      const sharingGroups = await this.groupGamesBySharingPotential(allGames);
      
      // Analyze each group for charter sharing feasibility
      for (const group of sharingGroups) {
        const opportunity = await this.analyzeSharedCharterOpportunity(group);
        if (opportunity.viable) {
          opportunities.push(opportunity);
        }
      }

      // Optimize and prioritize opportunities
      const optimizedOpportunities = await this.optimizeSharedCharterPortfolio(opportunities);
      
      // Calculate total potential savings
      const totalSavings = await this.calculateTotalSharedCharterSavings(optimizedOpportunities);

      return {
        opportunities: optimizedOpportunities,
        totalSavings: totalSavings,
        summary: await this.generateSharedCharterSummary(optimizedOpportunities),
        implementation: await this.generateImplementationPlan(optimizedOpportunities)
      };

    } catch (error) {
      this.log('error', `Shared charter optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract all games from multiple team schedules
   */
  extractAllGames(schedules) {
    const allGames = [];
    
    schedules.forEach(schedule => {
      schedule.games?.forEach(game => {
        if (!game.isHome) { // Only away games are relevant for charter sharing
          allGames.push({
            ...game,
            teamId: schedule.teamId,
            teamName: schedule.teamName,
            sport: schedule.sport,
            teamSize: schedule.teamSize || this.getDefaultTeamSize(schedule.sport)
          });
        }
      });
    });

    return allGames;
  }

  /**
   * Group games by sharing potential
   */
  async groupGamesBySharingPotential(games) {
    const groups = [];
    const processed = new Set();

    games.forEach((game, index) => {
      if (processed.has(game.id)) return;

      const group = [game];
      processed.add(game.id);

      // Find compatible games
      games.slice(index + 1).forEach(otherGame => {
        if (processed.has(otherGame.id)) return;

        if (this.areGamesCompatibleForSharing(game, otherGame)) {
          group.push(otherGame);
          processed.add(otherGame.id);
        }
      });

      // Only consider groups with 2+ teams
      if (group.length >= 2) {
        groups.push(group);
      }
    });

    return groups;
  }

  /**
   * Check if two games are compatible for charter sharing
   */
  areGamesCompatibleForSharing(game1, game2) {
    // Different teams
    if (game1.teamId === game2.teamId) return false;

    // Time compatibility
    const date1 = new Date(game1.date);
    const date2 = new Date(game2.date);
    const timeDiffHours = Math.abs(date2 - date1) / (1000 * 60 * 60);
    if (timeDiffHours > this.sharingCriteria.time_tolerance) return false;

    // Distance compatibility
    const distance = this.calculateDestinationDistance(game1.destination, game2.destination);
    if (distance > this.sharingCriteria.distance_tolerance) return false;

    // Equipment compatibility
    const compatibility1 = this.getEquipmentCompatibility(game1.sport);
    const compatibility2 = this.getEquipmentCompatibility(game2.sport);
    if (compatibility1 === 'low' || compatibility2 === 'low') return false;

    return true;
  }

  /**
   * Analyze shared charter opportunity for a group
   */
  async analyzeSharedCharterOpportunity(gameGroup) {
    const analysis = {
      games: gameGroup,
      totalTeams: gameGroup.length,
      totalPassengers: gameGroup.reduce((sum, game) => sum + game.teamSize, 0),
      destinations: [...new Set(gameGroup.map(game => game.destination))],
      viable: false,
      strategy: null,
      aircraft: null,
      savings: null,
      costAllocation: null
    };

    // Determine optimal aircraft
    analysis.aircraft = this.selectOptimalAircraft(analysis.totalPassengers);
    
    // Check capacity constraints
    const aircraftCapacity = this.charterCapacities[analysis.aircraft].max_passengers;
    if (analysis.totalPassengers > aircraftCapacity) {
      analysis.viable = false;
      analysis.reason = 'Exceeds aircraft capacity';
      return analysis;
    }

    // Determine coordination strategy
    analysis.strategy = this.determineCoordinationStrategy(gameGroup);
    
    // Calculate cost savings
    analysis.savings = await this.calculateSharedCharterSavings(gameGroup, analysis.aircraft, analysis.strategy);
    
    // Check minimum savings threshold
    if (analysis.savings.percentage < this.sharingCriteria.min_savings_threshold) {
      analysis.viable = false;
      analysis.reason = 'Insufficient cost savings';
      return analysis;
    }

    // Calculate cost allocation
    analysis.costAllocation = this.calculateCostAllocation(gameGroup, analysis.savings.shared_cost);
    
    analysis.viable = true;
    return analysis;
  }

  /**
   * Select optimal aircraft for shared charter
   */
  selectOptimalAircraft(totalPassengers) {
    const aircraftOptions = Object.entries(this.charterCapacities);
    
    // Find smallest aircraft that can accommodate all passengers
    for (const [aircraft, specs] of aircraftOptions) {
      if (specs.max_passengers >= totalPassengers) {
        return aircraft;
      }
    }
    
    // Default to largest if none can accommodate (shouldn't happen with proper validation)
    return 'boeing_767';
  }

  /**
   * Determine optimal coordination strategy
   */
  determineCoordinationStrategy(gameGroup) {
    const destinations = [...new Set(gameGroup.map(game => game.destination))];
    const origins = [...new Set(gameGroup.map(game => this.getTeamHomeBase(game.teamId)))];

    if (destinations.length === 1 && origins.length > 1) {
      return this.coordinationStrategies.hub_and_spoke;
    }
    
    if (destinations.length > 1 && this.areDestinationsInCircuit(destinations)) {
      return this.coordinationStrategies.circuit_sharing;
    }
    
    return this.coordinationStrategies.partial_sharing;
  }

  /**
   * Calculate shared charter savings
   */
  async calculateSharedCharterSavings(gameGroup, aircraft, strategy) {
    // Calculate individual charter costs
    let individualCosts = 0;
    for (const game of gameGroup) {
      const homeBase = this.getTeamHomeBase(game.teamId);
      const distance = this.calculateDistance(homeBase, game.destination);
      const individualCost = await this.calculateIndividualCharterCost(distance, game.teamSize, game.sport);
      individualCosts += individualCost;
    }

    // Calculate shared charter cost
    const sharedCost = await this.calculateSharedCharterCost(gameGroup, aircraft, strategy);
    
    const savings = individualCosts - sharedCost;
    const percentage = savings / individualCosts;

    return {
      individual_total: Math.round(individualCosts),
      shared_cost: Math.round(sharedCost),
      total_savings: Math.round(savings),
      percentage: Math.round(percentage * 100) / 100,
      savings_per_team: Math.round(savings / gameGroup.length)
    };
  }

  /**
   * Calculate cost allocation among teams
   */
  calculateCostAllocation(gameGroup, totalCost) {
    const allocations = [];
    const method = this.costAllocationMethods.hybrid;
    
    const totalPassengers = gameGroup.reduce((sum, game) => sum + game.teamSize, 0);
    const totalDistance = gameGroup.reduce((sum, game) => {
      const homeBase = this.getTeamHomeBase(game.teamId);
      return sum + this.calculateDistance(homeBase, game.destination);
    }, 0);

    gameGroup.forEach(game => {
      const homeBase = this.getTeamHomeBase(game.teamId);
      const gameDistance = this.calculateDistance(homeBase, game.destination);
      
      // Proportional factor (60% weight)
      const proportionalFactor = game.teamSize / totalPassengers;
      
      // Distance factor (40% weight)
      const distanceFactor = totalDistance > 0 ? gameDistance / totalDistance : 1 / gameGroup.length;
      
      // Hybrid allocation
      const allocationFactor = 0.6 * proportionalFactor + 0.4 * distanceFactor;
      const allocation = totalCost * allocationFactor;

      allocations.push({
        teamId: game.teamId,
        teamName: game.teamName,
        allocation: Math.round(allocation),
        factor: Math.round(allocationFactor * 1000) / 1000,
        breakdown: {
          proportional: Math.round(proportionalFactor * 1000) / 1000,
          distance: Math.round(distanceFactor * 1000) / 1000
        }
      });
    });

    return {
      method: 'hybrid',
      allocations: allocations,
      total: Math.round(allocations.reduce((sum, alloc) => sum + alloc.allocation, 0))
    };
  }

  /**
   * Optimize shared charter portfolio to maximize savings
   */
  async optimizeSharedCharterPortfolio(opportunities) {
    // Sort by savings percentage (highest first)
    const sortedOpportunities = opportunities.sort((a, b) => b.savings.percentage - a.savings.percentage);
    
    // Remove overlapping opportunities (same game can't be in multiple shared charters)
    const optimized = [];
    const usedGameIds = new Set();
    
    for (const opportunity of sortedOpportunities) {
      const gameIds = opportunity.games.map(game => game.id);
      const hasOverlap = gameIds.some(id => usedGameIds.has(id));
      
      if (!hasOverlap) {
        optimized.push(opportunity);
        gameIds.forEach(id => usedGameIds.add(id));
      }
    }
    
    return optimized;
  }

  /**
   * Calculate total savings from all shared charter opportunities
   */
  async calculateTotalSharedCharterSavings(opportunities) {
    const totalSavings = opportunities.reduce((sum, opp) => sum + opp.savings.total_savings, 0);
    const totalIndividualCost = opportunities.reduce((sum, opp) => sum + opp.savings.individual_total, 0);
    const totalSharedCost = opportunities.reduce((sum, opp) => sum + opp.savings.shared_cost, 0);
    
    return {
      total_savings: Math.round(totalSavings),
      total_percentage: totalIndividualCost > 0 ? Math.round((totalSavings / totalIndividualCost) * 100) / 100 : 0,
      opportunities_count: opportunities.length,
      teams_affected: new Set(opportunities.flatMap(opp => opp.games.map(game => game.teamId))).size,
      individual_cost: Math.round(totalIndividualCost),
      shared_cost: Math.round(totalSharedCost)
    };
  }

  /**
   * Helper methods
   */
  calculateDestinationDistance(dest1, dest2) {
    // Simplified distance calculation for destination proximity
    return this.calculateDistance(dest1, dest2);
  }

  calculateDistance(origin, destination) {
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

    const originCoords = venues[origin.toLowerCase?.().replace(/\s+/g, '_')] || venues[origin];
    const destCoords = venues[destination.toLowerCase?.().replace(/\s+/g, '_')] || venues[destination];

    if (!originCoords || !destCoords) return 1000; // Default high distance

    const R = 3959;
    const dLat = this.toRadians(destCoords.lat - originCoords.lat);
    const dLon = this.toRadians(destCoords.lon - originCoords.lon);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(originCoords.lat)) * Math.cos(this.toRadians(destCoords.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  getDefaultTeamSize(sport) {
    const sizes = {
      football: 95, mens_basketball: 30, womens_basketball: 30,
      baseball: 40, softball: 30, soccer: 30, volleyball: 25,
      tennis: 20, golf: 15, track_field: 25, swimming_diving: 25,
      wrestling: 20, gymnastics: 20
    };
    return sizes[sport] || 30;
  }

  getEquipmentCompatibility(sport) {
    for (const [level, sports] of Object.entries(this.sharingCriteria.equipment_compatibility)) {
      if (sports.includes(sport)) return level;
    }
    return 'medium';
  }

  getTeamHomeBase(teamId) {
    // Simplified mapping - in real implementation, this would come from team data
    const mapping = {
      'arizona': 'arizona',
      'arizona_state': 'arizona_state',
      'baylor': 'baylor'
      // ... etc
    };
    return mapping[teamId] || 'kansas'; // Default
  }

  areDestinationsInCircuit(destinations) {
    // Simplified circuit detection - check if destinations form a reasonable circuit
    if (destinations.length < 2) return false;
    
    // Calculate total circuit distance vs direct distances
    let circuitDistance = 0;
    for (let i = 0; i < destinations.length - 1; i++) {
      circuitDistance += this.calculateDistance(destinations[i], destinations[i + 1]);
    }
    
    let directDistances = 0;
    const homeBase = 'kansas'; // Simplified
    destinations.forEach(dest => {
      directDistances += this.calculateDistance(homeBase, dest) * 2;
    });
    
    return circuitDistance < directDistances * 0.8; // Circuit is 20% more efficient
  }

  async calculateIndividualCharterCost(distance, teamSize, sport) {
    const aircraft = this.selectOptimalAircraft(teamSize);
    const hourlyRate = this.charterCapacities[aircraft].cost_per_hour;
    const flightHours = (distance / 450) + 1; // 450 mph + 1 hour overhead
    const equipmentMultiplier = this.getEquipmentMultiplier(sport);
    
    return (hourlyRate * flightHours * 2) * equipmentMultiplier; // Round trip
  }

  async calculateSharedCharterCost(gameGroup, aircraft, strategy) {
    const hourlyRate = this.charterCapacities[aircraft].cost_per_hour;
    
    // Calculate flight time based on strategy
    let totalFlightHours = 0;
    
    if (strategy === this.coordinationStrategies.hub_and_spoke) {
      // Hub pickup + destination + return
      const homeBase = this.getTeamHomeBase(gameGroup[0].teamId); // Use first team's base as hub
      const destination = gameGroup[0].destination;
      const distance = this.calculateDistance(homeBase, destination);
      totalFlightHours = ((distance / 450) + 1) * 2; // Round trip
    } else if (strategy === this.coordinationStrategies.circuit_sharing) {
      // Calculate circuit flight time
      const destinations = [...new Set(gameGroup.map(game => game.destination))];
      let circuitDistance = 0;
      for (let i = 0; i < destinations.length - 1; i++) {
        circuitDistance += this.calculateDistance(destinations[i], destinations[i + 1]);
      }
      totalFlightHours = (circuitDistance / 450) + destinations.length; // Circuit + overhead per stop
    } else {
      // Partial sharing - average of individual flights
      const avgDistance = gameGroup.reduce((sum, game) => {
        const homeBase = this.getTeamHomeBase(game.teamId);
        return sum + this.calculateDistance(homeBase, game.destination);
      }, 0) / gameGroup.length;
      totalFlightHours = ((avgDistance / 450) + 1) * 2;
    }
    
    return hourlyRate * totalFlightHours;
  }

  getEquipmentMultiplier(sport) {
    const multipliers = {
      football: 1.4, baseball: 1.2, softball: 1.2, basketball: 1.1,
      soccer: 1.15, volleyball: 1.1, tennis: 1.0, golf: 1.3,
      track_field: 1.25, swimming_diving: 1.2, wrestling: 1.15, gymnastics: 1.2
    };
    return multipliers[sport] || 1.1;
  }

  async generateSharedCharterSummary(opportunities) {
    return {
      total_opportunities: opportunities.length,
      total_teams_affected: new Set(opportunities.flatMap(opp => opp.games.map(game => game.teamId))).size,
      average_savings_per_opportunity: opportunities.length > 0 ? 
        Math.round(opportunities.reduce((sum, opp) => sum + opp.savings.percentage, 0) / opportunities.length * 100) / 100 : 0,
      coordination_strategies: {
        hub_and_spoke: opportunities.filter(opp => opp.strategy === this.coordinationStrategies.hub_and_spoke).length,
        circuit_sharing: opportunities.filter(opp => opp.strategy === this.coordinationStrategies.circuit_sharing).length,
        partial_sharing: opportunities.filter(opp => opp.strategy === this.coordinationStrategies.partial_sharing).length
      }
    };
  }

  async generateImplementationPlan(opportunities) {
    return {
      priority_order: opportunities.map((opp, index) => ({
        priority: index + 1,
        teams: opp.games.map(game => game.teamName),
        savings: opp.savings.total_savings,
        complexity: this.assessImplementationComplexity(opp)
      })),
      coordination_requirements: [
        'Schedule coordination between teams',
        'Charter operator capacity confirmation',
        'Equipment compatibility verification',
        'Cost allocation agreement'
      ],
      timeline: {
        planning_phase: '2-3 weeks',
        coordination_phase: '1-2 weeks',
        booking_phase: '1 week',
        total_lead_time: '4-6 weeks minimum'
      }
    };
  }

  assessImplementationComplexity(opportunity) {
    let complexity = 'low';
    
    if (opportunity.totalTeams > 2) complexity = 'medium';
    if (opportunity.destinations.length > 1) complexity = 'medium';
    if (opportunity.strategy === this.coordinationStrategies.circuit_sharing) complexity = 'high';
    
    return complexity;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Shared Charter Agent initialized');
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Shared Charter Agent shutting down');
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

module.exports = SharedCharterAgent;