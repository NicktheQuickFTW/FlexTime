/**
 * Feedback Controller for FlexTime 2.1
 * 
 * This controller handles feedback submission and retrieval for schedules,
 * feeding into the learning system for continuous improvement.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../agents/utils/logger');
const MCPIntegration = require('../agents/mcp_integration');
const { FlexTimeAgentSystem } = require('../agents');

// Initialize MCP integration
const mcpIntegration = new MCPIntegration();

// Initialize agent system
let agentSystem;
try {
  agentSystem = new FlexTimeAgentSystem({
    enableMCP: process.env.ENABLE_MCP === 'true',
    mcpServer: process.env.DEFAULT_MCP_SERVER || 'anthropic'
  });
} catch (error) {
  logger.error(`Failed to initialize agent system: ${error.message}`);
}

/**
 * Submit feedback for a schedule
 * 
 * @route POST /api/feedback/schedule
 * @param {string} scheduleId - ID of the schedule
 * @param {string} sportType - Type of sport (basketball, football, etc.)
 * @param {number} rating - Overall rating (1-5)
 * @param {string} comment - Additional comments
 * @param {object} metrics - Specific metrics ratings
 * @returns {object} Submission result
 */
router.post('/schedule', async (req, res) => {
  try {
    const { scheduleId, sportType, rating, comment, metrics } = req.body;
    
    // Validate required fields
    if (!scheduleId || !sportType || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: scheduleId, sportType, rating'
      });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    // Prepare feedback data
    const feedbackData = {
      scheduleId,
      sportType,
      rating,
      comment,
      metrics,
      userId: req.user?.id || 'anonymous',
      timestamp: new Date()
    };
    
    // Store feedback in learning system
    const result = await mcpIntegration.learningSystem.feedbackLoop.submitFeedback(feedbackData);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit feedback'
      });
    }
    
    // Process feedback immediately if agent system is available
    if (agentSystem) {
      // Queue feedback processing (non-blocking)
      setTimeout(async () => {
        try {
          await agentSystem.processFeedback(feedbackData);
          logger.info(`Processed feedback for schedule ${scheduleId}`);
        } catch (error) {
          logger.error(`Failed to process feedback: ${error.message}`);
        }
      }, 0);
    }
    
    // Return success response
    return res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: result.feedbackId
    });
  } catch (error) {
    logger.error(`Error submitting feedback: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred'
    });
  }
});

/**
 * Get feedback statistics
 * 
 * @route GET /api/feedback/stats
 * @param {string} sportType - Optional sport type filter
 * @returns {object} Feedback statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { sportType } = req.query;
    
    // Get feedback stats from learning system
    const stats = await mcpIntegration.learningSystem.feedbackLoop.getFeedbackStats();
    
    // Filter by sport type if provided
    if (sportType && stats.bySportType) {
      return res.json({
        success: true,
        stats: {
          sportType,
          count: stats.bySportType[sportType] || 0,
          totalFeedback: stats.totalFeedback,
          averageRating: stats.averageRating,
          lastUpdated: stats.lastUpdated
        }
      });
    }
    
    // Return all stats
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`Error getting feedback stats: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred'
    });
  }
});

/**
 * Process feedback cycle
 * 
 * @route POST /api/feedback/process-cycle
 * @returns {object} Processing results
 */
router.post('/process-cycle', async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin privileges required'
      });
    }
    
    // Process feedback cycle
    const result = await mcpIntegration.learningSystem.feedbackLoop.processFeedbackCycle();
    
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error(`Error processing feedback cycle: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred'
    });
  }
});

module.exports = router;
