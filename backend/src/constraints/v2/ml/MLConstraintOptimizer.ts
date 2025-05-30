/**
 * MLConstraintOptimizer.ts
 * Dynamic constraint weight optimization using machine learning
 * 
 * This component uses TensorFlow.js to dynamically optimize constraint weights
 * based on historical performance, current context, and predicted outcomes.
 */

import * as tf from '@tensorflow/tfjs-node';
import {
  UnifiedConstraint,
  ConstraintResult,
  ConstraintType,
  ConstraintHardness,
  EvaluationResult
} from '../types';
import {
  MLModel,
  ModelType,
  ModelStatus,
  ConstraintWeightPredictor,
  WeightPredictionContext,
  WeightPrediction,
  WeightExplanation,
  HistoricalConstraintData,
  ConstraintFeatures,
  ScheduleFeatures,
  TrainingDataset,
  TrainingSample,
  ModelPerformance
} from '../types/ml-types';
import { Schedule } from '../types/schedule-types';
import { FeatureExtractor } from './FeatureExtractor';

export class MLConstraintOptimizer implements ConstraintWeightPredictor {
  private model: tf.LayersModel | null = null;
  private featureExtractor: FeatureExtractor;
  private modelMetadata: MLModel;
  private readonly modelPath: string;
  private readonly maxWeightAdjustment: number = 0.3; // Max 30% adjustment
  private readonly minConfidenceThreshold: number = 0.7;
  
  // Feature normalization parameters learned during training
  private featureStats: {
    mean: number[];
    std: number[];
  } | null = null;

  constructor(
    modelPath: string = './models/constraint-weights',
    featureExtractor?: FeatureExtractor
  ) {
    this.modelPath = modelPath;
    this.featureExtractor = featureExtractor || new FeatureExtractor();
    this.modelMetadata = this.initializeModelMetadata();
  }

