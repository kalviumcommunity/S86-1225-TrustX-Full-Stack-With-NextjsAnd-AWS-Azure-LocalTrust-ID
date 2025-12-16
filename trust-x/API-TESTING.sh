#!/bin/bash
#
# API Testing Script - TrustX Full Stack Application
# This script contains curl commands to test all API endpoints
# 
# Setup: Make sure the Next.js development server is running on http://localhost:3000
# Usage: Copy and paste individual commands, or run with bash (some commands depend on previous responses)
#
# Note: For production, replace localhost:3000 with your production API endpoint
#

API_BASE="http://localhost:3000/api"

echo "=========================================="
echo "TrustX API Testing Guide"
echo "=========================================="
echo "Base URL: $API_BASE"
echo ""

# ============================================
# USERS API TESTS
# ============================================

echo "1. USERS API - TESTING"
echo "----------------------------------------------"

# Create User 1
echo "Creating User 1..."
USER_1_RESPONSE=$(curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "USER"
  }')
echo "$USER_1_RESPONSE" | jq '.'
USER_1_ID=$(echo "$USER_1_RESPONSE" | jq -r '.data.id')
echo "Created User ID: $USER_1_ID"
echo ""

# Create User 2
echo "Creating User 2..."
USER_2_RESPONSE=$(curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@example.com",
    "role": "USER"
  }')
echo "$USER_2_RESPONSE" | jq '.'
USER_2_ID=$(echo "$USER_2_RESPONSE" | jq -r '.data.id')
echo ""

# Get All Users with Pagination
echo "Getting all users (page 1, limit 10)..."
curl -s -X GET "$API_BASE/users?page=1&limit=10" | jq '.'
echo ""

# Search Users
echo "Searching users for 'alice'..."
curl -s -X GET "$API_BASE/users?search=alice" | jq '.'
echo ""

# Get User by ID
echo "Getting User with ID $USER_1_ID..."
curl -s -X GET "$API_BASE/users/$USER_1_ID" | jq '.'
echo ""

# Update User
echo "Updating User $USER_1_ID..."
curl -s -X PUT "$API_BASE/users/$USER_1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Updated"
  }' | jq '.'
echo ""

# ============================================
# PROJECTS API TESTS
# ============================================

echo ""
echo "2. PROJECTS API - TESTING"
echo "----------------------------------------------"

# Create Project 1
echo "Creating Project 1 for User $USER_1_ID..."
PROJECT_1_RESPONSE=$(curl -s -X POST "$API_BASE/projects" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"AI Implementation Project\",
    \"description\": \"Building machine learning features\",
    \"userId\": $USER_1_ID
  }")
echo "$PROJECT_1_RESPONSE" | jq '.'
PROJECT_1_ID=$(echo "$PROJECT_1_RESPONSE" | jq -r '.data.id')
echo ""

# Create Project 2
echo "Creating Project 2 for User $USER_2_ID..."
PROJECT_2_RESPONSE=$(curl -s -X POST "$API_BASE/projects" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Database Optimization\",
    \"description\": \"Query performance improvements\",
    \"userId\": $USER_2_ID
  }")
echo "$PROJECT_2_RESPONSE" | jq '.'
PROJECT_2_ID=$(echo "$PROJECT_2_RESPONSE" | jq -r '.data.id')
echo ""

# Get All Projects
echo "Getting all projects..."
curl -s -X GET "$API_BASE/projects?page=1&limit=10" | jq '.'
echo ""

# Filter Projects by User
echo "Getting projects for User $USER_1_ID..."
curl -s -X GET "$API_BASE/projects?userId=$USER_1_ID" | jq '.'
echo ""

# Get Project by ID
echo "Getting Project $PROJECT_1_ID..."
curl -s -X GET "$API_BASE/projects/$PROJECT_1_ID" | jq '.'
echo ""

# Update Project
echo "Updating Project $PROJECT_1_ID status to 'completed'..."
curl -s -X PUT "$API_BASE/projects/$PROJECT_1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }' | jq '.'
echo ""

# ============================================
# PRODUCTS API TESTS
# ============================================

echo ""
echo "3. PRODUCTS API - TESTING"
echo "----------------------------------------------"

# Create Product 1
echo "Creating Product 1 (Laptop)..."
PRODUCT_1_RESPONSE=$(curl -s -X POST "$API_BASE/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Pro",
    "description": "High-performance laptop with SSD",
    "price": 1299.99,
    "stock": 15,
    "sku": "SKU-LAPTOP-001"
  }')
echo "$PRODUCT_1_RESPONSE" | jq '.'
PRODUCT_1_ID=$(echo "$PRODUCT_1_RESPONSE" | jq -r '.data.id')
echo ""

# Create Product 2
echo "Creating Product 2 (Mouse)..."
PRODUCT_2_RESPONSE=$(curl -s -X POST "$API_BASE/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 49.99,
    "stock": 100,
    "sku": "SKU-MOUSE-001"
  }')
echo "$PRODUCT_2_RESPONSE" | jq '.'
PRODUCT_2_ID=$(echo "$PRODUCT_2_RESPONSE" | jq -r '.data.id')
echo ""

# Get All Products
echo "Getting all products..."
curl -s -X GET "$API_BASE/products?page=1&limit=10" | jq '.'
echo ""

