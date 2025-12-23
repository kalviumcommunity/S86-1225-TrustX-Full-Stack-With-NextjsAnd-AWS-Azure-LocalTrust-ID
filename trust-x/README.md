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

Component Architecture
======================

This project includes a reusable component architecture to provide consistent layout, navigation, and UI primitives across pages.

Files
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx) — top navigation header (`Header`)
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) — contextual sidebar navigation (`Sidebar`)
- [src/components/layout/LayoutWrapper.tsx](src/components/layout/LayoutWrapper.tsx) — page layout wrapper combining header + sidebar (`LayoutWrapper`)
- [src/components/ui/Button.tsx](src/components/ui/Button.tsx) — reusable button primitive (`Button`)
- [src/components/index.ts](src/components/index.ts) — barrel exports for easy imports

Usage
- Wrap your pages with the shared layout by importing `LayoutWrapper` from the components barrel:

```tsx
import { LayoutWrapper } from '@/components';

export default function Page() {
  return (
    <LayoutWrapper>
      <div>Page content</div>
    </LayoutWrapper>
  );
}
```

Props & Accessibility
- `Button` accepts standard button attributes and a `variant` prop (`primary` | `secondary`). It includes focus ring styles for keyboard navigation.
- Shared layout components centralize ARIA/keyboard handling and color choices for consistent accessibility across pages.

Reflection
- Reusability: Updating a shared component updates all pages that consume it.
- Maintainability: Clear folder structure (`components/layout`, `components/ui`) makes onboarding and extending easier.
- Scalability: Barrel exports enable consistent imports and simplify refactors.

Context & Hooks (State Management)
---------------------------------

This project now includes global state management using React Context and custom hooks.

Files
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx) — `AuthProvider` and `useAuthContext` (handles `user`, `login`, `logout`, persisted to `localStorage`).
- [src/context/UIContext.tsx](src/context/UIContext.tsx) — `UIProvider` and `useUIContext` (handles `theme`, `toggleTheme`, `sidebarOpen`, `toggleSidebar`, persisted theme).
- [src/hooks/useAuth.ts](src/hooks/useAuth.ts) — `useAuth()` wrapper returning `{ isAuthenticated, user, login, logout }`.
- [src/hooks/useUI.ts](src/hooks/useUI.ts) — `useUI()` wrapper returning `{ theme, toggleTheme, sidebarOpen, toggleSidebar }`.

Usage
- Providers are mounted in [src/app/layout.tsx](src/app/layout.tsx): `AuthProvider` → `UIProvider` → app layout.
- Example demo page: [src/app/page.tsx](src/app/page.tsx) demonstrates login/logout, theme toggling, and sidebar state.

Design notes
- Keep context logic minimal and expose simple hooks for components.
- Persisted values use `localStorage` with try/catch for SSR safety.

Reflection
- Benefits: reduces prop drilling, centralizes auth and UI concerns, and simplifies cross-cutting features (theme, auth gates).
- Performance: avoid heavy state objects directly in context; use reducers or split contexts for complex apps.



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

Centralized Error Handling Middleware
=====================================

This project implements a centralized error handling middleware that catches, categorizes, and logs all application errors while providing safe, clean responses to users.

Why Centralized Error Handling Matters
---------------------------------------

Modern web applications can fail in many ways — from API timeouts to database issues. Without a centralized strategy, errors become scattered, logs inconsistent, and debugging difficult.

A centralized error handler ensures:

- **Consistency**: Every error follows a uniform response format
- **Security**: Sensitive stack traces are hidden in production
- **Observability**: Structured logs make debugging and monitoring easier

Environment Behavior
--------------------

| Environment | Behavior |
|-------------|----------|
| Development | Show detailed error messages and stack traces |
| Production  | Log detailed errors internally, send minimal, user-safe messages |

Project Structure
-----------------

```
app/
 ├── api/
 │    ├── admin/
 │    │   ├── users/
 │    │   │    ├── route.ts
 ├── lib/
 │    ├── logger.ts
 │    ├── errorHandler.ts
```

Logger Utility
--------------

The logger provides structured logging for consistent error tracking.

**File**: `src/lib/logger.ts`

```typescript
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: "info", message, meta, timestamp: new Date() }));
  },
  error: (message: string, meta?: any) => {
    console.error(JSON.stringify({ level: "error", message, meta, timestamp: new Date() }));
  },
};
```

Centralized Error Handler
-------------------------

The error handler classifies and formats errors based on type and environment.

**File**: `src/lib/errorHandler.ts`

