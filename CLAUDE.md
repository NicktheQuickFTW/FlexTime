# FlexTime Development Guide - CLAUDE.md

## Project Overview

**FlexTime** is a production-ready AI-powered sports scheduling platform specifically engineered for the Big 12 Conference. This monolithic application combines advanced constraint satisfaction algorithms, machine learning optimization, and modern web technologies to automate complex collegiate athletics scheduling.

### Current Status: ✅ Production Ready
- **Architecture**: Clean monolithic (reduced from 200MB+ to ~50MB)
- **Deployment**: Single process, dual ports (3003 frontend, 3004 backend)  
- **Sports Coverage**: 12 sport schedulers operational
- **Performance**: <50ms constraint evaluation, <5s schedule generation
- **Business Impact**: $3.0M-$3.9M annual value, 280% ROI projected

## Big 12 Conference Context

### Conference Structure
- **16 Member Institutions**: Arizona, Arizona State, Baylor, BYU, Cincinnati, Colorado, Houston, Iowa State, Kansas, Kansas State, Oklahoma State, TCU, Texas Tech, UCF, Utah, West Virginia
- **Geographic Distribution**: 4 optimized pods with 88.3% efficiency
- **Travel Partners**: 8 pairs with 81.2% travel efficiency
- **Special Considerations**: BYU Sunday restrictions, altitude rotations, campus conflicts

### Sports Portfolio (Team Counts)
```
Football: 16 teams          | Men's Basketball: 16 teams      
Women's Basketball: 16      | Volleyball: 15 teams            
Soccer: 16 teams (women's)  | Baseball: 14 teams              
Softball: 11 teams          | Men's Tennis: 9 teams           
Women's Tennis: 16 teams    | Wrestling: 14 teams (+ associates)
Gymnastics: 7 teams         | Lacrosse: 6 teams (+ affiliates)
```

## Technical Architecture

### Technology Stack
```yaml
Backend:
  - Node.js 18+ with Express
  - PostgreSQL (Neon/Supabase)
  - TensorZero AI framework (~40MB)
  - WebSocket for real-time collaboration
  - Winston logging with structured output

Frontend:
  - Next.js 14 with React 18
  - Tailwind CSS with glassmorphic design
  - TypeScript for type safety
  - Framer Motion for animations
  - Radix UI for accessible components

AI/ML:
  - TensorZero integration for optimization
  - TensorFlow.js for client-side inference
  - COMPASS rating system
  - Pattern recognition algorithms

Infrastructure:
  - Single monolithic deployment
  - Health monitoring with /health endpoint
  - CORS configured for development
  - Rate limiting and security middleware
```

### Directory Structure
```
FlexTime/
├── 📋 Configuration
│   ├── package.json                 # Root dependencies & scripts
│   ├── server.js                    # Express server entry point
│   └── CLAUDE.md                    # This development guide
├── 🎨 Frontend Application
│   ├── app/                         # Next.js 14 app router
│   │   ├── page.tsx                 # Home page
│   │   ├── layout.tsx               # Root layout
│   │   ├── schedule-builder/        # Main scheduling interface
│   │   ├── analytics/               # COMPASS metrics dashboard
│   │   └── components/              # Page-specific components
│   ├── components/                  # Reusable UI components
│   │   ├── common/                  # Shared components
│   │   ├── analytics/               # COMPASS visualization
│   │   ├── constraints/             # Constraint management UI
│   │   └── navigation/              # App navigation
│   ├── styles/                      # Design system & themes
│   └── package.json                 # Frontend dependencies
├── ⚙️ Backend Engine
│   ├── core/                        # Scheduling engine core
│   │   ├── FT_Builder_Ultimate.js   # Main scheduling engine
│   │   ├── SportScheduler.js        # Base scheduler class
│   │   └── SportSchedulerRegistry.js # Scheduler management
│   ├── api/                         # Express API layer
│   │   └── FTBuilderAPI.js          # REST API endpoints
│   ├── schedulers/                  # Sport-specific schedulers
│   │   ├── FootballSchedulerV2.js   # 9-game conference format
│   │   ├── MensBasketballScheduler.js # 20-game rivalry system
│   │   ├── WomensBasketballScheduler.js # 18-game format
│   │   └── [8 more sport schedulers]
│   └── parameters/                  # Constraint system (TypeScript)
│       ├── core/                    # Constraint engine
│       ├── sport-specifics/         # Sport-specific constraints
│       └── constraints/             # Constraint definitions
├── 🗄️ Data Layer
│   ├── data/                        # Big 12 conference data
│   │   ├── Big 12 Schools Data 6.3.csv
│   │   ├── Big 12 Sports Data 6.3.csv
│   │   ├── Big12_Constraints_Report_2025-26.csv
│   │   └── research_results/        # Historical analysis
│   └── utils/                       # Utility functions
│       └── logger.js                # Winston logging configuration
├── 🤖 AI/ML Integration
│   └── ai-ml/
│       └── tensorzero-integration/  # Full TensorZero framework
├── 🔧 Operational Tools
│   ├── scripts/                     # Database & development tools
│   ├── security/                    # Auth, encryption, RBAC
│   └── lib/integrations/            # Health checking & logging
└── 🧪 Testing Infrastructure
    ├── testing/                     # Test framework
    ├── e2e-tests/                   # End-to-end testing
    └── integration-tests/           # Integration testing
```

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev
# Frontend: http://localhost:3003
# Backend:  http://localhost:3004/api
# Health:   http://localhost:3004/health

