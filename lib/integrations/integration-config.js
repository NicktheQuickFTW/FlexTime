/**
 * Integration Ecosystem Configuration
 * Central configuration for all integration components
 */

const config = {
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Webhook configuration
  webhooks: {
    port: process.env.WEBHOOK_PORT || 3001,
    basePath: '/webhooks',
    security: {
      validateSignatures: true,
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    },
    providers: {
      notion: {
        enabled: true,
        secret: process.env.NOTION_WEBHOOK_SECRET,
        endpoints: ['/notion/database', '/notion/page']
      },
      github: {
        enabled: false,
        secret: process.env.GITHUB_WEBHOOK_SECRET,
        endpoints: ['/github/push', '/github/pr']
      },
      calendar: {
        enabled: true,
        secret: process.env.CALENDAR_WEBHOOK_SECRET,
        endpoints: ['/calendar/event']
      }
    }
  },

  // API Gateway configuration
  apis: {
    rest: {
      port: process.env.API_PORT || 3000,
      basePath: '/api/v1',
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 1000
      }
    },
    graphql: {
      port: process.env.GRAPHQL_PORT || 4000,
      endpoint: '/graphql',
      playground: process.env.NODE_ENV === 'development',
      introspection: process.env.NODE_ENV === 'development'
    },
    gateway: {
      services: {
        scheduling: process.env.SCHEDULING_SERVICE_URL || 'http://localhost:3002',
        notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
        analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004'
      }
    }
  },

  // Message Queue configuration
  messageQueues: {
    kafka: {
      enabled: process.env.KAFKA_ENABLED === 'true',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: 'flextime-integration',
      topics: {
        scheduleEvents: 'schedule-events',
        dataSync: 'data-sync',
        notifications: 'notifications',
        analytics: 'analytics'
      }
    },
    rabbitmq: {
      enabled: process.env.RABBITMQ_ENABLED === 'true',
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchanges: {
        events: 'flextime.events',
        sync: 'flextime.sync',
        notifications: 'flextime.notifications'
      }
    },
    redis: {
      enabled: true,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      channels: {
        realtime: 'flextime:realtime',
        notifications: 'flextime:notifications',
        sync: 'flextime:sync'
      }
    }
  },

  // Database configuration
  databases: {
    postgresql: {
      primary: {
        host: process.env.NEON_HOST,
        port: process.env.NEON_PORT || 5432,
        database: process.env.NEON_DATABASE,
        username: process.env.NEON_USERNAME,
        password: process.env.NEON_PASSWORD,
        ssl: { rejectUnauthorized: false },
        pool: {
          min: 2,
          max: 10,
          idle: 30000
        }
      },
      analytics: {
        host: process.env.ANALYTICS_DB_HOST,
        port: process.env.ANALYTICS_DB_PORT || 5432,
        database: process.env.ANALYTICS_DB_NAME,
        username: process.env.ANALYTICS_DB_USER,
        password: process.env.ANALYTICS_DB_PASSWORD
      }
    },
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017/flextime',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_CACHE_DB || 1
    }
  },

  // External Services configuration
  externalServices: {
    notion: {
      apiKey: process.env.NOTION_API_KEY,
      version: '2022-06-28',
      baseUrl: 'https://api.notion.com/v1',
      rateLimit: {
        requests: 3,
        per: 1000 // per second
      }
    },
    calendar: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
      },
      outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        tenantId: process.env.OUTLOOK_TENANT_ID
      }
    },
    email: {
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'noreply@flextime.app'
      },
      ses: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    },
    sms: {
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER
      }
    },
    analytics: {
      googleAnalytics: {
        trackingId: process.env.GA_TRACKING_ID,
        propertyId: process.env.GA_PROPERTY_ID
      },
      mixpanel: {
        token: process.env.MIXPANEL_TOKEN,
        secret: process.env.MIXPANEL_SECRET
      }
    }
  },

  // Data Sync configuration
  dataSync: {
    realTime: {
      enabled: true,
      debounceMs: 500,
      maxRetries: 3,
      retryDelayMs: 1000
    },
    batch: {
      schedules: {
        cron: '0 */6 * * *', // Every 6 hours
        batchSize: 1000
      },
      analytics: {
        cron: '0 2 * * *', // Daily at 2 AM
        batchSize: 5000
      }
    },
    conflictResolution: {
      strategy: 'last_writer_wins', // 'manual', 'business_rules'
      timestampField: 'updated_at'
    }
  },

  // Monitoring configuration
  monitoring: {
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000
    },
    metrics: {
      enabled: true,
      prefix: 'flextime.integration',
      tags: {
        environment: process.env.NODE_ENV || 'development',
        service: 'integration-ecosystem'
      }
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      maxFiles: 5,
      maxSize: '10m'
    }
  }
};

module.exports = config;