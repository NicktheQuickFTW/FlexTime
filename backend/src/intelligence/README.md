# HELiiX FlexTime Agent System Architecture

## Overview

The HELiiX FlexTime Agent System provides a comprehensive multi-agent architecture that powers the FlexTime scheduling platform. This hierarchical system of intelligent agents works together to generate high-quality, constraint-satisfying schedules for collegiate sports.

## Architecture Components

The agent system consists of three primary architectural layers:

### 1. Director Agents

Director agents provide high-level orchestration and coordination:

- **Scheduling Director** - Oversees the entire scheduling process, from initial generation to final optimization
- **Operations Director** - Manages operational aspects such as resource allocation and venue management
- **Analysis Director** - Coordinates analytics, metrics, and insights about generated schedules

### 2. Specialized Agents

Specialized agents handle specific tasks within the scheduling process:

- **Algorithm Selection Agent** - Dynamically selects the optimal algorithm for each scheduling task
- **Constraint Management Agent** - Validates and enforces various types of scheduling constraints
- **Schedule Optimization Agent** - Applies optimization algorithms to improve schedule quality
- **Travel Optimization Agent** - Specifically optimizes travel patterns and distances
- **Resource Allocation Agent** - Manages venue and other resource allocation
- **Venue Management Agent** - Handles venue-specific constraints and availability

### 3. Evolution Agents

Evolution agents enable the system to improve itself over time:

- **Platform Analyzer Agent** - Continuously analyzes the platform to identify opportunities for improvement
- **Agent Generator Agent** - Automatically creates new specialized agents to address identified needs

### 4. Sport-Specific Agents

Agents tailored to the requirements of specific sports:

- **Sport-Specific RAG Agents** - Provide natural language access to sport-specific data
- **Sport-Specific Optimizers** - Apply tailored optimization strategies for each sport

### 5. Intelligence Connector Agents

Bridge the JavaScript agent system with the Python backend:

- **HELiiX Intelligence Connector Agent** - Delegates complex computational tasks to the Python backend

## Agent Communication

Agents communicate through a standardized message protocol:

```javascript
{
  messageId: 'msg_123456',
  senderId: 'scheduling_director',
  recipientId: 'algorithm_selection_agent',
  messageType: 'request',
  content: {
    // Message-specific content
  },
  timestamp: '2025-05-12T10:15:30Z',
  priority: 'high'
}
```

This enables a flexible, decoupled architecture where agents can be added or modified without disrupting the entire system.

## Usage

### Basic Usage

```javascript
const { AgentSystem } = require('./agents/core');

// Create a standard agent system
const agentSystem = new AgentSystem({
  enableMCP: true,
  enableHistoricalLearning: true
});

// Initialize the system
await agentSystem.initialize();

// Use the system
const result = await agentSystem.performTask('generate_schedule', {
  sportType: 'Football',
  teams: teams,
  constraints: constraints
});
```

### Using Specific Agents

```javascript
const { createSpecializedAgent } = require('./agents/specialized');

// Create a constraint management agent
const constraintAgent = createSpecializedAgent('constraint_management', {
  // Configuration options
}, mcpConnector);

// Initialize the agent
await constraintAgent.initialize();

// Use the agent directly
const validationResult = await constraintAgent.validateConstraints(schedule, constraints);
```

### Using the HELiiX Intelligence Connector

```javascript
const { createIntelligenceConnectorAgent } = require('./agents/heliix_connector');

// Create the Intelligence Connector agent
const intelligenceConnector = createIntelligenceConnectorAgent({
  intelligence: {
    serviceUrl: process.env.INTELLIGENCE_ENGINE_URL,
    apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
    enabled: true
  }
}, mcpConnector);

// Initialize the agent
await intelligenceConnector.initialize();

// Delegate a task to the Python backend
const result = await intelligenceConnector.delegateToIntelligenceEngine({
  taskType: 'optimize_schedule',
  parameters: {
    schedule: schedule,
    optimizationLevel: 'high'
  }
}, {
  wait: true,
  responseFormat: 'json',
  timeout: 120000
});
```

## Configuration

The agent system can be configured through environment variables or direct configuration:

```javascript
const agentSystem = new AgentSystem({
  // Core configuration
  enableMCP: true,
  enableHistoricalLearning: true,
  enableAgentMemory: true,
  logLevel: 'info',
  
  // Intelligence Engine configuration
  enableIntelligenceEngine: true,
  intelligenceEngineUrl: 'http://localhost:4001/api',
  intelligenceEngineApiKey: 'your-api-key',
  
  // Learning configuration
  feedbackAnalysisEnabled: true,
  continuousLearningEnabled: true
});
```

## Agent Factory

The `AgentFactory` provides a consistent way to create and configure agents:

```javascript
const { AgentFactory } = require('./agents/core');

// Create an agent factory
const agentFactory = new AgentFactory({
  // Factory configuration
});

// Create various agents
const schedulingDirector = agentFactory.createDirectorAgent('scheduling');
const travelOptimizer = agentFactory.createSpecializedAgent('travel_optimization');
const intelligenceConnector = agentFactory.createConnectorAgent('intelligence');

// Register the agents with the system
agentSystem.registerAgent('scheduling_director', schedulingDirector);
agentSystem.registerAgent('travel_optimizer', travelOptimizer);
agentSystem.registerAgent('intelligence_connector', intelligenceConnector);
```

## Learning Loop Integration

The agent system implements a comprehensive learning loop:

1. **Experience Collection** - Agents collect experiences during schedule generation
2. **Feedback Analysis** - User feedback is analyzed to extract patterns
3. **Knowledge Building** - Identified patterns are transformed into scheduling knowledge
4. **Continuous Improvement** - Agents adapt their behavior based on learned knowledge

This enables the system to improve over time without explicit reprogramming.

## Directory Structure

The agent system is organized into logical directories:

- `core/` - Core components and base classes
- `director/` - Director agent implementations
- `specialized/` - Specialized agent implementations
- `evolution/` - Self-evolution agent implementations
- `sport_specific/` - Sport-specific agent implementations
- `heliix_connector/` - Intelligence Engine connector implementations
- `memory/` - Agent memory management
- `utils/` - Utility functions and helpers

## Next Steps

Future developments include:

1. Enhanced director agent capabilities
2. Additional specialized agents for new domains
3. More sophisticated evolution agents
4. Expanded sport-specific intelligence
5. Deeper integration with the Python backend

For a detailed implementation plan, refer to the [executive summary](../EXECUTIVE_SUMMARY.md).