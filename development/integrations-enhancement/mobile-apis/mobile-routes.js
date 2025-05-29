/**
 * Mobile API Routes
 * 
 * Express routes optimized for mobile applications with
 * offline capabilities and push notifications.
 */

const express = require('express');
const router = express.Router();
const compression = require('compression');
const MobileAPIService = require('./mobile-api-service');
const logger = require('../../../backend/utils/logger');

// Initialize mobile API service
const mobileService = new MobileAPIService();

// Apply compression for mobile responses
router.use(compression({ level: 6 }));

/**
 * @route   GET /api/mobile/schedules
 * @desc    Get mobile-optimized schedules
 * @access  Public
 */
router.get('/schedules', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const {
      sport,
      team,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      includeDetails = false
    } = req.query;

    const options = {
      sport,
      team,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeDetails: includeDetails === 'true'
    };

    const result = await mobileService.getMobileSchedules(userId, options);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Mobile schedules request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/mobile/teams
 * @desc    Get mobile-optimized team information
 * @access  Public
 */
router.get('/teams', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { sport, conference } = req.query;

    const result = await mobileService.getMobileTeams(userId, { sport, conference });
    
    res.json(result);
    
  } catch (error) {
    logger.error('Mobile teams request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/mobile/sync
 * @desc    Synchronize offline data
 * @access  Public
 */
router.post('/sync', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required in x-user-id header'
      });
    }

    const clientData = req.body.data || {};
    
    const syncResult = await mobileService.syncOfflineData(userId, clientData);
    
    res.json({
      success: true,
      sync: syncResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Mobile sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/mobile/push/register
 * @desc    Register device for push notifications
 * @access  Public
 */
router.post('/push/register', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required in x-user-id header'
      });
    }

    const subscription = req.body;
    
    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        error: 'Push subscription endpoint and keys are required'
      });
    }

    const result = await mobileService.registerPushNotification(userId, subscription);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Push notification registration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/mobile/push/send
 * @desc    Send push notification to user
 * @access  Public
 */
router.post('/push/send', async (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    if (!userId || !notification) {
      return res.status(400).json({
        success: false,
        error: 'userId and notification object are required'
      });
    }

    if (!notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        error: 'Notification title and body are required'
      });
    }

    const result = await mobileService.sendPushNotification(userId, notification);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Push notification send failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mobile/preferences
 * @desc    Get user mobile preferences
 * @access  Public
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required in x-user-id header'
      });
    }

    const result = await mobileService.getMobilePreferences(userId);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Get mobile preferences failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/mobile/preferences
 * @desc    Update user mobile preferences
 * @access  Public
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required in x-user-id header'
      });
    }

    const updates = req.body;
    
    const result = await mobileService.updateMobilePreferences(userId, updates);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Update mobile preferences failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mobile/offline/summary
 * @desc    Get offline data summary
 * @access  Public
 */
router.get('/offline/summary', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required in x-user-id header'
      });
    }

    const result = await mobileService.getOfflineDataSummary(userId);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Get offline summary failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mobile/status
 * @desc    Get mobile API service status
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const stats = mobileService.getStats();
    
    res.json({
      success: true,
      status: 'active',
      stats,
      endpoints: {
        schedules: '/api/mobile/schedules',
        teams: '/api/mobile/teams',
        sync: '/api/mobile/sync',
        pushRegister: '/api/mobile/push/register',
        pushSend: '/api/mobile/push/send',
        preferences: '/api/mobile/preferences',
        offlineSummary: '/api/mobile/offline/summary'
      },
      features: {
        offlineSync: true,
        pushNotifications: true,
        compression: true,
        caching: true
      }
    });
    
  } catch (error) {
    logger.error('Mobile status request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/mobile/test/notification
 * @desc    Send test push notification
 * @access  Public
 */
router.post('/test/notification', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required in x-user-id header'
      });
    }

    const testNotification = {
      title: 'FlexTime Test Notification',
      body: 'This is a test push notification from FlexTime Mobile API',
      type: 'test',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const result = await mobileService.sendPushNotification(userId, testNotification);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Test notification failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/mobile/health
 * @desc    Mobile API health check
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FlexTime Mobile API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      compression: true,
      offlineSync: true,
      pushNotifications: true
    }
  });
});

module.exports = router;