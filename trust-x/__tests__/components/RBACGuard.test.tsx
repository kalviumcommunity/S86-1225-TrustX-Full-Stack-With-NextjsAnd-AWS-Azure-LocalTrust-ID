/**
 * RBACGuard Component Unit Tests
 * 
 * Tests for the role-based access control guard component
 */

import { render, screen } from '@testing-library/react';
import { RBACGuard } from '../../src/components/RBACGuard';
import { useRBAC } from '../../src/hooks/useRBAC';

// Mock the useRBAC hook
jest.mock('../../src/hooks/useRBAC');
const mockUseRBAC = useRBAC as jest.MockedFunction<typeof useRBAC>;

describe('RBACGuard Component', () => {
  const mockRBAC = {
    hasPermission: jest.fn(),
    isRoleAtLeast: jest.fn(),
    hasResourcePermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    hasAllPermissions: jest.fn(),
    role: 'USER' as const,
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    isAdmin: false,
    isEditor: false,
    isUser: true,
    isViewer: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRBAC.mockReturnValue(mockRBAC as any);
  });

  describe('Permission-based rendering', () => {
    it('should render children when user has permission', () => {
      mockRBAC.hasPermission.mockReturnValue(true);

      render(
        <RBACGuard permission="delete">
          <button>Delete Button</button>
        </RBACGuard>
      );

      expect(screen.getByText('Delete Button')).toBeInTheDocument();
      expect(mockRBAC.hasPermission).toHaveBeenCalledWith('delete');
    });

    it('should not render children when user lacks permission', () => {
      mockRBAC.hasPermission.mockReturnValue(false);

      render(
        <RBACGuard permission="delete">
          <button>Delete Button</button>
        </RBACGuard>
      );

      expect(screen.queryByText('Delete Button')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      mockRBAC.hasPermission.mockReturnValue(false);

      render(
        <RBACGuard 
          permission="delete"
          fallback={<p>Access Denied</p>}
        >
          <button>Delete Button</button>
        </RBACGuard>
      );

      expect(screen.queryByText('Delete Button')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Role-based rendering', () => {
    it('should render children when user has required role', () => {
      mockRBAC.isRoleAtLeast.mockReturnValue(true);

      render(
        <RBACGuard role="ADMIN">
          <div>Admin Panel</div>
        </RBACGuard>
      );

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(mockRBAC.isRoleAtLeast).toHaveBeenCalledWith('ADMIN');
    });

    it('should not render children when user lacks role', () => {
      mockRBAC.isRoleAtLeast.mockReturnValue(false);

      render(
        <RBACGuard role="ADMIN">
          <div>Admin Panel</div>
        </RBACGuard>
      );

      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });
  });

  describe('Resource-based rendering', () => {
    it('should render children when user has resource permission', () => {
      mockRBAC.hasResourcePermission.mockReturnValue(true);

      render(
        <RBACGuard resource="projects" resourcePermission="update">
          <button>Edit Project</button>
        </RBACGuard>
      );

      expect(screen.getByText('Edit Project')).toBeInTheDocument();
      expect(mockRBAC.hasResourcePermission).toHaveBeenCalledWith('projects', 'update');
    });

    it('should not render children when user lacks resource permission', () => {
      mockRBAC.hasResourcePermission.mockReturnValue(false);

      render(
        <RBACGuard resource="projects" resourcePermission="update">
          <button>Edit Project</button>
        </RBACGuard>
      );

      expect(screen.queryByText('Edit Project')).not.toBeInTheDocument();
    });
  });

  describe('Multiple permissions (ANY)', () => {
    it('should render when user has any of the permissions', () => {
      mockRBAC.hasAnyPermission.mockReturnValue(true);

      render(
        <RBACGuard anyPermissions={['create', 'update']}>
          <button>Create or Edit</button>
        </RBACGuard>
      );

      expect(screen.getByText('Create or Edit')).toBeInTheDocument();
      expect(mockRBAC.hasAnyPermission).toHaveBeenCalledWith(['create', 'update']);
    });

    it('should not render when user has none of the permissions', () => {
      mockRBAC.hasAnyPermission.mockReturnValue(false);

      render(
        <RBACGuard anyPermissions={['create', 'update']}>
          <button>Create or Edit</button>
        </RBACGuard>
      );

      expect(screen.queryByText('Create or Edit')).not.toBeInTheDocument();
    });
  });

  describe('Multiple permissions (ALL)', () => {
    it('should render when user has all permissions', () => {
      mockRBAC.hasAllPermissions.mockReturnValue(true);

      render(
        <RBACGuard allPermissions={['read', 'write']}>
          <button>Full Access</button>
        </RBACGuard>
      );

      expect(screen.getByText('Full Access')).toBeInTheDocument();
      expect(mockRBAC.hasAllPermissions).toHaveBeenCalledWith(['read', 'write']);
    });

    it('should not render when user lacks any permission', () => {
      mockRBAC.hasAllPermissions.mockReturnValue(false);

      render(
        <RBACGuard allPermissions={['read', 'write']}>
          <button>Full Access</button>
        </RBACGuard>
      );

      expect(screen.queryByText('Full Access')).not.toBeInTheDocument();
    });
  });

  describe('Inverse mode', () => {
    it('should render children when condition is false in inverse mode', () => {
      mockRBAC.hasPermission.mockReturnValue(false);

      render(
        <RBACGuard permission="delete" inverse>
          <p>Cannot Delete</p>
        </RBACGuard>
      );

      expect(screen.getByText('Cannot Delete')).toBeInTheDocument();
    });

    it('should not render children when condition is true in inverse mode', () => {
      mockRBAC.hasPermission.mockReturnValue(true);

      render(
        <RBACGuard permission="delete" inverse>
          <p>Cannot Delete</p>
        </RBACGuard>
      );

      expect(screen.queryByText('Cannot Delete')).not.toBeInTheDocument();
    });
  });

  describe('Null fallback', () => {
    it('should render nothing when permission denied and no fallback', () => {
      mockRBAC.hasPermission.mockReturnValue(false);

      const { container } = render(
        <RBACGuard permission="delete">
          <button>Delete Button</button>
        </RBACGuard>
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
