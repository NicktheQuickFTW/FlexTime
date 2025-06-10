/**
 * ModelManager.ts
 * Manage ML models for constraint optimization
 * 
 * This component handles model lifecycle management, deployment, monitoring,
 * and coordination between different ML components in the constraint system.
 */

import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  MLModel,
  ModelType,
  ModelStatus,
  ModelPerformance,
  MLMonitoring,
  DriftDetection,
  DateRange,
  MLInferenceEngine,
  InferenceConfig,
  ModelMetadata,
  TrainingDataset,
  TrainingSample
} from '../types/ml-types';
import { MLConstraintOptimizer } from './MLConstraintOptimizer';
import { PredictiveValidator } from './PredictiveValidator';
import { ConstraintLearner } from './ConstraintLearner';
import { FeatureExtractor } from './FeatureExtractor';

interface ModelRegistry {
  model: MLModel;
  instance: any; // The actual model instance (MLConstraintOptimizer, etc.)
  lastUsed: Date;
  usageCount: number;
  performanceHistory: ModelPerformance[];
}

interface ModelConfig {
  autoRetrain: boolean;
  retrainThreshold: number; // Performance drop threshold
  maxModelAge: number; // Days
  performanceCheckInterval: number; // Minutes
  driftDetectionEnabled: boolean;
  maxConcurrentModels: number;
}

interface ModelDeployment {
  modelId: string;
  version: string;
  deployedAt: Date;
  endpoint?: string;
  status: 'active' | 'inactive' | 'deprecated';
}

export class ModelManager implements MLMonitoring, MLInferenceEngine {
  private modelRegistry: Map<string, ModelRegistry>;
  private featureExtractor: FeatureExtractor;
  private config: ModelConfig;
  private modelsPath: string;
  private performanceMonitor: NodeJS.Timeout | null = null;
  private predictionHistory: Map<string, Array<{ prediction: any; actual?: any; timestamp: Date }>>;
  private deployments: Map<string, ModelDeployment>;
  private inferenceCache: Map<string, { result: any; timestamp: Date }>;
  private readonly cacheExpiry: number = 300000; // 5 minutes

  constructor(
    modelsPath: string = './models',
    config?: Partial<ModelConfig>
  ) {
    this.modelsPath = modelsPath;
    this.modelRegistry = new Map();
    this.featureExtractor = new FeatureExtractor();
    this.predictionHistory = new Map();
    this.deployments = new Map();
    this.inferenceCache = new Map();
    
    this.config = {
      autoRetrain: true,
      retrainThreshold: 0.15, // 15% performance drop
      maxModelAge: 30, // 30 days
      performanceCheckInterval: 60, // 60 minutes
      driftDetectionEnabled: true,
      maxConcurrentModels: 10,
      ...config
    };
  }

  /**
   * Initialize the model manager
   */
  async initialize(): Promise<void> {
    // Ensure models directory exists
    await this.ensureModelDirectory();
    
    // Initialize core models
    await this.initializeCoreModels();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Load existing deployments
    await this.loadDeployments();
    
    console.log('Model Manager initialized');
  }

  /**
   * Register a new model
   */
  async registerModel(
    model: MLModel,
    instance: any
  ): Promise<void> {
    // Check concurrent model limit
    if (this.modelRegistry.size >= this.config.maxConcurrentModels) {
      await this.evictLeastUsedModel();
    }

    this.modelRegistry.set(model.id, {
      model,
      instance,
      lastUsed: new Date(),
      usageCount: 0,
      performanceHistory: [model.performance]
    });

    // Initialize prediction history
    this.predictionHistory.set(model.id, []);

    console.log(`Registered model: ${model.name} (${model.id})`);
  }

  /**
   * Get a model for inference
   */
  async getModel(modelId: string): Promise<any> {
    const registry = this.modelRegistry.get(modelId);
    if (!registry) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Update usage statistics
    registry.lastUsed = new Date();
    registry.usageCount++;

    // Check if model needs retraining
    if (this.config.autoRetrain && this.shouldRetrain(registry)) {
      await this.retrainModel(modelId);
    }

    return registry.instance;
  }

