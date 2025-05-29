-- ML Workflow Database Migrations
-- Creates tables to support learning capabilities for scheduling agents

-- Historical schedules table - if not already exists
CREATE TABLE IF NOT EXISTS historical_schedules (
  id SERIAL PRIMARY KEY,
  sport_type VARCHAR(50) NOT NULL,
  season INT NOT NULL,
  algorithm VARCHAR(50) NOT NULL,
  schedule_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule metrics table - if not already exists
CREATE TABLE IF NOT EXISTS schedule_metrics (
  id SERIAL PRIMARY KEY,
  schedule_id INT REFERENCES historical_schedules(id) ON DELETE CASCADE,
  quality_score FLOAT,
  travel_efficiency FLOAT,
  home_away_balance FLOAT,
  rivalry_satisfaction FLOAT,
  constraint_compliance FLOAT,
  user_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule features for ML analysis
CREATE TABLE IF NOT EXISTS schedule_features (
  id SERIAL PRIMARY KEY,
  schedule_id INT UNIQUE NOT NULL REFERENCES historical_schedules(id) ON DELETE CASCADE,
  feature_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned patterns from historical analysis
CREATE TABLE IF NOT EXISTS learned_patterns (
  id SERIAL PRIMARY KEY,
  sport_type VARCHAR(50) NOT NULL,
  pattern_type VARCHAR(50) NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence FLOAT DEFAULT 0.0,
  discovery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent memory for continuous learning
CREATE TABLE IF NOT EXISTS agent_memories (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(100) NOT NULL,
  sport_type VARCHAR(50) NOT NULL,
  memory_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  relevance_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- Learning history for tracking progress
CREATE TABLE IF NOT EXISTS learning_history (
  id SERIAL PRIMARY KEY,
  sport_type VARCHAR(50) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  learning_phase VARCHAR(50) NOT NULL,
  parameters JSONB,
  results JSONB,
  duration_seconds INT,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule simulation results for validation
CREATE TABLE IF NOT EXISTS schedule_simulations (
  id SERIAL PRIMARY KEY,
  sport_type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL,
  results JSONB NOT NULL,
  evaluation_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS historical_schedules_sport_idx ON historical_schedules(sport_type);
CREATE INDEX IF NOT EXISTS schedule_metrics_schedule_idx ON schedule_metrics(schedule_id);
CREATE INDEX IF NOT EXISTS schedule_features_schedule_idx ON schedule_features(schedule_id);
CREATE INDEX IF NOT EXISTS learned_patterns_sport_idx ON learned_patterns(sport_type);
CREATE INDEX IF NOT EXISTS agent_memories_agent_idx ON agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS agent_memories_sport_idx ON agent_memories(sport_type);
CREATE INDEX IF NOT EXISTS agent_memories_type_idx ON agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS learning_history_sport_idx ON learning_history(sport_type);
CREATE INDEX IF NOT EXISTS schedule_simulations_sport_idx ON schedule_simulations(sport_type);
