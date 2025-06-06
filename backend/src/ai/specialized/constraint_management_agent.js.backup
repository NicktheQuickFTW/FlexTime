/**
 * Enhanced Constraint Management Agent v3.0 for FlexTime multi-agent system.
 * 
 * Advanced constraint management with:
 * - Integration with Constraint Management System v3.0
 * - Real-time constraint validation and conflict resolution
 * - Dynamic weight optimization and learning
 * - Big 12 Conference specific optimizations
 */

const Agent = require('../agent');
const logger = require("../utils/logger");
const { ConstraintManagementSystem } = require('../constraint-management-system');
const ConstraintResolver = require('../constraint-resolver');
const { 
  mensBasketballConstraints, 
  womensBasketballConstraints,
  basketballSeasonDates 
} = require('./basketball_scheduling_constraints');
const {
  baseballConstraints,
  softballConstraints,
  baseballSoftballSeasonDates,
  specialDates: baseballSoftballSpecialDates
} = require('./baseball_softball_constraints');
const {
  mensTennisConstraints,
  womensTennisConstraints,
  tennisSeasonDates,
  specialDates: tennisSpecialDates
} = require('./tennis_constraints');
const {
  footballConstraints,
  footballSeasonDates,
  specialDates: footballSpecialDates,
  mediaRights: footballMediaRights
} = require('./football_constraints');
const {
  soccerConstraints,
  volleyballConstraints,
  soccerSeasonDates,
  volleyballSeasonDates,
  specialDates: soccerVolleyballSpecialDates
} = require('./soccer_volleyball_constraints');
const {
  gymnasticsConstraints,
  gymnasticsSeasonDates,
  specialDates: gymnasticsSpecialDates
} = require('./gymnastics_constraints');
const {
  teamSpecificConstraints,
  evaluateBYUSundayConstraint
} = require('./global_constraints');
const venueConstraints = require('./venue_sharing_constraints');

/**
 * Specialized agent for managing scheduling constraints.
 */
