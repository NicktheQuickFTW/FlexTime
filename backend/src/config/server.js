const cluster = require('cluster');
const os = require('os');
const scaleConfig = require('../../config/scale_config');
const neonConfig = require('../../config/neon_db_config');

function configureServer(server, scaleConfig) {
  // Configure server for high performance
  if (scaleConfig.server.keepAlive?.enabled) {
    server.keepAliveTimeout = scaleConfig.server.keepAlive.timeout;
    server.headersTimeout = scaleConfig.server.keepAlive.timeout + 1000;
    server.maxRequestsPerSocket = scaleConfig.server.keepAlive.maxRequests;
  }

  // Set connection limits with configurable workers per task consideration
  const baseConnections = neonConfig.pool.max * 2;
  const workerMultiplier = scaleConfig.workers?.maxWorkersPerTask || 10;
  server.maxConnections = baseConnections * workerMultiplier;
}

function shouldUseCluster(config = {}) {
  return config.server?.cluster?.enabled && cluster.isMaster && process.env.NODE_ENV === 'production';
}

function startCluster(config = {}) {
  // Scale worker count to support configurable workers per task
  const baseWorkers = config.server?.cluster?.workers || require('os').cpus().length;
  const scaledWorkers = Math.min(baseWorkers * 2, os.cpus().length * 2); // Cap at 2x CPU cores
  const maxWorkersPerTask = config.workers?.maxWorkersPerTask || 10;
  
  console.log(`🔧 Master process: Starting ${scaledWorkers} workers (scaled for ${maxWorkersPerTask} workers per task)...`);
  
  for (let i = 0; i < scaledWorkers; i++) {
    const worker = cluster.fork();
    worker.send({ workerId: i + 1, totalWorkers: scaledWorkers });
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died`);
    console.log('🔄 Starting a new worker');
    const newWorker = cluster.fork();
    newWorker.send({ workerId: worker.id, totalWorkers: scaledWorkers });
  });
  
  cluster.on('message', (worker, message) => {
    if (message.type === 'worker-capacity') {
      console.log(`📊 Worker ${worker.id}: ${message.activeTasks} active tasks, ${message.totalWorkers} workers allocated`);
    }
  });
  
  console.log('✅ Cluster master started with enhanced worker scaling');
}

function createHealthCheck(cacheManager) {
  return async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.1.0-scaled',
      worker: process.env.WORKER_ID || 'single',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      ...cacheManager.getStats(),
      scaling: {
        compression: scaleConfig.server.compression.enabled,
        rateLimiting: !!scaleConfig.rateLimiting,
        clustering: scaleConfig.server.cluster.enabled,
        maxWorkersPerTask: scaleConfig.workers?.maxWorkersPerTask || 10
      }
    };

    // Test database connection
    try {
      const db = req.app.get('db');
      if (db && db.sequelize) {
        await db.sequelize.authenticate();
        health.database = 'connected';
      } else {
        health.database = 'not_configured';
      }
    } catch (error) {
      health.database = 'error';
      health.status = 'degraded';
    }

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  };
}

function createMetricsEndpoint(cacheManager) {
  return (req, res) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      worker: process.env.WORKER_ID || 'single',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      ...cacheManager.getStats(),
      scaling: {
        version: '2.1.0-scaled',
        features_enabled: {
          compression: scaleConfig.server.compression.enabled,
          rateLimiting: !!scaleConfig.rateLimiting,
          clustering: scaleConfig.server.cluster.enabled,
          caching: cacheManager.config.enabled,
          maxWorkersPerTask: scaleConfig.workers?.maxWorkersPerTask || 10
        }
      }
    };
    
    // Send worker capacity update to master if in cluster mode
    if (cluster.isWorker && process.send) {
      process.send({
        type: 'worker-capacity',
        activeTasks: metrics.workers.activeTasks,
        totalWorkers: metrics.workers.totalActive
      });
    }
    
    res.json(metrics);
  };
}

function setupGracefulShutdown(server, app) {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    if (server) {
      server.close(() => {
        // Shutdown agent system if initialized
        if (app.get('agentSystem')) {
          app.get('agentSystem').shutdown();
        }
        process.exit(1);
      });
    } else {
      // Shutdown agent system if initialized
      if (app.get('agentSystem')) {
        app.get('agentSystem').shutdown();
      }
      process.exit(1);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    const workerId = process.env.WORKER_ID || 'single';
    console.log(`🛑 Worker ${workerId}: SIGTERM received. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        // Shutdown agent system if initialized
        if (app.get('agentSystem')) {
          app.get('agentSystem').shutdown();
        }
        
        // Shutdown feedback analysis service
        try {
          const feedbackAnalysisService = require('../../services/feedbackAnalysisService');
          feedbackAnalysisService.stop();
          console.log('Feedback Analysis Service stopped');
        } catch (error) {
          console.error('Error stopping Feedback Analysis Service:', error);
        }
        
        console.log(`✅ Worker ${workerId}: Process terminated gracefully`);
        process.exit(0);
      });
    }
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    const workerId = process.env.WORKER_ID || 'single';
    console.log(`🛑 Worker ${workerId}: SIGINT received. Shutting down gracefully...`);
    process.emit('SIGTERM');
  });
}

module.exports = {
  configureServer,
  shouldUseCluster,
  startCluster,
  createHealthCheck,
  createMetricsEndpoint,
  setupGracefulShutdown
};