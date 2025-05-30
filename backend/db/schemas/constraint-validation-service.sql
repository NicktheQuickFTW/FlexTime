-- FlexTime Microservices Migration
-- Constraint Validation Service Database Schema
-- PostgreSQL 13+ compatible

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS constraint_violation_logs CASCADE;
DROP TABLE IF EXISTS constraint_resolution_strategies CASCADE;
DROP TABLE IF EXISTS constraint_dependencies CASCADE;
DROP TABLE IF EXISTS constraint_validation_rules CASCADE;
DROP TABLE IF EXISTS constraint_enforcement_policies CASCADE;
DROP TABLE IF EXISTS schedule_constraint_evaluations CASCADE;
DROP TABLE IF EXISTS constraint_templates CASCADE;
DROP TABLE IF EXISTS constraint_categories CASCADE;
DROP TABLE IF EXISTS constraint_profiles CASCADE;
DROP TABLE IF EXISTS schedules_constraints_view CASCADE;

-- Create materialized view for schedule-constraint relationships (denormalized for microservice boundary)
CREATE MATERIALIZED VIEW schedules_constraints_view AS
SELECT 
    sc.constraint_id,
    sc.schedule_id,
    sc.name AS constraint_name,
    sc.description AS constraint_description,
    sc.type AS constraint_type,
    sc.category AS constraint_category,
    sc.parameters,
    sc.weight,
    sc.is_active,
    sc.created_at,
    sc.updated_at,
    s.name AS schedule_name,
    s.sport_id,
    s.season_id,
    s.year AS schedule_year,
    s.start_date AS schedule_start_date,
    s.end_date AS schedule_end_date,
    s.status AS schedule_status
FROM schedule_constraints sc
JOIN schedules s ON sc.schedule_id = s.schedule_id
WHERE sc.is_active = TRUE;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_schedules_constraints_constraint_id ON schedules_constraints_view(constraint_id);
CREATE INDEX idx_schedules_constraints_schedule_id ON schedules_constraints_view(schedule_id);
CREATE INDEX idx_schedules_constraints_type ON schedules_constraints_view(constraint_type);
CREATE INDEX idx_schedules_constraints_category ON schedules_constraints_view(constraint_category);

-- 1. Constraint Categories - Organize constraints by type and domain
CREATE TABLE constraint_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    parent_category_id INTEGER REFERENCES constraint_categories(category_id),
    
    -- Category definition
    description TEXT,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('global', 'conference', 'sport', 'team', 'venue')),
    domain VARCHAR(20) NOT NULL CHECK (domain IN ('travel', 'rest', 'venue', 'broadcast', 'competitive', 'academic', 'custom')),
    
    -- Validation characteristics
    validation_complexity INTEGER DEFAULT 3 CHECK (validation_complexity BETWEEN 1 AND 5),
    typical_computation_time_ms INTEGER DEFAULT 100,
    requires_external_data BOOLEAN DEFAULT FALSE,
    cacheable_results BOOLEAN DEFAULT TRUE,
    
    -- Enforcement properties
    default_severity VARCHAR(15) DEFAULT 'soft' CHECK (default_severity IN ('hard', 'soft', 'advisory')),
    default_weight DECIMAL(4,2) DEFAULT 1.0 CHECK (default_weight BETWEEN 0.0 AND 10.0),
    supports_partial_violations BOOLEAN DEFAULT FALSE,
    
    -- Business rules
    business_priority INTEGER DEFAULT 3 CHECK (business_priority BETWEEN 1 AND 5),
    regulatory_compliance BOOLEAN DEFAULT FALSE,
    conference_mandated BOOLEAN DEFAULT FALSE,
    
    -- System integration
    validation_engine VARCHAR(30) DEFAULT 'built_in' CHECK (validation_engine IN ('built_in', 'external_api', 'rule_engine', 'ml_model')),
    external_service_endpoint VARCHAR(255),
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Constraint Templates - Reusable constraint definitions
CREATE TABLE constraint_templates (
    template_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES constraint_categories(category_id),
    
    -- Template identification
    template_name VARCHAR(100) NOT NULL,
    template_code VARCHAR(30) NOT NULL UNIQUE,
    version VARCHAR(10) DEFAULT '1.0',
    
    -- Template definition
    description TEXT NOT NULL,
    validation_logic JSONB NOT NULL, -- Structured validation rules
    -- Example: {"type": "time_constraint", "rules": [{"min_rest_hours": 48, "applies_to": "away_games"}]}
    
    -- Parameter schema
    parameter_schema JSONB NOT NULL, -- JSON Schema for parameters
    default_parameters JSONB DEFAULT '{}',
    required_parameters JSONB DEFAULT '[]',
    
    -- Validation configuration
    validation_function VARCHAR(100), -- Function name for custom validation
    error_message_template TEXT,
    warning_message_template TEXT,
    
    -- Usage metadata
    applicable_sports JSONB DEFAULT '[]', -- Empty = all sports
    applicable_scopes JSONB DEFAULT '[]', -- ["conference", "team", "venue"]
    minimum_data_requirements JSONB DEFAULT '[]',
    
    -- Performance characteristics
    estimated_execution_time_ms INTEGER DEFAULT 50,
    memory_usage_mb INTEGER DEFAULT 1,
    scalability_rating INTEGER DEFAULT 3 CHECK (scalability_rating BETWEEN 1 AND 5),
    
    -- Lifecycle management
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'deprecated', 'archived')),
    superseded_by_template_id INTEGER REFERENCES constraint_templates(template_id),
    deprecation_date DATE,
    
    -- Authoring and maintenance
    created_by_user_id INTEGER,
    last_modified_by_user_id INTEGER,
    review_due_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Constraint Profiles - Constraint sets for different contexts
