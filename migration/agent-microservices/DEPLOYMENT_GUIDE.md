# FlexTime Agent Microservices Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the FlexTime agent microservices architecture. Choose the deployment method that best fits your environment and requirements.

## Prerequisites

### Required Tools

```bash
# Install required CLI tools
curl -LO https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

curl -sSL https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64 -o argocd
chmod +x argocd && sudo mv argocd /usr/local/bin/

docker --version  # Ensure Docker is installed
```

### Environment Requirements

- **Kubernetes Cluster**: v1.26+ (local or cloud)
- **Docker**: v24.0+
- **Node.js**: v18+
- **PostgreSQL**: v13+
- **Redis**: v7+

## Deployment Options

### Option 1: Local Development with Docker Compose

#### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/flextime.git
cd flextime/migration/agent-microservices

# Start infrastructure services
docker-compose -f docker/docker-compose.microservices.yml up -d redis postgres

# Wait for services to be healthy
docker-compose -f docker/docker-compose.microservices.yml ps

# Build and start microservices
docker-compose -f docker/docker-compose.microservices.yml up --build
```

#### Service URLs

- Communication Hub: http://localhost:3001
- Scheduler Service: http://localhost:3002
- Conflict Resolution: http://localhost:3003
- Travel Optimization: http://localhost:3004
- Constraint Management: http://localhost:3005
- Intelligence Engine: http://localhost:3006
- State Management: http://localhost:3007

#### Health Checks

```bash
# Check all services are healthy
curl http://localhost:3001/health  # Communication Hub
curl http://localhost:3002/health  # Scheduler
curl http://localhost:3003/health  # Conflict Resolution
curl http://localhost:3004/health  # Travel Optimization
curl http://localhost:3005/health  # Constraint Management
curl http://localhost:3006/health  # Intelligence Engine
curl http://localhost:3007/health  # State Management
```

### Option 2: Kubernetes Local Development (Kind/Minikube)

#### Setup Local Kubernetes Cluster

```bash
# Option A: Using Kind
kind create cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: flextime-dev
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
EOF

# Option B: Using Minikube
minikube start --cpus=4 --memory=8192 --disk-size=50g
minikube addons enable ingress
```

#### Deploy Infrastructure

```bash
# Create namespace and RBAC
kubectl apply -f kubernetes/base/namespace.yaml

# Deploy Redis cluster
kubectl apply -f kubernetes/base/redis-cluster.yaml

# Deploy PostgreSQL
kubectl apply -f kubernetes/base/postgres-cluster.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=redis -n flextime-agents --timeout=300s
kubectl wait --for=condition=ready pod -l app=postgres -n flextime-agents --timeout=300s
```

#### Build and Push Images

```bash
# Build all service images
docker build -f docker/Dockerfile.communication-hub -t flextime/communication-hub:dev .
docker build -f docker/Dockerfile.scheduler -t flextime/scheduler:dev .
docker build -f docker/Dockerfile.conflict-resolution -t flextime/conflict-resolution:dev .
docker build -f docker/Dockerfile.travel-optimization -t flextime/travel-optimization:dev .
docker build -f docker/Dockerfile.constraint-management -t flextime/constraint-management:dev .
docker build -f docker/Dockerfile.intelligence-engine -t flextime/intelligence-engine:dev .
docker build -f docker/Dockerfile.state-management -t flextime/state-management:dev .

# Load images into Kind (if using Kind)
kind load docker-image flextime/communication-hub:dev --name flextime-dev
kind load docker-image flextime/scheduler:dev --name flextime-dev
kind load docker-image flextime/conflict-resolution:dev --name flextime-dev
kind load docker-image flextime/travel-optimization:dev --name flextime-dev
kind load docker-image flextime/constraint-management:dev --name flextime-dev
kind load docker-image flextime/intelligence-engine:dev --name flextime-dev
kind load docker-image flextime/state-management:dev --name flextime-dev
```

#### Deploy Services

```bash
# Deploy core services
kubectl apply -f kubernetes/base/communication-hub.yaml
kubectl apply -f kubernetes/base/scheduler.yaml
kubectl apply -f kubernetes/base/conflict-resolution.yaml
kubectl apply -f kubernetes/base/travel-optimization.yaml
kubectl apply -f kubernetes/base/constraint-management.yaml
kubectl apply -f kubernetes/base/intelligence-engine.yaml
kubectl apply -f kubernetes/base/state-management.yaml

