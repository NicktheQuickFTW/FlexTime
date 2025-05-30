/**
 * Unified Constraint Definition Language (UCDL) - Constraint Evaluator
 * 
 * This module provides the interface and base implementation for constraint evaluation.
 * It standardizes how constraints are evaluated across different contexts.
 */

const { EvaluationResult, EvaluationContext } = require('../types');

/**
 * Interface for constraint evaluators
 */
class ConstraintEvaluator {
  /**
   * Create a new ConstraintEvaluator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      parallel: options.parallel || false,
      maxConcurrency: options.maxConcurrency || 10,
      timeout: options.timeout || 30000,
      caching: options.caching || true,
      logging: options.logging || false,
      ...options
    };
    
    this.cache = new Map();
    this.evaluationMetrics = {
      totalEvaluations: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      averageEvaluationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Evaluate a single constraint
   * @param {UnifiedConstraint} constraint - Constraint to evaluate
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateConstraint(constraint, schedule, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache if enabled
      if (this.options.caching) {
        const cached = this.getCachedResult(constraint, schedule, context);
        if (cached) {
          this.evaluationMetrics.cacheHits++;
          return cached;
        }
        this.evaluationMetrics.cacheMisses++;
      }

      // Set up timeout if specified
      let result;
      if (this.options.timeout > 0) {
        result = await Promise.race([
          constraint.evaluate(schedule, context),
          this.createTimeoutPromise(this.options.timeout)
        ]);
      } else {
        result = await constraint.evaluate(schedule, context);
      }

      // Cache result if enabled
      if (this.options.caching && result.status !== EvaluationResult.ERROR) {
        this.cacheResult(constraint, schedule, context, result);
      }

      // Update metrics
      this.updateMetrics(startTime, true);
      
      return result;
    } catch (error) {
      this.updateMetrics(startTime, false);
      
      return {
        constraintId: constraint.id,
        constraintName: constraint.name,
        status: EvaluationResult.ERROR,
        penalty: 0,
        weightedPenalty: 0,
        message: `Evaluation failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        details: { error: error.message }
      };
    }
  }

  /**
   * Evaluate multiple constraints
   * @param {Array<UnifiedConstraint>} constraints - Constraints to evaluate
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {Promise<Array<Object>>} Array of evaluation results
   */
  async evaluateConstraints(constraints, schedule, context = {}) {
    if (this.options.parallel) {
      return this.evaluateConstraintsParallel(constraints, schedule, context);
    } else {
      return this.evaluateConstraintsSequential(constraints, schedule, context);
    }
  }

  /**
   * Evaluate constraints sequentially
   * @param {Array<UnifiedConstraint>} constraints - Constraints to evaluate
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {Promise<Array<Object>>} Array of evaluation results
   */
  async evaluateConstraintsSequential(constraints, schedule, context) {
    const results = [];
    
    for (const constraint of constraints) {
      if (!constraint.isActive) {
        continue;
      }
      
      try {
        const result = await this.evaluateConstraint(constraint, schedule, context);
        results.push(result);
      } catch (error) {
        results.push({
          constraintId: constraint.id,
          constraintName: constraint.name,
          status: EvaluationResult.ERROR,
          penalty: 0,
          weightedPenalty: 0,
          message: `Evaluation failed: ${error.message}`,
          timestamp: new Date().toISOString(),
          details: { error: error.message }
        });
      }
    }
    
    return results;
  }

