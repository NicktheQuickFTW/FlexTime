/**
 * Test script for the enhanced MCP integration in FlexTime 2.1
 * 
 * This script tests the integration of multiple Model Context Protocol servers
 * and the learning capabilities of the FlexTime 2.1 agent system.
 */

const MCPIntegration = require('./agents/mcp_integration');
const mcpConfig = require('./config/mcp_config');
const { FlexTimeAgentSystem } = require('./agents');

// Set environment variables for testing
process.env.ENABLE_MCP = 'true';
process.env.LOG_LEVEL = 'debug';

// Test configuration
const testConfig = {
  // Override with test-specific configuration
  defaultServer: 'anthropic',
  servers: {
    anthropic: {
      enabled: true
    },
    openai: {
      enabled: true
    }
  }
};

/**
 * Test the MCP integration
 */
async function testMCPIntegration() {
  console.log('=== Testing FlexTime 2.1 MCP Integration ===');
  
  try {
    // Initialize MCP integration
    console.log('\n1. Initializing MCP Integration');
    const mcpIntegration = new MCPIntegration(testConfig);
    await mcpIntegration.initialize();
    
    // Check server availability
    console.log('\n2. Checking MCP server availability');
    const available = await mcpIntegration.mcpConnector.checkAvailability();
    console.log(`MCP servers available: ${available}`);
    
    // Get available models
    console.log('\n3. Getting available models');
    const models = await mcpIntegration.mcpConnector.getAvailableModels();
    console.log('Available models:', JSON.stringify(models, null, 2));
    
    // Test memory system
    console.log('\n4. Testing memory system');
    if (mcpIntegration.memoryManager) {
      const connected = await mcpIntegration.memoryManager.connect();
      console.log(`Memory system connected: ${connected}`);
      
      // Store test experience
      const experienceId = await mcpIntegration.storeExperience({
        agentId: 'test_agent',
        type: 'test',
        content: { message: 'This is a test experience' },
        tags: ['test', 'integration']
      });
      
      console.log(`Stored test experience with ID: ${experienceId}`);
    } else {
      console.log('Memory manager not available');
    }
    
    // Test learning system
    console.log('\n5. Testing learning system');
    const recommendations = await mcpIntegration.getRecommendations({
      sportType: 'basketball',
      teamCount: 12,
      constraintCount: 5
    });
    
    console.log('Recommendations:', JSON.stringify(recommendations, null, 2));
    
    // Test full agent system
    console.log('\n6. Testing full agent system');
    const agentSystem = new FlexTimeAgentSystem({
      enableMCP: true,
      mcpServer: 'anthropic'
    });
    
    // Get system status
    const status = await agentSystem.getSystemStatus();
    console.log('Agent system status:', JSON.stringify(status, null, 2));
    
    // Shutdown
    console.log('\n7. Shutting down');
    await agentSystem.shutdown();
    await mcpIntegration.shutdown();
    
    console.log('\n=== Test completed successfully ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testMCPIntegration().catch(error => {
  console.error('Unhandled error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
