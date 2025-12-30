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

Global API Response Handler
===========================

This project uses a centralized response handler to ensure all API routes return a consistent envelope.

Role-Based Security Features
----------------------------
Feedback UI — Toasts, Modals, Loaders
-------------------------------------

This project includes accessible feedback layers (toasts, modals, loaders) to improve user communication and trust.

Toasts: Implemented using `react-hot-toast`. Global provider is mounted in the app layout so any page can trigger toasts via `toast.success`, `toast.error`, `toast.loading`.
Modals: Accessible modal primitive is available at `src/components/ui/Modal.tsx`. It traps focus, closes on `Esc`, and provides a transparent overlay.
Loaders: Spinner component at `src/components/ui/Loader.tsx` with `role="status"` and `aria-live="polite"` for screen readers.

Where used

Demoed in the signup flow: `src/app/signup/page.tsx` — clicking "Sign Up" opens a confirmation modal, confirming runs the async signup with a loader and toast feedback for success/failure.

Accessibility & UX Notes

Toasts use concise language and auto-dismiss after 4s. Screen readers receive polite announcements.
Modals use `aria-modal="true"` and `aria-labelledby` with keyboard handling.
Loaders provide non-blocking visual feedback and are used alongside toasts so users understand progress and results.

How to try

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Open `/signup` and follow the flow: Sign Up → Confirm modal → Loading spinner → Success toast (or error toast on failure).

Reflection

Adding these primitives made the flows clearer and more trustworthy: instant confirmations (toasts), clear blocking decisions (modals), and progress awareness (loaders) reduce user uncertainty and error.

Responsive & Themed Design
==========================

This project implements responsive design with custom breakpoints and a fully functional light/dark theme system using TailwindCSS v4.

Theme Configuration (Tailwind v4)
---------------------------------

Tailwind v4 uses CSS-based configuration via `@theme` in `globals.css`:

**File**: [src/app/globals.css](src/app/globals.css)

Custom theme tokens:
- **Brand Colors**: `--color-brand-light` (#93C5FD), `--color-brand` (#3B82F6), `--color-brand-dark` (#1E40AF)
- **Theme-aware Variables**: `--color-background`, `--color-foreground` adapt based on `.dark` class
- **Custom Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)

Dark Mode Implementation
------------------------

Dark mode is controlled via a `.dark` class on the `<html>` element:

```css
.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

**Theme Toggle Component**: [src/components/ui/ThemeToggle.tsx](src/components/ui/ThemeToggle.tsx)
- Moon/sun icons indicate current theme
- Integrates with `UIContext` for global state management
- Persists theme preference to `localStorage`
- Accessible: includes `aria-label` and keyboard support

Usage in Components
-------------------

All major components support dark mode using Tailwind's `dark:` variant:

**Header**: [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
- Responsive padding: `px-4 md:px-6`
- Responsive text: `text-base md:text-lg lg:text-xl`
- Dark mode: `dark:bg-gray-800`
- Theme toggle button in navigation

**Sidebar**: [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)
- Responsive width: `w-48 lg:w-64`
- Hidden on mobile: `hidden md:block`
- Dark mode: `dark:bg-gray-800 dark:border-gray-700`

**Forms**: [src/components/FormInput.tsx](src/components/FormInput.tsx)
- Dark backgrounds: `dark:bg-gray-700`
- Dark borders: `dark:border-gray-600`
- Focus ring: `focus:ring-brand dark:focus:ring-brand-light`

**Modal**: [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx)
- Responsive padding: `p-4 md:p-6`
- Dark mode: `dark:bg-gray-800`

Responsive Breakpoints
----------------------

The application adapts to different screen sizes:

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| **Mobile** | < 640px | Single column, collapsed sidebar, smaller text |
| **Tablet** | 640px - 1024px | Sidebar visible, medium text, adjusted padding |
| **Desktop** | > 1024px | Full layout, larger text, spacious padding |

Testing Responsive Design
-------------------------

1. Open Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test presets: iPhone SE, iPad, Desktop HD
4. Verify:
   - Text scales appropriately
   - Sidebar hides on mobile
   - Forms remain readable
   - Theme toggle accessible

Accessibility Considerations
----------------------------

**Color Contrast**: All color combinations meet WCAG AA standards:
- Light mode: dark text on light backgrounds
- Dark mode: light text on dark backgrounds
- Brand colors tested for sufficient contrast

**Keyboard Navigation**: Theme toggle is fully keyboard accessible with proper focus indicators

**Screen Readers**: Theme toggle includes descriptive `aria-label` announcing the action

**Persistent Preferences**: User's theme choice saved to `localStorage` and restored on page load

Files Modified for Theming
---------------------------

- [src/app/globals.css](src/app/globals.css#L1-L35) — Theme tokens and dark mode CSS variables
- [src/components/ui/ThemeToggle.tsx](src/components/ui/ThemeToggle.tsx) — Theme toggle button with icons
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx) — Responsive header with theme toggle
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) — Responsive sidebar with dark mode
- [src/components/layout/LayoutWrapper.tsx](src/components/layout/LayoutWrapper.tsx) — Theme-aware layout container
- [src/components/FormInput.tsx](src/components/FormInput.tsx) — Dark mode form inputs
- [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx) — Responsive and themed modal
- [src/components/ui/Loader.tsx](src/components/ui/Loader.tsx) — Theme-aware loader spinner
- [src/app/signup/page.tsx](src/app/signup/page.tsx) — Responsive signup form with dark mode

How to Test
-----------

1. Start dev server:
```bash
npm run dev
```

2. Visit any page (e.g., http://localhost:3000/signup)

3. Click the theme toggle in the header (moon/sun icon)

4. Verify dark mode applies across all components

5. Test responsive behavior:
   - Resize browser window
   - Use DevTools device emulation
   - Check sidebar visibility at different breakpoints

Reflection
----------

**Challenges**: Migrating to Tailwind v4's CSS-based configuration required understanding `@theme` syntax instead of traditional `tailwind.config.js`.

**Solutions**: Used CSS custom properties for theme variables and `.dark` class for mode switching, which integrates cleanly with React state management.

**Results**: The app now provides a consistent, accessible experience across all devices and lighting conditions. Users can customize their experience, and the design system remains maintainable with centralized theme tokens.

Error & Loading States
======================

This project implements comprehensive error boundaries and loading skeletons to ensure users never see blank screens or confusing crashes. Every route gracefully handles loading delays and errors with friendly, actionable feedback.

Why Error & Loading States Matter
---------------------------------

Modern web apps involve asynchronous operations that can fail or take time. Without proper handling:
- Users see blank screens and wonder if the app is broken
- Errors crash the entire app with no recovery option
- Trust erodes when users don't understand what's happening

Our implementation ensures:
- **Clear Communication**: Loading skeletons show what's coming
- **Graceful Degradation**: Errors display helpful messages and retry options
- **User Confidence**: Consistent feedback builds trust

Loading Skeletons
-----------------

Loading skeletons provide visual placeholders that match the structure of incoming content, helping users anticipate what's loading.

### Implementation

**Root Loading** - [src/app/loading.tsx](src/app/loading.tsx)
- Full-screen animated loader with gradient logo
- Bouncing dots animation
- Progress bar with shimmer effect
- Used for initial app load and navigation

**Users Page Loading** - [src/app/users/loading.tsx](src/app/users/loading.tsx)
- Grid of user card skeletons (6 cards)
- Gradient animated backgrounds
- Staggered animation delays for visual flow
- Loading message with spinner

**Dashboard Loading** - [src/app/dashboard/loading.tsx](src/app/dashboard/loading.tsx)
- Stats card skeletons (4 cards)
- Animated chart skeleton with vertical bars
- Gradient pulse effects
- Loading indicator at bottom

### Design Features

All loading skeletons include:
- **Gradient backgrounds**: Using accent colors (purple, pink, cyan)
- **Pulse animations**: Smooth breathing effect
- **Shimmer effects**: Light sweep across elements
- **Staggered delays**: Creates flowing entrance animation
- **Dark mode support**: Adapts colors for theme

Error Boundaries
---------------

Error boundaries catch JavaScript errors in components and display fallback UI instead of crashing the app.

### Implementation

**Global Error** - [src/app/error.tsx](src/app/error.tsx)
- Catches root-level application errors
- Purple/pink/red gradient theme
- Critical error icon with pulse animation
- "Restart Application" and "Return Home" buttons
- Error digest ID for debugging

**Users Error** - [src/app/users/error.tsx](src/app/users/error.tsx)
- Red/orange/pink gradient theme
- Warning icon with glow effect
- "Try Again" button calls `reset()` to re-render
- "Go Home" fallback option
- Displays error message and digest

**Dashboard Error** - [src/app/dashboard/error.tsx](src/app/dashboard/error.tsx)
- Orange/red gradient theme
- Lightning bolt icon
- "Retry Dashboard" button
- "Back to Home" option
- Console logging for monitoring

### Error Boundary Features

All error boundaries include:
- **Animated backgrounds**: Gradient pulse effects
- **Clear messaging**: User-friendly error descriptions
- **Retry functionality**: `reset()` re-renders the route
- **Navigation options**: Always provide escape route
- **Error tracking**: Console logging (can integrate with Sentry/LogRocket)
- **Error IDs**: Digest for correlation with logs
- **Accessibility**: Semantic HTML and ARIA where appropriate

Testing Error & Loading States
------------------------------

### Test Page

Visit [/test-states](src/app/test-states/page.tsx) for an interactive testing dashboard with:
- Links to test loading skeletons
- Instructions for simulating errors
- Network throttling guide
- Code snippets for adding delays

### Manual Testing Steps

**1. Test Loading Skeletons**
```bash
# Start dev server
npm run dev

