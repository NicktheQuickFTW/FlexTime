# Big12 Agent System

This directory contains the agent implementations for the Big12 Conference scheduling and data pipeline.

## Agents

### Big12DirectorAgent
- **Purpose**: Acts as the orchestrator for the entire Big12 data pipeline
- **Responsibilities**:
  - Coordinates the RAG and validation agents
  - Implements feedback loops between agents
  - Tracks performance metrics
  - Generates comprehensive reports
  - Manages agent memory and learning

### Big12RagAgent
- **Purpose**: Collects and processes Big12 schedule data
- **Responsibilities**:
  - Scrapes data from institution websites
  - Uses Claude to extract structured data
  - Stores data in the Neon DB
  - Reports success/failure metrics

### Big12ValidationAgent
- **Purpose**: Ensures data accuracy through validation
- **Responsibilities**:
  - Cross-references data from multiple sources
  - Validates schedule data using Claude
  - Assigns confidence scores to data
  - Flags potential issues for manual review
  - Generates validation reports

## Usage

These agents should be initialized through the main agent system:

```javascript
const { AgentSystem } = require('../agent_system');
const { Big12DirectorAgent, Big12RagAgent, Big12ValidationAgent } = require('./big12');
const MCPConnector = require('../mcp/mcp_connector_v2');

// Create an MCP connector
const mcpConnector = new MCPConnector({
  provider: 'anthropic',
  model: 'claude-3-opus-20240229'
});

// Create the agent system
const agentSystem = new AgentSystem({
  systemName: 'Big12AgentSystem',
  mcpConnector: mcpConnector,
  neonConnection: process.env.NEON_DB_CONNECTION_STRING
});

// Create the Big12 agents
const directorAgent = new Big12DirectorAgent(agentSystem.config, mcpConnector);
const ragAgent = new Big12RagAgent(agentSystem.config, mcpConnector);
const validationAgent = new Big12ValidationAgent(agentSystem.config, mcpConnector);

// Register the agents with the agent system
agentSystem.registerAgent(directorAgent);
agentSystem.registerAgent(ragAgent);
agentSystem.registerAgent(validationAgent);

// Start the agent system
await agentSystem.start();
```