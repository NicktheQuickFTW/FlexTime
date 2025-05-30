-- Enhanced Research Data Storage Schema for COMPASS & HELiiX
-- This script creates tables to store comprehensive research data including
-- transfer portal, recruiting, coaching changes, and other COMPASS factors

-- Rename recruiting_data to comprehensive_research_data for broader scope
DO $$
BEGIN
    -- Check if the table has data before renaming
    IF EXISTS (SELECT 1 FROM recruiting_data LIMIT 1) THEN
        RAISE NOTICE 'recruiting_data table has data, creating new table instead';
        -- Create new table alongside existing one
        CREATE TABLE IF NOT EXISTS comprehensive_research_data AS SELECT * FROM recruiting_data;
    ELSE
        -- Safe to rename since table is empty
        ALTER TABLE recruiting_data RENAME TO comprehensive_research_data;
        RAISE NOTICE 'Renamed recruiting_data to comprehensive_research_data';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'recruiting_data table does not exist';
END $$;

-- Add enhanced columns to comprehensive_research_data table
ALTER TABLE comprehensive_research_data 
ADD COLUMN IF NOT EXISTS research_source VARCHAR(100) DEFAULT 'manual_entry',
ADD COLUMN IF NOT EXISTS last_research_update TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS research_confidence DECIMAL(3,2) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS summer_2025_portal_ranking INTEGER,
ADD COLUMN IF NOT EXISTS summer_2025_recruiting_ranking INTEGER,
ADD COLUMN IF NOT EXISTS coaching_stability_score DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS facility_investment_notes TEXT,
ADD COLUMN IF NOT EXISTS competitive_analysis TEXT,
ADD COLUMN IF NOT EXISTS program_trajectory_notes TEXT,
ADD COLUMN IF NOT EXISTS nil_program_strength VARCHAR(20),
ADD COLUMN IF NOT EXISTS external_rankings JSONB,
ADD COLUMN IF NOT EXISTS media_coverage_score DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS fan_engagement_metrics JSONB;

