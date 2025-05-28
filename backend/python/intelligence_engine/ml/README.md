# Machine Learning Components

This directory contains the machine learning components of the FlexTime Intelligence Engine, which provide pattern extraction and predictive modeling capabilities.

## Components Overview

### 1. Pattern Extractor

The Pattern Extractor analyzes scheduling data, feedback, and experiences to identify meaningful patterns that can improve schedule generation and optimization.

```python
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Create extractor
extractor = PatternExtractor()

# Extract patterns from schedule
patterns = extractor.extract_patterns_from_schedule(schedule)

# Get recommended parameters
params = extractor.get_recommended_parameters("generate_schedule", "basketball")
```

### 2. Predictive Models

The system includes several predictive models:

#### Game Outcome Predictor

Predicts the outcome of games based on team statistics and game context.

```python
from intelligence_engine.ml.predictive_model import GameOutcomePredictor

# Create the model
model = GameOutcomePredictor()

# Train the model
X, y, feature_names = model.prepare_features(games, team_stats)
model.train(X, y, feature_names)

# Make predictions
prediction = model.predict_outcome(game, team_stats)
```

#### Schedule Quality Predictor

Evaluates the quality of a schedule based on various metrics.

```python
from intelligence_engine.ml.predictive_model import ScheduleQualityPredictor

# Create the model
model = ScheduleQualityPredictor()

# Train the model
X, y, feature_names = model.prepare_features(schedules)
model.train(X, y, feature_names)

# Predict schedule quality
quality = model.predict_quality(schedule)
```

#### Team Performance Predictor (COMPASS Index)

Predicts team performance based on various statistics.

```python
from intelligence_engine.ml.predictive_model import TeamPerformancePredictor

# Create the model
model = TeamPerformancePredictor()

# Train the model
X, y, feature_names = model.prepare_features(team_data)
model.train(X, y, feature_names)

# Predict COMPASS index
compass_index = model.predict_compass_index(team_data)
```

### 3. Model Factory

A factory function for creating models:

```python
from intelligence_engine.ml.predictive_model import create_model

# Create a model of a specific type
model = create_model("game_outcome", config)
```

## API Integration

The ML components are exposed through a RESTful API:

- `GET /api/ml/models` - List all available models
- `POST /api/ml/patterns` - Extract patterns from data
- `GET /api/ml/recommend` - Get parameter recommendations
- `POST /api/ml/predict/game` - Predict game outcomes
- `POST /api/ml/predict/schedule` - Predict schedule quality
- `POST /api/ml/predict/team` - Predict team performance (COMPASS index)
- `POST /api/ml/train` - Train a new model

## Testing

Two test scripts are available:

1. **Python Test Script** - Tests the ML components directly:

```bash
python intelligence_engine/ml/test_ml.py
```

2. **JavaScript Test Script** - Tests the API integration:

```bash
node scripts/test-ml-components.js
```

3. **API Test Script** - Tests the ML API endpoints:

```bash
node scripts/test-ml-api.js
```

## Model Storage

Models are stored as pickle files in the `models` directory with the following naming convention:

- Game Outcome Predictor: `game_outcome_<version>.pkl`
- Schedule Quality Predictor: `schedule_quality_<version>.pkl`
- Team Performance Predictor: `team_performance_<version>.pkl`

## Example Patterns

The Pattern Extractor identifies various types of patterns:

- **Team Workload**: Average games per team
- **Home/Away Balance**: Imbalance in home vs away games
- **Game Day Frequency**: Average days between games
- **Game Streaks**: Average maximum consecutive home/away games
- **Algorithm Performance**: Most effective algorithms for different scenarios

These patterns are used to provide recommendations for scheduling parameters and constraints.