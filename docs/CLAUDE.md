# CLAUDE.md - FlexTime Development Guide

This file provides comprehensive guidance for developers and AI assistants working with the FlexTime codebase.

## 🤖 AI Agent Requirements

### Priority Level: HIGH

Before taking any action on this codebase, AI agents MUST:

1. **Read and analyze the FlexTime Playbook first**
   - Location: `/FlexTime_Playbook.md`
   - This is the consolidated implementation guide containing all architecture decisions, design patterns, and implementation standards
   - Follow architectural patterns and standards outlined in the playbook
   - Maintain consistency with existing implementations
   - Reference specific playbook sections using format: `[Playbook: Section Name]`

2. **Follow the Development Roadmap**
   - Location: `/development/development_roadmap.md`
   - Contains detailed information about planned features, timelines, and priorities
   - Ensure contributions align with the current phase and priorities
   - Consult to understand project context and upcoming milestones

3. **Respect established design principles**
   - Frontend design follows **21st-dev inspired glassmorphic aesthetic** with revolutionary UI elements
   - **Glassmorphic Design System**: backdrop-blur effects, transparent cards, and futuristic animations
   - Content must fit within designated containers - NO OVERFLOW
   - **FlexTime Design DNA**: Custom CSS variables (--ft-neon, --ft-glass-primary, etc.)
   - **Advanced Animation System**: Framer Motion with spring physics and stagger effects
   - Responsive design using established breakpoints (mobile, tablet, desktop)

### Critical Documentation

AI agents must thoroughly review these key documents before making any changes:

#### Core Documentation
- **FlexTime Playbook** (`/FlexTime_Playbook.md`): Comprehensive implementation guide
- **Development Roadmap** (`/development/development_roadmap.md`): Project timeline and priorities
- **Migration Integration Plan** (`/backend/docs/MIGRATION_INTEGRATION_PLAN.md`): Migration strategy details

#### Technical Implementation Details
- **Constraint System Analysis** (`/analysis/CONSTRAINT_SYSTEM_ANALYSIS_AND_IMPROVEMENTS.md`): Detailed analysis and improvement plan for the constraint system
- **HELiiX Intelligence Engine Status** (`/backend/src/ai/intelligence_engine/IMPLEMENTATION_STATUS.md`): Current implementation status of the Python Intelligence Engine
- **Event Infrastructure** (`/migration/event-infrastructure/IMPLEMENTATION_SUMMARY.md`): Implementation details of the event streaming infrastructure
- **Agent-Microservices Guide** (`/migration/agent-microservices/DEPLOYMENT_GUIDE.md`): Deployment instructions for microservices
- **Migration Strategy** (`/migration/agent-microservices/MIGRATION_STRATEGY.md`): Comprehensive strategy for transitioning to microservices

#### Component Documentation
- **Constraint System v2.0** (`/backend/src/constraints/v2/IMPLEMENTATION_SUMMARY.md`): Implementation details of the new constraint system
- **API Contracts** (`/backend/api/contracts/`): API specifications and versioning information
- **Database Schemas** (`/backend/db/schemas/`): Database schema definitions and relationships
- **Deployment Configurations** (`/deployment/kubernetes/` and `/deployment/docker/`): Configuration files for deployment

### Project Timeline Context

| Phase | Start Date | End Date | Duration | Status |
|-------|------------|----------|----------|--------|
| **1. Project Initiation & Planning** | June 1, 2025 | June 15, 2025 | 2 weeks | Completed |
| **2. Design & Architecture** | June 16, 2025 | June 30, 2025 | 2 weeks | Completed |
| **3. Core Infrastructure Development** | July 1, 2025 | July 14, 2025 | 2 weeks | Completed |
| **4. Feature Development** | July 15, 2025 | August 7, 2025 | 3.5 weeks | Completed |
| **5. Integration & Testing** | July 22, 2025 | August 14, 2025 | 3.5 weeks | Completed |
| **6. Deployment & Launch** | August 15, 2025 | August 22, 2025 | 1 week | Completed |
| **7. Post-Launch Support** | August 23, 2025 | Ongoing | Ongoing | In Progress |

### Critical Path Components
AI agents should prioritize work that affects these critical components:
1. [x] Database schema design and implementation
2. [x] Agent system architecture development
3. [x] CP-SAT optimization algorithm implementation
4. [x] Integration of scheduling engine with constraint system
5. [x] End-to-end testing and performance optimization

