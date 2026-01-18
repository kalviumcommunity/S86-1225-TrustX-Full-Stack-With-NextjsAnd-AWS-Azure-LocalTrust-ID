/**
 * User by ID API Route - Get, Update, Delete
 * GET /api/users/[id] - Retrieve a specific user
 * PUT /api/users/[id] - Update a user
 * DELETE /api/users/[id] - Delete a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, ObjectId } from '../../../../lib/mongodb';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Retrieve a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userRaw = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    if (!userRaw) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch associated projects (limit 5)
    const projects = await db.collection('projects')
      .find({ userId: new ObjectId(id) })
      .limit(5)
      .project({ _id: 1, title: 1 })
      .toArray();

    const user = {
      id: userRaw._id.toString(),
      name: userRaw.name,
      email: userRaw.email,
      role: userRaw.role,
      createdAt: userRaw.createdAt,
      updatedAt: userRaw.updatedAt,
      projects: projects.map(p => ({ id: p._id.toString(), title: p.title })),
    };

    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT: Update a user
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, email, role } = body;

    // Check if user exists
    const existingUser = await db.collection('users').findOne({
      _id: new ObjectId(id),
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if new email is unique (if changing email)
    if (email && email !== existingUser.email) {
      const emailExists = await db.collection('users').findOne({
        email,
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    // Update user
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Fetch updated user
    const updatedUserRaw = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          updatedAt: 1,
        },
      }
    );

    const updatedUser = {
      id: updatedUserRaw!._id.toString(),
      name: updatedUserRaw!.name,
      email: updatedUserRaw!.email,
      role: updatedUserRaw!.role,
      updatedAt: updatedUserRaw!.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.collection('users').findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await db.collection('users').deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
