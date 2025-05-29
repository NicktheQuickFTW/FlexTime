#!/usr/bin/env node

/**
 * Deep Basketball Research Runner
 * Executes parallel research using 10+ workers for 5x speed improvement
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

const ParallelResearchOrchestrator = require('../backend/services/parallelResearchOrchestrator');

// Big 12 Teams
const BIG12_TEAMS = [
  'Kansas', 'Houston', 'Iowa State', 'Baylor', 'Texas Tech',
  'Arizona', 'BYU', 'Arizona State', 'TCU', 'Kansas State',
  'Cincinnati', 'Colorado', 'Utah', 'UCF', 'Oklahoma State', 'West Virginia'
];

class DeepBasketballResearchRunner {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../data/research_results');
  }

  async run() {
    console.log('🏀 DEEP BASKETBALL RESEARCH PIPELINE STARTING 🏀');
    console.log('=' * 60);
    console.log(`📅 Target Season: 2025-26 Preparation`);
    console.log(`🎯 Teams: ${BIG12_TEAMS.length} Big 12 Programs`);
    console.log(`⚡ Workers: 20 Parallel Research Workers (DOUBLED!)`);
    console.log(`🔍 Research Depth: Comprehensive Historical + Projections`);
    console.log('=' * 60);

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Execute full research pipeline
      const results = await this.orchestrator.executeFullAnalysisPipeline(BIG12_TEAMS);

      // Save results
      await this.saveResults(results);

      // Generate summary report
      await this.generateSummaryReport(results);

      console.log('🎉 RESEARCH PIPELINE COMPLETED SUCCESSFULLY 🎉');
      console.log(`📊 Results saved to: ${this.outputDir}`);
      
      return results;

    } catch (error) {
      console.error('💥 RESEARCH PIPELINE FAILED:', error);
      throw error;
    }
  }

  async runTeamBatch(teams, batchName = 'custom') {
    console.log(`🔄 Running research batch: ${batchName}`);
    console.log(`📋 Teams: ${teams.join(', ')}`);
    
    const results = await this.orchestrator.executeFullAnalysisPipeline(teams);
    
    await this.saveResults(results, batchName);
    
    console.log(`✅ Batch ${batchName} completed`);
    return results;
  }

  async runEliteTeamsFirst() {
    const eliteTeams = ['Kansas', 'Houston', 'Iowa State'];
    return await this.runTeamBatch(eliteTeams, 'elite_tier');
  }

  async runRisingTeams() {
    const risingTeams = ['Arizona', 'Texas Tech', 'BYU'];
    return await this.runTeamBatch(risingTeams, 'rising_tier');
  }

  async runSolidTeams() {
    const solidTeams = ['Baylor', 'Kansas State', 'TCU'];
    return await this.runTeamBatch(solidTeams, 'solid_tier');
  }

  async runDevelopingTeams() {
    const developingTeams = ['UCF', 'Colorado', 'Cincinnati', 'Oklahoma State', 'Utah'];
    return await this.runTeamBatch(developingTeams, 'developing_tier');
  }

  async runRebuildingTeams() {
    const rebuildingTeams = ['Arizona State', 'West Virginia'];
    return await this.runTeamBatch(rebuildingTeams, 'rebuilding_tier');
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
      `basketball_research_${suffix}_${timestamp}.json` : 
      `basketball_research_${timestamp}.json`;
    
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    console.log(`💾 Research results saved: ${filepath}`);
    
    // Also save a "latest" version
    const latestPath = path.join(this.outputDir, 'basketball_research_latest.json');
    await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
  }

  async generateSummaryReport(results) {
    const summary = {
      executionSummary: {
        timestamp: new Date().toISOString(),
        teams: results.metadata.teams,
        totalJobs: results.metadata.totalJobs,
        duration: results.metadata.duration,
        jobsPerSecond: (results.metadata.totalJobs / results.metadata.duration).toFixed(2)
      },
      researchCoverage: {
        teams: Object.keys(results.research).length,
        historicalData: Object.keys(results.research).filter(team => 
          results.research[team].history?.content
        ).length,
        projections: Object.keys(results.research).filter(team => 
          results.research[team].projections?.content
        ).length
      },
      trendsAnalysis: {
        compassRatings: Object.keys(results.trends).length,
        visualizations: Object.keys(results.visualizations).length
      },
      qualityMetrics: {
        averageContentLength: this.calculateAverageContentLength(results.research),
        citationCount: this.countTotalCitations(results.research),
        completionRate: this.calculateCompletionRate(results)
      }
    };

    const summaryPath = path.join(this.outputDir, 'research_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('📈 RESEARCH SUMMARY:');
    console.log(`   🏀 Teams analyzed: ${summary.researchCoverage.teams}`);
    console.log(`   📊 Historical datasets: ${summary.researchCoverage.historicalData}`);
    console.log(`   🔮 Projection models: ${summary.researchCoverage.projections}`);
    console.log(`   ⚡ Processing speed: ${summary.executionSummary.jobsPerSecond} jobs/sec`);
    console.log(`   📄 Avg content length: ${summary.qualityMetrics.averageContentLength} chars`);
    console.log(`   🔗 Total citations: ${summary.qualityMetrics.citationCount}`);
    console.log(`   ✅ Completion rate: ${summary.qualityMetrics.completionRate}%`);
  }

  calculateAverageContentLength(research) {
    const contents = [];
    Object.values(research).forEach(team => {
      if (team.history?.content) contents.push(team.history.content.length);
      if (team.projections?.content) contents.push(team.projections.content.length);
    });
    return contents.length > 0 ? Math.round(contents.reduce((a, b) => a + b, 0) / contents.length) : 0;
  }

  countTotalCitations(research) {
    let total = 0;
    Object.values(research).forEach(team => {
      if (team.history?.citations) total += team.history.citations.length;
      if (team.projections?.citations) total += team.projections.citations.length;
    });
    return total;
  }

  calculateCompletionRate(results) {
    const expectedJobs = results.metadata.teams * 2; // history + projections
    const completedJobs = Object.values(results.research).reduce((count, team) => {
      return count + (team.history ? 1 : 0) + (team.projections ? 1 : 0);
    }, 0);
    return ((completedJobs / expectedJobs) * 100).toFixed(1);
  }

  async getWorkerStatus() {
    return this.orchestrator.getJobStatus();
  }
}

// CLI execution
if (require.main === module) {
  const runner = new DeepBasketballResearchRunner();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'all':
      runner.run().catch(console.error);
      break;
    case 'elite':
      runner.runEliteTeamsFirst().catch(console.error);
      break;
    case 'rising':
      runner.runRisingTeams().catch(console.error);
      break;
    case 'solid':
      runner.runSolidTeams().catch(console.error);
      break;
    case 'developing':
      runner.runDevelopingTeams().catch(console.error);
      break;
    case 'rebuilding':
      runner.runRebuildingTeams().catch(console.error);
      break;
    case 'status':
      runner.getWorkerStatus().then(console.log).catch(console.error);
      break;
    default:
      console.log('Usage: node run-deep-basketball-research.js [all|elite|rising|solid|developing|rebuilding|status]');
      console.log('');
      console.log('Commands:');
      console.log('  all        - Research all 16 Big 12 teams');
      console.log('  elite      - Research elite tier teams (Kansas, Houston, Iowa State)');
      console.log('  rising     - Research rising teams (Arizona, Texas Tech, BYU)');
      console.log('  solid      - Research solid teams (Baylor, Kansas State, TCU)');
      console.log('  developing - Research developing teams (UCF, Colorado, Cincinnati, Oklahoma State, Utah)');
      console.log('  rebuilding - Research rebuilding teams (Arizona State, West Virginia)');
      console.log('  status     - Show worker status');
      break;
  }
}

module.exports = DeepBasketballResearchRunner;