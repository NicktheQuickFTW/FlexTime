#!/usr/bin/env node

/**
 * Process Research to COMPASS Script
 * 
 * This script processes research outputs and integrates them into the COMPASS system.
 * Can be run standalone or scheduled as a cron job.
 */

const path = require('path');
const { Sequelize } = require('sequelize');
const ResearchCompassIntegration = require('../services/researchCompassIntegration');

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://localhost:5432/flextime', {
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: false // Set to console.log to see SQL queries
});

async function main() {
  console.log('🧭 Starting Research-to-COMPASS Integration Process');
  console.log('=' * 60);
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Initialize integration service
    const integration = new ResearchCompassIntegration(sequelize);
    await integration.initialize();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'process';
    
    switch (command) {
      case 'process':
        console.log('🔄 Processing all research files...');
        await integration.processAllResearchFiles();
        break;
        
      case 'watch':
        console.log('👀 Starting file watcher mode...');
        await integration.startFileWatcher();
        // Keep process running
        process.stdin.resume();
        break;
        
      case 'test':
        console.log('🧪 Running integration test...');
        await runIntegrationTest(integration);
        break;
        
      default:
        console.log('❓ Unknown command. Available commands:');
        console.log('   process - Process all research files once');
        console.log('   watch   - Watch for new files and process automatically');
        console.log('   test    - Run integration test');
        process.exit(1);
    }
    
    console.log('\n✅ Research-to-COMPASS integration completed successfully');
    
  } catch (error) {
    console.error('💥 Integration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (process.argv[2] !== 'watch') {
      await sequelize.close();
      process.exit(0);
    }
  }
}

async function runIntegrationTest(integration) {
  console.log('🧪 Running integration test with sample data...');
  
  // Create sample research data
  const sampleData = {
    research: {
      'Kansas': {
        history: {
          content: 'Kansas basketball program has maintained elite status with a COMPASS Rating: 96.5. The Jayhawks won their 14th consecutive Big 12 title in 2024.',
          citations: ['ESPN', 'CBS Sports'],
          timestamp: new Date().toISOString()
        },
        projections: {
          content: 'Kansas projects as a championship contender for 2025-26 with returning talent and elite recruiting.',
          citations: ['247Sports'],
          timestamp: new Date().toISOString()
        }
      }
    },
    metadata: {
      sport: 'basketball',
      completedAt: new Date().toISOString()
    }
  };
  
  // Write sample file
  const fs = require('fs').promises;
  const samplePath = path.join(integration.inputDir, 'test_research_integration.json');
  await fs.writeFile(samplePath, JSON.stringify(sampleData, null, 2));
  
  // Process the sample file
  await integration.processResearchFile('test_research_integration.json');
  
  console.log('✅ Integration test completed');
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n👋 Gracefully shutting down...');
  sequelize.close().then(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...');
  sequelize.close().then(() => {
    process.exit(0);
  });
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, runIntegrationTest };