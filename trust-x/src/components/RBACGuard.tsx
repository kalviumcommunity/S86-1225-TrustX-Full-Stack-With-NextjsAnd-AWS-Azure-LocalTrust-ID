/**
 * RBAC Guard Component
 * 
 * Conditionally renders children based on role permissions.
 * Useful for protecting UI elements based on user's access level.
 */

'use client';

import { type ReactNode } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { type Role, type Permission } from '@/config/roles';

interface RBACGuardProps {
  children: ReactNode;
  
  // Option 1: Require specific permission
  permission?: Permission;
  
  // Option 2: Require specific role (or higher)
  role?: Role;
  
  // Option 3: Require resource-specific permission
  resource?: string;
  resourcePermission?: Permission;
  
  // Option 4: Check multiple permissions (ANY match)
  anyPermissions?: Permission[];
  
  // Option 5: Check multiple permissions (ALL match)
  allPermissions?: Permission[];
  
  // Fallback content when access is denied
  fallback?: ReactNode;
  
  // Inverse the condition (show when NOT matching)
  inverse?: boolean;
}

/**
 * RBAC Guard Component
 * 
 * @example
 * // Show delete button only for users with 'delete' permission
 * <RBACGuard permission="delete">
 *   <button>Delete</button>
 * </RBACGuard>
 * 
 * @example
 * // Show admin panel only for admins
 * <RBACGuard role="ADMIN">
 *   <AdminPanel />
 * </RBACGuard>
 * 
 * @example
 * // Show edit button only for users who can update projects
 * <RBACGuard resource="projects" resourcePermission="update">
 *   <button>Edit Project</button>
 * </RBACGuard>
 * 
 * @example
 * // Show content if user has ANY of these permissions
 * <RBACGuard anyPermissions={['create', 'update']}>
 *   <CreateOrEditForm />
 * </RBACGuard>
 */
export function RBACGuard({
  children,
  permission,
  role,
  resource,
  resourcePermission,
  anyPermissions,
  allPermissions,
  fallback = null,
  inverse = false,
}: RBACGuardProps) {
  const rbac = useRBAC();

  let allowed = false;

  // Check permission
  if (permission) {
    allowed = rbac.hasPermission(permission);
  }
  // Check role
  else if (role) {
    allowed = rbac.isRoleAtLeast(role);
  }
  // Check resource permission
  else if (resource && resourcePermission) {
    allowed = rbac.hasResourcePermission(resource, resourcePermission);
  }
  // Check any permissions (OR logic)
  else if (anyPermissions) {
    allowed = anyPermissions.some((perm) => rbac.hasPermission(perm));
  }
  // Check all permissions (AND logic)
  else if (allPermissions) {
    allowed = allPermissions.every((perm) => rbac.hasPermission(perm));
  }
  // No conditions specified - show content
  else {
    allowed = true;
  }

  // Inverse the condition if requested
  if (inverse) {
    allowed = !allowed;
  }

  return <>{allowed ? children : fallback}</>;
}

/**
 * Convenience components for common use cases
 */

export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard role="ADMIN" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

export function EditorOrAbove({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard role="EDITOR" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

export function CanDelete({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="delete" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

export function CanCreate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="create" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}

export function CanUpdate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RBACGuard permission="update" fallback={fallback}>
      {children}
    </RBACGuard>
  );
}
