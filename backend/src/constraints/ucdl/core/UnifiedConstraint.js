/**
 * Unified Constraint Definition Language (UCDL) - Core Constraint Class
 * 
 * This is the base class for all UCDL constraints. It provides a standardized
 * interface for constraint definition, evaluation, and management.
 */

const { 
  ConstraintType, 
  ConstraintScope, 
  ConstraintCategory,
  EvaluationResult,
  ConstraintPriority,
  EvaluationContext,
  ResolutionStrategy
} = require('../types');

/**
 * Base UnifiedConstraint class that all constraints inherit from
 */
class UnifiedConstraint {
  /**
   * Create a new UnifiedConstraint
   * @param {Object} definition - Constraint definition object
   */
  constructor(definition) {
    this.validateDefinition(definition);
    
    // Core identification
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.version = definition.version || '1.0.0';
    
    // Constraint classification
    this.type = definition.type;
    this.scope = definition.scope;
    this.category = definition.category;
    this.priority = definition.priority || ConstraintPriority.MEDIUM;
    
    // Evaluation configuration
    this.parameters = definition.parameters || {};
    this.conditions = definition.conditions || [];
    this.weight = definition.weight || 1.0;
    this.penalty = definition.penalty || 1.0;
    
    // Resolution configuration
    this.resolutionStrategy = definition.resolutionStrategy || ResolutionStrategy.STRICT;
    this.fallbackOptions = definition.fallbackOptions || [];
    
    // Metadata
    this.metadata = {
      created: definition.metadata?.created || new Date().toISOString(),
      lastModified: definition.metadata?.lastModified || new Date().toISOString(),
      author: definition.metadata?.author || 'system',
      tags: definition.metadata?.tags || [],
      documentation: definition.metadata?.documentation || '',
      ...definition.metadata
    };
    
    // Runtime state
    this.isActive = definition.isActive !== undefined ? definition.isActive : true;
    this.evaluationHistory = [];
    this.dependsOn = definition.dependsOn || [];
    this.affects = definition.affects || [];
  }

  /**
   * Validate constraint definition structure
   * @param {Object} definition - Constraint definition to validate
   * @throws {Error} If definition is invalid
   */
  validateDefinition(definition) {
    if (!definition) {
      throw new Error('Constraint definition is required');
    }
    
    const required = ['id', 'name', 'type', 'scope', 'category'];
    for (const field of required) {
      if (!definition[field]) {
        throw new Error(`Required field '${field}' is missing from constraint definition`);
      }
    }
    
    if (!Object.values(ConstraintType).includes(definition.type)) {
      throw new Error(`Invalid constraint type: ${definition.type}`);
    }
    
    if (!Object.values(ConstraintScope).includes(definition.scope)) {
      throw new Error(`Invalid constraint scope: ${definition.scope}`);
    }
    
    if (!Object.values(ConstraintCategory).includes(definition.category)) {
      throw new Error(`Invalid constraint category: ${definition.category}`);
    }
  }

  /**
   * Evaluate constraint against a schedule
   * @param {Object} schedule - Schedule object to evaluate
   * @param {Object} context - Evaluation context
   * @returns {Object} Evaluation result
   */
  async evaluate(schedule, context = {}) {
    if (!this.isActive) {
      return this.createEvaluationResult(EvaluationResult.NOT_APPLICABLE, 0, 'Constraint is inactive');
    }

    try {
      // Check if constraint applies in current context
      if (!this.appliesInContext(context)) {
        return this.createEvaluationResult(EvaluationResult.NOT_APPLICABLE, 0, 'Constraint does not apply in this context');
      }

      // Check conditions
      if (!await this.checkConditions(schedule, context)) {
        return this.createEvaluationResult(EvaluationResult.NOT_APPLICABLE, 0, 'Constraint conditions not met');
      }

      // Perform actual evaluation
      const result = await this.performEvaluation(schedule, context);
      
      // Record evaluation in history
      this.recordEvaluation(result, context);
      
      return result;
    } catch (error) {
      const errorResult = this.createEvaluationResult(
        EvaluationResult.ERROR, 
        0, 
        `Evaluation error: ${error.message}`,
        { error: error.message, stack: error.stack }
      );
      this.recordEvaluation(errorResult, context);
      return errorResult;
    }
  }

