/**
 * Notion Webhook Routes
 * 
 * Express routes for handling Notion webhooks and real-time synchronization
 */

const express = require('express');
const router = express.Router();
const EnhancedNotionAdapter = require('./enhanced-notion-adapter');
const logger = require('../../../backend/utils/logger');

class NotionWebhookHandler {
  constructor() {
    this.adapter = new EnhancedNotionAdapter();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle page creation events
    this.adapter.on('page_created', async (page) => {
      try {
        await this.handlePageCreated(page);
      } catch (error) {
        logger.error('Error handling page created event:', error);
      }
    });

    // Handle page update events
    this.adapter.on('page_updated', async (page) => {
      try {
        await this.handlePageUpdated(page);
      } catch (error) {
        logger.error('Error handling page updated event:', error);
      }
    });

    // Handle database update events
    this.adapter.on('database_updated', async (database) => {
      try {
        await this.handleDatabaseUpdated(database);
      } catch (error) {
        logger.error('Error handling database updated event:', error);
      }
    });
  }

  async handlePageCreated(page) {
    logger.info(`New page created in Notion: ${page.id}`);
    
    // Determine the type of content and sync accordingly
    const parentDb = page.parent?.database_id;
    
    if (parentDb === process.env.NOTION_SCHEDULES_DB_ID) {
      await this.syncScheduleFromNotion(page);
    } else if (parentDb === process.env.NOTION_TEAMS_DB_ID) {
      await this.syncTeamFromNotion(page);
    } else if (parentDb === process.env.NOTION_VENUES_DB_ID) {
      await this.syncVenueFromNotion(page);
    }
  }

  async handlePageUpdated(page) {
    logger.info(`Page updated in Notion: ${page.id}`);
    
    // Similar to handlePageCreated but for updates
    const parentDb = page.parent?.database_id;
    
    if (parentDb === process.env.NOTION_SCHEDULES_DB_ID) {
      await this.syncScheduleFromNotion(page);
    } else if (parentDb === process.env.NOTION_TEAMS_DB_ID) {
      await this.syncTeamFromNotion(page);
    } else if (parentDb === process.env.NOTION_VENUES_DB_ID) {
      await this.syncVenueFromNotion(page);
    }
  }

  async handleDatabaseUpdated(database) {
    logger.info(`Database updated in Notion: ${database.id}`);
    // Handle database schema changes if needed
  }

  async syncScheduleFromNotion(page) {
    try {
      const schedule = this.adapter.transformNotionToSchedule(page);
      
      // Sync to FlexTime database
      // This would integrate with your existing schedule service
      const scheduleService = require('../../../backend/services/scheduleService');
      
      if (schedule.id) {
        // Update existing schedule
        await scheduleService.updateSchedule(schedule.id, schedule);
      } else {
        // Create new schedule
        await scheduleService.createSchedule(schedule);
      }
      
      logger.info(`Schedule synced from Notion: ${schedule.homeTeam} vs ${schedule.awayTeam}`);
    } catch (error) {
      logger.error('Failed to sync schedule from Notion:', error);
    }
  }

  async syncTeamFromNotion(page) {
    // Implementation for team sync
    logger.info('Team sync from Notion not yet implemented');
  }

  async syncVenueFromNotion(page) {
    // Implementation for venue sync
    logger.info('Venue sync from Notion not yet implemented');
  }
}

// Initialize webhook handler
const webhookHandler = new NotionWebhookHandler();

/**
 * @route   POST /api/webhooks/notion
 * @desc    Handle Notion webhook events
 * @access  Public (with signature verification)
 */
