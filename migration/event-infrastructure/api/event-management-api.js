/**
 * Event Management API for FlexTime Event Streaming Infrastructure
 * 
 * Provides REST API endpoints for monitoring, managing, and debugging
 * the event streaming infrastructure.
 */

const express = require('express');
const cors = require('cors');
const FlexTimeEventIntegration = require('../services/flextime-event-integration');
const { STREAM_NAMES, EVENT_PRIORITIES } = require('../config/redis-streams-config');
const { EVENT_TYPES } = require('../schemas/event-schemas');

class EventManagementAPI {
  constructor(options = {}) {
    this.options = {
      port: options.port || process.env.EVENT_API_PORT || 3010,
      enableCors: options.enableCors !== false,
      enableAuth: options.enableAuth === true,
      ...options
    };
    
    this.app = express();
    this.eventIntegration = null;
    this.server = null;
    this.isRunning = false;
  }

  /**
   * Initialize the API server
   */
  async initialize(eventIntegration) {
    this.eventIntegration = eventIntegration;
    
    // Middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    if (this.options.enableCors) {
      this.app.use(cors({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3005'],
        credentials: true
      }));
    }

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });

    // Authentication middleware (if enabled)
    if (this.options.enableAuth) {
      this.app.use('/api', this.authMiddleware.bind(this));
    }

    // Register routes
    this.registerRoutes();

    // Error handling
    this.app.use(this.errorHandler.bind(this));

    console.log('Event Management API initialized');
  }

  /**
   * Register API routes
   */
  registerRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.eventIntegration.getHealthStatus();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'warning' ? 200 :
                          health.status === 'degraded' ? 503 : 500;
        
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Stream information endpoints
    this.app.get('/api/streams', this.getStreamsInfo.bind(this));
    this.app.get('/api/streams/:streamName', this.getStreamInfo.bind(this));
    this.app.get('/api/streams/:streamName/messages', this.getStreamMessages.bind(this));

    // Consumer information endpoints
    this.app.get('/api/consumers', this.getConsumersInfo.bind(this));
    this.app.get('/api/consumers/:groupName', this.getConsumerGroupInfo.bind(this));

    // Metrics endpoints
    this.app.get('/api/metrics', this.getMetrics.bind(this));
    this.app.get('/api/metrics/summary', this.getMetricsSummary.bind(this));
    this.app.get('/api/metrics/alerts', this.getAlerts.bind(this));

    // Event management endpoints
    this.app.post('/api/events/publish', this.publishEvent.bind(this));
    this.app.post('/api/events/publish/batch', this.publishBatchEvents.bind(this));
    this.app.get('/api/events/types', this.getEventTypes.bind(this));
    this.app.get('/api/events/schema/:eventType', this.getEventSchema.bind(this));

    // Administrative endpoints
    this.app.post('/api/admin/streams/:streamName/trim', this.trimStream.bind(this));
    this.app.post('/api/admin/consumers/:groupName/reset', this.resetConsumerGroup.bind(this));
    this.app.delete('/api/admin/streams/:streamName', this.deleteStream.bind(this));

    // Configuration endpoints
    this.app.get('/api/config', this.getConfiguration.bind(this));
    this.app.put('/api/config', this.updateConfiguration.bind(this));

    // Debugging endpoints
    this.app.get('/api/debug/redis/info', this.getRedisInfo.bind(this));
    this.app.get('/api/debug/streams/raw/:streamName', this.getRawStreamData.bind(this));
    this.app.post('/api/debug/test-event', this.publishTestEvent.bind(this));
  }

  /**
   * Get information about all streams
   */
  async getStreamsInfo(req, res) {
    try {
      const monitor = this.eventIntegration.monitor;
      if (!monitor) {
        return res.status(503).json({ error: 'Stream monitoring not available' });
      }

      const metrics = monitor.getMetricsSummary();
      res.json({
        streams: metrics.streams,
        timestamp: metrics.timestamp,
        health: metrics.health
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get information about a specific stream
   */
  async getStreamInfo(req, res) {
    try {
      const { streamName } = req.params;
      const monitor = this.eventIntegration.monitor;
      
      if (!monitor) {
        return res.status(503).json({ error: 'Stream monitoring not available' });
      }

      const streamInfo = await monitor.getStreamInfo(streamName);
      res.json(streamInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get messages from a stream
   */
  async getStreamMessages(req, res) {
    try {
      const { streamName } = req.params;
      const { start = '-', end = '+', count = 100 } = req.query;
      
      const redis = this.eventIntegration.redisConfig.getRedis();
      const messages = await redis.xrange(streamName, start, end, 'COUNT', parseInt(count));
      
      // Parse messages
      const parsedMessages = messages.map(([id, fields]) => ({
        id,
        fields: this.parseMessageFields(fields),
        timestamp: new Date(parseInt(id.split('-')[0]))
      }));

      res.json({
        streamName,
        messageCount: parsedMessages.length,
        messages: parsedMessages
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get consumer group information
   */
  async getConsumersInfo(req, res) {
    try {
      const monitor = this.eventIntegration.monitor;
      if (!monitor) {
        return res.status(503).json({ error: 'Stream monitoring not available' });
      }

      const metrics = monitor.getMetricsSummary();
      res.json({
        consumers: metrics.consumers,
        timestamp: metrics.timestamp
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get specific consumer group information
   */
  async getConsumerGroupInfo(req, res) {
    try {
      const { groupName } = req.params;
      const redis = this.eventIntegration.redisConfig.getRedis();
      
      const groupInfo = {};
      for (const streamName of Object.values(STREAM_NAMES)) {
        try {
          const consumers = await redis.xinfo('CONSUMERS', streamName, groupName);
          groupInfo[streamName] = this.parseConsumersInfo(consumers);
        } catch (error) {
          // Stream might not exist or no consumers
          groupInfo[streamName] = null;
        }
      }

      res.json({
        groupName,
        streams: groupInfo
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get comprehensive metrics
   */
  async getMetrics(req, res) {
    try {
      const health = await this.eventIntegration.getHealthStatus();
      res.json(health.metrics || {});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(req, res) {
    try {
      const monitor = this.eventIntegration.monitor;
      if (!monitor) {
        return res.status(503).json({ error: 'Stream monitoring not available' });
      }

      const summary = monitor.getMetricsSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get alerts
   */
  async getAlerts(req, res) {
    try {
      const { severity, limit = 100 } = req.query;
      const monitor = this.eventIntegration.monitor;
      
      if (!monitor) {
        return res.status(503).json({ error: 'Stream monitoring not available' });
      }

      let alerts = monitor.metrics.alerts || [];
      
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }
      
      alerts = alerts
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, parseInt(limit));

      res.json({
        alerts,
        total: alerts.length,
        filters: { severity, limit }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Publish a single event
   */
  async publishEvent(req, res) {
    try {
      const { eventType, data, options = {} } = req.body;
      
      if (!eventType || !data) {
        return res.status(400).json({ 
          error: 'eventType and data are required' 
        });
      }

      const result = await this.eventIntegration.publishEvent(eventType, data, options);
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        streamName: result.streamName,
        publishedAt: result.publishedAt
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Publish multiple events
   */
  async publishBatchEvents(req, res) {
    try {
      const { events } = req.body;
      
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ 
          error: 'events array is required and must not be empty' 
        });
      }

      const results = await this.eventIntegration.publisher.publishBatch(events);
      
      res.status(201).json({
        success: true,
        published: results.length,
        results
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get available event types
   */
  async getEventTypes(req, res) {
    const eventTypes = Object.keys(EVENT_TYPES).map(eventType => ({
      eventType,
      description: this.getEventTypeDescription(eventType)
    }));

    res.json({
      eventTypes,
      streamNames: STREAM_NAMES,
      priorities: Object.values(EVENT_PRIORITIES)
    });
  }

  /**
   * Get schema for a specific event type
   */
  async getEventSchema(req, res) {
    try {
      const { eventType } = req.params;
      const schema = EVENT_TYPES[eventType];
      
      if (!schema) {
        return res.status(404).json({ 
          error: `Event type '${eventType}' not found` 
        });
      }

      res.json({
        eventType,
        schema: schema.describe(),
        description: this.getEventTypeDescription(eventType)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Trim a stream to a specific length
   */
  async trimStream(req, res) {
    try {
      const { streamName } = req.params;
      const { maxLength = 1000, approximate = true } = req.body;
      
      const redis = this.eventIntegration.redisConfig.getRedis();
      
      const result = await redis.xtrim(
        streamName,
        'MAXLEN',
        approximate ? '~' : '',
        maxLength
      );

      res.json({
        success: true,
        streamName,
        removedMessages: result,
        newMaxLength: maxLength
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Reset consumer group position
   */
  async resetConsumerGroup(req, res) {
    try {
      const { groupName } = req.params;
      const { streamName, position = '0' } = req.body;
      
      if (!streamName) {
        return res.status(400).json({ error: 'streamName is required' });
      }

      const redis = this.eventIntegration.redisConfig.getRedis();
      
      // Delete and recreate the consumer group
      try {
        await redis.xgroup('DESTROY', streamName, groupName);
      } catch (error) {
        // Group might not exist
      }
      
      await redis.xgroup('CREATE', streamName, groupName, position, 'MKSTREAM');

      res.json({
        success: true,
        groupName,
        streamName,
        resetToPosition: position
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete a stream
   */
  async deleteStream(req, res) {
    try {
      const { streamName } = req.params;
      const { confirm } = req.query;
      
      if (confirm !== 'true') {
        return res.status(400).json({ 
          error: 'Add ?confirm=true to confirm stream deletion' 
        });
      }

      const redis = this.eventIntegration.redisConfig.getRedis();
      const result = await redis.del(streamName);

      res.json({
        success: true,
        streamName,
        deleted: result === 1
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get current configuration
   */
  async getConfiguration(req, res) {
    res.json({
      eventIntegration: this.eventIntegration.options,
      api: this.options,
      redis: {
        host: this.eventIntegration.redisConfig.config.host,
        port: this.eventIntegration.redisConfig.config.port,
        db: this.eventIntegration.redisConfig.config.db
      }
    });
  }

  /**
   * Update configuration (limited subset)
   */
  async updateConfiguration(req, res) {
    try {
      const { monitoringInterval, alertThresholds } = req.body;
      
      // Update monitoring configuration
      if (this.eventIntegration.monitor && monitoringInterval) {
        this.eventIntegration.monitor.options.monitoringInterval = monitoringInterval;
      }
      
      if (this.eventIntegration.monitor && alertThresholds) {
        Object.assign(this.eventIntegration.monitor.options.alertThresholds, alertThresholds);
      }

      res.json({
        success: true,
        message: 'Configuration updated',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get Redis server information
   */
  async getRedisInfo(req, res) {
    try {
      const redis = this.eventIntegration.redisConfig.getRedis();
      const info = await redis.info();
      
      res.json({
        info: this.parseRedisInfo(info),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get raw stream data for debugging
   */
  async getRawStreamData(req, res) {
    try {
      const { streamName } = req.params;
      const { count = 10 } = req.query;
      
      const redis = this.eventIntegration.redisConfig.getRedis();
      const [info, length, messages] = await Promise.all([
        redis.xinfo('STREAM', streamName),
        redis.xlen(streamName),
        redis.xrange(streamName, '-', '+', 'COUNT', parseInt(count))
      ]);

      res.json({
        streamName,
        info,
        length,
        messages
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Publish a test event
   */
  async publishTestEvent(req, res) {
    try {
      const testEvent = {
        eventType: 'system.health.check',
        data: {
          timestamp: new Date().toISOString(),
          test: true,
          requestId: require('crypto').randomUUID()
        }
      };

      const result = await this.eventIntegration.publishEvent(
        testEvent.eventType,
        testEvent.data
      );

      res.status(201).json({
        success: true,
        testEvent,
        result
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Authentication middleware (placeholder)
   */
  authMiddleware(req, res, next) {
    // Implement JWT or API key authentication here
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // For now, just check for a simple API key
    const apiKey = authHeader.replace('Bearer ', '');
    if (apiKey !== process.env.EVENT_API_KEY && process.env.EVENT_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    next();
  }

  /**
   * Error handling middleware
   */
  errorHandler(error, req, res, next) {
    console.error('API Error:', error);
    
    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Helper methods
   */
  parseMessageFields(fields) {
    const parsed = {};
    for (let i = 0; i < fields.length; i += 2) {
      parsed[fields[i]] = fields[i + 1];
    }
    return parsed;
  }

  parseConsumersInfo(consumers) {
    return consumers.map(consumer => {
      const data = {};
      for (let i = 0; i < consumer.length; i += 2) {
        data[consumer[i]] = consumer[i + 1];
      }
      return data;
    });
  }

  parseRedisInfo(info) {
    const sections = {};
    let currentSection = 'general';
    
    info.split('\n').forEach(line => {
      line = line.trim();
      if (line.startsWith('#')) {
        currentSection = line.replace('# ', '').toLowerCase();
        sections[currentSection] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (!sections[currentSection]) {
          sections[currentSection] = {};
        }
        sections[currentSection][key] = value;
      }
    });
    
    return sections;
  }

  getEventTypeDescription(eventType) {
    const descriptions = {
      'schedule.created': 'A new schedule has been created',
      'schedule.updated': 'An existing schedule has been modified',
      'schedule.published': 'A schedule has been published',
      'schedule.deleted': 'A schedule has been deleted',
      'game.scheduled': 'A new game has been scheduled',
      'game.rescheduled': 'A game has been rescheduled',
      'game.cancelled': 'A game has been cancelled',
      'optimization.started': 'Schedule optimization has started',
      'optimization.progress': 'Optimization progress update',
      'optimization.completed': 'Schedule optimization has completed',
      'optimization.failed': 'Schedule optimization has failed',
      'compass.training.started': 'COMPASS model training has started',
      'compass.training.completed': 'COMPASS model training has completed',
      'compass.prediction.requested': 'A prediction has been requested',
      'compass.prediction.completed': 'A prediction has been completed',
      'system.service.started': 'A service has started',
      'system.service.stopped': 'A service has stopped',
      'system.health.failed': 'A health check has failed'
    };
    
    return descriptions[eventType] || 'No description available';
  }

  /**
   * Start the API server
   */
  async start() {
    if (this.isRunning) {
      console.log('Event Management API already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.options.port, (error) => {
        if (error) {
          reject(error);
        } else {
          this.isRunning = true;
          console.log(`Event Management API running on port ${this.options.port}`);
          console.log(`Health endpoint: http://localhost:${this.options.port}/health`);
          console.log(`API endpoints: http://localhost:${this.options.port}/api`);
          resolve();
        }
      });
    });
  }

  /**
   * Stop the API server
   */
  async stop() {
    if (!this.isRunning || !this.server) {
      console.log('Event Management API not running');
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('Event Management API stopped');
        resolve();
      });
    });
  }
}

module.exports = EventManagementAPI;