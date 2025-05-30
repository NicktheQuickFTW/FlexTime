import { EventEmitter } from 'events';

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

interface ConstraintMetrics {
  constraintId: string;
  name: string;
  type: string;
  totalChecks: number;
  satisfiedCount: number;
  violatedCount: number;
  averageSatisfactionRate: number;
  averageViolationCount: number;
  averageCheckDuration: number;
  lastChecked: Date;
  trend: {
    hourly: number;
    daily: number;
    weekly: number;
  };
}

interface AggregateMetrics {
  period: 'minute' | 'hour' | 'day' | 'week';
  timestamp: Date;
  averageSatisfaction: number;
  minSatisfaction: number;
  maxSatisfaction: number;
  totalChecks: number;
  totalViolations: number;
  criticalViolations: number;
  averageCheckDuration: number;
  averageMemoryUsage: number;
  averageCpuUsage: number;
  constraintBreakdown: {
    [type: string]: {
      count: number;
      satisfactionRate: number;
      violationCount: number;
    };
  };
}

interface MetricsStorageOptions {
  retentionDays?: number;
  aggregationIntervals?: ('minute' | 'hour' | 'day' | 'week')[];
  maxSnapshotsInMemory?: number;
}

export class MetricsCollector extends EventEmitter {
  private snapshots: MonitoringSnapshot[] = [];
  private constraintMetrics: Map<string, ConstraintMetrics> = new Map();
  private aggregateMetrics: Map<string, AggregateMetrics[]> = new Map();
  private options: Required<MetricsStorageOptions>;
  private aggregationTimers: Map<string, NodeJS.Timer> = new Map();

  constructor(options: MetricsStorageOptions = {}) {
    super();
    this.options = {
      retentionDays: options.retentionDays || 7,
      aggregationIntervals: options.aggregationIntervals || ['minute', 'hour', 'day'],
      maxSnapshotsInMemory: options.maxSnapshotsInMemory || 1000
    };

    this.startAggregation();
  }

  recordSnapshot(snapshot: MonitoringSnapshot): void {
    // Store snapshot
    this.snapshots.push(snapshot);
    
    // Limit snapshots in memory
    if (this.snapshots.length > this.options.maxSnapshotsInMemory) {
      this.snapshots.shift();
    }

    // Update constraint-specific metrics
    this.updateConstraintMetrics(snapshot);

    // Emit event for real-time processing
    this.emit('snapshot', snapshot);
  }

  private updateConstraintMetrics(snapshot: MonitoringSnapshot): void {
    for (const status of snapshot.constraintStatuses) {
      let metrics = this.constraintMetrics.get(status.constraintId);
      
      if (!metrics) {
        metrics = {
          constraintId: status.constraintId,
          name: status.name,
          type: status.type,
          totalChecks: 0,
          satisfiedCount: 0,
          violatedCount: 0,
          averageSatisfactionRate: 0,
          averageViolationCount: 0,
          averageCheckDuration: 0,
          lastChecked: new Date(),
          trend: {
            hourly: 0,
            daily: 0,
            weekly: 0
          }
        };
        this.constraintMetrics.set(status.constraintId, metrics);
      }

      // Update metrics
      metrics.totalChecks++;
      if (status.satisfied) {
        metrics.satisfiedCount++;
      } else {
        metrics.violatedCount++;
      }

      // Update averages
      metrics.averageSatisfactionRate = 
        (metrics.satisfiedCount / metrics.totalChecks) * 100;
      metrics.averageViolationCount = 
        status.violations.length;
      metrics.lastChecked = new Date();

      // Calculate trends
      this.updateTrends(metrics);
    }
  }

  private updateTrends(metrics: ConstraintMetrics): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get historical satisfaction rates
    const recentSnapshots = this.snapshots.filter(s => 
      s.timestamp.getTime() > oneHourAgo
    );

    if (recentSnapshots.length > 0) {
      const hourlyRates = recentSnapshots
        .map(s => s.constraintStatuses.find(cs => cs.constraintId === metrics.constraintId))
        .filter(cs => cs)
        .map(cs => cs!.satisfactionPercentage);

      if (hourlyRates.length > 1) {
        metrics.trend.hourly = hourlyRates[hourlyRates.length - 1] - hourlyRates[0];
      }
    }

