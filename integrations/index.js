/**
 * Flextime Integration Ecosystem
 * Main entry point for the integration infrastructure
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import configuration
import config from './config.js';

// Import core modules
import { WebhookManager } from './webhooks/index.js';
import { APIGateway } from './apis/index.js';
import { MessageQueueManager } from './message-queues/index.js';
import { DatabaseManager } from './databases/index.js';
import { ExternalServiceManager } from './external-services/index.js';
import { DataSyncManager } from './data-sync/index.js';

// Import utilities
import { Logger } from './utils/logger.js';
import { HealthChecker } from './utils/health-checker.js';
import { MetricsCollector } from './utils/metrics.js';

class IntegrationEcosystem {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.apis.rest.cors.origin,
        credentials: true
      }
    });
    
    this.logger = new Logger('integration-ecosystem');
    this.healthChecker = new HealthChecker();
    this.metrics = new MetricsCollector();
    
    // Initialize managers
    this.webhookManager = new WebhookManager();
    this.apiGateway = new APIGateway();
    this.messageQueueManager = new MessageQueueManager();
    this.databaseManager = new DatabaseManager();
    this.externalServiceManager = new ExternalServiceManager();
    this.dataSyncManager = new DataSyncManager();
  }

  async initialize() {
    try {
      this.logger.info('Initializing Flextime Integration Ecosystem...');

      // Setup Express middleware
      this.setupMiddleware();

      // Initialize core managers
      await this.initializeManagers();

      // Setup routes
      this.setupRoutes();

      // Setup WebSocket handling
      this.setupWebSocket();

      // Setup health checks and monitoring
      this.setupMonitoring();

      // Setup error handling
      this.setupErrorHandling();

      this.logger.info('Integration Ecosystem initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Integration Ecosystem:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors(config.apis.rest.cors));
    
    // Compression
    this.app.use(compression());
    
    // Request logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => this.logger.info(message.trim()) }
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.apis.rest.rateLimit.windowMs,
      max: config.apis.rest.rateLimit.max,
      message: 'Too many requests from this IP'
    });
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  async initializeManagers() {
    // Initialize database connections first
    await this.databaseManager.initialize();
    
    // Initialize message queues
    await this.messageQueueManager.initialize();
    
    // Initialize external services
    await this.externalServiceManager.initialize();
    
    // Initialize webhook handlers
    await this.webhookManager.initialize();
    
    // Initialize API gateway
    await this.apiGateway.initialize();
    
    // Initialize data sync manager
    await this.dataSyncManager.initialize();
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api', this.apiGateway.getRouter());
    
    // Webhook routes
    this.app.use('/webhooks', this.webhookManager.getRouter());
    
    // Data sync routes
    this.app.use('/sync', this.dataSyncManager.getRouter());
    
    // External service routes
    this.app.use('/external', this.externalServiceManager.getRouter());
    
    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json(this.metrics.getMetrics());
    });

    // Admin routes
    this.app.use('/admin', this.getAdminRouter());
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      this.logger.info(`WebSocket client connected: ${socket.id}`);
      
      // Handle real-time data sync events
      socket.on('subscribe-sync', (data) => {
        this.dataSyncManager.subscribeToUpdates(socket, data);
      });
      
      // Handle webhook events
      socket.on('subscribe-webhooks', (data) => {
        this.webhookManager.subscribeToEvents(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  setupMonitoring() {
    // Start health checks
    this.healthChecker.start([
      () => this.databaseManager.healthCheck(),
      () => this.messageQueueManager.healthCheck(),
      () => this.externalServiceManager.healthCheck()
    ]);

    // Start metrics collection
    this.metrics.start();

    // Monitor webhook performance
    this.webhookManager.on('webhook-processed', (data) => {
      this.metrics.recordWebhookProcessed(data);
    });

    // Monitor API performance
    this.apiGateway.on('request-processed', (data) => {
      this.metrics.recordApiRequest(data);
    });

    // Monitor data sync performance
    this.dataSyncManager.on('sync-completed', (data) => {
      this.metrics.recordSyncCompleted(data);
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      this.logger.error('Unhandled error:', error);
      
      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: config.environment === 'development' ? error.message : 'Something went wrong'
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  getAdminRouter() {
    const router = express.Router();
    
    // System status
    router.get('/status', async (req, res) => {
      const status = {
        ecosystem: 'healthy',
        databases: await this.databaseManager.getStatus(),
        messageQueues: await this.messageQueueManager.getStatus(),
        externalServices: await this.externalServiceManager.getStatus(),
        webhooks: this.webhookManager.getStatus(),
        dataSync: this.dataSyncManager.getStatus(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      
      res.json(status);
    });
    
    // Force data sync
    router.post('/sync/force', async (req, res) => {
      try {
        const result = await this.dataSyncManager.forceSync(req.body);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Webhook management
    router.get('/webhooks', (req, res) => {
      res.json(this.webhookManager.getWebhookStats());
    });
    
    return router;
  }

  async start() {
    try {
      await this.initialize();
      
      const port = config.apis.rest.port;
      this.server.listen(port, () => {
        this.logger.info(`Integration Ecosystem running on port ${port}`);
        this.logger.info(`Environment: ${config.environment}`);
        this.logger.info('Available endpoints:');
        this.logger.info(`  - Health: http://localhost:${port}/health`);
        this.logger.info(`  - API: http://localhost:${port}/api`);
        this.logger.info(`  - Webhooks: http://localhost:${port}/webhooks`);
        this.logger.info(`  - Admin: http://localhost:${port}/admin/status`);
        this.logger.info(`  - Metrics: http://localhost:${port}/metrics`);
      });
    } catch (error) {
      this.logger.error('Failed to start Integration Ecosystem:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      this.logger.info('Shutting down Integration Ecosystem...');
      
      // Stop health checks
      this.healthChecker.stop();
      
      // Stop metrics collection
      this.metrics.stop();
      
      // Close managers
      await this.dataSyncManager.close();
      await this.externalServiceManager.close();
      await this.webhookManager.close();
      await this.messageQueueManager.close();
      await this.databaseManager.close();
      
      // Close server
      this.server.close();
      
      this.logger.info('Integration Ecosystem shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

// Create and start the integration ecosystem
const ecosystem = new IntegrationEcosystem();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await ecosystem.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await ecosystem.stop();
  process.exit(0);
});

// Start the ecosystem
ecosystem.start().catch((error) => {
  console.error('Failed to start Integration Ecosystem:', error);
  process.exit(1);
});

export default ecosystem;