/**
 * FlexTime Performance Monitor Integration Example
 * 
 * This file demonstrates how to integrate the Performance Monitor
 * into the FlexTime scheduling system for comprehensive monitoring
 * and auto-optimization.
 */

const express = require('express');
const { monitor } = require('../PerformanceMonitor');

// Example: Express Application Integration
class FlexTimeServerWithMonitoring {
    constructor() {
        this.app = express();
        this.setupPerformanceMonitoring();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupPerformanceMonitoring() {
        console.log('🔍 Setting up FlexTime Performance Monitoring...');

        // Add performance monitoring middleware
        this.app.use(monitor.middleware);

        // Set up event listeners for monitoring alerts
        monitor.on('performance:threshold-exceeded', (data) => {
            console.warn(`⚠️  Performance threshold exceeded:`, data);
            
            // Could trigger alerts, scaling, or other actions
            if (data.type === 'memory' && data.current > 0.9) {
                this.handleCriticalMemoryUsage(data);
            }
        });

        monitor.on('memory:leak-detected', (trend) => {
            console.error('🚨 Memory leak detected!', trend);
            this.handleMemoryLeak(trend);
        });

        monitor.on('optimization:performed', (optimizations) => {
            console.log('🚀 Auto-optimizations performed:', 
                optimizations.map(o => o.type).join(', '));
        });

        monitor.on('database:slow-query', (query) => {
            console.warn('🐌 Slow database query detected:', {
                query: query.query,
                duration: query.duration + 'ms'
            });
        });

        // Update worker metrics (if using clustering)
        if (require('cluster').isWorker) {
            setInterval(() => {
                monitor.updateWorkerMetrics(
                    process.env.WORKER_ID || 1,
                    Math.floor(Math.random() * 3), // Simulated idle workers
                    Math.floor(Math.random() * 5), // Simulated busy workers
                    Math.floor(Math.random() * 10) // Simulated queue length
                );
            }, 5000);
        }
    }

    setupRoutes() {
        // Example: Schedule generation endpoint with monitoring
        this.app.post('/api/schedules/generate', async (req, res) => {
            const startTime = Date.now();
            
            try {
                // Simulate cache check
                const cacheKey = `schedule:${JSON.stringify(req.body)}`;
                const cached = await this.checkCache(cacheKey);
                
                if (cached) {
                    monitor.trackCacheHit(cacheKey, true);
                    return res.json(cached);
                }
                
                monitor.trackCacheHit(cacheKey, false);

                // Generate schedule (simulated)
                const schedule = await this.generateScheduleWithMonitoring(req.body);
                
                // Cache the result
                await this.saveToCache(cacheKey, schedule);
                
                res.json({
                    success: true,
                    schedule,
                    processingTime: Date.now() - startTime
                });

            } catch (error) {
                console.error('Schedule generation error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    processingTime: Date.now() - startTime
                });
            }
        });

        // Performance metrics endpoint
        this.app.get('/api/performance/metrics', (req, res) => {
            const metrics = monitor.getMetricsSnapshot();
            res.json(metrics);
        });

        // Performance report endpoint
        this.app.get('/api/performance/report', (req, res) => {
            const report = monitor.generatePerformanceReport();
            res.json(report);
        });

        // Health check endpoint with performance data
        this.app.get('/api/health', (req, res) => {
            const metrics = monitor.getMetricsSnapshot();
            const memoryUsage = monitor.getLatestMemoryUsage();
            const cpuUsage = monitor.getLatestCpuUsage();

            const health = {
                status: 'healthy',
                timestamp: Date.now(),
                uptime: process.uptime(),
                memory: {
                    usage: memoryUsage,
                    status: memoryUsage > 0.9 ? 'critical' : memoryUsage > 0.7 ? 'warning' : 'good'
                },
                cpu: {
                    usage: cpuUsage,
                    status: cpuUsage > 0.9 ? 'critical' : cpuUsage > 0.7 ? 'warning' : 'good'
                },
                performance: {
                    avgResponseTime: monitor.getAverageResponseTime(),
                    throughput: monitor.calculateThroughput()
                }
            };

            // Overall health status
            if (memoryUsage > 0.9 || cpuUsage > 0.9) {
                health.status = 'critical';
                res.status(503);
            } else if (memoryUsage > 0.7 || cpuUsage > 0.7) {
                health.status = 'degraded';
            }

            res.json(health);
        });
    }

