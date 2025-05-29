# HELiiX Intelligence Engine API Documentation

This document provides comprehensive documentation for the Intelligence Engine API endpoints available in the FlexTime scheduling service.

## Base URL

All API endpoints are available at:
```
/api/intelligence-engine
```

## Authentication

All API endpoints require authentication. Authentication is handled through the standard HELiiX authentication middleware.

## Endpoints

### Status

Get the current status of the Intelligence Engine connection.

**URL:** `/api/intelligence-engine/status`  
**Method:** `GET`  
**Response:**
```json
{
  "success": true,
  "status": "connected",
  "version": "1.2.0",
  "uptime": 3600,
  "connections": {
    "neonDb": true,
    "redis": true
  }
}
```

### Experiences

#### Get Experiences

Retrieve experiences from the Intelligence Engine.

**URL:** `/api/intelligence-engine/experiences`  
**Method:** `GET`  
**Query Parameters:**
- `type` (string, optional): Filter by experience type (e.g., "schedule_generation", "schedule_optimization")
- `agentId` (string, optional): Filter by agent ID (e.g., "scheduling_director")
- `tags` (string, optional): Comma-separated list of tags to filter by (e.g., "basketball,conference_big12")
- `limit` (number, optional, default: 10): Maximum number of experiences to return

**Response:**
```json
{
  "success": true,
  "count": 2,
  "experiences": [
    {
      "id": "exp_123456",
      "agentId": "scheduling_director",
      "type": "schedule_generation",
      "content": {
        "sportType": "basketball",
        "conferenceId": "big12",
        "teamCount": 10,
        "constraintCount": 5,
        "outcome": "success",
        "metrics": {
          "travelDistance": 15000,
          "homeAwayBalance": 0.95,
          "constraintSatisfaction": 0.98
        }
      },
      "tags": ["basketball", "big12", "generation"],
      "timestamp": "2025-04-27T14:30:00Z"
    },
    {
      "id": "exp_123457",
      "agentId": "operations_director",
      "type": "schedule_optimization",
      "content": {
        "sportType": "basketball",
        "conferenceId": "big12",
        "algorithm": "simulated_annealing",
        "focusAreas": ["travel_distance"],
        "outcome": "success",
        "improvements": {
          "travelDistance": {
            "original": 15000,
            "optimized": 12500,
            "percentImprovement": 16.7
          }
        }
      },
      "tags": ["basketball", "big12", "optimization"],
      "timestamp": "2025-04-27T14:35:00Z"
    }
  ]
}
```

#### Store Experience

Store a new experience in the Intelligence Engine.

**URL:** `/api/intelligence-engine/experiences`  
**Method:** `POST`  
**Request Body:**
```json
{
  "agentId": "scheduling_director",
  "type": "schedule_generation",
  "content": {
    "sportType": "basketball",
    "conferenceId": "big12",
    "teamCount": 10,
    "constraintCount": 5,
    "outcome": "success",
    "metrics": {
      "travelDistance": 15000,
      "homeAwayBalance": 0.95,
      "constraintSatisfaction": 0.98
    }
  },
  "tags": ["basketball", "big12", "generation"]
}
```

**Response:**
```json
{
  "success": true,
  "experienceId": "exp_123458"
}
```

### Feedback

Submit feedback for a schedule.

**URL:** `/api/intelligence-engine/feedback`  
**Method:** `POST`  
**Request Body:**
```json
{
  "scheduleId": "sch_123456",
  "sportType": "basketball",
  "rating": 4.5,
  "comment": "Great schedule, but could use better rest periods between games.",
  "metrics": {
    "travelDistance": 0.8,
    "homeAwayBalance": 0.9,
    "restPeriods": 0.6,
    "venueUtilization": 0.85
  }
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "fb_123456"
}
```

### Recommendations

Get scheduling recommendations from the Intelligence Engine.

**URL:** `/api/intelligence-engine/recommendations`  
**Method:** `GET`  
**Query Parameters:**
- `sportType` (string, required): The sport type (e.g., "basketball", "football")
- `teamCount` (number, optional): Number of teams in the schedule
- `conferenceId` (string, optional): Conference ID (e.g., "big12")
- `phase` (string, optional): Phase of scheduling (e.g., "generation", "optimization")

