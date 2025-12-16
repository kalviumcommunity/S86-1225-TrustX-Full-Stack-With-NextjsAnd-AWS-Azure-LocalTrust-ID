/**
 * Product by ID API Route - Get, Update, Delete
 * GET /api/products/[id] - Retrieve a specific product
 * PUT /api/products/[id] - Update a product
 * DELETE /api/products/[id] - Delete a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

type RouteParams = {
  params: {
    id: string;
  };
};

// GET: Retrieve a specific product by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const productId = Number(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: {
          select: { id: true, warehouseLocation: true, quantity: true },
          take: 5,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: product },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT: Update a product
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const productId = Number(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, description, price, stock, sku } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // If SKU is being updated, check uniqueness
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: { sku, id: { not: productId } },
      });
      if (skuExists) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(sku && { sku }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        sku: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    console.error('PUT /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a product
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const productId = Number(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
