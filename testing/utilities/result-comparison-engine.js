/**
 * Result Comparison Engine
 * 
 * Compares results between legacy system and new microservices
 * to ensure functional equivalence during migration.
 */

const _ = require('lodash');
const deepEqual = require('fast-deep-equal');
const config = require('../config/test.config');
const logger = require('./logger');

class ResultComparisonEngine {
  constructor(options = {}) {
    this.tolerance = options.tolerance || config.functionalEquivalence.tolerance;
    this.ignoredFields = options.ignoredFields || config.functionalEquivalence.ignoredFields;
    this.criticalFields = options.criticalFields || config.functionalEquivalence.criticalFields;
    this.comparisonResults = [];
  }

  /**
   * Compare two schedule objects for functional equivalence
   * @param {Object} legacyResult - Result from legacy system
   * @param {Object} microserviceResult - Result from new microservices
   * @param {string} testId - Unique identifier for this test
   * @returns {Object} Comparison result
   */
  async compareSchedules(legacyResult, microserviceResult, testId) {
    logger.info(`Starting schedule comparison for test: ${testId}`);
    
    const comparisonResult = {
      testId,
      timestamp: new Date().toISOString(),
      equivalent: true,
      differences: [],
      warnings: [],
      summary: {}
    };

    try {
      // Normalize both results
      const normalizedLegacy = this.normalizeScheduleData(legacyResult);
      const normalizedMicroservice = this.normalizeScheduleData(microserviceResult);

      // Compare critical fields first
      const criticalComparison = this.compareCriticalFields(
        normalizedLegacy,
        normalizedMicroservice
      );
      
      if (!criticalComparison.success) {
        comparisonResult.equivalent = false;
        comparisonResult.differences.push(...criticalComparison.differences);
      }

      // Compare schedule metadata
      const metadataComparison = this.compareMetadata(
        normalizedLegacy.metadata,
        normalizedMicroservice.metadata
      );
      
      if (!metadataComparison.success) {
        comparisonResult.equivalent = false;
        comparisonResult.differences.push(...metadataComparison.differences);
      }

      // Compare games
      const gamesComparison = this.compareGames(
        normalizedLegacy.games,
        normalizedMicroservice.games
      );
      
      if (!gamesComparison.success) {
        comparisonResult.equivalent = false;
        comparisonResult.differences.push(...gamesComparison.differences);
      }

      // Compare constraints
      const constraintsComparison = this.compareConstraints(
        normalizedLegacy.constraints,
        normalizedMicroservice.constraints
      );
      
      if (!constraintsComparison.success) {
        comparisonResult.warnings.push(...constraintsComparison.differences);
      }

      // Generate summary
      comparisonResult.summary = this.generateComparisonSummary(
        normalizedLegacy,
        normalizedMicroservice,
        comparisonResult
      );

      this.comparisonResults.push(comparisonResult);
      
      logger.info(`Schedule comparison completed. Equivalent: ${comparisonResult.equivalent}`);
      return comparisonResult;

    } catch (error) {
      logger.error(`Error during schedule comparison: ${error.message}`);
      comparisonResult.equivalent = false;
      comparisonResult.differences.push({
        type: 'COMPARISON_ERROR',
        message: error.message,
        severity: 'CRITICAL'
      });
      return comparisonResult;
    }
  }

  /**
   * Normalize schedule data for comparison
   * @param {Object} scheduleData - Raw schedule data
   * @returns {Object} Normalized schedule data
   */
  normalizeScheduleData(scheduleData) {
    const normalized = _.cloneDeep(scheduleData);
    
    // Remove ignored fields
    this.removeIgnoredFields(normalized, this.ignoredFields);
    
    // Sort arrays for consistent comparison
    if (normalized.games) {
      normalized.games = _.sortBy(normalized.games, ['date', 'homeTeam', 'awayTeam']);
    }
    
    if (normalized.teams) {
      normalized.teams = _.sortBy(normalized.teams, 'id');
    }
    
    if (normalized.venues) {
      normalized.venues = _.sortBy(normalized.venues, 'id');
    }

    // Normalize date formats
    this.normalizeDates(normalized);
    
    return {
      metadata: {
        sport: normalized.sport,
        season: normalized.season,
        conferenceId: normalized.conferenceId,
        totalGames: normalized.games?.length || 0,
        totalTeams: normalized.teams?.length || 0
      },
      games: normalized.games || [],
      teams: normalized.teams || [],
      venues: normalized.venues || [],
      constraints: normalized.constraints || []
    };
  }

