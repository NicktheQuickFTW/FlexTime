# FlexTime Production Deployment Guide

## 🚀 Complete Production Readiness Implementation

This guide covers the comprehensive production deployment system implemented for FlexTime, following enterprise-grade practices and [Playbook: Production Readiness] specifications.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Components](#deployment-components)
4. [Deployment Process](#deployment-process)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Backup & Recovery](#backup--recovery)
7. [Security](#security)
8. [Health Checks](#health-checks)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS EKS Cluster                        │
├─────────────────────────────────────────────────────────────┤
│  Production Namespace (flextime-production)                │
│  ├── FlexTime API (4 replicas + HPA)                      │
│  ├── Redis Cache                                           │
│  └── Health Check Sidecar                                  │
├─────────────────────────────────────────────────────────────┤
│  Monitoring Namespace (flextime-monitoring)                │
│  ├── Prometheus + Alertmanager                            │
│  ├── Grafana Dashboards                                    │
│  └── Jaeger Tracing                                        │
├─────────────────────────────────────────────────────────────┤
│  Backup Namespace (flextime-backup)                        │
│  ├── Database Backup CronJobs                             │
│  ├── Application Backup                                    │
│  └── Volume Snapshots                                      │
├─────────────────────────────────────────────────────────────┤
│  Security Namespace (flextime-security)                    │
│  ├── External Secrets Operator                            │
│  ├── Network Policies                                      │
│  └── OPA Gatekeeper                                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Features Implemented

✅ **Configurable Worker Scaling** - No more hardcoded 20 workers per task  
✅ **Comprehensive Monitoring** - Prometheus, Grafana, Alertmanager  
✅ **Automated Backups** - Database, application state, and volume snapshots  
✅ **Security Hardening** - Network policies, RBAC, secret management  
✅ **Health Monitoring** - Multi-tier health checks with circuit breakers  
✅ **CI/CD Pipeline** - Automated testing, building, and deployment  

## 🔧 Prerequisites

### Required Tools
```bash
# Install required CLI tools
kubectl >= 1.28
helm >= 3.12
aws-cli >= 2.13
docker >= 24.0
```

### AWS Resources
- EKS Cluster (1.28+)
- RDS PostgreSQL (or Neon Database)
- S3 Bucket for backups
- IAM roles for service accounts
- Route53 for DNS (optional)

### Environment Variables
```bash
# Required secrets in AWS Secrets Manager
/flextime/production/database/connection_url
/flextime/production/database/username  
/flextime/production/database/password
/flextime/production/api-keys/anthropic_key
/flextime/production/api-keys/notion_token
/flextime/production/security/jwt_secret
```

## 🎯 Deployment Components

### 1. Production Deployment (`production-deployment.yaml`)

**Features:**
- 4 replica pods with HPA (4-20 replicas)
- Configurable worker scaling (default: 15 workers per task)
- Resource requests/limits: 500m-2000m CPU, 1-4Gi memory
- Security context: non-root, read-only filesystem
- Pod anti-affinity for high availability
- Comprehensive probes (startup, liveness, readiness)

**Configuration:**
```yaml
env:
  MAX_WORKERS_PER_TASK: "15"
  MAX_PARALLEL_OPERATIONS: "15"
  USE_PARALLEL_SCHEDULING: "true"
```

### 2. Monitoring Stack (`monitoring-stack.yaml`)

**Components:**
- **Prometheus**: Metrics collection with 30-day retention
- **Grafana**: Dashboards with admin authentication
- **Alertmanager**: Email and Slack notifications
- **Custom Alerts**: API health, memory usage, error rates

**Key Alerts:**
- API down for >1 minute
- Memory usage >85% for >5 minutes
- Error rate >5% for >2 minutes
- Slow response time >2s for >3 minutes

### 3. Backup & Recovery (`backup-recovery.yaml`)

**Automated Backups:**
- **Database**: Daily at 2 AM UTC (30-day retention)
- **Application**: Daily at 3 AM UTC (Kubernetes resources)
- **Volume Snapshots**: Weekly on Sunday at 1 AM UTC
- **S3 Storage**: All backups stored in `flextime-production-backups`

**Recovery Procedures:**
```bash
# Restore from backup
kubectl exec -it backup-pod -- bash /scripts/disaster-recovery.sh 20241201_020000
```

### 4. Security & Secrets (`security-secrets.yaml`)

**Security Features:**
- External Secrets Operator for AWS Secrets Manager
- Network policies restricting pod communication
- RBAC with minimal permissions
- TLS certificates via cert-manager
- OPA Gatekeeper policy enforcement
- Security context constraints

**Image Security:**
- Only approved repositories allowed
- Trivy vulnerability scanning
- SBOM generation
- Non-root containers only

### 5. Health Checks (`health-checks.yaml`)

**Multi-Tier Health Monitoring:**
- **Liveness**: Process health (`/health/live`)
- **Readiness**: Service readiness (`/health/ready`)
- **Deep Health**: Database, Redis, memory, CPU (`/health`)
- **Circuit Breaker**: Automatic failure protection
- **Chaos Engineering**: Periodic resilience testing

**Metrics Export:**
```
flextime_health_check{check="database"} 1
flextime_health_check_duration_seconds{check="database"} 0.043
```

## 🚀 Deployment Process

### 1. Initial Setup

```bash
# 1. Apply namespaces and RBAC
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# 2. Setup security and secrets
kubectl apply -f infrastructure/kubernetes/security-secrets.yaml

# 3. Deploy monitoring stack
kubectl apply -f infrastructure/kubernetes/monitoring-stack.yaml

# 4. Setup backup system
kubectl apply -f infrastructure/kubernetes/backup-recovery.yaml

# 5. Deploy health monitoring
kubectl apply -f infrastructure/kubernetes/health-checks.yaml
```

### 2. Application Deployment

```bash
# Deploy main application
kubectl apply -f infrastructure/kubernetes/production-deployment.yaml

# Wait for rollout to complete
kubectl rollout status deployment/flextime-api -n flextime-production --timeout=600s

# Verify health
kubectl get pods -n flextime-production
kubectl logs -l app=flextime -n flextime-production
```

### 3. Verification

```bash
# Check health endpoints
curl -f http://$(kubectl get svc flextime-health-service -n flextime-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'):3006/health

# Check API status
curl -f http://$(kubectl get svc flextime-api-service -n flextime-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/api/status

# Monitor metrics
kubectl port-forward -n flextime-monitoring svc/prometheus 9090:9090
# Open http://localhost:9090
```

## 📊 Monitoring & Alerting

### Prometheus Targets
- Kubernetes API server
- Node metrics (cAdvisor)
- FlexTime API application metrics
- Health check metrics

### Grafana Dashboards
- System Overview Dashboard
- Constraint Monitoring Dashboard
- API Performance Dashboard
- Health Check Dashboard

### Alert Channels
- **Email**: ops-team@flextime.app (critical), dev-team@flextime.app (warnings)
- **Slack**: #alerts-critical, #alerts-warning
- **Webhook**: Integration with incident management

### Key Metrics
```promql
# API health
up{job="flextime-api"}

# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.*"}[5m]) / rate(http_requests_total[5m]) * 100

# Worker utilization
flextime_workers_active / flextime_workers_total * 100
```

## 💾 Backup & Recovery

### Backup Schedule
```
Database:     Daily 2:00 AM UTC (30-day retention)
Application:  Daily 3:00 AM UTC (Kubernetes configs)
Volumes:      Weekly Sunday 1:00 AM UTC (4-week retention)
```

### Recovery Procedures

#### Database Recovery
```bash
# List available backups
aws s3 ls s3://flextime-production-backups/database/

# Restore specific backup
kubectl create job --from=cronjob/database-backup restore-20241201 -n flextime-backup
kubectl exec -it job/restore-20241201 -- /scripts/disaster-recovery.sh 20241201_020000
```

#### Application Recovery
```bash
# Download Kubernetes backup
aws s3 cp s3://flextime-production-backups/kubernetes/flextime_k8s_backup_20241201_030000.tar.gz .

# Extract and review
tar -xzf flextime_k8s_backup_20241201_030000.tar.gz
ls -la *.yaml

# Apply configurations
kubectl apply -f deployments.yaml
kubectl apply -f services.yaml
```

## 🔒 Security

### Network Security
- Network policies restricting ingress/egress
- TLS termination at ingress
- Internal service-to-service encryption

### Access Control
- RBAC with minimal privileges
- Service accounts for each component
- No root access in containers

### Secret Management
- AWS Secrets Manager integration
- Automatic secret rotation
- No hardcoded secrets in code

### Compliance
- Pod Security Standards (restricted)
- OPA Gatekeeper policy enforcement
- Regular security scanning
- SBOM generation for supply chain security

## 🏥 Health Checks

### Health Check Hierarchy
1. **Kubernetes Probes**: Basic container health
2. **Application Health**: Service functionality
3. **Dependency Health**: Database, Redis, external services
4. **Business Logic Health**: Constraint system, agent system

### Circuit Breaker Pattern
```javascript
// Automatic failure protection
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
});
```

### Chaos Engineering
- Automated resilience testing every 6 hours
- Network delay injection
- Random pod termination
- Automated recovery verification

## 🔄 CI/CD Pipeline

### Pipeline Stages
1. **Security Scan**: Code analysis, dependency audit
2. **Testing**: Unit, integration, security tests
3. **Build**: Docker image creation and scanning
4. **Deploy Staging**: Automated staging deployment
5. **Deploy Production**: Manual approval required
6. **Performance Test**: Load testing post-deployment

### Deployment Triggers
- **Staging**: Push to `master` branch
- **Production**: Git tags matching `v*` pattern
- **Rollback**: Manual workflow dispatch

### Quality Gates
- All tests must pass
- Security scans must pass
- Code coverage >80%
- Performance benchmarks met

## 🔧 Troubleshooting

### Common Issues

#### Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n flextime-production

# Check logs
kubectl logs <pod-name> -n flextime-production

# Check events
kubectl get events -n flextime-production --sort-by='.lastTimestamp'
```

#### Health Check Failures
```bash
# Direct health check
kubectl exec -it <pod-name> -n flextime-production -- curl localhost:3005/health

# Check sidecar health
kubectl logs <pod-name> -c health-sidecar -n flextime-production
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it <pod-name> -n flextime-production -- nslookup <database-host>

# Check secrets
kubectl get secret flextime-secrets -n flextime-production -o yaml
```

#### Performance Issues
```bash
# Check resource utilization
kubectl top pods -n flextime-production

# Check HPA status
kubectl get hpa -n flextime-production

# View metrics
kubectl port-forward -n flextime-monitoring svc/prometheus 9090:9090
```

### Emergency Procedures

#### Scale Down Immediately
```bash
kubectl scale deployment flextime-api --replicas=0 -n flextime-production
```

#### Emergency Rollback
```bash
kubectl rollout undo deployment/flextime-api -n flextime-production
kubectl rollout status deployment/flextime-api -n flextime-production
```

#### Circuit Breaker Reset
```bash
kubectl exec -it <pod-name> -n flextime-production -- curl -X POST localhost:3005/health/circuit-breaker/reset
```

## 📈 Performance Tuning

### Resource Optimization
- **CPU**: Start with 500m request, 2000m limit
- **Memory**: Start with 1Gi request, 4Gi limit
- **Workers**: Default 15 workers per task (configurable via `MAX_WORKERS_PER_TASK`)

### Scaling Configuration
```yaml
# HPA settings
minReplicas: 4
maxReplicas: 20
targetCPUUtilizationPercentage: 65
targetMemoryUtilizationPercentage: 75
```

### Database Tuning
- Connection pool: max 100, min 10
- Query timeout: 30 seconds
- Health check interval: 10 seconds

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [FlexTime Playbook](../FlexTime_Playbook.md)
- [Development Roadmap](../development/development_roadmap.md)

## 🏁 Conclusion

This production deployment system provides:

✅ **Enterprise-grade reliability** with 99.9% uptime target  
✅ **Comprehensive monitoring** with proactive alerting  
✅ **Automated disaster recovery** with <4 hour RTO  
✅ **Security hardening** following industry best practices  
✅ **Scalable architecture** supporting 10x traffic growth  
✅ **Zero-downtime deployments** with automated rollback  

The system is now production-ready and follows all enterprise deployment standards with configurable worker scaling replacing the previous hardcoded implementation.