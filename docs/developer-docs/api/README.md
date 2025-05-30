# FlexTime REST API Reference

The FlexTime REST API provides programmatic access to all scheduling functionality. This comprehensive reference covers all endpoints, request/response formats, and integration patterns.

## 🌐 API Overview

### Base URLs
```
Production:  https://api.flextime.big12.org/v1
Sandbox:     https://sandbox-api.flextime.big12.org/v1
```

### API Versioning
```http
X-API-Version: 2025-05-29
```

### Content Types
```http
Content-Type: application/json
Accept: application/json
```

## 🔐 Authentication

All API requests require authentication using JWT tokens:

```http
Authorization: Bearer your-jwt-token
```

### Getting Access Tokens
```http
POST /auth/token
Content-Type: application/json

{
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "grant_type": "client_credentials"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "schedules:read schedules:write teams:read"
}
```

## 📋 Core Resources

### Schedules

#### List Schedules
```http
GET /schedules
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sport` | string | Filter by sport |
| `season` | string | Filter by season |
| `status` | string | Filter by status |
| `limit` | integer | Number of results (max 100) |
| `cursor` | string | Pagination cursor |

**Example Request:**
```bash
curl -X GET "https://api.flextime.big12.org/v1/schedules?sport=basketball&limit=10" \
  -H "Authorization: Bearer your-token"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "sched_123",
      "name": "2025 Basketball Regular Season",
      "sport": "basketball",
      "season": "2025-26",
      "status": "active",
      "created_at": "2025-05-29T10:00:00Z",
      "updated_at": "2025-05-29T10:30:00Z",
      "games_count": 144,
      "teams_count": 16,
      "optimization_score": 0.95
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6InNjaGVkXzEyMyJ9",
    "total_count": 45
  }
}
```

#### Create Schedule
```http
POST /schedules
```

**Request Body:**
```json
{
  "name": "2025 Basketball Regular Season",
  "sport": "basketball",
  "season": "2025-26",
  "teams": ["kansas", "kansas-state", "baylor", "tcu"],
  "constraints": {
    "games_per_team": 18,
    "home_away_balance": true,
    "min_rest_days": 1,
    "max_travel_distance": 500,
    "blackout_dates": ["2025-12-25", "2025-01-01"]
  },
  "optimization_goals": {
    "minimize_travel": 0.8,
    "maximize_balance": 0.9,
    "respect_constraints": 1.0
  }
}
```

**Response:**
```json
{
  "id": "sched_124",
  "name": "2025 Basketball Regular Season",
  "sport": "basketball",
  "season": "2025-26",
  "status": "generating",
  "progress": 0,
  "estimated_completion": "2025-05-29T10:35:00Z",
  "created_at": "2025-05-29T10:30:00Z"
}
```

#### Get Schedule
```http
GET /schedules/{schedule_id}
```

**Response:**
```json
{
  "id": "sched_123",
  "name": "2025 Basketball Regular Season",
  "sport": "basketball",
  "season": "2025-26",
  "status": "active",
  "created_at": "2025-05-29T10:00:00Z",
  "updated_at": "2025-05-29T10:30:00Z",
  "games": [
    {
      "id": "game_456",
      "home_team": "kansas",
      "away_team": "kansas-state",
      "venue": "allen-fieldhouse",
      "date": "2025-11-15",
      "time": "19:00:00",
      "tv_window": "prime",
      "rivalry": true
    }
  ],
  "metadata": {
    "games_count": 144,
    "teams_count": 16,
    "total_travel_distance": 12500,
    "optimization_score": 0.95,
    "constraint_violations": 0
  }
}
```

### Teams

