/**
 * Constraint Management Controller
 * 
 * Handles HTTP requests for constraint operations and interfaces with
 * the constraint engine and other services.
 */

import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter, ErrorCode } from './responseFormatter';
import { OptimizationEngine } from '../engines/OptimizationEngine';
import { ConstraintTemplateSystem } from '../templates/ConstraintTemplateSystem';
import { SmartConflictResolver } from '../resolvers/SmartConflictResolver';
import { 
  UnifiedConstraint, 
  ConstraintType, 
  ConstraintHardness,
  EvaluationResult 
} from '../types';

// Initialize services
const constraintEngine = new OptimizationEngine();
const templateSystem = new ConstraintTemplateSystem();
const conflictResolver = new SmartConflictResolver();

// In-memory store for demo (replace with database in production)
const constraintStore = new Map<string, UnifiedConstraint>();

/**
 * Get all constraints
 */
export const getAllConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    const constraints = Array.from(constraintStore.values());
    
    // Apply sorting
    constraints.sort((a, b) => {
      const aVal = a[sortBy as keyof UnifiedConstraint];
      const bVal = b[sortBy as keyof UnifiedConstraint];
      return sortOrder === 'asc' ? 
        (aVal > bVal ? 1 : -1) : 
        (aVal < bVal ? 1 : -1);
    });
    
    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedConstraints = constraints.slice(startIndex, startIndex + Number(limit));
    
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    ResponseFormatter.paginated(
      res,
      paginatedConstraints.map(c => ResponseFormatter.transformConstraint(c)),
      Number(page),
      Number(limit),
      constraints.length,
      baseUrl
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get constraints by type
 */
export const getConstraintsByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    
    if (!Object.values(ConstraintType).includes(type as ConstraintType)) {
      return ResponseFormatter.validationError(res, [{
        field: 'type',
        message: 'Invalid constraint type',
        value: type
      }]);
    }
    
    const constraints = Array.from(constraintStore.values())
      .filter(c => c.type === type);
    
    ResponseFormatter.success(
      res,
      constraints.map(c => ResponseFormatter.transformConstraint(c))
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get constraints by sport
 */
export const getConstraintsBySport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sport } = req.params;
    
    const constraints = Array.from(constraintStore.values())
      .filter(c => c.scope.sports.includes(sport));
    
    ResponseFormatter.success(
      res,
      constraints.map(c => ResponseFormatter.transformConstraint(c))
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific constraint by ID
 */
export const getConstraintById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const constraint = constraintStore.get(id);
    
    if (!constraint) {
      return ResponseFormatter.notFound(res, 'Constraint', id);
    }
    
    ResponseFormatter.success(
      res,
      ResponseFormatter.transformConstraint(constraint)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new constraint
 */
export const createConstraint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const constraintData = req.body;
    
    // Generate ID if not provided
    const id = constraintData.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create constraint with metadata
    const constraint: UnifiedConstraint = {
      ...constraintData,
      id,
      metadata: {
        ...constraintData.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        author: req.headers['x-user-id'] || 'system',
        tags: constraintData.metadata?.tags || []
      }
    };
    
    // Check for conflicts
    const conflicts = await conflictResolver.detectConflicts([constraint], Array.from(constraintStore.values()));
    if (conflicts.length > 0) {
      return ResponseFormatter.conflict(
        res,
        'Constraint conflicts detected',
        conflicts
      );
    }
    
    constraintStore.set(id, constraint);
    constraintEngine.addConstraint(constraint);
    
    const location = `${req.protocol}://${req.get('host')}${req.baseUrl}/constraints/${id}`;
    ResponseFormatter.created(
      res,
      ResponseFormatter.transformConstraint(constraint),
      location
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing constraint
 */
export const updateConstraint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const existingConstraint = constraintStore.get(id);
    if (!existingConstraint) {
      return ResponseFormatter.notFound(res, 'Constraint', id);
    }
    
    // Update constraint
    const updatedConstraint: UnifiedConstraint = {
      ...existingConstraint,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...existingConstraint.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
        version: `${parseInt(existingConstraint.metadata.version.split('.')[0]) + 1}.0.0`
      }
    };
    
    // Check for conflicts with other constraints
    const otherConstraints = Array.from(constraintStore.values()).filter(c => c.id !== id);
    const conflicts = await conflictResolver.detectConflicts([updatedConstraint], otherConstraints);
    if (conflicts.length > 0) {
      return ResponseFormatter.conflict(
        res,
        'Constraint conflicts detected',
        conflicts
      );
    }
    
    constraintStore.set(id, updatedConstraint);
    constraintEngine.removeConstraint(id);
    constraintEngine.addConstraint(updatedConstraint);
    
    ResponseFormatter.success(
      res,
      ResponseFormatter.transformConstraint(updatedConstraint)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a constraint
 */
export const deleteConstraint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!constraintStore.has(id)) {
      return ResponseFormatter.notFound(res, 'Constraint', id);
    }
    
    constraintStore.delete(id);
    constraintEngine.removeConstraint(id);
    
    ResponseFormatter.noContent(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Evaluate constraints for a schedule
 */
export const evaluateConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schedule, constraintIds } = req.body;
    
    if (!schedule) {
      return ResponseFormatter.validationError(res, [{
        field: 'schedule',
        message: 'Schedule is required'
      }]);
    }
    
    // Get constraints to evaluate
    let constraintsToEvaluate: UnifiedConstraint[];
    if (constraintIds && constraintIds.length > 0) {
      constraintsToEvaluate = constraintIds
        .map((id: string) => constraintStore.get(id))
        .filter((c: UnifiedConstraint | undefined): c is UnifiedConstraint => c !== undefined);
    } else {
      constraintsToEvaluate = Array.from(constraintStore.values());
    }
    
    // Evaluate constraints
    const evaluationResult: EvaluationResult = await constraintEngine.evaluateSchedule(
      schedule,
      constraintsToEvaluate
    );
    
    ResponseFormatter.success(
      res,
      ResponseFormatter.transformEvaluationResult(evaluationResult)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get constraint evaluation history
 */
export const getConstraintHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    // This would typically query a database
    // For now, return mock data
    const history = {
      constraintId: id,
      evaluations: [],
      statistics: {
        totalEvaluations: 0,
        satisfactionRate: 0,
        averageScore: 0
      }
    };
    
    ResponseFormatter.success(res, history);
  } catch (error) {
    next(error);
  }
};

/**
 * Get constraint suggestions for a schedule
 */
export const getConstraintSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scheduleId } = req.params;
    
    // This would analyze the schedule and suggest constraints
    // For now, return template-based suggestions
    const suggestions = templateSystem.getAvailableTemplates().map(template => ({
      templateId: template.id,
      templateName: template.name,
      description: template.description,
      relevanceScore: Math.random(),
      reason: 'Based on your schedule characteristics'
    }));
    
    ResponseFormatter.success(res, suggestions);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create constraints
 */
export const bulkCreateConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { constraints } = req.body;
    
    if (!Array.isArray(constraints) || constraints.length === 0) {
      return ResponseFormatter.validationError(res, [{
        field: 'constraints',
        message: 'Constraints array is required'
      }]);
    }
    
    const created: UnifiedConstraint[] = [];
    const errors: any[] = [];
    
    for (const constraintData of constraints) {
      try {
        const id = constraintData.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const constraint: UnifiedConstraint = {
          ...constraintData,
          id,
          metadata: {
            ...constraintData.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: '1.0.0',
            author: req.headers['x-user-id'] || 'system',
            tags: constraintData.metadata?.tags || []
          }
        };
        
        constraintStore.set(id, constraint);
        constraintEngine.addConstraint(constraint);
        created.push(constraint);
      } catch (error) {
        errors.push({ constraint: constraintData, error: (error as Error).message });
      }
    }
    
    ResponseFormatter.bulkOperation(
      res,
      created.map(c => ResponseFormatter.transformConstraint(c)),
      errors,
      'bulk create'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update constraints
 */
export const bulkUpdateConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return ResponseFormatter.validationError(res, [{
        field: 'updates',
        message: 'Updates array is required'
      }]);
    }
    
    const updated: UnifiedConstraint[] = [];
    const errors: any[] = [];
    
    for (const update of updates) {
      try {
        const existing = constraintStore.get(update.id);
        if (!existing) {
          errors.push({ id: update.id, error: 'Constraint not found' });
          continue;
        }
        
        const updatedConstraint: UnifiedConstraint = {
          ...existing,
          ...update,
          metadata: {
            ...existing.metadata,
            ...update.metadata,
            updatedAt: new Date()
          }
        };
        
        constraintStore.set(update.id, updatedConstraint);
        constraintEngine.removeConstraint(update.id);
        constraintEngine.addConstraint(updatedConstraint);
        updated.push(updatedConstraint);
      } catch (error) {
        errors.push({ update, error: (error as Error).message });
      }
    }
    
    ResponseFormatter.bulkOperation(
      res,
      updated.map(c => ResponseFormatter.transformConstraint(c)),
      errors,
      'bulk update'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete constraints
 */
export const bulkDeleteConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return ResponseFormatter.validationError(res, [{
        field: 'ids',
        message: 'IDs array is required'
      }]);
    }
    
    const deleted: string[] = [];
    const notFound: string[] = [];
    
    for (const id of ids) {
      if (constraintStore.has(id)) {
        constraintStore.delete(id);
        constraintEngine.removeConstraint(id);
        deleted.push(id);
      } else {
        notFound.push(id);
      }
    }
    
    ResponseFormatter.bulkOperation(
      res,
      deleted.map(id => ({ id })),
      notFound.map(id => ({ item: id, error: 'Not found' })),
      'bulk delete'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get available constraint templates
 */
export const getConstraintTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = templateSystem.getAvailableTemplates();
    ResponseFormatter.success(res, templates);
  } catch (error) {
    next(error);
  }
};

