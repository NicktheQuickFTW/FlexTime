/**
 * Unified Constraint Definition Language (UCDL) - Enhanced Constraint Factory
 * 
 * This module provides factory methods for creating constraints from definitions,
 * validation, registration, discovery, serialization, and migration functionality.
 * 
 * Features:
 * - Dynamic constraint generation from JSON/YAML definitions
 * - Constraint validation with detailed error reporting
 * - Legacy constraint converter with equivalence testing
 * - Constraint registry and discovery system
 * - Template-based constraint generation
 * - Constraint serialization for storage/transmission
 */

const UnifiedConstraint = require('../core/UnifiedConstraint');
const ConstraintMetadata = require('../core/ConstraintMetadata');
const { 
  ConstraintType, 
  ConstraintScope, 
  ConstraintCategory,
  ParameterTypes,
  ConstraintPriority
} = require('../types');
const yaml = require('js-yaml');
const fs = require('fs').promises;

/**
 * Factory for creating and managing constraints
 */
class ConstraintFactory {
  constructor() {
    this.registeredTypes = new Map();
    this.constraintRegistry = new Map();
    this.validationRules = new Map();
    this.templates = new Map();
    
    // Register built-in constraint types
    this.registerBuiltInTypes();
  }

  /**
   * Register a constraint type class
   * @param {string} typeName - Name of the constraint type
   * @param {Class} constraintClass - Constraint class constructor
   * @param {Object} validation - Validation rules for this type
   */
  registerConstraintType(typeName, constraintClass, validation = {}) {
    if (!constraintClass || typeof constraintClass !== 'function') {
      throw new Error('Constraint class must be a constructor function');
    }
    
    this.registeredTypes.set(typeName, constraintClass);
    this.validationRules.set(typeName, validation);
  }

  /**
   * Create constraint from definition
   * @param {Object} definition - Constraint definition
   * @returns {UnifiedConstraint} Created constraint
   */
  createConstraint(definition) {
    this.validateDefinition(definition);
    
    // Get constraint class for the type
    const ConstraintClass = this.getConstraintClass(definition);
    
    // Create the constraint
    const constraint = new ConstraintClass(definition);
    
    // Register the constraint instance
    this.constraintRegistry.set(constraint.id, constraint);
    
    return constraint;
  }

  /**
   * Create constraint from template
   * @param {string} templateName - Name of template to use
   * @param {Object} parameters - Parameters to fill template
   * @returns {UnifiedConstraint} Created constraint
   */
  createFromTemplate(templateName, parameters) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    // Merge template with parameters
    const definition = this.mergeTemplate(template, parameters);
    
