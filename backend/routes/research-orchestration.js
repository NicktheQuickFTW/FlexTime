/**
 * Research Orchestration API Routes
 * 
 * Provides REST API endpoints for controlling the research orchestration system
 */

const express = require('express');
const router = express.Router();
const ResearchOrchestrationHub = require('../services/researchOrchestrationHub');
const ResearchFeedbackAgent = require('../services/researchFeedbackAgent');

// Initialize orchestration hub (singleton)
let orchestrationHub = null;
let feedbackAgent = null;

// Middleware to ensure orchestration is initialized
const ensureOrchestration = async (req, res, next) => {
  if (!orchestrationHub) {
    try {
      orchestrationHub = new ResearchOrchestrationHub({
        autoStart: false,
        enableScheduling: true,
        enableValidation: true,
        enableMonitoring: true
      });
      
      await orchestrationHub.initialize();
      
      // Initialize feedback agent
      feedbackAgent = new ResearchFeedbackAgent();
      await feedbackAgent.initialize();
      
      // Connect feedback agent to orchestration events
      orchestrationHub.on('research_integrated', (data) => {
        feedbackAgent.recordResearchOutcome(data.results);
      });
      
      feedbackAgent.on('adjust_frequency', (data) => {
        console.log('📊 Feedback: Adjust frequency', data);
      });
      
      feedbackAgent.on('adjust_schedule', (data) => {
        console.log('📊 Feedback: Adjust schedule', data);
      });
      
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to initialize orchestration',
        message: error.message
      });
    }
  }
  next();
};

/**
 * GET /api/research-orchestration/status
 * Get current system status
 */
