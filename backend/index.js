// FlexTime Scheduling System Entry Point - Scaled for Production with 20 Workers Per Task
console.log('🚀 FlexTime Scheduling System Starting (Scaled Configuration - 20 Workers Per Task)');

const express = require('express');
const cluster = require('cluster');
const { FlexTimeAgentSystem } = require('./agents');
const scaleConfig = require('./config/scale_config');
const feedbackAnalysisService = require('./services/feedbackAnalysisService');
const scheduleService = require('./services/scheduleService');
const { registerSchedulingImprovements } = require('./integration/scheduling_improvements');
const { 
  initializeCOMPASS, 
  registerCOMPASSEndpoints, 
  integrateCOMPASSWithMetrics 
} = require('./compass');
const logger = require('./utils/logger');

// Import refactored modules
const { setupDatabase } = require('./src/config/database');
const configureMiddleware = require('./src/config/middleware');
const registerRoutes = require('./src/config/routes');
const CacheManager = require('./src/utils/cacheManager');
const { 
  shouldUseCluster, 
  startCluster, 
  configureServer, 
  createHealthCheck,
  createMetricsEndpoint,
  setupGracefulShutdown 
} = require('./src/config/server');

// Initialize cache manager with 20 workers per task support
const cacheManager = new CacheManager(scaleConfig.caching.memory);

// Check if we should use clustering
if (shouldUseCluster()) {
  startCluster();
} else {
  // Worker process or single process mode
  startWorker();
}

function startWorker() {
  // Create Express app
  const app = express();

  // Configure middleware using extracted module
  configureMiddleware(app, scaleConfig);

  // Make cache manager available to the app
  app.set('cacheManager', cacheManager);
  app.set('getCachedConstraint', (key) => cacheManager.get(key));
  app.set('setCachedConstraint', (key, data) => cacheManager.set(key, data));

// Initialize database and application systems
async function initializeApplication() {
    try {
      // Set up database using extracted module
      const db = await setupDatabase();
      
      // Initialize FlexTime Agent System with 20 workers per task support
      const agentSystem = new FlexTimeAgentSystem({
        db,
        enableSportSpecificPatterns: process.env.ENABLE_SPORT_SPECIFIC_PATTERNS === 'true',
        enableInterSportCorrelations: process.env.ENABLE_INTER_SPORT_CORRELATIONS === 'true',
        enableSeasonalVariance: process.env.ENABLE_SEASONAL_VARIANCE === 'true',
        maxWorkersPerTask: 20 // Enable 20 workers per task
      });

      // Make database and agent system available to routes
      app.set('db', db);
      app.set('agentSystem', agentSystem);
      
      // Initialize the schedule service
      scheduleService.initialize(db);
      
      // Register scheduling improvements with enhanced parallelization
      registerSchedulingImprovements(app, agentSystem, {
        useParallelSchedulingAgent: process.env.USE_PARALLEL_SCHEDULING !== 'false',
        maxParallelOperations: parseInt(process.env.MAX_PARALLEL_OPERATIONS || '20', 10), // Increased to 20
        generateVisualizations: process.env.GENERATE_VISUALIZATIONS !== 'false',
        generateAIInsights: process.env.GENERATE_AI_INSIGHTS !== 'false',
        debug: process.env.DEBUG_SCHEDULING === 'true'
      });
      
      // Initialize Advanced Metrics System
      const AdvancedMetricsSystem = require('./utils/advanced_metrics_system');
      const advancedMetricsSystem = new AdvancedMetricsSystem({
        enablePredictiveModels: process.env.ENABLE_PREDICTIVE_METRICS !== 'false',
        enableRevenueOptimization: process.env.ENABLE_REVENUE_METRICS !== 'false',
        enablePlayerWellbeingMetrics: process.env.ENABLE_WELLBEING_METRICS !== 'false',
        enableFanEngagementMetrics: process.env.ENABLE_FAN_METRICS !== 'false',
        enableMediaMetrics: process.env.ENABLE_MEDIA_METRICS !== 'false',
        enableBrandMetrics: process.env.ENABLE_BRAND_METRICS !== 'false'
      });

      // Make the metrics system available to the application
      app.set('advancedMetricsSystem', advancedMetricsSystem);
      
      // Skip COMPASS initialization in dev mode
      if (process.env.NODE_ENV !== 'development') {
        try {
          // Initialize COMPASS
          const compass = await initializeCOMPASS(app, db, {
            core: {
              refreshFrequency: parseInt(process.env.COMPASS_REFRESH_FREQUENCY || '86400000', 10),
              weightConfig: {
                performance: 0.25,
                resources: 0.20,
                recruiting: 0.15,
                prestige: 0.15,
                talent: 0.15,
                infrastructure: 0.10
              }
            },
            predictiveAnalytics: {
              modelUpdateFrequency: parseInt(process.env.PREDICTIVE_MODEL_UPDATE_FREQUENCY || '86400000', 10),
              ratingSystemWeights: {
                internalModel: 0.40,
                netRanking: 0.20,
                kenpom: 0.15,
                nationalPolls: 0.10,
                conferenceStanding: 0.10,
                socialMedia: 0.05
              }
            }
          });
          
          // Register COMPASS API endpoints
          registerCOMPASSEndpoints(app, compass);
          
          // Integrate COMPASS with Advanced Metrics System
          integrateCOMPASSWithMetrics(app, compass);
        } catch (error) {
          logger.error(`COMPASS initialization skipped due to error: ${error.message}`);
        }
      } else {
        logger.info('COMPASS initialization skipped in development mode');
      }

      logger.info('Advanced Metrics System initialized and registered');
      return db;
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, continuing without DB:', dbError.message);
      return null;
    }
  }

  // Register routes using extracted module
  registerRoutes(app);

  // Register health check and metrics endpoints using extracted functions
  app.get('/health', createHealthCheck(cacheManager));
  
  if (scaleConfig.monitoring.metrics.enabled) {
    app.get('/metrics', createMetricsEndpoint(cacheManager));
  }

  // Port setting
  const PORT = process.env.PORT || 3004;

  // Initialize and start the server
  async function startServer() {
    try {
      // Initialize application systems
      await initializeApplication();
      
      // Initialize feedback analysis service
      try {
        await feedbackAnalysisService.initialize({
          analysisInterval: 24 * 60 * 60 * 1000 // Daily analysis
        });
        console.log('Feedback Analysis Service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Feedback Analysis Service:', error);
        // Continue startup even if feedback service fails
      }
      
      // Start server with scaling configuration
      const server = app.listen(PORT, () => {
        const workerId = process.env.WORKER_ID || 'single';
        console.log(`🚀 FlexTime Scheduling System (Worker ${workerId}) running on port ${PORT}`);
        console.log(`📊 Scaling features enabled (20 Workers Per Task):`);
        console.log(`   - Compression: ${scaleConfig.server.compression.enabled}`);
        console.log(`   - Rate Limiting: ${!!scaleConfig.rateLimiting}`);
        console.log(`   - Clustering: ${scaleConfig.server.cluster.enabled}`);
        console.log(`   - Caching: ${cacheManager.config.enabled} (${cacheManager.config.maxSize} items)`);
        console.log(`   - Max Workers Per Task: ${cacheManager.maxWorkersPerTask}`);
        console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
        console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
        console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
      });

      // Configure server using extracted module
      configureServer(server, scaleConfig);
      
      // Setup graceful shutdown using extracted module
      setupGracefulShutdown(server, app);
      
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
  
  module.exports = app;
} // End of startWorker function