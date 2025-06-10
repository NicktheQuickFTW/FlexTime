-- FlexTime Constraints V2 Database Schema
-- Migration: 001_create_constraint_tables.sql
-- Description: Create core constraint tables for v2 constraint system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS constraint_evaluations CASCADE;
DROP TABLE IF EXISTS constraint_conflicts CASCADE;
DROP TABLE IF EXISTS constraint_resolutions CASCADE;
DROP TABLE IF EXISTS constraint_templates CASCADE;
DROP TABLE IF EXISTS constraint_instances CASCADE;
DROP TABLE IF EXISTS constraint_categories CASCADE;
DROP TABLE IF EXISTS constraint_cache CASCADE;
DROP TABLE IF EXISTS constraint_metrics CASCADE;

-- Constraint Categories (for organizing constraints)
CREATE TABLE constraint_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES constraint_categories(category_id),
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constraint Templates (reusable constraint definitions)
CREATE TABLE constraint_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES constraint_categories(category_id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('hard', 'soft', 'preference')),
    sport VARCHAR(50), -- NULL means applicable to all sports
    
    -- Template parameters schema (JSON Schema format)
    parameter_schema JSONB NOT NULL DEFAULT '{}',
    
    -- Default values for parameters
    default_parameters JSONB DEFAULT '{}',
    
    -- Evaluation logic type
    evaluation_type VARCHAR(50) NOT NULL CHECK (evaluation_type IN ('simple', 'complex', 'ml_based', 'custom')),
    
    -- For custom evaluation, store the function name or expression
    evaluation_logic TEXT,
    
    -- ML model reference if ML-based
    ml_model_id VARCHAR(100),
    ml_model_version VARCHAR(20),
    
    -- Template metadata
    tags TEXT[],
    is_system_template BOOLEAN DEFAULT false, -- System templates cannot be modified by users
    is_active BOOLEAN DEFAULT true,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES constraint_templates(template_id),
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constraint Instances (actual constraints applied to schedules)
CREATE TABLE constraint_instances (
    instance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES constraint_templates(template_id),
    schedule_id INTEGER, -- References schedules table
    
    -- Instance-specific parameters
    parameters JSONB NOT NULL DEFAULT '{}',
    
    -- Weight/priority for this instance
    weight DECIMAL(5,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 100),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Scope definition
    scope_type VARCHAR(20) CHECK (scope_type IN ('global', 'sport', 'team', 'venue', 'date_range')),
    scope_data JSONB, -- Contains sport_id, team_ids, venue_ids, date ranges, etc.
    
    -- State management
    is_active BOOLEAN DEFAULT true,
    is_overridden BOOLEAN DEFAULT false,
    override_reason TEXT,
    
    -- Temporal validity
    valid_from DATE,
    valid_until DATE,
    
    -- Applied by user or system
    applied_by VARCHAR(100),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constraint Evaluations (results of constraint checks)
CREATE TABLE constraint_evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES constraint_instances(instance_id),
    schedule_id INTEGER NOT NULL,
    game_id INTEGER, -- Can be NULL for schedule-level constraints
    
    -- Evaluation results
    is_satisfied BOOLEAN NOT NULL,
    satisfaction_score DECIMAL(5,4) CHECK (satisfaction_score >= 0 AND satisfaction_score <= 1),
    
    -- Detailed evaluation data
    evaluation_data JSONB DEFAULT '{}',
    
    -- Performance metrics
    evaluation_time_ms INTEGER,
    memory_usage_kb INTEGER,
    
    -- Context at evaluation time
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    evaluation_context JSONB DEFAULT '{}', -- Stores relevant context like season, weather, etc.
    
    -- For tracking evaluation history
    evaluation_version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT true
);

-- Constraint Conflicts (detected conflicts between constraints)
CREATE TABLE constraint_conflicts (
    conflict_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id INTEGER NOT NULL,
    
    -- Conflicting constraints
    constraint_1_id UUID REFERENCES constraint_instances(instance_id),
    constraint_2_id UUID REFERENCES constraint_instances(instance_id),
    
    -- Conflict details
    conflict_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Detailed conflict analysis
    conflict_data JSONB DEFAULT '{}',
    affected_games INTEGER[],
    
    -- Resolution status
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'analyzing', 'resolved', 'ignored', 'escalated')),
    
    -- ML-based conflict prediction
    predicted_impact_score DECIMAL(5,4),
    confidence_score DECIMAL(5,4),
    
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- For grouping related conflicts
    conflict_group_id UUID,
    is_root_conflict BOOLEAN DEFAULT false
);

