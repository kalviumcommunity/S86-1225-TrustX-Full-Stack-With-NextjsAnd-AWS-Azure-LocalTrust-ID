/**
 * Orders API Route - CRUD Operations with Transactions
 * GET /api/orders - Retrieve all orders with pagination
 * POST /api/orders - Create a new order (uses transaction)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { processOrderTransaction } from '../../../lib/transactions';

// GET: Retrieve all orders with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = Number(userId);

    // Fetch orders and total count
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: {
            select: { id: true, productId: true, quantity: true, price: true },
            take: 5,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST: Create a new order with transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, quantity } = body;

    // Validate required fields
    if (!userId || !productId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'userId, productId, and quantity are required' },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (isNaN(userId) || isNaN(productId) || isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid input values' },
        { status: 400 }
      );
    }

    // Use transaction to create order
    const result = await processOrderTransaction(
      Number(userId),
      Number(productId),
      Number(quantity)
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
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
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
