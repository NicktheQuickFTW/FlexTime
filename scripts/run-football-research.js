#!/usr/bin/env node

/**
 * Big 12 Football Research
 * Dedicated football analysis for all 16 teams with 2025-26 projections
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

const ParallelResearchOrchestrator = require('../backend/services/parallelResearchOrchestrator');

// All 16 Big 12 Football Teams
const BIG12_FOOTBALL_TEAMS = [
  'Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
  'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

class Big12FootballResearcher {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../data/research_results');
  }

  async run() {
    console.log('🏈 BIG 12 FOOTBALL RESEARCH PIPELINE 🏈');
    console.log('=' * 60);
    console.log(`🎯 Teams: ${BIG12_FOOTBALL_TEAMS.length} Big 12 Football Programs`);
    console.log(`⚡ Workers: 20 Parallel Research Workers`);
    console.log(`🔍 Research: Historical + 2025-26 Projections + COMPASS`);
    console.log(`🏆 Focus: Championship potential and recruiting analysis`);
    console.log('=' * 60);

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      const pipelineStart = Date.now();
      
      // Step 1: Football parallel research
      console.log('🔄 Step 1: Executing football parallel research...');
      const researchResults = await this.executeFootballParallelResearch(BIG12_FOOTBALL_TEAMS);
      
      // Step 2: Sequential trends analysis (conservative approach)
      console.log('🔄 Step 2: Generating football trends sequentially...');
      const trendsData = await this.generateFootballTrendsSequentially(researchResults);
      
      // Step 3: Visualization data
      console.log('🔄 Step 3: Generating visualization data...');
      const visualizationData = await this.generateFootballVisualizationData(trendsData);
      
      const pipelineEnd = Date.now();
      const totalDuration = (pipelineEnd - pipelineStart) / 1000;
      
      const results = {
        research: researchResults,
        trends: trendsData,
        visualizations: visualizationData,
        metadata: {
          teams: BIG12_FOOTBALL_TEAMS.length,
          totalJobs: BIG12_FOOTBALL_TEAMS.length * 2,
          duration: totalDuration,
          completedAt: new Date().toISOString(),
          sport: 'football'
        }
      };
      
      // Save results
      await this.saveResults(results);
      
      // Generate summary report
      await this.generateSummaryReport(results);
      
      console.log(`🎉 FOOTBALL PIPELINE COMPLETED in ${totalDuration.toFixed(1)} seconds 🎉`);
      return results;

    } catch (error) {
      console.error('💥 FOOTBALL PIPELINE FAILED:', error);
      throw error;
    }
  }

  async executeFootballParallelResearch(teams) {
    const startTime = Date.now();
    console.log(`🏈 Starting football parallel research for ${teams.length} teams`);
    
    // Create football-specific job queue
    const jobs = [];
    teams.forEach(team => {
      jobs.push({
        id: `${team}-history`,
        team: team,
        type: 'football_history',
        priority: this.getFootballTeamPriority(team),
        status: 'queued'
      });
      jobs.push({
        id: `${team}-projections`,
        team: team,
        type: 'football_projections',
        priority: this.getFootballTeamPriority(team),
        status: 'queued'
      });
    });

    // Sort by priority (elite programs first)
    jobs.sort((a, b) => b.priority - a.priority);
    
    console.log(`📊 Created ${jobs.length} football research jobs`);
    
    // Execute jobs in parallel batches
    const results = await this.processFootballBatchedJobs(jobs);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Football research completed in ${duration.toFixed(1)} seconds`);
    console.log(`⚡ Processing rate: ${(jobs.length / duration).toFixed(2)} jobs/second`);
    
    return results;
  }

  async processFootballBatchedJobs(jobs) {
    const results = {};
    const batchSize = 20; // Use full worker capacity
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      console.log(`🔄 Processing football batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} jobs)`);
      
      const batchPromises = batch.map((job, index) => 
        this.executeFootballJob(job, index % this.orchestrator.perplexityWorkers.length)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const job = batch[index];
        if (result.status === 'fulfilled') {
          if (!results[job.team]) results[job.team] = {};
          const resultType = job.type.replace('football_', '');
          results[job.team][resultType] = result.value;
          console.log(`✅ ${job.team} ${resultType} completed`);
        } else {
          console.error(`❌ ${job.team} ${job.type} failed:`, result.reason?.message);
        }
      });
      
      // Brief pause between batches
      if (i + batchSize < jobs.length) {
        await this.sleep(1000);
      }
    }
    
    return results;
  }

  async executeFootballJob(job, workerIndex) {
    const { team, type } = job;
    
    try {
      const worker = this.orchestrator.perplexityWorkers[workerIndex];
      
      if (type === 'football_history') {
        return await worker.researchFootballTeamHistory(team);
      } else if (type === 'football_projections') {
        return await worker.researchFootballTeamProjections(team);
      }
    } catch (error) {
      console.error(`Football worker ${workerIndex} failed for ${team} ${type}:`, error.message);
      throw error;
    }
  }

  async generateFootballTrendsSequentially(researchResults) {
    console.log('📈 Generating football trends sequentially...');
    
    const teams = Object.keys(researchResults);
    const trends = {};
    
    for (const team of teams) {
      try {
        console.log(`📊 Processing ${team} football trends...`);
        const worker = this.orchestrator.geminiWorkers[0];
        
        const teamData = researchResults[team];
        const analysis = await worker.generateFootballCompassRatings(teamData, teamData.history);
        
        trends[team] = analysis;
        console.log(`📊 ${team} football trends completed`);
        
        // Pause to respect rate limits
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ ${team} football trends failed:`, error.message);
      }
    }

    return trends;
  }

  async generateFootballVisualizationData(trendsData) {
    console.log('📊 Generating football visualization data...');
    
    const teams = Object.keys(trendsData);
    const visualizations = {};
    
    for (const team of teams) {
      try {
        const worker = this.orchestrator.geminiWorkers[0];
        
        const vizData = await worker.generateVisualizationData(trendsData[team], ['line', 'bar', 'radar']);
        visualizations[team] = vizData;
        console.log(`📈 ${team} football visualization completed`);
        
        // Pause to respect rate limits
        await this.sleep(1500);
        
      } catch (error) {
        console.error(`❌ ${team} football visualization failed:`, error.message);
      }
    }

    return visualizations;
  }

  getFootballTeamPriority(team) {
    // Football-specific priority scoring based on recent success and tradition
    const eliteFootball = ['Colorado', 'Utah', 'Iowa State', 'Oklahoma State']; // Recent success
    const risingFootball = ['Arizona', 'TCU', 'BYU', 'Cincinnati']; // Emerging programs
    const solidFootball = ['Baylor', 'Kansas State', 'West Virginia', 'Texas Tech']; // Consistent programs
    const developingFootball = ['Houston', 'UCF', 'Arizona State']; // Building programs
    
    if (eliteFootball.includes(team)) return 100;
    if (risingFootball.includes(team)) return 80;
    if (solidFootball.includes(team)) return 60;
    if (developingFootball.includes(team)) return 50;
    return 40; // Kansas baseline
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  async saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `football_research_${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    console.log(`💾 Football results saved: ${filepath}`);
    
    // Also save a "latest" version
    const latestPath = path.join(this.outputDir, 'football_research_latest.json');
    await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
    console.log(`💾 Latest results: ${latestPath}`);
  }

  async generateSummaryReport(results) {
    const summary = {
      sport: 'football',
      executionSummary: {
        timestamp: new Date().toISOString(),
        teams: results.metadata?.teams || BIG12_FOOTBALL_TEAMS.length,
        totalJobs: results.metadata?.totalJobs || BIG12_FOOTBALL_TEAMS.length * 2,
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
        trendsAnalysis: Object.keys(results.trends || {}).length,
        visualizations: Object.keys(results.visualizations || {}).length
      },
      qualityMetrics: {
        averageContentLength: this.calculateAverageContentLength(results.research || {}),
        citationCount: this.countTotalCitations(results.research || {}),
        completionRate: this.calculateCompletionRate(results)
      }
    };

    const summaryPath = path.join(this.outputDir, 'football_research_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('📈 FOOTBALL RESEARCH SUMMARY:');
    console.log(`   🏈 Teams analyzed: ${summary.researchCoverage.teams}`);
    console.log(`   📊 Historical datasets: ${summary.researchCoverage.historicalData}`);
    console.log(`   🔮 Projection models: ${summary.researchCoverage.projections}`);
    console.log(`   📈 Trends analysis: ${summary.researchCoverage.trendsAnalysis}`);
    console.log(`   📊 Visualizations: ${summary.researchCoverage.visualizations}`);
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
    const expectedJobs = (results.metadata?.teams || BIG12_FOOTBALL_TEAMS.length) * 2;
    const completedJobs = Object.values(results.research || {}).reduce((count, team) => {
      return count + (team.history ? 1 : 0) + (team.projections ? 1 : 0);
    }, 0);
    return expectedJobs > 0 ? ((completedJobs / expectedJobs) * 100).toFixed(1) : '0.0';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const researcher = new Big12FootballResearcher();
  researcher.run().catch(console.error);
}

module.exports = Big12FootballResearcher;