# Open Chrome DevTools (F12)
# Network tab → Throttling → Slow 3G
# Navigate to /users or /dashboard
# Observe skeleton animations
```

**2. Simulate Errors**
```typescript
// Add to any page.tsx to trigger error boundary
throw new Error('Test error message');
```

**3. Test Retry Functionality**
- Trigger an error
- Click "Try Again" button
- Verify route re-renders
- Check console for error logs

**4. Add Artificial Delays**
```typescript
// Add delay to see loading state longer
await new Promise(resolve => setTimeout(resolve, 2000));
```

Files Created
-------------

**Loading States**:
- [src/app/loading.tsx](src/app/loading.tsx) — Root loading
- [src/app/users/loading.tsx](src/app/users/loading.tsx) — Users page skeleton
- [src/app/dashboard/loading.tsx](src/app/dashboard/loading.tsx) — Dashboard skeleton

**Error Boundaries**:
- [src/app/error.tsx](src/app/error.tsx) — Global error boundary
- [src/app/users/error.tsx](src/app/users/error.tsx) — Users page errors
- [src/app/dashboard/error.tsx](src/app/dashboard/error.tsx) — Dashboard errors

**Testing**:
- [src/app/test-states/page.tsx](src/app/test-states/page.tsx) — Interactive test dashboard

How Next.js App Router Handles This
-----------------------------------

| File | Purpose | When It's Used |
|------|---------|----------------|
| `loading.tsx` | Shows while page/data is loading | Automatically during route transitions or Suspense boundaries |
| `error.tsx` | Catches errors in page and child components | When any component throws an error |
| `not-found.tsx` | 404 pages | When route doesn't exist or `notFound()` is called |

**Automatic Behavior**:
- Next.js wraps your page in a Suspense boundary
- `loading.tsx` is shown during data fetching
- `error.tsx` catches both client and server errors
- Errors are isolated to route segments (don't crash whole app)

Accessibility Considerations
----------------------------

**Loading States**:
- Animations are smooth and not overly distracting
- Skeleton shapes match real content for predictability
- Screen readers can still navigate other parts of the app

**Error States**:
- Clear, human-readable error messages
- Actionable buttons with descriptive labels
- Keyboard accessible (all buttons focusable)
- Sufficient color contrast for error icons and text

Reflection
----------

**Challenges**: 
- Balancing animation complexity with performance
- Ensuring skeleton layouts match actual content structure
- Making error messages helpful without exposing sensitive info

**Solutions**: 
- Used CSS animations for performance (GPU-accelerated)
- Designed skeletons based on actual component layouts
- Generic error messages with digest IDs for internal tracking

**Results**: 
- Users never see blank screens or confusing errors
- Loading feels intentional and polished with gradient animations
- Error recovery is clear with prominent retry buttons
- App resilience increased — errors don't crash the entire application
- User confidence improved through consistent, friendly feedback

---

Secure JWT & Session Management
===============================

This project implements a secure dual-token authentication system with access and refresh tokens stored in HTTP-only cookies for protection against XSS and CSRF attacks.

Why This Matters
----------------

**Security Concerns Without Proper JWT Management**:
- **XSS Attacks**: LocalStorage tokens can be stolen by malicious scripts
- **CSRF Attacks**: Cookies without proper flags are vulnerable
- **Token Theft**: Long-lived tokens increase attack surface
- **Session Fixation**: Without token rotation, compromised tokens stay valid
- **No Logout**: If tokens can't be invalidated, users can't truly log out

**Our Solution**:
- ✅ **HTTP-only cookies**: Tokens inaccessible to JavaScript
- ✅ **SameSite: strict**: Protection against CSRF attacks
- ✅ **Secure flag**: Cookies only sent over HTTPS in production
- ✅ **Short-lived access tokens**: 15 minutes reduces exposure
- ✅ **Long-lived refresh tokens**: 7 days for better UX
- ✅ **Automatic token refresh**: Seamless user experience
- ✅ **Server-side validation**: All tokens verified on backend

Token Architecture
-----------------

### Access Token (Short-lived)
- **Expiry**: 15 minutes
- **Purpose**: Authorizes API requests
- **Storage**: HTTP-only cookie + in-memory on client
- **Refresh**: Automatically refreshed when expired

### Refresh Token (Long-lived)
- **Expiry**: 7 days
- **Purpose**: Issues new access tokens
- **Storage**: HTTP-only cookie only
- **Security**: Cannot be accessed by client-side JavaScript

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

Token Flow Diagram
-----------------

```
┌─────────────┐
│   CLIENT    │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────────────┐
│         SERVER              │
│ ┌─────────────────────────┐ │
│ │  Verify credentials     │ │
│ │  Generate tokens:       │ │
│ │  - Access (15min)       │ │
│ │  - Refresh (7days)      │ │
│ └─────────────────────────┘ │
└──────┬──────────────────────┘
       │ 2. Set HTTP-only cookies
       │    + Return access token in body
       ▼
