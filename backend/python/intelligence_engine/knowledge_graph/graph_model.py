"""
Knowledge Graph Model for the HELiiX Intelligence Engine

This module provides a simple knowledge graph implementation for
representing and querying domain knowledge in the scheduling context.
"""

import logging
from typing import Dict, Any, List, Set, Tuple, Optional

# Configure logging
logger = logging.getLogger('intelligence_engine.knowledge_graph.model')

class Entity:
    """Represents an entity in the knowledge graph."""
    
    def __init__(self, entity_id: str, entity_type: str, properties: Dict[str, Any] = None):
        """Initialize a new entity.
        
        Args:
            entity_id: Unique identifier for the entity
            entity_type: Type of the entity (e.g., team, venue, constraint)
            properties: Additional properties of the entity
        """
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.properties = properties or {}
        self.relationships = {}  # Maps relationship type to a set of target entity IDs
    
    def add_relationship(self, relationship_type: str, target_entity_id: str, properties: Dict[str, Any] = None):
        """Add a relationship to another entity.
        
        Args:
            relationship_type: Type of the relationship
            target_entity_id: ID of the target entity
            properties: Additional properties of the relationship
        """
        if relationship_type not in self.relationships:
            self.relationships[relationship_type] = {}
        
        self.relationships[relationship_type][target_entity_id] = properties or {}
    
    def remove_relationship(self, relationship_type: str, target_entity_id: str):
        """Remove a relationship to another entity.
        
        Args:
            relationship_type: Type of the relationship
            target_entity_id: ID of the target entity
        """
        if relationship_type in self.relationships and target_entity_id in self.relationships[relationship_type]:
            del self.relationships[relationship_type][target_entity_id]
    
    def get_relationships(self, relationship_type: str = None) -> Dict[str, Dict[str, Dict[str, Any]]]:
        """Get all relationships or relationships of a specific type.
        
        Args:
            relationship_type: Type of the relationship to get, or None for all
        
        Returns:
            Dictionary mapping relationship types to target entity IDs and properties
        """
        if relationship_type:
            return {relationship_type: self.relationships.get(relationship_type, {})}
        return self.relationships
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the entity to a dictionary.
        
        Returns:
            Dictionary representation of the entity
        """
        return {
            'entityId': self.entity_id,
            'entityType': self.entity_type,
            'properties': self.properties,
            'relationships': self.relationships
        }


class KnowledgeGraph:
    """A simple knowledge graph implementation."""
    
    def __init__(self):
        """Initialize an empty knowledge graph."""
        self.entities = {}  # Maps entity ID to Entity object
    
    def add_entity(self, entity: Entity) -> str:
        """Add an entity to the graph.
        
        Args:
            entity: The entity to add
        
        Returns:
            The entity ID
        """
        self.entities[entity.entity_id] = entity
        logger.debug(f"Added entity {entity.entity_id} of type {entity.entity_type}")
        return entity.entity_id
    
    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get an entity by ID.
        
        Args:
            entity_id: ID of the entity
        
        Returns:
            The entity or None if not found
        """
        return self.entities.get(entity_id)
    
    def remove_entity(self, entity_id: str):
        """Remove an entity from the graph.
        
        Args:
            entity_id: ID of the entity to remove
        """
        if entity_id in self.entities:
            # Remove relationships to this entity
            for eid, entity in self.entities.items():
                if eid == entity_id:
                    continue
                
                for rel_type in list(entity.relationships.keys()):
                    if entity_id in entity.relationships[rel_type]:
                        entity.remove_relationship(rel_type, entity_id)
            
            # Remove the entity itself
            del self.entities[entity_id]
            logger.debug(f"Removed entity {entity_id}")
    
    def add_relationship(self, source_id: str, relationship_type: str, target_id: str, properties: Dict[str, Any] = None):
        """Add a relationship between two entities.
        
        Args:
            source_id: ID of the source entity
            relationship_type: Type of the relationship
            target_id: ID of the target entity
            properties: Additional properties of the relationship
        """
        if source_id not in self.entities:
            raise ValueError(f"Source entity {source_id} not found")
        if target_id not in self.entities:
            raise ValueError(f"Target entity {target_id} not found")
        
        self.entities[source_id].add_relationship(relationship_type, target_id, properties)
        logger.debug(f"Added relationship {relationship_type} from {source_id} to {target_id}")
    
    def get_related_entities(self, entity_id: str, relationship_type: str = None) -> Dict[str, List[str]]:
        """Get entities related to the given entity.
        
        Args:
            entity_id: ID of the entity
            relationship_type: Type of the relationship, or None for all
        
        Returns:
            Dictionary mapping relationship types to lists of target entity IDs
        """
        entity = self.get_entity(entity_id)
        if not entity:
            return {}
        
        result = {}
        relationships = entity.get_relationships(relationship_type)
        
        for rel_type, targets in relationships.items():
            result[rel_type] = list(targets.keys())
        
        return result
    
    def query(self, entity_type: str = None, properties: Dict[str, Any] = None) -> List[Entity]:
        """Query entities by type and properties.
        
        Args:
            entity_type: Type of the entities to find, or None for all
            properties: Properties that entities must have, or None for any
        
        Returns:
            List of matching entities
        """
        results = []
        
        for entity in self.entities.values():
            # Check entity type
            if entity_type and entity.entity_type != entity_type:
                continue
            
            # Check properties
            if properties:
                match = True
                for key, value in properties.items():
                    if key not in entity.properties or entity.properties[key] != value:
                        match = False
                        break
                
                if not match:
                    continue
            
            results.append(entity)
        
        return results
    
    def path_query(self, start_id: str, end_id: str, max_depth: int = 3) -> List[List[Tuple[str, str, str]]]:
        """Find paths between two entities.
        
        Args:
            start_id: ID of the starting entity
            end_id: ID of the ending entity
            max_depth: Maximum path length
        
        Returns:
            List of paths, where each path is a list of (source, relationship, target) tuples
        """
        if start_id not in self.entities or end_id not in self.entities:
            return []
        
        # Use breadth-first search to find paths
        paths = []
        visited = set()
        queue = [[(start_id, None, None)]]
        
        while queue:
            path = queue.pop(0)
            current_id = path[-1][0]
            
            # Skip visited entities to avoid cycles
            if current_id in visited:
                continue
            
            visited.add(current_id)
            
            # Check if we've reached the destination
            if current_id == end_id:
                # Remove the start node (which has None values)
                paths.append(path[1:])
                continue
            
            # Check if we've reached the maximum depth
            if len(path) > max_depth:
                continue
            
            # Explore neighbors
            entity = self.get_entity(current_id)
            for rel_type, targets in entity.relationships.items():
                for target_id in targets:
                    new_path = path + [(target_id, rel_type, current_id)]
                    queue.append(new_path)
        
        return paths
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the knowledge graph to a dictionary.
        
        Returns:
            Dictionary representation of the knowledge graph
        """
        return {
            'entities': {eid: entity.to_dict() for eid, entity in self.entities.items()},
            'entityCount': len(self.entities)
        }


class SchedulingKnowledgeGraph(KnowledgeGraph):
    """Knowledge graph specialized for the scheduling domain."""
    
    def add_team(self, team_id: str, name: str, properties: Dict[str, Any] = None) -> str:
        """Add a team entity to the graph.
        
        Args:
            team_id: ID of the team
            name: Name of the team
            properties: Additional properties of the team
        
        Returns:
            The entity ID
        """
        team_properties = properties or {}
        team_properties['name'] = name
        
        team = Entity(team_id, 'team', team_properties)
        return self.add_entity(team)
    
    def add_venue(self, venue_id: str, name: str, properties: Dict[str, Any] = None) -> str:
        """Add a venue entity to the graph.
        
        Args:
            venue_id: ID of the venue
            name: Name of the venue
            properties: Additional properties of the venue
        
        Returns:
            The entity ID
        """
        venue_properties = properties or {}
        venue_properties['name'] = name
        
        venue = Entity(venue_id, 'venue', venue_properties)
        return self.add_entity(venue)
    
    def add_constraint(self, constraint_id: str, constraint_type: str, properties: Dict[str, Any] = None) -> str:
        """Add a constraint entity to the graph.
        
        Args:
            constraint_id: ID of the constraint
            constraint_type: Type of the constraint
            properties: Additional properties of the constraint
        
        Returns:
            The entity ID
        """
        constraint_properties = properties or {}
        constraint_properties['constraintType'] = constraint_type
        
        constraint = Entity(constraint_id, 'constraint', constraint_properties)
        return self.add_entity(constraint)
    
    def set_home_venue(self, team_id: str, venue_id: str, properties: Dict[str, Any] = None):
        """Set a venue as the home venue for a team.
        
        Args:
            team_id: ID of the team
            venue_id: ID of the venue
            properties: Additional properties of the relationship
        """
        self.add_relationship(team_id, 'home_venue', venue_id, properties)
    
    def get_home_venue(self, team_id: str) -> Optional[str]:
        """Get the home venue for a team.
        
        Args:
            team_id: ID of the team
        
        Returns:
            ID of the home venue, or None if not set
        """
        related = self.get_related_entities(team_id, 'home_venue')
        venues = related.get('home_venue', [])
        return venues[0] if venues else None
    
    def apply_constraint_to_team(self, constraint_id: str, team_id: str, properties: Dict[str, Any] = None):
        """Apply a constraint to a team.
        
        Args:
            constraint_id: ID of the constraint
            team_id: ID of the team
            properties: Additional properties of the relationship
        """
        self.add_relationship(constraint_id, 'applies_to', team_id, properties)
    
    def apply_constraint_to_venue(self, constraint_id: str, venue_id: str, properties: Dict[str, Any] = None):
        """Apply a constraint to a venue.
        
        Args:
            constraint_id: ID of the constraint
            venue_id: ID of the venue
            properties: Additional properties of the relationship
        """
        self.add_relationship(constraint_id, 'applies_to', venue_id, properties)
    
    def get_team_constraints(self, team_id: str) -> List[str]:
        """Get all constraints that apply to a team.
        
        Args:
            team_id: ID of the team
        
        Returns:
            List of constraint IDs
        """
        constraints = []
        
        for entity_id, entity in self.entities.items():
            if entity.entity_type == 'constraint':
                related = self.get_related_entities(entity_id, 'applies_to')
                applies_to = related.get('applies_to', [])
                
                if team_id in applies_to:
                    constraints.append(entity_id)
        
        return constraints
    
    def get_venue_constraints(self, venue_id: str) -> List[str]:
        """Get all constraints that apply to a venue.
        
        Args:
            venue_id: ID of the venue
        
        Returns:
            List of constraint IDs
        """
        constraints = []
        
        for entity_id, entity in self.entities.items():
            if entity.entity_type == 'constraint':
                related = self.get_related_entities(entity_id, 'applies_to')
                applies_to = related.get('applies_to', [])
                
                if venue_id in applies_to:
                    constraints.append(entity_id)
        
        return constraints
    
    def create_rivalry(self, team1_id: str, team2_id: str, properties: Dict[str, Any] = None):
        """Create a rivalry relationship between two teams.
        
        Args:
            team1_id: ID of the first team
            team2_id: ID of the second team
            properties: Additional properties of the relationship
        """
        # Create a bi-directional relationship
        self.add_relationship(team1_id, 'rivalry', team2_id, properties)
        self.add_relationship(team2_id, 'rivalry', team1_id, properties)
    
    def get_rivals(self, team_id: str) -> List[str]:
        """Get all rivals of a team.
        
        Args:
            team_id: ID of the team
        
        Returns:
            List of rival team IDs
        """
        related = self.get_related_entities(team_id, 'rivalry')
        return related.get('rivalry', [])