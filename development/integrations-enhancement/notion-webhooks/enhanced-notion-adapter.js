/**
 * Enhanced Notion API Adapter with Webhook Support
 * 
 * Advanced Notion integration featuring bidirectional sync, webhooks,
 * real-time updates, and comprehensive data transformation.
 */

const { Client } = require('@notionhq/client');
const crypto = require('crypto');
const EventEmitter = require('events');
const logger = require('../../../backend/utils/logger');

class EnhancedNotionAdapter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      apiKey: config.apiKey || process.env.NOTION_API_KEY,
      webhookSecret: config.webhookSecret || process.env.NOTION_WEBHOOK_SECRET,
      defaultDatabaseId: config.defaultDatabaseId || process.env.NOTION_DATABASE_ID,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 1000
      },
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('NOTION_API_KEY is required');
    }

    this.client = new Client({ 
      auth: this.config.apiKey,
      logLevel: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'WARN'
    });

    this.cache = new Map();
    this.webhookHandlers = new Map();
    this.syncQueue = [];
    this.isProcessing = false;

    // Database mappings for different FlexTime entities
    this.databaseMappings = {
      schedules: process.env.NOTION_SCHEDULES_DB_ID,
      teams: process.env.NOTION_TEAMS_DB_ID,
      venues: process.env.NOTION_VENUES_DB_ID,
      contacts: process.env.NOTION_CONTACTS_DB_ID,
      games: process.env.NOTION_GAMES_DB_ID
    };

    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers for data synchronization
   */
  initializeEventHandlers() {
    this.on('database_updated', (data) => {
      this.handleDatabaseUpdate(data);
    });

    this.on('page_created', (data) => {
      this.handlePageCreated(data);
    });

    this.on('page_updated', (data) => {
      this.handlePageUpdated(data);
    });

    this.on('sync_required', (entity, action, data) => {
      this.queueSync(entity, action, data);
    });
  }

  /**
   * Process Notion webhook payload
   */
  async processWebhook(payload, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const data = JSON.parse(payload);
      
      // Process different webhook events
      switch (data.type) {
        case 'page':
          await this.handlePageWebhook(data);
          break;
        case 'database':
          await this.handleDatabaseWebhook(data);
          break;
        case 'block':
          await this.handleBlockWebhook(data);
          break;
        default:
          logger.warn(`Unknown webhook type: ${data.type}`);
      }

      return { success: true, processed: data.type };
    } catch (error) {
      logger.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.config.webhookSecret) {
      logger.warn('Webhook secret not configured, skipping verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle page webhook events
   */
  async handlePageWebhook(data) {
    const { action, page } = data;
    
    switch (action) {
      case 'created':
        this.emit('page_created', page);
        break;
      case 'updated':
        this.emit('page_updated', page);
        break;
      case 'deleted':
        this.emit('page_deleted', page);
        break;
    }
  }

  /**
   * Handle database webhook events
   */
  async handleDatabaseWebhook(data) {
    const { action, database } = data;
    
    switch (action) {
      case 'updated':
        this.emit('database_updated', database);
        break;
    }
  }

  /**
   * Enhanced query with caching and retry logic
   */
  async queryDatabase(databaseId, options = {}) {
    const cacheKey = `query_${databaseId}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.config.cache.enabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cache.ttl) {
        return cached.data;
      }
    }

    try {
      const result = await this.retryOperation(async () => {
        const response = await this.client.databases.query({
          database_id: databaseId,
          ...options
        });
        return response.results;
      });

      // Cache the result
      if (this.config.cache.enabled) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        this.cleanupCache();
      }

      return result;
    } catch (error) {
      logger.error(`Database query failed for ${databaseId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk operations for efficient data syncing
   */
  async bulkCreatePages(databaseId, pages) {
    const results = [];
    const batchSize = 10; // Notion rate limit consideration

    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const batchPromises = batch.map(pageData => 
        this.retryOperation(() => this.client.pages.create({
          parent: { database_id: databaseId },
          properties: pageData
        }))
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Respect rate limits
        if (i + batchSize < pages.length) {
          await this.delay(1000);
        }
      } catch (error) {
        logger.error(`Bulk create batch failed:`, error);
      }
    }

    return results;
  }

  /**
   * Sync FlexTime schedules to Notion
   */
  async syncSchedulesToNotion(schedules, sportType) {
    try {
      const databaseId = this.databaseMappings.schedules;
      if (!databaseId) {
        throw new Error('Schedules database ID not configured');
      }

      logger.info(`Syncing ${schedules.length} ${sportType} schedules to Notion`);

      // Transform schedules to Notion format
      const notionPages = schedules.map(schedule => 
        this.transformScheduleToNotion(schedule)
      );

      // Check for existing schedules to update vs create
      const existingSchedules = await this.queryDatabase(databaseId, {
        filter: {
          property: 'Sport',
          select: { equals: sportType }
        }
      });

      const existingMap = new Map();
      existingSchedules.forEach(page => {
        const gameId = page.properties.GameId?.rich_text?.[0]?.plain_text;
        if (gameId) {
          existingMap.set(gameId, page.id);
        }
      });

      const updates = [];
      const creates = [];

      notionPages.forEach(pageData => {
        const gameId = pageData.GameId?.rich_text?.[0]?.plain_text;
        if (gameId && existingMap.has(gameId)) {
          updates.push({
            pageId: existingMap.get(gameId),
            properties: pageData
          });
        } else {
          creates.push(pageData);
        }
      });

      // Execute updates and creates
      const results = {
        created: 0,
        updated: 0,
        failed: 0
      };

      // Handle updates
      for (const update of updates) {
        try {
          await this.retryOperation(() => 
            this.client.pages.update({
              page_id: update.pageId,
              properties: update.properties
            })
          );
          results.updated++;
        } catch (error) {
          logger.error(`Failed to update schedule page:`, error);
          results.failed++;
        }
      }

      // Handle creates
      const createResults = await this.bulkCreatePages(databaseId, creates);
      createResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.created++;
        } else {
          results.failed++;
        }
      });

      logger.info(`Schedule sync complete: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);
      return results;

    } catch (error) {
      logger.error('Schedule sync to Notion failed:', error);
      throw error;
    }
  }

  /**
   * Transform FlexTime schedule to Notion properties
   */
  transformScheduleToNotion(schedule) {
    return {
      'Game Title': {
        title: [{
          type: 'text',
          text: { content: `${schedule.homeTeam} vs ${schedule.awayTeam}` }
        }]
      },
      'Game ID': {
        rich_text: [{
          type: 'text',
          text: { content: schedule.id || schedule.gameId || '' }
        }]
      },
      'Date & Time': {
        date: {
          start: schedule.dateTime || schedule.date,
          time_zone: schedule.timezone || 'America/Chicago'
        }
      },
      'Home Team': {
        select: { name: schedule.homeTeam }
      },
      'Away Team': {
        select: { name: schedule.awayTeam }
      },
      'Sport': {
        select: { name: schedule.sport }
      },
      'Venue': {
        rich_text: [{
          type: 'text',
          text: { content: schedule.venue || schedule.location || '' }
        }]
      },
      'Conference Game': {
        checkbox: schedule.isConferenceGame || false
      },
      'TV Broadcast': {
        select: schedule.tvNetwork ? { name: schedule.tvNetwork } : null
      },
      'Status': {
        select: { name: schedule.status || 'Scheduled' }
      },
      'Week': {
        number: schedule.week || null
      },
      'Travel Distance': {
        number: schedule.travelDistance || null
      },
      'Estimated Attendance': {
        number: schedule.estimatedAttendance || null
      }
    };
  }

  /**
   * Transform Notion page to FlexTime schedule format
   */
  transformNotionToSchedule(page) {
    const props = page.properties;
    
    return {
      id: props['Game ID']?.rich_text?.[0]?.plain_text,
      homeTeam: props['Home Team']?.select?.name,
      awayTeam: props['Away Team']?.select?.name,
      dateTime: props['Date & Time']?.date?.start,
      timezone: props['Date & Time']?.date?.time_zone,
      sport: props['Sport']?.select?.name,
      venue: props['Venue']?.rich_text?.[0]?.plain_text,
      isConferenceGame: props['Conference Game']?.checkbox,
      tvNetwork: props['TV Broadcast']?.select?.name,
      status: props['Status']?.select?.name,
      week: props['Week']?.number,
      travelDistance: props['Travel Distance']?.number,
      estimatedAttendance: props['Estimated Attendance']?.number,
      lastModified: page.last_edited_time,
      notionPageId: page.id
    };
  }

  /**
   * Bidirectional sync: Get updates from Notion
   */
  async getScheduleUpdatesFromNotion(sportType, since) {
    try {
      const databaseId = this.databaseMappings.schedules;
      if (!databaseId) {
        throw new Error('Schedules database ID not configured');
      }

      const filter = {
        and: [
          {
            property: 'Sport',
            select: { equals: sportType }
          }
        ]
      };

      // Add time filter if provided
      if (since) {
        filter.and.push({
          property: 'Last edited time',
          last_edited_time: { after: since }
        });
      }

      const pages = await this.queryDatabase(databaseId, { filter });
      
      return pages.map(page => this.transformNotionToSchedule(page));
    } catch (error) {
      logger.error('Failed to get schedule updates from Notion:', error);
      throw error;
    }
  }

  /**
   * Real-time sync queue management
   */
  queueSync(entity, action, data) {
    this.syncQueue.push({
      entity,
      action,
      data,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });

    if (!this.isProcessing) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const syncItem = this.syncQueue.shift();
        
        try {
          await this.processSyncItem(syncItem);
          logger.info(`Processed sync item: ${syncItem.entity}:${syncItem.action}`);
        } catch (error) {
          logger.error(`Failed to process sync item:`, error);
          // Could implement retry logic here
        }
        
        // Respect rate limits
        await this.delay(100);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual sync item
   */
  async processSyncItem(syncItem) {
    const { entity, action, data } = syncItem;
    
    switch (entity) {
      case 'schedule':
        if (action === 'create' || action === 'update') {
          await this.syncSchedulesToNotion([data], data.sport);
        }
        break;
      case 'team':
        await this.syncTeamToNotion(data, action);
        break;
      case 'venue':
        await this.syncVenueToNotion(data, action);
        break;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation, maxRetries = this.config.retryConfig.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (error.status === 429 || error.status >= 500) {
          const delay = this.config.retryConfig.retryDelay * 
            Math.pow(this.config.retryConfig.backoffMultiplier, attempt);
          
          logger.warn(`Operation failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error.message);
          await this.delay(delay);
        } else {
          // Non-retryable error
          break;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache cleanup to prevent memory leaks
   */
  cleanupCache() {
    if (this.cache.size > this.config.cache.maxSize) {
      const entries = Array.from(this.cache.entries());
      const toDelete = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.config.cache.maxSize * 0.1));
      
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      cacheSize: this.cache.size,
      handlers: Array.from(this.webhookHandlers.keys())
    };
  }

  /**
   * Close connections and cleanup
   */
  async destroy() {
    this.cache.clear();
    this.syncQueue.length = 0;
    this.removeAllListeners();
  }
}

module.exports = EnhancedNotionAdapter;