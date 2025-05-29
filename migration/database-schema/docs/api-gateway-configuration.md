# FlexTime API Gateway Configuration Guide

## Overview

This guide provides the API Gateway configuration for routing requests between the legacy API (v1) and the new microservices API (v2) during the FlexTime migration process.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Client Apps   │───▶│   API Gateway    │───▶│  Microservices      │
│                 │    │  (Kong/nginx)    │    │  - Team Availability│
│ - Web App       │    │                  │    │  - Venue Management │
│ - Mobile App    │    │ - Rate Limiting  │    │  - Constraint Valid │
│ - Admin Portal  │    │ - Authentication │    │  - Schedule Gen     │
│ - Legacy APIs   │    │ - Load Balancing │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Kong API Gateway Configuration

### Service Definitions

```yaml
# kong.yml - Declarative configuration

_format_version: "3.0"

services:
  # Legacy API Compatibility Service
  - name: flextime-legacy-api
    url: http://legacy-api-service:3005
    tags:
      - legacy
      - v1
    
  # Team Availability Microservice
  - name: team-availability-service
    url: http://team-availability:8001
    tags:
      - microservice
      - v2
    
  # Venue Management Microservice  
  - name: venue-management-service
    url: http://venue-management:8002
    tags:
      - microservice
      - v2
    
  # Constraint Validation Microservice
  - name: constraint-validation-service
    url: http://constraint-validation:8003
    tags:
      - microservice
      - v2
    
  # Schedule Generation Microservice
  - name: schedule-generation-service
    url: http://schedule-generation:8004
    tags:
      - microservice
      - v2

routes:
  # Legacy API Routes (v1)
  - name: legacy-schedules
    service: flextime-legacy-api
    paths:
      - /api/v1/schedules
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: false
    
  - name: legacy-teams
    service: flextime-legacy-api
    paths:
      - /api/v1/teams
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: false
    
  - name: legacy-venues
    service: flextime-legacy-api
    paths:
      - /api/v1/venues
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: false
    
  - name: legacy-constraints
    service: flextime-legacy-api
    paths:
      - /api/v1/constraints
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: false

  # Microservices API Routes (v2)
  - name: team-availability-routes
    service: team-availability-service
    paths:
      - /api/v2/team-availability
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: true
    
  - name: venue-management-routes
    service: venue-management-service
    paths:
      - /api/v2/venue-management
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: true
    
  - name: constraint-validation-routes
    service: constraint-validation-service
    paths:
      - /api/v2/constraint-validation
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: true
    
  - name: schedule-generation-routes
    service: schedule-generation-service
    paths:
      - /api/v2/schedule-generation
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    strip_path: true

plugins:
  # Rate Limiting
  - name: rate-limiting
    config:
      minute: 1000
      hour: 10000
      day: 100000
      policy: redis
      redis_host: redis
      redis_port: 6379
    
  # Authentication
  - name: key-auth
    config:
      key_names:
        - X-API-Key
    
  # CORS
  - name: cors
    config:
      origins:
        - https://app.flextime.com
        - https://admin.flextime.com
        - http://localhost:3000
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-MD5
        - Content-Type
        - Date
        - X-Auth-Token
        - X-API-Key
      exposed_headers:
        - X-Auth-Token
      credentials: true
      max_age: 3600
    
  # Request/Response Logging
  - name: file-log
    config:
      path: /var/log/kong/access.log
      reopen: true
    
  # Prometheus Metrics
  - name: prometheus
    config:
      per_consumer: true
      status_code_metrics: true
      latency_metrics: true

consumers:
  # API Keys for different client types
  - username: web-app
    keyauth_credentials:
      - key: web-app-api-key-2024
    
  - username: mobile-app
    keyauth_credentials:
      - key: mobile-app-api-key-2024
    
  - username: admin-portal
    keyauth_credentials:
      - key: admin-portal-api-key-2024
    
  - username: legacy-integration
    keyauth_credentials:
      - key: legacy-integration-api-key-2024
```

## Nginx Configuration (Alternative)

