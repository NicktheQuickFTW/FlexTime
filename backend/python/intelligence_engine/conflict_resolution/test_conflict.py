"""
Test script for Conflict Resolution components of the HELiiX Intelligence Engine

This script tests the functionality of the Conflict Analyzer and Conflict Visualizer
by creating test schedules with conflicts and analyzing them.
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

from intelligence_engine.conflict_resolution.conflict_analyzer import ConflictAnalyzer
from intelligence_engine.conflict_resolution.conflict_visualizer import ConflictVisualizer
from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('intelligence_engine.test_conflict')

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
        },
        "config": {
            "maxConsecutiveHome": 3,
            "maxConsecutiveAway": 3,
            "minRestDays": 1
        }
    }
    
    # Generate game days (one game day per week for 9 weeks)
    start_date = datetime(2023, 1, 7)  # Start on a Saturday
    
    # Add some normal games
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
    
    # Add conflicts for testing
    
    # 1. Add a rest day conflict (less than 1 day rest)
    rest_conflict_date = start_date + timedelta(days=1)  # Day after first game
    rest_conflict_date_str = rest_conflict_date.strftime('%Y-%m-%d')
    
    rest_conflict_game = {
        "id": f"conflict_game_1",
        "homeTeam": teams[0],  # Team that already played on the first day
        "awayTeam": teams[2],
        "homeTeamRestDays": 0,
        "awayTeamRestDays": 1,
        "isRivalry": False,
        "outcome": "unknown"
    }
    
    rest_conflict_day = {
        "date": rest_conflict_date_str,
        "games": [rest_conflict_game]
    }
    
    schedule["gameDays"].append(rest_conflict_day)
    
    # 2. Add a venue conflict (two games at the same venue on the same day)
    venue_conflict_date = start_date + timedelta(days=14)  # Third week
    venue_conflict_date_str = venue_conflict_date.strftime('%Y-%m-%d')
    
    # Find the game day for this date
    for game_day in schedule["gameDays"]:
        if game_day["date"] == venue_conflict_date_str:
            # Add another game with the same home team (venue)
            conflict_game = {
                "id": f"conflict_game_2",
                "homeTeam": game_day["games"][0]["homeTeam"],  # Same home team (venue)
                "awayTeam": teams[8],
                "homeTeamRestDays": 3,
                "awayTeamRestDays": 2,
                "isRivalry": False,
                "outcome": "unknown"
            }
            
            game_day["games"].append(conflict_game)
            break
    
    # 3. Add home/away imbalance for a team
    imbalance_team = teams[3]
    
    # Make all games for this team home games
    for game_day in schedule["gameDays"]:
        for game in game_day["games"]:
            if game["awayTeam"] == imbalance_team:
                # Swap home and away
                temp = game["homeTeam"]
                game["homeTeam"] = game["awayTeam"]
                game["awayTeam"] = temp
    
    # 4. Add consecutive home games conflict
    consecutive_home_team = teams[5]
    consecutive_dates = []
    
    # First find 4 consecutive dates
    for i in range(4):
        consecutive_date = start_date + timedelta(days=28 + i * 7)  # Start at week 5
        consecutive_dates.append(consecutive_date.strftime('%Y-%m-%d'))
    
    # Add a game for each consecutive date
    for date_str in consecutive_dates:
        # See if game day exists
        game_day_exists = False
        for game_day in schedule["gameDays"]:
            if game_day["date"] == date_str:
                game_day_exists = True
                
                # Make sure team is not already playing on this day
                team_playing = False
                for game in game_day["games"]:
                    if game["homeTeam"] == consecutive_home_team or game["awayTeam"] == consecutive_home_team:
                        team_playing = True
                        # If away, make it home
                        if game["awayTeam"] == consecutive_home_team:
                            temp = game["homeTeam"]
                            game["homeTeam"] = game["awayTeam"]
                            game["awayTeam"] = temp
                        break
                
                if not team_playing:
                    # Add a new game with the team as home
                    new_game = {
                        "id": f"consecutive_game_{date_str}",
                        "homeTeam": consecutive_home_team,
                        "awayTeam": teams[7],
                        "homeTeamRestDays": 3,
                        "awayTeamRestDays": 2,
                        "isRivalry": False,
                        "outcome": "unknown"
                    }
                    game_day["games"].append(new_game)
                
                break
        
        if not game_day_exists:
            # Create a new game day
            new_game = {
                "id": f"consecutive_game_{date_str}",
                "homeTeam": consecutive_home_team,
                "awayTeam": teams[7],
                "homeTeamRestDays": 3,
                "awayTeamRestDays": 2,
                "isRivalry": False,
                "outcome": "unknown"
            }
            
            new_game_day = {
                "date": date_str,
                "games": [new_game]
            }
            
            schedule["gameDays"].append(new_game_day)
    
    # Sort game days by date
    schedule["gameDays"] = sorted(schedule["gameDays"], key=lambda d: d["date"])
    
    return schedule

def test_conflict_analyzer():
    """Test the ConflictAnalyzer."""
    logger.info("Testing Conflict Analyzer...")
    
    # Create a knowledge graph
    kg = SchedulingKnowledgeGraph()
    
    # Create a pattern extractor
    pattern_extractor = PatternExtractor()
    
    # Create a conflict analyzer
    analyzer = ConflictAnalyzer(kg, pattern_extractor)
    
    # Generate a sample schedule with conflicts
    schedule = generate_sample_schedule()
    
    # Analyze the schedule for conflicts
    analysis = analyzer.analyze_schedule_conflicts(schedule)
    
    # Log the conflicts found
    logger.info(f"Found {analysis['statistics']['total']} conflicts in the schedule")
    
    for severity, count in analysis['statistics']['by_severity'].items():
        logger.info(f"  {severity}: {count}")
    
    for conflict_type, count in analysis['statistics']['by_type'].items():
        logger.info(f"  {conflict_type}: {count}")
    
    # Generate a resolution plan
    plan = analyzer.generate_resolution_plan(analysis)
    
    logger.info(f"Generated resolution plan with {plan['total_steps']} steps")
    
    # Auto-resolve conflicts
    result = analyzer.resolve_conflicts_automatically(schedule, analysis)
    
    logger.info(f"Auto-resolved {result['conflicts_resolved']} conflicts with {result['changes_made']} changes")
    
    return analyzer, schedule, analysis, plan, result

def test_conflict_visualizer():
    """Test the ConflictVisualizer."""
    logger.info("Testing Conflict Visualizer...")
    
    # Create a conflict visualizer
    visualizer = ConflictVisualizer()
    
    # Get analysis and plan from the analyzer test
    _, _, analysis, plan, _ = test_conflict_analyzer()
    
    # Generate visualizations for conflicts
    conflict_visualizations = visualizer.visualize_conflicts(analysis)
    
    logger.info(f"Generated {conflict_visualizations['count']} visualizations for conflicts")
    
    # Generate visualizations for the resolution plan
    plan_visualizations = visualizer.visualize_resolution_plan(plan)
    
    logger.info(f"Generated {plan_visualizations['count']} visualizations for the resolution plan")
    
    return visualizer, conflict_visualizations, plan_visualizations

def save_to_json(data, filename):
    """Save data to a JSON file."""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    logger.info(f"Saved data to {filepath}")

def main():
    """Main entry point for the test script."""
    logger.info("Starting Conflict Resolution component tests...")
    
    # Test the conflict analyzer
    analyzer, schedule, analysis, plan, result = test_conflict_analyzer()
    
    # Test the conflict visualizer
    visualizer, conflict_visualizations, plan_visualizations = test_conflict_visualizer()
    
    # Save test data to JSON files
    save_to_json(schedule, "test_schedule_with_conflicts.json")
    save_to_json(analysis, "test_conflict_analysis.json")
    save_to_json(plan, "test_resolution_plan.json")
    save_to_json(result['schedule'], "test_resolved_schedule.json")
    save_to_json(conflict_visualizations, "test_conflict_visualizations.json")
    save_to_json(plan_visualizations, "test_plan_visualizations.json")
    
    logger.info("✅ All Conflict Resolution component tests completed successfully!")

if __name__ == "__main__":
    main()