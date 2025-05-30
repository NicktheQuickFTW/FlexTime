// Constraint Template System - Main exports
// Version 2.0

export {
  ConstraintTemplate,
  TemplateCategory,
  ParameterDefinition,
  ParameterValidation,
  ScopeOptions,
  TemplateExample,
  TemplateInstance,
  ConstraintTemplateSystem,
  templateSystem
} from './ConstraintTemplateSystem';

export {
  StandardTemplates
} from './StandardTemplates';

export {
  TemplateBuilder,
  TemplateBuilderConfig,
  BuilderStep,
  EvaluatorSnippet,
  EvaluatorComponent,
  BuilderProgress,
  ParameterBuilder,
  templateBuilder
} from './TemplateBuilder';

export {
  TemplateValidator,
  ValidationResult,
  ValidationRule,
  ValidationIssue,
  templateValidator
} from './TemplateValidator';

// Re-export commonly used types from parent
export {
  ConstraintType,
  ConstraintHardness,
  ConstraintScope,
  ConstraintParameters,
  UnifiedConstraint
} from '../types';