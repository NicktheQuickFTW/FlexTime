// Advanced Metrics System for FlexTime

class AdvancedMetricsSystem {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {}
      },
      performance: {
        averageResponseTime: 0,
        responseTimes: []
      },
      system: {
        uptime: Date.now(),
        memory: {},
        cpu: {}
      }
    };
  }

  trackRequest(method, endpoint, status, duration) {
    // Update totals
    this.metrics.requests.total++;
    
    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    
    // Track by endpoint
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // Track by status
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;
    
    // Track performance
    this.metrics.performance.responseTimes.push(duration);
    if (this.metrics.performance.responseTimes.length > 1000) {
      this.metrics.performance.responseTimes.shift(); // Keep only last 1000
    }
    
    // Calculate average
    const sum = this.metrics.performance.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.performance.averageResponseTime = sum / this.metrics.performance.responseTimes.length;
  }

  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.system.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
    };
    
    this.metrics.system.uptime = Math.round((Date.now() - this.metrics.system.uptime) / 1000) + ' seconds';
  }

  getMetrics() {
    this.updateSystemMetrics();
    return this.metrics;
  }

  resetMetrics() {
    this.metrics.requests = {
      total: 0,
      byMethod: {},
      byEndpoint: {},
      byStatus: {}
    };
    this.metrics.performance.responseTimes = [];
    this.metrics.performance.averageResponseTime = 0;
  }
}

module.exports = new AdvancedMetricsSystem();