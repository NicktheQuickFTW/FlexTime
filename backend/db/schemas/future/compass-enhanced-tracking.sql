-- Enhanced COMPASS Historical Tracking and Agent Automation Schema
-- Implements 30 workers per task scaling and Unified Compass Report features
-- Created: 2025-05-30

-- Enhanced COMPASS ratings history with synergy effects and momentum tracking
CREATE TABLE IF NOT EXISTS compass_ratings_history (
    rating_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    rating_date DATE NOT NULL,
    
    -- Core COMPASS scores (0-100 scale)
    competitive DECIMAL(4,1) CHECK (competitive >= 0 AND competitive <= 100),
    operational DECIMAL(4,1) CHECK (operational >= 0 AND operational <= 100),
    market DECIMAL(4,1) CHECK (market >= 0 AND market <= 100),
    player DECIMAL(4,1) CHECK (player >= 0 AND player <= 100),
    audience DECIMAL(4,1) CHECK (audience >= 0 AND audience <= 100),
    sport_standing DECIMAL(4,1) CHECK (sport_standing >= 0 AND sport_standing <= 100),
    sustainability DECIMAL(4,1) CHECK (sustainability >= 0 AND sustainability <= 100),
    
    -- Base calculated score
    base_rating DECIMAL(4,1) GENERATED ALWAYS AS (
        competitive * 0.25 + operational * 0.20 + market * 0.15 + 
        player * 0.15 + audience * 0.10 + sport_standing * 0.10 + 
        sustainability * 0.05
    ) STORED,
    
    -- NEW: Enhanced features from Unified Compass Report
    synergy_effects DECIMAL(4,2) DEFAULT 0.00,
    momentum_factor DECIMAL(4,2) DEFAULT 0.00,
    balance_penalty DECIMAL(4,2) DEFAULT 0.00,
    
    -- Final enhanced rating
    overall_rating DECIMAL(4,1) GENERATED ALWAYS AS (
        competitive * 0.25 + operational * 0.20 + market * 0.15 + 
        player * 0.15 + audience * 0.10 + sport_standing * 0.10 + 
        sustainability * 0.05 + synergy_effects + momentum_factor + balance_penalty
    ) STORED,
    
    -- Enhanced metadata
    data_source VARCHAR(50) DEFAULT 'enhanced_compass' CHECK (data_source IN 
        ('enhanced_compass', 'ai_agent', 'manual', 'api', 'research_orchestration')),
    confidence_level VARCHAR(10) DEFAULT 'medium' CHECK (confidence_level IN 
        ('high', 'medium', 'low')),
    worker_multiplier INTEGER DEFAULT 30,
    processing_time_ms INTEGER,
    
    -- Sport-specific metrics (JSONB for flexibility)
    sport_metrics JSONB DEFAULT '{}',
    
    -- Momentum tracking data
    momentum_data JSONB DEFAULT '{}', -- Recent games, trends, etc.
    
    -- Update tracking
    update_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, rating_date)
);

