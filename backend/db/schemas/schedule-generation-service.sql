-- FlexTime Microservices Migration
-- Schedule Generation Service Database Schema
-- PostgreSQL 13+ compatible

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS schedule_optimization_metrics CASCADE;
DROP TABLE IF EXISTS schedule_generation_jobs CASCADE;
DROP TABLE IF EXISTS schedule_algorithms_performance CASCADE;
DROP TABLE IF EXISTS schedule_templates CASCADE;
DROP TABLE IF EXISTS schedule_generation_parameters CASCADE;
DROP TABLE IF EXISTS schedule_versions CASCADE;
DROP TABLE IF EXISTS schedule_comparison_results CASCADE;
DROP TABLE IF EXISTS algorithm_configurations CASCADE;
DROP TABLE IF EXISTS optimization_objectives CASCADE;
DROP TABLE IF EXISTS schedule_generation_requests CASCADE;
DROP TABLE IF EXISTS schedules_games_view CASCADE;

-- Create materialized view for schedule-game relationships (denormalized for microservice boundary)
CREATE MATERIALIZED VIEW schedules_games_view AS
SELECT 
    s.schedule_id,
    s.name AS schedule_name,
    s.sport_id,
    s.season_id,
    s.year AS schedule_year,
    s.start_date AS schedule_start_date,
    s.end_date AS schedule_end_date,
    s.status AS schedule_status,
    s.metadata AS schedule_metadata,
    g.game_id,
    g.home_team_id,
    g.away_team_id,
    g.venue_id,
    g.game_datetime,
    g.game_type,
    g.status AS game_status,
    g.metadata AS game_metadata,
    ht.name AS home_team_name,
    at.name AS away_team_name,
    v.name AS venue_name
FROM schedules s
LEFT JOIN games g ON s.schedule_id = g.schedule_id
LEFT JOIN teams ht ON g.home_team_id = ht.team_id
LEFT JOIN teams at ON g.away_team_id = at.team_id
LEFT JOIN venues v ON g.venue_id = v.venue_id;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_schedules_games_schedule_game ON schedules_games_view(schedule_id, game_id) WHERE game_id IS NOT NULL;
CREATE INDEX idx_schedules_games_schedule_id ON schedules_games_view(schedule_id);
CREATE INDEX idx_schedules_games_sport_season ON schedules_games_view(sport_id, season_id);
CREATE INDEX idx_schedules_games_datetime ON schedules_games_view(game_datetime);

-- 1. Schedule Generation Requests - Requests for new schedule generation
CREATE TABLE schedule_generation_requests (
    request_id SERIAL PRIMARY KEY,
    
    -- Request identification
    request_name VARCHAR(100) NOT NULL,
    request_type VARCHAR(30) NOT NULL CHECK (request_type IN (
        'new_schedule', 'schedule_update', 'reschedule', 'optimization', 
        'conflict_resolution', 'alternative_generation', 'tournament_bracket'
    )),
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    
    -- Requester information
    requested_by_user_id INTEGER NOT NULL,
    requested_by_role VARCHAR(50),
    organization_id INTEGER,
    
    -- Schedule context
    sport_id INTEGER NOT NULL,
    season_id INTEGER,
    conference_id INTEGER,
    division_id INTEGER,
    
    -- Generation parameters
    generation_parameters JSONB NOT NULL DEFAULT '{}',
    -- Example: {"algorithm": "simulated_annealing", "max_iterations": 10000, "objectives": ["minimize_travel", "balance_home_away"]}
    
    -- Constraints and requirements
    constraint_profile_id INTEGER,
    custom_constraints JSONB DEFAULT '[]',
    hard_requirements JSONB DEFAULT '[]',
    soft_preferences JSONB DEFAULT '[]',
    
    -- Teams and participants
    included_teams JSONB NOT NULL, -- Array of team IDs
    excluded_teams JSONB DEFAULT '[]',
    team_groupings JSONB DEFAULT '{}', -- {"divisions": [...], "conferences": [...]}
    
    -- Temporal scope
    schedule_start_date DATE NOT NULL,
    schedule_end_date DATE NOT NULL,
    blackout_periods JSONB DEFAULT '[]',
    preferred_time_windows JSONB DEFAULT '[]',
    
    -- Venues and locations
    available_venues JSONB DEFAULT '[]',
    venue_preferences JSONB DEFAULT '{}',
    neutral_site_requirements JSONB DEFAULT '[]',
    
    -- Game requirements
    total_games_required INTEGER,
    conference_games_required INTEGER DEFAULT 0,
    non_conference_games_required INTEGER DEFAULT 0,
    home_away_balance_target DECIMAL(3,2) DEFAULT 0.50,
    
    -- Optimization objectives
    primary_objectives JSONB DEFAULT '[]', -- ["minimize_travel_cost", "maximize_tv_windows"]
    objective_weights JSONB DEFAULT '{}',
    optimization_timeout_minutes INTEGER DEFAULT 60,
    
    -- Quality and acceptance criteria
    minimum_quality_score DECIMAL(5,2) DEFAULT 70.0,
    acceptable_quality_threshold DECIMAL(5,2) DEFAULT 80.0,
    target_quality_score DECIMAL(5,2) DEFAULT 90.0,
    
    -- Output and delivery
    output_formats JSONB DEFAULT '["database", "csv", "ics"]',
    notification_preferences JSONB DEFAULT '{}',
    auto_publish_if_acceptable BOOLEAN DEFAULT FALSE,
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'queued', 'in_progress', 'completed', 'failed', 
        'cancelled', 'on_hold', 'requires_review'
    )),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results and outputs
    generated_schedule_ids JSONB DEFAULT '[]',
    generation_summary JSONB DEFAULT '{}',
    quality_metrics JSONB DEFAULT '{}',
    
    -- Error handling and issues
    error_messages JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    manual_intervention_required BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Optimization Objectives - Defined objectives for schedule optimization
