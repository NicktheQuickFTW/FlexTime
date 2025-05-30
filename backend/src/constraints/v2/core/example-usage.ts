/**
 * Example usage of the production-ready constraint engine
 */

import {
  ConstraintEngine,
  ConflictResolver,
  ConstraintRegistry,
  PerformanceMonitor,
  CacheManager
} from './index';

import {
  Constraint,
  ConstraintContext,
  ConstraintViolation,
  ConflictResolutionStrategy
} from '../types';

/**
 * Example: Initialize and use the constraint engine
 */
async function exampleUsage() {
  console.log('=== Constraint Engine Example ===\n');

  // 1. Initialize the engine with production settings
  const engine = new ConstraintEngine({
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour
    batchSize: 100,
    parallelEvaluations: 10,
    logLevel: 'info'
  });

  // 2. Create example constraints
  const venueCapacityConstraint: Constraint = {
    id: 'venue-capacity',
    name: 'Venue Capacity Constraint',
    type: 'hard',
    priority: 'critical',
    evaluate: async (context: ConstraintContext, violations: ConstraintViolation[]) => {
      const { venue, attendees } = context;
      if (attendees > venue.capacity) {
        violations.push({
          message: `Venue capacity exceeded: ${attendees} attendees for capacity ${venue.capacity}`,
          severity: 'error',
          context: { venue: venue.name, exceeded: attendees - venue.capacity }
        });
        return false;
      }
      return true;
    },
    metadata: {
      category: 'venue',
      timeout: 1000
    }
  };

  const dateAvailabilityConstraint: Constraint = {
    id: 'date-availability',
    name: 'Date Availability Constraint',
    type: 'hard',
    priority: 'high',
    evaluate: async (context: ConstraintContext, violations: ConstraintViolation[]) => {
      const { date, blockedDates } = context;
      if (blockedDates.includes(date)) {
        violations.push({
          message: `Date not available: ${date}`,
          severity: 'error',
          context: { date }
        });
        return false;
      }
      return true;
    },
    dependencies: [{
      constraintId: 'venue-capacity',
      type: 'requires'
    }]
  };

  const travelDistanceConstraint: Constraint = {
    id: 'travel-distance',
    name: 'Travel Distance Preference',
    type: 'soft',
    priority: 'medium',
    evaluate: async (context: ConstraintContext, violations: ConstraintViolation[]) => {
      const { distance, maxPreferredDistance } = context;
      if (distance > maxPreferredDistance) {
        violations.push({
          message: `Travel distance exceeds preference: ${distance}km (max: ${maxPreferredDistance}km)`,
          severity: 'warning',
          context: { distance, excess: distance - maxPreferredDistance }
        });
        return false;
      }
      return true;
    }
  };

  // 3. Register constraints
  console.log('Registering constraints...');
  engine.registerConstraint(venueCapacityConstraint);
  engine.registerConstraint(dateAvailabilityConstraint);
  engine.registerConstraint(travelDistanceConstraint);

  // 4. Evaluate single constraint
  console.log('\n--- Single Constraint Evaluation ---');
  const singleResult = await engine.evaluateConstraint('venue-capacity', {
    venue: { name: 'Stadium A', capacity: 50000 },
    attendees: 45000
  });
  console.log('Result:', JSON.stringify(singleResult, null, 2));

  // 5. Evaluate multiple constraints with conflict resolution
  console.log('\n--- Multiple Constraint Evaluation ---');
  const context = {
    venue: { name: 'Stadium B', capacity: 30000 },
    attendees: 35000,
    date: '2025-06-15',
    blockedDates: ['2025-06-14', '2025-06-15'],
    distance: 500,
    maxPreferredDistance: 300
  };

  const batchResult = await engine.evaluateMultiple(
    ['venue-capacity', 'date-availability', 'travel-distance'],
    context,
    { resolveConflicts: true }
  );

  console.log('Batch Result:');
  console.log(`- All Satisfied: ${batchResult.allSatisfied}`);
  console.log(`- Total Violations: ${batchResult.totalViolations}`);
  console.log(`- Conflicts: ${batchResult.conflicts.length}`);
  console.log(`- Metrics:`, batchResult.metrics);

  // 6. Performance monitoring
  console.log('\n--- Performance Metrics ---');
  const metrics = engine.getMetrics();
  console.log('Engine Metrics:', {
    totalEvaluations: metrics.totalEvaluations,
    averageDuration: `${metrics.averageDuration.toFixed(2)}ms`,
    cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`
  });

  // 7. Cache statistics
  console.log('\n--- Cache Statistics ---');
  const cacheStats = engine.getCacheStats();
  console.log('Cache Stats:', {
    size: cacheStats.size,
    hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`,
    hits: cacheStats.hitCount,
    misses: cacheStats.missCount
  });

  // 8. Custom conflict resolution strategy
  console.log('\n--- Custom Conflict Resolution ---');
  const resolver = new ConflictResolver();
  
  const customStrategy: ConflictResolutionStrategy = {
    name: 'venue-priority',
    canResolve: (conflict) => 
      conflict.constraintIds.includes('venue-capacity') &&
      conflict.constraintIds.includes('date-availability'),
    resolve: async (conflict, results, context) => {
      // Prioritize venue over date
      return {
        success: true,
        conflict,
        resolution: {
          action: 'override',
          targetConstraintId: 'date-availability',
          changes: {
            satisfied: true,
            violations: [],
            metadata: { overriddenBy: 'venue-priority' }
          }
        }
      };
    }
  };

  resolver.registerStrategy('venue-priority', customStrategy);

  // 9. Advanced usage with groups
  console.log('\n--- Constraint Groups ---');
  const registry = new ConstraintRegistry();
  
  // Initialize and create groups
  await registry.initialize();
  
  registry.createGroup({
    id: 'scheduling-critical',
    name: 'Critical Scheduling Constraints',
    constraintIds: ['venue-capacity', 'date-availability'],
    metadata: { priority: 'critical' }
  });

  // 10. Performance monitoring with alerts
  console.log('\n--- Performance Monitoring ---');
  const monitor = new PerformanceMonitor();
  
  monitor.setThreshold('evaluationTime', {
    warning: 100,
    critical: 500,
    metric: 'evaluationTime'
  });

  monitor.on('alert', (alert) => {
    console.log('Performance Alert:', alert);
  });

  monitor.startMonitoring();

  // 11. Cache warm-up
  console.log('\n--- Cache Warm-up ---');
  const cacheManager = new CacheManager({
    enabled: true,
    ttl: 3600000,
    adaptiveTTL: true
  });

  const warmupEntries = [
    {
      constraintId: 'venue-capacity',
      context: { venue: { capacity: 50000 }, attendees: 45000 },
      result: {
        constraintId: 'venue-capacity',
        satisfied: true,
        violations: []
      }
    }
  ];

  const warmedUp = await cacheManager.warmUp(warmupEntries);
  console.log(`Warmed up ${warmedUp} cache entries`);

  // 12. Cleanup
  console.log('\n--- Cleanup ---');
  await engine.shutdown();
  monitor.shutdown();
  cacheManager.shutdown();

  console.log('\nExample completed successfully!');
}

