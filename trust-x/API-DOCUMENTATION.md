# API Documentation

## Overview

This Next.js application provides a comprehensive RESTful API for managing users, projects, orders, and products. All endpoints follow REST conventions with consistent naming, error handling, and pagination support.

## Base URL

```
http://localhost:3000/api
```

## API Route Structure

```
app/api/
├── users/
│   ├── route.ts          # GET all users, POST new user
│   └── [id]/route.ts     # GET, PUT, DELETE specific user
├── projects/
│   ├── route.ts          # GET all projects, POST new project
│   └── [id]/route.ts     # GET, PUT, DELETE specific project
├── orders/
│   ├── route.ts          # GET all orders, POST new order (with transactions)
│   └── [id]/route.ts     # GET, PATCH (status), DELETE specific order
└── products/
    ├── route.ts          # GET all products, POST new product
    └── [id]/route.ts     # GET, PUT, DELETE specific product
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* resource data */ },
  "pagination": { /* optional pagination info */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input parameters |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 500 | Internal Server Error | Unexpected server error |

---

## Endpoints

### Users API

#### 1. Get All Users

**Request:**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=john"
```

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 10, max: 100) - Items per page
- `search` (string) - Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### 2. Create New User

**Request:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "USER"
  }'
```

**Request Body:**
- `name` (string, required) - User's full name
- `email` (string, required) - Unique email address
- `role` (string, optional, default: "USER") - User role

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "USER",
    "createdAt": "2025-12-16T10:15:00Z"
  }
}
```

---

#### 3. Get User by ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/users/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2025-12-16T10:00:00Z",
    "updatedAt": "2025-12-16T10:00:00Z",
    "projects": [
      { "id": 1, "title": "Project Alpha" }
    ]
  }
}
```

---

#### 4. Update User

**Request:**
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.new@example.com"
  }'
```

**Request Body:**
- `name` (string, optional) - Updated name
- `email` (string, optional) - Updated email
- `role` (string, optional) - Updated role

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john.new@example.com",
    "role": "USER",
    "updatedAt": "2025-12-16T10:30:00Z"
  }
}
```

---

#### 5. Delete User

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### Projects API

#### 1. Get All Projects

**Request:**
```bash
curl -X GET "http://localhost:3000/api/projects?page=1&limit=10&status=active&userId=1"
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string) - Filter by project status (e.g., "active", "completed")
- `userId` (number) - Filter projects by user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Project Alpha",
      "description": "A sample project",
      "status": "active",
      "userId": 1,
      "createdAt": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### 2. Create New Project

**Request:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Beta",
    "description": "A new project",
    "userId": 1
  }'
```

**Request Body:**
- `title` (string, required) - Project title
- `description` (string, optional) - Project description
- `userId` (number, required) - Owner user ID

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 2,
    "title": "Project Beta",
    "description": "A new project",
    "status": "active",
    "userId": 1,
    "createdAt": "2025-12-16T10:15:00Z"
  }
}
```

---

#### 3. Get Project by ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/projects/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Project Alpha",
    "description": "A sample project",
    "status": "active",
    "userId": 1,
    "createdAt": "2025-12-16T10:00:00Z",
    "updatedAt": "2025-12-16T10:00:00Z",
    "tasks": [
      { "id": 1, "title": "Task 1", "status": "pending" }
    ]
  }
}
```

---

#### 4. Update Project

**Request:**
```bash
curl -X PUT http://localhost:3000/api/projects/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Alpha Updated",
    "status": "completed"
  }'
```

**Request Body:**
- `title` (string, optional) - Updated title
- `description` (string, optional) - Updated description
- `status` (string, optional) - Updated status

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": 1,
    "title": "Project Alpha Updated",
    "description": "A sample project",
    "status": "completed",
    "updatedAt": "2025-12-16T10:30:00Z"
  }
}
```

---

#### 5. Delete Project

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/projects/1
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### Orders API

#### 1. Get All Orders

