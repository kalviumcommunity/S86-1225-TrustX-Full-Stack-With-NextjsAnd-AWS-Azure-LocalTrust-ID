# PowerShell script to test logging implementation

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$TestEmail = "test-logger@example.com",
    [string]$TestPassword = "TestPassword123!"
)

Write-Host "🧪 Testing Structured Logging Implementation..." -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = ""
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        $uri = "$ApiUrl$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body $Data -ErrorAction Stop
        }
        
        $body = $response.Content | ConvertFrom-Json
        
        if ($body.requestId -or $response.Headers.'X-Request-ID') {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (Status: $($response.StatusCode), Request ID found)"
            $script:pass++
            return $true
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (Status: $($response.StatusCode), No request ID)"
            $script:fail++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (Status: $statusCode, Error: $($_.Exception.Message))"
        $script:fail++
        return $false
    }
}

# Test 1: Health Check
Write-Host "=== Test 1: Health Check Endpoint ===" -ForegroundColor Yellow
Test-Endpoint -Name "Health Check" -Method "GET" -Endpoint "/api/health/db"
Write-Host ""

# Test 2: Login
Write-Host "=== Test 2: Login Endpoint (Authentication Logging) ===" -ForegroundColor Yellow
$loginData = @{
    email = $TestEmail
    password = $TestPassword
} | ConvertTo-Json
Test-Endpoint -Name "Login" -Method "POST" -Endpoint "/api/auth/login" -Data $loginData
Write-Host ""

# Test 3: Failed Login
Write-Host "=== Test 3: Failed Login (Security Logging) ===" -ForegroundColor Yellow
$failedLoginData = @{
    email = $TestEmail
    password = "WrongPassword"
} | ConvertTo-Json
Test-Endpoint -Name "Failed Login" -Method "POST" -Endpoint "/api/auth/login" -Data $failedLoginData
Write-Host ""

# Test 4: Users List
Write-Host "=== Test 4: Users List (Cache Logging) ===" -ForegroundColor Yellow
Test-Endpoint -Name "Users List" -Method "GET" -Endpoint "/api/users?page=1&limit=10"
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary:"
Write-Host "Passed: $pass" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify log structure
Write-Host "🔍 Expected Log Structure:" -ForegroundColor Cyan
Write-Host @"
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
"@ -ForegroundColor Gray
Write-Host ""

# CloudWatch check (if AWS CLI available)
if (Get-Command aws -ErrorAction SilentlyContinue) {
    Write-Host "📊 Checking CloudWatch Logs..." -ForegroundColor Cyan
    $logGroup = "/ecs/trustx-task"
    $region = if ($env:AWS_REGION) { $env:AWS_REGION } else { "ap-south-1" }
    
    Write-Host "Attempting to query CloudWatch logs in $region..." -ForegroundColor Gray
    try {
        aws logs describe-log-groups --log-group-name-prefix $logGroup --region $region --output text 2>$null
        Write-Host "✓ CloudWatch log group found" -ForegroundColor Green
    } catch {
        Write-Host "Note: CloudWatch logs not accessible (may not be deployed yet)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Next Steps
Write-Host "✨ Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Deploy to AWS/Azure to see CloudWatch/Azure Monitor integration"
Write-Host "   2. Run setup scripts: setup-cloudwatch.ps1 or setup-azure-monitor.sh"
Write-Host "   3. View logs in cloud console"
Write-Host "   4. Set up alerts for error thresholds"
Write-Host "   5. Create custom dashboards for your metrics"
Write-Host ""

if ($fail -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some tests failed. Check implementation." -ForegroundColor Red
    exit 1
}
