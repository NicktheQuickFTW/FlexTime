interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class FTMemoryManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxCacheSize: number;
  private defaultTTL: number;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: {
    maxCacheSize?: number;
    defaultTTL?: number;
    cleanupInterval?: number;
  } = {}) {
    this.maxCacheSize = options.maxCacheSize ?? 1000;
    this.defaultTTL = options.defaultTTL ?? 300000; // 5 minutes
    this.cleanupInterval = options.cleanupInterval ?? 60000; // 1 minute
    
    this.startCleanup();
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: ttl ?? this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access metrics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cache.size > 0 ? totalAccesses / this.cache.size : 0,
      averageAge: this.cache.size > 0 
        ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / this.cache.size 
        : 0,
      memory: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(entry => entry.timestamp))
        : now,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(entry => entry.timestamp))
        : now
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;
    
    for (const [key, entry] of this.cache) {
      // Key size (string)
      totalSize += key.length * 2; // Assuming UTF-16
      
      // Entry metadata
      totalSize += 40; // timestamp, ttl, accessCount, lastAccessed
      
      // Value size estimation
      totalSize += this.estimateValueSize(entry.value);
    }
    
    return totalSize;
  }

  private estimateValueSize(value: any): number {
    const type = typeof value;
    
    switch (type) {
      case 'string':
        return value.length * 2; // UTF-16
      case 'number':
        return 8; // 64-bit number
      case 'boolean':
        return 1;
      case 'object':
        if (value === null) return 0;
        if (Array.isArray(value)) {
          return value.reduce((size, item) => size + this.estimateValueSize(item), 0);
        }
        return Object.keys(value).reduce((size, key) => {
          return size + key.length * 2 + this.estimateValueSize(value[key]);
        }, 0);
      default:
        return 100; // Default estimate for unknown types
    }
  }

  // Batch operations
  setMany(entries: Array<[string, T, number?]>): void {
    entries.forEach(([key, value, ttl]) => {
      this.set(key, value, ttl);
    });
  }

  getMany(keys: string[]): Array<[string, T | null]> {
    return keys.map(key => [key, this.get(key)]);
  }

  // Cache warming and preloading
  warmCache(generator: (key: string) => Promise<T>, keys: string[]): Promise<void[]> {
    return Promise.all(
      keys.map(async (key) => {
        if (!this.has(key)) {
          try {
            const value = await generator(key);
            this.set(key, value);
          } catch (error) {
            console.warn(`Failed to warm cache for key: ${key}`, error);
          }
        }
      })
    );
  }

  // Memory pressure handling
  handleMemoryPressure(): void {
    const stats = this.getStats();
    const targetSize = Math.floor(this.maxCacheSize * 0.7); // Reduce to 70%
    
    if (stats.size > targetSize) {
      const entries = Array.from(this.cache.entries());
      
      // Sort by access frequency and age (LRU + LFU hybrid)
      entries.sort(([, a], [, b]) => {
        const scoreA = a.accessCount / Math.max(1, (Date.now() - a.lastAccessed) / 1000);
        const scoreB = b.accessCount / Math.max(1, (Date.now() - b.lastAccessed) / 1000);
        return scoreA - scoreB;
      });
      
      // Remove least valuable entries
      const toRemove = stats.size - targetSize;
      for (let i = 0; i < toRemove; i++) {
        if (entries[i]) {
          this.cache.delete(entries[i][0]);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Specialized cache managers for different data types
export class ScheduleMemoryManager extends FTMemoryManager<any> {
  constructor() {
    super({
      maxCacheSize: 10000,
      defaultTTL: 600000, // 10 minutes for schedule data
      cleanupInterval: 60000
    });
  }

  cacheSchedule(scheduleId: string, schedule: any): void {
    this.set(`schedule:${scheduleId}`, schedule);
  }

  getSchedule(scheduleId: string): any | null {
    return this.get(`schedule:${scheduleId}`);
  }

  cacheConstraints(scheduleId: string, constraints: any[]): void {
    this.set(`constraints:${scheduleId}`, constraints);
  }

  getConstraints(scheduleId: string): any[] | null {
    return this.get(`constraints:${scheduleId}`);
  }
}

export class TeamMemoryManager extends FTMemoryManager<any> {
  constructor() {
    super({
      maxCacheSize: 5000,
      defaultTTL: 1800000, // 30 minutes for team data
      cleanupInterval: 120000
    });
  }

  cacheTeam(teamId: string, team: any): void {
    this.set(`team:${teamId}`, team);
  }

  getTeam(teamId: string): any | null {
    return this.get(`team:${teamId}`);
  }

  cacheTeamStats(teamId: string, stats: any): void {
    this.set(`team_stats:${teamId}`, stats, 900000); // 15 minutes for stats
  }

  getTeamStats(teamId: string): any | null {
    return this.get(`team_stats:${teamId}`);
  }
}

// Global memory manager instances
export const memoryManager = new FTMemoryManager({
  maxCacheSize: 50000,
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 30000 // 30 seconds
});

export const scheduleMemoryManager = new ScheduleMemoryManager();
export const teamMemoryManager = new TeamMemoryManager();

// Memory monitoring and alerts
export class MemoryMonitor {
  private managers: FTMemoryManager[];
  private alertThreshold: number;
  private criticalThreshold: number;

  constructor(managers: FTMemoryManager[], options: {
    alertThreshold?: number;
    criticalThreshold?: number;
  } = {}) {
    this.managers = managers;
    this.alertThreshold = options.alertThreshold ?? 0.8; // 80%
    this.criticalThreshold = options.criticalThreshold ?? 0.95; // 95%
  }

  monitor(): {
    status: 'ok' | 'warning' | 'critical';
    usage: number;
    details: any[];
  } {
    const details = this.managers.map(manager => manager.getStats());
    const totalUsage = details.reduce((sum, stats) => sum + stats.size, 0);
    const totalCapacity = details.reduce((sum, stats) => sum + stats.maxSize, 0);
    const usage = totalUsage / totalCapacity;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    
    if (usage >= this.criticalThreshold) {
      status = 'critical';
      // Trigger aggressive cleanup
      this.managers.forEach(manager => manager.handleMemoryPressure());
    } else if (usage >= this.alertThreshold) {
      status = 'warning';
    }

    return {
      status,
      usage,
      details
    };
  }
}

// Global memory monitor
export const memoryMonitor = new MemoryMonitor([
  memoryManager,
  scheduleMemoryManager,
  teamMemoryManager
]);

// Utility functions for memory management
export const memoryUtils = {
  // Get total memory usage across all managers
  getTotalMemoryUsage(): number {
    return [memoryManager, scheduleMemoryManager, teamMemoryManager]
      .reduce((total, manager) => total + manager.getStats().memory, 0);
  },

  // Clear all caches
  clearAllCaches(): void {
    memoryManager.clear();
    scheduleMemoryManager.clear();
    teamMemoryManager.clear();
  },

  // Get comprehensive memory report
  getMemoryReport(): any {
    return {
      timestamp: new Date().toISOString(),
      global: memoryManager.getStats(),
      schedule: scheduleMemoryManager.getStats(),
      team: teamMemoryManager.getStats(),
      monitor: memoryMonitor.monitor(),
      browser: {
        // @ts-ignore - Performance API might not be available
        memory: (performance as any).memory ? {
          // @ts-ignore
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          // @ts-ignore
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    };
  }
};