"""
AI/ML Performance Monitoring and Alerting System for FlexTime
Advanced monitoring, drift detection, and alerting for AI/ML models in production.

This module provides:
- Real-time model performance monitoring
- Data drift detection and alerting
- Model health scoring
- Automated alert generation
- Performance trend analysis
- System-wide AI health dashboard
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
import json
import redis
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psutil
import time
import threading
from collections import deque, defaultdict
import statistics
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64

# Configure logging
logger = logging.getLogger('ai_performance_monitor')

class AlertSeverity(Enum):
    """Alert severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ModelStatus(Enum):
    """Model status enumeration."""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    OFFLINE = "offline"
    DEGRADED = "degraded"

class DriftType(Enum):
    """Types of data drift."""
    FEATURE_DRIFT = "feature_drift"
    CONCEPT_DRIFT = "concept_drift"
    PREDICTION_DRIFT = "prediction_drift"
    PERFORMANCE_DRIFT = "performance_drift"

@dataclass
class PerformanceMetric:
    """Performance metric data point."""
    timestamp: datetime
    model_id: str
    metric_name: str
    value: float
    threshold_low: Optional[float] = None
    threshold_high: Optional[float] = None
    context: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Alert:
    """Alert information."""
    alert_id: str
    timestamp: datetime
    model_id: str
    severity: AlertSeverity
    alert_type: str
    title: str
    description: str
    current_value: float
    threshold_value: float
    context: Dict[str, Any]
    acknowledged: bool = False
    resolved: bool = False
    resolution_notes: str = ""

@dataclass
class ModelHealthReport:
    """Comprehensive model health report."""
    model_id: str
    timestamp: datetime
    overall_health_score: float
    status: ModelStatus
    performance_metrics: Dict[str, float]
    drift_scores: Dict[str, float]
    recent_alerts: List[Alert]
    recommendations: List[str]
    uptime_percentage: float
    prediction_count_24h: int
    error_rate_24h: float

class DriftDetector:
    """Statistical drift detection for model inputs and outputs."""
    
    def __init__(self, window_size: int = 1000, sensitivity: float = 0.05):
        """Initialize the drift detector.
        
        Args:
            window_size: Size of the reference window
            sensitivity: Sensitivity threshold for drift detection
        """
        self.window_size = window_size
        self.sensitivity = sensitivity
        self.reference_data = {}
        self.current_data = {}
    
    def set_reference_data(self, model_id: str, feature_name: str, data: np.ndarray):
        """Set reference data for drift comparison.
        
        Args:
            model_id: Model identifier
            feature_name: Feature name
            data: Reference data array
        """
        if model_id not in self.reference_data:
            self.reference_data[model_id] = {}
        
        self.reference_data[model_id][feature_name] = {
            'data': data[-self.window_size:],  # Keep only recent data
            'mean': np.mean(data),
            'std': np.std(data),
            'quantiles': np.percentile(data, [25, 50, 75])
        }
    
    def add_current_data(self, model_id: str, feature_name: str, value: float):
        """Add current data point for drift monitoring.
        
        Args:
            model_id: Model identifier
            feature_name: Feature name
            value: Current data value
        """
        if model_id not in self.current_data:
            self.current_data[model_id] = {}
        
        if feature_name not in self.current_data[model_id]:
            self.current_data[model_id][feature_name] = deque(maxlen=self.window_size)
        
        self.current_data[model_id][feature_name].append(value)
    
    def detect_drift(self, model_id: str, feature_name: str) -> Dict[str, Any]:
        """Detect drift for a specific model feature.
        
        Args:
            model_id: Model identifier
            feature_name: Feature name
            
        Returns:
            Drift detection results
        """
        if (model_id not in self.reference_data or 
            feature_name not in self.reference_data[model_id] or
            model_id not in self.current_data or
            feature_name not in self.current_data[model_id]):
            return {'drift_detected': False, 'reason': 'insufficient_data'}
        
        reference = self.reference_data[model_id][feature_name]
        current = list(self.current_data[model_id][feature_name])
        
        if len(current) < 30:  # Need minimum samples for statistical test
            return {'drift_detected': False, 'reason': 'insufficient_current_data'}
        
        # Perform Kolmogorov-Smirnov test
        ks_statistic, p_value = stats.ks_2samp(reference['data'], current)
        
        # Calculate distribution statistics
        current_mean = np.mean(current)
        current_std = np.std(current)
        
        # Mean shift detection
        mean_shift = abs(current_mean - reference['mean']) / max(reference['std'], 0.001)
        
        # Variance change detection
        variance_ratio = current_std / max(reference['std'], 0.001)
        
        # Overall drift score
        drift_score = max(ks_statistic, mean_shift * 0.1)
        
        drift_detected = (
            p_value < self.sensitivity or 
            mean_shift > 2.0 or  # 2 sigma change in mean
            variance_ratio > 2.0 or variance_ratio < 0.5  # 2x change in variance
        )
        
        return {
            'drift_detected': drift_detected,
            'drift_score': drift_score,
            'ks_statistic': ks_statistic,
            'p_value': p_value,
            'mean_shift': mean_shift,
            'variance_ratio': variance_ratio,
            'current_mean': current_mean,
            'reference_mean': reference['mean'],
            'current_std': current_std,
            'reference_std': reference['std']
        }

