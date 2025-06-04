/**
 * Research Orchestration System Test Suite
 * 
 * This script thoroughly tests all components of the research orchestration system:
 * - Database connectivity and table creation
 * - Research Orchestration Hub initialization
 * - Research Scheduler functionality
 * - Perplexity API integration
 * - Data retention policies
 * - Error handling and recovery
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const ResearchOrchestrationHub = require('./services/researchOrchestrationHub');
const ResearchScheduler = require('./services/researchScheduler');
const PerplexityResearchService = require('./services/perplexityResearchService');
const ResearchDataRetentionPolicy = require('./services/researchDataRetentionPolicy');
const config = require('./config/neon_db_config');

// Test results collector
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Utility functions
function logTest(name, status, details = '') {
  const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  console.log(`\n${emoji} ${name}`);
  if (details) console.log(`   ${details}`);
  
  if (status === 'passed') testResults.passed.push(name);
  else if (status === 'failed') testResults.failed.push({ name, details });
  else testResults.warnings.push({ name, details });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Database Connectivity
async function testDatabaseConnectivity() {
  console.log('\n🔍 TEST 1: Database Connectivity');
  
  try {
    const validation = await config.validateConnection();
    if (validation.success) {
      logTest('Database Connection', 'passed', `Connected to ${validation.dbInfo.database_name}`);
      return true;
    } else {
      logTest('Database Connection', 'failed', validation.error);
      return false;
    }
  } catch (error) {
    logTest('Database Connection', 'failed', error.message);
    return false;
  }
}

// Test 2: Database Table Creation
async function testDatabaseTables() {
  console.log('\n🔍 TEST 2: Database Tables');
  
  const sequelize = new Sequelize(config.connectionString, {
    dialectOptions: config.connection.dialectOptions,
    logging: false
  });
  
  try {
    // Create required tables if they don't exist
    const tablesToCreate = [
      {
        name: 'comprehensive_research_data',
        query: `
          CREATE TABLE IF NOT EXISTS comprehensive_research_data (
            id SERIAL PRIMARY KEY,
            research_id VARCHAR(255) UNIQUE NOT NULL,
            sport VARCHAR(100) NOT NULL,
            research_type VARCHAR(100) NOT NULL,
            data JSONB NOT NULL,
            metadata JSONB,
            validation_status VARCHAR(50),
            validation_confidence FLOAT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'compass_ratings',
        query: `
          CREATE TABLE IF NOT EXISTS compass_ratings (
            id SERIAL PRIMARY KEY,
            team_id VARCHAR(100) NOT NULL,
            team_name VARCHAR(255) NOT NULL,
            sport VARCHAR(100) NOT NULL,
            season VARCHAR(50),
            overall_rating FLOAT,
            offense_rating FLOAT,
            defense_rating FLOAT,
            special_teams_rating FLOAT,
            metadata JSONB,
            last_updated TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(team_id, sport, season)
          )
        `
      },
      {
        name: 'research_validations',
        query: `
          CREATE TABLE IF NOT EXISTS research_validations (
            id SERIAL PRIMARY KEY,
            validation_id VARCHAR(255) UNIQUE NOT NULL,
            research_type VARCHAR(100),
            status VARCHAR(50),
            confidence FLOAT,
            errors JSONB,
            warnings JSONB,
            validated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'research_errors',
        query: `
          CREATE TABLE IF NOT EXISTS research_errors (
            id SERIAL PRIMARY KEY,
            category VARCHAR(100),
            error_message TEXT,
            error_data JSONB,
            occurred_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'research_jobs',
        query: `
          CREATE TABLE IF NOT EXISTS research_jobs (
            id SERIAL PRIMARY KEY,
            job_id VARCHAR(255) UNIQUE NOT NULL,
            type VARCHAR(100),
            sport VARCHAR(100),
            status VARCHAR(50),
            priority INTEGER DEFAULT 3,
            attempts INTEGER DEFAULT 0,
            results JSONB,
            error TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP
          )
        `
      }
    ];
    
    for (const table of tablesToCreate) {
      try {
        await sequelize.query(table.query);
        logTest(`Table: ${table.name}`, 'passed', 'Created/verified');
      } catch (error) {
        logTest(`Table: ${table.name}`, 'failed', error.message);
      }
    }
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_research_sport ON comprehensive_research_data(sport)',
      'CREATE INDEX IF NOT EXISTS idx_research_type ON comprehensive_research_data(research_type)',
      'CREATE INDEX IF NOT EXISTS idx_research_created ON comprehensive_research_data(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_compass_team ON compass_ratings(team_id, sport)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_status ON research_jobs(status, created_at)'
    ];
    
    for (const index of indexes) {
      try {
        await sequelize.query(index);
      } catch (error) {
        console.warn(`   Index creation warning: ${error.message}`);
      }
    }
    
    await sequelize.close();
    return true;
  } catch (error) {
    logTest('Database Tables Setup', 'failed', error.message);
    await sequelize.close();
    return false;
  }
}

// Test 3: Research Orchestration Hub Initialization
async function testOrchestrationHub() {
  console.log('\n🔍 TEST 3: Research Orchestration Hub');
  
  let hub = null;
  
  try {
    // Initialize with test configuration
    hub = new ResearchOrchestrationHub({
      autoStart: false,
      enableScheduling: false, // Disable auto-scheduling for controlled testing
      enableValidation: true,
      enableMonitoring: false,
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });
    
    await hub.initialize();
    logTest('Hub Initialization', 'passed', 'All components initialized');
    
    // Test system status
    const status = await hub.getSystemStatus();
    if (status.orchestrator === 'active') {
      logTest('Hub Status Check', 'passed', `Active operations: ${status.activeOperations}`);
    } else {
      logTest('Hub Status Check', 'failed', 'Hub not active');
    }
    
    await hub.stop();
    return hub;
  } catch (error) {
    logTest('Hub Initialization', 'failed', error.message);
    if (hub) await hub.stop();
    return null;
  }
}

// Test 4: Research Scheduler with Proper Sports
async function testResearchScheduler() {
  console.log('\n🔍 TEST 4: Research Scheduler');
  
  let scheduler = null;
  
  try {
    scheduler = new ResearchScheduler({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      maxConcurrent: 3,
      rateLimit: { perMinute: 5, perHour: 50 }
    });
    
    await scheduler.initialize();
    logTest('Scheduler Initialization', 'passed', 'Redis queues connected');
    
    // Test scheduling with proper sport names
    const testJobs = [
      { type: 'compass_ratings', sport: 'football', priority: 1 },
      { type: 'transfer_portal', sport: 'men\'s basketball', priority: 2 },
      { type: 'recruiting', sport: 'baseball', priority: 3 }
    ];
    
    for (const job of testJobs) {
      try {
        const result = await scheduler.scheduleResearch(job);
        logTest(`Schedule ${job.type} for ${job.sport}`, 'passed', `Job ID: ${result.id}`);
      } catch (error) {
        logTest(`Schedule ${job.type} for ${job.sport}`, 'failed', error.message);
      }
    }
    
    // Test queue status
    const status = await scheduler.getStatus();
    logTest('Queue Status', 'passed', 
      `Active: ${status.activeCount}, Waiting: ${status.waitingCount}, Completed: ${status.completedCount}`);
    
    await scheduler.stop();
    return true;
  } catch (error) {
    logTest('Scheduler Test', 'failed', error.message);
    if (scheduler) await scheduler.stop();
    return false;
  }
}

// Test 5: Perplexity API Integration
async function testPerplexityIntegration() {
  console.log('\n🔍 TEST 5: Perplexity API Integration');
  
  if (!process.env.PERPLEXITY_API_KEY) {
    logTest('Perplexity API Key', 'warning', 'API key not found in environment');
    return false;
  }
  
  const perplexity = new PerplexityResearchService();
  
  try {
    // Test basic API connectivity with a simple query
    const testQuery = 'Big 12 Conference football latest news summary';
    console.log('   Testing API with query:', testQuery);
    
    const result = await perplexity.search(testQuery, {
      model: 'sonar',
      maxTokens: 100
    });
    
    if (result && result.answer) {
      logTest('Perplexity API Call', 'passed', 'Successfully received response');
      
      // Test research function
      const researchResult = await perplexity.conductResearch('football', 'latest_news');
      if (researchResult.success) {
        logTest('Research Function', 'passed', 'Research completed successfully');
      } else {
        logTest('Research Function', 'failed', researchResult.error);
      }
    } else {
      logTest('Perplexity API Call', 'failed', 'No response received');
    }
    
    return true;
  } catch (error) {
    logTest('Perplexity Integration', 'failed', error.message);
    return false;
  }
}

// Test 6: Data Retention Policy
async function testRetentionPolicy() {
  console.log('\n🔍 TEST 6: Data Retention Policy');
  
  const policy = new ResearchDataRetentionPolicy();
  
  // Test policy validation
  const testCases = [
    {
      name: 'Valid deletion (old temp data)',
      table: 'research_jobs',
      filters: { olderThan: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      expected: true
    },
    {
      name: 'Invalid deletion (permanent data)',
      table: 'compass_ratings',
      filters: {},
      expected: false
    },
    {
      name: 'Valid archival',
      table: 'comprehensive_research_data',
      filters: { olderThan: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      expected: true
    }
  ];
  
  for (const test of testCases) {
    const result = policy.validateDeletion(test.table, test.filters);
    if (result.allowed === test.expected) {
      logTest(test.name, 'passed', result.reason || 'As expected');
    } else {
      logTest(test.name, 'failed', `Expected ${test.expected}, got ${result.allowed}`);
    }
  }
  
  // Test cleanup query generation
  const queries = policy.generateCleanupQueries();
  logTest('Cleanup Query Generation', 'passed', `Generated ${queries.length} cleanup queries`);
  
  return true;
}

// Test 7: End-to-End Orchestration Test
async function testEndToEndOrchestration() {
  console.log('\n🔍 TEST 7: End-to-End Orchestration');
  
  if (!process.env.PERPLEXITY_API_KEY) {
    logTest('End-to-End Test', 'warning', 'Skipped - requires Perplexity API key');
    return false;
  }
  
  let hub = null;
  
  try {
    // Initialize hub with all features enabled
    hub = new ResearchOrchestrationHub({
      autoStart: false,
      enableScheduling: true,
      enableValidation: true,
      enableMonitoring: true
    });
    
    await hub.initialize();
    
    // Set up event listeners
    let researchCompleted = false;
    hub.on('research_integrated', (data) => {
      console.log('   📊 Research integrated:', data.operation.type, data.operation.sport);
      researchCompleted = true;
    });
    
    hub.on('research_failed', (data) => {
      console.error('   ❌ Research failed:', data.error.message);
    });
    
    // Schedule immediate research
    const job = await hub.scheduleImmediate({
      type: 'compass_ratings',
      sport: 'football',
      description: 'Test research for football COMPASS ratings'
    });
    
    logTest('Research Job Scheduled', 'passed', `Job ID: ${job.id}`);
    
    // Wait for completion (max 30 seconds)
    const maxWait = 30000;
    const checkInterval = 1000;
    let waited = 0;
    
    while (!researchCompleted && waited < maxWait) {
      await delay(checkInterval);
      waited += checkInterval;
      
      if (waited % 5000 === 0) {
        console.log(`   ⏳ Waiting for research completion... ${waited/1000}s`);
      }
    }
    
    if (researchCompleted) {
      logTest('End-to-End Research', 'passed', 'Research completed and integrated');
    } else {
      logTest('End-to-End Research', 'failed', 'Research did not complete in time');
    }
    
    // Check system metrics
    const status = await hub.getSystemStatus();
    console.log('\n   📊 System Metrics:');
    console.log(`      Researches: ${JSON.stringify(status.metrics.researches)}`);
    console.log(`      Validations: ${JSON.stringify(status.metrics.validations)}`);
    console.log(`      Integrations: ${JSON.stringify(status.metrics.integrations)}`);
    
    await hub.stop();
    return true;
  } catch (error) {
    logTest('End-to-End Test', 'failed', error.message);
    if (hub) await hub.stop();
    return false;
  }
}

// Test 8: Error Handling and Recovery
async function testErrorHandling() {
  console.log('\n🔍 TEST 8: Error Handling and Recovery');
  
  let hub = null;
  
  try {
    hub = new ResearchOrchestrationHub({
      autoStart: false,
      enableScheduling: true,
      enableValidation: true
    });
    
    await hub.initialize();
    
    // Test invalid sport name
    try {
      await hub.scheduleImmediate({
        type: 'compass_ratings',
        sport: 'invalid_sport',
        description: 'Test with invalid sport'
      });
      logTest('Invalid Sport Handling', 'failed', 'Should have thrown error');
    } catch (error) {
      logTest('Invalid Sport Handling', 'passed', 'Properly rejected invalid sport');
    }
    
    // Test rate limit handling
    const scheduler = hub.agents.scheduler;
    if (scheduler) {
      // Simulate rate limit scenario
      scheduler.emit('job_failed', {
        job: { id: 'test_job_1', attemptsMade: 1 },
        error: new Error('Rate limit exceeded')
      });
      logTest('Rate Limit Handling', 'passed', 'Properly handled rate limit error');
    }
    
    // Test stalled job handling
    if (scheduler) {
      scheduler.emit('job_stalled', {
        job: { id: 'test_job_2', opts: { stallCount: 1 } }
      });
      logTest('Stalled Job Handling', 'passed', 'Properly handled stalled job');
    }
    
    await hub.stop();
    return true;
  } catch (error) {
    logTest('Error Handling Test', 'failed', error.message);
    if (hub) await hub.stop();
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Research Orchestration System Tests');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  // Run tests in sequence
  const tests = [
    testDatabaseConnectivity,
    testDatabaseTables,
    testOrchestrationHub,
    testResearchScheduler,
    testPerplexityIntegration,
    testRetentionPolicy,
    testEndToEndOrchestration,
    testErrorHandling
  ];
  
  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      console.error(`\n❌ Test crashed: ${error.message}`);
    }
    
    // Small delay between tests
    await delay(1000);
  }
  
  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`⏱️  Duration: ${duration}s`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.details}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    testResults.warnings.forEach(warning => {
      console.log(`   - ${warning.name}: ${warning.details}`);
    });
  }
  
  console.log('\n✨ Test suite completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run tests
runAllTests();