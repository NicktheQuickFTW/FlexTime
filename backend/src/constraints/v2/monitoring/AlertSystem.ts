import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  constraintId?: string;
  constraintName?: string;
  violationCount?: number;
  satisfactionPercentage?: number;
  affectedAssignments?: string[];
  metadata?: Record<string, any>;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  autoResolved: boolean;
  resolvedAt?: Date;
}

export type AlertType = 
  | 'constraint_violation'
  | 'critical_violation'
  | 'satisfaction_threshold'
  | 'performance_degradation'
  | 'system_error'
  | 'trend_warning'
  | 'multiple_violations';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownMinutes?: number;
  lastTriggered?: Date;
}

export interface AlertCondition {
  type: 'threshold' | 'trend' | 'count' | 'duration';
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number;
  windowMinutes?: number;
}

export interface AlertAction {
  type: 'emit' | 'email' | 'webhook' | 'log';
  config: Record<string, any>;
}

interface AlertSystemOptions {
  violationThreshold?: number;
  criticalViolationThreshold?: number;
  performanceThresholdMs?: number;
  memoryThresholdMB?: number;
  trendWindowSize?: number;
  cooldownMinutes?: number;
  maxActiveAlerts?: number;
}

interface MonitoringSnapshot {
  timestamp: Date;
  overallSatisfaction: number;
  totalConstraints: number;
  satisfiedConstraints: number;
  violatedConstraints: number;
  criticalViolations: number;
  constraintStatuses: any[];
  performanceMetrics: {
    checkDuration: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class AlertSystem extends EventEmitter {
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private options: Required<AlertSystemOptions>;
  private recentSnapshots: MonitoringSnapshot[] = [];
  private cooldowns: Map<string, Date> = new Map();

  constructor(options: AlertSystemOptions = {}) {
    super();
    this.options = {
      violationThreshold: options.violationThreshold || 20, // 20% violations
      criticalViolationThreshold: options.criticalViolationThreshold || 5, // 5% critical
      performanceThresholdMs: options.performanceThresholdMs || 1000, // 1 second
      memoryThresholdMB: options.memoryThresholdMB || 500, // 500MB
      trendWindowSize: options.trendWindowSize || 10,
      cooldownMinutes: options.cooldownMinutes || 5,
      maxActiveAlerts: options.maxActiveAlerts || 100
    };

    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Overall satisfaction threshold rule
    this.addRule({
      id: 'overall-satisfaction',
      name: 'Overall Satisfaction Alert',
      description: 'Triggers when overall constraint satisfaction drops below threshold',
      enabled: true,
      conditions: [{
        type: 'threshold',
        metric: 'overallSatisfaction',
        operator: 'lt',
        value: 100 - this.options.violationThreshold
      }],
      actions: [{
        type: 'emit',
        config: { severity: 'high' }
      }],
      cooldownMinutes: this.options.cooldownMinutes
    });

    // Critical violations rule
    this.addRule({
      id: 'critical-violations',
      name: 'Critical Violations Alert',
      description: 'Triggers when critical violations exceed threshold',
      enabled: true,
      conditions: [{
        type: 'threshold',
        metric: 'criticalViolationPercentage',
        operator: 'gt',
        value: this.options.criticalViolationThreshold
      }],
      actions: [{
        type: 'emit',
        config: { severity: 'critical' }
      }],
      cooldownMinutes: this.options.cooldownMinutes
    });

    // Performance degradation rule
    this.addRule({
      id: 'performance-degradation',
      name: 'Performance Degradation Alert',
      description: 'Triggers when constraint checking takes too long',
      enabled: true,
      conditions: [{
        type: 'threshold',
        metric: 'checkDuration',
        operator: 'gt',
        value: this.options.performanceThresholdMs
      }],
      actions: [{
        type: 'emit',
        config: { severity: 'medium' }
      }],
      cooldownMinutes: this.options.cooldownMinutes
    });

    // Memory usage rule
    this.addRule({
      id: 'memory-usage',
      name: 'High Memory Usage Alert',
      description: 'Triggers when memory usage exceeds threshold',
      enabled: true,
      conditions: [{
        type: 'threshold',
        metric: 'memoryUsageMB',
        operator: 'gt',
        value: this.options.memoryThresholdMB
      }],
      actions: [{
        type: 'emit',
        config: { severity: 'medium' }
      }],
      cooldownMinutes: this.options.cooldownMinutes * 2 // Longer cooldown for memory alerts
    });

    // Trend worsening rule
    this.addRule({
      id: 'trend-worsening',
      name: 'Satisfaction Trend Worsening',
      description: 'Triggers when satisfaction is consistently decreasing',
      enabled: true,
      conditions: [{
        type: 'trend',
        metric: 'overallSatisfaction',
        operator: 'lt',
        value: -5, // 5% decrease over window
        windowMinutes: 15
      }],
      actions: [{
        type: 'emit',
        config: { severity: 'medium' }
      }],
      cooldownMinutes: this.options.cooldownMinutes * 3
    });
  }

  checkSnapshot(snapshot: MonitoringSnapshot): void {
    // Store recent snapshots for trend analysis
    this.recentSnapshots.push(snapshot);
    if (this.recentSnapshots.length > this.options.trendWindowSize) {
      this.recentSnapshots.shift();
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(snapshot);

    // Check all enabled rules
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      if (this.isInCooldown(rule.id)) continue;

      const shouldTrigger = this.evaluateRule(rule, metrics);
      if (shouldTrigger) {
        this.triggerRule(rule, snapshot, metrics);
      }
    }

    // Auto-resolve alerts that are no longer valid
    this.autoResolveAlerts(snapshot, metrics);

    // Clean up old alerts
    this.cleanupAlerts();
  }

  private calculateMetrics(snapshot: MonitoringSnapshot): Record<string, number> {
    const criticalViolationPercentage = snapshot.totalConstraints > 0
      ? (snapshot.criticalViolations / snapshot.totalConstraints) * 100
      : 0;

    const memoryUsageMB = snapshot.performanceMetrics.memoryUsage / 1024 / 1024;

    // Calculate trend if we have enough history
    let satisfactionTrend = 0;
    if (this.recentSnapshots.length >= 3) {
      const oldValue = this.recentSnapshots[0].overallSatisfaction;
      const newValue = snapshot.overallSatisfaction;
      satisfactionTrend = newValue - oldValue;
    }

    return {
      overallSatisfaction: snapshot.overallSatisfaction,
      violationPercentage: 100 - snapshot.overallSatisfaction,
      criticalViolationPercentage,
      checkDuration: snapshot.performanceMetrics.checkDuration,
      memoryUsageMB,
      cpuUsage: snapshot.performanceMetrics.cpuUsage,
      satisfactionTrend,
      totalConstraints: snapshot.totalConstraints,
      violatedConstraints: snapshot.violatedConstraints,
      criticalViolations: snapshot.criticalViolations
    };
  }

  private evaluateRule(rule: AlertRule, metrics: Record<string, number>): boolean {
    return rule.conditions.every(condition => {
      const metricValue = metrics[condition.metric];
      if (metricValue === undefined) return false;

      switch (condition.operator) {
        case 'gt': return metricValue > condition.value;
        case 'gte': return metricValue >= condition.value;
        case 'lt': return metricValue < condition.value;
        case 'lte': return metricValue <= condition.value;
        case 'eq': return metricValue === condition.value;
        case 'neq': return metricValue !== condition.value;
        default: return false;
      }
    });
  }

  private triggerRule(
    rule: AlertRule,
    snapshot: MonitoringSnapshot,
    metrics: Record<string, number>
  ): void {
    // Update cooldown
    this.cooldowns.set(rule.id, new Date());
    rule.lastTriggered = new Date();

    // Execute actions
    for (const action of rule.actions) {
      switch (action.type) {
        case 'emit':
          this.createAlert({
            type: this.mapRuleToAlertType(rule.id),
            severity: action.config.severity || 'medium',
            message: this.generateAlertMessage(rule, snapshot, metrics),
            metadata: {
              ruleId: rule.id,
              ruleName: rule.name,
              metrics,
              snapshot: {
                timestamp: snapshot.timestamp,
                overallSatisfaction: snapshot.overallSatisfaction,
                violatedConstraints: snapshot.violatedConstraints,
                criticalViolations: snapshot.criticalViolations
              }
            }
          });
          break;
        case 'log':
          console.log(`Alert triggered: ${rule.name}`, metrics);
          break;
        case 'webhook':
          // Implement webhook notification
          this.sendWebhook(action.config.url, {
            rule,
            snapshot,
            metrics
          });
          break;
        case 'email':
          // Implement email notification
          this.sendEmail(action.config, {
            rule,
            snapshot,
            metrics
          });
          break;
      }
    }
  }

  private mapRuleToAlertType(ruleId: string): AlertType {
    const typeMap: Record<string, AlertType> = {
      'overall-satisfaction': 'satisfaction_threshold',
      'critical-violations': 'critical_violation',
      'performance-degradation': 'performance_degradation',
      'memory-usage': 'system_error',
      'trend-worsening': 'trend_warning'
    };
    return typeMap[ruleId] || 'constraint_violation';
  }

  private generateAlertMessage(
    rule: AlertRule,
    snapshot: MonitoringSnapshot,
    metrics: Record<string, number>
  ): string {
    const messages: Record<string, string> = {
      'overall-satisfaction': `Overall constraint satisfaction dropped to ${metrics.overallSatisfaction.toFixed(1)}% (threshold: ${100 - this.options.violationThreshold}%)`,
      'critical-violations': `Critical violations at ${metrics.criticalViolationPercentage.toFixed(1)}% of constraints (${snapshot.criticalViolations} constraints)`,
      'performance-degradation': `Constraint checking took ${metrics.checkDuration}ms (threshold: ${this.options.performanceThresholdMs}ms)`,
      'memory-usage': `Memory usage at ${metrics.memoryUsageMB.toFixed(1)}MB (threshold: ${this.options.memoryThresholdMB}MB)`,
      'trend-worsening': `Constraint satisfaction decreased by ${Math.abs(metrics.satisfactionTrend).toFixed(1)}% over the last ${this.options.trendWindowSize} checks`
    };

    return messages[rule.id] || rule.description;
  }

  private isInCooldown(ruleId: string): boolean {
    const lastTriggered = this.cooldowns.get(ruleId);
    if (!lastTriggered) return false;

    const rule = this.alertRules.get(ruleId);
    const cooldownMs = (rule?.cooldownMinutes || this.options.cooldownMinutes) * 60 * 1000;
    
    return Date.now() - lastTriggered.getTime() < cooldownMs;
  }

  private autoResolveAlerts(snapshot: MonitoringSnapshot, metrics: Record<string, number>): void {
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.acknowledged || alert.autoResolved) continue;

      // Check if the condition that triggered the alert is now resolved
      let shouldResolve = false;

      switch (alert.type) {
        case 'satisfaction_threshold':
          shouldResolve = metrics.overallSatisfaction >= 100 - this.options.violationThreshold + 5; // 5% buffer
          break;
        case 'critical_violation':
          shouldResolve = metrics.criticalViolationPercentage <= this.options.criticalViolationThreshold / 2;
          break;
        case 'performance_degradation':
          shouldResolve = metrics.checkDuration <= this.options.performanceThresholdMs * 0.8;
          break;
        case 'system_error':
          shouldResolve = metrics.memoryUsageMB <= this.options.memoryThresholdMB * 0.8;
          break;
        case 'trend_warning':
          shouldResolve = metrics.satisfactionTrend >= 0;
          break;
      }

      if (shouldResolve) {
        alert.autoResolved = true;
        alert.resolvedAt = new Date();
        this.emit('alertResolved', alert);
      }
    }
  }