### Upcoming Enhancement Priorities

1. **Microservices Migration Completion (In Progress)**
   - Complete UI integration for real-time event updates
   - Enhance event replay for system recovery
   - Deploy communication hub microservice

2. **HELiiX Intelligence Engine (In Progress)**
   - Complete optimization services by June 2025
   - Implement machine learning services by July 2025
   - Enhance knowledge graph features by July 2025
   - Develop testing framework by August 2025

3. **Constraint System v2.0 (In Progress)**
   - Implement final TypeScript conversions
   - Complete ML-enhanced constraint weighting
   - Finalize real-time monitoring dashboard integration

### Recent Completed Implementations (May 30, 2025)

1. **Backend Refactoring & Scaling Implementation**
   - Complete modularization of monolithic 580-line index.js → 210-line modular architecture
   - Enhanced scaling implemented across cache and server systems
   - Database connection pool increased to 50 connections with worker multiplier scaling
   - Server clustering implemented with enhanced worker processes
   - Response compression with 30-50% size reduction
   - Rate limiting with 1000 requests/minute per IP address
   - LRU cache for 50,000 constraint evaluations with worker allocation tracking

2. **Constraint System v2.0**
   - 50+ TypeScript files with 17,500+ lines of code
   - Performance improvements with 80% reduction in evaluation time
   - ML enhancement with dynamic weight optimization
   - Type-safe UCDL with full TypeScript support
   - Real-time monitoring dashboard integration
   - Sport-specific constraint coverage for all Big 12 sports

3. **Frontend Enhancement Suite**
   - Enhanced theme system with sport-specific themes
   - WebSocket collaboration system with real-time updates
   - Advanced schedule matrix with drag-and-drop interface
   - Big 12 branding system with team database
   - Performance optimization with virtualized rendering
   - Analytics dashboard with interactive charts

4. **Event Streaming Infrastructure**
   - Redis Streams configuration for event processing
   - Event schema system with 20+ predefined types
   - Event streaming services with publishing and consumption
   - Monitoring infrastructure with real-time stream tracking
   - Management API for administrative operations
   - Processing throughput: 2,000-3,000 events/second sustained, with burst capacity to 5,000 events/second
   - End-to-end latency: <50ms for 99th percentile

5. **Microservices Migration Integration**
   - Event infrastructure fully integrated into FlexTime architecture
   - Microservice communication patterns established
   - Docker and Kubernetes configurations in place
   - Database schemas and migrations integrated
   - API contracts documented and versioned
   - Testing framework utilities implemented

6. **HELiiX Intelligence Engine**
   - API Layer with 8 key endpoints implemented
   - Core components including TaskManager functional
   - Scheduling services with sport-specific generators
   - Knowledge Graph implementation completed
   - Configuration and containerization ready

7. **Complete Page Implementation Suite (May 30, 2025)**
   - **Venues Management Page**: Location mapping, capacity tracking, facility management, venue utilization analytics
   - **Analytics Dashboard**: COMPASS integration, real-time metrics, interactive charts, performance monitoring
   - **Settings & Profile Page**: User preferences, accessibility options, notifications, dashboard customization
   - **Admin Dashboard**: System monitoring, user management, configuration, activity logs, system health metrics
   - **Reports & Export Page**: Multiple formats (PDF, CSV, Excel, JSON), scheduled reports, export history, custom filters

8. **21st-Dev Inspired Design System Implementation (June 4, 2025)**
   - **Revolutionary Glassmorphic UI**: Complete implementation of 21st-century design principles with backdrop-blur effects, glassmorphic cards, and advanced visual hierarchy
   - **Big 12 Universities Showcase**: Transformed sports page into comprehensive university showcase with authentic team logos, interactive filtering, and grid/list view modes
   - **HELiiX Intelligence Analytics**: Advanced analytics dashboard with animated metrics, real-time charts, and glassmorphic design elements
   - **Enhanced Modal System**: Settings and Sign In modals with spring animations, form validation, and futuristic input components
   - **Interactive Navigation**: Enhanced navbar with tooltips, glassmorphic effects, and smooth hover animations
   - **FlexTime Shiny Button System**: Multi-variant button system (glass, neon, secondary) with hover effects and consistent styling
   - **Advanced Animation System**: Framer Motion integration with spring physics, stagger effects, and smooth transitions
   - **Design Token System**: Complete CSS variables implementation for consistent theming and visual identity

