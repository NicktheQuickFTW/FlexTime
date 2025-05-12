"""
Schedule Generator for the HELiiX Intelligence Engine

This module provides functionality for generating sports schedules.
"""

import logging
import random
from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger('intelligence_engine.scheduling.generator')

class ScheduleGenerator:
    """Base class for schedule generators."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the schedule generator.
        
        Args:
            config: Configuration options
        """
        self.config = config or {}
    
    def generate(self, teams: List[Dict[str, Any]], constraints: List[Dict[str, Any]], 
                options: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a schedule.
        
        Args:
            teams: List of teams
            constraints: List of constraints
            options: Generation options
            
        Returns:
            Generated schedule
        """
        raise NotImplementedError("Subclasses must implement this method")


class RoundRobinGenerator(ScheduleGenerator):
    """Generates schedules using a round-robin algorithm."""
    
    def generate(self, teams: List[Dict[str, Any]], constraints: List[Dict[str, Any]], 
                options: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a round-robin schedule.
        
        Args:
            teams: List of teams
            constraints: List of constraints
            options: Generation options
            
        Returns:
            Generated schedule
        """
        logger.info(f"Generating round-robin schedule for {len(teams)} teams")
        
        # Extract options
        season = options.get('season', '2025-2026')
        start_date_str = options.get('startDate', '2025-09-01')
        end_date_str = options.get('endDate', '2026-05-31')
        
        # Parse dates
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        
        # Create team rotation
        team_ids = [team['teamId'] for team in teams]
        rotation = team_ids.copy()
        
        if len(rotation) % 2 == 1:
            # Add a "bye" team if there's an odd number of teams
            rotation.append(None)
        
        n = len(rotation)
        game_days = []
        current_date = start_date
        
        # Generate the round-robin pairings
        for round_num in range(n - 1):
            games = []
            
            # Create pairings for this round
            for i in range(n // 2):
                team1 = rotation[i]
                team2 = rotation[n - 1 - i]
                
                if team1 is not None and team2 is not None:
                    # Alternate home/away based on round number
                    if round_num % 2 == 0:
                        home_team, away_team = team1, team2
                    else:
                        home_team, away_team = team2, team1
                    
                    games.append({
                        'homeTeam': home_team,
                        'awayTeam': away_team,
                        'date': current_date.strftime('%Y-%m-%d')
                    })
            
            game_days.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'games': games
            })
            
            # Rotate teams (keeping the first team fixed)
            rotation = [rotation[0]] + [rotation[-1]] + rotation[1:-1]
            
            # Move to next game day (add 7 days)
            current_date += timedelta(days=7)
            
            # Don't go past the end date
            if current_date > end_date:
                break
        
        # Build the schedule object
        schedule = {
            'type': 'schedule',
            'sportType': options.get('sportType', 'generic'),
            'season': season,
            'teams': team_ids,
            'gameDays': game_days,
            'gameCount': sum(len(day['games']) for day in game_days),
            'startDate': start_date_str,
            'endDate': end_date_str,
            'generatedAt': datetime.now().isoformat(),
            'metrics': {
                'quality': 0.8,  # Placeholder
                'constraints': {
                    'satisfied': 10,  # Placeholder
                    'violated': 2      # Placeholder
                }
            }
        }
        
        logger.info(f"Generated schedule with {schedule['gameCount']} games")
        
        return schedule


