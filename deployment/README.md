# Flextime Deployment Automation

This directory contains comprehensive deployment automation for the Flextime scheduling application, supporting AWS, Azure, and GCP cloud platforms with Kubernetes orchestration.

## Directory Structure

```
deployment/
├── terraform/                 # Infrastructure as Code
│   ├── main.tf               # Main Terraform configuration
│   ├── variables.tf          # Variable definitions
│   ├── outputs.tf            # Output values
│   └── modules/              # Terraform modules
│       ├── networking/       # VPC, subnets, networking
│       ├── security/         # Security groups, IAM roles
│       ├── compute/          # EKS cluster, EC2 instances
│       ├── database/         # RDS, database configuration
│       ├── monitoring/       # CloudWatch, logging
│       └── cdn/              # CloudFront, S3
├── kubernetes/               # Kubernetes manifests and Helm charts
│   ├── manifests/            # Raw Kubernetes YAML files
│   ├── helm-charts/          # Helm charts for application
│   └── operators/            # Custom operators
├── ansible/                  # Configuration management
│   ├── playbooks/            # Ansible playbooks
│   ├── roles/                # Reusable roles
│   └── inventories/          # Environment inventories
├── ci-cd/                    # CI/CD pipeline configurations
│   ├── github-actions/       # GitHub Actions workflows
│   ├── jenkins/              # Jenkins pipeline files
│   └── gitlab/               # GitLab CI configurations
├── scripts/                  # Deployment automation scripts
│   ├── deployment/           # Deployment scripts
│   ├── rollback/             # Rollback scripts
│   ├── maintenance/          # Maintenance scripts
│   └── monitoring/           # Monitoring scripts
└── environments/             # Environment-specific configurations
    ├── dev/                  # Development environment
    ├── staging/              # Staging environment
    └── production/           # Production environment
```

## Quick Start

### Prerequisites

1. **Tools Required:**
   - Terraform >= 1.0
   - kubectl >= 1.25
   - Helm >= 3.8
   - AWS CLI >= 2.0
   - Ansible >= 4.0
   - Docker >= 20.0

2. **Credentials:**
   - AWS credentials configured
   - Kubernetes cluster access
   - Container registry access

### Environment Setup

1. **Configure AWS CLI:**
   ```bash
   aws configure
   ```

2. **Set Environment Variables:**
   ```bash
   export AWS_REGION=us-east-1
   export TF_STATE_BUCKET=your-terraform-state-bucket
   export TF_LOCK_TABLE=your-terraform-lock-table
   export KUBECONFIG=~/.kube/config
   ```

3. **Initialize Terraform:**
   ```bash
   cd terraform/
   terraform init
   ```

### Deployment Process

#### 1. Infrastructure Deployment

Deploy infrastructure using Terraform:

```bash
# Plan infrastructure changes
terraform plan -var="environment=staging"

# Apply infrastructure
terraform apply -var="environment=staging"
```

#### 2. Application Deployment

Deploy application using Helm:

```bash
# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy to staging
helm upgrade --install flextime-staging ./kubernetes/helm-charts/flextime \
  --namespace flextime-staging \
  --create-namespace \
  --values ./environments/staging/values.yaml
```

#### 3. Automated Deployment

Use the deployment script for automated deployments:

```bash
# Deploy to staging
./scripts/deployment/deploy.sh staging v1.2.3

# Deploy to production
./scripts/deployment/deploy.sh production v1.2.3 --force
```

## Environment Configurations

### Development
- Single replica deployments
- Internal PostgreSQL and Redis
- Basic monitoring
- HTTP-only ingress

### Staging
- Multi-replica deployments
- External RDS and ElastiCache
- Full monitoring stack
- HTTPS with staging certificates
- Auto-scaling enabled

### Production
- High-availability deployments
- Production databases
- Comprehensive monitoring
- Production SSL certificates
- Advanced security policies
- Pod disruption budgets

## CI/CD Integration

### GitHub Actions

