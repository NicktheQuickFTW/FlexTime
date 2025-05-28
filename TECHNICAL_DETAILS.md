# FlexTime Architecture

This document outlines the simplified architecture of the FlexTime scheduling platform.

## Overview

FlexTime has been redesigned with a focus on reliability, simplicity, and maintainability. The architecture follows a classic layered design with clear separation of concerns.

```
┌─────────────────────────────────────┐
│             Web Interface           │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│             Express API             │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│      Core Service Components        │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│     Neon Database Integration       │
└─────────────────────────────────────┘
```

## Component Details

### 1. Web Interface

- Simple HTML/CSS/JavaScript interface
- Consumes API endpoints directly
- Responsive design for desktop and mobile
- No frameworks or complex dependencies

### 2. Express API

- RESTful API endpoints
- JSON-based responses
- Core endpoints:
  - `/api/status`: System status information
  - `/api/teams`: Team management
  - `/api/schedules`: Schedule management
  - `/api/metrics`: System metrics
  - `/api/intelligence-engine/*`: Schedule analysis and optimization

### 3. Core Service Components

#### Intelligence Engine Client

The Intelligence Engine has been replaced with a local implementation to eliminate external dependencies. It provides:

- Schedule analysis
- Quality metrics
- Constraint satisfaction analysis
- Travel distance calculation
- Optimization recommendations

#### Database Connector

Provides a simplified interface to the Neon PostgreSQL database:

- Connection pooling
- Error handling
- Response standardization

### 4. Neon Database Integration

Uses Neon DB (PostgreSQL) for all data storage:

- Teams and venues
- Schedules and games
- Constraints and preferences
- System metrics

## Flow Diagrams

### Basic Request Flow

```
Client Request → Express API → Service Component → Neon DB → Response
```

### Schedule Optimization Flow

```
Request → API → Intelligence Engine Client → Analysis → Optimization → Response
```

## Design Decisions

### 1. Monolithic Approach

The system uses a monolithic architecture rather than microservices for simplicity and reliability:

- Single codebase
- Single deployment
- Shared data access
- Simplified error handling

### 2. Local Intelligence Engine

The external intelligence engine dependency has been replaced with a local implementation:

- Eliminates network dependencies
- Predictable response times
- Simplified error handling
- Maintainable codebase

### 3. Static Frontend

The React frontend has been replaced with a static HTML/CSS/JavaScript implementation:

- Eliminates build process
- Reduces dependencies
- Improves loading performance
- Simplifies maintenance

### 4. Direct API Consumption

The frontend directly consumes the API without intermediate layers:

- Reduces complexity
- Improves performance
- Simplifies debugging

## Future Extensibility

The architecture is designed to be extended in the future:

1. **Service Layer Expansion**: New service components can be added for additional features
2. **API Expansion**: New endpoints can be easily added to the Express API
3. **UI Enhancement**: The static UI can be replaced with a React-based UI when needed
4. **Database Schema Expansion**: The Neon DB schema can be expanded for new data requirements

## Monitoring & Maintenance

- All logs are captured in the backend `app.log` file
- The `status.sh` script provides a quick overview of system status
- Start/stop scripts handle process management