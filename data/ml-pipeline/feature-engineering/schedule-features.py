"""
Schedule Feature Engineering
Advanced feature extraction for sports scheduling ML models
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging
from sklearn.preprocessing import StandardScaler, LabelEncoder
from geopy.distance import geodesic


class ScheduleFeatureEngineer:
    """
    Feature engineering pipeline for sports scheduling optimization.
    Extracts meaningful features from raw scheduling data for ML models.
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_cache = {}
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def extract_all_features(self, 
                           schedule_data: pd.DataFrame,
                           team_data: pd.DataFrame,
                           venue_data: pd.DataFrame,
                           constraint_data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract comprehensive feature set from all data sources.
        
        Args:
            schedule_data: Historical schedule information
            team_data: Team characteristics and metadata
            venue_data: Venue information and capabilities
            constraint_data: Constraint definitions and violations
            
        Returns:
            DataFrame with engineered features
        """
        self.logger.info("Starting comprehensive feature extraction")
        
        # Initialize feature dataframe
        features_df = schedule_data.copy()
        
        # Extract different feature categories
        temporal_features = self.extract_temporal_features(schedule_data)
        team_features = self.extract_team_features(schedule_data, team_data)
        venue_features = self.extract_venue_features(schedule_data, venue_data)
        travel_features = self.extract_travel_features(schedule_data, venue_data)
        constraint_features = self.extract_constraint_features(schedule_data, constraint_data)
        performance_features = self.extract_performance_features(schedule_data)
        competition_features = self.extract_competition_features(schedule_data)
        
        # Combine all features
        feature_sets = [
            temporal_features,
            team_features,
            venue_features,
            travel_features,
            constraint_features,
            performance_features,
            competition_features
        ]
        
        for feature_set in feature_sets:
            features_df = pd.concat([features_df, feature_set], axis=1)
        
        # Clean and validate features
        features_df = self.clean_features(features_df)
        features_df = self.validate_features(features_df)
        
        self.logger.info(f"Feature extraction complete. Shape: {features_df.shape}")
        return features_df
    
    def extract_temporal_features(self, schedule_data: pd.DataFrame) -> pd.DataFrame:
        """Extract time-based features from schedule data."""
        self.logger.info("Extracting temporal features")
        
        # Ensure datetime column
        schedule_data['game_date'] = pd.to_datetime(schedule_data['game_date'])
        
        temporal_features = pd.DataFrame(index=schedule_data.index)
        
        # Basic temporal features
        temporal_features['year'] = schedule_data['game_date'].dt.year
        temporal_features['month'] = schedule_data['game_date'].dt.month
        temporal_features['day_of_week'] = schedule_data['game_date'].dt.dayofweek
        temporal_features['day_of_year'] = schedule_data['game_date'].dt.dayofyear
        temporal_features['week_of_year'] = schedule_data['game_date'].dt.isocalendar().week
        
        # Season features
        temporal_features['is_weekend'] = (temporal_features['day_of_week'] >= 5).astype(int)
        temporal_features['is_holiday'] = self._identify_holidays(schedule_data['game_date']).astype(int)
        temporal_features['academic_calendar'] = self._map_academic_calendar(schedule_data['game_date'])
        
        # Conference tournament timing
        temporal_features['days_to_tournament'] = self._calculate_tournament_proximity(
            schedule_data['game_date'], schedule_data['sport']
        )
        
        # Seasonal patterns
        temporal_features['season_progress'] = self._calculate_season_progress(
            schedule_data['game_date'], schedule_data['sport']
        )
        
        # Game timing features
        if 'game_time' in schedule_data.columns:
            schedule_data['game_time'] = pd.to_datetime(schedule_data['game_time'], format='%H:%M')
            temporal_features['hour_of_day'] = schedule_data['game_time'].dt.hour
            temporal_features['is_primetime'] = ((temporal_features['hour_of_day'] >= 19) & 
                                               (temporal_features['hour_of_day'] <= 22)).astype(int)
            temporal_features['is_matinee'] = (temporal_features['hour_of_day'] <= 15).astype(int)
        
        return temporal_features
    
    def extract_team_features(self, schedule_data: pd.DataFrame, team_data: pd.DataFrame) -> pd.DataFrame:
        """Extract team-specific features."""
        self.logger.info("Extracting team features")
        
        team_features = pd.DataFrame(index=schedule_data.index)
        
        # Merge team data for home and away teams
        home_team_data = schedule_data.merge(
            team_data.add_suffix('_home'), 
            left_on='home_team', right_on='team_id_home', how='left'
        )
        away_team_data = schedule_data.merge(
            team_data.add_suffix('_away'), 
            left_on='away_team', right_on='team_id_away', how='left'
        )
        
        # Team strength metrics
        team_features['home_team_ranking'] = home_team_data.get('ranking_home', 0)
        team_features['away_team_ranking'] = away_team_data.get('ranking_away', 0)
        team_features['ranking_difference'] = (team_features['home_team_ranking'] - 
                                             team_features['away_team_ranking'])
        
        # Geographic features
        team_features['home_team_timezone'] = self._encode_categorical(
            home_team_data.get('timezone_home', 'Unknown')
        )
        team_features['away_team_timezone'] = self._encode_categorical(
            away_team_data.get('timezone_away', 'Unknown')
        )
        team_features['timezone_difference'] = self._calculate_timezone_difference(
            home_team_data.get('timezone_home'), away_team_data.get('timezone_away')
        )
        
        # School characteristics
        team_features['home_enrollment'] = home_team_data.get('enrollment_home', 0)
        team_features['away_enrollment'] = away_team_data.get('enrollment_away', 0)
        team_features['enrollment_ratio'] = np.where(
            team_features['away_enrollment'] > 0,
            team_features['home_enrollment'] / team_features['away_enrollment'],
            1.0
        )
        
        # Conference membership
        team_features['same_division'] = (
            home_team_data.get('division_home', '') == away_team_data.get('division_away', '')
        ).astype(int)
        
        # Rivalry indicators
        team_features['is_rivalry'] = self._identify_rivalries(
            schedule_data['home_team'], schedule_data['away_team']
        ).astype(int)
        
        return team_features
    
    def extract_venue_features(self, schedule_data: pd.DataFrame, venue_data: pd.DataFrame) -> pd.DataFrame:
        """Extract venue-specific features."""
        self.logger.info("Extracting venue features")
        
        venue_features = pd.DataFrame(index=schedule_data.index)
        
        # Merge venue data
        venue_merged = schedule_data.merge(venue_data, on='venue_id', how='left')
        
        # Venue characteristics
        venue_features['venue_capacity'] = venue_merged.get('capacity', 0)
        venue_features['venue_age'] = (datetime.now().year - 
                                     venue_merged.get('year_built', datetime.now().year))
        venue_features['is_indoor'] = (venue_merged.get('venue_type', '') == 'indoor').astype(int)
        venue_features['has_dome'] = venue_merged.get('has_dome', False).astype(int)
        
        # Climate features
        venue_features['venue_elevation'] = venue_merged.get('elevation', 0)
        venue_features['climate_zone'] = self._encode_categorical(
            venue_merged.get('climate_zone', 'Unknown')
        )
        
        # Venue utilization
        venue_features['venue_utilization_rate'] = self._calculate_venue_utilization(
            schedule_data, 'venue_id'
        )
        
        # Home field advantage
        venue_features['home_field_advantage'] = self._calculate_home_advantage(
            schedule_data, venue_data
        )
        
        return venue_features
    
    def extract_travel_features(self, schedule_data: pd.DataFrame, venue_data: pd.DataFrame) -> pd.DataFrame:
        """Extract travel-related features."""
        self.logger.info("Extracting travel features")
        
        travel_features = pd.DataFrame(index=schedule_data.index)
        
        # Calculate travel distances
        distances = self._calculate_travel_distances(schedule_data, venue_data)
        travel_features['travel_distance'] = distances
        
        # Travel difficulty categories
        travel_features['travel_category'] = pd.cut(
            distances,
            bins=[0, 200, 500, 1000, float('inf')],
            labels=['local', 'regional', 'national', 'cross_country'],
            include_lowest=True
        )
        travel_features['travel_category'] = self._encode_categorical(travel_features['travel_category'])
        
        # Travel time estimates
        travel_features['estimated_travel_time'] = self._estimate_travel_time(distances)
        travel_features['requires_flight'] = (distances > 500).astype(int)
        travel_features['same_timezone'] = self._check_same_timezone(schedule_data, venue_data).astype(int)
        
        # Consecutive away games
        travel_features['consecutive_away_games'] = self._count_consecutive_away_games(schedule_data)
        
        # Travel cost estimates
        travel_features['estimated_travel_cost'] = self._estimate_travel_cost(
            distances, schedule_data.get('team_size', 25)
        )
        
        return travel_features
    
    def extract_constraint_features(self, schedule_data: pd.DataFrame, 
                                  constraint_data: pd.DataFrame) -> pd.DataFrame:
        """Extract constraint-related features."""
        self.logger.info("Extracting constraint features")
        
        constraint_features = pd.DataFrame(index=schedule_data.index)
        
        # Constraint complexity
        constraint_features['total_constraints'] = self._count_applicable_constraints(
            schedule_data, constraint_data
        )
        
        # Constraint types
        constraint_types = ['hard', 'soft', 'preference']
        for ctype in constraint_types:
            constraint_features[f'{ctype}_constraints'] = self._count_constraints_by_type(
                schedule_data, constraint_data, ctype
            )
        
        # Constraint conflict potential
        constraint_features['conflict_potential'] = self._calculate_conflict_potential(
            schedule_data, constraint_data
        )
        
        # Historical violation rates
        constraint_features['historical_violation_rate'] = self._get_historical_violation_rate(
            schedule_data, constraint_data
        )
        
        # Constraint satisfaction probability
        constraint_features['satisfaction_probability'] = self._predict_constraint_satisfaction(
            schedule_data, constraint_data
        )
        
        return constraint_features
    
    def extract_performance_features(self, schedule_data: pd.DataFrame) -> pd.DataFrame:
        """Extract performance-related features."""
        self.logger.info("Extracting performance features")
        
        performance_features = pd.DataFrame(index=schedule_data.index)
        
        # Historical schedule quality
        performance_features['avg_schedule_quality'] = self._calculate_historical_quality(
            schedule_data, window_days=365
        )
        
        # Fan engagement metrics
        performance_features['expected_attendance'] = self._predict_attendance(schedule_data)
        performance_features['tv_rating_potential'] = self._predict_tv_rating(schedule_data)
        
        # Revenue potential
        performance_features['revenue_potential'] = self._calculate_revenue_potential(schedule_data)
        
        # Competitive balance
        performance_features['competitive_balance'] = self._calculate_competitive_balance(schedule_data)
        
        return performance_features
    
    def extract_competition_features(self, schedule_data: pd.DataFrame) -> pd.DataFrame:
        """Extract competition and context features."""
        self.logger.info("Extracting competition features")
        
        competition_features = pd.DataFrame(index=schedule_data.index)
        
        # Conference vs non-conference
        competition_features['is_conference_game'] = self._identify_conference_games(
            schedule_data
        ).astype(int)
        
        # Tournament implications
        competition_features['tournament_implications'] = self._assess_tournament_implications(
            schedule_data
        )
        
        # Competing events
        competition_features['competing_events'] = self._count_competing_events(schedule_data)
        
        # Media attention
        competition_features['media_attention_score'] = self._calculate_media_attention(schedule_data)
        
        return competition_features
    
    def clean_features(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Clean and preprocess extracted features."""
        self.logger.info("Cleaning features")
        
        # Handle missing values
        numeric_columns = features_df.select_dtypes(include=[np.number]).columns
        categorical_columns = features_df.select_dtypes(include=['object', 'category']).columns
        
        # Fill numeric missing values
        features_df[numeric_columns] = features_df[numeric_columns].fillna(0)
        
        # Fill categorical missing values
        features_df[categorical_columns] = features_df[categorical_columns].fillna('Unknown')
        
        # Remove infinite values
        features_df = features_df.replace([np.inf, -np.inf], np.nan).fillna(0)
        
        # Remove duplicate columns
        features_df = features_df.loc[:, ~features_df.columns.duplicated()]
        
        return features_df
    
    def validate_features(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Validate feature quality and consistency."""
        self.logger.info("Validating features")
        
        # Check for constant features
        constant_features = []
        for col in features_df.columns:
            if features_df[col].nunique() <= 1:
                constant_features.append(col)
        
        if constant_features:
            self.logger.warning(f"Removing constant features: {constant_features}")
            features_df = features_df.drop(columns=constant_features)
        
        # Check for highly correlated features
        numeric_features = features_df.select_dtypes(include=[np.number])
        correlation_matrix = numeric_features.corr().abs()
        
        high_corr_pairs = []
        for i in range(len(correlation_matrix.columns)):
            for j in range(i + 1, len(correlation_matrix.columns)):
                if correlation_matrix.iloc[i, j] > 0.95:
                    col_i = correlation_matrix.columns[i]
                    col_j = correlation_matrix.columns[j]
                    high_corr_pairs.append((col_i, col_j))
        
        if high_corr_pairs:
            self.logger.warning(f"High correlation found: {high_corr_pairs}")
        
        return features_df
    
    # Helper methods
    def _identify_holidays(self, dates: pd.Series) -> pd.Series:
        """Identify holiday dates."""
        holidays = [
            '2024-01-01', '2024-07-04', '2024-11-28', '2024-12-25',
            '2025-01-01', '2025-07-04', '2025-11-27', '2025-12-25'
        ]
        holiday_dates = pd.to_datetime(holidays).date
        return dates.dt.date.isin(holiday_dates)
    
    def _map_academic_calendar(self, dates: pd.Series) -> pd.Series:
        """Map dates to academic calendar periods."""
        academic_periods = []
        for date in dates:
            month = date.month
            if month in [8, 9, 10, 11, 12]:
                academic_periods.append('fall')
            elif month in [1, 2, 3, 4, 5]:
                academic_periods.append('spring')
            else:
                academic_periods.append('summer')
        return pd.Series(academic_periods, index=dates.index)
    
    def _calculate_tournament_proximity(self, dates: pd.Series, sports: pd.Series) -> pd.Series:
        """Calculate days until conference tournament."""
        # Tournament dates by sport (example dates)
        tournament_dates = {
            'basketball': '2024-03-15',
            'football': '2024-12-07',
            'baseball': '2024-05-25',
            'softball': '2024-05-10'
        }
        
        proximity = []
        for date, sport in zip(dates, sports):
            if sport in tournament_dates:
                tournament_date = pd.to_datetime(tournament_dates[sport])
                days_diff = (tournament_date - date).days
                proximity.append(max(0, days_diff))
            else:
                proximity.append(365)  # Default for unknown sports
        
        return pd.Series(proximity, index=dates.index)
    
    def _calculate_season_progress(self, dates: pd.Series, sports: pd.Series) -> pd.Series:
        """Calculate season progress as percentage."""
        # Season definitions by sport
        season_definitions = {
            'basketball': {'start': '11-01', 'end': '03-31'},
            'football': {'start': '08-01', 'end': '12-31'},
            'baseball': {'start': '02-01', 'end': '06-30'},
            'softball': {'start': '02-01', 'end': '06-30'}
        }
        
        progress = []
        for date, sport in zip(dates, sports):
            if sport in season_definitions:
                season_start = pd.to_datetime(f"{date.year}-{season_definitions[sport]['start']}")
                season_end = pd.to_datetime(f"{date.year}-{season_definitions[sport]['end']}")
                
                if date < season_start:
                    progress.append(0.0)
                elif date > season_end:
                    progress.append(1.0)
                else:
                    total_days = (season_end - season_start).days
                    elapsed_days = (date - season_start).days
                    progress.append(elapsed_days / total_days)
            else:
                progress.append(0.5)  # Default for unknown sports
        
        return pd.Series(progress, index=dates.index)
    
    def _encode_categorical(self, categorical_series: pd.Series) -> pd.Series:
        """Encode categorical variables."""
        if categorical_series.name not in self.label_encoders:
            self.label_encoders[categorical_series.name] = LabelEncoder()
            return pd.Series(
                self.label_encoders[categorical_series.name].fit_transform(categorical_series),
                index=categorical_series.index
            )
        else:
            return pd.Series(
                self.label_encoders[categorical_series.name].transform(categorical_series),
                index=categorical_series.index
            )
    
    def _calculate_travel_distances(self, schedule_data: pd.DataFrame, 
                                  venue_data: pd.DataFrame) -> pd.Series:
        """Calculate travel distances between venues."""
        distances = []
        
        for _, game in schedule_data.iterrows():
            home_venue = venue_data[venue_data['venue_id'] == game.get('venue_id')]
            away_team_venue = venue_data[venue_data['home_team_id'] == game.get('away_team')]
            
            if not home_venue.empty and not away_team_venue.empty:
                home_coords = (home_venue.iloc[0]['latitude'], home_venue.iloc[0]['longitude'])
                away_coords = (away_team_venue.iloc[0]['latitude'], away_team_venue.iloc[0]['longitude'])
                
                if all(coord is not None for coord in home_coords + away_coords):
                    distance = geodesic(away_coords, home_coords).miles
                    distances.append(distance)
                else:
                    distances.append(0)
            else:
                distances.append(0)
        
        return pd.Series(distances, index=schedule_data.index)
    
    def _estimate_travel_time(self, distances: pd.Series) -> pd.Series:
        """Estimate travel time based on distance."""
        # Simple estimation: < 300 miles = driving, > 300 miles = flying
        return distances.apply(lambda d: 
            d / 60 if d <= 300 else  # Driving at 60 mph average
            d / 500 + 4  # Flying at 500 mph + 4 hours for airport time
        )
    
    def _estimate_travel_cost(self, distances: pd.Series, team_size: int = 25) -> pd.Series:
        """Estimate travel costs."""
        return distances.apply(lambda d:
            d * 0.5 * team_size if d <= 300 else  # Bus travel
            d * 1.2 * team_size  # Flight + bus to airport
        )
    
    # Additional helper methods would be implemented here...
    # (Placeholder implementations for brevity)
    
    def _calculate_timezone_difference(self, tz1: pd.Series, tz2: pd.Series) -> pd.Series:
        """Calculate timezone differences."""
        return pd.Series(0, index=tz1.index)  # Placeholder
    
    def _identify_rivalries(self, home_teams: pd.Series, away_teams: pd.Series) -> pd.Series:
        """Identify rivalry games."""
        return pd.Series(False, index=home_teams.index)  # Placeholder
    
    def _calculate_venue_utilization(self, schedule_data: pd.DataFrame, venue_col: str) -> pd.Series:
        """Calculate venue utilization rates."""
        return pd.Series(0.5, index=schedule_data.index)  # Placeholder
    
    def _calculate_home_advantage(self, schedule_data: pd.DataFrame, venue_data: pd.DataFrame) -> pd.Series:
        """Calculate home field advantage."""
        return pd.Series(0.6, index=schedule_data.index)  # Placeholder
    
    def _check_same_timezone(self, schedule_data: pd.DataFrame, venue_data: pd.DataFrame) -> pd.Series:
        """Check if teams are in same timezone."""
        return pd.Series(True, index=schedule_data.index)  # Placeholder
    
    def _count_consecutive_away_games(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Count consecutive away games for teams."""
        return pd.Series(1, index=schedule_data.index)  # Placeholder
    
    def _count_applicable_constraints(self, schedule_data: pd.DataFrame, 
                                    constraint_data: pd.DataFrame) -> pd.Series:
        """Count applicable constraints per game."""
        return pd.Series(5, index=schedule_data.index)  # Placeholder
    
    def _count_constraints_by_type(self, schedule_data: pd.DataFrame,
                                 constraint_data: pd.DataFrame, ctype: str) -> pd.Series:
        """Count constraints by type."""
        return pd.Series(2, index=schedule_data.index)  # Placeholder
    
    def _calculate_conflict_potential(self, schedule_data: pd.DataFrame,
                                    constraint_data: pd.DataFrame) -> pd.Series:
        """Calculate constraint conflict potential."""
        return pd.Series(0.3, index=schedule_data.index)  # Placeholder
    
    def _get_historical_violation_rate(self, schedule_data: pd.DataFrame,
                                     constraint_data: pd.DataFrame) -> pd.Series:
        """Get historical constraint violation rates."""
        return pd.Series(0.1, index=schedule_data.index)  # Placeholder
    
    def _predict_constraint_satisfaction(self, schedule_data: pd.DataFrame,
                                       constraint_data: pd.DataFrame) -> pd.Series:
        """Predict constraint satisfaction probability."""
        return pd.Series(0.8, index=schedule_data.index)  # Placeholder
    
    def _calculate_historical_quality(self, schedule_data: pd.DataFrame, window_days: int) -> pd.Series:
        """Calculate historical schedule quality."""
        return pd.Series(0.75, index=schedule_data.index)  # Placeholder
    
    def _predict_attendance(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Predict game attendance."""
        return pd.Series(15000, index=schedule_data.index)  # Placeholder
    
    def _predict_tv_rating(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Predict TV ratings."""
        return pd.Series(2.5, index=schedule_data.index)  # Placeholder
    
    def _calculate_revenue_potential(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Calculate revenue potential."""
        return pd.Series(100000, index=schedule_data.index)  # Placeholder
    
    def _calculate_competitive_balance(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Calculate competitive balance."""
        return pd.Series(0.5, index=schedule_data.index)  # Placeholder
    
    def _identify_conference_games(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Identify conference games."""
        return pd.Series(True, index=schedule_data.index)  # Placeholder
    
    def _assess_tournament_implications(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Assess tournament implications."""
        return pd.Series(0.7, index=schedule_data.index)  # Placeholder
    
    def _count_competing_events(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Count competing events."""
        return pd.Series(2, index=schedule_data.index)  # Placeholder
    
    def _calculate_media_attention(self, schedule_data: pd.DataFrame) -> pd.Series:
        """Calculate media attention score."""
        return pd.Series(0.6, index=schedule_data.index)  # Placeholder


if __name__ == "__main__":
    # Example usage
    config = {
        'cache_enabled': True,
        'feature_selection': True,
        'normalize_features': True
    }
    
    feature_engineer = ScheduleFeatureEngineer(config)
    
    # This would be called with actual data
    print("Schedule Feature Engineering module loaded successfully")
    print("Features available:")
    print("- Temporal features: date/time patterns, seasonality")
    print("- Team features: rankings, characteristics, rivalries")
    print("- Venue features: capacity, location, utilization")
    print("- Travel features: distances, costs, logistics")
    print("- Constraint features: complexity, satisfaction rates")
    print("- Performance features: quality scores, engagement")
    print("- Competition features: tournament implications, media attention")