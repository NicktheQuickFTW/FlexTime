"""
MLOps Pipeline for FlexTime AI/ML Systems
Advanced model lifecycle management, versioning, A/B testing, and automated deployment.

This module provides:
- Model versioning and tracking
- A/B testing framework for algorithms
- Performance monitoring for ML models
- Automated model deployment pipeline
- Model drift detection
- Automated retraining workflows
"""

import asyncio
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import pickle
import hashlib
import os
import shutil
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, accuracy_score, precision_score, recall_score
import redis
import aiofiles
import yaml

# Configure logging
logger = logging.getLogger('mlops_pipeline')

class ModelStatus(Enum):
    """Model status enumeration."""
    TRAINING = "training"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"
    FAILED = "failed"

class DeploymentStrategy(Enum):
    """Deployment strategy enumeration."""
    BLUE_GREEN = "blue_green"
    CANARY = "canary"
    ROLLING = "rolling"
    A_B_TEST = "a_b_test"

@dataclass
class ModelVersion:
    """Model version metadata."""
    model_id: str
    version: str
    name: str
    description: str
    algorithm: str
    hyperparameters: Dict[str, Any]
    training_data_hash: str
    performance_metrics: Dict[str, float]
    status: ModelStatus
    created_at: datetime
    updated_at: datetime
    deployed_at: Optional[datetime] = None
    tags: List[str] = None
    author: str = "system"
    file_path: str = ""
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []

@dataclass
class ExperimentResult:
    """A/B test experiment result."""
    experiment_id: str
    model_a_id: str
    model_b_id: str
    traffic_split: float
    start_time: datetime
    end_time: Optional[datetime]
    model_a_metrics: Dict[str, float]
    model_b_metrics: Dict[str, float]
    statistical_significance: float
    winner: Optional[str] = None
    confidence_level: float = 0.95

@dataclass
class ModelPerformanceSnapshot:
    """Model performance at a specific time."""
    model_id: str
    timestamp: datetime
    metrics: Dict[str, float]
    prediction_count: int
    error_rate: float
    latency_ms: float
    memory_usage_mb: float