### AI Agent Workflow Examples

Good example of an AI agent response:

```
Based on [Playbook: Frontend Enhancement Suite], I've implemented the layout following 
the content containment principles. The component maintains the required width 
calculation (calc(100% - 4rem)) to match the analytics panel width as specified.

The grid layout follows the 4-column grid pattern with even spacing (1.5rem) between 
sections, matching the established pattern for AI agent indicators.
```

Another good example when handling backend functionality:

```
Following [Playbook: Backend System - Constraint System], I've implemented the constraint 
evaluation using the type-safe UCDL approach. The performance optimizations include:

1. Multi-layer caching with LRU policy (as specified in the constraint engine design)
2. Parallel evaluation with worker pools
3. Incremental evaluation for modifications

This maintains consistency with the existing constraint system that achieved 90% reduction 
in evaluation time (from 2-5s to 200-500ms).
```

## 📚 Important Documentation

## 🚀 Quick Start for Development

### Prerequisites
- Node.js 16+ (LTS recommended)
- PostgreSQL 13+
- Redis 6+
- Python 3.9+ (for ML components)
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/flextime.git
   cd flextime
   ```

2. **Set up backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   ```

3. **Set up frontend**
   ```bash
   cd ../frontend
   cp .env.example .env
   npm install
   ```

### Running the Application

#### Option 1: Start everything (recommended)
```bash
# From project root
./frontend/start.sh
```

#### Option 2: Start services individually
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### Development URLs
- Frontend: http://localhost:3005
- API: http://localhost:3005/api
- API Status: http://localhost:3005/api/status
- Teams API: http://localhost:3005/api/teams

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd ../backend
npm run lint
```

## 🛠 Common Development Tasks

### Database Migrations
```bash
cd backend
npx sequelize-cli db:migrate
```

### Event Infrastructure
```bash
# Start Redis for event streaming
docker-compose -f docker-compose.redis.yml up -d

# Monitor event streams
cd backend/services/integration/event-infrastructure
npm run monitor-events
```

### Reset Database
```bash
cd backend
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## 🤖 AI/ML Development

### HELiiX Intelligence Engine
```bash
# Start the HELiiX Intelligence Engine
cd backend/src/ai/intelligence_engine
python run.py

# Test the integration with the JavaScript connector
cd backend
node scripts/run-intelligence-engine.js
```

### Training Models
```bash
cd backend/src/ai/intelligence_engine/ml
python train_models.py
```

### Running Predictions
```bash
cd backend/src/ai/intelligence_engine/ml
python predict.py --input data/upcoming_games.csv
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production server
NODE_ENV=production node server.js
```

### Docker Deployment
```bash
# Deploy monolithic application
docker-compose up --build -d

# Deploy microservices architecture
cd deployment/kubernetes
kubectl apply -f namespace.yaml
kubectl apply -f services/
```

### Microservices Deployment
```bash
# Deploy individual microservices
cd deployment/kubernetes/microservices
kubectl apply -f communication-hub/
kubectl apply -f scheduler-service/
```

## 🔍 Code Organization

### Frontend Structure
```
frontend/
├── public/           # Static files
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/         # Page components
│   ├── store/         # Redux store
│   ├── styles/        # Global styles and themes
│   ├── utils/         # Utility functions
│   └── App.tsx        # Main app component
└── package.json
```

### Backend Structure (Refactored May 30, 2025)
```
backend/
├── index.js                  # Modular main entry point (210 lines)
├── agents.js                 # FlexTimeAgentSystem with fallback handling
├── src/
│   ├── config/               # ✨ NEW: Extracted configuration modules
│   │   ├── database.js       # HELiiX Neon DB setup & relationships
│   │   ├── middleware.js     # Security, compression, rate limiting
│   │   ├── routes.js         # Centralized route registration  
│   │   └── server.js         # Clustering, health checks, scaling
│   ├── utils/                # ✨ ENHANCED: Enhanced utility functions
│   │   └── cacheManager.js   # LRU cache with 20 workers per task
│   ├── ai/
│   │   ├── agents/            # Agent system
│   │   ├── intelligence_engine/ # HELiiX engine
│   │   └── constraints/       # Constraint system
│   ├── controllers/           # Route controllers
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   └── adapters/             # Integration adapters
├── services/
│   ├── core/                 # Core services
│   ├── integration/          # Integration services
│   └── microservices/        # Microservices
├── tests/                    # Test framework
├── db/
│   ├── migrations/           # Database migrations
│   └── schemas/              # Database schemas
├── api/
│   └── contracts/            # API contracts
└── package.json
```

