import { prisma } from './prisma';

/**
 * QUERY OPTIMIZATION TECHNIQUES
 * Demonstrates best practices for efficient database queries
 */

/**
 * INEFFICIENT: Over-fetching - Retrieves all fields and relations
 */
export async function getOrdersInefficient(userId: number) {
  console.log('❌ INEFFICIENT Query: Over-fetching all fields and relations');
  const startTime = Date.now();

  // This fetches ALL columns from orders and ALL related data
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      payments: true,
      user: true,
    },
  });

  const duration = Date.now() - startTime;
  console.log(`Query executed in ${duration}ms`);
  console.log(`Fetched ${orders.length} orders with unnecessary data\n`);

  return { orders, duration };
}

/**
 * OPTIMIZED: Selective field selection - Only fetch needed fields
 */
export async function getOrdersOptimized(userId: number) {
  console.log('✅ OPTIMIZED Query: Selective field selection');
  const startTime = Date.now();

  // Only select fields we actually need
  const orders = await prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const duration = Date.now() - startTime;
  console.log(`Query executed in ${duration}ms`);
  console.log(`Fetched ${orders.length} orders with only needed fields\n`);

  return { orders, duration };
}

/**
 * INEFFICIENT: N+1 Query Problem - Fetching users in a loop
 */
export async function getUserProjectsInefficient(userId: number) {
  console.log('❌ INEFFICIENT Query: N+1 Problem - User fetched per project');
  const startTime = Date.now();

  const projects = await prisma.project.findMany({
    where: { userId },
    include: { user: true }, // This fetches user for EACH project
  });

  const duration = Date.now() - startTime;
  console.log(`Query executed in ${duration}ms`);
  console.log(`Potential N+1 problem: User data fetched ${projects.length} times\n`);

  return { projects, duration };
}

/**
 * OPTIMIZED: Batch operations and single user fetch
 */
export async function getUserProjectsOptimized(userId: number) {
  console.log('✅ OPTIMIZED Query: Single user fetch with all projects');
  const startTime = Date.now();

  const [user, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const duration = Date.now() - startTime;
  console.log(`Query executed in ${duration}ms`);
  console.log(`Optimized: User and projects fetched in parallel\n`);

  return { user, projects, duration };
}

/**
 * PAGINATION: Efficient data retrieval for large datasets
 */
export async function getOrdersWithPagination(userId: number, page: number = 1, pageSize: number = 10) {
  console.log(`📄 PAGINATION Query: Page ${page}, Size ${pageSize}`);
  const startTime = Date.now();

  const skip = (page - 1) * pageSize;

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({
      where: { userId },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const duration = Date.now() - startTime;

  console.log(`Query executed in ${duration}ms`);
  console.log(`Retrieved ${orders.length} orders, Total: ${totalCount}, Pages: ${totalPages}\n`);

  return {
    orders,
    pagination: {
      currentPage: page,
      pageSize,
      totalCount,
      totalPages,
    },
    duration,
  };
}

/**
 * BATCH OPERATIONS: Create multiple records efficiently
 */
export async function createProductsInefficient(products: Array<{ name: string; sku: string; price: number }>) {
  console.log('❌ INEFFICIENT: Creating products one by one');
  const startTime = Date.now();

  const results = [];
  for (const product of products) {
    const created = await prisma.product.create({
      data: product,
    });
    results.push(created);
  }

  const duration = Date.now() - startTime;
  console.log(`${results.length} products created in ${duration}ms (sequential)\n`);

  return { results, duration };
}

/**
 * OPTIMIZED BATCH: createMany for bulk inserts
 */
export async function createProductsOptimized(products: Array<{ name: string; sku: string; price: number }>) {
  console.log('✅ OPTIMIZED: Batch creating products');
  const startTime = Date.now();

  const result = await prisma.product.createMany({
    data: products,
  });

  const duration = Date.now() - startTime;
  console.log(`${result.count} products created in ${duration}ms (batch)\n`);

  return { count: result.count, duration };
}

/**
 * INDEXED QUERIES: Leveraging indexes for fast lookups
 */
export async function findOrdersByStatus(status: string) {
  console.log(`🔍 INDEX Query: Finding orders by status "${status}"`);
  const startTime = Date.now();

  // This query uses the @@index([status]) on Order model
  const orders = await prisma.order.findMany({
    where: { status },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      userId: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const duration = Date.now() - startTime;
  console.log(`Found ${orders.length} orders in ${duration}ms (using status index)\n`);

  return { orders, duration };
}

/**
 * COMPOSITE INDEX QUERY: Using multiple indexed fields
 */
export async function findTasksByProjectAndStatus(projectId: number, status: string) {
  console.log(`🔍 COMPOSITE Query: Tasks for project ${projectId} with status "${status}"`);
  const startTime = Date.now();

  // Uses indexes on projectId and status
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status,
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const duration = Date.now() - startTime;
  console.log(`Found ${tasks.length} tasks in ${duration}ms (using composite indexes)\n`);

  return { tasks, duration };
}

/**
 * AGGREGATION: Efficient data summarization
 */
export async function getOrderStatistics(userId: number) {
  console.log('📊 AGGREGATION Query: Order statistics');
  const startTime = Date.now();

  const [stats, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { userId },
      _count: true,
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _max: { totalAmount: true },
      _min: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { userId },
      select: { id: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const duration = Date.now() - startTime;

  console.log('Order Statistics:', {
    totalOrders: stats._count,
    totalSpent: stats._sum.totalAmount,
    averageOrderValue: stats._avg.totalAmount?.toFixed(2),
    maxOrder: stats._max.totalAmount,
    minOrder: stats._min.totalAmount,
  });

  console.log(`Query executed in ${duration}ms\n`);

  return { stats, recentOrders, duration };
}

/**
 * FILTERING WITH SEARCH: Using indexes effectively
 */
export async function searchProducts(keyword: string, limit: number = 10) {
  console.log(`🔍 SEARCH Query: Products matching "${keyword}"`);
  const startTime = Date.now();

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
    },
    take: limit,
  });

  const duration = Date.now() - startTime;
  console.log(`Found ${products.length} products in ${duration}ms\n`);

  return { products, duration };
}

/**
 * PERFORMANCE COMPARISON: Run all queries and compare
 */
export async function runOptimizationComparison(userId: number) {
  console.log('🚀 RUNNING PERFORMANCE COMPARISON\n');
  console.log('═'.repeat(60) + '\n');

  const results: Record<string, { duration: number }> = {};

  try {
    console.log('1️⃣  OVER-FETCHING vs SELECTIVE SELECTION\n');
    const inefficient = await getOrdersInefficient(userId);
    results['Inefficient (Over-fetching)'] = { duration: inefficient.duration };

    const optimized = await getOrdersOptimized(userId);
    results['Optimized (Selective)'] = { duration: optimized.duration };

    console.log('═'.repeat(60) + '\n');

    console.log('2️⃣  N+1 PROBLEM vs BATCH OPERATIONS\n');
    const n1problem = await getUserProjectsInefficient(userId);
    results['N+1 Problem'] = { duration: n1problem.duration };

    const batchOptimized = await getUserProjectsOptimized(userId);
    results['Batch Optimized'] = { duration: batchOptimized.duration };

    console.log('═'.repeat(60) + '\n');

    console.log('3️⃣  PAGINATION\n');
    const paginated = await getOrdersWithPagination(userId, 1, 10);
    results['Pagination (P1, Size 10)'] = { duration: paginated.duration };

    console.log('═'.repeat(60) + '\n');

    console.log('4️⃣  INDEX QUERIES\n');
    const indexedQuery = await findOrdersByStatus('pending');
    results['Indexed Status Query'] = { duration: indexedQuery.duration };

    console.log('═'.repeat(60) + '\n');

    console.log('📊 PERFORMANCE SUMMARY\n');
    console.log('Query Type                          | Duration (ms)');
    console.log('─'.repeat(50));
    Object.entries(results).forEach(([query, { duration }]) => {
      console.log(`${query.padEnd(35)} | ${duration}ms`);
    });

    console.log('\n✅ Comparison complete!');
  } catch (error) {
    console.error('Error during comparison:', error);
  }
}