  /**
   * Check if constraint applies in the given context
   * @param {Object} context - Evaluation context
   * @returns {boolean} True if constraint applies
   */
  appliesInContext(context) {
    // Base implementation - can be overridden by subclasses
    return true;
  }

  /**
   * Check if constraint conditions are met
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {boolean} True if conditions are met
   */
  async checkConditions(schedule, context) {
    if (this.conditions.length === 0) {
      return true;
    }

    for (const condition of this.conditions) {
      if (!await this.evaluateCondition(condition, schedule, context)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate a single condition
   * @param {Object} condition - Condition to evaluate
   * @param {Object} schedule - Schedule object
   * @param {Object} context - Evaluation context
   * @returns {boolean} True if condition is met
   */
  async evaluateCondition(condition, schedule, context) {
    // This is a placeholder - specific condition types should be implemented
    // Examples: date_range, team_filter, sport_filter, etc.
    return true;
  }

  /**
   * Perform the actual constraint evaluation logic
   * @param {Object} schedule - Schedule object to evaluate
   * @param {Object} context - Evaluation context
   * @returns {Object} Evaluation result
   */
  async performEvaluation(schedule, context) {
    // This must be implemented by subclasses
    throw new Error('performEvaluation method must be implemented by subclasses');
  }

  /**
   * Create a standardized evaluation result
   * @param {string} status - Result status
   * @param {number} penalty - Penalty score
   * @param {string} message - Result message
   * @param {Object} details - Additional details
   * @returns {Object} Evaluation result
   */
  createEvaluationResult(status, penalty, message, details = {}) {
    return {
      constraintId: this.id,
      constraintName: this.name,
      status,
      penalty: penalty || 0,
      weight: this.weight,
      weightedPenalty: (penalty || 0) * this.weight,
      message,
      timestamp: new Date().toISOString(),
      details: {
        type: this.type,
        scope: this.scope,
        category: this.category,
        priority: this.priority,
        ...details
      }
    };
  }

  /**
   * Record evaluation in history
   * @param {Object} result - Evaluation result
   * @param {Object} context - Evaluation context
   */
  recordEvaluation(result, context) {
    this.evaluationHistory.push({
      ...result,
      context,
      evaluatedAt: new Date().toISOString()
    });
    
    // Keep only last 100 evaluations to prevent memory bloat
    if (this.evaluationHistory.length > 100) {
      this.evaluationHistory = this.evaluationHistory.slice(-100);
    }
  }

  /**
   * Get constraint as a serializable object
   * @returns {Object} Constraint as plain object
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      type: this.type,
      scope: this.scope,
      category: this.category,
      priority: this.priority,
      parameters: this.parameters,
      conditions: this.conditions,
      weight: this.weight,
      penalty: this.penalty,
      resolutionStrategy: this.resolutionStrategy,
      fallbackOptions: this.fallbackOptions,
      metadata: this.metadata,
      isActive: this.isActive,
      dependsOn: this.dependsOn,
      affects: this.affects
    };
  }

  /**
   * Create constraint from serialized object
   * @param {Object} obj - Serialized constraint object
   * @returns {UnifiedConstraint} Constraint instance
   */
  static fromObject(obj) {
    return new UnifiedConstraint(obj);
  }

  /**
   * Clone constraint with optional modifications
   * @param {Object} modifications - Properties to modify
   * @returns {UnifiedConstraint} Cloned constraint
   */
  clone(modifications = {}) {
    const cloned = this.toObject();
    Object.assign(cloned, modifications);
    cloned.id = modifications.id || `${this.id}_clone_${Date.now()}`;
    return UnifiedConstraint.fromObject(cloned);
  }

  /**
   * Get constraint summary for display
   * @returns {Object} Constraint summary
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      scope: this.scope,
      category: this.category,
      priority: this.priority,
      isActive: this.isActive,
      lastEvaluated: this.evaluationHistory.length > 0 ? 
        this.evaluationHistory[this.evaluationHistory.length - 1].evaluatedAt : null
    };
  }
}

module.exports = UnifiedConstraint;