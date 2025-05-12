# HELiiX FlexTime Scheduling Platform

## Overview

The HELiiX FlexTime Platform is a revolutionary collegiate sports scheduling system engineered specifically for the Big 12 Conference. It combines agent-based architecture, machine learning, and computational optimization to create schedules that maximize competitiveness, minimize travel burdens, and align with championship structures.

## System Architecture

FlexTime employs a hybrid architecture that leverages the strengths of both JavaScript and Python:

1. **JavaScript Agent Layer** - Provides flexibility, user interaction, and business logic orchestration
2. **Python Intelligence Engine** - Handles complex computational tasks, optimization algorithms, and machine learning
3. **HELiiX Intelligence Connector** - Bridges the JS and Python layers for seamless operation

## Key Components

### 1. Multi-Agent System (MAS)

The platform employs a hierarchical multi-agent architecture:

- **Director Agents** - Oversee broad functional areas:
  - Scheduling Director - Manages schedule generation and optimization
  - Operations Director - Handles operational aspects of scheduling
  - Analysis Director - Coordinates analytics and insights

- **Specialized Agents** - Focus on specific tasks:
  - Algorithm Selection Agent - Selects the best algorithm for a given scheduling task
  - Constraint Management Agent - Manages and validates scheduling constraints
  - Travel Optimization Agent - Specifically optimizes travel distances
  - Resource Allocation Agent - Manages venue and resource allocation
  - Venue Management Agent - Handles venue-specific constraints and availability

- **Evolution Agents** - Provide self-improvement capabilities:
  - Platform Analyzer Agent - Identifies gaps and improvement opportunities
  - Agent Generator Agent - Creates new specialized agents to address needs

### 2. HELiiX Intelligence Engine

The Python-based Intelligence Engine delivers advanced computational capabilities:

- Constraint-based optimization algorithms
- Predictive analytics and pattern recognition
- Learning system for continuous improvement
- Knowledge graph for complex relationship modeling
- Asynchronous task management for long-running operations

### 3. Machine Learning Components

The platform leverages several sophisticated ML components:

- **Pattern Extractor**
  - Identifies patterns in schedule data, feedback, and operational experiences
  - Extracts team-specific patterns (workload, home/away balance)
  - Analyzes time-based patterns (game intervals, day frequency)
  - Detects sequencing patterns (consecutive home/away games)
  - Provides parameter recommendations for new schedule generation
  - Learns from user feedback to improve future schedules

- **Predictive Models**
  - **Game Outcome Predictor** - Uses team statistics to predict game results
    - Features include team ratings, win streaks, rest days, rivalry factors
    - Delivers probability estimates for home and away team victories
  - **Schedule Quality Predictor** - Evaluates schedule quality based on multiple factors
    - Analyzes travel distance, rest days, home/away imbalance
    - Provides a quantitative quality score between 0 and 1
  - **Team Performance Predictor** - Forecasts team COMPASS index
    - Incorporates win percentage, points, turnover margin, record types
    - Supports performance forecasting for resource allocation

- **ML Pipeline**
  - Automated feature extraction and preprocessing
  - Model training with hyperparameter tuning
  - Validation and model persistence
  - Overnight training jobs for continuous improvement
  - Monitoring for model drift and performance degradation

### 4. Core Improvements

The platform includes several significant improvements over traditional scheduling systems:

- **Algorithm Optimization** - Adaptive Simulated Annealing with 20-40% faster convergence
- **Constraint Handling** - Weighted constraint evaluation with learning capabilities
- **Memory Optimization** - 50-70% reduction in memory usage during travel optimization
- **Parallelization** - 2-4x faster schedule generation on multi-core systems
- **Sport-Specific Modules** - Tailored solutions for basketball, football, and Olympic sports
- **Enhanced Feedback Loop** - AI-driven analysis of user feedback
- **Incremental Optimization** - Phase-based optimization for complex scheduling problems
- **Visualization Tools** - Advanced charts and graphs for schedule quality assessment

### 5. Specialized Intelligence

- **Sport-Specific RAG Agents** - Natural language interaction for sport data
- **Transfer Portal Agents** - Track and analyze athlete transfers
- **Recruiting Agents** - Provide intelligence on recruiting landscape
- **Industry Analysis System** - Monitor regulatory changes and competitive technologies

## Usage

### Generating Schedules