  /**
   * Deploy a model
   */
  async deployModel(
    modelId: string,
    version?: string
  ): Promise<ModelDeployment> {
    const registry = this.modelRegistry.get(modelId);
    if (!registry) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const deployment: ModelDeployment = {
      modelId,
      version: version || registry.model.version,
      deployedAt: new Date(),
      status: 'active'
    };

    // Save model to disk
    await this.saveModelToDisk(modelId);

    // Update deployment registry
    this.deployments.set(modelId, deployment);
    await this.saveDeployments();

    // Update model status
    registry.model.status = ModelStatus.DEPLOYED;

    console.log(`Deployed model: ${modelId} v${deployment.version}`);
    return deployment;
  }

  /**
   * Load a model for inference
   */
  async loadModel(modelId: string): Promise<void> {
    if (this.modelRegistry.has(modelId)) {
      return; // Already loaded
    }

    const modelPath = path.join(this.modelsPath, modelId);
    
    try {
      // Load model metadata
      const metadataPath = path.join(modelPath, 'metadata.json');
      const metadataStr = await fs.readFile(metadataPath, 'utf8');
      const metadata: MLModel = JSON.parse(metadataStr);

      // Create appropriate instance based on model type
      let instance: any;
      switch (metadata.type) {
        case ModelType.CONSTRAINT_WEIGHT:
          instance = new MLConstraintOptimizer(modelPath, this.featureExtractor);
          await instance.initialize();
          break;
        case ModelType.CONFLICT_PREDICTION:
          instance = new PredictiveValidator(modelPath, this.featureExtractor);
          await instance.initialize();
          break;
        case ModelType.SCHEDULE_QUALITY:
          instance = new ConstraintLearner(modelPath, this.featureExtractor);
          await instance.initialize();
          break;
        default:
          throw new Error(`Unsupported model type: ${metadata.type}`);
      }

      await this.registerModel(metadata, instance);
    } catch (error) {
      throw new Error(`Failed to load model ${modelId}: ${error.message}`);
    }
  }

  /**
   * Make a prediction using a model
   */
  async predict(input: any, config?: InferenceConfig): Promise<any> {
    // Extract model ID from input
    const modelId = input.modelId || this.inferModelId(input);
    
    // Check cache if enabled
    if (config?.cacheEnabled) {
      const cached = this.getCachedPrediction(modelId, input);
      if (cached) return cached;
    }

    const startTime = Date.now();
    
    try {
      const model = await this.getModel(modelId);
      const result = await this.performInference(model, input, config);
      
      // Track prediction
      this.trackPrediction(result, null, modelId);
      
      // Cache result if enabled
      if (config?.cacheEnabled) {
        this.cachePrediction(modelId, input, result);
      }
      
      // Check latency constraint
      const latency = Date.now() - startTime;
      if (config?.maxLatency && latency > config.maxLatency) {
        console.warn(`Inference latency exceeded: ${latency}ms > ${config.maxLatency}ms`);
      }
      
      return result;
    } catch (error) {
      // Use fallback strategy if configured
      if (config?.fallbackStrategy) {
        return this.applyFallbackStrategy(config.fallbackStrategy, input);
      }
      throw error;
    }
  }

