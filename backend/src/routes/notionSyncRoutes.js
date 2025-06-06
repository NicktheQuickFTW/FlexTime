/**
 * Notion Sync Routes
 * 
 * This module provides API routes for synchronizing data between Notion and Neon DB.
 */

const express = require('express');
const router = express.Router();
const notionNeonSync = require('../adapters/notion-neon-sync-adapter');
const logger = require('../scripts/logger");

/**
 * @route   GET /api/notion-sync/test-connections
 * @desc    Test connections to Notion and Neon DB
 * @access  Public
 */
router.get('/test-connections', async (req, res) => {
  try {
    const result = await notionNeonSync.testConnections();
    res.json({ success: true, result });
  } catch (error) {
    logger.error(`Error testing connections: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/notion-sync/contacts-to-neon
 * @desc    Sync contacts from Notion to Neon DB
 * @access  Public
 */
router.post('/contacts-to-neon', async (req, res) => {
  try {
    const result = await notionNeonSync.syncContactsToNeonDB();
    res.json({ success: true, result });
  } catch (error) {
    logger.error(`Error syncing contacts to Neon DB: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/notion-sync/schedules-to-notion
 * @desc    Sync schedules from Neon DB to Notion
 * @access  Public
 */
router.post('/schedules-to-notion', async (req, res) => {
  try {
    const { sportType } = req.body;
    const result = await notionNeonSync.syncSchedulesToNotion(sportType);
    res.json({ success: true, result });
  } catch (error) {
    logger.error(`Error syncing schedules to Notion: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/notion-sync/schedule-updates-from-notion
 * @desc    Sync schedule updates from Notion back to Neon DB
 * @access  Public
 */
router.post('/schedule-updates-from-notion', async (req, res) => {
  try {
    const result = await notionNeonSync.syncScheduleUpdatesFromNotion();
    res.json({ success: true, result });
  } catch (error) {
    logger.error(`Error syncing schedule updates from Notion: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/notion-sync/full-sync
 * @desc    Perform a full bidirectional sync between Notion and Neon DB
 * @access  Public
 */
router.post('/full-sync', async (req, res) => {
  try {
    // 1. Sync contacts from Notion to Neon DB
    const contactsResult = await notionNeonSync.syncContactsToNeonDB();
    
    // 2. Sync schedules from Neon DB to Notion
    const schedulesResult = await notionNeonSync.syncSchedulesToNotion(req.body.sportType);
    
    // 3. Sync schedule updates from Notion to Neon DB
    const updatesResult = await notionNeonSync.syncScheduleUpdatesFromNotion();
    
    res.json({ 
      success: true, 
      results: {
        contacts: contactsResult,
        schedules: schedulesResult,
        updates: updatesResult
      }
    });
  } catch (error) {
    logger.error(`Error performing full sync: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;