-- Migration: Schedule Generation Service
-- Generated: 2025-06-06T05:40:22.027Z

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

COMMIT;