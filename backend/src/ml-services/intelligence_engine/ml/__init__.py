"""
Machine Learning components for the HELiiX Intelligence Engine.

This package provides pattern extraction and predictive modeling capabilities
for the FlexTime platform's Intelligence Engine.
"""

from intelligence_engine.ml.pattern_extractor import PatternExtractor
from intelligence_engine.ml.predictive_model import (
    PredictiveModel,
    GameOutcomePredictor,
    ScheduleQualityPredictor,
    TeamPerformancePredictor,
    create_model
)
