/**
 * ConstraintCache - Multi-level Intelligent Caching System
 * 
 * High-performance caching with:
 * - LRU eviction with TTL
 * - Cache warming and precomputation
 * - Memory-efficient storage
 * - Cache invalidation strategies
 * - Hierarchical caching (schedule, constraint, partial results)
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const logger = require('../scripts/logger");

class ConstraintCache extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxSize: options.maxSize || 10000,
      ttl: options.ttl || 3600000, // 1 hour
      enableWarming: options.enableWarming !== false,
      enableCompression: options.enableCompression !== false,
      maxMemoryMB: options.maxMemoryMB || 500,
      cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
      enableStats: options.enableStats !== false,
      ...options
    };
    
    // Multi-level cache structure
    this.scheduleCache = new Map(); // Full schedule evaluation results
    this.constraintCache = new Map(); // Individual constraint results
    this.partialCache = new Map(); // Partial computation results
    this.metadataCache = new Map(); // Constraint metadata cache
    
    // Cache metadata and statistics
    this.accessTimes = new Map();
    this.hitCounts = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      compressionRatio: 0,
      warmupCount: 0
    };
    
    // Cleanup timer
    this.cleanupTimer = null;
    
    // Initialize
    this._initialize();
  }
  
  /**
   * Initialize cache system
   */
  _initialize() {
    // Start cleanup timer
    if (this.options.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this._performCleanup();
      }, this.options.cleanupInterval);
    }
    
    logger.info(`ConstraintCache initialized with ${this.options.maxSize} max entries, ${this.options.maxMemoryMB}MB limit`);
  }
  
  /**
   * Get cached schedule evaluation result
   */
  async get(scheduleHash) {
    const key = `schedule:${scheduleHash}`;
    return this._getCacheEntry(this.scheduleCache, key);
  }
  
  /**
   * Set cached schedule evaluation result
   */
  async set(scheduleHash, result) {
    const key = `schedule:${scheduleHash}`;
    return this._setCacheEntry(this.scheduleCache, key, result);
  }
  
  /**
   * Get cached constraint evaluation result
   */
  async getConstraint(constraintKey) {
    return this._getCacheEntry(this.constraintCache, constraintKey);
  }
  
  /**
   * Set cached constraint evaluation result
   */
  async setConstraint(constraintKey, result) {
    return this._setCacheEntry(this.constraintCache, constraintKey, result);
  }
  
  /**
   * Get cached partial computation result
   */
  async getPartial(partialKey) {
    return this._getCacheEntry(this.partialCache, partialKey);
  }
  
  /**
   * Set cached partial computation result
   */
  async setPartial(partialKey, result) {
    return this._setCacheEntry(this.partialCache, partialKey, result);
  }
  
  /**
   * Generic cache entry getter with performance tracking
   */
  async _getCacheEntry(cache, key) {
    const entry = cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      cache.delete(key);
      this.accessTimes.delete(key);
      this.hitCounts.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }
    
    // Update access metadata
    this.accessTimes.set(key, Date.now());
    this.hitCounts.set(key, (this.hitCounts.get(key) || 0) + 1);
    this.stats.hits++;
    
    // Decompress if needed
    let data = entry.data;
    if (entry.compressed && this.options.enableCompression) {
      data = await this._decompress(data);
    }
    
    this.emit('cacheHit', { key, cache: cache === this.scheduleCache ? 'schedule' : 'constraint' });
    
    return data;
  }
  
  /**
   * Generic cache entry setter with memory management
   */
  async _setCacheEntry(cache, key, data) {
    try {
      // Check memory limits before adding
      if (!this._canAddEntry(data)) {
        await this._makeSpace(cache);
      }
      
      // Compress if enabled and data is large enough
      let entryData = data;
      let compressed = false;
      
      if (this.options.enableCompression && this._shouldCompress(data)) {
        entryData = await this._compress(data);
        compressed = true;
      }
      
      // Create cache entry
      const entry = {
        data: entryData,
        compressed,
        size: this._calculateSize(entryData),
        createdAt: Date.now(),
        expiresAt: this.options.ttl > 0 ? Date.now() + this.options.ttl : null,
        accessCount: 0
      };
      
      // Store entry
      cache.set(key, entry);
      this.accessTimes.set(key, Date.now());
      this.hitCounts.set(key, 0);
      
      // Update memory usage statistics
      this._updateMemoryStats();
      
      this.emit('cacheSet', { 
        key, 
        size: entry.size, 
        compressed,
        cache: cache === this.scheduleCache ? 'schedule' : 'constraint'
      });
      
      return true;
      
    } catch (error) {
      logger.error(`Failed to cache entry ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Precompute and cache common patterns
   */
  async precompute(key, computation) {
    try {
      this.stats.warmupCount++;
      
      const result = await computation();
      await this.setPartial(key, result);
      
      logger.debug(`Precomputed cache entry: ${key}`);
      this.emit('precomputed', { key });
      
    } catch (error) {
      logger.error(`Failed to precompute ${key}:`, error);
    }
  }
  
  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    let invalidatedCount = 0;
    
    // Invalidate matching entries across all cache levels
    for (const cache of [this.scheduleCache, this.constraintCache, this.partialCache]) {
      for (const key of cache.keys()) {
        if (regex.test(key)) {
          cache.delete(key);
          this.accessTimes.delete(key);
          this.hitCounts.delete(key);
          invalidatedCount++;
        }
      }
    }
    
    this._updateMemoryStats();
    
    logger.debug(`Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`);
    this.emit('invalidated', { pattern, count: invalidatedCount });
    
    return invalidatedCount;
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    const totalEntries = this.scheduleCache.size + this.constraintCache.size + this.partialCache.size;
    
    this.scheduleCache.clear();
    this.constraintCache.clear();
    this.partialCache.clear();
    this.metadataCache.clear();
    this.accessTimes.clear();
    this.hitCounts.clear();
    
    this._updateMemoryStats();
    
    logger.info(`Cleared all cache entries (${totalEntries} entries)`);
    this.emit('cleared', { count: totalEntries });
    
    return totalEntries;
  }
  
  /**
   * Perform periodic cleanup of expired and LRU entries
   */
  _performCleanup() {
    const startTime = Date.now();
    let cleanedCount = 0;
    
    try {
      // Clean up expired entries
      for (const cache of [this.scheduleCache, this.constraintCache, this.partialCache]) {
        for (const [key, entry] of cache.entries()) {
          if (entry.expiresAt && entry.expiresAt < startTime) {
            cache.delete(key);
            this.accessTimes.delete(key);
            this.hitCounts.delete(key);
            cleanedCount++;
          }
        }
      }
      
      // Perform LRU eviction if memory limit exceeded
      if (this._isMemoryLimitExceeded()) {
        cleanedCount += this._performLRUEviction();
      }
      
      this.stats.evictions += cleanedCount;
      this._updateMemoryStats();
      
      if (cleanedCount > 0) {
        logger.debug(`Cache cleanup completed: ${cleanedCount} entries removed in ${Date.now() - startTime}ms`);
        this.emit('cleanup', { removed: cleanedCount, duration: Date.now() - startTime });
      }
      
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
    }
  }
  
  /**
   * Perform LRU eviction to free memory
   */
  _performLRUEviction() {
    const evictionTarget = Math.floor(this.options.maxSize * 0.1); // Remove 10%
    let evictedCount = 0;
    
    // Collect all entries with access times
    const allEntries = [];
    
    for (const [cache, cacheName] of [
      [this.scheduleCache, 'schedule'],
      [this.constraintCache, 'constraint'], 
      [this.partialCache, 'partial']
    ]) {
      for (const key of cache.keys()) {
        allEntries.push({
          key,
          cache,
          cacheName,
          lastAccess: this.accessTimes.get(key) || 0,
          hitCount: this.hitCounts.get(key) || 0
        });
      }
    }
    
    // Sort by access time and hit count (LRU + LFU hybrid)
    allEntries.sort((a, b) => {
      const aScore = a.lastAccess + (a.hitCount * 60000); // Weight hit count as 1 minute
      const bScore = b.lastAccess + (b.hitCount * 60000);
      return aScore - bScore;
    });
    
    // Evict oldest/least used entries
    for (let i = 0; i < Math.min(evictionTarget, allEntries.length); i++) {
      const entry = allEntries[i];
      entry.cache.delete(entry.key);
      this.accessTimes.delete(entry.key);
      this.hitCounts.delete(entry.key);
      evictedCount++;
    }
    
    return evictedCount;
  }
  
  /**
   * Check if we can add a new entry without exceeding memory limits
   */
  _canAddEntry(data) {
    const estimatedSize = this._calculateSize(data);
    const currentMemoryMB = this._getCurrentMemoryUsage() / (1024 * 1024);
    const estimatedMemoryMB = currentMemoryMB + (estimatedSize / (1024 * 1024));
    
    return estimatedMemoryMB <= this.options.maxMemoryMB;
  }
  
  /**
   * Make space in cache by evicting entries
   */
  async _makeSpace(targetCache) {
    const spacingNeeded = this.options.maxSize * 0.2; // Make 20% space
    const evicted = this._performLRUEviction();
    
    if (evicted < spacingNeeded) {
      // If still not enough space, clear oldest entries from target cache
      const entries = Array.from(targetCache.entries());
      entries.sort((a, b) => (this.accessTimes.get(a[0]) || 0) - (this.accessTimes.get(b[0]) || 0));
      
      for (let i = 0; i < Math.min(spacingNeeded - evicted, entries.length); i++) {
        const [key] = entries[i];
        targetCache.delete(key);
        this.accessTimes.delete(key);
        this.hitCounts.delete(key);
      }
    }
  }
  
  /**
   * Check if memory limit is exceeded
   */
  _isMemoryLimitExceeded() {
    const currentMemoryMB = this._getCurrentMemoryUsage() / (1024 * 1024);
    return currentMemoryMB > this.options.maxMemoryMB;
  }
  
  /**
   * Calculate approximate size of data
   */
  _calculateSize(data) {
    try {
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    } catch (error) {
      return 1024; // Default fallback size
    }
  }
  
  /**
   * Get current memory usage across all caches
   */
  _getCurrentMemoryUsage() {
    let totalSize = 0;
    
    for (const cache of [this.scheduleCache, this.constraintCache, this.partialCache]) {
      for (const entry of cache.values()) {
        totalSize += entry.size || 0;
      }
    }
    
    return totalSize;
  }
  
  /**
   * Update memory usage statistics
   */
  _updateMemoryStats() {
    this.stats.memoryUsage = this._getCurrentMemoryUsage();
  }
  
  /**
   * Determine if data should be compressed
   */
  _shouldCompress(data) {
    const size = this._calculateSize(data);
    return size > 1024; // Compress if larger than 1KB
  }
  
  /**
   * Compress data using gzip
   */
  async _compress(data) {
    const zlib = require('zlib');
    const util = require('util');
    const gzip = util.promisify(zlib.gzip);
    
    try {
      const jsonString = JSON.stringify(data);
      const compressed = await gzip(jsonString);
      
      // Update compression ratio stats
      const originalSize = Buffer.byteLength(jsonString, 'utf8');
      const compressedSize = compressed.length;
      this.stats.compressionRatio = (this.stats.compressionRatio + (compressedSize / originalSize)) / 2;
      
      return compressed;
    } catch (error) {
      logger.warn('Compression failed, storing uncompressed:', error);
      return data;
    }
  }
  
  /**
   * Decompress data using gzip
   */
  async _decompress(compressedData) {
    const zlib = require('zlib');
    const util = require('util');
    const gunzip = util.promisify(zlib.gunzip);
    
    try {
      const decompressed = await gunzip(compressedData);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      logger.error('Decompression failed:', error);
      throw error;
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const totalEntries = this.scheduleCache.size + this.constraintCache.size + this.partialCache.size;
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;
    
    return {
      ...this.stats,
      totalEntries,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsageMB: Math.round(this.stats.memoryUsage / (1024 * 1024) * 100) / 100,
      cacheBreakdown: {
        schedule: this.scheduleCache.size,
        constraint: this.constraintCache.size,
        partial: this.partialCache.size,
        metadata: this.metadataCache.size
      }
    };
  }
  
  /**
   * Shutdown cache and cleanup resources
   */
  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
    
    logger.info('ConstraintCache shutdown completed');
    this.emit('shutdown');
  }
}

module.exports = ConstraintCache;