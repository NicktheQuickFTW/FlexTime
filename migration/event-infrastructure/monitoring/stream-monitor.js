/**
 * Stream Monitor for FlexTime Event Streaming Infrastructure
 * 
 * Provides monitoring, metrics collection, and health checks for Redis Streams.
 * Integrates with the existing FlexTime monitoring infrastructure.
 */

const { STREAM_NAMES } = require('../config/redis-streams-config');

class StreamMonitor {
  constructor(redisStreamsConfig, options = {}) {
    this.config = redisStreamsConfig;
    this.options = {
      monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
      alertThresholds: {
        lagThreshold: options.lagThreshold || 1000, // messages
        errorRateThreshold: options.errorRateThreshold || 0.05, // 5%
        consumerIdleThreshold: options.consumerIdleThreshold || 300000, // 5 minutes
        streamGrowthThreshold: options.streamGrowthThreshold || 10000 // messages
      },
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };
    
    this.redis = null;
    this.isMonitoring = false;
    this.monitoringTimer = null;
    this.metrics = {
      streams: new Map(),
      consumers: new Map(),
      alerts: [],
      lastUpdate: null
    };
  }

  /**
   * Initialize the monitor
   */
  async initialize() {
    this.redis = await this.config.connect();
    console.log('Stream Monitor initialized');
  }

  /**
   * Start monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Stream monitoring already running');
      return;
    }
    
    this.isMonitoring = true;
    console.log('Starting stream monitoring...');
    
    // Initial metrics collection
    await this.collectMetrics();
    
    // Set up periodic monitoring
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, this.options.monitoringInterval);
    
    console.log(`Stream monitoring started with ${this.options.monitoringInterval}ms interval`);
  }

  /**
   * Collect metrics from all streams
   */
  async collectMetrics() {
    try {
      const streamMetrics = new Map();
      const consumerMetrics = new Map();
      
      // Collect metrics for each stream
      for (const [streamKey, streamName] of Object.entries(STREAM_NAMES)) {
        const streamInfo = await this.getStreamInfo(streamName);
        const consumerInfo = await this.getConsumerGroupInfo(streamName);
        
        streamMetrics.set(streamName, {
          ...streamInfo,
          key: streamKey,
          timestamp: new Date()
        });
        
        if (consumerInfo) {
          consumerMetrics.set(streamName, {
            ...consumerInfo,
            timestamp: new Date()
          });
        }
      }
      
      this.metrics.streams = streamMetrics;
      this.metrics.consumers = consumerMetrics;
      this.metrics.lastUpdate = new Date();
      
    } catch (error) {
      console.error('Error collecting stream metrics:', error);
      throw error;
    }
  }

  /**
   * Get detailed stream information
   */
  async getStreamInfo(streamName) {
    try {
      // Get basic stream info
      const info = await this.redis.xinfo('STREAM', streamName);
      const streamData = this.parseStreamInfo(info);
      
      // Get stream length
      const length = await this.redis.xlen(streamName);
      
      // Calculate approximate memory usage
      const memoryUsage = await this.estimateStreamMemoryUsage(streamName, length);
      
      return {
        name: streamName,
        length,
        memoryUsage,
        ...streamData,
        messagesPerSecond: await this.calculateMessageRate(streamName),
        oldestMessage: streamData.firstEntry,
        newestMessage: streamData.lastEntry
      };
      
    } catch (error) {
      if (error.message.includes('no such key')) {
        return {
          name: streamName,
          length: 0,
          memoryUsage: 0,
          exists: false,
          messagesPerSecond: 0
        };
      }
      throw error;
    }
  }

