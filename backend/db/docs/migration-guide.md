# FlexTime Microservices Database Migration Guide

## Overview

This guide provides comprehensive instructions for migrating the FlexTime scheduling system from a monolithic database architecture to a microservices-based approach. The migration involves creating separate database schemas for each microservice while maintaining backward compatibility and data integrity.

## Migration Architecture

### Microservice Boundaries

The migration splits the monolithic FlexTime database into four primary microservices:

1. **Team Availability Service** - Manages team scheduling preferences, blackout dates, and availability windows
2. **Venue Management Service** - Handles venue configurations, availability, and operational constraints
3. **Constraint Validation Service** - Manages scheduling constraints, validation rules, and enforcement policies
4. **Schedule Generation Service** - Coordinates schedule creation, optimization, and version management

### Shared Data Strategy

Common reference data (sports, seasons, institutions) is maintained in a `shared_data` schema accessible by all microservices, reducing data duplication while maintaining service autonomy.

## Prerequisites

### System Requirements
- PostgreSQL 13 or higher
- Node.js 16+ (for API compatibility layer)
- Redis 6+ (for caching and job queues)
- At least 4GB RAM for database operations
- 10GB available disk space

### Database Users and Permissions
Create dedicated database users for each microservice:

```sql
-- Create microservice users
CREATE USER team_availability_service WITH PASSWORD 'secure_password_1';
CREATE USER venue_management_service WITH PASSWORD 'secure_password_2';
CREATE USER constraint_validation_service WITH PASSWORD 'secure_password_3';
CREATE USER schedule_generation_service WITH PASSWORD 'secure_password_4';

-- Grant necessary privileges (done in migration scripts)
```

### Backup Strategy
Before beginning migration, create a full database backup:

```bash
pg_dump -U postgres -h localhost flextime_db > flextime_backup_$(date +%Y%m%d_%H%M%S).sql
```

## Migration Process

### Phase 1: Schema Creation

Execute the foundational migration script to create microservice schemas:

```bash
psql -U postgres -d flextime_db -f migrations/001_create_microservice_schemas.sql
```

This script:
- Creates separate schemas for each microservice
- Sets up shared data schema for reference tables
- Establishes proper permissions and access controls
- Creates monitoring and health check functions

### Phase 2: Service-Specific Migrations

Execute each service migration in sequence:

#### Team Availability Service
```bash
psql -U postgres -d flextime_db -f migrations/002_migrate_team_availability_service.sql
```

Creates tables:
- `team_scheduling_profiles` - Core scheduling preferences
- `team_rest_requirements` - Rest and recovery requirements
- `team_travel_constraints` - Travel limitations and preferences
- `team_availability_windows` - Specific available time periods
- `team_blackout_dates` - Unavailable periods
- `team_availability_preferences` - Detailed scheduling preferences

#### Venue Management Service
```bash
psql -U postgres -d flextime_db -f migrations/003_migrate_venue_management_service.sql
```

#### Constraint Validation Service
```bash
psql -U postgres -d flextime_db -f migrations/004_migrate_constraint_validation_service.sql
```

#### Schedule Generation Service
```bash
psql -U postgres -d flextime_db -f migrations/005_migrate_schedule_generation_service.sql
```

### Phase 3: Data Seeding

Populate the new schemas with initial data:

```bash
# Seed Big 12 Conference data
psql -U postgres -d flextime_db -f seeding/seed_big12_team_availability.sql
psql -U postgres -d flextime_db -f seeding/seed_big12_venues.sql
psql -U postgres -d flextime_db -f seeding/seed_constraint_templates.sql
```

### Phase 4: API Migration

Deploy the API compatibility layer:

1. **Legacy API (v1)** - Maintains backward compatibility
2. **Microservices API (v2)** - New microservice-oriented endpoints

The compatibility layer aggregates data from multiple microservices to maintain existing API contracts.

## Schema Details

### Team Availability Service Schema

```sql
-- Core team scheduling profile
team_availability.team_scheduling_profiles (
    profile_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    preferred_game_times JSONB DEFAULT '{}',
    max_games_per_week INTEGER DEFAULT 3,
    min_rest_days INTEGER DEFAULT 1,
    -- ... additional preferences
);

-- Blackout periods when teams are unavailable
team_availability.team_blackout_dates (
    blackout_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    blackout_type VARCHAR(30) NOT NULL,
    severity VARCHAR(15) NOT NULL DEFAULT 'hard',
    -- ... additional constraints
);
```

