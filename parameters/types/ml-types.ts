// ML-related type definitions for constraint weighting and prediction

import { UnifiedConstraint, ConstraintResult, ConstraintType, ConstraintHardness } from './index';
import { Schedule, Game, Team } from './schedule-types';
import { Conflict, ConflictType, ResolutionStrategy } from './conflict-types';

export interface MLModel {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  status: ModelStatus;
  performance: ModelPerformance;
  metadata: ModelMetadata;
}

export enum ModelType {
  CONSTRAINT_WEIGHT = 'constraint_weight',
  CONFLICT_PREDICTION = 'conflict_prediction',
  RESOLUTION_RECOMMENDATION = 'resolution_recommendation',
  SCHEDULE_QUALITY = 'schedule_quality',
  CACHE_PREDICTION = 'cache_prediction',
  ANOMALY_DETECTION = 'anomaly_detection'
}

export enum ModelStatus {
  TRAINING = 'training',
  VALIDATING = 'validating',
  DEPLOYED = 'deployed',
  DEPRECATED = 'deprecated',
  FAILED = 'failed'
}

export interface ModelPerformance {
  accuracy: number; // 0-1
  precision: number; // 0-1
  recall: number; // 0-1
  f1Score: number; // 0-1
  latency: number; // ms
  throughput: number; // predictions/second
  lastEvaluated: Date;
}

export interface ModelMetadata {
  trainedAt: Date;
  trainingDataSize: number;
  features: string[];
  hyperparameters: Record<string, any>;
  framework: 'tensorflow' | 'pytorch' | 'scikit-learn' | 'custom';
  deploymentType: 'api' | 'embedded' | 'edge';
}

// Constraint Weight Prediction

export interface ConstraintWeightPredictor {
  predict(constraint: UnifiedConstraint, context: WeightPredictionContext): WeightPrediction;
  batchPredict(constraints: UnifiedConstraint[], context: WeightPredictionContext): WeightPrediction[];
  explain(prediction: WeightPrediction): WeightExplanation;
}

export interface WeightPredictionContext {
  schedule: Schedule;
  sport: string;
  season: string;
  historicalData?: HistoricalConstraintData[];
  environmentFactors?: EnvironmentFactors;
}

export interface WeightPrediction {
  constraintId: string;
  originalWeight: number;
  predictedWeight: number;
  confidence: number; // 0-1
  adjustmentReason: string;
  timestamp: Date;
}

export interface WeightExplanation {
  topFactors: Array<{
    factor: string;
    impact: number; // -1 to 1
    description: string;
  }>;
  similarCases: Array<{
    constraintId: string;
    similarity: number; // 0-1
    outcome: string;
  }>;
  recommendedAction?: string;
}

export interface HistoricalConstraintData {
  constraintId: string;
  evaluations: Array<{
    date: Date;
    satisfied: boolean;
    score: number;
    context: any;
  }>;
  averageSatisfactionRate: number;
  weightAdjustments: Array<{
    date: Date;
    oldWeight: number;
    newWeight: number;
    reason: string;
  }>;
}

export interface EnvironmentFactors {
  timeOfSeason: 'early' | 'mid' | 'late' | 'postseason';
  competitivenessLevel: number; // 0-1
  externalEvents: string[]; // e.g., "March Madness", "Bowl Season"
  weatherPatterns?: any;
}

// Conflict Prediction

export interface ConflictPredictor {
  predictConflicts(schedule: Schedule, changes?: any[]): ConflictPrediction[];
  predictResolutionSuccess(conflict: Conflict, strategy: ResolutionStrategy): ResolutionPrediction;
  suggestPreventiveMeasures(predictions: ConflictPrediction[]): PreventiveMeasure[];
}

export interface ConflictPrediction {
  type: ConflictType;
  probability: number; // 0-1
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedEntities: string[]; // IDs
  timeframe: {
    earliest: Date;
    latest: Date;
    mostLikely: Date;
  };
  triggers: string[];
  confidence: number; // 0-1
}

export interface ResolutionPrediction {
  strategy: ResolutionStrategy;
  successProbability: number; // 0-1
  expectedDuration: number; // minutes
  sideEffects: Array<{
    type: string;
    probability: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  alternativeStrategies: Array<{
    strategy: ResolutionStrategy;
    successProbability: number;
  }>;
}

export interface PreventiveMeasure {
  action: string;
  targetConstraints: string[];
  expectedImpact: number; // 0-1, reduction in conflict probability
  cost: 'low' | 'medium' | 'high';
  implementation: string;
}

// Schedule Quality Prediction

export interface ScheduleQualityPredictor {
  predictQuality(schedule: Schedule): QualityPrediction;
  predictImpact(schedule: Schedule, changes: any[]): ImpactPrediction;
  suggestImprovements(schedule: Schedule): QualityImprovement[];
}

export interface QualityPrediction {
  overallScore: number; // 0-100
  dimensions: {
    fairness: number; // 0-100
    competitiveness: number; // 0-100
    logisticalEfficiency: number; // 0-100
    fanExperience: number; // 0-100
    tvOptimization: number; // 0-100
  };
  confidence: number; // 0-1
  benchmarkComparison?: {
    historicalAverage: number;
    percentile: number; // 0-100
  };
}

export interface ImpactPrediction {
  currentQuality: number;
  predictedQuality: number;
  delta: number;
  affectedDimensions: string[];
  risks: string[];
  opportunities: string[];
}

export interface QualityImprovement {
  type: 'swap' | 'reschedule' | 'constraint_adjustment' | 'structural';
  description: string;
  expectedImprovement: number; // 0-100
  complexity: 'low' | 'medium' | 'high';
  tradeoffs: string[];
}

// ML Feature Engineering

export interface FeatureExtractor {
  extractConstraintFeatures(constraint: UnifiedConstraint, schedule: Schedule): ConstraintFeatures;
  extractScheduleFeatures(schedule: Schedule): ScheduleFeatures;
  extractGameFeatures(game: Game, schedule: Schedule): GameFeatures;
}

export interface ConstraintFeatures {
  // Constraint properties
  type: ConstraintType;
  hardness: ConstraintHardness;
  weight: number;
  scopeSize: number; // Number of entities in scope
  