    setupErrorHandling() {
        // Global error handler with performance tracking
        this.app.use((error, req, res, next) => {
            console.error('Application error:', error);
            
            // Track error in performance metrics
            monitor.metrics.performance.errors.push({
                error: error.message,
                stack: error.stack,
                timestamp: Date.now(),
                endpoint: req.path,
                method: req.method
            });

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });
    }

    async generateScheduleWithMonitoring(constraints) {
        // Wrap database queries with monitoring
        const wrappedQuery = monitor.wrapDatabaseQuery(this.performDatabaseQuery.bind(this));
        
        // Simulate algorithm selection based on current performance
        const algorithm = this.selectAlgorithmBasedOnPerformance();
        console.log(`🧠 Using algorithm: ${algorithm}`);
        
        // Track algorithm usage
        monitor.metrics.optimization.algorithmsUsed.set(
            algorithm,
            (monitor.metrics.optimization.algorithmsUsed.get(algorithm) || 0) + 1
        );

        // Simulate schedule generation with different algorithms
        switch (algorithm) {
            case 'memory-efficient':
                return await this.generateMemoryEfficientSchedule(constraints, wrappedQuery);
            case 'cpu-optimized':
                return await this.generateCpuOptimizedSchedule(constraints, wrappedQuery);
            case 'speed-optimized':
                return await this.generateSpeedOptimizedSchedule(constraints, wrappedQuery);
            default:
                return await this.generateBalancedSchedule(constraints, wrappedQuery);
        }
    }

    selectAlgorithmBasedOnPerformance() {
        const memoryUsage = monitor.getLatestMemoryUsage();
        const cpuUsage = monitor.getLatestCpuUsage();
        const avgResponseTime = monitor.getAverageResponseTime();

        if (memoryUsage > 0.8) return 'memory-efficient';
        if (cpuUsage > 0.8) return 'cpu-optimized';
        if (avgResponseTime > 2000) return 'speed-optimized';
        return 'balanced';
    }

    async generateMemoryEfficientSchedule(constraints, query) {
        console.log('🧠 Generating memory-efficient schedule...');
        
        // Simulated memory-efficient algorithm
        // Uses streaming and minimal memory allocation
        
        const teams = await query('SELECT * FROM teams LIMIT 10');
        const venues = await query('SELECT * FROM venues LIMIT 5');
        
        // Simplified schedule generation
        return {
            algorithm: 'memory-efficient',
            teams: teams.length,
            venues: venues.length,
            games: teams.length * 2,
            generated: new Date()
        };
    }

    async generateCpuOptimizedSchedule(constraints, query) {
        console.log('🧠 Generating CPU-optimized schedule...');
        
        // Simulated CPU-optimized algorithm
        // Uses precomputed results and minimal processing
        
        const cachedData = await this.checkCache('precomputed:schedules');
        if (cachedData) {
            return { ...cachedData, algorithm: 'cpu-optimized' };
        }

        const teams = await query('SELECT * FROM teams');
        return {
            algorithm: 'cpu-optimized',
            teams: teams.length,
            games: teams.length * 3,
            generated: new Date()
        };
    }

    async generateSpeedOptimizedSchedule(constraints, query) {
        console.log('🧠 Generating speed-optimized schedule...');
        
        // Simulated speed-optimized algorithm
        // Uses parallel processing and aggressive caching
        
        const [teams, venues] = await Promise.all([
            query('SELECT * FROM teams'),
            query('SELECT * FROM venues')
        ]);

        return {
            algorithm: 'speed-optimized',
            teams: teams.length,
            venues: venues.length,
            games: teams.length * venues.length,
            generated: new Date()
        };
    }

