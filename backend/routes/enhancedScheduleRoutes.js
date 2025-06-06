/**
 * Enhanced Schedule Routes
 * 
 * Comprehensive API routes for FlexTime scheduling system including
 * data access endpoints for teams, venues, schools, and sports.
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const Big12DataService = require('../services/big12DataService');
const SimpleSchedulingService = require('../services/simpleSchedulingService');
const logger = require('../lib/logger');

// ===========================
// DATA ACCESS ENDPOINTS
// ===========================

/**
 * GET /api/teams
 * Get all teams with optional filtering
 * Query params: sport_id, school_id, conference_status
 */
router.get('/teams', (req, res) => {
  try {
    const teams = Big12DataService.getTeams(req.query);
    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    logger.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve teams'
    });
  }
});

/**
 * GET /api/teams/:id
 * Get a specific team by ID
 */
router.get('/teams/:id', (req, res) => {
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
      team
    });
  } catch (error) {
    logger.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve team'
    });
  }
});

/**
 * GET /api/venues
 * Get all venues with optional filtering
 * Query params: school_id, venue_type, sport_id
 */
router.get('/venues', (req, res) => {
  try {
    const venues = Big12DataService.getVenues(req.query);
    res.json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    logger.error('Error fetching venues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve venues'
    });
  }
});

/**
 * GET /api/schools
 * Get all schools
 * Query params: conference_status (all, full_member, affiliate)
 */
router.get('/schools', (req, res) => {
  try {
    const schools = Big12DataService.getSchools(req.query);
    res.json({
      success: true,
      count: Object.keys(schools).length,
      schools
    });
  } catch (error) {
    logger.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve schools'
    });
  }
});

/**
 * GET /api/schools/:id
 * Get a specific school by ID
 */
router.get('/schools/:id', (req, res) => {
  try {
    const school = Big12DataService.getSchoolById(req.params.id);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }
    res.json({
      success: true,
      school
    });
  } catch (error) {
    logger.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve school'
    });
  }
});

/**
 * GET /api/sports
 * Get all sports
 */
router.get('/sports', (req, res) => {
  try {
    const sports = Big12DataService.getSports();
    res.json({
      success: true,
      count: Object.keys(sports).length,
      sports
    });
  } catch (error) {
    logger.error('Error fetching sports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sports'
    });
  }
});

/**
 * GET /api/sports/:id
 * Get a specific sport by ID
 */
router.get('/sports/:id', (req, res) => {
  try {
    const sport = Big12DataService.getSportById(req.params.id);
    if (!sport) {
      return res.status(404).json({
        success: false,
        error: 'Sport not found'
      });
    }
    res.json({
      success: true,
      sport
    });
  } catch (error) {
    logger.error('Error fetching sport:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sport'
    });
  }
});

/**
 * GET /api/venue-types
 * Get all venue types
 */
router.get('/venue-types', (req, res) => {
  try {
    const venueTypes = Big12DataService.getVenueTypes();
    res.json({
      success: true,
      count: Object.keys(venueTypes).length,
      venueTypes
    });
  } catch (error) {
    logger.error('Error fetching venue types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve venue types'
    });
  }
});

/**
 * GET /api/compass-ratings
 * Get all COMPASS ratings
 */
router.get('/compass-ratings', (req, res) => {
  try {
    const ratings = Big12DataService.getAllCompassRatings();
    res.json({
      success: true,
      count: Object.keys(ratings).length,
      ratings
    });
  } catch (error) {
    logger.error('Error fetching COMPASS ratings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve COMPASS ratings'
    });
  }
});

/**
 * GET /api/compass-ratings/:teamId
 * Get COMPASS rating for a specific team
 */
router.get('/compass-ratings/:teamId', (req, res) => {
  try {
    const rating = Big12DataService.getCompassRating(req.params.teamId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'COMPASS rating not found for this team'
      });
    }
    res.json({
      success: true,
      team_id: req.params.teamId,
      rating
    });
  } catch (error) {
    logger.error('Error fetching COMPASS rating:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve COMPASS rating'
    });
  }
});

// ===========================
// SCHEDULING ENDPOINTS
// ===========================

/**
 * POST /api/schedules/generate
 * Generate a new schedule using SimpleSchedulingService
 */
router.post('/schedules/generate', async (req, res) => {
  try {
    const schedule = await SimpleSchedulingService.generateSchedule(req.body);
    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    logger.error('Error generating schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate schedule'
    });
  }
});

/**
 * POST /api/schedules/validate-teams
 * Validate team IDs before scheduling
 */
router.post('/schedules/validate-teams', (req, res) => {
  try {
    const { team_ids } = req.body;
    if (!team_ids || !Array.isArray(team_ids)) {
      return res.status(400).json({
        success: false,
        error: 'team_ids array is required'
      });
    }
    
    const validation = Big12DataService.validateTeamIds(team_ids);
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Error validating teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate teams'
    });
  }
});

/**
 * GET /api/schedules/team-id/:schoolId/:sportId
 * Calculate team ID from school and sport IDs
 */
router.get('/schedules/team-id/:schoolId/:sportId', (req, res) => {
  try {
    const { schoolId, sportId } = req.params;
    const teamId = Big12DataService.calculateTeamId(
      parseInt(schoolId), 
      parseInt(sportId)
    );
    
    res.json({
      success: true,
      school_id: parseInt(schoolId),
      sport_id: parseInt(sportId),
      team_id: teamId
    });
  } catch (error) {
    logger.error('Error calculating team ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate team ID'
    });
  }
});

// ===========================
// EXISTING SCHEDULE ENDPOINTS
// ===========================

// Get all schedules
router.get('/schedules', scheduleController.getSchedules);

// Get a specific schedule by ID
router.get('/schedules/:id', scheduleController.getScheduleById);

// Create a new schedule (legacy endpoint - use /generate instead)
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

module.exports = router;