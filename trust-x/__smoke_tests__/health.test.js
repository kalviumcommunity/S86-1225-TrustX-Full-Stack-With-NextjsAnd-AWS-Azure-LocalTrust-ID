/**
 * Smoke Test: Health Check API
 * 
 * Validates that the health check endpoint is responding correctly
 * and reporting accurate system status after deployment.
 */

describe('Smoke Test: Health Check API', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const HEALTH_ENDPOINT = `${BASE_URL}/api/health`;

  it('should return 200 status for healthy system', async () => {
    const response = await fetch(HEALTH_ENDPOINT);
    expect(response.status).toBe(200);
  });

  it('should return valid JSON health data', async () => {
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data.status).toBe('healthy');
  });

  it('should report database connectivity', async () => {
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    
    expect(data).toHaveProperty('database');
    expect(data.database).toHaveProperty('status');
    expect(['connected', 'disconnected']).toContain(data.database.status);
  });

  it('should include memory usage metrics', async () => {
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    
    expect(data).toHaveProperty('memory');
    expect(data.memory).toHaveProperty('heapUsed');
    expect(data.memory).toHaveProperty('heapTotal');
  });

  it('should respond within 500ms', async () => {
    const startTime = Date.now();
    await fetch(HEALTH_ENDPOINT);
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(500);
  }, 1000);

  it('should include environment and version info', async () => {
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('version');
    expect(['development', 'production', 'staging']).toContain(data.environment);
  });
});
