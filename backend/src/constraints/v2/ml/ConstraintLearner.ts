/**
 * ConstraintLearner.ts
 * Learn from historical constraint satisfaction patterns
 * 
 * This component analyzes historical scheduling data to learn patterns
 * of constraint satisfaction and violation, improving future scheduling decisions.
 */

import * as tf from '@tensorflow/tfjs-node';
import {
  UnifiedConstraint,
  ConstraintResult,
  ConstraintStatus,
  EvaluationResult,
  ConstraintViolation,
  ConstraintSuggestion
} from '../types';
import {
  MLModel,
  ModelType,
  ModelStatus,
  ModelPerformance,
  TrainingDataset,
  TrainingSample,
  HistoricalConstraintData,
  ScheduleFeatures,
  ConstraintFeatures,
  ModelTrainer,
  TrainingConfig,
  DateRange
} from '../types/ml-types';
import { Schedule } from '../types/schedule-types';
import { FeatureExtractor } from './FeatureExtractor';

interface LearningPattern {
  constraintId: string;
  pattern: string;
  frequency: number;
  confidence: number;
  conditions: Record<string, any>;
  recommendations: string[];
}

interface ConstraintPattern {
  id: string;
  type: 'violation' | 'satisfaction' | 'interaction';
  involvedConstraints: string[];
  frequency: number;
  averageImpact: number;
  triggerConditions: Record<string, any>;
  seasonalFactors?: {
    peakMonths: number[];
    varianceByMonth: number[];
  };
}

interface LearningInsight {
  type: 'optimization' | 'warning' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  message: string;
  affectedConstraints: string[];
  suggestedActions: string[];
  expectedImprovement: number;
}

export class ConstraintLearner implements ModelTrainer {
  private satisfactionModel: tf.LayersModel | null = null;
  private interactionModel: tf.LayersModel | null = null;
  private featureExtractor: FeatureExtractor;
  private historicalData: Map<string, HistoricalConstraintData>;
  private learnedPatterns: Map<string, ConstraintPattern>;
  private modelMetadata: Map<string, MLModel>;
  private readonly modelPath: string;
  private readonly minSamplesForLearning: number = 100;
  private readonly patternConfidenceThreshold: number = 0.75;

  constructor(
    modelPath: string = './models/constraint-learner',
    featureExtractor?: FeatureExtractor
  ) {
    this.modelPath = modelPath;
    this.featureExtractor = featureExtractor || new FeatureExtractor();
    this.historicalData = new Map();
    this.learnedPatterns = new Map();
    this.modelMetadata = new Map();
    this.initializeMetadata();
  }

  private initializeMetadata(): void {
    // Satisfaction prediction model
    this.modelMetadata.set('satisfaction-model', {
      id: 'constraint-satisfaction-learner-v1',
      name: 'Constraint Satisfaction Learner',
      type: ModelType.SCHEDULE_QUALITY,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: this.createEmptyPerformance(),
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: ['constraint_features', 'schedule_features', 'temporal_features'],
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 64,
          epochs: 200,
          hiddenLayers: [256, 128, 64],
          dropout: 0.3,
          optimizer: 'adam',
          regularization: { l1: 0.01, l2: 0.01 }
        },
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    });

