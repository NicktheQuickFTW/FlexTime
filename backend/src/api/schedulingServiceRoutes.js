/**
 * Advanced Scheduling Service API Routes
 * 
 * This module provides API routes for the Advanced Scheduling Service,
 * replacing the former Intelligence Engine routes.
 */

const express = require('express');
const router = express.Router();
const FTBuilderEngine = require('../../services/FT_Builder_Engine');
const logger = require('../scripts/logger")

// Create service instance
const schedulingService = new FTBuilderEngine();

// Initialize service
(async () => {
  try {
    await schedulingService.initialize();
    logger.info('Advanced Scheduling Service initialized for API routes');
  } catch (error) {
    logger.error(`Failed to initialize Advanced Scheduling Service for API routes: ${error.message}`);
  }
})();

// Status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'active',
    message: 'Advanced Scheduling Service is active',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Recommendations endpoint
router.post('/recommendations', async (req, res) => {
  try {
    const recommendations = await schedulingService.getSchedulingRecommendations(req.body);
    res.json(recommendations);
  } catch (error) {
    logger.error(`Error getting recommendations: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Templates endpoint
router.get('/sports/:sportType/templates', async (req, res) => {
  try {
    const sportType = req.params.sportType;
    const templates = await schedulingService.getSportTemplates(sportType, req.query);
    res.json(templates);
  } catch (error) {
    logger.error(`Error getting sport templates: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Learning insights endpoint
router.get('/learning/insights', async (req, res) => {
  try {
    const insights = await schedulingService.getLearningInsights(req.query);
    res.json(insights);
  } catch (error) {
    logger.error(`Error getting learning insights: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Schedule optimization endpoint
// Schedule conflict detection endpoint
router.get('/schedules/:scheduleId/conflicts', async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    
    // Use schedule service to find the schedule
    const schedule = await req.app.get('db').Schedule.findByPk(scheduleId, {
      include: [{ model: req.app.get('db').Game }]
    });
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    // Find conflicts in the schedule
    const conflicts = [];
    
    // Check for same-day conflicts for teams
    const games = schedule.Games || [];
    const teamGames = {};
    
    games.forEach(game => {
      const homeTeam = game.homeTeamId;
      const awayTeam = game.awayTeamId;
      const gameDate = game.gameDate;
      
      // Track games by team and date
      if (!teamGames[homeTeam]) teamGames[homeTeam] = {};
      if (!teamGames[awayTeam]) teamGames[awayTeam] = {};
      
      if (!teamGames[homeTeam][gameDate]) teamGames[homeTeam][gameDate] = [];
      if (!teamGames[awayTeam][gameDate]) teamGames[awayTeam][gameDate] = [];
      
      teamGames[homeTeam][gameDate].push(game);
      teamGames[awayTeam][gameDate].push(game);
    });
    
    // Find teams with multiple games on the same day
    Object.keys(teamGames).forEach(teamId => {
      Object.keys(teamGames[teamId]).forEach(date => {
        if (teamGames[teamId][date].length > 1) {
          conflicts.push({
            id: `conflict-team-${teamId}-${date}`,
            type: 'team',
            description: `Team ${teamId} has multiple games scheduled on ${date}`,
            severity: 'high',
            affectedItems: teamGames[teamId][date].map(g => g.id)
          });
        }
      });
    });
    
    // Return conflicts
    res.json(conflicts);
  } catch (error) {
    logger.error(`Error detecting conflicts: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get resolution options for a conflict
router.get('/schedules/:scheduleId/conflicts/:conflictId/resolutions', async (req, res) => {
  try {
    const { scheduleId, conflictId } = req.params;
    
    // Use schedule service to find the schedule
    const schedule = await req.app.get('db').Schedule.findByPk(scheduleId, {
      include: [{ model: req.app.get('db').Game }]
    });
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    // Parse the conflict type and affected items from the conflict ID
    const conflictParts = conflictId.split('-');
    const conflictType = conflictParts[1];
    const teamId = conflictParts[2];
    const date = conflictParts[3];
    
    // Generate resolution options based on conflict type
    let resolutionOptions = [];
    
    if (conflictType === 'team') {
      // Find affected games
      const games = schedule.Games.filter(g => 
        (g.homeTeamId === teamId || g.awayTeamId === teamId) && 
        g.gameDate === date
      );
      
      // Generate options to move each game by a day
      games.forEach((game, index) => {
        // Option 1: Move game to the next day
        resolutionOptions.push({
          id: `resolution-${conflictId}-move-next-${index}`,
          description: `Move game ${game.id} to the next day`,
          confidence: 85,
          changes: [{
            itemId: game.id,
            field: 'gameDate',
            oldValue: game.gameDate,
            newValue: new Date(new Date(game.gameDate).getTime() + 86400000).toISOString().split('T')[0]
          }]
        });
        
        // Option 2: Move game to the previous day
        resolutionOptions.push({
          id: `resolution-${conflictId}-move-prev-${index}`,
          description: `Move game ${game.id} to the previous day`,
          confidence: 80,
          changes: [{
            itemId: game.id,
            field: 'gameDate',
            oldValue: game.gameDate,
            newValue: new Date(new Date(game.gameDate).getTime() - 86400000).toISOString().split('T')[0]
          }]
        });
      });
    }
    
    res.json(resolutionOptions);
  } catch (error) {
    logger.error(`Error getting resolution options: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply a resolution to a conflict
router.post('/schedules/:scheduleId/conflicts/:conflictId/apply', async (req, res) => {
  try {
    const { scheduleId, conflictId } = req.params;
    const { resolutionId } = req.body;
    
    if (!resolutionId) {
      return res.status(400).json({
        success: false,
        error: 'resolutionId is required'
      });
    }
    
    // Use schedule service to find the schedule
    const schedule = await req.app.get('db').Schedule.findByPk(scheduleId, {
      include: [{ model: req.app.get('db').Game }]
    });
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    // Parse the resolution ID to get the changes to apply
    const resolutionParts = resolutionId.split('-');
    const gameIndex = parseInt(resolutionParts[resolutionParts.length - 1]);
    const moveDirection = resolutionParts[resolutionParts.length - 2];
    
    // Parse the conflict ID to get the affected team and date
    const conflictParts = conflictId.split('-');
    const teamId = conflictParts[2];
    const date = conflictParts[3];
    
    // Find affected games
    const games = schedule.Games.filter(g => 
      (g.homeTeamId === teamId || g.awayTeamId === teamId) && 
      g.gameDate === date
    );
    
    if (gameIndex >= games.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game index in resolution'
      });
    }
    
    // Get the game to modify
    const gameToModify = games[gameIndex];
    
    // Calculate the new date
    let newDate;
    if (moveDirection === 'next') {
      newDate = new Date(new Date(gameToModify.gameDate).getTime() + 86400000).toISOString().split('T')[0];
    } else if (moveDirection === 'prev') {
      newDate = new Date(new Date(gameToModify.gameDate).getTime() - 86400000).toISOString().split('T')[0];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid move direction in resolution'
      });
    }
    
    // Update the game date
    await req.app.get('db').Game.update(
      { gameDate: newDate },
      { where: { id: gameToModify.id } }
    );
    
    // Get the updated schedule
    const updatedSchedule = await req.app.get('db').Schedule.findByPk(scheduleId, {
      include: [{ model: req.app.get('db').Game }]
    });
    
    res.json(updatedSchedule);
  } catch (error) {
    logger.error(`Error applying resolution: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/optimize', async (req, res) => {
  try {
    const { schedule, constraints, options } = req.body;
    
    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'Schedule is required'
      });
    }
    
    const optimizedSchedule = await schedulingService.optimizeSchedule(
      schedule,
      constraints || [],
      options || {}
    );
    
    res.json({
      success: true,
      schedule: optimizedSchedule
    });
  } catch (error) {
    logger.error(`Error optimizing schedule: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Feedback endpoint
router.post('/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    
    if (!feedback.scheduleId) {
      return res.status(400).json({
        success: false,
        error: 'scheduleId is required'
      });
    }
    
    const feedbackId = await schedulingService.storeFeedback(feedback);
    
    res.json({
      success: true,
      id: feedbackId
    });
  } catch (error) {
    logger.error(`Error storing feedback: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Schedule data storage endpoint
router.post('/store', async (req, res) => {
  try {
    const { schedule, metadata } = req.body;
    
    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'Schedule is required'
      });
    }
    
    const scheduleId = await schedulingService.storeScheduleData(schedule, metadata || {});
    
    res.json({
      success: true,
      id: scheduleId
    });
  } catch (error) {
    logger.error(`Error storing schedule data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Constraints endpoints
router.get('/constraints', async (req, res) => {
  try {
    const { sport } = req.query;
    const constraints = await schedulingService.getConstraints(sport);
    
    res.json({
      success: true,
      constraints: constraints
    });
  } catch (error) {
    logger.error(`Error getting constraints: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/constraints/:sport', async (req, res) => {
  try {
    const sport = req.params.sport;
    const constraints = await schedulingService.getConstraints(sport);
    
    res.json({
      success: true,
      sport: sport,
      constraints: constraints
    });
  } catch (error) {
    logger.error(`Error getting constraints for ${req.params.sport}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Teams endpoints
router.get('/teams', async (req, res) => {
  try {
    const { conference, sport } = req.query;
    const teams = await schedulingService.getTeams(conference, sport);
    
    res.json({
      success: true,
      teams: teams,
      count: teams.length
    });
  } catch (error) {
    logger.error(`Error getting teams: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/teams/:conference', async (req, res) => {
  try {
    const conference = req.params.conference;
    const { sport } = req.query;
    const teams = await schedulingService.getTeams(conference, sport);
    
    res.json({
      success: true,
      conference: conference,
      teams: teams,
      count: teams.length
    });
  } catch (error) {
    logger.error(`Error getting teams for ${req.params.conference}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Schools endpoints
router.get('/schools', async (req, res) => {
  try {
    const { conference } = req.query;
    const schools = await schedulingService.getSchools(conference);
    
    res.json({
      success: true,
      schools: schools,
      count: schools.length
    });
  } catch (error) {
    logger.error(`Error getting schools: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Shutdown handler for cleanup
process.on('SIGTERM', async () => {
  try {
    await schedulingService.shutdown();
    logger.info('Advanced Scheduling Service shut down gracefully');
  } catch (error) {
    logger.error(`Error shutting down Advanced Scheduling Service: ${error.message}`);
  }
});

module.exports = router;