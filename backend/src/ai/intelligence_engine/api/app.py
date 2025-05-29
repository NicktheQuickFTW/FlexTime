"""
HELiiX Intelligence Engine API

This module provides the Flask application and API endpoints for the HELiiX Intelligence Engine.
It serves as the communication layer between the JavaScript agent system and the Python backend.
"""

import os
import json
import uuid
import logging
import time
from datetime import datetime
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from waitress import serve

# Import other modules
try:
    # Relative imports when used as a package
    from ..core.task_manager import get_task_manager, TaskRegistry
    from ..optimization import schedule_optimization_service
    from ..agents import initialize_agent_system
except ImportError:
    # Absolute imports when run directly
    from intelligence_engine.core.task_manager import get_task_manager, TaskRegistry
    from intelligence_engine.optimization import schedule_optimization_service
    from intelligence_engine.agents import initialize_agent_system
# from ..core.config import Config
# from ..core.auth import authenticate, require_auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('intelligence_engine.log')
    ]
)

logger = logging.getLogger('intelligence_engine')

# Create Flask application
app = Flask(__name__)
CORS(app)

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize task manager
task_manager = get_task_manager()
task_registry = TaskRegistry()

# Register task handlers
def register_task_handlers():
    """Register handlers for supported task types."""
    task_registry.register('optimize_schedule', handle_optimize_schedule_task)
    # Add more task handlers here as they are implemented

def handle_optimize_schedule_task(task):
    """Handle a schedule optimization task."""
    logger.info(f"Handling optimize_schedule task {task.task_id}")
    
    parameters = task.parameters
    schedule = parameters.get('schedule')
    algorithm_type = parameters.get('algorithmType', 'simulated_annealing')
    config = parameters.get('config', {})
    
    if not schedule:
        raise ValueError("Schedule data is required")
    
    # Optimize the schedule
    result = schedule_optimization_service.optimize_schedule(schedule, algorithm_type, config)
    return result

@api_bp.route('/status', methods=['GET'])
def get_status():
    """Get the status of the Intelligence Engine."""
    # Calculate uptime (placeholder for now)
    uptime = '00:00:00'  # Replace with actual uptime calculation

    return jsonify({
        'status': 'active',
        'version': '1.0.0',
        'uptime': uptime,
        'endpoints': {
            'tasks': '/api/agents/tasks',
            'feedback': '/api/feedback',
            'experiences': '/api/experiences',
            'recommendations': '/api/recommendations',
            'ml': '/api/ml',
            'kg': '/api/kg',
            'conflict': '/api/conflict'
        },
        'capabilities': {
            'scheduling': [
                'generate_schedule',
                'optimize_schedule',
                'validate_schedule',
                'select_algorithm',
                'analyze_conflicts',
                'resolve_conflicts'
            ],
            'analysis': [
                'analyze_constraints',
                'evaluate_metrics',
                'predict_outcomes',
                'generate_insights'
            ],
            'learning': [
                'process_feedback',
                'extract_patterns',
                'update_models',
                'recommend_parameters'
            ],
            'ml': [
                'predict_game_outcomes',
                'evaluate_schedule_quality',
                'rate_team_performance',
                'extract_scheduling_patterns'
            ],
            'knowledge_graph': [
                'enhance_from_schedule',
                'enhance_from_feedback',
                'enhance_from_experiences',
                'query_scheduling_insights',
                'entity_management',
                'relationship_mapping'
            ],
            'conflict_resolution': [
                'analyze_conflicts',
                'generate_resolution_plan',
                'auto_resolve_conflicts',
                'visualize_conflicts',
                'visualize_resolution_plan'
            ]
        }
    })

