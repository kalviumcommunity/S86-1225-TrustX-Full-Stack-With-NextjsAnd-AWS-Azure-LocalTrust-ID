/**
 * Authentication API Integration Tests
 * 
 * Tests complete authentication flows including:
 * - User registration
 * - Login with JWT token generation
 * - Token refresh
 * - Logout
 * - Authentication middleware
 */

import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as refreshHandler } from '@/app/api/auth/refresh/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication API Integration Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@integration.com',
    password: 'SecurePass123!',
    role: 'USER',
  };

  beforeAll(async () => {
    // Clean up test database
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.name).toBe(testUser.name);
      expect(data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject duplicate email registration', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }), // Missing name and password
      });

      const response = await signupHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should hash password before storing', async () => {
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      expect(user).toBeDefined();
      expect(user!.password).not.toBe(testUser.password);
      
      // Verify password is bcrypt hashed
      const isValidHash = await bcrypt.compare(testUser.password, user!.password);
      expect(isValidHash).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.accessToken).toBeDefined();
      expect(data.user.email).toBe(testUser.email);

      // Verify JWT token structure
      const decoded = jwt.verify(
        data.accessToken,
        process.env.JWT_SECRET!
      ) as any;
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe('USER');
    });

    it('should reject invalid email', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: testUser.password,
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('not found');
    });

    it('should reject invalid password', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword123!',
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should set HTTP-only cookies for tokens', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const response = await loginHandler(request);
      const cookies = response.headers.get('set-cookie');

      expect(cookies).toBeDefined();
      expect(cookies).toContain('accessToken');
      expect(cookies).toContain('refreshToken');
      expect(cookies).toContain('HttpOnly');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get refresh token
      const request = global.createNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const response = await loginHandler(request);
      const cookies = response.headers.get('set-cookie');
      const match = cookies?.match(/refreshToken=([^;]+)/);
      refreshToken = match ? match[1] : '';
    });

    it('should refresh access token with valid refresh token', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.accessToken).toBeDefined();
    });

    it('should reject missing refresh token', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject invalid refresh token', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          Cookie: 'refreshToken=invalid.token.here',
        },
      });

      const response = await refreshHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear authentication cookies', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutHandler(request);
      const data = await response.json();
      const cookies = response.headers.get('set-cookie');

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(cookies).toContain('accessToken=;');
      expect(cookies).toContain('refreshToken=;');
      expect(cookies).toContain('Max-Age=0');
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full auth cycle: signup → login → refresh → logout', async () => {
      // 1. Signup
      const signupReq = global.createNextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Flow Test User',
          email: 'flowtest@integration.com',
          password: 'FlowTest123!',
        }),
      });

      const signupRes = await signupHandler(signupReq);
      expect(signupRes.status).toBe(201);

      // 2. Login
      const loginReq = global.createNextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'flowtest@integration.com',
          password: 'FlowTest123!',
        }),
      });

      const loginRes = await loginHandler(loginReq);
      const loginData = await loginRes.json();
      expect(loginRes.status).toBe(200);
      expect(logindata.accessToken).toBeDefined();

      const cookies = loginRes.headers.get('set-cookie');
      const refreshTokenMatch = cookies?.match(/refreshToken=([^;]+)/);
      const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : '';

      // 3. Refresh
      const refreshReq = global.createNextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { Cookie: `refreshToken=${refreshToken}` },
      });

      const refreshRes = await refreshHandler(refreshReq);
      const refreshData = await refreshRes.json();
      expect(refreshRes.status).toBe(200);
      expect(refreshdata.accessToken).toBeDefined();

      // 4. Logout
      const logoutReq = global.createNextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const logoutRes = await logoutHandler(logoutReq);
      expect(logoutRes.status).toBe(200);

      // Cleanup
      await prisma.user.delete({
        where: { email: 'flowtest@integration.com' },
      });
    });
  });
});


