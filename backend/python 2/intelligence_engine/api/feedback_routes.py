"""
Feedback Collection API Routes for the Intelligence Engine

This module provides comprehensive API endpoints for collecting, analyzing,
and processing user feedback about schedules.
"""

import os
import json
import logging
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any, List

from intelligence_engine.ml.pattern_extractor import PatternExtractor
from intelligence_engine.knowledge_graph.graph_model import SchedulingKnowledgeGraph
from intelligence_engine.knowledge_graph.schedule_knowledge_enhancer import ScheduleKnowledgeEnhancer

# Configure logging
logger = logging.getLogger('intelligence_engine.api.feedback_routes')

# Create a Blueprint for the feedback API routes
feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

# Global knowledge graph instance (shared with KG routes)
kg = SchedulingKnowledgeGraph()

# Global pattern extractor instance (shared with ML routes)
pattern_extractor = PatternExtractor()

# Global knowledge enhancer instance (shared with KG routes)
knowledge_enhancer = ScheduleKnowledgeEnhancer(kg, pattern_extractor)

# In-memory feedback storage (would be replaced with a database in production)
feedback_store = []
feedback_templates = []
feedback_categories = [
    {
        'id': 'balance',
        'name': 'Team Balance',
        'description': 'Balance of home and away games',
        'metrics': ['homeAwayBalance', 'consecutiveGames', 'rivalrySpacing']
    },
    {
        'id': 'travel',
        'name': 'Travel Considerations',
        'description': 'Distance and travel efficiency',
        'metrics': ['travelDistance', 'regionClustering', 'timeZoneChanges']
    },
    {
        'id': 'rest',
        'name': 'Rest & Recovery',
        'description': 'Adequate rest between games',
        'metrics': ['restDays', 'backToBackGames', 'travelRecoveryTime']
    },
    {
        'id': 'venue',
        'name': 'Venue Utilization',
        'description': 'Efficient use of venues',
        'metrics': ['venueDistribution', 'venueAvailability', 'specialEventAccommodation']
    },
    {
        'id': 'competitive',
        'name': 'Competitive Balance',
        'description': 'Fair distribution of opponents',
        'metrics': ['strengthOfSchedule', 'rivalryGames', 'opponentVariety']
    }
]

