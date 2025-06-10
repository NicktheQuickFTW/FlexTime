/**
 * Example usage of ML-enhanced constraint system
 * 
 * This file demonstrates how to integrate and use the ML components
 * for constraint optimization in the Flextime scheduling system.
 */

import {
  createMLConstraintSystem,
  prepareConstraintTrainingData,
  monitorMLPerformance,
  MLSystemConfig
} from './index';
import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  EvaluationResult
} from '../types';
import { Schedule } from '../types/schedule-types';

/**
 * Initialize the ML constraint system
 */
async function initializeMLSystem() {
  const config: MLSystemConfig = {
    modelsPath: './models/constraints',
    enableAutoRetrain: true,
    retrainThreshold: 0.15, // Retrain if performance drops by 15%
    maxModelAge: 30, // Retrain models older than 30 days
    enableDriftDetection: true,
    cacheEnabled: true,
    maxConcurrentModels: 10
  };

  console.log('Initializing ML constraint system...');
  const mlSystem = await createMLConstraintSystem(config);
  console.log('ML system initialized successfully');
  
  return mlSystem;
}

/**
 * Example: Optimize constraint weights using ML
 */
async function optimizeConstraintWeights(
  mlSystem: Awaited<ReturnType<typeof createMLConstraintSystem>>,
  constraints: UnifiedConstraint[],
  schedule: Schedule
) {
  console.log('\n=== Constraint Weight Optimization ===');
  
  const { optimizer } = mlSystem;
  
  // Prepare context for weight prediction
  const context = {
    schedule,
    sport: schedule.sport,
    season: schedule.season,
    environmentFactors: {
      timeOfSeason: 'late' as const,
      competitivenessLevel: 0.85,
      externalEvents: ['March Madness'],
      weatherPatterns: { riskLevel: 0.3 }
    }
  };
  
  // Optimize weights for all constraints
  const weightPredictions = await optimizer.batchPredict(constraints, context);
  
  // Apply high-confidence predictions
  for (const prediction of weightPredictions) {
    if (prediction.confidence > 0.8) {
      const constraint = constraints.find(c => c.id === prediction.constraintId);
      if (constraint) {
        console.log(`Adjusting ${constraint.name}:`);
        console.log(`  Original weight: ${prediction.originalWeight}`);
        console.log(`  Predicted weight: ${prediction.predictedWeight}`);
        console.log(`  Reason: ${prediction.adjustmentReason}`);
        
        // Apply the weight adjustment
        constraint.weight = prediction.predictedWeight;
      }
    }
  }
  
  // Get explanations for significant adjustments
  const significantAdjustments = weightPredictions.filter(p => 
    Math.abs(p.predictedWeight - p.originalWeight) > 10
  );
  
  for (const prediction of significantAdjustments) {
    const explanation = optimizer.explain(prediction);
    console.log(`\nExplanation for ${prediction.constraintId}:`);
    explanation.topFactors.forEach(factor => {
      console.log(`  - ${factor.factor}: ${(factor.impact * 100).toFixed(0)}% impact`);
    });
  }
}

/**
 * Example: Predict and prevent constraint violations
 */
