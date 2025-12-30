/**
 * Client-side utility for handling authenticated requests with automatic token refresh
 * Implements the refresh flow when access token expires
 */

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

/**
 * Set access token in memory
 */
export function setAccessToken(token: string) {
  accessToken = token;
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clear access token (on logout)
 */
export function clearAccessToken() {
  accessToken = null;
}

/**
 * Refresh access token using refresh token stored in HTTP-only cookie
 * Returns new access token
 */
async function refreshAccessToken(): Promise<string> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include HTTP-only cookies
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }

      throw new Error('No access token in response');
    } catch (error) {
      // Refresh failed - clear token and redirect to login
      clearAccessToken();
      window.location.href = '/login?expired=true';
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch with automatic token refresh on 401
 * Usage: const data = await fetchWithAuth('/api/users')
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Add access token to headers if available
  const headers = new Headers(options.headers);
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });

  // If 401 Unauthorized, try to refresh token and retry
  if (response.status === 401 && !url.includes('/auth/')) {
    try {
      const newToken = await refreshAccessToken();
      
      // Retry request with new token
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const authFetch = {
  get: (url: string, options?: RequestInit) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: unknown, options?: RequestInit) => 
    fetchWithAuth(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (url: string, data?: unknown, options?: RequestInit) => 
    fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (url: string, options?: RequestInit) => 
    fetchWithAuth(url, { ...options, method: 'DELETE' }),
};

/**
 * Login helper
 */
export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Include cookies
  });

  const data = await response.json();

  if (data.success && data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

/**
 * Logout helper
 */
export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  clearAccessToken();
  window.location.href = '/login';
}