-- Constraint Resolutions (how conflicts were resolved)
CREATE TABLE constraint_resolutions (
    resolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_id UUID REFERENCES constraint_conflicts(conflict_id),
    
    -- Resolution approach
    resolution_type VARCHAR(50) NOT NULL,
    resolution_strategy VARCHAR(100),
    
    -- Which constraint "won" or how they were balanced
    winning_constraint_id UUID REFERENCES constraint_instances(instance_id),
    
    -- Detailed resolution data
    resolution_data JSONB DEFAULT '{}',
    
    -- Changes made to resolve
    schedule_changes JSONB DEFAULT '{}',
    games_affected INTEGER[],
    
    -- Resolution quality metrics
    quality_score DECIMAL(5,4),
    stakeholder_satisfaction JSONB DEFAULT '{}', -- Satisfaction scores by stakeholder type
    
    -- Resolution metadata
    resolved_by VARCHAR(100), -- User or 'system'
    resolution_notes TEXT,
    
    -- For ML training
    was_successful BOOLEAN,
    feedback_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP WITH TIME ZONE
);

-- Constraint Cache (for performance optimization)
CREATE TABLE constraint_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_type VARCHAR(50) NOT NULL,
    
    -- Cached data
    cached_value JSONB NOT NULL,
    
    -- Cache metadata
    computation_time_ms INTEGER,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP WITH TIME ZONE,
    
    -- TTL management
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_stale BOOLEAN DEFAULT false,
    
    -- Dependencies for cache invalidation
    depends_on_constraints UUID[], -- constraint instance IDs
    depends_on_games INTEGER[],
    depends_on_teams INTEGER[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constraint Metrics (for monitoring and optimization)
CREATE TABLE constraint_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What we're measuring
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    
    -- Aggregation period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metric values
    value DECIMAL(15,4) NOT NULL,
    count INTEGER DEFAULT 1,
    
    -- Dimensions for slicing
    dimensions JSONB DEFAULT '{}',
    
    -- Related entities
    constraint_id UUID REFERENCES constraint_instances(instance_id),
    template_id UUID REFERENCES constraint_templates(template_id),
    schedule_id INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_constraint_instances_schedule ON constraint_instances(schedule_id);
CREATE INDEX idx_constraint_instances_template ON constraint_instances(template_id);
CREATE INDEX idx_constraint_instances_scope ON constraint_instances(scope_type, scope_data);
CREATE INDEX idx_constraint_instances_temporal ON constraint_instances(valid_from, valid_until);

CREATE INDEX idx_constraint_evaluations_instance ON constraint_evaluations(instance_id);
CREATE INDEX idx_constraint_evaluations_schedule ON constraint_evaluations(schedule_id);
CREATE INDEX idx_constraint_evaluations_latest ON constraint_evaluations(is_latest) WHERE is_latest = true;
CREATE INDEX idx_constraint_evaluations_satisfaction ON constraint_evaluations(is_satisfied, satisfaction_score);

CREATE INDEX idx_constraint_conflicts_schedule ON constraint_conflicts(schedule_id);
CREATE INDEX idx_constraint_conflicts_status ON constraint_conflicts(status);
CREATE INDEX idx_constraint_conflicts_severity ON constraint_conflicts(severity);
CREATE INDEX idx_constraint_conflicts_group ON constraint_conflicts(conflict_group_id);

CREATE INDEX idx_constraint_resolutions_conflict ON constraint_resolutions(conflict_id);
CREATE INDEX idx_constraint_resolutions_type ON constraint_resolutions(resolution_type);

CREATE INDEX idx_constraint_cache_expires ON constraint_cache(expires_at);
CREATE INDEX idx_constraint_cache_type ON constraint_cache(cache_type);

CREATE INDEX idx_constraint_metrics_type_period ON constraint_metrics(metric_type, period_start, period_end);
CREATE INDEX idx_constraint_metrics_constraint ON constraint_metrics(constraint_id);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_constraint_templates_params_gin ON constraint_templates USING GIN (parameter_schema);
CREATE INDEX idx_constraint_instances_params_gin ON constraint_instances USING GIN (parameters);
CREATE INDEX idx_constraint_instances_scope_gin ON constraint_instances USING GIN (scope_data);
CREATE INDEX idx_constraint_evaluations_data_gin ON constraint_evaluations USING GIN (evaluation_data);
CREATE INDEX idx_constraint_conflicts_data_gin ON constraint_conflicts USING GIN (conflict_data);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_constraint_categories_updated_at BEFORE UPDATE ON constraint_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraint_templates_updated_at BEFORE UPDATE ON constraint_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraint_instances_updated_at BEFORE UPDATE ON constraint_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraint_cache_updated_at BEFORE UPDATE ON constraint_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE constraint_categories IS 'Hierarchical categorization of constraints for organization';
COMMENT ON TABLE constraint_templates IS 'Reusable constraint definitions with parameterized logic';
COMMENT ON TABLE constraint_instances IS 'Actual constraints applied to specific schedules';
COMMENT ON TABLE constraint_evaluations IS 'Results of constraint satisfaction checks';
COMMENT ON TABLE constraint_conflicts IS 'Detected conflicts between multiple constraints';
COMMENT ON TABLE constraint_resolutions IS 'How constraint conflicts were resolved';
COMMENT ON TABLE constraint_cache IS 'Performance cache for expensive constraint computations';
COMMENT ON TABLE constraint_metrics IS 'Metrics for monitoring constraint system performance';