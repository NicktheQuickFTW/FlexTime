"""
Big 12 Conference Specific Predictive Analytics
Advanced AI models for attendance, revenue, and fan engagement prediction.

This module provides:
- Attendance prediction models with venue-specific factors
- Revenue optimization algorithms
- Fan engagement forecasting
- TV viewership prediction
- Regional travel optimization
- Academic calendar integration modeling
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import json
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Configure logging
logger = logging.getLogger('big12_predictive_analytics')

@dataclass
class Big12TeamProfile:
    """Profile for a Big 12 team with historical data."""
    team_name: str
    conference_tenure: int  # Years in Big 12
    avg_attendance: float
    venue_capacity: int
    home_advantage_factor: float
    fan_loyalty_score: float
    tv_draw_rating: float
    recruiting_rank: float
    academic_profile: Dict[str, Any]
    regional_influence: float
    rivalry_intensity: Dict[str, float]

@dataclass
class GameContext:
    """Context information for a specific game."""
    home_team: str
    away_team: str
    date: datetime
    time_slot: str  # 'morning', 'afternoon', 'prime', 'late'
    day_of_week: str
    venue: str
    tv_network: Optional[str]
    is_conference_game: bool
    is_rivalry_game: bool
    weather_forecast: Dict[str, Any]
    academic_calendar_status: str  # 'classes', 'finals', 'break', 'summer'
    special_events: List[str]  # ['homecoming', 'senior_night', 'rivalry_week']

@dataclass
class PredictionResult:
    """Result of a prediction with confidence intervals."""
    predicted_value: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    confidence_score: float
    contributing_factors: Dict[str, float]
    explanation: str

class Big12VenueAnalyzer:
    """Analyzer for Big 12 venue characteristics."""
    
    def __init__(self):
        """Initialize the venue analyzer."""
        self.venue_profiles = self._load_venue_profiles()
        self.historical_data = {}
    
    def _load_venue_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Load detailed venue profiles for Big 12 schools."""
        return {
            # Basketball Venues
            'Allen Fieldhouse': {
                'sport': 'Basketball',
                'capacity': 16300,
                'opening_year': 1955,
                'home_advantage_factor': 0.89,  # Historical win percentage at home
                'atmosphere_rating': 0.95,
                'tv_camera_quality': 0.90,
                'accessibility': 0.80,
                'parking_capacity': 3500,
                'concession_revenue_per_fan': 18.50,
                'avg_ticket_price': 85,
                'premium_seating_ratio': 0.15,
                'location_desirability': 0.75,
                'weather_impact_factor': 0.1  # Indoor venue
            },
            'Hilton Coliseum': {
                'sport': 'Basketball',
                'capacity': 14384,
                'opening_year': 1971,
                'home_advantage_factor': 0.82,
                'atmosphere_rating': 0.88,
                'tv_camera_quality': 0.85,
                'accessibility': 0.85,
                'parking_capacity': 2800,
                'concession_revenue_per_fan': 16.75,
                'avg_ticket_price': 65,
                'premium_seating_ratio': 0.12,
                'location_desirability': 0.70,
                'weather_impact_factor': 0.1
            },
            'Bramlage Coliseum': {
                'sport': 'Basketball',
                'capacity': 12528,
                'opening_year': 1988,
                'home_advantage_factor': 0.78,
                'atmosphere_rating': 0.80,
                'tv_camera_quality': 0.82,
                'accessibility': 0.88,
                'parking_capacity': 2200,
                'concession_revenue_per_fan': 15.25,
                'avg_ticket_price': 55,
                'premium_seating_ratio': 0.10,
                'location_desirability': 0.65,
                'weather_impact_factor': 0.1
            },
            'Moody Center': {
                'sport': 'Basketball',
                'capacity': 15000,
                'opening_year': 2022,
                'home_advantage_factor': 0.75,  # New venue, building tradition
                'atmosphere_rating': 0.85,
                'tv_camera_quality': 0.95,
                'accessibility': 0.95,
                'parking_capacity': 4000,
                'concession_revenue_per_fan': 22.00,
                'avg_ticket_price': 95,
                'premium_seating_ratio': 0.25,
                'location_desirability': 0.90,
                'weather_impact_factor': 0.1
            },
            # Football Venues
            'Memorial Stadium': {
                'sport': 'Football',
                'capacity': 50071,
                'opening_year': 1921,
                'home_advantage_factor': 0.72,
                'atmosphere_rating': 0.78,
                'tv_camera_quality': 0.85,
                'accessibility': 0.75,
                'parking_capacity': 8000,
                'concession_revenue_per_fan': 25.00,
                'avg_ticket_price': 75,
                'premium_seating_ratio': 0.18,
                'location_desirability': 0.70,
                'weather_impact_factor': 0.6  # Outdoor venue
            },
            'Jack Trice Stadium': {
                'sport': 'Football',
                'capacity': 61500,
                'opening_year': 1975,
                'home_advantage_factor': 0.76,
                'atmosphere_rating': 0.82,
                'tv_camera_quality': 0.88,
                'accessibility': 0.80,
                'parking_capacity': 12000,
                'concession_revenue_per_fan': 28.50,
                'avg_ticket_price': 80,
                'premium_seating_ratio': 0.20,
                'location_desirability': 0.75,
                'weather_impact_factor': 0.6
            },
            'Bill Snyder Family Stadium': {
                'sport': 'Football',
                'capacity': 50000,
                'opening_year': 1968,
                'home_advantage_factor': 0.79,
                'atmosphere_rating': 0.85,
                'tv_camera_quality': 0.82,
                'accessibility': 0.82,
                'parking_capacity': 9500,
                'concession_revenue_per_fan': 24.75,
                'avg_ticket_price': 70,
                'premium_seating_ratio': 0.15,
                'location_desirability': 0.72,
                'weather_impact_factor': 0.6
            },
            'Jones AT&T Stadium': {
                'sport': 'Football',
                'capacity': 60454,
                'opening_year': 1947,
                'home_advantage_factor': 0.74,
                'atmosphere_rating': 0.80,
                'tv_camera_quality': 0.85,
                'accessibility': 0.78,
                'parking_capacity': 11000,
                'concession_revenue_per_fan': 26.25,
                'avg_ticket_price': 72,
                'premium_seating_ratio': 0.17,
                'location_desirability': 0.68,
                'weather_impact_factor': 0.6
            }
        }
    
    def get_venue_impact_factors(self, venue: str, game_context: GameContext) -> Dict[str, float]:
        """Get venue-specific impact factors for predictions.
        
        Args:
            venue: Venue name
            game_context: Game context information
            
        Returns:
            Dictionary of impact factors
        """
        if venue not in self.venue_profiles:
            # Return default factors for unknown venues
            return {
                'capacity_factor': 1.0,
                'atmosphere_factor': 1.0,
                'revenue_factor': 1.0,
                'weather_factor': 1.0,
                'accessibility_factor': 1.0
            }
        
        profile = self.venue_profiles[venue]
        
        # Calculate capacity factor (normalized to 0-1 scale)
        max_capacity = 65000 if profile['sport'] == 'Football' else 18000
        capacity_factor = profile['capacity'] / max_capacity
        
        # Atmosphere factor based on venue atmosphere and game importance
        atmosphere_base = profile['atmosphere_rating']
        rivalry_bonus = 0.1 if game_context.is_rivalry_game else 0.0
        special_events_bonus = len(game_context.special_events) * 0.05
        atmosphere_factor = min(1.0, atmosphere_base + rivalry_bonus + special_events_bonus)
        
        # Revenue factor
        revenue_factor = (
            profile['concession_revenue_per_fan'] / 30.0 +  # Normalized to $30 max
            profile['avg_ticket_price'] / 100.0 +  # Normalized to $100 max
            profile['premium_seating_ratio']
        ) / 3.0
        
        # Weather factor
        weather_factor = 1.0
        if profile['sport'] == 'Football' and 'weather_forecast' in game_context.weather_forecast:
            weather_conditions = game_context.weather_forecast.get('condition', 'clear')
            temperature = game_context.weather_forecast.get('temperature', 70)
            
            # Temperature impact (ideal range 50-80°F)
            if temperature < 30 or temperature > 95:
                weather_factor *= 0.7
            elif temperature < 45 or temperature > 85:
                weather_factor *= 0.9
            
            # Precipitation impact
            if 'rain' in weather_conditions.lower() or 'storm' in weather_conditions.lower():
                weather_factor *= 0.8
            elif 'snow' in weather_conditions.lower():
                weather_factor *= 0.7
        
        return {
            'capacity_factor': capacity_factor,
            'atmosphere_factor': atmosphere_factor,
            'revenue_factor': revenue_factor,
            'weather_factor': weather_factor,
            'accessibility_factor': profile['accessibility']
        }

