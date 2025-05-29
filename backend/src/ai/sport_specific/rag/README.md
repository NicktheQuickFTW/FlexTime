# Sport-Specific RAG Agents

This directory contains specialized Retrieval-Augmented Generation (RAG) agents for different sports. These agents are responsible for retrieving, analyzing, and providing information specific to their respective sports.

## Available Agents

- Men's Basketball RAG Agent (MBB)
- Women's Basketball RAG Agent (WBB)
- Football RAG Agent (FBB)
- Soccer RAG Agent (SOC)
- Wrestling RAG Agent (WRES)
- Volleyball RAG Agent (VB)
- Baseball RAG Agent (BSB)
- Softball RAG Agent (SB)
- Men's Tennis RAG Agent (MTN)
- Women's Tennis RAG Agent (WTN)

## Purpose

Each sport-specific RAG agent specializes in:

1. Retrieval of sport-specific data such as team information, schedules, rankings, player stats, and game results
2. Understanding sport-specific terminology and rules
3. Applying appropriate sport-specific constraints to scheduling processes
4. Creating sport-specific recommendations for schedule optimization
5. Providing sport-specific context to other agents in the system

## Integration

These agents extend the base RAG functionality found in `/backend/agents/rag/school_data_agent.js` but are specialized for individual sports. They maintain their own vector databases of sport-specific knowledge and connect to sport-specific data sources.

## Usage

Sport-specific RAG agents should be initialized through the main agent system and can be queried by director agents when sport-specific information is needed.

```javascript
const { MensBasketballRagAgent } = require('./sport_specific/rag');
const MCPConnector = require('../mcp/mcp_connector_v2');

// Create an MCP connector
const mcpConnector = new MCPConnector({
  provider: 'anthropic',
  model: 'claude-3-opus-20240229'
});

// Initialize the agent
const mbbRagAgent = new MensBasketballRagAgent({
  mcpConnector,
  dataDirectory: path.join(__dirname, '../data/mbb')
});

// Query the agent
const response = await mbbRagAgent.query('What are the top 10 MBB teams this season?');
```