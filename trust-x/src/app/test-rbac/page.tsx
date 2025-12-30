'use client';

import { useState } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { RBACGuard, AdminOnly, EditorOrAbove, CanDelete } from '@/components/RBACGuard';
import { authFetch, login, logout } from '@/lib/authClient';
import toast from 'react-hot-toast';
import { rolePermissions, type Role } from '@/config/roles';

export default function TestRBACPage() {
  const rbac = useRBAC();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testLogin = async (role: Role) => {
    const credentials: Record<Role, { email: string; password: string }> = {
      ADMIN: { email: 'admin@trustx.com', password: 'admin123' },
      EDITOR: { email: 'editor@trustx.com', password: 'editor123' },
      USER: { email: 'user@trustx.com', password: 'user123' },
      VIEWER: { email: 'viewer@trustx.com', password: 'viewer123' },
    };

    setLoading(true);
    try {
      const data = await login(credentials[role].email, credentials[role].password);
      if (data.success) {
        toast.success(`Logged in as ${role}`);
        addLog(`✅ LOGIN as ${role}: SUCCESS`);
        window.location.reload(); // Refresh to update RBAC state
      } else {
        toast.error(data.message || 'Login failed');
        addLog(`🚫 LOGIN as ${role}: FAILED - ${data.message}`);
      }
    } catch {
      toast.error('Login failed');
      addLog(`🚫 LOGIN as ${role}: ERROR`);
    } finally {
      setLoading(false);
    }
  };

  const testGetUsers = async () => {
    setLoading(true);
    setTestResult('');
    try {
      const response = await authFetch.get('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setTestResult(`✅ GET /api/users: SUCCESS - Fetched ${data.data?.length || 0} users`);
        addLog(`✅ GET /api/users: ALLOWED`);
        toast.success('Users fetched successfully');
      } else {
        setTestResult(`🚫 GET /api/users: DENIED - ${data.message}`);
        addLog(`🚫 GET /api/users: DENIED - ${data.message}`);
        toast.error(data.message);
      }
    } catch {
      setTestResult(`❌ GET /api/users: ERROR`);
      addLog(`❌ GET /api/users: ERROR`);
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  const testGetProjects = async () => {
    setLoading(true);
    setTestResult('');
    try {
      const response = await authFetch.get('/api/projects');
      const data = await response.json();
      
      if (data.success) {
        setTestResult(`✅ GET /api/projects: SUCCESS - Fetched ${data.data?.length || 0} projects`);
        addLog(`✅ GET /api/projects: ALLOWED`);
        toast.success('Projects fetched successfully');
      } else {
        setTestResult(`🚫 GET /api/projects: DENIED - ${data.message}`);
        addLog(`🚫 GET /api/projects: DENIED - ${data.message}`);
        toast.error(data.message);
      }
    } catch {
      setTestResult(`❌ GET /api/projects: ERROR`);
      addLog(`❌ GET /api/projects: ERROR`);
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  const testCreateProject = async () => {
    setLoading(true);
    setTestResult('');
    try {
      const response = await authFetch.post('/api/projects', {
        title: `Test Project ${Date.now()}`,
      });
      const data = await response.json();
      
      if (data.success) {
        setTestResult(`✅ POST /api/projects: SUCCESS - Created project ID ${data.data?.id}`);
        addLog(`✅ POST /api/projects: ALLOWED`);
        toast.success('Project created successfully');
      } else {
        setTestResult(`🚫 POST /api/projects: DENIED - ${data.message}`);
        addLog(`🚫 POST /api/projects: DENIED - ${data.message}`);
        toast.error(data.message);
      }
    } catch {
      setTestResult(`❌ POST /api/projects: ERROR`);
      addLog(`❌ POST /api/projects: ERROR`);
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  const testDeleteUser = async () => {
    setLoading(true);
    setTestResult('');
    try {
      const response = await authFetch.delete('/api/admin/users/999');
      const data = await response.json();
      
      if (data.success) {
        setTestResult(`✅ DELETE /api/admin/users/999: SUCCESS`);
        addLog(`✅ DELETE /api/admin/users/999: ALLOWED`);
        toast.success('User deleted successfully');
      } else {
        setTestResult(`🚫 DELETE /api/admin/users/999: DENIED - ${data.message}`);
        addLog(`🚫 DELETE /api/admin/users/999: DENIED - ${data.message}`);
        toast.error(data.message);
      }
    } catch {
      setTestResult(`❌ DELETE /api/admin/users/999: ERROR`);
      addLog(`❌ DELETE /api/admin/users/999: ERROR`);
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          RBAC (Role-Based Access Control) Testing
        </h1>

        {/* Current User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-accent-purple">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Current User
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p><strong>Role:</strong> {rbac.role || 'Not logged in'}</p>
            <p><strong>Is Admin:</strong> {rbac.isAdmin ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Editor or above:</strong> {rbac.isEditor ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Can Create:</strong> {rbac.canCreate ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Can Update:</strong> {rbac.canUpdate ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Can Delete:</strong> {rbac.canDelete ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Login as Different Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            1. Login as Different Roles
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => testLogin('ADMIN')}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              Login as Admin
            </button>
            <button
              onClick={() => testLogin('EDITOR')}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              Login as Editor
            </button>
            <button
              onClick={() => testLogin('USER')}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              Login as User
            </button>
            <button
              onClick={() => testLogin('VIEWER')}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              Login as Viewer
            </button>
          </div>
          <button
            onClick={() => logout()}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            Logout
          </button>
        </div>

        {/* Test API Endpoints */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            2. Test API Endpoints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testGetUsers}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-accent-cyan to-accent-teal text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              GET /api/users
              <span className="block text-xs mt-1 opacity-80">Requires: read permission</span>
            </button>
            
            <button
              onClick={testGetProjects}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-accent-cyan to-accent-teal text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              GET /api/projects
              <span className="block text-xs mt-1 opacity-80">Requires: read permission</span>
            </button>
            
            <button
              onClick={testCreateProject}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              POST /api/projects
              <span className="block text-xs mt-1 opacity-80">Requires: create permission</span>
            </button>
            
            <button
              onClick={testDeleteUser}
              disabled={loading}
              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              DELETE /api/admin/users/999
              <span className="block text-xs mt-1 opacity-80">Requires: ADMIN role</span>
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <p className="font-mono text-sm">{testResult}</p>
            </div>
          )}
        </div>

        {/* UI Component Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            3. UI Component Access Control
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">All Users See This</h3>
              <p className="text-gray-600 dark:text-gray-400">This content is visible to everyone.</p>
            </div>

            <RBACGuard permission="read">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">✅ Read Permission</h3>
                <p className="text-gray-600 dark:text-gray-400">Visible to users with &apos;read&apos; permission.</p>
              </div>
            </RBACGuard>

            <RBACGuard permission="create">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-accent-purple">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">✅ Create Permission</h3>
                <p className="text-gray-600 dark:text-gray-400">Visible to users with &apos;create&apos; permission (Editor, Admin).</p>
              </div>
            </RBACGuard>

            <EditorOrAbove>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-accent-orange">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">✅ Editor or Above</h3>
                <p className="text-gray-600 dark:text-gray-400">Visible to Editor and Admin roles.</p>
              </div>
            </EditorOrAbove>

            <CanDelete>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">✅ Delete Permission</h3>
                <p className="text-gray-600 dark:text-gray-400">Visible only to users with &apos;delete&apos; permission (Admin only).</p>
              </div>
            </CanDelete>

            <AdminOnly>
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border-2 border-red-600">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">✅ Admin Only</h3>
                <p className="text-gray-600 dark:text-gray-400">This is visible ONLY to Admins.</p>
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Admin Action Button
                </button>
              </div>
            </AdminOnly>
          </div>
        </div>

        {/* Role Permissions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            4. Role Permissions Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 font-semibold">Role</th>
                  <th className="px-4 py-2 font-semibold">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <tr key={role} className={rbac.role === role ? 'bg-accent-purple/10' : ''}>
                    <td className="px-4 py-2 font-medium">{role}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-accent-cyan/20 text-accent-cyan rounded text-xs"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            5. Audit Logs
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No logs yet. Test some actions above.</p>
            ) : (
              <div className="space-y-1 font-mono text-xs text-green-400">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            Clear Logs
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Login as different roles (Admin, Editor, User, Viewer)</li>
            <li>Test API endpoints and observe which succeed/fail</li>
            <li>Scroll down to see UI components that appear/hide based on permissions</li>
            <li>Check audit logs for ALLOWED/DENIED decisions</li>
            <li>View server console for detailed RBAC logging</li>
          </ol>
          
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-purple-300 dark:border-purple-600">
            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Expected Results</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li><strong>ADMIN:</strong> Full access to all endpoints and UI elements</li>
              <li><strong>EDITOR:</strong> Can read, create, update (but not delete)</li>
              <li><strong>USER:</strong> Can read and update own resources</li>
              <li><strong>VIEWER:</strong> Read-only access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
