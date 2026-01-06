#!/bin/bash

###############################################################################
# Deployment Verification Test Script
# 
# This script simulates the deployment verification process locally to test
# health checks, smoke tests, and rollback procedures.
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="$APP_URL/api/health"
MAX_RETRIES=5
RETRY_DELAY=5

###############################################################################
# Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if application is running
check_app_running() {
    print_header "STEP 1: Check Application Status"
    
    if curl -s "$APP_URL" > /dev/null 2>&1; then
        print_success "Application is running at $APP_URL"
        return 0
    else
        print_error "Application is not running at $APP_URL"
        print_info "Start the app with: npm run dev"
        exit 1
    fi
}

# Test health check endpoint
test_health_check() {
    print_header "STEP 2: Health Check Verification"
    
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        print_info "Attempt $((retry_count + 1))/$MAX_RETRIES: Checking $HEALTH_ENDPOINT"
        
        # Get status code
        STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_ENDPOINT" || echo "000")
        
        if [ "$STATUS_CODE" = "200" ]; then
            print_success "Health check passed! Status code: $STATUS_CODE"
            
            # Get detailed health info
            print_info "Fetching health details..."
            HEALTH_DATA=$(curl -s --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "{}")
            echo "$HEALTH_DATA" | jq '.' 2>/dev/null || echo "$HEALTH_DATA"
            
            return 0
        else
            print_warning "Health check failed with status: $STATUS_CODE"
            retry_count=$((retry_count + 1))
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                print_info "Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    print_error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

# Run smoke tests
run_smoke_tests() {
    print_header "STEP 3: Smoke Tests Execution"
    
    if [ ! -d "__smoke_tests__" ]; then
        print_warning "Smoke tests directory not found. Skipping..."
        return 0
    fi
    
    print_info "Running smoke tests..."
    
    if npm run test:smoke; then
        print_success "All smoke tests passed!"
        return 0
    else
        print_error "Smoke tests failed!"
        return 1
    fi
}

# Simulate rollback
simulate_rollback() {
    print_header "STEP 4: Simulating Rollback"
    
    print_warning "Deployment verification failed!"
    print_info "In production, this would trigger automatic rollback..."
    
    echo ""
    echo "Rollback procedure would:"
    echo "  1. Stop current deployment"
    echo "  2. Revert to previous task definition (AWS ECS)"
    echo "  3. Wait for rollback to stabilize (30s)"
    echo "  4. Verify health check on rolled-back version"
    echo "  5. Send alerts to operations team"
    echo ""
    
    print_info "Rollback simulation complete"
}

# Record metrics
record_metrics() {
    print_header "STEP 5: Deployment Metrics"
    
    local status=$1
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "Timestamp: $timestamp"
    echo "Status: $status"
    echo "Application URL: $APP_URL"
    echo "Health Endpoint: $HEALTH_ENDPOINT"
    
    if [ "$status" = "success" ]; then
        echo "MTTD: ~2 minutes (health check + smoke tests)"
        echo "MTTR: N/A (no failure)"
        echo "Change Failure Rate: Deployment successful ✅"
    else
        echo "MTTD: ~2 minutes (failure detected quickly)"
        echo "MTTR: ~5 minutes (automatic rollback)"
        echo "Change Failure Rate: Deployment failed ⚠️"
    fi
}

# Main test flow
main() {
    print_header "🚀 Deployment Verification Test"
    
    echo "Testing deployment verification process for: $APP_URL"
    echo "This simulates the CI/CD deployment verification steps"
    echo ""
    
    # Step 1: Check app
    check_app_running || exit 1
    
    # Step 2: Health check
    if ! test_health_check; then
        simulate_rollback
        record_metrics "failure"
        exit 1
    fi
    
    # Step 3: Smoke tests
    if ! run_smoke_tests; then
        simulate_rollback
        record_metrics "failure"
        exit 1
    fi
    
    # Success!
    print_header "✅ DEPLOYMENT VERIFICATION PASSED"
    print_success "All checks completed successfully!"
    print_success "Deployment would proceed to production"
    
    record_metrics "success"
    
    echo ""
    print_info "In production, this would:"
    echo "  • Mark deployment as successful"
    echo "  • Update monitoring dashboard"
    echo "  • Send success notification to team"
    echo "  • Record metrics (MTTD, MTTR, CFR)"
}

###############################################################################
# Run Tests
###############################################################################

# Check for jq (JSON processor)
if ! command -v jq &> /dev/null; then
    print_warning "jq not found. Install with: brew install jq (or apt-get install jq)"
    echo "Continuing without JSON formatting..."
fi

# Run main test flow
main

exit 0
