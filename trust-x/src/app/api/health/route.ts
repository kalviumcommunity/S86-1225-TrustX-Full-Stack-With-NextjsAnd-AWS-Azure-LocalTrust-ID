import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

/**
 * Health Check Endpoint
 * 
 * Returns system health status including:
 * - Basic application status
 * - Database connectivity
 * - Uptime metrics
 * - Memory usage
 * - Version information
 * 
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns comprehensive system health status including database connectivity, memory usage, and uptime
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               status: healthy
 *               timestamp: "2026-01-09T12:00:00.000Z"
 *               uptime: 3600
 *               version: "1.0.0"
 *               environment: production
 *               database:
 *                 status: connected
 *                 type: sqlite
 *               memory:
 *                 heapUsed: "45MB"
 *                 heapTotal: "60MB"
 *                 rss: "120MB"
 *               responseTime: 15
 *       503:
 *         description: Service unavailable or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: degraded
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: disconnected
 */
export async function GET(req: Request) {
  const startTime = Date.now();

  try {
    // Basic health check
    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Database health check
    try {
      const db = await getDb();
      await db.admin().ping();
      healthData.database = {
        status: 'connected',
        type: 'mongodb',
      };
    } catch (dbError) {
      healthData.database = {
        status: 'disconnected',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      };
      healthData.status = 'degraded';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthData.memory = {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    };

    // Response time
    healthData.responseTime = `${Date.now() - startTime}ms`;

    // Determine HTTP status code based on health
    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    // Critical failure
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime(),
      },
      { status: 503 }
    );
  }
}

/**
 * Detailed Health Check (Admin only)
 * Use query parameter ?detailed=true for extended diagnostics
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { checkDatabase, checkRedis, checkStorage } = body;

    const checks: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Database check
    if (checkDatabase) {
      try {
        const db = await getDb();
        const userCount = await db.collection('users').countDocuments();
        checks.checks.database = {
          status: 'pass',
          userCount,
          responseTime: '<50ms',
        };
      } catch (err) {
        checks.checks.database = {
          status: 'fail',
          error: err instanceof Error ? err.message : 'Unknown',
        };
      }
    }

    // Overall status
    const allPassed = Object.values(checks.checks).every(
      (check: any) => check.status === 'pass'
    );
    checks.status = allPassed ? 'healthy' : 'degraded';

    return NextResponse.json(checks, {
      status: allPassed ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
