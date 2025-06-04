/**
 * Enhanced Multi-Sport Research Orchestrator
 * Automated background research system for all Big 12 sports with COMPASS integration
 * Manages parallel research with 30-worker scaling and adaptive frequency updates
 * Integrated with Unified Compass Report AI agent automation
 */

const path = require('path');
const fs = require('fs').promises;
const ParallelResearchOrchestrator = require('./parallelResearchOrchestrator');
const COMPASS = require('./enhanced/COMPASS');

class MultiSportResearchOrchestrator {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../../data/research_results');
    this.activeJobs = new Map();
    this.completedSports = new Set();
    this.results = new Map();
    this.progressCallbacks = [];
    
    // NEW: Enhanced COMPASS integration with 30-worker scaling
    this.compass = new COMPASS();
    this.workerMultiplier = 30;
    this.maxConcurrentTasks = 150; // 5 base * 30 workers
    
    // NEW: Adaptive frequency configuration from Unified Compass Report
    this.updateFrequencies = {
      'tier_1': { // Football, Men's Basketball
        'in_season': 'real_time',
        'regular': 'daily',
        'off_season': '3x_weekly'
      },
      'tier_2': { // Women's Basketball, Baseball, Softball
        'in_season': '3x_daily',
        'regular': '3x_weekly',
        'off_season': 'weekly'
      },
      'tier_3': { // Volleyball, Soccer
        'in_season': 'daily',
        'regular': 'weekly',
        'off_season': 'bi_weekly'
      },
      'tier_4': { // Tennis, Golf, Track
        'competition': 'daily',
        'regular': 'bi_weekly'
      }
    };
    
    // NEW: Agent task queue management
    this.agentTasks = new Map();
    this.taskQueue = [];
    
    // NEW: COMPASS update scheduling
    this.compassUpdateSchedule = new Map();
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
    const batchSize = 20; // Use full worker capacity
    
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

  // ============================================================================
  // NEW: Enhanced AI Agent Integration Methods for Unified Compass Report
  // ============================================================================

  /**
   * Initialize adaptive COMPASS update scheduling with 30-worker scaling
   */
  async initializeAdaptiveScheduling() {
    try {
      console.log('🤖 Initializing adaptive COMPASS scheduling with 30-worker scaling...');
      
      const sportsConfig = this.getSportsConfig();
      
      for (const [sport, config] of Object.entries(sportsConfig)) {
        const tier = this.getSportTier(sport);
        const teams = config.teams;
        
        for (const team of teams) {
          // Calculate update frequency based on tier and team performance
          const frequency = this.calculateUpdateFrequency(sport, tier, team);
          
          // Schedule initial COMPASS update
          this.scheduleCompassUpdate(team, sport, frequency);
        }
      }
      
      console.log(`✅ Adaptive scheduling initialized for ${Object.keys(sportsConfig).length} sports`);
      
    } catch (error) {
      console.error('❌ Error initializing adaptive scheduling:', error);
      throw error;
    }
  }

  /**
   * Calculate adaptive update frequency based on sport tier and team performance
   */
  calculateUpdateFrequency(sport, tier, team) {
    const baseFrequency = this.updateFrequencies[tier]?.regular || 'weekly';
    
    // Get team volatility and performance (mock data - integrate with actual team data)
    const volatility = this.getTeamVolatility(team, sport);
    const performanceTier = this.getTeamPerformanceTier(team, sport);
    
    // Increase frequency for high volatility or struggling programs
    if (volatility > 5 || performanceTier === 'bottom_third') {
      return this.increaseFrequency(baseFrequency);
    }
    
    return baseFrequency;
  }

  /**
   * Schedule COMPASS update for a team
   */
  scheduleCompassUpdate(team, sport, frequency) {
    const taskId = `${team}_${sport}_compass_update`;
    const scheduledTime = this.getNextScheduledTime(frequency);
    
    const task = {
      id: taskId,
      type: 'compass_update',
      team,
      sport,
      frequency,
      scheduledTime,
      prompt: this.generateCOMPASSPrompt(team, sport),
      priority: this.getSportTier(sport) === 'tier_1' ? 9 : 5,
      workerPool: 'compass_enhanced'
    };
    
    this.agentTasks.set(taskId, task);
    this.taskQueue.push(task);
    
    // Update COMPASS schedule
    this.compassUpdateSchedule.set(`${team}_${sport}`, {
      team,
      sport,
      lastUpdate: null,
      nextUpdate: scheduledTime,
      frequency,
      tier: this.getSportTier(sport)
    });
  }

