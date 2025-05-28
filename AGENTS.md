# FlexTime Agent System

## Overview

The FlexTime platform uses a sophisticated multi-agent architecture to power its intelligent sports scheduling capabilities. This document provides a comprehensive overview of the agent system, its components, and how they work together to generate optimal sports schedules for the Big 12 Conference.

## Agent Hierarchy

The FlexTime agent system is organized in a hierarchical structure:

```
Master Director Agent
├── Scheduling Director
│   ├── Algorithm Selection Agent
│   ├── Constraint Management Agent
│   ├── Schedule Optimization Agent
│   ├── Travel Optimization Agent
│   └── Sport-Specific Scheduling Agents
├── Operations Director
│   ├── Resource Allocation Agent
│   ├── Venue Management Agent
│   └── Reporting Agent
└── Analysis Director
    ├── Schedule Analysis Agent
    ├── Enhanced Schedule Analysis Agent
    └── Visualization Agent
```

## Core Components

### Director Agents

Director agents provide high-level orchestration and coordination:

| Agent | Purpose |
|-------|---------|
| Master Director Agent | Top-level coordinator for all agent activities |
| Scheduling Director | Oversees the entire scheduling process |
| Operations Director | Manages operational aspects (resources, venues) |
| Analysis Director | Coordinates analytics and insights |

### Specialized Agents

Specialized agents handle specific aspects of scheduling:

| Agent | Purpose |
|-------|---------|
| Algorithm Selection Agent | Selects optimal algorithms for scheduling tasks |
| Constraint Management Agent | Enforces scheduling constraints |
| Schedule Optimization Agent | Applies optimization algorithms |
| Travel Optimization Agent | Optimizes travel patterns and distances |
| Resource Allocation Agent | Manages resource allocation |
| Venue Management Agent | Handles venue constraints and availability |

### Sport-Specific Agents

Agents tailored to specific sports in the Big 12 Conference:

| Sport | Specialized Agents |
|-------|-------------------|
| Football | Football Constraints, Football RAG |
| Basketball | Basketball Scheduling Constraints |
| Baseball/Softball | Baseball/Softball Constraints |
| Wrestling | Wrestling Constraints |
| Soccer/Volleyball | Soccer/Volleyball Constraints |
| Tennis | Tennis Constraints |
| Gymnastics | Gymnastics Constraints |

### Intelligence and Learning

Agents that enhance the system's intelligence and learning capabilities:

| Agent | Purpose |
|-------|---------|
| Enhanced Memory Agent | Provides persistent memory across scheduling sessions |
| Knowledge Graph Agent | Maintains entity relationships |
| Conflict Resolution Agent | Detects and resolves scheduling conflicts |
| Feedback Loop System | Captures and processes feedback for continuous improvement |

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

## Integration with External Systems

The agent system integrates with several external components:

1. **MCP Integration**: Connects to Anthropic's MCP (Model Control Protocol) for enhanced reasoning
2. **Intelligence Engine**: Python-based backend for complex computations
3. **Knowledge Graph**: Entity relationship storage for semantic understanding
4. **Neon Database**: Persistent storage for schedules, teams, and venues

## Using the Agent System

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

## Continuous Learning

The agent system implements a comprehensive learning loop:

1. **Experience Collection**: Agents gather experiences during scheduling
2. **Feedback Analysis**: User feedback is analyzed to extract patterns
3. **Knowledge Building**: Patterns become scheduling knowledge
4. **Continuous Improvement**: Agents adapt behavior based on learned knowledge

## Sport-Specific RAG Agents

The system includes specialized Retrieval Augmented Generation (RAG) agents for Big 12 sports data:

| Sport | RAG Agent | Capabilities |
|-------|-----------|------------|
| Football | `FootballRagAgent` | Season structure, team data, historical matchups |
| Men's Basketball | `MensBasketballRagAgent` | Tournament schedules, team rankings |
| Women's Basketball | `WomensBasketballRagAgent` | Tournament schedules, team rankings |
| Soccer | `SoccerRagAgent` | Tournament formats, playing rules |
| Wrestling | `WrestlingRagAgent` | Championship qualification, weight classes |

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

## File Structure

The agent system is organized into logical directories:

```
/backend/agents/
├── core/                  # Core components and base classes
├── director/              # Director agent implementations
├── specialized/           # Specialized agent implementations
├── evolution/             # Self-evolution agent implementations
├── sport_specific/        # Sport-specific agent implementations
├── heliix_connector/      # Intelligence Engine connector
├── memory/                # Agent memory management
├── big12/                 # Big 12 conference specific agents
├── rag/                   # Retrieval Augmented Generation agents
└── utils/                 # Utility functions and helpers
```

## Future Development

The agent system is designed to evolve over time with:

1. Enhanced director agent capabilities
2. Additional specialized agents for new domains
3. More sophisticated evolution agents
4. Expanded sport-specific intelligence
5. Deeper integration with the Python backend