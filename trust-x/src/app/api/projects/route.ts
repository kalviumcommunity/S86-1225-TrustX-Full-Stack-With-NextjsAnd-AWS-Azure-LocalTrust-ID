/**
 * Projects API Route - CRUD Operations with RBAC
 * GET /api/projects - Retrieve projects (requires 'read' permission)
 * POST /api/projects - Create a new project (requires 'create' permission)
 * 
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Retrieve all projects
 *     description: Get a paginated list of projects with optional filtering. Non-admin users can only see their own projects.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *         description: Filter by project status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID (admin only)
 *     responses:
 *       200:
 *         description: Successfully retrieved projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create a new project
 *     description: Create a new project for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: My New Project
 *               description:
 *                 type: string
 *                 example: Project description here
 *               status:
 *                 type: string
 *                 enum: [active, completed, archived]
 *                 default: active
 *     responses:
 *       201:
 *         description: Project successfully created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
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
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status) filter.status = status;
    
    // Handle userId with ObjectId conversion
    if (userId) {
      if (ObjectId.isValid(userId)) {
        filter.userId = new ObjectId(userId);
      } else {
        return sendError('Invalid user ID format', 'VALIDATION_ERROR', 400);
      }
    }
    
    // Non-admins can only see their own projects
    if (context.role !== 'ADMIN') {
      filter.userId = new ObjectId(context.userId);
    }

    // Fetch projects and total count
    const [projects, total] = await Promise.all([
      db.collection('projects')
        .find(filter)
        .project({
          _id: 1,
          title: 1,
          status: 1,
          userId: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('projects').countDocuments(filter),
    ]);

    // Transform _id to id for response
    const formattedProjects = projects.map((project) => ({
      id: project._id.toString(),
      title: project.title,
      status: project.status,
      userId: project.userId.toString(),
      createdAt: project.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedProjects,
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
    return sendError(message, 'INTERNAL_ERROR', 500);
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
    const db = await getDb();
    const body = await req.json();
    const { title, userId } = body;

    // Validate required fields
    if (!title) {
      return sendError('Title is required', 'VALIDATION_ERROR', 400);
    }

    // Use the authenticated user's ID
    let projectUserId: ObjectId;
    
    if (userId) {
      // Validate ObjectId format
      if (!ObjectId.isValid(userId)) {
        return sendError('Invalid user ID format', 'VALIDATION_ERROR', 400);
      }
      projectUserId = new ObjectId(userId);
    } else {
      projectUserId = new ObjectId(context.userId);
    }
    
    // Only admins can create projects for other users
    if (projectUserId.toString() !== context.userId && context.role !== 'ADMIN') {
      return sendError(
        'Access denied: you can only create projects for yourself',
        'FORBIDDEN',
        403
      );
    }

    // Verify user exists (if creating for someone else)
    if (projectUserId.toString() !== context.userId) {
      const user = await db.collection('users').findOne({
        _id: projectUserId,
      });

      if (!user) {
        return sendError('User not found', 'NOT_FOUND', 404);
      }
    }

    // Create project with timestamps
    const now = new Date();
    const newProject = {
      title,
      userId: projectUserId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('projects').insertOne(newProject);

    const project = {
      id: result.insertedId.toString(),
      title: newProject.title,
      status: newProject.status,
      userId: newProject.userId.toString(),
      createdAt: newProject.createdAt,
    };

    return sendSuccess(project, 'Project created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    console.error('POST /api/projects error:', error);
    return sendError(message, 'INTERNAL_ERROR', 500);
  }
}
