/**
 * FT Builder API
 * 
 * Unified REST API interface for the FT Builder engine
 * Provides comprehensive endpoints for all scheduling operations
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');

const FTBuilder = require('../core/FT Builder');
const logger = require('../utils/logger');
// TODO: Implement middleware
// const { authenticateRequest } = require('../middleware/auth');
// const { cacheMiddleware } = require('../middleware/cache');
// const { metricsMiddleware } = require('../middleware/metrics');

// Placeholder middleware functions
const authenticateRequest = (req, res, next) => next();
const cacheMiddleware = (seconds) => (req, res, next) => next();

class FTBuilderAPI {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.PORT || 3000,
      corsOrigins: config.corsOrigins || process.env.CORS_ORIGINS?.split(',') || ['*'],
      rateLimit: config.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requests per window
        message: 'Too many requests, please try again later'
      },
      enableWebSocket: config.enableWebSocket !== false,
      enableMetrics: config.enableMetrics !== false,
      enableCache: config.enableCache !== false,
      ...config
    };
    
    this.app = express();
    this.engine = null;
    this.server = null;
    this.wss = null;
    
    this._setupMiddleware();
    this._setupRoutes();
    this._setupErrorHandling();
  }

  /**
   * Set the FT Builder engine
   */
  setEngine(engine) {
    this.engine = engine;
  }

  /**
   * Get the Express app for mounting in another server
   */
  getApp() {
    return this.app;
  }

  /**
   * Initialize the API server
   */
  async initialize() {
    try {
      // Initialize the FT Builder engine
      this.engine = new FTBuilder(this.config.engineConfig);
      await this.engine.initialize();
      
      // Start HTTP server
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`🚀 FT Builder API running on port ${this.config.port}`);
      });
      
      // Setup WebSocket server if enabled
      if (this.config.enableWebSocket) {
        this._setupWebSocket();
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize API:', error);
      throw error;
    }
  }

  /**
   * Shutdown the API server
   */
  async shutdown() {
    logger.info('Shutting down FT Builder API...');
    
    // Close WebSocket connections
    if (this.wss) {
      this.wss.clients.forEach(client => client.close());
      this.wss.close();
    }
    
    // Shutdown engine
    if (this.engine) {
      await this.engine.shutdown();
    }
    
    // Close HTTP server
    if (this.server) {
      await new Promise(resolve => this.server.close(resolve));
    }
    
    logger.info('FT Builder API shutdown complete');
  }

  // ==================== Setup Methods ====================

  _setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Rate limiting
    const limiter = rateLimit(this.config.rateLimit);
    this.app.use('/api/', limiter);
    
    // Custom middleware
    // TODO: Implement metrics middleware
    // if (this.config.enableMetrics) {
    //   this.app.use(metricsMiddleware);
    // }
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  _setupRoutes() {
    const router = express.Router();
    
    // Health check
    router.get('/health', (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        engine: this.engine?.isInitialized ? 'ready' : 'not ready',
        version: '3.0.0'
      };
      res.json(health);
    });
    
    // Capabilities
    router.get('/capabilities', cacheMiddleware(300), (req, res) => {
      const capabilities = this.engine.getCapabilities();
      res.json(capabilities);
    });
    
    // ==================== Schedule Generation ====================
    
    router.post('/schedules/generate',
      authenticateRequest,
      [
        body('sport').notEmpty().isString(),
        body('teams').isArray({ min: 2 }),
        body('startDate').isISO8601(),
        body('endDate').isISO8601(),
        body('options').optional().isObject()
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          const schedule = await this.engine.generateSchedule(req.body);
          
          res.status(201).json({
            success: true,
            schedule,
            metadata: {
              generatedAt: new Date(),
              version: '3.0.0',
              performance: schedule._performanceMetrics
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    // ==================== Schedule Optimization ====================
    
    router.post('/schedules/:id/optimize',
      authenticateRequest,
      [
        param('id').notEmpty(),
        body('constraints').optional().isArray(),
        body('options').optional().isObject()
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          // In a real implementation, fetch schedule from database
          const schedule = await this._getSchedule(req.params.id);
          
          const optimized = await this.engine.optimizeSchedule(
            schedule,
            req.body.constraints || [],
            req.body.options || {}
          );
          
          res.json({
            success: true,
            schedule: optimized,
            improvements: optimized._improvements,
            metadata: {
              optimizedAt: new Date(),
              version: '3.0.0'
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    // ==================== Constraint Evaluation ====================
    
    router.post('/constraints/evaluate',
      authenticateRequest,
      [
        body('gameMove').isObject(),
        body('schedule').isObject(),
        body('constraints').optional().isArray()
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          const result = await this.engine.evaluateConstraints(
            req.body.gameMove,
            req.body.schedule,
            req.body.constraints || []
          );
          
          res.json({
            success: true,
            evaluation: result,
            metadata: {
              evaluatedAt: new Date(),
              responseTime: result.evaluationTime
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    // ==================== Batch Operations ====================
    
    router.post('/batch/generate',
      authenticateRequest,
      [
        body('requests').isArray({ min: 1, max: 100 }),
        body('parallel').optional().isBoolean()
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          const { requests, parallel = true } = req.body;
          
          let results;
          if (parallel) {
            results = await Promise.all(
              requests.map(request => 
                this.engine.generateSchedule(request)
                  .then(schedule => ({ success: true, schedule }))
                  .catch(error => ({ success: false, error: error.message }))
              )
            );
          } else {
            results = [];
            for (const request of requests) {
              try {
                const schedule = await this.engine.generateSchedule(request);
                results.push({ success: true, schedule });
              } catch (error) {
                results.push({ success: false, error: error.message });
              }
            }
          }
          
          res.json({
            success: true,
            results,
            summary: {
              total: results.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    // ==================== Analytics & Insights ====================
    
    router.get('/analytics/performance',
      authenticateRequest,
      cacheMiddleware(60),
      async (req, res, next) => {
        try {
          const metrics = this.engine.getPerformanceMetrics();
          res.json({
            success: true,
            metrics,
            timestamp: new Date()
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    router.post('/analytics/predict-quality',
      authenticateRequest,
      [
        body('schedule').isObject()
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          if (!this.engine.heliixConnector) {
            return res.status(503).json({
              success: false,
              error: 'ML predictions not available'
            });
          }
          
          const prediction = await this.engine.heliixConnector.predictQuality(req.body.schedule);
          res.json({
            success: true,
            prediction,
            timestamp: new Date()
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    // ==================== Import/Export ====================
    
    router.post('/schedules/import',
      authenticateRequest,
      [
        body('format').isIn(['csv', 'json', 'xlsx']),
        body('data').notEmpty()
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          const imported = await this._importSchedule(req.body.format, req.body.data);
          res.json({
            success: true,
            schedule: imported,
            metadata: {
              importedAt: new Date(),
              format: req.body.format
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
    
    router.get('/schedules/:id/export',
      authenticateRequest,
      [
        param('id').notEmpty(),
        query('format').optional().isIn(['csv', 'json', 'xlsx', 'ical'])
      ],
      this._validateRequest,
      async (req, res, next) => {
        try {
          const schedule = await this._getSchedule(req.params.id);
          const format = req.query.format || 'json';
          const exported = await this._exportSchedule(schedule, format);
          
          res.setHeader('Content-Type', this._getContentType(format));
          res.setHeader('Content-Disposition', `attachment; filename=schedule_${req.params.id}.${format}`);
          res.send(exported);
        } catch (error) {
          next(error);
        }
      }
    );
    
    // Mount router
    this.app.use('/api', router);
  }

  _setupWebSocket() {
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });
    
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket client connected', { ip: req.socket.remoteAddress });
      
      // Send initial capabilities
      ws.send(JSON.stringify({
        type: 'connected',
        capabilities: this.engine.getCapabilities()
      }));
      
      // Handle messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this._handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
      
      // Handle disconnect
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
      });
      
      // Engine events
      this.engine.on('schedule-update', (update) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'schedule-update',
            update
          }));
        }
      });
    });
  }

  async _handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Subscribe to real-time updates
        ws.subscriptions = ws.subscriptions || new Set();
        ws.subscriptions.add(data.channel);
        break;
        
      case 'unsubscribe':
        ws.subscriptions?.delete(data.channel);
        break;
        
      case 'evaluate-constraints':
        const result = await this.engine.evaluateConstraints(
          data.gameMove,
          data.schedule,
          data.constraints || []
        );
        ws.send(JSON.stringify({
          type: 'constraint-result',
          id: data.id,
          result
        }));
        break;
        
      default:
        throw new Error(`Unknown message type: ${data.type}`);
    }
  }

  _setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
      });
    });
    
    // Error handler
    this.app.use((err, req, res, next) => {
      logger.error('API Error:', err);
      
      const status = err.status || 500;
      const message = err.message || 'Internal server error';
      
      res.status(status).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  // ==================== Helper Methods ====================

  _validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }

  async _getSchedule(id) {
    // In a real implementation, fetch from database
    // For now, return a mock
    return {
      id,
      sport_type: 'football',
      teams: [],
      games: []
    };
  }

  async _importSchedule(format, data) {
    // Implementation would handle different formats
    return { imported: true };
  }

  async _exportSchedule(schedule, format) {
    // Implementation would handle different formats
    return JSON.stringify(schedule, null, 2);
  }

  _getContentType(format) {
    const types = {
      json: 'application/json',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ical: 'text/calendar'
    };
    return types[format] || 'application/octet-stream';
  }
}

module.exports = FTBuilderAPI;
module.exports.FTBuilderAPI = FTBuilderAPI;