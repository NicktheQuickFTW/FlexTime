# COMPASS Predictive Model Training

The COMPASS Predictive Model Training system provides overnight training of neural network models for predictive analytics in the COMPASS (Comprehensive Program Assessment) system. These models enable data-driven insights for scheduling, team evaluation, and program assessment.

## Features

- **Automated Training**: Schedule overnight training of neural network models
- **Multiple Model Types**: Support for game prediction, team rating, player impact, and strength of schedule models
- **Tensorflowjs-Based**: Uses TensorFlow.js for training and inference
- **Training History**: Track and visualize training performance over time
- **Web Interface**: Manage models and training jobs through a user-friendly interface
- **Scheduled Jobs**: Automatically run training on a schedule
- **API Access**: Programmatically access models and training functions

## Model Types

The system supports the following model types:

1. **Game Prediction Models**: Predict game outcomes, win probabilities, and expected point differences
2. **Team Rating Models**: Generate comprehensive team ratings based on performance metrics
3. **Player Impact Models**: Quantify the impact of individual players on team performance
4. **Strength of Schedule Models**: Calculate advanced strength of schedule metrics

## System Architecture

The predictive model training system consists of several components:

1. **Model Trainer**: Core component that trains neural network models
2. **Training Job**: Scheduled job that runs model training automatically
3. **API Endpoints**: REST API for managing model training
4. **UI Components**: Web interface for interacting with the system

## Usage

### Running Training Manually

To run the training process manually:

```bash
npm run train-models
```

You can customize the training process with command line arguments:

```bash
npm run train-models -- --models=game,team --epochs=50 --batch-size=32
```

For quick testing with reduced epochs:

```bash
npm run train-models-quick
```

### Registering the Training Job

To set up the scheduled training job:

```bash
npm run register-training-job
```

To test the job with a small number of epochs:

```bash
npm run test-training-job
```

### API Access

The system provides several API endpoints for managing model training:

- `GET /api/compass/training/status`: Get training job status
- `POST /api/compass/training/register`: Register the overnight training job
- `POST /api/compass/training/start`: Start the training job immediately
- `POST /api/compass/training/stop`: Stop the training job
- `GET /api/compass/training/models`: Get available trained models
- `GET /api/compass/training/history/:modelId`: Get training history for a model
- `POST /api/compass/training/train/:modelType`: Train a specific model type

## Configuration

The system can be configured with the following environment variables:

- `TRAINING_SCHEDULED_TIME`: Time to run overnight training (default: 02:00)
- `TRAINING_TIMEZONE`: Timezone for training scheduler (default: America/Chicago)
- `TRAINING_MAX_RUNTIME`: Maximum runtime for training in milliseconds (default: 14400000)
- `TRAINING_EPOCHS`: Default number of training epochs (default: 100)
- `TRAINING_BATCH_SIZE`: Default training batch size (default: 64)
- `TRAINING_NOTIFICATION_EMAIL`: Email for training notifications
- `ENABLE_MODEL_TRAINING`: Enable/disable the model training system (default: true)

## Data Requirements

The model training system requires historical data for training. In a production environment, this data would be sourced from:

1. **Game Results**: Historical game results with scores and team statistics
2. **Team Data**: Team performance metrics and statistics
3. **Player Data**: Player statistics and performance metrics
4. **Schedule Data**: Historical schedule information with game details

For development and testing, the system includes mock data generation to simulate these data sources.

## Model Development

The models are designed with the following architecture:

### Game Prediction Model

- **Input Features**: Team ratings, home/away, neutral site, days rest, recent form, injury impact
- **Output**: Win probability, expected point difference
- **Architecture**: Multi-layer neural network with dropout for regularization

### Team Rating Model

- **Input Features**: Offensive efficiency, defensive efficiency, tempo, strength of schedule, win percentage, etc.
- **Output**: Overall rating, offensive rating, defensive rating, efficiency rating
- **Architecture**: Deep neural network with multiple hidden layers

### Player Impact Model

- **Input Features**: Player statistics, team performance with/without player
- **Output**: Offensive impact, defensive impact, overall impact, win impact
- **Architecture**: Neural network with dropout and regularization

### Strength of Schedule Model

- **Input Features**: Opponent ratings, game locations, conference games, etc.
- **Output**: Overall SoS, past SoS, future SoS, home SoS, away SoS
- **Architecture**: Neural network with multiple hidden layers

## Training History

The system tracks training history for each model, including:

- Loss values for each epoch
- Accuracy metrics (when applicable)
- Validation performance
- Training time and parameters

This history can be visualized in the web interface to monitor model improvement over time.

## Integration with COMPASS

The trained models are used by the COMPASS Predictive Analytics component to provide insights for scheduling and program assessment. The integration points include:

1. **Game Prediction**: Predicting outcomes for potential games during scheduling
2. **Team Rating**: Evaluating team strength for balanced scheduling
3. **Player Impact**: Assessing the impact of roster changes on team performance
4. **Strength of Schedule**: Evaluating and optimizing schedule strength

## Performance Considerations

- **Memory Usage**: Training requires significant memory, especially for large datasets
- **Training Time**: Full training can take several hours, depending on the dataset size and model complexity
- **GPU Acceleration**: When available, TensorFlow.js will use GPU acceleration to speed up training

## Security Considerations

- **Data Access**: Models are trained on internal data and not exposed to external systems
- **API Security**: Access to training endpoints should be restricted to authorized users
- **Model Storage**: Models are stored securely and not accessible without proper authentication