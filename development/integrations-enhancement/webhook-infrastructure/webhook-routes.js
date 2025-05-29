/**
 * Webhook Infrastructure Routes
 * 
 * Express routes for webhook management, subscription handling,
 * and delivery monitoring.
 */

const express = require('express');
const router = express.Router();
const WebhookManager = require('./webhook-manager');
const logger = require('../../../backend/utils/logger');

// Initialize webhook manager
const webhookManager = new WebhookManager();

// Load existing webhooks on startup
webhookManager.loadWebhooks().catch(error => {
  logger.error('Failed to load webhooks on startup:', error);
});

/**
 * @route   POST /api/webhooks/register
 * @desc    Register a new webhook subscription
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const subscription = req.body;
    
    if (!subscription.id || !subscription.url || !subscription.events) {
      return res.status(400).json({
        error: 'Missing required fields: id, url, events'
      });
    }

    const result = await webhookManager.registerWebhook(subscription);
    
    logger.info(`Webhook registered: ${subscription.id}`);
    res.status(201).json(result);
    
  } catch (error) {
    logger.error('Webhook registration failed:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/webhooks/:id
 * @desc    Update existing webhook subscription
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await webhookManager.updateWebhook(id, updates);
    
    logger.info(`Webhook updated: ${id}`);
    res.json(result);
    
  } catch (error) {
    logger.error(`Webhook update failed for ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * @route   DELETE /api/webhooks/:id
 * @desc    Delete webhook subscription
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await webhookManager.deleteWebhook(id);
    
    logger.info(`Webhook deleted: ${id}`);
    res.json(result);
    
  } catch (error) {
    logger.error(`Webhook deletion failed for ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @route   GET /api/webhooks/:id
 * @desc    Get specific webhook subscription
 * @access  Public
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const webhook = webhookManager.getWebhook(id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    res.json({
      success: true,
      webhook
    });
    
  } catch (error) {
    logger.error(`Failed to get webhook ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/webhooks
 * @desc    List all webhook subscriptions
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const { active, event } = req.query;
    
    const filters = {};
    if (active !== undefined) {
      filters.active = active === 'true';
    }
    if (event) {
      filters.event = event;
    }
    
    const result = webhookManager.listWebhooks(filters);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    logger.error('Failed to list webhooks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/webhooks/:id/test
 * @desc    Test webhook endpoint
 * @access  Public
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await webhookManager.testWebhook(id);
    
    logger.info(`Webhook test completed for ${id}:`, result.success);
    res.json(result);
    
  } catch (error) {
    logger.error(`Webhook test failed for ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @route   POST /api/webhooks/trigger
 * @desc    Manually trigger webhook event (for testing)
 * @access  Public
 */
