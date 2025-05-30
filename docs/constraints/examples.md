# Constraint System Examples

## Table of Contents

1. [Basic Usage Examples](#basic-usage-examples)
2. [Sport-Specific Examples](#sport-specific-examples)
3. [Custom Constraint Examples](#custom-constraint-examples)
4. [Conflict Resolution Examples](#conflict-resolution-examples)
5. [Performance Optimization Examples](#performance-optimization-examples)
6. [ML Integration Examples](#ml-integration-examples)
7. [Real-World Scenarios](#real-world-scenarios)

## Basic Usage Examples

### Simple Constraint Evaluation

```typescript
import { ConstraintEngine } from '@flextime/constraints';
import { ScheduleSlot } from '@flextime/constraints/types';

// Initialize engine
const engine = new ConstraintEngine();

// Define a schedule slot
const slot: ScheduleSlot = {
  id: 'game-001',
  date: new Date('2025-09-06'),
  time: '14:00',
  duration: 210,
  venue: 'Memorial Stadium',
  sport: 'football',
  gameId: 'fb-001',
  homeTeam: 'Kansas',
  awayTeam: 'K-State',
  conference: 'Big 12',
  tvInfo: {
    network: 'ESPN',
    startTime: '14:00',
    duration: 210
  },
  requiredResources: ['Field', 'Lights', 'TV Equipment'],
  constraints: [] // Will use all applicable constraints
};

// Evaluate the slot
const result = await engine.evaluateSlot(slot);

// Process results
if (!result.overallValid) {
  console.log('Schedule slot has conflicts:');
  result.results
    .filter(r => !r.result.valid)
    .forEach(r => {
      console.log(`- ${r.constraintName}: ${r.result.violations.join(', ')}`);
    });
}
```

### Batch Evaluation with Progress Tracking

```typescript
// Multiple slots to evaluate
const schedule: ScheduleSlot[] = [
  // ... array of slots
];

// Batch evaluation with progress
const batchResults = await engine.evaluateBatch(schedule, {
  parallel: true,
  batchSize: 50,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
  }
});

// Summarize results
const summary = {
  total: batchResults.length,
  valid: batchResults.filter(r => r.overallValid).length,
  invalid: batchResults.filter(r => !r.overallValid).length,
  averageScore: batchResults.reduce((sum, r) => sum + r.overallScore, 0) / batchResults.length
};

console.log('Batch evaluation summary:', summary);
```

## Sport-Specific Examples

### Football Scheduling

```typescript
import { EnhancedFootballConstraints } from '@flextime/constraints/sports';

// Load football-specific constraints
const footballConstraints = new EnhancedFootballConstraints();
footballConstraints.getAllConstraints().forEach(c => engine.addConstraint(c));

// Football-specific slot
const footballGame: ScheduleSlot = {
  id: 'fb-rivalry-game',
  date: new Date('2025-11-29'), // Black Friday
  time: '14:30',
  duration: 210,
  venue: 'Arrowhead Stadium',
  sport: 'football',
  gameId: 'fb-kansas-missouri-2025',
  homeTeam: 'Kansas',
  awayTeam: 'Missouri',
  conference: 'Big 12',
  gameType: 'rivalry', // Special game type
  expectedAttendance: 75000,
  tvInfo: {
    network: 'CBS',
    startTime: '14:30',
    duration: 210,
    exclusive: true
  },
  weatherForecast: {
    temperature: 35,
    precipitation: 0.2,
    windSpeed: 15
  },
  requiredResources: [
    'Field',
    'Lights',
    'TV Equipment',
    'Extra Security',
    'Expanded Parking'
  ],
  constraints: []
};

// Evaluate with football-specific considerations
const footballResult = await engine.evaluateSlot(footballGame);

// Check weather-related constraints
const weatherConstraint = footballResult.results.find(
  r => r.constraintId === 'weather-conditions'
);

if (weatherConstraint && !weatherConstraint.result.valid) {
  console.log('Weather concerns:', weatherConstraint.result.violations);
  console.log('Suggestions:', weatherConstraint.result.suggestions);
}
```

### Basketball Double-Header

```typescript
import { EnhancedBasketballConstraints } from '@flextime/constraints/sports';

// Load basketball constraints
const basketballConstraints = new EnhancedBasketballConstraints();
basketballConstraints.getAllConstraints().forEach(c => engine.addConstraint(c));

// Define double-header games
const doubleHeader: ScheduleSlot[] = [
  {
    id: 'bb-women-game',
    date: new Date('2025-01-18'),
    time: '17:00',
    duration: 120,
    venue: 'Allen Fieldhouse',
    sport: 'basketball',
    gameId: 'wbb-kansas-baylor-2025',
    homeTeam: 'Kansas',
    awayTeam: 'Baylor',
    conference: 'Big 12',
    gender: 'women',
    tvInfo: {
      network: 'ESPN+',
      startTime: '17:00',
      duration: 120
    },
    requiredResources: ['Court', 'Scoreboard', 'Video Board'],
    constraints: []
  },
  {
    id: 'bb-men-game',
    date: new Date('2025-01-18'),
    time: '19:30',
    duration: 120,
    venue: 'Allen Fieldhouse',
    sport: 'basketball',
    gameId: 'mbb-kansas-baylor-2025',
    homeTeam: 'Kansas',
    awayTeam: 'Baylor',
    conference: 'Big 12',
    gender: 'men',
    tvInfo: {
      network: 'ESPN',
      startTime: '19:30',
      duration: 150 // Longer for primetime
    },
    requiredResources: ['Court', 'Scoreboard', 'Video Board'],
    constraints: []
  }
];

// Evaluate double-header
const doubleHeaderResults = await engine.evaluateBatch(doubleHeader);

// Check for double-header specific constraints
const transitionTime = basketballConstraints.getConstraint('double-header-transition');
if (transitionTime) {
  console.log('Double-header transition check passed');
}
```

### Baseball Weather Contingency

```typescript
import { BaseballSoftballConstraints } from '@flextime/constraints/sports';

// Baseball game with weather considerations
const baseballGame: ScheduleSlot = {
  id: 'baseball-001',
  date: new Date('2025-04-15'),
  time: '18:00',
  duration: 180,
  venue: 'Hoglund Ballpark',
  sport: 'baseball',
  gameId: 'bsb-kansas-tcu-2025',
  homeTeam: 'Kansas',
  awayTeam: 'TCU',
  conference: 'Big 12',
  weatherForecast: {
    temperature: 55,
    precipitation: 0.6, // 60% chance of rain
    windSpeed: 20
  },
  makeupDate: new Date('2025-04-16'), // Rain date
  requiredResources: ['Field', 'Lights'],
  constraints: []
};

// Evaluate with weather constraints
const baseballResult = await engine.evaluateSlot(baseballGame);

// Handle weather-related suggestions
if (baseballResult.overallScore < 0.7) {
  console.log('Game at risk due to weather');
  
  // Check makeup date availability
  const makeupSlot = { ...baseballGame, date: baseballGame.makeupDate };
  const makeupResult = await engine.evaluateSlot(makeupSlot);
  
  if (makeupResult.overallValid) {
    console.log('Makeup date is available');
  }
}
```

## Custom Constraint Examples

### Creating a Custom Venue Constraint

```typescript
import { UnifiedConstraint } from '@flextime/constraints/types';

// Custom constraint for venue maintenance windows
const venueMaintenanceConstraint: UnifiedConstraint = {
  id: 'venue-maintenance-custom',
  type: 'venue',
  sport: 'all',
  name: 'Venue Maintenance Windows',
  version: '1.0.0',
  priority: 'required',
  evaluate: async (slot) => {
    // Define maintenance windows
    const maintenanceWindows = [
      { venue: 'Memorial Stadium', day: 'Monday', startHour: 6, endHour: 12 },
      { venue: 'Allen Fieldhouse', day: 'Tuesday', startHour: 5, endHour: 10 }
    ];
    
    // Check if slot conflicts with maintenance
    const slotDay = slot.date.toLocaleDateString('en-US', { weekday: 'long' });
    const slotHour = parseInt(slot.time.split(':')[0]);
    
    const conflict = maintenanceWindows.find(window => 
      window.venue === slot.venue &&
      window.day === slotDay &&
      slotHour >= window.startHour &&
      slotHour < window.endHour
    );
    
    return {
      valid: !conflict,
      score: conflict ? 0 : 1,
      violations: conflict ? [
        `${slot.venue} is under maintenance on ${slotDay} from ${conflict.startHour}:00 to ${conflict.endHour}:00`
      ] : [],
      suggestions: conflict ? [
        `Schedule after ${conflict.endHour}:00`,
        'Choose a different day',
        'Use alternate venue'
      ] : []
    };
  },
  metadata: {
    author: 'facilities',
    tags: ['venue', 'maintenance', 'custom'],
    description: 'Ensures games don\'t conflict with venue maintenance',
    created: new Date(),
    updated: new Date()
  }
};

// Add to engine
engine.addConstraint(venueMaintenanceConstraint);
```

### Dynamic Constraint Based on External Data

```typescript
// Constraint that checks external ticketing system
const ticketingConstraint: UnifiedConstraint = {
  id: 'ticketing-system-check',
  type: 'operational',
  sport: 'all',
  name: 'Ticketing System Availability',
  version: '1.0.0',
  priority: 'high',
  evaluate: async (slot) => {
    try {
      // Check external ticketing API
      const response = await fetch(`https://tickets.flextime.com/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: slot.venue,
          date: slot.date,
          time: slot.time
        })
      });
      
      const data = await response.json();
      
      return {
        valid: data.available,
        score: data.available ? 1 : 0,
        violations: data.available ? [] : ['Ticketing system unavailable for this slot'],
        suggestions: data.alternatives || []
      };
    } catch (error) {
      // Fallback on error
      return {
        valid: true,
        score: 0.8,
        violations: [],
        suggestions: ['Ticketing system check failed, manual verification recommended']
      };
    }
  },
  metadata: {
    author: 'operations',
    tags: ['ticketing', 'external', 'integration'],
    description: 'Verifies ticketing system availability',
    created: new Date(),
    updated: new Date()
  }
};
```

## Conflict Resolution Examples

### Automatic Conflict Resolution

```typescript
import { SmartConflictResolver } from '@flextime/constraints/resolvers';

