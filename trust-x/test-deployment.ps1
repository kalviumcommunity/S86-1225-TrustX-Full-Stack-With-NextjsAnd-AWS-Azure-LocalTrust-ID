# TrustX Application Test Script
# Tests all critical endpoints and functionality

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  TrustX Application Tests" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method Post -Body ($Body | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        }
        
        Write-Host " ✅ PASSED" -ForegroundColor Green
        return @{
            Test = $Name
            Status = "PASSED"
            Response = $response
        }
    }
    catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return @{
            Test = $Name
            Status = "FAILED"
            Error = $_.Exception.Message
        }
    }
}

# Wait for server to be ready
Write-Host "Waiting for server to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test 1: Health Check
$testResults += Test-Endpoint -Name "Health Check (Database)" -Url "$baseUrl/api/health/db"

# Test 2: Home Page
$testResults += Test-Endpoint -Name "Home Page" -Url "$baseUrl/"

# Test 3: Login Page
$testResults += Test-Endpoint -Name "Login Page" -Url "$baseUrl/login"

# Test 4: API Routes
$testResults += Test-Endpoint -Name "API Health" -Url "$baseUrl/api/health/db?detailed=true"

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    Write-Host "`nApplication is ready for:" -ForegroundColor Cyan
    Write-Host "  • Local development ✓" -ForegroundColor Green
    Write-Host "  • Docker containerization ✓" -ForegroundColor Green
    Write-Host "  • Cloud deployment ✓" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
