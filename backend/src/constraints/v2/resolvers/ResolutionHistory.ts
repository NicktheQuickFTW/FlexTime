// Resolution History - Tracks historical resolutions for learning
// Maintains a database of past conflict resolutions and their outcomes

import {
  ConflictType,
  ResolutionStrategy,
  Resolution,
  ResolutionHistory as ResolutionHistoryEntry,
  ResolutionFeedback,
  ConflictPattern
} from '../types/conflict-types';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface HistoryStats {
  totalResolutions: number;
  successRate: number;
  averageFeasibility: number;
  averageImpact: {
    gamesModified: number;
    travelDistanceChange: number;
  };
  strategyPerformance: Map<ResolutionStrategy, StrategyPerformance>;
  conflictTypeStats: Map<ConflictType, ConflictTypeStats>;
}

export interface StrategyPerformance {
  strategy: ResolutionStrategy;
  timesUsed: number;
  successCount: number;
  successRate: number;
  averageConfidence: number;
  averageSatisfaction: number;
}

export interface ConflictTypeStats {
  type: ConflictType;
  occurrences: number;
  resolutionSuccess: number;
  commonStrategies: ResolutionStrategy[];
  averageResolutionTime: number;
}

export interface LearningInsight {
  pattern: string;
  confidence: number;
  recommendation: string;
  supportingData: number;
}

export class ResolutionHistory {
  private history: ResolutionHistoryEntry[];
  private historyPath: string;
  private stats: HistoryStats;
  private learningCache: Map<string, LearningInsight[]>;

  constructor(historyPath?: string) {
    this.historyPath = historyPath || './data/resolution-history.json';
    this.history = this.loadHistory();
    this.stats = this.calculateStats();
    this.learningCache = new Map();
  }

  /**
   * Records a resolution outcome in history
   */
  async recordResolution(
    resolution: Resolution,
    success: boolean = true,
    feedback?: ResolutionFeedback
  ): Promise<void> {
    const historyEntry: ResolutionHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conflictType: this.inferConflictType(resolution),
      resolutionStrategy: resolution.strategy,
      success,
      timestamp: new Date(),
      season: this.getCurrentSeason(),
      sport: this.inferSport(resolution),
      feedback
    };

    this.history.push(historyEntry);
    this.saveHistory();
    
    // Update stats
    this.stats = this.calculateStats();
    
