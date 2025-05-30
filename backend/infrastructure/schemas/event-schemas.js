/**
 * Event Schema Definitions for FlexTime Event Streaming Infrastructure
 * 
 * Defines standardized schemas for all events flowing through the system.
 * These schemas ensure consistent event structure across microservices.
 */

const Joi = require('joi');

// Base event schema that all events must follow
const BaseEventSchema = Joi.object({
  // Event metadata
  eventId: Joi.string().uuid().required(),
  eventType: Joi.string().required(),
  version: Joi.string().default('1.0.0'),
  timestamp: Joi.date().iso().required(),
  
  // Source information
  source: Joi.object({
    service: Joi.string().required(),
    instance: Joi.string(),
    version: Joi.string(),
    userId: Joi.string().optional()
  }).required(),
  
  // Event context
  correlationId: Joi.string().uuid().optional(),
  causationId: Joi.string().uuid().optional(),
  priority: Joi.string().valid('critical', 'high', 'normal', 'low').default('normal'),
  
  // Event data
  data: Joi.object().required(),
  
  // Optional metadata
  metadata: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

// Schedule-related event schemas
const ScheduleEventSchemas = {
  // Schedule lifecycle events
  SCHEDULE_CREATED: BaseEventSchema.keys({
    eventType: Joi.string().valid('schedule.created').required(),
    data: Joi.object({
      scheduleId: Joi.string().required(),
      sport: Joi.string().required(),
      season: Joi.string().required(),
      conference: Joi.string().required(),
      status: Joi.string().valid('draft', 'active', 'published').required(),
      createdBy: Joi.string().required(),
      teams: Joi.array().items(Joi.string()).required(),
      constraints: Joi.object().optional()
    }).required()
  }),

  SCHEDULE_UPDATED: BaseEventSchema.keys({
    eventType: Joi.string().valid('schedule.updated').required(),
    data: Joi.object({
      scheduleId: Joi.string().required(),
      changes: Joi.object().required(),
      previousVersion: Joi.string().optional(),
      newVersion: Joi.string().required(),
      updatedBy: Joi.string().required()
    }).required()
  }),

  SCHEDULE_PUBLISHED: BaseEventSchema.keys({
    eventType: Joi.string().valid('schedule.published').required(),
    data: Joi.object({
      scheduleId: Joi.string().required(),
      publishedBy: Joi.string().required(),
      publishedAt: Joi.date().iso().required(),
      approvalChain: Joi.array().items(Joi.object()).optional()
    }).required()
  }),

  SCHEDULE_DELETED: BaseEventSchema.keys({
    eventType: Joi.string().valid('schedule.deleted').required(),
    data: Joi.object({
      scheduleId: Joi.string().required(),
      deletedBy: Joi.string().required(),
      reason: Joi.string().optional(),
      backupLocation: Joi.string().optional()
    }).required()
  })
};

// Game-related event schemas
const GameEventSchemas = {
  GAME_SCHEDULED: BaseEventSchema.keys({
    eventType: Joi.string().valid('game.scheduled').required(),
    data: Joi.object({
      gameId: Joi.string().required(),
      scheduleId: Joi.string().required(),
      homeTeam: Joi.string().required(),
      awayTeam: Joi.string().required(),
      venue: Joi.string().required(),
      scheduledDate: Joi.date().iso().required(),
      sport: Joi.string().required(),
      gameType: Joi.string().valid('conference', 'non-conference', 'championship').required(),
      constraints: Joi.object().optional()
    }).required()
  }),

  GAME_RESCHEDULED: BaseEventSchema.keys({
    eventType: Joi.string().valid('game.rescheduled').required(),
    data: Joi.object({
      gameId: Joi.string().required(),
      originalDate: Joi.date().iso().required(),
      newDate: Joi.date().iso().required(),
      reason: Joi.string().required(),
      rescheduledBy: Joi.string().required(),
      affectedParties: Joi.array().items(Joi.string()).optional()
    }).required()
  }),

  GAME_CANCELLED: BaseEventSchema.keys({
    eventType: Joi.string().valid('game.cancelled').required(),
    data: Joi.object({
      gameId: Joi.string().required(),
      reason: Joi.string().required(),
      cancelledBy: Joi.string().required(),
      refundRequired: Joi.boolean().default(false),
      alternativeOptions: Joi.array().items(Joi.object()).optional()
    }).required()
  })
};

// Optimization-related event schemas
const OptimizationEventSchemas = {
  OPTIMIZATION_STARTED: BaseEventSchema.keys({
    eventType: Joi.string().valid('optimization.started').required(),
    data: Joi.object({
      optimizationId: Joi.string().required(),
      scheduleId: Joi.string().required(),
      algorithm: Joi.string().required(),
      parameters: Joi.object().required(),
      estimatedDuration: Joi.number().optional()
    }).required()
  }),

  OPTIMIZATION_PROGRESS: BaseEventSchema.keys({
    eventType: Joi.string().valid('optimization.progress').required(),
    data: Joi.object({
      optimizationId: Joi.string().required(),
      progress: Joi.number().min(0).max(100).required(),
      currentIteration: Joi.number().optional(),
      bestSolution: Joi.object().optional(),
      metrics: Joi.object().optional()
    }).required()
  }),

  OPTIMIZATION_COMPLETED: BaseEventSchema.keys({
    eventType: Joi.string().valid('optimization.completed').required(),
    data: Joi.object({
      optimizationId: Joi.string().required(),
      success: Joi.boolean().required(),
      finalSolution: Joi.object().optional(),
      metrics: Joi.object().required(),
      duration: Joi.number().required(),
      iterations: Joi.number().optional()
    }).required()
  }),

  OPTIMIZATION_FAILED: BaseEventSchema.keys({
    eventType: Joi.string().valid('optimization.failed').required(),
    data: Joi.object({
      optimizationId: Joi.string().required(),
      error: Joi.string().required(),
      stackTrace: Joi.string().optional(),
      partialResults: Joi.object().optional(),
      retryable: Joi.boolean().default(false)
    }).required()
  })
};

// Constraint-related event schemas
const ConstraintEventSchemas = {
  CONSTRAINT_ADDED: BaseEventSchema.keys({
    eventType: Joi.string().valid('constraint.added').required(),
    data: Joi.object({
      constraintId: Joi.string().required(),
      scheduleId: Joi.string().required(),
      type: Joi.string().required(),
      description: Joi.string().required(),
      severity: Joi.string().valid('hard', 'soft', 'preference').required(),
      addedBy: Joi.string().required(),
      parameters: Joi.object().optional()
    }).required()
  }),

  CONSTRAINT_VIOLATED: BaseEventSchema.keys({
    eventType: Joi.string().valid('constraint.violated').required(),
    data: Joi.object({
      constraintId: Joi.string().required(),
      scheduleId: Joi.string().optional(),
      gameId: Joi.string().optional(),
      violationType: Joi.string().required(),
      severity: Joi.string().valid('critical', 'warning', 'info').required(),
      details: Joi.object().required(),
      suggestedActions: Joi.array().items(Joi.string()).optional()
    }).required()
  }),

  CONSTRAINT_RESOLVED: BaseEventSchema.keys({
    eventType: Joi.string().valid('constraint.resolved').required(),
    data: Joi.object({
      constraintId: Joi.string().required(),
      violationId: Joi.string().required(),
      resolution: Joi.string().required(),
      resolvedBy: Joi.string().optional(),
      resolvedAt: Joi.date().iso().required()
    }).required()
  })
};

// Notification event schemas
const NotificationEventSchemas = {
  NOTIFICATION_REQUIRED: BaseEventSchema.keys({
    eventType: Joi.string().valid('notification.required').required(),
    data: Joi.object({
      type: Joi.string().valid('email', 'sms', 'push', 'webhook').required(),
      recipients: Joi.array().items(Joi.string()).required(),
      subject: Joi.string().required(),
      body: Joi.string().required(),
      urgency: Joi.string().valid('immediate', 'high', 'normal', 'low').default('normal'),
      templateId: Joi.string().optional(),
      attachments: Joi.array().items(Joi.object()).optional()
    }).required()
  }),

  NOTIFICATION_SENT: BaseEventSchema.keys({
    eventType: Joi.string().valid('notification.sent').required(),
    data: Joi.object({
      notificationId: Joi.string().required(),
      type: Joi.string().required(),
      recipient: Joi.string().required(),
      sentAt: Joi.date().iso().required(),
      status: Joi.string().valid('sent', 'delivered', 'failed').required(),
      externalId: Joi.string().optional()
    }).required()
  })
};

// COMPASS ML event schemas
const CompassEventSchemas = {
  MODEL_TRAINING_STARTED: BaseEventSchema.keys({
    eventType: Joi.string().valid('compass.training.started').required(),
    data: Joi.object({
      trainingId: Joi.string().required(),
      modelType: Joi.string().required(),
      sport: Joi.string().required(),
      datasetSize: Joi.number().required(),
      parameters: Joi.object().required(),
      estimatedDuration: Joi.number().optional()
    }).required()
  }),

  MODEL_TRAINING_COMPLETED: BaseEventSchema.keys({
    eventType: Joi.string().valid('compass.training.completed').required(),
    data: Joi.object({
      trainingId: Joi.string().required(),
      modelId: Joi.string().required(),
      accuracy: Joi.number().min(0).max(1).required(),
      metrics: Joi.object().required(),
      duration: Joi.number().required(),
      deployed: Joi.boolean().default(false)
    }).required()
  }),

  PREDICTION_REQUESTED: BaseEventSchema.keys({
    eventType: Joi.string().valid('compass.prediction.requested').required(),
    data: Joi.object({
      predictionId: Joi.string().required(),
      modelId: Joi.string().required(),
      input: Joi.object().required(),
      requestedBy: Joi.string().required(),
      priority: Joi.string().valid('real-time', 'batch', 'background').default('batch')
    }).required()
  }),

  PREDICTION_COMPLETED: BaseEventSchema.keys({
    eventType: Joi.string().valid('compass.prediction.completed').required(),
    data: Joi.object({
      predictionId: Joi.string().required(),
      result: Joi.object().required(),
      confidence: Joi.number().min(0).max(1).required(),
      processingTime: Joi.number().required(),
      modelVersion: Joi.string().required()
    }).required()
  })
};

// System event schemas
const SystemEventSchemas = {
  SERVICE_STARTED: BaseEventSchema.keys({
    eventType: Joi.string().valid('system.service.started').required(),
    data: Joi.object({
      serviceName: Joi.string().required(),
      version: Joi.string().required(),
      environment: Joi.string().required(),
      config: Joi.object().optional(),
      dependencies: Joi.array().items(Joi.string()).optional()
    }).required()
  }),

  SERVICE_STOPPED: BaseEventSchema.keys({
    eventType: Joi.string().valid('system.service.stopped').required(),
    data: Joi.object({
      serviceName: Joi.string().required(),
      reason: Joi.string().required(),
      graceful: Joi.boolean().default(true),
      uptime: Joi.number().optional()
    }).required()
  }),

  HEALTH_CHECK_FAILED: BaseEventSchema.keys({
    eventType: Joi.string().valid('system.health.failed').required(),
    data: Joi.object({
      serviceName: Joi.string().required(),
      healthCheck: Joi.string().required(),
      error: Joi.string().required(),
      consecutiveFailures: Joi.number().default(1),
      lastSuccess: Joi.date().iso().optional()
    }).required()
  })
};

// Event type mappings
const EVENT_TYPES = {
  // Schedule events
  'schedule.created': ScheduleEventSchemas.SCHEDULE_CREATED,
  'schedule.updated': ScheduleEventSchemas.SCHEDULE_UPDATED,
  'schedule.published': ScheduleEventSchemas.SCHEDULE_PUBLISHED,
  'schedule.deleted': ScheduleEventSchemas.SCHEDULE_DELETED,
  
  // Game events
  'game.scheduled': GameEventSchemas.GAME_SCHEDULED,
  'game.rescheduled': GameEventSchemas.GAME_RESCHEDULED,
  'game.cancelled': GameEventSchemas.GAME_CANCELLED,
  
  // Optimization events
  'optimization.started': OptimizationEventSchemas.OPTIMIZATION_STARTED,
  'optimization.progress': OptimizationEventSchemas.OPTIMIZATION_PROGRESS,
  'optimization.completed': OptimizationEventSchemas.OPTIMIZATION_COMPLETED,
  'optimization.failed': OptimizationEventSchemas.OPTIMIZATION_FAILED,
  
  // Constraint events
  'constraint.added': ConstraintEventSchemas.CONSTRAINT_ADDED,
  'constraint.violated': ConstraintEventSchemas.CONSTRAINT_VIOLATED,
  'constraint.resolved': ConstraintEventSchemas.CONSTRAINT_RESOLVED,
  
  // Notification events
  'notification.required': NotificationEventSchemas.NOTIFICATION_REQUIRED,
  'notification.sent': NotificationEventSchemas.NOTIFICATION_SENT,
  
  // COMPASS events
  'compass.training.started': CompassEventSchemas.MODEL_TRAINING_STARTED,
  'compass.training.completed': CompassEventSchemas.MODEL_TRAINING_COMPLETED,
  'compass.prediction.requested': CompassEventSchemas.PREDICTION_REQUESTED,
  'compass.prediction.completed': CompassEventSchemas.PREDICTION_COMPLETED,
  
  // System events
  'system.service.started': SystemEventSchemas.SERVICE_STARTED,
  'system.service.stopped': SystemEventSchemas.SERVICE_STOPPED,
  'system.health.failed': SystemEventSchemas.HEALTH_CHECK_FAILED
};

/**
 * Validate an event against its schema
 */
function validateEvent(event) {
  const schema = EVENT_TYPES[event.eventType];
  if (!schema) {
    throw new Error(`Unknown event type: ${event.eventType}`);
  }
  
  const { error, value } = schema.validate(event);
  if (error) {
    throw new Error(`Event validation failed: ${error.message}`);
  }
  
  return value;
}

/**
 * Create a new event with proper structure
 */
function createEvent(eventType, data, source, options = {}) {
  const event = {
    eventId: options.eventId || require('crypto').randomUUID(),
    eventType,
    version: options.version || '1.0.0',
    timestamp: options.timestamp || new Date().toISOString(),
    source,
    data,
    correlationId: options.correlationId,
    causationId: options.causationId,
    priority: options.priority || 'normal',
    metadata: options.metadata,
    tags: options.tags
  };
  
  return validateEvent(event);
}

module.exports = {
  BaseEventSchema,
  ScheduleEventSchemas,
  GameEventSchemas,
  OptimizationEventSchemas,
  ConstraintEventSchemas,
  NotificationEventSchemas,
  CompassEventSchemas,
  SystemEventSchemas,
  EVENT_TYPES,
  validateEvent,
  createEvent
};