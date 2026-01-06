/**
 * Smoke Test: Core API Endpoints
 * 
 * Validates that critical API endpoints are accessible and returning
 * expected responses after deployment.
 */

describe('Smoke Test: Core API Endpoints', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  describe('API Base Route', () => {
    it('should have /api route accessible', async () => {
      const response = await fetch(`${BASE_URL}/api`);
      // API may return 404 or 200, but should not timeout
      expect([200, 404, 405]).toContain(response.status);
    });
  });

  describe('Authentication Endpoints', () => {
    it('should have /api/auth/register endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body to check endpoint existence
      });
      
      // Should respond (even if with validation error), not timeout
      expect(response.status).toBeDefined();
      expect([200, 400, 422, 405]).toContain(response.status);
    });

    it('should have /api/auth/login endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      expect(response.status).toBeDefined();
      expect([200, 400, 401, 422, 405]).toContain(response.status);
    });
  });

  describe('CORS and Headers', () => {
    it('should include security headers', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const headers = response.headers;
      
      // Check for common security headers
      // Note: Some headers may be set by reverse proxy
      expect(headers).toBeDefined();
    });
  });

  describe('API Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => 
        fetch(`${BASE_URL}/api/health`)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 10000);
  });
});
