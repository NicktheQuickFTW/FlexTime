import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import {
  EvaluationMetrics,
  PerformanceMetrics,
  PerformanceAlert,
  PerformanceThreshold,
  MetricType,
  TimeSeriesData
} from '../types';

/**
 * Track evaluation performance and generate alerts
 */
export class PerformanceMonitor extends EventEmitter {
  private logger: Logger;
  private activeEvaluations: Map<string, {
    constraintId: string;
    startTime: number;
    metadata?: any;
  }>;
  private metrics: Map<string, PerformanceMetrics>;
  private aggregatedMetrics: EvaluationMetrics;
  private thresholds: Map<MetricType, PerformanceThreshold>;
  private alerts: PerformanceAlert[];
  private metricsHistory: TimeSeriesData[];
  private historyRetentionMs: number;
  private samplingInterval: number;
  private isMonitoring: boolean;
  private monitoringTimer?: NodeJS.Timer;

  constructor(options: {
    historyRetentionMs?: number;
    samplingInterval?: number;
    logLevel?: string;
  } = {}) {
    super();

    this.logger = createLogger({
      level: options.logLevel || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'performance-monitor.log' })
      ]
    });

    this.activeEvaluations = new Map();
    this.metrics = new Map();
    this.alerts = [];
    this.metricsHistory = [];
    this.thresholds = new Map();
    this.historyRetentionMs = options.historyRetentionMs || 3600000; // 1 hour
    this.samplingInterval = options.samplingInterval || 5000; // 5 seconds
    this.isMonitoring = false;

    // Initialize aggregated metrics
    this.aggregatedMetrics = this._createEmptyAggregatedMetrics();

    // Set default thresholds
    this._initializeDefaultThresholds();

    this.logger.info('PerformanceMonitor initialized', { options });
  }

  /**
   * Start monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this._collectMetrics();
      this._checkThresholds();
      this._cleanupHistory();
    }, this.samplingInterval);

    this.logger.info('Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    this.logger.info('Performance monitoring stopped');
  }

  /**
   * Start tracking an evaluation
   */
  public startEvaluation(evaluationId: string, constraintId: string, metadata?: any): void {
    this.activeEvaluations.set(evaluationId, {
      constraintId,
      startTime: Date.now(),
      metadata
    });
  }

  /**
   * End tracking an evaluation
   */
  public endEvaluation(evaluationId: string, wasCached: boolean = false): void {
    const evaluation = this.activeEvaluations.get(evaluationId);
    if (!evaluation) {
      this.logger.warn('Evaluation not found', { evaluationId });
      return;
    }

    const duration = Date.now() - evaluation.startTime;
    this.activeEvaluations.delete(evaluationId);

    // Update constraint-specific metrics
    const metrics = this._getOrCreateMetrics(evaluation.constraintId);
    metrics.evaluationCount++;
    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.evaluationCount;
    metrics.lastEvaluationTime = Date.now();

    if (wasCached) {
      metrics.cacheHitCount++;
    }

    if (duration < metrics.minDuration) {
      metrics.minDuration = duration;
    }
    if (duration > metrics.maxDuration) {
      metrics.maxDuration = duration;
    }

    // Update aggregated metrics
    this._updateAggregatedMetrics(duration, wasCached);
  }

  /**
   * Record additional metrics for an evaluation
   */
  public recordMetrics(evaluationId: string, additionalMetrics: {
    constraintId: string;
    duration: number;
    satisfied: boolean;
    violations: number;
    metadata?: any;
  }): void {
    const metrics = this._getOrCreateMetrics(additionalMetrics.constraintId);
    
    if (additionalMetrics.satisfied) {
      metrics.satisfiedCount++;
    } else {
      metrics.violationCount += additionalMetrics.violations;
    }

    // Store custom metrics
    if (additionalMetrics.metadata) {
      metrics.customMetrics = {
        ...metrics.customMetrics,
        ...additionalMetrics.metadata
      };
    }
  }

  /**
   * Get metrics for all constraints
   */
  public getMetrics(): EvaluationMetrics {
    return { ...this.aggregatedMetrics };
  }

  /**
   * Get metrics for a specific constraint
   */
  public getConstraintMetrics(constraintId: string): PerformanceMetrics | undefined {
    return this.metrics.get(constraintId);
  }

  /**
   * Get all constraint metrics
   */
  public getAllConstraintMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Set performance threshold
   */
  public setThreshold(metricType: MetricType, threshold: PerformanceThreshold): void {
    this.thresholds.set(metricType, threshold);
    this.logger.info('Performance threshold set', { metricType, threshold });
  }

  /**
   * Get current alerts
   */
  public getAlerts(since?: number): PerformanceAlert[] {
    if (since) {
      return this.alerts.filter(alert => alert.timestamp >= since);
    }
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
    this.logger.info('Performance alerts cleared');
  }

  /**
   * Get metrics history
   */
  public getHistory(metricType?: MetricType, duration?: number): TimeSeriesData[] {
    const since = duration ? Date.now() - duration : 0;
    
    return this.metricsHistory.filter(data => {
      const timeMatch = data.timestamp >= since;
      const typeMatch = !metricType || data.metricType === metricType;
      return timeMatch && typeMatch;
    });
  }

  /**
   * Export metrics as JSON
   */
  public exportMetrics(): {
    aggregated: EvaluationMetrics;
    byConstraint: Record<string, PerformanceMetrics>;
    alerts: PerformanceAlert[];
    history: TimeSeriesData[];
  } {
    const byConstraint: Record<string, PerformanceMetrics> = {};
    for (const [id, metrics] of this.metrics) {
      byConstraint[id] = { ...metrics };
    }

    return {
      aggregated: this.getMetrics(),
      byConstraint,
      alerts: this.getAlerts(),
      history: this.getHistory()
    };
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.activeEvaluations.clear();
    this.metrics.clear();
    this.alerts = [];
    this.metricsHistory = [];
    this.aggregatedMetrics = this._createEmptyAggregatedMetrics();
    this.logger.info('Performance metrics reset');
  }

  /**
   * Get active evaluation count
   */
  public getActiveEvaluationCount(): number {
    return this.activeEvaluations.size;
  }

  /**
   * Get slow evaluations
   */
  public getSlowEvaluations(thresholdMs: number = 1000): Array<{
    constraintId: string;
    averageDuration: number;
    maxDuration: number;
    evaluationCount: number;
  }> {
    const slowEvaluations: Array<{
      constraintId: string;
      averageDuration: number;
      maxDuration: number;
      evaluationCount: number;
    }> = [];

    for (const [constraintId, metrics] of this.metrics) {
      if (metrics.averageDuration > thresholdMs || metrics.maxDuration > thresholdMs) {
        slowEvaluations.push({
          constraintId,
          averageDuration: metrics.averageDuration,
          maxDuration: metrics.maxDuration,
          evaluationCount: metrics.evaluationCount
        });
      }
    }

    return slowEvaluations.sort((a, b) => b.maxDuration - a.maxDuration);
  }

  /**
   * Initialize default thresholds
   */
  private _initializeDefaultThresholds(): void {
    this.thresholds.set('evaluationTime', {
      warning: 500,
      critical: 2000,
      metric: 'evaluationTime'
    });

    this.thresholds.set('memoryUsage', {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 500 * 1024 * 1024, // 500MB
      metric: 'memoryUsage'
    });

    this.thresholds.set('cacheHitRate', {
      warning: 0.3, // 30%
      critical: 0.1, // 10%
      metric: 'cacheHitRate',
      inverse: true // Lower is worse
    });

    this.thresholds.set('errorRate', {
      warning: 0.05, // 5%
      critical: 0.1, // 10%
      metric: 'errorRate'
    });
  }

  /**
   * Get or create metrics for a constraint
   */
  private _getOrCreateMetrics(constraintId: string): PerformanceMetrics {
    let metrics = this.metrics.get(constraintId);
    if (!metrics) {
      metrics = {
        constraintId,
        evaluationCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        cacheHitCount: 0,
        satisfiedCount: 0,
        violationCount: 0,
        lastEvaluationTime: Date.now(),
        customMetrics: {}
      };
      this.metrics.set(constraintId, metrics);
    }
    return metrics;
  }

  /**
   * Create empty aggregated metrics
   */
  private _createEmptyAggregatedMetrics(): EvaluationMetrics {
    return {
      totalEvaluations: 0,
      totalDuration: 0,
      averageDuration: 0,
      cacheHitRate: 0,
      totalCacheHits: 0,
      totalViolations: 0,
      satisfactionRate: 0,
      activeEvaluations: 0,
      peakActiveEvaluations: 0,
      totalErrors: 0,
      errorRate: 0,
      lastUpdateTime: Date.now(),
      uptime: 0,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  /**
   * Update aggregated metrics
   */
  private _updateAggregatedMetrics(duration: number, wasCached: boolean): void {
    this.aggregatedMetrics.totalEvaluations++;
    this.aggregatedMetrics.totalDuration += duration;
    this.aggregatedMetrics.averageDuration = 
      this.aggregatedMetrics.totalDuration / this.aggregatedMetrics.totalEvaluations;

    if (wasCached) {
      this.aggregatedMetrics.totalCacheHits++;
    }

    this.aggregatedMetrics.cacheHitRate = 
      this.aggregatedMetrics.totalCacheHits / this.aggregatedMetrics.totalEvaluations;

    this.aggregatedMetrics.activeEvaluations = this.activeEvaluations.size;
    if (this.aggregatedMetrics.activeEvaluations > this.aggregatedMetrics.peakActiveEvaluations) {
      this.aggregatedMetrics.peakActiveEvaluations = this.aggregatedMetrics.activeEvaluations;
    }

    this.aggregatedMetrics.lastUpdateTime = Date.now();
  }

  /**
   * Collect current metrics
   */
  private _collectMetrics(): void {
    const now = Date.now();
    
    // Collect evaluation time metrics
    const avgDuration = this.aggregatedMetrics.averageDuration;
    if (avgDuration > 0) {
      this.metricsHistory.push({
        timestamp: now,
        metricType: 'evaluationTime',
        value: avgDuration,
        constraintId: 'aggregate'
      });
    }

    // Collect memory usage
    const memUsage = process.memoryUsage().heapUsed;
    this.aggregatedMetrics.memoryUsage = memUsage;
    this.metricsHistory.push({
      timestamp: now,
      metricType: 'memoryUsage',
      value: memUsage,
      constraintId: 'system'
    });

    // Collect cache hit rate
    this.metricsHistory.push({
      timestamp: now,
      metricType: 'cacheHitRate',
      value: this.aggregatedMetrics.cacheHitRate,
      constraintId: 'aggregate'
    });

    // Collect error rate
    const errorRate = this.aggregatedMetrics.totalErrors / 
      Math.max(1, this.aggregatedMetrics.totalEvaluations);
    this.aggregatedMetrics.errorRate = errorRate;
    this.metricsHistory.push({
      timestamp: now,
      metricType: 'errorRate',
      value: errorRate,
      constraintId: 'aggregate'
    });

    // Update uptime
    this.aggregatedMetrics.uptime = now - (this.aggregatedMetrics.lastUpdateTime || now);
  }

  /**
   * Check thresholds and generate alerts
   */
  private _checkThresholds(): void {
    const now = Date.now();

    for (const [metricType, threshold] of this.thresholds) {
      let currentValue: number | undefined;

      switch (metricType) {
        case 'evaluationTime':
          currentValue = this.aggregatedMetrics.averageDuration;
          break;
        case 'memoryUsage':
          currentValue = this.aggregatedMetrics.memoryUsage;
          break;
        case 'cacheHitRate':
          currentValue = this.aggregatedMetrics.cacheHitRate;
          break;
        case 'errorRate':
          currentValue = this.aggregatedMetrics.errorRate;
          break;
      }

      if (currentValue === undefined) continue;

      const isViolation = threshold.inverse
        ? currentValue < threshold.critical
        : currentValue > threshold.critical;

      const isWarning = threshold.inverse
        ? currentValue < threshold.warning
        : currentValue > threshold.warning;

      if (isViolation) {
        const alert: PerformanceAlert = {
          id: `alert-${now}-${metricType}`,
          timestamp: now,
          severity: 'critical',
          metricType,
          threshold: threshold.critical,
          actualValue: currentValue,
          message: `${metricType} threshold exceeded: ${currentValue} (threshold: ${threshold.critical})`
        };
        this.alerts.push(alert);
        this.emit('alert', alert);
        this.logger.error('Performance alert', alert);
      } else if (isWarning) {
        const alert: PerformanceAlert = {
          id: `alert-${now}-${metricType}`,
          timestamp: now,
          severity: 'warning',
          metricType,
          threshold: threshold.warning,
          actualValue: currentValue,
          message: `${metricType} warning: ${currentValue} (threshold: ${threshold.warning})`
        };
        this.alerts.push(alert);
        this.emit('alert', alert);
        this.logger.warn('Performance warning', alert);
      }
    }
  }

  /**
   * Clean up old history data
   */
  private _cleanupHistory(): void {
    const cutoff = Date.now() - this.historyRetentionMs;
    this.metricsHistory = this.metricsHistory.filter(data => data.timestamp >= cutoff);
    
    // Also clean up old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Shutdown the monitor
   */
  public shutdown(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.logger.info('PerformanceMonitor shutdown complete');
  }
}