# Wait for deployments to be ready
kubectl rollout status deployment/communication-hub -n flextime-agents
kubectl rollout status deployment/scheduler -n flextime-agents
kubectl rollout status deployment/conflict-resolution -n flextime-agents
kubectl rollout status deployment/travel-optimization -n flextime-agents
kubectl rollout status deployment/constraint-management -n flextime-agents
kubectl rollout status deployment/intelligence-engine -n flextime-agents
kubectl rollout status deployment/state-management -n flextime-agents
```

#### Setup Ingress

```bash
# Apply ingress configuration
kubectl apply -f kubernetes/base/ingress.yaml

# Get ingress IP (for Kind)
kubectl get ingress -n flextime-agents

# Add to /etc/hosts (Linux/Mac)
echo "127.0.0.1 flextime-api.local" | sudo tee -a /etc/hosts
```

#### Access Services

```bash
# Port forward for direct access
kubectl port-forward -n flextime-agents svc/communication-hub 3001:3001 &
kubectl port-forward -n flextime-agents svc/scheduler 3002:3002 &

# Test services
curl http://localhost:3001/health
curl http://localhost:3002/health

# Or via ingress
curl http://flextime-api.local/communication-hub/health
curl http://flextime-api.local/scheduler/health
```

### Option 3: Production Kubernetes Deployment

#### Prerequisites

```bash
# Ensure you have access to production cluster
kubectl config use-context production-cluster
kubectl config current-context

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

#### Setup Production Namespace

```bash
# Create production namespace with resource quotas
kubectl apply -f kubernetes/base/namespace.yaml

# Apply production-specific configurations
kubectl apply -k kubernetes/overlays/production/
```

#### Configure Secrets

```bash
# Database credentials
kubectl create secret generic postgres-credentials \
  --from-literal=scheduler-url="postgresql://user:pass@postgres:5432/flextime_scheduler" \
  --from-literal=conflicts-url="postgresql://user:pass@postgres:5432/flextime_conflicts" \
  --from-literal=travel-url="postgresql://user:pass@postgres:5432/flextime_travel" \
  --from-literal=intelligence-url="postgresql://user:pass@postgres:5432/flextime_intelligence" \
  -n flextime-agents

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=url="redis://redis.flextime-agents.svc.cluster.local:6379" \
  -n flextime-agents

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret="$(openssl rand -base64 32)" \
  -n flextime-agents

# TLS certificates
kubectl create secret tls flextime-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n flextime-agents
```

#### Deploy Production Services

```bash
# Deploy infrastructure first
kubectl apply -f kubernetes/base/redis-cluster.yaml
kubectl apply -f kubernetes/base/postgres-cluster.yaml

# Wait for infrastructure
kubectl wait --for=condition=ready pod -l app=redis -n flextime-agents --timeout=600s
kubectl wait --for=condition=ready pod -l app=postgres -n flextime-agents --timeout=600s

# Deploy application services
kubectl apply -f kubernetes/base/communication-hub.yaml
kubectl apply -f kubernetes/base/scheduler.yaml
kubectl apply -f kubernetes/base/conflict-resolution.yaml
kubectl apply -f kubernetes/base/travel-optimization.yaml
kubectl apply -f kubernetes/base/constraint-management.yaml
kubectl apply -f kubernetes/base/intelligence-engine.yaml
kubectl apply -f kubernetes/base/state-management.yaml

# Deploy monitoring
kubectl apply -f kubernetes/base/monitoring.yaml

# Deploy ingress
kubectl apply -f kubernetes/base/ingress.yaml
```

#### Verify Production Deployment

```bash
# Check all pods are running
kubectl get pods -n flextime-agents

# Check services
kubectl get services -n flextime-agents

# Check ingress
kubectl get ingress -n flextime-agents

# Health checks
kubectl exec -n flextime-agents deploy/communication-hub -- curl -f http://localhost:3001/health
kubectl exec -n flextime-agents deploy/scheduler -- curl -f http://localhost:3002/health
```

