# FlexTime Event Streaming Infrastructure

This event streaming infrastructure provides production-ready event-driven capabilities for the FlexTime scheduling platform, enabling microservices communication, real-time updates, and system observability.

## Overview

The event infrastructure is built on Redis Streams and provides:

- **Event Publishing**: Reliable event publishing with delivery guarantees
- **Event Consumption**: Scalable event consumption with consumer groups
- **Stream Monitoring**: Comprehensive monitoring and alerting
- **Schema Validation**: Structured event schemas with validation
- **API Management**: REST API for monitoring and administration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FlexTime Event Infrastructure                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼─────────┐            ┌──────▼──────┐
        │  Event Publisher │            │Event Consumer│
        │                 │◄──────────►│             │
        └───────┬─────────┘            └──────┬──────┘
                │                               │
                │         Redis Streams         │
                │    ┌─────────────────────┐    │
                └────┤ schedule-events     ├────┘
                     │ game-events         │
                     │ optimization-events │
                     │ compass-events      │
                     │ notification-events │
                     │ system-events       │
                     └─────────────────────┘
                                │
                        ┌──────▼──────┐
                        │Stream Monitor│
                        │    & API     │
                        └─────────────┘
```

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install ioredis joi

# Start Redis Streams
docker-compose -f docker-compose.enhanced.yml up redis-streams
```

### 2. Initialize Event Integration

```javascript
const FlexTimeEventIntegration = require('./services/flextime-event-integration');

// Create and initialize
const eventIntegration = new FlexTimeEventIntegration({
  environment: 'development',
  enablePublishing: true,
  enableConsuming: true,
  enableMonitoring: true
});

await eventIntegration.initialize();
await eventIntegration.start();
```

### 3. Publishing Events

```javascript
// Publish a schedule creation event
await eventIntegration.publishScheduleCreated({
  scheduleId: 'schedule-123',
  sport: 'Basketball',
  season: '2025-26',
  conference: 'Big 12',
  status: 'draft',
  createdBy: 'user-456',
  teams: ['kansas', 'baylor', 'texas-tech']
});

// Publish an optimization event
await eventIntegration.publishOptimizationStarted(
  'opt-789',
  'schedule-123',
  'simulated-annealing',
  { iterations: 1000, temperature: 100 }
);
```

### 4. Consuming Events

```javascript
// Handle schedule events
eventIntegration.onScheduleCreated(async (event, context) => {
  console.log('New schedule created:', event.data.scheduleId);
  // Update UI, send notifications, etc.
});

eventIntegration.onOptimizationCompleted(async (event, context) => {
  console.log('Optimization completed:', event.data.optimizationId);
  // Process results, update database
});
```

### 5. Monitoring

```javascript
// Get health status
const health = await eventIntegration.getHealthStatus();
console.log('System health:', health.status);

// Access monitoring API
// GET http://localhost:3010/health
// GET http://localhost:3010/api/metrics
// GET http://localhost:3010/api/streams
```

## Components

### Event Publisher

The Event Publisher handles reliable event publishing to Redis Streams:

```javascript
const EventPublisher = require('./services/event-publisher');

const publisher = new EventPublisher(redisConfig);
await publisher.initialize();

// Publish single event
const result = await publisher.publishEvent(
  'schedule.created',
  { scheduleId: '123', sport: 'Football' },
  { service: 'flextime-backend', version: '3.0.0' }
);

// Publish batch of events
const events = [
  { eventType: 'game.scheduled', data: gameData1, source: serviceInfo },
  { eventType: 'game.scheduled', data: gameData2, source: serviceInfo }
];
const results = await publisher.publishBatch(events);
```

### Event Consumer

The Event Consumer provides scalable event consumption:

```javascript
const EventConsumer = require('./services/event-consumer');

const consumer = new EventConsumer(redisConfig, {
  consumerGroup: 'flextime-workers',
  consumerName: 'worker-1'
});

await consumer.initialize();

// Register event handlers
consumer.onEvent('schedule.created', async (event) => {
  // Handle schedule creation
});

consumer.onStream('game-events', async (event) => {
  // Handle any game-related event
});

await consumer.startConsuming();
```

### Stream Monitor

The Stream Monitor provides observability and alerting:

```javascript
const StreamMonitor = require('./monitoring/stream-monitor');

const monitor = new StreamMonitor(redisConfig, {
  monitoringInterval: 30000,
  alertThresholds: {
    lagThreshold: 1000,
    errorRateThreshold: 0.05
  }
});

await monitor.initialize();
await monitor.startMonitoring();

// Get metrics
const metrics = monitor.getMetricsSummary();
console.log('Stream metrics:', metrics);
```

