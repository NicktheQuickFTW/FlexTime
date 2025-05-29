/**
 * Feedback System Routes
 * 
 * API routes for the feedback system functionality
 */

const express = require('express');
const router = express.Router();
const feedbackSystemController = require('../../controllers/feedbackSystemController');

/**
 * @route   POST /api/feedback/submit
 * @desc    Submit feedback for a schedule
 * @access  Public
 */
router.post('/submit', feedbackSystemController.submitFeedback);

/**
 * @route   GET /api/feedback/weights
 * @desc    Get current constraint weights
 * @access  Public
 */
router.get('/weights', feedbackSystemController.getConstraintWeights);

/**
 * @route   POST /api/feedback/analyze
 * @desc    Trigger periodic analysis of feedback data
 * @access  Private (should be protected in production)
 */
router.post('/analyze', feedbackSystemController.triggerAnalysis);

module.exports = router;