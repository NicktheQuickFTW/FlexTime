-- Migration: Schedule Generation Service
-- Generated: 2025-06-06T05:17:54.733Z
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
