# Constraints API Reference

## Base URL

```
https://api.flextime.com/v2
```

## Authentication

All API requests require authentication using an API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.flextime.com/v2/constraints
```

## Endpoints

### Evaluate Constraints

#### Evaluate Single Slot

```http
POST /constraints/evaluate
```

Evaluates all applicable constraints for a single schedule slot.

**Request Body:**

```json
{
  "slot": {
    "id": "game-001",
    "date": "2025-09-06T00:00:00Z",
    "time": "14:00",
    "duration": 210,
    "venue": "Memorial Stadium",
    "sport": "football",
    "gameId": "fb-001",
    "homeTeam": "Kansas",
    "awayTeam": "K-State",
    "conference": "Big 12",
    "tvInfo": {
      "network": "ESPN",
      "startTime": "14:00",
      "duration": 210
    },
    "requiredResources": ["Field", "Lights", "TV Equipment"],
    "constraints": [] // Optional: specific constraint IDs
  },
  "options": {
    "includeDetails": true,
    "includeSuggestions": true,
    "maxSuggestions": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "slot": { /* original slot data */ },
    "overallValid": false,
    "overallScore": 0.75,
    "results": [
      {
        "constraintId": "venue-availability",
        "constraintName": "Venue Availability",
        "result": {
          "valid": true,
          "score": 1.0,
          "violations": [],
          "suggestions": []
        },
        "evaluationTime": 12,
        "cached": false
      },
      {
        "constraintId": "team-rest-days",
        "constraintName": "Team Rest Period",
        "result": {
          "valid": false,
          "score": 0.3,
          "violations": ["Kansas played 2 days ago (minimum 5 days required)"],
          "suggestions": [
            "Reschedule to September 13th or later",
            "Consider swapping home/away teams"
          ]
        },
        "evaluationTime": 25,
        "cached": false
      }
    ],
    "totalTime": 45,
    "metadata": {
      "evaluatedAt": "2025-01-15T10:30:00Z",
      "engineVersion": "2.5.0",
      "cacheHitRate": 0.5
    }
  }
}
```

**Status Codes:**

- `200 OK` - Evaluation completed successfully
- `400 Bad Request` - Invalid slot data
- `401 Unauthorized` - Invalid or missing API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error during evaluation

#### Evaluate Batch

```http
POST /constraints/evaluate-batch
```

Evaluates constraints for multiple schedule slots in parallel.

**Request Body:**

```json
{
  "slots": [
    { /* slot 1 */ },
    { /* slot 2 */ },
    { /* slot 3 */ }
  ],
  "options": {
    "parallel": true,
    "batchSize": 50,
    "continueOnError": true,
    "includeDetails": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "slotId": "game-001",
      "overallValid": true,
      "overallScore": 0.95,
      "violationCount": 0,
      "evaluationTime": 35
    },
    {
      "slotId": "game-002",
      "overallValid": false,
      "overallScore": 0.60,
      "violationCount": 2,
      "evaluationTime": 42
    }
  ],
  "summary": {
    "totalSlots": 3,
    "validSlots": 1,
    "invalidSlots": 2,
    "averageScore": 0.78,
    "totalTime": 125,
    "errors": []
  }
}
```

### Constraint Management

#### List Constraints

```http
GET /constraints
```

Returns a list of all available constraints.

**Query Parameters:**

- `sport` (string) - Filter by sport (e.g., "football", "basketball")
- `type` (string) - Filter by constraint type (e.g., "venue", "team", "broadcast")
- `priority` (string) - Filter by priority ("required", "high", "medium", "low")
- `active` (boolean) - Filter by active status
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 50, max: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "venue-availability",
      "type": "venue",
      "sport": "all",
      "name": "Venue Availability",
      "description": "Ensures venue is available and not double-booked",
      "priority": "required",
      "version": "2.1.0",
      "active": true,
      "metadata": {
        "author": "system",
        "tags": ["venue", "scheduling", "core"],
        "created": "2024-01-01T00:00:00Z",
        "updated": "2025-01-10T00:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  }
}
```

#### Get Constraint Details

```http
GET /constraints/{constraintId}
```

