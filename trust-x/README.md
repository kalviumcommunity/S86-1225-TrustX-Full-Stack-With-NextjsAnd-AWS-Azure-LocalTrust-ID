Global API Response Handler
===========================

This project uses a centralized response handler to ensure all API routes return a consistent envelope.

Response envelope format
------------------------

{
  "success": boolean,
  "message": string,
  "data"?: any,
  "error"?: { "code": string, "details"?: string },
  "timestamp": string
}

Files
- `src/lib/responseHandler.ts` — exports `sendSuccess` and `sendError` helpers.
- `src/lib/errorCodes.ts` — standard error code mappings.

Usage examples
--------------

// Success
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 12, "name": "Charlie" },
  "timestamp": "2025-10-30T10:00:00Z"
}

// Error
{
  "success": false,
  "message": "Missing required field: name",
  "error": { "code": "VALIDATION_ERROR" },
  "timestamp": "2025-10-30T10:00:00Z"
}

Route usage
-----------

Import and use the helpers inside any route:

import { sendSuccess, sendError } from '@/lib/responseHandler';
import { ERROR_CODES } from '@/lib/errorCodes';

try {
  // ...logic
  return sendSuccess(data, 'Fetched successfully', 200);
} catch (err) {
  return sendError('Internal error', ERROR_CODES.INTERNAL_ERROR, 500, err);
}

Defined error codes
-------------------

VALIDATION_ERROR — E001
NOT_FOUND — E002
DATABASE_FAILURE — E003
INTERNAL_ERROR — E500

Benefits
--------
- Predictable responses for front-end consumers
- Easier error tracing with error codes and timestamps
- Simplified monitoring and observability integration

Input validation with Zod
------------------------

This project uses Zod to validate incoming `POST` and `PUT` requests for products.

Files:
- `src/lib/schemas/productSchema.ts` — Zod schemas for creating and updating products.

Example usage (server-side):

import { productCreateSchema } from '@/lib/schemas/productSchema';
import { ZodError } from 'zod';

try {
  const body = await req.json();
  const validated = productCreateSchema.parse(body);
  // use validated values
} catch (err) {
  if (err instanceof ZodError) {
    // return structured validation errors
  }
}

Validation benefits:
- Prevents invalid records entering the database
- Provides clear client-facing error messages
- Enables reuse of schemas on client and server

Authentication APIs
===================

This project implements secure user authentication using bcrypt for password hashing and JWT for session management.

Authentication vs Authorization
-------------------------------

- **Authentication**: Verifying who the user is (e.g., login with email/password).
- **Authorization**: Determining what the user can do (e.g., role-based access).

Endpoints
---------

### Signup
- **URL**: `POST /api/auth/signup`
- **Body**:
  ```json
  {
    "name": "Alice",
    "email": "alice@example.com",
    "password": "mypassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Signup successful",
    "user": { "id": 1, "name": "Alice", "email": "alice@example.com" }
  }
  ```

### Login
- **URL**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "mypassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Protected Route Example
- **URL**: `GET /api/users`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: List of users (if token is valid)

Security Features
-----------------

- **Password Hashing**: Uses bcrypt with 10 salt rounds to securely hash passwords.
- **JWT Tokens**: Issued on login, expire after 1 hour.
- **Token Verification**: Protected routes verify JWT before processing.

Testing with curl
-----------------

Signup:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
-H "Content-Type: application/json" \
-d '{"name":"Alice","email":"alice@example.com","password":"mypassword"}'
```

Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"alice@example.com","password":"mypassword"}'
```