# Run tests
npm test

# Lint code
npm run lint
```

### Key npm Scripts
```json
{
  "start": "node server.js",
  "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
  "dev:backend": "nodemon server.js",
  "dev:frontend": "cd frontend && npm run dev",
  "build": "npm run build:frontend && npm run build:backend",
  "install-all": "npm install && cd frontend && npm install",
  "test": "jest",
  "lint": "eslint . --ext .js,.ts,.tsx"
}
```

### Environment Configuration
```env
# Application Ports
PORT=3004                                    # Backend port
FRONTEND_URL=http://localhost:3003          # Frontend URL

# Database Configuration  
DATABASE_URL=postgresql://user:pass@host:5432/flextime
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI/ML Services
TENSORZERO_API_KEY=your-tensorzero-key
OPENAI_API_KEY=your-openai-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Logging
LOG_LEVEL=info                               # debug, info, warn, error
NODE_ENV=development                         # development, production
```

## Sport Schedulers Implementation

### Scheduler Registry System
The `SportSchedulerRegistry` manages all sport-specific schedulers:

```javascript
// Core schedulers currently registered:
const schedulers = {
  1: BaseballScheduler,           // 14 teams, 10 three-game series
  2: MensBasketballScheduler,     // 16 teams, 20 conference games  
  3: WomensBasketballScheduler,   // 16 teams, 18 conference games
  8: FootballSchedulerV2,         // 16 teams, 9 conference games
  11: GymnasticsSchedulerV3,      // 7 teams + associates
  13: LacrosseScheduler,          // 6 teams round robin
  14: SoccerScheduler,            // 16 teams (women's)
  15: SoftballScheduler,          // 11 teams, 8 three-game series
  17: MensTennisSchedulerV3,      // 9 teams, 8 matches
  18: WomensTennisSchedulerV3,    // 16 teams, 13 matches, altitude rotation
  19: VolleyballScheduler,        // 15 teams round robin  
  20: WrestlingSchedulerV3        // 14 teams, divisional matrix
};
```

### Scheduler Implementation Pattern
Each scheduler extends the base `SportScheduler` class:

```javascript
class SportScheduler {
  constructor(config) {
    this.sportId = config.sportId;
    this.sportName = config.sportName;
    this.sportConfig = config.sportConfig;
    this.constraints = config.constraints;
  }

  async generateSchedule(teams, constraints, preferences) {
    // Implementation varies by sport
  }

  async optimizeSchedule(schedule, constraints) {
    // Common optimization logic
  }
}
```

### Sport-Specific Features

**Basketball (Men's & Women's)**
- Rivalry game management (5 teams play twice, 10 teams once)
- TV window optimization
- Travel partner coordination
- Back-to-back game prevention

**Football**  
- Media rights optimization
- Championship format consideration
- 9-game conference schedule
- Geographic balance

**Tennis (Men's & Women's)**
- Travel partner system (8 pairs)
- Altitude rotation (4-year cycle for women's)
- Weather contingency planning
- Split weekend formats

**Baseball/Softball**
- Three-game series format
- BYU Sunday exceptions
- Weather makeup scheduling
- Weekend series optimization

**Wrestling**
- Divisional structure (NW/SE divisions)
- Associate member integration
- Legacy program hosting rules
- Flexible calendar scheduling

## API Architecture

### Core Endpoints
```javascript
// Schedule Management
POST   /api/schedules/generate        # Generate new schedule
POST   /api/schedules/:id/optimize    # Optimize existing schedule  
GET    /api/schedules/:id             # Get schedule details
DELETE /api/schedules/:id             # Delete schedule