  /**
   * Compare critical fields that must match exactly
   * @param {Object} legacy - Normalized legacy data
   * @param {Object} microservice - Normalized microservice data
   * @returns {Object} Comparison result
   */
  compareCriticalFields(legacy, microservice) {
    const differences = [];
    
    // Check if same number of games
    if (legacy.games.length !== microservice.games.length) {
      differences.push({
        type: 'GAME_COUNT_MISMATCH',
        field: 'games.length',
        legacy: legacy.games.length,
        microservice: microservice.games.length,
        severity: 'CRITICAL'
      });
    }

    // Check if same teams
    const legacyTeamIds = new Set(legacy.teams.map(t => t.id));
    const microserviceTeamIds = new Set(microservice.teams.map(t => t.id));
    
    if (!_.isEqual(legacyTeamIds, microserviceTeamIds)) {
      differences.push({
        type: 'TEAM_SET_MISMATCH',
        field: 'teams',
        legacy: Array.from(legacyTeamIds),
        microservice: Array.from(microserviceTeamIds),
        severity: 'CRITICAL'
      });
    }

    // Check sport and season consistency
    if (legacy.metadata.sport !== microservice.metadata.sport) {
      differences.push({
        type: 'SPORT_MISMATCH',
        field: 'sport',
        legacy: legacy.metadata.sport,
        microservice: microservice.metadata.sport,
        severity: 'CRITICAL'
      });
    }

    return {
      success: differences.length === 0,
      differences
    };
  }

  /**
   * Compare game schedules in detail
   * @param {Array} legacyGames - Games from legacy system
   * @param {Array} microserviceGames - Games from microservice system
   * @returns {Object} Comparison result
   */
  compareGames(legacyGames, microserviceGames) {
    const differences = [];
    
    // Create lookup maps for efficient comparison
    const legacyGameMap = new Map();
    const microserviceGameMap = new Map();
    
    legacyGames.forEach(game => {
      const key = `${game.homeTeam}-${game.awayTeam}-${game.date}`;
      legacyGameMap.set(key, game);
    });
    
    microserviceGames.forEach(game => {
      const key = `${game.homeTeam}-${game.awayTeam}-${game.date}`;
      microserviceGameMap.set(key, game);
    });
    
    // Check for missing games in microservice
    for (const [key, game] of legacyGameMap) {
      if (!microserviceGameMap.has(key)) {
        differences.push({
          type: 'MISSING_GAME',
          field: 'games',
          game: game,
          severity: 'CRITICAL'
        });
      }
    }
    
    // Check for extra games in microservice
    for (const [key, game] of microserviceGameMap) {
      if (!legacyGameMap.has(key)) {
        differences.push({
          type: 'EXTRA_GAME',
          field: 'games',
          game: game,
          severity: 'CRITICAL'
        });
      }
    }
    
    // Compare matching games in detail
    for (const [key, legacyGame] of legacyGameMap) {
      const microserviceGame = microserviceGameMap.get(key);
      if (microserviceGame) {
        const gameComparison = this.compareIndividualGame(legacyGame, microserviceGame);
        if (!gameComparison.success) {
          differences.push(...gameComparison.differences);
        }
      }
    }

    return {
      success: differences.length === 0,
      differences
    };
  }

  /**
   * Compare individual game details
   * @param {Object} legacyGame - Game from legacy system
   * @param {Object} microserviceGame - Game from microservice system
   * @returns {Object} Comparison result
   */
  compareIndividualGame(legacyGame, microserviceGame) {
    const differences = [];
    
    // Compare venue assignment
    if (legacyGame.venue !== microserviceGame.venue) {
      differences.push({
        type: 'VENUE_MISMATCH',
        field: 'venue',
        gameId: legacyGame.id || `${legacyGame.homeTeam}-${legacyGame.awayTeam}`,
        legacy: legacyGame.venue,
        microservice: microserviceGame.venue,
        severity: 'HIGH'
      });
    }
    
    // Compare time assignments (if present)
    if (legacyGame.time && microserviceGame.time) {
      const timeDiff = Math.abs(
        new Date(legacyGame.time).getTime() - 
        new Date(microserviceGame.time).getTime()
      );
      
      if (timeDiff > this.tolerance.temporal) {
        differences.push({
          type: 'TIME_MISMATCH',
          field: 'time',
          gameId: legacyGame.id || `${legacyGame.homeTeam}-${legacyGame.awayTeam}`,
          legacy: legacyGame.time,
          microservice: microserviceGame.time,
          difference: timeDiff,
          severity: 'MEDIUM'
        });
      }
    }

    return {
      success: differences.length === 0,
      differences
    };
  }

  /**
   * Compare metadata between systems
   * @param {Object} legacyMeta - Legacy metadata
   * @param {Object} microserviceMeta - Microservice metadata
   * @returns {Object} Comparison result
   */
  compareMetadata(legacyMeta, microserviceMeta) {
    const differences = [];
    
    const metadataFields = ['sport', 'season', 'conferenceId', 'totalGames', 'totalTeams'];
    
    metadataFields.forEach(field => {
      if (legacyMeta[field] !== microserviceMeta[field]) {
        differences.push({
          type: 'METADATA_MISMATCH',
          field: field,
          legacy: legacyMeta[field],
          microservice: microserviceMeta[field],
          severity: field === 'totalGames' || field === 'totalTeams' ? 'HIGH' : 'MEDIUM'
        });
      }
    });

    return {
      success: differences.length === 0,
      differences
    };
  }