┌─────────────┐
│   CLIENT    │ 3. Store access token in memory
│             │    setAccessToken(token)
└──────┬──────┘
       │ 4. API Request
       │    Authorization: Bearer {accessToken}
       │    Cookie: refreshToken (auto-sent)
       ▼
┌─────────────────────────────┐
│    MIDDLEWARE               │
│ ┌─────────────────────────┐ │
│ │ Verify access token     │ │
│ │ - Valid? → Continue     │ │
│ │ - Expired? → 401 error  │ │
│ └─────────────────────────┘ │
└──────┬──────────────────────┘
       │ 5. If 401, client auto-refreshes
       ▼
┌─────────────┐
│   CLIENT    │ POST /api/auth/refresh
└──────┬──────┘ (refreshToken sent in cookie)
       ▼
┌─────────────────────────────┐
│         SERVER              │
│ ┌─────────────────────────┐ │
│ │  Verify refresh token   │ │
│ │  Generate new access    │ │
│ │  token (15min)          │ │
│ └─────────────────────────┘ │
└──────┬──────────────────────┘
       │ 6. New access token
       ▼
┌─────────────┐
│   CLIENT    │ 7. Retry original request
│             │    with new access token
└─────────────┘
```

Implementation Files
-------------------

### Backend (Server-side)

**[src/lib/jwt.ts](src/lib/jwt.ts)** — JWT utility functions
```typescript
export function generateAccessToken(user: User): string
export function generateRefreshToken(user: User): string
export function verifyAccessToken(token: string): JWTPayload | null
export function verifyRefreshToken(token: string): JWTPayload | null
export function isTokenExpired(token: string): boolean
export function getTokenExpiry(token: string): Date | null
```

**[src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)** — Login endpoint
- Verifies email/password with bcrypt
- Generates access + refresh tokens
- Sets HTTP-only cookies with secure flags
- Returns user data and access token in body

**[src/app/api/auth/refresh/route.ts](src/app/api/auth/refresh/route.ts)** — Token refresh endpoint
- Extracts refresh token from HTTP-only cookie
- Verifies token validity and user existence
- Generates new access token (15min)
- Updates cookie with new token

**[src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts)** — Logout endpoint
- Clears both accessToken and refreshToken cookies
- Sets maxAge: 0 to expire immediately

**[src/app/middleware.ts](src/app/middleware.ts)** — Route protection
- Validates access tokens on protected routes
- Checks tokens from cookies or Authorization header
- Enforces RBAC for admin endpoints
- Returns clear error messages with refresh hints

### Frontend (Client-side)

**[src/lib/authClient.ts](src/lib/authClient.ts)** — Client auth utilities
```typescript
export function login(email: string, password: string)
export function logout()
export function fetchWithAuth(url: string, options?: RequestInit)
export const authFetch = { get, post, put, delete }
```

**Key Features**:
- Stores access token in memory (not localStorage)
- Automatically refreshes on 401 errors
- Prevents duplicate refresh requests
- Redirects to login if refresh fails
- Convenience methods for HTTP verbs

Security Measures
----------------

### XSS Protection
- ✅ **HTTP-only cookies**: Tokens cannot be accessed via `document.cookie`
- ✅ **In-memory storage**: Access token never persists to localStorage
- ✅ **No eval()**: No dynamic code execution
- ✅ **Content Security Policy**: Can be added to headers

### CSRF Protection
- ✅ **SameSite: strict**: Cookies only sent on same-origin requests
- ✅ **Secure flag**: Cookies only sent over HTTPS in production
- ✅ **Origin validation**: Middleware can check request origin

### Token Security
- ✅ **Short expiry**: Access tokens expire in 15 minutes
- ✅ **Separate secrets**: Access and refresh tokens use different secrets
- ✅ **Server-side validation**: All tokens verified with JWT signature
- ✅ **No sensitive data**: Tokens only contain user ID, email, role

### Best Practices
- ✅ **Never log tokens**: Exclude from logs and error messages
- ✅ **Rotate secrets regularly**: Update JWT_SECRET and REFRESH_TOKEN_SECRET periodically
- ✅ **Monitor token activity**: Track login attempts and refresh patterns
- ✅ **Implement rate limiting**: Prevent brute force attacks on auth endpoints
- ✅ **Use HTTPS in production**: Ensure secure flag works correctly

Usage Examples
-------------

### Client-side: Login Flow
```typescript
import { login, authFetch } from '@/lib/authClient';

// 1. Login
const result = await login('user@example.com', 'password123');
if (result.success) {
  console.log('Logged in:', result.user);
  // Access token stored in memory automatically
}

// 2. Make authenticated requests
// Automatically includes access token and refreshes if expired
const response = await authFetch.get('/api/users');
const users = await response.json();

// 3. POST with data
const response = await authFetch.post('/api/projects', {
  name: 'New Project',
  description: 'Project description'
});

// 4. Logout
await logout(); // Clears cookies and redirects to login
```

### Client-side: useEffect Hook
```typescript
'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authClient';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await authFetch.get('/api/users');
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Server-side: Protected API Route
```typescript
import { NextRequest } from 'next/server';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  // Get token from Authorization header or cookie
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                req.cookies.get('accessToken')?.value;

  if (!token) {
    return sendError('No token provided', 401, 'UNAUTHORIZED');
  }

  // Verify token
  const payload = verifyAccessToken(token);
  if (!payload) {
    return sendError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  // Access user info from token
  const userId = payload.id;
  const userRole = payload.role;

  // Your route logic here
  const data = await fetchUserData(userId);
  
  return sendSuccess(data, 'Data fetched successfully');
}
```

### Server-side: Admin-only Route
```typescript
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyAccessToken(token!);

  // Check admin role
  if (payload?.role !== 'ADMIN') {
    return sendError('Admin access required', 403, 'FORBIDDEN');
  }

  // Admin logic here
  await deleteUser(userId);
  return sendSuccess(null, 'User deleted successfully');
}
```

Testing JWT Flow
---------------

### 1. Start Development Server
```bash
cd trust-x
npm run dev
```

### 2. Test Login
```bash
# Use curl or Postman
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trustx.com","password":"admin123"}' \
  -c cookies.txt

# Expected response:
# {
#   "success": true,
#   "message": "Login successful",
#   "data": {
#     "user": { "id": 1, "email": "admin@trustx.com", "role": "ADMIN" },
#     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
#   }
# }
```

### 3. Test Protected Route
```bash
# With access token (works)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt

# Without token (fails with 401)
curl http://localhost:3000/api/users
```

### 4. Test Token Expiry (Wait 15 minutes or modify JWT_EXPIRY)
```bash
# After 15 minutes, access token expires
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer EXPIRED_ACCESS_TOKEN" \
  -b cookies.txt

# Expected: 401 error with message about using /api/auth/refresh
```

### 5. Test Token Refresh
```bash
# Refresh token (sent automatically in cookie)
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Expected response:
# {
#   "success": true,
#   "message": "Access token refreshed",
#   "data": {
#     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
#   }
# }
```

### 6. Test Client-side Automatic Refresh
```typescript
// In browser console
import { authFetch } from '@/lib/authClient';

// This will automatically refresh if token expired
const response = await authFetch.get('/api/users');
const data = await response.json();
console.log(data);
```

### 7. Test Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt

# Cookies cleared, subsequent requests fail
curl http://localhost:3000/api/users -b cookies.txt
# Expected: 401 Unauthorized
```

Environment Variables
--------------------

Add these to your `.env` file:

```bash
# JWT Secrets (use strong random strings in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-also-change-this

