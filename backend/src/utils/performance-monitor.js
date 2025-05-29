/**
 * FlexTime Performance Monitor
 * 
 * Comprehensive performance monitoring for scheduling algorithms
 * Tracks execution times, memory usage, and optimization metrics
 */

const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
  /**
   * Create a new Performance Monitor
   * @param {string} componentName - Name of the component being monitored
   */
  constructor(componentName) {
    super();
    this.componentName = componentName;
    this.timers = new Map();
    this.metrics = new Map();
    this.startTime = Date.now();
    this.memoryBaseline = this._getMemoryUsage();
    
    // Metric collection
    this.operationCounts = new Map();
    this.errorCounts = new Map();
    this.performanceHistory = [];
  }
  
  /**
   * Start a performance timer
   * @param {string} timerName - Name of the timer
   */
  startTimer(timerName) {
    this.timers.set(timerName, {
      startTime: process.hrtime.bigint(),
      startMemory: this._getMemoryUsage()
    });
    
    this.emit('timer:start', { timerName, timestamp: Date.now() });
  }
  
  /**
   * End a performance timer
   * @param {string} timerName - Name of the timer
   * @returns {Object} Performance data
   */
  endTimer(timerName) {
    const timer = this.timers.get(timerName);
    if (!timer) {
      throw new Error(`Timer '${timerName}' not found`);
    }
    
    const endTime = process.hrtime.bigint();
    const endMemory = this._getMemoryUsage();
    
    const duration = Number(endTime - timer.startTime) / 1e6; // Convert to milliseconds
    const memoryDelta = endMemory.used - timer.startMemory.used;
    
    const result = {
      duration,
      memoryDelta,
      memoryPeak: endMemory.used,
      timestamp: Date.now()
    };
    
    this.metrics.set(timerName, result);
    this.timers.delete(timerName);
    
    this.emit('timer:end', { timerName, ...result });
    
    return result;
  }
  
  /**
   * Record an operation count
   * @param {string} operation - Operation name
   * @param {number} count - Count to add (default: 1)
   */
  recordOperation(operation, count = 1) {
    const current = this.operationCounts.get(operation) || 0;
    this.operationCounts.set(operation, current + count);
    
    this.emit('operation:recorded', { operation, count, total: current + count });
  }
  
  /**
   * Record an error
   * @param {string} errorType - Type of error
   * @param {Error} error - Error object
   */
  recordError(errorType, error) {
    const current = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, current + 1);
    
    this.emit('error:recorded', { 
      errorType, 
      error: error.message, 
      count: current + 1,
      timestamp: Date.now()
    });
  }
  
  /**
   * Record a custom metric
   * @param {string} metricName - Name of the metric
   * @param {*} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(metricName, value, metadata = {}) {
    const metric = {
      value,
      timestamp: Date.now(),
      ...metadata
    };
    
    this.metrics.set(metricName, metric);
    this.emit('metric:recorded', { metricName, ...metric });
  }
  
  /**
   * Get current performance snapshot
   * @returns {Object} Performance snapshot
   */
  getSnapshot() {
    const currentMemory = this._getMemoryUsage();
    const uptime = Date.now() - this.startTime;
    
    return {
      component: this.componentName,
      uptime,
      memory: {
        current: currentMemory,
        baseline: this.memoryBaseline,
        delta: currentMemory.used - this.memoryBaseline.used
      },
      activeTimers: Array.from(this.timers.keys()),
      operationCounts: Object.fromEntries(this.operationCounts),
      errorCounts: Object.fromEntries(this.errorCounts),
      metrics: Object.fromEntries(this.metrics)
    };
  }
  
  /**
   * Get comprehensive metrics
   * @returns {Object} All performance metrics
   */
  getMetrics() {
    const snapshot = this.getSnapshot();
    
    return {
      ...snapshot,
      summary: this._generateSummary(),
      history: this.performanceHistory.slice(-100) // Last 100 entries
    };
  }
  
  /**
   * Generate performance summary
   * @returns {Object} Performance summary
   * @private
   */
  _generateSummary() {
    const operations = Array.from(this.operationCounts.values());
    const errors = Array.from(this.errorCounts.values());
    const timers = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
    
    const totalOperations = operations.reduce((sum, count) => sum + count, 0);
    const totalErrors = errors.reduce((sum, count) => sum + count, 0);
    const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
    
    const durations = timers.map(t => t.duration);
    const avgDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    
    return {
      totalOperations,
      totalErrors,
      errorRate,
      averageDuration: avgDuration,
      maxDuration,
      minDuration,
      timerCount: timers.length
    };
  }
  
  /**
   * Start periodic performance tracking
   * @param {number} interval - Interval in milliseconds (default: 5000)
   */
  startPeriodicTracking(interval = 5000) {
    this.trackingInterval = setInterval(() => {
      const snapshot = this.getSnapshot();
      this.performanceHistory.push(snapshot);
      
      // Keep only last 1000 entries
      if (this.performanceHistory.length > 1000) {
        this.performanceHistory = this.performanceHistory.slice(-1000);
      }
      
      this.emit('periodic:snapshot', snapshot);
    }, interval);
  }
  
  /**
   * Stop periodic performance tracking
   */
  stopPeriodicTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.timers.clear();
    this.metrics.clear();
    this.operationCounts.clear();
    this.errorCounts.clear();
    this.performanceHistory = [];
    this.startTime = Date.now();
    this.memoryBaseline = this._getMemoryUsage();
    
    this.emit('monitor:reset', { timestamp: Date.now() });
  }
  
  /**
   * Export performance data
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {string} Exported data
   */
  export(format = 'json') {
    const data = this.getMetrics();
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
        
      case 'csv':
        return this._exportToCsv(data);
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Export data to CSV format
   * @param {Object} data - Performance data
   * @returns {string} CSV data
   * @private
   */
  _exportToCsv(data) {
    const lines = [];
    
    // Header
    lines.push('timestamp,metric,value,component');
    
    // Timer metrics
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.duration !== undefined) {
        lines.push(`${metric.timestamp},${name}_duration,${metric.duration},${this.componentName}`);
        lines.push(`${metric.timestamp},${name}_memory_delta,${metric.memoryDelta},${this.componentName}`);
      }
    }
    
    // Operation counts
    for (const [operation, count] of Object.entries(data.operationCounts)) {
      lines.push(`${Date.now()},operation_${operation},${count},${this.componentName}`);
    }
    
    // Error counts
    for (const [errorType, count] of Object.entries(data.errorCounts)) {
      lines.push(`${Date.now()},error_${errorType},${count},${this.componentName}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Get current memory usage
   * @returns {Object} Memory usage information
   * @private
   */
  _getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      used: usage.heapUsed,
      total: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }
  
  /**
   * Generate performance report
   * @returns {Object} Performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const summary = metrics.summary;
    
    return {
      title: `Performance Report - ${this.componentName}`,
      generatedAt: new Date().toISOString(),
      duration: metrics.uptime,
      overview: {
        component: this.componentName,
        totalOperations: summary.totalOperations,
        errorRate: `${(summary.errorRate * 100).toFixed(2)}%`,
        averageExecutionTime: `${summary.averageDuration.toFixed(2)}ms`,
        peakMemoryUsage: `${(metrics.memory.current.used / 1024 / 1024).toFixed(2)}MB`,
        memoryGrowth: `${((metrics.memory.delta / 1024 / 1024)).toFixed(2)}MB`
      },
      details: {
        timers: Object.fromEntries(
          Object.entries(metrics.metrics).filter(([_, m]) => m.duration !== undefined)
        ),
        operations: metrics.operationCounts,
        errors: metrics.errorCounts
      },
      recommendations: this._generateRecommendations(metrics)
    };
  }
  
  /**
   * Generate performance recommendations
   * @param {Object} metrics - Performance metrics
   * @returns {Array} Performance recommendations
   * @private
   */
  _generateRecommendations(metrics) {
    const recommendations = [];
    const summary = metrics.summary;
    
    // Memory usage recommendations
    const memoryUsageMB = metrics.memory.current.used / 1024 / 1024;
    if (memoryUsageMB > 512) {
      recommendations.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage detected (${memoryUsageMB.toFixed(2)}MB). Consider memory optimization.`
      });
    }
    
    // Error rate recommendations
    if (summary.errorRate > 0.05) { // > 5% error rate
      recommendations.push({
        type: 'errors',
        severity: 'critical',
        message: `High error rate detected (${(summary.errorRate * 100).toFixed(2)}%). Review error handling.`
      });
    }
    
    // Performance recommendations
    if (summary.averageDuration > 5000) { // > 5 seconds
      recommendations.push({
        type: 'performance',
        severity: 'warning',
        message: `Slow average execution time (${summary.averageDuration.toFixed(2)}ms). Consider optimization.`
      });
    }
    
    // Operation efficiency
    const operationRate = summary.totalOperations / (metrics.uptime / 1000); // operations per second
    if (operationRate < 10) {
      recommendations.push({
        type: 'throughput',
        severity: 'info',
        message: `Low operation throughput (${operationRate.toFixed(2)} ops/sec). Consider parallelization.`
      });
    }
    
    return recommendations;
  }
}

module.exports = PerformanceMonitor;