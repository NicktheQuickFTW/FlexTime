/**
 * Performance Monitoring Agent
 * 
 * Specialized agent for monitoring system performance metrics.
 * Tracks response times, request throughput, memory usage, and other performance indicators.
 */

const BaseMonitoringAgent = require('./base_monitoring_agent');
const logger = require("../utils/logger");
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitoringAgent extends BaseMonitoringAgent {
  /**
   * Create a new Performance Monitoring Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config, mcpConnector) {
    super('Performance', 'performance', config, mcpConnector);
    
    // Initialize metrics storage
    this.performanceMetrics = {
      api: {
        responseTimes: {},      // Endpoint -> array of response times
        requestCounts: {},      // Endpoint -> request count
        errorCounts: {},        // Endpoint -> error count
        statusCodes: {}         // Status code -> count
      },
      database: {
        queryTimes: {},         // Query type -> array of execution times
        queryCounts: {},        // Query type -> count
        connectionPool: {
          total: 0,
          used: 0,
          idle: 0,
          waiting: 0
        }
      },
      system: {
        memory: [],             // Array of memory snapshots
        cpu: [],                // Array of CPU usage snapshots
        disk: [],               // Array of disk usage snapshots
        network: []             // Array of network usage snapshots
      },
      thresholds: {
        api: {
          responseTime: this.config.thresholds?.api?.responseTime || 1000, // ms
          errorRate: this.config.thresholds?.api?.errorRate || 0.05 // 5%
        },
        database: {
          queryTime: this.config.thresholds?.database?.queryTime || 500, // ms
          connectionUsage: this.config.thresholds?.database?.connectionUsage || 0.9 // 90%
        },
        system: {
          memoryUsage: this.config.thresholds?.system?.memoryUsage || 0.85, // 85%
          cpuUsage: this.config.thresholds?.system?.cpuUsage || 0.9, // 90%
          diskUsage: this.config.thresholds?.system?.diskUsage || 0.9 // 90%
        }
      },
      historySize: this.config.metricsHistorySize || 100,
      lastCollected: null
    };
    
    // Define performance checks
    this.checks = {
      apiPerformance: {
        enabled: true,
        description: 'Checks API endpoint response times and error rates',
        endpoints: this.config.monitoredEndpoints || []
      },
      databasePerformance: {
        enabled: true,
        description: 'Checks database query performance and connection pool',
        queryTypes: this.config.monitoredQueryTypes || []
      },
      systemResources: {
        enabled: true,
        description: 'Checks system resource usage (CPU, memory, disk, network)',
        resources: this.config.monitoredResources || ['cpu', 'memory', 'disk']
      },
      requestThroughput: {
        enabled: true,
        description: 'Monitors request throughput and concurrency',
        endpoints: this.config.monitoredEndpoints || []
      }
    };
    
    // Configure monitoring schedule (every minute by default for performance)
    this.monitoringSchedule = this.config.schedule || {
      frequency: 'every minute',
      timeUnit: 'minute',
      interval: 1
    };
    
    // Initialize collectors
    this.collectors = {
      api: null,
      database: null,
      system: null
    };
    
    // Initialize previous metrics for rate calculations
    this.previousMetrics = {
      system: {
        network: {
          bytesReceived: 0,
          bytesSent: 0
        },
        time: Date.now()
      }
    };
    
    logger.info('Performance Monitoring Agent initialized');
  }
  
  /**
   * Initialize the agent
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Performance Monitoring Agent');
      
      // Set up API performance monitoring if configured
      if (this.config.apiMonitoring?.enabled) {
        this._setupApiMonitoring();
      }
      
      // Set up database performance monitoring if configured
      if (this.config.databaseMonitoring?.enabled) {
        this._setupDatabaseMonitoring();
      }
      
      // Initialize base
      await super.initialize();
      
      // Collect initial metrics
      await this._collectSystemMetrics();
      
      logger.info('Performance Monitoring Agent initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Performance Monitoring Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Set up API performance monitoring
   * 
   * @private
   */
  _setupApiMonitoring() {
    try {
      // This would typically involve setting up middleware for Express/Koa/etc
      // to collect response times and other metrics
      
      logger.info('API performance monitoring enabled');
      
      // Example implementation for Express might look like:
      /*
      const express = require('express');
      const app = express();
      
      app.use((req, res, next) => {
        const start = Date.now();
        
        // Capture response
        const originalEnd = res.end;
        res.end = (...args) => {
          const duration = Date.now() - start;
          
          // Record metrics
          this.recordApiMetric(req.method + ' ' + req.path, {
            responseTime: duration,
            statusCode: res.statusCode,
            error: res.statusCode >= 400
          });
          
          return originalEnd.apply(res, args);
        };
        
        next();
      });
      */
      
      // For this implementation, we'll rely on the API server to call our recordApiMetric method
    } catch (error) {
      logger.error(`Error setting up API monitoring: ${error.message}`);
    }
  }
  
  /**
   * Set up database performance monitoring
   * 
   * @private
   */
  _setupDatabaseMonitoring() {
    try {
      // This would typically involve wrapping the database client
      // to collect query execution times and connection pool stats
      
      logger.info('Database performance monitoring enabled');
      
      // Example implementation for a database client might look like:
      /*
      const originalQuery = dbClient.query;
      dbClient.query = async (...args) => {
        const start = Date.now();
        
        try {
          const result = await originalQuery.apply(dbClient, args);
          
          // Record metrics
          const duration = Date.now() - start;
          const queryType = this._determineQueryType(args[0]);
          
          this.recordDatabaseMetric(queryType, {
            executionTime: duration,
            success: true
          });
          
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          const queryType = this._determineQueryType(args[0]);
          
          this.recordDatabaseMetric(queryType, {
            executionTime: duration,
            success: false
          });
          
          throw error;
        }
      };
      */
      
      // For this implementation, we'll rely on the database adapter to call our recordDatabaseMetric method
    } catch (error) {
      logger.error(`Error setting up database monitoring: ${error.message}`);
    }
  }
  
  /**
   * Record an API performance metric
   * 
   * @param {string} endpoint - API endpoint (e.g., "GET /api/users")
   * @param {Object} metrics - Metrics to record
   * @param {number} metrics.responseTime - Response time in milliseconds
   * @param {number} metrics.statusCode - HTTP status code
   * @param {boolean} metrics.error - Whether the request resulted in an error
   */
  recordApiMetric(endpoint, metrics) {
    try {
      // Initialize metrics for this endpoint if not exists
      if (!this.performanceMetrics.api.responseTimes[endpoint]) {
        this.performanceMetrics.api.responseTimes[endpoint] = [];
        this.performanceMetrics.api.requestCounts[endpoint] = 0;
        this.performanceMetrics.api.errorCounts[endpoint] = 0;
      }
      
      // Update response times (keep last N entries)
      this.performanceMetrics.api.responseTimes[endpoint].push({
        timestamp: Date.now(),
        duration: metrics.responseTime
      });
      
      if (this.performanceMetrics.api.responseTimes[endpoint].length > this.performanceMetrics.historySize) {
        this.performanceMetrics.api.responseTimes[endpoint].shift();
      }
      
      // Update request count
      this.performanceMetrics.api.requestCounts[endpoint]++;
      
      // Update error count if applicable
      if (metrics.error) {
        this.performanceMetrics.api.errorCounts[endpoint]++;
      }
      
      // Update status code distribution
      const statusCodeKey = Math.floor(metrics.statusCode / 100) + 'xx';
      if (!this.performanceMetrics.api.statusCodes[statusCodeKey]) {
        this.performanceMetrics.api.statusCodes[statusCodeKey] = 0;
      }
      this.performanceMetrics.api.statusCodes[statusCodeKey]++;
      
      // Check for slow response
      if (metrics.responseTime > this.performanceMetrics.thresholds.api.responseTime) {
        this._handleSlowResponse(endpoint, metrics);
      }
    } catch (error) {
      logger.error(`Error recording API metric: ${error.message}`);
    }
  }
  
  /**
   * Record a database performance metric
   * 
   * @param {string} queryType - Type of query (e.g., "SELECT", "INSERT", "UPDATE")
   * @param {Object} metrics - Metrics to record
   * @param {number} metrics.executionTime - Query execution time in milliseconds
   * @param {boolean} metrics.success - Whether the query succeeded
   */
  recordDatabaseMetric(queryType, metrics) {
    try {
      // Initialize metrics for this query type if not exists
      if (!this.performanceMetrics.database.queryTimes[queryType]) {
        this.performanceMetrics.database.queryTimes[queryType] = [];
        this.performanceMetrics.database.queryCounts[queryType] = 0;
      }
      
      // Update query times (keep last N entries)
      this.performanceMetrics.database.queryTimes[queryType].push({
        timestamp: Date.now(),
        duration: metrics.executionTime,
        success: metrics.success
      });
      
      if (this.performanceMetrics.database.queryTimes[queryType].length > this.performanceMetrics.historySize) {
        this.performanceMetrics.database.queryTimes[queryType].shift();
      }
      
      // Update query count
      this.performanceMetrics.database.queryCounts[queryType]++;
      
      // Check for slow query
      if (metrics.executionTime > this.performanceMetrics.thresholds.database.queryTime) {
        this._handleSlowQuery(queryType, metrics);
      }
    } catch (error) {
      logger.error(`Error recording database metric: ${error.message}`);
    }
  }
  
  /**
   * Update database connection pool statistics
   * 
   * @param {Object} poolStats - Connection pool statistics
   * @param {number} poolStats.total - Total connections in pool
   * @param {number} poolStats.used - Used connections
   * @param {number} poolStats.idle - Idle connections
   * @param {number} poolStats.waiting - Waiting clients
   */
  updateConnectionPoolStats(poolStats) {
    try {
      this.performanceMetrics.database.connectionPool = {
        ...poolStats,
        timestamp: Date.now()
      };
      
      // Check for connection pool issues
      const usageRatio = poolStats.used / poolStats.total;
      if (usageRatio > this.performanceMetrics.thresholds.database.connectionUsage) {
        this._handleConnectionPoolIssue(usageRatio, poolStats);
      }
    } catch (error) {
      logger.error(`Error updating connection pool stats: ${error.message}`);
    }
  }
  
  /**
   * Collect system performance metrics
   * 
   * @returns {Promise<Object>} Collected metrics
   * @private
   */
  async _collectSystemMetrics() {
    try {
      const timestamp = Date.now();
      
      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = usedMemory / totalMemory;
      
      // CPU usage (averaged across all cores)
      const cpus = os.cpus();
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
        const idle = cpu.times.idle;
        return acc + (1 - idle / total);
      }, 0) / cpus.length;
      
      // Disk usage (root partition)
      let diskUsage = null;
      try {
        // This is a simplified approach and may not work on all systems
        // In a production environment, use a more robust method
        const diskStats = await fs.stat('/');
        const diskUsed = diskStats.size;
        const diskTotal = diskStats.blocks * diskStats.blksize;
        diskUsage = diskUsed / diskTotal;
      } catch (diskError) {
        logger.warn(`Could not collect disk usage: ${diskError.message}`);
        diskUsage = 0;
      }
      
      // Network usage (calculating rates)
      const networkStats = {
        bytesReceived: 0,
        bytesSent: 0
      };
      
      try {
        // Attempt to read network stats - implementation varies by OS
        // This is just a placeholder - actual implementation would need to be OS-specific
        networkStats.bytesReceived = 0;
        networkStats.bytesSent = 0;
        
        // Calculate rates (bytes per second)
        const timeElapsed = (timestamp - this.previousMetrics.system.time) / 1000; // in seconds
        
        if (timeElapsed > 0) {
          networkStats.receivedRate = (networkStats.bytesReceived - this.previousMetrics.system.network.bytesReceived) / timeElapsed;
          networkStats.sentRate = (networkStats.bytesSent - this.previousMetrics.system.network.bytesSent) / timeElapsed;
        }
        
        // Update previous metrics
        this.previousMetrics.system.network.bytesReceived = networkStats.bytesReceived;
        this.previousMetrics.system.network.bytesSent = networkStats.bytesSent;
        this.previousMetrics.system.time = timestamp;
      } catch (networkError) {
        logger.warn(`Could not collect network usage: ${networkError.message}`);
        networkStats.receivedRate = 0;
        networkStats.sentRate = 0;
      }
      
      // Process metrics
      const processMemoryUsage = process.memoryUsage();
      
      // Create metrics object
      const metrics = {
        timestamp,
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usage: memoryUsage
        },
        cpu: {
          usage: cpuUsage,
          cores: cpus.length
        },
        disk: {
          usage: diskUsage
        },
        network: networkStats,
        process: {
          memory: {
            rss: processMemoryUsage.rss,
            heapTotal: processMemoryUsage.heapTotal,
            heapUsed: processMemoryUsage.heapUsed,
            external: processMemoryUsage.external
          },
          uptime: process.uptime()
        }
      };
      
      // Store metrics
      this.performanceMetrics.system.memory.push({
        timestamp,
        usage: memoryUsage,
        total: totalMemory,
        used: usedMemory
      });
      
      if (this.performanceMetrics.system.memory.length > this.performanceMetrics.historySize) {
        this.performanceMetrics.system.memory.shift();
      }
      
      this.performanceMetrics.system.cpu.push({
        timestamp,
        usage: cpuUsage
      });
      
      if (this.performanceMetrics.system.cpu.length > this.performanceMetrics.historySize) {
        this.performanceMetrics.system.cpu.shift();
      }
      
      this.performanceMetrics.system.disk.push({
        timestamp,
        usage: diskUsage
      });
      
      if (this.performanceMetrics.system.disk.length > this.performanceMetrics.historySize) {
        this.performanceMetrics.system.disk.shift();
      }
      
      this.performanceMetrics.system.network.push({
        timestamp,
        receivedRate: networkStats.receivedRate || 0,
        sentRate: networkStats.sentRate || 0
      });
      
      if (this.performanceMetrics.system.network.length > this.performanceMetrics.historySize) {
        this.performanceMetrics.system.network.shift();
      }
      
      // Check for resource issues
      if (memoryUsage > this.performanceMetrics.thresholds.system.memoryUsage) {
        this._handleHighMemoryUsage(memoryUsage, metrics.memory);
      }
      
      if (cpuUsage > this.performanceMetrics.thresholds.system.cpuUsage) {
        this._handleHighCpuUsage(cpuUsage, metrics.cpu);
      }
      
      if (diskUsage && diskUsage > this.performanceMetrics.thresholds.system.diskUsage) {
        this._handleHighDiskUsage(diskUsage, metrics.disk);
      }
      
      this.performanceMetrics.lastCollected = timestamp;
      
      return metrics;
    } catch (error) {
      logger.error(`Error collecting system metrics: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Handle slow API response
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} metrics - Response metrics
   * @private
   */
  _handleSlowResponse(endpoint, metrics) {
    // Create an issue for the slow response
    const issue = {
      type: 'slow_api_response',
      severity: this.severityLevels.MEDIUM,
      description: `Slow API response detected for ${endpoint}`,
      entity: endpoint,
      details: {
        responseTime: metrics.responseTime,
        threshold: this.performanceMetrics.thresholds.api.responseTime,
        statusCode: metrics.statusCode,
        timestamp: Date.now()
      },
      source: 'api_performance_check',
      autoFixable: false
    };
    
    // Add issue to monitoring data (on next scan)
    this._addIssueToNextScan(issue);
    
    logger.warn(`Slow API response for ${endpoint}: ${metrics.responseTime}ms (threshold: ${this.performanceMetrics.thresholds.api.responseTime}ms)`);
  }
  
  /**
   * Handle slow database query
   * 
   * @param {string} queryType - Type of query
   * @param {Object} metrics - Query metrics
   * @private
   */
  _handleSlowQuery(queryType, metrics) {
    // Create an issue for the slow query
    const issue = {
      type: 'slow_database_query',
      severity: this.severityLevels.MEDIUM,
      description: `Slow database query detected for ${queryType}`,
      entity: `database.${queryType}`,
      details: {
        executionTime: metrics.executionTime,
        threshold: this.performanceMetrics.thresholds.database.queryTime,
        success: metrics.success,
        timestamp: Date.now()
      },
      source: 'database_performance_check',
      autoFixable: false
    };
    
    // Add issue to monitoring data (on next scan)
    this._addIssueToNextScan(issue);
    
    logger.warn(`Slow database query for ${queryType}: ${metrics.executionTime}ms (threshold: ${this.performanceMetrics.thresholds.database.queryTime}ms)`);
  }
  
  /**
   * Handle connection pool issue
   * 
   * @param {number} usageRatio - Connection usage ratio
   * @param {Object} poolStats - Connection pool statistics
   * @private
   */
  _handleConnectionPoolIssue(usageRatio, poolStats) {
    // Create an issue for the connection pool
    const issue = {
      type: 'high_connection_pool_usage',
      severity: this.severityLevels.HIGH,
      description: `High database connection pool usage`,
      entity: `database.connection_pool`,
      details: {
        usageRatio,
        threshold: this.performanceMetrics.thresholds.database.connectionUsage,
        used: poolStats.used,
        total: poolStats.total,
        waiting: poolStats.waiting,
        timestamp: Date.now()
      },
      source: 'database_performance_check',
      autoFixable: false
    };
    
    // Add issue to monitoring data (on next scan)
    this._addIssueToNextScan(issue);
    
    logger.warn(`High connection pool usage: ${(usageRatio * 100).toFixed(1)}% (threshold: ${(this.performanceMetrics.thresholds.database.connectionUsage * 100).toFixed(1)}%)`);
  }
  
  /**
   * Handle high memory usage
   * 
   * @param {number} usageRatio - Memory usage ratio
   * @param {Object} memoryStats - Memory statistics
   * @private
   */
  _handleHighMemoryUsage(usageRatio, memoryStats) {
    // Create an issue for high memory usage
    const issue = {
      type: 'high_memory_usage',
      severity: this.severityLevels.HIGH,
      description: `High system memory usage`,
      entity: `system.memory`,
      details: {
        usageRatio,
        threshold: this.performanceMetrics.thresholds.system.memoryUsage,
        total: memoryStats.total,
        used: memoryStats.used,
        free: memoryStats.free,
        timestamp: Date.now()
      },
      source: 'system_resources_check',
      autoFixable: false
    };
    
    // Add issue to monitoring data (on next scan)
    this._addIssueToNextScan(issue);
    
    logger.warn(`High memory usage: ${(usageRatio * 100).toFixed(1)}% (threshold: ${(this.performanceMetrics.thresholds.system.memoryUsage * 100).toFixed(1)}%)`);
  }
  
  /**
   * Handle high CPU usage
   * 
   * @param {number} usageRatio - CPU usage ratio
   * @param {Object} cpuStats - CPU statistics
   * @private
   */
  _handleHighCpuUsage(usageRatio, cpuStats) {
    // Create an issue for high CPU usage
    const issue = {
      type: 'high_cpu_usage',
      severity: this.severityLevels.HIGH,
      description: `High system CPU usage`,
      entity: `system.cpu`,
      details: {
        usageRatio,
        threshold: this.performanceMetrics.thresholds.system.cpuUsage,
        cores: cpuStats.cores,
        timestamp: Date.now()
      },
      source: 'system_resources_check',
      autoFixable: false
    };
    
    // Add issue to monitoring data (on next scan)
    this._addIssueToNextScan(issue);
    
    logger.warn(`High CPU usage: ${(usageRatio * 100).toFixed(1)}% (threshold: ${(this.performanceMetrics.thresholds.system.cpuUsage * 100).toFixed(1)}%)`);
  }
  
  /**
   * Handle high disk usage
   * 
   * @param {number} usageRatio - Disk usage ratio
   * @param {Object} diskStats - Disk statistics
   * @private
   */
  _handleHighDiskUsage(usageRatio, diskStats) {
    // Create an issue for high disk usage
    const issue = {
      type: 'high_disk_usage',
      severity: this.severityLevels.HIGH,
      description: `High system disk usage`,
      entity: `system.disk`,
      details: {
        usageRatio,
        threshold: this.performanceMetrics.thresholds.system.diskUsage,
        timestamp: Date.now()
      },
      source: 'system_resources_check',
      autoFixable: false
    };
    
    // Add issue to monitoring data (on next scan)
    this._addIssueToNextScan(issue);
    
    logger.warn(`High disk usage: ${(usageRatio * 100).toFixed(1)}% (threshold: ${(this.performanceMetrics.thresholds.system.diskUsage * 100).toFixed(1)}%)`);
  }
  
  /**
   * Add an issue to be included in the next scan
   * 
   * @param {Object} issue - Issue to add
   * @private
   */
  _addIssueToNextScan(issue) {
    if (!this.pendingIssues) {
      this.pendingIssues = [];
    }
    
    this.pendingIssues.push(issue);
  }
  
  /**
   * Perform a monitoring scan
   * 
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   * @private
   */
  async _performScan(options = {}) {
    try {
      logger.info('Performing performance monitoring scan');
      
      const startTime = Date.now();
      const issues = [];
      const checkStats = {};
      
      // Collect system metrics
      const systemMetrics = await this._collectSystemMetrics();
      
      // Determine which checks to run
      const checksToRun = options.checks || Object.keys(this.checks);
      const filteredChecks = checksToRun.filter(check => 
        this.checks[check] && this.checks[check].enabled &&
        !this.monitoringConfig.disabledChecks.includes(check) &&
        (this.monitoringConfig.enabledChecks.includes('all') || 
         this.monitoringConfig.enabledChecks.includes(check))
      );
      
      logger.info(`Running ${filteredChecks.length} performance checks`);
      
      // Run each check
      for (const checkName of filteredChecks) {
        const check = this.checks[checkName];
        logger.info(`Running ${checkName} check`);
        
        const checkStartTime = Date.now();
        let checkIssues = [];
        
        try {
          switch (checkName) {
            case 'apiPerformance':
              checkIssues = await this._checkApiPerformance(check.endpoints);
              break;
              
            case 'databasePerformance':
              checkIssues = await this._checkDatabasePerformance(check.queryTypes);
              break;
              
            case 'systemResources':
              checkIssues = await this._checkSystemResources(check.resources);
              break;
              
            case 'requestThroughput':
              checkIssues = await this._checkRequestThroughput(check.endpoints);
              break;
          }
          
          // Add issues to main list
          issues.push(...checkIssues);
          
          // Record check statistics
          const checkDuration = Date.now() - checkStartTime;
          checkStats[checkName] = {
            issues: checkIssues.length,
            duration: checkDuration,
            status: 'success'
          };
          
          logger.info(`${checkName} check completed in ${checkDuration}ms with ${checkIssues.length} issues`);
        } catch (error) {
          logger.error(`Error running ${checkName} check: ${error.message}`);
          
          // Record check failure
          checkStats[checkName] = {
            issues: 0,
            duration: Date.now() - checkStartTime,
            status: 'error',
            error: error.message
          };
        }
      }
      
      // Add any pending issues from real-time monitoring
      if (this.pendingIssues && this.pendingIssues.length > 0) {
        issues.push(...this.pendingIssues);
        this.pendingIssues = [];
      }
      
      // Get scan duration
      const scanDuration = Date.now() - startTime;
      
      logger.info(`Performance monitoring scan completed in ${scanDuration}ms with ${issues.length} issues`);
      
      return {
        issues,
        checkStats,
        duration: scanDuration,
        metrics: {
          system: systemMetrics,
          lastCollected: this.performanceMetrics.lastCollected
        }
      };
    } catch (error) {
      logger.error(`Error during performance monitoring scan: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check API performance
   * 
   * @param {Array<string>} endpoints - API endpoints to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkApiPerformance(endpoints = []) {
    const issues = [];
    
    // If no endpoints specified, check all endpoints with metrics
    if (!endpoints || endpoints.length === 0) {
      endpoints = Object.keys(this.performanceMetrics.api.responseTimes);
    }
    
    for (const endpoint of endpoints) {
      // Skip if no data for this endpoint
      if (!this.performanceMetrics.api.responseTimes[endpoint] || 
          this.performanceMetrics.api.responseTimes[endpoint].length === 0) {
        continue;
      }
      
      const responseTimes = this.performanceMetrics.api.responseTimes[endpoint];
      const requestCount = this.performanceMetrics.api.requestCounts[endpoint] || 0;
      const errorCount = this.performanceMetrics.api.errorCounts[endpoint] || 0;
      
      // Calculate average response time (last N requests)
      const avgResponseTime = responseTimes.reduce((sum, item) => sum + item.duration, 0) / responseTimes.length;
      
      // Calculate p95 response time
      const sortedTimes = [...responseTimes].sort((a, b) => a.duration - b.duration);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p95ResponseTime = sortedTimes[p95Index]?.duration || avgResponseTime;
      
      // Calculate error rate
      const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
      
      // Check for high average response time
      if (avgResponseTime > this.performanceMetrics.thresholds.api.responseTime) {
        issues.push({
          type: 'high_average_response_time',
          severity: this.severityLevels.MEDIUM,
          description: `High average response time for ${endpoint}`,
          entity: endpoint,
          details: {
            avgResponseTime,
            p95ResponseTime,
            threshold: this.performanceMetrics.thresholds.api.responseTime,
            sampleSize: responseTimes.length,
            requestCount
          },
          source: 'api_performance_check',
          autoFixable: false
        });
      }
      
      // Check for high error rate
      if (errorRate > this.performanceMetrics.thresholds.api.errorRate) {
        issues.push({
          type: 'high_error_rate',
          severity: this.severityLevels.HIGH,
          description: `High error rate for ${endpoint}`,
          entity: endpoint,
          details: {
            errorRate,
            errorCount,
            requestCount,
            threshold: this.performanceMetrics.thresholds.api.errorRate
          },
          source: 'api_performance_check',
          autoFixable: false
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check database performance
   * 
   * @param {Array<string>} queryTypes - Query types to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkDatabasePerformance(queryTypes = []) {
    const issues = [];
    
    // If no query types specified, check all query types with metrics
    if (!queryTypes || queryTypes.length === 0) {
      queryTypes = Object.keys(this.performanceMetrics.database.queryTimes);
    }
    
    for (const queryType of queryTypes) {
      // Skip if no data for this query type
      if (!this.performanceMetrics.database.queryTimes[queryType] || 
          this.performanceMetrics.database.queryTimes[queryType].length === 0) {
        continue;
      }
      
      const queryTimes = this.performanceMetrics.database.queryTimes[queryType];
      const queryCount = this.performanceMetrics.database.queryCounts[queryType] || 0;
      
      // Calculate average query time (last N queries)
      const avgQueryTime = queryTimes.reduce((sum, item) => sum + item.duration, 0) / queryTimes.length;
      
      // Calculate p95 query time
      const sortedTimes = [...queryTimes].sort((a, b) => a.duration - b.duration);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p95QueryTime = sortedTimes[p95Index]?.duration || avgQueryTime;
      
      // Calculate error rate
      const errorCount = queryTimes.filter(item => !item.success).length;
      const errorRate = queryTimes.length > 0 ? errorCount / queryTimes.length : 0;
      
      // Check for high average query time
      if (avgQueryTime > this.performanceMetrics.thresholds.database.queryTime) {
        issues.push({
          type: 'high_average_query_time',
          severity: this.severityLevels.MEDIUM,
          description: `High average query time for ${queryType}`,
          entity: `database.${queryType}`,
          details: {
            avgQueryTime,
            p95QueryTime,
            threshold: this.performanceMetrics.thresholds.database.queryTime,
            sampleSize: queryTimes.length,
            queryCount
          },
          source: 'database_performance_check',
          autoFixable: false
        });
      }
      
      // Check for high query error rate
      if (errorRate > 0.01) { // 1% error rate
        issues.push({
          type: 'high_query_error_rate',
          severity: this.severityLevels.HIGH,
          description: `High query error rate for ${queryType}`,
          entity: `database.${queryType}`,
          details: {
            errorRate,
            errorCount,
            queryCount: queryTimes.length,
            threshold: 0.01
          },
          source: 'database_performance_check',
          autoFixable: false
        });
      }
    }
    
    // Check connection pool
    const connectionPool = this.performanceMetrics.database.connectionPool;
    if (connectionPool.total > 0) {
      const usageRatio = connectionPool.used / connectionPool.total;
      
      if (usageRatio > this.performanceMetrics.thresholds.database.connectionUsage) {
        issues.push({
          type: 'high_connection_pool_usage',
          severity: this.severityLevels.HIGH,
          description: `High database connection pool usage`,
          entity: `database.connection_pool`,
          details: {
            usageRatio,
            used: connectionPool.used,
            total: connectionPool.total,
            idle: connectionPool.idle,
            waiting: connectionPool.waiting,
            threshold: this.performanceMetrics.thresholds.database.connectionUsage
          },
          source: 'database_performance_check',
          autoFixable: false
        });
      }
      
      if (connectionPool.waiting > 0) {
        issues.push({
          type: 'connection_pool_waiting',
          severity: this.severityLevels.MEDIUM,
          description: `Clients waiting for database connections`,
          entity: `database.connection_pool`,
          details: {
            waiting: connectionPool.waiting,
            used: connectionPool.used,
            total: connectionPool.total,
            idle: connectionPool.idle
          },
          source: 'database_performance_check',
          autoFixable: false
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check system resources
   * 
   * @param {Array<string>} resources - Resources to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkSystemResources(resources = ['cpu', 'memory', 'disk']) {
    const issues = [];
    
    // Check CPU usage
    if (resources.includes('cpu') && this.performanceMetrics.system.cpu.length > 0) {
      const cpuMetrics = this.performanceMetrics.system.cpu;
      const latestCpuUsage = cpuMetrics[cpuMetrics.length - 1].usage;
      
      // Calculate average CPU usage (last N samples)
      const avgCpuUsage = cpuMetrics.reduce((sum, item) => sum + item.usage, 0) / cpuMetrics.length;
      
      if (avgCpuUsage > this.performanceMetrics.thresholds.system.cpuUsage) {
        issues.push({
          type: 'high_average_cpu_usage',
          severity: this.severityLevels.HIGH,
          description: `High average CPU usage`,
          entity: `system.cpu`,
          details: {
            avgUsage: avgCpuUsage,
            currentUsage: latestCpuUsage,
            threshold: this.performanceMetrics.thresholds.system.cpuUsage,
            sampleSize: cpuMetrics.length
          },
          source: 'system_resources_check',
          autoFixable: false
        });
      }
      
      // Check for CPU spikes (if latest is significantly higher than average)
      if (latestCpuUsage > avgCpuUsage * 1.5 && latestCpuUsage > this.performanceMetrics.thresholds.system.cpuUsage) {
        issues.push({
          type: 'cpu_usage_spike',
          severity: this.severityLevels.MEDIUM,
          description: `CPU usage spike detected`,
          entity: `system.cpu`,
          details: {
            currentUsage: latestCpuUsage,
            avgUsage: avgCpuUsage,
            threshold: this.performanceMetrics.thresholds.system.cpuUsage
          },
          source: 'system_resources_check',
          autoFixable: false
        });
      }
    }
    
    // Check memory usage
    if (resources.includes('memory') && this.performanceMetrics.system.memory.length > 0) {
      const memoryMetrics = this.performanceMetrics.system.memory;
      const latestMemoryUsage = memoryMetrics[memoryMetrics.length - 1].usage;
      
      // Calculate average memory usage (last N samples)
      const avgMemoryUsage = memoryMetrics.reduce((sum, item) => sum + item.usage, 0) / memoryMetrics.length;
      
      if (avgMemoryUsage > this.performanceMetrics.thresholds.system.memoryUsage) {
        issues.push({
          type: 'high_average_memory_usage',
          severity: this.severityLevels.HIGH,
          description: `High average memory usage`,
          entity: `system.memory`,
          details: {
            avgUsage: avgMemoryUsage,
            currentUsage: latestMemoryUsage,
            threshold: this.performanceMetrics.thresholds.system.memoryUsage,
            totalMemory: memoryMetrics[memoryMetrics.length - 1].total,
            usedMemory: memoryMetrics[memoryMetrics.length - 1].used,
            sampleSize: memoryMetrics.length
          },
          source: 'system_resources_check',
          autoFixable: false
        });
      }
      
      // Check for memory growth trend
      if (memoryMetrics.length >= 5) {
        const olderSamples = memoryMetrics.slice(0, Math.floor(memoryMetrics.length / 2));
        const newerSamples = memoryMetrics.slice(Math.floor(memoryMetrics.length / 2));
        
        const olderAvg = olderSamples.reduce((sum, item) => sum + item.usage, 0) / olderSamples.length;
        const newerAvg = newerSamples.reduce((sum, item) => sum + item.usage, 0) / newerSamples.length;
        
        if (newerAvg > olderAvg * 1.1 && newerAvg > this.performanceMetrics.thresholds.system.memoryUsage * 0.8) {
          issues.push({
            type: 'memory_usage_growth',
            severity: this.severityLevels.MEDIUM,
            description: `Memory usage growing trend detected`,
            entity: `system.memory`,
            details: {
              newerAvgUsage: newerAvg,
              olderAvgUsage: olderAvg,
              growthRatio: newerAvg / olderAvg,
              currentUsage: latestMemoryUsage,
              threshold: this.performanceMetrics.thresholds.system.memoryUsage
            },
            source: 'system_resources_check',
            autoFixable: false
          });
        }
      }
    }
    
    // Check disk usage
    if (resources.includes('disk') && this.performanceMetrics.system.disk.length > 0) {
      const diskMetrics = this.performanceMetrics.system.disk;
      const latestDiskUsage = diskMetrics[diskMetrics.length - 1].usage;
      
      if (latestDiskUsage > this.performanceMetrics.thresholds.system.diskUsage) {
        issues.push({
          type: 'high_disk_usage',
          severity: this.severityLevels.HIGH,
          description: `High disk usage`,
          entity: `system.disk`,
          details: {
            currentUsage: latestDiskUsage,
            threshold: this.performanceMetrics.thresholds.system.diskUsage
          },
          source: 'system_resources_check',
          autoFixable: false
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check request throughput
   * 
   * @param {Array<string>} endpoints - API endpoints to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkRequestThroughput(endpoints = []) {
    const issues = [];
    
    // If no endpoints specified, check all endpoints with metrics
    if (!endpoints || endpoints.length === 0) {
      endpoints = Object.keys(this.performanceMetrics.api.responseTimes);
    }
    
    // Calculate overall throughput across all endpoints
    let totalRequests = 0;
    let totalErrors = 0;
    
    for (const endpoint of Object.keys(this.performanceMetrics.api.requestCounts)) {
      totalRequests += this.performanceMetrics.api.requestCounts[endpoint] || 0;
      totalErrors += this.performanceMetrics.api.errorCounts[endpoint] || 0;
    }
    
    // Calculate requests per second (simplified - using last collected timestamp)
    if (this.performanceMetrics.lastCollected && totalRequests > 0) {
      const now = Date.now();
      const elapsed = (now - this.performanceMetrics.lastCollected) / 1000; // seconds
      
      if (elapsed > 0) {
        const requestsPerSecond = totalRequests / elapsed;
        
        // Check for throughput issues (this is very application-specific)
        // For this example, we'll just report it as informational
        if (requestsPerSecond > 0) {
          issues.push({
            type: 'request_throughput',
            severity: this.severityLevels.INFO,
            description: `System request throughput`,
            entity: `api.throughput`,
            details: {
              requestsPerSecond,
              totalRequests,
              timeFrame: elapsed,
              errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0
            },
            source: 'request_throughput_check',
            autoFixable: false
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Get performance metrics
   * 
   * @param {Object} options - Filter and aggregation options
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(options = {}) {
    try {
      // Create a copy of the metrics
      const metrics = JSON.parse(JSON.stringify(this.performanceMetrics));
      
      // Apply filters if provided
      if (options.timeRange) {
        const { start, end } = options.timeRange;
        const startTime = start ? new Date(start).getTime() : 0;
        const endTime = end ? new Date(end).getTime() : Date.now();
        
        // Filter API metrics
        for (const endpoint in metrics.api.responseTimes) {
          metrics.api.responseTimes[endpoint] = metrics.api.responseTimes[endpoint].filter(
            item => item.timestamp >= startTime && item.timestamp <= endTime
          );
        }
        
        // Filter DB metrics
        for (const queryType in metrics.database.queryTimes) {
          metrics.database.queryTimes[queryType] = metrics.database.queryTimes[queryType].filter(
            item => item.timestamp >= startTime && item.timestamp <= endTime
          );
        }
        
        // Filter system metrics
        metrics.system.memory = metrics.system.memory.filter(
          item => item.timestamp >= startTime && item.timestamp <= endTime
        );
        
        metrics.system.cpu = metrics.system.cpu.filter(
          item => item.timestamp >= startTime && item.timestamp <= endTime
        );
        
        metrics.system.disk = metrics.system.disk.filter(
          item => item.timestamp >= startTime && item.timestamp <= endTime
        );
        
        metrics.system.network = metrics.system.network.filter(
          item => item.timestamp >= startTime && item.timestamp <= endTime
        );
      }
      
      // Calculate aggregations
      if (options.calculateAggregations) {
        const aggregations = {
          api: {},
          database: {},
          system: {}
        };
        
        // API aggregations
        for (const endpoint in metrics.api.responseTimes) {
          if (metrics.api.responseTimes[endpoint].length > 0) {
            const responseTimes = metrics.api.responseTimes[endpoint].map(item => item.duration);
            aggregations.api[endpoint] = {
              avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
              minResponseTime: Math.min(...responseTimes),
              maxResponseTime: Math.max(...responseTimes),
              p95ResponseTime: this._calculatePercentile(responseTimes, 95),
              requestCount: metrics.api.requestCounts[endpoint] || 0,
              errorCount: metrics.api.errorCounts[endpoint] || 0,
              errorRate: metrics.api.requestCounts[endpoint] > 0 
                ? (metrics.api.errorCounts[endpoint] || 0) / metrics.api.requestCounts[endpoint]
                : 0
            };
          }
        }
        
        // Database aggregations
        for (const queryType in metrics.database.queryTimes) {
          if (metrics.database.queryTimes[queryType].length > 0) {
            const queryTimes = metrics.database.queryTimes[queryType].map(item => item.duration);
            aggregations.database[queryType] = {
              avgQueryTime: queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length,
              minQueryTime: Math.min(...queryTimes),
              maxQueryTime: Math.max(...queryTimes),
              p95QueryTime: this._calculatePercentile(queryTimes, 95),
              queryCount: metrics.database.queryCounts[queryType] || 0,
              errorCount: metrics.database.queryTimes[queryType].filter(item => !item.success).length,
              errorRate: metrics.database.queryTimes[queryType].length > 0
                ? metrics.database.queryTimes[queryType].filter(item => !item.success).length / metrics.database.queryTimes[queryType].length
                : 0
            };
          }
        }
        
        // System aggregations
        if (metrics.system.memory.length > 0) {
          const memoryUsages = metrics.system.memory.map(item => item.usage);
          aggregations.system.memory = {
            avgUsage: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
            minUsage: Math.min(...memoryUsages),
            maxUsage: Math.max(...memoryUsages),
            currentUsage: memoryUsages[memoryUsages.length - 1],
            totalMemory: metrics.system.memory[metrics.system.memory.length - 1].total
          };
        }
        
        if (metrics.system.cpu.length > 0) {
          const cpuUsages = metrics.system.cpu.map(item => item.usage);
          aggregations.system.cpu = {
            avgUsage: cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length,
            minUsage: Math.min(...cpuUsages),
            maxUsage: Math.max(...cpuUsages),
            currentUsage: cpuUsages[cpuUsages.length - 1]
          };
        }
        
        if (metrics.system.disk.length > 0) {
          const diskUsages = metrics.system.disk.map(item => item.usage);
          aggregations.system.disk = {
            avgUsage: diskUsages.reduce((sum, usage) => sum + usage, 0) / diskUsages.length,
            minUsage: Math.min(...diskUsages),
            maxUsage: Math.max(...diskUsages),
            currentUsage: diskUsages[diskUsages.length - 1]
          };
        }
        
        // Add aggregations to metrics
        metrics.aggregations = aggregations;
      }
      
      return metrics;
    } catch (error) {
      logger.error(`Error getting performance metrics: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate a percentile value from an array
   * 
   * @param {Array<number>} values - Array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   * @private
   */
  _calculatePercentile(values, percentile) {
    if (!values || values.length === 0) {
      return 0;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  /**
   * Attempt to automatically fix an issue
   * 
   * @param {Object} issue - Issue to fix
   * @returns {Promise<Object>} Fix result
   * @private
   */
  async _attemptAutoFix(issue) {
    // Performance issues generally cannot be auto-fixed
    return {
      success: false,
      message: `Auto-fix not supported for performance issues`
    };
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing Performance Monitoring task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'run_scan':
        return await this.runMonitoringScan(task.parameters);
        
      case 'get_performance_metrics':
        return await this.getPerformanceMetrics(task.parameters);
        
      case 'record_api_metric':
        this.recordApiMetric(task.parameters.endpoint, task.parameters.metrics);
        return { success: true };
        
      case 'record_database_metric':
        this.recordDatabaseMetric(task.parameters.queryType, task.parameters.metrics);
        return { success: true };
        
      case 'update_connection_pool_stats':
        this.updateConnectionPoolStats(task.parameters.poolStats);
        return { success: true };
        
      default:
        return await super._processTask(task);
    }
  }
  
  /**
   * Process a message.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'record_metric') {
      const metricType = message.content.type;
      
      if (metricType === 'api') {
        const task = this.createTask(
          'record_api_metric',
          `Record API metric for ${message.content.endpoint}`,
          {
            endpoint: message.content.endpoint,
            metrics: message.content.metrics
          }
        );
        
        this.submitTask(task);
      } else if (metricType === 'database') {
        const task = this.createTask(
          'record_database_metric',
          `Record database metric for ${message.content.queryType}`,
          {
            queryType: message.content.queryType,
            metrics: message.content.metrics
          }
        );
        
        this.submitTask(task);
      } else if (metricType === 'connection_pool') {
        const task = this.createTask(
          'update_connection_pool_stats',
          `Update connection pool statistics`,
          {
            poolStats: message.content.stats
          }
        );
        
        this.submitTask(task);
      }
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info('Stopping Performance Monitoring Agent');
    
    // Save any collected metrics
    const metricsFilePath = path.join(this.dataDirectory, 'performance_metrics.json');
    
    try {
      await fs.writeFile(
        metricsFilePath,
        JSON.stringify(this.performanceMetrics, null, 2),
        'utf8'
      );
      
      logger.info('Saved performance metrics to disk');
    } catch (error) {
      logger.error(`Error saving performance metrics: ${error.message}`);
    }
    
    // Call parent implementation
    await super.stop();
  }
}

module.exports = PerformanceMonitoringAgent;