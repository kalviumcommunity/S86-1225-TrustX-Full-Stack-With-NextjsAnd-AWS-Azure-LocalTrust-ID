/**
 * Projects API Route - CRUD Operations
 * GET /api/projects - Retrieve all projects with pagination
 * POST /api/projects - Create a new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET: Retrieve all projects with pagination and filtering
export async function GET(req: NextRequest) {
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

    // Fetch projects and total count
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
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
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST: Create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, userId } = body;

    // Validate required fields
    if (!title || !userId) {
      return NextResponse.json(
        { success: false, error: 'Title and userId are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        description: description || '',
        userId: Number(userId),
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        userId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Project created successfully',
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
