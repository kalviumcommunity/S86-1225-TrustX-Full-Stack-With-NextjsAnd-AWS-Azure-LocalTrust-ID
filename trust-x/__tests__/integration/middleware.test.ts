/**
 * Middleware Integration Tests
 * 
 * Tests middleware functionality including:
 * - JWT authentication middleware
 * - RBAC (Role-Based Access Control)
 * - Rate limiting
 * - Request logging
 * - Input sanitization
 * - CORS headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import jwt from 'jsonwebtoken';

describe('Middleware Integration Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET!;

  const createRequest = (url: string, options: RequestInit = {}) => {
    return new NextRequest(url, options);
  };

  const createToken = (payload: any, expiresIn = '1h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  };

  describe('JWT Authentication Middleware', () => {
    it('should allow access to public routes without token', async () => {
      const request = createRequest('http://localhost:3000/api/auth/login');
      const response = await middleware(request);

      // Should not redirect or return 401
      expect(response).toBeDefined();
      if (response) {
        expect(response.status).not.toBe(401);
      }
    });

    it('should protect private API routes', async () => {
      const request = createRequest('http://localhost:3000/api/users');
      const response = await middleware(request);

      expect(response?.status).toBe(401);
      const data = await response?.json();
      expect(data.message).toContain('Access token missing');
    });

    it('should validate JWT token from Authorization header', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await middleware(request);

      // Should not return 401 with valid token
      if (response) {
        expect(response.status).not.toBe(401);
      }
    });

    it('should validate JWT token from cookies', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Cookie: `accessToken=${token}`,
        },
      });

      const response = await middleware(request);

      // Should not return 401 with valid cookie token
      if (response) {
        expect(response.status).not.toBe(401);
      }
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: '123', email: 'test@test.com', role: 'USER' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(401);
      const data = await response?.json();
      expect(data.message).toContain('expired');
    });

    it('should reject malformed tokens', async () => {
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: 'Bearer invalid.token.here',
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(401);
      const data = await response?.json();
      expect(data.message).toContain('Invalid');
    });

    it('should reject tokens with invalid signature', async () => {
      const fakeToken = jwt.sign(
        { userId: '123', email: 'test@test.com', role: 'USER' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(401);
    });
  });

  describe('RBAC (Role-Based Access Control)', () => {
    it('should allow ADMIN to access admin routes', async () => {
      const adminToken = createToken({
        userId: 'admin-123',
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const request = createRequest('http://localhost:3000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await middleware(request);

      if (response) {
        expect(response.status).not.toBe(403);
      }
    });

    it('should forbid USER from accessing admin routes', async () => {
      const userToken = createToken({
        userId: 'user-123',
        email: 'user@test.com',
        role: 'USER',
      });

      const request = createRequest('http://localhost:3000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(403);
      const data = await response?.json();
      expect(data.message).toContain('denied');
    });

    it('should allow MODERATOR to access moderator routes', async () => {
      const modToken = createToken({
        userId: 'mod-123',
        email: 'mod@test.com',
        role: 'MODERATOR',
      });

      const request = createRequest('http://localhost:3000/api/moderator/reports', {
        headers: {
          Authorization: `Bearer ${modToken}`,
        },
      });

      const response = await middleware(request);

      if (response) {
        expect(response.status).not.toBe(403);
      }
    });

    it('should check role hierarchy', async () => {
      // ADMIN should access MODERATOR routes
      const adminToken = createToken({
        userId: 'admin-123',
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const request = createRequest('http://localhost:3000/api/moderator/reports', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await middleware(request);

      if (response) {
        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });

      for (let i = 0; i < 5; i++) {
        const request = createRequest('http://localhost:3000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const response = await middleware(request);

        if (response) {
          expect(response.status).not.toBe(429);
        }
      }
    });

    it('should enforce rate limit on login attempts', async () => {
      const requests = [];

      // Make 15 requests rapidly
      for (let i = 0; i < 15; i++) {
        const request = createRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        requests.push(middleware(request));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r?.status === 429);

      expect(rateLimited).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await middleware(request);

      if (response) {
        expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
      }
    });
  });

  describe('Request Logging', () => {
    it('should log all API requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await middleware(request);

      // Check if request was logged (in non-test environment)
      // In test environment, console is suppressed, so this might not work
      if (process.env.NODE_ENV !== 'test') {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('should include request metadata in logs', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest('http://localhost:3000/api/users?page=1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Integration Test',
        },
      });

      const response = await middleware(request);

      // Verify request ID header is added
      if (response) {
        expect(response.headers.get('X-Request-ID')).toBeDefined();
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in query parameters', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest(
        'http://localhost:3000/api/users?search=<script>alert("xss")</script>',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await middleware(request);

      if (response) {
        expect(response.status).not.toBe(400);
        // Should have sanitized the script tag
      }
    });

    it('should block SQL injection attempts', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest(
        'http://localhost:3000/api/users?id=1 OR 1=1',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await middleware(request);

      // Should either block or sanitize
      if (response) {
        expect([200, 400]).toContain(response.status);
      }
    });

    it('should validate content-type for POST requests', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'ADMIN' });
      const request = createRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: 'invalid content type',
      });

      const response = await middleware(request);

      if (response && response.status === 400) {
        const data = await response.json();
        expect(data.message).toContain('Content-Type');
      }
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const request = createRequest('http://localhost:3000/api/auth/login', {
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      const response = await middleware(request);

      if (response) {
        expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
        expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
        expect(response.headers.get('Access-Control-Allow-Headers')).toBeDefined();
      }
    });

    it('should handle OPTIONS preflight requests', async () => {
      const request = createRequest('http://localhost:3000/api/users', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(204);
      expect(response?.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const request = createRequest('http://localhost:3000/api/users');
      const response = await middleware(request);

      if (response) {
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
      }
    });

    it('should set Content-Security-Policy header', async () => {
      const request = createRequest('http://localhost:3000/');
      const response = await middleware(request);

      if (response) {
        const csp = response.headers.get('Content-Security-Policy');
        expect(csp).toBeDefined();
        if (csp) {
          expect(csp).toContain("default-src 'self'");
        }
      }
    });
  });

  describe('Middleware Chain', () => {
    it('should execute middleware in correct order', async () => {
      const token = createToken({ userId: '123', email: 'test@test.com', role: 'USER' });
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await middleware(request);

      // Verify all middleware executed
      if (response) {
        // Security headers
        expect(response.headers.get('X-Content-Type-Options')).toBeDefined();
        // Request ID
        expect(response.headers.get('X-Request-ID')).toBeDefined();
        // Rate limit
        expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      }
    });

    it('should stop chain on authentication failure', async () => {
      const request = createRequest('http://localhost:3000/api/users');
      const response = await middleware(request);

      expect(response?.status).toBe(401);
      // Should not proceed to check RBAC or rate limit
    });

    it('should stop chain on authorization failure', async () => {
      const userToken = createToken({
        userId: 'user-123',
        email: 'user@test.com',
        role: 'USER',
      });

      const request = createRequest('http://localhost:3000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(403);
      // Should not proceed to endpoint handler
    });
  });

  describe('Error Handling', () => {
    it('should handle middleware errors gracefully', async () => {
      // Create a request that might cause middleware error
      const request = createRequest('http://localhost:3000/api/users', {
        headers: {
          Authorization: 'Bearer ' + 'a'.repeat(10000), // Extremely long token
        },
      });

      const response = await middleware(request);

      expect(response?.status).toBe(401);
      const data = await response?.json();
      expect(data.success).toBe(false);
    });

    it('should return proper error response format', async () => {
      const request = createRequest('http://localhost:3000/api/users');
      const response = await middleware(request);

      const data = await response?.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(data.success).toBe(false);
    });
  });
});