class Big12AttendancePredictorV2:
    """Advanced attendance predictor for Big 12 Conference games."""
    
    def __init__(self):
        """Initialize the attendance predictor."""
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.venue_analyzer = Big12VenueAnalyzer()
        self.team_profiles = self._load_team_profiles()
        self.is_trained = False
        
    def _load_team_profiles(self) -> Dict[str, Big12TeamProfile]:
        """Load comprehensive team profiles."""
        return {
            'Kansas': Big12TeamProfile(
                team_name='Kansas',
                conference_tenure=28,
                avg_attendance=15500,
                venue_capacity=16300,
                home_advantage_factor=0.89,
                fan_loyalty_score=0.92,
                tv_draw_rating=0.85,
                recruiting_rank=0.75,
                academic_profile={'ranking': 130, 'enrollment': 28000},
                regional_influence=0.80,
                rivalry_intensity={'Kansas State': 0.95, 'Missouri': 0.85}
            ),
            'Kansas State': Big12TeamProfile(
                team_name='Kansas State',
                conference_tenure=28,
                avg_attendance=11800,
                venue_capacity=12528,
                home_advantage_factor=0.78,
                fan_loyalty_score=0.88,
                tv_draw_rating=0.70,
                recruiting_rank=0.65,
                academic_profile={'ranking': 170, 'enrollment': 24000},
                regional_influence=0.75,
                rivalry_intensity={'Kansas': 0.95, 'Iowa State': 0.80}
            ),
            'Iowa State': Big12TeamProfile(
                team_name='Iowa State',
                conference_tenure=28,
                avg_attendance=13200,
                venue_capacity=14384,
                home_advantage_factor=0.82,
                fan_loyalty_score=0.85,
                tv_draw_rating=0.72,
                recruiting_rank=0.68,
                academic_profile={'ranking': 118, 'enrollment': 31000},
                regional_influence=0.78,
                rivalry_intensity={'Kansas State': 0.80, 'Oklahoma State': 0.65}
            ),
            'Texas': Big12TeamProfile(
                team_name='Texas',
                conference_tenure=28,
                avg_attendance=14200,
                venue_capacity=15000,
                home_advantage_factor=0.75,
                fan_loyalty_score=0.82,
                tv_draw_rating=0.90,
                recruiting_rank=0.85,
                academic_profile={'ranking': 38, 'enrollment': 51000},
                regional_influence=0.95,
                rivalry_intensity={'Oklahoma': 0.85, 'Texas Tech': 0.80}
            ),
            'Baylor': Big12TeamProfile(
                team_name='Baylor',
                conference_tenure=28,
                avg_attendance=9800,
                venue_capacity=10284,
                home_advantage_factor=0.76,
                fan_loyalty_score=0.80,
                tv_draw_rating=0.75,
                recruiting_rank=0.78,
                academic_profile={'ranking': 76, 'enrollment': 20000},
                regional_influence=0.70,
                rivalry_intensity={'TCU': 0.85, 'Texas': 0.75}
            ),
            # Add more teams as needed...
        }
    
    def prepare_features(self, game_contexts: List[GameContext]) -> Tuple[np.ndarray, List[str]]:
        """Prepare feature matrix for training or prediction.
        
        Args:
            game_contexts: List of game contexts
            
        Returns:
            Tuple of feature matrix and feature names
        """
        features = []
        feature_names = [
            'home_team_avg_attendance', 'away_team_avg_attendance',
            'venue_capacity', 'home_advantage_factor', 'home_fan_loyalty',
            'away_fan_loyalty', 'home_tv_draw', 'away_tv_draw',
            'rivalry_intensity', 'is_conference_game', 'is_weekend',
            'is_prime_time', 'atmosphere_factor', 'weather_factor',
            'academic_calendar_factor', 'special_events_count',
            'home_team_ranking', 'away_team_ranking', 'venue_accessibility',
            'month', 'day_of_week_encoded', 'time_slot_encoded'
        ]
        
        for context in game_contexts:
            feature_row = []
            
            # Team-specific features
            home_profile = self.team_profiles.get(context.home_team, self._default_team_profile())
            away_profile = self.team_profiles.get(context.away_team, self._default_team_profile())
            
            feature_row.extend([
                home_profile.avg_attendance,
                away_profile.avg_attendance,
                home_profile.venue_capacity,
                home_profile.home_advantage_factor,
                home_profile.fan_loyalty_score,
                away_profile.fan_loyalty_score,
                home_profile.tv_draw_rating,
                away_profile.tv_draw_rating
            ])
            
            # Rivalry and game type features
            rivalry_intensity = home_profile.rivalry_intensity.get(context.away_team, 0.5)
            feature_row.extend([
                rivalry_intensity,
                1.0 if context.is_conference_game else 0.0,
                1.0 if context.day_of_week in ['Saturday', 'Sunday'] else 0.0,
                1.0 if context.time_slot == 'prime' else 0.0
            ])
            
            # Venue impact factors
            venue_factors = self.venue_analyzer.get_venue_impact_factors(context.venue, context)
            feature_row.extend([
                venue_factors['atmosphere_factor'],
                venue_factors['weather_factor']
            ])
            
            # Academic calendar impact
            calendar_factor = self._get_academic_calendar_factor(context.academic_calendar_status)
            special_events_count = len(context.special_events)
            feature_row.extend([calendar_factor, special_events_count])
            
            # Team performance (mock rankings - would come from real data)
            home_ranking = 50  # Default ranking
            away_ranking = 50  # Default ranking
            feature_row.extend([
                (100 - home_ranking) / 100,  # Normalized ranking
                (100 - away_ranking) / 100
            ])
            
            # Venue accessibility
            feature_row.append(venue_factors['accessibility_factor'])
            
            # Time-based features
            feature_row.extend([
                context.date.month,
                self._encode_day_of_week(context.day_of_week),
                self._encode_time_slot(context.time_slot)
            ])
            
            features.append(feature_row)
        
        return np.array(features), feature_names
    
    def _default_team_profile(self) -> Big12TeamProfile:
        """Return default team profile for unknown teams."""
        return Big12TeamProfile(
            team_name='Unknown',
            conference_tenure=10,
            avg_attendance=12000,
            venue_capacity=15000,
            home_advantage_factor=0.75,
            fan_loyalty_score=0.75,
            tv_draw_rating=0.70,
            recruiting_rank=0.65,
            academic_profile={'ranking': 150, 'enrollment': 25000},
            regional_influence=0.70,
            rivalry_intensity={}
        )
    
    def _get_academic_calendar_factor(self, status: str) -> float:
        """Get impact factor based on academic calendar."""
        factors = {
            'classes': 1.0,
            'finals': 0.8,
            'break': 0.6,
            'summer': 0.4
        }
        return factors.get(status, 1.0)
    
    def _encode_day_of_week(self, day: str) -> float:
        """Encode day of week to numerical value."""
        days = {
            'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
            'Friday': 5, 'Saturday': 6, 'Sunday': 7
        }
        return days.get(day, 6) / 7.0
    
    def _encode_time_slot(self, time_slot: str) -> float:
        """Encode time slot to numerical value."""
        slots = {'morning': 0.25, 'afternoon': 0.5, 'prime': 1.0, 'late': 0.75}
        return slots.get(time_slot, 0.5)
    
    async def train(self, training_contexts: List[GameContext], 
                   actual_attendances: List[float]) -> Dict[str, Any]:
        """Train the attendance prediction model.
        
        Args:
            training_contexts: List of game contexts for training
            actual_attendances: Actual attendance figures
            
        Returns:
            Training results
        """
        # Prepare features
        X, feature_names = self.prepare_features(training_contexts)
        y = np.array(actual_attendances)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Create ensemble model
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=8,
            random_state=42
        )
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.is_trained = True
        
        logger.info(f"Attendance model trained with R² = {r2:.4f}, MSE = {mse:.0f}")
        
        return {
            'success': True,
            'r2_score': r2,
            'mse': mse,
            'rmse': np.sqrt(mse),
            'feature_importance': dict(zip(feature_names, self.model.feature_importances_))
        }
    
    async def predict(self, game_context: GameContext) -> PredictionResult:
        """Predict attendance for a game.
        
        Args:
            game_context: Game context information
            
        Returns:
            Prediction result with confidence intervals
        """
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        # Prepare features
        X, feature_names = self.prepare_features([game_context])
        X_scaled = self.scaler.transform(X)
        
        # Make prediction
        prediction = self.model.predict(X_scaled)[0]
        
        # Calculate confidence interval using model uncertainty
        # This is a simplified approach - in production, you'd use more sophisticated methods
        feature_importance = self.model.feature_importances_
        prediction_uncertainty = np.std(X_scaled[0] * feature_importance) * 100
        
        confidence_interval_lower = max(0, prediction - prediction_uncertainty)
        confidence_interval_upper = prediction + prediction_uncertainty
        
        # Calculate confidence score
        venue_capacity = self.team_profiles.get(
            game_context.home_team, self._default_team_profile()
        ).venue_capacity
        
        confidence_score = min(1.0, max(0.0, 1.0 - (prediction_uncertainty / venue_capacity)))
        
        # Get contributing factors
        contributing_factors = dict(zip(feature_names, X_scaled[0] * feature_importance))
        
        # Generate explanation
        explanation = self._generate_explanation(game_context, contributing_factors)
        
        return PredictionResult(
            predicted_value=prediction,
            confidence_interval_lower=confidence_interval_lower,
            confidence_interval_upper=confidence_interval_upper,
            confidence_score=confidence_score,
            contributing_factors=contributing_factors,
            explanation=explanation
        )
    
    def _generate_explanation(self, context: GameContext, 
                            factors: Dict[str, float]) -> str:
        """Generate human-readable explanation for the prediction."""
        explanations = []
        
        # Top contributing factors
        sorted_factors = sorted(factors.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        
        for factor_name, factor_value in sorted_factors:
            if 'rivalry' in factor_name and factor_value > 0.1:
                explanations.append("Strong rivalry matchup increases interest")
            elif 'weekend' in factor_name and factor_value > 0:
                explanations.append("Weekend game timing favorable for attendance")
            elif 'prime_time' in factor_name and factor_value > 0:
                explanations.append("Prime time slot attracts larger audience")
            elif 'fan_loyalty' in factor_name and factor_value > 0.1:
                explanations.append("High fan loyalty expected to drive attendance")
        
        # Game-specific factors
        if context.is_rivalry_game:
            explanations.append("Rivalry game expected to draw additional fans")
        
        if context.special_events:
            explanations.append(f"Special events ({', '.join(context.special_events)}) boost attendance")
        
        if not explanations:
            explanations.append("Prediction based on historical attendance patterns")
        
        return "; ".join(explanations[:3])  # Limit to top 3 explanations

class Big12RevenuePredictorV2:
    """Advanced revenue predictor for Big 12 Conference games."""
    
    def __init__(self, attendance_predictor: Big12AttendancePredictorV2):
        """Initialize the revenue predictor.
        
        Args:
            attendance_predictor: Trained attendance predictor
        """
        self.attendance_predictor = attendance_predictor
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_features(self, game_contexts: List[GameContext], 
                        predicted_attendances: List[float]) -> Tuple[np.ndarray, List[str]]:
        """Prepare feature matrix for revenue prediction.
        
        Args:
            game_contexts: List of game contexts
            predicted_attendances: Predicted attendance values
            
        Returns:
            Tuple of feature matrix and feature names
        """
        features = []
        feature_names = [
            'predicted_attendance', 'venue_capacity_utilization',
            'avg_ticket_price', 'premium_seating_ratio',
            'concession_revenue_per_fan', 'is_tv_game',
            'tv_network_tier', 'rivalry_multiplier',
            'special_events_revenue_boost', 'parking_revenue',
            'merchandise_multiplier', 'sponsorship_revenue',
            'weather_impact_on_concessions', 'game_duration_estimate'
        ]
        
        for i, context in enumerate(game_contexts):
            feature_row = []
            
            # Base attendance and capacity utilization
            attendance = predicted_attendances[i]
            home_profile = self.attendance_predictor.team_profiles.get(
                context.home_team, self.attendance_predictor._default_team_profile()
            )
            
            capacity_utilization = attendance / home_profile.venue_capacity
            feature_row.extend([attendance, capacity_utilization])
            
            # Venue revenue factors
            venue_factors = self.attendance_predictor.venue_analyzer.get_venue_impact_factors(
                context.venue, context
            )
            venue_profile = self.attendance_predictor.venue_analyzer.venue_profiles.get(
                context.venue, {}
            )
            
            avg_ticket_price = venue_profile.get('avg_ticket_price', 75)
            premium_ratio = venue_profile.get('premium_seating_ratio', 0.15)
            concession_per_fan = venue_profile.get('concession_revenue_per_fan', 20)
            
            feature_row.extend([avg_ticket_price, premium_ratio, concession_per_fan])
            
            # TV and broadcast revenue
            is_tv_game = 1.0 if context.tv_network else 0.0
            tv_tier = self._get_tv_network_tier(context.tv_network)
            
            feature_row.extend([is_tv_game, tv_tier])
            
            # Rivalry and special event multipliers
            rivalry_multiplier = 1.0 + (home_profile.rivalry_intensity.get(context.away_team, 0.5) * 0.3)
            special_events_boost = len(context.special_events) * 0.1
            
            feature_row.extend([rivalry_multiplier, special_events_boost])
            
            # Additional revenue streams
            parking_revenue = attendance * 15  # Estimated $15 per car, assuming 2.5 people per car
            merchandise_multiplier = 1.0 + (rivalry_multiplier - 1.0) * 0.5  # Rivalry games boost merch
            sponsorship_revenue = venue_profile.get('sponsorship_revenue', 25000)  # Base sponsorship
            
            feature_row.extend([parking_revenue, merchandise_multiplier, sponsorship_revenue])
            
            # Weather and game duration impacts
            weather_impact = venue_factors['weather_factor']
            game_duration = self._estimate_game_duration(context)
            
            feature_row.extend([weather_impact, game_duration])
            
            features.append(feature_row)
        
        return np.array(features), feature_names
    
    def _get_tv_network_tier(self, network: Optional[str]) -> float:
        """Get TV network tier value."""
        if not network:
            return 0.0
        
        network = network.upper()
        tiers = {
            'ESPN': 1.0,
            'ABC': 1.0,
            'FOX': 0.9,
            'CBS': 0.9,
            'ESPN2': 0.7,
            'FS1': 0.7,
            'BIG 12 NOW': 0.5,
            'ESPN+': 0.4
        }
        
        return tiers.get(network, 0.6)
    
    def _estimate_game_duration(self, context: GameContext) -> float:
        """Estimate game duration in hours."""
        # Basketball: ~2.5 hours including pre-game
        # Football: ~3.5 hours including pre-game
        venue_profile = self.attendance_predictor.venue_analyzer.venue_profiles.get(
            context.venue, {}
        )
        
        sport = venue_profile.get('sport', 'Basketball')
        
        if sport == 'Football':
            base_duration = 3.5
        else:
            base_duration = 2.5
        
        # TV games tend to be longer due to commercial breaks
        if context.tv_network:
            base_duration *= 1.15
        
        return base_duration
    
    async def train(self, training_contexts: List[GameContext],
                   actual_revenues: List[float]) -> Dict[str, Any]:
        """Train the revenue prediction model.
        
        Args:
            training_contexts: List of game contexts for training
            actual_revenues: Actual revenue figures
            
        Returns:
            Training results
        """
        # Get attendance predictions for training data
        attendance_predictions = []
        for context in training_contexts:
            attendance_pred = await self.attendance_predictor.predict(context)
            attendance_predictions.append(attendance_pred.predicted_value)
        
        # Prepare features
        X, feature_names = self.prepare_features(training_contexts, attendance_predictions)
        y = np.array(actual_revenues)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Create model
        self.model = RandomForestRegressor(
            n_estimators=150,
            max_depth=12,
            random_state=42,
            n_jobs=-1
        )
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.is_trained = True
        
        logger.info(f"Revenue model trained with R² = {r2:.4f}, MSE = ${mse:.0f}")
        
        return {
            'success': True,
            'r2_score': r2,
            'mse': mse,
            'rmse': np.sqrt(mse),
            'feature_importance': dict(zip(feature_names, self.model.feature_importances_))
        }
    
    async def predict(self, game_context: GameContext) -> PredictionResult:
        """Predict revenue for a game.
        
        Args:
            game_context: Game context information
            
        Returns:
            Revenue prediction result
        """
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        # Get attendance prediction first
        attendance_pred = await self.attendance_predictor.predict(game_context)
        
        # Prepare features
        X, feature_names = self.prepare_features([game_context], [attendance_pred.predicted_value])
        X_scaled = self.scaler.transform(X)
        
        # Make prediction
        prediction = self.model.predict(X_scaled)[0]
        
        # Calculate confidence based on attendance prediction confidence
        attendance_confidence = attendance_pred.confidence_score
        revenue_uncertainty = prediction * (1.0 - attendance_confidence) * 0.2
        
        confidence_interval_lower = max(0, prediction - revenue_uncertainty)
        confidence_interval_upper = prediction + revenue_uncertainty
        
        # Get contributing factors
        contributing_factors = dict(zip(feature_names, X_scaled[0] * self.model.feature_importances_))
        
        # Generate explanation
        explanation = self._generate_revenue_explanation(game_context, contributing_factors)
        
        return PredictionResult(
            predicted_value=prediction,
            confidence_interval_lower=confidence_interval_lower,
            confidence_interval_upper=confidence_interval_upper,
            confidence_score=attendance_confidence * 0.9,  # Slightly lower than attendance confidence
            contributing_factors=contributing_factors,
            explanation=explanation
        )
    
    def _generate_revenue_explanation(self, context: GameContext, 
                                    factors: Dict[str, float]) -> str:
        """Generate explanation for revenue prediction."""
        explanations = []
        
        # Revenue drivers
        if factors.get('predicted_attendance', 0) > 0.2:
            explanations.append("High predicted attendance drives ticket revenue")
        
        if factors.get('premium_seating_ratio', 0) > 0.1:
            explanations.append("Premium seating contributes significantly to revenue")
        
        if factors.get('tv_network_tier', 0) > 0.1:
            explanations.append("TV broadcast provides additional revenue stream")
        
        if factors.get('rivalry_multiplier', 0) > 0.1:
            explanations.append("Rivalry game increases concession and merchandise sales")
        
        if context.special_events:
            explanations.append("Special events boost overall revenue potential")
        
        if not explanations:
            explanations.append("Revenue based on standard game operations")
        
        return "; ".join(explanations[:3])

class Big12FanEngagementPredictor:
    """Predictor for fan engagement metrics."""
    
    def __init__(self):
        """Initialize the fan engagement predictor."""
        self.social_media_multipliers = self._load_social_media_data()
        self.engagement_history = {}
    
    def _load_social_media_data(self) -> Dict[str, float]:
        """Load social media following and engagement data."""
        return {
            'Kansas': 0.92,  # High social media engagement
            'Texas': 0.95,
            'Baylor': 0.88,
            'Iowa State': 0.85,
            'Kansas State': 0.82,
            # Add more teams...
        }
    
    async def predict_engagement(self, game_context: GameContext) -> Dict[str, Any]:
        """Predict fan engagement metrics for a game.
        
        Args:
            game_context: Game context information
            
        Returns:
            Engagement prediction metrics
        """
        home_engagement = self.social_media_multipliers.get(game_context.home_team, 0.75)
        away_engagement = self.social_media_multipliers.get(game_context.away_team, 0.75)
        
        # Base engagement score
        base_engagement = (home_engagement + away_engagement) / 2
        
        # Rivalry boost
        rivalry_boost = 0.2 if game_context.is_rivalry_game else 0.0
        
        # TV visibility boost
        tv_boost = 0.15 if game_context.tv_network else 0.0
        
        # Weekend boost
        weekend_boost = 0.1 if game_context.day_of_week in ['Saturday', 'Sunday'] else 0.0
        
        # Special events boost
        special_boost = len(game_context.special_events) * 0.05
        
        total_engagement = min(1.0, base_engagement + rivalry_boost + tv_boost + weekend_boost + special_boost)
        
        return {
            'overall_engagement_score': total_engagement,
            'social_media_mentions_estimate': int(total_engagement * 10000),
            'hashtag_usage_estimate': int(total_engagement * 5000),
            'fan_sentiment_score': 0.7 + (total_engagement * 0.3),
            'contributing_factors': {
                'base_team_engagement': base_engagement,
                'rivalry_factor': rivalry_boost,
                'tv_visibility': tv_boost,
                'timing_factor': weekend_boost,
                'special_events': special_boost
            }
        }

# Factory function for creating the complete Big 12 analytics suite
def create_big12_analytics_suite() -> Dict[str, Any]:
    """Create a complete Big 12 predictive analytics suite.
    
    Returns:
        Dictionary containing all predictive models
    """
    # Initialize predictors
    attendance_predictor = Big12AttendancePredictorV2()
    revenue_predictor = Big12RevenuePredictorV2(attendance_predictor)
    engagement_predictor = Big12FanEngagementPredictor()
    
    return {
        'attendance_predictor': attendance_predictor,
        'revenue_predictor': revenue_predictor,
        'engagement_predictor': engagement_predictor,
        'venue_analyzer': Big12VenueAnalyzer()
    }

# Example usage
async def example_usage():
    """Example of how to use the Big 12 predictive analytics."""
    # Create analytics suite
    analytics = create_big12_analytics_suite()
    
    # Example game context
    game_context = GameContext(
        home_team='Kansas',
        away_team='Kansas State',
        date=datetime(2024, 2, 24, 18, 0),  # Saturday evening
        time_slot='prime',
        day_of_week='Saturday',
        venue='Allen Fieldhouse',
        tv_network='ESPN',
        is_conference_game=True,
        is_rivalry_game=True,
        weather_forecast={'condition': 'clear', 'temperature': 45},
        academic_calendar_status='classes',
        special_events=['rivalry_week', 'senior_night']
    )
    
    # Note: In real usage, you would train the models first with historical data
    # For this example, we'll simulate trained models
    
    print("Big 12 Predictive Analytics Example")
    print("===================================")
    print(f"Game: {game_context.home_team} vs {game_context.away_team}")
    print(f"Venue: {game_context.venue}")
    print(f"Date: {game_context.date.strftime('%Y-%m-%d %H:%M')}")
    print(f"TV: {game_context.tv_network}")
    print(f"Special Events: {', '.join(game_context.special_events)}")
    print()
    
    # Venue analysis
    venue_factors = analytics['venue_analyzer'].get_venue_impact_factors(
        game_context.venue, game_context
    )
    print("Venue Impact Factors:")
    for factor, value in venue_factors.items():
        print(f"  {factor}: {value:.3f}")
    print()
    
    # Fan engagement prediction (doesn't require training)
    engagement_result = await analytics['engagement_predictor'].predict_engagement(game_context)
    print("Fan Engagement Prediction:")
    print(f"  Overall Score: {engagement_result['overall_engagement_score']:.3f}")
    print(f"  Social Media Mentions: {engagement_result['social_media_mentions_estimate']:,}")
    print(f"  Fan Sentiment: {engagement_result['fan_sentiment_score']:.3f}")
    print()
    
    print("Note: Attendance and revenue predictions require trained models with historical data.")

if __name__ == "__main__":
    asyncio.run(example_usage())