  private cleanupAlerts(): void {
    // Remove resolved alerts older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.autoResolved && alert.resolvedAt && alert.resolvedAt < oneHourAgo) {
        this.activeAlerts.delete(alertId);
        this.alertHistory.push(alert);
      }
    }

    // Limit active alerts
    if (this.activeAlerts.size > this.options.maxActiveAlerts) {
      const sortedAlerts = Array.from(this.activeAlerts.entries())
        .sort((a, b) => {
          // Keep unacknowledged and critical alerts
          if (!a[1].acknowledged && b[1].acknowledged) return -1;
          if (a[1].acknowledged && !b[1].acknowledged) return 1;
          if (a[1].severity === 'critical' && b[1].severity !== 'critical') return -1;
          if (a[1].severity !== 'critical' && b[1].severity === 'critical') return 1;
          return a[1].timestamp.getTime() - b[1].timestamp.getTime();
        });

      // Remove oldest acknowledged non-critical alerts
      while (this.activeAlerts.size > this.options.maxActiveAlerts) {
        const [alertId, alert] = sortedAlerts.pop()!;
        this.activeAlerts.delete(alertId);
        this.alertHistory.push(alert);
      }
    }

    // Limit history size
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-500);
    }
  }

  // Public API

  createAlert(options: Partial<Alert>): Alert {
    const alert: Alert = {
      id: uuidv4(),
      type: options.type || 'constraint_violation',
      severity: options.severity || 'medium',
      message: options.message || 'Constraint violation detected',
      timestamp: new Date(),
      constraintId: options.constraintId,
      constraintName: options.constraintName,
      violationCount: options.violationCount,
      satisfactionPercentage: options.satisfactionPercentage,
      affectedAssignments: options.affectedAssignments,
      metadata: options.metadata,
      acknowledged: false,
      autoResolved: false
    };

    this.activeAlerts.set(alert.id, alert);
    this.emit('alert', alert);

    return alert;
  }

  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.emit('alertAcknowledged', alert);
    return true;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => {
        // Sort by severity, then by timestamp
        const severityOrder: Record<AlertSeverity, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3
        };
        
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  getAlertById(alertId: string): Alert | undefined {
    return this.activeAlerts.get(alertId) || 
           this.alertHistory.find(a => a.id === alertId);
  }

  addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  deleteRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  getRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  updateThreshold(violationThreshold: number): void {
    this.options.violationThreshold = violationThreshold;
    
    // Update the default rule
    const rule = this.alertRules.get('overall-satisfaction');
    if (rule && rule.conditions[0]) {
      rule.conditions[0].value = 100 - violationThreshold;
    }
  }

  private async sendWebhook(url: string, data: any): Promise<void> {
    try {
      // Implement webhook sending logic
      // This would typically use fetch or axios to send a POST request
      console.log(`Sending webhook to ${url}:`, data);
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }
  }

  private async sendEmail(config: any, data: any): Promise<void> {
    try {
      // Implement email sending logic
      // This would typically use a service like SendGrid or AWS SES
      console.log(`Sending email to ${config.to}:`, data);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}