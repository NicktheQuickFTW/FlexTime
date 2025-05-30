-- FlexTime Microservices Migration
-- Team Availability Service Database Schema
-- PostgreSQL 13+ compatible

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS team_availability_preferences CASCADE;
DROP TABLE IF EXISTS team_blackout_dates CASCADE;
DROP TABLE IF EXISTS team_availability_windows CASCADE;
DROP TABLE IF EXISTS team_travel_constraints CASCADE;
DROP TABLE IF EXISTS team_rest_requirements CASCADE;
DROP TABLE IF EXISTS team_scheduling_profiles CASCADE;
DROP TABLE IF EXISTS institutions_teams_view CASCADE;

-- Create materialized view for institution-team relationships (denormalized for microservice boundary)
CREATE MATERIALIZED VIEW institutions_teams_view AS
SELECT 
    t.team_id,
    t.season_id,
    t.institution_id,
    t.name AS team_name,
    t.code AS team_code,
    t.division,
    t.seed,
    t.status AS team_status,
    i.name AS institution_name,
    i.code AS institution_code,
    i.city,
    i.state,
    i.time_zone,
    i.created_at,
    i.updated_at
FROM teams t
JOIN institutions i ON t.institution_id = i.institution_id
WHERE t.status IN ('registered', 'confirmed');

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_institutions_teams_team_id ON institutions_teams_view(team_id);
CREATE INDEX idx_institutions_teams_institution_id ON institutions_teams_view(institution_id);
CREATE INDEX idx_institutions_teams_season_id ON institutions_teams_view(season_id);
CREATE INDEX idx_institutions_teams_code ON institutions_teams_view(team_code);

