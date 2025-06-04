# Backend API Endpoint Analysis

## Available API Routes (from `/backend/src/config/routes.js`)

### Core Scheduling Services
1. **`/api/scheduling-service/*`** - Primary scheduling operations
2. **`/api/schedule/*`** - Schedule CRUD operations  
3. **`/api/virtual-assistant/*`** - AI assistant features
4. **`/api/feedback/*`** - Feedback system
5. **`/api/export/*`** - Export functionality
6. **`/api/visualizations/*`** - Chart/graph data
7. **`/api/metrics/*`** - System metrics

### Key Endpoints We Need

#### `/api/scheduling-service/` endpoints:
- `GET /teams` - Get all teams
- `GET /teams/:conference` - Get teams by conference  
- `GET /constraints` - Get all constraints
- `GET /constraints/:sport` - Get sport-specific constraints
- `GET /status` - Service status
- `POST /optimize` - Schedule optimization
- `POST /feedback` - Submit feedback

#### `/api/schedule/` endpoints:
- `GET /schedules` - Get all schedules
- `GET /schedules/:id` - Get specific schedule
- `POST /schedules` - Create new schedule
- `POST /schedules/generate` - Generate schedule with AI
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule
- `POST /schedules/:id/optimize` - Optimize specific schedule

#### `/api/export/` endpoints:
- Various export formats (CSV, PDF, etc.)

## Current Frontend Expectations vs Reality

### ❌ What broken APIs expect:
```
/api/teams
/api/schedules  
/api/constraints
/api/venues
```

### ✅ What backend actually provides:
```
/api/scheduling-service/teams
/api/scheduling-service/constraints  
/api/schedule/schedules
/api/export/*
```

## Recommended New API Structure

Create **ONE** unified API service that maps to correct backend endpoints:

```typescript
// New unified API structure
class FlexTimeAPI {
  // Teams
  getTeams() → GET /api/scheduling-service/teams
  getTeamsByConference() → GET /api/scheduling-service/teams/:conference
  
  // Schedules  
  getSchedules() → GET /api/schedule/schedules
  getSchedule(id) → GET /api/schedule/schedules/:id
  createSchedule() → POST /api/schedule/schedules
  generateSchedule() → POST /api/schedule/schedules/generate
  updateSchedule() → PUT /api/schedule/schedules/:id
  deleteSchedule() → DELETE /api/schedule/schedules/:id
  optimizeSchedule() → POST /api/schedule/schedules/:id/optimize
  
  // Constraints
  getConstraints() → GET /api/scheduling-service/constraints
  getConstraintsBySport() → GET /api/scheduling-service/constraints/:sport
  
  // System
  getStatus() → GET /api/status
  getMetrics() → GET /api/metrics/*
  
  // Export
  exportSchedule() → GET /api/export/*
}
```

This would replace ALL 3 existing API files with one clean, correctly-mapped service!