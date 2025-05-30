# Message Queue Integration System

This directory contains message queue implementations for Kafka, RabbitMQ, and Redis to enable asynchronous processing and event-driven architecture.

## Structure

```
message-queues/
├── kafka/       # Apache Kafka configurations
├── rabbitmq/    # RabbitMQ implementations
├── redis/       # Redis pub/sub and streaming
├── producers/   # Message producers
├── consumers/   # Message consumers
└── configs/     # Queue configurations
```

## Supported Message Queues

### Apache Kafka
- **High Throughput**: Handle millions of messages per second
- **Partitioning**: Horizontal scaling with topic partitions
- **Replication**: Data durability and fault tolerance
- **Stream Processing**: Real-time data processing

### RabbitMQ
- **Message Routing**: Flexible routing with exchanges
- **Dead Letter Queues**: Failed message handling
- **Priority Queues**: Message prioritization
- **Clustering**: High availability setup

### Redis
- **Pub/Sub**: Real-time messaging
- **Streams**: Persistent message logs
- **Lists**: Simple queue implementation
- **Sorted Sets**: Priority queues

## Message Types

### Schedule Events
- `schedule.created` - New schedule generation
- `schedule.updated` - Schedule modifications
- `schedule.published` - Schedule publication
- `schedule.deleted` - Schedule removal

### Data Sync Events
- `data.sync.start` - Synchronization initiation
- `data.sync.progress` - Sync progress updates
- `data.sync.complete` - Sync completion
- `data.sync.error` - Sync error handling

### External Integration Events
- `notion.webhook` - Notion database updates
- `calendar.event` - Calendar system events
- `payment.transaction` - Payment notifications
- `email.send` - Email notifications

### System Events
- `user.activity` - User action tracking
- `system.health` - Health check results
- `performance.metrics` - Performance data
- `error.alert` - Error notifications

## Producers

### Schedule Producer
- Publishes schedule-related events
- Batch message publishing
- Message deduplication
- Error handling and retries

### Data Sync Producer
- Coordinates data synchronization
- Cross-system event publishing
- Conflict resolution events
- Status updates

### Notification Producer
- User notifications
- System alerts
- Email/SMS triggers
- Push notifications

## Consumers

### Schedule Consumer
- Processes schedule events
- Triggers automated actions
- Updates dependent systems
- Generates notifications

### Integration Consumer
- Handles external system events
- Updates local data stores
- Triggers webhook responses
- Manages synchronization

### Analytics Consumer
- Collects performance metrics
- Processes usage statistics
- Generates reports
- Updates dashboards

## Configuration

### Kafka Configuration
- Topic partitioning strategies
- Replication factors
- Retention policies
- Consumer group settings

### RabbitMQ Configuration
- Exchange types and routing
- Queue durability settings
- Message TTL configuration
- Dead letter queue setup

### Redis Configuration
- Pub/sub channel patterns
- Stream configuration
- Memory optimization
- Persistence settings

## Monitoring and Observability

- **Message Throughput**: Real-time processing rates
- **Queue Depth**: Message backlog monitoring
- **Consumer Lag**: Processing delay tracking
- **Error Rates**: Failed message analysis
- **Health Checks**: System availability monitoring