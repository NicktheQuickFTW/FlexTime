"""
Example for configuring and using database adapters.

This script demonstrates how to configure and use the database adapters
for the HELiiX Intelligence Engine.
"""

import os
import sys
import logging
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

from intelligence_engine.db.config import DBConfig, db_config
from intelligence_engine.db.neon_db_adapter import NeonDBAdapter
from intelligence_engine.db.notion_db_adapter import NotionDBAdapter
from intelligence_engine.db.agent_memory_adapter import AgentMemoryAdapter
from intelligence_engine.db.ml_model_adapter import MLModelAdapter
from intelligence_engine.db.knowledge_graph_adapter import KnowledgeGraphAdapter
from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph, Entity

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('db_example')

def setup_environment():
    """Set up environment variables for demonstration."""
    # These would normally be set in the environment or .env file
    if not os.environ.get('NEON_DB_CONNECTION_STRING'):
        logger.warning("NEON_DB_CONNECTION_STRING not set in environment, using example value")
        os.environ['NEON_DB_CONNECTION_STRING'] = "postgresql://user:password@hostname/database"
    
    if not os.environ.get('NOTION_API_KEY'):
        logger.warning("NOTION_API_KEY not set in environment, using example value")
        os.environ['NOTION_API_KEY'] = "secret_example_key"

def custom_config_example():
    """Example of creating a custom configuration."""
    # Create a custom configuration with overrides
    custom_config = DBConfig({
        'neon_db': {
            'pool_size': 5,
            'max_overflow': 10
        },
        'notion': {
            'version': '2022-06-28'
        }
    })
    
    # Access configuration values
    neon_config = custom_config.get_neon_db_config()
    notion_config = custom_config.get_notion_config()
    
    logger.info(f"Custom Neon DB config: {neon_config}")
    logger.info(f"Custom Notion config: {notion_config}")

def knowledge_graph_example():
    """Example of using the Knowledge Graph adapter."""
    # Create a knowledge graph
    graph = SchedulingKnowledgeGraph()
    
    # Add teams
    graph.add_team("team1", "Tigers")
    graph.add_team("team2", "Lions")
    graph.add_team("team3", "Bears")
    
    # Add venues
    graph.add_venue("venue1", "Tiger Stadium", {"capacity": 50000})
    graph.add_venue("venue2", "Lion's Den", {"capacity": 45000})
    
    # Set home venues
    graph.set_home_venue("team1", "venue1")
    graph.set_home_venue("team2", "venue2")
    
    # Create rivalries
    graph.create_rivalry("team1", "team2", {"intensity": "high"})
    
    # Create a Knowledge Graph adapter
    kg_adapter = KnowledgeGraphAdapter()
    
    # Store the graph
    graph_id = kg_adapter.store_graph(graph, "example_graph")
    logger.info(f"Stored graph with ID: {graph_id}")
    
    # Retrieve the graph
    retrieved_graph = kg_adapter.load_graph("example_graph")
    if retrieved_graph:
        logger.info(f"Retrieved graph with {len(retrieved_graph.entities)} entities")
        
        # Check if the rivalry was preserved
        rivals = retrieved_graph.get_rivals("team1")
        logger.info(f"Rivals of team1: {rivals}")
    
    return graph_id

def agent_memory_example():
    """Example of using the Agent Memory adapter."""
    # Create an Agent Memory adapter
    memory_adapter = AgentMemoryAdapter()
    
    # Store a memory
    memory_data = {
        "observation": "Team Tigers has a strong home field advantage",
        "confidence": 0.85,
        "source": "historical_data"
    }
    
    memory_id = memory_adapter.store_memory(
        agent_id="scheduling_agent",
        memory_type="team_observation",
        memory_key="tigers_home_advantage",
        data=memory_data
    )
    
    logger.info(f"Stored memory with ID: {memory_id}")
    
    # Retrieve memories by type
    memories = memory_adapter.get_agent_memories(
        agent_id="scheduling_agent",
        memory_type="team_observation"
    )
    
    logger.info(f"Retrieved {len(memories)} memories")
    
    return memory_id

def main():
    """Main function to run the examples."""
    setup_environment()
    
    logger.info("Running database configuration and adapter examples")
    
    # Database configuration example
    logger.info("\n--- Database Configuration Example ---")
    custom_config_example()
    
    # Knowledge Graph adapter example
    logger.info("\n--- Knowledge Graph Adapter Example ---")
    try:
        graph_id = knowledge_graph_example()
    except Exception as e:
        logger.error(f"Knowledge Graph example failed: {str(e)}")
        graph_id = None
    
    # Agent Memory adapter example
    logger.info("\n--- Agent Memory Adapter Example ---")
    try:
        memory_id = agent_memory_example()
    except Exception as e:
        logger.error(f"Agent Memory example failed: {str(e)}")
        memory_id = None
    
    logger.info("\n--- Summary ---")
    logger.info(f"Knowledge Graph ID: {graph_id}")
    logger.info(f"Agent Memory ID: {memory_id}")

if __name__ == "__main__":
    main()