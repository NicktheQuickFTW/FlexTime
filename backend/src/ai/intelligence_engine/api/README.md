# Intelligence Engine API

This directory contains the API components of the FlexTime Intelligence Engine, providing RESTful endpoints for accessing the system's functionality.

## API Overview

The API is built using Flask and provides endpoints for interacting with the Intelligence Engine's core features:

- Agent system interaction
- Task management
- Optimization services
- Machine learning components
- Feedback and experience collection

## Core Components

### Main Application (`app.py`)

The main Flask application that sets up the server, routes, and integrates all components.

### Machine Learning Routes (`ml_routes.py`)

API endpoints for the machine learning components:

- Pattern extraction
- Model management
- Predictions (game outcomes, schedule quality, team performance)
- Parameter recommendations

## API Endpoints

### System Status

- `GET /api/status` - Get the status and capabilities of the Intelligence Engine

### Agent System

- `GET /api/agents` - List all available agents
- `GET /api/agents/directors` - List all director agents
- `POST /api/agents/directors/<director_type>/tasks` - Create a task for a director agent

### Task Management

- `POST /api/agents/tasks` - Submit a task to the Intelligence Engine
- `GET /api/agents/tasks/<task_id>` - Get the status of a task
- `GET /api/agents/tasks/<task_id>/result` - Get the result of a completed task

### Optimization

- `GET /api/optimization/algorithms` - Get available optimization algorithms
- `POST /api/optimization/schedule` - Optimize a schedule

### Feedback and Experiences

- `POST /api/feedback` - Store feedback data
- `POST /api/experiences` - Store experience data

### Recommendations

- `GET /api/recommendations/scheduling` - Get scheduling recommendations
- `GET /api/recommendations/learning` - Get learning recommendations

### Machine Learning

- `GET /api/ml/models` - List all available ML models
- `POST /api/ml/patterns` - Extract patterns from data
- `GET /api/ml/recommend` - Get parameter recommendations
- `POST /api/ml/predict/game` - Predict game outcomes
- `POST /api/ml/predict/schedule` - Predict schedule quality
- `POST /api/ml/predict/team` - Predict team performance
- `POST /api/ml/train` - Train a new model

## How to Use

The API server is started automatically when running the Intelligence Engine:

```bash
# Start the server
python -m intelligence_engine.api.app

# The server will start on port 4001 by default
```

### Example API Calls

#### Submit a Schedule Optimization Task

```bash
curl -X POST http://localhost:4001/api/optimization/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": { ... },
    "algorithmType": "simulated_annealing",
    "config": {
      "coolingRate": 0.98,
      "initialTemperature": 100,
      "iterations": 5000
    }
  }'
```

#### Extract Patterns from a Schedule

```bash
curl -X POST http://localhost:4001/api/ml/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "type": "schedule",
    "content": { ... }
  }'
```

#### Predict Game Outcome

```bash
curl -X POST http://localhost:4001/api/ml/predict/game \
  -H "Content-Type: application/json" \
  -d '{
    "game": {
      "homeTeam": "Team_A",
      "awayTeam": "Team_B",
      "homeTeamRestDays": 3,
      "awayTeamRestDays": 2,
      "isRivalry": true
    },
    "teamStats": { ... }
  }'
```

## Testing

You can test the API using the provided test scripts:

```bash
# Test the ML API endpoints
node scripts/test-ml-api.js

# Test the optimization API endpoints
node scripts/test-optimization-api.js
```

## Error Handling

All API endpoints return standard HTTP status codes:

- 200: Success
- 400: Bad request (invalid parameters)
- 404: Resource not found
- 500: Internal server error

Error responses include a JSON object with an `error` field containing a message.