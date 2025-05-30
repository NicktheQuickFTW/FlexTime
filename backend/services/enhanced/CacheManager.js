/**
 * FlexTime Engine - Multi-Level Cache Manager
 * 
 * Provides comprehensive caching optimization with:
 * - L1: In-memory cache with LRU eviction
 * - L2: Redis distributed cache  
 * - L3: Database query result cache
 * - Intelligent cache warming
 * - Cache invalidation strategies
 * - Predictive pre-loading
 * - Real-time analytics and monitoring
 * 
 * @author FlexTime Engine Performance Team
 * @version 1.0.0
 */

const Redis = require('redis');
const EventEmitter = require('events');

class CacheManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // L1 Cache Configuration
            l1MaxSize: options.l1MaxSize || 1000,
            l1TTL: options.l1TTL || 300000, // 5 minutes
            
            // L2 Cache Configuration
            l2TTL: options.l2TTL || 1800000, // 30 minutes
            l2MaxMemory: options.l2MaxMemory || '100mb',
            
            // L3 Cache Configuration
            l3TTL: options.l3TTL || 3600000, // 1 hour
            
            // Performance Configuration
            warmupEnabled: options.warmupEnabled !== false,
            predictiveEnabled: options.predictiveEnabled !== false,
            analyticsEnabled: options.analyticsEnabled !== false,
            
            // Cache Strategies
            evictionPolicy: options.evictionPolicy || 'lru',
            invalidationStrategy: options.invalidationStrategy || 'smart',
            
            // Redis Configuration
            redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
        };
        
        // Initialize cache layers
        this.l1Cache = new Map(); // In-memory LRU cache
        this.l1AccessOrder = new Map(); // Track access order for LRU
        this.l1Stats = { hits: 0, misses: 0, evictions: 0 };
        
        this.l2Cache = null; // Redis client
        this.l2Stats = { hits: 0, misses: 0, errors: 0 };
        
        this.l3Stats = { hits: 0, misses: 0, queries: 0 };
        
        // Analytics and monitoring
        this.analytics = {
            totalRequests: 0,
            totalHits: 0,
            totalMisses: 0,
            hitRatio: 0,
            avgResponseTime: 0,
            responseTimes: [],
            cacheSize: { l1: 0, l2: 0, l3: 0 },
            lastUpdated: new Date()
        };
        
        // Cache warming patterns
        this.warmupPatterns = new Set();
        this.predictivePatterns = new Map();
        
        // Performance monitoring
        this.performanceHistory = [];
        this.invalidationQueues = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize Redis connection
            this.l2Cache = Redis.createClient({ url: this.config.redisUrl });
            
            this.l2Cache.on('error', (err) => {
                console.error('Redis Cache Error:', err);
                this.l2Stats.errors++;
                this.emit('cache-error', { layer: 'l2', error: err });
            });
            
            this.l2Cache.on('connect', () => {
                console.log('✅ L2 Cache (Redis) connected successfully');
                this.emit('cache-ready', { layer: 'l2' });
            });
            
            await this.l2Cache.connect();
            
            // Configure Redis memory management
            await this.l2Cache.configSet('maxmemory', this.config.l2MaxMemory);
            await this.l2Cache.configSet('maxmemory-policy', 'allkeys-lru');
            
            // Start background tasks
            if (this.config.analyticsEnabled) {
                this.startAnalyticsCollection();
            }
            
            if (this.config.warmupEnabled) {
                this.startCacheWarming();
            }
            
            if (this.config.predictiveEnabled) {
                this.startPredictivePreloading();
            }
            
            console.log('🚀 FlexTime Cache Manager initialized successfully');
            this.emit('manager-ready');
            
        } catch (error) {
            console.error('❌ Cache Manager initialization failed:', error);
            this.emit('initialization-error', error);
            throw error;
        }
    }
    
    /**
     * Get value from cache with multi-level fallback
     */
    async get(key, options = {}) {
        const startTime = Date.now();
        let result = null;
        let source = null;
        
        try {
            this.analytics.totalRequests++;
            
            // L1 Cache check (In-memory)
            if (this.l1Cache.has(key)) {
                result = this.l1Cache.get(key);
                if (this.isValidCacheEntry(result, this.config.l1TTL)) {
                    this.updateL1AccessOrder(key);
                    this.l1Stats.hits++;
                    source = 'l1';
                } else {
                    this.l1Cache.delete(key);
                    this.l1AccessOrder.delete(key);
                }
            }
            
            // L2 Cache check (Redis)
            if (!result && this.l2Cache) {
                try {
                    const l2Data = await this.l2Cache.get(key);
                    if (l2Data) {
                        result = JSON.parse(l2Data);
                        if (this.isValidCacheEntry(result, this.config.l2TTL)) {
                            // Promote to L1 cache
                            this.setL1(key, result);
                            this.l2Stats.hits++;
                            source = 'l2';
                        } else {
                            await this.l2Cache.del(key);
                        }
                    }
                } catch (error) {
                    console.error('L2 Cache read error:', error);
                    this.l2Stats.errors++;
                }
            }
            
            // L3 Cache check (Database query cache)
            if (!result && options.l3Enabled) {
                result = await this.getFromL3(key, options);
                if (result) {
                    // Promote to higher cache levels
                    await this.setL2(key, result);
                    this.setL1(key, result);
                    this.l3Stats.hits++;
                    source = 'l3';
                }
            }
            
            // Update analytics
            const responseTime = Date.now() - startTime;
            this.updateAnalytics(!!result, responseTime, source);
            
            // Record access pattern for predictive caching
            if (this.config.predictiveEnabled) {
                this.recordAccessPattern(key, !!result);
            }
            
            return result ? result.data : null;
            
        } catch (error) {
            console.error('Cache get error:', error);
            this.emit('cache-error', { operation: 'get', key, error });
            return null;
        }
    }
    
    /**
     * Set value in all cache levels
     */
    async set(key, value, options = {}) {
        try {
            const cacheEntry = {
                data: value,
                timestamp: Date.now(),
                ttl: options.ttl || this.config.l1TTL,
                tags: options.tags || [],
                priority: options.priority || 'normal'
            };
            
            // Set in L1 cache
            this.setL1(key, cacheEntry);
            
            // Set in L2 cache
            if (this.l2Cache && options.l2Enabled !== false) {
                await this.setL2(key, cacheEntry);
            }
            
            // Set in L3 cache if enabled
            if (options.l3Enabled) {
                await this.setL3(key, cacheEntry, options);
            }
            
            // Register for cache warming if priority is high
            if (options.priority === 'high' && this.config.warmupEnabled) {
                this.warmupPatterns.add(key);
            }
            
            this.emit('cache-set', { key, layer: 'all', size: this.estimateSize(value) });
            
        } catch (error) {
            console.error('Cache set error:', error);
            this.emit('cache-error', { operation: 'set', key, error });
        }
    }
    
    /**
     * Intelligent cache invalidation
     */
    async invalidate(pattern, options = {}) {
        try {
            const strategy = options.strategy || this.config.invalidationStrategy;
            const keys = await this.findKeysMatching(pattern);
            
            switch (strategy) {
                case 'immediate':
                    await this.immediateInvalidation(keys);
                    break;
                case 'lazy':
                    await this.lazyInvalidation(keys);
                    break;
                case 'smart':
                    await this.smartInvalidation(keys, options);
                    break;
                case 'batch':
                    await this.batchInvalidation(keys, options);
                    break;
            }
            
            this.emit('cache-invalidated', { pattern, strategy, keysCount: keys.length });
            
        } catch (error) {
            console.error('Cache invalidation error:', error);
            this.emit('cache-error', { operation: 'invalidate', pattern, error });
        }
    }
    
    /**
     * L1 Cache Management (In-Memory LRU)
     */
    setL1(key, value) {
        // Check if we need to evict
        if (this.l1Cache.size >= this.config.l1MaxSize) {
            this.evictL1();
        }
        
        this.l1Cache.set(key, value);
        this.updateL1AccessOrder(key);
        this.analytics.cacheSize.l1 = this.l1Cache.size;
    }
    
    evictL1() {
        // Remove least recently used item
        const oldestKey = this.l1AccessOrder.keys().next().value;
        if (oldestKey) {
            this.l1Cache.delete(oldestKey);
            this.l1AccessOrder.delete(oldestKey);
            this.l1Stats.evictions++;
        }
    }
    
    updateL1AccessOrder(key) {
        // Remove and re-add to maintain LRU order
        this.l1AccessOrder.delete(key);
        this.l1AccessOrder.set(key, Date.now());
    }
    
    /**
     * L2 Cache Management (Redis)
     */
    async setL2(key, value) {
        if (!this.l2Cache) return;
        
        try {
            const ttlSeconds = Math.floor(this.config.l2TTL / 1000);
            await this.l2Cache.setEx(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('L2 Cache set error:', error);
            this.l2Stats.errors++;
        }
    }
    
    /**
     * L3 Cache Management (Database Query Cache)
     */
    async getFromL3(key, options) {
        // Simulate database query caching
        // In real implementation, this would interface with database query cache
        this.l3Stats.queries++;
        return null; // Placeholder
    }
    
    async setL3(key, value, options) {
        // Placeholder for L3 cache implementation
        // Would store in database query result cache
    }
    
    /**
     * Cache Warming System
     */
    startCacheWarming() {
        setInterval(() => {
            this.performCacheWarming();
        }, 300000); // Every 5 minutes
    }
    
    async performCacheWarming() {
        try {
            for (const pattern of this.warmupPatterns) {
                // Warm up high-priority cache entries
                await this.warmupPattern(pattern);
            }
        } catch (error) {
            console.error('Cache warming error:', error);
        }
    }
    
    async warmupPattern(pattern) {
        // Implementation would pre-load frequently accessed data
        // Based on access patterns and priority
        console.log(`🔥 Warming up cache for pattern: ${pattern}`);
    }
    
    /**
     * Predictive Pre-loading
     */
    startPredictivePreloading() {
        setInterval(() => {
            this.performPredictivePreloading();
        }, 600000); // Every 10 minutes
    }
    
    async performPredictivePreloading() {
        try {
            // Analyze access patterns and pre-load likely needed data
            for (const [pattern, stats] of this.predictivePatterns) {
                if (stats.likelihood > 0.7) {
                    await this.preloadPattern(pattern);
                }
            }
        } catch (error) {
            console.error('Predictive preloading error:', error);
        }
    }
    
    recordAccessPattern(key, hit) {
        const pattern = this.extractPattern(key);
        if (!this.predictivePatterns.has(pattern)) {
            this.predictivePatterns.set(pattern, {
                accesses: 0,
                hits: 0,
                likelihood: 0,
                lastAccess: Date.now()
            });
        }
        
        const stats = this.predictivePatterns.get(pattern);
        stats.accesses++;
        if (hit) stats.hits++;
        stats.likelihood = stats.hits / stats.accesses;
        stats.lastAccess = Date.now();
    }
    
    extractPattern(key) {
        // Extract pattern from cache key for predictive analysis
        return key.split(':').slice(0, 2).join(':');
    }
    
    async preloadPattern(pattern) {
        // Implementation would pre-load data based on predicted access
        console.log(`🔮 Predictively pre-loading pattern: ${pattern}`);
    }
    
    /**
     * Cache Invalidation Strategies
     */
    async immediateInvalidation(keys) {
        for (const key of keys) {
            this.l1Cache.delete(key);
            this.l1AccessOrder.delete(key);
            
            if (this.l2Cache) {
                await this.l2Cache.del(key);
            }
        }
    }
    
    async lazyInvalidation(keys) {
        // Mark for lazy deletion - actual deletion happens on next access
        for (const key of keys) {
            const entry = this.l1Cache.get(key);
            if (entry) {
                entry.invalidated = true;
            }
        }
    }
    
    async smartInvalidation(keys, options) {
        // Intelligent invalidation based on usage patterns and priority
        const highPriorityKeys = [];
        const lowPriorityKeys = [];
        
        for (const key of keys) {
            const entry = this.l1Cache.get(key);
            if (entry && entry.priority === 'high') {
                highPriorityKeys.push(key);
            } else {
                lowPriorityKeys.push(key);
            }
        }
        
        // Immediately invalidate low priority, lazy invalidate high priority
        await this.immediateInvalidation(lowPriorityKeys);
        await this.lazyInvalidation(highPriorityKeys);
    }
    
    async batchInvalidation(keys, options) {
        // Queue invalidations and process in batches
        const queueId = options.queueId || 'default';
        if (!this.invalidationQueues.has(queueId)) {
            this.invalidationQueues.set(queueId, []);
        }
        
        this.invalidationQueues.get(queueId).push(...keys);
        
        // Process queue if it reaches batch size
        if (this.invalidationQueues.get(queueId).length >= (options.batchSize || 100)) {
            await this.processBatchInvalidation(queueId);
        }
    }
    
    async processBatchInvalidation(queueId) {
        const keys = this.invalidationQueues.get(queueId) || [];
        await this.immediateInvalidation(keys);
        this.invalidationQueues.set(queueId, []);
    }
    
    /**
     * Analytics and Monitoring
     */
    startAnalyticsCollection() {
        setInterval(() => {
            this.updateCacheAnalytics();
        }, 60000); // Every minute
        
        setInterval(() => {
            this.generatePerformanceReport();
        }, 300000); // Every 5 minutes
    }
    
    updateCacheAnalytics() {
        const totalHits = this.l1Stats.hits + this.l2Stats.hits + this.l3Stats.hits;
        const totalMisses = this.l1Stats.misses + this.l2Stats.misses + this.l3Stats.misses;
        
        this.analytics.totalHits = totalHits;
        this.analytics.totalMisses = totalMisses;
        this.analytics.hitRatio = totalHits / (totalHits + totalMisses) || 0;
        
        if (this.analytics.responseTimes.length > 0) {
            this.analytics.avgResponseTime = 
                this.analytics.responseTimes.reduce((a, b) => a + b, 0) / 
                this.analytics.responseTimes.length;
        }
        
        this.analytics.cacheSize.l1 = this.l1Cache.size;
        this.analytics.lastUpdated = new Date();
        
        // Keep only last 1000 response times for memory efficiency
        if (this.analytics.responseTimes.length > 1000) {
            this.analytics.responseTimes = this.analytics.responseTimes.slice(-1000);
        }
    }
    
    updateAnalytics(hit, responseTime, source) {
        if (hit) {
            this.analytics.totalHits++;
        } else {
            this.analytics.totalMisses++;
            if (source === 'l1') this.l1Stats.misses++;
            else if (source === 'l2') this.l2Stats.misses++;
            else if (source === 'l3') this.l3Stats.misses++;
        }
        
        this.analytics.responseTimes.push(responseTime);
    }
    
    generatePerformanceReport() {
        const report = {
            timestamp: new Date(),
            performance: {
                hitRatio: this.analytics.hitRatio,
                avgResponseTime: this.analytics.avgResponseTime,
                totalRequests: this.analytics.totalRequests
            },
            cacheStats: {
                l1: { ...this.l1Stats, size: this.l1Cache.size },
                l2: { ...this.l2Stats },
                l3: { ...this.l3Stats }
            },
            recommendations: this.generateOptimizationRecommendations()
        };
        
        this.performanceHistory.push(report);
        
        // Keep only last 100 reports
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }
        
        this.emit('performance-report', report);
        
        console.log(`📊 Cache Performance Report:
  Hit Ratio: ${(report.performance.hitRatio * 100).toFixed(2)}%
  Avg Response Time: ${report.performance.avgResponseTime.toFixed(2)}ms
  L1 Size: ${report.cacheStats.l1.size} items
  Total Requests: ${report.performance.totalRequests}`);
    }
    
    generateOptimizationRecommendations() {
        const recommendations = [];
        
        if (this.analytics.hitRatio < 0.7) {
            recommendations.push('Consider increasing cache TTL or improving cache warming');
        }
        
        if (this.analytics.avgResponseTime > 100) {
            recommendations.push('High response times detected - consider L1 cache size optimization');
        }
        
        if (this.l1Stats.evictions > this.l1Stats.hits * 0.1) {
            recommendations.push('High L1 eviction rate - consider increasing L1 cache size');
        }
        
        if (this.l2Stats.errors > 10) {
            recommendations.push('Redis connection issues detected - check L2 cache health');
        }
        
        return recommendations;
    }
    
    /**
     * Utility Methods
     */
    isValidCacheEntry(entry, maxAge) {
        if (!entry || !entry.timestamp) return false;
        return (Date.now() - entry.timestamp) < maxAge;
    }
    
    async findKeysMatching(pattern) {
        const keys = [];
        
        // Find L1 keys
        for (const key of this.l1Cache.keys()) {
            if (this.matchesPattern(key, pattern)) {
                keys.push(key);
            }
        }
        
        // Find L2 keys
        if (this.l2Cache) {
            try {
                const redisKeys = await this.l2Cache.keys(pattern);
                keys.push(...redisKeys);
            } catch (error) {
                console.error('Redis keys search error:', error);
            }
        }
        
        return [...new Set(keys)]; // Remove duplicates
    }
    
    matchesPattern(key, pattern) {
        // Simple pattern matching - can be enhanced with regex
        return key.includes(pattern) || pattern.includes('*');
    }
    
    estimateSize(value) {
        // Rough estimation of object size in bytes
        return JSON.stringify(value).length * 2; // Assuming UTF-16
    }
    
    /**
     * Public API Methods
     */
    getStats() {
        return {
            analytics: { ...this.analytics },
            l1Stats: { ...this.l1Stats },
            l2Stats: { ...this.l2Stats },
            l3Stats: { ...this.l3Stats },
            config: { ...this.config }
        };
    }
    
    getPerformanceHistory() {
        return [...this.performanceHistory];
    }
    
    async clearCache(layer = 'all') {
        try {
            if (layer === 'all' || layer === 'l1') {
                this.l1Cache.clear();
                this.l1AccessOrder.clear();
            }
            
            if ((layer === 'all' || layer === 'l2') && this.l2Cache) {
                await this.l2Cache.flushDb();
            }
            
            console.log(`🧹 Cache cleared: ${layer}`);
            this.emit('cache-cleared', { layer });
            
        } catch (error) {
            console.error('Cache clear error:', error);
            this.emit('cache-error', { operation: 'clear', layer, error });
        }
    }
    
    async shutdown() {
        try {
            if (this.l2Cache) {
                await this.l2Cache.quit();
            }
            
            this.l1Cache.clear();
            this.l1AccessOrder.clear();
            
            console.log('🛑 Cache Manager shutdown complete');
            this.emit('shutdown-complete');
            
        } catch (error) {
            console.error('Cache Manager shutdown error:', error);
        }
    }
}

module.exports = CacheManager;