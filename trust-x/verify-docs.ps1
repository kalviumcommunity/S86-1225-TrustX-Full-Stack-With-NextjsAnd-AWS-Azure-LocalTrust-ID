# API Documentation Verification Script (PowerShell)
# This script verifies that all documentation components are working correctly

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API Documentation Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$BaseUrl = "http://localhost:3000"

# Function to check if server is running
function Test-Server {
    Write-Host "🔍 Checking if development server is running..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is running" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ Server is not running" -ForegroundColor Red
        Write-Host "Please start the server with: npm run dev" -ForegroundColor Yellow
        return $false
    }
}

# Function to check Swagger UI
function Test-SwaggerUI {
    Write-Host ""
    Write-Host "🎨 Checking Swagger UI..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api-docs.html" -Method GET -UseBasicParsing
        if ($response.Content -match "swagger-ui") {
            Write-Host "✅ Swagger UI page exists" -ForegroundColor Green
            Write-Host "   Access at: $BaseUrl/api-docs.html" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ Swagger UI page content invalid" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Swagger UI page not found" -ForegroundColor Red
    }
}

# Function to check OpenAPI spec
function Test-OpenAPISpec {
    Write-Host ""
    Write-Host "📄 Checking OpenAPI Specification..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/docs" -Method GET
        if ($response.openapi) {
            Write-Host "✅ OpenAPI spec is accessible" -ForegroundColor Green
            Write-Host "   Access at: $BaseUrl/api/docs" -ForegroundColor Gray
            Write-Host "   Version: $($response.info.version)" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ OpenAPI spec format invalid" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ OpenAPI spec not accessible" -ForegroundColor Red
    }
}

# Function to check documentation files
function Test-DocumentationFiles {
    Write-Host ""
    Write-Host "📚 Checking documentation files..." -ForegroundColor Yellow
    
    $files = @(
        "ARCHITECTURE.md",
        "CHANGELOG.md",
        "API-DOCUMENTATION-INDEX.md",
        "postman_collection.json",
        "README.md",
        "src\lib\swagger.ts",
        "src\app\api\docs\route.ts",
        "public\api-docs.html"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Host "   ✅ $file" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ $file (missing)" -ForegroundColor Red
        }
    }
}

# Function to check API endpoints
function Test-APIEndpoints {
    Write-Host ""
    Write-Host "🔌 Checking API endpoints..." -ForegroundColor Yellow
    
    # Health check
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET
        if ($response.status -eq "healthy") {
            Write-Host "   ✅ /api/health - Working" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠  /api/health - Responding but status: $($response.status)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "   ❌ /api/health - Not responding" -ForegroundColor Red
    }
    
    # Database health
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/health/db" -Method GET -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ /api/health/db - Working" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   ⚠  /api/health/db - May need database setup" -ForegroundColor Yellow
    }
}

# Function to check package.json scripts
function Test-PackageScripts {
    Write-Host ""
    Write-Host "📦 Checking package.json scripts..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw
        
        if ($packageJson -match '"api:docs"') {
            Write-Host "   ✅ api:docs script added" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ api:docs script missing" -ForegroundColor Red
        }
        
        if ($packageJson -match '"api:spec"') {
            Write-Host "   ✅ api:spec script added" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ api:spec script missing" -ForegroundColor Red
        }
    }
}

# Function to check dependencies
function Test-Dependencies {
    Write-Host ""
    Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw
        
        if ($packageJson -match '"swagger-ui-express"') {
            Write-Host "   ✅ swagger-ui-express installed" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ swagger-ui-express missing" -ForegroundColor Red
        }
        
        if ($packageJson -match '"swagger-jsdoc"') {
            Write-Host "   ✅ swagger-jsdoc installed" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ swagger-jsdoc missing" -ForegroundColor Red
        }
    }
}

# Function to show summary
function Show-Summary {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Summary" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📖 Documentation Access Points:" -ForegroundColor White
    Write-Host "   • Swagger UI:    $BaseUrl/api-docs.html" -ForegroundColor Gray
    Write-Host "   • OpenAPI Spec:  $BaseUrl/api/docs" -ForegroundColor Gray
    Write-Host "   • Architecture:  .\ARCHITECTURE.md" -ForegroundColor Gray
    Write-Host "   • Changelog:     .\CHANGELOG.md" -ForegroundColor Gray
    Write-Host "   • API Index:     .\API-DOCUMENTATION-INDEX.md" -ForegroundColor Gray
    Write-Host "   • Postman:       .\postman_collection.json" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 Quick Commands:" -ForegroundColor White
    Write-Host "   npm run api:docs  - Show API docs URL" -ForegroundColor Gray
    Write-Host "   npm run api:spec  - Get OpenAPI spec" -ForegroundColor Gray
    Write-Host "   npm run dev       - Start development server" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
function Main {
    $serverRunning = Test-Server
    
    if ($serverRunning) {
        Test-SwaggerUI
        Test-OpenAPISpec
        Test-APIEndpoints
    }
    
    Test-DocumentationFiles
    Test-PackageScripts
    Test-Dependencies
    Show-Summary
    
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Verification Complete!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
}

# Run main function
Main
