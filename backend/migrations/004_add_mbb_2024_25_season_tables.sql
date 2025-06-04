-- Migration: Add Men's Basketball 2024-25 Season Data Tables
-- Creates comprehensive tables for team sheet data including games, rankings, and metrics

-- 1. Season Records Table - Overall team performance by season
CREATE TABLE IF NOT EXISTS season_records (
    record_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    season_year VARCHAR(9) NOT NULL, -- '2024-25'
    
    -- Overall Record
    overall_wins INTEGER DEFAULT 0,
    overall_losses INTEGER DEFAULT 0,
    
    -- Conference Record  
    conference_wins INTEGER DEFAULT 0,
    conference_losses INTEGER DEFAULT 0,
    
    -- Division I Record
    div1_wins INTEGER DEFAULT 0,
    div1_losses INTEGER DEFAULT 0,
    
    -- Non-Conference Record
    non_conf_wins INTEGER DEFAULT 0,
    non_conf_losses INTEGER DEFAULT 0,
    
    -- Home/Away/Neutral Records
    home_wins INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,
    neutral_wins INTEGER DEFAULT 0,
    neutral_losses INTEGER DEFAULT 0,
    
    -- Road Record (Away + Neutral)
    road_wins INTEGER DEFAULT 0,
    road_losses INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport_id, season_year)
);

-- 2. Team Rankings and Metrics - NET, KPI, SOR, etc.
CREATE TABLE IF NOT EXISTS team_metrics (
    metric_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    season_year VARCHAR(9) NOT NULL,
    
    -- NET (NCAA Evaluation Tool) Rankings
    net_ranking INTEGER,
    net_sos INTEGER, -- NET Strength of Schedule
    rpi_sos INTEGER, -- RPI Strength of Schedule
    non_conf_sos INTEGER, -- Non-Conference SOS
    
    -- Predictive Metrics
    kpi_ranking INTEGER, -- KPI (Key Performance Indicator)
    sor_ranking INTEGER, -- SOR (Strength of Record)
    pom_ranking INTEGER, -- Pomeroy Ranking
    bpi_ranking INTEGER, -- BPI (Basketball Power Index)
    t_rank INTEGER, -- T-Rank
    wab_ranking INTEGER, -- WAB (Wins Above Bubble)
    
    -- Average NET Metrics
    avg_net_wins DECIMAL(5,2),
    avg_net_losses DECIMAL(5,2),
    
    -- Quadrant Records
    quadrant_1_wins INTEGER DEFAULT 0,
    quadrant_1_losses INTEGER DEFAULT 0,
    quadrant_2_wins INTEGER DEFAULT 0,
    quadrant_2_losses INTEGER DEFAULT 0,
    quadrant_3_wins INTEGER DEFAULT 0,
    quadrant_3_losses INTEGER DEFAULT 0,
    quadrant_4_wins INTEGER DEFAULT 0,
    quadrant_4_losses INTEGER DEFAULT 0,
    
    -- Quadrant Non-Conference Records
    quad_1_nc_wins INTEGER DEFAULT 0,
    quad_1_nc_losses INTEGER DEFAULT 0,
    quad_2_nc_wins INTEGER DEFAULT 0,
    quad_2_nc_losses INTEGER DEFAULT 0,
    quad_3_nc_wins INTEGER DEFAULT 0,
    quad_3_nc_losses INTEGER DEFAULT 0,
    quad_4_nc_wins INTEGER DEFAULT 0,
    quad_4_nc_losses INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport_id, season_year)
);

