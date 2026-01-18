/**
 * Order by ID API Route - Get, Update, Delete
 * GET /api/orders/[id] - Retrieve a specific order
 * PATCH /api/orders/[id] - Update order status
 * DELETE /api/orders/[id] - Delete an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, ObjectId } from '../../../../lib/mongodb';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Retrieve a specific order by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const ordersCollection = db.collection('orders');
    const orderItemsCollection = db.collection('orderItems');
    const paymentsCollection = db.collection('payments');

    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch related items and payments
    const [items, payments] = await Promise.all([
      orderItemsCollection.find({ orderId: new ObjectId(id) }).toArray(),
      paymentsCollection.find({ orderId: new ObjectId(id) }).toArray(),
    ]);

    const orderResponse = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: order.userId.toString(),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: items.map((item) => ({
        id: item._id.toString(),
        productId: item.productId.toString(),
        quantity: item.quantity,
        price: item.price,
      })),
      payments: payments.map((payment) => ({
        id: payment._id.toString(),
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
    };

    return NextResponse.json(
      { success: true, data: orderResponse },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH: Update order status
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const ordersCollection = db.collection('orders');

    // Check if order exists
    const existingOrder = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    const updatedOrder = await ordersCollection.findOne({ _id: new ObjectId(id) });

    const orderResponse = {
      id: updatedOrder!._id.toString(),
      orderNumber: updatedOrder!.orderNumber,
      status: updatedOrder!.status,
      totalAmount: updatedOrder!.totalAmount,
      updatedAt: updatedOrder!.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Order status updated successfully',
        data: orderResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    console.error('PATCH /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE: Delete an order
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const ordersCollection = db.collection('orders');
    const orderItemsCollection = db.collection('orderItems');
    const paymentsCollection = db.collection('payments');

    // Check if order exists
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete order and related items and payments (manual cascade)
    await Promise.all([
      ordersCollection.deleteOne({ _id: new ObjectId(id) }),
      orderItemsCollection.deleteMany({ orderId: new ObjectId(id) }),
      paymentsCollection.deleteMany({ orderId: new ObjectId(id) }),
    ]);

    return NextResponse.json(
      { success: true, message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete order';
    console.error('DELETE /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
