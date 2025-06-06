/**
 * Communication Hub Service
 * 
 * Central hub for managing distributed agent communication using Redis Streams.
 * Provides reliable message delivery, event routing, and distributed coordination.
 */

const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const promClient = require('prom-client');

// Metrics
const messagesSentTotal = new promClient.Counter({
  name: 'communication_hub_messages_sent_total',
  help: 'Total number of messages sent through the hub',
  labelNames: ['event_type', 'target_service', 'priority']
});

const messagesReceivedTotal = new promClient.Counter({
  name: 'communication_hub_messages_received_total',
  help: 'Total number of messages received by the hub',
  labelNames: ['event_type', 'source_service']
});

const activeConsumersGauge = new promClient.Gauge({
  name: 'communication_hub_active_consumers',
  help: 'Number of active message consumers',
  labelNames: ['consumer_group', 'service']
});

const streamLengthGauge = new promClient.Gauge({
  name: 'communication_hub_stream_length',
  help: 'Length of Redis streams',
  labelNames: ['stream_name']
});

/**
 * Communication Hub for distributed agent communication
 */
class CommunicationHub {
  /**
   * Initialize Communication Hub
   * 
   * @param {Object} config - Configuration options
   * @param {string} config.redisUrl - Redis connection URL
   * @param {string} config.nodeEnv - Node environment
   * @param {number} config.maxRetries - Maximum retry attempts
   */
  constructor(config = {}) {
    this.config = {
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      nodeEnv: config.nodeEnv || 'development',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      streamMaxLength: config.streamMaxLength || 10000,
      consumerIdleTime: config.consumerIdleTime || 60000,
      blockTimeout: config.blockTimeout || 5000
    };
    
    this.redisClient = null;
    this.subscriberClient = null;
    this.publisherClient = null;
    
    this.streams = new Map();
    this.consumerGroups = new Map();
    this.activeConsumers = new Map();
    
    this.isInitialized = false;
    this.isShuttingDown = false;
    
    // Stream configuration
    this.streamNames = {
      SCHEDULE_EVENTS: 'schedule:events',
      CONFLICT_EVENTS: 'conflict:events',
      OPTIMIZATION_EVENTS: 'optimization:events',
      TRAVEL_EVENTS: 'travel:events',
      INTELLIGENCE_EVENTS: 'intelligence:events',
      SYSTEM_EVENTS: 'system:events',
      DEAD_LETTER: 'dead:letter'
    };
    
    // Consumer groups for each service
    this.consumerGroups = new Map([
      ['scheduler-svc', ['schedule:events', 'system:events']],
      ['conflict-resolution-svc', ['conflict:events', 'schedule:events', 'system:events']],
      ['travel-optimization-svc', ['travel:events', 'schedule:events', 'system:events']],
      ['constraint-management-svc', ['schedule:events', 'system:events']],
      ['intelligence-engine-svc', ['intelligence:events', 'schedule:events', 'system:events']]
    ]);
    
    logger.info('Communication Hub initialized');
  }
  
  /**
   * Initialize Redis connections and create streams
   */
  async initialize() {
    try {
      logger.info('Initializing Communication Hub...');
      
      // Create Redis clients
      this.redisClient = Redis.createClient({
        url: this.config.redisUrl,
        retry_delay_on_failover: 100,
        retry_delay_on_cluster_down: 300,
        max_attempts: this.config.maxRetries
      });
      
      this.publisherClient = this.redisClient.duplicate();
      this.subscriberClient = this.redisClient.duplicate();
      
      // Set up error handlers
      this.redisClient.on('error', (err) => {
        logger.error('Redis client error:', err);
      });
      
      this.publisherClient.on('error', (err) => {
        logger.error('Redis publisher error:', err);
      });
      
      this.subscriberClient.on('error', (err) => {
        logger.error('Redis subscriber error:', err);
      });
      
      // Connect clients
      await Promise.all([
        this.redisClient.connect(),
        this.publisherClient.connect(),
        this.subscriberClient.connect()
      ]);
      
      logger.info('Redis clients connected successfully');
      
      // Initialize streams and consumer groups
      await this.initializeStreams();
      await this.initializeConsumerGroups();
      
      // Start monitoring
      this.startMetricsCollection();
      
      this.isInitialized = true;
      logger.info('Communication Hub initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Communication Hub:', error);
      throw error;
    }
  }
  