// Constraint System
POST   /api/constraints/evaluate      # Evaluate constraint violations
GET    /api/constraints               # List available constraints
POST   /api/constraints/batch         # Batch constraint operations

// Analytics & Reporting
GET    /api/analytics/performance     # Performance metrics
POST   /api/analytics/predict-quality # ML quality prediction
GET    /api/analytics/historical      # Historical analysis

// Real-time Collaboration
WS     /api/ws                        # WebSocket for live updates
```

### Request/Response Patterns
```javascript
// Generate Schedule Request
{
  "sport": "basketball",
  "season": "2025-26", 
  "teams": [...],
  "constraints": [
    { "type": "travel_partner", "weight": 0.8 },
    { "type": "campus_conflict", "dates": [...] }
  ],
  "preferences": {
    "optimize_for": "travel_efficiency",
    "allow_back_to_back": false
  }
}

// Schedule Response
{
  "schedule_id": "uuid",
  "sport": "basketball",
  "games": [...],
  "metadata": {
    "constraint_violations": 0,
    "optimization_score": 0.94,
    "travel_efficiency": 0.87
  },
  "generated_at": "2025-06-09T22:15:00Z"
}
```

## Constraint System Architecture

### TypeScript Constraint Engine
The parameters/ directory contains a sophisticated TypeScript-based constraint system:

```typescript
// Core constraint types
interface Constraint {
  id: string;
  type: ConstraintType;
  weight: number;
  target: ConstraintTarget;
  evaluate(schedule: Schedule): ConstraintResult;
}

// Sport-specific constraints
class TravelPartnerConstraint implements Constraint {
  evaluate(schedule: Schedule): ConstraintResult {
    // Evaluate travel partner violations
  }
}
```

### Constraint Categories
- **Travel Constraints**: Partner coordination, distance optimization
- **Temporal Constraints**: Campus conflicts, finals weeks, holidays
- **Competition Constraints**: Back-to-back prevention, rest requirements  
- **Venue Constraints**: Facility availability, capacity requirements
- **Media Constraints**: TV windows, broadcast requirements
- **Conference Rules**: BYU Sunday restrictions, rivalry requirements

## Data Layer & Big 12 Integration

### Conference Data Sources
```yaml
Big 12 Schools Data 6.3.csv:
  - 16 member institutions with profiles
  - Geographic coordinates for travel calculation
  - Campus conflict calendars (finals, graduations)
  - Venue specifications and capacities

Big 12 Sports Data 6.3.csv:
  - Sport participation by institution
  - Season dates and competition formats
  - Conference rules and requirements

Big12_Constraints_Report_2025-26.csv:
  - 150+ constraint definitions
  - Weight assignments and priorities
  - Historical performance data

Research Results:
  - COMPASS ratings for all teams
  - Historical scheduling pattern analysis
  - Travel efficiency calculations
  - Performance optimization insights
```

### Travel Partner System
```javascript
// Optimized travel pairs (81.2% efficiency)
const travelPartners = {
  'Arizona/Arizona State': { efficiency: 0.89 },
  'BYU/Utah': { efficiency: 0.84 },
  'Baylor/TCU': { efficiency: 0.92 },
  'Kansas/Kansas State': { efficiency: 0.87 },
  'Cincinnati/West Virginia': { efficiency: 0.76 },
  'Colorado/Texas Tech': { efficiency: 0.71 },
  'Iowa State/Houston': { efficiency: 0.83 },
  'Oklahoma State/UCF': { efficiency: 0.68 }
};
```

## Performance Optimization

### Current Benchmarks
- **Constraint Evaluation**: <50ms for complex schedules
- **Schedule Generation**: <5 seconds for full season
- **Memory Usage**: <1GB for massive datasets
- **Concurrent Users**: 1000+ real-time collaboration
- **Database Queries**: <100ms for complex joins

### Optimization Strategies
```javascript
// Constraint caching for repeated evaluations
class ConstraintCache {
  cache = new Map();
  
  evaluate(constraint, schedule) {
    const key = this.generateKey(constraint, schedule);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const result = constraint.evaluate(schedule);
    this.cache.set(key, result);
    return result;
  }
}

// Parallel processing for multi-sport schedules
const schedulePromises = sports.map(sport => 
  this.generateScheduleForSport(sport, constraints)
);
const schedules = await Promise.all(schedulePromises);
```

## Real-Time Collaboration

### WebSocket Implementation
```javascript
// Client-side collaboration
const ws = new WebSocket('ws://localhost:3004/api/ws');

