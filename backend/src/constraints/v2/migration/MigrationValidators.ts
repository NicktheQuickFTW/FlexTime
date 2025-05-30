/**
 * Migration Validators - Validate migrated constraints for UCDL compliance
 * 
 * Provides comprehensive validation including:
 * - Structure validation
 * - Type checking
 * - Business logic validation
 * - Cross-reference validation
 * - Performance impact assessment
 */

import {
  ConstraintType,
  ConstraintScope,
  ConstraintCategory,
  ConstraintPriority,
  ResolutionStrategy,
  TemporalPattern,
  ParameterTypes,
  EvaluationResult
} from '../../ucdl/types';

// Validation result structure
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100 quality score
  details: {
    structureValid: boolean;
    typesValid: boolean;
    logicValid: boolean;
    performanceImpact: 'low' | 'medium' | 'high';
    completeness: number; // 0-100
  };
}

// Individual validation check result
interface ValidationCheck {
  name: string;
  passed: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

// UCDL constraint interface for validation
interface UCDLConstraint {
  id: string;
  name: string;
  description: string;
  version: string;
  type: ConstraintType;
  scope: ConstraintScope;
  category: ConstraintCategory;
  priority: ConstraintPriority;
  parameters: Record<string, any>;
  conditions: any[];
  weight: number;
  penalty: number;
  resolutionStrategy: ResolutionStrategy;
  fallbackOptions: any[];
  metadata: {
    created: string;
    lastModified: string;
    author: string;
    tags: string[];
    [key: string]: any;
  };
  isActive: boolean;
  dependsOn: string[];
  affects: string[];
}

/**
 * Comprehensive validator for migrated constraints
 */
export class MigrationValidators {
  private requiredFields: string[];
  private validEnumValues: Map<string, any[]>;
  private commonPatterns: Map<string, RegExp>;
  
  constructor() {
    // Define required fields for valid UCDL constraint
    this.requiredFields = [
      'id', 'name', 'description', 'version', 'type', 'scope', 
      'category', 'priority', 'parameters', 'weight', 'metadata'
    ];
    
    // Define valid enum values
    this.validEnumValues = new Map([
      ['type', Object.values(ConstraintType)],
      ['scope', Object.values(ConstraintScope)],
      ['category', Object.values(ConstraintCategory)],
      ['priority', Object.values(ConstraintPriority)],
      ['resolutionStrategy', Object.values(ResolutionStrategy)]
    ]);
    
    // Common validation patterns
    this.commonPatterns = new Map([
      ['id', /^[a-zA-Z0-9_-]+$/],
      ['version', /^\d+\.\d+\.\d+$/],
      ['isoDate', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/],
      ['time', /^([01]\d|2[0-3]):([0-5]\d)$/]
    ]);
  }

  /**
   * Validate a single constraint
   */
  async validateConstraint(constraint: any): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Perform all validation checks
    checks.push(...this.validateStructure(constraint));
    checks.push(...this.validateTypes(constraint));
    checks.push(...this.validateBusinessLogic(constraint));
    checks.push(...this.validateParameters(constraint));
    checks.push(...this.validateConditions(constraint));
    checks.push(...this.validateMetadata(constraint));
    checks.push(...this.validateDependencies(constraint));
    checks.push(...this.assessPerformanceImpact(constraint));
    
    // Process check results
    checks.forEach(check => {
      if (!check.passed) {
        const message = `${check.name}: ${check.message}`;
        
        switch (check.severity) {
          case 'error':
            errors.push(message);
            break;
          case 'warning':
            warnings.push(message);
            break;
          case 'info':
            suggestions.push(message);
            break;
        }
      }
    });
    
    // Calculate quality score
    const errorWeight = 10;
    const warningWeight = 3;
    const maxScore = 100;
    const deductions = (errors.length * errorWeight) + (warnings.length * warningWeight);
    const score = Math.max(0, maxScore - deductions);
    
    // Calculate completeness
    const completeness = this.calculateCompleteness(constraint);
    
