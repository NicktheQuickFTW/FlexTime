/**
 * Scheduler Service - Main Entry Point
 * 
 * Core scheduling service that handles schedule generation, optimization,
 * and coordination with other FlexTime agent microservices.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./scripts/logger');
const metricsMiddleware = require('./middleware/metrics');
const authMiddleware = require('./middleware/auth');
const SchedulingEngine = require('./services/SchedulingEngine');
const CommunicationClient = require('./services/CommunicationClient');
const ScheduleOptimizer = require('./services/ScheduleOptimizer');
const HealthService = require('./services/HealthService');
const JobQueue = require('./services/JobQueue');

// Configuration
const config = {
  port: process.env.PORT || 3002,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/flextime_scheduler',
  communicationHubUrl: process.env.COMMUNICATION_HUB_URL || 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 500,
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 10,
  scheduleTimeout: parseInt(process.env.SCHEDULE_TIMEOUT_MS, 10) || 300000 // 5 minutes
};

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Metrics middleware
app.use(metricsMiddleware);

// Initialize services
let schedulingEngine;
let communicationClient;
let scheduleOptimizer;
let healthService;
let jobQueue;

/**
 * Initialize all services
 */
async function initializeServices() {
  try {
    logger.info('Initializing Scheduler services...');
    
    // Initialize Job Queue
    jobQueue = new JobQueue({
      redisUrl: config.redisUrl,
      maxConcurrentJobs: config.maxConcurrentJobs
    });
    await jobQueue.initialize();
    
    // Initialize Communication Client
    communicationClient = new CommunicationClient({
      hubUrl: config.communicationHubUrl,
      serviceName: 'scheduler-svc',
      redisUrl: config.redisUrl
    });
    await communicationClient.initialize();
    
    // Initialize Scheduling Engine
    schedulingEngine = new SchedulingEngine({
      databaseUrl: config.databaseUrl,
      communicationClient,
      jobQueue,
      scheduleTimeout: config.scheduleTimeout
    });
    await schedulingEngine.initialize();
    
    // Initialize Schedule Optimizer
    scheduleOptimizer = new ScheduleOptimizer({
      schedulingEngine,
      communicationClient,
      jobQueue
    });
    await scheduleOptimizer.initialize();
    
    // Initialize Health Service
    healthService = new HealthService({
      schedulingEngine,
      communicationClient,
      scheduleOptimizer,
      jobQueue
    });
    
    // Set up event handlers
    setupEventHandlers();
    
    logger.info('All Scheduler services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

/**
 * Set up event handlers for inter-service communication
 */
function setupEventHandlers() {
  // Handle schedule creation requests
  communicationClient.onEvent('schedule.create', async (event) => {
    try {
      logger.info('Received schedule creation request:', event.data.correlationId);
      
      const scheduleJob = await jobQueue.addJob('createSchedule', {
        requestId: event.data.correlationId,
        parameters: event.data.payload,
        sourceService: event.data.sourceService
      }, {
        priority: event.data.priority === 'high' ? 1 : 5,
        timeout: config.scheduleTimeout
      });
      
      logger.info('Schedule creation job queued:', scheduleJob.id);
    } catch (error) {
      logger.error('Failed to handle schedule creation request:', error);
    }
  });
  
  // Handle schedule optimization requests
  communicationClient.onEvent('schedule.optimize', async (event) => {
    try {
      logger.info('Received schedule optimization request:', event.data.correlationId);
      
      const optimizationJob = await jobQueue.addJob('optimizeSchedule', {
        requestId: event.data.correlationId,
        scheduleId: event.data.payload.scheduleId,
        constraints: event.data.payload.constraints,
        sourceService: event.data.sourceService
      }, {
        priority: event.data.priority === 'high' ? 1 : 5,
        timeout: config.scheduleTimeout
      });
      
      logger.info('Schedule optimization job queued:', optimizationJob.id);
    } catch (error) {
      logger.error('Failed to handle schedule optimization request:', error);
    }
  });
  
  // Handle conflict resolution results
  communicationClient.onEvent('conflict.resolved', async (event) => {
    try {
      logger.info('Received conflict resolution result:', event.data.correlationId);
      
      // Update schedule with resolved conflicts
      await schedulingEngine.updateScheduleWithResolutions(
        event.data.payload.scheduleId,
        event.data.payload.resolutions
      );
      
      // Notify that schedule has been updated
      await communicationClient.publishEvent({
        type: 'schedule.updated',
        targetService: 'broadcast',
        payload: {
          scheduleId: event.data.payload.scheduleId,
          updateType: 'conflict_resolution',
          resolutions: event.data.payload.resolutions
        },
        correlationId: event.data.correlationId
      });
      
    } catch (error) {
      logger.error('Failed to handle conflict resolution result:', error);
    }
  });
  
  // Handle travel optimization results
  communicationClient.onEvent('travel.optimized', async (event) => {
    try {
      logger.info('Received travel optimization result:', event.data.correlationId);
      
      // Update schedule with travel optimizations
      await schedulingEngine.updateScheduleWithTravelOptimizations(
        event.data.payload.scheduleId,
        event.data.payload.optimizations
      );
      
      // Notify that schedule has been updated
      await communicationClient.publishEvent({
        type: 'schedule.updated',
        targetService: 'broadcast',
        payload: {
          scheduleId: event.data.payload.scheduleId,
          updateType: 'travel_optimization',
          optimizations: event.data.payload.optimizations
        },
        correlationId: event.data.correlationId
      });
      
    } catch (error) {
      logger.error('Failed to handle travel optimization result:', error);
    }
  });
  
  logger.info('Event handlers configured successfully');
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
  try {
    const readinessStatus = await healthService.getReadinessStatus();
    const statusCode = readinessStatus.ready ? 200 : 503;
    res.status(statusCode).json(readinessStatus);
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const promClient = require('prom-client');
    const metrics = await promClient.register.metrics();
    res.set('Content-Type', promClient.register.contentType);
    res.end(metrics);
  } catch (error) {
    logger.error('Failed to generate metrics:', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// API Routes
app.use('/api/v1/schedules', authMiddleware, require('./routes/schedules'));
app.use('/api/v1/optimization', authMiddleware, require('./routes/optimization'));
app.use('/api/v1/jobs', authMiddleware, require('./routes/jobs'));
app.use('/api/v1/admin', authMiddleware, require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = config.nodeEnv === 'production' ? 'Internal Server Error' : err.message;
  
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      correlationId: req.headers['x-correlation-id']
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Shutdown services
    if (jobQueue) {
      await jobQueue.shutdown();
      logger.info('Job Queue shut down');
    }
    
    if (scheduleOptimizer) {
      await scheduleOptimizer.shutdown();
      logger.info('Schedule Optimizer shut down');
    }
    
    if (schedulingEngine) {
      await schedulingEngine.shutdown();
      logger.info('Scheduling Engine shut down');
    }
    
    if (communicationClient) {
      await communicationClient.shutdown();
      logger.info('Communication Client shut down');
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
let server;

async function startServer() {
  try {
    await initializeServices();
    
    server = app.listen(config.port, () => {
      logger.info(`Scheduler Service listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Log Level: ${config.logLevel}`);
      logger.info('Service ready to handle requests');
    });
    
    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, gracefulShutdown };