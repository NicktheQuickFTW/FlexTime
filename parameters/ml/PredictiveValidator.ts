/**
 * PredictiveValidator.ts
 * Predictive constraint validation system using machine learning
 * 
 * This component predicts potential constraint violations before they occur,
 * enabling proactive scheduling adjustments and conflict prevention.
 */

import * as tf from '@tensorflow/tfjs-node';
import {
  UnifiedConstraint,
  ConstraintResult,
  ConstraintStatus,
  ConstraintViolation,
  ConstraintSuggestion,
  EvaluationResult
} from '../types';
import {
  ConflictPredictor,
  ConflictPrediction,
  ResolutionPrediction,
  PreventiveMeasure,
  MLModel,
  ModelType,
  ModelStatus,
  ModelPerformance,
  ScheduleFeatures,
  GameFeatures,
  TrainingDataset
} from '../types/ml-types';
import {
  Conflict,
  ConflictType,
  ResolutionStrategy,
  ConflictSeverity
} from '../types/conflict-types';
import { Schedule, Game, ScheduleModification } from '../types/schedule-types';
import { FeatureExtractor } from './FeatureExtractor';

interface ValidationPrediction {
  constraintId: string;
  violationProbability: number;
  expectedSeverity: ConflictSeverity;
  timeToViolation: number; // hours
  confidence: number;
  preventiveMeasures: PreventiveMeasure[];
}

export class PredictiveValidator implements ConflictPredictor {
  private violationModel: tf.LayersModel | null = null;
  private resolutionModel: tf.LayersModel | null = null;
  private featureExtractor: FeatureExtractor;
  private modelMetadata: Map<string, MLModel>;
  private readonly modelPath: string;
  private historicalViolations: Map<string, ConstraintViolation[]>;
  private predictionCache: Map<string, ValidationPrediction>;
  private readonly cacheTimeout: number = 300000; // 5 minutes

  constructor(
    modelPath: string = './models/predictive-validator',
    featureExtractor?: FeatureExtractor
  ) {
    this.modelPath = modelPath;
    this.featureExtractor = featureExtractor || new FeatureExtractor();
    this.modelMetadata = new Map();
    this.historicalViolations = new Map();
    this.predictionCache = new Map();
    this.initializeMetadata();
  }

