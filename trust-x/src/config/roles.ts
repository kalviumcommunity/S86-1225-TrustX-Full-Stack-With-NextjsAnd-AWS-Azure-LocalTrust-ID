/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Defines role hierarchy and associated permissions for the application.
 * Permissions are action-based and resource-based for fine-grained control.
 */

// Permission types
export type Permission = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete'
  | 'manage_users'
  | 'manage_projects'
  | 'manage_orders'
  | 'view_analytics'
  | 'manage_settings'
  | 'upload_files';

// Available roles in the system
export type Role = 'ADMIN' | 'EDITOR' | 'USER' | 'VIEWER';

// Role hierarchy and permissions mapping
export const rolePermissions: Record<Role, Permission[]> = {
  // Admin: Full access to all resources
  ADMIN: [
    'create',
    'read',
    'update',
    'delete',
    'manage_users',
    'manage_projects',
    'manage_orders',
    'view_analytics',
    'manage_settings',
    'upload_files',
  ],
  
  // Editor: Can create, read, and update resources but not delete
  EDITOR: [
    'create',
    'read',
    'update',
    'manage_projects',
    'manage_orders',
    'upload_files',
  ],
  
  // User: Standard user with basic permissions
  USER: [
    'read',
    'update', // Can update own resources only
    'upload_files',
  ],
  
  // Viewer: Read-only access
  VIEWER: [
    'read',
  ],
};

// Resource-based permissions (optional, for more granular control)
export const resourcePermissions: Record<string, Record<Role, Permission[]>> = {
  users: {
    ADMIN: ['create', 'read', 'update', 'delete', 'manage_users'],
    EDITOR: ['read'],
    USER: ['read'],
    VIEWER: ['read'],
  },
  
  projects: {
    ADMIN: ['create', 'read', 'update', 'delete', 'manage_projects'],
    EDITOR: ['create', 'read', 'update', 'manage_projects'],
    USER: ['read', 'update'],
    VIEWER: ['read'],
  },
  
  orders: {
    ADMIN: ['create', 'read', 'update', 'delete', 'manage_orders'],
    EDITOR: ['create', 'read', 'update', 'manage_orders'],
    USER: ['create', 'read', 'update'],
    VIEWER: ['read'],
  },
  
  files: {
    ADMIN: ['create', 'read', 'update', 'delete', 'upload_files'],
    EDITOR: ['create', 'read', 'update', 'upload_files'],
    USER: ['create', 'read', 'upload_files'],
    VIEWER: ['read'],
  },
  
  settings: {
    ADMIN: ['read', 'update', 'manage_settings'],
    EDITOR: [],
    USER: [],
    VIEWER: [],
  },
};

// Role hierarchy (for checking if role is at least a certain level)
export const roleHierarchy: Record<Role, number> = {
  VIEWER: 1,
  USER: 2,
  EDITOR: 3,
  ADMIN: 4,
};

/**
 * Check if a role has at least the same level as another role
 * Example: isRoleAtLeast('ADMIN', 'EDITOR') returns true
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Get resource-specific permissions for a role
 */
export function getResourcePermissions(role: Role, resource: string): Permission[] {
  return resourcePermissions[resource]?.[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Check if a role has a specific permission for a resource
 */
export function hasResourcePermission(
  role: Role,
  resource: string,
  permission: Permission
): boolean {
  const permissions = getResourcePermissions(role, resource);
  return permissions.includes(permission);
}
