/**
 * Circuit Optimization Agent
 * 
 * Specialized agent for creating optimal travel circuits and route clustering
 * to minimize total travel costs through strategic geographic scheduling.
 * 
 * Embedded Knowledge:
 * - Circuit generation algorithms
 * - Geographic clustering strategies
 * - Distance minimization techniques
 * - Multi-destination optimization
 */

const { Agent } = require('../../core/agent');

class CircuitOptimizationAgent extends Agent {
  constructor(options = {}) {
    super({
      name: 'CircuitOptimizationAgent',
      role: 'route_optimization',
      capabilities: [
        'circuit_generation',
        'route_clustering',
        'distance_minimization',
        'multi_destination_optimization',
        'backtrack_elimination'
      ],
      ...options
    });

    // Embedded geographic and optimization knowledge
    this.venues = {
      arizona: { lat: 32.2319, lon: -110.9501, region: 'southwest' },
      arizona_state: { lat: 33.4255, lon: -111.9400, region: 'southwest' },
      baylor: { lat: 31.5804, lon: -97.1139, region: 'south_central' },
      byu: { lat: 40.2518, lon: -111.6493, region: 'mountain' },
      cincinnati: { lat: 39.1329, lon: -84.5150, region: 'midwest' },
      colorado: { lat: 40.0076, lon: -105.2659, region: 'mountain' },
      houston: { lat: 29.7174, lon: -95.4018, region: 'south_central' },
      iowa_state: { lat: 42.0308, lon: -93.6319, region: 'midwest' },
      kansas: { lat: 38.9543, lon: -95.2558, region: 'central' },
      kansas_state: { lat: 39.1955, lon: -96.5847, region: 'central' },
      oklahoma_state: { lat: 36.1156, lon: -97.0683, region: 'central' },
      tcu: { lat: 32.7096, lon: -97.3677, region: 'south_central' },
      texas_tech: { lat: 33.5906, lon: -101.8227, region: 'south_central' },
      ucf: { lat: 28.6024, lon: -81.2001, region: 'southeast' },
      utah: { lat: 40.7649, lon: -111.8421, region: 'mountain' },
      west_virginia: { lat: 39.6295, lon: -79.9559, region: 'northeast' }
    };

    this.regionalClusters = {
      southwest: ['arizona', 'arizona_state'],
      mountain: ['byu', 'colorado', 'utah'],
      south_central: ['baylor', 'houston', 'tcu', 'texas_tech'],
      central: ['kansas', 'kansas_state', 'oklahoma_state'],
      midwest: ['cincinnati', 'iowa_state'],
      southeast: ['ucf'],
      northeast: ['west_virginia']
    };

    this.circuitConstraints = {
      maxCircuitSize: 4,           // Maximum games in a circuit
      minCircuitDistance: 200,     // Minimum distance to justify circuit
      maxCircuitDistance: 2000,    // Maximum total circuit distance
      maxDetourFactor: 1.3,        // Maximum detour vs direct travel
      minTimeBetweenGames: 2       // Minimum days between games
    };

    this.optimizationWeights = {
      totalDistance: 0.4,          // Weight for total distance minimization
      backtrackPenalty: 0.3,       // Weight for penalizing backtracking
      circuitEfficiency: 0.2,      // Weight for circuit compactness
      timeSpacing: 0.1             // Weight for optimal time spacing
    };
  }

