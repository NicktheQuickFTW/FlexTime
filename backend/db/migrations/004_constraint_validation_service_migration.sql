-- Migration: Constraint Validation Service
-- Generated: 2025-06-06T05:40:21.962Z

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

COMMIT;