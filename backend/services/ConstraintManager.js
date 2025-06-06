/**
 * Constraint Manager
 * 
 * Manages scheduling constraints for all sports with the ability to:
 * - Toggle constraints on/off
 * - Add custom constraints
 * - Get sport-specific default constraints
 * - Validate constraint configurations
 */

const logger = require('../lib/logger');

class ConstraintManager {
  constructor() {
    // Default constraints available for all sports
    this.globalConstraints = {
      'max_consecutive_away': {
        id: 'max_consecutive_away',
        name: 'Maximum Consecutive Away Games',
        description: 'Limit the number of consecutive away games for any team',
        type: 'hard',
        category: 'travel',
        enabled: true,
        configurable: true,
        parameters: {
          maxGames: { value: 2, min: 1, max: 5, type: 'number' }
        }
      },
      'max_consecutive_home': {
        id: 'max_consecutive_home',
        name: 'Maximum Consecutive Home Games',
        description: 'Limit the number of consecutive home games for any team',
        type: 'soft',
        category: 'balance',
        enabled: false,
        configurable: true,
        parameters: {
          maxGames: { value: 3, min: 2, max: 6, type: 'number' }
        }
      },
      'home_away_balance': {
        id: 'home_away_balance',
        name: 'Home/Away Balance',
        description: 'Ensure teams have balanced home and away games',
        type: 'soft',
        category: 'fairness',
        enabled: true,
        configurable: true,
        parameters: {
          maxDifference: { value: 1, min: 0, max: 3, type: 'number' }
        }
      },
      'rest_days_between_games': {
        id: 'rest_days_between_games',
        name: 'Minimum Rest Days',
        description: 'Minimum days of rest between games',
        type: 'hard',
        category: 'player_welfare',
        enabled: true,
        configurable: true,
        parameters: {
          minDays: { value: 2, min: 1, max: 7, type: 'number' }
        }
      },
      'venue_availability': {
        id: 'venue_availability',
        name: 'Venue Availability',
        description: 'Respect venue availability and blackout dates',
        type: 'hard',
        category: 'logistics',
        enabled: true,
        configurable: false,
        parameters: {}
      },
      'travel_distance': {
        id: 'travel_distance',
        name: 'Maximum Travel Distance',
        description: 'Limit total travel distance per team',
        type: 'soft',
        category: 'travel',
        enabled: false,
        configurable: true,
        parameters: {
          maxMilesPerSeason: { value: 10000, min: 5000, max: 20000, type: 'number' }
        }
      },
      'rivalry_games': {
        id: 'rivalry_games',
        name: 'Rivalry Game Placement',
        description: 'Schedule rivalry games at optimal times',
        type: 'soft',
        category: 'marketing',
        enabled: false,
        configurable: true,
        parameters: {
          preferredWeeks: { value: [1, 8, 12], type: 'array' }
        }
      },
      'tv_windows': {
        id: 'tv_windows',
        name: 'TV Broadcast Windows',
        description: 'Schedule key games in prime TV slots',
        type: 'soft',
        category: 'revenue',
        enabled: false,
        configurable: true,
        parameters: {
          primeSlots: { value: ['Saturday 3:30pm', 'Saturday 7:00pm'], type: 'array' }
        }
      }
    };

    // Sport-specific constraint configurations
    this.sportSpecificConstraints = {
      'football': {
        defaults: ['max_consecutive_away', 'rest_days_between_games', 'venue_availability', 'rivalry_games'],
        custom: {
          'bye_week_distribution': {
            id: 'bye_week_distribution',
            name: 'Bye Week Distribution',
            description: 'Ensure bye weeks are well distributed',
            type: 'hard',
            category: 'balance',
            enabled: true,
            configurable: true,
            parameters: {
              earliestWeek: { value: 4, min: 3, max: 6, type: 'number' },
              latestWeek: { value: 11, min: 9, max: 12, type: 'number' }
            }
          },
          'championship_week_exclusion': {
            id: 'championship_week_exclusion',
            name: 'Championship Week Exclusion',
            description: 'No regular season games during championship week',
            type: 'hard',
            category: 'compliance',
            enabled: true,
            configurable: false,
            parameters: {}
          }
        }
      },
      'basketball': {
        defaults: ['max_consecutive_away', 'home_away_balance', 'rest_days_between_games', 'tv_windows'],
        custom: {
          'back_to_back_games': {
            id: 'back_to_back_games',
            name: 'Back-to-Back Game Limit',
            description: 'Limit back-to-back games in consecutive days',
            type: 'soft',
            category: 'player_welfare',
            enabled: true,
            configurable: true,
            parameters: {
              maxPerSeason: { value: 4, min: 0, max: 8, type: 'number' }
            }
          },
          'conference_tournament_prep': {
            id: 'conference_tournament_prep',
            name: 'Tournament Preparation',
            description: 'Easier schedule before conference tournament',
            type: 'soft',
            category: 'competitive',
            enabled: false,
            configurable: true,
            parameters: {
              weeksBeforeTournament: { value: 2, min: 1, max: 3, type: 'number' }
            }
          }
        }
      },
      'lacrosse': {
        defaults: ['max_consecutive_away', 'home_away_balance', 'venue_availability'],
        custom: {
          'round_robin_format': {
            id: 'round_robin_format',
            name: 'Single Round-Robin',
            description: 'Each team plays all others exactly once',
            type: 'hard',
            category: 'format',
            enabled: true,
            configurable: false,
            parameters: {}
          },
          'weekly_game_limit': {
            id: 'weekly_game_limit',
            name: 'One Game Per Week',
            description: 'Each team plays exactly one game per week',
            type: 'hard',
            category: 'format',
            enabled: true,
            configurable: false,
            parameters: {}
          },
          'home_away_alternation': {
            id: 'home_away_alternation',
            name: 'Year-to-Year H/A Alternation',
            description: 'Alternate 3H/2A and 2H/3A between years',
            type: 'soft',
            category: 'fairness',
            enabled: true,
            configurable: true,
            parameters: {
              previousYearData: { value: null, type: 'object' }
            }
          }
        }
      },
      'baseball': {
        defaults: ['max_consecutive_away', 'home_away_balance', 'rest_days_between_games'],
        custom: {
          'series_format': {
            id: 'series_format',
            name: 'Weekend Series Format',
            description: 'Games organized in 3-game weekend series',
            type: 'hard',
            category: 'format',
            enabled: true,
            configurable: true,
            parameters: {
              seriesLength: { value: 3, min: 2, max: 4, type: 'number' },
              midweekGames: { value: true, type: 'boolean' }
            }
          },
          'weather_consideration': {
            id: 'weather_consideration',
            name: 'Weather Considerations',
            description: 'Schedule northern teams away early in season',
            type: 'soft',
            category: 'logistics',
            enabled: true,
            configurable: true,
            parameters: {
              coldWeatherTeams: { value: ['iowa-state', 'kansas', 'kansas-state'], type: 'array' }
            }
          }
        }
      }
    };

    // User-defined custom constraints storage
    this.userConstraints = new Map();
  }

