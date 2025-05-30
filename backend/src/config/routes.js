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
const openaiAguiRoutes = require('../../routes/openaiAguiRoutes');
const big12NewsRoutes = require('../../routes/big12NewsRoutes');
const researchIntegrationRoutes = require('../../routes/research-integration');
const researchDocsRoutes = require('../../routes/research-docs');
const researchOrchestrationRoutes = require('../../routes/research-orchestration');

function registerRoutes(app) {
  // Root route handler - serves the modern frontend
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', '..', 'frontend', 'index.html'));
  });

  // Simple UI route (keeping for compatibility)
  app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', '..', 'frontend', 'index.html'));
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
  app.use('/api/openai-agui', openaiAguiRoutes);
  app.use('/api/big12-news', big12NewsRoutes);
  
  // Research routes
  app.use('/api/research-integration', researchIntegrationRoutes);
  app.use('/api/research-docs', researchDocsRoutes);
  app.use('/api/research-orchestration', researchOrchestrationRoutes);

  // Virtual Assistant endpoint
  app.get('/virtual-assistant', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'dist', 'virtual-assistant.html'));
  });
}

module.exports = registerRoutes;