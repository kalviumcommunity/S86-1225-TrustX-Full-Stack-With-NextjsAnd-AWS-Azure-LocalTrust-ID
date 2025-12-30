/**
 * RBAC (Role-Based Access Control) Utilities
 * 
 * Server-side utilities for enforcing role-based permissions in API routes.
 * Includes logging and audit trail functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import { sendError } from './responseHandler';
import {
  type Role,
  type Permission,
  hasPermission,
  hasResourcePermission,
  isRoleAtLeast,
} from '@/config/roles';

export interface RBACContext {
  userId: number;
  email: string;
  role: Role;
  ip?: string;
  userAgent?: string;
}

/**
 * Extract user context from request (token verification)
 */
export function getUserContext(req: NextRequest): RBACContext | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.id,
    email: payload.email,
    role: payload.role as Role,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}

/**
 * RBAC Decision Log Entry
 */
interface RBACLogEntry {
  timestamp: string;
  action: string;
  resource: string;
  userId: number;
  email: string;
  role: Role;
  permission: Permission | string;
  decision: 'ALLOWED' | 'DENIED';
  reason?: string;
  ip?: string;
}

/**
 * Log RBAC decision for audit trail
 */
export function logRBACDecision(
  context: RBACContext,
  action: string,
  resource: string,
  permission: Permission | string,
  decision: 'ALLOWED' | 'DENIED',
  reason?: string
): void {
  const logEntry: RBACLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    userId: context.userId,
    email: context.email,
    role: context.role,
    permission,
    decision,
    reason,
    ip: context.ip,
  };

  // Log to console (in production, send to logging service like Datadog, CloudWatch, etc.)
  const emoji = decision === 'ALLOWED' ? '✅' : '🚫';
  console.log(
    `${emoji} [RBAC] ${logEntry.role} (${logEntry.email}) attempted to '${logEntry.permission}' on ${logEntry.resource}: ${logEntry.decision}`,
    reason ? `- ${reason}` : ''
  );

  // TODO: In production, send to logging service
  // await sendToLoggingService(logEntry);
}

/**
 * Require authentication and return user context
 * Returns error response if not authenticated
 */
export function requireAuth(req: NextRequest): RBACContext | NextResponse {
  const context = getUserContext(req);

  if (!context) {
    return sendError('Authentication required', 'UNAUTHORIZED', 401);
  }

  return context;
}

/**
 * Require specific permission
 * Returns error response if user doesn't have permission
 */
export function requirePermission(
  req: NextRequest,
  permission: Permission,
  resource: string = 'resource'
): RBACContext | NextResponse {
  const context = getUserContext(req);

  if (!context) {
    return sendError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const allowed = hasPermission(context.role, permission);

  logRBACDecision(
    context,
    'access',
    resource,
    permission,
    allowed ? 'ALLOWED' : 'DENIED',
    allowed ? undefined : `Role '${context.role}' lacks permission '${permission}'`
  );

  if (!allowed) {
    return sendError(
      `Access denied: insufficient permissions (requires '${permission}')`,
      'FORBIDDEN',
      403
    );
  }

  return context;
}

/**
 * Require specific role (or higher)
 * Returns error response if user doesn't have required role level
 */
export function requireRole(
  req: NextRequest,
  requiredRole: Role,
  resource: string = 'resource'
): RBACContext | NextResponse {
  const context = getUserContext(req);

  if (!context) {
    return sendError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const allowed = isRoleAtLeast(context.role, requiredRole);

  logRBACDecision(
    context,
    'access',
    resource,
    `role:${requiredRole}`,
    allowed ? 'ALLOWED' : 'DENIED',
    allowed ? undefined : `Role '${context.role}' is below required '${requiredRole}'`
  );

  if (!allowed) {
    return sendError(
      `Access denied: requires ${requiredRole} role or higher`,
      'FORBIDDEN',
      403
    );
  }

  return context;
}

/**
 * Require resource-specific permission
 * Returns error response if user doesn't have permission for the resource
 */
export function requireResourcePermission(
  req: NextRequest,
  resource: string,
  permission: Permission
): RBACContext | NextResponse {
  const context = getUserContext(req);

  if (!context) {
    return sendError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const allowed = hasResourcePermission(context.role, resource, permission);

  logRBACDecision(
    context,
    'access',
    resource,
    permission,
    allowed ? 'ALLOWED' : 'DENIED',
    allowed
      ? undefined
      : `Role '${context.role}' lacks '${permission}' permission on '${resource}'`
  );

  if (!allowed) {
    return sendError(
      `Access denied: insufficient permissions for '${resource}' (requires '${permission}')`,
      'FORBIDDEN',
      403
    );
  }

  return context;
}

/**
 * Check if user can perform action (returns boolean, doesn't send response)
 * Useful for conditional logic within handlers
 */
export function canPerformAction(
  context: RBACContext,
  permission: Permission,
  resource?: string
): boolean {
  if (resource) {
    return hasResourcePermission(context.role, resource, permission);
  }
  return hasPermission(context.role, permission);
}

/**
 * Middleware helper: Check multiple permissions (ANY match)
 */
export function requireAnyPermission(
  req: NextRequest,
  permissions: Permission[],
  resource: string = 'resource'
): RBACContext | NextResponse {
  const context = getUserContext(req);

  if (!context) {
    return sendError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const allowed = permissions.some((perm) => hasPermission(context.role, perm));

  logRBACDecision(
    context,
    'access',
    resource,
    permissions.join(' OR '),
    allowed ? 'ALLOWED' : 'DENIED',
    allowed ? undefined : `Role '${context.role}' lacks any of: ${permissions.join(', ')}`
  );

  if (!allowed) {
    return sendError(
      `Access denied: requires any of: ${permissions.join(', ')}`,
      'FORBIDDEN',
      403
    );
  }

  return context;
}
