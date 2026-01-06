/**
 * Integration Test Environment Setup
 * 
 * Sets up test database, mocks external services,
 * and configures test utilities for API testing.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
// Use the same database as development for integration tests
// process.env.DATABASE_URL is already set from .env file
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-integration-tests';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh-token-secret-key';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';

// Mock external API calls
global.fetch = jest.fn();

// Mock SendGrid email service
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

// Mock AWS S3
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

// Mock Azure Blob Storage
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn(() => ({
      getContainerClient: jest.fn(() => ({
        getBlockBlobClient: jest.fn(() => ({
          upload: jest.fn(),
          download: jest.fn(),
        })),
      })),
    })),
  },
}));

// Suppress console logs during tests (except errors)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Helper to create mock request/response
global.mockRequest = (options = {}) => {
  return {
    method: options.method || 'GET',
    url: options.url || '/api/test',
    headers: new Headers(options.headers || {}),
    cookies: new Map(Object.entries(options.cookies || {})),
    json: jest.fn().mockResolvedValue(options.body || {}),
    ...options,
  };
};

global.mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headers: new Headers(),
    setHeader: jest.fn(),
  };
  return res;
};

// Helper to create Next.js compatible request with nextUrl
global.createNextRequest = (url, options = {}) => {
  const request = new Request(url, options);
  const urlObj = new URL(url);
  
  // Add nextUrl property
  Object.defineProperty(request, 'nextUrl', {
    value: {
      pathname: urlObj.pathname,
      search: urlObj.search,
      searchParams: urlObj.searchParams,
      href: urlObj.href,
    },
    writable: false,
  });
  
  return request;
};

console.log('✅ Integration test environment configured');
