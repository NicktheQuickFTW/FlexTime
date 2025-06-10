/**
 * Agent Health Monitor for FlexTime Agent Army
 * 
 * Comprehensive health monitoring, performance tracking, and auto-scaling
 * for the distributed agent ecosystem
 */

import EventEmitter from 'events';
import { messagingBus } from './RedisMessagingBus.js';
import { aiSDK } from '../ai/aiSDKService.js';

export class AgentHealthMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      healthCheckInterval: 30000,      // 30 seconds
      metricsRetention: 86400,         // 24 hours
      alertThresholds: {
        cpu: 80,                       // CPU usage %
        memory: 85,                    // Memory usage %
        responseTime: 5000,            // Response time ms
        errorRate: 10,                 // Error rate %
        queueDepth: 100               // Message queue depth
      },
      autoScaling: {
        enabled: true,
        minAgents: 1,
        maxAgents: 10,
        scaleUpThreshold: 75,          // Resource utilization %
        scaleDownThreshold: 25,        // Resource utilization %
        cooldownPeriod: 300000         // 5 minutes
      },
      ...config
    };

    this.serviceId = 'agent_health_monitor';
    this.agentMetrics = new Map();
    this.historicalMetrics = new Map();
    this.alerts = new Map();
    this.scalingActions = new Map();
    
    // System-wide metrics
    this.systemMetrics = {
      totalAgents: 0,
      activeAgents: 0,
      staleAgents: 0,
      faultedAgents: 0,
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      systemLoad: 0,
      lastUpdated: new Date().toISOString()
    };

    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    this.initialize();
  }

  /**
   * Initialize health monitoring system
   */
  async initialize() {
    try {
      console.log(`🏥 [${this.serviceId}] Initializing agent health monitoring...`);

      // Register message handlers for agent health data
      messagingBus.registerMessageHandler('agent_heartbeat', this.handleAgentHeartbeat.bind(this));
      messagingBus.registerMessageHandler('agent_metrics', this.handleAgentMetrics.bind(this));
      messagingBus.registerMessageHandler('agent_error', this.handleAgentError.bind(this));
      messagingBus.registerMessageHandler('agent_status_change', this.handleAgentStatusChange.bind(this));

      // Start monitoring
      await this.startMonitoring();
      
      console.log(`✅ [${this.serviceId}] Health monitoring initialized`);
      this.emit('ready');

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to initialize health monitoring:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Start periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Start metrics collection
    this.startMetricsCollection();
    
    // Start alert monitoring
    this.startAlertMonitoring();
    
    // Start auto-scaling if enabled
    if (this.config.autoScaling.enabled) {
      this.startAutoScaling();
    }

    console.log(`🔍 [${this.serviceId}] Health monitoring started`);
  }

  /**
   * Stop health monitoring
   */
  async stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log(`⏹️ [${this.serviceId}] Health monitoring stopped`);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      const startTime = Date.now();
      
      // Get agent registry from messaging bus
      const agents = messagingBus.getAgentRegistry();
      
      // Update system metrics
      this.systemMetrics = {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active').length,
        staleAgents: agents.filter(a => a.isStale).length,
        faultedAgents: agents.filter(a => a.status === 'error' || a.status === 'failed').length,
        totalRequests: this.calculateTotalRequests(),
        totalErrors: this.calculateTotalErrors(),
        averageResponseTime: this.calculateAverageResponseTime(),
        systemLoad: this.calculateSystemLoad(),
        lastUpdated: new Date().toISOString()
      };

      // Check individual agent health
      for (const agent of agents) {
        await this.checkAgentHealth(agent);
      }

      // Check AI SDK health
      await this.checkAISDKHealth();
      
      // Check messaging bus health
      await this.checkMessagingBusHealth();
      
      const healthCheckDuration = Date.now() - startTime;
      
      // Emit health check complete event
      this.emit('health_check_complete', {
        duration: healthCheckDuration,
        systemMetrics: this.systemMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Health check failed:`, error);
      this.emit('health_check_error', error);
    }
  }

  /**
   * Check individual agent health
   */
  async checkAgentHealth(agent) {
    try {
      const agentId = agent.agentId;
      const now = Date.now();
      
      // Calculate agent-specific metrics
      const metrics = {
        agentId,
        status: agent.status,
        uptime: now - new Date(agent.registeredAt).getTime(),
        lastSeen: agent.lastSeen,
        messageCount: agent.messageCount,
        isStale: agent.isStale,
        responseTime: this.getAgentResponseTime(agentId),
        errorRate: this.getAgentErrorRate(agentId),
        cpuUsage: await this.getAgentCPUUsage(agentId),
        memoryUsage: await this.getAgentMemoryUsage(agentId),
        queueDepth: await this.getAgentQueueDepth(agentId),
        capabilities: agent.capabilities,
        timestamp: new Date().toISOString()
      };

      // Store metrics
      this.agentMetrics.set(agentId, metrics);
      this.storeHistoricalMetrics(agentId, metrics);

      // Check for threshold violations
      await this.checkAgentThresholds(agentId, metrics);

      return metrics;

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to check health for agent ${agent.agentId}:`, error);
      return null;
    }
  }

  /**
   * Check AI SDK health
   */
  async checkAISDKHealth() {
    try {
      const aiMetrics = aiSDK.getMetrics();
      const aiProviders = aiSDK.getProviderStatus();
      
      const aiHealth = {
        serviceId: 'ai_sdk_service',
        status: aiMetrics.redis_connected ? 'healthy' : 'degraded',
        requests: aiMetrics.requests,
        cacheHitRate: aiMetrics.cacheHitRate,
        errorRate: aiMetrics.errorRate,
        averageResponseTime: aiMetrics.averageResponseTime,
        providers: aiProviders,
        uptime: aiMetrics.uptime,
        timestamp: new Date().toISOString()
      };

      this.agentMetrics.set('ai_sdk_service', aiHealth);
      
      // Check AI service thresholds
      if (aiHealth.errorRate > this.config.alertThresholds.errorRate) {
        await this.createAlert('ai_sdk_high_error_rate', {
          severity: 'warning',
          message: `AI SDK error rate is ${aiHealth.errorRate.toFixed(1)}%`,
          data: aiHealth
        });
      }

      return aiHealth;

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to check AI SDK health:`, error);
      return null;
    }
  }

  /**
   * Check messaging bus health
   */
  async checkMessagingBusHealth() {
    try {
      const busMetrics = messagingBus.getMetrics();
      
      const busHealth = {
        serviceId: 'redis_messaging_bus',
        status: busMetrics.redis_connected ? 'healthy' : 'critical',
        messagesPublished: busMetrics.messagesPublished,
        messagesConsumed: busMetrics.messagesConsumed,
        messageFailures: busMetrics.messageFailures,
        deadLetters: busMetrics.deadLetters,
        activeAgents: busMetrics.activeAgents,
        averageLatency: busMetrics.averageLatency,
        uptime: busMetrics.uptime,
        timestamp: new Date().toISOString()
      };

      this.agentMetrics.set('redis_messaging_bus', busHealth);
      
      // Check messaging bus thresholds
      if (!busHealth.status === 'healthy') {
        await this.createAlert('messaging_bus_unhealthy', {
          severity: 'critical',
          message: 'Redis messaging bus is not healthy',
          data: busHealth
        });
      }

      return busHealth;

    } catch (error) {
      console.error(`❌ [${this.serviceId}] Failed to check messaging bus health:`, error);
      return null;
    }
  }

  /**
   * Handle agent heartbeat messages
   */
  async handleAgentHeartbeat(message) {
    const { agentId, metrics, timestamp } = message.data;
    
    if (this.agentMetrics.has(agentId)) {
      const currentMetrics = this.agentMetrics.get(agentId);
      currentMetrics.lastHeartbeat = timestamp;
      currentMetrics.heartbeatMetrics = metrics;
      this.agentMetrics.set(agentId, currentMetrics);
    }
  }

  /**
   * Handle agent metrics updates
   */
  async handleAgentMetrics(message) {
    const { agentId, metrics } = message.data;
    
    if (this.agentMetrics.has(agentId)) {
      const currentMetrics = this.agentMetrics.get(agentId);
      Object.assign(currentMetrics, metrics);
      this.agentMetrics.set(agentId, currentMetrics);
      
      // Store historical data
      this.storeHistoricalMetrics(agentId, currentMetrics);
    }
  }

  /**
   * Handle agent error messages
   */
  async handleAgentError(message) {
    const { agentId, error, severity, timestamp } = message.data;
    
    await this.createAlert(`agent_error_${agentId}`, {
      severity: severity || 'error',
      message: `Agent ${agentId} reported error: ${error}`,
      data: { agentId, error, timestamp }
    });
  }

  /**
   * Handle agent status changes
   */
  async handleAgentStatusChange(message) {
    const { agentId, oldStatus, newStatus, reason } = message.data;
    
    console.log(`🔄 [${this.serviceId}] Agent ${agentId} status changed: ${oldStatus} → ${newStatus} (${reason})`);
    
    if (newStatus === 'error' || newStatus === 'failed') {
      await this.createAlert(`agent_status_change_${agentId}`, {
        severity: 'warning',
        message: `Agent ${agentId} status changed to ${newStatus}`,
        data: { agentId, oldStatus, newStatus, reason }
      });
    }
  }

  /**
   * Check agent threshold violations
   */
  async checkAgentThresholds(agentId, metrics) {
    const thresholds = this.config.alertThresholds;
    
    // CPU usage threshold
    if (metrics.cpuUsage > thresholds.cpu) {
      await this.createAlert(`high_cpu_${agentId}`, {
        severity: 'warning',
        message: `Agent ${agentId} CPU usage is ${metrics.cpuUsage}%`,
        data: { agentId, cpuUsage: metrics.cpuUsage, threshold: thresholds.cpu }
      });
    }

    // Memory usage threshold
    if (metrics.memoryUsage > thresholds.memory) {
      await this.createAlert(`high_memory_${agentId}`, {
        severity: 'warning',
        message: `Agent ${agentId} memory usage is ${metrics.memoryUsage}%`,
        data: { agentId, memoryUsage: metrics.memoryUsage, threshold: thresholds.memory }
      });
    }

    // Response time threshold
    if (metrics.responseTime > thresholds.responseTime) {
      await this.createAlert(`slow_response_${agentId}`, {
        severity: 'warning',
        message: `Agent ${agentId} response time is ${metrics.responseTime}ms`,
        data: { agentId, responseTime: metrics.responseTime, threshold: thresholds.responseTime }
      });
    }

    // Error rate threshold
    if (metrics.errorRate > thresholds.errorRate) {
      await this.createAlert(`high_error_rate_${agentId}`, {
        severity: 'error',
        message: `Agent ${agentId} error rate is ${metrics.errorRate}%`,
        data: { agentId, errorRate: metrics.errorRate, threshold: thresholds.errorRate }
      });
    }

    // Queue depth threshold
    if (metrics.queueDepth > thresholds.queueDepth) {
      await this.createAlert(`high_queue_depth_${agentId}`, {
        severity: 'warning',
        message: `Agent ${agentId} queue depth is ${metrics.queueDepth}`,
        data: { agentId, queueDepth: metrics.queueDepth, threshold: thresholds.queueDepth }
      });
    }
  }

  /**
   * Create and manage alerts
   */
  async createAlert(alertId, alertData) {
    const alert = {
      alertId,
      ...alertData,
      createdAt: new Date().toISOString(),
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null
    };

    this.alerts.set(alertId, alert);
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Send alert via messaging bus
    await messagingBus.publish('flextime:agents:emergency', {
      type: 'health_alert',
      alert
    });

    console.log(`🚨 [${this.serviceId}] Alert created: ${alertId} (${alertData.severity})`);
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute

    console.log(`📊 [${this.serviceId}] Metrics collection started`);
  }

  /**
   * Start alert monitoring
   */
  startAlertMonitoring() {
    setInterval(() => {
      this.processAlerts();
    }, 30000); // Every 30 seconds

    console.log(`🔔 [${this.serviceId}] Alert monitoring started`);
  }

  /**
   * Start auto-scaling
   */
  startAutoScaling() {
    setInterval(() => {
      this.evaluateAutoScaling();
    }, 60000); // Every minute

    console.log(`📈 [${this.serviceId}] Auto-scaling started`);
  }

  /**
   * Collect system-wide metrics
   */
  collectSystemMetrics() {
    // This would collect CPU, memory, disk, network metrics
    // For now, we'll use mock data
    
    const systemLoad = this.calculateSystemLoad();
    
    console.log(`📊 [${this.serviceId}] System load: ${systemLoad.toFixed(1)}%`);
  }

  /**
   * Process and manage alerts
   */
  processAlerts() {
    const now = Date.now();
    let activeAlerts = 0;
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.status === 'active') {
        activeAlerts++;
        
        // Auto-resolve alerts older than 30 minutes if conditions improved
        const alertAge = now - new Date(alert.createdAt).getTime();
        if (alertAge > 1800000) { // 30 minutes
          this.resolveAlert(alertId, 'auto-resolved after 30 minutes');
        }
      }
    }
    
    if (activeAlerts > 0) {
      console.log(`🚨 [${this.serviceId}] Active alerts: ${activeAlerts}`);
    }
  }

  /**
   * Evaluate auto-scaling decisions
   */
  evaluateAutoScaling() {
    if (!this.config.autoScaling.enabled) return;
    
    const systemLoad = this.calculateSystemLoad();
    const config = this.config.autoScaling;
    
    // Scale up decision
    if (systemLoad > config.scaleUpThreshold && this.systemMetrics.activeAgents < config.maxAgents) {
      this.triggerScaleUp();
    }
    
    // Scale down decision
    if (systemLoad < config.scaleDownThreshold && this.systemMetrics.activeAgents > config.minAgents) {
      this.triggerScaleDown();
    }
  }

  /**
   * Trigger scale up
   */
  async triggerScaleUp() {
    const lastScaleAction = this.scalingActions.get('last_scale_up') || 0;
    const now = Date.now();
    
    // Check cooldown period
    if (now - lastScaleAction < this.config.autoScaling.cooldownPeriod) {
      return;
    }
    
    this.scalingActions.set('last_scale_up', now);
    
    await messagingBus.publish('flextime:agents:coordination', {
      type: 'scale_up_request',
      reason: 'high system load',
      systemLoad: this.calculateSystemLoad(),
      timestamp: new Date().toISOString()
    });
    
    console.log(`📈 [${this.serviceId}] Triggered scale up due to high system load`);
  }

  /**
   * Trigger scale down
   */
  async triggerScaleDown() {
    const lastScaleAction = this.scalingActions.get('last_scale_down') || 0;
    const now = Date.now();
    
    // Check cooldown period
    if (now - lastScaleAction < this.config.autoScaling.cooldownPeriod) {
      return;
    }
    
    this.scalingActions.set('last_scale_down', now);
    
    await messagingBus.publish('flextime:agents:coordination', {
      type: 'scale_down_request',
      reason: 'low system load',
      systemLoad: this.calculateSystemLoad(),
      timestamp: new Date().toISOString()
    });
    
    console.log(`📉 [${this.serviceId}] Triggered scale down due to low system load`);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolution) {
    if (this.alerts.has(alertId)) {
      const alert = this.alerts.get(alertId);
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      
      this.emit('alert_resolved', alert);
      console.log(`✅ [${this.serviceId}] Alert resolved: ${alertId}`);
    }
  }

  /**
   * Store historical metrics
   */
  storeHistoricalMetrics(agentId, metrics) {
    if (!this.historicalMetrics.has(agentId)) {
      this.historicalMetrics.set(agentId, []);
    }
    
    const history = this.historicalMetrics.get(agentId);
    history.push({
      ...metrics,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 24 hours of data
    const cutoff = Date.now() - this.config.metricsRetention * 1000;
    const filtered = history.filter(m => new Date(m.timestamp).getTime() > cutoff);
    this.historicalMetrics.set(agentId, filtered);
  }

  /**
   * Calculate system load
   */
  calculateSystemLoad() {
    let totalLoad = 0;
    let agentCount = 0;
    
    for (const [agentId, metrics] of this.agentMetrics.entries()) {
      if (metrics.cpuUsage !== undefined) {
        totalLoad += metrics.cpuUsage;
        agentCount++;
      }
    }
    
    return agentCount > 0 ? totalLoad / agentCount : 0;
  }

  /**
   * Helper methods for agent metrics
   */
  getAgentResponseTime(agentId) {
    // Mock implementation - would integrate with actual agent metrics
    return Math.random() * 2000; // 0-2000ms
  }
  
  getAgentErrorRate(agentId) {
    // Mock implementation
    return Math.random() * 5; // 0-5%
  }
  
  async getAgentCPUUsage(agentId) {
    // Mock implementation
    return Math.random() * 100; // 0-100%
  }
  
  async getAgentMemoryUsage(agentId) {
    // Mock implementation
    return Math.random() * 100; // 0-100%
  }
  
  async getAgentQueueDepth(agentId) {
    // Mock implementation
    return Math.floor(Math.random() * 50); // 0-50 messages
  }

  calculateTotalRequests() {
    return Array.from(this.agentMetrics.values())
      .reduce((sum, metrics) => sum + (metrics.messageCount || 0), 0);
  }
  
  calculateTotalErrors() {
    return Array.from(this.agentMetrics.values())
      .reduce((sum, metrics) => sum + (metrics.errorCount || 0), 0);
  }
  
  calculateAverageResponseTime() {
    const responseTimes = Array.from(this.agentMetrics.values())
      .map(metrics => metrics.responseTime)
      .filter(rt => rt !== undefined);
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
      : 0;
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport() {
    return {
      systemMetrics: this.systemMetrics,
      agentMetrics: Object.fromEntries(this.agentMetrics),
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.status === 'active'),
      historicalMetrics: Object.fromEntries(this.historicalMetrics),
      configuration: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown health monitor
   */
  async shutdown() {
    console.log(`🔌 [${this.serviceId}] Shutting down health monitor...`);
    
    await this.stopMonitoring();
    
    this.agentMetrics.clear();
    this.historicalMetrics.clear();
    this.alerts.clear();
    this.scalingActions.clear();
    
    console.log(`✅ [${this.serviceId}] Health monitor shutdown complete`);
  }
}

// Export singleton instance
export const healthMonitor = new AgentHealthMonitor();
export default healthMonitor;