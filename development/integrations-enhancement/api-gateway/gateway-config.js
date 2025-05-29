/**
 * FlexTime API Gateway Configuration
 * 
 * Centralized configuration for all gateway services and integrations
 */

const FlexTimeAPIGateway = require('./gateway');

/**
 * Initialize and configure the FlexTime API Gateway
 */
async function initializeGateway(config = {}) {
  const gateway = new FlexTimeAPIGateway({
    port: config.port || process.env.GATEWAY_PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || 'flextime-gateway-secret',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    enableMetrics: true,
    enableVersioning: true,
    cors: {
      origin: [
        'http://localhost:3005', // Frontend dev
        'https://flextime.app',   // Production
        'https://api.flextime.app' // API domain
      ],
      credentials: true
    },
    rateLimits: {
      default: { windowMs: 15 * 60 * 1000, max: 100 },
      auth: { windowMs: 5 * 60 * 1000, max: 10 },
      premium: { windowMs: 15 * 60 * 1000, max: 1000 },
      webhook: { windowMs: 1 * 60 * 1000, max: 100 },
      public: { windowMs: 15 * 60 * 1000, max: 50 },
      admin: { windowMs: 15 * 60 * 1000, max: 200 }
    }
  });

  // Register FlexTime Core Services
  gateway.registerService('scheduling', {
    path: 'scheduling',
    target: process.env.SCHEDULING_SERVICE_URL || 'http://localhost:3005/api/schedule',
    version: 'v1',
    auth: 'both',
    rateLimit: 'default',
    cache: true
  });

  gateway.registerService('teams', {
    path: 'teams',
    target: process.env.TEAMS_SERVICE_URL || 'http://localhost:3005/api/teams',
    version: 'v1',
    auth: 'apikey',
    rateLimit: 'default',
    cache: true
  });

  gateway.registerService('venues', {
    path: 'venues',
    target: process.env.VENUES_SERVICE_URL || 'http://localhost:3005/api/venues',
    version: 'v1',
    auth: 'apikey',
    rateLimit: 'default',
    cache: true
  });

  // Register AI/ML Services
  gateway.registerService('compass', {
    path: 'compass',
    target: process.env.COMPASS_SERVICE_URL || 'http://localhost:3005/api/compass',
    version: 'v1',
    auth: 'jwt',
    rateLimit: 'premium',
    cache: false
  });

  gateway.registerService('intelligence', {
    path: 'intelligence',
    target: process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:3005/api/intelligence',
    version: 'v1',
    auth: 'jwt',
    rateLimit: 'premium',
    cache: false
  });

  // Register Integration Services
  gateway.registerService('notion', {
    path: 'integrations/notion',
    target: process.env.NOTION_SERVICE_URL || 'http://localhost:3005/api/notion-sync',
    version: 'v1',
    auth: 'jwt',
    rateLimit: 'default',
    cache: false
  });

  gateway.registerService('calendars', {
    path: 'integrations/calendars',
    target: process.env.CALENDAR_SERVICE_URL || 'http://localhost:3005/api/calendars',
    version: 'v1',
    auth: 'both',
    rateLimit: 'default',
    cache: false
  });

  gateway.registerService('webhooks', {
    path: 'webhooks',
    target: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3005/api/webhooks',
    version: 'v1',
    auth: 'apikey',
    rateLimit: 'webhook',
    cache: false
  });

  // Register Big 12 Conference Services
  gateway.registerService('big12-data', {
    path: 'big12/data',
    target: process.env.BIG12_DATA_SERVICE_URL || 'http://localhost:3005/api/big12-data',
    version: 'v1',
    auth: 'both',
    rateLimit: 'default',
    cache: true
  });

  gateway.registerService('big12-news', {
    path: 'big12/news',
    target: process.env.BIG12_NEWS_SERVICE_URL || 'http://localhost:3005/api/big12-news',
    version: 'v1',
    auth: 'apikey',
    rateLimit: 'public',
    cache: true
  });

  // Register Mobile Services
  gateway.registerService('mobile', {
    path: 'mobile',
    target: process.env.MOBILE_SERVICE_URL || 'http://localhost:3005/api/mobile',
    version: 'v1',
    auth: 'jwt',
    rateLimit: 'premium',
    cache: true
  });

  // Register Third-party Services
  gateway.registerService('weather', {
    path: 'external/weather',
    target: process.env.WEATHER_SERVICE_URL || 'http://localhost:3005/api/weather',
    version: 'v1',
    auth: 'apikey',
    rateLimit: 'default',
    cache: true
  });

  gateway.registerService('travel', {
    path: 'external/travel',
    target: process.env.TRAVEL_SERVICE_URL || 'http://localhost:3005/api/travel',
    version: 'v1',
    auth: 'jwt',
    rateLimit: 'default',
    cache: true
  });

  // Register Admin Services
  gateway.registerService('admin', {
    path: 'admin',
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3005/api/admin',
    version: 'v1',
    auth: 'jwt',
    rateLimit: 'admin',
    cache: false
  });

  // Register Public Services (no authentication required)
  gateway.registerService('public', {
    path: 'public',
    target: process.env.PUBLIC_SERVICE_URL || 'http://localhost:3005/api/public',
    version: 'v1',
    auth: 'none',
    rateLimit: 'public',
    cache: true
  });

  return gateway;
}

/**
 * Gateway health monitoring and alerting
 */
class GatewayMonitor {
  constructor(gateway) {
    this.gateway = gateway;
    this.alerts = [];
    this.thresholds = {
      errorRate: 5, // 5% error rate threshold
      avgResponseTime: 1000, // 1 second response time threshold
      requestsPerMinute: 1000 // High traffic threshold
    };
  }

  startMonitoring(intervalMs = 60000) {
    setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  checkHealth() {
    const metrics = this.gateway.getMetricsSummary();
    const alerts = [];

    // Check error rate
    const errorRate = parseFloat(metrics.errorRate.replace('%', ''));
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        message: `Error rate ${metrics.errorRate} exceeds threshold of ${this.thresholds.errorRate}%`,
        severity: 'warning'
      });
    }

    // Check response time
    const avgResponseTime = parseInt(metrics.avgResponseTime.replace('ms', ''));
    if (avgResponseTime > this.thresholds.avgResponseTime) {
      alerts.push({
        type: 'high_response_time',
        message: `Average response time ${metrics.avgResponseTime} exceeds threshold of ${this.thresholds.avgResponseTime}ms`,
        severity: 'warning'
      });
    }

    // Process alerts
    alerts.forEach(alert => {
      console.warn(`🚨 Gateway Alert [${alert.severity}]: ${alert.message}`);
      this.alerts.push({
        ...alert,
        timestamp: new Date().toISOString()
      });
    });

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  getAlerts() {
    return this.alerts;
  }
}

module.exports = {
  initializeGateway,
  GatewayMonitor
};