/**
 * Cache Manager Unit Tests
 * Comprehensive testing for the FT Engine Cache Manager
 */

const CacheManager = require('../../CacheManager');

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        cacheManager = new CacheManager({
            maxSize: 1000,
            ttl: 5000, // 5 seconds
            cleanupInterval: 1000
        });
    });

    afterEach(() => {
        if (cacheManager) {
            cacheManager.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            const defaultCache = new CacheManager();
            expect(defaultCache.config.maxSize).toBe(10000);
            expect(defaultCache.config.ttl).toBe(300000);
            expect(defaultCache.size).toBe(0);
            defaultCache.destroy();
        });

        test('should initialize with custom configuration', () => {
            expect(cacheManager.config.maxSize).toBe(1000);
            expect(cacheManager.config.ttl).toBe(5000);
            expect(cacheManager.size).toBe(0);
        });

        test('should start cleanup interval on initialization', () => {
            expect(cacheManager.cleanupInterval).toBeDefined();
        });
    });

    describe('Basic Cache Operations', () => {
        test('should set and get values correctly', () => {
            const key = 'test-key';
            const value = { data: 'test-data' };

            cacheManager.set(key, value);
            const retrieved = cacheManager.get(key);

            expect(retrieved).toEqual(value);
            expect(cacheManager.size).toBe(1);
        });

        test('should return null for non-existent keys', () => {
            const result = cacheManager.get('non-existent-key');
            expect(result).toBeNull();
        });

        test('should check if key exists', () => {
            const key = 'test-key';
            const value = 'test-value';

            expect(cacheManager.has(key)).toBe(false);
            cacheManager.set(key, value);
            expect(cacheManager.has(key)).toBe(true);
        });

        test('should delete keys correctly', () => {
            const key = 'test-key';
            const value = 'test-value';

            cacheManager.set(key, value);
            expect(cacheManager.has(key)).toBe(true);

            const deleted = cacheManager.delete(key);
            expect(deleted).toBe(true);
            expect(cacheManager.has(key)).toBe(false);
            expect(cacheManager.size).toBe(0);
        });

        test('should return false when deleting non-existent key', () => {
            const deleted = cacheManager.delete('non-existent-key');
            expect(deleted).toBe(false);
        });

        test('should clear all entries', () => {
            cacheManager.set('key1', 'value1');
            cacheManager.set('key2', 'value2');
            cacheManager.set('key3', 'value3');

            expect(cacheManager.size).toBe(3);

            cacheManager.clear();
            expect(cacheManager.size).toBe(0);
            expect(cacheManager.has('key1')).toBe(false);
        });
    });

    describe('TTL (Time To Live) Functionality', () => {
        test('should expire entries after TTL', async () => {
            const shortTtlCache = new CacheManager({
                ttl: 100,
                cleanupInterval: 50
            });

            shortTtlCache.set('test-key', 'test-value');
            expect(shortTtlCache.get('test-key')).toBe('test-value');

            await global.testUtils.delay(150);
            expect(shortTtlCache.get('test-key')).toBeNull();

            shortTtlCache.destroy();
        });

        test('should set custom TTL for individual entries', async () => {
            cacheManager.set('short-lived', 'value', 100);
            cacheManager.set('long-lived', 'value', 10000);

            await global.testUtils.delay(150);

            expect(cacheManager.get('short-lived')).toBeNull();
            expect(cacheManager.get('long-lived')).toBe('value');
        });

        test('should update TTL when accessing entries', () => {
            const key = 'test-key';
            cacheManager.set(key, 'value');

            const initialTimestamp = cacheManager.cache.get(key).timestamp;
            
            // Wait a bit then access
            setTimeout(() => {
                cacheManager.get(key);
                const updatedTimestamp = cacheManager.cache.get(key).timestamp;
                expect(updatedTimestamp).toBeGreaterThan(initialTimestamp);
            }, 10);
        });
    });

    describe('LRU (Least Recently Used) Eviction', () => {
        test('should evict least recently used items when at capacity', () => {
            const smallCache = new CacheManager({ maxSize: 3 });

            smallCache.set('key1', 'value1');
            smallCache.set('key2', 'value2');
            smallCache.set('key3', 'value3');

            expect(smallCache.size).toBe(3);

            // Add one more item, should evict key1
            smallCache.set('key4', 'value4');

            expect(smallCache.size).toBe(3);
            expect(smallCache.has('key1')).toBe(false);
            expect(smallCache.has('key2')).toBe(true);
            expect(smallCache.has('key3')).toBe(true);
            expect(smallCache.has('key4')).toBe(true);

            smallCache.destroy();
        });

        test('should update access order when getting items', () => {
            const smallCache = new CacheManager({ maxSize: 3 });

            smallCache.set('key1', 'value1');
            smallCache.set('key2', 'value2');
            smallCache.set('key3', 'value3');

            // Access key1 to make it most recently used
            smallCache.get('key1');

            // Add key4, should evict key2 (now least recently used)
            smallCache.set('key4', 'value4');

            expect(smallCache.has('key1')).toBe(true);
            expect(smallCache.has('key2')).toBe(false);
            expect(smallCache.has('key3')).toBe(true);
            expect(smallCache.has('key4')).toBe(true);

            smallCache.destroy();
        });
    });

    describe('Statistics and Monitoring', () => {
        test('should track hit and miss statistics', () => {
            cacheManager.set('hit-key', 'value');

            // Test cache hit
            cacheManager.get('hit-key');
            expect(cacheManager.stats.hits).toBe(1);
            expect(cacheManager.stats.misses).toBe(0);

            // Test cache miss
            cacheManager.get('miss-key');
            expect(cacheManager.stats.hits).toBe(1);
            expect(cacheManager.stats.misses).toBe(1);

            // Calculate hit rate
            const hitRate = cacheManager.getHitRate();
            expect(hitRate).toBe(0.5);
        });

        test('should track memory usage statistics', () => {
            const initialMemory = cacheManager.getMemoryUsage();
            expect(initialMemory.entries).toBe(0);
            expect(initialMemory.estimatedBytes).toBe(0);

            // Add some entries
            for (let i = 0; i < 10; i++) {
                cacheManager.set(`key-${i}`, `value-${i}`.repeat(100));
            }

            const updatedMemory = cacheManager.getMemoryUsage();
            expect(updatedMemory.entries).toBe(10);
            expect(updatedMemory.estimatedBytes).toBeGreaterThan(initialMemory.estimatedBytes);
        });

        test('should provide comprehensive statistics', () => {
            cacheManager.set('key1', 'value1');
            cacheManager.set('key2', 'value2');
            cacheManager.get('key1'); // hit
            cacheManager.get('key3'); // miss

            const stats = cacheManager.getStats();

            expect(stats).toMatchObject({
                size: 2,
                hits: 1,
                misses: 1,
                hitRate: 0.5,
                memoryUsage: expect.objectContaining({
                    entries: 2,
                    estimatedBytes: expect.any(Number)
                })
            });
        });
    });

    describe('Cleanup and Maintenance', () => {
        test('should automatically clean up expired entries', async () => {
            const quickCleanupCache = new CacheManager({
                ttl: 100,
                cleanupInterval: 50
            });

            quickCleanupCache.set('temp-key', 'temp-value');
            expect(quickCleanupCache.size).toBe(1);

            await global.testUtils.delay(200);
            expect(quickCleanupCache.size).toBe(0);

            quickCleanupCache.destroy();
        });

        test('should manually trigger cleanup', () => {
            const now = Date.now();
            
            // Manually add expired entry
            cacheManager.cache.set('expired-key', {
                value: 'expired-value',
                timestamp: now - 10000,
                ttl: 5000
            });

            expect(cacheManager.size).toBe(1);
            
            cacheManager.cleanup();
            expect(cacheManager.size).toBe(0);
        });

        test('should destroy cache properly', () => {
            cacheManager.set('key', 'value');
            expect(cacheManager.cleanupInterval).toBeDefined();

            cacheManager.destroy();

            expect(cacheManager.cache.size).toBe(0);
            expect(cacheManager.cleanupInterval).toBeNull();
        });
    });

    describe('Key Patterns and Namespacing', () => {
        test('should support key patterns for bulk operations', () => {
            cacheManager.set('user:1:profile', 'profile1');
            cacheManager.set('user:1:settings', 'settings1');
            cacheManager.set('user:2:profile', 'profile2');
            cacheManager.set('product:1:details', 'details1');

            const userKeys = cacheManager.getKeysByPattern('user:*');
            expect(userKeys).toHaveLength(3);
            expect(userKeys).toContain('user:1:profile');
            expect(userKeys).toContain('user:1:settings');
            expect(userKeys).toContain('user:2:profile');
        });

        test('should support namespace-based operations', () => {
            cacheManager.set('user:1:profile', 'profile1');
            cacheManager.set('user:1:settings', 'settings1');
            cacheManager.set('user:2:profile', 'profile2');

            const deleted = cacheManager.deleteByPattern('user:1:*');
            expect(deleted).toBe(2);
            expect(cacheManager.has('user:1:profile')).toBe(false);
            expect(cacheManager.has('user:1:settings')).toBe(false);
            expect(cacheManager.has('user:2:profile')).toBe(true);
        });
    });

    describe('Performance Characteristics', () => {
        test('should handle large numbers of entries efficiently', async () => {
            const largeCache = new CacheManager({ maxSize: 10000 });
            const startTime = process.hrtime.bigint();

            // Insert 5000 entries
            for (let i = 0; i < 5000; i++) {
                largeCache.set(`key-${i}`, `value-${i}`);
            }

            const insertTime = Number(process.hrtime.bigint() - startTime) / 1000000;
            expect(insertTime).toBeLessThan(1000); // Should complete in under 1 second

            // Test retrieval performance
            const retrievalStart = process.hrtime.bigint();
            for (let i = 0; i < 1000; i++) {
                largeCache.get(`key-${i}`);
            }
            const retrievalTime = Number(process.hrtime.bigint() - retrievalStart) / 1000000;
            expect(retrievalTime).toBeLessThan(100); // Should complete in under 100ms

            largeCache.destroy();
        });

        test('should maintain consistent performance under load', async () => {
            const performanceData = await global.testUtils.measurePerformance(
                () => {
                    const key = global.testUtils.randomString(10);
                    const value = global.testUtils.randomString(100);
                    cacheManager.set(key, value);
                    cacheManager.get(key);
                },
                1000
            );

            expect(performanceData.mean).toBeLessThan(1); // Average operation under 1ms
            expect(performanceData.p95).toBeLessThan(5);   // 95th percentile under 5ms
        });
    });

    describe('Memory Management', () => {
        test('should estimate memory usage accurately', () => {
            const testData = {
                string: 'test-string'.repeat(100),
                number: 12345,
                object: { nested: { deep: 'value' } },
                array: [1, 2, 3, 4, 5]
            };

            cacheManager.set('test-key', testData);
            
            const memoryUsage = cacheManager.getMemoryUsage();
            expect(memoryUsage.estimatedBytes).toBeGreaterThan(1000);
        });

        test('should not leak memory after cleanup', () => {
            const initialMemory = global.testUtils.getMemoryUsage();

            // Add many entries
            for (let i = 0; i < 1000; i++) {
                cacheManager.set(`key-${i}`, 'x'.repeat(1000));
            }

            // Clear cache
            cacheManager.clear();
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = global.testUtils.getMemoryUsage();
            const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
            
            // Memory should not have grown significantly
            expect(memoryDelta).toBeLessThan(50); // Less than 50MB growth
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid keys gracefully', () => {
            expect(() => cacheManager.set(null, 'value')).not.toThrow();
            expect(() => cacheManager.set(undefined, 'value')).not.toThrow();
            expect(() => cacheManager.get(null)).not.toThrow();
            expect(() => cacheManager.get(undefined)).not.toThrow();
        });

        test('should handle circular references in values', () => {
            const circularObj = { name: 'test' };
            circularObj.self = circularObj;

            expect(() => cacheManager.set('circular', circularObj)).not.toThrow();
            
            const retrieved = cacheManager.get('circular');
            expect(retrieved.name).toBe('test');
        });

        test('should handle very large values', () => {
            const largeValue = 'x'.repeat(10 * 1024 * 1024); // 10MB string

            expect(() => cacheManager.set('large', largeValue)).not.toThrow();
            
            const retrieved = cacheManager.get('large');
            expect(retrieved).toBe(largeValue);
        });
    });
});

module.exports = {
    createTestCacheManager: (config = {}) => new CacheManager({
        maxSize: 100,
        ttl: 1000,
        cleanupInterval: 100,
        ...config
    })
};