#### List Teams
```http
GET /teams
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `conference` | string | Filter by conference |
| `sport` | string | Filter by sport |
| `active` | boolean | Filter by active status |

**Example Response:**
```json
{
  "data": [
    {
      "id": "kansas",
      "name": "University of Kansas",
      "short_name": "Kansas",
      "code": "KU",
      "conference": "big12",
      "location": {
        "city": "Lawrence",
        "state": "Kansas",
        "latitude": 38.9717,
        "longitude": -95.2353
      },
      "venues": {
        "basketball": "allen-fieldhouse",
        "football": "memorial-stadium"
      },
      "sports": ["basketball", "football", "baseball", "softball"]
    }
  ]
}
```

#### Create Team
```http
POST /teams
```

**Request Body:**
```json
{
  "name": "University of Example",
  "short_name": "Example",
  "code": "EX",
  "conference": "big12",
  "location": {
    "city": "Example City",
    "state": "Texas",
    "latitude": 32.7767,
    "longitude": -96.7970
  },
  "sports": ["basketball", "football"]
}
```

### Venues

#### List Venues
```http
GET /venues
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "allen-fieldhouse",
      "name": "Allen Fieldhouse",
      "team": "kansas",
      "sport": "basketball",
      "capacity": 16300,
      "location": {
        "address": "1651 Naismith Dr, Lawrence, KS 66045",
        "latitude": 38.9539,
        "longitude": -95.2525
      },
      "amenities": ["video_board", "premium_seating", "parking"],
      "availability": {
        "blackout_dates": ["2025-12-25", "2025-01-01"],
        "maintenance_windows": [
          {
            "start": "2025-06-01",
            "end": "2025-08-15",
            "reason": "court_renovation"
          }
        ]
      }
    }
  ]
}
```

### Games

#### List Games
```http
GET /games
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `schedule_id` | string | Filter by schedule |
| `team` | string | Filter by team |
| `date_from` | string | Start date (YYYY-MM-DD) |
| `date_to` | string | End date (YYYY-MM-DD) |
| `venue` | string | Filter by venue |

#### Create Game
```http
POST /games
```

**Request Body:**
```json
{
  "schedule_id": "sched_123",
  "home_team": "kansas",
  "away_team": "kansas-state",
  "venue": "allen-fieldhouse",
  "date": "2025-11-15",
  "time": "19:00:00",
  "metadata": {
    "tv_window": "prime",
    "rivalry": true,
    "conference_game": true
  }
}
```

### Constraints

#### List Constraints
```http
GET /constraints
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "const_789",
      "type": "venue_blackout",
      "schedule_id": "sched_123",
      "priority": "high",
      "parameters": {
        "venue_id": "allen-fieldhouse",
        "blackout_dates": ["2025-12-25", "2025-01-01"],
        "reason": "holiday_closure"
      },
      "active": true,
      "created_at": "2025-05-29T10:00:00Z"
    }
  ]
}
```

#### Create Constraint
```http
POST /constraints
```

**Request Body:**
```json
{
  "type": "travel_distance",
  "schedule_id": "sched_123",
  "priority": "medium",
  "parameters": {
    "max_distance": 500,
    "unit": "miles",
    "applies_to": ["regular_season"]
  },
  "description": "Limit travel distance for regular season games"
}
```

## 🔧 Advanced Operations

### Schedule Optimization
```http
POST /schedules/{schedule_id}/optimize
```

**Request Body:**
```json
{
  "goals": {
    "minimize_travel": 0.8,
    "maximize_balance": 0.9,
    "respect_constraints": 1.0
  },
  "constraints_to_relax": ["travel_distance"],
  "max_iterations": 1000
}
```

### Bulk Operations
```http
POST /bulk/games
```

**Request Body:**
```json
{
  "operations": [
    {
      "action": "create",
      "data": {
        "schedule_id": "sched_123",
        "home_team": "kansas",
        "away_team": "baylor"
      }
    },
    {
      "action": "update",
      "id": "game_456",
      "data": {
        "date": "2025-11-16"
      }
    }
  ]
}
```

### Export Operations
```http
POST /schedules/{schedule_id}/export
```

**Request Body:**
```json
{
  "format": "xlsx",
  "options": {
    "include_metadata": true,
    "timezone": "America/Chicago",
    "template": "big12_standard"
  }
}
```

**Response:**
```json
{
  "export_id": "exp_789",
  "status": "processing",
  "download_url": null,
  "estimated_completion": "2025-05-29T10:35:00Z"
}
```

