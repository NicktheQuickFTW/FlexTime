/**
 * Migration Orchestration System
 * Utilizes 100 workers for parallel migration execution
 * Production-scale migration management for FlexTime
 */

const { Worker } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const Redis = require('ioredis');
const EventEmitter = require('events');

// Configuration
const WORKER_COUNT = 100;
const MIGRATION_BATCH_SIZE = 1000;
const MAX_RETRIES = 3;
const CHECKPOINT_INTERVAL = 5000; // 5 seconds

class MigrationOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      workerCount: config.workerCount || WORKER_COUNT,
      batchSize: config.batchSize || MIGRATION_BATCH_SIZE,
      maxRetries: config.maxRetries || MAX_RETRIES,
      checkpointInterval: config.checkpointInterval || CHECKPOINT_INTERVAL,
      databaseUrl: config.databaseUrl || process.env.NEON_DB_CONNECTION_STRING,
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    };

    this.workers = [];
    this.taskQueue = [];
    this.completedTasks = new Set();
    this.failedTasks = new Map();
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };

    // Initialize connections
    this.db = new Pool({ connectionString: this.config.databaseUrl });
    this.redis = new Redis(this.config.redisUrl);
    this.isRunning = false;
  }

  async initialize() {
    console.log(`🚀 Initializing Migration Orchestrator with ${this.config.workerCount} workers...`);
    
    // Create workers
    for (let i = 0; i < this.config.workerCount; i++) {
      await this.createWorker(i);
    }

    // Set up checkpoint system
    this.checkpointTimer = setInterval(() => {
      this.saveCheckpoint();
    }, this.config.checkpointInterval);

    // Initialize migration tracking table
    await this.initializeMigrationTracking();
    
    console.log('✅ Migration Orchestrator initialized successfully');
  }

  async createWorker(workerId) {
    const worker = new Worker(path.join(__dirname, 'migration-worker.js'), {
      workerData: {
        workerId,
        databaseUrl: this.config.databaseUrl,
        redisUrl: this.config.redisUrl
      }
    });

    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });

    worker.on('error', (error) => {
      console.error(`Worker ${workerId} error:`, error);
      this.restartWorker(workerId);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${workerId} exited with code ${code}`);
        this.restartWorker(workerId);
      }
    });

    this.workers[workerId] = worker;
  }

  async restartWorker(workerId) {
    console.log(`Restarting worker ${workerId}...`);
    if (this.workers[workerId]) {
      await this.workers[workerId].terminate();
    }
    await this.createWorker(workerId);
  }

  handleWorkerMessage(workerId, message) {
    switch (message.type) {
      case 'task_completed':
        this.handleTaskCompletion(workerId, message.taskId, message.result);
        break;
      case 'task_failed':
        this.handleTaskFailure(workerId, message.taskId, message.error);
        break;
      case 'progress':
        this.updateProgress(workerId, message.progress);
        break;
      case 'log':
        console.log(`[Worker ${workerId}] ${message.message}`);
        break;
    }
  }

  async initializeMigrationTracking() {
    const query = `
      CREATE TABLE IF NOT EXISTS migration_executions (
        id SERIAL PRIMARY KEY,
        migration_id VARCHAR(255) NOT NULL,
        worker_id INTEGER,
        status VARCHAR(50) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        affected_rows INTEGER,
        checkpoint_data JSONB,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_migration_executions_status 
        ON migration_executions(status);
      CREATE INDEX IF NOT EXISTS idx_migration_executions_migration_id 
        ON migration_executions(migration_id);
    `;

    await this.db.query(query);
  }

  async loadMigrations() {
    const migrations = [];
    
    // Load pending migrations from different directories
    const migrationDirs = [
      path.join(__dirname, '../db/migrations'),
      path.join(__dirname, '../src/ai/migrations'),
      path.join(__dirname, '../src/constraints/v2/database/migrations')
    ];

    for (const dir of migrationDirs) {
      try {
        const files = await fs.readdir(dir);
        const sqlFiles = files.filter(f => f.endsWith('.sql'));
        
        for (const file of sqlFiles) {
          const content = await fs.readFile(path.join(dir, file), 'utf8');
          const migrationId = file.replace('.sql', '');
          
          // Check if migration already executed
          const isExecuted = await this.isMigrationExecuted(migrationId);
          if (!isExecuted) {
            migrations.push({
              id: migrationId,
              path: path.join(dir, file),
              content,
              directory: dir
            });
          }
        }
      } catch (error) {
        console.warn(`Could not read migrations from ${dir}:`, error.message);
      }
    }

    // Add our new migrations that need to be created
    const newMigrations = await this.createPendingMigrations();
    migrations.push(...newMigrations);

    return migrations;
  }

  async isMigrationExecuted(migrationId) {
    const result = await this.db.query(
      'SELECT 1 FROM schema_migrations WHERE version = $1 AND status = $2',
      [migrationId, 'completed']
    );
    return result.rows.length > 0;
  }

  async createPendingMigrations() {
    const migrations = [];
    
    // Check and create missing migrations
    const pendingMigrations = [
      {
        id: '003_migrate_venue_management_service',
        creator: this.createVenueManagementMigration
      },
      {
        id: '004_migrate_constraint_validation_service',
        creator: this.createConstraintValidationMigration
      },
      {
        id: '005_migrate_schedule_generation_service',
        creator: this.createScheduleGenerationMigration
      }
    ];

    for (const pending of pendingMigrations) {
      const migrationPath = path.join(__dirname, '../db/migrations', `${pending.id}.sql`);
      
      try {
        await fs.access(migrationPath);
        // Migration file exists
      } catch {
        // Create migration file
        console.log(`Creating migration: ${pending.id}`);
        const content = await pending.creator.call(this);
        await fs.writeFile(migrationPath, content);
        
        migrations.push({
          id: pending.id,
          path: migrationPath,
          content,
          directory: path.join(__dirname, '../db/migrations')
        });
      }
    }

    return migrations;
  }

  async executeMigrations(migrations) {
    console.log(`📋 Found ${migrations.length} pending migrations`);
    
    this.progress.total = migrations.length;
    this.progress.startTime = Date.now();
    this.isRunning = true;

    // Distribute migrations to workers
    const migrationTasks = migrations.map((migration, index) => ({
      id: `migration_${migration.id}`,
      type: 'migration',
      migration,
      priority: index
    }));

    // Add tasks to queue
    this.taskQueue.push(...migrationTasks);

    // Start processing
    await this.processTasks();

    // Wait for completion
    await this.waitForCompletion();

    this.progress.endTime = Date.now();
    this.isRunning = false;

    // Generate report
    return this.generateReport();
  }

  async processTasks() {
    const availableWorkers = [...Array(this.config.workerCount).keys()];
    
    while (this.taskQueue.length > 0 && availableWorkers.length > 0) {
      const task = this.taskQueue.shift();
      const workerId = availableWorkers.shift();
      
      this.assignTaskToWorker(workerId, task);
    }
  }

  assignTaskToWorker(workerId, task) {
    const worker = this.workers[workerId];
    
    worker.postMessage({
      type: 'execute_task',
      task
    });

    // Track assignment
    this.redis.hset(`worker:${workerId}`, 'current_task', JSON.stringify(task));
  }

  async handleTaskCompletion(workerId, taskId, result) {
    this.completedTasks.add(taskId);
    this.progress.completed++;
    
    // Log completion
    await this.db.query(
      `UPDATE migration_executions 
       SET status = 'completed', 
           completed_at = CURRENT_TIMESTAMP,
           affected_rows = $1
       WHERE migration_id = $2 AND worker_id = $3`,
      [result.affectedRows || 0, taskId, workerId]
    );

    // Emit progress
    this.emit('progress', {
      completed: this.progress.completed,
      total: this.progress.total,
      percentage: (this.progress.completed / this.progress.total) * 100
    });

    // Assign next task if available
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.assignTaskToWorker(workerId, nextTask);
    }
  }

  async handleTaskFailure(workerId, taskId, error) {
    const retries = this.failedTasks.get(taskId) || 0;
    
    if (retries < this.config.maxRetries) {
      // Retry task
      this.failedTasks.set(taskId, retries + 1);
      const task = await this.getTaskById(taskId);
      this.taskQueue.push(task);
      console.log(`Retrying task ${taskId} (attempt ${retries + 1})`);
    } else {
      // Mark as permanently failed
      this.progress.failed++;
      await this.db.query(
        `UPDATE migration_executions 
         SET status = 'failed', 
             completed_at = CURRENT_TIMESTAMP,
             error_message = $1
         WHERE migration_id = $2 AND worker_id = $3`,
        [error.message, taskId, workerId]
      );
    }
  }

  async saveCheckpoint() {
    if (!this.isRunning) return;

    const checkpoint = {
      timestamp: Date.now(),
      progress: this.progress,
      completedTasks: Array.from(this.completedTasks),
      failedTasks: Array.from(this.failedTasks.entries()),
      taskQueueSize: this.taskQueue.length
    };

    await this.redis.set(
      'migration:checkpoint',
      JSON.stringify(checkpoint),
      'EX',
      3600 // 1 hour expiry
    );
  }

  async waitForCompletion() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.progress.completed + this.progress.failed >= this.progress.total) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  generateReport() {
    const duration = this.progress.endTime - this.progress.startTime;
    const successRate = (this.progress.completed / this.progress.total) * 100;

    return {
      summary: {
        total: this.progress.total,
        completed: this.progress.completed,
        failed: this.progress.failed,
        duration: `${(duration / 1000).toFixed(2)}s`,
        successRate: `${successRate.toFixed(2)}%`,
        workersUsed: this.config.workerCount
      },
      completedMigrations: Array.from(this.completedTasks),
      failedMigrations: Array.from(this.failedTasks.keys()),
      performance: {
        migrationsPerSecond: (this.progress.completed / (duration / 1000)).toFixed(2),
        averageTimePerMigration: `${(duration / this.progress.completed).toFixed(2)}ms`
      }
    };
  }

  async cleanup() {
    clearInterval(this.checkpointTimer);
    
    // Terminate all workers
    await Promise.all(
      this.workers.map(worker => worker.terminate())
    );

    // Close connections
    await this.db.end();
    await this.redis.quit();
  }

  // Migration creation methods
  async createVenueManagementMigration() {
    return `-- Migration: Venue Management Service
-- Generated: ${new Date().toISOString()}
-- Workers: 100

BEGIN;

-- Create venue management schema
CREATE SCHEMA IF NOT EXISTS venue_management;

-- Migrate venues table
CREATE TABLE venue_management.venues AS
SELECT * FROM public.venues;

-- Add service-specific columns
ALTER TABLE venue_management.venues
ADD COLUMN IF NOT EXISTS service_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX idx_venues_school_id ON venue_management.venues(school_id);
CREATE INDEX idx_venues_sport_type ON venue_management.venues(sport_type);
CREATE INDEX idx_venues_capacity ON venue_management.venues(capacity);

-- Migrate venue unavailability
CREATE TABLE venue_management.venue_unavailability AS
SELECT * FROM public.venue_unavailability;

-- Add partitioning for large datasets
CREATE TABLE venue_management.venue_availability_2025 
PARTITION OF venue_management.venue_unavailability
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE venue_management.venue_availability_2026
PARTITION OF venue_management.venue_unavailability
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Create materialized views for performance
CREATE MATERIALIZED VIEW venue_management.venue_usage_stats AS
SELECT 
  v.id,
  v.name,
  COUNT(vu.id) as total_unavailable_days,
  AVG(EXTRACT(EPOCH FROM (vu.end_date - vu.start_date))/86400) as avg_unavailable_duration
FROM venue_management.venues v
LEFT JOIN venue_management.venue_unavailability vu ON v.id = vu.venue_id
GROUP BY v.id, v.name;

-- Create API functions
CREATE OR REPLACE FUNCTION venue_management.get_available_venues(
  p_sport_type VARCHAR,
  p_date DATE,
  p_capacity INTEGER DEFAULT 0
) RETURNS TABLE(
  venue_id INTEGER,
  venue_name VARCHAR,
  capacity INTEGER,
  location VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT v.id, v.name, v.capacity, v.location
  FROM venue_management.venues v
  WHERE v.sport_type = p_sport_type
    AND v.capacity >= p_capacity
    AND NOT EXISTS (
      SELECT 1 FROM venue_management.venue_unavailability vu
      WHERE vu.venue_id = v.id
        AND p_date BETWEEN vu.start_date AND vu.end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('003_migrate_venue_management_service', 'Venue Management Service Migration', 'completed');

COMMIT;
`;
  }

  async createConstraintValidationMigration() {
    return `-- Migration: Constraint Validation Service
-- Generated: ${new Date().toISOString()}
-- Workers: 100

BEGIN;

-- Create constraint validation schema
CREATE SCHEMA IF NOT EXISTS constraint_validation;

-- Migrate constraints table with parallel workers
CREATE TABLE constraint_validation.constraints AS
SELECT * FROM public.constraints;

-- Add service-specific enhancements
ALTER TABLE constraint_validation.constraints
ADD COLUMN IF NOT EXISTS validation_cache JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_validated TIMESTAMP,
ADD COLUMN IF NOT EXISTS validation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_validation_time_ms FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS worker_affinity INTEGER;

-- Create constraint categories
CREATE TABLE constraint_validation.constraint_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  priority INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO constraint_validation.constraint_categories (name, description, priority) VALUES
('scheduling', 'Date and time-based constraints', 100),
('venue', 'Venue availability and capacity constraints', 90),
('travel', 'Travel distance and time constraints', 80),
('competitive', 'Competitive balance constraints', 70),
('broadcast', 'TV and streaming constraints', 60),
('academic', 'Academic calendar constraints', 50);

-- Create constraint validation results table
CREATE TABLE constraint_validation.validation_results (
  id SERIAL PRIMARY KEY,
  constraint_id INTEGER REFERENCES constraint_validation.constraints(id),
  schedule_id INTEGER,
  validation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_satisfied BOOLEAN NOT NULL,
  violation_severity FLOAT,
  violation_details JSONB,
  worker_id INTEGER,
  processing_time_ms INTEGER
) PARTITION BY RANGE (validation_time);

-- Create partitions for validation results
CREATE TABLE constraint_validation.validation_results_2025_q1
PARTITION OF constraint_validation.validation_results
FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE constraint_validation.validation_results_2025_q2
PARTITION OF constraint_validation.validation_results
FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- High-performance validation function
CREATE OR REPLACE FUNCTION constraint_validation.validate_constraint_parallel(
  p_constraint_id INTEGER,
  p_schedule_data JSONB,
  p_worker_id INTEGER DEFAULT NULL
) RETURNS TABLE(
  is_satisfied BOOLEAN,
  violation_severity FLOAT,
  violation_details JSONB,
  processing_time_ms INTEGER
) AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_constraint RECORD;
  v_result RECORD;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Get constraint details
  SELECT * INTO v_constraint
  FROM constraint_validation.constraints
  WHERE id = p_constraint_id;
  
  -- Perform validation based on constraint type
  -- This is optimized for parallel execution
  CASE v_constraint.type
    WHEN 'date_constraint' THEN
      -- Date validation logic
      v_result := constraint_validation.validate_date_constraint(v_constraint, p_schedule_data);
    WHEN 'venue_constraint' THEN
      -- Venue validation logic
      v_result := constraint_validation.validate_venue_constraint(v_constraint, p_schedule_data);
    WHEN 'travel_constraint' THEN
      -- Travel validation logic
      v_result := constraint_validation.validate_travel_constraint(v_constraint, p_schedule_data);
    ELSE
      -- Generic validation
      v_result := constraint_validation.validate_generic_constraint(v_constraint, p_schedule_data);
  END CASE;
  
  -- Update statistics
  UPDATE constraint_validation.constraints
  SET validation_count = validation_count + 1,
      last_validated = CURRENT_TIMESTAMP,
      avg_validation_time_ms = (
        (avg_validation_time_ms * validation_count + 
         EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)) / 
        (validation_count + 1)
      )
  WHERE id = p_constraint_id;
  
  RETURN QUERY SELECT 
    v_result.is_satisfied,
    v_result.violation_severity,
    v_result.violation_details,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER;
END;
$$ LANGUAGE plpgsql PARALLEL SAFE;

-- Create indexes for parallel processing
CREATE INDEX idx_constraints_type ON constraint_validation.constraints(type);
CREATE INDEX idx_constraints_priority ON constraint_validation.constraints(priority DESC);
CREATE INDEX idx_constraints_worker ON constraint_validation.constraints(worker_affinity);
CREATE INDEX idx_validation_results_constraint ON constraint_validation.validation_results(constraint_id);

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('004_migrate_constraint_validation_service', 'Constraint Validation Service Migration', 'completed');

COMMIT;
`;
  }

  async createScheduleGenerationMigration() {
    return `-- Migration: Schedule Generation Service
-- Generated: ${new Date().toISOString()}
-- Workers: 100

BEGIN;

-- Create schedule generation schema
CREATE SCHEMA IF NOT EXISTS schedule_generation;

-- Migrate schedules table with enhancements
CREATE TABLE schedule_generation.schedules AS
SELECT * FROM public.schedules;

-- Add service-specific columns
ALTER TABLE schedule_generation.schedules
ADD COLUMN IF NOT EXISTS generation_method VARCHAR(50) DEFAULT 'legacy',
ADD COLUMN IF NOT EXISTS worker_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS optimization_score FLOAT,
ADD COLUMN IF NOT EXISTS parallel_chunks INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create schedule generation jobs table
CREATE TABLE schedule_generation.generation_jobs (
  id SERIAL PRIMARY KEY,
  job_id UUID DEFAULT gen_random_uuid(),
  sport_id INTEGER,
  season VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  worker_count INTEGER DEFAULT 100,
  total_games INTEGER,
  processed_games INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  configuration JSONB,
  result_schedule_id INTEGER REFERENCES schedule_generation.schedules(id)
);

-- Create parallel processing chunks
CREATE TABLE schedule_generation.processing_chunks (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES schedule_generation.generation_jobs(job_id),
  chunk_id INTEGER,
  worker_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  team_ids INTEGER[],
  date_range DATERANGE,
  processing_start TIMESTAMP,
  processing_end TIMESTAMP,
  games_generated INTEGER,
  error_message TEXT
);

-- Create optimized game slots table
CREATE TABLE schedule_generation.game_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  venue_id INTEGER,
  is_available BOOLEAN DEFAULT true,
  reserved_by_job_id UUID,
  worker_id INTEGER
) PARTITION BY RANGE (date);

-- Create partitions for game slots
CREATE TABLE schedule_generation.game_slots_2025
PARTITION OF schedule_generation.game_slots
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE schedule_generation.game_slots_2026
PARTITION OF schedule_generation.game_slots
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- High-performance parallel schedule generation function
CREATE OR REPLACE FUNCTION schedule_generation.generate_schedule_parallel(
  p_sport_id INTEGER,
  p_season VARCHAR,
  p_worker_count INTEGER DEFAULT 100,
  p_configuration JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_teams INTEGER[];
  v_total_games INTEGER;
  v_chunk_size INTEGER;
BEGIN
  -- Create job
  INSERT INTO schedule_generation.generation_jobs (
    sport_id, season, worker_count, configuration, started_at
  ) VALUES (
    p_sport_id, p_season, p_worker_count, p_configuration, CURRENT_TIMESTAMP
  ) RETURNING job_id INTO v_job_id;
  
  -- Get teams for sport
  SELECT ARRAY_AGG(team_id) INTO v_teams
  FROM public.teams
  WHERE sport_id = p_sport_id;
  
  -- Calculate total games
  v_total_games := array_length(v_teams, 1) * (array_length(v_teams, 1) - 1) / 2;
  
  -- Update job with total games
  UPDATE schedule_generation.generation_jobs
  SET total_games = v_total_games
  WHERE job_id = v_job_id;
  
  -- Create processing chunks for parallel execution
  v_chunk_size := GREATEST(1, v_total_games / p_worker_count);
  
  -- Generate chunks
  INSERT INTO schedule_generation.processing_chunks (
    job_id, chunk_id, team_ids, date_range
  )
  SELECT 
    v_job_id,
    generate_series AS chunk_id,
    v_teams[((generate_series - 1) * 2 + 1):((generate_series * 2))] AS team_subset,
    daterange(
      DATE '2025-08-01' + (generate_series * 7),
      DATE '2025-08-01' + ((generate_series + 1) * 7)
    ) AS date_range
  FROM generate_series(1, p_worker_count);
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for schedule statistics
CREATE MATERIALIZED VIEW schedule_generation.schedule_stats AS
SELECT 
  s.id,
  s.sport_id,
  s.season,
  s.generation_method,
  s.worker_count,
  s.generation_time_ms,
  s.optimization_score,
  COUNT(g.id) as total_games,
  AVG(g.home_score + g.away_score) as avg_total_score
FROM schedule_generation.schedules s
LEFT JOIN public.games g ON s.id = g.schedule_id
GROUP BY s.id;

-- Create indexes for performance
CREATE INDEX idx_schedules_sport_season ON schedule_generation.schedules(sport_id, season);
CREATE INDEX idx_generation_jobs_status ON schedule_generation.generation_jobs(status);
CREATE INDEX idx_processing_chunks_job ON schedule_generation.processing_chunks(job_id, status);
CREATE INDEX idx_game_slots_availability ON schedule_generation.game_slots(date, is_available);

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('005_migrate_schedule_generation_service', 'Schedule Generation Service Migration', 'completed');

COMMIT;
`;
  }
}

// Main execution
async function main() {
  const orchestrator = new MigrationOrchestrator({
    workerCount: 100,
    batchSize: 1000
  });

  try {
    console.log('🚀 Starting FlexTime Migration System with 100 Workers');
    console.log('================================================');
    
    await orchestrator.initialize();
    
    // Load migrations
    const migrations = await orchestrator.loadMigrations();
    
    // Execute migrations
    const report = await orchestrator.executeMigrations(migrations);
    
    console.log('\n📊 Migration Report:');
    console.log('===================');
    console.log(JSON.stringify(report, null, 2));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await orchestrator.cleanup();
  }
}

// Export for testing
module.exports = { MigrationOrchestrator };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}