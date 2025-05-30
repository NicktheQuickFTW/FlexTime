import { ConstraintResult } from '../types';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
  size: number;
}

export interface CacheConfiguration {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'adaptive';
  compressionEnabled?: boolean;
  persistenceEnabled?: boolean;
  persistencePath?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  itemCount: number;
  hitRate: number;
  avgItemSize: number;
  totalAccessTime: number;
  avgAccessTime: number;
}

export class ConstraintCache {
  private cache: Map<string, CacheEntry<ConstraintResult>>;
  private config: CacheConfiguration;
  private stats: CacheStats;
  private accessQueue: string[]; // For LRU
  private frequencyMap: Map<string, number>; // For LFU
  private insertionOrder: string[]; // For FIFO
  private currentSize: number;

  constructor(config: Partial<CacheConfiguration> = {}) {
    this.config = {
      maxSize: 10000,
      ttl: 3600000, // 1 hour default
      evictionPolicy: 'adaptive',
      compressionEnabled: false,
      persistenceEnabled: false,
      ...config
    };

    this.cache = new Map();
    this.accessQueue = [];
    this.frequencyMap = new Map();
    this.insertionOrder = [];
    this.currentSize = 0;

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      itemCount: 0,
      hitRate: 0,
      avgItemSize: 0,
      totalAccessTime: 0,
      avgAccessTime: 0
    };

    if (this.config.persistenceEnabled) {
      this.loadFromPersistence();
    }
  }

  get(key: string): ConstraintResult | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateStats(performance.now() - startTime);
      return undefined;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateStats(performance.now() - startTime);
      return undefined;
    }

    // Update access patterns
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.updateAccessPattern(key);

    this.stats.hits++;
    this.updateStats(performance.now() - startTime);

    return this.decompress(entry.value);
  }

  set(key: string, value: ConstraintResult): void {
    const compressed = this.compress(value);
    const size = this.estimateSize(compressed);

    // Check if we need to evict
    while (this.currentSize + size > this.config.maxSize && this.cache.size > 0) {
      this.evict();
    }

    const entry: CacheEntry<ConstraintResult> = {
      value: compressed,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
      size
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.currentSize += size;
    this.insertionOrder.push(key);
    this.frequencyMap.set(key, 0);
    
    this.stats.itemCount = this.cache.size;
    this.stats.size = this.currentSize;

    if (this.config.persistenceEnabled) {
      this.persistAsync(key, entry);
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.currentSize -= entry.size;
    
    // Clean up tracking structures
    this.accessQueue = this.accessQueue.filter(k => k !== key);
    this.insertionOrder = this.insertionOrder.filter(k => k !== key);
    this.frequencyMap.delete(key);

    this.stats.itemCount = this.cache.size;
    this.stats.size = this.currentSize;

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.accessQueue = [];
    this.frequencyMap.clear();
    this.insertionOrder = [];
    this.currentSize = 0;
    
    this.resetStats();

    if (this.config.persistenceEnabled) {
      this.clearPersistence();
    }
  }

  private evict(): void {
    let keyToEvict: string | undefined;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.evictLRU();
        break;
      case 'lfu':
        keyToEvict = this.evictLFU();
        break;
      case 'fifo':
        keyToEvict = this.evictFIFO();
        break;
      case 'adaptive':
        keyToEvict = this.evictAdaptive();
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  private evictLRU(): string | undefined {
    // Find least recently used
    if (this.accessQueue.length > 0) {
      return this.accessQueue[0];
    }
    
    // Fallback to oldest entry
    return this.insertionOrder[0];
  }

  private evictLFU(): string | undefined {
    // Find least frequently used
    let minFreq = Infinity;
    let keyToEvict: string | undefined;

    for (const [key, freq] of this.frequencyMap) {
      if (freq < minFreq) {
        minFreq = freq;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  private evictFIFO(): string | undefined {
    return this.insertionOrder[0];
  }

  private evictAdaptive(): string | undefined {
    // Adaptive eviction based on multiple factors
    let worstScore = Infinity;
    let keyToEvict: string | undefined;

    for (const [key, entry] of this.cache) {
      const age = Date.now() - entry.timestamp;
      const frequency = this.frequencyMap.get(key) || 0;
      const recency = Date.now() - entry.lastAccessed;
      
      // Calculate eviction score (lower is worse)
      const score = (frequency * 1000) / (age + recency);
      
      if (score < worstScore) {
        worstScore = score;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  private updateAccessPattern(key: string): void {
    // Update LRU queue
    this.accessQueue = this.accessQueue.filter(k => k !== key);
    this.accessQueue.push(key);

    // Update frequency map
    const currentFreq = this.frequencyMap.get(key) || 0;
    this.frequencyMap.set(key, currentFreq + 1);
  }

  private isExpired(entry: CacheEntry<ConstraintResult>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private compress(value: ConstraintResult): ConstraintResult {
    if (!this.config.compressionEnabled) {
      return value;
    }

    // Simple compression by removing null/undefined values
    const compressed = JSON.parse(JSON.stringify(value, (key, val) => 
      val === null || val === undefined ? undefined : val
    ));

    return compressed;
  }

  private decompress(value: ConstraintResult): ConstraintResult {
    // Currently no decompression needed
    return value;
  }

  private estimateSize(value: ConstraintResult): number {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(value);
    return str.length * 2; // 2 bytes per character (UTF-16)
  }

  private updateStats(accessTime: number): void {
    this.stats.totalAccessTime += accessTime;
    const totalAccesses = this.stats.hits + this.stats.misses;
    this.stats.avgAccessTime = this.stats.totalAccessTime / totalAccesses;
    this.stats.hitRate = totalAccesses > 0 ? this.stats.hits / totalAccesses : 0;
    this.stats.avgItemSize = this.cache.size > 0 ? this.currentSize / this.cache.size : 0;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      itemCount: 0,
      hitRate: 0,
      avgItemSize: 0,
      totalAccessTime: 0,
      avgAccessTime: 0
    };
  }

  // Persistence methods (stub implementations)
  private async loadFromPersistence(): Promise<void> {
    // Would load cache from disk/database
    console.log('Cache persistence not implemented');
  }

  private async persistAsync(key: string, entry: CacheEntry<ConstraintResult>): Promise<void> {
    // Would persist to disk/database asynchronously
  }

  private clearPersistence(): void {
    // Would clear persisted cache
  }

  // Public methods for monitoring and management
  getStats(): CacheStats {
    return { ...this.stats };
  }

  getHitRate(): number {
    return this.stats.hitRate;
  }

  getSize(): number {
    return this.currentSize;
  }

  getItemCount(): number {
    return this.cache.size;
  }

  // Advanced cache operations
  preload(entries: Map<string, ConstraintResult>): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  invalidate(pattern: string | RegExp): number {
    let invalidated = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (this.delete(key)) {
        invalidated++;
      }
    }

    return invalidated;
  }

  // Batch operations for efficiency
  getBatch(keys: string[]): Map<string, ConstraintResult | undefined> {
    const results = new Map<string, ConstraintResult | undefined>();
    
    for (const key of keys) {
      results.set(key, this.get(key));
    }

    return results;
  }

  setBatch(entries: Map<string, ConstraintResult>): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  // Cache warming
  async warm(keyGenerator: () => string[], valueGenerator: (key: string) => Promise<ConstraintResult>): Promise<void> {
    const keys = keyGenerator();
    
    for (const key of keys) {
      if (!this.has(key)) {
        try {
          const value = await valueGenerator(key);
          this.set(key, value);
        } catch (error) {
          console.error(`Failed to warm cache for key ${key}:`, error);
        }
      }
    }
  }
}