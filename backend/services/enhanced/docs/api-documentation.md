# API Documentation - FlexTime Enhanced Backend Services

## 🚀 API Overview

The FlexTime Enhanced Backend Services provide a comprehensive RESTful API for advanced scheduling operations, real-time collaboration, and performance monitoring.

**Base URL**: `http://localhost:3005/api/enhanced`
**API Version**: v2.0
**Content-Type**: `application/json`

## 🔐 Authentication

All API endpoints require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Client-Version: 2.0.0
```

### Authentication Flow
```javascript
// Login to get JWT token
POST /api/auth/login
{
  "username": "user@example.com",
  "password": "password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-01T00:00:00Z",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## 📊 FT Builder Engine API

### Create Schedule Builder Session

**Endpoint**: `POST /api/enhanced/builder/session`

**Description**: Initialize a new schedule builder session with enhanced capabilities.

**Request Body**:
```javascript
{
  "sessionConfig": {
    "sport": "basketball",
    "season": "2024-2025",
    "conference": "big12",
    "teams": ["kansas", "baylor", "texas_tech"],
    "constraints": {
      "maxGamesPerWeek": 3,
      "minRestDays": 2,
      "travelOptimization": true
    },
    "collaborationMode": true,
    "performanceMode": "high"
  }
}
```

**Response**:
```javascript
{
  "sessionId": "session_abc123",
  "status": "active",
  "capabilities": {
    "multiThreading": true,
    "mlWeighting": true,
    "realTimeCollaboration": true,
    "advancedCaching": true
  },
  "performance": {
    "workerThreads": 8,
    "cacheSize": 50000,
    "memoryLimit": "500MB"
  },
  "created": "2024-01-01T00:00:00Z"
}
```

### Update Schedule

**Endpoint**: `PUT /api/enhanced/builder/session/{sessionId}/schedule`

**Description**: Update schedule with real-time constraint validation and conflict resolution.

**Request Body**:
```javascript
{
  "operation": {
    "type": "move_game",
    "gameId": "game_123",
    "fromDate": "2024-01-15",
    "toDate": "2024-01-20",
    "fromTime": "19:00",
    "toTime": "15:00"
  },
  "clientId": "client_456",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response**:
```javascript
{
  "success": true,
  "operationId": "op_789",
  "conflicts": [],
  "warnings": [
    {
      "type": "travel_concern",
      "message": "High travel load for Kansas State",
      "severity": "medium"
    }
  ],
  "performance": {
    "evaluationTime": "45ms",
    "cacheHit": true,
    "threadsUsed": 3
  },
  "transformedOperations": [
    {
      "clientId": "client_789",
      "operation": {
        "type": "move_game",
        "gameId": "game_123",
        "toDate": "2024-01-20",
        "toTime": "15:00"
      }
    }
  ]
}
```

### Validate Constraints

**Endpoint**: `POST /api/enhanced/builder/session/{sessionId}/validate`

**Description**: Perform comprehensive constraint validation with ML-enhanced weighting.

**Request Body**:
```javascript
{
  "scope": "full", // "full", "partial", "game"
  "gameIds": ["game_123", "game_456"], // optional for partial scope
  "constraints": [
    "rest_days",
    "travel_optimization",
    "venue_availability",
    "championship_dates"
  ]
}
```

**Response**:
```javascript
{
  "validationId": "val_abc123",
  "overallScore": 8.7,
  "constraintResults": {
    "rest_days": {
      "score": 9.2,
      "violations": 0,
      "warnings": 2,
      "weight": 0.25
    },
    "travel_optimization": {
      "score": 8.1,
      "violations": 1,
      "warnings": 5,
      "weight": 0.30,
      "details": {
        "totalMiles": 15420,
        "avgTravelTime": "2.3 hours",
        "backToBackAway": 1
      }
    }
  },
  "recommendations": [
    {
      "type": "swap_games",
      "confidence": 0.85,
      "impact": "+0.3 score",
      "games": ["game_123", "game_456"]
    }
  ],
  "performance": {
    "evaluationTime": "125ms",
    "mlInferenceTime": "23ms",
    "threadsUsed": 6
  }
}
```

## 📈 Performance Monitoring API

### Get System Metrics

**Endpoint**: `GET /api/enhanced/monitoring/metrics`

**Description**: Retrieve real-time system performance metrics.

**Query Parameters**:
- `timeRange`: Time range for metrics (1h, 6h, 24h, 7d)
- `metrics`: Comma-separated list of specific metrics
- `granularity`: Data point granularity (1m, 5m, 15m, 1h)

**Response**:
```javascript
{
  "timestamp": "2024-01-01T00:00:00Z",
  "timeRange": "1h",
  "metrics": {
    "system": {
      "cpuUsage": 45.2,
      "memoryUsage": 67.8,
      "heapUsed": "312MB",
      "heapTotal": "450MB"
    },
    "application": {
      "activeWorkers": 6,
      "cacheHitRate": 94.5,
      "avgResponseTime": "78ms",
      "requestsPerSecond": 1250
    },
    "database": {
      "connectionPoolUsage": 23,
      "avgQueryTime": "15ms",
      "slowQueries": 2
    }
  },
  "alerts": [
    {
      "level": "warning",
      "metric": "memory_usage",
      "threshold": 70,
      "current": 67.8,
      "message": "Memory usage approaching threshold"
    }
  ]
}
```

### Performance Analysis

**Endpoint**: `POST /api/enhanced/monitoring/analyze`

**Description**: Generate performance analysis and optimization recommendations.

**Request Body**:
```javascript
{
  "analysisType": "performance", // "performance", "bottleneck", "capacity"
  "timeRange": "24h",
  "components": ["builder", "cache", "database", "workers"]
}
```

**Response**:
```javascript
{
  "analysisId": "analysis_123",
  "summary": {
    "overallHealth": "good",
    "performance": 8.4,
    "bottlenecks": 2,
    "recommendations": 5
  },
  "components": {
    "builder": {
      "health": "excellent",
      "avgResponseTime": "67ms",
      "throughput": "1450 ops/sec",
      "recommendations": []
    },
    "cache": {
      "health": "good",
      "hitRate": 94.5,
      "missRate": 5.5,
      "recommendations": [
        {
          "type": "cache_warming",
          "priority": "medium",
          "description": "Pre-warm constraint evaluation cache"
        }
      ]
    }
  },
  "optimizations": [
    {
      "component": "worker_pool",
      "action": "increase_workers",
      "currentValue": 6,
      "recommendedValue": 8,
      "expectedImprovement": "15% throughput increase"
    }
  ]
}
```

## 🤝 Collaboration API

### Join Collaboration Session

**Endpoint**: `POST /api/enhanced/collaboration/session/{sessionId}/join`

**Description**: Join a real-time collaboration session.

**Request Body**:
```javascript
{
  "userId": "user_123",
  "clientId": "client_456",
  "capabilities": {
    "webSocket": true,
    "operationalTransform": true,
    "presence": true
  }
}
```

**Response**:
```javascript
{
  "collaborationId": "collab_789",
  "currentState": {
    "version": 42,
    "participants": [
      {
        "userId": "user_456",
        "username": "john.doe",
        "cursor": { "gameId": "game_123" },
        "lastActivity": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "webSocketUrl": "ws://localhost:3005/ws/collaboration/collab_789",
  "syncToken": "sync_abc123"
}
```

### WebSocket Events

**Connection**: `ws://localhost:3005/ws/collaboration/{collaborationId}`

**Authentication**: Send JWT token in first message

#### Incoming Events
```javascript
// User operation
{
  "type": "operation",
  "operation": {
    "type": "move_game",
    "gameId": "game_123",
    "toDate": "2024-01-20"
  },
  "userId": "user_456",
  "timestamp": "2024-01-01T00:00:00Z"
}

// Cursor update
{
  "type": "cursor",
  "userId": "user_456",
  "cursor": {
    "gameId": "game_123",
    "position": { "x": 150, "y": 200 }
  }
}
```

#### Outgoing Events
```javascript
// Transformed operation
{
  "type": "operation_result",
  "operationId": "op_789",
  "success": true,
  "transformedOperation": {
    "type": "move_game",
    "gameId": "game_123",
    "toDate": "2024-01-20"
  },
  "conflicts": []
}

// User presence
{
  "type": "presence_update",
  "participants": [
    {
      "userId": "user_456",
      "username": "john.doe",
      "status": "active",
      "cursor": { "gameId": "game_123" }
    }
  ]
}
```

## 🧠 Machine Learning API

### Constraint Weight Optimization

**Endpoint**: `POST /api/enhanced/ml/optimize-weights`

**Description**: Use ML to optimize constraint weights based on historical data.

**Request Body**:
```javascript
{
  "sport": "basketball",
  "season": "2024-2025",
  "trainingData": {
    "schedules": ["schedule_123", "schedule_456"],
    "feedbackData": true,
    "performanceMetrics": true
  },
  "constraints": [
    "rest_days",
    "travel_optimization",
    "venue_availability"
  ]
}
```

**Response**:
```javascript
{
  "optimizationId": "opt_123",
  "weights": {
    "rest_days": 0.28,
    "travel_optimization": 0.35,
    "venue_availability": 0.22,
    "championship_dates": 0.15
  },
  "confidence": 0.87,
  "performance": {
    "trainingAccuracy": 0.92,
    "validationScore": 8.6,
    "improvement": "+12% over default weights"
  },
  "recommendations": [
    {
      "constraint": "travel_optimization",
      "reason": "High impact on overall schedule quality",
      "weight_change": "+0.05"
    }
  ]
}
```

## 🔧 Configuration API

### Update Engine Configuration

**Endpoint**: `PUT /api/enhanced/config/engine`

**Description**: Update engine configuration for performance tuning.

**Request Body**:
```javascript
{
  "performance": {
    "maxWorkerThreads": 10,
    "cacheSize": 75000,
    "cacheTTL": 600000,
    "memoryLimit": "750MB"
  },
  "features": {
    "useMultiThreading": true,
    "useMLWeighting": true,
    "useAdvancedCaching": true,
    "realTimeCollaboration": true
  },
  "algorithms": {
    "constraintEvaluator": "enhanced_v2",
    "conflictResolver": "ml_assisted",
    "cacheStrategy": "intelligent_lru"
  }
}
```

**Response**:
```javascript
{
  "configId": "config_123",
  "applied": true,
  "restartRequired": false,
  "validation": {
    "valid": true,
    "warnings": [
      {
        "setting": "maxWorkerThreads",
        "message": "High worker count may impact memory usage"
      }
    ]
  },
  "impact": {
    "performance": "+8% expected improvement",
    "memory": "+50MB estimated increase",
    "features": ["Enhanced caching enabled"]
  }
}
```

## 📝 Error Handling

### Error Response Format
```javascript
{
  "error": {
    "code": "CONSTRAINT_VIOLATION",
    "message": "Game scheduling violates rest day constraints",
    "details": {
      "constraint": "min_rest_days",
      "violation": "Only 1 day rest between games",
      "required": "2 days minimum"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}
```

### Common Error Codes
- `INVALID_SESSION`: Session not found or expired
- `CONSTRAINT_VIOLATION`: Operation violates scheduling constraints
- `PERFORMANCE_LIMIT`: System performance limits exceeded
- `COLLABORATION_CONFLICT`: Concurrent editing conflict
- `ML_SERVICE_ERROR`: Machine learning service unavailable
- `CACHE_ERROR`: Caching system failure

## 📊 Rate Limiting

### Limits by Endpoint Category
- **Builder Operations**: 1000 requests/minute
- **Monitoring**: 500 requests/minute
- **Collaboration**: 5000 messages/minute
- **ML Services**: 100 requests/minute
- **Configuration**: 50 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1640995200
```

## 🔍 Request Examples

### Complete Schedule Building Flow
```javascript
// 1. Create session
const session = await fetch('/api/enhanced/builder/session', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    sessionConfig: {
      sport: 'basketball',
      teams: ['kansas', 'baylor'],
      collaborationMode: true
    }
  })
});

// 2. Join collaboration
const collaboration = await fetch(`/api/enhanced/collaboration/session/${sessionId}/join`, {
  method: 'POST',
  body: JSON.stringify({ userId: 'user_123' })
});

// 3. Update schedule
const update = await fetch(`/api/enhanced/builder/session/${sessionId}/schedule`, {
  method: 'PUT',
  body: JSON.stringify({
    operation: {
      type: 'move_game',
      gameId: 'game_123',
      toDate: '2024-01-20'
    }
  })
});

// 4. Validate constraints
const validation = await fetch(`/api/enhanced/builder/session/${sessionId}/validate`, {
  method: 'POST',
  body: JSON.stringify({ scope: 'full' })
});
```