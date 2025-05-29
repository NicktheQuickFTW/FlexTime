"""
Schedule Knowledge Enhancer for the HELiiX Intelligence Engine

This module enhances the scheduling knowledge graph with advanced reasoning capabilities
and integrates ML-driven insights to improve scheduling decisions.
"""

import logging
from typing import Dict, Any, List, Set, Tuple, Optional
from datetime import datetime, timedelta

from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph, Entity
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Configure logging
logger = logging.getLogger('intelligence_engine.knowledge_graph.schedule_knowledge_enhancer')

class ScheduleKnowledgeEnhancer:
    """Enhances the scheduling knowledge graph with ML-driven insights."""
    
    def __init__(self, graph: SchedulingKnowledgeGraph = None, pattern_extractor: PatternExtractor = None):
        """Initialize the schedule knowledge enhancer.
        
        Args:
            graph: The scheduling knowledge graph to enhance
            pattern_extractor: Pattern extractor for ML insights
        """
        self.graph = graph or SchedulingKnowledgeGraph()
        self.pattern_extractor = pattern_extractor or PatternExtractor()
        self.insight_relationships = [
            'optimal_scheduling_time',
            'preferred_opponent',
            'optimal_rest_days',
            'venue_preference',
            'travel_efficiency',
            'fan_engagement',
            'constraint_importance'
        ]
    
    def enhance_from_schedule(self, schedule: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance the knowledge graph with insights from a schedule.
        
        Args:
            schedule: Schedule data to analyze
            
        Returns:
            Dictionary with enhancement statistics
        """
        logger.info(f"Enhancing knowledge graph from schedule {schedule.get('id', 'unknown')}")
        
        # Extract patterns from the schedule
        patterns = self.pattern_extractor.extract_patterns_from_schedule(schedule)
        logger.info(f"Extracted {len(patterns)} patterns from schedule")
        
        # Create entities from the schedule if they don't exist
        teams_added = self._ensure_teams_exist(schedule)
        
        # Enhance the graph with the extracted patterns
        insights_added = 0
        
        for pattern in patterns:
            pattern_type = pattern.get('type')
            sport_type = pattern.get('sport_type', 'generic')
            
            # Process different pattern types
            if pattern_type == 'team_workload':
                insights_added += self._enhance_with_team_workload(pattern)
            elif pattern_type == 'home_away_balance':
                insights_added += self._enhance_with_home_away_balance(pattern)
            elif pattern_type == 'game_day_frequency':
                insights_added += self._enhance_with_game_day_frequency(pattern)
            elif pattern_type == 'common_game_interval':
                insights_added += self._enhance_with_common_game_interval(pattern)
            elif pattern_type == 'home_game_streak':
                insights_added += self._enhance_with_home_game_streak(pattern)
            elif pattern_type == 'away_game_streak':
                insights_added += self._enhance_with_away_game_streak(pattern)
        
        # Create a composite insight entity for the schedule
        schedule_insight_id = f"schedule_insight_{schedule.get('id', 'unknown')}"
        self.graph.add_entity(Entity(
            schedule_insight_id,
            'schedule_insight',
            {
                'schedule_id': schedule.get('id'),
                'sport_type': schedule.get('sportType', 'generic'),
                'pattern_count': len(patterns),
                'timestamp': datetime.now().isoformat(),
                'quality': schedule.get('metrics', {}).get('quality', 0.5)
            }
        ))
        
        # Link insights to teams
        for team_id in schedule.get('teams', []):
            entity_id = f"team_{team_id}"
            if entity_id in self.graph.entities:
                self.graph.add_relationship(
                    schedule_insight_id,
                    'applies_to',
                    entity_id,
                    {'source': 'schedule_analysis'}
                )
        
        return {
            'teams_added': teams_added,
            'patterns_extracted': len(patterns),
            'insights_added': insights_added,
            'total_entities': len(self.graph.entities)
        }
    
    def enhance_from_feedback(self, feedback_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Enhance the knowledge graph with insights from feedback data.
        
        Args:
            feedback_data: List of feedback entries
            
        Returns:
            Dictionary with enhancement statistics
        """
        logger.info(f"Enhancing knowledge graph from {len(feedback_data)} feedback entries")
        
        # Extract patterns from feedback
        patterns = self.pattern_extractor.extract_patterns_from_feedback(feedback_data)
        logger.info(f"Extracted {len(patterns)} patterns from feedback")
        
        # Process feedback patterns
        insights_added = 0
        
        for pattern in patterns:
            # Create feedback insight entity
            insight_id = f"feedback_insight_{pattern.get('type')}_{datetime.now().timestamp()}"
            
            self.graph.add_entity(Entity(
                insight_id,
                'feedback_insight',
                {
                    'pattern_type': pattern.get('type'),
                    'description': pattern.get('description'),
                    'value': pattern.get('value'),
                    'confidence': pattern.get('confidence', 0.5),
                    'timestamp': datetime.now().isoformat()
                }
            ))
            
            # Link insight to relevant teams or venues
            if 'parameters' in pattern:
                insights_added += 1
        
        return {
            'patterns_extracted': len(patterns),
            'insights_added': insights_added,
            'total_entities': len(self.graph.entities)
        }
    
    def enhance_from_experiences(self, experiences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Enhance the knowledge graph with insights from experience data.
        
        Args:
            experiences: List of experience entries
            
        Returns:
            Dictionary with enhancement statistics
        """
        logger.info(f"Enhancing knowledge graph from {len(experiences)} experience entries")
        
        # Extract patterns from experiences
        patterns = self.pattern_extractor.extract_patterns_from_experiences(experiences)
        logger.info(f"Extracted {len(patterns)} patterns from experiences")
        
        # Process experience patterns
        insights_added = 0
        algorithms_added = 0
        
        for pattern in patterns:
            pattern_type = pattern.get('type')
            
            if pattern_type == 'preferred_generator':
                # Add algorithm knowledge
                algo_name = pattern.get('value')
                algo_id = f"algorithm_{algo_name}"
                
                if not self.graph.get_entity(algo_id):
                    self.graph.add_entity(Entity(
                        algo_id,
                        'algorithm',
                        {
                            'name': algo_name,
                            'confidence': pattern.get('confidence', 0.5),
                            'description': pattern.get('description', f"Algorithm: {algo_name}")
                        }
                    ))
                    algorithms_added += 1
                
                # Link algorithm to task types
                task_type = pattern.get('task_type')
                if task_type:
                    task_type_id = f"task_type_{task_type}"
                    
                    if not self.graph.get_entity(task_type_id):
                        self.graph.add_entity(Entity(
                            task_type_id,
                            'task_type',
                            {'name': task_type}
                        ))
                    
                    self.graph.add_relationship(
                        task_type_id,
                        'preferred_algorithm',
                        algo_id,
                        {'confidence': pattern.get('confidence', 0.5)}
                    )
                    
                    insights_added += 1
            
            elif pattern_type == 'optimization_iterations':
                # Add optimization knowledge
                opt_param_id = f"optimization_parameter_{pattern_type}"
                
                if not self.graph.get_entity(opt_param_id):
                    self.graph.add_entity(Entity(
                        opt_param_id,
                        'optimization_parameter',
                        {
                            'name': 'optimizationIterations',
                            'value': pattern.get('value'),
                            'confidence': pattern.get('confidence', 0.5),
                            'description': pattern.get('description', 'Optimization iterations')
                        }
                    ))
                
                # Link to task types
                task_type = pattern.get('task_type')
                if task_type:
                    task_type_id = f"task_type_{task_type}"
                    
                    if not self.graph.get_entity(task_type_id):
                        self.graph.add_entity(Entity(
                            task_type_id,
                            'task_type',
                            {'name': task_type}
                        ))
                    
                    self.graph.add_relationship(
                        task_type_id,
                        'optimal_parameter',
                        opt_param_id,
                        {'confidence': pattern.get('confidence', 0.5)}
                    )
                    
                    insights_added += 1
            
            elif pattern_type in ['cooling_rate', 'initial_temperature']:
                # Add annealing algorithm parameters
                param_id = f"annealing_parameter_{pattern_type}"
                
                if not self.graph.get_entity(param_id):
                    self.graph.add_entity(Entity(
                        param_id,
                        'algorithm_parameter',
                        {
                            'name': next(iter(pattern.get('parameters', {}).keys()), pattern_type) if pattern.get('parameters') else pattern_type,
                            'value': pattern.get('value'),
                            'algorithm': 'simulated_annealing',
                            'confidence': pattern.get('confidence', 0.5),
                            'description': pattern.get('description', f"Parameter: {pattern_type}")
                        }
                    ))
                
                # Link to algorithm
                algo_id = "algorithm_simulated_annealing"
                if not self.graph.get_entity(algo_id):
                    self.graph.add_entity(Entity(
                        algo_id,
                        'algorithm',
                        {
                            'name': 'simulated_annealing',
                            'description': 'Simulated Annealing optimization algorithm'
                        }
                    ))
                    algorithms_added += 1
                
                self.graph.add_relationship(
                    algo_id,
                    'parameter',
                    param_id,
                    {'confidence': pattern.get('confidence', 0.5)}
                )
                
                insights_added += 1
        
        return {
            'patterns_extracted': len(patterns),
            'insights_added': insights_added,
            'algorithms_added': algorithms_added,
            'total_entities': len(self.graph.entities)
        }
    
    def query_scheduling_insights(self, sport_type: str = None, team_id: str = None) -> Dict[str, Any]:
        """Query scheduling insights from the knowledge graph.
        
        Args:
            sport_type: Optional sport type to filter by
            team_id: Optional team ID to get insights for
            
        Returns:
            Dictionary with scheduling insights
        """
        insights = {
            'parameters': {},
            'constraints': [],
            'algorithms': {},
            'teamInsights': {}
        }
        
        # Find relevant entities by sport type
        entity_filter = {}
        if sport_type:
            entity_filter['sportType'] = sport_type
        
        # Get task types and their parameter recommendations
        task_entities = self.graph.query('task_type')
        
        for task in task_entities:
            task_name = task.properties.get('name', 'unknown')
            
            # Get preferred algorithms
            algo_relationships = task.get_relationships('preferred_algorithm')
            if 'preferred_algorithm' in algo_relationships:
                for algo_id, props in algo_relationships['preferred_algorithm'].items():
                    algo_entity = self.graph.get_entity(algo_id)
                    if algo_entity:
                        insights['algorithms'][task_name] = {
                            'name': algo_entity.properties.get('name', 'unknown'),
                            'confidence': props.get('confidence', 0.5)
                        }
            
            # Get optimal parameters
            param_relationships = task.get_relationships('optimal_parameter')
            if 'optimal_parameter' in param_relationships:
                for param_id, props in param_relationships['optimal_parameter'].items():
                    param_entity = self.graph.get_entity(param_id)
                    if param_entity:
                        param_name = param_entity.properties.get('name', 'unknown')
                        param_value = param_entity.properties.get('value')
                        
                        if task_name not in insights['parameters']:
                            insights['parameters'][task_name] = {}
                        
                        insights['parameters'][task_name][param_name] = {
                            'value': param_value,
                            'confidence': props.get('confidence', 0.5)
                        }
        
        # Get team-specific insights if a team ID is provided
        if team_id:
            team_entity_id = f"team_{team_id}"
            team_entity = self.graph.get_entity(team_entity_id)
            
            if team_entity:
                team_insights = {
                    'homeAwayBalance': None,
                    'optimalRestDays': None,
                    'travelEfficiency': None,
                    'rivalries': []
                }
                
                # Get rivalries
                rival_relationships = team_entity.get_relationships('rivalry')
                if 'rivalry' in rival_relationships:
                    for rival_id, props in rival_relationships['rivalry'].items():
                        rival_entity = self.graph.get_entity(rival_id)
                        if rival_entity:
                            team_insights['rivalries'].append({
                                'teamId': rival_id.replace('team_', ''),
                                'name': rival_entity.properties.get('name', 'unknown'),
                                'intensity': props.get('intensity', 1.0)
                            })
                
                # Find insight relationships
                for rel_type in self.insight_relationships:
                    rel_data = team_entity.get_relationships(rel_type)
                    if rel_type in rel_data and rel_data[rel_type]:
                        # Process the first relationship of this type
                        first_rel = list(rel_data[rel_type].items())[0]
                        related_id, props = first_rel
                        
                        if rel_type == 'optimal_rest_days':
                            team_insights['optimalRestDays'] = {
                                'value': props.get('value'),
                                'confidence': props.get('confidence', 0.5)
                            }
                        elif rel_type == 'travel_efficiency':
                            team_insights['travelEfficiency'] = {
                                'maxDistance': props.get('maxDistance'),
                                'confidence': props.get('confidence', 0.5)
                            }
                
                insights['teamInsights'] = team_insights
        
        return insights
    
    def _ensure_teams_exist(self, schedule: Dict[str, Any]) -> int:
        """Make sure teams from the schedule exist in the graph.
        
        Args:
            schedule: Schedule data
            
        Returns:
            Number of teams added
        """
        teams_added = 0
        
        for team_id in schedule.get('teams', []):
            entity_id = f"team_{team_id}"
            
            if not self.graph.get_entity(entity_id):
                # Create a new team entity
                self.graph.add_team(
                    entity_id,
                    team_id,
                    {
                        'id': team_id,
                        'sportType': schedule.get('sportType', 'generic'),
                        'created': datetime.now().isoformat()
                    }
                )
                teams_added += 1
        
        logger.info(f"Added {teams_added} new teams to the knowledge graph")
        return teams_added
    
    def _enhance_with_team_workload(self, pattern: Dict[str, Any]) -> int:
        """Enhance the graph with team workload pattern.
        
        Args:
            pattern: The pattern data
            
        Returns:
            Number of insights added
        """
        insights_added = 0
        sport_type = pattern.get('sport_type', 'generic')
        value = pattern.get('value')
        confidence = pattern.get('confidence', 0.5)
        
        # Create a workload insight entity
        workload_id = f"workload_insight_{sport_type}_{datetime.now().timestamp()}"
        
        self.graph.add_entity(Entity(
            workload_id,
            'workload_insight',
            {
                'sport_type': sport_type,
                'average_games': value,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
        ))
        
        # Find teams of this sport type and link the insight
        team_entities = self.graph.query('team', {'sportType': sport_type})
        
        for team in team_entities:
            self.graph.add_relationship(
                team.entity_id,
                'optimal_workload',
                workload_id,
                {
                    'value': value,
                    'confidence': confidence,
                    'source': 'pattern_extractor'
                }
            )
            insights_added += 1
        
        return insights_added
    
    def _enhance_with_home_away_balance(self, pattern: Dict[str, Any]) -> int:
        """Enhance the graph with home/away balance pattern.
        
        Args:
            pattern: The pattern data
            
        Returns:
            Number of insights added
        """
        insights_added = 0
        sport_type = pattern.get('sport_type', 'generic')
        value = pattern.get('value')
        confidence = pattern.get('confidence', 0.5)
        
        # Create a balance insight entity
        balance_id = f"balance_insight_{sport_type}_{datetime.now().timestamp()}"
        
        self.graph.add_entity(Entity(
            balance_id,
            'balance_insight',
            {
                'sport_type': sport_type,
                'imbalance': value,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
        ))
        
        # Find teams of this sport type and link the insight
        team_entities = self.graph.query('team', {'sportType': sport_type})
        
        for team in team_entities:
            self.graph.add_relationship(
                team.entity_id,
                'home_away_balance',
                balance_id,
                {
                    'value': value,
                    'confidence': confidence,
                    'source': 'pattern_extractor'
                }
            )
            insights_added += 1
        
        return insights_added
    
    def _enhance_with_game_day_frequency(self, pattern: Dict[str, Any]) -> int:
        """Enhance the graph with game day frequency pattern.
        
        Args:
            pattern: The pattern data
            
        Returns:
            Number of insights added
        """
        insights_added = 0
        sport_type = pattern.get('sport_type', 'generic')
        value = pattern.get('value')
        confidence = pattern.get('confidence', 0.5)
        
        # Create a frequency insight entity
        frequency_id = f"frequency_insight_{sport_type}_{datetime.now().timestamp()}"
        
        self.graph.add_entity(Entity(
            frequency_id,
            'frequency_insight',
            {
                'sport_type': sport_type,
                'average_days': value,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
        ))
        
        # Add task parameter relationship
        task_type_id = "task_type_generate_schedule"
        
        if not self.graph.get_entity(task_type_id):
            self.graph.add_entity(Entity(
                task_type_id,
                'task_type',
                {'name': 'generate_schedule'}
            ))
        
        self.graph.add_relationship(
            task_type_id,
            'optimal_parameter',
            frequency_id,
            {
                'parameter': 'average_days_between_games',
                'value': value,
                'confidence': confidence,
                'source': 'pattern_extractor'
            }
        )
        insights_added += 1
        
        return insights_added
    
    def _enhance_with_common_game_interval(self, pattern: Dict[str, Any]) -> int:
        """Enhance the graph with common game interval pattern.
        
        Args:
            pattern: The pattern data
            
        Returns:
            Number of insights added
        """
        insights_added = 0
        sport_type = pattern.get('sport_type', 'generic')
        value = pattern.get('value')
        confidence = pattern.get('confidence', 0.5)
        
        # Create an interval insight entity
        interval_id = f"interval_insight_{sport_type}_{datetime.now().timestamp()}"
        
        self.graph.add_entity(Entity(
            interval_id,
            'interval_insight',
            {
                'sport_type': sport_type,
                'common_interval': value,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
        ))
        
        # Add task parameter relationship
        task_type_id = "task_type_generate_schedule"
        
        if not self.graph.get_entity(task_type_id):
            self.graph.add_entity(Entity(
                task_type_id,
                'task_type',
                {'name': 'generate_schedule'}
            ))
        
        self.graph.add_relationship(
            task_type_id,
            'optimal_parameter',
            interval_id,
            {
                'parameter': 'preferred_game_interval',
                'value': value,
                'confidence': confidence,
                'source': 'pattern_extractor'
            }
        )
        insights_added += 1
        
        return insights_added
    
    def _enhance_with_home_game_streak(self, pattern: Dict[str, Any]) -> int:
        """Enhance the graph with home game streak pattern.
        
        Args:
            pattern: The pattern data
            
        Returns:
            Number of insights added
        """
        insights_added = 0
        sport_type = pattern.get('sport_type', 'generic')
        value = pattern.get('value')
        confidence = pattern.get('confidence', 0.5)
        
        # Create a streak insight entity
        streak_id = f"home_streak_insight_{sport_type}_{datetime.now().timestamp()}"
        
        self.graph.add_entity(Entity(
            streak_id,
            'streak_insight',
            {
                'sport_type': sport_type,
                'streak_type': 'home',
                'max_consecutive': value,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
        ))
        
        # Add task parameter relationship
        task_type_id = "task_type_generate_schedule"
        
        if not self.graph.get_entity(task_type_id):
            self.graph.add_entity(Entity(
                task_type_id,
                'task_type',
                {'name': 'generate_schedule'}
            ))
        
        self.graph.add_relationship(
            task_type_id,
            'optimal_parameter',
            streak_id,
            {
                'parameter': 'max_consecutive_home',
                'value': value,
                'confidence': confidence,
                'source': 'pattern_extractor'
            }
        )
        insights_added += 1
        
        return insights_added
    
    def _enhance_with_away_game_streak(self, pattern: Dict[str, Any]) -> int:
        """Enhance the graph with away game streak pattern.
        
        Args:
            pattern: The pattern data
            
        Returns:
            Number of insights added
        """
        insights_added = 0
        sport_type = pattern.get('sport_type', 'generic')
        value = pattern.get('value')
        confidence = pattern.get('confidence', 0.5)
        
        # Create a streak insight entity
        streak_id = f"away_streak_insight_{sport_type}_{datetime.now().timestamp()}"
        
        self.graph.add_entity(Entity(
            streak_id,
            'streak_insight',
            {
                'sport_type': sport_type,
                'streak_type': 'away',
                'max_consecutive': value,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            }
        ))
        
        # Add task parameter relationship
        task_type_id = "task_type_generate_schedule"
        
        if not self.graph.get_entity(task_type_id):
            self.graph.add_entity(Entity(
                task_type_id,
                'task_type',
                {'name': 'generate_schedule'}
            ))
        
        self.graph.add_relationship(
            task_type_id,
            'optimal_parameter',
            streak_id,
            {
                'parameter': 'max_consecutive_away',
                'value': value,
                'confidence': confidence,
                'source': 'pattern_extractor'
            }
        )
        insights_added += 1
        
        return insights_added