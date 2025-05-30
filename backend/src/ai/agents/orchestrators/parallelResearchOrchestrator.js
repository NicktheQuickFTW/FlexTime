/**
 * Parallel Research Orchestrator
 * Manages multiple research workers for 5x faster task completion
 */

const PerplexityResearchService = require('./perplexityResearchService');
const GeminiResearchService = require('./geminiResearchService');

class ParallelResearchOrchestrator {
  constructor() {
    // Create 10 Perplexity workers (DOUBLED)
    this.perplexityWorkers = Array.from({ length: 10 }, () => new PerplexityResearchService());
    
    // Create 10 Gemini workers (DOUBLED)
    this.geminiWorkers = Array.from({ length: 10 }, () => new GeminiResearchService());
    
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.results = new Map();
    this.maxConcurrentJobs = 20; // DOUBLED Total parallel jobs
  }

  async executeParallelResearch(teams, researchTypes = ['history', 'projections']) {
    const startTime = Date.now();
    console.log(`🚀 Starting parallel research for ${teams.length} teams with ${researchTypes.length} research types each`);
    
    // Create job queue
    const jobs = [];
    teams.forEach(team => {
      researchTypes.forEach(type => {
        jobs.push({
          id: `${team}-${type}`,
          team: team,
          type: type,
          priority: this.getTeamPriority(team),
          status: 'queued'
        });
      });
    });

    // Sort by priority (elite teams first)
    jobs.sort((a, b) => b.priority - a.priority);
    
    console.log(`📊 Created ${jobs.length} research jobs`);
    
    // Execute jobs in parallel batches
    const results = await this.processBatchedJobs(jobs);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Parallel research completed in ${duration.toFixed(1)} seconds`);
    console.log(`⚡ Processing rate: ${jobs.length / duration} jobs/second`);
    
    return results;
  }

  async processBatchedJobs(jobs) {
    const results = {};
    const batchSize = this.maxConcurrentJobs;
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} jobs)`);
      
