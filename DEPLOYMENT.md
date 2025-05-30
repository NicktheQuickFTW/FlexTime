# Flextime Constraints System Deployment Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-deployment Checklist](#pre-deployment-checklist)
3. [Deployment Options](#deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Deployment Steps](#deployment-steps)
7. [Post-deployment Verification](#post-deployment-verification)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **Node.js**: 18.0 or higher
- **NPM**: 8.0 or higher
- **Memory**: 4GB RAM
- **CPU**: 2 cores
- **Storage**: 10GB available space
- **Database**: PostgreSQL 13+ or MongoDB 5+
- **Redis**: 6.0+ (for caching)

### Recommended Production Requirements

- **Node.js**: 20.x LTS
- **Memory**: 16GB RAM
- **CPU**: 8 cores
- **Storage**: 50GB SSD
- **Load Balancer**: NGINX or HAProxy
- **Monitoring**: Datadog, New Relic, or Prometheus

## Pre-deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Performance benchmarks meet requirements
- [ ] Security audit completed
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Backup procedures in place
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

## Deployment Options

### Option 1: Docker Deployment

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node dist/health-check.js || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - API_KEY=${API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=flextime
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Option 2: Kubernetes Deployment

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flextime-constraints
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flextime-constraints
  template:
    metadata:
      labels:
        app: flextime-constraints
    spec:
      containers:
      - name: app
        image: flextime/constraints:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
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
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: flextime-constraints-service
  namespace: production
spec:
  selector:
    app: flextime-constraints
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flextime-constraints-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: flextime-constraints
  minReplicas: 3
  maxReplicas: 10
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

### Option 3: Traditional Server Deployment

#### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'flextime-constraints',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '2G',
    restart_delay: 4000,
    autorestart: true,
    watch: false
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## Environment Configuration

### Production Environment Variables

```bash
# .env.production
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v2
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flextime
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# Security
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGINS=https://app.flextime.com,https://admin.flextime.com

# Performance
MAX_WORKERS=8
CACHE_TTL=3600000
CACHE_MAX_SIZE=100000
EVALUATION_TIMEOUT=10000

# Monitoring
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
LOG_AGGREGATOR_URL=https://logs.flextime.com

# Feature Flags
ENABLE_ML_OPTIMIZATION=true
ENABLE_PARALLEL_PROCESSING=true
ENABLE_ADVANCED_CACHING=true
```

## Database Setup

### PostgreSQL Schema

```sql
-- Create database
CREATE DATABASE flextime;

-- Create schema
CREATE SCHEMA IF NOT EXISTS constraints;

-- Constraints table
CREATE TABLE constraints.constraints (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    configuration JSONB,
    metadata JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evaluation history
CREATE TABLE constraints.evaluation_history (
    id SERIAL PRIMARY KEY,
    constraint_id VARCHAR(255) REFERENCES constraints.constraints(id),
    slot_id VARCHAR(255) NOT NULL,
    result JSONB NOT NULL,
    evaluation_time INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_constraints_type_sport ON constraints.constraints(type, sport);
CREATE INDEX idx_constraints_active ON constraints.constraints(active);
CREATE INDEX idx_evaluation_history_constraint ON constraints.evaluation_history(constraint_id);
CREATE INDEX idx_evaluation_history_created ON constraints.evaluation_history(created_at);

-- Partitioning for evaluation history
CREATE TABLE constraints.evaluation_history_2025_q1 PARTITION OF constraints.evaluation_history
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

### MongoDB Setup

```javascript
// Initialize replica set
rs.initiate({
  _id: "flextime-rs",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
});

// Create indexes
db.constraints.createIndex({ "type": 1, "sport": 1 });
db.constraints.createIndex({ "active": 1 });
db.constraints.createIndex({ "metadata.tags": 1 });

db.evaluationHistory.createIndex({ "constraintId": 1, "createdAt": -1 });
db.evaluationHistory.createIndex({ "slotId": 1 });
db.evaluationHistory.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL
```

## Deployment Steps

### 1. Pre-deployment

```bash
# Run tests
npm test

# Run performance tests
npm run test:performance

# Build application
npm run build

# Run security audit
npm audit

# Create deployment package
npm pack
```

### 2. Database Migration

```bash
# Run migrations
npm run migrate:up

# Verify migrations
npm run migrate:status
```

### 3. Deploy Application

#### Docker Deployment

```bash
# Build image
docker build -t flextime/constraints:latest .

# Push to registry
docker push flextime/constraints:latest

# Deploy with docker-compose
docker-compose up -d

# Or deploy to Kubernetes
kubectl apply -f deployment.yaml
```

#### Traditional Deployment

```bash
# Copy files to server
rsync -avz --exclude 'node_modules' ./ user@server:/app/flextime/

# SSH to server
ssh user@server

# Install dependencies
cd /app/flextime
npm ci --only=production

# Start with PM2
pm2 start ecosystem.config.js
```

### 4. Configure Load Balancer

#### NGINX Configuration

```nginx
upstream flextime_backend {
    least_conn;
    server app1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server app2:3000 weight=1 max_fails=3 fail_timeout=30s;
    server app3:3000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name api.flextime.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://flextime_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        access_log off;
        proxy_pass http://flextime_backend/health;
    }
}
```

## Post-deployment Verification

### 1. Health Checks

```bash
# Check application health
curl https://api.flextime.com/health

# Check specific endpoints
curl -H "Authorization: Bearer $API_KEY" \
  https://api.flextime.com/v2/constraints

# Run smoke tests
npm run test:smoke
```

### 2. Performance Verification

```bash
# Run load tests
npm run test:load

# Monitor response times
while true; do
  time curl -s https://api.flextime.com/health > /dev/null
  sleep 5
done
```

### 3. Monitor Logs

```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs

# System logs
tail -f /var/log/nginx/access.log
```

## Monitoring and Maintenance

### 1. Setup Monitoring

#### Datadog Configuration

```yaml
# datadog.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: datadog-config
data:
  datadog.yaml: |
    api_key: ${DATADOG_API_KEY}
    site: datadoghq.com
    logs_enabled: true
    apm_config:
      enabled: true
      env: production
    process_config:
      enabled: true
    tags:
      - env:production
      - service:flextime-constraints
```

#### Prometheus Metrics

```typescript
// metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const evaluationCounter = new Counter({
  name: 'constraint_evaluations_total',
  help: 'Total number of constraint evaluations',
  labelNames: ['constraint_id', 'result']
});

