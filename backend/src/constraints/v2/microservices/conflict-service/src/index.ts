import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { conflictRouter } from './api/routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { MessageBroker } from './services/MessageBroker';
import { ConflictAnalyzer } from './services/ConflictAnalyzer';
import { ResolutionEngine } from './services/ResolutionEngine';
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'conflict-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/conflicts', conflictRouter);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Connect to message broker
    const messageBroker = MessageBroker.getInstance();
    await messageBroker.connect();
    logger.info('Connected to message broker');

    // Initialize conflict analyzer
    const conflictAnalyzer = new ConflictAnalyzer();
    const resolutionEngine = new ResolutionEngine();

    // Set up message consumers
    await messageBroker.consume('conflicts.analyze', async (message) => {
      const { scheduleId } = message;
      return await conflictAnalyzer.analyzeSchedule(scheduleId);
    });

    await messageBroker.consume('conflicts.resolve', async (message) => {
      const { conflicts, strategy } = message;
      return await resolutionEngine.resolveConflicts(conflicts, strategy);
    });

    // Start server
    server.listen(config.port, () => {
      logger.info(`Conflict service listening on port ${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await messageBroker.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();