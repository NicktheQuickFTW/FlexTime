// FlexTime Scheduling System Entry Point
console.log('FlexTime Scheduling System Starting');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { middleware: { requestMiddleware } } = require('./tools/metrics');
const metricsRoutes = require('./src/api/metricsRoutes');
const scheduleRoutes = require('./src/api/scheduleRoutes');
const schedulingServiceRoutes = require('./src/api/schedulingServiceRoutes');
const virtualAssistantRoutes = require('./src/api/virtualAssistantRoutes');
const feedbackSystemRoutes = require('./src/api/feedbackSystemRoutes');
const visualizationRoutes = require('./src/api/visualizationRoutes');
const exportRoutes = require('./src/api/exportRoutes');
const aguiRoutes = require('./src/api/aguiRoutes');
const openaiAguiRoutes = require('./routes/openaiAguiRoutes');
const big12NewsRoutes = require('./routes/big12NewsRoutes');
const path = require('path');
const os = require('os');
const { FlexTimeAgentSystem } = require('./agents');
const neonConfig = require('./config/neon_db_config');
const { connectToDockerPostgres } = require('./utils/docker-db-connector');
const { fixSchedulesTables } = require('./scripts/fix-schedules-table');
const feedbackAnalysisService = require('./services/feedbackAnalysisService');
const scheduleService = require('./services/scheduleService');
const { registerSchedulingImprovements } = require('./integration/scheduling_improvements');
const { 
  initializeCOMPASS, 
  registerCOMPASSEndpoints, 
  integrateCOMPASSWithMetrics 
} = require('./compass');

// Create Express app
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  }
}));
app.use(cors());
app.use(express.json());
app.use(requestMiddleware); // Add metrics middleware

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

const { Sequelize } = require('sequelize');

// Database connection
async function connectToDatabase() {
  let sequelizeConnection = null;
  
  console.log('Using Neon DB configuration');
  
  // PostgreSQL Connection (Primary Database)
  try {
    // Check for Neon DB connection string
    if (process.env.NEON_DB_CONNECTION_STRING) {
      console.log('Using Neon DB connection');
      sequelizeConnection = new Sequelize(process.env.NEON_DB_CONNECTION_STRING, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      });
    } else {
      throw new Error('NEON_DB_CONNECTION_STRING environment variable is not defined');
    }
    
    await sequelizeConnection.authenticate();
    console.log('Database connection established successfully');
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
  
  return sequelizeConnection;
}

