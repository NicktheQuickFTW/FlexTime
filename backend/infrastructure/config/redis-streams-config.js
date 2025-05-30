/**
 * Redis Streams Configuration for FlexTime Event Infrastructure
 * 
 * This configuration extends the existing Redis setup to support
 * event streaming and message queuing for microservices migration.
 */

const Redis = require('ioredis');

class RedisStreamsConfig {
  constructor(options = {}) {
    this.config = {
      // Redis connection settings
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_STREAMS_DB || 1, // Use separate DB for streams
      
      // Stream configuration
      keyPrefix: process.env.REDIS_STREAMS_PREFIX || 'flextime:stream:',
      
      // Consumer group settings
      consumerGroup: process.env.REDIS_CONSUMER_GROUP || 'flextime-workers',
      consumerName: process.env.REDIS_CONSUMER_NAME || `worker-${process.pid}`,
      
      // Stream retention and limits
      maxStreamLength: parseInt(process.env.REDIS_MAX_STREAM_LENGTH || '10000'),
      
      // Connection settings
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      
      ...options
    };

    this.redis = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection for streams
   */
  async connect() {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        enableReadyCheck: this.config.enableReadyCheck,
        lazyConnect: this.config.lazyConnect,
        keyPrefix: this.config.keyPrefix
      });

      await this.redis.connect();
      this.isConnected = true;
      
      console.log(`Redis Streams connected: ${this.config.host}:${this.config.port} (DB: ${this.config.db})`);
      
      // Set up error handling
      this.redis.on('error', (err) => {
        console.error('Redis Streams error:', err);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        console.log('Redis Streams connection closed');
      });

      return this.redis;
    } catch (error) {
      console.error('Failed to connect to Redis Streams:', error);
      throw error;
    }
  }

  /**
   * Get Redis instance
   */
  getRedis() {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis Streams not connected. Call connect() first.');
    }
    return this.redis;
  }

  /**
   * Create consumer group for a stream
   */
  async createConsumerGroup(streamName, groupName = null) {
    const group = groupName || this.config.consumerGroup;
    const fullStreamName = this.getStreamName(streamName);
    
    try {
      await this.redis.xgroup('CREATE', fullStreamName, group, '0', 'MKSTREAM');
      console.log(`Consumer group '${group}' created for stream '${fullStreamName}'`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        console.log(`Consumer group '${group}' already exists for stream '${fullStreamName}'`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get full stream name with prefix
   */
  getStreamName(streamName) {
    return streamName; // Prefix is handled by Redis instance
  }

  /**
   * Cleanup and close connection
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      console.log('Redis Streams disconnected');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'error', message: 'Not connected' };
      }
      
      const pong = await this.redis.ping();
      return { 
        status: 'healthy', 
        message: 'Redis Streams operational',
        response: pong,
        config: {
          host: this.config.host,
          port: this.config.port,
          db: this.config.db
        }
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }
}

// Stream names for different event types
const STREAM_NAMES = {
  SCHEDULE_EVENTS: 'schedule-events',
  GAME_EVENTS: 'game-events',
  CONSTRAINT_EVENTS: 'constraint-events',
  OPTIMIZATION_EVENTS: 'optimization-events',
  NOTIFICATION_EVENTS: 'notification-events',
  FEEDBACK_EVENTS: 'feedback-events',
  COMPASS_EVENTS: 'compass-events',
  SYSTEM_EVENTS: 'system-events'
};

// Event priorities
const EVENT_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal', 
  LOW: 'low'
};

// Configuration factory
function createRedisStreamsConfig(environment = 'development') {
  const configs = {
    development: {
      host: 'localhost',
      port: 6379,
      db: 1,
      maxStreamLength: 1000
    },
    production: {
      host: process.env.REDIS_HOST || 'flextime-redis',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_STREAMS_DB || 1,
      maxStreamLength: 50000,
      password: process.env.REDIS_PASSWORD
    },
    test: {
      host: 'localhost',
      port: 6379,
      db: 15, // Use high DB number for tests
      maxStreamLength: 100
    }
  };

  return new RedisStreamsConfig(configs[environment] || configs.development);
}

module.exports = {
  RedisStreamsConfig,
  STREAM_NAMES,
  EVENT_PRIORITIES,
  createRedisStreamsConfig
};