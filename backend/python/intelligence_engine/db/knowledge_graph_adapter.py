"""
Knowledge Graph Database Adapter for the HELiiX Intelligence Engine

This module provides database integration for storing and retrieving Knowledge Graph data
using Neon DB for persistent storage.
"""

import json
import uuid
import logging
from typing import Dict, Any, List, Optional, Set, Tuple

from intelligence_engine.db.neon_db_adapter import NeonDBAdapter
from intelligence_engine.db.config import db_config
from intelligence_engine.knowledge_graph.graph_model import KnowledgeGraph, Entity, SchedulingKnowledgeGraph

# Configure logging
logger = logging.getLogger('intelligence_engine.db.knowledge_graph_adapter')

class KnowledgeGraphAdapter:
    """Adapter for persisting Knowledge Graph data in Neon DB."""
    
    def __init__(self, db_adapter: Optional[NeonDBAdapter] = None):
        """Initialize the Knowledge Graph database adapter.
        
        Args:
            db_adapter: NeonDBAdapter instance to use
                If not provided, a new instance will be created using the default configuration
        """
        self.db_adapter = db_adapter or NeonDBAdapter(db_config.get_neon_db_connection_string())
        self.entity_table = "knowledge_graph_entities"
        self.graph_table = "knowledge_graphs"
    
    def store_entity(self, entity: Entity) -> Optional[str]:
        """Store an entity in the database.
        
        Args:
            entity: The entity to store
            
        Returns:
            The entity ID or None if storage failed
        """
        entity_data = entity.to_dict()
        return self.db_adapter.store_json(self.entity_table, entity_data, id_key='entityId')
    
    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get an entity from the database.
        
        Args:
            entity_id: ID of the entity to retrieve
            
        Returns:
            The entity or None if not found
        """
        entity_data = self.db_adapter.get_json(self.entity_table, entity_id)
        if not entity_data:
            return None
        
        entity = Entity(
            entity_id=entity_data['entityId'],
            entity_type=entity_data['entityType'],
            properties=entity_data['properties']
        )
        
        # Restore relationships
        for rel_type, targets in entity_data['relationships'].items():
            for target_id, props in targets.items():
                entity.add_relationship(rel_type, target_id, props)
        
        return entity
    
    def delete_entity(self, entity_id: str) -> bool:
        """Delete an entity from the database.
        
        Args:
            entity_id: ID of the entity to delete
            
        Returns:
            True if the entity was deleted, False otherwise
        """
        return self.db_adapter.delete(self.entity_table, entity_id)
    
    def store_graph(self, graph: KnowledgeGraph, graph_id: Optional[str] = None) -> Optional[str]:
        """Store a knowledge graph in the database.
        
        Args:
            graph: The knowledge graph to store
            graph_id: Optional ID for the graph (generated if not provided)
            
        Returns:
            The graph ID or None if storage failed
        """
        if graph_id is None:
            graph_id = str(uuid.uuid4())
        
        # First, store all entities
        for entity_id, entity in graph.entities.items():
            if not self.store_entity(entity):
                logger.error(f"Failed to store entity {entity_id}")
                return None
        
        # Store the graph metadata
        graph_data = {
            'id': graph_id,
            'entity_ids': list(graph.entities.keys()),
            'entity_count': len(graph.entities),
            'type': 'SchedulingKnowledgeGraph' if isinstance(graph, SchedulingKnowledgeGraph) else 'KnowledgeGraph'
        }
        
        return self.db_adapter.store_json(self.graph_table, graph_data, id_key='id')
    
    def load_graph(self, graph_id: str) -> Optional[KnowledgeGraph]:
        """Load a knowledge graph from the database.
        
        Args:
            graph_id: ID of the graph to load
            
        Returns:
            The knowledge graph or None if not found
        """
        graph_data = self.db_adapter.get_json(self.graph_table, graph_id)
        if not graph_data:
            return None
        
        # Create the appropriate graph type
        if graph_data.get('type') == 'SchedulingKnowledgeGraph':
            graph = SchedulingKnowledgeGraph()
        else:
            graph = KnowledgeGraph()
        
        # Load all entities
        for entity_id in graph_data.get('entity_ids', []):
            entity = self.get_entity(entity_id)
            if entity:
                graph.add_entity(entity)
            else:
                logger.warning(f"Entity {entity_id} not found while loading graph {graph_id}")
        
        return graph
    
    def delete_graph(self, graph_id: str, delete_entities: bool = True) -> bool:
        """Delete a knowledge graph from the database.
        
        Args:
            graph_id: ID of the graph to delete
            delete_entities: Whether to also delete the entities in the graph
            
        Returns:
            True if the graph was deleted, False otherwise
        """
        # Get the graph metadata
        graph_data = self.db_adapter.get_json(self.graph_table, graph_id)
        if not graph_data:
            return False
        
        # Delete entities if requested
        if delete_entities:
            for entity_id in graph_data.get('entity_ids', []):
                if not self.delete_entity(entity_id):
                    logger.warning(f"Failed to delete entity {entity_id}")
        
        # Delete the graph metadata
        return self.db_adapter.delete(self.graph_table, graph_id)
    
    def list_graphs(self) -> List[Dict[str, Any]]:
        """List all knowledge graphs.
        
        Returns:
            List of graph metadata dictionaries
        """
        return [
            data.get('data', {}) 
            for data in self.db_adapter.query(self.graph_table)
        ]
    
    def update_entity_relationship(self, entity_id: str, relationship_type: str, 
                                  target_id: str, properties: Dict[str, Any] = None) -> bool:
        """Update or add a relationship for an entity.
        
        Args:
            entity_id: ID of the source entity
            relationship_type: Type of the relationship
            target_id: ID of the target entity
            properties: Properties of the relationship
            
        Returns:
            True if successful, False otherwise
        """
        entity = self.get_entity(entity_id)
        if not entity:
            return False
        
        # Add or update the relationship
        entity.add_relationship(relationship_type, target_id, properties)
        
        # Store the updated entity
        return self.store_entity(entity) is not None
    
    def remove_entity_relationship(self, entity_id: str, relationship_type: str, target_id: str) -> bool:
        """Remove a relationship from an entity.
        
        Args:
            entity_id: ID of the source entity
            relationship_type: Type of the relationship
            target_id: ID of the target entity
            
        Returns:
            True if successful, False otherwise
        """
        entity = self.get_entity(entity_id)
        if not entity:
            return False
        
        # Remove the relationship
        entity.remove_relationship(relationship_type, target_id)
        
        # Store the updated entity
        return self.store_entity(entity) is not None
    
    def find_entities_by_type(self, entity_type: str) -> List[Entity]:
        """Find entities by type.
        
        Args:
            entity_type: Type of entities to find
            
        Returns:
            List of matching entities
        """
        query = f"""
        SELECT id FROM {self.entity_table}
        WHERE data->>'entityType' = %s
        """
        
        results = self.db_adapter.execute_query(query, [entity_type])
        entities = []
        
        for row in results:
            entity_id = row.get('id')
            entity = self.get_entity(entity_id)
            if entity:
                entities.append(entity)
        
        return entities
    
    def find_entities_by_property(self, property_key: str, property_value: Any) -> List[Entity]:
        """Find entities by a property value.
        
        Args:
            property_key: Key of the property to match
            property_value: Value of the property to match
            
        Returns:
            List of matching entities
        """
        # Convert value to JSON string for the query
        property_value_json = json.dumps(property_value)
        
        query = f"""
        SELECT id FROM {self.entity_table}
        WHERE data->'properties'->>{property_key} = %s
        """
        
        results = self.db_adapter.execute_query(query, [property_value_json])
        entities = []
        
        for row in results:
            entity_id = row.get('id')
            entity = self.get_entity(entity_id)
            if entity:
                entities.append(entity)
        
        return entities
    
    def find_entity_relationships(self, relationship_type: str) -> List[Tuple[str, str, Dict[str, Any]]]:
        """Find all relationships of a specific type.
        
        Args:
            relationship_type: Type of relationships to find
            
        Returns:
            List of (source_id, target_id, properties) tuples
        """
        query = f"""
        SELECT id, data FROM {self.entity_table}
        WHERE data->'relationships' ? %s
        """
        
        results = self.db_adapter.execute_query(query, [relationship_type])
        relationships = []
        
        for row in results:
            entity_id = row.get('id')
            entity_data = row.get('data', {})
            
            if entity_data:
                rel_data = entity_data.get('relationships', {}).get(relationship_type, {})
                
                for target_id, props in rel_data.items():
                    relationships.append((entity_id, target_id, props))
        
        return relationships