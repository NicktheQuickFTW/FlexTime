/**
 * Constraint Management Middleware
 * 
 * Provides validation, error handling, and other middleware functions
 * for the constraint management API.
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, body, ValidationChain } from 'express-validator';
import { ConstraintType, ConstraintHardness } from '../types';

/**
 * Validation rules for constraint creation/update
 */
export const validateConstraint: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  
  body('type')
    .isIn(Object.values(ConstraintType)).withMessage('Invalid constraint type'),
  
  body('hardness')
    .isIn(Object.values(ConstraintHardness)).withMessage('Invalid constraint hardness'),
  
  body('weight')
    .isInt({ min: 0, max: 100 }).withMessage('Weight must be an integer between 0 and 100'),
  
  body('scope.sports')
    .isArray({ min: 1 }).withMessage('At least one sport must be specified')
    .custom((sports) => sports.every((sport: any) => typeof sport === 'string'))
    .withMessage('Sports must be an array of strings'),
  
  body('parameters')
    .isObject().withMessage('Parameters must be an object'),
  
  body('evaluation')
    .optional()
    .isString().withMessage('Evaluation must be a string (function body)'),
  
  body('scope.teams')
    .optional()
    .isArray().withMessage('Teams must be an array'),
  
  body('scope.venues')
    .optional()
    .isArray().withMessage('Venues must be an array'),
  
  body('scope.conferences')
    .optional()
    .isArray().withMessage('Conferences must be an array'),
  
  body('dependencies')
    .optional()
    .isArray().withMessage('Dependencies must be an array'),
  
  body('conflictsWith')
    .optional()
    .isArray().withMessage('ConflictsWith must be an array'),
  
  body('cacheable')
    .optional()
    .isBoolean().withMessage('Cacheable must be a boolean'),
  
  body('parallelizable')
    .optional()
    .isBoolean().withMessage('Parallelizable must be a boolean'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 }).withMessage('Priority must be a non-negative integer')
];

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
        value: err.type === 'field' ? err.value : undefined
      }))
    });
  }
  
  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Constraint API Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
  }
  
  if (err.name === 'ConflictError') {
    return res.status(409).json({
      error: 'Conflict',
      message: err.message
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

/**
 * Rate limiting middleware
 */
export const rateLimiter = (windowMs: number = 60000, max: number = 100) => {
  const requests = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or initialize request timestamps for this IP
    const timestamps = requests.get(ip) || [];
    
    // Filter out old timestamps
    const recentTimestamps = timestamps.filter(t => t > windowStart);
    
    if (recentTimestamps.length >= max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${max} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((recentTimestamps[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current timestamp and update map
    recentTimestamps.push(now);
    requests.set(ip, recentTimestamps);
    
    // Clean up old IPs periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of requests.entries()) {
        if (value.every(t => t < windowStart)) {
          requests.delete(key);
        }
      }
    }
    
    next();
  };
};

/**
 * API key authentication middleware
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }
  
  // In production, validate against stored API keys
  // For now, accept any non-empty key
  if (apiKey && apiKey.toString().length > 0) {
    next();
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }
};

/**
 * CORS middleware configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Id'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize object properties
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS attempts
      return obj.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      if (duration > threshold) {
        console.warn(`Slow request detected: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
      }
      
      // Add performance header
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    });
    
    next();
  };
};

/**
 * Cache control middleware
 */
export const cacheControl = (maxAge: number = 0, isPrivate: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      const cacheHeader = isPrivate 
        ? `private, max-age=${maxAge}`
        : `public, max-age=${maxAge}`;
      
      res.setHeader('Cache-Control', cacheHeader);
      
      if (maxAge > 0) {
        res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
      }
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    
    next();
  };
};