@api_bp.route('/agents/tasks', methods=['POST'])
def submit_task():
    """Submit a task to the Intelligence Engine."""
    data = request.json
    
    # Validate request data
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    required_fields = ['agentId', 'taskType', 'parameters']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create and submit task
    try:
        # Check if task type is supported
        task_type = data['taskType']
        if not task_registry.get_handler(task_type):
            return jsonify({'error': f'Unsupported task type: {task_type}'}), 400
        
        # Create the task
        task = task_manager.create_task(
            data['agentId'],
            data['taskType'],
            data['parameters']
        )
        
        # Submit the task
        task_id = task_manager.submit_task(task)
        
        # Check if wait flag is set
        if data.get('wait', False):
            # Wait for task completion
            max_wait = 60  # Maximum wait time in seconds
            poll_interval = 0.5  # Poll interval in seconds
            
            waited = 0
            while waited < max_wait:
                task_obj = task_manager.get_task(task_id)
                
                if task_obj.status == 'completed':
                    return jsonify({
                        'success': True,
                        'taskId': task_id,
                        'status': task_obj.status,
                        'result': task_obj.result
                    })
                elif task_obj.status == 'failed':
                    return jsonify({
                        'success': False,
                        'taskId': task_id,
                        'status': task_obj.status,
                        'error': task_obj.error
                    }), 400
                
                # Wait before checking again
                time.sleep(poll_interval)
                waited += poll_interval
            
            # If we've waited too long, return an async response
            return jsonify({
                'success': True,
                'async': True,
                'taskId': task_id,
                'status': 'processing',
                'message': 'Task is still processing, check back later'
            })
        else:
            # Return async response immediately
            return jsonify({
                'success': True,
                'async': True,
                'taskId': task_id,
                'status': 'pending'
            })
    
    except Exception as e:
        logger.exception(f"Error submitting task: {str(e)}")
        return jsonify({'error': f'Error submitting task: {str(e)}'}), 500

