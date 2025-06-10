// Unified Constraint Definition Language (UCDL) - Type Definitions
// Version 2.0 - Complete rewrite for performance and maintainability

export enum ConstraintType {
  TEMPORAL = 'temporal',      // Time-based constraints
  SPATIAL = 'spatial',        // Location/venue-based constraints
  LOGICAL = 'logical',        // Business rule constraints
  PERFORMANCE = 'performance', // Optimization constraints
  COMPLIANCE = 'compliance'   // Regulatory constraints
}

export enum ConstraintHardness {
  HARD = 'hard',              // Must be satisfied
  SOFT = 'soft',              // Should be satisfied
  PREFERENCE = 'preference'    // Nice to have
}

export enum ConstraintStatus {
  SATISFIED = 'satisfied',
  VIOLATED = 'violated',
  PARTIALLY_SATISFIED = 'partially_satisfied',
  NOT_EVALUATED = 'not_evaluated'
}

export interface TimeFrame {
  start: Date;
  end: Date;
  recurring?: boolean;
  recurrencePattern?: string; // RRULE format
}

export interface ConstraintScope {
  sports: string[];           // Which sports this applies to
  teams?: string[];          // Specific teams (e.g., BYU)
  venues?: string[];         // Specific venues
  timeframes?: TimeFrame[];  // When this constraint applies
  conferences?: string[];    // Which conferences
  divisions?: string[];      // Which divisions
}

export interface ConstraintParameters {
  [key: string]: any;        // Flexible parameters for different constraint types
}

export interface ConstraintMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author: string;
  description: string;
  tags: string[];
  relatedConstraints?: string[]; // IDs of related constraints
  historicalPerformance?: {
    satisfactionRate: number;
    averageExecutionTime: number;
    lastEvaluated: Date;
  };
}

export interface ConstraintResult {
  constraintId: string;
  status: ConstraintStatus;
  satisfied: boolean;
  score: number;              // 0.0 to 1.0
  message: string;
  details?: any;
  violations?: ConstraintViolation[];
  suggestions?: ConstraintSuggestion[];
  executionTime?: number;     // milliseconds
  confidence?: number;        // 0.0 to 1.0
}

export interface ConstraintViolation {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  affectedEntities: string[]; // team IDs, venue IDs, etc.
  description: string;
  possibleResolutions?: string[];
}

export interface ConstraintSuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation?: string;    // Code or steps to implement
  expectedImprovement?: number; // Percentage
}

export interface ConstraintEvaluator {
  (schedule: any, parameters: ConstraintParameters): Promise<ConstraintResult> | ConstraintResult;
}

export interface UnifiedConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  hardness: ConstraintHardness;
  weight: number;             // 0-100 scale
  scope: ConstraintScope;
  parameters: ConstraintParameters;
  evaluation: ConstraintEvaluator;
  metadata: ConstraintMetadata;
  
  // Optional fields for advanced features
  dependencies?: string[];    // Other constraint IDs this depends on
  conflictsWith?: string[];   // Constraints that conflict with this
  cacheable?: boolean;        // Whether results can be cached
  cacheKey?: (schedule: any) => string; // Custom cache key generator
  parallelizable?: boolean;   // Can be evaluated in parallel
  priority?: number;          // Evaluation priority (higher = earlier)
}

export interface ConstraintGroup {
  id: string;
  name: string;
  description: string;
  constraints: UnifiedConstraint[];
  combinationLogic?: 'all' | 'any' | 'custom';
  customLogic?: (results: ConstraintResult[]) => ConstraintResult;
}

export interface EvaluationResult {
  scheduleId: string;
  evaluationId: string;
  timestamp: Date;
  overallScore: number;
  hardConstraintsSatisfied: boolean;
  softConstraintsScore: number;
  preferenceScore: number;
  results: ConstraintResult[];
  executionTime: number;
  suggestions: ConstraintSuggestion[];
  metadata?: {
    evaluationEngine: string;
    version: string;
    parallelization: boolean;
    cacheHitRate: number;
  };
}

// Type guards
export function isHardConstraint(constraint: UnifiedConstraint): boolean {
  return constraint.hardness === ConstraintHardness.HARD;
}

export function isSoftConstraint(constraint: UnifiedConstraint): boolean {
  return constraint.hardness === ConstraintHardness.SOFT;
}

export function isPreferenceConstraint(constraint: UnifiedConstraint): boolean {
  return constraint.hardness === ConstraintHardness.PREFERENCE;
}

export function isTemporalConstraint(constraint: UnifiedConstraint): boolean {
  return constraint.type === ConstraintType.TEMPORAL;
}

export function isSpatialConstraint(constraint: UnifiedConstraint): boolean {
  return constraint.type === ConstraintType.SPATIAL;
}

// Export all types
export * from './schedule-types';
export * from './conflict-types';
export * from './cache-types';
export * from './ml-types';