```typescript
import { NextResponse } from "next/server";
import { logger } from "./logger";

export function handleError(error: any, context: string) {
  const isProd = process.env.NODE_ENV === "production";

  const errorResponse = {
    success: false,
    message: isProd
      ? "Something went wrong. Please try again later."
      : error.message || "Unknown error",
    ...(isProd ? {} : { stack: error.stack }),
  };

  logger.error(`Error in ${context}`, {
    message: error.message,
    stack: isProd ? "REDACTED" : error.stack,
  });

  return NextResponse.json(errorResponse, { status: 500 });
}
```

Route Implementation
--------------------

Routes use the centralized error handler in their catch blocks.

**Example**: `src/app/api/admin/users/route.ts`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errorHandler";

export async function PATCH(req: Request) {
  try {
    // ... business logic
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser
    });
  } catch (error) {
    return handleError(error, "PATCH /api/admin/users");
  }
}
```

Testing in Development vs Production
-------------------------------------

**Development Mode Response:**

```json
{
  "success": false,
  "message": "Database connection failed!",
  "stack": "Error: Database connection failed! at ..."
}
```

**Production Mode Response:**

```json
{
  "success": false,
  "message": "Something went wrong. Please try again later."
}
```

**Log Output (Console or CloudWatch):**

```json
{
  "level": "error",
  "message": "Error in PATCH /api/admin/users",
  "meta": {
    "message": "Database connection failed!",
    "stack": "REDACTED"
  },
  "timestamp": "2025-12-19T16:45:00Z"
}
```

Benefits and Reflection
-----------------------

- **Structured Logs Aid Debugging**: JSON-formatted logs with timestamps and context make it easy to trace issues across distributed systems
- **User Trust Through Security**: Redacting sensitive stack traces prevents information leakage while maintaining professional error messages
- **Extensibility**: The handler can be extended for custom error types (e.g., ValidationError, AuthError) by adding type checks and specific formatting

Files
-----
- `src/lib/logger.ts` — Structured logging utility
- `src/lib/errorHandler.ts` — Centralized error handling function
- `src/app/api/admin/users/route.ts` — Example route using centralized error handling

Redis Caching Layer
===================

This project implements a Redis caching layer to improve API performance and reduce database load. Caching stores frequently accessed data in memory, serving it instantly without repeated database queries.

Why Caching Matters
-------------------

Every database query consumes resources and time. Without caching:

- **High Latency**: Each request hits the database (~100-200ms)
- **Database Load**: Increased load under traffic
- **Poor Scalability**: Performance degrades with concurrent users

With Redis caching:

- **Low Latency**: Cache hits serve data in ~5-10ms
- **Reduced Load**: Database queries minimized by 70-90%
- **Better Scalability**: Handles more concurrent users smoothly

Cache Strategy: Cache-Aside Pattern
-----------------------------------

The application uses the **cache-aside (lazy loading)** pattern:

```
Client Request → Check Redis Cache
                    ↓
                Cache Hit? → Return cached data
                    ↓
                Cache Miss → Query Database
                    ↓
                Store in Cache → Return data
```

**Benefits:**
- Simple implementation
- Cache only contains requested data
- Automatic cache population
- Easy cache invalidation

Redis Setup
-----------

### Installation
```bash
npm install ioredis
```

### Connection Configuration
**File**: `src/lib/redis.ts`

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
```

### Environment Variables
```env
REDIS_URL=redis://localhost:6379
# Or for Redis Cloud: redis://username:password@host:port
```

Cache Service Utility
---------------------

**File**: `src/lib/cache.ts`

A comprehensive cache service providing helper methods:

```typescript
export class CacheService {
  async get<T>(key: string): Promise<T | null>
  async set(key: string, data: any, ttlSeconds: number = 60): Promise<void>
  async del(key: string): Promise<void>
  async delPattern(pattern: string): Promise<number>
  async exists(key: string): Promise<boolean>
  async ttl(key: string): Promise<number>
}
```

API Implementation Examples
---------------------------

### Users List with Caching
**File**: `src/app/api/users/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';

  // Create unique cache key for pagination/search
  const cacheKey = `users:list:page=${page}:limit=${limit}:search=${search}`;

  // Check cache first
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    console.log("Cache Hit - Users list");
    return NextResponse.json(cachedData);
  }

  console.log("Cache Miss - Fetching users from DB");

  // Fetch from database
  const [users, total] = await Promise.all([
    prisma.user.findMany({ /* query */ }),
    prisma.user.count({ /* count */ })
  ]);

  const responseData = {
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };

  // Cache for 60 seconds
  await cacheService.set(cacheKey, responseData, 60);

  return NextResponse.json(responseData);
}
```

