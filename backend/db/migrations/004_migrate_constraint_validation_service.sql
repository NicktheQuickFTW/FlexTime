-- Migration: Constraint Validation Service
-- Generated: 2025-06-06T05:17:54.733Z
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
