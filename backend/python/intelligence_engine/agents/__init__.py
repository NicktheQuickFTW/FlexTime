"""
Agents module for HELiiX Intelligence Engine

This module provides agent implementations for the Python backend.
"""

from .base_agent import Agent, AgentRegistry, agent_registry
from .director_agents import (
    DirectorAgent, 
    SchedulingDirectorAgent, 
    OperationsDirectorAgent, 
    AnalysisDirectorAgent, 
    DirectorRegistry, 
    director_registry
)
from .specialized_agents import (
    SpecializedAgent,
    OptimizationAgent,
    ScheduleGenerationAgent,
    ConstraintManagementAgent,
    AnalysisAgent
)

def create_director_agent(director_type: str, config=None):
    """Create a director agent of the specified type.
    
    Args:
        director_type: Type of director agent to create
        config: Configuration options
        
    Returns:
        A director agent instance
    """
    if director_type == 'scheduling':
        return SchedulingDirectorAgent(config=config)
    elif director_type == 'operations':
        return OperationsDirectorAgent(config=config)
    elif director_type == 'analysis':
        return AnalysisDirectorAgent(config=config)
    else:
        raise ValueError(f"Unknown director type: {director_type}")

def create_specialized_agent(specialization: str, config=None):
    """Create a specialized agent of the specified type.
    
    Args:
        specialization: Type of specialized agent to create
        config: Configuration options
        
    Returns:
        A specialized agent instance
    """
    if specialization == 'optimization':
        return OptimizationAgent(config=config)
    elif specialization == 'schedule_generation':
        return ScheduleGenerationAgent(config=config)
    elif specialization == 'constraint_management':
        return ConstraintManagementAgent(config=config)
    elif specialization == 'analysis':
        return AnalysisAgent(config=config)
    else:
        raise ValueError(f"Unknown specialization: {specialization}")

def initialize_agent_system(config=None):
    """Initialize the agent system.
    
    Args:
        config: Configuration options
        
    Returns:
        A tuple of (director_registry, agent_registry)
    """
    config = config or {}
    
    # Create director agents
    scheduling_director = create_director_agent('scheduling', config.get('scheduling', {}))
    operations_director = create_director_agent('operations', config.get('operations', {}))
    analysis_director = create_director_agent('analysis', config.get('analysis', {}))
    
    # Initialize directors
    scheduling_director.initialize()
    operations_director.initialize()
    analysis_director.initialize()
    
    # Register directors
    director_registry.register_director(scheduling_director)
    director_registry.register_director(operations_director)
    director_registry.register_director(analysis_director)
    
    # Create specialized agents
    optimization_agent = create_specialized_agent('optimization', config.get('optimization', {}))
    schedule_generation_agent = create_specialized_agent('schedule_generation', config.get('schedule_generation', {}))
    constraint_agent = create_specialized_agent('constraint_management', config.get('constraint_management', {}))
    analysis_agent = create_specialized_agent('analysis', config.get('analysis', {}))
    
    # Initialize specialized agents
    # (will automatically register with directors)
    optimization_agent.initialize()
    schedule_generation_agent.initialize()
    constraint_agent.initialize()
    analysis_agent.initialize()
    
    return director_registry, agent_registry

__all__ = [
    'Agent',
    'AgentRegistry',
    'agent_registry',
    'DirectorAgent', 
    'SchedulingDirectorAgent', 
    'OperationsDirectorAgent', 
    'AnalysisDirectorAgent', 
    'DirectorRegistry', 
    'director_registry',
    'SpecializedAgent',
    'OptimizationAgent',
    'ScheduleGenerationAgent',
    'ConstraintManagementAgent',
    'AnalysisAgent',
    'create_director_agent',
    'create_specialized_agent',
    'initialize_agent_system'
]