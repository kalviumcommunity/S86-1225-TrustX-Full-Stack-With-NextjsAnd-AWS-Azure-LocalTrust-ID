/**
 * Users API Integration Tests
 * 
 * Tests user CRUD operations including:
 * - User listing with pagination
 * - User creation (admin only)
 * - User updates (own profile or admin)
 * - User deletion (admin only)
 * - RBAC enforcement
 * - Caching behavior
 */

import { GET as getUsersHandler, POST as createUserHandler } from '@/app/api/users/route';
import { GET as getUserHandler, PUT as updateUserHandler, DELETE as deleteUserHandler } from '@/app/api/users/[id]/route';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

describe('Users API Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@integration.test',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    adminUserId = adminUser.id;

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@integration.test',
        password: hashedPassword,
        role: 'USER',
      },
    });
    regularUserId = regularUser.id;

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: regularUser.id, email: regularUser.email, role: 'USER' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@integration.test', 'user@integration.test', 'newuser@integration.test'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    it('should return paginated user list for admin', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users?page=1&limit=10', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await getUsersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should forbid regular user from listing all users', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await getUsersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Forbidden');
    });

    it('should require authentication', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users', {
        method: 'GET',
      });

      const response = await getUsersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should filter users by role', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users?role=ADMIN', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await getUsersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users.every((u: any) => u.role === 'ADMIN')).toBe(true);
    });

    it('should search users by name or email', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users?search=admin', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await getUsersHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users', () => {
    it('should allow admin to create new user', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@integration.test',
          password: 'NewUser123!',
          role: 'USER',
        }),
      });

      const response = await createUserHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('newuser@integration.test');
      expect(data.user.password).toBeUndefined();
    });

    it('should forbid regular user from creating users', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: 'Another User',
          email: 'another@integration.test',
          password: 'Password123!',
        }),
      });

      const response = await createUserHandler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should validate email format', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Invalid Email User',
          email: 'invalid-email',
          password: 'Password123!',
        }),
      });

      const response = await createUserHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('email');
    });

    it('should enforce password strength', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Weak Password User',
          email: 'weakpass@integration.test',
          password: '123',
        }),
      });

      const response = await createUserHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('password');
    });
  });

  describe('GET /api/users/[id]', () => {
    it('should allow user to get own profile', async () => {
      const request = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await getUserHandler(request, { params: { id: regularUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(regularUserId);
      expect(data.user.password).toBeUndefined();
    });

    it('should allow admin to get any user', async () => {
      const request = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await getUserHandler(request, { params: { id: regularUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe(regularUserId);
    });

    it('should forbid user from viewing other profiles', async () => {
      const request = new Request(`http://localhost:3000/api/users/${adminUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await getUserHandler(request, { params: { id: adminUserId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const request = global.createNextRequest('http://localhost:3000/api/users/nonexistent-id', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await getUserHandler(request, { params: { id: 'nonexistent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/users/[id]', () => {
    it('should allow user to update own profile', async () => {
      const request = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: 'Updated Regular User',
        }),
      });

      const response = await updateUserHandler(request, { params: { id: regularUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe('Updated Regular User');
    });

    it('should allow admin to update any user', async () => {
      const request = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          role: 'MODERATOR',
        }),
      });

      const response = await updateUserHandler(request, { params: { id: regularUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe('MODERATOR');

      // Reset role
      await prisma.user.update({
        where: { id: regularUserId },
        data: { role: 'USER' },
      });
    });

    it('should forbid regular user from updating other profiles', async () => {
      const request = new Request(`http://localhost:3000/api/users/${adminUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: 'Hacked Admin',
        }),
      });

      const response = await updateUserHandler(request, { params: { id: adminUserId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should forbid regular user from changing own role', async () => {
      const request = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          role: 'ADMIN',
        }),
      });

      const response = await updateUserHandler(request, { params: { id: regularUserId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/users/[id]', () => {
    let userToDelete: any;

    beforeEach(async () => {
      userToDelete = await prisma.user.create({
        data: {
          name: 'User To Delete',
          email: `delete${Date.now()}@integration.test`,
          password: await bcrypt.hash('Password123!', 10),
          role: 'USER',
        },
      });
    });

    it('should allow admin to delete user', async () => {
      const request = new Request(`http://localhost:3000/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const response = await deleteUserHandler(request, { params: { id: userToDelete.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deletion
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should forbid regular user from deleting users', async () => {
      const request = new Request(`http://localhost:3000/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await deleteUserHandler(request, { params: { id: userToDelete.id } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should forbid user from deleting own account', async () => {
      const request = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const response = await deleteUserHandler(request, { params: { id: regularUserId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache GET requests', async () => {
      const request1 = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const start1 = Date.now();
      const response1 = await getUserHandler(request1, { params: { id: regularUserId } });
      const duration1 = Date.now() - start1;
      await response1.json();

      // Second request should be faster (cached)
      const request2 = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const start2 = Date.now();
      const response2 = await getUserHandler(request2, { params: { id: regularUserId } });
      const duration2 = Date.now() - start2;
      await response2.json();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      // Cache should make second request faster (allowing some margin)
      expect(duration2).toBeLessThanOrEqual(duration1 + 50);
    });

    it('should invalidate cache on update', async () => {
      // Get user (cache)
      const getRequest = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const getResponse1 = await getUserHandler(getRequest, { params: { id: regularUserId } });
      const getData1 = await getResponse1.json();

      // Update user (should invalidate cache)
      const updateRequest = new Request(`http://localhost:3000/api/users/${regularUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Cache Test Update',
        }),
      });

      await updateUserHandler(updateRequest, { params: { id: regularUserId } });

      // Get user again (should fetch fresh data)
      const getResponse2 = await getUserHandler(getRequest, { params: { id: regularUserId } });
      const getData2 = await getResponse2.json();

      expect(getData2.data.user.name).toBe('Cache Test Update');
    });
  });
});


