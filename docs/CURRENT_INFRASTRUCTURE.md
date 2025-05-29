# FlexTime Scheduling Platform - Current Infrastructure Documentation

**Document Version:** 1.0  
**Last Updated:** January 29, 2025  
**Project Version:** 3.0.0

## Executive Summary

This document provides an accurate, comprehensive overview of the FlexTime Scheduling Platform's **current implementation** as of January 2025. Unlike previous architectural documentation that described aspirational microservices designs, this document reflects the actual deployed infrastructure and codebase structure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FlexTime Current Architecture                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼─────────┐            ┌──────▼──────┐
        │   Frontend       │            │   Backend   │
        │   React SPA      │◄──────────►│  Express.js │
        │   Port: 3000     │            │  Port: 3001 │
        └───────┬─────────┘            └──────┬──────┘
                │                               │
                │                               │
        ┌───────▼─────────┐            ┌──────▼──────┐
        │   Static Assets  │            │ Intelligence│
        │   • Team Logos   │            │  Engine     │
        │   • Themes       │            │  (Python)   │
        │   • CSS/Styles   │            │             │
        └─────────────────┘            └──────┬──────┘
                                               │
                                       ┌──────▼──────┐
                                       │  Data Layer │
                                       │             │
                                       │ • Neon DB   │
                                       │ • Redis     │
                                       │ • File Sys  │
                                       └─────────────┘
```

## Technology Stack

### Frontend
- **Framework:** React 18.2.0 with JavaScript/TypeScript
- **UI Library:** Material-UI (MUI) v5
- **Routing:** React Router DOM v6
- **State Management:** React Context API + Local State
- **Build Tool:** Create React App (react-scripts 5.0.1)
- **Development Server:** React Dev Server (Port 3000)
- **Production Server:** Express.js static server

### Backend
- **Runtime:** Node.js (v16+)
- **Framework:** Express.js 4.18.2
- **Architecture:** Monolithic application
- **Language:** JavaScript with some TypeScript components
- **Package Manager:** npm
- **Process Management:** Direct Node.js execution

### Intelligence Engine
- **Language:** Python 3.9+
- **Framework:** Flask 2.2.3 with WSGI
- **ML Libraries:** 
  - scikit-learn 1.2.2
  - torch 2.0.0 (PyTorch)
  - transformers 4.27.2
- **Optimization:** OR-Tools 9.6.2534, PuLP 2.7.0
- **Data Processing:** pandas 1.5.3, numpy 1.24.2

### Database & Storage
- **Primary Database:** Neon Serverless PostgreSQL
- **Caching:** Redis 7.0 (Optional, via Docker)
- **File Storage:** Local filesystem + planned S3 integration
- **Configuration:** Environment variables (.env files)

## Current Deployment Architecture

### Development Environment
```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend (npm start)     │  Backend (node index.js)       │
│  http://localhost:3000    │  http://localhost:3001          │
│                           │                                 │
│  • React Dev Server       │  • Express.js API              │
│  • Hot Module Reload      │  • Direct file watching        │
│  • Browser DevTools       │  • Console logging             │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    External Services   │
                    │                       │
                    │  • Neon PostgreSQL    │
                    │  • OpenAI API         │
                    │  • Anthropic API      │
                    │  • Notion API         │
                    └───────────────────────┘
```

### Production Environment (Docker)
```
┌─────────────────────────────────────────────────────────────┐
│                Docker Compose Setup                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend Container   │  Backend Container  │  Redis        │
│  Port: 3000          │  Port: 3001         │  Port: 6379   │
│                      │                     │               │
│  • Static React App  │  • Express.js API   │  • Cache      │
│  • Nginx (planned)   │  • Health checks    │  • Sessions   │
└─────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  External Dependencies │
                    │                       │
                    │  • Neon PostgreSQL    │
                    │  • AI Service APIs    │
                    └───────────────────────┘
