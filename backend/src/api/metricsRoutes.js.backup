/**
 * Advanced Metrics Routes for FlexTime
 * 
 * API routes for accessing the advanced metrics system
 */

const express = require('express');
const router = express.Router();
const AdvancedMetricsSystem = require('../utils/advanced_metrics_system');

// Create advanced metrics system
const advancedMetricsSystem = new AdvancedMetricsSystem();

/**
 * @route   GET /api/metrics/advanced/:scheduleId
 * @desc    Get advanced metrics for a schedule
 * @access  Public
 */
router.get('/advanced/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { includeBaseMetrics, includePredictive } = req.query;
    
    // Get schedule from database
    const schedule = await req.app.get('db').Schedule.findByPk(id, {
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ]
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        }
      ]
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Analyze with advanced metrics
    const options = {
      includeBaseMetrics: includeBaseMetrics === 'true',
      includePredictive: includePredictive === 'true'
    };
    
    const metrics = advancedMetricsSystem.analyzeSchedule(schedule, options);
    
    // Filter out base metrics if not requested
    if (options.includeBaseMetrics !== true) {
      delete metrics.baseMetrics;
    }
    
    // Filter out predictive outcomes if not requested
    if (options.includePredictive !== true) {
      delete metrics.predictiveOutcomes;
    }
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error getting advanced metrics:', error);
    res.status(500).json({ 
      error: 'Failed to get advanced metrics',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/metrics/comparison/:scheduleId1/:scheduleId2
 * @desc    Compare advanced metrics for two schedules
 * @access  Public
 */
router.get('/comparison/:id1/:id2', async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    
    // Get schedules from database
    const getSchedule = async (id) => {
      return req.app.get('db').Schedule.findByPk(id, {
        include: [
          { model: req.app.get('db').Sport, as: 'sport' },
          { 
            model: req.app.get('db').Team, 
            as: 'teams',
            include: [
              { model: req.app.get('db').Institution, as: 'institution' },
              { model: req.app.get('db').Venue, as: 'primaryVenue' }
            ]
          },
          { 
            model: req.app.get('db').Game, 
            as: 'games',
            include: [
              { model: req.app.get('db').Team, as: 'homeTeam' },
              { model: req.app.get('db').Team, as: 'awayTeam' },
              { model: req.app.get('db').Venue, as: 'venue' }
            ]
          }
        ]
      });
    };
    
    const [schedule1, schedule2] = await Promise.all([
      getSchedule(id1),
      getSchedule(id2)
    ]);
    
    if (!schedule1) {
      return res.status(404).json({ error: `Schedule ${id1} not found` });
    }
    
    if (!schedule2) {
      return res.status(404).json({ error: `Schedule ${id2} not found` });
    }
    
    // Analyze both schedules
    const [metrics1, metrics2] = await Promise.all([
      advancedMetricsSystem.analyzeSchedule(schedule1),
      advancedMetricsSystem.analyzeSchedule(schedule2)
    ]);
    
    // Generate comparison
    const comparison = generateComparison(metrics1, metrics2);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Error comparing schedules:', error);
    res.status(500).json({ 
      error: 'Failed to compare schedules',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/metrics/recommendations/:scheduleId
 * @desc    Get recommendations for improving a schedule
 * @access  Public
 */
router.post('/recommendations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { focusAreas = [], limitCount = 10 } = req.body;
    
    // Get schedule from database
    const schedule = await req.app.get('db').Schedule.findByPk(id, {
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ]
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        }
      ]
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Analyze with advanced metrics
    const metrics = advancedMetricsSystem.analyzeSchedule(schedule);
    
    // Filter recommendations by focus areas if provided
    let recommendations = metrics.recommendations;
    
    if (focusAreas.length > 0) {
      recommendations = recommendations.filter(rec => 
        focusAreas.includes(rec.area)
      );
    }
    
    // Limit recommendations if requested
    if (limitCount > 0 && recommendations.length > limitCount) {
      recommendations = recommendations.slice(0, limitCount);
    }
    
    res.json({
      success: true,
      scheduleId: id,
      scheduleName: schedule.name,
      recommendations,
      compositeScores: metrics.compositeScores
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/metrics/focus-areas
 * @desc    Get available focus areas for recommendations
 * @access  Public
 */
router.get('/focus-areas', (req, res) => {
  try {
    // Return available focus areas
    const focusAreas = [
      { id: 'general', name: 'General Improvements' },
      { id: 'fan experience', name: 'Fan Experience' },
      { id: 'player wellbeing', name: 'Player Well-being' },
      { id: 'financial', name: 'Financial Optimization' },
      { id: 'media exposure', name: 'Media Exposure' },
      { id: 'competitive balance', name: 'Competitive Balance' },
      { id: 'program development', name: 'Program Development' },
      { id: 'overall success', name: 'Overall Success Potential' }
    ];
    
    res.json({
      success: true,
      focusAreas
    });
  } catch (error) {
    console.error('Error getting focus areas:', error);
    res.status(500).json({ 
      error: 'Failed to get focus areas',
      details: error.message
    });
  }
});

/**
 * Generate comparison between two schedules
 * @param {Object} metrics1 - Metrics for first schedule
 * @param {Object} metrics2 - Metrics for second schedule
 * @returns {Object} Schedule comparison
 */
function generateComparison(metrics1, metrics2) {
  // Compare composite scores
  const compositeScoreDifferences = {};
  
  for (const [key, value1] of Object.entries(metrics1.compositeScores)) {
    if (typeof value1 === 'object' && value1.score && metrics2.compositeScores[key]) {
      const value2 = metrics2.compositeScores[key];
      
      compositeScoreDifferences[key] = {
        schedule1: value1.score,
        schedule2: value2.score,
        difference: value1.score - value2.score,
        percentDifference: ((value1.score - value2.score) / value2.score * 100).toFixed(1) + '%'
      };
    }
  }
  
  // Determine strengths of each schedule
  const strengths = {
    schedule1: [],
    schedule2: []
  };
  
  for (const [key, diff] of Object.entries(compositeScoreDifferences)) {
    if (diff.difference > 5) {
      strengths.schedule1.push(key);
    } else if (diff.difference < -5) {
      strengths.schedule2.push(key);
    }
  }
  
  // Generate overall assessment
  const overall = {
    schedule1: {
      id: metrics1.scheduleId,
      name: metrics1.scheduleName,
      overallScore: metrics1.compositeScores.overallSuccessPotential.score,
      category: metrics1.compositeScores.overallSuccessPotential.category
    },
    schedule2: {
      id: metrics2.scheduleId,
      name: metrics2.scheduleName,
      overallScore: metrics2.compositeScores.overallSuccessPotential.score,
      category: metrics2.compositeScores.overallSuccessPotential.category
    },
    difference: metrics1.compositeScores.overallSuccessPotential.score - 
               metrics2.compositeScores.overallSuccessPotential.score
  };
  
  // Return comparison
  return {
    overall,
    compositeScoreDifferences,
    strengths,
    recommendations: {
      schedule1: metrics1.recommendations.slice(0, 5),
      schedule2: metrics2.recommendations.slice(0, 5)
    }
  };
}

module.exports = router;