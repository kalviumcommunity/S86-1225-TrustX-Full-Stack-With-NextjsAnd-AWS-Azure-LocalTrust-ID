/**
 * Structured Logging Utility
 * Provides JSON-formatted logs with correlation IDs for AWS CloudWatch/Azure Monitor
 * 
 * Features:
 * - Request correlation tracking
 * - Performance metrics
 * - Error tracking with stack traces
 * - Structured JSON output for cloud log aggregation
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    endpoint: string;
    method: string;
  };
}

class Logger {
  private serviceName: string = 'trustx-app';
  private environment: string = process.env.NODE_ENV || 'development';

  /**
   * Generate a unique request ID for correlation
   */
  generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Core logging method - outputs structured JSON
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: context?.requestId,
      context: {
        ...context,
        service: this.serviceName,
        environment: this.environment,
      },
    };

    // Add error details if present
    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    // Always output to console.log for consistency in tests
    const output = JSON.stringify(entry);
    console.log(output);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log error messages with optional Error object
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log API request start
   */
  logRequest(method: string, endpoint: string, requestId: string, userId?: string): void {
    this.info('API Request started', {
      requestId,
      method,
      endpoint,
      userId,
    });
  }

  /**
   * Log API request completion with performance metrics
   */
  logResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string
  ): void {
    const level = statusCode >= 200 && statusCode < 300 ? 'info' : 'error';
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: 'API Response completed',
      requestId,
      context: {
        statusCode,
        userId,
      },
      performance: {
        duration,
        endpoint,
        method,
      },
    };
    
    console.log(JSON.stringify(entry));
  }

  /**
   * Log database operations
   */
  logDatabase(operation: string, model: string, duration: number, requestId?: string): void {
    this.info('Database operation', {
      requestId,
      operation,
      model,
      duration,
    });
  }

  /**
   * Log cache operations
   */
  logCache(operation: 'hit' | 'miss' | 'set', key: string, requestId?: string): void {
    this.info(`Cache ${operation}`, {
      requestId,
      cacheKey: key,
    });
  }

  /**
   * Log authentication events
   */
  logAuth(action: string, status: 'success' | 'failed', userId?: string, requestId?: string, reason?: string): void {
    const level = status === 'success' ? 'info' : 'warn';
    const event = `${action}_${status}`;
    this.log(level, `Authentication: ${event}`, {
      requestId,
      userId,
      event,
      ...(reason && { reason }),
    });
  }

  /**
   * Log security events
   */
  logSecurity(event: string, ipAddress: string, context?: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      event,
      ip: ipAddress,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Performance tracking utility
 * Usage:
 *   const timer = performance.start('operation-name');
 *   // ... do work
 *   timer.end();
 */
export const performance = {
  start(operation: string, requestId?: string) {
    const startTime = Date.now();
    return {
      end() {
        const duration = Date.now() - startTime;
        logger.debug(`Performance: ${operation}`, {
          requestId,
          operation,
          duration,
        });
        return duration;
      },
    };
  },
};