const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { AISchedulingService } = require('../ai-scheduling');
const logger = require('../../utils/logger');

const router = express.Router();

// Initialize AI service
const aiService = new AISchedulingService();

// Rate limiting for AI endpoints (more generous for authenticated users)
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many AI requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validateChatMessage = [
  body('message')
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('conversationHistory')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Conversation history must be an array with max 20 messages'),
];

const validateScheduleOptimization = [
  body('scheduleData')
    .notEmpty()
    .withMessage('Schedule data is required'),
  body('optimizationGoals')
    .optional()
    .isArray()
    .withMessage('Optimization goals must be an array'),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/ai/chat
 * Conversational AI interface for scheduling assistance
 */
router.post('/chat', aiRateLimit, validateChatMessage, handleValidationErrors, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    logger.info('AI chat request received', { 
      messageLength: message.length,
      historyLength: conversationHistory.length 
    });

    const response = await aiService.generateConversationalResponse(message, conversationHistory);
    
    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: 'AI service error',
        message: response.fallback || 'Failed to generate response'
      });
    }

    res.json({
      success: true,
      response: response.response,
      timestamp: response.timestamp,
      metadata: {
        model: 'claude-3-5-sonnet',
        processingTime: Date.now() - req.startTime
      }
    });

  } catch (error) {
    logger.error('Error in AI chat endpoint', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process chat request'
    });
  }
});

/**
 * POST /api/ai/suggestions
 * Generate intelligent scheduling suggestions
 */
router.post('/suggestions', aiRateLimit, async (req, res) => {
  try {
    const { query, currentSchedule } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required and must be a string'
      });
    }

    logger.info('AI suggestions request received', { query });

    const suggestions = await aiService.generateScheduleSuggestions(query, currentSchedule);
    
    if (!suggestions.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate suggestions',
        details: suggestions.details
      });
    }

    res.json({
      success: true,
      suggestions: suggestions.suggestions,
      overallScore: suggestions.overall_score,
      keyImprovements: suggestions.key_improvements,
      riskFactors: suggestions.risk_factors,
      priority: suggestions.priority,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
        suggestionCount: suggestions.suggestions.length
      }
    });

  } catch (error) {
    logger.error('Error in AI suggestions endpoint', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate suggestions'
    });
  }
});

/**
 * POST /api/ai/optimize
 * Comprehensive schedule optimization
 */
router.post('/optimize', aiRateLimit, validateScheduleOptimization, handleValidationErrors, async (req, res) => {
  try {
    const { scheduleData, optimizationGoals = [] } = req.body;
    
    logger.info('AI optimization request received', { 
      gameCount: scheduleData.games?.length || 0,
      goals: optimizationGoals 
    });

    const optimization = await aiService.optimizeSchedule(scheduleData, optimizationGoals);
    
    if (!optimization.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to optimize schedule',
        details: optimization.details
      });
    }

    res.json({
      success: true,
      currentScore: optimization.currentScore,
      optimizations: optimization.optimizations,
      estimatedSavings: optimization.estimatedSavings,
      implementationPriority: optimization.implementationPriority,
      keyImprovements: optimization.keyImprovements,
      riskFactors: optimization.riskFactors,
      metadata: {
        optimizedAt: new Date().toISOString(),
        processingTime: Date.now() - req.startTime,
        optimizationCount: optimization.optimizations.length
      }
    });

  } catch (error) {
    logger.error('Error in AI optimization endpoint', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to optimize schedule'
    });
  }
});

/**
 * POST /api/ai/validate
 * Real-time validation of schedule changes
 */
router.post('/validate', aiRateLimit, async (req, res) => {
  try {
    const { gameMove, currentSchedule } = req.body;
    
    if (!gameMove || !currentSchedule) {
      return res.status(400).json({
        success: false,
        error: 'Both gameMove and currentSchedule are required'
      });
    }

    logger.info('AI validation request received', { gameMove });

    const validation = await aiService.validateScheduleChange(gameMove, currentSchedule);
    
    res.json({
      success: true,
      valid: validation.valid,
      score: validation.score,
      issues: validation.issues || [],
      recommendations: validation.recommendations,
      metadata: {
        validatedAt: new Date().toISOString(),
        processingTime: Date.now() - req.startTime
      }
    });

  } catch (error) {
    logger.error('Error in AI validation endpoint', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to validate change'
    });
  }
});

/**
 * GET /api/ai/stream/chat
 * Server-sent events for streaming AI responses
 */
router.get('/stream/chat', aiRateLimit, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    logger.info('AI streaming request received', { query });

    const stream = await aiService.streamSchedulingResponse(query);
    
    for await (const chunk of stream.textStream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    logger.error('Error in AI streaming endpoint', { error: error.message });
    res.write(`data: ${JSON.stringify({ 
      error: 'Streaming failed', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/ai/status
 * Health check and service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    models: {
      reasoning: 'claude-3-5-sonnet-20241022',
      structured: 'gpt-4o-mini'
    },
    features: [
      'conversational_ai',
      'schedule_optimization', 
      'real_time_validation',
      'streaming_responses',
      'constraint_analysis'
    ],
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/ai/capabilities
 * List AI service capabilities and limitations
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      scheduling: {
        'auto_generation': 'Generate complete schedules from constraints',
        'optimization': 'Improve existing schedules for multiple objectives', 
        'conflict_resolution': 'Identify and resolve scheduling conflicts',
        'travel_optimization': 'Minimize travel costs and distances',
        'academic_integration': 'Handle campus calendar and finals conflicts'
      },
      analysis: {
        'constraint_validation': 'Real-time constraint satisfaction checking',
        'quality_scoring': 'Schedule quality assessment (0-100 scale)',
        'impact_prediction': 'Predict effects of schedule changes',
        'competitive_balance': 'Analyze strength of schedule fairness'
      },
      interaction: {
        'natural_language': 'Process requests in plain English',
        'conversational': 'Maintain context across multiple interactions',
        'streaming': 'Real-time response streaming',
        'multi_modal': 'Handle text, structured data, and API calls'
      }
    },
    limitations: {
      'real_time_data': 'Requires current schedule data for accurate suggestions',
      'external_dependencies': 'May need venue availability and broadcast schedules',
      'rate_limits': '50 requests per 15 minutes per IP',
      'context_window': 'Limited conversation history (20 messages max)'
    },
    big12_specific: {
      'teams': 16,
      'sports_supported': ['basketball', 'football', 'baseball', 'softball', 'volleyball'],
      'constraint_types': 8,
      'optimization_goals': ['travel', 'rest', 'competitive_balance', 'revenue', 'academics']
    }
  });
});

// Middleware to add request timestamp for performance tracking
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;