class ModelRegistry:
    """Central registry for managing model versions."""
    
    def __init__(self, storage_path: str = "models", redis_client: Optional[redis.Redis] = None):
        """Initialize the model registry.
        
        Args:
            storage_path: Path to store model artifacts
            redis_client: Redis client for metadata caching
        """
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=1)
        self.models = {}
        
    async def register_model(self, model: Any, metadata: ModelVersion) -> str:
        """Register a new model version.
        
        Args:
            model: The trained model object
            metadata: Model metadata
            
        Returns:
            Model version ID
        """
        # Create version directory
        version_dir = self.storage_path / metadata.model_id / metadata.version
        version_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model artifact
        model_path = version_dir / "model.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Save metadata
        metadata.file_path = str(model_path)
        metadata_path = version_dir / "metadata.json"
        
        # Convert datetime objects to ISO strings for JSON serialization
        metadata_dict = asdict(metadata)
        metadata_dict['created_at'] = metadata.created_at.isoformat()
        metadata_dict['updated_at'] = metadata.updated_at.isoformat()
        if metadata.deployed_at:
            metadata_dict['deployed_at'] = metadata.deployed_at.isoformat()
        metadata_dict['status'] = metadata.status.value
        
        async with aiofiles.open(metadata_path, 'w') as f:
            await f.write(json.dumps(metadata_dict, indent=2))
        
        # Cache in Redis
        cache_key = f"model:{metadata.model_id}:{metadata.version}"
        self.redis_client.hset(cache_key, mapping=metadata_dict)
        self.redis_client.expire(cache_key, 86400)  # 24 hours
        
        # Add to registry
        if metadata.model_id not in self.models:
            self.models[metadata.model_id] = {}
        self.models[metadata.model_id][metadata.version] = metadata
        
        logger.info(f"Registered model {metadata.model_id} version {metadata.version}")
        
        return f"{metadata.model_id}:{metadata.version}"
    
    async def get_model(self, model_id: str, version: str = "latest") -> Tuple[Any, ModelVersion]:
        """Retrieve a model and its metadata.
        
        Args:
            model_id: Model identifier
            version: Model version or "latest"
            
        Returns:
            Tuple of (model, metadata)
        """
        # Get latest version if requested
        if version == "latest":
            version = await self._get_latest_version(model_id)
        
        # Try cache first
        cache_key = f"model:{model_id}:{version}"
        cached_metadata = self.redis_client.hgetall(cache_key)
        
        if cached_metadata:
            # Load model from file
            file_path = cached_metadata.get('file_path', '').decode('utf-8')
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    model = pickle.load(f)
                
                # Reconstruct metadata
                metadata = self._reconstruct_metadata(cached_metadata)
                return model, metadata
        
        # Load from storage
        version_dir = self.storage_path / model_id / version
        if not version_dir.exists():
            raise FileNotFoundError(f"Model {model_id} version {version} not found")
        
        # Load model
        model_path = version_dir / "model.pkl"
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Load metadata
        metadata_path = version_dir / "metadata.json"
        async with aiofiles.open(metadata_path, 'r') as f:
            metadata_dict = json.loads(await f.read())
        
        metadata = self._dict_to_metadata(metadata_dict)
        
        return model, metadata
    
    async def list_models(self, status: Optional[ModelStatus] = None) -> List[ModelVersion]:
        """List all models in the registry.
        
        Args:
            status: Filter by model status
            
        Returns:
            List of model metadata
        """
        models = []
        
        for model_id in os.listdir(self.storage_path):
            model_dir = self.storage_path / model_id
            if not model_dir.is_dir():
                continue
            
            for version in os.listdir(model_dir):
                version_dir = model_dir / version
                if not version_dir.is_dir():
                    continue
                
                metadata_path = version_dir / "metadata.json"
                if metadata_path.exists():
                    async with aiofiles.open(metadata_path, 'r') as f:
                        metadata_dict = json.loads(await f.read())
                    
                    metadata = self._dict_to_metadata(metadata_dict)
                    
                    if status is None or metadata.status == status:
                        models.append(metadata)
        
        return sorted(models, key=lambda x: x.created_at, reverse=True)
    
    async def update_model_status(self, model_id: str, version: str, status: ModelStatus) -> bool:
        """Update model status.
        
        Args:
            model_id: Model identifier
            version: Model version
            status: New status
            
        Returns:
            Success flag
        """
        try:
            version_dir = self.storage_path / model_id / version
            metadata_path = version_dir / "metadata.json"
            
            if not metadata_path.exists():
                return False
            
            # Load current metadata
            async with aiofiles.open(metadata_path, 'r') as f:
                metadata_dict = json.loads(await f.read())
            
            # Update status
            metadata_dict['status'] = status.value
            metadata_dict['updated_at'] = datetime.now().isoformat()
            
            # Save updated metadata
            async with aiofiles.open(metadata_path, 'w') as f:
                await f.write(json.dumps(metadata_dict, indent=2))
            
            # Update cache
            cache_key = f"model:{model_id}:{version}"
            self.redis_client.hset(cache_key, "status", status.value)
            self.redis_client.hset(cache_key, "updated_at", metadata_dict['updated_at'])
            
            logger.info(f"Updated model {model_id}:{version} status to {status.value}")
            
            return True
        except Exception as e:
            logger.error(f"Failed to update model status: {e}")
            return False
    
    async def _get_latest_version(self, model_id: str) -> str:
        """Get the latest version of a model."""
        model_dir = self.storage_path / model_id
        if not model_dir.exists():
            raise FileNotFoundError(f"Model {model_id} not found")
        
        versions = []
        for version_dir in model_dir.iterdir():
            if version_dir.is_dir():
                metadata_path = version_dir / "metadata.json"
                if metadata_path.exists():
                    async with aiofiles.open(metadata_path, 'r') as f:
                        metadata = json.loads(await f.read())
                    versions.append((version_dir.name, metadata['created_at']))
        
        if not versions:
            raise FileNotFoundError(f"No versions found for model {model_id}")
        
        # Sort by creation time and return latest
        versions.sort(key=lambda x: x[1], reverse=True)
        return versions[0][0]
    
    def _reconstruct_metadata(self, cached_data: Dict[bytes, bytes]) -> ModelVersion:
        """Reconstruct metadata from Redis cache."""
        metadata_dict = {}
        for key, value in cached_data.items():
            key_str = key.decode('utf-8')
            value_str = value.decode('utf-8')
            
            if key_str in ['created_at', 'updated_at', 'deployed_at']:
                metadata_dict[key_str] = datetime.fromisoformat(value_str) if value_str != 'None' else None
            elif key_str == 'status':
                metadata_dict[key_str] = ModelStatus(value_str)
            elif key_str in ['hyperparameters', 'performance_metrics', 'tags']:
                metadata_dict[key_str] = json.loads(value_str)
            else:
                metadata_dict[key_str] = value_str
        
        return ModelVersion(**metadata_dict)
    
    def _dict_to_metadata(self, metadata_dict: Dict[str, Any]) -> ModelVersion:
        """Convert dictionary to ModelVersion object."""
        # Parse datetime strings
        metadata_dict['created_at'] = datetime.fromisoformat(metadata_dict['created_at'])
        metadata_dict['updated_at'] = datetime.fromisoformat(metadata_dict['updated_at'])
        if metadata_dict.get('deployed_at'):
            metadata_dict['deployed_at'] = datetime.fromisoformat(metadata_dict['deployed_at'])
        
        # Parse status enum
        metadata_dict['status'] = ModelStatus(metadata_dict['status'])
        
        return ModelVersion(**metadata_dict)

