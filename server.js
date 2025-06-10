/**
 * FlexTime - Independent Sports Scheduling Application Server
 * 
 * Express server that provides API endpoints for the FlexTime frontend
 * and integrates with the FlexTime scheduling engine.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import FT Builder core
const FTBuilder = require('./core/FT_Builder_Ultimate.js');
const FTBuilderAPI = require('./api/FTBuilderAPI.js');
const aiRoutes = require('./api/routes/ai-scheduling-routes.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize FT Builder Engine
const ftBuilder = new FTBuilder({
  // Configuration options
  useHistoricalData: true,
  useAdaptiveOptimization: true,
  enableRealTimeSync: true
});

// Initialize and configure API
const ftBuilderAPI = new FTBuilderAPI({ ftBuilder });
ftBuilderAPI.setEngine(ftBuilder);

// Mount AI routes first (more specific routes should come first)
app.use('/api/ai', aiRoutes);

// Mount main API routes
app.use('/api', ftBuilderAPI.getApp());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'FT Builder'
  });
});

// Serve static files from frontend build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FT Builder server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🎨 Frontend (dev): http://localhost:3000`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;