-- 3. Game Results - Individual game data
CREATE TABLE IF NOT EXISTS game_results (
    game_id SERIAL PRIMARY KEY,
    season_year VARCHAR(9) NOT NULL,
    sport_id INTEGER NOT NULL,
    
    -- Teams
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    
    -- Game Details
    game_date DATE NOT NULL,
    venue_location VARCHAR(10), -- 'H', 'A', 'N' for Home/Away/Neutral
    
    -- Scores
    home_score INTEGER,
    away_score INTEGER,
    
    -- NET Rankings at time of game
    home_net_ranking INTEGER,
    away_net_ranking INTEGER,
    
    -- Quadrant Classification
    quadrant INTEGER CHECK (quadrant IN (1, 2, 3, 4)),
    
    -- Game Type
    game_type VARCHAR(20) DEFAULT 'regular', -- 'regular', 'conference_tournament', 'ncaa_tournament'
    conference_game BOOLEAN DEFAULT FALSE,
    
    -- Additional Context
    overtime BOOLEAN DEFAULT FALSE,
    neutral_site_name VARCHAR(100),
    tournament_name VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. NET Quadrant Definitions - Dynamic quadrant boundaries
CREATE TABLE IF NOT EXISTS net_quadrant_definitions (
    quad_def_id SERIAL PRIMARY KEY,
    season_year VARCHAR(9) NOT NULL,
    
    -- Quadrant 1 Boundaries
    quad_1_home_start INTEGER DEFAULT 1,
    quad_1_home_end INTEGER DEFAULT 30,
    quad_1_neutral_start INTEGER DEFAULT 1,
    quad_1_neutral_end INTEGER DEFAULT 50,
    quad_1_away_start INTEGER DEFAULT 1,
    quad_1_away_end INTEGER DEFAULT 75,
    
    -- Quadrant 2 Boundaries  
    quad_2_home_start INTEGER DEFAULT 31,
    quad_2_home_end INTEGER DEFAULT 75,
    quad_2_neutral_start INTEGER DEFAULT 51,
    quad_2_neutral_end INTEGER DEFAULT 100,
    quad_2_away_start INTEGER DEFAULT 76,
    quad_2_away_end INTEGER DEFAULT 135,
    
    -- Quadrant 3 Boundaries
    quad_3_home_start INTEGER DEFAULT 76,
    quad_3_home_end INTEGER DEFAULT 160,
    quad_3_neutral_start INTEGER DEFAULT 101,
    quad_3_neutral_end INTEGER DEFAULT 200,
    quad_3_away_start INTEGER DEFAULT 136,
    quad_3_away_end INTEGER DEFAULT 240,
    
    -- Quadrant 4 Boundaries
    quad_4_home_start INTEGER DEFAULT 161,
    quad_4_home_end INTEGER DEFAULT 364,
    quad_4_neutral_start INTEGER DEFAULT 201,
    quad_4_neutral_end INTEGER DEFAULT 364,
    quad_4_away_start INTEGER DEFAULT 241,
    quad_4_away_end INTEGER DEFAULT 364,
    
    effective_date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(season_year)
);

-- 5. Team Opponents Tracking - For strength of schedule calculations
CREATE TABLE IF NOT EXISTS team_opponents (
    opponent_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    season_year VARCHAR(9) NOT NULL,
    sport_id INTEGER NOT NULL,
    
    -- Opponent Details
    opponent_team_id INTEGER,
    opponent_name VARCHAR(100) NOT NULL,
    opponent_net_ranking INTEGER,
    
    -- Game Context
    game_date DATE,
    venue_location VARCHAR(10), -- 'H', 'A', 'N'
    result VARCHAR(1) CHECK (result IN ('W', 'L')), -- Win/Loss
    score_for INTEGER,
    score_against INTEGER,
    
    -- Classification
    conference_opponent BOOLEAN DEFAULT FALSE,
    div1_opponent BOOLEAN DEFAULT TRUE,
    quadrant INTEGER CHECK (quadrant IN (1, 2, 3, 4)),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_season_records_team_sport_season ON season_records(team_id, sport_id, season_year);
CREATE INDEX idx_team_metrics_team_sport_season ON team_metrics(team_id, sport_id, season_year);
CREATE INDEX idx_team_metrics_net_ranking ON team_metrics(net_ranking);
CREATE INDEX idx_game_results_date ON game_results(game_date);
CREATE INDEX idx_game_results_teams ON game_results(home_team_id, away_team_id);
CREATE INDEX idx_game_results_season_sport ON game_results(season_year, sport_id);
CREATE INDEX idx_game_results_quadrant ON game_results(quadrant);
CREATE INDEX idx_team_opponents_team_season ON team_opponents(team_id, season_year, sport_id);
CREATE INDEX idx_team_opponents_date ON team_opponents(game_date);

-- Views for Analysis

-- Comprehensive Team Performance View
DROP MATERIALIZED VIEW IF EXISTS team_performance_summary CASCADE;
DROP VIEW IF EXISTS team_performance_summary CASCADE;
CREATE VIEW team_performance_summary AS
SELECT 
    sr.team_id,
    sr.sport_id,
    sr.season_year,
    -- Overall Record
    CONCAT(sr.overall_wins, '-', sr.overall_losses) AS overall_record,
    CONCAT(sr.conference_wins, '-', sr.conference_losses) AS conference_record,
    CONCAT(sr.road_wins, '-', sr.road_losses) AS road_record,
    
    -- Quadrant Performance
    CONCAT(tm.quadrant_1_wins, '-', tm.quadrant_1_losses) AS quad_1_record,
    CONCAT(tm.quadrant_2_wins, '-', tm.quadrant_2_losses) AS quad_2_record,
    CONCAT(tm.quadrant_3_wins, '-', tm.quadrant_3_losses) AS quad_3_record,
    CONCAT(tm.quadrant_4_wins, '-', tm.quadrant_4_losses) AS quad_4_record,
    
    -- Rankings
    tm.net_ranking,
    tm.kpi_ranking,
    tm.sor_ranking,
    tm.pom_ranking,
    tm.t_rank,
    
    -- Strength Metrics
    tm.net_sos,
    tm.rpi_sos,
    tm.non_conf_sos,
    tm.avg_net_wins,
    tm.avg_net_losses
    
FROM season_records sr
JOIN team_metrics tm ON sr.team_id = tm.team_id 
    AND sr.sport_id = tm.sport_id 
    AND sr.season_year = tm.season_year;

-- Quadrant Performance Analysis View
DROP MATERIALIZED VIEW IF EXISTS quadrant_analysis CASCADE;
DROP VIEW IF EXISTS quadrant_analysis CASCADE;
CREATE VIEW quadrant_analysis AS
SELECT 
    team_id,
    sport_id,
    season_year,
    
    -- Total Quadrant Games
    (quadrant_1_wins + quadrant_1_losses) AS quad_1_games,
    (quadrant_2_wins + quadrant_2_losses) AS quad_2_games,
    (quadrant_3_wins + quadrant_3_losses) AS quad_3_games,
    (quadrant_4_wins + quadrant_4_losses) AS quad_4_games,
    
    -- Quadrant Win Percentages
    CASE 
        WHEN (quadrant_1_wins + quadrant_1_losses) > 0 
        THEN ROUND(quadrant_1_wins::DECIMAL / (quadrant_1_wins + quadrant_1_losses) * 100, 1)
        ELSE NULL 
    END AS quad_1_win_pct,
    
    CASE 
        WHEN (quadrant_2_wins + quadrant_2_losses) > 0 
        THEN ROUND(quadrant_2_wins::DECIMAL / (quadrant_2_wins + quadrant_2_losses) * 100, 1)
        ELSE NULL 
    END AS quad_2_win_pct,
    
    CASE 
        WHEN (quadrant_3_wins + quadrant_3_losses) > 0 
        THEN ROUND(quadrant_3_wins::DECIMAL / (quadrant_3_wins + quadrant_3_losses) * 100, 1)
        ELSE NULL 
    END AS quad_3_win_pct,
    
    CASE 
        WHEN (quadrant_4_wins + quadrant_4_losses) > 0 
        THEN ROUND(quadrant_4_wins::DECIMAL / (quadrant_4_wins + quadrant_4_losses) * 100, 1)
        ELSE NULL 
    END AS quad_4_win_pct,
    
    -- Quality Win Metrics
    quadrant_1_wins AS quality_wins_q1,
    quadrant_2_wins AS quality_wins_q2,
    (quadrant_1_wins + quadrant_2_wins) AS total_quality_wins,
    
    -- Bad Loss Metrics  
    quadrant_3_losses AS concerning_losses_q3,
    quadrant_4_losses AS bad_losses_q4,
    (quadrant_3_losses + quadrant_4_losses) AS total_concerning_losses
    
FROM team_metrics;

-- Insert default quadrant definitions for 2024-25 season
INSERT INTO net_quadrant_definitions (season_year) 
VALUES ('2024-25') 
ON CONFLICT (season_year) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE season_records IS 'Team win-loss records by venue type and opponent classification for 2024-25 season';
COMMENT ON TABLE team_metrics IS 'NET rankings, predictive metrics, and quadrant performance data';
COMMENT ON TABLE game_results IS 'Individual game results with NET rankings and quadrant classifications';
COMMENT ON TABLE net_quadrant_definitions IS 'Dynamic quadrant boundary definitions by season';
COMMENT ON TABLE team_opponents IS 'Opponent tracking for strength of schedule calculations';

COMMENT ON VIEW team_performance_summary IS 'Comprehensive view combining records and rankings for analysis';
COMMENT ON VIEW quadrant_analysis IS 'Quadrant performance metrics and quality win/loss analysis';