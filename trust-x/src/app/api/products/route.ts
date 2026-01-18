/**
 * Products API Route - CRUD Operations
 * GET /api/products - Retrieve all products with pagination
 * POST /api/products - Create a new product
 */

import { NextRequest } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { sendSuccess, sendError } from '../../../lib/responseHandler';
import { ERROR_CODES } from '../../../lib/errorCodes';
import { productCreateSchema, ProductCreateInput } from '../../../lib/schemas/productSchema';
import { ZodError } from 'zod';

// GET: Retrieve all products with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Number(searchParams.get('limit')) || 10);
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const skip = (page - 1) * limit;

    // Build MongoDB filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const db = await getDb();
    const productsCollection = db.collection('products');

    // Fetch products and total count
    const [productsResult, total] = await Promise.all([
      productsCollection
        .find(filter)
        .project({
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          stock: 1,
          sku: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      productsCollection.countDocuments(filter),
    ]);

    // Map _id to id
    const products = productsResult.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      createdAt: product.createdAt,
    }));

    return sendSuccess(
      {
        items: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Products fetched successfully',
      200
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('GET /api/products error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
  }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let validated: ProductCreateInput;
    try {
      validated = productCreateSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }));
        return sendError('Validation Error', ERROR_CODES.VALIDATION_ERROR, 400, details);
      }
      throw err;
    }

    const db = await getDb();
    const productsCollection = db.collection('products');

    // Check if SKU is unique (if provided)
    if (validated.sku) {
      const existingProduct = await productsCollection.findOne({ sku: validated.sku });
      if (existingProduct) {
        return sendError('SKU already exists', ERROR_CODES.VALIDATION_ERROR, 409);
      }
    }

    // Create product with timestamps
    const now = new Date();
    const productData = {
      name: validated.name,
      description: validated.description || '',
      price: validated.price,
      stock: validated.stock,
      sku: validated.sku || `SKU-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const result = await productsCollection.insertOne(productData);

    const product = {
      id: result.insertedId.toString(),
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      sku: productData.sku,
      createdAt: productData.createdAt,
    };

    return sendSuccess(product, 'Product created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('POST /api/products error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
  }
}
