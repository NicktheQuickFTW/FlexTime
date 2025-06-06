/**
 * Constraint Evaluator for FlexTime
 * 
 * Advanced constraint evaluation system with weighted penalties and learning capabilities
 */

const logger = require("../utils/logger");

class ConstraintEvaluator {
  /**
   * Create a new ConstraintEvaluator
   * @param {Array} constraints - List of constraints to evaluate
   * @param {Object} weights - Weights for different constraint types
   * @param {Object} options - Additional options
   */
  constructor(constraints = [], weights = {}, options = {}) {
    this.constraints = constraints;
    this.defaultWeights = {
      // Hard constraint weights (very high to enforce)
      hardConstraintWeight: 10000,
      
      // Specific constraint type weights
      RestDays: 10,
      MaxConsecutiveAway: 5,
      MaxConsecutiveHome: 5,
      VenueAvailability: 1000,
      SpecialDate: 500,
      CrossTownRivalry: 10,
      DivisionBalance: 8,
      ConferenceBalance: 8,
      TravelDistance: 0.1,
      HomeAwayBalance: 6,
      WeekdayWeekendBalance: 4,
      TimeSlotDistribution: 3,
      TVBroadcastRequirements: 7,
      TraditionalDates: 5,
      PlayerRest: 9
    };
    
    // Merge provided weights with defaults
    this.weights = { ...this.defaultWeights, ...weights };
    
    // Initialize historical data for learning
    this.historySize = options.historySize || 10;
    this.history = {
      evaluations: [],
      feedback: []
    };
    
    // Learning rate for weight adjustments
    this.learningRate = options.learningRate || 0.05;
    
    logger.info('ConstraintEvaluator initialized with ' + this.constraints.length + ' constraints');
  }
  
  /**
   * Add a constraint to the evaluator
   * @param {Object} constraint - Constraint to add
   */
  addConstraint(constraint) {
    this.constraints.push(constraint);
    logger.info(`Added constraint: ${constraint.type}`);
  }
  
  /**
   * Set constraints for the evaluator
   * @param {Array} constraints - Constraints to set
   */
  setConstraints(constraints) {
    this.constraints = constraints;
    logger.info(`Set ${constraints.length} constraints`);
  }
  
  /**
   * Evaluate a schedule against all constraints
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   */
  evaluateSchedule(schedule) {
    let totalScore = 0;
    let hardConstraintViolations = 0;
    const violations = [];
    const results = {};
    
    logger.info(`Evaluating schedule ${schedule.id} against ${this.constraints.length} constraints`);
    
    // Evaluate each constraint
    for (const constraint of this.constraints) {
      const result = this.evaluateConstraint(constraint, schedule);
      
      // Apply weight to the score
      const weight = this.getConstraintWeight(constraint);
      const weightedScore = result.score * weight;
      
      // Track the result
      results[constraint.id] = {
        type: constraint.type,
        score: result.score,
        weightedScore,
        violations: result.violations
      };
      
      // Add to total score
      totalScore += weightedScore;
      
      // Add violations to the list
      if (result.violations.length > 0) {
        violations.push(...result.violations.map(v => ({
          ...v,
          constraintId: constraint.id,
          constraintType: constraint.type
        })));
        
        // Count hard constraint violations
        if (constraint.category === 'hard') {
          hardConstraintViolations += result.violations.length;
        }
      }
    }
    
    // Add to evaluation history
    this._addToHistory(schedule, results, totalScore, violations);
    
    return {
      score: totalScore,
      hardConstraintViolations,
      violations,
      valid: hardConstraintViolations === 0,
      constraintResults: results
    };
  }
  
