-- ============================================
-- FlexTime Supabase Schema
-- Complete database schema for Big 12 Conference scheduling system
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Core Tables
-- ============================================

-- Schools table (Big 12 Conference members and affiliates)
CREATE TABLE IF NOT EXISTS schools (
  school_id INTEGER PRIMARY KEY,
  school TEXT NOT NULL,
  school_abbreviation VARCHAR(10) NOT NULL,
  short_display VARCHAR(50) NOT NULL,
  preferred_school_name VARCHAR(100),
  location TEXT,
  mascot VARCHAR(50),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  website TEXT,
  conference_status VARCHAR(20) DEFAULT 'full_member',
  joining_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sports table
CREATE TABLE IF NOT EXISTS sports (
  sport_id INTEGER PRIMARY KEY,
  sport_name VARCHAR(50) NOT NULL,
  sport_code VARCHAR(5) NOT NULL,
  gender CHAR(1) CHECK (gender IN ('M', 'W', 'C')),
  season VARCHAR(10) CHECK (season IN ('fall', 'winter', 'spring')),
  team_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table (school + sport combinations)
CREATE TABLE IF NOT EXISTS teams (
  team_id INTEGER PRIMARY KEY, -- Format: school_id * 100 + sport_id
  school_id INTEGER REFERENCES schools(school_id),
  sport_id INTEGER REFERENCES sports(sport_id),
  name VARCHAR(100) NOT NULL,
  mascot VARCHAR(50),
  abbreviation VARCHAR(20),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  conference_status VARCHAR(20) DEFAULT 'full_member',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(school_id, sport_id)
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  venue_id INTEGER PRIMARY KEY, -- Format: school_id * 100 + venue_type
  venue_name VARCHAR(100) NOT NULL,
  school_id INTEGER REFERENCES schools(school_id),
  venue_type INTEGER,
  capacity INTEGER,
  city VARCHAR(50),
  state CHAR(2),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Scheduling Tables
-- ============================================

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id INTEGER REFERENCES sports(sport_id),
  season_year INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(sport_id, season_year, version)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(schedule_id) ON DELETE CASCADE,
  home_team_id INTEGER REFERENCES teams(team_id),
  away_team_id INTEGER REFERENCES teams(team_id),
  venue_id INTEGER REFERENCES venues(venue_id),
  game_date DATE NOT NULL,
  game_time TIME,
  week_number INTEGER,
  is_conference_game BOOLEAN DEFAULT true,
  is_rivalry_game BOOLEAN DEFAULT false,
  broadcast_info JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- ============================================
-- Constraint System Tables (New Structure)
-- ============================================

-- 1. Scheduling Parameters (Business Rules)
CREATE TABLE IF NOT EXISTS scheduling_parameters (
  scheduling_parameter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id INTEGER REFERENCES sports(sport_id),
  school_id INTEGER REFERENCES schools(school_id), 
  team_id INTEGER REFERENCES teams(team_id),     
  season_year INTEGER NOT NULL,
  parameter_key TEXT NOT NULL,
  parameter_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  UNIQUE(team_id, sport_id, school_id, season_year, parameter_key)
);

-- 2. Constraints (Scheduling Restrictions)
CREATE TABLE IF NOT EXISTS constraints_new (
  constraint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  constraint_type VARCHAR(50) NOT NULL,
  sport_id INTEGER REFERENCES sports(sport_id),   
  school_id INTEGER REFERENCES schools(school_id), 
  team_id INTEGER REFERENCES teams(team_id),     
  definition JSONB NOT NULL,
  is_hard BOOLEAN DEFAULT false,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- 3. Conflicts (When teams/venues CANNOT play)
CREATE TABLE IF NOT EXISTS conflicts (
  conflict_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INTEGER REFERENCES teams(team_id),     
  school_id INTEGER REFERENCES schools(school_id), 
  sport_id INTEGER REFERENCES sports(sport_id),   
  venue_id INTEGER REFERENCES venues(venue_id),   
  conflict_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_absolute BOOLEAN DEFAULT true,
  source VARCHAR(50), -- 'campus_calendar', 'venue_booking', 'religious_calendar', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  CONSTRAINT check_has_entity CHECK (
    team_id IS NOT NULL OR 
    school_id IS NOT NULL OR 
    sport_id IS NOT NULL OR 
    venue_id IS NOT NULL
  ),
  CONSTRAINT check_date_range CHECK (end_date >= start_date)
);

-- 4. Team Preferences (What teams want)
CREATE TABLE IF NOT EXISTS team_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INTEGER REFERENCES teams(team_id),     
  school_id INTEGER REFERENCES schools(school_id), 
  sport_id INTEGER REFERENCES sports(sport_id),   
  preference_type VARCHAR(50) NOT NULL,
  definition JSONB NOT NULL,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  season_year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- Legacy constraints table (for backward compatibility)
CREATE TABLE IF NOT EXISTS constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  constraint_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  sport_id INTEGER REFERENCES sports(sport_id),
  rule_definition JSONB,
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  is_hard_constraint BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- ============================================
-- Analytics Tables
-- ============================================

-- Schedule analytics table
CREATE TABLE IF NOT EXISTS schedule_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(schedule_id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- COMPASS ratings table
CREATE TABLE IF NOT EXISTS compass_ratings (
  rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INTEGER REFERENCES teams(team_id),
  season_year INTEGER NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 0 AND overall_rating <= 100),
  competitive_rating INTEGER CHECK (competitive_rating >= 0 AND competitive_rating <= 100),
  operational_rating INTEGER CHECK (operational_rating >= 0 AND operational_rating <= 100),
  market_rating INTEGER CHECK (market_rating >= 0 AND market_rating <= 100),
  trajectory_rating INTEGER CHECK (trajectory_rating >= 0 AND trajectory_rating <= 100),
  analytics_rating INTEGER CHECK (analytics_rating >= 0 AND analytics_rating <= 100),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, season_year)
);

-- ============================================
-- User Management Tables
-- ============================================

-- Users table (simplified for now)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  school_id INTEGER REFERENCES schools(school_id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_school ON teams(school_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport_id);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_schedule ON games(schedule_id);
CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_week ON games(week_number);

-- Constraint system indexes
CREATE INDEX IF NOT EXISTS idx_parameters_lookup ON scheduling_parameters(sport_id, school_id, team_id, season_year);
CREATE INDEX IF NOT EXISTS idx_constraints_lookup ON constraints_new(sport_id, school_id, team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_conflicts_dates ON conflicts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_conflicts_lookup ON conflicts(team_id, school_id, sport_id, venue_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_type ON conflicts(conflict_type);
CREATE INDEX IF NOT EXISTS idx_preferences_lookup ON team_preferences(team_id, school_id, sport_id, season_year);
CREATE INDEX IF NOT EXISTS idx_preferences_type ON team_preferences(preference_type);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_schedule ON schedule_analytics(schedule_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON schedule_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_compass_team_year ON compass_ratings(team_id, season_year);

-- ============================================
-- Functions
-- ============================================

-- Helper function for team display names
CREATE OR REPLACE FUNCTION get_team_display_name(p_team_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_school_name TEXT;
  v_sport_name TEXT;
BEGIN
  SELECT s.short_display, sp.sport_name
  INTO v_school_name, v_sport_name
  FROM teams t
  JOIN schools s ON s.school_id = t.school_id
  JOIN sports sp ON sp.sport_id = t.sport_id
  WHERE t.team_id = p_team_id;
  
  RETURN v_school_name || ' ' || v_sport_name;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views
-- ============================================

-- Team conflicts view
CREATE OR REPLACE VIEW team_conflicts_view AS
SELECT 
  c.*,
  get_team_display_name(c.team_id) as team_display_name,
  s.short_display as school_name,
  sp.sport_name,
  v.venue_name
FROM conflicts c
LEFT JOIN schools s ON s.school_id = c.school_id
LEFT JOIN sports sp ON sp.sport_id = c.sport_id
LEFT JOIN venues v ON v.venue_id = c.venue_id;

-- Active constraints view
CREATE OR REPLACE VIEW active_constraints_view AS
SELECT 
  c.*,
  get_team_display_name(c.team_id) as team_display_name,
  s.short_display as school_name,
  sp.sport_name
FROM constraints_new c
LEFT JOIN schools s ON s.school_id = c.school_id
LEFT JOIN sports sp ON sp.sport_id = c.sport_id
WHERE c.is_active = true;

-- Schedule summary view
CREATE OR REPLACE VIEW schedule_summary_view AS
SELECT 
  s.schedule_id,
  s.sport_id,
  sp.sport_name,
  s.season_year,
  s.version,
  s.status,
  COUNT(g.game_id) as total_games,
  COUNT(CASE WHEN g.is_conference_game THEN 1 END) as conference_games,
  COUNT(CASE WHEN g.is_rivalry_game THEN 1 END) as rivalry_games,
  MIN(g.game_date) as season_start,
  MAX(g.game_date) as season_end,
  s.created_at,
  s.updated_at
FROM schedules s
LEFT JOIN sports sp ON sp.sport_id = s.sport_id
LEFT JOIN games g ON g.schedule_id = s.schedule_id
GROUP BY s.schedule_id, s.sport_id, sp.sport_name, s.season_year, 
         s.version, s.status, s.created_at, s.updated_at;

-- ============================================
-- Triggers
-- ============================================

-- Update timestamp triggers
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parameters_updated_at BEFORE UPDATE ON scheduling_parameters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraints_updated_at BEFORE UPDATE ON constraints_new
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflicts_updated_at BEFORE UPDATE ON conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON team_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth system)
-- Public read access for basic data
CREATE POLICY "Public read access" ON schools FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sports FOR SELECT USING (true);
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON schedules FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON games FOR SELECT USING (true);

-- Authenticated users can read constraint data
CREATE POLICY "Authenticated read" ON scheduling_parameters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON constraints_new FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON conflicts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON team_preferences FOR SELECT TO authenticated USING (true);

-- ============================================
-- Initial Data Comments
-- ============================================

COMMENT ON TABLE schools IS 'Big 12 Conference member schools and affiliates';
COMMENT ON TABLE sports IS 'Sports sponsored by the Big 12 Conference';
COMMENT ON TABLE teams IS 'School-sport combinations with unique team_id = school_id * 100 + sport_id';
COMMENT ON TABLE venues IS 'Athletic facilities with venue_id = school_id * 100 + venue_type';
COMMENT ON TABLE schedules IS 'Master schedule records for each sport and season';
COMMENT ON TABLE games IS 'Individual games within a schedule';
COMMENT ON TABLE scheduling_parameters IS 'Business rules like games per team, season length, home/away distribution, travel partners, etc.';
COMMENT ON TABLE constraints_new IS 'Scheduling restrictions like rest days, travel limits, venue availability, etc.';
COMMENT ON TABLE conflicts IS 'Blackout dates when teams or venues cannot host/play';
COMMENT ON TABLE team_preferences IS 'Team scheduling preferences like preferred game times, preferred bye weeks, etc.';

COMMENT ON COLUMN teams.team_id IS 'Unique ID format: school_id * 100 + sport_id (e.g., Baylor Football = 308)';
COMMENT ON COLUMN venues.venue_id IS 'Unique ID format: school_id * 100 + venue_type (e.g., Baylor Stadium = 301)';
COMMENT ON COLUMN conflicts.source IS 'Origin of conflict: campus_calendar, venue_booking, religious_calendar, etc.';
COMMENT ON COLUMN scheduling_parameters.parameter_key IS 'Parameter type: games_per_team, conference_games, non_conference_games, home_games, away_games, conference_home_games, conference_away_games, home_game_distribution, travel_partners, travel_pods, etc.';