/**
 * FlexTime Event Integration Service
 * 
 * Integrates event streaming infrastructure with existing FlexTime services.
 * Provides high-level APIs for the FlexTime application to publish and consume events.
 */

const EventPublisher = require('./event-publisher');
const EventConsumer = require('./event-consumer');
const StreamMonitor = require('../monitoring/stream-monitor');
const { createRedisStreamsConfig } = require('../config/redis-streams-config');
const { createEvent } = require('../schemas/event-schemas');

class FlexTimeEventIntegration {
  constructor(options = {}) {
    this.options = {
      environment: options.environment || process.env.NODE_ENV || 'development',
      enablePublishing: options.enablePublishing !== false,
      enableConsuming: options.enableConsuming !== false,
      enableMonitoring: options.enableMonitoring !== false,
      autoStart: options.autoStart !== false,
      ...options
    };
    
    this.redisConfig = null;
    this.publisher = null;
    this.consumer = null;
    this.monitor = null;
    this.isInitialized = false;
    this.eventHandlers = new Map();
    
    // Service metadata
    this.serviceInfo = {
      name: 'flextime-backend',
      version: process.env.npm_package_version || '3.0.0',
      instance: `${require('os').hostname()}-${process.pid}`,
      startTime: new Date()
    };
  }

  /**
   * Initialize the event integration
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('FlexTime Event Integration already initialized');
      return;
    }

    try {
      console.log('Initializing FlexTime Event Integration...');
      
      // Create Redis configuration
      this.redisConfig = createRedisStreamsConfig(this.options.environment);
      
      // Initialize publisher
      if (this.options.enablePublishing) {
        this.publisher = new EventPublisher(this.redisConfig);
        await this.publisher.initialize();
      }
      
      // Initialize consumer
      if (this.options.enableConsuming) {
        this.consumer = new EventConsumer(this.redisConfig, {
          consumerName: `${this.serviceInfo.name}-${this.serviceInfo.instance}`
        });
        await this.consumer.initialize();
        
        // Register default event handlers
        this.registerDefaultHandlers();
      }
      
      // Initialize monitoring
      if (this.options.enableMonitoring) {
        this.monitor = new StreamMonitor(this.redisConfig);
        await this.monitor.initialize();
      }
      
      this.isInitialized = true;
      
      // Auto-start if enabled
      if (this.options.autoStart) {
        await this.start();
      }
      
      // Publish service started event
      if (this.publisher) {
        await this.publishServiceEvent('started');
      }
      
      console.log('FlexTime Event Integration initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize FlexTime Event Integration:', error);
      throw error;
    }
  }

  /**
   * Start event processing
   */
  async start() {
    if (!this.isInitialized) {
      throw new Error('Event integration not initialized. Call initialize() first.');
    }
    
    console.log('Starting FlexTime Event Integration...');
    
    // Start consumer
    if (this.consumer) {
      await this.consumer.startConsuming();
    }
    
    // Start monitoring
    if (this.monitor) {
      await this.monitor.startMonitoring();
    }
    
    console.log('FlexTime Event Integration started');
  }

  /**
   * Register default event handlers for FlexTime
   */
  registerDefaultHandlers() {
    // Schedule event handlers
    this.onScheduleCreated(async (event) => {
      console.log(`Schedule created: ${event.data.scheduleId} for ${event.data.sport}`);
      // Integrate with existing FlexTime schedule service
    });

    this.onScheduleUpdated(async (event) => {
      console.log(`Schedule updated: ${event.data.scheduleId}`);
      // Update caches, notify UI, etc.
    });

    // Game event handlers
    this.onGameScheduled(async (event) => {
      console.log(`Game scheduled: ${event.data.gameId}`);
      // Update database, trigger notifications
    });

    this.onGameRescheduled(async (event) => {
      console.log(`Game rescheduled: ${event.data.gameId}`);
      // Handle rescheduling logic, notifications
    });

    // Optimization event handlers
    this.onOptimizationStarted(async (event) => {
      console.log(`Optimization started: ${event.data.optimizationId}`);
      // Update UI with progress tracking
    });

    this.onOptimizationCompleted(async (event) => {
      console.log(`Optimization completed: ${event.data.optimizationId}`);
      // Process results, update schedules
    });

    // COMPASS event handlers
    this.onModelTrainingStarted(async (event) => {
      console.log(`COMPASS training started: ${event.data.trainingId}`);
      // Update training dashboard
    });

    this.onModelTrainingCompleted(async (event) => {
      console.log(`COMPASS training completed: ${event.data.trainingId}`);
      // Deploy new model, update predictions
    });

    // System event handlers
    this.onHealthCheckFailed(async (event) => {
      console.error(`Health check failed for ${event.data.serviceName}: ${event.data.error}`);
      // Alert administrators, attempt recovery
    });
  }

