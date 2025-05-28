# Conflict Resolution Components

This directory contains the conflict resolution components of the FlexTime Intelligence Engine, which provide comprehensive conflict analysis, resolution, and visualization capabilities.

## Components Overview

### 1. Conflict Analyzer

The Conflict Analyzer identifies and analyzes scheduling conflicts:

```python
from intelligence_engine.conflict_resolution.conflict_analyzer import ConflictAnalyzer
from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Create a conflict analyzer
analyzer = ConflictAnalyzer(
    SchedulingKnowledgeGraph(),
    PatternExtractor()
)

# Analyze a schedule for conflicts
analysis = analyzer.analyze_schedule_conflicts(schedule)

# Generate a resolution plan
plan = analyzer.generate_resolution_plan(analysis)

# Automatically resolve conflicts
result = analyzer.resolve_conflicts_automatically(schedule, analysis)
```

### 2. Conflict Visualizer

The Conflict Visualizer creates visual representations of conflicts and resolution plans:

```python
from intelligence_engine.conflict_resolution.conflict_visualizer import ConflictVisualizer

# Create a conflict visualizer
visualizer = ConflictVisualizer()

# Visualize conflicts
conflict_visuals = visualizer.visualize_conflicts(analysis)

# Visualize a resolution plan
plan_visuals = visualizer.visualize_resolution_plan(plan)
```

## API Integration

The Conflict Resolution components are exposed through a RESTful API:

- `POST /api/conflict/analyze` - Analyze a schedule for conflicts
- `POST /api/conflict/resolve` - Generate a resolution plan for conflicts
- `POST /api/conflict/resolve/auto` - Automatically resolve conflicts
- `POST /api/conflict/visualize` - Generate visualizations for conflicts
- `POST /api/conflict/visualize/plan` - Generate visualizations for a resolution plan

## Testing

Two test scripts are available:

1. **Python Test Script** - Tests the Conflict Resolution components directly:

```bash
python intelligence_engine/conflict_resolution/test_conflict.py
```

2. **JavaScript Test Script** - Tests the API integration:

```bash
node scripts/test-conflict-resolution.js
```

## Conflict Types

The system identifies and resolves various types of conflicts:

- `rest_days` - Insufficient rest days between games
- `travel_distance` - Excessive travel distance between games
- `venue_availability` - Double-booking of venues
- `team_availability` - Team scheduling conflicts
- `home_away_balance` - Imbalance in home/away games
- `rivalry_spacing` - Poorly spaced rivalry games
- `consecutive_games` - Too many consecutive home/away games
- `championship_alignment` - Conflicts with championship dates
- `constraint_conflict` - General constraint violations

## Visualization Types

The system generates various types of visualizations:

- `calendar` - Calendar view of rest day conflicts
- `map` - Geographic map of travel distance conflicts
- `schedule` - Schedule view of venue conflicts
- `chart` - Bar chart of home/away balance
- `timeline` - Timeline view of consecutive games
- `text` - Text-based description of conflicts

## Integration with Knowledge Graph and ML

The Conflict Resolution components integrate with:

1. **Knowledge Graph** - Leverages domain knowledge for conflict analysis
2. **Pattern Extractor** - Uses ML-driven patterns to identify potential conflicts
3. **Team and Venue Entities** - References entities in the knowledge graph

## Resolution Types

The system supports various resolution strategies:

- `move_game` - Move games to different dates
- `swap_home_away` - Swap home/away status between games
- `adjust_dates` - Adjust game dates to resolve conflicts
- `change_venue` - Change venues to resolve conflicts