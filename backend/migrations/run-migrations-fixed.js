/**
 * Fixed Migration Runner - Matches actual database schema
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const db = new Pool({
  connectionString: process.env.NEON_DB_CONNECTION_STRING || process.env.DATABASE_URL,
  max: 50
});

// Migration functions updated to match actual schema
async function createVenueManagementMigration() {
  return `-- Migration: Venue Management Service
-- Generated: ${new Date().toISOString()}

BEGIN;

-- Create venue management schema if not exists
CREATE SCHEMA IF NOT EXISTS venue_management;

-- Copy venues table structure to new schema
CREATE TABLE IF NOT EXISTS venue_management.venues (
  venue_id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  city VARCHAR,
  state VARCHAR,
  capacity INTEGER,
  school_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Add service-specific columns
  service_version INTEGER DEFAULT 1,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Copy existing venue data
INSERT INTO venue_management.venues (venue_id, name, city, state, capacity, school_id, created_at, updated_at)
SELECT venue_id, name, city, state, capacity, school_id, created_at, updated_at
FROM public.venues
ON CONFLICT (venue_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vm_venues_school_id ON venue_management.venues(school_id);
CREATE INDEX IF NOT EXISTS idx_vm_venues_capacity ON venue_management.venues(capacity);

-- Copy venue unavailability table
CREATE TABLE IF NOT EXISTS venue_management.venue_unavailability (
  unavailability_id INTEGER PRIMARY KEY,
  venue_id INTEGER REFERENCES venue_management.venues(venue_id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason VARCHAR,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing unavailability data
INSERT INTO venue_management.venue_unavailability
SELECT * FROM public.venue_unavailability
ON CONFLICT (unavailability_id) DO NOTHING;

-- Create materialized view for venue usage stats
CREATE MATERIALIZED VIEW IF NOT EXISTS venue_management.venue_usage_stats AS
SELECT 
  v.venue_id,
  v.name,
  v.school_id,
  COUNT(vu.unavailability_id) as total_unavailable_periods,
  AVG(EXTRACT(EPOCH FROM (vu.end_date - vu.start_date))/86400) as avg_unavailable_duration_days
FROM venue_management.venues v
LEFT JOIN venue_management.venue_unavailability vu ON v.venue_id = vu.venue_id
GROUP BY v.venue_id, v.name, v.school_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_venue_usage_stats_school ON venue_management.venue_usage_stats(school_id);

-- Create API function for venue availability
CREATE OR REPLACE FUNCTION venue_management.get_available_venues(
  p_school_id INTEGER DEFAULT NULL,
  p_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_capacity INTEGER DEFAULT 0
) RETURNS TABLE(
  venue_id INTEGER,
  venue_name VARCHAR,
  capacity INTEGER,
  city VARCHAR,
  state VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT v.venue_id, v.name, v.capacity, v.city, v.state
  FROM venue_management.venues v
  WHERE (p_school_id IS NULL OR v.school_id = p_school_id)
    AND v.capacity >= p_capacity
    AND NOT EXISTS (
      SELECT 1 FROM venue_management.venue_unavailability vu
      WHERE vu.venue_id = v.venue_id
        AND p_date BETWEEN vu.start_date AND vu.end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('003', 'Venue Management Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed', executed_at = CURRENT_TIMESTAMP;

COMMIT;`;
}

async function createConstraintValidationMigration() {
  return `-- Migration: Constraint Validation Service
-- Generated: ${new Date().toISOString()}

BEGIN;

-- Create constraint validation schema
CREATE SCHEMA IF NOT EXISTS constraint_validation;

-- Copy constraints table with UUID support
CREATE TABLE IF NOT EXISTS constraint_validation.constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport VARCHAR NOT NULL,
  constraint_type VARCHAR NOT NULL,
  description TEXT,
  parameters JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Add service-specific enhancements
  validation_cache JSONB DEFAULT '{}',
  last_validated TIMESTAMP,
  validation_count INTEGER DEFAULT 0,
  avg_validation_time_ms FLOAT DEFAULT 0,
  worker_affinity INTEGER
);

-- Copy existing constraint data
INSERT INTO constraint_validation.constraints (id, sport, constraint_type, description, parameters, is_active, created_at)
SELECT id, sport, constraint_type, description, parameters, is_active, created_at
FROM public.constraints
ON CONFLICT (id) DO NOTHING;

-- Create constraint categories
CREATE TABLE IF NOT EXISTS constraint_validation.constraint_categories (
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
('academic', 'Academic calendar constraints', 50)
ON CONFLICT (name) DO NOTHING;

-- Create constraint validation results table
CREATE TABLE IF NOT EXISTS constraint_validation.validation_results (
  id SERIAL PRIMARY KEY,
  constraint_id UUID REFERENCES constraint_validation.constraints(id),
  schedule_id INTEGER,
  validation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_satisfied BOOLEAN NOT NULL,
  violation_severity FLOAT,
  violation_details JSONB,
  worker_id INTEGER,
  processing_time_ms INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cv_constraints_sport ON constraint_validation.constraints(sport);
CREATE INDEX IF NOT EXISTS idx_cv_constraints_type ON constraint_validation.constraints(constraint_type);
CREATE INDEX IF NOT EXISTS idx_cv_constraints_active ON constraint_validation.constraints(is_active);
CREATE INDEX IF NOT EXISTS idx_cv_validation_results_constraint ON constraint_validation.validation_results(constraint_id);
CREATE INDEX IF NOT EXISTS idx_cv_validation_results_schedule ON constraint_validation.validation_results(schedule_id);

-- Create validation function
CREATE OR REPLACE FUNCTION constraint_validation.validate_constraint(
  p_constraint_id UUID,
  p_schedule_data JSONB
) RETURNS TABLE(
  is_satisfied BOOLEAN,
  violation_severity FLOAT,
  violation_details JSONB
) AS $$
DECLARE
  v_constraint RECORD;
BEGIN
  -- Get constraint details
  SELECT * INTO v_constraint
  FROM constraint_validation.constraints
  WHERE id = p_constraint_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 1.0, jsonb_build_object('error', 'Constraint not found or inactive');
    RETURN;
  END IF;
  
  -- Basic validation logic (to be extended based on constraint type)
  RETURN QUERY SELECT 
    true,
    0.0,
    jsonb_build_object('message', 'Validation passed');
END;
$$ LANGUAGE plpgsql;

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('004', 'Constraint Validation Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed', executed_at = CURRENT_TIMESTAMP;

COMMIT;`;
}

async function createScheduleGenerationMigration() {
  return `-- Migration: Schedule Generation Service
-- Generated: ${new Date().toISOString()}

BEGIN;

-- Create schedule generation schema
CREATE SCHEMA IF NOT EXISTS schedule_generation;

-- Create enhanced schedules table (different structure from public.schedules)
CREATE TABLE IF NOT EXISTS schedule_generation.schedule_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(100) NOT NULL,
  sport_id INTEGER,
  season_id INTEGER,
  school_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  status VARCHAR(50) DEFAULT 'draft',
  generation_method VARCHAR(50) DEFAULT 'manual',
  worker_count INTEGER DEFAULT 1,
  generation_time_ms INTEGER,
  optimization_score FLOAT,
  parallel_chunks INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- Create schedule generation jobs table
CREATE TABLE IF NOT EXISTS schedule_generation.generation_jobs (
  id SERIAL PRIMARY KEY,
  job_id UUID DEFAULT uuid_generate_v4(),
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
  result_schedule_version_id INTEGER REFERENCES schedule_generation.schedule_versions(id)
);

-- Create game generation results
CREATE TABLE IF NOT EXISTS schedule_generation.generated_games (
  id SERIAL PRIMARY KEY,
  schedule_version_id INTEGER REFERENCES schedule_generation.schedule_versions(id),
  home_team_id INTEGER,
  away_team_id INTEGER,
  venue_id INTEGER,
  game_date DATE,
  game_time TIME,
  is_conference_game BOOLEAN DEFAULT false,
  special_designation VARCHAR(100),
  constraints_satisfied JSONB DEFAULT '[]',
  optimization_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sg_schedule_versions_sport ON schedule_generation.schedule_versions(sport_id);
CREATE INDEX IF NOT EXISTS idx_sg_schedule_versions_season ON schedule_generation.schedule_versions(season_id);
CREATE INDEX IF NOT EXISTS idx_sg_schedule_versions_school ON schedule_generation.schedule_versions(school_id);
CREATE INDEX IF NOT EXISTS idx_sg_generation_jobs_status ON schedule_generation.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sg_generated_games_version ON schedule_generation.generated_games(schedule_version_id);
CREATE INDEX IF NOT EXISTS idx_sg_generated_games_date ON schedule_generation.generated_games(game_date);

-- Create function to initiate schedule generation
CREATE OR REPLACE FUNCTION schedule_generation.create_schedule_generation_job(
  p_sport_id INTEGER,
  p_season VARCHAR,
  p_configuration JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO schedule_generation.generation_jobs (
    sport_id, season, configuration, started_at
  ) VALUES (
    p_sport_id, p_season, p_configuration, CURRENT_TIMESTAMP
  ) RETURNING job_id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Update migration status
INSERT INTO schema_migrations (version, description, status)
VALUES ('005', 'Schedule Generation Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed', executed_at = CURRENT_TIMESTAMP;

COMMIT;`;
}

// Main execution
async function runMigrations() {
  console.log('🚀 Starting FlexTime Migration System (Fixed Schema Version)');
  console.log('================================================\n');
  
  try {
    // Check database connection
    await db.query('SELECT 1');
    console.log('✅ Database connection established\n');
    
    // Check for UUID extension
    try {
      await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ UUID extension ready\n');
    } catch (e) {
      console.log('⚠️  UUID extension may already exist\n');
    }
    
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
    let failedCount = 0;
    
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
        failedCount++;
        
        // Record failure
        await db.query(
          `INSERT INTO schema_migrations (version, description, status) 
           VALUES ($1, $2, 'failed')
           ON CONFLICT (version) DO UPDATE SET status = 'failed', executed_at = CURRENT_TIMESTAMP`,
          [migration.version, migration.name]
        );
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('===================');
    console.log(`Total migrations: ${migrations.length}`);
    console.log(`Executed: ${executedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Skipped: ${migrations.length - executedCount - failedCount}`);
    
    // Check final status
    const finalStatus = await db.query('SELECT * FROM schema_migrations ORDER BY version');
    console.log('\n📋 Final Migration Status:');
    finalStatus.rows.forEach(row => {
      const icon = row.status === 'completed' ? '✅' : '❌';
      console.log(`${icon} ${row.version}: ${row.description || 'No description'} (${row.status})`);
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