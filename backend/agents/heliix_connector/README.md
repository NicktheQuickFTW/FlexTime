# HELiiX Connector Agents

This module provides connector agents that bridge the FlexTime JavaScript agent system with the HELiiX Intelligence Engine Python backend.

## Overview

The HELiiX Connector agents serve as intermediaries between the JavaScript agent ecosystem and the Python-based HELiiX Intelligence Engine. They delegate complex computational tasks to the backend while maintaining the agent-based architecture and communication patterns.

## Available Connector Agents

### HELiiX Intelligence Connector Agent

The Intelligence Connector Agent is responsible for delegating scheduling optimization, constraint analysis, and machine learning tasks to the Python backend.

#### Key Features:
- Bridges JavaScript agents with Python backend intelligence
- Delegates complex computational tasks
- Handles asynchronous task management
- Communicates with the backend via REST API
- Provides fallback to local computation when backend is unavailable
- Formats responses for agent-to-agent communication

#### Usage:

```javascript
const { createIntelligenceConnectorAgent } = require('./agents/heliix_connector');
const { SchedulingAgentSystem } = require('./core');

// Create the scheduling system
const schedulingSystem = new SchedulingAgentSystem(config);

// Create the Intelligence Connector agent
const intelligenceConnector = createIntelligenceConnectorAgent({
  intelligence: {
    serviceUrl: 'http://localhost:4001/api',
    apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
    enabled: true
  }
}, mcpConnector);

// Initialize the agent
await intelligenceConnector.initialize();

// Register the agent with the scheduling system
schedulingSystem.registerAgent('intelligence_connector', intelligenceConnector);

// Delegate a task to the Intelligence Engine
const task = intelligenceConnector.createTask(
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
const result = await intelligenceConnector.submitTask(task);
console.log('Schedule generation result:', result);
```

## Integration with Learning Loop

The Intelligence Connector Agent plays a crucial role in the learning loop architecture, facilitating the storage of experiences and feedback:

```javascript
// Store user feedback
const feedbackTask = intelligenceConnector.createTask(
  'store_feedback',
  'Store user feedback on schedule',
  {
    feedback: {
      scheduleId: 'schedule_123',
      rating: 4.5,
      comments: 'Good schedule, but could use more balanced home/away games',
      metrics: {
        satisfaction: 0.85,
        constraints: {
          met: 45,
          violated: 3
        }
      },
      user: 'scheduler@example.com'
    }
  }
);

await intelligenceConnector.submitTask(feedbackTask);

// Store schedule generation experience
const experienceTask = intelligenceConnector.createTask(
  'store_experience',
  'Store schedule generation experience',
  {
    experience: {
      type: 'schedule_generation',
      content: {
        scheduleId: 'schedule_123',
        sportType: 'basketball',
        teamCount: 12,
        constraintCount: 48,
        algorithms: {
          generator: 'RoundRobinGenerator',
          optimizer: 'SimulatedAnnealingOptimizer'
        },
        parameters: {
          optimizationIterations: 5000,
          coolingRate: 0.98,
          initialTemperature: 100
        },
        metrics: {
          quality: 0.92,
          generationTime: 3250,
          optimizationTime: 18450
        }
      },
      tags: ['basketball', 'success', 'high_quality']
    }
  }
);

await intelligenceConnector.submitTask(experienceTask);
```

## Advanced Learning Integration

The connector can leverage the Intelligence Engine's advanced learning capabilities:

```javascript
// Get advanced learning recommendations
const learningTask = intelligenceConnector.createTask(
  'get_advanced_learning_recommendations',
  'Get optimization parameters for basketball schedule',
  {
    sportType: 'basketball',
    teams: 12,
    constraintTypes: [
      'venue_availability',
      'travel_distance',
      'rest_days',
      'home_away_balance'
    ],
    optimizationGoals: [
      'minimal_travel',
      'balanced_schedule',
      'championship_alignment'
    ]
  }
);

const recommendations = await intelligenceConnector.submitTask(learningTask);

console.log('Advanced learning recommendations:', recommendations);
```

## Backend Task Monitoring

For long-running tasks, the Intelligence Connector Agent provides methods to check task status and retrieve results:

```javascript
// Submit a task without waiting for completion
const task = intelligenceConnector.createTask(
  'delegate',
  'Generate optimized football schedule',
  {
    task: {
      taskType: 'generate_schedule',
      parameters: {
        sportType: 'football',
        // Other parameters...
      }
    },
    options: {
      wait: false // Don't wait for completion
    }
  }
);

const submitResult = await intelligenceConnector.submitTask(task);
const taskId = submitResult.taskId;

// Check status later
const statusTask = intelligenceConnector.createTask(
  'get_task_status',
  'Check schedule generation status',
  {
    taskId
  }
);

const status = await intelligenceConnector.submitTask(statusTask);

// Once complete, get the result
if (status.status === 'completed') {
  const resultTask = intelligenceConnector.createTask(
    'get_task_result',
    'Get schedule generation result',
    {
      taskId,
      options: {
        responseFormat: 'json'
      }
    }
  );
  
  const result = await intelligenceConnector.submitTask(resultTask);
  console.log('Schedule generation result:', result);
}
```

## Architecture

The HELiiX Connector agents are designed to fulfill the recommendations in the executive briefing by shifting complex scheduling intelligence to the Python backend while maintaining the agent-based architecture in the JavaScript layer:

```
JavaScript Layer                      Python Backend (HELiiX Intelligence Engine)
------------------                    ------------------------------------
                                      
Director Agents                       
  │                                   
  ├─► Specialized Agents              
  │       │                           
  │       ▼                           
  │    HELiiX Intelligence            REST      ┌─► Scheduling Intelligence
  └───► Connector Agent ◄─────────────API─────► ├─► Optimization Algorithms
          │                                     ├─► Machine Learning
          │                                     ├─► Conflict Resolution
          ▼                                     └─► Data Analytics
     Intelligence Engine Client
```

This architecture allows for a clear separation of concerns, with the JavaScript layer focusing on user interface orchestration and the Python backend handling complex computational tasks.