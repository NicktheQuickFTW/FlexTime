/**
 * Visualization Routes for FlexTime
 * 
 * API routes for accessing schedule visualization functionality
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/visualizations/:scheduleId
 * @desc    Generate visualizations for a schedule
 * @access  Public
 */
router.get('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { metrics } = req.query;
    
    // Get visualization generator
    const visualizationGenerator = req.app.get('visualizationGenerator');
    if (!visualizationGenerator) {
      return res.status(500).json({ 
        error: 'Visualization generator not available' 
      });
    }
    
    // Get schedule from database
    const schedule = await req.app.get('db').Schedule.findByPk(scheduleId, {
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
    
    // Parse metrics parameter if provided
    let metricsToGenerate = null;
    if (metrics) {
      metricsToGenerate = metrics.split(',');
    }
    
    // Generate visualizations
    const visualizationData = visualizationGenerator.generateVisualizations(
      schedule, 
      metricsToGenerate
    );
    
    // Return visualization data
    res.json({
      success: true,
      scheduleId,
      visualizations: visualizationData
    });
  } catch (error) {
    console.error('Error generating visualizations:', error);
    res.status(500).json({ 
      error: 'Failed to generate visualizations',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/visualizations/types
 * @desc    Get available visualization types
 * @access  Public
 */
router.get('/types', (req, res) => {
  try {
    // Get visualization generator
    const visualizationGenerator = req.app.get('visualizationGenerator');
    if (!visualizationGenerator) {
      return res.status(500).json({ 
        error: 'Visualization generator not available' 
      });
    }
    
    // Return available visualization types
    res.json({
      success: true,
      types: [
        'teamBalance',
        'travelDistance',
        'constraintSatisfaction',
        'gameDensity',
        'weekdayDistribution',
        'homeAwayPattern',
        'rivalryGames',
        'divisionGames'
      ]
    });
  } catch (error) {
    console.error('Error getting visualization types:', error);
    res.status(500).json({ 
      error: 'Failed to get visualization types',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/visualizations/analyze
 * @desc    Run enhanced schedule analysis with visualizations
 * @access  Public
 */
router.post('/analyze', async (req, res) => {
  try {
    const { scheduleId, options } = req.body;
    
    if (!scheduleId) {
      return res.status(400).json({ error: 'Schedule ID is required' });
    }
    
    // Get agent system
    const agentSystem = req.app.get('agentSystem');
    if (!agentSystem) {
      return res.status(500).json({ error: 'Agent system not available' });
    }
    
    // Get enhanced analysis agent
    const analysisAgent = agentSystem.getAgent('enhanced_analysis');
    if (!analysisAgent) {
      return res.status(500).json({ error: 'Enhanced analysis agent not available' });
    }
    
    // Get schedule from database
    const schedule = await req.app.get('db').Schedule.findByPk(scheduleId, {
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
    
    // Create task for analysis agent
    const task = {
      taskId: `analyze_${scheduleId}_${Date.now()}`,
      taskType: 'analyze_schedule',
      description: `Analyze schedule ${scheduleId}`,
      parameters: {
        schedule,
        options: options || {}
      }
    };
    
    // Process task with analysis agent
    const analysis = await analysisAgent._processTask(task);
    
    // Return analysis results
    res.json({
      success: true,
      scheduleId,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing schedule:', error);
    res.status(500).json({ 
      error: 'Failed to analyze schedule',
      details: error.message
    });
  }
});

module.exports = router;