  /**
   * Compare constraints application
   * @param {Array} legacyConstraints - Legacy constraints
   * @param {Array} microserviceConstraints - Microservice constraints
   * @returns {Object} Comparison result
   */
  compareConstraints(legacyConstraints, microserviceConstraints) {
    const differences = [];
    
    // This is more of a warning level comparison
    // as constraint representation might differ between systems
    
    const legacyConstraintTypes = new Set(legacyConstraints.map(c => c.type));
    const microserviceConstraintTypes = new Set(microserviceConstraints.map(c => c.type));
    
    for (const constraintType of legacyConstraintTypes) {
      if (!microserviceConstraintTypes.has(constraintType)) {
        differences.push({
          type: 'MISSING_CONSTRAINT_TYPE',
          field: 'constraints',
          constraintType: constraintType,
          severity: 'LOW'
        });
      }
    }

    return {
      success: true, // Constraints are warnings only
      differences
    };
  }

  /**
   * Generate comparison summary
   * @param {Object} legacy - Legacy data
   * @param {Object} microservice - Microservice data
   * @param {Object} comparisonResult - Current comparison result
   * @returns {Object} Summary object
   */
  generateComparisonSummary(legacy, microservice, comparisonResult) {
    return {
      equivalent: comparisonResult.equivalent,
      totalDifferences: comparisonResult.differences.length,
      totalWarnings: comparisonResult.warnings.length,
      criticalDifferences: comparisonResult.differences.filter(d => d.severity === 'CRITICAL').length,
      highDifferences: comparisonResult.differences.filter(d => d.severity === 'HIGH').length,
      mediumDifferences: comparisonResult.differences.filter(d => d.severity === 'MEDIUM').length,
      lowDifferences: comparisonResult.differences.filter(d => d.severity === 'LOW').length,
      legacy: {
        gameCount: legacy.games.length,
        teamCount: legacy.teams.length,
        venueCount: legacy.venues.length
      },
      microservice: {
        gameCount: microservice.games.length,
        teamCount: microservice.teams.length,
        venueCount: microservice.venues.length
      }
    };
  }

  /**
   * Remove ignored fields from object
   * @param {Object} obj - Object to clean
   * @param {Array} fieldsToIgnore - Fields to remove
   */
  removeIgnoredFields(obj, fieldsToIgnore) {
    if (_.isArray(obj)) {
      obj.forEach(item => this.removeIgnoredFields(item, fieldsToIgnore));
    } else if (_.isObject(obj)) {
      fieldsToIgnore.forEach(field => {
        delete obj[field];
      });
      Object.values(obj).forEach(value => {
        if (_.isObject(value) || _.isArray(value)) {
          this.removeIgnoredFields(value, fieldsToIgnore);
        }
      });
    }
  }

  /**
   * Normalize date formats in object
   * @param {Object} obj - Object to normalize
   */
  normalizeDates(obj) {
    if (_.isArray(obj)) {
      obj.forEach(item => this.normalizeDates(item));
    } else if (_.isObject(obj)) {
      Object.keys(obj).forEach(key => {
        if (_.isString(obj[key]) && this.isDateString(obj[key])) {
          obj[key] = new Date(obj[key]).toISOString();
        } else if (_.isObject(obj[key]) || _.isArray(obj[key])) {
          this.normalizeDates(obj[key]);
        }
      });
    }
  }

  /**
   * Check if string is a date
   * @param {string} str - String to check
   * @returns {boolean} True if date string
   */
  isDateString(str) {
    return !isNaN(Date.parse(str)) && 
           (str.includes('-') || str.includes('/')) &&
           str.length > 8;
  }

  /**
   * Get all comparison results
   * @returns {Array} All comparison results
   */
  getAllResults() {
    return this.comparisonResults;
  }

  /**
   * Get summary of all comparisons
   * @returns {Object} Summary statistics
   */
  getSummary() {
    const total = this.comparisonResults.length;
    const equivalent = this.comparisonResults.filter(r => r.equivalent).length;
    const totalDifferences = this.comparisonResults.reduce((sum, r) => sum + r.differences.length, 0);
    
    return {
      totalComparisons: total,
      equivalentResults: equivalent,
      equivalenceRate: total > 0 ? (equivalent / total * 100).toFixed(2) : 0,
      totalDifferences,
      averageDifferences: total > 0 ? (totalDifferences / total).toFixed(2) : 0
    };
  }

  /**
   * Reset comparison results
   */
  reset() {
    this.comparisonResults = [];
  }
}

module.exports = ResultComparisonEngine;