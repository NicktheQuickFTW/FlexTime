#!/usr/bin/env node

/**
 * Deep Baseball Research Runner
 * Executes parallel research using 20 workers for Big 12 baseball 2025-26 preparation
 * Focuses on post-2024-25 postseason outlook
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

const ParallelResearchOrchestrator = require('../backend/services/parallelResearchOrchestrator');

// Big 12 Baseball Teams (14 teams participate in baseball)
const BIG12_BASEBALL_TEAMS = [
  'Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 
  'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

class DeepBaseballResearchRunner {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../data/research_results');
  }

  async run() {
    console.log('⚾ DEEP BASEBALL RESEARCH PIPELINE STARTING ⚾');
    console.log('=' * 60);
    console.log(`📅 Target Season: 2025-26 Preparation (Post 2024-25 Postseason)`);
    console.log(`🎯 Teams: ${BIG12_BASEBALL_TEAMS.length} Big 12 Baseball Programs`);
    console.log(`⚡ Workers: 20 Parallel Research Workers (DOUBLED!)`);
    console.log(`🔍 Research Depth: Historical + 2025-26 Projections`);
    console.log(`🏆 Context: Current 2024-25 postseason analysis`);
    console.log('=' * 60);

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Execute full research pipeline with baseball-specific focus
      const results = await this.orchestrator.executeBaseballAnalysisPipeline(BIG12_BASEBALL_TEAMS);

      // Save results
      await this.saveResults(results, 'baseball');

      // Generate summary report
      await this.generateSummaryReport(results);

      console.log('🎉 BASEBALL RESEARCH PIPELINE COMPLETED SUCCESSFULLY 🎉');
      console.log(`📊 Results saved to: ${this.outputDir}`);
      
      return results;

    } catch (error) {
      console.error('💥 BASEBALL RESEARCH PIPELINE FAILED:', error);
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
    console.log(`💾 Baseball research results saved: ${filepath}`);
    
    // Also save a "latest" version
    const latestPath = path.join(this.outputDir, 'baseball_research_latest.json');
    await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
  }

  async generateSummaryReport(results) {
    const summary = {
      sport: 'baseball',
      executionSummary: {
        timestamp: new Date().toISOString(),
        teams: results.metadata?.teams || BIG12_BASEBALL_TEAMS.length,
        totalJobs: results.metadata?.totalJobs || BIG12_BASEBALL_TEAMS.length * 2,
        duration: results.metadata?.duration || 0,
        jobsPerSecond: results.metadata?.duration ? 
          (results.metadata.totalJobs / results.metadata.duration).toFixed(2) : 'N/A'
      },
      researchCoverage: {
        teams: Object.keys(results.research || {}).length,
        historicalData: Object.keys(results.research || {}).filter(team => 
          results.research[team].history?.content
        ).length,
        projections: Object.keys(results.research || {}).filter(team => 
          results.research[team].projections?.content
        ).length,
        postseasonAnalysis: Object.keys(results.research || {}).filter(team => 
          results.research[team].history?.content?.includes('2024-25') ||
          results.research[team].projections?.content?.includes('2025-26')
        ).length
      },
      trendsAnalysis: {
        compassRatings: Object.keys(results.trends || {}).length,
        visualizations: Object.keys(results.visualizations || {}).length
      },
      qualityMetrics: {
        averageContentLength: this.calculateAverageContentLength(results.research || {}),
        citationCount: this.countTotalCitations(results.research || {}),
        completionRate: this.calculateCompletionRate(results)
      }
    };

    const summaryPath = path.join(this.outputDir, 'baseball_research_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('📈 BASEBALL RESEARCH SUMMARY:');
    console.log(`   ⚾ Teams analyzed: ${summary.researchCoverage.teams}`);
    console.log(`   📊 Historical datasets: ${summary.researchCoverage.historicalData}`);
    console.log(`   🔮 Projection models: ${summary.researchCoverage.projections}`);
    console.log(`   🏆 Postseason analysis: ${summary.researchCoverage.postseasonAnalysis}`);
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
    const expectedJobs = (results.metadata?.teams || BIG12_BASEBALL_TEAMS.length) * 2;
    const completedJobs = Object.values(results.research || {}).reduce((count, team) => {
      return count + (team.history ? 1 : 0) + (team.projections ? 1 : 0);
    }, 0);
    return expectedJobs > 0 ? ((completedJobs / expectedJobs) * 100).toFixed(1) : '0.0';
  }
}

// CLI execution
if (require.main === module) {
  const runner = new DeepBaseballResearchRunner();
  
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'all':
      runner.run().catch(console.error);
      break;
    default:
      console.log('Usage: node run-deep-baseball-research.js [all]');
      console.log('');
      console.log('Commands:');
      console.log('  all        - Research all 14 Big 12 baseball teams');
      break;
  }
}

module.exports = DeepBaseballResearchRunner;