  /**
   * Get all constraints for a specific sport
   * @param {string} sport - Sport name or ID
   * @returns {Object} All constraints for the sport
   */
  getConstraintsForSport(sport) {
    const sportKey = sport.toLowerCase().replace(/\s+/g, '_');
    const sportConfig = this.sportSpecificConstraints[sportKey] || { defaults: [], custom: {} };
    
    // Start with global constraints
    const constraints = { ...this.globalConstraints };
    
    // Add sport-specific constraints
    Object.assign(constraints, sportConfig.custom);
    
    // Apply default enablement for this sport
    Object.keys(constraints).forEach(id => {
      if (!sportConfig.defaults.includes(id) && !sportConfig.custom[id]) {
        constraints[id].enabled = false;
      }
    });
    
    // Add user-defined constraints for this sport
    const userConstraintsForSport = this.userConstraints.get(sportKey) || {};
    Object.assign(constraints, userConstraintsForSport);
    
    return constraints;
  }

  /**
   * Toggle a constraint on/off
   * @param {string} sport - Sport name or ID
   * @param {string} constraintId - Constraint ID
   * @param {boolean} enabled - Enable or disable
   */
  toggleConstraint(sport, constraintId, enabled) {
    const sportKey = sport.toLowerCase().replace(/\s+/g, '_');
    const constraints = this.getConstraintsForSport(sport);
    
    if (!constraints[constraintId]) {
      throw new Error(`Constraint ${constraintId} not found for sport ${sport}`);
    }
    
    constraints[constraintId].enabled = enabled;
    
    // Store the change
    this.storeConstraintChange(sportKey, constraintId, { enabled });
    
    logger.info(`Toggled constraint ${constraintId} for ${sport}: ${enabled ? 'ON' : 'OFF'}`);
    
    return constraints[constraintId];
  }

