# Docker Build and Test Script
# Run this after Docker Desktop is fully started

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Docker Build & Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Docker connection
Write-Host "Step 1: Testing Docker connection..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Docker not found!" -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
Write-Host ""
Write-Host "Step 2: Checking Docker daemon..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$dockerReady = $false

while (-not $dockerReady -and $retryCount -lt $maxRetries) {
    try {
        docker ps | Out-Null
        $dockerReady = $true
        Write-Host "  Docker daemon is ready!" -ForegroundColor Green
    } catch {
        $retryCount++
        Write-Host "  Waiting for Docker daemon... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $dockerReady) {
    Write-Host ""
    Write-Host "  ERROR: Docker daemon is not responding!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop manually" -ForegroundColor Yellow
    Write-Host "  2. Wait for it to say 'Docker Desktop is running'" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Build Docker image
Write-Host ""
Write-Host "Step 3: Building Docker image..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes..." -ForegroundColor Cyan
Write-Host ""

$buildStart = Get-Date
docker build -t trustx-app .

if ($LASTEXITCODE -eq 0) {
    $buildEnd = Get-Date
    $duration = ($buildEnd - $buildStart).TotalSeconds
    
    Write-Host ""
    Write-Host "  BUILD SUCCESS!" -ForegroundColor Green
    Write-Host "  Build time: $([math]::Round($duration, 1)) seconds" -ForegroundColor Cyan
    
    # Check image size
    Write-Host ""
    Write-Host "Step 4: Checking image details..." -ForegroundColor Yellow
    $imageInfo = docker images trustx-app --format "{{.Size}}"
    Write-Host "  Image size: $imageInfo" -ForegroundColor Cyan
    
    # Run container
    Write-Host ""
    Write-Host "Step 5: Starting container..." -ForegroundColor Yellow
    Write-Host "  Running on http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    
    docker run -d -p 3000:3000 `
        -e NODE_ENV=production `
        -e DATABASE_URL="file:./dev.db" `
        -e JWT_SECRET="test-secret-key-123" `
        -e JWT_REFRESH_SECRET="test-refresh-secret-456" `
        --name trustx-test `
        trustx-app
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "  Container started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Waiting for application to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Test health endpoint
        Write-Host ""
        Write-Host "Step 6: Testing application..." -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health/db" -Method Get -TimeoutSec 10
            Write-Host "  Health check: PASSED" -ForegroundColor Green
            Write-Host "  Database status: $($response.database.status)" -ForegroundColor Cyan
        } catch {
            Write-Host "  Health check: FAILED" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # Show container logs
        Write-Host ""
        Write-Host "Container logs:" -ForegroundColor Cyan
        docker logs trustx-test --tail 20
        
        Write-Host ""
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "  Deployment Complete!" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Application running at: http://localhost:3000" -ForegroundColor Green
        Write-Host ""
        Write-Host "Useful commands:" -ForegroundColor Cyan
        Write-Host "  View logs:      docker logs trustx-test -f" -ForegroundColor White
        Write-Host "  Stop container: docker stop trustx-test" -ForegroundColor White
        Write-Host "  Remove:         docker rm trustx-test" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "  ERROR: Failed to start container!" -ForegroundColor Red
    }
    
} else {
    Write-Host ""
    Write-Host "  BUILD FAILED!" -ForegroundColor Red
    Write-Host "  Check the error messages above" -ForegroundColor Yellow
    Write-Host ""
}