## Monitoring and Observability

### Deploy Monitoring Stack

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Deploy Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values kubernetes/monitoring/prometheus-values.yaml

# Deploy Grafana dashboards
kubectl apply -f kubernetes/monitoring/grafana-dashboards.yaml

# Deploy Jaeger for tracing
kubectl apply -f kubernetes/monitoring/jaeger.yaml
```

### Access Monitoring Tools

```bash
# Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Jaeger
kubectl port-forward -n monitoring svc/jaeger-query 16686:16686
```

Access via browser:
- Grafana: http://localhost:3000 (admin/prom-operator)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

### Configure Alerting

```bash
# Apply alerting rules
kubectl apply -f kubernetes/monitoring/alert-rules.yaml

# Configure notification channels
kubectl apply -f kubernetes/monitoring/notification-config.yaml
```

## CI/CD Setup

### GitHub Actions

```bash
# Setup required secrets in GitHub repository
gh secret set DOCKER_REGISTRY_URL --body "ghcr.io"
gh secret set DOCKER_REGISTRY_USERNAME --body "$GITHUB_ACTOR"
gh secret set DOCKER_REGISTRY_TOKEN --body "$GITHUB_TOKEN"
gh secret set KUBECONFIG_STAGING --body "$(cat ~/.kube/config | base64 -w 0)"
gh secret set KUBECONFIG_PRODUCTION --body "$(cat ~/.kube/production-config | base64 -w 0)"
gh secret set STAGING_URL --body "https://staging-api.flextime.example.com"
gh secret set PRODUCTION_URL --body "https://api.flextime.example.com"
gh secret set SLACK_WEBHOOK --body "https://hooks.slack.com/your-webhook-url"
```

### ArgoCD Setup

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port forward to access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access ArgoCD at https://localhost:8080
# Username: admin
# Password: (from above command)
```

### Configure ArgoCD Applications

```bash
# Apply ArgoCD application configurations
kubectl apply -f ci-cd/argocd/applications.yaml

# Sync applications
argocd app sync flextime-microservices-staging
argocd app sync flextime-microservices-production
```

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check pod logs
kubectl logs -n flextime-agents deployment/scheduler --follow

# Check pod events
kubectl describe pod -n flextime-agents -l app=scheduler

# Check resource constraints
kubectl top pods -n flextime-agents
kubectl describe nodes
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -n flextime-agents deploy/scheduler -- nc -zv postgres 5432

# Check database credentials
kubectl get secret postgres-credentials -n flextime-agents -o yaml

# Test database connection
kubectl exec -n flextime-agents deploy/scheduler -- \
  psql postgresql://user:pass@postgres:5432/flextime_scheduler -c "SELECT 1"
```

#### Redis Connection Issues

```bash
# Test Redis connectivity
kubectl exec -n flextime-agents deploy/communication-hub -- redis-cli -h redis ping

# Check Redis logs
kubectl logs -n flextime-agents deployment/redis --follow

# Test Redis functionality
kubectl exec -n flextime-agents deploy/communication-hub -- \
  redis-cli -h redis SET test "hello"
kubectl exec -n flextime-agents deploy/communication-hub -- \
  redis-cli -h redis GET test
```

#### Service-to-Service Communication

```bash
# Test internal service communication
kubectl exec -n flextime-agents deploy/scheduler -- \
  curl -f http://communication-hub:3001/health

# Check service discovery
kubectl get endpoints -n flextime-agents

# Test DNS resolution
kubectl exec -n flextime-agents deploy/scheduler -- \
  nslookup communication-hub.flextime-agents.svc.cluster.local
```

### Performance Issues

#### High CPU Usage

```bash
# Check resource usage
kubectl top pods -n flextime-agents

# Scale up if needed
kubectl scale deployment scheduler -n flextime-agents --replicas=5

# Check HPA status
kubectl get hpa -n flextime-agents
```

#### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n flextime-agents --sort-by=memory

# Check for memory leaks in logs
kubectl logs -n flextime-agents deployment/scheduler | grep -i "memory\|heap\|gc"

# Restart service if needed
kubectl rollout restart deployment/scheduler -n flextime-agents
```