CREATE TABLE optimization_objectives (
    objective_id SERIAL PRIMARY KEY,
    
    -- Objective identification
    objective_name VARCHAR(100) NOT NULL UNIQUE,
    objective_code VARCHAR(30) NOT NULL UNIQUE,
    objective_category VARCHAR(30) NOT NULL CHECK (objective_category IN (
        'travel_optimization', 'venue_utilization', 'competitive_balance',
        'broadcast_optimization', 'fan_experience', 'cost_minimization',
        'academic_accommodation', 'fairness', 'tradition_preservation'
    )),
    
    -- Objective definition
    description TEXT NOT NULL,
    calculation_method JSONB NOT NULL, -- Structured definition of how to calculate
    -- Example: {"type": "minimize", "formula": "sum(travel_distances)", "weights": {...}}
    
    -- Measurement and scaling
    measurement_unit VARCHAR(30), -- 'miles', 'dollars', 'hours', 'score', 'percentage'
    scale_type VARCHAR(20) DEFAULT 'linear' CHECK (scale_type IN ('linear', 'logarithmic', 'exponential', 'custom')),
    normalization_method VARCHAR(20) DEFAULT 'min_max' CHECK (normalization_method IN ('min_max', 'z_score', 'robust', 'none')),
    
    -- Optimization characteristics
    optimization_direction VARCHAR(10) NOT NULL CHECK (optimization_direction IN ('minimize', 'maximize', 'target')),
    target_value DECIMAL(12,4), -- For target-based objectives
    acceptable_range JSONB, -- {"min": value, "max": value}
    
    -- Implementation details
    calculation_complexity INTEGER DEFAULT 3 CHECK (calculation_complexity BETWEEN 1 AND 5),
    requires_external_data BOOLEAN DEFAULT FALSE,
    external_data_sources JSONB DEFAULT '[]',
    calculation_function VARCHAR(100), -- Function name for custom calculations
    
    -- Weighting and priority
    default_weight DECIMAL(6,3) DEFAULT 1.0 CHECK (default_weight >= 0.0),
    typical_priority INTEGER DEFAULT 3 CHECK (typical_priority BETWEEN 1 AND 5),
    conflicts_with_objectives JSONB DEFAULT '[]', -- Array of conflicting objective IDs
    
    -- Usage and applicability
    applicable_sports JSONB DEFAULT '[]', -- Empty = all sports
    applicable_competition_levels JSONB DEFAULT '[]',
    conference_specific BOOLEAN DEFAULT FALSE,
    
    -- Performance characteristics
    computation_cost INTEGER DEFAULT 3 CHECK (computation_cost BETWEEN 1 AND 5),
    cache_friendly BOOLEAN DEFAULT TRUE,
    supports_incremental_calculation BOOLEAN DEFAULT FALSE,
    
    -- Quality and validation
    has_benchmark_data BOOLEAN DEFAULT FALSE,
    benchmark_values JSONB DEFAULT '{}',
    validation_rules JSONB DEFAULT '[]',
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Algorithm Configurations - Different scheduling algorithm setups
CREATE TABLE algorithm_configurations (
    config_id SERIAL PRIMARY KEY,
    
    -- Algorithm identification
    algorithm_name VARCHAR(100) NOT NULL,
    algorithm_type VARCHAR(30) NOT NULL CHECK (algorithm_type IN (
        'simulated_annealing', 'genetic_algorithm', 'constraint_programming',
        'branch_and_bound', 'tabu_search', 'local_search', 'heuristic',
        'integer_programming', 'machine_learning', 'hybrid'
    )),
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Algorithm parameters
    parameters JSONB NOT NULL DEFAULT '{}',
    -- Example: {"temperature": 1000, "cooling_rate": 0.95, "max_iterations": 10000, "neighborhood_size": 100}
    
    -- Performance characteristics
    typical_execution_time_minutes INTEGER,
    memory_requirements_mb INTEGER,
    scalability_rating INTEGER DEFAULT 3 CHECK (scalability_rating BETWEEN 1 AND 5),
    parallel_execution_supported BOOLEAN DEFAULT FALSE,
    
    -- Quality characteristics
    solution_quality_rating INTEGER DEFAULT 3 CHECK (solution_quality_rating BETWEEN 1 AND 5),
    consistency_rating INTEGER DEFAULT 3 CHECK (consistency_rating BETWEEN 1 AND 5),
    handles_constraints_well BOOLEAN DEFAULT TRUE,
    
    -- Applicability
    best_for_problem_sizes JSONB DEFAULT '{}', -- {"min_teams": 8, "max_teams": 50, "max_games": 1000}
    suitable_for_sports JSONB DEFAULT '[]',
    works_with_objectives JSONB DEFAULT '[]', -- Array of objective IDs
    
    -- Tuning and optimization
    auto_tuning_enabled BOOLEAN DEFAULT FALSE,
    tuning_parameters JSONB DEFAULT '[]',
    performance_history JSONB DEFAULT '[]',
    
    -- Implementation details
    implementation_language VARCHAR(30) DEFAULT 'javascript',
    requires_external_solver BOOLEAN DEFAULT FALSE,
    external_solver_details JSONB,
    
    -- Usage and monitoring
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    average_quality_score DECIMAL(5,2),
    last_used_date DATE,
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'testing', 'active', 'deprecated', 'archived')),
    deprecated_by_config_id INTEGER REFERENCES algorithm_configurations(config_id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Schedule Comparison Results - Compare different generated schedules
CREATE TABLE schedule_comparison_results (
    comparison_id SERIAL PRIMARY KEY,
    
    -- Comparison context
    comparison_name VARCHAR(100) NOT NULL,
    comparison_purpose VARCHAR(30) NOT NULL CHECK (comparison_purpose IN (
        'algorithm_evaluation', 'parameter_tuning', 'quality_assessment',
        'stakeholder_review', 'iteration_comparison', 'final_selection'
    )),
    
    -- Schedules being compared
    schedule_ids JSONB NOT NULL, -- Array of schedule IDs being compared
    baseline_schedule_id INTEGER, -- Reference schedule for comparison
    
    -- Comparison criteria
    evaluation_criteria JSONB NOT NULL, -- Array of criteria and weights
    comparison_objectives JSONB NOT NULL, -- Objectives used for comparison
    
    -- Results summary
    overall_winner_schedule_id INTEGER,
    detailed_scores JSONB NOT NULL, -- Detailed scores for each schedule and criterion
    ranking_results JSONB NOT NULL, -- Ranked order of schedules
    
    -- Statistical analysis
    score_differences JSONB DEFAULT '{}', -- Statistical significance of differences
    confidence_intervals JSONB DEFAULT '{}',
    sensitivity_analysis JSONB DEFAULT '{}',
    
    -- Quality metrics
    pareto_optimal_schedules JSONB DEFAULT '[]', -- Schedules that are Pareto optimal
    trade_off_analysis JSONB DEFAULT '{}',
    compromise_solutions JSONB DEFAULT '[]',
    
    -- Stakeholder perspectives
    stakeholder_preferences JSONB DEFAULT '{}', -- Different stakeholder viewpoints
    consensus_metrics JSONB DEFAULT '{}',
    
    -- Comparison metadata
    comparison_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comparison_duration_seconds INTEGER,
    automated_comparison BOOLEAN DEFAULT TRUE,
    
    -- Decision support
    recommendations JSONB DEFAULT '[]',
    decision_factors JSONB DEFAULT '{}',
    implementation_considerations JSONB DEFAULT '[]',
    
    -- Reviewer information
    reviewed_by_user_id INTEGER,
    review_notes TEXT,
    approved_for_implementation BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Schedule Versions - Track different versions of schedules
CREATE TABLE schedule_versions (
    version_id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL,
    
    -- Version information
    version_number VARCHAR(20) NOT NULL, -- 1.0, 1.1, 2.0, etc.
    version_type VARCHAR(20) NOT NULL CHECK (version_type IN (
        'initial', 'revision', 'optimization', 'conflict_resolution',
        'manual_adjustment', 'emergency_change', 'final'
    )),
    
    -- Version metadata
    version_description TEXT,
    change_summary JSONB DEFAULT '[]', -- Summary of changes from previous version
    generation_method VARCHAR(30) NOT NULL CHECK (generation_method IN (
        'automated', 'manual', 'hybrid', 'import', 'copy', 'template'
    )),
    
    -- Generation context
    generation_request_id INTEGER REFERENCES schedule_generation_requests(request_id),
    parent_version_id INTEGER REFERENCES schedule_versions(version_id),
    algorithm_config_id INTEGER REFERENCES algorithm_configurations(config_id),
    
    -- Version data (snapshot of schedule at this version)
    schedule_data JSONB NOT NULL, -- Complete schedule data snapshot
    game_assignments JSONB NOT NULL, -- All game assignments for this version
    venue_assignments JSONB NOT NULL, -- Venue assignments
    
    -- Quality and metrics
    quality_score DECIMAL(5,2),
    objective_scores JSONB DEFAULT '{}', -- Scores for each optimization objective
    constraint_violations JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    
    -- Validation and approval
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN (
        'pending', 'passed', 'failed', 'warning', 'manual_review_required'
    )),
    validation_results JSONB DEFAULT '{}',
    approved_by_user_id INTEGER,
    approval_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Implementation tracking
    published BOOLEAN DEFAULT FALSE,
    published_timestamp TIMESTAMP WITH TIME ZONE,
    superseded_by_version_id INTEGER REFERENCES schedule_versions(version_id),
    
    -- Change tracking
    created_by_user_id INTEGER,
    change_reason TEXT,
    change_impact_assessment JSONB DEFAULT '{}',
    
    -- Archive and cleanup
    archived BOOLEAN DEFAULT FALSE,
    archive_timestamp TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(schedule_id, version_number)
);

-- 6. Schedule Generation Parameters - Reusable parameter sets
CREATE TABLE schedule_generation_parameters (
    parameter_set_id SERIAL PRIMARY KEY,
    
    -- Parameter set identification
    parameter_set_name VARCHAR(100) NOT NULL,
    parameter_set_type VARCHAR(30) NOT NULL CHECK (parameter_set_type IN (
        'sport_default', 'conference_standard', 'tournament_template',
        'custom', 'quick_generate', 'high_quality', 'emergency'
    )),
    
    -- Applicability
    applicable_sports JSONB DEFAULT '[]',
    applicable_conferences JSONB DEFAULT '[]',
    applicable_competition_levels JSONB DEFAULT '[]',
    
    -- Generation parameters
    algorithm_preferences JSONB NOT NULL, -- Preferred algorithms and their parameters
    objective_configuration JSONB NOT NULL, -- Objectives and their weights
    constraint_configuration JSONB DEFAULT '{}', -- Constraint settings
    
    -- Quality and performance settings
    quality_targets JSONB NOT NULL, -- Target quality scores
    performance_limits JSONB DEFAULT '{}', -- Time and resource limits
    optimization_settings JSONB DEFAULT '{}', -- Optimization-specific settings
    
    -- Game distribution parameters
    home_away_balance JSONB DEFAULT '{}', -- Home/away distribution preferences
    temporal_distribution JSONB DEFAULT '{}', -- Time distribution preferences
    venue_distribution JSONB DEFAULT '{}', -- Venue assignment preferences
    
    -- Scheduling patterns
    scheduling_patterns JSONB DEFAULT '[]', -- Preferred scheduling patterns
    avoid_patterns JSONB DEFAULT '[]', -- Patterns to avoid
    rivalry_handling JSONB DEFAULT '{}', -- Special handling for rivalry games
    
    -- Flexibility and overrides
    flexibility_settings JSONB DEFAULT '{}', -- How flexible the generation should be
    override_permissions JSONB DEFAULT '{}', -- What can be overridden
    emergency_protocols JSONB DEFAULT '{}', -- Emergency scheduling protocols
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_date DATE,
    success_rate DECIMAL(5,2),
    average_quality_achieved DECIMAL(5,2),
    
    -- Maintenance and versioning
    parameter_version VARCHAR(20) DEFAULT '1.0',
    created_by_user_id INTEGER,
    last_modified_by_user_id INTEGER,
    review_date DATE,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Schedule Templates - Predefined schedule structures
CREATE TABLE schedule_templates (
    template_id SERIAL PRIMARY KEY,
    
    -- Template identification
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) NOT NULL CHECK (template_type IN (
        'round_robin', 'double_round_robin', 'tournament_bracket',
        'conference_only', 'mixed_conference', 'playoff_format',
        'custom_format', 'hybrid'
    )),
    
    -- Applicability
    sport_id INTEGER,
    conference_id INTEGER,
    division_level VARCHAR(30),
    team_count_min INTEGER,
    team_count_max INTEGER,
    
    -- Template structure
    template_structure JSONB NOT NULL, -- Defines the structure of the schedule
    -- Example: {"rounds": 2, "games_per_team": 16, "conference_games": 12, "non_conference_games": 4}
    
    -- Game distribution rules
    game_distribution_rules JSONB NOT NULL,
    home_away_rules JSONB DEFAULT '{}',
    timing_rules JSONB DEFAULT '{}',
    venue_assignment_rules JSONB DEFAULT '{}',
    
    -- Constraints and requirements
    built_in_constraints JSONB DEFAULT '[]', -- Constraints built into the template
    required_parameters JSONB DEFAULT '[]', -- Parameters that must be provided
    optional_parameters JSONB DEFAULT '[]', -- Optional customization parameters
    
    -- Quality and characteristics
    expected_quality_range JSONB DEFAULT '{}', -- Expected quality score range
    typical_generation_time_minutes INTEGER,
    complexity_rating INTEGER DEFAULT 3 CHECK (complexity_rating BETWEEN 1 AND 5),
    
    -- Customization options
    customizable_aspects JSONB DEFAULT '[]', -- What can be customized
    variation_templates JSONB DEFAULT '[]', -- Common variations of this template
    
    -- Usage and performance
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    user_satisfaction_rating DECIMAL(3,2),
    last_used_date DATE,
    
    -- Documentation and help
    description TEXT,
    usage_instructions TEXT,
    best_practices JSONB DEFAULT '[]',
    common_issues JSONB DEFAULT '[]',
    
    -- Maintenance
    template_version VARCHAR(20) DEFAULT '1.0',
    created_by_user_id INTEGER,
    maintained_by_user_id INTEGER,
    last_review_date DATE,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Schedule Algorithms Performance - Track algorithm performance
CREATE TABLE schedule_algorithms_performance (
    performance_id SERIAL PRIMARY KEY,
    algorithm_config_id INTEGER NOT NULL REFERENCES algorithm_configurations(config_id),
    generation_request_id INTEGER REFERENCES schedule_generation_requests(request_id),
    
    -- Performance context
    test_scenario VARCHAR(100),
    problem_characteristics JSONB NOT NULL, -- Size, complexity, constraints
    execution_environment JSONB DEFAULT '{}', -- Hardware, software environment
    
    -- Execution metrics
    execution_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    execution_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_execution_time_seconds INTEGER NOT NULL,
    cpu_time_seconds INTEGER,
    memory_peak_usage_mb INTEGER,
    
    -- Iteration and convergence metrics
    total_iterations INTEGER,
    convergence_iteration INTEGER, -- Iteration where algorithm converged
    final_temperature DECIMAL(10,6), -- For simulated annealing
    final_fitness_score DECIMAL(12,6),
    improvement_curve JSONB DEFAULT '[]', -- Score improvements over iterations
    
    -- Solution quality metrics
    final_quality_score DECIMAL(5,2),
    objective_scores JSONB NOT NULL, -- Individual objective scores
    constraint_satisfaction_score DECIMAL(5,2),
    violations_count INTEGER DEFAULT 0,
    violations_severity_breakdown JSONB DEFAULT '{}',
    
    -- Comparative metrics
    baseline_quality_score DECIMAL(5,2), -- Quality of baseline/initial solution
    improvement_percentage DECIMAL(5,2),
    pareto_rank INTEGER, -- Rank in Pareto front if multi-objective
    
    -- Algorithm-specific metrics
    algorithm_specific_metrics JSONB DEFAULT '{}',
    -- For SA: {"temperature_history": [...], "acceptance_rate": 0.45}
    -- For GA: {"population_diversity": [...], "mutation_rate": 0.01}
    
    -- Robustness and stability
    solution_stability_score DECIMAL(5,2), -- How stable the solution is
    sensitivity_to_parameters JSONB DEFAULT '{}',
    multiple_run_consistency DECIMAL(5,2),
    
    -- Resource utilization
    parallel_efficiency DECIMAL(5,2), -- If parallel execution was used
    cache_hit_rate DECIMAL(5,2),
    external_api_calls INTEGER DEFAULT 0,
    
    -- Error and issue tracking
    errors_encountered JSONB DEFAULT '[]',
    warnings_generated JSONB DEFAULT '[]',
    recovery_actions JSONB DEFAULT '[]',
    
    -- User and context
    executed_by_user_id INTEGER,
    execution_context VARCHAR(50), -- 'production', 'testing', 'benchmarking'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Schedule Generation Jobs - Track background generation jobs
CREATE TABLE schedule_generation_jobs (
    job_id SERIAL PRIMARY KEY,
    generation_request_id INTEGER NOT NULL REFERENCES schedule_generation_requests(request_id),
    
    -- Job identification
    job_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(30) NOT NULL CHECK (job_type IN (
        'full_generation', 'incremental_update', 'optimization_only',
        'conflict_resolution', 'comparison_generation', 'batch_processing'
    )),
    
    -- Job configuration
    algorithm_config_id INTEGER REFERENCES algorithm_configurations(config_id),
    parameter_set_id INTEGER REFERENCES schedule_generation_parameters(parameter_set_id),
    job_parameters JSONB DEFAULT '{}',
    
    -- Job scheduling
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    actual_completion_time TIMESTAMP WITH TIME ZONE,
    
    -- Job status and progress
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN (
        'queued', 'starting', 'running', 'paused', 'completed', 
        'failed', 'cancelled', 'timeout', 'requires_intervention'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    current_phase VARCHAR(50), -- 'initialization', 'constraint_loading', 'optimization', 'validation'
    
    -- Resource allocation
    allocated_cpu_cores INTEGER DEFAULT 1,
    allocated_memory_mb INTEGER DEFAULT 1024,
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    max_execution_time_minutes INTEGER DEFAULT 60,
    
    -- Progress tracking
    iterations_completed INTEGER DEFAULT 0,
    best_score_so_far DECIMAL(12,6),
    last_improvement_iteration INTEGER,
    convergence_status VARCHAR(20) DEFAULT 'not_converged',
    
    -- Output and results
    generated_schedule_ids JSONB DEFAULT '[]',
    output_files JSONB DEFAULT '[]',
    result_summary JSONB DEFAULT '{}',
    quality_metrics JSONB DEFAULT '{}',
    
    -- Error handling and recovery
    error_messages JSONB DEFAULT '[]',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    auto_retry_enabled BOOLEAN DEFAULT TRUE,
    
    -- Monitoring and alerts
    monitoring_enabled BOOLEAN DEFAULT TRUE,
    alert_thresholds JSONB DEFAULT '{}',
    notifications_sent JSONB DEFAULT '[]',
    
    -- Cleanup and archiving
    cleanup_on_completion BOOLEAN DEFAULT FALSE,
    archive_after_days INTEGER DEFAULT 90,
    archived BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Schedule Optimization Metrics - Detailed optimization performance tracking
CREATE TABLE schedule_optimization_metrics (
    metric_id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES schedule_generation_jobs(job_id),
    
    -- Metric timing
    metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    iteration_number INTEGER,
    phase VARCHAR(50), -- 'initialization', 'search', 'refinement', 'validation'
    
    -- Objective function values
    total_objective_value DECIMAL(12,6),
    individual_objective_values JSONB NOT NULL, -- Values for each optimization objective
    weighted_objective_sum DECIMAL(12,6),
    
    -- Constraint satisfaction
    hard_constraints_violated INTEGER DEFAULT 0,
    soft_constraints_violated INTEGER DEFAULT 0,
    total_constraint_penalty DECIMAL(12,6) DEFAULT 0,
    constraint_satisfaction_ratio DECIMAL(5,4),
    
    -- Solution characteristics
    schedule_completeness_ratio DECIMAL(5,4), -- Percentage of required games scheduled
    venue_utilization_efficiency DECIMAL(5,4),
    temporal_distribution_score DECIMAL(5,4),
    travel_efficiency_score DECIMAL(5,4),
    
    -- Algorithm state
    algorithm_temperature DECIMAL(10,6), -- For simulated annealing
    population_diversity DECIMAL(5,4), -- For genetic algorithms
    search_space_explored_ratio DECIMAL(5,4),
    
    -- Performance indicators
    improvement_rate DECIMAL(8,6), -- Rate of improvement per iteration
    convergence_indicator DECIMAL(5,4), -- How close to convergence
    stagnation_counter INTEGER DEFAULT 0, -- Iterations without improvement
    
    -- Resource utilization snapshot
    memory_usage_mb INTEGER,
    cpu_utilization_percentage INTEGER,
    active_threads INTEGER,
    
    -- Quality indicators
    solution_feasibility BOOLEAN,
    solution_stability_indicator DECIMAL(5,4),
    robustness_score DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance Optimization

-- Schedule Generation Requests
CREATE INDEX idx_schedule_generation_requests_status ON schedule_generation_requests(status);
CREATE INDEX idx_schedule_generation_requests_sport_season ON schedule_generation_requests(sport_id, season_id);
CREATE INDEX idx_schedule_generation_requests_submitted ON schedule_generation_requests(submitted_at);
CREATE INDEX idx_schedule_generation_requests_priority ON schedule_generation_requests(priority_level);

-- Optimization Objectives
CREATE INDEX idx_optimization_objectives_category ON optimization_objectives(objective_category);
CREATE INDEX idx_optimization_objectives_code ON optimization_objectives(objective_code);
CREATE INDEX idx_optimization_objectives_active ON optimization_objectives(active);

-- Algorithm Configurations
CREATE INDEX idx_algorithm_configurations_type ON algorithm_configurations(algorithm_type);
CREATE INDEX idx_algorithm_configurations_status ON algorithm_configurations(status);
CREATE INDEX idx_algorithm_configurations_quality ON algorithm_configurations(solution_quality_rating);

-- Schedule Comparison Results
CREATE INDEX idx_schedule_comparison_results_timestamp ON schedule_comparison_results(comparison_timestamp);
CREATE INDEX idx_schedule_comparison_results_purpose ON schedule_comparison_results(comparison_purpose);

-- Schedule Versions
CREATE INDEX idx_schedule_versions_schedule ON schedule_versions(schedule_id);
CREATE INDEX idx_schedule_versions_version_number ON schedule_versions(version_number);
CREATE INDEX idx_schedule_versions_type ON schedule_versions(version_type);
CREATE INDEX idx_schedule_versions_published ON schedule_versions(published);

-- Schedule Generation Parameters
CREATE INDEX idx_schedule_generation_parameters_type ON schedule_generation_parameters(parameter_set_type);
CREATE INDEX idx_schedule_generation_parameters_sports ON schedule_generation_parameters USING GIN(applicable_sports);
CREATE INDEX idx_schedule_generation_parameters_active ON schedule_generation_parameters(active);

-- Schedule Templates
CREATE INDEX idx_schedule_templates_type ON schedule_templates(template_type);
CREATE INDEX idx_schedule_templates_sport ON schedule_templates(sport_id);
CREATE INDEX idx_schedule_templates_team_count ON schedule_templates(team_count_min, team_count_max);
CREATE INDEX idx_schedule_templates_active ON schedule_templates(active);

-- Schedule Algorithms Performance
CREATE INDEX idx_schedule_algorithms_performance_config ON schedule_algorithms_performance(algorithm_config_id);
CREATE INDEX idx_schedule_algorithms_performance_request ON schedule_algorithms_performance(generation_request_id);
CREATE INDEX idx_schedule_algorithms_performance_quality ON schedule_algorithms_performance(final_quality_score);
CREATE INDEX idx_schedule_algorithms_performance_time ON schedule_algorithms_performance(execution_start_time);

-- Schedule Generation Jobs
CREATE INDEX idx_schedule_generation_jobs_request ON schedule_generation_jobs(generation_request_id);
CREATE INDEX idx_schedule_generation_jobs_status ON schedule_generation_jobs(status);
CREATE INDEX idx_schedule_generation_jobs_scheduled ON schedule_generation_jobs(scheduled_start_time);
CREATE INDEX idx_schedule_generation_jobs_priority ON schedule_generation_jobs(priority_level);

-- Schedule Optimization Metrics
CREATE INDEX idx_schedule_optimization_metrics_job ON schedule_optimization_metrics(job_id);
CREATE INDEX idx_schedule_optimization_metrics_timestamp ON schedule_optimization_metrics(metric_timestamp);
CREATE INDEX idx_schedule_optimization_metrics_iteration ON schedule_optimization_metrics(iteration_number);

-- Functions and Triggers

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_schedule_generation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_schedule_generation_requests_updated_at 
    BEFORE UPDATE ON schedule_generation_requests
    FOR EACH ROW EXECUTE FUNCTION update_schedule_generation_updated_at();

CREATE TRIGGER update_optimization_objectives_updated_at 
    BEFORE UPDATE ON optimization_objectives
    FOR EACH ROW EXECUTE FUNCTION update_schedule_generation_updated_at();

CREATE TRIGGER update_algorithm_configurations_updated_at 
    BEFORE UPDATE ON algorithm_configurations
    FOR EACH ROW EXECUTE FUNCTION update_schedule_generation_updated_at();

CREATE TRIGGER update_schedule_generation_parameters_updated_at 
    BEFORE UPDATE ON schedule_generation_parameters
    FOR EACH ROW EXECUTE FUNCTION update_schedule_generation_updated_at();

CREATE TRIGGER update_schedule_templates_updated_at 
    BEFORE UPDATE ON schedule_templates
    FOR EACH ROW EXECUTE FUNCTION update_schedule_generation_updated_at();

CREATE TRIGGER update_schedule_generation_jobs_updated_at 
    BEFORE UPDATE ON schedule_generation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_schedule_generation_updated_at();

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_schedules_games_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY schedules_games_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Views for Common Queries

-- View: Active Generation Requests
CREATE VIEW active_generation_requests AS
SELECT 
    sgr.*,
    sgj.job_id,
    sgj.status AS job_status,
    sgj.progress_percentage,
    sgj.current_phase
FROM schedule_generation_requests sgr
LEFT JOIN schedule_generation_jobs sgj ON sgr.request_id = sgj.generation_request_id
WHERE sgr.status IN ('submitted', 'queued', 'in_progress')
ORDER BY sgr.priority_level DESC, sgr.submitted_at;

-- View: Algorithm Performance Summary
CREATE VIEW algorithm_performance_summary AS
SELECT 
    ac.algorithm_name,
    ac.algorithm_type,
    COUNT(sap.performance_id) AS total_executions,
    AVG(sap.total_execution_time_seconds) AS avg_execution_time_seconds,
    AVG(sap.final_quality_score) AS avg_quality_score,
    AVG(sap.memory_peak_usage_mb) AS avg_memory_usage_mb,
    MAX(sap.final_quality_score) AS best_quality_score,
    MIN(sap.total_execution_time_seconds) AS fastest_execution_seconds
FROM algorithm_configurations ac
LEFT JOIN schedule_algorithms_performance sap ON ac.config_id = sap.algorithm_config_id
    AND sap.execution_start_time >= CURRENT_TIMESTAMP - INTERVAL '90 days'
WHERE ac.status = 'active'
GROUP BY ac.config_id, ac.algorithm_name, ac.algorithm_type;

-- View: Schedule Generation Queue
CREATE VIEW schedule_generation_queue AS
SELECT 
    sgj.job_id,
    sgj.job_name,
    sgj.job_type,
    sgj.status,
    sgj.priority_level,
    sgj.scheduled_start_time,
    sgj.progress_percentage,
    sgr.request_name,
    sgr.sport_id,
    sgr.requested_by_user_id,
    ac.algorithm_name
FROM schedule_generation_jobs sgj
JOIN schedule_generation_requests sgr ON sgj.generation_request_id = sgr.request_id
LEFT JOIN algorithm_configurations ac ON sgj.algorithm_config_id = ac.config_id
WHERE sgj.status IN ('queued', 'starting', 'running', 'paused')
ORDER BY sgj.priority_level DESC, sgj.scheduled_start_time;

-- Comments for Documentation
COMMENT ON TABLE schedule_generation_requests IS 'Requests for new schedule generation with parameters and requirements';
COMMENT ON TABLE optimization_objectives IS 'Defined objectives for schedule optimization with calculation methods';
COMMENT ON TABLE algorithm_configurations IS 'Configuration sets for different scheduling algorithms';
COMMENT ON TABLE schedule_comparison_results IS 'Results of comparing different generated schedules';
COMMENT ON TABLE schedule_versions IS 'Version history and snapshots of schedule changes';
COMMENT ON TABLE schedule_generation_parameters IS 'Reusable parameter sets for schedule generation';
COMMENT ON TABLE schedule_templates IS 'Predefined schedule structures and formats';
COMMENT ON TABLE schedule_algorithms_performance IS 'Performance tracking for scheduling algorithms';
COMMENT ON TABLE schedule_generation_jobs IS 'Background job tracking for schedule generation';
COMMENT ON TABLE schedule_optimization_metrics IS 'Detailed metrics from optimization process';

COMMENT ON MATERIALIZED VIEW schedules_games_view IS 'Denormalized view of schedule-game relationships for microservice boundary isolation';

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE schedule_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_comparison_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generation_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_algorithms_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_optimization_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be customized based on authentication system)
CREATE POLICY schedule_generation_requests_policy ON schedule_generation_requests
    FOR ALL USING (
        requested_by_user_id = current_setting('app.current_user_id')::int OR
        sport_id IN (SELECT sport_id FROM user_sport_access WHERE user_id = current_setting('app.current_user_id')::int)
    );

CREATE POLICY schedule_versions_policy ON schedule_versions
    FOR ALL USING (
        schedule_id IN (SELECT schedule_id FROM user_schedule_access WHERE user_id = current_setting('app.current_user_id')::int)
    );