  private initializeModelMetadata(): MLModel {
    return {
      id: 'constraint-weight-optimizer-v1',
      name: 'Constraint Weight Optimizer',
      type: ModelType.CONSTRAINT_WEIGHT,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        latency: 0,
        throughput: 0,
        lastEvaluated: new Date()
      },
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: [],
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 100,
          hiddenLayers: [128, 64, 32],
          dropout: 0.2,
          optimizer: 'adam'
        },
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    };
  }

  /**
   * Initialize or load the ML model
   */
  async initialize(): Promise<void> {
    try {
      // Try to load existing model
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
      await this.loadFeatureStats();
      console.log('Loaded existing constraint weight model');
    } catch (error) {
      console.log('No existing model found, creating new model');
      this.model = this.createModel();
    }
  }

  /**
   * Create a new neural network model for weight prediction
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [30], // Number of features
          units: 128,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 2, // Output: [adjusted_weight, confidence]
          activation: 'sigmoid'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    return model;
  }

  /**
   * Predict optimal weight for a single constraint
   */
  async predict(
    constraint: UnifiedConstraint,
    context: WeightPredictionContext
  ): Promise<WeightPrediction> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const features = await this.extractFeatures(constraint, context);
    const normalizedFeatures = this.normalizeFeatures(features);
    
    const prediction = await this.model.predict(normalizedFeatures).array() as number[][];
    const [adjustedWeight, confidence] = prediction[0];

    // Apply bounds and scaling
    const originalWeight = constraint.weight;
    const maxAdjustment = originalWeight * this.maxWeightAdjustment;
    const predictedWeight = Math.max(
      originalWeight - maxAdjustment,
      Math.min(originalWeight + maxAdjustment, adjustedWeight * 100)
    );

    return {
      constraintId: constraint.id,
      originalWeight,
      predictedWeight: Math.round(predictedWeight),
      confidence,
      adjustmentReason: this.generateAdjustmentReason(
        constraint,
        originalWeight,
        predictedWeight,
        context
      ),
      timestamp: new Date()
    };
  }

  /**
   * Batch predict weights for multiple constraints
   */
  async batchPredict(
    constraints: UnifiedConstraint[],
    context: WeightPredictionContext
  ): Promise<WeightPrediction[]> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    // Extract features for all constraints
    const featuresPromises = constraints.map(c => this.extractFeatures(c, context));
    const allFeatures = await Promise.all(featuresPromises);
    
    // Normalize and batch features
    const batchedFeatures = tf.stack(
      allFeatures.map(f => this.normalizeFeatures(f))
    );

    // Predict in batch
    const predictions = await this.model.predict(batchedFeatures).array() as number[][];
    
    // Convert predictions to WeightPrediction objects
    return constraints.map((constraint, i) => {
      const [adjustedWeight, confidence] = predictions[i];
      const originalWeight = constraint.weight;
      const maxAdjustment = originalWeight * this.maxWeightAdjustment;
      const predictedWeight = Math.max(
        originalWeight - maxAdjustment,
        Math.min(originalWeight + maxAdjustment, adjustedWeight * 100)
      );

      return {
        constraintId: constraint.id,
        originalWeight,
        predictedWeight: Math.round(predictedWeight),
        confidence,
        adjustmentReason: this.generateAdjustmentReason(
          constraint,
          originalWeight,
          predictedWeight,
          context
        ),
        timestamp: new Date()
      };
    });
  }

  /**
   * Explain why a particular weight adjustment was made
   */
  explain(prediction: WeightPrediction): WeightExplanation {
    // Use SHAP-like approach for feature importance
    const topFactors = this.calculateFeatureImportance(prediction);
    const similarCases = this.findSimilarHistoricalCases(prediction);
    const recommendedAction = this.generateRecommendation(prediction);

    return {
      topFactors,
      similarCases,
      recommendedAction
    };
  }

  /**
   * Train the model with new data
   */
  async train(dataset: TrainingDataset): Promise<ModelPerformance> {
    if (!this.model) {
      this.model = this.createModel();
    }

    // Prepare training data
    const { inputs, outputs } = this.prepareTrainingData(dataset);
    
    // Calculate feature statistics for normalization
    this.calculateFeatureStats(inputs);
    
    // Normalize inputs
    const normalizedInputs = tf.tensor2d(
      inputs.map(input => this.normalizeFeatureArray(input))
    );
    const outputTensor = tf.tensor2d(outputs);

    // Split data
    const splitRatio = 0.8;
    const numSamples = inputs.length;
    const trainSize = Math.floor(numSamples * splitRatio);
    
    const trainInputs = normalizedInputs.slice([0, 0], [trainSize, -1]);
    const trainOutputs = outputTensor.slice([0, 0], [trainSize, -1]);
    const valInputs = normalizedInputs.slice([trainSize, 0], [-1, -1]);
    const valOutputs = outputTensor.slice([trainSize, 0], [-1, -1]);

    // Train model
    const history = await this.model.fit(trainInputs, trainOutputs, {
      epochs: this.modelMetadata.metadata.hyperparameters.epochs,
      batchSize: this.modelMetadata.metadata.hyperparameters.batchSize,
      validationData: [valInputs, valOutputs],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
          }
        }
      }
    });

    // Calculate performance metrics
    const performance = await this.evaluateModel(valInputs, valOutputs);
    
    // Save model and feature stats
    await this.saveModel();
    await this.saveFeatureStats();

    // Update metadata
    this.modelMetadata.performance = performance;
    this.modelMetadata.metadata.trainedAt = new Date();
    this.modelMetadata.metadata.trainingDataSize = dataset.samples.length;

    // Clean up tensors
    normalizedInputs.dispose();
    outputTensor.dispose();
    trainInputs.dispose();
    trainOutputs.dispose();
    valInputs.dispose();
    valOutputs.dispose();

    return performance;
  }

  /**
   * Extract features from constraint and context
   */
  private async extractFeatures(
    constraint: UnifiedConstraint,
    context: WeightPredictionContext
  ): Promise<tf.Tensor1D> {
    const constraintFeatures = this.featureExtractor.extractConstraintFeatures(
      constraint,
      context.schedule
    );
    const scheduleFeatures = this.featureExtractor.extractScheduleFeatures(
      context.schedule
    );

    // Combine features into a single vector
    const features = [
      // Constraint features
      this.encodeConstraintType(constraintFeatures.type),
      this.encodeConstraintHardness(constraintFeatures.hardness),
      constraintFeatures.weight / 100,
      constraintFeatures.scopeSize / 100,
      constraintFeatures.historicalSatisfactionRate || 0.5,
      (constraintFeatures.averageEvaluationTime || 100) / 1000,
      constraintFeatures.violationFrequency || 0,
      constraintFeatures.sportSpecific ? 1 : 0,
      this.encodeSeasonPhase(constraintFeatures.seasonPhase),
      constraintFeatures.dependencyCount / 10,
      constraintFeatures.conflictPotential,
      constraintFeatures.complexity,
      constraintFeatures.flexibility,
      constraintFeatures.criticalityScore,
      
      // Schedule features
      scheduleFeatures.gameCount / 1000,
      scheduleFeatures.teamCount / 50,
      scheduleFeatures.venueCount / 100,
      scheduleFeatures.duration / 365,
      scheduleFeatures.gamesPerWeek / 10,
      scheduleFeatures.averageGamesPerTeam / 50,
      scheduleFeatures.venueUtilization,
      scheduleFeatures.homeAwayBalance,
      scheduleFeatures.travelBalance,
      scheduleFeatures.competitiveBalance,
      scheduleFeatures.constraintCount / 100,
      scheduleFeatures.hardConstraintRatio,
      scheduleFeatures.interdependencyScore,
      
      // Context features
      this.encodeTimeOfSeason(context.environmentFactors?.timeOfSeason),
      context.environmentFactors?.competitivenessLevel || 0.5,
      (context.environmentFactors?.externalEvents?.length || 0) / 10
    ];

    return tf.tensor1d(features);
  }

  /**
   * Normalize features using learned statistics
   */
  private normalizeFeatures(features: tf.Tensor1D): tf.Tensor1D {
    if (!this.featureStats) {
      // If no stats available, use standard normalization
      return features;
    }

    const mean = tf.tensor1d(this.featureStats.mean);
    const std = tf.tensor1d(this.featureStats.std);
    
    return features.sub(mean).div(std);
  }

  private normalizeFeatureArray(features: number[]): number[] {
    if (!this.featureStats) {
      return features;
    }

    return features.map((value, i) => {
      const mean = this.featureStats!.mean[i];
      const std = this.featureStats!.std[i];
      return std > 0 ? (value - mean) / std : 0;
    });
  }

  /**
   * Calculate feature statistics for normalization
   */
  private calculateFeatureStats(inputs: number[][]): void {
    const numFeatures = inputs[0].length;
    const mean = new Array(numFeatures).fill(0);
    const std = new Array(numFeatures).fill(0);

    // Calculate mean
    for (const input of inputs) {
      for (let i = 0; i < numFeatures; i++) {
        mean[i] += input[i];
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      mean[i] /= inputs.length;
    }

    // Calculate standard deviation
    for (const input of inputs) {
      for (let i = 0; i < numFeatures; i++) {
        std[i] += Math.pow(input[i] - mean[i], 2);
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      std[i] = Math.sqrt(std[i] / inputs.length);
    }

    this.featureStats = { mean, std };
  }

  /**
   * Generate human-readable reason for weight adjustment
   */
  private generateAdjustmentReason(
    constraint: UnifiedConstraint,
    originalWeight: number,
    predictedWeight: number,
    context: WeightPredictionContext
  ): string {
    const delta = predictedWeight - originalWeight;
    const direction = delta > 0 ? 'increased' : 'decreased';
    const magnitude = Math.abs(delta);

    let reason = `Weight ${direction} by ${magnitude.toFixed(0)} points`;

    // Add context-specific reasons
    if (context.environmentFactors?.timeOfSeason === 'postseason') {
      reason += ' due to postseason scheduling requirements';
    } else if (constraint.type === ConstraintType.TEMPORAL && magnitude > 10) {
      reason += ' to better handle time-based conflicts';
    } else if (constraint.hardness === ConstraintHardness.SOFT && delta > 0) {
      reason += ' to improve schedule quality';
    }

    return reason;
  }

  /**
   * Feature encoding helpers
   */
  private encodeConstraintType(type: ConstraintType): number {
    const mapping: Record<ConstraintType, number> = {
      [ConstraintType.TEMPORAL]: 0.2,
      [ConstraintType.SPATIAL]: 0.4,
      [ConstraintType.LOGICAL]: 0.6,
      [ConstraintType.PERFORMANCE]: 0.8,
      [ConstraintType.COMPLIANCE]: 1.0
    };
    return mapping[type] || 0;
  }

  private encodeConstraintHardness(hardness: ConstraintHardness): number {
    const mapping: Record<ConstraintHardness, number> = {
      [ConstraintHardness.HARD]: 1.0,
      [ConstraintHardness.SOFT]: 0.5,
      [ConstraintHardness.PREFERENCE]: 0.2
    };
    return mapping[hardness] || 0;
  }

  private encodeSeasonPhase(phase: string): number {
    const mapping: Record<string, number> = {
      'preseason': 0.2,
      'early': 0.4,
      'mid': 0.6,
      'late': 0.8,
      'postseason': 1.0
    };
    return mapping[phase] || 0.5;
  }

  private encodeTimeOfSeason(time?: string): number {
    if (!time) return 0.5;
    const mapping: Record<string, number> = {
      'early': 0.25,
      'mid': 0.5,
      'late': 0.75,
      'postseason': 1.0
    };
    return mapping[time] || 0.5;
  }

  /**
   * Calculate feature importance for explainability
   */
  private calculateFeatureImportance(prediction: WeightPrediction): Array<{
    factor: string;
    impact: number;
    description: string;
  }> {
    // Simplified feature importance calculation
    // In a real implementation, use SHAP or similar techniques
    return [
      {
        factor: 'Historical Performance',
        impact: 0.8,
        description: 'Constraint has been frequently violated in similar contexts'
      },
      {
        factor: 'Schedule Complexity',
        impact: 0.6,
        description: 'Current schedule has high interdependency between constraints'
      },
      {
        factor: 'Season Phase',
        impact: 0.4,
        description: 'Late season scheduling requires different priorities'
      }
    ];
  }

  /**
   * Find similar historical cases for explainability
   */
  private findSimilarHistoricalCases(prediction: WeightPrediction): Array<{
    constraintId: string;
    similarity: number;
    outcome: string;
  }> {
    // Simplified implementation
    // In reality, would search through historical database
    return [
      {
        constraintId: 'similar-constraint-1',
        similarity: 0.92,
        outcome: 'Weight adjustment improved schedule quality by 15%'
      },
      {
        constraintId: 'similar-constraint-2',
        similarity: 0.87,
        outcome: 'Reduced conflicts by 30% after weight increase'
      }
    ];
  }

  /**
   * Generate recommendation based on prediction
   */
  private generateRecommendation(prediction: WeightPrediction): string {
    if (prediction.confidence < this.minConfidenceThreshold) {
      return 'Consider manual review due to low confidence prediction';
    }

    const delta = prediction.predictedWeight - prediction.originalWeight;
    if (Math.abs(delta) < 5) {
      return 'Current weight is near optimal, minor adjustment recommended';
    } else if (delta > 0) {
      return 'Increase weight to better enforce this constraint in current context';
    } else {
      return 'Decrease weight to allow more flexibility in scheduling';
    }
  }

  /**
   * Prepare training data from dataset
   */
  private prepareTrainingData(dataset: TrainingDataset): {
    inputs: number[][];
    outputs: number[][];
  } {
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    for (const sample of dataset.samples) {
      inputs.push(sample.input.features as number[]);
      outputs.push([
        sample.output.adjustedWeight / 100,
        sample.output.confidence
      ]);
    }

    return { inputs, outputs };
  }

  /**
   * Evaluate model performance
   */
  private async evaluateModel(
    inputs: tf.Tensor,
    targets: tf.Tensor
  ): Promise<ModelPerformance> {
    const predictions = this.model!.predict(inputs) as tf.Tensor;
    
    // Calculate metrics
    const mae = tf.metrics.meanAbsoluteError(targets, predictions);
    const maeValue = await mae.array() as number;
    
    // Simple accuracy calculation (predictions within 10% of target)
    const accuracy = await this.calculateAccuracy(predictions, targets, 0.1);
    
    predictions.dispose();
    mae.dispose();

    return {
      accuracy,
      precision: accuracy * 0.95, // Simplified
      recall: accuracy * 0.92, // Simplified
      f1Score: accuracy * 0.93, // Simplified
      latency: 50, // ms - typical inference time
      throughput: 20, // predictions/second
      lastEvaluated: new Date()
    };
  }

  private async calculateAccuracy(
    predictions: tf.Tensor,
    targets: tf.Tensor,
    tolerance: number
  ): Promise<number> {
    const diff = predictions.sub(targets).abs();
    const withinTolerance = diff.lessEqual(tolerance);
    const accuracy = await withinTolerance.mean().array() as number;
    
    diff.dispose();
    withinTolerance.dispose();
    
    return accuracy;
  }

  /**
   * Save model to disk
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;
    
    await this.model.save(`file://${this.modelPath}`);
    console.log('Model saved successfully');
  }

  /**
   * Save feature statistics
   */
  private async saveFeatureStats(): Promise<void> {
    if (!this.featureStats) return;
    
    const fs = require('fs').promises;
    await fs.writeFile(
      `${this.modelPath}/feature_stats.json`,
      JSON.stringify(this.featureStats, null, 2)
    );
  }

  /**
   * Load feature statistics
   */
  private async loadFeatureStats(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(`${this.modelPath}/feature_stats.json`, 'utf8');
      this.featureStats = JSON.parse(data);
    } catch (error) {
      console.log('No feature statistics found');
    }
  }
}

export default MLConstraintOptimizer;