/**
 * Intelligence Engine Routes - Deprecated
 * 
 * This file is no longer in use.
 * All intelligence engine functionality has been removed.
 */

const express = require('express');
const router = express.Router();

// Deprecated route - return unavailable status
router.get('/status', (req, res) => {
  res.json({
    success: false,
    status: 'removed',
    message: 'Intelligence Engine functionality has been removed',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;