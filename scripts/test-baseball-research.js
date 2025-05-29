#!/usr/bin/env node

/**
 * Test Baseball Research - Limited Teams
 * Test run with 3 teams to verify pipeline works
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

const ParallelResearchOrchestrator = require('../backend/services/parallelResearchOrchestrator');

// Test with elite baseball programs first
const TEST_BASEBALL_TEAMS = ['Texas Tech', 'Oklahoma State', 'TCU'];

class TestBaseballResearchRunner {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../data/research_results');
  }

  async run() {
    console.log('⚾ TEST BASEBALL RESEARCH PIPELINE ⚾');
    console.log('=' * 50);
    console.log(`🎯 Testing with: ${TEST_BASEBALL_TEAMS.join(', ')}`);
    console.log('=' * 50);

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      console.log('🔄 Starting baseball research phase...');
      const startTime = Date.now();
      
      // Execute baseball research only (skip trends for test)
      const researchResults = await this.orchestrator.executeBaseballParallelResearch(TEST_BASEBALL_TEAMS);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`✅ Research completed in ${duration.toFixed(1)} seconds`);
      
      // Save test results
      const results = {
        research: researchResults,
        metadata: {
          teams: TEST_BASEBALL_TEAMS.length,
          totalJobs: TEST_BASEBALL_TEAMS.length * 2,
          duration: duration,
          completedAt: new Date().toISOString(),
          sport: 'baseball',
          testRun: true
        }
      };
      
      await this.saveResults(results, 'baseball_test');
      
      console.log('🎉 TEST COMPLETED SUCCESSFULLY 🎉');
      return results;

    } catch (error) {
      console.error('💥 TEST FAILED:', error);
      throw error;
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  async saveResults(results, suffix = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = suffix ? 
      `baseball_research_${suffix}_${timestamp}.json` : 
      `baseball_research_${timestamp}.json`;
    
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    console.log(`💾 Test results saved: ${filepath}`);
  }
}

// Run the test
if (require.main === module) {
  const runner = new TestBaseballResearchRunner();
  runner.run().catch(console.error);
}

module.exports = TestBaseballResearchRunner;