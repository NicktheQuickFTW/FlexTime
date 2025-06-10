/**
 * Authentication and Authorization Middleware
 * 
 * Provides security layers for the Constraint Management API including
 * JWT authentication, role-based access control, and API key validation.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Extend Express Request type to include auth data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
        permissions: string[];
        organizationId?: string;
      };
      apiKey?: {
        id: string;
        name: string;
        scopes: string[];
        rateLimit?: number;
      };
    }
  }
}

/**
 * User roles enum
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SCHEDULER = 'scheduler',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

/**
 * Permission types for constraint operations
 */
export enum Permission {
  // Constraint permissions
  CONSTRAINT_CREATE = 'constraint:create',
  CONSTRAINT_READ = 'constraint:read',
  CONSTRAINT_UPDATE = 'constraint:update',
  CONSTRAINT_DELETE = 'constraint:delete',
  CONSTRAINT_EVALUATE = 'constraint:evaluate',
  CONSTRAINT_BULK = 'constraint:bulk',
  
  // Template permissions
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_READ = 'template:read',
  TEMPLATE_USE = 'template:use',
  
  // Import/Export permissions
  CONSTRAINT_IMPORT = 'constraint:import',
  CONSTRAINT_EXPORT = 'constraint:export',
  
  // Admin permissions
  ADMIN_OVERRIDE = 'admin:override',
  ADMIN_BYPASS_VALIDATION = 'admin:bypass_validation'
}

/**
 * Role-permission mapping
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // All permissions
  [UserRole.ADMIN]: [
    Permission.CONSTRAINT_CREATE,
    Permission.CONSTRAINT_READ,
    Permission.CONSTRAINT_UPDATE,
    Permission.CONSTRAINT_DELETE,
    Permission.CONSTRAINT_EVALUATE,
    Permission.CONSTRAINT_BULK,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_USE,
    Permission.CONSTRAINT_IMPORT,
    Permission.CONSTRAINT_EXPORT
  ],
  [UserRole.SCHEDULER]: [
    Permission.CONSTRAINT_CREATE,
    Permission.CONSTRAINT_READ,
    Permission.CONSTRAINT_UPDATE,
    Permission.CONSTRAINT_EVALUATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_USE,
    Permission.CONSTRAINT_EXPORT
  ],
  [UserRole.ANALYST]: [
    Permission.CONSTRAINT_READ,
    Permission.CONSTRAINT_EVALUATE,
    Permission.TEMPLATE_READ,
    Permission.CONSTRAINT_EXPORT
  ],
  [UserRole.VIEWER]: [
    Permission.CONSTRAINT_READ,
    Permission.TEMPLATE_READ
  ]
};

/**
 * JWT secret (in production, use environment variable)
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * API key storage (in production, use database)
 */
const apiKeys = new Map<string, {
  id: string;
  name: string;
  hashedKey: string;
  scopes: string[];
  rateLimit: number;
  createdAt: Date;
  lastUsed: Date;
}>();

// Initialize with demo API key (remove in production)
const demoKey = 'demo-api-key-12345';
const hashedDemoKey = crypto.createHash('sha256').update(demoKey).digest('hex');
apiKeys.set(hashedDemoKey, {
  id: 'demo-key-1',
  name: 'Demo API Key',
  hashedKey: hashedDemoKey,
  scopes: ['read', 'write'],
  rateLimit: 1000,
  createdAt: new Date(),
  lastUsed: new Date()
});

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({
      status: 'error',
      error: {
        code: 'MISSING_AUTH_HEADER',
        message: 'Authorization header is required'
      }
    });
    return;
  }
  
  const token = authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    res.status(401).json({
      status: 'error',
      error: {
        code: 'MISSING_TOKEN',
        message: 'JWT token is required'
      }
    });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: getPermissionsForRoles(decoded.roles || []),
      organizationId: decoded.organizationId
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'JWT token has expired'
        }
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid JWT token'
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error'
        }
      });
    }
  }
};

/**
 * API Key Authentication Middleware
 */
