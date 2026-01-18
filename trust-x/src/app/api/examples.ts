/**
 * API ROUTE EXAMPLES: Using Transactions & Optimized Queries
 * These examples demonstrate how to use transactions and optimization
 * in real-world API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, ObjectId } from '../../lib/mongodb';
import {
  processOrderTransaction,
  complexOrderTransaction,
  updateInventoryTransaction,
} from '../../lib/transactions';
import { getOrdersOptimized, getOrderStatistics } from '../../lib/queryOptimization';
import { monitoredQuery } from '../../lib/performanceMonitor';

/**
 * POST /api/orders
 * Create a new order with transaction
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, productId, quantity } = await request.json();

    // Validate input
    if (!userId || !productId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use transaction for atomicity
    const result = await processOrderTransaction(userId, productId, quantity);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        data: result.data,
        duration: result.duration,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('POST /api/orders error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders?userId=1
 * Fetch user orders with optimized queries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Use optimized query with monitoring
    const { orders, duration } = await monitoredQuery(
      `Fetch orders for user ${userId}`,
      () => getOrdersOptimized(userId),
      'query'
    );

    return NextResponse.json(
      {
        success: true,
        data: orders,
        duration,
        count: orders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/orders/bulk
 * Create multiple orders in a transaction
 */
export async function bulkCreateOrders(request: NextRequest) {
  try {
    const { userId, orderItems } = await request.json();

    if (!userId || !orderItems || !Array.isArray(orderItems)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Complex transaction with multiple items
    const result = await complexOrderTransaction(userId, orderItems);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Complex order created successfully',
        data: result.data,
        duration: result.duration,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/inventory/update
 * Update inventory with transaction
 */
export async function updateInventory(request: NextRequest) {
  try {
    const { productId, newStockLevel, warehouseLocation } = await request.json();

    if (!productId || newStockLevel === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await updateInventoryTransaction(
      productId,
      newStockLevel,
      warehouseLocation || 'Unknown'
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Inventory updated successfully',
        data: result.data,
        duration: result.duration,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/orders/stats?userId=1
 * Get order statistics with aggregation
 */
export async function getOrderStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { stats, recentOrders, duration } = await monitoredQuery(
      `Order statistics for user ${userId}`,
      () => getOrderStatistics(userId),
      'query'
    );

    return NextResponse.json(
      {
        success: true,
        statistics: {
          totalOrders: stats._count,
          totalSpent: stats._sum.totalAmount,
          averageOrderValue: stats._avg.totalAmount,
          maxOrder: stats._max.totalAmount,
          minOrder: stats._min.totalAmount,
        },
        recentOrders,
        duration,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/orders/:id/status
 * Update order status (transaction example)
 */
export async function updateOrderStatus(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    const { status, paymentStatus } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update order and related payment (MongoDB atomic operations)
    const db = await getDb();
    if (!ObjectId.isValid(orderId.toString())) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const updatedOrder = await db.collection('orders').findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status,
          updatedAt: new Date(),
        } 
      },
      { returnDocument: 'after' }
    );

    // Update payment if status provided
    if (paymentStatus) {
      await db.collection('payments').updateMany(
        { orderId: new ObjectId(orderId) },
        { 
          $set: { 
            status: paymentStatus,
            updatedAt: new Date(),
          } 
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order status updated',
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/users?page=1&limit=10
 * Fetch users with pagination
 */
export async function getUsers(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { users, total, duration } = await monitoredQuery(
      `Fetch users page ${page}, limit ${limit}`,
      async () => {
        const db = await getDb();
        const [users, total] = await Promise.all([
          db.collection('users')
            .find({}, {
              projection: {
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                createdAt: 1,
              },
              skip: (page - 1) * limit,
              limit: limit,
              sort: { createdAt: -1 },
            })
            .toArray(),
          db.collection('users').countDocuments(),
        ]);

        // Convert _id to id
        const formattedUsers = users.map(user => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        }));

        return { users: formattedUsers, total, duration: 0 };
      },
      'query'
    );

    return NextResponse.json(
      {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        duration,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/products/batch
 * Batch create products
 */
export async function batchCreateProducts(request: NextRequest) {
  try {
    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Invalid products array' },
        { status: 400 }
      );
    }

    // Use batch operation for efficiency
    const { duration } = await monitoredQuery(
      `Batch create ${products.length} products`,
      async () => {
        const startTime = Date.now();
        const db = await getDb();
        const now = new Date();
        const productsWithTimestamps = products.map(product => ({
          ...product,
          createdAt: now,
          updatedAt: now,
        }));
        await db.collection('products').insertMany(productsWithTimestamps);
        return { duration: Date.now() - startTime };
      },
      'create'
    );

    return NextResponse.json(
      {
        success: true,
        message: `${products.length} products created`,
        count: products.length,
        duration,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Error handling middleware
 */
export async function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const status = 500;

  console.error(`API Error: ${message}`);

  return {
    success: false,
    error: message,
    status,
  };
}
