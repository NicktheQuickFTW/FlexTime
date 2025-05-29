/**
 * MCP Status Controller for FlexTime 2.1
 * 
 * This controller provides endpoints for monitoring the status and performance
 * of the MCP integration, including server status, model usage, and learning metrics.
 */

const express = require('express');
const router = express.Router();
const logger = require("../../utils/logger")
const MCPIntegration = require('../agents/mcp_integration');
const mcpConfig = require('../config/mcp_config');

// Initialize MCP integration
const mcpIntegration = new MCPIntegration();

/**
 * Get MCP server status
 * 
 * @route GET /api/mcp/status
 * @returns {object} Server status information
 */
router.get('/status', async (req, res) => {
  try {
    // Get server status from MCP connector
    const serverStatus = await mcpIntegration.mcpConnector.getServerStatus();
    
    return res.json({
      success: true,
      serverStatus
    });
  } catch (error) {
    logger.error(`Error getting MCP server status: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get MCP server status'
    });
  }
});

/**
 * Get model usage statistics
 * 
 * @route GET /api/mcp/model-usage
 * @param {string} timeframe - Optional timeframe filter (day, week, month)
 * @returns {object} Model usage statistics
 */
router.get('/model-usage', async (req, res) => {
  try {
    const { timeframe = 'day' } = req.query;
    
    // Get model usage from MCP connector
    const modelUsage = await mcpIntegration.mcpConnector.getModelUsage(timeframe);
    
    return res.json({
      success: true,
      timeframe,
      modelUsage
    });
  } catch (error) {
    logger.error(`Error getting model usage: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get model usage statistics'
    });
  }
});

/**
 * Get learning system metrics
 * 
 * @route GET /api/mcp/learning-metrics
 * @returns {object} Learning system metrics
 */
router.get('/learning-metrics', async (req, res) => {
  try {
    // Get learning metrics
    const metrics = await mcpIntegration.learningSystem.getMetrics();
    
    // Get feedback stats
    const feedbackStats = await mcpIntegration.learningSystem.feedbackLoop.getFeedbackStats();
    
    return res.json({
      success: true,
      metrics,
      feedbackStats
    });
  } catch (error) {
    logger.error(`Error getting learning metrics: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get learning system metrics'
    });
  }
});

/**
 * Get available models
 * 
 * @route GET /api/mcp/available-models
 * @returns {object} Available models by server
 */
router.get('/available-models', async (req, res) => {
  try {
    // Get available models from MCP connector
    const models = await mcpIntegration.mcpConnector.getAvailableModels();
    
    return res.json({
      success: true,
      models
    });
  } catch (error) {
    logger.error(`Error getting available models: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get available models'
    });
  }
});

/**
 * Get MCP configuration
 * 
 * @route GET /api/mcp/config
 * @returns {object} Current MCP configuration
 */
router.get('/config', async (req, res) => {
  try {
    // Return MCP configuration (without sensitive data)
    const config = {
      enabled: mcpConfig.enabled,
      servers: Object.keys(mcpConfig.servers).map(server => ({
        name: server,
        enabled: mcpConfig.servers[server].enabled,
        models: mcpConfig.servers[server].models
      })),
      agentModels: Object.keys(mcpConfig.agentModels).map(agent => ({
        agent,
        server: mcpConfig.agentModels[agent].server,
        model: mcpConfig.agentModels[agent].model
      }))
    };
    
    return res.json({
      success: true,
      config
    });
  } catch (error) {
    logger.error(`Error getting MCP configuration: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get MCP configuration'
    });
  }
});

/**
 * Test MCP connection
 * 
 * @route POST /api/mcp/test-connection
 * @param {string} server - Server to test
 * @returns {object} Connection test results
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { server } = req.body;
    
    if (!server) {
      return res.status(400).json({
        success: false,
        error: 'Server name is required'
      });
    }
    
    // Test connection to specified server
    const result = await mcpIntegration.mcpConnector.testConnection(server);
    
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error(`Error testing MCP connection: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to test MCP connection'
    });
  }
});

module.exports = router;
