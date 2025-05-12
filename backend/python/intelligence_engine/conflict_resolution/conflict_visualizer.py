"""
Conflict Visualizer for the HELiiX Intelligence Engine

This module provides conflict visualization capabilities for scheduling conflicts,
generating visual representations of conflicts and resolutions.
"""

import logging
from typing import Dict, Any, List, Optional

# Configure logging
logger = logging.getLogger('intelligence_engine.conflict_resolution.conflict_visualizer')

class ConflictVisualizer:
    """Generates visual representations of scheduling conflicts and resolutions."""
    
    def __init__(self):
        """Initialize the conflict visualizer."""
        self.visualization_types = {
            'rest_days': self._visualize_rest_days_conflict,
            'travel_distance': self._visualize_travel_distance_conflict,
            'venue_availability': self._visualize_venue_availability_conflict,
            'team_availability': self._visualize_team_availability_conflict,
            'home_away_balance': self._visualize_home_away_balance_conflict,
            'rivalry_spacing': self._visualize_rivalry_spacing_conflict,
            'consecutive_games': self._visualize_consecutive_games_conflict,
            'championship_alignment': self._visualize_championship_alignment_conflict,
            'constraint_conflict': self._visualize_constraint_conflict
        }
    
    def visualize_conflicts(self, conflict_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate visualizations for identified conflicts.
        
        Args:
            conflict_analysis: Conflict analysis results
            
        Returns:
            Visualization data for conflicts
        """
        conflicts = conflict_analysis.get('conflicts', [])
        
        if not conflicts:
            return {
                'schedule_id': conflict_analysis.get('schedule_id', 'unknown'),
                'visualizations': [],
                'message': 'No conflicts to visualize'
            }
        
        visualizations = []
        
        for conflict in conflicts:
            conflict_type = conflict.get('type')
            
            if conflict_type in self.visualization_types:
                visualization = self.visualization_types[conflict_type](conflict)
                visualizations.append(visualization)
            else:
                # Default visualization
                visualizations.append(self._visualize_generic_conflict(conflict))
        
        return {
            'schedule_id': conflict_analysis.get('schedule_id', 'unknown'),
            'visualizations': visualizations,
            'count': len(visualizations)
        }
    
    def visualize_resolution_plan(self, resolution_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Generate visualizations for a resolution plan.
        
        Args:
            resolution_plan: Resolution plan data
            
        Returns:
            Visualization data for the resolution plan
        """
        steps = resolution_plan.get('steps', [])
        
        if not steps:
            return {
                'schedule_id': resolution_plan.get('schedule_id', 'unknown'),
                'visualizations': [],
                'message': 'No steps to visualize'
            }
        
        step_visualizations = []
        
        for step in steps:
            step_visualizations.append(self._visualize_resolution_step(step))
        
        return {
            'schedule_id': resolution_plan.get('schedule_id', 'unknown'),
            'visualizations': step_visualizations,
            'count': len(step_visualizations)
        }
    
    def _visualize_generic_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a generic visualization for a conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        return {
            'conflict_id': conflict.get('id'),
            'visualization_type': 'generic',
            'format': 'text',
            'content': {
                'title': f"Conflict: {conflict.get('type')} - {conflict.get('severity', 'unknown')}",
                'description': conflict.get('description', 'No description available'),
                'details': conflict.get('details', {})
            }
        }
    
    def _visualize_resolution_step(self, step: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a resolution step.
        
        Args:
            step: Resolution step data
            
        Returns:
            Visualization data
        """
        return {
            'step_number': step.get('step_number'),
            'conflict_id': step.get('conflict_id'),
            'visualization_type': 'resolution_step',
            'format': 'text',
            'content': {
                'title': f"Step {step.get('step_number')}: {step.get('action')}",
                'description': step.get('description', 'No description available'),
                'affected_elements': step.get('affected_elements', []),
                'alternatives': len(step.get('alternative_actions', []))
            }
        }
    
    def _visualize_rest_days_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a rest days conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        details = conflict.get('details', {})
        
        return {
            'conflict_id': conflict.get('id'),
            'visualization_type': 'rest_days',
            'format': 'calendar',
            'content': {
                'title': 'Insufficient Rest Days',
                'team': details.get('team'),
                'current_date': details.get('date'),
                'previous_game': details.get('previous_game'),
                'rest_days': details.get('rest_days', 0),
                'minimum_required': 1,
                'calendar_highlights': [
                    {
                        'date': details.get('previous_game'),
                        'label': 'Previous Game',
                        'color': '#FFD700'  # Gold
                    },
                    {
                        'date': details.get('date'),
                        'label': 'Current Game',
                        'color': '#FF6347'  # Tomato
                    }
                ]
            }
        }
    
    def _visualize_travel_distance_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a travel distance conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        details = conflict.get('details', {})
        
        return {
            'conflict_id': conflict.get('id'),
            'visualization_type': 'travel_distance',
            'format': 'map',
            'content': {
                'title': 'Excessive Travel Distance',
                'team': details.get('team'),
                'from_location': details.get('from_location'),
                'to_location': details.get('to_location'),
                'distance': details.get('distance', 0),
                'maximum_recommended': details.get('maximum_recommended', 0),
                'map_markers': [
                    {
                        'location': details.get('from_location'),
                        'label': 'Previous Game',
                        'color': '#4682B4'  # Steel Blue
                    },
                    {
                        'location': details.get('to_location'),
                        'label': 'Next Game',
                        'color': '#4682B4'  # Steel Blue
                    }
                ],
                'map_path': {
                    'from': details.get('from_location'),
                    'to': details.get('to_location'),
                    'color': '#FF0000'  # Red
                }
            }
        }
    
    def _visualize_venue_availability_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a venue availability conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        details = conflict.get('details', {})
        
        return {
            'conflict_id': conflict.get('id'),
            'visualization_type': 'venue_availability',
            'format': 'schedule',
            'content': {
                'title': 'Venue Double-Booking',
                'venue': details.get('venue'),
                'date': details.get('date'),
                'conflicting_games': details.get('games', []),
                'schedule_items': [
                    {
                        'id': game_id,
                        'venue': details.get('venue'),
                        'date': details.get('date'),
                        'teams': 'Unknown Teams',  # Would extract from schedule
                        'status': 'conflict'
                    }
                    for game_id in details.get('games', [])
                ]
            }
        }
    
    def _visualize_team_availability_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a team availability conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        # Default to generic visualization
        return self._visualize_generic_conflict(conflict)
    
    def _visualize_home_away_balance_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a home/away balance conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        details = conflict.get('details', {})
        
        return {
            'conflict_id': conflict.get('id'),
            'visualization_type': 'home_away_balance',
            'format': 'chart',
            'content': {
                'title': 'Home/Away Game Imbalance',
                'team': details.get('team'),
                'chart_type': 'bar',
                'data': [
                    {
                        'label': 'Home Games',
                        'value': details.get('home_games', 0),
                        'color': '#4169E1'  # Royal Blue
                    },
                    {
                        'label': 'Away Games',
                        'value': details.get('away_games', 0),
                        'color': '#32CD32'  # Lime Green
                    }
                ],
                'balance_target': 0.5,
                'current_balance': details.get('home_percentage', 0.5)
            }
        }
    
    def _visualize_rivalry_spacing_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a rivalry spacing conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        # Default to generic visualization
        return self._visualize_generic_conflict(conflict)
    
    def _visualize_consecutive_games_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a consecutive games conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        details = conflict.get('details', {})
        
        return {
            'conflict_id': conflict.get('id'),
            'visualization_type': 'consecutive_games',
            'format': 'timeline',
            'content': {
                'title': 'Too Many Consecutive Games',
                'team': details.get('team'),
                'streak_type': details.get('streak_type', 'home'),
                'streak_length': details.get('streak_length', 0),
                'max_allowed': details.get('max_allowed', 0),
                'current_game': details.get('current_game'),
                'timeline_items': [
                    {
                        'position': i + 1,
                        'label': f"Game {i + 1}",
                        'type': details.get('streak_type', 'home'),
                        'color': '#FF8C00' if i + 1 > details.get('max_allowed', 0) else '#1E90FF' # Orange if exceeding, DodgerBlue if within limits
                    }
                    for i in range(details.get('streak_length', 0))
                ]
            }
        }
    
    def _visualize_championship_alignment_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a championship alignment conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        # Default to generic visualization
        return self._visualize_generic_conflict(conflict)
    
    def _visualize_constraint_conflict(self, conflict: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization for a constraint conflict.
        
        Args:
            conflict: Conflict data
            
        Returns:
            Visualization data
        """
        # Default to generic visualization
        return self._visualize_generic_conflict(conflict)