/**
 * Example: Real-world Big 12 scheduling constraints
 */
async function big12SchedulingExample() {
  console.log('\n=== Big 12 Scheduling Example ===\n');

  const engine = new ConstraintEngine({
    cacheEnabled: true,
    cacheTTL: 7200000, // 2 hours for sports scheduling
    parallelEvaluations: 20 // Handle complex evaluations
  });

  // Football scheduling constraints
  const conferenceGameBalance: Constraint = {
    id: 'conference-game-balance',
    name: 'Conference Game Balance',
    type: 'hard',
    priority: 'critical',
    evaluate: async (context, violations) => {
      const { team, homeGames, awayGames, totalConferenceGames } = context;
      const expectedGames = totalConferenceGames / 2;
      const tolerance = 1;

      if (Math.abs(homeGames - expectedGames) > tolerance) {
        violations.push({
          message: `Unbalanced home/away games for ${team}: ${homeGames} home, ${awayGames} away`,
          severity: 'error',
          context: { team, homeGames, awayGames }
        });
        return false;
      }
      return true;
    }
  };

  const tvWindowConstraint: Constraint = {
    id: 'tv-window-constraint',
    name: 'TV Broadcast Window',
    type: 'soft',
    priority: 'high',
    evaluate: async (context, violations) => {
      const { game, timeSlot, preferredWindows } = context;
      
      if (!preferredWindows.includes(timeSlot)) {
        violations.push({
          message: `Game ${game.id} scheduled outside preferred TV window`,
          severity: 'warning',
          context: { game: game.id, timeSlot }
        });
        return false;
      }
      return true;
    }
  };

  const rivalryWeekConstraint: Constraint = {
    id: 'rivalry-week',
    name: 'Rivalry Week Scheduling',
    type: 'requirement',
    priority: 'critical',
    evaluate: async (context, violations) => {
      const { week, rivalryGames, scheduledRivalries } = context;
      
      if (week === 'rivalry-week') {
        const missingRivalries = rivalryGames.filter(
          game => !scheduledRivalries.includes(game)
        );
        
        if (missingRivalries.length > 0) {
          violations.push({
            message: `Missing rivalry games in rivalry week: ${missingRivalries.join(', ')}`,
            severity: 'error',
            context: { missing: missingRivalries }
          });
          return false;
        }
      }
      return true;
    }
  };

  // Register all constraints
  engine.registerConstraint(conferenceGameBalance);
  engine.registerConstraint(tvWindowConstraint);
  engine.registerConstraint(rivalryWeekConstraint);

  // Evaluate for a sample team schedule
  const teamContext = {
    team: 'Kansas State',
    homeGames: 4,
    awayGames: 5,
    totalConferenceGames: 9,
    game: { id: 'KSU-vs-KU', teams: ['Kansas State', 'Kansas'] },
    timeSlot: '3:30 PM',
    preferredWindows: ['12:00 PM', '3:30 PM', '7:00 PM'],
    week: 'rivalry-week',
    rivalryGames: ['KSU-vs-KU', 'OU-vs-OSU', 'TCU-vs-Baylor'],
    scheduledRivalries: ['KSU-vs-KU', 'OU-vs-OSU']
  };

  const result = await engine.evaluateByType('hard', teamContext);
  
  console.log('Big 12 Scheduling Evaluation:');
  console.log(`- Constraints Evaluated: ${result.metrics.totalConstraints}`);
  console.log(`- All Satisfied: ${result.allSatisfied}`);
  console.log(`- Violations: ${result.totalViolations}`);
  
  if (!result.allSatisfied) {
    console.log('\nViolations found:');
    result.results.forEach(r => {
      if (!r.satisfied) {
        console.log(`\n${r.constraintId}:`);
        r.violations.forEach(v => {
          console.log(`  - ${v.message}`);
        });
      }
    });
  }

  await engine.shutdown();
}

// Run examples
if (require.main === module) {
  (async () => {
    try {
      await exampleUsage();
      await big12SchedulingExample();
    } catch (error) {
      console.error('Example failed:', error);
      process.exit(1);
    }
  })();
}

export { exampleUsage, big12SchedulingExample };