class AlertManager:
    """Manages alerts and notifications."""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize the alert manager.
        
        Args:
            redis_client: Redis client for alert storage
        """
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=4)
        self.alert_handlers = {}
        self.alert_rules = {}
        self.notification_channels = {}
        
    def register_alert_rule(self, rule_id: str, model_id: str, metric_name: str,
                           threshold_low: Optional[float] = None,
                           threshold_high: Optional[float] = None,
                           severity: AlertSeverity = AlertSeverity.MEDIUM,
                           handler: Optional[Callable] = None):
        """Register an alert rule.
        
        Args:
            rule_id: Unique rule identifier
            model_id: Model identifier (or '*' for all models)
            metric_name: Metric name to monitor
            threshold_low: Lower threshold for alerts
            threshold_high: Upper threshold for alerts
            severity: Alert severity
            handler: Custom alert handler function
        """
        self.alert_rules[rule_id] = {
            'model_id': model_id,
            'metric_name': metric_name,
            'threshold_low': threshold_low,
            'threshold_high': threshold_high,
            'severity': severity,
            'handler': handler,
            'created_at': datetime.now()
        }
        
        logger.info(f"Registered alert rule {rule_id} for {model_id}:{metric_name}")
    
    def add_notification_channel(self, channel_id: str, channel_type: str, config: Dict[str, Any]):
        """Add a notification channel.
        
        Args:
            channel_id: Channel identifier
            channel_type: Type of channel ('email', 'slack', 'webhook')
            config: Channel configuration
        """
        self.notification_channels[channel_id] = {
            'type': channel_type,
            'config': config,
            'enabled': True
        }
        
        logger.info(f"Added notification channel {channel_id} of type {channel_type}")
    
    async def check_metric_against_rules(self, metric: PerformanceMetric) -> List[Alert]:
        """Check a metric against all applicable alert rules.
        
        Args:
            metric: Performance metric to check
            
        Returns:
            List of generated alerts
        """
        alerts = []
        
        for rule_id, rule in self.alert_rules.items():
            # Check if rule applies to this metric
            if (rule['model_id'] != '*' and rule['model_id'] != metric.model_id):
                continue
            
            if rule['metric_name'] != metric.metric_name:
                continue
            
            # Check thresholds
            alert_triggered = False
            violation_type = None
            threshold_value = None
            
            if rule['threshold_low'] is not None and metric.value < rule['threshold_low']:
                alert_triggered = True
                violation_type = 'below_threshold'
                threshold_value = rule['threshold_low']
            elif rule['threshold_high'] is not None and metric.value > rule['threshold_high']:
                alert_triggered = True
                violation_type = 'above_threshold'
                threshold_value = rule['threshold_high']
            
            if alert_triggered:
                alert = Alert(
                    alert_id=f"{rule_id}_{int(metric.timestamp.timestamp())}",
                    timestamp=metric.timestamp,
                    model_id=metric.model_id,
                    severity=rule['severity'],
                    alert_type=f"metric_{violation_type}",
                    title=f"{metric.metric_name} {violation_type} for {metric.model_id}",
                    description=f"Metric {metric.metric_name} value {metric.value:.4f} "
                               f"is {violation_type.replace('_', ' ')} {threshold_value}",
                    current_value=metric.value,
                    threshold_value=threshold_value,
                    context={
                        'rule_id': rule_id,
                        'metric_context': metric.context
                    }
                )
                
                alerts.append(alert)
                
                # Execute custom handler if provided
                if rule['handler']:
                    try:
                        await rule['handler'](alert, metric)
                    except Exception as e:
                        logger.error(f"Error executing alert handler for rule {rule_id}: {e}")
        
        # Store alerts
        for alert in alerts:
            await self._store_alert(alert)
        
        return alerts
    
    async def _store_alert(self, alert: Alert):
        """Store alert in Redis."""
        alert_data = {
            'alert_id': alert.alert_id,
            'timestamp': alert.timestamp.isoformat(),
            'model_id': alert.model_id,
            'severity': alert.severity.value,
            'alert_type': alert.alert_type,
            'title': alert.title,
            'description': alert.description,
            'current_value': alert.current_value,
            'threshold_value': alert.threshold_value,
            'context': json.dumps(alert.context),
            'acknowledged': alert.acknowledged,
            'resolved': alert.resolved
        }
        
        # Store in multiple Redis structures for different queries
        self.redis_client.hset(f"alert:{alert.alert_id}", mapping=alert_data)
        self.redis_client.zadd(f"alerts:{alert.model_id}", {alert.alert_id: alert.timestamp.timestamp()})
        self.redis_client.zadd(f"alerts:severity:{alert.severity.value}", 
                              {alert.alert_id: alert.timestamp.timestamp()})
        
        # Set expiration (keep alerts for 30 days)
        self.redis_client.expire(f"alert:{alert.alert_id}", 30 * 24 * 3600)
        
        # Send notifications
        await self._send_notifications(alert)
    
    async def _send_notifications(self, alert: Alert):
        """Send notifications for an alert."""
        for channel_id, channel in self.notification_channels.items():
            if not channel['enabled']:
                continue
            
            try:
                if channel['type'] == 'email':
                    await self._send_email_notification(alert, channel['config'])
                elif channel['type'] == 'slack':
                    await self._send_slack_notification(alert, channel['config'])
                elif channel['type'] == 'webhook':
                    await self._send_webhook_notification(alert, channel['config'])
            except Exception as e:
                logger.error(f"Failed to send notification via {channel_id}: {e}")
    
    async def _send_email_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send email notification."""
        smtp_server = config.get('smtp_server', 'localhost')
        smtp_port = config.get('smtp_port', 587)
        username = config.get('username')
        password = config.get('password')
        recipients = config.get('recipients', [])
        
        if not recipients:
            return
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = config.get('from_email', username)
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = f"[{alert.severity.value.upper()}] FlexTime AI Alert: {alert.title}"
        
        body = f"""
        Alert Details:
        Model: {alert.model_id}
        Severity: {alert.severity.value}
        Time: {alert.timestamp}
        
        Description: {alert.description}
        
        Current Value: {alert.current_value}
        Threshold: {alert.threshold_value}
        
        Please investigate and take appropriate action.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            if username and password:
                server.starttls()
                server.login(username, password)
            server.send_message(msg)
    
    async def _send_slack_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send Slack notification."""
        # Would implement Slack webhook integration
        logger.info(f"Slack notification for alert {alert.alert_id} (not implemented)")
    
    async def _send_webhook_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send webhook notification."""
        # Would implement generic webhook
        logger.info(f"Webhook notification for alert {alert.alert_id} (not implemented)")
    
    async def get_recent_alerts(self, model_id: Optional[str] = None, 
                               hours: int = 24) -> List[Alert]:
        """Get recent alerts.
        
        Args:
            model_id: Filter by model ID (optional)
            hours: Number of hours to look back
            
        Returns:
            List of recent alerts
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        if model_id:
            alert_ids = self.redis_client.zrangebyscore(
                f"alerts:{model_id}",
                cutoff_time.timestamp(),
                datetime.now().timestamp()
            )
        else:
            # Get from all severity levels
            alert_ids = set()
            for severity in AlertSeverity:
                ids = self.redis_client.zrangebyscore(
                    f"alerts:severity:{severity.value}",
                    cutoff_time.timestamp(),
                    datetime.now().timestamp()
                )
                alert_ids.update(ids)
        
        # Retrieve alert details
        alerts = []
        for alert_id in alert_ids:
            alert_data = self.redis_client.hgetall(f"alert:{alert_id}")
            if alert_data:
                alert = Alert(
                    alert_id=alert_data[b'alert_id'].decode(),
                    timestamp=datetime.fromisoformat(alert_data[b'timestamp'].decode()),
                    model_id=alert_data[b'model_id'].decode(),
                    severity=AlertSeverity(alert_data[b'severity'].decode()),
                    alert_type=alert_data[b'alert_type'].decode(),
                    title=alert_data[b'title'].decode(),
                    description=alert_data[b'description'].decode(),
                    current_value=float(alert_data[b'current_value']),
                    threshold_value=float(alert_data[b'threshold_value']),
                    context=json.loads(alert_data[b'context'].decode()),
                    acknowledged=alert_data[b'acknowledged'].decode() == 'True',
                    resolved=alert_data[b'resolved'].decode() == 'True'
                )
                alerts.append(alert)
        
        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)