# Token expiry times (optional, defaults shown)
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Node environment
NODE_ENV=development  # Use 'production' for prod
```

**Important**: 
- Never commit real secrets to git
- Use different secrets for dev/staging/production
- Rotate secrets periodically
- Use strong random strings (64+ characters recommended)

Files Created
-------------

**Backend**:
- [src/lib/jwt.ts](src/lib/jwt.ts) — JWT utility functions (generate, verify, check expiry)
- [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts) — Login endpoint with dual tokens
- [src/app/api/auth/refresh/route.ts](src/app/api/auth/refresh/route.ts) — Token refresh endpoint
- [src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts) — Logout endpoint
- [src/app/middleware.ts](src/app/middleware.ts) — Route protection and validation

**Frontend**:
- [src/lib/authClient.ts](src/lib/authClient.ts) — Client-side auth utilities with auto-refresh

Common Issues & Solutions
------------------------

### Issue: "No token provided" on every request
**Solution**: Ensure cookies are being sent with `credentials: 'include'`

### Issue: Token refresh loop (infinite refreshing)
**Solution**: Check that refresh endpoint doesn't require access token

### Issue: CORS errors in production
**Solution**: Set proper CORS headers and ensure credentials allowed

### Issue: Secure flag preventing cookies in dev
**Solution**: Use `NODE_ENV=development` to disable secure flag

### Issue: Token expired immediately
**Solution**: Check server/client time synchronization

Reflection
----------

**Challenges**: 
- Balancing security with user experience
- Implementing automatic token refresh without refresh loops
- Preventing race conditions with concurrent refresh requests
- Deciding between localStorage vs cookies vs memory storage

**Solutions**: 
- Used dual-token approach (short access, long refresh)
- Implemented single in-flight refresh promise to prevent duplicates
- Stored refresh token only in HTTP-only cookies
- Kept access token in memory for client, cookies for middleware

**Results**: 
- ✅ Strong protection against XSS and CSRF attacks
- ✅ Seamless user experience with automatic token refresh
- ✅ Clear separation between client and server token handling
- ✅ Flexible middleware for route protection and RBAC
- ✅ Easy to test with curl and browser dev tools
- ✅ Production-ready security with proper cookie flags

---

Role-Based Access Control (RBAC)
=================================

This project implements a comprehensive Role-Based Access Control system to manage user permissions and ensure secure, auditable access to resources.

Why RBAC Matters
----------------

**Security Concerns Without RBAC**:
- **Privilege Escalation**: Users accessing resources beyond their authority
- **Data Breaches**: Unauthorized access to sensitive information
- **Compliance Issues**: Difficulty proving access control for audits
- **Maintenance Overhead**: Permission checks scattered throughout code
- **No Audit Trail**: Unable to track who accessed what

**Our RBAC Solution**:
- ✅ **Clear Role Hierarchy**: ADMIN > EDITOR > USER > VIEWER
- ✅ **Permission-Based Access**: Fine-grained control over actions
- ✅ **Resource-Level Permissions**: Different permissions per resource type
- ✅ **Server-Side Enforcement**: All checks on backend, not just UI
- ✅ **Comprehensive Logging**: Full audit trail of allow/deny decisions
- ✅ **Client & Server Utilities**: Easy to use hooks and middleware
- ✅ **Scalable Architecture**: Easy to extend with new roles/permissions

Role Hierarchy & Permissions
----------------------------

### Role Definitions

| Role | Level | Permissions | Use Case |
|------|-------|-------------|----------|
| **ADMIN** | 4 | Full access (create, read, update, delete, manage all) | System administrators, full control |
| **EDITOR** | 3 | create, read, update, manage projects/orders | Content managers, project leads |
| **USER** | 2 | read, update (own resources), upload files | Regular authenticated users |
| **VIEWER** | 1 | read-only access | Read-only observers, auditors |

### Permission Types

**Action-Based Permissions**:
- `create` - Create new resources
- `read` - View/fetch resources
- `update` - Modify existing resources
- `delete` - Remove resources

**Resource-Based Permissions**:
- `manage_users` - User management operations
- `manage_projects` - Project management operations
- `manage_orders` - Order management operations
- `view_analytics` - Access analytics dashboards
- `manage_settings` - Modify system settings
- `upload_files` - File upload capabilities

### Permission Matrix

```
Permission          | ADMIN | EDITOR | USER | VIEWER
--------------------|-------|--------|------|--------
create              |   ✓   |   ✓    |  ✗   |   ✗
read                |   ✓   |   ✓    |  ✓   |   ✓
update              |   ✓   |   ✓    |  ✓   |   ✗
delete              |   ✓   |   ✗    |  ✗   |   ✗
manage_users        |   ✓   |   ✗    |  ✗   |   ✗
manage_projects     |   ✓   |   ✓    |  ✗   |   ✗
manage_orders       |   ✓   |   ✓    |  ✗   |   ✗
view_analytics      |   ✓   |   ✗    |  ✗   |   ✗
manage_settings     |   ✓   |   ✗    |  ✗   |   ✗
upload_files        |   ✓   |   ✓    |  ✓   |   ✗
```

### Resource-Specific Permissions

Different resources can have different permission rules:

**Users Resource**:
- ADMIN: Full CRUD + manage_users
- EDITOR, USER, VIEWER: Read only

**Projects Resource**:
- ADMIN: Full CRUD
- EDITOR: Create, Read, Update
- USER: Read, Update (own projects only)
- VIEWER: Read only

**Files Resource**:
- ADMIN, EDITOR, USER: Upload and manage own files
- VIEWER: Read only

Implementation Architecture
---------------------------

### Server-Side (Backend)

**[src/config/roles.ts](src/config/roles.ts)** - Role definitions
```typescript
export const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ['create', 'read', 'update', 'delete', ...],
  EDITOR: ['create', 'read', 'update', ...],
  USER: ['read', 'update', 'upload_files'],
  VIEWER: ['read'],
};
```

**[src/lib/rbac.ts](src/lib/rbac.ts)** - Server utilities
```typescript
// Extract user context from JWT token
export function getUserContext(req: NextRequest): RBACContext | null

// Require authentication
export function requireAuth(req: NextRequest): RBACContext | NextResponse

// Require specific permission
export function requirePermission(
  req: NextRequest,
  permission: Permission,
  resource?: string
): RBACContext | NextResponse

// Require specific role (or higher)
export function requireRole(
  req: NextRequest,
  requiredRole: Role,
  resource?: string
): RBACContext | NextResponse

// Require resource-specific permission
export function requireResourcePermission(
  req: NextRequest,
  resource: string,
  permission: Permission
): RBACContext | NextResponse

// Check permission (returns boolean)
export function canPerformAction(
  context: RBACContext,
  permission: Permission,
  resource?: string
): boolean

// Log RBAC decision for audit trail
export function logRBACDecision(
  context: RBACContext,
  action: string,
  resource: string,
  permission: Permission | string,
  decision: 'ALLOWED' | 'DENIED',
  reason?: string
): void
```

### Client-Side (Frontend)

**[src/hooks/useRBAC.ts](src/hooks/useRBAC.ts)** - React hook
```typescript
const {
  role,                    // Current user's role
  hasPermission,           // Check specific permission
  hasResourcePermission,   // Check resource permission
  isRoleAtLeast,          // Check role hierarchy
  canCreate,              // Convenience: has 'create'
  canRead,                // Convenience: has 'read'
  canUpdate,              // Convenience: has 'update'
  canDelete,              // Convenience: has 'delete'
  isAdmin,                // Convenience: role === 'ADMIN'
  isEditor,               // Convenience: role >= 'EDITOR'
} = useRBAC();
```

**[src/components/RBACGuard.tsx](src/components/RBACGuard.tsx)** - Guard component
```tsx
// Guard with permission
<RBACGuard permission="delete">
  <button>Delete</button>