async function predictAndPreventViolations(
  mlSystem: Awaited<ReturnType<typeof createMLConstraintSystem>>,
  schedule: Schedule,
  constraints: UnifiedConstraint[]
) {
  console.log('\n=== Predictive Violation Analysis ===');
  
  const { validator } = mlSystem;
  
  // Predict violations for the next week
  const predictions = await validator.predictViolations(
    schedule,
    constraints,
    168 // 1 week in hours
  );
  
  // Filter high-risk violations
  const highRiskViolations = predictions.filter(p => 
    p.violationProbability > 0.7 && p.expectedSeverity !== 'low'
  );
  
  console.log(`Found ${highRiskViolations.length} high-risk potential violations`);
  
  // Display preventive measures
  for (const violation of highRiskViolations.slice(0, 3)) {
    const constraint = constraints.find(c => c.id === violation.constraintId);
    console.log(`\nConstraint: ${constraint?.name || violation.constraintId}`);
    console.log(`  Probability: ${(violation.violationProbability * 100).toFixed(0)}%`);
    console.log(`  Severity: ${violation.expectedSeverity}`);
    console.log(`  Time to violation: ${violation.timeToViolation.toFixed(0)} hours`);
    console.log(`  Preventive measures:`);
    
    violation.preventiveMeasures.forEach(measure => {
      console.log(`    - ${measure.action} (${measure.cost} cost)`);
      console.log(`      Impact: ${(measure.expectedImpact * 100).toFixed(0)}% reduction`);
      console.log(`      How: ${measure.implementation}`);
    });
  }
  
  // Predict conflicts from potential schedule changes
  const proposedChanges = [
    {
      type: 'swap' as const,
      targetGame: schedule.games[0],
      swapWith: schedule.games[1],
      reason: 'Venue conflict resolution',
      timestamp: new Date()
    }
  ];
  
  const conflictPredictions = await validator.predictConflicts(schedule, proposedChanges);
  
  console.log('\n=== Impact of Proposed Changes ===');
  conflictPredictions.forEach(prediction => {
    console.log(`Change would cause ${prediction.type} conflict:`);
    console.log(`  Probability: ${(prediction.probability * 100).toFixed(0)}%`);
    console.log(`  Severity: ${prediction.severity}`);
    console.log(`  Triggers: ${prediction.triggers.join(', ')}`);
  });
}

/**
 * Example: Learn from historical patterns
 */
