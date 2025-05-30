/**
 * FlexTime Enhanced Performance Monitor
 * 
 * Provides comprehensive real-time monitoring and auto-optimization
 * for the FlexTime scheduling engine performance.
 * 
 * Features:
 * - Real-time memory and CPU monitoring
 * - Response time measurement
 * - Cache performance analysis
 * - Database query optimization
 * - Auto-scaling and optimization
 * 
 * @author FlexTime Performance Team
 * @version 2.0.0
 */

const os = require('os');
const v8 = require('v8');
const cluster = require('cluster');
const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Monitoring intervals (ms)
            systemMetricsInterval: options.systemMetricsInterval || 5000,
            memoryCheckInterval: options.memoryCheckInterval || 10000,
            responseTimeWindow: options.responseTimeWindow || 60000,
            
            // Thresholds for auto-optimization
            memoryThreshold: options.memoryThreshold || 0.85, // 85% of heap
            cpuThreshold: options.cpuThreshold || 0.80, // 80% CPU usage
            responseTimeThreshold: options.responseTimeThreshold || 2000, // 2s
            
            // Auto-optimization settings
            enableAutoOptimization: options.enableAutoOptimization !== false,
            maxWorkers: options.maxWorkers || os.cpus().length * 2,
            minWorkers: options.minWorkers || 2,
            
            // Cache settings
            maxCacheSize: options.maxCacheSize || 100000,
            minCacheSize: options.minCacheSize || 10000,
            
            ...options
        };

        // Performance metrics storage
        this.metrics = {
            system: {
                cpu: [],
                memory: [],
                heap: [],
                uptime: process.uptime()
            },
            performance: {
                responseTimes: new Map(),
                throughput: {
                    requests: 0,
                    startTime: Date.now()
                },
                errors: [],
                slowQueries: []
            },
            cache: {
                hitRate: 0,
                missRate: 0,
                size: 0,
                evictions: 0
            },
            database: {
                queryTimes: [],
                connections: 0,
                slowQueries: []
            },
            optimization: {
                algorithmsUsed: new Map(),
                autoAdjustments: []
            }
        };

        // Worker pool tracking
        this.workerPool = {
            active: 0,
            idle: 0,
            busy: 0,
            queue: 0
        };

        // Cache performance tracking
        this.cachePerformance = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            lastOptimization: Date.now()
        };

        // Memory leak detection
        this.memoryBaseline = process.memoryUsage();
        this.memoryHistory = [];
        this.leakDetected = false;

        this.isMonitoring = false;
        this.intervals = new Map();
        
        this.initializeMonitoring();
    }

    /**
     * Initialize all monitoring systems
     */
    initializeMonitoring() {
        if (this.isMonitoring) return;

        console.log('🔍 FlexTime Performance Monitor: Initializing...');

        // System metrics monitoring
        this.intervals.set('systemMetrics', setInterval(() => {
            this.collectSystemMetrics();
        }, this.config.systemMetricsInterval));

        // Memory monitoring and leak detection
        this.intervals.set('memoryCheck', setInterval(() => {
            this.performMemoryAnalysis();
        }, this.config.memoryCheckInterval));

        // Performance optimization scheduler
        this.intervals.set('optimization', setInterval(() => {
            this.performAutoOptimization();
        }, 30000)); // Every 30 seconds

        // Database query monitoring
        this.intervals.set('dbMonitoring', setInterval(() => {
            this.analyzeDbPerformance();
        }, 15000)); // Every 15 seconds

        this.isMonitoring = true;
        this.emit('monitoring:started');

        console.log('✅ FlexTime Performance Monitor: Active');
    }

    /**
     * Collect comprehensive system metrics
     */
    collectSystemMetrics() {
        const cpuUsage = process.cpuUsage();
        const memUsage = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        const loadAverage = os.loadavg();

        // CPU metrics
        const cpuMetric = {
            timestamp: Date.now(),
            user: cpuUsage.user / 1000000, // Convert to seconds
            system: cpuUsage.system / 1000000,
            loadAverage: loadAverage[0], // 1-minute load average
            cores: os.cpus().length
        };

        // Memory metrics
        const memoryMetric = {
            timestamp: Date.now(),
            rss: memUsage.rss,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
            heapSizeLimit: heapStats.heap_size_limit,
            totalAvailableSize: heapStats.total_available_size
        };

        // Store metrics (keep last 100 entries)
        this.metrics.system.cpu.push(cpuMetric);
        this.metrics.system.memory.push(memoryMetric);
        this.metrics.system.heap.push(heapStats);

        if (this.metrics.system.cpu.length > 100) {
            this.metrics.system.cpu.shift();
        }
        if (this.metrics.system.memory.length > 100) {
            this.metrics.system.memory.shift();
        }
        if (this.metrics.system.heap.length > 100) {
            this.metrics.system.heap.shift();
        }

        // Check for performance issues
        this.checkPerformanceThresholds(cpuMetric, memoryMetric);

        this.emit('metrics:collected', { cpu: cpuMetric, memory: memoryMetric });
    }

    /**
     * Advanced memory analysis and leak detection
     */
    performMemoryAnalysis() {
        const currentMemory = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        
        // Calculate memory growth rate
        const memoryGrowth = {
            rss: currentMemory.rss - this.memoryBaseline.rss,
            heapUsed: currentMemory.heapUsed - this.memoryBaseline.heapUsed,
            heapTotal: currentMemory.heapTotal - this.memoryBaseline.heapTotal,
            timestamp: Date.now()
        };

        this.memoryHistory.push(memoryGrowth);

        // Keep last 20 measurements for trend analysis
        if (this.memoryHistory.length > 20) {
            this.memoryHistory.shift();
        }

        // Detect memory leaks (consistent growth over time)
        if (this.memoryHistory.length >= 10) {
            const growthTrend = this.analyzeMemoryTrend();
            
            if (growthTrend.isIncreasing && growthTrend.rate > 1024 * 1024) { // 1MB/check
                if (!this.leakDetected) {
                    this.leakDetected = true;
                    this.emit('memory:leak-detected', growthTrend);
                    console.warn('⚠️  Potential memory leak detected!', growthTrend);
                }
            } else {
                this.leakDetected = false;
            }
        }

        // Force garbage collection if memory usage is high
        const heapUsageRatio = currentMemory.heapUsed / heapStats.heap_size_limit;
        if (heapUsageRatio > this.config.memoryThreshold) {
            this.forceGarbageCollection();
        }

        this.emit('memory:analyzed', {
            current: currentMemory,
            growth: memoryGrowth,
            trend: this.analyzeMemoryTrend(),
            heapUsageRatio
        });
    }

    /**
     * Analyze memory growth trend
     */
    analyzeMemoryTrend() {
        if (this.memoryHistory.length < 5) return { isIncreasing: false, rate: 0 };

        const recent = this.memoryHistory.slice(-5);
        let increasing = 0;
        let totalGrowth = 0;

        for (let i = 1; i < recent.length; i++) {
            const growth = recent[i].heapUsed - recent[i-1].heapUsed;
            if (growth > 0) increasing++;
            totalGrowth += growth;
        }

        return {
            isIncreasing: increasing >= 3, // 3 out of 4 measurements increasing
            rate: totalGrowth / recent.length,
            consistency: increasing / (recent.length - 1)
        };
    }

    /**
     * Force garbage collection with monitoring
     */
    forceGarbageCollection() {
        const beforeGC = process.memoryUsage();
        
        if (global.gc) {
            global.gc();
            const afterGC = process.memoryUsage();
            
            const freed = {
                rss: beforeGC.rss - afterGC.rss,
                heapUsed: beforeGC.heapUsed - afterGC.heapUsed,
                heapTotal: beforeGC.heapTotal - afterGC.heapTotal
            };

            this.emit('memory:gc-forced', { before: beforeGC, after: afterGC, freed });
            console.log('🗑️  Forced GC - Freed:', {
                heap: Math.round(freed.heapUsed / 1024 / 1024) + 'MB',
                rss: Math.round(freed.rss / 1024 / 1024) + 'MB'
            });
        }
    }

    /**
     * Track response times for endpoints
     */
    trackResponseTime(endpoint, startTime, endTime = Date.now()) {
        const responseTime = endTime - startTime;
        
        if (!this.metrics.performance.responseTimes.has(endpoint)) {
            this.metrics.performance.responseTimes.set(endpoint, []);
        }

        const times = this.metrics.performance.responseTimes.get(endpoint);
        times.push({
            time: responseTime,
            timestamp: endTime
        });

        // Keep only last 100 measurements per endpoint
        if (times.length > 100) {
            times.shift();
        }

        // Update throughput
        this.metrics.performance.throughput.requests++;

        // Check if response time exceeds threshold
        if (responseTime > this.config.responseTimeThreshold) {
            this.emit('performance:slow-response', {
                endpoint,
                responseTime,
                threshold: this.config.responseTimeThreshold
            });
        }

        this.emit('performance:response-tracked', { endpoint, responseTime });
        return responseTime;
    }

    /**
     * Track cache performance
     */
    trackCacheHit(key, hit = true) {
        this.cachePerformance.totalRequests++;
        
        if (hit) {
            this.cachePerformance.hits++;
        } else {
            this.cachePerformance.misses++;
        }

        // Update cache metrics
        this.metrics.cache.hitRate = this.cachePerformance.hits / this.cachePerformance.totalRequests;
        this.metrics.cache.missRate = this.cachePerformance.misses / this.cachePerformance.totalRequests;

        this.emit('cache:tracked', {
            key,
            hit,
            hitRate: this.metrics.cache.hitRate,
            missRate: this.metrics.cache.missRate
        });
    }

    /**
     * Track database query performance
     */
    trackDatabaseQuery(query, duration, params = {}) {
        const queryMetric = {
            query: query.length > 100 ? query.substring(0, 100) + '...' : query,
            duration,
            timestamp: Date.now(),
            params: Object.keys(params).length
        };

        this.metrics.database.queryTimes.push(queryMetric);

        // Keep last 200 queries
        if (this.metrics.database.queryTimes.length > 200) {
            this.metrics.database.queryTimes.shift();
        }

        // Track slow queries (> 1 second)
        if (duration > 1000) {
            this.metrics.database.slowQueries.push(queryMetric);
            this.emit('database:slow-query', queryMetric);
        }

        this.emit('database:query-tracked', queryMetric);
    }

    /**
     * Analyze database performance patterns
     */
    analyzeDbPerformance() {
        const recent = this.metrics.database.queryTimes.slice(-50);
        if (recent.length === 0) return;

        const avgDuration = recent.reduce((sum, q) => sum + q.duration, 0) / recent.length;
        const slowQueries = recent.filter(q => q.duration > 500); // > 500ms

        const analysis = {
            avgDuration,
            slowQueryCount: slowQueries.length,
            slowQueryRatio: slowQueries.length / recent.length,
            recommendations: []
        };

        // Generate recommendations
        if (analysis.avgDuration > 200) {
            analysis.recommendations.push('Consider query optimization or indexing');
        }

        if (analysis.slowQueryRatio > 0.1) {
            analysis.recommendations.push('High number of slow queries detected');
        }

        this.emit('database:analysis', analysis);
    }

    /**
     * Check performance thresholds and trigger alerts
     */
    checkPerformanceThresholds(cpuMetric, memoryMetric) {
        const heapUsageRatio = memoryMetric.heapUsed / memoryMetric.heapSizeLimit;
        const cpuUsageRatio = cpuMetric.loadAverage / cpuMetric.cores;

        // Memory threshold check
        if (heapUsageRatio > this.config.memoryThreshold) {
            this.emit('performance:threshold-exceeded', {
                type: 'memory',
                current: heapUsageRatio,
                threshold: this.config.memoryThreshold
            });
        }

        // CPU threshold check
        if (cpuUsageRatio > this.config.cpuThreshold) {
            this.emit('performance:threshold-exceeded', {
                type: 'cpu',
                current: cpuUsageRatio,
                threshold: this.config.cpuThreshold
            });
        }
    }

    /**
     * Perform automatic optimizations based on metrics
     */
    performAutoOptimization() {
        if (!this.config.enableAutoOptimization) return;

        const optimizations = [];

        // Optimize cache size based on hit rate
        const cacheOptimization = this.optimizeCacheSize();
        if (cacheOptimization) optimizations.push(cacheOptimization);

        // Optimize worker pool
        const workerOptimization = this.optimizeWorkerPool();
        if (workerOptimization) optimizations.push(workerOptimization);

        // Select optimal algorithm based on current load
        const algorithmOptimization = this.selectOptimalAlgorithm();
        if (algorithmOptimization) optimizations.push(algorithmOptimization);

        if (optimizations.length > 0) {
            this.metrics.optimization.autoAdjustments.push({
                timestamp: Date.now(),
                optimizations
            });

            this.emit('optimization:performed', optimizations);
        }
    }

    /**
     * Optimize cache size based on performance metrics
     */
    optimizeCacheSize() {
        const hitRate = this.metrics.cache.hitRate;
        const currentSize = this.metrics.cache.size;

        // If hit rate is low and cache isn't at max, increase size
        if (hitRate < 0.7 && currentSize < this.config.maxCacheSize) {
            const newSize = Math.min(currentSize * 1.5, this.config.maxCacheSize);
            this.emit('cache:size-optimized', {
                oldSize: currentSize,
                newSize,
                reason: 'Low hit rate'
            });
            return { type: 'cache-size-increase', oldSize: currentSize, newSize };
        }

        // If hit rate is high and memory usage is high, consider reducing
        const memoryUsage = this.getLatestMemoryUsage();
        if (hitRate > 0.9 && memoryUsage > 0.8 && currentSize > this.config.minCacheSize) {
            const newSize = Math.max(currentSize * 0.8, this.config.minCacheSize);
            this.emit('cache:size-optimized', {
                oldSize: currentSize,
                newSize,
                reason: 'High memory usage'
            });
            return { type: 'cache-size-decrease', oldSize: currentSize, newSize };
        }

        return null;
    }

    /**
     * Optimize worker pool based on load
     */
    optimizeWorkerPool() {
        const queueLength = this.workerPool.queue;
        const activeWorkers = this.workerPool.active;
        const cpuUsage = this.getLatestCpuUsage();

        // Scale up if queue is growing and CPU usage is reasonable
        if (queueLength > 10 && cpuUsage < 0.7 && activeWorkers < this.config.maxWorkers) {
            const newWorkerCount = Math.min(activeWorkers + 2, this.config.maxWorkers);
            this.emit('workers:scale-up', {
                oldCount: activeWorkers,
                newCount: newWorkerCount,
                reason: 'High queue length'
            });
            return { type: 'worker-scale-up', oldCount: activeWorkers, newCount: newWorkerCount };
        }

        // Scale down if workers are idle and minimum is maintained
        if (this.workerPool.idle > activeWorkers * 0.5 && activeWorkers > this.config.minWorkers) {
            const newWorkerCount = Math.max(activeWorkers - 1, this.config.minWorkers);
            this.emit('workers:scale-down', {
                oldCount: activeWorkers,
                newCount: newWorkerCount,
                reason: 'High idle count'
            });
            return { type: 'worker-scale-down', oldCount: activeWorkers, newCount: newWorkerCount };
        }

        return null;
    }

    /**
     * Select optimal scheduling algorithm based on current conditions
     */
    selectOptimalAlgorithm() {
        const memoryUsage = this.getLatestMemoryUsage();
        const cpuUsage = this.getLatestCpuUsage();
        const responseTime = this.getAverageResponseTime();

        let recommendedAlgorithm = 'balanced';

        // High memory usage - use memory-efficient algorithm
        if (memoryUsage > 0.8) {
            recommendedAlgorithm = 'memory-efficient';
        }
        // High CPU usage - use CPU-optimized algorithm
        else if (cpuUsage > 0.8) {
            recommendedAlgorithm = 'cpu-optimized';
        }
        // Slow response times - use speed-optimized algorithm
        else if (responseTime > this.config.responseTimeThreshold) {
            recommendedAlgorithm = 'speed-optimized';
        }

        // Track algorithm usage
        const currentCount = this.metrics.optimization.algorithmsUsed.get(recommendedAlgorithm) || 0;
        this.metrics.optimization.algorithmsUsed.set(recommendedAlgorithm, currentCount + 1);

        this.emit('algorithm:selected', {
            algorithm: recommendedAlgorithm,
            conditions: { memoryUsage, cpuUsage, responseTime }
        });

        return { type: 'algorithm-selection', algorithm: recommendedAlgorithm };
    }

    /**
     * Get latest memory usage ratio
     */
    getLatestMemoryUsage() {
        const latest = this.metrics.system.memory[this.metrics.system.memory.length - 1];
        return latest ? latest.heapUsed / latest.heapSizeLimit : 0;
    }

    /**
     * Get latest CPU usage
     */
    getLatestCpuUsage() {
        const latest = this.metrics.system.cpu[this.metrics.system.cpu.length - 1];
        return latest ? latest.loadAverage / latest.cores : 0;
    }

    /**
     * Get average response time across all endpoints
     */
    getAverageResponseTime() {
        let totalTime = 0;
        let totalRequests = 0;

        for (const [endpoint, times] of this.metrics.performance.responseTimes) {
            const recentTimes = times.slice(-10); // Last 10 requests
            totalTime += recentTimes.reduce((sum, t) => sum + t.time, 0);
            totalRequests += recentTimes.length;
        }

        return totalRequests > 0 ? totalTime / totalRequests : 0;
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            uptime: process.uptime(),
            
            system: {
                memory: {
                    current: this.getLatestMemoryUsage(),
                    trend: this.analyzeMemoryTrend(),
                    leakDetected: this.leakDetected
                },
                cpu: {
                    current: this.getLatestCpuUsage(),
                    cores: os.cpus().length,
                    loadAverage: os.loadavg()
                }
            },

            performance: {
                averageResponseTime: this.getAverageResponseTime(),
                throughput: {
                    requestsPerSecond: this.calculateThroughput(),
                    totalRequests: this.metrics.performance.throughput.requests
                },
                slowEndpoints: this.getSlowEndpoints()
            },

            cache: {
                hitRate: this.metrics.cache.hitRate,
                missRate: this.metrics.cache.missRate,
                size: this.metrics.cache.size,
                efficiency: this.calculateCacheEfficiency()
            },

            database: {
                averageQueryTime: this.calculateAverageQueryTime(),
                slowQueries: this.metrics.database.slowQueries.length,
                connections: this.metrics.database.connections
            },

            optimization: {
                algorithmsUsed: Object.fromEntries(this.metrics.optimization.algorithmsUsed),
                autoAdjustments: this.metrics.optimization.autoAdjustments.length,
                recommendations: this.generateRecommendations()
            }
        };

        this.emit('report:generated', report);
        return report;
    }

    /**
     * Calculate current throughput (requests per second)
     */
    calculateThroughput() {
        const elapsed = (Date.now() - this.metrics.performance.throughput.startTime) / 1000;
        return elapsed > 0 ? this.metrics.performance.throughput.requests / elapsed : 0;
    }

    /**
     * Get endpoints with slowest response times
     */
    getSlowEndpoints() {
        const slowEndpoints = [];

        for (const [endpoint, times] of this.metrics.performance.responseTimes) {
            const avgTime = times.reduce((sum, t) => sum + t.time, 0) / times.length;
            if (avgTime > this.config.responseTimeThreshold / 2) {
                slowEndpoints.push({ endpoint, avgTime });
            }
        }

        return slowEndpoints.sort((a, b) => b.avgTime - a.avgTime);
    }

    /**
     * Calculate cache efficiency score
     */
    calculateCacheEfficiency() {
        const hitRate = this.metrics.cache.hitRate;
        const size = this.metrics.cache.size;
        const maxSize = this.config.maxCacheSize;

        // Efficiency considers both hit rate and memory usage
        const sizeEfficiency = 1 - (size / maxSize);
        return (hitRate * 0.7) + (sizeEfficiency * 0.3);
    }

    /**
     * Calculate average database query time
     */
    calculateAverageQueryTime() {
        const recent = this.metrics.database.queryTimes.slice(-100);
        if (recent.length === 0) return 0;
        
        return recent.reduce((sum, q) => sum + q.duration, 0) / recent.length;
    }

    /**
     * Generate optimization recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        // Memory recommendations
        if (this.getLatestMemoryUsage() > 0.8) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                message: 'Memory usage is high - consider increasing heap size or optimizing memory allocation'
            });
        }

        // CPU recommendations
        if (this.getLatestCpuUsage() > 0.8) {
            recommendations.push({
                type: 'cpu',
                priority: 'high',
                message: 'CPU usage is high - consider horizontal scaling or algorithm optimization'
            });
        }

        // Cache recommendations
        if (this.metrics.cache.hitRate < 0.7) {
            recommendations.push({
                type: 'cache',
                priority: 'medium',
                message: 'Cache hit rate is low - consider adjusting cache strategy or size'
            });
        }

        // Database recommendations
        const avgQueryTime = this.calculateAverageQueryTime();
        if (avgQueryTime > 200) {
            recommendations.push({
                type: 'database',
                priority: 'medium',
                message: 'Database queries are slow - consider indexing or query optimization'
            });
        }

        return recommendations;
    }

    /**
     * Update worker pool metrics
     */
    updateWorkerMetrics(active, idle, busy, queue) {
        this.workerPool = { active, idle, busy, queue };
        this.emit('workers:metrics-updated', this.workerPool);
    }

    /**
     * Update cache metrics
     */
    updateCacheMetrics(size, evictions) {
        this.metrics.cache.size = size;
        this.metrics.cache.evictions = evictions;
        this.emit('cache:metrics-updated', this.metrics.cache);
    }

    /**
     * Stop all monitoring
     */
    stop() {
        console.log('🛑 FlexTime Performance Monitor: Stopping...');

        this.intervals.forEach((interval, name) => {
            clearInterval(interval);
        });
        this.intervals.clear();

        this.isMonitoring = false;
        this.emit('monitoring:stopped');

        console.log('✅ FlexTime Performance Monitor: Stopped');
    }

    /**
     * Get current metrics snapshot
     */
    getMetricsSnapshot() {
        return {
            timestamp: Date.now(),
            system: this.metrics.system,
            performance: {
                ...this.metrics.performance,
                responseTimes: Object.fromEntries(this.metrics.performance.responseTimes)
            },
            cache: this.metrics.cache,
            database: this.metrics.database,
            optimization: {
                ...this.metrics.optimization,
                algorithmsUsed: Object.fromEntries(this.metrics.optimization.algorithmsUsed)
            },
            workerPool: this.workerPool
        };
    }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

// Express middleware for automatic response time tracking
performanceMonitor.middleware = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const endTime = Date.now();
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        performanceMonitor.trackResponseTime(endpoint, startTime, endTime);
    });
    
    next();
};

// Database query wrapper for automatic tracking
performanceMonitor.wrapDatabaseQuery = (originalQuery) => {
    return async function(...args) {
        const startTime = Date.now();
        try {
            const result = await originalQuery.apply(this, args);
            const duration = Date.now() - startTime;
            performanceMonitor.trackDatabaseQuery(
                args[0] || 'unknown-query',
                duration,
                args[1] || {}
            );
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            performanceMonitor.trackDatabaseQuery(
                args[0] || 'unknown-query',
                duration,
                args[1] || {}
            );
            throw error;
        }
    };
};

module.exports = {
    PerformanceMonitor,
    monitor: performanceMonitor
};