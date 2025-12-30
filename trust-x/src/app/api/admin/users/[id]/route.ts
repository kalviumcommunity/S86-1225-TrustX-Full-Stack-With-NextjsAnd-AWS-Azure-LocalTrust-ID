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
  { params }: { params: { id: string } }
) {
  // Require ADMIN role
  const context = requireRole(req, 'ADMIN', 'users');
  
  // If context is a Response, user doesn't have permission
  if (context instanceof Response) {
    return context;
  }

  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return sendError('Invalid user ID', 400, 'VALIDATION_ERROR');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError('User not found', 404, 'NOT_FOUND');
    }

    // Prevent self-deletion
    if (user.id === context.userId) {
      return sendError('Cannot delete your own account', 400, 'INVALID_OPERATION');
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
    return sendError('Failed to delete user', 500, 'INTERNAL_ERROR');
  }
}
