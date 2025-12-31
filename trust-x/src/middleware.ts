import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./lib/jwt";

/**
 * Middleware for JWT-based authentication, authorization, and security headers
 * Protects API routes and client-side pages
 * Adds CORS and security headers for enhanced protection
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // Add security headers to all responses (defense in depth)
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle CORS preflight requests for API routes
  if (req.method === 'OPTIONS' && pathname.startsWith('/api')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://your-production-domain.com', // Replace with your actual domain
      'https://your-staging-domain.com',     // Replace with your staging domain
    ];

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Allow-Credentials': 'true',
    };

    // Only allow requests from trusted origins
    if (origin && allowedOrigins.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    }

    const preflightResponse = new NextResponse(null, { status: 204 });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      preflightResponse.headers.set(key, value);
    });

    return preflightResponse;
  }

  // Add CORS headers to API responses
  if (pathname.startsWith('/api')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://your-production-domain.com',
      'https://your-staging-domain.com',
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Protect API admin endpoints using Authorization header (Bearer token)
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/users")) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: "Access token missing" 
      }, { status: 401 });
    }

    try {
      const decoded = verifyAccessToken(token);

      // Role-based access control (RBAC)
      if (pathname.startsWith("/api/admin") && decoded.role !== "ADMIN") {
        return NextResponse.json({ 
          success: false, 
          message: "Access denied: Admin role required" 
        }, { status: 403 });
      }

      // Attach user info to headers for downstream handlers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-email", decoded.email);
      requestHeaders.set("x-user-role", decoded.role);
      requestHeaders.set("x-user-id", decoded.id.toString());

      return NextResponse.next({ 
        request: { headers: requestHeaders },
        headers: response.headers,
      });

    } catch (error) {
      // Token expired or invalid
      return NextResponse.json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid token",
        hint: "Use /api/auth/refresh to get a new access token"
      }, { status: 401 });
    }
  }

  // Protect client-side pages using cookie-based access token
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      verifyAccessToken(accessToken);
      return response;
    } catch {
      // Token expired - redirect to login with hint to refresh
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("expired", "true");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
