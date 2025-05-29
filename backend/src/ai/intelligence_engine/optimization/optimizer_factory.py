"""
Optimizer Factory for the HELiiX Intelligence Engine

This module provides a factory for creating and configuring optimizers.
"""

import logging
from typing import Dict, Any, Optional, List

from .simulated_annealing import SimulatedAnnealing, ScheduleOptimizer as SAScheduleOptimizer
from .genetic_algorithm import GeneticAlgorithm, ScheduleGeneticOptimizer

# Configure logging
logger = logging.getLogger('intelligence_engine.optimization.factory')

class OptimizerFactory:
    """Factory for creating optimizers based on algorithm type and domain."""
    
    def __init__(self):
        """Initialize the optimizer factory."""
        # Register available optimizers
        self.optimizers = {
            'simulated_annealing': {
                'class': SimulatedAnnealing,
                'schedule': SAScheduleOptimizer,
                'default_config': {
                    'initial_temperature': 100.0,
                    'cooling_rate': 0.95,
                    'iterations_per_temp': 100,
                    'min_temperature': 0.1,
                    'restart_threshold': 5,
                    'max_iterations': 10000,
                    'early_stopping_threshold': 500,
                    'adaptive_cooling': True
                }
            },
            'genetic_algorithm': {
                'class': GeneticAlgorithm,
                'schedule': ScheduleGeneticOptimizer,
                'default_config': {
                    'population_size': 50,
                    'elite_count': 5,
                    'tournament_size': 3,
                    'crossover_rate': 0.8,
                    'mutation_rate': 0.2,
                    'max_generations': 100,
                    'max_no_improvement': 20,
                    'adaptive_mutation': True
                }
            }
        }
    
    def create_optimizer(self, algorithm_type: str, domain: str, config: Dict[str, Any] = None) -> Any:
        """Create an optimizer.
        
        Args:
            algorithm_type: Type of optimization algorithm
            domain: Domain to optimize (e.g., 'schedule')
            config: Configuration options
            
        Returns:
            An optimizer instance
            
        Raises:
            ValueError: If the algorithm type or domain is not supported
        """
        # Check if the algorithm type is supported
        if algorithm_type not in self.optimizers:
            raise ValueError(f"Unsupported algorithm type: {algorithm_type}")
        
        # Get the optimizer info
        optimizer_info = self.optimizers[algorithm_type]
        
        # Create the configuration
        effective_config = dict(optimizer_info['default_config'])
        if config:
            effective_config.update(config)
        
        # Create the optimizer
        if domain == 'schedule' and 'schedule' in optimizer_info:
            optimizer = optimizer_info['schedule'](effective_config)
        else:
            # Use the base optimizer class
            optimizer = optimizer_info['class'](effective_config)
        
        logger.info(f"Created {algorithm_type} optimizer for {domain} domain")
        
        return optimizer
    
    def get_available_algorithms(self) -> List[str]:
        """Get the available algorithm types.
        
        Returns:
            List of available algorithm types
        """
        return list(self.optimizers.keys())
    
    def get_algorithm_config(self, algorithm_type: str) -> Dict[str, Any]:
        """Get the default configuration for an algorithm type.
        
        Args:
            algorithm_type: Type of optimization algorithm
            
        Returns:
            Default configuration dictionary
            
        Raises:
            ValueError: If the algorithm type is not supported
        """
        if algorithm_type not in self.optimizers:
            raise ValueError(f"Unsupported algorithm type: {algorithm_type}")
        
        return dict(self.optimizers[algorithm_type]['default_config'])
    
    def register_optimizer(self, algorithm_type: str, optimizer_class: Any, 
                         domain_class: Dict[str, Any] = None, default_config: Dict[str, Any] = None):
        """Register a new optimizer.
        
        Args:
            algorithm_type: Type of optimization algorithm
            optimizer_class: The optimizer class
            domain_class: Dictionary mapping domains to specialized classes
            default_config: Default configuration options
        """
        self.optimizers[algorithm_type] = {
            'class': optimizer_class,
            'default_config': default_config or {}
        }
        
        if domain_class:
            self.optimizers[algorithm_type].update(domain_class)
        
        logger.info(f"Registered optimizer: {algorithm_type}")


