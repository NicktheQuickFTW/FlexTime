/**
 * FlexTime Event Infrastructure Integration Example
 * 
 * This example demonstrates how to integrate the event streaming infrastructure
 * with the existing FlexTime backend application.
 */

const express = require('express');
const FlexTimeEventIntegration = require('../services/flextime-event-integration');
const EventManagementAPI = require('../api/event-management-api');

class FlexTimeIntegratedApplication {
  constructor() {
    this.app = express();
    this.eventIntegration = null;
    this.eventAPI = null;
    this.server = null;
  }

  /**
   * Initialize the integrated application
   */
  async initialize() {
    console.log('Initializing FlexTime with Event Infrastructure...');

    // Initialize event infrastructure
    this.eventIntegration = new FlexTimeEventIntegration({
      environment: process.env.NODE_ENV || 'development',
      enablePublishing: true,
      enableConsuming: true,
      enableMonitoring: true,
      autoStart: true
    });

    await this.eventIntegration.initialize();

    // Initialize event management API
    this.eventAPI = new EventManagementAPI({
      port: 3010,
      enableCors: true,
      enableAuth: false // Disable for demo
    });

    await this.eventAPI.initialize(this.eventIntegration);

    // Setup FlexTime application
    await this.setupFlexTimeApp();

    // Register event handlers
    this.registerEventHandlers();

    console.log('FlexTime with Event Infrastructure initialized successfully');
  }

