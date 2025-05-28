"""
Optimization module for HELiiX Intelligence Engine

This module provides optimization algorithms and utilities.
"""

from .simulated_annealing import SimulatedAnnealing, ScheduleOptimizer as SimulatedAnnealingScheduleOptimizer
from .genetic_algorithm import GeneticAlgorithm, ScheduleGeneticOptimizer
from .optimizer_factory import OptimizerFactory, ScheduleOptimizationService

# Create singleton instances
optimizer_factory = OptimizerFactory()
schedule_optimization_service = ScheduleOptimizationService()

__all__ = [
    'SimulatedAnnealing',
    'SimulatedAnnealingScheduleOptimizer',
    'GeneticAlgorithm',
    'ScheduleGeneticOptimizer',
    'OptimizerFactory',
    'ScheduleOptimizationService',
    'optimizer_factory',
    'schedule_optimization_service',
]