## Event Types

### Schedule Events

- `schedule.created` - New schedule created
- `schedule.updated` - Schedule modified
- `schedule.published` - Schedule published
- `schedule.deleted` - Schedule deleted

### Game Events

- `game.scheduled` - Game scheduled
- `game.rescheduled` - Game rescheduled
- `game.cancelled` - Game cancelled

### Optimization Events

- `optimization.started` - Optimization started
- `optimization.progress` - Progress update
- `optimization.completed` - Optimization completed
- `optimization.failed` - Optimization failed

### COMPASS Events

- `compass.training.started` - Model training started
- `compass.training.completed` - Training completed
- `compass.prediction.requested` - Prediction requested
- `compass.prediction.completed` - Prediction completed

### System Events

- `system.service.started` - Service started
- `system.service.stopped` - Service stopped
- `system.health.failed` - Health check failed

## Event Schema

All events follow a standardized schema:

```javascript
{
  eventId: 'uuid',
  eventType: 'schedule.created',
  version: '1.0.0',
  timestamp: '2025-01-29T12:00:00.000Z',
  source: {
    service: 'flextime-backend',
    instance: 'server-1',
    version: '3.0.0',
    userId: 'user-123'
  },
  correlationId: 'uuid',
  causationId: 'uuid',
  priority: 'normal',
  data: {
    // Event-specific data
  },
  metadata: {
    // Optional metadata
  },
  tags: ['tag1', 'tag2']
}
```

## Streams

Events are routed to specific streams:

- `schedule-events` - Schedule lifecycle events
- `game-events` - Game-related events
- `constraint-events` - Constraint violations and resolutions
- `optimization-events` - Optimization process events
- `notification-events` - Notification requests and status
- `compass-events` - ML/AI events
- `system-events` - System and service events

## API Endpoints

The Event Management API provides:

### Health and Monitoring

- `GET /health` - System health status
- `GET /api/metrics` - Comprehensive metrics
- `GET /api/metrics/summary` - Metrics summary
- `GET /api/metrics/alerts` - Alert information

### Stream Information

- `GET /api/streams` - All stream information
- `GET /api/streams/{name}` - Specific stream info
- `GET /api/streams/{name}/messages` - Stream messages

### Consumer Information

- `GET /api/consumers` - Consumer group information
- `GET /api/consumers/{group}` - Specific group info

### Event Management

- `POST /api/events/publish` - Publish single event
- `POST /api/events/publish/batch` - Publish multiple events
- `GET /api/events/types` - Available event types
- `GET /api/events/schema/{type}` - Event schema

### Administration

- `POST /api/admin/streams/{name}/trim` - Trim stream
- `POST /api/admin/consumers/{group}/reset` - Reset consumer group
- `DELETE /api/admin/streams/{name}` - Delete stream

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_STREAMS_HOST=localhost
REDIS_STREAMS_PORT=6379
REDIS_STREAMS_PASSWORD=
REDIS_STREAMS_DB=1
REDIS_STREAMS_PREFIX=flextime:stream:

# Consumer Configuration
REDIS_CONSUMER_GROUP=flextime-workers
REDIS_CONSUMER_NAME=worker-1
REDIS_MAX_STREAM_LENGTH=50000

# Monitoring Configuration
MONITORING_INTERVAL=30000
ALERT_LAG_THRESHOLD=1000
ALERT_ERROR_RATE_THRESHOLD=0.05
ALERT_CONSUMER_IDLE_THRESHOLD=300000

# API Configuration
EVENT_API_PORT=3010
EVENT_API_KEY=your-api-key
LOG_LEVEL=info
```

### Docker Configuration

Use the enhanced Docker Compose configuration:

```bash
# Development
docker-compose -f docker-compose.yml -f migration/event-infrastructure/config/docker-compose.enhanced.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.enhanced.yml -f docker-compose.prod.yml up
```

## Integration with FlexTime

### Backend Integration

Add to your FlexTime backend:

```javascript
const FlexTimeEventIntegration = require('./migration/event-infrastructure/services/flextime-event-integration');

// Initialize in your main application
const eventIntegration = new FlexTimeEventIntegration();
await eventIntegration.initialize();

// Make available to your application
app.set('eventIntegration', eventIntegration);