  /**
   * Generate sport-specific COMPASS prompts from Unified Compass Report
   */
  generateCOMPASSPrompt(team, sport) {
    const today = new Date().toISOString().split('T')[0];
    
    const sportSpecificPrompts = {
      'football': `Research ${team} football as of ${today}:
      
      PERFORMANCE DATA:
      - Current record (overall and conference)
      - Last 3 games: scores, opponent ratings, home/away
      - CFP rankings, AP Poll position
      - Key injuries or suspensions
      
      COMPASS COMPONENTS:
      - Competitive: Conference standing, quality wins/losses, strength metrics
      - Operational: Coaching stability, facility updates, academic success (APR/GSR)
      - Market: TV appearances, media coverage, brand strength, social media engagement
      - Player: Recruiting class ranking, transfer portal activity, NIL collective strength
      - Audience: Attendance figures, season ticket sales, fan engagement metrics
      - Sport Standing: Big 12 performance, strength of schedule, rivalry preservation
      - Sustainability: Financial health, donor support, long-term outlook
      
      SCHEDULING RELEVANCE:
      - Optimal opponent strength for playoff consideration
      - TV window preferences based on performance
      - Travel burden assessment for conference games
      
      Return structured JSON with confidence scores for FlexTime integration.`,
      
      'mens_basketball': `Research ${team} men's basketball as of ${today}:
      
      PERFORMANCE DATA:
      - Current record and last 5 games
      - NET, KPI, and KenPom rankings
      - Quad 1/2 wins and bad losses
      - Tournament projection and bubble status
      
      COMPASS COMPONENTS:
      - Competitive: Conference tournament seeding, quality opponent results
      - Operational: Coaching consistency, practice facility quality, academic metrics
      - Market: TV game count, March Madness exposure potential, regional coverage
      - Player: Transfer portal net gain/loss, recruiting class, player development
      - Audience: Arena capacity utilization, season ticket base, student engagement
      - Sport Standing: Big 12 competitive balance, conference strength, rivalry games
      - Sustainability: Program budget, NIL infrastructure, coaching stability
      
      SCHEDULING RELEVANCE:
      - Conference tournament seeding implications
      - Quadrant optimization for NET rankings
      - Home court advantage maximization
      
      Format for FlexTime constraint system integration.`,
      
      'baseball': `Research ${team} baseball as of ${today}:
      
      PERFORMANCE DATA:
      - Current record and RPI ranking
      - Conference series results and standings
      - Recent weekend series performance
      - Regional tournament projection
      
      COMPASS COMPONENTS:
      - Competitive: Series win percentage, quality opponent performance, RPI factors
      - Operational: Coaching tenure, facility quality, academic compliance
      - Market: Regional TV coverage, College World Series history, local media
      - Player: MLB draft prospects, transfer activity, recruiting class
      - Audience: Weekend series attendance, fan base engagement
      - Sport Standing: Big 12 baseball competitiveness, weather considerations
      - Sustainability: Program funding, facility maintenance, long-term viability
      
      SCHEDULING RELEVANCE:
      - Weekend series optimization
      - Weather contingency planning
      - Conference tournament implications
      
      Return data optimized for series-based scheduling constraints.`
    };
    
    return sportSpecificPrompts[sport] || this.generateGenericSportPrompt(team, sport, today);
  }