  /**
   * Evaluate constraints in parallel
   * @param {Array<UnifiedConstraint>} constraints - Constraints to evaluate
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {Promise<Array<Object>>} Array of evaluation results
   */
  async evaluateConstraintsParallel(constraints, schedule, context) {
    const activeConstraints = constraints.filter(c => c.isActive);
    
    // Batch constraints by maxConcurrency
    const batches = [];
    for (let i = 0; i < activeConstraints.length; i += this.options.maxConcurrency) {
      batches.push(activeConstraints.slice(i, i + this.options.maxConcurrency));
    }
    
    const allResults = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(constraint => 
        this.evaluateConstraint(constraint, schedule, context)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Convert settled results to evaluation results
      const processedResults = batchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const constraint = batch[index];
          return {
            constraintId: constraint.id,
            constraintName: constraint.name,
            status: EvaluationResult.ERROR,
            penalty: 0,
            weightedPenalty: 0,
            message: `Evaluation failed: ${result.reason.message}`,
            timestamp: new Date().toISOString(),
            details: { error: result.reason.message }
          };
        }
      });
      
      allResults.push(...processedResults);
    }
    
    return allResults;
  }

  /**
   * Aggregate evaluation results
   * @param {Array<Object>} results - Individual evaluation results
   * @returns {Object} Aggregated results
   */
  aggregateResults(results) {
    const summary = {
      totalConstraints: results.length,
      satisfied: 0,
      violated: 0,
      partiallyStatisfied: 0,
      notApplicable: 0,
      errors: 0,
      totalPenalty: 0,
      totalWeightedPenalty: 0,
      worstViolations: [],
      criticalFailures: []
    };

    const violations = [];

    for (const result of results) {
      // Count by status
      switch (result.status) {
        case EvaluationResult.SATISFIED:
          summary.satisfied++;
          break;
        case EvaluationResult.VIOLATED:
          summary.violated++;
          violations.push(result);
          break;
        case EvaluationResult.PARTIALLY_SATISFIED:
          summary.partiallyStatisfied++;
          violations.push(result);
          break;
        case EvaluationResult.NOT_APPLICABLE:
          summary.notApplicable++;
          break;
        case EvaluationResult.ERROR:
          summary.errors++;
          summary.criticalFailures.push(result);
          break;
      }

      // Accumulate penalties
      summary.totalPenalty += result.penalty || 0;
      summary.totalWeightedPenalty += result.weightedPenalty || 0;
    }

    // Sort violations by weighted penalty (worst first)
    violations.sort((a, b) => (b.weightedPenalty || 0) - (a.weightedPenalty || 0));
    summary.worstViolations = violations.slice(0, 10); // Top 10 worst

    // Calculate percentages
    summary.satisfactionRate = summary.totalConstraints > 0 ? 
      (summary.satisfied / summary.totalConstraints) * 100 : 100;
    summary.violationRate = summary.totalConstraints > 0 ? 
      (summary.violated / summary.totalConstraints) * 100 : 0;

    return summary;
  }

  /**
   * Get cached evaluation result
   * @param {UnifiedConstraint} constraint - Constraint
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {Object|null} Cached result or null
   */
  getCachedResult(constraint, schedule, context) {
    const cacheKey = this.generateCacheKey(constraint, schedule, context);
    return this.cache.get(cacheKey) || null;
  }

  /**
   * Cache evaluation result
   * @param {UnifiedConstraint} constraint - Constraint
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @param {Object} result - Evaluation result
   */
  cacheResult(constraint, schedule, context, result) {
    const cacheKey = this.generateCacheKey(constraint, schedule, context);
    this.cache.set(cacheKey, {
      ...result,
      cachedAt: new Date().toISOString()
    });
    
    // Implement simple LRU by size limit
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Generate cache key for constraint evaluation
   * @param {UnifiedConstraint} constraint - Constraint
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {string} Cache key
   */
  generateCacheKey(constraint, schedule, context) {
    // This is a simplified cache key generation
    // In practice, you might want more sophisticated hashing
    const scheduleHash = this.hashObject(schedule);
    const contextHash = this.hashObject(context);
    return `${constraint.id}:${constraint.version}:${scheduleHash}:${contextHash}`;
  }

  /**
   * Simple object hashing for cache keys
   * @param {Object} obj - Object to hash
   * @returns {string} Hash string
   */
  hashObject(obj) {
    return JSON.stringify(obj)
      .split('')
      .reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)
      .toString(16);
  }

  /**
   * Create a timeout promise
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that rejects after timeout
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Constraint evaluation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Update evaluation metrics
   * @param {number} startTime - Start time in milliseconds
   * @param {boolean} successful - Whether evaluation was successful
   */
  updateMetrics(startTime, successful) {
    const duration = Date.now() - startTime;
    
    this.evaluationMetrics.totalEvaluations++;
    if (successful) {
      this.evaluationMetrics.successfulEvaluations++;
    } else {
      this.evaluationMetrics.failedEvaluations++;
    }
    
    // Update rolling average
    const totalSuccessful = this.evaluationMetrics.successfulEvaluations;
    const currentAvg = this.evaluationMetrics.averageEvaluationTime;
    this.evaluationMetrics.averageEvaluationTime = 
      ((currentAvg * (totalSuccessful - 1)) + duration) / totalSuccessful;
  }

  /**
   * Clear evaluation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get evaluation metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this.evaluationMetrics };
  }

  /**
   * Reset evaluation metrics
   */
  resetMetrics() {
    this.evaluationMetrics = {
      totalEvaluations: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      averageEvaluationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

module.exports = ConstraintEvaluator;