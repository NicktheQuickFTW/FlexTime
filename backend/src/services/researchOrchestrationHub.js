/**
 * Research Orchestration Hub
 * 
 * Central coordination point for all research activities:
 * - Manages research scheduler
 * - Coordinates validation agents
 * - Handles data persistence
 * - Provides monitoring and feedback
 * - Manages agent communication
 */

const EventEmitter = require('events');
const { Sequelize } = require('sequelize');
const ResearchScheduler = require('./researchScheduler');
const ResearchValidationAgent = require('./researchValidationAgent');
const ResearchCompassIntegration = require('./researchCompassIntegration');
const ComprehensiveResearchProcessor = require('./comprehensiveResearchProcessor');
const ResearchDataRetentionPolicy = require('./researchDataRetentionPolicy');
const config = require('../config/neon_db_config');

class ResearchOrchestrationHub extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      autoStart: options.autoStart !== false,
      enableScheduling: options.enableScheduling !== false,
      enableValidation: options.enableValidation !== false,
      enableMonitoring: options.enableMonitoring !== false,
      database: options.database || config,
      redis: options.redis || { host: 'localhost', port: 6379 },
      ...options
    };
    
    this.agents = {
      scheduler: null,
      validator: null,
      integrator: null,
      processor: null
    };
    
    this.retentionPolicy = new ResearchDataRetentionPolicy();
    
    this.metrics = {
      researches: { total: 0, successful: 0, failed: 0 },
      validations: { total: 0, passed: 0, failed: 0 },
      integrations: { total: 0, successful: 0, failed: 0 },
      apiCalls: { total: 0, perplexity: 0, gemini: 0 }
    };
    
    this.activeOperations = new Map();
    this.sequelize = null;
  }

  async initialize() {
    console.log('🎯 Initializing Research Orchestration Hub...');
    
    try {
      // Initialize database connection
      await this.initializeDatabase();
      
      // Initialize agents
      await this.initializeAgents();
      
      // Setup inter-agent communication
      this.setupCommunication();
      
      // Setup monitoring
      if (this.config.enableMonitoring) {
        this.setupMonitoring();
      }
      
      // Start scheduling if enabled
      if (this.config.autoStart && this.config.enableScheduling) {
        await this.startScheduling();
      }
      
      console.log('✅ Research Orchestration Hub initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize orchestration hub:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    this.sequelize = new Sequelize(this.config.database.connectionString, {
      dialectOptions: this.config.database.connection.dialectOptions,
      logging: false
    });
    
    await this.sequelize.authenticate();
    console.log('✅ Database connection established');
  }

  async initializeAgents() {
    // Initialize Research Scheduler
    if (this.config.enableScheduling) {
      this.agents.scheduler = new ResearchScheduler({
        redis: this.config.redis,
        maxConcurrent: 5,
        rateLimit: { perMinute: 10, perHour: 100 }
      });
      await this.agents.scheduler.initialize();
    }
    
    // Initialize Validation Agent
    if (this.config.enableValidation) {
      this.agents.validator = new ResearchValidationAgent({
        minConfidence: 0.7,
        maxDataAge: 7
      });
    }
    
    // Initialize Integration Agent
    this.agents.integrator = new ResearchCompassIntegration(this.sequelize);
    
    // Initialize Comprehensive Processor
    this.agents.processor = new ComprehensiveResearchProcessor(this.sequelize);
    
    console.log('✅ All agents initialized');
  }

  setupCommunication() {
    // Scheduler -> Orchestrator communication
    if (this.agents.scheduler) {
      this.agents.scheduler.on('research_completed', async (data) => {
        await this.handleResearchCompleted(data);
      });
      
      this.agents.scheduler.on('job_failed', async (data) => {
        await this.handleJobFailed(data);
      });
      
      this.agents.scheduler.on('job_stalled', async (data) => {
        await this.handleJobStalled(data);
      });
    }
    
    // Validator -> Orchestrator communication
    if (this.agents.validator) {
      this.agents.validator.on('validation_completed', async (validation) => {
        await this.handleValidationCompleted(validation);
      });
      
      this.agents.validator.on('validation_error', async (data) => {
        await this.handleValidationError(data);
      });
    }
    
    console.log('✅ Inter-agent communication established');
  }

  setupMonitoring() {
    // Setup monitoring interval
    this.monitoringInterval = setInterval(async () => {
      const status = await this.getSystemStatus();
      this.emit('status_update', status);
      
      // Check for issues
      if (status.health.issues.length > 0) {
        this.emit('health_alert', status.health);
      }
    }, 30000); // Every 30 seconds
    
    console.log('✅ Monitoring system activated');
  }

  async handleResearchCompleted(data) {
    const { jobId, type, sport, results } = data;
    console.log(`📊 Processing completed research: ${jobId}`);
    
    const operation = {
      id: `op_${Date.now()}`,
      jobId,
      type,
      sport,
      status: 'processing',
      startTime: Date.now()
    };
    
    this.activeOperations.set(operation.id, operation);
    this.metrics.researches.total++;
    
    try {
      // Step 1: Validate research data
      let validatedResults = results;
      if (this.config.enableValidation) {
        console.log('🔍 Validating research data...');
        const validation = await this.agents.validator.validateResearchData(results, type);
        
        if (validation.status === 'failed') {
          throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Validation warnings:', validation.warnings);
        }
        
        validatedResults = {
          ...results,
          validation: {
            status: validation.status,
            confidence: validation.confidence,
            warnings: validation.warnings
          }
        };
      }
      
      // Step 2: Process and integrate data
      console.log('💾 Integrating research data...');
      
      if (type === 'comprehensive' || type === 'compass_ratings') {
        // Process COMPASS ratings
        await this.agents.integrator.processResearchFile(validatedResults);
      }
      
      // Process comprehensive research data
      if (type === 'comprehensive' || type === 'transfer_portal' || type === 'recruiting') {
        await this.agents.processor.processResearchData(validatedResults);
      }
      
      // Step 3: Update operation status
      operation.status = 'completed';
      operation.endTime = Date.now();
      operation.duration = operation.endTime - operation.startTime;
      
      this.metrics.researches.successful++;
      this.metrics.integrations.successful++;
      
      console.log(`✅ Research integration completed in ${operation.duration}ms`);
      
      // Emit completion event
      this.emit('research_integrated', {
        operation,
        results: validatedResults
      });
      
    } catch (error) {
      console.error(`❌ Research integration failed:`, error);
      
      operation.status = 'failed';
      operation.error = error.message;
      operation.endTime = Date.now();
      
      this.metrics.researches.failed++;
      this.metrics.integrations.failed++;
      
      // Emit failure event
      this.emit('research_failed', {
        operation,
        error
      });
      
      // Attempt recovery
      await this.attemptRecovery(operation, error);
    } finally {
      this.activeOperations.delete(operation.id);
    }
  }

  async handleValidationCompleted(validation) {
    this.metrics.validations.total++;
    
    if (validation.status === 'passed') {
      this.metrics.validations.passed++;
    } else {
      this.metrics.validations.failed++;
    }
    
    // Store validation results
    await this.storeValidationResults(validation);
  }

  async handleValidationError(data) {
    console.error('❌ Validation error:', data.error);
    
    // Log to error tracking
    await this.logError('validation', data);
  }

  async handleJobFailed(data) {
    console.error(`❌ Research job failed: ${data.job.id}`);
    
    // Determine if retry is appropriate
    const shouldRetry = data.job.attemptsMade < 3 && 
                       !data.error.message.includes('rate limit');
    
    if (shouldRetry) {
      console.log('🔄 Scheduling retry...');
      // The job queue handles retries automatically
    } else {
      // Send alert for manual intervention
      this.emit('job_failure_alert', {
        job: data.job,
        error: data.error,
        attemptsMade: data.job.attemptsMade
      });
    }
  }

  async handleJobStalled(data) {
    console.warn(`⚠️ Job stalled: ${data.job.id}`);
    
    // Check if job should be restarted
    const job = data.job;
    const stallCount = job.opts.stallCount || 0;
    
    if (stallCount < 2) {
      console.log('🔄 Restarting stalled job...');
      // Job queue will handle restart
    } else {
      this.emit('job_stalled_alert', {
        job: data.job,
        stallCount
      });
    }
  }

  async startScheduling() {
    if (!this.agents.scheduler) {
      throw new Error('Scheduler not initialized');
    }
    
    console.log('🚀 Starting research scheduling...');
    
    // Trigger initial comprehensive research for all sports
    await this.agents.scheduler.scheduleResearch({
      type: 'comprehensive',
      priority: 3,
      sports: ['all'],
      description: 'Initial comprehensive research'
    });
    
    console.log('✅ Research scheduling started');
  }

  async scheduleImmediate(config) {
    if (!this.agents.scheduler) {
      throw new Error('Scheduler not initialized');
    }
    
    return await this.agents.scheduler.scheduleResearch({
      ...config,
      priority: 1, // High priority for immediate requests
      description: config.description || 'Manual immediate research'
    });
  }

  async triggerEvent(eventType, data) {
    if (!this.agents.scheduler) {
      throw new Error('Scheduler not initialized');
    }
    
    // Emit event to trigger research
    this.agents.scheduler.emit(eventType, data);
    
    console.log(`📢 Triggered event: ${eventType}`);
  }

  async attemptRecovery(operation, error) {
    console.log('🔧 Attempting recovery for failed operation...');
    
    // Implement recovery strategies
    if (error.message.includes('rate limit')) {
      // Wait and retry later
      console.log('⏳ Rate limit detected, scheduling delayed retry...');
      setTimeout(() => {
        this.scheduleImmediate({
          type: operation.type,
          sport: operation.sport,
          priority: 3,
          metadata: { retryFor: operation.id }
        });
      }, 300000); // 5 minutes
    } else if (error.message.includes('timeout')) {
      // Try with reduced scope
      console.log('🔄 Timeout detected, retrying with reduced scope...');
      // Implementation depends on operation type
    }
  }

  async storeValidationResults(validation) {
    try {
      await this.sequelize.query(`
        INSERT INTO research_validations (
          validation_id, research_type, status, confidence,
          errors, warnings, validated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, {
        bind: [
          validation.id,
          validation.type,
          validation.status,
          validation.confidence,
          JSON.stringify(validation.errors),
          JSON.stringify(validation.warnings)
        ]
      });
    } catch (error) {
      console.error('Failed to store validation results:', error);
    }
  }

  async logError(category, data) {
    try {
      await this.sequelize.query(`
        INSERT INTO research_errors (
          category, error_message, error_data, occurred_at
        ) VALUES ($1, $2, $3, NOW())
      `, {
        bind: [
          category,
          data.error.message,
          JSON.stringify(data)
        ]
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  async getSystemStatus() {
    const status = {
      timestamp: new Date(),
      orchestrator: 'active',
      agents: {},
      metrics: this.metrics,
      activeOperations: this.activeOperations.size,
      health: {
        status: 'healthy',
        issues: []
      }
    };
    
    // Get scheduler status
    if (this.agents.scheduler) {
      status.agents.scheduler = await this.agents.scheduler.getStatus();
    }
    
    // Get validator status
    if (this.agents.validator) {
      status.agents.validator = this.agents.validator.getValidationStats();
    }
    
    // Check health conditions
    if (this.metrics.researches.failed > this.metrics.researches.successful * 0.1) {
      status.health.issues.push({
        severity: 'warning',
        message: 'High research failure rate detected'
      });
    }
    
    if (this.activeOperations.size > 10) {
      status.health.issues.push({
        severity: 'warning',
        message: 'High number of active operations'
      });
    }
    
    if (status.health.issues.length > 0) {
      status.health.status = 'degraded';
    }
    
    return status;
  }

  async getResearchHistory(filters = {}) {
    const { sport, type, startDate, endDate, limit = 100 } = filters;
    
    let query = `
      SELECT * FROM comprehensive_research_data
      WHERE 1=1
    `;
    
    const bindings = [];
    let bindIndex = 1;
    
    if (sport) {
      query += ` AND sport = $${bindIndex++}`;
      bindings.push(sport);
    }
    
    if (type) {
      query += ` AND research_type = $${bindIndex++}`;
      bindings.push(type);
    }
    
    if (startDate) {
      query += ` AND created_at >= $${bindIndex++}`;
      bindings.push(startDate);
    }
    
    if (endDate) {
      query += ` AND created_at <= $${bindIndex++}`;
      bindings.push(endDate);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${bindIndex}`;
    bindings.push(limit);
    
    const [results] = await this.sequelize.query(query, { bind: bindings });
    
    return results;
  }

  async clearResearchData(filters = {}) {
    const { sport, type, olderThan, tableName = 'comprehensive_research_data', force = false } = filters;
    
    console.log('🧹 Clearing research data with filters:', filters);
    
    // Validate against retention policy
    const validation = this.retentionPolicy.validateDeletion(tableName, filters);
    if (!validation.allowed && !force) {
      throw new Error(`Deletion not allowed: ${validation.reason}`);
    }
    
    // Warning for permanent data deletion attempt
    if (this.retentionPolicy.isPermanentData(tableName)) {
      console.warn('⚠️  WARNING: Attempting to delete from permanent data table:', tableName);
      throw new Error('Cannot delete from permanent data tables. These records are historical and must be preserved.');
    }
    
    let query = `
      DELETE FROM ${tableName}
      WHERE 1=1
    `;
    
    const bindings = [];
    let bindIndex = 1;
    
    if (sport) {
      query += ` AND sport = $${bindIndex++}`;
      bindings.push(sport);
    }
    
    if (type) {
      query += ` AND research_type = $${bindIndex++}`;
      bindings.push(type);
    }
    
    if (olderThan) {
      query += ` AND created_at < $${bindIndex++}`;
      bindings.push(olderThan);
    }
    
    // Safety check - require at least one filter
    if (bindings.length === 0) {
      throw new Error('At least one filter required for data clearing');
    }
    
    const [result] = await this.sequelize.query(query, { bind: bindings });
    
    console.log(`✅ Cleared ${result.rowCount || 0} records from ${tableName}`);
    
    return { 
      deleted: result.rowCount || 0,
      table: tableName,
      policy: validation
    };
  }

  async performDataMaintenance() {
    console.log('🔧 Performing data maintenance based on retention policies...');
    
    const maintenanceResults = {
      timestamp: new Date(),
      cleaned: {},
      archived: {},
      errors: []
    };
    
    try {
      // Get cleanup queries from retention policy
      const cleanupQueries = this.retentionPolicy.generateCleanupQueries();
      
      for (const cleanup of cleanupQueries) {
        try {
          console.log(`🧹 ${cleanup.description}`);
          
          const [result] = await this.sequelize.query(cleanup.query);
          const affected = result.rowCount || 0;
          
          if (cleanup.type === 'archive') {
            maintenanceResults.archived[cleanup.table] = affected;
          } else {
            maintenanceResults.cleaned[cleanup.table] = affected;
          }
          
          console.log(`   ✅ Affected rows: ${affected}`);
          
        } catch (error) {
          console.error(`   ❌ Error cleaning ${cleanup.table}:`, error.message);
          maintenanceResults.errors.push({
            table: cleanup.table,
            error: error.message
          });
        }
      }
      
      // Get data statistics after cleanup
      maintenanceResults.statistics = await this.retentionPolicy.getDataStatistics(this.sequelize);
      
      console.log('✅ Data maintenance completed');
      
      // Emit maintenance report
      this.emit('maintenance_completed', maintenanceResults);
      
      return maintenanceResults;
      
    } catch (error) {
      console.error('❌ Data maintenance failed:', error);
      throw error;
    }
  }

  async getRetentionPolicyReport() {
    const report = this.retentionPolicy.generateReport();
    report.statistics = await this.retentionPolicy.getDataStatistics(this.sequelize);
    
    return report;
  }

  async stop() {
    console.log('🛑 Stopping Research Orchestration Hub...');
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Stop agents
    if (this.agents.scheduler) {
      await this.agents.scheduler.stop();
    }
    
    // Close database
    if (this.sequelize) {
      await this.sequelize.close();
    }
    
    console.log('✅ Research Orchestration Hub stopped');
  }
}

module.exports = ResearchOrchestrationHub;