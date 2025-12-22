import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Protect API admin endpoints using Authorization header
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/users")) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ success: false, message: "Token missing" }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };

      // Role-based access control
      if (pathname.startsWith("/api/admin") && decoded.role !== "ADMIN") {
        return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
      }

      // Attach user info for downstream handlers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-email", decoded.email);
      requestHeaders.set("x-user-role", decoded.role);
      requestHeaders.set("x-user-id", decoded.id.toString());

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 403 });
    }
  }

  // Protect client-side pages (dashboard, users) using cookie-based JWT
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users")) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/api/:path*',
    '/dashboard/:path*',
    '/users/:path*',
  ],
};