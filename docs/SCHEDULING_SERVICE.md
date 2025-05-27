# FlexTime Scheduling Service

The FlexTime Scheduling Service is a fully integrated component that provides enhanced scheduling capabilities directly in the FlexTime application. This service replaces the external Intelligence Engine dependency that was previously required.

## Overview

The Scheduling Service combines advanced functionality for:

1. Schedule generation and optimization
2. Historical data analysis and learning
3. Sport-specific recommendations
4. Schedule templates and patterns

All functionality is now implemented directly in the FlexTime backend, eliminating the need for an external service.

## Architecture

The new architecture consists of:

### 1. Core Service

`AdvancedSchedulingService` (backend/services/advanced_scheduling_service.js) provides:
- Historical schedule data storage and retrieval
- Algorithm recommendations based on past successes
- Sport-specific optimizations
- Learning capabilities that improve over time

### 2. Client Adapters

`SchedulingServiceClient` (backend/clients/scheduling-service-client.js) provides:
- An adapter for components that previously used the Intelligence Engine client
- Simplified interface for scheduling operations
- Backward compatibility for existing code

### 3. API Routes

`schedulingServiceRoutes` (backend/routes/schedulingServiceRoutes.js) exposes:
- RESTful endpoints for all scheduling service operations
- Status monitoring
- Recommendations API
- Template access
- Learning insights

## API Endpoints

The following API endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scheduling-service/status` | GET | Get service status |
| `/api/scheduling-service/recommendations` | POST | Get scheduling recommendations |
| `/api/scheduling-service/sports/:sportType/templates` | GET | Get sport-specific templates |
| `/api/scheduling-service/learning/insights` | GET | Get learning insights |
| `/api/scheduling-service/optimize` | POST | Optimize a schedule |
| `/api/scheduling-service/feedback` | POST | Store user feedback |
| `/api/scheduling-service/store` | POST | Store schedule data |

## Using the Service

### In Code

To use the service in your code:

```javascript
const AdvancedSchedulingService = require('../services/advanced_scheduling_service');

// Create service instance
const schedulingService = new AdvancedSchedulingService();

// Initialize the service
await schedulingService.initialize();

// Get recommendations
const recommendations = await schedulingService.getSchedulingRecommendations({
  sportType: 'basketball',
  conferenceId: 'big12'
});

// Optimize a schedule
const optimizedSchedule = await schedulingService.optimizeSchedule(
  schedule,
  constraints,
  options
);
```

### Via API

To use the service via API:

```javascript
// Get recommendations
fetch('/api/scheduling-service/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sportType: 'basketball',
    conferenceId: 'big12'
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Get sport templates
fetch('/api/scheduling-service/sports/football/templates')
.then(response => response.json())
.then(data => console.log(data));
```

## Key Benefits

1. **Simplified Architecture**: No external dependencies
2. **Improved Performance**: Direct integration reduces latency
3. **Enhanced Reliability**: No network connection issues
4. **Better Maintainability**: All code is in one place
5. **Offline Operation**: Works without external connectivity

## Storage

The service uses Neon DB for persistent storage of:
- Historical schedules
- Optimization patterns
- User feedback
- Templates and recommendations

## Future Enhancements

Future enhancements planned:
- Machine learning integration for advanced pattern recognition
- Additional sport-specific optimization algorithms
- Interactive visualization components
- Performance analytics dashboard