  /**
   * Evaluate a single constraint
   * @param {Object} constraint - Constraint to evaluate
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Constraint evaluation result
   */
  evaluateConstraint(constraint, schedule) {
    // Default result
    const defaultResult = { score: 0, violations: [] };
    
    try {
      // Get the appropriate evaluation method for this constraint type
      const evaluationMethod = this._getEvaluationMethod(constraint.type);
      
      if (!evaluationMethod) {
        logger.warn(`No evaluation method found for constraint type: ${constraint.type}`);
        return defaultResult;
      }
      
      // Evaluate the constraint
      return evaluationMethod.call(this, constraint, schedule);
    } catch (error) {
      logger.error(`Error evaluating constraint ${constraint.id}: ${error.message}`);
      return defaultResult;
    }
  }
  
  /**
   * Get the weight for a constraint
   * @param {Object} constraint - Constraint to get weight for
   * @returns {number} Constraint weight
   */
  getConstraintWeight(constraint) {
    // Get weight based on constraint type or category
    if (this.weights[constraint.type]) {
      return this.weights[constraint.type];
    } else if (constraint.category === 'hard') {
      return this.weights.hardConstraintWeight;
    } else {
      return 1.0; // Default weight
    }
  }
  
  /**
   * Process feedback and update weights
   * @param {Object} feedbackData - Feedback data
   * @returns {Object} Updated weights
   */
  processFeedback(feedbackData) {
    // Add feedback to history
    this.history.feedback.push(feedbackData);
    
    // Trim history if needed
    if (this.history.feedback.length > this.historySize) {
      this.history.feedback.shift();
    }
    
    // Process feedback to adjust weights
    const adjustments = this._calculateWeightAdjustments(feedbackData);
    this._applyWeightAdjustments(adjustments);
    
    logger.info('Processed feedback and updated constraint weights');
    
    return { ...this.weights };
  }
  
  /**
   * Get the current weights
   * @returns {Object} Current weights
   */
  getWeights() {
    return { ...this.weights };
  }
  
  /**
   * Reset weights to default values
   */
  resetWeights() {
    this.weights = { ...this.defaultWeights };
    logger.info('Reset constraint weights to default values');
  }
  
  /**
   * Add evaluation to history
   * @param {Object} schedule - Evaluated schedule
   * @param {Object} results - Evaluation results
   * @param {number} score - Total score
   * @param {Array} violations - Constraint violations
   * @private
   */
  _addToHistory(schedule, results, score, violations) {
    // Add to history
    this.history.evaluations.push({
      scheduleId: schedule.id,
      timestamp: new Date().toISOString(),
      score,
      violationCount: violations.length,
      results
    });
    
    // Trim history if needed
    if (this.history.evaluations.length > this.historySize) {
      this.history.evaluations.shift();
    }
  }
  
  /**
   * Calculate weight adjustments based on feedback
   * @param {Object} feedbackData - Feedback data
   * @returns {Object} Weight adjustments
   * @private
   */
  _calculateWeightAdjustments(feedbackData) {
    const adjustments = {};
    
    // Exit if no feedback or no evaluation history
    if (!feedbackData.constraintFeedback || this.history.evaluations.length === 0) {
      return adjustments;
    }
    
    // Get the most recent evaluation
    const latestEvaluation = this.history.evaluations[this.history.evaluations.length - 1];
    
    // Process constraint-specific feedback
    for (const [constraintType, importance] of Object.entries(feedbackData.constraintFeedback)) {
      // Normalize importance to a scale of 0-2 where 1 is neutral
      // (0 = less important, 1 = same importance, 2 = more important)
      const normalizedImportance = Math.max(0, Math.min(2, importance));
      
      // Calculate the adjustment factor (0.8 to 1.2, centered around 1.0)
      const adjustmentFactor = 0.8 + (normalizedImportance * 0.2);
      
      // Get current weight
      const currentWeight = this.weights[constraintType] || 1.0;
      
      // Calculate new weight
      const newWeight = currentWeight * adjustmentFactor;
      
      // Store adjustment
      adjustments[constraintType] = newWeight;
    }
    
    return adjustments;
  }
  
