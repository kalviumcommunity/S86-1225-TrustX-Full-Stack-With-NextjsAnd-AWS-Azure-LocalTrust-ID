# TrustX Application Test Script
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  TrustX Application Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
        Write-Host " PASSED" -ForegroundColor Green
        return @{ Test = $Name; Status = "PASSED" }
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return @{ Test = $Name; Status = "FAILED" }
    }
}

# Wait for server
Write-Host "Waiting for server..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run tests
$testResults += Test-Endpoint -Name "Health Check" -Url "$baseUrl/api/health/db"
$testResults += Test-Endpoint -Name "Home Page" -Url "$baseUrl/"
$testResults += Test-Endpoint -Name "Login Page" -Url "$baseUrl/login"

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Application is ready for:" -ForegroundColor Cyan
    Write-Host "  - Local development" -ForegroundColor Green
    Write-Host "  - Docker containerization" -ForegroundColor Green
    Write-Host "  - Cloud deployment" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some tests failed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