      const batchPromises = batch.map((job, index) => 
        this.executeJob(job, index % this.perplexityWorkers.length)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const job = batch[index];
        if (result.status === 'fulfilled') {
          if (!results[job.team]) results[job.team] = {};
          results[job.team][job.type] = result.value;
          console.log(`✅ ${job.team} ${job.type} completed`);
        } else {
          console.error(`❌ ${job.team} ${job.type} failed:`, result.reason?.message);
        }
      });
      
      // Brief pause between batches to respect API limits
      if (i + batchSize < jobs.length) {
        await this.sleep(1000);
      }
    }
    
    return results;
  }

  async executeJob(job, workerIndex) {
    const { team, type } = job;
    
    try {
      if (type === 'history') {
        const worker = this.perplexityWorkers[workerIndex];
        return await worker.researchTeamHistory(team);
      } else if (type === 'projections') {
        const worker = this.perplexityWorkers[workerIndex];
        return await worker.researchTeamProjections(team);
      } else if (type === 'analysis') {
        const worker = this.geminiWorkers[workerIndex % this.geminiWorkers.length];
        return await worker.analyzeSportsData({ team }, 'Comprehensive Team Analysis');
      }
    } catch (error) {
      console.error(`Worker ${workerIndex} failed for ${team} ${type}:`, error.message);
      throw error;
    }
  }

  async generateTrendsAndProjections(researchResults) {
    console.log('📈 Generating trends and projections from research data...');
    
    const teams = Object.keys(researchResults);
    const analysisJobs = teams.map(team => ({
      team,
      data: researchResults[team],
      type: 'trends_analysis'
    }));

    // Use Gemini workers for analysis
    const analysisPromises = analysisJobs.map((job, index) => {
      const workerIndex = index % this.geminiWorkers.length;
      const worker = this.geminiWorkers[workerIndex];
      
      return worker.generateCompassRatings(job.data, job.data.history);
    });

    const analysisResults = await Promise.allSettled(analysisPromises);
    
    const trends = {};
    analysisResults.forEach((result, index) => {
      const team = teams[index];
      if (result.status === 'fulfilled') {
        trends[team] = result.value;
        console.log(`📊 ${team} trends analysis completed`);
      } else {
        console.error(`❌ ${team} trends analysis failed:`, result.reason?.message);
      }
    });

    return trends;
  }

  async generateVisualizationData(trendsData) {
    console.log('📊 Generating visualization data...');
    
    const teams = Object.keys(trendsData);
    const vizJobs = teams.map(team => ({
      team,
      data: trendsData[team],
      type: 'visualization'
    }));

    // Use Gemini workers for visualization generation
    const vizPromises = vizJobs.map((job, index) => {
      const workerIndex = index % this.geminiWorkers.length;
      const worker = this.geminiWorkers[workerIndex];
      
      return worker.generateVisualizationData(job.data);
    });

    const vizResults = await Promise.allSettled(vizPromises);
    
    const visualizations = {};
    vizResults.forEach((result, index) => {
      const team = teams[index];
      if (result.status === 'fulfilled') {
        visualizations[team] = result.value;
        console.log(`📈 ${team} visualization data completed`);
      } else {
        console.error(`❌ ${team} visualization failed:`, result.reason?.message);
      }
    });

    return visualizations;
  }

  async executeFullAnalysisPipeline(teams) {
    const pipelineStart = Date.now();
    console.log('🔄 Starting full analysis pipeline...');
    
    // Step 1: Parallel research (5x speed)
    const researchResults = await this.executeParallelResearch(teams, ['history', 'projections']);
    
    // Step 2: Parallel trends analysis
    const trendsData = await this.generateTrendsAndProjections(researchResults);
    
    // Step 3: Parallel visualization generation
    const visualizationData = await this.generateVisualizationData(trendsData);
    
    const pipelineEnd = Date.now();
    const totalDuration = (pipelineEnd - pipelineStart) / 1000;
    
    console.log(`🎉 Full pipeline completed in ${totalDuration.toFixed(1)} seconds`);
    
    return {
      research: researchResults,
      trends: trendsData,
      visualizations: visualizationData,
      metadata: {
        teams: teams.length,
        totalJobs: teams.length * 3, // history, projections, analysis per team
        duration: totalDuration,
        completedAt: new Date().toISOString()
      }
    };
  }

  async executeBaseballAnalysisPipeline(teams) {
    const pipelineStart = Date.now();
    console.log('🔄 Starting baseball-specific analysis pipeline...');
    
    // Step 1: Baseball-focused parallel research
    const researchResults = await this.executeBaseballParallelResearch(teams);
    
    // Step 2: Sequential trends analysis (to avoid Gemini rate limits)
    const trendsData = await this.generateBaseballTrendsSequentially(researchResults);
    
    // Step 3: Baseball visualization generation
    const visualizationData = await this.generateBaseballVisualizationData(trendsData);
    
    const pipelineEnd = Date.now();
    const totalDuration = (pipelineEnd - pipelineStart) / 1000;
    
    console.log(`🎉 Baseball pipeline completed in ${totalDuration.toFixed(1)} seconds`);
    
    return {
      research: researchResults,
      trends: trendsData,
      visualizations: visualizationData,
      metadata: {
        teams: teams.length,
        totalJobs: teams.length * 2, // history, projections per team
        duration: totalDuration,
        completedAt: new Date().toISOString(),
        sport: 'baseball'
      }
    };
  }

  async executeBaseballParallelResearch(teams) {
    const startTime = Date.now();
    console.log(`⚾ Starting baseball parallel research for ${teams.length} teams`);
    
    // Create baseball-specific job queue
    const jobs = [];
    teams.forEach(team => {
      jobs.push({
        id: `${team}-history`,
        team: team,
        type: 'baseball_history',
        priority: this.getTeamPriority(team),
        status: 'queued'
      });
      jobs.push({
        id: `${team}-projections`,
        team: team,
        type: 'baseball_projections', 
        priority: this.getTeamPriority(team),
        status: 'queued'
      });
    });

    // Sort by priority
    jobs.sort((a, b) => b.priority - a.priority);
    
    console.log(`📊 Created ${jobs.length} baseball research jobs`);
    
    // Execute jobs in parallel batches
    const results = await this.processBaseballBatchedJobs(jobs);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Baseball research completed in ${duration.toFixed(1)} seconds`);
    console.log(`⚡ Processing rate: ${(jobs.length / duration).toFixed(2)} jobs/second`);
    
    return results;
  }

  async processBaseballBatchedJobs(jobs) {
    const results = {};
    const batchSize = this.maxConcurrentJobs;
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      console.log(`🔄 Processing baseball batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} jobs)`);
      
      const batchPromises = batch.map((job, index) => 
        this.executeBaseballJob(job, index % this.perplexityWorkers.length)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const job = batch[index];
        if (result.status === 'fulfilled') {
          if (!results[job.team]) results[job.team] = {};
          const resultType = job.type.replace('baseball_', '');
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

  async executeBaseballJob(job, workerIndex) {
    const { team, type } = job;
    
    try {
      const worker = this.perplexityWorkers[workerIndex];
      
      if (type === 'baseball_history') {
        return await worker.researchBaseballTeamHistory(team);
      } else if (type === 'baseball_projections') {
        return await worker.researchBaseballTeamProjections(team);
      }
    } catch (error) {
      console.error(`Baseball worker ${workerIndex} failed for ${team} ${type}:`, error.message);
      throw error;
    }
  }

  async generateBaseballTrendsSequentially(researchResults) {
    console.log('📈 Generating baseball trends sequentially...');
    
    const teams = Object.keys(researchResults);
    const trends = {};
    
    for (const team of teams) {
      try {
        console.log(`📊 Processing ${team} trends...`);
        const workerIndex = 0; // Use first Gemini worker
        const worker = this.geminiWorkers[workerIndex];
        
        const teamData = researchResults[team];
        const analysis = await worker.generateBaseballCompassRatings(teamData, teamData.history);
        
        trends[team] = analysis;
        console.log(`📊 ${team} baseball trends completed`);
        
        // Pause to respect rate limits
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ ${team} baseball trends failed:`, error.message);
      }
    }

    return trends;
  }

  async generateBaseballVisualizationData(trendsData) {
    console.log('📊 Generating baseball visualization data...');
    
    const teams = Object.keys(trendsData);
    const visualizations = {};
    
    for (const team of teams) {
      try {
        const workerIndex = 0; // Use first Gemini worker
        const worker = this.geminiWorkers[workerIndex];
        
        const vizData = await worker.generateVisualizationData(trendsData[team], ['line', 'bar', 'radar']);
        visualizations[team] = vizData;
        console.log(`📈 ${team} baseball visualization completed`);
        
        // Pause to respect rate limits
        await this.sleep(1500);
        
      } catch (error) {
        console.error(`❌ ${team} baseball visualization failed:`, error.message);
      }
    }

    return visualizations;
  }

  getTeamPriority(team) {
    // Priority scoring based on program status
    const eliteTeams = ['Kansas', 'Houston', 'Iowa State'];
    const risingTeams = ['Arizona', 'Texas Tech', 'BYU'];
    const solidTeams = ['Baylor', 'Kansas State', 'TCU'];
    
    // Baseball-specific elite programs
    const eliteBaseball = ['Texas Tech', 'Oklahoma State', 'TCU', 'Baylor'];
    const risingBaseball = ['Arizona', 'Arizona State', 'West Virginia', 'Kansas State'];
    
    if (eliteTeams.includes(team) || eliteBaseball.includes(team)) return 100;
    if (risingTeams.includes(team) || risingBaseball.includes(team)) return 80;
    if (solidTeams.includes(team)) return 60;
    return 40;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getJobStatus() {
    return {
      active: this.activeJobs.size,
      queued: this.jobQueue.length,
      completed: this.results.size,
      workers: {
        perplexity: this.perplexityWorkers.length,
        gemini: this.geminiWorkers.length
      }
    };
  }
}

module.exports = ParallelResearchOrchestrator;