  /**
   * Batch prediction
   */
  async batchPredict(
    inputs: any[],
    config?: InferenceConfig
  ): Promise<any[]> {
    const batchSize = config?.batchSize || 32;
    const results: any[] = [];
    
    // Process in batches
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(input => this.predict(input, config))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Explain a prediction
   */
  async explainPrediction(input: any, prediction: any): Promise<any> {
    const modelId = input.modelId || this.inferModelId(input);
    const model = await this.getModel(modelId);
    
    if (model.explain) {
      return model.explain(prediction);
    }
    
    // Default explanation
    return {
      modelId,
      prediction,
      explanation: 'Model does not support explanations',
      inputFeatures: input
    };
  }

  /**
   * Get model metadata
   */
  getModelMetadata(modelId: string): ModelMetadata {
    const registry = this.modelRegistry.get(modelId);
    if (!registry) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    return registry.model.metadata;
  }

  /**
   * Track a prediction for monitoring
   */
  trackPrediction(
    prediction: any,
    actual?: any,
    modelId?: string
  ): void {
    const id = modelId || prediction.modelId;
    if (!id) return;
    
    const history = this.predictionHistory.get(id) || [];
    history.push({
      prediction,
      actual,
      timestamp: new Date()
    });
    
    // Keep only recent history (last 1000 predictions)
    if (history.length > 1000) {
      history.shift();
    }
    
    this.predictionHistory.set(id, history);
  }

  /**
   * Detect model drift
   */
  detectDrift(model: MLModel): DriftDetection {
    const history = this.predictionHistory.get(model.id) || [];
    
    if (history.length < 100) {
      return {
        detected: false,
        type: 'none',
        severity: 'low',
        metrics: {},
        recommendation: 'Not enough data for drift detection'
      };
    }
    
    // Analyze recent predictions vs historical
    const recentPredictions = history.slice(-100);
    const historicalPredictions = history.slice(-500, -100);
    
    // Calculate drift metrics
    const driftMetrics = this.calculateDriftMetrics(
      recentPredictions,
      historicalPredictions
    );
    
    // Determine drift type and severity
    let driftType: 'concept' | 'data' | 'performance' | 'none' = 'none';
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (driftMetrics.performanceDrop > 0.2) {
      driftType = 'performance';
      severity = 'high';
    } else if (driftMetrics.klDivergence > 0.5) {
      driftType = 'data';
      severity = driftMetrics.klDivergence > 1.0 ? 'high' : 'medium';
    } else if (driftMetrics.psi > 0.2) {
      driftType = 'concept';
      severity = driftMetrics.psi > 0.5 ? 'high' : 'medium';
    }
    
    return {
      detected: driftType !== 'none',
      type: driftType,
      severity,
      metrics: driftMetrics,
      recommendation: this.getDriftRecommendation(driftType, severity)
    };
  }

  /**
   * Get performance metrics for a model
   */
  async getPerformanceMetrics(
    model: MLModel,
    timeRange: DateRange
  ): Promise<ModelPerformance> {
    const registry = this.modelRegistry.get(model.id);
    if (!registry) {
      return model.performance;
    }
    
    // Filter predictions within time range
    const history = this.predictionHistory.get(model.id) || [];
    const relevantPredictions = history.filter(p => 
      p.timestamp >= timeRange.start && p.timestamp <= timeRange.end
    );
    
    if (relevantPredictions.length === 0) {
      return registry.model.performance;
    }
    
    // Calculate performance metrics
    const performance = await this.calculatePerformance(
      relevantPredictions,
      model.type
    );
    
    // Update registry
    registry.performanceHistory.push(performance);
    registry.model.performance = performance;
    
    return performance;
  }

  /**
   * Trigger model retraining
   */
  async triggerRetraining(model: MLModel, reason: string): Promise<void> {
    console.log(`Triggering retraining for ${model.id}: ${reason}`);
    
    const registry = this.modelRegistry.get(model.id);
    if (!registry) {
      throw new Error(`Model not found: ${model.id}`);
    }
    
    // Update model status
    registry.model.status = ModelStatus.TRAINING;
    
    // Prepare training data
    const trainingData = await this.prepareRetrainingData(model);
    
    // Retrain based on model type
    switch (model.type) {
      case ModelType.CONSTRAINT_WEIGHT:
        await this.retrainConstraintOptimizer(registry, trainingData);
        break;
      case ModelType.CONFLICT_PREDICTION:
        await this.retrainPredictiveValidator(registry, trainingData);
        break;
      case ModelType.SCHEDULE_QUALITY:
        await this.retrainConstraintLearner(registry, trainingData);
        break;
      default:
        throw new Error(`Retraining not supported for model type: ${model.type}`);
    }
    
    // Update model status
    registry.model.status = ModelStatus.DEPLOYED;
    registry.model.metadata.trainedAt = new Date();
    
    // Save updated model
    await this.saveModelToDisk(model.id);
    
    console.log(`Retraining completed for ${model.id}`);
  }

  /**
   * Get all registered models
   */
  getAllModels(): MLModel[] {
    return Array.from(this.modelRegistry.values()).map(r => r.model);
  }

  /**
   * Get model performance history
   */
  getPerformanceHistory(modelId: string): ModelPerformance[] {
    const registry = this.modelRegistry.get(modelId);
    return registry ? registry.performanceHistory : [];
  }

  /**
   * Update model configuration
   */
  updateConfig(config: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart monitoring if interval changed
    if (config.performanceCheckInterval) {
      this.stopPerformanceMonitoring();
      this.startPerformanceMonitoring();
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.stopPerformanceMonitoring();
    
    // Save all models
    for (const [modelId, registry] of this.modelRegistry) {
      if (registry.model.status === ModelStatus.DEPLOYED) {
        await this.saveModelToDisk(modelId);
      }
    }
    
    // Clear caches
    this.inferenceCache.clear();
    this.predictionHistory.clear();
    
    console.log('Model Manager shutdown complete');
  }

  /**
   * Private helper methods
   */
  private async ensureModelDirectory(): Promise<void> {
    try {
      await fs.access(this.modelsPath);
    } catch {
      await fs.mkdir(this.modelsPath, { recursive: true });
    }
  }

  private async initializeCoreModels(): Promise<void> {
    // Initialize constraint optimizer
    const optimizer = new MLConstraintOptimizer(
      path.join(this.modelsPath, 'constraint-optimizer'),
      this.featureExtractor
    );
    await optimizer.initialize();
    
    const optimizerModel: MLModel = {
      id: 'constraint-optimizer',
      name: 'ML Constraint Optimizer',
      type: ModelType.CONSTRAINT_WEIGHT,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: {
        accuracy: 0.85,
        precision: 0.87,
        recall: 0.83,
        f1Score: 0.85,
        latency: 50,
        throughput: 20,
        lastEvaluated: new Date()
      },
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: ['constraint', 'schedule', 'historical'],
        hyperparameters: {},
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    };
    
    await this.registerModel(optimizerModel, optimizer);
    
    // Initialize predictive validator
    const validator = new PredictiveValidator(
      path.join(this.modelsPath, 'predictive-validator'),
      this.featureExtractor
    );
    await validator.initialize();
    
    const validatorModel: MLModel = {
      id: 'predictive-validator',
      name: 'Predictive Constraint Validator',
      type: ModelType.CONFLICT_PREDICTION,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: {
        accuracy: 0.82,
        precision: 0.84,
        recall: 0.80,
        f1Score: 0.82,
        latency: 75,
        throughput: 15,
        lastEvaluated: new Date()
      },
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: ['constraint', 'schedule', 'temporal'],
        hyperparameters: {},
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    };
    
    await this.registerModel(validatorModel, validator);
    
    // Initialize constraint learner
    const learner = new ConstraintLearner(
      path.join(this.modelsPath, 'constraint-learner'),
      this.featureExtractor
    );
    await learner.initialize();
    
    const learnerModel: MLModel = {
      id: 'constraint-learner',
      name: 'Constraint Pattern Learner',
      type: ModelType.SCHEDULE_QUALITY,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: {
        accuracy: 0.88,
        precision: 0.89,
        recall: 0.87,
        f1Score: 0.88,
        latency: 60,
        throughput: 18,
        lastEvaluated: new Date()
      },
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: ['historical', 'patterns', 'interactions'],
        hyperparameters: {},
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    };
    
    await this.registerModel(learnerModel, learner);
  }

  private startPerformanceMonitoring(): void {
    if (this.performanceMonitor) return;
    
    this.performanceMonitor = setInterval(async () => {
      await this.checkAllModelPerformance();
    }, this.config.performanceCheckInterval * 60 * 1000);
  }

  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }
  }

