/**
 * Optimization Worker - Multi-threaded Constraint Evaluation and Schedule Optimization
 * 
 * This worker handles CPU-intensive optimization tasks in a separate thread
 * to maintain responsive UI performance and support parallel processing.
 */

const { parentPort, workerData } = require('worker_threads');

// Import optimization algorithms
const OptimizationEngine = require('./optimization-engine');
const ConstraintEvaluator = require('./constraint-evaluator');

class OptimizationWorker {
  constructor() {
    this.engine = new OptimizationEngine();
    this.evaluator = new ConstraintEvaluator();
    this.taskHandlers = {
      'optimize': this.handleOptimization.bind(this),
      'evaluate': this.handleConstraintEvaluation.bind(this),
      'resolve-conflicts': this.handleConflictResolution.bind(this)
    };
  }

  /**
   * Handle incoming messages from main thread
   */
  async handleMessage(message) {
    const { taskType, data } = message;
    
    try {
      const handler = this.taskHandlers[taskType];
      if (!handler) {
        throw new Error(`Unknown task type: ${taskType}`);
      }

      const result = await handler(data);
      parentPort.postMessage({
        success: true,
        result,
        taskType,
        timestamp: Date.now()
      });

    } catch (error) {
      parentPort.postMessage({
        success: false,
        error: {
          message: error.message,
          stack: error.stack,
          taskType
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle schedule optimization
   */
  async handleOptimization(data) {
    const { schedule, constraints, options } = data;
    
    // Initialize optimization parameters
    const optimizationConfig = {
      maxIterations: options.maxIterations || 1000,
      convergenceThreshold: options.convergenceThreshold || 0.001,
      coolingRate: options.coolingRate || 0.95,
      initialTemperature: options.initialTemperature || 100,
      sportType: options.sportType
    };

    // Validate input data
    if (!schedule || !schedule.games) {
      throw new Error('Invalid schedule data');
    }

    // Execute optimization using simulated annealing
    const optimizationResult = await this.engine.optimizeSchedule(
      schedule,
      constraints,
      optimizationConfig
    );

    return {
      optimizedSchedule: optimizationResult.schedule,
      score: optimizationResult.score,
      iterations: optimizationResult.iterations,
      improvements: optimizationResult.improvements,
      convergenceInfo: optimizationResult.convergenceInfo,
      constraintViolations: optimizationResult.violations,
      executionTime: optimizationResult.executionTime
    };
  }

  /**
   * Handle constraint evaluation
   */
  async handleConstraintEvaluation(data) {
    const { gameMove, schedule, constraints } = data;

    // Validate constraint types and weights
    const validatedConstraints = constraints.map(constraint => ({
      ...constraint,
      weight: constraint.weight || 1.0,
      parameters: constraint.parameters || {}
    }));

    // Evaluate each constraint
    const evaluationResults = await Promise.all(
      validatedConstraints.map(constraint =>
        this.evaluator.evaluateConstraint(constraint, gameMove, schedule)
      )
    );

    // Calculate aggregate score and violations
    const violations = evaluationResults.filter(result => result.violated);
    const totalScore = evaluationResults.reduce((sum, result) => sum + result.score, 0);
    const weightedScore = evaluationResults.reduce(
      (sum, result) => sum + (result.score * result.weight), 0
    ) / evaluationResults.reduce((sum, result) => sum + result.weight, 1);

    return {
      isValid: violations.length === 0,
      violations,
      score: totalScore,
      weightedScore,
      constraintResults: evaluationResults,
      evaluationCount: evaluationResults.length
    };
  }

  /**
   * Handle conflict resolution
   */
  async handleConflictResolution(data) {
    const { conflicts, schedule, options } = data;

    // Sort conflicts by severity and impact
    const prioritizedConflicts = conflicts.sort((a, b) => {
      const severityA = a.severity || 'medium';
      const severityB = b.severity || 'medium';
      const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return severityOrder[severityB] - severityOrder[severityA];
    });

    // Resolve conflicts one by one
    const resolutionResults = [];
    let currentSchedule = { ...schedule };

    for (const conflict of prioritizedConflicts) {
      try {
        const resolution = await this.resolveConflict(conflict, currentSchedule, options);
        resolutionResults.push(resolution);
        
        // Apply resolution to schedule if successful
        if (resolution.resolved && resolution.modification) {
          currentSchedule = this.applyScheduleModification(currentSchedule, resolution.modification);
        }

      } catch (error) {
        resolutionResults.push({
          conflict,
          resolved: false,
          error: error.message,
          suggestions: []
        });
      }
    }

    return {
      resolvedConflicts: resolutionResults.filter(r => r.resolved).length,
      totalConflicts: conflicts.length,
      resolutions: resolutionResults,
      modifiedSchedule: currentSchedule,
      success: resolutionResults.some(r => r.resolved)
    };
  }

  /**
   * Resolve individual conflict
   */
  async resolveConflict(conflict, schedule, options) {
    const conflictType = conflict.type || 'generic';
    
    switch (conflictType) {
      case 'date_conflict':
        return this.resolveDateConflict(conflict, schedule, options);
      
      case 'venue_conflict':
        return this.resolveVenueConflict(conflict, schedule, options);
      
      case 'travel_conflict':
        return this.resolveTravelConflict(conflict, schedule, options);
      
      case 'constraint_violation':
        return this.resolveConstraintViolation(conflict, schedule, options);
      
      default:
        return this.resolveGenericConflict(conflict, schedule, options);
    }
  }

  /**
   * Resolve date conflicts
   */
  async resolveDateConflict(conflict, schedule, options) {
    const { gameId, conflictingDates } = conflict;
    const game = schedule.games.find(g => g.id === gameId);
    
    if (!game) {
      throw new Error(`Game ${gameId} not found in schedule`);
    }

    // Find alternative dates
    const alternativeDates = this.findAlternativeDates(
      game,
      conflictingDates,
      schedule,
      options
    );

    if (alternativeDates.length === 0) {
      return {
        conflict,
        resolved: false,
        reason: 'No alternative dates available',
        suggestions: []
      };
    }

    // Select best alternative date
    const bestDate = this.selectBestAlternativeDate(alternativeDates, game, schedule);

    return {
      conflict,
      resolved: true,
      modification: {
        type: 'date_change',
        gameId: game.id,
        oldDate: game.date,
        newDate: bestDate,
        reason: 'Resolved date conflict'
      },
      suggestions: alternativeDates.slice(0, 3) // Provide top 3 alternatives
    };
  }

  /**
   * Resolve venue conflicts
   */
  async resolveVenueConflict(conflict, schedule, options) {
    const { gameId, conflictingVenue } = conflict;
    const game = schedule.games.find(g => g.id === gameId);
    
    if (!game) {
      throw new Error(`Game ${gameId} not found in schedule`);
    }

    // Find alternative venues
    const alternativeVenues = this.findAlternativeVenues(
      game,
      conflictingVenue,
      schedule,
      options
    );

    if (alternativeVenues.length === 0) {
      // Try to reschedule to different date/time
      const rescheduleOption = await this.findRescheduleOption(game, schedule, options);
      
      if (rescheduleOption) {
        return {
          conflict,
          resolved: true,
          modification: rescheduleOption,
          suggestions: []
        };
      }

      return {
        conflict,
        resolved: false,
        reason: 'No alternative venues or reschedule options available',
        suggestions: []
      };
    }

    const bestVenue = this.selectBestAlternativeVenue(alternativeVenues, game, schedule);

    return {
      conflict,
      resolved: true,
      modification: {
        type: 'venue_change',
        gameId: game.id,
        oldVenue: game.venue,
        newVenue: bestVenue,
        reason: 'Resolved venue conflict'
      },
      suggestions: alternativeVenues.slice(0, 3)
    };
  }

  /**
   * Resolve travel conflicts
   */
  async resolveTravelConflict(conflict, schedule, options) {
    const { teamId, conflictingGames } = conflict;
    
    // Calculate travel distances and find optimization opportunities
    const travelOptimizations = this.calculateTravelOptimizations(
      teamId,
      conflictingGames,
      schedule
    );

    if (travelOptimizations.length === 0) {
      return {
        conflict,
        resolved: false,
        reason: 'No travel optimizations available',
        suggestions: []
      };
    }

    const bestOptimization = travelOptimizations[0];

    return {
      conflict,
      resolved: true,
      modification: bestOptimization.modification,
      suggestions: travelOptimizations.slice(1, 4)
    };
  }

  /**
   * Resolve constraint violations
   */
  async resolveConstraintViolation(conflict, schedule, options) {
    const { constraintType, violatingGames } = conflict;
    
    // Apply constraint-specific resolution strategies
    const resolutionStrategy = this.getConstraintResolutionStrategy(constraintType);
    const resolutionOptions = await resolutionStrategy(violatingGames, schedule, options);

    if (resolutionOptions.length === 0) {
      return {
        conflict,
        resolved: false,
        reason: `No resolution available for ${constraintType} violation`,
        suggestions: []
      };
    }

    return {
      conflict,
      resolved: true,
      modification: resolutionOptions[0],
      suggestions: resolutionOptions.slice(1, 4)
    };
  }

  /**
   * Resolve generic conflicts
   */
  async resolveGenericConflict(conflict, schedule, options) {
    // Generic resolution approach
    return {
      conflict,
      resolved: false,
      reason: 'Generic conflict resolution not implemented',
      suggestions: [
        'Manual review required',
        'Consider alternative scheduling approach',
        'Consult with scheduling coordinator'
      ]
    };
  }

  /**
   * Apply schedule modification
   */
  applyScheduleModification(schedule, modification) {
    const modifiedSchedule = { ...schedule, games: [...schedule.games] };
    
    switch (modification.type) {
      case 'date_change':
        const gameIndex = modifiedSchedule.games.findIndex(g => g.id === modification.gameId);
        if (gameIndex >= 0) {
          modifiedSchedule.games[gameIndex] = {
            ...modifiedSchedule.games[gameIndex],
            date: modification.newDate
          };
        }
        break;
        
      case 'venue_change':
        const venueGameIndex = modifiedSchedule.games.findIndex(g => g.id === modification.gameId);
        if (venueGameIndex >= 0) {
          modifiedSchedule.games[venueGameIndex] = {
            ...modifiedSchedule.games[venueGameIndex],
            venue: modification.newVenue
          };
        }
        break;
        
      // Add more modification types as needed
    }
    
    return modifiedSchedule;
  }

  /**
   * Find alternative dates for a game
   */
  findAlternativeDates(game, conflictingDates, schedule, options) {
    // Implementation would analyze available dates based on:
    // - Team availability
    // - Venue availability  
    // - Constraint requirements
    // - Travel considerations
    
    // Simplified implementation
    const alternatives = [];
    const gameDate = new Date(game.date);
    
    // Try dates within ±7 days
    for (let i = -7; i <= 7; i++) {
      if (i === 0) continue; // Skip current date
      
      const altDate = new Date(gameDate);
      altDate.setDate(altDate.getDate() + i);
      const altDateStr = altDate.toISOString().split('T')[0];
      
      if (!conflictingDates.includes(altDateStr)) {
        // Check if date is available (simplified check)
        const hasConflict = schedule.games.some(g => 
          g.id !== game.id && 
          g.date === altDateStr && 
          (g.homeTeam === game.homeTeam || g.awayTeam === game.awayTeam ||
           g.homeTeam === game.awayTeam || g.awayTeam === game.homeTeam)
        );
        
        if (!hasConflict) {
          alternatives.push({
            date: altDateStr,
            score: Math.abs(i), // Prefer dates closer to original
            reason: `Alternative date ${i} days from original`
          });
        }
      }
    }
    
    return alternatives.sort((a, b) => a.score - b.score);
  }

  /**
   * Select best alternative date
   */
  selectBestAlternativeDate(alternatives, game, schedule) {
    // For now, return the first (best scored) alternative
    return alternatives[0]?.date;
  }

  /**
   * Find alternative venues
   */
  findAlternativeVenues(game, conflictingVenue, schedule, options) {
    // Implementation would check:
    // - Available venues for the date/time
    // - Venue capacity requirements
    // - Geographic proximity
    // - Venue amenities/requirements
    
    // Simplified implementation
    const alternatives = [
      { id: 'alt_venue_1', name: 'Alternative Venue 1', capacity: 5000 },
      { id: 'alt_venue_2', name: 'Alternative Venue 2', capacity: 7500 },
      { id: 'alt_venue_3', name: 'Alternative Venue 3', capacity: 3000 }
    ];
    
    return alternatives.filter(venue => venue.id !== conflictingVenue);
  }

  /**
   * Select best alternative venue
   */
  selectBestAlternativeVenue(alternatives, game, schedule) {
    // Select venue with best capacity match
    return alternatives[0];
  }

  /**
   * Get constraint resolution strategy
   */
  getConstraintResolutionStrategy(constraintType) {
    const strategies = {
      'HomeAwayBalance': this.resolveHomeAwayBalance.bind(this),
      'TravelDistance': this.resolveTravelDistance.bind(this),
      'RestDays': this.resolveRestDays.bind(this),
      'VenueAvailability': this.resolveVenueAvailability.bind(this)
    };
    
    return strategies[constraintType] || this.resolveGenericConstraintViolation.bind(this);
  }

  /**
   * Resolve home/away balance violations
   */
  async resolveHomeAwayBalance(violatingGames, schedule, options) {
    // Find games that can be swapped between home/away
    const swapOpportunities = [];
    
    for (const game of violatingGames) {
      // Look for a corresponding away game that could be swapped
      const swapCandidate = schedule.games.find(g => 
        g.id !== game.id &&
        ((g.homeTeam === game.awayTeam && g.awayTeam === game.homeTeam) ||
         (g.homeTeam === game.homeTeam || g.awayTeam === game.awayTeam))
      );
      
      if (swapCandidate) {
        swapOpportunities.push({
          type: 'home_away_swap',
          gameId: game.id,
          swapGameId: swapCandidate.id,
          reason: 'Balance home/away games'
        });
      }
    }
    
    return swapOpportunities;
  }

  /**
   * Resolve travel distance violations
   */
  async resolveTravelDistance(violatingGames, schedule, options) {
    // Group consecutive away games and try to optimize travel
    const travelOptimizations = [];
    
    // Implementation would calculate optimal travel routes
    // and suggest game reordering or venue changes
    
    return travelOptimizations;
  }

  /**
   * Resolve rest day violations
   */
  async resolveRestDays(violatingGames, schedule, options) {
    // Find games that violate minimum rest days and suggest date changes
    const restDayFixes = [];
    
    for (const game of violatingGames) {
      // Find next available date that provides adequate rest
      const nextAvailableDate = this.findNextAvailableDateWithRest(game, schedule);
      
      if (nextAvailableDate) {
        restDayFixes.push({
          type: 'date_change',
          gameId: game.id,
          newDate: nextAvailableDate,
          reason: 'Ensure minimum rest days'
        });
      }
    }
    
    return restDayFixes;
  }

  /**
   * Find next available date with adequate rest
   */
  findNextAvailableDateWithRest(game, schedule, minRestDays = 1) {
    const gameDate = new Date(game.date);
    const teamGames = schedule.games.filter(g => 
      g.homeTeam === game.homeTeam || g.awayTeam === game.homeTeam ||
      g.homeTeam === game.awayTeam || g.awayTeam === game.awayTeam
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Find a date that provides adequate rest before and after
    for (let days = minRestDays + 1; days <= 14; days++) {
      const candidateDate = new Date(gameDate);
      candidateDate.setDate(candidateDate.getDate() + days);
      const candidateDateStr = candidateDate.toISOString().split('T')[0];
      
      const hasConflict = teamGames.some(g => {
        if (g.id === game.id) return false;
        const otherDate = new Date(g.date);
        const daysDiff = Math.abs((candidateDate - otherDate) / (1000 * 60 * 60 * 24));
        return daysDiff < minRestDays;
      });
      
      if (!hasConflict) {
        return candidateDateStr;
      }
    }
    
    return null;
  }

  /**
   * Resolve venue availability violations
   */
  async resolveVenueAvailability(violatingGames, schedule, options) {
    // Find alternative venues or times for games with venue conflicts
    const venueResolutions = [];
    
    for (const game of violatingGames) {
      const alternativeVenues = this.findAlternativeVenues(game, game.venue, schedule, options);
      
      if (alternativeVenues.length > 0) {
        venueResolutions.push({
          type: 'venue_change',
          gameId: game.id,
          newVenue: alternativeVenues[0],
          reason: 'Resolve venue availability conflict'
        });
      }
    }
    
    return venueResolutions;
  }

  /**
   * Resolve generic constraint violations
   */
  async resolveGenericConstraintViolation(violatingGames, schedule, options) {
    return []; // No generic resolution available
  }

  /**
   * Calculate travel optimizations
   */
  calculateTravelOptimizations(teamId, conflictingGames, schedule) {
    // Implementation would analyze travel patterns and suggest optimizations
    return [];
  }

  /**
   * Find reschedule option
   */
  async findRescheduleOption(game, schedule, options) {
    // Try to find alternative date/time that resolves the conflict
    const alternatives = this.findAlternativeDates(game, [game.date], schedule, options);
    
    if (alternatives.length > 0) {
      return {
        type: 'reschedule',
        gameId: game.id,
        newDate: alternatives[0].date,
        reason: 'Reschedule to resolve venue conflict'
      };
    }
    
    return null;
  }
}

// Simplified optimization engine for worker
class OptimizationEngine {
  async optimizeSchedule(schedule, constraints, config) {
    const startTime = Date.now();
    let currentSchedule = { ...schedule };
    let bestSchedule = { ...schedule };
    let bestScore = await this.evaluateSchedule(schedule, constraints);
    
    const temperature = { current: config.initialTemperature };
    let iterations = 0;
    let improvements = 0;
    
    // Simulated annealing optimization
    while (iterations < config.maxIterations && temperature.current > 0.1) {
      // Generate neighbor solution
      const neighbor = this.generateNeighbor(currentSchedule);
      const neighborScore = await this.evaluateSchedule(neighbor, constraints);
      
      // Accept or reject the neighbor
      const delta = neighborScore - bestScore;
      const acceptanceProbability = delta > 0 ? 1 : Math.exp(delta / temperature.current);
      
      if (Math.random() < acceptanceProbability) {
        currentSchedule = neighbor;
        
        if (neighborScore > bestScore) {
          bestSchedule = { ...neighbor };
          bestScore = neighborScore;
          improvements++;
        }
      }
      
      // Cool down
      temperature.current *= config.coolingRate;
      iterations++;
      
      // Check convergence
      if (improvements > 0 && iterations % 100 === 0) {
        const convergenceRate = improvements / iterations;
        if (convergenceRate < config.convergenceThreshold) {
          break;
        }
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      schedule: bestSchedule,
      score: bestScore,
      iterations,
      improvements,
      executionTime,
      convergenceInfo: {
        finalTemperature: temperature.current,
        convergenceRate: improvements / iterations
      },
      violations: await this.getConstraintViolations(bestSchedule, constraints)
    };
  }

  generateNeighbor(schedule) {
    // Simple neighbor generation: swap two random games
    const neighbor = { ...schedule, games: [...schedule.games] };
    const games = neighbor.games;
    
    if (games.length < 2) return neighbor;
    
    const i = Math.floor(Math.random() * games.length);
    const j = Math.floor(Math.random() * games.length);
    
    if (i !== j) {
      // Swap dates of two games
      const tempDate = games[i].date;
      games[i] = { ...games[i], date: games[j].date };
      games[j] = { ...games[j], date: tempDate };
    }
    
    return neighbor;
  }

  async evaluateSchedule(schedule, constraints) {
    // Simple evaluation: count constraint violations
    let score = 1000; // Base score
    
    for (const constraint of constraints) {
      const violations = await this.evaluateConstraint(constraint, schedule);
      score -= violations.length * (constraint.weight || 1) * 10;
    }
    
    return Math.max(0, score);
  }

  async evaluateConstraint(constraint, schedule) {
    // Simplified constraint evaluation
    const violations = [];
    
    switch (constraint.type) {
      case 'DateConflict':
        // Check for games on same date for same teams
        const dateMap = new Map();
        for (const game of schedule.games) {
          const key = `${game.date}-${game.homeTeam}`;
          if (dateMap.has(key)) {
            violations.push({ game: game.id, type: 'DateConflict' });
          }
          dateMap.set(key, true);
        }
        break;
        
      // Add more constraint types as needed
    }
    
    return violations;
  }

  async getConstraintViolations(schedule, constraints) {
    const allViolations = [];
    
    for (const constraint of constraints) {
      const violations = await this.evaluateConstraint(constraint, schedule);
      allViolations.push(...violations);
    }
    
    return allViolations;
  }
}

// Simplified constraint evaluator for worker
class ConstraintEvaluator {
  async evaluateConstraint(constraint, gameMove, schedule) {
    const result = {
      constraint: constraint.type,
      weight: constraint.weight || 1.0,
      score: 1.0,
      violated: false,
      details: {}
    };

    try {
      switch (constraint.type) {
        case 'DateConflict':
          result.violated = this.checkDateConflict(gameMove, schedule);
          result.score = result.violated ? 0 : 1.0;
          break;
          
        case 'VenueConflict':
          result.violated = this.checkVenueConflict(gameMove, schedule);
          result.score = result.violated ? 0 : 1.0;
          break;
          
        case 'TravelDistance':
          const travelScore = this.evaluateTravelDistance(gameMove, schedule, constraint.parameters);
          result.score = travelScore;
          result.violated = travelScore < 0.5;
          break;
          
        case 'RestDays':
          const restScore = this.evaluateRestDays(gameMove, schedule, constraint.parameters);
          result.score = restScore;
          result.violated = restScore < 0.5;
          break;
          
        default:
          // Unknown constraint type, assume valid
          result.score = 1.0;
          result.violated = false;
      }
    } catch (error) {
      result.violated = true;
      result.score = 0;
      result.error = error.message;
    }

    return result;
  }

  checkDateConflict(gameMove, schedule) {
    // Check if moving the game creates a date conflict
    const { gameId, newDate } = gameMove;
    const game = schedule.games.find(g => g.id === gameId);
    
    if (!game) return false;
    
    // Check for conflicts with other games involving the same teams
    return schedule.games.some(g => 
      g.id !== gameId &&
      g.date === newDate &&
      (g.homeTeam === game.homeTeam || g.awayTeam === game.homeTeam ||
       g.homeTeam === game.awayTeam || g.awayTeam === game.awayTeam)
    );
  }

  checkVenueConflict(gameMove, schedule) {
    const { gameId, newVenue, newDate } = gameMove;
    const game = schedule.games.find(g => g.id === gameId);
    
    if (!game || !newVenue) return false;
    
    // Check for venue conflicts on the same date
    return schedule.games.some(g =>
      g.id !== gameId &&
      g.venue === newVenue &&
      g.date === (newDate || game.date)
    );
  }

  evaluateTravelDistance(gameMove, schedule, parameters) {
    // Simplified travel distance evaluation
    // In a real implementation, this would calculate actual distances
    const maxDistance = parameters.maxDistance || 1000; // miles
    const simulatedDistance = Math.random() * 1500; // Random for simulation
    
    return Math.max(0, 1 - (simulatedDistance / maxDistance));
  }

  evaluateRestDays(gameMove, schedule, parameters) {
    const minRestDays = parameters.minDays || 1;
    const { gameId, newDate } = gameMove;
    const game = schedule.games.find(g => g.id === gameId);
    
    if (!game) return 1.0;
    
    const moveDate = new Date(newDate || game.date);
    const teamGames = schedule.games.filter(g =>
      g.id !== gameId &&
      (g.homeTeam === game.homeTeam || g.awayTeam === game.homeTeam ||
       g.homeTeam === game.awayTeam || g.awayTeam === game.awayTeam)
    );
    
    // Check rest days before and after
    let minActualRest = Infinity;
    
    for (const otherGame of teamGames) {
      const otherDate = new Date(otherGame.date);
      const daysDiff = Math.abs((moveDate - otherDate) / (1000 * 60 * 60 * 24));
      minActualRest = Math.min(minActualRest, daysDiff);
    }
    
    if (minActualRest === Infinity) return 1.0;
    
    return Math.min(1.0, minActualRest / minRestDays);
  }
}

// Initialize worker
const worker = new OptimizationWorker();

// Listen for messages from main thread
parentPort.on('message', (message) => {
  worker.handleMessage(message);
});

// Signal that worker is ready
parentPort.postMessage({ type: 'worker_ready', timestamp: Date.now() });