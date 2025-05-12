"""
Test script for Machine Learning components of the HELiiX Intelligence Engine

This script tests the functionality of the Pattern Extractor and Predictive Models
by generating sample data and verifying the implementation.
"""

import sys
import os
import logging
import json
import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from intelligence_engine.ml.pattern_extractor import PatternExtractor
from intelligence_engine.ml.predictive_model import (
    create_model, 
    GameOutcomePredictor,
    ScheduleQualityPredictor,
    TeamPerformancePredictor
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('intelligence_engine.test_ml')

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

def generate_team_stats(teams: List[str]) -> Dict[str, Dict[str, Any]]:
    """Generate sample team statistics for testing."""
    team_stats = {}
    
    for team in teams:
        win_pct = random.uniform(0.2, 0.8)
        team_stats[team] = {
            "rating": random.uniform(0.3, 0.85),
            "win_streak": random.randint(0, 5),
            "winPercentage": win_pct,
            "pointsScored": random.randint(65, 95),
            "pointsAllowed": random.randint(60, 90),
            "turnoverMargin": random.uniform(-5, 5),
            "strengthOfSchedule": random.uniform(0.4, 0.7),
            "homeRecord": {"winPercentage": random.uniform(0.4, 0.9)},
            "awayRecord": {"winPercentage": random.uniform(0.2, 0.7)},
            "conferenceRecord": {"winPercentage": random.uniform(0.3, 0.8)},
            "nonConferenceRecord": {"winPercentage": random.uniform(0.3, 0.8)},
            "top25Wins": random.randint(0, 5),
            "compassIndex": random.uniform(0.3, 0.85)
        }
    
    return team_stats

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

def test_pattern_extractor():
    """Test the pattern extractor functionality."""
    logger.info("Testing Pattern Extractor...")
    
    # Generate test data
    schedule = generate_sample_schedule()
    feedback = generate_feedback_data(schedule["id"], 15)
    experiences = generate_experiences(20)
    
    # Create pattern extractor
    extractor = PatternExtractor()
    
    # Test extracting patterns from schedule
    schedule_patterns = extractor.extract_patterns_from_schedule(schedule)
    logger.info(f"Extracted {len(schedule_patterns)} patterns from schedule")
    
    if len(schedule_patterns) > 0:
        logger.info(f"Sample pattern: {schedule_patterns[0]}")
    
    # Test extracting patterns from feedback
    feedback_patterns = extractor.extract_patterns_from_feedback(feedback)
    logger.info(f"Extracted {len(feedback_patterns)} patterns from feedback")
    
    # Test extracting patterns from experiences
    experience_patterns = extractor.extract_patterns_from_experiences(experiences)
    logger.info(f"Extracted {len(experience_patterns)} patterns from experiences")
    
    # Test getting recommended parameters
    params = extractor.get_recommended_parameters("generate_schedule", "basketball")
    logger.info(f"Recommended parameters: {params}")
    
    return schedule, feedback, experiences

def test_game_outcome_predictor(schedule: Dict[str, Any], team_stats: Dict[str, Dict[str, Any]]):
    """Test the game outcome predictor."""
    logger.info("Testing Game Outcome Predictor...")
    
    # Create model
    model = create_model("game_outcome")
    
    # Extract games from schedule
    games = []
    for game_day in schedule.get("gameDays", []):
        games.extend(game_day.get("games", []))
    
    # Prepare features
    X, y, feature_names = model.prepare_features(games, team_stats)
    logger.info(f"Prepared {X.shape[0]} games with {X.shape[1]} features")
    
    # Train model
    try:
        result = model.train(X, y, feature_names)
        logger.info(f"Training result: {result}")
        
        # Test prediction on a sample game
        sample_game = games[0]
        prediction = model.predict_outcome(sample_game, team_stats)
        logger.info(f"Sample prediction: {prediction}")
        
        # Save model
        model_dir = os.path.join(os.path.dirname(__file__), "models")
        model_path = model.save(model_dir)
        logger.info(f"Model saved to: {model_path}")
        
        # Test loading the model
        new_model = create_model("game_outcome")
        new_model.load(model_path)
        logger.info(f"Model loaded successfully: {new_model.get_model_info()['name']}")
        
        return True
    except Exception as e:
        logger.error(f"Error in game outcome prediction: {str(e)}")
        return False

def test_schedule_quality_predictor():
    """Test the schedule quality predictor."""
    logger.info("Testing Schedule Quality Predictor...")
    
    # Generate multiple sample schedules
    schedules = [generate_sample_schedule() for _ in range(20)]
    
    # Create model
    model = create_model("schedule_quality")
    
    # Prepare features
    X, y, feature_names = model.prepare_features(schedules)
    logger.info(f"Prepared {X.shape[0]} schedules with {X.shape[1]} features")
    
    # Train model
    try:
        result = model.train(X, y, feature_names)
        logger.info(f"Training result: {result}")
        
        # Test prediction on a sample schedule
        sample_schedule = schedules[0]
        prediction = model.predict_quality(sample_schedule)
        logger.info(f"Sample prediction: {prediction:.4f} (Actual: {sample_schedule['metrics']['quality']:.4f})")
        
        # Save model
        model_dir = os.path.join(os.path.dirname(__file__), "models")
        model_path = model.save(model_dir)
        logger.info(f"Model saved to: {model_path}")
        
        return True
    except Exception as e:
        logger.error(f"Error in schedule quality prediction: {str(e)}")
        return False

def test_team_performance_predictor(team_stats: Dict[str, Dict[str, Any]]):
    """Test the team performance predictor."""
    logger.info("Testing Team Performance Predictor...")
    
    # Convert team stats to list format for the model
    team_data = []
    for team_id, stats in team_stats.items():
        team_data.append({
            "teamId": team_id,
            "stats": stats,
            "compassIndex": stats.get("compassIndex", 0.5)
        })
    
    # Create model
    model = create_model("team_performance")
    
    # Prepare features
    X, y, feature_names = model.prepare_features(team_data)
    logger.info(f"Prepared {X.shape[0]} teams with {X.shape[1]} features")
    
    # Train model
    try:
        result = model.train(X, y, feature_names)
        logger.info(f"Training result: {result}")
        
        # Test prediction on a sample team
        sample_team = team_data[0]
        prediction = model.predict_compass_index(sample_team)
        logger.info(f"Sample prediction: {prediction:.4f} (Actual: {sample_team['compassIndex']:.4f})")
        
        # Save model
        model_dir = os.path.join(os.path.dirname(__file__), "models")
        model_path = model.save(model_dir)
        logger.info(f"Model saved to: {model_path}")
        
        return True
    except Exception as e:
        logger.error(f"Error in team performance prediction: {str(e)}")
        return False

def create_models_directory():
    """Create models directory if it doesn't exist."""
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        logger.info(f"Created models directory: {models_dir}")
    return models_dir

def main():
    """Main entry point for the test script."""
    logger.info("Starting Machine Learning component tests...")
    
    # Create models directory
    create_models_directory()
    
    # Test pattern extractor
    schedule, feedback, experiences = test_pattern_extractor()
    
    # Extract teams from schedule
    teams = schedule.get("teams", [])
    
    # Generate team stats
    team_stats = generate_team_stats(teams)
    
    # Test predictive models
    game_model_success = test_game_outcome_predictor(schedule, team_stats)
    schedule_model_success = test_schedule_quality_predictor()
    team_model_success = test_team_performance_predictor(team_stats)
    
    # Report overall status
    if game_model_success and schedule_model_success and team_model_success:
        logger.info("✅ All ML component tests passed successfully!")
    else:
        failed_tests = []
        if not game_model_success:
            failed_tests.append("Game Outcome Predictor")
        if not schedule_model_success:
            failed_tests.append("Schedule Quality Predictor")
        if not team_model_success:
            failed_tests.append("Team Performance Predictor")
        
        logger.warning(f"❌ Some tests failed: {', '.join(failed_tests)}")

if __name__ == "__main__":
    main()