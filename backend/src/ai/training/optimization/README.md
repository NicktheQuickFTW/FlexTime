# Optimization System

The Optimization System provides a framework for automatically optimizing agent parameters and strategies based on evaluation results. It uses various optimization strategies to continuously improve agent performance over time.

## Features

- **Multiple Optimization Strategies**: Supports various optimization approaches including incremental, Bayesian, genetic, and reinforcement learning.
- **Parameter Optimization**: Tunes numerical and categorical parameters to improve specific metrics.
- **Strategy Optimization**: Switches between different agent strategies based on performance.
- **Improvement Estimation**: Estimates the potential impact of each optimization change.
- **Historical Tracking**: Maintains a history of optimization changes and their impacts.
- **Agent-Type Specific Schemas**: Uses specialized schemas for different agent types.

## Optimization Targets

The system can optimize these aspects of agents:

| Target | Description |
|--------|-------------|
| Parameters | Numerical and categorical configuration values that affect agent behavior |
| Strategies | High-level algorithmic approaches that agents use to solve problems |
| Schemas | Data structures and models that agents use to interpret information |

## Optimization Strategies

| Strategy | Description |
|----------|-------------|
| Incremental | Makes small, targeted changes based on evaluation metrics |
| Bayesian | Builds a probabilistic model of parameter impacts (placeholder implementation) |
| Genetic | Uses evolutionary algorithms to explore parameter space (placeholder implementation) |
| Reinforcement | Uses reinforcement learning to optimize over time (placeholder implementation) |

## Usage

```javascript
// Initialize optimization system
const OptimizationSystem = require('./optimization_system');

const optimizationSystem = new OptimizationSystem({
  targets: ['parameters', 'strategies'],
  strategy: 'incremental',
  learningRate: 0.1
});

await optimizationSystem.initialize();

// Register an agent
await optimizationSystem.registerAgent(agent);

// Optimize agent based on evaluation results
const optimizationResults = await optimizationSystem.optimizeAgent(
  agent,
  evaluationResults,
  {
    targets: ['parameters', 'strategies'],
    strategy: 'incremental',
    applyChanges: true
  }
);

// Get optimization history
const history = await optimizationSystem.getOptimizationHistory(agentId);
```

## Configuration

The system supports these configuration options:

```javascript
{
  // Optimization targets
  targets: ['parameters', 'strategies', 'schemas'],
  
  // Optimization strategy
  strategy: 'incremental',  // 'incremental', 'bayesian', 'genetic', or 'reinforcement'
  
  // Learning configuration
  learningRate: 0.1,  // Size of adjustments (0.0 to 1.0)
  explorationRate: 0.2,  // Probability of trying new options (0.0 to 1.0)
  
  // Improvement thresholds
  minImprovement: 0.5,  // Minimum % improvement to apply changes
  significantImprovement: 5.0,  // % improvement considered significant
  
  // Data storage
  dataDirectory: '/path/to/optimizations',
  
  // History settings
  historyLength: 10  // Number of optimization results to keep in memory
}
```

## Integration with Training Pipeline

The Optimization System integrates with the TrainingPipeline by:

1. Registering agents through the pipeline's `registerAgent` method
2. Receiving evaluation results from the EvaluationFramework
3. Applying optimizations to improve agent performance
4. Providing optimization results for the pipeline's reporting

## Agent-Specific Schemas

The system includes default schemas for different agent types:

- **Generic Agents**: Basic parameters and strategies applicable to all agents
- **Specialized Agents**: Parameters for specialized processing and analysis
- **Director Agents**: Parameters for delegation and coordination
- **Scheduling Agents**: Parameters for scheduling optimization and constraint handling
- **RAG Agents**: Parameters for retrieval and generation

## Change Application

When changes are applied to an agent:

1. The system calls the agent's `updateParameters` or `updateStrategies` methods
2. Changes are tracked in the optimization history
3. The system estimates the improvement based on the changes
4. Subsequent evaluations measure the actual impact of these changes