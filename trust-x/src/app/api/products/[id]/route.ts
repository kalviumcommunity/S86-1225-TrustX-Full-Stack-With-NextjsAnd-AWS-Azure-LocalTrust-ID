/**
 * Product by ID API Route - Get, Update, Delete
 * GET /api/products/[id] - Retrieve a specific product
 * PUT /api/products/[id] - Update a product
 * DELETE /api/products/[id] - Delete a product
 */

import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendSuccess, sendError } from '../../../../lib/responseHandler';
import { ERROR_CODES } from '../../../../lib/errorCodes';
import { productUpdateSchema } from '../../../../lib/schemas/productSchema';
import { ZodError } from 'zod';

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
      return sendError('Invalid product ID', ERROR_CODES.VALIDATION_ERROR, 400);
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
      return sendError('Product not found', ERROR_CODES.NOT_FOUND, 404);
    }

    return sendSuccess(product, 'Product fetched successfully', 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    console.error('GET /api/products/[id] error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
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
      return sendError('Invalid product ID', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const body = await req.json();
    let validated: any;
    try {
      validated = productUpdateSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return sendError('Validation Error', ERROR_CODES.VALIDATION_ERROR, 400, details);
      }
      throw err;
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return sendError('Product not found', ERROR_CODES.NOT_FOUND, 404);
    }

    // If SKU is being updated, check uniqueness
    if (validated.sku && validated.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({ where: { sku: validated.sku, id: { not: productId } } });
      if (skuExists) {
        return sendError('SKU already exists', ERROR_CODES.VALIDATION_ERROR, 409);
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.price !== undefined && { price: validated.price }),
        ...(validated.stock !== undefined && { stock: validated.stock }),
        ...(validated.sku && { sku: validated.sku }),
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

    return sendSuccess(updatedProduct, 'Product updated successfully', 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    console.error('PUT /api/products/[id] error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
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
      return sendError('Invalid product ID', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return sendError('Product not found', ERROR_CODES.NOT_FOUND, 404);
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return sendSuccess(null, 'Product deleted successfully', 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    console.error('DELETE /api/products/[id] error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
  }
}
