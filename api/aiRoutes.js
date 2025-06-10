/**
 * AI-Enhanced API Routes for FlexTime
 * 
 * Provides AI-powered endpoints for schedule optimization,
 * conflict resolution, and natural language processing
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const AIService = require('../ai/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize AI service
const aiService = new AIService({
  defaultProvider: process.env.AI_PROVIDER || 'openai',
  model: process.env.AI_MODEL || 'gpt-4',
  temperature: 0.3 // Deterministic for scheduling
});

/**
 * Middleware to validate requests
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * POST /api/ai/analyze-conflicts
 * Analyze schedule conflicts and get AI-powered resolution suggestions
 */
router.post('/analyze-conflicts',
  [
    body('schedule').isObject().withMessage('Schedule object required'),
    body('conflicts').isArray().withMessage('Conflicts array required'),
    body('schedule.sport').notEmpty().withMessage('Sport type required'),
    body('schedule.games').optional().isArray()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { schedule, conflicts } = req.body;

      logger.info('AI conflict analysis requested', {
        sport: schedule.sport,
        conflictCount: conflicts.length,
        gameCount: schedule.games?.length || 0
      });

      const analysis = await aiService.analyzeConflicts(schedule, conflicts);

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('AI conflict analysis endpoint failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/ai/optimize-schedule
 * Get AI-powered schedule optimization recommendations
 */
router.post('/optimize-schedule',
  [
    body('schedule').isObject().withMessage('Schedule object required'),
    body('preferences').optional().isObject(),
    body('schedule.sport').notEmpty().withMessage('Sport type required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { schedule, preferences = {} } = req.body;

      logger.info('AI schedule optimization requested', {
        sport: schedule.sport,
        preferences: Object.keys(preferences)
      });

      const optimizations = await aiService.optimizeSchedule(schedule, preferences);

      res.json({
        success: true,
        optimizations,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('AI optimization endpoint failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/ai/parse-constraints
 * Parse natural language input into structured constraints
 */
router.post('/parse-constraints',
  [
    body('input').isString().isLength({ min: 5 }).withMessage('Natural language input required (min 5 chars)')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { input } = req.body;

      logger.info('AI constraint parsing requested', {
        inputLength: input.length
      });

      const constraints = await aiService.parseConstraints(input);

      res.json({
        success: true,
        constraints,
        originalInput: input,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('AI constraint parsing endpoint failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/ai/stream-analysis
 * Stream AI analysis of schedule (Server-Sent Events)
 */
router.get('/stream-analysis',
  [
    query('scheduleId').notEmpty().withMessage('Schedule ID required'),
    query('query').isString().isLength({ min: 3 }).withMessage('Query required (min 3 chars)')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { scheduleId, query: userQuery } = req.query;

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      logger.info('AI streaming analysis requested', {
        scheduleId,
        query: userQuery
      });

      // For demo - you'd fetch actual schedule from database
      const mockSchedule = {
        sport: 'basketball',
        teams: [],
        games: [],
        conflicts: []
      };

      const stream = await aiService.streamScheduleAnalysis(mockSchedule, userQuery);

      // Stream the AI response
      for await (const chunk of stream.textStream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error) {
      logger.error('AI streaming endpoint failed:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
);

/**
 * POST /api/ai/suggest-improvements
 * Get AI suggestions for overall schedule improvements
 */
router.post('/suggest-improvements',
  [
    body('schedule').isObject().withMessage('Schedule object required'),
    body('currentMetrics').optional().isObject(),
    body('targetMetrics').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { schedule, currentMetrics = {}, targetMetrics = {} } = req.body;

      const prompt = `
        Suggest improvements for this Big 12 ${schedule.sport} schedule:

        Current Performance:
        - Travel Efficiency: ${currentMetrics.travelEfficiency || 'Unknown'}
        - Conflict Score: ${currentMetrics.conflicts || 'Unknown'}
        - Balance Score: ${currentMetrics.balance || 'Unknown'}

        Target Goals:
        ${Object.entries(targetMetrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

        Provide 3-5 specific, actionable recommendations.
      `;

      const result = await aiService.getProvider().generateText({
        prompt,
        maxTokens: 800
      });

      logger.info('AI improvement suggestions generated', {
        sport: schedule.sport,
        responseLength: result.text.length
      });

      res.json({
        success: true,
        suggestions: result.text.split('\n').filter(line => line.trim()),
        metadata: {
          tokensUsed: result.usage?.totalTokens,
          currentMetrics,
          targetMetrics
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('AI suggestions endpoint failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;