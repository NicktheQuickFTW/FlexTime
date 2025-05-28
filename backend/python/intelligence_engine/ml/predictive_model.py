"""
Predictive Model for the HELiiX Intelligence Engine

This module provides predictive modeling capabilities for game outcomes,
team performance, and scheduling quality.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
import pickle
import os
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score

# Configure logging
logger = logging.getLogger('intelligence_engine.ml.predictive_model')

class PredictiveModel:
    """Base class for predictive models."""
    
    def __init__(self, model_name: str, model_type: str = 'regressor', config: Dict[str, Any] = None):
        """Initialize the predictive model.
        
        Args:
            model_name: Name of the model
            model_type: Type of model ('regressor' or 'classifier')
            config: Configuration options
        """
        self.model_name = model_name
        self.model_type = model_type
        self.config = config or {}
        self.model = None
        self.scaler = None
        self.feature_names = []
        self.model_info = {
            'name': model_name,
            'type': model_type,
            'version': '1.0.0',
            'created': datetime.now().isoformat(),
            'updated': datetime.now().isoformat(),
            'accuracy': None,
            'parameters': {},
            'features': []
        }
    
    def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str] = None) -> Dict[str, Any]:
        """Train the model on the given data.
        
        Args:
            X: Feature matrix
            y: Target values
            feature_names: Names of the features (optional)
            
        Returns:
            Training results
        """
        if X.shape[0] == 0 or y.shape[0] == 0:
            raise ValueError("Empty training data")
        
        if X.shape[0] != y.shape[0]:
            raise ValueError(f"Mismatch in sample count: X has {X.shape[0]} samples, y has {y.shape[0]} samples")
        
        # Store feature names if provided
        if feature_names:
            if len(feature_names) != X.shape[1]:
                raise ValueError(f"Mismatch in feature count: {len(feature_names)} names provided, but X has {X.shape[1]} features")
            self.feature_names = feature_names
            self.model_info['features'] = feature_names
        
        # Split data into train and test sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Create and train the model
        if self.model_type == 'regressor':
            self.model = self._create_regression_model()
        else:
            self.model = self._create_classification_model()
        
        # Fit the model
        self.model.fit(X_train, y_train)
        
        # Evaluate the model
        if self.model_type == 'regressor':
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            
            # Update model info
            self.model_info['accuracy'] = {
                'mse': mse,
                'rmse': rmse
            }
            
            logger.info(f"Trained {self.model_name} regressor with RMSE: {rmse:.4f}")
            
            return {
                'success': True,
                'model_type': self.model_type,
                'metrics': {
                    'mse': mse,
                    'rmse': rmse
                }
            }
        else:
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            # Update model info
            self.model_info['accuracy'] = {
                'accuracy': accuracy
            }
            
            logger.info(f"Trained {self.model_name} classifier with accuracy: {accuracy:.4f}")
            
            return {
                'success': True,
                'model_type': self.model_type,
                'metrics': {
                    'accuracy': accuracy
                }
            }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions with the model.
        
        Args:
            X: Feature matrix
            
        Returns:
            Predictions
        """
        if self.model is None:
            raise ValueError("Model not trained")
        
        if X.shape[1] != len(self.feature_names) and self.feature_names:
            raise ValueError(f"Input has {X.shape[1]} features, but model expects {len(self.feature_names)}")
        
        return self.model.predict(X)
    
    def save(self, directory: str) -> str:
        """Save the model to the specified directory.
        
        Args:
            directory: Directory to save the model to
            
        Returns:
            Path to the saved model
        """
        if self.model is None:
            raise ValueError("Model not trained")
        
        # Create directory if it doesn't exist
        os.makedirs(directory, exist_ok=True)
        
        # Create filename based on model name and version
        filename = f"{self.model_name}_{self.model_info['version']}.pkl"
        filepath = os.path.join(directory, filename)
        
        # Save the model
        with open(filepath, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'feature_names': self.feature_names,
                'model_info': self.model_info
            }, f)
        
        logger.info(f"Saved model to {filepath}")
        
        return filepath
    
    def load(self, filepath: str) -> bool:
        """Load a model from a file.
        
        Args:
            filepath: Path to the model file
            
        Returns:
            True if the model was loaded successfully, False otherwise
        """
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
                
                self.model = data['model']
                self.feature_names = data['feature_names']
                self.model_info = data['model_info']
            
            logger.info(f"Loaded model from {filepath}")
            
            return True
        except Exception as e:
            logger.exception(f"Error loading model from {filepath}: {str(e)}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the model.
        
        Returns:
            Model information
        """
        return self.model_info
    
    def _create_regression_model(self) -> Pipeline:
        """Create a regression model pipeline.
        
        Returns:
            Model pipeline
        """
        # Get model parameters from config
        n_estimators = self.config.get('n_estimators', 100)
        max_depth = self.config.get('max_depth', None)
        
        # Update model info
        self.model_info['parameters'] = {
            'n_estimators': n_estimators,
            'max_depth': max_depth
        }
        
        # Create model pipeline
        return Pipeline([
            ('scaler', StandardScaler()),
            ('model', RandomForestRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=42
            ))
        ])
    
    def _create_classification_model(self) -> Pipeline:
        """Create a classification model pipeline.
        
        Returns:
            Model pipeline
        """
        # Get model parameters from config
        n_estimators = self.config.get('n_estimators', 100)
        max_depth = self.config.get('max_depth', None)
        
        # Update model info
        self.model_info['parameters'] = {
            'n_estimators': n_estimators,
            'max_depth': max_depth
        }
        
        # Create model pipeline
        return Pipeline([
            ('scaler', StandardScaler()),
            ('model', RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=42
            ))
        ])


class GameOutcomePredictor(PredictiveModel):
    """Predictive model for game outcomes."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the game outcome predictor.
        
        Args:
            config: Configuration options
        """
        super().__init__('game_outcome', 'classifier', config)
    
    def prepare_features(self, games: List[Dict[str, Any]], team_stats: Dict[str, Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Prepare features for training or prediction.
        
        Args:
            games: List of games with outcomes
            team_stats: Dictionary of team statistics
            
        Returns:
            Tuple of (X, y, feature_names)
        """
        # Define feature names
        feature_names = [
            'home_team_rating',
            'away_team_rating',
            'home_team_win_streak',
            'away_team_win_streak',
            'home_team_rest_days',
            'away_team_rest_days',
            'is_rivalry'
        ]
        
        # Create feature matrix
        X = np.zeros((len(games), len(feature_names)))
        y = np.zeros(len(games))
        
        for i, game in enumerate(games):
            home_team = game.get('homeTeam')
            away_team = game.get('awayTeam')
            
            # Get team stats
            home_stats = team_stats.get(home_team, {})
            away_stats = team_stats.get(away_team, {})
            
            # Fill in features
            X[i, 0] = home_stats.get('rating', 0.5)
            X[i, 1] = away_stats.get('rating', 0.5)
            X[i, 2] = home_stats.get('win_streak', 0)
            X[i, 3] = away_stats.get('win_streak', 0)
            X[i, 4] = game.get('homeTeamRestDays', 3)
            X[i, 5] = game.get('awayTeamRestDays', 3)
            X[i, 6] = 1 if game.get('isRivalry', False) else 0
            
            # Set target (1 for home win, 0 for away win)
            if 'outcome' in game:
                y[i] = 1 if game['outcome'] == 'home_win' else 0
        
        return X, y, feature_names
    
    def predict_outcome(self, game: Dict[str, Any], team_stats: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Predict the outcome of a game.
        
        Args:
            game: Game information
            team_stats: Dictionary of team statistics
            
        Returns:
            Prediction result
        """
        if self.model is None:
            raise ValueError("Model not trained")
        
        # Prepare features for the game
        X, _, _ = self.prepare_features([game], team_stats)
        
        # Make prediction
        pred_proba = self.model.predict_proba(X)[0]
        
        home_team = game.get('homeTeam')
        away_team = game.get('awayTeam')
        
        return {
            'homeTeam': home_team,
            'awayTeam': away_team,
            'homeProbability': pred_proba[1],
            'awayProbability': pred_proba[0],
            'predictedOutcome': 'home_win' if pred_proba[1] > pred_proba[0] else 'away_win',
            'confidence': max(pred_proba)
        }


class ScheduleQualityPredictor(PredictiveModel):
    """Predictive model for schedule quality."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the schedule quality predictor.
        
        Args:
            config: Configuration options
        """
        super().__init__('schedule_quality', 'regressor', config)
    
    def prepare_features(self, schedules: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Prepare features for training or prediction.
        
        Args:
            schedules: List of schedules with quality ratings
            
        Returns:
            Tuple of (X, y, feature_names)
        """
        # Define feature names
        feature_names = [
            'total_games',
            'unique_teams',
            'avg_games_per_team',
            'travel_distance',
            'avg_rest_days',
            'min_rest_days',
            'home_away_imbalance',
            'max_consecutive_home',
            'max_consecutive_away'
        ]
        
        # Create feature matrix
        X = np.zeros((len(schedules), len(feature_names)))
        y = np.zeros(len(schedules))
        
        for i, schedule in enumerate(schedules):
            # Extract features from schedule
            metrics = schedule.get('metrics', {})
            
            # Team and game metrics
            X[i, 0] = schedule.get('gameCount', 0)
            X[i, 1] = len(schedule.get('teams', []))
            X[i, 2] = X[i, 0] / max(1, X[i, 1])  # Avg games per team
            
            # Travel and rest metrics
            X[i, 3] = metrics.get('travelDistance', 0)
            rest_days = metrics.get('restDays', {})
            X[i, 4] = rest_days.get('average', 3)
            X[i, 5] = rest_days.get('minimum', 1)
            
            # Balance metrics
            X[i, 6] = metrics.get('homeAwayImbalance', 0)
            X[i, 7] = metrics.get('maxConsecutiveHome', 0)
            X[i, 8] = metrics.get('maxConsecutiveAway', 0)
            
            # Quality rating (target variable)
            y[i] = metrics.get('quality', 0.5)
        
        return X, y, feature_names
    
    def predict_quality(self, schedule: Dict[str, Any]) -> float:
        """Predict the quality of a schedule.
        
        Args:
            schedule: Schedule information
            
        Returns:
            Predicted quality score (0.0 to 1.0)
        """
        if self.model is None:
            raise ValueError("Model not trained")
        
        # Prepare features for the schedule
        X, _, _ = self.prepare_features([schedule])
        
        # Make prediction (ensure it's in the range [0, 1])
        prediction = self.model.predict(X)[0]
        prediction = max(0.0, min(1.0, prediction))
        
        return prediction


class TeamPerformancePredictor(PredictiveModel):
    """Predictive model for team performance (COMPASS Index)."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the team performance predictor.
        
        Args:
            config: Configuration options
        """
        super().__init__('team_performance', 'regressor', config)
    
    def prepare_features(self, team_data: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Prepare features for training or prediction.
        
        Args:
            team_data: List of team data entries
            
        Returns:
            Tuple of (X, y, feature_names)
        """
        # Define feature names
        feature_names = [
            'win_percentage',
            'points_scored',
            'points_allowed',
            'turnover_margin',
            'strength_of_schedule',
            'home_record',
            'away_record',
            'conference_record',
            'non_conference_record',
            'top_25_wins'
        ]
        
        # Create feature matrix
        X = np.zeros((len(team_data), len(feature_names)))
        y = np.zeros(len(team_data))
        
        for i, team in enumerate(team_data):
            stats = team.get('stats', {})
            
            # Fill in features
            X[i, 0] = stats.get('winPercentage', 0.5)
            X[i, 1] = stats.get('pointsScored', 0)
            X[i, 2] = stats.get('pointsAllowed', 0)
            X[i, 3] = stats.get('turnoverMargin', 0)
            X[i, 4] = stats.get('strengthOfSchedule', 0.5)
            X[i, 5] = stats.get('homeRecord', {}).get('winPercentage', 0.5)
            X[i, 6] = stats.get('awayRecord', {}).get('winPercentage', 0.5)
            X[i, 7] = stats.get('conferenceRecord', {}).get('winPercentage', 0.5)
            X[i, 8] = stats.get('nonConferenceRecord', {}).get('winPercentage', 0.5)
            X[i, 9] = stats.get('top25Wins', 0)
            
            # Set target (COMPASS Index)
            y[i] = team.get('compassIndex', 0.5)
        
        return X, y, feature_names
    
    def predict_compass_index(self, team_data: Dict[str, Any]) -> float:
        """Predict the COMPASS Index for a team.
        
        Args:
            team_data: Team stats and information
            
        Returns:
            Predicted COMPASS Index (0.0 to 1.0)
        """
        if self.model is None:
            raise ValueError("Model not trained")
        
        # Prepare features for the team
        X, _, _ = self.prepare_features([team_data])
        
        # Make prediction (ensure it's in the range [0, 1])
        prediction = self.model.predict(X)[0]
        prediction = max(0.0, min(1.0, prediction))
        
        return prediction


# Factory function to create models
def create_model(model_type: str, config: Dict[str, Any] = None) -> PredictiveModel:
    """Create a predictive model of the specified type.
    
    Args:
        model_type: Type of model to create
        config: Configuration options
        
    Returns:
        A predictive model instance
    """
    if model_type == 'game_outcome':
        return GameOutcomePredictor(config)
    elif model_type == 'schedule_quality':
        return ScheduleQualityPredictor(config)
    elif model_type == 'team_performance':
        return TeamPerformancePredictor(config)
    else:
        raise ValueError(f"Unknown model type: {model_type}")