```

## Directory Structure Analysis

### Root Level
```
flextime/
├── package.json              # Workspace configuration
├── docker-compose.yml        # Container orchestration
├── CLAUDE.md                 # Development guidance
├── README.md                 # Project documentation
├── backend/                  # Express.js monolith
├── frontend/                 # React application
├── scripts/                  # Utility and setup scripts
├── services/                 # Planned microservices (empty)
├── infrastructure/           # K8s/deployment configs
└── archive/                  # Legacy and reference code
```

### Backend Structure (Monolithic Express.js)
```
backend/
├── index.js                  # Main application entry point
├── package.json              # Backend dependencies
├── src/
│   ├── api/                  # API route handlers
│   │   ├── scheduleRoutes.js
│   │   ├── metricsRoutes.js
│   │   ├── virtualAssistantRoutes.js
│   │   └── [12+ other route files]
│   ├── ai/                   # AI/ML components
│   │   ├── intelligence_engine/  # Python Flask API
│   │   ├── agents/           # Scheduling agent system
│   │   ├── algorithms/       # Optimization algorithms
│   │   └── specialized/      # Sport-specific logic
│   ├── models/               # Database models (Sequelize)
│   ├── services/             # Business logic services
│   ├── adapters/             # External service integrations
│   └── utils/                # Utilities and helpers
├── config/                   # Configuration files
├── data/                     # Data files and exports
├── routes/                   # Additional route definitions
├── migrations/               # Database migrations
└── tests/                    # Test suites
```

### Frontend Structure (React SPA)
```
frontend/
├── package.json              # Frontend dependencies
├── server.js                 # Production Express server
├── src/
│   ├── components/           # React components
│   │   ├── common/           # Shared UI components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── schedule/         # Schedule-specific UI
│   │   ├── enhanced/         # Advanced features UI
│   │   └── [sport-specific]/ # Sport profile components
│   ├── pages/                # Page-level components
│   ├── contexts/             # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API service layers
│   ├── utils/                # Frontend utilities
│   ├── styles/               # CSS and styling
│   └── types/                # TypeScript definitions
├── assets/                   # Static assets
│   ├── logos/                # Team and conference logos
│   └── images/               # UI images
└── public/                   # Public static files
```

## Data Architecture

### Database Layer (Neon PostgreSQL)
```sql
-- Core Entities
├── institutions              # Universities/Schools
├── sports                   # Sport definitions
├── teams                    # Team records
├── venues                   # Facility information
├── schedules                # Schedule metadata
├── games                    # Individual game records
├── constraints              # Scheduling constraints
├── seasons                  # Season definitions
└── championships            # Championship dates

-- AI/ML Tables
├── compass_models           # ML model metadata
├── training_history         # Model training logs
├── agent_memory            # Agent system memory
└── predictive_analytics    # Analytics data
```

### Caching Layer (Redis)
- **Session Management:** User sessions and authentication tokens
- **API Caching:** Frequently accessed schedule data
- **Job Queues:** Background task management (planned)
- **Real-time Data:** WebSocket connection state

### File System Storage
```
data/
├── exports/                 # Generated schedule exports
│   ├── *.csv               # CSV format schedules
│   ├── *.xlsx              # Excel format schedules
│   ├── *.ics               # Calendar format schedules
│   └── *.html              # Web format schedules
├── compass/
│   ├── models/             # Trained ML models
│   └── training_history/   # Training data and logs
├── logs/                   # Application logs
└── school_data/            # School/team reference data
```

## API Architecture

### REST API Endpoints
The backend exposes a comprehensive REST API organized by functional areas:

#### Core Scheduling APIs
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule
- `GET /api/schedules/:id/games` - Get schedule games
- `POST /api/schedules/:id/generate` - Generate games

#### Team and Institution APIs
- `GET /api/teams` - List teams
- `GET /api/institutions` - List institutions  
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team

#### Advanced Features APIs
- `GET /api/metrics/advanced/:id` - Advanced schedule metrics
- `POST /api/metrics/recommendations/:id` - Schedule recommendations
- `GET /api/compass/training` - ML training status
- `POST /api/compass/train` - Trigger ML training

#### Integration APIs
- `GET /api/notion/sync` - Notion integration status
- `POST /api/notion/sync` - Sync with Notion
- `GET /api/export/:format/:scheduleId` - Export schedules
- `POST /api/virtual-assistant` - AI assistant interactions

### WebSocket Endpoints (Planned)
- Real-time schedule updates
- Training progress notifications
- Collaborative editing features

## AI/ML Intelligence Engine

### Architecture
The Intelligence Engine is implemented as a hybrid system:

1. **JavaScript Components** (Node.js)
   - Agent orchestration and coordination
   - Business logic and constraints
   - API integration and data flow

2. **Python Components** (Flask API)
   - Machine learning models
   - Optimization algorithms
   - Data analysis and predictions

### Agent System
```
Multi-Agent Architecture:
├── Master Director Agent        # Orchestrates entire process
├── Scheduling Director Agent    # Manages workflow states  
├── Algorithm Selection Agent    # Chooses optimization approach
├── Constraint Management Agent  # Handles scheduling constraints
├── Schedule Optimization Agent  # Core scheduling algorithms
├── Travel Optimization Agent    # Minimizes travel costs/distance
├── Venue Management Agent       # Manages venue conflicts
└── Notification Agent          # Handles alerts and updates
```

### Machine Learning Components
- **COMPASS System:** Predictive analytics for schedule quality
- **Pattern Recognition:** Historical data analysis
- **Optimization Models:** Enhanced simulated annealing, genetic algorithms
- **Real-time Learning:** Continuous improvement from feedback

## Security Architecture

### Authentication & Authorization
- **Method:** JWT-based authentication
- **Storage:** HTTP-only cookies + local storage
- **Sessions:** Redis-backed session management
- **RBAC:** Role-based access control (planned)

### Data Security
- **Database:** Row-level security in PostgreSQL
- **API:** Input validation and sanitization
- **Transport:** HTTPS/TLS encryption
- **Environment:** Environment variable configuration

### CORS Configuration
```javascript
// Current CORS setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## External Integrations

### AI Services
- **OpenAI API:** GPT-4 for natural language processing
- **Anthropic API:** Claude for advanced reasoning
- **Integration:** Direct API calls with response caching

