# Getting Started with Flextime Constraints

## Installation

### NPM Installation

```bash
npm install @flextime/constraints
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/flextime/flextime.git
cd flextime/backend/src/constraints/v2

# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

## Basic Usage

### 1. Initialize the Constraint Engine

```typescript
import { ConstraintEngine } from '@flextime/constraints';

const engine = new ConstraintEngine({
  // Optional configuration
  enableCaching: true,
  maxCacheSize: 1000,
  parallelProcessing: true,
  maxWorkers: 4
});
```

### 2. Load Sport-Specific Constraints

```typescript
import { 
  EnhancedFootballConstraints,
  EnhancedBasketballConstraints 
} from '@flextime/constraints/sports';

// Load football constraints
const footballConstraints = new EnhancedFootballConstraints();
footballConstraints.getAllConstraints().forEach(constraint => {
  engine.addConstraint(constraint);
});

// Load basketball constraints
const basketballConstraints = new EnhancedBasketballConstraints();
basketballConstraints.getAllConstraints().forEach(constraint => {
  engine.addConstraint(constraint);
});
```

### 3. Evaluate a Schedule Slot

```typescript
import { ScheduleSlot } from '@flextime/constraints/types';

const slot: ScheduleSlot = {
  id: 'game-001',
  date: new Date('2025-09-06'),
  time: '14:00',
  duration: 210, // minutes
  venue: 'Memorial Stadium',
  sport: 'football',
  gameId: 'fb-kansas-kstate-2025',
  homeTeam: 'Kansas',
  awayTeam: 'K-State',
  conference: 'Big 12',
  tvInfo: {
    network: 'ESPN',
    startTime: '14:00',
    duration: 210
  },
  requiredResources: ['Field', 'Lights', 'TV Equipment'],
  constraints: [] // Optional: specific constraint IDs to evaluate
};

const result = await engine.evaluateSlot(slot);

console.log(`Valid: ${result.overallValid}`);
console.log(`Score: ${result.overallScore}`);
console.log(`Evaluation Time: ${result.totalTime}ms`);

// Check individual constraint results
result.results.forEach(constraintResult => {
  console.log(`
  Constraint: ${constraintResult.constraintId}
  Valid: ${constraintResult.result.valid}
  Score: ${constraintResult.result.score}
  `);
  
  if (constraintResult.result.violations.length > 0) {
    console.log('  Violations:');
    constraintResult.result.violations.forEach(v => 
      console.log(`    - ${v}`)
    );
  }
  
  if (constraintResult.result.suggestions.length > 0) {
    console.log('  Suggestions:');
    constraintResult.result.suggestions.forEach(s => 
      console.log(`    - ${s}`)
    );
  }
});
```

### 4. Batch Evaluation

```typescript
// Evaluate multiple slots at once
const slots: ScheduleSlot[] = [
  { /* slot 1 */ },
  { /* slot 2 */ },
  { /* slot 3 */ }
];

const results = await engine.evaluateBatch(slots);

// Find conflicts across the batch
const conflicts = results.filter(r => !r.overallValid);
console.log(`Found ${conflicts.length} conflicts in ${slots.length} slots`);
```

## Working with Templates

### Using Built-in Templates

```typescript
import { ConstraintTemplateSystem, StandardTemplates } from '@flextime/constraints/templates';

const templateSystem = new ConstraintTemplateSystem();

// Register standard templates
Object.entries(StandardTemplates).forEach(([id, template]) => {
  templateSystem.registerTemplate(id, template);
});

// Create a constraint from template
const venueConstraint = templateSystem.createFromTemplate('venue_availability', {
  venueId: 'memorial-stadium',
  sport: 'football',
  maintenanceWindows: [
    { start: '06:00', end: '08:00', days: ['Monday', 'Wednesday'] }
  ]
});

engine.addConstraint(venueConstraint);
```

### Creating Custom Templates

```typescript
templateSyst..registerTemplate('custom_tv_window', {
  name: 'Custom TV Window',
  description: 'Ensures games fit within specific TV windows',
  parameters: [
    {
      name: 'network',
      type: 'string',
      required: true,
      description: 'TV network name'
    },
    {
      name: 'allowedWindows',
      type: 'array',
      required: true,
      description: 'Array of {day, startTime, endTime}'
    }
  ],
  generator: (params) => ({
    id: `tv-window-${params.network}-${Date.now()}`,
    type: 'broadcast',
    sport: 'all',
    name: `${params.network} TV Window`,
    version: '1.0.0',
    priority: 'high',
    evaluate: async (slot) => {
      const slotDay = slot.date.toLocaleDateString('en-US', { weekday: 'long' });
      const slotTime = parseInt(slot.time.split(':')[0]);
      
      const validWindow = params.allowedWindows.some(window => 
        window.day === slotDay &&
        slotTime >= parseInt(window.startTime.split(':')[0]) &&
        slotTime <= parseInt(window.endTime.split(':')[0])
      );
      
      return {
        valid: validWindow,
        score: validWindow ? 1.0 : 0.0,
        violations: validWindow ? [] : [
          `Game not in ${params.network} broadcast window`
        ],
        suggestions: validWindow ? [] : [
          `Move to one of ${params.network}'s broadcast windows`
        ]
      };
    },
    metadata: {
      author: 'custom',
      tags: ['tv', 'broadcast', 'window'],
      description: params.description || 'Custom TV window constraint',
      created: new Date(),
      updated: new Date()
    }
  })
});