  // High-level publishing methods for FlexTime operations

  /**
   * Publish schedule-related events
   */
  async publishScheduleCreated(scheduleData) {
    return await this.publishEvent('schedule.created', scheduleData);
  }

  async publishScheduleUpdated(scheduleId, changes, updatedBy) {
    return await this.publishEvent('schedule.updated', {
      scheduleId,
      changes,
      newVersion: Date.now().toString(),
      updatedBy
    });
  }

  async publishSchedulePublished(scheduleId, publishedBy, approvalChain = []) {
    return await this.publishEvent('schedule.published', {
      scheduleId,
      publishedBy,
      publishedAt: new Date().toISOString(),
      approvalChain
    });
  }

  /**
   * Publish game-related events
   */
  async publishGameScheduled(gameData) {
    return await this.publishEvent('game.scheduled', gameData);
  }

  async publishGameRescheduled(gameId, originalDate, newDate, reason, rescheduledBy) {
    return await this.publishEvent('game.rescheduled', {
      gameId,
      originalDate: originalDate.toISOString(),
      newDate: newDate.toISOString(),
      reason,
      rescheduledBy
    });
  }

  async publishGameCancelled(gameId, reason, cancelledBy) {
    return await this.publishEvent('game.cancelled', {
      gameId,
      reason,
      cancelledBy,
      refundRequired: true
    });
  }

  /**
   * Publish optimization events
   */
  async publishOptimizationStarted(optimizationId, scheduleId, algorithm, parameters) {
    return await this.publishEvent('optimization.started', {
      optimizationId,
      scheduleId,
      algorithm,
      parameters
    });
  }

  async publishOptimizationProgress(optimizationId, progress, metrics = {}) {
    return await this.publishEvent('optimization.progress', {
      optimizationId,
      progress,
      currentIteration: metrics.iteration,
      bestSolution: metrics.bestSolution,
      metrics
    });
  }

  async publishOptimizationCompleted(optimizationId, success, results, duration) {
    return await this.publishEvent('optimization.completed', {
      optimizationId,
      success,
      finalSolution: results.solution,
      metrics: results.metrics,
      duration,
      iterations: results.iterations
    });
  }

  /**
   * Publish COMPASS events
   */
  async publishModelTrainingStarted(trainingId, modelType, sport, datasetSize, parameters) {
    return await this.publishEvent('compass.training.started', {
      trainingId,
      modelType,
      sport,
      datasetSize,
      parameters
    });
  }

  async publishModelTrainingCompleted(trainingId, modelId, accuracy, metrics, duration) {
    return await this.publishEvent('compass.training.completed', {
      trainingId,
      modelId,
      accuracy,
      metrics,
      duration,
      deployed: false
    });
  }

  async publishPredictionRequested(predictionId, modelId, input, requestedBy) {
    return await this.publishEvent('compass.prediction.requested', {
      predictionId,
      modelId,
      input,
      requestedBy,
      priority: 'batch'
    });
  }

  /**
   * Publish notification events
   */
  async publishNotificationRequired(type, recipients, subject, body, urgency = 'normal') {
    return await this.publishEvent('notification.required', {
      type,
      recipients,
      subject,
      body,
      urgency
    });
  }

  /**
   * Generic event publishing method
   */
  async publishEvent(eventType, data, options = {}) {
    if (!this.publisher) {
      console.warn('Event publisher not available, skipping event publication');
      return null;
    }

    try {
      const correlationId = options.correlationId || require('crypto').randomUUID();
      
      return await this.publisher.publishEvent(
        eventType,
        data,
        this.serviceInfo,
        {
          correlationId,
          priority: options.priority || 'normal',
          metadata: options.metadata,
          tags: options.tags
        }
      );
    } catch (error) {
      console.error(`Failed to publish ${eventType} event:`, error);
      throw error;
    }
  }