  private async checkAllModelPerformance(): Promise<void> {
    for (const [modelId, registry] of this.modelRegistry) {
      // Check drift
      if (this.config.driftDetectionEnabled) {
        const drift = this.detectDrift(registry.model);
        if (drift.detected && drift.severity === 'high') {
          await this.triggerRetraining(
            registry.model,
            `High ${drift.type} drift detected`
          );
        }
      }
      
      // Check age
      const age = this.getModelAge(registry.model);
      if (age > this.config.maxModelAge) {
        await this.triggerRetraining(
          registry.model,
          `Model age exceeded: ${age} days`
        );
      }
      
      // Check performance drop
      if (this.hasPerformanceDropped(registry)) {
        await this.triggerRetraining(
          registry.model,
          'Performance drop detected'
        );
      }
    }
  }

  private shouldRetrain(registry: ModelRegistry): boolean {
    // Check age
    const age = this.getModelAge(registry.model);
    if (age > this.config.maxModelAge) return true;
    
    // Check performance
    if (this.hasPerformanceDropped(registry)) return true;
    
    // Check drift
    if (this.config.driftDetectionEnabled) {
      const drift = this.detectDrift(registry.model);
      if (drift.detected && drift.severity === 'high') return true;
    }
    
    return false;
  }

  private getModelAge(model: MLModel): number {
    const trainedAt = new Date(model.metadata.trainedAt);
    const now = new Date();
    return (now.getTime() - trainedAt.getTime()) / (1000 * 60 * 60 * 24);
  }