-- 1. Team Scheduling Profiles - Core team scheduling preferences and metadata
CREATE TABLE team_scheduling_profiles (
    profile_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    
    -- Scheduling preferences
    preferred_game_times JSONB DEFAULT '{}', -- {"weekday": ["19:00", "20:00"], "weekend": ["12:00", "15:00", "19:00"]}
    max_games_per_week INTEGER DEFAULT 3,
    min_rest_days INTEGER DEFAULT 1,
    max_consecutive_away_games INTEGER DEFAULT 3,
    max_consecutive_home_games INTEGER DEFAULT 4,
    
    -- Travel preferences
    max_travel_distance_miles INTEGER DEFAULT 1000,
    preferred_travel_days JSONB DEFAULT '[]', -- ["monday", "tuesday", "friday"]
    avoid_travel_days JSONB DEFAULT '[]', -- ["sunday"]
    max_travel_time_hours DECIMAL(4,2) DEFAULT 8.0,
    
    -- Academic considerations
    avoid_exam_periods BOOLEAN DEFAULT TRUE,
    finals_week_blackout BOOLEAN DEFAULT TRUE,
    class_conflict_buffer_hours INTEGER DEFAULT 4,
    
    -- Broadcasting and media preferences
    tv_broadcast_priority INTEGER DEFAULT 3 CHECK (tv_broadcast_priority BETWEEN 1 AND 5),
    streaming_availability BOOLEAN DEFAULT TRUE,
    media_blackout_windows JSONB DEFAULT '[]',
    
    -- Conference-specific settings
    conference_game_priority INTEGER DEFAULT 1 CHECK (conference_game_priority BETWEEN 1 AND 5),
    rivalry_game_priority INTEGER DEFAULT 1 CHECK (rivalry_game_priority BETWEEN 1 AND 5),
    
    -- Flexibility and override settings
    allow_schedule_overrides BOOLEAN DEFAULT FALSE,
    emergency_rescheduling_allowed BOOLEAN DEFAULT TRUE,
    flexibility_score DECIMAL(3,2) DEFAULT 0.50 CHECK (flexibility_score BETWEEN 0.0 AND 1.0),
    
    -- Metadata
    profile_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    notes TEXT,
    
    UNIQUE(team_id, season_id, sport_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Team Rest Requirements - Specific rest and recovery requirements
CREATE TABLE team_rest_requirements (
    requirement_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL,
    
    -- Rest periods
    min_rest_hours INTEGER NOT NULL DEFAULT 48,
    preferred_rest_hours INTEGER DEFAULT 72,
    max_games_without_rest INTEGER DEFAULT 3,
    
    -- Recovery requirements by game type
    home_game_recovery_hours INTEGER DEFAULT 24,
    away_game_recovery_hours INTEGER DEFAULT 48,
    conference_game_recovery_hours INTEGER DEFAULT 72,
    rivalry_game_recovery_hours INTEGER DEFAULT 96,
    
    -- Travel recovery
    short_travel_recovery_hours INTEGER DEFAULT 24, -- < 3 hours travel
    medium_travel_recovery_hours INTEGER DEFAULT 48, -- 3-6 hours travel  
    long_travel_recovery_hours INTEGER DEFAULT 72, -- > 6 hours travel
    
    -- Special circumstances
    injury_recovery_multiplier DECIMAL(3,2) DEFAULT 1.5,
    tournament_play_recovery_hours INTEGER DEFAULT 24,
    
    -- Seasonal adjustments
    early_season_recovery_multiplier DECIMAL(3,2) DEFAULT 1.2,
    late_season_recovery_multiplier DECIMAL(3,2) DEFAULT 1.3,
    postseason_recovery_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Team Travel Constraints - Travel-specific limitations and preferences
CREATE TABLE team_travel_constraints (
    constraint_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL,
    
    -- Distance constraints
    max_travel_distance_miles INTEGER DEFAULT 1500,
    preferred_travel_distance_miles INTEGER DEFAULT 800,
    
    -- Time constraints
    max_travel_time_hours DECIMAL(4,2) DEFAULT 8.0,
    max_daily_travel_hours DECIMAL(4,2) DEFAULT 12.0,
    
    -- Transportation mode constraints
    air_travel_required_distance_miles INTEGER DEFAULT 500,
    bus_travel_max_distance_miles INTEGER DEFAULT 600,
    charter_flight_minimum_distance_miles INTEGER DEFAULT 800,
    
    -- Financial constraints
    max_travel_budget_per_trip DECIMAL(10,2),
    max_seasonal_travel_budget DECIMAL(12,2),
    
    -- Timing constraints
    latest_departure_time TIME DEFAULT '18:00:00',
    earliest_arrival_time TIME DEFAULT '08:00:00',
    no_red_eye_flights BOOLEAN DEFAULT TRUE,
    
    -- Regional preferences
    preferred_regions JSONB DEFAULT '[]', -- ["southwest", "west", "mountain"]
    avoided_regions JSONB DEFAULT '[]',
    regional_rivalry_priority BOOLEAN DEFAULT TRUE,
    
    -- Accommodation requirements
    team_hotel_requirements JSONB DEFAULT '{}',
    min_hotel_rating INTEGER DEFAULT 3 CHECK (min_hotel_rating BETWEEN 1 AND 5),
    single_room_requirements BOOLEAN DEFAULT FALSE,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Team Availability Windows - Specific available time periods
CREATE TABLE team_availability_windows (
    window_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL,
    
    -- Time window definition
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Recurrence pattern
    day_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc. NULL = all days in date range
    week_pattern INTEGER DEFAULT 1, -- 1=every week, 2=every other week, etc.
    
    -- Availability type
    availability_type VARCHAR(20) NOT NULL CHECK (availability_type IN ('available', 'preferred', 'limited', 'emergency_only')),
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    
    -- Capacity constraints
    max_concurrent_games INTEGER DEFAULT 1,
    venue_restrictions JSONB DEFAULT '[]', -- ["home_only", "away_only", "neutral_site"]
    
    -- Special considerations
    requires_advance_notice_days INTEGER DEFAULT 7,
    allows_tv_broadcasts BOOLEAN DEFAULT TRUE,
    allows_streaming BOOLEAN DEFAULT TRUE,
    
    -- Conditions and notes
    weather_dependent BOOLEAN DEFAULT FALSE,
    facility_dependent BOOLEAN DEFAULT FALSE,
    conditions_notes TEXT,
    
    -- Override capabilities
    can_override BOOLEAN DEFAULT FALSE,
    override_requires_approval BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_time_range CHECK (end_time > start_time OR (start_time IS NULL AND end_time IS NULL))
);

-- 5. Team Blackout Dates - Periods when team is unavailable
CREATE TABLE team_blackout_dates (
    blackout_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL,
    
    -- Blackout period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME, -- NULL means all day
    end_time TIME,
    
    -- Blackout type and severity
    blackout_type VARCHAR(30) NOT NULL CHECK (blackout_type IN (
        'academic_break', 'exam_period', 'finals_week', 'graduation',
        'facility_unavailable', 'team_travel', 'medical_quarantine',
        'weather_related', 'conference_mandate', 'administrative',
        'recruiting_event', 'team_building', 'community_service'
    )),
    severity VARCHAR(15) NOT NULL DEFAULT 'hard' CHECK (severity IN ('hard', 'soft', 'preference')),
    
    -- Flexibility and exceptions
    allows_conference_games BOOLEAN DEFAULT FALSE,
    allows_rivalry_games BOOLEAN DEFAULT FALSE,
    allows_tournament_games BOOLEAN DEFAULT FALSE,
    allows_rescheduling BOOLEAN DEFAULT FALSE,
    
    -- Override conditions
    can_override BOOLEAN DEFAULT FALSE,
    override_cost_multiplier DECIMAL(4,2) DEFAULT 2.0,
    requires_approval_levels JSONB DEFAULT '["athletic_director", "conference"]',
    
    -- Recurrence for annual events
    recurring_annually BOOLEAN DEFAULT FALSE,
    recurring_pattern JSONB, -- {"month": 12, "week": 3, "days": [1,2,3,4,5]} for finals week
    
    -- Reason and contacts
    reason TEXT NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    external_reference VARCHAR(100), -- Conference mandate ID, facility booking ID, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_blackout_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_blackout_time_range CHECK (end_time > start_time OR (start_time IS NULL AND end_time IS NULL))
);

-- 6. Team Availability Preferences - Detailed scheduling preferences
CREATE TABLE team_availability_preferences (
    preference_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    
    -- Time preferences
    preferred_weekday_times JSONB DEFAULT '["19:00", "20:00"]',
    preferred_weekend_times JSONB DEFAULT '["12:00", "15:00", "19:00"]',
    avoided_times JSONB DEFAULT '[]',
    
    -- Day preferences (1-5 scale, 1=strongly avoid, 5=strongly prefer)
    monday_preference INTEGER DEFAULT 3 CHECK (monday_preference BETWEEN 1 AND 5),
    tuesday_preference INTEGER DEFAULT 4 CHECK (tuesday_preference BETWEEN 1 AND 5),
    wednesday_preference INTEGER DEFAULT 4 CHECK (wednesday_preference BETWEEN 1 AND 5),
    thursday_preference INTEGER DEFAULT 3 CHECK (thursday_preference BETWEEN 1 AND 5),
    friday_preference INTEGER DEFAULT 4 CHECK (friday_preference BETWEEN 1 AND 5),
    saturday_preference INTEGER DEFAULT 5 CHECK (saturday_preference BETWEEN 1 AND 5),
    sunday_preference INTEGER DEFAULT 2 CHECK (sunday_preference BETWEEN 1 AND 5),
    
    -- Home vs Away preferences
    home_game_preference_ratio DECIMAL(3,2) DEFAULT 0.60, -- 60% home games preferred
    back_to_back_home_tolerance INTEGER DEFAULT 3,
    back_to_back_away_tolerance INTEGER DEFAULT 2,
    
    -- Conference game preferences
    conference_game_clustering BOOLEAN DEFAULT TRUE, -- Prefer conference games clustered together
    non_conference_early_season BOOLEAN DEFAULT TRUE,
    rivalry_game_timing_preference VARCHAR(20) DEFAULT 'season_end' CHECK (
        rivalry_game_timing_preference IN ('season_start', 'mid_season', 'season_end', 'flexible')
    ),
    
    -- Broadcasting preferences
    tv_game_preference INTEGER DEFAULT 4 CHECK (tv_game_preference BETWEEN 1 AND 5),
    prime_time_tolerance INTEGER DEFAULT 3 CHECK (prime_time_tolerance BETWEEN 1 AND 5),
    
    -- Academic calendar integration
    avoid_midterm_periods BOOLEAN DEFAULT TRUE,
    spring_break_preference VARCHAR(15) DEFAULT 'avoid' CHECK (spring_break_preference IN ('avoid', 'neutral', 'prefer')),
    holiday_weekend_preference VARCHAR(15) DEFAULT 'avoid' CHECK (holiday_weekend_preference IN ('avoid', 'neutral', 'prefer')),
    
    -- Fan engagement considerations
    student_attendance_priority BOOLEAN DEFAULT TRUE,
    alumni_weekend_consideration BOOLEAN DEFAULT TRUE,
    community_event_conflicts_check BOOLEAN DEFAULT TRUE,
    
    -- Special event preferences
    senior_night_timing_preference VARCHAR(20) DEFAULT 'late_season',
    homecoming_game_preference BOOLEAN DEFAULT TRUE,
    
    -- Flexibility indicators
    schedule_flexibility_rating DECIMAL(3,2) DEFAULT 0.50 CHECK (schedule_flexibility_rating BETWEEN 0.0 AND 1.0),
    emergency_availability BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, season_id, sport_id)
);

-- Indexes for Performance Optimization

-- Team Scheduling Profiles
CREATE INDEX idx_team_scheduling_profiles_team_season ON team_scheduling_profiles(team_id, season_id);
CREATE INDEX idx_team_scheduling_profiles_sport ON team_scheduling_profiles(sport_id);
CREATE INDEX idx_team_scheduling_profiles_active ON team_scheduling_profiles(profile_active);
CREATE INDEX idx_team_scheduling_profiles_updated ON team_scheduling_profiles(last_updated);

-- Team Rest Requirements
CREATE INDEX idx_team_rest_requirements_team_sport ON team_rest_requirements(team_id, sport_id);
CREATE INDEX idx_team_rest_requirements_active ON team_rest_requirements(active);
CREATE INDEX idx_team_rest_requirements_effective ON team_rest_requirements(effective_date, expiration_date);

-- Team Travel Constraints
CREATE INDEX idx_team_travel_constraints_team_season ON team_travel_constraints(team_id, season_id);
CREATE INDEX idx_team_travel_constraints_active ON team_travel_constraints(active);
CREATE INDEX idx_team_travel_constraints_distance ON team_travel_constraints(max_travel_distance_miles);

-- Team Availability Windows
CREATE INDEX idx_team_availability_windows_team_season ON team_availability_windows(team_id, season_id);
CREATE INDEX idx_team_availability_windows_dates ON team_availability_windows(start_date, end_date);
CREATE INDEX idx_team_availability_windows_type ON team_availability_windows(availability_type);
CREATE INDEX idx_team_availability_windows_dow ON team_availability_windows USING GIN(day_of_week);

-- Team Blackout Dates
CREATE INDEX idx_team_blackout_dates_team_season ON team_blackout_dates(team_id, season_id);
CREATE INDEX idx_team_blackout_dates_period ON team_blackout_dates(start_date, end_date);
CREATE INDEX idx_team_blackout_dates_type ON team_blackout_dates(blackout_type);
CREATE INDEX idx_team_blackout_dates_severity ON team_blackout_dates(severity);
CREATE INDEX idx_team_blackout_dates_recurring ON team_blackout_dates(recurring_annually);

-- Team Availability Preferences
CREATE INDEX idx_team_availability_preferences_team_season_sport ON team_availability_preferences(team_id, season_id, sport_id);

-- Functions and Triggers

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_team_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_team_scheduling_profiles_updated_at 
    BEFORE UPDATE ON team_scheduling_profiles
    FOR EACH ROW EXECUTE FUNCTION update_team_availability_updated_at();

CREATE TRIGGER update_team_rest_requirements_updated_at 
    BEFORE UPDATE ON team_rest_requirements
    FOR EACH ROW EXECUTE FUNCTION update_team_availability_updated_at();

CREATE TRIGGER update_team_travel_constraints_updated_at 
    BEFORE UPDATE ON team_travel_constraints
    FOR EACH ROW EXECUTE FUNCTION update_team_availability_updated_at();

CREATE TRIGGER update_team_availability_windows_updated_at 
    BEFORE UPDATE ON team_availability_windows
    FOR EACH ROW EXECUTE FUNCTION update_team_availability_updated_at();

CREATE TRIGGER update_team_blackout_dates_updated_at 
    BEFORE UPDATE ON team_blackout_dates
    FOR EACH ROW EXECUTE FUNCTION update_team_availability_updated_at();

CREATE TRIGGER update_team_availability_preferences_updated_at 
    BEFORE UPDATE ON team_availability_preferences
    FOR EACH ROW EXECUTE FUNCTION update_team_availability_updated_at();

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_institutions_teams_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY institutions_teams_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Views for Common Queries

-- View: Team Availability Summary
CREATE VIEW team_availability_summary AS
SELECT 
    tsp.team_id,
    itv.team_name,
    itv.institution_name,
    tsp.season_id,
    tsp.sport_id,
    tsp.max_games_per_week,
    tsp.min_rest_days,
    tsp.max_travel_distance_miles,
    tsp.flexibility_score,
    COUNT(taw.window_id) AS available_windows,
    COUNT(tbd.blackout_id) AS blackout_periods,
    tsp.profile_active
FROM team_scheduling_profiles tsp
JOIN institutions_teams_view itv ON tsp.team_id = itv.team_id
LEFT JOIN team_availability_windows taw ON tsp.team_id = taw.team_id AND tsp.season_id = taw.season_id
LEFT JOIN team_blackout_dates tbd ON tsp.team_id = tbd.team_id AND tsp.season_id = tbd.season_id
GROUP BY tsp.team_id, itv.team_name, itv.institution_name, tsp.season_id, tsp.sport_id, 
         tsp.max_games_per_week, tsp.min_rest_days, tsp.max_travel_distance_miles, 
         tsp.flexibility_score, tsp.profile_active;

-- View: Current Blackout Periods
CREATE VIEW current_blackout_periods AS
SELECT 
    tbd.*,
    itv.team_name,
    itv.institution_name
FROM team_blackout_dates tbd
JOIN institutions_teams_view itv ON tbd.team_id = itv.team_id
WHERE tbd.start_date <= CURRENT_DATE + INTERVAL '30 days'
  AND tbd.end_date >= CURRENT_DATE
ORDER BY tbd.start_date;

-- View: Team Travel Capabilities
CREATE VIEW team_travel_capabilities AS
SELECT 
    ttc.team_id,
    itv.team_name,
    itv.institution_name,
    itv.city AS home_city,
    itv.state AS home_state,
    ttc.max_travel_distance_miles,
    ttc.max_travel_time_hours,
    ttc.air_travel_required_distance_miles,
    ttc.bus_travel_max_distance_miles,
    ttc.preferred_regions,
    ttc.avoided_regions,
    ttc.active
FROM team_travel_constraints ttc
JOIN institutions_teams_view itv ON ttc.team_id = itv.team_id
WHERE ttc.active = TRUE;

-- Comments for Documentation
COMMENT ON TABLE team_scheduling_profiles IS 'Core team scheduling preferences and metadata for availability service';
COMMENT ON TABLE team_rest_requirements IS 'Team-specific rest and recovery requirements between games';
COMMENT ON TABLE team_travel_constraints IS 'Travel limitations and preferences for team scheduling';
COMMENT ON TABLE team_availability_windows IS 'Specific time periods when teams are available for games';
COMMENT ON TABLE team_blackout_dates IS 'Periods when teams are unavailable for scheduling';
COMMENT ON TABLE team_availability_preferences IS 'Detailed team preferences for game scheduling';

COMMENT ON MATERIALIZED VIEW institutions_teams_view IS 'Denormalized view of team-institution data for microservice boundary isolation';

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE team_scheduling_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_rest_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_travel_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be customized based on authentication system)
CREATE POLICY team_scheduling_profiles_policy ON team_scheduling_profiles
    FOR ALL USING (team_id IN (SELECT team_id FROM user_team_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY team_rest_requirements_policy ON team_rest_requirements
    FOR ALL USING (team_id IN (SELECT team_id FROM user_team_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY team_travel_constraints_policy ON team_travel_constraints
    FOR ALL USING (team_id IN (SELECT team_id FROM user_team_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY team_availability_windows_policy ON team_availability_windows
    FOR ALL USING (team_id IN (SELECT team_id FROM user_team_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY team_blackout_dates_policy ON team_blackout_dates
    FOR ALL USING (team_id IN (SELECT team_id FROM user_team_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY team_availability_preferences_policy ON team_availability_preferences
    FOR ALL USING (team_id IN (SELECT team_id FROM user_team_access WHERE user_id = current_setting('app.current_user_id')::int));