    async generateBalancedSchedule(constraints, query) {
        console.log('🧠 Generating balanced schedule...');
        
        // Simulated balanced algorithm
        // Balances memory, CPU, and speed considerations
        
        const teams = await query('SELECT * FROM teams');
        const venues = await query('SELECT * FROM venues');
        
        return {
            algorithm: 'balanced',
            teams: teams.length,
            venues: venues.length,
            games: Math.floor(teams.length * 2.5),
            generated: new Date()
        };
    }

    async performDatabaseQuery(sql, params = []) {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
        
        // Return mock data based on query
        if (sql.includes('teams')) {
            return Array(16).fill().map((_, i) => ({ id: i + 1, name: `Team ${i + 1}` }));
        }
        if (sql.includes('venues')) {
            return Array(8).fill().map((_, i) => ({ id: i + 1, name: `Venue ${i + 1}` }));
        }
        return [];
    }

    async checkCache(key) {
        // Simulate cache check
        if (Math.random() > 0.7) { // 30% cache hit rate
            return { cached: true, key, data: 'cached-data' };
        }
        return null;
    }

    async saveToCache(key, data) {
        // Simulate cache save
        console.log(`💾 Cached result for key: ${key}`);
        
        // Update cache metrics
        monitor.updateCacheMetrics(
            monitor.metrics.cache.size + 1,
            monitor.metrics.cache.evictions
        );
    }

    handleCriticalMemoryUsage(data) {
        console.error('🚨 Critical memory usage detected!', data);
        
        // Emergency actions:
        // 1. Clear non-essential caches
        // 2. Force garbage collection
        // 3. Scale up if in cloud environment
        // 4. Alert operations team
        
        if (global.gc) {
            console.log('🗑️  Forcing garbage collection...');
            global.gc();
        }
    }

    handleMemoryLeak(trend) {
        console.error('🚨 Memory leak handling initiated!', trend);
        
        // Memory leak response:
        // 1. Log detailed memory information
        // 2. Capture heap dump if possible
        // 3. Alert development team
        // 4. Consider graceful restart
        
        const memoryInfo = {
            trend,
            currentUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Memory leak details:', JSON.stringify(memoryInfo, null, 2));
    }

    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`🚀 FlexTime server with monitoring running on port ${port}`);
            console.log(`📊 Performance metrics available at: http://localhost:${port}/api/performance/metrics`);
            console.log(`📈 Performance report available at: http://localhost:${port}/api/performance/report`);
            console.log(`💚 Health check available at: http://localhost:${port}/api/health`);
        });
    }
}

// Example usage
if (require.main === module) {
    const server = new FlexTimeServerWithMonitoring();
    server.start(3005);

    // Example of manual performance monitoring
    setInterval(() => {
        const report = monitor.generatePerformanceReport();
        console.log('\n📊 Performance Summary:');
        console.log(`Memory: ${Math.round(report.system.memory.current * 100)}%`);
        console.log(`CPU: ${Math.round(report.system.cpu.current * 100)}%`);
        console.log(`Avg Response Time: ${Math.round(report.performance.averageResponseTime)}ms`);
        console.log(`Throughput: ${Math.round(report.performance.throughput.requestsPerSecond)} req/s`);
        console.log(`Cache Hit Rate: ${Math.round(report.cache.hitRate * 100)}%`);
        
        if (report.optimization.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.optimization.recommendations.forEach(rec => {
                console.log(`  ${rec.priority.toUpperCase()}: ${rec.message}`);
            });
        }
        console.log('---');
    }, 30000); // Every 30 seconds

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 Shutting down server...');
        monitor.stop();
        process.exit(0);
    });
}

module.exports = FlexTimeServerWithMonitoring;