export const evaluationDuration = new Histogram({
  name: 'constraint_evaluation_duration_seconds',
  help: 'Duration of constraint evaluations',
  labelNames: ['constraint_id'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const activeWorkers = new Gauge({
  name: 'active_workers',
  help: 'Number of active worker threads'
});
```

### 2. Automated Backups

```bash
#!/bin/bash
# backup.sh

# Database backup
pg_dump $DATABASE_URL | gzip > /backups/db-$(date +%Y%m%d-%H%M%S).gz

# Redis backup
redis-cli --rdb /backups/redis-$(date +%Y%m%d-%H%M%S).rdb

# Upload to S3
aws s3 sync /backups s3://flextime-backups/constraints/

# Clean old backups
find /backups -name "*.gz" -mtime +7 -delete
```

### 3. Log Rotation

```bash
# /etc/logrotate.d/flextime
/app/flextime/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Rollback Procedures

### 1. Quick Rollback

```bash
# Docker rollback
docker-compose down
docker pull flextime/constraints:previous
docker tag flextime/constraints:previous flextime/constraints:latest
docker-compose up -d

# Kubernetes rollback
kubectl rollout undo deployment/flextime-constraints

# PM2 rollback
pm2 stop all
git checkout previous-version
npm ci --only=production
npm run build
pm2 restart all
```

### 2. Database Rollback

```bash
# Rollback migrations
npm run migrate:down

# Restore from backup
pg_restore -d flextime /backups/db-backup.gz
```

## Troubleshooting

### Common Deployment Issues

#### Issue: Application won't start

```bash
# Check logs
docker logs flextime-constraints
pm2 logs

# Verify environment variables
docker exec flextime-constraints env | grep -E "NODE_ENV|DATABASE_URL"

# Test database connection
node -e "require('./dist/db').testConnection()"
```

#### Issue: High memory usage

```bash
# Check memory usage
docker stats
pm2 monit

# Increase memory limits
docker-compose down
# Edit docker-compose.yml to increase memory
docker-compose up -d

# Or for PM2
pm2 delete all
pm2 start ecosystem.config.js --max-memory-restart 4G
```

#### Issue: Slow response times

```bash
# Check worker status
curl https://api.flextime.com/v2/constraints/performance

# Scale up
docker-compose up -d --scale app=5

# Or Kubernetes
kubectl scale deployment flextime-constraints --replicas=5
```

### Emergency Procedures

```bash
# Emergency shutdown
docker-compose down
pm2 kill

# Maintenance mode
echo "maintenance" > /app/flextime/MAINTENANCE

# Clear cache
redis-cli FLUSHALL

# Restart everything
docker-compose up -d
pm2 resurrect
```

## Security Considerations

1. **Use environment variables** for all sensitive data
2. **Enable TLS/SSL** for all connections
3. **Implement rate limiting** to prevent abuse
4. **Regular security updates** for dependencies
5. **Network isolation** between services
6. **Audit logging** for all API access
7. **Encrypted backups** with proper key management

## Performance Optimization

1. **Enable HTTP/2** in load balancer
2. **Configure connection pooling** for database
3. **Use Redis clustering** for high availability
4. **Enable compression** for API responses
5. **Implement CDN** for static assets
6. **Regular performance profiling**

## Disaster Recovery

1. **Regular backups** to multiple locations
2. **Documented recovery procedures**
3. **Tested restore processes**
4. **Geo-redundant deployments**
5. **Automated failover** mechanisms
6. **24/7 monitoring** with alerts

---

For additional support, contact the Flextime DevOps team at devops@flextime.com