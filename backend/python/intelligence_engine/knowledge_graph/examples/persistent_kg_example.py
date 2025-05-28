"""
Example of using the Knowledge Graph with database persistence.

This script demonstrates how to use the Knowledge Graph with Neon DB
for persistent storage.
"""

import os
import sys
import logging
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph, Entity
from intelligence_engine.db.knowledge_graph_adapter import KnowledgeGraphAdapter
from intelligence_engine.db.config import db_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('persistent_kg_example')

def create_sample_graph():
    """Create a sample scheduling knowledge graph.
    
    Returns:
        A sample SchedulingKnowledgeGraph
    """
    # Create a new knowledge graph
    graph = SchedulingKnowledgeGraph()
    
    # Add teams
    graph.add_team("team_tigers", "Tigers", {"division": "East", "strength": 0.85})
    graph.add_team("team_lions", "Lions", {"division": "East", "strength": 0.82})
    graph.add_team("team_bears", "Bears", {"division": "West", "strength": 0.78})
    graph.add_team("team_wolves", "Wolves", {"division": "West", "strength": 0.80})
    
    # Add venues
    graph.add_venue("venue_tiger_stadium", "Tiger Stadium", {"capacity": 50000, "surface": "grass"})
    graph.add_venue("venue_lion_den", "Lion's Den", {"capacity": 45000, "surface": "turf"})
    graph.add_venue("venue_bear_cave", "Bear Cave", {"capacity": 40000, "surface": "grass"})
    graph.add_venue("venue_wolf_arena", "Wolf Arena", {"capacity": 48000, "surface": "turf"})
    
    # Set home venues
    graph.set_home_venue("team_tigers", "venue_tiger_stadium")
    graph.set_home_venue("team_lions", "venue_lion_den")
    graph.set_home_venue("team_bears", "venue_bear_cave")
    graph.set_home_venue("team_wolves", "venue_wolf_arena")
    
    # Create rivalries
    graph.create_rivalry("team_tigers", "team_lions", {"intensity": "high"})
    graph.create_rivalry("team_bears", "team_wolves", {"intensity": "high"})
    graph.create_rivalry("team_tigers", "team_bears", {"intensity": "medium"})
    
    # Add constraints
    holiday_constraint = graph.add_constraint(
        "constraint_holiday", 
        "date_constraint",
        {"date": "2023-12-25", "description": "Holiday - No Games"}
    )
    
    venue_maintenance = graph.add_constraint(
        "constraint_maintenance",
        "venue_constraint",
        {"start_date": "2023-11-15", "end_date": "2023-11-20", "description": "Venue Maintenance"}
    )
    
    # Apply constraints
    graph.apply_constraint_to_venue("constraint_maintenance", "venue_tiger_stadium")
    
    return graph

def demonstrate_persistence():
    """Demonstrate persistence of Knowledge Graph."""
    # Check for connection string
    conn_string = db_config.get_neon_db_connection_string()
    if not conn_string:
        if not os.environ.get('NEON_DB_CONNECTION_STRING'):
            logger.warning("NEON_DB_CONNECTION_STRING not set in environment, using example value")
            os.environ['NEON_DB_CONNECTION_STRING'] = "postgresql://user:password@hostname/database"
    
    # Create adapter
    adapter = KnowledgeGraphAdapter()
    
    # Create sample graph
    logger.info("Creating sample knowledge graph...")
    graph = create_sample_graph()
    
    # Store graph
    logger.info("Storing graph in database...")
    graph_id = adapter.store_graph(graph, "schedule_kg_example")
    
    if not graph_id:
        logger.error("Failed to store graph")
        return
    
    logger.info(f"Stored graph with ID: {graph_id}")
    
    # Load graph
    logger.info("Loading graph from database...")
    loaded_graph = adapter.load_graph("schedule_kg_example")
    
    if not loaded_graph:
        logger.error("Failed to load graph")
        return
    
    logger.info(f"Loaded graph with {len(loaded_graph.entities)} entities")
    
    # Verify entities
    teams = loaded_graph.query(entity_type="team")
    venues = loaded_graph.query(entity_type="venue")
    constraints = loaded_graph.query(entity_type="constraint")
    
    logger.info(f"Found {len(teams)} teams, {len(venues)} venues, and {len(constraints)} constraints")
    
    # Find relationships
    for team in teams:
        home_venue = loaded_graph.get_home_venue(team.entity_id)
        rivals = loaded_graph.get_rivals(team.entity_id)
        constraints = loaded_graph.get_team_constraints(team.entity_id)
        
        logger.info(f"Team {team.properties.get('name', team.entity_id)}:")
        logger.info(f"  Home venue: {home_venue}")
        logger.info(f"  Rivals: {rivals}")
        logger.info(f"  Constraints: {constraints}")
    
    # Verify persistence by modifying and re-storing
    logger.info("\nAdding a new team and storing the updated graph...")
    loaded_graph.add_team("team_eagles", "Eagles", {"division": "East", "strength": 0.79})
    
    updated_id = adapter.store_graph(loaded_graph, "schedule_kg_example")
    logger.info(f"Updated graph with ID: {updated_id}")
    
    # Load again to verify update
    final_graph = adapter.load_graph("schedule_kg_example")
    final_teams = final_graph.query(entity_type="team")
    logger.info(f"Final graph has {len(final_teams)} teams")
    
    # List team names
    team_names = [team.properties.get('name', team.entity_id) for team in final_teams]
    logger.info(f"Teams in final graph: {', '.join(team_names)}")
    
    return graph_id

def main():
    """Main function to run the example."""
    logger.info("Knowledge Graph Persistence Example")
    logger.info("----------------------------------")
    
    try:
        graph_id = demonstrate_persistence()
        if graph_id:
            logger.info(f"\nSuccessfully demonstrated Knowledge Graph persistence")
            logger.info(f"Graph ID: {graph_id}")
        else:
            logger.error("\nFailed to demonstrate Knowledge Graph persistence")
    except Exception as e:
        logger.exception(f"Error in demonstration: {str(e)}")

if __name__ == "__main__":
    main()