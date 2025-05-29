-- FlexTime Microservices Migration Script 001
-- Create Microservice Database Schemas
-- This script creates the foundation for microservice-specific database schemas

-- Create separate schemas for each microservice
CREATE SCHEMA IF NOT EXISTS team_availability;
CREATE SCHEMA IF NOT EXISTS venue_management;
CREATE SCHEMA IF NOT EXISTS constraint_validation;
CREATE SCHEMA IF NOT EXISTS schedule_generation;
CREATE SCHEMA IF NOT EXISTS shared_data;

-- Grant appropriate permissions
-- Note: Adjust these based on your specific user/role structure

-- Team Availability Service permissions
GRANT USAGE ON SCHEMA team_availability TO team_availability_service;
GRANT CREATE ON SCHEMA team_availability TO team_availability_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA team_availability TO team_availability_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA team_availability TO team_availability_service;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA team_availability TO team_availability_service;

-- Venue Management Service permissions
GRANT USAGE ON SCHEMA venue_management TO venue_management_service;
GRANT CREATE ON SCHEMA venue_management TO venue_management_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA venue_management TO venue_management_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA venue_management TO venue_management_service;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA venue_management TO venue_management_service;

-- Constraint Validation Service permissions
GRANT USAGE ON SCHEMA constraint_validation TO constraint_validation_service;
GRANT CREATE ON SCHEMA constraint_validation TO constraint_validation_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA constraint_validation TO constraint_validation_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA constraint_validation TO constraint_validation_service;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA constraint_validation TO constraint_validation_service;

-- Schedule Generation Service permissions
GRANT USAGE ON SCHEMA schedule_generation TO schedule_generation_service;
GRANT CREATE ON SCHEMA schedule_generation TO schedule_generation_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA schedule_generation TO schedule_generation_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA schedule_generation TO schedule_generation_service;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA schedule_generation TO schedule_generation_service;

-- Shared Data permissions (read-only for most services)
GRANT USAGE ON SCHEMA shared_data TO team_availability_service, venue_management_service, constraint_validation_service, schedule_generation_service;
GRANT SELECT ON ALL TABLES IN SCHEMA shared_data TO team_availability_service, venue_management_service, constraint_validation_service, schedule_generation_service;

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    migration_id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'rolled_back'))
);

-- Record this migration
INSERT INTO public.schema_migrations (version, description, execution_time_ms) 
VALUES ('001', 'Create microservice database schemas and permissions', 0);

-- Create shared reference tables in shared_data schema
-- These tables contain reference data that multiple services need

-- Move core reference tables to shared_data schema
CREATE TABLE IF NOT EXISTS shared_data.sports (
    sport_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    category VARCHAR(30),
    season_type VARCHAR(20),
    gender CHAR(1) CHECK (gender IN ('M', 'W', 'C')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_data.seasons (
    season_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    season_type VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_data.institutions (
    institution_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(50),
    state VARCHAR(2),
    time_zone VARCHAR(50),
    conference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on shared tables
CREATE INDEX IF NOT EXISTS idx_shared_sports_code ON shared_data.sports(code);
CREATE INDEX IF NOT EXISTS idx_shared_seasons_active ON shared_data.seasons(active);
CREATE INDEX IF NOT EXISTS idx_shared_institutions_code ON shared_data.institutions(code);

-- Create a view that aggregates microservice health status
CREATE OR REPLACE VIEW public.microservice_health AS
SELECT 
    'team_availability' AS service_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'team_availability') 
        THEN 'healthy' 
        ELSE 'unhealthy' 
    END AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'team_availability') AS table_count
UNION ALL
SELECT 
    'venue_management' AS service_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'venue_management') 
        THEN 'healthy' 
        ELSE 'unhealthy' 
    END AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'venue_management') AS table_count
UNION ALL
SELECT 
    'constraint_validation' AS service_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'constraint_validation') 
        THEN 'healthy' 
        ELSE 'unhealthy' 
    END AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'constraint_validation') AS table_count
UNION ALL
SELECT 
    'schedule_generation' AS service_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'schedule_generation') 
        THEN 'healthy' 
        ELSE 'unhealthy' 
    END AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'schedule_generation') AS table_count;

-- Create function to refresh all materialized views across schemas
CREATE OR REPLACE FUNCTION refresh_all_microservice_views()
RETURNS VOID AS $$
DECLARE
    view_record RECORD;
BEGIN
    -- Refresh materialized views in team_availability schema
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'team_availability'
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', view_record.schemaname, view_record.matviewname);
    END LOOP;
    
    -- Refresh materialized views in venue_management schema
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'venue_management'
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', view_record.schemaname, view_record.matviewname);
    END LOOP;
    
    -- Refresh materialized views in constraint_validation schema
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'constraint_validation'
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', view_record.schemaname, view_record.matviewname);
    END LOOP;
    
    -- Refresh materialized views in schedule_generation schema
    FOR view_record IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'schedule_generation'
    LOOP
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I.%I', view_record.schemaname, view_record.matviewname);
    END LOOP;
    
    RAISE NOTICE 'All microservice materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Create function to check cross-service data consistency
CREATE OR REPLACE FUNCTION check_microservice_data_consistency()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if shared reference data exists
    RETURN QUERY
    SELECT 
        'shared_sports_data'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM shared_data.sports) > 0 
            THEN 'OK'::TEXT 
            ELSE 'WARNING'::TEXT 
        END,
        format('Sports count: %s', (SELECT COUNT(*) FROM shared_data.sports))::TEXT;
    
    RETURN QUERY
    SELECT 
        'shared_institutions_data'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM shared_data.institutions) > 0 
            THEN 'OK'::TEXT 
            ELSE 'WARNING'::TEXT 
        END,
        format('Institutions count: %s', (SELECT COUNT(*) FROM shared_data.institutions))::TEXT;
    
    -- Add more consistency checks as needed
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create monitoring function for migration status
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE(
    migration_version VARCHAR(20),
    description TEXT,
    status VARCHAR(20),
    executed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.version,
        sm.description,
        sm.status,
        sm.executed_at
    FROM public.schema_migrations sm
    ORDER BY sm.version;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA team_availability IS 'Team availability and scheduling preferences microservice schema';
COMMENT ON SCHEMA venue_management IS 'Venue management and availability microservice schema';
COMMENT ON SCHEMA constraint_validation IS 'Constraint validation and enforcement microservice schema';
COMMENT ON SCHEMA schedule_generation IS 'Schedule generation and optimization microservice schema';
COMMENT ON SCHEMA shared_data IS 'Shared reference data accessed by multiple microservices';

COMMENT ON FUNCTION refresh_all_microservice_views() IS 'Refreshes all materialized views across microservice schemas';
COMMENT ON FUNCTION check_microservice_data_consistency() IS 'Checks data consistency across microservice boundaries';
COMMENT ON FUNCTION get_migration_status() IS 'Returns the status of all database migrations';