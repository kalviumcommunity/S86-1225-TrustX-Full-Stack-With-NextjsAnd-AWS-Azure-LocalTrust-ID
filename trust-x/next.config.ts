import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  /**
   * Security Headers Configuration
   * Implements OWASP recommended security headers for HTTPS enforcement and attack prevention
   */
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // HSTS (HTTP Strict Transport Security)
          // Forces browsers to always use HTTPS for 2 years
          // Prevents MITM attacks and protocol downgrade attacks
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          
          // CSP (Content Security Policy)
          // Restricts sources for scripts, styles, images, and other resources
          // Prevents XSS attacks by controlling what content can be loaded
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://apis.google.com https://*.vercel.app",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          
          // X-Frame-Options
          // Prevents clickjacking attacks by disallowing iframe embedding
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          
          // X-Content-Type-Options
          // Prevents MIME type sniffing
          // Forces browser to respect declared content types
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          
          // X-XSS-Protection
          // Enables browser's XSS filtering (legacy but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          
          // Referrer-Policy
          // Controls how much referrer information is sent with requests
          // Protects user privacy and prevents information leakage
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          
          // Permissions-Policy (formerly Feature-Policy)
          // Restricts browser features like geolocation, camera, microphone
          // Reduces attack surface by disabling unnecessary features
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
          },
          
          // X-DNS-Prefetch-Control
          // Controls DNS prefetching for privacy
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          
          // Cross-Origin-Embedder-Policy (COEP)
          // Controls embedding of cross-origin resources
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          
          // Cross-Origin-Opener-Policy (COOP)
          // Isolates browsing context from cross-origin windows
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          
          // Cross-Origin-Resource-Policy (CORP)
          // Controls which origins can load resources
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      
      // API routes with CORS configuration
      {
        source: '/api/:path*',
        headers: [
          // CORS headers for API routes
          // Restrict to trusted origins only (customize for your domain)
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },
    ];
  },
};

export default nextConfig;