  private initializeMetadata(): void {
    // Initialize violation prediction model metadata
    this.modelMetadata.set('violation-predictor', {
      id: 'violation-predictor-v1',
      name: 'Constraint Violation Predictor',
      type: ModelType.CONFLICT_PREDICTION,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: this.createEmptyPerformance(),
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: [
          'constraint_features',
          'schedule_features',
          'temporal_features',
          'historical_patterns'
        ],
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 64,
          epochs: 150,
          hiddenLayers: [256, 128, 64, 32],
          dropout: 0.3,
          optimizer: 'adam',
          lossFunction: 'binaryCrossentropy'
        },
        framework: 'tensorflow',
        deploymentType: 'embedded'
      }
    });

    // Initialize resolution prediction model metadata
    this.modelMetadata.set('resolution-predictor', {
      id: 'resolution-predictor-v1',
      name: 'Conflict Resolution Predictor',
      type: ModelType.RESOLUTION_RECOMMENDATION,
      version: '1.0.0',
      status: ModelStatus.DEPLOYED,
      performance: this.createEmptyPerformance(),
      metadata: {
        trainedAt: new Date(),
        trainingDataSize: 0,
        features: [
          'conflict_features',
          'resolution_strategy_features',
          'context_features'
        ],
        hyperparameters: {
          learningRate: 0.0005,
          batchSize: 32,
          epochs: 100,
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
   * Initialize or load the ML models
   */
  async initialize(): Promise<void> {
    try {
      // Load violation prediction model
      this.violationModel = await tf.loadLayersModel(
        `file://${this.modelPath}/violation-model/model.json`
      );
      console.log('Loaded existing violation prediction model');

      // Load resolution prediction model
      this.resolutionModel = await tf.loadLayersModel(
        `file://${this.modelPath}/resolution-model/model.json`
      );
      console.log('Loaded existing resolution prediction model');

      // Load historical data
      await this.loadHistoricalData();
    } catch (error) {
      console.log('Creating new models');
      this.violationModel = this.createViolationModel();
      this.resolutionModel = this.createResolutionModel();
    }
  }

  /**
   * Create violation prediction model
   */
  private createViolationModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [50], // Comprehensive feature set
          units: 256,
          activation: 'relu',
          kernelInitializer: 'glorotUniform'
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 128,
          activation: 'relu'
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
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
          units: 5, // [violation_prob, severity, time_to_violation, confidence, preventable]
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
   * Create resolution prediction model
   */
  private createResolutionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [40], // Conflict and strategy features
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
          units: 10, // Multiple resolution metrics
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
   * Predict potential violations for a schedule
   */
  async predictViolations(
    schedule: Schedule,
    constraints: UnifiedConstraint[],
    timeHorizon: number = 168 // 1 week in hours
  ): Promise<ValidationPrediction[]> {
    if (!this.violationModel) {
      throw new Error('Violation model not initialized');
    }

    const predictions: ValidationPrediction[] = [];

    for (const constraint of constraints) {
      // Check cache first
      const cacheKey = `${schedule.id}-${constraint.id}`;
      const cached = this.predictionCache.get(cacheKey);
      if (cached && Date.now() - cached.timeToViolation < this.cacheTimeout) {
        predictions.push(cached);
        continue;
      }

      // Extract features
      const features = await this.extractViolationFeatures(
        constraint,
        schedule,
        timeHorizon
      );

      // Make prediction
      const prediction = await this.violationModel.predict(features).array() as number[][];
      const [violationProb, severityScore, timeToViolation, confidence, preventable] = prediction[0];

      // Generate preventive measures if violation is likely
      const preventiveMeasures = violationProb > 0.7 ? 
        await this.generatePreventiveMeasures(
          constraint,
          schedule,
          violationProb,
          severityScore
        ) : [];

      const validationPrediction: ValidationPrediction = {
        constraintId: constraint.id,
        violationProbability: violationProb,
        expectedSeverity: this.mapSeverityScore(severityScore),
        timeToViolation: timeToViolation * timeHorizon,
        confidence,
        preventiveMeasures
      };

      predictions.push(validationPrediction);
      
      // Cache the prediction
      this.predictionCache.set(cacheKey, validationPrediction);
    }

    return predictions.sort((a, b) => b.violationProbability - a.violationProbability);
  }

  /**
   * Predict conflicts based on schedule changes
   */
  async predictConflicts(
    schedule: Schedule,
    changes?: ScheduleModification[]
  ): Promise<ConflictPrediction[]> {
    const predictions: ConflictPrediction[] = [];

    // Analyze current schedule state
    const baselineFeatures = this.featureExtractor.extractScheduleFeatures(schedule);
    
    // If changes are provided, predict their impact
    if (changes && changes.length > 0) {
      for (const change of changes) {
        const prediction = await this.predictChangeImpact(
          schedule,
          change,
          baselineFeatures
        );
        predictions.push(prediction);
      }
    } else {
      // Predict general conflicts for the entire schedule
      const generalPredictions = await this.predictGeneralConflicts(
        schedule,
        baselineFeatures
      );
      predictions.push(...generalPredictions);
    }

    return predictions;
  }

  /**
   * Predict resolution success for a conflict
   */
  async predictResolutionSuccess(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): Promise<ResolutionPrediction> {
    if (!this.resolutionModel) {
      throw new Error('Resolution model not initialized');
    }

    // Extract features for the conflict and strategy
    const features = this.extractResolutionFeatures(conflict, strategy);
    
    // Make prediction
    const prediction = await this.resolutionModel.predict(features).array() as number[][];
    const results = prediction[0];

    // Parse prediction results
    const successProbability = results[0];
    const expectedDuration = results[1] * 240; // Scale to minutes (max 4 hours)
    const sideEffectProbabilities = results.slice(2, 7);
    const alternativeScores = results.slice(7, 10);

    // Generate side effects analysis
    const sideEffects = this.analyzeSideEffects(
      strategy,
      sideEffectProbabilities,
      conflict
    );

    // Identify alternative strategies
    const alternativeStrategies = this.identifyAlternatives(
      strategy,
      alternativeScores,
      conflict
    );

    return {
      strategy,
      successProbability,
      expectedDuration,
      sideEffects,
      alternativeStrategies
    };
  }

  /**
   * Suggest preventive measures based on predictions
   */
  suggestPreventiveMeasures(
    predictions: ConflictPrediction[]
  ): PreventiveMeasure[] {
    const measures: PreventiveMeasure[] = [];
    const processedConstraints = new Set<string>();

    for (const prediction of predictions) {
      if (prediction.probability < 0.5) continue; // Skip low probability conflicts

      // Group by conflict type for better recommendations
      const measure = this.createPreventiveMeasure(prediction);
      
      // Avoid duplicate measures for same constraints
      const key = measure.targetConstraints.sort().join('-');
      if (!processedConstraints.has(key)) {
        measures.push(measure);
        processedConstraints.add(key);
      }
    }

    // Sort by expected impact
    return measures.sort((a, b) => b.expectedImpact - a.expectedImpact);
  }

  /**
   * Extract features for violation prediction
   */
  private async extractViolationFeatures(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    timeHorizon: number
  ): Promise<tf.Tensor2D> {
    const constraintFeatures = this.featureExtractor.extractConstraintFeatures(
      constraint,
      schedule
    );
    const scheduleFeatures = this.featureExtractor.extractScheduleFeatures(schedule);
    
    // Get historical violation patterns
    const historicalPattern = this.analyzeHistoricalPattern(constraint.id);
    
    // Temporal features
    const temporalFeatures = this.extractTemporalFeatures(schedule, timeHorizon);
    
    // Combine all features
    const features = [
      // Constraint features (14)
      ...this.flattenConstraintFeatures(constraintFeatures),
      
      // Schedule features (12)
      ...this.flattenScheduleFeatures(scheduleFeatures),
      
      // Historical patterns (10)
      ...historicalPattern,
      
      // Temporal features (8)
      ...temporalFeatures,
      
      // Context features (6)
      this.calculateScheduleLoad(schedule),
      this.calculateConstraintInterference(constraint, schedule),
      this.calculateResourceAvailability(schedule),
      this.calculateFlexibility(constraint, schedule),
      this.calculateRiskScore(constraint, schedule),
      timeHorizon / 168 // Normalized time horizon
    ];

    return tf.tensor2d([features]);
  }

  /**
   * Flatten constraint features to array
   */
  private flattenConstraintFeatures(features: any): number[] {
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
   * Flatten schedule features to array
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
   * Analyze historical violation patterns
   */
  private analyzeHistoricalPattern(constraintId: string): number[] {
    const violations = this.historicalViolations.get(constraintId) || [];
    
    if (violations.length === 0) {
      return new Array(10).fill(0.5); // Neutral pattern
    }

    // Calculate pattern features
    const totalViolations = violations.length;
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const recentViolations = violations.filter(v => {
      const violationTime = new Date(v.description).getTime(); // Simplified
      return Date.now() - violationTime < 30 * 24 * 60 * 60 * 1000; // Last 30 days
    }).length;

    // Time series features
    const violationTrend = this.calculateTrend(violations);
    const seasonality = this.calculateSeasonality(violations);
    const burstiness = this.calculateBurstiness(violations);

    return [
      Math.min(totalViolations / 100, 1),
      criticalViolations / Math.max(totalViolations, 1),
      recentViolations / Math.max(totalViolations, 1),
      violationTrend,
      seasonality,
      burstiness,
      this.calculateMeanTimeBetweenViolations(violations),
      this.calculateViolationDuration(violations),
      this.calculateResolutionSuccessRate(constraintId),
      this.calculateRecurrenceProbability(violations)
    ];
  }

  /**
   * Extract temporal features
   */
  private extractTemporalFeatures(schedule: Schedule, timeHorizon: number): number[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + timeHorizon * 60 * 60 * 1000);
    
    // Count games in time horizon
    const upcomingGames = schedule.games.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate >= now && gameDate <= futureDate;
    }).length;

    // Day of week distribution
    const dayDistribution = this.calculateDayDistribution(schedule.games);
    
    // Peak period detection
    const isPeakPeriod = this.isPeakSchedulingPeriod(now);
    
    return [
      upcomingGames / schedule.games.length,
      dayDistribution.weekday,
      dayDistribution.weekend,
      isPeakPeriod ? 1 : 0,
      this.getSeasonProgress(schedule),
      this.getDaysUntilNextHoliday(now),
      this.getWeatherRiskScore(now),
      timeHorizon / (24 * 7) // Weeks
    ];
  }

  /**
   * Generate preventive measures
   */
  private async generatePreventiveMeasures(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    violationProbability: number,
    severityScore: number
  ): Promise<PreventiveMeasure[]> {
    const measures: PreventiveMeasure[] = [];

    // Measure 1: Adjust constraint weight
    if (constraint.hardness !== 'hard') {
      measures.push({
        action: 'Adjust constraint weight',
        targetConstraints: [constraint.id],
        expectedImpact: Math.min(violationProbability * 0.3, 0.8),
        cost: 'low',
        implementation: `Increase weight of constraint "${constraint.name}" by ${Math.round(severityScore * 20)}%`
      });
    }

    // Measure 2: Add buffer time for temporal constraints
    if (constraint.type === 'temporal') {
      measures.push({
        action: 'Add scheduling buffer',
        targetConstraints: [constraint.id],
        expectedImpact: Math.min(violationProbability * 0.4, 0.7),
        cost: 'medium',
        implementation: 'Add 2-day buffer between consecutive games for affected teams'
      });
    }

    // Measure 3: Resource reallocation
    if (constraint.type === 'spatial') {
      measures.push({
        action: 'Reallocate venue resources',
        targetConstraints: [constraint.id],
        expectedImpact: Math.min(violationProbability * 0.5, 0.75),
        cost: 'medium',
        implementation: 'Reserve backup venues for high-risk time periods'
      });
    }

    // Measure 4: Proactive conflict resolution
    if (violationProbability > 0.8) {
      measures.push({
        action: 'Proactive rescheduling',
        targetConstraints: [constraint.id],
        expectedImpact: Math.min(violationProbability * 0.7, 0.9),
        cost: 'high',
        implementation: 'Reschedule games that are likely to violate this constraint'
      });
    }

    return measures;
  }

  /**
   * Predict impact of a schedule change
   */
  private async predictChangeImpact(
    schedule: Schedule,
    change: ScheduleModification,
    baselineFeatures: ScheduleFeatures
  ): Promise<ConflictPrediction> {
    // Simulate the change
    const modifiedSchedule = this.applyChange(schedule, change);
    const newFeatures = this.featureExtractor.extractScheduleFeatures(modifiedSchedule);
    
    // Calculate feature deltas
    const featureDeltas = this.calculateFeatureDeltas(baselineFeatures, newFeatures);
    
    // Predict conflict probability based on deltas
    const conflictProbability = this.predictConflictFromDeltas(featureDeltas);
    
    return {
      type: this.inferConflictType(change),
      probability: conflictProbability,
      severity: conflictProbability > 0.8 ? 'critical' : 
                conflictProbability > 0.5 ? 'high' : 'medium',
      affectedEntities: this.getAffectedEntities(change),
      timeframe: {
        earliest: new Date(),
        latest: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        mostLikely: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      triggers: this.identifyTriggers(change, featureDeltas),
      confidence: 0.85
    };
  }

  /**
   * Helper methods for feature encoding
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

  /**
   * Map severity score to enum
   */
  private mapSeverityScore(score: number): ConflictSeverity {
    if (score > 0.8) return 'critical';
    if (score > 0.6) return 'high';
    if (score > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Calculate various metrics
   */
  private calculateScheduleLoad(schedule: Schedule): number {
    const totalGames = schedule.games.length;
    const duration = this.calculateScheduleDuration(schedule);
    return Math.min(totalGames / (duration * 7), 1); // Games per week normalized
  }

  private calculateScheduleDuration(schedule: Schedule): number {
    if (schedule.games.length === 0) return 1;
    
    const dates = schedule.games.map(g => new Date(g.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return (maxDate - minDate) / (1000 * 60 * 60 * 24 * 7); // Weeks
  }

  private calculateConstraintInterference(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    // Simplified: count overlapping constraints
    const overlapping = (constraint.conflictsWith || []).length;
    return Math.min(overlapping / 10, 1);
  }

  private calculateResourceAvailability(schedule: Schedule): number {
    // Simplified: venue utilization inverse
    const venueUtilization = this.featureExtractor
      .extractScheduleFeatures(schedule).venueUtilization;
    return 1 - venueUtilization;
  }

  private calculateFlexibility(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    // Higher weight = less flexibility
    const weightFactor = 1 - (constraint.weight / 100);
    const hardnessFactor = constraint.hardness === 'hard' ? 0 : 
                          constraint.hardness === 'soft' ? 0.5 : 1;
    return weightFactor * hardnessFactor;
  }

  private calculateRiskScore(
    constraint: UnifiedConstraint,
    schedule: Schedule
  ): number {
    const historicalViolations = this.historicalViolations.get(constraint.id) || [];
    const violationRate = historicalViolations.length / 100; // Normalized
    const complexity = this.featureExtractor
      .extractConstraintFeatures(constraint, schedule).complexity;
    
    return Math.min(violationRate + complexity, 1);
  }

  /**
   * Trend calculation for time series
   */
  private calculateTrend(violations: ConstraintViolation[]): number {
    if (violations.length < 2) return 0.5;
    
    // Simple linear trend
    const timePoints = violations.map((_, i) => i);
    const values = violations.map(v => v.severity === 'critical' ? 1 : 0.5);
    
    const n = timePoints.length;
    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Normalize to 0-1
    return Math.max(0, Math.min(1, 0.5 + slope));
  }

  private calculateSeasonality(violations: ConstraintViolation[]): number {
    // Simplified seasonality detection
    if (violations.length < 10) return 0.5;
    
    // Group by month and check for patterns
    const monthCounts = new Array(12).fill(0);
    violations.forEach(v => {
      const month = new Date(v.description).getMonth(); // Simplified
      monthCounts[month]++;
    });
    
    // Calculate variance
    const mean = monthCounts.reduce((a, b) => a + b) / 12;
    const variance = monthCounts.reduce((sum, count) => 
      sum + Math.pow(count - mean, 2), 0) / 12;
    
    // High variance indicates seasonality
    return Math.min(variance / mean, 1);
  }

  private calculateBurstiness(violations: ConstraintViolation[]): number {
    if (violations.length < 3) return 0.5;
    
    // Calculate time between violations
    const intervals: number[] = [];
    for (let i = 1; i < violations.length; i++) {
      const time1 = new Date(violations[i-1].description).getTime();
      const time2 = new Date(violations[i].description).getTime();
      intervals.push(time2 - time1);
    }
    
    // Calculate coefficient of variation
    const mean = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean;
    
    // Higher CV indicates more bursty behavior
    return Math.min(cv, 1);
  }

  private calculateMeanTimeBetweenViolations(violations: ConstraintViolation[]): number {
    if (violations.length < 2) return 1;
    
    const totalTime = new Date().getTime() - 
      new Date(violations[0].description).getTime();
    const mtbv = totalTime / violations.length;
    
    // Normalize to 0-1 (30 days = 1)
    return Math.min(mtbv / (30 * 24 * 60 * 60 * 1000), 1);
  }

  private calculateViolationDuration(violations: ConstraintViolation[]): number {
    // Simplified: assume violations last 1 day on average
    return 0.5;
  }

  private calculateResolutionSuccessRate(constraintId: string): number {
    // Simplified: would query historical resolution data
    return 0.7;
  }

  private calculateRecurrenceProbability(violations: ConstraintViolation[]): number {
    if (violations.length < 2) return 0.5;
    
    // Count recurring violations
    const recurring = violations.filter((v, i) => 
      i > 0 && v.type === violations[i-1].type
    ).length;
    
    return recurring / violations.length;
  }

  /**
   * Additional helper methods
   */
  private calculateDayDistribution(games: Game[]): { weekday: number; weekend: number } {
    const weekdayGames = games.filter(g => {
      const day = new Date(g.date).getDay();
      return day >= 1 && day <= 5;
    }).length;
    
    return {
      weekday: weekdayGames / games.length,
      weekend: 1 - (weekdayGames / games.length)
    };
  }

  private isPeakSchedulingPeriod(date: Date): boolean {
    const month = date.getMonth();
    // Peak periods: March (March Madness), December (Bowl Season)
    return month === 2 || month === 11;
  }

  private getSeasonProgress(schedule: Schedule): number {
    const now = Date.now();
    const dates = schedule.games.map(g => new Date(g.date).getTime());
    const seasonStart = Math.min(...dates);
    const seasonEnd = Math.max(...dates);
    
    if (now < seasonStart) return 0;
    if (now > seasonEnd) return 1;
    
    return (now - seasonStart) / (seasonEnd - seasonStart);
  }

  private getDaysUntilNextHoliday(date: Date): number {
    // Simplified: major holidays
    const holidays = [
      new Date(date.getFullYear(), 0, 1), // New Year
      new Date(date.getFullYear(), 6, 4), // July 4th
      new Date(date.getFullYear(), 10, 28), // Thanksgiving (approximate)
      new Date(date.getFullYear(), 11, 25) // Christmas
    ];
    
    const nextHoliday = holidays.find(h => h > date) || 
      new Date(date.getFullYear() + 1, 0, 1);
    
    const days = (nextHoliday.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(days / 30, 1); // Normalize to months
  }

  private getWeatherRiskScore(date: Date): number {
    const month = date.getMonth();
    // Higher risk in winter months (November - February)
    if (month >= 10 || month <= 1) return 0.8;
    // Moderate risk in spring/fall
    if (month >= 2 && month <= 4 || month >= 8 && month <= 9) return 0.5;
    // Lower risk in summer
    return 0.2;
  }

  /**
   * Resolution prediction helpers
   */
  private extractResolutionFeatures(
    conflict: Conflict,
    strategy: ResolutionStrategy
  ): tf.Tensor2D {
    const features = [
      // Conflict features (20)
      this.encodeConflictType(conflict.type),
      this.encodeConflictSeverity(conflict.severity),
      conflict.affectedConstraints.length / 10,
      conflict.affectedGames.length / 100,
      this.calculateConflictComplexity(conflict),
      this.calculateConflictUrgency(conflict),
      this.hasHistoricalPrecedent(conflict) ? 1 : 0,
      this.calculateStakeholderImpact(conflict),
      this.calculateScheduleDisruption(conflict),
      this.calculateCascadeRisk(conflict),
      ...new Array(10).fill(0.5), // Placeholder for additional conflict features
      
      // Strategy features (20)
      this.encodeStrategyType(strategy),
      this.calculateStrategyComplexity(strategy),
      this.calculateStrategyRisk(strategy),
      this.calculateImplementationTime(strategy),
      this.calculateResourceRequirements(strategy),
      this.hasStrategySucceeded(strategy) ? 1 : 0,
      this.calculateReversibility(strategy),
      ...new Array(13).fill(0.5) // Placeholder for additional strategy features
    ];

    return tf.tensor2d([features]);
  }

  private encodeConflictType(type: ConflictType): number {
    const mapping: Record<ConflictType, number> = {
      'venue': 0.2,
      'team_availability': 0.4,
      'travel': 0.6,
      'broadcast': 0.8,
      'weather': 1.0
    };
    return mapping[type] || 0.5;
  }

  private encodeConflictSeverity(severity: ConflictSeverity): number {
    const mapping: Record<ConflictSeverity, number> = {
      'low': 0.25,
      'medium': 0.5,
      'high': 0.75,
      'critical': 1.0
    };
    return mapping[severity] || 0.5;
  }

  private encodeStrategyType(strategy: ResolutionStrategy): number {
    // Simplified encoding
    return 0.5; // Would map different strategy types
  }

  private calculateConflictComplexity(conflict: Conflict): number {
    const factors = [
      conflict.affectedConstraints.length / 10,
      conflict.affectedGames.length / 50,
      conflict.cascadeEffects?.length || 0 / 5
    ];
    return Math.min(factors.reduce((a, b) => a + b) / factors.length, 1);
  }

  private calculateConflictUrgency(conflict: Conflict): number {
    const hoursUntilGame = (new Date(conflict.detectedAt).getTime() - 
      Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntilGame < 24) return 1.0;
    if (hoursUntilGame < 72) return 0.8;
    if (hoursUntilGame < 168) return 0.6;
    return 0.4;
  }

  private hasHistoricalPrecedent(conflict: Conflict): boolean {
    // Would check historical database
    return Math.random() > 0.5; // Placeholder
  }

  private calculateStakeholderImpact(conflict: Conflict): number {
    // Consider teams, venues, fans, TV networks
    return 0.7; // Placeholder
  }

  private calculateScheduleDisruption(conflict: Conflict): number {
    return Math.min(conflict.affectedGames.length / 20, 1);
  }

  private calculateCascadeRisk(conflict: Conflict): number {
    return Math.min((conflict.cascadeEffects?.length || 0) / 5, 1);
  }

  private calculateStrategyComplexity(strategy: ResolutionStrategy): number {
    return 0.5; // Placeholder
  }

  private calculateStrategyRisk(strategy: ResolutionStrategy): number {
    return 0.3; // Placeholder
  }

  private calculateImplementationTime(strategy: ResolutionStrategy): number {
    return 0.4; // Placeholder
  }

  private calculateResourceRequirements(strategy: ResolutionStrategy): number {
    return 0.5; // Placeholder
  }

  private hasStrategySucceeded(strategy: ResolutionStrategy): boolean {
    return true; // Placeholder
  }

  private calculateReversibility(strategy: ResolutionStrategy): number {
    return 0.8; // Placeholder
  }

  /**
   * Side effects analysis
   */
  private analyzeSideEffects(
    strategy: ResolutionStrategy,
    probabilities: number[],
    conflict: Conflict
  ): Array<{
    type: string;
    probability: number;
    impact: 'positive' | 'negative' | 'neutral';
  }> {
    const sideEffectTypes = [
      'schedule_compression',
      'increased_travel',
      'venue_conflicts',
      'fan_dissatisfaction',
      'broadcast_issues'
    ];

    return sideEffectTypes.map((type, i) => ({
      type,
      probability: probabilities[i],
      impact: this.determineSideEffectImpact(type, strategy, conflict)
    }));
  }

  private determineSideEffectImpact(
    type: string,
    strategy: ResolutionStrategy,
    conflict: Conflict
  ): 'positive' | 'negative' | 'neutral' {
    // Simplified logic
    if (type === 'fan_dissatisfaction') return 'negative';
    if (type === 'schedule_compression' && conflict.severity === 'critical') return 'negative';
    return 'neutral';
  }

  /**
   * Alternative strategy identification
   */
  private identifyAlternatives(
    currentStrategy: ResolutionStrategy,
    scores: number[],
    conflict: Conflict
  ): Array<{
    strategy: ResolutionStrategy;
    successProbability: number;
  }> {
    // Placeholder: would generate actual alternative strategies
    const alternatives = [
      { strategy: 'reschedule' as ResolutionStrategy, score: scores[0] },
      { strategy: 'venue_change' as ResolutionStrategy, score: scores[1] },
      { strategy: 'time_adjustment' as ResolutionStrategy, score: scores[2] }
    ];

    return alternatives
      .filter(alt => alt.score > 0.5)
      .map(alt => ({
        strategy: alt.strategy,
        successProbability: alt.score
      }));
  }

  /**
   * Create preventive measure from prediction
   */
  private createPreventiveMeasure(prediction: ConflictPrediction): PreventiveMeasure {
    const baseAction = this.determinePreventiveAction(prediction.type);
    const impact = Math.min(prediction.probability * 0.7, 0.9);
    const cost = prediction.severity === 'critical' ? 'high' :
                 prediction.severity === 'high' ? 'medium' : 'low';

    return {
      action: baseAction,
      targetConstraints: [], // Would identify from prediction
      expectedImpact: impact,
      cost,
      implementation: this.generateImplementationSteps(baseAction, prediction)
    };
  }

  private determinePreventiveAction(conflictType: ConflictType): string {
    const actionMap: Record<ConflictType, string> = {
      'venue': 'Reserve backup venues',
      'team_availability': 'Adjust team schedules',
      'travel': 'Optimize travel routes',
      'broadcast': 'Coordinate with TV networks',
      'weather': 'Prepare contingency plans'
    };
    return actionMap[conflictType] || 'Review and adjust constraints';
  }

  private generateImplementationSteps(action: string, prediction: ConflictPrediction): string {
    return `${action} for ${prediction.affectedEntities.join(', ')} ` +
           `before ${prediction.timeframe.mostLikely.toDateString()}`;
  }

  /**
   * General conflict prediction
   */
  private async predictGeneralConflicts(
    schedule: Schedule,
    features: ScheduleFeatures
  ): Promise<ConflictPrediction[]> {
    // Analyze schedule for potential conflicts
    const predictions: ConflictPrediction[] = [];

    // Check venue conflicts
    const venueConflicts = this.predictVenueConflicts(schedule);
    predictions.push(...venueConflicts);

    // Check travel conflicts
    const travelConflicts = this.predictTravelConflicts(schedule);
    predictions.push(...travelConflicts);

    // Check timing conflicts
    const timingConflicts = this.predictTimingConflicts(schedule);
    predictions.push(...timingConflicts);

    return predictions;
  }

  private predictVenueConflicts(schedule: Schedule): ConflictPrediction[] {
    const conflicts: ConflictPrediction[] = [];
    const venueUsage = new Map<string, Game[]>();

    // Group games by venue and date
    schedule.games.forEach(game => {
      const key = `${game.venueId}-${game.date}`;
      if (!venueUsage.has(key)) {
        venueUsage.set(key, []);
      }
      venueUsage.get(key)!.push(game);
    });

    // Check for conflicts
    venueUsage.forEach((games, key) => {
      if (games.length > 1) {
        conflicts.push({
          type: 'venue',
          probability: 0.9,
          severity: 'high',
          affectedEntities: games.map(g => g.id),
          timeframe: {
            earliest: new Date(games[0].date),
            latest: new Date(games[0].date),
            mostLikely: new Date(games[0].date)
          },
          triggers: ['Multiple games scheduled at same venue'],
          confidence: 0.95
        });
      }
    });

    return conflicts;
  }

  private predictTravelConflicts(schedule: Schedule): ConflictPrediction[] {
    // Simplified: would analyze travel distances and times
    return [];
  }

  private predictTimingConflicts(schedule: Schedule): ConflictPrediction[] {
    // Simplified: would analyze game timing conflicts
    return [];
  }

  /**
   * Schedule modification helpers
   */
  private applyChange(schedule: Schedule, change: ScheduleModification): Schedule {
    const modified = { ...schedule };
    
    switch (change.type) {
      case 'add':
        if (change.newGame) {
          modified.games = [...schedule.games, change.newGame];
        }
        break;
      case 'remove':
        if (change.targetGame) {
          modified.games = schedule.games.filter(g => g.id !== change.targetGame!.id);
        }
        break;
      case 'update':
        if (change.targetGame && change.newGame) {
          modified.games = schedule.games.map(g => 
            g.id === change.targetGame!.id ? change.newGame! : g
          );
        }
        break;
      case 'swap':
        if (change.targetGame && change.swapWith) {
          modified.games = schedule.games.map(g => {
            if (g.id === change.targetGame!.id) return change.swapWith!;
            if (g.id === change.swapWith!.id) return change.targetGame!;
            return g;
          });
        }
        break;
    }
    
    return modified;
  }

  private calculateFeatureDeltas(
    baseline: ScheduleFeatures,
    modified: ScheduleFeatures
  ): Record<string, number> {
    return {
      gameCountDelta: modified.gameCount - baseline.gameCount,
      venueUtilizationDelta: modified.venueUtilization - baseline.venueUtilization,
      balanceDelta: modified.competitiveBalance - baseline.competitiveBalance,
      complexityDelta: modified.interdependencyScore - baseline.interdependencyScore
    };
  }

  private predictConflictFromDeltas(deltas: Record<string, number>): number {
    // Simplified: would use ML model
    const totalDelta = Object.values(deltas).reduce((sum, d) => sum + Math.abs(d), 0);
    return Math.min(totalDelta / 2, 1);
  }

  private inferConflictType(change: ScheduleModification): ConflictType {
    // Simplified inference
    if (change.type === 'swap') return 'venue';
    if (change.type === 'update') return 'team_availability';
    return 'travel';
  }

  private getAffectedEntities(change: ScheduleModification): string[] {
    const entities: string[] = [];
    
    if (change.targetGame) {
      entities.push(change.targetGame.homeTeamId);
      entities.push(change.targetGame.awayTeamId);
      entities.push(change.targetGame.venueId);
    }
    
    if (change.swapWith) {
      entities.push(change.swapWith.homeTeamId);
      entities.push(change.swapWith.awayTeamId);
      entities.push(change.swapWith.venueId);
    }
    
    return [...new Set(entities)];
  }

  private identifyTriggers(
    change: ScheduleModification,
    deltas: Record<string, number>
  ): string[] {
    const triggers: string[] = [];
    
    if (Math.abs(deltas.venueUtilizationDelta) > 0.1) {
      triggers.push('Significant venue utilization change');
    }
    
    if (Math.abs(deltas.balanceDelta) > 0.15) {
      triggers.push('Competitive balance disruption');
    }
    
    if (change.type === 'swap') {
      triggers.push('Game swap may cause travel conflicts');
    }
    
    return triggers;
  }

  /**
   * Load historical violation data
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(
        `${this.modelPath}/historical_violations.json`,
        'utf8'
      );
      const violations = JSON.parse(data);
      
      for (const [constraintId, violationList] of Object.entries(violations)) {
        this.historicalViolations.set(constraintId, violationList as ConstraintViolation[]);
      }
    } catch (error) {
      console.log('No historical violation data found');
    }
  }

  /**
   * Save models
   */
  async saveModels(): Promise<void> {
    if (this.violationModel) {
      await this.violationModel.save(`file://${this.modelPath}/violation-model`);
    }
    
    if (this.resolutionModel) {
      await this.resolutionModel.save(`file://${this.modelPath}/resolution-model`);
    }
    
    // Save historical data
    const fs = require('fs').promises;
    const historicalData = Object.fromEntries(this.historicalViolations);
    await fs.writeFile(
      `${this.modelPath}/historical_violations.json`,
      JSON.stringify(historicalData, null, 2)
    );
  }
}

export default PredictiveValidator;