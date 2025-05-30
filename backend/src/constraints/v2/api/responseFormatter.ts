/**
 * Response Formatter for Constraint Management API
 * 
 * Provides standardized response formatting, error handling, and data transformation
 * for consistent API responses across all endpoints.
 */

import { Response } from 'express';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
  links?: ResponseLinks;
}

/**
 * Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  timestamp?: string;
  traceId?: string;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  timestamp: string;
  version: string;
  requestId: string;
  responseTime?: number;
  pagination?: PaginationMeta;
  cache?: CacheMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Cache metadata
 */
export interface CacheMeta {
  cached: boolean;
  cacheKey?: string;
  ttl?: number;
  timestamp?: string;
}

/**
 * HATEOAS links
 */
export interface ResponseLinks {
  self: string;
  next?: string;
  previous?: string;
  first?: string;
  last?: string;
  related?: Record<string, string>;
}

/**
 * Error codes enum
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Constraint-specific errors
  CONSTRAINT_NOT_FOUND = 'CONSTRAINT_NOT_FOUND',
  CONSTRAINT_CONFLICT = 'CONSTRAINT_CONFLICT',
  CONSTRAINT_DEPENDENCY_ERROR = 'CONSTRAINT_DEPENDENCY_ERROR',
  CONSTRAINT_EVALUATION_ERROR = 'CONSTRAINT_EVALUATION_ERROR',
  CONSTRAINT_INVALID_TYPE = 'CONSTRAINT_INVALID_TYPE',
  
  // Template errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID_PARAMS = 'TEMPLATE_INVALID_PARAMS',
  
  // Import/Export errors
  IMPORT_FORMAT_ERROR = 'IMPORT_FORMAT_ERROR',
  EXPORT_FORMAT_ERROR = 'EXPORT_FORMAT_ERROR',
  
  // Schedule errors
  SCHEDULE_INVALID_FORMAT = 'SCHEDULE_INVALID_FORMAT',
  SCHEDULE_EVALUATION_FAILED = 'SCHEDULE_EVALUATION_FAILED'
}

/**
 * Response formatter class
 */
