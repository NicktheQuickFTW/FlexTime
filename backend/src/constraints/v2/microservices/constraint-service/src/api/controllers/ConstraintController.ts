import { Request, Response, NextFunction } from 'express';
import { ConstraintService } from '../../services/ConstraintService';
import { MessageBroker } from '../../services/MessageBroker';
import { CacheService } from '../../services/CacheService';
import { logger } from '../../utils/logger';
import { ApiResponse } from '../../types';

export class ConstraintController {
  private constraintService: ConstraintService;
  private messageBroker: MessageBroker;
  private cache: CacheService;

  constructor() {
    this.constraintService = new ConstraintService();
    this.messageBroker = MessageBroker.getInstance();
    this.cache = CacheService.getInstance();
  }

  listConstraints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, category, active } = req.query;
      
      const cacheKey = `constraints:list:${page}:${limit}:${category}:${active}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const constraints = await this.constraintService.listConstraints({
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        active: active === 'true'
      });

      await this.cache.set(cacheKey, constraints, 300); // Cache for 5 minutes
      
      res.json({
        success: true,
        data: constraints
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getConstraint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const cacheKey = `constraint:${id}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const constraint = await this.constraintService.getConstraint(id);
      
      if (!constraint) {
        return res.status(404).json({
          success: false,
          error: 'Constraint not found'
        });
      }

      await this.cache.set(cacheKey, constraint, 600);
      
      res.json({
        success: true,
        data: constraint
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  createConstraint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const constraint = await this.constraintService.createConstraint(req.body);
      
      // Publish constraint created event
      await this.messageBroker.publish('constraints.topic', 'constraint.created', {
        constraintId: constraint.id,
        constraint
      });

      // Invalidate cache
      await this.cache.invalidatePattern('constraints:list:*');
      
      res.status(201).json({
        success: true,
        data: constraint
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  updateConstraint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const constraint = await this.constraintService.updateConstraint(id, req.body);
      
      if (!constraint) {
        return res.status(404).json({
          success: false,
          error: 'Constraint not found'
        });
      }

      // Publish constraint updated event
      await this.messageBroker.publish('constraints.topic', 'constraint.updated', {
        constraintId: id,
        constraint
      });

      // Invalidate cache
      await this.cache.delete(`constraint:${id}`);
      await this.cache.invalidatePattern('constraints:list:*');
      
      res.json({
        success: true,
        data: constraint
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  deleteConstraint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deleted = await this.constraintService.deleteConstraint(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Constraint not found'
        });
      }

      // Publish constraint deleted event
      await this.messageBroker.publish('constraints.topic', 'constraint.deleted', {
        constraintId: id
      });

      // Invalidate cache
      await this.cache.delete(`constraint:${id}`);
      await this.cache.invalidatePattern('constraints:list:*');
      
      res.json({
        success: true,
        message: 'Constraint deleted successfully'
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  evaluateConstraint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constraintId, context } = req.body;
      
      // Check cache first
      const cacheKey = `evaluation:${constraintId}:${JSON.stringify(context)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const result = await this.constraintService.evaluateConstraint(constraintId, context);
      
      // Cache successful evaluations
      if (result.valid) {
        await this.cache.set(cacheKey, result, 60); // Cache for 1 minute
      }

      // Publish evaluation result
      await this.messageBroker.publish('constraints.topic', 'constraint.evaluated', {
        constraintId,
        result,
        context
      });
      
      res.json({
        success: true,
        data: result
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  bulkEvaluateConstraints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constraintIds, context } = req.body;
      
      const results = await this.constraintService.bulkEvaluateConstraints(constraintIds, context);
      
      // Publish bulk evaluation result
      await this.messageBroker.publish('constraints.topic', 'constraints.bulk.evaluated', {
        constraintIds,
        results,
        context
      });
      
      res.json({
        success: true,
        data: results
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  listTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await this.constraintService.listTemplates();
      
      res.json({
        success: true,
        data: templates
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.constraintService.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        data: template
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  instantiateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { parameters } = req.body;
      
      const constraint = await this.constraintService.instantiateTemplate(id, parameters);
      
      res.status(201).json({
        success: true,
        data: constraint
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  validateConstraint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = await this.constraintService.validateConstraint(req.body);
      
      res.json({
        success: true,
        data: validation
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId } = req.params;
      
      // Request conflict analysis from conflict service
      const response = await this.messageBroker.request('conflicts.analyze', {
        scheduleId
      });
      
      res.json({
        success: true,
        data: response
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  listCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.constraintService.listCategories();
      
      res.json({
        success: true,
        data: categories
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getConstraintsByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.params;
      const constraints = await this.constraintService.getConstraintsByCategory(category);
      
      res.json({
        success: true,
        data: constraints
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Request metrics from analytics service
      const response = await this.messageBroker.request('analytics.metrics', {
        service: 'constraint-service',
        type: 'summary'
      });
      
      res.json({
        success: true,
        data: response
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getConstraintMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Request specific constraint metrics from analytics service
      const response = await this.messageBroker.request('analytics.metrics', {
        service: 'constraint-service',
        type: 'constraint',
        constraintId: id
      });
      
      res.json({
        success: true,
        data: response
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}