ws.on('schedule_update', (data) => {
  // Real-time schedule modifications
  updateScheduleUI(data.schedule);
  showCollaboratorCursor(data.user, data.changes);
});

ws.on('conflict_detected', (data) => {
  // Live constraint violation alerts
  highlightConflicts(data.violations);
  suggestResolutions(data.suggestions);
});

// Server-side broadcasting
broadcastToRoom(scheduleId, {
  type: 'schedule_update',
  changes: modifiedGames,
  user: currentUser,
  timestamp: Date.now()
});
```

## AI/ML Integration

### TensorZero Framework
The ai-ml/tensorzero-integration/ directory contains the complete TensorZero framework:

```javascript
// AI-powered optimization
class MLScheduleOptimizer {
  async optimizeSchedule(schedule, preferences) {
    const features = this.extractFeatures(schedule);
    const predictions = await this.tensorZeroModel.predict(features);
    return this.applyOptimizations(schedule, predictions);
  }

  extractFeatures(schedule) {
    return {
      travelDistance: this.calculateTravelMetrics(schedule),
      conflictScore: this.evaluateConflicts(schedule),
      balanceMetrics: this.calculateBalance(schedule)
    };
  }
}
```

### COMPASS Rating Integration
```javascript
// Team evaluation and seeding
class COMPASSAnalytics {
  calculateTeamRatings(historicalData) {
    // Advanced team evaluation algorithm
    return {
      strengthOfSchedule: 0.87,
      predictedRecord: { wins: 12, losses: 4 },
      conferenceRanking: 3
    };
  }
}
```

## Testing Strategy

### Test Coverage
```bash
# Unit tests for core scheduling logic
npm run test:unit

# Integration tests for API endpoints  
npm run test:integration

# End-to-end tests for user workflows
npm run test:e2e

# Performance benchmarks
npm run test:performance
```

### Critical Test Cases
- **Constraint Satisfaction**: Verify all constraints are respected
- **Schedule Optimization**: Validate improvement metrics
- **Real-time Collaboration**: Test multi-user scenarios
- **Data Integrity**: Ensure schedule consistency
- **Performance Limits**: Test with maximum team/game counts

## Deployment & Operations

### Production Deployment
```bash
# Build optimized bundles
npm run build

# Start production server
NODE_ENV=production npm start

# Health monitoring
curl http://localhost:3004/health
```

### Monitoring & Logging
```javascript
// Structured logging with Winston
logger.info('Schedule generated successfully', {
  sportId: 2,
  teamCount: 16,
  gameCount: 160,
  generationTime: '3.2s',
  optimizationScore: 0.94
});

// Performance monitoring
performance.mark('schedule-generation-start');
const schedule = await generateSchedule(teams, constraints);
performance.mark('schedule-generation-end');
performance.measure('schedule-generation', 'schedule-generation-start', 'schedule-generation-end');
```

## Development Roadmap

### Phase 1: Foundation (Completed ✅)
- [x] Core scheduling engine
- [x] 12 sport-specific schedulers
- [x] Constraint system with 150+ rules
- [x] Real-time collaboration infrastructure
- [x] Modern React/Next.js frontend
- [x] Production deployment architecture

### Phase 2: Enhancement (In Progress 🔄)
- [ ] Advanced AI optimization algorithms
- [ ] Mobile-responsive design improvements
- [ ] Enhanced analytics dashboard
- [ ] Performance optimization for scale
- [ ] Comprehensive API documentation

### Phase 3: Expansion (Planned 📋)
- [ ] Multi-conference support (beyond Big 12)
- [ ] Mobile native applications
- [ ] Third-party integrations (TV networks, venues)
- [ ] Advanced predictive analytics
- [ ] Machine learning model improvements

## Contributing Guidelines

### Code Standards
- Follow ESLint configuration for consistent formatting
- Write comprehensive tests for new features
- Use TypeScript for new constraint system components
- Maintain backward compatibility for API changes
- Document complex algorithms and business logic

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Ensure all tests pass and linting is clean
4. Update documentation as needed
5. Submit PR with detailed description
6. Address code review feedback
7. Merge after approval

### Issue Reporting
- Use provided issue templates
- Include reproduction steps for bugs
- Provide clear requirements for new features
- Label issues appropriately (bug, enhancement, question)

---

**FlexTime Development Team**  
*Building the future of collegiate athletics scheduling*