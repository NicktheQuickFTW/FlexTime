/**
 * Smart Conflict Resolution System for FlexTime
 * 
 * This is the main conflict resolution engine that coordinates multiple
 * resolution strategies to automatically resolve scheduling conflicts.
 */

const logger = require('../scripts/logger");
const ConflictDetector = require('./ConflictDetector');
const ResolutionHistory = require('./ResolutionHistory');

// Resolution strategies
const VenueReschedulingStrategy = require('./strategies/VenueReschedulingStrategy');
const DayShiftStrategy = require('./strategies/DayShiftStrategy');
const GameClusteringStrategy = require('./strategies/GameClusteringStrategy');
const ConstraintRelaxationStrategy = require('./strategies/ConstraintRelaxationStrategy');
const OpponentSwapStrategy = require('./strategies/OpponentSwapStrategy');

// Big 12 specific resolvers
const BYUSundayResolver = require('./big12/BYUSundayResolver');
const VenueSharingResolver = require('./big12/VenueSharingResolver');
const TravelBurdenResolver = require('./big12/TravelBurdenResolver');
const MediaRightsResolver = require('./big12/MediaRightsResolver');

class SmartConflictResolver {
  constructor(options = {}) {
    this.options = {
      maxResolutionAttempts: options.maxResolutionAttempts || 5,
      learningEnabled: options.learningEnabled !== false,
      prioritizeMinimalChanges: options.prioritizeMinimalChanges !== false,
      preserveHighPriorityGames: options.preserveHighPriorityGames !== false,
      ...options
    };

    this.conflictDetector = new ConflictDetector();
    this.resolutionHistory = new ResolutionHistory();
    
    // Initialize resolution strategies
    this.strategies = this._initializeStrategies();
    
    // Initialize Big 12 specific resolvers
    this.big12Resolvers = this._initializeBig12Resolvers();
    
    // Resolution statistics
    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      failedResolutions: 0,
      strategiesUsed: new Map(),
      averageResolutionTime: 0
    };
  }

  /**
   * Resolve all conflicts in a schedule
   * @param {Array} schedule - Schedule to resolve conflicts in
   * @param {Object} context - Additional context (venues, teams, constraints)
   * @returns {Object} Resolution results
   */
  async resolveConflicts(schedule, context = {}) {
    const startTime = Date.now();
    logger.info('Starting Smart Conflict Resolution');

    try {
      // Phase 1: Detect all conflicts
      const conflicts = await this.conflictDetector.detectAllConflicts(schedule, context);
      this.stats.totalConflicts += conflicts.length;

      if (conflicts.length === 0) {
        logger.info('No conflicts detected in schedule');
        return {
          success: true,
          conflicts: [],
          resolutions: [],
          modifiedSchedule: schedule,
          stats: this._getCurrentStats()
        };
      }

      logger.info(`Detected ${conflicts.length} conflicts to resolve`);

      // Phase 2: Prioritize and categorize conflicts
      const prioritizedConflicts = this._prioritizeConflicts(conflicts);
      
      // Phase 3: Apply Big 12 specific resolvers first
      let workingSchedule = JSON.parse(JSON.stringify(schedule));
      const resolutions = [];
      const unresolvedConflicts = [];

      // Handle BYU Sunday conflicts with highest priority
      const byuConflicts = prioritizedConflicts.filter(c => this._isBYUSundayConflict(c));
      if (byuConflicts.length > 0) {
        const byuResults = await this._resolveBYUConflicts(byuConflicts, workingSchedule, context);
        resolutions.push(...byuResults.resolutions);
        workingSchedule = byuResults.modifiedSchedule;
      }

      // Phase 4: Apply general resolution strategies
      for (const conflict of prioritizedConflicts) {
        if (this._isConflictResolved(conflict, resolutions)) {
          continue;
        }

        const resolutionResult = await this._resolveConflict(conflict, workingSchedule, context);
        
        if (resolutionResult.success) {
          resolutions.push(...resolutionResult.resolutions);
          workingSchedule = resolutionResult.modifiedSchedule;
          this.stats.resolvedConflicts++;
        } else {
          unresolvedConflicts.push(conflict);
          this.stats.failedResolutions++;
        }
      }

      // Phase 5: Validate final schedule
      const finalValidation = await this._validateFinalSchedule(workingSchedule, context);
      
      // Phase 6: Update learning system
      if (this.options.learningEnabled) {
        await this._updateLearningSystem(conflicts, resolutions, unresolvedConflicts);
      }

      const endTime = Date.now();
      const resolutionTime = endTime - startTime;
      this._updateResolutionStats(resolutionTime);

      logger.info(`Conflict resolution completed in ${resolutionTime}ms`);
      logger.info(`Resolved: ${resolutions.length}, Failed: ${unresolvedConflicts.length}`);

      return {
        success: unresolvedConflicts.length === 0,
        conflicts: prioritizedConflicts,
        resolutions,
        unresolvedConflicts,
        modifiedSchedule: workingSchedule,
        validation: finalValidation,
        stats: this._getCurrentStats(),
        resolutionTime
      };

    } catch (error) {
      logger.error(`Error in Smart Conflict Resolution: ${error.message}`);
      return {
        success: false,
        error: error.message,
        conflicts: [],
        resolutions: [],
        modifiedSchedule: schedule,
        stats: this._getCurrentStats()
      };
    }
  }

  /**
   * Resolve a single conflict using the best available strategy
   * @param {Object} conflict - Conflict to resolve
   * @param {Array} schedule - Current schedule
   * @param {Object} context - Additional context
   * @returns {Object} Resolution result
   */
  async _resolveConflict(conflict, schedule, context) {
    logger.info(`Resolving conflict: ${conflict.type} (${conflict.id})`);

    // Get applicable strategies for this conflict type
    const applicableStrategies = this._getApplicableStrategies(conflict);
    
    // Sort strategies by historical success rate and priority
    const sortedStrategies = await this._sortStrategiesBySuccess(applicableStrategies, conflict);

    // Try each strategy until one succeeds
    for (const strategy of sortedStrategies) {
      try {
        logger.info(`Attempting resolution with strategy: ${strategy.name}`);
        
        const result = await strategy.resolve(conflict, schedule, context);
        
        if (result.success) {
          this._recordStrategyUsage(strategy.name, true);
          logger.info(`Successfully resolved conflict using ${strategy.name}`);
          return result;
        } else {
          this._recordStrategyUsage(strategy.name, false);
          logger.warn(`Strategy ${strategy.name} failed: ${result.reason}`);
        }
      } catch (error) {
        logger.error(`Strategy ${strategy.name} error: ${error.message}`);
        this._recordStrategyUsage(strategy.name, false);
      }
    }

    return {
      success: false,
      reason: 'All applicable strategies failed',
      resolutions: [],
      modifiedSchedule: schedule
    };
  }

  /**
   * Handle BYU Sunday conflicts with specialized resolver
   * @param {Array} byuConflicts - BYU Sunday conflicts
   * @param {Array} schedule - Current schedule
   * @param {Object} context - Additional context
   * @returns {Object} Resolution result
   */
  async _resolveBYUConflicts(byuConflicts, schedule, context) {
    const byuResolver = this.big12Resolvers.byuSunday;
    const allResolutions = [];
    let workingSchedule = JSON.parse(JSON.stringify(schedule));

    for (const conflict of byuConflicts) {
      const result = await byuResolver.resolve(conflict, workingSchedule, context);
      if (result.success) {
        allResolutions.push(...result.resolutions);
        workingSchedule = result.modifiedSchedule;
      }
    }

    return {
      resolutions: allResolutions,
      modifiedSchedule: workingSchedule
    };
  }

  /**
   * Initialize resolution strategies
   * @returns {Object} Initialized strategies
   * @private
   */
  _initializeStrategies() {
    return {
      venueRescheduling: new VenueReschedulingStrategy(),
      dayShift: new DayShiftStrategy(),
      gameClustering: new GameClusteringStrategy(),
      constraintRelaxation: new ConstraintRelaxationStrategy(),
      opponentSwap: new OpponentSwapStrategy()
    };
  }

  /**
   * Initialize Big 12 specific resolvers
   * @returns {Object} Initialized Big 12 resolvers
   * @private
   */
  _initializeBig12Resolvers() {
    return {
      byuSunday: new BYUSundayResolver(),
      venueSharing: new VenueSharingResolver(),
      travelBurden: new TravelBurdenResolver(),
      mediaRights: new MediaRightsResolver()
    };
  }

  /**
   * Prioritize conflicts based on severity and type
   * @param {Array} conflicts - Conflicts to prioritize
   * @returns {Array} Prioritized conflicts
   * @private
   */
  _prioritizeConflicts(conflicts) {
    const priorityOrder = {
      'CRITICAL': 1000,
      'HIGH': 100,
      'MEDIUM': 50,
      'LOW': 10
    };

    const typeOrder = {
      'byu_sunday': 2000,  // Highest priority - religious observance
      'venue': 1500,       // High priority - hard conflicts
      'team': 1200,        // High priority - impossible scenarios
      'travel': 800,       // Medium-high priority - logistics
      'rest': 600,         // Medium priority - player welfare
      'resource': 400,     // Medium-low priority - can often be worked around
      'media': 200         // Lower priority - business preferences
    };

    return conflicts.sort((a, b) => {
      const aPriority = (priorityOrder[a.severity] || 0) + (typeOrder[a.type] || 0);
      const bPriority = (priorityOrder[b.severity] || 0) + (typeOrder[b.type] || 0);
      return bPriority - aPriority;
    });
  }

  /**
   * Get applicable strategies for a conflict type
   * @param {Object} conflict - Conflict to resolve
   * @returns {Array} Applicable strategies
   * @private
   */
  _getApplicableStrategies(conflict) {
    const strategies = [];

    switch (conflict.type) {
      case 'venue':
        strategies.push(
          this.strategies.venueRescheduling,
          this.strategies.dayShift,
          this.strategies.gameClustering
        );
        break;
      case 'team':
        strategies.push(
          this.strategies.dayShift,
          this.strategies.opponentSwap,
          this.strategies.gameClustering
        );
        break;
      case 'travel':
        strategies.push(
          this.strategies.gameClustering,
          this.strategies.dayShift,
          this.strategies.venueRescheduling
        );
        break;
      case 'rest':
        strategies.push(
          this.strategies.dayShift,
          this.strategies.gameClustering
        );
        break;
      case 'byu_sunday':
        strategies.push(this.strategies.dayShift);
        break;
      default:
        // For unknown types, try all strategies
        strategies.push(...Object.values(this.strategies));
    }

    return strategies;
  }

  /**
   * Sort strategies by historical success rate
   * @param {Array} strategies - Strategies to sort
   * @param {Object} conflict - Current conflict
   * @returns {Array} Sorted strategies
   * @private
   */
  async _sortStrategiesBySuccess(strategies, conflict) {
    if (!this.options.learningEnabled) {
      return strategies;
    }

    const strategiesWithScores = await Promise.all(
      strategies.map(async (strategy) => {
        const successRate = await this.resolutionHistory.getSuccessRate(
          strategy.name,
          conflict.type
        );
        return { strategy, successRate };
      })
    );

    return strategiesWithScores
      .sort((a, b) => b.successRate - a.successRate)
      .map(item => item.strategy);
  }

  /**
   * Check if a conflict is a BYU Sunday conflict
   * @param {Object} conflict - Conflict to check
   * @returns {boolean} True if BYU Sunday conflict
   * @private
   */
  _isBYUSundayConflict(conflict) {
    return conflict.type === 'byu_sunday' || 
           (conflict.type === 'team' && 
            conflict.description && 
            conflict.description.includes('BYU') && 
            conflict.description.includes('Sunday'));
  }

  /**
   * Check if a conflict has already been resolved
   * @param {Object} conflict - Conflict to check
   * @param {Array} resolutions - Existing resolutions
   * @returns {boolean} True if conflict is resolved
   * @private
   */
  _isConflictResolved(conflict, resolutions) {
    return resolutions.some(resolution => resolution.conflictId === conflict.id);
  }

  /**
   * Validate the final schedule for any remaining conflicts
   * @param {Array} schedule - Final schedule
   * @param {Object} context - Additional context
   * @returns {Object} Validation result
   * @private
   */
  async _validateFinalSchedule(schedule, context) {
    const remainingConflicts = await this.conflictDetector.detectAllConflicts(schedule, context);
    
    return {
      isValid: remainingConflicts.length === 0,
      remainingConflicts: remainingConflicts.length,
      conflictTypes: [...new Set(remainingConflicts.map(c => c.type))],
      criticalConflicts: remainingConflicts.filter(c => c.severity === 'CRITICAL').length
    };
  }

  /**
   * Update learning system with resolution results
   * @param {Array} conflicts - Original conflicts
   * @param {Array} resolutions - Applied resolutions
   * @param {Array} unresolvedConflicts - Conflicts that couldn't be resolved
   * @private
   */
  async _updateLearningSystem(conflicts, resolutions, unresolvedConflicts) {
    try {
      // Record successful resolutions
      for (const resolution of resolutions) {
        await this.resolutionHistory.recordResolution({
          conflictType: resolution.conflictType,
          strategy: resolution.strategy,
          success: true,
          context: resolution.context,
          timestamp: new Date()
        });
      }

      // Record failed resolutions
      for (const conflict of unresolvedConflicts) {
        await this.resolutionHistory.recordResolution({
          conflictType: conflict.type,
          strategy: 'none',
          success: false,
          context: { severity: conflict.severity },
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error(`Error updating learning system: ${error.message}`);
    }
  }

  /**
   * Record usage of a strategy
   * @param {string} strategyName - Name of strategy
   * @param {boolean} success - Whether it succeeded
   * @private
   */
  _recordStrategyUsage(strategyName, success) {
    if (!this.stats.strategiesUsed.has(strategyName)) {
      this.stats.strategiesUsed.set(strategyName, { attempts: 0, successes: 0 });
    }
    
    const stats = this.stats.strategiesUsed.get(strategyName);
    stats.attempts++;
    if (success) stats.successes++;
  }

  /**
   * Update resolution statistics
   * @param {number} resolutionTime - Time taken for resolution
   * @private
   */
  _updateResolutionStats(resolutionTime) {
    const currentAvg = this.stats.averageResolutionTime;
    const totalResolutions = this.stats.resolvedConflicts + this.stats.failedResolutions;
    
    this.stats.averageResolutionTime = totalResolutions === 1 ? 
      resolutionTime : 
      (currentAvg * (totalResolutions - 1) + resolutionTime) / totalResolutions;
  }

  /**
   * Get current statistics
   * @returns {Object} Current statistics
   * @private
   */
  _getCurrentStats() {
    const strategyStats = {};
    for (const [name, stats] of this.stats.strategiesUsed) {
      strategyStats[name] = {
        attempts: stats.attempts,
        successes: stats.successes,
        successRate: stats.attempts > 0 ? stats.successes / stats.attempts : 0
      };
    }

    return {
      ...this.stats,
      strategiesUsed: strategyStats,
      overallSuccessRate: this.stats.totalConflicts > 0 ? 
        this.stats.resolvedConflicts / this.stats.totalConflicts : 0
    };
  }

  /**
   * Get resolution recommendations for a conflict
   * @param {Object} conflict - Conflict to get recommendations for
   * @param {Object} context - Additional context
   * @returns {Array} Recommended resolution strategies
   */
  async getResolutionRecommendations(conflict, context = {}) {
    const applicableStrategies = this._getApplicableStrategies(conflict);
    const sortedStrategies = await this._sortStrategiesBySuccess(applicableStrategies, conflict);

    return sortedStrategies.map(strategy => ({
      strategyName: strategy.name,
      description: strategy.description,
      estimatedSuccessRate: this.resolutionHistory.getSuccessRate(strategy.name, conflict.type),
      estimatedChanges: strategy.estimateChanges ? strategy.estimateChanges(conflict, context) : null,
      priority: strategy.priority || 'medium'
    }));
  }

  /**
   * Reset resolution statistics
   */
  resetStats() {
    this.stats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      failedResolutions: 0,
      strategiesUsed: new Map(),
      averageResolutionTime: 0
    };
  }
}

module.exports = SmartConflictResolver;