  /**
   * Get consumer group information
   */
  async getConsumerGroupInfo(streamName) {
    try {
      const groups = await this.redis.xinfo('GROUPS', streamName);
      
      if (!groups || groups.length === 0) {
        return null;
      }
      
      const groupInfo = [];
      
      for (let i = 0; i < groups.length; i += 2) {
        const groupData = this.parseGroupInfo(groups[i + 1]);
        
        // Get consumers in this group
        try {
          const consumers = await this.redis.xinfo('CONSUMERS', streamName, groupData.name);
          const consumerData = this.parseConsumersInfo(consumers);
          
          groupInfo.push({
            ...groupData,
            consumers: consumerData,
            lag: await this.calculateConsumerLag(streamName, groupData.name)
          });
        } catch (err) {
          console.warn(`Could not get consumer info for group ${groupData.name}:`, err.message);
          groupInfo.push(groupData);
        }
      }
      
      return {
        streamName,
        groups: groupInfo
      };
      
    } catch (error) {
      if (error.message.includes('no such key')) {
        return null;
      }
      console.warn(`Could not get consumer group info for ${streamName}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate consumer lag
   */
  async calculateConsumerLag(streamName, groupName) {
    try {
      const streamLength = await this.redis.xlen(streamName);
      const pending = await this.redis.xpending(streamName, groupName);
      
      if (!pending || pending.length < 4) {
        return 0;
      }
      
      const pendingCount = pending[0];
      return Math.max(0, streamLength - pendingCount);
      
    } catch (error) {
      console.warn(`Could not calculate lag for ${streamName}/${groupName}:`, error.message);
      return 0;
    }
  }

  /**
   * Calculate message rate (messages per second)
   */
  async calculateMessageRate(streamName) {
    // This is a simplified calculation
    // In production, you'd want to track historical data
    const currentLength = await this.redis.xlen(streamName);
    const previousMetric = this.metrics.streams.get(streamName);
    
    if (!previousMetric) {
      return 0;
    }
    
    const timeDiff = (Date.now() - previousMetric.timestamp.getTime()) / 1000;
    const lengthDiff = currentLength - previousMetric.length;
    
    return timeDiff > 0 ? lengthDiff / timeDiff : 0;
  }

  /**
   * Estimate stream memory usage
   */
  async estimateStreamMemoryUsage(streamName, length) {
    if (length === 0) return 0;
    
    try {
      // Sample a few messages to estimate average size
      const sample = await this.redis.xrange(streamName, '-', '+', 'COUNT', 5);
      if (!sample || sample.length === 0) return 0;
      
      const avgMessageSize = sample.reduce((sum, [id, fields]) => {
        const messageSize = JSON.stringify([id, fields]).length;
        return sum + messageSize;
      }, 0) / sample.length;
      
      return Math.round(avgMessageSize * length);
      
    } catch (error) {
      console.warn(`Could not estimate memory usage for ${streamName}:`, error.message);
      return 0;
    }
  }

  /**
   * Check for alert conditions
   */
  async checkAlerts() {
    const newAlerts = [];
    const now = new Date();
    
    // Check each stream for alert conditions
    for (const [streamName, metrics] of this.metrics.streams) {
      // Check stream length growth
      if (metrics.length > this.options.alertThresholds.streamGrowthThreshold) {
        newAlerts.push({
          type: 'stream_growth',
          severity: 'warning',
          streamName,
          message: `Stream ${streamName} has grown to ${metrics.length} messages`,
          timestamp: now,
          metrics: { length: metrics.length }
        });
      }
      
      // Check message rate
      if (metrics.messagesPerSecond > 100) { // Configurable threshold
        newAlerts.push({
          type: 'high_message_rate',
          severity: 'info',
          streamName,
          message: `High message rate detected: ${metrics.messagesPerSecond.toFixed(2)} msg/sec`,
          timestamp: now,
          metrics: { rate: metrics.messagesPerSecond }
        });
      }
    }
    
    // Check consumer lag
    for (const [streamName, consumerInfo] of this.metrics.consumers) {
      if (consumerInfo && consumerInfo.groups) {
        for (const group of consumerInfo.groups) {
          if (group.lag > this.options.alertThresholds.lagThreshold) {
            newAlerts.push({
              type: 'consumer_lag',
              severity: 'warning',
              streamName,
              groupName: group.name,
              message: `Consumer lag detected: ${group.lag} messages behind`,
              timestamp: now,
              metrics: { lag: group.lag }
            });
          }
          
          // Check for idle consumers
          if (group.consumers) {
            for (const consumer of group.consumers) {
              const idleTime = consumer.idle || 0;
              if (idleTime > this.options.alertThresholds.consumerIdleThreshold) {
                newAlerts.push({
                  type: 'idle_consumer',
                  severity: 'warning',
                  streamName,
                  groupName: group.name,
                  consumerName: consumer.name,
                  message: `Consumer ${consumer.name} has been idle for ${Math.round(idleTime / 1000)}s`,
                  timestamp: now,
                  metrics: { idleTime }
                });
              }
            }
          }
        }
      }
    }
    
    // Add new alerts and maintain retention
    this.metrics.alerts.push(...newAlerts);
    this.cleanupOldAlerts();
    
    // Log new alerts
    if (newAlerts.length > 0) {
      console.log(`Generated ${newAlerts.length} new alerts`);
      newAlerts.forEach(alert => {
        console.warn(`ALERT [${alert.severity}] ${alert.type}: ${alert.message}`);
      });
    }
  }

  /**
   * Clean up old alerts based on retention period
   */
  cleanupOldAlerts() {
    const cutoff = new Date(Date.now() - this.options.retentionPeriod);
    this.metrics.alerts = this.metrics.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary() {
    const summary = {
      timestamp: this.metrics.lastUpdate,
      streams: {},
      consumers: {},
      alerts: {
        total: this.metrics.alerts.length,
        recent: this.metrics.alerts.filter(
          alert => alert.timestamp > new Date(Date.now() - 3600000) // Last hour
        ).length,
        bySeverity: this.metrics.alerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {})
      },
      health: this.calculateOverallHealth()
    };
    
    // Summarize stream metrics
    for (const [streamName, metrics] of this.metrics.streams) {
      summary.streams[streamName] = {
        length: metrics.length,
        messagesPerSecond: metrics.messagesPerSecond,
        memoryUsage: metrics.memoryUsage,
        exists: metrics.exists !== false
      };
    }
    
    // Summarize consumer metrics
    for (const [streamName, consumerInfo] of this.metrics.consumers) {
      if (consumerInfo) {
        summary.consumers[streamName] = {
          groupCount: consumerInfo.groups.length,
          totalConsumers: consumerInfo.groups.reduce((sum, group) => 
            sum + (group.consumers ? group.consumers.length : 0), 0),
          totalLag: consumerInfo.groups.reduce((sum, group) => sum + (group.lag || 0), 0)
        };
      }
    }
    
    return summary;
  }

  /**
   * Calculate overall system health
   */
  calculateOverallHealth() {
    const recentAlerts = this.metrics.alerts.filter(
      alert => alert.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
    );
    
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = recentAlerts.filter(alert => alert.severity === 'warning');
    
    if (criticalAlerts.length > 0) {
      return 'critical';
    } else if (warningAlerts.length > 3) {
      return 'degraded';
    } else if (warningAlerts.length > 0) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Parse Redis XINFO STREAM response
   */
  parseStreamInfo(info) {
    const data = {};
    for (let i = 0; i < info.length; i += 2) {
      const key = info[i];
      const value = info[i + 1];
      data[key.replace(/-/g, '_')] = value;
    }
    return data;
  }

  /**
   * Parse Redis XINFO GROUPS response
   */
  parseGroupInfo(groupInfo) {
    const data = {};
    for (let i = 0; i < groupInfo.length; i += 2) {
      const key = groupInfo[i];
      const value = groupInfo[i + 1];
      data[key.replace(/-/g, '_')] = value;
    }
    return data;
  }

  /**
   * Parse Redis XINFO CONSUMERS response
   */
  parseConsumersInfo(consumers) {
    const consumerList = [];
    for (let i = 0; i < consumers.length; i++) {
      const consumerInfo = consumers[i];
      const data = {};
      for (let j = 0; j < consumerInfo.length; j += 2) {
        const key = consumerInfo[j];
        const value = consumerInfo[j + 1];
        data[key.replace(/-/g, '_')] = value;
      }
      consumerList.push(data);
    }
    return consumerList;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const redisHealth = await this.config.healthCheck();
      if (redisHealth.status !== 'healthy') {
        return redisHealth;
      }

      return {
        status: this.isMonitoring ? 'healthy' : 'stopped',
        message: `Stream Monitor ${this.isMonitoring ? 'active' : 'inactive'}`,
        metrics: this.getMetricsSummary(),
        monitoringInfo: {
          interval: this.options.monitoringInterval,
          isMonitoring: this.isMonitoring,
          lastUpdate: this.metrics.lastUpdate
        }
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Stream Monitor health check failed: ${error.message}`
      };
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    console.log('Stopping stream monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    console.log('Stream monitoring stopped');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down Stream Monitor...');
    
    await this.stopMonitoring();
    
    if (this.redis) {
      await this.config.disconnect();
    }
    
    console.log('Stream Monitor shutdown complete');
  }
}

module.exports = StreamMonitor;