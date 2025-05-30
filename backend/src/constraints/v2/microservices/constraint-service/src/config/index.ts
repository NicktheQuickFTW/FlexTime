export const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchanges: {
      constraints: 'constraints.topic',
      conflicts: 'conflicts.direct',
      notifications: 'notifications.fanout'
    },
    queues: {
      evaluation: 'constraint.evaluation',
      validation: 'constraint.validation',
      updates: 'constraint.updates'
    }
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  
  services: {
    conflict: process.env.CONFLICT_SERVICE_URL || 'http://conflict-service:3002',
    ml: process.env.ML_SERVICE_URL || 'http://ml-service:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3005'
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};