  /**
   * Update constraint parameters
   * @param {string} sport - Sport name or ID
   * @param {string} constraintId - Constraint ID
   * @param {Object} parameters - Updated parameters
   */
  updateConstraintParameters(sport, constraintId, parameters) {
    const sportKey = sport.toLowerCase().replace(/\s+/g, '_');
    const constraints = this.getConstraintsForSport(sport);
    
    if (!constraints[constraintId]) {
      throw new Error(`Constraint ${constraintId} not found for sport ${sport}`);
    }
    
    if (!constraints[constraintId].configurable) {
      throw new Error(`Constraint ${constraintId} is not configurable`);
    }
    
    // Validate parameters
    Object.entries(parameters).forEach(([key, value]) => {
      const paramConfig = constraints[constraintId].parameters[key];
      if (!paramConfig) {
        throw new Error(`Invalid parameter ${key} for constraint ${constraintId}`);
      }
      
      // Type validation
      if (paramConfig.type === 'number') {
        if (typeof value !== 'number') {
          throw new Error(`Parameter ${key} must be a number`);
        }
        if (paramConfig.min !== undefined && value < paramConfig.min) {
          throw new Error(`Parameter ${key} must be at least ${paramConfig.min}`);
        }
        if (paramConfig.max !== undefined && value > paramConfig.max) {
          throw new Error(`Parameter ${key} must be at most ${paramConfig.max}`);
        }
      }
    });
    
    // Update parameters
    Object.entries(parameters).forEach(([key, value]) => {
      constraints[constraintId].parameters[key].value = value;
    });
    
    // Store the change
    this.storeConstraintChange(sportKey, constraintId, { parameters });
    
    logger.info(`Updated parameters for constraint ${constraintId} in ${sport}:`, parameters);
    
    return constraints[constraintId];
  }

  /**
   * Add a custom constraint
   * @param {string} sport - Sport name or ID
   * @param {Object} constraint - Custom constraint definition
   */
  addCustomConstraint(sport, constraint) {
    const sportKey = sport.toLowerCase().replace(/\s+/g, '_');
    
    // Validate constraint structure
    if (!constraint.id || !constraint.name || !constraint.type) {
      throw new Error('Custom constraint must have id, name, and type');
    }
    
    if (!['hard', 'soft'].includes(constraint.type)) {
      throw new Error('Constraint type must be "hard" or "soft"');
    }
    
    // Set defaults
    constraint.category = constraint.category || 'custom';
    constraint.enabled = constraint.enabled !== false;
    constraint.configurable = constraint.configurable !== false;
    constraint.parameters = constraint.parameters || {};
    constraint.custom = true;
    
    // Add validation function if provided
    if (constraint.validate && typeof constraint.validate === 'function') {
      constraint.validateFunction = constraint.validate;
    }
    
    // Store in user constraints
    if (!this.userConstraints.has(sportKey)) {
      this.userConstraints.set(sportKey, {});
    }
    
    this.userConstraints.get(sportKey)[constraint.id] = constraint;
    
    logger.info(`Added custom constraint ${constraint.id} for ${sport}`);
    
    return constraint;
  }

  /**
   * Remove a custom constraint
   * @param {string} sport - Sport name or ID
   * @param {string} constraintId - Constraint ID to remove
   */
  removeCustomConstraint(sport, constraintId) {
    const sportKey = sport.toLowerCase().replace(/\s+/g, '_');
    const userConstraintsForSport = this.userConstraints.get(sportKey);
    
    if (!userConstraintsForSport || !userConstraintsForSport[constraintId]) {
      throw new Error(`Custom constraint ${constraintId} not found for sport ${sport}`);
    }
    
    delete userConstraintsForSport[constraintId];
    
    logger.info(`Removed custom constraint ${constraintId} for ${sport}`);
    
    return true;
  }

  /**
   * Get enabled constraints for scheduling
   * @param {string} sport - Sport name or ID
   * @returns {Array} Array of enabled constraints
   */
  getEnabledConstraints(sport) {
    const constraints = this.getConstraintsForSport(sport);
    
    return Object.values(constraints)
      .filter(c => c.enabled)
      .map(c => ({
        ...c,
        evaluate: this.createEvaluationFunction(c)
      }));
  }

  /**
   * Create evaluation function for a constraint
   * @private
   */
  createEvaluationFunction(constraint) {
    // If custom validation function exists, use it
    if (constraint.validateFunction) {
      return constraint.validateFunction;
    }
    
    // Otherwise, return a function based on constraint ID
    switch (constraint.id) {
      case 'max_consecutive_away':
        return (schedule) => this.evaluateMaxConsecutiveAway(schedule, constraint.parameters.maxGames.value);
      
      case 'max_consecutive_home':
        return (schedule) => this.evaluateMaxConsecutiveHome(schedule, constraint.parameters.maxGames.value);
      
      case 'home_away_balance':
        return (schedule) => this.evaluateHomeAwayBalance(schedule, constraint.parameters.maxDifference.value);
      
      case 'rest_days_between_games':
        return (schedule) => this.evaluateRestDays(schedule, constraint.parameters.minDays.value);
      
      default:
        return () => ({ satisfied: true, violations: [] });
    }
  }