#### Network Latency

```bash
# Test network latency between services
kubectl exec -n flextime-agents deploy/scheduler -- \
  curl -w "@curl-format.txt" -o /dev/null -s http://communication-hub:3001/health

# Check network policies
kubectl get networkpolicies -n flextime-agents

# Monitor network metrics
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Go to Network dashboards
```

## Maintenance

### Regular Tasks

#### Update Dependencies

```bash
# Update container images
docker pull node:18-alpine
docker pull redis:7-alpine
docker pull postgres:15-alpine

# Rebuild services with updated base images
docker-compose -f docker/docker-compose.microservices.yml build --no-cache
```

#### Database Maintenance

```bash
# Backup databases
kubectl exec -n flextime-agents deploy/postgres -- \
  pg_dump -U flextime flextime_scheduler > backup-scheduler-$(date +%Y%m%d).sql

# Vacuum databases
kubectl exec -n flextime-agents deploy/postgres -- \
  psql -U flextime flextime_scheduler -c "VACUUM ANALYZE;"
```

#### Log Rotation

```bash
# Check log sizes
kubectl exec -n flextime-agents deploy/scheduler -- du -sh /app/logs/*

# Rotate logs (if not using log shipping)
kubectl exec -n flextime-agents deploy/scheduler -- \
  find /app/logs -name "*.log" -mtime +7 -delete
```

### Security Updates

```bash
# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image flextime/scheduler:latest

# Update secrets (example: JWT secret rotation)
kubectl patch secret jwt-secret -n flextime-agents \
  -p '{"data":{"secret":"'$(openssl rand -base64 32 | base64 -w 0)'"}}'

# Restart services to pick up new secrets
kubectl rollout restart deployment -n flextime-agents
```

## Scaling

### Horizontal Scaling

```bash
# Scale individual services
kubectl scale deployment communication-hub -n flextime-agents --replicas=5
kubectl scale deployment scheduler -n flextime-agents --replicas=10

# Configure auto-scaling
kubectl apply -f kubernetes/base/hpa.yaml

# Monitor scaling events
kubectl get events -n flextime-agents --field-selector reason=SuccessfulRescale
```

### Vertical Scaling

```bash
# Update resource limits
kubectl patch deployment scheduler -n flextime-agents \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"scheduler","resources":{"limits":{"cpu":"2","memory":"2Gi"},"requests":{"cpu":"1","memory":"1Gi"}}}]}}}}'

# Apply Vertical Pod Autoscaler
kubectl apply -f kubernetes/base/vpa.yaml
```

### Cluster Scaling

```bash
# Scale cluster nodes (cloud provider specific)
# AWS EKS example:
eksctl scale nodegroup --cluster=flextime-production --name=workers --nodes=6

# GKE example:
gcloud container clusters resize flextime-production --num-nodes=6 --zone=us-central1-a
```

## Backup and Recovery

### Database Backups

```bash
# Create backup job
kubectl apply -f kubernetes/jobs/backup-job.yaml

# Manual backup
kubectl create job backup-manual-$(date +%Y%m%d) \
  --from=cronjob/postgres-backup -n flextime-agents

# Verify backup
kubectl logs job/backup-manual-$(date +%Y%m%d) -n flextime-agents
```

### Application State Backups

```bash
# Backup Redis state
kubectl exec -n flextime-agents deploy/redis -- redis-cli BGSAVE

# Backup configuration
kubectl get configmap -n flextime-agents -o yaml > configmap-backup-$(date +%Y%m%d).yaml
kubectl get secret -n flextime-agents -o yaml > secret-backup-$(date +%Y%m%d).yaml
```

### Disaster Recovery

```bash
# Full cluster backup (using Velero)
velero backup create flextime-full-backup \
  --include-namespaces flextime-agents,monitoring

# Application-specific backup
velero backup create flextime-app-backup \
  --include-namespaces flextime-agents \
  --include-resources pods,services,deployments,configmaps,secrets

# Restore from backup
velero restore create --from-backup flextime-full-backup
```

This deployment guide provides comprehensive instructions for getting the FlexTime agent microservices running in various environments. Choose the deployment method that best fits your needs and follow the appropriate section for detailed setup instructions.