  /**
   * Apply weight adjustments
   * @param {Object} adjustments - Weight adjustments
   * @private
   */
  _applyWeightAdjustments(adjustments) {
    // Apply each adjustment
    for (const [constraintType, newWeight] of Object.entries(adjustments)) {
      // Apply adjustment with learning rate
      const currentWeight = this.weights[constraintType] || 1.0;
      const adjustment = (newWeight - currentWeight) * this.learningRate;
      
      this.weights[constraintType] = currentWeight + adjustment;
      
      logger.info(`Adjusted weight for ${constraintType}: ${currentWeight} -> ${this.weights[constraintType]}`);
    }
  }
  
  /**
   * Get the evaluation method for a constraint type
   * @param {string} constraintType - Type of constraint
   * @returns {Function} Evaluation method
   * @private
   */
  _getEvaluationMethod(constraintType) {
    // Map of constraint types to evaluation methods
    const evaluationMethods = {
      'RestDays': this._evaluateRestDays,
      'MaxConsecutiveAway': this._evaluateMaxConsecutiveAway,
      'MaxConsecutiveHome': this._evaluateMaxConsecutiveHome,
      'VenueAvailability': this._evaluateVenueAvailability,
      'SpecialDate': this._evaluateSpecialDate,
      'DivisionBalance': this._evaluateDivisionBalance,
      'ConferenceBalance': this._evaluateConferenceBalance,
      'TravelDistance': this._evaluateTravelDistance,
      'HomeAwayBalance': this._evaluateHomeAwayBalance,
      'WeekdayWeekendBalance': this._evaluateWeekdayWeekendBalance,
      'TimeSlotDistribution': this._evaluateTimeSlotDistribution
    };
    
    return evaluationMethods[constraintType];
  }
  
  // Constraint-specific evaluation methods
  
