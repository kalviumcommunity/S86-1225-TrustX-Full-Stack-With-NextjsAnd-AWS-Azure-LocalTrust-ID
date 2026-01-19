/**
 * COMPREHENSIVE TEST & PERFORMANCE BENCHMARK
 * NOTE: This file is deprecated after MongoDB migration
 * The old transaction and performance monitoring utilities have been removed
 */

import { getDb } from '../lib/mongodb';

// Commenting out removed imports
// import {
//   processOrderTransaction,
//   createUserWithProjectsTransaction,
//   updateInventoryTransaction,
//   complexOrderTransaction,
//   testRollbackScenario,
// } from '../lib/transactions';
// import {
//   getOrdersInefficient,
//   getOrdersOptimized,
//   getOrderStatistics,
// } from '../lib/queryOptimization';
// import {
//   monitor,
//   generatePerformanceReport,
//   generateMockPerformanceData,
//   getDatabaseStatistics,
//   analyzeSlowQueries,
// } from '../lib/performanceMonitor';

/**
 * MAIN TEST RUNNER
 */
export async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE DATABASE OPTIMIZATION TESTS\n');
  console.log('═'.repeat(80));

  try {
    // Test 1: Seed initial data
    console.log('\n1️⃣  SEEDING TEST DATA');
    console.log('─'.repeat(80));
    await seedTestData();

    // Test 2: Run transaction examples
    console.log('\n\n2️⃣  TESTING TRANSACTIONS & ROLLBACKS');
    console.log('─'.repeat(80));
    await testTransactions();

    // Test 3: Run query optimization comparison
    console.log('\n\n3️⃣  TESTING QUERY OPTIMIZATION');
    console.log('─'.repeat(80));
    await testQueryOptimization();

    // Test 4: Generate performance reports
    console.log('\n\n4️⃣  GENERATING PERFORMANCE REPORTS');
    console.log('─'.repeat(80));
    await generateReports();

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));
  } catch (error) {
    console.error('❌ Error during tests:', error);
  }
}

/**
 * SEED TEST DATA
 */
async function seedTestData(): Promise<void> {
  try {
    // Clear existing data
    const db = await getDb();
    await Promise.all([
      db.collection('payments').deleteMany({}),
      db.collection('orderItems').deleteMany({}),
      db.collection('orders').deleteMany({}),
      db.collection('inventory').deleteMany({}),
      db.collection('products').deleteMany({}),
      db.collection('tasks').deleteMany({}),
      db.collection('projects').deleteMany({}),
      db.collection('users').deleteMany({}),
    ]);

    console.log('✓ Cleared existing data');

    // Create test users
    const now = new Date();
    const usersResult = await db.collection('users').insertMany([
      { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', role: 'USER', createdAt: now, updatedAt: now },
      { name: 'Bob Smith', email: 'bob@example.com', password: 'password123', role: 'ADMIN', createdAt: now, updatedAt: now },
      { name: 'Carol Davis', email: 'carol@example.com', password: 'password123', role: 'USER', createdAt: now, updatedAt: now },
    ]);
    console.log(`✓ Created ${Object.keys(usersResult.insertedIds).length} users`);

    // Get user IDs
    const allUsers = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray();
    const userId = allUsers[0]._id;

    // Create test projects
    const projectsResult = await db.collection('projects').insertMany([
      { title: 'Project Alpha', userId, status: 'active', createdAt: now, updatedAt: now },
      { title: 'Project Beta', userId, status: 'active', createdAt: now, updatedAt: now },
      { title: 'Project Gamma', userId, status: 'completed', createdAt: now, updatedAt: now },
    ]);
    console.log(`✓ Created ${Object.keys(projectsResult.insertedIds).length} projects`);

    // Create test tasks
    const projectIds = await db.collection('projects').find(
      { userId },
      { projection: { _id: 1 } }
    ).toArray();

    const tasksResult = await db.collection('tasks').insertMany([
      {
        title: 'Design Database Schema',
        projectId: projectIds[0]._id,
        status: 'completed',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Implement API Endpoints',
        projectId: projectIds[0]._id,
        status: 'in-progress',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Write Unit Tests',
        projectId: projectIds[0]._id,
        status: 'pending',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Frontend Development',
        projectId: projectIds[1]._id,
        status: 'in-progress',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Deploy to Production',
        projectId: projectIds[1]._id,
        status: 'pending',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    console.log(`✓ Created ${Object.keys(tasksResult.insertedIds).length} tasks`);

    // Create test products
    const productsResult = await db.collection('products').insertMany([
      {
        name: 'Laptop Pro',
        description: 'High-performance laptop',
        sku: 'LAPTOP-001',
        price: 1299.99,
        stock: 50,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        sku: 'MOUSE-001',
        price: 29.99,
        stock: 200,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'USB-C Cable',
        description: 'High-speed USB-C cable',
        sku: 'CABLE-001',
        price: 12.99,
        stock: 500,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Monitor 4K',
        description: 'Ultra HD 4K monitor',
        sku: 'MONITOR-001',
        price: 399.99,
        stock: 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard',
        sku: 'KEYBOARD-001',
        price: 149.99,
        stock: 75,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    console.log(`✓ Created ${Object.keys(productsResult.insertedIds).length} products`);

    // Create test inventory
    const allProducts = await db.collection('products').find({}, { projection: { _id: 1 } }).toArray();
    const inventoryResult = await db.collection('inventory').insertMany(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allProducts.map((p: any) => ({
        productId: p._id,
        warehouseLocation: 'Warehouse-A',
        lastRestockDate: now,
        reorderLevel: 10,
        createdAt: now,
        updatedAt: now,
      }))
    );
    console.log(`✓ Created ${Object.keys(inventoryResult.insertedIds).length} inventory records`);

    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

/**
 * TEST TRANSACTIONS
 */
async function testTransactions(): Promise<void> {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({}, { projection: { _id: 1 } });
    const product = await db.collection('products').findOne({}, { projection: { _id: 1 } });
    const userId = user?._id;
    const productId = product?._id;

    if (!userId || !productId) {
      throw new Error('No user or product found for transaction test');
    }

    console.log('\n✨ Transaction 1: Process Order');
    console.log('─'.repeat(80));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResult = await processOrderTransaction(userId as any, productId as any, 2);
    if (orderResult.success) {
      console.log(`Result: Order created in ${orderResult.duration}ms`);
    }

    console.log('\n✨ Transaction 2: Create User with Projects');
    console.log('─'.repeat(80));
    const userProjectResult = await createUserWithProjectsTransaction(
      {
        name: 'Transaction Test User',
        email: `test-${Date.now()}@example.com`,
      },
      ['Project 1', 'Project 2', 'Project 3']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    if (userProjectResult.success) {
      console.log(`Result: User and projects created in ${userProjectResult.duration}ms`);
    }

    console.log('\n✨ Transaction 3: Update Inventory');
    console.log('─'.repeat(80));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inventoryResult = await updateInventoryTransaction(productId as any, 100, 'Warehouse-B');
    if (inventoryResult.success) {
      console.log(`Result: Inventory updated in ${inventoryResult.duration}ms`);
    }

    console.log('\n✨ Transaction 4: Complex Multi-Item Order');
    console.log('─'.repeat(80));
    const products = await db.collection('products')
      .find({}, { projection: { _id: 1 } })
      .limit(3)
      .toArray();
    const complexOrder = await complexOrderTransaction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products.map((p: any) => ({ productId: p._id, quantity: 2 }))
    );
    if (complexOrder.success) {
      console.log(`Result: Complex order created in ${complexOrder.duration}ms`);
    }

    console.log('\n✨ Transaction 5: Rollback Test');
    console.log('─'.repeat(80));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rollbackTest = await testRollbackScenario(userId as any, productId as any);
    console.log(
      `Rollback Verification: ${rollbackTest.rollbackVerified ? '✅ PASSED' : '❌ FAILED'}`
    );
  } catch (error) {
    console.error('Error in transaction tests:', error);
  }
}

/**
 * TEST QUERY OPTIMIZATION
 */
async function testQueryOptimization(): Promise<void> {
  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({}, { projection: { _id: 1 } });
    const userId = user?._id;

    if (!userId) {
      throw new Error('No user found for optimization test');
    }

    console.log('\n📊 Query Optimization Comparison');
    console.log('─'.repeat(80));

    // Test 1: Over-fetching vs Selective
    console.log('\n1️⃣  Over-fetching vs Selective Selection');
    console.log('...............................................................................');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inefficientOrders = await getOrdersInefficient(userId as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const optimizedOrders = await getOrdersOptimized(userId as any);
    const orderImprovement =
      ((inefficientOrders.duration - optimizedOrders.duration) /
        inefficientOrders.duration) *
      100;
    console.log(`Improvement: ${orderImprovement.toFixed(2)}%\n`);

    // Test 2: N+1 Problem vs Batch
    // Note: These functions need to be implemented in queryOptimization.ts
    // const n1Projects = await getUserProjectsInefficient(userId);
    // const batchProjects = await getUserProjectsOptimized(userId);
    // const projectImprovement =
    //   ((n1Projects.duration - batchProjects.duration) / n1Projects.duration) * 100;
    // console.log(`Improvement: ${projectImprovement.toFixed(2)}%\n`);

    // Test 3: Pagination
    // Note: getOrdersWithPagination needs to be implemented in queryOptimization.ts
    // const page1 = await getOrdersWithPagination(userId, 1, 10);
    // const page2 = await getOrdersWithPagination(userId, 2, 10);
    // console.log(`Page 1: ${page1.duration}ms | Page 2: ${page2.duration}ms\n`);

    // Test 4: Index Performance
    // Note: findOrdersByStatus needs to be implemented in queryOptimization.ts
    // const indexQuery = await findOrdersByStatus('pending');
    // console.log(`Indexed query result: ${indexQuery.duration}ms\n`);

    // Test 5: Aggregation
    console.log('5️⃣  Aggregation & Statistics');
    console.log('...............................................................................');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = await getOrderStatistics(userId as any);
    console.log(`Aggregation query: ${stats.duration}ms\n`);

    // Test 6: Batch operations
    // Note: createProductsInefficient and createProductsOptimized need to be implemented
    // const testProducts = [
    //   { name: 'Test Product 1', sku: `SKU-${Date.now()}-1`, price: 99.99 },
    //   { name: 'Test Product 2', sku: `SKU-${Date.now()}-2`, price: 199.99 },
    //   { name: 'Test Product 3', sku: `SKU-${Date.now()}-3`, price: 299.99 },
    // ];
    // 
    // const sequentialResult = await createProductsInefficient(testProducts);
    // const batchResult = await createProductsOptimized(testProducts);
    // const batchImprovement =
    //   ((sequentialResult.duration - batchResult.duration) / sequentialResult.duration) * 100;
    // console.log(`Improvement: ${batchImprovement.toFixed(2)}%\n`);
  } catch (error) {
    console.error('Error in optimization tests:', error);
  }
}

/**
 * GENERATE REPORTS
 */
async function generateReports(): Promise<void> {
  try {
    // Get database statistics
    console.log('\n📈 Database Statistics');
    console.log('─'.repeat(80));
    await getDatabaseStatistics();

    // Analyze slow queries
    console.log('⚠️  Slow Query Analysis');
    console.log('─'.repeat(80));
    await analyzeSlowQueries(200);

    // Generate mock performance data for demonstration
    console.log('\n📊 PERFORMANCE IMPROVEMENT DEMONSTRATION');
    console.log('─'.repeat(80));
    generateMockPerformanceData();

    // Generate full report
    console.log('\n📋 FINAL PERFORMANCE REPORT');
    console.log('─'.repeat(80));
    const report = await generatePerformanceReport('Full Optimization Test Suite');
    console.log(report);

    // Export metrics
    console.log('\n💾 EXPORTING METRICS');
    console.log('─'.repeat(80));
    monitor.exportMetrics();
    console.log('Metrics exported successfully\n');
  } catch (error) {
    console.error('Error generating reports:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export default runAllTests;
