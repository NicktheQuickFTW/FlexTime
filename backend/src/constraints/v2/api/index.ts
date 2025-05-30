/**
 * Constraint Management API Integration
 * 
 * Main entry point for integrating the constraint management API
 * with the Express backend.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import constraintRoutes from './constraintRoutes';
import { corsWithAuth } from './authMiddleware';
import { errorHandler } from './constraintMiddleware';

/**
 * Create and configure the constraint API router
 */
export function createConstraintAPI(): express.Router {
  const apiRouter = express.Router();
  
  // Apply security middleware
  apiRouter.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Enable CORS with authentication support
  apiRouter.use(cors(corsWithAuth));
  
  // Enable response compression
  apiRouter.use(compression());
  
  // Parse JSON bodies
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Health check endpoint
  apiRouter.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '2.0',
      timestamp: new Date().toISOString()
    });
  });
  
  // API documentation endpoint
  apiRouter.get('/docs', (req, res) => {
    res.json({
      version: '2.0',
      endpoints: [
        // Constraint CRUD operations
        { method: 'GET', path: '/constraints', description: 'Get all constraints with pagination' },
        { method: 'GET', path: '/constraints/:id', description: 'Get a specific constraint by ID' },
        { method: 'GET', path: '/constraints/type/:type', description: 'Get constraints by type' },
        { method: 'GET', path: '/constraints/sport/:sport', description: 'Get constraints by sport' },
        { method: 'POST', path: '/constraints', description: 'Create a new constraint' },
        { method: 'PUT', path: '/constraints/:id', description: 'Update an existing constraint' },
        { method: 'DELETE', path: '/constraints/:id', description: 'Delete a constraint' },
        
        // Evaluation
        { method: 'POST', path: '/constraints/evaluate', description: 'Evaluate constraints against a schedule' },
        { method: 'GET', path: '/constraints/:id/history', description: 'Get constraint evaluation history' },
        { method: 'GET', path: '/constraints/suggestions/:scheduleId', description: 'Get constraint suggestions for a schedule' },
        
        // Bulk operations
        { method: 'POST', path: '/constraints/bulk', description: 'Create multiple constraints' },
        { method: 'PUT', path: '/constraints/bulk', description: 'Update multiple constraints' },
        { method: 'DELETE', path: '/constraints/bulk', description: 'Delete multiple constraints' },
        
        // Templates
        { method: 'GET', path: '/templates', description: 'Get available constraint templates' },
        { method: 'POST', path: '/constraints/from-template', description: 'Create constraint from template' },
        
        // Import/Export
        { method: 'GET', path: '/export', description: 'Export constraints' },
        { method: 'POST', path: '/import', description: 'Import constraints' }
      ],
      authentication: {
        methods: ['JWT Bearer Token', 'API Key'],
        headers: {
          jwt: 'Authorization: Bearer <token>',
          apiKey: 'X-API-Key: <key>'
        }
      },
      rateLimit: {
        default: '100 requests per minute',
        evaluation: '20 requests per minute',
        bulk: '10 requests per minute',
        import: '5 requests per minute'
      }
    });
  });
  
  // Mount constraint routes
  apiRouter.use('/', constraintRoutes);
  
  // Global error handler (should be last)
  apiRouter.use(errorHandler);
  
  return apiRouter;
}

/**
 * Initialize constraint API with Express app
 */
export function initializeConstraintAPI(app: express.Application, basePath: string = '/api/v2/constraints'): void {
  const constraintAPI = createConstraintAPI();
  
  // Mount the API at the specified base path
  app.use(basePath, constraintAPI);
  
  console.log(`Constraint Management API v2 initialized at ${basePath}`);
}

/**
 * Middleware to add constraint API to request context
 */
export function constraintAPIMiddleware(req: any, res: any, next: any): void {
  req.constraintAPI = {
    version: '2.0',
    basePath: '/api/v2/constraints',
    features: [
      'unified-constraint-model',
      'ml-optimization',
      'real-time-evaluation',
      'conflict-resolution',
      'template-system',
      'bulk-operations',
      'import-export'
    ]
  };
  next();
}

export default {
  createConstraintAPI,
  initializeConstraintAPI,
  constraintAPIMiddleware
};