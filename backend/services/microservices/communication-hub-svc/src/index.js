/**
 * Communication Hub Service - Main Entry Point
 * 
 * This service acts as the central communication hub for FlexTime agent microservices,
 * providing event routing, message orchestration, and distributed communication patterns.
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
const CommunicationHub = require('./services/CommunicationHub');
const EventRouter = require('./services/EventRouter');
const MessageOrchestrator = require('./services/MessageOrchestrator');
const HealthService = require('./services/HealthService');

// Configuration
const config = {
  port: process.env.PORT || 3001,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware
app.use(metricsMiddleware);

// Initialize services
let communicationHub;
let eventRouter;
let messageOrchestrator;
let healthService;

/**
 * Initialize all services
 */
async function initializeServices() {
  try {
    logger.info('Initializing Communication Hub services...');
    
    // Initialize Communication Hub
    communicationHub = new CommunicationHub({
      redisUrl: config.redisUrl,
      nodeEnv: config.nodeEnv
    });
    await communicationHub.initialize();
    
    // Initialize Event Router
    eventRouter = new EventRouter({
      communicationHub,
      logger
    });
    await eventRouter.initialize();
    
    // Initialize Message Orchestrator
    messageOrchestrator = new MessageOrchestrator({
      communicationHub,
      eventRouter,
      logger
    });
    await messageOrchestrator.initialize();
    
    // Initialize Health Service
    healthService = new HealthService({
      communicationHub,
      eventRouter,
      messageOrchestrator
    });
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
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
app.use('/api/v1/events', authMiddleware, require('./routes/events'));
app.use('/api/v1/messages', authMiddleware, require('./routes/messages'));
app.use('/api/v1/orchestration', authMiddleware, require('./routes/orchestration'));
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
    if (messageOrchestrator) {
      await messageOrchestrator.shutdown();
      logger.info('Message Orchestrator shut down');
    }
    
    if (eventRouter) {
      await eventRouter.shutdown();
      logger.info('Event Router shut down');
    }
    
    if (communicationHub) {
      await communicationHub.shutdown();
      logger.info('Communication Hub shut down');
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
      logger.info(`Communication Hub Service listening on port ${config.port}`);
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