### Cache Invalidation on Data Changes
**File**: `src/app/api/users/route.ts` (POST method)

```typescript
export async function POST(req: NextRequest) {
  // Create new user
  const user = await prisma.user.create({ /* data */ });

  // Invalidate all user list caches
  const invalidatedCount = await cacheService.delPattern("users:list:*");
  console.log(`Invalidated ${invalidatedCount} user list cache entries`);

  return NextResponse.json({
    success: true,
    message: 'User created successfully',
    data: user
  });
}
```

TTL and Cache Policies
----------------------

### Time-To-Live (TTL) Settings

| Data Type | TTL | Reason |
|-----------|-----|--------|
| User Lists | 60 seconds | User data changes frequently |
| Product Lists | 300 seconds | Product data more stable |
| Static Config | 3600 seconds | Rarely changes |

### Cache Key Patterns

```
users:list:page=1:limit=10:search=
users:list:page=2:limit=10:search=john
products:list:category=electronics:page=1
user:profile:123
```

Cache Invalidation Strategy
---------------------------

### Automatic Invalidation
- **TTL Expiration**: Cache entries automatically expire
- **Pattern Deletion**: Use wildcards to clear related caches

### Manual Invalidation Triggers

| Action | Cache Keys Invalidated | Reason |
|--------|----------------------|---------|
| Create User | `users:list:*` | New user affects all list views |
| Update User | `users:list:*`, `user:profile:*` | User data changed |
| Delete User | `users:list:*`, `user:profile:*` | User removed |
| Create Product | `products:list:*` | New product in lists |

### Cache Coherence
- **Write-Through**: Update database, then invalidate cache
- **Lazy Loading**: Only cache requested data
- **Pattern Invalidation**: Clear all related cache entries

Performance Testing
-------------------

### Cache Performance Comparison

**Cold Start (Cache Miss):**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10"
# Response time: ~120ms
# Console: "Cache Miss - Fetching users from DB"
```

**Cache Hit:**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10"
# Response time: ~8ms
# Console: "Cache Hit - Users list"
```

**Latency Improvement:** ~15x faster response times

### Cache Hit Rate Monitoring

```typescript
// Monitor cache performance
const cacheHit = await cacheService.exists(cacheKey);
console.log(`Cache ${cacheHit ? 'HIT' : 'MISS'}: ${cacheKey}`);
```

Cache Best Practices
--------------------

### When to Cache
✅ **Frequently accessed data**
✅ **Expensive computations**
✅ **Static or slowly changing data**
✅ **API responses with pagination**

### When NOT to Cache
❌ **Highly dynamic data** (real-time updates needed)
❌ **Sensitive data** (PII, financial data)
❌ **Large datasets** (memory constraints)
❌ **User-specific data** (personalization required)

### Cache Considerations

| Aspect | Recommendation | Reason |
|--------|----------------|---------|
| **Key Naming** | Descriptive, hierarchical | Easy debugging and invalidation |
| **TTL Values** | Based on data volatility | Balance freshness vs performance |
| **Memory Usage** | Monitor Redis memory | Prevent memory exhaustion |
| **Error Handling** | Graceful cache failures | App works without cache |
| **Monitoring** | Track hit rates and latency | Optimize cache strategy |

Redis Commands Reference
------------------------

```bash
# Check Redis connection
redis-cli ping

# View all keys
redis-cli keys "*"

# Check TTL for a key
redis-cli ttl "users:list:page=1:limit=10:search="

# View key value
redis-cli get "users:list:page=1:limit=10:search="

# Delete keys by pattern (requires redis-cli with --scan)
redis-cli --scan --pattern "users:list:*" | xargs redis-cli del
```

Troubleshooting
---------------

### Common Issues

**Redis Connection Failed:**
- Check Redis server is running: `redis-cli ping`
- Verify connection string in environment variables
- Check firewall/network settings

**Cache Not Working:**
- Verify cache keys are being set correctly
- Check TTL values are appropriate
- Monitor Redis memory usage

**Stale Data Issues:**
- Review cache invalidation logic
- Check if all data modification paths clear cache
- Consider shorter TTL for volatile data

**Memory Issues:**
- Monitor Redis memory usage: `redis-cli info memory`
- Implement cache size limits
- Use Redis eviction policies

Files
-----
- `src/lib/redis.ts` — Redis connection configuration
- `src/lib/cache.ts` — Cache service utility class
- `src/app/api/users/route.ts` — Users API with caching
- `src/app/api/admin/users/route.ts` — Admin user updates with cache invalidation

