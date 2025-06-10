/**
 * Core types for the constraint engine
 */

// Re-export from parent types
export * from '../types';

// Additional core-specific types
export interface ConstraintEngineOptions {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  batchSize?: number;
  parallelEvaluations?: number;
  logLevel?: string;
  performanceMonitoring?: boolean;
  conflictResolution?: boolean;
}

export interface EngineStats {
  totalEvaluations: number;
  cacheStats: CacheStats;
  performanceMetrics: EvaluationMetrics;
  activeConstraints: number;
  registeredStrategies: number;
}

export interface EngineHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastCheck: number;
  issues: string[];
  metrics: {
    cpu: number;
    memory: number;
    activeEvaluations: number;
    queueSize: number;
  };
}