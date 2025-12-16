#!/usr/bin/env ts-node

/**
 * PERFORMANCE TESTING SCRIPT
 * Run this script to test transactions, queries, and performance monitoring
 * 
 * Usage:
 *   npx ts-node scripts/performance-test.ts
 */

import { prisma } from '../src/lib/prisma';
import {
  processOrderTransaction,
  complexOrderTransaction,
  testRollbackScenario,
} from '../src/lib/transactions';
import {
  getOrdersInefficient,
  getOrdersOptimized,
  getOrderStatistics,
} from '../src/lib/queryOptimization';
import {
  monitor,
  generateMockPerformanceData,
  generatePerformanceReport,
  getDatabaseStatistics,
} from '../src/lib/performanceMonitor';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color = 'reset'): void {
  const colorCode = COLORS[color as keyof typeof COLORS] || '';
  console.log(`${colorCode}${message}${COLORS.reset}`);
}

async function seedData(): Promise<{
  userId: number;
  productId: number;
}> {
  log('\n📦 SEEDING DATA', 'cyan');
  log('─'.repeat(80));

  try {
    // Clear existing data
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users
    const users = await prisma.user.createMany({
      data: [
        { name: 'Alice', email: 'alice@test.com' },
        { name: 'Bob', email: 'bob@test.com' },
        { name: 'Carol', email: 'carol@test.com' },
      ],
    });
    log(`✓ Created ${users.count} users`, 'green');

    const userId = (await prisma.user.findFirst({ select: { id: true } }))!.id;

    // Create projects
    const projects = await prisma.project.createMany({
      data: [
        { title: 'Project 1', userId, status: 'active' },
        { title: 'Project 2', userId, status: 'active' },
      ],
    });
    log(`✓ Created ${projects.count} projects`, 'green');

    // Create products
    const products = await prisma.product.createMany({
      data: [
        {
          name: 'Laptop',
          sku: 'LAPTOP-001',
          price: 1299.99,
          stock: 50,
          description: 'High-end laptop',
        },
        {
          name: 'Mouse',
          sku: 'MOUSE-001',
          price: 29.99,
          stock: 200,
          description: 'Wireless mouse',
        },
        {
          name: 'Keyboard',
          sku: 'KEYBOARD-001',
          price: 149.99,
          stock: 100,
          description: 'Mechanical keyboard',
        },
      ],
    });
    log(`✓ Created ${products.count} products`, 'green');

    const productId = (await prisma.product.findFirst({ select: { id: true } }))!.id;

    log('✅ Data seeding complete\n', 'green');

    return { userId, productId };
  } catch (error) {
    log(`❌ Error seeding data: ${error}`, 'red');
    throw error;
  }
}

async function testTransactions(userId: number, productId: number): Promise<void> {
  log('\n🔄 TESTING TRANSACTIONS & ROLLBACKS', 'cyan');
  log('─'.repeat(80));

  try {
    // Test 1: Process order
    log('\n1️⃣  Order Processing Transaction', 'blue');
    const order = await processOrderTransaction(userId, productId, 2);
    if (order.success) {
      log(`✅ Order created in ${order.duration}ms`, 'green');
    } else {
      log(`❌ Order failed: ${order.error}`, 'red');
    }

    // Test 2: Rollback test
    log('\n2️⃣  Rollback Verification Test', 'blue');
    const rollback = await testRollbackScenario(userId, productId);
    if (rollback.rollbackVerified) {
      log('✅ Rollback verified - NO partial data written', 'green');
    } else {
      log('❌ Rollback failed - data was partially written', 'red');
    }

    // Test 3: Complex order
    log('\n3️⃣  Complex Multi-Item Order', 'blue');
    const products = await prisma.product.findMany({
      select: { id: true },
      take: 2,
    });
    if (products.length >= 2) {
      const complex = await complexOrderTransaction(
        userId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        products.map((p: any) => ({ productId: p.id, quantity: 1 }))
      );
      if (complex.success) {
        log(`✅ Complex order created in ${complex.duration}ms`, 'green');
      }
    }

    log('\n✅ Transaction tests complete', 'green');
  } catch (error) {
    log(`❌ Transaction test error: ${error}`, 'red');
  }
}

async function testQueryOptimization(userId: number): Promise<void> {
  log('\n⚡ TESTING QUERY OPTIMIZATION', 'cyan');
  log('─'.repeat(80));

  try {
    // Create some orders first
    log('\nCreating test data...', 'gray');
    for (let i = 0; i < 3; i++) {
      const product = await prisma.product.findFirst({ select: { id: true } });
      if (product) {
        await processOrderTransaction(userId, product.id, 1);
      }
    }

    log('\n1️⃣  Inefficient vs Optimized Queries', 'blue');
    log('...............................................................................');

    const inefficient = await getOrdersInefficient(userId);
    const optimized = await getOrdersOptimized(userId);

    const improvement =
      ((inefficient.duration - optimized.duration) / inefficient.duration) * 100;

    log(`Before: ${inefficient.duration}ms | After: ${optimized.duration}ms`, 'gray');
    log(`Improvement: ${improvement.toFixed(2)}%`, improvement > 0 ? 'green' : 'yellow');

    // Test aggregation
    log('\n2️⃣  Aggregation & Statistics', 'blue');
    const stats = await getOrderStatistics(userId);
    log(`✅ Statistics retrieved in ${stats.duration}ms`, 'green');

    log('\n✅ Query optimization tests complete', 'green');
  } catch (error) {
    log(`❌ Query optimization test error: ${error}`, 'red');
  }
}

async function testPerformanceMonitoring(): Promise<void> {
  log('\n📊 TESTING PERFORMANCE MONITORING', 'cyan');
  log('─'.repeat(80));

  try {
    // Generate mock data for demonstration
    log('\nGenerating mock performance data...', 'gray');
    generateMockPerformanceData();

    // Get statistics
    const stats = monitor.getStatistics();
    log('\n📈 Current Statistics:', 'blue');
    log(`Total Queries: ${stats.totalQueries}`);
    log(`Average Duration: ${stats.avgDuration}ms`);
    log(`Max Duration: ${stats.maxDuration}ms`);
    log(`Min Duration: ${stats.minDuration}ms`);

    // Get database stats
    log('\n🗄️  Database Statistics', 'blue');
    await getDatabaseStatistics();

    log('✅ Performance monitoring tests complete', 'green');
  } catch (error) {
    log(`❌ Performance monitoring test error: ${error}`, 'red');
  }
}

async function runComprehensiveTest(): Promise<void> {
  log('\n' + '═'.repeat(80), 'cyan');
  log('  🚀 COMPREHENSIVE PERFORMANCE TEST SUITE', 'cyan');
  log('═'.repeat(80), 'cyan');

  const startTime = Date.now();

  try {
    // Seed data
    const { userId, productId } = await seedData();

    // Run tests
    await testTransactions(userId, productId);
    await testQueryOptimization(userId);
    await testPerformanceMonitoring();

    // Generate report
    log('\n📋 GENERATING FINAL REPORT', 'cyan');
    log('─'.repeat(80));

    const report = await generatePerformanceReport('Comprehensive Performance Test');
    console.log(report);

    const duration = Date.now() - startTime;
    log(`\n✅ ALL TESTS COMPLETED in ${duration}ms`, 'green');
    log('═'.repeat(80), 'cyan');
  } catch (error) {
    log(`❌ Test suite failed: ${error}`, 'red');
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

export { runComprehensiveTest, testTransactions, testQueryOptimization };