  /**
   * Evaluate rest days constraint
   * @param {Object} constraint - Rest days constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateRestDays(constraint, schedule) {
    const minDays = constraint.parameters.minDays || 1;
    const violations = [];
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push(game);
      teamGames[game.awayTeam.id].push(game);
    }
    
    // Check each team's schedule
    let totalScore = 0;
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check for rest day violations
      for (let i = 1; i < games.length; i++) {
        const prevGame = games[i - 1];
        const currentGame = games[i];
        
        // Calculate days between games
        const daysBetween = Math.floor(
          (currentGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween < minDays) {
          violations.push({
            message: `Team ${teamId} has only ${daysBetween} day(s) between games on ${prevGame.date.toISOString().slice(0, 10)} and ${currentGame.date.toISOString().slice(0, 10)}`,
            team: teamId,
            severity: 'high',
            gameIds: [prevGame.id, currentGame.id]
          });
          
          // Add to score based on severity
          totalScore += 1 + (minDays - daysBetween);
        }
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate maximum consecutive away games constraint
   * @param {Object} constraint - Max consecutive away constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateMaxConsecutiveAway(constraint, schedule) {
    const maxGames = constraint.parameters.maxGames || 3;
    const violations = [];
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      teamGames[homeTeamId].push({ id: game.id, date: game.date, isHome: true });
      teamGames[awayTeamId].push({ id: game.id, date: game.date, isHome: false });
    }
    
    // Check each team's schedule
    let totalScore = 0;
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check for consecutive away games
      let consecutiveAway = 0;
      let awayStreak = [];
      
      for (const game of games) {
        if (!game.isHome) {
          consecutiveAway++;
          awayStreak.push(game.id);
        } else {
          // Check if previous streak violated constraint
          if (consecutiveAway > maxGames) {
            violations.push({
              message: `Team ${teamId} has ${consecutiveAway} consecutive away games`,
              team: teamId,
              severity: consecutiveAway > maxGames + 2 ? 'high' : 'medium',
              gameIds: [...awayStreak]
            });
            
            // Add to score based on severity
            totalScore += (consecutiveAway - maxGames);
          }
          
          // Reset streak
          consecutiveAway = 0;
          awayStreak = [];
        }
      }
      
      // Check final streak
      if (consecutiveAway > maxGames) {
        violations.push({
          message: `Team ${teamId} has ${consecutiveAway} consecutive away games at the end of the schedule`,
          team: teamId,
          severity: consecutiveAway > maxGames + 2 ? 'high' : 'medium',
          gameIds: [...awayStreak]
        });
        
        // Add to score based on severity
        totalScore += (consecutiveAway - maxGames);
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate maximum consecutive home games constraint
   * @param {Object} constraint - Max consecutive home constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateMaxConsecutiveHome(constraint, schedule) {
    const maxGames = constraint.parameters.maxGames || 5;
    const violations = [];
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      teamGames[homeTeamId].push({ id: game.id, date: game.date, isHome: true });
      teamGames[awayTeamId].push({ id: game.id, date: game.date, isHome: false });
    }
    
    // Check each team's schedule
    let totalScore = 0;
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check for consecutive home games
      let consecutiveHome = 0;
      let homeStreak = [];
      
      for (const game of games) {
        if (game.isHome) {
          consecutiveHome++;
          homeStreak.push(game.id);
        } else {
          // Check if previous streak violated constraint
          if (consecutiveHome > maxGames) {
            violations.push({
              message: `Team ${teamId} has ${consecutiveHome} consecutive home games`,
              team: teamId,
              severity: consecutiveHome > maxGames + 2 ? 'high' : 'medium',
              gameIds: [...homeStreak]
            });
            
            // Add to score based on severity
            totalScore += (consecutiveHome - maxGames);
          }
          
          // Reset streak
          consecutiveHome = 0;
          homeStreak = [];
        }
      }
      
      // Check final streak
      if (consecutiveHome > maxGames) {
        violations.push({
          message: `Team ${teamId} has ${consecutiveHome} consecutive home games at the end of the schedule`,
          team: teamId,
          severity: consecutiveHome > maxGames + 2 ? 'high' : 'medium',
          gameIds: [...homeStreak]
        });
        
        // Add to score based on severity
        totalScore += (consecutiveHome - maxGames);
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate venue availability constraint
   * @param {Object} constraint - Venue availability constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateVenueAvailability(constraint, schedule) {
    const unavailableDates = constraint.parameters.unavailableDates || {};
    const violations = [];
    
    // Check each game
    let totalScore = 0;
    
    for (const game of schedule.games) {
      const venueId = game.venue.id;
      const gameDate = game.date.toISOString().slice(0, 10);
      
      // Check if venue is unavailable on this date
      if (unavailableDates[venueId] && unavailableDates[venueId].includes(gameDate)) {
        violations.push({
          message: `Venue ${venueId} is unavailable on ${gameDate}`,
          venue: venueId,
          date: gameDate,
          severity: 'high',
          gameIds: [game.id]
        });
        
        // Venue unavailability is a hard constraint
        totalScore += 10;
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate special date constraint
   * @param {Object} constraint - Special date constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateSpecialDate(constraint, schedule) {
    const specialDates = constraint.parameters.specialDates || {};
    const violations = [];
    
    // Check each game
    let totalScore = 0;
    
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      const gameDate = game.date.toISOString().slice(0, 10);
      
      // Check if special date restrictions apply
      for (const [date, restrictions] of Object.entries(specialDates)) {
        if (gameDate === date) {
          // Check if this game violates any restrictions
          if (restrictions.noGames) {
            violations.push({
              message: `No games should be scheduled on ${date} (special date)`,
              date,
              severity: 'medium',
              gameIds: [game.id]
            });
            
            totalScore += 5;
          } else if (restrictions.teamsNotPlaying && 
                    (restrictions.teamsNotPlaying.includes(homeTeamId) || 
                     restrictions.teamsNotPlaying.includes(awayTeamId))) {
            violations.push({
              message: `Team ${restrictions.teamsNotPlaying.includes(homeTeamId) ? homeTeamId : awayTeamId} should not play on ${date} (special date)`,
              date,
              team: restrictions.teamsNotPlaying.includes(homeTeamId) ? homeTeamId : awayTeamId,
              severity: 'medium',
              gameIds: [game.id]
            });
            
            totalScore += 3;
          }
        }
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate division balance constraint
   * @param {Object} constraint - Division balance constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateDivisionBalance(constraint, schedule) {
    const divisions = constraint.parameters.divisions || {};
    const gamesWithinDivision = constraint.parameters.gamesWithinDivision || 0;
    const violations = [];
    
    // Skip if no division configuration
    if (Object.keys(divisions).length === 0) {
      return { score: 0, violations: [] };
    }
    
    // Count division games for each team
    const divisionGames = {};
    
    for (const team of schedule.teams) {
      divisionGames[team.id] = 0;
    }
    
    // Count games within division
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      // Get divisions for both teams
      const homeTeamDivision = this._getTeamDivision(homeTeamId, divisions);
      const awayTeamDivision = this._getTeamDivision(awayTeamId, divisions);
      
      // Check if teams are in same division
      if (homeTeamDivision && awayTeamDivision && homeTeamDivision === awayTeamDivision) {
        divisionGames[homeTeamId]++;
        divisionGames[awayTeamId]++;
      }
    }
    
    // Check if teams have the correct number of division games
    let totalScore = 0;
    
    for (const [teamId, count] of Object.entries(divisionGames)) {
      if (count !== gamesWithinDivision) {
        violations.push({
          message: `Team ${teamId} has ${count} games within its division instead of the required ${gamesWithinDivision}`,
          team: teamId,
          severity: Math.abs(count - gamesWithinDivision) > 2 ? 'high' : 'medium'
        });
        
        // Add to score based on severity
        totalScore += Math.abs(count - gamesWithinDivision);
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Get the division for a team
   * @param {string} teamId - Team ID
   * @param {Object} divisions - Division mapping
   * @returns {string|null} Division name
   * @private
   */
  _getTeamDivision(teamId, divisions) {
    for (const [division, teams] of Object.entries(divisions)) {
      if (teams.includes(teamId)) {
        return division;
      }
    }
    
    return null;
  }
  