</RBACGuard>

// Guard with role
<RBACGuard role="ADMIN">
  <AdminPanel />
</RBACGuard>

// Guard with resource permission
<RBACGuard resource="projects" resourcePermission="update">
  <EditProjectButton />
</RBACGuard>

// Convenience components
<AdminOnly><AdminDashboard /></AdminOnly>
<EditorOrAbove><EditControls /></EditorOrAbove>
<CanDelete><DeleteButton /></CanDelete>
```

Usage Examples
-------------

### Server-Side: API Route Protection

**Example 1: Require Specific Permission**
```typescript
// src/app/api/projects/route.ts
import { requireResourcePermission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  // Require 'create' permission on 'projects' resource
  const context = requireResourcePermission(req, 'projects', 'create');
  
  // If context is Response, user doesn't have permission
  if (context instanceof Response) {
    return context; // Returns 403 Forbidden
  }

  // User has permission, proceed with logic
  const project = await createProject(context.userId, data);
  return sendSuccess(project, 'Project created');
}
```

**Example 2: Require Admin Role**
```typescript
// src/app/api/admin/users/[id]/route.ts
import { requireRole } from '@/lib/rbac';

export async function DELETE(req: NextRequest, { params }) {
  // Only ADMIN can delete users
  const context = requireRole(req, 'ADMIN', 'users');
  
  if (context instanceof Response) {
    return context; // Returns 403 Forbidden
  }

  await deleteUser(params.id);
  return sendSuccess(null, 'User deleted');
}
```

**Example 3: Conditional Logic Based on Role**
```typescript
import { getUserContext, canPerformAction } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const context = getUserContext(req);
  
  if (!context) {
    return sendError('Authentication required', 401);
  }

  // Admins see all projects, others see only their own
  const projects = await prisma.project.findMany({
    where: context.role === 'ADMIN' ? {} : { userId: context.userId },
  });

  return sendSuccess(projects);
}
```

**Example 4: Multiple Permission Checks**
```typescript
import { requireAnyPermission } from '@/lib/rbac';

export async function PUT(req: NextRequest) {
  // Require ANY of these permissions
  const context = requireAnyPermission(
    req,
    ['update', 'manage_projects'],
    'projects'
  );
  
  if (context instanceof Response) {
    return context;
  }

  // User has at least one required permission
  // ...update logic
}
```

### Client-Side: UI Access Control

**Example 1: Conditional Rendering**
```tsx
'use client';

import { useRBAC } from '@/hooks/useRBAC';

export default function ProjectActions({ project }) {
  const { canUpdate, canDelete, isAdmin } = useRBAC();

  return (
    <div>
      {canUpdate && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
      {isAdmin && <button>Advanced Settings</button>}
    </div>
  );
}
```

**Example 2: Using RBAC Guard**
```tsx
import { RBACGuard, AdminOnly } from '@/components/RBACGuard';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <RBACGuard permission="create">
        <button>Create New Project</button>
      </RBACGuard>

      <RBACGuard resource="projects" resourcePermission="delete">
        <button>Delete Project</button>
      </RBACGuard>

      <AdminOnly>
        <div>Admin-only panel</div>
      </AdminOnly>
    </div>
  );
}
```

**Example 3: Role-Based Layouts**
```tsx
import { useRBAC } from '@/hooks/useRBAC';

export default function Sidebar() {
  const { isAdmin, isEditor, role } = useRBAC();

  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      {isEditor && <a href="/projects">Manage Projects</a>}
      {isAdmin && <a href="/admin/users">Manage Users</a>}
      {isAdmin && <a href="/admin/settings">Settings</a>}
      <p className="text-sm">Logged in as: {role}</p>
    </nav>
  );
}
```

Audit Logging
------------

Every RBAC decision is automatically logged with comprehensive details:

### Log Format
```typescript
interface RBACLogEntry {
  timestamp: string;
  action: string;
  resource: string;
  userId: number;
  email: string;
  role: Role;
  permission: Permission | string;
  decision: 'ALLOWED' | 'DENIED';
  reason?: string;
  ip?: string;
}
```

### Example Logs
```
✅ [RBAC] ADMIN (admin@trustx.com) attempted to 'delete' on users: ALLOWED
🚫 [RBAC] USER (user@trustx.com) attempted to 'delete' on users: DENIED - Role 'USER' lacks permission 'delete'
✅ [RBAC] EDITOR (editor@trustx.com) attempted to 'create' on projects: ALLOWED
🚫 [RBAC] VIEWER (viewer@trustx.com) attempted to 'update' on projects: DENIED - Role 'VIEWER' lacks 'update' permission on 'projects'
```

### Viewing Logs

**Development**: Check server console for real-time RBAC logs

**Production**: Integrate with logging services:
- AWS CloudWatch
- Datadog
- Sentry
- LogRocket
- Custom logging database

Testing RBAC
------------

### Interactive Test Page

Visit [/test-rbac](src/app/test-rbac/page.tsx) for comprehensive RBAC testing:

1. **Login as Different Roles** - Quick buttons to test each role
2. **Test API Endpoints** - Try protected routes and see allow/deny
3. **UI Component Tests** - See which elements appear/hide by role
4. **Permissions Matrix** - Visual table of role permissions
5. **Audit Logs** - Real-time client-side log of actions

### Manual Testing Steps

**1. Test Admin Access**
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trustx.com","password":"admin123"}' \
  -c cookies.txt

# Should succeed: Delete user (admin-only)
curl -X DELETE http://localhost:3000/api/admin/users/5 \
  -b cookies.txt

# Check server console for log:
# ✅ [RBAC] ADMIN (admin@trustx.com) attempted to 'role:ADMIN' on users: ALLOWED
```

**2. Test Editor Access**
```bash
# Login as editor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@trustx.com","password":"editor123"}' \
  -c cookies.txt

# Should succeed: Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Project"}' \
  -b cookies.txt

# Should fail: Delete user (requires ADMIN)
curl -X DELETE http://localhost:3000/api/admin/users/5 \
  -b cookies.txt
# Expected: 403 Forbidden
```

**3. Test Viewer Access**
```bash
# Login as viewer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@trustx.com","password":"viewer123"}' \
  -c cookies.txt

# Should succeed: Read projects
curl http://localhost:3000/api/projects -b cookies.txt

# Should fail: Create project (requires 'create' permission)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}' \
  -b cookies.txt
# Expected: 403 Forbidden
```

### Test Results Matrix

| Endpoint | ADMIN | EDITOR | USER | VIEWER |
|----------|-------|--------|------|--------|
| GET /api/users | ✅ | ✅ | ✅ | ✅ |
| GET /api/projects | ✅ | ✅ | ✅ | ✅ |
| POST /api/projects | ✅ | ✅ | 🚫 | 🚫 |
| PUT /api/projects/:id | ✅ | ✅ | ✅* | 🚫 |
| DELETE /api/projects/:id | ✅ | 🚫 | 🚫 | 🚫 |
| DELETE /api/admin/users/:id | ✅ | 🚫 | 🚫 | 🚫 |

