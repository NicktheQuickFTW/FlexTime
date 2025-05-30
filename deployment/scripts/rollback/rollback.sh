#!/bin/bash

# Flextime Rollback Script
# Usage: ./rollback.sh [environment] [options]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Default values
ENVIRONMENT="${1:-staging}"
REVISION=""
DRY_RUN=false
FORCE=false
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
Usage: $0 [environment] [options]

Arguments:
    environment     Target environment (dev, staging, production) [default: staging]

Options:
    --revision N    Rollback to specific revision (0 = previous, 1 = two versions back, etc.)
    --dry-run       Show what would be rolled back without making changes
    --force         Force rollback without confirmation
    --verbose       Enable verbose output
    --help          Show this help message

Examples:
    $0 staging
    $0 production --revision 1
    $0 staging --dry-run
    $0 production --force

Environment Variables:
    AWS_REGION                  AWS region [default: us-east-1]
    KUBECONFIG                  Kubernetes config file
    SLACK_WEBHOOK_URL           Slack webhook for notifications
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --revision)
                REVISION="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
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
            log "Rolling back environment: $ENVIRONMENT"
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

# Get current deployment status
get_deployment_status() {
    log "Getting current deployment status..."
    
    local release_name="flextime-$ENVIRONMENT"
    local namespace="flextime-$ENVIRONMENT"
    
    # Check if release exists
    if ! helm status "$release_name" -n "$namespace" >/dev/null 2>&1; then
        error "Release $release_name not found in namespace $namespace"
        exit 1
    fi
    
    # Get release history
    log "Release history:"
    helm history "$release_name" -n "$namespace" --max 10
    
    # Get current revision
    local current_revision
    current_revision=$(helm status "$release_name" -n "$namespace" -o json | jq -r '.version')
    log "Current revision: $current_revision"
    
    # Check deployment status
    local deployment_status
    deployment_status=$(kubectl get deployment flextime-app -n "$namespace" -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || echo "Unknown")
    log "Deployment status: $deployment_status"
    
    if [[ "$deployment_status" != "True" ]]; then
        warn "Current deployment is not healthy"
    fi
}

# Confirm rollback
confirm_rollback() {
    if [[ "$FORCE" == "true" || "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    warn "This will rollback the Flextime deployment in $ENVIRONMENT environment"
    if [[ -n "$REVISION" ]]; then
        warn "Rolling back to revision: $REVISION"
    else
        warn "Rolling back to previous revision"
    fi
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Rollback cancelled"
        exit 0
    fi
}

# Perform rollback
perform_rollback() {
    log "Performing rollback..."
    
    local release_name="flextime-$ENVIRONMENT"
    local namespace="flextime-$ENVIRONMENT"
    
    local rollback_args=(
        "rollback"
        "$release_name"
        "--namespace" "$namespace"
        "--wait"
        "--timeout=10m"
    )
    
    if [[ -n "$REVISION" ]]; then
        rollback_args+=("$REVISION")
        log "Rolling back to revision: $REVISION"
    else
        log "Rolling back to previous revision"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        rollback_args+=("--dry-run")
        log "DRY RUN: Helm command that would be executed:"
        echo "helm ${rollback_args[*]}"
        return 0
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        rollback_args+=("--debug")
    fi
    
    # Execute Helm rollback
    if helm "${rollback_args[@]}"; then
        success "Rollback completed successfully"
    else
        error "Rollback failed"
        return 1
    fi
}

# Wait for rollback to complete
wait_for_rollback() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would wait for rollback to complete"
        return 0
    fi
    
    log "Waiting for rollback to complete..."
    
    local namespace="flextime-$ENVIRONMENT"
    local timeout=600
    
    if kubectl wait --for=condition=available --timeout="${timeout}s" \
        deployment/flextime-app -n "$namespace"; then
        success "Rollback deployment is ready"
    else
        error "Rollback failed to become ready within ${timeout} seconds"
        return 1
    fi
}

# Run health checks after rollback
run_health_checks() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would run health checks"
        return 0
    fi
    
    log "Running post-rollback health checks..."
    
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
    
    local max_attempts=20
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

# Get rollback information
get_rollback_info() {
    local release_name="flextime-$ENVIRONMENT"
    local namespace="flextime-$ENVIRONMENT"
    
    log "Post-rollback information:"
    
    # Get new revision
    local new_revision
    new_revision=$(helm status "$release_name" -n "$namespace" -o json | jq -r '.version')
    log "New revision: $new_revision"
    
    # Get pod status
    log "Pod status:"
    kubectl get pods -n "$namespace" -l app=flextime
    
    # Get service status
    log "Service status:"
    kubectl get services -n "$namespace"
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

# Main rollback function
main() {
    log "Starting Flextime rollback"
    log "Environment: $ENVIRONMENT"
    log "Dry run: $DRY_RUN"
    if [[ -n "$REVISION" ]]; then
        log "Target revision: $REVISION"
    fi
    
    # Trap to handle errors
    trap 'error "Rollback failed at line $LINENO"; send_notification "error" "Flextime rollback in $ENVIRONMENT failed!"; exit 1' ERR
    
    validate_environment
    check_prerequisites
    configure_kubectl
    get_deployment_status
    confirm_rollback
    perform_rollback
    wait_for_rollback
    run_health_checks
    get_rollback_info
    
    success "Rollback completed successfully!"
    
    local message="Flextime rollback completed in $ENVIRONMENT"
    if [[ -n "$REVISION" ]]; then
        message="$message (to revision $REVISION)"
    fi
    send_notification "warning" "$message"
}

# Parse arguments and run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi