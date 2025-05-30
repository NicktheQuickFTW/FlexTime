/**
 * Real-time Performance Monitor for Constraint System
 * Tracks metrics, detects bottlenecks, and provides optimization insights
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class PerformanceMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.enabled = options.enabled !== false;
        this.metricsRetentionMs = options.metricsRetentionMs || 24 * 60 * 60 * 1000; // 24 hours
        this.alertThresholds = {
            constraintEvaluationMs: options.constraintThresholdMs || 100,
            memoryUsageMB: options.memoryThresholdMB || 500,
            cacheHitRate: options.cacheHitThreshold || 0.7,
            cpuUsagePercent: options.cpuThreshold || 80,
            ...options.alertThresholds
        };
        
        this.metrics = {
            constraintEvaluations: new Map(),
            memoryUsage: [],
            cacheMetrics: new Map(),
            cpuMetrics: [],
            bottlenecks: [],
            regressions: []
        };
        
        this.timers = new Map();
        this.counters = new Map();
        this.benchmarks = new Map();
        
        // Initialize baseline metrics
        this.baseline = null;
        this.isRecordingBaseline = false;
        
        // Start background monitoring
        if (this.enabled) {
            this.startSystemMonitoring();
        }
    }

    /**
     * Start timing a constraint evaluation
     */
    startTiming(operationId, metadata = {}) {
        if (!this.enabled) return;
        
        const startTime = performance.now();
        const memBefore = process.memoryUsage();
        
        this.timers.set(operationId, {
            startTime,
            memBefore,
            metadata: {
                type: 'constraint_evaluation',
                ...metadata
            }
        });
        
        this.incrementCounter('operations_started');
    }

    /**
     * End timing and record metrics
     */
    endTiming(operationId, result = {}) {
        if (!this.enabled || !this.timers.has(operationId)) return;
        
        const timer = this.timers.get(operationId);
        const endTime = performance.now();
        const memAfter = process.memoryUsage();
        
        const duration = endTime - timer.startTime;
        const memoryDelta = memAfter.heapUsed - timer.memBefore.heapUsed;
        
        const metric = {
            operationId,
            duration,
            memoryDelta,
            timestamp: Date.now(),
            metadata: timer.metadata,
            result: {
                success: result.success !== false,
                constraintsEvaluated: result.constraintsEvaluated || 0,
                violationsFound: result.violationsFound || 0,
                cacheHits: result.cacheHits || 0,
                cacheMisses: result.cacheMisses || 0,
                ...result
            }
        };
        
        this.recordMetric(metric);
        this.timers.delete(operationId);
        
        // Check for performance issues
        this.checkPerformanceThresholds(metric);
        
        this.incrementCounter('operations_completed');
        
        return metric;
    }

    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        const key = `${metric.metadata.type}_${metric.metadata.sport || 'general'}`;
        
        if (!this.metrics.constraintEvaluations.has(key)) {
            this.metrics.constraintEvaluations.set(key, []);
        }
        
        this.metrics.constraintEvaluations.get(key).push(metric);
        
        // Clean up old metrics
        this.cleanupOldMetrics();
        
        // Update real-time statistics
        this.updateRealtimeStats(metric);
        
        // Emit metric event for real-time monitoring
        this.emit('metric', metric);
    }

    /**
     * Record cache performance
     */
    recordCacheMetric(operation, hit, key, metadata = {}) {
        if (!this.enabled) return;
        
        const cacheKey = `${operation}_${metadata.type || 'general'}`;
        
        if (!this.metrics.cacheMetrics.has(cacheKey)) {
            this.metrics.cacheMetrics.set(cacheKey, {
                hits: 0,
                misses: 0,
                lastUpdated: Date.now()
            });
        }
        
        const cache = this.metrics.cacheMetrics.get(cacheKey);
        if (hit) {
            cache.hits++;
        } else {
            cache.misses++;
        }
        cache.lastUpdated = Date.now();
        
        // Check cache hit rate
        const hitRate = cache.hits / (cache.hits + cache.misses);
        if (hitRate < this.alertThresholds.cacheHitRate) {
            this.reportBottleneck('low_cache_hit_rate', {
                operation,
                hitRate,
                totalOperations: cache.hits + cache.misses,
                metadata
            });
        }
    }

    /**
     * Start system-level monitoring
     */
    startSystemMonitoring() {
        // Memory monitoring
        this.memoryInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            const memMetric = {
                timestamp: Date.now(),
                heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
                heapTotal: memUsage.heapTotal / 1024 / 1024,
                external: memUsage.external / 1024 / 1024,
                rss: memUsage.rss / 1024 / 1024
            };
            
            this.metrics.memoryUsage.push(memMetric);
            
            // Check memory threshold
            if (memMetric.heapUsed > this.alertThresholds.memoryUsageMB) {
                this.reportBottleneck('high_memory_usage', memMetric);
            }
            
            // Keep only recent memory metrics
            const cutoff = Date.now() - this.metricsRetentionMs;
            this.metrics.memoryUsage = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
            
        }, 5000); // Every 5 seconds
        
        // CPU monitoring (approximation using event loop lag)
        this.cpuInterval = setInterval(() => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
                
                const cpuMetric = {
                    timestamp: Date.now(),
                    eventLoopLag: lag,
                    cpuUsage: process.cpuUsage()
                };
                
                this.metrics.cpuMetrics.push(cpuMetric);
                
                // Approximate CPU usage percentage
                const cpuPercent = Math.min(100, lag / 10); // Rough approximation
                if (cpuPercent > this.alertThresholds.cpuUsagePercent) {
                    this.reportBottleneck('high_cpu_usage', cpuMetric);
                }
                
                // Keep only recent CPU metrics
                const cutoff = Date.now() - this.metricsRetentionMs;
                this.metrics.cpuMetrics = this.metrics.cpuMetrics.filter(m => m.timestamp > cutoff);
            });
        }, 10000); // Every 10 seconds
    }

    /**
     * Report a performance bottleneck
     */
    reportBottleneck(type, data) {
        const bottleneck = {
            type,
            timestamp: Date.now(),
            data,
            severity: this.calculateSeverity(type, data)
        };
        
        this.metrics.bottlenecks.push(bottleneck);
        this.emit('bottleneck', bottleneck);
        
        // Auto-generate optimization recommendation
        const recommendation = this.generateOptimizationRecommendation(bottleneck);
        if (recommendation) {
            this.emit('optimization_recommendation', recommendation);
        }
    }

    /**
     * Calculate bottleneck severity
     */
    calculateSeverity(type, data) {
        switch (type) {
            case 'slow_constraint_evaluation':
                if (data.duration > 1000) return 'high';
                if (data.duration > 500) return 'medium';
                return 'low';
                
            case 'high_memory_usage':
                if (data.heapUsed > 1000) return 'high';
                if (data.heapUsed > 750) return 'medium';
                return 'low';
                
            case 'low_cache_hit_rate':
                if (data.hitRate < 0.3) return 'high';
                if (data.hitRate < 0.5) return 'medium';
                return 'low';
                
            default:
                return 'medium';
        }
    }

    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendation(bottleneck) {
        const recommendations = {
            slow_constraint_evaluation: {
                title: 'Optimize Constraint Evaluation',
                description: 'Constraint evaluation is taking longer than expected',
                suggestions: [
                    'Consider caching constraint results',
                    'Optimize constraint algorithms',
                    'Implement constraint prioritization',
                    'Use parallel evaluation for independent constraints'
                ],
                priority: 'high'
            },
            
            high_memory_usage: {
                title: 'Reduce Memory Usage',
                description: 'Memory consumption is above threshold',
                suggestions: [
                    'Implement memory pooling for constraint objects',
                    'Clear unused constraint caches',
                    'Optimize data structures',
                    'Implement garbage collection tuning'
                ],
                priority: 'medium'
            },
            
            low_cache_hit_rate: {
                title: 'Improve Cache Performance',
                description: 'Cache hit rate is below optimal levels',
                suggestions: [
                    'Increase cache size',
                    'Improve cache key strategies',
                    'Implement smarter eviction policies',
                    'Pre-warm cache with common constraints'
                ],
                priority: 'high'
            }
        };
        
        return recommendations[bottleneck.type] || null;
    }

    /**
     * Check performance thresholds and trigger alerts
     */
    checkPerformanceThresholds(metric) {
        // Check constraint evaluation time
        if (metric.duration > this.alertThresholds.constraintEvaluationMs) {
            this.reportBottleneck('slow_constraint_evaluation', metric);
        }
        
        // Check for performance regression
        if (this.baseline) {
            const regressionFactor = 1.5; // 50% slower than baseline
            const baselineAvg = this.getBaselineAverage(metric.metadata.type);
            
            if (baselineAvg && metric.duration > baselineAvg * regressionFactor) {
                this.reportPerformanceRegression(metric, baselineAvg);
            }
        }
    }

    /**
     * Report performance regression
     */
    reportPerformanceRegression(metric, baselineAvg) {
        const regression = {
            timestamp: Date.now(),
            metric,
            baselineAverage: baselineAvg,
            regressionFactor: metric.duration / baselineAvg,
            type: 'performance_regression'
        };
        
        this.metrics.regressions.push(regression);
        this.emit('regression', regression);
    }

    /**
     * Get current performance statistics
     */
    getPerformanceStats(timeWindowMs = 60000) { // Default: last minute
        const cutoff = Date.now() - timeWindowMs;
        const stats = {};
        
        // Constraint evaluation stats
        for (const [key, metrics] of this.metrics.constraintEvaluations) {
            const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
            if (recentMetrics.length === 0) continue;
            
            const durations = recentMetrics.map(m => m.duration);
            const memoryDeltas = recentMetrics.map(m => m.memoryDelta);
            
            stats[key] = {
                count: recentMetrics.length,
                avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
                maxDuration: Math.max(...durations),
                minDuration: Math.min(...durations),
                p95Duration: this.percentile(durations, 0.95),
                avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
                successRate: recentMetrics.filter(m => m.result.success).length / recentMetrics.length
            };
        }
        
        // Cache stats
        const cacheStats = {};
        for (const [key, cache] of this.metrics.cacheMetrics) {
            const total = cache.hits + cache.misses;
            if (total > 0) {
                cacheStats[key] = {
                    hitRate: cache.hits / total,
                    totalOperations: total,
                    hits: cache.hits,
                    misses: cache.misses
                };
            }
        }
        
        // System stats
        const recentMemory = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
        const recentCpu = this.metrics.cpuMetrics.filter(m => m.timestamp > cutoff);
        
        return {
            constraints: stats,
            cache: cacheStats,
            system: {
                memory: recentMemory.length > 0 ? {
                    current: recentMemory[recentMemory.length - 1],
                    average: recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) / recentMemory.length,
                    peak: Math.max(...recentMemory.map(m => m.heapUsed))
                } : null,
                cpu: recentCpu.length > 0 ? {
                    avgEventLoopLag: recentCpu.reduce((sum, c) => sum + c.eventLoopLag, 0) / recentCpu.length,
                    maxEventLoopLag: Math.max(...recentCpu.map(c => c.eventLoopLag))
                } : null
            },
            bottlenecks: this.metrics.bottlenecks.filter(b => b.timestamp > cutoff),
            regressions: this.metrics.regressions.filter(r => r.timestamp > cutoff),
            counters: Object.fromEntries(this.counters)
        };
    }

    /**
     * Start recording baseline performance
     */
    startBaseline(duration = 300000) { // Default: 5 minutes
        this.isRecordingBaseline = true;
        this.baseline = new Map();
        
        setTimeout(() => {
            this.finishBaseline();
        }, duration);
        
        return `Baseline recording started for ${duration / 1000} seconds`;
    }

    /**
     * Finish recording baseline and calculate averages
     */
    finishBaseline() {
        this.isRecordingBaseline = false;
        
        // Calculate baseline averages
        const baselineStats = {};
        for (const [key, metrics] of this.metrics.constraintEvaluations) {
            if (metrics.length > 0) {
                const durations = metrics.map(m => m.duration);
                baselineStats[key] = {
                    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
                    count: metrics.length
                };
            }
        }
        
        this.baseline = baselineStats;
        this.emit('baseline_established', baselineStats);
        
        return baselineStats;
    }

    /**
     * Get baseline average for a metric type
     */
    getBaselineAverage(type) {
        return this.baseline && this.baseline[type] ? this.baseline[type].avgDuration : null;
    }

    /**
     * Increment a counter
     */
    incrementCounter(name, value = 1) {
        this.counters.set(name, (this.counters.get(name) || 0) + value);
    }

    /**
     * Update real-time statistics
     */
    updateRealtimeStats(metric) {
        // Implementation for real-time stat updates
        // This could update dashboards, send to monitoring systems, etc.
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupOldMetrics() {
        const cutoff = Date.now() - this.metricsRetentionMs;
        
        for (const [key, metrics] of this.metrics.constraintEvaluations) {
            this.metrics.constraintEvaluations.set(
                key,
                metrics.filter(m => m.timestamp > cutoff)
            );
        }
        
        this.metrics.bottlenecks = this.metrics.bottlenecks.filter(b => b.timestamp > cutoff);
        this.metrics.regressions = this.metrics.regressions.filter(r => r.timestamp > cutoff);
    }

    /**
     * Calculate percentile
     */
    percentile(values, p) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index];
    }

    /**
     * Stop monitoring and cleanup
     */
    stop() {
        if (this.memoryInterval) clearInterval(this.memoryInterval);
        if (this.cpuInterval) clearInterval(this.cpuInterval);
        this.enabled = false;
    }

    /**
     * Export performance data for analysis
     */
    exportData(format = 'json') {
        const data = {
            metrics: Object.fromEntries(this.metrics.constraintEvaluations),
            cache: Object.fromEntries(this.metrics.cacheMetrics),
            system: {
                memory: this.metrics.memoryUsage,
                cpu: this.metrics.cpuMetrics
            },
            bottlenecks: this.metrics.bottlenecks,
            regressions: this.metrics.regressions,
            counters: Object.fromEntries(this.counters),
            baseline: this.baseline,
            exportedAt: new Date().toISOString()
        };
        
        switch (format) {
            case 'csv':
                return this.exportToCSV(data);
            case 'json':
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    /**
     * Export to CSV format
     */
    exportToCSV(data) {
        // Implementation for CSV export
        // This would flatten the data structure into CSV format
        return 'CSV export not implemented yet';
    }
}

module.exports = PerformanceMonitor;