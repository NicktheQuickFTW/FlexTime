-- Big 12 Sports Scheduling Data Warehouse Schema
-- Star schema design for analytical workloads

-- Create dedicated analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- Dimension Tables

-- Date Dimension
CREATE TABLE analytics.dim_date (
    date_key INTEGER PRIMARY KEY,
    date_value DATE NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week INTEGER NOT NULL,
    day_of_year INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    season VARCHAR(20) NOT NULL
);

-- Sports Dimension
CREATE TABLE analytics.dim_sport (
    sport_key SERIAL PRIMARY KEY,
    sport_id VARCHAR(50) NOT NULL UNIQUE,
    sport_name VARCHAR(100) NOT NULL,
    sport_category VARCHAR(50) NOT NULL,
    season_type VARCHAR(20) NOT NULL, -- fall, winter, spring, summer
    gender VARCHAR(10) NOT NULL,
    is_revenue_sport BOOLEAN NOT NULL DEFAULT FALSE,
    championship_sport BOOLEAN NOT NULL DEFAULT TRUE,
    team_count INTEGER NOT NULL,
    games_per_team INTEGER,
    season_length_weeks INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams/Institutions Dimension
CREATE TABLE analytics.dim_team (
    team_key SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL UNIQUE,
    team_name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    conference VARCHAR(50) NOT NULL,
    division VARCHAR(50),
    state VARCHAR(50) NOT NULL,
    time_zone VARCHAR(50) NOT NULL,
    enrollment INTEGER,
    athletic_budget DECIMAL(15,2),
    is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
    join_date DATE,
    primary_venue_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues Dimension
CREATE TABLE analytics.dim_venue (
    venue_key SERIAL PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL UNIQUE,
    venue_name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    venue_type VARCHAR(50) NOT NULL,
    surface_type VARCHAR(50),
    indoor_outdoor VARCHAR(20) NOT NULL,
    home_team_id VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    elevation INTEGER,
    year_built INTEGER,
    renovation_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraints Dimension
CREATE TABLE analytics.dim_constraint (
    constraint_key SERIAL PRIMARY KEY,
    constraint_id VARCHAR(50) NOT NULL UNIQUE,
    constraint_type VARCHAR(50) NOT NULL,
    constraint_category VARCHAR(50) NOT NULL,
    priority_level INTEGER NOT NULL,
    scope VARCHAR(50) NOT NULL,
    is_hard_constraint BOOLEAN NOT NULL,
    weight DECIMAL(3,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact Tables

-- Schedule Performance Fact Table
CREATE TABLE analytics.fact_schedule_performance (
    performance_key BIGSERIAL PRIMARY KEY,
    date_key INTEGER NOT NULL REFERENCES analytics.dim_date(date_key),
    sport_key INTEGER NOT NULL REFERENCES analytics.dim_sport(sport_key),
    home_team_key INTEGER NOT NULL REFERENCES analytics.dim_team(team_key),
    away_team_key INTEGER NOT NULL REFERENCES analytics.dim_team(team_key),
    venue_key INTEGER NOT NULL REFERENCES analytics.dim_venue(venue_key),
    
    -- Schedule Metrics
    games_scheduled INTEGER NOT NULL DEFAULT 0,
    games_completed INTEGER NOT NULL DEFAULT 0,
    games_cancelled INTEGER NOT NULL DEFAULT 0,
    games_rescheduled INTEGER NOT NULL DEFAULT 0,
    
    -- Constraint Metrics
    constraints_satisfied INTEGER NOT NULL DEFAULT 0,
    constraints_violated INTEGER NOT NULL DEFAULT 0,
    hard_constraints_violated INTEGER NOT NULL DEFAULT 0,
    soft_constraints_violated INTEGER NOT NULL DEFAULT 0,
    
    -- Travel Metrics
    travel_distance_miles DECIMAL(10,2),
    travel_cost_estimated DECIMAL(12,2),
    travel_time_hours DECIMAL(5,2),
    
    -- Venue Utilization
    venue_capacity_utilized DECIMAL(5,2),
    attendance_actual INTEGER,
    attendance_percentage DECIMAL(5,2),
    
    -- Revenue Metrics
    revenue_estimated DECIMAL(12,2),
    revenue_actual DECIMAL(12,2),
    
    -- Quality Scores
    schedule_quality_score DECIMAL(5,2),
    fan_satisfaction_score DECIMAL(5,2),
    tv_rating DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraint Violation Fact Table
CREATE TABLE analytics.fact_constraint_violations (
    violation_key BIGSERIAL PRIMARY KEY,
    date_key INTEGER NOT NULL REFERENCES analytics.dim_date(date_key),
    sport_key INTEGER NOT NULL REFERENCES analytics.dim_sport(sport_key),
    team_key INTEGER REFERENCES analytics.dim_team(team_key),
    venue_key INTEGER REFERENCES analytics.dim_venue(venue_key),
    constraint_key INTEGER NOT NULL REFERENCES analytics.dim_constraint(constraint_key),
    
    -- Violation Details
    violation_type VARCHAR(50) NOT NULL,
    severity_level INTEGER NOT NULL,
    resolution_status VARCHAR(20) NOT NULL DEFAULT 'open',
    resolution_time_hours INTEGER,
    
    -- Impact Metrics
    games_affected INTEGER NOT NULL DEFAULT 1,
    teams_affected INTEGER NOT NULL DEFAULT 1,
    cost_impact DECIMAL(12,2),
    
    -- Resolution Metrics
    auto_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    manual_intervention BOOLEAN NOT NULL DEFAULT FALSE,
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    
    violation_date TIMESTAMP NOT NULL,
    resolution_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Travel Optimization Fact Table
CREATE TABLE analytics.fact_travel_optimization (
    travel_key BIGSERIAL PRIMARY KEY,
    date_key INTEGER NOT NULL REFERENCES analytics.dim_date(date_key),
    sport_key INTEGER NOT NULL REFERENCES analytics.dim_sport(sport_key),
    team_key INTEGER NOT NULL REFERENCES analytics.dim_team(team_key),
    
    -- Travel Metrics
    total_travel_distance DECIMAL(12,2) NOT NULL,
    total_travel_cost DECIMAL(12,2) NOT NULL,
    total_travel_time DECIMAL(8,2) NOT NULL,
    
    -- Optimization Results
    distance_saved DECIMAL(12,2) NOT NULL DEFAULT 0,
    cost_saved DECIMAL(12,2) NOT NULL DEFAULT 0,
    time_saved DECIMAL(8,2) NOT NULL DEFAULT 0,
    
    -- Efficiency Metrics
    travel_efficiency_score DECIMAL(5,2),
    route_optimization_level DECIMAL(5,2),
    
    -- Booking Details
    flights_booked INTEGER DEFAULT 0,
    buses_booked INTEGER DEFAULT 0,
    hotels_booked INTEGER DEFAULT 0,
    
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggregate Tables for Performance

-- Monthly Schedule Summary
CREATE TABLE analytics.agg_monthly_schedule_summary (
    summary_key SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    sport_key INTEGER NOT NULL REFERENCES analytics.dim_sport(sport_key),
    
    total_games INTEGER NOT NULL,
    total_constraints INTEGER NOT NULL,
    constraints_satisfied INTEGER NOT NULL,
    constraint_satisfaction_rate DECIMAL(5,2) NOT NULL,
    
    total_travel_distance DECIMAL(12,2) NOT NULL,
    total_travel_cost DECIMAL(12,2) NOT NULL,
    average_venue_utilization DECIMAL(5,2) NOT NULL,
    
    schedule_quality_avg DECIMAL(5,2),
    fan_satisfaction_avg DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month, sport_key)
);

-- Indexes for Performance Optimization

-- Date dimension indexes
CREATE INDEX idx_dim_date_value ON analytics.dim_date(date_value);
CREATE INDEX idx_dim_date_year_month ON analytics.dim_date(year, month);
CREATE INDEX idx_dim_date_season ON analytics.dim_date(season);

-- Fact table indexes
CREATE INDEX idx_fact_schedule_date_sport ON analytics.fact_schedule_performance(date_key, sport_key);
CREATE INDEX idx_fact_schedule_teams ON analytics.fact_schedule_performance(home_team_key, away_team_key);
CREATE INDEX idx_fact_violations_date_constraint ON analytics.fact_constraint_violations(date_key, constraint_key);
CREATE INDEX idx_fact_travel_date_team ON analytics.fact_travel_optimization(date_key, team_key);

-- Composite indexes for common queries
CREATE INDEX idx_schedule_performance_composite ON analytics.fact_schedule_performance(date_key, sport_key, home_team_key);
CREATE INDEX idx_violations_severity_status ON analytics.fact_constraint_violations(severity_level, resolution_status);

-- Views for Common Analytics Queries

-- Schedule Quality Summary View
CREATE VIEW analytics.v_schedule_quality_summary AS
SELECT 
    ds.sport_name,
    dt.team_name,
    dd.year,
    dd.month,
    AVG(fsp.schedule_quality_score) as avg_quality_score,
    AVG(fsp.constraint_satisfaction_rate) as avg_constraint_satisfaction,
    SUM(fsp.games_scheduled) as total_games,
    SUM(fsp.constraints_violated) as total_violations
FROM analytics.fact_schedule_performance fsp
JOIN analytics.dim_sport ds ON fsp.sport_key = ds.sport_key
JOIN analytics.dim_team dt ON fsp.home_team_key = dt.team_key
JOIN analytics.dim_date dd ON fsp.date_key = dd.date_key
GROUP BY ds.sport_name, dt.team_name, dd.year, dd.month;

-- Travel Efficiency Summary View
CREATE VIEW analytics.v_travel_efficiency_summary AS
SELECT 
    ds.sport_name,
    dt.team_name,
    dd.year,
    SUM(fto.total_travel_distance) as total_distance,
    SUM(fto.total_travel_cost) as total_cost,
    SUM(fto.distance_saved) as total_distance_saved,
    SUM(fto.cost_saved) as total_cost_saved,
    AVG(fto.travel_efficiency_score) as avg_efficiency_score
FROM analytics.fact_travel_optimization fto
JOIN analytics.dim_sport ds ON fto.sport_key = ds.sport_key
JOIN analytics.dim_team dt ON fto.team_key = dt.team_key
JOIN analytics.dim_date dd ON fto.date_key = dd.date_key
GROUP BY ds.sport_name, dt.team_name, dd.year;

-- Constraint Violation Trends View
CREATE VIEW analytics.v_constraint_violation_trends AS
SELECT 
    dd.year,
    dd.month,
    ds.sport_name,
    dc.constraint_type,
    COUNT(*) as violation_count,
    AVG(fcv.severity_level) as avg_severity,
    AVG(fcv.resolution_time_hours) as avg_resolution_time
FROM analytics.fact_constraint_violations fcv
JOIN analytics.dim_date dd ON fcv.date_key = dd.date_key
JOIN analytics.dim_sport ds ON fcv.sport_key = ds.sport_key
JOIN analytics.dim_constraint dc ON fcv.constraint_key = dc.constraint_key
GROUP BY dd.year, dd.month, ds.sport_name, dc.constraint_type
ORDER BY dd.year DESC, dd.month DESC, violation_count DESC;