class ABTestingFramework:
    """A/B testing framework for model comparison."""
    
    def __init__(self, model_registry: ModelRegistry, redis_client: Optional[redis.Redis] = None):
        """Initialize the A/B testing framework.
        
        Args:
            model_registry: Model registry instance
            redis_client: Redis client for experiment tracking
        """
        self.model_registry = model_registry
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=2)
        self.active_experiments = {}
    
    async def start_experiment(self, model_a_id: str, model_b_id: str, 
                             traffic_split: float = 0.5, duration_hours: int = 24) -> str:
        """Start an A/B test experiment.
        
        Args:
            model_a_id: First model ID (format: model_id:version)
            model_b_id: Second model ID (format: model_id:version)
            traffic_split: Percentage of traffic for model A (0.0 to 1.0)
            duration_hours: Experiment duration in hours
            
        Returns:
            Experiment ID
        """
        experiment_id = str(uuid.uuid4())
        
        experiment = ExperimentResult(
            experiment_id=experiment_id,
            model_a_id=model_a_id,
            model_b_id=model_b_id,
            traffic_split=traffic_split,
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(hours=duration_hours),
            model_a_metrics={},
            model_b_metrics={},
            statistical_significance=0.0
        )
        
        # Store experiment
        self.active_experiments[experiment_id] = experiment
        
        # Cache in Redis
        experiment_data = asdict(experiment)
        experiment_data['start_time'] = experiment.start_time.isoformat()
        experiment_data['end_time'] = experiment.end_time.isoformat()
        
        self.redis_client.hset(f"experiment:{experiment_id}", mapping=experiment_data)
        self.redis_client.expire(f"experiment:{experiment_id}", duration_hours * 3600 + 3600)  # Extra hour
        
        logger.info(f"Started A/B test experiment {experiment_id}: {model_a_id} vs {model_b_id}")
        
        return experiment_id
    
    async def record_prediction(self, experiment_id: str, prediction_value: float, 
                              actual_value: Optional[float] = None, 
                              latency_ms: float = 0.0, model_used: str = "auto") -> bool:
        """Record a prediction for an active experiment.
        
        Args:
            experiment_id: Experiment identifier
            prediction_value: Predicted value
            actual_value: Actual observed value (if available)
            latency_ms: Prediction latency in milliseconds
            model_used: Which model was used ("A", "B", or "auto" for random selection)
            
        Returns:
            Success flag
        """
        if experiment_id not in self.active_experiments:
            return False
        
        experiment = self.active_experiments[experiment_id]
        
        # Determine which model to use if auto
        if model_used == "auto":
            model_used = "A" if np.random.random() < experiment.traffic_split else "B"
        
        # Create prediction record
        prediction_record = {
            'timestamp': datetime.now().isoformat(),
            'prediction_value': prediction_value,
            'actual_value': actual_value,
            'latency_ms': latency_ms,
            'model_used': model_used
        }
        
        # Store prediction in Redis
        prediction_key = f"experiment:{experiment_id}:predictions"
        self.redis_client.lpush(prediction_key, json.dumps(prediction_record))
        self.redis_client.expire(prediction_key, 86400 * 7)  # Keep for 7 days
        
        return True
    
    async def evaluate_experiment(self, experiment_id: str) -> ExperimentResult:
        """Evaluate an A/B test experiment.
        
        Args:
            experiment_id: Experiment identifier
            
        Returns:
            Updated experiment result
        """
        if experiment_id not in self.active_experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        experiment = self.active_experiments[experiment_id]
        
        # Get all predictions
        prediction_key = f"experiment:{experiment_id}:predictions"
        predictions_data = self.redis_client.lrange(prediction_key, 0, -1)
        
        model_a_predictions = []
        model_b_predictions = []
        model_a_actuals = []
        model_b_actuals = []
        model_a_latencies = []
        model_b_latencies = []
        
        for pred_data in predictions_data:
            pred = json.loads(pred_data.decode('utf-8'))
            
            if pred['model_used'] == 'A':
                model_a_predictions.append(pred['prediction_value'])
                if pred['actual_value'] is not None:
                    model_a_actuals.append(pred['actual_value'])
                model_a_latencies.append(pred['latency_ms'])
            else:
                model_b_predictions.append(pred['prediction_value'])
                if pred['actual_value'] is not None:
                    model_b_actuals.append(pred['actual_value'])
                model_b_latencies.append(pred['latency_ms'])
        
        # Calculate metrics
        experiment.model_a_metrics = self._calculate_model_metrics(
            model_a_predictions, model_a_actuals, model_a_latencies
        )
        experiment.model_b_metrics = self._calculate_model_metrics(
            model_b_predictions, model_b_actuals, model_b_latencies
        )
        
        # Determine statistical significance and winner
        if model_a_actuals and model_b_actuals:
            significance, winner = self._statistical_test(
                model_a_predictions, model_a_actuals,
                model_b_predictions, model_b_actuals
            )
            experiment.statistical_significance = significance
            experiment.winner = winner
        
        # Update experiment
        self.active_experiments[experiment_id] = experiment
        
        return experiment
    
    def _calculate_model_metrics(self, predictions: List[float], 
                               actuals: List[float], latencies: List[float]) -> Dict[str, float]:
        """Calculate metrics for a model in an experiment."""
        metrics = {
            'prediction_count': len(predictions),
            'avg_latency_ms': np.mean(latencies) if latencies else 0.0,
            'p95_latency_ms': np.percentile(latencies, 95) if latencies else 0.0
        }
        
        if actuals and len(actuals) == len(predictions[:len(actuals)]):
            preds_subset = predictions[:len(actuals)]
            metrics['mse'] = mean_squared_error(actuals, preds_subset)
            metrics['rmse'] = np.sqrt(metrics['mse'])
            
            # Calculate accuracy for classification-like problems
            if all(isinstance(x, int) or x.is_integer() for x in actuals):
                # Treat as classification
                pred_classes = [round(p) for p in preds_subset]
                metrics['accuracy'] = accuracy_score(actuals, pred_classes)
        
        return metrics
    
    def _statistical_test(self, pred_a: List[float], actual_a: List[float],
                         pred_b: List[float], actual_b: List[float]) -> Tuple[float, str]:
        """Perform statistical test to determine significance and winner."""
        # Calculate errors
        errors_a = [abs(p - a) for p, a in zip(pred_a[:len(actual_a)], actual_a)]
        errors_b = [abs(p - a) for p, a in zip(pred_b[:len(actual_b)], actual_b)]
        
        # Simple t-test approximation
        if len(errors_a) < 5 or len(errors_b) < 5:
            return 0.0, "insufficient_data"
        
        mean_error_a = np.mean(errors_a)
        mean_error_b = np.mean(errors_b)
        
        # Calculate pooled standard deviation
        pooled_std = np.sqrt((np.var(errors_a) + np.var(errors_b)) / 2)
        
        if pooled_std == 0:
            return 1.0, "A" if mean_error_a < mean_error_b else "B"
        
        # Calculate t-statistic
        t_stat = abs(mean_error_a - mean_error_b) / (pooled_std * np.sqrt(2/min(len(errors_a), len(errors_b))))
        
        # Approximate p-value (simplified)
        significance = min(1.0, 2 * (1 - 0.5 * (1 + t_stat / (1 + t_stat))))
        
        winner = "A" if mean_error_a < mean_error_b else "B"
        
        return significance, winner

