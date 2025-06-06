/**
 * Simple Migration Runner
 * Executes database migrations without Redis dependency
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const db = new Pool({
  connectionString: process.env.NEON_DB_CONNECTION_STRING || process.env.DATABASE_URL,
  max: 50
});

// Migration functions
async function createVenueManagementMigration() {
  return `-- Migration: Venue Management Service
-- Generated: ${new Date().toISOString()}

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
VALUES ('003', 'Venue Management Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed';

COMMIT;`;
}

async function createConstraintValidationMigration() {
  return `-- Migration: Constraint Validation Service
-- Generated: ${new Date().toISOString()}

BEGIN;

-- Create constraint validation schema
CREATE SCHEMA IF NOT EXISTS constraint_validation;

-- Migrate constraints table
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
);

-- Create indexes for parallel processing
CREATE INDEX idx_constraints_type ON constraint_validation.constraints(type);
CREATE INDEX idx_constraints_priority ON constraint_validation.constraints(priority DESC);
CREATE INDEX idx_constraints_worker ON constraint_validation.constraints(worker_affinity);
CREATE INDEX idx_validation_results_constraint ON constraint_validation.validation_results(constraint_id);

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('004', 'Constraint Validation Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed';

COMMIT;`;
}

async function createScheduleGenerationMigration() {
  return `-- Migration: Schedule Generation Service
-- Generated: ${new Date().toISOString()}

BEGIN;

-- Create schedule generation schema
CREATE SCHEMA IF NOT EXISTS schedule_generation;

-- Migrate schedules table
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
);

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
VALUES ('005', 'Schedule Generation Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed';

COMMIT;`;
}

// Main execution
async function runMigrations() {
  console.log('🚀 Starting FlexTime Migration System (Simple Version)');
  console.log('================================================\n');
  
  try {
    // Check database connection
    await db.query('SELECT 1');
    console.log('✅ Database connection established\n');
    
    // Check existing migrations
    const existingMigrations = await db.query(
      'SELECT version FROM schema_migrations WHERE status = $1',
      ['completed']
    );
    const completedVersions = new Set(existingMigrations.rows.map(r => r.version));
    
    // Define migrations
    const migrations = [
      {
        version: '003',
        name: 'Venue Management Service Migration',
        generator: createVenueManagementMigration
      },
      {
        version: '004', 
        name: 'Constraint Validation Service Migration',
        generator: createConstraintValidationMigration
      },
      {
        version: '005',
        name: 'Schedule Generation Service Migration', 
        generator: createScheduleGenerationMigration
      }
    ];
    
    // Execute pending migrations
    let executedCount = 0;
    
    for (const migration of migrations) {
      if (completedVersions.has(migration.version)) {
        console.log(`⏭️  Skipping ${migration.version} (already completed)`);
        continue;
      }
      
      console.log(`\n📋 Executing: ${migration.name}`);
      console.log(`   Version: ${migration.version}`);
      
      const startTime = Date.now();
      
      try {
        // Generate migration SQL
        const sql = await migration.generator();
        
        // Write migration file
        const migrationPath = path.join(__dirname, '../db/migrations', `${migration.version}_${migration.name.toLowerCase().replace(/ /g, '_')}.sql`);
        await fs.writeFile(migrationPath, sql);
        console.log(`   📝 Created migration file: ${migrationPath}`);
        
        // Execute migration
        await db.query(sql);
        
        const duration = Date.now() - startTime;
        console.log(`   ✅ Completed in ${duration}ms`);
        
        executedCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        
        // Record failure
        await db.query(
          `INSERT INTO schema_migrations (version, description, status) 
           VALUES ($1, $2, 'failed')
           ON CONFLICT (version) DO UPDATE SET status = 'failed'`,
          [migration.version, migration.name]
        );
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('===================');
    console.log(`Total migrations: ${migrations.length}`);
    console.log(`Executed: ${executedCount}`);
    console.log(`Skipped: ${migrations.length - executedCount}`);
    
    // Check final status
    const finalStatus = await db.query('SELECT * FROM schema_migrations ORDER BY version');
    console.log('\n📋 Migration Status:');
    finalStatus.rows.forEach(row => {
      const icon = row.status === 'completed' ? '✅' : '❌';
      console.log(`${icon} ${row.version}: ${row.status}`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migrations
runMigrations().catch(console.error);