# HELiiX Intelligence Engine

The HELiiX Intelligence Engine is a Python-based backend that provides advanced computational capabilities for the FlexTime scheduling platform.

## Overview

The HELiiX Intelligence Engine serves as the computational powerhouse behind the FlexTime platform, handling complex optimization tasks, machine learning operations, and knowledge processing. It communicates with the JavaScript agent system through a REST API, allowing for a clear separation of concerns between the user interface orchestration and the heavy computational work.

## Architecture

The Intelligence Engine is organized into several key modules:

- **API Layer** - RESTful endpoints for communication with the JavaScript agents
- **Core Components** - Base classes and utilities used across the system
- **Scheduling Services** - Schedule generation and optimization algorithms
- **Optimization Services** - General-purpose optimization algorithms and utilities
- **Machine Learning Services** - Predictive analytics, pattern extraction, and continuous learning
- **Knowledge Graph** - Structured knowledge representation and reasoning

## Installation

### Prerequisites

- Python 3.9 or higher
- pip (Python package installer)
- virtualenv (recommended)

### Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   export FLASK_APP=intelligence_engine.api.app
   export FLASK_ENV=development
   ```

## Usage

### Starting the Server

```bash
flask run --port 4001
```

The server will be available at http://localhost:4001/api

### API Endpoints

The Intelligence Engine exposes several API endpoints:

- `GET /api/status` - Get the status of the Intelligence Engine
- `POST /api/agents/tasks` - Submit a task to the Intelligence Engine
- `GET /api/agents/tasks/:taskId` - Get the status of a task
- `GET /api/agents/tasks/:taskId/result` - Get the result of a completed task
- `POST /api/feedback` - Store feedback data
- `POST /api/experiences` - Store experience data
- `GET /api/recommendations/scheduling` - Get scheduling recommendations
- `GET /api/recommendations/learning` - Get learning recommendations

## Modules

### API Layer

The API layer provides RESTful endpoints for communication with the JavaScript agent system. It handles request parsing, validation, authentication, and response formatting.

### Core Components

The core components include base classes, utilities, and shared functionality used across the Intelligence Engine:

- Task management system
- Asynchronous job processing
- Logging and monitoring
- Configuration management
- Error handling

### Scheduling Services

The scheduling services provide algorithms and utilities for generating and optimizing sports schedules:

- Schedule generation algorithms
- Constraint-based optimization
- Schedule validation
- Metric calculation

### Optimization Services

The optimization services provide general-purpose optimization algorithms that can be applied to various problems:

- Integer Linear Programming (ILP)
- Simulated Annealing
- Genetic Algorithms
- Constraint Satisfaction Problem (CSP) solvers

### Machine Learning Services

The machine learning services enable predictive analytics, pattern extraction, and continuous learning:

- COMPASS Index calculation
- Pattern extraction from historical data
- Predictive models for game outcomes
- Feedback analysis for continuous improvement

### Knowledge Graph

The knowledge graph provides a structured representation of domain knowledge:

- Entity relationships (teams, venues, constraints)
- Rule-based reasoning
- Semantic query capabilities
- Knowledge extraction and integration

## Communication with JavaScript Agents

The Intelligence Engine communicates with the JavaScript agent system through the HELiiX Intelligence Connector Agent. This connector delegates tasks from the JavaScript agents to the Python backend and returns the results.

## Development

### Adding a New Task Type

1. Define the task handler in the appropriate module
2. Register the task handler in the task registry
3. Implement the required functionality
4. Update the API documentation

### Adding a New Optimization Algorithm

1. Create a new algorithm class in the optimization module
2. Implement the required interface methods
3. Register the algorithm with the algorithm registry
4. Update the documentation

## License

This project is proprietary software owned by Big 12 Conference.

## Contact

For questions or support, contact the development team at development@big12.com.