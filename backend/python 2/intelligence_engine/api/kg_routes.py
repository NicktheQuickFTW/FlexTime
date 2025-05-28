"""
Knowledge Graph API Routes for the Intelligence Engine

This module provides API endpoints for interacting with the knowledge graph components.
"""

import os
import json
import logging
from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any, List

from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph, Entity
from intelligence_engine.knowledge_graph.schedule_knowledge_enhancer import ScheduleKnowledgeEnhancer
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Configure logging
logger = logging.getLogger('intelligence_engine.api.kg_routes')

# Create a Blueprint for the KG API routes
kg_bp = Blueprint('kg', __name__, url_prefix='/api/kg')

# Global knowledge graph instance
kg = SchedulingKnowledgeGraph()

# Global knowledge enhancer instance
pattern_extractor = PatternExtractor()
knowledge_enhancer = ScheduleKnowledgeEnhancer(kg, pattern_extractor)

@kg_bp.route('/status', methods=['GET'])
def get_kg_status():
    """Get the status of the knowledge graph."""
    entity_count = len(kg.entities)
    
    # Count entities by type
    entity_types = {}
    for entity_id, entity in kg.entities.items():
        entity_type = entity.entity_type
        entity_types[entity_type] = entity_types.get(entity_type, 0) + 1
    
    return jsonify({
        'status': 'active',
        'entityCount': entity_count,
        'entityTypes': entity_types
    })

@kg_bp.route('/enhance/schedule', methods=['POST'])
def enhance_from_schedule():
    """Enhance the knowledge graph from a schedule."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the schedule data
        schedule = data.get('schedule')
        
        if not schedule:
            return jsonify({'error': 'Missing schedule data'}), 400
        
        # Enhance the knowledge graph
        result = knowledge_enhancer.enhance_from_schedule(schedule)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        logger.exception(f"Error enhancing from schedule: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/enhance/feedback', methods=['POST'])
def enhance_from_feedback():
    """Enhance the knowledge graph from feedback data."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the feedback data
        feedback = data.get('feedback')
        
        if not feedback:
            return jsonify({'error': 'Missing feedback data'}), 400
        
        # Enhance the knowledge graph
        result = knowledge_enhancer.enhance_from_feedback(feedback)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        logger.exception(f"Error enhancing from feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/enhance/experiences', methods=['POST'])
def enhance_from_experiences():
    """Enhance the knowledge graph from experience data."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the experience data
        experiences = data.get('experiences')
        
        if not experiences:
            return jsonify({'error': 'Missing experience data'}), 400
        
        # Enhance the knowledge graph
        result = knowledge_enhancer.enhance_from_experiences(experiences)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        logger.exception(f"Error enhancing from experiences: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/insights', methods=['GET'])
def get_insights():
    """Get scheduling insights from the knowledge graph."""
    try:
        # Get query parameters
        sport_type = request.args.get('sportType')
        team_id = request.args.get('teamId')
        
        # Query the knowledge graph
        insights = knowledge_enhancer.query_scheduling_insights(sport_type, team_id)
        
        return jsonify({
            'success': True,
            'insights': insights
        })
    
    except Exception as e:
        logger.exception(f"Error querying insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/entity', methods=['POST'])
def add_entity():
    """Add an entity to the knowledge graph."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get entity data
        entity_id = data.get('entityId')
        entity_type = data.get('entityType')
        properties = data.get('properties', {})
        
        if not entity_id or not entity_type:
            return jsonify({'error': 'Missing required fields: entityId, entityType'}), 400
        
        # Create and add the entity
        entity = Entity(entity_id, entity_type, properties)
        kg.add_entity(entity)
        
        return jsonify({
            'success': True,
            'entityId': entity_id
        })
    
    except Exception as e:
        logger.exception(f"Error adding entity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/entity/<entity_id>', methods=['GET'])
def get_entity(entity_id: str):
    """Get an entity from the knowledge graph."""
    try:
        entity = kg.get_entity(entity_id)
        
        if not entity:
            return jsonify({'error': f'Entity not found: {entity_id}'}), 404
        
        return jsonify({
            'success': True,
            'entity': entity.to_dict()
        })
    
    except Exception as e:
        logger.exception(f"Error getting entity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/relationship', methods=['POST'])
def add_relationship():
    """Add a relationship between entities in the knowledge graph."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get relationship data
        source_id = data.get('sourceId')
        relationship_type = data.get('relationshipType')
        target_id = data.get('targetId')
        properties = data.get('properties', {})
        
        if not source_id or not relationship_type or not target_id:
            return jsonify({'error': 'Missing required fields: sourceId, relationshipType, targetId'}), 400
        
        # Add the relationship
        try:
            kg.add_relationship(source_id, relationship_type, target_id, properties)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        return jsonify({
            'success': True,
            'sourceId': source_id,
            'relationshipType': relationship_type,
            'targetId': target_id
        })
    
    except Exception as e:
        logger.exception(f"Error adding relationship: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/query', methods=['POST'])
def query_entities():
    """Query entities in the knowledge graph."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get query parameters
        entity_type = data.get('entityType')
        properties = data.get('properties', {})
        
        # Query the knowledge graph
        entities = kg.query(entity_type, properties)
        
        return jsonify({
            'success': True,
            'count': len(entities),
            'entities': [entity.to_dict() for entity in entities]
        })
    
    except Exception as e:
        logger.exception(f"Error querying entities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@kg_bp.route('/path', methods=['POST'])
def query_path():
    """Query paths between entities in the knowledge graph."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get query parameters
        start_id = data.get('startId')
        end_id = data.get('endId')
        max_depth = data.get('maxDepth', 3)
        
        if not start_id or not end_id:
            return jsonify({'error': 'Missing required fields: startId, endId'}), 400
        
        # Query the knowledge graph
        paths = kg.path_query(start_id, end_id, max_depth)
        
        return jsonify({
            'success': True,
            'count': len(paths),
            'paths': paths
        })
    
    except Exception as e:
        logger.exception(f"Error querying path: {str(e)}")
        return jsonify({'error': str(e)}), 500

def register_kg_routes(app):
    """Register the KG routes with the Flask application."""
    app.register_blueprint(kg_bp)
    logger.info("Registered Knowledge Graph API routes")