const resolver = new SmartConflictResolver();

// Schedule with conflicts
const problematicSchedule: ScheduleSlot[] = [
  {
    id: 'game-1',
    date: new Date('2025-10-11'),
    time: '14:00',
    venue: 'Memorial Stadium',
    sport: 'football',
    homeTeam: 'Kansas',
    awayTeam: 'Texas Tech',
    // ... other properties
  },
  {
    id: 'game-2',
    date: new Date('2025-10-11'),
    time: '15:00', // Overlaps with game-1
    venue: 'Memorial Stadium', // Same venue
    sport: 'football',
    homeTeam: 'K-State',
    awayTeam: 'Baylor',
    // ... other properties
  }
];

// Detect conflicts
const conflicts = await resolver.detectConflicts(problematicSchedule);
console.log(`Found ${conflicts.length} conflicts`);

// Resolve conflicts
const resolutions = await resolver.resolveConflicts(conflicts, problematicSchedule);

// Apply best resolution
if (resolutions.length > 0) {
  const bestResolution = resolutions[0]; // Sorted by confidence
  console.log(`Applying resolution: ${bestResolution.resolution.description}`);
  
  const fixedSchedule = resolver.applyResolutions(
    problematicSchedule,
    [bestResolution]
  );
  
  // Verify fix
  const verificationResults = await engine.evaluateBatch(fixedSchedule);
  const stillHasConflicts = verificationResults.some(r => !r.overallValid);
  
  if (!stillHasConflicts) {
    console.log('Conflicts successfully resolved!');
  }
}
```

### Manual Conflict Resolution with Options

```typescript
// Get multiple resolution options
const resolutionOptions = await resolver.resolveConflicts(conflicts, problematicSchedule, {
  maxResolutions: 5,
  strategies: ['reschedule', 'venue_change', 'time_shift'],
  preservePriority: ['tv_windows', 'team_rest'] // Don't break these constraints
});