    // Determine performance impact
    const performanceImpact = this.determinePerformanceImpact(constraint);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
      details: {
        structureValid: checks.filter(c => c.name.startsWith('structure')).every(c => c.passed),
        typesValid: checks.filter(c => c.name.startsWith('type')).every(c => c.passed),
        logicValid: checks.filter(c => c.name.startsWith('logic')).every(c => c.passed),
        performanceImpact,
        completeness
      }
    };
  }

  /**
   * Validate batch of constraints
   */
  async validateBatch(constraints: any[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    // Validate each constraint
    for (const constraint of constraints) {
      const result = await this.validateConstraint(constraint);
      results.set(constraint.id || 'unknown', result);
    }
    
    // Perform cross-constraint validation
    const crossValidation = this.validateCrossConstraints(constraints);
    
    // Add cross-validation results
    crossValidation.forEach((issues, constraintId) => {
      const result = results.get(constraintId);
      if (result) {
        result.warnings.push(...issues.warnings);
        result.errors.push(...issues.errors);
      }
    });
    
    return results;
  }

  /**
   * Validate constraint structure
   */
  private validateStructure(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check required fields
    for (const field of this.requiredFields) {
      checks.push({
        name: `structure.${field}`,
        passed: constraint.hasOwnProperty(field) && constraint[field] !== undefined,
        message: `Missing required field: ${field}`,
        severity: 'error'
      });
    }
    
    // Check field types
    checks.push({
      name: 'structure.id_format',
      passed: typeof constraint.id === 'string' && this.commonPatterns.get('id')!.test(constraint.id),
      message: 'ID must be a valid string with alphanumeric characters, hyphens, and underscores',
      severity: 'error'
    });
    
    checks.push({
      name: 'structure.version_format',
      passed: typeof constraint.version === 'string' && this.commonPatterns.get('version')!.test(constraint.version),
      message: 'Version must follow semantic versioning (e.g., 1.0.0)',
      severity: 'warning'
    });
    
    checks.push({
      name: 'structure.weight_range',
      passed: typeof constraint.weight === 'number' && constraint.weight >= 0 && constraint.weight <= 10,
      message: 'Weight must be a number between 0 and 10',
      severity: 'error'
    });
    
    checks.push({
      name: 'structure.arrays',
      passed: Array.isArray(constraint.conditions) && 
              Array.isArray(constraint.fallbackOptions) && 
              Array.isArray(constraint.dependsOn) && 
              Array.isArray(constraint.affects),
      message: 'conditions, fallbackOptions, dependsOn, and affects must be arrays',
      severity: 'error'
    });
    
    return checks;
  }

  /**
   * Validate field types
   */
  private validateTypes(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Validate enum values
    for (const [field, validValues] of this.validEnumValues) {
      if (constraint.hasOwnProperty(field)) {
        checks.push({
          name: `type.${field}`,
          passed: validValues.includes(constraint[field]),
          message: `Invalid ${field} value: ${constraint[field]}. Must be one of: ${validValues.join(', ')}`,
          severity: 'error'
        });
      }
    }
    
    // Validate priority range
    checks.push({
      name: 'type.priority_range',
      passed: Number.isInteger(constraint.priority) && 
              constraint.priority >= 1 && 
              constraint.priority <= 5,
      message: 'Priority must be an integer between 1 and 5',
      severity: 'error'
    });
    
    // Validate boolean fields
    checks.push({
      name: 'type.isActive',
      passed: typeof constraint.isActive === 'boolean',
      message: 'isActive must be a boolean',
      severity: 'error'
    });
    
    return checks;
  }

  /**
   * Validate business logic
   */
  private validateBusinessLogic(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Hard constraints should have high penalty
    if (constraint.type === ConstraintType.HARD) {
      checks.push({
        name: 'logic.hard_constraint_penalty',
        passed: constraint.penalty >= 100,
        message: 'Hard constraints should have a penalty of at least 100',
        severity: 'warning'
      });
    }
    
    // Soft constraints should have reasonable weight
    if (constraint.type === ConstraintType.SOFT) {
      checks.push({
        name: 'logic.soft_constraint_weight',
        passed: constraint.weight > 0 && constraint.weight <= 5,
        message: 'Soft constraints should have a weight between 0 and 5',
        severity: 'warning'
      });
    }
    
    // Critical priority should be hard constraint
    if (constraint.priority === ConstraintPriority.CRITICAL) {
      checks.push({
        name: 'logic.critical_must_be_hard',
        passed: constraint.type === ConstraintType.HARD,
        message: 'Critical priority constraints should be hard constraints',
        severity: 'warning'
      });
    }
    
    // Tournament scope should have appropriate category
    if (constraint.scope === ConstraintScope.TOURNAMENT) {
      const validCategories = [
        ConstraintCategory.TEMPORAL,
        ConstraintCategory.COMPETITIVE,
        ConstraintCategory.REGULATORY
      ];
      
      checks.push({
        name: 'logic.tournament_category',
        passed: validCategories.includes(constraint.category),
        message: 'Tournament constraints should typically be temporal, competitive, or regulatory',
        severity: 'info'
      });
    }
    
    return checks;
  }

  /**
   * Validate parameters
   */
  private validateParameters(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    if (!constraint.parameters || typeof constraint.parameters !== 'object') {
      checks.push({
        name: 'parameters.valid_object',
        passed: false,
        message: 'Parameters must be a valid object',
        severity: 'error'
      });
      return checks;
    }
    
    // Validate parameter structure
    Object.entries(constraint.parameters).forEach(([key, param]: [string, any]) => {
      if (param && typeof param === 'object' && param.type) {
        // Validate parameter type
        checks.push({
          name: `parameters.${key}.type`,
          passed: Object.values(ParameterTypes).includes(param.type),
          message: `Invalid parameter type for ${key}: ${param.type}`,
          severity: 'error'
        });
        
        // Validate parameter value matches type
        if (param.value !== undefined) {
          const typeCheck = this.validateParameterValue(param.type, param.value);
          checks.push({
            name: `parameters.${key}.value`,
            passed: typeCheck.valid,
            message: typeCheck.message,
            severity: 'warning'
          });
        }
        
        // Check required flag
        checks.push({
          name: `parameters.${key}.required`,
          passed: typeof param.required === 'boolean',
          message: `Parameter ${key} should have a boolean 'required' field`,
          severity: 'info'
        });
      }
    });
    
    return checks;
  }

  /**
   * Validate parameter value against type
   */
  private validateParameterValue(type: string, value: any): { valid: boolean; message: string } {
    switch (type) {
      case ParameterTypes.INTEGER:
        return {
          valid: Number.isInteger(value),
          message: `Value should be an integer, got ${typeof value}`
        };
        
      case ParameterTypes.FLOAT:
        return {
          valid: typeof value === 'number',
          message: `Value should be a number, got ${typeof value}`
        };
        
      case ParameterTypes.BOOLEAN:
        return {
          valid: typeof value === 'boolean',
          message: `Value should be a boolean, got ${typeof value}`
        };
        
      case ParameterTypes.DATE:
        return {
          valid: typeof value === 'string' && !isNaN(Date.parse(value)),
          message: `Value should be a valid date string`
        };
        
      case ParameterTypes.TIME:
        return {
          valid: typeof value === 'string' && this.commonPatterns.get('time')!.test(value),
          message: `Value should be a valid time string (HH:MM)`
        };
        
      case ParameterTypes.ARRAY:
        return {
          valid: Array.isArray(value),
          message: `Value should be an array`
        };
        
      case ParameterTypes.OBJECT:
        return {
          valid: typeof value === 'object' && value !== null && !Array.isArray(value),
          message: `Value should be an object`
        };
        
      default:
        return { valid: true, message: '' };
    }
  }

  /**
   * Validate conditions
   */
  private validateConditions(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    if (!Array.isArray(constraint.conditions)) {
      return checks;
    }
    
    constraint.conditions.forEach((condition: any, index: number) => {
      // Check condition structure
      checks.push({
        name: `conditions[${index}].structure`,
        passed: condition && typeof condition === 'object' && condition.type,
        message: `Condition at index ${index} must have a type`,
        severity: 'error'
      });
      
      // Validate specific condition types
      if (condition.type === 'temporal' && condition.pattern) {
        checks.push({
          name: `conditions[${index}].temporal_pattern`,
          passed: Object.values(TemporalPattern).includes(condition.pattern),
          message: `Invalid temporal pattern: ${condition.pattern}`,
          severity: 'error'
        });
      }
      
      if (condition.type === 'filter') {
        checks.push({
          name: `conditions[${index}].filter_fields`,
          passed: condition.field && condition.operator && condition.value !== undefined,
          message: `Filter condition at index ${index} must have field, operator, and value`,
          severity: 'error'
        });
      }
    });
    
    return checks;
  }

  /**
   * Validate metadata
   */
  private validateMetadata(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    if (!constraint.metadata || typeof constraint.metadata !== 'object') {
      checks.push({
        name: 'metadata.valid_object',
        passed: false,
        message: 'Metadata must be a valid object',
        severity: 'error'
      });
      return checks;
    }
    
    // Check required metadata fields
    const requiredMetaFields = ['created', 'lastModified', 'author', 'tags'];
    
    requiredMetaFields.forEach(field => {
      checks.push({
        name: `metadata.${field}`,
        passed: constraint.metadata.hasOwnProperty(field),
        message: `Missing metadata field: ${field}`,
        severity: 'warning'
      });
    });
    
    // Validate date formats
    if (constraint.metadata.created) {
      checks.push({
        name: 'metadata.created_format',
        passed: this.commonPatterns.get('isoDate')!.test(constraint.metadata.created),
        message: 'Created date should be in ISO format',
        severity: 'warning'
      });
    }
    
    if (constraint.metadata.lastModified) {
      checks.push({
        name: 'metadata.lastModified_format',
        passed: this.commonPatterns.get('isoDate')!.test(constraint.metadata.lastModified),
        message: 'Last modified date should be in ISO format',
        severity: 'warning'
      });
    }
    
    // Validate tags
    if (constraint.metadata.tags) {
      checks.push({
        name: 'metadata.tags_array',
        passed: Array.isArray(constraint.metadata.tags) && 
                constraint.metadata.tags.every((tag: any) => typeof tag === 'string'),
        message: 'Tags must be an array of strings',
        severity: 'warning'
      });
    }
    
    return checks;
  }

  /**
   * Validate dependencies
   */
  private validateDependencies(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check dependency format
    if (constraint.dependsOn && constraint.dependsOn.length > 0) {
      constraint.dependsOn.forEach((dep: any, index: number) => {
        checks.push({
          name: `dependencies.dependsOn[${index}]`,
          passed: typeof dep === 'string' && this.commonPatterns.get('id')!.test(dep),
          message: `Invalid dependency ID format at index ${index}`,
          severity: 'error'
        });
      });
    }
    
    // Check affects format
    if (constraint.affects && constraint.affects.length > 0) {
      constraint.affects.forEach((affected: any, index: number) => {
        checks.push({
          name: `dependencies.affects[${index}]`,
          passed: typeof affected === 'string' && this.commonPatterns.get('id')!.test(affected),
          message: `Invalid affected constraint ID format at index ${index}`,
          severity: 'error'
        });
      });
    }
    
    // Warn about circular dependencies (would need full constraint set to fully validate)
    if (constraint.dependsOn && constraint.affects) {
      const overlap = constraint.dependsOn.filter((dep: string) => 
        constraint.affects.includes(dep)
      );
      
      if (overlap.length > 0) {
        checks.push({
          name: 'dependencies.circular_risk',
          passed: false,
          message: `Potential circular dependency with: ${overlap.join(', ')}`,
          severity: 'warning'
        });
      }
    }
    
    return checks;
  }

  /**
   * Assess performance impact
   */
  private assessPerformanceImpact(constraint: any): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    let impactScore = 0;
    
    // Factors that increase performance impact
    if (constraint.scope === ConstraintScope.GLOBAL) impactScore += 3;
    if (constraint.type === ConstraintType.HARD) impactScore += 2;
    if (constraint.conditions && constraint.conditions.length > 5) impactScore += 2;
    if (constraint.dependsOn && constraint.dependsOn.length > 3) impactScore += 1;
    
    // Complex parameter evaluation
    const paramCount = Object.keys(constraint.parameters || {}).length;
    if (paramCount > 10) impactScore += 2;
    
    // Check for expensive operations in conditions
    if (constraint.conditions) {
      const hasComplexConditions = constraint.conditions.some((c: any) => 
        c.type === 'complex' || c.operator === 'custom'
      );
      if (hasComplexConditions) impactScore += 3;
    }
    
    // Performance warnings
    if (impactScore >= 8) {
      checks.push({
        name: 'performance.high_impact',
        passed: false,
        message: 'This constraint may have high performance impact',
        severity: 'warning'
      });
    }
    
    if (constraint.scope === ConstraintScope.GLOBAL && constraint.type === ConstraintType.HARD) {
      checks.push({
        name: 'performance.global_hard',
        passed: false,
        message: 'Global hard constraints can significantly impact performance',
        severity: 'warning'
      });
    }
    
    return checks;
  }

  /**
   * Calculate constraint completeness score
   */
  private calculateCompleteness(constraint: any): number {
    let score = 0;
    const maxScore = 100;
    
    // Required fields (50 points)
    const requiredFieldScore = 50 / this.requiredFields.length;
    this.requiredFields.forEach(field => {
      if (constraint[field] !== undefined && constraint[field] !== null) {
        score += requiredFieldScore;
      }
    });
    
    // Optional but recommended fields (30 points)
    const recommendedFields = [
      'description',
      'fallbackOptions',
      'resolutionStrategy',
      'metadata.documentation',
      'metadata.tags'
    ];
    
    const recommendedScore = 30 / recommendedFields.length;
    recommendedFields.forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], constraint)
        : constraint[field];
        
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) ? value.length > 0 : true) {
          score += recommendedScore;
        }
      }
    });
    
    // Quality indicators (20 points)
    if (constraint.description && constraint.description.length > 50) score += 5;
    if (constraint.conditions && constraint.conditions.length > 0) score += 5;
    if (constraint.parameters && Object.keys(constraint.parameters).length > 0) score += 5;
    if (constraint.metadata?.documentation) score += 5;
    
    return Math.round(Math.min(score, maxScore));
  }

  /**
   * Determine performance impact level
   */
  private determinePerformanceImpact(constraint: any): 'low' | 'medium' | 'high' {
    let impactScore = 0;
    
    // Scope impact
    switch (constraint.scope) {
      case ConstraintScope.GLOBAL: impactScore += 3; break;
      case ConstraintScope.SPORT: impactScore += 2; break;
      case ConstraintScope.TEAM: impactScore += 1; break;
    }
    
    // Type impact
    if (constraint.type === ConstraintType.HARD) impactScore += 2;
    
    // Complexity impact
    const conditionCount = constraint.conditions?.length || 0;
    const paramCount = Object.keys(constraint.parameters || {}).length;
    const dependencyCount = constraint.dependsOn?.length || 0;
    
    impactScore += Math.floor(conditionCount / 3);
    impactScore += Math.floor(paramCount / 5);
    impactScore += Math.floor(dependencyCount / 2);
    
    if (impactScore >= 8) return 'high';
    if (impactScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Validate cross-constraint relationships
   */
  private validateCrossConstraints(
    constraints: any[]
  ): Map<string, { errors: string[]; warnings: string[] }> {
    const issues = new Map<string, { errors: string[]; warnings: string[] }>();
    const constraintMap = new Map(constraints.map(c => [c.id, c]));
    
    constraints.forEach(constraint => {
      const constraintIssues = { errors: [], warnings: [] };
      
      // Validate dependencies exist
      if (constraint.dependsOn) {
        constraint.dependsOn.forEach((depId: string) => {
          if (!constraintMap.has(depId)) {
            constraintIssues.errors.push(`Dependency '${depId}' not found`);
          }
        });
      }
      
      // Check for circular dependencies
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
      if (this.hasCyclicDependency(constraint.id, constraintMap, visited, recursionStack)) {
        constraintIssues.errors.push('Circular dependency detected');
      }
      
      // Check for conflicting constraints
      constraints.forEach(other => {
        if (other.id !== constraint.id) {
          const conflict = this.detectConflict(constraint, other);
          if (conflict) {
            constraintIssues.warnings.push(`Potential conflict with constraint '${other.id}': ${conflict}`);
          }
        }
      });
      
      if (constraintIssues.errors.length > 0 || constraintIssues.warnings.length > 0) {
        issues.set(constraint.id, constraintIssues);
      }
    });
    
    return issues;
  }

  /**
   * Check for cyclic dependencies
   */
  private hasCyclicDependency(
    constraintId: string,
    constraintMap: Map<string, any>,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(constraintId);
    recursionStack.add(constraintId);
    
    const constraint = constraintMap.get(constraintId);
    if (constraint?.dependsOn) {
      for (const depId of constraint.dependsOn) {
        if (!visited.has(depId)) {
          if (this.hasCyclicDependency(depId, constraintMap, visited, recursionStack)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(constraintId);
    return false;
  }

  /**
   * Detect potential conflicts between constraints
   */
  private detectConflict(constraint1: any, constraint2: any): string | null {
    // Check for same scope and conflicting types
    if (constraint1.scope === constraint2.scope) {
      // Both hard constraints on same entity could conflict
      if (constraint1.type === ConstraintType.HARD && 
          constraint2.type === ConstraintType.HARD &&
          constraint1.category === constraint2.category) {
        return 'Both are hard constraints in the same category and scope';
      }
    }
    
    // Check for conflicting temporal constraints
    if (constraint1.category === ConstraintCategory.TEMPORAL && 
        constraint2.category === ConstraintCategory.TEMPORAL) {
      // Would need deeper analysis of conditions here
      if (constraint1.scope === constraint2.scope) {
        return 'Multiple temporal constraints on same scope may conflict';
      }
    }
    
    return null;
  }
}

export default MigrationValidators;