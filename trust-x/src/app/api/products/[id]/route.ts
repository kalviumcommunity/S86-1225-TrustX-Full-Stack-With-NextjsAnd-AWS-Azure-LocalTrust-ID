/**
 * Product by ID API Route - Get, Update, Delete
 * GET /api/products/[id] - Retrieve a specific product
 * PUT /api/products/[id] - Update a product
 * DELETE /api/products/[id] - Delete a product
 */

import { NextRequest } from 'next/server';
import { getDb, ObjectId } from '../../../../lib/mongodb';
import { sendSuccess, sendError } from '../../../../lib/responseHandler';
import { ERROR_CODES } from '../../../../lib/errorCodes';
import { productUpdateSchema, ProductUpdateInput } from '../../../../lib/schemas/productSchema';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET: Retrieve a specific product by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return sendError('Invalid product ID', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const db = await getDb();
    const productsCollection = db.collection('products');
    const inventoryCollection = db.collection('inventory');

    const product = await productsCollection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return sendError('Product not found', ERROR_CODES.NOT_FOUND, 404);
    }

    // Fetch inventory if exists
    const inventory = await inventoryCollection.findOne({ productId: new ObjectId(id) });

    const productResponse = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      inventory: inventory ? {
        id: inventory._id.toString(),
        warehouseLocation: inventory.warehouseLocation,
        reorderLevel: inventory.reorderLevel,
      } : null,
    };

    return sendSuccess(productResponse, 'Product fetched successfully', 200);
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
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return sendError('Invalid product ID', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const body = await req.json();
    let validated: ProductUpdateInput;
    try {
      validated = productUpdateSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return sendError('Validation Error', ERROR_CODES.VALIDATION_ERROR, 400, details);
      }
      throw err;
    }

    const db = await getDb();
    const productsCollection = db.collection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) });

    if (!existingProduct) {
      return sendError('Product not found', ERROR_CODES.NOT_FOUND, 404);
    }

    // If SKU is being updated, check uniqueness
    if (validated.sku && validated.sku !== existingProduct.sku) {
      const skuExists = await productsCollection.findOne({ 
        sku: validated.sku, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (skuExists) {
        return sendError('SKU already exists', ERROR_CODES.VALIDATION_ERROR, 409);
      }
    }

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validated.name) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.stock !== undefined) updateData.stock = validated.stock;
    if (validated.sku) updateData.sku = validated.sku;

    // Update product
    await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(id) });

    const productResponse = {
      id: updatedProduct!._id.toString(),
      name: updatedProduct!.name,
      description: updatedProduct!.description,
      price: updatedProduct!.price,
      stock: updatedProduct!.stock,
      sku: updatedProduct!.sku,
      updatedAt: updatedProduct!.updatedAt,
    };

    return sendSuccess(productResponse, 'Product updated successfully', 200);
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
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return sendError('Invalid product ID', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const db = await getDb();
    const productsCollection = db.collection('products');

    // Check if product exists
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return sendError('Product not found', ERROR_CODES.NOT_FOUND, 404);
    }

    // Delete product
    await productsCollection.deleteOne({ _id: new ObjectId(id) });

    return sendSuccess(null, 'Product deleted successfully', 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    console.error('DELETE /api/products/[id] error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
  }
}
