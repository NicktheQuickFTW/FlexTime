# Recruiting Agents

This directory contains specialized agents that monitor, analyze, and assist with collegiate athletic recruiting. These agents are designed to track recruits, provide insights on recruiting trends, and help athletic departments make informed decisions.

## Available Agents

Recruiting agents are available for the following sports:
- Men's Basketball (MBB)
- Women's Basketball (WBB)
- Football (FBB)
- Wrestling (WRES)

## Purpose

Each recruiting agent specializes in:

1. **Recruit Tracking**: Monitoring prospective student-athletes, their stats, rankings, and activities
2. **Data Analysis**: Evaluating recruit metrics, potential impacts, and fit with programs
3. **Trend Recognition**: Identifying patterns in recruiting by position, geography, and timing
4. **Opportunity Identification**: Flagging potential recruiting targets based on team needs
5. **Competitive Intelligence**: Analyzing recruiting activities of competing programs

## Features

- **Prospect Management**: Add and update detailed prospect profiles
- **Evaluation Tracking**: Record and analyze prospect evaluations across multiple categories
- **Interaction Logging**: Track all contact and interactions with prospects
- **Performance Analytics**: Record and analyze game/match performances
- **Compliance Tracking**: Ensure NCAA compliance with recruiting activities
- **Report Generation**: Create customized reports on recruiting activities
- **Recommendations**: Generate prospect recommendations based on team needs
- **Ranking Integration**: Import and integrate prospect rankings

## Agent Types

The following sport-specific recruiting agents are available:

### 1. Men's Basketball Recruiting Agent

Specialized agent for men's basketball recruiting:
- Basketball-specific positions and evaluation metrics
- Shooting mechanics analysis
- Performance tracking with basketball-specific statistics
- Position-based recommendations

### 2. Women's Basketball Recruiting Agent

Specialized agent for women's basketball recruiting:
- Similar to men's basketball agent with specific customizations
- Enhanced academic evaluation
- Character evaluation capabilities
- Comprehensive prospect profiles

### 3. Football Recruiting Agent

Specialized agent for football recruiting:
- Football-specific positions and evaluation metrics
- Combine/camp result tracking
- Position group analysis
- Conference-based recommendations

### 4. Wrestling Recruiting Agent

Specialized agent for wrestling recruiting:
- Weight class-based tracking and analysis
- Match and tournament performance recording
- Record calculation with win types (pins, techs, majors)
- Weight class-based recommendations

## Architecture

Recruiting agents are implemented as specialized agents extending the base Agent class. They maintain their own databases of recruit information and connect to sport-specific data sources. They work in coordination with transfer portal agents and sport-specific RAG agents to provide comprehensive recruiting insights.

## Usage

Recruiting agents can be initialized through the main agent system:

```javascript
const { createRecruitingAgent } = require('./agents/recruiting');
const MCPConnector = require('../mcp/mcp_connector_v2');

// Create an MCP connector
const mcpConnector = new MCPConnector({
  provider: 'anthropic',
  model: 'claude-3-opus-20240229'
});

// Configuration options
const config = {
  dataDirectory: path.join(__dirname, '../data/recruiting/mbb'),
  calendar: {
    contactPeriods: [
      { start: '2023-06-15', end: '2023-08-01', description: 'Summer contact period' }
    ],
    evaluationPeriods: [
      { start: '2023-04-14', end: '2023-04-16', description: 'Spring evaluation' }
    ]
  },
  dataSources: {
    rankings: 'https://example.com/rankings',
    events: 'https://example.com/events'
  }
};

// Create a sport-specific agent
const mbbAgent = createRecruitingAgent('MBB', config, mcpConnector);

// Initialize the agent
await mbbAgent.initialize();

// Add a prospect
const prospectData = {
  name: 'John Smith',
  position: 'PG',
  highSchool: 'Central High School',
  graduationYear: '2024',
  height: '6\'2"',
  weight: 185,
  stars: 4
};
const prospect = await mbbAgent.addProspect(prospectData);

// Get recruiting updates
const updates = await mbbAgent.generateReport({
  type: 'overview',
  period: 'month',
  format: 'markdown'
});
```

## Core Methods

All recruiting agents provide these basic capabilities:

### Prospect Management

```javascript
// Add a prospect to the database
const prospect = await agent.addProspect({
  name: 'Jane Smith',
  position: 'SF',
  highSchool: 'Washington High',
  graduationYear: '2025'
});

// Update a prospect's information
const updatedProspect = await agent.updateProspect(prospectId, {
  status: 'offered',
  stars: 5,
  ranking: 23
});
```