CREATE TABLE constraint_profiles (
    profile_id SERIAL PRIMARY KEY,
    
    -- Profile identification
    profile_name VARCHAR(100) NOT NULL,
    profile_type VARCHAR(30) NOT NULL CHECK (profile_type IN (
        'sport_default', 'conference_standard', 'venue_specific', 'tournament',
        'regular_season', 'postseason', 'emergency', 'custom'
    )),
    
    -- Scope and applicability
    sport_id INTEGER,
    conference_id INTEGER,
    season_type VARCHAR(20), -- 'regular', 'postseason', 'tournament'
    
    -- Profile configuration
    constraint_set JSONB NOT NULL, -- Array of constraint configurations
    -- Example: [{"template_id": 1, "weight": 2.0, "parameters": {...}}, ...]
    
    -- Enforcement strategy
    enforcement_mode VARCHAR(20) DEFAULT 'balanced' CHECK (enforcement_mode IN (
        'strict', 'balanced', 'flexible', 'advisory_only'
    )),
    global_weight_multiplier DECIMAL(4,2) DEFAULT 1.0,
    hard_constraint_override_allowed BOOLEAN DEFAULT FALSE,
    
    -- Validation behavior
    stop_on_first_violation BOOLEAN DEFAULT FALSE,
    validate_incrementally BOOLEAN DEFAULT TRUE,
    cache_validation_results BOOLEAN DEFAULT TRUE,
    validation_timeout_seconds INTEGER DEFAULT 30,
    
    -- Conflict resolution
    conflict_resolution_strategy VARCHAR(30) DEFAULT 'weighted_priority' CHECK (
        conflict_resolution_strategy IN ('weighted_priority', 'categorical_hierarchy', 'user_defined', 'automated')
    ),
    allows_manual_overrides BOOLEAN DEFAULT TRUE,
    requires_approval_for_overrides BOOLEAN DEFAULT TRUE,
    
    -- Performance and optimization
    optimization_level INTEGER DEFAULT 3 CHECK (optimization_level BETWEEN 1 AND 5),
    parallel_validation_enabled BOOLEAN DEFAULT TRUE,
    
    -- Lifecycle and versioning
    effective_start_date DATE DEFAULT CURRENT_DATE,
    effective_end_date DATE,
    supersedes_profile_id INTEGER REFERENCES constraint_profiles(profile_id),
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Constraint Enforcement Policies - How constraints are enforced
CREATE TABLE constraint_enforcement_policies (
    policy_id SERIAL PRIMARY KEY,
    
    -- Policy identification
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(30) NOT NULL CHECK (policy_type IN (
        'validation_timing', 'violation_handling', 'override_approval', 
        'escalation', 'notification', 'remediation'
    )),
    
    -- Scope and context
    applies_to_constraint_categories JSONB DEFAULT '[]', -- Empty = all categories
    applies_to_severity_levels JSONB DEFAULT '[]', -- Empty = all levels
    applies_to_user_roles JSONB DEFAULT '[]', -- Empty = all roles
    
    -- Policy rules
    policy_rules JSONB NOT NULL, -- Structured policy definition
    -- Example: {"on_violation": "notify_stakeholders", "escalation_after_hours": 24, "auto_resolve": false}
    
    -- Timing and triggers
    trigger_conditions JSONB DEFAULT '[]',
    execution_timing VARCHAR(20) DEFAULT 'immediate' CHECK (execution_timing IN (
        'immediate', 'batch', 'scheduled', 'on_demand'
    )),
    
    -- Enforcement actions
    allowed_actions JSONB DEFAULT '[]', -- ["warn", "block", "escalate", "auto_fix"]
    default_action VARCHAR(20) DEFAULT 'warn',
    requires_human_intervention BOOLEAN DEFAULT FALSE,
    
    -- Escalation and approval
    escalation_chain JSONB DEFAULT '[]', -- Array of role/user escalation path
    auto_escalation_threshold_hours INTEGER DEFAULT 24,
    approval_required_for_overrides BOOLEAN DEFAULT TRUE,
    
    -- Notification and communication
    notification_recipients JSONB DEFAULT '[]',
    notification_channels JSONB DEFAULT '["email"]', -- ["email", "slack", "webhook"]
    notification_templates JSONB DEFAULT '{}',
    
    -- Performance and limits
    max_concurrent_enforcements INTEGER DEFAULT 10,
    enforcement_timeout_seconds INTEGER DEFAULT 60,
    
    -- Audit and compliance
    audit_all_actions BOOLEAN DEFAULT TRUE,
    compliance_reporting_required BOOLEAN DEFAULT FALSE,
    
    active BOOLEAN DEFAULT TRUE,
    effective_start_date DATE DEFAULT CURRENT_DATE,
    effective_end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Constraint Validation Rules - Specific validation implementations
CREATE TABLE constraint_validation_rules (
    rule_id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES constraint_templates(template_id),
    
    -- Rule identification
    rule_name VARCHAR(100) NOT NULL,
    rule_version VARCHAR(10) DEFAULT '1.0',
    
    -- Validation logic
    validation_expression TEXT NOT NULL, -- SQL, JSON Logic, or custom expression
    validation_type VARCHAR(20) NOT NULL CHECK (validation_type IN (
        'sql_query', 'json_logic', 'javascript', 'python', 'custom_function'
    )),
    
    -- Input requirements
    required_data_sources JSONB NOT NULL, -- ["teams", "venues", "schedules", "games"]
    input_parameters JSONB DEFAULT '{}',
    context_variables JSONB DEFAULT '[]',
    
    -- Output specification
    output_format VARCHAR(20) DEFAULT 'boolean' CHECK (output_format IN (
        'boolean', 'score', 'violation_list', 'structured'
    )),
    success_criteria JSONB,
    violation_details_schema JSONB,
    
    -- Performance characteristics
    execution_mode VARCHAR(20) DEFAULT 'synchronous' CHECK (execution_mode IN (
        'synchronous', 'asynchronous', 'batch', 'streaming'
    )),
    max_execution_time_ms INTEGER DEFAULT 5000,
    memory_limit_mb INTEGER DEFAULT 100,
    
    -- Caching and optimization
    cacheable BOOLEAN DEFAULT TRUE,
    cache_ttl_seconds INTEGER DEFAULT 300,
    incremental_validation_supported BOOLEAN DEFAULT FALSE,
    
    -- Error handling
    error_handling_strategy VARCHAR(20) DEFAULT 'fail_safe' CHECK (
        error_handling_strategy IN ('fail_fast', 'fail_safe', 'retry', 'fallback')
    ),
    max_retry_attempts INTEGER DEFAULT 3,
    fallback_rule_id INTEGER REFERENCES constraint_validation_rules(rule_id),
    
    -- Testing and validation
    test_cases JSONB DEFAULT '[]',
    last_tested_date DATE,
    test_success_rate DECIMAL(5,2),
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Schedule Constraint Evaluations - Results of constraint validation
CREATE TABLE schedule_constraint_evaluations (
    evaluation_id SERIAL PRIMARY KEY,
    constraint_id INTEGER NOT NULL, -- References schedules_constraints_view
    schedule_id INTEGER NOT NULL,
    
    -- Evaluation context
    evaluation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    evaluation_trigger VARCHAR(30) NOT NULL CHECK (evaluation_trigger IN (
        'schedule_creation', 'schedule_update', 'game_addition', 'game_modification',
        'periodic_validation', 'manual_request', 'conflict_detection'
    )),
    evaluation_scope VARCHAR(20) DEFAULT 'full' CHECK (evaluation_scope IN ('full', 'incremental', 'targeted')),
    
    -- Evaluation results
    validation_status VARCHAR(20) NOT NULL CHECK (validation_status IN (
        'passed', 'failed', 'warning', 'error', 'skipped'
    )),
    violation_count INTEGER DEFAULT 0,
    violation_severity VARCHAR(15) CHECK (violation_severity IN ('hard', 'soft', 'advisory')),
    
    -- Detailed results
    violation_details JSONB DEFAULT '[]', -- Array of specific violations
    constraint_score DECIMAL(8,4), -- Constraint satisfaction score (0.0 to 1.0)
    penalty_score DECIMAL(8,4) DEFAULT 0, -- Penalty for violations
    
    -- Performance metrics
    execution_time_ms INTEGER,
    memory_used_mb INTEGER,
    data_points_evaluated INTEGER,
    
    -- Resolution tracking
    resolution_required BOOLEAN DEFAULT FALSE,
    resolution_strategies JSONB DEFAULT '[]',
    auto_resolution_attempted BOOLEAN DEFAULT FALSE,
    manual_intervention_required BOOLEAN DEFAULT FALSE,
    
    -- Follow-up actions
    recommendations JSONB DEFAULT '[]',
    escalation_required BOOLEAN DEFAULT FALSE,
    notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Audit and traceability
    evaluation_context JSONB DEFAULT '{}', -- Additional context for the evaluation
    user_id INTEGER, -- User who triggered the evaluation
    source_system VARCHAR(50) DEFAULT 'constraint_service',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Constraint Dependencies - Relationships between constraints
CREATE TABLE constraint_dependencies (
    dependency_id SERIAL PRIMARY KEY,
    
    -- Constraint relationship
    source_constraint_id INTEGER NOT NULL,
    target_constraint_id INTEGER NOT NULL,
    
    -- Dependency type
    dependency_type VARCHAR(30) NOT NULL CHECK (dependency_type IN (
        'prerequisite', 'mutual_exclusive', 'conditional', 'hierarchical',
        'complementary', 'conflicting', 'cascading'
    )),
    
    -- Dependency rules
    dependency_conditions JSONB DEFAULT '{}', -- Conditions under which dependency applies
    dependency_strength VARCHAR(15) DEFAULT 'strong' CHECK (dependency_strength IN ('weak', 'medium', 'strong')),
    
    -- Resolution behavior
    conflict_resolution_rule VARCHAR(30) CHECK (conflict_resolution_rule IN (
        'prioritize_source', 'prioritize_target', 'merge_constraints', 
        'user_decision', 'weighted_average', 'disable_lower_priority'
    )),
    
    -- Validation impact
    affects_validation_order BOOLEAN DEFAULT FALSE,
    validation_order_priority INTEGER,
    cascade_validation_failures BOOLEAN DEFAULT FALSE,
    
    -- Lifecycle
    effective_start_date DATE DEFAULT CURRENT_DATE,
    effective_end_date DATE,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT no_self_dependency CHECK (source_constraint_id != target_constraint_id)
);

-- 8. Constraint Resolution Strategies - Automated resolution approaches
CREATE TABLE constraint_resolution_strategies (
    strategy_id SERIAL PRIMARY KEY,
    
    -- Strategy identification
    strategy_name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(30) NOT NULL CHECK (strategy_type IN (
        'schedule_adjustment', 'constraint_relaxation', 'alternative_assignment',
        'time_shifting', 'venue_substitution', 'game_rescheduling', 'manual_override'
    )),
    
    -- Applicability
    applicable_constraint_categories JSONB DEFAULT '[]',
    applicable_violation_types JSONB DEFAULT '[]',
    minimum_violation_severity VARCHAR(15) DEFAULT 'soft',
    
    -- Strategy definition
    resolution_algorithm JSONB NOT NULL, -- Structured algorithm definition
    parameters JSONB DEFAULT '{}',
    success_criteria JSONB NOT NULL,
    
    -- Execution characteristics
    execution_mode VARCHAR(20) DEFAULT 'automatic' CHECK (execution_mode IN (
        'automatic', 'semi_automatic', 'manual', 'advisory'
    )),
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_roles JSONB DEFAULT '[]',
    
    -- Performance and constraints
    max_execution_time_seconds INTEGER DEFAULT 300,
    max_iterations INTEGER DEFAULT 100,
    convergence_threshold DECIMAL(6,4) DEFAULT 0.001,
    
    -- Success metrics
    historical_success_rate DECIMAL(5,2),
    average_execution_time_seconds DECIMAL(8,2),
    user_satisfaction_rating DECIMAL(3,2),
    
    -- Cost and impact
    computational_cost_rating INTEGER DEFAULT 3 CHECK (computational_cost_rating BETWEEN 1 AND 5),
    schedule_disruption_level VARCHAR(15) DEFAULT 'minimal' CHECK (
        schedule_disruption_level IN ('minimal', 'moderate', 'significant', 'major')
    ),
    stakeholder_impact_assessment JSONB DEFAULT '{}',
    
    -- Learning and adaptation
    machine_learning_enabled BOOLEAN DEFAULT FALSE,
    learns_from_outcomes BOOLEAN DEFAULT FALSE,
    adaptation_frequency VARCHAR(20) DEFAULT 'monthly',
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Constraint Violation Logs - Historical record of violations and resolutions
CREATE TABLE constraint_violation_logs (
    log_id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL REFERENCES schedule_constraint_evaluations(evaluation_id),
    
    -- Violation details
    violation_type VARCHAR(50) NOT NULL,
    violation_description TEXT NOT NULL,
    violation_severity VARCHAR(15) NOT NULL CHECK (violation_severity IN ('hard', 'soft', 'advisory')),
    
    -- Context information
    affected_entities JSONB NOT NULL, -- {"games": [1,2,3], "teams": [4,5], "venues": [6]}
    violation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    detection_method VARCHAR(30) DEFAULT 'automated',
    
    -- Resolution tracking
    resolution_attempted BOOLEAN DEFAULT FALSE,
    resolution_strategy_id INTEGER REFERENCES constraint_resolution_strategies(strategy_id),
    resolution_status VARCHAR(20) DEFAULT 'unresolved' CHECK (
        resolution_status IN ('unresolved', 'in_progress', 'resolved', 'accepted', 'overridden')
    ),
    resolution_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Resolution details
    resolution_description TEXT,
    resolution_success BOOLEAN,
    resolution_duration_seconds INTEGER,
    manual_intervention_required BOOLEAN DEFAULT FALSE,
    
    -- Impact assessment
    business_impact_level VARCHAR(15) DEFAULT 'low' CHECK (
        business_impact_level IN ('low', 'medium', 'high', 'critical')
    ),
    financial_impact_estimate DECIMAL(10,2),
    stakeholder_impact_description TEXT,
    
    -- Override and approval
    overridden_by_user_id INTEGER,
    override_reason TEXT,
    override_timestamp TIMESTAMP WITH TIME ZONE,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by_user_id INTEGER,
    approval_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Learning and improvement
    contributed_to_rule_learning BOOLEAN DEFAULT FALSE,
    feedback_provided BOOLEAN DEFAULT FALSE,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
    
    -- Follow-up actions
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_due_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance Optimization

-- Constraint Categories
CREATE INDEX idx_constraint_categories_code ON constraint_categories(category_code);
CREATE INDEX idx_constraint_categories_scope ON constraint_categories(scope);
CREATE INDEX idx_constraint_categories_domain ON constraint_categories(domain);
CREATE INDEX idx_constraint_categories_active ON constraint_categories(active);

-- Constraint Templates
CREATE INDEX idx_constraint_templates_category ON constraint_templates(category_id);
CREATE INDEX idx_constraint_templates_code ON constraint_templates(template_code);
CREATE INDEX idx_constraint_templates_status ON constraint_templates(status);
CREATE INDEX idx_constraint_templates_sports ON constraint_templates USING GIN(applicable_sports);

-- Constraint Profiles
CREATE INDEX idx_constraint_profiles_type ON constraint_profiles(profile_type);
CREATE INDEX idx_constraint_profiles_sport ON constraint_profiles(sport_id);
CREATE INDEX idx_constraint_profiles_effective ON constraint_profiles(effective_start_date, effective_end_date);
CREATE INDEX idx_constraint_profiles_active ON constraint_profiles(active);

-- Constraint Enforcement Policies
CREATE INDEX idx_constraint_enforcement_policies_type ON constraint_enforcement_policies(policy_type);
CREATE INDEX idx_constraint_enforcement_policies_active ON constraint_enforcement_policies(active);
CREATE INDEX idx_constraint_enforcement_policies_effective ON constraint_enforcement_policies(effective_start_date, effective_end_date);

-- Constraint Validation Rules
CREATE INDEX idx_constraint_validation_rules_template ON constraint_validation_rules(template_id);
CREATE INDEX idx_constraint_validation_rules_type ON constraint_validation_rules(validation_type);
CREATE INDEX idx_constraint_validation_rules_active ON constraint_validation_rules(active);

-- Schedule Constraint Evaluations
CREATE INDEX idx_schedule_constraint_evaluations_constraint ON schedule_constraint_evaluations(constraint_id);
CREATE INDEX idx_schedule_constraint_evaluations_schedule ON schedule_constraint_evaluations(schedule_id);
CREATE INDEX idx_schedule_constraint_evaluations_timestamp ON schedule_constraint_evaluations(evaluation_timestamp);
CREATE INDEX idx_schedule_constraint_evaluations_status ON schedule_constraint_evaluations(validation_status);
CREATE INDEX idx_schedule_constraint_evaluations_trigger ON schedule_constraint_evaluations(evaluation_trigger);

-- Constraint Dependencies
CREATE INDEX idx_constraint_dependencies_source ON constraint_dependencies(source_constraint_id);
CREATE INDEX idx_constraint_dependencies_target ON constraint_dependencies(target_constraint_id);
CREATE INDEX idx_constraint_dependencies_type ON constraint_dependencies(dependency_type);
CREATE INDEX idx_constraint_dependencies_active ON constraint_dependencies(active);

-- Constraint Resolution Strategies
CREATE INDEX idx_constraint_resolution_strategies_type ON constraint_resolution_strategies(strategy_type);
CREATE INDEX idx_constraint_resolution_strategies_categories ON constraint_resolution_strategies USING GIN(applicable_constraint_categories);
CREATE INDEX idx_constraint_resolution_strategies_active ON constraint_resolution_strategies(active);

-- Constraint Violation Logs
CREATE INDEX idx_constraint_violation_logs_evaluation ON constraint_violation_logs(evaluation_id);
CREATE INDEX idx_constraint_violation_logs_timestamp ON constraint_violation_logs(violation_timestamp);
CREATE INDEX idx_constraint_violation_logs_severity ON constraint_violation_logs(violation_severity);
CREATE INDEX idx_constraint_violation_logs_status ON constraint_violation_logs(resolution_status);
CREATE INDEX idx_constraint_violation_logs_strategy ON constraint_violation_logs(resolution_strategy_id);

-- Functions and Triggers

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_constraint_validation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_constraint_categories_updated_at 
    BEFORE UPDATE ON constraint_categories
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

CREATE TRIGGER update_constraint_templates_updated_at 
    BEFORE UPDATE ON constraint_templates
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

CREATE TRIGGER update_constraint_profiles_updated_at 
    BEFORE UPDATE ON constraint_profiles
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

CREATE TRIGGER update_constraint_enforcement_policies_updated_at 
    BEFORE UPDATE ON constraint_enforcement_policies
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

CREATE TRIGGER update_constraint_validation_rules_updated_at 
    BEFORE UPDATE ON constraint_validation_rules
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

CREATE TRIGGER update_constraint_dependencies_updated_at 
    BEFORE UPDATE ON constraint_dependencies
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

CREATE TRIGGER update_constraint_resolution_strategies_updated_at 
    BEFORE UPDATE ON constraint_resolution_strategies
    FOR EACH ROW EXECUTE FUNCTION update_constraint_validation_updated_at();

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_schedules_constraints_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY schedules_constraints_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Views for Common Queries

-- View: Active Constraint Summary
CREATE VIEW active_constraint_summary AS
SELECT 
    cc.category_name,
    cc.domain,
    COUNT(ct.template_id) AS available_templates,
    COUNT(scv.constraint_id) AS active_constraints,
    AVG(sce.constraint_score) AS average_satisfaction_score,
    COUNT(CASE WHEN sce.validation_status = 'failed' THEN 1 END) AS failed_validations
FROM constraint_categories cc
LEFT JOIN constraint_templates ct ON cc.category_id = ct.category_id AND ct.status = 'active'
LEFT JOIN schedules_constraints_view scv ON scv.constraint_category = cc.category_name
LEFT JOIN schedule_constraint_evaluations sce ON scv.constraint_id = sce.constraint_id
    AND sce.evaluation_timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
WHERE cc.active = TRUE
GROUP BY cc.category_id, cc.category_name, cc.domain;

-- View: Recent Constraint Violations
CREATE VIEW recent_constraint_violations AS
SELECT 
    cvl.log_id,
    cvl.violation_type,
    cvl.violation_description,
    cvl.violation_severity,
    cvl.violation_timestamp,
    cvl.resolution_status,
    cvl.business_impact_level,
    sce.schedule_id,
    scv.constraint_name,
    scv.constraint_category
FROM constraint_violation_logs cvl
JOIN schedule_constraint_evaluations sce ON cvl.evaluation_id = sce.evaluation_id
JOIN schedules_constraints_view scv ON sce.constraint_id = scv.constraint_id
WHERE cvl.violation_timestamp >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY cvl.violation_timestamp DESC;

-- View: Constraint Performance Metrics
CREATE VIEW constraint_performance_metrics AS
SELECT 
    scv.constraint_id,
    scv.constraint_name,
    scv.constraint_category,
    COUNT(sce.evaluation_id) AS total_evaluations,
    COUNT(CASE WHEN sce.validation_status = 'passed' THEN 1 END) AS passed_evaluations,
    COUNT(CASE WHEN sce.validation_status = 'failed' THEN 1 END) AS failed_evaluations,
    ROUND(AVG(sce.execution_time_ms), 2) AS avg_execution_time_ms,
    ROUND(AVG(sce.constraint_score), 4) AS avg_constraint_score,
    MAX(sce.evaluation_timestamp) AS last_evaluated
FROM schedules_constraints_view scv
LEFT JOIN schedule_constraint_evaluations sce ON scv.constraint_id = sce.constraint_id
    AND sce.evaluation_timestamp >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY scv.constraint_id, scv.constraint_name, scv.constraint_category;

-- Comments for Documentation
COMMENT ON TABLE constraint_categories IS 'Hierarchical organization of constraint types and domains';
COMMENT ON TABLE constraint_templates IS 'Reusable constraint definitions with parameterized validation logic';
COMMENT ON TABLE constraint_profiles IS 'Named sets of constraints for different scheduling contexts';
COMMENT ON TABLE constraint_enforcement_policies IS 'Policies governing how constraints are enforced and violations handled';
COMMENT ON TABLE constraint_validation_rules IS 'Specific validation implementations for constraint templates';
COMMENT ON TABLE schedule_constraint_evaluations IS 'Results and history of constraint validation executions';
COMMENT ON TABLE constraint_dependencies IS 'Relationships and dependencies between different constraints';
COMMENT ON TABLE constraint_resolution_strategies IS 'Automated approaches for resolving constraint violations';
COMMENT ON TABLE constraint_violation_logs IS 'Detailed logs of constraint violations and their resolutions';

COMMENT ON MATERIALIZED VIEW schedules_constraints_view IS 'Denormalized view of schedule-constraint relationships for microservice boundary isolation';

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE constraint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_enforcement_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_constraint_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_resolution_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_violation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be customized based on authentication system)
CREATE POLICY constraint_categories_policy ON constraint_categories
    FOR ALL USING (true); -- Categories are generally public

CREATE POLICY constraint_templates_policy ON constraint_templates
    FOR ALL USING (true); -- Templates are generally public

CREATE POLICY constraint_profiles_policy ON constraint_profiles
    FOR ALL USING (
        sport_id IS NULL OR 
        sport_id IN (SELECT sport_id FROM user_sport_access WHERE user_id = current_setting('app.current_user_id')::int)
    );

CREATE POLICY schedule_constraint_evaluations_policy ON schedule_constraint_evaluations
    FOR ALL USING (
        schedule_id IN (SELECT schedule_id FROM user_schedule_access WHERE user_id = current_setting('app.current_user_id')::int)
    );