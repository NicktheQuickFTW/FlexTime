// Smart Conflict Resolution Engine with ML-based Strategy Selection
// Analyzes conflicts and selects optimal resolution strategies

import { 
  Conflict, 
  ConflictType, 
  Resolution, 
  ResolutionStrategy,
  ConflictAnalysis,
  RiskAssessment
} from '../types/conflict-types';
import { Schedule, Game } from '../types/schedule-types';
import { ConstraintResult } from '../types';
import { ConflictAnalyzer } from './ConflictAnalyzer';
import { ResolutionStrategies } from './ResolutionStrategies';
import { ResolutionHistory } from './ResolutionHistory';

export interface ResolverConfig {
  maxResolutionAttempts: number;
  mlModelPath?: string;
  historicalDataPath?: string;
  enableLearning: boolean;
  parallelResolution: boolean;
  confidenceThreshold: number;
}

export class SmartConflictResolver {
  private analyzer: ConflictAnalyzer;
  private strategies: ResolutionStrategies;
  private history: ResolutionHistory;
  private config: ResolverConfig;
  private featureWeights: Map<string, number>;

  constructor(config: Partial<ResolverConfig> = {}) {
    this.config = {
      maxResolutionAttempts: 5,
      enableLearning: true,
      parallelResolution: true,
      confidenceThreshold: 0.7,
      ...config
    };

    this.analyzer = new ConflictAnalyzer();
    this.strategies = new ResolutionStrategies();
    this.history = new ResolutionHistory(config.historicalDataPath);
    this.featureWeights = this.initializeFeatureWeights();
  }

  /**
   * Resolves conflicts in a schedule using ML-based strategy selection
   */
  async resolveConflicts(
    schedule: Schedule, 
    conflicts: Conflict[]
  ): Promise<Map<string, Resolution>> {
    const resolutions = new Map<string, Resolution>();
    
    // Sort conflicts by severity and cascade risk
    const sortedConflicts = this.prioritizeConflicts(conflicts);

    for (const conflict of sortedConflicts) {
      try {
        const resolution = await this.resolveConflict(schedule, conflict);
        if (resolution && resolution.feasibility >= this.config.confidenceThreshold) {
          resolutions.set(conflict.id, resolution);
          
          // Apply resolution to schedule for subsequent conflict resolution
          if (resolution.status === 'accepted') {
            this.applyResolution(schedule, resolution);
          }
        }
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
      }
    }

    // Learn from this resolution session if enabled
    if (this.config.enableLearning) {
      await this.updateLearningModel(resolutions);
    }

    return resolutions;
  }

  /**
   * Resolves a single conflict
   */
  private async resolveConflict(
    schedule: Schedule, 
    conflict: Conflict
  ): Promise<Resolution | null> {
    // Analyze the conflict
    const analysis = await this.analyzer.analyzeConflict(conflict, schedule);
    
    // Get applicable strategies
    const applicableStrategies = this.getApplicableStrategies(conflict.type);
    
    // Score each strategy using ML model
    const scoredStrategies = await this.scoreStrategies(
      applicableStrategies,
      conflict,
      analysis,
      schedule
    );

    // Select best strategy
    const bestStrategy = this.selectBestStrategy(scoredStrategies);
    if (!bestStrategy) {
      return null;
    }

    // Generate resolution using selected strategy
    const resolution = await this.strategies.generateResolution(
      bestStrategy.strategy,
      conflict,
      schedule,
      analysis
    );

    // Validate resolution
    if (resolution && await this.validateResolution(resolution, schedule)) {
      resolution.recommendationScore = bestStrategy.score;
      return resolution;
    }

    // Try next best strategy if validation fails
    for (const strategy of scoredStrategies.slice(1)) {
      const altResolution = await this.strategies.generateResolution(
        strategy.strategy,
        conflict,
        schedule,
        analysis
      );
      
      if (altResolution && await this.validateResolution(altResolution, schedule)) {
        altResolution.recommendationScore = strategy.score;
        return altResolution;
      }
    }

    return null;
  }

  /**
   * Prioritizes conflicts for resolution order
   */
  private prioritizeConflicts(conflicts: Conflict[]): Conflict[] {
    return conflicts.sort((a, b) => {
      // Critical conflicts first
      const severityWeight = { critical: 3, major: 2, minor: 1 };
      const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by cascade risk
      const cascadeA = a.metadata?.cascadeRisk || 0;
      const cascadeB = b.metadata?.cascadeRisk || 0;
      if (cascadeB !== cascadeA) return cascadeB - cascadeA;

      // Then by number of affected entities
      return b.affectedGames.length - a.affectedGames.length;
    });
  }

