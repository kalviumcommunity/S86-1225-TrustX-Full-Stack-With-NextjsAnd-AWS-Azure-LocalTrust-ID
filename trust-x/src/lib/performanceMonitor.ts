import { prisma } from './prisma';

/**
 * PERFORMANCE MONITORING UTILITIES
 * Tracks query execution times, logs database operations, and analyzes performance
 */

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: Date;
  status: 'success' | 'error';
  operationType: 'query' | 'create' | 'update' | 'delete';
}

class PerformanceMonitor {
  private metrics: QueryMetric[] = [];
  private startTime: number = 0;

  /**
   * Start timing a query
   */
  startTimer(): void {
    this.startTime = Date.now();
  }

  /**
   * Record a query metric
   */
  recordMetric(query: string, status: 'success' | 'error', operationType: QueryMetric['operationType']): void {
    const duration = Date.now() - this.startTime;
    this.metrics.push({
      query,
      duration,
      timestamp: new Date(),
      status,
      operationType,
    });
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): QueryMetric[] {
    return this.metrics;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get performance statistics
   */
  getStatistics() {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        errorCount: 0,
        successCount: 0,
        operationBreakdown: {},
      };
    }

    const durations = this.metrics.map((m) => m.duration);
    const successCount = this.metrics.filter((m) => m.status === 'success').length;
    const errorCount = this.metrics.filter((m) => m.status === 'error').length;

