/**
 * ML-Enhanced Constraint System Components
 * 
 * This module provides machine learning capabilities for dynamic constraint
 * optimization, predictive validation, and pattern learning in the Flextime
 * scheduling system.
 */

export { MLConstraintOptimizer } from './MLConstraintOptimizer';
export { PredictiveValidator } from './PredictiveValidator';
export { FeatureExtractor } from './FeatureExtractor';
export { ConstraintLearner } from './ConstraintLearner';
export { ModelManager } from './ModelManager';

// Re-export types for convenience
export type {
  MLModel,
  ModelType,
  ModelStatus,
  ModelPerformance,
  WeightPrediction,
  WeightPredictionContext,
  ConflictPrediction,
  ValidationPrediction,
  LearningInsight,
  LearningPattern,
  ConstraintFeatures,
  ScheduleFeatures,
  GameFeatures,
  TrainingDataset,
  TrainingSample,
  DriftDetection
} from '../types/ml-types';

/**
 * Example usage of the ML-enhanced constraint system:
 * 
 * ```typescript
 * import { ModelManager, MLConstraintOptimizer, PredictiveValidator } from './ml';
 * 
 * // Initialize the model manager
 * const modelManager = new ModelManager('./models');
 * await modelManager.initialize();
 * 
 * // Get the constraint optimizer
 * const optimizer = await modelManager.getModel('constraint-optimizer');
 * 
 * // Optimize constraint weights
 * const weightPrediction = await optimizer.predict(constraint, {
 *   schedule,
 *   sport: 'basketball',
 *   season: '2024-25',
 *   environmentFactors: {
 *     timeOfSeason: 'late',
 *     competitivenessLevel: 0.8
 *   }
 * });
 * 
 * // Predict potential violations
 * const validator = await modelManager.getModel('predictive-validator');
 * const violations = await validator.predictViolations(schedule, constraints);
 * 
 * // Learn from historical patterns
 * const learner = await modelManager.getModel('constraint-learner');
 * const insights = await learner.learnFromEvaluation(evaluationResult, schedule, constraints);
 * ```
 */

/**
 * Configuration interface for ML system initialization
 */
export interface MLSystemConfig {
  modelsPath?: string;
  enableAutoRetrain?: boolean;
  retrainThreshold?: number;
  maxModelAge?: number;
  enableDriftDetection?: boolean;
  cacheEnabled?: boolean;
  maxConcurrentModels?: number;
}

/**
 * Factory function to create and initialize the complete ML system
 */
export async function createMLConstraintSystem(
  config: MLSystemConfig = {}
): Promise<{
  modelManager: ModelManager;
  optimizer: MLConstraintOptimizer;
  validator: PredictiveValidator;
  learner: ConstraintLearner;
  featureExtractor: FeatureExtractor;
}> {
  const modelsPath = config.modelsPath || './models';
  const featureExtractor = new FeatureExtractor();
  
  // Create model manager with configuration
  const modelManager = new ModelManager(modelsPath, {
    autoRetrain: config.enableAutoRetrain ?? true,
    retrainThreshold: config.retrainThreshold ?? 0.15,
    maxModelAge: config.maxModelAge ?? 30,
    driftDetectionEnabled: config.enableDriftDetection ?? true,
    maxConcurrentModels: config.maxConcurrentModels ?? 10
  });
  
  await modelManager.initialize();
  
  // Get core models
  const optimizer = await modelManager.getModel('constraint-optimizer') as MLConstraintOptimizer;
  const validator = await modelManager.getModel('predictive-validator') as PredictiveValidator;
  const learner = await modelManager.getModel('constraint-learner') as ConstraintLearner;
  
  return {
    modelManager,
    optimizer,
    validator,
    learner,
    featureExtractor
  };
}

/**
 * Utility function to prepare constraint data for ML training
 */
export function prepareConstraintTrainingData(
  evaluationHistory: any[],
  schedules: any[],
  constraints: any[]
): TrainingDataset {
  const samples: TrainingSample[] = [];
  
  evaluationHistory.forEach((evaluation, index) => {
    const schedule = schedules[index];
    if (!schedule) return;
    
    evaluation.results.forEach((result: any) => {
      const constraint = constraints.find(c => c.id === result.constraintId);
      if (!constraint) return;
      
      // Extract features (simplified)
      const features = [
        constraint.weight / 100,
        constraint.type === 'temporal' ? 1 : 0,
        result.score,
        result.satisfied ? 1 : 0,
        schedule.games.length / 1000,
        // ... more features
      ];
      
      samples.push({
        input: { features, constraintId: constraint.id },
        output: {
          satisfied: result.satisfied,
          score: result.score,
          optimalWeight: constraint.weight // This would come from expert labeling
        },
        metadata: {
          source: 'historical',
          timestamp: evaluation.timestamp,
          quality: 0.8
        }
      });
    });
  });
  
  return {
    id: `training-${Date.now()}`,
    type: 'constraint_weight' as any,
    samples,
    metadata: {
      createdAt: new Date(),
      size: samples.length,
      sports: ['all'],
      seasons: ['historical'],
      qualityScore: 0.8,
      splits: {
        train: 0.7,
        validation: 0.15,
        test: 0.15
      }
    }
  };
}

/**
 * Performance monitoring utilities
 */
export async function monitorMLPerformance(
  modelManager: ModelManager,
  timeRange: { start: Date; end: Date }
): Promise<{
  modelId: string;
  performance: ModelPerformance;
  drift: DriftDetection;
}[]> {
  const results = [];
  const models = modelManager.getAllModels();
  
  for (const model of models) {
    const performance = await modelManager.getPerformanceMetrics(model, timeRange);
    const drift = modelManager.detectDrift(model);
    
    results.push({
      modelId: model.id,
      performance,
      drift
    });
  }
  
  return results;
}

export default {
  MLConstraintOptimizer,
  PredictiveValidator,
  FeatureExtractor,
  ConstraintLearner,
  ModelManager,
  createMLConstraintSystem,
  prepareConstraintTrainingData,
  monitorMLPerformance
};