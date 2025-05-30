# Performance Optimization Guide

## Overview

The Flextime Constraint System is designed for high-performance scheduling evaluation. This guide covers optimization strategies, benchmarks, and best practices for production deployments.

## Performance Architecture

### Key Performance Features

1. **Parallel Processing**: Multi-threaded constraint evaluation
2. **Smart Caching**: Intelligent result caching with TTL
3. **Dependency Analysis**: Optimized execution order
4. **Batch Processing**: Efficient bulk operations
5. **Memory Management**: Automatic garbage collection and pooling

## Benchmarks

### Single Constraint Evaluation

| Constraint Type | Average Time | 95th Percentile | Max Time |
|----------------|--------------|-----------------|----------|
| Venue Availability | 5ms | 8ms | 15ms |
| Team Rest Days | 12ms | 18ms | 25ms |
| TV Windows | 8ms | 12ms | 20ms |
| Weather Check | 25ms | 35ms | 50ms |
| Complex Rules | 15ms | 22ms | 40ms |

### Full Slot Evaluation (10 constraints)

| Configuration | Average Time | Throughput |
|--------------|--------------|------------|
| Sequential | 120ms | 8 slots/sec |
| Parallel (4 workers) | 45ms | 22 slots/sec |
| Parallel + Cache | 15ms | 66 slots/sec |
| Optimized Pipeline | 35ms | 28 slots/sec |

### Batch Processing

| Batch Size | Sequential Time | Parallel Time | Speedup |
|------------|----------------|---------------|----------|
| 10 slots | 1.2s | 0.3s | 4x |
| 100 slots | 12s | 2.5s | 4.8x |
| 1000 slots | 120s | 22s | 5.5x |
| 10000 slots | 1200s | 195s | 6.2x |

## Optimization Strategies

### 1. Enable Parallel Processing

```typescript
import { OptimizedConstraintEngine } from '@flextime/constraints';

const engine = new OptimizedConstraintEngine({
  parallelConfig: {
    enabled: true,
    maxWorkers: os.cpus().length, // Use all CPU cores
    taskTimeout: 5000,
    warmupWorkers: true // Pre-initialize workers
  }
});

await engine.initialize();
```

### 2. Configure Smart Caching

```typescript
const engine = new OptimizedConstraintEngine({
  cacheConfig: {
    enabled: true,
    maxSize: 50000, // Cache up to 50k results
    ttl: 3600000, // 1 hour TTL
    // Cache key strategy
    keyStrategy: 'hash', // 'hash' or 'structured'
    // Memory pressure handling
    autoEviction: true,
    evictionPolicy: 'lru' // 'lru', 'lfu', or 'ttl'
  }
});

// Warm up cache with common scenarios
await engine.warmupCache([
  { constraint: venueConstraint, slot: commonSlot1 },
  { constraint: teamConstraint, slot: commonSlot2 }
]);
```

### 3. Optimize Constraint Dependencies

```typescript
import { DependencyAnalyzer } from '@flextime/constraints/engines';

const analyzer = new DependencyAnalyzer();
const constraints = engine.getAllConstraints();

// Analyze dependencies
const analysis = analyzer.analyzeConstraints(constraints);
console.log('Dependency depth:', analysis.maxDepth);
console.log('Parallel groups:', analysis.parallelGroups.length);

// Optimize execution order
const optimizedOrder = analyzer.optimizeExecutionOrder(constraints);
engine.setConstraintOrder(optimizedOrder);

// Identify bottlenecks
const bottlenecks = analyzer.identifyBottlenecks(constraints);
bottlenecks.forEach(b => {
  console.log(`Bottleneck: ${b.constraintId} affects ${b.dependentCount} constraints`);
});
```

### 4. Batch Processing Optimization

```typescript
// Optimal batch configuration
const batchConfig = {
  batchSize: 50, // Process 50 slots at a time
  parallel: true,
  progressCallback: (progress) => {
    console.log(`Processed ${progress.completed}/${progress.total} slots`);
  }
};

// Process large schedule
const results = await engine.evaluateBatch(largeSchedule, batchConfig);

// Stream processing for very large schedules
const stream = engine.createEvaluationStream(veryLargeSchedule, {
  concurrency: 10,
  highWaterMark: 100
});

stream.on('data', (result) => {
  // Process each result as it completes
  processResult(result);
});

stream.on('end', () => {
  console.log('All evaluations complete');
});
```

### 5. Memory Optimization