class ScheduleOptimizationService:
    """Service for optimizing schedules using various algorithms."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the schedule optimization service.
        
        Args:
            config: Configuration options
        """
        self.config = config or {}
        self.factory = OptimizerFactory()
    
    def optimize_schedule(self, schedule: Dict[str, Any], algorithm_type: str = None, 
                        config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Optimize a schedule.
        
        Args:
            schedule: The schedule to optimize
            algorithm_type: Type of optimization algorithm (defaults to 'simulated_annealing')
            config: Algorithm-specific configuration options
            
        Returns:
            The optimized schedule and optimization statistics
        """
        # Use simulated annealing by default
        algorithm_type = algorithm_type or 'simulated_annealing'
        
        # Create configuration
        effective_config = dict(self.config)
        if config:
            effective_config.update(config)
        
        # Get the sport type
        sport_type = schedule.get('sportType', 'generic').lower()
        
        # Add sport-specific configuration
        if sport_type == 'basketball':
            if 'constraint_weights' not in effective_config:
                effective_config['constraint_weights'] = {}
            
            # Basketball-specific weights
            effective_config['constraint_weights'].update({
                'rest_days': 12.0,  # More important for basketball
                'travel_distance': 6.0,
                'home_away_balance': 4.0,
                'rivalry_games': 3.0
            })
        
        elif sport_type == 'football':
            if 'constraint_weights' not in effective_config:
                effective_config['constraint_weights'] = {}
            
            # Football-specific weights
            effective_config['constraint_weights'].update({
                'rest_days': 15.0,  # Very important for football
                'travel_distance': 4.0,
                'home_away_balance': 5.0,
                'rivalry_games': 5.0  # Rivalries are important in football
            })
        
        # Create the optimizer
        optimizer = self.factory.create_optimizer(algorithm_type, 'schedule', effective_config)
        
        # Optimize the schedule
        logger.info(f"Optimizing {sport_type} schedule using {algorithm_type}")
        result = optimizer.optimize_schedule(schedule)
        
        # Return the optimized schedule and statistics
        return {
            'schedule': result['solution'],
            'optimization': {
                'algorithm': algorithm_type,
                'initialScore': result['initial_fitness'] if 'initial_fitness' in result else result['initial_score'],
                'finalScore': result['fitness'] if 'fitness' in result else result['score'],
                'improvement': result['improvement'],
                'statistics': result['stats']
            }
        }
    
    def get_available_algorithms(self) -> List[Dict[str, Any]]:
        """Get information about available optimization algorithms.
        
        Returns:
            List of dictionaries with algorithm information
        """
        algorithms = []
        
        for algorithm_type in self.factory.get_available_algorithms():
            config = self.factory.get_algorithm_config(algorithm_type)
            
            algorithms.append({
                'type': algorithm_type,
                'config': config,
                'description': self._get_algorithm_description(algorithm_type)
            })
        
        return algorithms
    
    def _get_algorithm_description(self, algorithm_type: str) -> str:
        """Get a description of an algorithm type.
        
        Args:
            algorithm_type: Type of optimization algorithm
            
        Returns:
            Description of the algorithm
        """
        descriptions = {
            'simulated_annealing': "Simulated Annealing is a probabilistic optimization algorithm inspired by the annealing process in metallurgy. It works well for problems with many local optima.",
            'genetic_algorithm': "Genetic Algorithm is an evolutionary optimization method that mimics natural selection. It maintains a population of solutions and evolves them over generations."
        }
        
        return descriptions.get(algorithm_type, "No description available")