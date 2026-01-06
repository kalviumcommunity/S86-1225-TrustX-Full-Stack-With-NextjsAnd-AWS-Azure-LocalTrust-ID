###############################################################################
# Deployment Verification Test Script (PowerShell)
# 
# This script simulates the deployment verification process locally to test
# health checks, smoke tests, and rollback procedures on Windows.
###############################################################################

# Configuration
$APP_URL = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { "http://localhost:3000" }
$HEALTH_ENDPOINT = "$APP_URL/api/health"
$MAX_RETRIES = 5
$RETRY_DELAY = 5

###############################################################################
# Functions
###############################################################################

function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check if application is running
function Test-AppRunning {
    Write-Header "STEP 1: Check Application Status"
    
    try {
        $response = Invoke-WebRequest -Uri $APP_URL -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Success "Application is running at $APP_URL"
        return $true
    } catch {
        Write-ErrorMsg "Application is not running at $APP_URL"
        Write-Info "Start the app with: npm run dev"
        return $false
    }
}

# Test health check endpoint
function Test-HealthCheck {
    Write-Header "STEP 2: Health Check Verification"
    
    for ($retry = 0; $retry -lt $MAX_RETRIES; $retry++) {
        Write-Info "Attempt $($retry + 1)/$MAX_RETRIES : Checking $HEALTH_ENDPOINT"
        
        try {
            $response = Invoke-WebRequest -Uri $HEALTH_ENDPOINT -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed! Status code: $($response.StatusCode)"
                
                # Get detailed health info
                Write-Info "Fetching health details..."
                $healthData = $response.Content | ConvertFrom-Json
                $healthData | ConvertTo-Json -Depth 10 | Write-Host
                
                return $true
            } else {
                Write-Warning "Health check failed with status: $($response.StatusCode)"
            }
        } catch {
            Write-Warning "Health check failed: $($_.Exception.Message)"
        }
        
        if ($retry -lt ($MAX_RETRIES - 1)) {
            Write-Info "Retrying in $RETRY_DELAY seconds..."
            Start-Sleep -Seconds $RETRY_DELAY
        }
    }
    
    Write-ErrorMsg "Health check failed after $MAX_RETRIES attempts"
    return $false
}

# Run smoke tests
function Invoke-SmokeTests {
    Write-Header "STEP 3: Smoke Tests Execution"
    
    if (-not (Test-Path "__smoke_tests__")) {
        Write-Warning "Smoke tests directory not found. Skipping..."
        return $true
    }
    
    Write-Info "Running smoke tests..."
    
    try {
        npm run test:smoke
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All smoke tests passed!"
            return $true
        } else {
            Write-ErrorMsg "Smoke tests failed!"
            return $false
        }
    } catch {
        Write-ErrorMsg "Smoke tests failed with error: $($_.Exception.Message)"
        return $false
    }
}

# Simulate rollback
function Invoke-RollbackSimulation {
    Write-Header "STEP 4: Simulating Rollback"
    
    Write-Warning "Deployment verification failed!"
    Write-Info "In production, this would trigger automatic rollback..."
    
    Write-Host ""
    Write-Host "Rollback procedure would:"
    Write-Host "  1. Stop current deployment"
    Write-Host "  2. Revert to previous task definition (AWS ECS)"
    Write-Host "  3. Wait for rollback to stabilize (30s)"
    Write-Host "  4. Verify health check on rolled-back version"
    Write-Host "  5. Send alerts to operations team"
    Write-Host ""
    
    Write-Info "Rollback simulation complete"
}

# Record metrics
function Write-Metrics {
    param([string]$Status)
    
    Write-Header "STEP 5: Deployment Metrics"
    
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    Write-Host "Timestamp: $timestamp"
    Write-Host "Status: $Status"
    Write-Host "Application URL: $APP_URL"
    Write-Host "Health Endpoint: $HEALTH_ENDPOINT"
    
    if ($Status -eq "success") {
        Write-Host "MTTD: ~2 minutes (health check + smoke tests)"
        Write-Host "MTTR: N/A (no failure)"
        Write-Host "Change Failure Rate: Deployment successful ✅"
    } else {
        Write-Host "MTTD: ~2 minutes (failure detected quickly)"
        Write-Host "MTTR: ~5 minutes (automatic rollback)"
        Write-Host "Change Failure Rate: Deployment failed ⚠️"
    }
}

###############################################################################
# Main Test Flow
###############################################################################

function Start-DeploymentVerification {
    Write-Header "🚀 Deployment Verification Test"
    
    Write-Host "Testing deployment verification process for: $APP_URL"
    Write-Host "This simulates the CI/CD deployment verification steps"
    Write-Host ""
    
    # Step 1: Check app
    if (-not (Test-AppRunning)) {
        exit 1
    }
    
    # Step 2: Health check
    if (-not (Test-HealthCheck)) {
        Invoke-RollbackSimulation
        Write-Metrics "failure"
        exit 1
    }
    
    # Step 3: Smoke tests
    if (-not (Invoke-SmokeTests)) {
        Invoke-RollbackSimulation
        Write-Metrics "failure"
        exit 1
    }
    
    # Success!
    Write-Header "✅ DEPLOYMENT VERIFICATION PASSED"
    Write-Success "All checks completed successfully!"
    Write-Success "Deployment would proceed to production"
    
    Write-Metrics "success"
    
    Write-Host ""
    Write-Info "In production, this would:"
    Write-Host "  • Mark deployment as successful"
    Write-Host "  • Update monitoring dashboard"
    Write-Host "  • Send success notification to team"
    Write-Host "  • Record metrics (MTTD, MTTR, CFR)"
}

###############################################################################
# Run Tests
###############################################################################

# Set error action preference
$ErrorActionPreference = "Continue"

# Run main test flow
Start-DeploymentVerification

exit 0