    // Clear learning cache to force recalculation
    this.learningCache.clear();
  }

  /**
   * Gets the historical success rate for a strategy/conflict combination
   */
  async getSuccessRate(
    conflictType: ConflictType,
    strategy: ResolutionStrategy
  ): Promise<number> {
    const relevantHistory = this.history.filter(
      entry => entry.conflictType === conflictType && 
               entry.resolutionStrategy === strategy
    );

    if (relevantHistory.length === 0) {
      // No history, return default based on general strategy performance
      const strategyPerf = this.stats.strategyPerformance.get(strategy);
      return strategyPerf?.successRate || 0.5;
    }

    const successCount = relevantHistory.filter(entry => entry.success).length;
    return successCount / relevantHistory.length;
  }

  /**
   * Gets learning insights for a conflict type
   */
  getLearningInsights(conflictType: ConflictType): LearningInsight[] {
    const cacheKey = conflictType;
    
    if (this.learningCache.has(cacheKey)) {
      return this.learningCache.get(cacheKey)!;
    }

    const insights: LearningInsight[] = [];

    // Analyze historical patterns
    const typeHistory = this.history.filter(entry => entry.conflictType === conflictType);
    
    if (typeHistory.length >= 10) {
      // Strategy effectiveness insight
      const strategySuccess = this.analyzeStrategySuccess(typeHistory);
      insights.push(...strategySuccess);

      // Temporal patterns
      const temporalPatterns = this.analyzeTemporalPatterns(typeHistory);
      insights.push(...temporalPatterns);

      // Feedback patterns
      const feedbackPatterns = this.analyzeFeedbackPatterns(typeHistory);
      insights.push(...feedbackPatterns);
    }

    this.learningCache.set(cacheKey, insights);
    return insights;
  }

  /**
   * Gets recommended strategies based on historical performance
   */
  getRecommendedStrategies(
    conflictType: ConflictType,
    contextFactors?: Map<string, any>
  ): ResolutionStrategy[] {
    const typeStats = this.stats.conflictTypeStats.get(conflictType);
    if (!typeStats) {
      return this.getDefaultStrategies(conflictType);
    }

    // Get strategies sorted by success rate
    const strategyPerformance = new Map<ResolutionStrategy, number>();
    
    this.history
      .filter(entry => entry.conflictType === conflictType)
      .forEach(entry => {
        const current = strategyPerformance.get(entry.resolutionStrategy) || 0;
        strategyPerformance.set(
          entry.resolutionStrategy,
          current + (entry.success ? 1 : 0)
        );
      });

    // Apply context-based adjustments if provided
    if (contextFactors) {
      this.applyContextAdjustments(strategyPerformance, contextFactors);
    }

    // Sort by performance
    const sortedStrategies = Array.from(strategyPerformance.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return sortedStrategies.length > 0 
      ? sortedStrategies 
      : this.getDefaultStrategies(conflictType);
  }

  /**
   * Generates a learning report for improving resolution strategies
   */
  generateLearningReport(): string {
    const report: string[] = [
      '# Conflict Resolution Learning Report',
      `Generated: ${new Date().toISOString()}`,
      `Total Resolutions Analyzed: ${this.history.length}`,
      '',
      '## Overall Performance',
      `- Success Rate: ${(this.stats.successRate * 100).toFixed(1)}%`,
      `- Average Feasibility: ${(this.stats.averageFeasibility * 100).toFixed(1)}%`,
      `- Average Games Modified: ${this.stats.averageImpact.gamesModified.toFixed(1)}`,
      '',
      '## Strategy Performance'
    ];

    // Strategy performance details
    const sortedStrategies = Array.from(this.stats.strategyPerformance.values())
      .sort((a, b) => b.successRate - a.successRate);

    sortedStrategies.forEach(perf => {
      report.push(
        `\n### ${perf.strategy}`,
        `- Times Used: ${perf.timesUsed}`,
        `- Success Rate: ${(perf.successRate * 100).toFixed(1)}%`,
        `- Average Confidence: ${(perf.averageConfidence * 100).toFixed(1)}%`,
        `- Average Satisfaction: ${perf.averageSatisfaction.toFixed(1)}/5`
      );
    });

    report.push('', '## Conflict Type Analysis');

    // Conflict type details
    Array.from(this.stats.conflictTypeStats.values()).forEach(stats => {
      report.push(
        `\n### ${stats.type}`,
        `- Occurrences: ${stats.occurrences}`,
        `- Resolution Success: ${(stats.resolutionSuccess * 100).toFixed(1)}%`,
        `- Common Strategies: ${stats.commonStrategies.join(', ')}`,
        `- Avg Resolution Time: ${stats.averageResolutionTime.toFixed(0)}ms`
      );

      // Add insights for this conflict type
      const insights = this.getLearningInsights(stats.type);
      if (insights.length > 0) {
        report.push('\n#### Key Insights:');
        insights.forEach(insight => {
          report.push(`- ${insight.recommendation} (confidence: ${(insight.confidence * 100).toFixed(0)}%)`);
        });
      }
    });

    report.push('', '## Recommendations for Improvement');
    report.push(...this.generateImprovementRecommendations());

    return report.join('\n');
  }

  /**
   * Exports history data for external ML training
   */
  exportForMLTraining(): any[] {
    return this.history.map(entry => ({
      conflictType: entry.conflictType,
      strategy: entry.resolutionStrategy,
      success: entry.success,
      season: entry.season,
      sport: entry.sport,
      satisfaction: entry.feedback?.satisfaction || 3,
      wouldRecommend: entry.feedback?.wouldRecommend !== false,
      timestamp: entry.timestamp.getTime(),
      dayOfWeek: new Date(entry.timestamp).getDay(),
      monthOfYear: new Date(entry.timestamp).getMonth()
    }));
  }

  /**
   * Private helper methods
   */
  private loadHistory(): ResolutionHistoryEntry[] {
    if (!existsSync(this.historyPath)) {
      // Create directory if it doesn't exist
      const dir = dirname(this.historyPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      // Initialize with empty history
      this.saveHistory([]);
      return [];
    }

    try {
      const data = readFileSync(this.historyPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('Error loading resolution history:', error);
      return [];
    }
  }

  private saveHistory(history?: ResolutionHistoryEntry[]): void {
    const dataToSave = history || this.history;
    
    try {
      writeFileSync(
        this.historyPath, 
        JSON.stringify(dataToSave, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving resolution history:', error);
    }
  }

  private calculateStats(): HistoryStats {
    const stats: HistoryStats = {
      totalResolutions: this.history.length,
      successRate: 0,
      averageFeasibility: 0,
      averageImpact: {
        gamesModified: 0,
        travelDistanceChange: 0
      },
      strategyPerformance: new Map(),
      conflictTypeStats: new Map()
    };

    if (this.history.length === 0) return stats;

    // Calculate success rate
    const successCount = this.history.filter(entry => entry.success).length;
    stats.successRate = successCount / this.history.length;

    // Calculate strategy performance
    const strategyData = new Map<ResolutionStrategy, {
      used: number;
      success: number;
      confidence: number[];
      satisfaction: number[];
    }>();

    this.history.forEach(entry => {
      const data = strategyData.get(entry.resolutionStrategy) || {
        used: 0,
        success: 0,
        confidence: [],
        satisfaction: []
      };

      data.used++;
      if (entry.success) data.success++;
      if (entry.feedback?.satisfaction) {
        data.satisfaction.push(entry.feedback.satisfaction);
      }

      strategyData.set(entry.resolutionStrategy, data);
    });

    // Convert to StrategyPerformance
    strategyData.forEach((data, strategy) => {
      stats.strategyPerformance.set(strategy, {
        strategy,
        timesUsed: data.used,
        successCount: data.success,
        successRate: data.success / data.used,
        averageConfidence: 0.7, // Placeholder
        averageSatisfaction: data.satisfaction.length > 0
          ? data.satisfaction.reduce((a, b) => a + b) / data.satisfaction.length
          : 3
      });
    });

    // Calculate conflict type stats
    const conflictData = new Map<ConflictType, {
      occurrences: number;
      success: number;
      strategies: Map<ResolutionStrategy, number>;
    }>();

    this.history.forEach(entry => {
      const data = conflictData.get(entry.conflictType) || {
        occurrences: 0,
        success: 0,
        strategies: new Map()
      };

      data.occurrences++;
      if (entry.success) data.success++;
      
      const stratCount = data.strategies.get(entry.resolutionStrategy) || 0;
      data.strategies.set(entry.resolutionStrategy, stratCount + 1);

      conflictData.set(entry.conflictType, data);
    });

    // Convert to ConflictTypeStats
    conflictData.forEach((data, type) => {
      const commonStrategies = Array.from(data.strategies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      stats.conflictTypeStats.set(type, {
        type,
        occurrences: data.occurrences,
        resolutionSuccess: data.success / data.occurrences,
        commonStrategies,
        averageResolutionTime: 500 // Placeholder
      });
    });

    return stats;
  }

  private analyzeStrategySuccess(
    history: ResolutionHistoryEntry[]
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const strategySuccess = new Map<ResolutionStrategy, number>();
    const strategyCount = new Map<ResolutionStrategy, number>();

    history.forEach(entry => {
      const count = strategyCount.get(entry.resolutionStrategy) || 0;
      const success = strategySuccess.get(entry.resolutionStrategy) || 0;
      
      strategyCount.set(entry.resolutionStrategy, count + 1);
      if (entry.success) {
        strategySuccess.set(entry.resolutionStrategy, success + 1);
      }
    });

    // Find best and worst performing strategies
    let bestStrategy: ResolutionStrategy | null = null;
    let bestRate = 0;
    let worstStrategy: ResolutionStrategy | null = null;
    let worstRate = 1;

    strategyCount.forEach((count, strategy) => {
      if (count >= 5) { // Only consider strategies with enough data
        const rate = (strategySuccess.get(strategy) || 0) / count;
        
        if (rate > bestRate) {
          bestRate = rate;
          bestStrategy = strategy;
        }
        
        if (rate < worstRate) {
          worstRate = rate;
          worstStrategy = strategy;
        }
      }
    });

    if (bestStrategy) {
      insights.push({
        pattern: `${bestStrategy} most effective`,
        confidence: bestRate,
        recommendation: `Prioritize ${bestStrategy} for this conflict type`,
        supportingData: strategyCount.get(bestStrategy) || 0
      });
    }

    if (worstStrategy && worstRate < 0.3) {
      insights.push({
        pattern: `${worstStrategy} rarely succeeds`,
        confidence: 1 - worstRate,
        recommendation: `Avoid ${worstStrategy} unless necessary`,
        supportingData: strategyCount.get(worstStrategy) || 0
      });
    }

    return insights;
  }

  private analyzeTemporalPatterns(
    history: ResolutionHistoryEntry[]
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    // Analyze success by day of week
    const daySuccess = new Map<number, { total: number; success: number }>();
    
    history.forEach(entry => {
      const day = new Date(entry.timestamp).getDay();
      const data = daySuccess.get(day) || { total: 0, success: 0 };
      
      data.total++;
      if (entry.success) data.success++;
      
      daySuccess.set(day, data);
    });

    // Find patterns
    daySuccess.forEach((data, day) => {
      if (data.total >= 5) {
        const rate = data.success / data.total;
        if (rate < 0.3) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 
                          'Thursday', 'Friday', 'Saturday'][day];
          insights.push({
            pattern: `Low success on ${dayName}s`,
            confidence: 0.7,
            recommendation: `Consider alternative strategies for ${dayName} conflicts`,
            supportingData: data.total
          });
        }
      }
    });

    return insights;
  }

  private analyzeFeedbackPatterns(
    history: ResolutionHistoryEntry[]
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    // Analyze satisfaction by strategy
    const satisfactionByStrategy = new Map<ResolutionStrategy, number[]>();
    
    history.forEach(entry => {
      if (entry.feedback?.satisfaction) {
        const satisfactions = satisfactionByStrategy.get(entry.resolutionStrategy) || [];
        satisfactions.push(entry.feedback.satisfaction);
        satisfactionByStrategy.set(entry.resolutionStrategy, satisfactions);
      }
    });

    satisfactionByStrategy.forEach((satisfactions, strategy) => {
      if (satisfactions.length >= 5) {
        const avg = satisfactions.reduce((a, b) => a + b) / satisfactions.length;
        
        if (avg < 2.5) {
          insights.push({
            pattern: `Low satisfaction with ${strategy}`,
            confidence: 0.8,
            recommendation: `Improve implementation of ${strategy} or use alternatives`,
            supportingData: satisfactions.length
          });
        } else if (avg > 4.0) {
          insights.push({
            pattern: `High satisfaction with ${strategy}`,
            confidence: 0.8,
            recommendation: `${strategy} well-received, prioritize when applicable`,
            supportingData: satisfactions.length
          });
        }
      }
    });

    return insights;
  }

  private generateImprovementRecommendations(): string[] {
    const recommendations: string[] = [];

    // Low overall success rate
    if (this.stats.successRate < 0.6) {
      recommendations.push(
        '1. Overall success rate is below 60%. Consider:',
        '   - Reviewing constraint definitions for conflicts',
        '   - Expanding resolution strategy options',
        '   - Implementing more sophisticated conflict detection'
      );
    }

    // Underperforming strategies
    this.stats.strategyPerformance.forEach(perf => {
      if (perf.timesUsed > 10 && perf.successRate < 0.4) {
        recommendations.push(
          `2. ${perf.strategy} has low success rate (${(perf.successRate * 100).toFixed(0)}%):`,
          `   - Review implementation logic`,
          `   - Consider additional validation before applying`,
          `   - May need strategy-specific improvements`
        );
      }
    });

    // Strategies with low satisfaction
    this.stats.strategyPerformance.forEach(perf => {
      if (perf.averageSatisfaction < 2.5) {
        recommendations.push(
          `3. ${perf.strategy} has low user satisfaction:`,
          `   - Gather more detailed feedback`,
          `   - Analyze common complaints`,
          `   - Consider UX improvements in resolution process`
        );
      }
    });

    // High-frequency conflict types
    this.stats.conflictTypeStats.forEach(stats => {
      if (stats.occurrences > this.stats.totalResolutions * 0.3) {
        recommendations.push(
          `4. ${stats.type} represents ${((stats.occurrences / this.stats.totalResolutions) * 100).toFixed(0)}% of conflicts:`,
          `   - Investigate root causes`,
          `   - Implement preventive measures`,
          `   - Consider dedicated optimization for this type`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('System performing well. Continue monitoring for optimization opportunities.');
    }

    return recommendations;
  }

  private inferConflictType(resolution: Resolution): ConflictType {
    // Infer from resolution strategy and modifications
    // This is a simplified implementation
    
    if (resolution.strategy === ResolutionStrategy.WAIVER_REQUEST &&
        resolution.description.includes('Sunday')) {
      return ConflictType.SUNDAY_RESTRICTION;
    }
    
    if (resolution.modifications.some(m => m.field === 'venueId')) {
      return ConflictType.VENUE_DOUBLE_BOOKING;
    }
    
    if (resolution.impact.travelDistanceChange > 1000) {
      return ConflictType.TRAVEL_BURDEN;
    }
    
    // Default fallback
    return ConflictType.VENUE_DOUBLE_BOOKING;
  }

  private inferSport(resolution: Resolution): string {
    // Would need actual game data to determine sport
    // This is a placeholder
    return 'basketball';
  }

  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 7) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  private getDefaultStrategies(conflictType: ConflictType): ResolutionStrategy[] {
    // Default strategy ordering by conflict type
    const defaults: Record<ConflictType, ResolutionStrategy[]> = {
      [ConflictType.VENUE_DOUBLE_BOOKING]: [
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.VENUE_SWAP,
        ResolutionStrategy.ALTERNATIVE_VENUE
      ],
      [ConflictType.SUNDAY_RESTRICTION]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.WAIVER_REQUEST
      ],
      [ConflictType.TRAVEL_BURDEN]: [
        ResolutionStrategy.GAME_SWAP,
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.SPLIT_DOUBLEHEADER
      ],
      [ConflictType.CHAMPIONSHIP_DATE]: [
        ResolutionStrategy.RESCHEDULE,
        ResolutionStrategy.DATE_SWAP
      ],
      [ConflictType.BACK_TO_BACK_GAMES]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.TIME_SHIFT
      ],
      [ConflictType.HOME_AWAY_IMBALANCE]: [
        ResolutionStrategy.GAME_SWAP,
        ResolutionStrategy.VENUE_SWAP
      ],
      [ConflictType.TV_SLOT_CONFLICT]: [
        ResolutionStrategy.TIME_SHIFT,
        ResolutionStrategy.DATE_SWAP
      ],
      [ConflictType.WEATHER_RESTRICTION]: [
        ResolutionStrategy.ALTERNATIVE_VENUE,
        ResolutionStrategy.DATE_SWAP
      ],
      [ConflictType.ACADEMIC_CALENDAR]: [
        ResolutionStrategy.DATE_SWAP,
        ResolutionStrategy.TIME_SHIFT
      ]
    };

    return defaults[conflictType] || [ResolutionStrategy.MANUAL_OVERRIDE];
  }

  private applyContextAdjustments(
    strategyPerformance: Map<ResolutionStrategy, number>,
    contextFactors: Map<string, any>
  ): void {
    // Adjust strategy scores based on context
    
    // Example: If it's late in the season, reduce score for major changes
    if (contextFactors.get('seasonProgress') > 0.8) {
      const majorChangeStrategies = [
        ResolutionStrategy.RESCHEDULE,
        ResolutionStrategy.GAME_SWAP
      ];
      
      majorChangeStrategies.forEach(strategy => {
        const current = strategyPerformance.get(strategy) || 0;
        strategyPerformance.set(strategy, current * 0.7);
      });
    }

    // Example: If TV is involved, prioritize time shifts
    if (contextFactors.get('tvInvolved')) {
      const current = strategyPerformance.get(ResolutionStrategy.TIME_SHIFT) || 0;
      strategyPerformance.set(ResolutionStrategy.TIME_SHIFT, current * 1.3);
    }
  }
}