  /**
   * Generate generic sport prompt for sports not specifically defined
   */
  generateGenericSportPrompt(team, sport, today) {
    return `Research ${team} ${sport} as of ${today}:
    
    PERFORMANCE DATA:
    - Current season record and conference standing
    - Recent competition results
    - Key player updates and roster changes
    
    COMPASS COMPONENTS:
    - Competitive: Season performance vs expectations, key victories/defeats
    - Operational: Coaching staff stability, facility adequacy, academic success
    - Market: Media coverage level, conference visibility, fan interest
    - Player: Recruiting success, retention rate, development indicators
    - Audience: Event attendance, community support, engagement levels
    - Sport Standing: Conference competitive level, scheduling considerations
    - Sustainability: Program resources, financial support, growth potential
    
    Return structured data for FlexTime scheduling integration.`;
  }

  /**
   * Execute COMPASS update with 30-worker parallel processing
   */
  async executeCOMPASSUpdate(task) {
    try {
      const startTime = Date.now();
      
      // Use enhanced orchestrator with COMPASS integration
      const research = await this.orchestrator.executeResearch(task.prompt, {
        sport: task.sport,
        team: task.team,
        workerMultiplier: this.workerMultiplier
      });
      
      // Calculate enhanced COMPASS score with new research data
      const compassScore = await this.compass.calculateCOMPASSScore({
        id: `${task.team}_${task.sport}_schedule`,
        sport: task.sport,
        team: { id: task.team, name: task.team }
      }, {
        researchData: research,
        enhancedCalculation: true
      });
      
      // Store results and update scheduling
      await this.storeCOMPASSResults(task.team, task.sport, compassScore, research);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ COMPASS update completed for ${task.team} ${task.sport} in ${processingTime}ms`);
      console.log(`   Score: ${compassScore.overallScore.toFixed(2)} (base: ${compassScore.baseScore.toFixed(2)}, enhancement: +${compassScore.enhancedFeatures.totalEnhancement.toFixed(2)})`);
      
      return {
        success: true,
        team: task.team,
        sport: task.sport,
        compassScore,
        processingTime,
        research
      };
      
    } catch (error) {
      console.error(`❌ COMPASS update failed for ${task.team} ${task.sport}:`, error);
      return {
        success: false,
        team: task.team,
        sport: task.sport,
        error: error.message
      };
    }
  }

  /**
   * Process agent task queue with 30-worker distribution
   */
  async processAgentTaskQueue() {
    if (this.taskQueue.length === 0) return;
    
    console.log(`🔄 Processing ${this.taskQueue.length} agent tasks with ${this.workerMultiplier}-worker scaling...`);
    
    // Sort tasks by priority and scheduled time
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.scheduledTime) - new Date(b.scheduledTime);
    });
    
    // Process tasks in batches based on worker capacity
    const batchSize = Math.min(this.maxConcurrentTasks, this.taskQueue.length);
    const batch = this.taskQueue.splice(0, batchSize);
    
    const batchPromises = batch.map((task, index) => {
      const workerId = (index % this.workerMultiplier) + 1;
      return this.executeTaskWithWorker(task, workerId);
    });
    
    const results = await Promise.allSettled(batchPromises);
    
    // Process results and reschedule as needed
    results.forEach((result, index) => {
      const task = batch[index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        // Reschedule next update
        this.rescheduleTask(task);
      } else {
        // Handle failed tasks
        this.handleFailedTask(task, result.reason);
      }
    });
    
    console.log(`✅ Batch processing completed: ${results.filter(r => r.status === 'fulfilled').length}/${results.length} successful`);
  }

  /**
   * Execute task with specific worker assignment
   */
  async executeTaskWithWorker(task, workerId) {
    task.workerId = workerId;
    task.startTime = Date.now();
    
    console.log(`🤖 Worker ${workerId} executing ${task.type} for ${task.team} ${task.sport}`);
    
    switch (task.type) {
      case 'compass_update':
        return await this.executeCOMPASSUpdate(task);
      case 'momentum_update':
        return await this.executeMomentumUpdate(task);
      case 'synergy_calculation':
        return await this.executeSynergyCalculation(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  // ============================================================================
  // Helper Methods for Enhanced Functionality
  // ============================================================================

  getSportTier(sport) {
    const tierMapping = {
      'football': 'tier_1',
      'mens_basketball': 'tier_1',
      'womens_basketball': 'tier_2',
      'baseball': 'tier_2',
      'softball': 'tier_2',
      'volleyball': 'tier_3',
      'soccer': 'tier_3',
      'tennis_mens': 'tier_4',
      'tennis_womens': 'tier_4',
      'wrestling': 'tier_4'
    };
    
    return tierMapping[sport] || 'tier_4';
  }

  getTeamVolatility(team, sport) {
    // Mock volatility calculation - in production, use actual performance data
    return Math.random() * 10; // 0-10 scale
  }

  getTeamPerformanceTier(team, sport) {
    // Mock performance tier - in production, use actual rankings/performance
    const random = Math.random();
    if (random < 0.33) return 'bottom_third';
    if (random < 0.66) return 'middle_third';
    return 'top_third';
  }

  increaseFrequency(baseFrequency) {
    const frequencyMap = {
      'bi_weekly': 'weekly',
      'weekly': '3x_weekly',
      '3x_weekly': 'daily',
      'daily': '3x_daily',
      '3x_daily': 'real_time'
    };
    
    return frequencyMap[baseFrequency] || baseFrequency;
  }

  getNextScheduledTime(frequency) {
    const now = new Date();
    const frequencyMap = {
      'real_time': 5 * 60 * 1000, // 5 minutes
      '3x_daily': 8 * 60 * 60 * 1000, // 8 hours
      'daily': 24 * 60 * 60 * 1000, // 24 hours
      '3x_weekly': 2.33 * 24 * 60 * 60 * 1000, // ~2.33 days
      'weekly': 7 * 24 * 60 * 60 * 1000, // 7 days
      'bi_weekly': 14 * 24 * 60 * 60 * 1000 // 14 days
    };
    
    const interval = frequencyMap[frequency] || frequencyMap['weekly'];
    return new Date(now.getTime() + interval);
  }

  async storeCOMPASSResults(team, sport, compassScore, research) {
    // Store in results map for immediate access
    const key = `${team}_${sport}`;
    this.results.set(key, {
      team,
      sport,
      compassScore,
      research,
      timestamp: new Date(),
      workerMultiplier: this.workerMultiplier
    });
    
    // In production, this would also store in database
    console.log(`💾 COMPASS results stored for ${team} ${sport}`);
  }

  rescheduleTask(task) {
    const nextScheduledTime = this.getNextScheduledTime(task.frequency);
    
    const newTask = {
      ...task,
      scheduledTime: nextScheduledTime,
      id: `${task.team}_${task.sport}_${Date.now()}`
    };
    
    this.taskQueue.push(newTask);
    this.agentTasks.set(newTask.id, newTask);
  }

  handleFailedTask(task, error) {
    console.error(`❌ Task failed: ${task.type} for ${task.team} ${task.sport}`, error);
    
    // Retry logic could be implemented here
    // For now, just reschedule with increased interval
    task.frequency = this.increaseFrequency(task.frequency);
    this.rescheduleTask(task);
  }

  /**
   * Get enhanced progress with COMPASS integration metrics
   */
  getEnhancedProgress() {
    const baseProgress = this.getProgress();
    
    return {
      ...baseProgress,
      compassIntegration: {
        activeUpdates: this.agentTasks.size,
        queuedTasks: this.taskQueue.length,
        workerMultiplier: this.workerMultiplier,
        maxConcurrentTasks: this.maxConcurrentTasks,
        scheduledTeams: this.compassUpdateSchedule.size,
        lastUpdateTime: new Date().toISOString()
      },
      systemMetrics: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        version: '3.0.0-enhanced'
      }
    };
  }

  /**
   * Execute momentum update task
   */
  async executeMomentumUpdate(task) {
    // Placeholder for momentum-specific update logic
    return {
      success: true,
      team: task.team,
      sport: task.sport,
      type: 'momentum_update'
    };
  }

  /**
   * Execute synergy calculation task
   */
  async executeSynergyCalculation(task) {
    // Placeholder for synergy-specific calculation logic
    return {
      success: true,
      team: task.team,
      sport: task.sport,
      type: 'synergy_calculation'
    };
  }
}

module.exports = MultiSportResearchOrchestrator;