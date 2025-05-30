export interface Constraint {
  id: string;
  name: string;
  type: 'hard' | 'soft';
  category: 'scheduling' | 'resource' | 'preference' | 'regulatory';
  description: string;
  active: boolean;
  priority: number;
  conditions: ConstraintCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface ConstraintCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ConstraintConflict {
  id: string;
  constraintIds: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  evaluationScore?: number;
  conflicts: ConstraintConflict[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEvaluation {
  scheduleId: string;
  overallScore: number;
  hardConstraintsPassed: number;
  hardConstraintsTotal: number;
  softConstraintsPassed: number;
  softConstraintsTotal: number;
  conflicts: ConstraintConflict[];
  suggestions: string[];
  evaluatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'scheduler' | 'viewer';
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    conflicts: boolean;
    evaluations: boolean;
    updates: boolean;
  };
  defaultView: 'list' | 'calendar' | 'timeline';
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}