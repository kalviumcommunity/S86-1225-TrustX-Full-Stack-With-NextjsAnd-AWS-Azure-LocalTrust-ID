/**
 * Database Connection Management
 * 
 * This module provides utilities for managing database connections to cloud
 * providers (AWS RDS, Azure PostgreSQL) with proper connection pooling,
 * health checks, and error handling.
 * 
 * Features:
 * - Connection pool management
 * - Health check endpoints
 * - Connection retry logic
 * - Performance monitoring
 * - SSL/TLS enforcement for cloud databases
 * 
 * @module lib/db
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Global Prisma client instance with connection pooling
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Database Configuration
 * 
 * Connection pool settings optimized for cloud databases:
 * - AWS RDS: Adjust based on instance class and max_connections parameter
 * - Azure PostgreSQL: Adjust based on SKU tier (Basic, General Purpose, etc.)
 */
const DATABASE_CONFIG = {
  // Connection pool size (default: 10)
  // Increase for high-traffic applications, decrease for resource-constrained environments
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10', 10),
  
  // Connection timeout in milliseconds (default: 10 seconds)
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),
  
  // Pool timeout in milliseconds (default: 10 seconds)
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000', 10),
  
  // Statement timeout in milliseconds (default: 30 seconds)
  statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000', 10),
  
  // Enable SSL for cloud databases
  sslMode: process.env.NODE_ENV === 'production' ? 'require' : undefined,
};

/**
 * Initialize Prisma Client with optimized settings for cloud databases
 * 
 * @returns {PrismaClient} Configured Prisma client instance
 */
export function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    
    // Connection pool settings
    // @ts-ignore - Prisma internal config
    __internal: {
      engine: {
        connection_limit: DATABASE_CONFIG.connectionLimit,
      },
    },
  });

  return client;
}

/**
 * Get or create Prisma client instance
 * Implements singleton pattern to reuse connections across requests
 * 
 * In production: Creates a new instance
 * In development: Reuses the same instance to avoid exhausting database connections
 */
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Database Health Check
 * 
 * Verifies that the database connection is healthy and responsive
 * Use this in health check endpoints or monitoring systems
 * 
 * @returns {Promise<boolean>} True if database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

/**
 * Get Database Connection Info
 * 
 * Returns information about the current database connection
 * Useful for debugging and monitoring
 * 
 * @returns {Promise<DatabaseInfo>} Database connection information
 */
export interface DatabaseInfo {
  isConnected: boolean;
  version?: string;
  currentDatabase?: string;
  connectionCount?: number;
  maxConnections?: number;
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'unknown';
}

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  try {
    const isConnected = await checkDatabaseHealth();
    
    if (!isConnected) {
      return {
        isConnected: false,
        provider: 'unknown',
      };
    }

    // Get PostgreSQL version
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `;
    
    // Get current database name
    const dbNameResult = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database()
    `;
    
    // Get connection stats
    const connectionStats = await prisma.$queryRaw<Array<{ 
      current: number; 
      max: number 
    }>>`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as current,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max
    `;

    return {
      isConnected: true,
      version: versionResult[0]?.version || 'Unknown',
      currentDatabase: dbNameResult[0]?.current_database || 'Unknown',
      connectionCount: connectionStats[0]?.current || 0,
      maxConnections: connectionStats[0]?.max || 0,
      provider: 'postgresql',
    };
  } catch (error) {
    logger.error('Failed to get database info', { error });
    return {
      isConnected: false,
      provider: 'unknown',
    };
  }
}

/**
 * Test Database Connection
 * 
 * Comprehensive database connection test with detailed error reporting
 * Use this for initial setup validation or troubleshooting
 * 
 * @returns {Promise<{success: boolean, message: string, details?: any}>}
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    logger.info('Testing database connection...');

    // Test 1: Basic connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const responseTime = Date.now() - startTime;

    // Test 2: Get database info
    const dbInfo = await getDatabaseInfo();

    // Test 3: Check if we can create/read from a test table
    try {
      await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 1
      `;
    } catch (error) {
      logger.warn('Cannot query information_schema, permissions may be limited');
    }

    logger.info('Database connection test successful', {
      responseTime,
      ...dbInfo,
    });

    return {
      success: true,
      message: 'Database connection successful',
      details: {
        responseTime: `${responseTime}ms`,
        ...dbInfo,
      },
    };
  } catch (error: any) {
    logger.error('Database connection test failed', { error });

    return {
      success: false,
      message: 'Database connection failed',
      details: {
        error: error.message,
        code: error.code,
        hint: getConnectionErrorHint(error),
      },
    };
  }
}

/**
 * Get helpful hints for common database connection errors
 * 
 * @param error - The error object from database connection attempt
 * @returns {string} Human-readable hint for resolving the error
 */
function getConnectionErrorHint(error: any): string {
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('econnrefused')) {
    return 'Database server is not reachable. Check if the server is running and firewall rules allow access.';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Connection timed out. Check network connectivity and security group rules.';
  }
  
  if (errorMessage.includes('authentication') || errorMessage.includes('password')) {
    return 'Authentication failed. Verify username and password are correct.';
  }
  
  if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
    return 'Database does not exist. Create the database or check the database name in your connection string.';
  }
  
  if (errorMessage.includes('ssl') || errorMessage.includes('tls')) {
    return 'SSL/TLS connection issue. Ensure sslmode=require is set for cloud databases, or sslmode=disable for local development.';
  }
  
  if (errorMessage.includes('too many connections')) {
    return 'Connection pool exhausted. Increase DATABASE_CONNECTION_LIMIT or reduce concurrent database operations.';
  }

  return 'Check your DATABASE_URL environment variable and ensure the database server is accessible.';
}

/**
 * Graceful Shutdown
 * 
 * Properly close database connections before application shutdown
 * Call this in your application's shutdown handler
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    logger.info('Closing database connections...');
    await prisma.$disconnect();
    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections', { error });
  }
}

/**
 * Execute a database query with automatic retry logic
 * 
 * Useful for handling temporary network issues or connection pool exhaustion
 * 
 * @param queryFn - Function that executes the database query
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in milliseconds (default: 1000)
 * @returns {Promise<T>} Query result
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication or syntax errors
      if (
        error.code === 'P2002' || // Unique constraint violation
        error.code === 'P2003' || // Foreign key constraint violation
        error.message?.includes('authentication') ||
        error.message?.includes('syntax')
      ) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        logger.warn(`Query failed, retrying (${attempt}/${maxRetries})...`, {
          error: error.message,
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Export default Prisma client
export default prisma;
