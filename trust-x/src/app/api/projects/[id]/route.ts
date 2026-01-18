/**
 * Project by ID API Route - Get, Update, Delete
 * GET /api/projects/[id] - Retrieve a specific project
 * PUT /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Delete a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

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
    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const projectId = new ObjectId(id);
    const project = await db.collection('projects').findOne({ _id: projectId });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch related tasks (limit 10)
    const tasks = await db.collection('tasks')
      .find({ projectId: projectId })
      .project({ _id: 1, title: 1, status: 1 })
      .limit(10)
      .toArray();

    // Format response
    const formattedProject = {
      id: project._id.toString(),
      title: project.title,
      status: project.status,
      userId: project.userId.toString(),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      tasks: tasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        status: task.status,
      })),
    };

    return NextResponse.json(
      { success: true, data: formattedProject },
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
    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const projectId = new ObjectId(id);
    const body = await req.json();
    const { title, status } = body;

    // Check if project exists
    const existingProject = await db.collection('projects').findOne({ _id: projectId });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Build update document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateDoc: any = {
      updatedAt: new Date(),
    };
    if (title) updateDoc.title = title;
    if (status) updateDoc.status = status;

    // Update project
    const result = await db.collection('projects').findOneAndUpdate(
      { _id: projectId },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to update project' },
        { status: 500 }
      );
    }

    const updatedProject = {
      id: result._id.toString(),
      title: result.title,
      status: result.status,
      updatedAt: result.updatedAt,
    };

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
    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const projectId = new ObjectId(id);

    // Check if project exists
    const project = await db.collection('projects').findOne({ _id: projectId });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project
    await db.collection('projects').deleteOne({ _id: projectId });

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