class ModelMonitor:
    """Monitor model performance in production."""
    
    def __init__(self, model_registry: ModelRegistry, redis_client: Optional[redis.Redis] = None):
        """Initialize the model monitor.
        
        Args:
            model_registry: Model registry instance
            redis_client: Redis client for metrics storage
        """
        self.model_registry = model_registry
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=3)
        self.alert_thresholds = {}
    
    async def record_prediction_metrics(self, model_id: str, prediction_time: float,
                                      error_rate: float, latency_ms: float, 
                                      memory_usage_mb: float) -> bool:
        """Record prediction metrics for a model.
        
        Args:
            model_id: Model identifier
            prediction_time: Time of prediction
            error_rate: Current error rate
            latency_ms: Prediction latency
            memory_usage_mb: Memory usage
            
        Returns:
            Success flag
        """
        snapshot = ModelPerformanceSnapshot(
            model_id=model_id,
            timestamp=datetime.now(),
            metrics={'error_rate': error_rate},
            prediction_count=1,
            error_rate=error_rate,
            latency_ms=latency_ms,
            memory_usage_mb=memory_usage_mb
        )
        
        # Store in Redis time series
        metrics_key = f"model_metrics:{model_id}"
        snapshot_data = asdict(snapshot)
        snapshot_data['timestamp'] = snapshot.timestamp.isoformat()
        
        self.redis_client.zadd(
            metrics_key, 
            {json.dumps(snapshot_data): snapshot.timestamp.timestamp()}
        )
        
        # Keep only last 24 hours of data
        cutoff_time = datetime.now() - timedelta(hours=24)
        self.redis_client.zremrangebyscore(metrics_key, 0, cutoff_time.timestamp())
        
        # Check for alerts
        await self._check_alerts(model_id, snapshot)
        
        return True
    
    async def get_model_health(self, model_id: str, hours: int = 1) -> Dict[str, Any]:
        """Get model health metrics.
        
        Args:
            model_id: Model identifier
            hours: Number of hours to analyze
            
        Returns:
            Health metrics
        """
        metrics_key = f"model_metrics:{model_id}"
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # Get recent metrics
        metrics_data = self.redis_client.zrangebyscore(
            metrics_key, 
            cutoff_time.timestamp(), 
            datetime.now().timestamp()
        )
        
        if not metrics_data:
            return {'status': 'no_data', 'metrics': {}}
        
        # Parse metrics
        snapshots = []
        for data in metrics_data:
            snapshot_dict = json.loads(data.decode('utf-8'))
            snapshot_dict['timestamp'] = datetime.fromisoformat(snapshot_dict['timestamp'])
            snapshots.append(snapshot_dict)
        
        # Calculate aggregated metrics
        error_rates = [s['error_rate'] for s in snapshots]
        latencies = [s['latency_ms'] for s in snapshots]
        memory_usage = [s['memory_usage_mb'] for s in snapshots]
        
        health_score = self._calculate_health_score(error_rates, latencies, memory_usage)
        
        return {
            'status': 'healthy' if health_score > 0.8 else 'degraded' if health_score > 0.5 else 'unhealthy',
            'health_score': health_score,
            'metrics': {
                'avg_error_rate': np.mean(error_rates),
                'max_error_rate': np.max(error_rates),
                'avg_latency_ms': np.mean(latencies),
                'p95_latency_ms': np.percentile(latencies, 95),
                'avg_memory_mb': np.mean(memory_usage),
                'prediction_count': len(snapshots),
                'uptime_hours': hours
            },
            'alerts': await self._get_active_alerts(model_id)
        }
    
    async def detect_drift(self, model_id: str, new_data: np.ndarray, 
                          reference_data: np.ndarray) -> Dict[str, Any]:
        """Detect data drift for a model.
        
        Args:
            model_id: Model identifier
            new_data: New incoming data
            reference_data: Reference data from training
            
        Returns:
            Drift detection results
        """
        # Simple statistical drift detection
        drift_scores = []
        feature_drifts = []
        
        for i in range(min(new_data.shape[1], reference_data.shape[1])):
            new_feature = new_data[:, i]
            ref_feature = reference_data[:, i]
            
            # Calculate distribution difference (simplified KS test)
            new_mean, new_std = np.mean(new_feature), np.std(new_feature)
            ref_mean, ref_std = np.mean(ref_feature), np.std(ref_feature)
            
            # Normalized difference
            mean_diff = abs(new_mean - ref_mean) / max(ref_std, 0.001)
            std_diff = abs(new_std - ref_std) / max(ref_std, 0.001)
            
            feature_drift = (mean_diff + std_diff) / 2
            drift_scores.append(feature_drift)
            feature_drifts.append({
                'feature_index': i,
                'drift_score': feature_drift,
                'new_mean': new_mean,
                'ref_mean': ref_mean,
                'new_std': new_std,
                'ref_std': ref_std
            })
        
        overall_drift = np.mean(drift_scores)
        drift_detected = overall_drift > 0.1  # Threshold for drift detection
        
        result = {
            'model_id': model_id,
            'overall_drift_score': overall_drift,
            'drift_detected': drift_detected,
            'severity': 'high' if overall_drift > 0.3 else 'medium' if overall_drift > 0.1 else 'low',
            'feature_drifts': feature_drifts,
            'timestamp': datetime.now().isoformat()
        }
        
        # Store drift analysis
        drift_key = f"model_drift:{model_id}"
        self.redis_client.lpush(drift_key, json.dumps(result))
        self.redis_client.ltrim(drift_key, 0, 99)  # Keep last 100 drift analyses
        
        return result
    
    def _calculate_health_score(self, error_rates: List[float], 
                               latencies: List[float], memory_usage: List[float]) -> float:
        """Calculate overall health score for a model."""
        # Error rate score (lower is better)
        avg_error = np.mean(error_rates)
        error_score = max(0.0, 1.0 - (avg_error * 2))  # Assume 50% error rate = 0 score
        
        # Latency score (lower is better, assume 1000ms = baseline)
        avg_latency = np.mean(latencies)
        latency_score = max(0.0, 1.0 - (avg_latency / 1000))
        
        # Memory score (assume 1GB = baseline)
        avg_memory = np.mean(memory_usage)
        memory_score = max(0.0, 1.0 - (avg_memory / 1024))
        
        # Weighted average
        health_score = (error_score * 0.5) + (latency_score * 0.3) + (memory_score * 0.2)
        
        return min(1.0, max(0.0, health_score))
    
    async def _check_alerts(self, model_id: str, snapshot: ModelPerformanceSnapshot):
        """Check if any alerts should be triggered."""
        thresholds = self.alert_thresholds.get(model_id, {})
        
        alerts = []
        
        # Error rate alert
        if snapshot.error_rate > thresholds.get('max_error_rate', 0.1):
            alerts.append({
                'type': 'high_error_rate',
                'severity': 'critical',
                'message': f"Error rate {snapshot.error_rate:.2%} exceeds threshold",
                'timestamp': snapshot.timestamp.isoformat()
            })
        
        # Latency alert
        if snapshot.latency_ms > thresholds.get('max_latency_ms', 500):
            alerts.append({
                'type': 'high_latency',
                'severity': 'warning',
                'message': f"Latency {snapshot.latency_ms:.0f}ms exceeds threshold",
                'timestamp': snapshot.timestamp.isoformat()
            })
        
        # Memory alert
        if snapshot.memory_usage_mb > thresholds.get('max_memory_mb', 512):
            alerts.append({
                'type': 'high_memory_usage',
                'severity': 'warning',
                'message': f"Memory usage {snapshot.memory_usage_mb:.0f}MB exceeds threshold",
                'timestamp': snapshot.timestamp.isoformat()
            })
        
        # Store alerts
        if alerts:
            alerts_key = f"model_alerts:{model_id}"
            for alert in alerts:
                self.redis_client.lpush(alerts_key, json.dumps(alert))
            self.redis_client.ltrim(alerts_key, 0, 99)  # Keep last 100 alerts
    
    async def _get_active_alerts(self, model_id: str) -> List[Dict[str, Any]]:
        """Get active alerts for a model."""
        alerts_key = f"model_alerts:{model_id}"
        alert_data = self.redis_client.lrange(alerts_key, 0, 9)  # Last 10 alerts
        
        alerts = []
        for data in alert_data:
            alert = json.loads(data.decode('utf-8'))
            alerts.append(alert)
        
        return alerts

