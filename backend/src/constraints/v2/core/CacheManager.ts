import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import * as crypto from 'crypto';
import { ConstraintResult, ConstraintContext, CacheStats, CacheEntry } from '../types';

/**
 * Intelligent caching system for constraint evaluations
 */
export class CacheManager {
  private logger: Logger;
  private cache: Map<string, CacheEntry>;
  private enabled: boolean;
  private ttl: number;
  private maxSize: number;
  private hitCount: number;
  private missCount: number;
  private evictionCount: number;
  private lastCleanup: number;
  private cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timer;
  private accessFrequency: Map<string, number>;
  private compressionEnabled: boolean;
  private adaptiveTTL: boolean;

  constructor(options: {
    enabled?: boolean;
    ttl?: number;
    maxSize?: number;
    cleanupInterval?: number;
    compressionEnabled?: boolean;
    adaptiveTTL?: boolean;
    logLevel?: string;
  } = {}) {
    this.logger = createLogger({
      level: options.logLevel || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'cache-manager.log' })
      ]
    });

    this.cache = new Map();
    this.accessFrequency = new Map();
    this.enabled = options.enabled ?? true;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.maxSize = options.maxSize || 10000; // 10k entries default
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    this.compressionEnabled = options.compressionEnabled ?? false;
    this.adaptiveTTL = options.adaptiveTTL ?? true;
    
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.lastCleanup = Date.now();

    if (this.enabled) {
      this._startCleanupTimer();
    }

    this.logger.info('CacheManager initialized', { options });
  }

  /**
   * Get a cached result
   */
  public async get(
    constraintId: string,
    context: ConstraintContext
  ): Promise<ConstraintResult | null> {
    if (!this.enabled) {
      return null;
    }

    const key = this._generateKey(constraintId, context);
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (this._isExpired(entry)) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access info
    this.hitCount++;
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    // Track access frequency
    const frequency = this.accessFrequency.get(key) || 0;
    this.accessFrequency.set(key, frequency + 1);

    // Adapt TTL based on access frequency if enabled
    if (this.adaptiveTTL) {
      this._adaptTTL(key, entry);
    }

    // Decompress if needed
    const result = this.compressionEnabled 
      ? await this._decompress(entry.data)
      : entry.data;

    this.logger.debug('Cache hit', { constraintId, key });
    return result;
  }

  /**
   * Set a cached result
   */
  public async set(
    constraintId: string,
    context: ConstraintContext,
    result: ConstraintResult
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();
    }

    const key = this._generateKey(constraintId, context);
    const now = Date.now();

    // Compress if enabled
    const data = this.compressionEnabled 
      ? await this._compress(result)
      : result;

    const entry: CacheEntry = {
      key,
      constraintId,
      data,
      timestamp: now,
      expiry: now + this.ttl,
      accessCount: 0,
      lastAccess: now,
      size: this._estimateSize(data),
      metadata: {
        contextHash: this._hashContext(context),
        resultSatisfied: result.satisfied,
        violationCount: result.violations.length
      }
    };

    this.cache.set(key, entry);
    this.logger.debug('Cache set', { constraintId, key });
  }

  /**
   * Invalidate cache entries
   */
  public invalidate(constraintId?: string, context?: ConstraintContext): number {
    if (!this.enabled) {
      return 0;
    }

    let invalidatedCount = 0;

    if (!constraintId) {
      // Clear all
      invalidatedCount = this.cache.size;
      this.cache.clear();
      this.accessFrequency.clear();
    } else if (!context) {
      // Clear all entries for a constraint
      for (const [key, entry] of this.cache) {
        if (entry.constraintId === constraintId) {
          this.cache.delete(key);
          this.accessFrequency.delete(key);
          invalidatedCount++;
        }
      }
    } else {
      // Clear specific entry
      const key = this._generateKey(constraintId, context);
      if (this.cache.delete(key)) {
        this.accessFrequency.delete(key);
        invalidatedCount = 1;
      }
    }

    if (invalidatedCount > 0) {
      this.logger.info('Cache invalidated', { constraintId, count: invalidatedCount });
    }

    return invalidatedCount;
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    this.cache.clear();
    this.accessFrequency.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    
    let totalSize = 0;
    let oldestEntry = Infinity;
    let newestEntry = 0;
    let hotEntries = 0;
    let coldEntries = 0;

    const now = Date.now();
    const hotThreshold = now - (this.ttl / 4); // 25% of TTL

    for (const entry of this.cache.values()) {
      totalSize += entry.size || 0;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
      
      if (entry.lastAccess > hotThreshold) {
        hotEntries++;
      } else {
        coldEntries++;
      }
    }

    return {
      enabled: this.enabled,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      evictionCount: this.evictionCount,
      totalSize,
      averageSize: this.cache.size > 0 ? totalSize / this.cache.size : 0,
      ttl: this.ttl,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
      newestEntry,
      lastCleanup: this.lastCleanup,
      hotEntries,
      coldEntries,
      compressionEnabled: this.compressionEnabled,
      adaptiveTTL: this.adaptiveTTL
    };
  }

  /**
   * Get entries by constraint ID
   */
  public getEntriesByConstraint(constraintId: string): CacheEntry[] {
    const entries: CacheEntry[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.constraintId === constraintId) {
        entries.push({ ...entry });
      }
    }

    return entries;
  }

  /**
   * Get hot entries (frequently accessed)
   */
  public getHotEntries(threshold: number = 5): Array<{
    constraintId: string;
    key: string;
    accessCount: number;
    lastAccess: number;
  }> {
    const hotEntries: Array<{
      constraintId: string;
      key: string;
      accessCount: number;
      lastAccess: number;
    }> = [];

    for (const entry of this.cache.values()) {
      if (entry.accessCount >= threshold) {
        hotEntries.push({
          constraintId: entry.constraintId,
          key: entry.key,
          accessCount: entry.accessCount,
          lastAccess: entry.lastAccess
        });
      }
    }

    return hotEntries.sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Warm up cache with pre-computed results
   */
  public async warmUp(entries: Array<{
    constraintId: string;
    context: ConstraintContext;
    result: ConstraintResult;
  }>): Promise<number> {
    if (!this.enabled) {
      return 0;
    }

    let warmedUp = 0;
    
    for (const { constraintId, context, result } of entries) {
      await this.set(constraintId, context, result);
      warmedUp++;
    }

    this.logger.info('Cache warmed up', { count: warmedUp });
    return warmedUp;
  }

  /**
   * Export cache for persistence
   */
  public async export(): Promise<Array<{
    constraintId: string;
    context: any;
    result: ConstraintResult;
    metadata: any;
  }>> {
    const exports: Array<{
      constraintId: string;
      context: any;
      result: ConstraintResult;
      metadata: any;
    }> = [];

    for (const entry of this.cache.values()) {
      if (!this._isExpired(entry)) {
        const result = this.compressionEnabled
          ? await this._decompress(entry.data)
          : entry.data;

        exports.push({
          constraintId: entry.constraintId,
          context: entry.metadata?.contextHash || {},
          result,
          metadata: {
            accessCount: entry.accessCount,
            lastAccess: entry.lastAccess,
            expiry: entry.expiry
          }
        });
      }
    }

    return exports;
  }

  /**
   * Enable or disable caching
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (enabled && !this.cleanupTimer) {
      this._startCleanupTimer();
    } else if (!enabled && this.cleanupTimer) {
      this._stopCleanupTimer();
    }

    this.logger.info('Cache enabled status changed', { enabled });
  }

  /**
   * Update TTL
   */
  public setTTL(ttl: number): void {
    this.ttl = ttl;
    this.logger.info('Cache TTL updated', { ttl });
  }

  /**
   * Generate cache key
   */
  private _generateKey(constraintId: string, context: ConstraintContext): string {
    const contextStr = JSON.stringify(this._normalizeContext(context));
    const hash = crypto
      .createHash('sha256')
      .update(`${constraintId}:${contextStr}`)
      .digest('hex')
      .substring(0, 16);
    
    return `${constraintId}:${hash}`;
  }

  /**
   * Normalize context for consistent keying
   */
  private _normalizeContext(context: ConstraintContext): any {
    // Sort object keys for consistent hashing
    if (typeof context !== 'object' || context === null) {
      return context;
    }

    if (Array.isArray(context)) {
      return context.map(item => this._normalizeContext(item));
    }

    const sorted: any = {};
    Object.keys(context).sort().forEach(key => {
      sorted[key] = this._normalizeContext((context as any)[key]);
    });

    return sorted;
  }

  /**
   * Hash context for metadata
   */
  private _hashContext(context: ConstraintContext): string {
    const normalized = this._normalizeContext(context);
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Check if entry is expired
   */
  private _isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiry;
  }

  /**
   * Evict least recently used entries
   */
  private _evictLRU(): void {
    const entriesToEvict = Math.ceil(this.maxSize * 0.1); // Evict 10%
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    for (let i = 0; i < entriesToEvict && i < sortedEntries.length; i++) {
      const [key] = sortedEntries[i];
      this.cache.delete(key);
      this.accessFrequency.delete(key);
      this.evictionCount++;
    }

    this.logger.debug('LRU eviction completed', { evicted: entriesToEvict });
  }

  /**
   * Adapt TTL based on access patterns
   */
  private _adaptTTL(key: string, entry: CacheEntry): void {
    const frequency = this.accessFrequency.get(key) || 0;
    
    // High frequency items get longer TTL
    if (frequency > 10) {
      entry.expiry = Date.now() + (this.ttl * 2);
    } else if (frequency > 5) {
      entry.expiry = Date.now() + (this.ttl * 1.5);
    }
  }

  /**
   * Estimate size of data
   */
  private _estimateSize(data: any): number {
    // Simple estimation based on JSON string length
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000; // Default estimate
    }
  }

  /**
   * Compress data (placeholder - implement actual compression)
   */
  private async _compress(data: ConstraintResult): Promise<any> {
    // In production, implement actual compression (e.g., using zlib)
    return data;
  }

  /**
   * Decompress data (placeholder - implement actual decompression)
   */
  private async _decompress(data: any): Promise<ConstraintResult> {
    // In production, implement actual decompression
    return data;
  }

  /**
   * Start cleanup timer
   */
  private _startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this._cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private _stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Clean up expired entries
   */
  private _cleanup(): void {
    const now = Date.now();
    let cleanedUp = 0;

    for (const [key, entry] of this.cache) {
      if (this._isExpired(entry)) {
        this.cache.delete(key);
        this.accessFrequency.delete(key);
        cleanedUp++;
      }
    }

    // Clean up low-frequency entries if cache is getting full
    if (this.cache.size > this.maxSize * 0.8) {
      const lowFrequencyThreshold = 2;
      for (const [key, frequency] of this.accessFrequency) {
        if (frequency < lowFrequencyThreshold && this.cache.size > this.maxSize * 0.7) {
          this.cache.delete(key);
          this.accessFrequency.delete(key);
          cleanedUp++;
        }
      }
    }

    this.lastCleanup = now;
    
    if (cleanedUp > 0) {
      this.logger.debug('Cache cleanup completed', { cleanedUp });
    }
  }

  /**
   * Shutdown the cache manager
   */
  public shutdown(): void {
    this._stopCleanupTimer();
    this.logger.info('CacheManager shutdown complete');
  }
}