  /**
   * Setup the main FlexTime application
   */
  async setupFlexTimeApp() {
    // Middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Make event integration available to routes
    this.app.use((req, res, next) => {
      req.eventIntegration = this.eventIntegration;
      next();
    });

    // FlexTime API routes with event integration
    this.setupScheduleRoutes();
    this.setupGameRoutes();
    this.setupOptimizationRoutes();
    this.setupCompassRoutes();

    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const eventHealth = await this.eventIntegration.getHealthStatus();
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            flextime: 'healthy',
            events: eventHealth.status
          },
          eventInfrastructure: eventHealth
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error.message
        });
      }
    });
  }

  /**
   * Setup schedule-related routes with event publishing
   */
  setupScheduleRoutes() {
    // Create schedule with event publishing
    this.app.post('/api/schedules', async (req, res) => {
      try {
        const { sport, season, teams, constraints } = req.body;
        
        // Simulate schedule creation (replace with actual FlexTime logic)
        const schedule = {
          id: `schedule-${Date.now()}`,
          sport,
          season,
          teams,
          constraints,
          status: 'draft',
          createdAt: new Date().toISOString(),
          createdBy: req.headers['user-id'] || 'system'
        };

        // Publish schedule created event
        await req.eventIntegration.publishScheduleCreated({
          scheduleId: schedule.id,
          sport: schedule.sport,
          season: schedule.season,
          conference: 'Big 12',
          status: schedule.status,
          createdBy: schedule.createdBy,
          teams: schedule.teams,
          constraints: schedule.constraints
        });

        res.status(201).json({
          success: true,
          schedule,
          message: 'Schedule created and event published'
        });

      } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Update schedule with event publishing
    this.app.put('/api/schedules/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const changes = req.body;
        
        // Simulate schedule update
        const updatedSchedule = {
          id,
          ...changes,
          updatedAt: new Date().toISOString(),
          updatedBy: req.headers['user-id'] || 'system',
          version: Date.now().toString()
        };

        // Publish schedule updated event
        await req.eventIntegration.publishScheduleUpdated(
          id,
          changes,
          updatedSchedule.updatedBy
        );

        res.json({
          success: true,
          schedule: updatedSchedule,
          message: 'Schedule updated and event published'
        });

      } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Publish schedule
    this.app.post('/api/schedules/:id/publish', async (req, res) => {
      try {
        const { id } = req.params;
        const publishedBy = req.headers['user-id'] || 'system';
        
        // Publish schedule published event
        await req.eventIntegration.publishSchedulePublished(
          id,
          publishedBy,
          [{ userId: publishedBy, timestamp: new Date().toISOString() }]
        );

        res.json({
          success: true,
          scheduleId: id,
          publishedBy,
          publishedAt: new Date().toISOString(),
          message: 'Schedule published and event sent'
        });

      } catch (error) {
        console.error('Error publishing schedule:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Setup game-related routes with event publishing
   */
  setupGameRoutes() {
    // Schedule a game
    this.app.post('/api/games', async (req, res) => {
      try {
        const { scheduleId, homeTeam, awayTeam, venue, scheduledDate, gameType } = req.body;
        
        const game = {
          id: `game-${Date.now()}`,
          scheduleId,
          homeTeam,
          awayTeam,
          venue,
          scheduledDate,
          gameType: gameType || 'conference',
          sport: 'Basketball', // Would be derived from schedule
          createdAt: new Date().toISOString()
        };

        // Publish game scheduled event
        await req.eventIntegration.publishGameScheduled({
          gameId: game.id,
          scheduleId: game.scheduleId,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          venue: game.venue,
          scheduledDate: new Date(game.scheduledDate).toISOString(),
          sport: game.sport,
          gameType: game.gameType
        });

        res.status(201).json({
          success: true,
          game,
          message: 'Game scheduled and event published'
        });

      } catch (error) {
        console.error('Error scheduling game:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Reschedule a game
    this.app.put('/api/games/:id/reschedule', async (req, res) => {
      try {
        const { id } = req.params;
        const { newDate, reason } = req.body;
        const rescheduledBy = req.headers['user-id'] || 'system';
        
        // Simulate getting original date (would come from database)
        const originalDate = new Date('2025-03-15T19:00:00Z');

        // Publish game rescheduled event
        await req.eventIntegration.publishGameRescheduled(
          id,
          originalDate,
          new Date(newDate),
          reason,
          rescheduledBy
        );

        res.json({
          success: true,
          gameId: id,
          originalDate,
          newDate,
          reason,
          rescheduledBy,
          message: 'Game rescheduled and event published'
        });

      } catch (error) {
        console.error('Error rescheduling game:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Setup optimization routes with event publishing
   */
  setupOptimizationRoutes() {
    // Start optimization
    this.app.post('/api/schedules/:id/optimize', async (req, res) => {
      try {
        const { id } = req.params;
        const { algorithm = 'simulated-annealing', parameters = {} } = req.body;
        
        const optimizationId = `opt-${Date.now()}`;
        
        // Publish optimization started event
        await req.eventIntegration.publishOptimizationStarted(
          optimizationId,
          id,
          algorithm,
          parameters
        );

        // Simulate optimization process
        this.simulateOptimization(optimizationId, req.eventIntegration);

        res.status(202).json({
          success: true,
          optimizationId,
          scheduleId: id,
          algorithm,
          status: 'started',
          message: 'Optimization started, events will be published as it progresses'
        });

      } catch (error) {
        console.error('Error starting optimization:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Setup COMPASS ML routes with event publishing
   */
  setupCompassRoutes() {
    // Start model training
    this.app.post('/api/compass/train', async (req, res) => {
      try {
        const { modelType, sport, datasetSize = 1000 } = req.body;
        
        const trainingId = `training-${Date.now()}`;
        const parameters = {
          epochs: 100,
          learningRate: 0.001,
          batchSize: 32
        };

        // Publish training started event
        await req.eventIntegration.publishModelTrainingStarted(
          trainingId,
          modelType,
          sport,
          datasetSize,
          parameters
        );

        // Simulate training process
        this.simulateTraining(trainingId, modelType, req.eventIntegration);

        res.status(202).json({
          success: true,
          trainingId,
          modelType,
          sport,
          status: 'started',
          message: 'Model training started, events will be published as it progresses'
        });

      } catch (error) {
        console.error('Error starting training:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Request prediction
    this.app.post('/api/compass/predict', async (req, res) => {
      try {
        const { modelId, input } = req.body;
        const requestedBy = req.headers['user-id'] || 'system';
        
        const predictionId = `pred-${Date.now()}`;

        // Publish prediction requested event
        await req.eventIntegration.publishPredictionRequested(
          predictionId,
          modelId,
          input,
          requestedBy
        );

        // Simulate prediction
        setTimeout(async () => {
          await req.eventIntegration.publishEvent('compass.prediction.completed', {
            predictionId,
            result: { prediction: Math.random() > 0.5 ? 'win' : 'loss' },
            confidence: Math.random(),
            processingTime: 150,
            modelVersion: '1.0.0'
          });
        }, 1000);

        res.status(202).json({
          success: true,
          predictionId,
          modelId,
          status: 'processing',
          message: 'Prediction requested, result will be published as event'
        });

      } catch (error) {
        console.error('Error requesting prediction:', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Register event handlers for processing events
   */
  registerEventHandlers() {
    console.log('Registering FlexTime event handlers...');

    // Schedule event handlers
    this.eventIntegration.onScheduleCreated(async (event) => {
      console.log(`📅 Schedule Created: ${event.data.scheduleId} for ${event.data.sport}`);
      // Update UI, send notifications, update database
    });

    this.eventIntegration.onScheduleUpdated(async (event) => {
      console.log(`📝 Schedule Updated: ${event.data.scheduleId}`);
      // Invalidate caches, notify stakeholders
    });

    this.eventIntegration.onSchedulePublished(async (event) => {
      console.log(`📢 Schedule Published: ${event.data.scheduleId} by ${event.data.publishedBy}`);
      // Send notifications, update public displays
    });

    // Game event handlers
    this.eventIntegration.onGameScheduled(async (event) => {
      console.log(`🏀 Game Scheduled: ${event.data.homeTeam} vs ${event.data.awayTeam}`);
      // Update venue calendars, send notifications
    });

    this.eventIntegration.onGameRescheduled(async (event) => {
      console.log(`🔄 Game Rescheduled: ${event.data.gameId} - ${event.data.reason}`);
      // Update all systems, notify affected parties
    });

    // Optimization event handlers
    this.eventIntegration.onOptimizationStarted(async (event) => {
      console.log(`🔄 Optimization Started: ${event.data.optimizationId} using ${event.data.algorithm}`);
      // Update UI with progress tracking
    });

    this.eventIntegration.onOptimizationProgress(async (event) => {
      console.log(`📊 Optimization Progress: ${event.data.optimizationId} - ${event.data.progress}%`);
      // Update progress bars, send periodic updates
    });

    this.eventIntegration.onOptimizationCompleted(async (event) => {
      console.log(`✅ Optimization Completed: ${event.data.optimizationId} - Success: ${event.data.success}`);
      // Process results, update schedules, notify users
    });

    // COMPASS event handlers
    this.eventIntegration.onModelTrainingStarted(async (event) => {
      console.log(`🤖 Training Started: ${event.data.trainingId} for ${event.data.modelType}`);
      // Update training dashboard
    });

    this.eventIntegration.onModelTrainingCompleted(async (event) => {
      console.log(`🎯 Training Completed: ${event.data.trainingId} - Accuracy: ${event.data.accuracy}`);
      // Deploy new model, update predictions
    });

    this.eventIntegration.onPredictionCompleted(async (event) => {
      console.log(`🔮 Prediction Completed: ${event.data.predictionId} - ${JSON.stringify(event.data.result)}`);
      // Update UI with prediction results
    });

    // System event handlers
    this.eventIntegration.onHealthCheckFailed(async (event) => {
      console.error(`🚨 Health Check Failed: ${event.data.serviceName} - ${event.data.error}`);
      // Alert administrators, attempt recovery
    });

    console.log('Event handlers registered successfully');
  }

  /**
   * Simulate optimization process
   */
  async simulateOptimization(optimizationId, eventIntegration) {
    console.log(`Starting optimization simulation for ${optimizationId}`);
    
    const totalSteps = 10;
    let progress = 0;

    const progressInterval = setInterval(async () => {
      progress += Math.random() * 20;
      if (progress > 100) progress = 100;

      // Publish progress event
      await eventIntegration.publishOptimizationProgress(optimizationId, progress, {
        iteration: Math.floor(progress / 10),
        bestSolution: { quality: Math.random() }
      });

      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Publish completion event
        setTimeout(async () => {
          await eventIntegration.publishOptimizationCompleted(
            optimizationId,
            true,
            {
              solution: { schedule: 'optimized-schedule-data' },
              metrics: { quality: 0.95, conflicts: 2 },
              iterations: totalSteps
            },
            5000
          );
        }, 1000);
      }
    }, 500);
  }

  /**
   * Simulate model training process
   */
  async simulateTraining(trainingId, modelType, eventIntegration) {
    console.log(`Starting training simulation for ${trainingId}`);
    
    setTimeout(async () => {
      const modelId = `model-${Date.now()}`;
      const accuracy = 0.85 + Math.random() * 0.10; // 85-95% accuracy
      
      await eventIntegration.publishModelTrainingCompleted(
        trainingId,
        modelId,
        accuracy,
        {
          loss: 0.15,
          precision: accuracy,
          recall: accuracy * 0.95,
          f1Score: accuracy * 0.92
        },
        3000 // 3 seconds training time for demo
      );
    }, 3000);
  }

  /**
   * Start the integrated application
   */
  async start() {
    const port = process.env.PORT || 3005;
    
    // Start the main FlexTime app
    this.server = this.app.listen(port, () => {
      console.log(`🚀 FlexTime Application running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📅 Schedule API: http://localhost:${port}/api/schedules`);
      console.log(`🏀 Game API: http://localhost:${port}/api/games`);
      console.log(`🔄 Optimization API: http://localhost:${port}/api/schedules/:id/optimize`);
      console.log(`🤖 COMPASS API: http://localhost:${port}/api/compass`);
    });

    // Start the event management API
    await this.eventAPI.start();
    console.log(`🔧 Event Management API: http://localhost:3010/api`);
    console.log(`📈 Stream Monitoring: http://localhost:3010/api/metrics`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down FlexTime Integrated Application...');

    if (this.server) {
      await new Promise(resolve => this.server.close(resolve));
    }

    if (this.eventAPI) {
      await this.eventAPI.stop();
    }

    if (this.eventIntegration) {
      await this.eventIntegration.shutdown();
    }

    console.log('FlexTime Integrated Application shutdown complete');
  }
}

// Example usage
async function main() {
  const app = new FlexTimeIntegratedApplication();
  
  try {
    await app.initialize();
    await app.start();
    
    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await app.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await app.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start FlexTime Integrated Application:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FlexTimeIntegratedApplication;