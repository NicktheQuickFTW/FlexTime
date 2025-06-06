-- Create microservice database users
-- This script creates the service users needed for the migration

-- Create service users with secure passwords
-- Note: In production, use stronger passwords and store them securely

CREATE USER team_availability_service WITH PASSWORD 'ta_service_2025';
CREATE USER venue_management_service WITH PASSWORD 'vm_service_2025';
CREATE USER constraint_validation_service WITH PASSWORD 'cv_service_2025';
CREATE USER schedule_generation_service WITH PASSWORD 'sg_service_2025';

-- Grant basic connection privileges
GRANT CONNECT ON DATABASE current_database() TO team_availability_service;
GRANT CONNECT ON DATABASE current_database() TO venue_management_service;
GRANT CONNECT ON DATABASE current_database() TO constraint_validation_service;
GRANT CONNECT ON DATABASE current_database() TO schedule_generation_service;

-- These users will get schema-specific permissions from the migration script