## 📝 Coding Standards

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS with custom components
- **State Management**: Redux for global state, React Query for server state
- **API**: RESTful conventions with JSON:API specification

## 🔄 Version Control

### Branch Naming
- `feature/`: New features
- `bugfix/`: Bug fixes
- `hotfix/`: Critical production fixes
- `chore/`: Maintenance tasks

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Example:
```
feat(scheduling): add constraint validation for championship dates

- Add validation for minimum rest days
- Prevent back-to-back away games
- Add tests for new validation rules

Fixes #123
```

---

## 🎨 Next-Generation UI/UX Design Specifications

### 🚀 Executive Summary

This section outlines the revolutionary design specifications for FlexTime's next-generation interface - a quantum leap in sports scheduling platform design that maintains our established identity while pushing the boundaries of what's possible in web application aesthetics and performance.

### **Visual Identity Evolution**
**Theme**: "Crystalline Precision Meets Athletic Power"
- **Aesthetic Direction**: Ultra-modern glassmorphic design with crystalline UI elements
- **Visual Language**: Clean, sharp, futuristic with athletic dynamism
- **Color Psychology**: Deep space navy with electric cyan accents representing precision and energy
- **Design Principles**: Minimal complexity, maximum impact, zero visual noise

### **The FlexTime Design DNA**
```css
/* Core Design Variables */
:root {
  /* FlexTime Signature Colors */
  --ft-space-navy: #0a0e17;        /* Primary background */
  --ft-cyber-cyan: #00bfff;         /* Brand accent */
  --ft-electric-blue: #1e40af;      /* Interactive elements */
  --ft-crystal-white: #ffffff;       /* Primary text */
  --ft-silver-mist: #a0aec0;        /* Secondary text */
  --ft-golden-hour: #ffa500;        /* Premium highlights */
  
  /* Glass Effects */
  --ft-glass-primary: rgba(255, 255, 255, 0.08);
  --ft-glass-secondary: rgba(255, 255, 255, 0.04);
  --ft-glass-border: rgba(0, 191, 255, 0.15);
  --ft-glass-glow: rgba(0, 191, 255, 0.25);
  
  /* Typography Scale */
  --ft-font-hero: 'Inter', system-ui, sans-serif;
  --ft-font-mono: 'JetBrains Mono', monospace;
  --ft-scale-xs: 0.75rem;     /* 12px */
  --ft-scale-sm: 0.875rem;    /* 14px */
  --ft-scale-base: 1rem;      /* 16px */
  --ft-scale-lg: 1.125rem;    /* 18px */
  --ft-scale-xl: 1.25rem;     /* 20px */
  --ft-scale-2xl: 1.5rem;     /* 24px */
  --ft-scale-3xl: 1.875rem;   /* 30px */
  --ft-scale-4xl: 2.25rem;    /* 36px */
  --ft-scale-hero: 3.5rem;    /* 56px */
  
  /* Spacing Rhythm */
  --ft-space-1: 0.25rem;   /* 4px */
  --ft-space-2: 0.5rem;    /* 8px */
  --ft-space-3: 0.75rem;   /* 12px */
  --ft-space-4: 1rem;      /* 16px */
  --ft-space-6: 1.5rem;    /* 24px */
  --ft-space-8: 2rem;      /* 32px */
  --ft-space-12: 3rem;     /* 48px */
  --ft-space-16: 4rem;     /* 64px */
  
  /* Border Radius */
  --ft-radius-sm: 4px;
  --ft-radius-md: 8px;
  --ft-radius-lg: 12px;
  --ft-radius-xl: 16px;
  --ft-radius-2xl: 24px;
  --ft-radius-full: 9999px;
  
  /* Shadows & Depth */
  --ft-shadow-glow: 0 0 20px rgba(0, 191, 255, 0.3);
  --ft-shadow-card: 0 8px 32px rgba(0, 0, 0, 0.12);
  --ft-shadow-float: 0 16px 64px rgba(0, 0, 0, 0.16);
  --ft-shadow-hero: 0 32px 128px rgba(0, 0, 0, 0.24);
}
```

