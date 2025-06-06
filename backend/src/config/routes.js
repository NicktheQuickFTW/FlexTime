const path = require('path');

// Import all route modules
const metricsRoutes = require('../api/metricsRoutes');
const scheduleRoutes = require('../api/scheduleRoutes');
const schedulingServiceRoutes = require('../api/schedulingServiceRoutes');
const virtualAssistantRoutes = require('../api/virtualAssistantRoutes');
const feedbackSystemRoutes = require('../api/feedbackSystemRoutes');
const visualizationRoutes = require('../api/visualizationRoutes');
const exportRoutes = require('../api/exportRoutes');
const aguiRoutes = require('../api/aguiRoutes');

// Enhanced schedule routes with data endpoints
const enhancedScheduleRoutes = require('../../routes/enhancedScheduleRoutes');
const FTBuilderEngine = require('../../services/FT_Builder_Engine');
// OpenAI AGUI routes removed
// Big12 News routes removed
const researchIntegrationRoutes = require('../routes/research-integration');
const researchDocsRoutes = require('../routes/research-docs');
// const researchOrchestrationRoutes = require('../routes/research-orchestration'); // Temporarily disabled due to express-ws issues
// Collaboration routes temporarily disabled to avoid WebSocket initialization issues
// const collaborationRoutes = require('../api/collaborationRoutes');

function registerRoutes(app) {
  // Root route handler - API info instead of serving HTML
  app.get('/', (req, res) => {
    res.json({
      message: 'FlexTime Scheduling API',
      version: '2.0.0',
      status: 'active',
      frontend: 'Available at http://localhost:3001',
      documentation: '/api/docs',
      timestamp: new Date().toISOString()
    });
  });

  // Simple UI route (keeping for compatibility)
  app.get('/simple', (req, res) => {
    res.json({
      message: 'FlexTime Simple UI',
      redirect: 'http://localhost:3001',
      timestamp: new Date().toISOString()
    });
  });

  // API status endpoint
  app.get('/api/status', (req, res) => {
    res.json({ 
      message: 'FlexTime Scheduling System API',
      version: '1.0.0',
      status: 'active'
    });
  });

  // Register API routes
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/scheduling-service', schedulingServiceRoutes);
  app.use('/api/virtual-assistant', virtualAssistantRoutes);
  app.use('/api/feedback', feedbackSystemRoutes);
  app.use('/api/visualizations', visualizationRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/agui', aguiRoutes);
  // OpenAI AGUI routes endpoint removed
  // Big12 News routes endpoint removed
  
  // Research routes
  app.use('/api/research-integration', researchIntegrationRoutes);
  app.use('/api/research-docs', researchDocsRoutes);
  
  // Enhanced routes with data endpoints (IMPORTANT: Register before generic /api)
  app.use('/api', enhancedScheduleRoutes);
  
  // FT Builder specific endpoint
  app.post('/api/ft-builder/generate', async (req, res) => {
    try {
      const ftBuilder = new FTBuilderEngine({
        useHistoricalData: true,
        useLocalRecommendations: true
      });
      
      await ftBuilder.initialize();
      const result = await ftBuilder.generateSchedule(req.body);
      res.json(result);
    } catch (error) {
      console.error('FT Builder error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Health check for scheduling services
  app.get('/api/health/scheduling', (req, res) => {
    const Big12DataService = require('../../services/big12DataService');
    
    try {
      const teams = Big12DataService.getTeams({ sport_id: 2 });
      const sports = Big12DataService.getSports();
      
      res.json({
        success: true,
        status: 'healthy',
        services: {
          big12DataService: 'operational',
          teamsLoaded: teams.length,
          sportsLoaded: Object.keys(sports).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  });
  
  // Direct routes for frontend compatibility (must be LAST to avoid conflicts)
  app.use('/api', schedulingServiceRoutes);
  // app.use('/api/research-orchestration', researchOrchestrationRoutes); // Temporarily disabled due to express-ws issues
  
  // Collaboration routes temporarily disabled
  // app.use('/api', collaborationRoutes);

  // Virtual Assistant endpoint
  app.get('/virtual-assistant', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'dist', 'virtual-assistant.html'));
  });
}

module.exports = registerRoutes;