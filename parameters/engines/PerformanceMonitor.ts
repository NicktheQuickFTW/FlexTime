import { EvaluationResult, ConstraintResult } from '../types';

export interface PerformanceMetrics {
  evaluationId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  constraintMetrics: Map<string, ConstraintMetrics>;
  memoryUsage: MemoryMetrics;
  cpuUsage?: number;
  throughput?: number; // constraints per second
  errors: Error[];
}

export interface ConstraintMetrics {
  constraintId: string;
  executionTime: number;
  memoryDelta: number;
  cacheHit: boolean;
  retries: number;
  status: 'success' | 'failed' | 'timeout';
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  delta?: number;
}

export interface PerformanceStats {
  totalEvaluations: number;
  totalConstraints: number;
  averageEvaluationTime: number;
  averageConstraintTime: number;
  p50ConstraintTime: number;
  p90ConstraintTime: number;
  p99ConstraintTime: number;
  slowestConstraints: Array<{ id: string; avgTime: number; count: number }>;
  errorRate: number;
  cacheHitRate: number;
  memoryTrend: MemoryTrend;
}

export interface MemoryTrend {
  samples: Array<{ timestamp: number; usage: number }>;
  trend: 'increasing' | 'stable' | 'decreasing';
  leakProbability: number;
}

export interface PerformanceAlert {
  type: 'memory_leak' | 'slow_constraint' | 'high_error_rate' | 'cpu_spike';
  severity: 'warning' | 'critical';
  message: string;
  data: any;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private constraintStats: Map<string, ConstraintStats> = new Map();
  private memorySamples: Array<{ timestamp: number; usage: number }> = [];
  private alerts: PerformanceAlert[] = [];
  private startTime: number;
  private alertThresholds = {
    slowConstraintMs: 5000,
    memoryLeakGrowthRate: 0.1, // 10% growth per minute
    errorRateThreshold: 0.1, // 10% error rate
    cpuThreshold: 0.9 // 90% CPU usage
  };

  constructor() {
    this.startTime = Date.now();
    this.startMemoryMonitoring();
  }

  startEvaluation(evaluationId: string): void {
    const memoryBefore = process.memoryUsage();
    
    this.metrics.set(evaluationId, {
      evaluationId,
      startTime: Date.now(),
      constraintMetrics: new Map(),
      memoryUsage: {
        heapUsed: memoryBefore.heapUsed,
        heapTotal: memoryBefore.heapTotal,
        external: memoryBefore.external,
        rss: memoryBefore.rss
      },
      errors: []
    });
  }

  endEvaluation(evaluationId: string, result: EvaluationResult): void {
    const metrics = this.metrics.get(evaluationId);
    if (!metrics) return;

    const memoryAfter = process.memoryUsage();
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.throughput = result.results.length / (metrics.duration / 1000);
    
    // Calculate memory delta
    metrics.memoryUsage.delta = memoryAfter.heapUsed - metrics.memoryUsage.heapUsed;

    // Process constraint results
    for (const constraintResult of result.results) {
      this.recordConstraintMetrics(evaluationId, constraintResult);
    }

    // Check for performance issues
    this.checkPerformanceAlerts(metrics);
    
    // Update global stats
    this.updateConstraintStats(metrics);
  }

  recordConstraintMetrics(
    evaluationId: string,
    result: ConstraintResult,
    cacheHit: boolean = false
  ): void {
    const metrics = this.metrics.get(evaluationId);
    if (!metrics) return;

    const constraintMetrics: ConstraintMetrics = {
      constraintId: result.constraintId,
      executionTime: result.executionTime || 0,
      memoryDelta: 0, // Would need to measure per-constraint
      cacheHit,
      retries: 0,
      status: result.satisfied ? 'success' : 'failed'
    };

    metrics.constraintMetrics.set(result.constraintId, constraintMetrics);

    // Check for slow constraints
    if (constraintMetrics.executionTime > this.alertThresholds.slowConstraintMs) {
      this.addAlert({
        type: 'slow_constraint',
        severity: 'warning',
        message: `Constraint ${result.constraintId} took ${constraintMetrics.executionTime}ms`,
        data: { constraintId: result.constraintId, executionTime: constraintMetrics.executionTime },
        timestamp: Date.now()
      });
    }
  }

