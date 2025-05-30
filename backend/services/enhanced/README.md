# FlexTime Enhanced Performance Monitor

A comprehensive real-time performance monitoring and auto-optimization system for the FlexTime scheduling engine.

## Overview

The Performance Monitor provides advanced monitoring capabilities including:

- **Real-time System Monitoring**: Memory, CPU, and resource utilization tracking
- **Response Time Analysis**: Endpoint performance monitoring with automatic slow request detection
- **Cache Performance Optimization**: Hit rate analysis and automatic size adjustment
- **Database Query Monitoring**: Query performance tracking and slow query detection
- **Memory Leak Detection**: Advanced memory trend analysis and leak identification
- **Auto-Optimization**: Dynamic algorithm selection and resource scaling
- **Comprehensive Reporting**: Detailed performance reports with recommendations

## Features

### 🔍 Real-time Monitoring

- **Memory Usage Tracking**: Heap utilization, memory growth trends, leak detection
- **CPU Utilization Analysis**: Load average monitoring, multi-core utilization
- **Response Time Measurement**: Per-endpoint timing with threshold alerts
- **Throughput Optimization**: Request rate tracking and capacity analysis
- **Cache Performance Analysis**: Hit/miss rates, efficiency scoring
- **Database Query Optimization**: Query timing, slow query identification

### 🚀 Auto-Optimization

- **Dynamic Algorithm Selection**: Automatic algorithm switching based on current load
- **Cache Size Adjustment**: Intelligent cache resizing based on hit rates and memory usage
- **Worker Pool Scaling**: Automatic scaling based on queue length and CPU usage
- **Resource Allocation Optimization**: Dynamic resource allocation based on demand

### 📊 Advanced Analytics

- **Performance Trend Analysis**: Historical performance tracking and trend identification
- **Bottleneck Detection**: Automatic identification of performance bottlenecks
- **Capacity Planning**: Resource usage predictions and scaling recommendations
- **Health Scoring**: Overall system health assessment with actionable insights

## Installation

The Performance Monitor is included in the enhanced services directory:

```javascript
const { monitor } = require('./backend/services/enhanced/PerformanceMonitor');
```

## Quick Start

### Basic Express Integration

```javascript
const express = require('express');
const { monitor } = require('./backend/services/enhanced/PerformanceMonitor');

const app = express();

// Add performance monitoring middleware
app.use(monitor.middleware);

// Set up performance alerts
monitor.on('performance:threshold-exceeded', (data) => {
    console.warn('Performance threshold exceeded:', data);
});

monitor.on('memory:leak-detected', (trend) => {
    console.error('Memory leak detected!', trend);
});

app.listen(3000);
```

### Database Query Monitoring

```javascript
// Wrap database queries for automatic monitoring
const originalQuery = db.query.bind(db);
const monitoredQuery = monitor.wrapDatabaseQuery(originalQuery);

// Use monitored query - performance is automatically tracked
const results = await monitoredQuery('SELECT * FROM teams WHERE sport = ?', ['basketball']);
```

### Cache Performance Tracking

```javascript
// Track cache hits and misses
const cacheKey = 'schedule:basketball:2024';
const cached = await cache.get(cacheKey);

if (cached) {
    monitor.trackCacheHit(cacheKey, true);
    return cached;
} else {
    monitor.trackCacheHit(cacheKey, false);
    const data = await generateSchedule();
    await cache.set(cacheKey, data);
    return data;
}
```

## Configuration

```javascript
const { PerformanceMonitor } = require('./backend/services/enhanced/PerformanceMonitor');

const customMonitor = new PerformanceMonitor({
    // Monitoring intervals (ms)
    systemMetricsInterval: 5000,
    memoryCheckInterval: 10000,
    responseTimeWindow: 60000,
    
    // Performance thresholds
    memoryThreshold: 0.85,        // 85% of heap
    cpuThreshold: 0.80,           // 80% CPU usage
    responseTimeThreshold: 2000,   // 2 seconds
    
    // Auto-optimization settings
    enableAutoOptimization: true,
    maxWorkers: 16,
    minWorkers: 2,
    maxCacheSize: 100000,
    minCacheSize: 10000
});
```

## API Reference

### Core Methods

#### `trackResponseTime(endpoint, startTime, endTime?)`
Track response time for an endpoint.

```javascript
const startTime = Date.now();
// ... process request ...
const responseTime = monitor.trackResponseTime('/api/schedules', startTime);
```

#### `trackCacheHit(key, hit)`
Track cache performance.

```javascript
monitor.trackCacheHit('schedule:key', true);  // Cache hit
monitor.trackCacheHit('schedule:key', false); // Cache miss
```

#### `trackDatabaseQuery(query, duration, params?)`
Track database query performance.

```javascript
monitor.trackDatabaseQuery('SELECT * FROM teams', 150, { limit: 10 });
```

#### `generatePerformanceReport()`
Generate comprehensive performance report.

```javascript
const report = monitor.generatePerformanceReport();
console.log('System Performance:', report);
```

#### `getMetricsSnapshot()`
Get current metrics snapshot.

```javascript
const metrics = monitor.getMetricsSnapshot();
```

### Events

The monitor emits various events for real-time notifications:

```javascript
// Performance threshold exceeded
monitor.on('performance:threshold-exceeded', (data) => {
    console.warn(`${data.type} usage: ${data.current * 100}%`);
});

// Memory leak detected
monitor.on('memory:leak-detected', (trend) => {
    console.error('Memory leak detected:', trend);
});

// Auto-optimization performed
monitor.on('optimization:performed', (optimizations) => {
    console.log('Optimizations applied:', optimizations);
});

// Slow response detected
monitor.on('performance:slow-response', (data) => {
    console.warn(`Slow response: ${data.endpoint} took ${data.responseTime}ms`);
});

// Slow database query
monitor.on('database:slow-query', (query) => {
    console.warn(`Slow query: ${query.query} took ${query.duration}ms`);
});
```