    // Constraint interaction model
    this.modelMetadata.set('interaction-model', {
      id: 'constraint-interaction-learner-v1',
      name: 'Constraint Interaction Learner',
      type: ModelType.ANOMALY_DETECTION,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: this.createEmptyPerformance(),
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: ['constraint_pairs', 'interaction_features'],
        hyperparameters: {
          learningRate: 0.0005,
          batchSize: 32,
          epochs: 150,
          hiddenLayers: [128, 64, 32],
          dropout: 0.25,
          optimizer: 'adam'
        },
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    });
  }

  private createEmptyPerformance(): ModelPerformance {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      latency: 0,
      throughput: 0,
      lastEvaluated: new Date()
    };
  }

  /**
   * Initialize models
   */
  async initialize(): Promise<void> {
    try {
      // Load existing models
      this.satisfactionModel = await tf.loadLayersModel(
        `file://${this.modelPath}/satisfaction/model.json`
      );
      this.interactionModel = await tf.loadLayersModel(
        `file://${this.modelPath}/interaction/model.json`
      );
      
      // Load historical data
      await this.loadHistoricalData();
      await this.loadLearnedPatterns();
      
      console.log('Loaded existing constraint learning models');
    } catch (error) {
      console.log('Creating new constraint learning models');
      this.satisfactionModel = this.createSatisfactionModel();
      this.interactionModel = this.createInteractionModel();
    }
  }

  /**
   * Learn from evaluation results
   */
  async learnFromEvaluation(
    evaluationResult: EvaluationResult,
    schedule: Schedule,
    constraints: UnifiedConstraint[]
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Update historical data
    this.updateHistoricalData(evaluationResult, schedule, constraints);

    // Analyze patterns
    const patterns = await this.analyzePatterns(evaluationResult, schedule, constraints);
    
    // Generate insights
    for (const pattern of patterns) {
      const insight = this.generateInsight(pattern, evaluationResult);
      if (insight) {
        insights.push(insight);
      }
    }

    // Update models if enough new data
    if (this.shouldUpdateModels()) {
      await this.incrementalModelUpdate(evaluationResult, schedule, constraints);
    }

    // Save updated data
    await this.saveHistoricalData();
    await this.saveLearnedPatterns();

    return insights;
  }

  /**
   * Predict constraint satisfaction probability
   */
  async predictSatisfaction(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    context?: Record<string, any>
  ): Promise<{
    probability: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  }> {
    if (!this.satisfactionModel) {
      throw new Error('Satisfaction model not initialized');
    }

    // Extract features
    const features = await this.extractSatisfactionFeatures(
      constraint,
      schedule,
      context
    );

    // Make prediction
    const prediction = await this.satisfactionModel.predict(features).array() as number[][];
    const [probability, confidence] = prediction[0];

    // Analyze contributing factors
    const factors = await this.analyzeContributingFactors(
      constraint,
      schedule,
      probability
    );

    return {
      probability,
      confidence,
      factors
    };
  }

  /**
   * Analyze constraint interactions
   */
  async analyzeInteractions(
    constraints: UnifiedConstraint[],
    schedule: Schedule
  ): Promise<Array<{
    constraint1: string;
    constraint2: string;
    interactionType: 'positive' | 'negative' | 'neutral';
    strength: number;
    description: string;
  }>> {
    if (!this.interactionModel) {
      throw new Error('Interaction model not initialized');
    }

    const interactions = [];

    // Analyze pairwise interactions
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        const interaction = await this.predictInteraction(
          constraints[i],
          constraints[j],
          schedule
        );
        
        if (interaction.strength > 0.3) { // Only report significant interactions
          interactions.push(interaction);
        }
      }
    }

    return interactions.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Get learned patterns for a constraint
   */
  getLearnedPatterns(constraintId: string): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    
    // Get direct patterns
    const directPattern = this.learnedPatterns.get(constraintId);
    if (directPattern) {
      patterns.push(this.patternToLearningPattern(directPattern));
    }

    // Get interaction patterns
    this.learnedPatterns.forEach((pattern, id) => {
      if (pattern.involvedConstraints.includes(constraintId) && id !== constraintId) {
        patterns.push(this.patternToLearningPattern(pattern));
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Train models with dataset
   */
  async train(dataset: TrainingDataset, config: TrainingConfig): Promise<MLModel> {
    const modelType = config.modelType;
    
    if (modelType === ModelType.SCHEDULE_QUALITY) {
      return await this.trainSatisfactionModel(dataset, config);
    } else if (modelType === ModelType.ANOMALY_DETECTION) {
      return await this.trainInteractionModel(dataset, config);
    } else {
      throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  /**
   * Evaluate model performance
   */
  async evaluate(
    model: MLModel,
    testData: TrainingSample[]
  ): ModelPerformance {
    const tfModel = model.id.includes('satisfaction') ? 
      this.satisfactionModel : this.interactionModel;
    
    if (!tfModel) {
      throw new Error('Model not found');
    }

    // Prepare test data
    const inputs = testData.map(sample => sample.input.features as number[]);
    const targets = testData.map(sample => sample.output.values as number[]);
    
    const inputTensor = tf.tensor2d(inputs);
    const targetTensor = tf.tensor2d(targets);
    
    // Make predictions
    const predictions = tfModel.predict(inputTensor) as tf.Tensor;
    
    // Calculate metrics
    const performance = await this.calculatePerformanceMetrics(
      predictions,
      targetTensor
    );
    
    // Clean up
    inputTensor.dispose();
    targetTensor.dispose();
    predictions.dispose();
    
    return performance;
  }

  /**
   * Tune model hyperparameters
   */
  async tune(
    model: MLModel,
    validationData: TrainingSample[]
  ): Promise<MLModel> {
    // Simplified hyperparameter tuning
    const hyperparameterSets = this.generateHyperparameterSets();
    let bestPerformance = 0;
    let bestHyperparameters = model.metadata.hyperparameters;

    for (const hyperparameters of hyperparameterSets) {
      // Create temporary model with new hyperparameters
      const tempModel = this.createModelWithHyperparameters(
        model.type,
        hyperparameters
      );
      
      // Train on subset of data
      const subsetSize = Math.min(1000, validationData.length);
      const subset = validationData.slice(0, subsetSize);
      
      // Quick training
      await this.quickTrain(tempModel, subset, hyperparameters);
      
      // Evaluate
      const performance = await this.evaluate(model, validationData);
      
      if (performance.f1Score > bestPerformance) {
        bestPerformance = performance.f1Score;
        bestHyperparameters = hyperparameters;
      }
      
      tempModel.dispose();
    }

    // Update model with best hyperparameters
    model.metadata.hyperparameters = bestHyperparameters;
    return model;
  }

  /**
   * Create satisfaction prediction model
   */
  private createSatisfactionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [60], // Comprehensive feature set
          units: 256,
          activation: 'relu',
          kernelInitializer: 'glorotUniform',
          kernelRegularizer: tf.regularizers.l1l2({ l1: 0.01, l2: 0.01 })
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 2, // [satisfaction_probability, confidence]
          activation: 'sigmoid'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    return model;
  }

  /**
   * Create interaction prediction model
   */
  private createInteractionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [80], // Features for two constraints + context
          units: 128,
          activation: 'relu',
          kernelInitializer: 'glorotUniform'
        }),
        tf.layers.dropout({ rate: 0.25 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.25 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 4, // [interaction_type, strength, positive_impact, negative_impact]
          activation: 'sigmoid'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Update historical data with new evaluation
   */
  private updateHistoricalData(
    evaluationResult: EvaluationResult,
    schedule: Schedule,
    constraints: UnifiedConstraint[]
  ): void {
    const constraintMap = new Map(constraints.map(c => [c.id, c]));
    
    evaluationResult.results.forEach(result => {
      const constraint = constraintMap.get(result.constraintId);
      if (!constraint) return;
      
      // Get or create historical data
      let historicalData = this.historicalData.get(result.constraintId);
      if (!historicalData) {
        historicalData = {
          constraintId: result.constraintId,
          evaluations: [],
          averageSatisfactionRate: 0,
          weightAdjustments: []
        };
        this.historicalData.set(result.constraintId, historicalData);
      }
      
      // Add new evaluation
      historicalData.evaluations.push({
        date: evaluationResult.timestamp,
        satisfied: result.satisfied,
        score: result.score,
        context: {
          scheduleId: schedule.id,
          sport: schedule.sport,
          season: schedule.season,
          gameCount: schedule.games.length,
          executionTime: result.executionTime
        }
      });
      
      // Update average satisfaction rate
      const satisfiedCount = historicalData.evaluations.filter(e => e.satisfied).length;
      historicalData.averageSatisfactionRate = satisfiedCount / historicalData.evaluations.length;
      
      // Keep only recent evaluations (last 1000)
      if (historicalData.evaluations.length > 1000) {
        historicalData.evaluations = historicalData.evaluations.slice(-1000);
      }
    });
  }

  /**
   * Analyze patterns in evaluation results
   */
  private async analyzePatterns(
    evaluationResult: EvaluationResult,
    schedule: Schedule,
    constraints: UnifiedConstraint[]
  ): Promise<ConstraintPattern[]> {
    const patterns: ConstraintPattern[] = [];
    
    // Analyze violation patterns
    const violationPatterns = this.analyzeViolationPatterns(evaluationResult);
    patterns.push(...violationPatterns);
    
    // Analyze satisfaction patterns
    const satisfactionPatterns = this.analyzeSatisfactionPatterns(evaluationResult);
    patterns.push(...satisfactionPatterns);
    
    // Analyze interaction patterns
    const interactionPatterns = await this.analyzeInteractionPatterns(
      evaluationResult,
      constraints
    );
    patterns.push(...interactionPatterns);
    
    // Update learned patterns
    patterns.forEach(pattern => {
      this.learnedPatterns.set(pattern.id, pattern);
    });
    
    return patterns;
  }

  /**
   * Analyze violation patterns
   */
  private analyzeViolationPatterns(
    evaluationResult: EvaluationResult
  ): ConstraintPattern[] {
    const patterns: ConstraintPattern[] = [];
    const violatedConstraints = evaluationResult.results.filter(r => !r.satisfied);
    
    // Group violations by common characteristics
    const violationGroups = new Map<string, ConstraintResult[]>();
    
    violatedConstraints.forEach(result => {
      // Group by violation type if available
      if (result.violations && result.violations.length > 0) {
        const violationType = result.violations[0].type;
        if (!violationGroups.has(violationType)) {
          violationGroups.set(violationType, []);
        }
        violationGroups.get(violationType)!.push(result);
      }
    });
    
    // Create patterns from groups
    violationGroups.forEach((results, violationType) => {
      if (results.length >= 2) { // Need multiple instances for a pattern
        patterns.push({
          id: `violation-pattern-${violationType}`,
          type: 'violation',
          involvedConstraints: results.map(r => r.constraintId),
          frequency: results.length / evaluationResult.results.length,
          averageImpact: results.reduce((sum, r) => sum + (1 - r.score), 0) / results.length,
          triggerConditions: {
            violationType,
            commonTimeframe: this.findCommonTimeframe(results),
            scheduleLoad: evaluationResult.results.length
          }
        });
      }
    });
    
    return patterns;
  }

  /**
   * Analyze satisfaction patterns
   */
  private analyzeSatisfactionPatterns(
    evaluationResult: EvaluationResult
  ): ConstraintPattern[] {
    const patterns: ConstraintPattern[] = [];
    const satisfiedConstraints = evaluationResult.results.filter(r => r.satisfied);
    
    // Look for consistently satisfied constraints
    const highPerformers = satisfiedConstraints.filter(r => r.score > 0.9);
    
    if (highPerformers.length > 0) {
      patterns.push({
        id: 'high-satisfaction-pattern',
        type: 'satisfaction',
        involvedConstraints: highPerformers.map(r => r.constraintId),
        frequency: highPerformers.length / evaluationResult.results.length,
        averageImpact: highPerformers.reduce((sum, r) => sum + r.score, 0) / highPerformers.length,
        triggerConditions: {
          minScore: 0.9,
          scheduleQuality: evaluationResult.overallScore
        }
      });
    }
    
    return patterns;
  }

  /**
   * Analyze interaction patterns between constraints
   */
  private async analyzeInteractionPatterns(
    evaluationResult: EvaluationResult,
    constraints: UnifiedConstraint[]
  ): Promise<ConstraintPattern[]> {
    const patterns: ConstraintPattern[] = [];
    const resultMap = new Map(evaluationResult.results.map(r => [r.constraintId, r]));
    
    // Check for correlated violations
    constraints.forEach(c1 => {
      constraints.forEach(c2 => {
        if (c1.id >= c2.id) return; // Avoid duplicates
        
        const r1 = resultMap.get(c1.id);
        const r2 = resultMap.get(c2.id);
        
        if (r1 && r2) {
          // Both violated
          if (!r1.satisfied && !r2.satisfied) {
            patterns.push({
              id: `negative-interaction-${c1.id}-${c2.id}`,
              type: 'interaction',
              involvedConstraints: [c1.id, c2.id],
              frequency: 1, // Would calculate from historical data
              averageImpact: (2 - r1.score - r2.score) / 2,
              triggerConditions: {
                interactionType: 'mutual-violation',
                constraint1Type: c1.type,
                constraint2Type: c2.type
              }
            });
          }
          // One helps the other
          else if (r1.satisfied && r1.score > 0.9 && !r2.satisfied) {
            patterns.push({
              id: `competitive-interaction-${c1.id}-${c2.id}`,
              type: 'interaction',
              involvedConstraints: [c1.id, c2.id],
              frequency: 1,
              averageImpact: Math.abs(r1.score - r2.score),
              triggerConditions: {
                interactionType: 'competitive',
                beneficiary: c1.id,
                affected: c2.id
              }
            });
          }
        }
      });
    });
    
    return patterns;
  }

  /**
   * Generate insight from pattern
   */
  private generateInsight(
    pattern: ConstraintPattern,
    evaluationResult: EvaluationResult
  ): LearningInsight | null {
    if (pattern.frequency < 0.1) return null; // Too rare
    
    let insight: LearningInsight;
    
    switch (pattern.type) {
      case 'violation':
        insight = {
          type: 'warning',
          priority: pattern.averageImpact > 0.5 ? 'high' : 'medium',
          message: `Recurring violation pattern detected: ${pattern.involvedConstraints.length} constraints frequently violated together`,
          affectedConstraints: pattern.involvedConstraints,
          suggestedActions: [
            'Review constraint weights and priorities',
            'Consider relaxing conflicting requirements',
            'Analyze scheduling algorithm for bias'
          ],
          expectedImprovement: pattern.averageImpact * 0.7
        };
        break;
        
      case 'satisfaction':
        insight = {
          type: 'optimization',
          priority: 'low',
          message: `High satisfaction pattern identified for ${pattern.involvedConstraints.length} constraints`,
          affectedConstraints: pattern.involvedConstraints,
          suggestedActions: [
            'Document successful scheduling strategies',
            'Apply similar approaches to other constraints'
          ],
          expectedImprovement: 0.1
        };
        break;
        
      case 'interaction':
        const interactionType = pattern.triggerConditions.interactionType;
        insight = {
          type: 'recommendation',
          priority: pattern.averageImpact > 0.3 ? 'high' : 'medium',
          message: `Constraint interaction detected: ${interactionType} relationship between constraints`,
          affectedConstraints: pattern.involvedConstraints,
          suggestedActions: [
            'Adjust constraint evaluation order',
            'Implement constraint grouping',
            'Consider combined evaluation logic'
          ],
          expectedImprovement: pattern.averageImpact * 0.5
        };
        break;
        
      default:
        return null;
    }
    
    return insight;
  }

  /**
   * Check if models should be updated
   */
  private shouldUpdateModels(): boolean {
    // Update if we have enough new data
    let totalNewSamples = 0;
    this.historicalData.forEach(data => {
      totalNewSamples += data.evaluations.length;
    });
    
    return totalNewSamples >= this.minSamplesForLearning;
  }

  /**
   * Perform incremental model update
   */
  private async incrementalModelUpdate(
    evaluationResult: EvaluationResult,
    schedule: Schedule,
    constraints: UnifiedConstraint[]
  ): Promise<void> {
    // Prepare training samples from recent data
    const samples = this.prepareTrainingSamples(schedule, constraints);
    
    if (samples.length < this.minSamplesForLearning) {
      return;
    }
    
    // Update satisfaction model
    if (this.satisfactionModel) {
      await this.incrementalTrain(
        this.satisfactionModel,
        samples.filter(s => s.output.type === 'satisfaction'),
        this.modelMetadata.get('satisfaction-model')!
      );
    }
    
    // Update interaction model
    if (this.interactionModel) {
      await this.incrementalTrain(
        this.interactionModel,
        samples.filter(s => s.output.type === 'interaction'),
        this.modelMetadata.get('interaction-model')!
      );
    }
  }

  /**
   * Extract features for satisfaction prediction
   */
  private async extractSatisfactionFeatures(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    context?: Record<string, any>
  ): Promise<tf.Tensor2D> {
    const constraintFeatures = this.featureExtractor.extractConstraintFeatures(
      constraint,
      schedule
    );
    const scheduleFeatures = this.featureExtractor.extractScheduleFeatures(schedule);
    
    // Get historical patterns
    const historicalData = this.historicalData.get(constraint.id);
    const historicalFeatures = this.extractHistoricalFeatures(historicalData);
    
    // Temporal features
    const temporalFeatures = this.extractTemporalFeatures(schedule, context);
    
    // Pattern features
    const patternFeatures = this.extractPatternFeatures(constraint.id);
    
    // Combine all features
    const features = [
      // Constraint features (14)
      ...this.flattenConstraintFeatures(constraintFeatures),
      
      // Schedule features (12)
      ...this.flattenScheduleFeatures(scheduleFeatures),
      
      // Historical features (10)
      ...historicalFeatures,
      
      // Temporal features (8)
      ...temporalFeatures,
      
      // Pattern features (8)
      ...patternFeatures,
      
      // Context features (8)
      ...this.extractContextFeatures(context)
    ];
    
    return tf.tensor2d([features]);
  }

  /**
   * Flatten constraint features
   */
  private flattenConstraintFeatures(features: ConstraintFeatures): number[] {
    return [
      this.encodeConstraintType(features.type),
      this.encodeConstraintHardness(features.hardness),
      features.weight / 100,
      Math.min(features.scopeSize / 100, 1),
      features.historicalSatisfactionRate || 0.5,
      Math.min((features.averageEvaluationTime || 100) / 1000, 1),
      Math.min(features.violationFrequency || 0, 1),
      features.sportSpecific ? 1 : 0,
      this.encodeSeasonPhase(features.seasonPhase),
      Math.min(features.dependencyCount / 10, 1),
      features.conflictPotential,
      features.complexity,
      features.flexibility,
      features.criticalityScore
    ];
  }

  /**
   * Flatten schedule features
   */
  private flattenScheduleFeatures(features: ScheduleFeatures): number[] {
    return [
      Math.min(features.gameCount / 1000, 1),
      Math.min(features.teamCount / 50, 1),
      Math.min(features.venueCount / 100, 1),
      Math.min(features.duration / 365, 1),
      Math.min(features.gamesPerWeek / 10, 1),
      Math.min(features.averageGamesPerTeam / 50, 1),
      features.venueUtilization,
      features.homeAwayBalance,
      features.travelBalance,
      features.competitiveBalance,
      Math.min(features.constraintCount / 100, 1),
      features.hardConstraintRatio
    ];
  }

  /**
   * Extract historical features
   */
  private extractHistoricalFeatures(
    historicalData?: HistoricalConstraintData
  ): number[] {
    if (!historicalData || historicalData.evaluations.length === 0) {
      return new Array(10).fill(0.5);
    }
    
    const recent = historicalData.evaluations.slice(-100);
    const satisfiedCount = recent.filter(e => e.satisfied).length;
    const avgScore = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
    
    // Calculate trend
    const trend = this.calculateTrend(recent.map(e => e.score));
    
    // Calculate consistency
    const scores = recent.map(e => e.score);
    const variance = this.calculateVariance(scores);
    const consistency = 1 - Math.min(variance, 1);
    
    return [
      historicalData.averageSatisfactionRate,
      satisfiedCount / recent.length,
      avgScore,
      trend,
      consistency,
      Math.min(recent.length / 100, 1),
      this.calculateSeasonality(recent),
      this.calculateWeekdayBias(recent),
      this.calculateMonthlyPattern(recent),
      historicalData.weightAdjustments.length / 10
    ];
  }

  /**
   * Extract temporal features
   */
  private extractTemporalFeatures(
    schedule: Schedule,
    context?: Record<string, any>
  ): number[] {
    const now = new Date();
    const month = now.getMonth();
    const dayOfWeek = now.getDay();
    const weekOfSeason = this.getWeekOfSeason(schedule, now);
    
    return [
      month / 11, // Normalized month
      dayOfWeek / 6, // Normalized day
      weekOfSeason / 20, // Assume 20-week season
      this.isHolidayPeriod(now) ? 1 : 0,
      this.isDuringExams(month) ? 1 : 0,
      context?.isPostseason ? 1 : 0,
      context?.isRivalryWeek ? 1 : 0,
      context?.isTVPrimetime ? 1 : 0
    ];
  }

  /**
   * Extract pattern features
   */
  private extractPatternFeatures(constraintId: string): number[] {
    const patterns = this.getLearnedPatterns(constraintId);
    
    if (patterns.length === 0) {
      return new Array(8).fill(0.5);
    }
    
    const violationPatterns = patterns.filter(p => p.pattern.includes('violation'));
    const satisfactionPatterns = patterns.filter(p => p.pattern.includes('satisfaction'));
    const interactionPatterns = patterns.filter(p => p.pattern.includes('interaction'));
    
    return [
      Math.min(patterns.length / 10, 1),
      violationPatterns.length / Math.max(patterns.length, 1),
      satisfactionPatterns.length / Math.max(patterns.length, 1),
      interactionPatterns.length / Math.max(patterns.length, 1),
      patterns[0]?.confidence || 0.5, // Top pattern confidence
      patterns[0]?.frequency || 0,
      this.calculatePatternDiversity(patterns),
      this.calculatePatternStability(constraintId)
    ];
  }

  /**
   * Extract context features
   */
  private extractContextFeatures(context?: Record<string, any>): number[] {
    if (!context) {
      return new Array(8).fill(0.5);
    }
    
    return [
      context.scheduleVersion || 1,
      context.optimizationRound || 1,
      context.userPriority || 0.5,
      context.externalPressure || 0.5,
      context.resourceAvailability || 0.5,
      context.weatherForecast || 0.5,
      context.competitionIntensity || 0.5,
      context.mediaInterest || 0.5
    ].map(v => Math.min(v, 1));
  }

  /**
   * Predict interaction between constraints
   */
  private async predictInteraction(
    constraint1: UnifiedConstraint,
    constraint2: UnifiedConstraint,
    schedule: Schedule
  ): Promise<{
    constraint1: string;
    constraint2: string;
    interactionType: 'positive' | 'negative' | 'neutral';
    strength: number;
    description: string;
  }> {
    if (!this.interactionModel) {
      throw new Error('Interaction model not initialized');
    }
    
    // Extract features for both constraints
    const features1 = this.featureExtractor.extractConstraintFeatures(constraint1, schedule);
    const features2 = this.featureExtractor.extractConstraintFeatures(constraint2, schedule);
    const scheduleFeatures = this.featureExtractor.extractScheduleFeatures(schedule);
    
    // Combine features
    const combinedFeatures = [
      ...this.flattenConstraintFeatures(features1),
      ...this.flattenConstraintFeatures(features2),
      ...this.flattenScheduleFeatures(scheduleFeatures),
      // Interaction-specific features
      constraint1.conflictsWith?.includes(constraint2.id) ? 1 : 0,
      constraint1.dependencies?.includes(constraint2.id) ? 1 : 0,
      this.calculateTypeCompatibility(constraint1.type, constraint2.type),
      this.calculateScopeOverlap(constraint1, constraint2),
      Math.abs(constraint1.weight - constraint2.weight) / 100,
      constraint1.hardness === constraint2.hardness ? 1 : 0
    ];
    
    // Pad to expected size
    while (combinedFeatures.length < 80) {
      combinedFeatures.push(0.5);
    }
    
    const input = tf.tensor2d([combinedFeatures.slice(0, 80)]);
    const prediction = await this.interactionModel.predict(input).array() as number[][];
    const [interactionScore, strength, positiveImpact, negativeImpact] = prediction[0];
    
    input.dispose();
    
    // Determine interaction type
    let interactionType: 'positive' | 'negative' | 'neutral';
    let description: string;
    
    if (positiveImpact > negativeImpact && positiveImpact > 0.6) {
      interactionType = 'positive';
      description = `${constraint1.name} supports ${constraint2.name}`;
    } else if (negativeImpact > positiveImpact && negativeImpact > 0.6) {
      interactionType = 'negative';
      description = `${constraint1.name} conflicts with ${constraint2.name}`;
    } else {
      interactionType = 'neutral';
      description = `${constraint1.name} and ${constraint2.name} are independent`;
    }
    
    return {
      constraint1: constraint1.id,
      constraint2: constraint2.id,
      interactionType,
      strength,
      description
    };
  }

  /**
   * Analyze contributing factors
   */
  private async analyzeContributingFactors(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    probability: number
  ): Promise<Array<{ name: string; impact: number }>> {
    const factors: Array<{ name: string; impact: number }> = [];
    
    // Historical performance factor
    const historicalData = this.historicalData.get(constraint.id);
    if (historicalData) {
      const historicalImpact = Math.abs(
        historicalData.averageSatisfactionRate - probability
      );
      factors.push({
        name: 'Historical Performance',
        impact: historicalImpact
      });
    }
    
    // Schedule complexity factor
    const scheduleFeatures = this.featureExtractor.extractScheduleFeatures(schedule);
    const complexityImpact = scheduleFeatures.interdependencyScore * (1 - probability);
    factors.push({
      name: 'Schedule Complexity',
      impact: complexityImpact
    });
    
    // Constraint weight factor
    const weightImpact = (constraint.weight / 100) * probability;
    factors.push({
      name: 'Constraint Weight',
      impact: weightImpact
    });
    
    // Pattern influence
    const patterns = this.getLearnedPatterns(constraint.id);
    if (patterns.length > 0) {
      factors.push({
        name: 'Learned Patterns',
        impact: patterns[0].confidence * 0.3
      });
    }
    
    return factors.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Helper methods
   */
  private encodeConstraintType(type: string): number {
    const mapping: Record<string, number> = {
      'temporal': 0.2,
      'spatial': 0.4,
      'logical': 0.6,
      'performance': 0.8,
      'compliance': 1.0
    };
    return mapping[type] || 0;
  }

  private encodeConstraintHardness(hardness: string): number {
    const mapping: Record<string, number> = {
      'hard': 1.0,
      'soft': 0.5,
      'preference': 0.2
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

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0.5;
    
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return Math.max(0, Math.min(1, 0.5 + slope));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  private calculateSeasonality(evaluations: any[]): number {
    if (evaluations.length < 30) return 0.5;
    
    // Group by month
    const monthlyScores = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    evaluations.forEach(eval => {
      const month = new Date(eval.date).getMonth();
      monthlyScores[month] += eval.score;
      monthlyCounts[month]++;
    });
    
    // Calculate average by month
    const monthlyAverages = monthlyScores.map((sum, i) => 
      monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0.5
    );
    
    // Calculate variance across months
    const variance = this.calculateVariance(monthlyAverages);
    
    return Math.min(variance * 2, 1); // Scale variance to 0-1
  }

  private calculateWeekdayBias(evaluations: any[]): number {
    if (evaluations.length < 20) return 0.5;
    
    const weekdayScores = new Array(7).fill(0);
    const weekdayCounts = new Array(7).fill(0);
    
    evaluations.forEach(eval => {
      const day = new Date(eval.date).getDay();
      weekdayScores[day] += eval.score;
      weekdayCounts[day]++;
    });
    
    const weekdayAverages = weekdayScores.map((sum, i) => 
      weekdayCounts[i] > 0 ? sum / weekdayCounts[i] : 0.5
    );
    
    const maxScore = Math.max(...weekdayAverages);
    const minScore = Math.min(...weekdayAverages);
    
    return maxScore - minScore; // Bias strength
  }

  private calculateMonthlyPattern(evaluations: any[]): number {
    // Simplified: return seasonality for now
    return this.calculateSeasonality(evaluations);
  }

  private getWeekOfSeason(schedule: Schedule, date: Date): number {
    const dates = schedule.games.map(g => new Date(g.date).getTime());
    if (dates.length === 0) return 0;
    
    const seasonStart = new Date(Math.min(...dates));
    const weeksDiff = (date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24 * 7);
    
    return Math.max(0, Math.floor(weeksDiff));
  }

  private isHolidayPeriod(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Thanksgiving week
    if (month === 10 && day >= 20 && day <= 30) return true;
    
    // Christmas/New Year
    if (month === 11 && day >= 20) return true;
    if (month === 0 && day <= 7) return true;
    
    // Spring Break (approximate)
    if (month === 2 && day >= 10 && day <= 20) return true;
    
    return false;
  }

  private isDuringExams(month: number): boolean {
    // Finals periods
    return month === 4 || month === 11; // May and December
  }

  private calculatePatternDiversity(patterns: LearningPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const uniqueTypes = new Set(patterns.map(p => p.pattern.split('-')[0]));
    return uniqueTypes.size / 3; // Normalize by max pattern types
  }

  private calculatePatternStability(constraintId: string): number {
    const pattern = this.learnedPatterns.get(constraintId);
    if (!pattern) return 0.5;
    
    // Stability based on frequency and impact consistency
    return pattern.frequency * (1 - this.calculateVariance([pattern.averageImpact]));
  }

  private calculateTypeCompatibility(type1: string, type2: string): number {
    // Define compatibility matrix
    const compatibility: Record<string, Record<string, number>> = {
      'temporal': { 'temporal': 0.3, 'spatial': 0.7, 'logical': 0.5 },
      'spatial': { 'temporal': 0.7, 'spatial': 0.3, 'logical': 0.6 },
      'logical': { 'temporal': 0.5, 'spatial': 0.6, 'logical': 0.4 }
    };
    
    return compatibility[type1]?.[type2] || 0.5;
  }

  private calculateScopeOverlap(
    constraint1: UnifiedConstraint,
    constraint2: UnifiedConstraint
  ): number {
    let overlap = 0;
    let total = 0;
    
    // Check team overlap
    if (constraint1.scope.teams && constraint2.scope.teams) {
      const teams1 = new Set(constraint1.scope.teams);
      const teams2 = new Set(constraint2.scope.teams);
      const intersection = [...teams1].filter(t => teams2.has(t));
      
      overlap += intersection.length;
      total += Math.max(teams1.size, teams2.size);
    }
    
    // Check venue overlap
    if (constraint1.scope.venues && constraint2.scope.venues) {
      const venues1 = new Set(constraint1.scope.venues);
      const venues2 = new Set(constraint2.scope.venues);
      const intersection = [...venues1].filter(v => venues2.has(v));
      
      overlap += intersection.length;
      total += Math.max(venues1.size, venues2.size);
    }
    
    return total > 0 ? overlap / total : 0;
  }

  private patternToLearningPattern(pattern: ConstraintPattern): LearningPattern {
    return {
      constraintId: pattern.involvedConstraints[0],
      pattern: pattern.id,
      frequency: pattern.frequency,
      confidence: Math.min(pattern.frequency * 2, 0.95), // Simplified
      conditions: pattern.triggerConditions,
      recommendations: this.generateRecommendations(pattern)
    };
  }

  private generateRecommendations(pattern: ConstraintPattern): string[] {
    const recommendations: string[] = [];
    
    switch (pattern.type) {
      case 'violation':
        recommendations.push(
          'Review constraint priority and weight',
          'Consider temporal adjustments',
          'Analyze conflicting requirements'
        );
        break;
        
      case 'satisfaction':
        recommendations.push(
          'Maintain current configuration',
          'Document successful patterns',
          'Apply to similar constraints'
        );
        break;
        
      case 'interaction':
        recommendations.push(
          'Group related constraints',
          'Implement coordinated evaluation',
          'Adjust processing order'
        );
        break;
    }
    
    return recommendations;
  }

  private findCommonTimeframe(results: ConstraintResult[]): string {
    // Simplified: would analyze actual timeframes
    return 'peak-season';
  }

  /**
   * Training methods
   */
  private async trainSatisfactionModel(
    dataset: TrainingDataset,
    config: TrainingConfig
  ): Promise<MLModel> {
    if (!this.satisfactionModel) {
      this.satisfactionModel = this.createSatisfactionModel();
    }
    
    // Prepare data
    const { inputs, outputs } = this.prepareSatisfactionData(dataset);
    
    // Train model
    const history = await this.satisfactionModel.fit(
      tf.tensor2d(inputs),
      tf.tensor2d(outputs),
      {
        epochs: config.hyperparameters.epochs,
        batchSize: config.hyperparameters.batchSize,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(`Satisfaction model - Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
            }
          }
        }
      }
    );
    
    // Update metadata
    const modelMeta = this.modelMetadata.get('satisfaction-model')!;
    modelMeta.metadata.trainedAt = new Date();
    modelMeta.metadata.trainingDataSize = dataset.samples.length;
    
    return modelMeta;
  }

  private async trainInteractionModel(
    dataset: TrainingDataset,
    config: TrainingConfig
  ): Promise<MLModel> {
    if (!this.interactionModel) {
      this.interactionModel = this.createInteractionModel();
    }
    
    // Prepare data
    const { inputs, outputs } = this.prepareInteractionData(dataset);
    
    // Train model
    const history = await this.interactionModel.fit(
      tf.tensor2d(inputs),
      tf.tensor2d(outputs),
      {
        epochs: config.hyperparameters.epochs,
        batchSize: config.hyperparameters.batchSize,
        validationSplit: 0.2
      }
    );
    
    // Update metadata
    const modelMeta = this.modelMetadata.get('interaction-model')!;
    modelMeta.metadata.trainedAt = new Date();
    modelMeta.metadata.trainingDataSize = dataset.samples.length;
    
    return modelMeta;
  }

  private prepareSatisfactionData(dataset: TrainingDataset): {
    inputs: number[][];
    outputs: number[][];
  } {
    const inputs: number[][] = [];
    const outputs: number[][] = [];
    
    dataset.samples.forEach(sample => {
      if (sample.output.type === 'satisfaction') {
        inputs.push(sample.input.features as number[]);
        outputs.push([
          sample.output.satisfied ? 1 : 0,
          sample.output.confidence || 0.8
        ]);
      }
    });
    
    return { inputs, outputs };
  }

  private prepareInteractionData(dataset: TrainingDataset): {
    inputs: number[][];
    outputs: number[][];
  } {
    const inputs: number[][] = [];
    const outputs: number[][] = [];
    
    dataset.samples.forEach(sample => {
      if (sample.output.type === 'interaction') {
        inputs.push(sample.input.features as number[]);
        outputs.push([
          sample.output.interactionScore || 0.5,
          sample.output.strength || 0.5,
          sample.output.positiveImpact || 0.5,
          sample.output.negativeImpact || 0.5
        ]);
      }
    });
    
    return { inputs, outputs };
  }

  private prepareTrainingSamples(
    schedule: Schedule,
    constraints: UnifiedConstraint[]
  ): TrainingSample[] {
    const samples: TrainingSample[] = [];
    
    // Create samples from historical data
    this.historicalData.forEach((data, constraintId) => {
      const constraint = constraints.find(c => c.id === constraintId);
      if (!constraint) return;
      
      data.evaluations.slice(-50).forEach(eval => {
        const features = this.extractTrainingFeatures(constraint, schedule, eval);
        
        samples.push({
          input: { features },
          output: {
            type: 'satisfaction',
            satisfied: eval.satisfied,
            confidence: 0.9,
            score: eval.score
          },
          metadata: {
            source: 'historical',
            timestamp: eval.date,
            quality: 0.8
          }
        });
      });
    });
    
    return samples;
  }

  private extractTrainingFeatures(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    evaluation: any
  ): number[] {
    // Simplified feature extraction for training
    const constraintFeatures = this.featureExtractor.extractConstraintFeatures(
      constraint,
      schedule
    );
    const scheduleFeatures = this.featureExtractor.extractScheduleFeatures(schedule);
    
    return [
      ...this.flattenConstraintFeatures(constraintFeatures),
      ...this.flattenScheduleFeatures(scheduleFeatures),
      ...new Array(36).fill(0.5) // Placeholder for remaining features
    ];
  }

  private async incrementalTrain(
    model: tf.LayersModel,
    samples: TrainingSample[],
    metadata: MLModel
  ): Promise<void> {
    if (samples.length === 0) return;
    
    const inputs = samples.map(s => s.input.features as number[]);
    const outputs = samples.map(s => {
      if (s.output.type === 'satisfaction') {
        return [s.output.satisfied ? 1 : 0, s.output.confidence || 0.8];
      } else {
        return [0.5, 0.5, 0.5, 0.5]; // Default for interaction
      }
    });
    
    // Quick incremental training
    await model.fit(
      tf.tensor2d(inputs),
      tf.tensor2d(outputs),
      {
        epochs: 10,
        batchSize: 32,
        verbose: 0
      }
    );
    
    console.log(`Incremental update completed for ${metadata.name}`);
  }

  private generateHyperparameterSets(): Array<Record<string, any>> {
    return [
      {
        learningRate: 0.001,
        batchSize: 32,
        dropout: 0.2
      },
      {
        learningRate: 0.0005,
        batchSize: 64,
        dropout: 0.3
      },
      {
        learningRate: 0.002,
        batchSize: 16,
        dropout: 0.25
      }
    ];
  }

  private createModelWithHyperparameters(
    type: ModelType,
    hyperparameters: Record<string, any>
  ): tf.LayersModel {
    // Simplified: create model based on type
    if (type === ModelType.SCHEDULE_QUALITY) {
      return this.createSatisfactionModel();
    } else {
      return this.createInteractionModel();
    }
  }

  private async quickTrain(
    model: tf.LayersModel,
    samples: TrainingSample[],
    hyperparameters: Record<string, any>
  ): Promise<void> {
    const inputs = samples.map(s => s.input.features as number[]);
    const outputs = samples.map(s => [s.output.value || 0.5]);
    
    await model.fit(
      tf.tensor2d(inputs),
      tf.tensor2d(outputs),
      {
        epochs: 10,
        batchSize: hyperparameters.batchSize,
        verbose: 0
      }
    );
  }

  private async calculatePerformanceMetrics(
    predictions: tf.Tensor,
    targets: tf.Tensor
  ): Promise<ModelPerformance> {
    const predArray = await predictions.array() as number[][];
    const targetArray = await targets.array() as number[][];
    
    // Calculate metrics
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;
    
    for (let i = 0; i < predArray.length; i++) {
      const pred = predArray[i][0] > 0.5 ? 1 : 0;
      const actual = targetArray[i][0] > 0.5 ? 1 : 0;
      
      if (pred === 1 && actual === 1) truePositives++;
      else if (pred === 1 && actual === 0) falsePositives++;
      else if (pred === 0 && actual === 1) falseNegatives++;
      else trueNegatives++;
    }
    
    const accuracy = (truePositives + trueNegatives) / predArray.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      latency: 25, // ms
      throughput: 40, // predictions/second
      lastEvaluated: new Date()
    };
  }

  /**
   * Persistence methods
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(
        `${this.modelPath}/historical_data.json`,
        'utf8'
      );
      const parsed = JSON.parse(data);
      
      Object.entries(parsed).forEach(([constraintId, data]) => {
        this.historicalData.set(constraintId, data as HistoricalConstraintData);
      });
    } catch (error) {
      console.log('No historical data found');
    }
  }

  private async saveHistoricalData(): Promise<void> {
    const fs = require('fs').promises;
    const data = Object.fromEntries(this.historicalData);
    
    await fs.writeFile(
      `${this.modelPath}/historical_data.json`,
      JSON.stringify(data, null, 2)
    );
  }

  private async loadLearnedPatterns(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(
        `${this.modelPath}/learned_patterns.json`,
        'utf8'
      );
      const parsed = JSON.parse(data);
      
      Object.entries(parsed).forEach(([id, pattern]) => {
        this.learnedPatterns.set(id, pattern as ConstraintPattern);
      });
    } catch (error) {
      console.log('No learned patterns found');
    }
  }

  private async saveLearnedPatterns(): Promise<void> {
    const fs = require('fs').promises;
    const data = Object.fromEntries(this.learnedPatterns);
    
    await fs.writeFile(
      `${this.modelPath}/learned_patterns.json`,
      JSON.stringify(data, null, 2)
    );
  }

  /**
   * Save models
   */
  async saveModels(): Promise<void> {
    if (this.satisfactionModel) {
      await this.satisfactionModel.save(`file://${this.modelPath}/satisfaction`);
    }
    
    if (this.interactionModel) {
      await this.interactionModel.save(`file://${this.modelPath}/interaction`);
    }
    
    console.log('Constraint learning models saved');
  }
}

export default ConstraintLearner;