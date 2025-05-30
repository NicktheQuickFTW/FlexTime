# Monitoring and Alerting Setup

## Overview

This document outlines the comprehensive monitoring and alerting setup for FlexTime scheduling system, including infrastructure monitoring, application performance monitoring, and automated alerting procedures.

## Monitoring Stack

### Core Components
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation and analysis
- **Datadog**: APM and infrastructure monitoring
- **Sentry**: Error tracking and performance monitoring

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus    │───▶│    Grafana      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Jaeger      │    │   ELK Stack     │    │   Alertmanager  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prometheus Configuration

### Prometheus Setup
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # FlexTime API metrics
  - job_name: 'flextime-api'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

  # Node exporter for infrastructure metrics
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        target_label: __address__
        regex: '(.*):(.*)'
        replacement: '${1}:9100'

  # PostgreSQL metrics
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis metrics
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Kubernetes cluster metrics
  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics:8080']
```

### Custom Metrics in Application
```javascript
// backend/src/utils/metrics.js
const prometheus = require('prom-client');

// Create custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const scheduleGenerationDuration = new prometheus.Histogram({
  name: 'schedule_generation_duration_seconds',
  help: 'Duration of schedule generation in seconds',
  labelNames: ['sport', 'team_count'],
  buckets: [1, 5, 10, 30, 60, 120, 300]
});

const constraintViolations = new prometheus.Counter({
  name: 'constraint_violations_total',
  help: 'Total number of constraint violations',
  labelNames: ['constraint_type', 'severity']
});

const activeSchedulingSessions = new prometheus.Gauge({
  name: 'active_scheduling_sessions',
  help: 'Number of active scheduling sessions'
});

const databaseConnectionPool = new prometheus.Gauge({
  name: 'database_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state'] // 'active', 'idle', 'waiting'
});

// Export metrics endpoint
const register = new prometheus.Registry();
register.registerMetric(httpRequestDuration);
register.registerMetric(scheduleGenerationDuration);
register.registerMetric(constraintViolations);
register.registerMetric(activeSchedulingSessions);
register.registerMetric(databaseConnectionPool);

