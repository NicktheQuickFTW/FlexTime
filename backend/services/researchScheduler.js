/**
 * Research Scheduler Service
 * 
 * Manages automated scheduling of research agents with:
 * - Time-based schedules (daily, weekly, etc.)
 * - Event-driven triggers (transfer portal, game results)
 * - Priority-based execution
 * - Rate limiting and API management
 */

const cron = require('node-cron');
const EventEmitter = require('events');
const { Sequelize } = require('sequelize');
const Bull = require('bull');
const Redis = require('ioredis');

class ResearchScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      redis: config.redis || { host: 'localhost', port: 6379 },
      schedules: config.schedules || this.getDefaultSchedules(),
      maxConcurrent: config.maxConcurrent || 5,
      rateLimit: config.rateLimit || { perMinute: 10, perHour: 100 },
      ...config
    };
    
    this.redis = new Redis(this.config.redis);
    this.jobQueue = new Bull('research-jobs', { redis: this.config.redis });
    this.schedules = new Map();
    this.activeJobs = new Map();
    this.apiUsage = { minute: [], hour: [] };
  }

  async initialize() {
    console.log('🗓️ Initializing Research Scheduler...');
    
    // Setup job queue processor
    this.jobQueue.process(this.config.maxConcurrent, async (job) => {
      return this.processResearchJob(job);
    });
    
    // Setup job event handlers
    this.setupJobEventHandlers();
    
    // Initialize scheduled tasks
    this.initializeSchedules();
    
    // Setup event-driven triggers
    this.setupEventTriggers();
    
    console.log('✅ Research Scheduler initialized');
  }

  getDefaultSchedules() {
    // Sport abbreviations:
    // FB = Football, MBB = Men's Basketball, WBB = Women's Basketball
    // BSB = Baseball, SB = Softball, WSOC = Women's Soccer
    // WRES = Wrestling, WVB = Women's Volleyball
    // MTN = Men's Tennis, WTN = Women's Tennis
    return {
      // Daily comprehensive research for priority sports
      dailyComprehensive: {
        cron: '0 2 * * *', // 2 AM daily
        priority: 3,
        type: 'comprehensive',
        sports: ['football', 'mens_basketball'],
        description: 'Daily comprehensive research update for priority sports'
      },
      
      // Bi-weekly comprehensive research for other sports
      biweeklyComprehensive: {
        cron: '0 2 * * 1,3', // Monday & Wednesday 2 AM
        priority: 3,
        type: 'comprehensive',
        sports: ['womens_basketball', 'baseball', 'softball', 'womens_soccer', 
                 'wrestling', 'womens_volleyball', 'mens_tennis', 'womens_tennis'],
        description: 'Bi-weekly comprehensive research update for other sports'
      },
      
      // Transfer portal - Football & Men's/Women's Basketball (daily)
      transferPortalPriority: {
        cron: '0 6 * * *', // 6 AM daily
        priority: 1,
        type: 'transfer_portal',
        sports: ['football', 'mens_basketball', 'womens_basketball'],
        description: 'Daily transfer portal check for Football & Basketball'
      },
      
      // Transfer portal - Other sports (Mon/Wed)
      transferPortalOthers: {
        cron: '0 7 * * 1,3', // Monday & Wednesday 7 AM
        priority: 2,
        type: 'transfer_portal',
        sports: ['womens_basketball', 'baseball', 'softball', 'womens_soccer', 
                 'wrestling', 'womens_volleyball', 'mens_tennis', 'womens_tennis'],
        description: 'Bi-weekly transfer portal check for other sports'
      },
      
      // Recruiting - Football & Men's Basketball (daily)
      recruitingPriority: {
        cron: '0 5 * * *', // 5 AM daily
        priority: 1,
        type: 'recruiting',
        sports: ['football', 'mens_basketball'],
        description: 'Daily recruiting update for Football & Men\'s Basketball'
      },
      
      // Recruiting - Other sports including Women's Basketball (Mon/Wed)
      recruitingOthers: {
        cron: '0 6 * * 1,3', // Monday & Wednesday 6 AM
        priority: 2,
        type: 'recruiting',
        sports: ['womens_basketball', 'baseball', 'softball', 'womens_soccer', 
                 'wrestling', 'womens_volleyball', 'mens_tennis', 'womens_tennis'],
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
      
      // Game day research (dynamic)
      gameDay: {
        type: 'event_driven',
        priority: 1,
        trigger: 'game_day',
        description: 'Pre-game research update'
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
        // Expand to all sports with proper gender designations
        const allSports = ['mens_basketball', 'womens_basketball', 'football', 'baseball', 'softball', 
                          'womens_volleyball', 'womens_soccer', 'mens_tennis', 'womens_tennis', 
                          'wrestling', 'mens_swimming', 'womens_swimming', 'mens_golf', 'womens_golf',
                          'mens_track_field', 'womens_track_field', 'mens_cross_country', 'womens_cross_country',
                          'womens_gymnastics'];
        for (const s of allSports) {
          jobs.push(this.createJobConfig(s, config));
        }
      } else {
        jobs.push(this.createJobConfig(sport, config));
      }
    }
    
    // Add jobs to queue
    for (const jobConfig of jobs) {
      const job = await this.jobQueue.add(jobConfig, {
        priority: jobConfig.priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute base
        }
      });
      
      console.log(`📋 Scheduled job ${job.id}: ${jobConfig.type} for ${jobConfig.sport}`);
    }
  }

  createJobConfig(sport, config) {
    return {
      id: `${config.type}_${sport}_${Date.now()}`,
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

  async processResearchJob(job) {
    const startTime = Date.now();
    console.log(`🔬 Processing research job ${job.id}`);
    
    try {
      // Update API usage tracking
      await this.trackAPIUsage();
      
      // Store active job
      this.activeJobs.set(job.id, {
        startTime,
        data: job.data,
        progress: 0
      });
      
      // Report progress
      job.progress(10);
      
      // Execute research based on type
      let result;
      switch (job.data.type) {
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
        default:
          result = await this.executeGenericResearch(job);
      }
      
      // Clean up
      this.activeJobs.delete(job.id);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Job ${job.id} completed in ${duration}ms`);
      
      return {
        success: true,
        duration,
        result
      };
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      this.activeJobs.delete(job.id);
      throw error;
    }
  }

  async executeComprehensiveResearch(job) {
    const { sport, team, config } = job.data;
    
    // Import research services
    const MultiSportResearchOrchestrator = require('./multiSportResearchOrchestrator');
    const orchestrator = new MultiSportResearchOrchestrator();
    
    // Configure research
    const researchConfig = {
      sports: [sport],
      teams: team ? [team] : undefined,
      depth: 'comprehensive',
      includeTransferPortal: true,
      includeRecruiting: true,
      includeCoaching: true,
      includeFacilities: true,
      includeNIL: true,
      season: '2024-25'
    };
    
    job.progress(30);
    
    // Execute research
    const results = await orchestrator.orchestrateResearch(researchConfig);
    
    job.progress(70);
    
    // Trigger validation
    this.emit('research_completed', {
      jobId: job.id,
      type: 'comprehensive',
      sport,
      results
    });
    
    job.progress(100);
    
    return results;
  }

  async executeTransferPortalResearch(job) {
    const { sport, team } = job.data;
    
    const PerplexityResearchService = require('./perplexityResearchService');
    const service = new PerplexityResearchService();
    
    job.progress(30);
    
    const results = await service.researchTransferPortalSummer2025(
      team || `Big 12 ${sport}`,
      sport
    );
    
    job.progress(70);
    
    // Trigger validation
    this.emit('research_completed', {
      jobId: job.id,
      type: 'transfer_portal',
      sport,
      results
    });
    
    job.progress(100);
    
    return results;
  }

  async executeRecruitingResearch(job) {
    const { sport, team } = job.data;
    
    const PerplexityResearchService = require('./perplexityResearchService');
    const service = new PerplexityResearchService();
    
    job.progress(30);
    
    const results = await service.researchRecruitingSummer2025(
      team || `Big 12 ${sport}`,
      sport
    );
    
    job.progress(70);
    
    // Trigger validation
    this.emit('research_completed', {
      jobId: job.id,
      type: 'recruiting',
      sport,
      results
    });
    
    job.progress(100);
    
    return results;
  }

  async executeCompassResearch(job) {
    const { sport } = job.data;
    
    const ResearchCompassIntegration = require('./researchCompassIntegration');
    const integration = new ResearchCompassIntegration();
    
    job.progress(30);
    
    // Get all teams for sport
    const teams = await this.getTeamsForSport(sport);
    const results = [];
    
    for (const team of teams) {
      const research = await integration.processTeamResearch(team, sport);
      results.push(research);
      job.progress(30 + (40 * results.length / teams.length));
    }
    
    job.progress(70);
    
    // Trigger validation
    this.emit('research_completed', {
      jobId: job.id,
      type: 'compass_ratings',
      sport,
      results
    });
    
    job.progress(100);
    
    return results;
  }

  async executePostGameResearch(job) {
    const { sport, teams, metadata } = job.data;
    
    // Research both teams' performance
    const results = [];
    
    for (const team of teams) {
      // Game-specific research queries
      const research = {
        team,
        gameId: metadata.gameId,
        performance: await this.researchGamePerformance(team, metadata),
        injuries: await this.researchInjuryUpdates(team, sport),
        implications: await this.researchGameImplications(team, sport, metadata)
      };
      
      results.push(research);
    }
    
    return results;
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
    
    // Store in Redis for distributed tracking
    await this.redis.zadd('api_usage_minute', now, now);
    await this.redis.zadd('api_usage_hour', now, now);
    
    // Clean old entries
    await this.redis.zremrangebyscore('api_usage_minute', 0, now - 60000);
    await this.redis.zremrangebyscore('api_usage_hour', 0, now - 3600000);
  }

  setupJobEventHandlers() {
    this.jobQueue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed`);
      this.emit('job_completed', { job, result });
    });
    
    this.jobQueue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err);
      this.emit('job_failed', { job, error: err });
    });
    
    this.jobQueue.on('stalled', (job) => {
      console.warn(`⚠️ Job ${job.id} stalled`);
      this.emit('job_stalled', { job });
    });
  }

  async getTeamsForSport(sport) {
    // This would query the database for all teams in a sport
    // For now, return Big 12 teams with proper gender designations
    const sportTeams = {
      mens_basketball: ['Kansas', 'Baylor', 'Texas Tech', 'Iowa State', 'Houston'],
      womens_basketball: ['Kansas', 'Baylor', 'Texas Tech', 'Iowa State', 'Houston'],
      football: ['Oklahoma State', 'Kansas State', 'TCU', 'Texas Tech', 'Baylor'],
      baseball: ['TCU', 'Texas Tech', 'Oklahoma State', 'West Virginia'],
      softball: ['Oklahoma State', 'Texas Tech', 'Baylor', 'Iowa State'],
      mens_tennis: ['Baylor', 'TCU', 'Texas Tech', 'Oklahoma State'],
      womens_tennis: ['Baylor', 'TCU', 'Texas Tech', 'Oklahoma State', 'Kansas'],
      mens_volleyball: [],  // No Big 12 men's volleyball teams
      womens_volleyball: ['Kansas', 'Baylor', 'Texas Tech', 'TCU', 'Iowa State'],
      mens_soccer: [],  // No Big 12 men's soccer teams
      womens_soccer: ['TCU', 'Texas Tech', 'Baylor', 'Kansas', 'West Virginia'],
      mens_swimming: ['TCU', 'West Virginia'],
      womens_swimming: ['TCU', 'West Virginia', 'Kansas', 'Iowa State'],
      mens_golf: ['Oklahoma State', 'Texas Tech', 'TCU', 'Baylor', 'Kansas'],
      womens_golf: ['Oklahoma State', 'Texas Tech', 'TCU', 'Baylor'],
      mens_track_field: ['Texas Tech', 'TCU', 'Kansas', 'Iowa State'],
      womens_track_field: ['Texas Tech', 'TCU', 'Kansas', 'Iowa State', 'Baylor'],
      mens_cross_country: ['Oklahoma State', 'Iowa State', 'BYU'],
      womens_cross_country: ['Oklahoma State', 'Iowa State', 'West Virginia'],
      mens_gymnastics: [],  // No Big 12 men's gymnastics teams
      womens_gymnastics: ['Iowa State', 'West Virginia'],
      wrestling: ['Oklahoma State', 'Iowa State', 'West Virginia']
    };
    
    return sportTeams[sport] || [];
  }

  async getStatus() {
    const queue = await this.jobQueue.getJobCounts();
    
    return {
      scheduled: this.schedules.size,
      activeJobs: this.activeJobs.size,
      queue: {
        waiting: queue.waiting,
        active: queue.active,
        completed: queue.completed,
        failed: queue.failed
      },
      apiUsage: {
        lastMinute: this.apiUsage.minute.length,
        lastHour: this.apiUsage.hour.length
      },
      schedules: Array.from(this.schedules.entries()).map(([name, schedule]) => ({
        name,
        cron: schedule.config.cron,
        nextRun: schedule.task ? schedule.task.nextDates(1) : null
      }))
    };
  }

  async stop() {
    // Stop all scheduled tasks
    for (const [name, schedule] of this.schedules) {
      schedule.task.stop();
      console.log(`⏹️ Stopped schedule: ${name}`);
    }
    
    // Close queue
    await this.jobQueue.close();
    
    // Close Redis
    await this.redis.quit();
    
    console.log('🛑 Research Scheduler stopped');
  }
}

module.exports = ResearchScheduler;