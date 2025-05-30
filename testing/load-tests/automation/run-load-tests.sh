#!/bin/bash

# Flextime Load Testing Automation Script
# This script orchestrates the execution of comprehensive load tests

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
RESULTS_DIR="$PROJECT_ROOT/reports/load-test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Default configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-}"
ENVIRONMENT="${ENVIRONMENT:-local}"
TEST_SUITE="${TEST_SUITE:-all}"
PARALLEL_EXECUTION="${PARALLEL_EXECUTION:-true}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -u, --url URL           Base URL for testing (default: http://localhost:3000)
    -k, --api-key KEY       API key for authentication
    -e, --environment ENV   Environment (local|staging|production) (default: local)
    -s, --suite SUITE       Test suite (k6|jmeter|baseline|stress|spike|soak|volume|all) (default: all)
    -p, --parallel          Run tests in parallel (default: true)
    -n, --no-parallel       Run tests sequentially
    -w, --webhook URL       Webhook URL for notifications
    -r, --results-dir DIR   Results directory (default: reports/load-test-results)
    -h, --help              Show this help message

Examples:
    $0 --suite k6 --environment staging
    $0 --url https://api.flextime.com --suite baseline --api-key your-key
    $0 --suite all --parallel --webhook https://hooks.slack.com/...
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            -k|--api-key)
                API_KEY="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--suite)
                TEST_SUITE="$2"
                shift 2
                ;;
            -p|--parallel)
                PARALLEL_EXECUTION="true"
                shift
                ;;
            -n|--no-parallel)
                PARALLEL_EXECUTION="false"
                shift
                ;;
            -w|--webhook)
                NOTIFICATION_WEBHOOK="$2"
                shift 2
                ;;
            -r|--results-dir)
                RESULTS_DIR="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Validate environment and dependencies
validate_environment() {
    log_info "Validating environment and dependencies..."
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        log_warning "k6 not found. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install k6
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y k6
        else
            log_error "Please install k6 manually: https://k6.io/docs/getting-started/installation/"
            exit 1
        fi
    fi
    
    # Check if JMeter is available (optional)
    if ! command -v jmeter &> /dev/null; then
        log_warning "JMeter not found. JMeter tests will be skipped."
    fi
    
    # Test connectivity to the target URL
    log_info "Testing connectivity to $BASE_URL..."
    if ! curl -f -s -o /dev/null --max-time 10 "$BASE_URL/health" 2>/dev/null; then
        log_warning "Health check failed for $BASE_URL. Proceeding with tests anyway."
    else
        log_success "Health check passed for $BASE_URL"
    fi
    
    # Create results directory
    mkdir -p "$RESULTS_DIR/$TIMESTAMP"
}

# Run K6 tests
run_k6_tests() {
    local test_type="$1"
    local test_file="$PROJECT_ROOT/load-tests/scripts/k6/${test_type}-test.js"
    local output_file="$RESULTS_DIR/$TIMESTAMP/k6-${test_type}-results.json"
    
    if [[ ! -f "$test_file" ]]; then
        log_warning "K6 test file not found: $test_file"
        return 1
    fi
    
    log_info "Running K6 $test_type test..."
    
    local k6_options=(
        "run"
        "--out" "json=$output_file"
        "--env" "BASE_URL=$BASE_URL"
        "--env" "API_KEY=$API_KEY"
        "--env" "ENVIRONMENT=$ENVIRONMENT"
    )
    
    # Add additional options based on test type
    case $test_type in
        "volume")
            k6_options+=("--env" "VOLUME_SIZE=medium")
            ;;
        "stress")
            k6_options+=("--env" "MAX_VUS=200")
            ;;
    esac
    
    k6_options+=("$test_file")
    
    if k6 "${k6_options[@]}" 2>&1 | tee "$RESULTS_DIR/$TIMESTAMP/k6-${test_type}.log"; then
        log_success "K6 $test_type test completed"
        return 0
    else
        log_error "K6 $test_type test failed"
        return 1
    fi
}

# Run JMeter tests
run_jmeter_tests() {
    local test_type="$1"
    local test_file="$PROJECT_ROOT/load-tests/scripts/jmeter/flextime-${test_type}.jmx"
    local output_file="$RESULTS_DIR/$TIMESTAMP/jmeter-${test_type}-results.jtl"
    
    if [[ ! -f "$test_file" ]]; then
        log_warning "JMeter test file not found: $test_file"
        return 1
    fi
    
    if ! command -v jmeter &> /dev/null; then
        log_warning "JMeter not available, skipping $test_type test"
        return 1
    fi
    
    log_info "Running JMeter $test_type test..."
    
    local jmeter_options=(
        "-n"  # Non-GUI mode
        "-t" "$test_file"
        "-l" "$output_file"
        "-Jbase.url=$BASE_URL"
        "-Japi.key=$API_KEY"
        "-Jenvironment=$ENVIRONMENT"
        "-e"  # Generate HTML report
        "-o" "$RESULTS_DIR/$TIMESTAMP/jmeter-${test_type}-report"
    )
    
    if jmeter "${jmeter_options[@]}" 2>&1 | tee "$RESULTS_DIR/$TIMESTAMP/jmeter-${test_type}.log"; then
        log_success "JMeter $test_type test completed"
        return 0
    else
        log_error "JMeter $test_type test failed"
        return 1
    fi
}

