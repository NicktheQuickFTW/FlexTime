"""
Genetic Algorithm Optimizer for the HELiiX Intelligence Engine

This module provides a genetic algorithm optimization framework for schedule optimization.
"""

import random
import logging
import time
import copy
from typing import Dict, Any, List, Callable, Tuple, Optional
import heapq

# Configure logging
logger = logging.getLogger('intelligence_engine.optimization.genetic_algorithm')

class GeneticAlgorithm:
    """Genetic Algorithm optimization framework."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the genetic algorithm optimizer.
        
        Args:
            config: Configuration options
        """
        self.config = config or {}
        self.population_size = config.get('population_size', 50)
        self.elite_count = config.get('elite_count', 5)
        self.tournament_size = config.get('tournament_size', 3)
        self.crossover_rate = config.get('crossover_rate', 0.8)
        self.mutation_rate = config.get('mutation_rate', 0.2)
        self.max_generations = config.get('max_generations', 100)
        self.max_no_improvement = config.get('max_no_improvement', 20)
        self.adaptive_mutation = config.get('adaptive_mutation', True)
        
        # Statistics
        self.stats = {
            'generations': 0,
            'evaluations': 0,
            'best_fitness_history': [],
            'avg_fitness_history': [],
            'time_elapsed': 0
        }
    
    def optimize(self, initial_solution: Any, fitness_function: Callable[[Any], float],
                create_individual: Callable[[], Any], crossover: Callable[[Any, Any], Tuple[Any, Any]],
                mutate: Callable[[Any, float], Any], is_valid: Callable[[Any], bool] = None) -> Dict[str, Any]:
        """Run the genetic algorithm optimization.
        
        Args:
            initial_solution: The initial solution to include in the population
            fitness_function: Function that evaluates an individual's fitness
            create_individual: Function that creates a random individual
            crossover: Function that performs crossover between two individuals
            mutate: Function that mutates an individual
            is_valid: Optional function to check if an individual is valid
            
        Returns:
            A dictionary containing the optimized solution and statistics
        """
        # Start the timer
        start_time = time.time()
        
        # Initialize the population
        population = self._initialize_population(initial_solution, create_individual, fitness_function, is_valid)
        
        # Track statistics
        best_individual = max(population, key=lambda x: x[0])
        self.stats['best_fitness_history'].append(best_individual[0])
        self.stats['avg_fitness_history'].append(sum(ind[0] for ind in population) / len(population))
        
        generation = 0
        no_improvement_count = 0
        best_fitness = best_individual[0]
        
        logger.info(f"Starting genetic algorithm with population size: {self.population_size}")
        logger.info(f"Initial best fitness: {best_fitness}")
        
        # Main optimization loop
        while generation < self.max_generations and no_improvement_count < self.max_no_improvement:
            # Create a new generation
            new_population = []
            
            # Keep the elite individuals
            elite = heapq.nlargest(self.elite_count, population)
            new_population.extend(elite)
            
            # Fill the rest of the population with crossover and mutation
            while len(new_population) < self.population_size:
                # Select parents using tournament selection
                parent1 = self._tournament_selection(population)
                parent2 = self._tournament_selection(population)
                
                # Perform crossover
                if random.random() < self.crossover_rate:
                    offspring1, offspring2 = crossover(parent1[1], parent2[1])
                else:
                    offspring1, offspring2 = copy.deepcopy(parent1[1]), copy.deepcopy(parent2[1])
                
                # Determine mutation rate (adaptive if enabled)
                mut_rate = self.mutation_rate
                if self.adaptive_mutation:
                    # Increase mutation rate if population diversity is low
                    diversity = self._calculate_diversity(population)
                    if diversity < 0.1:
                        mut_rate = min(0.5, self.mutation_rate * 2)
                    elif diversity > 0.5:
                        mut_rate = max(0.05, self.mutation_rate / 2)
                
                # Perform mutation
                offspring1 = mutate(offspring1, mut_rate)
                offspring2 = mutate(offspring2, mut_rate)
                
                # Check validity
                if is_valid is None or is_valid(offspring1):
                    fitness1 = fitness_function(offspring1)
                    new_population.append((fitness1, offspring1))
                    self.stats['evaluations'] += 1
                
                if len(new_population) < self.population_size:
                    if is_valid is None or is_valid(offspring2):
                        fitness2 = fitness_function(offspring2)
                        new_population.append((fitness2, offspring2))
                        self.stats['evaluations'] += 1
            
            # Update the population
            population = new_population
            
            # Track statistics
            current_best = max(population, key=lambda x: x[0])
            self.stats['best_fitness_history'].append(current_best[0])
            self.stats['avg_fitness_history'].append(sum(ind[0] for ind in population) / len(population))
            
            # Check for improvement
            if current_best[0] > best_fitness:
                best_fitness = current_best[0]
                best_individual = current_best
                no_improvement_count = 0
                logger.debug(f"New best fitness: {best_fitness} at generation {generation}")
            else:
                no_improvement_count += 1
            
            generation += 1
        
        # End the timer
        end_time = time.time()
        self.stats['time_elapsed'] = end_time - start_time
        self.stats['generations'] = generation
        
        logger.info(f"Genetic algorithm completed after {generation} generations")
        logger.info(f"Best fitness: {best_fitness}")
        logger.info(f"Time elapsed: {self.stats['time_elapsed']:.2f} seconds")
        
        return {
            'solution': best_individual[1],
            'fitness': best_individual[0],
            'initial_fitness': fitness_function(initial_solution),
            'improvement': best_individual[0] - fitness_function(initial_solution),
            'stats': self.stats
        }
    
    def _initialize_population(self, initial_solution: Any, create_individual: Callable[[], Any],
                             fitness_function: Callable[[Any], float], is_valid: Callable[[Any], bool] = None) -> List[Tuple[float, Any]]:
        """Initialize the population.
        
        Args:
            initial_solution: The initial solution to include in the population
            create_individual: Function that creates a random individual
            fitness_function: Function that evaluates an individual's fitness
            is_valid: Optional function to check if an individual is valid
            
        Returns:
            A list of tuples (fitness, individual)
        """
        population = []
        
        # Add the initial solution
        initial_fitness = fitness_function(initial_solution)
        population.append((initial_fitness, copy.deepcopy(initial_solution)))
        self.stats['evaluations'] += 1
        
        # Generate the rest of the population
        while len(population) < self.population_size:
            individual = create_individual()
            
            if is_valid is None or is_valid(individual):
                fitness = fitness_function(individual)
                population.append((fitness, individual))
                self.stats['evaluations'] += 1
        
        return population
    
    def _tournament_selection(self, population: List[Tuple[float, Any]]) -> Tuple[float, Any]:
        """Select an individual using tournament selection.
        
        Args:
            population: The population to select from
            
        Returns:
            The selected individual (fitness, individual)
        """
        tournament = random.sample(population, min(self.tournament_size, len(population)))
        return max(tournament, key=lambda x: x[0])
    
    def _calculate_diversity(self, population: List[Tuple[float, Any]]) -> float:
        """Calculate the diversity of the population.
        
        Args:
            population: The population to calculate diversity for
            
        Returns:
            A value between 0 (low diversity) and 1 (high diversity)
        """
        # This is a simplified diversity calculation based on fitness values
        # In a real implementation, this could be more sophisticated
        
        fitness_values = [ind[0] for ind in population]
        min_fitness = min(fitness_values)
        max_fitness = max(fitness_values)
        
        if max_fitness == min_fitness:
            return 0.0
        
        # Calculate standard deviation
        mean = sum(fitness_values) / len(fitness_values)
        variance = sum((f - mean) ** 2 for f in fitness_values) / len(fitness_values)
        std_dev = variance ** 0.5
        
        # Normalize by the range
        normalized_std_dev = std_dev / (max_fitness - min_fitness)
        
        return min(1.0, normalized_std_dev)


