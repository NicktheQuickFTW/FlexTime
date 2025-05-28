# FlexTime Component Relationships

This document clarifies how the various components of FlexTime relate to each other.

## Main Components

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

## Component Responsibilities

### Frontend (React UI)
- Provides user interface for all FlexTime features
- Visualizes schedules, teams, and analytics
- Makes API calls to the backend for data and operations
- Renders interactive charts, matrices, and calendars

### Backend (Node.js API)
- Handles all business logic and data operations
- Exposes REST API endpoints for the frontend
- Performs scheduling calculations and optimizations
- Manages database operations
- Provides authentication and authorization

### Database (Neon PostgreSQL)
- Stores all application data
- Includes team, venue, and schedule information
- Contains championship dates and constraints
- Stores optimization history and results

## Run Configurations

### Direct Mode (Non-Docker)
```
┌──────────────┐                    ┌──────────────┐
│              │                    │              │
│   start.sh   │◄── Starts ─────────┤    app.js    │
│              │                    │              │
└──────────────┘                    └──────────────┘
       │                                   ▲
       │                                   │
       │                                   │ Uses
       │                                   │
       └───► Creates ─────► stop.sh ─────►─┘
```

### Docker Mode
```
┌──────────────────┐           ┌─────────────────┐
│                  │           │                 │
│  docker-start.sh │◄── Uses ──┤ docker-compose  │
│                  │           │                 │
└──────────────────┘           └─────────────────┘
          │                            │
          └───► Creates ───────►docker-stop.sh
```

## Script Purpose Mapping

| Script          | Purpose                                 | Output            |
|-----------------|----------------------------------------|-------------------|
| `start.sh`      | Starts the backend API                  | Backend on :3001  |
| `start-ui.sh`   | Starts the React frontend               | Frontend on :3000 |
| `docker-start.sh` | Starts everything in Docker           | All services      |
| `stop.sh`       | Stops the backend and frontend          | None              |
| `docker-stop.sh`| Stops all Docker containers             | None              |
| `status.sh`     | Shows status of all components          | Status info       |
| `deploy.sh`     | Production deployment (more advanced)   | Deployed app      |