  recordError(evaluationId: string, error: Error): void {
    const metrics = this.metrics.get(evaluationId);
    if (metrics) {
      metrics.errors.push(error);
    }
  }

  private updateConstraintStats(metrics: PerformanceMetrics): void {
    for (const [constraintId, constraintMetric] of metrics.constraintMetrics) {
      if (!this.constraintStats.has(constraintId)) {
        this.constraintStats.set(constraintId, {
          totalTime: 0,
          count: 0,
          failures: 0,
          timeouts: 0,
          executionTimes: []
        });
      }

      const stats = this.constraintStats.get(constraintId)!;
      stats.totalTime += constraintMetric.executionTime;
      stats.count++;
      stats.executionTimes.push(constraintMetric.executionTime);
      
      if (constraintMetric.status === 'failed') {
        stats.failures++;
      } else if (constraintMetric.status === 'timeout') {
        stats.timeouts++;
      }

      // Keep only last 1000 samples for percentile calculations
      if (stats.executionTimes.length > 1000) {
        stats.executionTimes = stats.executionTimes.slice(-1000);
      }
    }
  }

  private startMemoryMonitoring(): void {
    // Sample memory every 10 seconds
    setInterval(() => {
      const usage = process.memoryUsage();
      this.memorySamples.push({
        timestamp: Date.now(),
        usage: usage.heapUsed
      });

      // Keep only last hour of samples
      const oneHourAgo = Date.now() - 3600000;
      this.memorySamples = this.memorySamples.filter(s => s.timestamp > oneHourAgo);

      // Check for memory leaks
      this.checkMemoryTrend();
    }, 10000);
  }

  private checkMemoryTrend(): void {
    if (this.memorySamples.length < 6) return; // Need at least 1 minute of data

    const recentSamples = this.memorySamples.slice(-6); // Last minute
    const oldSamples = this.memorySamples.slice(0, 6); // First minute

    const recentAvg = recentSamples.reduce((sum, s) => sum + s.usage, 0) / recentSamples.length;
    const oldAvg = oldSamples.reduce((sum, s) => sum + s.usage, 0) / oldSamples.length;

    const growthRate = (recentAvg - oldAvg) / oldAvg;

    if (growthRate > this.alertThresholds.memoryLeakGrowthRate) {
      this.addAlert({
        type: 'memory_leak',
        severity: 'critical',
        message: `Potential memory leak detected. Memory usage increased by ${(growthRate * 100).toFixed(1)}%`,
        data: { growthRate, recentAvg, oldAvg },
        timestamp: Date.now()
      });
    }
  }

  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    // Check error rate
    const errorRate = metrics.errors.length / metrics.constraintMetrics.size;
    if (errorRate > this.alertThresholds.errorRateThreshold) {
      this.addAlert({
        type: 'high_error_rate',
        severity: 'warning',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        data: { errorRate, errors: metrics.errors.length },
        timestamp: Date.now()
      });
    }