  /**
   * Evaluation functions for common constraints
   * @private
   */
  evaluateMaxConsecutiveAway(schedule, maxGames) {
    const violations = [];
    const teams = this.extractTeams(schedule);
    
    teams.forEach(team => {
      const teamGames = schedule.games.filter(g => g.home_team === team || g.away_team === team);
      let consecutiveAway = 0;
      
      teamGames.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      teamGames.forEach((game, index) => {
        if (game.away_team === team) {
          consecutiveAway++;
          if (consecutiveAway > maxGames) {
            violations.push({
              team: team,
              games: teamGames.slice(index - consecutiveAway + 1, index + 1),
              message: `${team} has ${consecutiveAway} consecutive away games (max: ${maxGames})`
            });
          }
        } else {
          consecutiveAway = 0;
        }
      });
    });
    
    return {
      satisfied: violations.length === 0,
      violations: violations
    };
  }

  evaluateMaxConsecutiveHome(schedule, maxGames) {
    const violations = [];
    const teams = this.extractTeams(schedule);
    
    teams.forEach(team => {
      const teamGames = schedule.games.filter(g => g.home_team === team || g.away_team === team);
      let consecutiveHome = 0;
      
      teamGames.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      teamGames.forEach((game, index) => {
        if (game.home_team === team) {
          consecutiveHome++;
          if (consecutiveHome > maxGames) {
            violations.push({
              team: team,
              games: teamGames.slice(index - consecutiveHome + 1, index + 1),
              message: `${team} has ${consecutiveHome} consecutive home games (max: ${maxGames})`
            });
          }
        } else {
          consecutiveHome = 0;
        }
      });
    });
    
    return {
      satisfied: violations.length === 0,
      violations: violations
    };
  }

  evaluateHomeAwayBalance(schedule, maxDifference) {
    const violations = [];
    const teams = this.extractTeams(schedule);
    
    teams.forEach(team => {
      const homeGames = schedule.games.filter(g => g.home_team === team).length;
      const awayGames = schedule.games.filter(g => g.away_team === team).length;
      const difference = Math.abs(homeGames - awayGames);
      
      if (difference > maxDifference) {
        violations.push({
          team: team,
          homeGames: homeGames,
          awayGames: awayGames,
          message: `${team} has imbalanced schedule: ${homeGames}H/${awayGames}A (max difference: ${maxDifference})`
        });
      }
    });
    
    return {
      satisfied: violations.length === 0,
      violations: violations
    };
  }

  evaluateRestDays(schedule, minDays) {
    const violations = [];
    const teams = this.extractTeams(schedule);
    
    teams.forEach(team => {
      const teamGames = schedule.games
        .filter(g => g.home_team === team || g.away_team === team)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      for (let i = 1; i < teamGames.length; i++) {
        const prevDate = new Date(teamGames[i - 1].date);
        const currDate = new Date(teamGames[i].date);
        const daysBetween = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (daysBetween < minDays) {
          violations.push({
            team: team,
            games: [teamGames[i - 1], teamGames[i]],
            daysBetween: daysBetween,
            message: `${team} has only ${daysBetween} days rest between games (min: ${minDays})`
          });
        }
      }
    });
    
    return {
      satisfied: violations.length === 0,
      violations: violations
    };
  }

  /**
   * Extract unique teams from schedule
   * @private
   */
  extractTeams(schedule) {
    const teams = new Set();
    schedule.games.forEach(game => {
      teams.add(game.home_team);
      teams.add(game.away_team);
    });
    return Array.from(teams);
  }

  /**
   * Store constraint changes (could be persisted to database)
   * @private
   */
  storeConstraintChange(sport, constraintId, changes) {
    // In a real implementation, this would persist to database
    // For now, changes are stored in memory
    logger.debug(`Stored constraint change for ${sport}/${constraintId}:`, changes);
  }

  /**
   * Export constraint configuration for a sport
   * @param {string} sport - Sport name or ID
   * @returns {Object} Exportable constraint configuration
   */
  exportConstraints(sport) {
    const constraints = this.getConstraintsForSport(sport);
    const enabledOnly = Object.values(constraints).filter(c => c.enabled);
    
    return {
      sport: sport,
      version: '1.0',
      exportDate: new Date().toISOString(),
      constraints: enabledOnly.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        category: c.category,
        parameters: c.parameters,
        custom: c.custom || false
      }))
    };
  }

  /**
   * Import constraint configuration
   * @param {Object} config - Imported configuration
   */
  importConstraints(config) {
    const { sport, constraints } = config;
    
    constraints.forEach(constraint => {
      if (constraint.custom) {
        this.addCustomConstraint(sport, constraint);
      } else {
        // Update existing constraint
        this.toggleConstraint(sport, constraint.id, true);
        if (constraint.parameters) {
          const paramValues = {};
          Object.entries(constraint.parameters).forEach(([key, param]) => {
            paramValues[key] = param.value;
          });
          this.updateConstraintParameters(sport, constraint.id, paramValues);
        }
      }
    });
    
    logger.info(`Imported ${constraints.length} constraints for ${sport}`);
  }
}

module.exports = ConstraintManager;