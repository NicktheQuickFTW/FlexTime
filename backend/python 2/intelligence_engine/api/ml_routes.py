"""
Machine Learning API Routes for the Intelligence Engine

This module provides API endpoints for interacting with the machine learning components.
"""

import os
import json
import logging
from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any, List

from intelligence_engine.ml.pattern_extractor import PatternExtractor
from intelligence_engine.ml.predictive_model import (
    create_model,
    GameOutcomePredictor, 
    ScheduleQualityPredictor,
    TeamPerformancePredictor
)

# Configure logging
logger = logging.getLogger('intelligence_engine.api.ml_routes')

# Create a Blueprint for the ML API routes
ml_bp = Blueprint('ml', __name__, url_prefix='/api/ml')

# Base model directory
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'models')

# Ensure models directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

# Global pattern extractor instance
pattern_extractor = PatternExtractor()

@ml_bp.route('/patterns', methods=['POST'])
def extract_patterns():
    """Extract patterns from data."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        data_type = data.get('type')
        content = data.get('content')
        
        if not data_type or not content:
            return jsonify({'error': 'Missing type or content'}), 400
        
        if data_type == 'schedule':
            patterns = pattern_extractor.extract_patterns_from_schedule(content)
        elif data_type == 'feedback':
            patterns = pattern_extractor.extract_patterns_from_feedback(content)
        elif data_type == 'experience':
            patterns = pattern_extractor.extract_patterns_from_experiences(content)
        else:
            return jsonify({'error': f'Unsupported data type: {data_type}'}), 400
        
        return jsonify({'patterns': patterns})
    
    except Exception as e:
        logger.exception(f"Error extracting patterns: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ml_bp.route('/recommend', methods=['GET'])
def get_recommendations():
    """Get parameter recommendations based on extracted patterns."""
    try:
        task_type = request.args.get('task_type')
        sport_type = request.args.get('sport_type')
        
        if not task_type:
            return jsonify({'error': 'Missing task_type parameter'}), 400
        
        params = pattern_extractor.get_recommended_parameters(task_type, sport_type)
        
        return jsonify({
            'recommendations': params,
            'task_type': task_type,
            'sport_type': sport_type
        })
    
    except Exception as e:
        logger.exception(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ml_bp.route('/models', methods=['GET'])
def list_models():
    """List all available models."""
    try:
        models = []
        
        # List all .pkl files in the models directory
        for filename in os.listdir(MODEL_DIR):
            if filename.endswith('.pkl'):
                model_type = filename.split('_')[0]
                version = filename.split('_')[1].split('.pkl')[0]
                
                # Try to load the model to get more info
                model = create_model(model_type)
                model_loaded = model.load(os.path.join(MODEL_DIR, filename))
                
                if model_loaded:
                    models.append(model.get_model_info())
                else:
                    models.append({
                        'name': model_type,
                        'version': version,
                        'status': 'unavailable'
                    })
        
        return jsonify({'models': models})
    
    except Exception as e:
        logger.exception(f"Error listing models: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ml_bp.route('/predict/game', methods=['POST'])
def predict_game():
    """Predict the outcome of a game."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        game = data.get('game')
        team_stats = data.get('teamStats')
        
        if not game or not team_stats:
            return jsonify({'error': 'Missing game or team_stats'}), 400
        
        # Load the game outcome predictor model
        model = GameOutcomePredictor()
        model_path = os.path.join(MODEL_DIR, 'game_outcome_1.0.0.pkl')
        
        if not os.path.exists(model_path):
            return jsonify({'error': 'Game outcome model not found'}), 404
        
        model.load(model_path)
        
        # Make prediction
        prediction = model.predict_outcome(game, team_stats)
        
        return jsonify({
            'prediction': prediction,
            'model': model.get_model_info()
        })
    
    except Exception as e:
        logger.exception(f"Error predicting game outcome: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ml_bp.route('/predict/schedule', methods=['POST'])
def predict_schedule_quality():
    """Predict the quality of a schedule."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        schedule = data.get('schedule')
        
        if not schedule:
            return jsonify({'error': 'Missing schedule data'}), 400
        
        # Load the schedule quality predictor model
        model = ScheduleQualityPredictor()
        model_path = os.path.join(MODEL_DIR, 'schedule_quality_1.0.0.pkl')
        
        if not os.path.exists(model_path):
            return jsonify({'error': 'Schedule quality model not found'}), 404
        
        model.load(model_path)
        
        # Make prediction
        quality = model.predict_quality(schedule)
        
        return jsonify({
            'quality': quality,
            'model': model.get_model_info()
        })
    
    except Exception as e:
        logger.exception(f"Error predicting schedule quality: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ml_bp.route('/predict/team', methods=['POST'])
def predict_team_performance():
    """Predict the COMPASS index for a team."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        team_data = data.get('teamData')
        
        if not team_data:
            return jsonify({'error': 'Missing team data'}), 400
        
        # Load the team performance predictor model
        model = TeamPerformancePredictor()
        model_path = os.path.join(MODEL_DIR, 'team_performance_1.0.0.pkl')
        
        if not os.path.exists(model_path):
            return jsonify({'error': 'Team performance model not found'}), 404
        
        model.load(model_path)
        
        # Make prediction
        compass_index = model.predict_compass_index(team_data)
        
        return jsonify({
            'compassIndex': compass_index,
            'model': model.get_model_info()
        })
    
    except Exception as e:
        logger.exception(f"Error predicting team performance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@ml_bp.route('/train', methods=['POST'])
def train_model():
    """Train a model with the provided data."""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        model_type = data.get('modelType')
        training_data = data.get('trainingData')
        config = data.get('config', {})
        
        if not model_type or not training_data:
            return jsonify({'error': 'Missing model_type or training_data'}), 400
        
        # Create model based on type
        try:
            model = create_model(model_type, config)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Prepare features based on model type
        try:
            if model_type == 'game_outcome':
                games = training_data.get('games', [])
                team_stats = training_data.get('teamStats', {})
                X, y, feature_names = model.prepare_features(games, team_stats)
            elif model_type == 'schedule_quality':
                schedules = training_data.get('schedules', [])
                X, y, feature_names = model.prepare_features(schedules)
            elif model_type == 'team_performance':
                team_data = training_data.get('teamData', [])
                X, y, feature_names = model.prepare_features(team_data)
            else:
                return jsonify({'error': f'Unsupported model type: {model_type}'}), 400
        except Exception as e:
            logger.exception(f"Error preparing features: {str(e)}")
            return jsonify({'error': f'Error preparing features: {str(e)}'}), 500
        
        # Train the model
        try:
            result = model.train(X, y, feature_names)
        except Exception as e:
            logger.exception(f"Error training model: {str(e)}")
            return jsonify({'error': f'Error training model: {str(e)}'}), 500
        
        # Save the model
        try:
            model_path = model.save(MODEL_DIR)
            logger.info(f"Model saved to {model_path}")
        except Exception as e:
            logger.exception(f"Error saving model: {str(e)}")
            return jsonify({'error': f'Error saving model: {str(e)}'}), 500
        
        return jsonify({
            'success': True,
            'modelInfo': model.get_model_info(),
            'trainingResult': result
        })
    
    except Exception as e:
        logger.exception(f"Error in model training: {str(e)}")
        return jsonify({'error': str(e)}), 500

def register_ml_routes(app):
    """Register the ML routes with the Flask application."""
    app.register_blueprint(ml_bp)
    logger.info("Registered ML API routes")