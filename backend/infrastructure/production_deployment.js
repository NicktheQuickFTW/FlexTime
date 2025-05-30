/**
 * FlexTime 10x Production Deployment Configuration
 * 
 * This module handles the deployment and scaling configuration
 * for FlexTime to support 10x production load.
 */

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const Redis = require('ioredis');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const PRODUCTION_SCALE_CONFIG = require('../config/production_scale_config');
const heliiXConfig = require('../config/neon_db_config');
const { ConstraintManagementSystemV4 } = require('../src/ai/constraint-management-system-v4');

/**
 * Production Deployment Manager for 10x Scale
 */
class ProductionDeploymentManager {
  constructor() {
    this.config = PRODUCTION_SCALE_CONFIG;
    this.workers = new Map();
    this.masterStartTime = Date.now();
    this.deploymentMetrics = {
      totalRequests: 0,
      activeConnections: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }
  
  /**
   * Deploy FlexTime for 10x production scale
   */
  async deploy() {
    console.log('🚀 Starting FlexTime 10x Production Deployment');
    console.log('================================================');
    
    if (cluster.isMaster) {
      await this.deployMaster();
    } else {
      await this.deployWorker();
    }
  }
  
  /**
   * Deploy master process for coordination
   */
  async deployMaster() {
    console.log(`📊 Master Process: Deploying for ${this.config.database.pool.max * 5} concurrent users`);
    
    // Initialize Redis cluster for distributed caching
    await this.initializeRedisCluster();
    
    // Validate HELiiX database connection
    await this.validateDatabaseConnection();
    
    // Create worker processes
    const numWorkers = this.config.server.cluster.workers;
    console.log(`🔧 Creating ${numWorkers} worker processes...`);
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork({
        WORKER_ID: i,
        TOTAL_WORKERS: numWorkers
      });
      
      this.workers.set(worker.id, {
        worker,
        startTime: Date.now(),
        requests: 0,
        errors: 0
      });
      
      console.log(`   ✅ Worker ${i + 1} started (PID: ${worker.process.pid})`);
    }
    
    // Set up worker monitoring
    this.setupWorkerMonitoring();
    
    // Set up master health monitoring
    this.setupMasterMonitoring();
    
    console.log('🎉 Master deployment complete - FlexTime ready for 10x scale!');
  }
  
  /**
   * Deploy worker process
   */
  async deployWorker() {
    const workerId = process.env.WORKER_ID;
    console.log(`👷 Worker ${workerId}: Starting deployment...`);
    
    try {
      // Create Express app with 10x scale optimizations
      const app = await this.createScaledApp();
      
      // Initialize constraint system v4 for this worker
      const constraintSystem = new ConstraintManagementSystemV4({
        workerId: workerId,
        enableDistributedProcessing: true,
        enableMLOptimization: true
      });
      
      await constraintSystem.initialize();
      app.set('constraintSystem', constraintSystem);
      
      // Start the server
      const port = process.env.PORT || (3000 + parseInt(workerId));
      const server = app.listen(port, () => {
        console.log(`✅ Worker ${workerId}: Server running on port ${port}`);
      });
      
      // Configure server for high performance
      this.configureServerForScale(server);
      
      // Set up graceful shutdown
      this.setupGracefulShutdown(server, constraintSystem);
      
      console.log(`🎯 Worker ${workerId}: Ready for production traffic`);
      
    } catch (error) {
      console.error(`❌ Worker ${workerId}: Deployment failed:`, error);
      process.exit(1);
    }
  }
  
