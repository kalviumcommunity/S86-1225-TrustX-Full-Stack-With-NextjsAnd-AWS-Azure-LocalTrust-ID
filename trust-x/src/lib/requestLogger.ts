/**
 * API Request Logger Middleware
 * Automatically logs all API requests with correlation IDs and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
}

/**
 * Middleware wrapper to add logging to API routes
 * Usage:
 *   export const GET = withRequestLogging(async (req, context) => {
 *     // Your handler code
 *   });
 */
export function withRequestLogging(
  handler: (req: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Generate request ID
    const requestId = logger.generateRequestId();
    const startTime = Date.now();

    // Extract user info from headers/auth if available
    const userId = req.headers.get('x-user-id') || undefined;

    // Log request start
    logger.logRequest(requestId, req.method, req.nextUrl.pathname, userId);

    try {
      // Execute handler
      const response = await handler(req, { requestId, startTime, userId });

      // Log successful completion
      const duration = Date.now() - startTime;
      logger.logResponse(
        requestId,
        req.method,
        req.nextUrl.pathname,
        response.status,
        duration,
        userId
      );

      // Add request ID to response headers for client-side tracking
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      logger.error('API request failed', {
        requestId,
        method: req.method,
        endpoint: req.nextUrl.pathname,
        duration,
        userId,
      }, error as Error);

      // Log response
      logger.logResponse(requestId, req.method, req.nextUrl.pathname, 500, duration, userId);

      // Return error response
      return NextResponse.json(
        {
          success: false,
          message: 'Internal server error',
          error: {
            code: 'INTERNAL_ERROR',
            requestId, // Include request ID for debugging
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple request logger without error handling (for manual use)
 */
export function createRequestContext(req: NextRequest): RequestContext {
  const requestId = logger.generateRequestId();
  const userId = req.headers.get('x-user-id') || undefined;

  logger.logRequest(requestId, req.method, req.nextUrl.pathname, userId);

  return {
    requestId,
    startTime: Date.now(),
    userId,
  };
}

/**
 * Log the response for a request context
 */
export function logRequestCompletion(
  context: RequestContext,
  req: NextRequest,
  statusCode: number
): void {
  const duration = Date.now() - context.startTime;
  logger.logResponse(
    context.requestId,
    req.method,
    req.nextUrl.pathname,
    statusCode,
    duration,
    context.userId
  );
}
