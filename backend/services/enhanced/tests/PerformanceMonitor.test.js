/**
 * Performance Monitor Test Suite
 * 
 * Comprehensive testing for the FlexTime Performance Monitor
 */

const { PerformanceMonitor, monitor } = require('../PerformanceMonitor');

describe('FlexTime Performance Monitor', () => {
    let testMonitor;

    beforeEach(() => {
        testMonitor = new PerformanceMonitor({
            systemMetricsInterval: 100, // Fast intervals for testing
            memoryCheckInterval: 100,
            enableAutoOptimization: true
        });
    });

    afterEach(() => {
        if (testMonitor.isMonitoring) {
            testMonitor.stop();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(testMonitor.config.systemMetricsInterval).toBe(100);
            expect(testMonitor.config.enableAutoOptimization).toBe(true);
            expect(testMonitor.isMonitoring).toBe(true);
        });

        test('should emit monitoring:started event', (done) => {
            const newMonitor = new PerformanceMonitor();
            newMonitor.on('monitoring:started', () => {
                newMonitor.stop();
                done();
            });
        });
    });

    describe('System Metrics Collection', () => {
        test('should collect CPU and memory metrics', (done) => {
            testMonitor.on('metrics:collected', (metrics) => {
                expect(metrics.cpu).toBeDefined();
                expect(metrics.memory).toBeDefined();
                expect(metrics.cpu.timestamp).toBeGreaterThan(0);
                expect(metrics.memory.heapUsed).toBeGreaterThan(0);
                done();
            });
        });

        test('should maintain metrics history', (done) => {
            setTimeout(() => {
                expect(testMonitor.metrics.system.cpu.length).toBeGreaterThan(0);
                expect(testMonitor.metrics.system.memory.length).toBeGreaterThan(0);
                done();
            }, 200);
        });
    });

    describe('Response Time Tracking', () => {
        test('should track response times correctly', () => {
            const startTime = Date.now() - 100;
            const responseTime = testMonitor.trackResponseTime('/api/test', startTime);
            
            expect(responseTime).toBeGreaterThan(90);
            expect(responseTime).toBeLessThan(110);
            expect(testMonitor.metrics.performance.responseTimes.has('/api/test')).toBe(true);
        });

        test('should emit slow-response event for long requests', (done) => {
            testMonitor.on('performance:slow-response', (data) => {
                expect(data.endpoint).toBe('/api/slow');
                expect(data.responseTime).toBeGreaterThan(2000);
                done();
            });

            const startTime = Date.now() - 3000; // Simulate 3-second response
            testMonitor.trackResponseTime('/api/slow', startTime);
        });

        test('should limit response time history per endpoint', () => {
            for (let i = 0; i < 150; i++) {
                testMonitor.trackResponseTime('/api/test', Date.now() - 10);
            }
            
            const times = testMonitor.metrics.performance.responseTimes.get('/api/test');
            expect(times.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Cache Performance Tracking', () => {
        test('should track cache hits and misses', () => {
            testMonitor.trackCacheHit('key1', true);
            testMonitor.trackCacheHit('key2', false);
            testMonitor.trackCacheHit('key3', true);

            expect(testMonitor.metrics.cache.hitRate).toBe(2/3);
            expect(testMonitor.metrics.cache.missRate).toBe(1/3);
        });

        test('should emit cache tracking events', (done) => {
            testMonitor.on('cache:tracked', (data) => {
                expect(data.key).toBe('test-key');
                expect(data.hit).toBe(true);
                expect(data.hitRate).toBeGreaterThan(0);
                done();
            });

            testMonitor.trackCacheHit('test-key', true);
        });
    });

    describe('Database Query Tracking', () => {
        test('should track database query performance', () => {
            testMonitor.trackDatabaseQuery('SELECT * FROM users', 150, { limit: 10 });
            
            expect(testMonitor.metrics.database.queryTimes.length).toBe(1);
            expect(testMonitor.metrics.database.queryTimes[0].duration).toBe(150);
        });

        test('should detect slow queries', (done) => {
            testMonitor.on('database:slow-query', (query) => {
                expect(query.duration).toBe(1500);
                expect(query.query).toBe('SELECT * FROM large_table');
                done();
            });

            testMonitor.trackDatabaseQuery('SELECT * FROM large_table', 1500);
        });

        test('should limit query history', () => {
            for (let i = 0; i < 250; i++) {
                testMonitor.trackDatabaseQuery(`SELECT ${i}`, 100);
            }
            
            expect(testMonitor.metrics.database.queryTimes.length).toBeLessThanOrEqual(200);
        });
    });

    describe('Memory Leak Detection', () => {
        test('should detect memory growth trends', () => {
            // Simulate consistent memory growth
            for (let i = 0; i < 15; i++) {
                testMonitor.memoryHistory.push({
                    heapUsed: i * 1024 * 1024, // 1MB growth per measurement
                    timestamp: Date.now() + i * 1000
                });
            }

            const trend = testMonitor.analyzeMemoryTrend();
            expect(trend.isIncreasing).toBe(true);
            expect(trend.rate).toBeGreaterThan(0);
        });

        test('should emit memory leak detection event', (done) => {
            // Set up for leak detection
            testMonitor.memoryHistory = [];
            for (let i = 0; i < 12; i++) {
                testMonitor.memoryHistory.push({
                    heapUsed: i * 2 * 1024 * 1024, // 2MB growth per check
                    timestamp: Date.now() + i * 1000
                });
            }

            testMonitor.on('memory:leak-detected', (trend) => {
                expect(trend.isIncreasing).toBe(true);
                done();
            });

            testMonitor.performMemoryAnalysis();
        });
    });

    describe('Auto-Optimization', () => {
        test('should select optimal algorithm based on conditions', () => {
            // Mock high memory usage
            testMonitor.metrics.system.memory.push({
                heapUsed: 800 * 1024 * 1024,
                heapSizeLimit: 1000 * 1024 * 1024,
                timestamp: Date.now()
            });

            const optimization = testMonitor.selectOptimalAlgorithm();
            expect(optimization.algorithm).toBe('memory-efficient');
        });

        test('should optimize cache size based on performance', () => {
            testMonitor.metrics.cache.hitRate = 0.5; // Low hit rate
            testMonitor.metrics.cache.size = 10000;

            const optimization = testMonitor.optimizeCacheSize();
            expect(optimization).not.toBeNull();
            expect(optimization.type).toBe('cache-size-increase');
        });

        test('should emit optimization events', (done) => {
            testMonitor.on('optimization:performed', (optimizations) => {
                expect(Array.isArray(optimizations)).toBe(true);
                done();
            });

            // Trigger optimization
            testMonitor.performAutoOptimization();
        });
    });

    describe('Performance Reports', () => {
        test('should generate comprehensive performance report', () => {
            // Add some test data
            testMonitor.trackResponseTime('/api/test', Date.now() - 100);
            testMonitor.trackCacheHit('key1', true);
            testMonitor.trackDatabaseQuery('SELECT 1', 50);

            const report = testMonitor.generatePerformanceReport();

            expect(report.timestamp).toBeGreaterThan(0);
            expect(report.system).toBeDefined();
            expect(report.performance).toBeDefined();
            expect(report.cache).toBeDefined();
            expect(report.database).toBeDefined();
            expect(report.optimization).toBeDefined();
        });

        test('should calculate throughput correctly', () => {
            testMonitor.metrics.performance.throughput.requests = 100;
            testMonitor.metrics.performance.throughput.startTime = Date.now() - 10000; // 10 seconds ago

            const throughput = testMonitor.calculateThroughput();
            expect(throughput).toBeCloseTo(10, 1); // ~10 requests per second
        });

        test('should identify slow endpoints', () => {
            testMonitor.trackResponseTime('/api/fast', Date.now() - 100);
            testMonitor.trackResponseTime('/api/slow', Date.now() - 3000);

            const slowEndpoints = testMonitor.getSlowEndpoints();
            expect(slowEndpoints.length).toBeGreaterThan(0);
            expect(slowEndpoints[0].endpoint).toBe('/api/slow');
        });
    });

    describe('Middleware Integration', () => {
        test('should provide Express middleware', () => {
            expect(typeof monitor.middleware).toBe('function');
            expect(monitor.middleware.length).toBe(3); // req, res, next
        });

        test('should provide database query wrapper', () => {
            expect(typeof monitor.wrapDatabaseQuery).toBe('function');
            
            const mockQuery = jest.fn().mockResolvedValue('result');
            const wrappedQuery = monitor.wrapDatabaseQuery(mockQuery);
            
            expect(typeof wrappedQuery).toBe('function');
        });
    });

    describe('Configuration and Control', () => {
        test('should respect configuration options', () => {
            const customMonitor = new PerformanceMonitor({
                memoryThreshold: 0.9,
                cpuThreshold: 0.7,
                enableAutoOptimization: false
            });

            expect(customMonitor.config.memoryThreshold).toBe(0.9);
            expect(customMonitor.config.cpuThreshold).toBe(0.7);
            expect(customMonitor.config.enableAutoOptimization).toBe(false);

            customMonitor.stop();
        });

        test('should stop monitoring properly', (done) => {
            testMonitor.on('monitoring:stopped', () => {
                expect(testMonitor.isMonitoring).toBe(false);
                expect(testMonitor.intervals.size).toBe(0);
                done();
            });

            testMonitor.stop();
        });

        test('should provide metrics snapshot', () => {
            const snapshot = testMonitor.getMetricsSnapshot();
            
            expect(snapshot.timestamp).toBeGreaterThan(0);
            expect(snapshot.system).toBeDefined();
            expect(snapshot.performance).toBeDefined();
            expect(snapshot.cache).toBeDefined();
            expect(snapshot.database).toBeDefined();
        });
    });
});

// Integration test example
describe('Performance Monitor Integration', () => {
    test('should work with real Express app', async () => {
        const express = require('express');
        const app = express();

        // Use the performance monitoring middleware
        app.use(monitor.middleware);

        app.get('/test', (req, res) => {
            setTimeout(() => {
                res.json({ success: true });
            }, 100);
        });

        // Simulate request
        const request = require('supertest');
        await request(app).get('/test').expect(200);

        // Check that metrics were recorded
        setTimeout(() => {
            expect(monitor.metrics.performance.responseTimes.has('GET /test')).toBe(true);
        }, 200);
    });
});

module.exports = {
    // Export test utilities for other test files
    createTestMonitor: (config = {}) => new PerformanceMonitor({
        systemMetricsInterval: 100,
        memoryCheckInterval: 100,
        enableAutoOptimization: false,
        ...config
    })
};