The deployment includes GitHub Actions workflows for:
- Automated testing
- Security scanning
- Container image building
- Staging deployments
- Production deployments
- Rollback procedures

Workflow triggers:
- **Staging:** Push to `develop` branch
- **Production:** Git tags starting with `v`

### Jenkins

Jenkins pipeline includes:
- Parallel test execution
- Multi-stage deployments
- Approval gates for production
- Automated rollback on failure

## Security Features

1. **Container Security:**
   - Non-root containers
   - Read-only root filesystems
   - Security contexts
   - Pod security policies

2. **Network Security:**
   - Network policies
   - Service mesh integration
   - Private subnets
   - VPC endpoints

3. **Secret Management:**
   - AWS Secrets Manager
   - Kubernetes secrets
   - Encrypted storage
   - Rotation policies

## Monitoring and Observability

### Metrics
- Prometheus for metrics collection
- Grafana for visualization
- Custom application metrics
- Infrastructure metrics

### Logging
- Centralized logging with ELK stack
- Structured JSON logging
- Log aggregation
- Log retention policies

### Alerting
- Alertmanager for alert routing
- Slack integration
- PagerDuty integration
- Escalation policies

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region replication
- Backup retention policies

### Application Backups
- Configuration backups
- Secret backups
- Helm release history
- Container image versions

## Disaster Recovery

1. **RTO (Recovery Time Objective):** 30 minutes
2. **RPO (Recovery Point Objective):** 1 hour
3. **Multi-AZ deployment**
4. **Cross-region backup replication**
5. **Automated failover procedures**

## Troubleshooting

### Common Issues

1. **Deployment Failures:**
   ```bash
   # Check pod status
   kubectl get pods -n flextime-staging
   
   # View logs
   kubectl logs deployment/flextime-app -n flextime-staging
   
   # Check events
   kubectl get events -n flextime-staging --sort-by='.lastTimestamp'
   ```

2. **Health Check Failures:**
   ```bash
   # Test health endpoints
   curl -v https://staging.flextime.big12sports.com/health
   curl -v https://staging.flextime.big12sports.com/api/health
   ```

3. **Database Connection Issues:**
   ```bash
   # Test database connectivity
   kubectl exec -it deployment/flextime-app -n flextime-staging -- \
     psql $DATABASE_URL -c "SELECT 1"
   ```

### Rollback Procedures

1. **Automatic Rollback:**
   Deployments automatically rollback on health check failures.

2. **Manual Rollback:**
   ```bash
   # Rollback to previous version
   ./scripts/rollback/rollback.sh staging
   
   # Rollback to specific revision
   ./scripts/rollback/rollback.sh staging --revision 2
   ```

## Maintenance

### Regular Maintenance Tasks

1. **Certificate Renewal:**
   - Automated through cert-manager
   - Let's Encrypt integration
   - 30-day renewal window

2. **Security Updates:**
   - Container image scanning
   - Dependency updates
   - Security patch management

3. **Capacity Planning:**
   - Resource utilization monitoring
   - Auto-scaling configuration
   - Performance optimization

### Scheduled Maintenance

- **Database maintenance:** Sunday 2:00 AM UTC
- **Cluster updates:** First Sunday of month
- **Security patches:** As needed
- **Certificate rotation:** Automated

## Support and Escalation

### Contact Information
- **Primary:** XII-Ops Team (#xii-ops)
- **Secondary:** DevOps Team (#devops)
- **Emergency:** On-call rotation

### Escalation Matrix
1. **Level 1:** Application issues
2. **Level 2:** Infrastructure issues
3. **Level 3:** Critical system failures

## Documentation Links

- [Architecture Documentation](../docs/architecture.md)
- [API Documentation](../docs/api.md)
- [Security Policies](../docs/security.md)
- [Runbooks](../docs/runbooks.md)

## Contributing

1. Follow GitOps practices
2. Test changes in development environment
3. Update documentation
4. Peer review required for production changes

## License

Copyright (c) 2024 Big 12 Conference. All rights reserved.