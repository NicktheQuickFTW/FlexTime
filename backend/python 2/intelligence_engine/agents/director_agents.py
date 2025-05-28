"""
Director Agents for HELiiX Intelligence Engine

This module provides director agents that oversee and coordinate various aspects
of the scheduling and optimization process.
"""

import logging
import uuid
import time
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime

from .base_agent import Agent, agent_registry

# Configure logging
logger = logging.getLogger('intelligence_engine.agents.director')

class DirectorAgent(Agent):
    """Base class for all director agents."""
    
    def __init__(self, agent_id: Optional[str] = None, director_type: str = 'base_director', 
                config: Optional[Dict[str, Any]] = None):
        """Initialize a new director agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            director_type: Type of director
            config: Configuration options
        """
        super().__init__(agent_id, f"director_{director_type}", config)
        self.director_type = director_type
        self.specialized_agents = set()
        self.tasks = {}
        self.task_history = []
        
        # Register base capabilities
        self.register_capability('task_delegation')
        self.register_capability('agent_coordination')
        
        # Register message handlers
        self.register_message_handler('delegate_task', self._handle_delegate_task)
        self.register_message_handler('task_status', self._handle_task_status)
        self.register_message_handler('register_agent', self._handle_register_agent)
    
    def initialize(self) -> bool:
        """Initialize the director agent.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        success = super().initialize()
        
        if success:
            # Register with the registry
            agent_registry.register_agent(self)
            logger.info(f"Director agent {self.agent_id} registered with registry")
        
        return success
    
    def register_specialized_agent(self, agent_id: str):
        """Register a specialized agent with this director.
        
        Args:
            agent_id: ID of the specialized agent
        """
        self.specialized_agents.add(agent_id)
        logger.info(f"Director {self.agent_id} registered specialized agent {agent_id}")
    
    def unregister_specialized_agent(self, agent_id: str):
        """Unregister a specialized agent from this director.
        
        Args:
            agent_id: ID of the specialized agent
        """
        if agent_id in self.specialized_agents:
            self.specialized_agents.remove(agent_id)
            logger.info(f"Director {self.agent_id} unregistered specialized agent {agent_id}")
    
    def create_task(self, task_type: str, description: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new task.
        
        Args:
            task_type: Type of task
            description: Description of the task
            parameters: Task parameters
            
        Returns:
            The created task
        """
        task_id = str(uuid.uuid4())
        task = {
            'task_id': task_id,
            'type': task_type,
            'description': description,
            'parameters': parameters,
            'status': 'created',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'assigned_to': None,
            'result': None
        }
        
        self.tasks[task_id] = task
        logger.info(f"Director {self.agent_id} created task {task_id} of type {task_type}")
        
        return task
    
    def delegate_task(self, task_id: str, agent_id: str) -> bool:
        """Delegate a task to a specialized agent.
        
        Args:
            task_id: ID of the task
            agent_id: ID of the agent to delegate to
            
        Returns:
            True if delegation was successful, False otherwise
        """
        # Check if the task exists
        if task_id not in self.tasks:
            logger.error(f"Task {task_id} not found for delegation")
            return False
        
        # Check if the agent is registered
        agent = agent_registry.get_agent(agent_id)
        if not agent:
            logger.error(f"Agent {agent_id} not found for delegation")
            return False
        
        task = self.tasks[task_id]
        
        # Update task status
        task['status'] = 'delegated'
        task['assigned_to'] = agent_id
        task['updated_at'] = datetime.now().isoformat()
        
        # Send delegation message
        response = self.send_message(agent_id, 'execute_task', {
            'task_id': task_id,
            'type': task['type'],
            'description': task['description'],
            'parameters': task['parameters']
        })
        
        if response.get('success', False):
            logger.info(f"Director {self.agent_id} delegated task {task_id} to agent {agent_id}")
            return True
        else:
            # Revert task status
            task['status'] = 'created'
            task['assigned_to'] = None
            logger.error(f"Failed to delegate task {task_id} to agent {agent_id}: {response.get('error', 'Unknown error')}")
            return False
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a task.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task status information
        """
        if task_id not in self.tasks:
            return {
                'success': False,
                'error': f"Task {task_id} not found"
            }
        
        task = self.tasks[task_id]
        return {
            'success': True,
            'task_id': task_id,
            'status': task['status'],
            'created_at': task['created_at'],
            'updated_at': task['updated_at'],
            'assigned_to': task['assigned_to']
        }
    
    def get_task_result(self, task_id: str) -> Dict[str, Any]:
        """Get the result of a task.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task result
        """
        if task_id not in self.tasks:
            return {
                'success': False,
                'error': f"Task {task_id} not found"
            }
        
        task = self.tasks[task_id]
        
        if task['status'] != 'completed':
            return {
                'success': False,
                'error': f"Task {task_id} is not completed ({task['status']})"
            }
        
        return {
            'success': True,
            'task_id': task_id,
            'result': task['result']
        }
    
    def _handle_delegate_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a task delegation request.
        
        Args:
            message: The delegation request message
            
        Returns:
            Response message
        """
        # Extract task details
        content = message.get('content', {})
        task_type = content.get('type')
        description = content.get('description', f"Task of type {task_type}")
        parameters = content.get('parameters', {})
        
        if not task_type:
            return {
                'success': False,
                'error': 'Missing task type'
            }
        
        # Create the task
        task = self.create_task(task_type, description, parameters)
        
        # Decide which agent to delegate to
        agent_id = self._select_agent_for_task(task)
        
        if not agent_id:
            return {
                'success': False,
                'error': 'No suitable agent found for task'
            }
        
        # Delegate the task
        success = self.delegate_task(task['task_id'], agent_id)
        
        if success:
            return {
                'success': True,
                'task_id': task['task_id'],
                'agent_id': agent_id
            }
        else:
            return {
                'success': False,
                'error': f"Failed to delegate task to agent {agent_id}"
            }
    
    def _handle_task_status(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a task status update.
        
        Args:
            message: The status update message
            
        Returns:
            Response message
        """
        content = message.get('content', {})
        task_id = content.get('task_id')
        status = content.get('status')
        result = content.get('result')
        
        if not task_id or not status:
            return {
                'success': False,
                'error': 'Missing task ID or status'
            }
        
        # Check if the task exists
        if task_id not in self.tasks:
            return {
                'success': False,
                'error': f"Task {task_id} not found"
            }
        
        # Update task status
        task = self.tasks[task_id]
        task['status'] = status
        task['updated_at'] = datetime.now().isoformat()
        
        if status == 'completed' and result is not None:
            task['result'] = result
            logger.info(f"Task {task_id} completed with result")
        
        return {
            'success': True,
            'task_id': task_id,
            'status': status
        }
    
    def _handle_register_agent(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle an agent registration request.
        
        Args:
            message: The registration request message
            
        Returns:
            Response message
        """
        content = message.get('content', {})
        agent_id = content.get('agent_id')
        agent_type = content.get('agent_type')
        capabilities = content.get('capabilities', [])
        
        if not agent_id or not agent_type:
            return {
                'success': False,
                'error': 'Missing agent ID or type'
            }
        
        # Register the agent
        self.register_specialized_agent(agent_id)
        
        return {
            'success': True,
            'message': f"Agent {agent_id} registered with director {self.agent_id}"
        }
    
    def _select_agent_for_task(self, task: Dict[str, Any]) -> Optional[str]:
        """Select an agent to handle a task.
        
        Args:
            task: The task to delegate
            
        Returns:
            ID of the selected agent, or None if no suitable agent found
        """
        # This is a placeholder implementation
        # Each director subclass should implement its own agent selection logic
        return None


class SchedulingDirectorAgent(DirectorAgent):
    """Director agent responsible for scheduling operations."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new scheduling director agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'scheduling', config)
        
        # Register scheduling-specific capabilities
        self.register_capability('schedule_generation')
        self.register_capability('schedule_optimization')
        self.register_capability('constraint_management')
        
        # Track algorithm preferences
        self.algorithm_preferences = {}
        
        # Initialize with default algorithm preferences
        default_preferences = {
            'generate_schedule': {
                'default': 'round_robin',
                'basketball': 'basketball_generator',
                'football': 'football_generator'
            },
            'optimize_schedule': {
                'default': 'simulated_annealing',
                'basketball': 'simulated_annealing',
                'football': 'genetic_algorithm'
            }
        }
        
        self.algorithm_preferences = self.config.get('algorithm_preferences', default_preferences)
    
    def _select_agent_for_task(self, task: Dict[str, Any]) -> Optional[str]:
        """Select an agent to handle a task.
        
        Args:
            task: The task to delegate
            
        Returns:
            ID of the selected agent, or None if no suitable agent found
        """
        task_type = task.get('type')
        parameters = task.get('parameters', {})
        sport_type = parameters.get('sportType', 'generic').lower()
        
        # Check if we have specialized agents for this task
        specialized_agents = []
        
        if task_type == 'generate_schedule':
            # Select an agent that can generate schedules
            specialized_agents = agent_registry.get_agents_by_capability('schedule_generation')
            
            # Look for sport-specific agents
            sport_agents = [agent for agent in specialized_agents 
                           if f"{sport_type}_schedule_generation" in agent.capabilities]
            
            if sport_agents:
                # Return the first sport-specific agent
                return sport_agents[0].agent_id
            
        elif task_type == 'optimize_schedule':
            # Select an agent that can optimize schedules
            specialized_agents = agent_registry.get_agents_by_capability('schedule_optimization')
            
            # Look for sport-specific agents
            sport_agents = [agent for agent in specialized_agents 
                          if f"{sport_type}_schedule_optimization" in agent.capabilities]
            
            if sport_agents:
                # Return the first sport-specific agent
                return sport_agents[0].agent_id
            
            # Get the preferred algorithm
            algorithm = parameters.get('algorithmType')
            if not algorithm:
                # Use default algorithm for the sport type
                sport_prefs = self.algorithm_preferences.get('optimize_schedule', {})
                algorithm = sport_prefs.get(sport_type, sport_prefs.get('default', 'simulated_annealing'))
                logger.info(f"Using default optimization algorithm for {sport_type}: {algorithm}")
            
            # Look for algorithm-specific agents
            algorithm_agents = [agent for agent in specialized_agents 
                              if f"{algorithm}_optimization" in agent.capabilities]
            
            if algorithm_agents:
                # Return the first algorithm-specific agent
                return algorithm_agents[0].agent_id
            
        elif task_type == 'validate_constraints':
            # Select an agent that can validate constraints
            specialized_agents = agent_registry.get_agents_by_capability('constraint_management')
        
        # If we have any specialized agents, return the first one
        if specialized_agents:
            return specialized_agents[0].agent_id
        
        return None


class OperationsDirectorAgent(DirectorAgent):
    """Director agent responsible for operational aspects of scheduling."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new operations director agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'operations', config)
        
        # Register operations-specific capabilities
        self.register_capability('resource_management')
        self.register_capability('venue_management')
        self.register_capability('travel_management')
    
    def _select_agent_for_task(self, task: Dict[str, Any]) -> Optional[str]:
        """Select an agent to handle a task.
        
        Args:
            task: The task to delegate
            
        Returns:
            ID of the selected agent, or None if no suitable agent found
        """
        task_type = task.get('type')
        
        # Select an agent based on task type
        if task_type == 'manage_resources':
            agents = agent_registry.get_agents_by_capability('resource_management')
        elif task_type == 'manage_venues':
            agents = agent_registry.get_agents_by_capability('venue_management')
        elif task_type == 'optimize_travel':
            agents = agent_registry.get_agents_by_capability('travel_management')
        else:
            # No specialized capability for this task type
            agents = []
        
        # If we have any matching agents, return the first one
        if agents:
            return agents[0].agent_id
        
        return None


class AnalysisDirectorAgent(DirectorAgent):
    """Director agent responsible for analysis and insights."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new analysis director agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'analysis', config)
        
        # Register analysis-specific capabilities
        self.register_capability('schedule_analysis')
        self.register_capability('pattern_extraction')
        self.register_capability('predictive_analytics')
        self.register_capability('metrics_calculation')
    
    def _select_agent_for_task(self, task: Dict[str, Any]) -> Optional[str]:
        """Select an agent to handle a task.
        
        Args:
            task: The task to delegate
            
        Returns:
            ID of the selected agent, or None if no suitable agent found
        """
        task_type = task.get('type')
        parameters = task.get('parameters', {})
        analysis_type = parameters.get('analysisType', 'generic').lower()
        
        # Select an agent based on task type
        if task_type == 'analyze_schedule':
            agents = agent_registry.get_agents_by_capability('schedule_analysis')
        elif task_type == 'extract_patterns':
            agents = agent_registry.get_agents_by_capability('pattern_extraction')
        elif task_type == 'predict_outcomes':
            agents = agent_registry.get_agents_by_capability('predictive_analytics')
        elif task_type == 'calculate_metrics':
            agents = agent_registry.get_agents_by_capability('metrics_calculation')
        else:
            # No specialized capability for this task type
            agents = []
        
        # Look for specialized agents for the analysis type
        specialized_agents = [agent for agent in agents 
                            if f"{analysis_type}_analysis" in agent.capabilities]
        
        if specialized_agents:
            return specialized_agents[0].agent_id
        elif agents:
            return agents[0].agent_id
        
        return None


# Create a director registry
class DirectorRegistry:
    """Registry for managing director agents."""
    
    _instance = None
    
    def __new__(cls):
        """Create a singleton instance."""
        if cls._instance is None:
            cls._instance = super(DirectorRegistry, cls).__new__(cls)
            cls._instance.directors = {}
        return cls._instance
    
    def register_director(self, director: DirectorAgent):
        """Register a director agent.
        
        Args:
            director: The director agent to register
        """
        self.directors[director.director_type] = director
        logger.info(f"Registered director agent of type {director.director_type}")
    
    def get_director(self, director_type: str) -> Optional[DirectorAgent]:
        """Get a director agent by type.
        
        Args:
            director_type: Type of the director agent
            
        Returns:
            The director agent or None if not found
        """
        return self.directors.get(director_type)


# Create a global director registry instance
director_registry = DirectorRegistry()