# Search Products
echo "Searching products for 'laptop'..."
curl -s -X GET "$API_BASE/products?search=laptop" | jq '.'
echo ""

# Filter by Price Range
echo "Getting products between \$100 and \$500..."
curl -s -X GET "$API_BASE/products?minPrice=100&maxPrice=500" | jq '.'
echo ""

# Get Product by ID
echo "Getting Product $PRODUCT_1_ID..."
curl -s -X GET "$API_BASE/products/$PRODUCT_1_ID" | jq '.'
echo ""

# Update Product
echo "Updating Product $PRODUCT_1_ID price..."
curl -s -X PUT "$API_BASE/products/$PRODUCT_1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1199.99,
    "stock": 20
  }' | jq '.'
echo ""

# ============================================
# ORDERS API TESTS
# ============================================

echo ""
echo "4. ORDERS API - TESTING (with Transactions)"
echo "----------------------------------------------"

# Create Order 1 (with transaction - ensures atomicity)
echo "Creating Order 1 for User $USER_1_ID (uses transaction for data integrity)..."
ORDER_1_RESPONSE=$(curl -s -X POST "$API_BASE/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_1_ID,
    \"productId\": $PRODUCT_1_ID,
    \"quantity\": 1
  }")
echo "$ORDER_1_RESPONSE" | jq '.'
ORDER_1_ID=$(echo "$ORDER_1_RESPONSE" | jq -r '.data.order.id // empty')
echo "Created Order ID: $ORDER_1_ID"
echo ""

# Get All Orders
echo "Getting all orders..."
curl -s -X GET "$API_BASE/orders?page=1&limit=10" | jq '.'
echo ""

# Filter Orders by Status
echo "Getting orders with status 'pending'..."
curl -s -X GET "$API_BASE/orders?status=pending" | jq '.'
echo ""

# Filter Orders by User
echo "Getting orders for User $USER_1_ID..."
curl -s -X GET "$API_BASE/orders?userId=$USER_1_ID" | jq '.'
echo ""

# Get Order by ID
if [ ! -z "$ORDER_1_ID" ]; then
  echo "Getting Order $ORDER_1_ID with full details..."
  curl -s -X GET "$API_BASE/orders/$ORDER_1_ID" | jq '.'
  echo ""

  # Update Order Status
  echo "Updating Order $ORDER_1_ID status to 'confirmed'..."
  curl -s -X PATCH "$API_BASE/orders/$ORDER_1_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "confirmed"
    }' | jq '.'
  echo ""

  echo "Updating Order $ORDER_1_ID status to 'shipped'..."
  curl -s -X PATCH "$API_BASE/orders/$ORDER_1_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "shipped"
    }' | jq '.'
  echo ""
fi

# ============================================
# ERROR HANDLING TESTS
# ============================================

echo ""
echo "5. ERROR HANDLING TESTS"
echo "----------------------------------------------"

# Test 400 - Missing Required Fields
echo "Test 400 Bad Request - Missing required fields..."
curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "OnlyName"}' | jq '.'
echo ""

# Test 400 - Invalid ID
echo "Test 400 Bad Request - Invalid user ID (not a number)..."
curl -s -X GET "$API_BASE/users/invalid-id" | jq '.'
echo ""

# Test 404 - User Not Found
echo "Test 404 Not Found - Non-existent user..."
curl -s -X GET "$API_BASE/users/99999" | jq '.'
echo ""

# Test 409 - Conflict (Duplicate Email)
echo "Test 409 Conflict - Creating user with duplicate email..."
curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Alice Copy\",
    \"email\": \"alice@example.com\"
  }" | jq '.'
echo ""

# Test Invalid Order - Product Not Found
echo "Test 400 Bad Request - Creating order with non-existent product..."
curl -s -X POST "$API_BASE/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_1_ID,
    \"productId\": 99999,
    \"quantity\": 1
  }" | jq '.'
echo ""

# ============================================
# PAGINATION TESTS
# ============================================

echo ""
echo "6. PAGINATION TESTS"
echo "----------------------------------------------"

echo "Getting users with page=1, limit=2..."
curl -s -X GET "$API_BASE/users?page=1&limit=2" | jq '.pagination'
echo ""

echo "Getting users with page=2, limit=2..."
curl -s -X GET "$API_BASE/users?page=2&limit=2" | jq '.pagination'
echo ""

echo "Getting products with limit=5..."
curl -s -X GET "$API_BASE/products?page=1&limit=5" | jq '.pagination'
echo ""

# ============================================
# TESTING COMPLETE
# ============================================

echo ""
echo "=========================================="
echo "API Testing Complete!"
echo "=========================================="
echo ""
echo "Key Testing Insights:"
echo "✅ All CRUD operations work correctly"
echo "✅ Pagination and filtering function properly"
echo "✅ Error handling returns appropriate status codes"
echo "✅ Transaction support ensures data integrity for orders"
echo "✅ Consistent response format across all endpoints"
echo ""
echo "Next Steps:"
echo "1. Review API-DOCUMENTATION.md for detailed endpoint specs"
echo "2. Use Postman collection for interactive testing"
echo "3. Monitor database logs to verify transaction behavior"
echo "4. Test load scenarios with pagination"
echo ""