// Present options to user
resolutionOptions.forEach((option, index) => {
  console.log(`\nOption ${index + 1}:`);
  console.log(`Type: ${option.resolution.type}`);
  console.log(`Description: ${option.resolution.description}`);
  console.log(`Confidence: ${(option.confidence * 100).toFixed(1)}%`);
  console.log(`Impact: ${option.impact}`);
  
  if (option.resolution.changes) {
    console.log('Changes:');
    option.resolution.changes.forEach(change => {
      console.log(`  - ${change.field}: ${change.from} → ${change.to}`);
    });
  }
});

// Apply selected option
const selectedOption = resolutionOptions[0];
const resolvedSchedule = resolver.applyResolutions(
  problematicSchedule,
  [selectedOption]
);
```

## Performance Optimization Examples

### Implementing Caching Strategy

```typescript
import { OptimizedConstraintEngine } from '@flextime/constraints/engines';
import { CacheWarmupStrategy } from '@flextime/constraints/cache';

// Configure optimized engine
const optimizedEngine = new OptimizedConstraintEngine({
  cacheConfig: {
    enabled: true,
    maxSize: 50000,
    ttl: 3600000, // 1 hour
    compression: true,
    persistentStorage: {
      enabled: true,
      type: 'redis',
      connection: process.env.REDIS_URL
    }
  },
  parallelConfig: {
    enabled: true,
    maxWorkers: 8,
    taskTimeout: 5000
  }
});

