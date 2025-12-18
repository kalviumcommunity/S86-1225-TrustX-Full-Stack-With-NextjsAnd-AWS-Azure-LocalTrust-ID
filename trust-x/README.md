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
