import { NextRequest, NextResponse } from 'next/server';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Swagger API Documentation UI
 *     description: Interactive API documentation interface
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI HTML
 */
export async function GET(request: NextRequest) {
  try {
    // Return Swagger JSON spec
    return NextResponse.json(swaggerSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
