#!/bin/bash

# Test Logging Implementation
# Verifies that structured logging is working correctly

set -e

echo "🧪 Testing Structured Logging Implementation..."
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="test-logger@example.com"
TEST_PASSWORD="TestPassword123!"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Helper function to test endpoint and check logs
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # Check if response contains requestId
  if echo "$body" | grep -q "requestId"; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $http_code, Request ID found)"
    PASS=$((PASS + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Status: $http_code, No request ID in response)"
    FAIL=$((FAIL + 1))
    return 1
  fi
}

# Test 1: Health Check
echo "=== Test 1: Health Check Endpoint ==="
test_endpoint "Health Check" "GET" "/api/health/db" ""
echo ""

# Test 2: Login (should log authentication event)
echo "=== Test 2: Login Endpoint (Authentication Logging) ==="
test_endpoint "Login" "POST" "/api/auth/login" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
echo ""

# Test 3: Failed Login (should log security event)
echo "=== Test 3: Failed Login (Security Logging) ==="
test_endpoint "Failed Login" "POST" "/api/auth/login" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword\"}"
echo ""

# Test 4: Users List (should log cache operations)
echo "=== Test 4: Users List (Cache Logging) ==="
test_endpoint "Users List" "GET" "/api/users?page=1&limit=10" ""
echo ""

# Test 5: Invalid Endpoint (should log 404 error)
echo "=== Test 5: Invalid Endpoint (Error Logging) ==="
curl -s -w "\n%{http_code}" "$API_URL/api/nonexistent" > /dev/null 2>&1
echo -e "${YELLOW}404 Expected${NC} (Error should be logged)"
echo ""

# Summary
echo "========================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo "========================================"
echo ""

# Check CloudWatch Logs (if AWS CLI is available)
if command -v aws &> /dev/null; then
  echo "📊 Checking CloudWatch Logs..."
  echo ""
  
  LOG_GROUP="/ecs/trustx-task"
  REGION="${AWS_REGION:-ap-south-1}"
  
  echo "Recent log entries (last 5 minutes):"
  aws logs filter-log-events \
    --log-group-name "$LOG_GROUP" \
    --region "$REGION" \
    --start-time $(($(date +%s) - 300))000 \
    --limit 10 \
    --query 'events[*].[timestamp, message]' \
    --output text 2>/dev/null || echo "Note: CloudWatch logs not accessible (may not be deployed yet)"
  echo ""
  
  echo "Error count (last hour):"
  aws logs filter-log-events \
    --log-group-name "$LOG_GROUP" \
    --region "$REGION" \
    --start-time $(($(date +%s) - 3600))000 \
    --filter-pattern '{ $.level = "error" }' \
    --query 'length(events)' \
    --output text 2>/dev/null || echo "Note: CloudWatch logs not accessible"
  echo ""
fi

# Verify log structure
echo "🔍 Verifying Log Structure..."
echo ""
echo "Expected log format:"
cat <<EOF
{
  "timestamp": "2026-01-05T10:30:00.000Z",
  "level": "info",
  "message": "API request completed",
  "requestId": "1736073000000-abc123",
  "context": {
    "endpoint": "/api/users",
    "method": "GET",
    "statusCode": 200,
    "duration": 145
  }
}
EOF
echo ""

# Check if Node.js app is logging correctly
echo "📝 Sample log entries (check your terminal/docker logs):"
echo "   - Look for JSON-formatted logs"
echo "   - Each should have: timestamp, level, message, requestId"
echo "   - Check for structured context objects"
echo ""

# Recommendations
echo "✨ Next Steps:"
echo "   1. Deploy to AWS/Azure to see CloudWatch/Azure Monitor integration"
echo "   2. Run setup scripts: setup-cloudwatch.sh or setup-azure-monitor.sh"
echo "   3. View logs in cloud console"
echo "   4. Set up alerts for error thresholds"
echo "   5. Create custom dashboards for your metrics"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Check implementation.${NC}"
  exit 1
fi