async function learnFromHistory(
  mlSystem: Awaited<ReturnType<typeof createMLConstraintSystem>>,
  evaluationResult: EvaluationResult,
  schedule: Schedule,
  constraints: UnifiedConstraint[]
) {
  console.log('\n=== Learning from Historical Patterns ===');
  
  const { learner } = mlSystem;
  
  // Learn from the evaluation
  const insights = await learner.learnFromEvaluation(
    evaluationResult,
    schedule,
    constraints
  );
  
  console.log(`Generated ${insights.length} insights:`);
  
  // Display high-priority insights
  const highPriorityInsights = insights.filter(i => i.priority === 'high');
  
  for (const insight of highPriorityInsights) {
    console.log(`\n${insight.type.toUpperCase()}: ${insight.message}`);
    console.log(`  Affected constraints: ${insight.affectedConstraints.join(', ')}`);
    console.log(`  Suggested actions:`);
    insight.suggestedActions.forEach(action => {
      console.log(`    - ${action}`);
    });
    console.log(`  Expected improvement: ${(insight.expectedImprovement * 100).toFixed(0)}%`);
  }
  
  // Analyze constraint interactions
  const interactions = await learner.analyzeInteractions(constraints, schedule);
  
  console.log('\n=== Constraint Interactions ===');
  const significantInteractions = interactions.filter(i => i.strength > 0.5);
  
  for (const interaction of significantInteractions.slice(0, 5)) {
    const c1 = constraints.find(c => c.id === interaction.constraint1);
    const c2 = constraints.find(c => c.id === interaction.constraint2);
    
    console.log(`${c1?.name} <-> ${c2?.name}:`);
    console.log(`  Type: ${interaction.interactionType}`);
    console.log(`  Strength: ${(interaction.strength * 100).toFixed(0)}%`);
    console.log(`  ${interaction.description}`);
  }
  
  // Get learned patterns for specific constraints
  const temporalConstraints = constraints.filter(c => c.type === ConstraintType.TEMPORAL);
  
  if (temporalConstraints.length > 0) {
    const patterns = learner.getLearnedPatterns(temporalConstraints[0].id);
    
    console.log(`\n=== Patterns for ${temporalConstraints[0].name} ===`);
    patterns.slice(0, 3).forEach(pattern => {
      console.log(`Pattern: ${pattern.pattern}`);
      console.log(`  Frequency: ${(pattern.frequency * 100).toFixed(0)}%`);
      console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(0)}%`);
      console.log(`  Recommendations:`);
      pattern.recommendations.forEach(rec => {
        console.log(`    - ${rec}`);
      });
    });
  }
}

/**
 * Example: Monitor ML system performance
 */
async function monitorSystemPerformance(
  mlSystem: Awaited<ReturnType<typeof createMLConstraintSystem>>
) {
  console.log('\n=== ML System Performance Monitoring ===');
  
  const { modelManager } = mlSystem;
  
  // Monitor performance over the last week
  const timeRange = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  };
  
  const performanceReports = await monitorMLPerformance(modelManager, timeRange);
  
  for (const report of performanceReports) {
    console.log(`\nModel: ${report.modelId}`);
    console.log(`  Accuracy: ${(report.performance.accuracy * 100).toFixed(1)}%`);
    console.log(`  F1 Score: ${(report.performance.f1Score * 100).toFixed(1)}%`);
    console.log(`  Latency: ${report.performance.latency.toFixed(0)}ms`);
    console.log(`  Drift detected: ${report.drift.detected ? 'Yes' : 'No'}`);
    
    if (report.drift.detected) {
      console.log(`  Drift type: ${report.drift.type}`);
      console.log(`  Severity: ${report.drift.severity}`);
      console.log(`  Recommendation: ${report.drift.recommendation}`);
    }
  }
  
  // Get all models and their status
  const allModels = modelManager.getAllModels();
  
  console.log('\n=== Model Status ===');
  allModels.forEach(model => {
    console.log(`${model.name}:`);
    console.log(`  Status: ${model.status}`);
    console.log(`  Version: ${model.version}`);
    console.log(`  Last trained: ${model.metadata.trainedAt.toDateString()}`);
    console.log(`  Training samples: ${model.metadata.trainingDataSize}`);
  });
}

/**
 * Example: Train models with new data
 */
async function trainModelsWithNewData(
  mlSystem: Awaited<ReturnType<typeof createMLConstraintSystem>>,
  evaluationHistory: EvaluationResult[],
  schedules: Schedule[],
  constraints: UnifiedConstraint[]
) {
  console.log('\n=== Model Training ===');
  
  const { modelManager, optimizer, learner } = mlSystem;
  
  // Prepare training data
  const trainingData = prepareConstraintTrainingData(
    evaluationHistory,
    schedules,
    constraints
  );
  
  console.log(`Prepared ${trainingData.samples.length} training samples`);
  
  // Train the constraint optimizer
  console.log('\nTraining constraint optimizer...');
  const optimizerPerformance = await optimizer.train(trainingData);
  console.log(`  Accuracy: ${(optimizerPerformance.accuracy * 100).toFixed(1)}%`);
  console.log(`  F1 Score: ${(optimizerPerformance.f1Score * 100).toFixed(1)}%`);
  
  // Train the constraint learner
  console.log('\nTraining constraint learner...');
  const learnerModel = modelManager.getAllModels().find(m => m.id === 'constraint-learner')!;
  await modelManager.triggerRetraining(learnerModel, 'Scheduled training with new data');
  
  console.log('\nTraining completed successfully');
}

/**
 * Main example execution
 */
async function runMLExample() {
  try {
    // Initialize ML system
    const mlSystem = await initializeMLSystem();
    
    // Create sample data
    const constraints = createSampleConstraints();
    const schedule = createSampleSchedule();
    const evaluationResult = createSampleEvaluationResult();
    
    // Run examples
    await optimizeConstraintWeights(mlSystem, constraints, schedule);
    await predictAndPreventViolations(mlSystem, schedule, constraints);
    await learnFromHistory(mlSystem, evaluationResult, schedule, constraints);
    await monitorSystemPerformance(mlSystem);
    
    // Optional: Train with new data
    // await trainModelsWithNewData(mlSystem, [evaluationResult], [schedule], constraints);
    
    // Cleanup
    await mlSystem.modelManager.shutdown();
    console.log('\n=== ML System Shutdown Complete ===');
    
  } catch (error) {
    console.error('Error in ML example:', error);
  }
}

/**
 * Helper functions to create sample data
 */
function createSampleConstraints(): UnifiedConstraint[] {
  return [
    {
      id: 'min-days-between-games',
      name: 'Minimum Days Between Games',
      type: ConstraintType.TEMPORAL,
      hardness: ConstraintHardness.HARD,
      weight: 80,
      scope: {
        sports: ['basketball'],
        teams: ['team1', 'team2']
      },
      parameters: { minDays: 2 },
      evaluation: async (schedule, params) => ({
        constraintId: 'min-days-between-games',
        status: 'satisfied' as any,
        satisfied: true,
        score: 0.9,
        message: 'Constraint satisfied'
      }),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'system',
        description: 'Ensures minimum rest between games',
        tags: ['temporal', 'rest', 'player-welfare']
      }
    },
    {
      id: 'venue-availability',
      name: 'Venue Availability',
      type: ConstraintType.SPATIAL,
      hardness: ConstraintHardness.HARD,
      weight: 90,
      scope: {
        sports: ['basketball'],
        venues: ['venue1']
      },
      parameters: {},
      evaluation: async (schedule, params) => ({
        constraintId: 'venue-availability',
        status: 'satisfied' as any,
        satisfied: true,
        score: 0.95,
        message: 'Venue is available'
      }),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'system',
        description: 'Ensures venue is available for games',
        tags: ['spatial', 'venue']
      }
    }
  ];
}

function createSampleSchedule(): Schedule {
  return {
    id: 'schedule-2024',
    sport: 'basketball',
    season: '2024-25',
    year: 2024,
    games: [
      {
        id: 'game1',
        homeTeamId: 'team1',
        awayTeamId: 'team2',
        venueId: 'venue1',
        date: new Date('2024-12-01'),
        time: '19:00',
        sport: 'basketball',
        type: 'conference'
      },
      {
        id: 'game2',
        homeTeamId: 'team2',
        awayTeamId: 'team1',
        venueId: 'venue2',
        date: new Date('2024-12-05'),
        time: '20:00',
        sport: 'basketball',
        type: 'conference'
      }
    ],
    teams: [
      {
        id: 'team1',
        name: 'Kansas',
        conference: 'Big 12',
        homeVenue: 'venue1'
      },
      {
        id: 'team2',
        name: 'Kansas State',
        conference: 'Big 12',
        homeVenue: 'venue2'
      }
    ],
    venues: [
      {
        id: 'venue1',
        name: 'Allen Fieldhouse',
        location: {
          latitude: 38.9543,
          longitude: -95.2558,
          city: 'Lawrence',
          state: 'KS',
          timezone: 'America/Chicago'
        },
        capacity: 16300,
        sports: ['basketball']
      },
      {
        id: 'venue2',
        name: 'Bramlage Coliseum',
        location: {
          latitude: 39.1974,
          longitude: -96.5847,
          city: 'Manhattan',
          state: 'KS',
          timezone: 'America/Chicago'
        },
        capacity: 11000,
        sports: ['basketball']
      }
    ],
    constraints: ['min-days-between-games', 'venue-availability']
  };
}

function createSampleEvaluationResult(): EvaluationResult {
  return {
    scheduleId: 'schedule-2024',
    evaluationId: 'eval-001',
    timestamp: new Date(),
    overallScore: 0.85,
    hardConstraintsSatisfied: true,
    softConstraintsScore: 0.82,
    preferenceScore: 0.78,
    results: [
      {
        constraintId: 'min-days-between-games',
        status: 'satisfied' as any,
        satisfied: true,
        score: 0.9,
        message: 'All games have minimum 2 days between them',
        executionTime: 45
      },
      {
        constraintId: 'venue-availability',
        status: 'satisfied' as any,
        satisfied: true,
        score: 0.95,
        message: 'All venues are available for scheduled games',
        executionTime: 32
      }
    ],
    executionTime: 120,
    suggestions: [
      {
        type: 'optimization',
        priority: 'medium',
        description: 'Consider adjusting game times for better TV slots',
        implementation: 'Move game2 to 19:00 for prime time'
      }
    ]
  };
}

// Run the example if this file is executed directly
if (require.main === module) {
  runMLExample().catch(console.error);
}

export { runMLExample };