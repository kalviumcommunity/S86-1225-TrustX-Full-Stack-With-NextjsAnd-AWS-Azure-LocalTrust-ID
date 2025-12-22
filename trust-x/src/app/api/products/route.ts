/**
 * Products API Route - CRUD Operations
 * GET /api/products - Retrieve all products with pagination
 * POST /api/products - Create a new product
 */

import { NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
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

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = Number(minPrice);
      if (maxPrice) whereClause.price.lte = Number(maxPrice);
    }

    // Fetch products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          sku: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

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

    // Check if SKU is unique (if provided)
    if (validated.sku) {
      const existingProduct = await prisma.product.findFirst({ where: { sku: validated.sku } });
      if (existingProduct) {
        return sendError('SKU already exists', ERROR_CODES.VALIDATION_ERROR, 409);
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: validated.name,
        description: validated.description || '',
        price: validated.price,
        stock: validated.stock,
        sku: validated.sku || `SKU-${Date.now()}`,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        sku: true,
        createdAt: true,
      },
    });

    return sendSuccess(product, 'Product created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('POST /api/products error:', error);
    return sendError(message, ERROR_CODES.INTERNAL_ERROR, 500, error);
  }
}
