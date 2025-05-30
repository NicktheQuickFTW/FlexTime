/**
 * Event Publisher Service for FlexTime Event Streaming Infrastructure
 * 
 * Handles publishing events to Redis Streams with proper error handling,
 * serialization, and delivery guarantees.
 */

const { createEvent, validateEvent } = require('../schemas/event-schemas');
const { STREAM_NAMES, EVENT_PRIORITIES } = require('../config/redis-streams-config');

class EventPublisher {
  constructor(redisStreamsConfig) {
    this.config = redisStreamsConfig;
    this.redis = null;
    this.publishMetrics = {
      totalPublished: 0,
      successCount: 0,
      errorCount: 0,
      lastError: null,
      lastPublish: null
    };
  }

  /**
   * Initialize the publisher
   */
  async initialize() {
    this.redis = await this.config.connect();
    console.log('Event Publisher initialized');
  }

  /**
   * Publish an event to the appropriate stream
   */
  async publishEvent(eventType, data, source, options = {}) {
    try {
      // Create and validate the event
      const event = createEvent(eventType, data, source, options);
      
      // Determine the target stream
      const streamName = this.getStreamForEventType(eventType);
      
      // Serialize the event
      const serializedEvent = this.serializeEvent(event);
      
      // Publish to Redis Stream
      const messageId = await this.redis.xadd(
        streamName,
        options.maxLength ? 'MAXLEN' : '',
        options.maxLength ? options.maxLength : '',
        options.approximate ? '~' : '',
        '*', // Auto-generate ID
        ...this.flattenEventData(serializedEvent)
      );

      // Update metrics
      this.publishMetrics.totalPublished++;
      this.publishMetrics.successCount++;
      this.publishMetrics.lastPublish = new Date();

      console.log(`Event published: ${event.eventType} to ${streamName} with ID: ${messageId}`);
      
      return {
        messageId,
        streamName,
        event,
        publishedAt: new Date()
      };

    } catch (error) {
      this.publishMetrics.errorCount++;
      this.publishMetrics.lastError = error;
      
      console.error('Failed to publish event:', error);
      throw new Error(`Event publication failed: ${error.message}`);
    }
  }

  /**
   * Publish multiple events in a transaction
   */
  async publishBatch(events) {
    const pipeline = this.redis.pipeline();
    const results = [];

    try {
      for (const eventData of events) {
        const { eventType, data, source, options = {} } = eventData;
        
        // Create and validate event
        const event = createEvent(eventType, data, source, options);
        const streamName = this.getStreamForEventType(eventType);
        const serializedEvent = this.serializeEvent(event);
        
        // Add to pipeline
        pipeline.xadd(
          streamName,
          '*',
          ...this.flattenEventData(serializedEvent)
        );
        
        results.push({
          event,
          streamName,
          expectedIndex: results.length
        });
      }

      // Execute pipeline
      const pipelineResults = await pipeline.exec();
      
      // Process results
      const publishedEvents = [];
      for (let i = 0; i < pipelineResults.length; i++) {
        const [error, messageId] = pipelineResults[i];
        if (error) {
          throw new Error(`Batch publish failed at index ${i}: ${error.message}`);
        }
        
        publishedEvents.push({
          messageId,
          streamName: results[i].streamName,
          event: results[i].event,
          publishedAt: new Date()
        });
      }

      this.publishMetrics.totalPublished += events.length;
      this.publishMetrics.successCount += events.length;
      
      console.log(`Batch published ${events.length} events successfully`);
      return publishedEvents;

    } catch (error) {
      this.publishMetrics.errorCount += events.length;
      this.publishMetrics.lastError = error;
      
      console.error('Batch publish failed:', error);
      throw error;
    }
  }

  /**
   * Publish scheduled event (with delay)
   */
  async publishScheduledEvent(eventType, data, source, scheduleTime, options = {}) {
    const delay = scheduleTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Publish immediately if time has passed
      return await this.publishEvent(eventType, data, source, options);
    }

    // Schedule for future publication
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.publishEvent(eventType, data, source, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Get the appropriate stream for an event type
   */
  getStreamForEventType(eventType) {
    const eventCategory = eventType.split('.')[0];
    
    const streamMapping = {
      'schedule': STREAM_NAMES.SCHEDULE_EVENTS,
      'game': STREAM_NAMES.GAME_EVENTS,
      'constraint': STREAM_NAMES.CONSTRAINT_EVENTS,
      'optimization': STREAM_NAMES.OPTIMIZATION_EVENTS,
      'notification': STREAM_NAMES.NOTIFICATION_EVENTS,
      'compass': STREAM_NAMES.COMPASS_EVENTS,
      'system': STREAM_NAMES.SYSTEM_EVENTS
    };

    return streamMapping[eventCategory] || STREAM_NAMES.SYSTEM_EVENTS;
  }

  /**
   * Serialize event for storage
   */
  serializeEvent(event) {
    return {
      ...event,
      data: JSON.stringify(event.data),
      source: JSON.stringify(event.source),
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
      tags: event.tags ? JSON.stringify(event.tags) : undefined
    };
  }

  /**
   * Flatten event data for Redis XADD command
   */
  flattenEventData(event) {
    const fields = [];
    
    Object.entries(event).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fields.push(key, String(value));
      }
    });
    
    return fields;
  }

  /**
   * Get publisher metrics
   */
  getMetrics() {
    return {
      ...this.publishMetrics,
      uptime: this.publishMetrics.lastPublish ? 
        Date.now() - this.publishMetrics.lastPublish.getTime() : 0,
      errorRate: this.publishMetrics.totalPublished > 0 ? 
        this.publishMetrics.errorCount / this.publishMetrics.totalPublished : 0
    };
  }

  /**
   * Health check for publisher
   */
  async healthCheck() {
    try {
      // Test basic Redis connectivity
      const healthResult = await this.config.healthCheck();
      if (healthResult.status !== 'healthy') {
        return healthResult;
      }

      // Test stream write capability
      const testEvent = createEvent(
        'system.health.check',
        { timestamp: new Date().toISOString(), test: true },
        { service: 'event-publisher', instance: 'health-check' }
      );

      const streamName = STREAM_NAMES.SYSTEM_EVENTS;
      const serializedEvent = this.serializeEvent(testEvent);
      
      await this.redis.xadd(
        streamName,
        'MAXLEN', '~', '100', // Keep only recent health checks
        '*',
        ...this.flattenEventData(serializedEvent)
      );

      return {
        status: 'healthy',
        message: 'Event Publisher operational',
        metrics: this.getMetrics()
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Event Publisher health check failed: ${error.message}`,
        metrics: this.getMetrics()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down Event Publisher...');
    
    if (this.redis) {
      await this.config.disconnect();
    }
    
    console.log('Event Publisher shutdown complete');
  }
}

module.exports = EventPublisher;