"""
Test script for Knowledge Graph components of the HELiiX Intelligence Engine

This script tests the functionality of the Knowledge Graph and ScheduleKnowledgeEnhancer
by creating a test graph, adding data, and performing queries.
"""

import sys
import os
import logging
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from intelligence_engine.knowledge_graph.graph_model import KnowledgeGraph, SchedulingKnowledgeGraph, Entity
from intelligence_engine.knowledge_graph.schedule_knowledge_enhancer import ScheduleKnowledgeEnhancer
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('intelligence_engine.test_kg')

def generate_sample_schedule() -> Dict[str, Any]:
    """Generate a sample basketball schedule for testing."""
    teams = [f"Team_{i}" for i in range(1, 11)]
    
    schedule = {
        "id": f"schedule_{random.randint(1000, 9999)}",
        "name": "Sample Basketball Schedule",
        "sportType": "basketball",
        "teams": teams,
        "gameCount": 45,  # Each team plays each other once
        "gameDays": [],
        "metrics": {
            "travelDistance": random.randint(5000, 15000),
            "restDays": {
                "average": random.uniform(1.5, 3.0),
                "minimum": 1
            },
            "homeAwayImbalance": random.uniform(0, 2.0),
            "maxConsecutiveHome": random.randint(1, 4),
            "maxConsecutiveAway": random.randint(1, 4),
            "quality": random.uniform(0.6, 0.95)
        }
    }
    
    # Generate game days (one game day per week for 9 weeks)
    start_date = datetime(2023, 1, 7)  # Start on a Saturday
    for week in range(9):
        game_date = start_date + timedelta(days=7 * week)
        date_str = game_date.strftime('%Y-%m-%d')
        
        games = []
        # Each game day has 5 games (all 10 teams play)
        for i in range(0, 10, 2):
            home_team = teams[i]
            away_team = teams[i+1]
            
            # Randomize which team wins for sample data
            home_win = random.random() > 0.4  # Home team has a slight advantage
            
            games.append({
                "id": f"game_{random.randint(10000, 99999)}",
                "homeTeam": home_team,
                "awayTeam": away_team,
                "homeTeamRestDays": random.randint(1, 5),
                "awayTeamRestDays": random.randint(1, 5),
                "isRivalry": random.random() > 0.8,
                "outcome": "home_win" if home_win else "away_win"
            })
        
        game_day = {
            "date": date_str,
            "games": games
        }
        
        schedule["gameDays"].append(game_day)
    
    return schedule

def generate_feedback_data(schedule_id: str, count: int = 10) -> List[Dict[str, Any]]:
    """Generate sample feedback data for testing."""
    feedback = []
    
    for i in range(count):
        feedback.append({
            "id": f"feedback_{random.randint(1000, 9999)}",
            "scheduleId": schedule_id,
            "userId": f"user_{random.randint(100, 999)}",
            "rating": random.randint(1, 5),
            "comments": random.choice([
                "Great schedule overall",
                "Too many back-to-back games",
                "Good balance of home and away games",
                "Travel distances seem excessive",
                "Perfect spacing between games"
            ]),
            "metrics": {
                "balance": random.uniform(0, 1),
                "travel": random.uniform(0, 1),
                "rest": random.uniform(0, 1)
            },
            "timestamp": datetime.now().isoformat()
        })
    
    return feedback

def generate_experiences(count: int = 10) -> List[Dict[str, Any]]:
    """Generate sample experience data for testing."""
    experiences = []
    
    exp_types = ["schedule_generation", "optimization", "constraint_validation"]
    
    for i in range(count):
        exp_type = random.choice(exp_types)
        
        if exp_type == "schedule_generation":
            content = {
                "parameters": {
                    "optimizationIterations": random.randint(100, 1000),
                    "maxConsecutiveHome": random.randint(2, 5),
                    "maxConsecutiveAway": random.randint(2, 5)
                },
                "algorithms": {
                    "generator": random.choice(["round_robin", "custom", "adaptive"])
                },
                "metrics": {
                    "quality": random.uniform(0, 1),
                    "generationTime": random.uniform(0.5, 10)
                }
            }
        elif exp_type == "optimization":
            content = {
                "parameters": {
                    "coolingRate": random.uniform(0.9, 0.999),
                    "initialTemperature": random.uniform(100, 1000),
                    "iterations": random.randint(1000, 10000)
                },
                "metrics": {
                    "improvement": random.uniform(0, 0.5),
                    "timeElapsed": random.uniform(1, 30)
                }
            }
        else:  # constraint_validation
            content = {
                "constraints": random.randint(3, 15),
                "validations": random.randint(10, 100),
                "violations": random.randint(0, 10)
            }
        
        experiences.append({
            "id": f"exp_{random.randint(1000, 9999)}",
            "type": exp_type,
            "timestamp": datetime.now().isoformat(),
            "content": content
        })
    
    return experiences