Returns detailed information about a specific constraint.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "team-rest-days",
    "type": "team",
    "sport": "football",
    "name": "Team Rest Period",
    "description": "Ensures teams have adequate rest between games",
    "priority": "high",
    "version": "2.0.0",
    "active": true,
    "configuration": {
      "minDaysBetweenGames": 5,
      "exceptions": ["bowl games", "playoffs"]
    },
    "dependencies": ["team-availability"],
    "metadata": {
      "author": "system",
      "tags": ["team", "health", "safety"],
      "created": "2024-01-01T00:00:00Z",
      "updated": "2025-01-10T00:00:00Z",
      "documentation": "https://docs.flextime.com/constraints/team-rest-days"
    },
    "statistics": {
      "totalEvaluations": 15420,
      "averageEvaluationTime": 18.5,
      "successRate": 0.82,
      "lastEvaluated": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### Create Custom Constraint

```http
POST /constraints
```

Creates a new custom constraint.

**Request Body:**

```json
{
  "id": "custom-venue-blackout",
  "type": "venue",
  "sport": "all",
  "name": "Venue Blackout Dates",
  "description": "Prevents scheduling on specific blackout dates",
  "priority": "required",
  "configuration": {
    "blackoutDates": [
      "2025-07-04",
      "2025-12-25"
    ],
    "venues": ["Stadium A", "Arena B"]
  },
  "evaluateFunction": "function(slot) { ... }", // Optional: custom evaluation logic
  "metadata": {
    "tags": ["venue", "blackout", "custom"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "custom-venue-blackout",
    "created": true,
    "version": "1.0.0",
    "active": true
  }
}
```

#### Update Constraint

```http
PUT /constraints/{constraintId}
```

Updates an existing constraint configuration.

**Request Body:**

```json
{
  "priority": "high",
  "configuration": {
    "minDaysBetweenGames": 6
  },
  "active": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "team-rest-days",
    "updated": true,
    "version": "2.0.1",
    "changes": ["priority", "configuration.minDaysBetweenGames"]
  }
}
```

#### Delete Constraint

```http
DELETE /constraints/{constraintId}
```

Deletes a custom constraint (system constraints cannot be deleted).

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "custom-venue-blackout",
    "deleted": true
  }
}
```

### Templates

#### List Templates

```http
GET /constraints/templates
```

Returns available constraint templates.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "venue_availability",
      "name": "Venue Availability Template",
      "description": "Standard venue availability constraint",
      "parameters": [
        {
          "name": "venueId",
          "type": "string",
          "required": true,
          "description": "Unique venue identifier"
        },
        {
          "name": "maintenanceWindows",
          "type": "array",
          "required": false,
          "description": "Regular maintenance windows"
        }
      ]
    }
  ]
}
```

#### Create from Template

```http
POST /constraints/from-template
```

Creates a new constraint from a template.

**Request Body:**

```json
{
  "templateId": "venue_availability",
  "parameters": {
    "venueId": "memorial-stadium",
    "sport": "football",
    "maintenanceWindows": [
      {
        "start": "06:00",
        "end": "08:00",
        "days": ["Monday", "Wednesday"]
      }
    ]
  },
  "metadata": {
    "tags": ["football", "venue", "kansas"]
  }
}
```

### Conflict Resolution

#### Detect Conflicts

```http
POST /constraints/conflicts/detect
```

Detects conflicts in a proposed schedule.

**Request Body:**

```json
{
  "slots": [
    { /* slot 1 */ },
    { /* slot 2 */ }
  ],
  "options": {
    "includeResolutions": true,
    "maxResolutionsPerConflict": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "id": "conflict-001",
        "type": "venue_overlap",
        "severity": "high",
        "affectedSlots": ["game-001", "game-002"],
        "description": "Stadium A is double-booked",
        "constraints": ["venue-availability"],
        "resolutions": [
          {
            "type": "reschedule",
            "targetSlot": "game-002",
            "suggestion": "Move to 19:00",
            "confidence": 0.95,
            "impact": "minimal"
          }
        ]
      }
    ],
    "summary": {
      "totalConflicts": 1,
      "bySeverity": {
        "high": 1,
        "medium": 0,
        "low": 0
      },
      "resolvable": 1,
      "unresolvable": 0
    }
  }
}
```

#### Resolve Conflicts

```http
POST /constraints/conflicts/resolve
```

Applies conflict resolutions to a schedule.

**Request Body:**

```json
{
  "conflicts": [
    {
      "conflictId": "conflict-001",
      "resolutionIndex": 0
    }
  ],
  "slots": [ /* current slots */ ],
  "options": {
    "validateAfterResolution": true,
    "allowPartialResolution": false
  }
}
```

### Performance and Monitoring

#### Get Performance Metrics

```http
GET /constraints/performance
```

Returns performance metrics for the constraint system.

**Query Parameters:**

