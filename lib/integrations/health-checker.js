/**
 * Health checking utility for monitoring system components
 */

const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');
import config from '../config.js';

class HealthChecker {
  constructor() {
    this.logger = logger;
    this.healthChecks = [];
    this.isRunning = false;
    this.interval = null;
    this.status = {
      overall: 'healthy',
      components: {},
      lastCheck: null,
      uptime: 0
    };
  }

  // Add health check functions
  addCheck(name, checkFunction, criticalFlag = true) {
    this.healthChecks.push({
      name,
      check: checkFunction,
      critical: criticalFlag,
      lastResult: null,
      lastError: null,
      lastCheck: null
    });
  }

  // Start periodic health checks
  start(checks = []) {
    if (this.isRunning) {
      this.logger.warn('Health checker is already running');
      return;
    }

    // Add provided checks
    checks.forEach((check, index) => {
      this.addCheck(`check_${index}`, check);
    });

    this.isRunning = true;
    this.startTime = Date.now();
    
    this.logger.info('Starting health checker', {
      interval: config.monitoring.healthCheck.interval,
      timeout: config.monitoring.healthCheck.timeout,
      checks: this.healthChecks.length
    });

    // Run initial check
    this.runChecks();

    // Schedule periodic checks
    this.interval = setInterval(() => {
      this.runChecks();
    }, config.monitoring.healthCheck.interval);
  }

  // Stop health checks
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.logger.info('Health checker stopped');
  }

  // Run all health checks
  async runChecks() {
    const startTime = Date.now();
    this.logger.debug('Running health checks', { count: this.healthChecks.length });

    const results = await Promise.allSettled(
      this.healthChecks.map(check => this.runSingleCheck(check))
    );

    this.updateStatus(results);
    
    const duration = Date.now() - startTime;
    this.logger.debug('Health checks completed', { 
      duration: `${duration}ms`,
      status: this.status.overall
    });
  }

  // Run a single health check with timeout
  async runSingleCheck(check) {
    const startTime = Date.now();
    
    try {
      // Wrap check in timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Health check timeout: ${check.name}`));
        }, config.monitoring.healthCheck.timeout);
      });

      const result = await Promise.race([
        check.check(),
        timeoutPromise
      ]);

      const duration = Date.now() - startTime;
      
      check.lastResult = {
        status: 'healthy',
        duration,
        data: result,
        timestamp: new Date().toISOString()
      };
      check.lastError = null;
      check.lastCheck = new Date().toISOString();

      this.logger.debug(`Health check passed: ${check.name}`, {
        duration: `${duration}ms`
      });

      return { check, success: true };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      check.lastResult = {
        status: 'unhealthy',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      check.lastError = error;
      check.lastCheck = new Date().toISOString();

      this.logger.error(`Health check failed: ${check.name}`, {
        error: error.message,
        duration: `${duration}ms`
      });

      return { check, success: false, error };
    }
  }

  // Update overall status based on check results
  updateStatus(results) {
    const components = {};
    let hasFailures = false;
    let hasCriticalFailures = false;

    this.healthChecks.forEach((check, index) => {
      const result = results[index];
      
      components[check.name] = {
        status: check.lastResult?.status || 'unknown',
        lastCheck: check.lastCheck,
        duration: check.lastResult?.duration,
        critical: check.critical,
        error: check.lastError?.message
      };

      if (!result.value?.success) {
        hasFailures = true;
        if (check.critical) {
          hasCriticalFailures = true;
        }
      }
    });

    // Determine overall status
    let overallStatus = 'healthy';
    if (hasCriticalFailures) {
      overallStatus = 'critical';
    } else if (hasFailures) {
      overallStatus = 'degraded';
    }

    this.status = {
      overall: overallStatus,
      components,
      lastCheck: new Date().toISOString(),
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      checksRun: this.healthChecks.length
    };

    // Log status changes
    if (this.lastOverallStatus !== overallStatus) {
      this.logger.info('Health status changed', {
        from: this.lastOverallStatus,
        to: overallStatus
      });
      this.lastOverallStatus = overallStatus;
    }
  }

  // Get current health status
  getStatus() {
    return {
      ...this.status,
      isRunning: this.isRunning
    };
  }

  // Get detailed component status
  getDetailedStatus() {
    return {
      ...this.getStatus(),
      checks: this.healthChecks.map(check => ({
        name: check.name,
        critical: check.critical,
        lastResult: check.lastResult,
        lastError: check.lastError,
        lastCheck: check.lastCheck
      }))
    };
  }

  // Add database health check
  addDatabaseCheck(name, connectionPool) {
    this.addCheck(`database_${name}`, async () => {
      const client = await connectionPool.connect();
      await client.query('SELECT 1');
      client.release();
      return { database: name, status: 'connected' };
    });
  }

  // Add Redis health check
  addRedisCheck(name, redisClient) {
    this.addCheck(`redis_${name}`, async () => {
      await redisClient.ping();
      return { redis: name, status: 'connected' };
    });
  }

  // Add HTTP service health check
  addHttpCheck(name, url) {
    this.addCheck(`http_${name}`, async () => {
      const response = await fetch(url, {
        method: 'GET',
        timeout: config.monitoring.healthCheck.timeout - 1000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return { 
        service: name, 
        status: 'healthy',
        statusCode: response.status 
      };
    });
  }

  // Add memory usage check
  addMemoryCheck(thresholdMB = 1000) {
    this.addCheck('memory_usage', async () => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      
      if (heapUsedMB > thresholdMB) {
        throw new Error(`High memory usage: ${heapUsedMB}MB > ${thresholdMB}MB`);
      }
      
      return {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`
      };
    }, false); // Non-critical
  }

  // Add disk space check
  addDiskSpaceCheck(path = '/', thresholdPercent = 90) {
    this.addCheck('disk_space', async () => {
      const { execSync } = await import('child_process');
      const output = execSync(`df ${path} | tail -1 | awk '{print $5}'`).toString().trim();
      const usagePercent = parseInt(output.replace('%', ''));
      
      if (usagePercent > thresholdPercent) {
        throw new Error(`High disk usage: ${usagePercent}% > ${thresholdPercent}%`);
      }
      
      return {
        path,
        usage: `${usagePercent}%`,
        threshold: `${thresholdPercent}%`
      };
    }, false); // Non-critical
  }
}

export { HealthChecker };