*USER can only update their own resources

Files Created
-------------

**Configuration**:
- [src/config/roles.ts](src/config/roles.ts) - Role definitions and permission mappings

**Server-Side**:
- [src/lib/rbac.ts](src/lib/rbac.ts) - RBAC utilities and middleware helpers
- [src/app/api/projects/route.ts](src/app/api/projects/route.ts) - Updated with RBAC checks
- [src/app/api/users/route.ts](src/app/api/users/route.ts) - Updated with RBAC checks
- [src/app/api/admin/users/[id]/route.ts](src/app/api/admin/users/[id]/route.ts) - Admin-only endpoint

**Client-Side**:
- [src/hooks/useRBAC.ts](src/hooks/useRBAC.ts) - React hook for permissions
- [src/components/RBACGuard.tsx](src/components/RBACGuard.tsx) - Guard components

**Testing**:
- [src/app/test-rbac/page.tsx](src/app/test-rbac/page.tsx) - Interactive RBAC test dashboard

Extending RBAC
--------------

### Adding New Roles

```typescript
// src/config/roles.ts
export type Role = 'ADMIN' | 'EDITOR' | 'USER' | 'VIEWER' | 'MODERATOR';

export const rolePermissions: Record<Role, Permission[]> = {
  // ... existing roles
  MODERATOR: ['read', 'update', 'manage_users'],
};

export const roleHierarchy: Record<Role, number> = {
  VIEWER: 1,
  USER: 2,
  MODERATOR: 3,
  EDITOR: 4,
  ADMIN: 5,
};
```

### Adding New Permissions

```typescript
// src/config/roles.ts
export type Permission = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete'
  | 'approve_content'  // New permission
  | 'ban_users';       // New permission

export const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [...existing, 'approve_content', 'ban_users'],
  MODERATOR: [...existing, 'approve_content'],
};
```

### Adding Resource-Specific Rules

```typescript
// src/config/roles.ts
export const resourcePermissions: Record<string, Record<Role, Permission[]>> = {
  // ... existing resources
  comments: {
    ADMIN: ['create', 'read', 'update', 'delete'],
    MODERATOR: ['read', 'update', 'delete'],
    USER: ['create', 'read', 'update'],
    VIEWER: ['read'],
  },
};
```

Security Best Practices
-----------------------

### DO's ✅
- ✅ **Always enforce on backend**: UI checks are for UX, not security
- ✅ **Use resource-specific permissions**: Fine-grained control reduces risk
- ✅ **Log all decisions**: Essential for audits and debugging
- ✅ **Check ownership**: Ensure users can only modify their own resources
- ✅ **Use JWT roles**: Store role in token for stateless auth
- ✅ **Test thoroughly**: Use test page and manual testing

### DON'Ts 🚫
- 🚫 **Don't rely on client-side checks alone**: Always validate on server
- 🚫 **Don't expose sensitive info in errors**: Generic messages prevent enumeration
- 🚫 **Don't hardcode permissions in routes**: Use centralized config
- 🚫 **Don't skip logging**: Audit trails are critical for security
- 🚫 **Don't allow privilege escalation**: Validate role changes server-side

Scalability Considerations
--------------------------

**Current Design**: Static role-permission mapping in code

**For Complex Systems, Consider**:
- **Database-stored permissions**: Dynamic role creation via admin UI
- **Policy-based access control (PBAC)**: Attribute-based rules (e.g., time, location)
- **Context-aware permissions**: Different permissions based on resource state
- **Inherited permissions**: Organizational hierarchies and teams
- **Temporary permissions**: Time-limited access grants

**Migration Path**:
```typescript
// Current: Static config
const permissions = rolePermissions[role];

// Future: Database lookup
const permissions = await prisma.rolePermission.findMany({
  where: { roleId: user.roleId },
  select: { permission: true },
});
```

Reflection
----------

**Challenges**:
- Balancing granularity with simplicity (too many roles = confusion)
- Ensuring all endpoints are protected consistently
- Managing ownership checks (users updating their own vs. all resources)
- Performance impact of permission checks on every request

**Solutions**:
- Defined clear role hierarchy with 4 levels (enough for most apps)
- Created reusable middleware helpers for consistent enforcement
- Implemented resource-specific permissions for ownership rules
- Used JWT-based auth for fast, stateless permission checks

**Results**:
- ✅ **Zero unauthorized access**: All endpoints protected with RBAC
- ✅ **Complete audit trail**: Every allow/deny decision logged
- ✅ **Developer-friendly API**: Easy-to-use hooks and middleware
- ✅ **Scalable architecture**: Can extend with new roles/permissions
- ✅ **Production-ready**: Comprehensive testing and documentation
- ✅ **Compliance-ready**: Full audit logs for regulatory requirements

---

Forms: React Hook Form + Zod
----------------------------

This project uses React Hook Form for lightweight form state management and Zod for schema validation on client-side forms. Use `@hookform/resolvers` to connect Zod schemas to React Hook Form.

Install locally in the `trust-x` app directory:

```bash
cd trust-x
npm install react-hook-form zod @hookform/resolvers
```

Example files added:
- `src/components/FormInput.tsx` — reusable input component that accepts `register` and displays validation errors.
- `src/app/signup/page.tsx` — Signup form implemented with React Hook Form + Zod and posts to `/api/auth/signup`.
- `src/app/contact/page.tsx` — Contact form demonstrating reuse of `FormInput` and schema-based validation.

Notes:
- Keep labels associated with inputs and use `aria-invalid` for accessibility.
- Validation schemas live next to usage in these examples; you can extract schemas to `src/lib/schemas` for reuse server-side.

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

----------------------

### Time-To-Live (TTL) Settings

| Data Type | TTL | Reason |
| User Lists | 60 seconds | User data changes frequently |
| Static Config | 3600 seconds | Rarely changes |
### Cache Key Patterns
```
users:list:page=1:limit=10:search=
users:list:page=2:limit=10:search=john
products:list:category=electronics:page=1
user:profile:123

---------------------------

### Automatic Invalidation
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


---


Input Sanitization & OWASP Compliance
=====================================

This project implements comprehensive input sanitization and security controls following OWASP (Open Web Application Security Project) best practices to prevent XSS (Cross-Site Scripting), SQL Injection, and other web vulnerabilities.

Overview
--------

**What is OWASP?**
OWASP is a nonprofit foundation focused on improving software security. The OWASP Top 10 lists the most critical web application security risks.

**Key Threats Addressed:**
1. **XSS (Cross-Site Scripting)**: Malicious scripts injected into trusted websites
2. **SQL Injection**: Malicious SQL code to manipulate databases
3. **Path Traversal**: Unauthorized access to server files
4. **Command Injection**: Executing arbitrary commands on the server

Files
-----

### Server-Side Utilities
- `src/lib/sanitize.ts` — Comprehensive sanitization functions for server-side processing
- `src/lib/validation.ts` — Zod schemas with integrated sanitization
- `src/lib/security.ts` — Security headers and rate limiting middleware

### Client-Side Utilities
- `src/lib/sanitizeClient.ts` — Browser-safe sanitization using DOMPurify

### Example API
- `src/app/api/comments/route.ts` — Reference implementation with full sanitization

### Testing
- `src/app/test-sanitization/page.tsx` — Interactive XSS/SQLi testing dashboard

Sanitization Functions
----------------------

### 1. sanitizeStrict(input: string): string

**Purpose**: Remove ALL HTML tags and potentially dangerous content.

**Use Cases**:
- User names
- Email addresses
- Search queries
- Non-HTML text inputs

**Example**:
```typescript
import { sanitizeStrict } from '@/lib/sanitize';