class BasketballScheduleGenerator(ScheduleGenerator):
    """Generates basketball schedules with sport-specific rules."""
    
    def generate(self, teams: List[Dict[str, Any]], constraints: List[Dict[str, Any]], 
                options: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a basketball schedule.
        
        Args:
            teams: List of teams
            constraints: List of constraints
            options: Generation options
            
        Returns:
            Generated schedule
        """
        logger.info(f"Generating basketball schedule for {len(teams)} teams")
        
        # Extract options
        season = options.get('season', '2025-2026')
        start_date_str = options.get('startDate', '2025-11-01')
        end_date_str = options.get('endDate', '2026-03-15')
        conference_games_per_team = options.get('conferenceGamesPerTeam', 18)
        
        # Parse dates
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        
        # Create team rotation
        team_ids = [team['teamId'] for team in teams]
        
        # Generate games
        games = []
        current_date = start_date
        
        # Simple algorithm: create a double round-robin for conference games
        for home_team in team_ids:
            for away_team in team_ids:
                if home_team != away_team:
                    # Add a home game
                    games.append({
                        'homeTeam': home_team,
                        'awayTeam': away_team,
                        'date': current_date.strftime('%Y-%m-%d'),
                        'type': 'conference'
                    })
                    
                    # Move to next game day
                    current_date += timedelta(days=3)
                    
                    # Reset if we've gone past the end date
                    if current_date > end_date:
                        current_date = start_date + timedelta(days=random.randint(1, 10))
        
        # Organize games by date
        games_by_date = {}
        for game in games:
            date = game['date']
            if date not in games_by_date:
                games_by_date[date] = []
            games_by_date[date].append(game)
        
        game_days = [
            {'date': date, 'games': games}
            for date, games in sorted(games_by_date.items())
        ]
        
        # Build the schedule object
        schedule = {
            'type': 'schedule',
            'sportType': 'basketball',
            'season': season,
            'teams': team_ids,
            'gameDays': game_days,
            'gameCount': len(games),
            'startDate': start_date_str,
            'endDate': end_date_str,
            'generatedAt': datetime.now().isoformat(),
            'metrics': {
                'quality': 0.75,  # Placeholder
                'constraints': {
                    'satisfied': 15,  # Placeholder
                    'violated': 5     # Placeholder
                },
                'travelDistance': 25000,  # Placeholder
                'restDays': {
                    'average': 2.5,   # Placeholder
                    'minimum': 1      # Placeholder
                }
            }
        }
        
        logger.info(f"Generated basketball schedule with {schedule['gameCount']} games")
        
        return schedule


class FootballScheduleGenerator(ScheduleGenerator):
    """Generates football schedules with sport-specific rules."""
    
    def generate(self, teams: List[Dict[str, Any]], constraints: List[Dict[str, Any]], 
                options: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a football schedule.
        
        Args:
            teams: List of teams
            constraints: List of constraints
            options: Generation options
            
        Returns:
            Generated schedule
        """
        logger.info(f"Generating football schedule for {len(teams)} teams")
        
        # Extract options
        season = options.get('season', '2025')
        start_date_str = options.get('startDate', '2025-09-01')
        end_date_str = options.get('endDate', '2025-12-15')
        conference_games_per_team = options.get('conferenceGamesPerTeam', 9)
        
        # Parse dates
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        
        # Create team rotation
        team_ids = [team['teamId'] for team in teams]
        
        # Generate games
        games = []
        
        # For football, we typically play games on Saturdays
        game_dates = []
        current_date = start_date
        while current_date <= end_date:
            # Adjust to the nearest Saturday if not already
            days_to_saturday = (5 - current_date.weekday()) % 7
            saturday = current_date + timedelta(days=days_to_saturday)
            
            if saturday <= end_date:
                game_dates.append(saturday)
            
            # Move to the next week
            current_date += timedelta(days=7)
        
        # Simple algorithm: each team plays against a subset of other teams
        for i, home_team in enumerate(team_ids):
            # Determine opponents
            opponents = team_ids.copy()
            opponents.remove(home_team)
            
            # Shuffle opponents
            random.shuffle(opponents)
            
            # Select opponents for this team
            selected_opponents = opponents[:conference_games_per_team]
            
            # Create games
            for j, away_team in enumerate(selected_opponents):
                # Select a game date (rotate through available dates)
                date = game_dates[j % len(game_dates)]
                
                games.append({
                    'homeTeam': home_team,
                    'awayTeam': away_team,
                    'date': date.strftime('%Y-%m-%d'),
                    'type': 'conference'
                })
        
        # Organize games by date
        games_by_date = {}
        for game in games:
            date = game['date']
            if date not in games_by_date:
                games_by_date[date] = []
            games_by_date[date].append(game)
        
        game_days = [
            {'date': date, 'games': games}
            for date, games in sorted(games_by_date.items())
        ]
        
        # Build the schedule object
        schedule = {
            'type': 'schedule',
            'sportType': 'football',
            'season': season,
            'teams': team_ids,
            'gameDays': game_days,
            'gameCount': len(games),
            'startDate': start_date_str,
            'endDate': end_date_str,
            'generatedAt': datetime.now().isoformat(),
            'metrics': {
                'quality': 0.8,  # Placeholder
                'constraints': {
                    'satisfied': 12,  # Placeholder
                    'violated': 3     # Placeholder
                },
                'travelDistance': 15000,  # Placeholder
                'restDays': {
                    'average': 6.5,   # Placeholder
                    'minimum': 6      # Placeholder
                }
            }
        }
        
        logger.info(f"Generated football schedule with {schedule['gameCount']} games")
        
        return schedule


# Factory function to create the appropriate generator
def create_generator(sport_type: str, config: Dict[str, Any] = None) -> ScheduleGenerator:
    """Create a schedule generator for the specified sport type.
    
    Args:
        sport_type: Type of sport
        config: Configuration options
        
    Returns:
        A ScheduleGenerator instance
    """
    if sport_type.lower() == 'basketball':
        return BasketballScheduleGenerator(config)
    elif sport_type.lower() == 'football':
        return FootballScheduleGenerator(config)
    else:
        # Default to round-robin
        return RoundRobinGenerator(config)