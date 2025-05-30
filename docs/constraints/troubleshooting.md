# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Issue: Module not found errors

```bash
Error: Cannot find module '@flextime/constraints'
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# If using TypeScript, rebuild
npm run build
```

#### Issue: TypeScript compilation errors

```
TS2307: Cannot find module '@flextime/constraints/types' or its corresponding type declarations.
```

**Solution:**
```bash
# Ensure TypeScript is installed
npm install --save-dev typescript @types/node

# Check tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Runtime Errors

#### Issue: "Maximum call stack size exceeded"

**Cause:** Circular dependencies in constraints

**Solution:**
```typescript
import { DependencyAnalyzer } from '@flextime/constraints/engines';

const analyzer = new DependencyAnalyzer();
const constraints = engine.getAllConstraints();

// Detect circular dependencies
const cycles = analyzer.detectCycles(constraints);
if (cycles.length > 0) {
  console.error('Circular dependencies detected:', cycles);
  // Remove or fix circular dependencies
}
```

#### Issue: "Worker terminated unexpectedly"

**Cause:** Worker memory limit exceeded or unhandled error

**Solution:**
```typescript
// Increase worker memory limit
const engine = new OptimizedConstraintEngine({
  parallelConfig: {
    workerMemoryLimit: 1024 * 1024 * 1024, // 1GB
    workerRestartOnError: true,
    maxWorkerRestarts: 3
  }
});

// Add error handling
engine.on('worker:error', (error) => {
  console.error('Worker error:', error);
  // Log to monitoring service
});
```

#### Issue: "Evaluation timeout"

**Cause:** Constraint taking too long to evaluate

**Solution:**
```typescript
// Increase timeout
const engine = new ConstraintEngine({
  evaluationTimeout: 30000 // 30 seconds
});

// Or optimize the constraint
const optimizedConstraint = {
  id: 'slow-constraint',
  evaluate: async (slot) => {
    // Add caching
    const cached = await cache.get(slot.id);
    if (cached) return cached;
    
    // Optimize database queries
    const data = await db.query(
      'SELECT * FROM venues WHERE id = $1',
      [slot.venue],
      { timeout: 5000 }
    );
    
    const result = processData(data);
    await cache.set(slot.id, result, 3600);
    return result;
  }
};
```

### Performance Issues

#### Issue: Slow constraint evaluation

**Diagnosis:**
```typescript
import { PerformanceMonitor } from '@flextime/constraints/monitoring';

const monitor = new PerformanceMonitor();
monitor.startTracking('evaluation');

const result = await engine.evaluateSlot(slot);

const metrics = monitor.endTracking('evaluation');
console.log('Slow constraints:', monitor.getSlowConstraints(100));
```

**Solutions:**

1. **Enable caching:**
```typescript
const engine = new OptimizedConstraintEngine({
  cacheConfig: {
    enabled: true,
    maxSize: 10000,
    ttl: 3600000
  }
});
```

2. **Optimize database queries:**
```typescript
// Bad: N+1 query problem
const teams = await db.query('SELECT * FROM teams');
for (const team of teams) {
  const games = await db.query(
    'SELECT * FROM games WHERE team_id = $1',
    [team.id]
  );
}

// Good: Single query with join
const teamsWithGames = await db.query(`
  SELECT t.*, g.*
  FROM teams t
  LEFT JOIN games g ON g.team_id = t.id
`);
```

3. **Use parallel processing:**
```typescript
await engine.enableParallelProcessing({
  maxWorkers: 4,
  strategy: 'round-robin'
});
```

#### Issue: High memory usage

**Diagnosis:**
```typescript
const memoryStats = engine.getMemoryUsage();
console.log('Heap used:', memoryStats.heapUsed / 1024 / 1024, 'MB');
console.log('Cache size:', memoryStats.cacheSize);
```

**Solutions:**

1. **Limit cache size:**
```typescript
engine.setCacheConfig({
  maxSize: 5000,
  evictionPolicy: 'lru',
  compressionEnabled: true
});
```

2. **Enable garbage collection:**
```typescript
// Run with --expose-gc flag
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 60000);
```

3. **Stream large datasets:**
```typescript
// Instead of loading all at once
const allSlots = await db.query('SELECT * FROM slots');

// Stream processing
const stream = db.queryStream('SELECT * FROM slots');
stream.on('data', async (slot) => {
  await engine.evaluateSlot(slot);
});
```

### Configuration Issues

#### Issue: Constraints not loading

**Diagnosis:**
```typescript
const constraints = engine.getAllConstraints();
console.log('Loaded constraints:', constraints.length);
console.log('Constraint IDs:', constraints.map(c => c.id));
```

**Solutions:**

1. **Check constraint registration:**
```typescript
// Verify constraints are properly registered
const footballConstraints = new EnhancedFootballConstraints();
const constraints = footballConstraints.getAllConstraints();

constraints.forEach(constraint => {
  try {
    engine.addConstraint(constraint);
    console.log(`Loaded: ${constraint.id}`);
  } catch (error) {
    console.error(`Failed to load ${constraint.id}:`, error);
  }
});
```

2. **Validate constraint format:**
```typescript
function validateConstraint(constraint: any): boolean {
  const required = ['id', 'type', 'sport', 'name', 'evaluate'];
  const missing = required.filter(field => !constraint[field]);
  
  if (missing.length > 0) {
    console.error(`Constraint missing fields: ${missing.join(', ')}`);
    return false;
  }
  
  if (typeof constraint.evaluate !== 'function') {
    console.error('Constraint evaluate must be a function');
    return false;
  }
  
  return true;
}
```

#### Issue: Cache not working

**Diagnosis:**
```typescript
const cacheStats = engine.getCacheStats();
console.log('Cache hit rate:', cacheStats.hitRate);
console.log('Cache size:', cacheStats.size);
console.log('Evictions:', cacheStats.evictions);
```

**Solutions:**

1. **Verify cache is enabled:**
```typescript
const config = engine.getConfiguration();
console.log('Cache enabled:', config.cache.enabled);
```

2. **Check cache key generation:**
```typescript
// Debug cache keys
engine.on('cache:miss', (key) => {
  console.log('Cache miss for key:', key);
});