const userInput = '<script>alert("XSS")</script>John';
const safe = sanitizeStrict(userInput);
// Result: 'John'
```

### 2. sanitizeBasic(input: string): string

**Purpose**: Allow minimal safe HTML (paragraphs, links, emphasis).

**Allowed Tags**: `<p>`, `<br>`, `<a>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<code>`, `<blockquote>`

**Use Cases**:
- Comments
- Short descriptions
- User-generated content with minimal formatting

**Example**:
```typescript
import { sanitizeBasic } from '@/lib/sanitize';

const userInput = '<p>Hello <script>alert("XSS")</script></p>';
const safe = sanitizeBasic(userInput);
// Result: '<p>Hello </p>'
```

### 3. sanitizeRichText(input: string): string

**Purpose**: Allow rich HTML formatting for blog posts and articles.

**Allowed Tags**: All basic tags plus `<h1>-<h6>`, `<img>`, `<table>`, `<div>`, `<span>`, `<pre>`

**Use Cases**:
- Blog posts
- Articles
- Rich text editors

**Example**:
```typescript
import { sanitizeRichText } from '@/lib/sanitize';

const userInput = '<h1>Title</h1><img src=x onerror="alert(\'XSS\')">';
const safe = sanitizeRichText(userInput);
// Result: '<h1>Title</h1>' (dangerous img removed)
```

### 4. sanitizeEmail(input: string): string

**Purpose**: Validate and normalize email addresses.

**Example**:
```typescript
import { sanitizeEmail } from '@/lib/sanitize';

const email = sanitizeEmail('  USER@EXAMPLE.COM  ');
// Result: 'user@example.com'
```

### 5. sanitizeUrl(input: string): string

**Purpose**: Validate URLs and block dangerous protocols like `javascript:`.

**Allowed Protocols**: `http:`, `https:`, `mailto:`

**Example**:
```typescript
import { sanitizeUrl } from '@/lib/sanitize';

const malicious = 'javascript:alert("XSS")';
const safe = sanitizeUrl(malicious);
// Result: '' (blocked)

const valid = sanitizeUrl('https://example.com');
// Result: 'https://example.com'
```

### 6. sanitizeFilename(input: string): string

**Purpose**: Prevent path traversal attacks by removing dangerous characters.

**Example**:
```typescript
import { sanitizeFilename } from '@/lib/sanitize';

const malicious = '../../../etc/passwd';
const safe = sanitizeFilename(malicious);
// Result: 'etcpasswd'
```

### 7. sanitizeNumber(input: unknown): number | null

**Purpose**: Safely parse numbers from untrusted input.

**Example**:
```typescript
import { sanitizeNumber } from '@/lib/sanitize';

const num = sanitizeNumber('42.5px');
// Result: 42.5

const invalid = sanitizeNumber('not a number');
// Result: null
```

### 8. sanitizeBoolean(input: unknown): boolean

**Purpose**: Parse boolean values from various formats.

**Example**:
```typescript
import { sanitizeBoolean } from '@/lib/sanitize';

sanitizeBoolean('true');    // true
sanitizeBoolean('yes');     // true
sanitizeBoolean('1');       // true
sanitizeBoolean('false');   // false
sanitizeBoolean('no');      // false
sanitizeBoolean('0');       // false
```

### 9. sanitizeObject(obj: Record<string, any>): Record<string, any>

**Purpose**: Recursively sanitize all strings in an object.

**Example**:
```typescript
import { sanitizeObject } from '@/lib/sanitize';

const data = {
  name: '<script>alert("XSS")</script>John',
  bio: '<p>Hello</p>'
};

const safe = sanitizeObject(data);
// Result: { name: 'John', bio: '<p>Hello</p>' }
```

Validation with Zod
-------------------

The project uses Zod schemas with integrated sanitization transformers:

### User Registration Schema

```typescript
import { userRegistrationSchema } from '@/lib/validation';

const result = userRegistrationSchema.safeParse({
  name: '<script>alert("XSS")</script>John',
  email: 'USER@EXAMPLE.COM',
  password: 'SecurePass123!',
});

if (result.success) {
  // result.data.name: 'John' (sanitized)
  // result.data.email: 'user@example.com' (normalized)
}
```

### Comment Schema

```typescript
import { commentSchema } from '@/lib/validation';

const result = commentSchema.safeParse({
  content: '<p>Hello <script>alert("XSS")</script></p>',
  authorName: 'John',
});

if (result.success) {
  // result.data.content: '<p>Hello </p>' (sanitized)
}
```

Security Headers
----------------

The application applies OWASP-recommended security headers to all responses:

### Implemented Headers

```typescript
// src/lib/security.ts
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
```

### Header Descriptions

- **Content-Security-Policy (CSP)**: Controls which resources can be loaded
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filter
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

Rate Limiting
-------------

Prevents abuse and DoS attacks:

```typescript
import { checkRateLimit } from '@/lib/security';

export async function POST(req: Request) {
  const identifier = req.headers.get('x-forwarded-for') || 'unknown';
  const allowed = checkRateLimit(identifier, 100); // 100 requests/minute
  
  if (!allowed) {
    return sendError('Rate limit exceeded', ERROR_CODES.RATE_LIMIT, 429);
  }
  
  // Process request...
}
```

SQL Injection Prevention
------------------------

The project uses Prisma ORM with parameterized queries:

### ❌ Vulnerable (String Concatenation)
```typescript
// NEVER DO THIS
const user = await db.raw(`SELECT * FROM users WHERE email = '${email}'`);
```

### ✅ Secure (Parameterized Queries)
```typescript
// Prisma automatically parameterizes queries
const user = await prisma.user.findUnique({
  where: { email: sanitizeEmail(email) },
});
```

API Implementation Example
--------------------------

### Secure Comment API

```typescript
// src/app/api/comments/route.ts
import { commentSchema } from '@/lib/validation';
import { sanitizeBasic, logSanitization } from '@/lib/sanitize';
import { sendSuccess, sendError } from '@/lib/responseHandler';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validate with Zod schema
    const result = commentSchema.safeParse(body);
    if (!result.success) {
      return sendError('Validation failed', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // 2. Additional sanitization
    const sanitizedContent = sanitizeBasic(result.data.content);
    
    // 3. Log sanitization for audit
    logSanitization('comment.content', body.content, sanitizedContent);
    
    // 4. Save to database (parameterized query)
    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        authorName: result.data.authorName,
      },
    });
    
    return sendSuccess(comment, 'Comment created', 201);
  } catch (error) {
    return sendError('Internal error', ERROR_CODES.INTERNAL_ERROR, 500, error);
  }
}
```

Client-Side Sanitization
------------------------

For browser-based sanitization, use DOMPurify:

```typescript
'use client';

import { sanitizeHtmlClient } from '@/lib/sanitizeClient';

