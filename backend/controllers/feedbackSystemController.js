/**
 * Controller for the Feedback System
 * 
 * Handles API requests related to the feedback system, including
 * submitting feedback, retrieving constraint weights, and triggering
 * periodic analysis.
 */

const { FeedbackSystem } = require('../agents/learning/feedback_system');
const { EnhancedMemoryManager } = require('../agents/memory/enhanced_memory_manager');

// Singleton instance of the feedback system
let feedbackSystemInstance = null;

// Get or create the feedback system instance
const getFeedbackSystem = async () => {
  if (!feedbackSystemInstance) {
    const memoryManager = new EnhancedMemoryManager();
    
    // Try to load previous constraint weights from memory
    let savedWeights = null;
    try {
      const systemMemory = await memoryManager.searchMemories('system', {
        type: 'constraint_weights',
        limit: 1,
        sortBy: 'timestamp',
        sortDirection: 'desc'
      });
      
      if (systemMemory && systemMemory.length > 0) {
        savedWeights = systemMemory[0].weights;
      }
    } catch (error) {
      console.warn('Could not load saved constraint weights:', error.message);
    }
    
    // Create the feedback system with saved weights if available
    feedbackSystemInstance = new FeedbackSystem({
      memoryManager,
      constraintWeights: savedWeights || undefined
    });
  }
  
  return feedbackSystemInstance;
};

/**
 * Submit feedback for a schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitFeedback = async (req, res) => {
  try {
    const { scheduleId, userSatisfaction, constraintViolations, completionRate, resourceUtilization, comments } = req.body;
    
    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: 'scheduleId is required'
      });
    }
    
    // Validate feedback data
    if (typeof userSatisfaction !== 'number' || userSatisfaction < 0 || userSatisfaction > 1) {
      return res.status(400).json({
        success: false,
        message: 'userSatisfaction must be a number between 0 and 1'
      });
    }
    
    // Get schedule data from database
    // This would typically come from your schedule service or database
    const scheduleService = require('../services/scheduleService');
    const scheduleData = await scheduleService.getScheduleById(scheduleId);
    
    if (!scheduleData) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    // Process the feedback
    const feedbackSystem = await getFeedbackSystem();
    const feedbackData = {
      userSatisfaction,
      constraintViolations: constraintViolations || 0,
      completionRate: completionRate || 1.0,
      resourceUtilization: resourceUtilization || 0.5,
      comments: comments || '',
      timestamp: Date.now()
    };
    
    const results = await feedbackSystem.processFeedback(scheduleData, feedbackData);
    
    // Return the results
    return res.status(200).json({
      success: true,
      message: 'Feedback processed successfully',
      reweightingApplied: results.reweightingApplied,
      insights: results.insights
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return res.status(500).json({
      success: false,
      message: `Error processing feedback: ${error.message}`
    });
  }
};

/**
 * Get current constraint weights
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConstraintWeights = async (req, res) => {
  try {
    const feedbackSystem = await getFeedbackSystem();
    const weights = feedbackSystem.getConstraintWeights();
    
    return res.status(200).json({
      success: true,
      weights
    });
  } catch (error) {
    console.error('Error retrieving constraint weights:', error);
    return res.status(500).json({
      success: false,
      message: `Error retrieving constraint weights: ${error.message}`
    });
  }
};

/**
 * Trigger periodic analysis of feedback data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const triggerAnalysis = async (req, res) => {
  try {
    const feedbackSystem = await getFeedbackSystem();
    const results = await feedbackSystem.runPeriodicAnalysis();
    
    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error triggering feedback analysis:', error);
    return res.status(500).json({
      success: false,
      message: `Error triggering feedback analysis: ${error.message}`
    });
  }
};

module.exports = {
  submitFeedback,
  getConstraintWeights,
  triggerAnalysis
};