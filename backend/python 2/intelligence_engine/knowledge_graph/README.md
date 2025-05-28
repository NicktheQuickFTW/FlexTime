# Knowledge Graph Components

This directory contains the knowledge graph components of the FlexTime Intelligence Engine, which provide a structured representation of domain knowledge and ML-enhanced insights.

## Components Overview

### 1. Base Knowledge Graph

The base Knowledge Graph provides a generic graph structure with entities and relationships:

```python
from intelligence_engine.knowledge_graph.graph_model import KnowledgeGraph, Entity

# Create a knowledge graph
kg = KnowledgeGraph()

# Create entities
team = Entity("team1", "team", {"name": "Team 1", "sportType": "basketball"})
venue = Entity("venue1", "venue", {"name": "Arena 1", "capacity": 18000})

# Add entities to the graph
kg.add_entity(team)
kg.add_entity(venue)

# Add relationships
kg.add_relationship("team1", "home_venue", "venue1")
```

### 2. Scheduling Knowledge Graph

A specialized version of the Knowledge Graph for the scheduling domain:

```python
from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph

# Create a scheduling knowledge graph
skg = SchedulingKnowledgeGraph()

# Add teams and venues
skg.add_team("team1", "Team 1", {"sportType": "basketball"})
skg.add_venue("venue1", "Arena 1", {"capacity": 18000})

# Set home venue
skg.set_home_venue("team1", "venue1")

# Create rivalries
skg.create_rivalry("team1", "team2", {"intensity": 0.9})
```

### 3. Schedule Knowledge Enhancer

The Schedule Knowledge Enhancer integrates ML-driven insights into the Knowledge Graph:

```python
from intelligence_engine.knowledge_graph.schedule_knowledge_enhancer import ScheduleKnowledgeEnhancer
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Create a knowledge enhancer
enhancer = ScheduleKnowledgeEnhancer(skg, PatternExtractor())

# Enhance from schedule data
stats = enhancer.enhance_from_schedule(schedule)

# Query scheduling insights
insights = enhancer.query_scheduling_insights(sport_type="basketball")
```

## API Integration

The Knowledge Graph components are exposed through a RESTful API:

- `GET /api/kg/status` - Get the status of the knowledge graph
- `POST /api/kg/enhance/schedule` - Enhance from schedule data
- `POST /api/kg/enhance/feedback` - Enhance from feedback data
- `POST /api/kg/enhance/experiences` - Enhance from experience data
- `GET /api/kg/insights` - Get scheduling insights
- `POST /api/kg/entity` - Add an entity to the graph
- `GET /api/kg/entity/<entity_id>` - Get an entity from the graph
- `POST /api/kg/relationship` - Add a relationship between entities
- `POST /api/kg/query` - Query entities by type and properties
- `POST /api/kg/path` - Find paths between entities

## Testing

Two test scripts are available:

1. **Python Test Script** - Tests the Knowledge Graph components directly:

```bash
python intelligence_engine/knowledge_graph/test_kg.py
```

2. **JavaScript Test Script** - Tests the API integration:

```bash
node scripts/test-kg-components.js
```

## Entity Types

The Knowledge Graph supports various entity types:

- `team` - Sports teams
- `venue` - Sports venues
- `constraint` - Scheduling constraints
- `task_type` - Types of scheduling tasks
- `algorithm` - Scheduling algorithms
- `workload_insight` - Insights about team workload
- `balance_insight` - Insights about home/away balance
- `frequency_insight` - Insights about game day frequency
- `streak_insight` - Insights about game streaks
- `schedule_insight` - Composite insights about schedules

## Relationship Types

Various relationship types connect entities:

- `home_venue` - Links a team to its home venue
- `rivalry` - Links rival teams
- `applies_to` - Links a constraint to a team or venue
- `optimal_workload` - Links a team to a workload insight
- `home_away_balance` - Links a team to a balance insight
- `optimal_parameter` - Links a task type to optimal parameters
- `preferred_algorithm` - Links a task type to a preferred algorithm

## Integration with ML

The Knowledge Graph integrates with the Machine Learning components:

1. Extracts patterns from schedules, feedback, and experiences using the Pattern Extractor
2. Enhances the graph with ML-driven insights
3. Provides optimized scheduling parameters based on accumulated knowledge