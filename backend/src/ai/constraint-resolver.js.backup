/**
 * FlexTime Constraint Resolver
 * 
 * Handles constraint conflict detection and resolution strategies
 * Works with the enhanced constraint management system
 */

const logger = require("../utils/logger");

class ConstraintResolver {
  constructor() {
    this.resolutionStrategies = new Map();
    this.conflictPatterns = new Map();
    this.resolutionHistory = [];
    
    this._initializeStrategies();
  }
  
  /**
   * Detect conflicts between constraints
   * @param {Array} constraints - Constraints to analyze
   * @returns {Array} Detected conflicts
   */
  detectConflicts(constraints) {
    const conflicts = [];
    
    // Check for direct conflicts
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        const conflict = this._checkConstraintConflict(constraints[i], constraints[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    // Check for pattern-based conflicts
    const patternConflicts = this._detectPatternConflicts(constraints);
    conflicts.push(...patternConflicts);
    
    return conflicts;
  }
  
  /**
   * Resolve constraint conflicts
   * @param {Array} conflicts - Conflicts to resolve
   * @param {Array} constraints - Original constraints
   * @param {Object} context - Resolution context
   * @returns {Object} Resolution results
   */
  resolveConflicts(conflicts, constraints, context = {}) {
    const resolutions = [];
    let modifiedConstraints = [...constraints];
    
    for (const conflict of conflicts) {
      const resolution = this._selectResolutionStrategy(conflict, context);
      const result = this._applyResolutionStrategy(resolution, modifiedConstraints, conflict);
      
      if (result.success) {
        modifiedConstraints = result.constraints;
        resolutions.push({
          conflict: conflict.id,
          strategy: resolution.name,
          changes: result.changes
        });
      }
    }
    
    return {
      success: resolutions.length > 0,
      constraints: modifiedConstraints,
      resolutions,
      unresolved: conflicts.length - resolutions.length
    };
  }
  
  /**
   * Initialize resolution strategies
   * @private
   */
  _initializeStrategies() {
    // Priority-based resolution
    this.resolutionStrategies.set('priority', {
      name: 'Priority Resolution',
      apply: (constraints, conflict) => this._resolveBypriority(constraints, conflict),
      conditions: (conflict) => conflict.type === 'priority_conflict'
    });
    
    // Weight adjustment resolution
    this.resolutionStrategies.set('weight_adjustment', {
      name: 'Weight Adjustment',
      apply: (constraints, conflict) => this._resolveByWeightAdjustment(constraints, conflict),
      conditions: (conflict) => conflict.type === 'weight_conflict'
    });
    
    // Temporal resolution (for scheduling conflicts)
    this.resolutionStrategies.set('temporal', {
      name: 'Temporal Resolution',
      apply: (constraints, conflict) => this._resolveByTemporal(constraints, conflict),
      conditions: (conflict) => conflict.type === 'temporal_conflict'
    });
    
    // Resource resolution (for venue/facility conflicts)
    this.resolutionStrategies.set('resource', {
      name: 'Resource Resolution',
      apply: (constraints, conflict) => this._resolveByResource(constraints, conflict),
      conditions: (conflict) => conflict.type === 'resource_conflict'
    });
    
    // Compromise resolution (find middle ground)
    this.resolutionStrategies.set('compromise', {
      name: 'Compromise Resolution',
      apply: (constraints, conflict) => this._resolveByCompromise(constraints, conflict),
      conditions: (conflict) => true // Can always try compromise
    });
  }
  
  /**
   * Check for conflict between two constraints
   * @param {Object} constraint1 - First constraint
   * @param {Object} constraint2 - Second constraint
   * @returns {Object|null} Conflict details or null
   * @private
   */
  _checkConstraintConflict(constraint1, constraint2) {
    // Direct type conflicts
    if (this._areDirectlyConflicting(constraint1.type, constraint2.type)) {
      return {
        id: `${constraint1.id}_${constraint2.id}`,
        type: 'direct_conflict',
        constraints: [constraint1.id, constraint2.id],
        severity: 'high',
        description: `${constraint1.type} conflicts with ${constraint2.type}`
      };
    }
    
    // Parameter conflicts
    if (this._haveParameterConflicts(constraint1, constraint2)) {
      return {
        id: `${constraint1.id}_${constraint2.id}`,
        type: 'parameter_conflict',
        constraints: [constraint1.id, constraint2.id],
        severity: 'medium',
        description: 'Conflicting parameters between constraints'
      };
    }
    
    // Resource conflicts
    if (this._haveResourceConflicts(constraint1, constraint2)) {
      return {
        id: `${constraint1.id}_${constraint2.id}`,
        type: 'resource_conflict',
        constraints: [constraint1.id, constraint2.id],
        severity: 'high',
        description: 'Competing for same resources'
      };
    }
    
    return null;
  }
  
  /**
   * Check if constraint types are directly conflicting
   * @param {string} type1 - First constraint type
   * @param {string} type2 - Second constraint type
   * @returns {boolean} True if conflicting
   * @private
   */
  _areDirectlyConflicting(type1, type2) {
    const conflicts = {
      'CONSECUTIVE_HOME_GAMES': ['CONSECUTIVE_AWAY_GAMES'],
      'MAXIMIZE_WEEKENDS': ['MINIMIZE_WEEKENDS'],
      'CLUSTER_GAMES': ['DISTRIBUTE_GAMES'],
      'MINIMIZE_TRAVEL': ['MAXIMIZE_ATTENDANCE']
    };
    
    return conflicts[type1]?.includes(type2) || conflicts[type2]?.includes(type1);
  }
  
  /**
   * Check for parameter conflicts
   * @param {Object} constraint1 - First constraint
   * @param {Object} constraint2 - Second constraint
   * @returns {boolean} True if conflicts exist
   * @private
   */
  _haveParameterConflicts(constraint1, constraint2) {
    // Check for competing numeric parameters
    if (constraint1.parameters && constraint2.parameters) {
      // Example: Both constraints trying to set different max values for same property
      for (const [key, value1] of Object.entries(constraint1.parameters)) {
        const value2 = constraint2.parameters[key];
        if (value2 !== undefined && value1 !== value2) {
          if (key.startsWith('max_') || key.startsWith('min_')) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check for resource conflicts
   * @param {Object} constraint1 - First constraint
   * @param {Object} constraint2 - Second constraint
   * @returns {boolean} True if conflicts exist
   * @private
   */
  _haveResourceConflicts(constraint1, constraint2) {
    // Check if both constraints target the same venue, team, or time slot
    const resources1 = this._extractResources(constraint1);
    const resources2 = this._extractResources(constraint2);
    
    // Check for overlapping resources with different requirements
    for (const resource of resources1) {
      if (resources2.includes(resource)) {
        // Same resource, different requirements = conflict
        if (constraint1.parameters !== constraint2.parameters) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Extract resources from constraint
   * @param {Object} constraint - Constraint to analyze
   * @returns {Array} List of resources
   * @private
   */
  _extractResources(constraint) {
    const resources = [];
    
    if (constraint.parameters) {
      if (constraint.parameters.team) resources.push(`team_${constraint.parameters.team}`);
      if (constraint.parameters.venue) resources.push(`venue_${constraint.parameters.venue}`);
      if (constraint.parameters.date) resources.push(`date_${constraint.parameters.date}`);
      if (constraint.parameters.timeSlot) resources.push(`time_${constraint.parameters.timeSlot}`);
    }
    
    return resources;
  }
  
  /**
   * Select appropriate resolution strategy
   * @param {Object} conflict - Conflict to resolve
   * @param {Object} context - Resolution context
   * @returns {Object} Selected strategy
   * @private
   */
  _selectResolutionStrategy(conflict, context) {
    // Try strategies in order of preference
    for (const [name, strategy] of this.resolutionStrategies) {
      if (strategy.conditions(conflict)) {
        return strategy;
      }
    }
    
    // Fallback to compromise
    return this.resolutionStrategies.get('compromise');
  }
  
  /**
   * Apply resolution strategy
   * @param {Object} strategy - Resolution strategy
   * @param {Array} constraints - Constraints to modify
   * @param {Object} conflict - Conflict to resolve
   * @returns {Object} Resolution result
   * @private
   */
  _applyResolutionStrategy(strategy, constraints, conflict) {
    try {
      const result = strategy.apply(constraints, conflict);
      
      if (result.success) {
        this.resolutionHistory.push({
          timestamp: Date.now(),
          conflict: conflict.id,
          strategy: strategy.name,
          success: true
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to apply resolution strategy ${strategy.name}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Resolve by priority (keep higher priority constraint)
   * @param {Array} constraints - Constraints to modify
   * @param {Object} conflict - Conflict to resolve
   * @returns {Object} Resolution result
   * @private
   */
  _resolveBypriority(constraints, conflict) {
    const [id1, id2] = conflict.constraints;
    const constraint1 = constraints.find(c => c.id === id1);
    const constraint2 = constraints.find(c => c.id === id2);
    
    if (!constraint1 || !constraint2) {
      return { success: false, error: 'Constraints not found' };
    }
    
    // Keep the constraint with higher priority, remove the other
    const toRemove = constraint1.weight > constraint2.weight ? constraint2 : constraint1;
    const newConstraints = constraints.filter(c => c.id !== toRemove.id);
    
    return {
      success: true,
      constraints: newConstraints,
      changes: [`Removed constraint ${toRemove.id} (lower priority)`]
    };
  }
  
  /**
   * Resolve by adjusting weights
   * @param {Array} constraints - Constraints to modify
   * @param {Object} conflict - Conflict to resolve
   * @returns {Object} Resolution result
   * @private
   */
  _resolveByWeightAdjustment(constraints, conflict) {
    const [id1, id2] = conflict.constraints;
    const constraint1 = constraints.find(c => c.id === id1);
    const constraint2 = constraints.find(c => c.id === id2);
    
    if (!constraint1 || !constraint2) {
      return { success: false, error: 'Constraints not found' };
    }
    
    // Adjust weights to reduce conflict
    const newConstraints = constraints.map(c => {
      if (c.id === id1) {
        return { ...c, weight: c.weight * 0.8 };
      } else if (c.id === id2) {
        return { ...c, weight: c.weight * 0.8 };
      }
      return c;
    });
    
    return {
      success: true,
      constraints: newConstraints,
      changes: [`Reduced weights of conflicting constraints by 20%`]
    };
  }
  
  /**
   * Resolve by temporal adjustment
   * @param {Array} constraints - Constraints to modify
   * @param {Object} conflict - Conflict to resolve
   * @returns {Object} Resolution result
   * @private
   */
  _resolveByTemporal(constraints, conflict) {
    // Add time-based flexibility to constraints
    const newConstraints = constraints.map(c => {
      if (conflict.constraints.includes(c.id)) {
        return {
          ...c,
          parameters: {
            ...c.parameters,
            flexibility: (c.parameters.flexibility || 0) + 1
          }
        };
      }
      return c;
    });
    
    return {
      success: true,
      constraints: newConstraints,
      changes: ['Added temporal flexibility to conflicting constraints']
    };
  }
  
  /**
   * Resolve by resource adjustment
   * @param {Array} constraints - Constraints to modify
   * @param {Object} conflict - Conflict to resolve
   * @returns {Object} Resolution result
   * @private
   */
  _resolveByResource(constraints, conflict) {
    // Add resource alternatives or flexibility
    const newConstraints = constraints.map(c => {
      if (conflict.constraints.includes(c.id)) {
        return {
          ...c,
          parameters: {
            ...c.parameters,
            allowAlternatives: true,
            resourceFlexibility: 0.5
          }
        };
      }
      return c;
    });
    
    return {
      success: true,
      constraints: newConstraints,
      changes: ['Added resource flexibility to conflicting constraints']
    };
  }
  
  /**
   * Resolve by compromise
   * @param {Array} constraints - Constraints to modify
   * @param {Object} conflict - Conflict to resolve
   * @returns {Object} Resolution result
   * @private
   */
  _resolveByCompromise(constraints, conflict) {
    // Reduce all conflicting constraints equally
    const newConstraints = constraints.map(c => {
      if (conflict.constraints.includes(c.id)) {
        return {
          ...c,
          weight: c.weight * 0.7,
          parameters: {
            ...c.parameters,
            compromiseApplied: true
          }
        };
      }
      return c;
    });
    
    return {
      success: true,
      constraints: newConstraints,
      changes: ['Applied compromise resolution to conflicting constraints']
    };
  }
  
  /**
   * Detect pattern-based conflicts
   * @param {Array} constraints - Constraints to analyze
   * @returns {Array} Pattern conflicts
   * @private
   */
  _detectPatternConflicts(constraints) {
    const patterns = [];
    
    // Detect over-constraint patterns
    const typeGroups = {};
    constraints.forEach(c => {
      if (!typeGroups[c.category]) typeGroups[c.category] = [];
      typeGroups[c.category].push(c);
    });
    
    for (const [category, categoryConstraints] of Object.entries(typeGroups)) {
      if (categoryConstraints.length > 5) {
        patterns.push({
          id: `over_constrained_${category}`,
          type: 'over_constraint',
          constraints: categoryConstraints.map(c => c.id),
          severity: 'medium',
          description: `Too many constraints in category: ${category}`
        });
      }
    }
    
    return patterns;
  }
}

module.exports = ConstraintResolver;