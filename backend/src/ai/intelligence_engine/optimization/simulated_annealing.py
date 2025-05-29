"""
Simulated Annealing Optimizer for the HELiiX Intelligence Engine

This module provides a simulated annealing optimization algorithm for schedule optimization.
"""

import math
import random
import logging
import time
from typing import Dict, Any, List, Callable, Tuple
import copy

# Configure logging
logger = logging.getLogger('intelligence_engine.optimization.simulated_annealing')

class SimulatedAnnealing:
    """Simulated Annealing optimization algorithm."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the simulated annealing optimizer.
        
        Args:
            config: Configuration options
        """
        self.config = config or {}
        self.initial_temperature = config.get('initial_temperature', 100.0)
        self.cooling_rate = config.get('cooling_rate', 0.95)
        self.iterations_per_temp = config.get('iterations_per_temp', 100)
        self.min_temperature = config.get('min_temperature', 0.1)
        self.restart_threshold = config.get('restart_threshold', 5)
        self.max_iterations = config.get('max_iterations', 10000)
        self.early_stopping_threshold = config.get('early_stopping_threshold', 500)
        self.adaptive_cooling = config.get('adaptive_cooling', True)
        
        # Statistics
        self.stats = {
            'iterations': 0,
            'accepted_moves': 0,
            'rejected_moves': 0,
            'restarts': 0,
            'time_elapsed': 0,
            'best_score_history': [],
            'temperature_history': []
        }
    
    def optimize(self, initial_solution: Any, objective_function: Callable[[Any], float],
                neighbor_function: Callable[[Any], Any], accept_solution: Callable[[Any], bool] = None) -> Dict[str, Any]:
        """Run the simulated annealing optimization.
        
        Args:
            initial_solution: The initial solution to optimize
            objective_function: Function that evaluates a solution
            neighbor_function: Function that generates a neighbor solution
            accept_solution: Optional function to check if a solution is valid
        
        Returns:
            A dictionary containing the optimized solution and statistics
        """
        # Start the timer
        start_time = time.time()
        
        # Initialize the current solution and score
        current_solution = copy.deepcopy(initial_solution)
        current_score = objective_function(current_solution)
        
        # Initialize the best solution and score
        best_solution = copy.deepcopy(current_solution)
        best_score = current_score
        
        # Initialize temperature and iteration counters
        temperature = self.initial_temperature
        iteration = 0
        no_improvement_count = 0
        restart_count = 0
        
        logger.info(f"Starting simulated annealing with initial score: {current_score}")
        logger.info(f"Initial temperature: {temperature}, Cooling rate: {self.cooling_rate}")
        
        # Track statistics
        self.stats['best_score_history'].append(best_score)
        self.stats['temperature_history'].append(temperature)
        
        # Main optimization loop
        while temperature > self.min_temperature and iteration < self.max_iterations:
            # Perform iterations at this temperature
            for _ in range(self.iterations_per_temp):
                # Generate a neighbor
                neighbor = neighbor_function(current_solution)
                
                # Check if the neighbor is valid
                if accept_solution and not accept_solution(neighbor):
                    continue
                
                # Evaluate the neighbor
                neighbor_score = objective_function(neighbor)
                
                # Calculate delta (assuming higher is better)
                delta = neighbor_score - current_score
                
                # Determine if we should accept the neighbor
                accept = False
                if delta > 0:
                    # Always accept better solutions
                    accept = True
                else:
                    # Probabilistically accept worse solutions
                    probability = math.exp(delta / temperature)
                    accept = random.random() < probability
                
                # Update current solution if accepted
                if accept:
                    current_solution = copy.deepcopy(neighbor)
                    current_score = neighbor_score
                    self.stats['accepted_moves'] += 1
                    
                    # Update best solution if needed
                    if current_score > best_score:
                        best_solution = copy.deepcopy(current_solution)
                        best_score = current_score
                        no_improvement_count = 0
                        logger.debug(f"New best score: {best_score} at iteration {iteration}")
                    else:
                        no_improvement_count += 1
                else:
                    self.stats['rejected_moves'] += 1
                    no_improvement_count += 1
                
                # Check for early stopping
                if no_improvement_count >= self.early_stopping_threshold:
                    # Perform a restart if needed
                    if restart_count < self.restart_threshold:
                        temperature = self.initial_temperature * (0.5 ** restart_count)
                        current_solution = copy.deepcopy(best_solution)
                        current_score = best_score
                        no_improvement_count = 0
                        restart_count += 1
                        self.stats['restarts'] += 1
                        logger.info(f"Restarting at temperature {temperature}, best score: {best_score}")
                    else:
                        logger.info(f"Early stopping after {iteration} iterations, no improvement in {no_improvement_count} iterations")
                        break
                
                iteration += 1
            
            # Track statistics
            self.stats['best_score_history'].append(best_score)
            self.stats['temperature_history'].append(temperature)
            
            # Update temperature
            if self.adaptive_cooling:
                # Adapt cooling rate based on acceptance ratio
                acceptance_ratio = self.stats['accepted_moves'] / max(1, (self.stats['accepted_moves'] + self.stats['rejected_moves']))
                adaptive_rate = self.cooling_rate
                
                # Slow down cooling if acceptance ratio is low
                if acceptance_ratio < 0.1:
                    adaptive_rate = self.cooling_rate ** 0.5
                # Speed up cooling if acceptance ratio is high
                elif acceptance_ratio > 0.8:
                    adaptive_rate = self.cooling_rate ** 2
                
                temperature *= adaptive_rate
            else:
                temperature *= self.cooling_rate
        
        # End the timer
        end_time = time.time()
        self.stats['time_elapsed'] = end_time - start_time
        self.stats['iterations'] = iteration
        
        logger.info(f"Simulated annealing completed after {iteration} iterations")
        logger.info(f"Final temperature: {temperature}, Best score: {best_score}")
        logger.info(f"Time elapsed: {self.stats['time_elapsed']:.2f} seconds")
        
        return {
            'solution': best_solution,
            'score': best_score,
            'initial_score': objective_function(initial_solution),
            'improvement': best_score - objective_function(initial_solution),
            'stats': self.stats
        }