class AutomatedDeployment:
    """Automated model deployment pipeline."""
    
    def __init__(self, model_registry: ModelRegistry, monitor: ModelMonitor):
        """Initialize the automated deployment system.
        
        Args:
            model_registry: Model registry instance
            monitor: Model monitor instance
        """
        self.model_registry = model_registry
        self.monitor = monitor
        self.deployment_configs = {}
    
    async def deploy_model(self, model_id: str, version: str, 
                          strategy: DeploymentStrategy = DeploymentStrategy.BLUE_GREEN,
                          validation_threshold: float = 0.95) -> Dict[str, Any]:
        """Deploy a model using the specified strategy.
        
        Args:
            model_id: Model identifier
            version: Model version
            strategy: Deployment strategy
            validation_threshold: Minimum validation score required
            
        Returns:
            Deployment result
        """
        # Load model and validate
        model, metadata = await self.model_registry.get_model(model_id, version)
        
        # Check if model meets validation threshold
        if metadata.performance_metrics.get('r2_score', 0) < validation_threshold:
            return {
                'success': False,
                'error': f"Model performance {metadata.performance_metrics.get('r2_score', 0):.3f} "
                        f"below threshold {validation_threshold}"
            }
        
        # Execute deployment strategy
        if strategy == DeploymentStrategy.BLUE_GREEN:
            result = await self._blue_green_deployment(model_id, version, model, metadata)
        elif strategy == DeploymentStrategy.CANARY:
            result = await self._canary_deployment(model_id, version, model, metadata)
        elif strategy == DeploymentStrategy.ROLLING:
            result = await self._rolling_deployment(model_id, version, model, metadata)
        else:
            result = {'success': False, 'error': f"Unsupported deployment strategy: {strategy}"}
        
        if result['success']:
            # Update model status
            await self.model_registry.update_model_status(model_id, version, ModelStatus.PRODUCTION)
            
            # Mark previous version as deprecated
            current_prod_models = await self.model_registry.list_models(ModelStatus.PRODUCTION)
            for prod_model in current_prod_models:
                if prod_model.model_id == model_id and prod_model.version != version:
                    await self.model_registry.update_model_status(
                        prod_model.model_id, prod_model.version, ModelStatus.DEPRECATED
                    )
        
        return result
    
    async def _blue_green_deployment(self, model_id: str, version: str, 
                                   model: Any, metadata: ModelVersion) -> Dict[str, Any]:
        """Execute blue-green deployment."""
        logger.info(f"Starting blue-green deployment for {model_id}:{version}")
        
        # In a real implementation, this would:
        # 1. Deploy to green environment
        # 2. Run health checks
        # 3. Switch traffic from blue to green
        # 4. Monitor for issues
        # 5. Keep blue as backup
        
        # Simulate deployment process
        await asyncio.sleep(1)  # Simulate deployment time
        
        return {
            'success': True,
            'strategy': 'blue_green',
            'deployed_at': datetime.now().isoformat(),
            'environment': 'green'
        }
    
    async def _canary_deployment(self, model_id: str, version: str,
                                model: Any, metadata: ModelVersion) -> Dict[str, Any]:
        """Execute canary deployment."""
        logger.info(f"Starting canary deployment for {model_id}:{version}")
        
        # In a real implementation, this would:
        # 1. Deploy to small percentage of traffic
        # 2. Monitor performance closely
        # 3. Gradually increase traffic if stable
        # 4. Roll back if issues detected
        
        # Simulate canary process
        await asyncio.sleep(2)  # Simulate gradual rollout
        
        return {
            'success': True,
            'strategy': 'canary',
            'deployed_at': datetime.now().isoformat(),
            'traffic_percentage': 100  # After full rollout
        }
    
    async def _rolling_deployment(self, model_id: str, version: str,
                                 model: Any, metadata: ModelVersion) -> Dict[str, Any]:
        """Execute rolling deployment."""
        logger.info(f"Starting rolling deployment for {model_id}:{version}")
        
        # In a real implementation, this would:
        # 1. Update instances one by one
        # 2. Health check each instance
        # 3. Continue if healthy, roll back if not
        
        # Simulate rolling update
        await asyncio.sleep(1.5)  # Simulate instance updates
        
        return {
            'success': True,
            'strategy': 'rolling',
            'deployed_at': datetime.now().isoformat(),
            'instances_updated': 3
        }

