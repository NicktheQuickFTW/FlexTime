# Database Integration Components

This directory contains database adapters for the FlexTime Intelligence Engine, providing persistent storage capabilities for various components.

## Overview

The Intelligence Engine uses Neon DB (PostgreSQL) as its primary database for persistence and Notion API for accessing external data sources. The database adapters in this directory enable various components to store and retrieve data in a consistent way.

## Available Adapters

1. **NeonDBAdapter** (`neon_db_adapter.py`)
   - Core adapter for PostgreSQL database operations
   - Connection management and pooling
   - Table creation and schema management
   - CRUD operations
   - JSON data storage and querying

2. **NotionDBAdapter** (`notion_db_adapter.py`)
   - Adapter for Notion API integration
   - Database and page management
   - Query and filter operations
   - Property type handling

3. **AgentMemoryAdapter** (`agent_memory_adapter.py`)
   - Specialized adapter for agent memory persistence
   - Memory storage and retrieval
   - Memory expiration and cleanup

4. **MLModelAdapter** (`ml_model_adapter.py`)
   - Specialized adapter for ML model persistence
   - Model serialization and deserialization
   - Version management

5. **KnowledgeGraphAdapter** (`knowledge_graph_adapter.py`)
   - Specialized adapter for Knowledge Graph persistence
   - Entity and relationship storage
   - Graph querying and management

## Configuration

The database adapters are configured through the `DBConfig` class in `config.py`. Configuration can be provided through:

1. Environment variables
2. Configuration overrides in code
3. Default values

### Required Environment Variables

```
# Neon DB Configuration
NEON_DB_CONNECTION_STRING=postgresql://user:password@hostname/database

# Notion API Configuration
NOTION_API_KEY=your_notion_api_key
```

### Optional Environment Variables

```
# Connection Pool Configuration
NEON_DB_POOL_SIZE=10
NEON_DB_MAX_OVERFLOW=20
NEON_DB_POOL_TIMEOUT=30
NEON_DB_POOL_RECYCLE=1800

# Notion API Version
NOTION_API_VERSION=2022-06-28
```

## Usage Examples

### Basic NeonDB Usage

```python
from intelligence_engine.db import NeonDBAdapter

# Create adapter with connection string from environment variables
db = NeonDBAdapter()

# Create a table
schema = {
    'id': 'VARCHAR(255) NOT NULL',
    'name': 'VARCHAR(255) NOT NULL',
    'data': 'JSONB'
}
db.ensure_table('my_table', schema)

# Insert data
db.insert('my_table', {'id': '1', 'name': 'Example', 'data': {'key': 'value'}})

# Query data
results = db.query('my_table', {'name': 'Example'})
```

### Storing JSON Data

```python
from intelligence_engine.db import NeonDBAdapter

db = NeonDBAdapter()

# Store JSON data
data = {
    'config': {
        'version': '1.0',
        'settings': {
            'feature_a': True,
            'feature_b': False
        }
    }
}

# The table will be automatically created with appropriate schema
db.store_json('config_data', data, id_key='config.version')

# Retrieve JSON data
config = db.get_json('config_data', '1.0')
```

### Using Knowledge Graph Persistence

```python
from intelligence_engine.knowledge_graph import SchedulingKnowledgeGraph
from intelligence_engine.db import KnowledgeGraphAdapter

# Create a knowledge graph
graph = SchedulingKnowledgeGraph()
graph.add_team("team1", "Tigers")
graph.add_venue("venue1", "Tiger Stadium")
graph.set_home_venue("team1", "venue1")

# Store the graph
adapter = KnowledgeGraphAdapter()
graph_id = adapter.store_graph(graph, "my_graph")

# Later, load the graph
loaded_graph = adapter.load_graph("my_graph")
```

### Using the Agent Memory Adapter

```python
from intelligence_engine.db import AgentMemoryAdapter

# Create adapter
memory = AgentMemoryAdapter()

# Store a memory
memory.store_memory(
    agent_id="scheduling_agent",
    memory_type="observation",
    memory_key="team_strength",
    data={"team": "Tigers", "strength": 0.85}
)

# Retrieve memories
memories = memory.get_agent_memories(
    agent_id="scheduling_agent",
    memory_type="observation"
)
```

## Examples

For complete usage examples, see the `examples` directory:

- `config_usage.py` - Examples of database configuration and basic usage
- `knowledge_graph_example.py` - Examples of using the Knowledge Graph adapter

## Dependencies

- `psycopg2` - PostgreSQL database adapter for Python
- `requests` - HTTP library for the Notion API
- `python-dotenv` (optional) - For loading environment variables from .env files