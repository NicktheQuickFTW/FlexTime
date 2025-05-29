# FlexTime Integrations & API Enhancement Suite

A comprehensive enterprise-grade integration platform for FlexTime's scheduling system, providing robust API infrastructure, external system connections, and seamless data synchronization capabilities.

## 🚀 Overview

This enhancement suite transforms FlexTime into a fully integrated scheduling ecosystem with:

- **Enterprise API Gateway** - Centralized API management with authentication, rate limiting, and monitoring
- **External System Integrations** - Seamless connections to calendars, productivity tools, and conference systems
- **Real-time Synchronization** - Webhooks and event-driven architecture for instant updates
- **Mobile-Optimized APIs** - Lightweight endpoints with offline capabilities
- **Developer Experience** - Comprehensive documentation and testing tools

## 📁 Architecture

```
integrations-enhancement/
├── api-gateway/              # Enterprise API Gateway
│   ├── gateway.js           # Core gateway implementation
│   ├── gateway-config.js    # Service registration & configuration
│   └── index.js            # Gateway startup script
├── notion-webhooks/         # Enhanced Notion Integration
│   ├── enhanced-notion-adapter.js
│   └── notion-webhook-routes.js
├── calendar-integrations/   # Calendar System Integrations
│   ├── calendar-service.js # Google/Outlook/iCal integration
│   └── calendar-routes.js  # Calendar API endpoints
├── big12-apis/             # Big 12 Conference APIs
│   ├── big12-data-service.js
│   └── big12-routes.js
├── webhook-infrastructure/ # Webhook Management System
│   ├── webhook-manager.js
│   └── webhook-routes.js
├── mobile-apis/           # Mobile-Optimized Endpoints
│   ├── mobile-api-service.js
│   └── mobile-routes.js
├── third-party-services/  # External Service Integrations
├── documentation/         # API Documentation & Developer Portal
└── tests/                # Comprehensive test suite
```

## 🛠 Features

### Enterprise API Gateway
- **Authentication & Authorization** - JWT and API key support
- **Rate Limiting** - Configurable limits per user/endpoint
- **Request/Response Transformation** - Data formatting and validation
- **Load Balancing** - Intelligent request distribution
- **Monitoring & Analytics** - Real-time metrics and logging
- **API Versioning** - Backward compatibility management

### External Integrations

#### Calendar Systems
- **Google Calendar** - Full sync with conflict detection
- **Microsoft Outlook** - Native integration with Office 365
- **iCal Export** - Universal calendar compatibility
- **Conflict Resolution** - Automatic scheduling conflict detection

#### Notion Integration
- **Bidirectional Sync** - Real-time data synchronization
- **Webhook Support** - Instant updates from Notion changes
- **Custom Transformations** - Flexible data mapping
- **Bulk Operations** - Efficient batch processing

#### Big 12 Conference APIs
- **Live Data Feeds** - Real-time conference standings
- **TV Schedule Integration** - Broadcast planning optimization
- **Academic Calendar Sync** - Institution-specific constraints
- **Compliance Checking** - Automated rule validation

### Webhook Infrastructure
- **Event-Driven Architecture** - Real-time notifications
- **Reliable Delivery** - Retry mechanisms and failure handling
- **Signature Verification** - Security and authenticity
- **Event Types** - Comprehensive event catalog
- **Delivery Monitoring** - Success/failure tracking

### Mobile API Optimization
- **Lightweight Responses** - Minimal data transfer
- **Offline Capabilities** - Local data caching
- **Push Notifications** - Real-time alerts
- **Compression** - Bandwidth optimization
- **Sync Management** - Conflict-free data synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (LTS recommended)
- Redis 6+ (for caching and queues)
- PostgreSQL 13+ (for data persistence)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd integrations-enhancement
   npm run install:all
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start Services**
   ```bash
   # Start API Gateway
   npm run start:gateway

   # Start in development mode
   npm run dev
   ```

### Environment Variables

```bash
# API Gateway Configuration
GATEWAY_PORT=3001
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379

# External Service APIs
NOTION_API_KEY=your-notion-api-key
NOTION_WEBHOOK_SECRET=your-webhook-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# Big 12 Conference
BIG12_API_KEY=your-big12-api-key

# Push Notifications
PUSH_NOTIFICATION_KEY=your-push-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flextime
```

## 📚 API Documentation

### API Gateway Endpoints

#### Authentication
```http
GET /v1/auth/google?userId=123&state=abc
GET /v1/auth/outlook?userId=123&state=abc
POST /v1/auth/callback
```

#### Core Services
```http
GET /v1/scheduling/*
GET /v1/teams/*
GET /v1/venues/*
GET /v1/compass/*
```

### Calendar Integration

#### Authentication Flow
```http
GET /api/calendars/auth/google?userId=123
POST /api/calendars/auth/google/callback
```

