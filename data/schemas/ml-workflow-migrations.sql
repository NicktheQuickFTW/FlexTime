-- FlexTime ML Workflow Database Migrations
-- Creates tables to support learning capabilities for scheduling agents
-- Aligned with FlexTime database schema patterns (school_id, team_id patterns)

-- Historical schedules table - if not already exists
CREATE TABLE IF NOT EXISTS historical_schedules (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
  season_year INTEGER NOT NULL,
  season_type VARCHAR(20) DEFAULT 'regular' CHECK (season_type IN ('regular', 'postseason', 'tournament')),
  algorithm VARCHAR(50) NOT NULL,
  schedule_data JSONB NOT NULL,
  team_count INTEGER NOT NULL,
  game_count INTEGER NOT NULL,
  -- FlexTime specific fields
  school_ids INTEGER[] NOT NULL, -- Array of participating school IDs
  venue_ids INTEGER[] NOT NULL, -- Array of venue IDs used
  constraint_profile JSONB, -- Constraints used for this schedule
  generated_by VARCHAR(100) DEFAULT 'flextime_engine',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule metrics table - if not already exists
CREATE TABLE IF NOT EXISTS schedule_metrics (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES historical_schedules(id) ON DELETE CASCADE,
  -- Core quality metrics
  quality_score DECIMAL(5,3) CHECK (quality_score >= 0 AND quality_score <= 1),
  travel_efficiency DECIMAL(5,3) CHECK (travel_efficiency >= 0 AND travel_efficiency <= 1),
  home_away_balance DECIMAL(5,3) CHECK (home_away_balance >= 0 AND home_away_balance <= 1),
  rivalry_satisfaction DECIMAL(5,3) CHECK (rivalry_satisfaction >= 0 AND rivalry_satisfaction <= 1),
  constraint_compliance DECIMAL(5,3) CHECK (constraint_compliance >= 0 AND constraint_compliance <= 1),
  -- Enhanced FlexTime metrics
  venue_utilization DECIMAL(5,3),
  scheduling_fairness DECIMAL(5,3),
  competitive_balance DECIMAL(5,3),
  broadcast_optimization DECIMAL(5,3),
  championship_preparation DECIMAL(5,3),
  -- Analysis data
  violation_count INTEGER DEFAULT 0,
  constraint_weights JSONB,
  optimization_time_seconds DECIMAL(8,3),
  -- Feedback and evaluation
  user_feedback JSONB,
  coach_satisfaction JSONB,
  fan_engagement_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule features for ML analysis
CREATE TABLE IF NOT EXISTS schedule_features (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER UNIQUE NOT NULL REFERENCES historical_schedules(id) ON DELETE CASCADE,
  -- FlexTime feature categories
  temporal_features JSONB, -- Time-based patterns, weekend preferences, etc.
  geographical_features JSONB, -- Travel patterns, venue distributions
  team_features JSONB, -- Team-specific patterns using school_id/team_id
  constraint_features JSONB, -- Constraint satisfaction patterns
  competitive_features JSONB, -- Rivalry games, strength of schedule
  venue_features JSONB, -- Venue utilization patterns
  broadcast_features JSONB, -- TV scheduling optimization
  -- Combined feature vector for ML models
  feature_vector DECIMAL[],
  feature_labels TEXT[],
  normalization_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned patterns from historical analysis
CREATE TABLE IF NOT EXISTS learned_patterns (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN (
    'temporal_preference', 'venue_affinity', 'travel_optimization', 
    'rivalry_scheduling', 'competitive_balance', 'constraint_correlation',
    'weather_impact', 'broadcast_preference', 'championship_preparation'
  )),
  pattern_data JSONB NOT NULL,
  -- Pattern metadata
  confidence_score DECIMAL(5,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  sample_size INTEGER NOT NULL,
  statistical_significance DECIMAL(5,3),
  -- Scope and applicability
  applies_to_schools INTEGER[], -- Array of school_ids this pattern applies to
  venue_types INTEGER[], -- Array of venue types (from SSVV pattern)
  seasonal_factors JSONB, -- When this pattern is most relevant
  -- Validation and lifecycle
  discovery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validation_count INTEGER DEFAULT 0,
  validation_success_rate DECIMAL(5,3),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'experimental'))
);

-- Agent memory for continuous learning
CREATE TABLE IF NOT EXISTS agent_memories (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(100) NOT NULL,
  sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
  memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN (
    'successful_strategy', 'constraint_solution', 'optimization_technique',
    'user_preference', 'scheduling_pattern', 'error_recovery', 'best_practice'
  )),
  content JSONB NOT NULL,
  -- Memory metadata
  relevance_score DECIMAL(5,3) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  importance_level INTEGER DEFAULT 3 CHECK (importance_level BETWEEN 1 AND 5),
  context_tags TEXT[],
  -- Associated entities (using FlexTime ID patterns)
  related_schools INTEGER[], -- Array of school_ids
  related_venues INTEGER[], -- Array of venue_ids (SSVV format)
  related_teams INTEGER[], -- Array of team_ids (SSSPP format)
  -- Usage tracking
  access_count INTEGER DEFAULT 0,
  success_applications INTEGER DEFAULT 0,
  failed_applications INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Learning history for tracking progress
CREATE TABLE IF NOT EXISTS learning_history (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
  agent_id VARCHAR(100) NOT NULL,
  learning_phase VARCHAR(50) NOT NULL CHECK (learning_phase IN (
    'initial_training', 'pattern_discovery', 'optimization_tuning',
    'constraint_learning', 'feedback_integration', 'model_refinement',
    'validation_testing', 'production_deployment'
  )),
  -- Training configuration
  parameters JSONB,
  training_data_size INTEGER,
  model_version VARCHAR(20),
  algorithm_used VARCHAR(50),
  -- Results and performance
  results JSONB,
  accuracy_metrics JSONB,
  performance_benchmarks JSONB,
  improvement_percentage DECIMAL(5,2),
  -- Execution details
  duration_seconds INTEGER,
  memory_usage_mb INTEGER,
  cpu_utilization_percent DECIMAL(5,2),
  -- Status and outcome
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_details TEXT,
  success_criteria_met BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Schedule simulation results for validation
CREATE TABLE IF NOT EXISTS schedule_simulations (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
  simulation_type VARCHAR(30) DEFAULT 'optimization' CHECK (simulation_type IN (
    'optimization', 'constraint_testing', 'what_if_analysis', 
    'stress_testing', 'monte_carlo', 'sensitivity_analysis'
  )),
  -- Simulation configuration
  parameters JSONB NOT NULL,
  scenario_description TEXT,
  simulation_scope VARCHAR(20) DEFAULT 'full' CHECK (simulation_scope IN ('full', 'partial', 'regional')),
  -- Input data
  participating_schools INTEGER[] NOT NULL,
  available_venues INTEGER[] NOT NULL,
  constraint_set JSONB,
  schedule_requirements JSONB,
  -- Simulation results
  results JSONB NOT NULL,
  generated_schedules_count INTEGER DEFAULT 1,
  best_schedule_data JSONB,
  alternative_schedules JSONB,
  -- Performance metrics
  evaluation_score DECIMAL(5,3) CHECK (evaluation_score >= 0 AND evaluation_score <= 1),
  constraint_violations INTEGER DEFAULT 0,
  optimization_time_seconds DECIMAL(8,3),
  convergence_iterations INTEGER,
  -- Comparative analysis
  baseline_comparison JSONB,
  improvement_metrics JSONB,
  trade_off_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indices for better query performance

-- Historical schedules indices
CREATE INDEX IF NOT EXISTS historical_schedules_sport_idx ON historical_schedules(sport_id);
CREATE INDEX IF NOT EXISTS historical_schedules_season_idx ON historical_schedules(season_year, season_type);
CREATE INDEX IF NOT EXISTS historical_schedules_algorithm_idx ON historical_schedules(algorithm);
CREATE INDEX IF NOT EXISTS historical_schedules_schools_idx ON historical_schedules USING GIN(school_ids);

-- Schedule metrics indices
CREATE INDEX IF NOT EXISTS schedule_metrics_schedule_idx ON schedule_metrics(schedule_id);
CREATE INDEX IF NOT EXISTS schedule_metrics_quality_idx ON schedule_metrics(quality_score DESC);
CREATE INDEX IF NOT EXISTS schedule_metrics_efficiency_idx ON schedule_metrics(travel_efficiency DESC);

-- Schedule features indices
CREATE INDEX IF NOT EXISTS schedule_features_schedule_idx ON schedule_features(schedule_id);

-- Learned patterns indices
CREATE INDEX IF NOT EXISTS learned_patterns_sport_idx ON learned_patterns(sport_id);
CREATE INDEX IF NOT EXISTS learned_patterns_type_idx ON learned_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS learned_patterns_confidence_idx ON learned_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS learned_patterns_status_idx ON learned_patterns(status);
CREATE INDEX IF NOT EXISTS learned_patterns_schools_idx ON learned_patterns USING GIN(applies_to_schools);

-- Agent memories indices
CREATE INDEX IF NOT EXISTS agent_memories_agent_idx ON agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS agent_memories_sport_idx ON agent_memories(sport_id);
CREATE INDEX IF NOT EXISTS agent_memories_type_idx ON agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS agent_memories_relevance_idx ON agent_memories(relevance_score DESC);
CREATE INDEX IF NOT EXISTS agent_memories_access_idx ON agent_memories(last_accessed DESC);
CREATE INDEX IF NOT EXISTS agent_memories_schools_idx ON agent_memories USING GIN(related_schools);
CREATE INDEX IF NOT EXISTS agent_memories_venues_idx ON agent_memories USING GIN(related_venues);
CREATE INDEX IF NOT EXISTS agent_memories_teams_idx ON agent_memories USING GIN(related_teams);

-- Learning history indices
CREATE INDEX IF NOT EXISTS learning_history_sport_idx ON learning_history(sport_id);
CREATE INDEX IF NOT EXISTS learning_history_agent_idx ON learning_history(agent_id);
CREATE INDEX IF NOT EXISTS learning_history_phase_idx ON learning_history(learning_phase);
CREATE INDEX IF NOT EXISTS learning_history_status_idx ON learning_history(status);
CREATE INDEX IF NOT EXISTS learning_history_date_idx ON learning_history(created_at DESC);

-- Schedule simulations indices
CREATE INDEX IF NOT EXISTS schedule_simulations_sport_idx ON schedule_simulations(sport_id);
CREATE INDEX IF NOT EXISTS schedule_simulations_type_idx ON schedule_simulations(simulation_type);
CREATE INDEX IF NOT EXISTS schedule_simulations_score_idx ON schedule_simulations(evaluation_score DESC);
CREATE INDEX IF NOT EXISTS schedule_simulations_schools_idx ON schedule_simulations USING GIN(participating_schools);
CREATE INDEX IF NOT EXISTS schedule_simulations_venues_idx ON schedule_simulations USING GIN(available_venues);

-- Composite indices for common queries
CREATE INDEX IF NOT EXISTS historical_schedules_sport_season_idx ON historical_schedules(sport_id, season_year);
CREATE INDEX IF NOT EXISTS learned_patterns_sport_type_idx ON learned_patterns(sport_id, pattern_type);
CREATE INDEX IF NOT EXISTS agent_memories_agent_sport_idx ON agent_memories(agent_id, sport_id);
CREATE INDEX IF NOT EXISTS learning_history_agent_phase_idx ON learning_history(agent_id, learning_phase);

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_ml_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_historical_schedules_updated_at 
    BEFORE UPDATE ON historical_schedules
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_schedule_metrics_updated_at 
    BEFORE UPDATE ON schedule_metrics
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_schedule_features_updated_at 
    BEFORE UPDATE ON schedule_features
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

-- Comments for documentation
COMMENT ON TABLE historical_schedules IS 'Storage for historical schedule data aligned with FlexTime schema patterns';
COMMENT ON TABLE schedule_metrics IS 'Enhanced quality and performance metrics for schedule evaluation';
COMMENT ON TABLE schedule_features IS 'ML feature extraction from schedules for pattern recognition';
COMMENT ON TABLE learned_patterns IS 'Discovered patterns from historical analysis with FlexTime entity relationships';
COMMENT ON TABLE agent_memories IS 'Continuous learning memory system for scheduling agents';
COMMENT ON TABLE learning_history IS 'Training and learning progress tracking for ML models';
COMMENT ON TABLE schedule_simulations IS 'Simulation results for schedule validation and optimization';
