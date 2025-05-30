// Conflict-related type definitions

export enum ConflictType {
  SCHEDULING = 'scheduling',          // Time/date conflicts
  RESOURCE = 'resource',              // Venue, equipment conflicts
  CONSTRAINT = 'constraint',          // Constraint violations
  PREFERENCE = 'preference',          // Preference conflicts
  REGULATION = 'regulation'           // Rule/regulation conflicts
}

export enum ConflictSeverity {
  CRITICAL = 'critical',              // Must be resolved
  HIGH = 'high',                      // Should be resolved
  MEDIUM = 'medium',                  // Nice to resolve
  LOW = 'low'                         // Minor issue
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  affectedEntities: AffectedEntity[];
  constraints: string[];              // Constraint IDs involved
  description: string;
  detectedAt: Date;
  metadata?: ConflictMetadata;
}

export interface AffectedEntity {
  type: 'team' | 'venue' | 'game' | 'official';
  id: string;
  name?: string;
  role?: string;                      // How this entity is affected
}

export interface ConflictMetadata {
  source: string;                     // What detected this conflict
  confidence: number;                 // 0-1 confidence score
  impact: ConflictImpact;
  relatedConflicts?: string[];        // Other conflict IDs
  historicalOccurrences?: number;     // How often this happens
}

export interface ConflictImpact {
  scope: 'local' | 'regional' | 'global';
  affectedGames: number;
  affectedTeams: number;
  estimatedResolutionTime?: number;   // Minutes
  financialImpact?: number;           // Estimated cost
}

export interface ConflictResolution {
  id: string;
  conflictId: string;
  type: ResolutionType;
  actions: ResolutionAction[];
  score: number;                      // Quality score 0-1
  sideEffects: SideEffect[];
  estimatedTime: number;              // Minutes to implement
  approved?: boolean;
  appliedAt?: Date;
  appliedBy?: string;
}

export enum ResolutionType {
  RESCHEDULE = 'reschedule',
  SWAP = 'swap',
  VENUE_CHANGE = 'venue_change',
  CONSTRAINT_RELAXATION = 'constraint_relaxation',
  MANUAL = 'manual',
  AUTOMATED = 'automated'
}

export interface ResolutionAction {
  type: string;
  target: AffectedEntity;
  before: any;                        // State before action
  after: any;                         // State after action
  description: string;
}

export interface SideEffect {
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  affectedEntities: AffectedEntity[];
  severity: ConflictSeverity;
}

export interface ConflictPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;                  // Occurrences per season
  conditions: PatternCondition[];
  typicalResolutions: ResolutionType[];
  preventionStrategies?: string[];
}

export interface PatternCondition {
  type: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface ConflictAnalysis {
  totalConflicts: number;
  bySeverity: Record<ConflictSeverity, number>;
  byType: Record<ConflictType, number>;
  resolutionRate: number;
  averageResolutionTime: number;
  patterns: ConflictPattern[];
  recommendations: ConflictRecommendation[];
}

export interface ConflictRecommendation {
  type: 'prevention' | 'resolution' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  description: string;
  actions: string[];
  expectedImprovement: number;        // Percentage
}

export interface ConflictGraph {
  nodes: ConflictNode[];
  edges: ConflictEdge[];
  clusters: ConflictCluster[];
}

export interface ConflictNode {
  id: string;
  conflict: Conflict;
  resolved: boolean;
  resolutions: ConflictResolution[];
}

export interface ConflictEdge {
  source: string;                     // Conflict ID
  target: string;                     // Conflict ID
  relationship: 'causes' | 'blocks' | 'related' | 'contradicts';
  strength: number;                   // 0-1
}

export interface ConflictCluster {
  id: string;
  conflicts: string[];                // Conflict IDs
  commonFactors: string[];
  resolutionStrategy?: string;
}

// Type guards
export function isCriticalConflict(conflict: Conflict): boolean {
  return conflict.severity === ConflictSeverity.CRITICAL;
}

export function isSchedulingConflict(conflict: Conflict): boolean {
  return conflict.type === ConflictType.SCHEDULING;
}

export function isResolvedConflict(
  conflict: Conflict, 
  resolutions: ConflictResolution[]
): boolean {
  return resolutions.some(r => 
    r.conflictId === conflict.id && 
    r.approved && 
    r.appliedAt
  );
}

// Conflict detection helpers
export interface ConflictDetector {
  detect(schedule: any): Promise<Conflict[]>;
  analyzeImpact(conflict: Conflict): Promise<ConflictImpact>;
}

export interface ConflictResolver {
  resolve(conflict: Conflict, strategy?: ResolutionType): Promise<ConflictResolution[]>;
  evaluateResolution(resolution: ConflictResolution): Promise<number>;
  applyResolution(resolution: ConflictResolution): Promise<void>;
}

// Conflict monitoring
export interface ConflictMonitor {
  track(conflict: Conflict): void;
  getStats(): ConflictAnalysis;
  subscribeToUpdates(callback: (conflict: Conflict) => void): void;
}