/**
 * FlexTime Multi-Variable Optimizer
 * 
 * Inspired by Fastbreak AI's approach, this optimizer can handle dozens of variables
 * simultaneously, balancing competing priorities using a weighted scoring system.
 */

const logger = require('../utils/logger');

/**
 * Multi-Variable Optimizer for complex scheduling constraints
 */
class MultiVariableOptimizer {
  /**
   * Create a new Multi-Variable Optimizer
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      maxIterations: 1000,
      convergenceThreshold: 0.001,
      parallelEvaluations: true,
      ...config
    };
    
    // Default constraint weights
    this.constraintWeights = {
      travelDistance: 1.0,
      homeAwayBalance: 1.0,
      restDays: 1.0,
      consecutiveGames: 1.0,
      venueAvailability: 1.0,
      divisionBalance: 1.0,
      weekendDistribution: 1.0,
      academicCalendar: 1.0
    };
    
    // Initialize constraint evaluators
    this.constraintEvaluators = {};
    
    logger.info('Multi-Variable Optimizer created');
  }
  
  /**
   * Set constraint weights
   * @param {Object} weights - Constraint weights
   */
  setConstraintWeights(weights) {
    this.constraintWeights = {
      ...this.constraintWeights,
      ...weights
    };
    
    logger.info('Updated constraint weights', { weights: this.constraintWeights });
    return this;
  }
  
  /**
   * Register a constraint evaluator
   * @param {string} constraintName - Name of the constraint
   * @param {Function} evaluator - Function to evaluate the constraint
   */
  registerConstraintEvaluator(constraintName, evaluator) {
    if (typeof evaluator !== 'function') {
      throw new Error(`Evaluator for ${constraintName} must be a function`);
    }
    
    this.constraintEvaluators[constraintName] = evaluator;
    logger.info(`Registered constraint evaluator: ${constraintName}`);
    return this;
  }
  
  /**
   * Optimize a schedule
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   */
  async optimize(schedule, constraints = [], options = {}) {
    logger.info('Starting multi-variable optimization', {
      constraints: constraints.map(c => c.type),
      options
    });
    
    // Apply sport-specific adaptations
    this._adaptToSport(schedule.sportType, options);
    
    // Create a working copy of the schedule
    let currentSchedule = this._cloneSchedule(schedule);
    let currentScore = await this._evaluateSchedule(currentSchedule, constraints);
    
    let bestSchedule = currentSchedule;
    let bestScore = currentScore;
    
    const startTime = Date.now();
    let iteration = 0;
    let lastImprovement = 0;
    
    // Main optimization loop
    while (iteration < this.config.maxIterations && 
           (iteration - lastImprovement) < this.config.maxIterations / 5) {
      
      // Generate candidate schedules
      const candidates = await this._generateCandidates(currentSchedule, constraints, options);
      
      // Evaluate candidates in parallel if enabled
      let candidateScores;
      if (this.config.parallelEvaluations) {
        candidateScores = await Promise.all(
          candidates.map(candidate => this._evaluateSchedule(candidate, constraints))
        );
      } else {
        candidateScores = [];
        for (const candidate of candidates) {
          candidateScores.push(await this._evaluateSchedule(candidate, constraints));
        }
      }
      
      // Find the best candidate
      let bestCandidateIndex = -1;
      let bestCandidateScore = currentScore;
      
      for (let i = 0; i < candidates.length; i++) {
        if (candidateScores[i] > bestCandidateScore) {
          bestCandidateIndex = i;
          bestCandidateScore = candidateScores[i];
        }
      }
      
      // Update current schedule if improvement found
      if (bestCandidateIndex >= 0) {
        currentSchedule = candidates[bestCandidateIndex];
        currentScore = bestCandidateScore;
        
        // Update best schedule if this is the best so far
        if (currentScore > bestScore) {
          bestSchedule = currentSchedule;
          bestScore = currentScore;
          lastImprovement = iteration;
          
          logger.debug(`Found improved schedule at iteration ${iteration}, score: ${bestScore.toFixed(4)}`);
        }
      }
      
      iteration++;
      
      // Log progress periodically
      if (iteration % 100 === 0) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        logger.info(`Optimization progress: ${iteration} iterations, best score: ${bestScore.toFixed(4)}, time: ${elapsedTime.toFixed(2)}s`);
      }
    }
    
    const elapsedTime = (Date.now() - startTime) / 1000;
    logger.info(`Optimization completed in ${iteration} iterations, best score: ${bestScore.toFixed(4)}, time: ${elapsedTime.toFixed(2)}s`);
    
