'use client';

import { useState } from 'react';
import { login, logout, authFetch, getAccessToken } from '@/lib/authClient';
import toast from 'react-hot-toast';

export default function TestJWTPage() {
  const [email, setEmail] = useState('admin@trustx.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(email, password);
      setResult(data);
      if (data.success) {
        toast.success('Login successful!');
        updateTokenInfo();
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error: unknown) {
      toast.error('Network error');
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setResult(null);
      setTokenInfo(null);
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const testProtectedRoute = async () => {
    setLoading(true);
    try {
      const response = await authFetch.get('/api/users');
      const data = await response.json();
      setResult(data);
      if (data.success) {
        toast.success('Protected route accessed successfully!');
      } else {
        toast.error('Failed to access protected route');
      }
    } catch (error: unknown) {
      toast.error('Request failed');
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testTokenRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        toast.success('Token refreshed successfully!');
        updateTokenInfo();
      } else {
        toast.error('Token refresh failed');
      }
    } catch (error: unknown) {
      toast.error('Refresh request failed');
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const updateTokenInfo = () => {
    const token = getAccessToken();
    setTokenInfo(token);
  };

  const decodeToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = new Date(payload.exp * 1000);
      const timeLeft = Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
      return {
        ...payload,
        expiryDate: expiry.toLocaleString(),
        timeLeft: `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`,
      };
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
          JWT & Session Management Testing
        </h1>

        {/* Login Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            1. Login
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
        </div>

        {/* Token Info Section */}
        {tokenInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Current Access Token
            </h2>
            <div className="space-y-3">
              <div className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-900 p-3 rounded">
                {tokenInfo}
              </div>
              {decodeToken(tokenInfo) && (
                <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <p><strong>User ID:</strong> {decodeToken(tokenInfo)?.id}</p>
                  <p><strong>Email:</strong> {decodeToken(tokenInfo)?.email}</p>
                  <p><strong>Role:</strong> {decodeToken(tokenInfo)?.role}</p>
                  <p><strong>Expires:</strong> {decodeToken(tokenInfo)?.expiryDate}</p>
                  <p><strong>Time Left:</strong> {decodeToken(tokenInfo)?.timeLeft}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            2. Test Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={testProtectedRoute}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-accent-cyan to-accent-teal text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              Test Protected Route
              <span className="block text-xs mt-1 opacity-80">GET /api/users</span>
            </button>
            
            <button
              onClick={testTokenRefresh}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-accent-orange to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              Refresh Token
              <span className="block text-xs mt-1 opacity-80">POST /api/auth/refresh</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Logout
              <span className="block text-xs mt-1 opacity-80">Clear cookies</span>
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Response
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Click &ldquo;Login&rdquo; to authenticate (tokens stored in HTTP-only cookies + memory)</li>
            <li>Click &ldquo;Test Protected Route&rdquo; to verify access token works</li>
            <li>Wait 15 minutes OR manually expire token in DevTools</li>
            <li>Click &ldquo;Test Protected Route&rdquo; again - should auto-refresh token</li>
            <li>Click &ldquo;Refresh Token&rdquo; to manually refresh access token</li>
            <li>Click &ldquo;Logout&rdquo; to clear all tokens</li>
          </ol>
          
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-purple-300 dark:border-purple-600">
            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Security Features</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>✅ Access tokens expire in 15 minutes</li>
              <li>✅ Refresh tokens expire in 7 days</li>
              <li>✅ Tokens stored in HTTP-only cookies (XSS protection)</li>
              <li>✅ SameSite: strict flag (CSRF protection)</li>
              <li>✅ Automatic token refresh on 401 errors</li>
              <li>✅ In-memory token storage on client</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
