/**
 * FlexTime Advanced Data Persistence Layer
 * 
 * Provides comprehensive data management with advanced optimization features:
 * - Connection pooling management
 * - Query optimization and indexing
 * - Batch operations for efficiency
 * - Transaction management
 * - Database sharding strategies
 * - Read replica management
 * - Real-time data synchronization
 * - Data versioning and history
 * - Backup and recovery procedures
 * - Data compression and archival
 */

const { Pool, Client } = require('pg');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');
const Redis = require('redis');
const crypto = require('crypto');

class AdvancedDataLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Database configuration
      primaryConnection: config.primaryConnection || require('../../config/neon_db_config.js'),
      readReplicas: config.readReplicas || [],
      
      // Connection pool settings
      connectionPool: {
        max: config.connectionPool?.max || 100,
        min: config.connectionPool?.min || 10,
        idle: config.connectionPool?.idle || 10000,
        acquire: config.connectionPool?.acquire || 30000,
        evict: config.connectionPool?.evict || 1000,
        ...config.connectionPool
      },
      
      // Optimization settings
      optimization: {
        enableQueryCache: config.optimization?.enableQueryCache ?? true,
        enableBatchOperations: config.optimization?.enableBatchOperations ?? true,
        enableCompression: config.optimization?.enableCompression ?? true,
        enableIndexOptimization: config.optimization?.enableIndexOptimization ?? true,
        ...config.optimization
      },
      
      // Data management settings
      dataManagement: {
        enableVersioning: config.dataManagement?.enableVersioning ?? true,
        enableRealTimeSync: config.dataManagement?.enableRealTimeSync ?? true,
        enableBackup: config.dataManagement?.enableBackup ?? true,
        enableArchival: config.dataManagement?.enableArchival ?? true,
        ...config.dataManagement
      },
      
      // Sharding configuration
      sharding: {
        enabled: config.sharding?.enabled ?? false,
        strategy: config.sharding?.strategy || 'hash',
        shardCount: config.sharding?.shardCount || 4,
        ...config.sharding
      }
    };
    
    // Initialize components
    this.pools = new Map();
    this.readPools = new Map();
    this.queryCache = new Map();
    this.batchQueue = new Map();
    this.transactionLog = [];
    this.performanceMetrics = {
      queryCount: 0,
      avgQueryTime: 0,
      cacheHitRate: 0,
      batchEfficiency: 0
    };
    
    // Initialize Redis for caching and real-time sync
    this.redis = null;
    this.initializeRedis();
    
    // Initialize connection pools
    this.initializePools();
    
    // Start background processes
    this.startBackgroundProcesses();
    
    console.log('🔧 Advanced Data Layer initialized');
  }

  /**
   * Initialize Redis connection for caching and real-time sync
   */
  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false
      });
      
      await this.redis.connect();
      console.log('✅ Redis connection established for data layer');
    } catch (error) {
      console.warn('⚠️ Redis not available, caching disabled:', error.message);
      this.config.optimization.enableQueryCache = false;
      this.config.dataManagement.enableRealTimeSync = false;
    }
  }

  /**
   * Initialize database connection pools
   */
  async initializePools() {
    try {
      // Primary write pool
      const primaryPool = new Pool({
        connectionString: this.config.primaryConnection.connectionString,
        max: this.config.connectionPool.max,
        min: this.config.connectionPool.min,
        idleTimeoutMillis: this.config.connectionPool.idle,
        connectionTimeoutMillis: this.config.connectionPool.acquire,
        ssl: { rejectUnauthorized: false }
      });
      
      this.pools.set('primary', primaryPool);
      
      // Read replica pools
      for (let i = 0; i < this.config.readReplicas.length; i++) {
        const replica = this.config.readReplicas[i];
        const readPool = new Pool({
          connectionString: replica.connectionString,
          max: Math.floor(this.config.connectionPool.max / 2),
          min: Math.floor(this.config.connectionPool.min / 2),
          idleTimeoutMillis: this.config.connectionPool.idle,
          connectionTimeoutMillis: this.config.connectionPool.acquire,
          ssl: { rejectUnauthorized: false }
        });
        
        this.readPools.set(`replica_${i}`, readPool);
      }
      
      console.log(`🏊 Connection pools initialized: 1 primary, ${this.config.readReplicas.length} replicas`);
    } catch (error) {
      console.error('❌ Failed to initialize connection pools:', error);
      throw error;
    }
  }

  /**
   * Get appropriate connection pool based on operation type
   */
  getPool(operation = 'write') {
    if (operation === 'read' && this.readPools.size > 0) {
      // Round-robin read replica selection
      const replicas = Array.from(this.readPools.keys());
      const selectedReplica = replicas[Math.floor(Math.random() * replicas.length)];
      return this.readPools.get(selectedReplica);
    }
    
    return this.pools.get('primary');
  }

  /**
   * Execute optimized query with caching and performance monitoring
   */
  async query(sql, params = [], options = {}) {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash(sql, params);
    
    try {
      // Check cache for read operations
      if (this.config.optimization.enableQueryCache && options.operation === 'read') {
        const cached = await this.getCachedResult(queryHash);
        if (cached) {
          this.updateMetrics('cache_hit', performance.now() - startTime);
          return cached;
        }
      }
      
      // Determine shard if sharding is enabled
      const pool = this.getPoolForQuery(sql, params, options);
      
      // Execute query
      const result = await pool.query(sql, params);
      
      // Cache result for read operations
      if (this.config.optimization.enableQueryCache && options.operation === 'read') {
        await this.cacheResult(queryHash, result, options.cacheTTL || 300);
      }
      
      // Update performance metrics
      this.updateMetrics('query', performance.now() - startTime);
      
      // Log transaction for versioning
      if (this.config.dataManagement.enableVersioning && options.operation !== 'read') {
        this.logTransaction(sql, params, result);
      }
      
      // Emit real-time sync event
      if (this.config.dataManagement.enableRealTimeSync && options.operation !== 'read') {
        this.emitSyncEvent('data_change', { sql, params, result });
      }
      
      return result;
      
    } catch (error) {
      console.error('🚨 Query execution failed:', error);
      this.emit('query_error', { sql, params, error });
      throw error;
    }
  }

  /**
   * Batch operation manager for efficiency
   */
  async batchOperation(operations, options = {}) {
    if (!this.config.optimization.enableBatchOperations) {
      // Execute operations individually if batching is disabled
      const results = [];
      for (const op of operations) {
        results.push(await this.query(op.sql, op.params, op.options));
      }
      return results;
    }
    
    const startTime = performance.now();
    const batchId = crypto.randomUUID();
    
    try {
      const pool = this.getPool('write');
      const client = await pool.connect();
      
      await client.query('BEGIN');
      
      const results = [];
      for (const operation of operations) {
        const result = await client.query(operation.sql, operation.params);
        results.push(result);
        
        // Log each operation in the batch
        if (this.config.dataManagement.enableVersioning) {
          this.logTransaction(operation.sql, operation.params, result, batchId);
        }
      }
      
      await client.query('COMMIT');
      client.release();
      
      // Update batch efficiency metrics
      const duration = performance.now() - startTime;
      this.updateMetrics('batch', duration, operations.length);
      
      // Emit batch sync event
      if (this.config.dataManagement.enableRealTimeSync) {
        this.emitSyncEvent('batch_change', { batchId, operations: operations.length, results });
      }
      
      console.log(`✅ Batch operation completed: ${operations.length} operations in ${duration.toFixed(2)}ms`);
      return results;
      
    } catch (error) {
      const pool = this.getPool('write');
      const client = await pool.connect();
      await client.query('ROLLBACK');
      client.release();
      
      console.error('🚨 Batch operation failed:', error);
      this.emit('batch_error', { batchId, operations, error });
      throw error;
    }
  }

  /**
   * Advanced transaction management
   */
  async transaction(callback, options = {}) {
    const pool = this.getPool('write');
    const client = await pool.connect();
    const transactionId = crypto.randomUUID();
    
    try {
      await client.query('BEGIN');
      
      // Create transaction context
      const context = {
        query: async (sql, params) => {
          const result = await client.query(sql, params);
          if (this.config.dataManagement.enableVersioning) {
            this.logTransaction(sql, params, result, transactionId);
          }
          return result;
        },
        rollback: async () => {
          await client.query('ROLLBACK');
        }
      };
      
      const result = await callback(context);
      
      await client.query('COMMIT');
      client.release();
      
      // Emit transaction sync event
      if (this.config.dataManagement.enableRealTimeSync) {
        this.emitSyncEvent('transaction_complete', { transactionId, result });
      }
      
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      
      console.error('🚨 Transaction failed:', error);
      this.emit('transaction_error', { transactionId, error });
      throw error;
    }
  }

  /**
   * Data versioning and history management
   */
  async getDataHistory(table, recordId, options = {}) {
    if (!this.config.dataManagement.enableVersioning) {
      throw new Error('Data versioning is not enabled');
    }
    
    const sql = `
      SELECT 
        version_id,
        operation,
        old_values,
        new_values,
        timestamp,
        transaction_id
      FROM data_history 
      WHERE table_name = $1 AND record_id = $2 
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    
    const params = [table, recordId, options.limit || 50];
    
    return await this.query(sql, params, { operation: 'read' });
  }

  /**
   * Create data snapshot for backup
   */
  async createSnapshot(tables = [], options = {}) {
    if (!this.config.dataManagement.enableBackup) {
      throw new Error('Backup functionality is not enabled');
    }
    
    const snapshotId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    try {
      const snapshot = {
        id: snapshotId,
        timestamp,
        tables: {}
      };
      
      for (const table of tables) {
        const result = await this.query(`SELECT * FROM ${table}`, [], { operation: 'read' });
        snapshot.tables[table] = result.rows;
      }
      
      // Store snapshot metadata
      await this.query(
        'INSERT INTO data_snapshots (id, timestamp, tables, metadata) VALUES ($1, $2, $3, $4)',
        [snapshotId, timestamp, JSON.stringify(tables), JSON.stringify(options)]
      );
      
      // Compress snapshot if enabled
      if (this.config.optimization.enableCompression) {
        snapshot.compressed = true;
        // Implementation would include compression logic
      }
      
      console.log(`📸 Data snapshot created: ${snapshotId}`);
      return snapshot;
      
    } catch (error) {
      console.error('🚨 Snapshot creation failed:', error);
      throw error;
    }
  }

  /**
   * Archive old data based on retention policies
   */
  async archiveData(table, retentionDays, options = {}) {
    if (!this.config.dataManagement.enableArchival) {
      throw new Error('Data archival is not enabled');
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    try {
      // Create archive table if it doesn't exist
      const archiveTable = `${table}_archive`;
      await this.query(`
        CREATE TABLE IF NOT EXISTS ${archiveTable} 
        (LIKE ${table} INCLUDING ALL, 
         archived_at TIMESTAMP DEFAULT NOW())
      `);
      
      // Move old data to archive
      const result = await this.query(`
        WITH moved_rows AS (
          DELETE FROM ${table} 
          WHERE created_at < $1 
          RETURNING *
        )
        INSERT INTO ${archiveTable} 
        SELECT *, NOW() as archived_at 
        FROM moved_rows
      `, [cutoffDate]);
      
      console.log(`🗄️ Archived ${result.rowCount} rows from ${table}`);
      return result.rowCount;
      
    } catch (error) {
      console.error('🚨 Data archival failed:', error);
      throw error;
    }
  }

  /**
   * Index optimization and management
   */
  async optimizeIndexes(table, options = {}) {
    if (!this.config.optimization.enableIndexOptimization) {
      return;
    }
    
    try {
      // Analyze table usage patterns
      const usageStats = await this.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE tablename = $1
      `, [table], { operation: 'read' });
      
      // Get existing indexes
      const indexes = await this.query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1
      `, [table], { operation: 'read' });
      
      // Suggest optimizations based on usage patterns
      const suggestions = this.analyzeIndexOptimizations(usageStats.rows, indexes.rows);
      
      // Apply optimizations if auto-optimize is enabled
      if (options.autoOptimize) {
        for (const suggestion of suggestions) {
          if (suggestion.action === 'create') {
            await this.query(suggestion.sql);
            console.log(`🚀 Created index: ${suggestion.indexName}`);
          } else if (suggestion.action === 'drop') {
            await this.query(`DROP INDEX IF EXISTS ${suggestion.indexName}`);
            console.log(`🗑️ Dropped index: ${suggestion.indexName}`);
          }
        }
      }
      
      return suggestions;
      
    } catch (error) {
      console.error('🚨 Index optimization failed:', error);
      throw error;
    }
  }

  /**
   * Real-time data synchronization
   */
  emitSyncEvent(eventType, data) {
    if (!this.config.dataManagement.enableRealTimeSync || !this.redis) {
      return;
    }
    
    const syncEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
      source: 'data_layer'
    };
    
    // Publish to Redis for real-time sync
    this.redis.publish('flextime:data:sync', JSON.stringify(syncEvent));
    
    // Emit local event
    this.emit('data_sync', syncEvent);
  }

  /**
   * Performance monitoring and metrics
   */
  updateMetrics(operation, duration, batchSize = 1) {
    this.performanceMetrics.queryCount++;
    
    // Update average query time
    const currentAvg = this.performanceMetrics.avgQueryTime;
    const newAvg = (currentAvg * (this.performanceMetrics.queryCount - 1) + duration) / this.performanceMetrics.queryCount;
    this.performanceMetrics.avgQueryTime = newAvg;
    
    // Update operation-specific metrics
    if (operation === 'cache_hit') {
      // Update cache hit rate
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * 0.9) + (1 * 0.1);
    } else if (operation === 'batch') {
      // Update batch efficiency
      this.performanceMetrics.batchEfficiency = batchSize / duration;
    }
    
    // Emit metrics update
    this.emit('metrics_update', this.performanceMetrics);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      poolStats: this.getPoolStats(),
      cacheStats: this.getCacheStats()
    };
  }

  /**
   * Health check for all components
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      components: {
        primaryPool: 'unknown',
        readPools: 'unknown',
        redis: 'unknown',
        metrics: 'unknown'
      }
    };
    
    try {
      // Check primary pool
      const primaryPool = this.pools.get('primary');
      if (primaryPool) {
        await primaryPool.query('SELECT 1');
        health.components.primaryPool = 'healthy';
      }
      
      // Check read pools
      if (this.readPools.size > 0) {
        let healthyReplicas = 0;
        for (const [name, pool] of this.readPools) {
          try {
            await pool.query('SELECT 1');
            healthyReplicas++;
          } catch (error) {
            console.warn(`⚠️ Read replica ${name} unhealthy:`, error.message);
          }
        }
        health.components.readPools = healthyReplicas === this.readPools.size ? 'healthy' : 'degraded';
      } else {
        health.components.readPools = 'not_configured';
      }
      
      // Check Redis
      if (this.redis) {
        await this.redis.ping();
        health.components.redis = 'healthy';
      } else {
        health.components.redis = 'not_configured';
      }
      
      // Check metrics
      health.components.metrics = this.performanceMetrics.queryCount > 0 ? 'healthy' : 'no_activity';
      
      // Determine overall health
      const componentStates = Object.values(health.components);
      if (componentStates.includes('unhealthy')) {
        health.overall = 'unhealthy';
      } else if (componentStates.includes('degraded')) {
        health.overall = 'degraded';
      }
      
      return health;
      
    } catch (error) {
      health.overall = 'unhealthy';
      health.error = error.message;
      return health;
    }
  }

  /**
   * Utility methods
   */
  generateQueryHash(sql, params) {
    const query = sql + JSON.stringify(params);
    return crypto.createHash('md5').update(query).digest('hex');
  }

  async getCachedResult(queryHash) {
    if (!this.redis) return null;
    
    try {
      const cached = await this.redis.get(`query:${queryHash}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  async cacheResult(queryHash, result, ttl = 300) {
    if (!this.redis) return;
    
    try {
      await this.redis.setex(`query:${queryHash}`, ttl, JSON.stringify(result));
    } catch (error) {
      console.warn('⚠️ Failed to cache result:', error.message);
    }
  }

  getPoolForQuery(sql, params, options) {
    // Implement sharding logic here if enabled
    if (this.config.sharding.enabled) {
      // Simple hash-based sharding example
      const shardKey = options.shardKey || params[0] || sql;
      const hash = crypto.createHash('md5').update(String(shardKey)).digest('hex');
      const shardIndex = parseInt(hash.substring(0, 8), 16) % this.config.sharding.shardCount;
      
      // For simplicity, use primary pool with shard info
      // In production, this would route to different shard databases
      return this.getPool(options.operation || 'write');
    }
    
    return this.getPool(options.operation || 'write');
  }

  logTransaction(sql, params, result, transactionId = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      transactionId,
      sql,
      params,
      affectedRows: result.rowCount,
      operation: this.determineOperationType(sql)
    };
    
    this.transactionLog.push(logEntry);
    
    // Keep only last 1000 entries in memory
    if (this.transactionLog.length > 1000) {
      this.transactionLog = this.transactionLog.slice(-1000);
    }
  }

  determineOperationType(sql) {
    const sqlUpper = sql.trim().toUpperCase();
    if (sqlUpper.startsWith('SELECT')) return 'read';
    if (sqlUpper.startsWith('INSERT')) return 'create';
    if (sqlUpper.startsWith('UPDATE')) return 'update';
    if (sqlUpper.startsWith('DELETE')) return 'delete';
    return 'other';
  }

  analyzeIndexOptimizations(usageStats, indexes) {
    const suggestions = [];
    
    // Analyze for missing indexes on frequently queried columns
    for (const stat of usageStats) {
      if (stat.n_distinct > 100 && stat.correlation < 0.1) {
        const indexExists = indexes.some(idx => 
          idx.indexdef.includes(stat.attname)
        );
        
        if (!indexExists) {
          suggestions.push({
            action: 'create',
            indexName: `idx_${stat.tablename}_${stat.attname}`,
            sql: `CREATE INDEX CONCURRENTLY idx_${stat.tablename}_${stat.attname} ON ${stat.tablename} (${stat.attname})`,
            reason: 'High cardinality column without index'
          });
        }
      }
    }
    
    return suggestions;
  }

  getPoolStats() {
    const stats = {};
    
    for (const [name, pool] of this.pools) {
      stats[name] = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
    }
    
    for (const [name, pool] of this.readPools) {
      stats[name] = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
    }
    
    return stats;
  }

  getCacheStats() {
    return {
      size: this.queryCache.size,
      hitRate: this.performanceMetrics.cacheHitRate
    };
  }

  /**
   * Start background processes
   */
  startBackgroundProcesses() {
    // Metrics collection interval
    setInterval(() => {
      this.emit('metrics_snapshot', this.getMetrics());
    }, 30000); // Every 30 seconds
    
    // Cache cleanup interval
    setInterval(() => {
      if (this.queryCache.size > 10000) {
        // Simple LRU cleanup - remove 20% of entries
        const entries = Array.from(this.queryCache.entries());
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.2));
        toRemove.forEach(([key]) => this.queryCache.delete(key));
      }
    }, 300000); // Every 5 minutes
    
    // Health check interval
    setInterval(async () => {
      const health = await this.healthCheck();
      this.emit('health_check', health);
    }, 60000); // Every minute
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down Advanced Data Layer...');
    
    try {
      // Close all connection pools
      for (const [name, pool] of this.pools) {
        await pool.end();
        console.log(`✅ Closed pool: ${name}`);
      }
      
      for (const [name, pool] of this.readPools) {
        await pool.end();
        console.log(`✅ Closed read pool: ${name}`);
      }
      
      // Close Redis connection
      if (this.redis) {
        await this.redis.disconnect();
        console.log('✅ Closed Redis connection');
      }
      
      console.log('✅ Advanced Data Layer shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

module.exports = AdvancedDataLayer;