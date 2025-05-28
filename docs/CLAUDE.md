# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the FlexTime codebase for the Big 12 Conference scheduling platform.

## Project Overview

FlexTime is the Big 12 Conference's intelligent sports scheduling platform that optimizes schedules for 16 member schools across 23 sports. It uses machine learning, constraint-based optimization, and multi-agent systems to generate schedules that minimize travel costs, ensure competitive balance, and comply with conference/NCAA requirements.

## Key Context for Development

### Big 12 Conference Structure
- **16 Member Schools**: Arizona, Arizona State, Baylor, BYU, UCF, Cincinnati, Colorado, Houston, Iowa State, Kansas, Kansas State, Oklahoma State, TCU, Texas Tech, Utah, West Virginia
- **23 Sports**: Football, Basketball (M/W), Baseball, Softball, Soccer, Volleyball, Tennis (M/W), Golf (M/W), Track & Field (Indoor/Outdoor), Cross Country, Swimming & Diving, Wrestling, Gymnastics, Rowing, Beach Volleyball, Equestrian, Lacrosse
- **Geographic Span**: From West Virginia to Arizona, requiring sophisticated travel optimization

### Development Environment

```bash
# Quick start - recommended approach
./scripts/start.sh          # Starts both backend and frontend
./scripts/status.sh         # Check running services
./scripts/stop.sh           # Stop all services

# Manual start
cd backend && npm start     # API on port 3001
cd frontend && npm start    # UI on port 3000

# Environment setup
cp backend/.env.example backend/.env
# Configure with your Neon DB credentials and API keys
```

### Testing Guidelines

```bash
# Before committing, always run:
npm run lint               # Check code style
npm run typecheck         # Verify TypeScript types
npm test                  # Run test suite

# Specific component tests
cd backend && node src/intelligence/test-schedule-generation.js
cd backend && node tools/test-ml-components.js
cd backend && ./tools/train-compass-models.sh
```

## Architecture & Key Components

### 1. Backend API (`/backend`)
Primary server handling all business logic and data operations.

**Key Files:**
- `app.js` - Main Express server configuration
- `src/api/scheduleRoutes.js` - Core scheduling endpoints
- `src/intelligence/intelligence_engine.js` - ML orchestration

**Important Services:**
- `ScheduleService` - Core scheduling logic
- `IntelligenceEngine` - ML-powered optimization
- `TravelOptimizer` - Minimizes team travel distances
- `VenueManager` - Handles venue conflicts and availability

### 2. Multi-Agent System (`/backend/src/intelligence`)
Distributed optimization using specialized agents.

**Director Agents:**
- `MasterDirectorAgent` - Orchestrates all operations
- `SchedulingDirector` - Manages scheduling workflow
- `AnalysisDirector` - Handles analytics and reporting

**Specialized Agents:**
- `ConflictResolutionAgent` - Resolves scheduling conflicts
- `TravelOptimizationAgent` - Optimizes travel patterns
- `VenueManagementAgent` - Manages venue allocation
- `ComplianceAgent` - Ensures NCAA/conference rule compliance

### 3. Machine Learning Components (`/backend/src/intelligence`)
COMPASS (Comprehensive Optimization Model for Performance and Schedule Success) system.

**Models:**
- Team Rating Model - Evaluates team strength
- Game Prediction Model - Predicts game outcomes
- Schedule Strength Model - Measures schedule difficulty
- Player Impact Model - Assesses player contributions

**Training Workflow:**
```bash
# Sequential model training
cd backend/tools
./sequential-model-training.js
```

### 4. Frontend Application (`/frontend`)

**Key Components:**
- `ScheduleMatrix` - Interactive schedule visualization
- `MetricsDashboard` - Real-time analytics display
- `TravelMap` - Geographic travel visualization
- `TeamManager` - Team configuration interface

**Tech Stack:**
- React 18 with TypeScript
- Material-UI for components
- Recharts for data visualization
- Axios for API communication

## Database Schema (Neon PostgreSQL)

### Core Tables:
- `schools` - Big 12 member institutions
- `teams` - Sport-specific teams for each school  
- `venues` - Stadium/arena information
- `schedules` - Generated schedule data
- `games` - Individual game records
- `constraints` - Scheduling rules and requirements
- `championship_dates` - Conference/NCAA championship dates

### Key Relationships:
- Schools have many Teams (one per sport)
- Teams belong to Schools and Sports
- Games reference two Teams and a Venue
- Schedules contain many Games

## Common Development Tasks

### Adding a New Sport
1. Update `backend/data/sports-config.js`
2. Add sport-specific constraints in `intelligence/specialized/`
3. Seed teams in database via `tools/seed-neon-teams.js`
4. Update frontend SportSelector component

### Modifying Scheduling Algorithms
1. Core algorithm: `intelligence/enhanced-simulated-annealing.js`
2. Constraints: `intelligence/specialized/*_constraints.js`
3. Optimization: `intelligence/multi-variable-optimizer.js`

### Adding New API Endpoints
1. Create route in `src/api/`
2. Add controller logic
3. Update `app.js` to include route
4. Document in `backend/docs/`

### Updating ML Models
1. Modify training in `intelligence/models/`
2. Update workflow in `MLWorkflowManager`
3. Retrain using `sequential-model-training.js`
4. Verify with `test-ml-components.js`

## Best Practices

### Code Style
- Use ES6+ JavaScript features
- Follow existing patterns in codebase
- Add JSDoc comments for functions
- Keep functions focused and testable

### Error Handling
- Always wrap async operations in try-catch
- Log errors with appropriate context
- Return meaningful error messages to frontend
- Use proper HTTP status codes

### Performance
- Use database indexes for frequent queries
- Implement caching for expensive calculations
- Batch database operations when possible
- Profile and optimize critical paths

### Security
- Never commit credentials or API keys
- Validate all user inputs
- Use parameterized queries
- Implement rate limiting on APIs

## Debugging Tips

### Common Issues
1. **Schedule Generation Fails**
   - Check championship date constraints
   - Verify venue availability
   - Review constraint violations in logs

2. **ML Models Not Training**
   - Ensure database has sufficient data
   - Check model file permissions
   - Verify training data quality

3. **Frontend Not Connecting**
   - Confirm backend is running on 3001
   - Check CORS configuration
   - Verify API endpoint URLs

### Useful Commands
```bash
# Check database connection
cd backend && node tools/test-neon-connection.js

# Verify agent system
cd backend && node src/intelligence/test-agent-system.js

# Test specific scheduling scenario
cd backend && node tools/test-schedule-generation.js

# Monitor real-time logs
tail -f backend/logs/combined.log
```

## Important Notes

1. **Travel Optimization**: Critical for Big 12 due to geographic spread. Always consider travel distance in scheduling decisions.

2. **Championship Dates**: Never schedule regular season games during conference or NCAA championship periods.

3. **Venue Sharing**: Some schools share venues across sports. Check venue availability across all sports.

4. **TV Windows**: Football and basketball have specific TV scheduling requirements that must be respected.

5. **Academic Calendar**: Avoid scheduling during finals weeks and respect each school's academic calendar.

Remember: The goal is to create fair, competitive schedules that minimize travel burden while maximizing revenue opportunities and competitive balance across all Big 12 sports.