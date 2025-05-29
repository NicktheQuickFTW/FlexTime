/**
 * Big 12 Conference API Routes
 * 
 * Express routes for Big 12 Conference data feeds, TV schedules,
 * academic calendars, and compliance checking.
 */

const express = require('express');
const router = express.Router();
const Big12DataService = require('./big12-data-service');
const logger = require('../../../backend/utils/logger');

// Initialize Big 12 data service
const big12Service = new Big12DataService();

/**
 * @route   GET /api/big12/teams
 * @desc    Get all Big 12 teams
 * @access  Public
 */
router.get('/teams', (req, res) => {
  try {
    const teams = big12Service.getAllTeams();
    
    res.json({
      success: true,
      count: Object.keys(teams).length,
      teams
    });
  } catch (error) {
    logger.error('Failed to get Big 12 teams:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/teams/:teamName
 * @desc    Get specific Big 12 team information
 * @access  Public
 */
router.get('/teams/:teamName', (req, res) => {
  try {
    const { teamName } = req.params;
    const team = big12Service.getTeamInfo(teamName);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({
      success: true,
      team
    });
  } catch (error) {
    logger.error(`Failed to get team ${req.params.teamName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/sports
 * @desc    Get all Big 12 sports
 * @access  Public
 */
router.get('/sports', (req, res) => {
  try {
    const sports = big12Service.getAllSports();
    
    res.json({
      success: true,
      count: Object.keys(sports).length,
      sports
    });
  } catch (error) {
    logger.error('Failed to get Big 12 sports:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/sports/:sportName
 * @desc    Get specific sport information
 * @access  Public
 */
router.get('/sports/:sportName', (req, res) => {
  try {
    const { sportName } = req.params;
    const sport = big12Service.getSportInfo(sportName);
    
    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }
    
    res.json({
      success: true,
      sport
    });
  } catch (error) {
    logger.error(`Failed to get sport ${req.params.sportName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/standings/:sport
 * @desc    Get conference standings for a sport
 * @access  Public
 */
router.get('/standings/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { season } = req.query;
    
    const standings = await big12Service.getConferenceStandings(sport, season);
    
    res.json({
      success: true,
      standings
    });
  } catch (error) {
    logger.error(`Failed to get ${req.params.sport} standings:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/tv-schedule/:sport
 * @desc    Get TV broadcast schedule for a sport
 * @access  Public
 */
router.get('/tv-schedule/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { startDate, endDate } = req.query;
    
    let dateRange = null;
    if (startDate || endDate) {
      dateRange = { start: startDate, end: endDate };
    }
    
    const tvSchedule = await big12Service.getTVSchedule(sport, dateRange);
    
    res.json({
      success: true,
      sport,
      dateRange,
      schedule: tvSchedule
    });
  } catch (error) {
    logger.error(`Failed to get TV schedule for ${req.params.sport}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/tv-schedule
 * @desc    Get TV broadcast schedule for all sports
 * @access  Public
 */
router.get('/tv-schedule', async (req, res) => {
  try {
    const { startDate, endDate, network } = req.query;
    
    let dateRange = null;
    if (startDate || endDate) {
      dateRange = { start: startDate, end: endDate };
    }
    
    const sports = ['Football', 'Men\'s Basketball', 'Women\'s Basketball', 'Baseball', 'Softball'];
    const allSchedules = {};
    
    for (const sport of sports) {
      try {
        let schedule = await big12Service.getTVSchedule(sport, dateRange);
        
        // Filter by network if specified
        if (network) {
          schedule = schedule.filter(game => 
            game.network.toLowerCase().includes(network.toLowerCase())
          );
        }
        
        allSchedules[sport] = schedule;
      } catch (error) {
        logger.error(`Failed to get TV schedule for ${sport}:`, error);
        allSchedules[sport] = [];
      }
    }
    
    res.json({
      success: true,
      dateRange,
      network: network || 'all',
      schedules: allSchedules
    });
  } catch (error) {
    logger.error('Failed to get complete TV schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/academic-calendar
 * @desc    Get Big 12 academic calendar
 * @access  Public
 */
router.get('/academic-calendar', async (req, res) => {
  try {
    const { institution, academicYear } = req.query;
    
    const calendar = await big12Service.getAcademicCalendar(institution, academicYear);
    
    res.json({
      success: true,
      institution: institution || 'all',
      calendar
    });
  } catch (error) {
    logger.error('Failed to get academic calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/big12/compliance/check
 * @desc    Check schedule compliance with Big 12 rules
 * @access  Public
 */
router.post('/compliance/check', async (req, res) => {
  try {
    const { sport, schedule } = req.body;
    
    if (!sport || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ 
        error: 'Sport and schedule array are required' 
      });
    }
    
    const complianceResult = await big12Service.checkComplianceRequirements(sport, schedule);
    
    res.json({
      success: true,
      sport,
      scheduleCount: schedule.length,
      compliance: complianceResult
    });
  } catch (error) {
    logger.error('Compliance check failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/compliance/rules/:sport
 * @desc    Get compliance rules for a specific sport
 * @access  Public
 */
router.get('/compliance/rules/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    
    const rules = await big12Service.getComplianceRules(sport);
    
    res.json({
      success: true,
      sport,
      rules
    });
  } catch (error) {
    logger.error(`Failed to get compliance rules for ${req.params.sport}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/venues
 * @desc    Get Big 12 venue information
 * @access  Public
 */
router.get('/venues', (req, res) => {
  try {
    const { sport, team } = req.query;
    let venues = big12Service.venues;
    
    // Filter by sport if specified
    if (sport) {
      venues = Object.entries(venues)
        .filter(([_, venue]) => venue.sport.includes(sport))
        .reduce((acc, [name, venue]) => ({ ...acc, [name]: venue }), {});
    }
    
    // Filter by team if specified
    if (team) {
      venues = Object.entries(venues)
        .filter(([_, venue]) => venue.team === team)
        .reduce((acc, [name, venue]) => ({ ...acc, [name]: venue }), {});
    }
    
    res.json({
      success: true,
      filters: { sport, team },
      count: Object.keys(venues).length,
      venues
    });
  } catch (error) {
    logger.error('Failed to get venues:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/venues/:venueName
 * @desc    Get specific venue information
 * @access  Public
 */
router.get('/venues/:venueName', (req, res) => {
  try {
    const { venueName } = req.params;
    const venue = big12Service.getVenueInfo(venueName);
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json({
      success: true,
      venue
    });
  } catch (error) {
    logger.error(`Failed to get venue ${req.params.venueName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/big12/tv-optimization
 * @desc    Optimize schedule for TV broadcast opportunities
 * @access  Public
 */
router.post('/tv-optimization', async (req, res) => {
  try {
    const { sport, schedule, preferences = {} } = req.body;
    
    if (!sport || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ 
        error: 'Sport and schedule array are required' 
      });
    }
    
    // Get TV schedule data
    const tvSchedule = await big12Service.getTVSchedule(sport);
    
    // Analyze TV opportunities
    const optimization = {
      originalSchedule: schedule,
      tvOpportunities: [],
      recommendations: [],
      conflicts: []
    };
    
    schedule.forEach(game => {
      const gameDate = new Date(game.dateTime);
      const dayOfWeek = gameDate.getDay();
      
      // Check for prime TV slots
      const isPrimeTime = gameDate.getHours() >= 19; // 7 PM or later
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      const isFriday = dayOfWeek === 5;
      
      let tvScore = 0;
      const factors = [];
      
      if (isPrimeTime) {
        tvScore += 3;
        factors.push('Prime time slot');
      }
      
      if (isWeekend || isFriday) {
        tvScore += 2;
        factors.push('Weekend/Friday slot');
      }
      
      if (game.isConferenceGame) {
        tvScore += 2;
        factors.push('Conference game');
      }
      
      // Check team popularity (simplified)
      const popularTeams = ['Kansas', 'Kansas State', 'Oklahoma State', 'TCU'];
      if (popularTeams.includes(game.homeTeam) || popularTeams.includes(game.awayTeam)) {
        tvScore += 1;
        factors.push('Popular team matchup');
      }
      
      optimization.tvOpportunities.push({
        game,
        tvScore,
        factors,
        recommendation: tvScore >= 5 ? 'High TV potential' : 
                      tvScore >= 3 ? 'Moderate TV potential' : 'Low TV potential'
      });
    });
    
    // Sort by TV score
    optimization.tvOpportunities.sort((a, b) => b.tvScore - a.tvScore);
    
    // Generate recommendations
    optimization.recommendations = [
      'Move high-scoring games to weekend prime time slots',
      'Avoid scheduling against major competing events',
      'Consider regional TV preferences for team selections',
      'Balance home/away exposure for TV opportunities'
    ];
    
    res.json({
      success: true,
      sport,
      optimization
    });
    
  } catch (error) {
    logger.error('TV optimization failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/big12/cache
 * @desc    Clear Big 12 data cache
 * @access  Public
 */
router.delete('/cache', (req, res) => {
  try {
    big12Service.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/big12/stats
 * @desc    Get Big 12 service statistics
 * @access  Public
 */
router.get('/stats', (req, res) => {
  try {
    const stats = big12Service.getStats();
    
    res.json({
      success: true,
      stats,
      endpoints: {
        teams: '/api/big12/teams',
        sports: '/api/big12/sports',
        standings: '/api/big12/standings/:sport',
        tvSchedule: '/api/big12/tv-schedule/:sport',
        academicCalendar: '/api/big12/academic-calendar',
        compliance: '/api/big12/compliance/check',
        venues: '/api/big12/venues',
        tvOptimization: '/api/big12/tv-optimization'
      }
    });
  } catch (error) {
    logger.error('Failed to get stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;