// Use the custom template
const espnWindow = templateSystem.createFromTemplate('custom_tv_window', {
  network: 'ESPN',
  allowedWindows: [
    { day: 'Saturday', startTime: '12:00', endTime: '23:00' },
    { day: 'Thursday', startTime: '19:00', endTime: '22:00' }
  ]
});
```

## Conflict Resolution

### Detecting Conflicts

```typescript
import { SmartConflictResolver } from '@flextime/constraints/resolvers';

const resolver = new SmartConflictResolver();

// Detect conflicts in a schedule
const conflicts = await resolver.detectConflicts(slots);

conflicts.forEach(conflict => {
  console.log(`
  Conflict Type: ${conflict.type}
  Severity: ${conflict.severity}
  Affected Slots: ${conflict.affectedSlots.join(', ')}
  Description: ${conflict.description}
  `);
});
```

### Resolving Conflicts

```typescript
// Get resolution suggestions
const resolutions = await resolver.resolveConflicts(conflicts, slots);

resolutions.forEach(resolution => {
  console.log(`
  Conflict ID: ${resolution.conflictId}
  Resolution Type: ${resolution.resolution.type}
  Confidence: ${resolution.confidence}
  Impact: ${resolution.impact}
  `);
  
  if (resolution.resolution.type === 'reschedule') {
    console.log(`  New Time: ${resolution.resolution.newTime}`);
    console.log(`  New Date: ${resolution.resolution.newDate}`);
  }
});

// Apply resolutions
const updatedSchedule = resolver.applyResolutions(slots, resolutions);
```

## Performance Optimization

### Enable Caching

```typescript
import { OptimizedConstraintEngine } from '@flextime/constraints/engines';

const optimizedEngine = new OptimizedConstraintEngine({
  cacheConfig: {
    enabled: true,
    maxSize: 10000,
    ttl: 3600000 // 1 hour
  },
  parallelConfig: {
    enabled: true,
    maxWorkers: 8,
    taskTimeout: 5000
  }
});

await optimizedEngine.initialize();
```

### Monitor Performance

```typescript
import { RealTimeConstraintMonitor } from '@flextime/constraints/monitoring';

const monitor = new RealTimeConstraintMonitor();
monitor.start();

// Set performance thresholds
monitor.setThreshold('evaluationTime', 100); // Alert if > 100ms
monitor.setThreshold('errorRate', 0.05); // Alert if > 5% errors

// Listen for alerts
monitor.onAlert((alert) => {
  console.error(`Performance Alert: ${alert.message}`);
  // Send to monitoring service
});

// Track custom metrics
monitor.startTracking('batch-evaluation');
// ... perform operations ...
monitor.endTracking('batch-evaluation', { itemCount: 100 });

// Get performance report
const report = monitor.generateReport();
console.log(report.summary);
```

## Machine Learning Features

### Enable ML Optimization

```typescript
import { MLConstraintOptimizer } from '@flextime/constraints/ml';

const mlOptimizer = new MLConstraintOptimizer();
await mlOptimizer.initialize();

// Train on historical data
const historicalFeedback = [
  {
    constraintId: 'venue-availability',
    slotId: 'game-001',
    originalScore: 0.8,
    actualOutcome: 'successful',
    userRating: 5
  },
  // ... more feedback
];

await mlOptimizer.trainOnFeedback(historicalFeedback);

// Get optimized weights
const weights = await mlOptimizer.getOptimizedWeights();
engine.updateConstraintWeights(weights);

// Predict violations
const predictions = await mlOptimizer.predictViolations(slot);
console.log(`Violation likelihood: ${predictions.confidence}`);
console.log(`Risk factors: ${predictions.riskFactors.join(', ')}`);
```

## API Integration

### REST API Endpoints

```typescript
// Express.js example
import express from 'express';
import { constraintRoutes } from '@flextime/constraints/api';

const app = express();
app.use(express.json());
app.use('/api/constraints', constraintRoutes);

// Available endpoints:
// POST   /api/constraints/evaluate       - Evaluate single slot
// POST   /api/constraints/evaluate-batch - Evaluate multiple slots
// GET    /api/constraints               - List all constraints
// GET    /api/constraints/:id           - Get specific constraint
// POST   /api/constraints               - Create new constraint
// PUT    /api/constraints/:id           - Update constraint
// DELETE /api/constraints/:id           - Delete constraint
// GET    /api/constraints/templates     - List templates
// POST   /api/constraints/from-template - Create from template
// GET    /api/constraints/performance   - Get performance metrics
```

### Client SDK Usage

```typescript
import { ConstraintClient } from '@flextime/constraints/client';

const client = new ConstraintClient({
  baseURL: 'https://api.flextime.com',
  apiKey: 'your-api-key'
});

// Evaluate a slot
const result = await client.evaluateSlot(slot);

// Batch evaluation
const results = await client.evaluateBatch(slots);

// Get constraint details
const constraint = await client.getConstraint('venue-availability');

// Create from template
const newConstraint = await client.createFromTemplate('team_rest_days', {
  minDaysBetweenGames: 5,
  sport: 'football'
});
```

## Next Steps

1. **[Core Concepts](./core-concepts.md)**: Understand the fundamental concepts
2. **[Constraint Types](./constraint-types.md)**: Explore available constraint types
3. **[Performance Guide](./performance.md)**: Optimize for production
4. **[API Reference](../api/constraints.md)**: Complete API documentation
5. **[Examples](./examples.md)**: Real-world implementation examples