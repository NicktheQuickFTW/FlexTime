import {
  UnifiedConstraint,
  ConstraintResult,
  EvaluationResult,
  Schedule,
  ConstraintHardness,
  ConstraintStatus,
  ConstraintSuggestion
} from '../types';
import { ConstraintCache } from './ConstraintCache';
import { ParameterPipeline } from './ParameterPipeline';
import { ParallelEvaluator } from './ParallelEvaluator';
import { DependencyAnalyzer, ConstraintDependency } from './DependencyAnalyzer';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface EngineConfiguration {
  enableCaching: boolean;
  cacheSize?: number;
  cacheTTL?: number;
  enableParallelization: boolean;
  maxWorkers?: number;
  enableIncrementalEvaluation: boolean;
  enablePerformanceMonitoring: boolean;
  groupingStrategy: 'type' | 'hardness' | 'dependency' | 'smart';
  batchSize?: number;
  timeoutMs?: number;
}

export interface EvaluationContext {
  schedule: Schedule;
  constraints: UnifiedConstraint[];
  previousResults?: Map<string, ConstraintResult>;
  modifiedEntities?: Set<string>;
  options?: Partial<EngineConfiguration>;
}

export class OptimizationEngine {
  private cache: ConstraintCache;
  private pipeline: ParameterPipeline;
  private parallelEvaluator: ParallelEvaluator;
  private dependencyAnalyzer: DependencyAnalyzer;
  private performanceMonitor: PerformanceMonitor;
  private config: EngineConfiguration;

  constructor(config: Partial<EngineConfiguration> = {}) {
    this.config = {
      enableCaching: true,
      cacheSize: 10000,
      cacheTTL: 3600000, // 1 hour
      enableParallelization: true,
      maxWorkers: 4,
      enableIncrementalEvaluation: true,
      enablePerformanceMonitoring: true,
      groupingStrategy: 'smart',
      batchSize: 50,
      timeoutMs: 30000,
      ...config
    };

    this.cache = new ConstraintCache({
      maxSize: this.config.cacheSize!,
      ttl: this.config.cacheTTL!
    });

    this.pipeline = new ParameterPipeline();
    this.parallelEvaluator = new ParallelEvaluator({
      maxWorkers: this.config.maxWorkers!,
      timeout: this.config.timeoutMs!
    });
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.performanceMonitor = new PerformanceMonitor();
  }

  async evaluate(context: EvaluationContext): Promise<EvaluationResult> {
    const startTime = Date.now();
    const evaluationId = this.generateEvaluationId();

    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor.startEvaluation(evaluationId);
    }

    try {
      // Step 1: Analyze dependencies and create evaluation groups
      const dependencies = this.dependencyAnalyzer.analyze(context.constraints);
      const groups = this.createConstraintGroups(context.constraints, dependencies);

      // Step 2: Determine which constraints need evaluation
      const constraintsToEvaluate = this.config.enableIncrementalEvaluation
        ? this.getIncrementalConstraints(context)
        : context.constraints;

      // Step 3: Execute pipeline stages
      const pipelineResult = await this.pipeline.execute({
        schedule: context.schedule,
        constraints: constraintsToEvaluate,
        groups,
        dependencies,
        cache: this.config.enableCaching ? this.cache : undefined,
        parallelEvaluator: this.config.enableParallelization ? this.parallelEvaluator : undefined
      });

      // Step 4: Process and aggregate results
      const results = this.aggregateResults(pipelineResult.results, context.previousResults);
      
      // Step 5: Calculate scores and generate suggestions
      const scores = this.calculateScores(results);
      const suggestions = this.generateSuggestions(results, context.schedule);

      const evaluationResult: EvaluationResult = {
        scheduleId: context.schedule.id,
        evaluationId,
        timestamp: new Date(),
        overallScore: scores.overall,
        hardConstraintsSatisfied: scores.hardConstraintsSatisfied,
        softConstraintsScore: scores.softScore,
        preferenceScore: scores.preferenceScore,
        results: Array.from(results.values()),
        executionTime: Date.now() - startTime,
        suggestions,
        metadata: {
          evaluationEngine: 'OptimizedParameterEngine',
          version: '2.0',
          parallelization: this.config.enableParallelization,
          cacheHitRate: this.cache.getHitRate()
        }
      };

      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.endEvaluation(evaluationId, evaluationResult);
      }