// Initialize
await optimizedEngine.initialize();

// Warm up cache with common scenarios
const warmupStrategy = new CacheWarmupStrategy();
const commonScenarios = await warmupStrategy.generateCommonScenarios({
  sports: ['football', 'basketball'],
  venues: ['Memorial Stadium', 'Allen Fieldhouse'],
  timeSlots: ['11:00', '14:00', '19:00'],
  dateRange: {
    start: new Date('2025-09-01'),
    end: new Date('2025-12-31')
  }
});

await optimizedEngine.warmupCache(commonScenarios);
console.log('Cache warmed up with', commonScenarios.length, 'scenarios');

// Use the optimized engine
const result = await optimizedEngine.evaluateSlot(slot);
console.log(`Evaluation time: ${result.totalTime}ms (cached: ${result.cached})`);
```

### Parallel Batch Processing

```typescript
// Large schedule to process
const largeSchedule: ScheduleSlot[] = generateSchedule(1000); // 1000 games

// Configure parallel processing
const batchConfig = {
  parallel: true,
  batchSize: 100,
  maxConcurrent: 10,
  retryFailed: true,
  onBatchComplete: (batchIndex: number, results: any[]) => {
    console.log(`Batch ${batchIndex} completed: ${results.length} slots processed`);
  },
  onError: (error: Error, slot: ScheduleSlot) => {
    console.error(`Error processing slot ${slot.id}:`, error.message);
  }
};

// Process with progress tracking
const startTime = Date.now();
const results = await optimizedEngine.evaluateBatch(largeSchedule, batchConfig);
const totalTime = Date.now() - startTime;

console.log(`Processed ${results.length} slots in ${totalTime}ms`);
console.log(`Average time per slot: ${(totalTime / results.length).toFixed(2)}ms`);

// Generate performance report
const perfReport = optimizedEngine.generatePerformanceReport();
console.log('Performance Report:', perfReport);
```

## ML Integration Examples

### Training ML Model with Historical Data

```typescript
import { MLConstraintOptimizer } from '@flextime/constraints/ml';
import { ScheduleFeedbackCollector } from '@flextime/constraints/ml';

// Initialize ML components
const mlOptimizer = new MLConstraintOptimizer();
const feedbackCollector = new ScheduleFeedbackCollector();

// Collect historical feedback
const historicalGames = await loadHistoricalGames(); // Your data source

for (const game of historicalGames) {
  const feedback = {
    slotId: game.id,
    constraintResults: game.constraintEvaluations,
    actualOutcome: game.outcome, // 'successful', 'problematic', 'cancelled'
    metrics: {
      attendance: game.attendance,
      tvRatings: game.tvRatings,
      revenue: game.revenue
    },
    userFeedback: game.feedback,
    issues: game.reportedIssues
  };
  
  await feedbackCollector.addFeedback(feedback);
}