Access protected route:
```bash
curl -X GET http://localhost:3000/api/users \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Token Management
----------------

- **Expiry**: Tokens expire after 1 hour for security.
- **Storage**: Store tokens securely (e.g., httpOnly cookies in production).
- **Refresh**: Implement refresh tokens for long-lived sessions if needed.

Files
-----
- `src/app/api/auth/signup/route.ts` — Signup endpoint
- `src/app/api/auth/login/route.ts` — Login endpoint
- `src/app/api/users/route.ts` — Protected users endpoint
- `src/app/api/admin/route.ts` — Admin-only endpoint
- `src/app/middleware.ts` — Authorization middleware

Authorization Middleware
========================

This project implements comprehensive authorization middleware for Role-Based Access Control (RBAC) in your Next.js application. The middleware intercepts requests, validates JWT tokens, and enforces role-based permissions.

Authentication vs Authorization
-------------------------------

| Concept | Description | Example |
|---------|-------------|---------|
| Authentication | Confirms who the user is | User logs in with valid credentials |
| Authorization | Determines what actions they can perform | Only admins can delete users |

User Roles
----------

The system supports role-based access control with the following roles:

- **USER**: Regular authenticated users
- **ADMIN**: Administrative users with full access

Middleware Architecture
-----------------------

```
Request → Middleware → Route Handler
    ↓         ↓            ↓
Validate → Authorize → Process
   JWT    →   Role    → Response
```

The middleware:

1. **Intercepts** all `/api/*` requests
2. **Validates** JWT tokens for protected routes
3. **Checks** user roles for admin-only routes
4. **Attaches** user info to request headers
5. **Allows/Rejects** requests based on permissions

Protected Routes
----------------

### Admin Routes (`/api/admin/*`)
- Requires valid JWT token
- Requires `ADMIN` role
- Full access to user management and system stats

### User Routes (`/api/users`)
- Requires valid JWT token
- Accessible to all authenticated users (`USER` or `ADMIN`)
- Limited to user-specific operations

### Public Routes
- `/api/auth/*` - Authentication endpoints (signup/login)
- No middleware protection required

Testing Authorization
---------------------

### Admin Access (Success)
```bash
curl -X GET http://localhost:3000/api/admin \
-H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```
**Response:**
```json
{
  "success": true,
  "message": "Welcome Admin! You have full access.",
  "data": {
    "userEmail": "admin@example.com",
    "userRole": "ADMIN",
    "stats": {
      "totalUsers": 5,
      "adminUsers": 1,
      "regularUsers": 4
    },
    "users": [...]
  }
}
```

### Regular User Access to Admin Route (Denied)
```bash
curl -X GET http://localhost:3000/api/admin \
-H "Authorization: Bearer <USER_JWT_TOKEN>"
```
**Response:**
```json
{
  "success": false,
  "message": "Access denied"
}
```

### Authenticated User Access to User Route (Success)
```bash
curl -X GET http://localhost:3000/api/users \
-H "Authorization: Bearer <USER_JWT_TOKEN>"
```
**Response:**
```json
{
  "success": true,
  "message": "User route accessible to authenticated users. Welcome user@example.com!",
  "data": [...],
  "userInfo": {
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Unauthenticated Access (Denied)
```bash
curl -X GET http://localhost:3000/api/users
```
**Response:**
```json
{
  "success": false,
  "message": "Token missing"
}
```

Role-Based Security Features
----------------------------

### JWT Token Structure
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "ADMIN",
  "iat": 1734500000,
  "exp": 1734503600
}
```

### Middleware Logic
- **Token Validation**: Verifies JWT signature and expiration
- **Role Checking**: Compares user role against required permissions
- **Header Injection**: Adds user context to downstream handlers
- **Error Responses**: Clear messages for different failure scenarios

### Least Privilege Principle
- Users only access necessary resources
- Admin routes strictly limited to admin users
- Public routes remain unprotected for accessibility

Extending Roles
---------------

To add new roles (e.g., `EDITOR`, `MODERATOR`):

1. **Update Database**: Add role to User model enum
2. **Modify Middleware**: Add role checks in middleware logic
3. **Create Routes**: Add role-specific protected routes
4. **Update Documentation**: Document new role permissions

Example:
```typescript
// In middleware.ts
if (pathname.startsWith("/api/editor") && !["ADMIN", "EDITOR"].includes(decoded.role)) {
  return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
}
```

Security Best Practices
-----------------------

- **Token Expiration**: 1-hour expiry prevents long-lived sessions
- **Role Validation**: Server-side checks prevent client-side bypass
- **Error Handling**: Generic error messages prevent information leakage
- **Header Security**: User info attached securely to request headers

Files
-----
- `src/app/middleware.ts` — Main authorization middleware
- `src/app/api/admin/route.ts` — Admin-only protected route
- `src/app/api/users/route.ts` — User-level protected route