class ScheduleOptimizer(SimulatedAnnealing):
    """Simulated Annealing optimizer specialized for schedule optimization."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the schedule optimizer.
        
        Args:
            config: Configuration options
        """
        super().__init__(config)
        
        # Schedule-specific configuration
        self.constraint_weights = config.get('constraint_weights', {
            'rest_days': 10.0,
            'travel_distance': 5.0,
            'home_away_balance': 3.0,
            'rivalry_games': 2.0,
            'venue_availability': 100.0  # Hard constraint
        })
    
    def _evaluate_schedule(self, schedule: Dict[str, Any]) -> float:
        """Evaluate a schedule.
        
        Args:
            schedule: The schedule to evaluate
            
        Returns:
            A score for the schedule (higher is better)
        """
        # This is a placeholder for the real evaluation function
        # In a real implementation, this would check all constraints and calculate a score
        
        games = []
        for game_day in schedule.get('gameDays', []):
            games.extend(game_day.get('games', []))
        
        # Calculate travel distance (placeholder)
        travel_distance = random.uniform(10000, 30000)
        
        # Calculate rest days (placeholder)
        rest_days = random.uniform(1.5, 3.0)
        
        # Calculate home/away balance (placeholder)
        home_away_balance = random.uniform(0.8, 1.0)
        
        # Calculate rivalry games (placeholder)
        rivalry_games = random.uniform(0.5, 1.0)
        
        # Calculate venue availability (placeholder)
        venue_availability = random.uniform(0.9, 1.0)
        
        # Calculate the score
        score = (
            -travel_distance / 50000 * self.constraint_weights['travel_distance'] +
            rest_days / 3.0 * self.constraint_weights['rest_days'] +
            home_away_balance * self.constraint_weights['home_away_balance'] +
            rivalry_games * self.constraint_weights['rivalry_games'] +
            venue_availability * self.constraint_weights['venue_availability']
        )
        
        return score
    
    def _generate_neighbor(self, schedule: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a neighbor of the current schedule.
        
        Args:
            schedule: The current schedule
            
        Returns:
            A new schedule that is a neighbor of the current one
        """
        # This is a placeholder for the real neighbor function
        # In a real implementation, this would make a small change to the schedule
        # such as swapping two games, changing a date, etc.
        
        neighbor = copy.deepcopy(schedule)
        game_days = neighbor.get('gameDays', [])
        
        if not game_days:
            return neighbor
        
        # Make a random change
        change_type = random.choice(['swap_games', 'move_game', 'swap_home_away'])
        
        if change_type == 'swap_games':
            # Swap two games
            if len(game_days) >= 2:
                day1_idx = random.randint(0, len(game_days) - 1)
                day2_idx = random.randint(0, len(game_days) - 1)
                while day2_idx == day1_idx:
                    day2_idx = random.randint(0, len(game_days) - 1)
                
                games1 = game_days[day1_idx].get('games', [])
                games2 = game_days[day2_idx].get('games', [])
                
                if games1 and games2:
                    game1_idx = random.randint(0, len(games1) - 1)
                    game2_idx = random.randint(0, len(games2) - 1)
                    
                    games1[game1_idx], games2[game2_idx] = games2[game2_idx], games1[game1_idx]
                    
                    # Update dates
                    games1[game1_idx]['date'] = game_days[day1_idx]['date']
                    games2[game2_idx]['date'] = game_days[day2_idx]['date']
        
        elif change_type == 'move_game':
            # Move a game to a different day
            if len(game_days) >= 2:
                from_day_idx = random.randint(0, len(game_days) - 1)
                to_day_idx = random.randint(0, len(game_days) - 1)
                while to_day_idx == from_day_idx:
                    to_day_idx = random.randint(0, len(game_days) - 1)
                
                from_games = game_days[from_day_idx].get('games', [])
                
                if from_games:
                    game_idx = random.randint(0, len(from_games) - 1)
                    game = from_games.pop(game_idx)
                    
                    # Update date
                    game['date'] = game_days[to_day_idx]['date']
                    
                    # Add to destination day
                    if 'games' not in game_days[to_day_idx]:
                        game_days[to_day_idx]['games'] = []
                    
                    game_days[to_day_idx]['games'].append(game)
        
        elif change_type == 'swap_home_away':
            # Swap home and away teams
            day_idx = random.randint(0, len(game_days) - 1)
            games = game_days[day_idx].get('games', [])
            
            if games:
                game_idx = random.randint(0, len(games) - 1)
                game = games[game_idx]
                
                # Swap home and away
                game['homeTeam'], game['awayTeam'] = game['awayTeam'], game['homeTeam']
        
        return neighbor
    
    def _check_schedule_validity(self, schedule: Dict[str, Any]) -> bool:
        """Check if a schedule is valid.
        
        Args:
            schedule: The schedule to check
            
        Returns:
            True if the schedule is valid, False otherwise
        """
        # This is a placeholder for the real validity check
        # In a real implementation, this would check all hard constraints
        
        # For now, always return True
        return True
    
    def optimize_schedule(self, initial_schedule: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize a schedule.
        
        Args:
            initial_schedule: The initial schedule to optimize
            
        Returns:
            The optimized schedule and statistics
        """
        logger.info(f"Optimizing schedule with {len(initial_schedule.get('gameDays', []))} game days")
        
        result = self.optimize(
            initial_schedule,
            self._evaluate_schedule,
            self._generate_neighbor,
            self._check_schedule_validity
        )
        
        # Include additional metrics in the result
        if 'metrics' not in result['solution']:
            result['solution']['metrics'] = {}
        
        result['solution']['metrics']['optimization'] = {
            'initialScore': result['initial_score'],
            'finalScore': result['score'],
            'improvement': result['improvement'],
            'iterations': result['stats']['iterations'],
            'timeElapsed': result['stats']['time_elapsed']
        }
        
        return result