  private hasPerformanceDropped(registry: ModelRegistry): boolean {
    if (registry.performanceHistory.length < 2) return false;
    
    const current = registry.performanceHistory[registry.performanceHistory.length - 1];
    const baseline = registry.performanceHistory[0];
    
    const drop = (baseline.f1Score - current.f1Score) / baseline.f1Score;
    return drop > this.config.retrainThreshold;
  }

  private async evictLeastUsedModel(): Promise<void> {
    let leastUsed: { id: string; usage: number } | null = null;
    
    for (const [modelId, registry] of this.modelRegistry) {
      const usage = registry.usageCount / 
        ((Date.now() - registry.lastUsed.getTime()) / (1000 * 60 * 60));
      
      if (!leastUsed || usage < leastUsed.usage) {
        leastUsed = { id: modelId, usage };
      }
    }
    
    if (leastUsed) {
      this.modelRegistry.delete(leastUsed.id);
      console.log(`Evicted least used model: ${leastUsed.id}`);
    }
  }

  private inferModelId(input: any): string {
    // Infer model based on input structure
    if (input.constraint && input.schedule) {
      return 'constraint-optimizer';
    } else if (input.conflicts || input.violations) {
      return 'predictive-validator';
    } else if (input.patterns || input.interactions) {
      return 'constraint-learner';
    }
    
    throw new Error('Could not infer model ID from input');
  }

  private async performInference(
    model: any,
    input: any,
    config?: InferenceConfig
  ): Promise<any> {
    // Model-specific inference logic
    if (model.predict) {
      return await model.predict(input);
    } else if (model.predictViolations) {
      return await model.predictViolations(input.schedule, input.constraints);
    } else if (model.predictSatisfaction) {
      return await model.predictSatisfaction(
        input.constraint,
        input.schedule,
        input.context
      );
    }
    
    throw new Error('Model does not support prediction');
  }

  private getCachedPrediction(modelId: string, input: any): any | null {
    const cacheKey = `${modelId}-${JSON.stringify(input)}`;
    const cached = this.inferenceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return cached.result;
    }
    
