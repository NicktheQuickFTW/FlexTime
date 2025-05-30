/**
 * Event Consumer Service for FlexTime Event Streaming Infrastructure
 * 
 * Handles consuming events from Redis Streams with proper error handling,
 * deserialization, and delivery guarantees.
 */

const { validateEvent } = require('../schemas/event-schemas');
const { STREAM_NAMES } = require('../config/redis-streams-config');

class EventConsumer {
  constructor(redisStreamsConfig, options = {}) {
    this.config = redisStreamsConfig;
    this.options = {
      consumerGroup: options.consumerGroup || redisStreamsConfig.config.consumerGroup,
      consumerName: options.consumerName || redisStreamsConfig.config.consumerName,
      blockTime: options.blockTime || 5000, // 5 seconds
      readCount: options.readCount || 10,
      autoAck: options.autoAck !== false, // Default to true
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };
    
    this.redis = null;
    this.isRunning = false;
    this.handlers = new Map();
    this.consumerMetrics = {
      totalConsumed: 0,
      successCount: 0,
      errorCount: 0,
      lastError: null,
      lastConsume: null,
      activeHandlers: 0
    };
  }

  /**
   * Initialize the consumer
   */
  async initialize() {
    this.redis = await this.config.connect();
    
    // Ensure consumer groups exist for all streams
    for (const streamName of Object.values(STREAM_NAMES)) {
      await this.config.createConsumerGroup(streamName, this.options.consumerGroup);
    }
    
    console.log(`Event Consumer initialized: ${this.options.consumerName}`);
  }

  /**
   * Register an event handler
   */
  onEvent(eventType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType).push(handler);
    this.consumerMetrics.activeHandlers++;
    
    console.log(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Register a stream-specific handler
   */
  onStream(streamName, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Stream handler must be a function');
    }
    
    const handlerKey = `stream:${streamName}`;
    if (!this.handlers.has(handlerKey)) {
      this.handlers.set(handlerKey, []);
    }
    
    this.handlers.get(handlerKey).push(handler);
    this.consumerMetrics.activeHandlers++;
    
    console.log(`Registered handler for stream: ${streamName}`);
  }

  /**
   * Start consuming events
   */
  async startConsuming(streams = Object.values(STREAM_NAMES)) {
    if (this.isRunning) {
      console.log('Consumer already running');
      return;
    }
    
    this.isRunning = true;
    console.log(`Starting event consumption for streams: ${streams.join(', ')}`);
    
    // Start consuming from each stream
    const consumePromises = streams.map(streamName => 
      this.consumeFromStream(streamName)
    );
    
    try {
      await Promise.all(consumePromises);
    } catch (error) {
      console.error('Error in consumption process:', error);
      throw error;
    }
  }

  /**
   * Consume events from a specific stream
   */
  async consumeFromStream(streamName) {
    while (this.isRunning) {
      try {
        // Read from stream using consumer group
        const results = await this.redis.xreadgroup(
          'GROUP',
          this.options.consumerGroup,
          this.options.consumerName,
          'COUNT',
          this.options.readCount,
          'BLOCK',
          this.options.blockTime,
          'STREAMS',
          streamName,
          '>' // Only new messages
        );

        if (results && results.length > 0) {
          for (const [stream, messages] of results) {
            await this.processMessages(stream, messages);
          }
        }

      } catch (error) {
        if (this.isRunning) {
          console.error(`Error consuming from stream ${streamName}:`, error);
          this.consumerMetrics.errorCount++;
          this.consumerMetrics.lastError = error;
          
          // Back off on error
          await this.sleep(this.options.retryDelay);
        }
      }
    }
  }

  /**
   * Process consumed messages
   */
  async processMessages(streamName, messages) {
    for (const [messageId, fields] of messages) {
      try {
        // Deserialize the event
        const event = this.deserializeEvent(fields);
        
        // Validate the event
        const validatedEvent = validateEvent(event);
        
        // Process the event
        await this.handleEvent(streamName, messageId, validatedEvent);
        
        // Acknowledge the message if auto-ack is enabled
        if (this.options.autoAck) {
          await this.acknowledgeMessage(streamName, messageId);
        }
        
        this.consumerMetrics.totalConsumed++;
        this.consumerMetrics.successCount++;
        this.consumerMetrics.lastConsume = new Date();

      } catch (error) {
        console.error(`Error processing message ${messageId} from ${streamName}:`, error);
        this.consumerMetrics.errorCount++;
        this.consumerMetrics.lastError = error;
        
        // Handle failed message (dead letter queue, retry, etc.)
        await this.handleFailedMessage(streamName, messageId, error);
      }
    }
  }

