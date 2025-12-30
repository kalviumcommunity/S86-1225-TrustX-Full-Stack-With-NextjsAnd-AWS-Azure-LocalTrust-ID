import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "../lib/jwt";

/**
 * Middleware for JWT-based authentication and authorization
 * Protects API routes and client-side pages
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

      return NextResponse.next({ request: { headers: requestHeaders } });

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
      return NextResponse.next();
    } catch (error) {
      // Token expired - redirect to login with hint to refresh
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("expired", "true");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes - login, refresh, logout)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/api/:path*',
    '/dashboard/:path*',
    '/users/:path*',
  ],
};