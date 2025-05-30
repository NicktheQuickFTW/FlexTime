/**
 * Main testing framework configuration
 */

const path = require('path');

module.exports = {
  // Test environment settings
  environment: process.env.TEST_ENV || 'migration',
  timeout: 30000,
  retries: 2,
  
  // Legacy system configuration
  legacy: {
    baseUrl: process.env.LEGACY_BASE_URL || 'http://localhost:3005',
    apiPrefix: '/api',
    timeout: 15000,
    auth: {
      type: 'bearer',
      token: process.env.LEGACY_AUTH_TOKEN
    }
  },
  
  // Microservices configuration
  microservices: {
    apiGateway: {
      baseUrl: process.env.API_GATEWAY_URL || 'http://localhost:8080',
      timeout: 10000
    },
    services: {
      scheduler: {
        baseUrl: process.env.SCHEDULER_SERVICE_URL || 'http://localhost:8081',
        timeout: 15000
      },
      teamManagement: {
        baseUrl: process.env.TEAM_SERVICE_URL || 'http://localhost:8082',
        timeout: 10000
      },
      notification: {
        baseUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8083',
        timeout: 5000
      },
      reporting: {
        baseUrl: process.env.REPORTING_SERVICE_URL || 'http://localhost:8084',
        timeout: 20000
      }
    }
  },
  
  // Database configuration
  database: {
    legacy: {
      host: process.env.LEGACY_DB_HOST || 'localhost',
      port: process.env.LEGACY_DB_PORT || 5432,
      database: process.env.LEGACY_DB_NAME || 'flextime_legacy',
      username: process.env.LEGACY_DB_USER || 'flextime',
      password: process.env.LEGACY_DB_PASS,
      dialect: 'postgres'
    },
    microservices: {
      scheduler: {
        host: process.env.SCHEDULER_DB_HOST || 'localhost',
        port: process.env.SCHEDULER_DB_PORT || 5433,
        database: process.env.SCHEDULER_DB_NAME || 'scheduler_service',
        username: process.env.SCHEDULER_DB_USER || 'scheduler',
        password: process.env.SCHEDULER_DB_PASS,
        dialect: 'postgres'
      },
      teams: {
        host: process.env.TEAMS_DB_HOST || 'localhost',
        port: process.env.TEAMS_DB_PORT || 5434,
        database: process.env.TEAMS_DB_NAME || 'team_service',
        username: process.env.TEAMS_DB_USER || 'teams',
        password: process.env.TEAMS_DB_PASS,
        dialect: 'postgres'
      }
    }
  },
  
  // Test data configuration
  testData: {
    generatedDataPath: path.join(__dirname, '../test-data/generated'),
    fixturesPath: path.join(__dirname, '../test-data/fixtures'),
    scenariosPath: path.join(__dirname, '../test-data/scenarios'),
    maxTeamsPerTest: 16,
    maxGamesPerSchedule: 200,
    testSeasons: ['2024-25', '2025-26']
  },
  
  // Performance testing configuration
  performance: {
    loadTesting: {
      concurrent: 10,
      duration: 300, // 5 minutes
      rampUp: 60, // 1 minute
      maxResponseTime: 5000, // 5 seconds
      errorThreshold: 0.05 // 5% error rate threshold
    },
    benchmarks: {
      scheduleGeneration: {
        maxTime: 30000, // 30 seconds for schedule generation
        minThroughput: 5 // schedules per minute
      },
      apiResponse: {
        maxTime: 2000, // 2 seconds for API calls
        p95Threshold: 1000 // 95th percentile under 1 second
      }
    }
  },
  
  // Functional equivalence testing
  functionalEquivalence: {
    tolerance: {
      numerical: 0.001, // Floating point tolerance
      temporal: 300000 // 5 minutes for time-based comparisons
    },
    ignoredFields: [
      'id',
      'createdAt',
      'updatedAt',
      'version',
      'timestamp'
    ],
    criticalFields: [
      'scheduleId',
      'gameDate',
      'homeTeam',
      'awayTeam',
      'venue'
    ]
  },
  
  // Integration testing configuration
  integration: {
    eventTimeout: 10000, // 10 seconds for event processing
    retryAttempts: 3,
    retryDelay: 1000, // 1 second between retries
    circuitBreaker: {
      threshold: 5,
      timeout: 30000,
      resetTimeout: 60000
    }
  },
  
  // Reporting configuration
  reporting: {
    outputPath: path.join(__dirname, '../reports'),
    formats: ['json', 'html', 'csv'],
    detailLevel: 'full', // 'summary', 'detailed', 'full'
    includeMetrics: true,
    includeLogs: true
  },
  
  // Monitoring configuration
  monitoring: {
    metricsCollection: true,
    realTimeAlerts: true,
    dashboardUrl: process.env.MONITORING_DASHBOARD_URL,
    alertWebhook: process.env.ALERT_WEBHOOK_URL
  }
};