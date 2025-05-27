# Monitoring Agents

This module provides monitoring agents for database integrity and system performance.

## Overview

The Monitoring Agents extend the base multi-agent system to provide robust monitoring capabilities across different aspects of the FlexTime platform. These agents detect issues, generate alerts, create detailed reports, and in some cases automatically fix problems.

## Available Monitoring Agents

### 1. Data Integrity Monitoring Agent

The Data Integrity Monitoring Agent continuously monitors the database to ensure data quality and consistency.

#### Key Features:
- Detects missing references between tables
- Identifies null values in required fields
- Finds data type mismatches
- Detects duplicate entries
- Validates logical data consistency
- Checks for data outside acceptable boundaries
- Validates schema compliance
- Provides detailed reports and alerts
- Auto-fixes certain issues when possible

#### Usage:

```javascript
const { createMonitoringAgent } = require('./agents/monitoring');

// Create a data integrity monitoring agent
const dataIntegrityAgent = createMonitoringAgent('data_integrity', {
  // Configuration options
  schedule: {
    frequency: 'hourly',
    timeUnit: 'hour',
    interval: 6
  },
  autoFix: true,
  autoFixTypes: ['missing_reference', 'null_value', 'duplicate_entry'],
  alertThreshold: 'high',
  dbConfig: {
    // Database connection configuration
  }
}, mcpConnector);

// Initialize and start the agent
await dataIntegrityAgent.initialize();

// Get current issues
const issues = await dataIntegrityAgent.getIssues({
  severity: 'high',
  status: 'new'
});

// Generate a report
const report = await dataIntegrityAgent.generateReport({
  format: 'markdown'
});
```

### 2. Performance Monitoring Agent

The Performance Monitoring Agent tracks system performance metrics, identifies bottlenecks, and alerts on degraded performance.

#### Key Features:
- Monitors API endpoint response times
- Tracks database query performance
- Monitors connection pool usage
- Tracks system resource usage (CPU, memory, disk, network)
- Monitors request throughput
- Detects performance anomalies
- Identifies bottlenecks
- Provides detailed metrics and reporting
- Configurable thresholds and alerts

#### Usage:

```javascript
const { createMonitoringAgent } = require('./agents/monitoring');

// Create a performance monitoring agent
const performanceAgent = createMonitoringAgent('performance', {
  // Configuration options
  schedule: {
    frequency: 'every minute',
    timeUnit: 'minute',
    interval: 1
  },
  thresholds: {
    api: {
      responseTime: 1000, // ms
      errorRate: 0.05 // 5%
    },
    database: {
      queryTime: 500, // ms
      connectionUsage: 0.9 // 90%
    },
    system: {
      memoryUsage: 0.85, // 85%
      cpuUsage: 0.9, // 90%
      diskUsage: 0.9 // 90%
    }
  },
  // Other configuration...
}, mcpConnector);

// Initialize and start the agent
await performanceAgent.initialize();

// Record an API metric
performanceAgent.recordApiMetric('GET /api/users', {
  responseTime: 125, // ms
  statusCode: 200,
  error: false
});

// Record a database metric
performanceAgent.recordDatabaseMetric('SELECT', {
  executionTime: 75, // ms
  success: true
});

// Get current performance metrics
const metrics = await performanceAgent.getPerformanceMetrics({
  calculateAggregations: true
});
```

## Common Features

Both monitoring agents share these common features:

1. **Issue Tracking**: Detect, log, and track issues with severity levels
2. **Reporting**: Generate detailed reports in various formats (JSON, text, markdown)
3. **Alerting**: Send alerts for high-priority issues
4. **Scheduled Scans**: Run monitoring scans at configurable intervals
5. **Historical Data**: Maintain historical metrics and issue tracking
6. **Filtering**: Filter and query issues based on various criteria

## Architecture

Monitoring agents extend the base monitoring agent, which itself extends the base agent class:

```
Agent
  └── BaseMonitoringAgent
        ├── DataIntegrityAgent
        └── PerformanceMonitoringAgent
```

The monitoring architecture is designed to be extensible, allowing for additional monitoring agents to be added in the future.

## Data Integrity Checks

The Data Integrity Agent performs the following checks:

### Missing References

Checks for foreign key references that point to non-existent records.

### Null Values

Checks for NULL values in fields that shouldn't allow them.

### Type Mismatches

Checks for data that doesn't match the expected type.

### Duplicate Entries

Checks for duplicate values in unique fields.

### Inconsistent Data

Checks for logically inconsistent data, such as end dates before start dates.

### Data Boundaries

Checks for data outside acceptable ranges, such as negative quantities.

### Schema Compliance

Verifies that the database schema matches expectations.

## Performance Monitoring Metrics

The Performance Monitoring Agent tracks these key metrics:

### API Performance
- Response times (average, p95, min, max)
- Error rates
- Request throughput
- Status code distribution

### Database Performance
- Query execution times
- Query throughput
- Error rates by query type
- Connection pool utilization

### System Resources
- CPU usage (overall and by core)
- Memory usage (total, used, free)
- Disk usage and I/O performance
- Network utilization

### Issues Detected
- Slow API responses
- Slow database queries
- Resource bottlenecks
- Error rate spikes
- Connection pool saturation

## Database Compatibility

The monitoring agents are designed to work with Neon DB (PostgreSQL), but can be extended to support other database systems.