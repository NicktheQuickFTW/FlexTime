// Cache-related type definitions

export interface CacheKey {
  constraintId: string;
  scheduleId: string;
  scheduleVersion?: string;
  parameters?: string; // Serialized parameters
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  metadata: CacheEntryMetadata;
}

export interface CacheEntryMetadata {
  created: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  ttl?: number;
  tags?: string[];
}

export interface CachePolicy {
  maxSize: number;
  maxAge: number;
  evictionStrategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compressionEnabled?: boolean;
  serializationFormat?: 'json' | 'msgpack' | 'protobuf';
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  count: number;
  hitRate: number;
  missRate: number;
  avgAccessTime: number;
  avgEntrySize: number;
}

export interface CacheOperationResult<T = any> {
  success: boolean;
  value?: T;
  error?: Error;
  metadata?: CacheEntryMetadata;
}

export interface CacheBatchOperationResult<T = any> {
  results: Map<string, CacheOperationResult<T>>;
  successCount: number;
  failureCount: number;
}

export interface CacheInvalidationOptions {
  pattern?: string | RegExp;
  tags?: string[];
  olderThan?: number;
  constraintIds?: string[];
  scheduleIds?: string[];
}

export interface CacheWarmingStrategy {
  priority: 'high' | 'medium' | 'low';
  constraints: string[];
  schedules?: string[];
  preloadData?: boolean;
  parallel?: boolean;
}

export interface DistributedCacheConfig {
  nodes: CacheNode[];
  replicationFactor: number;
  consistencyLevel: 'eventual' | 'strong';
  partitionStrategy: 'hash' | 'range' | 'consistent-hash';
}

export interface CacheNode {
  id: string;
  host: string;
  port: number;
  weight?: number;
  status: 'active' | 'inactive' | 'syncing';
}

export interface CacheEvent {
  type: 'hit' | 'miss' | 'eviction' | 'invalidation' | 'error';
  timestamp: number;
  key?: string;
  metadata?: any;
}

export interface CacheEventHandler {
  (event: CacheEvent): void;
}

// Type guards
export function isCacheKey(obj: any): obj is CacheKey {
  return (
    typeof obj === 'object' &&
    typeof obj.constraintId === 'string' &&
    typeof obj.scheduleId === 'string'
  );
}

export function isCacheEntry<T>(obj: any): obj is CacheEntry<T> {
  return (
    typeof obj === 'object' &&
    typeof obj.key === 'string' &&
    'value' in obj &&
    typeof obj.metadata === 'object'
  );
}

// Cache key generators
export function generateCacheKey(components: CacheKey): string {
  const parts = [
    components.constraintId,
    components.scheduleId,
    components.scheduleVersion || 'latest',
    components.parameters || ''
  ];
  
  return parts.join(':');
}

export function parseCacheKey(key: string): CacheKey | null {
  const parts = key.split(':');
  if (parts.length < 2) return null;

  return {
    constraintId: parts[0],
    scheduleId: parts[1],
    scheduleVersion: parts[2] !== 'latest' ? parts[2] : undefined,
    parameters: parts[3] || undefined
  };
}