class ModelPerformanceMonitor:
    """Main performance monitoring system for AI/ML models."""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize the performance monitor.
        
        Args:
            redis_client: Redis client for data storage
        """
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=4)
        self.drift_detector = DriftDetector()
        self.alert_manager = AlertManager(redis_client)
        self.monitoring_active = False
        self.metrics_buffer = defaultdict(list)
        self.system_metrics = {}
        
        # Setup default alert rules
        self._setup_default_alert_rules()
    
    def _setup_default_alert_rules(self):
        """Setup default alert rules for common metrics."""
        # Error rate alerts
        self.alert_manager.register_alert_rule(
            'high_error_rate',
            '*',  # All models
            'error_rate',
            threshold_high=0.1,  # 10% error rate
            severity=AlertSeverity.HIGH
        )
        
        # Response time alerts
        self.alert_manager.register_alert_rule(
            'high_latency',
            '*',
            'response_time_ms',
            threshold_high=1000,  # 1 second
            severity=AlertSeverity.MEDIUM
        )
        
        # Memory usage alerts
        self.alert_manager.register_alert_rule(
            'high_memory_usage',
            '*',
            'memory_usage_mb',
            threshold_high=1024,  # 1GB
            severity=AlertSeverity.MEDIUM
        )
        
        # Prediction confidence alerts
        self.alert_manager.register_alert_rule(
            'low_prediction_confidence',
            '*',
            'avg_confidence',
            threshold_low=0.7,  # 70% confidence
            severity=AlertSeverity.LOW
        )
    
    async def start_monitoring(self):
        """Start the monitoring system."""
        self.monitoring_active = True
        logger.info("Started AI/ML performance monitoring")
        
        # Start monitoring tasks
        await asyncio.gather(
            self._metrics_collection_loop(),
            self._drift_detection_loop(),
            self._system_health_loop(),
            self._alert_processing_loop()
        )
    
    async def stop_monitoring(self):
        """Stop the monitoring system."""
        self.monitoring_active = False
        logger.info("Stopped AI/ML performance monitoring")
    
    async def record_prediction_metric(self, model_id: str, prediction_time: float,
                                     response_time_ms: float, confidence: float,
                                     error_occurred: bool = False,
                                     memory_usage_mb: float = 0.0,
                                     features: Optional[Dict[str, float]] = None):
        """Record a prediction metric.
        
        Args:
            model_id: Model identifier
            prediction_time: Time of prediction (timestamp)
            response_time_ms: Response time in milliseconds
            confidence: Prediction confidence
            error_occurred: Whether an error occurred
            memory_usage_mb: Memory usage in MB
            features: Feature values for drift detection
        """
        timestamp = datetime.fromtimestamp(prediction_time)
        
        # Create performance metrics
        metrics = [
            PerformanceMetric(timestamp, model_id, 'response_time_ms', response_time_ms),
            PerformanceMetric(timestamp, model_id, 'confidence', confidence),
            PerformanceMetric(timestamp, model_id, 'error_rate', 1.0 if error_occurred else 0.0),
            PerformanceMetric(timestamp, model_id, 'memory_usage_mb', memory_usage_mb)
        ]
        
        # Store metrics
        for metric in metrics:
            await self._store_metric(metric)
            
            # Buffer for batch processing
            self.metrics_buffer[model_id].append(metric)
        
        # Record features for drift detection
        if features:
            for feature_name, value in features.items():
                self.drift_detector.add_current_data(model_id, feature_name, value)
    
    async def _store_metric(self, metric: PerformanceMetric):
        """Store a metric in Redis."""
        metric_key = f"metrics:{metric.model_id}:{metric.metric_name}"
        
        metric_data = {
            'timestamp': metric.timestamp.isoformat(),
            'value': metric.value,
            'context': json.dumps(metric.context)
        }
        
        # Store as time series data
        self.redis_client.zadd(
            metric_key,
            {json.dumps(metric_data): metric.timestamp.timestamp()}
        )
        
        # Keep only last 7 days of data
        cutoff_time = datetime.now() - timedelta(days=7)
        self.redis_client.zremrangebyscore(metric_key, 0, cutoff_time.timestamp())
    
    async def _metrics_collection_loop(self):
        """Main metrics collection and processing loop."""
        while self.monitoring_active:
            try:
                # Process buffered metrics
                for model_id, metrics in self.metrics_buffer.items():
                    if metrics:
                        await self._process_model_metrics(model_id, metrics)
                        self.metrics_buffer[model_id].clear()
                
                await asyncio.sleep(60)  # Process every minute
                
            except Exception as e:
                logger.error(f"Error in metrics collection loop: {e}")
    
    async def _process_model_metrics(self, model_id: str, metrics: List[PerformanceMetric]):
        """Process metrics for a specific model."""
        # Calculate aggregate metrics
        response_times = [m.value for m in metrics if m.metric_name == 'response_time_ms']
        confidences = [m.value for m in metrics if m.metric_name == 'confidence']
        errors = [m.value for m in metrics if m.metric_name == 'error_rate']
        
        if response_times:
            avg_response_time = statistics.mean(response_times)
            await self._check_metric_alerts(PerformanceMetric(
                datetime.now(), model_id, 'avg_response_time_ms', avg_response_time
            ))
        
        if confidences:
            avg_confidence = statistics.mean(confidences)
            await self._check_metric_alerts(PerformanceMetric(
                datetime.now(), model_id, 'avg_confidence', avg_confidence
            ))
        
        if errors:
            error_rate = statistics.mean(errors)
            await self._check_metric_alerts(PerformanceMetric(
                datetime.now(), model_id, 'error_rate', error_rate
            ))
    
    async def _check_metric_alerts(self, metric: PerformanceMetric):
        """Check a metric against alert rules."""
        alerts = await self.alert_manager.check_metric_against_rules(metric)
        
        if alerts:
            logger.info(f"Generated {len(alerts)} alerts for {metric.model_id}:{metric.metric_name}")
    
    async def _drift_detection_loop(self):
        """Drift detection loop."""
        while self.monitoring_active:
            try:
                # Check for drift in all monitored models
                for model_id in self.drift_detector.current_data.keys():
                    await self._check_model_drift(model_id)
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in drift detection loop: {e}")
    
    async def _check_model_drift(self, model_id: str):
        """Check for drift in a specific model."""
        model_features = self.drift_detector.current_data.get(model_id, {})
        
        for feature_name in model_features.keys():
            drift_result = self.drift_detector.detect_drift(model_id, feature_name)
            
            if drift_result.get('drift_detected', False):
                # Create drift alert
                alert = Alert(
                    alert_id=f"drift_{model_id}_{feature_name}_{int(datetime.now().timestamp())}",
                    timestamp=datetime.now(),
                    model_id=model_id,
                    severity=AlertSeverity.HIGH,
                    alert_type="data_drift",
                    title=f"Data drift detected in {feature_name}",
                    description=f"Statistical drift detected in feature {feature_name} "
                               f"(drift score: {drift_result['drift_score']:.4f})",
                    current_value=drift_result['drift_score'],
                    threshold_value=self.drift_detector.sensitivity,
                    context={'drift_details': drift_result, 'feature_name': feature_name}
                )
                
                await self.alert_manager._store_alert(alert)
                logger.warning(f"Drift detected in {model_id}:{feature_name}")
    
    async def _system_health_loop(self):
        """System health monitoring loop."""
        while self.monitoring_active:
            try:
                # Collect system metrics
                cpu_percent = psutil.cpu_percent()
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                system_metrics = {
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'disk_percent': disk.percent,
                    'memory_available_gb': memory.available / (1024**3),
                    'disk_free_gb': disk.free / (1024**3)
                }
                
                self.system_metrics = system_metrics
                
                # Check system health thresholds
                if cpu_percent > 90:
                    await self._create_system_alert(
                        'high_cpu_usage',
                        f"High CPU usage: {cpu_percent:.1f}%",
                        cpu_percent,
                        90,
                        AlertSeverity.HIGH
                    )
                
                if memory.percent > 90:
                    await self._create_system_alert(
                        'high_memory_usage',
                        f"High memory usage: {memory.percent:.1f}%",
                        memory.percent,
                        90,
                        AlertSeverity.HIGH
                    )
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in system health loop: {e}")
    
    async def _create_system_alert(self, alert_type: str, description: str,
                                 current_value: float, threshold: float,
                                 severity: AlertSeverity):
        """Create a system-level alert."""
        alert = Alert(
            alert_id=f"system_{alert_type}_{int(datetime.now().timestamp())}",
            timestamp=datetime.now(),
            model_id="system",
            severity=severity,
            alert_type=alert_type,
            title=f"System Alert: {alert_type}",
            description=description,
            current_value=current_value,
            threshold_value=threshold,
            context={'system_metrics': self.system_metrics}
        )
        
        await self.alert_manager._store_alert(alert)
    
    async def _alert_processing_loop(self):
        """Alert processing and cleanup loop."""
        while self.monitoring_active:
            try:
                # Clean up old alerts
                cutoff_time = datetime.now() - timedelta(days=30)
                
                # Would implement alert cleanup logic here
                
                await asyncio.sleep(3600)  # Run every hour
                
            except Exception as e:
                logger.error(f"Error in alert processing loop: {e}")
    
    async def get_model_health_report(self, model_id: str) -> ModelHealthReport:
        """Generate comprehensive health report for a model.
        
        Args:
            model_id: Model identifier
            
        Returns:
            Model health report
        """
        # Get recent metrics
        metrics = await self._get_recent_metrics(model_id, hours=24)
        
        # Calculate performance metrics
        performance_metrics = {}
        if metrics:
            error_rates = [m.value for m in metrics if m.metric_name == 'error_rate']
            response_times = [m.value for m in metrics if m.metric_name == 'response_time_ms']
            confidences = [m.value for m in metrics if m.metric_name == 'confidence']
            
            performance_metrics = {
                'avg_error_rate': statistics.mean(error_rates) if error_rates else 0.0,
                'avg_response_time_ms': statistics.mean(response_times) if response_times else 0.0,
                'avg_confidence': statistics.mean(confidences) if confidences else 0.0,
                'prediction_count': len(metrics)
            }
        
        # Get drift scores
        drift_scores = {}
        if model_id in self.drift_detector.current_data:
            for feature_name in self.drift_detector.current_data[model_id].keys():
                drift_result = self.drift_detector.detect_drift(model_id, feature_name)
                drift_scores[feature_name] = drift_result.get('drift_score', 0.0)
        
        # Get recent alerts
        recent_alerts = await self.alert_manager.get_recent_alerts(model_id, hours=24)
        
        # Calculate overall health score
        health_score = self._calculate_health_score(performance_metrics, drift_scores, recent_alerts)
        
        # Determine status
        status = self._determine_model_status(health_score, recent_alerts)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(performance_metrics, drift_scores, recent_alerts)
        
        return ModelHealthReport(
            model_id=model_id,
            timestamp=datetime.now(),
            overall_health_score=health_score,
            status=status,
            performance_metrics=performance_metrics,
            drift_scores=drift_scores,
            recent_alerts=recent_alerts[:10],  # Last 10 alerts
            recommendations=recommendations,
            uptime_percentage=self._calculate_uptime(model_id),
            prediction_count_24h=performance_metrics.get('prediction_count', 0),
            error_rate_24h=performance_metrics.get('avg_error_rate', 0.0)
        )
    
    async def _get_recent_metrics(self, model_id: str, hours: int = 24) -> List[PerformanceMetric]:
        """Get recent metrics for a model."""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        metrics = []
        
        # Get metrics from Redis
        metric_names = ['error_rate', 'response_time_ms', 'confidence', 'memory_usage_mb']
        
        for metric_name in metric_names:
            metric_key = f"metrics:{model_id}:{metric_name}"
            
            metric_data = self.redis_client.zrangebyscore(
                metric_key,
                cutoff_time.timestamp(),
                datetime.now().timestamp()
            )
            
            for data in metric_data:
                try:
                    parsed_data = json.loads(data.decode())
                    metric = PerformanceMetric(
                        timestamp=datetime.fromisoformat(parsed_data['timestamp']),
                        model_id=model_id,
                        metric_name=metric_name,
                        value=parsed_data['value'],
                        context=json.loads(parsed_data.get('context', '{}'))
                    )
                    metrics.append(metric)
                except Exception as e:
                    logger.error(f"Error parsing metric data: {e}")
        
        return sorted(metrics, key=lambda x: x.timestamp)
    
    def _calculate_health_score(self, performance_metrics: Dict[str, float],
                               drift_scores: Dict[str, float],
                               recent_alerts: List[Alert]) -> float:
        """Calculate overall health score (0-1)."""
        score = 1.0
        
        # Performance impact
        error_rate = performance_metrics.get('avg_error_rate', 0.0)
        score -= min(error_rate * 2, 0.5)  # Max 50% penalty for errors
        
        response_time = performance_metrics.get('avg_response_time_ms', 0.0)
        if response_time > 1000:  # > 1 second
            score -= min((response_time - 1000) / 5000, 0.3)  # Max 30% penalty
        
        confidence = performance_metrics.get('avg_confidence', 1.0)
        if confidence < 0.8:
            score -= (0.8 - confidence) * 0.5  # Penalty for low confidence
        
        # Drift impact
        max_drift = max(drift_scores.values()) if drift_scores else 0.0
        score -= min(max_drift * 0.5, 0.3)  # Max 30% penalty for drift
        
        # Alert impact
        critical_alerts = [a for a in recent_alerts if a.severity == AlertSeverity.CRITICAL]
        high_alerts = [a for a in recent_alerts if a.severity == AlertSeverity.HIGH]
        
        score -= min(len(critical_alerts) * 0.1, 0.5)  # 10% per critical alert
        score -= min(len(high_alerts) * 0.05, 0.3)     # 5% per high alert
        
        return max(0.0, min(1.0, score))
    
    def _determine_model_status(self, health_score: float, recent_alerts: List[Alert]) -> ModelStatus:
        """Determine model status based on health score and alerts."""
        critical_alerts = [a for a in recent_alerts if a.severity == AlertSeverity.CRITICAL]
        
        if critical_alerts:
            return ModelStatus.CRITICAL
        elif health_score < 0.3:
            return ModelStatus.CRITICAL
        elif health_score < 0.6:
            return ModelStatus.WARNING
        elif health_score < 0.8:
            return ModelStatus.DEGRADED
        else:
            return ModelStatus.HEALTHY
    
    def _generate_recommendations(self, performance_metrics: Dict[str, float],
                                 drift_scores: Dict[str, float],
                                 recent_alerts: List[Alert]) -> List[str]:
        """Generate recommendations based on model health."""
        recommendations = []
        
        # Performance recommendations
        error_rate = performance_metrics.get('avg_error_rate', 0.0)
        if error_rate > 0.05:
            recommendations.append(
                f"High error rate ({error_rate:.1%}). Review input data quality and model validation."
            )
        
        response_time = performance_metrics.get('avg_response_time_ms', 0.0)
        if response_time > 1000:
            recommendations.append(
                f"High response time ({response_time:.0f}ms). Consider model optimization or scaling."
            )
        
        confidence = performance_metrics.get('avg_confidence', 1.0)
        if confidence < 0.7:
            recommendations.append(
                f"Low prediction confidence ({confidence:.1%}). Review model training or input features."
            )
        
        # Drift recommendations
        high_drift_features = [f for f, score in drift_scores.items() if score > 0.1]
        if high_drift_features:
            recommendations.append(
                f"Data drift detected in features: {', '.join(high_drift_features)}. "
                "Consider model retraining."
            )
        
        # Alert-based recommendations
        critical_alerts = [a for a in recent_alerts if a.severity == AlertSeverity.CRITICAL]
        if critical_alerts:
            recommendations.append(
                f"{len(critical_alerts)} critical alerts in the last 24 hours. "
                "Immediate attention required."
            )
        
        return recommendations
    
    def _calculate_uptime(self, model_id: str) -> float:
        """Calculate model uptime percentage."""
        # Simplified uptime calculation
        # In a real implementation, would track actual downtime
        return 99.5  # Assume 99.5% uptime
    
    def generate_dashboard_data(self) -> Dict[str, Any]:
        """Generate dashboard data for the monitoring system."""
        return {
            'system_status': 'active' if self.monitoring_active else 'inactive',
            'system_metrics': self.system_metrics,
            'monitored_models': list(self.drift_detector.current_data.keys()),
            'total_alert_rules': len(self.alert_manager.alert_rules),
            'notification_channels': len(self.alert_manager.notification_channels),
            'last_updated': datetime.now().isoformat()
        }

# Example usage and testing
async def example_usage():
    """Example of how to use the AI performance monitoring system."""
    # Initialize the monitor
    monitor = ModelPerformanceMonitor()
    
    # Setup email notifications (example configuration)
    monitor.alert_manager.add_notification_channel(
        'email_alerts',
        'email',
        {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'username': 'alerts@example.com',
            'password': 'app_password',
            'recipients': ['admin@example.com', 'ml-team@example.com']
        }
    )
    
    print("AI/ML Performance Monitoring Example")
    print("====================================")
    
    # Simulate some prediction metrics
    model_id = 'attendance_predictor_v1'
    
    # Normal operation
    await monitor.record_prediction_metric(
        model_id=model_id,
        prediction_time=time.time(),
        response_time_ms=250.0,
        confidence=0.85,
        error_occurred=False,
        memory_usage_mb=128.0,
        features={'team_rating': 0.8, 'rivalry_score': 0.6}
    )
    
    # Simulate degraded performance
    await monitor.record_prediction_metric(
        model_id=model_id,
        prediction_time=time.time(),
        response_time_ms=1500.0,  # High latency
        confidence=0.65,          # Low confidence
        error_occurred=False,
        memory_usage_mb=256.0,
        features={'team_rating': 0.9, 'rivalry_score': 0.8}  # Different distribution
    )
    
    # Get model health report
    health_report = await monitor.get_model_health_report(model_id)
    
    print(f"Model: {health_report.model_id}")
    print(f"Status: {health_report.status.value}")
    print(f"Health Score: {health_report.overall_health_score:.3f}")
    print(f"Error Rate: {health_report.error_rate_24h:.1%}")
    print(f"Predictions (24h): {health_report.prediction_count_24h}")
    print()
    
    print("Recommendations:")
    for rec in health_report.recommendations:
        print(f"  - {rec}")
    print()
    
    # Get dashboard data
    dashboard = monitor.generate_dashboard_data()
    print("System Overview:")
    print(f"  Status: {dashboard['system_status']}")
    print(f"  Monitored Models: {len(dashboard['monitored_models'])}")
    print(f"  Alert Rules: {dashboard['total_alert_rules']}")
    print(f"  Notification Channels: {dashboard['notification_channels']}")

if __name__ == "__main__":
    asyncio.run(example_usage())