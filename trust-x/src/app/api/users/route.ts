/**
 * Users API Route - CRUD Operations
 * GET /api/users - Retrieve all users with pagination (protected by middleware)
 * POST /api/users - Create a new user (public for registration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

// GET: Retrieve all users with pagination and filtering (protected by middleware)
export async function GET(req: NextRequest) {
  try {
    // User info is already validated by middleware
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const search = searchParams.get('search') || '';

    // Create cache key that includes pagination and search parameters
    const cacheKey = `users:list:page=${page}:limit=${limit}:search=${search}`;

    // Try to get data from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log("Cache Hit - Users list");
      return NextResponse.json(cachedData);
    }

    console.log("Cache Miss - Fetching users from DB");

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Fetch users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

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

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

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
