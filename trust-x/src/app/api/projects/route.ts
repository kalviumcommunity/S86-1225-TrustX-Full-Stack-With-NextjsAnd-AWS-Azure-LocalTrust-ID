/**
 * Projects API Route - CRUD Operations with RBAC
 * GET /api/projects - Retrieve projects (requires 'read' permission)
 * POST /api/projects - Create a new project (requires 'create' permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireResourcePermission } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';

// GET: Retrieve all projects with pagination and filtering
export async function GET(req: NextRequest) {
  // Require 'read' permission on 'projects' resource
  const context = requireResourcePermission(req, 'projects', 'read');
  
  if (context instanceof Response) {
    return context;
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = Number(userId);
    
    // Non-admins can only see their own projects
    if (context.role !== 'ADMIN') {
      whereClause.userId = context.userId;
    }

    // Fetch projects and total count
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          status: true,
          userId: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    console.error('GET /api/projects error:', error);
    return sendError(message, 500, 'INTERNAL_ERROR');
  }
}

// POST: Create a new project
export async function POST(req: NextRequest) {
  // Require 'create' permission on 'projects' resource
  const context = requireResourcePermission(req, 'projects', 'create');
  
  if (context instanceof Response) {
    return context;
  }

  try {
    const body = await req.json();
    const { title, userId } = body;

    // Validate required fields
    if (!title) {
      return sendError('Title is required', 400, 'VALIDATION_ERROR');
    }

    // Use the authenticated user's ID
    const projectUserId = userId ? Number(userId) : context.userId;
    
    // Only admins can create projects for other users
    if (projectUserId !== context.userId && context.role !== 'ADMIN') {
      return sendError(
        'Access denied: you can only create projects for yourself',
        403,
        'FORBIDDEN'
      );
    }

    // Verify user exists (if creating for someone else)
    if (projectUserId !== context.userId) {
      const user = await prisma.user.findUnique({
        where: { id: projectUserId },
      });

      if (!user) {
        return sendError('User not found', 404, 'NOT_FOUND');
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        userId: projectUserId,
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        status: true,
        userId: true,
        createdAt: true,
      },
    });

    return sendSuccess(project, 'Project created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    console.error('POST /api/projects error:', error);
    return sendError(message, 500, 'INTERNAL_ERROR');
  }
}
