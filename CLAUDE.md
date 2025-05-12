# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## FlexTime: Intelligent Sports Scheduling Platform

FlexTime is a collegiate athletic conference scheduling platform that combines machine learning, constraint-based optimization, and championship date management to generate optimal sports schedules.

## Development Environment Setup

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn
- Neon DB account

### Installation & Setup
```bash
# Install dependencies
npm install

# Configure environment
cp backend/.env.example backend/.env
# Update .env with your Neon DB credentials

# Start development environment
npm run dev

# Start just backend
npm run start:backend

# Start just frontend
npm run start:frontend

# Build for production
npm run build
```

## Testing Commands

```bash
# Run all tests
npm test

# Test championship date constraints
cd backend && node learning-system/verify-championship-constraints.js

# Test ML workflow
cd backend && node learning-system/test-workflow.js

# Train COMPASS models
cd backend && ./train-compass-models.sh
```

## Database Configuration

FlexTime uses Neon DB (PostgreSQL-compatible) for all storage. Important environment variables:

```
# Neon DB Connection
NEON_DB_CONNECTION_STRING=postgresql://user:password@hostname/database

# Required configuration flags
USE_NEON_DB=true
ENABLE_NEON_MEMORY=true
```

## System Architecture

### Core Components

1. **Backend**
   - **Multi-Agent System**: Hierarchical architecture with director and specialized agents
     - `FlexTimeAgentSystem`: Main entry point with backward compatibility
     - `AgentSystem`: Core component for lifecycle management
     - `SchedulingAgentSystem`: Specialized for scheduling operations

   - **Learning System**: ML workflow for continuous improvement
     - `MLWorkflowManager`: Manages data collection, pattern extraction, knowledge building
     - `EnhancedMemoryManager`: Manages agent memories with Neon DB
     - `COMPASS Models`: Team Rating, Game Prediction, Strength of Schedule, Player Impact

   - **Database Layer**: Neon DB integration for all persistence
     - `NeonDBAdapter`: Primary adapter for all database operations
     - `EnhancedMemoryManager`: Agent memory persistence with Neon DB

2. **Frontend**
   - React 18 with TypeScript
   - Material UI (MUI v5)
   - Interactive matrix visualization

### Important Project Directories

- `/backend/agents`: Multi-agent system implementation
- `/backend/learning-system`: Machine learning workflow components
- `/backend/compass`: COMPASS predictive model components
- `/backend/scripts`: Training and maintenance scripts

## Key Workflows

1. **Schedule Generation Pipeline**:
   - Constraint definition → Algorithm selection → Initial generation → Optimization → Quality evaluation

2. **Machine Learning Workflow**:
   - Data Collection → Pattern Extraction → Knowledge Building → Validation

3. **Model Training Process**:
   - Sequential training of Team Rating → Game Prediction → Strength of Schedule → Player Impact models
   - Models are stored in both file system and Neon DB

## Migration Note

The system has been migrated from MongoDB to Neon DB. Any references to MongoDB should be updated to use the Neon DB integration.