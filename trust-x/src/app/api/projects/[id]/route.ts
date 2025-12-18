/**
 * Project by ID API Route - Get, Update, Delete
 * GET /api/projects/[id] - Retrieve a specific project
 * PUT /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Delete a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Retrieve a specific project by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          select: { id: true, title: true, status: true },
          take: 10,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: project },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project';
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT: Update a project
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, status } = body;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Project updated successfully',
        data: updatedProject,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    console.error('PUT /api/projects/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json(
      { success: true, message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
