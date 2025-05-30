/**
 * Schedule Export API
 * Comprehensive API for exporting Big 12 sports scheduling data
 * Supports multiple formats, filtering, and delivery methods
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs').promises;
const path = require('path');

class ScheduleExportAPI {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.dataService = config.dataService;
    this.formatters = config.formatters;
    this.distributors = config.distributors;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many export requests from this IP'
    });
    this.app.use('/api/exports', limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Authentication middleware
    this.app.use('/api/exports', this.authenticateToken.bind(this));
  }

  setupRoutes() {
    const router = express.Router();

    // Schedule export endpoints
    router.get('/schedules', this.validateScheduleExport(), this.exportSchedules.bind(this));
    router.post('/schedules/bulk', this.validateBulkExport(), this.bulkExportSchedules.bind(this));
    router.get('/schedules/stream', this.streamSchedules.bind(this));

    // Team-specific exports
    router.get('/teams/:teamId/schedule', this.validateTeamExport(), this.exportTeamSchedule.bind(this));
    router.get('/teams/:teamId/constraints', this.exportTeamConstraints.bind(this));

    // Sport-specific exports
    router.get('/sports/:sport/schedule', this.validateSportExport(), this.exportSportSchedule.bind(this));
    router.get('/sports/:sport/analytics', this.exportSportAnalytics.bind(this));

    // Venue exports
    router.get('/venues/:venueId/schedule', this.exportVenueSchedule.bind(this));
    router.get('/venues/utilization', this.exportVenueUtilization.bind(this));

    // Analytics and reports
    router.get('/analytics/performance', this.exportPerformanceAnalytics.bind(this));
    router.get('/analytics/constraints', this.exportConstraintAnalytics.bind(this));
    router.get('/analytics/travel', this.exportTravelAnalytics.bind(this));

    // Custom exports
    router.post('/custom', this.validateCustomExport(), this.customExport.bind(this));
    router.get('/templates', this.getExportTemplates.bind(this));

    // Export status and history
    router.get('/status/:exportId', this.getExportStatus.bind(this));
    router.get('/history', this.getExportHistory.bind(this));

    // Subscription management
    router.post('/subscriptions', this.validateSubscription(), this.createSubscription.bind(this));
    router.get('/subscriptions', this.getSubscriptions.bind(this));
    router.delete('/subscriptions/:subscriptionId', this.deleteSubscription.bind(this));

    this.app.use('/api/exports', router);
  }

  // Authentication middleware
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, this.config.jwtSecret, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  }

  // Validation middleware
  validateScheduleExport() {
    return [
      query('format').optional().isIn(['json', 'csv', 'excel', 'pdf', 'ical', 'xml']),
      query('sport').optional().isAlpha(),
      query('team').optional().isAlphanumeric(),
      query('venue').optional().isAlphanumeric(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('includeConstraints').optional().isBoolean(),
      query('includeAnalytics').optional().isBoolean(),
      this.handleValidationErrors
    ];
  }

  validateBulkExport() {
    return [
      body('exports').isArray().notEmpty(),
      body('exports.*.type').isIn(['schedules', 'analytics', 'constraints']),
      body('exports.*.format').isIn(['json', 'csv', 'excel', 'pdf']),
      body('deliveryMethod').optional().isIn(['download', 'email', 'ftp', 's3']),
      this.handleValidationErrors
    ];
  }

  validateTeamExport() {
    return [
      query('format').optional().isIn(['json', 'csv', 'excel', 'pdf', 'ical']),
      query('season').optional().isNumeric(),
      query('includeHistory').optional().isBoolean(),
      this.handleValidationErrors
    ];
  }

  validateSportExport() {
    return [
      query('format').optional().isIn(['json', 'csv', 'excel', 'pdf']),
      query('season').optional().isNumeric(),
      query('includeRankings').optional().isBoolean(),
      query('includeStats').optional().isBoolean(),
      this.handleValidationErrors
    ];
  }

  validateCustomExport() {
    return [
      body('query').notEmpty(),
      body('format').isIn(['json', 'csv', 'excel', 'pdf']),
      body('filters').optional().isObject(),
      body('deliveryMethod').optional().isIn(['download', 'email', 'webhook']),
      this.handleValidationErrors
    ];
  }

  validateSubscription() {
    return [
      body('type').isIn(['schedules', 'analytics', 'alerts']),
      body('frequency').isIn(['daily', 'weekly', 'monthly', 'real-time']),
      body('format').isIn(['json', 'csv', 'excel', 'pdf', 'email']),
      body('deliveryMethod').isIn(['email', 'webhook', 'ftp', 's3']),
      body('filters').optional().isObject(),
      this.handleValidationErrors
    ];
  }

  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }

  // Main export endpoints
  async exportSchedules(req, res) {
    try {
      const {
        format = 'json',
        sport,
        team,
        venue,
        startDate,
        endDate,
        includeConstraints = false,
        includeAnalytics = false
      } = req.query;

      // Build query filters
      const filters = {
        sport,
        team,
        venue,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      };

      // Fetch schedule data
      const scheduleData = await this.dataService.getSchedules(filters);
      
      // Add additional data if requested
      if (includeConstraints === 'true') {
        scheduleData.constraints = await this.dataService.getConstraints(filters);
      }
      
      if (includeAnalytics === 'true') {
        scheduleData.analytics = await this.dataService.getAnalytics(filters);
      }

      // Format the data
      const formattedData = await this.formatters[format].format(scheduleData, {
        title: 'Big 12 Sports Schedule Export',
        generatedAt: new Date().toISOString(),
        filters: filters,
        user: req.user.username
      });

      // Set appropriate headers and send response
      this.setExportHeaders(res, format, 'big12-schedule');
      
      if (format === 'json') {
        res.json(formattedData);
      } else {
        res.send(formattedData);
      }

      // Log export activity
      await this.logExportActivity(req.user.id, 'schedules', format, filters);

    } catch (error) {
      console.error('Schedule export error:', error);
      res.status(500).json({ 
        error: 'Export failed',
        message: error.message
      });
    }
  }

  async bulkExportSchedules(req, res) {
    try {
      const { exports, deliveryMethod = 'download' } = req.body;
      const exportId = this.generateExportId();

      // Create export job
      const exportJob = {
        id: exportId,
        userId: req.user.id,
        status: 'processing',
        exports: exports,
        deliveryMethod: deliveryMethod,
        createdAt: new Date(),
        progress: 0
      };

      await this.dataService.createExportJob(exportJob);

      // Process exports asynchronously
      this.processBulkExport(exportJob);

      res.json({
        exportId: exportId,
        status: 'processing',
        message: 'Bulk export started. Use the exportId to check status.',
        estimatedCompletionTime: this.estimateCompletionTime(exports.length)
      });

    } catch (error) {
      console.error('Bulk export error:', error);
      res.status(500).json({
        error: 'Bulk export failed',
        message: error.message
      });
    }
  }

  async streamSchedules(req, res) {
    try {
      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const filters = req.query;
      
      // Send initial data
      const initialData = await this.dataService.getSchedules(filters);
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);

      // Set up real-time updates
      const updateInterval = setInterval(async () => {
        try {
          const updates = await this.dataService.getScheduleUpdates(filters);
          if (updates.length > 0) {
            res.write(`data: ${JSON.stringify(updates)}\n\n`);
          }
        } catch (error) {
          console.error('Stream update error:', error);
        }
      }, 30000); // Update every 30 seconds

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(updateInterval);
      });

    } catch (error) {
      console.error('Stream error:', error);
      res.status(500).json({
        error: 'Streaming failed',
        message: error.message
      });
    }
  }

  async exportTeamSchedule(req, res) {
    try {
      const { teamId } = req.params;
      const { format = 'json', season, includeHistory = false } = req.query;

      const teamData = await this.dataService.getTeamSchedule(teamId, {
        season: season ? parseInt(season) : null,
        includeHistory: includeHistory === 'true'
      });

      const formattedData = await this.formatters[format].format(teamData, {
        title: `${teamData.teamName} Schedule`,
        teamId: teamId
      });

      this.setExportHeaders(res, format, `${teamId}-schedule`);
      
      if (format === 'json') {
        res.json(formattedData);
      } else {
        res.send(formattedData);
      }

    } catch (error) {
      console.error('Team export error:', error);
      res.status(500).json({
        error: 'Team export failed',
        message: error.message
      });
    }
  }

  async exportSportSchedule(req, res) {
    try {
      const { sport } = req.params;
      const { format = 'json', season, includeRankings = false, includeStats = false } = req.query;

      const sportData = await this.dataService.getSportSchedule(sport, {
        season: season ? parseInt(season) : null,
        includeRankings: includeRankings === 'true',
        includeStats: includeStats === 'true'
      });

      const formattedData = await this.formatters[format].format(sportData, {
        title: `Big 12 ${sport.charAt(0).toUpperCase() + sport.slice(1)} Schedule`,
        sport: sport
      });

      this.setExportHeaders(res, format, `${sport}-schedule`);
      
      if (format === 'json') {
        res.json(formattedData);
      } else {
        res.send(formattedData);
      }

    } catch (error) {
      console.error('Sport export error:', error);
      res.status(500).json({
        error: 'Sport export failed',
        message: error.message
      });
    }
  }

  async customExport(req, res) {
    try {
      const { query, format, filters, deliveryMethod = 'download' } = req.body;

      // Execute custom query
      const data = await this.dataService.executeCustomQuery(query, filters);

      // Format the results
      const formattedData = await this.formatters[format].format(data, {
        title: 'Custom Export',
        query: query,
        generatedAt: new Date().toISOString()
      });

      if (deliveryMethod === 'download') {
        this.setExportHeaders(res, format, 'custom-export');
        
        if (format === 'json') {
          res.json(formattedData);
        } else {
          res.send(formattedData);
        }
      } else {
        // Handle other delivery methods
        await this.deliverExport(formattedData, format, deliveryMethod, req.user);
        res.json({
          message: 'Export delivered successfully',
          deliveryMethod: deliveryMethod
        });
      }

    } catch (error) {
      console.error('Custom export error:', error);
      res.status(500).json({
        error: 'Custom export failed',
        message: error.message
      });
    }
  }

  async getExportStatus(req, res) {
    try {
      const { exportId } = req.params;
      const status = await this.dataService.getExportStatus(exportId);

      if (!status) {
        return res.status(404).json({ error: 'Export not found' });
      }

      res.json(status);

    } catch (error) {
      console.error('Export status error:', error);
      res.status(500).json({
        error: 'Failed to get export status',
        message: error.message
      });
    }
  }

  async createSubscription(req, res) {
    try {
      const subscription = {
        ...req.body,
        userId: req.user.id,
        createdAt: new Date(),
        isActive: true
      };

      const subscriptionId = await this.dataService.createSubscription(subscription);

      res.status(201).json({
        subscriptionId: subscriptionId,
        message: 'Subscription created successfully'
      });

    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({
        error: 'Failed to create subscription',
        message: error.message
      });
    }
  }

  // Utility methods
  setExportHeaders(res, format, filename) {
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
      ical: 'text/calendar',
      xml: 'application/xml'
    };

    const extensions = {
      json: 'json',
      csv: 'csv',
      excel: 'xlsx',
      pdf: 'pdf',
      ical: 'ics',
      xml: 'xml'
    };

    res.setHeader('Content-Type', contentTypes[format]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extensions[format]}"`);
  }

  generateExportId() {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  estimateCompletionTime(exportCount) {
    // Simple estimation: 30 seconds per export
    const estimatedSeconds = exportCount * 30;
    return new Date(Date.now() + estimatedSeconds * 1000);
  }

  async processBulkExport(exportJob) {
    try {
      const results = [];
      
      for (let i = 0; i < exportJob.exports.length; i++) {
        const exportConfig = exportJob.exports[i];
        
        // Update progress
        const progress = Math.round((i / exportJob.exports.length) * 100);
        await this.dataService.updateExportProgress(exportJob.id, progress);

        // Process individual export
        const result = await this.processIndividualExport(exportConfig);
        results.push(result);
      }

      // Create archive if multiple files
      let finalResult;
      if (results.length > 1) {
        finalResult = await this.createArchive(results, exportJob.id);
      } else {
        finalResult = results[0];
      }

      // Deliver the export
      await this.deliverExport(finalResult, 'archive', exportJob.deliveryMethod, exportJob.userId);

      // Mark job as completed
      await this.dataService.updateExportStatus(exportJob.id, 'completed', finalResult);

    } catch (error) {
      console.error('Bulk export processing error:', error);
      await this.dataService.updateExportStatus(exportJob.id, 'failed', null, error.message);
    }
  }

  async logExportActivity(userId, type, format, filters) {
    await this.dataService.logActivity({
      userId: userId,
      action: 'export',
      type: type,
      format: format,
      filters: filters,
      timestamp: new Date()
    });
  }

  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error('Export API error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Schedule Export API running on port ${port}`);
    });
  }
}

module.exports = ScheduleExportAPI;