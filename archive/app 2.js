/**
 * FlexTime Scheduling Service
 * 
 * Main application entry point for the FlexTime scheduling service,
 * with integrated MCP coordination for the HELiiX platform.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeMCPCoordination, shutdownMCPCoordination } = require('./docker/mcp-integration');
const logger = require('./agents/utils/logger');

// Initialize Express application
const app = express();
const port = process.env.PORT || 3000;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize MCP Coordination System
let mcpCoordination;

// API routes
app.get('/api/status', async (req, res) => {
  try {
    const mcpStatus = mcpCoordination ? await mcpCoordination.getStatus() : { status: 'not_initialized' };
    
    res.json({
      status: 'ok',
      version: process.env.VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      mcp: mcpStatus
    });
  } catch (error) {
    logger.error(`Status endpoint error: ${error.message}`);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// MCP status endpoint
app.get('/api/mcp/status', async (req, res) => {
  try {
    if (!mcpCoordination) {
      return res.status(503).json({ 
        status: 'not_initialized',
        error: 'MCP Coordination System not initialized'
      });
    }
    
    const status = await mcpCoordination.getStatus();
    res.json(status);
  } catch (error) {
    logger.error(`MCP status endpoint error: ${error.message}`);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Import and use API routes
const schedulingRoutes = require('./routes/schedulingRoutes');
const intelligenceEngineRoutes = require('./routes/intelligenceEngineRoutes');

app.use('/api/scheduling', schedulingRoutes);
app.use('/api/intelligence-engine', intelligenceEngineRoutes);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await shutdownMCPCoordination();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await shutdownMCPCoordination();
  process.exit(0);
});

// Start the server
async function startServer() {
  try {
    // Initialize MCP Coordination System
    mcpCoordination = await initializeMCPCoordination();
    
    // Make it available to routes
    app.set('mcpCoordination', mcpCoordination);
    
    // Start listening
    app.listen(port, () => {
      logger.info(`FlexTime scheduling service listening on port ${port}`);
      logger.info(`MCP Coordination System status: ${mcpCoordination.enabled ? 'enabled' : 'disabled'}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
