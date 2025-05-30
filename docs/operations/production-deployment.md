# Production Deployment Procedures

## Overview

This guide covers the complete production deployment procedures for FlexTime scheduling system, including infrastructure setup, application deployment, and post-deployment verification.

## Prerequisites

### Infrastructure Requirements
- Kubernetes cluster (1.24+) with minimum 3 nodes
- PostgreSQL 13+ (managed service recommended)
- Redis 6+ with clustering enabled
- Load balancer with SSL termination
- CDN for static assets
- DNS management system

### Access Requirements
- kubectl configured for production cluster
- Docker registry access
- Database admin credentials
- SSL certificates
- Monitoring system access

### Tools Required
```bash
# Required CLI tools
kubectl >= 1.24
helm >= 3.8
docker >= 20.10
ansible >= 5.0
terraform >= 1.0
```

## Deployment Process

### 1. Pre-Deployment Checklist

Run the automated checklist:
```bash
cd deployment/scripts
./pre-deployment-checklist.sh
```

Manual verification:
- [ ] Database backup completed
- [ ] Current system health verified
- [ ] All required environment variables configured
- [ ] SSL certificates valid and deployed
- [ ] Monitoring systems operational
- [ ] Rollback plan confirmed
- [ ] Stakeholder notification sent

### 2. Infrastructure Deployment

#### Using Terraform
```bash
cd deployment/terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan -var-file=environments/production.tfvars

# Apply infrastructure changes
terraform apply -var-file=environments/production.tfvars
```

#### Using Ansible
```bash
cd deployment/ansible

# Deploy base infrastructure
ansible-playbook -i inventory/production.ini playbooks/infrastructure.yml

# Deploy application-specific infrastructure
ansible-playbook -i inventory/production.ini playbooks/site.yml
```

### 3. Database Migration

#### Production Database Setup
```bash
# Connect to production database
export DATABASE_URL="postgresql://user:pass@prod-db:5432/flextime"

# Run migrations
cd backend
npm run migrate:prod

# Verify migration status
npm run migrate:status
```

#### Migration Rollback Plan
```bash
# Create rollback migration if needed
npm run migrate:create -- rollback_$(date +%Y%m%d)

# Test rollback in staging first
npm run migrate:rollback:test
```

### 4. Application Deployment

#### Kubernetes Deployment
```bash
cd deployment/kubernetes

# Create/update namespace
kubectl apply -f manifests/namespace.yaml

# Deploy secrets and config maps
kubectl apply -f manifests/secret.yaml
kubectl apply -f manifests/configmap.yaml

# Deploy application services
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests/ingress.yaml

# Deploy horizontal pod autoscaler
kubectl apply -f manifests/hpa.yaml
```

#### Using Helm
```bash
cd deployment/kubernetes/helm-charts

# Install/upgrade FlexTime application
helm upgrade --install flextime ./flextime \
  --namespace flextime-prod \
  --values environments/production/values.yaml \
  --wait --timeout=10m
```

#### Blue-Green Deployment
```bash
cd deployment/production/blue-green

# Deploy to green environment
./deploy-green.sh

# Run smoke tests
./test-green.sh

# Switch traffic to green
./switch-to-green.sh

# Cleanup blue environment
./cleanup-blue.sh
```

### 5. Post-Deployment Verification

#### Health Checks
```bash
# Check pod status
kubectl get pods -n flextime-prod

# Check service endpoints
kubectl get endpoints -n flextime-prod

# Check ingress status
kubectl get ingress -n flextime-prod
```

#### Application Health
```bash
# API health check
curl -f https://api.flextime.com/health

# Database connectivity
curl -f https://api.flextime.com/api/status/database

# Redis connectivity
curl -f https://api.flextime.com/api/status/redis

# Full system status
curl -f https://api.flextime.com/api/status/system
```

#### Performance Verification
```bash
# Load test key endpoints
cd deployment/scripts/monitoring
./performance-test.sh production
```