    return this.createConstraint(definition);
  }

  /**
   * Bulk create constraints from definitions
   * @param {Array<Object>} definitions - Array of constraint definitions
   * @returns {Array<UnifiedConstraint>} Created constraints
   */
  createConstraints(definitions) {
    const constraints = [];
    const errors = [];
    
    for (let i = 0; i < definitions.length; i++) {
      try {
        const constraint = this.createConstraint(definitions[i]);
        constraints.push(constraint);
      } catch (error) {
        errors.push({
          index: i,
          definition: definitions[i],
          error: error.message
        });
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Failed to create ${errors.length} constraints:\n${
        errors.map(e => `  [${e.index}] ${e.error}`).join('\n')
      }`);
    }
    
    return constraints;
  }

  /**
   * Get constraint class for definition
   * @param {Object} definition - Constraint definition
   * @returns {Class} Constraint class
   */
  getConstraintClass(definition) {
    // Try to find a specific class for the constraint type
    if (definition.constraintType) {
      const ConstraintClass = this.registeredTypes.get(definition.constraintType);
      if (ConstraintClass) {
        return ConstraintClass;
      }
    }
    
    // Try to infer from category and scope
    const typeKey = `${definition.category}_${definition.scope}`;
    const ConstraintClass = this.registeredTypes.get(typeKey);
    if (ConstraintClass) {
      return ConstraintClass;
    }
    
    // Fall back to base UnifiedConstraint
    return UnifiedConstraint;
  }

  /**
   * Validate constraint definition
   * @param {Object} definition - Definition to validate
   * @throws {Error} If definition is invalid
   */
  validateDefinition(definition) {
    if (!definition) {
      throw new Error('Constraint definition is required');
    }
    
    // Basic structure validation
    const required = ['id', 'name', 'type', 'scope', 'category'];
    for (const field of required) {
      if (!definition[field]) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
    
    // Validate enum values
    if (!Object.values(ConstraintType).includes(definition.type)) {
      throw new Error(`Invalid constraint type: ${definition.type}`);
    }
    
    if (!Object.values(ConstraintScope).includes(definition.scope)) {
      throw new Error(`Invalid constraint scope: ${definition.scope}`);
    }
    
    if (!Object.values(ConstraintCategory).includes(definition.category)) {
      throw new Error(`Invalid constraint category: ${definition.category}`);
    }
    
    // Validate ID uniqueness
    if (this.constraintRegistry.has(definition.id)) {
      throw new Error(`Constraint with ID '${definition.id}' already exists`);
    }
    
    // Type-specific validation
    if (definition.constraintType) {
      const validation = this.validationRules.get(definition.constraintType);
      if (validation) {
        this.validateTypeSpecific(definition, validation);
      }
    }
    
    // Parameter validation
    if (definition.parameters) {
      this.validateParameters(definition.parameters, definition);
    }
  }

  /**
   * Validate type-specific rules
   * @param {Object} definition - Constraint definition
   * @param {Object} validation - Validation rules
   */
  validateTypeSpecific(definition, validation) {
    // Required parameters
    if (validation.requiredParameters) {
      for (const param of validation.requiredParameters) {
        if (!definition.parameters || !(param in definition.parameters)) {
          throw new Error(`Required parameter '${param}' is missing`);
        }
      }
    }
    
    // Parameter types
    if (validation.parameterTypes && definition.parameters) {
      for (const [param, expectedType] of Object.entries(validation.parameterTypes)) {
        if (param in definition.parameters) {
          const actualType = typeof definition.parameters[param];
          if (actualType !== expectedType) {
            throw new Error(`Parameter '${param}' should be ${expectedType}, got ${actualType}`);
          }
        }
      }
    }
    
    // Custom validation function
    if (validation.customValidator) {
      const result = validation.customValidator(definition);
      if (!result.valid) {
        throw new Error(`Validation failed: ${result.message}`);
      }
    }
  }

  /**
   * Validate constraint parameters
   * @param {Object} parameters - Parameters to validate
   * @param {Object} definition - Full definition for context
   */
  validateParameters(parameters, definition) {
    for (const [key, value] of Object.entries(parameters)) {
      if (value === null || value === undefined) {
        throw new Error(`Parameter '${key}' cannot be null or undefined`);
      }
      
      // Type-specific parameter validation could go here
      if (key.includes('Date') || key.includes('date')) {
        if (typeof value === 'string') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Parameter '${key}' is not a valid date: ${value}`);
          }
        }
      }
    }
  }

  /**
   * Register a constraint template
   * @param {string} name - Template name
   * @param {Object} template - Template definition
   */
  registerTemplate(name, template) {
    this.validateTemplateDefinition(template);
    this.templates.set(name, template);
  }

  /**
   * Validate template definition
   * @param {Object} template - Template to validate
   */
  validateTemplateDefinition(template) {
    if (!template.name || !template.category || !template.scope) {
      throw new Error('Template must have name, category, and scope');
    }
    
    if (!template.parameters || typeof template.parameters !== 'object') {
      throw new Error('Template must have parameters object');
    }
  }

  /**
   * Merge template with parameters
   * @param {Object} template - Template definition
   * @param {Object} parameters - Parameters to merge
   * @returns {Object} Merged definition
   */
  mergeTemplate(template, parameters) {
    const definition = {
      ...template,
      id: parameters.id || `${template.name}_${Date.now()}`,
      parameters: {
        ...template.parameters,
        ...parameters
      }
    };
    
    // Replace parameter placeholders in template
    const merged = this.replacePlaceholders(definition, parameters);
    
    return merged;
  }

  /**
   * Replace placeholders in template
   * @param {Object} obj - Object to process
   * @param {Object} parameters - Replacement parameters
   * @returns {Object} Processed object
   */
  replacePlaceholders(obj, parameters) {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return parameters[key] !== undefined ? parameters[key] : match;
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replacePlaceholders(item, parameters));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replacePlaceholders(value, parameters);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Discover constraints by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array<UnifiedConstraint>} Found constraints
   */
  discoverConstraints(criteria = {}) {
    const results = [];
    
    for (const constraint of this.constraintRegistry.values()) {
      if (this.matchesCriteria(constraint, criteria)) {
        results.push(constraint);
      }
    }
    
    return results;
  }

  /**
   * Check if constraint matches criteria
   * @param {UnifiedConstraint} constraint - Constraint to check
   * @param {Object} criteria - Criteria to match
   * @returns {boolean} True if matches
   */
  matchesCriteria(constraint, criteria) {
    for (const [key, value] of Object.entries(criteria)) {
      switch (key) {
        case 'type':
          if (constraint.type !== value) return false;
          break;
        case 'scope':
          if (constraint.scope !== value) return false;
          break;
        case 'category':
          if (constraint.category !== value) return false;
          break;
        case 'sport':
          if (constraint.metadata?.sport && constraint.metadata.sport !== value) return false;
          break;
        case 'tags':
          if (!Array.isArray(value)) value = [value];
          if (!value.every(tag => constraint.metadata?.tags?.includes(tag))) return false;
          break;
        case 'isActive':
          if (constraint.isActive !== value) return false;
          break;
        default:
          // Check parameters
          if (constraint.parameters?.[key] !== value) return false;
      }
    }
    
    return true;
  }

  /**
   * Get constraint by ID
   * @param {string} id - Constraint ID
   * @returns {UnifiedConstraint|null} Constraint or null
   */
  getConstraint(id) {
    return this.constraintRegistry.get(id) || null;
  }

  /**
   * Remove constraint from registry
   * @param {string} id - Constraint ID
   * @returns {boolean} True if removed
   */
  removeConstraint(id) {
    return this.constraintRegistry.delete(id);
  }

  /**
   * Get all registered constraint types
   * @returns {Array<string>} Constraint type names
   */
  getRegisteredTypes() {
    return Array.from(this.registeredTypes.keys());
  }

  /**
   * Get all registered templates
   * @returns {Array<string>} Template names
   */
  getRegisteredTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Clear all registered constraints
   */
  clear() {
    this.constraintRegistry.clear();
  }

  /**
   * Register built-in constraint types
   */
  registerBuiltInTypes() {
    // Base constraint types
    this.registerConstraintType('unified_constraint', UnifiedConstraint);
    
    // Register built-in templates
    this.registerBuiltInTemplates();
  }

  /**
   * Register built-in constraint templates
   */
  registerBuiltInTemplates() {
    // Temporal constraint templates
    this.registerTemplate('rest_days', {
      name: 'Rest Days Between Games',
      description: 'Minimum rest days required between games for a team',
      category: ConstraintCategory.WELLNESS,
      scope: ConstraintScope.TEAM,
      type: ConstraintType.SOFT,
      parameters: {
        minRestDays: '{{minRestDays}}',
        teamId: '{{teamId}}',
        sportType: '{{sportType}}'
      },
      metadata: {
        sport: '{{sportType}}',
        tags: ['wellness', 'rest', 'recovery']
      }
    });

    this.registerTemplate('venue_availability', {
      name: 'Venue Availability Window',
      description: 'Ensure venue is available during specified time windows',
      category: ConstraintCategory.SPATIAL,
      scope: ConstraintScope.VENUE,
      type: ConstraintType.HARD,
      parameters: {
        venueId: '{{venueId}}',
        availableFrom: '{{availableFrom}}',
        availableTo: '{{availableTo}}',
        daysOfWeek: '{{daysOfWeek}}'
      },
      metadata: {
        tags: ['venue', 'availability', 'scheduling']
      }
    });

    this.registerTemplate('max_consecutive_home', {
      name: 'Maximum Consecutive Home Games',
      description: 'Limit consecutive home games for competitive balance',
      category: ConstraintCategory.COMPETITIVE,
      scope: ConstraintScope.TEAM,
      type: ConstraintType.SOFT,
      parameters: {
        maxConsecutive: '{{maxConsecutive}}',
        teamId: '{{teamId}}',
        penalty: '{{penalty}}'
      },
      metadata: {
        tags: ['competitive', 'balance', 'home-away']
      }
    });

    this.registerTemplate('championship_date', {
      name: 'Championship Date Constraint',
      description: 'Fixed date for championship/tournament games',
      category: ConstraintCategory.TOURNAMENT,
      scope: ConstraintScope.GLOBAL,
      type: ConstraintType.HARD,
      parameters: {
        championshipDate: '{{championshipDate}}',
        sportType: '{{sportType}}',
        venue: '{{venue}}'
      },
      metadata: {
        sport: '{{sportType}}',
        tags: ['championship', 'tournament', 'fixed-date']
      }
    });
  }

  /**
   * Export constraint definitions
   * @param {Array<string>} ids - Constraint IDs to export (all if not specified)
   * @returns {Array<Object>} Constraint definitions
   */
  exportDefinitions(ids = null) {
    const constraints = ids ? 
      ids.map(id => this.getConstraint(id)).filter(Boolean) :
      Array.from(this.constraintRegistry.values());
    
    return constraints.map(constraint => constraint.toObject());
  }

  /**
   * Import constraint definitions
   * @param {Array<Object>} definitions - Definitions to import
   * @param {Object} options - Import options
   * @returns {Object} Import results
   */
  importDefinitions(definitions, options = {}) {
    const results = {
      imported: [],
      skipped: [],
      errors: []
    };
    
    for (const definition of definitions) {
      try {
        // Check if constraint already exists
        if (this.constraintRegistry.has(definition.id)) {
          if (options.skipExisting) {
            results.skipped.push(definition.id);
            continue;
          } else if (options.overwrite) {
            this.removeConstraint(definition.id);
          } else {
            throw new Error(`Constraint ${definition.id} already exists`);
          }
        }
        
        const constraint = this.createConstraint(definition);
        results.imported.push(constraint.id);
      } catch (error) {
        results.errors.push({
          id: definition.id,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = ConstraintFactory;