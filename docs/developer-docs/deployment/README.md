# FlexTime Deployment Guide

This comprehensive guide covers all aspects of deploying FlexTime, from local development setups to production environments. Whether you're setting up a development environment or deploying to production, this guide will walk you through the process step by step.

## 🚀 Deployment Overview

FlexTime supports multiple deployment strategies to accommodate different organizational needs:

- **🏠 Local Development**: Single-machine setup for development and testing
- **☁️ Cloud Deployment**: Scalable cloud-native deployment on AWS, Azure, or GCP
- **🐳 Container Deployment**: Docker and Kubernetes-based deployments
- **🏢 On-Premises**: Self-hosted deployment for organizations with specific requirements
- **🔀 Hybrid**: Combination of cloud and on-premises components

## 📚 Deployment Sections

### Quick Start Deployments
- **[Local Development Setup](./local-development.md)** - Get FlexTime running locally in 15 minutes
- **[Docker Compose Setup](./docker-compose.md)** - Container-based local deployment
- **[Cloud Quick Deploy](./cloud-quick-deploy.md)** - One-click cloud deployment

### Production Deployments
- **[Production Architecture](./production-architecture.md)** - Production-ready architecture patterns
- **[Kubernetes Deployment](./kubernetes-deployment.md)** - Complete Kubernetes setup
- **[Cloud Provider Guides](./cloud-providers/README.md)** - AWS, Azure, GCP specific guides
- **[High Availability Setup](./high-availability.md)** - Multi-region, fault-tolerant deployment

### Infrastructure as Code
- **[Terraform Configurations](./terraform/README.md)** - Infrastructure automation
- **[Ansible Playbooks](./ansible/README.md)** - Configuration management
- **[Helm Charts](./helm/README.md)** - Kubernetes package management
- **[CI/CD Pipelines](./cicd/README.md)** - Automated deployment pipelines

### Security and Compliance
- **[Security Hardening](./security-hardening.md)** - Production security best practices
- **[SSL/TLS Configuration](./ssl-tls.md)** - Certificate management and configuration
- **[Backup and Recovery](./backup-recovery.md)** - Data protection strategies
- **[Compliance Checklists](./compliance/README.md)** - Regulatory compliance guides

## ⚡ Quick Start: Local Development

### Prerequisites
- **Node.js**: Version 18+ LTS
- **PostgreSQL**: Version 15+
- **Redis**: Version 7+
- **Git**: For source code management

### 15-Minute Setup

1. **Clone and Install**
   ```bash
   # Clone the repository
   git clone https://github.com/big12/flextime.git
   cd flextime
   
   # Install dependencies
   npm install
   
   # Copy environment template
   cp .env.example .env
   ```

2. **Database Setup**
   ```bash
   # Start PostgreSQL and Redis (using Docker)
   docker-compose up -d postgres redis
   
   # Run database migrations
   npm run db:migrate
   
   # Seed with sample data
   npm run db:seed
   ```

3. **Configure Environment**
   ```bash
   # Edit .env file with your settings
   DATABASE_URL=postgresql://flextime:password@localhost:5432/flextime
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   API_PORT=3000
   ```

4. **Start Services**
   ```bash
   # Start all services
   npm run dev
   
   # Or start services individually
   npm run start:api     # API server on port 3000
   npm run start:worker  # Background job worker
   npm run start:web     # Web interface on port 8080
   ```

5. **Verify Installation**
   ```bash
   # Check API health
   curl http://localhost:3000/health
   
   # Access web interface
   open http://localhost:8080
   ```

## 🐳 Docker Deployment

### Single Container Setup

```bash
# Build the image
docker build -t flextime:latest .

# Run with environment variables
docker run -d \
  --name flextime \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/flextime \
  -e REDIS_URL=redis://redis:6379 \
  flextime:latest
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: flextime
      POSTGRES_USER: flextime
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://flextime:password@postgres:5432/flextime
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: npm run start:worker
    environment:
      DATABASE_URL: postgresql://flextime:password@postgres:5432/flextime
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  web:
    build: ./frontend
    ports:
      - "8080:80"
    environment:
      API_URL: http://api:3000

volumes:
  postgres_data:
```

## ☸️ Kubernetes Deployment