@feedback_bp.route('/submit', methods=['POST'])
def submit_feedback():
    """Submit feedback for a schedule."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['scheduleId', 'userId']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create a feedback object with metadata
        feedback = {
            'id': str(uuid.uuid4()),
            'scheduleId': data['scheduleId'],
            'userId': data['userId'],
            'timestamp': datetime.now().isoformat(),
            'rating': data.get('rating'),
            'comments': data.get('comments'),
            'categoryRatings': data.get('categoryRatings', {}),
            'metrics': data.get('metrics', {}),
            'suggestions': data.get('suggestions', [])
        }
        
        # Store the feedback
        feedback_store.append(feedback)
        
        # Extract patterns from feedback in the background
        # (In a real implementation, this would be done asynchronously)
        if len(feedback_store) > 0:
            try:
                patterns = pattern_extractor.extract_patterns_from_feedback(feedback_store)
                if patterns:
                    knowledge_enhancer.enhance_from_feedback(feedback_store)
                    logger.info(f"Enhanced knowledge graph with {len(patterns)} patterns from feedback")
            except Exception as e:
                logger.exception(f"Error processing feedback patterns: {str(e)}")
        
        return jsonify({
            'success': True,
            'feedbackId': feedback['id'],
            'message': 'Feedback submitted successfully'
        })
    
    except Exception as e:
        logger.exception(f"Error submitting feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/list', methods=['GET'])
def list_feedback():
    """List feedback for a schedule."""
    try:
        schedule_id = request.args.get('scheduleId')
        user_id = request.args.get('userId')
        
        if not schedule_id and not user_id:
            return jsonify({'error': 'Must provide either scheduleId or userId'}), 400
        
        # Filter feedback by schedule ID and/or user ID
        filtered_feedback = feedback_store
        
        if schedule_id:
            filtered_feedback = [f for f in filtered_feedback if f['scheduleId'] == schedule_id]
        
        if user_id:
            filtered_feedback = [f for f in filtered_feedback if f['userId'] == user_id]
        
        # Sort by timestamp (newest first)
        sorted_feedback = sorted(filtered_feedback, key=lambda f: f['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'count': len(sorted_feedback),
            'feedback': sorted_feedback
        })
    
    except Exception as e:
        logger.exception(f"Error listing feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/template', methods=['POST'])
def create_template():
    """Create a feedback template."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'questions']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create a template object
        template = {
            'id': str(uuid.uuid4()),
            'name': data['name'],
            'description': data.get('description', ''),
            'createdAt': datetime.now().isoformat(),
            'questions': data['questions'],
            'categories': data.get('categories', []),
            'metrics': data.get('metrics', {})
        }
        
        # Store the template
        feedback_templates.append(template)
        
        return jsonify({
            'success': True,
            'templateId': template['id'],
            'message': 'Template created successfully'
        })
    
    except Exception as e:
        logger.exception(f"Error creating template: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/template', methods=['GET'])
def list_templates():
    """List feedback templates."""
    try:
        return jsonify({
            'success': True,
            'count': len(feedback_templates),
            'templates': feedback_templates
        })
    
    except Exception as e:
        logger.exception(f"Error listing templates: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/template/<template_id>', methods=['GET'])
def get_template(template_id):
    """Get a specific feedback template."""
    try:
        # Find the template by ID
        template = next((t for t in feedback_templates if t['id'] == template_id), None)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        return jsonify({
            'success': True,
            'template': template
        })
    
    except Exception as e:
        logger.exception(f"Error getting template: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/analysis', methods=['GET'])
def analyze_feedback():
    """Analyze feedback for a schedule."""
    try:
        schedule_id = request.args.get('scheduleId')
        
        if not schedule_id:
            return jsonify({'error': 'Missing scheduleId parameter'}), 400
        
        # Filter feedback by schedule ID
        schedule_feedback = [f for f in feedback_store if f['scheduleId'] == schedule_id]
        
        if not schedule_feedback:
            return jsonify({
                'success': True,
                'scheduleId': schedule_id,
                'feedbackCount': 0,
                'message': 'No feedback found for this schedule'
            })
        
        # Calculate average rating
        ratings = [f['rating'] for f in schedule_feedback if f.get('rating') is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
        
        # Calculate category averages
        category_ratings = {}
        for category in feedback_categories:
            category_id = category['id']
            category_scores = []
            
            for feedback in schedule_feedback:
                if feedback.get('categoryRatings') and category_id in feedback['categoryRatings']:
                    category_scores.append(feedback['categoryRatings'][category_id])
            
            if category_scores:
                category_ratings[category_id] = {
                    'averageRating': sum(category_scores) / len(category_scores),
                    'count': len(category_scores),
                    'name': category['name'],
                    'description': category['description']
                }
        
        # Extract common themes from comments
        comments = [f['comments'] for f in schedule_feedback if f.get('comments')]
        
        # Calculate metric averages
        metric_averages = {}
        for feedback in schedule_feedback:
            if feedback.get('metrics'):
                for metric, value in feedback['metrics'].items():
                    if metric not in metric_averages:
                        metric_averages[metric] = {'sum': 0, 'count': 0}
                    
                    metric_averages[metric]['sum'] += value
                    metric_averages[metric]['count'] += 1
        
        metric_results = {
            metric: {
                'average': data['sum'] / data['count'],
                'count': data['count']
            }
            for metric, data in metric_averages.items()
        }
        
        # Aggregate suggestions
        all_suggestions = []
        for feedback in schedule_feedback:
            if feedback.get('suggestions'):
                all_suggestions.extend(feedback['suggestions'])
        
        return jsonify({
            'success': True,
            'scheduleId': schedule_id,
            'feedbackCount': len(schedule_feedback),
            'averageRating': avg_rating,
            'categoryRatings': category_ratings,
            'metricAverages': metric_results,
            'commentCount': len(comments),
            'suggestionCount': len(all_suggestions),
            'recentSuggestions': all_suggestions[:5] if all_suggestions else []
        })
    
    except Exception as e:
        logger.exception(f"Error analyzing feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/categories', methods=['GET'])
def list_categories():
    """List feedback categories."""
    try:
        return jsonify({
            'success': True,
            'count': len(feedback_categories),
            'categories': feedback_categories
        })
    
    except Exception as e:
        logger.exception(f"Error listing categories: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/metrics', methods=['GET'])
def list_metrics():
    """List available feedback metrics."""
    try:
        # Compile a list of all available metrics from categories
        all_metrics = []
        for category in feedback_categories:
            all_metrics.extend(category.get('metrics', []))
        
        # Create unique metrics list with descriptions
        metrics = [
            {
                'id': metric,
                'name': ' '.join([(c.upper() if i == 0 else c) for i, c in enumerate(metric)]),
                'category': next((cat['id'] for cat in feedback_categories
                                if metric in cat.get('metrics', [])), None)
            }
            for metric in set(all_metrics)
        ]
        
        return jsonify({
            'success': True,
            'count': len(metrics),
            'metrics': metrics
        })
    
    except Exception as e:
        logger.exception(f"Error listing metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/<feedback_id>', methods=['GET'])
def get_feedback(feedback_id):
    """Get a specific feedback."""
    try:
        # Find the feedback by ID
        feedback = next((f for f in feedback_store if f['id'] == feedback_id), None)
        
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        return jsonify({
            'success': True,
            'feedback': feedback
        })
    
    except Exception as e:
        logger.exception(f"Error getting feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

@feedback_bp.route('/<feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    """Delete a specific feedback."""
    try:
        # Find the feedback by ID
        feedback_index = next((i for i, f in enumerate(feedback_store) if f['id'] == feedback_id), None)
        
        if feedback_index is None:
            return jsonify({'error': 'Feedback not found'}), 404
        
        # Remove the feedback
        deleted_feedback = feedback_store.pop(feedback_index)
        
        return jsonify({
            'success': True,
            'message': 'Feedback deleted successfully',
            'deletedFeedbackId': deleted_feedback['id']
        })
    
    except Exception as e:
        logger.exception(f"Error deleting feedback: {str(e)}")
        return jsonify({'error': str(e)}), 500

def register_feedback_routes(app):
    """Register the feedback routes with the Flask application."""
    app.register_blueprint(feedback_bp)
    logger.info("Registered Feedback Collection API routes")