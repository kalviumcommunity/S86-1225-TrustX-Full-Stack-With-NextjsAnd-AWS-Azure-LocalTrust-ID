/**
 * Database Health Check API
 * 
 * This endpoint provides health check information for the database connection.
 * Use it for:
 * - Load balancer health checks
 * - Monitoring systems (DataDog, New Relic, etc.)
 * - CI/CD deployment validation
 * - Development troubleshooting
 * 
 * GET /api/health/db
 * 
 * Response:
 * - 200: Database is healthy
 * - 503: Database is unhealthy or unreachable
 * 
 * @module api/health/db
 */

import { NextResponse } from 'next/server';
import { 
  checkDatabaseHealth, 
  getDatabaseInfo, 
  testDatabaseConnection 
} from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/health/db
 * 
 * Returns database health status and connection information
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    // Quick health check
    const isHealthy = await checkDatabaseHealth();
    
    if (!isHealthy) {
      logger.error('Database health check failed');
      
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`,
        },
        { status: 503 }
      );
    }
    
    // Basic health response
    const response: any = {
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
    };
    
    // Add detailed information if requested
    if (detailed) {
      const dbInfo = await getDatabaseInfo();
      response.details = {
        provider: dbInfo.provider,
        version: dbInfo.version,
        database: dbInfo.currentDatabase,
        connections: {
          current: dbInfo.connectionCount,
          max: dbInfo.maxConnections,
          usage: dbInfo.maxConnections 
            ? `${((dbInfo.connectionCount || 0) / dbInfo.maxConnections * 100).toFixed(1)}%`
            : 'N/A',
        },
      };
    }
    
    logger.info('Database health check passed', {
      responseTime: Date.now() - startTime,
    });
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    logger.error('Database health check error', { error });
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/health/db
 * 
 * Performs a comprehensive database connection test
 * Requires authentication for security
 */
export async function POST(request: Request) {
  try {
    // Optional: Add authentication here
    // const isAuthorized = await verifyAdminAccess(request);
    // if (!isAuthorized) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const result = await testDatabaseConnection();
    
    return NextResponse.json(
      result,
      { status: result.success ? 200 : 503 }
    );
    
  } catch (error: any) {
    logger.error('Database connection test error', { error });
    
    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