  /**
   * Create Express app optimized for 10x scale
   */
  async createScaledApp() {
    const app = express();
    
    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    // Compression for 10x scale
    app.use(compression(this.config.server.compression));
    
    // Rate limiting for production scale
    const limiter = rateLimit(this.config.server.requestLimiting);
    app.use(limiter);
    
    // DDoS protection
    if (this.config.security.ddosProtection.enabled) {
      app.use(this.createDDoSProtection());
    }
    
    // JSON parsing with size limits
    app.use(express.json({ 
      limit: '10mb',
      strict: true,
      inflate: true
    }));
    
    app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 1000
    }));
    
    // Performance monitoring middleware
    app.use(this.createPerformanceMiddleware());
    
    // Health check endpoint
    app.get('/health', this.createHealthCheckHandler());
    
    // Metrics endpoint for monitoring
    app.get('/metrics', this.createMetricsHandler());
    
    // Load balancer check
    app.get('/lb-check', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        worker: process.env.WORKER_ID,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      });
    });
    
    return app;
  }
  
  /**
   * Initialize Redis cluster for distributed caching
   */
  async initializeRedisCluster() {
    console.log('🔌 Initializing Redis cluster for distributed caching...');
    
    try {
      const redisConfig = this.config.redis;
      
      if (redisConfig.cluster.enabled) {
        this.redisCluster = new Redis.Cluster(
          redisConfig.cluster.nodes,
          redisConfig.cluster.options
        );
        
        await this.redisCluster.ping();
        console.log('✅ Redis cluster connected successfully');
      } else {
        this.redis = new Redis(redisConfig.primary);
        await this.redis.ping();
        console.log('✅ Redis single instance connected successfully');
      }
      
    } catch (error) {
      console.error('❌ Redis initialization failed:', error.message);
      console.log('⚠️  Continuing without Redis - performance may be degraded');
    }
  }
  
  /**
   * Validate database connection for 10x scale
   */
  async validateDatabaseConnection() {
    console.log('🔍 Validating HELiiX database connection for 10x scale...');
    
    const validation = await heliiXConfig.validateConnection();
    if (!validation.success) {
      throw new Error(`Database validation failed: ${validation.error}`);
    }
    
    console.log('✅ HELiiX database validated for 10x scale');
    console.log(`   Database: ${validation.dbInfo.database_name}`);
    console.log(`   Connection pool: ${this.config.database.pool.max} max connections`);
  }
  
  /**
   * Set up worker monitoring and health checks
   */
  setupWorkerMonitoring() {
    cluster.on('exit', (worker, code, signal) => {
      const workerInfo = this.workers.get(worker.id);
      console.log(`⚠️  Worker ${worker.id} died (${signal || code})`);
      
      if (workerInfo && workerInfo.errors < this.config.server.cluster.restartThreshold) {
        console.log('🔄 Restarting worker...');
        const newWorker = cluster.fork();
        this.workers.set(newWorker.id, {
          worker: newWorker,
          startTime: Date.now(),
          requests: 0,
          errors: workerInfo.errors + 1
        });
      } else {
        console.log('❌ Worker restart threshold exceeded');
      }
    });
    
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.id} is online`);
    });
    
    // Periodic health checks
    setInterval(() => {
      this.checkWorkerHealth();
    }, this.config.monitoring.healthChecks.interval);
  }
  
  /**
   * Set up master process monitoring
   */
  setupMasterMonitoring() {
    // Memory monitoring
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memoryMB = memUsage.rss / 1024 / 1024;
      
      if (memoryMB > this.config.monitoring.alerts.memory_usage * 10) { // Assuming 1GB base
        console.log(`⚠️  High memory usage: ${memoryMB.toFixed(2)}MB`);
      }
      
      this.deploymentMetrics.memoryUsage = memUsage;
    }, 30000);
    
    // System metrics logging
    setInterval(() => {
      console.log('📊 Deployment Metrics:');
      console.log(`   Workers: ${this.workers.size}`);
      console.log(`   Uptime: ${Math.round((Date.now() - this.masterStartTime) / 1000)}s`);
      console.log(`   Memory: ${(this.deploymentMetrics.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Create performance monitoring middleware
   */
  createPerformanceMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.deploymentMetrics.totalRequests++;
        
        // Log slow requests
        if (responseTime > 2000) {
          console.log(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
        }
        
        // Update metrics
        if (res.statusCode >= 400) {
          const workerInfo = this.workers.get(cluster.worker?.id);
          if (workerInfo) workerInfo.errors++;
        }
      });
      
      next();
    };
  }
  
  /**
   * Create health check handler
   */
  createHealthCheckHandler() {
    return async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: process.env.WORKER_ID,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        database: 'connected',
        redis: 'connected'
      };
      
      // Check database connection
      try {
        await heliiXConfig.validateConnection();
      } catch (error) {
        health.database = 'error';
        health.status = 'degraded';
      }
      
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    };
  }
  
  /**
   * Create metrics handler for monitoring
   */
  createMetricsHandler() {
    return (req, res) => {
      const metrics = {
        deployment: this.deploymentMetrics,
        workers: this.workers.size,
        uptime: Math.round((Date.now() - this.masterStartTime) / 1000),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };
      
      res.json(metrics);
    };
  }
  
  /**
   * Create DDoS protection middleware
   */
  createDDoSProtection() {
    const requestCounts = new Map();
    const config = this.config.security.ddosProtection;
    
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!requestCounts.has(clientIP)) {
        requestCounts.set(clientIP, { count: 1, windowStart: now });
        return next();
      }
      
      const clientData = requestCounts.get(clientIP);
      
      // Reset window if needed
      if (now - clientData.windowStart > 3600000) { // 1 hour window
        clientData.count = 1;
        clientData.windowStart = now;
        return next();
      }
      
      clientData.count++;
      
      if (clientData.count > config.limit) {
        return res.status(429).json({ 
          error: 'Too many requests',
          retryAfter: Math.ceil((3600000 - (now - clientData.windowStart)) / 1000)
        });
      }
      
      next();
    };
  }
  
  /**
   * Configure server for high performance
   */
  configureServerForScale(server) {
    // Keep-alive settings
    server.keepAliveTimeout = this.config.server.keepAlive.timeout;
    server.maxRequestsPerSocket = this.config.server.keepAlive.maxRequests;
    
    // Connection limits
    server.maxConnections = this.config.database.pool.max * 2;
    
    // Timeout settings
    server.timeout = 120000; // 2 minutes
    server.headersTimeout = 120000;
    server.requestTimeout = 120000;
  }
  
  /**
   * Set up graceful shutdown for workers
   */
  setupGracefulShutdown(server, constraintSystem) {
    const gracefulShutdown = async (signal) => {
      console.log(`🛑 Worker ${process.env.WORKER_ID}: Received ${signal}, shutting down gracefully...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log(`✅ Worker ${process.env.WORKER_ID}: Server closed`);
        
        // Shutdown constraint system
        if (constraintSystem) {
          await constraintSystem.shutdown();
        }
        
        console.log(`✅ Worker ${process.env.WORKER_ID}: Graceful shutdown complete`);
        process.exit(0);
      });
      
      // Force shutdown after timeout
      setTimeout(() => {
        console.log(`⚠️  Worker ${process.env.WORKER_ID}: Force shutdown after timeout`);
        process.exit(1);
      }, this.config.server.cluster.gracefulShutdownTimeout);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }
  
  /**
   * Check health of all workers
   */
  checkWorkerHealth() {
    for (const [workerId, workerInfo] of this.workers.entries()) {
      if (!workerInfo.worker.isDead()) {
        // Worker is alive, check performance metrics
        const uptime = Date.now() - workerInfo.startTime;
        const errorRate = workerInfo.errors / Math.max(workerInfo.requests, 1);
        
        if (errorRate > 0.1) { // 10% error rate
          console.log(`⚠️  Worker ${workerId} has high error rate: ${(errorRate * 100).toFixed(2)}%`);
        }
      }
    }
  }
}

// Auto-deploy if this script is run directly
if (require.main === module) {
  const deployment = new ProductionDeploymentManager();
  deployment.deploy().catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionDeploymentManager;