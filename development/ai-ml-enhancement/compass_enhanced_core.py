"""
Enhanced COMPASS Core System for FlexTime
Advanced machine learning and predictive analytics for collegiate athletics scheduling.

This module provides the next-generation COMPASS system with:
- Real-time learning capabilities
- Ensemble modeling for improved predictions
- Advanced pattern recognition
- Automated optimization recommendations
- Big 12 Conference specific intelligence
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from sklearn.ensemble import RandomForestRegressor, VotingRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import redis
import json

# Configure logging
logger = logging.getLogger('compass_enhanced')

@dataclass
class PredictionResult:
    """Container for prediction results with confidence metrics."""
    value: float
    confidence: float
    model_consensus: float
    uncertainty: float
    explanation: Dict[str, Any]

@dataclass
class ModelPerformanceMetrics:
    """Container for model performance tracking."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    mse: float
    r2_score: float
    last_updated: datetime
    prediction_count: int

class EnsemblePredictor:
    """Advanced ensemble predictor using multiple ML models."""
    
    def __init__(self, models_config: Dict[str, Any] = None):
        """Initialize the ensemble predictor.
        
        Args:
            models_config: Configuration for individual models
        """
        self.models_config = models_config or {}
        self.models = {}
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_importance = {}
        self.performance_metrics = {}
        
        # Initialize model ensemble
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize the ensemble of models."""
        # Random Forest - Good for feature importance and robustness
        self.models['random_forest'] = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            random_state=42,
            n_jobs=-1
        )
        
        # Gradient Boosting - Strong sequential learning
        self.models['gradient_boost'] = GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.1,
            max_depth=8,
            random_state=42
        )
        
        # Neural Network - Captures complex patterns
        self.models['neural_net'] = MLPRegressor(
            hidden_layer_sizes=(100, 50, 25),
            activation='relu',
            solver='adam',
            max_iter=500,
            random_state=42
        )
        
        # Create voting ensemble
        self.ensemble = VotingRegressor([
            ('rf', self.models['random_forest']),
            ('gb', self.models['gradient_boost']),
            ('nn', self.models['neural_net'])
        ])
    
    def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str] = None) -> Dict[str, Any]:
        """Train the ensemble model.
        
        Args:
            X: Feature matrix
            y: Target values
            feature_names: Names of features
            
        Returns:
            Training results
        """
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train ensemble
        self.ensemble.fit(X_scaled, y)
        
        # Train individual models for analysis
        for name, model in self.models.items():
            model.fit(X_scaled, y)
        
        # Calculate feature importance from Random Forest
        if feature_names:
            importance_scores = self.models['random_forest'].feature_importances_
            self.feature_importance = dict(zip(feature_names, importance_scores))
        
        # Evaluate models
        y_pred = self.ensemble.predict(X_scaled)
        mse = mean_squared_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        
        self.performance_metrics = ModelPerformanceMetrics(
            accuracy=r2,
            precision=0.0,  # Not applicable for regression
            recall=0.0,     # Not applicable for regression
            f1_score=0.0,   # Not applicable for regression
            mse=mse,
            r2_score=r2,
            last_updated=datetime.now(),
            prediction_count=0
        )
        
        self.is_trained = True
        
        logger.info(f"Ensemble model trained with R² = {r2:.4f}, MSE = {mse:.4f}")
        
        return {
            'success': True,
            'r2_score': r2,
            'mse': mse,
            'feature_importance': self.feature_importance
        }
    
    def predict(self, X: np.ndarray) -> PredictionResult:
        """Make prediction with confidence metrics.
        
        Args:
            X: Feature matrix
            
        Returns:
            Prediction result with confidence metrics
        """
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get predictions from all models
        predictions = {}
        for name, model in self.models.items():
            predictions[name] = model.predict(X_scaled)
        
        # Ensemble prediction
        ensemble_pred = self.ensemble.predict(X_scaled)
        
        # Calculate consensus and uncertainty
        pred_values = list(predictions.values())
        model_consensus = np.std(pred_values, axis=0).mean()
        uncertainty = np.std(pred_values, axis=0).mean() / np.mean(pred_values, axis=0).mean()
        
        # Confidence based on model agreement
        confidence = max(0.0, 1.0 - (model_consensus / max(ensemble_pred.mean(), 0.1)))
        
        # Create explanation
        explanation = {
            'individual_predictions': predictions,
            'feature_importance': self.feature_importance,
            'model_weights': {
                'random_forest': 0.4,
                'gradient_boost': 0.4,
                'neural_net': 0.2
            }
        }
        
        # Update metrics
        self.performance_metrics.prediction_count += 1
        
        return PredictionResult(
            value=ensemble_pred[0] if len(ensemble_pred) == 1 else ensemble_pred,
            confidence=confidence,
            model_consensus=model_consensus,
            uncertainty=uncertainty,
            explanation=explanation
        )

class RealtimeLearningEngine:
    """Real-time learning engine for continuous model improvement."""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize the real-time learning engine.
        
        Args:
            redis_client: Redis client for caching and queuing
        """
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=0)
        self.learning_queue = "compass_learning_queue"
        self.feedback_buffer = []
        self.buffer_size = 100
        self.retrain_threshold = 0.1  # Retrain if performance drops by 10%
        
    async def add_feedback(self, prediction_id: str, actual_value: float, 
                          prediction_value: float, features: Dict[str, Any]):
        """Add feedback for real-time learning.
        
        Args:
            prediction_id: Unique identifier for the prediction
            actual_value: Actual observed value
            prediction_value: Previously predicted value
            features: Features used for prediction
        """
        feedback_data = {
            'prediction_id': prediction_id,
            'actual_value': actual_value,
            'prediction_value': prediction_value,
            'features': features,
            'timestamp': datetime.now().isoformat(),
            'error': abs(actual_value - prediction_value)
        }
        
        # Add to buffer
        self.feedback_buffer.append(feedback_data)
        
        # Store in Redis for persistence
        await self._store_feedback_redis(feedback_data)
        
        # Check if retraining is needed
        if len(self.feedback_buffer) >= self.buffer_size:
            await self._evaluate_retraining_need()
    
    async def _store_feedback_redis(self, feedback_data: Dict[str, Any]):
        """Store feedback data in Redis."""
        try:
            self.redis_client.lpush(
                self.learning_queue, 
                json.dumps(feedback_data)
            )
            # Keep only last 1000 feedback entries
            self.redis_client.ltrim(self.learning_queue, 0, 999)
        except Exception as e:
            logger.error(f"Failed to store feedback in Redis: {e}")
    
    async def _evaluate_retraining_need(self):
        """Evaluate if model retraining is needed."""
        if len(self.feedback_buffer) < 10:
            return
        
        # Calculate recent prediction accuracy
        recent_errors = [fb['error'] for fb in self.feedback_buffer[-10:]]
        recent_mse = np.mean(np.square(recent_errors))
        
        # Compare with historical performance
        historical_errors = [fb['error'] for fb in self.feedback_buffer[:-10]]
        if historical_errors:
            historical_mse = np.mean(np.square(historical_errors))
            
            # Check if performance degraded significantly
            if recent_mse > historical_mse * (1 + self.retrain_threshold):
                logger.info("Performance degradation detected, triggering retraining")
                await self._trigger_retraining()
    
    async def _trigger_retraining(self):
        """Trigger model retraining with recent feedback."""
        # This would trigger the retraining pipeline
        retrain_signal = {
            'timestamp': datetime.now().isoformat(),
            'trigger': 'performance_degradation',
            'feedback_count': len(self.feedback_buffer)
        }
        
        try:
            self.redis_client.publish('compass_retrain_channel', json.dumps(retrain_signal))
            logger.info("Retraining signal sent")
        except Exception as e:
            logger.error(f"Failed to send retraining signal: {e}")

class Big12SpecificIntelligence:
    """Big 12 Conference specific AI models and intelligence."""
    
    def __init__(self):
        """Initialize Big 12 specific intelligence."""
        self.rivalry_weights = self._load_rivalry_weights()
        self.regional_preferences = self._load_regional_preferences()
        self.venue_characteristics = self._load_venue_characteristics()
        
    def _load_rivalry_weights(self) -> Dict[str, Dict[str, float]]:
        """Load rivalry impact weights for Big 12 teams."""
        # Enhanced rivalry mappings with impact scores
        return {
            'Kansas': {'Kansas State': 0.95, 'Missouri': 0.85, 'Oklahoma': 0.75},
            'Kansas State': {'Kansas': 0.95, 'Iowa State': 0.80, 'Oklahoma State': 0.70},
            'Oklahoma State': {'Oklahoma': 0.90, 'Texas': 0.75, 'Kansas State': 0.70},
            'Texas': {'Oklahoma': 0.85, 'Texas Tech': 0.80, 'Baylor': 0.75},
            'Texas Tech': {'Texas': 0.80, 'Baylor': 0.75, 'Oklahoma State': 0.65},
            'Baylor': {'TCU': 0.85, 'Texas': 0.75, 'Texas Tech': 0.75},
            'TCU': {'Baylor': 0.85, 'Texas': 0.70, 'Oklahoma State': 0.65},
            'Iowa State': {'Kansas State': 0.80, 'Oklahoma State': 0.65},
            'West Virginia': {'Oklahoma State': 0.70, 'Texas': 0.65},
            'Cincinnati': {'West Virginia': 0.60, 'Houston': 0.55},
            'Houston': {'Texas': 0.70, 'TCU': 0.65, 'Cincinnati': 0.55},
            'UCF': {'Cincinnati': 0.60, 'Houston': 0.55},
            'BYU': {'Utah': 0.90, 'Arizona': 0.60},
            'Utah': {'BYU': 0.90, 'Colorado': 0.75, 'Arizona': 0.70},
            'Colorado': {'Utah': 0.75, 'Arizona': 0.65},
            'Arizona': {'Arizona State': 0.95, 'Utah': 0.70, 'BYU': 0.60},
            'Arizona State': {'Arizona': 0.95, 'Utah': 0.65}
        }
    
    def _load_regional_preferences(self) -> Dict[str, List[str]]:
        """Load regional groupings for travel optimization."""
        return {
            'Texas': ['Texas', 'Texas Tech', 'Baylor', 'TCU', 'Houston'],
            'Plains': ['Kansas', 'Kansas State', 'Iowa State', 'Oklahoma State'],
            'Mountain': ['Utah', 'Colorado', 'BYU'],
            'Southwest': ['Arizona', 'Arizona State'],
            'East': ['West Virginia', 'Cincinnati', 'UCF']
        }
    
    def _load_venue_characteristics(self) -> Dict[str, Dict[str, Any]]:
        """Load venue-specific characteristics that affect scheduling."""
        return {
            'Allen Fieldhouse': {
                'capacity': 16300,
                'home_advantage': 0.85,
                'tv_preference': 0.90,
                'difficulty_factor': 0.95
            },
            'Hilton Coliseum': {
                'capacity': 14384,
                'home_advantage': 0.80,
                'tv_preference': 0.75,
                'difficulty_factor': 0.85
            },
            'Bramlage Coliseum': {
                'capacity': 12528,
                'home_advantage': 0.75,
                'tv_preference': 0.70,
                'difficulty_factor': 0.80
            },
            # Add more venues as needed
        }
    
    def calculate_rivalry_impact(self, team1: str, team2: str) -> float:
        """Calculate rivalry impact on game importance.
        
        Args:
            team1: First team name
            team2: Second team name
            
        Returns:
            Rivalry impact score (0.0 to 1.0)
        """
        # Check direct rivalry
        if team1 in self.rivalry_weights and team2 in self.rivalry_weights[team1]:
            return self.rivalry_weights[team1][team2]
        
        if team2 in self.rivalry_weights and team1 in self.rivalry_weights[team2]:
            return self.rivalry_weights[team2][team1]
        
        # Check regional rivalry
        team1_region = self._get_team_region(team1)
        team2_region = self._get_team_region(team2)
        
        if team1_region and team2_region:
            if team1_region == team2_region:
                return 0.60  # Same region rivalry
            else:
                return 0.40  # Cross-region matchup
        
        return 0.50  # Default neutral
    
    def _get_team_region(self, team: str) -> Optional[str]:
        """Get the region for a team."""
        for region, teams in self.regional_preferences.items():
            if team in teams:
                return region
        return None
    
    def calculate_tv_viewership_potential(self, team1: str, team2: str, 
                                        time_slot: str, day_of_week: str) -> float:
        """Calculate TV viewership potential for a matchup.
        
        Args:
            team1: First team name
            team2: Second team name  
            time_slot: Time slot (e.g., 'prime', 'afternoon', 'morning')
            day_of_week: Day of the week
            
        Returns:
            Viewership potential score (0.0 to 1.0)
        """
        base_score = 0.5
        
        # Rivalry bonus
        rivalry_impact = self.calculate_rivalry_impact(team1, team2)
        rivalry_bonus = (rivalry_impact - 0.5) * 0.3
        
        # Time slot preferences
        time_multipliers = {
            'prime': 1.0,      # 6-10 PM
            'afternoon': 0.8,   # 12-6 PM
            'morning': 0.4,     # Before 12 PM
            'late': 0.6        # After 10 PM
        }
        
        # Day preferences
        day_multipliers = {
            'Saturday': 1.0,
            'Sunday': 0.9,
            'Tuesday': 0.8,
            'Wednesday': 0.8,
            'Thursday': 0.7,
            'Monday': 0.6,
            'Friday': 0.5
        }
        
        time_factor = time_multipliers.get(time_slot, 0.7)
        day_factor = day_multipliers.get(day_of_week, 0.7)
        
        final_score = (base_score + rivalry_bonus) * time_factor * day_factor
        return min(1.0, max(0.0, final_score))

class EnhancedCOMPASSCore:
    """Enhanced COMPASS Core with advanced AI/ML capabilities."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the enhanced COMPASS core.
        
        Args:
            config: Configuration settings
        """
        self.config = config or {}
        self.predictors = {}
        self.learning_engine = RealtimeLearningEngine()
        self.big12_intelligence = Big12SpecificIntelligence()
        self.is_initialized = False
        
        # Initialize predictors
        self._initialize_predictors()
    
    def _initialize_predictors(self):
        """Initialize various prediction models."""
        # Schedule Quality Predictor
        self.predictors['schedule_quality'] = EnsemblePredictor()
        
        # Attendance Predictor
        self.predictors['attendance'] = EnsemblePredictor()
        
        # Revenue Predictor
        self.predictors['revenue'] = EnsemblePredictor()
        
        # Fan Engagement Predictor
        self.predictors['fan_engagement'] = EnsemblePredictor()
        
        # Competitive Balance Predictor
        self.predictors['competitive_balance'] = EnsemblePredictor()
        
        logger.info("COMPASS predictors initialized")
    
    async def train_models(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """Train all COMPASS models with provided data.
        
        Args:
            training_data: Training datasets for different models
            
        Returns:
            Training results
        """
        results = {}
        
        for model_name, predictor in self.predictors.items():
            if model_name in training_data:
                data = training_data[model_name]
                
                try:
                    # Extract features and targets
                    X = np.array(data['features'])
                    y = np.array(data['targets'])
                    feature_names = data.get('feature_names', [])
                    
                    # Train the model
                    result = predictor.train(X, y, feature_names)
                    results[model_name] = result
                    
                    logger.info(f"Trained {model_name} model successfully")
                    
                except Exception as e:
                    logger.error(f"Failed to train {model_name} model: {e}")
                    results[model_name] = {'success': False, 'error': str(e)}
        
        self.is_initialized = True
        return results
    
    async def predict_attendance(self, game_features: Dict[str, Any]) -> PredictionResult:
        """Predict attendance for a game.
        
        Args:
            game_features: Game characteristics
            
        Returns:
            Attendance prediction
        """
        # Extract features for attendance prediction
        features = self._extract_attendance_features(game_features)
        X = np.array([features])
        
        # Get prediction
        prediction = self.predictors['attendance'].predict(X)
        
        # Add feedback to learning system
        prediction_id = f"attendance_{game_features.get('game_id', 'unknown')}_{datetime.now().timestamp()}"
        # Note: actual attendance would be added later via feedback
        
        return prediction
    
    def _extract_attendance_features(self, game_features: Dict[str, Any]) -> List[float]:
        """Extract features for attendance prediction.
        
        Args:
            game_features: Game characteristics
            
        Returns:
            Feature vector
        """
        team1 = game_features.get('team1', '')
        team2 = game_features.get('team2', '')
        venue = game_features.get('venue', '')
        day_of_week = game_features.get('day_of_week', 'Saturday')
        time_slot = game_features.get('time_slot', 'afternoon')
        
        # Calculate features
        rivalry_impact = self.big12_intelligence.calculate_rivalry_impact(team1, team2)
        tv_potential = self.big12_intelligence.calculate_tv_viewership_potential(
            team1, team2, time_slot, day_of_week
        )
        
        # Venue characteristics
        venue_info = self.big12_intelligence.venue_characteristics.get(venue, {})
        venue_capacity = venue_info.get('capacity', 15000)
        home_advantage = venue_info.get('home_advantage', 0.70)
        
        # Team rankings (mock data - would come from real rankings)
        team1_ranking = game_features.get('team1_ranking', 50)
        team2_ranking = game_features.get('team2_ranking', 50)
        
        # Weather factor (0.0 = bad weather, 1.0 = perfect weather)
        weather_factor = game_features.get('weather_factor', 0.8)
        
        # Holiday/special event factor
        special_event_factor = game_features.get('special_event_factor', 1.0)
        
        return [
            rivalry_impact,
            tv_potential,
            venue_capacity / 20000,  # Normalized capacity
            home_advantage,
            (100 - team1_ranking) / 100,  # Higher ranking = lower number
            (100 - team2_ranking) / 100,
            weather_factor,
            special_event_factor,
            1.0 if day_of_week in ['Saturday', 'Sunday'] else 0.0,  # Weekend game
            1.0 if time_slot == 'prime' else 0.0  # Prime time game
        ]
    
    async def predict_revenue(self, game_features: Dict[str, Any]) -> PredictionResult:
        """Predict revenue for a game.
        
        Args:
            game_features: Game characteristics
            
        Returns:
            Revenue prediction
        """
        # Get attendance prediction first
        attendance_pred = await self.predict_attendance(game_features)
        
        # Extract features for revenue prediction
        features = self._extract_revenue_features(game_features, attendance_pred.value)
        X = np.array([features])
        
        # Get prediction
        prediction = self.predictors['revenue'].predict(X)
        
        return prediction
    
    def _extract_revenue_features(self, game_features: Dict[str, Any], 
                                predicted_attendance: float) -> List[float]:
        """Extract features for revenue prediction.
        
        Args:
            game_features: Game characteristics
            predicted_attendance: Predicted attendance
            
        Returns:
            Feature vector
        """
        # Ticket pricing information
        avg_ticket_price = game_features.get('avg_ticket_price', 75.0)
        premium_seats_ratio = game_features.get('premium_seats_ratio', 0.15)
        
        # Concession and merchandise factors
        concession_factor = game_features.get('concession_factor', 1.0)
        merchandise_factor = game_features.get('merchandise_factor', 1.0)
        
        # TV revenue component
        tv_revenue = game_features.get('tv_revenue', 0.0)
        
        # Sponsorship multiplier
        sponsorship_multiplier = game_features.get('sponsorship_multiplier', 1.0)
        
        return [
            predicted_attendance / 20000,  # Normalized attendance
            avg_ticket_price / 150,  # Normalized ticket price
            premium_seats_ratio,
            concession_factor,
            merchandise_factor,
            tv_revenue / 1000000,  # Normalized TV revenue
            sponsorship_multiplier
        ]
    
    async def optimize_schedule_for_revenue(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize a schedule for maximum revenue.
        
        Args:
            schedule_data: Current schedule information
            
        Returns:
            Optimization recommendations
        """
        games = schedule_data.get('games', [])
        optimization_results = []
        
        total_current_revenue = 0.0
        total_optimized_revenue = 0.0
        
        for game in games:
            # Predict current revenue
            current_revenue_pred = await self.predict_revenue(game)
            total_current_revenue += current_revenue_pred.value
            
            # Find optimal time slot and day
            best_revenue = current_revenue_pred.value
            best_config = {
                'day_of_week': game.get('day_of_week'),
                'time_slot': game.get('time_slot')
            }
            
            # Test different configurations
            for day in ['Saturday', 'Sunday', 'Tuesday', 'Wednesday', 'Thursday']:
                for time_slot in ['morning', 'afternoon', 'prime']:
                    test_game = game.copy()
                    test_game['day_of_week'] = day
                    test_game['time_slot'] = time_slot
                    
                    test_revenue_pred = await self.predict_revenue(test_game)
                    
                    if test_revenue_pred.value > best_revenue:
                        best_revenue = test_revenue_pred.value
                        best_config = {
                            'day_of_week': day,
                            'time_slot': time_slot
                        }
            
            total_optimized_revenue += best_revenue
            
            optimization_results.append({
                'game_id': game.get('game_id'),
                'current_revenue': current_revenue_pred.value,
                'optimized_revenue': best_revenue,
                'improvement': best_revenue - current_revenue_pred.value,
                'optimal_config': best_config,
                'confidence': current_revenue_pred.confidence
            })
        
        return {
            'total_current_revenue': total_current_revenue,
            'total_optimized_revenue': total_optimized_revenue,
            'total_improvement': total_optimized_revenue - total_current_revenue,
            'improvement_percentage': ((total_optimized_revenue - total_current_revenue) / total_current_revenue) * 100,
            'game_optimizations': optimization_results
        }
    
    async def generate_insights(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive insights for a schedule.
        
        Args:
            schedule_data: Schedule information
            
        Returns:
            Generated insights
        """
        insights = {
            'revenue_analysis': await self.optimize_schedule_for_revenue(schedule_data),
            'competitive_balance': self._analyze_competitive_balance(schedule_data),
            'fan_engagement': await self._analyze_fan_engagement(schedule_data),
            'big12_specific': self._analyze_big12_specifics(schedule_data),
            'recommendations': []
        }
        
        # Generate recommendations based on insights
        insights['recommendations'] = self._generate_recommendations(insights)
        
        return insights
    
    def _analyze_competitive_balance(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze competitive balance of the schedule."""
        games = schedule_data.get('games', [])
        teams = schedule_data.get('teams', [])
        
        # Calculate strength of schedule for each team
        team_sos = {}
        for team in teams:
            team_games = [g for g in games if team in [g.get('team1'), g.get('team2')]]
            opponents = []
            for game in team_games:
                opponent = game.get('team2') if game.get('team1') == team else game.get('team1')
                opponents.append(opponent)
            
            # Mock SOS calculation (would use real team ratings)
            avg_opponent_rating = 0.5  # Placeholder
            team_sos[team] = avg_opponent_rating
        
        # Calculate balance metrics
        sos_variance = np.var(list(team_sos.values()))
        balance_score = max(0.0, 1.0 - (sos_variance * 4))  # Scale variance to 0-1
        
        return {
            'team_strength_of_schedule': team_sos,
            'sos_variance': sos_variance,
            'balance_score': balance_score,
            'most_difficult_schedule': max(team_sos, key=team_sos.get),
            'easiest_schedule': min(team_sos, key=team_sos.get)
        }
    
    async def _analyze_fan_engagement(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze fan engagement potential of the schedule."""
        games = schedule_data.get('games', [])
        
        total_engagement_score = 0.0
        high_engagement_games = []
        
        for game in games:
            # Calculate engagement features
            team1 = game.get('team1', '')
            team2 = game.get('team2', '')
            
            rivalry_score = self.big12_intelligence.calculate_rivalry_impact(team1, team2)
            tv_potential = self.big12_intelligence.calculate_tv_viewership_potential(
                team1, team2, 
                game.get('time_slot', 'afternoon'),
                game.get('day_of_week', 'Saturday')
            )
            
            engagement_score = (rivalry_score + tv_potential) / 2
            total_engagement_score += engagement_score
            
            if engagement_score > 0.75:
                high_engagement_games.append({
                    'game_id': game.get('game_id'),
                    'teams': f"{team1} vs {team2}",
                    'engagement_score': engagement_score,
                    'rivalry_score': rivalry_score,
                    'tv_potential': tv_potential
                })
        
        avg_engagement = total_engagement_score / len(games) if games else 0.0
        
        return {
            'average_engagement_score': avg_engagement,
            'total_engagement_potential': total_engagement_score,
            'high_engagement_games': high_engagement_games,
            'engagement_distribution': self._calculate_engagement_distribution(games)
        }
    
    def _calculate_engagement_distribution(self, games: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate distribution of engagement levels."""
        distribution = {'low': 0, 'medium': 0, 'high': 0}
        
        for game in games:
            team1 = game.get('team1', '')
            team2 = game.get('team2', '')
            
            rivalry_score = self.big12_intelligence.calculate_rivalry_impact(team1, team2)
            
            if rivalry_score < 0.5:
                distribution['low'] += 1
            elif rivalry_score < 0.75:
                distribution['medium'] += 1
            else:
                distribution['high'] += 1
        
        return distribution
    
    def _analyze_big12_specifics(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze Big 12 specific characteristics."""
        games = schedule_data.get('games', [])
        
        # Regional balance analysis
        regional_games = {}
        cross_regional_games = []
        
        for game in games:
            team1 = game.get('team1', '')
            team2 = game.get('team2', '')
            
            team1_region = self.big12_intelligence._get_team_region(team1)
            team2_region = self.big12_intelligence._get_team_region(team2)
            
            if team1_region and team2_region:
                if team1_region == team2_region:
                    if team1_region not in regional_games:
                        regional_games[team1_region] = 0
                    regional_games[team1_region] += 1
                else:
                    cross_regional_games.append({
                        'teams': f"{team1} vs {team2}",
                        'regions': f"{team1_region} vs {team2_region}"
                    })
        
        # TV window analysis
        prime_time_games = [g for g in games if g.get('time_slot') == 'prime']
        weekend_games = [g for g in games if g.get('day_of_week') in ['Saturday', 'Sunday']]
        
        return {
            'regional_game_distribution': regional_games,
            'cross_regional_games': cross_regional_games,
            'prime_time_games_count': len(prime_time_games),
            'weekend_games_count': len(weekend_games),
            'total_games': len(games),
            'regional_balance_score': self._calculate_regional_balance_score(regional_games)
        }
    
    def _calculate_regional_balance_score(self, regional_games: Dict[str, int]) -> float:
        """Calculate how balanced the regional game distribution is."""
        if not regional_games:
            return 1.0
        
        game_counts = list(regional_games.values())
        variance = np.var(game_counts)
        mean_games = np.mean(game_counts)
        
        # Normalized variance (lower is better)
        normalized_variance = variance / (mean_games ** 2) if mean_games > 0 else 0
        balance_score = max(0.0, 1.0 - normalized_variance)
        
        return balance_score
    
    def _generate_recommendations(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate actionable recommendations based on insights."""
        recommendations = []
        
        # Revenue optimization recommendations
        revenue_analysis = insights.get('revenue_analysis', {})
        if revenue_analysis.get('total_improvement', 0) > 0:
            recommendations.append({
                'type': 'revenue_optimization',
                'priority': 'high',
                'title': 'Revenue Optimization Opportunity',
                'description': f"Potential revenue increase of ${revenue_analysis.get('total_improvement', 0):,.0f} "
                              f"({revenue_analysis.get('improvement_percentage', 0):.1f}%) through schedule optimization",
                'actions': [
                    'Consider moving high-profile games to prime time slots',
                    'Optimize weekend game distribution',
                    'Review ticket pricing for high-demand matchups'
                ]
            })
        
        # Competitive balance recommendations
        balance_analysis = insights.get('competitive_balance', {})
        if balance_analysis.get('balance_score', 1.0) < 0.7:
            recommendations.append({
                'type': 'competitive_balance',
                'priority': 'medium',
                'title': 'Competitive Balance Improvement',
                'description': f"Current balance score: {balance_analysis.get('balance_score', 0):.2f}. "
                              "Consider redistributing strength of schedule.",
                'actions': [
                    'Review opponent assignments for teams with easiest/hardest schedules',
                    'Consider adding quality non-conference games for teams with weak schedules',
                    'Balance home/away distribution more evenly'
                ]
            })
        
        # Fan engagement recommendations
        engagement_analysis = insights.get('fan_engagement', {})
        if engagement_analysis.get('average_engagement_score', 0) < 0.6:
            recommendations.append({
                'type': 'fan_engagement',
                'priority': 'medium',
                'title': 'Fan Engagement Enhancement',
                'description': f"Average engagement score: {engagement_analysis.get('average_engagement_score', 0):.2f}. "
                              "Focus on creating more compelling matchups.",
                'actions': [
                    'Schedule more rivalry games during peak viewing times',
                    'Create themed game weeks (e.g., Rivalry Week)',
                    'Consider doubleheaders for high-engagement matchups'
                ]
            })
        
        return recommendations

# Factory function for creating enhanced COMPASS instances
def create_enhanced_compass(config: Dict[str, Any] = None) -> EnhancedCOMPASSCore:
    """Create an enhanced COMPASS core instance.
    
    Args:
        config: Configuration settings
        
    Returns:
        Enhanced COMPASS core instance
    """
    return EnhancedCOMPASSCore(config)