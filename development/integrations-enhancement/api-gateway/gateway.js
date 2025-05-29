/**
 * FlexTime Enterprise API Gateway
 * 
 * Provides centralized API management with rate limiting, authentication,
 * versioning, and comprehensive monitoring for all FlexTime APIs.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

class FlexTimeAPIGateway {
  constructor(config = {}) {
    this.app = express();
    this.config = {
      port: config.port || 3000,
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'flextime-secret',
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      enableMetrics: config.enableMetrics !== false,
      enableVersioning: config.enableVersioning !== false,
      cors: config.cors || {
        origin: ['http://localhost:3005', 'https://flextime.app'],
        credentials: true
      },
      rateLimits: {
        default: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
        auth: { windowMs: 5 * 60 * 1000, max: 5 }, // 5 auth attempts per 5 minutes
        premium: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
        webhook: { windowMs: 1 * 60 * 1000, max: 60 } // 60 webhook calls per minute
      }
    };
    
    this.redisClient = null;
    this.routes = new Map();
    this.middleware = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      byEndpoint: new Map(),
      byUser: new Map()
    };
    
    this.initializeMiddleware();
    this.initializeRedis();
  }

  /**
   * Initialize core middleware
   */
  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors(this.config.cors));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and logging
    this.app.use((req, res, next) => {
      req.id = uuidv4();
      req.timestamp = Date.now();
      next();
    });

    // Logging
    this.app.use(morgan(':method :url :status :res[content-length] - :response-time ms [:date[clf]]'));

    // Metrics collection
    if (this.config.enableMetrics) {
      this.app.use(this.metricsMiddleware.bind(this));
    }
  }

  /**
   * Initialize Redis connection for caching and rate limiting
   */
  async initializeRedis() {
    try {
      this.redisClient = redis.createClient({ url: this.config.redisUrl });
      await this.redisClient.connect();
      console.log('✅ Redis connected for API Gateway');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, falling back to memory store:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Create rate limiter with different tiers
   */
  createRateLimiter(tier = 'default') {
    const config = this.config.rateLimits[tier] || this.config.rateLimits.default;
    
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(config.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redisClient ? new rateLimit.RedisStore({
        client: this.redisClient,
        prefix: 'rl:',
      }) : undefined,
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      }
    });
  }

  /**
   * JWT Authentication middleware
   */
  authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  /**
   * API Key authentication middleware
   */
  authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Validate API key against database or cache
    this.validateApiKey(apiKey)
      .then(user => {
        if (user) {
          req.user = user;
          next();
        } else {
          res.status(403).json({ error: 'Invalid API key' });
        }
      })
      .catch(error => {
        res.status(500).json({ error: 'Authentication service error' });
      });
  }

  /**
   * Validate API key (stub - implement with your auth system)
   */
  async validateApiKey(apiKey) {
    // TODO: Implement actual API key validation
    // This should check against your database/cache
    if (apiKey === 'flextime-demo-key') {
      return { id: 'demo-user', tier: 'default', permissions: ['read'] };
    }
    return null;
  }

  /**
   * Version detection middleware
   */
  versionMiddleware(req, res, next) {
    // Extract version from header, path, or query parameter
    let version = req.headers['api-version'] || 
                  req.query.version || 
                  req.path.match(/^\/v(\d+)\//)?.[1] || 
                  'v1';
    
    if (!version.startsWith('v')) {
      version = `v${version}`;
    }
    
    req.apiVersion = version;
    next();
  }

  /**
   * Metrics collection middleware
   */
  metricsMiddleware(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.metrics.requests++;
      this.metrics.responseTime.push(duration);
      
      if (res.statusCode >= 400) {
        this.metrics.errors++;
      }
      
      // Track by endpoint
      const endpoint = `${req.method} ${req.path}`;
      if (!this.metrics.byEndpoint.has(endpoint)) {
        this.metrics.byEndpoint.set(endpoint, { requests: 0, errors: 0, avgResponseTime: 0 });
      }
      
      const endpointMetrics = this.metrics.byEndpoint.get(endpoint);
      endpointMetrics.requests++;
      if (res.statusCode >= 400) endpointMetrics.errors++;
      endpointMetrics.avgResponseTime = 
        (endpointMetrics.avgResponseTime * (endpointMetrics.requests - 1) + duration) / endpointMetrics.requests;
      
      // Track by user
      if (req.user) {
        if (!this.metrics.byUser.has(req.user.id)) {
          this.metrics.byUser.set(req.user.id, { requests: 0, errors: 0 });
        }
        const userMetrics = this.metrics.byUser.get(req.user.id);
        userMetrics.requests++;
        if (res.statusCode >= 400) userMetrics.errors++;
      }
    });
    
    next();
  }

  /**
   * Register a service route with the gateway
   */
  registerService(name, config) {
    const {
      path,
      target,
      version = 'v1',
      auth = 'none', // 'none', 'jwt', 'apikey', 'both'
      rateLimit = 'default',
      cache = false,
      transform = null
    } = config;

    const router = express.Router();
    
    // Apply rate limiting
    if (rateLimit) {
      router.use(this.createRateLimiter(rateLimit));
    }
    
    // Apply authentication
    if (auth === 'jwt') {
      router.use(this.authenticateJWT.bind(this));
    } else if (auth === 'apikey') {
      router.use(this.authenticateApiKey.bind(this));
    } else if (auth === 'both') {
      router.use((req, res, next) => {
        // Try JWT first, fallback to API key
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          this.authenticateJWT(req, res, next);
        } else {
          this.authenticateApiKey(req, res, next);
        }
      });
    }
    
    // Proxy to target service
    router.use('*', async (req, res) => {
      try {
        // TODO: Implement actual service proxying
        // This is a placeholder for service routing
        res.json({
          service: name,
          version,
          path: req.originalUrl,
          user: req.user?.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ error: 'Service unavailable' });
      }
    });
    
    // Mount the service
    const servicePath = `/${version}/${path}`;
    this.app.use(servicePath, router);
    this.routes.set(name, { path: servicePath, config });
    
    console.log(`📡 Registered service: ${name} at ${servicePath}`);
  }

  /**
   * Health check endpoint
   */
  setupHealthCheck() {
    this.app.get('/health', (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        redis: this.redisClient ? 'connected' : 'disconnected',
        services: Array.from(this.routes.keys()),
        metrics: this.config.enableMetrics ? this.getMetricsSummary() : null
      };
      
      res.json(health);
    });
  }

  /**
   * Metrics endpoint
   */
  setupMetricsEndpoint() {
    this.app.get('/metrics', (req, res) => {
      res.json({
        summary: this.getMetricsSummary(),
        detailed: {
          byEndpoint: Object.fromEntries(this.metrics.byEndpoint),
          byUser: Object.fromEntries(this.metrics.byUser)
        }
      });
    });
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const responseTime = this.metrics.responseTime;
    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: responseTime.length > 0 ? 
        Math.round(responseTime.reduce((a, b) => a + b, 0) / responseTime.length) + 'ms' : '0ms',
      activeServices: this.routes.size
    };
  }

  /**
   * Start the API Gateway
   */
  async start() {
    this.app.use(this.versionMiddleware.bind(this));
    this.setupHealthCheck();
    this.setupMetricsEndpoint();
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        availableServices: Array.from(this.routes.keys())
      });
    });
    
    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('Gateway error:', error);
      res.status(500).json({
        error: 'Internal gateway error',
        requestId: req.id
      });
    });
    
    const server = this.app.listen(this.config.port, () => {
      console.log(`🚀 FlexTime API Gateway running on port ${this.config.port}`);
      console.log(`📊 Health check: http://localhost:${this.config.port}/health`);
      console.log(`📈 Metrics: http://localhost:${this.config.port}/metrics`);
    });
    
    return server;
  }

  /**
   * Stop the gateway
   */
  async stop() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

module.exports = FlexTimeAPIGateway;