# Execute test suite
execute_tests() {
    local test_results=()
    local failed_tests=()
    
    log_info "Starting load test execution for suite: $TEST_SUITE"
    log_info "Environment: $ENVIRONMENT | Base URL: $BASE_URL"
    log_info "Parallel execution: $PARALLEL_EXECUTION"
    
    case $TEST_SUITE in
        "k6")
            local k6_tests=("baseline" "stress" "spike" "soak" "volume")
            ;;
        "jmeter")
            local jmeter_tests=("api-suite" "baseline" "concurrent-users")
            ;;
        "baseline")
            local k6_tests=("baseline")
            local jmeter_tests=("baseline")
            ;;
        "stress")
            local k6_tests=("stress")
            ;;
        "spike")
            local k6_tests=("spike")
            ;;
        "soak")
            local k6_tests=("soak")
            ;;
        "volume")
            local k6_tests=("volume")
            ;;
        "all")
            local k6_tests=("baseline" "stress" "spike" "soak" "volume")
            local jmeter_tests=("api-suite" "baseline")
            ;;
        *)
            log_error "Unknown test suite: $TEST_SUITE"
            exit 1
            ;;
    esac
    
    # Run K6 tests
    if [[ -n "${k6_tests:-}" ]]; then
        if [[ "$PARALLEL_EXECUTION" == "true" ]]; then
            log_info "Running K6 tests in parallel..."
            local pids=()
            for test in "${k6_tests[@]}"; do
                run_k6_tests "$test" &
                pids+=($!)
            done
            
            # Wait for all parallel jobs
            for pid in "${pids[@]}"; do
                if wait "$pid"; then
                    test_results+=("k6-success")
                else
                    test_results+=("k6-failed")
                    failed_tests+=("k6-$test")
                fi
            done
        else
            log_info "Running K6 tests sequentially..."
            for test in "${k6_tests[@]}"; do
                if run_k6_tests "$test"; then
                    test_results+=("k6-$test-success")
                else
                    test_results+=("k6-$test-failed")
                    failed_tests+=("k6-$test")
                fi
            done
        fi
    fi
    
    # Run JMeter tests
    if [[ -n "${jmeter_tests:-}" ]]; then
        log_info "Running JMeter tests..."
        for test in "${jmeter_tests[@]}"; do
            if run_jmeter_tests "$test"; then
                test_results+=("jmeter-$test-success")
            else
                test_results+=("jmeter-$test-failed")
                failed_tests+=("jmeter-$test")
            fi
        done
    fi
    
    # Generate summary report
    generate_summary_report "${test_results[@]}"
    
    # Handle notifications
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        send_notification "${test_results[@]}"
    fi
    
    # Return exit code based on results
    if [[ ${#failed_tests[@]} -eq 0 ]]; then
        log_success "All load tests completed successfully!"
        return 0
    else
        log_error "Some tests failed: ${failed_tests[*]}"
        return 1
    fi
}

# Generate summary report
generate_summary_report() {
    local results=("$@")
    local report_file="$RESULTS_DIR/$TIMESTAMP/load-test-summary.json"
    
    log_info "Generating summary report..."
    
    cat > "$report_file" << EOF
{
  "execution": {
    "timestamp": "$TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "baseUrl": "$BASE_URL",
    "testSuite": "$TEST_SUITE",
    "parallelExecution": $PARALLEL_EXECUTION
  },
  "results": [
$(printf '    "%s",\n' "${results[@]}" | sed '$ s/,$//')
  ],
  "summary": {
    "total": ${#results[@]},
    "successful": $(printf '%s\n' "${results[@]}" | grep -c "success" || echo 0),
    "failed": $(printf '%s\n' "${results[@]}" | grep -c "failed" || echo 0)
  },
  "artifacts": {
    "resultsDirectory": "$RESULTS_DIR/$TIMESTAMP",
    "logs": [
$(find "$RESULTS_DIR/$TIMESTAMP" -name "*.log" -exec basename {} \; | sed 's/^/      "/; s/$/",/' | sed '$ s/,$//')
    ],
    "reports": [
$(find "$RESULTS_DIR/$TIMESTAMP" -name "*-report" -type d -exec basename {} \; | sed 's/^/      "/; s/$/",/' | sed '$ s/,$//')
    ]
  }
}
EOF
    
    log_success "Summary report generated: $report_file"
}

# Send notification
send_notification() {
    local results=("$@")
    local successful=$(printf '%s\n' "${results[@]}" | grep -c "success" || echo 0)
    local failed=$(printf '%s\n' "${results[@]}" | grep -c "failed" || echo 0)
    local total=${#results[@]}
    
    local status_emoji="✅"
    local status_text="SUCCESS"
    
    if [[ $failed -gt 0 ]]; then
        status_emoji="❌"
        status_text="FAILED"
    fi
    
    local payload=$(cat << EOF
{
  "text": "${status_emoji} Load Test ${status_text}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Load Test Execution Complete*\\n\\n*Environment:* $ENVIRONMENT\\n*Suite:* $TEST_SUITE\\n*Results:* $successful/$total successful"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Timestamp: $TIMESTAMP | Results: \`$RESULTS_DIR/$TIMESTAMP\`"
        }
      ]
    }
  ]
}
EOF
)
    
    if curl -X POST -H 'Content-type: application/json' --data "$payload" "$NOTIFICATION_WEBHOOK" &>/dev/null; then
        log_success "Notification sent successfully"
    else
        log_warning "Failed to send notification"
    fi
}

# Main execution
main() {
    echo "=== Flextime Load Testing Suite ==="
    echo "Timestamp: $TIMESTAMP"
    echo "=================================="
    
    parse_args "$@"
    validate_environment
    execute_tests
}

# Run main function with all arguments
main "$@"