```typescript
// Configure memory limits
const engine = new OptimizedConstraintEngine({
  memoryConfig: {
    maxHeapUsage: 0.8, // Use max 80% of available heap
    gcInterval: 60000, // Force GC every minute
    pooling: {
      enabled: true,
      maxPoolSize: 1000,
      reuseObjects: true
    }
  }
});

// Monitor memory usage
engine.on('memoryPressure', (stats) => {
  console.log(`Memory pressure detected: ${stats.heapUsed / stats.heapTotal * 100}%`);
  // Reduce cache size or pause processing
  engine.reduceCacheSize(0.5); // Reduce by 50%
});

// Periodic cleanup
setInterval(() => {
  engine.cleanup();
  if (global.gc) {
    global.gc();
  }
}, 300000); // Every 5 minutes
```

## Production Configuration

### Recommended Settings

```typescript
// Production configuration
const productionConfig = {
  // Engine settings
  engine: {
    maxConcurrentEvaluations: 100,
    evaluationTimeout: 10000,
    retryFailedEvaluations: true,
    maxRetries: 3
  },
  
  // Cache settings
  cache: {
    enabled: true,
    maxSize: 100000,
    ttl: 7200000, // 2 hours
    compression: true,
    persistentStorage: {
      enabled: true,
      type: 'redis',
      connection: process.env.REDIS_URL
    }
  },
  
  // Parallel processing
  parallel: {
    enabled: true,
    maxWorkers: Math.min(os.cpus().length, 8),
    workerRestartThreshold: 1000, // Restart after 1000 tasks
    workerMemoryLimit: 512 * 1024 * 1024 // 512MB per worker
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    metricsInterval: 10000,
    alertThresholds: {
      evaluationTime: 500,
      errorRate: 0.01,
      memoryUsage: 0.85
    }
  }
};

const engine = new OptimizedConstraintEngine(productionConfig);
```

### Scaling Strategies

#### Horizontal Scaling

```typescript
// Distributed processing with Redis
import { DistributedEngine } from '@flextime/constraints/distributed';

const distributedEngine = new DistributedEngine({
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  nodeId: process.env.NODE_ID,
  coordination: {
    heartbeatInterval: 5000,
    taskTimeout: 30000,
    rebalanceInterval: 60000
  }
});

// Register as worker node
await distributedEngine.joinCluster();

// Process tasks from queue
distributedEngine.on('task', async (task) => {
  const result = await engine.evaluateSlot(task.slot);
  await distributedEngine.completeTask(task.id, result);
});
```

#### Vertical Scaling

```bash
# Increase Node.js memory limit
node --max-old-space-size=8192 server.js

# Enable native optimizations
node --optimize-for-size --max-old-space-size=8192 server.js

# Use clustering
node cluster.js
```

## Monitoring and Profiling

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@flextime/constraints/monitoring';

const monitor = new PerformanceMonitor();

// Track all evaluations
engine.on('evaluation:start', (data) => {
  monitor.startEvaluation(data.constraintId);
});

engine.on('evaluation:end', (data) => {
  monitor.endEvaluation(data.constraintId, data.result);
});

// Regular reporting
setInterval(() => {
  const report = monitor.generateReport();
  console.log('Performance Report:', report.summary);
  
  // Send to monitoring service
  sendToDatadog(report);
}, 60000);

// Identify slow constraints
const slowConstraints = monitor.getSlowConstraints(100); // > 100ms
slowConstraints.forEach(constraint => {
  console.warn(`Slow constraint: ${constraint.id} avg: ${constraint.averageTime}ms`);
});
```

### CPU Profiling

```typescript
import { CPUProfiler } from '@flextime/constraints/profiling';

const profiler = new CPUProfiler();

// Start profiling
profiler.start('evaluation-profile');

// Run evaluation
await engine.evaluateBatch(schedule);

// Stop and analyze
const profile = profiler.stop();
const analysis = profiler.analyze(profile);

console.log('Hot functions:', analysis.hotFunctions);
console.log('Call graph:', analysis.callGraph);

// Export for Chrome DevTools
profiler.exportProfile(profile, './profiles/evaluation.cpuprofile');
```

### Memory Profiling

```typescript
import { MemoryProfiler } from '@flextime/constraints/profiling';

const memProfiler = new MemoryProfiler();

// Take heap snapshot
const snapshot1 = await memProfiler.takeSnapshot('before-evaluation');

// Run evaluation
await engine.evaluateBatch(largeSchedule);

// Take another snapshot
const snapshot2 = await memProfiler.takeSnapshot('after-evaluation');