class MLOpsPipeline:
    """Main MLOps pipeline orchestrator."""
    
    def __init__(self, storage_path: str = "models", redis_host: str = "localhost"):
        """Initialize the MLOps pipeline.
        
        Args:
            storage_path: Path for model storage
            redis_host: Redis server host
        """
        # Initialize Redis clients for different purposes
        self.redis_registry = redis.Redis(host=redis_host, port=6379, db=1)
        self.redis_experiments = redis.Redis(host=redis_host, port=6379, db=2)
        self.redis_monitoring = redis.Redis(host=redis_host, port=6379, db=3)
        
        # Initialize components
        self.model_registry = ModelRegistry(storage_path, self.redis_registry)
        self.ab_testing = ABTestingFramework(self.model_registry, self.redis_experiments)
        self.monitor = ModelMonitor(self.model_registry, self.redis_monitoring)
        self.deployment = AutomatedDeployment(self.model_registry, self.monitor)
        
        logger.info("MLOps pipeline initialized")
    
    async def full_model_lifecycle(self, model: Any, model_config: Dict[str, Any],
                                 training_data: Dict[str, Any]) -> str:
        """Execute full model lifecycle from training to deployment.
        
        Args:
            model: Trained model object
            model_config: Model configuration
            training_data: Training data information
            
        Returns:
            Model version ID
        """
        # Create model metadata
        model_id = model_config.get('model_id', f"model_{uuid.uuid4().hex[:8]}")
        version = model_config.get('version', datetime.now().strftime("%Y%m%d_%H%M%S"))
        
        metadata = ModelVersion(
            model_id=model_id,
            version=version,
            name=model_config.get('name', 'Unnamed Model'),
            description=model_config.get('description', ''),
            algorithm=model_config.get('algorithm', 'Unknown'),
            hyperparameters=model_config.get('hyperparameters', {}),
            training_data_hash=self._hash_data(training_data),
            performance_metrics=model_config.get('performance_metrics', {}),
            status=ModelStatus.TRAINING,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            author=model_config.get('author', 'system')
        )
        
        # Register model
        version_id = await self.model_registry.register_model(model, metadata)
        
        # Update status to testing
        await self.model_registry.update_model_status(model_id, version, ModelStatus.TESTING)
        
        # If validation passes, deploy to staging
        if metadata.performance_metrics.get('r2_score', 0) > 0.8:
            await self.model_registry.update_model_status(model_id, version, ModelStatus.STAGING)
            
            # Auto-deploy if performance is very good
            if metadata.performance_metrics.get('r2_score', 0) > 0.9:
                deployment_result = await self.deployment.deploy_model(
                    model_id, version, DeploymentStrategy.BLUE_GREEN
                )
                
                if deployment_result['success']:
                    logger.info(f"Model {version_id} automatically deployed to production")
        
        return version_id
    
    def _hash_data(self, data: Dict[str, Any]) -> str:
        """Create hash of training data for tracking."""
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check of the entire MLOps pipeline."""
        health = {
            'status': 'healthy',
            'components': {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Check Redis connections
        try:
            self.redis_registry.ping()
            health['components']['model_registry'] = 'healthy'
        except Exception as e:
            health['components']['model_registry'] = f'unhealthy: {e}'
            health['status'] = 'degraded'
        
        try:
            self.redis_experiments.ping()
            health['components']['ab_testing'] = 'healthy'
        except Exception as e:
            health['components']['ab_testing'] = f'unhealthy: {e}'
            health['status'] = 'degraded'
        
        try:
            self.redis_monitoring.ping()
            health['components']['monitoring'] = 'healthy'
        except Exception as e:
            health['components']['monitoring'] = f'unhealthy: {e}'
            health['status'] = 'degraded'
        
        # Check model storage
        if os.path.exists(self.model_registry.storage_path):
            health['components']['model_storage'] = 'healthy'
        else:
            health['components']['model_storage'] = 'unhealthy: storage path not found'
            health['status'] = 'unhealthy'
        
        return health

# Example usage and configuration
async def main():
    """Example usage of the MLOps pipeline."""
    # Initialize pipeline
    pipeline = MLOpsPipeline()
    
    # Health check
    health = await pipeline.health_check()
    print(f"Pipeline health: {health['status']}")
    
    # Example model lifecycle (with mock model)
    from sklearn.linear_model import LinearRegression
    model = LinearRegression()
    
    # Mock training
    X = np.random.rand(100, 5)
    y = np.random.rand(100)
    model.fit(X, y)
    
    # Model configuration
    model_config = {
        'model_id': 'attendance_predictor',
        'version': '1.0.0',
        'name': 'Attendance Prediction Model',
        'description': 'Predicts game attendance based on team performance and game characteristics',
        'algorithm': 'LinearRegression',
        'hyperparameters': {},
        'performance_metrics': {'r2_score': 0.85, 'mse': 0.15},
        'author': 'mlops_pipeline'
    }
    
    training_data = {
        'features': X.tolist(),
        'targets': y.tolist(),
        'feature_names': ['team_rating', 'rivalry_score', 'day_of_week', 'time_slot', 'weather']
    }
    
    # Execute full lifecycle
    version_id = await pipeline.full_model_lifecycle(model, model_config, training_data)
    print(f"Model deployed with version ID: {version_id}")

if __name__ == "__main__":
    asyncio.run(main())