# Constraint System V2 Database Integration

This directory contains the PostgreSQL/Neon database integration for the FlexTime constraint system v2.

## Directory Structure

```
database/
├── migrations/         # SQL migration files
├── models/            # Sequelize models
├── repositories/      # Data access layer
├── seeders/          # Initial data seeders
├── queries.ts        # Optimized SQL queries
└── README.md         # This file
```

## Database Schema

### Core Tables

1. **constraint_categories** - Hierarchical categorization of constraints
2. **constraint_templates** - Reusable constraint definitions
3. **constraint_instances** - Actual constraints applied to schedules
4. **constraint_evaluations** - Results of constraint checks
5. **constraint_conflicts** - Detected conflicts between constraints
6. **constraint_resolutions** - How conflicts were resolved
7. **constraint_cache** - Performance optimization cache
8. **constraint_metrics** - System performance metrics

### Key Features

- **UUID Primary Keys** - For better distributed system compatibility
- **JSONB Columns** - For flexible parameter and data storage
- **GIN Indexes** - For fast JSONB queries
- **Materialized Views** - For frequently accessed statistics
- **Stored Procedures** - For complex operations

## Setup Instructions

### 1. Run Migrations

```bash
# From the backend directory
npx sequelize-cli db:migrate --migrations-path src/constraints/v2/database/migrations
```

Or manually execute the SQL files:

```bash
psql $DATABASE_URL -f src/constraints/v2/database/migrations/001_create_constraint_tables.sql
psql $DATABASE_URL -f src/constraints/v2/database/migrations/002_create_constraint_functions.sql
```

### 2. Seed Initial Data

```bash
npx sequelize-cli db:seed:all --seeders-path src/constraints/v2/database/seeders
```

### 3. Test Connection

```javascript
const { testConnection } = require('./models');

async function test() {
  const connected = await testConnection();
  console.log('Database connected:', connected);
}

test();
```

## Usage Examples

### Using the Repository

```javascript
const constraintRepo = require('./repositories/ConstraintRepository');

// Create a new constraint from template
const constraint = await constraintRepo.createInstance({
  template_id: 'template-uuid',
  schedule_id: 123,
  parameters: {
    min_days: 3
  },
  weight: 80,
  priority: 8,
  scope_type: 'sport',
  scope_data: { sport_id: 'Basketball' }
});

// Get active constraints for a schedule
const activeConstraints = await constraintRepo.getActiveConstraintsForSchedule(123);

// Detect conflicts
const conflicts = await constraintRepo.detectAndSaveConflicts(123);

// Get evaluation summary
const summary = await constraintRepo.getScheduleSummary(123);
```

### Using Optimized Queries

```javascript
const { ConstraintQueryManager } = require('./queries');
const { sequelize } = require('./models');

const queryManager = new ConstraintQueryManager(sequelize);
await queryManager.prepare();

// Get constraint impact analysis
const impacts = await queryManager.execute(
  'getConstraintImpactAnalysis',
  [scheduleId, 10]
);

// Get performance metrics
const metrics = await queryManager.execute(
  'getPerformanceMetrics',
  [scheduleId, 'hour', ['evaluation_time', 'satisfaction_score'], startDate, endDate, null]
);
```

### Using Models Directly

```javascript
const { ConstraintTemplate, ConstraintInstance } = require('./models');

// Search templates
const templates = await ConstraintTemplate.searchTemplates('rest', {
  type: 'hard',
  sport: 'Basketball'
});

// Get popular templates
const popular = await ConstraintTemplate.getPopularTemplates(5);

// Create instance from template
const instance = await ConstraintInstance.createFromTemplate(templateId, {
  schedule_id: 123,
  parameters: { min_days: 2 },
  weight: 90
});
```

## Performance Optimization

### Caching Strategy

The system uses a multi-level caching approach:

1. **Database Cache** - `constraint_cache` table for expensive computations
2. **Query Cache** - Prepared statements for frequently used queries
3. **Materialized Views** - Pre-computed statistics

### Cache Usage

```javascript
// Using cache in repository
const result = await constraintRepo.getCached(
  'evaluation:schedule:123',
  async () => {
    // Expensive computation
    return await evaluateAllConstraints(123);
  }
);

// Invalidate cache when data changes
await constraintRepo.invalidateCache({
  constraints: [instanceId],
  games: [gameId1, gameId2]
});
```

### Performance Monitoring

```javascript
// Record metrics
await constraintRepo.recordMetric({
  type: 'evaluation_time',
  name: 'constraint_evaluation',
  value: 125.5, // milliseconds
  constraint_id: instanceId
});

// Get performance metrics
const perfMetrics = await constraintRepo.getMetricTimeSeries(
  'evaluation_time',
  {
    start_date: new Date('2024-01-01'),
    granularity: 'hour'
  }
);
```

## Maintenance

### Regular Tasks

1. **Clean expired cache** - Run daily
```javascript
const deleted = await constraintRepo.cleanupCache();
console.log(`Deleted ${deleted} expired cache entries`);
```

2. **Archive old metrics** - Run weekly
```javascript
const archived = await constraintRepo.cleanupOldMetrics(90); // 90 days retention
```

3. **Refresh materialized views** - Run hourly
```javascript
await constraintRepo.refreshMaterializedView();
```

### Database Monitoring

Monitor these key metrics:
- Cache hit rate (target: >80%)
- Average evaluation time (<100ms)
- Conflict detection time (<500ms)
- Active constraint count per schedule
- Storage size growth

## Troubleshooting

### Common Issues

1. **Slow constraint evaluation**
   - Check indexes: `\d constraint_evaluations`
   - Analyze query plans: Use `executeWithExplain`
   - Review cache hit rates

2. **High conflict count**
   - Use conflict clustering query
   - Review constraint priorities
   - Check for overly restrictive constraints

3. **Cache misses**
   - Increase cache TTL for stable data
   - Review cache key generation
   - Check invalidation patterns

### Debug Queries

```sql
-- Check constraint evaluation performance
SELECT 
  ci.instance_id,
  ct.name,
  AVG(ce.evaluation_time_ms) as avg_time,
  COUNT(*) as eval_count
FROM constraint_instances ci
JOIN constraint_templates ct ON ci.template_id = ct.template_id
JOIN constraint_evaluations ce ON ci.instance_id = ce.instance_id
WHERE ce.evaluated_at > NOW() - INTERVAL '1 hour'
GROUP BY ci.instance_id, ct.name
ORDER BY avg_time DESC;

-- Find cache bottlenecks
SELECT 
  cache_type,
  COUNT(*) as entries,
  AVG(hit_count) as avg_hits,
  SUM(computation_time_ms) as total_compute_time
FROM constraint_cache
WHERE expires_at > NOW()
GROUP BY cache_type
ORDER BY total_compute_time DESC;
```

## Migration from V1

If migrating from the v1 constraint system:

1. Export existing constraints
2. Map to new template structure
3. Import using bulk operations
4. Validate constraint behavior
5. Update application code

See `migration/` directory for detailed migration scripts.

## Contributing

When adding new features:

1. Add migrations for schema changes
2. Update models with new fields/methods
3. Add repository methods for data access
4. Create optimized queries for complex operations
5. Update seeders if new reference data needed
6. Add tests for all new functionality
7. Update this README

## References

- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Neon Database Docs](https://neon.tech/docs/introduction)