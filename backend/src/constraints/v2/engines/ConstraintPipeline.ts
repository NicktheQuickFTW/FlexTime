import {
  UnifiedConstraint,
  ConstraintResult,
  Schedule,
  ConstraintStatus,
  ConstraintHardness
} from '../types';
import { ConstraintCache } from './ConstraintCache';
import { ParallelEvaluator } from './ParallelEvaluator';
import { ConstraintDependency } from './DependencyAnalyzer';

export interface PipelineStage {
  name: string;
  execute(context: PipelineContext): Promise<PipelineContext>;
  canSkip?(context: PipelineContext): boolean;
}

export interface PipelineContext {
  schedule: Schedule;
  constraints: UnifiedConstraint[];
  groups?: Map<string, UnifiedConstraint[]>;
  dependencies?: Map<string, ConstraintDependency>;
  results: Map<string, ConstraintResult>;
  cache?: ConstraintCache;
  parallelEvaluator?: ParallelEvaluator;
  metadata: {
    startTime: number;
    stageTimings: Map<string, number>;
    errors: Error[];
    warnings: string[];
  };
}

export interface PipelineConfiguration {
  stages?: PipelineStage[];
  abortOnHardConstraintViolation?: boolean;
  maxStageRetries?: number;
  stageTimeout?: number;
}

export class ConstraintPipeline {
  private stages: PipelineStage[];
  private config: PipelineConfiguration;

  constructor(config: PipelineConfiguration = {}) {
    this.config = {
      abortOnHardConstraintViolation: false,
      maxStageRetries: 3,
      stageTimeout: 60000, // 1 minute per stage
      ...config
    };

    this.stages = config.stages || this.createDefaultStages();
  }

  private createDefaultStages(): PipelineStage[] {
    return [
      new ValidationStage(),
      new CacheLookupStage(),
      new DependencyResolutionStage(),
      new EvaluationStage(),
      new PostProcessingStage(),
      new CacheUpdateStage()
    ];
  }

  async execute(initialContext: Partial<PipelineContext>): Promise<PipelineContext> {
    const context: PipelineContext = {
      results: new Map(),
      metadata: {
        startTime: Date.now(),
        stageTimings: new Map(),
        errors: [],
        warnings: []
      },
      ...initialContext
    } as PipelineContext;

    for (const stage of this.stages) {
      const stageStartTime = Date.now();

      try {
        // Check if stage can be skipped
        if (stage.canSkip && stage.canSkip(context)) {
          context.metadata.stageTimings.set(stage.name, 0);
          continue;
        }

        // Execute stage with retry logic
        const updatedContext = await this.executeStageWithRetry(stage, context);
        
        // Update timing
        context.metadata.stageTimings.set(
          stage.name,
          Date.now() - stageStartTime
        );

        // Check for hard constraint violations
        if (this.config.abortOnHardConstraintViolation && 
            this.hasHardConstraintViolations(updatedContext)) {
          context.metadata.warnings.push(
            'Pipeline aborted due to hard constraint violations'
          );
          return updatedContext;
        }

        // Update context for next stage
        Object.assign(context, updatedContext);

      } catch (error) {
        context.metadata.errors.push(error as Error);
        
        // Decide whether to continue or abort
        if (this.isRecoverableError(error)) {
          context.metadata.warnings.push(
            `Stage ${stage.name} failed with recoverable error: ${error}`
          );
        } else {
          throw error;
        }
      }
    }

    return context;
  }

  private async executeStageWithRetry(
    stage: PipelineStage,
    context: PipelineContext
  ): Promise<PipelineContext> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxStageRetries!; attempt++) {
      try {
        return await Promise.race([
          stage.execute(context),
          this.createTimeout(this.config.stageTimeout!, stage.name)
        ]);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxStageRetries!) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    throw lastError || new Error(`Stage ${stage.name} failed after ${this.config.maxStageRetries} attempts`);
  }

  private createTimeout(ms: number, stageName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Stage ${stageName} timed out after ${ms}ms`));
      }, ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private hasHardConstraintViolations(context: PipelineContext): boolean {
    for (const [constraintId, result] of context.results) {
      if (result.status === ConstraintStatus.VIOLATED) {
        const constraint = context.constraints.find(c => c.id === constraintId);
        if (constraint && constraint.hardness === ConstraintHardness.HARD) {
          return true;
        }
      }
    }
    return false;
  }

  private isRecoverableError(error: any): boolean {
    // Define which errors are recoverable
    const recoverableErrorTypes = [
      'NetworkError',
      'TimeoutError',
      'CacheError'
    ];

    return recoverableErrorTypes.some(type => 
      error.name === type || error.constructor.name === type
    );
  }

  // Allow adding custom stages
  addStage(stage: PipelineStage, position?: number): void {
    if (position !== undefined && position >= 0 && position <= this.stages.length) {
      this.stages.splice(position, 0, stage);
    } else {
      this.stages.push(stage);
    }
  }

  removeStage(stageName: string): void {
    this.stages = this.stages.filter(stage => stage.name !== stageName);
  }

  getStages(): PipelineStage[] {
    return [...this.stages];
  }
}

// Default pipeline stages

class ValidationStage implements PipelineStage {
  name = 'Validation';

  async execute(context: PipelineContext): Promise<PipelineContext> {
    // Validate input data
    if (!context.schedule) {
      throw new Error('Schedule is required');
    }

    if (!context.constraints || context.constraints.length === 0) {
      throw new Error('At least one constraint is required');
    }

    // Validate constraint integrity
    for (const constraint of context.constraints) {
      this.validateConstraint(constraint);
    }

    return context;
  }

  private validateConstraint(constraint: UnifiedConstraint): void {
    if (!constraint.id) {
      throw new Error('Constraint must have an ID');
    }

    if (!constraint.evaluation) {
      throw new Error(`Constraint ${constraint.id} must have an evaluation function`);
    }

    if (typeof constraint.weight !== 'number' || 
        constraint.weight < 0 || 
        constraint.weight > 100) {
      throw new Error(`Constraint ${constraint.id} must have a weight between 0 and 100`);
    }
  }
}

class CacheLookupStage implements PipelineStage {
  name = 'CacheLookup';

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!context.cache) {
      return context;
    }

    const uncachedConstraints: UnifiedConstraint[] = [];

    for (const constraint of context.constraints) {
      if (constraint.cacheable === false) {
        uncachedConstraints.push(constraint);
        continue;
      }

      const cacheKey = this.generateCacheKey(context.schedule, constraint);
      const cachedResult = context.cache.get(cacheKey);

      if (cachedResult) {
        context.results.set(constraint.id, cachedResult);
      } else {
        uncachedConstraints.push(constraint);
      }
    }

    // Update constraints to only include uncached ones
    return {
      ...context,
      constraints: uncachedConstraints
    };
  }

  canSkip(context: PipelineContext): boolean {
    return !context.cache;
  }

  private generateCacheKey(schedule: Schedule, constraint: UnifiedConstraint): string {
    if (constraint.cacheKey) {
      return constraint.cacheKey(schedule);
    }
    
    return `${constraint.id}_${schedule.id}_${schedule.metadata?.updatedAt?.getTime() || 0}`;
  }
}

class DependencyResolutionStage implements PipelineStage {
  name = 'DependencyResolution';

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!context.dependencies || context.dependencies.size === 0) {
      return context;
    }

    // Sort constraints by dependency order
    const sortedConstraints = this.topologicalSort(
      context.constraints,
      context.dependencies
    );

    return {
      ...context,
      constraints: sortedConstraints
    };
  }

  private topologicalSort(
    constraints: UnifiedConstraint[],
    dependencies: Map<string, ConstraintDependency>
  ): UnifiedConstraint[] {
    const sorted: UnifiedConstraint[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (constraint: UnifiedConstraint) => {
      if (visited.has(constraint.id)) {
        return;
      }

      if (visiting.has(constraint.id)) {
        throw new Error(`Circular dependency detected for constraint ${constraint.id}`);
      }

      visiting.add(constraint.id);

      const deps = dependencies.get(constraint.id);
      if (deps) {
        for (const depId of deps.dependencies) {
          const depConstraint = constraints.find(c => c.id === depId);
          if (depConstraint) {
            visit(depConstraint);
          }
        }
      }

      visiting.delete(constraint.id);
      visited.add(constraint.id);
      sorted.push(constraint);
    };

    for (const constraint of constraints) {
      visit(constraint);
    }

    return sorted;
  }
}

class EvaluationStage implements PipelineStage {
  name = 'Evaluation';

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const { schedule, constraints, parallelEvaluator, groups } = context;

    if (parallelEvaluator && groups && groups.size > 0) {
      // Evaluate by groups
      for (const [groupName, groupConstraints] of groups) {
        const canParallelize = this.canParallelizeGroup(groupName, groupConstraints);
        
        if (canParallelize) {
          const results = await parallelEvaluator.evaluateBatch(
            groupConstraints,
            schedule
          );
          
          for (const result of results) {
            context.results.set(result.constraintId, result);
          }
        } else {
          // Sequential evaluation for dependent constraints
          for (const constraint of groupConstraints) {
            const result = await this.evaluateSingle(constraint, schedule, context);
            context.results.set(constraint.id, result);
          }
        }
      }
    } else {
      // Sequential evaluation
      for (const constraint of constraints) {
        const result = await this.evaluateSingle(constraint, schedule, context);
        context.results.set(constraint.id, result);
      }
    }

    return context;
  }

  private canParallelizeGroup(groupName: string, constraints: UnifiedConstraint[]): boolean {
    // Groups that can be parallelized
    const parallelizableGroups = ['hard_independent', 'soft', 'preferences'];
    
    if (parallelizableGroups.includes(groupName)) {
      return true;
    }

    // Check if all constraints in the group are marked as parallelizable
    return constraints.every(c => c.parallelizable !== false);
  }

  private async evaluateSingle(
    constraint: UnifiedConstraint,
    schedule: Schedule,
    context: PipelineContext
  ): Promise<ConstraintResult> {
    const startTime = Date.now();

    try {
      const result = await constraint.evaluation(schedule, constraint.parameters);
      
      return {
        ...result,
        constraintId: constraint.id,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        constraintId: constraint.id,
        status: ConstraintStatus.NOT_EVALUATED,
        satisfied: false,
        score: 0,
        message: `Evaluation failed: ${error}`,
        executionTime: Date.now() - startTime
      };
    }
  }
}

class PostProcessingStage implements PipelineStage {
  name = 'PostProcessing';

  async execute(context: PipelineContext): Promise<PipelineContext> {
    // Enhance results with additional metadata
    for (const [constraintId, result] of context.results) {
      const constraint = context.constraints.find(c => c.id === constraintId);
      
      if (constraint) {
        // Add confidence scores based on execution time and result consistency
        if (result.confidence === undefined) {
          result.confidence = this.calculateConfidence(result, constraint);
        }

        // Generate suggestions for violations
        if (result.status === ConstraintStatus.VIOLATED && !result.suggestions) {
          result.suggestions = this.generateSuggestions(result, constraint, context);
        }
      }
    }

    return context;
  }

  private calculateConfidence(
    result: ConstraintResult,
    constraint: UnifiedConstraint
  ): number {
    let confidence = 1.0;

    // Reduce confidence for slow evaluations
    if (result.executionTime && result.executionTime > 5000) {
      confidence *= 0.9;
    }

    // Reduce confidence for partial satisfaction
    if (result.status === ConstraintStatus.PARTIALLY_SATISFIED) {
      confidence *= 0.8;
    }

    // Boost confidence for hard constraints
    if (constraint.hardness === ConstraintHardness.HARD) {
      confidence = Math.min(confidence * 1.1, 1.0);
    }

    return confidence;
  }

  private generateSuggestions(
    result: ConstraintResult,
    constraint: UnifiedConstraint,
    context: PipelineContext
  ): any[] {
    // This would be enhanced with domain-specific suggestion generation
    const suggestions = [];

    if (result.violations) {
      for (const violation of result.violations) {
        if (violation.possibleResolutions) {
          suggestions.push({
            type: 'resolution',
            priority: violation.severity === 'critical' ? 'high' : 'medium',
            description: violation.possibleResolutions[0],
            implementation: `Apply resolution for ${violation.type}`
          });
        }
      }
    }

    return suggestions;
  }
}

class CacheUpdateStage implements PipelineStage {
  name = 'CacheUpdate';

  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!context.cache) {
      return context;
    }

    // Update cache with new results
    for (const [constraintId, result] of context.results) {
      const constraint = context.constraints.find(c => c.id === constraintId);
      
      if (constraint && constraint.cacheable !== false) {
        const cacheKey = this.generateCacheKey(context.schedule, constraint);
        context.cache.set(cacheKey, result);
      }
    }

    return context;
  }

  canSkip(context: PipelineContext): boolean {
    return !context.cache;
  }

  private generateCacheKey(schedule: Schedule, constraint: UnifiedConstraint): string {
    if (constraint.cacheKey) {
      return constraint.cacheKey(schedule);
    }
    
    return `${constraint.id}_${schedule.id}_${schedule.metadata?.updatedAt?.getTime() || 0}`;
  }
}