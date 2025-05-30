import { ConstraintViolation } from '../types';

export interface ConstraintStatus {
  constraintId: string;
  name: string;
  type: string;
  satisfied: boolean;
  violations: ConstraintViolation[];
  satisfactionPercentage: number;
  lastChecked: Date;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface MonitoringSnapshot {
  timestamp: Date;
  overallSatisfaction: number;
  totalConstraints: number;
  satisfiedConstraints: number;
  violatedConstraints: number;
  criticalViolations: number;
  constraintStatuses: ConstraintStatus[];
  performanceMetrics: {
    checkDuration: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface MonitoringOptions {
  checkInterval?: number; // milliseconds
  enableWebSocket?: boolean;
  wsPort?: number;
  enableAlerts?: boolean;
  enableMetrics?: boolean;
  violationThreshold?: number; // percentage
}