#### Calendar Operations
```http
GET /api/calendars/google/123/calendars
POST /api/calendars/google/123/sync
GET /api/calendars/export/ical/Football
```

### Notion Integration

#### Webhook Management
```http
POST /api/webhooks/notion
GET /api/webhooks/notion/status
POST /api/webhooks/notion/sync/schedules/Football
```

#### Data Synchronization
```http
POST /api/notion-sync/contacts-to-neon
POST /api/notion-sync/schedules-to-notion
POST /api/notion-sync/full-sync
```

### Big 12 Conference APIs

#### Conference Data
```http
GET /api/big12/teams
GET /api/big12/standings/Football
GET /api/big12/tv-schedule/Basketball
GET /api/big12/academic-calendar
```

#### Compliance & Optimization
```http
POST /api/big12/compliance/check
POST /api/big12/tv-optimization
```

### Mobile APIs

#### Optimized Data Endpoints
```http
GET /api/mobile/schedules?sport=Football&limit=20
GET /api/mobile/teams?conference=Big12
POST /api/mobile/sync
```

#### Push Notifications
```http
POST /api/mobile/push/register
POST /api/mobile/push/send
GET /api/mobile/preferences
```

### Webhook Infrastructure

#### Webhook Management
```http
POST /api/webhooks/register
PUT /api/webhooks/:id
DELETE /api/webhooks/:id
POST /api/webhooks/:id/test
```

#### Event Triggering
```http
POST /api/webhooks/trigger
POST /api/webhooks/events/schedule
POST /api/webhooks/events/game
```

## 🧪 Testing

### Unit Tests
```bash
npm test
npm run test:watch
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing
```bash
# Test API Gateway
curl http://localhost:3001/health

# Test Calendar Integration
curl http://localhost:3005/api/calendars/status

# Test Webhook System
curl http://localhost:3005/api/webhooks/status
```

## 🔧 Configuration

### API Gateway Configuration
```javascript
const gateway = new FlexTimeAPIGateway({
  port: 3001,
  jwtSecret: 'your-secret',
  rateLimits: {
    default: { windowMs: 15 * 60 * 1000, max: 100 },
    premium: { windowMs: 15 * 60 * 1000, max: 1000 }
  }
});
```

### Service Registration
```javascript
gateway.registerService('scheduling', {
  path: 'scheduling',
  target: 'http://localhost:3005/api/schedule',
  auth: 'both',
  rateLimit: 'default'
});
```

### Webhook Configuration
```javascript
const webhook = await webhookManager.registerWebhook({
  id: 'my-webhook',
  url: 'https://your-app.com/webhooks/flextime',
  events: ['schedule.created', 'game.updated'],
  secret: 'your-webhook-secret'
});
```

## 📊 Monitoring & Analytics

### Health Checks
- Gateway: `GET /health`
- Calendar: `GET /api/calendars/status`
- Webhooks: `GET /api/webhooks/status`
- Mobile: `GET /api/mobile/status`

### Metrics
- Request/response times
- Success/error rates
- Rate limit violations
- Webhook delivery stats
- Cache hit/miss ratios

### Logging
- Structured JSON logging
- Request tracing
- Error tracking
- Performance monitoring

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Production Checklist
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup procedures
- [ ] Security review

## 🔒 Security

### Authentication
- JWT token validation
- API key verification
- OAuth 2.0 flows
- Webhook signature verification

### Authorization
- Role-based access control
- Resource-level permissions
- Rate limiting per user/tier
- Request validation

### Data Protection
- HTTPS enforcement
- Data encryption at rest
- Secure token storage
- GDPR compliance

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Run tests: `npm test`
4. Submit pull request

### Code Standards
- ESLint configuration
- Jest testing framework
- Conventional commits
- API documentation required

## 📋 Roadmap

### Phase 1 - Core Infrastructure ✅
- [x] API Gateway implementation
- [x] Basic authentication
- [x] Rate limiting
- [x] Health monitoring

### Phase 2 - External Integrations ✅
- [x] Calendar systems (Google, Outlook, iCal)
- [x] Enhanced Notion integration
- [x] Big 12 Conference APIs
- [x] Webhook infrastructure

### Phase 3 - Mobile & Advanced Features ✅
- [x] Mobile-optimized APIs
- [x] Offline capabilities
- [x] Push notifications
- [x] Advanced monitoring

### Phase 4 - Future Enhancements
- [ ] GraphQL API layer
- [ ] Real-time WebSocket connections
- [ ] Machine learning integrations
- [ ] Advanced analytics dashboard

## 📞 Support

- **Documentation**: [https://flextime.app/docs/integrations](https://flextime.app/docs/integrations)
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/flextime/integrations/issues)
- **API Status**: [https://status.flextime.app](https://status.flextime.app)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**FlexTime Integrations & API Enhancement Suite** - Connecting your scheduling ecosystem seamlessly.