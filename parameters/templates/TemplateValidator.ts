// Template Validator - Comprehensive validation for constraint templates
// Version 2.0 - Ensures template integrity and correctness

import {
  ConstraintTemplate,
  TemplateCategory,
  ParameterDefinition,
  TemplateInstance,
  ScopeOptions
} from './ConstraintTemplateSystem';
import { 
  ConstraintType, 
  ConstraintHardness,
  ConstraintScope,
  ConstraintParameters
} from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (template: ConstraintTemplate) => ValidationIssue[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  field?: string;
}

export class TemplateValidator {
  private rules: Map<string, ValidationRule>;
  private evaluatorPatterns: Map<string, RegExp>;

  constructor() {
    this.initializeRules();
    this.initializeEvaluatorPatterns();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    this.rules = new Map([
      ['basic-fields', {
        name: 'Basic Fields Validation',
        description: 'Validates required basic fields',
        validate: this.validateBasicFields.bind(this)
      }],
      ['parameter-definitions', {
        name: 'Parameter Definitions Validation',
        description: 'Validates parameter structure and consistency',
        validate: this.validateParameterDefinitions.bind(this)
      }],
      ['evaluator-template', {
        name: 'Evaluator Template Validation',
        description: 'Validates evaluator code structure',
        validate: this.validateEvaluatorTemplate.bind(this)
      }],
      ['scope-options', {
        name: 'Scope Options Validation',
        description: 'Validates scope configuration',
        validate: this.validateScopeOptions.bind(this)
      }],
      ['examples', {
        name: 'Examples Validation',
        description: 'Validates example configurations',
        validate: this.validateExamples.bind(this)
      }],
      ['metadata', {
        name: 'Metadata Validation',
        description: 'Validates metadata fields',
        validate: this.validateMetadata.bind(this)
      }],
      ['naming-conventions', {
        name: 'Naming Conventions',
        description: 'Checks naming patterns and conventions',
        validate: this.validateNamingConventions.bind(this)
      }],
      ['security', {
        name: 'Security Validation',
        description: 'Checks for security issues in evaluator code',
        validate: this.validateSecurity.bind(this)
      }]
    ]);
  }