module.exports = {
  httpRequestDuration,
  scheduleGenerationDuration,
  constraintViolations,
  activeSchedulingSessions,
  databaseConnectionPool,
  register
};
```

## Grafana Dashboards

### Main System Dashboard
```json
{
  "dashboard": {
    "title": "FlexTime System Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code!~\"2..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "format": "time_series"
          }
        ]
      },
      {
        "title": "Schedule Generation Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(schedule_generation_duration_seconds_bucket[10m]))",
            "legendFormat": "{{sport}} - {{team_count}} teams"
          }
        ]
      }
    ]
  }
}
```

### Infrastructure Dashboard
```json
{
  "dashboard": {
    "title": "FlexTime Infrastructure",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "database_connection_pool_size",
            "legendFormat": "{{state}}"
          }
        ]
      },
      {
        "title": "Kubernetes Pod Status",
        "type": "table",
        "targets": [
          {
            "expr": "kube_pod_status_phase",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

## Alert Rules

### Application Alerts
```yaml
# alerts/application.yml
groups:
- name: application
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code!~"2.."}[5m]) / rate(http_requests_total[5m]) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
      runbook: "https://wiki.flextime.com/runbooks/high-error-rate"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s for the last 5 minutes"

  - alert: ScheduleGenerationFailure
    expr: increase(schedule_generation_failures_total[5m]) > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Schedule generation failures detected"
      description: "{{ $value }} schedule generation failures in the last 5 minutes"

  - alert: ConstraintViolationSpike
    expr: rate(constraint_violations_total[5m]) > 10
    for: 3m
    labels:
      severity: warning
    annotations:
      summary: "High constraint violation rate"
      description: "Constraint violations are occurring at {{ $value }} per second"

  - alert: DatabaseConnectionPoolExhaustion
    expr: database_connection_pool_size{state="waiting"} > 5
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Database connection pool exhaustion"
      description: "{{ $value }} connections waiting in the pool"
```

### Infrastructure Alerts
```yaml
# alerts/infrastructure.yml
groups:
- name: infrastructure
  rules:
  - alert: HighCPUUsage
    expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage"
      description: "CPU usage on {{ $labels.instance }} is {{ $value }}%"

  - alert: HighMemoryUsage
    expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Memory usage on {{ $labels.instance }} is {{ $value }}%"

  - alert: DiskSpaceLow
    expr: (node_filesystem_free_bytes / node_filesystem_size_bytes) * 100 < 10
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Low disk space"
      description: "Disk space on {{ $labels.instance }} is {{ $value }}% full"

  - alert: KubernetesPodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Pod is crash looping"
      description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"

  - alert: KubernetesNodeNotReady
    expr: kube_node_status_condition{condition="Ready",status="true"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Kubernetes node not ready"
      description: "Node {{ $labels.node }} is not ready"
```

### Database Alerts
```yaml
# alerts/database.yml
groups:
- name: database
  rules:
  - alert: DatabaseDown
    expr: up{job="postgres-exporter"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database is down"
      description: "PostgreSQL database is not responding"

  - alert: DatabaseSlowQueries
    expr: pg_stat_activity_max_tx_duration > 300
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Database slow queries detected"
      description: "Queries running longer than 5 minutes detected"

  - alert: DatabaseConnectionsHigh
    expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High database connections"
      description: "Database connections are at {{ $value | humanizePercentage }} of maximum"

  - alert: DatabaseReplicationLag
    expr: pg_replication_lag > 30
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database replication lag"
      description: "Replication lag is {{ $value }} seconds"
```

## Alertmanager Configuration

### Alert Routing
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@flextime.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/'

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@flextime.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
  slack_configs:
  - api_url: '{{ .SlackWebhookURL }}'
    channel: '#alerts-critical'
    title: 'CRITICAL Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'warning-alerts'
  email_configs:
  - to: 'team@flextime.com'
    subject: 'WARNING: {{ .GroupLabels.alertname }}'
  slack_configs:
  - api_url: '{{ .SlackWebhookURL }}'
    channel: '#alerts'
    title: 'Warning Alert'
```

## Log Aggregation (ELK Stack)

### Elasticsearch Configuration
```yaml
# elasticsearch.yml
cluster.name: flextime-logs
node.name: es-node-1
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node

# Security settings
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

### Logstash Pipeline
```ruby
# logstash/pipeline/flextime.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "flextime-api" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} \[%{DATA:component}\] %{GREEDYDATA:message}" }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    # Parse JSON logs
    if [level] == "INFO" and [message] =~ /^\{/ {
      json {
        source => "message"
        target => "parsed"
      }
    }
  }
  
  # Add environment tags
  mutate {
    add_field => { "environment" => "production" }
    add_field => { "service" => "flextime" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "flextime-logs-%{+YYYY.MM.dd}"
  }
}
```

### Kibana Dashboards
```json
{
  "version": "7.15.0",
  "objects": [
    {
      "id": "flextime-logs-overview",
      "type": "dashboard",
      "attributes": {
        "title": "FlexTime Logs Overview",
        "panelsJSON": "[{\"panelIndex\":\"1\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15},\"id\":\"error-logs-timeline\"}]"
      }
    }
  ]
}
```

## Distributed Tracing (Jaeger)

### Tracer Configuration
```javascript
// backend/src/utils/tracing.js
const { initTracer } = require('jaeger-client');

const config = {
  serviceName: 'flextime-api',
  sampler: {
    type: 'const',
    param: 1
  },
  reporter: {
    logSpans: true,
    agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
    agentPort: process.env.JAEGER_AGENT_PORT || 6832
  }
};

const tracer = initTracer(config);

// Middleware for Express
const tracingMiddleware = (req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  span.setTag('user.id', req.user?.id);
  
  req.span = span;
  
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    if (res.statusCode >= 400) {
      span.setTag('error', true);
    }
    span.finish();
  });
  
  next();
};

module.exports = { tracer, tracingMiddleware };
```

## Health Checks

### Application Health Check
```javascript
// backend/src/routes/health.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const redis = require('redis');

const pool = new Pool();
const redisClient = redis.createClient();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Database check
  try {
    await pool.query('SELECT 1');
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  // Redis check
  try {
    await redisClient.ping();
    health.checks.redis = { status: 'healthy' };
  } catch (error) {
    health.checks.redis = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  // External services check
  // Add checks for external APIs, file systems, etc.

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', (req, res) => {
  // Readiness check - can the service handle requests?
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

router.get('/live', (req, res) => {
  // Liveness check - is the service alive?
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

module.exports = router;
```

## Monitoring Deployment

### Kubernetes Monitoring Stack
```bash
# Deploy monitoring namespace
kubectl create namespace monitoring

# Deploy Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --values monitoring/prometheus-values.yaml

# Deploy Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --namespace monitoring \
  --values monitoring/grafana-values.yaml

# Deploy Jaeger
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger \
  --namespace monitoring

# Deploy ELK Stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch --namespace monitoring
helm install kibana elastic/kibana --namespace monitoring
helm install logstash elastic/logstash --namespace monitoring
```

## Troubleshooting

### Common Issues

#### High Memory Usage in Prometheus
```bash
# Check Prometheus memory usage
kubectl top pod -l app=prometheus -n monitoring

# Reduce retention period
kubectl patch configmap prometheus-config -n monitoring \
  --patch '{"data":{"prometheus.yml":"...\n  retention: 7d\n..."}}'
```

#### Missing Metrics
```bash
# Check service discovery
kubectl logs -l app=prometheus -n monitoring | grep "discovery"

# Verify pod annotations
kubectl get pods -o yaml | grep prometheus.io
```

#### Alert Not Firing
```bash
# Check alert rules
kubectl exec -it prometheus-0 -n monitoring -- promtool query instant 'up'

# Check Alertmanager
kubectl logs -l app=alertmanager -n monitoring
```

## Documentation Links

- [Performance Optimization](performance-optimization.md)
- [Backup and Recovery Procedures](backup-recovery.md)
- [Security Configuration](security-configuration.md)
- [Capacity Planning](capacity-planning.md)