-- Optimized indexes for 30-worker scaling
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_history_team_date 
    ON compass_ratings_history(team_id, rating_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_overall_rating 
    ON compass_ratings_history(overall_rating DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_base_rating 
    ON compass_ratings_history(base_rating DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_sport_metrics 
    ON compass_ratings_history USING GIN(sport_metrics);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_momentum_data 
    ON compass_ratings_history USING GIN(momentum_data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_created_at 
    ON compass_ratings_history(created_at DESC);

-- Automated agent task queue with 30-worker scaling
CREATE TABLE IF NOT EXISTS agent_tasks (
    task_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN 
        ('daily_update', 'game_result', 'injury_check', 'transfer_portal', 
         'roster_change', 'momentum_update', 'synergy_calculation', 'batch_update')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Scheduling with 30-worker considerations
    scheduled_time TIMESTAMP NOT NULL,
    started_time TIMESTAMP,
    completed_time TIMESTAMP,
    worker_id INTEGER, -- Track which of 30 workers processed this
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN 
        ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    
    -- Task configuration
    prompt_template TEXT,
    task_config JSONB DEFAULT '{}',
    
    -- Results and processing
    result_data JSONB DEFAULT '{}',
    processing_duration_ms INTEGER,
    
    -- FlexTime integration
    flextime_integration BOOLEAN DEFAULT true,
    schedule_id INTEGER, -- Reference to related schedule
    constraint_impact JSONB DEFAULT '{}', -- How this affects scheduling
    
    -- Error handling
    error_log TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indexes for agent task processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_pending 
    ON agent_tasks(status, priority DESC, scheduled_time) 
    WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_worker 
    ON agent_tasks(worker_id, status, started_time DESC) 
    WHERE worker_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_flextime 
    ON agent_tasks(flextime_integration, status, team_id) 
    WHERE flextime_integration = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_tasks_type_team 
    ON agent_tasks(task_type, team_id, scheduled_time DESC);

-- Opponent intelligence cache for enhanced scheduling
CREATE TABLE IF NOT EXISTS opponent_intelligence (
    intel_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    opponent_id INTEGER REFERENCES teams(team_id),
    game_date DATE,
    sport VARCHAR(50),
    
    -- Pre-calculated metrics for FlexTime constraint system
    win_probability DECIMAL(3,2) CHECK (win_probability >= 0 AND win_probability <= 1),
    rpi_impact_if_win DECIMAL(6,4),
    rpi_impact_if_loss DECIMAL(6,4),
    net_kpi_impact DECIMAL(6,4), -- NEW: Enhanced ranking impact
    
    -- Attendance and financial projections
    projected_attendance INTEGER CHECK (projected_attendance >= 0),
    projected_revenue DECIMAL(10,2),
    
    -- Travel and logistics
    travel_distance INTEGER CHECK (travel_distance >= 0),
    travel_cost DECIMAL(8,2),
    carbon_footprint DECIMAL(8,2), -- Sustainability metric
    
    -- NEW: Enhanced scheduling value scores with 30-worker calculations
    competitive_value DECIMAL(4,1) CHECK (competitive_value >= 0 AND competitive_value <= 100),
    financial_value DECIMAL(4,1) CHECK (financial_value >= 0 AND financial_value <= 100),
    strategic_value DECIMAL(4,1) CHECK (strategic_value >= 0 AND strategic_value <= 100),
    media_value DECIMAL(4,1) CHECK (media_value >= 0 AND media_value <= 100),
    
    -- FlexTime constraint compatibility
    constraint_compatibility DECIMAL(4,1) CHECK (constraint_compatibility >= 0 AND constraint_compatibility <= 100),
    constraint_violations JSONB DEFAULT '[]', -- List of potential constraint issues
    
    -- Enhanced analytics
    momentum_matchup DECIMAL(3,2), -- Momentum differential between teams
    synergy_potential DECIMAL(3,2), -- Potential for creating synergistic effects
    
    -- Caching and performance
    calculation_time_ms INTEGER,
    confidence_score DECIMAL(3,2) DEFAULT 0.85,
    
    -- Timestamps
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    UNIQUE(team_id, opponent_id, game_date, sport)
);

-- Indexes for opponent intelligence queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opponent_intel_scheduling 
    ON opponent_intelligence(team_id, game_date, constraint_compatibility DESC, expires_at)
    WHERE expires_at > CURRENT_TIMESTAMP;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opponent_intel_values 
    ON opponent_intelligence(competitive_value DESC, financial_value DESC, strategic_value DESC)
    WHERE expires_at > CURRENT_TIMESTAMP;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opponent_intel_sport 
    ON opponent_intelligence(sport, team_id, last_updated DESC);

-- Real-time data pipeline tracking for adaptive frequency updates
CREATE TABLE IF NOT EXISTS compass_update_schedule (
    schedule_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id),
    sport VARCHAR(50) NOT NULL,
    
    -- Update frequency configuration
    tier VARCHAR(10) CHECK (tier IN ('tier_1', 'tier_2', 'tier_3', 'tier_4')),
    base_frequency VARCHAR(20) CHECK (base_frequency IN 
        ('real_time', 'daily', '3x_daily', '3x_weekly', 'weekly', 'bi_weekly')),
    current_frequency VARCHAR(20),
    
    -- Adaptive frequency factors
    volatility_score DECIMAL(3,2) DEFAULT 0.00,
    performance_tier VARCHAR(15) CHECK (performance_tier IN 
        ('top_third', 'middle_third', 'bottom_third')),
    
    -- Scheduling
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_scheduled_update TIMESTAMP,
    
    -- Performance tracking
    successful_updates INTEGER DEFAULT 0,
    failed_updates INTEGER DEFAULT 0,
    avg_processing_time_ms INTEGER,
    
    -- Worker allocation
    preferred_worker_pool VARCHAR(20) DEFAULT 'general', -- For 30-worker distribution
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, sport)
);

-- Indexes for update scheduling
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_update_next_scheduled 
    ON compass_update_schedule(next_scheduled_update ASC, tier, current_frequency)
    WHERE next_scheduled_update <= CURRENT_TIMESTAMP + INTERVAL '1 hour';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_update_performance 
    ON compass_update_schedule(performance_tier, volatility_score DESC, team_id);

-- Sport-specific metrics templates for JSONB storage
CREATE TABLE IF NOT EXISTS sport_metrics_templates (
    template_id SERIAL PRIMARY KEY,
    sport VARCHAR(50) UNIQUE NOT NULL,
    
    -- Metric definitions
    metric_definitions JSONB NOT NULL DEFAULT '{}',
    
    -- Validation rules
    validation_rules JSONB DEFAULT '{}',
    
    -- Weight configurations for enhanced calculations
    component_weights JSONB DEFAULT '{}',
    synergy_multipliers JSONB DEFAULT '{}',
    
    -- Update tracking
    version VARCHAR(10) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default sport templates with enhanced features
INSERT INTO sport_metrics_templates (sport, metric_definitions, component_weights, synergy_multipliers) 
VALUES 
    ('basketball', 
     '{
        "kpi_rank": {"type": "integer", "range": [1, 400], "description": "KPI ranking for basketball/volleyball"},
        "net_rank": {"type": "integer", "range": [1, 400], "description": "NET ranking"},
        "kenpom_rank": {"type": "integer", "range": [1, 400], "description": "KenPom ranking"},
        "tempo": {"type": "decimal", "range": [60, 80], "description": "Possessions per game"},
        "offensive_efficiency": {"type": "decimal", "range": [80, 130], "description": "Points per 100 possessions"},
        "defensive_efficiency": {"type": "decimal", "range": [80, 130], "description": "Points allowed per 100 possessions"},
        "quad_1_wins": {"type": "integer", "range": [0, 20], "description": "Quadrant 1 wins"},
        "quad_1_losses": {"type": "integer", "range": [0, 15], "description": "Quadrant 1 losses"}
      }',
     '{"competitive": 0.30, "operational": 0.20, "media": 0.15, "participant": 0.15, "audience": 0.10, "sport": 0.10}',
     '{"net_kenpom": 1.2, "quad_efficiency": 1.1}'
    ),
    ('football', 
     '{
        "cfp_rank": {"type": "integer", "range": [1, 25], "description": "College Football Playoff ranking"},
        "ap_rank": {"type": "integer", "range": [1, 25], "description": "AP Poll ranking"},
        "strength_of_record": {"type": "decimal", "range": [0, 1], "description": "Strength of record"},
        "total_offense": {"type": "decimal", "range": [200, 600], "description": "Yards per game"},
        "total_defense": {"type": "decimal", "range": [200, 600], "description": "Yards allowed per game"},
        "turnover_margin": {"type": "integer", "range": [-20, 20], "description": "Turnover differential"}
      }',
     '{"competitive": 0.35, "operational": 0.20, "media": 0.20, "participant": 0.10, "audience": 0.10, "sport": 0.05}',
     '{"ranking_performance": 1.5, "offense_defense": 1.3}'
    ),
    ('baseball', 
     '{
        "rpi": {"type": "decimal", "range": [0.3, 0.7], "description": "Rating Percentage Index"},
        "team_era": {"type": "decimal", "range": [2.0, 8.0], "description": "Team earned run average"},
        "fielding_percentage": {"type": "decimal", "range": [0.9, 1.0], "description": "Fielding percentage"},
        "batting_average": {"type": "decimal", "range": [0.2, 0.4], "description": "Team batting average"},
        "runs_per_game": {"type": "decimal", "range": [3, 12], "description": "Average runs scored per game"},
        "quality_starts": {"type": "integer", "range": [0, 40], "description": "Number of quality starts"}
      }',
     '{"competitive": 0.25, "operational": 0.20, "media": 0.15, "participant": 0.15, "audience": 0.15, "sport": 0.10}',
     '{"pitching_hitting": 1.4, "rpi_performance": 1.2}'
    )
ON CONFLICT (sport) DO UPDATE SET
    metric_definitions = EXCLUDED.metric_definitions,
    component_weights = EXCLUDED.component_weights,
    synergy_multipliers = EXCLUDED.synergy_multipliers,
    updated_at = CURRENT_TIMESTAMP;

-- Performance monitoring for 30-worker scaling
CREATE TABLE IF NOT EXISTS compass_performance_metrics (
    metric_id SERIAL PRIMARY KEY,
    
    -- Performance tracking
    calculation_type VARCHAR(50) NOT NULL,
    worker_count INTEGER DEFAULT 30,
    total_calculations INTEGER DEFAULT 0,
    successful_calculations INTEGER DEFAULT 0,
    failed_calculations INTEGER DEFAULT 0,
    
    -- Timing metrics
    avg_calculation_time_ms DECIMAL(8,2),
    max_calculation_time_ms INTEGER,
    min_calculation_time_ms INTEGER,
    
    -- Resource utilization
    memory_usage_mb DECIMAL(8,2),
    cpu_utilization_percent DECIMAL(5,2),
    cache_hit_rate DECIMAL(5,4),
    
    -- Quality metrics
    accuracy_score DECIMAL(5,4),
    confidence_avg DECIMAL(5,4),
    
    -- Time window
    measurement_start TIMESTAMP NOT NULL,
    measurement_end TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compass_performance_time 
    ON compass_performance_metrics(measurement_start DESC, calculation_type);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_compass_ratings_history_updated_at 
    BEFORE UPDATE ON compass_ratings_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at 
    BEFORE UPDATE ON agent_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compass_update_schedule_updated_at 
    BEFORE UPDATE ON compass_update_schedule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sport_metrics_templates_updated_at 
    BEFORE UPDATE ON sport_metrics_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE compass_ratings_history IS 'Enhanced COMPASS historical tracking with synergy effects, momentum factors, and 30-worker scaling support';
COMMENT ON TABLE agent_tasks IS 'Automated agent task queue with 30-worker distribution and FlexTime integration';
COMMENT ON TABLE opponent_intelligence IS 'Pre-calculated opponent intelligence for enhanced scheduling decisions';
COMMENT ON TABLE compass_update_schedule IS 'Adaptive frequency scheduling for real-time COMPASS updates';
COMMENT ON TABLE sport_metrics_templates IS 'Sport-specific metric definitions and configuration templates';
COMMENT ON TABLE compass_performance_metrics IS 'Performance monitoring for 30-worker COMPASS calculations';

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO flextime_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO flextime_app;