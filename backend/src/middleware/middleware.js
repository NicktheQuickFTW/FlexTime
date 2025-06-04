const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { middleware: { requestMiddleware } } = require('../utils/metrics');
const path = require('path');

function configureMiddleware(app, scaleConfig) {
  // Compression middleware (immediate scaling)
  if (scaleConfig.server.compression.enabled) {
    app.use(compression({
      level: scaleConfig.server.compression.level,
      threshold: scaleConfig.server.compression.threshold
    }));
  }

  // Rate limiting middleware (immediate scaling)
  if (scaleConfig.rateLimiting) {
    const limiter = rateLimit(scaleConfig.rateLimiting);
    app.use(limiter);
  }

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    }
  }));
  
  // CORS configuration
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3005',
      'http://frontend:3000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3005'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request metrics middleware
  app.use(requestMiddleware);
  
  // Static files
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));
  // app.use(express.static(path.join(__dirname, '..', '..', '..', 'frontend')));
}

module.exports = configureMiddleware;