  /**
   * Handle an individual event
   */
  async handleEvent(streamName, messageId, event) {
    const eventType = event.eventType;
    
    // Get handlers for this specific event type
    const eventHandlers = this.handlers.get(eventType) || [];
    
    // Get handlers for the stream
    const streamHandlers = this.handlers.get(`stream:${streamName}`) || [];
    
    // Get global handlers (if any)
    const globalHandlers = this.handlers.get('*') || [];
    
    const allHandlers = [...eventHandlers, ...streamHandlers, ...globalHandlers];
    
    if (allHandlers.length === 0) {
      console.warn(`No handlers registered for event type: ${eventType} on stream: ${streamName}`);
      return;
    }
    
    // Execute all handlers
    const handlerPromises = allHandlers.map(async (handler) => {
      try {
        await handler(event, { streamName, messageId });
      } catch (error) {
        console.error(`Handler error for event ${eventType}:`, error);
        throw error;
      }
    });
    
    await Promise.all(handlerPromises);
  }

  /**
   * Manually acknowledge a message
   */
  async acknowledgeMessage(streamName, messageId) {
    try {
      await this.redis.xack(
        streamName,
        this.options.consumerGroup,
        messageId
      );
    } catch (error) {
      console.error(`Failed to acknowledge message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Handle failed message processing
   */
  async handleFailedMessage(streamName, messageId, error) {
    // For now, just log the error
    // In production, you might want to:
    // - Send to dead letter queue
    // - Retry with exponential backoff
    // - Alert monitoring systems
    
    console.error(`Failed message handling for ${messageId} on ${streamName}:`, {
      error: error.message,
      streamName,
      messageId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Deserialize event from Redis fields
   */
  deserializeEvent(fields) {
    const event = {};
    
    // Convert field array to object
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      event[key] = value;
    }
    
    // Parse JSON fields
    try {
      if (event.data) event.data = JSON.parse(event.data);
      if (event.source) event.source = JSON.parse(event.source);
      if (event.metadata) event.metadata = JSON.parse(event.metadata);
      if (event.tags) event.tags = JSON.parse(event.tags);
    } catch (error) {
      throw new Error(`Failed to deserialize event: ${error.message}`);
    }
    
    // Convert timestamp back to Date if needed
    if (event.timestamp) {
      event.timestamp = new Date(event.timestamp).toISOString();
    }
    
    return event;
  }

  /**
   * Get consumer metrics
   */
  getMetrics() {
    return {
      ...this.consumerMetrics,
      isRunning: this.isRunning,
      handlersCount: this.handlers.size,
      uptime: this.consumerMetrics.lastConsume ? 
        Date.now() - this.consumerMetrics.lastConsume.getTime() : 0,
      errorRate: this.consumerMetrics.totalConsumed > 0 ? 
        this.consumerMetrics.errorCount / this.consumerMetrics.totalConsumed : 0
    };
  }

  /**
   * Health check for consumer
   */
  async healthCheck() {
    try {
      const redisHealth = await this.config.healthCheck();
      if (redisHealth.status !== 'healthy') {
        return redisHealth;
      }

      return {
        status: this.isRunning ? 'healthy' : 'stopped',
        message: `Event Consumer ${this.isRunning ? 'running' : 'stopped'}`,
        metrics: this.getMetrics(),
        consumerInfo: {
          group: this.options.consumerGroup,
          name: this.options.consumerName,
          handlerCount: this.handlers.size
        }
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Event Consumer health check failed: ${error.message}`,
        metrics: this.getMetrics()
      };
    }
  }

  /**
   * Stop consuming events
   */
  async stopConsuming() {
    console.log('Stopping event consumption...');
    this.isRunning = false;
    
    // Wait a bit for current operations to complete
    await this.sleep(1000);
    
    console.log('Event consumption stopped');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down Event Consumer...');
    
    await this.stopConsuming();
    
    if (this.redis) {
      await this.config.disconnect();
    }
    
    console.log('Event Consumer shutdown complete');
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EventConsumer;