```nginx
# nginx.conf

upstream legacy_api {
    server legacy-api-service:3005;
    keepalive 32;
}

upstream team_availability {
    server team-availability:8001;
    keepalive 16;
}

upstream venue_management {
    server venue-management:8002;
    keepalive 16;
}

upstream constraint_validation {
    server constraint-validation:8003;
    keepalive 16;
}

upstream schedule_generation {
    server schedule-generation:8004;
    keepalive 16;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=legacy_limit:10m rate=200r/m;

server {
    listen 80;
    server_name api.flextime.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # CORS headers
    add_header Access-Control-Allow-Origin $cors_origin;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-API-Key";
    add_header Access-Control-Max-Age 3600;
    
    # Health check endpoint
    location /health {
        return 200 '{"status":"healthy","timestamp":"$time_iso8601"}';
        add_header Content-Type application/json;
    }
    
    # Legacy API routes (v1)
    location /api/v1/ {
        limit_req zone=legacy_limit burst=50 nodelay;
        
        # Authentication
        access_by_lua_block {
            local api_key = ngx.var.http_x_api_key
            if not api_key or api_key == "" then
                ngx.status = 401
                ngx.say('{"error": "API key required"}')
                ngx.exit(401)
            end
            -- Add API key validation logic here
        }
        
        proxy_pass http://legacy_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Response modification for legacy compatibility
        header_filter_by_lua_block {
            ngx.header["X-API-Version"] = "1.0"
            ngx.header["X-Service-Type"] = "legacy"
        }
    }
    
    # Microservices API routes (v2)
    location /api/v2/team-availability/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        rewrite ^/api/v2/team-availability/(.*)$ /$1 break;
        proxy_pass http://team_availability;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Service-Name "team-availability";
    }
    
    location /api/v2/venue-management/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        rewrite ^/api/v2/venue-management/(.*)$ /$1 break;
        proxy_pass http://venue_management;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Service-Name "venue-management";
    }
    
    location /api/v2/constraint-validation/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        rewrite ^/api/v2/constraint-validation/(.*)$ /$1 break;
        proxy_pass http://constraint_validation;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Service-Name "constraint-validation";
    }
    
    location /api/v2/schedule-generation/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        rewrite ^/api/v2/schedule-generation/(.*)$ /$1 break;
        proxy_pass http://schedule_generation;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Service-Name "schedule-generation";
    }
    
    # Handle OPTIONS requests for CORS
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $cors_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-API-Key";
            add_header Access-Control-Max-Age 3600;
            return 204;
        }
        return 404;
    }
}

# Logging configuration
log_format api_access '$remote_addr - $remote_user [$time_local] '
                     '"$request" $status $body_bytes_sent '
                     '"$http_referer" "$http_user_agent" '
                     '"$http_x_api_key" "$upstream_addr" '
                     '$request_time $upstream_response_time';

access_log /var/log/nginx/api_access.log api_access;
error_log /var/log/nginx/api_error.log warn;
```

## Service Discovery Configuration

### Consul Configuration

```hcl
# consul.hcl

datacenter = "flextime"
data_dir = "/opt/consul/data"
log_level = "INFO"
server = true
bootstrap_expect = 1

bind_addr = "0.0.0.0"
client_addr = "0.0.0.0"

ports {
  grpc = 8502
}

connect {
  enabled = true
}

ui_config {
  enabled = true
}

# Service definitions
services {
  name = "team-availability"
  id = "team-availability-1"
  port = 8001
  address = "team-availability"
  
  check {
    name = "Team Availability Health"
    http = "http://team-availability:8001/health"
    interval = "10s"
    timeout = "3s"
  }
  
  tags = [
    "microservice",
    "v2",
    "database:team_availability"
  ]
}

services {
  name = "venue-management"
  id = "venue-management-1"
  port = 8002
  address = "venue-management"
  
  check {
    name = "Venue Management Health"
    http = "http://venue-management:8002/health"
    interval = "10s"
    timeout = "3s"
  }
  
  tags = [
    "microservice",
    "v2",
    "database:venue_management"
  ]
}

services {
  name = "constraint-validation"
  id = "constraint-validation-1"
  port = 8003
  address = "constraint-validation"
  
  check {
    name = "Constraint Validation Health"
    http = "http://constraint-validation:8003/health"
    interval = "10s"
    timeout = "3s"
  }
  
  tags = [
    "microservice",
    "v2",
    "database:constraint_validation"
  ]
}

services {
  name = "schedule-generation"
  id = "schedule-generation-1"
  port = 8004
  address = "schedule-generation"
  
  check {
    name = "Schedule Generation Health"
    http = "http://schedule-generation:8004/health"
    interval = "10s"
    timeout = "3s"
  }
  
  tags = [
    "microservice",
    "v2",
    "database:schedule_generation"
  ]
}
```

## Circuit Breaker Configuration

### Hystrix Configuration

```yaml
# hystrix.yml

hystrix:
  command:
    default:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 30000
      circuitBreaker:
        requestVolumeThreshold: 20
        sleepWindowInMilliseconds: 5000
        errorThresholdPercentage: 50
    
    TeamAvailabilityCommand:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 15000
      circuitBreaker:
        requestVolumeThreshold: 10
        sleepWindowInMilliseconds: 3000
        errorThresholdPercentage: 40
    
    VenueManagementCommand:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 20000
      circuitBreaker:
        requestVolumeThreshold: 15
        sleepWindowInMilliseconds: 4000
        errorThresholdPercentage: 45
    
    ConstraintValidationCommand:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 45000
      circuitBreaker:
        requestVolumeThreshold: 25
        sleepWindowInMilliseconds: 8000
        errorThresholdPercentage: 60
    
    ScheduleGenerationCommand:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 120000
      circuitBreaker:
        requestVolumeThreshold: 5
        sleepWindowInMilliseconds: 15000
        errorThresholdPercentage: 70

  threadpool:
    default:
      coreSize: 10
      maximumSize: 20
      maxQueueSize: 100
      queueSizeRejectionThreshold: 80
```