Reflection: Cache as Short-Term Memory
---------------------------------------

"Cache is like a short-term memory — it makes things fast, but only if you remember to forget at the right time."

**Key Insights:**
- **Performance Gains**: 10-20x latency reduction for cached requests
- **Stale Data Risk**: Cache invalidation is critical for data consistency
- **Memory Management**: TTL and size limits prevent memory exhaustion
- **Monitoring Importance**: Track cache hit rates to optimize strategy
- **Fallback Resilience**: Application works without cache (graceful degradation)

**When Caching May Be Counterproductive:**
- Real-time data requirements
- Highly personalized responses
- Low-traffic applications (minimal benefit)
- Complex invalidation logic costs more than gains

File Upload API with AWS S3
===========================

This project implements secure file uploads using pre-signed URLs with AWS S3, providing scalable and secure file storage without exposing credentials.

Why Pre-Signed URLs?
--------------------

Direct uploads through backend can overload servers and expose credentials. Pre-signed URLs offer three major benefits:

**Advantage** | **Description**
-------------|---------------
Security | Credentials stay hidden; uploads go directly to cloud
Scalability | Backend handles only URL generation, not large file streams
Performance | Upload latency decreases since files bypass the app server

Implementation Overview
-----------------------

### Architecture Flow
```
1. Client requests upload URL → Backend generates pre-signed URL
2. Client uploads file directly → AWS S3 using pre-signed URL
3. Client notifies backend → File metadata stored in database
4. File becomes accessible → Via public URL or signed access
```

### AWS S3 Configuration

