#!/usr/bin/env node

/**
 * FlexTime API Gateway Startup Script
 * 
 * Main entry point for the FlexTime API Gateway service
 */

const { initializeGateway, GatewayMonitor } = require('./gateway-config');

async function start() {
  try {
    console.log('🚀 Starting FlexTime API Gateway...');
    
    // Initialize the gateway
    const gateway = await initializeGateway();
    
    // Start the gateway server
    const server = await gateway.start();
    
    // Initialize monitoring
    const monitor = new GatewayMonitor(gateway);
    monitor.startMonitoring(30000); // Check every 30 seconds
    
    console.log('✅ FlexTime API Gateway started successfully');
    console.log('📊 Monitoring active');
    
    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('📴 Shutting down FlexTime API Gateway...');
      
      server.close(async () => {
        await gateway.stop();
        console.log('✅ Gateway shutdown complete');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('📴 Shutting down FlexTime API Gateway...');
      
      server.close(async () => {
        await gateway.stop();
        console.log('✅ Gateway shutdown complete');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start FlexTime API Gateway:', error);
    process.exit(1);
  }
}

// Start if this script is run directly
if (require.main === module) {
  start();
}

module.exports = { start };