## Performance Metrics

### System Metrics
- **CPU Usage**: User time, system time, load average
- **Memory Usage**: RSS, heap used/total, external memory
- **Heap Statistics**: Size limit, available size, utilization

### Application Metrics
- **Response Times**: Per-endpoint timing, percentiles, trends
- **Throughput**: Requests per second, total requests
- **Error Rates**: Error count, error types, error trends

### Cache Metrics
- **Hit Rate**: Cache hits vs misses
- **Efficiency Score**: Combined hit rate and memory usage score
- **Size Tracking**: Current size, evictions, optimal size recommendations

### Database Metrics
- **Query Performance**: Average query time, slow queries
- **Connection Metrics**: Active connections, connection pool usage
- **Query Analysis**: Most frequent queries, optimization opportunities

## Auto-Optimization Features

### Dynamic Algorithm Selection

The monitor automatically selects the optimal scheduling algorithm based on current system conditions:

- **Memory-Efficient**: Used when memory usage > 80%
- **CPU-Optimized**: Used when CPU usage > 80%
- **Speed-Optimized**: Used when response times > threshold
- **Balanced**: Default algorithm for normal conditions

### Cache Optimization

Automatic cache size adjustment based on:
- Hit rate performance
- Memory pressure
- Request patterns
- System capacity

### Worker Pool Scaling

Intelligent worker scaling based on:
- Queue length
- CPU utilization
- Response time trends
- System capacity

## Performance Reports

### Health Check Report

```json
{
  "status": "healthy",
  "timestamp": 1638360000000,
  "uptime": 86400,
  "memory": {
    "usage": 0.65,
    "status": "good"
  },
  "cpu": {
    "usage": 0.45,
    "status": "good"
  },
  "performance": {
    "avgResponseTime": 180,
    "throughput": 125.5
  }
}
```

### Comprehensive Performance Report

```json
{
  "timestamp": 1638360000000,
  "uptime": 86400,
  "system": {
    "memory": {
      "current": 0.65,
      "trend": { "isIncreasing": false, "rate": 1024 },
      "leakDetected": false
    },
    "cpu": {
      "current": 0.45,
      "cores": 8,
      "loadAverage": [1.2, 1.1, 1.0]
    }
  },
  "performance": {
    "averageResponseTime": 180,
    "throughput": {
      "requestsPerSecond": 125.5,
      "totalRequests": 10840
    },
    "slowEndpoints": [
      { "endpoint": "/api/complex-schedule", "avgTime": 1250 }
    ]
  },
  "cache": {
    "hitRate": 0.82,
    "missRate": 0.18,
    "size": 45000,
    "efficiency": 0.78
  },
  "database": {
    "averageQueryTime": 95,
    "slowQueries": 3,
    "connections": 12
  },
  "optimization": {
    "algorithmsUsed": {
      "balanced": 145,
      "memory-efficient": 23,
      "speed-optimized": 67
    },
    "autoAdjustments": 12,
    "recommendations": [
      {
        "type": "cache",
        "priority": "medium",
        "message": "Consider increasing cache size for better hit rate"
      }
    ]
  }
}
```

## Best Practices

### 1. Monitoring Integration

```javascript
// Always use middleware for automatic tracking
app.use(monitor.middleware);

// Wrap database operations
const db = {
    query: monitor.wrapDatabaseQuery(originalQuery)
};

// Track cache operations consistently
function getCachedData(key) {
    const data = cache.get(key);
    monitor.trackCacheHit(key, !!data);
    return data;
}
```

### 2. Alert Configuration

```javascript
// Set up meaningful alerts
monitor.on('performance:threshold-exceeded', (data) => {
    if (data.type === 'memory' && data.current > 0.9) {
        // Critical memory usage - immediate action required
        alertOpsTeam('Critical memory usage', data);
        forceGarbageCollection();
    }
});

monitor.on('memory:leak-detected', (trend) => {
    // Memory leak - development team alert
    alertDevTeam('Memory leak detected', trend);
    captureHeapDump();
});
```

### 3. Performance Optimization

```javascript
// Use auto-optimization features
const monitor = new PerformanceMonitor({
    enableAutoOptimization: true,
    memoryThreshold: 0.8,
    cpuThreshold: 0.7
});

// Listen for optimization events
monitor.on('optimization:performed', (optimizations) => {
    logOptimizations(optimizations);
    updateMetricsDashboard();
});
```

## Testing

Run the test suite:

```bash
npm test -- backend/services/enhanced/tests/PerformanceMonitor.test.js
```

The test suite covers:
- System metrics collection
- Response time tracking
- Cache performance monitoring
- Database query tracking
- Memory leak detection
- Auto-optimization features
- Performance reporting

## Integration Examples

See `examples/performance-integration.js` for a complete example of integrating the Performance Monitor into a FlexTime scheduling application.

## Troubleshooting

### High Memory Usage

1. Check for memory leaks using the built-in detection
2. Review cache size and hit rates
3. Analyze memory growth trends
4. Force garbage collection if needed

### Slow Response Times

1. Identify slow endpoints in performance reports
2. Check database query performance
3. Analyze cache hit rates
4. Review algorithm selection

### High CPU Usage

1. Monitor load average trends
2. Check worker pool utilization
3. Review algorithm efficiency
4. Consider horizontal scaling

## License

This Performance Monitor is part of the FlexTime scheduling system and follows the same licensing terms.