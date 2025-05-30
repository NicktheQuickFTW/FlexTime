import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { CacheManager } from './CacheManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ConflictResolver } from './ConflictResolver';
import { ConstraintRegistry } from './ConstraintRegistry';
import {
  Constraint,
  ConstraintResult,
  ConstraintContext,
  ConstraintViolation,
  ConstraintEvaluationOptions,
  ConstraintPriority,
  ConstraintType,
  BatchEvaluationResult,
  EvaluationMetrics
} from '../types';

/**
 * Main constraint evaluation engine with caching and performance optimization
 */
export class ConstraintEngine extends EventEmitter {
  private logger: Logger;
  private cacheManager: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  private conflictResolver: ConflictResolver;
  private registry: ConstraintRegistry;
  private evaluationQueue: Map<string, Promise<ConstraintResult>>;
  private batchSize: number;
  private parallelEvaluations: number;

  constructor(
    options: {
      cacheEnabled?: boolean;
      cacheTTL?: number;
      batchSize?: number;
      parallelEvaluations?: number;
      logLevel?: string;
    } = {}
  ) {
    super();
    
    // Initialize logger
    this.logger = createLogger({
      level: options.logLevel || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'constraint-engine.log' })
      ]
    });

    // Initialize components
    this.cacheManager = new CacheManager({
      enabled: options.cacheEnabled ?? true,
      ttl: options.cacheTTL ?? 3600000 // 1 hour default
    });
    
    this.performanceMonitor = new PerformanceMonitor();
    this.conflictResolver = new ConflictResolver();
    this.registry = new ConstraintRegistry();
    this.evaluationQueue = new Map();
    this.batchSize = options.batchSize || 100;
    this.parallelEvaluations = options.parallelEvaluations || 10;

    this.logger.info('ConstraintEngine initialized', { options });
  }

  /**
   * Register a constraint with the engine
   */
  public registerConstraint(constraint: Constraint): void {
    try {
      this.registry.register(constraint);
      this.logger.info('Constraint registered', { 
        id: constraint.id, 
        type: constraint.type 
      });
    } catch (error) {
      this.logger.error('Failed to register constraint', { 
        constraint, 
        error 
      });
      throw error;
    }
  }

  /**
   * Evaluate a single constraint
   */
  public async evaluateConstraint(
    constraintId: string,
    context: ConstraintContext,
    options: ConstraintEvaluationOptions = {}
  ): Promise<ConstraintResult> {
    const startTime = Date.now();
    const evaluationId = `${constraintId}-${Date.now()}-${Math.random()}`;

    try {
      // Check if evaluation is already in progress
      const queueKey = `${constraintId}-${JSON.stringify(context)}`;
      if (this.evaluationQueue.has(queueKey)) {
        this.logger.debug('Reusing in-progress evaluation', { constraintId });
        return await this.evaluationQueue.get(queueKey)!;
      }

      // Start performance monitoring
      this.performanceMonitor.startEvaluation(evaluationId, constraintId);

      // Check cache if enabled
      if (!options.skipCache) {
        const cachedResult = await this.cacheManager.get(constraintId, context);
        if (cachedResult) {
          this.logger.debug('Cache hit', { constraintId });
          this.performanceMonitor.endEvaluation(evaluationId, true);
          return cachedResult;
        }
      }

      // Get constraint from registry
      const constraint = this.registry.get(constraintId);
      if (!constraint) {
        throw new Error(`Constraint not found: ${constraintId}`);
      }

      // Create evaluation promise
      const evaluationPromise = this._performEvaluation(
        constraint,
        context,
        options
      );

      // Store in queue to prevent duplicate evaluations
      this.evaluationQueue.set(queueKey, evaluationPromise);

      // Perform evaluation
      const result = await evaluationPromise;

      // Cache result if successful
      if (!options.skipCache && result.satisfied) {
        await this.cacheManager.set(constraintId, context, result);
      }

      // Record metrics
      this.performanceMonitor.endEvaluation(evaluationId, false);
      this.performanceMonitor.recordMetrics(evaluationId, {
        constraintId,
        duration: Date.now() - startTime,
        satisfied: result.satisfied,
        violations: result.violations.length
      });

      // Emit evaluation event
      this.emit('constraintEvaluated', {
        constraintId,
        result,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      this.performanceMonitor.endEvaluation(evaluationId, false);
      this.logger.error('Constraint evaluation failed', {
        constraintId,
        context,
        error
      });
      
      return {
        constraintId,
        satisfied: false,
        violations: [{
          message: `Evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          context
        }],
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    } finally {
      // Clean up queue
      const queueKey = `${constraintId}-${JSON.stringify(context)}`;
      this.evaluationQueue.delete(queueKey);
    }
  }

  /**
   * Evaluate multiple constraints in parallel
   */
  public async evaluateMultiple(
    constraintIds: string[],
    context: ConstraintContext,
    options: ConstraintEvaluationOptions = {}
  ): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const results: ConstraintResult[] = [];
    const errors: Array<{ constraintId: string; error: Error }> = [];

    try {
      // Process in batches to limit parallelism
      for (let i = 0; i < constraintIds.length; i += this.parallelEvaluations) {
        const batch = constraintIds.slice(i, i + this.parallelEvaluations);
        const batchPromises = batch.map(id => 
          this.evaluateConstraint(id, context, options)
            .catch(error => {
              errors.push({ constraintId: id, error });
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((r): r is ConstraintResult => r !== null));
      }

      // Detect and resolve conflicts if needed
      const conflicts = this.conflictResolver.detectConflicts(results);
      let resolvedResults = results;

      if (conflicts.length > 0 && options.resolveConflicts) {
        this.logger.info('Resolving conflicts', { count: conflicts.length });
        resolvedResults = await this.conflictResolver.resolveConflicts(
          results,
          conflicts,
          context
        );
      }

      const allSatisfied = resolvedResults.every(r => r.satisfied);
      const totalViolations = resolvedResults.reduce(
        (sum, r) => sum + r.violations.length, 
        0
      );

      const batchResult: BatchEvaluationResult = {
        results: resolvedResults,
        allSatisfied,
        totalViolations,
        conflicts,
        errors,
        metrics: {
          totalConstraints: constraintIds.length,
          satisfiedCount: resolvedResults.filter(r => r.satisfied).length,
          violationCount: totalViolations,
          conflictCount: conflicts.length,
          errorCount: errors.length,
          evaluationTime: Date.now() - startTime
        }
      };

      this.emit('batchEvaluated', batchResult);
      return batchResult;
    } catch (error) {
      this.logger.error('Batch evaluation failed', { constraintIds, error });
      throw error;
    }
  }

  /**
   * Evaluate all constraints for a given type
   */
  public async evaluateByType(
    type: ConstraintType,
    context: ConstraintContext,
    options: ConstraintEvaluationOptions = {}
  ): Promise<BatchEvaluationResult> {
    const constraints = this.registry.getByType(type);
    const constraintIds = constraints.map(c => c.id);
    return this.evaluateMultiple(constraintIds, context, options);
  }

  /**
   * Evaluate constraints by priority
   */
  public async evaluateByPriority(
    priority: ConstraintPriority,
    context: ConstraintContext,
    options: ConstraintEvaluationOptions = {}
  ): Promise<BatchEvaluationResult> {
    const constraints = this.registry.getByPriority(priority);
    const constraintIds = constraints.map(c => c.id);
    return this.evaluateMultiple(constraintIds, context, options);
  }

  /**
   * Get evaluation metrics
   */
  public getMetrics(): EvaluationMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    await this.cacheManager.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * Perform the actual constraint evaluation
   */
  private async _performEvaluation(
    constraint: Constraint,
    context: ConstraintContext,
    options: ConstraintEvaluationOptions
  ): Promise<ConstraintResult> {
    try {
      // Pre-process context if needed
      const processedContext = constraint.preProcess 
        ? await constraint.preProcess(context) 
        : context;

      // Evaluate the constraint
      const violations: ConstraintViolation[] = [];
      const satisfied = await constraint.evaluate(processedContext, violations);

      // Post-process if needed
      const result: ConstraintResult = {
        constraintId: constraint.id,
        satisfied,
        violations,
        metadata: {
          evaluatedAt: new Date().toISOString(),
          constraintType: constraint.type,
          priority: constraint.priority
        }
      };

      if (constraint.postProcess) {
        await constraint.postProcess(result, processedContext);
      }

      return result;
    } catch (error) {
      throw new Error(
        `Constraint evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Shutdown the engine gracefully
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down ConstraintEngine');
    
    // Wait for pending evaluations
    const pendingEvaluations = Array.from(this.evaluationQueue.values());
    if (pendingEvaluations.length > 0) {
      this.logger.info(`Waiting for ${pendingEvaluations.length} pending evaluations`);
      await Promise.all(pendingEvaluations).catch(() => {});
    }

    // Clear cache
    await this.cacheManager.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.logger.info('ConstraintEngine shutdown complete');
  }
}