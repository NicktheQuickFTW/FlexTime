/**
 * FlexTime API Server
 *
 * This file sets up the Express application and registers all API endpoints
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require("../../lib/logger");;
const mcpConfig = require('../../config/mcp_config');

// Import API routers
const enhancedRouter = require('./enhanced');
const notionSyncRoutes = require('../../routes/notionSyncRoutes');
const { registerConstraintAPI } = require('../constraints/v2/api/expressIntegration');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// API version prefix
const API_PREFIX = mcpConfig.api.enhanced.basePath || '/api';

// Register enhanced API endpoints
app.use(API_PREFIX, enhancedRouter);

// Register Notion sync routes
app.use(`${API_PREFIX}/notion-sync`, notionSyncRoutes);

// Register Constraint Management API v2
registerConstraintAPI(app, `${API_PREFIX}/v2/constraints`);

// API health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../../frontend/FlexTime-ui/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/FlexTime-ui/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('API Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start the server
function startServer() {
  return app.listen(PORT, () => {
    logger.info(`FlexTime API server listening on port ${PORT}`);
    logger.info(`Enhanced API endpoints registered at ${API_PREFIX}`);
  });
}

// If this file is run directly, start the server
if (require.main === module) {
  startServer();
}

// Export for testing and programmatic use
module.exports = { app, startServer };
