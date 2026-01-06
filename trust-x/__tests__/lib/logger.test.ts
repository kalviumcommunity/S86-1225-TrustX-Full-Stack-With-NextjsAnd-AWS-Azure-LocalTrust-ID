/**
 * Logger Unit Tests
 * 
 * Tests for the structured logging utility
 */

import { logger } from '../../src/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
  });

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const requestId1 = logger.generateRequestId();
      const requestId2 = logger.generateRequestId();

      expect(requestId1).toBeTruthy();
      expect(requestId2).toBeTruthy();
      expect(requestId1).not.toBe(requestId2);
      expect(requestId1).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate request IDs with timestamp prefix', () => {
      const requestId = logger.generateRequestId();
      const timestamp = requestId.split('-')[0];
      const now = Date.now();

      expect(parseInt(timestamp)).toBeLessThanOrEqual(now);
      expect(parseInt(timestamp)).toBeGreaterThan(now - 1000);
    });
  });

  describe('info', () => {
    it('should log info level messages', () => {
      logger.info('Test message', { userId: '123' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('info');
      expect(logCall.message).toBe('Test message');
      expect(logCall.context.userId).toBe('123');
    });

    it('should include timestamp in ISO format', () => {
      logger.info('Test message');

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('error', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { userId: '123' }, error);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('error');
      expect(logCall.message).toBe('Error occurred');
      expect(logCall.error.message).toBe('Test error');
      expect(logCall.error.stack).toBeTruthy();
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'Simple error' };
      logger.error('Error occurred', {}, error as Error);

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.error.message).toBe('Simple error');
      expect(logCall.error.stack).toBeUndefined();
    });
  });

  describe('warn', () => {
    it('should log warning level messages', () => {
      logger.warn('Warning message', { component: 'test' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('warn');
      expect(logCall.message).toBe('Warning message');
      expect(logCall.context.component).toBe('test');
    });
  });

  describe('debug', () => {
    it('should log debug level messages', () => {
      logger.debug('Debug message', { data: 'test-data' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('debug');
      expect(logCall.message).toBe('Debug message');
      expect(logCall.context.data).toBe('test-data');
    });
  });

  describe('logAuth', () => {
    it('should log authentication success', () => {
      logger.logAuth('login', 'success', 'user-123', 'auth-request-id');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('info');
      expect(logCall.message).toContain('Authentication');
      expect(logCall.context.event).toBe('login_success');
      expect(logCall.context.userId).toBe('user-123');
      expect(logCall.requestId).toBe('auth-request-id');
    });

    it('should log authentication failure', () => {
      logger.logAuth('login', 'failed', undefined, 'auth-request-id', 'Invalid credentials');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('warn');
      expect(logCall.message).toContain('Authentication');
      expect(logCall.context.event).toBe('login_failed');
      expect(logCall.context.reason).toBe('Invalid credentials');
    });
  });

  describe('logRequest', () => {
    it('should log API request start', () => {
      logger.logRequest('GET', '/api/users', 'req-123');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('info');
      expect(logCall.message).toContain('API Request');
      expect(logCall.context.method).toBe('GET');
      expect(logCall.context.endpoint).toBe('/api/users');
      expect(logCall.requestId).toBe('req-123');
    });
  });

  describe('logResponse', () => {
    it('should log API response with metrics', () => {
      logger.logResponse('GET', '/api/users', 200, 150, 'req-123');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('info');
      expect(logCall.message).toContain('API Response');
      expect(logCall.performance.method).toBe('GET');
      expect(logCall.performance.endpoint).toBe('/api/users');
      expect(logCall.performance.duration).toBe(150);
      expect(logCall.context.statusCode).toBe(200);
    });

    it('should log errors for non-2xx status codes', () => {
      logger.logResponse('POST', '/api/login', 401, 50, 'req-123');

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.level).toBe('error');
    });
  });

  describe('logDatabase', () => {
    it('should log database operations', () => {
      logger.logDatabase('findMany', 'User', 75, 'req-123');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('info');
      expect(logCall.message).toContain('Database');
      expect(logCall.context.operation).toBe('findMany');
      expect(logCall.context.model).toBe('User');
      expect(logCall.context.duration).toBe(75);
    });
  });

  describe('logCache', () => {
    it('should log cache hit', () => {
      logger.logCache('hit', 'users:list', 'req-123');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('info');
      expect(logCall.message).toContain('Cache hit');
      expect(logCall.context.cacheKey).toBe('users:list');
    });

    it('should log cache miss', () => {
      logger.logCache('miss', 'users:list', 'req-123');

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logCall.message).toContain('Cache miss');
    });
  });

  describe('logSecurity', () => {
    it('should log security events', () => {
      logger.logSecurity('rate_limit_exceeded', '192.168.1.1', { attempts: 5 });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logCall.level).toBe('warn');
      expect(logCall.message).toContain('Security');
      expect(logCall.context.event).toBe('rate_limit_exceeded');
      expect(logCall.context.ip).toBe('192.168.1.1');
      expect(logCall.context.attempts).toBe(5);
    });
  });
});