### Namespace and Configuration

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: flextime

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: flextime-config
  namespace: flextime
data:
  NODE_ENV: "production"
  API_PORT: "3000"
  LOG_LEVEL: "info"
```

### Database and Cache

```yaml
# postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: flextime
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: flextime
        - name: POSTGRES_USER
          value: flextime
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi

---
# redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: flextime
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
```

### Application Services

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flextime-api
  namespace: flextime
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flextime-api
  template:
    metadata:
      labels:
        app: flextime-api
    spec:
      containers:
      - name: api
        image: flextime/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          value: redis://redis:6379
        envFrom:
        - configMapRef:
            name: flextime-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: flextime-api
  namespace: flextime
spec:
  selector:
    app: flextime-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flextime-ingress
  namespace: flextime
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.flextime.big12.org
    secretName: flextime-tls
  rules:
  - host: api.flextime.big12.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: flextime-api
            port:
              number: 80
```

## ☁️ Cloud Provider Deployment

### AWS Deployment

#### Using AWS ECS with Fargate

```yaml
# ecs-task-definition.json
{
  "family": "flextime-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "flextime-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/flextime:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:flextime/database"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/flextime",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Terraform Configuration for AWS

```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "flextime-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Environment = var.environment
    Project     = "flextime"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "flextime-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  
  db_name  = "flextime"
  username = "flextime"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Environment = var.environment
    Project     = "flextime"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "flextime-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "flextime-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  tags = {
    Environment = var.environment
    Project     = "flextime"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "flextime-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = var.environment
    Project     = "flextime"
  }
}
```

### Azure Deployment

#### Azure Container Instances

```yaml
# azure-container-instance.yaml
apiVersion: 2019-12-01
location: eastus
name: flextime-api
properties:
  containers:
  - name: flextime-api
    properties:
      image: youracr.azurecr.io/flextime:latest
      resources:
        requests:
          cpu: 1
          memoryInGb: 1.5
      ports:
      - port: 3000
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: DATABASE_URL
        secureValue: postgresql://user:pass@server.postgres.database.azure.com:5432/flextime
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: tcp
      port: 3000
tags:
  Environment: production
  Project: flextime
type: Microsoft.ContainerInstance/containerGroups
```

### Google Cloud Platform Deployment

#### Cloud Run Deployment

```yaml
# cloudrun-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: flextime-api
  namespace: default
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/project-id/flextime:latest
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
```

## 🔧 Environment Configuration

### Environment Variables

```bash
# Core Configuration
NODE_ENV=production
API_PORT=3000
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Cache Configuration
REDIS_URL=redis://host:6379
REDIS_CLUSTER_MODE=false
CACHE_TTL=3600

# Security Configuration
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://app.flextime.big12.org

# External Services
NOTION_API_KEY=secret_key
EMAIL_SERVICE_KEY=service_key
TRAVEL_API_KEY=api_key

# Monitoring and Observability
PROMETHEUS_ENABLED=true
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
LOG_FORMAT=json

# Feature Flags
FEATURE_AI_OPTIMIZATION=true
FEATURE_MULTI_SPORT=true
FEATURE_REAL_TIME_COLLABORATION=true
```

### Configuration Management

#### Using Kubernetes ConfigMaps and Secrets

```yaml
# configuration.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: flextime-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
  FEATURE_AI_OPTIMIZATION: "true"

---
apiVersion: v1
kind: Secret
metadata:
  name: flextime-secrets
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0BkYjozNDMyL2RiCg==
  JWT_SECRET: eW91ci0yNTYtYml0LXNlY3JldC1rZXkK
  NOTION_API_KEY: c2VjcmV0X2tleQo=
```

#### Using HashiCorp Vault

```bash
# Store secrets in Vault
vault kv put secret/flextime/production \
  database_url="postgresql://user:pass@host:5432/db" \
  jwt_secret="your-secret-key" \
  notion_api_key="secret_key"

# Read secrets in application
vault kv get -field=database_url secret/flextime/production
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints

```javascript
// health.js
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: checkDatabase(),
      cache: checkRedis(),
      external_apis: checkExternalAPIs()
    }
  };
  
  const overallHealth = Object.values(health.services)
    .every(service => service.status === 'healthy');
  
  res.status(overallHealth ? 200 : 503).json(health);
});

app.get('/ready', (req, res) => {
  // Readiness check - more strict than health check
  if (isApplicationReady()) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});
```

### Monitoring Stack Setup

```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring

---
# Prometheus
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config

---
# Grafana
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: admin123
```

## 🔒 Security Hardening

### TLS/SSL Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.flextime.big12.org;
    
    ssl_certificate /etc/ssl/certs/flextime.crt;
    ssl_certificate_key /etc/ssl/private/flextime.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    location / {
        proxy_pass http://flextime-api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Network Security

```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: flextime-network-policy
  namespace: flextime
spec:
  podSelector:
    matchLabels:
      app: flextime-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

## 🚀 Deployment Automation

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy FlexTime

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: |
        docker build -t flextime:${{ github.sha }} .
        docker tag flextime:${{ github.sha }} flextime:latest
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push flextime:${{ github.sha }}
        docker push flextime:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/flextime-api flextime-api=flextime:${{ github.sha }}
        kubectl rollout status deployment/flextime-api
```

### Infrastructure as Code

```bash
# deploy.sh - Deployment automation script
#!/bin/bash

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "Deploying FlexTime version $VERSION to $ENVIRONMENT"

# Apply Terraform configuration
cd terraform/environments/$ENVIRONMENT
terraform init
terraform plan -var="app_version=$VERSION"
terraform apply -auto-approve

# Deploy to Kubernetes
kubectl config use-context $ENVIRONMENT
helm upgrade --install flextime ./helm/flextime \
  --namespace flextime \
  --set image.tag=$VERSION \
  --set environment=$ENVIRONMENT \
  --values ./helm/values-$ENVIRONMENT.yaml

# Run health checks
echo "Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/flextime-api

# Verify deployment
echo "Running deployment verification..."
kubectl exec deployment/flextime-api -- npm run verify:deployment

echo "Deployment completed successfully!"
```

## 📋 Deployment Checklist

### Pre-Deployment Checklist

- [ ] **Infrastructure Ready**
  - [ ] All required cloud resources provisioned
  - [ ] Database and cache instances running
  - [ ] Network configuration complete
  - [ ] SSL certificates installed and valid

- [ ] **Security Configuration**
  - [ ] Secrets properly stored and encrypted
  - [ ] Access controls configured
  - [ ] Security scanning completed
  - [ ] Compliance requirements verified

- [ ] **Application Configuration**
  - [ ] Environment variables set
  - [ ] Feature flags configured
  - [ ] Database migrations applied
  - [ ] Monitoring configured

### Post-Deployment Checklist

- [ ] **Health Verification**
  - [ ] All services responding to health checks
  - [ ] Database connectivity verified
  - [ ] External API integrations working
  - [ ] Performance metrics within acceptable ranges

- [ ] **Functional Testing**
  - [ ] Schedule generation working
  - [ ] User authentication functional
  - [ ] API endpoints responding correctly
  - [ ] Real-time features operational

- [ ] **Monitoring Setup**
  - [ ] Alerts configured and firing
  - [ ] Dashboards displaying correct data
  - [ ] Log aggregation working
  - [ ] Backup processes verified

## 🆘 Deployment Troubleshooting

### Common Issues and Solutions

#### Container Startup Issues
```bash
# Check container logs
kubectl logs deployment/flextime-api

# Describe pod for events
kubectl describe pod -l app=flextime-api

# Check resource constraints
kubectl top pods -n flextime
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec deployment/flextime-api -- nc -zv postgres 5432

# Check database credentials
kubectl get secret flextime-secrets -o yaml | base64 -d

# Verify network policies
kubectl describe networkpolicy flextime-network-policy
```

#### Performance Issues
```bash
# Check resource utilization
kubectl top nodes
kubectl top pods -n flextime

# Scale deployment if needed
kubectl scale deployment flextime-api --replicas=5

# Check for throttling
kubectl describe pod -l app=flextime-api | grep -i throttl
```

---

*FlexTime Deployment Guide is continuously updated with best practices and new deployment options.*

*Last updated: May 29, 2025*
*Deployment Guide Version: 2.0*