router.get('/status', ensureOrchestration, async (req, res) => {
  try {
    const status = await orchestrationHub.getSystemStatus();
    const feedbackInsights = feedbackAgent.getInsights();
    
    res.json({
      status: 'active',
      orchestration: status,
      feedback: {
        insights: feedbackInsights,
        metrics: feedbackAgent.performanceMetrics,
        stats: feedbackAgent.getValidationStats()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * POST /api/research-orchestration/start
 * Start automated research scheduling
 */
router.post('/start', ensureOrchestration, async (req, res) => {
  try {
    await orchestrationHub.startScheduling();
    
    res.json({
      success: true,
      message: 'Research orchestration started',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start orchestration',
      message: error.message
    });
  }
});

/**
 * POST /api/research-orchestration/stop
 * Stop automated research scheduling
 */
router.post('/stop', ensureOrchestration, async (req, res) => {
  try {
    await orchestrationHub.stop();
    orchestrationHub = null;
    
    if (feedbackAgent) {
      feedbackAgent.stop();
      feedbackAgent = null;
    }
    
    res.json({
      success: true,
      message: 'Research orchestration stopped',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop orchestration',
      message: error.message
    });
  }
});

/**
 * POST /api/research-orchestration/schedule
 * Schedule immediate research
 */
router.post('/schedule', ensureOrchestration, async (req, res) => {
  try {
    const { type, sports, teams, priority, metadata } = req.body;
    
    if (!type || !sports) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'sports']
      });
    }
    
    const result = await orchestrationHub.scheduleImmediate({
      type,
      sports,
      teams,
      priority: priority || 2,
      metadata,
      description: `API scheduled ${type} research`
    });
    
    res.json({
      success: true,
      message: 'Research scheduled',
      jobs: result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to schedule research',
      message: error.message
    });
  }
});

/**
 * POST /api/research-orchestration/trigger-event
 * Trigger an event-driven research
 */
router.post('/trigger-event', ensureOrchestration, async (req, res) => {
  try {
    const { event, data } = req.body;
    
    const validEvents = [
      'transfer_portal_update',
      'coaching_change',
      'game_completed',
      'recruiting_update'
    ];
    
    if (!event || !validEvents.includes(event)) {
      return res.status(400).json({
        error: 'Invalid event type',
        validEvents
      });
    }
    
    await orchestrationHub.triggerEvent(event, data);
    
    res.json({
      success: true,
      message: `Event '${event}' triggered`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to trigger event',
      message: error.message
    });
  }
});

/**
 * GET /api/research-orchestration/history
 * Get research history
 */
router.get('/history', ensureOrchestration, async (req, res) => {
  try {
    const { sport, type, startDate, endDate, limit } = req.query;
    
    const history = await orchestrationHub.getResearchHistory({
      sport,
      type,
      startDate,
      endDate,
      limit: parseInt(limit) || 100
    });
    
    res.json({
      history,
      count: history.length,
      filters: { sport, type, startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
});

/**
 * DELETE /api/research-orchestration/clear
 * Clear research data with filters
 */
router.delete('/clear', ensureOrchestration, async (req, res) => {
  try {
    const { sport, type, olderThan, tableName, force, confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Set confirm=true to proceed with deletion'
      });
    }
    
    const result = await orchestrationHub.clearResearchData({
      sport,
      type,
      olderThan,
      tableName,
      force
    });
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear data',
      message: error.message
    });
  }
});

/**
 * GET /api/research-orchestration/retention-policy
 * Get data retention policy report
 */
router.get('/retention-policy', ensureOrchestration, async (req, res) => {
  try {
    const report = await orchestrationHub.getRetentionPolicyReport();
    
    res.json({
      success: true,
      report,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get retention policy',
      message: error.message
    });
  }
});

/**
 * POST /api/research-orchestration/maintenance
 * Perform data maintenance based on retention policies
 */
router.post('/maintenance', ensureOrchestration, async (req, res) => {
  try {
    const results = await orchestrationHub.performDataMaintenance();
    
    res.json({
      success: true,
      results,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to perform maintenance',
      message: error.message
    });
  }
});

/**
 * GET /api/research-orchestration/feedback/insights
 * Get feedback agent insights
 */
router.get('/feedback/insights', ensureOrchestration, (req, res) => {
  try {
    const insights = feedbackAgent.getInsights();
    const metrics = feedbackAgent.performanceMetrics;
    
    res.json({
      insights,
      metrics,
      recommendations: feedbackAgent.recommendations,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get feedback insights',
      message: error.message
    });
  }
});

/**
 * POST /api/research-orchestration/feedback/reset
 * Reset feedback agent learning
 */
router.post('/feedback/reset', ensureOrchestration, (req, res) => {
  try {
    feedbackAgent.reset();
    
    res.json({
      success: true,
      message: 'Feedback agent reset',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset feedback',
      message: error.message
    });
  }
});

/**
 * WebSocket endpoint for real-time monitoring
 */
router.ws('/monitor', ensureOrchestration, (ws, req) => {
  console.log('📡 WebSocket client connected for monitoring');
  
  // Send initial status
  orchestrationHub.getSystemStatus().then(status => {
    ws.send(JSON.stringify({
      type: 'status',
      data: status
    }));
  });
  
  // Subscribe to events
  const handlers = {
    status_update: (data) => {
      ws.send(JSON.stringify({ type: 'status_update', data }));
    },
    research_integrated: (data) => {
      ws.send(JSON.stringify({ type: 'research_completed', data }));
    },
    research_failed: (data) => {
      ws.send(JSON.stringify({ type: 'research_failed', data }));
    },
    health_alert: (data) => {
      ws.send(JSON.stringify({ type: 'health_alert', data }));
    },
    feedback_analysis: (data) => {
      ws.send(JSON.stringify({ type: 'feedback_analysis', data }));
    }
  };
  
  // Register event handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    orchestrationHub.on(event, handler);
  });
  
  if (feedbackAgent) {
    feedbackAgent.on('system_adjusted', (data) => {
      ws.send(JSON.stringify({ type: 'system_adjusted', data }));
    });
  }
  
  // Handle client messages
  ws.on('message', (msg) => {
    try {
      const message = JSON.parse(msg);
      
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  // Cleanup on disconnect
  ws.on('close', () => {
    console.log('📡 WebSocket client disconnected');
    
    // Remove event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      orchestrationHub.removeListener(event, handler);
    });
  });
});

module.exports = router;