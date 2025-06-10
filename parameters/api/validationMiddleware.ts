/**
 * Validation Middleware for Constraint Management API
 * 
 * Provides comprehensive input validation for all constraint-related endpoints
 * using express-validator and custom validation rules.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  body, 
  param, 
  query, 
  validationResult, 
  ValidationChain,
  CustomValidator 
} from 'express-validator';
import { 
  ConstraintType, 
  ConstraintHardness,
  UnifiedConstraint,
  ScheduleContext,
  EvaluationMode
} from '../types';

/**
 * Custom validator to check if a value is a valid function string
 */
const isValidFunctionString: CustomValidator = (value: string) => {
  try {
    // Check if it's a valid function body
    new Function('context', value);
    return true;
  } catch (error) {
    throw new Error('Invalid function body');
  }
};

/**
 * Custom validator for date ranges
 */
const isValidDateRange: CustomValidator = (value: any) => {
  if (!value || typeof value !== 'object') return false;
  
  const { start, end } = value;
  if (!start || !end) return false;
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }
  
  return true;
};

/**
 * Base constraint validation rules
 */
export const constraintValidationRules = (): ValidationChain[] => [
  body('name')
    .trim()
    .notEmpty().withMessage('Constraint name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Name contains invalid characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  
  body('type')
    .isIn(Object.values(ConstraintType))
    .withMessage(`Type must be one of: ${Object.values(ConstraintType).join(', ')}`),
  
  body('hardness')
    .isIn(Object.values(ConstraintHardness))
    .withMessage(`Hardness must be one of: ${Object.values(ConstraintHardness).join(', ')}`),
  
  body('weight')
    .isInt({ min: 0, max: 100 })
    .withMessage('Weight must be an integer between 0 and 100'),
  
  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Priority must be an integer between 0 and 1000'),
  
  body('scope.sports')
    .isArray({ min: 1 }).withMessage('At least one sport must be specified')
    .custom((sports: any[]) => sports.every(sport => 
      typeof sport === 'string' && sport.length > 0
    )).withMessage('All sports must be non-empty strings'),
  
  body('scope.teams')
    .optional()
    .isArray()
    .custom((teams: any[]) => teams.every(team => 
      typeof team === 'string' && team.length > 0
    )).withMessage('All teams must be non-empty strings'),
  
  body('scope.venues')
    .optional()
    .isArray()
    .custom((venues: any[]) => venues.every(venue => 
      typeof venue === 'string' && venue.length > 0
    )).withMessage('All venues must be non-empty strings'),
  
  body('scope.conferences')
    .optional()
    .isArray()
    .custom((conferences: any[]) => conferences.every(conf => 
      typeof conf === 'string' && conf.length > 0
    )).withMessage('All conferences must be non-empty strings'),
  
  body('scope.dateRange')
    .optional()
    .custom(isValidDateRange),
  
  body('parameters')
    .isObject().withMessage('Parameters must be an object'),
  
  body('evaluation')
    .optional()
    .custom(isValidFunctionString),
  
  body('dependencies')
    .optional()
    .isArray()
    .custom((deps: any[]) => deps.every(dep => 
      typeof dep === 'string' && dep.length > 0
    )).withMessage('All dependencies must be non-empty strings'),
  
  body('conflictsWith')
    .optional()
    .isArray()
    .custom((conflicts: any[]) => conflicts.every(conf => 
      typeof conf === 'string' && conf.length > 0
    )).withMessage('All conflicts must be non-empty strings'),
  
  body('cacheable')
    .optional()
    .isBoolean().withMessage('Cacheable must be a boolean'),
  
  body('parallelizable')
    .optional()
    .isBoolean().withMessage('Parallelizable must be a boolean'),
  
  body('metadata.tags')
    .optional()
    .isArray()
    .custom((tags: any[]) => tags.every(tag => 
      typeof tag === 'string' && tag.length > 0 && tag.length <= 50
    )).withMessage('Tags must be non-empty strings with max length 50')
];

/**
 * Validation rules for constraint ID parameter
 */
export const constraintIdValidation = (): ValidationChain[] => [
  param('id')
    .trim()
    .notEmpty().withMessage('Constraint ID is required')
    .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('Invalid constraint ID format')
];

/**
 * Validation rules for sport parameter
 */
export const sportValidation = (): ValidationChain[] => [
  param('sport')
    .trim()
    .notEmpty().withMessage('Sport is required')
    .isAlpha().withMessage('Sport must contain only letters')
];

/**
 * Validation rules for constraint type parameter
 */
export const typeValidation = (): ValidationChain[] => [
  param('type')
    .isIn(Object.values(ConstraintType))
    .withMessage(`Invalid constraint type. Must be one of: ${Object.values(ConstraintType).join(', ')}`)
];

/**
 * Validation rules for schedule evaluation
 */
export const scheduleEvaluationValidation = (): ValidationChain[] => [
  body('schedule')
    .notEmpty().withMessage('Schedule is required')
    .isObject().withMessage('Schedule must be an object'),
  
  body('schedule.games')
    .isArray({ min: 1 }).withMessage('Schedule must contain at least one game'),
  
  body('schedule.games.*.id')
    .notEmpty().withMessage('Game ID is required'),
  
  body('schedule.games.*.homeTeam')
    .notEmpty().withMessage('Home team is required'),
  
  body('schedule.games.*.awayTeam')
    .notEmpty().withMessage('Away team is required'),
  
  body('schedule.games.*.date')
    .isISO8601().withMessage('Game date must be a valid ISO 8601 date'),
  
  body('schedule.games.*.venue')
    .notEmpty().withMessage('Venue is required'),
  
  body('schedule.games.*.sport')
    .notEmpty().withMessage('Sport is required'),
  
  body('constraintIds')
    .optional()
    .isArray()
    .custom((ids: any[]) => ids.every(id => 
      typeof id === 'string' && id.length > 0
    )).withMessage('All constraint IDs must be non-empty strings'),
  
  body('evaluationMode')
    .optional()
    .isIn(['full', 'quick', 'parallel'])
    .withMessage('Evaluation mode must be one of: full, quick, parallel')
];

/**
 * Validation rules for bulk operations
 */
export const bulkOperationValidation = (): ValidationChain[] => [
  body('constraints')
    .isArray({ min: 1, max: 100 })
    .withMessage('Constraints must be an array with 1-100 items'),
  
  body('constraints.*')
    .isObject()
    .withMessage('Each constraint must be an object')
];

/**
 * Validation rules for bulk update
 */
export const bulkUpdateValidation = (): ValidationChain[] => [
  body('updates')
    .isArray({ min: 1, max: 100 })
    .withMessage('Updates must be an array with 1-100 items'),
  
  body('updates.*.id')
    .notEmpty()
    .withMessage('Each update must include a constraint ID')
];

/**
 * Validation rules for bulk delete
 */
export const bulkDeleteValidation = (): ValidationChain[] => [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('IDs must be an array with 1-100 items')
    .custom((ids: any[]) => ids.every(id => 
      typeof id === 'string' && id.length > 0
    )).withMessage('All IDs must be non-empty strings')
];

/**
 * Validation rules for template creation
 */
export const templateCreationValidation = (): ValidationChain[] => [
  body('templateId')
    .trim()
    .notEmpty().withMessage('Template ID is required')
    .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('Invalid template ID format'),
  
  body('parameters')
    .optional()
    .isObject().withMessage('Parameters must be an object'),
  
  body('overrides')
    .optional()
    .isObject().withMessage('Overrides must be an object')
];

/**
 * Validation rules for import operation
 */
export const importValidation = (): ValidationChain[] => [
  body('constraints')
    .isArray({ min: 1 })
    .withMessage('Constraints must be a non-empty array'),
  
  body('mode')
    .optional()
    .isIn(['merge', 'replace', 'skip'])
    .withMessage('Import mode must be one of: merge, replace, skip')
];

/**
 * Validation rules for export query parameters
 */
export const exportQueryValidation = (): ValidationChain[] => [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'yaml'])
    .withMessage('Format must be one of: json, csv, yaml'),
  
  query('ids')
    .optional()
    .isString()
    .matches(/^[a-zA-Z0-9\-_,]+$/)
    .withMessage('IDs must be comma-separated alphanumeric strings')
];

