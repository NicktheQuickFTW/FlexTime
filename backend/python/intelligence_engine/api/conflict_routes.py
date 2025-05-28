"""
Conflict Resolution API Routes for the Intelligence Engine

This module provides API endpoints for interacting with the conflict resolution components.
"""

import os
import json
import logging
from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any, List

from intelligence_engine.conflict_resolution.conflict_analyzer import ConflictAnalyzer
from intelligence_engine.conflict_resolution.conflict_visualizer import ConflictVisualizer
from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph
from intelligence_engine.ml.pattern_extractor import PatternExtractor

# Configure logging
logger = logging.getLogger('intelligence_engine.api.conflict_routes')

# Create a Blueprint for the conflict API routes
conflict_bp = Blueprint('conflict', __name__, url_prefix='/api/conflict')

# Global knowledge graph instance (shared with KG routes)
kg = SchedulingKnowledgeGraph()

# Global pattern extractor instance (shared with ML routes)
pattern_extractor = PatternExtractor()

# Global conflict analyzer instance
conflict_analyzer = ConflictAnalyzer(kg, pattern_extractor)

# Global conflict visualizer instance
conflict_visualizer = ConflictVisualizer()

@conflict_bp.route('/analyze', methods=['POST'])
def analyze_conflicts():
    """Analyze a schedule for conflicts."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the schedule data
        schedule = data.get('schedule')
        
        if not schedule:
            return jsonify({'error': 'Missing schedule data'}), 400
        
        # Analyze conflicts
        analysis = conflict_analyzer.analyze_schedule_conflicts(schedule)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    
    except Exception as e:
        logger.exception(f"Error analyzing conflicts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@conflict_bp.route('/resolve', methods=['POST'])
def resolve_conflicts():
    """Generate a resolution plan for conflicts."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the analysis data
        analysis = data.get('analysis')
        
        if not analysis:
            return jsonify({'error': 'Missing conflict analysis data'}), 400
        
        # Generate resolution plan
        plan = conflict_analyzer.generate_resolution_plan(analysis)
        
        return jsonify({
            'success': True,
            'plan': plan
        })
    
    except Exception as e:
        logger.exception(f"Error generating resolution plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

@conflict_bp.route('/resolve/auto', methods=['POST'])
def resolve_conflicts_auto():
    """Automatically resolve conflicts in a schedule."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the schedule and analysis data
        schedule = data.get('schedule')
        analysis = data.get('analysis')
        
        if not schedule or not analysis:
            return jsonify({'error': 'Missing schedule or analysis data'}), 400
        
        # Automatically resolve conflicts
        result = conflict_analyzer.resolve_conflicts_automatically(schedule, analysis)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        logger.exception(f"Error automatically resolving conflicts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@conflict_bp.route('/visualize', methods=['POST'])
def visualize_conflicts():
    """Generate visualizations for conflicts."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the analysis data
        analysis = data.get('analysis')
        
        if not analysis:
            return jsonify({'error': 'Missing conflict analysis data'}), 400
        
        # Generate visualizations
        visualizations = conflict_visualizer.visualize_conflicts(analysis)
        
        return jsonify({
            'success': True,
            'visualizations': visualizations
        })
    
    except Exception as e:
        logger.exception(f"Error generating conflict visualizations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@conflict_bp.route('/visualize/plan', methods=['POST'])
def visualize_resolution_plan():
    """Generate visualizations for a resolution plan."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get the plan data
        plan = data.get('plan')
        
        if not plan:
            return jsonify({'error': 'Missing resolution plan data'}), 400
        
        # Generate visualizations
        visualizations = conflict_visualizer.visualize_resolution_plan(plan)
        
        return jsonify({
            'success': True,
            'visualizations': visualizations
        })
    
    except Exception as e:
        logger.exception(f"Error generating resolution plan visualizations: {str(e)}")
        return jsonify({'error': str(e)}), 500

def register_conflict_routes(app):
    """Register the conflict routes with the Flask application."""
    app.register_blueprint(conflict_bp)
    logger.info("Registered Conflict Resolution API routes")