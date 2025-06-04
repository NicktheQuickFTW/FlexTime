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

// Generate a new schedule using AI
router.post('/schedules/generate', scheduleController.generateSchedule);

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

// Update a specific game (for drag & drop operations)
router.put('/schedules/:id/games/:gameId', scheduleController.updateGame);

// Move a game to a new time slot (drag & drop specific)
router.post('/schedules/:id/games/:gameId/move', scheduleController.moveGame);

// Get available time slots for a schedule
router.get('/schedules/:id/timeslots', scheduleController.getTimeSlots);

module.exports = router;
