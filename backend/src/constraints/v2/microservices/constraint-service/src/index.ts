import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { constraintRouter } from './api/routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { metricsMiddleware } from './middleware/metrics';
import { MessageBroker } from './services/MessageBroker';
import { CacheService } from './services/CacheService';
import { logger } from './utils/logger';
import { config } from './config';

const app = express();
const server = createServer(app);

// Global middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'constraint-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/constraints', constraintRouter);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Connect to message broker
    await MessageBroker.getInstance().connect();
    logger.info('Connected to message broker');

    // Connect to cache
    await CacheService.getInstance().connect();
    logger.info('Connected to cache service');

    // Start server
    server.listen(config.port, () => {
      logger.info(`Constraint service listening on port ${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await MessageBroker.getInstance().disconnect();
      await CacheService.getInstance().disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();