```javascript
const { agentSystem } = require('./agents');

const generatedSchedule = await agentSystem.generateSchedule(
  sportType,      // e.g., 'Football', 'Men\'s Basketball'
  teams,          // Array of Team objects
  constraints,    // Array of Constraint objects
  options         // Optional configuration
);
```

### Optimizing Schedules

```javascript
const optimizedSchedule = await agentSystem.optimizeSchedule(
  schedule,       // Schedule object to optimize
  algorithm,      // Optional: specific algorithm to use
  options         // Optional configuration
);
```

### Using the Intelligence Engine

```javascript
const { heliixConnector } = require('./agents');

// Create the connector agent
const intelligenceConnector = heliixConnector.createIntelligenceConnectorAgent({
  intelligence: {
    serviceUrl: process.env.INTELLIGENCE_ENGINE_URL,
    apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
    enabled: true
  }
});

// Initialize the agent
await intelligenceConnector.initialize();

// Delegate a task to the Intelligence Engine
const delegateTask = intelligenceConnector.createTask(
  'delegate',
  'Generate optimized basketball schedule',
  {
    task: {
      taskType: 'generate_schedule',
      parameters: {
        sportType: 'basketball',
        teams: teams,
        constraints: constraints,
        options: {
          season: '2024-2025',
          optimizationLevel: 'high'
        }
      }
    },
    options: {
      wait: true,
      responseFormat: 'agent',
      timeout: 120000
    }
  }
);

// Submit the task
const result = await intelligenceConnector.submitTask(delegateTask);
```

### Using the ML API

```javascript
// Predict game outcome
const gameOutcome = await fetch(`${INTELLIGENCE_ENGINE_URL}/api/ml/predict/game`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game: {
      homeTeam: 'Kansas',
      awayTeam: 'BYU',
      homeTeamRestDays: 3,
      awayTeamRestDays: 2,
      isRivalry: false
    },
    teamStats: teamStatsObject
  })
});

// Predict schedule quality
const scheduleQuality = await fetch(`${INTELLIGENCE_ENGINE_URL}/api/ml/predict/schedule`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    schedule: scheduleObject
  })
});

// Extract patterns from schedule data
const patterns = await fetch(`${INTELLIGENCE_ENGINE_URL}/api/ml/patterns`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'schedule',
    content: scheduleObject
  })
});
```

## Configuration

The platform can be configured through environment variables:

### Core Configuration
- `LOG_LEVEL` - Logging level (default: 'info')
- `ENABLE_MCP` - Enable MCP integration (default: false)
- `MCP_ENDPOINT` - MCP server endpoint (if enabled)
- `ENABLE_HISTORICAL_LEARNING` - Enable learning from historical data (default: true)
- `ENABLE_AGENT_MEMORY` - Enable persistent agent memory (default: true)

### Intelligence Engine Configuration
- `ENABLE_INTELLIGENCE_ENGINE` - Enable the Intelligence Engine integration (default: false)
- `INTELLIGENCE_ENGINE_URL` - URL of the Intelligence Engine API (default: 'http://localhost:4001/api')
- `INTELLIGENCE_ENGINE_API_KEY` - API key for authenticating with the Intelligence Engine

### RAG Agent Configuration
- `OPENAI_API_KEY` - API key for OpenAI services (used for embeddings)
- `ANTHROPIC_API_KEY` - API key for Anthropic services (used for text generation)
- `ACTIVE_EMBEDDING_PROVIDER` - Provider for embeddings (openai, local)
- `ACTIVE_CHAT_PROVIDER` - Provider for text generation (anthropic, openai, local)

### Model Training Configuration
- `TRAINING_SCHEDULED_TIME` - Time to run overnight training (default: 02:00)
- `TRAINING_TIMEZONE` - Timezone for training scheduler (default: America/Chicago)
- `ENABLE_MODEL_TRAINING` - Enable/disable the model training system (default: true)

## API Endpoints

The platform exposes several API endpoints:

- `POST /api/schedules/generate` - Generate a new schedule
- `POST /api/schedules/optimize` - Optimize an existing schedule
- `GET /api/schedules/:id` - Get schedule by ID
- `GET /api/schedules/sport/:sportType` - Get schedules by sport type
- `GET /api/visualizations/:scheduleId` - Generate visualizations for a schedule
- `POST /api/feedback/submit` - Submit feedback for a schedule
- `GET /api/rag/query` - Query the RAG agent for school data
- `GET /api/intelligence/status` - Get Intelligence Engine status

