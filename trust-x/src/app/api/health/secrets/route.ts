/**
 * Secrets Health Check API
 * 
 * GET /api/health/secrets
 * 
 * Validates that secrets manager is configured and accessible.
 * Returns provider information, connection status, and secret retrieval test.
 * 
 * Response:
 * {
 *   success: boolean;
 *   data: {
 *     healthy: boolean;
 *     provider: 'aws' | 'azure' | 'local';
 *     configured: boolean;
 *     message: string;
 *     secretsCount: number;
 *     sampleKeys: string[];
 *     retrievalTime: string;
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkSecretsHealth, getSecrets, getSecretsProviderInfo } from '@/lib/secretsManager';
import { sendSuccess, sendError } from '@/lib/responseHandler';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Secrets health check requested');
    
    const startTime = Date.now();
    
    // Check secrets manager health
    const healthStatus = await checkSecretsHealth();
    
    // Get provider information
    const providerInfo = getSecretsProviderInfo();
    
    // Try to retrieve secrets (with cache)
    let secrets: Record<string, string> = {};
    let secretsCount = 0;
    let sampleKeys: string[] = [];
    
    try {
      secrets = await getSecrets();
      secretsCount = Object.keys(secrets).length;
      
      // Get sample keys (first 5, excluding sensitive patterns)
      sampleKeys = Object.keys(secrets)
        .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'))
        .slice(0, 5);
    } catch (error) {
      logger.warn('Could not retrieve secrets for health check', { error });
    }
    
    const retrievalTime = Date.now() - startTime;
    
    const response = {
      healthy: healthStatus.healthy,
      provider: healthStatus.provider,
      configured: healthStatus.configured,
      message: healthStatus.message,
      secretsCount,
      sampleKeys,
      retrievalTime: `${retrievalTime}ms`,
      cacheEnabled: providerInfo.cacheEnabled,
      cacheTTL: `${providerInfo.cacheTTL}s`,
      details: healthStatus.details,
    };
    
    if (healthStatus.healthy) {
      logger.info('Secrets health check passed', {
        provider: healthStatus.provider,
        secretsCount,
        retrievalTime,
      });
      return sendSuccess(response, 'Secrets manager is healthy');
    } else {
      logger.error('Secrets health check failed', {
        provider: healthStatus.provider,
        message: healthStatus.message,
      });
      return sendError(
        healthStatus.message,
        'SECRETS_UNHEALTHY',
        503
      );
    }
  } catch (error: any) {
    logger.error('Secrets health check error', {
      error: error.message,
      stack: error.stack,
    });
    
    return sendError(
      error.message || 'Secrets health check failed',
      'HEALTH_CHECK_ERROR',
      500
    );
  }
}

/**
 * POST /api/health/secrets/refresh
 * 
 * Forces a refresh of the secrets cache.
 * Useful for testing or after secret rotation.
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('Forcing secrets cache refresh');
    
    const startTime = Date.now();
    
    // Force refresh (bypass cache)
    const secrets = await getSecrets(true);
    const retrievalTime = Date.now() - startTime;
    
    const secretsCount = Object.keys(secrets).length;
    
    logger.info('Secrets cache refreshed successfully', {
      secretsCount,
      retrievalTime,
    });
    
    return sendSuccess({
      refreshed: true,
      secretsCount,
      retrievalTime: `${retrievalTime}ms`,
      timestamp: new Date().toISOString(),
    }, 'Secrets cache refreshed successfully');
  } catch (error: any) {
    logger.error('Failed to refresh secrets cache', {
      error: error.message,
    });
    
    return sendError(
      error.message || 'Failed to refresh secrets cache',
      'REFRESH_ERROR',
      500
    );
  }
}
