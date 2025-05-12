# Transfer Portal Agents

This directory contains specialized agents that monitor and analyze the NCAA Transfer Portal for various sports. These agents are designed to track player movements, provide insights on transfer trends, and help athletic departments make informed decisions.

## Available Agents

Transfer portal agents are available for the following sports:
- Men's Basketball (MBB)
- Women's Basketball (WBB)
- Football (FBB)
- Soccer (SOC)
- Women's Soccer (WSOC)
- Wrestling (WRES)
- Volleyball (VB) - *Planned*
- Baseball (BSB) - *Planned*
- Softball (SB) - *Planned*
- Men's Tennis (MTN) - *Planned*
- Women's Tennis (WTN) - *Planned*

## Purpose

Each transfer portal agent specializes in:

1. **Data Collection**: Regularly monitoring transfer portal entries and exits
2. **Player Analysis**: Evaluating player statistics, potential impacts, and fit with programs
3. **Trend Recognition**: Identifying patterns in transfer behavior by conference, position, and timing
4. **Opportunity Identification**: Flagging potential transfer targets based on team needs
5. **Impact Assessment**: Analyzing how transfers affect team dynamics and performance metrics

## Features

- **Player Tracking**: Monitor player entries, commitments, and withdrawals from the transfer portal
- **Transfer Analytics**: Analyze trends by position, school, and conference
- **Performance Metrics**: Track and analyze player statistics and performance
- **Impact Analysis**: Measure the impact of transfers on institutions
- **Reporting**: Generate comprehensive reports on transfer activity

## Agent Implementations

### 1. Base Transfer Portal Agent

Core functionality for all transfer portal agents:
- Common data structures for tracking players and institutions
- Search and filtering capabilities
- Report generation
- Institution impact analysis

### 2. Men's Basketball Transfer Portal Agent

Specialized agent for tracking men's basketball transfer portal activity:
- Basketball-specific positions (PG, SG, SF, PF, C)
- Relevant player metrics (ppg, rpg, apg, etc.)
- Position trend analysis

### 3. Women's Basketball Transfer Portal Agent

Specialized agent for tracking women's basketball transfer portal activity:
- Features similar to the men's basketball agent
- Academic performance reporting
- Program-specific analysis

### 4. Football Transfer Portal Agent

Specialized agent for tracking football transfer portal activity:
- Football-specific positions (QB, RB, WR, OL, DL, etc.)
- Position group analysis
- Conference movement tracking

### 5. Wrestling Transfer Portal Agent

Specialized agent for tracking wrestling transfer portal activity:
- NCAA weight classes (125, 133, 141, etc.)
- Performance metrics (record, pins, tech falls)
- Weight class trend analysis

### 6. Soccer Transfer Portal Agent

Specialized agent for tracking soccer transfer portal activity:
- Supports both men's and women's soccer
- Soccer-specific positions (GK, DEF, MID, FWD)
- Offensive production analysis

## Architecture

Transfer portal agents are implemented as specialized agents extending the base Agent class. They maintain their own databases of transfer information and connect to sport-specific data sources. They work in coordination with recruiting agents and sport-specific RAG agents to provide comprehensive player movement insights.

## Usage

Transfer portal agents can be initialized through the main agent system:

```javascript
const { createTransferPortalAgent } = require('./agents/transfer_portal');
const MCPConnector = require('../mcp/mcp_connector_v2');

// Create an MCP connector
const mcpConnector = new MCPConnector({
  provider: 'anthropic',
  model: 'claude-3-opus-20240229'
});

// Configuration options
const config = {
  dataDirectory: path.join(__dirname, '../data/transfer/mbb'),
  windows: {
    fall: { start: 'October 1', end: 'January 15' },
    spring: { start: 'May 1', end: 'May 15' }
  },
  dataSources: {
    portal: 'https://example.com/portal',
    rankings: 'https://example.com/rankings',
    news: 'https://example.com/news'
  }
};

// Initialize the agent
const mbbAgent = createTransferPortalAgent('MBB', config, mcpConnector);
await mbbAgent.initialize();

// Check for updates
const updates = await mbbAgent.checkForUpdates();
console.log(`${updates.newEntries.length} new entries found`);

// Generate a report
const report = await mbbAgent.generateReport({
  type: 'summary',
  period: 'month',
  format: 'markdown'
});
```

## API Reference

### Base Methods

- `initialize()`: Set up the agent and load existing data
- `checkForUpdates(options)`: Look for new transfer portal activity
- `addPlayer(playerData)`: Add a new player to the transfer portal
- `updatePlayerStatus(playerId, updateData)`: Update an existing player's status
- `searchPlayers(filters)`: Search for players matching specific criteria
- `getInstitutionStats(institution)`: Get statistics for a specific institution
- `generateReport(options)`: Generate a report on transfer activity

### Sport-Specific Methods

Different agent implementations provide specialized methods:

#### Basketball
- `updatePlayerStats(playerId)`: Update player statistics
- `analyzePositionTrends()`: Analyze trends by position

#### Football
- `analyzeConferenceMovements()`: Track player movements between conferences
- `analyzePositionTrends()`: Analyze trends by position group

#### Wrestling
- `analyzeWeightClassTrends()`: Analyze trends by weight class
- `analyzePerformanceMetrics()`: Analyze performance statistics

#### Soccer
- `analyzeOffensiveProduction()`: Analyze offensive statistics and productivity

## Data Structure

Transfer portal data is stored with the following structure:

```javascript
{
  players: [
    {
      id: 'player_id',
      name: 'Player Name',
      position: 'Position',
      previousSchool: 'Previous School',
      newSchool: 'New School',
      status: 'entered|committed|withdrawn|unsigned',
      eligibility: 'Eligibility Year',
      enteredDate: '2023-04-15T12:00:00Z',
      commitmentDate: '2023-05-01T14:30:00Z',
      stats: { /* Sport-specific stats */ },
      ranking: 25,
      lastUpdated: '2023-05-01T14:30:00Z'
    },
    // More players...
  ],
  institutions: {
    'school_name': {
      entrances: [ /* Players who left this school */ ],
      commitments: [ /* Players who committed to this school */ ]
    },
    // More institutions...
  },
  trends: {
    byPosition: { /* Position-based trends */ },
    byConference: { /* Conference-based trends */ },
    byMonth: { /* Monthly trends */ }
  },
  lastUpdated: '2023-05-10T09:15:00Z'
}
```

## Data Sources

Transfer portal agents gather data from multiple sources to ensure comprehensive coverage:

1. NCAA Transfer Portal Database (accessed via appropriate APIs)
2. Team news and press releases
3. Social media monitoring
4. National recruiting databases
5. Conference and team websites

This multi-source approach ensures that transfer information is verified and complete.

## Extension

To create a new sport-specific transfer portal agent:

1. Extend the `BaseTransferPortalAgent` class
2. Define sport-specific positions, metrics, and eligibility options
3. Implement the `checkForUpdates()` method to fetch sport-specific data
4. Add specialized analysis methods for the sport
5. Register the agent in the `createTransferPortalAgent()` factory function