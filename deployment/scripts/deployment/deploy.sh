#!/bin/bash

# Flextime Deployment Script
# Usage: ./deploy.sh [environment] [version] [options]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOYMENT_ROOT="${PROJECT_ROOT}"

# Default values
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
DRY_RUN=false
FORCE=false
SKIP_TESTS=false
ROLLBACK_ON_FAILURE=true
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

usage() {
    cat << EOF
Usage: $0 [environment] [version] [options]

Arguments:
    environment     Target environment (dev, staging, production) [default: staging]
    version         Version to deploy [default: latest]

Options:
    --dry-run       Show what would be deployed without making changes
    --force         Force deployment even if health checks fail
    --skip-tests    Skip pre-deployment tests
    --no-rollback   Disable automatic rollback on failure
    --verbose       Enable verbose output
    --help          Show this help message

Examples:
    $0 staging v1.2.3
    $0 production latest --dry-run
    $0 staging v1.2.3 --force --skip-tests

Environment Variables:
    AWS_REGION                  AWS region [default: us-east-1]
    KUBECONFIG                  Kubernetes config file
    SLACK_WEBHOOK_URL           Slack webhook for notifications
    DATABASE_URL                Database connection string
    REDIS_URL                   Redis connection string
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            --verbose)
                VERBOSE=true
                set -x
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|production)
            log "Deploying to environment: $ENVIRONMENT"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            error "Valid environments: dev, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    command -v aws >/dev/null 2>&1 || missing_tools+=("aws")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials not configured"
        exit 1
    fi
    
    # Check Kubernetes connection
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Configure kubectl for environment
configure_kubectl() {
    log "Configuring kubectl for environment: $ENVIRONMENT"
    
    local cluster_name="flextime-${ENVIRONMENT}-cluster"
    local aws_region="${AWS_REGION:-us-east-1}"
    
    aws eks update-kubeconfig --region "$aws_region" --name "$cluster_name"
    
    # Verify connection
    if ! kubectl get nodes >/dev/null 2>&1; then
        error "Failed to connect to cluster: $cluster_name"
        exit 1
    fi
    
    success "Connected to cluster: $cluster_name"
}

# Run pre-deployment tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warn "Skipping tests as requested"
        return 0
    fi
    
    log "Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        npm ci
    fi
    
    # Run linting
    log "Running linting..."
    npm run lint
    
    # Run unit tests
    log "Running unit tests..."
    npm run test:unit
    
    # Run integration tests
    log "Running integration tests..."
    npm run test:integration
    
    success "All tests passed"
}

# Build and push container images
build_images() {
    log "Building container images for version: $VERSION"
    
    local registry="ghcr.io/big12/flextime"
    local tag="$VERSION"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would build and push images with tag: $tag"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    log "Building backend image..."
    docker build -f Dockerfile.backend -t "$registry:$tag-backend" .
    docker push "$registry:$tag-backend"
    
    # Build frontend image
    log "Building frontend image..."
    docker build -f Dockerfile.frontend -t "$registry:$tag-frontend" .
    docker push "$registry:$tag-frontend"
    
    # Build worker image
    log "Building worker image..."
    docker build -f Dockerfile.worker -t "$registry:$tag-worker" .
    docker push "$registry:$tag-worker"
    
    success "Images built and pushed successfully"
}

# Deploy application
deploy_application() {
    log "Deploying Flextime to $ENVIRONMENT..."
    
    local namespace="flextime-$ENVIRONMENT"
    local chart_path="$DEPLOYMENT_ROOT/kubernetes/helm-charts/flextime"
    local values_file="$DEPLOYMENT_ROOT/environments/$ENVIRONMENT/values.yaml"
    
    if [[ ! -f "$values_file" ]]; then
        error "Values file not found: $values_file"
        exit 1
    fi
    
    local helm_args=(
        "upgrade" "--install" "flextime-$ENVIRONMENT"
        "$chart_path"
        "--namespace" "$namespace"
        "--create-namespace"
        "--values" "$values_file"
        "--set" "image.backend.tag=$VERSION-backend"
        "--set" "image.frontend.tag=$VERSION-frontend"
        "--set" "image.worker.tag=$VERSION-worker"
        "--wait"
        "--timeout=15m"
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        helm_args+=("--dry-run")
        log "DRY RUN: Helm command that would be executed:"
        echo "helm ${helm_args[*]}"
        return 0
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        helm_args+=("--debug")
    fi
    
    # Execute Helm deployment
    if helm "${helm_args[@]}"; then
        success "Application deployed successfully"
    else
        error "Deployment failed"
        return 1
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would wait for deployment to be ready"
        return 0
    fi
    
    log "Waiting for deployment to be ready..."
    
    local namespace="flextime-$ENVIRONMENT"
    local timeout=600
    
    if kubectl wait --for=condition=available --timeout="${timeout}s" \
        deployment/flextime-app -n "$namespace"; then
        success "Deployment is ready"
    else
        error "Deployment failed to become ready within ${timeout} seconds"
        return 1
    fi
}

# Run health checks
run_health_checks() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would run health checks"
        return 0
    fi
    
    log "Running health checks..."
    
    local base_url
    case $ENVIRONMENT in
        production)
            base_url="https://flextime.big12sports.com"
            ;;
        staging)
            base_url="https://staging.flextime.big12sports.com"
            ;;
        dev)
            base_url="https://dev.flextime.big12sports.com"
            ;;
    esac
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if curl -sf "$base_url/health" >/dev/null && \
           curl -sf "$base_url/api/health" >/dev/null; then
            success "Health checks passed"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Health checks failed after $max_attempts attempts"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Rollback on failure
rollback_deployment() {
    if [[ "$ROLLBACK_ON_FAILURE" != "true" ]]; then
        warn "Rollback disabled, skipping"
        return 0
    fi
    
    warn "Rolling back deployment..."
    
    local release_name="flextime-$ENVIRONMENT"
    local namespace="flextime-$ENVIRONMENT"
    
    if helm rollback "$release_name" --namespace "$namespace"; then
        warn "Rollback completed"
    else
        error "Rollback failed"
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
        log "No Slack webhook configured, skipping notification"
        return 0
    fi
    
    local color
    case $status in
        success) color="good" ;;
        warning) color="warning" ;;
        error) color="danger" ;;
        *) color="good" ;;
    esac
    
    local payload=$(jq -n \
        --arg channel "#deployments" \
        --arg color "$color" \
        --arg text "$message" \
        '{channel: $channel, attachments: [{color: $color, text: $text}]}')
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
}

# Main deployment function
main() {
    log "Starting Flextime deployment"
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"
    log "Dry run: $DRY_RUN"
    
    # Trap to handle errors
    trap 'error "Deployment failed at line $LINENO"; rollback_deployment; send_notification "error" "Flextime deployment to $ENVIRONMENT failed!"; exit 1' ERR
    
    validate_environment
    check_prerequisites
    configure_kubectl
    run_tests
    build_images
    deploy_application
    wait_for_deployment
    run_health_checks
    
    success "Deployment completed successfully!"
    send_notification "success" "Flextime successfully deployed to $ENVIRONMENT (version: $VERSION)"
}

# Parse arguments and run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi