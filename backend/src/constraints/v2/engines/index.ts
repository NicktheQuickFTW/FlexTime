// Performance-Optimized Constraint Evaluation Engine
// Export all engine components

export {
  OptimizedConstraintEngine,
  createOptimizedEngine,
  EngineConfiguration,
  EvaluationContext
} from './OptimizedConstraintEngine';

export {
  ConstraintPipeline,
  PipelineStage,
  PipelineContext,
  PipelineConfiguration
} from './ConstraintPipeline';

export {
  ConstraintCache,
  CacheEntry,
  CacheConfiguration,
  CacheStats
} from './ConstraintCache';

export {
  ParallelEvaluator,
  ParallelEvaluatorConfig,
  WorkerTask,
  WorkerResult,
  WorkerPoolStats
} from './ParallelEvaluator';

export {
  DependencyAnalyzer,
  ConstraintDependency,
  DependencyGraph,
  DependencyAnalysis
} from './DependencyAnalyzer';

export {
  PerformanceMonitor,
  PerformanceMetrics,
  PerformanceStats,
  PerformanceAlert,
  ConstraintMetrics
} from './PerformanceMonitor';

// Re-export types for convenience
export * from '../types';