router.post('/trigger', async (req, res) => {
  try {
    const { eventType, data, metadata = {} } = req.body;
    
    if (!eventType || !data) {
      return res.status(400).json({
        error: 'eventType and data are required'
      });
    }
    
    const result = await webhookManager.triggerEvent(eventType, data, metadata);
    
    logger.info(`Event triggered manually: ${eventType}`);
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Manual event trigger failed:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/webhooks/events/types
 * @desc    Get supported event types
 * @access  Public
 */
router.get('/events/types', (req, res) => {
  try {
    const eventTypes = webhookManager.getSupportedEvents();
    
    res.json({
      success: true,
      eventTypes
    });
    
  } catch (error) {
    logger.error('Failed to get event types:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/webhooks/metrics
 * @desc    Get webhook delivery metrics
 * @access  Public
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = webhookManager.getMetrics();
    const deliveryStats = await webhookManager.getDeliveryStats();
    
    res.json({
      success: true,
      metrics,
      deliveryStats
    });
    
  } catch (error) {
    logger.error('Failed to get webhook metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/webhooks/events/schedule
 * @desc    Trigger schedule-related events
 * @access  Public
 */
router.post('/events/schedule', async (req, res) => {
  try {
    const { action, schedule, metadata = {} } = req.body;
    
    if (!action || !schedule) {
      return res.status(400).json({
        error: 'action and schedule data are required'
      });
    }
    
    const eventType = `schedule.${action}`;
    const result = await webhookManager.triggerEvent(eventType, schedule, metadata);
    
    logger.info(`Schedule event triggered: ${eventType}`);
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Schedule event trigger failed:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/webhooks/events/game
 * @desc    Trigger game-related events
 * @access  Public
 */
router.post('/events/game', async (req, res) => {
  try {
    const { action, game, metadata = {} } = req.body;
    
    if (!action || !game) {
      return res.status(400).json({
        error: 'action and game data are required'
      });
    }
    
    const eventType = `game.${action}`;
    const result = await webhookManager.triggerEvent(eventType, game, metadata);
    
    logger.info(`Game event triggered: ${eventType}`);
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Game event trigger failed:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/webhooks/events/conflict
 * @desc    Trigger conflict-related events
 * @access  Public
 */
router.post('/events/conflict', async (req, res) => {
  try {
    const { action, conflict, metadata = {} } = req.body;
    
    if (!action || !conflict) {
      return res.status(400).json({
        error: 'action and conflict data are required'
      });
    }
    
    const eventType = `conflict.${action}`;
    const result = await webhookManager.triggerEvent(eventType, conflict, metadata);
    
    logger.info(`Conflict event triggered: ${eventType}`);
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Conflict event trigger failed:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/webhooks/bulk-register
 * @desc    Register multiple webhooks at once
 * @access  Public
 */
router.post('/bulk-register', async (req, res) => {
  try {
    const { webhooks } = req.body;
    
    if (!webhooks || !Array.isArray(webhooks)) {
      return res.status(400).json({
        error: 'webhooks array is required'
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const webhook of webhooks) {
      try {
        const result = await webhookManager.registerWebhook(webhook);
        results.successful.push({
          id: webhook.id,
          result
        });
      } catch (error) {
        results.failed.push({
          id: webhook.id,
          error: error.message
        });
      }
    }
    
    logger.info(`Bulk webhook registration: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    res.json({
      success: true,
      results
    });
    
  } catch (error) {
    logger.error('Bulk webhook registration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/webhooks/status
 * @desc    Get webhook system status
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const webhooks = webhookManager.listWebhooks();
    const metrics = webhookManager.getMetrics();
    const deliveryStats = await webhookManager.getDeliveryStats();
    
    res.json({
      success: true,
      status: 'active',
      webhooks: {
        total: webhooks.count,
        active: webhooks.webhooks.filter(w => w.active).length,
        inactive: webhooks.webhooks.filter(w => !w.active).length
      },
      metrics,
      deliveryStats,
      supportedEvents: Object.keys(webhookManager.getSupportedEvents()).length,
      endpoints: {
        register: '/api/webhooks/register',
        update: '/api/webhooks/:id',
        delete: '/api/webhooks/:id',
        get: '/api/webhooks/:id',
        list: '/api/webhooks',
        test: '/api/webhooks/:id/test',
        trigger: '/api/webhooks/trigger',
        eventTypes: '/api/webhooks/events/types',
        metrics: '/api/webhooks/metrics'
      }
    });
    
  } catch (error) {
    logger.error('Failed to get webhook status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set up webhook manager event listeners for logging
webhookManager.on('delivery.success', (data) => {
  logger.info(`Webhook delivery success: ${data.webhookId} (${data.eventType})`);
});

webhookManager.on('delivery.failure', (data) => {
  logger.warn(`Webhook delivery failure: ${data.webhookId} (${data.eventType}) - ${data.error}`);
});

webhookManager.on('webhook.disabled', (data) => {
  logger.warn(`Webhook disabled: ${data.webhookId} - ${data.reason}`);
});

module.exports = router;