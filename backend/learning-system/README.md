# FlexTime ML Workflow System

A machine learning workflow system for the FlexTime scheduling platform that enables scheduling agents to continuously learn and improve from historical data.

## Architecture Overview

This system builds on the existing hybrid Neon + Supabase architecture to add machine learning capabilities:

- **Neon PostgreSQL**: Stores historical schedules, metrics, learned patterns, and agent memories
- **Supabase**: Provides activity logging, monitoring, and notification services
- **Claude + OpenAI**: Multi-model AI approach for different aspects of the ML workflow

## Components

1. **MLWorkflowManager.js**
   - Core component that manages the entire ML workflow
   - Handles data collection, pattern extraction, knowledge building, and validation

2. **OvernightLearningTask.js**
   - Script for executing the overnight learning process
   - Can be run manually or scheduled via cron

3. **GymnasticsAgentML.js**
   - Example sport-specific agent with ML capabilities
   - Shows how to use learned patterns for schedule generation

4. **Setup & Testing**
   - `setup.js`: Initializes the ML system
   - `test-workflow.js`: Tests the workflow with synthetic data
   - `cron-schedule.js`: Schedules the nightly learning process

## Database Schema

The ML system uses the following tables:

- `historical_schedules`: Stores generated schedules for learning
- `schedule_metrics`: Quality metrics for each schedule
- `schedule_features`: Extracted features for ML analysis
- `learned_patterns`: Patterns discovered from historical data
- `agent_memories`: Long-term memory for scheduling agents
- `learning_history`: Audit trail of learning processes
- `schedule_simulations`: Results from validation tests

## ML Workflow Process

The ML workflow consists of four main phases:

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

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- Neon PostgreSQL database
- Supabase project
- Environment variables set in `.env`

### Installation

1. Install dependencies:
   ```bash
   npm install pg @supabase/supabase-js cron
   ```

2. Apply database migrations:
   ```bash
   node learning-system/setup.js
   ```

3. Test the workflow:
   ```bash
   node learning-system/test-workflow.js
   ```

4. Start the scheduled learning process:
   ```bash
   node learning-system/cron-schedule.js
   ```

## Integration with Existing Agents

To add ML capabilities to an existing agent:

1. Use the `GymnasticsAgentML.js` as a template
2. Add methods for accessing learned patterns
3. Update schedule generation to use learned parameters
4. Implement pattern recognition for schedule improvements

## Monitoring

The system logs all activity to Supabase for monitoring:

- Setup and initialization events
- Nightly learning process execution
- Pattern discoveries and validation results

## Development Roadmap

Future enhancements planned for the ML workflow:

1. Improved feature extraction for better pattern recognition
2. Sport-specific algorithm tuning based on learned patterns
3. Claude-powered pattern analysis for deeper insights
4. Real-time learning from user feedback
5. Advanced conflict resolution using learned patterns
