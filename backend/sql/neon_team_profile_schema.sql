-- HELiiX Team Profile Database Schema for NeonDB
-- Comprehensive schema for Big 12 team data and COMPASS ratings
-- PostgreSQL compatible syntax

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS player_development_metrics CASCADE;
DROP TABLE IF EXISTS financial_data CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS recruiting_data CASCADE;
DROP TABLE IF EXISTS coaching_staff CASCADE;
DROP TABLE IF EXISTS team_profiles CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Core Tables

-- 1. Teams - Basic team information
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    team_code VARCHAR(10) UNIQUE NOT NULL, -- ASU, BYU, etc.
    team_name VARCHAR(100) NOT NULL, -- Arizona State Sun Devils
    institution_name VARCHAR(100) NOT NULL, -- Arizona State University
    city VARCHAR(50) NOT NULL,
    state VARCHAR(2) NOT NULL,
    conference VARCHAR(20) DEFAULT 'Big 12',
    primary_color VARCHAR(7), -- Hex color code
    secondary_color VARCHAR(7), -- Hex color code
    mascot VARCHAR(50),
    founded_year INTEGER,
    enrollment INTEGER,
    athletic_budget BIGINT, -- Annual athletic budget in dollars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sports - Sport definitions and configurations
CREATE TABLE sports (
    sport_id SERIAL PRIMARY KEY,
    sport_name VARCHAR(50) NOT NULL UNIQUE, -- Football, Men's Basketball, etc.
    sport_code VARCHAR(10) NOT NULL UNIQUE, -- FB, MBB, WBB, etc.
    gender CHAR(1) CHECK (gender IN ('M', 'W', 'C')), -- Male, Women, Coed
    season_type VARCHAR(10) CHECK (season_type IN ('Fall', 'Winter', 'Spring', 'Year-Round')),
    max_roster_size INTEGER,
    scholarship_limit INTEGER,
    conference_teams INTEGER, -- Number of Big 12 teams in this sport
    championship_format VARCHAR(50), -- Tournament, Regular Season, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Team Profiles - Main COMPASS ratings and profile data
CREATE TABLE team_profiles (
    profile_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    season_year VARCHAR(9) NOT NULL, -- 2024-25, 2025-26, etc.
    
    -- COMPASS Overall Rating (0-100)
    compass_overall_rating DECIMAL(5,2) CHECK (compass_overall_rating >= 0 AND compass_overall_rating <= 100),
    
    -- COMPASS Component Ratings (0-100 each)
    competitive_rating DECIMAL(5,2) CHECK (competitive_rating >= 0 AND competitive_rating <= 100),
    organizational_rating DECIMAL(5,2) CHECK (organizational_rating >= 0 AND organizational_rating <= 100),
    momentum_rating DECIMAL(5,2) CHECK (momentum_rating >= 0 AND momentum_rating <= 100),
    personnel_rating DECIMAL(5,2) CHECK (personnel_rating >= 0 AND personnel_rating <= 100),
    analytics_rating DECIMAL(5,2) CHECK (analytics_rating >= 0 AND analytics_rating <= 100),
    strategic_rating DECIMAL(5,2) CHECK (strategic_rating >= 0 AND strategic_rating <= 100),
    support_rating DECIMAL(5,2) CHECK (support_rating >= 0 AND support_rating <= 100),
    
    -- Additional metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(50), -- Manual, Automated, API, etc.
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes TEXT,
    
    -- Composite indexes
    UNIQUE(team_id, sport_id, season_year),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Coaching Staff - Coach information and changes
CREATE TABLE coaching_staff (
    coach_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    
    -- Coach Details
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL, -- Head Coach, Assistant Coach, etc.
    hire_date DATE,
    contract_end_date DATE,
    annual_salary BIGINT, -- Annual salary in dollars
    
    -- Experience and Background
    years_experience INTEGER,
    previous_position VARCHAR(100),
    alma_mater VARCHAR(100),
    coaching_record VARCHAR(20), -- W-L record format
    
    -- Status
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Former', 'Interim')),
    departure_date DATE,
    departure_reason VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Recruiting Data - Transfer portal and recruiting activity
CREATE TABLE recruiting_data (
    recruiting_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    
    -- Recruiting Period
    recruiting_year INTEGER NOT NULL, -- 2024, 2025, etc.
    recruiting_period VARCHAR(20) NOT NULL, -- Summer 2024, Fall 2024, etc.
    
    -- Transfer Portal Activity
    transfers_in INTEGER DEFAULT 0,
    transfers_out INTEGER DEFAULT 0,
    portal_net_change INTEGER DEFAULT 0, -- transfers_in - transfers_out
    
    -- High School Recruiting
    hs_commits INTEGER DEFAULT 0,
    hs_decommits INTEGER DEFAULT 0,
    avg_recruit_rating DECIMAL(3,2), -- Average star rating
    
    -- Class Rankings
    recruiting_class_rank INTEGER,
    conference_class_rank INTEGER,
    
    -- Financial
    nil_spending_estimate BIGINT, -- Estimated NIL spending
    
    -- Key additions/losses
    key_additions TEXT, -- JSON or comma-separated list
    key_losses TEXT, -- JSON or comma-separated list
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport_id, recruiting_year, recruiting_period)
);

-- 6. Performance Metrics - Season results and statistics
CREATE TABLE performance_metrics (
    metric_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    season_year VARCHAR(9) NOT NULL, -- 2024-25, 2025-26, etc.
    
    -- Record and Results
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    conference_wins INTEGER DEFAULT 0,
    conference_losses INTEGER DEFAULT 0,
    
    -- Rankings and Standings
    final_ap_ranking INTEGER,
    highest_ap_ranking INTEGER,
    lowest_ap_ranking INTEGER,
    conference_standing INTEGER,
    conference_tournament_result VARCHAR(50),
    
    -- Postseason
    postseason_berth BOOLEAN DEFAULT FALSE,
    postseason_type VARCHAR(50), -- NCAA Tournament, NIT, Bowl Game, etc.
    postseason_result VARCHAR(100),
    postseason_wins INTEGER DEFAULT 0,
    postseason_losses INTEGER DEFAULT 0,
    
    -- Advanced Statistics (sport-specific JSON)
    advanced_stats JSONB, -- Flexible storage for sport-specific metrics
    
    -- Season Summary
    season_summary TEXT,
    key_achievements TEXT,
    major_injuries TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport_id, season_year)
);

-- 7. Facilities - Stadium/venue information
CREATE TABLE facilities (
    facility_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    
    -- Facility Details
    facility_name VARCHAR(100) NOT NULL,
    facility_type VARCHAR(50), -- Stadium, Arena, Field, etc.
    capacity INTEGER,
    built_year INTEGER,
    last_renovation_year INTEGER,
    
    -- Recent Upgrades
    recent_upgrades TEXT, -- Description of recent facility improvements
    upgrade_cost BIGINT, -- Cost of recent upgrades
    upgrade_year INTEGER,
    
    -- Features and Amenities
    has_video_board BOOLEAN DEFAULT FALSE,
    video_board_size VARCHAR(20), -- Dimensions
    has_premium_seating BOOLEAN DEFAULT FALSE,
    premium_seats_count INTEGER,
    
    -- Location and Surface
    address TEXT,
    playing_surface VARCHAR(50), -- Natural grass, artificial turf, hardwood, etc.
    surface_installed_year INTEGER,
    
    -- Ratings
    facility_rating DECIMAL(3,2) CHECK (facility_rating >= 0 AND facility_rating <= 10),
    recruiting_impact_rating DECIMAL(3,2) CHECK (recruiting_impact_rating >= 0 AND recruiting_impact_rating <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Financial Data - NIL, revenue, budget data
CREATE TABLE financial_data (
    financial_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL, -- 2024, 2025, etc.
    
    -- Revenue Streams
    total_revenue BIGINT,
    ticket_revenue BIGINT,
    media_revenue BIGINT,
    sponsorship_revenue BIGINT,
    merchandise_revenue BIGINT,
    donation_revenue BIGINT,
    
    -- Expenses
    total_expenses BIGINT,
    coaching_salaries BIGINT,
    recruiting_budget BIGINT,
    travel_budget BIGINT,
    facility_maintenance BIGINT,
    equipment_budget BIGINT,
    
    -- NIL and Transfer Portal
    nil_collective_valuation BIGINT, -- Estimated NIL collective value
    portal_spending_estimate BIGINT, -- Estimated transfer portal spending
    nil_deals_count INTEGER, -- Number of active NIL deals
    avg_nil_deal_value BIGINT, -- Average NIL deal value
    
    -- Investment Metrics
    recruiting_investment_level VARCHAR(20) CHECK (recruiting_investment_level IN ('Low', 'Medium', 'High', 'Elite')),
    facility_investment_level VARCHAR(20) CHECK (facility_investment_level IN ('Low', 'Medium', 'High', 'Elite')),
    technology_investment_level VARCHAR(20) CHECK (technology_investment_level IN ('Low', 'Medium', 'High', 'Elite')),
    
    -- Financial Health
    profit_margin DECIMAL(5,2), -- (Revenue - Expenses) / Revenue * 100
    budget_variance DECIMAL(5,2), -- Actual vs Budget variance percentage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport_id, fiscal_year)
);

-- 9. Player Development Metrics - Individual and team development tracking
CREATE TABLE player_development_metrics (
    development_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id) ON DELETE CASCADE,
    season_year VARCHAR(9) NOT NULL,
    
    -- Development Statistics
    players_drafted INTEGER DEFAULT 0, -- Professional draft picks
    all_conference_selections INTEGER DEFAULT 0,
    all_american_selections INTEGER DEFAULT 0,
    academic_all_conference INTEGER DEFAULT 0,
    
    -- Retention and Graduation
    player_retention_rate DECIMAL(5,2), -- Percentage of players returning
    graduation_rate DECIMAL(5,2), -- 4-year graduation rate
    transfer_rate DECIMAL(5,2), -- Percentage transferring out
    
    -- Performance Development
    avg_improvement_rating DECIMAL(3,2), -- Average player improvement rating
    development_program_rating DECIMAL(3,2) CHECK (development_program_rating >= 0 AND development_program_rating <= 10),
    
    -- Support Systems
    academic_support_rating DECIMAL(3,2) CHECK (academic_support_rating >= 0 AND academic_support_rating <= 10),
    mental_health_support_rating DECIMAL(3,2) CHECK (mental_health_support_rating >= 0 AND mental_health_support_rating <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport_id, season_year)
);

-- Indexes for Performance Optimization

-- Teams indexes
CREATE INDEX idx_teams_team_code ON teams(team_code);
CREATE INDEX idx_teams_conference ON teams(conference);

-- Sports indexes
CREATE INDEX idx_sports_sport_code ON sports(sport_code);
CREATE INDEX idx_sports_gender ON sports(gender);

-- Team Profiles indexes
CREATE INDEX idx_team_profiles_team_sport ON team_profiles(team_id, sport_id);
CREATE INDEX idx_team_profiles_season ON team_profiles(season_year);
CREATE INDEX idx_team_profiles_compass_rating ON team_profiles(compass_overall_rating);
CREATE INDEX idx_team_profiles_updated ON team_profiles(last_updated);

-- Coaching Staff indexes
CREATE INDEX idx_coaching_staff_team_sport ON coaching_staff(team_id, sport_id);
CREATE INDEX idx_coaching_staff_position ON coaching_staff(position);
CREATE INDEX idx_coaching_staff_status ON coaching_staff(status);

-- Recruiting Data indexes
CREATE INDEX idx_recruiting_team_sport_year ON recruiting_data(team_id, sport_id, recruiting_year);
CREATE INDEX idx_recruiting_period ON recruiting_data(recruiting_period);

-- Performance Metrics indexes
CREATE INDEX idx_performance_team_sport_season ON performance_metrics(team_id, sport_id, season_year);
CREATE INDEX idx_performance_conference_standing ON performance_metrics(conference_standing);
CREATE INDEX idx_performance_postseason ON performance_metrics(postseason_berth);

-- Facilities indexes
CREATE INDEX idx_facilities_team_sport ON facilities(team_id, sport_id);
CREATE INDEX idx_facilities_capacity ON facilities(capacity);

-- Financial Data indexes
CREATE INDEX idx_financial_team_sport_year ON financial_data(team_id, sport_id, fiscal_year);
CREATE INDEX idx_financial_revenue ON financial_data(total_revenue);

-- Player Development indexes
CREATE INDEX idx_development_team_sport_season ON player_development_metrics(team_id, sport_id, season_year);

-- Views for Common Queries

-- View: Latest Team Profiles with Team Information
CREATE VIEW latest_team_profiles AS
SELECT 
    t.team_code,
    t.team_name,
    s.sport_name,
    tp.season_year,
    tp.compass_overall_rating,
    tp.competitive_rating,
    tp.organizational_rating,
    tp.momentum_rating,
    tp.personnel_rating,
    tp.analytics_rating,
    tp.strategic_rating,
    tp.support_rating,
    tp.last_updated
FROM team_profiles tp
JOIN teams t ON tp.team_id = t.team_id
JOIN sports s ON tp.sport_id = s.sport_id
WHERE tp.season_year = (
    SELECT MAX(season_year) 
    FROM team_profiles tp2 
    WHERE tp2.team_id = tp.team_id AND tp2.sport_id = tp.sport_id
);

-- View: Current Season Performance Summary
CREATE VIEW current_season_summary AS
SELECT 
    t.team_code,
    t.team_name,
    s.sport_name,
    pm.season_year,
    pm.wins,
    pm.losses,
    pm.conference_wins,
    pm.conference_losses,
    pm.conference_standing,
    pm.final_ap_ranking,
    pm.postseason_berth,
    tp.compass_overall_rating
FROM performance_metrics pm
JOIN teams t ON pm.team_id = t.team_id
JOIN sports s ON pm.sport_id = s.sport_id
LEFT JOIN team_profiles tp ON pm.team_id = tp.team_id AND pm.sport_id = tp.sport_id AND pm.season_year = tp.season_year
WHERE pm.season_year = '2024-25';

-- View: Recruiting Activity Summary
CREATE VIEW recruiting_summary AS
SELECT 
    t.team_code,
    t.team_name,
    s.sport_name,
    rd.recruiting_year,
    rd.recruiting_period,
    rd.transfers_in,
    rd.transfers_out,
    rd.portal_net_change,
    rd.hs_commits,
    rd.recruiting_class_rank,
    rd.nil_spending_estimate
FROM recruiting_data rd
JOIN teams t ON rd.team_id = t.team_id
JOIN sports s ON rd.sport_id = s.sport_id
ORDER BY rd.recruiting_year DESC, t.team_code, s.sport_name;

-- Triggers for Updated Timestamps

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_profiles_updated_at BEFORE UPDATE ON team_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_staff_updated_at BEFORE UPDATE ON coaching_staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruiting_data_updated_at BEFORE UPDATE ON recruiting_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_data_updated_at BEFORE UPDATE ON financial_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_development_updated_at BEFORE UPDATE ON player_development_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for Documentation
COMMENT ON TABLE teams IS 'Core team/institution information for Big 12 Conference members';
COMMENT ON TABLE sports IS 'Sport definitions and configurations for scheduling';
COMMENT ON TABLE team_profiles IS 'COMPASS ratings and profile data for teams by sport and season';
COMMENT ON TABLE coaching_staff IS 'Coaching staff information including contracts and changes';
COMMENT ON TABLE recruiting_data IS 'Transfer portal and recruiting activity tracking';
COMMENT ON TABLE performance_metrics IS 'Season results, standings, and postseason performance';
COMMENT ON TABLE facilities IS 'Stadium and venue information including recent upgrades';
COMMENT ON TABLE financial_data IS 'Revenue, expenses, NIL spending, and investment levels';
COMMENT ON TABLE player_development_metrics IS 'Player development and program quality metrics';

COMMENT ON COLUMN team_profiles.compass_overall_rating IS 'Overall COMPASS rating (0-100) combining all components';
COMMENT ON COLUMN team_profiles.competitive_rating IS 'Competitive performance component (0-100)';
COMMENT ON COLUMN team_profiles.organizational_rating IS 'Organizational strength component (0-100)';
COMMENT ON COLUMN team_profiles.momentum_rating IS 'Program momentum and trajectory component (0-100)';
COMMENT ON COLUMN team_profiles.personnel_rating IS 'Personnel quality and depth component (0-100)';
COMMENT ON COLUMN team_profiles.analytics_rating IS 'Analytics and data utilization component (0-100)';
COMMENT ON COLUMN team_profiles.strategic_rating IS 'Strategic planning and execution component (0-100)';
COMMENT ON COLUMN team_profiles.support_rating IS 'Support systems and resources component (0-100)';