## Load Balancing Strategies

### Service-Specific Load Balancing

```yaml
# load-balancer.yml

load_balancing:
  team_availability:
    strategy: round_robin
    health_check:
      path: /health
      interval: 30s
      timeout: 5s
      retries: 3
    instances:
      - host: team-availability-1:8001
        weight: 1
      - host: team-availability-2:8001
        weight: 1
    
  venue_management:
    strategy: least_connections
    health_check:
      path: /health
      interval: 30s
      timeout: 5s
      retries: 3
    instances:
      - host: venue-management-1:8002
        weight: 1
      - host: venue-management-2:8002
        weight: 1
    
  constraint_validation:
    strategy: weighted_round_robin
    health_check:
      path: /health
      interval: 45s
      timeout: 10s
      retries: 2
    instances:
      - host: constraint-validation-1:8003
        weight: 2  # More powerful instance
      - host: constraint-validation-2:8003
        weight: 1
    
  schedule_generation:
    strategy: least_response_time
    health_check:
      path: /health
      interval: 60s
      timeout: 15s
      retries: 2
    instances:
      - host: schedule-generation-1:8004
        weight: 1
```

## Caching Configuration

### Redis Cache Configuration

```yaml
# redis-cache.yml

redis:
  cluster:
    nodes:
      - redis-1:6379
      - redis-2:6379
      - redis-3:6379
  
  cache_policies:
    team_availability:
      ttl: 3600  # 1 hour
      key_pattern: "ta:{team_id}:{season_id}:{sport_id}"
      tags: ["team", "availability"]
    
    venue_management:
      ttl: 7200  # 2 hours  
      key_pattern: "vm:{venue_id}:{date}"
      tags: ["venue", "availability"]
    
    constraint_validation:
      ttl: 1800  # 30 minutes
      key_pattern: "cv:{template_id}:{params_hash}"
      tags: ["constraint", "validation"]
    
    schedule_generation:
      ttl: 21600  # 6 hours
      key_pattern: "sg:{request_id}:{algorithm_id}"
      tags: ["schedule", "generation"]

  cache_strategies:
    read_through: true
    write_behind: true
    invalidation: tag_based
```

## Monitoring and Observability

### Prometheus Metrics Configuration

```yaml
# prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "flextime_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'kong-gateway'
    static_configs:
      - targets: ['kong:8001']
    metrics_path: '/metrics'
    scrape_interval: 30s
  
  - job_name: 'team-availability'
    static_configs:
      - targets: ['team-availability:8001']
    metrics_path: '/metrics'
    scrape_interval: 30s
  
  - job_name: 'venue-management'
    static_configs:
      - targets: ['venue-management:8002']
    metrics_path: '/metrics'
    scrape_interval: 30s
  
  - job_name: 'constraint-validation'
    static_configs:
      - targets: ['constraint-validation:8003']
    metrics_path: '/metrics'
    scrape_interval: 45s
  
  - job_name: 'schedule-generation'
    static_configs:
      - targets: ['schedule-generation:8004']
    metrics_path: '/metrics'
    scrape_interval: 60s
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "FlexTime Microservices",
    "panels": [
      {
        "title": "API Gateway Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(kong_http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Service Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "{{datname}}"
          }
        ]
      }
    ]
  }
}
```

## Security Configuration

### API Security Policies

```yaml
# security-policies.yml

api_security:
  authentication:
    methods:
      - api_key
      - jwt
      - oauth2
    
    api_key:
      header_name: X-API-Key
      query_param: api_key
      validation: external  # Validate against user service
    
    jwt:
      secret: ${JWT_SECRET}
      algorithm: HS256
      expiration: 3600
      issuer: flextime-auth
    
    oauth2:
      provider: flextime-oauth
      scopes:
        - team:read
        - team:write
        - venue:read
        - venue:write
        - constraint:read
        - constraint:write
        - schedule:read
        - schedule:write
        - admin
  
  authorization:
    rbac:
      enabled: true
      roles:
        - name: team_manager
          permissions:
            - team:read
            - team:write
            - constraint:read
        
        - name: venue_manager  
          permissions:
            - venue:read
            - venue:write
            - constraint:read
        
        - name: scheduler
          permissions:
            - schedule:read
            - schedule:write
            - constraint:read
            - team:read
            - venue:read
        
        - name: admin
          permissions:
            - "*"
  
  rate_limiting:
    default: 1000/hour
    by_role:
      team_manager: 2000/hour
      venue_manager: 2000/hour
      scheduler: 5000/hour
      admin: 10000/hour
  
  ip_filtering:
    whitelist:
      - 10.0.0.0/8
      - 192.168.0.0/16
      - 172.16.0.0/12
    blacklist: []
```

This configuration provides a comprehensive API Gateway setup for the FlexTime microservices migration, ensuring proper routing, security, monitoring, and performance optimization.