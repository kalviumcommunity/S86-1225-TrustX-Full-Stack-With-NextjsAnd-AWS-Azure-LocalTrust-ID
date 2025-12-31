/**
 * Storage Health Check API
 * 
 * Checks the health and connectivity of the configured cloud storage provider.
 * 
 * GET /api/upload/health
 * 
 * Response:
 * {
 *   healthy: boolean;
 *   provider: string;
 *   message: string;
 *   details?: {
 *     bucket?: string;
 *     region?: string;
 *     accountName?: string;
 *     container?: string;
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkStorageHealth } from '@/lib/storage';
import { sendSuccess, sendError } from '@/lib/responseHandler';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = await checkStorageHealth();

    if (healthStatus.healthy) {
      return sendSuccess(healthStatus, healthStatus.message);
    } else {
      return sendError(
        healthStatus.message,
        'STORAGE_UNHEALTHY',
        503
      );
    }
  } catch (error: any) {
    return sendError(
      error.message || 'Storage health check failed',
      'HEALTH_CHECK_ERROR',
      500
    );
  }
}
