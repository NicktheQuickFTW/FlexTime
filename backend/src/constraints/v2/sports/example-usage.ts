// Example Usage of Enhanced Sport-Specific Constraints
// Demonstrates integration with the constraint engine and ML features

import { Schedule } from '../types';
import { OptimizedConstraintEngine } from '../engines/OptimizedConstraintEngine';
import { SmartConflictResolver } from '../resolvers/SmartConflictResolver';
import {
  getAllConstraints,
  getConstraintsForSport,
  getHighPriorityConstraints,
  getMLEnhancedConstraints,
  getConstraintStatistics,
  FootballMLUtilities,
  BasketballMLUtilities
} from './index';

// Example 1: Basic constraint evaluation for a specific sport
async function evaluateFootballSchedule(schedule: Schedule) {
  console.log('Evaluating Football Schedule...');
  
  // Get football-specific constraints
  const footballConstraints = getConstraintsForSport('Football');
  console.log(`Found ${footballConstraints.length} constraints for Football`);
  
  // Create optimized engine
  const engine = new OptimizedConstraintEngine({
    enableCaching: true,
    enableParallelization: true,
    maxParallelConstraints: 4
  });
  
  // Evaluate schedule
  const result = await engine.evaluateSchedule(schedule, footballConstraints);
  
  console.log('Evaluation Results:');
  console.log(`- Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
  console.log(`- Hard Constraints: ${result.hardConstraintsSatisfied ? 'PASSED' : 'FAILED'}`);
  console.log(`- Execution Time: ${result.executionTime}ms`);
  
  // Show violations
  if (!result.hardConstraintsSatisfied) {
    console.log('\nViolations:');
    result.results
      .filter(r => !r.satisfied)
      .forEach(r => {
        console.log(`- ${r.constraintId}: ${r.message}`);
        r.violations?.forEach(v => {
          console.log(`  * ${v.description} (${v.severity})`);
        });
      });
  }
  
  // Show suggestions
  const suggestions = result.suggestions;
  if (suggestions.length > 0) {
    console.log('\nTop Suggestions:');
    suggestions
      .filter(s => s.priority === 'high')
      .slice(0, 5)
      .forEach(s => {
        console.log(`- ${s.description}`);
        console.log(`  Implementation: ${s.implementation}`);
        console.log(`  Expected Improvement: ${s.expectedImprovement}%`);
      });
  }
  
  return result;
}

// Example 2: Using ML utilities for optimization
async function optimizeGameTiming() {
  console.log('\nOptimizing Game Timing with ML...');
  
  // Football example
  const footballOptimal = await FootballMLUtilities.predictOptimalSlot(
    'Kansas',
    'Kansas State',
    10 // Week 10
  );
  
  console.log('Football - Kansas vs Kansas State:');
  console.log(`- Optimal Day: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][footballOptimal.dayOfWeek]}`);
  console.log(`- Optimal Time: ${footballOptimal.timeSlot}`);
  console.log(`- Confidence: ${(footballOptimal.confidence * 100).toFixed(1)}%`);
  
  // Basketball example
  const basketballOptimal = BasketballMLUtilities.predictOptimalGameTime(
    'Kansas',
    'Kansas State',
    1, // Monday
    true // Conference game
  );
  
  console.log('\nBasketball - Kansas vs Kansas State (Monday):');
  console.log(`- Optimal Time: ${basketballOptimal.time}`);
  console.log(`- Expected Attendance: ${(basketballOptimal.expectedAttendance * 100).toFixed(1)}%`);
  console.log(`- Expected TV Rating: ${(basketballOptimal.tvRating * 100).toFixed(1)}%`);
}

// Example 3: Conflict resolution with smart resolver
async function resolveScheduleConflicts(schedule: Schedule) {
  console.log('\nResolving Schedule Conflicts...');
  
  const resolver = new SmartConflictResolver();
  const constraints = getAllConstraints();
  
  // Find conflicts
  const conflicts = await resolver.findConflicts(schedule, constraints);
  console.log(`Found ${conflicts.length} conflicts`);
  
  // Resolve conflicts
  for (const conflict of conflicts.slice(0, 3)) { // First 3 conflicts
    console.log(`\nConflict: ${conflict.description}`);
    console.log(`Affected Constraints: ${conflict.constraintIds.join(', ')}`);
    
    const resolutions = await resolver.suggestResolutions(conflict, schedule);
    console.log('Possible Resolutions:');
    resolutions.forEach((res, i) => {
      console.log(`${i + 1}. ${res.description}`);
      console.log(`   Impact: ${res.impact} | Feasibility: ${(res.feasibility * 100).toFixed(0)}%`);
    });
  }
}

// Example 4: Performance monitoring and optimization
async function monitorConstraintPerformance(schedule: Schedule) {
  console.log('\nMonitoring Constraint Performance...');
  
  const stats = getConstraintStatistics();
  console.log('Constraint Statistics:');
  console.log(`- Total Constraints: ${stats.total}`);
  console.log(`- ML-Enhanced: ${stats.mlEnhanced}`);
  console.log(`- Cacheable: ${stats.cacheable}`);
  console.log(`- Parallelizable: ${stats.parallelizable}`);
  console.log(`- Average Weight: ${stats.averageWeight.toFixed(1)}`);
  
  // Test high-priority constraints
  const highPriority = getHighPriorityConstraints();
  console.log(`\nHigh Priority Constraints (${highPriority.length}):`);
  highPriority.forEach(c => {
    console.log(`- ${c.name} (${c.type}, weight: ${c.weight})`);
  });
  
  // Benchmark ML-enhanced constraints
  const mlConstraints = getMLEnhancedConstraints();
  console.log(`\nBenchmarking ${mlConstraints.length} ML-Enhanced Constraints...`);
  
  const engine = new OptimizedConstraintEngine({
    enableCaching: true,
    enableParallelization: true
  });
  
  const startTime = Date.now();
  const result = await engine.evaluateSchedule(schedule, mlConstraints);
  const totalTime = Date.now() - startTime;
  
  console.log(`Total Execution Time: ${totalTime}ms`);
  console.log(`Average per Constraint: ${(totalTime / mlConstraints.length).toFixed(1)}ms`);
  console.log(`Cache Hit Rate: ${(result.metadata?.cacheHitRate ?? 0 * 100).toFixed(1)}%`);
}

// Example 5: Sport-specific optimization scenarios
async function sportSpecificScenarios(schedule: Schedule) {
  console.log('\nRunning Sport-Specific Scenarios...');
  
  // Scenario 1: Basketball Big Monday Optimization
  console.log('\n1. Basketball Big Monday Analysis:');
  const basketballConstraints = getConstraintsForSport('Men\'s Basketball');
  const bigMondayConstraint = basketballConstraints.find(c => 
    c.id === 'bb-big-monday-optimization'
  );
  
  if (bigMondayConstraint) {
    const result = await bigMondayConstraint.evaluation(schedule, bigMondayConstraint.parameters);
    console.log(`- Big Monday Score: ${(result.score * 100).toFixed(1)}%`);
    console.log(`- Details:`, result.details);
  }
  
  // Scenario 2: Baseball Weather Analysis
  console.log('\n2. Baseball Weather Impact:');
  const baseballConstraints = getConstraintsForSport('Baseball');
  const weatherConstraint = baseballConstraints.find(c => 
    c.id === 'bs-weather-intelligence'
  );
  
  if (weatherConstraint) {
    const result = await weatherConstraint.evaluation(schedule, weatherConstraint.parameters);
    console.log(`- Weather Optimization Score: ${(result.score * 100).toFixed(1)}%`);
    console.log(`- Confidence: ${(result.confidence ?? 0 * 100).toFixed(1)}%`);
  }
  
  // Scenario 3: Venue Sharing Analysis
  console.log('\n3. Venue Sharing Conflicts:');
  const venueConstraints = getConstraintsForSport('All').filter(c => 
    c.id.startsWith('vs-')
  );
  
  for (const constraint of venueConstraints) {
    const result = await constraint.evaluation(schedule, constraint.parameters);
    console.log(`- ${constraint.name}: ${result.satisfied ? 'PASS' : 'FAIL'}`);
    if (!result.satisfied && result.violations) {
      console.log(`  Violations: ${result.violations.length}`);
    }
  }
}

// Example 6: Creating a custom constraint pipeline
async function customConstraintPipeline(schedule: Schedule) {
  console.log('\nCreating Custom Constraint Pipeline...');
  
  // Define constraint groups
  const constraintGroups = {
    critical: getAllConstraints().filter(c => c.weight >= 95),
    performance: getAllConstraints().filter(c => c.type === 'performance'),
    compliance: getAllConstraints().filter(c => c.type === 'compliance')
  };
  
  const engine = new OptimizedConstraintEngine({
    enableCaching: true,
    enableParallelization: true
  });
  
  // Evaluate in priority order
  console.log('\nPhase 1: Critical Constraints');
  const criticalResult = await engine.evaluateSchedule(schedule, constraintGroups.critical);
  
  if (!criticalResult.hardConstraintsSatisfied) {
    console.log('Critical constraints failed - stopping pipeline');
    return;
  }
  
  console.log('\nPhase 2: Compliance Constraints');
  const complianceResult = await engine.evaluateSchedule(schedule, constraintGroups.compliance);
  
  console.log('\nPhase 3: Performance Optimization');
  const performanceResult = await engine.evaluateSchedule(schedule, constraintGroups.performance);
  
  // Aggregate results
  console.log('\nPipeline Summary:');
  console.log(`- Critical: ${(criticalResult.overallScore * 100).toFixed(1)}%`);
  console.log(`- Compliance: ${(complianceResult.overallScore * 100).toFixed(1)}%`);
  console.log(`- Performance: ${(performanceResult.overallScore * 100).toFixed(1)}%`);
  
  const overallScore = (
    criticalResult.overallScore * 0.5 +
    complianceResult.overallScore * 0.3 +
    performanceResult.overallScore * 0.2
  );
  
  console.log(`- Overall Pipeline Score: ${(overallScore * 100).toFixed(1)}%`);
}

// Main example runner
export async function runExamples(schedule: Schedule) {
  console.log('=== Enhanced Constraint System Examples ===\n');
  
  try {
    // Run all examples
    await evaluateFootballSchedule(schedule);
    await optimizeGameTiming();
    await resolveScheduleConflicts(schedule);
    await monitorConstraintPerformance(schedule);
    await sportSpecificScenarios(schedule);
    await customConstraintPipeline(schedule);
    
    console.log('\n=== Examples Complete ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export individual examples for testing
export {
  evaluateFootballSchedule,
  optimizeGameTiming,
  resolveScheduleConflicts,
  monitorConstraintPerformance,
  sportSpecificScenarios,
  customConstraintPipeline
};