    // Similar calculations for daily and weekly trends would go here
    // For brevity, we'll just set them to 0
    metrics.trend.daily = 0;
    metrics.trend.weekly = 0;
  }

  private startAggregation(): void {
    for (const interval of this.options.aggregationIntervals) {
      const timer = setInterval(() => {
        this.aggregate(interval);
      }, this.getIntervalMs(interval));

      this.aggregationTimers.set(interval, timer);
    }
  }

  private getIntervalMs(interval: string): number {
    switch (interval) {
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }

  private aggregate(period: 'minute' | 'hour' | 'day' | 'week'): void {
    const now = Date.now();
    const intervalMs = this.getIntervalMs(period);
    const startTime = now - intervalMs;

    // Filter snapshots for this period
    const periodSnapshots = this.snapshots.filter(s => 
      s.timestamp.getTime() >= startTime
    );

    if (periodSnapshots.length === 0) return;

    // Calculate aggregate metrics
    const aggregateMetric: AggregateMetrics = {
      period,
      timestamp: new Date(),
      averageSatisfaction: 0,
      minSatisfaction: 100,
      maxSatisfaction: 0,
      totalChecks: periodSnapshots.length,
      totalViolations: 0,
      criticalViolations: 0,
      averageCheckDuration: 0,
      averageMemoryUsage: 0,
      averageCpuUsage: 0,
      constraintBreakdown: {}
    };

    // Calculate aggregates
    let totalSatisfaction = 0;
    let totalCheckDuration = 0;
    let totalMemoryUsage = 0;
    let totalCpuUsage = 0;

    const constraintTypeStats: Map<string, {
      count: number;
      totalSatisfaction: number;
      totalViolations: number;
    }> = new Map();

    for (const snapshot of periodSnapshots) {
      totalSatisfaction += snapshot.overallSatisfaction;
      aggregateMetric.minSatisfaction = Math.min(
        aggregateMetric.minSatisfaction,
        snapshot.overallSatisfaction
      );
      aggregateMetric.maxSatisfaction = Math.max(
        aggregateMetric.maxSatisfaction,
        snapshot.overallSatisfaction
      );
      aggregateMetric.totalViolations += snapshot.violatedConstraints;
      aggregateMetric.criticalViolations += snapshot.criticalViolations;
      totalCheckDuration += snapshot.performanceMetrics.checkDuration;
      totalMemoryUsage += snapshot.performanceMetrics.memoryUsage;
      totalCpuUsage += snapshot.performanceMetrics.cpuUsage;

      // Aggregate by constraint type
      for (const status of snapshot.constraintStatuses) {
        let typeStats = constraintTypeStats.get(status.type);
        if (!typeStats) {
          typeStats = { count: 0, totalSatisfaction: 0, totalViolations: 0 };
          constraintTypeStats.set(status.type, typeStats);
        }
        typeStats.count++;
        typeStats.totalSatisfaction += status.satisfactionPercentage;
        if (!status.satisfied) {
          typeStats.totalViolations++;
        }
      }
    }

    // Calculate averages
    aggregateMetric.averageSatisfaction = totalSatisfaction / periodSnapshots.length;
    aggregateMetric.averageCheckDuration = totalCheckDuration / periodSnapshots.length;
    aggregateMetric.averageMemoryUsage = totalMemoryUsage / periodSnapshots.length;
    aggregateMetric.averageCpuUsage = totalCpuUsage / periodSnapshots.length;

    // Build constraint breakdown
    for (const [type, stats] of constraintTypeStats) {
      aggregateMetric.constraintBreakdown[type] = {
        count: stats.count,
        satisfactionRate: stats.totalSatisfaction / stats.count,
        violationCount: stats.totalViolations
      };
    }

    // Store aggregate metrics
    let periodMetrics = this.aggregateMetrics.get(period);
    if (!periodMetrics) {
      periodMetrics = [];
      this.aggregateMetrics.set(period, periodMetrics);
    }
    periodMetrics.push(aggregateMetric);

    // Clean up old aggregates
    this.cleanupOldAggregates(period, periodMetrics);

    // Emit event
    this.emit('aggregate', aggregateMetric);
  }

  private cleanupOldAggregates(
    period: string,
    metrics: AggregateMetrics[]
  ): void {
    const retentionMs = this.options.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    // Remove old metrics
    const filtered = metrics.filter(m => 
      m.timestamp.getTime() > cutoffTime
    );

    // Update the stored array
    if (filtered.length < metrics.length) {
      this.aggregateMetrics.set(period, filtered);
    }
  }

  // Public API

  getMetrics(): {
    snapshots: MonitoringSnapshot[];
    constraintMetrics: ConstraintMetrics[];
    aggregateMetrics: { [period: string]: AggregateMetrics[] };
  } {
    return {
      snapshots: this.snapshots,
      constraintMetrics: Array.from(this.constraintMetrics.values()),
      aggregateMetrics: Object.fromEntries(this.aggregateMetrics)
    };
  }

  getConstraintMetrics(constraintId: string): ConstraintMetrics | undefined {
    return this.constraintMetrics.get(constraintId);
  }

  getAggregateMetrics(
    period: 'minute' | 'hour' | 'day' | 'week',
    limit?: number
  ): AggregateMetrics[] {
    const metrics = this.aggregateMetrics.get(period) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  getRecentSnapshots(count: number = 10): MonitoringSnapshot[] {
    return this.snapshots.slice(-count);
  }

  getSatisfactionHistory(
    constraintId?: string,
    duration: number = 60 * 60 * 1000 // 1 hour default
  ): { timestamp: Date; satisfaction: number }[] {
    const cutoffTime = Date.now() - duration;
    const relevantSnapshots = this.snapshots.filter(s => 
      s.timestamp.getTime() > cutoffTime
    );

    if (constraintId) {
      return relevantSnapshots.map(s => {
        const status = s.constraintStatuses.find(cs => 
          cs.constraintId === constraintId
        );
        return {
          timestamp: s.timestamp,
          satisfaction: status?.satisfactionPercentage || 0
        };
      });
    } else {
      return relevantSnapshots.map(s => ({
        timestamp: s.timestamp,
        satisfaction: s.overallSatisfaction
      }));
    }
  }

  getPerformanceMetrics(
    duration: number = 60 * 60 * 1000 // 1 hour default
  ): {
    timestamp: Date;
    checkDuration: number;
    memoryUsage: number;
    cpuUsage: number;
  }[] {
    const cutoffTime = Date.now() - duration;
    return this.snapshots
      .filter(s => s.timestamp.getTime() > cutoffTime)
      .map(s => ({
        timestamp: s.timestamp,
        checkDuration: s.performanceMetrics.checkDuration,
        memoryUsage: s.performanceMetrics.memoryUsage,
        cpuUsage: s.performanceMetrics.cpuUsage
      }));
  }

  getViolationTrends(
    period: 'hour' | 'day' | 'week' = 'hour'
  ): {
    constraintId: string;
    name: string;
    trend: number;
    currentViolationRate: number;
  }[] {
    const trends: {
      constraintId: string;
      name: string;
      trend: number;
      currentViolationRate: number;
    }[] = [];

    for (const [constraintId, metrics] of this.constraintMetrics) {
      let trendValue = 0;
      switch (period) {
        case 'hour':
          trendValue = metrics.trend.hourly;
          break;
        case 'day':
          trendValue = metrics.trend.daily;
          break;
        case 'week':
          trendValue = metrics.trend.weekly;
          break;
      }

      trends.push({
        constraintId,
        name: metrics.name,
        trend: trendValue,
        currentViolationRate: 100 - metrics.averageSatisfactionRate
      });
    }

    // Sort by absolute trend value (most significant changes first)
    return trends.sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend));
  }

  getConstraintTypeAnalysis(): {
    type: string;
    totalConstraints: number;
    averageSatisfaction: number;
    violationCount: number;
    criticalPercentage: number;
  }[] {
    const typeAnalysis = new Map<string, {
      count: number;
      totalSatisfaction: number;
      violations: number;
      critical: number;
    }>();

    // Analyze recent snapshots
    const recentSnapshots = this.snapshots.slice(-100); // Last 100 snapshots
    
    for (const snapshot of recentSnapshots) {
      for (const status of snapshot.constraintStatuses) {
        let analysis = typeAnalysis.get(status.type);
        if (!analysis) {
          analysis = { count: 0, totalSatisfaction: 0, violations: 0, critical: 0 };
          typeAnalysis.set(status.type, analysis);
        }

        analysis.count++;
        analysis.totalSatisfaction += status.satisfactionPercentage;
        if (!status.satisfied) {
          analysis.violations++;
          const criticalCount = status.violations.filter(v => 
            v.severity === 'critical'
          ).length;
          if (criticalCount > 0) {
            analysis.critical++;
          }
        }
      }
    }

    // Convert to result format
    const results: {
      type: string;
      totalConstraints: number;
      averageSatisfaction: number;
      violationCount: number;
      criticalPercentage: number;
    }[] = [];

    for (const [type, analysis] of typeAnalysis) {
      results.push({
        type,
        totalConstraints: analysis.count,
        averageSatisfaction: analysis.totalSatisfaction / analysis.count,
        violationCount: analysis.violations,
        criticalPercentage: (analysis.critical / analysis.count) * 100
      });
    }

    // Sort by violation count
    return results.sort((a, b) => b.violationCount - a.violationCount);
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = this.getMetrics();

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV export implementation
      let csv = 'Timestamp,Overall Satisfaction,Total Constraints,Satisfied,Violated,Critical,Check Duration,Memory Usage,CPU Usage\n';
      
      for (const snapshot of data.snapshots) {
        csv += `${snapshot.timestamp.toISOString()},${snapshot.overallSatisfaction},${snapshot.totalConstraints},${snapshot.satisfiedConstraints},${snapshot.violatedConstraints},${snapshot.criticalViolations},${snapshot.performanceMetrics.checkDuration},${snapshot.performanceMetrics.memoryUsage},${snapshot.performanceMetrics.cpuUsage}\n`;
      }

      return csv;
    }
  }

  reset(): void {
    this.snapshots = [];
    this.constraintMetrics.clear();
    this.aggregateMetrics.clear();
    this.emit('reset');
  }

  stop(): void {
    // Clear all aggregation timers
    for (const timer of this.aggregationTimers.values()) {
      clearInterval(timer);
    }
    this.aggregationTimers.clear();
    this.emit('stopped');
  }
}