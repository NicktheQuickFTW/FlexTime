/**
 * Test script to check if the MCP server is up and running
 */

const axios = require('axios');
const logger = require('./agents/utils/logger');

async function testMCPConnection() {
  try {
    // Check if MCP is enabled
    const enableMCP = process.env.ENABLE_MCP === 'true';
    logger.info(`MCP enabled: ${enableMCP}`);
    
    if (!enableMCP) {
      logger.info('MCP is not enabled in the environment. Set ENABLE_MCP=true to enable it.');
      return;
    }
    
    // Get MCP server URL from environment
    const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000/api';
    const apiKey = process.env.MCP_API_KEY;
    
    logger.info(`Testing MCP server connection to ${serverUrl}...`);
    
    // Create HTTP client
    const client = axios.create({
      baseURL: serverUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : undefined
      }
    });
    
    // Check if MCP server is available
    try {
      const response = await client.get('/status');
      const isAvailable = response.data.status === 'ok';
      
      if (isAvailable) {
        logger.info('✅ MCP server is up and running!');
        
        // Get available models
        try {
          const modelsResponse = await client.get('/models');
          logger.info(`Available models: ${JSON.stringify(modelsResponse.data.models)}`);
        } catch (error) {
          logger.error(`Failed to get available models: ${error.message}`);
        }
      } else {
        logger.error('❌ MCP server is available but returned non-OK status');
      }
    } catch (error) {
      logger.error(`❌ MCP server is not available: ${error.message}`);
      
      // Check environment variables
      logger.info(`MCP_SERVER_URL: ${process.env.MCP_SERVER_URL || 'not set'}`);
      logger.info(`ENABLE_MCP: ${process.env.ENABLE_MCP || 'not set'}`);
    }
  } catch (error) {
    logger.error(`Error during MCP test: ${error.message}`);
    if (error.stack) {
      logger.error(error.stack);
    }
  }
}

// Run the test
testMCPConnection().catch(error => {
  logger.error(`Test failed: ${error.message}`);
  if (error.stack) {
    logger.error(error.stack);
  }
});