  /**
   * Initialize evaluator code patterns
   */
  private initializeEvaluatorPatterns(): void {
    this.evaluatorPatterns = new Map([
      ['parameter-placeholder', /\{\{(\w+)\}\}/g],
      ['return-statement', /return\s+\{[\s\S]*constraintId[\s\S]*status[\s\S]*satisfied[\s\S]*score[\s\S]*message[\s\S]*\}/],
      ['violations-array', /violations\s*=\s*\[\]/],
      ['dangerous-functions', /(eval|Function|setTimeout|setInterval|require|import|fetch|XMLHttpRequest)/g],
      ['file-operations', /(readFile|writeFile|appendFile|unlink|mkdir|rmdir)/g],
      ['network-operations', /(http|https|net|dgram)\.|\.(get|post|put|delete|request)\(/g]
    ]);
  }

  /**
   * Validate a complete template
   */
  public validateTemplate(template: ConstraintTemplate): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Run all validation rules
    this.rules.forEach(rule => {
      const ruleIssues = rule.validate(template);
      issues.push(...ruleIssues);
    });

    // Separate issues by type
    const errors = issues.filter(i => i.type === 'error').map(i => i.message);
    const warnings = issues.filter(i => i.type === 'warning').map(i => i.message);
    const suggestions = issues.filter(i => i.type === 'suggestion').map(i => i.message);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate a template instance against its template
   */
  public validateTemplateInstance(
    template: ConstraintTemplate,
    instance: TemplateInstance
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate template ID match
    if (instance.templateId !== template.id) {
      errors.push(`Template ID mismatch: ${instance.templateId} vs ${template.id}`);
    }

    // Validate parameters
    const paramResult = this.validateInstanceParameters(template, instance.parameters);
    errors.push(...paramResult.errors);
    warnings.push(...paramResult.warnings);

    // Validate scope
    const scopeResult = this.validateInstanceScope(template, instance.scope);
    errors.push(...scopeResult.errors);
    warnings.push(...scopeResult.warnings);

    // Validate hardness
    if (!Object.values(ConstraintHardness).includes(instance.hardness)) {
      errors.push(`Invalid hardness value: ${instance.hardness}`);
    }

    // Validate weight
    if (instance.weight < 0 || instance.weight > 100) {
      errors.push(`Weight must be between 0 and 100, got: ${instance.weight}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate basic template fields
   */
  private validateBasicFields(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Required fields
    if (!template.id || template.id.trim() === '') {
      issues.push({ type: 'error', message: 'Template ID is required', field: 'id' });
    }

    if (!template.name || template.name.trim() === '') {
      issues.push({ type: 'error', message: 'Template name is required', field: 'name' });
    }

    if (!template.description || template.description.trim() === '') {
      issues.push({ type: 'error', message: 'Template description is required', field: 'description' });
    }

    // Enum validations
    if (!Object.values(TemplateCategory).includes(template.category)) {
      issues.push({ type: 'error', message: `Invalid category: ${template.category}`, field: 'category' });
    }

    if (!Object.values(ConstraintType).includes(template.type)) {
      issues.push({ type: 'error', message: `Invalid type: ${template.type}`, field: 'type' });
    }

    if (!Object.values(ConstraintHardness).includes(template.defaultHardness)) {
      issues.push({ type: 'error', message: `Invalid default hardness: ${template.defaultHardness}`, field: 'defaultHardness' });
    }

    // Length validations
    if (template.name && template.name.length > 100) {
      issues.push({ type: 'warning', message: 'Template name is very long (>100 chars)', field: 'name' });
    }

    if (template.description && template.description.length < 20) {
      issues.push({ type: 'warning', message: 'Template description is very short (<20 chars)', field: 'description' });
    }

    return issues;
  }

  /**
   * Validate parameter definitions
   */
  private validateParameterDefinitions(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const paramNames = new Set<string>();

    if (!Array.isArray(template.parameterDefinitions)) {
      issues.push({ type: 'error', message: 'Parameter definitions must be an array', field: 'parameterDefinitions' });
      return issues;
    }

    template.parameterDefinitions.forEach((param, index) => {
      // Check for duplicate names
      if (paramNames.has(param.name)) {
        issues.push({ 
          type: 'error', 
          message: `Duplicate parameter name: ${param.name}`, 
          field: `parameterDefinitions[${index}]` 
        });
      }
      paramNames.add(param.name);

      // Validate parameter structure
      if (!param.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
        issues.push({ 
          type: 'error', 
          message: `Invalid parameter name: ${param.name}`, 
          field: `parameterDefinitions[${index}].name` 
        });
      }

      if (!['number', 'string', 'boolean', 'date', 'array', 'enum'].includes(param.type)) {
        issues.push({ 
          type: 'error', 
          message: `Invalid parameter type: ${param.type}`, 
          field: `parameterDefinitions[${index}].type` 
        });
      }

      // Type-specific validations
      if (param.type === 'enum' && (!param.enumValues || param.enumValues.length === 0)) {
        issues.push({ 
          type: 'error', 
          message: `Enum parameter ${param.name} must have enumValues`, 
          field: `parameterDefinitions[${index}].enumValues` 
        });
      }

      if (param.type === 'array' && !param.arrayType) {
        issues.push({ 
          type: 'warning', 
          message: `Array parameter ${param.name} should specify arrayType`, 
          field: `parameterDefinitions[${index}].arrayType` 
        });
      }

      // Validation rules
      if (param.validation) {
        if (param.type === 'number') {
          if (param.validation.min !== undefined && param.validation.max !== undefined) {
            if (param.validation.min > param.validation.max) {
              issues.push({ 
                type: 'error', 
                message: `Parameter ${param.name}: min > max`, 
                field: `parameterDefinitions[${index}].validation` 
              });
            }
          }
        }

        if (param.validation.pattern && param.type !== 'string') {
          issues.push({ 
            type: 'warning', 
            message: `Pattern validation only applies to string parameters`, 
            field: `parameterDefinitions[${index}].validation.pattern` 
          });
        }
      }

      // Default value validation
      if (param.defaultValue !== undefined) {
        const typeCheckResult = this.checkParameterType(param, param.defaultValue);
        if (!typeCheckResult.valid) {
          issues.push({ 
            type: 'error', 
            message: `Default value for ${param.name}: ${typeCheckResult.error}`, 
            field: `parameterDefinitions[${index}].defaultValue` 
          });
        }
      }
    });

    return issues;
  }

  /**
   * Validate evaluator template code
   */
  private validateEvaluatorTemplate(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const code = template.evaluatorTemplate;

    if (!code || code.trim() === '') {
      issues.push({ type: 'error', message: 'Evaluator template is required', field: 'evaluatorTemplate' });
      return issues;
    }

    // Check for required structure
    if (!this.evaluatorPatterns.get('return-statement')!.test(code)) {
      issues.push({ 
        type: 'error', 
        message: 'Evaluator must return proper constraint result structure', 
        field: 'evaluatorTemplate' 
      });
    }

    // Check for violations array initialization
    if (!this.evaluatorPatterns.get('violations-array')!.test(code)) {
      issues.push({ 
        type: 'warning', 
        message: 'Evaluator should initialize violations array', 
        field: 'evaluatorTemplate' 
      });
    }

    // Check parameter placeholders
    const placeholders = code.match(this.evaluatorPatterns.get('parameter-placeholder')!) || [];
    const definedParams = new Set(template.parameterDefinitions.map(p => p.name));
    
    placeholders.forEach(placeholder => {
      const paramName = placeholder.match(/\{\{(\w+)\}\}/)![1];
      if (!definedParams.has(paramName)) {
        issues.push({ 
          type: 'error', 
          message: `Undefined parameter in evaluator: ${paramName}`, 
          field: 'evaluatorTemplate' 
        });
      }
    });

    // Check for unused parameters
    template.parameterDefinitions.forEach(param => {
      if (!code.includes(`{{${param.name}}}`)) {
        issues.push({ 
          type: 'warning', 
          message: `Parameter ${param.name} is defined but not used in evaluator`, 
          field: 'evaluatorTemplate' 
        });
      }
    });

    // Code quality checks
    const lines = code.split('\n');
    if (lines.length > 500) {
      issues.push({ 
        type: 'warning', 
        message: 'Evaluator code is very long (>500 lines)', 
        field: 'evaluatorTemplate' 
      });
    }

    // Check for common issues
    if (code.includes('console.log')) {
      issues.push({ 
        type: 'warning', 
        message: 'Remove console.log statements from evaluator', 
        field: 'evaluatorTemplate' 
      });
    }

    return issues;
  }

  /**
   * Validate scope options
   */
  private validateScopeOptions(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const scope = template.scopeOptions;

    if (!scope) {
      issues.push({ type: 'error', message: 'Scope options are required', field: 'scopeOptions' });
      return issues;
    }

    // Check boolean fields
    const booleanFields = [
      'requiresSports', 'requiresTeams', 'requiresVenues',
      'requiresTimeframes', 'requiresConferences', 'requiresDivisions'
    ];

    booleanFields.forEach(field => {
      if (typeof (scope as any)[field] !== 'boolean') {
        issues.push({ 
          type: 'error', 
          message: `Scope option ${field} must be boolean`, 
          field: `scopeOptions.${field}` 
        });
      }
    });

    // Logical checks
    if (template.type === ConstraintType.SPATIAL && !scope.requiresVenues) {
      issues.push({ 
        type: 'warning', 
        message: 'Spatial constraints typically require venues', 
        field: 'scopeOptions' 
      });
    }

    if (template.type === ConstraintType.TEMPORAL && !scope.requiresTimeframes && !scope.requiresSports) {
      issues.push({ 
        type: 'warning', 
        message: 'Temporal constraints typically require timeframes or sports context', 
        field: 'scopeOptions' 
      });
    }

    return issues;
  }

  /**
   * Validate examples
   */
  private validateExamples(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!template.examples || template.examples.length === 0) {
      issues.push({ 
        type: 'suggestion', 
        message: 'Consider adding at least one example', 
        field: 'examples' 
      });
      return issues;
    }

    template.examples.forEach((example, index) => {
      // Validate example structure
      if (!example.name || example.name.trim() === '') {
        issues.push({ 
          type: 'error', 
          message: `Example ${index + 1} missing name`, 
          field: `examples[${index}].name` 
        });
      }

      if (!example.description || example.description.trim() === '') {
        issues.push({ 
          type: 'warning', 
          message: `Example ${index + 1} missing description`, 
          field: `examples[${index}].description` 
        });
      }

      // Validate example parameters
      const paramResult = this.validateInstanceParameters(template, example.parameters);
      paramResult.errors.forEach(error => {
        issues.push({ 
          type: 'error', 
          message: `Example ${index + 1}: ${error}`, 
          field: `examples[${index}].parameters` 
        });
      });

      // Validate example scope
      const scopeResult = this.validateInstanceScope(template, example.scope as ConstraintScope);
      scopeResult.errors.forEach(error => {
        issues.push({ 
          type: 'error', 
          message: `Example ${index + 1}: ${error}`, 
          field: `examples[${index}].scope` 
        });
      });
    });

    return issues;
  }

  /**
   * Validate metadata
   */
  private validateMetadata(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Version format
    if (!template.version || !/^\d+\.\d+\.\d+$/.test(template.version)) {
      issues.push({ 
        type: 'warning', 
        message: 'Version should follow semantic versioning (x.y.z)', 
        field: 'version' 
      });
    }

    // Author
    if (!template.author || template.author.trim() === '') {
      issues.push({ 
        type: 'warning', 
        message: 'Author information is missing', 
        field: 'author' 
      });
    }

    // Dates
    if (!template.createdAt || !(template.createdAt instanceof Date)) {
      issues.push({ 
        type: 'error', 
        message: 'Created date is required', 
        field: 'createdAt' 
      });
    }

    if (!template.updatedAt || !(template.updatedAt instanceof Date)) {
      issues.push({ 
        type: 'error', 
        message: 'Updated date is required', 
        field: 'updatedAt' 
      });
    }

    // Tags
    if (!template.tags || template.tags.length === 0) {
      issues.push({ 
        type: 'suggestion', 
        message: 'Consider adding tags for better discoverability', 
        field: 'tags' 
      });
    } else {
      template.tags.forEach((tag, index) => {
        if (!/^[a-z0-9-]+$/.test(tag)) {
          issues.push({ 
            type: 'warning', 
            message: `Tag "${tag}" should be lowercase with hyphens only`, 
            field: `tags[${index}]` 
          });
        }
      });
    }

    return issues;
  }

  /**
   * Validate naming conventions
   */
  private validateNamingConventions(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Template ID format
    if (!/^[a-z0-9_]+$/.test(template.id)) {
      issues.push({ 
        type: 'error', 
        message: 'Template ID should be lowercase with underscores only', 
        field: 'id' 
      });
    }

    // Parameter naming
    template.parameterDefinitions.forEach((param, index) => {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(param.name)) {
        issues.push({ 
          type: 'warning', 
          message: `Parameter ${param.name} should use camelCase`, 
          field: `parameterDefinitions[${index}].name` 
        });
      }
    });

    return issues;
  }

  /**
   * Validate security concerns
   */
  private validateSecurity(template: ConstraintTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const code = template.evaluatorTemplate;

    // Check for dangerous functions
    const dangerousMatches = code.match(this.evaluatorPatterns.get('dangerous-functions')!) || [];
    dangerousMatches.forEach(match => {
      issues.push({ 
        type: 'error', 
        message: `Security risk: Use of ${match} is not allowed`, 
        field: 'evaluatorTemplate' 
      });
    });

    // Check for file operations
    const fileOpMatches = code.match(this.evaluatorPatterns.get('file-operations')!) || [];
    if (fileOpMatches.length > 0) {
      issues.push({ 
        type: 'error', 
        message: 'Security risk: File operations are not allowed', 
        field: 'evaluatorTemplate' 
      });
    }

    // Check for network operations
    const networkMatches = code.match(this.evaluatorPatterns.get('network-operations')!) || [];
    if (networkMatches.length > 0) {
      issues.push({ 
        type: 'error', 
        message: 'Security risk: Network operations are not allowed', 
        field: 'evaluatorTemplate' 
      });
    }

    // Check for process access
    if (code.includes('process.') || code.includes('global.')) {
      issues.push({ 
        type: 'error', 
        message: 'Security risk: Access to process or global objects not allowed', 
        field: 'evaluatorTemplate' 
      });
    }

    return issues;
  }

  /**
   * Validate instance parameters against template
   */
  private validateInstanceParameters(
    template: ConstraintTemplate,
    parameters: ConstraintParameters
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    template.parameterDefinitions.forEach(paramDef => {
      const value = parameters[paramDef.name];

      if (paramDef.required && value === undefined) {
        errors.push(`Missing required parameter: ${paramDef.name}`);
        return;
      }

      if (value !== undefined) {
        const typeCheck = this.checkParameterType(paramDef, value);
        if (!typeCheck.valid) {
          errors.push(`Parameter ${paramDef.name}: ${typeCheck.error}`);
        }

        // Validation rules
        if (paramDef.validation && typeCheck.valid) {
          const validationCheck = this.checkParameterValidation(paramDef, value);
          if (!validationCheck.valid) {
            errors.push(`Parameter ${paramDef.name}: ${validationCheck.error}`);
          }
        }
      }
    });

    // Check for unknown parameters
    Object.keys(parameters).forEach(key => {
      if (!template.parameterDefinitions.some(p => p.name === key)) {
        warnings.push(`Unknown parameter: ${key}`);
      }
    });

    return { valid: errors.length === 0, errors, warnings, suggestions: [] };
  }

  /**
   * Validate instance scope against template
   */
  private validateInstanceScope(
    template: ConstraintTemplate,
    scope: ConstraintScope
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const options = template.scopeOptions;

    if (options.requiresSports && (!scope.sports || scope.sports.length === 0)) {
      errors.push('Sports scope is required');
    }

    if (options.requiresTeams && (!scope.teams || scope.teams.length === 0)) {
      errors.push('Teams scope is required');
    }

    if (options.requiresVenues && (!scope.venues || scope.venues.length === 0)) {
      errors.push('Venues scope is required');
    }

    if (options.requiresTimeframes && (!scope.timeframes || scope.timeframes.length === 0)) {
      errors.push('Timeframes scope is required');
    }

    if (options.requiresConferences && (!scope.conferences || scope.conferences.length === 0)) {
      errors.push('Conferences scope is required');
    }

    if (options.requiresDivisions && (!scope.divisions || scope.divisions.length === 0)) {
      errors.push('Divisions scope is required');
    }

    return { valid: errors.length === 0, errors, warnings, suggestions: [] };
  }

  /**
   * Check parameter type validity
   */
  private checkParameterType(
    paramDef: ParameterDefinition,
    value: any
  ): { valid: boolean; error?: string } {
    switch (paramDef.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: 'Must be a number' };
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Must be a string' };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Must be a boolean' };
        }
        break;

      case 'date':
        if (!(value instanceof Date) && !Date.parse(value)) {
          return { valid: false, error: 'Must be a valid date' };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Must be an array' };
        }
        break;

      case 'enum':
        if (!paramDef.enumValues?.includes(value)) {
          return { valid: false, error: `Must be one of: ${paramDef.enumValues?.join(', ')}` };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Check parameter validation rules
   */
  private checkParameterValidation(
    paramDef: ParameterDefinition,
    value: any
  ): { valid: boolean; error?: string } {
    const validation = paramDef.validation;
    if (!validation) return { valid: true };

    if (paramDef.type === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return { valid: false, error: `Must be >= ${validation.min}` };
      }
      if (validation.max !== undefined && value > validation.max) {
        return { valid: false, error: `Must be <= ${validation.max}` };
      }
    }

    if (paramDef.type === 'string' && validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: validation.errorMessage || `Must match pattern: ${validation.pattern}` };
      }
    }

    if (validation.custom) {
      try {
        if (!validation.custom(value)) {
          return { valid: false, error: validation.errorMessage || 'Custom validation failed' };
        }
      } catch (error) {
        return { valid: false, error: `Validation error: ${error.message}` };
      }
    }

    return { valid: true };
  }

  /**
   * Get validation summary
   */
  public getValidationSummary(result: ValidationResult): string {
    const parts: string[] = [];

    if (result.valid) {
      parts.push('✅ Template is valid');
    } else {
      parts.push(`❌ Template has ${result.errors.length} error(s)`);
    }

    if (result.warnings.length > 0) {
      parts.push(`⚠️  ${result.warnings.length} warning(s)`);
    }

    if (result.suggestions.length > 0) {
      parts.push(`💡 ${result.suggestions.length} suggestion(s)`);
    }

    return parts.join(' | ');
  }
}

// Export singleton instance
export const templateValidator = new TemplateValidator();