  /**
   * Evaluate conference balance constraint
   * @param {Object} constraint - Conference balance constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateConferenceBalance(constraint, schedule) {
    const conferences = constraint.parameters.conferences || {};
    const gamesWithinConference = constraint.parameters.gamesWithinConference || 0;
    const violations = [];
    
    // Skip if no conference configuration
    if (Object.keys(conferences).length === 0) {
      return { score: 0, violations: [] };
    }
    
    // Count conference games for each team
    const conferenceGames = {};
    
    for (const team of schedule.teams) {
      conferenceGames[team.id] = 0;
    }
    
    // Count games within conference
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      // Get conferences for both teams
      const homeTeamConference = this._getTeamConference(homeTeamId, conferences);
      const awayTeamConference = this._getTeamConference(awayTeamId, conferences);
      
      // Check if teams are in same conference
      if (homeTeamConference && awayTeamConference && homeTeamConference === awayTeamConference) {
        conferenceGames[homeTeamId]++;
        conferenceGames[awayTeamId]++;
      }
    }
    
    // Check if teams have the correct number of conference games
    let totalScore = 0;
    
    for (const [teamId, count] of Object.entries(conferenceGames)) {
      if (count !== gamesWithinConference) {
        violations.push({
          message: `Team ${teamId} has ${count} games within its conference instead of the required ${gamesWithinConference}`,
          team: teamId,
          severity: Math.abs(count - gamesWithinConference) > 2 ? 'high' : 'medium'
        });
        
        // Add to score based on severity
        totalScore += Math.abs(count - gamesWithinConference);
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Get the conference for a team
   * @param {string} teamId - Team ID
   * @param {Object} conferences - Conference mapping
   * @returns {string|null} Conference name
   * @private
   */
  _getTeamConference(teamId, conferences) {
    for (const [conference, teams] of Object.entries(conferences)) {
      if (teams.includes(teamId)) {
        return conference;
      }
    }
    
    return null;
  }
  