  /**
   * Publish service lifecycle events
   */
  async publishServiceEvent(eventType, additionalData = {}) {
    const eventMap = {
      started: 'system.service.started',
      stopped: 'system.service.stopped'
    };

    const eventTypeFullName = eventMap[eventType];
    if (!eventTypeFullName) {
      throw new Error(`Unknown service event type: ${eventType}`);
    }

    const data = {
      serviceName: this.serviceInfo.name,
      version: this.serviceInfo.version,
      environment: this.options.environment,
      ...additionalData
    };

    if (eventType === 'started') {
      data.config = {
        enablePublishing: this.options.enablePublishing,
        enableConsuming: this.options.enableConsuming,
        enableMonitoring: this.options.enableMonitoring
      };
    }

    return await this.publishEvent(eventTypeFullName, data);
  }

  // Event handler registration methods

  onScheduleCreated(handler) {
    this.consumer?.onEvent('schedule.created', handler);
  }

  onScheduleUpdated(handler) {
    this.consumer?.onEvent('schedule.updated', handler);
  }

  onSchedulePublished(handler) {
    this.consumer?.onEvent('schedule.published', handler);
  }

  onGameScheduled(handler) {
    this.consumer?.onEvent('game.scheduled', handler);
  }

  onGameRescheduled(handler) {
    this.consumer?.onEvent('game.rescheduled', handler);
  }

  onGameCancelled(handler) {
    this.consumer?.onEvent('game.cancelled', handler);
  }

  onOptimizationStarted(handler) {
    this.consumer?.onEvent('optimization.started', handler);
  }

  onOptimizationProgress(handler) {
    this.consumer?.onEvent('optimization.progress', handler);
  }

  onOptimizationCompleted(handler) {
    this.consumer?.onEvent('optimization.completed', handler);
  }

  onOptimizationFailed(handler) {
    this.consumer?.onEvent('optimization.failed', handler);
  }

  onModelTrainingStarted(handler) {
    this.consumer?.onEvent('compass.training.started', handler);
  }

  onModelTrainingCompleted(handler) {
    this.consumer?.onEvent('compass.training.completed', handler);
  }

  onPredictionRequested(handler) {
    this.consumer?.onEvent('compass.prediction.requested', handler);
  }

  onPredictionCompleted(handler) {
    this.consumer?.onEvent('compass.prediction.completed', handler);
  }

  onHealthCheckFailed(handler) {
    this.consumer?.onEvent('system.health.failed', handler);
  }

  /**
   * Register custom event handler
   */
  onEvent(eventType, handler) {
    this.consumer?.onEvent(eventType, handler);
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus() {
    const status = {
      service: 'flextime-event-integration',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {},
      metrics: {}
    };

    try {
      // Check publisher health
      if (this.publisher) {
        status.components.publisher = await this.publisher.healthCheck();
        status.metrics.publisher = this.publisher.getMetrics();
      }

      // Check consumer health
      if (this.consumer) {
        status.components.consumer = await this.consumer.healthCheck();
        status.metrics.consumer = this.consumer.getMetrics();
      }

      // Check monitor health
      if (this.monitor) {
        status.components.monitor = await this.monitor.healthCheck();
        status.metrics.monitor = this.monitor.getMetricsSummary();
      }

      // Determine overall status
      const componentStatuses = Object.values(status.components).map(c => c.status);
      if (componentStatuses.includes('error')) {
        status.status = 'error';
      } else if (componentStatuses.includes('degraded')) {
        status.status = 'degraded';
      } else if (componentStatuses.includes('warning')) {
        status.status = 'warning';
      }

    } catch (error) {
      status.status = 'error';
      status.error = error.message;
    }

    return status;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down FlexTime Event Integration...');

    try {
      // Publish service stopped event
      if (this.publisher) {
        await this.publishServiceEvent('stopped', {
          reason: 'Graceful shutdown',
          uptime: Date.now() - this.serviceInfo.startTime.getTime()
        });
      }

      // Stop all components
      if (this.consumer) {
        await this.consumer.shutdown();
      }
      
      if (this.monitor) {
        await this.monitor.shutdown();
      }
      
      if (this.publisher) {
        await this.publisher.shutdown();
      }

      console.log('FlexTime Event Integration shutdown complete');
      
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

module.exports = FlexTimeEventIntegration;