      return evaluationResult;

    } catch (error) {
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor.recordError(evaluationId, error);
      }
      throw error;
    }
  }

  private createConstraintGroups(
    constraints: UnifiedConstraint[],
    dependencies: Map<string, ConstraintDependency>
  ): Map<string, UnifiedConstraint[]> {
    const groups = new Map<string, UnifiedConstraint[]>();

    switch (this.config.groupingStrategy) {
      case 'type':
        return this.groupByType(constraints);
      case 'hardness':
        return this.groupByHardness(constraints);
      case 'dependency':
        return this.groupByDependency(constraints, dependencies);
      case 'smart':
      default:
        return this.smartGrouping(constraints, dependencies);
    }
  }

  private groupByType(constraints: UnifiedConstraint[]): Map<string, UnifiedConstraint[]> {
    const groups = new Map<string, UnifiedConstraint[]>();
    
    constraints.forEach(constraint => {
      const type = constraint.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(constraint);
    });

    return groups;
  }

  private groupByHardness(constraints: UnifiedConstraint[]): Map<string, UnifiedConstraint[]> {
    const groups = new Map<string, UnifiedConstraint[]>();
    
    constraints.forEach(constraint => {
      const hardness = constraint.hardness;
      if (!groups.has(hardness)) {
        groups.set(hardness, []);
      }
      groups.get(hardness)!.push(constraint);
    });

    return groups;
  }

  private groupByDependency(
    constraints: UnifiedConstraint[],
    dependencies: Map<string, ConstraintDependency>
  ): Map<string, UnifiedConstraint[]> {
    const groups = new Map<string, UnifiedConstraint[]>();
    const visited = new Set<string>();
    let groupId = 0;

    constraints.forEach(constraint => {
      if (!visited.has(constraint.id)) {
        const group = this.collectDependencyGroup(
          constraint,
          dependencies,
          visited
        );
        groups.set(`group_${groupId++}`, group);
      }
    });

    return groups;
  }

  private smartGrouping(
    constraints: UnifiedConstraint[],
    dependencies: Map<string, ConstraintDependency>
  ): Map<string, UnifiedConstraint[]> {
    const groups = new Map<string, UnifiedConstraint[]>();
    
    // Group 1: Hard constraints with no dependencies (can be evaluated in parallel)
    const hardNoDeps = constraints.filter(c => 
      c.hardness === ConstraintHardness.HARD && 
      (!dependencies.has(c.id) || dependencies.get(c.id)!.dependencies.length === 0)
    );
    if (hardNoDeps.length > 0) {
      groups.set('hard_independent', hardNoDeps);
    }

    // Group 2: Hard constraints with dependencies (need sequential evaluation)
    const hardWithDeps = constraints.filter(c => 
      c.hardness === ConstraintHardness.HARD && 
      dependencies.has(c.id) && 
      dependencies.get(c.id)!.dependencies.length > 0
    );
    if (hardWithDeps.length > 0) {
      groups.set('hard_dependent', hardWithDeps);
    }

    // Group 3: Soft constraints (can be evaluated in parallel)
    const softConstraints = constraints.filter(c => 
      c.hardness === ConstraintHardness.SOFT
    );
    if (softConstraints.length > 0) {
      groups.set('soft', softConstraints);
    }

    // Group 4: Preferences (lowest priority, can be evaluated in parallel)
    const preferences = constraints.filter(c => 
      c.hardness === ConstraintHardness.PREFERENCE
    );
    if (preferences.length > 0) {
      groups.set('preferences', preferences);
    }

    return groups;
  }

  private collectDependencyGroup(
    constraint: UnifiedConstraint,
    dependencies: Map<string, ConstraintDependency>,
    visited: Set<string>
  ): UnifiedConstraint[] {
    const group: UnifiedConstraint[] = [];
    const stack = [constraint];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!visited.has(current.id)) {
        visited.add(current.id);
        group.push(current);

        const deps = dependencies.get(current.id);
        if (deps) {
          deps.dependencies.forEach(depId => {
            const depConstraint = this.findConstraintById(depId, dependencies);
            if (depConstraint && !visited.has(depId)) {
              stack.push(depConstraint);
            }
          });
        }
      }
    }

    return group;
  }

  private findConstraintById(
    id: string,
    dependencies: Map<string, ConstraintDependency>
  ): UnifiedConstraint | undefined {
    for (const [, dep] of dependencies) {
      if (dep.constraint.id === id) {
        return dep.constraint;
      }
    }
    return undefined;
  }

  private getIncrementalConstraints(context: EvaluationContext): UnifiedConstraint[] {
    if (!context.modifiedEntities || context.modifiedEntities.size === 0) {
      return context.constraints;
    }

    // Only re-evaluate constraints that are affected by modified entities
    return context.constraints.filter(constraint => {
      // Check if constraint scope intersects with modified entities
      const scope = constraint.scope;
      
      // Check teams
      if (scope.teams) {
        for (const team of scope.teams) {
          if (context.modifiedEntities!.has(team)) {
            return true;
          }
        }
      }

      // Check venues
      if (scope.venues) {
        for (const venue of scope.venues) {
          if (context.modifiedEntities!.has(venue)) {
            return true;
          }
        }
      }

      // If constraint has no specific scope, it might be affected
      if (!scope.teams && !scope.venues) {
        return true;
      }

      return false;
    });
  }

  private aggregateResults(
    newResults: Map<string, ConstraintResult>,
    previousResults?: Map<string, ConstraintResult>
  ): Map<string, ConstraintResult> {
    if (!previousResults) {
      return newResults;
    }

    // Merge previous results with new results
    const aggregated = new Map(previousResults);
    
    for (const [id, result] of newResults) {
      aggregated.set(id, result);
    }

    return aggregated;
  }

  private calculateScores(results: Map<string, ConstraintResult>): {
    overall: number;
    hardConstraintsSatisfied: boolean;
    softScore: number;
    preferenceScore: number;
  } {
    let hardSatisfied = true;
    let softScore = 0;
    let softCount = 0;
    let preferenceScore = 0;
    let preferenceCount = 0;

    for (const result of results.values()) {
      if (result.status === ConstraintStatus.VIOLATED) {
        // Check if this is a hard constraint violation
        const constraint = this.findConstraintByResult(result);
        if (constraint && constraint.hardness === ConstraintHardness.HARD) {
          hardSatisfied = false;
        } else if (constraint && constraint.hardness === ConstraintHardness.SOFT) {
          softScore += result.score;
          softCount++;
        } else if (constraint && constraint.hardness === ConstraintHardness.PREFERENCE) {
          preferenceScore += result.score;
          preferenceCount++;
        }
      } else {
        if (result.status === ConstraintStatus.SATISFIED) {
          const constraint = this.findConstraintByResult(result);
          if (constraint && constraint.hardness === ConstraintHardness.SOFT) {
            softScore += result.score;
            softCount++;
          } else if (constraint && constraint.hardness === ConstraintHardness.PREFERENCE) {
            preferenceScore += result.score;
            preferenceCount++;
          }
        }
      }
    }

    const avgSoftScore = softCount > 0 ? softScore / softCount : 1.0;
    const avgPreferenceScore = preferenceCount > 0 ? preferenceScore / preferenceCount : 1.0;
    
    const overall = hardSatisfied 
      ? (0.5 * avgSoftScore + 0.3 * avgPreferenceScore + 0.2)
      : 0;

    return {
      overall,
      hardConstraintsSatisfied: hardSatisfied,
      softScore: avgSoftScore,
      preferenceScore: avgPreferenceScore
    };
  }

  private findConstraintByResult(result: ConstraintResult): UnifiedConstraint | undefined {
    // This would need to be implemented based on how constraints are stored
    // For now, returning undefined
    return undefined;
  }

  private generateSuggestions(
    results: Map<string, ConstraintResult>,
    schedule: Schedule
  ): ConstraintSuggestion[] {
    const suggestions: ConstraintSuggestion[] = [];

    // Collect all suggestions from individual constraint results
    for (const result of results.values()) {
      if (result.suggestions) {
        suggestions.push(...result.suggestions);
      }
    }

    // Sort by priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Deduplicate similar suggestions
    return this.deduplicateSuggestions(suggestions);
  }

  private deduplicateSuggestions(
    suggestions: ConstraintSuggestion[]
  ): ConstraintSuggestion[] {
    const seen = new Set<string>();
    const deduplicated: ConstraintSuggestion[] = [];

    for (const suggestion of suggestions) {
      const key = `${suggestion.type}:${suggestion.description}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(suggestion);
      }
    }

    return deduplicated;
  }

  private generateEvaluationId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Performance optimization methods
  async warmCache(schedule: Schedule, constraints: UnifiedConstraint[]): Promise<void> {
    if (!this.config.enableCaching) {
      return;
    }

    // Pre-evaluate cacheable constraints
    const cacheableConstraints = constraints.filter(c => c.cacheable !== false);
    
    for (const constraint of cacheableConstraints) {
      const cacheKey = this.generateCacheKey(schedule, constraint);
      if (!this.cache.has(cacheKey)) {
        try {
          const result = await constraint.evaluation(schedule, constraint.parameters);
          this.cache.set(cacheKey, result);
        } catch (error) {
          // Log error but continue warming cache
          console.error(`Cache warming failed for constraint ${constraint.id}:`, error);
        }
      }
    }
  }

  private generateCacheKey(schedule: Schedule, constraint: UnifiedConstraint): string {
    if (constraint.cacheKey) {
      return constraint.cacheKey(schedule);
    }
    
    // Default cache key generation
    return `${constraint.id}_${schedule.id}_${schedule.metadata?.updatedAt?.getTime() || 0}`;
  }

  // Cleanup methods
  async shutdown(): Promise<void> {
    await this.parallelEvaluator.shutdown();
    this.cache.clear();
    this.performanceMonitor.reset();
  }

  // Getters for monitoring
  getPerformanceStats() {
    return this.performanceMonitor.getStats();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

// Export helper to create pre-configured engines
export function createOptimizedEngine(
  profile: 'performance' | 'balanced' | 'accuracy' = 'balanced'
): OptimizationEngine {
  const configs: Record<string, Partial<EngineConfiguration>> = {
    performance: {
      enableCaching: true,
      cacheSize: 20000,
      enableParallelization: true,
      maxWorkers: 8,
      enableIncrementalEvaluation: true,
      groupingStrategy: 'smart',
      batchSize: 100
    },
    balanced: {
      enableCaching: true,
      cacheSize: 10000,
      enableParallelization: true,
      maxWorkers: 4,
      enableIncrementalEvaluation: true,
      groupingStrategy: 'smart',
      batchSize: 50
    },
    accuracy: {
      enableCaching: false,
      enableParallelization: false,
      enableIncrementalEvaluation: false,
      groupingStrategy: 'dependency',
      batchSize: 10
    }
  };

  return new OptimizationEngine(configs[profile]);
}