## 📊 Analytics Endpoints

### Schedule Analytics
```http
GET /schedules/{schedule_id}/analytics
```

**Response:**
```json
{
  "travel_metrics": {
    "total_distance": 12500,
    "average_per_team": 781.25,
    "cost_estimate": 45000
  },
  "balance_metrics": {
    "home_away_ratio": 0.98,
    "strength_of_schedule_variance": 0.15
  },
  "constraint_compliance": {
    "violations": 0,
    "warnings": 2,
    "compliance_rate": 1.0
  }
}
```

### Performance Metrics
```http
GET /analytics/performance
```

**Response:**
```json
{
  "api_performance": {
    "average_response_time": 150,
    "success_rate": 99.8,
    "rate_limit_usage": 45
  },
  "schedule_generation": {
    "average_time": 45,
    "success_rate": 98.5,
    "optimization_improvement": 0.25
  }
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "CONSTRAINT_VIOLATION",
    "message": "Schedule violates travel distance constraint",
    "details": {
      "constraint_id": "const_789",
      "violations": [
        {
          "game_id": "game_456",
          "distance": 650,
          "limit": 500
        }
      ]
    },
    "request_id": "req_abc123"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONSTRAINT_VIOLATION` | 422 | Schedule constraint violation |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

## 🔄 Webhooks

### Configure Webhooks
```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/flextime",
  "events": [
    "schedule.created",
    "schedule.updated",
    "game.created",
    "constraint.violated"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Event Format
```json
{
  "id": "evt_123",
  "event": "schedule.optimized",
  "timestamp": "2025-05-29T10:30:00Z",
  "data": {
    "schedule_id": "sched_123",
    "optimization_score": 0.95,
    "improvements": {
      "travel_reduction": "15%",
      "conflict_resolution": 3
    }
  },
  "metadata": {
    "api_version": "2025-05-29",
    "request_id": "req_abc123"
  }
}
```

## 📈 Rate Limiting

### Limits by Resource
| Resource | Limit | Window |
|----------|-------|--------|
| **GET /schedules** | 1000 | 1 hour |
| **POST /schedules** | 10 | 1 hour |
| **GET /games** | 5000 | 1 hour |
| **POST /games** | 100 | 1 hour |
| **POST /optimize** | 5 | 1 hour |

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

## 🧪 Testing

### Sandbox Environment
The sandbox environment provides a safe testing space with:
- Isolated data that doesn't affect production
- Faster processing times
- Additional debug information
- Test data generators

### Test Data Generation
```http
POST /test/generate
```

**Request Body:**
```json
{
  "type": "schedule",
  "parameters": {
    "teams": 8,
    "games_per_team": 14,
    "season_length": 120
  }
}
```

## 📚 Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.flextime.big12.org/v1',
  headers: {
    'Authorization': `Bearer ${process.env.FLEXTIME_TOKEN}`,
    'X-API-Version': '2025-05-29'
  }
});

// Create a schedule
async function createSchedule(scheduleData) {
  try {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  } catch (error) {
    console.error('Error creating schedule:', error.response.data);
    throw error;
  }
}
```

### Python
```python
import requests
import os

class FlexTimeAPI:
    def __init__(self):
        self.base_url = 'https://api.flextime.big12.org/v1'
        self.headers = {
            'Authorization': f'Bearer {os.environ["FLEXTIME_TOKEN"]}',
            'X-API-Version': '2025-05-29',
            'Content-Type': 'application/json'
        }
    
    def create_schedule(self, schedule_data):
        response = requests.post(
            f'{self.base_url}/schedules',
            json=schedule_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
```

### cURL
```bash
# Create a schedule
curl -X POST https://api.flextime.big12.org/v1/schedules \
  -H "Authorization: Bearer $FLEXTIME_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-API-Version: 2025-05-29" \
  -d '{
    "name": "Test Schedule",
    "sport": "basketball",
    "teams": ["kansas", "kansas-state"]
  }'
```

---

*API Reference is updated continuously. For the latest changes, see our [Changelog](./changelog.md).*

*Last updated: May 29, 2025*