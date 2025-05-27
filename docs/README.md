# FlexTime Scheduling Platform

FlexTime is an intelligent sports scheduling platform designed for collegiate athletic conferences. It combines machine learning, constraint-based optimization, and championship date management to generate optimal sports schedules that respect all conference and NCAA requirements.

## Get Started Quickly

The FlexTime platform has a simple structure with a **backend API** and a **React frontend**. Here's how to run it:

### Option 1: Direct Mode (Fast Development)

```bash
# Terminal 1: Start the backend API
./start.sh

# Terminal 2: Start the React frontend
./start-ui.sh

# To check status anytime
./status.sh

# To stop everything
./stop.sh
```

### Option 2: Docker Mode (Full Environment)

```bash
# Start everything in Docker containers
./docker-start.sh

# Stop all Docker containers
./docker-stop.sh
```

### Access Your Application

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Status**: http://localhost:3001/api/status

## Features

- **Championship Date Constraints**: Ensures schedules respect conference championships and NCAA tournament dates
- **Multi-Sport Support**: Handles football, basketball, baseball, softball, and all other collegiate sports
- **Venue Management**: Integrates venue availability and characteristics into scheduling decisions
- **Optimization Engine**: Balances travel distance, competitive fairness, and TV schedule optimization
- **Enhanced Visualization**: Travel distance heat maps, constraint satisfaction radar charts, and game density calendars

## Component Architecture

FlexTime has a streamlined architecture with clear component responsibilities:

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│                             │     │                             │
│     Frontend (React UI)     │◄────┤     Backend (Node.js API)   │
│     localhost:3000          │     │     localhost:3001          │
│                             │     │                             │
└─────────────────────────────┘     └─────────────────┬───────────┘
                                                      │
                                    ┌─────────────────▼───────────┐
                                    │                             │
                                    │     Neon PostgreSQL DB      │
                                    │                             │
                                    └─────────────────────────────┘
```

### Backend (app.js)

- Node.js API server running on port 3001
- Handles all scheduling logic and data operations
- Manages database connections and operations
- Provides REST API endpoints for the frontend

### Frontend (React)

- Modern React application running on port 3000
- Provides visualization of schedules, teams, and analytics
- Connects to the backend API for data and operations
- Includes dashboard, scheduling matrix, and team management views

## Reference Documentation

For more detailed information, see:

- **OVERVIEW.md** - Complete overview of the application
- **COMPONENT_RELATIONSHIP.md** - How components connect and interact
- **TECHNICAL_DETAILS.md** - Technical architecture details
- **DEPLOYMENT_GUIDE.md** - How to deploy to production

## API Documentation

### Core Endpoints

- `GET /api/status` - System status
- `GET /api/teams` - List all Big 12 teams
- `GET /api/schedules` - List available schedules
- `GET /api/metrics` - System performance metrics

### Intelligence Engine API

- `GET /api/intelligence-engine/status` - Intelligence engine status
- `POST /api/intelligence-engine/analyze-schedule` - Analyze schedule quality

## License

© 2025 XII-Ops. All rights reserved.