    // Add optimization metadata
    bestSchedule.metadata = {
      ...bestSchedule.metadata,
      optimization: {
        iterations: iteration,
        score: bestScore,
        elapsedTime,
        constraints: constraints.map(c => c.type),
        weights: { ...this.constraintWeights }
      }
    };
    
    return bestSchedule;
  }
  
  /**
   * Evaluate a schedule against constraints
   * @param {Object} schedule - Schedule to evaluate
   * @param {Array} constraints - Constraints to apply
   * @returns {Promise<number>} Schedule score
   * @private
   */
  async _evaluateSchedule(schedule, constraints) {
    // Initialize scores for each constraint type
    const scores = {};
    let totalWeight = 0;
    
    // Evaluate each constraint
    for (const constraint of constraints) {
      const constraintType = constraint.type;
      const weight = constraint.weight || this.constraintWeights[constraintType] || 1.0;
      
      // Skip constraints with zero weight
      if (weight <= 0) continue;
      
      totalWeight += weight;
      
      // Use registered evaluator if available
      if (this.constraintEvaluators[constraintType]) {
        scores[constraintType] = await this.constraintEvaluators[constraintType](schedule, constraint.parameters || {});
      } else {
        // Default evaluation based on constraint type
        switch (constraintType) {
          case 'travelDistance':
            scores[constraintType] = this._evaluateTravelDistance(schedule);
            break;
          case 'homeAwayBalance':
            scores[constraintType] = this._evaluateHomeAwayBalance(schedule);
            break;
          case 'restDays':
            scores[constraintType] = this._evaluateRestDays(schedule);
            break;
          case 'consecutiveGames':
            scores[constraintType] = this._evaluateConsecutiveGames(schedule);
            break;
          case 'venueAvailability':
            scores[constraintType] = this._evaluateVenueAvailability(schedule);
            break;
          case 'divisionBalance':
            scores[constraintType] = this._evaluateDivisionBalance(schedule);
            break;
          case 'weekendDistribution':
            scores[constraintType] = this._evaluateWeekendDistribution(schedule);
            break;
          case 'academicCalendar':
            scores[constraintType] = this._evaluateAcademicCalendar(schedule);
            break;
          default:
            scores[constraintType] = 0.5; // Default score for unknown constraints
        }
      }
    }
    
    // Calculate weighted average score
    let totalScore = 0;
    for (const constraint of constraints) {
      const constraintType = constraint.type;
      const weight = constraint.weight || this.constraintWeights[constraintType] || 1.0;
      
      if (weight > 0) {
        totalScore += scores[constraintType] * weight;
      }
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
  
  /**
   * Generate candidate schedules
   * @param {Object} schedule - Current schedule
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Candidate schedules
   * @private
   */
  async _generateCandidates(schedule, constraints, options) {
    // Number of candidates to generate
    const candidateCount = options.candidateCount || 5;
    const candidates = [];
    
    // Generate candidates using different strategies
    candidates.push(await this._swapGamesCandidate(schedule));
    candidates.push(await this._moveGameCandidate(schedule));
    candidates.push(await this._flipHomeAwayCandidate(schedule));
    
    // Generate additional random candidates if needed
    while (candidates.length < candidateCount) {
      candidates.push(await this._randomCandidate(schedule));
    }
    
    return candidates;
  }
  
  /**
   * Generate a candidate by swapping two games
   * @param {Object} schedule - Current schedule
   * @returns {Promise<Object>} Candidate schedule
   * @private
   */
  async _swapGamesCandidate(schedule) {
    const candidate = this._cloneSchedule(schedule);
    
    if (candidate.games.length < 2) {
      return candidate;
    }
    
    // Select two random games
    const index1 = Math.floor(Math.random() * candidate.games.length);
    let index2 = Math.floor(Math.random() * candidate.games.length);
    
    // Ensure we select different games
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * candidate.games.length);
    }
    
    // Swap the dates of the two games
    const tempDate = candidate.games[index1].date;
    candidate.games[index1].date = candidate.games[index2].date;
    candidate.games[index2].date = tempDate;
    
    return candidate;
  }
  
  /**
   * Generate a candidate by moving a game to a new date
   * @param {Object} schedule - Current schedule
   * @returns {Promise<Object>} Candidate schedule
   * @private
   */
  async _moveGameCandidate(schedule) {
    const candidate = this._cloneSchedule(schedule);
    
    if (candidate.games.length === 0) {
      return candidate;
    }
    
    // Select a random game
    const gameIndex = Math.floor(Math.random() * candidate.games.length);
    
    // Get the date range from the schedule
    const dates = candidate.games.map(game => new Date(game.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Generate a new random date within the range
    const range = maxDate.getTime() - minDate.getTime();
    const newDate = new Date(minDate.getTime() + Math.random() * range);
    
    // Update the game date
    candidate.games[gameIndex].date = newDate;
    
    return candidate;
  }
  
  /**
   * Generate a candidate by flipping home/away teams for a game
   * @param {Object} schedule - Current schedule
   * @returns {Promise<Object>} Candidate schedule
   * @private
   */
  async _flipHomeAwayCandidate(schedule) {
    const candidate = this._cloneSchedule(schedule);
    
    if (candidate.games.length === 0) {
      return candidate;
    }
    
    // Select a random game
    const gameIndex = Math.floor(Math.random() * candidate.games.length);
    const game = candidate.games[gameIndex];
    
    // Swap home and away teams
    const tempTeamId = game.homeTeamId;
    game.homeTeamId = game.awayTeamId;
    game.awayTeamId = tempTeamId;
    
    // Update venue if needed
    if (game.venueId) {
      // Find the new home team
      const homeTeam = candidate.teams.find(team => team.id === game.homeTeamId);
      
      // Update venue to the home team's venue if available
      if (homeTeam && homeTeam.venueId) {
        game.venueId = homeTeam.venueId;
      }
    }
    
    return candidate;
  }
  
  /**
   * Generate a random candidate schedule
   * @param {Object} schedule - Current schedule
   * @returns {Promise<Object>} Candidate schedule
   * @private
   */
  async _randomCandidate(schedule) {
    // Choose a random modification strategy
    const strategies = [
      this._swapGamesCandidate.bind(this),
      this._moveGameCandidate.bind(this),
      this._flipHomeAwayCandidate.bind(this)
    ];
    
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy(schedule);
  }
  
  /**
   * Clone a schedule
   * @param {Object} schedule - Schedule to clone
   * @returns {Object} Cloned schedule
   * @private
   */
  _cloneSchedule(schedule) {
    return {
      id: schedule.id,
      sportType: schedule.sportType,
      conferenceId: schedule.conferenceId,
      seasonYear: schedule.seasonYear,
      teams: [...schedule.teams],
      games: schedule.games.map(game => ({
        id: game.id,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        venueId: game.venueId,
        date: new Date(game.date),
        metadata: { ...game.metadata }
      })),
      constraints: [...(schedule.constraints || [])],
      metadata: { ...(schedule.metadata || {}) }
    };
  }
  
  /**
   * Adapt optimizer to specific sport
   * @param {string} sportType - Type of sport
   * @param {Object} options - Adaptation options
   * @private
   */
  _adaptToSport(sportType, options = {}) {
    // Adjust weights based on sport type
    switch (sportType) {
      case 'football':
        // Football prioritizes rest days and weekend games
        this.constraintWeights = {
          ...this.constraintWeights,
          restDays: 1.5,
          weekendDistribution: 1.5,
          consecutiveGames: 0.8,
          travelDistance: 1.2
        };
        break;
        
      case 'basketball':
        // Basketball prioritizes balanced travel and home/away
        this.constraintWeights = {
          ...this.constraintWeights,
          travelDistance: 1.3,
          homeAwayBalance: 1.3,
          consecutiveGames: 1.2,
          restDays: 1.0
        };
        break;
        
      case 'baseball':
      case 'softball':
        // Baseball/softball prioritizes consecutive games (series)
        this.constraintWeights = {
          ...this.constraintWeights,
          consecutiveGames: 1.5,
          travelDistance: 1.3,
          restDays: 0.8,
          homeAwayBalance: 1.0
        };
        break;
        
      case 'volleyball':
      case 'soccer':
        // Volleyball/soccer balanced approach
        this.constraintWeights = {
          ...this.constraintWeights,
          travelDistance: 1.2,
          homeAwayBalance: 1.2,
          restDays: 1.1,
          weekendDistribution: 1.0
        };
        break;
    }
    
    // Override with conference-specific adaptations if provided
    if (options.conferenceAdaptations) {
      this.constraintWeights = {
        ...this.constraintWeights,
        ...options.conferenceAdaptations
      };
    }
    
    logger.info(`Adapted optimizer for ${sportType}`, { weights: this.constraintWeights });
  }
  
  /**
   * Evaluate travel distance
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateTravelDistance(schedule) {
    // Simple implementation - in a real system, this would calculate actual distances
    // and compare to optimal/worst case scenarios
    return 0.7;
  }
  
  /**
   * Evaluate home/away balance
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateHomeAwayBalance(schedule) {
    // Count home and away games for each team
    const teamGames = {};
    
    schedule.teams.forEach(team => {
      teamGames[team.id] = { home: 0, away: 0 };
    });
    
    schedule.games.forEach(game => {
      if (teamGames[game.homeTeamId]) {
        teamGames[game.homeTeamId].home++;
      }
      
      if (teamGames[game.awayTeamId]) {
        teamGames[game.awayTeamId].away++;
      }
    });
    
    // Calculate imbalance for each team
    let totalImbalance = 0;
    let teamCount = 0;
    
    Object.values(teamGames).forEach(games => {
      const total = games.home + games.away;
      if (total > 0) {
        const expected = total / 2;
        const imbalance = Math.abs(games.home - expected) / total;
        totalImbalance += imbalance;
        teamCount++;
      }
    });
    
    // Convert to score (0-1, higher is better)
    return teamCount > 0 ? 1 - (totalImbalance / teamCount) : 0.5;
  }
  
  /**
   * Evaluate rest days
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateRestDays(schedule) {
    // Group games by team
    const teamGames = {};
    
    schedule.teams.forEach(team => {
      teamGames[team.id] = [];
    });
    
    schedule.games.forEach(game => {
      if (teamGames[game.homeTeamId]) {
        teamGames[game.homeTeamId].push({
          date: new Date(game.date),
          isHome: true
        });
      }
      
      if (teamGames[game.awayTeamId]) {
        teamGames[game.awayTeamId].push({
          date: new Date(game.date),
          isHome: false
        });
      }
    });
    
    // Sort games by date for each team
    Object.values(teamGames).forEach(games => {
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
    });
    
    // Calculate rest days between games
    let insufficientRestCount = 0;
    let totalGapCount = 0;
    
    Object.values(teamGames).forEach(games => {
      for (let i = 1; i < games.length; i++) {
        const daysBetween = (games[i].date.getTime() - games[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysBetween < 1) {
          insufficientRestCount++;
        }
        
        totalGapCount++;
      }
    });
    
    // Convert to score (0-1, higher is better)
    return totalGapCount > 0 ? 1 - (insufficientRestCount / totalGapCount) : 0.5;
  }
  
  /**
   * Evaluate consecutive games
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateConsecutiveGames(schedule) {
    // Simple implementation - in a real system, this would be more complex
    return 0.8;
  }
  
  /**
   * Evaluate venue availability
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateVenueAvailability(schedule) {
    // Simple implementation - in a real system, this would check actual venue availability
    return 0.9;
  }
  
  /**
   * Evaluate division balance
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateDivisionBalance(schedule) {
    // Simple implementation - in a real system, this would check division balance
    return 0.7;
  }
  
  /**
   * Evaluate weekend distribution
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateWeekendDistribution(schedule) {
    // Count weekend games
    let weekendGames = 0;
    
    schedule.games.forEach(game => {
      const date = new Date(game.date);
      const day = date.getDay();
      
      // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) {
        weekendGames++;
      }
    });
    
    // Calculate percentage of games on weekends
    const weekendPercentage = schedule.games.length > 0 ? weekendGames / schedule.games.length : 0;
    
    // For most sports, higher weekend percentage is better (up to a point)
    // Ideal percentage depends on sport type
    let idealPercentage = 0.5;
    
    if (schedule.sportType === 'football') {
      idealPercentage = 0.9; // Football heavily prefers weekend games
    } else if (schedule.sportType === 'basketball') {
      idealPercentage = 0.6; // Basketball has a mix of weekday and weekend games
    }
    
    // Score based on distance from ideal percentage
    const distance = Math.abs(weekendPercentage - idealPercentage);
    return 1 - Math.min(distance, 1);
  }
  
  /**
   * Evaluate academic calendar
   * @param {Object} schedule - Schedule to evaluate
   * @returns {number} Score (0-1, higher is better)
   * @private
   */
  _evaluateAcademicCalendar(schedule) {
    // Simple implementation - in a real system, this would check academic calendar
    return 0.8;
  }
}

module.exports = MultiVariableOptimizer;