  /**
   * Main circuit optimization method
   */
  async optimizeScheduleCircuits(schedule) {
    try {
      this.log('info', `Optimizing travel circuits for ${schedule.length} games`);

      // Separate home and away games
      const awayGames = schedule.filter(game => !game.isHome);
      const homeGames = schedule.filter(game => game.isHome);

      if (awayGames.length < 2) {
        this.log('info', 'Insufficient away games for circuit optimization');
        return {
          originalSchedule: schedule,
          optimizedSchedule: schedule,
          circuits: [],
          savings: { distance: 0, cost: 0, percentage: 0 }
        };
      }

      // Generate optimal circuits
      const circuits = await this.generateOptimalCircuits(awayGames);
      
      // Apply circuits to schedule
      const optimizedSchedule = await this.applyCircuitsToSchedule(schedule, circuits);
      
      // Calculate savings
      const savings = await this.calculateCircuitSavings(schedule, optimizedSchedule);

      return {
        originalSchedule: schedule,
        optimizedSchedule: optimizedSchedule,
        circuits: circuits,
        savings: savings,
        analysis: await this.generateCircuitAnalysis(circuits, savings)
      };

    } catch (error) {
      this.log('error', `Circuit optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate optimal travel circuits
   */
  async generateOptimalCircuits(awayGames) {
    const circuits = [];
    const unassigned = [...awayGames];
    const homeBase = this.determineHomeBase(awayGames[0]);

    while (unassigned.length >= 2) {
      const circuit = await this.buildOptimalCircuit(unassigned, homeBase);
      
      if (circuit.games.length >= 2) {
        circuits.push(circuit);
        // Remove assigned games from unassigned list
        circuit.games.forEach(game => {
          const index = unassigned.findIndex(g => g.id === game.id);
          if (index !== -1) unassigned.splice(index, 1);
        });
      } else {
        // Can't form more circuits, break
        break;
      }
    }

    // Add remaining games as individual trips
    unassigned.forEach(game => {
      circuits.push({
        type: 'individual',
        games: [game],
        totalDistance: this.calculateDistance(homeBase, game.destination),
        efficiency: 1.0
      });
    });

    return circuits;
  }

  /**
   * Build single optimal circuit
   */
  async buildOptimalCircuit(availableGames, homeBase) {
    // Start with the furthest game to maximize circuit efficiency
    const startGame = this.findOptimalStartGame(availableGames, homeBase);
    const circuit = {
      type: 'circuit',
      games: [startGame],
      route: [homeBase, startGame.destination],
      totalDistance: this.calculateDistance(homeBase, startGame.destination)
    };

    // Build circuit using nearest neighbor with optimization
    while (circuit.games.length < this.circuitConstraints.maxCircuitSize) {
      const nextGame = this.findOptimalNextGame(circuit, availableGames);
      
      if (!nextGame || !this.isCircuitViable(circuit, nextGame, homeBase)) {
        break;
      }

      // Add game to circuit
      circuit.games.push(nextGame);
      circuit.route.push(nextGame.destination);
      circuit.totalDistance += this.calculateDistance(
        circuit.route[circuit.route.length - 2],
        nextGame.destination
      );
    }

    // Complete circuit back to home
    if (circuit.games.length > 1) {
      const lastDestination = circuit.route[circuit.route.length - 1];
      circuit.totalDistance += this.calculateDistance(lastDestination, homeBase);
      circuit.route.push(homeBase);
      circuit.efficiency = this.calculateCircuitEfficiency(circuit, homeBase);
    }

    return circuit;
  }

  /**
   * Find optimal starting game for circuit
   */
  findOptimalStartGame(availableGames, homeBase) {
    // Strategy: Start with outlier games to maximize circuit potential
    let bestGame = null;
    let maxDistance = 0;

    availableGames.forEach(game => {
      const distance = this.calculateDistance(homeBase, game.destination);
      if (distance > maxDistance) {
        maxDistance = distance;
        bestGame = game;
      }
    });

    return bestGame || availableGames[0];
  }

  /**
   * Find optimal next game for circuit
   */
  findOptimalNextGame(circuit, availableGames) {
    const currentLocation = circuit.route[circuit.route.length - 1];
    const assignedGameIds = circuit.games.map(g => g.id);
    const candidates = availableGames.filter(g => !assignedGameIds.includes(g.id));

    if (candidates.length === 0) return null;

    let bestGame = null;
    let bestScore = -Infinity;

    candidates.forEach(game => {
      const score = this.calculateGameScore(currentLocation, game, circuit);
      if (score > bestScore) {
        bestScore = score;
        bestGame = game;
      }
    });

    return bestGame;
  }

  /**
   * Calculate scoring for potential next game
   */
  calculateGameScore(currentLocation, game, circuit) {
    const distance = this.calculateDistance(currentLocation, game.destination);
    const homeBase = circuit.route[0];
    const returnDistance = this.calculateDistance(game.destination, homeBase);
    
    // Factors influencing score
    const proximityScore = 1000 / (distance + 1); // Prefer closer games
    const regionScore = this.getRegionScore(currentLocation, game.destination);
    const timingScore = this.getTimingScore(circuit.games, game);
    const efficiencyScore = this.getEfficiencyScore(circuit, game, homeBase);

    return (proximityScore * 0.4) + (regionScore * 0.3) + (timingScore * 0.2) + (efficiencyScore * 0.1);
  }

  /**
   * Check if adding game to circuit is viable
   */
  isCircuitViable(circuit, game, homeBase) {
    const newTotalDistance = circuit.totalDistance + 
      this.calculateDistance(circuit.route[circuit.route.length - 1], game.destination) +
      this.calculateDistance(game.destination, homeBase);

    // Check distance constraints
    if (newTotalDistance > this.circuitConstraints.maxCircuitDistance) {
      return false;
    }

    // Check detour factor
    const directDistance = circuit.games.reduce((total, g) => 
      total + this.calculateDistance(homeBase, g.destination) * 2, 0
    ) + this.calculateDistance(homeBase, game.destination) * 2;

    const detourFactor = newTotalDistance / directDistance;
    if (detourFactor > this.circuitConstraints.maxDetourFactor) {
      return false;
    }

    // Check timing constraints
    const lastGame = circuit.games[circuit.games.length - 1];
    const daysBetween = (new Date(game.date) - new Date(lastGame.date)) / (1000 * 60 * 60 * 24);
    if (Math.abs(daysBetween) < this.circuitConstraints.minTimeBetweenGames) {
      return false;
    }

    return true;
  }

  /**
   * Apply circuits to schedule with optimal timing
   */
  async applyCircuitsToSchedule(originalSchedule, circuits) {
    const optimizedSchedule = [...originalSchedule];

    circuits.forEach(circuit => {
      if (circuit.type === 'circuit' && circuit.games.length > 1) {
        // Optimize game timing within circuit
        circuit.games = this.optimizeCircuitTiming(circuit.games);
        
        // Update schedule with optimized circuit games
        circuit.games.forEach((circuitGame, index) => {
          const scheduleIndex = optimizedSchedule.findIndex(g => g.id === circuitGame.id);
          if (scheduleIndex !== -1) {
            optimizedSchedule[scheduleIndex] = {
              ...optimizedSchedule[scheduleIndex],
              circuitId: circuit.id || `circuit_${circuits.indexOf(circuit)}`,
              circuitPosition: index + 1,
              circuitSize: circuit.games.length,
              optimizedDate: circuitGame.date
            };
          }
        });
      }
    });

    return optimizedSchedule;
  }

  /**
   * Optimize timing within a circuit
   */
  optimizeCircuitTiming(circuitGames) {
    // Sort games by optimal travel sequence
    const sortedGames = [...circuitGames].sort((a, b) => {
      // Consider both geographic proximity and date flexibility
      const dateFlexA = this.calculateDateFlexibility(a);
      const dateFlexB = this.calculateDateFlexibility(b);
      
      if (dateFlexA !== dateFlexB) {
        return dateFlexB - dateFlexA; // More flexible games first
      }
      
      return new Date(a.date) - new Date(b.date);
    });

    // Adjust dates to maintain minimum spacing
    for (let i = 1; i < sortedGames.length; i++) {
      const prevDate = new Date(sortedGames[i - 1].date);
      const currentDate = new Date(sortedGames[i].date);
      const daysBetween = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

      if (daysBetween < this.circuitConstraints.minTimeBetweenGames) {
        // Adjust current game date
        const newDate = new Date(prevDate);
        newDate.setDate(newDate.getDate() + this.circuitConstraints.minTimeBetweenGames);
        sortedGames[i].date = newDate.toISOString().split('T')[0];
      }
    }

    return sortedGames;
  }

  /**
   * Calculate total savings from circuit optimization
   */
  async calculateCircuitSavings(originalSchedule, optimizedSchedule) {
    const originalDistance = this.calculateTotalTravelDistance(originalSchedule);
    const optimizedDistance = this.calculateTotalTravelDistance(optimizedSchedule);
    
    const distanceSavings = originalDistance - optimizedDistance;
    const costSavingsPerMile = 4.5; // Average cost per mile
    const costSavings = distanceSavings * costSavingsPerMile;
    const percentageSavings = originalDistance > 0 ? (distanceSavings / originalDistance) * 100 : 0;

    return {
      distance: Math.round(distanceSavings),
      cost: Math.round(costSavings),
      percentage: Math.round(percentageSavings * 10) / 10,
      originalDistance: Math.round(originalDistance),
      optimizedDistance: Math.round(optimizedDistance)
    };
  }

  /**
   * Calculate total travel distance for schedule
   */
  calculateTotalTravelDistance(schedule) {
    const homeBase = this.determineHomeBase(schedule[0]);
    let totalDistance = 0;

    const awayGames = schedule.filter(game => !game.isHome);
    awayGames.forEach(game => {
      totalDistance += this.calculateDistance(homeBase, game.destination) * 2; // Round trip
    });

    return totalDistance;
  }

  /**
   * Generate detailed circuit analysis
   */
  async generateCircuitAnalysis(circuits, savings) {
    const analysis = {
      totalCircuits: circuits.length,
      circuitTypes: { individual: 0, circuit: 0 },
      efficiencyMetrics: {},
      recommendations: []
    };

    // Count circuit types
    circuits.forEach(circuit => {
      analysis.circuitTypes[circuit.type]++;
    });

    // Calculate efficiency metrics
    const circuitTrips = circuits.filter(c => c.type === 'circuit');
    if (circuitTrips.length > 0) {
      const avgEfficiency = circuitTrips.reduce((sum, c) => sum + (c.efficiency || 0), 0) / circuitTrips.length;
      const avgCircuitSize = circuitTrips.reduce((sum, c) => sum + c.games.length, 0) / circuitTrips.length;
      
      analysis.efficiencyMetrics = {
        averageEfficiency: Math.round(avgEfficiency * 100) / 100,
        averageCircuitSize: Math.round(avgCircuitSize * 10) / 10,
        circuitUtilization: Math.round((circuitTrips.length / circuits.length) * 100)
      };
    }

    // Generate recommendations
    if (savings.percentage < 10) {
      analysis.recommendations.push('Consider additional scheduling flexibility to improve circuit efficiency');
    }
    
    if (analysis.circuitTypes.individual > analysis.circuitTypes.circuit) {
      analysis.recommendations.push('Evaluate opportunities for additional circuit consolidation');
    }
    
    if (analysis.efficiencyMetrics.averageCircuitSize < 2.5) {
      analysis.recommendations.push('Optimize circuit size - current circuits are smaller than optimal');
    }

    return analysis;
  }

  /**
   * Helper methods
   */
  calculateDistance(origin, destination) {
    if (typeof origin === 'string') {
      origin = this.venues[origin.toLowerCase().replace(/\s+/g, '_')];
    }
    if (typeof destination === 'string') {
      destination = this.venues[destination.toLowerCase().replace(/\s+/g, '_')];
    }

    if (!origin || !destination) return 0;

    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(destination.lat - origin.lat);
    const dLon = this.toRadians(destination.lon - origin.lon);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(origin.lat)) * Math.cos(this.toRadians(destination.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  determineHomeBase(sampleGame) {
    // Extract home venue from first game or use default
    return sampleGame?.homeTeam?.toLowerCase().replace(/\s+/g, '_') || 'kansas';
  }

  calculateCircuitEfficiency(circuit, homeBase) {
    const actualDistance = circuit.totalDistance;
    const directDistance = circuit.games.reduce((total, game) => 
      total + this.calculateDistance(homeBase, game.destination) * 2, 0
    );
    return directDistance / actualDistance;
  }

  getRegionScore(currentLocation, destination) {
    const currentRegion = this.venues[currentLocation]?.region;
    const destRegion = this.venues[destination]?.region;
    return currentRegion === destRegion ? 100 : 50; // Prefer same region
  }

  getTimingScore(existingGames, newGame) {
    // Prefer games that fit well in timing sequence
    if (existingGames.length === 0) return 100;
    
    const lastGameDate = new Date(existingGames[existingGames.length - 1].date);
    const newGameDate = new Date(newGame.date);
    const daysDifference = Math.abs((newGameDate - lastGameDate) / (1000 * 60 * 60 * 24));
    
    // Optimal spacing is 3-7 days
    if (daysDifference >= 3 && daysDifference <= 7) return 100;
    if (daysDifference >= 2 && daysDifference <= 10) return 80;
    return 50;
  }

  getEfficiencyScore(circuit, game, homeBase) {
    // Calculate how this game affects overall circuit efficiency
    const currentEfficiency = this.calculateCircuitEfficiency(circuit, homeBase);
    // Simulate adding the game
    const simulatedDistance = circuit.totalDistance + 
      this.calculateDistance(circuit.route[circuit.route.length - 1], game.destination) +
      this.calculateDistance(game.destination, homeBase);
    
    const simulatedDirectDistance = circuit.games.reduce((total, g) => 
      total + this.calculateDistance(homeBase, g.destination) * 2, 0
    ) + this.calculateDistance(homeBase, game.destination) * 2;
    
    const newEfficiency = simulatedDirectDistance / simulatedDistance;
    return newEfficiency >= currentEfficiency ? 100 : 50;
  }

  calculateDateFlexibility(game) {
    // Simple flexibility score - could be enhanced with actual constraint data
    return game.dateFlexibility || 3; // Default 3 days flexibility
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Circuit Optimization Agent initialized');
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Circuit Optimization Agent shutting down');
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

module.exports = CircuitOptimizationAgent;