-- Create transfer_portal_activity table for detailed tracking
CREATE TABLE IF NOT EXISTS transfer_portal_activity (
    portal_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    season VARCHAR(20) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    transfer_type VARCHAR(20) CHECK (transfer_type IN ('incoming', 'outgoing')),
    previous_school VARCHAR(100),
    destination_school VARCHAR(100),
    position VARCHAR(50),
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    portal_ranking INTEGER,
    impact_rating VARCHAR(20) CHECK (impact_rating IN ('high', 'medium', 'low')),
    transfer_reason TEXT,
    nil_factor BOOLEAN DEFAULT false,
    portal_date DATE,
    commitment_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create coaching_changes table for tracking staff updates
CREATE TABLE IF NOT EXISTS coaching_changes (
    change_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    season VARCHAR(20) NOT NULL,
    coach_name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL, -- 'head_coach', 'assistant_coach', 'coordinator'
    change_type VARCHAR(20) CHECK (change_type IN ('hired', 'fired', 'resigned', 'promoted')),
    previous_school VARCHAR(100),
    contract_length INTEGER, -- years
    salary_range VARCHAR(50),
    hire_date DATE,
    announcement_date DATE,
    impact_rating VARCHAR(20) CHECK (impact_rating IN ('high', 'medium', 'low')),
    coaching_experience TEXT,
    recruiting_strength TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create facility_investments table for tracking infrastructure changes
CREATE TABLE IF NOT EXISTS facility_investments (
    investment_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    school_id INTEGER REFERENCES schools(school_id),
    investment_type VARCHAR(50) NOT NULL, -- 'stadium', 'practice_facility', 'training_center', 'locker_room'
    investment_amount DECIMAL(12,2),
    project_name VARCHAR(200),
    completion_date DATE,
    announcement_date DATE,
    funding_source VARCHAR(100), -- 'donation', 'university', 'athletics_revenue'
    donor_name VARCHAR(100),
    impact_on_recruiting TEXT,
    facility_details TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create nil_program_tracking table for NIL activity
CREATE TABLE IF NOT EXISTS nil_program_tracking (
    nil_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    school_id INTEGER REFERENCES schools(school_id),
    season VARCHAR(20) NOT NULL,
    nil_collective_name VARCHAR(100),
    estimated_budget DECIMAL(12,2),
    nil_strength_rating VARCHAR(20) CHECK (nil_strength_rating IN ('elite', 'strong', 'average', 'developing', 'weak')),
    major_nil_deals INTEGER DEFAULT 0,
    notable_signings TEXT[],
    nil_coordinator VARCHAR(100),
    market_advantages TEXT,
    nil_compliance_score DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create external_data_sources table for tracking research citations
CREATE TABLE IF NOT EXISTS external_data_sources (
    source_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    research_date DATE DEFAULT CURRENT_DATE,
    source_type VARCHAR(50) NOT NULL, -- 'perplexity', 'gemini', 'manual', 'api'
    source_name VARCHAR(100) NOT NULL, -- 'ESPN', '247Sports', 'Rivals', etc.
    data_type VARCHAR(50) NOT NULL, -- 'recruiting_ranking', 'transfer_news', 'coaching_change'
    source_url TEXT,
    reliability_score DECIMAL(3,2) DEFAULT 0.8,
    data_content JSONB,
    citation_text TEXT,
    research_confidence DECIMAL(3,2) DEFAULT 0.7,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create performance_benchmarks table for historical tracking
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    benchmark_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    season VARCHAR(20) NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL, -- 'wins', 'tournament_seed', 'ranking', 'attendance'
    benchmark_value DECIMAL(10,2),
    benchmark_rank INTEGER,
    conference_rank INTEGER,
    national_rank INTEGER,
    benchmark_date DATE,
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfer_portal_team_season ON transfer_portal_activity(team_id, season);
CREATE INDEX IF NOT EXISTS idx_coaching_changes_team_season ON coaching_changes(team_id, season);
CREATE INDEX IF NOT EXISTS idx_facility_investments_school ON facility_investments(school_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_nil_tracking_team_season ON nil_program_tracking(team_id, season);
CREATE INDEX IF NOT EXISTS idx_external_sources_team_date ON external_data_sources(team_id, research_date);
CREATE INDEX IF NOT EXISTS idx_benchmarks_team_season ON performance_benchmarks(team_id, season);
CREATE INDEX IF NOT EXISTS idx_comprehensive_research_team_season ON comprehensive_research_data(team_id, season);

-- Create a view for complete team research data
CREATE OR REPLACE VIEW team_research_complete AS
SELECT 
    t.team_id,
    s.school,
    s.short_display,
    sp.sport_name,
    -- COMPASS data
    t.compass_rating,
    t.compass_competitive,
    t.compass_operational,
    t.compass_market,
    t.compass_trajectory,
    t.compass_analytics,
    t.head_coach,
    t.last_updated_summer_2025,
    -- Comprehensive research data
    crd.season,
    crd.recruiting_class_rank,
    crd.recruiting_class_rating,
    crd.transfer_portal_additions,
    crd.transfer_portal_losses,
    crd.summer_2025_portal_ranking,
    crd.summer_2025_recruiting_ranking,
    crd.coaching_stability_score,
    crd.nil_program_strength,
    crd.research_confidence,
    crd.last_research_update,
    -- Recent coaching changes
    (SELECT COUNT(*) FROM coaching_changes cc WHERE cc.team_id = t.team_id AND cc.season = '2024-25') as recent_coaching_changes,
    -- NIL strength
    npt.nil_strength_rating,
    npt.estimated_budget as nil_budget,
    -- Recent facility investments
    (SELECT COUNT(*) FROM facility_investments fi WHERE fi.team_id = t.team_id AND fi.completion_date >= '2023-01-01') as recent_facility_investments
FROM teams t
JOIN schools s ON t.school_id = s.school_id
JOIN sports sp ON t.sport_id = sp.sport_id
LEFT JOIN comprehensive_research_data crd ON t.team_id = crd.team_id AND crd.season = '2024-25'
LEFT JOIN nil_program_tracking npt ON t.team_id = npt.team_id AND npt.season = '2024-25'
WHERE s.school_id BETWEEN 1 AND 16; -- Big 12 schools only

-- Grant permissions (adjust as needed for your user setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;

-- Add helpful comments
COMMENT ON TABLE comprehensive_research_data IS 'Enhanced recruiting and research data including transfer portal, recruiting rankings, and program analysis';
COMMENT ON TABLE transfer_portal_activity IS 'Detailed transfer portal tracking with player-level data and impact analysis';
COMMENT ON TABLE coaching_changes IS 'Coaching staff changes tracking with impact assessment';
COMMENT ON TABLE facility_investments IS 'Infrastructure investments and facility improvements tracking';
COMMENT ON TABLE nil_program_tracking IS 'NIL collective and program strength tracking';
COMMENT ON TABLE external_data_sources IS 'Research citations and external data source tracking';
COMMENT ON TABLE performance_benchmarks IS 'Historical performance metrics for trend analysis';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced research data schema created successfully!';
    RAISE NOTICE 'Tables created: comprehensive_research_data, transfer_portal_activity, coaching_changes, facility_investments, nil_program_tracking, external_data_sources, performance_benchmarks';
    RAISE NOTICE 'View created: team_research_complete';
END $$;