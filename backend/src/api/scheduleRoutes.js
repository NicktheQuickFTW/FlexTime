/**
 * FlexTime Scheduling System - Schedule Routes
 * 
 * API routes for schedule management.
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('./scheduleController');

// Get all schedules
router.get('/schedules', scheduleController.getSchedules);

// Get a specific schedule by ID
router.get('/schedules/:id', scheduleController.getScheduleById);

// Create a new schedule
router.post('/schedules', scheduleController.createSchedule);

// Update an existing schedule
router.put('/schedules/:id', scheduleController.updateSchedule);

// Delete a schedule
router.delete('/schedules/:id', scheduleController.deleteSchedule);

// Optimize a schedule
router.post('/schedules/:id/optimize', scheduleController.optimizeSchedule);

// Analyze a schedule
router.get('/schedules/:id/analyze', scheduleController.analyzeSchedule);

// Get games for a schedule
router.get('/schedules/:id/games', scheduleController.getScheduleGames);

module.exports = router;
