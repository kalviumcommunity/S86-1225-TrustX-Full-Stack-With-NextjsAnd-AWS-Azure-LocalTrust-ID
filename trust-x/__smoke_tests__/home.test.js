/**
 * Smoke Test: Homepage
 * 
 * Quick validation that the homepage is accessible and renders correctly
 * after deployment. These tests run in production to verify basic functionality.
 */

describe('Smoke Test: Homepage', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  it('should load the homepage with 200 status', async () => {
    const response = await fetch(BASE_URL);
    expect(response.status).toBe(200);
  });

  it('should return HTML content', async () => {
    const response = await fetch(BASE_URL);
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/html');
  });

  it('should contain expected page title or content', async () => {
    const response = await fetch(BASE_URL);
    const html = await response.text();
    
    // Check for basic HTML structure
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should load within acceptable time (< 3s)', async () => {
    const startTime = Date.now();
    await fetch(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  }, 5000);
});