// Initialize database connection
async function setupDatabase() {
  // Skip database setup if DISABLE_DATABASE is set
  if (process.env.DISABLE_DATABASE === 'true') {
    logger.info('Database connections disabled by configuration');
    
    // Create a mock database object with minimal functionality
    const mockDb = {
      Sport: { findAll: async () => [] },
      Championship: { findAll: async () => [] },
      Team: { findAll: async () => [] },
      Institution: { findAll: async () => [] },
      Schedule: { findAll: async () => [], findByPk: async () => null },
      Game: { findAll: async () => [] },
      sequelize: { transaction: async (fn) => fn({ commit: async () => {}, rollback: async () => {} }) }
    };
    
    // Return the mock db
    return mockDb;
  }
  
  try {
    const sequelize = await connectToDatabase();
    
    // Initialize scheduling models with simplified participant models
    const Sport = require('./models/db-sport')(sequelize);
    const Championship = require('./models/db-championship')(sequelize);
    const Team = require('./models/db-team')(sequelize);
    const Institution = require('./models/db-institution')(sequelize);
    const Schedule = require('./models/db-schedule')(sequelize);
    const Game = require('./models/db-game')(sequelize);

    // Run the fix schedules table script if environment variable is set
    if (process.env.FIX_SCHEDULES_TABLE === 'true') {
      logger.info('Running fix-schedules-table script to create missing tables...');
      await fixSchedulesTables();
    }

    // Define relationships
    // [removed for brevity]

    // Sync models with database (in development)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('Database models synchronized');
    }

    // Create a database object to export
    const db = {
      sequelize,
      Sport,
      Championship,
      Team,
      Institution,
      Schedule,
      Game
    };

    // Initialize FlexTime Agent System
    const agentSystem = new FlexTimeAgentSystem({
      db,
      enableSportSpecificPatterns: process.env.ENABLE_SPORT_SPECIFIC_PATTERNS === 'true',
      enableInterSportCorrelations: process.env.ENABLE_INTER_SPORT_CORRELATIONS === 'true',
      enableSeasonalVariance: process.env.ENABLE_SEASONAL_VARIANCE === 'true',
    });

    // Make database and agent system available to routes
    app.set('db', db);
    app.set('agentSystem', agentSystem);
    
    // Initialize the schedule service
    scheduleService.initialize(db);
    
    // Register scheduling improvements
    registerSchedulingImprovements(app, agentSystem, {
      useParallelSchedulingAgent: process.env.USE_PARALLEL_SCHEDULING !== 'false',
      maxParallelOperations: parseInt(process.env.MAX_PARALLEL_OPERATIONS || '4', 10),
      generateVisualizations: process.env.GENERATE_VISUALIZATIONS !== 'false',
      generateAIInsights: process.env.GENERATE_AI_INSIGHTS !== 'false',
      debug: process.env.DEBUG_SCHEDULING === 'true'
    });
    
    // Skip COMPASS initialization in dev mode
    if (process.env.NODE_ENV !== 'development') {
      try {
        // Initialize COMPASS
        const compass = await initializeCOMPASS(app, db, {
          core: {
            refreshFrequency: parseInt(process.env.COMPASS_REFRESH_FREQUENCY || '86400000', 10), // 24 hours
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
            modelUpdateFrequency: parseInt(process.env.PREDICTIVE_MODEL_UPDATE_FREQUENCY || '86400000', 10), // 24 hours
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

    return db;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Root route handler - serves the modern frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Simple UI route (keeping for compatibility)
app.get('/simple', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// API endpoint for status check
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'FlexTime Scheduling System API',
    version: '1.0.0',
    status: 'active'
  });
});

// API Routes
app.use('/api/metrics', metricsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/scheduling-service', schedulingServiceRoutes);
app.use('/api/virtual-assistant', virtualAssistantRoutes);
app.use('/api/feedback', feedbackSystemRoutes);
app.use('/api/visualizations', visualizationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/agui', aguiRoutes);
app.use('/api/openai-agui', openaiAguiRoutes);
app.use('/api/big12-news', big12NewsRoutes);

// Initialize Advanced Metrics System
const AdvancedMetricsSystem = require('./utils/advanced_metrics_system');
const logger = require('./utils/logger');

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
logger.info('Advanced Metrics System initialized and registered');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '2.1.0' });
});

// Virtual Assistant endpoint
app.get('/virtual-assistant', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'virtual-assistant.html'));
});

// Port setting
const PORT = process.env.PORT || 3004;

// Start server
let server;

// Initialize and start the server
async function startServer() {
  try {
    // Set up database (skip on connection errors for development)
    try {
      await setupDatabase();
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, continuing without DB:', dbError.message);
    }
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
    
    // Start server
    server = app.listen(PORT, () => {
      console.log(`FlexTime Scheduling System running on port ${PORT}`);
      console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
      console.log(`🤖 OpenAI AG-UI: http://localhost:${PORT}/api/openai-agui/modify-frontend`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  if (server) {
    server.close(() => {
      // Shutdown agent system if initialized
      if (app.get('agentSystem')) {
        app.get('agentSystem').shutdown();
      }
      process.exit(1);
    });
  } else {
    // Shutdown agent system if initialized
    if (app.get('agentSystem')) {
      app.get('agentSystem').shutdown();
    }
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      // Shutdown agent system if initialized
      if (app.get('agentSystem')) {
        app.get('agentSystem').shutdown();
      }
      
      // Shutdown feedback analysis service
      try {
        feedbackAnalysisService.stop();
        console.log('Feedback Analysis Service stopped');
      } catch (error) {
        console.error('Error stopping Feedback Analysis Service:', error);
      }
      
      console.log('Process terminated!');
    });
  }
});

module.exports = app;