### ML API Endpoints

- `POST /api/ml/patterns` - Extract patterns from schedule, feedback, or experience data
- `GET /api/ml/recommend` - Get parameter recommendations based on extracted patterns
- `GET /api/ml/models` - List all available ML models with metadata
- `POST /api/ml/predict/game` - Predict the outcome of a game with confidence scores
- `POST /api/ml/predict/schedule` - Predict the quality of a schedule
- `POST /api/ml/predict/team` - Predict the COMPASS index for a team
- `POST /api/ml/train` - Train a model with the provided data

See the [API Documentation](./docs/intelligence-engine-api.md) for more details.

## Big 12 Conference Compliance

The platform adheres to Big 12 Conference naming conventions:

1. **TCU** - Always use "TCU" and never "Texas Christian University"
2. **UCF** - Always use "UCF" and never "University of Central Florida"
3. **BYU** - Always use "BYU" and never "Brigham Young University"

Additionally, the University of Texas and University of Oklahoma have left the Big 12 Conference and joined the SEC. They have been replaced with University of Arizona and Arizona State University in all documentation and examples.

## Strategic Advantages

The HELiiX FlexTime Platform delivers several key strategic advantages:

1. **Competitive Superiority** - Surpasses existing solutions like Faktor and KPI Sports
2. **Championship-First Approach** - Maximizes NCAA postseason opportunities
3. **Self-Evolution** - Continuously improves through learning and adaptation
4. **Computational Efficiency** - Handles complex constraints with advanced algorithms
5. **Multi-Sport Integration** - Provides cohesive scheduling across all collegiate sports

## Python Intelligence Engine

The FlexTime platform includes a Python-based Intelligence Engine that handles complex computational tasks:

### Directory Structure

```
python/
└── intelligence_engine/
    ├── api/             # RESTful API endpoints
    ├── core/            # Core functionality
    ├── scheduling/      # Schedule generation and optimization
    ├── optimization/    # Optimization algorithms
    ├── ml/              # Machine learning models
    │   ├── models/      # Trained model files (.pkl)
    │   ├── pattern_extractor.py  # Pattern extraction functionality
    │   ├── predictive_model.py   # Predictive model implementations
    │   └── test_ml.py   # ML testing script
    ├── knowledge_graph/ # Knowledge representation
    └── requirements.txt # Python dependencies
```

### Setup

```bash
# Navigate to the Intelligence Engine directory
cd python/intelligence_engine

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python run.py
```

### Docker

You can also run the Intelligence Engine using Docker:

```bash
# Build the Docker image
docker build -t heliix-intelligence-engine python/intelligence_engine

# Run the container
docker run -p 4001:4001 heliix-intelligence-engine
```

### Testing ML Components

The platform includes a test script to validate the ML components:

```bash
# Test from the JavaScript layer
node scripts/test-ml-components.js

# Test directly from Python
cd python/intelligence_engine
python -m ml.test_ml
```

The test script performs the following functions:
1. Creates sample data for testing (schedules, team statistics, feedback)
2. Tests the Pattern Extractor functionality
3. Trains and tests the Game Outcome Predictor model
4. Trains and tests the Schedule Quality Predictor model
5. Trains and tests the Team Performance Predictor model
6. Saves the trained models for use in the application

Test results are stored in the `ml-test-results.json` file and include:
- Success/failure status for each component
- Pattern count extracted from sample data
- Model accuracy metrics
- List of model files created

### API Endpoints

The Intelligence Engine exposes several API endpoints:

- `GET /api/status` - Get the status of the Intelligence Engine
- `POST /api/agents/tasks` - Submit a task to the Intelligence Engine
- `GET /api/agents/tasks/:taskId` - Get the status of a task
- `GET /api/agents/tasks/:taskId/result` - Get the result of a completed task

## Next Steps

Current development priorities include:

1. ✅ Complete Python backend service implementation
2. ✅ Implement the full director agent hierarchy
3. ✅ Implement the Machine Learning components
4. ✅ Enhance the knowledge graph integration
5. ✅ Develop the enhanced conflict resolution system
6. ✅ Create comprehensive feedback collection UI components

For the detailed implementation plan, see [IMPLEMENTATION.md](./IMPLEMENTATION.md) and [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md).