### Evaluation and Interaction Tracking

```javascript
// Record an evaluation for a prospect
const evaluation = await agent.recordEvaluation(prospectId, {
  category: 'technical',
  rating: 8,
  notes: 'Excellent skills assessment',
  evaluator: 'Coach Johnson'
});

// Log an interaction with a prospect
const interaction = await agent.logInteraction(prospectId, {
  type: 'campus_visit',
  date: '2023-06-23',
  staff: 'Coach Smith',
  notes: 'Unofficial visit, met with staff'
});
```

### Reporting and Analysis

```javascript
// Generate a recruiting report
const report = await agent.generateReport({
  type: 'overview',  // or 'prospects', 'interactions', 'evaluations', 'compliance'
  period: 'month',   // or 'day', 'week', 'year', 'all'
  format: 'markdown' // or 'json', 'text'
});

// Search for prospects by criteria
const results = await agent.searchProspects({
  position: 'PG',
  minStars: 4,
  status: 'target'
});
```

## Sport-Specific Methods

Each sport-specific agent provides additional specialized functionality:

### Men's Basketball

```javascript
// Record a game performance
const performance = await mbbAgent.recordPerformance(prospectId, {
  event: 'Summer Tournament',
  date: '2023-07-15',
  stats: { pts: 22, reb: 8, ast: 5 }
});

// Analyze shooting mechanics
const shootingAnalysis = await mbbAgent.analyzeShootingMechanics(prospectId, {
  source: 'Game Film',
  date: '2023-07-15'
});

// Find similar prospects
const similarProspects = await mbbAgent.findSimilarProspects(prospectId);
```

### Football

```javascript
// Record combine results
const combineResults = await fbbAgent.recordCombineResults(prospectId, {
  event: 'Summer Combine',
  date: '2023-06-15',
  results: { forty: 4.52, vertical: 36.5 }
});
```

### Wrestling

```javascript
// Record a match
const match = await wrestlingAgent.recordMatch(prospectId, {
  event: 'State Championship',
  opponent: 'John Doe',
  weight_class: '157',
  result: 'Win by pin'
});

// Record a tournament
const tournament = await wrestlingAgent.recordTournamentResult(prospectId, {
  tournament: 'National Prep Championships',
  weight_class: '157',
  placement: 3
});

// Calculate record
const record = await wrestlingAgent.calculateRecord(prospectId);
```

## Data Sources

Recruiting agents gather data from multiple sources to ensure comprehensive coverage:

1. National recruiting databases
2. Team news and press releases
3. Social media monitoring
4. High school/junior college statistics
5. Scouting reports and evaluations

This multi-source approach ensures that recruiting information is verified and complete.

## Data Structure

Recruiting data is stored with the following structure:

```javascript
{
  prospects: [
    {
      id: 'prospect_id',
      name: 'Prospect Name',
      position: 'Position',
      highSchool: 'High School Name',
      stars: 4,
      ranking: 56,
      status: 'target|contacted|interested|offered|committed|signed|enrolled|declined',
      metrics: { /* Sport-specific metrics */ },
      // Additional prospect attributes...
    },
    // More prospects...
  ],
  interactions: {
    'prospect_id': [
      {
        type: 'call|text|email|campus_visit|home_visit',
        date: '2023-06-15T14:30:00Z',
        staff: 'Coach Name',
        notes: 'Interaction details',
        // Additional interaction attributes...
      }
    ]
  },
  evaluations: {
    'prospect_id': {
      'category_name': [
        {
          category: 'athletic|technical|tactical|physical|character|academic',
          rating: 8,
          notes: 'Evaluation notes',
          evaluator: 'Evaluator Name',
          // Additional evaluation attributes...
        }
      ]
    }
  },
  // Sport-specific data (performances, matches, combines, etc.)
}
```

## Features

### Recruit Database
Maintains detailed profiles of prospective student-athletes, including:
- Demographics
- Academic information
- Athletic metrics
- Competition history
- Recruiting timeline
- School interest

### Recruiting Class Analysis
Evaluates the overall composition of recruiting classes, including:
- Position balance
- Skill distribution
- Geographical diversity
- Immediate vs. developmental impact

### Need-Based Targeting
Identifies recruits who match specific program needs based on:
- Roster composition 
- Graduation/departure projections
- Program style of play
- Historical success patterns

### Competitive Intelligence
Tracks and analyzes the recruiting activities of competing programs to:
- Identify shared recruiting targets
- Understand competitive positioning
- Detect emerging recruiting patterns