**Request:**
```bash
curl -X GET "http://localhost:3000/api/orders?page=1&limit=10&status=pending&userId=1"
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string) - Filter by order status
- `userId` (number) - Filter orders by user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-1702795200000-abc123",
      "userId": 1,
      "totalAmount": 149.99,
      "status": "pending",
      "createdAt": "2025-12-16T10:00:00Z",
      "items": [
        {
          "id": 1,
          "productId": 5,
          "quantity": 2,
          "price": 74.99
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

#### 2. Create New Order (with Transaction)

**Request:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "productId": 5,
    "quantity": 2
  }'
```

**Request Body:**
- `userId` (number, required) - Buyer user ID
- `productId` (number, required) - Product ID
- `quantity` (number, required) - Quantity to purchase

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": 10,
      "orderNumber": "ORD-1702795500000-xyz789",
      "totalAmount": 149.99,
      "status": "pending"
    },
    "payment": {
      "id": 5,
      "amount": 149.99,
      "status": "pending"
    }
  },
  "duration": 125
}
```

---

#### 3. Get Order by ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/orders/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-1702795200000-abc123",
    "userId": 1,
    "totalAmount": 149.99,
    "status": "pending",
    "createdAt": "2025-12-16T10:00:00Z",
    "updatedAt": "2025-12-16T10:00:00Z",
    "items": [
      {
        "id": 1,
        "productId": 5,
        "quantity": 2,
        "price": 74.99
      }
    ],
    "payments": [
      {
        "id": 5,
        "amount": 149.99,
        "status": "pending",
        "createdAt": "2025-12-16T10:00:00Z"
      }
    ]
  }
}
```

---

#### 4. Update Order Status

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

**Request Body:**
- `status` (string, required) - One of: pending, confirmed, shipped, delivered, cancelled

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-1702795200000-abc123",
    "status": "shipped",
    "totalAmount": 149.99,
    "updatedAt": "2025-12-16T10:45:00Z"
  }
}
```

---

#### 5. Delete Order

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/orders/1
```

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

---

### Products API

#### 1. Get All Products

**Request:**
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10&search=laptop&minPrice=100&maxPrice=2000"
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string) - Search by name or description
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Laptop Pro",
      "description": "High-performance laptop",
      "price": 1299.99,
      "stock": 15,
      "sku": "SKU-LAPTOP-001",
      "createdAt": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### 2. Create New Product

**Request:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 49.99,
    "stock": 100,
    "sku": "SKU-MOUSE-001"
  }'
```

**Request Body:**
- `name` (string, required) - Product name
- `description` (string, optional) - Product description
- `price` (number, required) - Product price
- `stock` (number, required) - Available stock
- `sku` (string, optional) - Stock Keeping Unit (auto-generated if not provided)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 10,
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 49.99,
    "stock": 100,
    "sku": "SKU-MOUSE-001",
    "createdAt": "2025-12-16T10:15:00Z"
  }
}
```

---

#### 3. Get Product by ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/products/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Laptop Pro",
    "description": "High-performance laptop",
    "price": 1299.99,
    "stock": 15,
    "sku": "SKU-LAPTOP-001",
    "createdAt": "2025-12-16T10:00:00Z",
    "updatedAt": "2025-12-16T10:00:00Z",
    "inventory": [
      {
        "id": 1,
        "warehouseLocation": "Warehouse-A",
        "quantity": 10
      }
    ]
  }
}
```

---

#### 4. Update Product

**Request:**
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1199.99,
    "stock": 20,
    "name": "Laptop Pro Max"
  }'
```

