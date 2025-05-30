// FlexTime Constraint System v2.0
// Complete rewrite with performance optimization, ML enhancement, and real-time monitoring

// Core Types
export * from './types';
export * from './types/schedule-types';
export * from './types/conflict-types';
export * from './types/cache-types';
export * from './types/ml-types';

// Evaluation Engine
export { OptimizedConstraintEngine } from './engines/OptimizedConstraintEngine';
export { ConstraintPipeline } from './engines/ConstraintPipeline';
export { ConstraintCache } from './engines/ConstraintCache';
export { ParallelEvaluator } from './engines/ParallelEvaluator';
export { DependencyAnalyzer } from './engines/DependencyAnalyzer';
export { PerformanceMonitor } from './engines/PerformanceMonitor';

// Conflict Resolution
export { SmartConflictResolver } from './resolvers/SmartConflictResolver';
export * from './resolvers/ResolutionStrategies';
export { ConflictAnalyzer } from './resolvers/ConflictAnalyzer';
export { ResolutionHistory } from './resolvers/ResolutionHistory';

// Sport-Specific Constraints
export { EnhancedFootballConstraints } from './sports/EnhancedFootballConstraints';
export { EnhancedBasketballConstraints } from './sports/EnhancedBasketballConstraints';
export { BaseballSoftballConstraints } from './sports/BaseballSoftballConstraints';
export { VenueSharingConstraints } from './sports/VenueSharingConstraints';
export { GlobalConstraints } from './sports/GlobalConstraints';

// ML Components
export { MLConstraintOptimizer } from './ml/MLConstraintOptimizer';
export { PredictiveValidator } from './ml/PredictiveValidator';
export { FeatureExtractor } from './ml/FeatureExtractor';
export { ConstraintLearner } from './ml/ConstraintLearner';
export { ModelManager } from './ml/ModelManager';

// Template System
export { ConstraintTemplateSystem } from './templates/ConstraintTemplateSystem';
export { StandardTemplates } from './templates/StandardTemplates';
export { TemplateBuilder } from './templates/TemplateBuilder';
export { TemplateValidator } from './templates/TemplateValidator';

// Monitoring
export { RealTimeConstraintMonitor } from './monitoring/RealTimeConstraintMonitor';
export { ConstraintDashboard } from './monitoring/ConstraintDashboard';
export { AlertSystem } from './monitoring/AlertSystem';
export { MetricsCollector } from './monitoring/MetricsCollector';

// Migration Tools
export { ConstraintMigrator } from './migration/ConstraintMigrator';
export { MigrationValidators } from './migration/MigrationValidators';
export { MigrationReport } from './migration/MigrationReport';
export { LegacyConstraintParser } from './migration/LegacyConstraintParser';

// Factory function for easy setup
export function createConstraintSystem(config?: ConstraintSystemConfig): ConstraintSystemV2 {
  const engine = new OptimizedConstraintEngine(config?.engine);
  const resolver = new SmartConflictResolver(config?.resolver);
  const monitor = new RealTimeConstraintMonitor(config?.monitor);
  const mlOptimizer = new MLConstraintOptimizer(config?.ml);
  const templateSystem = new ConstraintTemplateSystem();

  return {
    engine,
    resolver,
    monitor,
    mlOptimizer,
    templateSystem,
    
    // Convenience methods
    async evaluateSchedule(schedule: any, constraints: any[]) {
      return engine.evaluateSchedule(schedule, constraints);
    },
    
    async resolveConflicts(conflicts: any[]) {
      const results = [];
      for (const conflict of conflicts) {
        results.push(await resolver.resolveConflict(conflict));
      }
      return results;
    },
    
    startMonitoring() {
      monitor.start();
    },
    
    stopMonitoring() {
      monitor.stop();
    },
    
    async optimizeWeights(historicalData: any[], feedback: any[]) {
      return mlOptimizer.optimizeConstraintWeights(historicalData, feedback);
    }
  };
}

// Configuration interfaces
export interface ConstraintSystemConfig {
  engine?: any;
  resolver?: any;
  monitor?: any;
  ml?: any;
}

export interface ConstraintSystemV2 {
  engine: OptimizedConstraintEngine;
  resolver: SmartConflictResolver;
  monitor: RealTimeConstraintMonitor;
  mlOptimizer: MLConstraintOptimizer;
  templateSystem: ConstraintTemplateSystem;
  evaluateSchedule: (schedule: any, constraints: any[]) => Promise<any>;
  resolveConflicts: (conflicts: any[]) => Promise<any[]>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  optimizeWeights: (historicalData: any[], feedback: any[]) => Promise<any>;
}