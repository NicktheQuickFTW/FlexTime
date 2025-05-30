# API Gateway System

This directory contains REST and GraphQL API implementations with gateway management and middleware.

## Structure

```
apis/
├── rest/            # RESTful API implementations
├── graphql/         # GraphQL API schemas and resolvers
├── gateway/         # API gateway configurations
├── middleware/      # Request/response middleware
└── documentation/   # API documentation and specs
```

## Features

- **Multi-Protocol Support**: REST and GraphQL APIs
- **API Gateway**: Centralized routing and management
- **Authentication**: JWT, OAuth2, API keys
- **Rate Limiting**: Per-user and global rate limits
- **Caching**: Redis-based response caching
- **Documentation**: Auto-generated API docs

## REST API Endpoints

### Core Resources
- `/api/v1/schedules` - Schedule management
- `/api/v1/teams` - Team data operations
- `/api/v1/venues` - Venue management
- `/api/v1/constraints` - Constraint definitions
- `/api/v1/exports` - Data export operations

### Integration Endpoints
- `/api/v1/webhooks` - Webhook management
- `/api/v1/sync` - Data synchronization
- `/api/v1/external` - External service proxies

## GraphQL Schema

### Core Types
- `Schedule` - Complete schedule information
- `Game` - Individual game details
- `Team` - Team information and stats
- `Venue` - Venue details and availability
- `Constraint` - Scheduling constraints

### Queries
- Real-time schedule queries
- Complex filtering and sorting
- Aggregated statistics
- Historical data access

### Mutations
- Schedule modifications
- Bulk data operations
- Real-time updates
- External integrations

## API Gateway Features

- **Request Routing**: Intelligent request distribution
- **Load Balancing**: Multiple backend support
- **Circuit Breaker**: Fault tolerance patterns
- **Metrics Collection**: Comprehensive API analytics
- **Security Policies**: Centralized security enforcement

## Middleware Stack

- **Authentication**: Token validation and user context
- **Authorization**: Role-based access control
- **Logging**: Request/response logging
- **Metrics**: Performance and usage metrics
- **CORS**: Cross-origin resource sharing
- **Compression**: Response compression
- **Rate Limiting**: Request throttling