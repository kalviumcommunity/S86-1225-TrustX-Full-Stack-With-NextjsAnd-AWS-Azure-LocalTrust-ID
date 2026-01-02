/**
 * Example: Admin-only API route with RBAC
 * DELETE /api/admin/users/[id]
 */

import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require ADMIN role
  const context = requireRole(req, 'ADMIN', 'users');
  
  // If context is a Response, user doesn't have permission
  if (context instanceof Response) {
    return context;
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return sendError('Invalid user ID', 'VALIDATION_ERROR', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError('User not found', 'NOT_FOUND', 404);
    }

    // Prevent self-deletion
    if (user.id === context.userId) {
      return sendError('Cannot delete your own account', 'INVALID_OPERATION', 400);
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return sendSuccess(
      { id: userId },
      'User deleted successfully',
      200
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return sendError('Failed to delete user', 'INTERNAL_ERROR', 500);
  }
}
