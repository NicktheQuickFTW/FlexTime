-- Research Tracking Tables
-- For storing validation results, errors, and system performance metrics

-- Research validations table
CREATE TABLE IF NOT EXISTS research_validations (
    validation_id VARCHAR(50) PRIMARY KEY,
    research_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'low_confidence', 'error')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    duration_ms INTEGER,
    validated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research errors table for tracking failures
CREATE TABLE IF NOT EXISTS research_errors (
    error_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_data JSONB,
    job_id VARCHAR(100),
    sport VARCHAR(50),
    team_name VARCHAR(255),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research job history
CREATE TABLE IF NOT EXISTS research_job_history (
    job_id VARCHAR(100) PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    sport VARCHAR(50),
    team_name VARCHAR(255),
    priority INTEGER DEFAULT 3,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    api_calls INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research performance metrics
CREATE TABLE IF NOT EXISTS research_performance_metrics (
    metric_id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    sport VARCHAR(50),
    time_period VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    sample_size INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS research_api_usage (
    usage_id SERIAL PRIMARY KEY,
    api_provider VARCHAR(50) NOT NULL, -- 'perplexity', 'gemini', etc.
    endpoint VARCHAR(255),
    job_id VARCHAR(100),
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,4),
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    called_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research conflicts tracking
CREATE TABLE IF NOT EXISTS research_conflicts (
    conflict_id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(team_id),
    sport VARCHAR(50),
    conflicting_values JSONB NOT NULL,
    sources JSONB NOT NULL,
    resolution_strategy VARCHAR(50),
    resolved_value TEXT,
    confidence DECIMAL(3,2),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback adjustments log
CREATE TABLE IF NOT EXISTS research_feedback_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    adjustment_type VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    impact_assessment TEXT,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reverted BOOLEAN DEFAULT FALSE,
    reverted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_research_validations_type_status ON research_validations(research_type, status);
CREATE INDEX idx_research_validations_validated_at ON research_validations(validated_at);

CREATE INDEX idx_research_errors_category ON research_errors(category);
CREATE INDEX idx_research_errors_occurred_at ON research_errors(occurred_at);
CREATE INDEX idx_research_errors_resolved ON research_errors(resolved);

CREATE INDEX idx_research_job_history_type_status ON research_job_history(job_type, status);
CREATE INDEX idx_research_job_history_sport ON research_job_history(sport);
CREATE INDEX idx_research_job_history_scheduled_at ON research_job_history(scheduled_at);

CREATE INDEX idx_research_performance_metrics_type ON research_performance_metrics(metric_type);
CREATE INDEX idx_research_performance_metrics_period ON research_performance_metrics(time_period, period_start);

CREATE INDEX idx_research_api_usage_provider ON research_api_usage(api_provider);
CREATE INDEX idx_research_api_usage_called_at ON research_api_usage(called_at);

CREATE INDEX idx_research_conflicts_team ON research_conflicts(team_id);
CREATE INDEX idx_research_conflicts_detected ON research_conflicts(detected_at);

-- Create views for monitoring

-- Daily research summary
CREATE OR REPLACE VIEW v_daily_research_summary AS
SELECT 
    DATE(scheduled_at) as research_date,
    job_type,
    sport,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(duration_ms) as avg_duration_ms,
    SUM(api_calls) as total_api_calls
FROM research_job_history
WHERE scheduled_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(scheduled_at), job_type, sport
ORDER BY research_date DESC, job_type, sport;

-- Error trends
CREATE OR REPLACE VIEW v_research_error_trends AS
SELECT 
    DATE(occurred_at) as error_date,
    category,
    COUNT(*) as error_count,
    COUNT(CASE WHEN resolved THEN 1 END) as resolved_count
FROM research_errors
WHERE occurred_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(occurred_at), category
ORDER BY error_date DESC, error_count DESC;

-- API usage summary
CREATE OR REPLACE VIEW v_api_usage_summary AS
SELECT 
    api_provider,
    DATE(called_at) as usage_date,
    COUNT(*) as call_count,
    AVG(response_time_ms) as avg_response_time,
    SUM(tokens_used) as total_tokens,
    SUM(cost_estimate) as total_cost,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM research_api_usage
WHERE called_at >= NOW() - INTERVAL '7 days'
GROUP BY api_provider, DATE(called_at)
ORDER BY usage_date DESC, api_provider;

-- Performance trends
CREATE OR REPLACE VIEW v_performance_trends AS
SELECT 
    metric_type,
    time_period,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    SUM(sample_size) as total_samples
FROM research_performance_metrics
WHERE period_start >= NOW() - INTERVAL '30 days'
GROUP BY metric_type, time_period
ORDER BY metric_type, time_period;