class ScheduleGeneticOptimizer(GeneticAlgorithm):
    """Genetic Algorithm optimizer specialized for schedule optimization."""
    
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
            A fitness score for the schedule (higher is better)
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
    
    def _create_schedule(self) -> Dict[str, Any]:
        """Create a random schedule.
        
        Returns:
            A randomly generated schedule
        """
        # This is a placeholder for the real schedule creation function
        # In a real implementation, this would create a valid random schedule
        
        # For now, create a simple placeholder schedule
        teams = [f'team{i}' for i in range(1, 13)]
        game_days = []
        
        # Create a schedule for 10 weeks
        for week in range(10):
            date = f"2025-{9 + week // 4}-{1 + (week % 4) * 7}"
            
            # Shuffle teams for pairing
            random.shuffle(teams)
            
            games = []
            # Create 6 games (12 teams / 2)
            for i in range(0, 12, 2):
                games.append({
                    'homeTeam': teams[i],
                    'awayTeam': teams[i+1],
                    'date': date
                })
            
            game_days.append({
                'date': date,
                'games': games
            })
        
        schedule = {
            'type': 'schedule',
            'sportType': 'basketball',
            'season': '2025-2026',
            'teams': teams,
            'gameDays': game_days,
            'gameCount': 60,  # 6 games * 10 weeks
            'startDate': '2025-09-01',
            'endDate': '2025-11-30',
            'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        return schedule
    
    def _crossover_schedules(self, schedule1: Dict[str, Any], schedule2: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Perform crossover between two schedules.
        
        Args:
            schedule1: The first parent schedule
            schedule2: The second parent schedule
            
        Returns:
            Two offspring schedules
        """
        # This is a placeholder for the real crossover function
        # In a real implementation, this would perform a more sophisticated crossover
        
        offspring1 = copy.deepcopy(schedule1)
        offspring2 = copy.deepcopy(schedule2)
        
        game_days1 = offspring1.get('gameDays', [])
        game_days2 = offspring2.get('gameDays', [])
        
        if not game_days1 or not game_days2:
            return offspring1, offspring2
        
        # Perform single-point crossover on game days
        crossover_point = random.randint(1, min(len(game_days1), len(game_days2)) - 1)
        
        offspring1['gameDays'] = game_days1[:crossover_point] + game_days2[crossover_point:]
        offspring2['gameDays'] = game_days2[:crossover_point] + game_days1[crossover_point:]
        
        # Update game counts
        offspring1['gameCount'] = sum(len(day.get('games', [])) for day in offspring1['gameDays'])
        offspring2['gameCount'] = sum(len(day.get('games', [])) for day in offspring2['gameDays'])
        
        return offspring1, offspring2
    
    def _mutate_schedule(self, schedule: Dict[str, Any], mutation_rate: float) -> Dict[str, Any]:
        """Mutate a schedule.
        
        Args:
            schedule: The schedule to mutate
            mutation_rate: The probability of mutation for each component
            
        Returns:
            The mutated schedule
        """
        # This is a placeholder for the real mutation function
        # In a real implementation, this would perform more sophisticated mutations
        
        result = copy.deepcopy(schedule)
        game_days = result.get('gameDays', [])
        
        if not game_days:
            return result
        
        # Perform mutations based on mutation rate
        for day_idx in range(len(game_days)):
            if random.random() < mutation_rate:
                games = game_days[day_idx].get('games', [])
                
                if games:
                    mutation_type = random.choice(['swap_home_away', 'shuffle_games'])
                    
                    if mutation_type == 'swap_home_away':
                        # Swap home and away for a random game
                        game_idx = random.randint(0, len(games) - 1)
                        games[game_idx]['homeTeam'], games[game_idx]['awayTeam'] = games[game_idx]['awayTeam'], games[game_idx]['homeTeam']
                    
                    elif mutation_type == 'shuffle_games':
                        # Shuffle the games within this day
                        random.shuffle(games)
        
        # With lower probability, perform a more disruptive mutation
        if random.random() < mutation_rate / 5:
            if len(game_days) >= 2:
                # Swap two random days
                day1_idx = random.randint(0, len(game_days) - 1)
                day2_idx = random.randint(0, len(game_days) - 1)
                while day2_idx == day1_idx:
                    day2_idx = random.randint(0, len(game_days) - 1)
                
                game_days[day1_idx], game_days[day2_idx] = game_days[day2_idx], game_days[day1_idx]
                
                # Update dates
                for game in game_days[day1_idx].get('games', []):
                    game['date'] = game_days[day1_idx]['date']
                
                for game in game_days[day2_idx].get('games', []):
                    game['date'] = game_days[day2_idx]['date']
        
        return result
    
    def _is_valid_schedule(self, schedule: Dict[str, Any]) -> bool:
        """Check if a schedule is valid.
        
        Args:
            schedule: The schedule to check
            
        Returns:
            True if the schedule is valid, False otherwise
        """
        # This is a placeholder for the real validity check
        # In a real implementation, this would check various constraints
        
        # For now, always return True
        return True
    
    def optimize_schedule(self, initial_schedule: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize a schedule using a genetic algorithm.
        
        Args:
            initial_schedule: The initial schedule to optimize
            
        Returns:
            The optimized schedule and statistics
        """
        logger.info(f"Optimizing schedule with genetic algorithm, {len(initial_schedule.get('gameDays', []))} game days")
        
        result = self.optimize(
            initial_schedule,
            self._evaluate_schedule,
            self._create_schedule,
            self._crossover_schedules,
            self._mutate_schedule,
            self._is_valid_schedule
        )
        
        # Include additional metrics in the result
        if 'metrics' not in result['solution']:
            result['solution']['metrics'] = {}
        
        result['solution']['metrics']['optimization'] = {
            'initialFitness': result['initial_fitness'],
            'finalFitness': result['fitness'],
            'improvement': result['improvement'],
            'generations': result['stats']['generations'],
            'evaluations': result['stats']['evaluations'],
            'timeElapsed': result['stats']['time_elapsed']
        }
        
        return result