export class ResponseFormatter {
  private static readonly API_VERSION = '2.0';
  
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: Partial<ResponseMeta>,
    links?: ResponseLinks
  ): Response {
    const response: ApiResponse<T> = {
      status: 'success',
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.API_VERSION,
        requestId: res.locals.requestId || this.generateRequestId(),
        ...meta
      }
    };
    
    if (links) {
      response.links = links;
    }
    
    // Add response time if available
    if (res.locals.startTime) {
      response.meta!.responseTime = Date.now() - res.locals.startTime;
    }
    
    return res.status(statusCode).json(response);
  }
  
  /**
   * Send error response
   */
  static error(
    res: Response,
    code: ErrorCode | string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      status: 'error',
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        traceId: res.locals.requestId || this.generateRequestId()
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: this.API_VERSION,
        requestId: res.locals.requestId || this.generateRequestId()
      }
    };
    
    // Log error for monitoring
    console.error(`API Error [${code}]: ${message}`, details);
    
    return res.status(statusCode).json(response);
  }
  
  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    baseUrl: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;
    
    const meta: Partial<ResponseMeta> = {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious
      }
    };
    
    const links: ResponseLinks = {
      self: `${baseUrl}?page=${page}&limit=${limit}`,
      first: `${baseUrl}?page=1&limit=${limit}`,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}`
    };
    
    if (hasNext) {
      links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    }
    
    if (hasPrevious) {
      links.previous = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    }
    
    // Set pagination headers
    res.setHeader('X-Total-Count', total.toString());
    res.setHeader('X-Page-Count', totalPages.toString());
    res.setHeader('X-Current-Page', page.toString());
    res.setHeader('X-Per-Page', limit.toString());
    
    return this.success(res, data, 200, meta, links);
  }
  
  /**
   * Send created response
   */
  static created<T>(res: Response, data: T, location?: string): Response {
    if (location) {
      res.setHeader('Location', location);
    }
    
    return this.success(res, data, 201);
  }
  
  /**
   * Send no content response
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
  
  /**
   * Send accepted response (for async operations)
   */
  static accepted(res: Response, taskId: string, statusUrl: string): Response {
    res.setHeader('Location', statusUrl);
    
    return this.success(
      res,
      {
        taskId,
        status: 'processing',
        statusUrl
      },
      202
    );
  }
  
  /**
   * Format validation errors
   */
  static validationError(
    res: Response,
    errors: Array<{ field?: string; message: string; value?: any }>
  ): Response {
    return this.error(
      res,
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      errors
    );
  }
  
  /**
   * Format not found error
   */
  static notFound(res: Response, resource: string, id?: string): Response {
    const message = id 
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    
    return this.error(
      res,
      ErrorCode.NOT_FOUND,
      message,
      404
    );
  }
  
  /**
   * Format unauthorized error
   */
  static unauthorized(res: Response, message: string = 'Authentication required'): Response {
    return this.error(
      res,
      ErrorCode.UNAUTHORIZED,
      message,
      401
    );
  }
  
  /**
   * Format forbidden error
   */
  static forbidden(res: Response, message: string = 'Insufficient permissions'): Response {
    return this.error(
      res,
      ErrorCode.FORBIDDEN,
      message,
      403
    );
  }
  
  /**
   * Format conflict error
   */
  static conflict(res: Response, message: string, conflicts?: any): Response {
    return this.error(
      res,
      ErrorCode.CONSTRAINT_CONFLICT,
      message,
      409,
      conflicts
    );
  }
  
  /**
   * Format rate limit error
   */
  static rateLimitExceeded(res: Response, limit: number, reset: Date): Response {
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', reset.toISOString());
    res.setHeader('Retry-After', Math.ceil((reset.getTime() - Date.now()) / 1000).toString());
    
    return this.error(
      res,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      429,
      {
        limit,
        reset: reset.toISOString(),
        retryAfter: Math.ceil((reset.getTime() - Date.now()) / 1000)
      }
    );
  }
  
  /**
   * Format bulk operation response
   */
  static bulkOperation<T>(
    res: Response,
    succeeded: T[],
    failed: Array<{ item: any; error: string }>,
    operation: string
  ): Response {
    const total = succeeded.length + failed.length;
    const successRate = total > 0 ? (succeeded.length / total) * 100 : 0;
    
    return this.success(
      res,
      {
        operation,
        summary: {
          total,
          succeeded: succeeded.length,
          failed: failed.length,
          successRate: `${successRate.toFixed(2)}%`
        },
        succeeded,
        failed
      },
      failed.length > 0 ? 207 : 200 // 207 Multi-Status if partial success
    );
  }
  
  /**
   * Format file download response
   */
  static download(
    res: Response,
    data: Buffer | string,
    filename: string,
    contentType: string = 'application/octet-stream'
  ): Response {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(data).toString());
    
    return res.status(200).send(data);
  }
  
  /**
   * Transform constraint data for response
   */
  static transformConstraint(constraint: any): any {
    return {
      id: constraint.id,
      name: constraint.name,
      description: constraint.description,
      type: constraint.type,
      hardness: constraint.hardness,
      weight: constraint.weight,
      priority: constraint.priority,
      scope: constraint.scope,
      parameters: constraint.parameters,
      metadata: {
        ...constraint.metadata,
        evaluation: undefined // Don't expose evaluation function
      },
      dependencies: constraint.dependencies,
      conflictsWith: constraint.conflictsWith,
      tags: constraint.metadata?.tags || [],
      createdAt: constraint.metadata?.createdAt,
      updatedAt: constraint.metadata?.updatedAt,
      version: constraint.metadata?.version,
      author: constraint.metadata?.author
    };
  }
  
  /**
   * Transform evaluation result for response
   */
  static transformEvaluationResult(result: any): any {
    return {
      satisfied: result.satisfied,
      score: result.score,
      violations: result.violations?.map((v: any) => ({
        constraintId: v.constraintId,
        constraintName: v.constraintName,
        type: v.type,
        severity: v.severity,
        message: v.message,
        context: v.context,
        suggestion: v.suggestion
      })),
      suggestions: result.suggestions,
      metrics: {
        totalConstraints: result.metrics?.totalConstraints,
        satisfiedConstraints: result.metrics?.satisfiedConstraints,
        violatedConstraints: result.metrics?.violatedConstraints,
        evaluationTime: result.metrics?.evaluationTime,
        overallScore: result.metrics?.overallScore
      },
      summary: {
        hardConstraintsSatisfied: result.summary?.hardConstraintsSatisfied,
        softConstraintsSatisfied: result.summary?.softConstraintsSatisfied,
        criticalViolations: result.summary?.criticalViolations,
        warnings: result.summary?.warnings
      }
    };
  }
  
  /**
   * Generate request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Format response with caching headers
   */
  static withCache<T>(
    res: Response,
    data: T,
    maxAge: number = 300, // 5 minutes default
    isPrivate: boolean = false
  ): Response {
    const cacheControl = isPrivate
      ? `private, max-age=${maxAge}`
      : `public, max-age=${maxAge}`;
    
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('ETag', this.generateETag(data));
    
    const meta: Partial<ResponseMeta> = {
      cache: {
        cached: false,
        ttl: maxAge,
        timestamp: new Date().toISOString()
      }
    };
    
    return this.success(res, data, 200, meta);
  }
  
  /**
   * Generate ETag for response data
   */
  private static generateETag(data: any): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }
}

/**
 * Response formatter middleware
 */
export const responseFormatter = (req: any, res: any, next: any) => {
  // Store start time for response time calculation
  res.locals.startTime = Date.now();
  
  // Generate request ID
  res.locals.requestId = ResponseFormatter.generateRequestId();
  
  // Add custom response methods
  res.success = function<T>(data: T, statusCode?: number, meta?: Partial<ResponseMeta>) {
    return ResponseFormatter.success(this, data, statusCode, meta);
  };
  
  res.error = function(code: ErrorCode | string, message: string, statusCode?: number, details?: any) {
    return ResponseFormatter.error(this, code, message, statusCode, details);
  };
  
  res.paginated = function<T>(data: T[], page: number, limit: number, total: number) {
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    return ResponseFormatter.paginated(this, data, page, limit, total, baseUrl);
  };
  
  next();
};