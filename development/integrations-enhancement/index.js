#!/usr/bin/env node

/**
 * FlexTime Integrations & API Enhancement Suite
 * 
 * Main entry point for the complete integration platform
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Import route modules
const calendarRoutes = require('./calendar-integrations/calendar-routes');
const notionWebhookRoutes = require('./notion-webhooks/notion-webhook-routes');
const big12Routes = require('./big12-apis/big12-routes');
const webhookRoutes = require('./webhook-infrastructure/webhook-routes');
const mobileRoutes = require('./mobile-apis/mobile-routes');

// Import gateway config
const { initializeGateway } = require('./api-gateway/gateway-config');

const logger = console; // Use actual logger in production

class FlexTimeIntegrationsServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.PORT || 3005,
      enableGateway: config.enableGateway !== false,
      gatewayPort: config.gatewayPort || 3001,
      cors: {
        origin: ['http://localhost:3005', 'https://flextime.app'],
        credentials: true
      },
      ...config
    };

    this.app = express();
    this.gateway = null;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        },
      }
    }));

    // CORS
    this.app.use(cors(this.config.cors));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and timestamp
    this.app.use((req, res, next) => {
      req.id = require('uuid').v4();
      req.timestamp = Date.now();
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'FlexTime Integrations Suite',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        components: {
          calendar: 'active',
          notion: 'active',
          big12: 'active',
          webhooks: 'active',
          mobile: 'active'
        }
      });
    });

    // Integration routes
    this.app.use('/api/calendars', calendarRoutes);
    this.app.use('/api/webhooks', notionWebhookRoutes);
    this.app.use('/api/big12', big12Routes);
    this.app.use('/api/webhooks', webhookRoutes);
    this.app.use('/api/mobile', mobileRoutes);

    // API status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        service: 'FlexTime Integrations API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          calendar: {
            base: '/api/calendars',
            auth: '/api/calendars/auth/:provider',
            sync: '/api/calendars/:provider/:userId/sync',
            export: '/api/calendars/export/ical/:sport'
          },
          notion: {
            base: '/api/webhooks/notion',
            sync: '/api/webhooks/notion/sync/schedules/:sport',
            test: '/api/webhooks/notion/test'
          },
          big12: {
            base: '/api/big12',
            teams: '/api/big12/teams',
            standings: '/api/big12/standings/:sport',
            tv: '/api/big12/tv-schedule/:sport'
          },
          webhooks: {
            base: '/api/webhooks',
            register: '/api/webhooks/register',
            trigger: '/api/webhooks/trigger'
          },
          mobile: {
            base: '/api/mobile',
            schedules: '/api/mobile/schedules',
            sync: '/api/mobile/sync',
            push: '/api/mobile/push/register'
          }
        }
      });
    });

    // Documentation route
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'FlexTime Integrations & API Enhancement Suite',
        description: 'Enterprise-grade integration platform for FlexTime scheduling system',
        documentation: 'https://flextime.app/docs/integrations',
        github: 'https://github.com/flextime/integrations-enhancement',
        version: '1.0.0',
        features: [
          'Enterprise API Gateway',
          'Calendar System Integrations',
          'Enhanced Notion Integration',
          'Big 12 Conference APIs',
          'Webhook Infrastructure',
          'Mobile-Optimized Endpoints'
        ]
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
          '/health',
          '/api/status',
          '/api/calendars',
          '/api/webhooks',
          '/api/big12',
          '/api/mobile',
          '/docs'
        ]
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start the integration server
   */
  async start() {
    try {
      // Start API Gateway if enabled
      if (this.config.enableGateway) {
        logger.log('🚀 Starting API Gateway...');
        this.gateway = await initializeGateway({
          port: this.config.gatewayPort
        });
        await this.gateway.start();
        logger.log(`✅ API Gateway running on port ${this.config.gatewayPort}`);
      }

      // Start main integrations server
      const server = this.app.listen(this.config.port, () => {
        logger.log(`🚀 FlexTime Integrations Server running on port ${this.config.port}`);
        logger.log(`📊 Health check: http://localhost:${this.config.port}/health`);
        logger.log(`🔗 API status: http://localhost:${this.config.port}/api/status`);
        logger.log(`📚 Documentation: http://localhost:${this.config.port}/docs`);
        
        if (this.config.enableGateway) {
          logger.log(`🌐 API Gateway: http://localhost:${this.config.gatewayPort}/health`);
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown(server));
      process.on('SIGINT', () => this.shutdown(server));

      return server;

    } catch (error) {
      logger.error('❌ Failed to start FlexTime Integrations Server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(server) {
    logger.log('📴 Shutting down FlexTime Integrations Server...');
    
    try {
      // Close main server
      server.close(() => {
        logger.log('✅ Main server closed');
      });

      // Close gateway if running
      if (this.gateway) {
        await this.gateway.stop();
        logger.log('✅ API Gateway closed');
      }

      logger.log('✅ Shutdown complete');
      process.exit(0);

    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new FlexTimeIntegrationsServer();
  server.start();
}

module.exports = FlexTimeIntegrationsServer;