export const authenticateAPIKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string || req.query.apiKey as string;
  
  if (!apiKey) {
    res.status(401).json({
      status: 'error',
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required'
      }
    });
    return;
  }
  
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyData = apiKeys.get(hashedKey);
  
  if (!keyData) {
    res.status(401).json({
      status: 'error',
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key'
      }
    });
    return;
  }
  
  // Update last used timestamp
  keyData.lastUsed = new Date();
  
  req.apiKey = {
    id: keyData.id,
    name: keyData.name,
    scopes: keyData.scopes,
    rateLimit: keyData.rateLimit
  };
  
  next();
};

/**
 * Combined authentication middleware (JWT or API Key)
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (authHeader) {
    authenticateJWT(req, res, next);
  } else if (apiKey) {
    authenticateAPIKey(req, res, next);
  } else {
    res.status(401).json({
      status: 'error',
      error: {
        code: 'NO_AUTH_PROVIDED',
        message: 'Authentication is required. Provide either JWT token or API key.'
      }
    });
  }
};

/**
 * Authorization middleware - check permissions
 */
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user && !req.apiKey) {
      res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }
    
    // API key authorization
    if (req.apiKey) {
      // For API keys, check scopes
      const hasRequiredScope = requiredPermissions.some(permission => {
        const scope = permission.split(':')[1]; // Extract operation from permission
        return req.apiKey!.scopes.includes(scope) || req.apiKey!.scopes.includes('*');
      });
      
      if (hasRequiredScope) {
        next();
        return;
      }
    }
    
    // JWT user authorization
    if (req.user) {
      const hasPermission = requiredPermissions.some(permission => 
        req.user!.permissions.includes(permission) || 
        req.user!.permissions.includes(Permission.ADMIN_OVERRIDE)
      );
      
      if (hasPermission) {
        next();
        return;
      }
    }
    
    res.status(403).json({
      status: 'error',
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        required: requiredPermissions,
        current: req.user?.permissions || []
      }
    });
  };
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }
    
    const hasRole = roles.some(role => req.user!.roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role privileges',
          required: roles,
          current: req.user.roles
        }
      });
      return;
    }
    
    next();
  };
};

/**
 * Organization-based access control
 */
export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.organizationId) {
    res.status(403).json({
      status: 'error',
      error: {
        code: 'NO_ORGANIZATION',
        message: 'User must belong to an organization'
      }
    });
    return;
  }
  
  next();
};

/**
 * Rate limiting middleware for API keys
 */
export const apiKeyRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.apiKey) {
    next();
    return;
  }
  
  // In production, use Redis or similar for distributed rate limiting
  // This is a simple in-memory implementation
  const key = `rate-limit:${req.apiKey.id}`;
  const limit = req.apiKey.rateLimit || 1000;
  
  // Simple rate limit check (implement proper rate limiting in production)
  const rateLimitExceeded = false; // Placeholder
  
  if (rateLimitExceeded) {
    res.status(429).json({
      status: 'error',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded',
        limit: limit,
        reset: new Date(Date.now() + 3600000).toISOString()
      }
    });
    return;
  }
  
  next();
};

/**
 * CORS configuration with authentication
 */
export const corsWithAuth = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://app.flextime.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-API-Key', 
    'X-User-Id',
    'X-Organization-Id'
  ],
  exposedHeaders: [
    'X-Total-Count', 
    'X-Page-Count',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ]
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

/**
 * Helper function to get permissions for roles
 */
function getPermissionsForRoles(roles: string[]): Permission[] {
  const permissions = new Set<Permission>();
  
  roles.forEach(role => {
    const rolePermissionList = rolePermissions[role as UserRole];
    if (rolePermissionList) {
      rolePermissionList.forEach(permission => permissions.add(permission));
    }
  });
  
  return Array.from(permissions);
}

/**
 * Generate JWT token
 */
export function generateToken(user: {
  id: string;
  email: string;
  roles: string[];
  organizationId?: string;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      organizationId: user.organizationId
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'flextime-api',
      audience: 'flextime-client'
    }
  );
}

/**
 * Generate API key
 */
export function generateAPIKey(): { key: string; hashedKey: string } {
  const key = crypto.randomBytes(32).toString('hex');
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hashedKey };
}