router.post('/notion', async (req, res) => {
  try {
    const signature = req.headers['notion-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    // Process the webhook
    const result = await webhookHandler.adapter.processWebhook(payload, signature);
    
    logger.info('Notion webhook processed successfully:', result);
    res.json({ success: true, result });
    
  } catch (error) {
    logger.error('Notion webhook processing failed:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/webhooks/notion/test
 * @desc    Test Notion webhook functionality
 * @access  Public
 */
router.post('/notion/test', async (req, res) => {
  try {
    const testPayload = {
      type: 'page',
      action: 'updated',
      page: {
        id: 'test-page-id',
        parent: { database_id: process.env.NOTION_SCHEDULES_DB_ID },
        properties: {
          'Game Title': {
            title: [{ type: 'text', text: { content: 'Test Game' } }]
          },
          'Home Team': { select: { name: 'Kansas' } },
          'Away Team': { select: { name: 'Kansas State' } },
          'Sport': { select: { name: 'Football' } },
          'Date & Time': { date: { start: '2024-01-15T19:00:00Z' } }
        }
      }
    };

    // Simulate webhook processing
    await webhookHandler.handlePageUpdated(testPayload.page);
    
    res.json({ 
      success: true, 
      message: 'Test webhook processed successfully',
      testPayload 
    });
    
  } catch (error) {
    logger.error('Test webhook failed:', error);
    res.status(500).json({ error: 'Test webhook failed', message: error.message });
  }
});

/**
 * @route   GET /api/webhooks/notion/status
 * @desc    Get webhook handler status and statistics
 * @access  Public
 */
router.get('/notion/status', (req, res) => {
  try {
    const stats = webhookHandler.adapter.getSyncStats();
    
    res.json({
      status: 'active',
      adapter: 'enhanced',
      stats,
      endpoints: {
        webhook: '/api/webhooks/notion',
        test: '/api/webhooks/notion/test',
        status: '/api/webhooks/notion/status'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status', message: error.message });
  }
});

/**
 * @route   POST /api/webhooks/notion/sync/schedules/:sport
 * @desc    Trigger manual schedule sync for a specific sport
 * @access  Public
 */
router.post('/notion/sync/schedules/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { direction = 'to-notion' } = req.query;
    
    if (direction === 'to-notion') {
      // Get schedules from FlexTime and sync to Notion
      const scheduleService = require('../../../backend/services/scheduleService');
      const schedules = await scheduleService.getSchedulesBySport(sport);
      
      const result = await webhookHandler.adapter.syncSchedulesToNotion(schedules, sport);
      res.json({ success: true, direction, sport, result });
      
    } else if (direction === 'from-notion') {
      // Get updates from Notion and sync to FlexTime
      const updates = await webhookHandler.adapter.getScheduleUpdatesFromNotion(sport);
      
      // Process updates
      for (const schedule of updates) {
        await webhookHandler.syncScheduleFromNotion({ 
          id: schedule.notionPageId,
          properties: webhookHandler.adapter.transformScheduleToNotion(schedule).properties 
        });
      }
      
      res.json({ 
        success: true, 
        direction, 
        sport, 
        updated: updates.length 
      });
    } else {
      res.status(400).json({ error: 'Invalid direction. Use "to-notion" or "from-notion"' });
    }
    
  } catch (error) {
    logger.error('Manual sync failed:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

/**
 * @route   POST /api/webhooks/notion/sync/full
 * @desc    Trigger full bidirectional sync
 * @access  Public
 */
router.post('/notion/sync/full', async (req, res) => {
  try {
    const results = {
      schedules: {},
      teams: {},
      venues: {}
    };

    // Sync schedules for all sports
    const sports = ['Football', 'Men\'s Basketball', 'Women\'s Basketball', 'Baseball', 'Softball'];
    
    for (const sport of sports) {
      try {
        // To Notion
        const scheduleService = require('../../../backend/services/scheduleService');
        const schedules = await scheduleService.getSchedulesBySport(sport);
        const toNotionResult = await webhookHandler.adapter.syncSchedulesToNotion(schedules, sport);
        
        // From Notion
        const updates = await webhookHandler.adapter.getScheduleUpdatesFromNotion(sport);
        
        results.schedules[sport] = {
          toNotion: toNotionResult,
          fromNotion: { updated: updates.length }
        };
        
      } catch (error) {
        logger.error(`Failed to sync ${sport}:`, error);
        results.schedules[sport] = { error: error.message };
      }
    }

    res.json({ success: true, results });
    
  } catch (error) {
    logger.error('Full sync failed:', error);
    res.status(500).json({ error: 'Full sync failed', message: error.message });
  }
});

module.exports = router;