// Conflict Resolution System - Main exports
// Smart conflict detection and resolution for schedule optimization

export { SmartConflictResolver, ResolverConfig } from './SmartConflictResolver';
export { ResolutionStrategies } from './ResolutionStrategies';
export { ConflictAnalyzer } from './ConflictAnalyzer';
export { 
  ResolutionHistory, 
  HistoryStats, 
  StrategyPerformance, 
  ConflictTypeStats,
  LearningInsight 
} from './ResolutionHistory';

// Re-export conflict types for convenience
export {
  Conflict,
  ConflictType,
  ConflictAnalysis,
  ConflictPattern,
  Resolution,
  ResolutionStrategy,
  ResolutionModification,
  ResolutionImpact,
  ResolutionMetadata,
  ResolutionFeedback,
  RiskAssessment
} from '../types/conflict-types';