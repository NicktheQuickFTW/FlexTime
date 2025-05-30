/**
 * Constraint Management API Routes
 * 
 * Express routes for managing constraints in the FlexTime scheduling system.
 * Provides RESTful endpoints for CRUD operations on constraints.
 */

import express from 'express';
import { param } from 'express-validator';
import * as constraintController from './constraintController';
import { 
  validateConstraint, 
  handleValidationErrors,
  requestLogger,
  rateLimiter,
  sanitizeInput,
  performanceMonitor,
  cacheControl,
  errorHandler
} from './constraintMiddleware';
import {
  validateConstraintCreation,
  validateConstraintUpdate,
  validateScheduleEvaluation,
  validateGetConstraints,
  constraintIdValidation,
  sportValidation,
  typeValidation,
  bulkOperationValidation,
  bulkUpdateValidation,
  bulkDeleteValidation,
  templateCreationValidation,
  importValidation,
  exportQueryValidation,
  dateRangeValidation,
  handleValidationResults
} from './validationMiddleware';
import {
  authenticate,
  authorize,
  Permission,
  securityHeaders,
  apiKeyRateLimit
} from './authMiddleware';
import { responseFormatter } from './responseFormatter';

const router = express.Router();

// Apply global middleware
router.use(securityHeaders);
router.use(requestLogger);
router.use(performanceMonitor(500)); // Warn if response takes > 500ms
router.use(sanitizeInput);
router.use(responseFormatter);
router.use(authenticate); // Require authentication for all routes
router.use(apiKeyRateLimit); // Apply rate limiting for API key users

// Get all constraints
router.get('/constraints',
  authorize(Permission.CONSTRAINT_READ),
  validateGetConstraints,
  cacheControl(300), // Cache for 5 minutes
  constraintController.getAllConstraints
);

// Get constraints by type
router.get('/constraints/type/:type',
  authorize(Permission.CONSTRAINT_READ),
  typeValidation(),
  handleValidationResults,
  cacheControl(300),
  constraintController.getConstraintsByType
);

// Get constraints by sport
router.get('/constraints/sport/:sport',
  authorize(Permission.CONSTRAINT_READ),
  sportValidation(),
  handleValidationResults,
  cacheControl(300),
  constraintController.getConstraintsBySport
);

// Get a specific constraint by ID
router.get('/constraints/:id',
  authorize(Permission.CONSTRAINT_READ),
  constraintIdValidation(),
  handleValidationResults,
  cacheControl(600), // Cache for 10 minutes
  constraintController.getConstraintById
);

// Create a new constraint
router.post('/constraints',
  authorize(Permission.CONSTRAINT_CREATE),
  rateLimiter(60000, 50), // 50 requests per minute
  validateConstraintCreation,
  constraintController.createConstraint
);

// Update an existing constraint
router.put('/constraints/:id',
  authorize(Permission.CONSTRAINT_UPDATE),
  rateLimiter(60000, 50),
  validateConstraintUpdate,
  constraintController.updateConstraint
);

// Delete a constraint
router.delete('/constraints/:id',
  authorize(Permission.CONSTRAINT_DELETE),
  constraintIdValidation(),
  handleValidationResults,
  constraintController.deleteConstraint
);

// Evaluate constraints for a schedule
router.post('/constraints/evaluate',
  authorize(Permission.CONSTRAINT_EVALUATE),
  rateLimiter(60000, 20), // 20 evaluations per minute
  validateScheduleEvaluation,
  constraintController.evaluateConstraints
);

// Get constraint evaluation history
router.get('/constraints/:id/history',
  authorize(Permission.CONSTRAINT_READ),
  constraintIdValidation(),
  dateRangeValidation(),
  handleValidationResults,
  constraintController.getConstraintHistory
);

// Get constraint suggestions
router.get('/constraints/suggestions/:scheduleId',
  authorize(Permission.CONSTRAINT_READ),
  param('scheduleId').notEmpty().withMessage('Schedule ID is required'),
  handleValidationResults,
  constraintController.getConstraintSuggestions
);

// Bulk operations
router.post('/constraints/bulk',
  authorize(Permission.CONSTRAINT_BULK),
  rateLimiter(60000, 10), // 10 bulk operations per minute
  bulkOperationValidation(),
  handleValidationResults,
  constraintController.bulkCreateConstraints
);

router.put('/constraints/bulk',
  authorize(Permission.CONSTRAINT_BULK),
  rateLimiter(60000, 10),
  bulkUpdateValidation(),
  handleValidationResults,
  constraintController.bulkUpdateConstraints
);

router.delete('/constraints/bulk',
  authorize(Permission.CONSTRAINT_BULK),
  rateLimiter(60000, 10),
  bulkDeleteValidation(),
  handleValidationResults,
  constraintController.bulkDeleteConstraints
);

// Template operations
router.get('/templates',
  authorize(Permission.TEMPLATE_READ),
  cacheControl(3600), // Cache for 1 hour
  constraintController.getConstraintTemplates
);

router.post('/constraints/from-template',
  authorize(Permission.TEMPLATE_USE),
  templateCreationValidation(),
  handleValidationResults,
  constraintController.createFromTemplate
);

// Export constraints
router.get('/export',
  authorize(Permission.CONSTRAINT_EXPORT),
  exportQueryValidation(),
  handleValidationResults,
  constraintController.exportConstraints
);

// Import constraints
router.post('/import',
  authorize(Permission.CONSTRAINT_IMPORT),
  rateLimiter(60000, 5), // 5 imports per minute
  importValidation(),
  handleValidationResults,
  constraintController.importConstraints
);

// Apply error handler last
router.use(errorHandler);

export default router;