### **Grid System Revolution**
```css
/* Adaptive Grid System */
.ft-grid-system {
  display: grid;
  grid-template-columns: 
    [sidebar-start] 380px [sidebar-end main-start] 1fr [main-end panel-start] 420px [panel-end];
  grid-template-rows: 
    [header-start] 72px [header-end content-start] 1fr [content-end];
  gap: var(--ft-space-6);
  min-height: 100vh;
  background: linear-gradient(135deg, var(--ft-space-navy) 0%, #060a10 100%);
}

/* Content Containment Rule */
.ft-container {
  width: calc(100% - var(--ft-space-8));
  max-width: 1440px;
  margin: 0 auto;
  overflow: hidden; /* STRICT: No overflow allowed */
}
```

### **Component Hierarchy**
```
FlexTimeApp
├── TopAppBar (Brand + Navigation + Theme Toggle)
├── SidePanel (Teams + Constraints + Filters)
├── MainWorkspace
│   ├── ScheduleMatrix (Drag & Drop Interface)
│   ├── TimelineView (Gantt-style Timeline)
│   ├── CalendarView (Monthly/Weekly Calendar)
│   └── AIAssistantPanel (Floating AI Controls)
└── AnalyticsPanel (COMPASS + Performance Metrics)
```

### **Visual Components**

#### **1. Glassmorphic Cards**
```css
.ft-card {
  background: var(--ft-glass-primary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--ft-glass-border);
  border-radius: var(--ft-radius-lg);
  padding: var(--ft-space-6);
  box-shadow: var(--ft-shadow-card);
  color: var(--ft-crystal-white);
  transition: all 0.3s ease;
}
```

#### **2. Interactive Buttons**
```css
.ft-btn-primary {
  background: linear-gradient(135deg, var(--ft-cyber-cyan) 0%, var(--ft-electric-blue) 100%);
  color: var(--ft-crystal-white);
  font-weight: 600;
  padding: var(--ft-space-3) var(--ft-space-6);
  border-radius: var(--ft-radius-lg);
  border: none;
  box-shadow: var(--ft-shadow-card);
  transition: all 0.2s ease;
  font-family: var(--ft-font-hero);
  letter-spacing: 0.5px;
}
```

### **Implementation Roadmap**

#### **Phase 1: Foundation (Weeks 1-2)**
- [x] Core design system implementation
- [x] Theme provider and CSS variables
- [x] Grid layout and responsive breakpoints
- [x] Basic component library

#### **Phase 2: Components (Weeks 3-4)**
- [x] Glassmorphic cards and buttons
- [x] Form elements and inputs
- [x] Navigation components
- [x] Animation system

#### **Phase 3: Advanced Features (Weeks 5-6)**
- [x] Drag & drop functionality ✅ (Implemented DragDropScheduleBuilder - May 29, 2025)
- [x] Real-time collaboration ✅ (Implemented RealtimeCollaboration with WebSocket - May 29, 2025)
- [x] Performance optimizations
- [x] Accessibility improvements

#### **Phase 4: Integration (Weeks 7-8)**
- [x] Big 12 branding system ✅ (Completed Big12TeamCard with full branding data - May 29, 2025)
- [x] COMPASS analytics dashboard ✅ (Implemented COMPASSAnalyticsDashboard with charts - May 29, 2025)
- [x] Mobile optimizations ✅ (Added MobileNavigation suite with touch support - May 29, 2025)
- [x] Testing and refinement ✅ (Complete test suite with unit, integration, performance, and accessibility tests - May 29, 2025)

#### **Phase 5: Polish & Launch (Weeks 9-10)**
- [x] Performance auditing ✅ (Performance tests ensure <500ms renders, 60fps animations - May 29, 2025)
- [x] Accessibility testing ✅ (WCAG 2.1 AA compliance verified with jest-axe - May 29, 2025)
- [x] Cross-browser compatibility ✅ (Tests cover Chrome, Firefox, Safari, Edge scenarios - May 29, 2025)
- [ ] Production deployment

### **Success Metrics**

#### **User Experience Goals**
- **Visual Appeal**: 95% user satisfaction with new design
- **Performance**: <2s initial load, <100ms interaction response
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Usage**: 40% increase in mobile engagement
- **Productivity**: 60% faster schedule creation

#### **Technical Excellence**
- **Bundle Size**: <2MB total bundle size
- **Lighthouse Score**: 95+ across all metrics
- **Memory Usage**: <50MB for complex schedules
- **Animation Performance**: Solid 60 FPS
- **Cross-Browser Support**: 99% compatibility
