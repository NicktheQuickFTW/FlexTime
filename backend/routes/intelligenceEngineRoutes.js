/**
 * Intelligence Engine API Routes
 * 
 * This module provides API endpoints for interacting with the HELiiX Intelligence Engine
 * from the FlexTime scheduling service.
 */

const express = require('express');
const router = express.Router();
const IntelligenceEngineClient = require('../agents/intelligence_engine_client');
const intelligenceEngineConfig = require('../config/intelligence_engine_config');
const { FlexTimeAgentSystem } = require('../agents');
const logger = require('../utils/logger');

// Initialize Intelligence Engine client
const intelligenceEngine = new IntelligenceEngineClient(intelligenceEngineConfig);

/**
 * @route   GET /api/intelligence-engine/status
 * @desc    Get Intelligence Engine status
 * @access  Private
 */
router.get('/status', async (req, res) => {
  try {
    const status = await intelligenceEngine.getStatus();
    res.json(status);
  } catch (error) {
    logger.error(`Failed to get Intelligence Engine status: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Intelligence Engine status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence-engine/experiences
 * @desc    Get experiences from Intelligence Engine
 * @access  Private
 */
router.get('/experiences', async (req, res) => {
  try {
    const { type, agentId, tags, limit = 10 } = req.query;
    
    const queryParams = {};
    if (type) queryParams.type = type;
    if (agentId) queryParams.agentId = agentId;
    if (tags) queryParams.tags = tags.split(',');
    
    const experiences = await intelligenceEngine.retrieveExperiences({
      ...queryParams,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: experiences.length,
      experiences
    });
  } catch (error) {
    logger.error(`Failed to retrieve experiences: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve experiences',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/intelligence-engine/experiences
 * @desc    Store an experience in Intelligence Engine
 * @access  Private
 */
router.post('/experiences', async (req, res) => {
  try {
    const { agentId, type, content, tags } = req.body;
    
    if (!agentId || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, type, and content are required'
      });
    }
    
    const result = await intelligenceEngine.storeExperience({
      agentId,
      type,
      content,
      tags: tags || []
    });
    
    res.json({
      success: true,
      experienceId: result.experienceId
    });
  } catch (error) {
    logger.error(`Failed to store experience: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to store experience',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/intelligence-engine/feedback
 * @desc    Submit feedback to Intelligence Engine
 * @access  Private
 */
router.post('/feedback', async (req, res) => {
  try {
    const { scheduleId, sportType, rating, comment, metrics } = req.body;
    
    if (!scheduleId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: scheduleId and rating are required'
      });
    }
    
    // Get agent system instance
    const agentSystem = new FlexTimeAgentSystem();
    
    // Submit feedback through agent system
    const result = await agentSystem.feedbackSystem.submitFeedback({
      agentId: 'scheduling_director',
      scheduleId,
      sportType,
      rating,
      comment,
      metrics
    });
    
    res.json(result);
  } catch (error) {
    logger.error(`Failed to submit feedback: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit feedback',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence-engine/recommendations
 * @desc    Get scheduling recommendations from Intelligence Engine
 * @access  Private
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { sportType, teamCount, conferenceId, phase } = req.query;
    
    if (!sportType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sportType is required'
      });
    }
    
    const recommendations = await intelligenceEngine.getSchedulingRecommendations({
      sportType,
      teamCount: teamCount ? parseInt(teamCount) : undefined,
      conferenceId,
      phase
    });
    
    res.json(recommendations);
  } catch (error) {
    logger.error(`Failed to get recommendations: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence-engine/insights
 * @desc    Get insights from Intelligence Engine
 * @access  Private
 */
router.get('/insights', async (req, res) => {
  try {
    const { sportType, conferenceId, type = 'scheduling' } = req.query;
    
    if (!sportType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sportType is required'
      });
    }
    
    const insights = await intelligenceEngine.getInsights({
      sportType,
      conferenceId,
      type
    });
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    logger.error(`Failed to get insights: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get insights',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/intelligence-engine/learning/advanced
 * @desc    Get advanced learning recommendations
 * @access  Private
 */
router.post('/learning/advanced', async (req, res) => {
  try {
    const { sportType, parameters } = req.body;
    
    if (!sportType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sportType is required'
      });
    }
    
    const recommendations = await intelligenceEngine.getAdvancedLearningRecommendations({
      sportType,
      ...parameters
    });
    
    res.json(recommendations);
  } catch (error) {
    logger.error(`Failed to get advanced learning recommendations: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get advanced learning recommendations',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence-engine/sports/:sportType/templates
 * @desc    Get sport-specific scheduling templates
 * @access  Private
 */
router.get('/sports/:sportType/templates', async (req, res) => {
  try {
    const { sportType } = req.params;
    const options = req.query;
    
    const templates = await intelligenceEngine.getSportTemplates(sportType, options);
    
    res.json(templates);
  } catch (error) {
    logger.error(`Failed to get sport templates: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get sport templates',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/intelligence-engine/scheduling/multi-sport
 * @desc    Get multi-sport scheduling recommendations
 * @access  Private
 */
router.post('/scheduling/multi-sport', async (req, res) => {
  try {
    const { sports } = req.body;
    
    if (!sports || !Array.isArray(sports) || sports.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid sports parameter: must be a non-empty array'
      });
    }
    
    const recommendations = await intelligenceEngine.getMultiSportRecommendations(sports);
    
    res.json(recommendations);
  } catch (error) {
    logger.error(`Failed to get multi-sport recommendations: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get multi-sport recommendations',
      message: error.message
    });
  }
});

module.exports = router;