### Data Sources
- **Notion API:** Documentation and data synchronization
- **Big 12 Conference Data:** Team rosters, venue information
- **Calendar Systems:** iCalendar export generation

### Third-party Libraries
#### Frontend
- Material-UI for consistent design system
- React Router for client-side routing
- AG-UI components for advanced interfaces

#### Backend  
- Sequelize ORM for database operations
- Express.js middleware for request handling
- Various optimization and ML libraries

## Performance Characteristics

### Current Performance Metrics
- **Frontend Load Time:** ~2-3 seconds (development)
- **API Response Time:** 100-500ms for typical operations
- **Schedule Generation:** 30 seconds - 5 minutes (depending on complexity)
- **Database Query Performance:** Sub-100ms for indexed queries

### Scalability Considerations
- **Current Limits:** Single-server deployment
- **Database:** Neon auto-scaling handles load variations
- **Memory Usage:** ~500MB typical, 2GB peak during ML training
- **CPU Usage:** Variable based on optimization workloads

## Development Workflow

### Local Development Setup
```bash
# 1. Clone repository
git clone https://github.com/your-org/flextime.git
cd flextime

# 2. Setup backend
cd backend
npm install
cp .env.example .env  # Configure environment variables

# 3. Setup frontend  
cd ../frontend
npm install

# 4. Start development servers
npm run dev  # Starts both frontend and backend
```

### Environment Configuration
Required environment variables:
```env
# Database
NEON_DB_CONNECTION_STRING=postgresql://...
NEON_DB_HOST=...
NEON_DB_USER=...
NEON_DB_PASSWORD=...

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Testing Strategy
- **Backend:** Jest unit tests for services and utilities
- **Integration:** API endpoint testing
- **Frontend:** React Testing Library for component tests
- **E2E:** Manual testing (automated E2E planned)

## Monitoring and Observability

### Current Logging
- **Backend:** Console logging with Winston (planned)
- **Frontend:** Browser console + error boundaries
- **Files:** Structured logs in `/backend/logs/`

### Metrics Collection
- **Basic Metrics:** Request/response times via middleware
- **Business Metrics:** Schedule generation success rates
- **Error Tracking:** Error logs and stack traces

### Health Checks
- **Backend:** `/api/status` endpoint
- **Database:** Connection health monitoring
- **External APIs:** Service availability checks

## Deployment Architecture

### Current Deployment Options

#### Option 1: Local Development
```bash
# Terminal 1: Backend
cd backend && node index.js

# Terminal 2: Frontend  
cd frontend && npm start
```

#### Option 2: Docker Compose
```bash
# Full stack deployment
docker-compose up --build
```

#### Option 3: Individual Service Deploy
```bash
# Backend only
cd backend && npm start

# Frontend production build
cd frontend && npm run build && npm run server
```

### Infrastructure Requirements
- **Minimum:** 2GB RAM, 2 CPU cores
- **Recommended:** 4GB RAM, 4 CPU cores  
- **Storage:** 10GB minimum, 50GB recommended
- **Network:** Stable internet for external API calls

## Known Issues and Technical Debt

### Immediate Issues
1. **Missing Module Dependencies:** Some imports reference moved/deleted files
2. **Agent System State:** Many agent files deleted in recent cleanup
3. **Configuration Drift:** Some configs reference non-existent services

### Technical Debt
1. **Architecture Misalignment:** Monolith vs. documented microservices
2. **Mixed JavaScript/TypeScript:** Inconsistent language usage
3. **Legacy Code:** Outdated patterns and deprecated dependencies
4. **Testing Coverage:** Limited automated test coverage

### Performance Bottlenecks
1. **Schedule Generation:** Can be slow for large datasets
2. **ML Training:** Resource-intensive, requires optimization
3. **Database Queries:** Some unoptimized queries identified

## Future Architecture Roadmap

### Phase 1: Stabilization (Q1 2025)
- Fix missing dependencies and broken imports
- Standardize JavaScript/TypeScript usage
- Implement comprehensive testing suite
- Performance optimization for core features

### Phase 2: Enhancement (Q2 2025)  
- Real-time collaboration features
- Advanced caching strategies
- Mobile-responsive improvements
- Enhanced monitoring and alerting

### Phase 3: Scaling (Q3-Q4 2025)
- Microservices migration (if needed)
- Advanced ML/AI capabilities
- Multi-tenant support
- Enterprise integrations

## Conclusion

The FlexTime Scheduling Platform represents a sophisticated, AI-driven solution for collegiate sports scheduling, currently implemented as a full-stack JavaScript/TypeScript application with Python ML components. While the current architecture differs from previously documented microservices designs, it provides a solid foundation for the platform's core functionality.

The monolithic approach offers simplicity for development and deployment while maintaining the flexibility to evolve toward a more distributed architecture as requirements and scale demands increase.

---

**Document Authors:** FlexTime Development Team  
**Technical Review:** Claude Code Assistant  
**Next Review Date:** April 2025

© 2025 Big 12 Conference - FlexTime Scheduling Platform