- `period` (string) - Time period ("hour", "day", "week", "month")
- `constraintId` (string) - Filter by specific constraint

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "day",
    "metrics": {
      "totalEvaluations": 45320,
      "averageEvaluationTime": 38.5,
      "medianEvaluationTime": 32,
      "p95EvaluationTime": 125,
      "p99EvaluationTime": 285,
      "cacheHitRate": 0.72,
      "errorRate": 0.002,
      "throughput": {
        "evaluationsPerSecond": 52.4,
        "peakEvaluationsPerSecond": 125
      }
    },
    "constraintMetrics": [
      {
        "constraintId": "venue-availability",
        "evaluationCount": 12450,
        "averageTime": 15.2,
        "successRate": 0.94,
        "cacheHitRate": 0.85
      }
    ],
    "systemHealth": {
      "status": "healthy",
      "uptime": 8640000,
      "memoryUsage": 0.65,
      "cpuUsage": 0.42,
      "workerStatus": {
        "active": 4,
        "idle": 0,
        "total": 4
      }
    }
  }
}
```

#### Health Check

```http
GET /constraints/health
```

Returns the health status of the constraint system.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "2.5.0",
    "components": {
      "engine": "healthy",
      "cache": "healthy",
      "workers": "healthy",
      "database": "healthy"
    },
    "metrics": {
      "uptime": 8640000,
      "requestsPerMinute": 3142,
      "averageResponseTime": 45
    }
  }
}
```

## Rate Limiting

API requests are rate limited based on your subscription tier:

| Tier | Requests/Hour | Burst Limit | Concurrent Requests |
|------|---------------|-------------|--------------------|
| Free | 1,000 | 50 | 5 |
| Basic | 10,000 | 200 | 20 |
| Pro | 100,000 | 1,000 | 50 |
| Enterprise | Unlimited | Custom | Custom |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9875
X-RateLimit-Reset: 1642329600
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "CONSTRAINT_NOT_FOUND",
    "message": "Constraint with ID 'invalid-id' not found",
    "details": {
      "constraintId": "invalid-id",
      "availableConstraints": ["venue-availability", "team-rest-days"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_REQUEST` | Request validation failed | 400 |
| `UNAUTHORIZED` | Invalid or missing API key | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `CONSTRAINT_NOT_FOUND` | Constraint ID not found | 404 |
| `CONFLICT_UNRESOLVABLE` | Cannot resolve scheduling conflict | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

## Webhooks

### Configure Webhooks

```http
POST /constraints/webhooks
```

Configure webhooks for constraint events.

**Request Body:**

```json
{
  "url": "https://your-app.com/webhooks/constraints",
  "events": [
    "constraint.evaluation.failed",
    "constraint.performance.degraded",
    "conflict.detected"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Event Format

```json
{
  "id": "evt_123456789",
  "type": "constraint.evaluation.failed",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "constraintId": "venue-availability",
    "slotId": "game-001",
    "error": "Database connection timeout",
    "context": {
      "sport": "football",
      "venue": "Memorial Stadium"
    }
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ConstraintClient } from '@flextime/constraints-sdk';

const client = new ConstraintClient({
  apiKey: process.env.FLEXTIME_API_KEY,
  baseURL: 'https://api.flextime.com/v2'
});

// Evaluate a slot
const result = await client.constraints.evaluate({
  slot: {
    id: 'game-001',
    date: new Date('2025-09-06'),
    time: '14:00',
    duration: 210,
    venue: 'Memorial Stadium',
    sport: 'football',
    homeTeam: 'Kansas',
    awayTeam: 'K-State'
  }
});

console.log(`Valid: ${result.overallValid}`);
console.log(`Score: ${result.overallScore}`);
```

### Python

```python
from flextime import ConstraintClient
from datetime import datetime

client = ConstraintClient(
    api_key=os.environ['FLEXTIME_API_KEY'],
    base_url='https://api.flextime.com/v2'
)

# Evaluate a slot
result = client.constraints.evaluate(
    slot={
        'id': 'game-001',
        'date': datetime(2025, 9, 6),
        'time': '14:00',
        'duration': 210,
        'venue': 'Memorial Stadium',
        'sport': 'football',
        'homeTeam': 'Kansas',
        'awayTeam': 'K-State'
    }
)

print(f"Valid: {result.overall_valid}")
print(f"Score: {result.overall_score}")
```

### cURL

```bash
curl -X POST https://api.flextime.com/v2/constraints/evaluate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slot": {
      "id": "game-001",
      "date": "2025-09-06T00:00:00Z",
      "time": "14:00",
      "duration": 210,
      "venue": "Memorial Stadium",
      "sport": "football",
      "homeTeam": "Kansas",
      "awayTeam": "K-State"
    }
  }'
```