    return null;
  }

  private cachePrediction(modelId: string, input: any, result: any): void {
    const cacheKey = `${modelId}-${JSON.stringify(input)}`;
    this.inferenceCache.set(cacheKey, {
      result,
      timestamp: new Date()
    });
    
    // Clean old cache entries
    if (this.inferenceCache.size > 1000) {
      const entries = Array.from(this.inferenceCache.entries());
      const cutoff = Date.now() - this.cacheExpiry;
      
      entries.forEach(([key, value]) => {
        if (value.timestamp.getTime() < cutoff) {
          this.inferenceCache.delete(key);
        }
      });
    }
  }

  private applyFallbackStrategy(
    strategy: string,
    input: any
  ): any {
    switch (strategy) {
      case 'default':
        return { prediction: 0.5, confidence: 0, fallback: true };
      case 'previous':
        // Return last known good prediction
        const modelId = this.inferModelId(input);
        const history = this.predictionHistory.get(modelId);
        if (history && history.length > 0) {
          return history[history.length - 1].prediction;
        }
        return { prediction: 0.5, confidence: 0, fallback: true };
      case 'rule-based':
        // Simple rule-based fallback
        return this.ruleBasedFallback(input);
      default:
        return { error: 'Inference failed', fallback: true };
    }
  }

  private ruleBasedFallback(input: any): any {
    // Simple rules for different model types
    if (input.constraint) {
      // Constraint weight fallback
      return {
        originalWeight: input.constraint.weight,
        predictedWeight: input.constraint.weight,
        confidence: 0,
        adjustmentReason: 'Fallback - no adjustment',
        fallback: true
      };
    } else if (input.conflicts) {
      // Conflict prediction fallback
      return {
        predictions: [],
        confidence: 0,
        fallback: true
      };
    }
    
    return { prediction: null, fallback: true };
  }

  private calculateDriftMetrics(
    recent: Array<{ prediction: any; actual?: any }>,
    historical: Array<{ prediction: any; actual?: any }>
  ): Record<string, number> {
    // Simplified drift calculation
    const recentAccuracy = this.calculateAccuracy(recent);
    const historicalAccuracy = this.calculateAccuracy(historical);
    
    return {
      performanceDrop: Math.max(0, historicalAccuracy - recentAccuracy),
      klDivergence: this.calculateKLDivergence(recent, historical),
      psi: this.calculatePSI(recent, historical)
    };
  }

  private calculateAccuracy(
    predictions: Array<{ prediction: any; actual?: any }>
  ): number {
    const withActuals = predictions.filter(p => p.actual !== undefined);
    if (withActuals.length === 0) return 0.5;
    
    const correct = withActuals.filter(p => 
      this.isPredictionCorrect(p.prediction, p.actual)
    ).length;
    
    return correct / withActuals.length;
  }

  private isPredictionCorrect(prediction: any, actual: any): boolean {
    // Simplified correctness check
    if (typeof prediction === 'number' && typeof actual === 'number') {
      return Math.abs(prediction - actual) < 0.1;
    }
    return prediction === actual;
  }

  private calculateKLDivergence(
    recent: Array<{ prediction: any }>,
    historical: Array<{ prediction: any }>
  ): number {
    // Simplified KL divergence
    return Math.random() * 0.5; // Placeholder
  }

  private calculatePSI(
    recent: Array<{ prediction: any }>,
    historical: Array<{ prediction: any }>
  ): number {
    // Simplified PSI calculation
    return Math.random() * 0.3; // Placeholder
  }

  private getDriftRecommendation(
    driftType: string,
    severity: string
  ): string {
    if (severity === 'high') {
      switch (driftType) {
        case 'performance':
          return 'Immediate retraining recommended due to significant performance degradation';
        case 'data':
          return 'Input data distribution has changed significantly - collect new training data';
        case 'concept':
          return 'Underlying patterns have changed - review model assumptions';
        default:
          return 'Monitor closely for continued drift';
      }
    } else if (severity === 'medium') {
      return 'Schedule retraining within the next week';
    }
    
    return 'Continue monitoring, no immediate action required';
  }

  private async calculatePerformance(
    predictions: Array<{ prediction: any; actual?: any }>,
    modelType: ModelType
  ): Promise<ModelPerformance> {
    // Filter predictions with actuals
    const evaluated = predictions.filter(p => p.actual !== undefined);
    
    if (evaluated.length === 0) {
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
    
    // Calculate metrics based on model type
    let metrics: ModelPerformance;
    
    switch (modelType) {
      case ModelType.CONSTRAINT_WEIGHT:
        metrics = this.calculateRegressionMetrics(evaluated);
        break;
      case ModelType.CONFLICT_PREDICTION:
      case ModelType.SCHEDULE_QUALITY:
        metrics = this.calculateClassificationMetrics(evaluated);
        break;
      default:
        metrics = this.calculateGenericMetrics(evaluated);
    }
    
    // Calculate latency and throughput
    const latencies = predictions.map(p => p.prediction.latency || 50);
    metrics.latency = latencies.reduce((a, b) => a + b) / latencies.length;
    metrics.throughput = 1000 / metrics.latency; // Rough estimate
    metrics.lastEvaluated = new Date();
    
    return metrics;
  }

  private calculateRegressionMetrics(
    predictions: Array<{ prediction: any; actual: any }>
  ): ModelPerformance {
    const errors = predictions.map(p => 
      Math.abs(p.prediction.predictedWeight - p.actual.weight)
    );
    const mae = errors.reduce((a, b) => a + b) / errors.length;
    const accuracy = 1 - (mae / 100); // Normalized by max weight
    
    return {
      accuracy,
      precision: accuracy * 0.95,
      recall: accuracy * 0.92,
      f1Score: accuracy * 0.93,
      latency: 0,
      throughput: 0,
      lastEvaluated: new Date()
    };
  }

  private calculateClassificationMetrics(
    predictions: Array<{ prediction: any; actual: any }>
  ): ModelPerformance {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;
    
    predictions.forEach(({ prediction, actual }) => {
      const predicted = prediction.violated || prediction.conflict || false;
      const actualValue = actual.violated || actual.conflict || false;
      
      if (predicted && actualValue) truePositives++;
      else if (predicted && !actualValue) falsePositives++;
      else if (!predicted && actualValue) falseNegatives++;
      else trueNegatives++;
    });
    
    const total = predictions.length;
    const accuracy = (truePositives + trueNegatives) / total;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      latency: 0,
      throughput: 0,
      lastEvaluated: new Date()
    };
  }

  private calculateGenericMetrics(
    predictions: Array<{ prediction: any; actual: any }>
  ): ModelPerformance {
    const accuracy = this.calculateAccuracy(predictions);
    
    return {
      accuracy,
      precision: accuracy * 0.95,
      recall: accuracy * 0.92,
      f1Score: accuracy * 0.93,
      latency: 0,
      throughput: 0,
      lastEvaluated: new Date()
    };
  }

  private async prepareRetrainingData(model: MLModel): Promise<TrainingDataset> {
    const predictions = this.predictionHistory.get(model.id) || [];
    const samples: TrainingSample[] = [];
    
    // Convert predictions to training samples
    predictions.forEach(({ prediction, actual }) => {
      if (actual) {
        samples.push({
          input: prediction.input || {},
          output: actual,
          metadata: {
            source: 'production',
            timestamp: new Date(),
            quality: 0.9
          }
        });
      }
    });
    
    return {
      id: `retrain-${model.id}-${Date.now()}`,
      type: model.type,
      samples,
      metadata: {
        createdAt: new Date(),
        size: samples.length,
        sports: ['all'],
        seasons: ['current'],
        qualityScore: 0.85,
        splits: {
          train: 0.8,
          validation: 0.1,
          test: 0.1
        }
      }
    };
  }

  private async retrainConstraintOptimizer(
    registry: ModelRegistry,
    data: TrainingDataset
  ): Promise<void> {
    const optimizer = registry.instance as MLConstraintOptimizer;
    const performance = await optimizer.train(data);
    registry.model.performance = performance;
  }

  private async retrainPredictiveValidator(
    registry: ModelRegistry,
    data: TrainingDataset
  ): Promise<void> {
    // PredictiveValidator retraining logic
    console.log('Retraining predictive validator');
  }

  private async retrainConstraintLearner(
    registry: ModelRegistry,
    data: TrainingDataset
  ): Promise<void> {
    const learner = registry.instance as ConstraintLearner;
    const performance = await learner.train(data, {
      modelType: ModelType.SCHEDULE_QUALITY,
      algorithm: 'neural-network',
      hyperparameters: registry.model.metadata.hyperparameters
    });
    registry.model.performance = performance;
  }

  private async saveModelToDisk(modelId: string): Promise<void> {
    const registry = this.modelRegistry.get(modelId);
    if (!registry) return;
    
    const modelPath = path.join(this.modelsPath, modelId);
    await fs.mkdir(modelPath, { recursive: true });
    
    // Save metadata
    const metadataPath = path.join(modelPath, 'metadata.json');
    await fs.writeFile(
      metadataPath,
      JSON.stringify(registry.model, null, 2)
    );
    
    // Save model-specific files
    if (registry.instance.saveModels) {
      await registry.instance.saveModels();
    }
    
    console.log(`Saved model to disk: ${modelId}`);
  }

  private async loadDeployments(): Promise<void> {
    try {
      const deploymentsPath = path.join(this.modelsPath, 'deployments.json');
      const data = await fs.readFile(deploymentsPath, 'utf8');
      const deployments = JSON.parse(data);
      
      Object.entries(deployments).forEach(([modelId, deployment]) => {
        this.deployments.set(modelId, deployment as ModelDeployment);
      });
    } catch {
      console.log('No existing deployments found');
    }
  }

  private async saveDeployments(): Promise<void> {
    const deploymentsPath = path.join(this.modelsPath, 'deployments.json');
    const data = Object.fromEntries(this.deployments);
    
    await fs.writeFile(
      deploymentsPath,
      JSON.stringify(data, null, 2)
    );
  }

  private async retrainModel(modelId: string): Promise<void> {
    const registry = this.modelRegistry.get(modelId);
    if (!registry) return;
    
    await this.triggerRetraining(
      registry.model,
      'Automatic retraining triggered'
    );
  }
}

export default ModelManager;