    const operationBreakdown = this.metrics.reduce(
      (acc, m) => {
        acc[m.operationType] = (acc[m.operationType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalQueries: this.metrics.length,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      errorCount,
      successCount,
      operationBreakdown,
    };
  }

  /**
   * Print formatted performance report
   */
  printReport(title: string = 'Performance Report'): void {
    const stats = this.getStatistics();

    console.log('\n' + '═'.repeat(70));
    console.log(`📊 ${title}`);
    console.log('═'.repeat(70));
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Average Duration: ${stats.avgDuration}ms`);
    console.log(`Max Duration: ${stats.maxDuration}ms`);
    console.log(`Min Duration: ${stats.minDuration}ms`);
    console.log(`Success: ${stats.successCount} | Errors: ${stats.errorCount}`);
    console.log('Operation Breakdown:', stats.operationBreakdown);
    console.log('═'.repeat(70) + '\n');
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        timestamp: new Date(),
        metrics: this.metrics,
        statistics: this.getStatistics(),
      },
      null,
      2
    );
  }
}

// Singleton instance
export const monitor = new PerformanceMonitor();

/**
 * QUERY EXECUTION WRAPPER with monitoring
 */
export async function monitoredQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  operationType: QueryMetric['operationType'] = 'query'
): Promise<T> {
  monitor.startTimer();

  try {
    const result = await queryFn();
    monitor.recordMetric(queryName, 'success', operationType);
    console.log(`✅ ${queryName}: ${monitor.getMetrics()[monitor.getMetrics().length - 1].duration}ms`);
    return result;
  } catch (error) {
    monitor.recordMetric(queryName, 'error', operationType);
    console.error(`❌ ${queryName} failed:`, error);
    throw error;
  }
}

/**
 * ENABLE DETAILED PRISMA LOGGING
 */
export function enableDetailedLogging(): void {
  console.log('🔍 Enabling detailed Prisma query logging...\n');

  // This is already configured in prisma.ts with:
  // log: ["query", "info", "warn", "error"]
  console.log('Logs are now showing:');
  console.log('  - All database queries');
  console.log('  - Info messages');
  console.log('  - Warnings');
  console.log('  - Error messages\n');
}

/**
 * GET DATABASE STATISTICS
 */
export async function getDatabaseStatistics() {
  console.log('📈 Fetching database statistics...\n');

  try {
    const [userCount, projectCount, taskCount, orderCount, productCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.order.count(),
      prisma.product.count(),
    ]);

    const stats = {
      Users: userCount,
      Projects: projectCount,
      Tasks: taskCount,
      Orders: orderCount,
      Products: productCount,
      timestamp: new Date(),
    };

    console.log('📊 Database Statistics:');
    console.log(stats);
    console.log();

    return stats;
  } catch (error) {
    console.error('Error fetching database statistics:', error);
  }
}

/**
 * ANALYZE SLOW QUERIES (simulated EXPLAIN PLAN)
 */
export async function analyzeSlowQueries(thresholdMs: number = 100): Promise<void> {
  const slowQueries = monitor.getMetrics().filter((m) => m.duration > thresholdMs);

  if (slowQueries.length === 0) {
    console.log(`✅ No queries exceeded ${thresholdMs}ms threshold\n`);
    return;
  }

  console.log(`⚠️  Found ${slowQueries.length} slow queries (>${thresholdMs}ms)\n`);
  console.log('Slow Query Analysis:');
  console.log('─'.repeat(80));

  slowQueries.forEach((query, index) => {
    console.log(`${index + 1}. ${query.query}`);
    console.log(`   Duration: ${query.duration}ms`);
    console.log(`   Type: ${query.operationType}`);
    console.log(`   Time: ${query.timestamp.toISOString()}`);
    console.log();
  });

  console.log('Recommendations:');
  console.log('  1. Add indexes to frequently queried fields');
  console.log('  2. Use selective field selection (select instead of include)');
  console.log('  3. Implement pagination for large result sets');
  console.log('  4. Batch operations when possible');
  console.log('  5. Check for N+1 query problems\n');
}

/**
 * GENERATE PERFORMANCE REPORT WITH BEFORE/AFTER
 */
export async function generatePerformanceReport(title: string): Promise<string> {
  const stats = monitor.getStatistics();
  const dbStats = await getDatabaseStatistics();

  const report = `
╔════════════════════════════════════════════════════════════════════╗
║                     PERFORMANCE REPORT                             ║
║                     ${title.padEnd(50)}║
╚════════════════════════════════════════════════════════════════════╝

QUERY METRICS
─────────────────────────────────────────────────────────────────────
Total Queries Executed:     ${stats.totalQueries}
Average Query Duration:     ${stats.avgDuration}ms
Fastest Query:              ${stats.minDuration}ms
Slowest Query:              ${stats.maxDuration}ms
Successful Queries:         ${stats.successCount}
Failed Queries:             ${stats.errorCount}

OPERATION BREAKDOWN
─────────────────────────────────────────────────────────────────────
${Object.entries(stats.operationBreakdown)
  .map(([op, count]) => `${op.padEnd(20)}: ${count}`)
  .join('\n')}

DATABASE STATISTICS
─────────────────────────────────────────────────────────────────────
Users:                      ${dbStats?.Users || 'N/A'}
Projects:                   ${dbStats?.Projects || 'N/A'}
Tasks:                      ${dbStats?.Tasks || 'N/A'}
Orders:                     ${dbStats?.Orders || 'N/A'}
Products:                   ${dbStats?.Products || 'N/A'}

Generated: ${new Date().toISOString()}
═════════════════════════════════════════════════════════════════════
`;

  return report;
}

/**
 * COMPARE QUERY PERFORMANCE (Before/After Optimization)
 */
export async function performanceComparison(
  beforeMetrics: QueryMetric[],
  afterMetrics: QueryMetric[]
): Promise<void> {
  const calculateAvg = (metrics: QueryMetric[]) =>
    metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0;

  const beforeAvg = calculateAvg(beforeMetrics);
  const afterAvg = calculateAvg(afterMetrics);
  const improvement = ((beforeAvg - afterAvg) / beforeAvg) * 100;

  console.log('\n' + '═'.repeat(70));
  console.log('📊 PERFORMANCE COMPARISON: BEFORE vs AFTER');
  console.log('═'.repeat(70));
  console.log(`Before Optimization: ${beforeAvg.toFixed(2)}ms (${beforeMetrics.length} queries)`);
  console.log(`After Optimization:  ${afterAvg.toFixed(2)}ms (${afterMetrics.length} queries)`);
  console.log(`─`.repeat(70));

  if (improvement > 0) {
    console.log(`✅ IMPROVEMENT: ${improvement.toFixed(2)}% faster`);
  } else {
    console.log(`❌ REGRESSION: ${Math.abs(improvement).toFixed(2)}% slower`);
  }

  console.log('═'.repeat(70) + '\n');
}

/**
 * MOCK PERFORMANCE DATA (for demonstration without actual queries)
 */
export function generateMockPerformanceData(): void {
  // Clear existing metrics
  monitor.clearMetrics();

  // Simulate inefficient queries
  console.log('\n📊 SIMULATING INEFFICIENT QUERIES (Before Optimization)');
  console.log('─'.repeat(70));

  const inefficientQueries = [
    { name: 'Fetch users with all relations', duration: 450 },
    { name: 'N+1 orders per user', duration: 380 },
    { name: 'Full table scan on projects', duration: 520 },
    { name: 'Over-fetching product data', duration: 310 },
    { name: 'Batch creating users (sequential)', duration: 890 },
  ];

  inefficientQueries.forEach((q) => {
    monitor.startTimer();
    // Simulate by subtracting from current time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monitorAny = monitor as any;
    monitorAny.startTime = Date.now() - q.duration;
    monitor.recordMetric(q.name, 'success', 'query');
    console.log(`⏱️  ${q.name}: ${q.duration}ms`);
  });

  console.log('\n📊 SIMULATING OPTIMIZED QUERIES (After Optimization)');
  console.log('─'.repeat(70));

  const optimizedQueries = [
    { name: 'Batch fetch users', duration: 120 },
    { name: 'Indexed query on projects', duration: 45 },
    { name: 'Optimized product selection', duration: 65 },
    { name: 'Batch creating users', duration: 150 },
  ];

  optimizedQueries.forEach((q) => {
    monitor.startTimer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monitorAny = monitor as any;
    monitorAny.startTime = Date.now() - q.duration;
    monitor.recordMetric(q.name, 'success', 'query');
    console.log(`⏱️  ${q.name}: ${q.duration}ms`);
  });

  console.log('\nAverage: ' + (optimizedQueries.reduce((a, q) => a + q.duration, 0) / optimizedQueries.length).toFixed(2) + 'ms\n');

  // Calculate improvement
  const beforeAvg = inefficientQueries.reduce((a, q) => a + q.duration, 0) / inefficientQueries.length;
  const afterAvg = optimizedQueries.reduce((a, q) => a + q.duration, 0) / optimizedQueries.length;
  const improvement = ((beforeAvg - afterAvg) / beforeAvg) * 100;

  console.log('═'.repeat(70));
  console.log(`✅ PERFORMANCE IMPROVEMENT: ${improvement.toFixed(2)}%`);
  console.log(`   Before: ${beforeAvg.toFixed(2)}ms → After: ${afterAvg.toFixed(2)}ms`);
  console.log('═'.repeat(70) + '\n');
}

export default monitor;