**Response:**
```json
{
  "success": true,
  "recommendations": {
    "algorithm": "round_robin",
    "optimizationStrategy": "simulated_annealing",
    "constraintWeights": {
      "travel_distance": 0.8,
      "home_away_balance": 0.7,
      "rest_periods": 0.9,
      "venue_availability": 0.6
    },
    "parameters": {
      "maxIterations": 1000,
      "coolingRate": 0.95,
      "initialTemperature": 100
    }
  },
  "source": {
    "intelligenceEngine": true,
    "ml": false,
    "memory": true,
    "memoryCount": 15
  }
}
```

### Insights

Get insights from the Intelligence Engine.

**URL:** `/api/intelligence-engine/insights`  
**Method:** `GET`  
**Query Parameters:**
- `sportType` (string, required): The sport type (e.g., "basketball", "football")
- `conferenceId` (string, optional): Conference ID (e.g., "big12")
- `type` (string, optional, default: "scheduling"): Type of insights (e.g., "scheduling", "optimization", "feedback")

**Response:**
```json
{
  "success": true,
  "insights": {
    "sportType": "basketball",
    "conferenceId": "big12",
    "scheduleGeneration": {
      "recommendedAlgorithm": "round_robin",
      "averageQuality": 0.85,
      "commonIssues": [
        "Insufficient rest periods between games",
        "Excessive travel distances for certain teams"
      ]
    },
    "optimization": {
      "mostEffectiveStrategy": "simulated_annealing",
      "averageImprovement": {
        "travelDistance": 15.3,
        "homeAwayBalance": 8.2,
        "constraintSatisfaction": 12.5
      }
    },
    "feedback": {
      "averageRating": 4.2,
      "lowestRatedMetric": "restPeriods",
      "recommendedFocus": "rest_periods"
    }
  }
}
```

## Usage Examples

### Example 1: Generate a Schedule with Intelligence Engine Recommendations

```javascript
// 1. Get recommendations from Intelligence Engine
const response = await fetch('/api/intelligence-engine/recommendations?sportType=basketball&teamCount=10&conferenceId=big12');
const data = await response.json();

if (data.success) {
  const recommendations = data.recommendations;
  
  // 2. Use recommendations to generate schedule
  const scheduleResponse = await fetch('/api/schedules/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sportType: 'basketball',
      conferenceId: 'big12',
      teams: teams,
      constraints: constraints,
      algorithm: recommendations.algorithm,
      parameters: recommendations.parameters
    })
  });
  
  const scheduleData = await scheduleResponse.json();
  // Handle the generated schedule
}
```

### Example 2: Submit Feedback for a Schedule

```javascript
// Submit feedback for a schedule
const feedbackResponse = await fetch('/api/intelligence-engine/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    scheduleId: 'sch_123456',
    sportType: 'basketball',
    rating: 4.5,
    comment: 'Great schedule, but could use better rest periods between games.',
    metrics: {
      travelDistance: 0.8,
      homeAwayBalance: 0.9,
      restPeriods: 0.6,
      venueUtilization: 0.85
    }
  })
});

const feedbackData = await feedbackResponse.json();
// Handle the feedback response
```

### Example 3: Get Insights for a Conference

```javascript
// Get insights for a conference
const insightsResponse = await fetch('/api/intelligence-engine/insights?sportType=basketball&conferenceId=big12');
const insightsData = await insightsResponse.json();

if (insightsData.success) {
  const insights = insightsData.insights;
  
  // Use insights to display recommendations to users
  console.log(`Recommended algorithm: ${insights.scheduleGeneration.recommendedAlgorithm}`);
  console.log(`Common issues to address: ${insights.scheduleGeneration.commonIssues.join(', ')}`);
  console.log(`Focus area for improvement: ${insights.feedback.recommendedFocus}`);
}
```

## Error Handling

All API endpoints return a standard error format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing or invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error (server-side error)