  /**
   * Gets applicable resolution strategies for a conflict type
   */
  private getApplicableStrategies(conflictType: ConflictType): ResolutionStrategy[] {
    const strategyMap: Record<ConflictType, ResolutionStrategy[]> = {
      [ConflictType.VENUE_DOUBLE_BOOKING]: [
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.VENUE_SWAP,
        ResolutionStrategy.ALTERNATIVE_VENUE,
        ResolutionStrategy.DATE_SWAP
      ],
      [ConflictType.SUNDAY_RESTRICTION]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.GAME_SWAP,
        ResolutionStrategy.WAIVER_REQUEST
      ],
      [ConflictType.TRAVEL_BURDEN]: [
        ResolutionStrategy.GAME_SWAP,
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.SPLIT_DOUBLEHEADER
      ],
      [ConflictType.CHAMPIONSHIP_DATE]: [
        ResolutionStrategy.RESCHEDULE,
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.MANUAL_OVERRIDE
      ],
      [ConflictType.BACK_TO_BACK_GAMES]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.GAME_SWAP
      ],
      [ConflictType.HOME_AWAY_IMBALANCE]: [
        ResolutionStrategy.GAME_SWAP,
        ResolutionStrategy.VENUE_SWAP
      ],
      [ConflictType.TV_SLOT_CONFLICT]: [
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.MANUAL_OVERRIDE
      ],
      [ConflictType.WEATHER_RESTRICTION]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.VENUE_SWAP,
        ResolutionStrategy.ALTERNATIVE_VENUE
      ],
      [ConflictType.ACADEMIC_CALENDAR]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.WAIVER_REQUEST
      ]
    };

    return strategyMap[conflictType] || [ResolutionStrategy.MANUAL_OVERRIDE];
  }

  /**
   * Scores resolution strategies using ML features
   */
  private async scoreStrategies(
    strategies: ResolutionStrategy[],
    conflict: Conflict,
    analysis: ConflictAnalysis,
    schedule: Schedule
  ): Promise<Array<{ strategy: ResolutionStrategy; score: number }>> {
    const scores = await Promise.all(
      strategies.map(async (strategy) => {
        const features = this.extractFeatures(strategy, conflict, analysis, schedule);
        const historicalSuccess = await this.history.getSuccessRate(
          conflict.type,
          strategy
        );
        
        const score = this.calculateScore(features, historicalSuccess);
        return { strategy, score };
      })
    );

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Extracts ML features for scoring
   */
  private extractFeatures(
    strategy: ResolutionStrategy,
    conflict: Conflict,
    analysis: ConflictAnalysis,
    schedule: Schedule
  ): Map<string, number> {
    const features = new Map<string, number>();

    // Conflict features
    features.set('severity_score', this.getSeverityScore(conflict.severity));
    features.set('cascade_risk', conflict.metadata?.cascadeRisk || 0);
    features.set('affected_games_count', conflict.affectedGames.length);
    features.set('affected_teams_count', conflict.affectedTeams.length);

    // Strategy features
    features.set('strategy_complexity', this.getStrategyComplexity(strategy));
    features.set('historical_frequency', conflict.metadata?.historicalFrequency || 0);

    // Schedule features
    features.set('schedule_density', this.calculateScheduleDensity(schedule));
    features.set('remaining_flexibility', this.calculateFlexibility(schedule));

    // Pattern features
    features.set('pattern_match_score', this.calculatePatternMatch(
      conflict.type,
      strategy,
      analysis.patterns
    ));

    // Risk features
    features.set('compliance_risk', analysis.riskAssessment.complianceRisk ? 1 : 0);
    features.set('reputation_risk', analysis.riskAssessment.reputationalRisk ? 1 : 0);

    return features;
  }

  /**
   * Calculates final score for a strategy
   */
  private calculateScore(
    features: Map<string, number>,
    historicalSuccess: number
  ): number {
    let score = 0;

    // Apply feature weights
    for (const [feature, value] of features) {
      const weight = this.featureWeights.get(feature) || 0.5;
      score += value * weight;
    }

    // Incorporate historical success rate
    score = score * 0.7 + historicalSuccess * 0.3;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Validates a proposed resolution
   */
  private async validateResolution(
    resolution: Resolution,
    schedule: Schedule
  ): Promise<boolean> {
    // Check if resolution creates new conflicts
    const testSchedule = this.cloneSchedule(schedule);
    this.applyResolution(testSchedule, resolution);

    const newConflicts = await this.analyzer.detectConflicts(testSchedule);
    
    // Resolution is valid if it doesn't create worse conflicts
    return newConflicts.every(c => 
      c.severity !== 'critical' && 
      (c.metadata?.conflictScore || 0) < 0.5
    );
  }

  /**
   * Applies a resolution to the schedule
   */
  private applyResolution(schedule: Schedule, resolution: Resolution): void {
    for (const modification of resolution.modifications) {
      const game = schedule.games.find(g => g.id === modification.targetGameId);
      if (game) {
        (game as any)[modification.field] = modification.newValue;
      }
    }
  }

  /**
   * Updates ML model based on resolution outcomes
   */
  private async updateLearningModel(
    resolutions: Map<string, Resolution>
  ): Promise<void> {
    for (const [conflictId, resolution] of resolutions) {
      await this.history.recordResolution(resolution);
      
      // Adjust feature weights based on success
      if (resolution.status === 'implemented') {
        // This would connect to actual ML model in production
        // For now, we'll do simple weight adjustment
        this.adjustFeatureWeights(resolution);
      }
    }
  }

  /**
   * Initializes feature weights for ML scoring
   */
  private initializeFeatureWeights(): Map<string, number> {
    return new Map([
      ['severity_score', 0.9],
      ['cascade_risk', 0.8],
      ['affected_games_count', 0.6],
      ['affected_teams_count', 0.6],
      ['strategy_complexity', 0.4],
      ['historical_frequency', 0.7],
      ['schedule_density', 0.5],
      ['remaining_flexibility', 0.6],
      ['pattern_match_score', 0.8],
      ['compliance_risk', 0.95],
      ['reputation_risk', 0.85]
    ]);
  }

  /**
   * Helper methods
   */
  private getSeverityScore(severity: 'critical' | 'major' | 'minor'): number {
    const scores = { critical: 1.0, major: 0.7, minor: 0.3 };
    return scores[severity];
  }

  private getStrategyComplexity(strategy: ResolutionStrategy): number {
    const complexity = {
      [ResolutionStrategy.TIME_SHIFT]: 0.2,
      [ResolutionStrategy.VENUE_SWAP]: 0.4,
      [ResolutionStrategy.DATE_SWAP]: 0.5,
      [ResolutionStrategy.GAME_SWAP]: 0.6,
      [ResolutionStrategy.RESCHEDULE]: 0.7,
      [ResolutionStrategy.SPLIT_DOUBLEHEADER]: 0.8,
      [ResolutionStrategy.ALTERNATIVE_VENUE]: 0.6,
      [ResolutionStrategy.WAIVER_REQUEST]: 0.3,
      [ResolutionStrategy.MANUAL_OVERRIDE]: 0.9
    };
    return complexity[strategy] || 0.5;
  }

  private calculateScheduleDensity(schedule: Schedule): number {
    const totalDays = 180; // Approximate season length
    const gameDays = new Set(schedule.games.map(g => g.date.toDateString())).size;
    return gameDays / totalDays;
  }

  private calculateFlexibility(schedule: Schedule): number {
    // Calculate based on open dates and venue availability
    // Simplified implementation
    return 0.5;
  }

  private calculatePatternMatch(
    conflictType: ConflictType,
    strategy: ResolutionStrategy,
    patterns: any[]
  ): number {
    // Check if this conflict/strategy combination matches historical patterns
    // Simplified implementation
    return 0.7;
  }

  private selectBestStrategy(
    scoredStrategies: Array<{ strategy: ResolutionStrategy; score: number }>
  ): { strategy: ResolutionStrategy; score: number } | null {
    return scoredStrategies.length > 0 ? scoredStrategies[0] : null;
  }

  private cloneSchedule(schedule: Schedule): Schedule {
    return JSON.parse(JSON.stringify(schedule));
  }

  private adjustFeatureWeights(resolution: Resolution): void {
    // Simplified weight adjustment based on resolution success
    // In production, this would use gradient descent or similar
    const adjustment = resolution.impact.competitiveBalance || 0;
    for (const [feature, weight] of this.featureWeights) {
      this.featureWeights.set(feature, weight + adjustment * 0.01);
    }
  }
}