## Environment-Specific Configurations

### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.flextime.com

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/flextime
DATABASE_POOL_SIZE=20
DATABASE_CONNECTION_TIMEOUT=10000

# Redis
REDIS_URL=redis://prod-redis-cluster:6379
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379

# Security
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGIN=https://flextime.com,https://app.flextime.com

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
DATADOG_API_KEY=${DATADOG_API_KEY}
LOG_LEVEL=info

# Features
ENABLE_ANALYTICS=true
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
```

### Scaling Configuration
```yaml
# HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flextime-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: flextime-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Rollback Procedures

### Automated Rollback
```bash
cd deployment/scripts/rollback

# Quick rollback to previous version
./rollback.sh --version=previous

# Rollback to specific version
./rollback.sh --version=v1.2.3

# Emergency rollback with database restore
./rollback.sh --version=v1.2.3 --restore-db
```

### Manual Rollback Steps
1. **Stop traffic to current version**
   ```bash
   kubectl patch ingress flextime-ingress -p '{"spec":{"rules":[]}}'
   ```

2. **Deploy previous version**
   ```bash
   helm rollback flextime --namespace flextime-prod
   ```

3. **Verify rollback**
   ```bash
   ./verify-rollback.sh
   ```

4. **Restore traffic**
   ```bash
   kubectl apply -f manifests/ingress.yaml
   ```

## Security Considerations

### SSL/TLS Configuration
- Use TLS 1.2+ only
- Implement HSTS headers
- Use strong cipher suites
- Regular certificate rotation

### Network Security
```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: flextime-network-policy
spec:
  podSelector:
    matchLabels:
      app: flextime
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 3000
```

### RBAC Configuration
```yaml
# Service account with minimal permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flextime-api
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: flextime-api-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
```

## Monitoring Integration

### Deployment Metrics
```bash
# Custom metrics for deployment tracking
kubectl create configmap deployment-metrics \
  --from-literal=deployment_version=${VERSION} \
  --from-literal=deployment_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
```

### Alert Configuration
```yaml
# Deployment failure alert
groups:
- name: deployment
  rules:
  - alert: DeploymentFailed
    expr: kube_deployment_status_replicas_unavailable > 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Deployment {{ $labels.deployment }} has unavailable replicas"
```

## Troubleshooting

### Common Issues

#### Pod Startup Failures
```bash
# Check pod logs
kubectl logs -f deployment/flextime-api -n flextime-prod

# Check events
kubectl get events -n flextime-prod --sort-by='.lastTimestamp'

# Check resource constraints
kubectl describe pod -l app=flextime -n flextime-prod
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl run pg-test --rm -i --tty --image=postgres:13 -- \
  psql postgresql://user:pass@prod-db:5432/flextime

# Check connection pool status
curl https://api.flextime.com/api/debug/pool-status
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n flextime-prod

# Check HPA status
kubectl get hpa -n flextime-prod

# Check node resource allocation
kubectl describe nodes
```

### Emergency Procedures

#### Complete System Failure
1. **Activate disaster recovery**
   ```bash
   cd deployment/production/automation
   ./activate-dr.sh
   ```

2. **Restore from backup**
   ```bash
   ./restore-from-backup.sh --timestamp=latest
   ```

3. **Verify system integrity**
   ```bash
   ./verify-system-integrity.sh
   ```

#### Database Emergency
1. **Enable read-only mode**
   ```bash
   kubectl patch configmap flextime-config \
     -p '{"data":{"READ_ONLY_MODE":"true"}}'
   ```

2. **Restart application pods**
   ```bash
   kubectl rollout restart deployment/flextime-api -n flextime-prod
   ```

## Documentation Links

- [Monitoring and Alerting Setup](monitoring-alerting.md)
- [Backup and Recovery Procedures](backup-recovery.md)
- [Security Configuration](security-configuration.md)
- [Performance Optimization](performance-optimization.md)
- [Capacity Planning](capacity-planning.md)