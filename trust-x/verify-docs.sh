#!/bin/bash

# API Documentation Verification Script
# This script verifies that all documentation components are working correctly

echo "=========================================="
echo "API Documentation Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Function to check if server is running
check_server() {
    echo "🔍 Checking if development server is running..."
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running${NC}"
        echo -e "${YELLOW}Please start the server with: npm run dev${NC}"
        return 1
    fi
}

# Function to check Swagger UI
check_swagger_ui() {
    echo ""
    echo "🎨 Checking Swagger UI..."
    if curl -s "$BASE_URL/api-docs.html" | grep -q "swagger-ui"; then
        echo -e "${GREEN}✅ Swagger UI page exists${NC}"
        echo "   Access at: $BASE_URL/api-docs.html"
    else
        echo -e "${RED}❌ Swagger UI page not found${NC}"
    fi
}

# Function to check OpenAPI spec
check_openapi_spec() {
    echo ""
    echo "📄 Checking OpenAPI Specification..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/docs")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -q "openapi"; then
            echo -e "${GREEN}✅ OpenAPI spec is accessible${NC}"
            echo "   Access at: $BASE_URL/api/docs"
            
            # Check version
            VERSION=$(echo "$BODY" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo "   Version: $VERSION"
        else
            echo -e "${RED}❌ OpenAPI spec format invalid${NC}"
        fi
    else
        echo -e "${RED}❌ OpenAPI spec not accessible (HTTP $HTTP_CODE)${NC}"
    fi
}

# Function to check documentation files
check_doc_files() {
    echo ""
    echo "📚 Checking documentation files..."
    
    FILES=(
        "ARCHITECTURE.md"
        "CHANGELOG.md"
        "API-DOCUMENTATION-INDEX.md"
        "postman_collection.json"
        "README.md"
        "src/lib/swagger.ts"
        "src/app/api/docs/route.ts"
        "public/api-docs.html"
    )
    
    for FILE in "${FILES[@]}"; do
        if [ -f "$FILE" ]; then
            echo -e "   ${GREEN}✅${NC} $FILE"
        else
            echo -e "   ${RED}❌${NC} $FILE (missing)"
        fi
    done
}

# Function to check API endpoints
check_api_endpoints() {
    echo ""
    echo "🔌 Checking API endpoints..."
    
    # Health check
    if curl -s "$BASE_URL/api/health" | grep -q "healthy"; then
        echo -e "   ${GREEN}✅${NC} /api/health - Working"
    else
        echo -e "   ${RED}❌${NC} /api/health - Not responding"
    fi
    
    # Database health
    DB_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/health/db")
    if echo "$DB_RESPONSE" | tail -1 | grep -q "200"; then
        echo -e "   ${GREEN}✅${NC} /api/health/db - Working"
    else
        echo -e "   ${YELLOW}⚠${NC}  /api/health/db - May need database setup"
    fi
}

# Function to check package.json scripts
check_scripts() {
    echo ""
    echo "📦 Checking package.json scripts..."
    
    if grep -q '"api:docs"' package.json; then
        echo -e "   ${GREEN}✅${NC} api:docs script added"
    else
        echo -e "   ${RED}❌${NC} api:docs script missing"
    fi
    
    if grep -q '"api:spec"' package.json; then
        echo -e "   ${GREEN}✅${NC} api:spec script added"
    else
        echo -e "   ${RED}❌${NC} api:spec script missing"
    fi
}

# Function to check dependencies
check_dependencies() {
    echo ""
    echo "📦 Checking dependencies..."
    
    if grep -q '"swagger-ui-express"' package.json; then
        echo -e "   ${GREEN}✅${NC} swagger-ui-express installed"
    else
        echo -e "   ${RED}❌${NC} swagger-ui-express missing"
    fi
    
    if grep -q '"swagger-jsdoc"' package.json; then
        echo -e "   ${GREEN}✅${NC} swagger-jsdoc installed"
    else
        echo -e "   ${RED}❌${NC} swagger-jsdoc missing"
    fi
}

# Function to show summary
show_summary() {
    echo ""
    echo "=========================================="
    echo "Summary"
    echo "=========================================="
    echo ""
    echo "📖 Documentation Access Points:"
    echo "   • Swagger UI:    $BASE_URL/api-docs.html"
    echo "   • OpenAPI Spec:  $BASE_URL/api/docs"
    echo "   • Architecture:  ./ARCHITECTURE.md"
    echo "   • Changelog:     ./CHANGELOG.md"
    echo "   • API Index:     ./API-DOCUMENTATION-INDEX.md"
    echo "   • Postman:       ./postman_collection.json"
    echo ""
    echo "🚀 Quick Commands:"
    echo "   npm run api:docs  - Show API docs URL"
    echo "   npm run api:spec  - Get OpenAPI spec"
    echo "   npm run dev       - Start development server"
    echo ""
}

# Main execution
main() {
    if check_server; then
        check_swagger_ui
        check_openapi_spec
        check_api_endpoints
    fi
    
    check_doc_files
    check_scripts
    check_dependencies
    show_summary
    
    echo "=========================================="
    echo -e "${GREEN}Verification Complete!${NC}"
    echo "=========================================="
}

# Run main function
main
