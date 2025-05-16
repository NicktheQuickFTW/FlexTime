/**
 * Intelligence Engine Routes - Stub Implementation
 * 
 * This is a stub implementation that replaces the original Intelligence Engine routes.
 * It provides simple fallback responses for all endpoints previously connected
 * to the external Intelligence Engine service.
 */

const express = require('express');
const router = express.Router();

// Status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'disabled',
    message: 'Intelligence Engine functionality has been removed',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Recommendations endpoint
router.post('/recommendations', (req, res) => {
  const sportType = req.body.sportType || 'unknown';
  
  // Default recommendations
  res.json({
    success: true,
    sportType,
    algorithms: {
      generator: 'RoundRobinGenerator',
      optimizer: 'SimulatedAnnealingOptimizer'
    },
    constraints: [
      {
        type: 'HomeAwayBalance',
        weight: 1.0,
        parameters: {}
      },
      {
        type: 'MinimumRestDays',
        weight: 0.8,
        parameters: { minDays: 1 }
      }
    ],
    parameters: {
      optimizationIterations: 1000,
      coolingRate: 0.95,
      initialTemperature: 100
    },
    source: 'local_stub'
  });
});

// Memory endpoints
router.post('/experiences', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Intelligence Engine functionality has been removed - experience storage not available'
  });
});

router.get('/experiences', (req, res) => {
  res.json({
    success: true,
    experiences: []
  });
});

router.post('/feedback', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Intelligence Engine functionality has been removed - feedback storage not available'
  });
});

// Advanced endpoints
router.post('/learning', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Intelligence Engine functionality has been removed - advanced learning not available'
  });
});

router.post('/multi-sport', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Intelligence Engine functionality has been removed - multi-sport optimization not available'
  });
});

// Agent tasks
router.post('/agents/tasks', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Intelligence Engine functionality has been removed - agent tasks not available'
  });
});

// Catch all other routes
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Intelligence Engine functionality has been removed - endpoint not available'
  });
});

module.exports = router;