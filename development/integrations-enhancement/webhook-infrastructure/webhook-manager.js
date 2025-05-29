/**
 * FlexTime Webhook Management System
 * 
 * Comprehensive webhook infrastructure for external notifications,
 * real-time synchronization, and event-driven integrations.
 */

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const EventEmitter = require('events');
const Queue = require('bull');
const redis = require('redis');
const logger = require('../../../backend/utils/logger');

class WebhookManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      timeout: config.timeout || 30000,
      batchSize: config.batchSize || 10,
      signatureSecret: config.signatureSecret || process.env.WEBHOOK_SECRET || 'flextime-webhook-secret',
      enableLogging: config.enableLogging !== false,
      enableMetrics: config.enableMetrics !== false,
      ...config
    };

    this.subscriptions = new Map(); // webhook_id -> subscription_config
    this.deliveryQueue = null;
    this.redisClient = null;
    this.metrics = {
      sent: 0,
      delivered: 0,
      failed: 0,
      retries: 0,
      avgResponseTime: 0,
      byEndpoint: new Map()
    };

    this.eventTypes = {
      'schedule.created': 'Schedule Created',
      'schedule.updated': 'Schedule Updated',
      'schedule.deleted': 'Schedule Deleted',
      'game.created': 'Game Created',
      'game.updated': 'Game Updated',
      'game.started': 'Game Started',
      'game.finished': 'Game Finished',
      'team.updated': 'Team Updated',
      'venue.updated': 'Venue Updated',
      'notification.sent': 'Notification Sent',
      'conflict.detected': 'Schedule Conflict Detected',
      'conflict.resolved': 'Schedule Conflict Resolved',
      'export.completed': 'Export Completed',
      'sync.completed': 'Synchronization Completed',
      'user.registered': 'User Registered',
      'user.updated': 'User Updated'
    };

    this.initialize();
  }

  /**
   * Initialize webhook system
   */
  async initialize() {
    try {
      // Initialize Redis connection
      this.redisClient = redis.createClient({ url: this.config.redisUrl });
      await this.redisClient.connect();

      // Initialize delivery queue
      this.deliveryQueue = new Queue('webhook delivery', this.config.redisUrl);
      
      // Set up queue processing
      this.deliveryQueue.process(this.config.batchSize, this.processWebhookDelivery.bind(this));
      
      // Set up queue event handlers
      this.deliveryQueue.on('completed', this.handleDeliverySuccess.bind(this));
      this.deliveryQueue.on('failed', this.handleDeliveryFailure.bind(this));
      
      logger.info('Webhook manager initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize webhook manager:', error);
      throw error;
    }
  }

  /**
   * Register a new webhook subscription
   */
  async registerWebhook(subscription) {
    const {
      id,
      url,
      events,
      secret,
      active = true,
      description,
      metadata = {}
    } = subscription;

    if (!id || !url || !events || !Array.isArray(events)) {
      throw new Error('Webhook registration requires id, url, and events array');
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new Error('Invalid webhook URL');
    }

    // Validate events
    const invalidEvents = events.filter(event => !this.eventTypes[event]);
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid event types: ${invalidEvents.join(', ')}`);
    }

    const webhookConfig = {
      id,
      url,
      events,
      secret: secret || this.generateSecret(),
      active,
      description,
      metadata,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      deliveryCount: 0,
      failureCount: 0
    };

    // Store subscription
    this.subscriptions.set(id, webhookConfig);
    
    // Persist to Redis
    await this.redisClient.hSet('webhooks', id, JSON.stringify(webhookConfig));
    
    logger.info(`Webhook registered: ${id} -> ${url}`);
    
    return {
      success: true,
      webhook: {
        id: webhookConfig.id,
        url: webhookConfig.url,
        events: webhookConfig.events,
        active: webhookConfig.active,
        secret: webhookConfig.secret
      }
    };
  }

  /**
   * Update existing webhook subscription
   */
  async updateWebhook(id, updates) {
    const existing = this.subscriptions.get(id);
    if (!existing) {
      throw new Error(`Webhook ${id} not found`);
    }

    // Validate updates
    if (updates.url) {
      try {
        new URL(updates.url);
      } catch (error) {
        throw new Error('Invalid webhook URL');
      }
    }

    if (updates.events) {
      const invalidEvents = updates.events.filter(event => !this.eventTypes[event]);
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid event types: ${invalidEvents.join(', ')}`);
      }
    }

    // Apply updates
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.subscriptions.set(id, updated);
    await this.redisClient.hSet('webhooks', id, JSON.stringify(updated));
    
    logger.info(`Webhook updated: ${id}`);
    
    return { success: true, webhook: updated };
  }

  /**
   * Delete webhook subscription
   */
  async deleteWebhook(id) {
    const existing = this.subscriptions.get(id);
    if (!existing) {
      throw new Error(`Webhook ${id} not found`);
    }

    this.subscriptions.delete(id);
    await this.redisClient.hDel('webhooks', id);
    
    logger.info(`Webhook deleted: ${id}`);
    
    return { success: true, deletedId: id };
  }

  /**
   * Get webhook subscription
   */
  getWebhook(id) {
    return this.subscriptions.get(id) || null;
  }

  /**
   * List all webhook subscriptions
   */
  listWebhooks(filters = {}) {
    const webhooks = Array.from(this.subscriptions.values());
    
    let filtered = webhooks;
    
    // Apply filters
    if (filters.active !== undefined) {
      filtered = filtered.filter(w => w.active === filters.active);
    }
    
    if (filters.event) {
      filtered = filtered.filter(w => w.events.includes(filters.event));
    }
    
    return {
      count: filtered.length,
      webhooks: filtered
    };
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(eventType, data, metadata = {}) {
    if (!this.eventTypes[eventType]) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
      metadata
    };

    // Find subscriptions for this event type
    const subscribers = Array.from(this.subscriptions.values())
      .filter(sub => sub.active && sub.events.includes(eventType));

    if (subscribers.length === 0) {
      logger.debug(`No subscribers for event: ${eventType}`);
      return { eventId: event.id, subscribers: 0 };
    }

    // Queue delivery for each subscriber
    const deliveryPromises = subscribers.map(subscriber => 
      this.queueDelivery(subscriber, event)
    );

    await Promise.allSettled(deliveryPromises);

    logger.info(`Event triggered: ${eventType} -> ${subscribers.length} subscribers`);

    return {
      eventId: event.id,
      subscribers: subscribers.length,
      eventType,
      timestamp: event.timestamp
    };
  }

  /**
   * Queue webhook delivery
   */
  async queueDelivery(subscription, event) {
    const delivery = {
      id: crypto.randomUUID(),
      webhookId: subscription.id,
      subscription,
      event,
      attempt: 1,
      queuedAt: new Date().toISOString()
    };

    try {
      await this.deliveryQueue.add('deliver', delivery, {
        attempts: this.config.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: this.config.retryDelay
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50 // Keep last 50 failed jobs
      });

      this.metrics.sent++;
      
    } catch (error) {
      logger.error('Failed to queue webhook delivery:', error);
      throw error;
    }
  }

  /**
   * Process webhook delivery
   */
  async processWebhookDelivery(job) {
    const { subscription, event, attempt } = job.data;
    const startTime = Date.now();

    try {
      // Create webhook payload
      const payload = this.createWebhookPayload(event, subscription);
      
      // Generate signature
      const signature = this.generateSignature(payload, subscription.secret);
      
      // Send webhook
      const response = await axios.post(subscription.url, payload, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlexTime-Webhooks/1.0',
          'X-FlexTime-Event': event.type,
          'X-FlexTime-Signature': signature,
          'X-FlexTime-Delivery': job.data.id,
          'X-FlexTime-Timestamp': event.timestamp
        }
      });

      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(subscription, responseTime, true);
      
      // Update subscription stats
      await this.updateSubscriptionStats(subscription.id, true);

      logger.info(`Webhook delivered: ${subscription.id} (${responseTime}ms)`);
      
      return {
        success: true,
        statusCode: response.status,
        responseTime,
        attempt
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(subscription, responseTime, false);
      
      // Update subscription stats
      await this.updateSubscriptionStats(subscription.id, false);

      logger.error(`Webhook delivery failed: ${subscription.id} (attempt ${attempt})`, error.message);
      
      // Increment retry count
      this.metrics.retries++;
      
      throw error;
    }
  }

  /**
   * Create webhook payload
   */
  createWebhookPayload(event, subscription) {
    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      data: event.data,
      metadata: {
        ...event.metadata,
        webhook: {
          id: subscription.id,
          description: subscription.description
        }
      }
    };
  }

  /**
   * Generate webhook signature
   */
  generateSignature(payload, secret) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
  }

  /**
   * Generate webhook secret
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle successful delivery
   */
  async handleDeliverySuccess(job, result) {
    this.metrics.delivered++;
    
    this.emit('delivery.success', {
      webhookId: job.data.subscription.id,
      eventType: job.data.event.type,
      result
    });
  }

  /**
   * Handle delivery failure
   */
  async handleDeliveryFailure(job, error) {
    this.metrics.failed++;
    
    this.emit('delivery.failure', {
      webhookId: job.data.subscription.id,
      eventType: job.data.event.type,
      error: error.message,
      attempt: job.attemptsMade
    });

    // Disable webhook after too many failures
    const subscription = job.data.subscription;
    if (job.attemptsMade >= this.config.maxRetries) {
      await this.handleWebhookFailure(subscription.id);
    }
  }

  /**
   * Handle webhook failure (disable if too many failures)
   */
  async handleWebhookFailure(webhookId) {
    const subscription = this.subscriptions.get(webhookId);
    if (!subscription) return;

    // If failure count is too high, disable the webhook
    if (subscription.failureCount >= 10) {
      await this.updateWebhook(webhookId, { active: false });
      
      logger.warn(`Webhook disabled due to repeated failures: ${webhookId}`);
      
      this.emit('webhook.disabled', {
        webhookId,
        reason: 'repeated_failures',
        failureCount: subscription.failureCount
      });
    }
  }

  /**
   * Update metrics
   */
  updateMetrics(subscription, responseTime, success) {
    // Update average response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.delivered + this.metrics.failed - 1) + responseTime) /
      (this.metrics.delivered + this.metrics.failed);

    // Update per-endpoint metrics
    if (!this.metrics.byEndpoint.has(subscription.url)) {
      this.metrics.byEndpoint.set(subscription.url, {
        delivered: 0,
        failed: 0,
        avgResponseTime: 0
      });
    }

    const endpointMetrics = this.metrics.byEndpoint.get(subscription.url);
    if (success) {
      endpointMetrics.delivered++;
    } else {
      endpointMetrics.failed++;
    }

    endpointMetrics.avgResponseTime = 
      (endpointMetrics.avgResponseTime * (endpointMetrics.delivered + endpointMetrics.failed - 1) + responseTime) /
      (endpointMetrics.delivered + endpointMetrics.failed);
  }

  /**
   * Update subscription statistics
   */
  async updateSubscriptionStats(webhookId, success) {
    const subscription = this.subscriptions.get(webhookId);
    if (!subscription) return;

    subscription.lastTriggered = new Date().toISOString();
    subscription.deliveryCount++;
    
    if (!success) {
      subscription.failureCount++;
    }

    this.subscriptions.set(webhookId, subscription);
    await this.redisClient.hSet('webhooks', webhookId, JSON.stringify(subscription));
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId) {
    const subscription = this.subscriptions.get(webhookId);
    if (!subscription) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const testEvent = {
      id: 'test-' + crypto.randomUUID(),
      type: 'test.webhook',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from FlexTime',
        webhookId: subscription.id
      },
      metadata: {
        test: true
      }
    };

    try {
      const payload = this.createWebhookPayload(testEvent, subscription);
      const signature = this.generateSignature(payload, subscription.secret);

      const response = await axios.post(subscription.url, payload, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlexTime-Webhooks/1.0',
          'X-FlexTime-Event': testEvent.type,
          'X-FlexTime-Signature': signature,
          'X-FlexTime-Delivery': testEvent.id,
          'X-FlexTime-Timestamp': testEvent.timestamp
        }
      });

      return {
        success: true,
        statusCode: response.status,
        responseTime: response.headers['x-response-time'] || 'unknown',
        message: 'Webhook test successful'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        message: 'Webhook test failed'
      };
    }
  }

  /**
   * Get webhook metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      byEndpoint: Object.fromEntries(this.metrics.byEndpoint)
    };
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats() {
    const waiting = await this.deliveryQueue.waiting();
    const active = await this.deliveryQueue.active();
    const completed = await this.deliveryQueue.completed();
    const failed = await this.deliveryQueue.failed();

    return {
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      },
      metrics: this.getMetrics()
    };
  }

  /**
   * Load webhooks from Redis on startup
   */
  async loadWebhooks() {
    try {
      const webhooks = await this.redisClient.hGetAll('webhooks');
      
      for (const [id, configJson] of Object.entries(webhooks)) {
        try {
          const config = JSON.parse(configJson);
          this.subscriptions.set(id, config);
        } catch (error) {
          logger.error(`Failed to parse webhook config for ${id}:`, error);
        }
      }

      logger.info(`Loaded ${this.subscriptions.size} webhook subscriptions`);
      
    } catch (error) {
      logger.error('Failed to load webhooks from Redis:', error);
    }
  }

  /**
   * Get supported event types
   */
  getSupportedEvents() {
    return this.eventTypes;
  }

  /**
   * Shutdown webhook manager
   */
  async shutdown() {
    try {
      if (this.deliveryQueue) {
        await this.deliveryQueue.close();
      }
      
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      
      logger.info('Webhook manager shutdown complete');
      
    } catch (error) {
      logger.error('Error during webhook manager shutdown:', error);
    }
  }
}

module.exports = WebhookManager;