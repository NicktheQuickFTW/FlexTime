/**
 * FlexTime Scheduling System - Schedule Routes
 * 
 * API routes for schedule management.
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const Big12DataService = require('../services/big12DataService');

// Get all schedules
router.get('/schedules', scheduleController.getSchedules);

// Get a specific schedule by ID
router.get('/schedules/:id', scheduleController.getScheduleById);

// Create a new schedule
router.post('/schedules', scheduleController.createSchedule);

// Update an existing schedule
router.put('/schedules/:id', scheduleController.updateSchedule);

// Delete a schedule
router.delete('/schedules/:id', scheduleController.deleteSchedule);

// Optimize a schedule
router.post('/schedules/:id/optimize', scheduleController.optimizeSchedule);

// Analyze a schedule
router.get('/schedules/:id/analyze', scheduleController.analyzeSchedule);

// Get games for a schedule
router.get('/schedules/:id/games', scheduleController.getScheduleGames);

// Get constraint violations/conflicts for a schedule
router.get('/schedules/:id/conflicts', scheduleController.getScheduleConflicts);

// ========================================
// BIG 12 DATA ENDPOINTS
// ========================================

// Get teams with optional filters
router.get('/teams', async (req, res) => {
  try {
    const teams = Big12DataService.getTeams(req.query);
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific team by ID
router.get('/teams/:id', async (req, res) => {
  try {
    const team = Big12DataService.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get venues with optional filters
router.get('/venues', async (req, res) => {
  try {
    const venues = Big12DataService.getVenues(req.query);
    res.json({
      success: true,
      count: venues.length,
      data: venues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all sports
router.get('/sports', async (req, res) => {
  try {
    const sports = Big12DataService.getSports();
    res.json({
      success: true,
      data: sports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all schools with optional filters
router.get('/schools', async (req, res) => {
  try {
    const schools = Big12DataService.getSchools(req.query);
    res.json({
      success: true,
      data: schools
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get COMPASS ratings for a team
router.get('/teams/:id/compass', async (req, res) => {
  try {
    const rating = Big12DataService.getCompassRating(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'COMPASS rating not found for this team'
      });
    }
    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// SCHEDULE IMPORT ENDPOINTS
// ========================================

const ScheduleImporter = require('../services/scheduleImporter');
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Import a schedule from file
router.post('/schedules/import', upload.single('schedule'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { format = 'big12-matrix', sport_id, year } = req.body;
    
    if (!sport_id) {
      return res.status(400).json({
        success: false,
        error: 'sport_id is required'
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    
    const result = await ScheduleImporter.importSchedule(fileContent, format, {
      sport_id: parseInt(sport_id),
      year: year ? parseInt(year) : new Date().getFullYear()
    });

    // Option to save to database
    if (req.body.save_to_db === 'true') {
      // TODO: Save games to database
      // const schedule = await scheduleController.saveImportedSchedule(result);
      // result.schedule_id = schedule.id;
    }

    res.json({
      success: true,
      message: `Successfully imported ${result.games_count} games`,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Preview import without saving
router.post('/schedules/import/preview', upload.single('schedule'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { format = 'big12-matrix', sport_id, year } = req.body;
    const fileContent = req.file.buffer.toString('utf-8');
    
    // Only parse first 10 games for preview
    const result = await ScheduleImporter.importSchedule(fileContent, format, {
      sport_id: parseInt(sport_id),
      year: year ? parseInt(year) : new Date().getFullYear(),
      preview: true
    });

    res.json({
      success: true,
      preview: true,
      sample_games: result.games.slice(0, 10),
      total_games: result.games_count,
      season: result.season
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
