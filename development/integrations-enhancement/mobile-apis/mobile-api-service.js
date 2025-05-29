/**
 * FlexTime Mobile API Service
 * 
 * Mobile-optimized API endpoints with offline capabilities,
 * push notifications, and efficient data synchronization.
 */

const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../backend/utils/logger');

class MobileAPIService {
  constructor(config = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      syncInterval: config.syncInterval || 300000, // 5 minutes
      offlineTTL: config.offlineTTL || 86400000, // 24 hours
      compressionLevel: config.compressionLevel || 6,
      enablePushNotifications: config.enablePushNotifications !== false,
      pushNotificationKey: config.pushNotificationKey || process.env.PUSH_NOTIFICATION_KEY,
      enableOfflineSync: config.enableOfflineSync !== false,
      maxSyncBatchSize: config.maxSyncBatchSize || 100,
      ...config
    };

    this.redisClient = null;
    this.syncQueues = new Map(); // userId -> sync queue
    this.offlineData = new Map(); // userId -> offline data cache
    this.pushSubscriptions = new Map(); // userId -> push subscription
    
    this.initialize();
  }

  /**
   * Initialize mobile API service
   */
  async initialize() {
    try {
      // Initialize Redis connection
      this.redisClient = redis.createClient({ url: this.config.redisUrl });
      await this.redisClient.connect();

      // Start sync process
      if (this.config.enableOfflineSync) {
        this.startSyncProcess();
      }

      logger.info('Mobile API service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize mobile API service:', error);
      throw error;
    }
  }

  /**
   * Create mobile-optimized response
   */
  createMobileResponse(data, options = {}) {
    const {
      compress = true,
      includeMetadata = true,
      pagination = null,
      version = 'v1'
    } = options;

    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      version
    };

    if (includeMetadata) {
      response.metadata = {
        compressed: compress,
        size: JSON.stringify(data).length,
        count: Array.isArray(data) ? data.length : 1
      };
    }

    if (pagination) {
      response.pagination = pagination;
    }

    return response;
  }

  /**
   * Get lightweight schedule data for mobile
   */
  async getMobileSchedules(userId, options = {}) {
    try {
      const {
        sport,
        team,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        includeDetails = false
      } = options;

      // Check offline cache first
      const cacheKey = `mobile_schedules_${userId}_${JSON.stringify(options)}`;
      
      if (this.config.enableOfflineSync) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return this.createMobileResponse(cached, { 
            compress: true,
            includeMetadata: false 
          });
        }
      }

      // Fetch from main database (mock implementation)
      const schedules = await this.fetchSchedulesFromDB(options);
      
      // Transform for mobile consumption
      const mobileSchedules = schedules.map(schedule => ({
        id: schedule.id,
        homeTeam: schedule.homeTeam,
        awayTeam: schedule.awayTeam,
        sport: schedule.sport,
        date: schedule.dateTime.split('T')[0], // Date only
        time: schedule.dateTime.split('T')[1]?.substring(0, 5), // HH:MM format
        venue: schedule.venue,
        isConference: schedule.isConferenceGame,
        status: schedule.status || 'scheduled',
        ...(includeDetails && {
          tv: schedule.tvNetwork,
          week: schedule.week,
          tickets: schedule.ticketUrl,
          weather: schedule.weather
        })
      }));

      // Cache for offline access
      if (this.config.enableOfflineSync) {
        await this.saveToCache(cacheKey, mobileSchedules);
      }

      const response = this.createMobileResponse(mobileSchedules, {
        pagination: {
          limit,
          offset,
          total: mobileSchedules.length,
          hasMore: mobileSchedules.length >= limit
        }
      });

      return response;
      
    } catch (error) {
      logger.error('Failed to get mobile schedules:', error);
      throw error;
    }
  }

  /**
   * Get mobile team information
   */
  async getMobileTeams(userId, options = {}) {
    try {
      const { sport, conference = 'Big 12' } = options;
      
      const cacheKey = `mobile_teams_${conference}_${sport || 'all'}`;
      
      if (this.config.enableOfflineSync) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return this.createMobileResponse(cached);
        }
      }

      // Fetch teams (mock implementation)
      const teams = await this.fetchTeamsFromDB({ sport, conference });
      
      // Transform for mobile
      const mobileTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        colors: team.colors,
        conference: team.conference,
        location: team.location,
        timezone: team.timezone,
        record: team.record || null,
        ranking: team.ranking || null
      }));

      await this.saveToCache(cacheKey, mobileTeams);
      
      return this.createMobileResponse(mobileTeams);
      
    } catch (error) {
      logger.error('Failed to get mobile teams:', error);
      throw error;
    }
  }

  /**
   * Sync offline data for user
   */
  async syncOfflineData(userId, clientData = {}) {
    try {
      const syncId = uuidv4();
      
      logger.info(`Starting offline sync for user ${userId} (${syncId})`);
      
      const syncResult = {
        syncId,
        timestamp: new Date().toISOString(),
        userId,
        changes: {
          schedules: [],
          teams: [],
          venues: [],
          favorites: []
        },
        conflicts: [],
        status: 'completed'
      };

      // Get user's last sync timestamp
      const lastSync = await this.getLastSyncTime(userId);
      
      // Get updates since last sync
      const updates = await this.getUpdatesSinceSync(userId, lastSync);
      
      // Process each type of update
      for (const [dataType, items] of Object.entries(updates)) {
        for (const item of items) {
          // Check for conflicts with client data
          const conflict = this.checkSyncConflict(item, clientData[dataType]);
          
          if (conflict) {
            syncResult.conflicts.push(conflict);
          } else {
            syncResult.changes[dataType].push(item);
          }
        }
      }

      // Save sync result
      await this.saveSyncResult(userId, syncResult);
      
      // Update last sync time
      await this.updateLastSyncTime(userId);
      
      logger.info(`Offline sync completed for user ${userId}: ${Object.values(syncResult.changes).flat().length} items`);
      
      return syncResult;
      
    } catch (error) {
      logger.error(`Offline sync failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Register device for push notifications
   */
  async registerPushNotification(userId, subscription) {
    try {
      if (!this.config.enablePushNotifications) {
        throw new Error('Push notifications not enabled');
      }

      const {
        endpoint,
        keys,
        deviceId,
        platform,
        preferences = {}
      } = subscription;

      const pushSubscription = {
        userId,
        endpoint,
        keys,
        deviceId,
        platform,
        preferences: {
          scheduleUpdates: true,
          gameReminders: true,
          breakingNews: false,
          ...preferences
        },
        registeredAt: new Date().toISOString(),
        active: true
      };

      // Store subscription
      this.pushSubscriptions.set(userId, pushSubscription);
      await this.redisClient.hSet('push_subscriptions', userId, JSON.stringify(pushSubscription));
      
      logger.info(`Push notification registered for user ${userId} on ${platform}`);
      
      return {
        success: true,
        subscriptionId: userId,
        preferences: pushSubscription.preferences
      };
      
    } catch (error) {
      logger.error(`Push notification registration failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId, notification) {
    try {
      if (!this.config.enablePushNotifications) {
        return { success: false, reason: 'Push notifications disabled' };
      }

      const subscription = this.pushSubscriptions.get(userId) || 
        JSON.parse(await this.redisClient.hGet('push_subscriptions', userId) || '{}');

      if (!subscription.endpoint) {
        return { success: false, reason: 'No push subscription found' };
      }

      // Check user preferences
      const { type } = notification;
      if (!this.shouldSendNotification(subscription.preferences, type)) {
        return { success: false, reason: 'Notification blocked by user preferences' };
      }

      // Format notification for mobile
      const mobileNotification = {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/flextime-icon-192.png',
        badge: notification.badge || '/icons/flextime-badge.png',
        data: notification.data || {},
        timestamp: new Date().toISOString(),
        tag: notification.tag || type
      };

      // Send notification (mock implementation - would use actual push service)
      const result = await this.deliverPushNotification(subscription, mobileNotification);
      
      logger.info(`Push notification sent to user ${userId}: ${notification.title}`);
      
      return { success: true, result };
      
    } catch (error) {
      logger.error(`Push notification delivery failed for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user preferences for mobile app
   */
  async getMobilePreferences(userId) {
    try {
      const cacheKey = `mobile_prefs_${userId}`;
      
      let preferences = await this.getFromCache(cacheKey);
      
      if (!preferences) {
        // Default mobile preferences
        preferences = {
          notifications: {
            scheduleUpdates: true,
            gameReminders: true,
            scores: true,
            breakingNews: false
          },
          display: {
            theme: 'auto',
            timeFormat: '12h',
            dateFormat: 'MM/DD/YYYY',
            timezone: 'auto'
          },
          sync: {
            autoSync: true,
            wifiOnly: false,
            syncInterval: 300000 // 5 minutes
          },
          favorites: {
            teams: [],
            sports: [],
            venues: []
          }
        };
        
        await this.saveToCache(cacheKey, preferences);
      }
      
      return this.createMobileResponse(preferences);
      
    } catch (error) {
      logger.error(`Failed to get mobile preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateMobilePreferences(userId, updates) {
    try {
      const current = await this.getMobilePreferences(userId);
      const updated = this.mergePreferences(current.data, updates);
      
      const cacheKey = `mobile_prefs_${userId}`;
      await this.saveToCache(cacheKey, updated);
      
      logger.info(`Mobile preferences updated for user ${userId}`);
      
      return this.createMobileResponse(updated);
      
    } catch (error) {
      logger.error(`Failed to update mobile preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get offline data summary
   */
  async getOfflineDataSummary(userId) {
    try {
      const summary = {
        lastSync: await this.getLastSyncTime(userId),
        cacheSize: 0,
        dataTypes: {},
        expires: new Date(Date.now() + this.config.offlineTTL).toISOString()
      };

      // Get cache statistics
      const cacheKeys = await this.redisClient.keys(`*${userId}*`);
      summary.cacheSize = cacheKeys.length;

      // Count data by type
      for (const key of cacheKeys) {
        const type = key.split('_')[1] || 'unknown';
        summary.dataTypes[type] = (summary.dataTypes[type] || 0) + 1;
      }

      return this.createMobileResponse(summary);
      
    } catch (error) {
      logger.error(`Failed to get offline data summary for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mock database fetch functions
   */
  async fetchSchedulesFromDB(options) {
    // Mock implementation - replace with actual database calls
    return [
      {
        id: 'schedule-1',
        homeTeam: 'Kansas',
        awayTeam: 'Kansas State',
        sport: 'Football',
        dateTime: '2024-12-07T19:00:00Z',
        venue: 'Memorial Stadium',
        isConferenceGame: true,
        status: 'scheduled',
        tvNetwork: 'ESPN',
        week: 14
      },
      {
        id: 'schedule-2',
        homeTeam: 'Oklahoma State',
        awayTeam: 'TCU',
        sport: 'Basketball',
        dateTime: '2024-12-10T20:00:00Z',
        venue: 'Gallagher-Iba Arena',
        isConferenceGame: true,
        status: 'scheduled'
      }
    ];
  }

  async fetchTeamsFromDB(options) {
    // Mock implementation
    return Object.values(require('../big12-apis/big12-data-service').prototype.initializeTeams());
  }

  /**
   * Utility functions
   */
  async getFromCache(key) {
    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache read error:', error);
      return null;
    }
  }

  async saveToCache(key, data) {
    try {
      await this.redisClient.setEx(key, Math.floor(this.config.offlineTTL / 1000), JSON.stringify(data));
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  async getLastSyncTime(userId) {
    return await this.redisClient.get(`last_sync_${userId}`) || '1970-01-01T00:00:00Z';
  }

  async updateLastSyncTime(userId) {
    await this.redisClient.set(`last_sync_${userId}`, new Date().toISOString());
  }

  async getUpdatesSinceSync(userId, lastSync) {
    // Mock implementation - would query database for changes since lastSync
    return {
      schedules: [],
      teams: [],
      venues: [],
      favorites: []
    };
  }

  checkSyncConflict(serverItem, clientItems) {
    // Mock implementation - would check for data conflicts
    return null;
  }

  async saveSyncResult(userId, result) {
    await this.redisClient.setEx(`sync_result_${userId}`, 3600, JSON.stringify(result));
  }

  shouldSendNotification(preferences, type) {
    const mapping = {
      'schedule_update': 'scheduleUpdates',
      'game_reminder': 'gameReminders',
      'score_update': 'scores',
      'breaking_news': 'breakingNews'
    };
    
    return preferences[mapping[type]] !== false;
  }

  async deliverPushNotification(subscription, notification) {
    // Mock implementation - would use actual push service (FCM, APNS, etc.)
    logger.info('Push notification delivered:', notification.title);
    return { delivered: true, timestamp: new Date().toISOString() };
  }

  mergePreferences(current, updates) {
    // Deep merge preferences
    const merged = { ...current };
    
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  startSyncProcess() {
    setInterval(async () => {
      try {
        // Process pending sync operations
        logger.debug('Processing sync operations...');
      } catch (error) {
        logger.error('Sync process error:', error);
      }
    }, this.config.syncInterval);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      syncQueues: this.syncQueues.size,
      offlineData: this.offlineData.size,
      pushSubscriptions: this.pushSubscriptions.size,
      config: {
        syncInterval: this.config.syncInterval,
        offlineTTL: this.config.offlineTTL,
        enablePushNotifications: this.config.enablePushNotifications,
        enableOfflineSync: this.config.enableOfflineSync
      }
    };
  }

  /**
   * Shutdown service
   */
  async shutdown() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      
      logger.info('Mobile API service shutdown complete');
      
    } catch (error) {
      logger.error('Error during mobile API service shutdown:', error);
    }
  }
}

module.exports = MobileAPIService;