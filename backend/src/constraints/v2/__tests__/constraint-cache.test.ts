import { ConstraintCache } from '../engines/ConstraintCache';
import { CacheEntry, CacheConfig } from '../types/cache-types';
import { UnifiedConstraint, ScheduleSlot } from '../types';

jest.useFakeTimers();

describe('ConstraintCache', () => {
  let cache: ConstraintCache;
  let mockConstraint: UnifiedConstraint;
  let mockSlot: ScheduleSlot;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new ConstraintCache();
    
    mockConstraint = {
      id: 'test-constraint-1',
      type: 'venue',
      sport: 'football',
      name: 'Stadium Availability',
      version: '1.0.0',
      evaluate: jest.fn().mockResolvedValue({
        valid: true,
        score: 1.0,
        violations: [],
        suggestions: []
      }),
      priority: 'required',
      metadata: {
        author: 'system',
        tags: ['venue', 'availability'],
        description: 'Test constraint',
        created: new Date(),
        updated: new Date()
      }
    };

    mockSlot = {
      id: 'slot-1',
      date: new Date('2025-01-15'),
      time: '14:00',
      duration: 180,
      venue: 'Stadium A',
      sport: 'football',
      gameId: 'game-1',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      conference: 'Big 12',
      tvInfo: {
        network: 'ESPN',
        startTime: '14:00',
        duration: 180
      },
      requiredResources: ['Field', 'Lights'],
      constraints: []
    };
  });

  describe('Basic Operations', () => {
    test('should set and get cache entries', async () => {
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      const key = cache['generateCacheKey'](mockConstraint, mockSlot);
      
      await cache.set(mockConstraint, mockSlot, result);
      const cached = await cache.get(mockConstraint, mockSlot);
      
      expect(cached).toEqual(result);
    });

    test('should return null for missing entries', async () => {
      const cached = await cache.get(mockConstraint, mockSlot);
      expect(cached).toBeNull();
    });

    test('should invalidate cache entries', async () => {
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      await cache.set(mockConstraint, mockSlot, result);
      await cache.invalidate(mockConstraint.id);
      
      const cached = await cache.get(mockConstraint, mockSlot);
      expect(cached).toBeNull();
    });

    test('should clear all cache entries', async () => {
      const result1 = { valid: true, score: 1.0, violations: [], suggestions: [] };
      const result2 = { valid: false, score: 0.5, violations: ['conflict'], suggestions: [] };
      
      await cache.set(mockConstraint, mockSlot, result1);
      const mockConstraint2 = { ...mockConstraint, id: 'test-constraint-2' };
      await cache.set(mockConstraint2, mockSlot, result2);
      
      await cache.clear();
      
      expect(await cache.get(mockConstraint, mockSlot)).toBeNull();
      expect(await cache.get(mockConstraint2, mockSlot)).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    test('should expire entries after TTL', async () => {
      const customCache = new ConstraintCache({ defaultTTL: 1000 });
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      await customCache.set(mockConstraint, mockSlot, result);
      expect(await customCache.get(mockConstraint, mockSlot)).toEqual(result);
      
      // Advance time past TTL
      jest.advanceTimersByTime(1500);
      
      expect(await customCache.get(mockConstraint, mockSlot)).toBeNull();
    });

    test('should use custom TTL for specific entries', async () => {
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      await cache.set(mockConstraint, mockSlot, result, 2000);
      
      // Advance time but not past custom TTL
      jest.advanceTimersByTime(1500);
      expect(await cache.get(mockConstraint, mockSlot)).toEqual(result);
      
      // Advance past custom TTL
      jest.advanceTimersByTime(1000);
      expect(await cache.get(mockConstraint, mockSlot)).toBeNull();
    });
  });

  describe('Size Management', () => {
    test('should evict LRU entries when max size reached', async () => {
      const smallCache = new ConstraintCache({ maxSize: 2 });
      
      const constraint1 = { ...mockConstraint, id: 'c1' };
      const constraint2 = { ...mockConstraint, id: 'c2' };
      const constraint3 = { ...mockConstraint, id: 'c3' };
      
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      await smallCache.set(constraint1, mockSlot, result);
      await smallCache.set(constraint2, mockSlot, result);
      
      // Access constraint1 to make it more recently used
      await smallCache.get(constraint1, mockSlot);
      
      // This should evict constraint2 (LRU)
      await smallCache.set(constraint3, mockSlot, result);
      
      expect(await smallCache.get(constraint1, mockSlot)).toEqual(result);
      expect(await smallCache.get(constraint2, mockSlot)).toBeNull();
      expect(await smallCache.get(constraint3, mockSlot)).toEqual(result);
    });
  });

  describe('Batch Operations', () => {
    test('should get multiple entries in batch', async () => {
      const constraints = [
        { ...mockConstraint, id: 'c1' },
        { ...mockConstraint, id: 'c2' },
        { ...mockConstraint, id: 'c3' }
      ];
      
      const results = [
        { valid: true, score: 1.0, violations: [], suggestions: [] },
        { valid: false, score: 0.5, violations: ['conflict'], suggestions: [] },
        { valid: true, score: 0.8, violations: [], suggestions: ['optimize'] }
      ];
      
      // Set all entries
      for (let i = 0; i < constraints.length; i++) {
        await cache.set(constraints[i], mockSlot, results[i]);
      }
      
      // Batch get
      const batchResults = await cache.getMultiple(
        constraints.map(c => ({ constraint: c, slot: mockSlot }))
      );
      
      expect(batchResults).toHaveLength(3);
      expect(batchResults[0]).toEqual(results[0]);
      expect(batchResults[1]).toEqual(results[1]);
      expect(batchResults[2]).toEqual(results[2]);
    });

    test('should handle partial cache hits in batch', async () => {
      const constraints = [
        { ...mockConstraint, id: 'c1' },
        { ...mockConstraint, id: 'c2' },
        { ...mockConstraint, id: 'c3' }
      ];
      
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      // Only set first and third
      await cache.set(constraints[0], mockSlot, result);
      await cache.set(constraints[2], mockSlot, result);
      
      const batchResults = await cache.getMultiple(
        constraints.map(c => ({ constraint: c, slot: mockSlot }))
      );
      
      expect(batchResults[0]).toEqual(result);
      expect(batchResults[1]).toBeNull();
      expect(batchResults[2]).toEqual(result);
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache hits and misses', async () => {
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      // Miss
      await cache.get(mockConstraint, mockSlot);
      let stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0);
      
      // Set and hit
      await cache.set(mockConstraint, mockSlot, result);
      await cache.get(mockConstraint, mockSlot);
      await cache.get(mockConstraint, mockSlot);
      
      stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    test('should track evictions', async () => {
      const smallCache = new ConstraintCache({ maxSize: 1 });
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      const constraint1 = { ...mockConstraint, id: 'c1' };
      const constraint2 = { ...mockConstraint, id: 'c2' };
      
      await smallCache.set(constraint1, mockSlot, result);
      await smallCache.set(constraint2, mockSlot, result);
      
      const stats = smallCache.getStats();
      expect(stats.evictions).toBe(1);
    });

    test('should reset statistics', () => {
      cache.getStats(); // Initialize stats
      cache.resetStats();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('Cache Key Generation', () => {
    test('should generate consistent keys for same input', () => {
      const key1 = cache['generateCacheKey'](mockConstraint, mockSlot);
      const key2 = cache['generateCacheKey'](mockConstraint, mockSlot);
      
      expect(key1).toBe(key2);
    });

    test('should generate different keys for different constraints', () => {
      const constraint2 = { ...mockConstraint, id: 'different-id' };
      
      const key1 = cache['generateCacheKey'](mockConstraint, mockSlot);
      const key2 = cache['generateCacheKey'](constraint2, mockSlot);
      
      expect(key1).not.toBe(key2);
    });

    test('should generate different keys for different slots', () => {
      const slot2 = { ...mockSlot, id: 'different-slot' };
      
      const key1 = cache['generateCacheKey'](mockConstraint, mockSlot);
      const key2 = cache['generateCacheKey'](mockConstraint, slot2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Warm-up and Preloading', () => {
    test('should warm up cache with provided entries', async () => {
      const constraints = [
        { ...mockConstraint, id: 'c1' },
        { ...mockConstraint, id: 'c2' }
      ];
      
      const slots = [
        mockSlot,
        { ...mockSlot, id: 'slot-2' }
      ];
      
      const entries = [];
      for (const constraint of constraints) {
        for (const slot of slots) {
          entries.push({
            constraint,
            slot,
            result: { valid: true, score: 1.0, violations: [], suggestions: [] }
          });
        }
      }
      
      await cache.warmUp(entries);
      
      // Verify all entries are cached
      for (const entry of entries) {
        const cached = await cache.get(entry.constraint, entry.slot);
        expect(cached).toEqual(entry.result);
      }
      
      const stats = cache.getStats();
      expect(stats.size).toBe(4);
    });
  });

  describe('Memory Management', () => {
    test('should estimate memory usage', () => {
      const usage = cache.getMemoryUsage();
      
      expect(usage).toHaveProperty('totalBytes');
      expect(usage).toHaveProperty('entryCount');
      expect(usage).toHaveProperty('averageEntrySize');
      expect(usage.totalBytes).toBeGreaterThanOrEqual(0);
    });

    test('should handle memory pressure', async () => {
      const result = { valid: true, score: 1.0, violations: [], suggestions: [] };
      
      // Fill cache
      for (let i = 0; i < 10; i++) {
        const constraint = { ...mockConstraint, id: `c${i}` };
        await cache.set(constraint, mockSlot, result);
      }
      
      // Simulate memory pressure
      cache.handleMemoryPressure();
      
      const stats = cache.getStats();
      expect(stats.size).toBeLessThan(10);
    });
  });
});