### Venue Management Service Schema

```sql
-- Enhanced venue profiles
venue_management.venue_profiles (
    profile_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    venue_name VARCHAR(100) NOT NULL,
    venue_type VARCHAR(20),
    standard_capacity INTEGER,
    climate_controlled BOOLEAN DEFAULT FALSE,
    -- ... facility details
);

-- Venue operational hours
venue_management.venue_operational_hours (
    hours_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    open_time TIME,
    close_time TIME,
    allows_games BOOLEAN DEFAULT TRUE,
    -- ... operational constraints
);
```

### Constraint Validation Service Schema

```sql
-- Constraint templates for reuse
constraint_validation.constraint_templates (
    template_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    validation_logic JSONB NOT NULL,
    parameter_schema JSONB NOT NULL,
    -- ... template definition
);

-- Constraint validation results
constraint_validation.schedule_constraint_evaluations (
    evaluation_id SERIAL PRIMARY KEY,
    constraint_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,
    validation_status VARCHAR(20) NOT NULL,
    violation_count INTEGER DEFAULT 0,
    -- ... evaluation results
);
```

### Schedule Generation Service Schema

```sql
-- Schedule generation requests
schedule_generation.schedule_generation_requests (
    request_id SERIAL PRIMARY KEY,
    request_name VARCHAR(100) NOT NULL,
    sport_id INTEGER NOT NULL,
    generation_parameters JSONB NOT NULL DEFAULT '{}',
    primary_objectives JSONB DEFAULT '[]',
    -- ... generation parameters
);

-- Algorithm configurations
schedule_generation.algorithm_configurations (
    config_id SERIAL PRIMARY KEY,
    algorithm_name VARCHAR(100) NOT NULL,
    algorithm_type VARCHAR(30) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    -- ... algorithm settings
);
```

## Data Migration Strategy

### Materialized Views for Cross-Service Data

Each microservice uses materialized views to cache frequently accessed data from other services:

```sql
-- Team availability service caches team-institution data
CREATE MATERIALIZED VIEW team_availability.institutions_teams_view AS
SELECT t.team_id, t.name AS team_name, i.name AS institution_name, ...
FROM teams t JOIN institutions i ON t.institution_id = i.institution_id;
```

### Data Consistency Patterns

1. **Eventual Consistency** - Updates propagate through event-driven mechanisms
2. **Materialized View Refresh** - Periodic updates to cached cross-service data
3. **Consistency Checks** - Automated validation of data integrity across services

### Migration Verification

Use built-in functions to verify migration success:

```sql
-- Check overall migration status
SELECT * FROM get_migration_status();

-- Verify microservice health
SELECT * FROM public.microservice_health;

-- Check data consistency
SELECT * FROM team_availability.check_data_consistency();
```

## API Migration

### Legacy API Compatibility (v1)

The v1 API maintains full backward compatibility by:

1. **Request Translation** - Converting legacy requests to microservice format
2. **Response Aggregation** - Combining microservice responses into legacy format
3. **Error Mapping** - Translating microservice errors to legacy error codes

Example legacy endpoint mapping:
```
GET /api/v1/schedules -> 
  - schedule-generation-service/schedules
  - team-availability-service/profiles
  - venue-management-service/venues
  - constraint-validation-service/constraints
```

### New Microservices API (v2)

The v2 API provides direct access to microservice capabilities:

```
GET /api/v2/team-availability/profiles
POST /api/v2/venue-management/venues/{id}/availability
POST /api/v2/constraint-validation/validate
POST /api/v2/schedule-generation/requests
```

## Performance Considerations

### Database Performance

1. **Indexing Strategy**
   - Primary keys and foreign keys automatically indexed
   - Composite indexes on frequently queried combinations
   - GIN indexes for JSONB columns
   - Partial indexes for filtered queries

2. **Materialized View Management**
   - Concurrent refresh to avoid blocking
   - Scheduled refresh based on data change patterns
   - Monitoring refresh performance

3. **Connection Pooling**
   - Separate connection pools per microservice
   - Optimized pool sizes based on service load
   - Connection timeout and retry strategies

### Query Optimization

Examples of optimized queries:

```sql
-- Efficient team availability lookup
SELECT tsp.*, tbd.start_date, tbd.end_date
FROM team_availability.team_scheduling_profiles tsp
LEFT JOIN team_availability.team_blackout_dates tbd ON tsp.team_id = tbd.team_id
WHERE tsp.team_id = $1 AND tsp.season_id = $2;

-- Venue availability check with spatial considerations
SELECT vp.*, voh.open_time, voh.close_time
FROM venue_management.venue_profiles vp
JOIN venue_management.venue_operational_hours voh ON vp.venue_id = voh.venue_id
WHERE vp.currently_available = true AND voh.day_of_week = $1;
```

## Monitoring and Maintenance

### Health Checks

Each microservice includes health check endpoints:

```sql
-- Database health check
SELECT 
    'team_availability' AS service,
    COUNT(*) AS table_count,
    pg_database_size('flextime_db') AS db_size
FROM information_schema.tables 
WHERE table_schema = 'team_availability';
```

### Maintenance Tasks

1. **Daily**
   - Refresh materialized views
   - Check constraint validation performance
   - Monitor API response times

2. **Weekly**
   - Analyze query performance
   - Review slow query logs
   - Update table statistics

3. **Monthly**
   - Validate data consistency across services
   - Review and optimize indexes
   - Clean up old migration logs

### Backup Strategy

Microservice-specific backup approach:

```bash
# Service-specific schema backups
pg_dump -U postgres -n team_availability flextime_db > team_availability_backup.sql
pg_dump -U postgres -n venue_management flextime_db > venue_management_backup.sql
pg_dump -U postgres -n constraint_validation flextime_db > constraint_validation_backup.sql
pg_dump -U postgres -n schedule_generation flextime_db > schedule_generation_backup.sql

# Shared data backup
pg_dump -U postgres -n shared_data flextime_db > shared_data_backup.sql
```

## Rollback Procedures

### Emergency Rollback

If migration issues occur, use these rollback procedures:

1. **Stop Application Services**
2. **Restore Database from Backup**
3. **Verify Data Integrity**
4. **Restart Monolithic Application**

### Partial Rollback

For service-specific issues:

```sql
-- Drop microservice schema
DROP SCHEMA IF EXISTS team_availability CASCADE;

-- Restore from service-specific backup
psql -U postgres -d flextime_db < team_availability_backup.sql
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Verify microservice user permissions
   - Check schema access grants
   - Validate row-level security policies

2. **Materialized View Refresh Failures**
   - Check for concurrent access conflicts
   - Verify underlying table structure
   - Monitor disk space availability

3. **Cross-Service Data Inconsistency**
   - Run consistency check functions
   - Verify event propagation
   - Check materialized view refresh status

### Debug Queries

```sql
-- Check user permissions
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    hasinserts, hasselects, hasupdates, hasdeletes
FROM pg_tables 
WHERE schemaname IN ('team_availability', 'venue_management');

-- Monitor materialized view status
SELECT 
    schemaname, 
    matviewname, 
    definition,
    ispopulated
FROM pg_matviews;

-- Check constraint violations
SELECT * FROM constraint_validation.constraint_violation_logs 
WHERE violation_timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
```

## Best Practices

### Development Workflow

1. **Local Development**
   - Use Docker Compose for consistent environments
   - Implement database seeding for test data
   - Maintain separate development and test schemas

2. **Testing Strategy**
   - Unit tests for individual service schemas
   - Integration tests for cross-service interactions
   - Performance tests for high-load scenarios

3. **Deployment Process**
   - Blue-green deployment for zero downtime
   - Schema version tracking and compatibility checks
   - Automated rollback triggers for failure detection

### Security Considerations

1. **Access Control**
   - Principle of least privilege for service users
   - Row-level security for multi-tenant data
   - Regular access audit and review

2. **Data Protection**
   - Encryption at rest for sensitive data
   - Secure connection strings and credentials
   - Regular security updates and patches

3. **Audit Logging**
   - Track all schema modifications
   - Log cross-service data access
   - Monitor for unusual access patterns

## Conclusion

The FlexTime microservices migration provides:

- **Improved Scalability** - Independent service scaling
- **Enhanced Maintainability** - Clear service boundaries
- **Better Performance** - Optimized schemas per service
- **Increased Reliability** - Fault isolation between services

The migration maintains full backward compatibility while providing a foundation for future microservices development and deployment strategies.