// Train ML model
const trainingData = await feedbackCollector.prepareTrainingData();
await mlOptimizer.train(trainingData, {
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2,
  callbacks: {
    onEpochEnd: (epoch, logs) => {
      console.log(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, accuracy=${logs.accuracy.toFixed(4)}`);
    }
  }
});

// Save trained model
await mlOptimizer.saveModel('./models/constraint-optimizer-v1');
```

### Using ML for Predictive Scheduling

```typescript
// Load trained model
await mlOptimizer.loadModel('./models/constraint-optimizer-v1');

// Predict outcome for new slot
const proposedSlot: ScheduleSlot = {
  // ... slot details
};

// Get predictions
const predictions = await mlOptimizer.predictOutcome(proposedSlot);

console.log('Predictions:');
console.log(`Success probability: ${(predictions.successProbability * 100).toFixed(1)}%`);
console.log(`Risk level: ${predictions.riskLevel}`);
console.log('Risk factors:', predictions.riskFactors);
console.log('Recommendations:', predictions.recommendations);

// Use ML-optimized constraint weights
const optimizedWeights = await mlOptimizer.getOptimizedWeights();
engine.updateConstraintWeights(optimizedWeights);

// Re-evaluate with optimized weights
const optimizedResult = await engine.evaluateSlot(proposedSlot);
console.log('Optimized score:', optimizedResult.overallScore);
```

## Real-World Scenarios

### Complete Season Scheduling

```typescript
// Full season scheduling example
class SeasonScheduler {
  private engine: ConstraintEngine;
  private resolver: SmartConflictResolver;
  private mlOptimizer: MLConstraintOptimizer;
  
  async scheduleFullSeason(config: SeasonConfig): Promise<SeasonSchedule> {
    // Generate initial schedule
    const initialSchedule = this.generateInitialSchedule(config);
    
    // Phase 1: Evaluate all slots
    console.log('Phase 1: Initial evaluation...');
    const evaluations = await this.engine.evaluateBatch(initialSchedule, {
      parallel: true,
      batchSize: 100
    });
    
    // Phase 2: Identify and resolve conflicts
    console.log('Phase 2: Conflict resolution...');
    const conflicts = await this.resolver.detectConflicts(initialSchedule);
    const resolutions = await this.resolver.resolveConflicts(conflicts, initialSchedule);
    const improvedSchedule = this.resolver.applyResolutions(initialSchedule, resolutions);
    
    // Phase 3: ML optimization
    console.log('Phase 3: ML optimization...');
    const mlSuggestions = await this.mlOptimizer.optimizeSchedule(improvedSchedule);
    const optimizedSchedule = this.applyMLSuggestions(improvedSchedule, mlSuggestions);
    
    // Phase 4: Final validation
    console.log('Phase 4: Final validation...');
    const finalEvaluations = await this.engine.evaluateBatch(optimizedSchedule);
    
    // Generate report
    const report = this.generateScheduleReport({
      initial: initialSchedule,
      final: optimizedSchedule,
      evaluations: finalEvaluations,
      conflictsResolved: conflicts.length,
      optimizations: mlSuggestions.length
    });
    
    return {
      schedule: optimizedSchedule,
      report,
      metrics: {
        totalGames: optimizedSchedule.length,
        validGames: finalEvaluations.filter(e => e.overallValid).length,
        averageScore: this.calculateAverageScore(finalEvaluations),
        processingTime: Date.now() - startTime
      }
    };
  }
}

// Use the season scheduler
const scheduler = new SeasonScheduler(engine, resolver, mlOptimizer);

const seasonConfig = {
  sport: 'football',
  teams: ['Kansas', 'K-State', 'Iowa State', /* ... */],
  startDate: new Date('2025-09-01'),
  endDate: new Date('2025-12-31'),
  constraints: {
    minDaysBetweenGames: 6,
    maxConsecutiveHomeGames: 3,
    maxConsecutiveAwayGames: 2,
    requiredByeWeeks: 1,
    tvWindows: {
      saturday: ['11:00', '14:30', '19:00'],
      thursday: ['19:00'],
      friday: ['19:00']
    }
  }
};

const result = await scheduler.scheduleFullSeason(seasonConfig);
console.log('Season scheduled successfully!');
console.log('Report:', result.report);
```

### Emergency Rescheduling

```typescript
// Handle weather-related rescheduling
class EmergencyRescheduler {
  async handleWeatherCancellation(
    cancelledGame: ScheduleSlot,
    schedule: ScheduleSlot[]
  ): Promise<RescheduleResult> {
    console.log(`Emergency: Game ${cancelledGame.id} cancelled due to weather`);
    
    // Find available makeup dates
    const potentialDates = this.findMakeupDates(cancelledGame, schedule);
    
    // Evaluate each potential date
    const evaluations = await Promise.all(
      potentialDates.map(async date => {
        const makeupSlot = { ...cancelledGame, date, id: `${cancelledGame.id}-makeup` };
        const result = await this.engine.evaluateSlot(makeupSlot);
        return { date, result, slot: makeupSlot };
      })
    );
    
    // Sort by score
    evaluations.sort((a, b) => b.result.overallScore - a.result.overallScore);
    
    // Select best option
    const best = evaluations[0];
    
    if (best.result.overallValid) {
      // Update schedule
      const updatedSchedule = schedule.map(slot => 
        slot.id === cancelledGame.id ? best.slot : slot
      );
      
      // Notify stakeholders
      await this.notifyStakeholders({
        originalGame: cancelledGame,
        newDate: best.date,
        reason: 'weather',
        affectedTeams: [cancelledGame.homeTeam, cancelledGame.awayTeam]
      });
      
      return {
        success: true,
        newSlot: best.slot,
        updatedSchedule,
        notifications: ['Teams notified', 'Venue confirmed', 'TV rescheduled']
      };
    } else {
      // No valid makeup date found
      return {
        success: false,
        reason: 'No valid makeup dates available',
        alternatives: evaluations.slice(0, 3).map(e => ({
          date: e.date,
          issues: e.result.results
            .filter(r => !r.result.valid)
            .map(r => r.result.violations)
            .flat()
        }))
      };
    }
  }
}
```

### Multi-Sport Venue Coordination

```typescript
// Coordinate multiple sports sharing venues
class MultiSportCoordinator {
  async coordinateVenueUsage(
    venues: Venue[],
    sports: Sport[],
    dateRange: DateRange
  ): Promise<VenueSchedule> {
    const allSlots: ScheduleSlot[] = [];
    
    // Collect all proposed slots from different sports
    for (const sport of sports) {
      const sportSlots = await this.getSportSchedule(sport, dateRange);
      allSlots.push(...sportSlots);
    }
    
    // Group by venue
    const venueGroups = this.groupByVenue(allSlots);
    
    // Optimize each venue's schedule
    const optimizedSchedules = await Promise.all(
      Object.entries(venueGroups).map(async ([venue, slots]) => {
        // Sort by priority (sport, timing, etc.)
        const prioritized = this.prioritizeSlots(slots);
        
        // Detect conflicts
        const conflicts = await this.resolver.detectConflicts(prioritized);
        
        // Resolve with venue-sharing strategies
        const resolutions = await this.resolveVenueConflicts(conflicts, prioritized, {
          strategies: [
            'adjust_time', // Shift game times
            'compress_duration', // Reduce warm-up time
            'share_resources', // Share parking, concessions
            'alternate_venue' // Use backup venue
          ],
          priorities: {
            'football': 1, // Highest priority
            'basketball': 2,
            'baseball': 3
          }
        });
        
        return {
          venue,
          schedule: this.applyVenueResolutions(prioritized, resolutions),
          utilization: this.calculateUtilization(prioritized)
        };
      })
    );
    
    // Generate venue utilization report
    const report = this.generateUtilizationReport(optimizedSchedules);
    
    return {
      schedules: optimizedSchedules,
      report,
      recommendations: this.generateVenueRecommendations(optimizedSchedules)
    };
  }
}

// Example usage
const coordinator = new MultiSportCoordinator(engine, resolver);

const venueSchedule = await coordinator.coordinateVenueUsage(
  [
    { id: 'memorial-stadium', name: 'Memorial Stadium', capacity: 50000 },
    { id: 'allen-fieldhouse', name: 'Allen Fieldhouse', capacity: 16000 },
    { id: 'hoglund-ballpark', name: 'Hoglund Ballpark', capacity: 3000 }
  ],
  ['football', 'basketball', 'baseball'],
  { start: new Date('2025-09-01'), end: new Date('2025-12-31') }
);

console.log('Venue coordination complete:', venueSchedule.report);
```

---

These examples demonstrate the flexibility and power of the Flextime Constraint System. For more specific use cases or advanced scenarios, consult the API documentation or contact support.