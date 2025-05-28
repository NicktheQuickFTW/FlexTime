"""
Pattern Extractor for the HELiiX Intelligence Engine

This module provides pattern extraction capabilities from scheduling data,
which forms the foundation of the machine learning loop.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

# Configure logging
logger = logging.getLogger('intelligence_engine.ml.pattern_extractor')

class PatternExtractor:
    """Extracts meaningful patterns from scheduling data."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the pattern extractor.

        Args:
            config: Configuration options
        """
        self.config = config or {}
        self.min_support = self.config.get('min_support', 0.3)  # Minimum support for pattern detection
        self.min_confidence = self.config.get('min_confidence', 0.7)  # Minimum confidence for pattern detection
        self.max_patterns = self.config.get('max_patterns', 50)  # Maximum number of patterns to extract
        self.patterns = []  # Store discovered patterns
        
    def extract_patterns_from_schedule(self, schedule: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract patterns from a schedule.
        
        Args:
            schedule: The schedule to analyze
            
        Returns:
            List of extracted patterns
        """
        logger.info(f"Extracting patterns from schedule")
        
        patterns = []
        
        # Extract team-specific patterns
        team_patterns = self._extract_team_patterns(schedule)
        patterns.extend(team_patterns)
        
        # Extract time-based patterns
        time_patterns = self._extract_time_patterns(schedule)
        patterns.extend(time_patterns)
        
        # Extract game-sequencing patterns
        sequence_patterns = self._extract_sequence_patterns(schedule)
        patterns.extend(sequence_patterns)
        
        # Limit to maximum number of patterns
        if len(patterns) > self.max_patterns:
            patterns = patterns[:self.max_patterns]
        
        # Store the patterns
        self.patterns = patterns
        
        return patterns
    
    def extract_patterns_from_feedback(self, feedback_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract patterns from feedback data.
        
        Args:
            feedback_data: List of feedback entries
            
        Returns:
            List of extracted patterns
        """
        logger.info(f"Extracting patterns from {len(feedback_data)} feedback entries")
        
        patterns = []
        
        # Convert feedback to DataFrame for easier analysis
        if not feedback_data:
            return patterns
        
        try:
            df = pd.DataFrame(feedback_data)
            
            # Extract patterns from ratings
            if 'rating' in df.columns:
                rating_patterns = self._extract_rating_patterns(df)
                patterns.extend(rating_patterns)
            
            # Extract patterns from comments (if any)
            if 'comments' in df.columns:
                comment_patterns = self._extract_comment_patterns(df)
                patterns.extend(comment_patterns)
            
            # Extract patterns from metrics (if any)
            if 'metrics' in df.columns:
                metric_patterns = self._extract_metric_patterns(df)
                patterns.extend(metric_patterns)
        
        except Exception as e:
            logger.exception(f"Error extracting patterns from feedback: {str(e)}")
        
        return patterns
    
    def extract_patterns_from_experiences(self, experiences: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract patterns from experience data.
        
        Args:
            experiences: List of experience entries
            
        Returns:
            List of extracted patterns
        """
        logger.info(f"Extracting patterns from {len(experiences)} experience entries")
        
        patterns = []
        
        # Group experiences by type
        experience_types = {}
        for exp in experiences:
            exp_type = exp.get('type')
            if exp_type:
                if exp_type not in experience_types:
                    experience_types[exp_type] = []
                experience_types[exp_type].append(exp)
        
        # Extract patterns for each experience type
        for exp_type, exps in experience_types.items():
            if exp_type == 'schedule_generation':
                gen_patterns = self._extract_generation_experience_patterns(exps)
                patterns.extend(gen_patterns)
            elif exp_type == 'optimization':
                opt_patterns = self._extract_optimization_experience_patterns(exps)
                patterns.extend(opt_patterns)
            elif exp_type == 'constraint_validation':
                val_patterns = self._extract_validation_experience_patterns(exps)
                patterns.extend(val_patterns)
        
        return patterns
    
    def get_recommended_parameters(self, task_type: str, sport_type: str = None) -> Dict[str, Any]:
        """Get recommended parameters based on extracted patterns.
        
        Args:
            task_type: Type of task
            sport_type: Optional sport type
            
        Returns:
            Recommended parameters
        """
        # Filter patterns relevant to the task and sport
        relevant_patterns = [p for p in self.patterns 
                           if p.get('task_type') == task_type 
                           and (sport_type is None or p.get('sport_type') == sport_type)]
        
        if not relevant_patterns:
            return {}
        
        # Extract parameter recommendations from patterns
        params = {}
        
        # Collect all parameter recommendations
        for pattern in relevant_patterns:
            if 'parameters' in pattern:
                for param_name, param_value in pattern['parameters'].items():
                    if param_name not in params:
                        params[param_name] = []
                    params[param_name].append((param_value, pattern.get('confidence', 0.5)))
        
        # Compute weighted average for each parameter
        recommended_params = {}
        for param_name, values in params.items():
            if not values:
                continue
            
            # Check if all values are numeric
            is_numeric = all(isinstance(v[0], (int, float)) for v in values)
            
            if is_numeric:
                # Compute weighted average for numeric parameters
                total_weight = sum(v[1] for v in values)
                weighted_sum = sum(v[0] * v[1] for v in values)
                recommended_params[param_name] = weighted_sum / total_weight if total_weight > 0 else values[0][0]
            else:
                # For non-numeric parameters, choose the one with highest confidence
                best_value = max(values, key=lambda v: v[1])
                recommended_params[param_name] = best_value[0]
        
        return recommended_params
    
    def _extract_team_patterns(self, schedule: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract team-specific patterns from a schedule.
        
        Args:
            schedule: The schedule to analyze
            
        Returns:
            List of team-specific patterns
        """
        patterns = []
        sport_type = schedule.get('sportType', 'generic')
        
        # Calculate games per team
        team_games = {}
        home_away_balance = {}
        team_travel_distance = {}
        
        # Process each game day
        for game_day in schedule.get('gameDays', []):
            for game in game_day.get('games', []):
                home_team = game.get('homeTeam')
                away_team = game.get('awayTeam')
                
                # Count games for each team
                if home_team:
                    team_games[home_team] = team_games.get(home_team, 0) + 1
                    home_away_balance[home_team] = home_away_balance.get(home_team, 0) + 1  # +1 for home
                
                if away_team:
                    team_games[away_team] = team_games.get(away_team, 0) + 1
                    home_away_balance[away_team] = home_away_balance.get(away_team, 0) - 1  # -1 for away
        
        # Calculate average games per team
        if team_games:
            avg_games = sum(team_games.values()) / len(team_games)
            
            patterns.append({
                'type': 'team_workload',
                'description': f'Average games per team in {sport_type}',
                'value': avg_games,
                'confidence': 0.8,
                'task_type': 'generate_schedule',
                'sport_type': sport_type,
                'parameters': {
                    'average_games_per_team': avg_games
                }
            })
        
        # Calculate home/away balance pattern
        if home_away_balance:
            # Calculate average absolute imbalance
            avg_imbalance = sum(abs(balance) for balance in home_away_balance.values()) / len(home_away_balance)
            
            patterns.append({
                'type': 'home_away_balance',
                'description': f'Home/away balance in {sport_type}',
                'value': avg_imbalance,
                'confidence': 0.7,
                'task_type': 'generate_schedule',
                'sport_type': sport_type,
                'parameters': {
                    'target_home_away_imbalance': avg_imbalance
                }
            })
        
        return patterns
    
    def _extract_time_patterns(self, schedule: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract time-based patterns from a schedule.
        
        Args:
            schedule: The schedule to analyze
            
        Returns:
            List of time-based patterns
        """
        patterns = []
        sport_type = schedule.get('sportType', 'generic')
        
        # Collect all dates
        dates = []
        for game_day in schedule.get('gameDays', []):
            date_str = game_day.get('date')
            if date_str:
                try:
                    date = datetime.strptime(date_str, '%Y-%m-%d')
                    dates.append(date)
                except ValueError:
                    continue
        
        if not dates:
            return patterns
        
        # Sort dates
        dates.sort()
        
        # Calculate gaps between consecutive dates
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates) - 1)]
        
        if gaps:
            # Calculate average gap
            avg_gap = sum(gaps) / len(gaps)
            
            patterns.append({
                'type': 'game_day_frequency',
                'description': f'Average days between games in {sport_type}',
                'value': avg_gap,
                'confidence': 0.75,
                'task_type': 'generate_schedule',
                'sport_type': sport_type,
                'parameters': {
                    'average_days_between_games': avg_gap
                }
            })
            
            # Calculate most common gap (mode)
            if gaps:
                gap_counts = {}
                for gap in gaps:
                    gap_counts[gap] = gap_counts.get(gap, 0) + 1
                
                most_common_gap = max(gap_counts.items(), key=lambda x: x[1])[0]
                
                patterns.append({
                    'type': 'common_game_interval',
                    'description': f'Most common interval between games in {sport_type}',
                    'value': most_common_gap,
                    'confidence': 0.7,
                    'task_type': 'generate_schedule',
                    'sport_type': sport_type,
                    'parameters': {
                        'preferred_game_interval': most_common_gap
                    }
                })
        
        return patterns
    
    def _extract_sequence_patterns(self, schedule: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract game-sequencing patterns from a schedule.
        
        Args:
            schedule: The schedule to analyze
            
        Returns:
            List of sequencing patterns
        """
        patterns = []
        sport_type = schedule.get('sportType', 'generic')
        
        # Create team game sequences
        team_sequences = {}
        
        # Sort game days by date
        game_days = sorted(schedule.get('gameDays', []), 
                         key=lambda x: x.get('date', ''))
        
        # Build sequences for each team
        for game_day in game_days:
            date = game_day.get('date')
            for game in game_day.get('games', []):
                home_team = game.get('homeTeam')
                away_team = game.get('awayTeam')
                
                if home_team:
                    if home_team not in team_sequences:
                        team_sequences[home_team] = []
                    team_sequences[home_team].append(('home', date))
                
                if away_team:
                    if away_team not in team_sequences:
                        team_sequences[away_team] = []
                    team_sequences[away_team].append(('away', date))
        
        # Analyze sequences for patterns
        home_streaks = []
        away_streaks = []
        
        for team, sequence in team_sequences.items():
            # Sort by date
            sequence.sort(key=lambda x: x[1])
            
            # Find streaks
            current_home_streak = 0
            current_away_streak = 0
            max_home_streak = 0
            max_away_streak = 0
            
            for location, _ in sequence:
                if location == 'home':
                    current_home_streak += 1
                    current_away_streak = 0
                    max_home_streak = max(max_home_streak, current_home_streak)
                else:
                    current_away_streak += 1
                    current_home_streak = 0
                    max_away_streak = max(max_away_streak, current_away_streak)
            
            home_streaks.append(max_home_streak)
            away_streaks.append(max_away_streak)
        
        # Calculate average maximum streaks
        if home_streaks:
            avg_max_home_streak = sum(home_streaks) / len(home_streaks)
            
            patterns.append({
                'type': 'home_game_streak',
                'description': f'Average maximum consecutive home games in {sport_type}',
                'value': avg_max_home_streak,
                'confidence': 0.7,
                'task_type': 'generate_schedule',
                'sport_type': sport_type,
                'parameters': {
                    'max_consecutive_home': avg_max_home_streak
                }
            })
        
        if away_streaks:
            avg_max_away_streak = sum(away_streaks) / len(away_streaks)
            
            patterns.append({
                'type': 'away_game_streak',
                'description': f'Average maximum consecutive away games in {sport_type}',
                'value': avg_max_away_streak,
                'confidence': 0.7,
                'task_type': 'generate_schedule',
                'sport_type': sport_type,
                'parameters': {
                    'max_consecutive_away': avg_max_away_streak
                }
            })
        
        return patterns
    
    def _extract_rating_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extract patterns from rating data.
        
        Args:
            df: DataFrame containing feedback data
            
        Returns:
            List of patterns
        """
        patterns = []
        
        # Check if we have schedule IDs and ratings
        if 'scheduleId' not in df.columns or 'rating' not in df.columns:
            return patterns
        
        # Group by schedule ID and calculate average rating
        schedule_ratings = df.groupby('scheduleId')['rating'].mean()
        
        # Identify highly rated schedules
        high_rated_schedules = schedule_ratings[schedule_ratings >= 4.0].index.tolist()
        
        if high_rated_schedules:
            # Find common characteristics of highly rated schedules
            high_rated_df = df[df['scheduleId'].isin(high_rated_schedules)]
            
            # Extract patterns from metrics
            if 'metrics' in high_rated_df.columns:
                # This is a placeholder - in a real implementation, we would extract
                # specific metrics from the metrics dictionary and analyze them
                patterns.append({
                    'type': 'high_rating_correlation',
                    'description': 'Characteristics of highly rated schedules',
                    'confidence': 0.6,
                    'task_type': 'generate_schedule',
                    'parameters': {
                        'target_rating': 4.0
                    }
                })
        
        return patterns
    
    def _extract_comment_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extract patterns from comment data.
        
        Args:
            df: DataFrame containing feedback data
            
        Returns:
            List of patterns
        """
        patterns = []
        
        # This is a placeholder - in a real implementation, we would use
        # natural language processing to analyze comments and extract patterns
        
        return patterns
    
    def _extract_metric_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extract patterns from metric data.
        
        Args:
            df: DataFrame containing feedback data
            
        Returns:
            List of patterns
        """
        patterns = []
        
        # This is a placeholder - in a real implementation, we would extract
        # specific metrics from the metrics dictionary and analyze them
        
        return patterns
    
    def _extract_generation_experience_patterns(self, experiences: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract patterns from schedule generation experiences.
        
        Args:
            experiences: List of schedule generation experiences
            
        Returns:
            List of patterns
        """
        patterns = []
        
        # Extract schedule parameters
        schedule_params = [exp.get('content', {}).get('parameters', {}) for exp in experiences]
        
        # Extract algorithm types
        algorithm_types = [exp.get('content', {}).get('algorithms', {}).get('generator') 
                         for exp in experiences if exp.get('content', {}).get('algorithms', {}).get('generator')]
        
        # Count occurrences of each algorithm type
        if algorithm_types:
            algorithm_counts = {}
            for algo in algorithm_types:
                algorithm_counts[algo] = algorithm_counts.get(algo, 0) + 1
            
            # Find most common algorithm
            most_common_algo = max(algorithm_counts.items(), key=lambda x: x[1])
            
            patterns.append({
                'type': 'preferred_generator',
                'description': f'Most commonly used schedule generator',
                'value': most_common_algo[0],
                'confidence': min(0.5 + 0.1 * most_common_algo[1], 0.9),  # Confidence increases with count
                'task_type': 'generate_schedule',
                'parameters': {
                    'preferred_generator': most_common_algo[0]
                }
            })
        
        # Find successful generation parameters
        successful_experiences = [exp for exp in experiences 
                                if exp.get('content', {}).get('metrics', {}).get('quality', 0) > 0.8]
        
        if successful_experiences:
            # Example: Extract optimization iterations
            iterations = [exp.get('content', {}).get('parameters', {}).get('optimizationIterations')
                        for exp in successful_experiences
                        if exp.get('content', {}).get('parameters', {}).get('optimizationIterations')]
            
            if iterations:
                avg_iterations = sum(iterations) / len(iterations)
                
                patterns.append({
                    'type': 'optimization_iterations',
                    'description': 'Optimal number of optimization iterations',
                    'value': avg_iterations,
                    'confidence': 0.7,
                    'task_type': 'generate_schedule',
                    'parameters': {
                        'optimizationIterations': avg_iterations
                    }
                })
        
        return patterns
    
    def _extract_optimization_experience_patterns(self, experiences: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract patterns from schedule optimization experiences.
        
        Args:
            experiences: List of optimization experiences
            
        Returns:
            List of patterns
        """
        patterns = []
        
        # Extract algorithm parameters
        cooling_rates = [exp.get('content', {}).get('parameters', {}).get('coolingRate')
                      for exp in experiences
                      if exp.get('content', {}).get('parameters', {}).get('coolingRate')]
        
        initial_temps = [exp.get('content', {}).get('parameters', {}).get('initialTemperature')
                       for exp in experiences
                       if exp.get('content', {}).get('parameters', {}).get('initialTemperature')]
        
        # Calculate improvements
        improvements = [exp.get('content', {}).get('metrics', {}).get('improvement', 0)
                      for exp in experiences]
        
        # Find parameters for best improvements
        if improvements and cooling_rates and len(improvements) == len(cooling_rates):
            # Find index of best improvement
            best_idx = improvements.index(max(improvements))
            
            if best_idx < len(cooling_rates):
                best_cooling_rate = cooling_rates[best_idx]
                
                patterns.append({
                    'type': 'cooling_rate',
                    'description': 'Optimal cooling rate for simulated annealing',
                    'value': best_cooling_rate,
                    'confidence': 0.6,
                    'task_type': 'optimize_schedule',
                    'parameters': {
                        'coolingRate': best_cooling_rate
                    }
                })
        
        if improvements and initial_temps and len(improvements) == len(initial_temps):
            # Find index of best improvement
            best_idx = improvements.index(max(improvements))
            
            if best_idx < len(initial_temps):
                best_initial_temp = initial_temps[best_idx]
                
                patterns.append({
                    'type': 'initial_temperature',
                    'description': 'Optimal initial temperature for simulated annealing',
                    'value': best_initial_temp,
                    'confidence': 0.6,
                    'task_type': 'optimize_schedule',
                    'parameters': {
                        'initialTemperature': best_initial_temp
                    }
                })
        
        return patterns
    
    def _extract_validation_experience_patterns(self, experiences: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract patterns from constraint validation experiences.
        
        Args:
            experiences: List of validation experiences
            
        Returns:
            List of patterns
        """
        patterns = []
        
        # This is a placeholder - in a real implementation, we would analyze
        # constraint validation experiences to extract patterns
        
        return patterns