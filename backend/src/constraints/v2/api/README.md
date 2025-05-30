# Constraint Management API v2

A complete REST API for managing scheduling constraints in the FlexTime system.

## Features

- **Full CRUD Operations**: Create, read, update, and delete constraints
- **Bulk Operations**: Handle multiple constraints in a single request
- **Schedule Evaluation**: Evaluate constraints against proposed schedules
- **Template System**: Create constraints from pre-defined templates
- **Import/Export**: Backup and restore constraint configurations
- **Authentication**: JWT and API key authentication
- **Rate Limiting**: Prevent API abuse with configurable limits
- **Response Caching**: Improve performance with intelligent caching
- **Real-time Monitoring**: Track API performance and usage

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build:api
# or
./build.sh

# The API is now ready to be integrated
```

## Integration

### With Express Backend

```javascript
const { registerConstraintAPI } = require('./dist/expressIntegration');

// In your Express app
registerConstraintAPI(app, '/api/v2/constraints');
```

### Standalone Server

```javascript
const { createStandaloneApp } = require('./dist/expressIntegration');

const app = createStandaloneApp();
app.listen(3000, () => {
  console.log('Constraint API running on port 3000');
});
```

## API Endpoints

### Authentication

All endpoints require authentication via either:
- JWT Bearer token: `Authorization: Bearer <token>`
- API Key: `X-API-Key: <key>`

### Constraint Operations

#### Get All Constraints
```http
GET /api/v2/constraints?page=1&limit=20&sortBy=name&sortOrder=asc
```

#### Get Constraint by ID
```http
GET /api/v2/constraints/:id
```

#### Get Constraints by Type
```http
GET /api/v2/constraints/type/:type
```

#### Get Constraints by Sport
```http
GET /api/v2/constraints/sport/:sport
```

#### Create Constraint
```http
POST /api/v2/constraints
Content-Type: application/json

{
  "name": "Home Game Minimum",
  "type": "gameCount",
  "hardness": "soft",
  "weight": 80,
  "scope": {
    "sports": ["Football", "Basketball"],
    "teams": ["Team1", "Team2"]
  },
  "parameters": {
    "minHomeGames": 5,
    "maxHomeGames": 7
  }
}
```

#### Update Constraint
```http
PUT /api/v2/constraints/:id
Content-Type: application/json

{
  "weight": 90,
  "parameters": {
    "minHomeGames": 6
  }
}
```

#### Delete Constraint
```http
DELETE /api/v2/constraints/:id
```

### Schedule Evaluation

#### Evaluate Schedule
```http
POST /api/v2/constraints/evaluate
Content-Type: application/json

{
  "schedule": {
    "games": [
      {
        "id": "game1",
        "homeTeam": "Team1",
        "awayTeam": "Team2",
        "date": "2024-09-15T19:00:00Z",
        "venue": "Stadium1",
        "sport": "Football"
      }
    ]
  },
  "constraintIds": ["constraint1", "constraint2"]
}
```

### Bulk Operations

#### Bulk Create
```http
POST /api/v2/constraints/bulk
Content-Type: application/json

{
  "constraints": [
    { ... },
    { ... }
  ]
}
```

#### Bulk Update
```http
PUT /api/v2/constraints/bulk
Content-Type: application/json

{
  "updates": [
    { "id": "constraint1", "weight": 90 },
    { "id": "constraint2", "weight": 85 }
  ]
}
```

#### Bulk Delete
```http
DELETE /api/v2/constraints/bulk
Content-Type: application/json

{
  "ids": ["constraint1", "constraint2", "constraint3"]
}
```

### Templates

#### Get Templates
```http
GET /api/v2/constraints/templates
```

#### Create from Template
```http
POST /api/v2/constraints/from-template
Content-Type: application/json

{
  "templateId": "balanced-home-away",
  "parameters": {
    "sport": "Basketball",
    "conference": "Big12"
  }
}
```

### Import/Export

#### Export Constraints
```http
GET /api/v2/constraints/export?format=json&ids=constraint1,constraint2
```

#### Import Constraints
```http
POST /api/v2/constraints/import
Content-Type: application/json

{
  "constraints": [ ... ],
  "mode": "merge" // or "replace" or "skip"
}
```

## Response Format

All responses follow a standardized format:

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "2.0",
    "requestId": "req_1234567890"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "weight",
        "message": "Weight must be between 0 and 100"
      }
    ]
  }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "links": {
    "self": "/api/v2/constraints?page=1&limit=20",
    "next": "/api/v2/constraints?page=2&limit=20",
    "first": "/api/v2/constraints?page=1&limit=20",
    "last": "/api/v2/constraints?page=8&limit=20"
  }
}
```

## Rate Limits

- Default: 100 requests per minute
- Evaluation endpoints: 20 requests per minute
- Bulk operations: 10 requests per minute
- Import operations: 5 requests per minute

## Permissions

The API uses role-based access control with the following permissions:

- `constraint:read` - View constraints
- `constraint:create` - Create new constraints
- `constraint:update` - Modify existing constraints
- `constraint:delete` - Remove constraints
- `constraint:evaluate` - Evaluate schedules
- `constraint:bulk` - Perform bulk operations
- `constraint:import` - Import constraints
- `constraint:export` - Export constraints
- `template:read` - View templates
- `template:use` - Create from templates

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build:api
```

## Architecture

The API is built with:
- **Express.js** - Web framework
- **TypeScript** - Type safety and better developer experience
- **Express Validator** - Input validation
- **JWT** - Authentication
- **Helmet** - Security headers
- **Compression** - Response compression
- **CORS** - Cross-origin resource sharing

## Security

- All inputs are validated and sanitized
- JWT tokens expire after 24 hours
- API keys are hashed before storage
- Rate limiting prevents abuse
- Security headers via Helmet
- CORS configured for allowed origins only

## Performance

- Response caching for GET requests
- Efficient pagination for large datasets
- Parallel constraint evaluation
- Response compression
- Performance monitoring with alerts

## Error Handling

The API provides detailed error messages with:
- Specific error codes
- Field-level validation errors
- Suggested fixes when applicable
- Request tracking via trace IDs

## Monitoring

The API includes built-in monitoring for:
- Request/response times
- Error rates
- Constraint evaluation performance
- Cache hit rates
- Rate limit violations

## Support

For issues or questions:
1. Check the API documentation at `/api/v2/constraints/docs`
2. Review error messages and codes
3. Contact the FlexTime development team