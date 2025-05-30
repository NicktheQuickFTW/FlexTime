const EventEmitter = require('events');
const os = require('os');
const v8 = require('v8');

/**
 * Advanced Memory Management System for FlexTime Engine
 * 
 * Features:
 * - Object pooling for game/constraint objects
 * - Garbage collection optimization
 * - Memory pressure detection
 * - Automatic cache eviction
 * - Memory leak prevention
 * - Resource cleanup automation
 * - Performance analytics and monitoring
 * 
 * @class MemoryManager
 * @extends EventEmitter
 */
class MemoryManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Pool Configuration
            maxPoolSizes: {
                game: options.maxGamePoolSize || 1000,
                constraint: options.maxConstraintPoolSize || 2000,
                schedule: options.maxSchedulePoolSize || 100,
                team: options.maxTeamPoolSize || 50,
                venue: options.maxVenuePoolSize || 200
            },
            
            // Memory Thresholds
            memoryThresholds: {
                warning: options.warningThreshold || 0.8,  // 80% of heap limit
                critical: options.criticalThreshold || 0.9, // 90% of heap limit
                emergency: options.emergencyThreshold || 0.95 // 95% of heap limit
            },
            
            // GC Configuration
            gcConfig: {
                forceGCInterval: options.gcInterval || 300000, // 5 minutes
                enableOptimizations: options.enableGCOptimizations !== false,
                maxOldSpaceSize: options.maxOldSpaceSize || 8192 // 8GB
            },
            
            // Monitoring
            monitoring: {
                enabled: options.enableMonitoring !== false,
                interval: options.monitoringInterval || 30000, // 30 seconds
                retentionPeriod: options.retentionPeriod || 3600000 // 1 hour
            },
            
            // Cache Management
            cache: {
                maxSize: options.maxCacheSize || 10000,
                ttl: options.cacheTTL || 900000, // 15 minutes
                evictionPolicy: options.evictionPolicy || 'LRU'
            }
        };
        
        // Object Pools
        this.pools = {
            game: new ObjectPool('game', this.config.maxPoolSizes.game),
            constraint: new ObjectPool('constraint', this.config.maxPoolSizes.constraint),
            schedule: new ObjectPool('schedule', this.config.maxPoolSizes.schedule),
            team: new ObjectPool('team', this.config.maxPoolSizes.team),
            venue: new ObjectPool('venue', this.config.maxPoolSizes.venue)
        };
        
        // Memory Analytics
        this.analytics = {
            memoryUsage: [],
            gcEvents: [],
            poolStats: {},
            leakDetection: new Map(),
            performanceMetrics: {
                allocationsPerSecond: 0,
                deallocationsPerSecond: 0,
                poolHitRate: 0,
                fragmentationIndex: 0
            }
        };
        
        // Cache Management
        this.cache = new LRUCache(this.config.cache.maxSize, this.config.cache.ttl);
        
        // Weak References for leak detection
        this.weakRefs = new Set();
        this.allocatedObjects = new Map();
        
        // Memory pressure state
        this.memoryPressure = {
            level: 'normal', // normal, warning, critical, emergency
            lastCheck: Date.now(),
            consecutiveWarnings: 0
        };
        
        // Performance counters
        this.counters = {
            allocations: 0,
            deallocations: 0,
            poolHits: 0,
            poolMisses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            gcTriggers: 0,
            memoryLeaksDetected: 0
        };
        
        this.isInitialized = false;
        this.isShuttingDown = false;
        
        // Bind methods
        this.handleMemoryPressure = this.handleMemoryPressure.bind(this);
        this.performGarbageCollection = this.performGarbageCollection.bind(this);
        this.monitorMemory = this.monitorMemory.bind(this);
    }
    
    /**
     * Initialize the memory manager
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        
        try {
            console.log('🧠 Initializing FlexTime Memory Manager...');
            
            // Set up V8 flags for optimization
            if (this.config.gcConfig.enableOptimizations) {
                this.optimizeV8Settings();
            }
            
            // Initialize object pools
            await this.initializePools();
            
            // Start monitoring
            if (this.config.monitoring.enabled) {
                this.startMonitoring();
            }
            
            // Set up garbage collection optimization
            this.setupGarbageCollection();
            
            // Set up memory pressure detection
            this.setupMemoryPressureDetection();
            
            // Set up leak detection
            this.setupLeakDetection();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('✅ Memory Manager initialized successfully');
            console.log(`📊 Pool sizes: ${JSON.stringify(this.config.maxPoolSizes)}`);
            console.log(`🎯 Memory thresholds: ${JSON.stringify(this.config.memoryThresholds)}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Memory Manager:', error);
            throw error;
        }
    }
    
    /**
     * Optimize V8 settings for performance
     */
    optimizeV8Settings() {
        try {
            // Enable optimization flags
            const flags = [
                '--max-old-space-size=' + this.config.gcConfig.maxOldSpaceSize,
                '--optimize-for-size',
                '--gc-interval=100',
                '--expose-gc'
            ];
            
            console.log(`🔧 V8 optimization flags applied: ${flags.join(' ')}`);
        } catch (error) {
            console.warn('⚠️ Could not apply some V8 optimizations:', error.message);
        }
    }
    
    /**
     * Initialize object pools
     */
    async initializePools() {
        for (const [type, pool] of Object.entries(this.pools)) {
            await pool.initialize();
            console.log(`🏊 ${type} pool initialized with max size: ${pool.maxSize}`);
        }
    }
    
    /**
     * Start memory monitoring
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(this.monitorMemory, this.config.monitoring.interval);
        console.log(`📊 Memory monitoring started (interval: ${this.config.monitoring.interval}ms)`);
    }
    
    /**
     * Setup garbage collection optimization
     */
    setupGarbageCollection() {
        // Force periodic GC
        this.gcInterval = setInterval(this.performGarbageCollection, this.config.gcConfig.forceGCInterval);
        
        // Listen for GC events if available
        if (typeof gc !== 'undefined') {
            const originalGC = global.gc;
            global.gc = () => {
                const start = process.hrtime.bigint();
                originalGC();
                const duration = Number(process.hrtime.bigint() - start) / 1e6;
                
                this.analytics.gcEvents.push({
                    timestamp: Date.now(),
                    duration,
                    type: 'manual'
                });
                
                this.counters.gcTriggers++;
                this.emit('gc', { duration, type: 'manual' });
            };
        }
    }
    
    /**
     * Setup memory pressure detection
     */
    setupMemoryPressureDetection() {
        // Check memory pressure more frequently during high usage
        this.pressureCheckInterval = setInterval(this.handleMemoryPressure, 10000); // 10 seconds
    }
    
    /**
     * Setup memory leak detection
     */
    setupLeakDetection() {
        // Periodic leak detection
        this.leakDetectionInterval = setInterval(() => {
            this.detectMemoryLeaks();
        }, 60000); // 1 minute
    }
    
    /**
     * Get an object from the pool
     */
    getFromPool(type, factory = null) {
        const pool = this.pools[type];
        if (!pool) {
            throw new Error(`Unknown pool type: ${type}`);
        }
        
        const obj = pool.acquire(factory);
        
        if (obj) {
            this.counters.poolHits++;
            this.counters.allocations++;
            
            // Track allocation for leak detection
            this.trackAllocation(obj, type);
        } else {
            this.counters.poolMisses++;
        }
        
        return obj;
    }
    
    /**
     * Return an object to the pool
     */
    returnToPool(type, obj) {
        const pool = this.pools[type];
        if (!pool) {
            throw new Error(`Unknown pool type: ${type}`);
        }
        
        // Clean the object
        this.cleanObject(obj);
        
        // Return to pool
        const returned = pool.release(obj);
        
        if (returned) {
            this.counters.deallocations++;
            this.untrackAllocation(obj);
        }
        
        return returned;
    }
    
    /**
     * Track object allocation for leak detection
     */
    trackAllocation(obj, type) {
        const id = this.generateObjectId(obj);
        this.allocatedObjects.set(id, {
            type,
            timestamp: Date.now(),
            stackTrace: this.captureStackTrace()
        });
        
        // Create weak reference for GC tracking
        const weakRef = new WeakRef(obj);
        this.weakRefs.add(weakRef);
    }
    
    /**
     * Untrack object allocation
     */
    untrackAllocation(obj) {
        const id = this.generateObjectId(obj);
        this.allocatedObjects.delete(id);
    }
    
    /**
     * Clean an object before returning to pool
     */
    cleanObject(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        // Clear all enumerable properties
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (Array.isArray(obj[key])) {
                    obj[key].length = 0;
                } else if (obj[key] && typeof obj[key] === 'object') {
                    obj[key] = null;
                } else {
                    delete obj[key];
                }
            }
        }
    }
    
    /**
     * Monitor memory usage and pressure
     */
    monitorMemory() {
        const memUsage = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        const osStats = {
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg()
        };
        
        const memoryData = {
            timestamp: Date.now(),
            process: memUsage,
            heap: heapStats,
            os: osStats,
            pools: this.getPoolStats(),
            cache: this.cache.getStats(),
            pressure: this.memoryPressure.level
        };
        
        // Store analytics
        this.analytics.memoryUsage.push(memoryData);
        
        // Cleanup old analytics data
        this.cleanupAnalytics();
        
        // Update performance metrics
        this.updatePerformanceMetrics(memoryData);
        
        // Emit memory status
        this.emit('memoryStatus', memoryData);
        
        // Check for memory pressure
        this.checkMemoryPressure(memoryData);
    }
    
    /**
     * Handle memory pressure
     */
    handleMemoryPressure() {
        const memUsage = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        
        const heapUsedRatio = memUsage.heapUsed / heapStats.heap_size_limit;
        const previousLevel = this.memoryPressure.level;
        
        // Determine pressure level
        if (heapUsedRatio >= this.config.memoryThresholds.emergency) {
            this.memoryPressure.level = 'emergency';
        } else if (heapUsedRatio >= this.config.memoryThresholds.critical) {
            this.memoryPressure.level = 'critical';
        } else if (heapUsedRatio >= this.config.memoryThresholds.warning) {
            this.memoryPressure.level = 'warning';
        } else {
            this.memoryPressure.level = 'normal';
            this.memoryPressure.consecutiveWarnings = 0;
        }
        
        // Handle pressure level changes
        if (this.memoryPressure.level !== previousLevel) {
            this.emit('pressureChange', {
                from: previousLevel,
                to: this.memoryPressure.level,
                heapUsedRatio
            });
        }
        
        // Take action based on pressure level
        switch (this.memoryPressure.level) {
            case 'warning':
                this.memoryPressure.consecutiveWarnings++;
                if (this.memoryPressure.consecutiveWarnings >= 3) {
                    this.handleWarningPressure();
                }
                break;
                
            case 'critical':
                this.handleCriticalPressure();
                break;
                
            case 'emergency':
                this.handleEmergencyPressure();
                break;
        }
        
        this.memoryPressure.lastCheck = Date.now();
    }
    
    /**
     * Handle warning level memory pressure
     */
    handleWarningPressure() {
        console.warn('⚠️ Memory pressure warning - initiating cleanup');
        
        // Clear cache partially
        this.cache.evict(0.3); // Evict 30% of cache
        
        // Trigger minor GC
        this.performGarbageCollection();
        
        this.emit('memoryCleanup', { level: 'warning', action: 'cache_eviction' });
    }
    
    /**
     * Handle critical level memory pressure
     */
    handleCriticalPressure() {
        console.error('🚨 Critical memory pressure - aggressive cleanup');
        
        // Clear cache significantly
        this.cache.evict(0.6); // Evict 60% of cache
        
        // Clear pool overflow
        for (const pool of Object.values(this.pools)) {
            pool.trim(0.5); // Trim pools to 50% capacity
        }
        
        // Force major GC
        this.performGarbageCollection(true);
        
        this.emit('memoryCleanup', { level: 'critical', action: 'aggressive_cleanup' });
    }
    
    /**
     * Handle emergency level memory pressure
     */
    handleEmergencyPressure() {
        console.error('🆘 Emergency memory pressure - emergency cleanup');
        
        // Clear all caches
        this.cache.clear();
        
        // Trim pools to minimum
        for (const pool of Object.values(this.pools)) {
            pool.trim(0.2); // Trim pools to 20% capacity
        }
        
        // Force immediate GC
        this.performGarbageCollection(true);
        
        // Emit emergency event
        this.emit('memoryEmergency', {
            level: 'emergency',
            action: 'emergency_cleanup',
            timestamp: Date.now()
        });
    }
    
    /**
     * Perform garbage collection
     */
    performGarbageCollection(force = false) {
        if (typeof gc === 'undefined' && !force) {
            return;
        }
        
        const start = process.hrtime.bigint();
        
        try {
            if (typeof gc !== 'undefined') {
                gc();
            }
            
            const duration = Number(process.hrtime.bigint() - start) / 1e6;
            
            this.analytics.gcEvents.push({
                timestamp: Date.now(),
                duration,
                type: force ? 'forced' : 'scheduled'
            });
            
            this.counters.gcTriggers++;
            this.emit('gc', { duration, type: force ? 'forced' : 'scheduled' });
            
            console.log(`🗑️ Garbage collection completed in ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('❌ Garbage collection failed:', error);
        }
    }
    
    /**
     * Detect memory leaks
     */
    detectMemoryLeaks() {
        const now = Date.now();
        const leakThreshold = 300000; // 5 minutes
        const leaks = [];
        
        // Check allocated objects that haven't been deallocated
        for (const [id, allocation] of this.allocatedObjects) {
            if (now - allocation.timestamp > leakThreshold) {
                leaks.push({
                    id,
                    type: allocation.type,
                    age: now - allocation.timestamp,
                    stackTrace: allocation.stackTrace
                });
            }
        }
        
        // Clean up dead weak references
        const deadRefs = [];
        for (const weakRef of this.weakRefs) {
            if (weakRef.deref() === undefined) {
                deadRefs.push(weakRef);
            }
        }
        
        deadRefs.forEach(ref => this.weakRefs.delete(ref));
        
        if (leaks.length > 0) {
            this.counters.memoryLeaksDetected += leaks.length;
            console.warn(`🔍 Detected ${leaks.length} potential memory leaks`);
            this.emit('memoryLeaks', leaks);
        }
        
        return leaks;
    }
    
    /**
     * Get pool statistics
     */
    getPoolStats() {
        const stats = {};
        for (const [type, pool] of Object.entries(this.pools)) {
            stats[type] = pool.getStats();
        }
        return stats;
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(memoryData) {
        const now = Date.now();
        const timeDiff = (now - (this.lastMetricsUpdate || now)) / 1000; // seconds
        
        if (timeDiff > 0) {
            // Calculate rates
            this.analytics.performanceMetrics.allocationsPerSecond = 
                this.counters.allocations / timeDiff;
            this.analytics.performanceMetrics.deallocationsPerSecond = 
                this.counters.deallocations / timeDiff;
            
            // Calculate pool hit rate
            const totalPoolRequests = this.counters.poolHits + this.counters.poolMisses;
            this.analytics.performanceMetrics.poolHitRate = 
                totalPoolRequests > 0 ? this.counters.poolHits / totalPoolRequests : 0;
            
            // Calculate fragmentation index
            this.analytics.performanceMetrics.fragmentationIndex = 
                this.calculateFragmentationIndex(memoryData);
        }
        
        this.lastMetricsUpdate = now;
    }
    
    /**
     * Calculate memory fragmentation index
     */
    calculateFragmentationIndex(memoryData) {
        const { heap } = memoryData;
        if (!heap) return 0;
        
        const usedRatio = heap.used_heap_size / heap.total_heap_size;
        const availableRatio = heap.total_available_size / heap.heap_size_limit;
        
        // Simple fragmentation metric
        return Math.max(0, 1 - (usedRatio * availableRatio));
    }
    
    /**
     * Cleanup old analytics data
     */
    cleanupAnalytics() {
        const now = Date.now();
        const retentionPeriod = this.config.monitoring.retentionPeriod;
        
        // Cleanup memory usage data
        this.analytics.memoryUsage = this.analytics.memoryUsage.filter(
            data => now - data.timestamp < retentionPeriod
        );
        
        // Cleanup GC events
        this.analytics.gcEvents = this.analytics.gcEvents.filter(
            event => now - event.timestamp < retentionPeriod
        );
    }
    
    /**
     * Generate unique object ID
     */
    generateObjectId(obj) {
        return `${typeof obj}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Capture stack trace for debugging
     */
    captureStackTrace() {
        const stack = new Error().stack;
        return stack ? stack.split('\n').slice(2, 6) : [];
    }
    
    /**
     * Check memory pressure
     */
    checkMemoryPressure(memoryData) {
        const heapUsedRatio = memoryData.process.heapUsed / memoryData.heap.heap_size_limit;
        
        if (heapUsedRatio >= this.config.memoryThresholds.warning) {
            this.handleMemoryPressure();
        }
    }
    
    /**
     * Get comprehensive memory statistics
     */
    getMemoryStats() {
        return {
            pools: this.getPoolStats(),
            cache: this.cache.getStats(),
            counters: { ...this.counters },
            pressure: { ...this.memoryPressure },
            performance: { ...this.analytics.performanceMetrics },
            system: {
                process: process.memoryUsage(),
                heap: v8.getHeapStatistics(),
                os: {
                    totalMemory: os.totalmem(),
                    freeMemory: os.freemem(),
                    loadAverage: os.loadavg()
                }
            }
        };
    }
    
    /**
     * Shutdown the memory manager
     */
    async shutdown() {
        if (this.isShuttingDown) {
            return;
        }
        
        console.log('🛑 Shutting down Memory Manager...');
        this.isShuttingDown = true;
        
        // Clear intervals
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
        if (this.pressureCheckInterval) {
            clearInterval(this.pressureCheckInterval);
        }
        if (this.leakDetectionInterval) {
            clearInterval(this.leakDetectionInterval);
        }
        
        // Clear pools
        for (const pool of Object.values(this.pools)) {
            pool.clear();
        }
        
        // Clear cache
        this.cache.clear();
        
        // Final cleanup
        this.cleanupAnalytics();
        
        this.emit('shutdown');
        console.log('✅ Memory Manager shutdown complete');
    }
}

/**
 * Object Pool Implementation
 */
class ObjectPool {
    constructor(type, maxSize = 1000) {
        this.type = type;
        this.maxSize = maxSize;
        this.available = [];
        this.inUse = new Set();
        this.created = 0;
        this.stats = {
            acquisitions: 0,
            releases: 0,
            creates: 0,
            destroys: 0
        };
    }
    
    async initialize() {
        // Pre-populate with some objects
        const initialSize = Math.min(Math.floor(this.maxSize * 0.1), 10);
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createObject());
        }
    }
    
    acquire(factory = null) {
        this.stats.acquisitions++;
        
        let obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else if (this.created < this.maxSize) {
            obj = factory ? factory() : this.createObject();
            this.created++;
            this.stats.creates++;
        } else {
            return null; // Pool exhausted
        }
        
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (!this.inUse.has(obj)) {
            return false;
        }
        
        this.inUse.delete(obj);
        this.stats.releases++;
        
        if (this.available.length < this.maxSize) {
            this.available.push(obj);
            return true;
        } else {
            this.stats.destroys++;
            return false;
        }
    }
    
    createObject() {
        switch (this.type) {
            case 'game':
                return {
                    id: null,
                    homeTeam: null,
                    awayTeam: null,
                    venue: null,
                    date: null,
                    time: null,
                    sport: null,
                    constraints: [],
                    metadata: {}
                };
            case 'constraint':
                return {
                    id: null,
                    type: null,
                    priority: null,
                    parameters: {},
                    evaluation: null,
                    violations: []
                };
            case 'schedule':
                return {
                    id: null,
                    games: [],
                    constraints: [],
                    score: null,
                    metadata: {},
                    conflicts: []
                };
            case 'team':
                return {
                    id: null,
                    name: null,
                    sport: null,
                    venue: null,
                    preferences: {},
                    availability: []
                };
            case 'venue':
                return {
                    id: null,
                    name: null,
                    capacity: null,
                    location: null,
                    availability: [],
                    facilities: []
                };
            default:
                return {};
        }
    }
    
    trim(ratio = 0.5) {
        const targetSize = Math.floor(this.available.length * ratio);
        const toRemove = this.available.length - targetSize;
        
        if (toRemove > 0) {
            this.available.splice(0, toRemove);
            this.stats.destroys += toRemove;
        }
    }
    
    clear() {
        this.available.length = 0;
        this.inUse.clear();
        this.created = 0;
    }
    
    getStats() {
        return {
            type: this.type,
            maxSize: this.maxSize,
            available: this.available.length,
            inUse: this.inUse.size,
            created: this.created,
            utilization: this.created / this.maxSize,
            ...this.stats
        };
    }
}

/**
 * LRU Cache Implementation with TTL
 */
class LRUCache {
    constructor(maxSize = 10000, ttl = 900000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            expired: 0
        };
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        // Check TTL
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            this.stats.expired++;
            this.stats.misses++;
            return null;
        }
        
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        this.stats.hits++;
        
        return item.value;
    }
    
    set(key, value) {
        // Remove if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        
        // Check size limit
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        
        // Add new item
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    evictLRU() {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
            this.cache.delete(firstKey);
            this.stats.evictions++;
        }
    }
    
    evict(ratio = 0.3) {
        const toEvict = Math.floor(this.cache.size * ratio);
        const keys = Array.from(this.cache.keys()).slice(0, toEvict);
        
        keys.forEach(key => {
            this.cache.delete(key);
            this.stats.evictions++;
        });
    }
    
    clear() {
        this.cache.clear();
    }
    
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            ...this.stats
        };
    }
}

module.exports = MemoryManager;