class ConstraintManagementAgent extends Agent {
  /**
   * Initialize a new Enhanced Constraint Management Agent v3.0.
   * 
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(mcpConnector) {
    super('constraint_management', 'specialized', mcpConnector);
    
    // Initialize enhanced constraint management system
    this.constraintManagementSystem = new ConstraintManagementSystem({
      enableDynamicWeighting: true,
      enableConflictResolution: true,
      enableLearning: true,
      enableBig12Optimizations: true,
      enablePerformanceMonitoring: true
    });
    
    // Initialize constraint resolver
    this.constraintResolver = new ConstraintResolver();
    
    // Performance tracking
    this.performanceMetrics = {
      constraintsProcessed: 0,
      conflictsResolved: 0,
      optimizationsPerformed: 0,
      averageProcessingTime: 0
    };
    
    // Constraint types catalog (legacy support)
    this.constraintTypes = {
      // Hard constraints (must be satisfied)
      hard: {
        'venue_availability': {
          description: 'Teams can only play at venues when they are available',
          evaluator: this._evaluateVenueAvailability.bind(this)
        },
        'team_availability': {
          description: 'Teams cannot play when they are unavailable',
          evaluator: this._evaluateTeamAvailability.bind(this)
        },
        'game_count': {
          description: 'Each team must play the required number of games',
          evaluator: this._evaluateGameCount.bind(this)
        },
        'opponent_requirements': {
          description: 'Teams must play required opponents the specified number of times',
          evaluator: this._evaluateOpponentRequirements.bind(this)
        },
        'first_four_balance': {
          description: 'Among the first four games, at least two will be at home and two on the road',
          evaluator: this._evaluateFirstFourBalance.bind(this)
        },
        'last_four_balance': {
          description: 'Among the last four games, at least two will be at home and two on the road',
          evaluator: this._evaluateLastFourBalance.bind(this)
        },
        'max_consecutive_road': {
          description: 'No team will play more than the maximum consecutive road games',
          evaluator: this._evaluateMaxConsecutiveRoad.bind(this)
        },
        'rematch_separation': {
          description: 'Ensure adequate separation between rematches',
          evaluator: this._evaluateRematchSeparation.bind(this)
        },
        'series_integrity': {
          description: 'All games in a series must be played at the same venue',
          evaluator: this._evaluateSeriesIntegrity.bind(this)
        },
        'home_series_limit': {
          description: 'No team will have more than the maximum number of home series',
          evaluator: this._evaluateHomeSeriesLimit.bind(this)
        },
        'special_date_handling': {
          description: 'Series involving BYU must be scheduled Thursday-Saturday',
          evaluator: this._evaluateSpecialDateHandling.bind(this)
        },
        'round_robin': {
          description: 'Each team plays every other team exactly once',
          evaluator: this._evaluateRoundRobin.bind(this)
        },
        'bye_week': {
          description: 'Each team has exactly one bye week',
          evaluator: this._evaluateBuyeWeek.bind(this)
        },
        'play_all_opponents': {
          description: 'Each team plays all other teams at least once',
          evaluator: this._evaluatePlayAllOpponents.bind(this)
        },
        'no_byes': {
          description: 'No team has a bye week',
          evaluator: this._evaluateNoByes.bind(this)
        },
        'byu_no_sunday_play': {
          description: 'BYU cannot play on Sunday for any sport',
          evaluator: this._evaluateBYUSundayConstraint.bind(this)
        },
        'venue_sharing_conflicts': {
          description: 'Sports sharing the same venue cannot be scheduled on the same day at the same time',
          evaluator: this._evaluateVenueSharingConstraint.bind(this)
        }
      },
      
      // Soft constraints (should be satisfied when possible)
      soft: {
        'travel_distance': {
          description: 'Minimize total travel distance for all teams',
          evaluator: this._evaluateTravelDistance.bind(this),
          weight: 0.7
        },
        'consecutive_home_away': {
          description: 'Avoid long stretches of consecutive home or away games',
          evaluator: this._evaluateConsecutiveHomeAway.bind(this),
          weight: 0.5
        },
        'rest_days': {
          description: 'Ensure adequate rest days between games',
          evaluator: this._evaluateRestDays.bind(this),
          weight: 0.6
        },
        'balanced_schedule': {
          description: 'Balance home and away games throughout the season',
          evaluator: this._evaluateBalancedSchedule.bind(this),
          weight: 0.4
        },
        'rivalry_games': {
          description: 'Schedule rivalry games at preferred times',
          evaluator: this._evaluateRivalryGames.bind(this),
          weight: 0.3
        },
        'broadcast_preferences': {
          description: 'Accommodate broadcast preferences for key games',
          evaluator: this._evaluateBroadcastPreferences.bind(this),
          weight: 0.4
        },
        'weekend_home_games': {
          description: 'Each institution should have a similar number of weekend home games',
          evaluator: this._evaluateWeekendHomeGames.bind(this),
          weight: 0.7
        },
        'avoid_road_clusters': {
          description: 'Avoid clusters of road games in the schedule',
          evaluator: this._evaluateAvoidRoadClusters.bind(this),
          weight: 0.6
        },
        'minimize_same_day_games': {
          description: 'Minimize men\'s and women\'s games scheduled at home on the same day',
          evaluator: this._evaluateMinimizeSameDayGames.bind(this),
          weight: 0.5
        },
        'weather_considerations': {
          description: 'Avoid scheduling games during periods of bad weather',
          evaluator: this._evaluateWeatherConsiderations.bind(this),
          weight: 0.6
        },
        'exam_period_avoidance': {
          description: 'Avoid scheduling games during exam periods',
          evaluator: this._evaluateExamPeriodAvoidance.bind(this),
          weight: 0.8
        },
        'facility_availability': {
          description: 'Ensure facilities are available for games',
          evaluator: this._evaluateFacilityAvailability.bind(this),
          weight: 0.5
        },
        'even_distribution': {
          description: 'Distribute games evenly throughout the season',
          evaluator: this._evaluateEvenDistribution.bind(this),
          weight: 0.6
        },
        'venue_priority_hierarchy': {
          description: 'Respect the priority hierarchy when scheduling sports that share venues',
          weight: 0.9,
          evaluator: this._evaluateVenuePriorityConstraint.bind(this)
        }
      }
    };
    
    // Sport-specific constraint configurations
    this.sportConfigurations = {
      'football': {
        hardConstraints: ['venue_availability', 'team_availability', 'game_count', 'opponent_requirements'],
        softConstraints: ['travel_distance', 'consecutive_home_away', 'rest_days', 'rivalry_games'],
        weights: {
          'travel_distance': 0.8,
          'consecutive_home_away': 0.7,
          'rest_days': 0.9,
          'rivalry_games': 0.6
        }
      },
      'basketball': {
        hardConstraints: ['venue_availability', 'team_availability', 'game_count', 'opponent_requirements'],
        softConstraints: ['travel_distance', 'consecutive_home_away', 'rest_days', 'balanced_schedule', 'broadcast_preferences'],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.8,
          'balanced_schedule': 0.5,
          'broadcast_preferences': 0.6
        }
      },
      'mens_basketball': {
        hardConstraints: [
          'venue_availability', 
          'team_availability', 
          'game_count', 
          'opponent_requirements',
          'first_four_balance',
          'last_four_balance',
          'max_consecutive_road',
          'rematch_separation'
        ],
        softConstraints: [
          'travel_distance', 
          'consecutive_home_away', 
          'rest_days', 
          'balanced_schedule', 
          'broadcast_preferences',
          'weekend_home_games',
          'avoid_road_clusters'
        ],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.8,
          'balanced_schedule': 0.5,
          'broadcast_preferences': 0.7,
          'weekend_home_games': 0.8,
          'avoid_road_clusters': 0.7
        },
        specificConstraints: mensBasketballConstraints
      },
      'womens_basketball': {
        hardConstraints: [
          'venue_availability', 
          'team_availability', 
          'game_count', 
          'opponent_requirements',
          'first_four_balance',
          'last_four_balance',
          'max_consecutive_road',
          'rematch_separation'
        ],
        softConstraints: [
          'travel_distance', 
          'consecutive_home_away', 
          'rest_days', 
          'balanced_schedule', 
          'broadcast_preferences',
          'weekend_home_games',
          'avoid_road_clusters',
          'minimize_same_day_games'
        ],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.8,
          'balanced_schedule': 0.5,
          'broadcast_preferences': 0.6,
          'weekend_home_games': 0.8,
          'avoid_road_clusters': 0.7,
          'minimize_same_day_games': 0.6
        },
        specificConstraints: womensBasketballConstraints
      },
      'baseball': {
        hardConstraints: [
          'venue_availability', 
          'team_availability', 
          'game_count', 
          'opponent_requirements',
          'series_integrity',
          'home_series_limit'
        ],
        softConstraints: [
          'travel_distance', 
          'consecutive_home_away', 
          'rest_days', 
          'balanced_schedule',
          'weather_considerations',
          'exam_period_avoidance'
        ],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.7,
          'balanced_schedule': 0.6,
          'weather_considerations': 0.6,
          'exam_period_avoidance': 0.8
        },
        specificConstraints: baseballConstraints
      },
      'softball': {
        hardConstraints: [
          'venue_availability', 
          'team_availability', 
          'game_count', 
          'opponent_requirements',
          'series_integrity',
          'special_date_handling'
        ],
        softConstraints: [
          'travel_distance', 
          'consecutive_home_away', 
          'rest_days', 
          'balanced_schedule',
          'weather_considerations',
          'exam_period_avoidance'
        ],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.7,
          'balanced_schedule': 0.6,
          'weather_considerations': 0.6,
          'exam_period_avoidance': 0.8
        },
        specificConstraints: softballConstraints
      },
      'mens_tennis': {
        hardConstraints: [
          'venue_availability', 
          'team_availability', 
          'game_count', 
          'opponent_requirements',
          'round_robin',
          'bye_week'
        ],
        softConstraints: [
          'travel_distance', 
          'consecutive_home_away', 
          'rest_days', 
          'balanced_schedule',
          'facility_availability',
          'exam_period_avoidance'
        ],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.7,
          'balanced_schedule': 0.6,
          'facility_availability': 0.5,
          'exam_period_avoidance': 0.8
        },
        specificConstraints: mensTennisConstraints
      },
      'womens_tennis': {
        hardConstraints: [
          'venue_availability', 
          'team_availability', 
          'game_count', 
          'opponent_requirements',
          'play_all_opponents',
          'no_byes'
        ],
        softConstraints: [
          'travel_distance', 
          'consecutive_home_away', 
          'rest_days', 
          'balanced_schedule',
          'facility_availability',
          'exam_period_avoidance',
          'even_distribution'
        ],
        weights: {
          'travel_distance': 0.7,
          'consecutive_home_away': 0.6,
          'rest_days': 0.7,
          'balanced_schedule': 0.6,
          'facility_availability': 0.5,
          'exam_period_avoidance': 0.8,
          'even_distribution': 0.6
        },
        specificConstraints: womensTennisConstraints
      },
      // Additional sport configurations would be defined here
    };
    
    // Store basketball season dates
    this.basketballSeasonDates = basketballSeasonDates;
    
    // Store baseball and softball season dates
    this.baseballSoftballSeasonDates = baseballSoftballSeasonDates;
    
    // Store tennis season dates
    this.tennisSeasonDates = tennisSeasonDates;
    
    // Store special dates for scheduling considerations
    this.specialDates = {
      ...baseballSoftballSpecialDates,
      ...tennisSpecialDates
    };
    
    logger.info('Constraint Management Agent initialized with basketball, baseball, softball, and tennis scheduling parameters');
  }
  
  /**
   * Process a task to analyze or evaluate constraints using enhanced v3.0 system.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<object>} Constraint analysis or evaluation results
   * @private
   */
  async _processTask(task) {
    const startTime = Date.now();
    logger.info(`Enhanced Constraint Management Agent v3.0 processing task: ${task.description}`);
    
    const taskType = task.taskType;
    const sportType = task.parameters.sportType;
    const schedule = task.parameters.schedule;
    const customConstraints = task.parameters.constraints || {};
    
    // Track performance
    this.performanceMetrics.constraintsProcessed++;
    
    try {
      // Enhanced task processing with new constraint management system
      let result;
      
      switch (taskType) {
        case 'process_constraints':
          result = await this._processConstraintsEnhanced(sportType, customConstraints, task.parameters);
          break;
          
        case 'evaluate_constraints':
          result = await this._evaluateConstraintsEnhanced(sportType, schedule, customConstraints);
          break;
          
        case 'resolve_conflicts':
          result = await this._resolveConstraintConflicts(customConstraints, task.parameters);
          break;
          
        case 'optimize_weights':
          result = await this._optimizeConstraintWeights(sportType, task.parameters);
          break;
          
        case 'validate_modification':
          result = await this._validateScheduleModification(task.parameters);
          break;
          
        case 'analyze_constraints':
        default:
          // Fallback to enhanced analysis or legacy method
          result = await this._analyzeConstraintsEnhanced(sportType, customConstraints, task.parameters);
          break;
      }
      
      // Update performance metrics
      const elapsedTime = Date.now() - startTime;
      this.performanceMetrics.averageProcessingTime = 
        (this.performanceMetrics.averageProcessingTime + elapsedTime) / 2;
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          processingTime: elapsedTime,
          version: '3.0',
          agent: 'Enhanced_Constraint_Management_Agent'
        }
      };
      
    } catch (error) {
      logger.error(`Enhanced constraint processing failed: ${error.message}`);
      
      // Fallback to legacy processing
      logger.info('Falling back to legacy constraint processing');
      return this._processTaskLegacy(task);
    }
  }
  
  /**
   * Enhanced constraint processing using new system
   * @param {string} sportType - Type of sport
   * @param {object} customConstraints - Custom constraints
   * @param {object} parameters - Additional parameters
   * @returns {Promise<object>} Processing results
   * @private
   */
  async _processConstraintsEnhanced(sportType, customConstraints, parameters) {
    const context = {
      sport: sportType,
      teams: parameters.teams || [],
      teamCount: parameters.teams?.length || 16,
      seasonType: parameters.seasonType || 'regular',
      conference: parameters.conference || 'Big 12'
    };
    
    // Convert custom constraints to enhanced format
    const enhancedConstraints = this._convertToEnhancedFormat(customConstraints);
    
    // Process through enhanced system
    const processedResult = this.constraintManagementSystem.processConstraints(
      enhancedConstraints, 
      context
    );
    
    return {
      success: true,
      sport: sportType,
      processedConstraints: processedResult.constraints,
      weights: processedResult.weights,
      conflicts: processedResult.conflicts,
      metadata: processedResult.metadata,
      recommendations: this._generateRecommendations(processedResult, context)
    };
  }
  
  /**
   * Enhanced constraint evaluation using new system
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to evaluate
   * @param {object} customConstraints - Custom constraints
   * @returns {Promise<object>} Evaluation results
   * @private
   */
  async _evaluateConstraintsEnhanced(sportType, schedule, customConstraints) {
    if (!schedule) {
      throw new Error('Schedule is required for constraint evaluation');
    }
    
    const context = {
      sport: sportType,
      scheduleId: schedule.id,
      evaluationType: 'comprehensive'
    };
    
    // Convert and process constraints
    const enhancedConstraints = this._convertToEnhancedFormat(customConstraints);
    const processedResult = this.constraintManagementSystem.processConstraints(
      enhancedConstraints, 
      context
    );
    
    // Evaluate against schedule
    const evaluationResult = this.constraintManagementSystem.evaluateConstraints(
      processedResult.constraints,
      schedule,
      context
    );
    
    return {
      success: true,
      sport: sportType,
      scheduleId: schedule.id,
      feasible: evaluationResult.violations.length === 0,
      overallScore: evaluationResult.totalScore,
      violations: evaluationResult.violations,
      satisfiedConstraints: evaluationResult.satisfiedConstraints,
      partiallyMet: evaluationResult.partiallyMet,
      constraintScores: evaluationResult.constraintScores,
      compliance: evaluationResult.overallCompliance,
      recommendations: this._generateViolationRecommendations(evaluationResult),
      metadata: {
        ...evaluationResult.metadata,
        enhancedEvaluation: true
      }
    };
  }
  
  /**
   * Resolve constraint conflicts using enhanced resolution system
   * @param {object} constraints - Constraints with conflicts
   * @param {object} parameters - Resolution parameters
   * @returns {Promise<object>} Resolution results
   * @private
   */
  async _resolveConstraintConflicts(constraints, parameters) {
    const enhancedConstraints = this._convertToEnhancedFormat(constraints);
    
    // Detect conflicts
    const conflicts = this.constraintResolver.detectConflicts(enhancedConstraints);
    
    if (conflicts.length === 0) {
      return {
        success: true,
        message: 'No conflicts detected',
        constraints: enhancedConstraints,
        conflictsResolved: 0
      };
    }
    
    // Resolve conflicts
    const resolutionResult = this.constraintResolver.resolveConflicts(
      conflicts,
      enhancedConstraints,
      parameters
    );
    
    this.performanceMetrics.conflictsResolved += resolutionResult.resolutions.length;
    
    return {
      success: resolutionResult.success,
      originalConflicts: conflicts.length,
      conflictsResolved: resolutionResult.resolutions.length,
      unresolvedConflicts: resolutionResult.unresolved,
      resolvedConstraints: resolutionResult.constraints,
      resolutionStrategies: resolutionResult.resolutions,
      recommendations: this._generateConflictRecommendations(conflicts, resolutionResult)
    };
  }
  
  /**
   * Optimize constraint weights for better performance
   * @param {string} sportType - Type of sport
   * @param {object} parameters - Optimization parameters
   * @returns {Promise<object>} Optimization results
   * @private
   */
  async _optimizeConstraintWeights(sportType, parameters) {
    const optimizedWeights = this.constraintManagementSystem.getOptimizedWeights(
      sportType,
      parameters
    );
    
    this.performanceMetrics.optimizationsPerformed++;
    
    return {
      success: true,
      sport: sportType,
      optimizedWeights,
      improvements: this._calculateWeightImprovements(optimizedWeights, parameters.currentWeights),
      recommendations: this._generateWeightRecommendations(optimizedWeights, sportType)
    };
  }
  
  /**
   * Validate schedule modification in real-time
   * @param {object} parameters - Modification parameters
   * @returns {Promise<object>} Validation results
   * @private
   */
  async _validateScheduleModification(parameters) {
    const { modification, constraints, currentSchedule } = parameters;
    
    if (!modification || !constraints || !currentSchedule) {
      throw new Error('Missing required parameters for modification validation');
    }
    
    const enhancedConstraints = this._convertToEnhancedFormat(constraints);
    
    const validationResult = this.constraintManagementSystem.validateModification(
      modification,
      enhancedConstraints,
      currentSchedule
    );
    
    return {
      success: true,
      valid: validationResult.valid,
      violations: validationResult.violations,
      warnings: validationResult.warnings,
      suggestions: validationResult.suggestions,
      metadata: {
        modificationType: modification.type,
        validationTime: Date.now(),
        realTimeValidation: true
      }
    };
  }
  
  /**
   * Legacy task processing (fallback)
   * @param {object} task - The task to process
   * @returns {Promise<object>} Legacy processing results
   * @private
   */
  async _processTaskLegacy(task) {
    const taskType = task.taskType;
    const sportType = task.parameters.sportType;
    const schedule = task.parameters.schedule;
    const customConstraints = task.parameters.constraints || {};
    
    // Use MCP for constraint analysis if available
    if (taskType === 'analyze_constraints' && this.mcpConnector) {
      try {
        const constraintAnalysis = await this._getAIConstraintAnalysis(sportType, customConstraints);
        return constraintAnalysis;
      } catch (error) {
        logger.warning(`Failed to get AI constraint analysis: ${error.message}`);
        // Fall back to rule-based analysis
      }
    }
    
    // Evaluate constraints for a given schedule
    if (taskType === 'evaluate_constraints' && schedule) {
      return this._evaluateScheduleConstraints(sportType, schedule, customConstraints);
    }
    
    // Generate constraint configuration for a sport
    return this._generateConstraintConfiguration(sportType, customConstraints);
  }
  
  /**
   * Generate constraint configuration for a sport.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} customConstraints - Custom constraint specifications
   * @returns {object} Constraint configuration
   * @private
   */
  _generateConstraintConfiguration(sportType, customConstraints) {
    // Get base configuration for the sport
    const baseConfig = this.sportConfigurations[sportType.toLowerCase()] || {
      hardConstraints: ['venue_availability', 'team_availability', 'game_count'],
      softConstraints: ['travel_distance', 'consecutive_home_away', 'rest_days'],
      weights: {
        'travel_distance': 0.7,
        'consecutive_home_away': 0.5,
        'rest_days': 0.6
      }
    };
    
    // Merge with custom constraints
    const mergedConfig = {
      hardConstraints: [...baseConfig.hardConstraints],
      softConstraints: [...baseConfig.softConstraints],
      weights: { ...baseConfig.weights }
    };
    
    // Add custom hard constraints
    if (customConstraints.hard) {
      customConstraints.hard.forEach(constraint => {
        if (!mergedConfig.hardConstraints.includes(constraint)) {
          mergedConfig.hardConstraints.push(constraint);
        }
      });
    }
    
    // Add custom soft constraints and weights
    if (customConstraints.soft) {
      Object.entries(customConstraints.soft).forEach(([constraint, weight]) => {
        if (!mergedConfig.softConstraints.includes(constraint)) {
          mergedConfig.softConstraints.push(constraint);
        }
        mergedConfig.weights[constraint] = weight;
      });
    }
    
    // Build full constraint configuration
    const constraintConfig = {
      sport: sportType,
      hardConstraints: mergedConfig.hardConstraints.map(name => ({
        name,
        description: this.constraintTypes.hard[name]?.description || 'Custom constraint'
      })),
      softConstraints: mergedConfig.softConstraints.map(name => ({
        name,
        description: this.constraintTypes.soft[name]?.description || 'Custom constraint',
        weight: mergedConfig.weights[name] || 0.5
      })),
      evaluationStrategy: this._determineEvaluationStrategy(sportType, mergedConfig)
    };
    
    return constraintConfig;
  }
  
  /**
   * Determine the best evaluation strategy based on sport and constraints.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} config - Constraint configuration
   * @returns {string} Evaluation strategy name
   * @private
   */
  _determineEvaluationStrategy(sportType, config) {
    const constraintCount = config.hardConstraints.length + config.softConstraints.length;
    
    if (constraintCount > 8) {
      return 'weighted_sum_with_penalties';
    } else if (config.hardConstraints.length > config.softConstraints.length) {
      return 'hard_constraint_priority';
    } else {
      return 'balanced_evaluation';
    }
  }
  
  /**
   * Evaluate constraints for a given schedule.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to evaluate
   * @param {object} customConstraints - Custom constraint specifications
   * @returns {object} Constraint evaluation results
   * @private
   */
  _evaluateScheduleConstraints(sportType, schedule, customConstraints) {
    // Get constraint configuration
    const config = this._generateConstraintConfiguration(sportType, customConstraints);
    
    // Evaluate hard constraints
    const hardConstraintResults = config.hardConstraints.map(constraint => {
      const evaluator = this.constraintTypes.hard[constraint.name]?.evaluator;
      
      if (!evaluator) {
        return {
          name: constraint.name,
          satisfied: true,
          message: 'No evaluator available for this constraint'
        };
      }
      
      try {
        const result = evaluator(schedule, sportType);
        return {
          name: constraint.name,
          satisfied: result.satisfied,
          violations: result.violations || [],
          message: result.message
        };
      } catch (error) {
        logger.error(`Error evaluating constraint ${constraint.name}: ${error.message}`);
        return {
          name: constraint.name,
          satisfied: false,
          message: `Evaluation error: ${error.message}`
        };
      }
    });
    
    // Evaluate soft constraints
    const softConstraintResults = config.softConstraints.map(constraint => {
      const evaluator = this.constraintTypes.soft[constraint.name]?.evaluator;
      
      if (!evaluator) {
        return {
          name: constraint.name,
          score: 1.0,
          message: 'No evaluator available for this constraint'
        };
      }
      
      try {
        const result = evaluator(schedule, sportType);
        return {
          name: constraint.name,
          score: result.score,
          details: result.details || {},
          message: result.message,
          weight: constraint.weight
        };
      } catch (error) {
        logger.error(`Error evaluating constraint ${constraint.name}: ${error.message}`);
        return {
          name: constraint.name,
          score: 0,
          message: `Evaluation error: ${error.message}`,
          weight: constraint.weight
        };
      }
    });
    
    // Calculate overall score
    const hardConstraintsSatisfied = hardConstraintResults.every(result => result.satisfied);
    
    let softConstraintScore = 0;
    let totalWeight = 0;
    
    softConstraintResults.forEach(result => {
      softConstraintScore += result.score * result.weight;
      totalWeight += result.weight;
    });
    
    const normalizedSoftScore = totalWeight > 0 ? softConstraintScore / totalWeight : 1;
    
    return {
      sport: sportType,
      feasible: hardConstraintsSatisfied,
      hardConstraints: hardConstraintResults,
      softConstraints: softConstraintResults,
      overallScore: hardConstraintsSatisfied ? normalizedSoftScore : 0,
      message: hardConstraintsSatisfied 
        ? `Schedule is feasible with soft constraint score of ${(normalizedSoftScore * 100).toFixed(2)}%`
        : 'Schedule is infeasible due to hard constraint violations'
    };
  }
  
  /**
   * Get AI-enhanced constraint analysis using MCP.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} customConstraints - Custom constraint specifications
   * @returns {Promise<object>} AI-enhanced constraint analysis
   * @private
   */
  async _getAIConstraintAnalysis(sportType, customConstraints) {
    // Prepare context for the AI model
    const context = {
      sportType,
      customConstraints,
      constraintTypes: this.constraintTypes,
      sportConfigurations: this.sportConfigurations
    };
    
    // Prepare prompt for the AI model
    const prompt = `
      As an expert in sports scheduling constraints, analyze the following scenario:
      
      Sport: ${sportType}
      Custom Constraints: ${JSON.stringify(customConstraints)}
      
      Based on this information and your knowledge of sports scheduling:
      1. Identify any potential conflicts between constraints
      2. Suggest additional constraints that might be beneficial
      3. Recommend appropriate weights for soft constraints
      4. Provide insights on the feasibility of satisfying all constraints
      
      Return your response in JSON format with the following structure:
      {
        "constraintAnalysis": {
          "conflicts": [
            { "constraint1": "name", "constraint2": "name", "explanation": "why they conflict" }
          ],
          "suggestedConstraints": [
            { "name": "constraint_name", "type": "hard|soft", "description": "description", "rationale": "why it's needed" }
          ],
          "weightRecommendations": {
            "constraint_name": { "recommendedWeight": 0.7, "explanation": "why this weight" }
          },
          "feasibilityAssessment": "detailed assessment of overall feasibility"
        }
      }
    `;
    
    // Generate cache key
    const cacheKey = `constraint_analysis_${sportType}_${JSON.stringify(customConstraints)}`;
    
    // Send request to MCP server
    const response = await this.mcpConnector.sendRequest(
      'gpt-4',  // Or other appropriate model
      prompt,
      context,
      cacheKey
    );
    
    // Parse and validate response
    try {
      const result = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;
      
      return result;
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
      // Return basic analysis
      return {
        constraintAnalysis: {
          conflicts: [],
          suggestedConstraints: [],
          weightRecommendations: {},
          feasibilityAssessment: "Unable to perform AI-enhanced analysis. Using default constraint configuration."
        }
      };
    }
  }
  
  /**
   * Evaluate first four games balance constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateFirstFourBalance(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const teamSchedules = this._groupScheduleByTeam(schedule);
    
    for (const [teamId, games] of Object.entries(teamSchedules)) {
      // Sort games by date
      const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get first four conference games
      const firstFourGames = sortedGames.filter(g => g.isConference).slice(0, 4);
      if (firstFourGames.length < 4) continue; // Skip if not enough conference games
      
      const homeGames = firstFourGames.filter(g => g.homeTeamId === teamId).length;
      const awayGames = firstFourGames.filter(g => g.awayTeamId === teamId).length;
      
      const minHome = constraint.minHome || 2;
      const minAway = constraint.minAway || 2;
      
      if (homeGames < minHome || awayGames < minAway) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          description: `Team ${teamId} has ${homeGames} home and ${awayGames} away games in first four conference games. Requires at least ${minHome} home and ${minAway} away.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / Object.keys(teamSchedules).length));
    }
    
    return result;
  }
  
  /**
   * Evaluate last four games balance constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateLastFourBalance(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const teamSchedules = this._groupScheduleByTeam(schedule);
    
    for (const [teamId, games] of Object.entries(teamSchedules)) {
      // Sort games by date
      const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get last four conference games
      const conferenceGames = sortedGames.filter(g => g.isConference);
      const lastFourGames = conferenceGames.slice(-4);
      if (lastFourGames.length < 4) continue; // Skip if not enough conference games
      
      const homeGames = lastFourGames.filter(g => g.homeTeamId === teamId).length;
      const awayGames = lastFourGames.filter(g => g.awayTeamId === teamId).length;
      
      const minHome = constraint.minHome || 2;
      const minAway = constraint.minAway || 2;
      
      if (homeGames < minHome || awayGames < minAway) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          description: `Team ${teamId} has ${homeGames} home and ${awayGames} away games in last four conference games. Requires at least ${minHome} home and ${minAway} away.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / Object.keys(teamSchedules).length));
    }
    
    return result;
  }
  
  /**
   * Evaluate maximum consecutive road games constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateMaxConsecutiveRoad(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const teamSchedules = this._groupScheduleByTeam(schedule);
    
    for (const [teamId, games] of Object.entries(teamSchedules)) {
      // Sort games by date
      const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Filter to conference games only
      const conferenceGames = sortedGames.filter(g => g.isConference);
      
      // Check for consecutive road games
      let consecutiveRoadGames = 0;
      let maxConsecutiveRoadGames = 0;
      
      for (const game of conferenceGames) {
        if (game.awayTeamId === teamId) {
          consecutiveRoadGames++;
          maxConsecutiveRoadGames = Math.max(maxConsecutiveRoadGames, consecutiveRoadGames);
        } else {
          consecutiveRoadGames = 0;
        }
      }
      
      const maxAllowed = constraint.value || 2;
      
      if (maxConsecutiveRoadGames > maxAllowed) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          description: `Team ${teamId} has ${maxConsecutiveRoadGames} consecutive road games. Maximum allowed is ${maxAllowed}.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / Object.keys(teamSchedules).length));
    }
    
    return result;
  }
  
  /**
   * Evaluate rematch separation constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateRematchSeparation(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const matchups = new Map();
    
    // Group games by matchup
    for (const game of games) {
      if (!game.isConference) continue;
      
      const teamA = game.homeTeamId;
      const teamB = game.awayTeamId;
      const matchupKey = [teamA, teamB].sort().join('-');
      
      if (!matchups.has(matchupKey)) {
        matchups.set(matchupKey, []);
      }
      
      matchups.get(matchupKey).push({
        gameId: game.id,
        date: new Date(game.date),
        homeTeamId: teamA,
        awayTeamId: teamB
      });
    }
    
    // Check rematch separation
    for (const [matchupKey, matchupGames] of matchups.entries()) {
      if (matchupGames.length < 2) continue; // No rematch
      
      // Sort games by date
      const sortedGames = [...matchupGames].sort((a, b) => a.date - b.date);
      
      for (let i = 1; i < sortedGames.length; i++) {
        const game1 = sortedGames[i-1];
        const game2 = sortedGames[i];
        
        // Calculate days between games
        const daysBetween = Math.floor((game2.date - game1.date) / (1000 * 60 * 60 * 24));
        
        // Calculate games between (this would require additional analysis of the full schedule)
        const gamesBetween = i; // Simplified for now
        
        const minDays = constraint.minDays || 10;
        const minGames = constraint.minGames || 3;
        
        if (daysBetween < minDays && gamesBetween < minGames) {
          result.satisfied = false;
          result.violations.push({
            matchup: matchupKey,
            description: `Rematch between teams in ${matchupKey} scheduled with only ${daysBetween} days and ${gamesBetween} games between. Requires at least ${minDays} days or ${minGames} games.`
          });
        }
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / matchups.size));
    }
    
    return result;
  }
  
  /**
   * Evaluate weekend home games constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateWeekendHomeGames(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const teamSchedules = this._groupScheduleByTeam(schedule);
    const weekendHomeGames = {};
    
    for (const [teamId, games] of Object.entries(teamSchedules)) {
      // Count weekend home games
      weekendHomeGames[teamId] = games.filter(game => {
        const gameDate = new Date(game.date);
        const isWeekend = gameDate.getDay() === 0 || gameDate.getDay() === 6; // Sunday or Saturday
        return isWeekend && game.homeTeamId === teamId && game.isConference;
      }).length;
    }
    
    const minWeekendHomeGames = constraint.minWeekendHomeGames || 4;
    
    // Check if each team has the minimum number of weekend home games
    for (const [teamId, count] of Object.entries(weekendHomeGames)) {
      if (count < minWeekendHomeGames) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          description: `Team ${teamId} has only ${count} weekend home games. Minimum required is ${minWeekendHomeGames}.`
        });
      }
    }
    
    // Check if distribution is balanced
    const counts = Object.values(weekendHomeGames);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    
    if (max - min > 2) { // Allow a difference of up to 2 weekend home games
      result.satisfied = false;
      result.violations.push({
        description: `Weekend home game distribution is unbalanced. Range is ${min}-${max} games.`
      });
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / (Object.keys(teamSchedules).length + 1)));
    }
    
    return result;
  }
  
  /**
   * Evaluate avoid road clusters constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateAvoidRoadClusters(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const teamSchedules = this._groupScheduleByTeam(schedule);
    
    for (const [teamId, games] of Object.entries(teamSchedules)) {
      // Sort games by date
      const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Filter to conference games only
      const conferenceGames = sortedGames.filter(g => g.isConference);
      
      // Check for road clusters (4 out of 5 consecutive games)
      for (let i = 0; i <= conferenceGames.length - 5; i++) {
        const fiveGameWindow = conferenceGames.slice(i, i + 5);
        const roadGamesCount = fiveGameWindow.filter(g => g.awayTeamId === teamId).length;
        
        if (roadGamesCount >= 4) {
          result.satisfied = false;
          result.violations.push({
            teamId,
            description: `Team ${teamId} has ${roadGamesCount} road games in a 5-game window starting at game ${i+1}.`
          });
        }
      }
      
      // Check first six games
      const firstSixGames = conferenceGames.slice(0, 6);
      if (firstSixGames.length === 6) {
        const roadGamesCount = firstSixGames.filter(g => g.awayTeamId === teamId).length;
        
        if (roadGamesCount >= 4) {
          result.satisfied = false;
          result.violations.push({
            teamId,
            description: `Team ${teamId} has ${roadGamesCount} road games in first 6 conference games.`
          });
        }
      }
      
      // Check last six games
      const lastSixGames = conferenceGames.slice(-6);
      if (lastSixGames.length === 6) {
        const roadGamesCount = lastSixGames.filter(g => g.awayTeamId === teamId).length;
        
        if (roadGamesCount >= 4) {
          result.satisfied = false;
          result.violations.push({
            teamId,
            description: `Team ${teamId} has ${roadGamesCount} road games in last 6 conference games.`
          });
        }
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / (Object.keys(teamSchedules).length * 3)));
    }
    
    return result;
  }
  
  /**
   * Evaluate minimize same day games constraint (for men's and women's basketball)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateMinimizeSameDayGames(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    // This constraint requires access to both men's and women's schedules
    // For now, we'll implement a placeholder that assumes the current schedule
    // is either men's or women's and the other schedule is available via a reference
    
    if (!schedule.otherGenderSchedule) {
      // Can't evaluate without the other gender's schedule
      result.notes = "Cannot evaluate same-day games constraint without reference to other gender's schedule";
      return result;
    }
    
    const sameDayHomeGames = [];
    const thisScheduleGames = schedule.games || [];
    const otherScheduleGames = schedule.otherGenderSchedule.games || [];
    
    // Group games by date and venue
    const gamesByDateAndVenue = new Map();
    
    // Process this schedule's games
    for (const game of thisScheduleGames) {
      const gameDate = new Date(game.date).toISOString().split('T')[0]; // Get just the date part
      const venueId = game.venueId;
      const key = `${gameDate}-${venueId}`;
      
      if (!gamesByDateAndVenue.has(key)) {
        gamesByDateAndVenue.set(key, { thisSchedule: [], otherSchedule: [] });
      }
      
      gamesByDateAndVenue.get(key).thisSchedule.push(game);
    }
    
    // Process other schedule's games
    for (const game of otherScheduleGames) {
      const gameDate = new Date(game.date).toISOString().split('T')[0]; // Get just the date part
      const venueId = game.venueId;
      const key = `${gameDate}-${venueId}`;
      
      if (!gamesByDateAndVenue.has(key)) {
        gamesByDateAndVenue.set(key, { thisSchedule: [], otherSchedule: [] });
      }
      
      gamesByDateAndVenue.get(key).otherSchedule.push(game);
    }
    
    // Find dates/venues with games in both schedules
    for (const [key, games] of gamesByDateAndVenue.entries()) {
      if (games.thisSchedule.length > 0 && games.otherSchedule.length > 0) {
        sameDayHomeGames.push({
          key,
          thisScheduleGames: games.thisSchedule,
          otherScheduleGames: games.otherSchedule
        });
      }
    }
    
    // Evaluate based on number of same-day games
    const maxSameDayGames = constraint.maxSameDayGames || 3; // Default threshold
    
    if (sameDayHomeGames.length > maxSameDayGames) {
      result.satisfied = false;
      result.violations.push({
        description: `Schedule has ${sameDayHomeGames.length} same-day home games for men's and women's teams. Maximum preferred is ${maxSameDayGames}.`
      });
      
      // Add details for each violation
      sameDayHomeGames.forEach(item => {
        const [date, venueId] = item.key.split('-');
        result.violations.push({
          date,
          venueId,
          description: `Same-day games at venue ${venueId} on ${date}`
        });
      });
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - ((sameDayHomeGames.length - maxSameDayGames) / 10));
    }
    
    return result;
  }
  
  /**
   * Evaluate series integrity constraint (for baseball and softball)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateSeriesIntegrity(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    
    // Group games by series
    const seriesMap = new Map();
    
    for (const game of games) {
      if (!game.seriesId) continue; // Skip games not part of a series
      
      if (!seriesMap.has(game.seriesId)) {
        seriesMap.set(game.seriesId, []);
      }
      
      seriesMap.get(game.seriesId).push(game);
    }
    
    // Check each series for venue consistency
    for (const [seriesId, seriesGames] of seriesMap.entries()) {
      // Skip if only one game in series (shouldn't happen for baseball/softball)
      if (seriesGames.length <= 1) continue;
      
      // Get venue of first game
      const firstVenue = seriesGames[0].venueId;
      
      // Check if all games in series have the same venue
      const differentVenueGames = seriesGames.filter(game => game.venueId !== firstVenue);
      
      if (differentVenueGames.length > 0) {
        result.satisfied = false;
        result.violations.push({
          seriesId,
          description: `Series ${seriesId} has games at different venues. All games in a series must be at the same venue.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / seriesMap.size));
    }
    
    return result;
  }
  
  /**
   * Evaluate home series limit constraint (for baseball)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateHomeSeriesLimit(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    
    // Group games by team and series
    const teamSeriesMap = new Map();
    
    for (const game of games) {
      if (!game.seriesId || !game.isConference) continue;
      
      const homeTeamId = game.homeTeamId;
      
      if (!teamSeriesMap.has(homeTeamId)) {
        teamSeriesMap.set(homeTeamId, new Set());
      }
      
      teamSeriesMap.get(homeTeamId).add(game.seriesId);
    }
    
    // Check if any team exceeds the maximum number of home series
    const maxHomeSeries = constraint.maxHomeSeries || 5;
    
    for (const [teamId, homeSeries] of teamSeriesMap.entries()) {
      if (homeSeries.size > maxHomeSeries) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          description: `Team ${teamId} has ${homeSeries.size} home series. Maximum allowed is ${maxHomeSeries}.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / teamSeriesMap.size));
    }
    
    return result;
  }
  
  /**
   * Evaluate special date handling constraint (for softball)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateSpecialDateHandling(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const season = schedule.season || '2025-26'; // Default to first season if not specified
    
    // Get Easter date for the season
    const easterDate = this.specialDates[season]?.Easter;
    if (!easterDate) {
      result.notes = `Easter date not available for season ${season}`;
      return result;
    }
    
    // Convert Easter date to Date object
    const easter = new Date(easterDate);
    const easterWeekend = {
      start: new Date(easter.getTime() - (2 * 24 * 60 * 60 * 1000)), // Friday before Easter
      end: new Date(easter.getTime() + (24 * 60 * 60 * 1000))        // Monday after Easter
    };
    
    // Find series that occur during Easter weekend
    const seriesMap = new Map();
    
    // Group games by series
    for (const game of games) {
      if (!game.seriesId || !game.isConference) continue;
      
      if (!seriesMap.has(game.seriesId)) {
        seriesMap.set(game.seriesId, []);
      }
      
      seriesMap.get(game.seriesId).push(game);
    }
    
    // Check each series that overlaps with Easter weekend
    for (const [seriesId, seriesGames] of seriesMap.entries()) {
      // Sort games by date
      const sortedGames = [...seriesGames].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Check if series overlaps with Easter weekend
      const firstGameDate = new Date(sortedGames[0].date);
      const lastGameDate = new Date(sortedGames[sortedGames.length - 1].date);
      
      const overlapsEaster = 
        (firstGameDate <= easterWeekend.end && lastGameDate >= easterWeekend.start);
      
      if (overlapsEaster) {
        // Check if series is scheduled Thursday-Saturday
        const daysOfWeek = sortedGames.map(game => new Date(game.date).getDay());
        const isThursToSat = !daysOfWeek.includes(0) && daysOfWeek.includes(4) && daysOfWeek.includes(6);
        
        if (!isThursToSat) {
          result.satisfied = false;
          result.violations.push({
            seriesId,
            description: `Series ${seriesId} overlaps with Easter weekend but is not scheduled Thursday-Saturday.`
          });
        }
      }
    }
    
    // Check BYU series
    for (const [seriesId, seriesGames] of seriesMap.entries()) {
      // Check if BYU is involved in the series
      const involvesBYU = seriesGames.some(game => 
        game.homeTeamId === 'BYU' || game.awayTeamId === 'BYU');
      
      if (involvesBYU) {
        // Check if series is scheduled Thursday-Saturday
        const daysOfWeek = seriesGames.map(game => new Date(game.date).getDay());
        const isThursToSat = !daysOfWeek.includes(0) && daysOfWeek.includes(4) && daysOfWeek.includes(6);
        
        if (!isThursToSat) {
          result.satisfied = false;
          result.violations.push({
            seriesId,
            description: `Series ${seriesId} involves BYU but is not scheduled Thursday-Saturday.`
          });
        }
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / seriesMap.size));
    }
    
    return result;
  }
  
  /**
   * Evaluate weather considerations constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateWeatherConsiderations(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 0.8 // Default score - this is a soft constraint
    };
    
    // This would require geographical and historical weather data
    // For now, we'll implement a placeholder that assumes some basic logic
    
    result.notes = "Weather considerations evaluation requires geographical and historical weather data. Basic evaluation performed.";
    
    return result;
  }
  
  /**
   * Evaluate exam period avoidance constraint
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateExamPeriodAvoidance(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const season = schedule.season || '2025-26'; // Default to first season if not specified
    
    // Get exam period dates for the season
    const examPeriod = this.specialDates[season]?.['Final Exams'];
    if (!examPeriod) {
      result.notes = `Exam period dates not available for season ${season}`;
      return result;
    }
    
    // Convert exam period dates to Date objects
    const examStart = new Date(examPeriod['Approximate Start']);
    const examEnd = new Date(examPeriod['Approximate End']);
    
    // Count games during exam period
    const examPeriodGames = games.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate >= examStart && gameDate <= examEnd;
    });
    
    // Evaluate based on number of games during exam period
    // This is a soft constraint, so we'll score it rather than mark as violation
    if (examPeriodGames.length > 0) {
      result.score = Math.max(0, 1 - (examPeriodGames.length / 10)); // Decrease score based on number of games
      result.notes = `Schedule has ${examPeriodGames.length} games during exam period.`;
    }
    
    return result;
  }
  
  /**
   * Evaluate round robin constraint (for tennis)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateRoundRobin(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const teams = new Set();
    
    // Collect all teams
    for (const game of games) {
      if (!game.isConference) continue;
      
      teams.add(game.homeTeamId);
      teams.add(game.awayTeamId);
    }
    
    const teamArray = Array.from(teams);
    const teamCount = teamArray.length;
    
    // Check if each team plays every other team exactly once
    for (let i = 0; i < teamCount; i++) {
      const teamA = teamArray[i];
      
      for (let j = i + 1; j < teamCount; j++) {
        const teamB = teamArray[j];
        
        // Count matches between teamA and teamB
        const matchCount = games.filter(game => 
          game.isConference && 
          ((game.homeTeamId === teamA && game.awayTeamId === teamB) || 
           (game.homeTeamId === teamB && game.awayTeamId === teamA))
        ).length;
        
        if (matchCount !== 1) {
          result.satisfied = false;
          result.violations.push({
            teamA,
            teamB,
            matchCount,
            description: `Teams ${teamA} and ${teamB} play ${matchCount} times. In a round-robin, they should play exactly once.`
          });
        }
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      const totalPossibleMatchups = (teamCount * (teamCount - 1)) / 2;
      result.score = Math.max(0, 1 - (result.violations.length / totalPossibleMatchups));
    }
    
    return result;
  }
  
  /**
   * Evaluate bye week constraint (for men's tennis)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateBuyeWeek(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const teams = new Set();
    const weeks = new Set();
    
    // Collect all teams and weeks
    for (const game of games) {
      if (!game.isConference) continue;
      
      teams.add(game.homeTeamId);
      teams.add(game.awayTeamId);
      
      const gameDate = new Date(game.date);
      const weekNumber = this._getWeekNumber(gameDate);
      weeks.add(weekNumber);
    }
    
    const teamArray = Array.from(teams);
    const weekArray = Array.from(weeks).sort((a, b) => a - b);
    
    // Check if each team has a bye week
    for (const teamId of teamArray) {
      const teamWeeks = new Set();
      
      // Find weeks where team plays
      for (const game of games) {
        if (!game.isConference) continue;
        
        if (game.homeTeamId === teamId || game.awayTeamId === teamId) {
          const gameDate = new Date(game.date);
          const weekNumber = this._getWeekNumber(gameDate);
          teamWeeks.add(weekNumber);
        }
      }
      
      // Check if team has a bye week
      const byeWeeks = weekArray.filter(week => !teamWeeks.has(week));
      
      if (byeWeeks.length !== 1) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          byeWeekCount: byeWeeks.length,
          description: `Team ${teamId} has ${byeWeeks.length} bye weeks. Should have exactly 1 bye week.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / teamArray.length));
    }
    
    return result;
  }
  
  /**
   * Evaluate no byes constraint (for women's tennis)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateNoByes(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const teams = new Set();
    const weeks = new Set();
    
    // Collect all teams and weeks
    for (const game of games) {
      if (!game.isConference) continue;
      
      teams.add(game.homeTeamId);
      teams.add(game.awayTeamId);
      
      const gameDate = new Date(game.date);
      const weekNumber = this._getWeekNumber(gameDate);
      weeks.add(weekNumber);
    }
    
    const teamArray = Array.from(teams);
    const weekArray = Array.from(weeks).sort((a, b) => a - b);
    
    // Check if any team has a bye week
    for (const teamId of teamArray) {
      const teamWeeks = new Set();
      
      // Find weeks where team plays
      for (const game of games) {
        if (!game.isConference) continue;
        
        if (game.homeTeamId === teamId || game.awayTeamId === teamId) {
          const gameDate = new Date(game.date);
          const weekNumber = this._getWeekNumber(gameDate);
          teamWeeks.add(weekNumber);
        }
      }
      
      // Check if team has a bye week
      const byeWeeks = weekArray.filter(week => !teamWeeks.has(week));
      
      if (byeWeeks.length > 0) {
        result.satisfied = false;
        result.violations.push({
          teamId,
          byeWeeks,
          description: `Team ${teamId} has ${byeWeeks.length} bye weeks in weeks ${byeWeeks.join(', ')}. Should have no bye weeks.`
        });
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      result.score = Math.max(0, 1 - (result.violations.length / teamArray.length));
    }
    
    return result;
  }
  
  /**
   * Evaluate play all opponents constraint (for women's tennis)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluatePlayAllOpponents(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const teams = new Set();
    
    // Collect all teams
    for (const game of games) {
      if (!game.isConference) continue;
      
      teams.add(game.homeTeamId);
      teams.add(game.awayTeamId);
    }
    
    const teamArray = Array.from(teams);
    const teamCount = teamArray.length;
    
    // Check if each team plays every other team at least once
    for (let i = 0; i < teamCount; i++) {
      const teamA = teamArray[i];
      
      for (let j = i + 1; j < teamCount; j++) {
        const teamB = teamArray[j];
        
        // Count matches between teamA and teamB
        const matchCount = games.filter(game => 
          game.isConference && 
          ((game.homeTeamId === teamA && game.awayTeamId === teamB) || 
           (game.homeTeamId === teamB && game.awayTeamId === teamA))
        ).length;
        
        if (matchCount < 1) {
          result.satisfied = false;
          result.violations.push({
            teamA,
            teamB,
            description: `Teams ${teamA} and ${teamB} do not play each other. Each team must play all other teams at least once.`
          });
        }
      }
    }
    
    // Calculate score based on violations
    if (result.violations.length > 0) {
      const totalPossibleMatchups = (teamCount * (teamCount - 1)) / 2;
      result.score = Math.max(0, 1 - (result.violations.length / totalPossibleMatchups));
    }
    
    return result;
  }
  
  /**
   * Evaluate facility availability constraint (for tennis)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateFacilityAvailability(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 0.8 // Default score - this is a soft constraint
    };
    
    // This would require facility availability data
    // For now, we'll implement a placeholder that assumes some basic logic
    
    result.notes = "Facility availability evaluation requires venue-specific data. Basic evaluation performed.";
    
    return result;
  }
  
  /**
   * Evaluate even distribution constraint (for women's tennis)
   * @param {object} schedule - Schedule to evaluate
   * @param {object} constraint - Constraint parameters
   * @returns {object} Evaluation result
   * @private
   */
  _evaluateEvenDistribution(schedule, constraint) {
    const result = {
      satisfied: true,
      violations: [],
      score: 1.0
    };
    
    const games = schedule.games || [];
    const weeks = new Map();
    
    // Count matches per week
    for (const game of games) {
      if (!game.isConference) continue;
      
      const gameDate = new Date(game.date);
      const weekNumber = this._getWeekNumber(gameDate);
      
      if (!weeks.has(weekNumber)) {
        weeks.set(weekNumber, 0);
      }
      
      weeks.set(weekNumber, weeks.get(weekNumber) + 1);
    }
    
    // Calculate ideal matches per week
    const totalMatches = games.filter(game => game.isConference).length;
    const totalWeeks = weeks.size;
    const idealMatchesPerWeek = totalMatches / totalWeeks;
    
    // Check distribution
    let maxDeviation = 0;
    
    for (const [week, count] of weeks.entries()) {
      const deviation = Math.abs(count - idealMatchesPerWeek);
      maxDeviation = Math.max(maxDeviation, deviation);
      
      // If deviation is more than 50% of ideal, flag as violation
      if (deviation > idealMatchesPerWeek * 0.5) {
        result.violations.push({
          week,
          matchCount: count,
          idealCount: idealMatchesPerWeek,
          description: `Week ${week} has ${count} matches, which deviates significantly from the ideal ${idealMatchesPerWeek.toFixed(1)} matches per week.`
        });
      }
    }
    
    // Calculate score based on maximum deviation
    result.score = Math.max(0, 1 - (maxDeviation / idealMatchesPerWeek));
    
    // If there are violations, mark as not fully satisfied
    if (result.violations.length > 0) {
      result.satisfied = false;
    }
    
    return result;
  }
  
  /**
   * Evaluates if a proposed schedule respects the BYU Sunday play restriction
   */
  _evaluateBYUSundayConstraint(schedule, context) {
    return evaluateBYUSundayConstraint(schedule, context);
  }
  
  /**
   * Evaluates if a proposed schedule respects venue sharing constraints
   */
  _evaluateVenueSharingConstraint(schedule, context) {
    return venueConstraints.evaluateVenueConstraints(schedule, context);
  }
  
  /**
   * Evaluates if a proposed schedule respects the venue priority hierarchy
   */
  _evaluateVenuePriorityConstraint(schedule, context) {
    const conflicts = [];
    const sharedVenueSchools = venueConstraints.sharedVenueSchools;
    const sportPriorityHierarchy = venueConstraints.sportPriorityHierarchy;
    
    // Check for priority conflicts at shared venues
    for (const school in sharedVenueSchools) {
      const sportEvents = schedule.filter(event => 
        event.homeTeam === school && 
        sharedVenueSchools[school].sports.includes(event.sport)
      );
      
      // Group events by date
      const eventsByDate = {};
      sportEvents.forEach(event => {
        const dateKey = event.date.toISOString().split('T')[0];
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });
      
      // Check for priority issues on each date
      for (const date in eventsByDate) {
        const eventsOnDate = eventsByDate[date];
        if (eventsOnDate.length > 1) {
          // Sort events by priority
          eventsOnDate.sort((a, b) => {
            const priorityA = sportPriorityHierarchy[a.sport] || 999;
            const priorityB = sportPriorityHierarchy[b.sport] || 999;
            return priorityA - priorityB;
          });
          
          // Check if higher priority events have preferred time slots
          for (let i = 0; i < eventsOnDate.length - 1; i++) {
            const higherPriorityEvent = eventsOnDate[i];
            const lowerPriorityEvent = eventsOnDate[i + 1];
            
            // Check if lower priority event has a better time slot
            if (this._hasPreferredTimeSlot(lowerPriorityEvent, higherPriorityEvent)) {
              conflicts.push({
                school,
                venue: sharedVenueSchools[school].venue,
                date,
                higherPriorityEvent,
                lowerPriorityEvent,
                issue: 'Lower priority event has preferred time slot'
              });
            }
          }
        }
      }
    }
    
    // Calculate a score based on how well the priority hierarchy is respected
    const totalPossibleConflicts = schedule.filter(event => 
      sharedVenueSchools[event.homeTeam] && 
      sharedVenueSchools[event.homeTeam].sports.includes(event.sport)
    ).length;
    
    const score = totalPossibleConflicts > 0 
      ? 1 - (conflicts.length / totalPossibleConflicts) 
      : 1;
    
    return {
      score,
      conflicts,
      explanation: conflicts.length === 0 
        ? 'Venue priority hierarchy is respected' 
        : `Found ${conflicts.length} venue priority hierarchy issues`
    };
  }
  
  /**
   * Helper method to check if an event has a preferred time slot compared to another
   */
  _hasPreferredTimeSlot(event1, event2) {
    const recommendedWindows = venueConstraints.recommendedWindows;
    const sport1 = event1.sport;
    const sport2 = event2.sport;
    
    if (!recommendedWindows[sport1] || !recommendedWindows[sport2]) {
      return false;
    }
    
    const event1Time = new Date(event1.startTime).getHours();
    const event2Time = new Date(event2.startTime).getHours();
    
    const preferredTime1 = this._isInPreferredWindow(event1Time, recommendedWindows[sport1].preferredTimeWindows);
    const preferredTime2 = this._isInPreferredWindow(event2Time, recommendedWindows[sport2].preferredTimeWindows);
    
    // If event1 is in its preferred window but event2 isn't, then event1 has a better slot
    return preferredTime1 && !preferredTime2;
  }
  
  /**
   * Helper method to check if a time is within preferred windows
   */
  _isInPreferredWindow(time, preferredWindows) {
    if (!preferredWindows || preferredWindows.length === 0) {
      return false;
    }
    
    return preferredWindows.some(window => {
      const [start, end] = window.split('-').map(t => parseInt(t.split(':')[0], 10));
      return time >= start && time <= end;
    });
  }
  
  /**
   * Helper method to get week number from date
   * @param {Date} date - Date to get week number for
   * @returns {number} Week number
   * @private
   */
  _getWeekNumber(date) {
    // Clone date to avoid modifying the original
    const d = new Date(date);
    // Set to nearest Thursday (to match ISO week date system)
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    // Get first day of year
    const yearStart = new Date(d.getFullYear(), 0, 1);
    // Calculate week number
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  
  /**
   * Helper method to group schedule games by team
   * @param {object} schedule - Schedule to group
   * @returns {object} Games grouped by team ID
   * @private
   */
  _groupScheduleByTeam(schedule) {
    const games = schedule.games || [];
    const teamSchedules = {};
    
    for (const game of games) {
      const homeTeamId = game.homeTeamId;
      const awayTeamId = game.awayTeamId;
      
      if (!teamSchedules[homeTeamId]) {
        teamSchedules[homeTeamId] = [];
      }
      if (!teamSchedules[awayTeamId]) {
        teamSchedules[awayTeamId] = [];
      }
      
      teamSchedules[homeTeamId].push(game);
      teamSchedules[awayTeamId].push(game);
    }
    
    return teamSchedules;
  }
  
  /**
   * Convert legacy constraints to enhanced format
   * @param {object} customConstraints - Legacy constraints
   * @returns {Array} Enhanced format constraints
   * @private
   */
  _convertToEnhancedFormat(customConstraints) {
    const enhancedConstraints = [];
    
    // Convert hard constraints
    if (customConstraints.hard) {
      customConstraints.hard.forEach(constraintName => {
        enhancedConstraints.push({
          id: `hard_${constraintName}_${Date.now()}`,
          type: constraintName,
          hardness: 'hard',
          weight: 100,
          parameters: {},
          source: 'legacy_conversion'
        });
      });
    }
    
    // Convert soft constraints
    if (customConstraints.soft) {
      Object.entries(customConstraints.soft).forEach(([constraintName, weight]) => {
        enhancedConstraints.push({
          id: `soft_${constraintName}_${Date.now()}`,
          type: constraintName,
          hardness: 'soft',
          weight: weight * 100, // Convert to 0-100 scale
          parameters: {},
          source: 'legacy_conversion'
        });
      });
    }
    
    // Convert any direct constraint objects
    if (Array.isArray(customConstraints)) {
      customConstraints.forEach(constraint => {
        enhancedConstraints.push({
          id: constraint.id || `constraint_${Date.now()}`,
          type: constraint.type || 'unknown',
          hardness: constraint.hardness || 'soft',
          weight: constraint.weight || 50,
          parameters: constraint.parameters || {},
          source: constraint.source || 'direct'
        });
      });
    }
    
    return enhancedConstraints;
  }
  
  /**
   * Generate recommendations based on processed constraints
   * @param {object} processedResult - Processing results
   * @param {object} context - Processing context
   * @returns {Array} Recommendations
   * @private
   */
  _generateRecommendations(processedResult, context) {
    const recommendations = [];
    
    // Check for performance optimization opportunities
    if (processedResult.metadata?.performance?.cacheUtilization < 0.5) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Consider enabling constraint caching for better performance',
        action: 'enable_caching'
      });
    }
    
    // Check for constraint balance
    const hardCount = processedResult.constraints.filter(c => c.hardness === 'hard').length;
    const softCount = processedResult.constraints.filter(c => c.hardness === 'soft').length;
    
    if (hardCount > softCount * 2) {
      recommendations.push({
        type: 'balance',
        priority: 'low',
        message: 'Consider adding more soft constraints for better optimization flexibility',
        action: 'add_soft_constraints'
      });
    }
    
    // Sport-specific recommendations
    if (context.sport === 'football' && !processedResult.constraints.find(c => c.type === 'BYU_SUNDAY_RESTRICTION')) {
      recommendations.push({
        type: 'sport_specific',
        priority: 'high',
        message: 'Add BYU Sunday restriction for football scheduling',
        action: 'add_byu_restriction'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate recommendations for violation resolution
   * @param {object} evaluationResult - Evaluation results
   * @returns {Array} Violation resolution recommendations
   * @private
   */
  _generateViolationRecommendations(evaluationResult) {
    const recommendations = [];
    
    evaluationResult.violations.forEach(violation => {
      switch (violation.constraint) {
        case 'BYU_SUNDAY_RESTRICTION':
          recommendations.push({
            violation: violation.constraint,
            priority: 'high',
            message: 'Move BYU games from Sunday to other days',
            actions: ['reschedule_game', 'swap_with_weekday']
          });
          break;
          
        case 'TRAVEL_DISTANCE':
          recommendations.push({
            violation: violation.constraint,
            priority: 'medium',
            message: 'Optimize travel by clustering games or adjusting venues',
            actions: ['cluster_games', 'optimize_venues', 'reduce_distance']
          });
          break;
          
        default:
          recommendations.push({
            violation: violation.constraint,
            priority: 'medium',
            message: `Address ${violation.constraint} violation`,
            actions: ['review_constraint', 'adjust_schedule']
          });
      }
    });
    
    return recommendations;
  }
  
  /**
   * Generate conflict resolution recommendations
   * @param {Array} conflicts - Detected conflicts
   * @param {object} resolutionResult - Resolution results
   * @returns {Array} Conflict resolution recommendations
   * @private
   */
  _generateConflictRecommendations(conflicts, resolutionResult) {
    const recommendations = [];
    
    // Recommendations for resolved conflicts
    resolutionResult.resolutions.forEach(resolution => {
      recommendations.push({
        type: 'resolved',
        conflict: resolution.conflict,
        strategy: resolution.strategy,
        message: `Conflict resolved using ${resolution.strategy}`,
        followUp: 'Monitor impact on schedule quality'
      });
    });
    
    // Recommendations for unresolved conflicts
    if (resolutionResult.unresolved > 0) {
      recommendations.push({
        type: 'unresolved',
        priority: 'high',
        message: `${resolutionResult.unresolved} conflicts remain unresolved`,
        actions: ['manual_review', 'adjust_constraints', 'seek_expert_input']
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate weight improvement metrics
   * @param {object} optimizedWeights - New optimized weights
   * @param {object} currentWeights - Current weights
   * @returns {object} Improvement metrics
   * @private
   */
  _calculateWeightImprovements(optimizedWeights, currentWeights = {}) {
    const improvements = {
      totalChanges: 0,
      significantChanges: 0,
      averageChange: 0,
      improvements: []
    };
    
    let totalChange = 0;
    let changeCount = 0;
    
    Object.entries(optimizedWeights).forEach(([constraint, newWeight]) => {
      const oldWeight = currentWeights[constraint] || 50;
      const change = Math.abs(newWeight - oldWeight);
      
      if (change > 0) {
        improvements.totalChanges++;
        totalChange += change;
        changeCount++;
        
        if (change > 10) { // Significant change threshold
          improvements.significantChanges++;
        }
        
        improvements.improvements.push({
          constraint,
          oldWeight,
          newWeight,
          change: newWeight - oldWeight,
          changePercent: ((newWeight - oldWeight) / oldWeight) * 100
        });
      }
    });
    
    improvements.averageChange = changeCount > 0 ? totalChange / changeCount : 0;
    
    return improvements;
  }
  
  /**
   * Generate weight optimization recommendations
   * @param {object} optimizedWeights - Optimized weights
   * @param {string} sportType - Sport type
   * @returns {Array} Weight recommendations
   * @private
   */
  _generateWeightRecommendations(optimizedWeights, sportType) {
    const recommendations = [];
    
    // Sport-specific weight recommendations
    switch (sportType?.toLowerCase()) {
      case 'football':
        if (optimizedWeights.TEAM_REST < 70) {
          recommendations.push({
            type: 'weight_adjustment',
            constraint: 'TEAM_REST',
            message: 'Consider increasing team rest weight for football (high physical demands)',
            suggestedWeight: 80
          });
        }
        break;
        
      case 'basketball':
        if (optimizedWeights.TRAVEL_DISTANCE > 80) {
          recommendations.push({
            type: 'weight_adjustment',
            constraint: 'TRAVEL_DISTANCE',
            message: 'Consider reducing travel weight for basketball (more frequent games)',
            suggestedWeight: 60
          });
        }
        break;
    }
    
    // General recommendations
    const weightEntries = Object.entries(optimizedWeights);
    const maxWeight = Math.max(...weightEntries.map(([_, weight]) => weight));
    const minWeight = Math.min(...weightEntries.map(([_, weight]) => weight));
    
    if (maxWeight - minWeight > 80) {
      recommendations.push({
        type: 'balance',
        message: 'Large weight variance detected. Consider balancing constraint priorities',
        action: 'review_weight_distribution'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Enhanced constraint analysis
   * @param {string} sportType - Type of sport
   * @param {object} customConstraints - Custom constraints
   * @param {object} parameters - Additional parameters
   * @returns {Promise<object>} Analysis results
   * @private
   */
  async _analyzeConstraintsEnhanced(sportType, customConstraints, parameters) {
    // If MCP is available, use AI-enhanced analysis
    if (this.mcpConnector) {
      try {
        const aiAnalysis = await this._getAIConstraintAnalysis(sportType, customConstraints);
        
        // Combine AI analysis with enhanced processing
        const enhancedAnalysis = await this._processConstraintsEnhanced(sportType, customConstraints, parameters);
        
        return {
          ...enhancedAnalysis,
          aiInsights: aiAnalysis,
          analysisType: 'ai_enhanced'
        };
      } catch (error) {
        logger.warn(`AI analysis failed, using enhanced analysis only: ${error.message}`);
      }
    }
    
    // Use enhanced processing without AI
    return this._processConstraintsEnhanced(sportType, customConstraints, parameters);
  }
  
  /**
   * Get agent performance metrics
   * @returns {object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      systemStats: this.constraintManagementSystem?.getStatistics(),
      resolverStats: this.constraintResolver?.getStatistics?.() || {}
    };
  }
  
  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      constraintsProcessed: 0,
      conflictsResolved: 0,
      optimizationsPerformed: 0,
      averageProcessingTime: 0
    };
  }
}

module.exports = ConstraintManagementAgent;
