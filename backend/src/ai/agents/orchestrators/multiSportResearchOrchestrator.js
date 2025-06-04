/**
 * Multi-Sport Research Orchestrator
 * Automated background research system for all Big 12 sports
 * Manages parallel research across multiple sports with progress tracking
 */

const path = require('path');
const fs = require('fs').promises;
const ParallelResearchOrchestrator = require('./parallelResearchOrchestrator');

class MultiSportResearchOrchestrator {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../../data/research_results');
    this.activeJobs = new Map();
    this.completedSports = new Set();
    this.results = new Map();
    this.progressCallbacks = [];
  }

  // Big 12 Sports Configuration
  getSportsConfig() {
    return {
      'wrestling': {
        teams: ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia', 
                'Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 
                'Northern Colorado', 'Northern Iowa', 'Oklahoma', 'South Dakota State', 
                'Utah Valley', 'Wyoming'],
        priority: 1,
        researchMethods: ['wrestling_history', 'wrestling_projections']
      },
      'soccer': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 2,
        researchMethods: ['history', 'projections']
      },
      'volleyball': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 
                'UCF', 'Utah', 'West Virginia'],
        priority: 2,
        researchMethods: ['history', 'projections']
      },
      'tennis_mens': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 
                'Texas Tech', 'UCF', 'Utah'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'tennis_womens': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'golf_mens': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'golf_womens': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'track_field': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 4,
        researchMethods: ['history', 'projections']
      },
      'swimming_diving': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'Houston', 'Iowa State', 
                'Kansas', 'TCU', 'Utah', 'West Virginia'],
        priority: 4,
        researchMethods: ['history', 'projections']
      },
      'gymnastics': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia', 
                'Denver'],
        priority: 5,
        researchMethods: ['history', 'projections']
      }
    };
  }

  async startAutomatedResearch(options = {}) {
    const {
      sports = Object.keys(this.getSportsConfig()),
      maxConcurrentSports = 2,
      pauseBetweenSports = 30000, // 30 seconds
      saveProgress = true
    } = options;

    console.log('🚀 AUTOMATED MULTI-SPORT RESEARCH STARTING 🚀');
    console.log('=' * 60);
    console.log(`📊 Sports Queue: ${sports.length} sports`);
    console.log(`⚡ Max Concurrent: ${maxConcurrentSports} sports`);
    console.log(`⏱️ Inter-sport Pause: ${pauseBetweenSports/1000}s`);
    console.log('=' * 60);

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      const sportsConfig = this.getSportsConfig();
      
      // Sort sports by priority
      const sortedSports = sports.sort((a, b) => 
        (sportsConfig[a]?.priority || 99) - (sportsConfig[b]?.priority || 99)
      );

      // Process sports in batches
      for (let i = 0; i < sortedSports.length; i += maxConcurrentSports) {
        const batch = sortedSports.slice(i, i + maxConcurrentSports);
        console.log(`\n🔄 Processing Sport Batch ${Math.floor(i / maxConcurrentSports) + 1}/${Math.ceil(sortedSports.length / maxConcurrentSports)}`);
        console.log(`   Sports: ${batch.join(', ')}`);

        // Start batch processing
        const batchPromises = batch.map(sport => this.processSport(sport, sportsConfig[sport]));
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Process results
          batchResults.forEach((result, index) => {
            const sport = batch[index];
            if (result.status === 'fulfilled') {
              this.completedSports.add(sport);
              this.results.set(sport, result.value);
              console.log(`✅ ${sport} research completed successfully`);
            } else {
              console.error(`❌ ${sport} research failed:`, result.reason?.message);
            }
          });

          // Save progress if requested
          if (saveProgress) {
            await this.saveProgressReport();
          }

          // Pause between batches (except for last batch)
          if (i + maxConcurrentSports < sortedSports.length) {
            console.log(`⏸️ Pausing ${pauseBetweenSports/1000}s before next batch...`);
            await this.sleep(pauseBetweenSports);
          }

        } catch (error) {
          console.error(`💥 Batch processing failed:`, error);
        }
      }

      // Generate final comprehensive report
      await this.generateFinalReport();

      console.log('\n🎉 AUTOMATED MULTI-SPORT RESEARCH COMPLETED 🎉');
      console.log(`✅ Completed Sports: ${this.completedSports.size}/${sports.length}`);
      
      return {
        completedSports: Array.from(this.completedSports),
        totalSports: sports.length,
        results: Object.fromEntries(this.results)
      };

    } catch (error) {
      console.error('💥 AUTOMATED RESEARCH FAILED:', error);
      throw error;
    }
  }

  async processSport(sport, config) {
    const startTime = Date.now();
    
    console.log(`🔄 Starting ${sport} research (${config.teams.length} teams)...`);
    
    try {
      let results;
      
      // Use sport-specific pipelines where available
      if (sport === 'wrestling') {
        results = await this.processWrestling(config.teams);
      } else if (sport === 'baseball') {
        results = await this.orchestrator.executeBaseballAnalysisPipeline(config.teams);
      } else {
        // Use general pipeline for other sports
        results = await this.orchestrator.executeFullAnalysisPipeline(config.teams);
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Enhance results with metadata
      results.metadata = {
        ...results.metadata,
        sport: sport,
        duration: duration,
        completedAt: new Date().toISOString()
      };

      // Save sport-specific results
      await this.saveSportResults(sport, results);

      console.log(`✅ ${sport} completed in ${duration.toFixed(1)}s`);
      
      return results;

    } catch (error) {
      console.error(`❌ ${sport} research failed:`, error.message);
      throw error;
    }
  }

  async processWrestling(teams) {
    // Wrestling-specific pipeline
    const pipelineStart = Date.now();
    console.log('🤼 Starting wrestling-specific analysis pipeline...');
    
    // Step 1: Wrestling research
    const researchResults = await this.executeWrestlingParallelResearch(teams);
    
    // Step 2: Sequential trends analysis
    const trendsData = await this.generateWrestlingTrendsSequentially(researchResults);
    
    // Step 3: Visualization data
    const visualizationData = await this.generateWrestlingVisualizationData(trendsData);
    
    const pipelineEnd = Date.now();
    const totalDuration = (pipelineEnd - pipelineStart) / 1000;
    
    console.log(`🤼 Wrestling pipeline completed in ${totalDuration.toFixed(1)} seconds`);
    
    return {
      research: researchResults,
      trends: trendsData,
      visualizations: visualizationData,
      metadata: {
        teams: teams.length,
        totalJobs: teams.length * 2,
        duration: totalDuration,
        completedAt: new Date().toISOString(),
        sport: 'wrestling'
      }
    };
  }

  async executeWrestlingParallelResearch(teams) {
    const startTime = Date.now();
    console.log(`🤼 Starting wrestling parallel research for ${teams.length} teams`);
    
    // Create wrestling-specific job queue
    const jobs = [];
    teams.forEach(team => {
      jobs.push({
        id: `${team}-history`,
        team: team,
        type: 'wrestling_history',
        priority: this.getTeamPriority(team),
        status: 'queued'
      });
      jobs.push({
        id: `${team}-projections`,
        team: team,
        type: 'wrestling_projections',
        priority: this.getTeamPriority(team),
        status: 'queued'
      });
    });

    // Sort by priority
    jobs.sort((a, b) => b.priority - a.priority);
    
    console.log(`📊 Created ${jobs.length} wrestling research jobs`);
    
    // Execute jobs in parallel batches
    const results = await this.processWrestlingBatchedJobs(jobs);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Wrestling research completed in ${duration.toFixed(1)} seconds`);
    console.log(`⚡ Processing rate: ${(jobs.length / duration).toFixed(2)} jobs/second`);
    
    return results;
  }

  async processWrestlingBatchedJobs(jobs) {
    const results = {};
    const batchSize = this.maxConcurrentJobs || 10; // Use configurable worker capacity
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      console.log(`🔄 Processing wrestling batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} jobs)`);
      
      const batchPromises = batch.map((job, index) => 
        this.executeWrestlingJob(job, index % 10) // Use 10 Perplexity workers
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const job = batch[index];
        if (result.status === 'fulfilled') {
          if (!results[job.team]) results[job.team] = {};
          const resultType = job.type.replace('wrestling_', '');
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

  async executeWrestlingJob(job, workerIndex) {
    const { team, type } = job;
    
    try {
      const worker = this.orchestrator.perplexityWorkers[workerIndex];
      
      if (type === 'wrestling_history') {
        return await worker.researchWrestlingTeamHistory(team);
      } else if (type === 'wrestling_projections') {
        return await worker.researchWrestlingTeamProjections(team);
      }
    } catch (error) {
      console.error(`Wrestling worker ${workerIndex} failed for ${team} ${type}:`, error.message);
      throw error;
    }
  }

  async generateWrestlingTrendsSequentially(researchResults) {
    console.log('📈 Generating wrestling trends sequentially...');
    
    const teams = Object.keys(researchResults);
    const trends = {};
    
    for (const team of teams) {
      try {
        console.log(`📊 Processing ${team} wrestling trends...`);
        const worker = this.orchestrator.geminiWorkers[0];
        
        const teamData = researchResults[team];
        const analysis = await worker.generateWrestlingCompassRatings(teamData, teamData.history);
        
        trends[team] = analysis;
        console.log(`📊 ${team} wrestling trends completed`);
        
        // Pause to respect rate limits
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ ${team} wrestling trends failed:`, error.message);
      }
    }

    return trends;
  }

  async generateWrestlingVisualizationData(trendsData) {
    console.log('📊 Generating wrestling visualization data...');
    
    const teams = Object.keys(trendsData);
    const visualizations = {};
    
    for (const team of teams) {
      try {
        const worker = this.orchestrator.geminiWorkers[0];
        
        const vizData = await worker.generateVisualizationData(trendsData[team], ['line', 'bar', 'radar']);
        visualizations[team] = vizData;
        console.log(`📈 ${team} wrestling visualization completed`);
        
        // Pause to respect rate limits
        await this.sleep(1500);
        
      } catch (error) {
        console.error(`❌ ${team} wrestling visualization failed:`, error.message);
      }
    }

    return visualizations;
  }

  getTeamPriority(team) {
    // Wrestling-specific priority scoring
    const eliteWrestling = ['Iowa State', 'Oklahoma State', 'West Virginia', 'Arizona State'];
    const strongWrestling = ['Oklahoma', 'Missouri', 'North Dakota State', 'Northern Iowa'];
    
    if (eliteWrestling.includes(team)) return 100;
    if (strongWrestling.includes(team)) return 80;
    return 60;
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  async saveSportResults(sport, results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${sport}_research_${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    console.log(`💾 ${sport} results saved: ${filepath}`);
    
    // Also save a "latest" version
    const latestPath = path.join(this.outputDir, `${sport}_research_latest.json`);
    await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
  }

  async saveProgressReport() {
    const progressReport = {
      timestamp: new Date().toISOString(),
      completedSports: Array.from(this.completedSports),
      totalSports: Object.keys(this.getSportsConfig()).length,
      completionRate: (this.completedSports.size / Object.keys(this.getSportsConfig()).length * 100).toFixed(1),
      activeJobs: this.activeJobs.size,
      results: Object.fromEntries(this.results)
    };

    const progressPath = path.join(this.outputDir, 'automation_progress.json');
    await fs.writeFile(progressPath, JSON.stringify(progressReport, null, 2));
    console.log(`📊 Progress saved: ${progressReport.completionRate}% complete`);
  }

  async generateFinalReport() {
    console.log('📋 Generating final comprehensive report...');
    
    const finalReport = {
      executionSummary: {
        timestamp: new Date().toISOString(),
        totalSports: Object.keys(this.getSportsConfig()).length,
        completedSports: this.completedSports.size,
        successRate: (this.completedSports.size / Object.keys(this.getSportsConfig()).length * 100).toFixed(1),
        sportsAnalyzed: Array.from(this.completedSports)
      },
      sportsSummary: {},
      totalMetrics: {
        totalTeams: 0,
        totalResearchJobs: 0,
        totalCitations: 0,
        averageCompletionTime: 0
      }
    };

    // Calculate summary metrics
    let totalDuration = 0;
    for (const [sport, results] of this.results) {
      const teams = results.metadata?.teams || 0;
      const duration = results.metadata?.duration || 0;
      
      finalReport.sportsSummary[sport] = {
        teams: teams,
        duration: duration,
        status: 'completed'
      };
      
      finalReport.totalMetrics.totalTeams += teams;
      finalReport.totalMetrics.totalResearchJobs += (results.metadata?.totalJobs || 0);
      totalDuration += duration;
    }

    finalReport.totalMetrics.averageCompletionTime = 
      this.completedSports.size > 0 ? (totalDuration / this.completedSports.size).toFixed(1) : 0;

    const reportPath = path.join(this.outputDir, 'multi_sport_final_report.json');
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    
    console.log('📊 FINAL REPORT SUMMARY:');
    console.log(`   🏆 Sports Completed: ${finalReport.executionSummary.completedSports}/${finalReport.executionSummary.totalSports}`);
    console.log(`   ✅ Success Rate: ${finalReport.executionSummary.successRate}%`);
    console.log(`   👥 Total Teams: ${finalReport.totalMetrics.totalTeams}`);
    console.log(`   📊 Total Jobs: ${finalReport.totalMetrics.totalResearchJobs}`);
    console.log(`   ⏱️ Avg Time: ${finalReport.totalMetrics.averageCompletionTime}s per sport`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to check current progress
  getProgress() {
    const totalSports = Object.keys(this.getSportsConfig()).length;
    return {
      completed: this.completedSports.size,
      total: totalSports,
      percentage: (this.completedSports.size / totalSports * 100).toFixed(1),
      activeSports: Array.from(this.activeJobs.keys()),
      completedSports: Array.from(this.completedSports)
    };
  }

  // Method to add progress callback
  onProgress(callback) {
    this.progressCallbacks.push(callback);
  }
}

module.exports = MultiSportResearchOrchestrator;