**Environment Variables** (add to `.env`):
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-bucket-name
```

**Dependencies**:
- `@aws-sdk/client-s3` — AWS S3 client
- `@aws-sdk/s3-request-presigner` — Pre-signed URL generation

### Database Schema

**File Model**:
```prisma
model File {
  id        Int       @id @default(autoincrement())
  name      String
  url       String
  size      Int?
  type      String
  userId    Int?
  user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
  @@index([createdAt])
}
```

API Endpoints
-------------

### POST /api/upload
Generates a pre-signed URL for file upload.

**Request Body**:
```json
{
  "filename": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

**Response**:
```json
{
  "success": true,
  "uploadURL": "https://presigned-s3-url...",
  "fileKey": "1234567890-abc123-document.pdf"
}
```

**Validation Rules**:
- File types: JPEG, PNG, GIF, WebP, PDF
- Max size: 10MB
- URL expiry: 5 minutes

### POST /api/files
Stores uploaded file metadata in database.

**Request Body**:
```json
{
  "fileName": "document.pdf",
  "fileKey": "1234567890-abc123-document.pdf",
  "fileSize": 1024000,
  "fileType": "application/pdf"
}
```

**Response**:
```json
{
  "success": true,
  "file": {
    "id": 1,
    "name": "document.pdf",
    "url": "https://bucket.s3.region.amazonaws.com/1234567890-abc123-document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "userId": 1,
    "createdAt": "2025-12-22T08:00:00Z"
  }
}
```

### GET /api/files
Retrieves user's uploaded files.

**Response**:
```json
{
  "success": true,
  "files": [
    {
      "id": 1,
      "name": "document.pdf",
      "url": "https://bucket.s3.region.amazonaws.com/...",
      "size": 1024000,
      "type": "application/pdf",
      "createdAt": "2025-12-22T08:00:00Z"
    }
  ]
}
```

Frontend Implementation
-----------------------

### Upload Flow Example

```javascript
async function uploadFile(file) {
  // Step 1: Get pre-signed URL
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      fileType: file.type,
      fileSize: file.size
    }),
  });

  const { uploadURL, fileKey } = await res.json();

  // Step 2: Upload file directly to S3
  await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  // Step 3: Store metadata
  await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileKey: fileKey,
      fileSize: file.size,
      fileType: file.type,
    }),
  });

  console.log("File uploaded successfully!");
}
```

Testing the Upload Flow
------------------------

1. **Generate Pre-signed URL**:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -H "Content-Type: application/json" \
     -d '{"filename":"test.pdf","fileType":"application/pdf","fileSize":1024}'
   ```

2. **Upload File Using URL**:
   ```bash
   curl -X PUT -T test.pdf "PRESIGNED_URL_FROM_STEP_1"
   ```

3. **Store File Metadata**:
   ```bash
   curl -X POST http://localhost:3000/api/files \
     -H "Content-Type: application/json" \
     -d '{"fileName":"test.pdf","fileKey":"KEY_FROM_RESPONSE","fileSize":1024,"fileType":"application/pdf"}'
   ```

4. **Verify Upload**: Open the file URL in browser to confirm upload success.

Security Considerations
-----------------------

### File Validation
- **Type Checking**: Only allow specific MIME types (images, PDFs)
- **Size Limits**: Maximum 10MB per file
- **Name Sanitization**: Generate unique filenames to prevent conflicts

### URL Security
- **Short Expiry**: URLs expire in 5 minutes
- **Single Use**: Each URL can only be used once
- **Scoped Permissions**: PUT-only access to specific object

### Access Control
- **Public vs Private**: Current implementation uses public bucket
- **User Association**: Files linked to uploading user
- **Audit Trail**: All uploads logged with timestamps

### AWS S3 Best Practices
- **Bucket Policies**: Restrict access to specific origins
- **CORS Configuration**: Allow uploads from your domain only
- **Lifecycle Policies**: Auto-delete old/unused files

Files and Code Structure
------------------------

**Backend Files**:
- `src/app/api/upload/route.ts` — Pre-signed URL generation
- `src/app/api/files/route.ts` — File metadata management
- `prisma/schema.prisma` — File model definition

**Frontend Files**:
- `src/app/upload/page.tsx` — Upload interface and demo

**Configuration Files**:
- `.env` — AWS credentials and bucket settings

Reflection: Security Through Obscurity vs. Proper Security
----------------------------------------------------------

"A great upload system isn't just fast — it's safe, scalable, and short-lived where needed. Pre-signed URLs give you the power of the cloud without giving away your keys."

**Key Security Insights**:
- **Credential Isolation**: Never expose AWS keys to client
- **Time-Bound Access**: Short-lived URLs reduce attack window
- **Direct Cloud Upload**: Bypasses server bandwidth limits
- **Validation Layers**: Multiple checks prevent malicious uploads

**Trade-offs Considered**:
- **Public vs Private Files**: Public access simplifies implementation but reduces control
- **Cost vs Security**: Private files require signed URLs for access (additional complexity)
- **Scalability vs Control**: Direct S3 uploads scale infinitely but complicate access management

**Lifecycle Management Benefits**:
- **Cost Optimization**: Auto-delete unused files prevents storage bloat
- **Compliance**: Meet data retention requirements automatically
- **Performance**: Clean up reduces bucket listing times

**Future Enhancements**:
- Implement private file access with signed URLs
- Add file versioning and rollback capabilities
- Integrate with AWS CloudFront for global CDN distribution
- Add image processing and optimization pipeline

Routing
-------

This project uses the Next.js App Router (file-based routing) under the `src/app` folder. Key routes implemented for the lesson:

- Public routes:
  - `/` → Home (`src/app/page.tsx`)
  - `/login` → Login page (`src/app/login/page.tsx`)

- Protected routes (middleware checks a JWT stored in cookie `token`):
  - `/dashboard` → Protected dashboard (`src/app/dashboard/page.tsx`)
  - `/users` → Users list (`src/app/users/page.tsx`)
  - `/users/[id]` → Dynamic user profile (`src/app/users/[id]/page.tsx`)

Middleware for protection is implemented in `src/app/middleware.ts`. It protects API admin endpoints by verifying an Authorization header, and protects client pages under `/dashboard` and `/users` by checking the `token` cookie and redirecting unauthenticated users to `/login`.

Example middleware behavior:

```ts
// src/app/middleware.ts
if (pathname.startsWith('/dashboard') || pathname.startsWith('/users')) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));
  jwt.verify(token, process.env.JWT_SECRET);
}
```

Navigation is added in `src/app/layout.tsx` with links to Home, Login, Dashboard and Users. A custom 404 page is available at `src/app/not-found.tsx`.

Dynamic route example:

```tsx
// src/app/users/[id]/page.tsx
export default function UserProfile({ params }) {
  const { id } = params;
  return <div>User ID: {id}</div>;
}
```

Testing & Tryout
-----------------

1. Start the dev server:

```bash
npm run dev
```

2. Visit public pages:

```text
http://localhost:3000/
http://localhost:3000/login
```

3. To open protected pages, set a cookie `token` (mock JWT or real token from auth) and visit:

```text
http://localhost:3000/dashboard
http://localhost:3000/users
http://localhost:3000/users/1
```

Reflection
----------

Good routing design makes navigation intuitive and improves SEO. Dynamic routes (like `/users/[id]`) enable parameterized content and breadcrumb navigation improves discoverability and user context. The middleware approach separates auth concerns from pages and APIs and provides a single place to update access rules.

Pro Tip: Include server-side rendering or server components for SEO-critical pages and add structured data (schema.org) for better search engine results.
