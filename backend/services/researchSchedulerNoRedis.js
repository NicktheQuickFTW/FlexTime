/**
 * Research Scheduler Service (No Redis Version)
 * 
 * Manages automated scheduling of research agents with:
 * - Time-based schedules (daily, weekly, etc.)
 * - Event-driven triggers (transfer portal, game results)
 * - Priority-based execution
 * - Rate limiting and API management
 * - In-memory job queue (no Redis dependency)
 */

const cron = require('node-cron');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class ResearchSchedulerNoRedis extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      schedules: config.schedules || this.getDefaultSchedules(),
      maxConcurrent: config.maxConcurrent || 5,
      rateLimit: config.rateLimit || { perMinute: 10, perHour: 100 },
      ...config
    };
    
    // In-memory job management
    this.jobQueue = [];
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    this.failedJobs = new Map();
    this.schedules = new Map();
    this.apiUsage = { minute: [], hour: [] };
    this.isProcessing = false;
    this.jobIdCounter = 0;
  }

  async initialize() {
    console.log('🗓️ Initializing Research Scheduler (No Redis)...');
    
    // Initialize scheduled tasks
    this.initializeSchedules();
    
    // Setup event-driven triggers
    this.setupEventTriggers();
    
    // Start job processor
    this.startJobProcessor();
    
    console.log('✅ Research Scheduler initialized (in-memory mode)');
  }

  getDefaultSchedules() {
    return {
      // Daily comprehensive research for priority sports
      dailyComprehensive: {
        cron: '0 2 * * *', // 2 AM daily
        priority: 3,
        type: 'comprehensive',
        sports: ['football', 'men\'s basketball'],
        description: 'Daily comprehensive research update for priority sports'
      },
      
      // Bi-weekly comprehensive research for other sports
      biweeklyComprehensive: {
        cron: '0 2 * * 1,3', // Monday & Wednesday 2 AM
        priority: 3,
        type: 'comprehensive',
        sports: ['women\'s basketball', 'baseball', 'softball', 'women\'s soccer', 
                 'wrestling', 'women\'s volleyball', 'men\'s tennis', 'women\'s tennis'],
        description: 'Bi-weekly comprehensive research update for other sports'
      },
      
      // Transfer portal - Football & Basketball (daily)
      transferPortalPriority: {
        cron: '0 6 * * *', // 6 AM daily
        priority: 1,
        type: 'transfer_portal',
        sports: ['football', 'men\'s basketball', 'women\'s basketball'],
        description: 'Daily transfer portal check for Football & Basketball'
      },
      
      // Transfer portal - Other sports (Mon/Wed)
      transferPortalOthers: {
        cron: '0 7 * * 1,3', // Monday & Wednesday 7 AM
        priority: 2,
        type: 'transfer_portal',
        sports: ['baseball', 'softball', 'women\'s soccer', 
                 'wrestling', 'women\'s volleyball', 'men\'s tennis', 'women\'s tennis'],
        description: 'Bi-weekly transfer portal check for other sports'
      },
      
      // Recruiting - Football & Men's Basketball (daily)
      recruitingPriority: {
        cron: '0 5 * * *', // 5 AM daily
        priority: 1,
        type: 'recruiting',
        sports: ['football', 'men\'s basketball'],
        description: 'Daily recruiting update for Football & Men\'s Basketball'
      },
      
      // Recruiting - Other sports (Mon/Wed)
      recruitingOthers: {
        cron: '0 6 * * 1,3', // Monday & Wednesday 6 AM
        priority: 2,
        type: 'recruiting',
        sports: ['women\'s basketball', 'baseball', 'softball', 'women\'s soccer', 
                 'wrestling', 'women\'s volleyball', 'men\'s tennis', 'women\'s tennis'],
        description: 'Bi-weekly recruiting update for other sports'
      },
      
      // COMPASS rating refresh (twice weekly)
      compassRefresh: {
        cron: '0 3 * * 2,5', // Tuesday/Friday 3 AM
        priority: 2,
        type: 'compass_ratings',
        sports: ['all'],
        description: 'COMPASS rating refresh'
      },
      
      // Data maintenance (daily at 4 AM)
      dataMaintenance: {
        cron: '0 4 * * *', // 4 AM daily
        priority: 4,
        type: 'maintenance',
        description: 'Clean temporary data based on retention policies'
      }
    };
  }

  initializeSchedules() {
    Object.entries(this.config.schedules).forEach(([name, schedule]) => {
      if (schedule.cron) {
        const task = cron.schedule(schedule.cron, async () => {
          console.log(`📅 Executing scheduled research: ${name}`);
          await this.scheduleResearch(schedule);
        }, { scheduled: false });
        
        this.schedules.set(name, { task, config: schedule });
        task.start();
        console.log(`✅ Scheduled ${name}: ${schedule.cron}`);
      }
    });
  }

  setupEventTriggers() {
    // Transfer portal announcement
    this.on('transfer_portal_update', async (data) => {
      console.log('🔄 Transfer portal update detected:', data);
      await this.scheduleResearch({
        type: 'transfer_portal',
        priority: 1,
        sports: [data.sport],
        team: data.team,
        metadata: data
      });
    });
    
    // Coaching change
    this.on('coaching_change', async (data) => {
      console.log('👔 Coaching change detected:', data);
      await this.scheduleResearch({
        type: 'coaching_staff',
        priority: 1,
        sports: [data.sport],
        team: data.team,
        metadata: data
      });
    });
    
    // Game completion
    this.on('game_completed', async (data) => {
      console.log('🏁 Game completed:', data);
      await this.scheduleResearch({
        type: 'post_game_analysis',
        priority: 2,
        sports: [data.sport],
        teams: [data.homeTeam, data.awayTeam],
        metadata: data
      });
    });
    
    // Recruiting commitment
    this.on('recruiting_update', async (data) => {
      console.log('🎯 Recruiting update:', data);
      await this.scheduleResearch({
        type: 'recruiting',
        priority: 2,
        sports: [data.sport],
        team: data.team,
        metadata: data
      });
    });
  }

  async scheduleResearch(config) {
    // Check rate limits
    if (!await this.checkRateLimit()) {
      console.warn('⚠️ Rate limit reached, queuing for later');
      config.priority = Math.max(config.priority, 4);
    }
    
    // Create job configurations
    const jobs = [];
    const sports = config.sports || ['all'];
    
    for (const sport of sports) {
      if (sport === 'all') {
        // Expand to all sports
        const allSports = this.getAllSports();
        for (const s of allSports) {
          jobs.push(this.createJobConfig(s, config));
        }
      } else {
        jobs.push(this.createJobConfig(sport, config));
      }
    }
    
    // Add jobs to queue
    const addedJobs = [];
    for (const jobConfig of jobs) {
      const job = {
        id: `job_${++this.jobIdCounter}_${uuidv4()}`,
        ...jobConfig,
        status: 'waiting',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        priority: jobConfig.priority || 3
      };
      
      this.jobQueue.push(job);
      addedJobs.push(job);
      console.log(`📋 Scheduled job ${job.id}: ${jobConfig.type} for ${jobConfig.sport}`);
    }
    
    // Sort queue by priority
    this.jobQueue.sort((a, b) => a.priority - b.priority);
    
    // Process queue
    this.processJobQueue();
    
    return addedJobs.length === 1 ? addedJobs[0] : addedJobs;
  }

  createJobConfig(sport, config) {
    return {
      type: config.type,
      sport: sport,
      priority: config.priority || 3,
      team: config.team,
      teams: config.teams,
      metadata: config.metadata || {},
      scheduledAt: new Date(),
      config: {
        depth: config.type === 'comprehensive' ? 'deep' : 'standard',
        includeTransferPortal: ['transfer_portal', 'comprehensive'].includes(config.type),
        includeRecruiting: ['recruiting', 'comprehensive'].includes(config.type),
        includeCoaching: ['coaching_staff', 'comprehensive'].includes(config.type),
        includeFacilities: config.type === 'comprehensive',
        includeNIL: ['recruiting', 'comprehensive'].includes(config.type)
      }
    };
  }

  getAllSports() {
    return [
      'men\'s basketball', 'women\'s basketball', 'football', 'baseball', 'softball',
      'women\'s volleyball', 'women\'s soccer', 'men\'s tennis', 'women\'s tennis',
      'wrestling', 'men\'s swimming & diving', 'women\'s swimming & diving', 
      'men\'s golf', 'women\'s golf', 'men\'s track & field', 'women\'s track & field',
      'men\'s cross country', 'women\'s cross country', 'gymnastics'
    ];
  }

  startJobProcessor() {
    setInterval(() => {
      this.processJobQueue();
    }, 5000); // Check every 5 seconds
  }

  async processJobQueue() {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }
    
    const concurrentJobs = this.activeJobs.size;
    if (concurrentJobs >= this.config.maxConcurrent) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Get next job
      const job = this.jobQueue.shift();
      if (!job) {
        this.isProcessing = false;
        return;
      }
      
      // Check rate limit
      if (!await this.checkRateLimit()) {
        // Put job back in queue
        this.jobQueue.unshift(job);
        this.isProcessing = false;
        return;
      }
      
      // Process job
      job.status = 'active';
      job.startedAt = new Date();
      this.activeJobs.set(job.id, job);
      
      try {
        await this.trackAPIUsage();
        const result = await this.processResearchJob(job);
        
        // Job completed successfully
        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;
        this.completedJobs.set(job.id, job);
        this.activeJobs.delete(job.id);
        
        this.emit('job_completed', { job, result });
        
      } catch (error) {
        // Job failed
        job.attempts++;
        job.lastError = error.message;
        
        if (job.attempts < job.maxAttempts) {
          // Retry with exponential backoff
          job.status = 'waiting';
          job.retryAfter = new Date(Date.now() + Math.pow(2, job.attempts) * 60000);
          this.jobQueue.push(job);
          console.log(`🔄 Job ${job.id} failed, will retry (attempt ${job.attempts}/${job.maxAttempts})`);
        } else {
          // Max attempts reached
          job.status = 'failed';
          job.failedAt = new Date();
          this.failedJobs.set(job.id, job);
          console.error(`❌ Job ${job.id} failed after ${job.maxAttempts} attempts`);
          this.emit('job_failed', { job, error });
        }
        
        this.activeJobs.delete(job.id);
      }
      
    } finally {
      this.isProcessing = false;
      
      // Process next job if available
      if (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrent) {
        setTimeout(() => this.processJobQueue(), 100);
      }
    }
  }

  async processResearchJob(job) {
    const startTime = Date.now();
    console.log(`🔬 Processing research job ${job.id}`);
    
    try {
      // Execute research based on type
      let result;
      switch (job.type) {
        case 'comprehensive':
          result = await this.executeComprehensiveResearch(job);
          break;
        case 'transfer_portal':
          result = await this.executeTransferPortalResearch(job);
          break;
        case 'recruiting':
          result = await this.executeRecruitingResearch(job);
          break;
        case 'compass_ratings':
          result = await this.executeCompassResearch(job);
          break;
        case 'post_game_analysis':
          result = await this.executePostGameResearch(job);
          break;
        case 'maintenance':
          result = await this.executeMaintenanceTask(job);
          break;
        default:
          result = await this.executeGenericResearch(job);
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Job ${job.id} completed in ${duration}ms`);
      
      // Emit completion event
      this.emit('research_completed', {
        jobId: job.id,
        type: job.type,
        sport: job.sport,
        results: result
      });
      
      return {
        success: true,
        duration,
        result
      };
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error;
    }
  }

  async executeComprehensiveResearch(job) {
    const { sport, team, config } = job;
    
    // Simulate research for testing
    console.log(`   Executing comprehensive research for ${sport}`);
    
    // In production, this would call the actual research services
    return {
      teamName: team || `Big 12 ${sport}`,
      sport,
      season: '2024-25',
      record: '0-0',
      headCoach: 'TBD',
      compassRating: 75.5,
      keyPlayers: [],
      strengths: ['Team chemistry', 'Coaching experience'],
      weaknesses: ['Depth', 'Experience'],
      type: 'comprehensive',
      timestamp: new Date(),
      researchTimestamp: new Date(),
      data: {
        overview: `Comprehensive research data for ${sport}`,
        transferPortal: {},
        recruiting: {},
        coaching: {},
        facilities: {},
        nil: {}
      }
    };
  }

  async executeTransferPortalResearch(job) {
    const { sport, team } = job;
    
    console.log(`   Executing transfer portal research for ${sport}`);
    
    return {
      teamName: team || `Big 12 ${sport}`,
      sport,
      transfers: [],
      impactAssessment: 'Neutral impact expected',
      type: 'transfer_portal',
      timestamp: new Date(),
      researchTimestamp: new Date(),
      data: {
        entries: [],
        exits: [],
        targets: []
      }
    };
  }

  async executeRecruitingResearch(job) {
    const { sport, team } = job;
    
    console.log(`   Executing recruiting research for ${sport}`);
    
    return {
      teamName: team || `Big 12 ${sport}`,
      sport,
      recruitingClass: [],
      topProspects: [],
      classRanking: 50,
      type: 'recruiting',
      timestamp: new Date(),
      researchTimestamp: new Date(),
      data: {
        commits: [],
        targets: [],
        decommits: []
      }
    };
  }

  async executeCompassResearch(job) {
    const { sport, team } = job;
    
    console.log(`   Executing COMPASS ratings research for ${sport}`);
    
    return {
      teamName: team || `Big 12 ${sport}`,
      sport,
      overallRating: 75.0,
      components: {
        competitive: 78.2,
        operational: 72.5,
        market: 74.8,
        performance: 76.1,
        analytics: 73.4
      },
      type: 'compass_ratings',
      timestamp: new Date(),
      researchTimestamp: new Date(),
      data: {
        ratings: {},
        rankings: []
      }
    };
  }

  async executePostGameResearch(job) {
    const { sport, teams, metadata } = job;
    
    console.log(`   Executing post-game analysis for ${teams.join(' vs ')}`);
    
    return {
      sport,
      teams,
      type: 'post_game_analysis',
      timestamp: new Date(),
      gameId: metadata?.gameId,
      data: {
        performance: {},
        injuries: [],
        implications: {}
      }
    };
  }

  async executeMaintenanceTask(job) {
    console.log('   Executing data maintenance task');
    
    // Clean up old completed jobs (keep last 1000)
    if (this.completedJobs.size > 1000) {
      const sortedJobs = Array.from(this.completedJobs.values())
        .sort((a, b) => b.completedAt - a.completedAt);
      
      const toRemove = sortedJobs.slice(1000);
      toRemove.forEach(job => this.completedJobs.delete(job.id));
    }
    
    // Clean up old failed jobs (keep last 100)
    if (this.failedJobs.size > 100) {
      const sortedJobs = Array.from(this.failedJobs.values())
        .sort((a, b) => b.failedAt - a.failedAt);
      
      const toRemove = sortedJobs.slice(100);
      toRemove.forEach(job => this.failedJobs.delete(job.id));
    }
    
    return {
      type: 'maintenance',
      timestamp: new Date(),
      cleaned: {
        completedJobs: this.completedJobs.size,
        failedJobs: this.failedJobs.size
      }
    };
  }

  async executeGenericResearch(job) {
    console.log(`   Executing generic research: ${job.type}`);
    
    return {
      type: job.type,
      sport: job.sport,
      timestamp: new Date(),
      data: {}
    };
  }

  async checkRateLimit() {
    const now = Date.now();
    
    // Clean old entries
    this.apiUsage.minute = this.apiUsage.minute.filter(t => now - t < 60000);
    this.apiUsage.hour = this.apiUsage.hour.filter(t => now - t < 3600000);
    
    // Check limits
    if (this.apiUsage.minute.length >= this.config.rateLimit.perMinute) {
      return false;
    }
    if (this.apiUsage.hour.length >= this.config.rateLimit.perHour) {
      return false;
    }
    
    return true;
  }

  async trackAPIUsage() {
    const now = Date.now();
    this.apiUsage.minute.push(now);
    this.apiUsage.hour.push(now);
  }

  async getStatus() {
    return {
      scheduled: this.schedules.size,
      activeJobs: this.activeJobs.size,
      queue: {
        waitingCount: this.jobQueue.length,
        activeCount: this.activeJobs.size,
        completedCount: this.completedJobs.size,
        failedCount: this.failedJobs.size,
        waiting: this.jobQueue.length,
        active: this.activeJobs.size,
        completed: this.completedJobs.size,
        failed: this.failedJobs.size
      },
      apiUsage: {
        lastMinute: this.apiUsage.minute.length,
        lastHour: this.apiUsage.hour.length
      },
      schedules: Array.from(this.schedules.entries()).map(([name, schedule]) => ({
        name,
        cron: schedule.config.cron,
        type: schedule.config.type,
        sports: schedule.config.sports
      }))
    };
  }

  async stop() {
    // Stop all scheduled tasks
    for (const [name, schedule] of this.schedules) {
      schedule.task.stop();
      console.log(`⏹️ Stopped schedule: ${name}`);
    }
    
    console.log('🛑 Research Scheduler stopped');
  }
}

module.exports = ResearchSchedulerNoRedis;