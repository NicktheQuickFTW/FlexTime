# FlexTime Learning System

This document provides a comprehensive overview of the FlexTime Learning System architecture, components, and data flow.

## Overview

The FlexTime Learning System enables continuous improvement of scheduling recommendations through machine learning, pattern recognition, and feedback analysis. The system learns from historical schedules, user feedback, and contextual information to provide increasingly accurate and personalized scheduling recommendations.

## Architecture

The Learning System consists of these core components:

- **Enhanced Memory Manager**: Stores and retrieves agent experiences, feedback, and semantic knowledge
- **Machine Learning Manager**: Handles training and inference for predictive models
- **Feedback Loop System**: Processes user feedback to improve recommendations
- **COMPASS Models**: Specialized models for sports-specific scheduling optimization

## Data Storage

All learning system data is stored in Neon DB, which provides:

- High-performance PostgreSQL-compatible database
- Vector embeddings for semantic search capabilities
- Structured data storage for training datasets
- Persistent memory for agent experiences and feedback

## Components

### Enhanced Memory Manager

The Enhanced Memory Manager provides:

- Short-term and long-term memory management
- Semantic vector search capabilities
- Automatic memory consolidation
- Efficient storage and retrieval of agent experiences

```
┌─────────────────────┐
│  Enhanced Memory    │
│                     │
│  ┌───────────────┐  │
│  │ Short-term    │  │
│  │ (Redis)       │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ Long-term     │  │
│  │ (Neon DB)     │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Machine Learning Manager

The Machine Learning Manager:

- Trains predictive models on historical data
- Manages model versioning and deployment
- Provides inference APIs for scheduling recommendations
- Monitors model performance and triggers retraining

### Feedback Loop System

The Feedback Loop System:

- Collects user feedback on generated schedules
- Analyzes feedback patterns to identify improvement areas
- Updates constraint weights based on user preferences
- Provides inputs to the machine learning training process

### COMPASS Models

COMPASS (Constraint-Oriented Machine Learning for Pattern Analysis in Sports Scheduling) includes:

- Team Rating Model: Predicts team performance based on historical data
- Game Prediction Model: Forecasts outcomes of specific matchups
- Strength of Schedule Model: Evaluates schedule difficulty
- Player Impact Model: Measures player influence on team performance

## Data Flow

1. User provides feedback on a generated schedule
2. Feedback is stored in Neon DB through the Feedback Loop System
3. Enhanced Memory Manager captures the experience with proper context
4. During training, the ML Manager retrieves relevant experiences from memory
5. COMPASS models are trained using this historical data
6. Updated models are stored in Neon DB and file system
7. New schedule requests leverage the improved models for recommendations

## Training Process

The overnight training process runs sequentially:

1. Data Collection: Gather recent feedback and scheduling outcomes
2. Pattern Extraction: Identify recurring patterns in successful schedules
3. Model Training: Update COMPASS models with new data
4. Validation: Test models against known good schedules
5. Deployment: Make updated models available for scheduling

## Configuration

The Learning System is configured through environment variables:

```
# Neon DB Connection
NEON_DB_CONNECTION_STRING=postgresql://user:password@hostname/database

# Learning System Configuration
USE_NEON_DB=true
ENABLE_NEON_MEMORY=true
ENABLE_MODEL_TRAINING=true
TRAINING_EPOCHS=150
TRAINING_BATCH_SIZE=64
```

## API Integration

The Learning System provides APIs for:

- Accessing recommendations based on historical patterns
- Submitting feedback on generated schedules
- Retrieving insights about scheduling patterns
- Triggering training processes manually

## Monitoring

The system logs training progress and performance metrics:

- Training accuracy and loss curves
- Model improvement percentages
- Memory usage statistics
- Inference response times

## Future Enhancements

Planned enhancements include:

- Advanced embedding models for better semantic understanding
- Self-supervised learning capabilities
- Multi-modal inputs (including visual schedule representations)
- Explainable AI features for recommendation transparency