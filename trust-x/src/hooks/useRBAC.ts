/**
 * Client-side RBAC Hook
 * 
 * React hook for checking permissions in client components.
 * Uses JWT token payload to determine user's role and permissions.
 */

'use client';

import { useState } from 'react';
import { getAccessToken } from '@/lib/authClient';
import {
  type Role,
  type Permission,
  hasPermission,
  hasResourcePermission,
  isRoleAtLeast,
} from '@/config/roles';

interface UserRBAC {
  role: Role | null;
  hasPermission: (permission: Permission) => boolean;
  hasResourcePermission: (resource: string, permission: Permission) => boolean;
  isRoleAtLeast: (requiredRole: Role) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isUser: boolean;
  isViewer: boolean;
}

/**
 * Decode JWT token to extract role
 */
function decodeToken(token: string): { role: Role } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Hook for role-based access control in client components
 * 
 * @example
 * const { canDelete, isAdmin, hasPermission } = useRBAC();
 * if (canDelete) return <button>Delete</button>;
 * if (hasPermission('manage_users')) return <UserManager />;
 */
export function useRBAC(): UserRBAC {
  const [role] = useState<Role | null>(() => {
    // Initialize role from token on mount
    const token = getAccessToken();
    if (token) {
      const decoded = decodeToken(token);
      return decoded?.role || null;
    }
    return null;
  });

  const checkPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  const checkResourcePermission = (resource: string, permission: Permission): boolean => {
    if (!role) return false;
    return hasResourcePermission(role, resource, permission);
  };

  const checkRoleAtLeast = (requiredRole: Role): boolean => {
    if (!role) return false;
    return isRoleAtLeast(role, requiredRole);
  };

  const hasAnyPermissions = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return permissions.some(permission => hasPermission(role, permission));
  };

  const hasAllPermissionsCheck = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return permissions.every(permission => hasPermission(role, permission));
  };

  return {
    role,
    hasPermission: checkPermission,
    hasResourcePermission: checkResourcePermission,
    isRoleAtLeast: checkRoleAtLeast,
    hasAnyPermission: hasAnyPermissions,
    hasAllPermissions: hasAllPermissionsCheck,
    
    // Convenience properties for common permissions
    canCreate: checkPermission('create'),
    canRead: checkPermission('read'),
    canUpdate: checkPermission('update'),
    canDelete: checkPermission('delete'),
    
    // Convenience properties for role checks
    isAdmin: role === 'ADMIN',
    isEditor: role === 'EDITOR' || role === 'ADMIN',
    isUser: role === 'USER' || role === 'EDITOR' || role === 'ADMIN',
    isViewer: role === 'VIEWER' || role === 'USER' || role === 'EDITOR' || role === 'ADMIN',
  };
}
