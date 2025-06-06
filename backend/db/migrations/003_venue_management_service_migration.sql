-- Migration: Venue Management Service
-- Generated: 2025-06-06T05:40:21.880Z

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

COMMIT;