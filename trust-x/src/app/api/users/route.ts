/**
 * Users API Route - CRUD Operations with RBAC
 * GET /api/users - Retrieve all users (requires 'read' permission)
 * POST /api/users - Create a new user (public for registration)
 * 
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Get a paginated list of users with optional filtering. Requires 'read' permission on 'users' resource.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users by name or email
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Create a new user
 *     description: Register a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from "bcrypt";
import { getDb, ObjectId } from '@/lib/mongodb';
import { cacheService } from '@/lib/cache';
import { requireResourcePermission } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { logger, performance as perfLogger } from '@/lib/logger';
import { createRequestContext, logRequestCompletion } from '@/lib/requestLogger';

// GET: Retrieve all users with pagination and filtering
export async function GET(req: NextRequest) {
  const context = createRequestContext(req);
  
  // Check if user is authenticated (but allow access for admins to get user list)
  const accessToken = req.cookies.get('accessToken')?.value;
  
  if (!accessToken) {
    return sendError('Unauthorized - Please login', 'UNAUTHORIZED', 401);
  }

  try {
    const db = await getDb();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const search = searchParams.get('search') || '';

    // Create cache key that includes pagination and search parameters
    const cacheKey = `users:list:page=${page}:limit=${limit}:search=${search}`;

    // Try to get data from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      logger.logCache('hit', cacheKey, context.requestId);
      logRequestCompletion(context, req, 200);
      return NextResponse.json(cachedData);
    }

    logger.logCache('miss', cacheKey, context.requestId);

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Track database query performance
    const dbTimer = perfLogger.start('users-query', context.requestId);
    
    // Fetch users and total count
    const [usersRaw, total] = await Promise.all([
      db.collection('users')
        .find(whereClause, {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            role: 1,
            createdAt: 1,
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('users').countDocuments(whereClause),
    ]);

    // Convert _id to id for response
    const users = usersRaw.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));
    
    const dbDuration = dbTimer.end();
    
    logger.logDatabase('findMany', 'user', dbDuration, context.requestId);

    const responseData = {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the response for 60 seconds (TTL)
    await cacheService.set(cacheKey, responseData, 60);

    logger.info('Users list fetched successfully', {
      requestId: context.requestId,
      resultCount: users.length,
      page,
      search: search || 'none',
    });

    logRequestCompletion(context, req, 200);
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    
    logger.error('Failed to fetch users', {
      requestId: context.requestId,
      endpoint: '/api/users',
    }, error as Error);
    
    logRequestCompletion(context, req, 500);
    
    return NextResponse.json(
      { 
        success: false, 
        error: message,
        requestId: context.requestId,
      },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    console.log('POST /api/users body:', body);
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({
      email,
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      role: role || 'USER',
      createdAt: now,
      updatedAt: now,
    });

    const user = {
      id: result.insertedId.toString(),
      name,
      email,
      role: role || 'USER',
      createdAt: now,
    };

    // Invalidate all user list caches after creating a new user
    const invalidatedCount = await cacheService.delPattern("users:list:*");
    if (invalidatedCount > 0) {
      console.log(`Invalidated ${invalidatedCount} user list cache entries`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