engine.on('cache:hit', (key) => {
  console.log('Cache hit for key:', key);
});
```

### API Issues

#### Issue: API endpoint returning 500 errors

**Diagnosis:**
```typescript
// Add error middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request:', req.body);
  
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

**Solutions:**

1. **Add input validation:**
```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/constraints/evaluate',
  [
    body('slot.id').notEmpty(),
    body('slot.date').isISO8601(),
    body('slot.venue').notEmpty(),
    body('slot.sport').isIn(['football', 'basketball', 'baseball'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Process request
  }
);
```

2. **Add request logging:**
```typescript
import morgan from 'morgan';

app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
```

#### Issue: CORS errors

**Solution:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Debugging Techniques

#### 1. Enable Debug Logging

```typescript
// Set environment variable
process.env.DEBUG = 'flextime:*';

// Or configure engine
const engine = new ConstraintEngine({
  debug: {
    enabled: true,
    logLevel: 'verbose',
    logConstraintEvaluation: true,
    logCacheOperations: true
  }
});
```

#### 2. Use Performance Profiling

```typescript
import { performance } from 'perf_hooks';

const marks = new Map();

function startMark(name: string) {
  marks.set(name, performance.now());
}

function endMark(name: string) {
  const start = marks.get(name);
  if (start) {
    const duration = performance.now() - start;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    marks.delete(name);
  }
}

// Usage
startMark('evaluation');
await engine.evaluateSlot(slot);
endMark('evaluation');
```

#### 3. Memory Leak Detection

```typescript
import heapdump from 'heapdump';

// Take heap snapshots
let snapshotCount = 0;
setInterval(() => {
  heapdump.writeSnapshot(`./heap-${snapshotCount++}.heapsnapshot`);
}, 300000); // Every 5 minutes

// Monitor memory growth
let lastHeapUsed = 0;
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapGrowth = memUsage.heapUsed - lastHeapUsed;
  
  if (heapGrowth > 50 * 1024 * 1024) { // 50MB growth
    console.warn('Significant heap growth:', heapGrowth / 1024 / 1024, 'MB');
  }
  
  lastHeapUsed = memUsage.heapUsed;
}, 60000);
```

#### 4. Constraint Debugging

```typescript
// Wrap constraint for debugging
function debugConstraint(constraint: UnifiedConstraint): UnifiedConstraint {
  return {
    ...constraint,
    evaluate: async (slot) => {
      console.log(`[${constraint.id}] Evaluating slot ${slot.id}`);
      const start = Date.now();
      
      try {
        const result = await constraint.evaluate(slot);
        const duration = Date.now() - start;
        
        console.log(`[${constraint.id}] Completed in ${duration}ms`);
        console.log(`[${constraint.id}] Result:`, result);
        
        return result;
      } catch (error) {
        console.error(`[${constraint.id}] Error:`, error);
        throw error;
      }
    }
  };
}

// Use debugging wrapper
engine.addConstraint(debugConstraint(myConstraint));
```

### Getting Help

#### 1. Gather Diagnostic Information

```typescript
// Generate diagnostic report
const diagnostics = {
  version: engine.getVersion(),
  configuration: engine.getConfiguration(),
  constraints: engine.getAllConstraints().map(c => ({
    id: c.id,
    type: c.type,
    sport: c.sport,
    priority: c.priority
  })),
  performance: engine.getPerformanceMetrics(),
  memory: process.memoryUsage(),
  platform: {
    node: process.version,
    platform: process.platform,
    arch: process.arch
  }
};

console.log(JSON.stringify(diagnostics, null, 2));
```

#### 2. Create Minimal Reproduction

```typescript
// Minimal test case
import { ConstraintEngine } from '@flextime/constraints';

const engine = new ConstraintEngine();

// Add minimal constraint
engine.addConstraint({
  id: 'test-constraint',
  type: 'test',
  sport: 'all',
  name: 'Test Constraint',
  version: '1.0.0',
  priority: 'medium',
  evaluate: async (slot) => ({
    valid: true,
    score: 1,
    violations: [],
    suggestions: []
  }),
  metadata: {
    author: 'test',
    tags: ['test'],
    description: 'Test',
    created: new Date(),
    updated: new Date()
  }
});

// Test with minimal slot
const result = await engine.evaluateSlot({
  id: 'test-slot',
  date: new Date(),
  time: '14:00',
  duration: 180,
  venue: 'Test Venue',
  sport: 'football',
  gameId: 'test-game',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  conference: 'Test',
  constraints: []
});

console.log('Result:', result);
```

#### 3. Contact Support

- **GitHub Issues**: https://github.com/flextime/flextime/issues
- **Stack Overflow**: Tag with `flextime-constraints`
- **Email**: support@flextime.com
- **Slack**: #flextime-support

Include:
- Diagnostic report
- Error messages and stack traces
- Minimal reproduction code
- Expected vs actual behavior
- Environment details