  /**
   * Initialize Redis streams
   * 
   * @private
   */
  async initializeStreams() {
    logger.info('Initializing Redis streams...');
    
    for (const [streamKey, streamName] of Object.entries(this.streamNames)) {
      try {
        // Create stream with initial message if it doesn't exist
        await this.redisClient.xAdd(streamName, '*', {
          type: 'stream_initialized',
          timestamp: new Date().toISOString(),
          service: 'communication-hub'
        }, {
          MAXLEN: this.config.streamMaxLength,
          TRIM: 'APPROX'
        });
        
        this.streams.set(streamName, {
          name: streamName,
          key: streamKey,
          initialized: true
        });
        
        logger.info(`Stream ${streamName} initialized`);
      } catch (error) {
        logger.error(`Failed to initialize stream ${streamName}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Initialize consumer groups for each service
   * 
   * @private
   */
  async initializeConsumerGroups() {
    logger.info('Initializing consumer groups...');
    
    for (const [serviceName, streamNames] of this.consumerGroups.entries()) {
      for (const streamName of streamNames) {
        try {
          const groupName = `${serviceName}-group`;
          
          // Create consumer group if it doesn't exist
          try {
            await this.redisClient.xGroupCreate(streamName, groupName, '0', {
              MKSTREAM: true
            });
            logger.info(`Consumer group ${groupName} created for stream ${streamName}`);
          } catch (error) {
            if (error.message.includes('BUSYGROUP')) {
              logger.debug(`Consumer group ${groupName} already exists for stream ${streamName}`);
            } else {
              throw error;
            }
          }
          
          // Store consumer group info
          if (!this.consumerGroups.has(serviceName)) {
            this.consumerGroups.set(serviceName, []);
          }
          
        } catch (error) {
          logger.error(`Failed to initialize consumer group for ${serviceName}:`, error);
          throw error;
        }
      }
    }
  }
  
  /**
   * Publish an event to a specific stream
   * 
   * @param {Object} event - Event to publish
   * @param {string} event.type - Event type
   * @param {string} event.targetService - Target service name
   * @param {Object} event.payload - Event payload
   * @param {Object} options - Publishing options
   * @returns {Promise<string>} - Event ID
   */
  async publishEvent(event, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Communication Hub not initialized');
    }
    
    try {
      const {
        type,
        targetService,
        sourceService = 'unknown',
        payload = {},
        priority = 'normal',
        ttl = 3600000, // 1 hour default TTL
        correlationId = uuidv4()
      } = event;
      
      // Determine target stream based on event type
      const streamName = this.getStreamForEvent(type);
      
      if (!streamName) {
        throw new Error(`No stream configured for event type: ${type}`);
      }
      
      // Prepare event data
      const eventData = {
        id: correlationId,
        type,
        sourceService,
        targetService,
        priority,
        ttl: (Date.now() + ttl).toString(),
        timestamp: new Date().toISOString(),
        payload: JSON.stringify(payload),
        ...options.metadata
      };
      
      // Publish to stream
      const eventId = await this.publisherClient.xAdd(
        streamName,
        '*',
        eventData,
        {
          MAXLEN: this.config.streamMaxLength,
          TRIM: 'APPROX'
        }
      );
      
      // Update metrics
      messagesSentTotal.labels(type, targetService, priority).inc();
      
      logger.debug(`Event published to ${streamName}:`, {
        eventId,
        type,
        targetService,
        correlationId
      });
      
      return eventId;
    } catch (error) {
      logger.error('Failed to publish event:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to events for a specific service
   * 
   * @param {string} serviceName - Service name
   * @param {Function} messageHandler - Message handler function
   * @param {Object} options - Subscription options
   * @returns {Promise<void>}
   */
  async subscribeToEvents(serviceName, messageHandler, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Communication Hub not initialized');
    }
    
    const {
      consumerName = `${serviceName}-${uuidv4()}`,
      blockTimeout = this.config.blockTimeout,
      batchSize = 10
    } = options;
    
    const groupName = `${serviceName}-group`;
    const streamsToRead = this.consumerGroups.get(serviceName) || [];
    
    if (streamsToRead.length === 0) {
      throw new Error(`No streams configured for service: ${serviceName}`);
    }
    
    logger.info(`Starting event subscription for ${serviceName}`, {
      consumerName,
      streams: streamsToRead
    });
    
    // Store consumer info
    this.activeConsumers.set(consumerName, {
      serviceName,
      groupName,
      streams: streamsToRead,
      isActive: true,
      lastActivity: Date.now()
    });
    
    // Start consuming messages
    this.startConsumer(serviceName, consumerName, groupName, streamsToRead, messageHandler, {
      blockTimeout,
      batchSize
    });
    
    // Update metrics
    activeConsumersGauge.labels(groupName, serviceName).inc();
  }
  
  /**
   * Start consumer for processing messages
   * 
   * @param {string} serviceName - Service name
   * @param {string} consumerName - Consumer name
   * @param {string} groupName - Consumer group name
   * @param {Array<string>} streams - Streams to consume from
   * @param {Function} messageHandler - Message handler function
   * @param {Object} options - Consumer options
   * @private
   */
  async startConsumer(serviceName, consumerName, groupName, streams, messageHandler, options) {
    const { blockTimeout, batchSize } = options;
    
    const consumeLoop = async () => {
      while (!this.isShuttingDown && this.activeConsumers.has(consumerName)) {
        try {
          // Prepare stream arguments for XREADGROUP
          const streamArgs = [];
          streams.forEach(streamName => {
            streamArgs.push(streamName, '>');
          });
          
          // Read messages from streams
          const messages = await this.subscriberClient.xReadGroup(
            groupName,
            consumerName,
            streamArgs,
            {
              COUNT: batchSize,
              BLOCK: blockTimeout
            }
          );
          
          if (messages && messages.length > 0) {
            // Process messages
            for (const stream of messages) {
              const [streamName, streamMessages] = stream;
              
              for (const message of streamMessages) {
                const [messageId, fields] = message;
                
                try {
                  // Parse message data
                  const eventData = this.parseMessageFields(fields);
                  
                  // Check TTL
                  if (this.isMessageExpired(eventData)) {
                    logger.debug(`Message ${messageId} expired, acknowledging`);
                    await this.acknowledgeMessage(streamName, groupName, messageId);
                    continue;
                  }
                  
                  // Update metrics
                  messagesReceivedTotal.labels(eventData.type, eventData.sourceService).inc();
                  
                  // Handle message
                  const result = await messageHandler({
                    id: messageId,
                    streamName,
                    data: eventData
                  });
                  
                  // Acknowledge successful processing
                  if (result !== false) {
                    await this.acknowledgeMessage(streamName, groupName, messageId);
                  }
                  
                  // Update consumer activity
                  const consumer = this.activeConsumers.get(consumerName);
                  if (consumer) {
                    consumer.lastActivity = Date.now();
                  }
                  
                } catch (error) {
                  logger.error(`Error processing message ${messageId}:`, error);
                  
                  // Send to dead letter queue
                  await this.sendToDeadLetterQueue(streamName, messageId, fields, error.message);
                  
                  // Acknowledge to prevent reprocessing
                  await this.acknowledgeMessage(streamName, groupName, messageId);
                }
              }
            }
          }
        } catch (error) {
          if (!this.isShuttingDown) {
            logger.error(`Error in consumer loop for ${consumerName}:`, error);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          }
        }
      }
    };
    
    // Start the consumer loop
    consumeLoop().catch(error => {
      logger.error(`Consumer loop failed for ${consumerName}:`, error);
    });
  }
  
  /**
   * Get appropriate stream name for event type
   * 
   * @param {string} eventType - Event type
   * @returns {string} - Stream name
   * @private
   */
  getStreamForEvent(eventType) {
    const eventTypeMap = {
      'schedule.created': this.streamNames.SCHEDULE_EVENTS,
      'schedule.updated': this.streamNames.SCHEDULE_EVENTS,
      'schedule.deleted': this.streamNames.SCHEDULE_EVENTS,
      'schedule.optimized': this.streamNames.SCHEDULE_EVENTS,
      'conflict.detected': this.streamNames.CONFLICT_EVENTS,
      'conflict.resolved': this.streamNames.CONFLICT_EVENTS,
      'optimization.requested': this.streamNames.OPTIMIZATION_EVENTS,
      'optimization.completed': this.streamNames.OPTIMIZATION_EVENTS,
      'travel.optimized': this.streamNames.TRAVEL_EVENTS,
      'travel.calculated': this.streamNames.TRAVEL_EVENTS,
      'intelligence.prediction': this.streamNames.INTELLIGENCE_EVENTS,
      'intelligence.training': this.streamNames.INTELLIGENCE_EVENTS,
      'system.health': this.streamNames.SYSTEM_EVENTS,
      'system.config': this.streamNames.SYSTEM_EVENTS
    };
    
    return eventTypeMap[eventType] || this.streamNames.SYSTEM_EVENTS;
  }
  
  /**
   * Parse Redis message fields into event data
   * 
   * @param {Array} fields - Redis message fields
   * @returns {Object} - Parsed event data
   * @private
   */
  parseMessageFields(fields) {
    const data = {};
    
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (key === 'payload') {
        try {
          data[key] = JSON.parse(value);
        } catch (error) {
          data[key] = value;
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }
  
  /**
   * Check if message has expired based on TTL
   * 
   * @param {Object} eventData - Event data
   * @returns {boolean} - True if expired
   * @private
   */
  isMessageExpired(eventData) {
    if (!eventData.ttl) return false;
    
    const ttl = parseInt(eventData.ttl, 10);
    return Date.now() > ttl;
  }
  
  /**
   * Acknowledge message processing
   * 
   * @param {string} streamName - Stream name
   * @param {string} groupName - Consumer group name
   * @param {string} messageId - Message ID
   * @private
   */
  async acknowledgeMessage(streamName, groupName, messageId) {
    try {
      await this.subscriberClient.xAck(streamName, groupName, messageId);
    } catch (error) {
      logger.error(`Failed to acknowledge message ${messageId}:`, error);
    }
  }
  
  /**
   * Send message to dead letter queue
   * 
   * @param {string} originalStream - Original stream name
   * @param {string} messageId - Message ID
   * @param {Array} fields - Message fields
   * @param {string} errorMessage - Error message
   * @private
   */
  async sendToDeadLetterQueue(originalStream, messageId, fields, errorMessage) {
    try {
      const deadLetterData = {
        originalStream,
        originalMessageId: messageId,
        errorMessage,
        errorTimestamp: new Date().toISOString(),
        retryCount: '0'
      };
      
      // Add original fields
      for (let i = 0; i < fields.length; i += 2) {
        deadLetterData[`original_${fields[i]}`] = fields[i + 1];
      }
      
      await this.publisherClient.xAdd(
        this.streamNames.DEAD_LETTER,
        '*',
        deadLetterData
      );
      
      logger.warn(`Message sent to dead letter queue:`, {
        originalStream,
        messageId,
        errorMessage
      });
    } catch (error) {
      logger.error('Failed to send message to dead letter queue:', error);
    }
  }
  
  /**
   * Start metrics collection
   * 
   * @private
   */
  startMetricsCollection() {
    const collectMetrics = async () => {
      try {
        // Collect stream lengths
        for (const streamName of Object.values(this.streamNames)) {
          const length = await this.redisClient.xLen(streamName);
          streamLengthGauge.labels(streamName).set(length);
        }
        
        // Update active consumers count
        for (const [consumerName, consumer] of this.activeConsumers.entries()) {
          if (consumer.isActive) {
            activeConsumersGauge.labels(consumer.groupName, consumer.serviceName).set(1);
          }
        }
      } catch (error) {
        logger.error('Failed to collect metrics:', error);
      }
    };
    
    // Collect metrics every 30 seconds
    setInterval(collectMetrics, 30000);
  }
  
  /**
   * Get hub status and statistics
   * 
   * @returns {Promise<Object>} - Hub status
   */
  async getStatus() {
    try {
      const streamStats = {};
      
      for (const [key, streamName] of Object.entries(this.streamNames)) {
        const length = await this.redisClient.xLen(streamName);
        const info = await this.redisClient.xInfoStream(streamName);
        
        streamStats[key] = {
          name: streamName,
          length,
          consumers: info.groups,
          firstEntryId: info.firstEntry ? info.firstEntry[0] : null,
          lastEntryId: info.lastEntry ? info.lastEntry[0] : null
        };
      }
      
      return {
        status: 'healthy',
        initialized: this.isInitialized,
        activeConsumers: this.activeConsumers.size,
        streams: streamStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get hub status:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Shutdown the communication hub
   */
  async shutdown() {
    logger.info('Shutting down Communication Hub...');
    this.isShuttingDown = true;
    
    try {
      // Clear active consumers
      for (const [consumerName, consumer] of this.activeConsumers.entries()) {
        consumer.isActive = false;
        activeConsumersGauge.labels(consumer.groupName, consumer.serviceName).dec();
      }
      this.activeConsumers.clear();
      
      // Close Redis connections
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      
      if (this.publisherClient) {
        await this.publisherClient.quit();
      }
      
      if (this.subscriberClient) {
        await this.subscriberClient.quit();
      }
      
      logger.info('Communication Hub shutdown completed');
    } catch (error) {
      logger.error('Error during Communication Hub shutdown:', error);
      throw error;
    }
  }
}

module.exports = CommunicationHub;