**Request Body:**
- `name` (string, optional) - Updated name
- `description` (string, optional) - Updated description
- `price` (number, optional) - Updated price
- `stock` (number, optional) - Updated stock
- `sku` (string, optional) - Updated SKU

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Laptop Pro Max",
    "description": "High-performance laptop",
    "price": 1199.99,
    "stock": 20,
    "sku": "SKU-LAPTOP-001",
    "updatedAt": "2025-12-16T10:30:00Z"
  }
}
```

---

#### 5. Delete Product

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/products/1
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Error Examples

### 400 Bad Request - Missing Required Fields
```json
{
  "success": false,
  "error": "Name and email are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 409 Conflict - Duplicate Resource
```json
{
  "success": false,
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create user"
}
```

---

## Key Design Principles

### 1. **Consistent Naming Conventions**
- All routes use **plural nouns**: `/users`, `/projects`, `/orders`, `/products`
- No verbs in URLs - HTTP methods (GET, POST, PUT, DELETE) convey the action
- Lowercase, hyphen-separated path segments for nested routes: `/api/users/[id]`

### 2. **Pagination Support**
- Default `page=1`, `limit=10` for GET requests returning lists
- Maximum `limit=100` to prevent performance issues
- Response includes `pagination` object with: `page`, `limit`, `total`, `totalPages`
- Enables scalability as datasets grow

### 3. **Error Handling Strategy**
- **400 Bad Request**: Invalid input (e.g., missing required fields)
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate constraint violation (e.g., duplicate email)
- **500 Internal Server Error**: Unexpected server errors
- All errors include descriptive messages for debugging

### 4. **RESTful Resource Operations**
| Operation | HTTP Method | Example |
|-----------|-------------|---------|
| List (with pagination) | GET | `GET /api/users?page=1&limit=10` |
| Create | POST | `POST /api/users` |
| Retrieve | GET | `GET /api/users/1` |
| Update | PUT/PATCH | `PUT /api/users/1` or `PATCH /api/orders/1` |
| Delete | DELETE | `DELETE /api/users/1` |

### 5. **Transaction Support for Critical Operations**
- **Order creation** uses database transactions to ensure atomicity
- Automatically handles rollback if any step fails
- Prevents partial order-inventory-payment states

### 6. **Filtering & Search**
- **Users**: Search by name or email
- **Projects**: Filter by status and userId
- **Orders**: Filter by status and userId
- **Products**: Search by name/description, filter by price range

### 7. **Predictable Response Format**
- Every response has `success` boolean flag
- Success responses include `data` object
- List responses include `pagination` metadata
- Error responses include `error` description
- This consistency reduces integration errors and improves developer experience

---

## Why Consistency Matters

### Problem Without Consistency
```
/api/getUsers          vs  /api/users
/api/createProject     vs  /api/projects
/api/deleteOrder/:id   vs  /api/orders/:id
Different error codes for same scenarios
```

### Solution With Consistency
- **Predictability**: Developers can guess endpoint names correctly
- **Reduced Integration Errors**: Consistent behavior across all endpoints
- **Self-Documenting**: Route structure mirrors data model
- **Maintainability**: New team members onboard faster
- **Scalability**: Easy to add new resources following same patterns
- **Testability**: Uniform test patterns for all endpoints

---

## Testing the API

### Using curl

```bash
# Test user creation
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Test pagination
curl -X GET "http://localhost:3000/api/products?page=1&limit=5"

# Test filtering
curl -X GET "http://localhost:3000/api/orders?status=pending&userId=1"

# Test order creation with transaction
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"productId":5,"quantity":2}'
```

### Using Postman

1. Create a new collection: "TrustX API"
2. Add requests for each endpoint
3. Use Postman environments to store base URL
4. Test pagination by modifying `page` and `limit` parameters
5. Verify error responses with invalid data

---

## Summary

This API architecture demonstrates professional backend design through:
- ✅ **Consistent naming** preventing confusion and guessing
- ✅ **Standard HTTP methods** following REST conventions
- ✅ **Proper error handling** with meaningful status codes and messages
- ✅ **Pagination support** for scalability
- ✅ **Transaction support** for data integrity
- ✅ **Unified response format** reducing integration effort
- ✅ **Predictable behavior** improving developer experience

The consistency in this design ensures that as your API grows, developers can confidently predict endpoint behavior and structure without constantly referring to documentation.