    // Check CPU usage (if available)
    if (metrics.cpuUsage && metrics.cpuUsage > this.alertThresholds.cpuThreshold) {
      this.addAlert({
        type: 'cpu_spike',
        severity: 'warning',
        message: `High CPU usage: ${(metrics.cpuUsage * 100).toFixed(1)}%`,
        data: { cpuUsage: metrics.cpuUsage },
        timestamp: Date.now()
      });
    }
  }

  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Could also emit events or call webhooks here
    console.warn(`Performance Alert: ${alert.message}`);
  }

  getStats(): PerformanceStats {
    const allConstraintTimes: number[] = [];
    const slowestConstraints: Array<{ id: string; avgTime: number; count: number }> = [];
    
    let totalCacheHits = 0;
    let totalConstraintEvaluations = 0;

    // Aggregate constraint statistics
    for (const [constraintId, stats] of this.constraintStats) {
      const avgTime = stats.totalTime / stats.count;
      slowestConstraints.push({ id: constraintId, avgTime, count: stats.count });
      allConstraintTimes.push(...stats.executionTimes);
    }

    // Calculate cache hit rate
    for (const metrics of this.metrics.values()) {
      for (const constraintMetric of metrics.constraintMetrics.values()) {
        totalConstraintEvaluations++;
        if (constraintMetric.cacheHit) {
          totalCacheHits++;
        }
      }
    }

    // Sort for percentile calculations
    allConstraintTimes.sort((a, b) => a - b);
    slowestConstraints.sort((a, b) => b.avgTime - a.avgTime);

    // Calculate percentiles
    const p50 = this.percentile(allConstraintTimes, 0.5);
    const p90 = this.percentile(allConstraintTimes, 0.9);
    const p99 = this.percentile(allConstraintTimes, 0.99);

    // Calculate memory trend
    const memoryTrend = this.calculateMemoryTrend();

    return {
      totalEvaluations: this.metrics.size,
      totalConstraints: totalConstraintEvaluations,
      averageEvaluationTime: this.calculateAverageEvaluationTime(),
      averageConstraintTime: allConstraintTimes.length > 0 
        ? allConstraintTimes.reduce((a, b) => a + b, 0) / allConstraintTimes.length 
        : 0,
      p50ConstraintTime: p50,
      p90ConstraintTime: p90,
      p99ConstraintTime: p99,
      slowestConstraints: slowestConstraints.slice(0, 10),
      errorRate: this.calculateErrorRate(),
      cacheHitRate: totalConstraintEvaluations > 0 
        ? totalCacheHits / totalConstraintEvaluations 
        : 0,
      memoryTrend
    };
  }

  private calculateAverageEvaluationTime(): number {
    let totalTime = 0;
    let count = 0;

    for (const metrics of this.metrics.values()) {
      if (metrics.duration) {
        totalTime += metrics.duration;
        count++;
      }
    }

    return count > 0 ? totalTime / count : 0;
  }

  private calculateErrorRate(): number {
    let totalErrors = 0;
    let totalEvaluations = 0;

    for (const metrics of this.metrics.values()) {
      totalErrors += metrics.errors.length;
      totalEvaluations++;
    }

    return totalEvaluations > 0 ? totalErrors / totalEvaluations : 0;
  }

  private calculateMemoryTrend(): MemoryTrend {
    if (this.memorySamples.length < 2) {
      return {
        samples: this.memorySamples,
        trend: 'stable',
        leakProbability: 0
      };
    }

    // Simple linear regression
    const n = this.memorySamples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    this.memorySamples.forEach((sample, i) => {
      sumX += i;
      sumY += sample.usage;
      sumXY += i * sample.usage;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgUsage = sumY / n;
    const slopePercentage = slope / avgUsage;

    let trend: 'increasing' | 'stable' | 'decreasing';
    let leakProbability = 0;

    if (slopePercentage > 0.001) {
      trend = 'increasing';
      leakProbability = Math.min(slopePercentage * 100, 1);
    } else if (slopePercentage < -0.001) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      samples: this.memorySamples.slice(-20), // Last 20 samples
      trend,
      leakProbability
    };
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    
    const index = Math.ceil(arr.length * p) - 1;
    return arr[Math.max(0, Math.min(index, arr.length - 1))];
  }

  getAlerts(since?: number): PerformanceAlert[] {
    if (since) {
      return this.alerts.filter(a => a.timestamp > since);
    }
    return [...this.alerts];
  }

  reset(): void {
    this.metrics.clear();
    this.constraintStats.clear();
    this.memorySamples = [];
    this.alerts = [];
    this.startTime = Date.now();
  }

  // Export metrics for external monitoring systems
  exportMetrics(): any {
    return {
      stats: this.getStats(),
      alerts: this.alerts,
      memorySamples: this.memorySamples,
      uptime: Date.now() - this.startTime
    };
  }
}

interface ConstraintStats {
  totalTime: number;
  count: number;
  failures: number;
  timeouts: number;
  executionTimes: number[];
}