@api_bp.route('/agents/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get the status of a task."""
    task = task_manager.get_task(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify({
        'taskId': task_id,
        'status': task.status,
        'created': task.created.isoformat(),
        'updated': task.updated.isoformat(),
        'agentId': task.agent_id,
        'taskType': task.task_type
    })

@api_bp.route('/agents/tasks/<task_id>/result', methods=['GET'])
def get_task_result(task_id):
    """Get the result of a completed task."""
    task = task_manager.get_task(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    if task.status != 'completed':
        return jsonify({
            'error': 'Task not completed yet',
            'status': task.status
        }), 400
    
    return jsonify({
        'taskId': task_id,
        'status': 'completed',
        'result': task.result,
        'completed': task.completed.isoformat() if task.completed else None
    })

@api_bp.route('/feedback', methods=['POST'])
def store_feedback():
    """Store feedback data."""
    data = request.json
    
    # Validate request data
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    required_fields = ['scheduleId']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Generate ID for the feedback
    feedback_id = str(uuid.uuid4())
    
    # Store feedback (placeholder for now)
    # In a real implementation, this would be stored in a database
    logger.info(f"Received feedback for schedule {data['scheduleId']}")
    
    return jsonify({
        'success': True,
        'feedbackId': feedback_id
    })

@api_bp.route('/experiences', methods=['POST'])
def store_experience():
    """Store experience data."""
    data = request.json
    
    # Validate request data
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    required_fields = ['type', 'content']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Generate ID for the experience
    experience_id = str(uuid.uuid4())
    
    # Store experience (placeholder for now)
    # In a real implementation, this would be stored in a database
    logger.info(f"Received experience of type {data['type']}")
    
    return jsonify({
        'success': True,
        'experienceId': experience_id
    })

@api_bp.route('/recommendations/scheduling', methods=['GET'])
def get_scheduling_recommendations():
    """Get scheduling recommendations."""
    # Extract parameters from query string
    sport_type = request.args.get('sportType')
    team_count = request.args.get('teamCount')
    constraint_types = request.args.getlist('constraintTypes[]')
    optimization_goals = request.args.getlist('optimizationGoals[]')
    
    # Generate recommendations (placeholder for now)
    # In a real implementation, this would use machine learning models
    # to generate personalized recommendations
    recommendations = {
        'parameters': {
            'algorithm': 'adaptive_simulated_annealing',
            'optimizationIterations': 5000,
            'coolingRate': 0.98,
            'initialTemperature': 100,
            'constraintWeights': {
                'venue_availability': 10,
                'travel_distance': 5,
                'rest_days': 8,
                'home_away_balance': 6
            }
        },
        'constraints': [
            {
                'type': 'rest_days',
                'parameters': {
                    'minRestDays': 2,
                    'recommended': True
                }
            },
            {
                'type': 'travel_distance',
                'parameters': {
                    'maxDistancePerWeek': 1500,
                    'recommended': True
                }
            }
        ],
        'insights': [
            'Based on historical data, teams perform better with at least 2 rest days between games',
            'Travel distances over 1500 miles per week correlate with decreased performance'
        ]
    }
    
    return jsonify(recommendations)

@api_bp.route('/recommendations/learning', methods=['GET'])
def get_learning_recommendations():
    """Get advanced learning recommendations."""
    # Extract parameters from query string
    sport_type = request.args.get('sportType')
    team_count = request.args.get('teamCount')
    
    # Generate recommendations (placeholder for now)
    # In a real implementation, this would use machine learning models
    # to generate personalized recommendations
    recommendations = {
        'modelParameters': {
            'learningRate': 0.01,
            'batchSize': 64,
            'epochs': 100,
            'architecture': 'transformer'
        },
        'dataParameters': {
            'featureImportance': {
                'travel_distance': 0.35,
                'rest_days': 0.25,
                'opponent_strength': 0.2,
                'venue_familiarity': 0.1,
                'time_of_day': 0.1
            },
            'recommendedFeatures': [
                'travel_distance',
                'rest_days',
                'opponent_strength',
                'venue_familiarity',
                'time_of_day'
            ]
        },
        'insights': [
            'Travel distance is the most important feature for predicting game outcomes',
            'Rest days have a significant impact on team performance'
        ]
    }
    
    return jsonify(recommendations)

@api_bp.route('/optimization/algorithms', methods=['GET'])
def get_optimization_algorithms():
    """Get available optimization algorithms."""
    algorithms = schedule_optimization_service.get_available_algorithms()
    return jsonify(algorithms)

@api_bp.route('/optimization/schedule', methods=['POST'])
def optimize_schedule():
    """Optimize a schedule."""
    data = request.json
    
    # Validate request data
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    if 'schedule' not in data:
        return jsonify({'error': 'Missing schedule data'}), 400
    
    # Extract parameters
    schedule = data['schedule']
    algorithm_type = data.get('algorithmType', 'simulated_annealing')
    config = data.get('config', {})
    
    # Optimize the schedule
    try:
        logger.info(f"Optimizing schedule using {algorithm_type} algorithm")
        result = schedule_optimization_service.optimize_schedule(schedule, algorithm_type, config)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.exception(f"Error optimizing schedule: {str(e)}")
        return jsonify({'error': 'Internal server error during optimization'}), 500

@api_bp.route('/agents', methods=['GET'])
def get_agents():
    """Get information about available agents."""
    agent_registry = app.config.get('AGENT_REGISTRY')
    
    if not agent_registry:
        return jsonify({'error': 'Agent registry not initialized'}), 500
    
    agents = []
    
    for agent_id, agent in agent_registry.agents.items():
        agents.append({
            'agent_id': agent.agent_id,
            'agent_type': agent.agent_type,
            'status': agent.status,
            'capabilities': list(agent.capabilities),
            'created_at': agent.created_at.isoformat(),
            'last_active': agent.last_active.isoformat()
        })
    
    return jsonify({
        'count': len(agents),
        'agents': agents
    })

@api_bp.route('/agents/directors', methods=['GET'])
def get_directors():
    """Get information about director agents."""
    director_registry = app.config.get('DIRECTOR_REGISTRY')
    
    if not director_registry:
        return jsonify({'error': 'Director registry not initialized'}), 500
    
    directors = []
    
    for director_type, director in director_registry.directors.items():
        directors.append({
            'agent_id': director.agent_id,
            'director_type': director.director_type,
            'status': director.status,
            'capabilities': list(director.capabilities),
            'specialized_agents': list(director.specialized_agents),
            'task_count': len(director.tasks),
            'created_at': director.created_at.isoformat(),
            'last_active': director.last_active.isoformat()
        })
    
    return jsonify({
        'count': len(directors),
        'directors': directors
    })

@api_bp.route('/agents/directors/<director_type>/tasks', methods=['POST'])
def create_director_task(director_type):
    """Create a task for a director agent."""
    director_registry = app.config.get('DIRECTOR_REGISTRY')
    
    if not director_registry:
        return jsonify({'error': 'Director registry not initialized'}), 500
    
    # Get the director
    director = director_registry.get_director(director_type)
    
    if not director:
        return jsonify({'error': f'Director of type {director_type} not found'}), 404
    
    # Get the request data
    data = request.json
    
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    # Extract task details
    task_type = data.get('taskType')
    description = data.get('description', f"Task of type {task_type}")
    parameters = data.get('parameters', {})
    
    if not task_type:
        return jsonify({'error': 'Missing task type'}), 400
    
    # Create the task
    task = director.create_task(task_type, description, parameters)
    
    # Decide which agent to delegate to
    agent_id = director._select_agent_for_task(task)
    
    if not agent_id:
        return jsonify({
            'success': True,
            'task_id': task['task_id'],
            'status': task['status'],
            'message': 'Task created but no suitable agent found for delegation'
        })
    
    # Delegate the task
    success = director.delegate_task(task['task_id'], agent_id)
    
    if success:
        return jsonify({
            'success': True,
            'task_id': task['task_id'],
            'status': 'delegated',
            'agent_id': agent_id
        })
    else:
        return jsonify({
            'success': True,
            'task_id': task['task_id'],
            'status': task['status'],
            'message': f'Task created but delegation to agent {agent_id} failed'
        })

# Further task handlers can be added here
def handle_generate_schedule_task(task):
    """Handle a schedule generation task."""
    logger.info(f"Handling generate_schedule task {task.task_id}")
    
    parameters = task.parameters
    sport_type = parameters.get('sportType', 'generic')
    teams = parameters.get('teams', [])
    constraints = parameters.get('constraints', [])
    options = parameters.get('options', {})
    
    if not teams:
        raise ValueError("Teams data is required")
    
    # Import the schedule generator here to avoid circular imports
    try:
        # Relative import
        from ..scheduling.schedule_generator import create_generator
    except ImportError:
        # Absolute import
        from intelligence_engine.scheduling.schedule_generator import create_generator
    
    # Create a generator for the specified sport type
    generator = create_generator(sport_type)
    
    # Generate a schedule
    schedule = generator.generate(teams, constraints, options)
    
    return schedule

def handle_analyze_constraints_task(task):
    """Handle a constraint analysis task."""
    logger.info(f"Handling analyze_constraints task {task.task_id}")
    
    parameters = task.parameters
    schedule = parameters.get('schedule')
    constraints = parameters.get('constraints', [])
    
    if not schedule:
        raise ValueError("Schedule data is required")
    
    # Placeholder implementation
    # In a real implementation, this would perform actual constraint analysis
    violations = []
    recommendations = []
    
    # Simulate analyzing constraints
    for constraint in constraints:
        constraint_type = constraint.get('type')
        
        # Randomly determine if there are violations
        if random.random() < 0.3:  # 30% chance of violation
            team = random.choice(schedule.get('teams', ['TeamA', 'TeamB', 'TeamC', 'TeamD']))
            severity = random.choice(['low', 'medium', 'high'])
            
            violations.append({
                'constraintType': constraint_type,
                'team': team,
                'severity': severity
            })
            
            # Generate a recommendation
            if constraint_type == 'rest_days':
                recommendations.append({
                    'action': 'increase_rest_days',
                    'team': team,
                    'details': f'Add more rest days for {team} between consecutive games'
                })
            elif constraint_type == 'travel_distance':
                recommendations.append({
                    'action': 'reduce_travel',
                    'team': team,
                    'details': f'Consider swapping home/away games to reduce travel distance for {team}'
                })
    
    return {
        'type': 'analysis',
        'violations': violations,
        'recommendations': recommendations
    }

# Import the API routes
from intelligence_engine.api.ml_routes import register_ml_routes
from intelligence_engine.api.kg_routes import register_kg_routes
from intelligence_engine.api.conflict_routes import register_conflict_routes
from intelligence_engine.api.feedback_routes import register_feedback_routes

# Initialize the application
def init_app():
    """Initialize the application."""
    # Register task handlers
    register_task_handlers()
    task_registry.register('generate_schedule', handle_generate_schedule_task)
    task_registry.register('analyze_constraints', handle_analyze_constraints_task)

    logger.info("Registered task handlers")

    # Initialize the agent system
    director_registry, agent_registry = initialize_agent_system()
    logger.info(f"Initialized agent system with {len(director_registry.directors)} directors and {len(agent_registry.agents)} agents")

    # Register the agent system with the application
    app.config['DIRECTOR_REGISTRY'] = director_registry
    app.config['AGENT_REGISTRY'] = agent_registry

    # Register blueprints
    app.register_blueprint(api_bp)

    # Register ML routes
    register_ml_routes(app)
    logger.info("Registered ML routes")

    # Register Knowledge Graph routes
    register_kg_routes(app)
    logger.info("Registered Knowledge Graph routes")

    # Register Conflict Resolution routes
    register_conflict_routes(app)
    logger.info("Registered Conflict Resolution routes")

    # Register Feedback Collection routes
    register_feedback_routes(app)
    logger.info("Registered Feedback Collection routes")

# Initialize the application
init_app()

@app.route('/')
def home():
    """Redirect to API status endpoint."""
    return jsonify({
        'name': 'HELiiX Intelligence Engine',
        'version': '1.0.0',
        'description': 'Python backend for the FlexTime scheduling platform',
        'status': 'active',
        'api': '/api',
        'ml': '/api/ml'
    })

def start_server(host='0.0.0.0', port=4001):
    """Start the server using Waitress."""
    logger.info(f"Starting Intelligence Engine API server on {host}:{port}")
    serve(app, host=host, port=port)

if __name__ == '__main__':
    # Determine port from environment or default to 4001
    port = int(os.environ.get('PORT', 4001))
    
    # Start server
    start_server(port=port)