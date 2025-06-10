/**
 * Redis Messaging Bus for FlexTime Agent Army
 * 
 * Handles all inter-agent communication, coordination, and real-time messaging
 * Provides robust messaging infrastructure for the distributed agent system
 */

import Redis from 'redis';
import crypto from 'crypto';
import EventEmitter from 'events';

export class RedisMessagingBus extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      messageRetention: 3600, // 1 hour message retention
      heartbeatInterval: 30000, // 30 seconds
      deadLetterTTL: 86400, // 24 hours for dead letters
      maxRetries: 3,
      ...config
    };

    this.serviceId = 'redis_messaging_bus';
    this.redis = null;
    this.redisSub = null;
    this.redisPub = null;
    
    // Message tracking
    this.messageQueue = new Map();
    this.pendingMessages = new Map();
    this.deadLetters = new Map();
    
    // Agent registry
    this.activeAgents = new Map();
    this.agentHeartbeats = new Map();
    
    // Performance metrics
    this.metrics = {
      messagesPublished: 0,
      messagesConsumed: 0,
      messageFailures: 0,
      deadLetters: 0,
      activeConnections: 0,
      averageLatency: 0,
      lastReset: new Date().toISOString()
    };

    this.messageHandlers = new Map();
    this.isShuttingDown = false;
    
    this.initialize();
  }

  /**
   * Initialize Redis connections and messaging infrastructure
   */
  async initialize() {
    try {
      console.log(`🚀 [${this.serviceId}] Initializing Redis messaging infrastructure...`);

      // Create separate Redis connections for pub/sub
      this.redis = Redis.createClient({ url: this.config.redisUrl });
      this.redisSub = Redis.createClient({ url: this.config.redisUrl });
      this.redisPub = Redis.createClient({ url: this.config.redisUrl });

      // Connect all clients
      await Promise.all([
        this.redis.connect(),
        this.redisSub.connect(),
        this.redisPub.connect()
      ]);

      // Setup core messaging channels
      await this.setupMessagingChannels();
      
      // Start heartbeat monitoring
      this.startHeartbeatMonitoring();
      
      // Start cleanup routines
      this.startCleanupRoutines();

      console.log(`✅ [${this.serviceId}] Redis messaging bus initialized successfully`);
      this.emit('ready');

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to initialize Redis messaging:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Setup core messaging channels
   */
  async setupMessagingChannels() {
    const channels = [
      'flextime:agents:coordination',     // Main agent coordination
      'flextime:agents:ai_requests',      // AI SDK requests
      'flextime:agents:ai_responses',     // AI SDK responses
      'flextime:agents:heartbeat',        // Agent heartbeats
      'flextime:agents:status',           // Agent status updates
      'flextime:agents:optimization',     // Optimization requests/results
      'flextime:agents:travel',           // Travel optimization
      'flextime:agents:tensorzero',       // TensorZero ML requests
      'flextime:agents:emergency',        // Emergency/priority messages
      'flextime:agents:broadcast'         // Broadcast messages to all agents
    ];

    // Subscribe to all channels
    for (const channel of channels) {
      await this.redisSub.subscribe(channel, (message, channelName) => {
        this.handleIncomingMessage(message, channelName);
      });
    }

    console.log(`📡 [${this.serviceId}] Subscribed to ${channels.length} messaging channels`);
  }

  /**
   * Register an agent with the messaging bus
   */
  async registerAgent(agentId, capabilities = [], metadata = {}) {
    try {
      const agentInfo = {
        agentId,
        capabilities,
        metadata,
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status: 'active',
        messageCount: 0
      };

      this.activeAgents.set(agentId, agentInfo);
      this.agentHeartbeats.set(agentId, Date.now());

      // Publish agent registration
      await this.publish('flextime:agents:status', {
        type: 'agent_registered',
        agentId,
        capabilities,
        metadata,
        timestamp: new Date().toISOString()
      });

      console.log(`🤖 [${this.serviceId}] Registered agent: ${agentId} with capabilities: ${capabilities.join(', ')}`);
      return true;

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to register agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Unregister an agent from the messaging bus
   */
  async unregisterAgent(agentId) {
    try {
      this.activeAgents.delete(agentId);
      this.agentHeartbeats.delete(agentId);

      // Publish agent unregistration
      await this.publish('flextime:agents:status', {
        type: 'agent_unregistered',
        agentId,
        timestamp: new Date().toISOString()
      });

      console.log(`👋 [${this.serviceId}] Unregistered agent: ${agentId}`);
      return true;

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Publish message to specific channel
   */
  async publish(channel, message, options = {}) {
    const startTime = Date.now();
    
    try {
      const messageId = crypto.randomUUID();
      const enrichedMessage = {
        messageId,
        timestamp: new Date().toISOString(),
        channel,
        retries: 0,
        ...message,
        ...options
      };

      // Store message for tracking
      this.messageQueue.set(messageId, {
        ...enrichedMessage,
        status: 'published',
        publishedAt: startTime
      });

      // Publish to Redis
      await this.redisPub.publish(channel, JSON.stringify(enrichedMessage));
      
      this.metrics.messagesPublished++;
      this.updateLatencyMetrics(Date.now() - startTime);

      console.log(`📤 [${this.serviceId}] Published message to ${channel}: ${messageId}`);
      return messageId;

    } catch (error) {
      this.metrics.messageFailures++;
      console.error(`❌ [${this.serviceId}] Failed to publish to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Send direct message to specific agent
   */
  async sendToAgent(targetAgentId, messageType, data, options = {}) {
    if (!this.activeAgents.has(targetAgentId)) {
      throw new Error(`Agent ${targetAgentId} not found or inactive`);
    }

    const message = {
      type: messageType,
      to: targetAgentId,
      from: options.from || this.serviceId,
      data,
      direct: true,
      priority: options.priority || 'normal'
    };

    return await this.publish('flextime:agents:coordination', message, options);
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(messageType, data, options = {}) {
    const message = {
      type: messageType,
      to: 'all',
      from: options.from || this.serviceId,
      data,
      broadcast: true,
      priority: options.priority || 'normal'
    };

    return await this.publish('flextime:agents:broadcast', message, options);
  }

  /**
   * Send message and wait for response
   */
  async sendAndWaitForResponse(targetAgentId, messageType, data, timeout = 30000) {
    const requestId = crypto.randomUUID();
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(`response:${requestId}`, responseHandler);
        reject(new Error(`Request ${requestId} to ${targetAgentId} timed out`));
      }, timeout);

      const responseHandler = (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      };

      this.once(`response:${requestId}`, responseHandler);

      try {
        await this.sendToAgent(targetAgentId, messageType, {
          ...data,
          requestId,
          expectResponse: true
        });
      } catch (error) {
        clearTimeout(timeoutId);
        this.removeListener(`response:${requestId}`, responseHandler);
        reject(error);
      }
    });
  }

  /**
   * Register message handler for specific message types
   */
  registerMessageHandler(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
    
    console.log(`🔧 [${this.serviceId}] Registered handler for message type: ${messageType}`);
  }

  /**
   * Handle incoming messages from Redis
   */
  async handleIncomingMessage(messageData, channel) {
    const startTime = Date.now();
    
    try {
      const message = JSON.parse(messageData);
      this.metrics.messagesConsumed++;

      // Update agent heartbeat if applicable
      if (message.from && this.activeAgents.has(message.from)) {
        this.agentHeartbeats.set(message.from, Date.now());
        const agentInfo = this.activeAgents.get(message.from);
        agentInfo.messageCount++;
        agentInfo.lastSeen = new Date().toISOString();
      }

      // Handle responses to requests
      if (message.requestId && message.type === 'response') {
        this.emit(`response:${message.requestId}`, message.data);
        return;
      }

      // Route to specific handlers
      if (this.messageHandlers.has(message.type)) {
        const handlers = this.messageHandlers.get(message.type);
        for (const handler of handlers) {
          try {
            await handler(message, channel);
          } catch (handlerError) {
            console.error(`❌ [${this.serviceId}] Handler error for ${message.type}:`, handlerError);
          }
        }
      }

      // Emit event for message type
      this.emit(message.type, message, channel);
      this.emit('message', message, channel);

      this.updateLatencyMetrics(Date.now() - startTime);

    } catch (error) {
      this.metrics.messageFailures++;
      console.error(`❌ [${this.serviceId}] Failed to handle message from ${channel}:`, error);
      
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(messageData, channel, error.message);
    }
  }

  /**
   * Send failed messages to dead letter queue
   */
  async sendToDeadLetterQueue(message, channel, error) {
    try {
      const deadLetter = {
        originalMessage: message,
        channel,
        error,
        timestamp: new Date().toISOString(),
        deadLetterId: crypto.randomUUID()
      };

      await this.redis.setEx(
        `flextime:dead_letters:${deadLetter.deadLetterId}`,
        this.config.deadLetterTTL,
        JSON.stringify(deadLetter)
      );

      this.metrics.deadLetters++;
      console.log(`💀 [${this.serviceId}] Message sent to dead letter queue: ${deadLetter.deadLetterId}`);

    } catch (deadLetterError) {
      console.error(`❌ [${this.serviceId}] Failed to send to dead letter queue:`, deadLetterError);
    }
  }

  /**
   * Start heartbeat monitoring for agents
   */
  startHeartbeatMonitoring() {
    setInterval(() => {
      if (this.isShuttingDown) return;

      const now = Date.now();
      const staleThreshold = now - (this.config.heartbeatInterval * 3); // 3x heartbeat interval

      for (const [agentId, lastSeen] of this.agentHeartbeats.entries()) {
        if (lastSeen < staleThreshold) {
          console.warn(`⚠️ [${this.serviceId}] Agent ${agentId} appears stale (last seen: ${new Date(lastSeen).toISOString()})`);
          
          // Update agent status
          const agentInfo = this.activeAgents.get(agentId);
          if (agentInfo) {
            agentInfo.status = 'stale';
          }

          // Emit stale agent event
          this.emit('agent_stale', agentId, lastSeen);
        }
      }
    }, this.config.heartbeatInterval);

    console.log(`💓 [${this.serviceId}] Heartbeat monitoring started (interval: ${this.config.heartbeatInterval}ms)`);
  }

  /**
   * Start cleanup routines
   */
  startCleanupRoutines() {
    // Clean up old messages every 10 minutes
    setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        const cutoff = Date.now() - (this.config.messageRetention * 1000);
        const toDelete = [];

        for (const [messageId, messageInfo] of this.messageQueue.entries()) {
          if (messageInfo.publishedAt < cutoff) {
            toDelete.push(messageId);
          }
        }

        for (const messageId of toDelete) {
          this.messageQueue.delete(messageId);
        }

        if (toDelete.length > 0) {
          console.log(`🗑️ [${this.serviceId}] Cleaned up ${toDelete.length} old messages`);
        }

      } catch (error) {
        console.error(`❌ [${this.serviceId}] Cleanup routine failed:`, error);
      }
    }, 600000); // 10 minutes

    console.log(`🧹 [${this.serviceId}] Cleanup routines started`);
  }

  /**
   * Get comprehensive messaging metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeAgents: this.activeAgents.size,
      queuedMessages: this.messageQueue.size,
      pendingMessages: this.pendingMessages.size,
      deadLetters: this.deadLetters.size,
      messageHandlers: this.messageHandlers.size,
      redis_connected: !!this.redis?.isReady,
      uptime: Date.now() - new Date(this.metrics.lastReset).getTime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get agent registry status
   */
  getAgentRegistry() {
    const agents = [];
    for (const [agentId, agentInfo] of this.activeAgents.entries()) {
      agents.push({
        ...agentInfo,
        lastHeartbeat: this.agentHeartbeats.get(agentId),
        isStale: (Date.now() - this.agentHeartbeats.get(agentId)) > (this.config.heartbeatInterval * 3)
      });
    }
    return agents;
  }

  /**
   * Get dead letter queue contents
   */
  async getDeadLetters(limit = 50) {
    try {
      const keys = await this.redis.keys('flextime:dead_letters:*');
      const deadLetters = [];

      for (const key of keys.slice(0, limit)) {
        const deadLetter = await this.redis.get(key);
        if (deadLetter) {
          deadLetters.push(JSON.parse(deadLetter));
        }
      }

      return deadLetters;
    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to retrieve dead letters:`, error);
      return [];
    }
  }

  /**
   * Retry failed message from dead letter queue
   */
  async retryDeadLetter(deadLetterId) {
    try {
      const deadLetter = await this.redis.get(`flextime:dead_letters:${deadLetterId}`);
      if (!deadLetter) {
        throw new Error(`Dead letter ${deadLetterId} not found`);
      }

      const { originalMessage, channel } = JSON.parse(deadLetter);
      
      // Retry the message
      await this.redisPub.publish(channel, originalMessage);
      
      // Remove from dead letter queue
      await this.redis.del(`flextime:dead_letters:${deadLetterId}`);
      
      console.log(`🔄 [${this.serviceId}] Retried dead letter: ${deadLetterId}`);
      return true;

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to retry dead letter:`, error);
      return false;
    }
  }

  /**
   * Update latency metrics
   */
  updateLatencyMetrics(latency) {
    const totalMessages = this.metrics.messagesPublished + this.metrics.messagesConsumed;
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (totalMessages - 1) + latency) / totalMessages;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      messagesPublished: 0,
      messagesConsumed: 0,
      messageFailures: 0,
      deadLetters: 0,
      activeConnections: 0,
      averageLatency: 0,
      lastReset: new Date().toISOString()
    };
    
    console.log(`🔄 [${this.serviceId}] Metrics reset`);
  }

  /**
   * Shutdown messaging bus gracefully
   */
  async shutdown() {
    console.log(`🔌 [${this.serviceId}] Shutting down Redis messaging bus...`);
    
    this.isShuttingDown = true;

    try {
      // Unsubscribe from all channels
      if (this.redisSub) {
        await this.redisSub.unsubscribe();
        await this.redisSub.quit();
      }

      // Close Redis connections
      if (this.redisPub) await this.redisPub.quit();
      if (this.redis) await this.redis.quit();

      // Clear internal state
      this.messageQueue.clear();
      this.pendingMessages.clear();
      this.activeAgents.clear();
      this.agentHeartbeats.clear();
      this.messageHandlers.clear();

      console.log(`✅ [${this.serviceId}] Messaging bus shutdown complete`);
      this.emit('shutdown');

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Error during shutdown:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const messagingBus = new RedisMessagingBus();
export default messagingBus;