// Use in your services
app.get('/api/schedules', async (req, res) => {
  const schedule = await scheduleService.createSchedule(data);
  
  // Publish event
  await req.app.get('eventIntegration').publishScheduleCreated({
    scheduleId: schedule.id,
    sport: schedule.sport,
    // ... other data
  });
  
  res.json(schedule);
});
```

### Frontend Integration

Subscribe to real-time updates via WebSocket or Server-Sent Events:

```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:3010/events');

ws.onmessage = (event) => {
  const eventData = JSON.parse(event.data);
  
  switch (eventData.eventType) {
    case 'schedule.updated':
      updateScheduleUI(eventData.data);
      break;
    case 'optimization.progress':
      updateProgressBar(eventData.data.progress);
      break;
  }
};
```

## Monitoring and Alerting

### Built-in Alerts

The system automatically monitors and alerts on:

- **Consumer Lag**: When consumers fall behind
- **Stream Growth**: Rapid stream growth
- **Error Rates**: High error rates in processing
- **Idle Consumers**: Consumers that stop processing

### Custom Alerts

Implement custom alert handlers:

```javascript
monitor.onAlert((alert) => {
  if (alert.severity === 'critical') {
    // Send to PagerDuty, Slack, etc.
    notificationService.sendAlert(alert);
  }
});
```

### Metrics Collection

Integrate with your existing monitoring:

```javascript
// Collect metrics for Prometheus, DataDog, etc.
const metrics = await eventIntegration.getHealthStatus();
metricsCollector.gauge('event_streams.lag', metrics.monitor.totalLag);
metricsCollector.counter('event_streams.published', metrics.publisher.totalPublished);
```

## Performance Considerations

### Throughput

- Single Redis instance: ~50,000 events/second
- Consumer groups: Scale horizontally
- Stream trimming: Manage memory usage

### Memory Management

- Configure `maxmemory` policy: `allkeys-lru`
- Set stream retention: `maxLength` option
- Monitor memory usage

### Network

- Use Redis Cluster for high availability
- Enable Redis persistence for durability
- Configure connection pooling

## Security

### Authentication

- API key authentication for management endpoints
- Redis password protection
- Network isolation

### Data Protection

- Event data encryption in transit
- Sensitive data handling in events
- Audit logging

## Troubleshooting

### Common Issues

1. **Consumer Lag**: Scale consumers or optimize processing
2. **Memory Usage**: Trim streams or increase Redis memory
3. **Network Issues**: Check Redis connectivity
4. **Schema Validation**: Verify event structure

### Debugging

```javascript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Test event publishing
await eventIntegration.publishEvent('system.health.check', { test: true });

// Check stream status
const health = await eventIntegration.getHealthStatus();
console.log(JSON.stringify(health, null, 2));
```

### Monitoring Dashboard

Access the Redis monitoring dashboard:

```bash
# Start RedisInsight
docker-compose -f docker-compose.enhanced.yml --profile monitoring up

# Access at http://localhost:8001
```

## Migration Guide

### From Existing FlexTime

1. **Install Infrastructure**: Deploy event infrastructure alongside existing services
2. **Gradual Integration**: Start with non-critical events
3. **Event Handlers**: Implement handlers for existing functionality
4. **Testing**: Validate event flow and processing
5. **Full Migration**: Replace direct service calls with events

### Rollback Plan

The event infrastructure is designed for safe rollback:

1. **Disable Publishing**: Set `ENABLE_EVENT_STREAMING=false`
2. **Graceful Shutdown**: Consumers process remaining events
3. **Fallback**: Direct service calls remain functional
4. **Data Preservation**: Events remain in streams for later processing

## Best Practices

### Event Design

- **Immutable Events**: Never modify published events
- **Rich Context**: Include sufficient context for consumers
- **Idempotency**: Design for duplicate event handling
- **Versioning**: Plan for schema evolution

### Consumer Design

- **Idempotent Processing**: Handle duplicate events gracefully
- **Error Handling**: Implement retry logic with backoff
- **Monitoring**: Track processing metrics
- **Graceful Shutdown**: Handle service restarts

### Operational

- **Stream Retention**: Configure appropriate retention policies
- **Consumer Groups**: Use meaningful group names
- **Monitoring**: Set up comprehensive monitoring
- **Capacity Planning**: Monitor and plan for growth

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review monitoring dashboards
3. Check application logs
4. Create detailed issue reports

## License

This event infrastructure is part of the FlexTime scheduling platform and follows the same licensing terms.