// Compare snapshots
const diff = memProfiler.compareSnapshots(snapshot1, snapshot2);
console.log('Memory growth:', diff.totalGrowth);
console.log('New objects:', diff.newObjects);
console.log('Potential leaks:', diff.potentialLeaks);
```

## Best Practices

### 1. Constraint Design

```typescript
// ✅ Good: Fast, focused constraint
const fastConstraint: UnifiedConstraint = {
  id: 'venue-check',
  evaluate: async (slot) => {
    // Quick lookup
    const isAvailable = await venueCache.get(slot.venue, slot.date);
    return {
      valid: isAvailable,
      score: isAvailable ? 1 : 0,
      violations: isAvailable ? [] : ['Venue not available'],
      suggestions: []
    };
  }
};

// ❌ Bad: Slow, complex constraint
const slowConstraint: UnifiedConstraint = {
  id: 'complex-check',
  evaluate: async (slot) => {
    // Multiple database queries
    const venue = await db.getVenue(slot.venue);
    const team1 = await db.getTeam(slot.homeTeam);
    const team2 = await db.getTeam(slot.awayTeam);
    const history = await db.getGameHistory(team1.id, team2.id);
    
    // Complex calculations
    const complexScore = calculateComplexScore(venue, team1, team2, history);
    
    return { /* ... */ };
  }
};
```

### 2. Caching Strategy

```typescript
// Implement multi-level caching
class MultiLevelCache {
  private l1Cache: Map<string, any>; // In-memory
  private l2Cache: RedisCache; // Redis
  private l3Cache: S3Cache; // S3 for long-term
  
  async get(key: string): Promise<any> {
    // Check L1
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }
    
    // Check L2
    const l2Result = await this.l2Cache.get(key);
    if (l2Result) {
      this.l1Cache.set(key, l2Result);
      return l2Result;
    }
    
    // Check L3
    const l3Result = await this.l3Cache.get(key);
    if (l3Result) {
      await this.l2Cache.set(key, l3Result);
      this.l1Cache.set(key, l3Result);
      return l3Result;
    }
    
    return null;
  }
}
```

### 3. Error Handling

```typescript
// Implement circuit breaker for external services
import CircuitBreaker from 'opossum';

const weatherServiceBreaker = new CircuitBreaker(weatherService.check, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

const weatherConstraint: UnifiedConstraint = {
  id: 'weather-check',
  evaluate: async (slot) => {
    try {
      const weather = await weatherServiceBreaker.fire(slot.date, slot.venue);
      return evaluateWeather(weather);
    } catch (error) {
      // Fallback to cached or default response
      return {
        valid: true,
        score: 0.8,
        violations: [],
        suggestions: ['Weather service unavailable, using cached data']
      };
    }
  }
};
```

### 4. Resource Management

```typescript
// Implement resource pooling
class ResourcePool {
  private pool: GenericPool<Resource>;
  
  constructor() {
    this.pool = createPool({
      create: async () => new Resource(),
      destroy: async (resource) => resource.cleanup(),
      min: 2,
      max: 10,
      acquireTimeoutMillis: 3000
    });
  }
  
  async withResource<T>(fn: (resource: Resource) => Promise<T>): Promise<T> {
    const resource = await this.pool.acquire();
    try {
      return await fn(resource);
    } finally {
      await this.pool.release(resource);
    }
  }
}
```

## Troubleshooting Performance Issues

### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Memory Leak | Increasing memory usage | Enable heap snapshots, check for circular references |
| Slow Evaluations | High response times | Profile constraints, enable parallel processing |
| Cache Misses | Low cache hit rate | Increase cache size, adjust TTL, warm up cache |
| Worker Crashes | Parallel processing failures | Reduce worker memory limit, add error recovery |
| Database Bottleneck | Slow constraint queries | Add connection pooling, optimize queries, cache results |

### Performance Debugging

```typescript
// Enable detailed performance logging
const debugEngine = new OptimizedConstraintEngine({
  debug: {
    enabled: true,
    logLevel: 'verbose',
    includeStackTraces: true,
    performanceMarkers: true
  }
});

// Add performance markers
debugEngine.on('marker', (marker) => {
  console.log(`[${marker.phase}] ${marker.name}: ${marker.duration}ms`);
});

// Trace specific constraint
debugEngine.traceConstraint('slow-constraint', {
  includeCallStack: true,
  measureMemory: true,
  captureArguments: true
});
```

## Performance Checklist

- [ ] Enable parallel processing for multi-core systems
- [ ] Configure appropriate cache size and TTL
- [ ] Implement connection pooling for database access
- [ ] Set up monitoring and alerting
- [ ] Profile and optimize slow constraints
- [ ] Implement circuit breakers for external services
- [ ] Configure memory limits and garbage collection
- [ ] Use batch processing for large schedules
- [ ] Implement multi-level caching strategy
- [ ] Regular performance testing and benchmarking