export default function CommentDisplay({ comment }: { comment: string }) {
  const safeHtml = sanitizeHtmlClient(comment);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
}
```

Testing & Tryout
----------------

### 1. Visit the Test Page

```bash
npm run dev
# Visit http://localhost:3000/test-sanitization
```

### 2. Test XSS Payloads

The test page includes common XSS attack vectors:

```html
<script>alert("XSS")</script>
<img src=x onerror="alert('XSS')">
<svg onload="alert('XSS')">
javascript:alert("XSS")
<iframe src="javascript:alert('XSS')"></iframe>
```

### 3. Test SQL Injection Payloads

```sql
' OR '1'='1
' OR 1=1--
admin'--
' UNION SELECT NULL--
1'; DROP TABLE users--
```

### 4. Manual Testing

1. Enter malicious payload in the input box
2. Click "Sanitize Input"
3. Compare the three sanitization levels:
   - **Strict**: All HTML removed
   - **Basic**: Safe HTML only
   - **Rich**: More HTML allowed

### 5. Automated Testing

1. Click "Run XSS Attack Tests"
2. Watch as 5 common XSS payloads are tested
3. Verify all payloads are blocked (green indicators)

Before & After Examples
-----------------------

### Example 1: Script Tag XSS

**Before**: `<script>alert('XSS')</script>Hello`  
**After**: `Hello`  
**Status**: ✅ Blocked

### Example 2: Image Tag XSS

**Before**: `<img src=x onerror="alert('XSS')">`  
**After**: `` (empty)  
**Status**: ✅ Blocked

### Example 3: SQL Injection

**Before**: `' OR '1'='1`  
**After**: `' OR '1'='1` (escaped by Prisma)  
**Status**: ✅ Blocked (parameterized query)

### Example 4: Safe HTML

**Before**: `<p>Hello <strong>World</strong></p>`  
**After**: `<p>Hello <strong>World</strong></p>`  
**Status**: ✅ Allowed (safe HTML)

### Example 5: JavaScript Protocol

**Before**: `<a href="javascript:alert('XSS')">Click</a>`  
**After**: `<a>Click</a>` (href removed)  
**Status**: ✅ Blocked

OWASP Top 10 Compliance Checklist
----------------------------------

✅ **A01:2021 – Broken Access Control**
- Implemented RBAC (Role-Based Access Control)
- Server-side permission checks
- Protected API routes

✅ **A02:2021 – Cryptographic Failures**
- JWT tokens for authentication
- bcrypt for password hashing
- Secure cookie settings

✅ **A03:2021 – Injection**
- Input sanitization (sanitize.ts)
- Parameterized queries (Prisma ORM)
- Zod validation schemas
- Output encoding

✅ **A04:2021 – Insecure Design**
- Defense in depth strategy
- Audit logging
- Rate limiting

✅ **A05:2021 – Security Misconfiguration**
- Security headers (CSP, XSS-Protection)
- Disabled unnecessary features
- Error handling without info leaks

✅ **A06:2021 – Vulnerable Components**
- Regular npm audit
- Updated dependencies
- Zero vulnerabilities detected

✅ **A07:2021 – Authentication Failures**
- JWT with refresh tokens
- Password complexity requirements
- Session management

✅ **A08:2021 – Software/Data Integrity**
- Content-Security-Policy headers
- Subresource Integrity (SRI) ready

✅ **A09:2021 – Logging Failures**
- Comprehensive audit logging
- Sanitization event tracking
- RBAC decision logging

✅ **A10:2021 – Server-Side Request Forgery**
- URL protocol validation
- Allowlist for external requests

Performance Considerations
--------------------------

### Sanitization Overhead

- **Strict sanitization**: ~0.1ms per call
- **Basic sanitization**: ~0.5ms per call
- **Rich text sanitization**: ~1-2ms per call

### Optimization Tips

1. **Cache sanitized content**: Store sanitized HTML to avoid re-processing
2. **Batch processing**: Sanitize multiple fields in parallel
3. **Early validation**: Reject invalid input before sanitization
4. **Client-side preview**: Use client sanitization for instant feedback

### Example Caching

```typescript
import { sanitizeBasic } from '@/lib/sanitize';
import { redis } from '@/lib/redis';

async function getCachedSanitized(key: string, input: string) {
  const cached = await redis.get(`sanitized:${key}`);
  if (cached) return cached;
  
  const sanitized = sanitizeBasic(input);
  await redis.setex(`sanitized:${key}`, 3600, sanitized);
  return sanitized;
}
```

Best Practices
--------------

### 1. Defense in Depth

Apply multiple layers of security:

1. **Input validation**: Reject invalid data early
2. **Input sanitization**: Clean potentially dangerous content
3. **Parameterized queries**: Prevent SQL injection
4. **Output encoding**: Escape HTML before rendering
5. **Security headers**: Browser-level protections
6. **Rate limiting**: Prevent abuse

### 2. Sanitize on Input AND Output

```typescript
// Input: Sanitize when receiving data
const sanitizedInput = sanitizeStrict(userInput);
await prisma.user.create({ data: { name: sanitizedInput } });

// Output: Escape when rendering
<div>{escapeHtml(user.name)}</div>
```

### 3. Use Appropriate Sanitization Level

- **User names**: `sanitizeStrict` (no HTML)
- **Comments**: `sanitizeBasic` (minimal HTML)
- **Blog posts**: `sanitizeRichText` (rich HTML)

### 4. Never Trust User Input

```typescript
// ❌ Bad: Direct database query
const user = await db.raw(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Good: Parameterized query + sanitization
const userId = sanitizeNumber(req.params.id);
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### 5. Audit and Log Everything

```typescript
import { logSanitization } from '@/lib/sanitize';

logSanitization('user.name', dirtyInput, cleanOutput);
// Logs: Sanitization event with timestamp, context, before/after values
```

Common Pitfalls to Avoid
------------------------

### ❌ Blacklisting Instead of Allowlisting

```typescript
// Bad: Trying to block specific patterns
if (input.includes('<script>')) return '';

// Good: Allow only safe patterns
return sanitizeBasic(input); // Uses allowlist of safe tags
```

### ❌ Sanitizing Only on Client

```typescript
// Bad: Client-side only
const safe = sanitizeHtmlClient(input); // Can be bypassed

// Good: Server-side validation
const safe = sanitizeBasic(input); // Cannot be bypassed
```

### ❌ Forgetting to Escape Output

```typescript
// Bad: Rendering unsanitized HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Good: Sanitize before rendering
<div dangerouslySetInnerHTML={{ __html: sanitizeHtmlClient(userInput) }} />
```

### ❌ Using String Concatenation for SQL

```typescript
// Bad: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// Good: Parameterized query
const user = await prisma.user.findUnique({ where: { email } });
```

Reflection
----------

Input sanitization is the first line of defense against injection attacks. By combining multiple strategies—strict input validation, flexible sanitization levels, parameterized queries, output encoding, security headers, and audit logging—we create a robust security posture that protects against the OWASP Top 10 vulnerabilities.

The key insight is that **no single technique is sufficient**. XSS can bypass client-side sanitization, SQL injection can exploit concatenated queries, and path traversal can occur in filename handling. A defense-in-depth approach with multiple overlapping protections ensures that if one layer fails, others catch the attack.

Regular security audits, penetration testing, and staying updated with OWASP guidelines are essential for maintaining a secure application. Use the test page at `/test-sanitization` to verify your sanitization is working correctly and to educate your team about common attack vectors.

**Remember**: Security is not a feature you add at the end—it's a mindset you apply throughout development.
