# ML-Enhanced Constraint System

This directory contains machine learning components that enhance the Flextime constraint system with dynamic optimization, predictive validation, and pattern learning capabilities.

## Components

### 1. MLConstraintOptimizer
- **Purpose**: Dynamically optimizes constraint weights based on historical performance and current context
- **Key Features**:
  - Neural network-based weight prediction
  - Explainable AI with feature importance analysis
  - Batch optimization for multiple constraints
  - Automatic retraining capabilities

### 2. PredictiveValidator
- **Purpose**: Predicts potential constraint violations before they occur
- **Key Features**:
  - Violation probability prediction with time horizons
  - Conflict type and severity classification
  - Preventive measure recommendations
  - Resolution strategy evaluation

### 3. FeatureExtractor
- **Purpose**: Extracts meaningful features from schedules, constraints, and games
- **Key Features**:
  - Comprehensive feature engineering
  - Caching for performance optimization
  - Support for constraint, schedule, and game features
  - Distance calculations and pattern detection

### 4. ConstraintLearner
- **Purpose**: Learns from historical constraint satisfaction patterns
- **Key Features**:
  - Pattern recognition and analysis
  - Constraint interaction detection
  - Incremental learning from evaluations
  - Insight generation with recommendations

### 5. ModelManager
- **Purpose**: Manages the lifecycle of all ML models in the system
- **Key Features**:
  - Model deployment and versioning
  - Performance monitoring and drift detection
  - Automatic retraining triggers
  - Inference caching and optimization

## Installation

```bash
# Install required dependencies
npm install @tensorflow/tfjs-node

# Create models directory
mkdir -p ./models/constraints
```

## Usage

### Basic Setup

```typescript
import { createMLConstraintSystem } from './backend/src/constraints/v2/ml';

// Initialize the ML system
const mlSystem = await createMLConstraintSystem({
  modelsPath: './models/constraints',
  enableAutoRetrain: true,
  retrainThreshold: 0.15,
  maxModelAge: 30,
  enableDriftDetection: true
});
```

### Optimizing Constraint Weights

```typescript
const { optimizer } = mlSystem;

// Predict optimal weights
const predictions = await optimizer.batchPredict(constraints, {
  schedule,
  sport: 'basketball',
  season: '2024-25',
  environmentFactors: {
    timeOfSeason: 'late',
    competitivenessLevel: 0.85
  }
});

// Apply high-confidence predictions
predictions.forEach(prediction => {
  if (prediction.confidence > 0.8) {
    const constraint = constraints.find(c => c.id === prediction.constraintId);
    if (constraint) {
      constraint.weight = prediction.predictedWeight;
    }
  }
});
```

### Predicting Violations

```typescript
const { validator } = mlSystem;

// Predict violations for the next week
const violations = await validator.predictViolations(
  schedule,
  constraints,
  168 // hours
);

// Get preventive measures for high-risk violations
const highRisk = violations.filter(v => v.violationProbability > 0.7);
highRisk.forEach(violation => {
  console.log(`Constraint: ${violation.constraintId}`);
  console.log(`Risk: ${violation.violationProbability}`);
  violation.preventiveMeasures.forEach(measure => {
    console.log(`- ${measure.action}: ${measure.implementation}`);
  });
});
```

### Learning from History

```typescript
const { learner } = mlSystem;

// Learn from evaluation results
const insights = await learner.learnFromEvaluation(
  evaluationResult,
  schedule,
  constraints
);

// Analyze constraint interactions
const interactions = await learner.analyzeInteractions(constraints, schedule);
```

## Architecture

### Data Flow
1. **Feature Extraction**: Raw schedule/constraint data → Normalized features
2. **Model Inference**: Features → ML models → Predictions
3. **Result Application**: Predictions → Constraint adjustments
4. **Learning Loop**: Evaluation results → Model updates

### Model Types
- **Regression Models**: For continuous predictions (weights, scores)
- **Classification Models**: For categorical predictions (violations, conflicts)
- **Interaction Models**: For relationship analysis between constraints

## Training

### Initial Training

```typescript
import { prepareConstraintTrainingData } from './backend/src/constraints/v2/ml';

// Prepare training data from historical evaluations
const trainingData = prepareConstraintTrainingData(
  evaluationHistory,
  schedules,
  constraints
);

// Train specific model
const performance = await optimizer.train(trainingData);
console.log(`Model accuracy: ${performance.accuracy}`);
```

### Continuous Learning

The system automatically:
1. Monitors model performance
2. Detects drift in predictions
3. Triggers retraining when needed
4. Updates models incrementally

## Performance Considerations

### Optimization Strategies
- **Caching**: Predictions cached for 5 minutes by default
- **Batch Processing**: Process multiple constraints together
- **Lazy Loading**: Models loaded on-demand
- **Feature Reuse**: Computed features cached and reused

### Resource Management
- Maximum 10 concurrent models (configurable)
- Automatic eviction of least-used models
- Tensor cleanup after predictions
- Configurable inference timeouts

## Monitoring

### Performance Metrics
```typescript
const metrics = await modelManager.getPerformanceMetrics(
  model,
  { start: lastWeek, end: now }
);

console.log(`Accuracy: ${metrics.accuracy}`);
console.log(`Latency: ${metrics.latency}ms`);
```

### Drift Detection
```typescript
const drift = modelManager.detectDrift(model);
if (drift.detected) {
  console.log(`Drift type: ${drift.type}`);
  console.log(`Severity: ${drift.severity}`);
  console.log(`Action: ${drift.recommendation}`);
}
```

## Best Practices

1. **Feature Engineering**
   - Keep features normalized (0-1 range)
   - Include temporal context
   - Balance categorical and numerical features

2. **Model Management**
   - Set appropriate retraining thresholds
   - Monitor drift regularly
   - Keep training data diverse

3. **Integration**
   - Use high confidence thresholds (>0.8) for automated decisions
   - Always provide fallback strategies
   - Log all predictions for future training

4. **Performance**
   - Enable caching for repeated predictions
   - Use batch operations when possible
   - Clean up resources properly

## Troubleshooting

### Common Issues

1. **Low Prediction Confidence**
   - Check training data quality
   - Ensure sufficient historical examples
   - Verify feature extraction

2. **High Latency**
   - Enable prediction caching
   - Reduce model complexity
   - Use batch predictions

3. **Model Drift**
   - Review recent schedule changes
   - Update training data
   - Check for seasonal patterns

## Future Enhancements

- [ ] Support for online learning
- [ ] Multi-objective optimization
- [ ] Federated learning across conferences
- [ ] Real-time model updates
- [ ] GPU acceleration support
- [ ] Model explainability dashboard
- [ ] A/B testing framework
- [ ] Custom model architectures

## Contributing

When adding new ML capabilities:
1. Extend appropriate base classes
2. Implement standard interfaces
3. Add comprehensive tests
4. Update documentation
5. Consider backward compatibility