  /**
   * Evaluate travel distance constraint
   * @param {Object} constraint - Travel distance constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateTravelDistance(constraint, schedule) {
    const maxTotalDistance = constraint.parameters.maxTotalDistance || Infinity;
    const maxAverageDistance = constraint.parameters.maxAverageDistance || Infinity;
    const violations = [];
    
    // Calculate travel distance for each team
    const teamDistances = {};
    
    for (const team of schedule.teams) {
      teamDistances[team.id] = {
        total: 0,
        games: 0,
        average: 0
      };
    }
    
    // Sort games by date for each team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push(game);
      teamGames[game.awayTeam.id].push(game);
    }
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Calculate distances between consecutive games
      let previousLocation = schedule.teams.find(t => t.id === teamId).location;
      
      for (const game of games) {
        const isHome = game.homeTeam.id === teamId;
        const gameLocation = isHome ? game.venue.location : game.venue.location;
        
        // Calculate distance from previous location
        const distance = previousLocation.distanceTo(gameLocation);
        
        // Add to team's total distance
        teamDistances[teamId].total += distance;
        teamDistances[teamId].games++;
        
        // Update previous location
        previousLocation = gameLocation;
      }
      
      // Calculate average
      if (teamDistances[teamId].games > 0) {
        teamDistances[teamId].average = teamDistances[teamId].total / teamDistances[teamId].games;
      }
      
      // Check constraints
      if (teamDistances[teamId].total > maxTotalDistance) {
        violations.push({
          message: `Team ${teamId} has total travel distance of ${Math.round(teamDistances[teamId].total)} miles, exceeding limit of ${maxTotalDistance}`,
          team: teamId,
          severity: 'medium'
        });
      }
      
      if (teamDistances[teamId].average > maxAverageDistance) {
        violations.push({
          message: `Team ${teamId} has average travel distance of ${Math.round(teamDistances[teamId].average)} miles per game, exceeding limit of ${maxAverageDistance}`,
          team: teamId,
          severity: 'medium'
        });
      }
    }
    
    // Calculate score based on violations
    let totalScore = 0;
    
    for (const violation of violations) {
      totalScore += 1;
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate home/away balance constraint
   * @param {Object} constraint - Home/away balance constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateHomeAwayBalance(constraint, schedule) {
    const targetRatio = constraint.parameters.targetRatio || 0.5;
    const tolerance = constraint.parameters.tolerance || 0.1;
    const violations = [];
    
    // Count home and away games for each team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = { home: 0, away: 0, total: 0, ratio: 0 };
    }
    
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      teamGames[homeTeamId].home++;
      teamGames[homeTeamId].total++;
      
      teamGames[awayTeamId].away++;
      teamGames[awayTeamId].total++;
    }
    
    // Calculate ratios and check balance
    let totalScore = 0;
    
    for (const [teamId, counts] of Object.entries(teamGames)) {
      if (counts.total > 0) {
        counts.ratio = counts.home / counts.total;
        
        // Check if ratio is within tolerance
        if (Math.abs(counts.ratio - targetRatio) > tolerance) {
          const imbalance = Math.abs(counts.ratio - targetRatio);
          
          violations.push({
            message: `Team ${teamId} has home/away imbalance: ${Math.round(counts.ratio * 100)}% home games vs target ${Math.round(targetRatio * 100)}%`,
            team: teamId,
            severity: imbalance > 2 * tolerance ? 'high' : 'medium'
          });
          
          // Add to score based on severity of imbalance
          totalScore += 10 * imbalance;
        }
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate weekday/weekend balance constraint
   * @param {Object} constraint - Weekday/weekend balance constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateWeekdayWeekendBalance(constraint, schedule) {
    const weekendPercent = constraint.parameters.weekendPercent || 0.4;
    const tolerance = constraint.parameters.tolerance || 0.1;
    const violations = [];
    
    // Count weekday and weekend games for each team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = { weekday: 0, weekend: 0, total: 0, weekendRatio: 0 };
    }
    
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      const gameDate = new Date(game.date);
      
      // Check if game is on weekend (Saturday or Sunday)
      const isWeekend = gameDate.getDay() === 0 || gameDate.getDay() === 6;
      
      if (isWeekend) {
        teamGames[homeTeamId].weekend++;
        teamGames[awayTeamId].weekend++;
      } else {
        teamGames[homeTeamId].weekday++;
        teamGames[awayTeamId].weekday++;
      }
      
      teamGames[homeTeamId].total++;
      teamGames[awayTeamId].total++;
    }
    
    // Calculate ratios and check balance
    let totalScore = 0;
    
    for (const [teamId, counts] of Object.entries(teamGames)) {
      if (counts.total > 0) {
        counts.weekendRatio = counts.weekend / counts.total;
        
        // Check if ratio is within tolerance
        if (Math.abs(counts.weekendRatio - weekendPercent) > tolerance) {
          const imbalance = Math.abs(counts.weekendRatio - weekendPercent);
          
          violations.push({
            message: `Team ${teamId} has weekday/weekend imbalance: ${Math.round(counts.weekendRatio * 100)}% weekend games vs target ${Math.round(weekendPercent * 100)}%`,
            team: teamId,
            severity: imbalance > 2 * tolerance ? 'high' : 'medium'
          });
          
          // Add to score based on severity of imbalance
          totalScore += 5 * imbalance;
        }
      }
    }
    
    return { score: totalScore, violations };
  }
  
  /**
   * Evaluate time slot distribution constraint
   * @param {Object} constraint - Time slot constraint
   * @param {Object} schedule - Schedule to evaluate
   * @returns {Object} Evaluation result
   * @private
   */
  _evaluateTimeSlotDistribution(constraint, schedule) {
    const slots = constraint.parameters.timeSlots || [
      { name: 'morning', start: 10, end: 12, target: 0.1 },
      { name: 'afternoon', start: 13, end: 17, target: 0.5 },
      { name: 'evening', start: 18, end: 21, target: 0.4 }
    ];
    const tolerance = constraint.parameters.tolerance || 0.1;
    const violations = [];
    
    // Count games in each time slot
    const slotCounts = {};
    let totalGames = 0;
    
    for (const slot of slots) {
      slotCounts[slot.name] = 0;
    }
    
    for (const game of schedule.games) {
      const gameHour = new Date(game.date).getHours();
      
      // Determine which slot this game falls into
      for (const slot of slots) {
        if (gameHour >= slot.start && gameHour <= slot.end) {
          slotCounts[slot.name]++;
          totalGames++;
          break;
        }
      }
    }
    
    // Calculate ratios and check distribution
    let totalScore = 0;
    
    if (totalGames > 0) {
      for (const slot of slots) {
        const actualRatio = slotCounts[slot.name] / totalGames;
        
        // Check if ratio is within tolerance
        if (Math.abs(actualRatio - slot.target) > tolerance) {
          const imbalance = Math.abs(actualRatio - slot.target);
          
          violations.push({
            message: `Time slot ${slot.name} has imbalance: ${Math.round(actualRatio * 100)}% of games vs target ${Math.round(slot.target * 100)}%`,
            severity: imbalance > 2 * tolerance ? 'high' : 'medium'
          });
          
          // Add to score based on severity of imbalance
          totalScore += 3 * imbalance;
        }
      }
    }
    
    return { score: totalScore, violations };
  }
}

module.exports = ConstraintEvaluator;