/**
 * Validation rules for pagination
 */
export const paginationValidation = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'type', 'weight', 'priority', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for date range queries
 */
export const dateRangeValidation = (): ValidationChain[] => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.query?.startDate && endDate) {
        return new Date(endDate) > new Date(req.query.startDate);
      }
      return true;
    }).withMessage('End date must be after start date')
];

/**
 * Handle validation results
 */
export const handleValidationResults = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
      location: error.location
    }));
    
    res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formattedErrors
      }
    });
    return;
  }
  
  next();
};

/**
 * Sanitize constraint data before processing
 */
export const sanitizeConstraintData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && req.body.evaluation) {
    // Remove potential security risks from evaluation function
    req.body.evaluation = req.body.evaluation
      .replace(/require\s*\(/g, '')
      .replace(/import\s+/g, '')
      .replace(/eval\s*\(/g, '')
      .replace(/Function\s*\(/g, '')
      .replace(/setTimeout\s*\(/g, '')
      .replace(/setInterval\s*\(/g, '');
  }
  
  next();
};

/**
 * Validate constraint dependencies exist
 */
export const validateDependencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.body && req.body.dependencies && req.body.dependencies.length > 0) {
    // In a real implementation, this would check if all dependency IDs exist
    // For now, we'll pass through
    next();
  } else {
    next();
  }
};

/**
 * Combined validation middleware for constraint creation
 */
export const validateConstraintCreation = [
  ...constraintValidationRules(),
  handleValidationResults,
  sanitizeConstraintData,
  validateDependencies
];

/**
 * Combined validation middleware for constraint update
 */
export const validateConstraintUpdate = [
  ...constraintIdValidation(),
  ...constraintValidationRules(),
  handleValidationResults,
  sanitizeConstraintData,
  validateDependencies
];

/**
 * Combined validation middleware for schedule evaluation
 */
export const validateScheduleEvaluation = [
  ...scheduleEvaluationValidation(),
  handleValidationResults
];

/**
 * Combined validation middleware for getting constraints
 */
export const validateGetConstraints = [
  ...paginationValidation(),
  handleValidationResults
];