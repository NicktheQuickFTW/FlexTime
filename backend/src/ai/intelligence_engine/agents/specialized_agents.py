"""
Specialized Agents for HELiiX Intelligence Engine

This module provides specialized agents that perform specific tasks within the
Intelligence Engine.
"""

import logging
import uuid
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime

from .base_agent import Agent, agent_registry
from .director_agents import DirectorAgent, director_registry

# Configure logging
logger = logging.getLogger('intelligence_engine.agents.specialized')

class SpecializedAgent(Agent):
    """Base class for all specialized agents."""
    
    def __init__(self, agent_id: Optional[str] = None, specialization: str = 'base_specialized', 
                director_type: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new specialized agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            specialization: Type of specialization
            director_type: Type of director to register with (optional)
            config: Configuration options
        """
        super().__init__(agent_id, f"specialized_{specialization}", config)
        self.specialization = specialization
        self.director_type = director_type
        self.director_id = None
        
        # Register message handlers
        self.register_message_handler('execute_task', self._handle_execute_task)
    
    def initialize(self) -> bool:
        """Initialize the specialized agent.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        success = super().initialize()
        
        if success:
            # Register with the agent registry
            agent_registry.register_agent(self)
            logger.info(f"Specialized agent {self.agent_id} registered with registry")
            
            # Register with a director if specified
            if self.director_type:
                director = director_registry.get_director(self.director_type)
                
                if director:
                    # Send registration message
                    response = self.send_message(director.agent_id, 'register_agent', {
                        'agent_id': self.agent_id,
                        'agent_type': self.agent_type,
                        'capabilities': list(self.capabilities)
                    })
                    
                    if response.get('success', False):
                        self.director_id = director.agent_id
                        logger.info(f"Specialized agent {self.agent_id} registered with director {director.agent_id}")
                    else:
                        logger.warning(f"Failed to register with director {director.agent_id}: {response.get('error', 'Unknown error')}")
                else:
                    logger.warning(f"Director of type {self.director_type} not found")
        
        return success
    
    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task.
        
        Args:
            task: The task to execute
            
        Returns:
            Task execution result
        """
        task_type = task.get('type')
        task_id = task.get('task_id')
        parameters = task.get('parameters', {})
        
        logger.info(f"Specialized agent {self.agent_id} executing task {task_id} of type {task_type}")
        
        try:
            # Check if we have a handler for this task type
            handler_method_name = f"_execute_{task_type}"
            handler = getattr(self, handler_method_name, None)
            
            if handler and callable(handler):
                # Execute the handler
                result = handler(parameters)
                
                # Send task status update to director
                if self.director_id:
                    self.send_message(self.director_id, 'task_status', {
                        'task_id': task_id,
                        'status': 'completed',
                        'result': result
                    })
                
                return {
                    'success': True,
                    'task_id': task_id,
                    'result': result
                }
            else:
                error_msg = f"No handler for task type {task_type}"
                logger.error(error_msg)
                
                # Send task status update to director
                if self.director_id:
                    self.send_message(self.director_id, 'task_status', {
                        'task_id': task_id,
                        'status': 'failed',
                        'error': error_msg
                    })
                
                return {
                    'success': False,
                    'error': error_msg
                }
        except Exception as e:
            error_msg = f"Error executing task {task_id}: {str(e)}"
            logger.exception(error_msg)
            
            # Send task status update to director
            if self.director_id:
                self.send_message(self.director_id, 'task_status', {
                    'task_id': task_id,
                    'status': 'failed',
                    'error': error_msg
                })
            
            return {
                'success': False,
                'error': error_msg
            }
    
    def _handle_execute_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a task execution request.
        
        Args:
            message: The execution request message
            
        Returns:
            Response message
        """
        # Extract task details
        content = message.get('content', {})
        task_id = content.get('task_id')
        task_type = content.get('type')
        parameters = content.get('parameters', {})
        
        if not task_id or not task_type:
            return {
                'success': False,
                'error': 'Missing task ID or type'
            }
        
        # Create task object
        task = {
            'task_id': task_id,
            'type': task_type,
            'parameters': parameters
        }
        
        # Execute the task
        return self.execute_task(task)


class OptimizationAgent(SpecializedAgent):
    """Specialized agent for schedule optimization."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new optimization agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'optimization', 'scheduling', config)
        
        # Register optimization-specific capabilities
        self.register_capability('schedule_optimization')
        
        # Get algorithm type from config
        self.algorithm_type = config.get('algorithm_type', 'simulated_annealing')
        
        # Register algorithm-specific capability
        self.register_capability(f"{self.algorithm_type}_optimization")
    
    def _execute_optimize_schedule(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize a schedule.
        
        Args:
            parameters: Optimization parameters
            
        Returns:
            Optimization result
        """
        # Extract parameters
        schedule = parameters.get('schedule')
        algorithm_type = parameters.get('algorithmType', self.algorithm_type)
        config = parameters.get('config', {})
        
        if not schedule:
            raise ValueError("Schedule data is required")
        
        logger.info(f"Optimizing schedule using {algorithm_type}")
        
        # Import optimization service here to avoid circular imports
        from ..optimization import schedule_optimization_service
        
        # Optimize the schedule
        result = schedule_optimization_service.optimize_schedule(schedule, algorithm_type, config)
        
        return result


class ScheduleGenerationAgent(SpecializedAgent):
    """Specialized agent for schedule generation."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new schedule generation agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'schedule_generation', 'scheduling', config)
        
        # Register schedule generation capability
        self.register_capability('schedule_generation')
        
        # Get sport type from config
        self.sport_type = config.get('sport_type', 'generic')
        
        # Register sport-specific capability if specified
        if self.sport_type != 'generic':
            self.register_capability(f"{self.sport_type}_schedule_generation")
    
    def _execute_generate_schedule(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a schedule.
        
        Args:
            parameters: Generation parameters
            
        Returns:
            Generated schedule
        """
        # Extract parameters
        sport_type = parameters.get('sportType', self.sport_type)
        teams = parameters.get('teams', [])
        constraints = parameters.get('constraints', [])
        options = parameters.get('options', {})
        
        if not teams:
            raise ValueError("Teams data is required")
        
        logger.info(f"Generating {sport_type} schedule for {len(teams)} teams")
        
        # Import schedule generator here to avoid circular imports
        from ..scheduling.schedule_generator import create_generator
        
        # Create a generator for the specified sport type
        generator = create_generator(sport_type)
        
        # Generate a schedule
        schedule = generator.generate(teams, constraints, options)
        
        return schedule


class ConstraintManagementAgent(SpecializedAgent):
    """Specialized agent for constraint management."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new constraint management agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'constraint_management', 'scheduling', config)
        
        # Register constraint management capability
        self.register_capability('constraint_management')
    
    def _execute_validate_constraints(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate constraints for a schedule.
        
        Args:
            parameters: Validation parameters
            
        Returns:
            Validation result
        """
        # Extract parameters
        schedule = parameters.get('schedule')
        constraints = parameters.get('constraints', [])
        
        if not schedule:
            raise ValueError("Schedule data is required")
        
        logger.info(f"Validating constraints for schedule")
        
        # Placeholder implementation
        # In a real implementation, this would check each constraint
        violations = []
        
        # Dummy logic to simulate constraint validation
        for constraint in constraints:
            # Check if constraint is satisfied
            # For now, just generate random violations
            import random
            if random.random() < 0.2:  # 20% chance of violation
                violations.append({
                    'constraintType': constraint.get('type'),
                    'severity': random.choice(['low', 'medium', 'high']),
                    'details': f"Violation of {constraint.get('type')} constraint"
                })
        
        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'violationCount': len(violations),
            'validatedConstraints': len(constraints)
        }


class AnalysisAgent(SpecializedAgent):
    """Specialized agent for schedule analysis."""
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """Initialize a new analysis agent.
        
        Args:
            agent_id: Unique identifier for the agent (auto-generated if not provided)
            config: Configuration options
        """
        super().__init__(agent_id, 'analysis', 'analysis', config)
        
        # Register analysis capability
        self.register_capability('schedule_analysis')
        
        # Get analysis type from config
        self.analysis_type = config.get('analysis_type', 'generic')
        
        # Register specific analysis capability if specified
        if self.analysis_type != 'generic':
            self.register_capability(f"{self.analysis_type}_analysis")
    
    def _execute_analyze_schedule(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a schedule.
        
        Args:
            parameters: Analysis parameters
            
        Returns:
            Analysis result
        """
        # Extract parameters
        schedule = parameters.get('schedule')
        analysis_type = parameters.get('analysisType', self.analysis_type)
        
        if not schedule:
            raise ValueError("Schedule data is required")
        
        logger.info(f"Analyzing schedule using {analysis_type} analysis")
        
        # Placeholder implementation
        # In a real implementation, this would perform actual analysis
        
        # Basic metrics
        game_count = 0
        team_counts = {}
        for game_day in schedule.get('gameDays', []):
            for game in game_day.get('games', []):
                game_count += 1
                
                home_team = game.get('homeTeam')
                away_team = game.get('awayTeam')
                
                if home_team:
                    team_counts[home_team] = team_counts.get(home_team, 0) + 1
                
                if away_team:
                    team_counts[away_team] = team_counts.get(away_team, 0) + 1
        
        # Generate insights
        insights = [
            f"Schedule contains {game_count} games",
            f"Schedule spans {len(schedule.get('gameDays', []))} game days"
        ]
        
        # Generate recommendations
        recommendations = []
        
        # Check for imbalance
        for team, count in team_counts.items():
            if count < game_count / len(team_counts) * 0.8:
                recommendations.append({
                    'target': team,
                    'action': 'Add more games',
                    'priority': 'high',
                    'details': f"{team} has fewer games than average"
                })
        
        return {
            'metrics': {
                'gameCount': game_count,
                'gameDays': len(schedule.get('gameDays', [])),
                'teams': len(team_counts)
            },
            'insights': insights,
            'recommendations': recommendations,
            'analysisType': analysis_type
        }