/**
 * Create constraint from template
 */
export const createFromTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, parameters, overrides } = req.body;
    
    if (!templateId) {
      return ResponseFormatter.validationError(res, [{
        field: 'templateId',
        message: 'Template ID is required'
      }]);
    }
    
    const constraint = templateSystem.createFromTemplate(templateId, parameters, overrides);
    const id = constraint.id || `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const finalConstraint: UnifiedConstraint = {
      ...constraint,
      id,
      metadata: {
        ...constraint.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        author: req.headers['x-user-id'] || 'system',
        tags: [...(constraint.metadata?.tags || []), 'from-template', templateId]
      }
    };
    
    constraintStore.set(id, finalConstraint);
    constraintEngine.addConstraint(finalConstraint);
    
    const location = `${req.protocol}://${req.get('host')}${req.baseUrl}/constraints/${id}`;
    ResponseFormatter.created(
      res,
      ResponseFormatter.transformConstraint(finalConstraint),
      location
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Export constraints
 */
export const exportConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { format = 'json', ids } = req.query;
    
    let constraintsToExport: UnifiedConstraint[];
    if (ids && typeof ids === 'string') {
      const idArray = ids.split(',');
      constraintsToExport = idArray
        .map(id => constraintStore.get(id))
        .filter((c): c is UnifiedConstraint => c !== undefined);
    } else {
      constraintsToExport = Array.from(constraintStore.values());
    }
    
    if (format === 'json') {
      ResponseFormatter.success(res, { 
        version: '2.0',
        exported: new Date().toISOString(),
        constraints: constraintsToExport.map(c => ResponseFormatter.transformConstraint(c))
      });
    } else {
      ResponseFormatter.validationError(res, [{
        field: 'format',
        message: 'Unsupported format. Only JSON is currently supported.',
        value: format
      }]);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Import constraints
 */
export const importConstraints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { constraints, mode = 'merge' } = req.body;
    
    if (!Array.isArray(constraints)) {
      return ResponseFormatter.validationError(res, [{
        field: 'constraints',
        message: 'Constraints array is required'
      }]);
    }
    
    const imported: UnifiedConstraint[] = [];
    const skipped: string[] = [];
    const errors: any[] = [];
    
    for (const constraint of constraints) {
      try {
        if (mode === 'skip' && constraintStore.has(constraint.id)) {
          skipped.push(constraint.id);
          continue;
        }
        
        const importedConstraint: UnifiedConstraint = {
          ...constraint,
          metadata: {
            ...constraint.metadata,
            updatedAt: new Date(),
            tags: [...(constraint.metadata?.tags || []), 'imported']
          }
        };
        
        constraintStore.set(constraint.id, importedConstraint);
        constraintEngine.addConstraint(importedConstraint);
        imported.push(importedConstraint);
      } catch (error) {
        errors.push({ constraint, error: (error as Error).message });
      }
    }
    
    ResponseFormatter.bulkOperation(
      res,
      imported.map(c => ResponseFormatter.transformConstraint(c)),
      errors,
      'import'
    );
  } catch (error) {
    next(error);
  }
};