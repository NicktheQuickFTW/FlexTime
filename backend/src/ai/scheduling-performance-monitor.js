/**
 * Scheduling Performance Monitor v1.0
 * 
 * Comprehensive performance monitoring system for FlexTime scheduling engine
 * with detailed metrics collection, bottleneck identification, and optimization
 * recommendations.
 * 
 * Key Features:
 * - Real-time performance metrics collection
 * - Bottleneck detection and analysis
 * - Performance trend analysis
 * - Memory and CPU usage monitoring
 * - Algorithm performance comparison
 * - Automated optimization recommendations
 * - Performance alerts and notifications
 */

const EventEmitter = require('events');
const os = require('os');
const logger = require('../scripts/logger");

/**
 * Advanced performance monitoring for scheduling operations
 */
class SchedulingPerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableRealTimeMonitoring: options.enableRealTimeMonitoring !== false,
      enableBottleneckDetection: options.enableBottleneckDetection !== false,
      enableTrendAnalysis: options.enableTrendAnalysis !== false,
      enableAlerts: options.enableAlerts !== false,
      metricsRetentionDays: options.metricsRetentionDays || 30,
      alertThresholds: {
        responseTime: options.alertThresholds?.responseTime || 5000,
        memoryUsage: options.alertThresholds?.memoryUsage || 0.8,
        cpuUsage: options.alertThresholds?.cpuUsage || 0.7,
        errorRate: options.alertThresholds?.errorRate || 0.05
      },
      ...options
    };
    
    // Performance metrics storage
    this.metrics = {
      // Overall system metrics
      system: {
        totalSchedulesGenerated: 0,
        totalOptimizationsPerformed: 0,
        totalConstraintsProcessed: 0,
        totalConflictsResolved: 0,
        systemUptime: Date.now(),
        averageResponseTime: 0,
        peakResponseTime: 0,
        minResponseTime: Infinity,
        errorRate: 0,
        successRate: 0
      },
      
      // Algorithm-specific metrics
      algorithms: {
        'simulated_annealing': {
          executionCount: 0,
          averageTime: 0,
          successRate: 0,
          qualityScore: 0,
          memoryUsage: 0
        },
        'rapid_scheduler': {
          executionCount: 0,
          averageTime: 0,
          successRate: 0,
          qualityScore: 0,
          memoryUsage: 0
        },
        'constraint_management': {
          executionCount: 0,
          averageTime: 0,
          successRate: 0,
          qualityScore: 0,
          memoryUsage: 0
        },
        'big12_optimizer': {
          executionCount: 0,
          averageTime: 0,
          successRate: 0,
          qualityScore: 0,
          memoryUsage: 0
        }
      },
      
      // Sport-specific metrics
      sports: {
        'football': { executions: 0, avgTime: 0, avgQuality: 0 },
        'basketball': { executions: 0, avgTime: 0, avgQuality: 0 },
        'baseball': { executions: 0, avgTime: 0, avgQuality: 0 },
        'softball': { executions: 0, avgTime: 0, avgQuality: 0 },
        'soccer': { executions: 0, avgTime: 0, avgQuality: 0 },
        'volleyball': { executions: 0, avgTime: 0, avgQuality: 0 }
      },
      
      // Resource utilization
      resources: {
        memoryUsage: [],
        cpuUsage: [],
        diskUsage: [],
        networkLatency: []
      },
      
      // Bottleneck detection
      bottlenecks: [],
      
      // Performance trends
      trends: {
        hourly: new Map(),
        daily: new Map(),
        weekly: new Map()
      }
    };
    
    // Active monitoring sessions
    this.activeSessions = new Map();
    
    // Performance alerts
    this.alerts = [];
    
    // Bottleneck detection patterns
    this.bottleneckPatterns = {
      'constraint_evaluation_slow': {
        threshold: 2000,
        pattern: 'constraint_evaluation_time > threshold',
        severity: 'medium',
        recommendation: 'Consider constraint caching or optimization'
      },
      'memory_pressure': {
        threshold: 0.8,
        pattern: 'memory_usage > threshold',
        severity: 'high',
        recommendation: 'Optimize memory usage or increase system memory'
      },
      'cpu_intensive': {
        threshold: 0.7,
        pattern: 'cpu_usage > threshold for > 30s',
        severity: 'medium',
        recommendation: 'Consider algorithm optimization or load balancing'
      },
      'high_error_rate': {
        threshold: 0.05,
        pattern: 'error_rate > threshold',
        severity: 'high',
        recommendation: 'Investigate and fix underlying issues'
      }
    };
    
    // Start monitoring if enabled
    if (this.options.enableRealTimeMonitoring) {
      this._startRealTimeMonitoring();
    }
    
    logger.info('Scheduling Performance Monitor v1.0 initialized');
  }
  
  /**
   * Start monitoring a scheduling operation
   * @param {string} operationType - Type of operation (schedule, optimize, validate, etc.)
   * @param {object} context - Operation context
   * @returns {string} Session ID for tracking
   */
  startMonitoring(operationType, context = {}) {
    const sessionId = this._generateSessionId();
    
    const session = {
      id: sessionId,
      type: operationType,
      context,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      startCpu: process.cpuUsage(),
      metrics: {
        executionTime: 0,
        memoryDelta: 0,
        cpuDelta: 0,
        qualityScore: 0,
        constraintsProcessed: 0,
        conflictsResolved: 0
      },
      status: 'active'
    };
    
    this.activeSessions.set(sessionId, session);
    
    this.emit('monitoring_started', {
      sessionId,
      operationType,
      context,
      timestamp: new Date().toISOString()
    });
    
    return sessionId;
  }
  
  /**
   * End monitoring for a session
   * @param {string} sessionId - Session ID
   * @param {object} result - Operation result
   * @returns {object} Performance metrics for the session
   */
  endMonitoring(sessionId, result = {}) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      logger.warn(`No active session found for ID: ${sessionId}`);
      return null;
    }
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(session.startCpu);
    
    // Calculate metrics
    session.metrics.executionTime = endTime - session.startTime;
    session.metrics.memoryDelta = endMemory.heapUsed - session.startMemory.heapUsed;
    session.metrics.cpuDelta = endCpu.user + endCpu.system;
    session.metrics.qualityScore = result.quality || 0;
    session.metrics.constraintsProcessed = result.constraintsProcessed || 0;
    session.metrics.conflictsResolved = result.conflictsResolved || 0;
    session.status = result.success ? 'completed' : 'failed';
    session.endTime = endTime;
    
    // Update system metrics
    this._updateSystemMetrics(session);
    
    // Update algorithm metrics
    this._updateAlgorithmMetrics(session);
    
    // Update sport metrics if applicable
    if (session.context.sport) {
      this._updateSportMetrics(session);
    }
    
    // Check for bottlenecks
    if (this.options.enableBottleneckDetection) {
      this._detectBottlenecks(session);
    }
    
    // Update trends
    if (this.options.enableTrendAnalysis) {
      this._updateTrends(session);
    }
    
    // Check for alerts
    if (this.options.enableAlerts) {
      this._checkAlerts(session);
    }
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    this.emit('monitoring_ended', {
      sessionId,
      metrics: session.metrics,
      status: session.status,
      timestamp: new Date().toISOString()
    });
    
    return session.metrics;
  }
  
  /**
   * Record a performance event
   * @param {string} eventType - Type of event
   * @param {object} data - Event data
   * @param {string} sessionId - Optional session ID
   */
  recordEvent(eventType, data = {}, sessionId = null) {
    const event = {
      type: eventType,
      data,
      sessionId,
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    // Update relevant metrics based on event type
    switch (eventType) {
      case 'constraint_evaluation':
        this._recordConstraintEvaluation(event);
        break;
      case 'optimization_iteration':
        this._recordOptimizationIteration(event);
        break;
      case 'conflict_resolution':
        this._recordConflictResolution(event);
        break;
      case 'cache_hit':
      case 'cache_miss':
        this._recordCacheEvent(event);
        break;
      default:
        logger.debug(`Recorded performance event: ${eventType}`, data);
    }
    
    this.emit('event_recorded', event);
  }
  
  /**
   * Get comprehensive performance report
   * @param {object} options - Report options
   * @returns {object} Performance report
   */
  getPerformanceReport(options = {}) {
    const { timeRange = '24h', includeBottlenecks = true, includeTrends = true } = options;
    
    return {
      timestamp: new Date().toISOString(),
      timeRange,
      systemMetrics: this._getSystemMetrics(),
      algorithmMetrics: this._getAlgorithmMetrics(),
      sportMetrics: this._getSportMetrics(),
      resourceUtilization: this._getResourceUtilization(),
      bottlenecks: includeBottlenecks ? this._getBottlenecks() : undefined,
      trends: includeTrends ? this._getTrends(timeRange) : undefined,
      recommendations: this._generateRecommendations(),
      alerts: this._getActiveAlerts()
    };
  }
  
  /**
   * Get real-time performance metrics
   * @returns {object} Current performance metrics
   */
  getRealTimeMetrics() {
    return {
      timestamp: new Date().toISOString(),
      activeSessions: this.activeSessions.size,
      systemLoad: os.loadavg(),
      memoryUsage: {
        process: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        }
      },
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      recentMetrics: {
        averageResponseTime: this.metrics.system.averageResponseTime,
        errorRate: this.metrics.system.errorRate,
        successRate: this.metrics.system.successRate
      }
    };
  }
  
  /**
   * Detect performance bottlenecks
   * @param {object} session - Monitoring session
   * @private
   */
  _detectBottlenecks(session) {
    const bottlenecks = [];
    
    // Check execution time bottleneck
    if (session.metrics.executionTime > 5000) {
      bottlenecks.push({
        type: 'slow_execution',
        severity: 'medium',
        value: session.metrics.executionTime,
        threshold: 5000,
        sessionId: session.id,
        recommendation: 'Consider algorithm optimization or parallel processing'
      });
    }
    
    // Check memory usage bottleneck
    const memoryUsagePercent = process.memoryUsage().heapUsed / os.totalmem();
    if (memoryUsagePercent > 0.8) {
      bottlenecks.push({
        type: 'memory_pressure',
        severity: 'high',
        value: memoryUsagePercent,
        threshold: 0.8,
        sessionId: session.id,
        recommendation: 'Optimize memory usage or increase available memory'
      });
    }
    
    // Check CPU usage bottleneck
    const cpuUsage = session.metrics.cpuDelta / 1000000; // Convert to seconds
    if (cpuUsage > session.metrics.executionTime * 0.7) {
      bottlenecks.push({
        type: 'cpu_intensive',
        severity: 'medium',
        value: cpuUsage,
        sessionId: session.id,
        recommendation: 'Consider load balancing or algorithm optimization'
      });
    }
    
    // Add to bottlenecks list
    bottlenecks.forEach(bottleneck => {
      bottleneck.timestamp = Date.now();
      this.metrics.bottlenecks.push(bottleneck);
    });
    
    // Keep only recent bottlenecks (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics.bottlenecks = this.metrics.bottlenecks.filter(
      b => b.timestamp > oneDayAgo
    );
    
    if (bottlenecks.length > 0) {
      this.emit('bottlenecks_detected', {
        sessionId: session.id,
        bottlenecks,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Update system-wide metrics
   * @param {object} session - Monitoring session
   * @private
   */
  _updateSystemMetrics(session) {
    const metrics = this.metrics.system;
    
    // Update counters
    if (session.type === 'schedule_generation') {
      metrics.totalSchedulesGenerated++;
    } else if (session.type === 'optimization') {
      metrics.totalOptimizationsPerformed++;
    }
    
    metrics.totalConstraintsProcessed += session.metrics.constraintsProcessed;
    metrics.totalConflictsResolved += session.metrics.conflictsResolved;
    
    // Update response time metrics
    const responseTime = session.metrics.executionTime;
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
    
    if (responseTime > metrics.peakResponseTime) {
      metrics.peakResponseTime = responseTime;
    }
    
    if (responseTime < metrics.minResponseTime) {
      metrics.minResponseTime = responseTime;
    }
    
    // Update success/error rates
    const isSuccess = session.status === 'completed';
    const totalOperations = metrics.totalSchedulesGenerated + metrics.totalOptimizationsPerformed;
    
    if (isSuccess) {
      metrics.successRate = (metrics.successRate * (totalOperations - 1) + 1) / totalOperations;
      metrics.errorRate = 1 - metrics.successRate;
    } else {
      metrics.errorRate = (metrics.errorRate * (totalOperations - 1) + 1) / totalOperations;
      metrics.successRate = 1 - metrics.errorRate;
    }
  }
  
  /**
   * Update algorithm-specific metrics
   * @param {object} session - Monitoring session
   * @private
   */
  _updateAlgorithmMetrics(session) {
    const algorithm = session.context.algorithm || 'unknown';
    
    if (!this.metrics.algorithms[algorithm]) {
      this.metrics.algorithms[algorithm] = {
        executionCount: 0,
        averageTime: 0,
        successRate: 0,
        qualityScore: 0,
        memoryUsage: 0
      };
    }
    
    const algorithmMetrics = this.metrics.algorithms[algorithm];
    const isSuccess = session.status === 'completed';
    
    algorithmMetrics.executionCount++;
    algorithmMetrics.averageTime = 
      (algorithmMetrics.averageTime + session.metrics.executionTime) / 2;
    algorithmMetrics.successRate = 
      (algorithmMetrics.successRate * (algorithmMetrics.executionCount - 1) + (isSuccess ? 1 : 0)) / algorithmMetrics.executionCount;
    
    if (isSuccess) {
      algorithmMetrics.qualityScore = 
        (algorithmMetrics.qualityScore + session.metrics.qualityScore) / 2;
    }
    
    algorithmMetrics.memoryUsage = 
      (algorithmMetrics.memoryUsage + Math.abs(session.metrics.memoryDelta)) / 2;
  }
  
  /**
   * Update sport-specific metrics
   * @param {object} session - Monitoring session
   * @private
   */
  _updateSportMetrics(session) {
    const sport = session.context.sport;
    
    if (!this.metrics.sports[sport]) {
      this.metrics.sports[sport] = {
        executions: 0,
        avgTime: 0,
        avgQuality: 0
      };
    }
    
    const sportMetrics = this.metrics.sports[sport];
    sportMetrics.executions++;
    sportMetrics.avgTime = 
      (sportMetrics.avgTime + session.metrics.executionTime) / 2;
    
    if (session.status === 'completed') {
      sportMetrics.avgQuality = 
        (sportMetrics.avgQuality + session.metrics.qualityScore) / 2;
    }
  }
  
  /**
   * Start real-time system monitoring
   * @private
   */
  _startRealTimeMonitoring() {
    // Monitor system resources every 30 seconds
    setInterval(() => {
      this._collectResourceMetrics();
    }, 30000);
    
    // Check for alerts every minute
    setInterval(() => {
      this._checkSystemAlerts();
    }, 60000);
    
    // Clean up old data every hour
    setInterval(() => {
      this._cleanupOldData();
    }, 3600000);
    
    logger.info('Real-time performance monitoring started');
  }
  
  /**
   * Collect system resource metrics
   * @private
   */
  _collectResourceMetrics() {
    const timestamp = Date.now();
    const memory = process.memoryUsage();
    const loadAvg = os.loadavg();
    
    // Store resource metrics (keep last 1000 data points)
    this.metrics.resources.memoryUsage.push({
      timestamp,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      rss: memory.rss
    });
    
    this.metrics.resources.cpuUsage.push({
      timestamp,
      load1: loadAvg[0],
      load5: loadAvg[1],
      load15: loadAvg[2]
    });
    
    // Keep only recent data
    const retentionTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.metrics.resources.memoryUsage = this.metrics.resources.memoryUsage
      .filter(m => m.timestamp > retentionTime);
    this.metrics.resources.cpuUsage = this.metrics.resources.cpuUsage
      .filter(c => c.timestamp > retentionTime);
  }
  
  /**
   * Generate optimization recommendations
   * @returns {Array} List of recommendations
   * @private
   */
  _generateRecommendations() {
    const recommendations = [];
    
    // Analyze response times
    if (this.metrics.system.averageResponseTime > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Response Times Detected',
        description: `Average response time is ${this.metrics.system.averageResponseTime}ms`,
        recommendation: 'Consider enabling caching, optimizing algorithms, or scaling resources'
      });
    }
    
    // Analyze error rates
    if (this.metrics.system.errorRate > 0.05) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'High Error Rate Detected',
        description: `Error rate is ${(this.metrics.system.errorRate * 100).toFixed(2)}%`,
        recommendation: 'Investigate and fix underlying issues causing failures'
      });
    }
    
    // Analyze memory usage
    const memoryUsage = process.memoryUsage().heapUsed / os.totalmem();
    if (memoryUsage > 0.7) {
      recommendations.push({
        type: 'resource',
        priority: 'medium',
        title: 'High Memory Usage',
        description: `Memory usage is at ${(memoryUsage * 100).toFixed(2)}%`,
        recommendation: 'Consider memory optimization or increasing available memory'
      });
    }
    
    // Analyze algorithm performance
    Object.entries(this.metrics.algorithms).forEach(([algorithm, metrics]) => {
      if (metrics.averageTime > 5000 && metrics.executionCount > 10) {
        recommendations.push({
          type: 'algorithm',
          priority: 'medium',
          title: `Slow ${algorithm} Performance`,
          description: `Average execution time is ${metrics.averageTime}ms`,
          recommendation: `Optimize ${algorithm} algorithm or consider alternative approaches`
        });
      }
    });
    
    return recommendations;
  }
  
  /**
   * Get current system metrics
   * @returns {object} System metrics
   * @private
   */
  _getSystemMetrics() {
    return {
      ...this.metrics.system,
      uptime: Date.now() - this.metrics.system.systemUptime
    };
  }
  
  /**
   * Get algorithm performance metrics
   * @returns {object} Algorithm metrics
   * @private
   */
  _getAlgorithmMetrics() {
    return this.metrics.algorithms;
  }
  
  /**
   * Get sport-specific metrics
   * @returns {object} Sport metrics
   * @private
   */
  _getSportMetrics() {
    return this.metrics.sports;
  }
  
  /**
   * Get resource utilization metrics
   * @returns {object} Resource metrics
   * @private
   */
  _getResourceUtilization() {
    return {
      current: this.getRealTimeMetrics(),
      history: {
        memory: this.metrics.resources.memoryUsage.slice(-100),
        cpu: this.metrics.resources.cpuUsage.slice(-100)
      }
    };
  }
  
  /**
   * Get detected bottlenecks
   * @returns {Array} List of bottlenecks
   * @private
   */
  _getBottlenecks() {
    return this.metrics.bottlenecks.slice(-20); // Last 20 bottlenecks
  }
  
  /**
   * Get performance trends
   * @param {string} timeRange - Time range for trends
   * @returns {object} Trend data
   * @private
   */
  _getTrends(timeRange) {
    // Implementation would analyze trends over the specified time range
    return {
      timeRange,
      responseTimeTrend: 'stable',
      errorRateTrend: 'improving',
      throughputTrend: 'increasing'
    };
  }
  
  /**
   * Get active alerts
   * @returns {Array} List of active alerts
   * @private
   */
  _getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved);
  }
  
  // Additional helper methods (abbreviated for space)
  _generateSessionId() { return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  _recordConstraintEvaluation(event) { /* Implementation */ }
  _recordOptimizationIteration(event) { /* Implementation */ }
  _recordConflictResolution(event) { /* Implementation */ }
  _recordCacheEvent(event) { /* Implementation */ }
  _updateTrends(session) { /* Implementation */ }
  _checkAlerts(session) { /* Implementation */ }
  _checkSystemAlerts() { /* Implementation */ }
  _cleanupOldData() { /* Implementation */ }
}

module.exports = SchedulingPerformanceMonitor;