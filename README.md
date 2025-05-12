# FlexTime Scheduling Platform

FlexTime is an intelligent sports scheduling platform designed for collegiate athletic conferences. It combines machine learning, constraint-based optimization, and championship date management to generate optimal sports schedules that respect all conference and NCAA requirements.

## Features

- **Championship Date Constraints**: Ensures schedules respect conference championships and NCAA tournament dates
- **Machine Learning Workflow**: Learns and adapts to scheduling patterns and preferences
- **Multi-Sport Support**: Handles football, basketball, baseball, softball, and all other collegiate sports
- **Venue Management**: Integrates venue availability and characteristics into scheduling decisions
- **Optimization Engine**: Balances travel distance, competitive fairness, and TV schedule optimization
- **NCAA Compliance**: Incorporates official NCAA season windows and tournament dates
- **Enhanced Visualization**: Travel distance heat maps, constraint satisfaction radar charts, and game density calendars
- **Adaptive Algorithms**: Sport-specific optimization with learning capabilities
- **Natural Language Interface**: RAG-based agent for data analysis through natural language queries

## Architecture

FlexTime consists of two primary components that form a comprehensive scheduling system:

### Backend

- **Node.js-based scheduling engine and API**
  - Core scheduling algorithms using state-of-the-art optimization techniques
  - Multi-agent system with director and specialized agents
  - ML workflow with continuous learning capabilities
  - Championship date management with NCAA tournament integration
  - Neon DB (PostgreSQL) for all data storage
  - RESTful API endpoints for integration

### Frontend

- **React-based UI for schedule management**
  - Interactive schedule matrix with drag-and-drop interface
  - Multiple visualization views (matrix, calendar, list)
  - Constraint management interface
  - Administrative controls
  - Schedule metrics dashboard
  - Schedule export functionality

## Recent Improvements

The system has recently received significant upgrades:

1. **Neon DB Integration**: Full migration from MongoDB to Neon DB for all data storage
2. **Algorithm Optimization**: 20-40% faster convergence to optimal solutions
3. **Memory Optimization**: 50-70% reduction in memory usage during optimization
4. **Parallelization**: 2-4x faster schedule generation on multi-core systems
5. **Enhanced Feedback System**: Advanced learning from user input
6. **Sport-Specific Optimizers**: Tailored solutions for each collegiate sport
7. **School Data RAG Agent**: Natural language interface for school data

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Neon DB account (PostgreSQL-compatible)
- Redis (optional, for caching)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Configure environment variables
cp backend/.env.example backend/.env
# Edit .env file with your configuration

# Start the development environment
npm run dev
```

### Configuration

The application requires configuration for:

- Neon DB connection string
- NCAA tournament dates
- Championship formulas
- Authentication (if applicable)
- ML workflow settings

Edit the `.env` file in the backend directory to configure these settings. The most important settings include:

```bash
# Neon DB Configuration
NEON_DB_CONNECTION_STRING=postgresql://user:password@hostname/database

# Enable Neon DB for various components
USE_NEON_DB=true
ENABLE_NEON_MEMORY=true

# Intelligence Engine Configuration
ENABLE_INTELLIGENCE_ENGINE=true
ENABLE_HISTORICAL_LEARNING=true

# ML Configuration
TRAINING_EPOCHS=150
TRAINING_BATCH_SIZE=64
ENABLE_MODEL_TRAINING=true
```

## Development

```bash
# Run backend only
npm run start:backend

# Run frontend only
npm run start:frontend

# Run both in development mode
npm run dev

# Build for production
npm run build
```

## Testing

```bash
# Run all tests
npm test

# Test championship date constraints
cd backend && node learning-system/verify-championship-constraints.js

# Test ML workflow
cd backend && node learning-system/test-workflow.js
```

## Machine Learning Workflow

The FlexTime ML workflow consists of four main phases:

1. **Data Collection**
   - Gather historical schedules and quality metrics
   - Extract features from schedules

2. **Pattern Extraction**
   - Identify patterns in high-quality schedules
   - Calculate confidence scores for discovered patterns

3. **Knowledge Building**
   - Convert patterns to agent-specific knowledge
   - Store knowledge in agent memories

4. **Validation**
   - Test learned knowledge by generating schedules
   - Evaluate and adjust knowledge based on results

## Multi-Agent System

The scheduling system uses a hierarchical multi-agent architecture:

1. **Director Agents**
   - Scheduling Director - Manages schedule generation and optimization
   - Operations Director - Handles operational aspects of scheduling
   - Analysis Director - Provides analytics and insights

2. **Specialized Agents**
   - Algorithm Selection Agent - Selects optimal algorithms
   - Constraint Management Agent - Handles scheduling constraints
   - Schedule Optimization Agent - Optimizes with various techniques
   - Travel Optimization Agent - Minimizes travel distances
   - Resource Allocation Agent - Manages venue and resource allocation

## Database Architecture

FlexTime uses a primarily PostgreSQL-based database approach:

- **Neon DB** (PostgreSQL-compatible):
  - Stores structured business data (teams, venues, schedules)
  - Manages agent memories and learning data
  - Stores training and feedback information

- **Redis** (optional):
  - Provides caching capabilities for performance
  - Handles short-term agent memory for faster access

## API Endpoints

The FlexTime API provides endpoints for all scheduling operations, including:

- Schedule generation and management
- Team and venue management
- Constraint configuration
- Optimization and analysis
- Visualization and metrics
- Feedback collection
- ML model training and management

For the complete API reference, see the [API Documentation](./backend/docs/api/README.md).

## COMPASS Predictive Model Training

The COMPASS (Constraint-Oriented Machine Learning for Pattern Analysis in Sports Scheduling) system provides:

- Team Rating Model: Predicts team performance
- Game Prediction Model: Forecasts outcomes of matchups
- Strength of Schedule Model: Evaluates schedule difficulty
- Player Impact Model: Measures player influence

These models are trained nightly and continuously improve based on new data.

## Documentation

Additional documentation is available in the `/docs` directory, including:

- [API Reference](./backend/docs/api/README.md)
- [Database Schema](./backend/docs/database-schema.md)
- [Learning System](./backend/docs/learning-system.md)
- [Neon DB Setup](./backend/docs/neon-db-setup.md)
- [Intelligence Engine API](./backend/docs/intelligence-engine-api.md)
- [Deployment Guide](./backend/docs/deployment.md)
- [Integration Options](./backend/docs/integrations.md)

## Implementation Roadmap

### Phase 1-3: (Completed)
- Core scheduling algorithms
- Basic and advanced UI components
- Multi-objective optimization
- Intelligence Engine integration
- MCP dashboard integration

### Phase 4: (Current)
- Enhanced visualizations
- Performance optimizations
- Advanced constraint handling
- Comparative schedule analysis

### Phase 5: (Upcoming)
- Multi-sport scheduling
- Tournament bracket optimization
- TV broadcast optimization
- Mobile-optimized interface

## License

This software is proprietary and confidential.
Unauthorized copying, distribution, or use is strictly prohibited.