  // Historical performance
  historicalSatisfactionRate?: number;
  averageEvaluationTime?: number;
  violationFrequency?: number;
  
  // Context features
  sportSpecific: boolean;
  seasonPhase: string;
  dependencyCount: number;
  conflictPotential: number; // 0-1
  
  // Derived features
  complexity: number; // 0-1
  flexibility: number; // 0-1
  criticalityScore: number; // 0-1
}

export interface ScheduleFeatures {
  // Basic properties
  gameCount: number;
  teamCount: number;
  venueCount: number;
  duration: number; // days
  
  // Density metrics
  gamesPerWeek: number;
  averageGamesPerTeam: number;
  venueUtilization: number; // 0-1
  
  // Balance metrics
  homeAwayBalance: number; // 0-1, 1 is perfect balance
  travelBalance: number; // 0-1
  competitiveBalance: number; // 0-1
  
  // Complexity metrics
  constraintCount: number;
  hardConstraintRatio: number; // 0-1
  interdependencyScore: number; // 0-1
}

export interface GameFeatures {
  // Basic properties
  gameType: string;
  dayOfWeek: number;
  timeSlot: string;
  
  // Team features
  teamRivalry: boolean;
  teamDistance: number; // miles
  teamStrengthDifferential: number; // 0-1
  
  // Context features
  conflictingGames: number;
  venueAvailability: number; // 0-1
  weatherRisk: number; // 0-1
  
  // Historical features
  historicalAttendance?: number;
  historicalViewership?: number;
  reschedulingFrequency?: number;
}

// ML Training and Evaluation

export interface TrainingDataset {
  id: string;
  type: ModelType;
  samples: TrainingSample[];
  metadata: DatasetMetadata;
}

export interface TrainingSample {
  input: Record<string, any>;
  output: Record<string, any>;
  weight?: number; // Sample importance
  metadata?: {
    source: string;
    timestamp: Date;
    quality: number; // 0-1
  };
}

export interface DatasetMetadata {
  createdAt: Date;
  size: number;
  sports: string[];
  seasons: string[];
  qualityScore: number; // 0-1
  splits?: {
    train: number;
    validation: number;
    test: number;
  };
}

export interface ModelTrainer {
  train(dataset: TrainingDataset, config: TrainingConfig): Promise<MLModel>;
  evaluate(model: MLModel, testData: TrainingSample[]): ModelPerformance;
  tune(model: MLModel, validationData: TrainingSample[]): Promise<MLModel>;
}

export interface TrainingConfig {
  modelType: ModelType;
  algorithm: string;
  hyperparameters: Record<string, any>;
  earlyStoppingConfig?: {
    metric: string;
    patience: number;
    minDelta: number;
  };
  resourceLimits?: {
    maxTrainingTime: number; // minutes
    maxMemory: number; // GB
    maxIterations: number;
  };
}

// ML Monitoring

export interface MLMonitoring {
  trackPrediction(prediction: any, actual?: any): void;
  detectDrift(model: MLModel): DriftDetection;
  getPerformanceMetrics(model: MLModel, timeRange: DateRange): ModelPerformance;
  triggerRetraining(model: MLModel, reason: string): void;
}

export interface DriftDetection {
  detected: boolean;
  type: 'concept' | 'data' | 'performance' | 'none';
  severity: 'low' | 'medium' | 'high';
  metrics: {
    klDivergence?: number;
    psi?: number; // Population Stability Index
    performanceDrop?: number;
  };
  recommendation: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ML Inference

export interface MLInferenceEngine {
  loadModel(modelId: string): Promise<void>;
  predict(input: any): Promise<any>;
  batchPredict(inputs: any[]): Promise<any[]>;
  explainPrediction(input: any, prediction: any): any;
  getModelMetadata(modelId: string): ModelMetadata;
}

export interface InferenceConfig {
  batchSize: number;
  maxLatency: number; // ms
  cacheEnabled: boolean;
  fallbackStrategy: 'default' | 'previous' | 'rule-based';
}

// Type guards
export function isDeployedModel(model: MLModel): boolean {
  return model.status === ModelStatus.DEPLOYED;
}

export function isHighConfidencePrediction(prediction: { confidence: number }): boolean {
  return prediction.confidence >= 0.8;
}

export function requiresRetraining(model: MLModel, drift: DriftDetection): boolean {
  return drift.detected && drift.severity === 'high';
}