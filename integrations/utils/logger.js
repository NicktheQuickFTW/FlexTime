/**
 * Centralized logging utility for the integration ecosystem
 */

import winston from 'winston';
import config from '../config.js';

class Logger {
  constructor(service = 'integration-ecosystem') {
    this.service = service;
    this.logger = winston.createLogger({
      level: config.monitoring.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            service: this.service,
            message,
            ...meta
          });
        })
      ),
      defaultMeta: { service: this.service },
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: config.monitoring.logging.maxFiles
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: config.monitoring.logging.maxFiles
        })
      ]
    });

    // Add console transport for development
    if (config.environment !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ timestamp, level, message, service }) => {
            return `${timestamp} [${service}] ${level}: ${message}`;
          })
        )
      }));
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  trace(message, meta = {}) {
    this.logger.silly(message, meta);
  }

  // Create child logger with additional context
  child(context) {
    return new Logger(`${this.service}:${context}`);
  }

  // Log request/response for APIs
  logRequest(req, res, duration) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  // Log webhook events
  logWebhook(event, status, duration, error = null) {
    const logData = {
      event: event.type,
      source: event.source,
      status,
      duration: `${duration}ms`,
      webhookId: event.id
    };

    if (error) {
      logData.error = error.message;
      logData.stack = error.stack;
      this.error('Webhook processing failed', logData);
    } else {
      this.info('Webhook processed', logData);
    }
  }

  // Log data sync operations
  logSync(operation, status, records, duration, error = null) {
    const logData = {
      operation,
      status,
      records,
      duration: `${duration}ms`
    };

    if (error) {
      logData.error = error.message;
      this.error('Data sync failed', logData);
    } else {
      this.info('Data sync completed', logData);
    }
  }

  // Log external service calls
  logExternalService(service, operation, status, duration, error = null) {
    const logData = {
      service,
      operation,
      status,
      duration: `${duration}ms`
    };

    if (error) {
      logData.error = error.message;
      this.error('External service call failed', logData);
    } else {
      this.info('External service call completed', logData);
    }
  }

  // Log performance metrics
  logMetric(metric, value, tags = {}) {
    this.info('Performance metric', {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  // Log security events
  logSecurity(event, details = {}) {
    this.warn('Security event', {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

export { Logger };