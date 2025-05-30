/**
 * FlexTime Scaling Configuration
 * 
 * A comprehensive, phased approach to scaling the FlexTime platform.
 * Configuration is organized by implementation phase with clear indicators
 * of which features are currently enabled.
 */

require('dotenv').config();

const SCALE_CONFIG = {
  // Phase 1: Immediate & Safe Scaling (CURRENT)
  // These are safe, immediate scaling features that are currently active
  phase1: {
    enabled: true,
    
    // Database connection scaling
    database: {
      pool: {
        max: 100,                    // 5x increase (safe with Neon)
        min: 10,                     // Keep connections warm
        idle: 10000,                 // Standard timeout
        acquire: 30000,              // Standard timeout
        evict: 1000,                 // Faster cleanup
        handleDisconnects: true      // Auto-reconnect
      },
      // Query optimization
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
        statement_timeout: 30000,     // 30s query timeout
        application_name: 'FlexTime_Scaled'
      }
    },
    
    // Server optimization
    server: {
      cluster: {
        enabled: true,
        workers: require('os').cpus().length,  // Use all CPU cores
        restartThreshold: 10                   // Restart after 10 errors
      },
      
      compression: {
        enabled: true,
        level: 6,                    // Good compression ratio
        threshold: 1024              // Compress responses > 1KB
      },
      
      keepAlive: {
        enabled: true,
        timeout: 65000,              // Standard keep-alive
        maxRequests: 100             // Reasonable limit
      },
      
      rateLimiting: {
        windowMs: 60000,             // 1 minute window
        max: 1000,                   // 1000 requests per minute per IP
        message: 'Too many requests'
      }
    },
    
    // Memory caching (basic)
    memory: {
      enabled: true,
      maxSize: 10000,                // 10k items in memory
      ttl: 300000                    // 5 minutes
    }
  },
  
  // Phase 2: Database & Read Scaling (PLANNED)
  phase2: {
    enabled: false,  // Set to true when ready to implement
    
    // Read replicas for scaling read operations
    readReplicas: {
      enabled: false,                // Enable when read replicas are set up
      connectionString: process.env.NEON_READ_REPLICA_URL,
      pool: { max: 50, min: 5 }
    },
    
    // Query routing based on operation type
    queryRouting: {
      enabled: false,                // Enable with read replicas
      readOnlyOperations: ['SELECT', 'EXPLAIN', 'SHOW'],
      forceWritePrimary: ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP']
    }
  },
  
  // Phase 3: Distributed Caching (PLANNED)
  phase3: {
    enabled: false,  // Set to true when ready to implement
    
    // Redis caching
    redis: {
      enabled: process.env.REDIS_URL ? false : false, // Double-gated by env and config
      url: process.env.REDIS_URL,
      ttl: 3600,                    // 1 hour default TTL
      maxMemory: '256mb'            // Reasonable memory limit
    },
    
    // Distributed locking
    locks: {
      enabled: false,
      timeout: 10000,               // 10s lock timeout
      retryCount: 3,                // Retry 3 times
      retryDelay: 1000              // 1s between retries
    }
  },
  
  // Phase 4: Advanced Monitoring & Optimization (PLANNED)
  phase4: {
    enabled: false,  // Set to true when ready to implement
    
    // Health checks and monitoring
    monitoring: {
      healthChecks: {
        interval: 30000,            // 30s intervals
        timeout: 5000,              // 5s timeout
        endpoints: ['/health', '/api/status']
      },
      
      metrics: {
        enabled: false,
        collectInterval: 60000,     // Every minute
        retention: 86400000         // 24 hours
      },
      
      alerts: {
        errorRate: 0.1,             // Alert at 10% error rate
        responseTime: 5000,         // Alert at 5s response time
        memoryUsage: 0.8            // Alert at 80% memory
      }
    },
    
    // Constraint system optimizations
    constraints: {
      parallelEvaluation: {
        enabled: false,
        maxConcurrent: 10,          // Process 10 constraints at once
        timeout: 1000               // 1s timeout per constraint
      },
      
      caching: {
        enabled: false,
        maxSize: 50000,             // 50k cached evaluations
        ttl: 1800000                // 30 minutes
      },
      
      optimization: {
        enableWeightAdjustment: false,
        enableConflictDetection: false,
        enablePerformanceTracking: false
      }
    }
  }
};

// Helper to get active configuration based on currently enabled phases
const getActiveConfig = () => {
  const active = {};
  
  // Merge all enabled phases into active config
  Object.keys(SCALE_CONFIG).forEach(phase => {
    if (SCALE_CONFIG[phase].enabled) {
      // Merge this phase's config into active config
      Object.keys(SCALE_CONFIG[phase]).forEach(key => {
        if (key !== 'enabled') {
          active[key] = {
            ...(active[key] || {}),
            ...SCALE_CONFIG[phase][key]
          };
        }
      });
    }
  });
  
  return active;
};

module.exports = {
  SCALE_CONFIG,
  getActiveConfig
};
