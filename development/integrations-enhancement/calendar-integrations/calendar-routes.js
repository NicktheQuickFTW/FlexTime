/**
 * Calendar Integration Routes
 * 
 * Express routes for calendar system integrations (Google, Outlook, iCal)
 */

const express = require('express');
const router = express.Router();
const CalendarIntegrationService = require('./calendar-service');
const logger = require('../../../backend/utils/logger');

// Initialize calendar service
const calendarService = new CalendarIntegrationService();

/**
 * @route   GET /api/calendars/auth/:provider
 * @desc    Get authentication URL for calendar provider
 * @access  Public
 */
router.get('/auth/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const { userId, state } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const authUrl = calendarService.getAuthUrl(provider, userId, state);
    
    res.json({
      success: true,
      provider,
      authUrl,
      userId
    });
    
  } catch (error) {
    logger.error('Calendar auth URL generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/calendars/auth/:provider/callback
 * @desc    Handle OAuth callback and exchange code for tokens
 * @access  Public
 */
router.post('/auth/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, userId, state } = req.body;
    
    if (!code || !userId) {
      return res.status(400).json({ error: 'Code and user ID are required' });
    }
    
    const result = await calendarService.exchangeCodeForTokens(provider, code, userId);
    
    logger.info(`Calendar authentication successful for ${provider} user ${userId}`);
    res.json({ success: true, result });
    
  } catch (error) {
    logger.error('Calendar authentication failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/calendars/:provider/:userId/calendars
 * @desc    Get user's available calendars
 * @access  Public
 */
router.get('/:provider/:userId/calendars', async (req, res) => {
  try {
    const { provider, userId } = req.params;
    
    const calendars = await calendarService.getUserCalendars(provider, userId);
    
    res.json({
      success: true,
      provider,
      userId,
      calendars
    });
    
  } catch (error) {
    logger.error('Failed to get user calendars:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/calendars/:provider/:userId/sync
 * @desc    Sync FlexTime schedules to external calendar
 * @access  Public
 */
router.post('/:provider/:userId/sync', async (req, res) => {
  try {
    const { provider, userId } = req.params;
    const { schedules, calendarId, sport } = req.body;
    
    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Schedules array is required' });
    }
    
    // If sport is specified, get schedules from the database
    let schedulesToSync = schedules;
    if (sport && !schedules.length) {
      const scheduleService = require('../../../backend/services/scheduleService');
      schedulesToSync = await scheduleService.getSchedulesBySport(sport);
    }
    
    const result = await calendarService.syncScheduleToCalendar(
      provider, 
      userId, 
      schedulesToSync, 
      calendarId || 'primary'
    );
    
    logger.info(`Calendar sync completed for ${provider} user ${userId}:`, result);
    res.json({ success: true, result });
    
  } catch (error) {
    logger.error('Calendar sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/calendars/:provider/:userId/sync/sport/:sport
 * @desc    Sync specific sport schedules to calendar
 * @access  Public
 */
router.post('/:provider/:userId/sync/sport/:sport', async (req, res) => {
  try {
    const { provider, userId, sport } = req.params;
    const { calendarId, teamFilter } = req.body;
    
    // Get schedules for the specific sport
    const scheduleService = require('../../../backend/services/scheduleService');
    let schedules = await scheduleService.getSchedulesBySport(sport);
    
    // Apply team filter if specified
    if (teamFilter && teamFilter.length > 0) {
      schedules = schedules.filter(schedule => 
        teamFilter.includes(schedule.homeTeam) || teamFilter.includes(schedule.awayTeam)
      );
    }
    
    const result = await calendarService.syncScheduleToCalendar(
      provider, 
      userId, 
      schedules, 
      calendarId || 'primary'
    );
    
    logger.info(`${sport} schedule sync completed:`, result);
    res.json({ 
      success: true, 
      sport,
      scheduleCount: schedules.length,
      result 
    });
    
  } catch (error) {
    logger.error(`${sport} calendar sync failed:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/calendars/export/ical/:sport
 * @desc    Export sport schedule as iCal file
 * @access  Public
 */
router.get('/export/ical/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { teamFilter, startDate, endDate } = req.query;
    
    // Get schedules for the sport
    const scheduleService = require('../../../backend/services/scheduleService');
    let schedules = await scheduleService.getSchedulesBySport(sport);
    
    // Apply filters
    if (teamFilter) {
      const teams = teamFilter.split(',');
      schedules = schedules.filter(schedule => 
        teams.includes(schedule.homeTeam) || teams.includes(schedule.awayTeam)
      );
    }
    
    if (startDate) {
      schedules = schedules.filter(schedule => 
        new Date(schedule.dateTime) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      schedules = schedules.filter(schedule => 
        new Date(schedule.dateTime) <= new Date(endDate)
      );
    }
    
    // Generate iCal
    const calendarName = `${sport} Schedule - FlexTime`;
    const icalContent = calendarService.generateICalendar(schedules, calendarName);
    
    // Set appropriate headers for file download
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${sport.replace(/\s+/g, '_')}_schedule.ics"`
    });
    
    res.send(icalContent);
    
  } catch (error) {
    logger.error('iCal export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/calendars/export/ical/all
 * @desc    Export all schedules as iCal file
 * @access  Public
 */
router.get('/export/ical/all', async (req, res) => {
  try {
    const { teamFilter, startDate, endDate } = req.query;
    
    // Get all schedules
    const scheduleService = require('../../../backend/services/scheduleService');
    let schedules = await scheduleService.getAllSchedules();
    
    // Apply filters
    if (teamFilter) {
      const teams = teamFilter.split(',');
      schedules = schedules.filter(schedule => 
        teams.includes(schedule.homeTeam) || teams.includes(schedule.awayTeam)
      );
    }
    
    if (startDate) {
      schedules = schedules.filter(schedule => 
        new Date(schedule.dateTime) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      schedules = schedules.filter(schedule => 
        new Date(schedule.dateTime) <= new Date(endDate)
      );
    }
    
    // Generate iCal
    const icalContent = calendarService.generateICalendar(schedules, 'FlexTime Complete Schedule');
    
    // Set appropriate headers for file download
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="flextime_complete_schedule.ics"'
    });
    
    res.send(icalContent);
    
  } catch (error) {
    logger.error('Complete iCal export failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/calendars/:provider/:userId/disconnect
 * @desc    Disconnect user from calendar provider
 * @access  Public
 */
router.delete('/:provider/:userId/disconnect', async (req, res) => {
  try {
    const { provider, userId } = req.params;
    
    const result = await calendarService.disconnectUser(provider, userId);
    
    logger.info(`User ${userId} disconnected from ${provider}`);
    res.json({ success: true, result });
    
  } catch (error) {
    logger.error('Calendar disconnection failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/calendars/status
 * @desc    Get calendar service status and statistics
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const status = calendarService.getStatus();
    
    res.json({
      success: true,
      status,
      endpoints: {
        auth: '/api/calendars/auth/:provider',
        callback: '/api/calendars/auth/:provider/callback',
        calendars: '/api/calendars/:provider/:userId/calendars',
        sync: '/api/calendars/:provider/:userId/sync',
        sportSync: '/api/calendars/:provider/:userId/sync/sport/:sport',
        icalExport: '/api/calendars/export/ical/:sport',
        allIcalExport: '/api/calendars/export/ical/all',
        disconnect: '/api/calendars/:provider/:userId/disconnect'
      }
    });
    
  } catch (error) {
    logger.error('Failed to get calendar status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/calendars/test/sync
 * @desc    Test calendar sync with sample data
 * @access  Public
 */
router.post('/test/sync', async (req, res) => {
  try {
    const { provider, userId, calendarId } = req.body;
    
    if (!provider || !userId) {
      return res.status(400).json({ error: 'Provider and userId are required' });
    }
    
    // Create test schedule data
    const testSchedules = [
      {
        id: 'test-1',
        homeTeam: 'Kansas',
        awayTeam: 'Kansas State',
        sport: 'Football',
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        venue: 'Memorial Stadium',
        isConferenceGame: true,
        tvNetwork: 'ESPN',
        duration: 180
      },
      {
        id: 'test-2',
        homeTeam: 'Oklahoma State',
        awayTeam: 'Texas Tech',
        sport: 'Basketball',
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        venue: 'Gallagher-Iba Arena',
        isConferenceGame: true,
        duration: 120
      }
    ];
    
    const result = await calendarService.syncScheduleToCalendar(
      provider, 
      userId, 
      testSchedules, 
      calendarId || 'primary'
    );
    
    res.json({ 
      success: true, 
      message: 'Test sync completed',
      testSchedules: testSchedules.length,
      result 
    });
    
  } catch (error) {
    logger.error('Test calendar sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;