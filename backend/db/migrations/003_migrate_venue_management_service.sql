-- Migration: Venue Management Service
-- Generated: 2025-06-06T05:30:07.441Z

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
VALUES ('003_migrate_venue_management_service', 'Venue Management Service Migration', 'completed')
ON CONFLICT (version) DO UPDATE SET status = 'completed';

COMMIT;