def test_knowledge_graph():
    """Test the basic Knowledge Graph functionality."""
    logger.info("Testing Knowledge Graph...")
    
    # Create a knowledge graph
    kg = KnowledgeGraph()
    
    # Add some entities
    team1 = Entity("team1", "team", {"name": "Team 1", "sportType": "basketball"})
    team2 = Entity("team2", "team", {"name": "Team 2", "sportType": "basketball"})
    venue1 = Entity("venue1", "venue", {"name": "Arena 1", "capacity": 18000})
    venue2 = Entity("venue2", "venue", {"name": "Arena 2", "capacity": 20000})
    
    kg.add_entity(team1)
    kg.add_entity(team2)
    kg.add_entity(venue1)
    kg.add_entity(venue2)
    
    # Add relationships
    kg.add_relationship("team1", "home_venue", "venue1")
    kg.add_relationship("team2", "home_venue", "venue2")
    kg.add_relationship("team1", "rival", "team2", {"intensity": 0.8})
    kg.add_relationship("team2", "rival", "team1", {"intensity": 0.8})
    
    # Test queries
    teams = kg.query("team")
    logger.info(f"Found {len(teams)} teams")
    
    # Test path query
    paths = kg.path_query("team1", "team2", max_depth=2)
    logger.info(f"Found {len(paths)} paths between Team 1 and Team 2")
    
    # Test related entities
    team1_related = kg.get_related_entities("team1")
    logger.info(f"Team 1 is related to {len(team1_related)} entities through {len(team1_related.keys())} relationship types")
    
    return kg

def test_scheduling_knowledge_graph():
    """Test the SchedulingKnowledgeGraph functionality."""
    logger.info("Testing SchedulingKnowledgeGraph...")
    
    # Create a scheduling knowledge graph
    skg = SchedulingKnowledgeGraph()
    
    # Add teams
    skg.add_team("team1", "Team 1", {"sportType": "basketball"})
    skg.add_team("team2", "Team 2", {"sportType": "basketball"})
    skg.add_team("team3", "Team 3", {"sportType": "basketball"})
    
    # Add venues
    skg.add_venue("venue1", "Arena 1", {"capacity": 18000})
    skg.add_venue("venue2", "Arena 2", {"capacity": 20000})
    
    # Add constraints
    skg.add_constraint("constraint1", "rest_days", {"minDays": 2})
    skg.add_constraint("constraint2", "travel_distance", {"maxDistance": 1500})
    
    # Set home venues
    skg.set_home_venue("team1", "venue1")
    skg.set_home_venue("team2", "venue2")
    
    # Apply constraints
    skg.apply_constraint_to_team("constraint1", "team1")
    skg.apply_constraint_to_team("constraint1", "team2")
    skg.apply_constraint_to_venue("constraint2", "venue1")
    
    # Create rivalries
    skg.create_rivalry("team1", "team2", {"intensity": 0.9})
    
    # Test specialized queries
    team1_home = skg.get_home_venue("team1")
    logger.info(f"Team 1 home venue: {team1_home}")
    
    team1_constraints = skg.get_team_constraints("team1")
    logger.info(f"Team 1 has {len(team1_constraints)} constraints")
    
    rivals = skg.get_rivals("team1")
    logger.info(f"Team 1 has {len(rivals)} rivals")
    
    return skg

def test_schedule_knowledge_enhancer():
    """Test the ScheduleKnowledgeEnhancer functionality."""
    logger.info("Testing ScheduleKnowledgeEnhancer...")
    
    # Create a scheduling knowledge graph
    skg = SchedulingKnowledgeGraph()
    
    # Create a pattern extractor
    pattern_extractor = PatternExtractor()
    
    # Create a schedule knowledge enhancer
    enhancer = ScheduleKnowledgeEnhancer(skg, pattern_extractor)
    
    # Generate sample data
    schedule = generate_sample_schedule()
    schedule_id = schedule["id"]
    feedback = generate_feedback_data(schedule_id, 15)
    experiences = generate_experiences(20)
    
    # Enhance from schedule
    schedule_stats = enhancer.enhance_from_schedule(schedule)
    logger.info(f"Enhanced from schedule: {schedule_stats}")
    
    # Enhance from feedback
    feedback_stats = enhancer.enhance_from_feedback(feedback)
    logger.info(f"Enhanced from feedback: {feedback_stats}")
    
    # Enhance from experiences
    experience_stats = enhancer.enhance_from_experiences(experiences)
    logger.info(f"Enhanced from experiences: {experience_stats}")
    
    # Query insights
    insights = enhancer.query_scheduling_insights(sport_type="basketball")
    logger.info(f"Found insights for basketball")
    
    # Count entities by type
    entity_types = {}
    for entity_id, entity in skg.entities.items():
        entity_type = entity.entity_type
        entity_types[entity_type] = entity_types.get(entity_type, 0) + 1
    
    logger.info(f"Entity types in graph: {entity_types}")
    
    return enhancer

def save_to_json(data, filename):
    """Save data to a JSON file."""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    logger.info(f"Saved data to {filepath}")

def main():
    """Main entry point for the test script."""
    logger.info("Starting Knowledge Graph component tests...")
    
    # Test the basic Knowledge Graph
    kg = test_knowledge_graph()
    
    # Test the SchedulingKnowledgeGraph
    skg = test_scheduling_knowledge_graph()
    
    # Test the ScheduleKnowledgeEnhancer
    enhancer = test_schedule_knowledge_enhancer()
    
    # Save the knowledge graph to a JSON file
    save_to_json(enhancer.graph.to_dict(), "test_knowledge_graph.json")
    
    # Query the enhanced graph
    insights = enhancer.query_scheduling_insights(sport_type="basketball")
    save_to_json(insights, "test_scheduling_insights.json")
    
    logger.info("✅ All Knowledge Graph component tests completed successfully!")

if __name__ == "__main__":
    main()